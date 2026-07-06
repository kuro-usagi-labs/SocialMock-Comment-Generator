const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  // === New Remotion-based rendering API ===
  renderVideo: (options) => ipcRenderer.invoke('render-video', options),
  onRenderProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('render-progress', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('render-progress', handler);
  },

  // === Legacy API (backward compatibility) ===
  startVideoExport: () => ipcRenderer.invoke('start-video-export'),
  sendFrame: (frameIndex, dataUrl) => ipcRenderer.invoke('send-frame', frameIndex, dataUrl),
  finishVideo: (format = 'mp4') => ipcRenderer.invoke('finish-video', format),
});
