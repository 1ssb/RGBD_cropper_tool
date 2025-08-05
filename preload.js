const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs').promises;
const { dialog } = require('@electron/remote');

contextBridge.exposeInMainWorld('fs', {
  readFile: async (path) => await fs.readFile(path),
  saveFile: async (buffer, filename) => await fs.writeFile(filename, Buffer.from(buffer)),
  chooseDirectory: async () => {
    // This is a placeholder. For a real Electron app, use ipcRenderer.invoke to main process for dialog.showOpenDialog
    return null;
  }
});
