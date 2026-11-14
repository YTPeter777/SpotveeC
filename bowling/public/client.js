const P = window.BowlPhysics, S = window.BowlScoring;
const socket = io();
const $ = (id) => document.getElementById(id);

const canvas = $('lane'), ctx = canvas.getContext('2d');
const PAD = 10, OX = PAD + P.GUTTER; // 球道在畫布上的 x 偏移
canvas.width = P.LANE_W + 2 * P.GUTTER + 2 * PAD;
canvas.height = P.LANE_L;

let myId = null, state = null;
let anim = null;            // 正在播放的投球動畫
let phase = 'idle';         // pos -> aim -> power -> idle
let shot = { x: P.LANE_W / 2, aim: 0, power: 0.5, spin: 0 };
let remoteAim = null;       // 別人瞄準的畫面
let tick = 0;

// ---------- 大廳 ----------
$('name').value = localStorageGet('bowl-name');
$('code').value = new URLSearchParams(location.search).get('room') || '';
$('joinBtn').onclick = () => {
  const name = $('name').value, code = $('code').value;
  localStorageSet('bowl-name', name);
  socket.emit('join', { name, code }, (res) => {
    if (res.error) return ($('err').textContent = res.error);
    myId = res.id;
    $('lobby').hidden = true; $('game').hidden = false;
    history.replaceState(null, '', '?room=' + encodeURIComponent(code.trim().toUpperCase()));
  });
};
$('startBtn').onclick = () => socket.emit('start');
$('restartBtn').onclick = () => socket.emit('restart');
$('spinL').onclick = () => setSpin(shot.spin - 0.25);
$('spinR').onclick = () => setSpin(shot.spin + 0.25);
function setSpin(v) { shot.spin = Math.max(-1, Math.min(1, Math.round(v * 4) / 4)); $('spinVal').textContent = shot.spin; }

function localStorageGet(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch {} }

// ---------- 連線事件 ----------
socket.on('state', (s) => { if (!anim) applyState(s); else anim.pendingState = s; });
socket.on('aim', (a) => (remoteAim = a));
socket.on('rolled', (r) => {
  remoteAim = null;
  phase = 'idle';
  anim = { sim: P.createSim(r.standing, r.shot), knocked: r.knocked, by: r.by, pendingState: r.state, endAt: 0 };
});

function myTurn() {
  return state && state.started && !state.finished && state.players[state.turn] && state.players[state.turn].id === myId;
}

function applyState(s) {
  state = s;
  $('roomCode').textContent = s.code;
  const isHost = s.hostId === myId;
  $('startBtn').hidden = !(isHost && !s.started);
  $('restartBtn').hidden = !(isHost && s.finished);
  $('controls').hidden = !myTurn();
  if (myTurn() && phase === 'idle') phase = 'pos';
  if (!myTurn()) phase = 'idle';
  renderStatus(); renderBoard();
}

function renderStatus() {
  let t = '';
  if (!state.started) t = `等待中…（${state.players.length} 人）` + (state.hostId === myId ? ' 你是房主，人到齊就按開始' : '');
  else if (state.finished) {
    const best = [...state.players].sort((a, b) => b.total - a.total)[0];
    t = `🏆 遊戲結束！冠軍：${best.name}（${best.total} 分）`;
  } else {
    const cur = state.players[state.turn];
    t = myTurn() ? `輪到你了！第 ${cur.frame + 1} 格` : `輪到 ${cur.name}（第 ${cur.frame + 1} 格）`;
  }
  $('status').textContent = t;
}

function renderBoard() {
  let h = '<div class="wrap"><table class="sheet"><tr><th class="name">玩家</th>';
  for (let f = 1; f <= 10; f++) h += `<th>${f}</th>`;
  h += '<th>總分</th></tr>';
  state.players.forEach((p, i) => {
    const marks = S.frameMarks(p.rolls), scores = S.frameScores(p.rolls);
    const cls = [state.started && !state.finished && i === state.turn ? 'now' : '', p.left ? 'left' : ''].join(' ');
    h += `<tr class="${cls}"><th class="name">${esc(p.name)}${p.id === myId ? '（你）' : ''}</th>`;
    for (let f = 0; f < 10; f++) {
      const m = marks[f] ? marks[f].join(' ') : '';
      const sc = scores[f] == null ? '' : scores[f];
      h += `<td><div class="marks">${m || '&nbsp;'}</div><div>${sc}</div></td>`;
    }
    h += `<td><b>${p.total}</b></td></tr>`;
  });
  $('board').innerHTML = h + '</table></div>';
}
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- 操作 ----------
function laneXFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  return ((e.clientX - r.left) / r.width) * canvas.width - OX;
}
canvas.addEventListener('pointermove', (e) => {
  if (phase === 'pos') shot.x = Math.max(P.BALL_R, Math.min(P.LANE_W - P.BALL_R, laneXFromEvent(e)));
});
canvas.addEventListener('pointerdown', (e) => {
  if (phase === 'pos') shot.x = Math.max(P.BALL_R, Math.min(P.LANE_W - P.BALL_R, laneXFromEvent(e)));
  advancePhase();
});
window.addEventListener('keydown', (e) => {
  if (!myTurn() || anim) return;
  if (e.code === 'Space') { e.preventDefault(); advancePhase(); }
  if (phase === 'pos' && e.code === 'ArrowLeft') shot.x = Math.max(P.BALL_R, shot.x - 5);
  if (phase === 'pos' && e.code === 'ArrowRight') shot.x = Math.min(P.LANE_W - P.BALL_R, shot.x + 5);
  if (e.code === 'KeyA') setSpin(shot.spin - 0.25);
  if (e.code === 'KeyD') setSpin(shot.spin + 0.25);
});

