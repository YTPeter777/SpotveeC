// 若不是在 Electron 裡（例如直接用瀏覽器預覽），用假資料代替
const api = window.nova || {
  load: async () => ({ shortcuts: [{ name: 'Google', target: 'https://google.com', kind: 'url' }, { name: '文件', target: '/docs', kind: 'folder' }], todos: [{ text: '試用 NOVA', done: false }] }),
  save: async () => true,
  stats: async () => ({ cpu: 23, mem: 61, disk: { percent: 72 }, summary: '電腦狀態良好 👍' }),
  open: async () => '', pick: async () => null,
  organizePlan: async () => ({ dir: '~/Downloads', moves: [{ from: 'a', name: '報告.pdf', category: '文件' }, { from: 'b', name: '照片.jpg', category: '圖片' }] }),
  organizeApply: async (m) => ({ done: m, failed: [] }), organizeUndo: async () => ({ done: [], failed: [] }),
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let data = { shortcuts: [], todos: [] };
let plan = null;

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2500);
}
const persist = () => api.save(data);

// ---------- 時鐘與問候 ----------
function tickClock() {
  const d = new Date();
  $('clock').textContent = d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  const h = d.getHours();
  const hi = h < 5 ? '夜深了' : h < 11 ? '早安' : h < 14 ? '午安' : h < 18 ? '下午好' : '晚上好';
  $('greet').textContent = `${hi}，今天是 ${d.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}`;
}

// ---------- 捷徑 ----------
const ICON = { app: '🚀', folder: '📁', url: '🌐' };
function renderShortcuts() {
  const box = $('shortcuts');
  if (!data.shortcuts.length) { box.innerHTML = '<div class="empty">還沒有捷徑，用右上角的按鈕加入常用的程式、資料夾或網址。</div>'; return; }
  box.innerHTML = data.shortcuts.map((s, i) =>
    `<div class="sc" data-i="${i}" title="${esc(s.target)}"><button class="del" data-del="${i}" title="移除">✕</button>
     <div class="icon">${ICON[s.kind] || '⭐'}</div><div class="name">${esc(s.name)}</div></div>`).join('');
}
$('shortcuts').addEventListener('click', async (e) => {
  const del = e.target.closest('[data-del]');
  if (del) { data.shortcuts.splice(+del.dataset.del, 1); renderShortcuts(); persist(); return; }
  const sc = e.target.closest('.sc');
  if (!sc) return;
  const err = await api.open(data.shortcuts[+sc.dataset.i].target);
  if (err) toast('打不開：' + err);
});
document.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', async () => {
  const kind = b.dataset.add;
  if (kind === 'url') { $('urlForm').hidden = false; $('urlName').focus(); return; }
  const p = await api.pick(kind);
  if (!p) return;
  const name = p.split(/[\\/]/).filter(Boolean).pop().replace(/\.(app|exe|lnk)$/i, '');
  data.shortcuts.push({ name, target: p, kind }); renderShortcuts(); persist();
}));
$('urlForm').addEventListener('submit', (e) => {
  e.preventDefault();
  let url = $('urlValue').value.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  let name = $('urlName').value.trim();
  try { name = name || new URL(url).hostname.replace(/^www\./, ''); } catch { return toast('網址格式不對'); }
  data.shortcuts.push({ name, target: url, kind: 'url' });
  $('urlName').value = $('urlValue').value = ''; $('urlForm').hidden = true;
  renderShortcuts(); persist();
});
$('urlCancel').onclick = () => ($('urlForm').hidden = true);

// ---------- 待辦 ----------
function renderTodos() {
  $('todos').innerHTML = data.todos.map((t, i) =>
    `<li class="${t.done ? 'done' : ''}"><input type="checkbox" data-t="${i}" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span><button data-rm="${i}">✕</button></li>`).join('');
  const left = data.todos.filter((t) => !t.done).length;
  $('todoCount').textContent = data.todos.length ? `剩 ${left} 項` : '';
}
$('todoForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('todoInput').value.trim();
  if (!text) return;
  data.todos.unshift({ text, done: false }); $('todoInput').value = '';
  renderTodos(); persist();
});
$('todos').addEventListener('click', (e) => {
  if (e.target.dataset.t != null) { const t = data.todos[+e.target.dataset.t]; t.done = !t.done; }
  else if (e.target.dataset.rm != null) data.todos.splice(+e.target.dataset.rm, 1);
  else return;
  renderTodos(); persist();
});

// ---------- 電腦狀態 ----------
function setRing(id, ringId, pct) {
  $(id).textContent = pct == null ? '–' : pct + '%';
  const r = $(ringId);
  r.style.setProperty('--p', pct || 0);
  r.style.setProperty('--c', pct > 85 ? 'var(--bad)' : pct > 65 ? 'var(--warn)' : 'var(--ok)');
}
async function refreshStats() {
  const s = await api.stats();
  setRing('cpu', 'cpuRing', s.cpu); setRing('mem', 'memRing', s.mem); setRing('disk', 'diskRing', s.disk && s.disk.percent);
  $('summary').textContent = s.summary;
}

// ---------- 下載整理 ----------
$('scanBtn').onclick = async () => {
  plan = await api.organizePlan();
  const box = $('orgResult');
  if (!plan.moves.length) { box.innerHTML = '<p class="muted">下載資料夾很整齊，沒有需要整理的檔案。</p>'; return; }
  box.innerHTML = `<div class="org-list">${plan.moves.map((m) => `<div><span>${esc(m.name)}</span><b>→ ${esc(m.category)}</b></div>`).join('')}</div>
    <div class="actions"><button id="applyBtn">確認搬移 ${plan.moves.length} 個檔案</button><button id="cancelBtn" class="ghost">取消</button></div>`;
  $('cancelBtn').onclick = () => (box.innerHTML = '');
  $('applyBtn').onclick = async () => {
    const r = await api.organizeApply(plan.moves);
    box.innerHTML = `<p class="muted">已整理 ${r.done.length} 個檔案${r.failed.length ? `，${r.failed.length} 個失敗` : ''}。</p>`;
    $('undoBtn').hidden = !r.done.length;
  };
};
$('undoBtn').onclick = async () => {
  const r = await api.organizeUndo();
  toast(`已復原 ${r.done.length} 個檔案`); $('undoBtn').hidden = true; $('orgResult').innerHTML = '';
};

// ---------- 啟動 ----------
(async () => {
  data = await api.load();
  renderShortcuts(); renderTodos();
  tickClock(); setInterval(tickClock, 1000);
  refreshStats(); setInterval(refreshStats, 3000);
})();
