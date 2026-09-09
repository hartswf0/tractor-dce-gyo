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
  ctx: null, master: null, muted: false, counts: {}, last: {},
  init() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      this.ctx = new AC(); const m = Sound.attach(this.ctx); this.master = m.master; this.master.gain.value = this.muted ? 0 : 0.7; Sound.muted = this.muted;
      return true;
    } catch (e) { return false; }
  },
  /** Call from the first touch or key: browsers only let audio start from a gesture. */
  unlock() { if (!this.init()) return; if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => { }); },
  setMute(m) { this.muted = !!m; Sound.muted = this.muted; if (this.master) this.master.gain.value = m ? 0 : 0.7; try { localStorage.setItem('world.mute', m ? '1' : '0'); } catch (e) { } },
  count(name) { this.counts[name] = (this.counts[name] || 0) + 1; },
  now() { return Sound.armed ? Sound.clock() : this.ctx ? this.ctx.currentTime : performance.now() / 1000; },
  gap(name, min) { const t = this.now(); if (t - (this.last[name] || -9) < min) return false; this.last[name] = t; return true; },
  /* every sound is an event on the film's log and a one-shot on the page's context; the names are what the tests count */
  laser() { this.count('laser'); if (!this.gap('laser', 0.03)) return; Sound.fire('laser'); },
  blaster(p) { this.count('blaster'); Sound.fire('blaster', p); },
  click() { this.count('click'); if (!this.gap('click', 0.02)) return; Sound.fire('click'); },   // a brick landing
  torpedo(p) { this.count('torpedo'); Sound.fire('torpedo', p); },
  /** size 0..1: from a bolt's pop to a torpedo's thunder. */
  boom(size, p) { this.count('boom'); if (!this.gap('boom', 0.04)) return; Sound.fire('boom', { size: clamp(size == null ? 0.5 : size, 0, 1.4), ...(p || {}) }); },
  /** Bricks landing: short clicks, at most eight per fifth of a second. */
  clatter(size = 0.5, p) { const t = this.now(); if (t - (this.clatterAt || 0) > 0.2) { this.clatterAt = t; this.clatterN = 0; } if ((this.clatterN = (this.clatterN || 0) + 1) > 8) return; this.count('clatter'); Sound.fire('clatter', { size, ...(p || {}) }); },
  thud(size = 0.5, p) { this.count('thud'); if (!this.gap('thud', 0.08)) return; Sound.fire('thud', { size, ...(p || {}) }); },
  stomp(size = 1, p) { this.count('stomp'); Sound.fire('stomp', { size, ...(p || {}) }); },
  skid() { this.count('skid'); if (!this.gap('skid', 0.35)) return; Sound.fire('skid'); },   // tyres over the limit: a short squeal
  crunch(p) { this.count('crunch'); Sound.fire('crunch', p); },
  hurt() { this.count('hurt'); Sound.fire('hurt'); },
  respawn() { this.count('respawn'); Sound.fire('respawn'); },
  swing(p) { this.count('swing'); Sound.fire('swing', p); Sound.bump((p && p.id) || 'saber', 'pitch', [[0, 90], [0.12, 150], [0.35, 90]]); },
  strike(p) { this.count('strike'); Sound.fire('strike', p); },
  clash(p) { this.count('clash'); Sound.fire('clash', p); },
  whoosh(p) { this.count('whoosh'); Sound.fire('whoosh', p); },
  zip() { this.count('zip'); Sound.fire('zip'); },
  footstep(p) { this.count('footstep'); Sound.fire('footstep', p); },
  breath() { this.count('breath'); Sound.fire('breath'); },
  /** The saber's hum: two detuned saws, on while the blade is out. */
  saber(on, id) { const key = id || 'saber'; if (on) { if (!Sound.open[key]) this.count('saberOn'); Sound.loop(key, 'saber', { gain: this.muted ? 0 : 0.08 }); } else Sound.loop(key, 'saber', null); },
  /** The ride's engine: pitch and grit follow speed and boost. */
  engine(on, speed01 = 0, boost = false) { if (on) { if (!Sound.open.engine) this.count('engineOn'); Sound.loop('engine', 'engine', { gain: this.muted ? 0 : 0.05 + speed01 * 0.08 + (boost ? 0.06 : 0), pitch: 50 + speed01 * 70 + (boost ? 40 : 0), cutoff: 250 + speed01 * 900 + (boost ? 800 : 0) }); } else Sound.loop('engine', 'engine', null); },
  stats() { return { ready: !!this.ctx, state: this.ctx ? this.ctx.state : 'none', muted: this.muted, counts: { ...this.counts }, sound: window.Sound ? Sound.stats() : null }; },
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
  puff(p, n, r, grey) {
    const M = this.M, spd = (2 + r / (3 * M)) * M;
    for (let k = 0; k < n; k++) { const a = Math.random() * Math.PI * 2, u = Math.random(), s = spd * (0.3 + Math.random()); const tint = grey != null ? grey - 0.05 + Math.random() * 0.1 : 0.22 + Math.random() * 0.15; this.one(p.x, p.y, p.z, Math.cos(a) * s * u, s * (0.4 + Math.random() * 0.8), Math.sin(a) * s * u, 1.2 + Math.random() * 1.5, 0.5 * M + Math.random() * M, 1.6 * M, 0.6 * M, tint, tint * 0.95, tint * 0.85); }
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
