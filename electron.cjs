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
 * Recursively copy a directory, handling ASAR transparently.
 * Node's fs module can read from ASAR, so we just read + write to real fs.
 */
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Create or reuse a Remotion webpack bundle.
 * 
 * In production, the app is packaged inside an ASAR archive (read-only).
 * The Remotion bundler internally does chdir() to the entry point's directory,
 * which fails inside ASAR. Solution: copy all needed source files to a writable
 * temp directory and bundle from there.
 */
async function getOrCreateBundle() {
  if (cachedBundlePath) return cachedBundlePath;

  const appDir = __dirname;
  const isPackaged = app.isPackaged;
  
  // Point esbuild to the unpacked binary so it can spawn outside ASAR
  if (isPackaged) {
    const unpackedDir = appDir.replace('app.asar', 'app.asar.unpacked');
    process.env.ESBUILD_BINARY_PATH = path.join(
      unpackedDir, 'node_modules', '@esbuild', 'win32-x64', 'esbuild.exe'
    );
    console.log('[Remotion] ESBUILD_BINARY_PATH:', process.env.ESBUILD_BINARY_PATH);
  }

  const { bundle } = require('@remotion/bundler');

  // Create a writable workspace for Remotion bundler
  const remotionWorkDir = path.join(os.tmpdir(), 'socialmock-remotion-workspace');
  
  // Clean and recreate to ensure fresh files
  if (fs.existsSync(remotionWorkDir)) {
    fs.rmSync(remotionWorkDir, { recursive: true, force: true });
  }
  fs.mkdirSync(remotionWorkDir, { recursive: true });

  // Copy all source files needed for Remotion bundling from ASAR to temp dir
  const filesToCopy = [
    'remotion.index.ts',
    'remotion-env.d.ts',
    'RemotionRoot.tsx',
    'types.ts',
    'tsconfig.json',
    'package.json',
  ];
  
  for (const file of filesToCopy) {
    const src = path.join(appDir, file);
    const dest = path.join(remotionWorkDir, file);
    try {
      fs.copyFileSync(src, dest);
    } catch (e) {
      console.warn(`[Remotion] Could not copy ${file}:`, e.message);
    }
  }

  // Copy component directories
  const dirsToCopy = ['components'];
  for (const dir of dirsToCopy) {
    const src = path.join(appDir, dir);
    const dest = path.join(remotionWorkDir, dir);
    try {
      copyDirSync(src, dest);
    } catch (e) {
      console.warn(`[Remotion] Could not copy ${dir}/:`, e.message);
    }
  }

  // Create node_modules symlink — point to ASAR node_modules (readable by webpack).
  // ASAR is read-only for chdir/spawn but webpack can read files from it just fine.
  const asarNodeModules = path.join(appDir, 'node_modules');
  const unpackedNodeModules = isPackaged
    ? path.join(appDir.replace('app.asar', 'app.asar.unpacked'), 'node_modules')
    : null;
  const workNodeModules = path.join(remotionWorkDir, 'node_modules');
  
  try {
    // Use junction on Windows (doesn't require admin privileges)
    fs.symlinkSync(asarNodeModules, workNodeModules, 'junction');
    console.log('[Remotion] Symlinked node_modules from:', asarNodeModules);
  } catch (e) {
    console.warn('[Remotion] Symlink failed:', e.message);
  }

  // Generate remotion-styles.css from pre-compiled Vite CSS
  const distAssetsDir = path.join(appDir, 'dist', 'assets');
  const remotionStylesPath = path.join(remotionWorkDir, 'remotion-styles.css');
  
  try {
    const cssFiles = fs.readdirSync(distAssetsDir).filter(f => f.endsWith('.css'));
    if (cssFiles.length > 0) {
      let cssContent = cssFiles
        .map(f => fs.readFileSync(path.join(distAssetsDir, f), 'utf8'))
        .join('\n');
      
      // Rewrite relative font URLs to absolute file:// paths
      const absoluteAssetsDir = distAssetsDir.replace(/\\/g, '/');
      cssContent = cssContent.replace(
        /url\(\.\/([\w.-]+\.woff2?)\)/g,
        `url(file:///${absoluteAssetsDir}/$1)`
      );
      
      // Strip ALL background/background-color from body rule in compiled CSS
      // The Vite build sets body { background-color: #e8edf4 } which makes
      // the Remotion render page opaque, preventing MOV alpha transparency.
      cssContent = cssContent.replace(/background-color\s*:\s*#e8edf4/g, 'background-color:transparent');
      cssContent = cssContent.replace(/overflow\s*:\s*hidden/g, 'overflow:visible');
      
      // Prepend a high-specificity transparent override as safety net
      const transparentCSS = `
html, body, html body, body.remotion-preview, #root, #remotion-canvas, #container, div[data-remotion-canvas], #__remotion_frame {
  background: transparent !important;
  background-color: transparent !important;
}
`;
      cssContent = transparentCSS + cssContent;
      
      fs.writeFileSync(remotionStylesPath, cssContent);
      console.log('[Remotion] CSS written to:', remotionStylesPath);
    } else {
      fs.writeFileSync(remotionStylesPath, '');
      console.warn('[Remotion] No CSS files found in dist/assets');
    }
  } catch (e) {
    console.warn('[Remotion] Could not generate CSS:', e.message);
    fs.writeFileSync(remotionStylesPath, '');
  }

  // Bundle from the writable temp directory
  const entryPoint = path.join(remotionWorkDir, 'remotion.index.ts');
  console.log('[Remotion] Bundling from workspace:', remotionWorkDir);

  // Build resolve.modules list: workspace first, then ASAR (all packages), then unpacked (native binaries)
  const resolveModules = ['node_modules'];
  resolveModules.push(asarNodeModules);
  if (unpackedNodeModules) resolveModules.push(unpackedNodeModules);

  cachedBundlePath = await bundle({
    entryPoint,
    webpackOverride: (config) => {
      return {
        ...config,
        module: {
          ...config.module,
          rules: [
            ...(config.module?.rules || []),
            {
              test: /\.(woff|woff2|eot|ttf|otf)$/,
              type: 'asset/resource',
            },
          ],
        },
        resolve: {
          ...config.resolve,
          modules: resolveModules,
          alias: {
            ...(config.resolve?.alias || {}),
            '@': remotionWorkDir,
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

    // Resolve Remotion compositor binaries from unpacked path (not ASAR)
    const binariesDirectory = app.isPackaged
      ? path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), 
          'node_modules', '@remotion', 'compositor-win32-x64-msvc')
      : null;

    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: 'SocialMock',
      inputProps: { config },
      ...(binariesDirectory && { binariesDirectory }),
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
      imageFormat: isMov ? 'png' : 'jpeg',
      ...(electronChromiumPath && { browserExecutable: electronChromiumPath }),
      ...(binariesDirectory && { binariesDirectory }),
      ...(isMov && { 
        chromiumOptions: { 
          gl: 'angle',
        },
      }),
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
