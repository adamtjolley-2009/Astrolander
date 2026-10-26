// Astrolander: a TimeSplitters 2 minigame tribute, drawn in classic vector-arcade style.
(() => {
  'use strict';

  // ---------- Tunables ----------
  const GRAVITY = 22;          // px/s^2
  const THRUST = 62;           // px/s^2
  const ROT_SPEED = 4.0;       // rad/s
  const BURN_RATE = 55;        // fuel units/s
  const SAFE_VY = 60;          // max vertical landing speed (px/s)
  const SAFE_VX = 32;          // max horizontal landing speed (px/s)
  const SAFE_ANGLE = 0.31;     // ~18 degrees
  const SPEED_UNIT = 10;       // px/s per displayed unit
  const FUEL_BONUS_PER_UNIT = 5;
  const MAX_SPEED_BONUS = 1000;
  const MAX_ACCURACY_BONUS = 1000;
  const FUEL_SCALE = 0.56;     // every level's starting fuel is scaled by this (0.8, then 30% less)
  const SPIN_BONUS = 250;      // per full 360 the ship turns before landing, revealed only in the tally
  const START_LIVES = 3;
  const WORLD_W = 1000;

  // Classic arrowhead ship (local coords, nose up = -y)
  const HULL = [[0, -12], [8, 10], [-8, 10]];
  const FEET = [[-8, 10], [8, 10]];
  const FOOT_Y = 10;

  // ---------- Vector font (4x6 grid, y down) ----------
  const FONT = {
    A: [[[0, 6], [0, 2], [2, 0], [4, 2], [4, 6]], [[0, 4], [4, 4]]],
    B: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
    C: [[[4, 0], [0, 0], [0, 6], [4, 6]]],
    D: [[[0, 0], [2, 0], [4, 2], [4, 4], [2, 6], [0, 6], [0, 0]]],
    E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
    G: [[[4, 2], [4, 0], [0, 0], [0, 6], [4, 6], [4, 4], [2, 4]]],
    H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
    I: [[[0, 0], [4, 0]], [[2, 0], [2, 6]], [[0, 6], [4, 6]]],
    J: [[[4, 0], [4, 6], [2, 6], [0, 4]]],
    K: [[[0, 0], [0, 6]], [[4, 0], [0, 3], [4, 6]]],
    L: [[[0, 0], [0, 6], [4, 6]]],
    M: [[[0, 6], [0, 0], [2, 2], [4, 0], [4, 6]]],
    N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
    O: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]]],
    P: [[[0, 6], [0, 0], [4, 0], [4, 3], [0, 3]]],
    Q: [[[0, 0], [4, 0], [4, 4], [2, 6], [0, 6], [0, 0]], [[2, 4], [4, 6]]],
    R: [[[0, 6], [0, 0], [4, 0], [4, 3], [0, 3]], [[1, 3], [4, 6]]],
    S: [[[4, 0], [0, 0], [0, 3], [4, 3], [4, 6], [0, 6]]],
    T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
    U: [[[0, 0], [0, 6], [4, 6], [4, 0]]],
    V: [[[0, 0], [2, 6], [4, 0]]],
    W: [[[0, 0], [0, 6], [2, 4], [4, 6], [4, 0]]],
    X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
    Y: [[[0, 0], [2, 2], [4, 0]], [[2, 2], [2, 6]]],
    Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
    0: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]]],
    1: [[[2, 0], [2, 6]]],
    2: [[[0, 0], [4, 0], [4, 3], [0, 3], [0, 6], [4, 6]]],
    3: [[[0, 0], [4, 0], [4, 6], [0, 6]], [[0, 3], [4, 3]]],
    4: [[[0, 0], [0, 3], [4, 3]], [[4, 0], [4, 6]]],
    5: [[[4, 0], [0, 0], [0, 3], [4, 3], [4, 6], [0, 6]]],
    6: [[[0, 0], [0, 6], [4, 6], [4, 3], [0, 3]]],
    7: [[[0, 0], [4, 0], [4, 6]]],
    8: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[0, 3], [4, 3]]],
    9: [[[4, 3], [0, 3], [0, 0], [4, 0], [4, 6]]],
    '.': [[[2, 5.5], [2, 6]]],
    ',': [[[2, 5], [1, 7]]],
    ':': [[[2, 1.5], [2, 2]], [[2, 4], [2, 4.5]]],
    '-': [[[1, 3], [3, 3]]],
    '_': [[[0, 6], [4, 6]]],
    '!': [[[2, 0], [2, 4]], [[2, 5.5], [2, 6]]],
    '?': [[[0, 1], [0, 0], [4, 0], [4, 3], [2, 3], [2, 4]], [[2, 5.5], [2, 6]]],
    '/': [[[0, 6], [4, 0]]],
    "'": [[[2, 0], [2, 2]]],
    '°': [[[1, 0], [2.5, 0], [2.5, 1.5], [1, 1.5], [1, 0]]],
    '+': [[[2, 1], [2, 5]], [[0, 3], [4, 3]]],
    '<': [[[4, 0], [0, 3], [4, 6], [4, 0]]],
    '>': [[[0, 0], [4, 3], [0, 6], [0, 0]]],
    '→': [[[0, 3], [4, 3]], [[2, 1], [4, 3], [2, 5]]],
    '←': [[[4, 3], [0, 3]], [[2, 1], [0, 3], [2, 5]]],
    '↑': [[[2, 6], [2, 0]], [[0, 2], [2, 0], [4, 2]]],
    '↓': [[[2, 0], [2, 6]], [[0, 4], [2, 6], [4, 4]]],
  };
  // SVG path for a string (used for the THRUST button label)
  function vtPath(str) {
    let d = '', ox = 0;
    for (const ch of str.toUpperCase()) {
      for (const stroke of FONT[ch] || []) {
        d += stroke.map((p, i) => (i ? 'L' : 'M') + (ox + p[0]) + ' ' + p[1]).join('');
      }
      ox += 6;
    }
    return { d, w: ox - 2 };
  }

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  {
    const p = vtPath('THRUST');
    $('btnThrust').innerHTML = `<svg viewBox="-1 -1 ${p.w + 2} 8"><path d="${p.d}"/></svg>`;
  }

  let W = 0, H = 0, DPR = 1, scale = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    scale = Math.max(0.8, Math.min(W / 400, H / 560, 1.7));
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Utils ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function wrapAngle(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const rX = bx - ax, rY = by - ay, sX = dx - cx, sY = dy - cy;
    const den = rX * sY - rY * sX;
    if (den === 0) return false;
    const t = ((cx - ax) * sY - (cy - ay) * sX) / den;
    const u = ((cx - ax) * rY - (cy - ay) * rX) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }
  function withBounds(s) {
    s.minX = Math.min(s.ax, s.bx); s.maxX = Math.max(s.ax, s.bx);
    s.minY = Math.min(s.ay, s.by); s.maxY = Math.max(s.ay, s.by);
    return s;
  }

  // ---------- Level generation ----------
  // The campaign: a fixed list of levels. `seed` is the number a map is built from,
  // so every player flies exactly the same maps.
  //   open:   wide sky over hilly ground
  //   peak:   land on top of a mountain
  //   canyon: a winding shaft straight down
  //   cavern: drop down a canyon, then go sideways and up through a cavern to the pad
  //   cliff:  start at the bottom of a canyon and climb to a pad on a ledge
  //   snake:  switchback tunnels that zig-zag back and forth on the way down
  const LEVELS = [
    { kind: 'open', seed: 1 },
    { kind: 'open', seed: 3 },
    { kind: 'peak', seed: 14, padW: 96, mirror: true, startLowRight: true },
    { kind: 'canyon', seed: 4 },
    { kind: 'cavern', seed: 5, padW: 88, hiddenPad: 2000 },
    { kind: 'cliff', seed: 6, padW: 80 },
    { kind: 'canyon', seed: 12 },
    { kind: 'snake', seed: 19, organic: true },
    { kind: 'canyon', seed: 20, extraDepth: 1500 },
  ];
  function genLevel(n) {
    const spec = LEVELS[clamp(n, 1, LEVELS.length) - 1];
    const s = spec.seed;
    const rnd = mulberry32(s * 9973 + 1337);
    const padW = spec.padW || Math.max(56, 120 - s * 8);
    const L = spec.kind === 'snake' ? genSnake(s, rnd, padW, spec.organic)
      : spec.kind === 'canyon' ? genCanyon(s, rnd, padW, spec)
      : spec.kind === 'cavern' ? genCavern(s, rnd, padW, spec.hard, spec.hiddenPad)
      : spec.kind === 'cliff' ? genCliff(s, rnd, padW)
      : genOpen(s, rnd, padW, spec.kind === 'peak');
    if (spec.mirror) mirrorLevel(L);
    if (spec.startLowRight) {
      // start just above the ground near the bottom right corner
      const x = WORLD_W - 120;
      L.start = { x, y: groundAt(L.lines[0], x) - 110 };
      L.top = L.start.y - 900;
      L.fuel = Math.round(600 + Math.abs(L.start.y - L.pad.y) * 1.2 + Math.abs((L.pad.x1 + L.pad.x2) / 2 - x) * 0.9);
    }
    L.fuel = Math.round(L.fuel * FUEL_SCALE);
    L.n = n; L.kind = spec.kind;
    // collision segments; the one matching the pad exactly is the only safe surface
    const pads = [L.pad, L.hiddenPad].filter(Boolean);
    L.segs = [];
    for (const pts of L.lines) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        const isPad = pads.some((pad) => ay === pad.y && by === pad.y && Math.min(ax, bx) === pad.x1 && Math.max(ax, bx) === pad.x2);
        L.segs.push(withBounds({ ax, ay, bx, by, pad: isPad }));
      }
    }
    return L;
  }
  function mirrorLevel(L) {
    const m = ([x, y]) => [WORLD_W - x, y];
    L.lines = L.lines.map((l) => l.map(m));
    const mp = (p) => ({ ...p, x1: WORLD_W - p.x2, x2: WORLD_W - p.x1 });
    L.pad = mp(L.pad);
    if (L.hiddenPad) L.hiddenPad = mp(L.hiddenPad);
    L.start = { x: WORLD_W - L.start.x, y: L.start.y };
  }
  // highest point of a terrain line at x
  function groundAt(line, x) {
    let y = Infinity;
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, ay] = line[i], [bx, by] = line[i + 1];
      if (x >= Math.min(ax, bx) && x <= Math.max(ax, bx) && ax !== bx) y = Math.min(y, lerp(ay, by, (x - ax) / (bx - ax)));
    }
    return y;
  }
  // a slightly jagged wall rising from (x, y) up to OPEN_TOP, listed top to bottom,
  // so a shaft is open to the sky like the canyons
  const OPEN_TOP = -1400;
  function wallUp(x, y, seed) {
    const h = mulberry32(seed), pts = [];
    for (let yy = y - 130; yy > OPEN_TOP; yy -= 130) pts.unshift([x + (h() - 0.5) * 18, yy]);
    pts.unshift([x, OPEN_TOP]);
    pts.push([x, y]);
    return pts;
  }
  // round off a polyline's corners (Chaikin), keeping its end points
  function smoothLine(pts, iterations) {
    for (let k = 0; k < iterations; k++) {
      const out = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
        out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
      }
      out.push(pts[pts.length - 1]);
      pts = out;
    }
    return pts;
  }

  // Open sky over rolling ground. With peak = true the ship starts low, off to one
  // side, and the pad sits on top of a mountain.
  function genOpen(n, rnd, padW, peak) {
    const X0 = 15, X1 = WORLD_W - 15;
    const base = 640;
    const ground = [];
    let pad, start, mtn = null;
    if (peak) {
      const rise = Math.min(440, 110 + n * 26);
      const side = rnd() < 0.5 ? -1 : 1;
      const half = padW / 2 + 40 + rise * 0.5;   // half-width of the mountain's foot
      const pc = clamp(WORLD_W / 2 + side * (130 + rnd() * 110), X0 + half + 40, X1 - half - 40);
      const top = base - rise;
      pad = { x1: Math.round(pc - padW / 2), x2: Math.round(pc + padW / 2), y: top };
      start = { x: clamp(pc - side * (300 + rnd() * 80), X0 + 70, X1 - 70), y: top - 150 - rnd() * 60 };
      mtn = { a: pc - half, b: pc + half, top, pc };
    } else {
      const x1 = Math.round(lerp(X0 + 90, X1 - 90 - padW, rnd()));
      pad = { x1, x2: x1 + padW, y: base - 10 - Math.round(rnd() * 40) };
      const pc = x1 + padW / 2;
      start = n === 1 ? { x: WORLD_W / 2, y: -120 } : { x: pc > WORLD_W / 2 ? 200 : 800, y: -60 };
    }
    const rough = peak ? 60 : 30 + n * 30;
    const hill = (x) => {
      // rolling ground, with the odd tall spire on rougher levels
      let y = base - 10 - rnd() * rough;
      if (!peak && n > 1 && rnd() < 0.12) y -= rough * 1.6;
      // keep the approach to the pad clear
      const d = x < pad.x1 ? pad.x1 - x : x - pad.x2;
      if (!peak && d < 90) y = Math.max(y, pad.y - d * 0.6);
      if (mtn) y = Math.max(y, mtn.top + 80);
      return y;
    };
    const padEdge = 8;
    const gapA = mtn ? mtn.a : pad.x1 - padEdge, gapB = mtn ? mtn.b : pad.x2 + padEdge;
    ground.push([X0, base - 40 - rnd() * rough]);
    for (let x = X0 + 35; x < gapA - 15; x += 30 + rnd() * 25) ground.push([x, hill(x)]);
    if (mtn) {
      // jagged left slope up to the summit
      for (const t of [0, 0.35, 0.7]) ground.push([lerp(mtn.a, pad.x1 - padEdge, t) + (rnd() - 0.5) * 14, lerp(base - 20, mtn.top + 10, t) + (rnd() - 0.5) * 26]);
    }
    ground.push([pad.x1 - padEdge, pad.y + 10 + rnd() * 10]);
    ground.push([pad.x1, pad.y], [pad.x2, pad.y]);
    ground.push([pad.x2 + padEdge, pad.y + 10 + rnd() * 10]);
    if (mtn) {
      for (const t of [0.3, 0.65, 1]) ground.push([lerp(pad.x2 + padEdge, mtn.b, t) + (rnd() - 0.5) * 14, lerp(mtn.top + 10, base - 20, t) + (rnd() - 0.5) * 26]);
    }
    for (let x = gapB + 30; x < X1 - 20; x += 30 + rnd() * 25) ground.push([x, hill(x)]);
    ground.push([X1, base - 40 - rnd() * rough]);

    const top = start.y - 900;
    const lines = [[[X0, top], ...ground, [X1, top]]];
    const fuel = Math.round(600 + (pad.y - start.y) * 0.5 + Math.abs((pad.x1 + pad.x2) / 2 - start.x) * 0.9);
    return { lines, pad, start, fuel, top };
  }

  // A shaft that winds down to a landing chamber.
  function genCanyon(n, rnd, padW, opts = {}) {
    const depth = 900 + Math.min(n, 12) * 230 + (opts.extraDepth || 0);
    const floorBase = depth + 300;
    const step = 130;
    const rows = [];
    let cx = WORLD_W / 2;
    const minW = Math.max(220, 520 - n * 30);
    for (let y = -1400; y <= depth; y += step) {
      let w = minW + rnd() * 110;
      if (y < 60) w = Math.max(w, 360);
      rows.push({ y, cx, w });
      if (y >= 60) cx += (rnd() - 0.5) * 2 * Math.min(115, 45 + n * 14);
      cx = clamp(cx, w / 2 + 25, WORLD_W - w / 2 - 25);
    }
    // landing chamber
    const last = rows[rows.length - 1];
    const chamberW = Math.max(420, last.w + 120);
    const ccx = clamp(last.cx, chamberW / 2 + 15, WORLD_W - chamberW / 2 - 15);
    rows.push({ y: depth + 120, cx: ccx, w: chamberW });

    const jag = 18;
    const left = [], right = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      left.push([r.cx - r.w / 2 + (rnd() - 0.5) * jag, r.y]);
      right.push([r.cx + r.w / 2 + (rnd() - 0.5) * jag, r.y]);
      if (i < rows.length - 1) {
        const nr = rows[i + 1];
        const my = (r.y + nr.y) / 2;
        const lx = (r.cx - r.w / 2 + nr.cx - nr.w / 2) / 2;
        const rx = (r.cx + r.w / 2 + nr.cx + nr.w / 2) / 2;
        left.push([lx + (rnd() - 0.2) * jag * 1.6, my]);
        right.push([rx - (rnd() - 0.2) * jag * 1.6, my]);
      }
    }

    // floor with landing pad
    const L = ccx - chamberW / 2, R = ccx + chamberW / 2;
    const padX1 = Math.round(lerp(L + 50, R - 50 - padW, rnd()));
    const padX2 = padX1 + padW;
    const amp = 55;
    const padY = Math.round(floorBase - 30 - rnd() * 30);
    const floor = [];
    floor.push([L, floorBase - 40 - rnd() * amp]);
    for (let x = L + 35; x < padX1 - 20; x += 35 + rnd() * 20) floor.push([x, floorBase - 10 - rnd() * amp]);
    floor.push([padX1 - 8, padY + 10 + rnd() * 20]);
    floor.push([padX1, padY], [padX2, padY]);
    floor.push([padX2 + 8, padY + 10 + rnd() * 20]);
    for (let x = padX2 + 30; x < R - 20; x += 35 + rnd() * 20) floor.push([x, floorBase - 10 - rnd() * amp]);
    floor.push([R, floorBase - 40 - rnd() * amp]);
    left.push([L, floor[0][1]]);
    right.push([R, floor[floor.length - 1][1]]);

    const fuel = Math.round(650 + depth * 0.55 - n * 15);
    return {
      lines: [left, right, floor],
      pad: { x1: padX1, x2: padX2, y: padY },
      start: { x: WORLD_W / 2, y: -120 }, fuel, top: -1400,
    };
  }

  // Trace the boundary between open and solid cells of a carved grid, roughening the
  // corners. The pad sits flat on the floor of cells k and k+1 at lattice row padRow.
  // organic: join the cell edges into long walls, round off the square corners and
  // re-roughen them with a canyon-like jagged edge.
  function traceGrid(open, { C, Y0, padRow, k, padW, n, organic }) {
    const ROWS = open.length, COLS = open[0].length;
    const J = 12;
    const vert = (i, j) => {
      const h = mulberry32(i * 7919 + j * 104729 + n * 15485863);
      let dx = (h() - 0.5) * 2 * J, dy = (h() - 0.5) * 2 * J;
      if (i === padRow && j >= k - 1 && j <= k + 3) {
        if (j >= k && j <= k + 2) { dx = 0; dy = 0; } else dy = Math.abs(dy);
      }
      return [j * C + dx, Y0 + i * C + dy];
    };
    const solid = (y, x) => y < 0 || y >= ROWS || x < 0 || x >= COLS || !open[y][x];
    const lines = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!open[y][x]) continue;
        if (y > 0 && solid(y - 1, x)) lines.push([vert(y, x), vert(y, x + 1)]);
        if (solid(y + 1, x) && !(y + 1 === padRow && (x === k || x === k + 1))) lines.push([vert(y + 1, x), vert(y + 1, x + 1)]);
        if (solid(y, x - 1)) lines.push([vert(y, x), vert(y + 1, x)]);
        if (solid(y, x + 1)) lines.push([vert(y, x + 1), vert(y + 1, x + 1)]);
      }
    }
    if (organic) {
      const walls = chainEdges(lines.splice(0));
      walls.forEach((w, i) => lines.push(roughen(w, n * 1009 + i)));
    }
    // openings in the top row lead straight up to open sky
    for (let x = 0; x < COLS; x++) {
      if (!open[0][x]) continue;
      const up = (vx, vy, sd) => (organic ? roughen(wallUp(vx, vy, sd), sd) : wallUp(vx, vy, sd));
      if (x === 0 || !open[0][x - 1]) { const [vx, vy] = vert(0, x); lines.push(up(vx, vy, n * 31 + x)); }
      if (x === COLS - 1 || !open[0][x + 1]) { const [vx, vy] = vert(0, x + 1); lines.push(up(vx, vy, n * 37 + x)); }
    }
    const py = Y0 + padRow * C, xa = k * C, xb = (k + 2) * C, inset = (2 * C - padW) / 2;
    const pad = { x1: xa + inset, x2: xb - inset, y: py };
    lines.push([[xa, py], [pad.x1, py], [pad.x2, py], [xb, py]]);
    return { lines, pad };
  }

  // Join two-point edges that share end points into long polylines.
  function chainEdges(edges) {
    const key = (q) => q[0].toFixed(3) + ',' + q[1].toFixed(3);
    const at = new Map();
    edges.forEach((e, i) => { for (const q of e) { const kk = key(q); if (!at.has(kk)) at.set(kk, []); at.get(kk).push(i); } });
    const used = new Array(edges.length).fill(false);
    const free = (kk) => at.get(kk).filter((i) => !used[i]);
    const walk = (kk) => {
      const path = [];
      for (let next = free(kk); next.length; next = free(kk)) {
        const e = edges[next[0]];
        used[next[0]] = true;
        const [a, b] = key(e[0]) === kk ? e : [e[1], e[0]];
        if (!path.length) path.push(a);
        path.push(b);
        kk = key(b);
      }
      return path;
    };
    const paths = [];
    // open runs start at their loose ends, then whatever is left is closed loops
    for (const [kk, list] of at) if (list.length % 2) while (free(kk).length) paths.push(walk(kk));
    for (const kk of at.keys()) while (free(kk).length) paths.push(walk(kk));
    return paths;
  }
  // Round a wall's corners, then re-sample it with an uneven, jagged edge and a slow
  // in-and-out wobble like the canyon walls. The end points stay put so walls still
  // meet the pad and each other exactly.
  function roughen(path, seed) {
    const pts = smoothLine(path, 3);
    const h = mulberry32(seed);
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const JAG = 15, WOBBLE = 10, phase = h() * Math.PI * 2, out = [pts[0]];
    const step = () => 38 + h() * 34;
    let d = 0, next = step();
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const len = Math.hypot(bx - ax, by - ay);
      while (len > 0 && next <= d + len && next < total - 30) {
        const t = (next - d) / len, x = lerp(ax, bx, t), y = lerp(ay, by, t);
        // no jag right next to the ends, so the floor beside the pad stays level
        const fade = clamp(Math.min(next, total - next) / 60 - 1, 0, 1);
        const j = fade * ((h() - 0.5) * 2 * JAG + Math.sin(next / 95 + phase) * WOBBLE);
        out.push([x - ((by - ay) / len) * j, y + ((bx - ax) / len) * j]);
        next += step();
      }
      d += len;
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  // Switchback tunnels: carve corridors into a grid of rock, each one running the
  // full width and dropping into the next at the opposite end, then trace the
  // outline with roughened corners.
  function genSnake(n, rnd, padW, organic) {
    const C = 50, COLS = WORLD_W / C, Y0 = -300;
    const K = clamp(1 + Math.floor(n / 3), 3, 5);   // number of corridors
    const CH = 4, LAST_H = 5, BAND = 4, SHAFT = 4;
    const corr = [];
    let r = 4;                                        // rows 0-3 are the entry shaft
    for (let i = 0; i < K; i++) {
      const h = i === K - 1 ? LAST_H : CH;
      corr.push({ top: r, bot: r + h - 1 });
      r += h + BAND;
    }
    const ROWS = corr[K - 1].bot + 2;
    const open = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    const carve = (r0, r1, c0, c1, v = true) => {
      for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
        if (y >= 0 && y < ROWS && x >= 1 && x <= COLS - 2) open[y][x] = v;
      }
    };
    const ends = (s) => (s === 0 ? [1, SHAFT] : [COLS - 1 - SHAFT, COLS - 2]);

    let side = rnd() < 0.5 ? 0 : 1;                   // 0: enter the corridor at its left end
    const [s0, s1] = ends(side);
    carve(0, corr[0].top - 1, s0, s1);
    const start = { x: (s0 + s1 + 1) / 2 * C, y: Y0 + 1.6 * C };

    // pad on the floor of the last corridor, in the far half from where you drop in
    const lastSide = (side + K - 1) % 2;
    const k = lastSide === 0 ? 11 + Math.floor(rnd() * 5) : 7 - Math.floor(rnd() * 5);
    const padRow = corr[K - 1].bot + 1;

    const bumpP = Math.min(0.32, 0.08 + n * 0.02);
    for (let i = 0; i < K; i++) {
      const c = corr[i];
      carve(c.top, c.bot, 1, COLS - 2);
      const [x0, x1] = ends(1 - side);
      if (i < K - 1) carve(c.bot + 1, corr[i + 1].top - 1, x0, x1);
      const lo = SHAFT + 2, hi = COLS - SHAFT - 3;
      const nearPad = (col) => i === K - 1 && col >= k - 2 && col <= k + 3;
      // the odd taller pocket or dip in the corridor
      if (rnd() < 0.6) {
        const w = 2 + Math.floor(rnd() * 3), at = lo + Math.floor(rnd() * (hi - lo - w));
        const up = rnd() < 0.5;
        let clear = true;
        for (let col = at; col < at + w; col++) if (nearPad(col)) clear = false;
        if (clear) {
          const row = up ? c.top - 1 : c.bot + 1;
          if (up ? i > 0 : i < K - 1) carve(row, row, at, at + w - 1);
        }
      }
      // stalactites and stalagmites, never two in neighbouring columns, always attached to rock
      for (let col = lo; col <= hi; col++) {
        if (nearPad(col) || rnd() > bumpP) continue;
        const up = rnd() < 0.5;
        if (up ? open[c.top - 1][col] : open[c.bot + 1][col]) continue;   // keep outcrops attached to rock
        if (up) open[c.top][col] = false; else open[c.bot][col] = false;
        col++;
      }
      side = 1 - side;
    }

    const { lines, pad } = traceGrid(open, { C, Y0, padRow, k, padW, n, organic });

    const pathLen = K * (COLS - 2 - SHAFT) * C + ROWS * C;
    return { lines, pad, start, fuel: Math.round(400 + pathLen * 0.9), top: Y0 - 1000 };
  }

  // Drop down a canyon, then turn sideways and climb up through a cavern to a pad
  // on the floor of an upper chamber. hard: narrower, deeper, with a dog-leg on the
  // way up and outcrops in the bottom tunnel.
  function genCavern(n, rnd, padW, hard, hiddenBonus) {
    const C = 50, COLS = WORLD_W / C, Y0 = -300;
    const SW = hard ? 3 : 4;                 // passage width in cells
    const D = hard ? 25 : 18;                // bottom row of the drop
    const ROWS = D + 2;
    const open = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    const carve = (r0, r1, c0, c1) => {
      for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
        if (y >= 0 && y < ROWS && x >= 1 && x <= COLS - 2) open[y][x] = true;
      }
    };
    // the drop: a shaft that drifts a little from side to side
    let col = 2;
    const startCol = col;
    for (let r = 0; r <= D; r++) {
      if (r > 3 && r % (hard ? 2 : 3) === 0) col = clamp(col + Math.floor(rnd() * 3) - 1, 1, hard ? 5 : 4);
      carve(r, r, col, col + SW - 1);
    }
    const TH = hard ? 3 : 4;                 // bottom tunnel height
    let padRow, k, climb;
    if (!hard) {
      // bottom tunnel -> one shaft up -> chamber to the side with the pad
      carve(D - TH + 1, D, col, 15);
      carve(3, D, 12, 15);
      carve(3, 6, 12, 18);
      padRow = 7; k = 16; climb = (D - 5) * C;
    } else {
      // bottom tunnel -> shaft up -> sideways back -> shaft up -> low chamber with the pad
      carve(D - TH + 1, D, col, 17);
      carve(14, D, 15, 17);
      carve(14, 16, 10, 17);
      carve(3, 16, 10, 12);
      carve(3, 5, 10, 17);
      padRow = 6; k = 14; climb = (D - 4) * C;
      // outcrops along the bottom tunnel, always attached to rock
      for (let c = col + SW + 1; c <= 13; c++) {
        if (rnd() > 0.35) continue;
        const up = rnd() < 0.5, r = up ? D - TH + 1 : D;
        if (up ? open[r - 1][c] : open[r + 1][c]) continue;
        open[r][c] = false; c++;
      }
    }
    const { lines, pad } = traceGrid(open, { C, Y0, padRow, k, padW, n: n + 500 });
    const start = { x: (startCol + SW / 2) * C, y: Y0 + 1.5 * C };
    const across = Math.abs((pad.x1 + pad.x2) / 2 - start.x);
    const L = { lines, pad, start, top: Y0 - 1000, fuel: Math.round(700 + D * C * 0.5 + across * 1.2 + climb * 1.6) };
    if (hiddenBonus) {
      // Hidden pad: the inner wall of the drop shaft stops at a cliff top well above the
      // start, out of view, and the rock behind it forms a plateau with a second pad.
      const inner = lines.filter((l) => l[0][1] === OPEN_TOP).sort((a, b) => b[0][0] - a[0][0])[0];
      const topY = -760;
      const face = inner.filter((q) => q[1] > topY + 30);
      const edgeX = Math.round(face[0][0]);
      const hp = { x1: edgeX + 45, x2: edgeX + 45 + 80, y: topY, bonus: hiddenBonus };
      const R = WORLD_W - 15;
      const plateau = [[R, OPEN_TOP], [R, topY - 10]];
      for (let x = R - 40; x > hp.x2 + 30; x -= 35 + rnd() * 25) plateau.push([x, topY - 4 - rnd() * 22]);
      plateau.push([hp.x2 + 8, topY + 6], [hp.x2, topY], [hp.x1, topY], [hp.x1 - 8, topY + 6], [edgeX, topY + 4], ...face);
      lines[lines.indexOf(inner)] = plateau;
      L.hiddenPad = hp;
    }
    if (rnd() < 0.5) mirrorLevel(L);
    return L;
  }

  // A canyon you start at the bottom of; the pad is on a ledge sticking out of one wall.
  function genCliff(n, rnd, padW) {
    const depth = 1300, step = 130;
    const rows = [];
    let cx = WORLD_W / 2;
    for (let y = 0; y <= depth; y += step) {
      const w = 390 + rnd() * 110;
      cx = clamp(cx, w / 2 + 25, WORLD_W - w / 2 - 25);
      rows.push({ y, cx, w });
      cx += (rnd() - 0.5) * 2 * 70;
    }
    const last = rows[rows.length - 1];
    const chamberW = Math.max(460, last.w + 100);
    const ccx = clamp(last.cx, chamberW / 2 + 15, WORLD_W - chamberW / 2 - 15);
    rows.push({ y: depth + 120, cx: ccx, w: chamberW });
    const jag = 18;
    let left = [], right = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      left.push([r.cx - r.w / 2 + (rnd() - 0.5) * jag, r.y]);
      right.push([r.cx + r.w / 2 + (rnd() - 0.5) * jag, r.y]);
      if (i < rows.length - 1) {
        const nr = rows[i + 1], my = (r.y + nr.y) / 2;
        left.push([(r.cx - r.w / 2 + nr.cx - nr.w / 2) / 2 + (rnd() - 0.2) * jag * 1.6, my]);
        right.push([(r.cx + r.w / 2 + nr.cx + nr.w / 2) / 2 - (rnd() - 0.2) * jag * 1.6, my]);
      }
    }
    // the ledge on the right wall, about a quarter of the way down
    const li = 3, ly = rows[li].y;
    const ai = right.findIndex((q) => q[1] === ly);
    const xr = Math.round(right[ai][0]);
    right[ai] = [xr, ly];
    const pad = { x2: xr - 18, x1: xr - 18 - padW, y: ly };
    // keep the wall above the ledge set back so nothing overhangs the pad
    for (const q of right) if (q[1] < ly && q[1] >= ly - 320) q[0] = Math.max(q[0], xr + 4);
    const below = right.findIndex((q) => q[1] > ly + 150);
    right = [
      ...right.slice(0, ai + 1),
      [pad.x2, ly], [pad.x1, ly], [pad.x1 - 10, ly + 12],
      [lerp(pad.x1, right[below][0], 0.45), ly + 75],
      ...right.slice(below),
    ];
    // floor of the bottom chamber
    const L = ccx - chamberW / 2, R = ccx + chamberW / 2, floorBase = depth + 300;
    const floor = [[L, floorBase - 40 - rnd() * 40]];
    for (let x = L + 35; x < R - 20; x += 35 + rnd() * 20) floor.push([x, floorBase - 10 - rnd() * 45]);
    floor.push([R, floorBase - 40 - rnd() * 40]);
    left.push([L, floor[0][1]]);
    right.push([R, floor[floor.length - 1][1]]);
    // the walls rise to open sky (the draws keep the random sequence, and so the map, as it was)
    for (let i = 0; i < 4; i++) rnd();
    left = [...wallUp(left[0][0], left[0][1], n * 41).slice(0, -1), ...left];
    right = [...wallUp(right[0][0], right[0][1], n * 43).slice(0, -1), ...right];
    const start = { x: ccx, y: floorBase - 170 };
    const Lv = { lines: [left, right, floor], pad, start, top: -1500, fuel: Math.round(700 + (start.y - ly) * 0.9) };
    if (rnd() < 0.5) mirrorLevel(Lv);
    return Lv;
  }

  // ---------- Audio ----------
  let actx = null, sfxOut = null, thrustGain = null, noiseBuf = null, crunchBuf = null, echoIn = null;
  // background music: starts on the first key/tap (browsers block autoplay) and loops forever
  const music = new Audio('astrolander.mp3');
  music.loop = true; music.volume = 0.35;
  let musicOn = false;
  try { music.muted = localStorage.getItem('astrolander-music-muted') === '1'; } catch (_) {}
  function toggleMusicMute() {
    music.muted = !music.muted;
    try { localStorage.setItem('astrolander-music-muted', music.muted ? '1' : '0'); } catch (_) {}
    $('musicBtn').classList.toggle('muted', music.muted);
    $('musicBtn').setAttribute('aria-pressed', String(music.muted));
  }
  function playMusic() {
    if (musicOn && music.paused && state !== 'paused' && !document.hidden) music.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) music.pause(); else playMusic(); });
  function initAudio() {
    musicOn = true; playMusic();
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      // master volume for all sound effects (the music is a separate <audio> element)
      sfxOut = actx.createGain(); sfxOut.gain.value = 1.35;
      sfxOut.connect(actx.destination);
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const lp = actx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 340;
      thrustGain = actx.createGain(); thrustGain.gain.value = 0;
      src.connect(lp).connect(thrustGain).connect(sfxOut);
      src.start();
      // 8-bit style noise: sample-and-hold steps give the crunchy NES noise channel sound
      crunchBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
      const cd = crunchBuf.getChannelData(0);
      for (let i = 0, v = 0; i < cd.length; i++) { if (i % 24 === 0) v = Math.random() < 0.5 ? -1 : 1; cd[i] = v; }
      // 80s tape-style echo bus for the synth sounds
      echoIn = actx.createGain();
      const delay = actx.createDelay(1); delay.delayTime.value = 0.19;
      const fb = actx.createGain(); fb.gain.value = 0.32;
      const wet = actx.createGain(); wet.gain.value = 0.3;
      echoIn.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(sfxOut);
    } catch (e) { actx = null; }
  }
  function setThrustSound(on) {
    if (!thrustGain) return;
    thrustGain.gain.setTargetAtTime(on ? 0.48 : 0, actx.currentTime, 0.03);
  }
  // ---------- Retro synth (every sound except the thruster) ----------
  // NES-style pulse waves with a chosen duty cycle (0.5 = square, 0.25 / 0.125 = thinner)
  const pulseWaves = {};
  function pulseWave(duty) {
    if (!pulseWaves[duty]) {
      const n = 48, re = new Float32Array(n), im = new Float32Array(n);
      for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
      pulseWaves[duty] = actx.createPeriodicWave(re, im);
    }
    return pulseWaves[duty];
  }
  let driveCurveCache = null;
  function driveCurve() {
    if (!driveCurveCache) {
      const n = 1024; driveCurveCache = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; driveCurveCache[i] = Math.tanh(2.5 * x) / Math.tanh(2.5); }
    }
    return driveCurveCache;
  }
  // one synth note: pulse duty (number) or oscillator type (string), optional pitch slide,
  // detuned unison, resonant filter sweep, vibrato and echo send
  function tone({ freq, to = freq, dur, when = 0, vol = 0.06, wave = 0.5, attack = 0.004, detune = 0, cutoff = 0, q = 7, vibrato = 0, drive = 0, echo = false }) {
    if (!actx) return;
    const t = actx.currentTime + when;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (drive) {
      // overdrive: boost into a soft clipper, then scale back so only the edge changes, not the level
      const pre = actx.createGain(), post = actx.createGain(), clip = actx.createWaveShaper();
      pre.gain.value = drive; post.gain.value = 1 / drive;
      clip.curve = driveCurve(); clip.oversample = '4x';
      g.connect(pre).connect(clip).connect(post).connect(sfxOut);
    } else g.connect(sfxOut);
    if (echo) g.connect(echoIn);
    let head = g;
    if (cutoff) {
      const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = q;
      f.frequency.setValueAtTime(cutoff, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(90, to * 1.5), t + dur);
      f.connect(g); head = f;
    }
    for (const d of detune ? [-detune, detune] : [0]) {
      const o = actx.createOscillator();
      if (typeof wave === 'number') o.setPeriodicWave(pulseWave(wave)); else o.type = wave;
      o.frequency.setValueAtTime(freq, t);
      if (to !== freq) o.frequency.exponentialRampToValueAtTime(to, t + dur);
      o.detune.value = d;
      if (vibrato) {
        const lfo = actx.createOscillator(), depth = actx.createGain();
        lfo.frequency.value = 6.5; depth.gain.value = freq * vibrato;
        lfo.connect(depth).connect(o.frequency);
        lfo.start(t); lfo.stop(t + dur + 0.05);
      }
      o.connect(head);
      o.start(t); o.stop(t + dur + 0.05);
    }
  }
  // 8-bit explosion: crunchy stepped noise whose pitch drops, plus a falling pulse sweep
  function bang(dur = 1.2, vol = 0.7) {
    if (!actx) return;
    const t = actx.currentTime;
    const src = actx.createBufferSource(); src.buffer = crunchBuf; src.loop = true;
    src.playbackRate.setValueAtTime(1, t);
    src.playbackRate.exponentialRampToValueAtTime(0.12, t + dur);
    const g = actx.createGain();
    g.gain.setValueAtTime(vol * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(g).connect(sfxOut);
    src.start(t); src.stop(t + dur + 0.05);
    tone({ freq: 520, to: 40, dur: 0.6, wave: 0.25, vol: vol * 0.12 });
  }
  // short UI sounds
  // the UI sounds use thin pulse waves and light overdrive for a grittier edge
  const sfx = {
    landed() { // 8-bit victory arpeggio with octave jumps, ending on a vibrato chord
      [523.25, 1046.5, 659.25, 1318.5, 783.99].forEach((f, i) => tone({ freq: f, dur: 0.07, when: i * 0.055, wave: 0.125, vol: 0.055, drive: 7 }));
      tone({ freq: 1046.5, dur: 0.55, when: 0.275, wave: 0.125, vol: 0.055, vibrato: 0.015, drive: 7, echo: true });
      tone({ freq: 1318.5, dur: 0.55, when: 0.275, wave: 0.25, vol: 0.035, vibrato: 0.015, drive: 7, echo: true });
    },
    coin() { // classic two-note coin pickup
      tone({ freq: 987.77, dur: 0.07, wave: 0.25, vol: 0.05, drive: 6 });
      tone({ freq: 1318.5, dur: 0.28, when: 0.07, wave: 0.25, vol: 0.05, drive: 6 });
    },
    select() { tone({ freq: 900, to: 720, dur: 0.04, wave: 0.125, vol: 0.045, drive: 6 }); },
    confirm() { // 80s synth chirp: detuned saws screaming up through a resonant filter
      tone({ freq: 523.25, to: 1046.5, dur: 0.15, wave: 'sawtooth', detune: 14, cutoff: 4800, q: 13, vol: 0.06, drive: 6, echo: true });
    },
  };
  // the famous two-note heartbeat, quickening as fuel runs down
  let beatTimer = 0, beatHigh = false;
  function updateBeat(dt) {
    beatTimer -= dt;
    if (beatTimer > 0) return;
    const frac = clamp(ship.fuel / level.fuel, 0, 1);
    beatTimer = lerp(0.28, 1.0, frac);
    beatHigh = !beatHigh;
    // 80s analog bass pluck: two detuned saws through a snappy resonant filter, lightly overdriven
    tone({ freq: beatHigh ? 62 : 55, dur: 0.2, wave: 'sawtooth', detune: 11, cutoff: 2600, q: 12, vol: 0.2, drive: 4 });
  }

  // ---------- Input ----------
  const input = { left: false, right: false, thrust: false };
  const keyMap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'thrust', KeyW: 'thrust', Space: 'thrust' };
  window.addEventListener('keydown', (e) => {
    initAudio();
    if (state === 'entry' && !e.repeat) {
      if (/^[a-zA-Z]$/.test(e.key)) { entryType(e.key.toUpperCase()); e.preventDefault(); return; }
      if (e.code === 'Backspace') { entryBack(); e.preventDefault(); return; }
    }
    if (e.code === 'Enter' && !e.repeat) { press('thrust'); e.preventDefault(); return; }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) { togglePause(); return; }
    if (e.code === 'KeyM' && !e.repeat) { toggleMusicMute(); return; }
    const k = keyMap[e.code];
    if (!k) return;
    e.preventDefault();
    if (!input[k] && !e.repeat) { input[k] = true; press(k); }
    input[k] = true;
  });
  window.addEventListener('keyup', (e) => { const k = keyMap[e.code]; if (k) input[k] = false; });
  window.addEventListener('blur', () => { input.left = input.right = input.thrust = false; });

  function bindHold(el, key) {
    const pointers = new Set();
    const update = () => { input[key] = pointers.size > 0; el.classList.toggle('active', input[key]); };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); initAudio();
      const was = pointers.size > 0;
      pointers.add(e.pointerId);
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      update();
      if (!was) press(key);
    });
    const up = (e) => { pointers.delete(e.pointerId); update(); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  bindHold($('btnLeft'), 'left');
  bindHold($('btnRight'), 'right');
  bindHold($('btnThrust'), 'thrust');
  $('pauseBtn').addEventListener('click', () => togglePause());
  $('musicBtn').addEventListener('click', () => { initAudio(); toggleMusicMute(); });
  $('musicBtn').classList.toggle('muted', music.muted);
  $('musicBtn').setAttribute('aria-pressed', String(music.muted));

  // ---------- Game state ----------
  // title | ready | flying | paused | crashed | results | gameover | complete | entry | board
  let state = 'title', stateAge = 0;
  let level = null, levelNum = 1, score = 0, lives = START_LIVES;
  let ship = null, cam = { x: WORLD_W / 2, y: 0 };
  let particles = [], debris = [];
  let stateTimer = 0, time = 0, frameNo = 0;
  let tally = null, entry = null, flash = '';
  let board = [], boardLoaded = false, highlightId = null;

  function setState(s) {
    state = s; stateAge = 0;
    $('pauseBtn').classList.toggle('hidden', s !== 'flying' && s !== 'paused');
    if (s !== 'flying') setThrustSound(false);
    if (s === 'paused') music.pause(); else playMusic();
  }

  function press(key) {
    switch (state) {
      case 'title':
        if (key === 'thrust' && stateAge > 0.4) startGame();
        break;
      case 'results':
        if (key !== 'thrust') break;
        if (!tally.ready) finishTally(); else if (stateAge > 0.3) nextLevel();
        break;
      case 'paused':
        if (key === 'thrust') togglePause();
        else if (key === 'left') toTitle();
        break;
      case 'gameover':
      case 'complete':
        if (key === 'thrust' && stateAge > 1) afterGameOver();
        break;
      case 'entry':
        if (key === 'left') entryCycle(-1);
        else if (key === 'right') entryCycle(1);
        else if (key === 'thrust') entryConfirm();
        break;
      case 'board':
        if (key === 'thrust' && stateAge > 0.5) toTitle();
        break;
    }
  }

  function resetShip() {
    ship = { x: level.start.x, y: level.start.y, vx: 0, vy: 0, a: 0, fuel: level.fuel, thrusting: false, alive: true, spin: 0, spins: 0 };
    cam.x = ship.x; cam.y = ship.y + 60;
  }
  function startGame() {
    score = 0; lives = START_LIVES; levelNum = 1;
    loadLevel();
  }
  function loadLevel() {
    level = genLevel(levelNum);
    resetShip();
    particles = []; debris = [];
    setState('ready'); stateTimer = 2;
  }
  function nextLevel() {
    if (levelNum >= LEVELS.length) { setState('complete'); stateTimer = 5; return; }
    levelNum++; loadLevel();
  }
  function togglePause() {
    if (state === 'flying') setState('paused');
    else if (state === 'paused') setState('flying');
  }
  function toTitle() {
    level = genLevel(1); resetShip(); ship.alive = false;
    particles = []; debris = [];
    setState('title');
    loadBoard();
  }

  // ---------- Simulation ----------
  function shipPoly(sx, sy, a, pts) {
    const c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y]) => [sx + x * c - y * s, sy + x * s + y * c]);
  }

  function collide() {
    const poly = shipPoly(ship.x, ship.y, ship.a, HULL);
    let hit = false, onlyPad = true;
    const bx0 = ship.x - 16, bx1 = ship.x + 16, by0 = ship.y - 16, by1 = ship.y + 16;
    const test = (s) => {
      if (s.maxX < bx0 || s.minX > bx1 || s.maxY < by0 || s.minY > by1) return;
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i], q = poly[(i + 1) % poly.length];
        if (segIntersect(p[0], p[1], q[0], q[1], s.ax, s.ay, s.bx, s.by)) {
          hit = true; if (!s.pad) onlyPad = false; return;
        }
      }
    };
    for (const s of level.segs) test(s);
    return { hit, onlyPad };
  }

  function update(dt) {
    time += dt; stateAge += dt; frameNo++;
    updateParticles(dt);

    switch (state) {
      case 'title': attractCamera(); return;
      case 'ready':
        stateTimer -= dt;
        if (stateTimer <= 0) setState('flying');
        updateCamera(dt);
        return;
      case 'crashed':
        stateTimer -= dt;
        if (stateTimer <= 0) {
          if (lives <= 0) { setState('gameover'); stateTimer = 3; }
          else { resetShip(); particles = []; debris = []; setState('ready'); stateTimer = 1.5; }
        }
        return;
      case 'results': updateTally(dt); updateCamera(dt); return;
      case 'gameover':
      case 'complete':
        stateTimer -= dt;
        if (stateTimer <= 0) afterGameOver();
        return;
      case 'entry': updateEntryRepeat(dt); return;
      case 'board':
        if (stateAge > 12) toTitle();
        return;
      case 'flying': break;
      default: return;
    }

    const steps = 4, h = dt / steps;
    for (let i = 0; i < steps; i++) {
      if (input.left) { ship.a -= ROT_SPEED * h; ship.spin -= ROT_SPEED * h; }
      if (input.right) { ship.a += ROT_SPEED * h; ship.spin += ROT_SPEED * h; }
      // count full turns in either direction; turning back undoes progress on the current one
      if (Math.abs(ship.spin) >= Math.PI * 2) { ship.spins++; ship.spin -= Math.sign(ship.spin) * Math.PI * 2; }
      ship.a = wrapAngle(ship.a);
      ship.thrusting = input.thrust && ship.fuel > 0;
      let ax = 0, ay = GRAVITY;
      if (ship.thrusting) {
        ax += Math.sin(ship.a) * THRUST;
        ay -= Math.cos(ship.a) * THRUST;
        ship.fuel = Math.max(0, ship.fuel - BURN_RATE * h);
      }
      ship.vx += ax * h; ship.vy += ay * h;
      ship.x += ship.vx * h; ship.y += ship.vy * h;

      if (ship.y < level.top + 300) { ship.y = level.top + 300; ship.vy = Math.max(ship.vy, 0); }
      if (ship.x < -200 || ship.x > WORLD_W + 200) { crash(); return; }

      const c = collide();
      if (c.hit) {
        const feet = shipPoly(ship.x, ship.y, ship.a, FEET);
        const p = [level.pad, level.hiddenPad].find((q) => q && Math.abs(ship.y + FOOT_Y - q.y) < 20 &&
          feet.every(([fx]) => fx >= q.x1 - 1 && fx <= q.x2 + 1));
        const upright = Math.abs(ship.a) <= SAFE_ANGLE;
        const slow = ship.vy <= SAFE_VY && Math.abs(ship.vx) <= SAFE_VX;
        if (c.onlyPad && p && upright && slow) land(p);
        else crash();
        return;
      }
    }
    setThrustSound(ship.thrusting);
    updateBeat(dt);
    updateCamera(dt);
  }

  function updateCamera(dt) {
    if (!ship) return;
    const viewW = W / scale;
    const tx = viewW >= WORLD_W + 40 ? WORLD_W / 2 : clamp(ship.x, viewW / 2 - 20, WORLD_W - viewW / 2 + 20);
    const lookAhead = clamp(ship.vy * 0.6, -60, 90);
    const ty = ship.y + 40 + lookAhead;
    const k = 1 - Math.exp(-dt * 4);
    cam.x = lerp(cam.x, tx, k); cam.y = lerp(cam.y, ty, k);
  }
  function attractCamera() {
    const t = performance.now();
    cam.y = Math.sin(t / 4000) * 80 + 250; cam.x = WORLD_W / 2 + Math.sin(t / 6000) * 150;
  }

  function updateParticles(dt) {
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    particles = particles.filter((p) => p.life > 0);
    for (const d of debris) { d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.va * dt; d.life -= dt; }
    debris = debris.filter((d) => d.life > 0);
  }

  function crash() {
    ship.alive = false; ship.thrusting = false;
    bang(1.4, 0.8);
    lives--;
    setState('crashed'); stateTimer = 2.8;
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 110;
      particles.push({ x: ship.x, y: ship.y, vx: Math.cos(a) * sp + ship.vx * 0.2, vy: Math.sin(a) * sp + ship.vy * 0.2, life: 0.5 + Math.random() * 1.1 });
    }
    // the ship's outline breaks apart and drifts, just like the arcade original
    const pts = shipPoly(ship.x, ship.y, ship.a, [[0, -12], [8, 10], [-8, 10], [-6, 6], [6, 6]]);
    for (const [i, j] of [[0, 1], [0, 2], [3, 4]]) {
      const p = pts[i], q = pts[j];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      debris.push({ x: mx, y: my, len: Math.hypot(q[0] - p[0], q[1] - p[1]), a: Math.atan2(q[1] - p[1], q[0] - p[0]), va: (Math.random() - 0.5) * 3, vx: (mx - ship.x) * 2.5 + (Math.random() - 0.5) * 20, vy: (my - ship.y) * 2.5 + (Math.random() - 0.5) * 20, life: 2.6 });
    }
  }

  function land(p) {
    ship.vy = Math.max(0, ship.vy);
    const speed = Math.hypot(ship.vx, ship.vy);
    ship.y = p.y - FOOT_Y;
    ship.thrusting = false;

    const fuelLeft = Math.floor(ship.fuel);
    const fuelBonus = fuelLeft * FUEL_BONUS_PER_UNIT;
    const speedBonus = Math.round(MAX_SPEED_BONUS * clamp(1 - speed / Math.hypot(SAFE_VX, SAFE_VY), 0, 1));
    const padC = (p.x1 + p.x2) / 2, half = (p.x2 - p.x1) / 2 - 8;
    const accuracyBonus = Math.round(MAX_ACCURACY_BONUS * clamp(1 - Math.abs(ship.x - padC) / Math.max(half, 1), 0, 1));
    const spinBonus = ship.spins * SPIN_BONUS;
    ship.vx = ship.vy = 0; ship.a = 0;
    tally = {
      rows: [
        { label: 'FUEL REMAINING', value: fuelLeft, add: false },
        { label: 'FUEL BONUS', value: fuelBonus, add: true },
        { label: 'LANDING SPEED BONUS', value: speedBonus, add: true },
        { label: 'LANDING ACCURACY BONUS', value: accuracyBonus, add: true },
        ...(spinBonus ? [{ label: 'SPIN BONUS X' + ship.spins, value: spinBonus, add: true }] : []),
        ...(p.bonus ? [{ label: 'HIDDEN PAD BONUS', value: p.bonus, add: true }] : []),
        { label: 'TOTAL', value: fuelBonus + speedBonus + accuracyBonus + spinBonus + (p.bonus || 0), add: false },
      ],
      i: -1, t: 0, pause: 0.6, ready: false,
    };
    for (const r of tally.rows) { r.shown = 0; r.visible = false; r.done = false; }
    setState('results');
    sfx.landed();
  }

  // ---------- Results tally ----------
  function updateTally(dt) {
    if (tally.ready) return;
    if (tally.pause > 0) { tally.pause -= dt; return; }
    if (tally.i < 0 || tally.rows[tally.i].done) {
      tally.i++;
      if (tally.i >= tally.rows.length) { tally.ready = true; return; }
      const r = tally.rows[tally.i];
      r.visible = true; r.dur = Math.min(0.9, 0.25 + r.value / 3000); tally.t = 0;
    }
    const r = tally.rows[tally.i];
    tally.t += dt;
    const k = clamp(tally.t / r.dur, 0, 1);
    r.shown = Math.round(r.value * k);
    if (k >= 1) {
      r.done = true;
      if (r.add) score += r.value;
      sfx.coin();
      tally.pause = 0.28;
    }
  }
  function finishTally() {
    for (const r of tally.rows) {
      if (!r.done && r.add) score += r.value;
      r.done = true; r.visible = true; r.shown = r.value;
    }
    tally.i = tally.rows.length; tally.ready = true;
  }

  // ---------- High scores ----------
  async function loadBoard() {
    try {
      const res = await fetch('/api/scores');
      const data = await res.json();
      if (res.ok) { board = data.scores; boardLoaded = true; }
    } catch (_) { /* offline: keep whatever we had */ }
  }
  function qualifies() {
    if (score <= 0) return false;
    return board.length < 10 || score > Number(board[board.length - 1].score);
  }
  function afterGameOver() {
    if (qualifies() || (!boardLoaded && score > 0)) {
      let saved = '';
      try { saved = localStorage.getItem('astrolander-initials') || ''; } catch (_) {}
      entry = { letters: ['A', '_', '_'], idx: 0, hold: 0, repeat: 0, done: false };
      if (/^[A-Z_]{3}$/.test(saved)) entry.letters = [saved[0], '_', '_'];
      setState('entry');
    } else {
      highlightId = null;
      setState('board');
    }
  }
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_';
  function entryCycle(dir) {
    if (entry.done) return;
    const i = LETTERS.indexOf(entry.letters[entry.idx]);
    entry.letters[entry.idx] = LETTERS[(i + dir + LETTERS.length) % LETTERS.length];
    sfx.select();
  }
  function updateEntryRepeat(dt) {
    const dir = input.left ? -1 : input.right ? 1 : 0;
    if (!dir) { entry.hold = 0; return; }
    entry.hold += dt;
    if (entry.hold > 0.4) {
      entry.repeat -= dt;
      if (entry.repeat <= 0) { entryCycle(dir); entry.repeat = 0.11; }
    }
  }
  function entryType(ch) {
    if (entry.done) return;
    entry.letters[entry.idx] = ch;
    entryConfirm();
  }
  function entryBack() {
    if (entry.done || entry.idx === 0) return;
    entry.letters[entry.idx] = '_';
    entry.idx--;
  }
  function entryConfirm() {
    if (entry.done) return;
    sfx.confirm();
    if (entry.idx < 2) {
      entry.idx++;
      entry.letters[entry.idx] = entry.letters[entry.idx] === '_' ? 'A' : entry.letters[entry.idx];
      return;
    }
    entry.done = true;
    submitScore(entry.letters.join(''));
  }
  async function submitScore(initials) {
    try { localStorage.setItem('astrolander-initials', initials); } catch (_) {}
    const name = initials.replace(/_/g, ' ').trim() || '---';
    flash = '';
    try {
      const res = await fetch('/api/scores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, level: levelNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      board = data.scores; boardLoaded = true; highlightId = data.id;
    } catch (_) {
      flash = 'SCORE NOT SAVED';
      highlightId = null;
    }
    setState('board');
  }

  // ---------- Rendering primitives ----------
  function glow(lw, alpha = 1) {
    ctx.globalAlpha = alpha * 0.22; ctx.lineWidth = lw * 3.2; ctx.stroke();
    ctx.globalAlpha = alpha; ctx.lineWidth = lw; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  function vtext(str, x, y, size, align = 'left', alpha = 1) {
    str = String(str).toUpperCase();
    const u = size / 6;
    const w = str.length * size - 2 * u;
    let ox = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.beginPath();
    for (const ch of str) {
      for (const stroke of FONT[ch] || []) {
        stroke.forEach(([px, py], i) => {
          const X = ox + px * u, Y = y + py * u;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        });
      }
      ox += size;
    }
    glow(Math.max(1.1, size / 9), alpha);
  }
  function screenSpace() { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  function applyCam() {
    ctx.setTransform(DPR * scale, 0, 0, DPR * scale, DPR * (W / 2 - cam.x * scale), DPR * (H * 0.45 - cam.y * scale));
  }
  function worldToScreen(x, y) {
    return [(x - cam.x) * scale + W / 2, (y - cam.y) * scale + H * 0.45];
  }
  function polyPath(pts, closed) {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }

  // ---------- World rendering ----------
  function drawTerrain() {
    applyCam();
    const { lines, pad } = level;
    const lw = 1.3 / scale;
    ctx.beginPath();
    for (const l of lines) polyPath(l);
    glow(lw, 0.8);

    // landing pads: a brighter, thicker double line with blinking end markers
    const bright = 0.75 + 0.25 * Math.sin(time * 6);
    for (const p of [pad, level.hiddenPad]) {
      if (!p) continue;
      ctx.beginPath();
      ctx.moveTo(p.x1, p.y); ctx.lineTo(p.x2, p.y);
      ctx.moveTo(p.x1 + 4, p.y + 4); ctx.lineTo(p.x2 - 4, p.y + 4);
      glow(2.4 / scale, bright);
      if (Math.sin(time * 6) > 0) {
        ctx.beginPath();
        ctx.moveTo(p.x1, p.y - 1); ctx.lineTo(p.x1, p.y - 9);
        ctx.moveTo(p.x2, p.y - 1); ctx.lineTo(p.x2, p.y - 9);
        glow(1.6 / scale, 1);
      }
    }
  }

  function drawShipAt(x, y, a, sc, alpha = 1, flame = false) {
    const c = Math.cos(a), s = Math.sin(a);
    const T = (px, py) => [x + (px * c - py * s) * sc, y + (px * s + py * c) * sc];
    ctx.beginPath();
    const n = T(0, -12), l = T(-8, 10), r = T(8, 10), bl = T(-6, 6), br = T(6, 6);
    ctx.moveTo(l[0], l[1]); ctx.lineTo(n[0], n[1]); ctx.lineTo(r[0], r[1]);
    ctx.moveTo(bl[0], bl[1]); ctx.lineTo(br[0], br[1]);
    if (flame) {
      const f1 = T(-3.5, 6), f2 = T(0, 13 + Math.random() * 5), f3 = T(3.5, 6);
      ctx.moveTo(f1[0], f1[1]); ctx.lineTo(f2[0], f2[1]); ctx.lineTo(f3[0], f3[1]);
    }
    glow(1.5 * (sc < 1 ? 1 : 1 / scale), alpha);
  }

  function drawWorld() {
    drawTerrain();
    applyCam();
    if (ship && ship.alive) drawShipAt(ship.x, ship.y, ship.a, 1, 1, ship.thrusting && frameNo % 2 === 0);
    for (const p of particles) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = '#fff';
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.beginPath();
    for (const d of debris) {
      const dx = Math.cos(d.a) * d.len / 2, dy = Math.sin(d.a) * d.len / 2;
      ctx.moveTo(d.x - dx, d.y - dy); ctx.lineTo(d.x + dx, d.y + dy);
    }
    glow(1.5 / scale, debris.length ? clamp(debris[0].life, 0, 1) : 1);
  }

  // ---------- HUD & screens ----------
  const blink = (hz = 2) => Math.sin(time * Math.PI * 2 * hz) > -0.2;
  const topScore = () => Math.max(score, board.length ? Number(board[0].score) : 0);

  function drawHUD() {
    screenSpace();
    const small = W < 480;
    const fs = small ? 10 : 12;
    // score & lives (top-left), high score (top-centre)
    vtext(String(score).padStart(2, '0'), 16, 16, small ? 20 : 26);
    for (let i = 0; i < Math.max(0, lives); i++) drawShipAt(24 + i * 18, (small ? 58 : 66), 0, 0.75, 0.9);
    vtext('LEVEL ' + levelNum, 16, small ? 78 : 88, fs - 1, 'left', 0.8);
    vtext(String(topScore()).padStart(2, '0'), W / 2, 16, fs, 'center', 0.8);

    if (!ship) return;
    // fuel gauge (top-right)
    const gw = small ? 104 : 160, gx = W - gw - 16, gy = 16;
    vtext('FUEL', gx, gy, fs - 2, 'left', 0.8);
    const frac = clamp(ship.fuel / level.fuel, 0, 1);
    ctx.beginPath(); ctx.rect(gx, gy + fs + 4, gw, 12); glow(1.1, 0.8);
    if (frac > 0.2 || blink(3)) {
      ctx.beginPath();
      const fw = (gw - 6) * frac;
      for (let x = 0; x < fw; x += 3) { ctx.moveTo(gx + 3 + x, gy + fs + 7); ctx.lineTo(gx + 3 + x, gy + fs + 13); }
      glow(1, 0.85);
    }
    vtext(String(Math.floor(ship.fuel)), W - 16, gy + fs + 24, fs, 'right');

    // flight data: unsafe values blink
    const vx = ship.vx / SPEED_UNIT, vy = ship.vy / SPEED_UNIT;
    const okX = Math.abs(ship.vx) <= SAFE_VX, okY = ship.vy <= SAFE_VY, okA = Math.abs(ship.a) <= SAFE_ANGLE;
    const alt = Math.max(0, (level.pad.y - (ship.y + FOOT_Y)) / SPEED_UNIT);
    const y0 = gy + fs * 2 + 40, lh = fs + 9;
    const line = (label, val, ok, i) => vtext(label + ' ' + val, W - 16, y0 + lh * i, fs, 'right', ok ? 0.9 : (blink(4) ? 1 : 0.25));
    line('H SPEED', Math.abs(vx).toFixed(0).padStart(3, ' ') + ' ' + (vx > 0.05 ? '→' : vx < -0.05 ? '←' : ' '), okX, 0);
    line('V SPEED', Math.abs(vy).toFixed(0).padStart(3, ' ') + ' ' + (vy > 0.05 ? '↓' : vy < -0.05 ? '↑' : ' '), okY, 1);
    line('ANGLE', String(Math.round(Math.abs(ship.a) * 180 / Math.PI)).padStart(3, ' ') + '°', okA, 2);
    line('ALTITUDE', alt.toFixed(0).padStart(4, ' '), true, 3);

    // off-screen pad pointer
    const p = level.pad;
    const [sx, sy] = worldToScreen((p.x1 + p.x2) / 2, p.y);
    const m = 40;
    if (ship.alive && (sx < m || sx > W - m || sy < m || sy > H - 160)) {
      const cx = W / 2, cy = H * 0.45;
      const ang = Math.atan2(sy - cy, sx - cx);
      const r = Math.min(W, H) * 0.34;
      const ax = clamp(cx + Math.cos(ang) * r, m, W - m);
      const ay = clamp(cy + Math.sin(ang) * r, m + 70, H - 170);
      const c = Math.cos(ang), s = Math.sin(ang);
      const T = (x, y) => [ax + x * c - y * s, ay + x * s + y * c];
      ctx.beginPath(); polyPath([T(12, 0), T(-6, -7), T(-2, 0), T(-6, 7)], true);
      glow(1.2, 0.5 + 0.4 * Math.sin(time * 5));
    }
  }

  function drawCenter(lines, yStart, size, gap = 1.9) {
    lines.forEach((l, i) => { if (l) vtext(l, W / 2, yStart + i * size * gap, size, 'center'); });
  }
  const fitSize = (chars, max) => Math.min(max, (W - 32) / chars);

  function drawTitle() {
    screenSpace();
    const page = Math.floor(stateAge / 7) % 2;
    if (page === 0 || !board.length) {
      const big = fitSize(11, 48);
      vtext('ASTROLANDER', W / 2, H * 0.17, big, 'center');
      const s = fitSize(32, 13);
      drawCenter([
        'PILOT YOUR SHIP TO THE PAD',
        'AND TOUCH DOWN GENTLY',
        '',
        'ROTATE   < >',
        'THRUST   FIRE ENGINE',
        '',
        'LAND SLOWLY, UPRIGHT AND CENTERED',
        'BONUS FOR FUEL, SPEED AND ACCURACY',
      ], H * 0.17 + big * 2.2, s, 2.1);
    } else {
      drawBoard(H * 0.12, null);
    }
    if (blink(1)) vtext('PUSH THRUST TO START', W / 2, H - 200, fitSize(20, 14), 'center');
  }

  function drawBoard(y, hl) {
    const s = fitSize(16, 15);
    vtext('HIGH SCORES', W / 2, y, s * 1.3, 'center');
    if (!board.length) {
      vtext(boardLoaded ? 'NO SCORES YET' : 'LOADING', W / 2, y + s * 4, s, 'center', 0.8);
      return;
    }
    board.slice(0, 10).forEach((r, i) => {
      const txt = String(i + 1).padStart(2, ' ') + '. ' + String(r.score).padStart(7, ' ') + ' ' + String(r.name).slice(0, 3).padEnd(3, ' ');
      const on = hl && r.id === hl;
      vtext(txt, W / 2, y + s * 3.2 + i * s * 1.9, s, 'center', on ? (blink(3) ? 1 : 0.3) : 0.9);
    });
  }

  function drawResults() {
    screenSpace();
    const s = fitSize(30, 15);
    const x0 = W / 2 - 14.5 * s, x1 = W / 2 + 14.5 * s;
    let y = H * 0.2;
    vtext('LANDING SUCCESSFUL', W / 2, y, s * 1.4, 'center');
    y += s * 4.5;
    for (const r of tally.rows) {
      if (!r.visible) continue;
      if (r.label === 'TOTAL') {
        ctx.beginPath(); ctx.moveTo(x1 - s * 8, y - s * 0.9); ctx.lineTo(x1, y - s * 0.9); glow(1, 0.7);
      }
      vtext(r.label, x0, y, s);
      vtext(String(r.shown), x1, y, s, 'right');
      y += s * 2.4;
    }
    vtext('SCORE ' + score, W / 2, y + s * 1.5, s * 1.1, 'center');
    if (tally.ready && blink(1)) vtext('PUSH THRUST TO CONTINUE', W / 2, H - 200, fitSize(23, 13), 'center');
  }

  function drawEntry() {
    screenSpace();
    const s = fitSize(34, 13);
    drawCenter([
      'YOUR SCORE IS ONE OF THE TEN BEST',
      'PLEASE ENTER YOUR INITIALS',
      '',
      'PUSH ROTATE TO SELECT LETTER',
      'PUSH THRUST WHEN LETTER IS CORRECT',
    ], H * 0.16, s, 2.1);
    const big = Math.min(44, W / 9);
    const xs = W / 2 - big * 2;
    entry.letters.forEach((ch, i) => {
      const active = i === entry.idx && !entry.done;
      vtext(ch, xs + i * big * 1.5, H * 0.16 + s * 14, big, 'left', active ? (blink(3) ? 1 : 0.35) : 1);
    });
    vtext('SCORE ' + score, W / 2, H * 0.16 + s * 14 + big * 2.2, s * 1.2, 'center', 0.85);
    if (entry.done) vtext('TRANSMITTING', W / 2, H - 200, s, 'center', blink(3) ? 1 : 0.3);
  }

  function drawOverlayText() {
    screenSpace();
    const small = W < 480;
    if (state === 'ready') {
      vtext('LEVEL ' + levelNum, W / 2, H * 0.24, small ? 22 : 30, 'center');
      vtext('GET READY', W / 2, H * 0.24 + (small ? 40 : 54), small ? 12 : 15, 'center', blink(2) ? 1 : 0.3);
    } else if (state === 'crashed') {
      vtext('CRASHED', W / 2, H * 0.24, small ? 24 : 32, 'center');
      vtext(lives > 0 ? `${lives} SHIP${lives === 1 ? '' : 'S'} LEFT` : 'NO SHIPS LEFT', W / 2, H * 0.24 + (small ? 42 : 56), small ? 11 : 14, 'center');
    } else if (state === 'flying' && ship.fuel <= 0) {
      if (blink(3)) vtext('OUT OF FUEL', W / 2, H * 0.22, small ? 14 : 18, 'center');
    } else if (state === 'paused') {
      vtext('PAUSED', W / 2, H * 0.26, small ? 24 : 32, 'center');
      vtext('PUSH THRUST TO RESUME', W / 2, H * 0.26 + 60, fitSize(21, 13), 'center', 0.9);
      vtext('PUSH < TO QUIT', W / 2, H * 0.26 + 90, fitSize(21, 13), 'center', 0.9);
    } else if (state === 'complete') {
      vtext('MISSION COMPLETE', W / 2, H * 0.28, fitSize(16, 34), 'center');
      vtext('ALL ' + LEVELS.length + ' LEVELS LANDED', W / 2, H * 0.28 + (small ? 46 : 62), fitSize(22, 15), 'center', 0.9);
      vtext('SCORE ' + score, W / 2, H * 0.28 + (small ? 80 : 104), small ? 13 : 16, 'center', 0.9);
    } else if (state === 'gameover') {
      vtext('GAME OVER', W / 2, H * 0.3, small ? 28 : 40, 'center');
      vtext('SCORE ' + score, W / 2, H * 0.3 + (small ? 50 : 70), small ? 13 : 16, 'center', 0.9);
    }
  }

  function render() {
    screenSpace();
    // phosphor persistence: fade the previous frame instead of clearing it
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    const inMenu = state === 'title' || state === 'board' || state === 'entry';
    if (level) drawWorld();
    if (inMenu || state === 'results') {
      // dim the attract-mode cavern behind menu text
      screenSpace();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
    }
    if (state === 'title') drawTitle();
    else if (state === 'entry') drawEntry();
    else if (state === 'board') {
      screenSpace();
      drawBoard(H * 0.12, highlightId);
      if (flash) vtext(flash, W / 2, H - 230, 12, 'center', 0.8);
      if (stateAge > 0.5 && blink(1)) vtext('PUSH THRUST', W / 2, H - 200, 13, 'center');
    } else {
      drawHUD();
      if (state === 'results') drawResults();
      drawOverlayText();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- Main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state === 'paused') time += dt; else update(dt);
    render();
    requestAnimationFrame(frame);
  }

  // exposed for automated testing
  window.__astro = { get state() { return state; }, get ship() { return ship; }, get level() { return level; }, input, genLevel, press };

  toTitle();
  requestAnimationFrame(frame);
})();
