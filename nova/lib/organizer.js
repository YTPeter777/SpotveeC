// 下載資料夾整理：先產生「計畫」給使用者確認，確認後才真的搬檔。
const fs = require('fs');
const path = require('path');

const CATEGORIES = {
  '圖片': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'bmp', 'svg'],
  '影片': ['mp4', 'mov', 'mkv', 'avi', 'webm'],
  '音樂': ['mp3', 'wav', 'flac', 'm4a', 'aac'],
  '文件': ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'csv', 'odt'],
  '壓縮檔': ['zip', 'rar', '7z', 'tar', 'gz'],
  '安裝檔': ['exe', 'msi', 'dmg', 'pkg', 'appimage', 'deb'],
  '程式碼': ['js', 'ts', 'py', 'java', 'c', 'cpp', 'html', 'css', 'json'],
};

function categoryOf(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  for (const [cat, exts] of Object.entries(CATEGORIES)) if (exts.includes(ext)) return cat;
  return null;
}

// 不覆蓋同名檔案：已存在就加上 (1)、(2)…
function freeName(dir, name, taken) {
  const ext = path.extname(name), base = path.basename(name, ext);
  let candidate = name, n = 1;
  while (fs.existsSync(path.join(dir, candidate)) || taken.has(path.join(dir, candidate))) {
    candidate = `${base} (${n++})${ext}`;
  }
  return candidate;
}

function plan(dir) {
  const moves = [], taken = new Set();
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!ent.isFile() || ent.name.startsWith('.')) continue;
    if (/\.(crdownload|part|download|tmp)$/i.test(ent.name)) continue; // 還在下載中
    const cat = categoryOf(ent.name);
    if (!cat) continue;
    const destDir = path.join(dir, cat);
    const to = path.join(destDir, freeName(destDir, ent.name, taken));
    taken.add(to);
    moves.push({ from: path.join(dir, ent.name), to, category: cat, name: ent.name });
  }
  return moves;
}

function apply(moves) {
  const done = [], failed = [];
  for (const m of moves) {
    try {
      fs.mkdirSync(path.dirname(m.to), { recursive: true });
      if (fs.existsSync(m.to)) throw new Error('目的地已有同名檔案');
      fs.renameSync(m.from, m.to);
      done.push(m);
    } catch (e) {
      failed.push({ ...m, error: e.message });
    }
  }
  return { done, failed };
}

// 復原上一次整理
function undo(done) {
  return apply(done.map((m) => ({ ...m, from: m.to, to: m.from })));
}

module.exports = { CATEGORIES, categoryOf, plan, apply, undo };
