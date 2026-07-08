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
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

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

function getEnvValue(name) {
  if (process.env[name]) return process.env[name];
  const envPaths = [
    path.join(__dirname, '.env'),
    path.join(process.cwd(), '.env'),
  ];
  for (const envPath of envPaths) {
    try {
      if (!fs.existsSync(envPath)) continue;
      const content = fs.readFileSync(envPath, 'utf8');
      const line = content.split(/\r?\n/).find(entry => entry.trim().startsWith(`${name}=`));
      if (!line) continue;
      return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    } catch (e) {
      console.warn(`[Env] Could not read ${envPath}:`, e.message);
    }
  }
  return '';
}

function buildGeminiPrompt({ baseText, count, language, tone }) {
  const langLabel = language === 'id' ? 'Bahasa Indonesia' : 'English';
  const toneDesc = {
    casual: 'santai dan natural, seperti chat biasa antar teman',
    formal: 'sopan dan formal, seperti chat profesional',
    slang: 'gaul, pakai bahasa slang/singkatan anak muda',
  };

  return `Kamu adalah generator variasi kalimat untuk DM (Direct Message) media sosial.

Tugas: Buatkan ${count} variasi kalimat DM yang maknanya sama atau mirip dengan "${baseText}".

Aturan:
- Bahasa: ${langLabel}
- Gaya bahasa: ${toneDesc[tone] || toneDesc.casual}
- Setiap variasi harus berbeda satu sama lain (jangan ada yang sama persis)
- Panjang kalimat bervariasi (ada yang pendek, ada yang lebih panjang)
- Boleh pakai emoji tapi jangan berlebihan (1-2 emoji per kalimat, atau tanpa emoji)
- Kalimat harus terdengar natural seperti pesan DM asli dari orang sungguhan
- Jangan beri nomor atau bullet point

PENTING: Balas HANYA dalam format JSON array of strings, tanpa penjelasan apapun.
Contoh format: ["variasi 1", "variasi 2", "variasi 3"]`;
}

function parseGeminiStringArray(text, count) {
  let cleanedText = String(text || '').trim();
  if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(cleanedText);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed.slice(0, count);
    }
  } catch (e) {
    const matches = cleanedText.match(/"([^"]+)"/g);
    if (matches && matches.length > 0) {
      return matches.map(item => item.replace(/"/g, '')).slice(0, count);
    }
  }

  throw new Error('Could not parse AI response into messages');
}

