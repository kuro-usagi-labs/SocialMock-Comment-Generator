const { contextBridge } = require('electron');

// Expose any APIs to the renderer process here if needed.
// For now, this is a minimal preload script for security.
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
});
