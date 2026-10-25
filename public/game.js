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
  const START_LIVES = 3;
  const WORLD_W = 1000;

  // Classic arrowhead ship (local coords, nose up = -y)
  const HULL = [[0, -12], [8, 10], [-8, 10]];
  const FEET = [[-8, 10], [8, 10]];
  const FOOT_Y = 10;

  // Asteroid outlines (unit radius)
  const ROCK_SHAPES = [
    [[0, -1], [0.5, -1], [1, -0.5], [1, 0], [0.5, 1], [-0.25, 1], [-0.25, 0.5], [-0.75, 1], [-1, 0.25], [-0.5, 0], [-1, -0.25], [-0.5, -1]],
    [[-0.5, -1], [0.25, -1], [1, -0.5], [0.5, -0.25], [1, 0.25], [0.5, 1], [-0.25, 0.75], [-0.5, 1], [-1, 0.5], [-1, -0.5]],
    [[-0.25, -1], [0.5, -1], [1, -0.25], [1, 0.25], [0.5, 1], [0, 1], [0, 0.25], [-0.5, 1], [-1, 0.25], [-0.75, 0], [-1, -0.5], [-0.5, -0.5]],
  ];

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

    // slowly spinning asteroids hanging in the shaft
    const rocks = [];
    if (n >= 2) {
      for (let i = 0; i < rows.length - 2; i++) {
        const r = rows[i];
        if (r.y < 200 || r.y > depth - 120 || rnd() > Math.min(0.45, 0.15 + n * 0.05)) continue;
        const side = rnd() < 0.5 ? -1 : 1;
        const rad = Math.min(40, r.w * 0.18);
        const wallX = r.cx + side * r.w / 2;
        rocks.push({
          x: wallX - side * (rad + 34), y: r.y + (rnd() - 0.5) * 40, r: rad,
          shape: ROCK_SHAPES[Math.floor(rnd() * ROCK_SHAPES.length)],
          a: rnd() * Math.PI * 2, spin: (rnd() - 0.5) * 0.9,
        });
      }
    }

    // static collision segments
    const segs = [];
    const addLine = (pts, padAt = -1) => {
      for (let i = 0; i < pts.length - 1; i++) {
        segs.push(withBounds({ ax: pts[i][0], ay: pts[i][1], bx: pts[i + 1][0], by: pts[i + 1][1], pad: i === padAt }));
      }
    };
    addLine(left);
    addLine(right);
    addLine(floor, padIndex);

    const fuel = Math.round(650 + depth * 0.55 - n * 15);
    return {
      n, left, right, floor, padIndex, rocks, segs, tunnel,
      pad: { x1: padX1, x2: padX2, y: padY },
      start: { x: WORLD_W / 2, y: -120 },
      fuel, top: -1400,
    };
  }
  function rockPoints(r) {
    const c = Math.cos(r.a), s = Math.sin(r.a);
    return r.shape.map(([x, y]) => [r.x + (x * c - y * s) * r.r, r.y + (x * s + y * c) * r.r]);
  }

  // ---------- Audio ----------
  let actx = null, thrustGain = null, noiseBuf = null, crunchBuf = null, echoIn = null;
  // background music: starts on the first key/tap (browsers block autoplay) and loops forever
  const music = new Audio('astrolander.mp3');
  music.loop = true; music.volume = 0.5;
  let musicOn = false;
  function playMusic() {
    if (musicOn && music.paused && state !== 'paused' && !document.hidden) music.play().catch(() => {});
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) music.pause(); else playMusic(); });
  function initAudio() {
    musicOn = true; playMusic();
    if (actx) { if (actx.state === 'suspended') actx.resume(); return; }
    try {
      actx = new (window.AudioContext || window.webkitAudioContext)();
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = actx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const lp = actx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 340;
      thrustGain = actx.createGain(); thrustGain.gain.value = 0;
      src.connect(lp).connect(thrustGain).connect(actx.destination);
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
      echoIn.connect(delay); delay.connect(fb).connect(delay); delay.connect(wet).connect(actx.destination);
    } catch (e) { actx = null; }
  }
  function setThrustSound(on) {
    if (!thrustGain) return;
    thrustGain.gain.setTargetAtTime(on ? 0.35 : 0, actx.currentTime, 0.03);
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
  // one synth note: pulse duty (number) or oscillator type (string), optional pitch slide,
  // detuned unison, resonant filter sweep, vibrato and echo send
  function tone({ freq, to = freq, dur, when = 0, vol = 0.06, wave = 0.5, attack = 0.004, detune = 0, cutoff = 0, vibrato = 0, echo = false }) {
    if (!actx) return;
    const t = actx.currentTime + when;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(actx.destination);
    if (echo) g.connect(echoIn);
    let head = g;
    if (cutoff) {
      const f = actx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 7;
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
    src.connect(g).connect(actx.destination);
    src.start(t); src.stop(t + dur + 0.05);
    tone({ freq: 520, to: 40, dur: 0.6, wave: 0.25, vol: vol * 0.12 });
  }
  // short UI sounds
  const sfx = {
    landed() { // 8-bit victory arpeggio ending on a vibrato chord
      [523.25, 659.25, 783.99].forEach((f, i) => tone({ freq: f, dur: 0.09, when: i * 0.075, wave: 0.25, vol: 0.06 }));
      tone({ freq: 1046.5, dur: 0.55, when: 0.225, wave: 0.25, vol: 0.06, vibrato: 0.012, echo: true });
      tone({ freq: 1318.5, dur: 0.55, when: 0.225, wave: 0.5, vol: 0.035, vibrato: 0.012, echo: true });
    },
    tick(k) { tone({ freq: 1400 + k * 500, dur: 0.03, wave: 0.125, vol: 0.035 }); },
    coin() { // classic two-note coin pickup
      tone({ freq: 987.77, dur: 0.07, wave: 0.5, vol: 0.05 });
      tone({ freq: 1318.5, dur: 0.28, when: 0.07, wave: 0.5, vol: 0.05 });
    },
    select() { tone({ freq: 880, dur: 0.035, wave: 0.25, vol: 0.04 }); },
    confirm() { // 80s synth chirp: detuned saws sweeping up through a resonant filter
      tone({ freq: 523.25, to: 1046.5, dur: 0.14, wave: 'sawtooth', detune: 12, cutoff: 3200, vol: 0.06, echo: true });
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
    // 80s analog bass pluck: two detuned saws through a closing resonant filter
    tone({ freq: beatHigh ? 62 : 55, dur: 0.2, wave: 'sawtooth', detune: 9, cutoff: 1600, vol: 0.2 });
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

  // ---------- Game state ----------
  // title | ready | flying | paused | crashed | results | gameover | entry | board
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
    ship = { x: level.start.x, y: level.start.y, vx: 0, vy: 0, a: 0, fuel: level.fuel, thrusting: false, alive: true };
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
  function nextLevel() { levelNum++; loadLevel(); }
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
    for (const r of level.rocks) {
      if (Math.abs(r.x - ship.x) > r.r + 16 || Math.abs(r.y - ship.y) > r.r + 16) continue;
      const pts = rockPoints(r);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        test(withBounds({ ax: a[0], ay: a[1], bx: b[0], by: b[1], pad: false }));
      }
    }
    return { hit, onlyPad };
  }

  function update(dt) {
    time += dt; stateAge += dt; frameNo++;
    updateParticles(dt);
    if (level && state !== 'paused') for (const r of level.rocks) r.a += r.spin * dt;

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

  function land() {
    ship.vy = Math.max(0, ship.vy);
    const speed = Math.hypot(ship.vx, ship.vy);
    const p = level.pad;
    ship.y = p.y - FOOT_Y;
    ship.thrusting = false;

    const fuelLeft = Math.floor(ship.fuel);
    const fuelBonus = fuelLeft * FUEL_BONUS_PER_UNIT;
    const speedBonus = Math.round(MAX_SPEED_BONUS * clamp(1 - speed / Math.hypot(SAFE_VX, SAFE_VY), 0, 1));
    const padC = (p.x1 + p.x2) / 2, half = (p.x2 - p.x1) / 2 - 8;
    const accuracyBonus = Math.round(MAX_ACCURACY_BONUS * clamp(1 - Math.abs(ship.x - padC) / Math.max(half, 1), 0, 1));
    ship.vx = ship.vy = 0; ship.a = 0;
    tally = {
      rows: [
        { label: 'FUEL REMAINING', value: fuelLeft, add: false },
        { label: 'FUEL BONUS', value: fuelBonus, add: true },
        { label: 'LANDING SPEED BONUS', value: speedBonus, add: true },
        { label: 'LANDING ACCURACY BONUS', value: accuracyBonus, add: true },
        { label: 'TOTAL', value: fuelBonus + speedBonus + accuracyBonus, add: false },
      ],
      i: -1, t: 0, pause: 0.6, ready: false, tick: 0,
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
    tally.tick -= dt;
    if (tally.tick <= 0 && k < 1) { sfx.tick(k); tally.tick = 0.05; }
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
    const { left, right, floor, padIndex, rocks, pad } = level;
    const lw = 1.3 / scale;
    ctx.beginPath();
    polyPath(left); polyPath(right);
    polyPath(floor.slice(0, padIndex + 1));
    polyPath(floor.slice(padIndex + 1));
    glow(lw, 0.8);

    ctx.beginPath();
    for (const r of rocks) polyPath(rockPoints(r), true);
    glow(lw, 0.9);

    // landing pad: a brighter, thicker double line with blinking end markers
    const bright = 0.75 + 0.25 * Math.sin(time * 6);
    ctx.beginPath();
    ctx.moveTo(pad.x1, pad.y); ctx.lineTo(pad.x2, pad.y);
    ctx.moveTo(pad.x1 + 4, pad.y + 4); ctx.lineTo(pad.x2 - 4, pad.y + 4);
    glow(2.4 / scale, bright);
    if (Math.sin(time * 6) > 0) {
      ctx.beginPath();
      ctx.moveTo(pad.x1, pad.y - 1); ctx.lineTo(pad.x1, pad.y - 9);
      ctx.moveTo(pad.x2, pad.y - 1); ctx.lineTo(pad.x2, pad.y - 9);
      glow(1.6 / scale, 1);
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
        'PILOT YOUR SHIP DOWN THE CAVERN',
        'AND LAND ON THE PAD',
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
