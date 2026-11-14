const assert = require('assert');
const fs = require('fs'), os = require('os'), path = require('path');
const org = require('./lib/organizer');
const stats = require('./lib/stats');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-'));
for (const f of ['a.pdf', 'b.JPG', 'c.mp4', 'd.unknown', 'e.zip.crdownload', '.hidden.png']) fs.writeFileSync(path.join(dir, f), f);
fs.mkdirSync(path.join(dir, '文件')); fs.writeFileSync(path.join(dir, '文件', 'a.pdf'), 'old');

const moves = org.plan(dir);
assert.deepStrictEqual(moves.map((m) => m.name).sort(), ['a.pdf', 'b.JPG', 'c.mp4']);
assert.strictEqual(path.basename(moves.find((m) => m.name === 'a.pdf').to), 'a (1).pdf', '不能覆蓋同名檔');
const r = org.apply(moves);
assert.strictEqual(r.done.length, 3);
assert.strictEqual(fs.readFileSync(path.join(dir, '文件', 'a.pdf'), 'utf8'), 'old');
assert(fs.existsSync(path.join(dir, '圖片', 'b.JPG')));
const u = org.undo(r.done);
assert.strictEqual(u.done.length, 3);
assert(fs.existsSync(path.join(dir, 'a.pdf')) && fs.existsSync(path.join(dir, 'd.unknown')));
fs.rmSync(dir, { recursive: true });

const s = stats.snapshot();
assert(s.cpu >= 0 && s.cpu <= 100 && s.mem > 0 && s.mem <= 100);
assert.strictEqual(stats.explain(10, 20, 30), '電腦狀態良好 👍');
assert(stats.explain(95, 20, 30).includes('CPU'));
console.log('all tests passed', { cpu: s.cpu, mem: s.mem, disk: s.disk && s.disk.percent });
