const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  startVideoExport: () => ipcRenderer.invoke('start-video-export'),
  sendFrame: (frameIndex, dataUrl) => ipcRenderer.invoke('send-frame', frameIndex, dataUrl),
  finishVideo: () => ipcRenderer.invoke('finish-video'),
});
