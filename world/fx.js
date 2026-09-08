/* world/fx.js — what a hit feels like: sound, vibration, smoke and marks.

   Every sound is synthesised in WebAudio (no files): bolts, blasts, brick
   clatter, the saber, the engine. Haptics use navigator.vibrate where it
   exists. Smoke is one Points mesh with a soft sprite, 600 particles, one
   draw call. Hit marks and floating tallies are DOM. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ───────────────────────── sound ───────────────────────── */
const Sfx = {
  ctx: null, master: null, muted: false, noiseBuf: null, counts: {}, last: {}, engineN: null, saberN: null, clatterAt: 0, clatterN: 0,
  init() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.7; this.master.connect(this.ctx.destination);
      const n = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, n, n); const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      return true;
    } catch (e) { return false; }
  },
  /** Call from the first touch or key: browsers only let audio start from a gesture. */
  unlock() { if (!this.init()) return; if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); },
  setMute(m) { this.muted = !!m; if (this.master) this.master.gain.value = m ? 0 : 0.7; try { localStorage.setItem('world.mute', m ? '1' : '0'); } catch (e) { } },
  count(name) { this.counts[name] = (this.counts[name] || 0) + 1; },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  /** A tone sweeping f0→f1 over dur seconds. */
  tone(type, f0, f1, dur, gain, { attack = 0.005, detune = 0 } = {}) {
    if (!this.ctx || this.muted) return; const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); if (detune) o.detune.value = detune;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  /** A burst of noise through a sweeping filter. */
  burst(dur, fFrom, fTo, gain, { type = 'lowpass', q = 0.7, attack = 0.005 } = {}) {
    if (!this.ctx || this.muted) return; const c = this.ctx, t = c.currentTime, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(fFrom, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, fTo), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + attack); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.05);
  },
  gap(name, min) { const t = this.now(); if (t - (this.last[name] || -9) < min) return false; this.last[name] = t; return true; },
  laser() { this.count('laser'); if (!this.gap('laser', 0.03)) return; this.tone('sawtooth', 900, 280, 0.13, 0.18); this.burst(0.08, 4000, 800, 0.08, { type: 'bandpass', q: 2 }); },
  blaster() { this.count('blaster'); this.tone('square', 640, 190, 0.1, 0.16); },
  click() { this.count('click'); if (!this.gap('click', 0.02)) return; this.tone('square', 1800, 1300, 0.025, 0.05); },   // a brick landing
  torpedo() { this.count('torpedo'); this.tone('sawtooth', 140, 60, 0.6, 0.25); this.burst(0.5, 600, 120, 0.2); },
  /** size 0..1: from a bolt's pop to a torpedo's thunder. */
  boom(size) {
    this.count('boom'); if (!this.gap('boom', 0.04)) return; size = clamp(size, 0, 1);
    const dur = 0.35 + size * 1.1; this.burst(dur, 2500 + size * 1500, 120, 0.35 + size * 0.45, { attack: 0.003 });
    this.tone('sine', 55 + size * 20, 30, 0.25 + size * 0.5, 0.4 + size * 0.4, { attack: 0.002 });
    if (size > 0.5) this.burst(dur * 1.4, 400, 60, 0.3, { attack: 0.05 });
  },
  /** Bricks landing: short clicks, at most eight per fifth of a second. */
  clatter(size = 0.5) {
    const t = this.now(); if (t - this.clatterAt > 0.2) { this.clatterAt = t; this.clatterN = 0; } if (this.clatterN++ >= 8) return;
    this.count('clatter'); this.burst(0.04 + size * 0.03, 3200 - size * 1400, 900, 0.12 + size * 0.1, { type: 'bandpass', q: 1.5, attack: 0.001 });
  },
  thud(size = 0.5) { this.count('thud'); if (!this.gap('thud', 0.08)) return; this.burst(0.18 + size * 0.2, 500, 60, 0.3 + size * 0.3); this.tone('sine', 70, 35, 0.2, 0.35); },
  crunch() { this.count('crunch'); this.burst(0.45, 1800, 200, 0.5, { attack: 0.002 }); this.burst(0.3, 6000, 1500, 0.2, { type: 'bandpass', q: 1 }); this.tone('sine', 60, 30, 0.35, 0.5); },
  hurt() { this.count('hurt'); this.tone('triangle', 520, 160, 0.25, 0.25); },
  respawn() { this.count('respawn'); this.tone('sine', 220, 660, 0.4, 0.15); },
  swing() { this.count('swing'); this.burst(0.28, 300, 2200, 0.22, { type: 'bandpass', q: 1.2, attack: 0.04 }); if (this.saberN) { const o = this.saberN.o1, t = this.now(); o.frequency.cancelScheduledValues(t); o.frequency.setValueAtTime(90, t); o.frequency.linearRampToValueAtTime(150, t + 0.12); o.frequency.linearRampToValueAtTime(90, t + 0.35); } },
  strike() { this.count('strike'); this.burst(0.2, 5000, 1200, 0.3, { type: 'bandpass', q: 3, attack: 0.001 }); this.tone('square', 1200, 300, 0.12, 0.1); },
  /** The saber's hum: two detuned saws, on while the blade is out. */
  saber(on) {
    if (!this.ctx) return; if (on && !this.saberN) {
      const c = this.ctx, o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 90; o2.frequency.value = 91.5; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0; g.gain.linearRampToValueAtTime(0.08, c.currentTime + 0.4);
      o1.connect(f); o2.connect(f); f.connect(g); g.connect(this.master); o1.start(); o2.start(); this.saberN = { o1, o2, g }; this.count('saberOn');
    } else if (!on && this.saberN) { const n = this.saberN, t = this.now(); n.g.gain.linearRampToValueAtTime(0, t + 0.2); n.o1.stop(t + 0.3); n.o2.stop(t + 0.3); this.saberN = null; }
  },
  /** The TIE's engine: pitch and grit follow speed and boost. */
  engine(on, speed01 = 0, boost = false) {
    if (!this.ctx) return; if (on && !this.engineN) {
      const c = this.ctx, o = c.createOscillator(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = 55; s.buffer = this.noiseBuf; s.loop = true; f.type = 'lowpass'; f.frequency.value = 300; g.gain.value = 0;
      o.connect(f); s.connect(f); f.connect(g); g.connect(this.master); o.start(); s.start(); this.engineN = { o, s, f, g }; this.count('engineOn');
    }
    if (this.engineN) { const n = this.engineN, t = this.now(), tgtG = on ? (this.muted ? 0 : 0.05 + speed01 * 0.08 + (boost ? 0.06 : 0)) : 0; n.g.gain.setTargetAtTime(tgtG, t, 0.15); n.o.frequency.setTargetAtTime(50 + speed01 * 70 + (boost ? 40 : 0), t, 0.2); n.f.frequency.setTargetAtTime(250 + speed01 * 900 + (boost ? 800 : 0), t, 0.2); if (!on) { n.o.stop(t + 0.6); n.s.stop(t + 0.6); this.engineN = null; } }
  },
  stats() { return { ready: !!this.ctx, state: this.ctx ? this.ctx.state : 'none', muted: this.muted, counts: { ...this.counts } }; },
};

