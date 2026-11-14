// 保齡球計分（伺服器與瀏覽器共用）
(function (root) {
  // 由投球紀錄算出每格累計分數（還不能算的格子為 null）
  function frameScores(rolls) {
    const out = [];
    let i = 0, total = 0;
    for (let f = 0; f < 10; f++) {
      if (i >= rolls.length) break;
      const a = rolls[i], b = rolls[i + 1], c = rolls[i + 2];
      if (a === 10) {
        if (b === undefined || c === undefined) { out.push(null); break; }
        total += 10 + b + c; i += 1;
      } else {
        if (b === undefined) { out.push(null); break; }
        if (a + b === 10) {
          if (c === undefined) { out.push(null); break; }
          total += 10 + c;
        } else total += a + b;
        i += 2;
      }
      out.push(total);
    }
    return out;
  }

  // 每格顯示符號：X、/、-、數字
  function frameMarks(rolls) {
    const marks = [];
    const sym = (n) => (n === 0 ? '-' : String(n));
    let i = 0;
    for (let f = 0; f < 10 && i < rolls.length; f++) {
      if (f < 9) {
        const a = rolls[i], b = rolls[i + 1];
        if (a === 10) { marks.push(['', 'X']); i += 1; continue; }
        marks.push([sym(a), b === undefined ? '' : a + b === 10 ? '/' : sym(b)]);
        i += 2;
      } else {
        const r = rolls.slice(i, i + 3), m = [];
        for (let k = 0; k < r.length; k++) {
          const prev = r[k - 1];
          const fresh = k === 0 || prev === 10 || (k === 2 && r[0] !== 10 && r[0] + r[1] === 10) ||
            (k === 2 && r[0] === 10 && r[1] === 10);
          if (r[k] === 10 && fresh) m.push('X');
          else if (!fresh && prev + r[k] === 10) m.push('/');
          else m.push(sym(r[k]));
        }
        marks.push(m);
        i += 3;
      }
    }
    return marks;
  }

  function total(rolls) {
    const s = frameScores(rolls).filter((v) => v !== null);
    return s.length ? s[s.length - 1] : 0;
  }

  const api = { frameScores, frameMarks, total };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BowlScoring = api;
})(this);