async function generateVariationsWithGemini(params) {
  const apiKey = getEnvValue('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Add it to .env or your environment.');
  }

  const baseText = String(params?.baseText || '').trim();
  const count = Math.min(20, Math.max(1, Number(params?.count) || 5));
  const language = params?.language === 'en' ? 'en' : 'id';
  const tone = ['casual', 'formal', 'slang'].includes(params?.tone) ? params.tone : 'casual';
  if (!baseText) {
    throw new Error('Base text is required.');
  }

  const prompt = buildGeminiPrompt({ baseText, count, language, tone });
  let delay = 2000;
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 1.0,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No response from Gemini API');
      return parseGeminiStringArray(text, count);
    }

    const errorBody = await response.text();
    lastError = new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    if (response.status !== 429 || attempt === 2) {
      console.error('[Gemini] API error:', errorBody);
      throw lastError;
    }

    console.warn(`[Gemini] 429 error. Retrying in ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    delay *= 2;
  }

  throw lastError || new Error('Gemini API error');
}

function cloneConfigWithTransparentBackground(config) {
  return {
    ...config,
    greenscreen: false,
    backgroundType: 'transparent',
    canvas: {
      ...config.canvas,
      layers: (config.canvas?.layers || []).map(layer =>
        layer.type === 'background' ? { ...layer, visible: false } : layer
      ),
    },
  };
}

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

  // Copy source directories used by Remotion components
  const dirsToCopy = ['components', 'utils'];
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
      
      // ── MOV Alpha Fix ──────────────────────────────────────────────
      // The compiled Vite CSS includes body { background-color: #e8edf4 }
      // which makes the Remotion headless page opaque, killing alpha.
      // ONLY strip body-level background — do NOT touch component backgrounds.
      
      // 1. Target specific body background colors from index.css
      cssContent = cssContent.replace(/background-color\s*:\s*#e8edf4/g, 'background-color:transparent');
      cssContent = cssContent.replace(/background-color\s*:\s*#f0f4f8/g, 'background-color:transparent');
      
      // 2. Remove overflow:hidden from body (prevents clipping)
      cssContent = cssContent.replace(/overflow\s*:\s*hidden/g, 'overflow:visible');
      
      // 3. Prepend transparent override ONLY for page-level containers
      const transparentCSS = `
/* Remotion alpha transparency override — page-level only */
html, body {
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

function getFfmpegPath(binariesDirectory) {
  try {
    let ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath && ffmpegPath.includes('app.asar')) {
      ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
    }
    if (ffmpegPath && fs.existsSync(ffmpegPath)) return ffmpegPath;
  } catch (e) {
    // ffmpeg-static is optional in some packaging contexts.
  }

  if (binariesDirectory) {
    const bundledPath = path.join(binariesDirectory, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
    if (fs.existsSync(bundledPath)) return bundledPath;
  }

  return null;
}

function getFfprobePath(ffmpegPath, binariesDirectory) {
  if (binariesDirectory) {
    const bundledPath = path.join(binariesDirectory, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
    if (fs.existsSync(bundledPath)) return bundledPath;
  }

  if (!ffmpegPath) return null;

  const parsed = path.parse(ffmpegPath);
  const siblingName = process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  const siblingPath = path.join(parsed.dir, siblingName);
  return fs.existsSync(siblingPath) ? siblingPath : null;
}

function execFileAsync(command, args) {
  const { execFile } = require('child_process');
  return new Promise((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function validateAlphaOutput(filePath, ffmpegPath, binariesDirectory, expectedPixelFormats) {
  const ffprobePath = getFfprobePath(ffmpegPath, binariesDirectory);
  if (!ffprobePath) {
    return {
      ok: false,
      warning: 'FFprobe not available; alpha pixel format was not validated.',
    };
  }

  const { stdout } = await execFileAsync(ffprobePath, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name,pix_fmt',
    '-of', 'default=noprint_wrappers=1:nokey=0',
    filePath,
  ]);

  const pixelFormat = stdout.match(/pix_fmt=([^\r\n]+)/)?.[1]?.trim() || '';
  const codecName = stdout.match(/codec_name=([^\r\n]+)/)?.[1]?.trim() || '';
  const ok = expectedPixelFormats.includes(pixelFormat);

  return {
    ok,
    codecName,
    pixelFormat,
    warning: ok ? undefined : `Expected alpha pixel format ${expectedPixelFormats.join(' or ')}, got ${pixelFormat || 'unknown'}.`,
  };
}

async function renderTransparentFrames({
  renderFrames,
  composition,
  serveUrl,
  inputProps,
  outputDir,
  browserExecutable,
  binariesDirectory,
  durationInFrames,
  onProgress,
}) {
  await renderFrames({
    composition,
    serveUrl,
    inputProps,
    imageFormat: 'png',
    outputDir,
    ...(browserExecutable && { browserExecutable }),
    ...(binariesDirectory && { binariesDirectory }),
    chromiumOptions: { gl: 'angle', disableWebSecurity: false },
    onFrameUpdate: (frame) => {
      onProgress(frame);
    },
  });

  const padLength = String(durationInFrames - 1).length;
  return `element-%0${padLength}d.png`;
}

/**
 * Main video render handler using Remotion's native renderMedia().
 * Replaces the old frame-by-frame screenshot pipeline.
 */
ipcMain.handle('generate-variations', async (event, params) => {
  try {
    return await generateVariationsWithGemini(params);
  } catch (error) {
    console.error('[Gemini] Generate variations failed:', error);
    throw error;
  }
});

ipcMain.handle('render-video', async (event, options) => {
  if (!mainWindow) return { success: false, error: 'No main window' };

  const { config, format = 'mp4', fps = 60, durationInFrames = 120 } = options;
  const isMov = format === 'mov';
  const isGif = format === 'gif';
  const isWebm = format === 'webm';
  const needsAlpha = isMov || isWebm;

  // File type filter labels
  const filterNames = {
    mp4: 'MP4 Videos',
    mov: 'QuickTime ProRes Videos',
    gif: 'Animated GIF',
    webm: 'WebM Videos (Alpha)',
  };

  // Ask user where to save
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: `Save Animation ${format.toUpperCase()}`,
    defaultPath: `socialmock-animation.${format}`,
    filters: [{ 
      name: filterNames[format] || 'Videos', 
      extensions: [format] 
    }]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  try {
    const { renderMedia, renderFrames, selectComposition } = require('@remotion/renderer');

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
    const renderConfig = needsAlpha
      ? cloneConfigWithTransparentBackground(config)
      : config;

    const composition = await selectComposition({
      serveUrl: bundlePath,
      id: 'SocialMock',
      inputProps: { config: renderConfig },
      ...(binariesDirectory && { binariesDirectory }),
    });

    // Override composition settings with user's config
    const compositionWithOverrides = {
      ...composition,
      fps,
      durationInFrames,
      width: renderConfig.width || 1080,
      height: renderConfig.height || renderConfig.width || 1080,
    };

    // Use Electron's embedded Chromium for rendering
    const electronChromiumPath = getElectronChromiumPath();

    // Step 3: Render
    mainWindow.webContents.send('render-progress', { 
      progress: 0.1, 
      stage: 'Rendering frames...' 
    });

    let alphaValidation = null;

    if (needsAlpha) {
      // ── MOV Alpha: renderFrames() + manual FFmpeg prores_ks ──
      // Remotion's renderMedia() loses alpha in ProRes encoding.
      // We render individual transparent PNG frames, then encode 
      // manually with FFmpeg using prores_ks which properly handles alpha.
      
      const framesDir = path.join(os.tmpdir(), `socialmock-frames-${Date.now()}`);
      fs.mkdirSync(framesDir, { recursive: true });

      const framePattern = await renderTransparentFrames({
        renderFrames,
        composition: compositionWithOverrides,
        serveUrl: bundlePath,
        inputProps: { config: renderConfig },
        outputDir: framesDir,
        browserExecutable: electronChromiumPath,
        binariesDirectory,
        durationInFrames,
        onProgress: (frame) => {
          const progress = 0.1 + (frame / durationInFrames) * 0.6;
          mainWindow.webContents.send('render-progress', {
            progress,
            stage: `Rendering frame ${frame + 1}/${durationInFrames}...`,
          });
        },
      });

      // Step 4: Encode PNGs → ProRes 4444 MOV with FFmpeg
      mainWindow.webContents.send('render-progress', { 
        progress: 0.75, 
        stage: isMov ? 'Encoding ProRes 4444 with alpha...' : 'Encoding VP9 WebM with alpha...' 
      });

      const ffmpegPath = getFfmpegPath(binariesDirectory);

      if (!ffmpegPath) {
        throw new Error('FFmpeg not available for alpha encoding');
      }

      // Encode with explicit alpha channel preservation
      // Remotion renderFrames outputs: element-000.png, element-001.png, etc.
      const ffmpegArgs = isMov
        ? [
          '-y',
          '-framerate', String(fps),
          '-i', path.join(framesDir, framePattern),
          '-c:v', 'prores_ks',
          '-profile:v', '4444',
          '-pix_fmt', 'yuva444p10le',
          '-alpha_bits', '16',
          '-vendor', 'apl0',
          '-bits_per_mb', '8000',
          '-an',
          filePath,
        ]
        : [
          '-y',
          '-framerate', String(fps),
          '-i', path.join(framesDir, framePattern),
          '-c:v', 'libvpx-vp9',
          '-pix_fmt', 'yuva420p',
          '-auto-alt-ref', '0',
          '-b:v', '0',
          '-crf', '30',
          '-an',
          filePath,
        ];

      try {
        await execFileAsync(ffmpegPath, ffmpegArgs);
      } catch (error) {
        console.error('[FFmpeg Alpha] Error:', error);
        throw new Error(`${isMov ? 'ProRes' : 'VP9 WebM'} alpha encode failed: ${error.message}`);
      } finally {
        try { fs.rmSync(framesDir, { recursive: true, force: true }); } catch (e) {}
      }

      mainWindow.webContents.send('render-progress', {
        progress: 0.92,
        stage: 'Validating alpha channel...'
      });

      alphaValidation = await validateAlphaOutput(
        filePath,
        ffmpegPath,
        binariesDirectory,
        isMov ? ['yuva444p10le'] : ['yuva420p']
      );

      if (!alphaValidation.ok) {
        console.warn('[Alpha Validation]', alphaValidation.warning);
      }

    } else {
      // ── Standard renderMedia for MP4, GIF, WebM ──
      let codec, pixelFormat, imageFormat;
      if (isGif) {
        codec = 'gif';
        pixelFormat = undefined;
        imageFormat = 'png';
      } else {
        // MP4
        codec = 'h264';
        pixelFormat = 'yuv420p';
        imageFormat = 'jpeg';
      }

      await renderMedia({
        composition: compositionWithOverrides,
        serveUrl: bundlePath,
        codec,
        outputLocation: filePath,
        inputProps: { config: renderConfig },
        ...(pixelFormat && { pixelFormat }),
        imageFormat,
        ...(isGif && { everyNthFrame: 2 }),
        ...(electronChromiumPath && { browserExecutable: electronChromiumPath }),
        ...(binariesDirectory && { binariesDirectory }),
        onProgress: ({ progress }) => {
          const overallProgress = 0.1 + progress * 0.85;
          mainWindow.webContents.send('render-progress', {
            progress: overallProgress,
            stage: `Rendering... ${Math.round(progress * 100)}%`,
          });
        },
      });
    }

    mainWindow.webContents.send('render-progress', { 
      progress: 1, 
      stage: 'Done!' 
    });

    return { success: true, filePath, alphaValidation };
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