/* ───────────────────────── haptics ───────────────────────── */
let hapticAt = 0, hapticN = 0, touched = false;
if (typeof window !== 'undefined') { const on = () => { touched = true; }; window.addEventListener('pointerdown', on, { passive: true, once: true }); window.addEventListener('keydown', on, { once: true }); }
function haptic(pattern) {
  try { if (!navigator.vibrate || !touched) return false; /* the browser refuses to buzz before a tap, loudly */ const t = performance.now(); if (t - hapticAt < 60) return false; hapticAt = t; hapticN++; return navigator.vibrate(pattern); } catch (e) { return false; }
}
haptic.count = () => hapticN;

/* ───────────────────────── smoke, dust, sparks ───────────────────────── */
const CAP = 600;
class Smoke {
  constructor(scene, M) {
    this.M = M; this.n = CAP; this.pos = new Float32Array(CAP * 3); this.col = new Float32Array(CAP * 3); this.size = new Float32Array(CAP); this.alpha = new Float32Array(CAP);
    this.vel = new Float32Array(CAP * 3); this.life = new Float32Array(CAP); this.age = new Float32Array(CAP); this.grow = new Float32Array(CAP); this.rise = new Float32Array(CAP); this.free = []; for (let i = CAP - 1; i >= 0; i--) this.free.push(i);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3)); g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1)); g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, scale: { value: 400 } }, transparent: true, depthWrite: false, vertexColors: true,
      vertexShader: 'attribute float psize; attribute float alpha; varying float vA; varying vec3 vC; uniform float scale; void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = psize * (scale / max(1.0, -mv.z)); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, t.a * vA); if (gl_FragColor.a < 0.01) discard; }',
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.name = 'smoke'; this.points.renderOrder = 4; scene.add(this.points);
    this.columns = []; this.alive = 0; this.emitted = 0;
  }
  /** One particle. pos in LDU; vel LDU/s; life s; size LDU; colour [r,g,b] linear. */
  one(x, y, z, vx, vy, vz, life, size, grow, rise, r, g, b) {
    let i; if (this.free.length) i = this.free.pop(); else { let old = 0; for (let k = 1; k < CAP; k++) if (this.age[k] / Math.max(0.01, this.life[k]) > this.age[old] / Math.max(0.01, this.life[old])) old = k; i = old; }
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.age[i] = 0; this.size[i] = size; this.grow[i] = grow; this.rise[i] = rise; this.alpha[i] = 0.8; this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b; this.emitted++;
  }
  /** A blast's dust: n grey puffs flung outward, plus a few sparks. */
  puff(p, n, r) {
    const M = this.M, spd = (2 + r / (3 * M)) * M;
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, u = Math.random(), s = spd * (0.3 + Math.random()); const tint = 0.22 + Math.random() * 0.15; this.one(p.x, p.y, p.z, Math.cos(a) * s * u, s * (0.4 + Math.random() * 0.8), Math.sin(a) * s * u, 1.2 + Math.random() * 1.5, 0.5 * M + Math.random() * M, 1.6 * M, 0.6 * M, tint, tint * 0.95, tint * 0.85); }
    const sparks = Math.min(12, Math.round(n / 3)); for (let k = 0; k < sparks; k++) { const a = Math.random() * Math.PI * 2, s = spd * 1.8 * Math.random(); this.one(p.x, p.y, p.z, Math.cos(a) * s, s * Math.random(), Math.sin(a) * s, 0.3 + Math.random() * 0.3, 0.25 * M, 0, -6 * M, 1, 0.7, 0.25); }
  }
  /** Slow smoke rising from a point for a while. */
  column(p, seconds, rate = 6) { this.columns.push({ p: p.clone(), until: seconds, acc: 0, rate }); if (this.columns.length > 24) this.columns.shift(); }
  step(dt) {
    const M = this.M; let alive = 0;
    for (let c = this.columns.length - 1; c >= 0; c--) { const col = this.columns[c]; col.until -= dt; if (col.until <= 0) { this.columns.splice(c, 1); continue; } col.acc += dt * col.rate; while (col.acc >= 1) { col.acc--; const t = 0.12 + Math.random() * 0.1; this.one(col.p.x + (Math.random() - .5) * 2 * M, col.p.y, col.p.z + (Math.random() - .5) * 2 * M, (Math.random() - .5) * 0.6 * M, 1.2 * M, (Math.random() - .5) * 0.6 * M, 3 + Math.random() * 2, 1.2 * M, 1.8 * M, 0.8 * M, t, t, t); } }
    for (let i = 0; i < CAP; i++) {
      if (this.life[i] <= 0) continue; this.age[i] += dt;
      if (this.age[i] >= this.life[i]) { this.life[i] = 0; this.alpha[i] = 0; this.size[i] = 0; this.pos[i * 3 + 1] = -1e6; this.free.push(i); continue; }
      const u = this.age[i] / this.life[i]; alive++;
      this.vel[i * 3] *= 1 - dt * 1.5; this.vel[i * 3 + 2] *= 1 - dt * 1.5; this.vel[i * 3 + 1] += (this.rise[i] - this.vel[i * 3 + 1]) * dt * 1.2;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] += this.grow[i] * dt; this.alpha[i] = 0.8 * (1 - u) * (u < 0.1 ? u / 0.1 : 1);
    }
    this.alive = alive; const g = this.points.geometry; g.attributes.position.needsUpdate = true; g.attributes.psize.needsUpdate = true; g.attributes.alpha.needsUpdate = true; g.attributes.color.needsUpdate = true;
  }
  stats() { return { alive: this.alive, emitted: this.emitted, columns: this.columns.length }; }
}

/* ───────────────────────── marks on the screen ───────────────────────── */
const Hits = {
  n: 0,
  mark() { const m = document.getElementById('hitmark'); if (!m) return; m.classList.remove('hit'); void m.offsetWidth; m.classList.add('hit'); this.n++; },
  float(text, big) {
    const host = document.getElementById('floats'); if (!host) return; const e = document.createElement('div'); e.className = 'float' + (big ? ' big' : ''); e.textContent = text; e.style.left = (46 + Math.random() * 8) + '%'; host.appendChild(e);
    setTimeout(() => e.remove(), 900); while (host.children.length > 6) host.firstChild.remove();
  },
};
window.Fx = { Sfx, haptic, Smoke, Hits };
})();
