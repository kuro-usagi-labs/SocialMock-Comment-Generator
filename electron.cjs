const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
try {
  if (require('electron-squirrel-startup')) {
    app.quit();
  }
} catch (e) {
  // electron-squirrel-startup not available, ignore
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SocialMock - Comment Generator',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#f3f4f6',
  });

  // Remove default menu bar for cleaner look
  Menu.setApplicationMenu(null);

  // Load the built React app
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Cache the Remotion bundle path so we only bundle once per session
let cachedBundlePath = null;

/**
 * Create or reuse a Remotion webpack bundle.
 * This is the composition entry point that renderMedia() will use.
 * 
 * In production (ASAR), __dirname is read-only. We write generated files
 * to a temp directory and use webpack aliases to resolve imports.
 */
async function getOrCreateBundle() {
  if (cachedBundlePath) return cachedBundlePath;

  const { bundle } = require('@remotion/bundler');
  
  // In production ASAR, __dirname points inside the archive (read-only).
  // We need the unpacked path for reading, and a temp dir for writing.
  const appDir = __dirname;
  const unpackedDir = app.isPackaged 
    ? appDir.replace('app.asar', 'app.asar.unpacked') 
    : appDir;
  
  const entryPoint = path.join(appDir, 'remotion.index.ts');

  // Create a writable temp directory for generated files
  const remotionTmpDir = path.join(os.tmpdir(), 'socialmock-remotion');
  if (!fs.existsSync(remotionTmpDir)) {
    fs.mkdirSync(remotionTmpDir, { recursive: true });
  }

  // Copy pre-compiled CSS from Vite build output
  // Rewrite font URLs to absolute paths so they resolve in Remotion's headless browser
  const distAssetsDir = path.join(appDir, 'dist', 'assets');
  const remotionStylesPath = path.join(remotionTmpDir, 'remotion-styles.css');
  
  try {
    // Read CSS from dist (inside ASAR is fine for reading)
    const cssFiles = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      let cssContent = cssFiles
        .map(f => fs.readFileSync(path.join(distAssetsDir, f), 'utf8'))
        .join('\n');
      
      // Rewrite relative font URLs to absolute file:// paths
      // In ASAR, the dist/assets dir is still readable for fonts
      const absoluteAssetsDir = distAssetsDir.replace(/\\/g, '/');
      cssContent = cssContent.replace(
        /url\(\.\/([\w.-]+\.woff2?)\)/g,
        `url(file:///${absoluteAssetsDir}/$1)`
      );
      
      fs.writeFileSync(remotionStylesPath, cssContent);
      console.log('[Remotion] CSS written to:', remotionStylesPath);
    } else {
      fs.writeFileSync(remotionStylesPath, '/* No pre-compiled CSS found */');
      console.warn('[Remotion] No CSS files found in dist/assets');
    }
  } catch (e) {
    console.warn('[Remotion] Could not copy CSS:', e.message);
    // Write a minimal empty CSS so the import doesn't fail
    fs.writeFileSync(remotionStylesPath, '/* CSS copy failed */');
  }

  console.log('[Remotion] Bundling entry point:', entryPoint);
  cachedBundlePath = await bundle({
    entryPoint,
    webpackOverride: (config) => {
      return {
        ...config,
        module: {
          ...config.module,
          rules: [
            ...(config.module?.rules || []),
            // Handle font files (woff2, etc.) used by @fontsource
            {
              test: /\.(woff|woff2|eot|ttf|otf)$/,
              type: 'asset/resource',
            },
          ],
        },
        resolve: {
          ...config.resolve,
          alias: {
            ...(config.resolve?.alias || {}),
            '@': appDir,
            // Map the CSS import to the temp file we wrote
            './remotion-styles.css': remotionStylesPath,
          },
        },
      };
    },
  });
  console.log('[Remotion] Bundle created at:', cachedBundlePath);
  return cachedBundlePath;
}

/**
 * Main video render handler using Remotion's native renderMedia().
 * Replaces the old frame-by-frame screenshot pipeline.
 */
