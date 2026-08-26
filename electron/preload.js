const { contextBridge, ipcRenderer } = require('electron');

// Secure bridge exposing only safe desktop APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app-get-version'),
  
  // Optional native file export/import
  saveExportFile: (data) => ipcRenderer.invoke('save-export-file', data),
  openImportFile: () => ipcRenderer.invoke('open-import-file'),
  
  // Event listeners for window state
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window-state-change', (_event, state) => callback(state));
  }
});
