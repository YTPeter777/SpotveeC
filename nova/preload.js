const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nova', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  stats: () => ipcRenderer.invoke('stats'),
  open: (target) => ipcRenderer.invoke('open', target),
  pick: (kind) => ipcRenderer.invoke('pick', kind),
  organizePlan: () => ipcRenderer.invoke('organize:plan'),
  organizeApply: (moves) => ipcRenderer.invoke('organize:apply', moves),
  organizeUndo: () => ipcRenderer.invoke('organize:undo'),
});