ipcMain.handle('render-video', async (event, options) => {
  if (!mainWindow) return { success: false, error: 'No main window' };

  const { config, format = 'mp4', fps = 60, durationInFrames = 120 } = options;
  const isMov = format === 'mov';

  // Ask user where to save
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: `Save Animation ${format.toUpperCase()}`,
    defaultPath: `socialmock-animation.${format}`,
    filters: [{ 
      name: isMov ? 'QuickTime Videos' : 'Videos', 
      extensions: [format] 
    }]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  try {
    const { renderMedia, selectComposition } = require('@remotion/renderer');

    // Step 1: Bundle the Remotion project
    mainWindow.webContents.send('render-progress', { 
      progress: 0, 
      stage: 'Bundling Remotion project...' 
    });
    const bundlePath = await getOrCreateBundle();

    // Step 2: Select the composition
    mainWindow.webContents.send('render-progress', { 
      progress: 0.05, 
      stage: 'Preparing composition...' 
    });

    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: 'SocialMock',
      inputProps: { config },
    });

    // Override composition settings with user's config
    const compositionWithOverrides = {
      ...composition,
      fps,
      durationInFrames,
      width: config.width || 1080,
      height: config.width || 1080, // square by default
    };

    // Step 3: Render the video
    mainWindow.webContents.send('render-progress', { 
      progress: 0.1, 
      stage: 'Rendering frames...' 
    });

    // Determine codec and pixel format
    let codec, pixelFormat, proresProfile;
    if (isMov) {
      codec = 'prores';
      proresProfile = '4444';
      pixelFormat = 'yuva444p10le';
    } else {
      codec = 'h264';
      pixelFormat = 'yuv420p';
    }

    // Use Electron's embedded Chromium for rendering (saves ~150MB download)
    const electronChromiumPath = getElectronChromiumPath();

    await renderMedia({
      composition: compositionWithOverrides,
      serveUrl: bundlePath,
      codec,
      outputLocation: filePath,
      inputProps: { config },
      ...(isMov && { proresProfile }),
      pixelFormat,
      ...(electronChromiumPath && { browserExecutable: electronChromiumPath }),
      onProgress: ({ progress }) => {
        // progress is 0-1
        const overallProgress = 0.1 + progress * 0.85;
        mainWindow.webContents.send('render-progress', {
          progress: overallProgress,
          stage: `Rendering... ${Math.round(progress * 100)}%`,
        });
      },
    });

    mainWindow.webContents.send('render-progress', { 
      progress: 1, 
      stage: 'Done!' 
    });

    return { success: true, filePath };
  } catch (error) {
    console.error('[Remotion] Render error:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Try to find Electron's embedded Chromium executable.
 * This avoids Remotion downloading its own copy of Chrome.
 */
function getElectronChromiumPath() {
  try {
    // In development, use system Chrome or let Remotion find it
    if (!app.isPackaged) {
      return undefined; // Let Remotion use its own browser finding logic
    }

    // In production (packaged), try to find Electron's Chromium
    // The path varies by platform
    const electronPath = process.execPath;
    if (process.platform === 'win32') {
      // On Windows, Electron bundles chrome as the exe itself
      // But we can't use it directly for Remotion. Let Remotion find Chrome.
      return undefined;
    }
    return undefined;
  } catch (e) {
    console.warn('[Remotion] Could not find Electron Chromium, using default:', e.message);
    return undefined;
  }
}

// ============================================================================
// Legacy IPC handlers (kept for backward compatibility during transition)
// These will be removed in a future update.
// ============================================================================
let legacyTempDir = '';
let ffmpeg;
try {
  ffmpeg = require('ffmpeg-static');
  if (ffmpeg && ffmpeg.includes('app.asar')) {
    ffmpeg = ffmpeg.replace('app.asar', 'app.asar.unpacked');
  }
} catch (e) {
  // ffmpeg-static not available
}

ipcMain.handle('start-video-export', async () => {
  legacyTempDir = path.join(os.tmpdir(), `socialmock-${Date.now()}`);
  if (!fs.existsSync(legacyTempDir)) {
    fs.mkdirSync(legacyTempDir, { recursive: true });
  }
  return true;
});

ipcMain.handle('send-frame', async (event, frameIndex, dataUrl) => {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const framePath = path.join(legacyTempDir, `frame_${String(frameIndex).padStart(4, '0')}.png`);
  fs.writeFileSync(framePath, base64Data, 'base64');
  return true;
});

ipcMain.handle('finish-video', async (event, format = 'mp4') => {
  if (!mainWindow) return { success: false, error: 'No main window' };
  if (!ffmpeg) return { success: false, error: 'FFmpeg not available' };

  const { execFile } = require('child_process');
  const exportFormat = format === 'mov' ? 'mov' : 'mp4';
  const isMov = exportFormat === 'mov';
  
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: `Save Animation ${exportFormat.toUpperCase()}`,
    defaultPath: `socialmock-animation.${exportFormat}`,
    filters: [{ name: isMov ? 'QuickTime Videos' : 'Videos', extensions: [exportFormat] }]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  return new Promise((resolve) => {
    const inputArgs = [
      '-y',
      '-framerate', '60',
      '-i', path.join(legacyTempDir, 'frame_%04d.png'),
    ];
    const outputArgs = isMov ? [
      '-c:v', 'prores_ks',
      '-profile:v', '4444',
      '-pix_fmt', 'yuva444p10le',
      '-alpha_bits', '16',
      '-vendor', 'apl0',
      filePath
    ] : [
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      filePath
    ];
    const args = [...inputArgs, ...outputArgs];

    execFile(ffmpeg, args, (error, stdout, stderr) => {
      fs.rmSync(legacyTempDir, { recursive: true, force: true });
      
      if (error) {
        console.error('FFMPEG Error:', error, stderr);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, filePath });
      }
    });
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
