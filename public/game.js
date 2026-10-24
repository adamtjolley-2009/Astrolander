// Astrolander — a tribute to the TimeSplitters 2 Temporal Uplink minigame.
(() => {
  'use strict';

  // ---------- Tunables ----------
  const GRAVITY = 22;          // px/s^2
  const THRUST = 62;           // px/s^2
  const ROT_SPEED = 3.2;       // rad/s
  const BURN_RATE = 55;        // fuel units/s
  const SAFE_VY = 42;          // max vertical landing speed (px/s)
  const SAFE_VX = 22;          // max horizontal landing speed (px/s)
  const SAFE_ANGLE = 0.21;     // ~12 degrees
  const SPEED_UNIT = 10;       // px/s per displayed m/s
  const FUEL_BONUS_PER_UNIT = 5;
  const MAX_SPEED_BONUS = 1000;
  const MAX_ACCURACY_BONUS = 1000;
  const START_LIVES = 3;
  const WORLD_W = 1000;

  // Ship collision hull (local coords, nose up = -y)
  const HULL = [[-5, -13], [5, -13], [9, -4], [13, 12], [-13, 12], [-9, -4]];
  const FEET = [[-13, 12], [13, 12]];

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const screens = ['title', 'results', 'gameover', 'board', 'paused'];
  function show(id) {
    for (const s of screens) $(s).classList.toggle('hidden', s !== id);
    $('pauseBtn').classList.toggle('hidden', id !== null || state !== 'flying');
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

  // ---------- Level generation ----------
  function genLevel(n) {
    const rnd = mulberry32(n * 9973 + 1337);
    const tunnel = n > 1;
    const depth = 520 + (n - 1) * 420;
    const floorBase = depth + 300;
    const step = 130;
    const rows = [];
    let cx = WORLD_W / 2;
    const minW = Math.max(190, 470 - n * 45);
    for (let y = -1400; y <= depth; y += step) {
      let w = tunnel ? minW + rnd() * 110 : WORLD_W - 30;
      if (y < 60) w = Math.max(w, 360);
      rows.push({ y, cx, w });
      if (tunnel && y >= 60) {
        cx += (rnd() - 0.5) * 2 * Math.min(115, 45 + n * 14);
      }
      cx = clamp(cx, w / 2 + 25, WORLD_W - w / 2 - 25);
    }
    // landing chamber
    const last = rows[rows.length - 1];
    const chamberW = tunnel ? Math.max(420, last.w + 120) : WORLD_W - 30;
    const ccx = clamp(last.cx, chamberW / 2 + 15, WORLD_W - chamberW / 2 - 15);
    rows.push({ y: depth + 120, cx: ccx, w: chamberW });

    const jag = tunnel ? 18 : 0;
    const left = [], right = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      left.push([r.cx - r.w / 2 + (rnd() - 0.5) * jag, r.y]);
      right.push([r.cx + r.w / 2 + (rnd() - 0.5) * jag, r.y]);
      if (i < rows.length - 1 && tunnel) {
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
    const padW = Math.max(56, 120 - n * 8);
    const padX1 = lerp(L + 50, R - 50 - padW, rnd());
    const padX2 = padX1 + padW;
    const amp = tunnel ? 55 : 170;
    const padY = floorBase - 30 - rnd() * (tunnel ? 30 : 110);
    const floor = [];
    floor.push([L, floorBase - 40 - rnd() * amp]);
    for (let x = L + 35; x < padX1 - 20; x += 35 + rnd() * 20) {
      floor.push([x, floorBase - 10 - rnd() * amp]);
    }
    floor.push([padX1 - 8, padY + 10 + rnd() * 20]);
    const padIndex = floor.length;
    floor.push([padX1, padY], [padX2, padY]);
    floor.push([padX2 + 8, padY + 10 + rnd() * 20]);
    for (let x = padX2 + 30; x < R - 20; x += 35 + rnd() * 20) {
      floor.push([x, floorBase - 10 - rnd() * amp]);
    }
    floor.push([R, floorBase - 40 - rnd() * amp]);
    // walls meet the floor
    left.push([L, floor[0][1]]);
    right.push([R, floor[floor.length - 1][1]]);

    // overhanging rock spurs inside the tunnel
    const rocks = [];
    if (n >= 3) {
      for (let i = 0; i < rows.length - 2; i++) {
        const r = rows[i];
        if (r.y < 200 || r.y > depth - 120 || rnd() > 0.35 + n * 0.03) continue;
        const side = rnd() < 0.5 ? -1 : 1;
        const rad = Math.min(48, r.w * 0.2);
        const wallX = r.cx + side * r.w / 2;
        const ox = wallX - side * rad * 0.55, oy = r.y + (rnd() - 0.5) * 40;
        const pts = [];
        const k = 7;
        for (let j = 0; j < k; j++) {
          const a = (j / k) * Math.PI * 2;
          const rr = rad * (0.7 + rnd() * 0.45);
          pts.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr]);
        }
        rocks.push(pts);
      }
    }

    // build collision segments
    const segs = [];
    const addPoly = (pts, closed, padAt = -1) => {
      for (let i = 0; i < pts.length - (closed ? 0 : 1); i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        segs.push({ ax: a[0], ay: a[1], bx: b[0], by: b[1], pad: i === padAt });
      }
    };
    addPoly(left, false);
    addPoly(right, false);
    addPoly(floor, false, padIndex);
    for (const r of rocks) addPoly(r, true);
    for (const s of segs) {
      s.minX = Math.min(s.ax, s.bx); s.maxX = Math.max(s.ax, s.bx);
      s.minY = Math.min(s.ay, s.by); s.maxY = Math.max(s.ay, s.by);
    }

    const startY = -120;
    const fuel = Math.round(650 + depth * 0.55 - n * 15);
    return {
      n, left, right, floor, rocks, segs, tunnel,
      pad: { x1: padX1, x2: padX2, y: padY },
      start: { x: WORLD_W / 2, y: startY },
      fuel, bottom: floorBase + 3000, top: -1400,
    };
  }

  // ---------- Audio ----------
  let actx = null, thrustGain = null;
  function initAudio() {
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      const buf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const lp = actx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 520;
      thrustGain = actx.createGain(); thrustGain.gain.value = 0;
      src.connect(lp).connect(thrustGain).connect(actx.destination);
      src.start();
      actx._noise = buf;
    } catch (e) { actx = null; }
  }
  function setThrustSound(on) {
    if (!thrustGain) return;
    thrustGain.gain.setTargetAtTime(on ? 0.22 : 0, actx.currentTime, 0.04);
  }
  function beep(freq, dur, type = 'square', vol = 0.08, when = 0) {
    if (!actx) return;
    const t = actx.currentTime + when;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function boom() {
    if (!actx) return;
    const src = actx.createBufferSource(); src.buffer = actx._noise;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1800, actx.currentTime);
    lp.frequency.exponentialRampToValueAtTime(80, actx.currentTime + 1.2);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.6, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 1.4);
    src.connect(lp).connect(g).connect(actx.destination);
    src.start(); src.stop(actx.currentTime + 1.5);
  }

  // ---------- Input ----------
  const input = { left: false, right: false, thrust: false };
  const keyMap = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'thrust', KeyW: 'thrust', Space: 'thrust' };
  window.addEventListener('keydown', (e) => {
    if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
    initAudio();
    const k = keyMap[e.code];
    if (k) { input[k] = true; e.preventDefault(); }
    if ((e.code === 'Escape' || e.code === 'KeyP') && (state === 'flying' || state === 'paused')) togglePause();
    if ((e.code === 'Enter' || e.code === 'Space') && state === 'results' && !$('nextBtn').classList.contains('hidden')) {
      e.preventDefault(); nextLevel();
    }
  });
  window.addEventListener('keyup', (e) => { const k = keyMap[e.code]; if (k) input[k] = false; });
  window.addEventListener('blur', () => { input.left = input.right = input.thrust = false; });

  function bindHold(el, key) {
    const pointers = new Set();
    const update = () => { input[key] = pointers.size > 0; el.classList.toggle('active', input[key]); };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault(); initAudio();
      pointers.add(e.pointerId);
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      update();
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

  // ---------- Game state ----------
  let state = 'title';   // title | ready | flying | paused | crashed | results | gameover | board
  let level = null, levelNum = 1, score = 0, lives = START_LIVES;
  let ship = null, cam = { x: WORLD_W / 2, y: 0 };
  let particles = [], debris = [];
  let stateTimer = 0, time = 0;
  let lastLanding = null;

  const stars = [];
  { const r = mulberry32(42); for (let i = 0; i < 220; i++) stars.push({ x: r(), y: r(), s: r() * 1.6 + 0.3, p: r() * 0.25 + 0.05, tw: r() * 6 }); }

  function resetShip() {
    ship = { x: level.start.x, y: level.start.y, vx: 0, vy: 0, a: 0, fuel: level.fuel, thrusting: false, alive: true };
    cam.x = ship.x; cam.y = ship.y + 60;
  }
  function startGame() {
    initAudio();
    score = 0; lives = START_LIVES; levelNum = 1;
    loadLevel();
  }
  function loadLevel() {
    level = genLevel(levelNum);
    resetShip();
    particles = []; debris = [];
    state = 'ready'; stateTimer = 1.8;
    show(null);
  }
  function nextLevel() {
    levelNum++;
    loadLevel();
  }
  function togglePause() {
    if (state === 'flying') { state = 'paused'; setThrustSound(false); show('paused'); }
    else if (state === 'paused') { state = 'flying'; show(null); }
  }

  // ---------- Simulation ----------
  function shipPoly(sx, sy, a, pts) {
    const c = Math.cos(a), s = Math.sin(a);
    return pts.map(([x, y]) => [sx + x * c - y * s, sy + x * s + y * c]);
  }

  function collide() {
    const poly = shipPoly(ship.x, ship.y, ship.a, HULL);
    let hit = false, onlyPad = true;
    const bx0 = ship.x - 20, bx1 = ship.x + 20, by0 = ship.y - 20, by1 = ship.y + 20;
    for (const s of level.segs) {
      if (s.maxX < bx0 || s.minX > bx1 || s.maxY < by0 || s.minY > by1) continue;
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i], q = poly[(i + 1) % poly.length];
        if (segIntersect(p[0], p[1], q[0], q[1], s.ax, s.ay, s.bx, s.by)) {
          hit = true; if (!s.pad) onlyPad = false; break;
        }
      }
    }
    return { hit, onlyPad };
  }

  function update(dt) {
    time += dt;
    updateParticles(dt);

    if (state === 'ready') {
      stateTimer -= dt;
      if (stateTimer <= 0) { state = 'flying'; show(null); }
      updateCamera(dt);
      return;
    }
    if (state === 'crashed') {
      stateTimer -= dt;
      if (stateTimer <= 0) {
        if (lives <= 0) gameOver();
        else { resetShip(); particles = []; debris = []; state = 'ready'; stateTimer = 1.4; show(null); }
      }
      return;
    }
    if (state === 'results') { updateCamera(dt); return; }
    if (state !== 'flying') return;

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
        ship.fuel = Math.max(0, ship.fuel - BURN_RATE * h);
      }
      ship.vx += ax * h; ship.vy += ay * h;
      ship.x += ship.vx * h; ship.y += ship.vy * h;

      // soft ceiling & side bounds
      if (ship.y < level.top + 300) { ship.y = level.top + 300; ship.vy = Math.max(ship.vy, 0); }
      if (ship.x < -200 || ship.x > WORLD_W + 200) { crash(); return; }

      const c = collide();
      if (c.hit) {
        const feet = shipPoly(ship.x, ship.y, ship.a, FEET);
        const p = level.pad;
        const feetOnPad = feet.every(([fx]) => fx >= p.x1 - 1 && fx <= p.x2 + 1);
        const upright = Math.abs(ship.a) <= SAFE_ANGLE;
        const slow = ship.vy <= SAFE_VY && Math.abs(ship.vx) <= SAFE_VX;
        if (c.onlyPad && feetOnPad && upright && slow) land();
        else crash();
        return;
      }
    }
    setThrustSound(ship.thrusting);
    if (ship.thrusting) emitExhaust(dt);
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

  function emitExhaust(dt) {
    const n = Math.ceil(dt * 90);
    const s = Math.sin(ship.a), c = Math.cos(ship.a);
    for (let i = 0; i < n; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const sp = 140 + Math.random() * 90;
      const dirx = -Math.sin(ship.a + spread), diry = Math.cos(ship.a + spread);
      const ex = ship.x - s * 10, ey = ship.y + c * 10;
      particles.push({ x: ex, y: ey, vx: ship.vx + dirx * sp, vy: ship.vy + diry * sp, life: 0.35 + Math.random() * 0.25, max: 0.6, kind: 'fire' });
    }
  }
  function updateParticles(dt) {
    for (const p of particles) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'spark') p.vy += GRAVITY * 2 * dt;
      p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5;
    }
    particles = particles.filter((p) => p.life > 0);
    for (const d of debris) {
      d.x += d.vx * dt; d.y += d.vy * dt; d.vy += GRAVITY * dt; d.a += d.va * dt; d.life -= dt;
    }
    debris = debris.filter((d) => d.life > 0);
  }

  function crash() {
    ship.alive = false; ship.thrusting = false;
    setThrustSound(false); boom();
    lives--;
    state = 'crashed'; stateTimer = 2.6;
    $('pauseBtn').classList.add('hidden');
    for (let i = 0; i < 90; i++) {
      const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 220;
      particles.push({ x: ship.x, y: ship.y, vx: Math.cos(a) * sp + ship.vx * 0.3, vy: Math.sin(a) * sp + ship.vy * 0.3, life: 0.6 + Math.random() * 1.2, max: 1.8, kind: Math.random() < 0.5 ? 'fire' : 'spark' });
    }
    const poly = shipPoly(ship.x, ship.y, ship.a, HULL);
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      debris.push({ x: mx, y: my, len: Math.hypot(q[0] - p[0], q[1] - p[1]), a: Math.atan2(q[1] - p[1], q[0] - p[0]), va: (Math.random() - 0.5) * 12, vx: (mx - ship.x) * 6 + (Math.random() - 0.5) * 60, vy: (my - ship.y) * 6 - 60 * Math.random(), life: 2.5 });
    }
  }

  function land() {
    ship.vy = Math.max(0, ship.vy);
    const speed = Math.hypot(ship.vx, ship.vy);
    const p = level.pad;
    ship.y = p.y - 12; // rest on feet
    ship.thrusting = false; setThrustSound(false);

    const fuelLeft = Math.floor(ship.fuel);
    const fuelBonus = fuelLeft * FUEL_BONUS_PER_UNIT;
    const maxSafe = Math.hypot(SAFE_VX, SAFE_VY);
    const speedBonus = Math.round(MAX_SPEED_BONUS * clamp(1 - speed / maxSafe, 0, 1)) + 0;
    const padC = (p.x1 + p.x2) / 2, half = (p.x2 - p.x1) / 2 - 13;
    const offset = Math.abs(ship.x - padC);
    const accuracyBonus = Math.round(MAX_ACCURACY_BONUS * clamp(1 - offset / Math.max(half, 1), 0, 1));
    ship.vx = ship.vy = 0; ship.a = 0;
    lastLanding = { fuelLeft, fuelBonus, speedBonus, accuracyBonus, total: fuelBonus + speedBonus + accuracyBonus, speed, offset };
    state = 'results';
    beep(660, 0.12, 'square', 0.08); beep(880, 0.12, 'square', 0.08, 0.12); beep(1320, 0.25, 'square', 0.08, 0.24);
    runTally();
  }

  // ---------- Results tally ----------
  let tallyToken = 0;
  async function runTally() {
    const token = ++tallyToken;
    show('results');
    $('nextBtn').classList.add('hidden');
    const rows = [
      ['r-fuel', lastLanding.fuelLeft, false],
      ['r-fuelbonus', lastLanding.fuelBonus, true],
      ['r-speed', lastLanding.speedBonus, true],
      ['r-accuracy', lastLanding.accuracyBonus, true],
      ['r-total', lastLanding.total, false],
    ];
    for (const [id] of rows) { $(id).classList.remove('show'); $(id).querySelector('.num').textContent = '0'; }
    $('r-score').textContent = score.toLocaleString();
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    await wait(500);
    for (const [id, value, addToScore] of rows) {
      if (token !== tallyToken) return;
      const row = $(id); row.classList.add('show');
      const el = row.querySelector('.num');
      const dur = Math.min(900, 250 + value / 3);
      const t0 = performance.now();
      let lastTick = 0;
      await new Promise((resolve) => {
        const step = (now) => {
          if (token !== tallyToken) return resolve();
          const t = clamp((now - t0) / dur, 0, 1);
          el.textContent = Math.round(value * t).toLocaleString();
          if (now - lastTick > 55 && t < 1) { beep(1200 + t * 600, 0.03, 'square', 0.03); lastTick = now; }
          if (t < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
      });
      if (addToScore) { score += value; $('r-score').textContent = score.toLocaleString(); }
      beep(520, 0.08, 'triangle', 0.08);
      await wait(260);
    }
    if (token !== tallyToken) return;
    $('nextBtn').classList.remove('hidden');
  }

  // ---------- Game over / leaderboard ----------
  function gameOver() {
    state = 'gameover';
    $('go-score').textContent = score.toLocaleString();
    $('go-level').textContent = levelNum;
    $('submitMsg').textContent = '';
    $('nameForm').classList.remove('hidden');
    $('submitBtn').disabled = false;
    let saved = '';
    try { saved = localStorage.getItem('astrolander-name') || ''; } catch (_) {}
    $('nameInput').value = saved;
    show('gameover');
  }

  async function submitScore(e) {
    e.preventDefault();
    const name = $('nameInput').value.toUpperCase().replace(/[^A-Z0-9 _.-]/g, '').trim().slice(0, 12);
    if (!name) { $('submitMsg').textContent = 'PLEASE ENTER A NAME'; return; }
    try { localStorage.setItem('astrolander-name', name); } catch (_) {}
    $('submitBtn').disabled = true;
    $('submitMsg').textContent = 'TRANSMITTING...';
    try {
      const res = await fetch('/api/scores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score, level: levelNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showBoard(data.scores, data.id);
    } catch (err) {
      $('submitMsg').textContent = 'COULD NOT SAVE SCORE';
      $('submitBtn').disabled = false;
    }
  }

  async function showBoard(preloaded, highlightId) {
    state = 'board';
    show('board');
    const list = $('boardList');
    $('boardMsg').textContent = preloaded ? '' : 'LOADING...';
    if (!preloaded) list.innerHTML = '';
    let scores = preloaded;
    if (!scores) {
      try {
        const res = await fetch('/api/scores');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        scores = data.scores;
      } catch (_) {
        $('boardMsg').textContent = 'HIGH SCORES UNAVAILABLE';
        return;
      }
    }
    list.innerHTML = '';
    if (!scores.length) $('boardMsg').textContent = 'NO SCORES YET — BE THE FIRST!';
    else $('boardMsg').textContent = '';
    for (const s of scores) {
      const li = document.createElement('li');
      if (highlightId && s.id === highlightId) li.className = 'me';
      const n = document.createElement('span'); n.className = 'n'; n.textContent = s.name;
      const l = document.createElement('span'); l.className = 'l'; l.textContent = 'L' + s.level;
      const sc = document.createElement('span'); sc.className = 's'; sc.textContent = Number(s.score).toLocaleString();
      li.append(n, l, sc);
      list.append(li);
    }
  }

  function toTitle() {
    state = 'title'; tallyToken++;
    setThrustSound(false);
    level = genLevel(1); resetShip(); ship.alive = false;
    show('title');
  }

  $('startBtn').addEventListener('click', startGame);
  $('scoresBtn').addEventListener('click', () => showBoard());
  $('nextBtn').addEventListener('click', nextLevel);
  $('nameForm').addEventListener('submit', submitScore);
  $('skipBtn').addEventListener('click', toTitle);
  $('boardBack').addEventListener('click', toTitle);
  $('pauseBtn').addEventListener('click', togglePause);
  $('resumeBtn').addEventListener('click', togglePause);
  $('quitBtn').addEventListener('click', toTitle);
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'flying') togglePause(); });

  // ---------- Rendering ----------
  function worldToScreen(x, y) {
    return [(x - cam.x) * scale + W / 2, (y - cam.y) * scale + H * 0.45];
  }
  function applyCam() {
    ctx.setTransform(DPR * scale, 0, 0, DPR * scale, DPR * (W / 2 - cam.x * scale), DPR * (H * 0.45 - cam.y * scale));
  }

  function drawBackground() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#02030a'); g.addColorStop(1, '#070d22');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // planet on the horizon
    const px = W * 0.78 - cam.x * 0.03, py = H * 0.22 - cam.y * 0.02;
    const pr = Math.min(W, H) * 0.13;
    const pg = ctx.createRadialGradient(px - pr * 0.4, py - pr * 0.4, pr * 0.1, px, py, pr);
    pg.addColorStop(0, '#5a8fd8'); pg.addColorStop(0.7, '#1d3a78'); pg.addColorStop(1, '#0a1530');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    for (const s of stars) {
      const x = ((s.x * W * 1.5 - cam.x * s.p * scale) % (W * 1.5) + W * 1.5) % (W * 1.5) - W * 0.25;
      const y = ((s.y * H * 1.5 - cam.y * s.p * scale) % (H * 1.5) + H * 1.5) % (H * 1.5) - H * 0.25;
      const tw = 0.6 + 0.4 * Math.sin(time * 2 + s.tw);
      ctx.fillStyle = `rgba(220,235,255,${0.35 + 0.5 * tw * s.p * 3})`;
      ctx.fillRect(x, y, s.s, s.s);
    }
  }

  function rockFill() {
    const g = ctx.createLinearGradient(0, level.top, 0, level.bottom);
    g.addColorStop(0, '#2a2018'); g.addColorStop(0.5, '#3a2a1c'); g.addColorStop(1, '#4a3420');
    return g;
  }
  function fillPoly(pts, extra) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    for (const e of extra) ctx.lineTo(e[0], e[1]);
    ctx.closePath(); ctx.fill();
  }
  function strokeLine(pts, closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
    ctx.stroke();
  }

  function drawTerrain() {
    applyCam();
    const { left, right, floor, rocks, top, bottom } = level;
    ctx.fillStyle = rockFill();
    const far = 4000;
    fillPoly(left, [[left[left.length - 1][0], bottom], [-far, bottom], [-far, top], [left[0][0], top]]);
    fillPoly(right, [[right[right.length - 1][0], bottom], [WORLD_W + far, bottom], [WORLD_W + far, top], [right[0][0], top]]);
    fillPoly(floor, [[floor[floor.length - 1][0], bottom], [floor[0][0], bottom]]);
    for (const r of rocks) fillPoly(r, []);

    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,160,70,.55)'; ctx.shadowBlur = 8;
    ctx.strokeStyle = '#d98a45'; ctx.lineWidth = 2.2 / scale * 1.2;
    strokeLine(left); strokeLine(right); strokeLine(floor);
    for (const r of rocks) strokeLine(r, true);
    ctx.shadowBlur = 0;

    // landing pad
    const p = level.pad;
    ctx.fillStyle = '#9aa4b4';
    ctx.fillRect(p.x1, p.y, p.x2 - p.x1, 6);
    ctx.fillStyle = '#555e6e';
    ctx.fillRect(p.x1 + 6, p.y + 6, 6, 18); ctx.fillRect(p.x2 - 12, p.y + 6, 6, 18);
    // hazard stripes
    ctx.save();
    ctx.beginPath(); ctx.rect(p.x1, p.y, p.x2 - p.x1, 6); ctx.clip();
    ctx.fillStyle = '#ffcc22';
    for (let x = p.x1 - 10; x < p.x2; x += 12) {
      ctx.beginPath(); ctx.moveTo(x, p.y + 6); ctx.lineTo(x + 6, p.y); ctx.lineTo(x + 12, p.y); ctx.lineTo(x + 6, p.y + 6); ctx.fill();
    }
    ctx.restore();
    // blinking beacons
    const blink = Math.sin(time * 6) > 0;
    ctx.fillStyle = blink ? '#6cff6c' : '#1d5a1d';
    ctx.shadowColor = '#6cff6c'; ctx.shadowBlur = blink ? 14 : 0;
    ctx.beginPath(); ctx.arc(p.x1 + 2, p.y - 3, 3, 0, Math.PI * 2); ctx.arc(p.x2 - 2, p.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // centre marker
    ctx.fillStyle = 'rgba(108,255,108,.85)';
    ctx.fillRect((p.x1 + p.x2) / 2 - 1.5, p.y - 1, 3, 3);
  }

  function drawShip() {
    if (!ship || !ship.alive) return;
    applyCam();
    ctx.save();
    ctx.translate(ship.x, ship.y); ctx.rotate(ship.a);
    // flame
    if (ship.thrusting) {
      const f = 14 + Math.random() * 10;
      const g = ctx.createLinearGradient(0, 6, 0, 8 + f);
      g.addColorStop(0, 'rgba(255,255,220,1)'); g.addColorStop(0.4, 'rgba(255,190,40,.9)'); g.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-5, 6); ctx.lineTo(0, 8 + f); ctx.lineTo(5, 6); ctx.closePath(); ctx.fill();
    }
    ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
    // legs
    ctx.strokeStyle = '#c8ccd6';
    ctx.beginPath();
    ctx.moveTo(-7, 0); ctx.lineTo(-12, 11); ctx.moveTo(-15, 12); ctx.lineTo(-9, 12);
    ctx.moveTo(7, 0); ctx.lineTo(12, 11); ctx.moveTo(15, 12); ctx.lineTo(9, 12);
    ctx.moveTo(-7, 3); ctx.lineTo(-11, 9); ctx.moveTo(7, 3); ctx.lineTo(11, 9);
    ctx.stroke();
    // engine bell
    ctx.fillStyle = '#5c6474';
    ctx.beginPath(); ctx.moveTo(-3, 2); ctx.lineTo(3, 2); ctx.lineTo(5, 7); ctx.lineTo(-5, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    // descent stage (gold foil)
    const gg = ctx.createLinearGradient(-9, 0, 9, 0);
    gg.addColorStop(0, '#8a6010'); gg.addColorStop(0.5, '#ffd24a'); gg.addColorStop(1, '#8a6010');
    ctx.fillStyle = gg; ctx.strokeStyle = '#ffe9a0';
    ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, -4); ctx.lineTo(8, 3); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    // ascent stage cabin
    const cg = ctx.createLinearGradient(-6, -13, 6, -4);
    cg.addColorStop(0, '#f2f4f8'); cg.addColorStop(1, '#8a92a6');
    ctx.fillStyle = cg; ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-7, -9); ctx.lineTo(-3, -13); ctx.lineTo(3, -13); ctx.lineTo(7, -9); ctx.lineTo(6, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    // window
    ctx.fillStyle = '#2bd4ff';
    ctx.beginPath(); ctx.moveTo(-3, -10); ctx.lineTo(3, -10); ctx.lineTo(2, -7); ctx.lineTo(-2, -7); ctx.closePath(); ctx.fill();
    // antenna
    ctx.strokeStyle = '#c8ccd6';
    ctx.beginPath(); ctx.moveTo(4, -13); ctx.lineTo(6, -17); ctx.stroke();
    ctx.restore();
  }

  function drawParticles() {
    applyCam();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
      const t = clamp(p.life / p.max, 0, 1);
      if (p.kind === 'fire') {
        ctx.fillStyle = `rgba(255,${Math.round(120 + 120 * t)},${Math.round(40 * t)},${t})`;
        const s = 1.5 + 3 * (1 - t);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      } else {
        ctx.fillStyle = `rgba(255,240,200,${t})`;
        ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#e0e4ee'; ctx.lineWidth = 1.6;
    for (const d of debris) {
      ctx.globalAlpha = clamp(d.life, 0, 1);
      ctx.beginPath();
      ctx.moveTo(d.x - Math.cos(d.a) * d.len / 2, d.y - Math.sin(d.a) * d.len / 2);
      ctx.lineTo(d.x + Math.cos(d.a) * d.len / 2, d.y + Math.sin(d.a) * d.len / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function hudText(txt, x, y, color = '#e8f4ff', align = 'left', size = 11) {
    ctx.font = `${size}px 'Press Start 2P', monospace`;
    ctx.textAlign = align; ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,.7)'; ctx.fillText(txt, x + 2, y + 2);
    ctx.fillStyle = color; ctx.fillText(txt, x, y);
  }

  function drawHUD() {
    if (!ship || state === 'title' || state === 'board') return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const top = 14;
    const small = W < 480;
    const fs = small ? 9 : 11;
    hudText('SCORE', 14, top, '#7f96b0', 'left', fs - 2);
    hudText(score.toLocaleString(), 14, top + fs + 2, '#ffd23a', 'left', fs + 2);
    hudText('LEVEL ' + levelNum, 14, top + fs * 2 + 14, '#4ff0ff', 'left', fs);
    // lives
    for (let i = 0; i < Math.max(0, lives); i++) drawMiniShip(20 + i * 22, top + fs * 3 + 30);

    // fuel gauge
    const gw = small ? 110 : 170, gx = W - gw - 14;
    hudText('FUEL', W - 14, top, '#7f96b0', 'right', fs - 2);
    const frac = clamp(ship.fuel / level.fuel, 0, 1);
    ctx.fillStyle = 'rgba(10,20,40,.8)'; ctx.fillRect(gx, top + fs + 4, gw, 14);
    ctx.fillStyle = frac > 0.5 ? '#6cff6c' : frac > 0.2 ? '#ffd23a' : (Math.sin(time * 10) > 0 ? '#ff4a3a' : '#7a1a10');
    ctx.fillRect(gx + 2, top + fs + 6, (gw - 4) * frac, 10);
    ctx.strokeStyle = '#3d6aa8'; ctx.lineWidth = 1; ctx.strokeRect(gx + 0.5, top + fs + 4.5, gw - 1, 13);
    hudText(String(Math.floor(ship.fuel)), W - 14, top + fs + 24, '#e8f4ff', 'right', fs);

    // flight data
    const vx = ship.vx / SPEED_UNIT, vy = ship.vy / SPEED_UNIT;
    const okX = Math.abs(ship.vx) <= SAFE_VX, okY = ship.vy <= SAFE_VY;
    const okA = Math.abs(ship.a) <= SAFE_ANGLE;
    const alt = Math.max(0, (level.pad.y - (ship.y + 12)) / SPEED_UNIT);
    const y0 = top + fs * 4 + 40;
    hudText('H-SPD ' + (vx >= 0 ? ' ' : '') + vx.toFixed(1), W - 14, y0, okX ? '#6cff6c' : '#ff6a4a', 'right', fs);
    hudText('V-SPD ' + (vy >= 0 ? ' ' : '') + vy.toFixed(1), W - 14, y0 + fs + 8, okY ? '#6cff6c' : '#ff6a4a', 'right', fs);
    hudText('ANGLE ' + Math.round(Math.abs(ship.a) * 180 / Math.PI) + '°', W - 14, y0 + (fs + 8) * 2, okA ? '#6cff6c' : '#ff6a4a', 'right', fs);
    hudText('ALT ' + alt.toFixed(0), W - 14, y0 + (fs + 8) * 3, '#9fb6d0', 'right', fs);

    // off-screen pad pointer
    const p = level.pad;
    const [sx, sy] = worldToScreen((p.x1 + p.x2) / 2, p.y);
    const margin = 40;
    if (sx < margin || sx > W - margin || sy < margin || sy > H - 150) {
      const cx = W / 2, cy = H * 0.45;
      const ang = Math.atan2(sy - cy, sx - cx);
      const r = Math.min(W, H) * 0.36;
      const ax = clamp(cx + Math.cos(ang) * r, margin, W - margin);
      const ay = clamp(cy + Math.sin(ang) * r, margin + 60, H - 160);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.fillStyle = `rgba(108,255,108,${0.5 + 0.4 * Math.sin(time * 5)})`;
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -8); ctx.lineTo(-2, 0); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    if (ship.fuel <= 0 && state === 'flying') {
      hudText('OUT OF FUEL', W / 2, H * 0.2, Math.sin(time * 8) > 0 ? '#ff4a3a' : '#ffd23a', 'center', fs + 3);
    }
    if (state === 'ready') {
      hudText('LEVEL ' + levelNum, W / 2, H * 0.22, '#ffd23a', 'center', small ? 18 : 26);
      hudText('GET READY', W / 2, H * 0.22 + (small ? 30 : 42), '#4ff0ff', 'center', small ? 11 : 14);
    }
    if (state === 'crashed') {
      hudText('CRASHED!', W / 2, H * 0.22, '#ff4a3a', 'center', small ? 22 : 30);
      hudText(lives > 0 ? `${lives} SHIP${lives === 1 ? '' : 'S'} LEFT` : 'NO SHIPS LEFT', W / 2, H * 0.22 + (small ? 34 : 46), '#e8f4ff', 'center', small ? 10 : 13);
    }
  }
  function drawMiniShip(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.scale(0.65, 0.65);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(-8, -4, 16, 7);
    ctx.fillStyle = '#e0e4ee';
    ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-3, -12); ctx.lineTo(3, -12); ctx.lineTo(6, -4); ctx.fill();
    ctx.strokeStyle = '#e0e4ee'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-7, 2); ctx.lineTo(-12, 10); ctx.moveTo(7, 2); ctx.lineTo(12, 10); ctx.stroke();
    ctx.restore();
  }

  function render() {
    drawBackground();
    if (level) { drawTerrain(); drawParticles(); drawShip(); }
    drawHUD();
  }

  // ---------- Main loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state !== 'paused') update(dt);
    if (state === 'title' || state === 'board' || state === 'gameover') {
      // gentle attract-mode drift
      cam.y = Math.sin(now / 4000) * 80 + 200; cam.x = WORLD_W / 2 + Math.sin(now / 6000) * 150;
      time += dt;
    }
    render();
    requestAnimationFrame(frame);
  }

  // expose for automated testing
  window.__astro = { get state() { return state; }, get ship() { return ship; }, get level() { return level; }, input, genLevel };

  toTitle();
  requestAnimationFrame(frame);
})();