function advancePhase() {
  if (!myTurn() || anim) return;
  if (phase === 'pos') { phase = 'aim'; tick = 0; }
  else if (phase === 'aim') { phase = 'power'; tick = 0; }
  else if (phase === 'power') { phase = 'idle'; socket.emit('throw', shot); }
}

// ---------- 畫面 ----------
function draw() {
  tick++;
  if (phase === 'aim') shot.aim = Math.sin(tick * 0.04) * 0.15;
  if (phase === 'power') shot.power = (1 - Math.cos(tick * 0.06)) / 2;
  if (myTurn() && phase !== 'idle' && tick % 4 === 0) socket.volatile.emit('aim', shot);

  if (anim) {
    for (let k = 0; k < 1 && !anim.sim.done; k++) P.step(anim.sim);
    if (anim.sim.done && !anim.endAt) anim.endAt = performance.now() + 1100;
    if (anim.endAt && performance.now() > anim.endAt) { const s = anim.pendingState; anim = null; applyState(s); }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 洗溝與球道
  ctx.fillStyle = '#2a2f3a'; ctx.fillRect(PAD, 0, P.LANE_W + 2 * P.GUTTER, P.LANE_L);
  const g = ctx.createLinearGradient(OX, 0, OX + P.LANE_W, 0);
  g.addColorStop(0, '#c99a5b'); g.addColorStop(0.5, '#e2b97f'); g.addColorStop(1, '#c99a5b');
  ctx.fillStyle = g; ctx.fillRect(OX, 0, P.LANE_W, P.LANE_L);
  ctx.strokeStyle = 'rgba(0,0,0,.12)';
  for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.moveTo(OX + i * P.LANE_W / 10, 0); ctx.lineTo(OX + i * P.LANE_W / 10, P.LANE_L); ctx.stroke(); }
  // 標靶箭頭
  ctx.fillStyle = 'rgba(120,40,20,.6)';
  for (let i = 1; i <= 5; i++) tri(OX + (P.LANE_W / 6) * i, P.LANE_L - 260 + Math.abs(3 - i) * 18);
  ctx.fillStyle = '#7a1d1d'; ctx.fillRect(OX, P.LANE_L - 70, P.LANE_W, 3); // 犯規線

  if (anim) {
    anim.sim.pins.forEach((p) => p.up && drawPin(p.x, p.y, p.down));
    drawBall(anim.sim.ball.x, anim.sim.ball.y);
    if (anim.sim.done) banner(anim.knocked.length === 10 && anim.sim.pins.every((p) => p.up) ? 'STRIKE!' : `倒了 ${anim.knocked.length} 支`);
  } else {
    const spots = P.pinSpots();
    const standing = state && state.started ? state.standing : Array(10).fill(true);
    spots.forEach((p, i) => standing[i] && drawPin(p.x, p.y, false));
    const s = myTurn() ? shot : remoteAim;
    if (s) {
      drawBall(s.x, P.LANE_L - 40);
      if (myTurn() ? phase !== 'pos' : true) guide(s);
      if (myTurn() ? phase === 'power' : true) powerBar(s.power);
    }
  }
  requestAnimationFrame(draw);
}

function tri(x, y) { ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x - 5, y + 6); ctx.lineTo(x + 5, y + 6); ctx.fill(); }
function drawPin(x, y, down) {
  ctx.globalAlpha = down ? 0.45 : 1;
  ctx.fillStyle = '#fafafa'; ctx.beginPath(); ctx.arc(OX + x, y, P.PIN_R, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(OX + x, y, P.PIN_R - 2.5, 0, 7); ctx.stroke();
  ctx.globalAlpha = 1; ctx.lineWidth = 1;
}
function drawBall(x, y) {
  const g = ctx.createRadialGradient(OX + x - 3, y - 3, 2, OX + x, y, P.BALL_R);
  g.addColorStop(0, '#6aa8ff'); g.addColorStop(1, '#1b3f8f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(OX + x, y, P.BALL_R, 0, 7); ctx.fill();
}
function guide(s) {
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.setLineDash([6, 6]); ctx.beginPath();
  ctx.moveTo(OX + s.x, P.LANE_L - 40); ctx.lineTo(OX + s.x + s.aim * 400, P.LANE_L - 440); ctx.stroke(); ctx.setLineDash([]);
}
function powerBar(v) {
  const x = canvas.width - PAD - 6, h = 200, y = P.LANE_L - 30 - h;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 4, y, 8, h);
  ctx.fillStyle = `hsl(${120 - v * 120},80%,55%)`; ctx.fillRect(x - 4, y + h * (1 - v), 8, h * v);
}
function banner(text) {
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 300, canvas.width, 60);
  ctx.fillStyle = '#f5a524'; ctx.font = 'bold 28px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, 340);
}

requestAnimationFrame(draw);
