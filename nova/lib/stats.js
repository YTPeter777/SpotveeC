const os = require('os');
const fs = require('fs');

let prev = os.cpus();

function cpuPercent() {
  const cur = os.cpus();
  let idle = 0, total = 0;
  cur.forEach((c, i) => {
    const p = prev[i] || c;
    for (const k of Object.keys(c.times)) total += c.times[k] - p.times[k];
    idle += c.times.idle - p.times.idle;
  });
  prev = cur;
  return total > 0 ? Math.round((1 - idle / total) * 100) : 0;
}

function disk(root) {
  try {
    const s = fs.statfsSync(root);
    const total = s.blocks * s.bsize, free = s.bavail * s.bsize;
    return { total, used: total - free, percent: Math.round(((total - free) / total) * 100) };
  } catch {
    return null;
  }
}

function snapshot() {
  const total = os.totalmem(), free = os.freemem();
  const cpu = cpuPercent();
  const mem = Math.round(((total - free) / total) * 100);
  const d = disk(process.platform === 'win32' ? process.env.SystemDrive + '\\' : '/');
  return {
    cpu, mem, memUsed: total - free, memTotal: total, disk: d,
    uptime: os.uptime(), host: os.hostname(), platform: process.platform,
    summary: explain(cpu, mem, d && d.percent),
  };
}

// 用白話說明目前狀態
function explain(cpu, mem, diskPct) {
  const tips = [];
  if (cpu > 85) tips.push('CPU 很忙，可能有程式在大量運算');
  if (mem > 85) tips.push('記憶體快滿了，關掉不用的分頁或程式會比較順');
  if (diskPct > 90) tips.push('硬碟空間快不夠了，建議清理');
  return tips.length ? tips.join('；') + '。' : '電腦狀態良好 👍';
}

module.exports = { snapshot, explain };
