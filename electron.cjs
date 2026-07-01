const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');
let ffmpeg = require('ffmpeg-static');

// Fix ffmpeg path for production ASAR packaging
if (ffmpeg.includes('app.asar')) {
  ffmpeg = ffmpeg.replace('app.asar', 'app.asar.unpacked');
}

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

let tempDir = '';

ipcMain.handle('start-video-export', async () => {
  tempDir = path.join(os.tmpdir(), `socialmock-${Date.now()}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return true;
});

ipcMain.handle('send-frame', async (event, frameIndex, dataUrl) => {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const framePath = path.join(tempDir, `frame_${String(frameIndex).padStart(4, '0')}.png`);
  fs.writeFileSync(framePath, base64Data, 'base64');
  return true;
});

ipcMain.handle('finish-video', async (event) => {
  if (!mainWindow) return { success: false, error: 'No main window' };
  
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Animation MP4',
    defaultPath: 'socialmock-animation.mp4',
    filters: [{ name: 'Videos', extensions: ['mp4'] }]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  return new Promise((resolve) => {
    // Compile using ffmpeg
    const args = [
      '-y', // overwrite
      '-framerate', '60',
      '-i', path.join(tempDir, 'frame_%04d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      filePath
    ];

    execFile(ffmpeg, args, (error, stdout, stderr) => {
      // Clean up frames
      fs.rmSync(tempDir, { recursive: true, force: true });
      
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
