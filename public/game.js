// AstroLander: a tribute to the TimeSplitters 2 Temporal Uplink minigame.
(() => {
  'use strict';

  // ---------- Tunables ----------
  const FIELD_W = 600, FIELD_H = 400;   // playfield units (3:2, like the Uplink screen)
  const GRAVITY = 22;                   // units/s^2
  const THRUST = 60;                    // units/s^2
  const ROT_SPEED = 3.4;                // rad/s
  const SAFE_VY = 40;                   // max vertical landing speed
  const SAFE_VX = 20;                   // max horizontal landing speed
  const SAFE_ANGLE = 0.21;              // ~12 degrees
  const MAX_SPEED_BONUS = 5000;
  const MAX_ACCURACY_BONUS = 5000;
  const START_LIVES = 4;

  const COLORS = {
    terrain: '#2e9e3e', frame: '#c8c8c8', pad: '#e6e6e6', ship: '#4d8dff',
    score: '#33c3cf', text: '#f2f2f2', fuel: '#d6c93a', fuelEdge: '#a39a3c', flame: '#ffe680',
  };
  const FONT = '"Arial", "Helvetica Neue", Helvetica, sans-serif';

  // Ship: slim outline triangle (local coords, nose up = -y)
  const HULL = [[0, -10], [7, 8], [-7, 8]];
  const FEET = [[-7, 8], [7, 8]];
  const FOOT_Y = 8;

  // ---------- Levels ----------
  // ground: open polylines; rocks: closed polygons; pad: landing strip on the ground.
  // fuel: seconds of full thrust in the tank; bonus: maximum fuel bonus.
  function slab(x0, x1, y, th, amp, phase) {
    const top = [], bot = [];
    for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 6) {
      top.push([x, y + Math.sin(x * 0.025 + phase) * amp]);
      bot.push([x, y + th + Math.sin(x * 0.03 + phase + 1.7) * amp]);
    }
    return top.concat(bot.reverse());
  }
  const LEVELS = [
    {
      name: 'STRAIGHT DROP', fuel: 10, bonus: 14000, start: [300, 40],
      ground: [[[-10, 20], [20, 70], [270, 345], [330, 345], [530, 60], [610, 100]]],
      rocks: [], pad: [270, 330, 345],
    },
    {
      name: 'HILL VALLEY', fuel: 11, bonus: 16000, start: [280, 40],
      ground: [[[0, 55], [105, 165], [130, 55], [165, 185], [255, 300], [295, 300], [350, 185], [380, 205], [405, 135], [425, 180], [600, 165]]],
      rocks: [], pad: [255, 295, 300],
    },
    {
      name: 'CAPPED VOLCANO', fuel: 14, bonus: 18000, start: [70, 40],
      ground: [[[0, 340], [150, 330], [230, 210], [255, 205], [265, 270], [280, 280], [320, 280], [335, 270], [345, 205], [370, 210], [450, 330], [600, 340]]],
      rocks: [[[210, 100], [390, 100], [370, 135], [230, 135]]], pad: [280, 320, 280],
    },
    {
      name: 'CHUNKY', fuel: 12, bonus: 16000, start: [320, 40],
      ground: [[[0, 250], [80, 250], [80, 330], [160, 330], [160, 285], [230, 285], [230, 360], [300, 360], [345, 360], [420, 360], [420, 290], [500, 290], [500, 340], [600, 340]]],
      rocks: [[[110, 120], [215, 110], [225, 190], [120, 205]], [[380, 150], [480, 140], [490, 220], [390, 230]]],
      pad: [300, 345, 360],
    },
    {
      name: 'CREVASSE', fuel: 10, bonus: 20000, start: [90, 40],
      ground: [[[0, 120], [150, 130], [240, 140], [272, 150], [282, 250], [268, 320], [288, 380], [328, 380], [348, 320], [333, 250], [343, 150], [420, 135], [600, 125]]],
      rocks: [], pad: [288, 328, 380],
    },
    {
      name: 'SHORTCUT', fuel: 18, bonus: 22000, start: [520, 45],
      ground: [[[0, 300], [30, 385], [200, 390], [360, 375], [400, 375], [600, 365]]],
      rocks: [[[110, 225], [262, 195], [266, 212], [114, 244]], [[302, 190], [610, 140], [610, 165], [306, 208]]],
      pad: [360, 400, 375],
    },
    {
      name: 'THE "2"', fuel: 22, bonus: 24000, start: [60, 50],
      ground: [[[0, 380], [460, 385], [480, 370], [520, 370], [600, 360]]],
      rocks: [[[-10, 140], [420, 165], [430, 185], [-10, 170]], [[610, 250], [170, 265], [160, 285], [610, 280]]],
      pad: [480, 520, 370],
    },
    {
      name: 'OVERHANG', fuel: 16, bonus: 20000, start: [70, 45],
      ground: [[[0, 330], [120, 345], [200, 310], [250, 360], [300, 360], [340, 360], [420, 355], [470, 300], [490, 200], [610, 192]]],
      rocks: [[[230, 200], [610, 150], [610, 192], [490, 200], [380, 240], [290, 232]]],
      pad: [300, 340, 360],
    },
    {
      name: 'LARGE INTESTINE', fuel: 28, bonus: 26000, start: [60, 40],
      ground: [[[0, 392], [60, 390], [100, 390], [600, 392]]],
      rocks: [slab(-10, 470, 95, 28, 9, 0), slab(130, 610, 200, 28, 9, 2), slab(-10, 470, 300, 25, 7, 4)],
      pad: [60, 100, 390],
    },
    {
      name: 'NEEDLE', fuel: 20, bonus: 28000, start: [100, 40],
      ground: [[[0, 390], [420, 390], [460, 390], [600, 390]]],
      rocks: [
        [[-10, 110], [470, 110], [470, 125], [-10, 125]], [[520, 110], [610, 110], [610, 125], [520, 125]],
        [[-10, 210], [90, 210], [90, 225], [-10, 225]], [[140, 210], [610, 210], [610, 225], [140, 225]],
        [[-10, 305], [330, 305], [330, 320], [-10, 320]], [[380, 305], [610, 305], [610, 320], [380, 320]],
      ],
      pad: [420, 460, 390],
    },
    {
      name: 'SMALL INTESTINE', fuel: 30, bonus: 32000, start: [60, 30],
      ground: [[[0, 392], [520, 392], [560, 392], [600, 392]]],
      rocks: [slab(-10, 520, 62, 18, 5, 1), slab(80, 610, 142, 18, 5, 3), slab(-10, 520, 222, 18, 5, 5), slab(80, 610, 302, 18, 5, 7)],
      pad: [520, 560, 392],
    },
  ];

  function buildLevel(n) {
    const def = LEVELS[n - 1];
    const [px1, px2, py] = def.pad;
    const segs = [];
    const add = (a, b) => {
      const pad = a[1] === py && b[1] === py && Math.min(a[0], b[0]) >= px1 - 0.5 && Math.max(a[0], b[0]) <= px2 + 0.5;
      segs.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], pad,
        minX: Math.min(a[0], b[0]), maxX: Math.max(a[0], b[0]), minY: Math.min(a[1], b[1]), maxY: Math.max(a[1], b[1]) });
    };
    for (const line of def.ground) for (let i = 0; i < line.length - 1; i++) add(line[i], line[i + 1]);
    for (const poly of def.rocks) for (let i = 0; i < poly.length; i++) add(poly[i], poly[(i + 1) % poly.length]);
    return { n, ...def, segs, pad: { x1: px1, x2: px2, y: py } };
  }

  // ---------- DOM & layout ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, DPR = 1, fx = 0, fy = 0, fw = 0, fh = 0, s = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    const top = 40, bottom = H > 560 ? 150 : 12;
    const availH = Math.max(120, H - top - bottom);
    fw = Math.min(W - 24, availH * FIELD_W / FIELD_H);
    fh = fw * FIELD_H / FIELD_W;
    fx = (W - fw) / 2;
    fy = top + Math.max(0, (availH - fh) / 2.5);
    s = fw / FIELD_W;
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- Utils ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function wrapAngle(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function segIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
    const rX = bx - ax, rY = by - ay, sX = dx - cx, sY = dy - cy;
    const den = rX * sY - rY * sX;
    if (den === 0) return false;
    const t = ((cx - ax) * sY - (cy - ay) * sX) / den;
    const u = ((cx - ax) * rY - (cy - ay) * rX) / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  // ---------- Audio ----------
  let actx = null, thrustGain = null, noiseBuf = null;
  function initAudio() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const lp = actx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 420;
      thrustGain = actx.createGain(); thrustGain.gain.value = 0;
      src.connect(lp).connect(thrustGain).connect(actx.destination);
      src.start();
    } catch (e) { actx = null; }
  }
  function setThrustSound(on) {
    if (!thrustGain) return;
    thrustGain.gain.setTargetAtTime(on ? 0.28 : 0, actx.currentTime, 0.03);
  }
  function beep(freq, dur, type = 'square', vol = 0.06, when = 0) {
    if (!actx) return;
    const t = actx.currentTime + when;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function bang() {
    if (!actx) return;
    const t = actx.currentTime;
    const src = actx.createBufferSource(); src.buffer = noiseBuf;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2000, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + 1.1);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    src.connect(lp).connect(g).connect(actx.destination);
    src.start(t); src.stop(t + 1.25);
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
    if (e.code === 'Enter' && !e.repeat) { press('ok'); e.preventDefault(); return; }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) { togglePause(); return; }
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
  canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); initAudio(); press('ok'); });

  // ---------- Game state ----------
  // title | intro | flying | paused | crashed | results | gameover | complete | entry | board
  let state = 'title', stateAge = 0;
  let level = null, levelNum = 1, score = 0, lives = START_LIVES;
  let ship = null, particles = [], debris = [];
  let time = 0, frameNo = 0;
  let tally = null, entry = null, flash = '';
  let board = [], boardLoaded = false, highlightId = null;

  function setState(st) {
    state = st; stateAge = 0;
    $('pauseBtn').classList.toggle('hidden', st !== 'flying' && st !== 'paused');
    if (st !== 'flying') setThrustSound(false);
  }

  // 'ok' comes from Enter or a tap on the screen; THRUST also confirms dialogs
  function press(key) {
    const ok = key === 'ok' || key === 'thrust';
    switch (state) {
      case 'title': if (ok && stateAge > 0.4) startGame(); break;
      case 'intro': if (ok && stateAge > 0.3) setState('flying'); break;
      case 'crashed': if (ok && stateAge > 0.8) afterCrash(); break;
      case 'results':
        if (!ok) break;
        if (!tally.ready) finishTally(); else if (stateAge > 0.3) nextLevel();
        break;
      case 'paused':
        if (ok) togglePause(); else if (key === 'left') toTitle();
        break;
      case 'gameover': case 'complete':
        if (ok && stateAge > 0.8) afterGameOver();
        break;
      case 'entry':
        if (key === 'left') entryCycle(-1);
        else if (key === 'right') entryCycle(1);
        else if (key === 'thrust' || key === 'ok') entryConfirm();
        break;
      case 'board': if (ok && stateAge > 0.5) toTitle(); break;
    }
  }

  function resetShip() {
    ship = { x: level.start[0], y: level.start[1], vx: 0, vy: 0, a: 0, fuel: 1, thrusting: false, alive: true };
  }
  function startGame() { score = 0; lives = START_LIVES; levelNum = 1; loadLevel(); }
  function loadLevel() {
    level = buildLevel(levelNum);
    resetShip();
    particles = []; debris = [];
    setState('intro');
  }
  function nextLevel() {
    if (levelNum >= LEVELS.length) { setState('complete'); return; }
    levelNum++; loadLevel();
  }
  function afterCrash() {
    if (lives <= 0) { setState('gameover'); return; }
    resetShip(); particles = []; debris = [];
    setState('intro');
  }
  function togglePause() {
    if (state === 'flying') setState('paused');
    else if (state === 'paused') setState('flying');
  }
  function toTitle() {
    level = buildLevel(1); resetShip(); ship.alive = false;
    particles = []; debris = [];
    setState('title');
    loadBoard();
  }

  // ---------- Simulation ----------
  function shipPoly(pts) {
    const c = Math.cos(ship.a), sn = Math.sin(ship.a);
    return pts.map(([x, y]) => [ship.x + x * c - y * sn, ship.y + x * sn + y * c]);
  }
  function collide() {
    const poly = shipPoly(HULL);
    let hit = false, onlyPad = true;
    for (const [x, y] of poly) if (x < 0 || x > FIELD_W || y > FIELD_H) { hit = true; onlyPad = false; }
    const bx0 = ship.x - 12, bx1 = ship.x + 12, by0 = ship.y - 12, by1 = ship.y + 12;
    for (const sg of level.segs) {
      if (sg.maxX < bx0 || sg.minX > bx1 || sg.maxY < by0 || sg.minY > by1) continue;
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i], q = poly[(i + 1) % poly.length];
        if (segIntersect(p[0], p[1], q[0], q[1], sg.ax, sg.ay, sg.bx, sg.by)) {
          hit = true; if (!sg.pad) onlyPad = false; break;
        }
      }
    }
    return { hit, onlyPad };
  }

  function update(dt) {
    time += dt; stateAge += dt; frameNo++;
    updateParticles(dt);
    if (state === 'results') { updateTally(dt); return; }
    if (state === 'entry') { updateEntryRepeat(dt); return; }
    if (state === 'board' && stateAge > 15) { toTitle(); return; }
    if (state !== 'flying') return;

    const burn = 1 / level.fuel;   // tank fraction per second of thrust
    const steps = 4, h = dt / steps;
    for (let i = 0; i < steps; i++) {
      if (input.left) ship.a -= ROT_SPEED * h;
      if (input.right) ship.a += ROT_SPEED * h;
      ship.a = wrapAngle(ship.a);
      ship.thrusting = input.thrust && ship.fuel > 0;
      let ax = 0, ay = GRAVITY;
      if (ship.thrusting) {
        ax += Math.sin(ship.a) * THRUST;
        ay -= Math.cos(ship.a) * THRUST;
        ship.fuel = Math.max(0, ship.fuel - burn * h);
      }
      ship.vx += ax * h; ship.vy += ay * h;
      ship.x += ship.vx * h; ship.y += ship.vy * h;
      if (ship.y < 12) { ship.y = 12; ship.vy = Math.max(ship.vy, 0); }

      const c = collide();
      if (c.hit) {
        const feet = shipPoly(FEET);
        const p = level.pad;
        const feetOnPad = feet.every(([x]) => x >= p.x1 - 1 && x <= p.x2 + 1);
        const upright = Math.abs(ship.a) <= SAFE_ANGLE;
        const slow = ship.vy <= SAFE_VY && Math.abs(ship.vx) <= SAFE_VX;
        if (c.onlyPad && feetOnPad && upright && slow) land(); else crash();
        return;
      }
    }
    setThrustSound(ship.thrusting);
  }

  function updateParticles(dt) {
    for (const p of particles) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += GRAVITY * 0.5 * dt; }
    particles = particles.filter((p) => p.life > 0);
    for (const d of debris) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += GRAVITY * 0.6 * dt; d.a += d.va * dt; }
  }

  function crash() {
    ship.alive = false; ship.thrusting = false;
    bang();
    lives--;
    setState('crashed');
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2, sp = 20 + Math.random() * 80;
      particles.push({ x: ship.x, y: ship.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4 + Math.random() * 0.9 });
    }
    const pts = shipPoly(HULL);
    for (let i = 0; i < 3; i++) {
      const p = pts[i], q = pts[(i + 1) % 3];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      debris.push({ x: mx, y: my, len: Math.hypot(q[0] - p[0], q[1] - p[1]), a: Math.atan2(q[1] - p[1], q[0] - p[0]),
        va: (Math.random() - 0.5) * 6, vx: (mx - ship.x) * 4 + ship.vx * 0.2, vy: (my - ship.y) * 4 - 25 });
    }
  }

  function land() {
    ship.vy = Math.max(0, ship.vy);
    const speed = Math.hypot(ship.vx, ship.vy);
    const p = level.pad;
    ship.y = p.y - FOOT_Y;
    ship.thrusting = false;
    const fuelPct = Math.round(ship.fuel * 100);
    const fuelBonus = Math.round(ship.fuel * level.bonus);
    const speedBonus = Math.round(MAX_SPEED_BONUS * clamp(1 - speed / Math.hypot(SAFE_VX, SAFE_VY), 0, 1));
    const half = (p.x2 - p.x1) / 2 - 7;
    const accuracyBonus = Math.round(MAX_ACCURACY_BONUS * clamp(1 - Math.abs(ship.x - (p.x1 + p.x2) / 2) / Math.max(half, 1), 0, 1));
    ship.vx = ship.vy = 0; ship.a = 0;
    tally = {
      rows: [
        { label: 'Fuel remaining', value: fuelPct, suffix: '%', add: false },
        { label: 'Fuel bonus', value: fuelBonus, add: true },
        { label: 'Landing speed bonus', value: speedBonus, add: true },
        { label: 'Landing accuracy bonus', value: accuracyBonus, add: true },
        { label: 'Total', value: fuelBonus + speedBonus + accuracyBonus, add: false },
      ],
      i: -1, t: 0, pause: 0.5, ready: false, tick: 0,
    };
    for (const r of tally.rows) { r.shown = 0; r.visible = false; r.done = false; }
    setState('results');
    beep(784, 0.1, 'square', 0.05); beep(1047, 0.1, 'square', 0.05, 0.12); beep(1568, 0.22, 'square', 0.05, 0.24);
  }

  // ---------- Results tally ----------
  function updateTally(dt) {
    if (tally.ready) return;
    if (tally.pause > 0) { tally.pause -= dt; return; }
    if (tally.i < 0 || tally.rows[tally.i].done) {
      tally.i++;
      if (tally.i >= tally.rows.length) { tally.ready = true; return; }
      const r = tally.rows[tally.i];
      r.visible = true; r.dur = Math.min(1, 0.25 + r.value / 20000); tally.t = 0;
    }
    const r = tally.rows[tally.i];
    tally.t += dt;
    const k = clamp(tally.t / r.dur, 0, 1);
    r.shown = Math.round(r.value * k);
    tally.tick -= dt;
    if (tally.tick <= 0 && k < 1) { beep(1300 + k * 600, 0.025, 'square', 0.025); tally.tick = 0.05; }
    if (k >= 1) {
      r.done = true;
      if (r.add) score += r.value;
      beep(520, 0.07, 'triangle', 0.07);
      tally.pause = 0.3;
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
    if (!boardLoaded) return true;
    return board.length < 10 || score > Number(board[board.length - 1].score);
  }
  function afterGameOver() {
    if (qualifies()) {
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
    beep(900, 0.03, 'square', 0.04);
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
  function entryType(ch) { if (!entry.done) { entry.letters[entry.idx] = ch; entryConfirm(); } }
  function entryBack() {
    if (entry.done || entry.idx === 0) return;
    entry.letters[entry.idx] = '_';
    entry.idx--;
  }
  function entryConfirm() {
    if (entry.done) return;
    beep(660, 0.06, 'square', 0.05);
    if (entry.idx < 2) {
      entry.idx++;
      if (entry.letters[entry.idx] === '_') entry.letters[entry.idx] = 'A';
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
      flash = 'Score not saved';
      highlightId = null;
    }
    setState('board');
  }

  // ---------- Rendering ----------
  const blink = (hz = 2) => Math.sin(time * Math.PI * 2 * hz) > -0.3;
  function font(px, bold = false) { return `${bold ? 'bold ' : ''}${Math.round(px)}px ${FONT}`; }
  function text(str, x, y, px, color = COLORS.text, align = 'left', bold = false) {
    ctx.font = font(px, bold); ctx.fillStyle = color;
    ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
  }
  function screen() { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  function field() { ctx.setTransform(DPR * s, 0, 0, DPR * s, DPR * fx, DPR * fy); }
  function strokePath(pts, closed, color, px = 1.4) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
    ctx.strokeStyle = color; ctx.lineWidth = px / s; ctx.stroke();
  }

  function drawShipLines(x, y, a, k, color, px, flame) {
    const c = Math.cos(a), sn = Math.sin(a);
    const T = ([lx, ly]) => [x + (lx * c - ly * sn) * k, y + (lx * sn + ly * c) * k];
    ctx.beginPath();
    const pts = HULL.map(T);
    ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.closePath();
    const b1 = T([-3, 3]), b2 = T([3, 3]);
    ctx.moveTo(b1[0], b1[1]); ctx.lineTo(b2[0], b2[1]);
    ctx.strokeStyle = color; ctx.lineWidth = px; ctx.lineJoin = 'round'; ctx.stroke();
    if (flame) {
      const f1 = T([-3, 9]), f2 = T([0, 15 + Math.random() * 6]), f3 = T([3, 9]);
      ctx.beginPath(); ctx.moveTo(f1[0], f1[1]); ctx.lineTo(f2[0], f2[1]); ctx.lineTo(f3[0], f3[1]);
      ctx.strokeStyle = COLORS.flame; ctx.stroke();
    }
  }

  function drawField() {
    // frame
    screen();
    ctx.strokeStyle = COLORS.frame; ctx.lineWidth = 1.2;
    ctx.strokeRect(fx + 0.5, fy + 0.5, fw, fh);
    if (!level) return;

    field();
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, FIELD_W, FIELD_H); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const g of level.ground) strokePath(g, false, COLORS.terrain);
    for (const r of level.rocks) strokePath(r, true, COLORS.terrain);
    // landing pad: a hollow white box sitting in the ground
    const p = level.pad;
    ctx.strokeStyle = COLORS.pad; ctx.lineWidth = 1.3 / s;
    ctx.strokeRect(p.x1, p.y, p.x2 - p.x1, 7);

    if (ship && ship.alive) drawShipLines(ship.x, ship.y, ship.a, 1, COLORS.ship, 1.5 / s, ship.thrusting && frameNo % 3 !== 0);
    for (const d of debris) {
      const dx = Math.cos(d.a) * d.len / 2, dy = Math.sin(d.a) * d.len / 2;
      ctx.beginPath(); ctx.moveTo(d.x - dx, d.y - dy); ctx.lineTo(d.x + dx, d.y + dy);
      ctx.strokeStyle = COLORS.ship; ctx.lineWidth = 1.5 / s; ctx.stroke();
    }
    for (const q of particles) {
      ctx.globalAlpha = clamp(q.life, 0, 1);
      ctx.fillStyle = Math.random() < 0.5 ? COLORS.flame : COLORS.ship;
      ctx.fillRect(q.x - 1, q.y - 1, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawHUD() {
    screen();
    const ts = clamp(fw * 0.034, 13, 22);
    // score (cyan, top-left above the frame) and title (centred above the frame)
    text(String(Math.min(score, 999999)).padStart(6, '0'), fx + 2, fy - ts * 0.85, ts, COLORS.score, 'left', true);
    text('AstroLander', W / 2, fy - ts * 0.85, ts, COLORS.text);
    if (!ship || state === 'title' || state === 'board' || state === 'entry') return;
    // fuel bar (top-left inside the frame)
    const bx = fx + fw * 0.018, by = fy + fh * 0.025, bw = fw * 0.16, bh = Math.max(5, fh * 0.022);
    ctx.fillStyle = COLORS.fuel;
    const fuelVisible = ship.fuel > 0.2 || blink(3) || state !== 'flying';
    if (fuelVisible) ctx.fillRect(bx, by, bw * ship.fuel, bh);
    ctx.strokeStyle = COLORS.fuelEdge; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    // lives (blue ships, top-right inside the frame)
    const ls = clamp(fw / 600, 0.6, 1.2);
    for (let i = 0; i < Math.max(0, lives); i++) {
      drawShipLines(fx + fw - 12 * ls - i * 15 * ls, fy + fh * 0.025 + 9 * ls, 0, 0.7 * ls, COLORS.ship, 1.2, false);
    }
  }

  // Centred dialog box like the original's "CRASH! / OK"
  function dialog(lines, opts = {}) {
    screen();
    const base = clamp(fw * 0.036, 12, 20);
    const lh = base * 1.65;
    ctx.font = font(base);
    let w = 0;
    for (const l of lines) {
      ctx.font = font(l.size || base, l.bold);
      const lw = l.right != null ? ctx.measureText(l.text).width + ctx.measureText(String(l.right)).width + base * 3 : ctx.measureText(l.text).width;
      w = Math.max(w, lw);
    }
    w = Math.max(w + base * 2.4, opts.minW || base * 8);
    const hgt = lines.reduce((a, l) => a + (l.gap || 0) + (l.size ? l.size * 1.65 : lh), 0) + base * 1.2;
    const x = W / 2 - w / 2, y = fy + fh / 2 - hgt / 2;
    ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, hgt);
    ctx.strokeStyle = COLORS.text; ctx.lineWidth = 1.3; ctx.strokeRect(x + 0.5, y + 0.5, w, hgt);
    let cy = y + base * 0.6;
    for (const l of lines) {
      cy += l.gap || 0;
      const h = l.size ? l.size * 1.65 : lh;
      const col = l.color || COLORS.text;
      if (l.visible === false) { cy += h; continue; }
      if (l.right != null) {
        text(l.text, x + base * 1.2, cy + h / 2, l.size || base, col, 'left', l.bold);
        text(String(l.right), x + w - base * 1.2, cy + h / 2, l.size || base, col, 'right', l.bold);
      } else {
        text(l.text, W / 2, cy + h / 2, l.size || base, col, 'center', l.bold);
      }
      cy += h;
    }
  }

  function boardLines(hl) {
    if (!board.length) return [{ text: boardLoaded ? 'No scores yet' : 'Loading…' }];
    return board.slice(0, 10).map((r, i) => ({
      text: `${i + 1}.  ${String(r.name).slice(0, 3)}`, right: String(r.score).padStart(6, '0'),
      color: hl && r.id === hl ? (blink(3) ? COLORS.score : COLORS.text) : COLORS.text,
    }));
  }

  function drawDialogs() {
    const base = clamp(fw * 0.036, 12, 20);
    const ok = { text: 'OK', gap: base * 0.3 };
    switch (state) {
      case 'title': {
        const showScores = board.length && Math.floor(stateAge / 6) % 2 === 1;
        if (showScores) dialog([{ text: 'HIGH SCORES', color: COLORS.score, bold: true }, ...boardLines(null), { text: 'Press THRUST to play', gap: base * 0.4 }], { minW: base * 14 });
        else dialog([
          { text: 'ASTROLANDER', color: COLORS.score, bold: true },
          { text: 'Land on the pad with as much fuel,' , size: base * 0.8, gap: base * 0.3 },
          { text: 'as little speed and as close to', size: base * 0.8 },
          { text: 'the centre as you can.', size: base * 0.8 },
          { text: '◀ ▶ rotate     THRUST fire engine', size: base * 0.8, gap: base * 0.3 },
          { text: blink(1) ? 'Press THRUST to start' : ' ', gap: base * 0.4 },
        ]);
        break;
      }
      case 'intro':
        dialog([{ text: `LEVEL ${levelNum}`, color: COLORS.score, bold: true }, { text: level.name }, ok]);
        break;
      case 'crashed':
        dialog([{ text: 'CRASH!', color: COLORS.score }, ok]);
        break;
      case 'paused':
        dialog([{ text: 'PAUSED', color: COLORS.score }, ok, { text: '◀ to quit', size: base * 0.75 }]);
        break;
      case 'results':
        dialog([
          { text: 'LANDED!', color: COLORS.score, bold: true },
          ...tally.rows.map((r) => ({ text: r.label, right: r.shown + (r.suffix || ''), visible: r.visible, bold: r.label === 'Total', color: r.label === 'Total' ? COLORS.score : COLORS.text })),
          { text: tally.ready ? 'OK' : ' ', gap: base * 0.3 },
        ], { minW: base * 18 });
        break;
      case 'gameover':
        dialog([{ text: 'GAME OVER', color: COLORS.score, bold: true }, { text: 'Score ' + String(score).padStart(6, '0') }, ok]);
        break;
      case 'complete':
        dialog([{ text: 'ALL LEVELS COMPLETE!', color: COLORS.score, bold: true }, { text: 'Score ' + String(score).padStart(6, '0') }, ok]);
        break;
      case 'entry': {
        const letters = entry.letters.map((ch, i) => (i === entry.idx && !entry.done && !blink(3) ? ' ' : ch)).join('  ');
        dialog([
          { text: 'NEW HIGH SCORE', color: COLORS.score, bold: true },
          { text: 'Score ' + String(score).padStart(6, '0') },
          { text: 'Enter your initials', size: base * 0.8, gap: base * 0.3 },
          { text: letters, size: base * 1.8, bold: true },
          { text: entry.done ? 'Sending…' : '◀ ▶ choose letter   THRUST select', size: base * 0.75 },
        ], { minW: base * 16 });
        break;
      }
      case 'board':
        dialog([{ text: 'HIGH SCORES', color: COLORS.score, bold: true }, ...boardLines(highlightId),
          ...(flash ? [{ text: flash, size: base * 0.75 }] : []), ok], { minW: base * 14 });
        break;
    }
  }

  function render() {
    screen();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    drawField();
    drawHUD();
    drawDialogs();
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
  window.__astro = { get state() { return state; }, get ship() { return ship; }, get level() { return level; }, input, press, LEVELS, buildLevel,
    setLevel(n) { levelNum = n; loadLevel(); } };

  toTitle();
  requestAnimationFrame(frame);
})();
