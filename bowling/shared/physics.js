// 保齡球物理（伺服器與瀏覽器共用）。只用加減乘除與 sqrt，確保兩邊結果一致。
(function (root) {
  const LANE_W = 200;      // 球道寬
  const LANE_L = 900;      // 球道長
  const GUTTER = 22;       // 洗溝寬
  const BALL_R = 11;
  const PIN_R = 6;
  const PIN_GAP = 26;
  const HEAD_Y = 170;      // 1 號瓶位置
  const MAX_STEPS = 2000;

  function pinSpots() {
    const spots = [];
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i <= row; i++) {
        spots.push({ x: LANE_W / 2 + (i - row / 2) * PIN_GAP, y: HEAD_Y - row * PIN_GAP * 0.866 });
      }
    }
    return spots;
  }

  // t: { x: 起始位置(0~LANE_W), aim: 斜率(-0.15~0.15), power: 0~1, spin: -1~1 }
  function clampThrow(t) {
    const n = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
    return {
      x: n(t && t.x, BALL_R, LANE_W - BALL_R, LANE_W / 2),
      aim: n(t && t.aim, -0.15, 0.15, 0),
      power: n(t && t.power, 0, 1, 0.5),
      spin: n(t && t.spin, -1, 1, 0),
    };
  }

  function createSim(standing, throwIn) {
    const t = clampThrow(throwIn);
    const spd = 7 + t.power * 9;
    const len = Math.sqrt(1 + t.aim * t.aim);
    return {
      ball: { x: t.x, y: LANE_L - 40, vx: (t.aim / len) * spd, vy: -spd / len, spin: t.spin, gutter: false, gone: false },
      pins: pinSpots().map((p, i) => ({ x: p.x, y: p.y, ox: p.x, oy: p.y, vx: 0, vy: 0, up: !!standing[i], down: false })),
      steps: 0,
      done: false,
    };
  }

  function collide(a, ra, ma, b, rb, mb) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d2 = dx * dx + dy * dy, rr = ra + rb;
    if (d2 >= rr * rr || d2 === 0) return false;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
    const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    // 推開重疊
    const overlap = rr - d, tot = ma + mb;
    a.x -= nx * overlap * (mb / tot); a.y -= ny * overlap * (mb / tot);
    b.x += nx * overlap * (ma / tot); b.y += ny * overlap * (ma / tot);
    if (rel > 0) return true;
    const e = 0.75, j = (-(1 + e) * rel) / (1 / ma + 1 / mb);
    a.vx -= (j / ma) * nx; a.vy -= (j / ma) * ny;
    b.vx += (j / mb) * nx; b.vy += (j / mb) * ny;
    return true;
  }

  function step(s) {
    if (s.done) return;
    const b = s.ball;
    if (!b.gone) {
      if (!b.gutter) {
        const progress = (LANE_L - b.y) / LANE_L; // 越接近球瓶，弧線越明顯
        b.vx += b.spin * 0.045 * progress * progress;
      }
      b.x += b.vx; b.y += b.vy;
      if (!b.gutter && (b.x < 0 || b.x > LANE_W)) {
        b.gutter = true; b.vx = 0; b.x = b.x < 0 ? -GUTTER / 2 : LANE_W + GUTTER / 2;
      }
      if (b.y < -40) b.gone = true;
    }
    const pins = s.pins;
    for (const p of pins) {
      if (!p.up) continue;
      if (!b.gone && !b.gutter) collide(b, BALL_R, 6, p, PIN_R, 1);
    }
    for (let i = 0; i < pins.length; i++) {
      if (!pins[i].up) continue;
      for (let j = i + 1; j < pins.length; j++) if (pins[j].up) collide(pins[i], PIN_R, 1, pins[j], PIN_R, 1);
    }
    let moving = false;
    for (const p of pins) {
      if (!p.up) continue;
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.965; p.vy *= 0.965;
      if (Math.abs(p.vx) + Math.abs(p.vy) > 0.03) moving = true;
      const dx = p.x - p.ox, dy = p.y - p.oy;
      if (dx * dx + dy * dy > PIN_R * PIN_R * 1.2) p.down = true;
      if (p.y < -10 || p.x < -4 || p.x > LANE_W + 4) { p.down = true; p.vx *= 0.5; p.vy *= 0.5; }
    }
    s.steps++;
    if ((b.gone && !moving) || s.steps > MAX_STEPS) s.done = true;
  }

  function knockedOf(s) {
    const k = [];
    s.pins.forEach((p, i) => { if (p.up && p.down) k.push(i); });
    return k;
  }

  function simulate(standing, t) {
    const s = createSim(standing, t);
    while (!s.done) step(s);
    return knockedOf(s);
  }

  const api = { LANE_W, LANE_L, GUTTER, BALL_R, PIN_R, pinSpots, clampThrow, createSim, step, knockedOf, simulate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BowlPhysics = api;
})(this);
