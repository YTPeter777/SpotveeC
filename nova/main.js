const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const stats = require('./lib/stats');
const organizer = require('./lib/organizer');

const dataFile = () => path.join(app.getPath('userData'), 'nova-data.json');
const defaults = { shortcuts: [], todos: [] };
let lastOrganize = null;

function load() {
  try { return { ...defaults, ...JSON.parse(fs.readFileSync(dataFile(), 'utf8')) }; }
  catch { return { ...defaults }; }
}

function save(data) {
  const clean = {
    shortcuts: Array.isArray(data.shortcuts) ? data.shortcuts.slice(0, 200) : [],
    todos: Array.isArray(data.todos) ? data.todos.slice(0, 500) : [],
  };
  const tmp = dataFile() + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(clean, null, 2));
  fs.renameSync(tmp, dataFile());
  return true;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100, height: 720, minWidth: 760, minHeight: 520,
    backgroundColor: '#0d0f14', title: 'NOVA',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  // 外部連結用預設瀏覽器開
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

ipcMain.handle('data:load', () => load());
ipcMain.handle('data:save', (_e, d) => save(d));
ipcMain.handle('stats', () => stats.snapshot());

ipcMain.handle('open', async (_e, target) => {
  if (typeof target !== 'string' || !target) return '沒有目標';
  if (/^https?:\/\//i.test(target)) { await shell.openExternal(target); return ''; }
  return shell.openPath(target); // 回傳空字串代表成功
});

ipcMain.handle('pick', async (_e, kind) => {
  const r = await dialog.showOpenDialog({ properties: [kind === 'folder' ? 'openDirectory' : 'openFile'] });
  return r.canceled ? null : r.filePaths[0];
});

ipcMain.handle('organize:plan', () => {
  const dir = app.getPath('downloads');
  return { dir, moves: organizer.plan(dir) };
});

ipcMain.handle('organize:apply', (_e, moves) => {
  // 只接受這次計畫裡產生的搬移，避免任意搬檔
  const dir = app.getPath('downloads');
  const valid = organizer.plan(dir);
  const ok = new Set(valid.map((m) => m.from));
  const chosen = valid.filter((m) => moves.some((x) => x.from === m.from) && ok.has(m.from));
  const res = organizer.apply(chosen);
  lastOrganize = res.done;
  return res;
});

ipcMain.handle('organize:undo', () => {
  if (!lastOrganize || !lastOrganize.length) return { done: [], failed: [] };
  const res = organizer.undo(lastOrganize);
  lastOrganize = null;
  return res;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
