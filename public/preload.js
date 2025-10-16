const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  // File dialog methods
  showOpenDialog: (options) => ipcRenderer.invoke("show-open-dialog", options),
  showSaveDialog: (options) => ipcRenderer.invoke("show-save-dialog", options),

  // App path methods
  getAppPath: (name) => ipcRenderer.invoke("get-app-path", name),

  // Menu event listeners
  onMenuNewProject: (callback) => ipcRenderer.on("menu-new-project", callback),
  onMenuOpenProject: (callback) =>
    ipcRenderer.on("menu-open-project", callback),
  onMenuImportData: (callback) => ipcRenderer.on("menu-import-data", callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke("window-minimize"),
  maximizeWindow: () => ipcRenderer.invoke("window-maximize"),
  closeWindow: () => ipcRenderer.invoke("window-close"),
});
