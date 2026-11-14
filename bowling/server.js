const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const Physics = require('./shared/physics');
const Scoring = require('./shared/scoring');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));
const server = http.createServer(app);
const io = new Server(server);

const MAX_PLAYERS = 6;
const rooms = new Map(); // code -> room

const allUp = () => Array(10).fill(true);

function newRoom(code) {
  return { code, players: [], started: false, finished: false, turn: 0, standing: allUp(), busyUntil: 0 };
}

function publicState(room) {
  return {
    code: room.code,
    started: room.started,
    finished: room.finished,
    turn: room.turn,
    standing: room.standing,
    hostId: room.players[0] ? room.players[0].id : null,
    players: room.players.map((p) => ({
      id: p.id, name: p.name, left: p.left, rolls: p.rolls, frame: p.frame,
      done: p.done, total: Scoring.total(p.rolls),
    })),
  };
}

function broadcast(room) { io.to(room.code).emit('state', publicState(room)); }

// 換到下一位還沒打完、還在線上的玩家
function advanceTurn(room) {
  const n = room.players.length;
  room.standing = allUp();
  for (let k = 1; k <= n; k++) {
    const idx = (room.turn + k) % n;
    const p = room.players[idx];
    if (!p.done && !p.left) { room.turn = idx; return; }
  }
  room.finished = true;
}

// 套用一次投球結果，回傳是否換人
function applyRoll(room, p, count) {
  p.rolls.push(count);
  p.frameRolls.push(count);
  const fr = p.frameRolls;
  if (p.frame < 9) {
    if (fr[0] === 10 || fr.length === 2) return endFrame(p);
    return false;
  }
  // 第 10 格
  if (fr.length === 1) { if (fr[0] === 10) room.standing = allUp(); return false; }
  if (fr.length === 2) {
    if (fr[0] < 10 && fr[0] + fr[1] < 10) return endFrame(p);
    if (fr[0] === 10 && fr[1] < 10) return false;      // 保留剩下的瓶
    room.standing = allUp();                            // 補中或連續全倒
    return false;
  }
  return endFrame(p);
}

function endFrame(p) {
  p.frame++;
  p.frameRolls = [];
  if (p.frame >= 10) p.done = true;
  return true;
}

io.on('connection', (socket) => {
  let room = null;
  const me = () => room && room.players.find((p) => p.id === socket.id);

  socket.on('join', ({ code, name }, ack) => {
    code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    name = String(name || '').trim().slice(0, 12) || '玩家';
    if (!code) return ack && ack({ error: '請輸入房號' });
    let r = rooms.get(code);
    if (!r) { r = newRoom(code); rooms.set(code, r); }
    if (r.started) return ack && ack({ error: '遊戲已經開始了' });
    if (r.players.length >= MAX_PLAYERS) return ack && ack({ error: '房間已滿' });
    room = r;
    socket.join(code);
    room.players.push({ id: socket.id, name, rolls: [], frameRolls: [], frame: 0, done: false, left: false });
    ack && ack({ ok: true, id: socket.id });
    broadcast(room);
  });

  socket.on('start', () => {
    if (!room || room.started || !room.players.length || room.players[0].id !== socket.id) return;
    room.started = true;
    room.turn = 0;
    room.standing = allUp();
    broadcast(room);
  });

  // 瞄準中的即時畫面，轉給其他人看
  socket.on('aim', (data) => {
    if (!room || !room.started) return;
    const cur = room.players[room.turn];
    if (!cur || cur.id !== socket.id) return;
    socket.to(room.code).volatile.emit('aim', Physics.clampThrow(data));
  });

  socket.on('throw', (t) => {
    if (!room || !room.started || room.finished) return;
    const p = room.players[room.turn];
    if (!p || p.id !== socket.id || Date.now() < room.busyUntil) return;
    const shot = Physics.clampThrow(t);
    const before = room.standing.slice();
    const knocked = Physics.simulate(before, shot);
    knocked.forEach((i) => (room.standing[i] = false));
    const switched = applyRoll(room, p, knocked.length);
    if (switched) advanceTurn(room);
    room.busyUntil = Date.now() + 1500; // 等動畫播完
    io.to(room.code).emit('rolled', { by: p.id, shot, standing: before, knocked, state: publicState(room) });
  });

  socket.on('restart', () => {
    if (!room || !room.finished || room.players[0].id !== socket.id) return;
    room.players = room.players.filter((p) => !p.left);
    room.players.forEach((p) => Object.assign(p, { rolls: [], frameRolls: [], frame: 0, done: false }));
    Object.assign(room, { finished: false, started: true, turn: 0, standing: allUp() });
    broadcast(room);
  });

  socket.on('disconnect', () => {
    if (!room) return;
    const p = me();
    if (!room.started) room.players = room.players.filter((x) => x.id !== socket.id);
    else if (p) {
      p.left = true;
      if (room.players[room.turn] === p && !room.finished) advanceTurn(room);
    }
    if (room.players.every((x) => x.left)) rooms.delete(room.code);
    else broadcast(room);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`保齡球伺服器啟動：http://localhost:${PORT}`));
