const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,

  // === New Remotion-based rendering API ===
  renderVideo: (options) => ipcRenderer.invoke('render-video', options),
  generateVariations: (params) => ipcRenderer.invoke('generate-variations', params),
  onRenderProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('render-progress', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('render-progress', handler);
  },

  // === Project File Persistence API ===
  projectOpen: () => ipcRenderer.invoke('project:open'),
  projectOpenPath: (filePath) => ipcRenderer.invoke('project:open-path', filePath),
  projectSave: (data) => ipcRenderer.invoke('project:save', data),
  projectSaveAs: (data) => ipcRenderer.invoke('project:save-as', data),
  projectGetRecent: () => ipcRenderer.invoke('project:recent'),
  projectSetDirty: (isDirty) => ipcRenderer.invoke('project:set-dirty', isDirty),
  projectAutosave: (data) => ipcRenderer.invoke('project:autosave', data),
  projectCheckAutosave: () => ipcRenderer.invoke('project:check-autosave'),
  projectLoadAutosave: () => ipcRenderer.invoke('project:load-autosave'),
  projectClearAutosave: () => ipcRenderer.invoke('project:clear-autosave'),
  projectCloseWindow: () => ipcRenderer.invoke('project:close-window'),
  onRequestSave: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('project:request-save', handler);
    return () => ipcRenderer.removeListener('project:request-save', handler);
  },
  onMenuAction: (callback) => {
    const channels = ['menu:new-project', 'menu:open', 'menu:save', 'menu:save-as', 'menu:export'];
    const handler = (_event, channel) => callback(channel);
    // We use a single listener pattern — main sends the channel name
    for (const channel of channels) {
      ipcRenderer.on(channel, () => callback(channel));
    }
    return () => {
      for (const channel of channels) {
        ipcRenderer.removeAllListeners(channel);
      }
    };
  },

  // === Asset Manager API ===
  assetImportFile: () => ipcRenderer.invoke('asset:import-file'),
  assetReadFileAsDataUrl: (filePath) => ipcRenderer.invoke('asset:read-file-as-data-url', filePath),

  // === Legacy API (backward compatibility) ===
  startVideoExport: () => ipcRenderer.invoke('start-video-export'),
  sendFrame: (frameIndex, dataUrl) => ipcRenderer.invoke('send-frame', frameIndex, dataUrl),
  finishVideo: (format = 'mp4') => ipcRenderer.invoke('finish-video', format),
});
