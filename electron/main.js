import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false, // Frameless custom glass window
    titleBarStyle: 'hidden',
    backgroundColor: '#090d16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false
    },
    show: false
  });

  // Load either local file or dev server
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production build or packaged app
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../index.html'));
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-state-change', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-state-change', 'unmaximized');
  });
}

// Window control IPC handlers
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle('app-get-version', () => {
  return app.getVersion();
});

ipcMain.handle('save-export-file', async (_event, jsonData) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export LiquidType Data',
    defaultPath: `liquidtype-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON Data', extensions: ['json'] }]
  });

  if (!result.canceled && result.filePath) {
    fs.writeFileSync(result.filePath, jsonData, 'utf-8');
    return { success: true, filePath: result.filePath };
  }
  return { success: false, canceled: true };
});

ipcMain.handle('open-import-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Import LiquidType Data',
    properties: ['openFile'],
    filters: [{ name: 'JSON Data', extensions: ['json'] }]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const data = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, data };
  }
  return { success: false, canceled: true };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
