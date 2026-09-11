/* world/sound.js — the film's sound: a log of what happened on the reel clock, played live through
   the page's AudioContext with a small lookahead, or rendered whole into an OfflineAudioContext for
   an export. Everything is synthesised (no files) except the spoken lines, which are small opus files
   made by tools/lines.js with espeak-ng; a line without a file is babbled.

   Three kinds of thing are logged, all on the reel clock (seconds from the film's start, never the
   context's clock): an EVENT {t, name, p} (a one-shot: a blaster, a boom, a line), a CURVE (a
   continuous source: an engine, a hover whine, the wind; samples of its parameters per step) and a
   CUE {t, name, fade} (a music cue that loops until the next). `Sound.render` schedules any of them
   on any BaseAudioContext at absolute times, which is what makes live and offline the same sound. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);

/* ── a seeded noise buffer, the same on every context ── */
function mulberry(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const noises = new WeakMap();
function noise(ctx) { let b = noises.get(ctx); if (b) return b; const n = ctx.sampleRate * 2, r = mulberry(1234567); b = ctx.createBuffer(1, n, ctx.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; noises.set(ctx, b); return b; }

/* ── the mix: four buses into a compressor into the master ── */
const mixes = new WeakMap();
function mix(ctx) {
  let m = mixes.get(ctx); if (m) return m;
  const g = v => { const n = ctx.createGain(); n.gain.value = v; return n; };
  const master = g(0.7), comp = ctx.createDynamicsCompressor(); comp.threshold.value = -22; comp.ratio.value = 6; comp.knee.value = 12; comp.attack.value = 0.003; comp.release.value = 0.2;
  const soft = ctx.createWaveShaper(), curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = (i / 511.5) - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); } soft.curve = curve; soft.oversample = '2x';   // the last word: nothing clips
  m = { master, comp, score: g(0.5), foley: g(0.85), voice: g(1.1), ambience: g(0.6) };
  for (const k of ['score', 'foley', 'voice', 'ambience']) m[k].connect(comp); comp.connect(soft); soft.connect(master); master.connect(ctx.destination);
  mixes.set(ctx, m); return m;
}
/** A one-shot's outlet: its gain and its place in the stereo field. */
function outlet(ctx, out, p) { const g = ctx.createGain(); g.gain.value = p && p.gain != null ? p.gain : 1; if (p && p.pan && ctx.createStereoPanner) { const s = ctx.createStereoPanner(); s.pan.value = clamp(p.pan, -1, 1); g.connect(s); s.connect(out); } else g.connect(out); return g; }

/* ── primitives at an absolute time ── */
function tone(ctx, out, at, type, f0, f1, dur, gain, { attack = 0.005, detune = 0 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(Math.max(20, f0), at); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur); if (detune) o.detune.value = detune;
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + attack); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + 0.05);
}
function burst(ctx, out, at, dur, fFrom, fTo, gain, { type = 'lowpass', q = 0.7, attack = 0.005 } = {}) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise(ctx); s.loop = true; s.loopStart = 0; s.loopEnd = s.buffer.duration;
  f.type = type; f.Q.value = q; f.frequency.setValueAtTime(Math.max(30, fFrom), at); f.frequency.exponentialRampToValueAtTime(Math.max(30, fTo), at + dur);
  g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(gain, at + attack); g.gain.exponentialRampToValueAtTime(0.001, at + dur);
  s.connect(f); f.connect(g); g.connect(out); s.start(at, (at * 7.31) % 1.5); s.stop(at + dur + 0.05);
}

/* ── the one-shots: (ctx, out, at, p) ── */
const ONE = {
  laser: (c, o, t) => { tone(c, o, t, 'sawtooth', 900, 280, 0.13, 0.18); burst(c, o, t, 0.08, 4000, 800, 0.08, { type: 'bandpass', q: 2 }); },
  blaster: (c, o, t) => { tone(c, o, t, 'square', 640, 190, 0.1, 0.16); },
  click: (c, o, t) => { tone(c, o, t, 'square', 1800, 1300, 0.025, 0.05); },
  torpedo: (c, o, t) => { tone(c, o, t, 'sawtooth', 140, 60, 0.6, 0.25); burst(c, o, t, 0.5, 600, 120, 0.2); },
  boom: (c, o, t, p) => { const size = clamp(p && p.size != null ? p.size : 0.5, 0, 1.4), dur = 0.35 + size * 1.1; burst(c, o, t, dur, 2500 + size * 1500, 120, 0.35 + size * 0.45, { attack: 0.003 }); tone(c, o, t, 'sine', 55 + size * 20, 30, 0.25 + size * 0.5, 0.4 + size * 0.4, { attack: 0.002 }); if (size > 0.5) burst(c, o, t, dur * 1.4, 400, 60, 0.3, { attack: 0.05 }); if (size > 1) burst(c, o, t + 0.05, dur * 1.8, 160, 40, 0.35, { attack: 0.08 }); },
  clatter: (c, o, t, p) => { const size = p && p.size != null ? p.size : 0.5; burst(c, o, t, 0.04 + size * 0.03, 3200 - size * 1400, 900, 0.12 + size * 0.1, { type: 'bandpass', q: 1.5, attack: 0.001 }); },
  thud: (c, o, t, p) => { const size = p && p.size != null ? p.size : 0.5; burst(c, o, t, 0.18 + size * 0.2, 500, 60, 0.3 + size * 0.3); tone(c, o, t, 'sine', 70, 35, 0.2, 0.35); },
  stomp: (c, o, t, p) => { const size = p && p.size != null ? p.size : 1; burst(c, o, t, 0.25 + size * 0.25, 320, 50, 0.45 + size * 0.3, { attack: 0.004 }); tone(c, o, t, 'sine', 48, 28, 0.35 + size * 0.2, 0.55, { attack: 0.003 }); burst(c, o, t + 0.02, 0.12, 2400, 600, 0.12, { type: 'bandpass', q: 1.2 }); },
  servo: (c, o, t, p) => { tone(c, o, t, 'sawtooth', 220, 340, 0.35, 0.05, { attack: 0.08 }); tone(c, o, t + 0.05, 'square', 110, 95, 0.3, 0.03, { attack: 0.06 }); },
  skid: (c, o, t) => { burst(c, o, t, 0.32, 2600, 900, 0.22, { type: 'bandpass', q: 3, attack: 0.02 }); },
  crunch: (c, o, t) => { burst(c, o, t, 0.45, 1800, 200, 0.5, { attack: 0.002 }); burst(c, o, t, 0.3, 6000, 1500, 0.2, { type: 'bandpass', q: 1 }); tone(c, o, t, 'sine', 60, 30, 0.35, 0.5); },
  hurt: (c, o, t) => { tone(c, o, t, 'triangle', 520, 160, 0.25, 0.25); },
  respawn: (c, o, t) => { tone(c, o, t, 'sine', 220, 660, 0.4, 0.15); },
  swing: (c, o, t) => { burst(c, o, t, 0.28, 300, 2200, 0.22, { type: 'bandpass', q: 1.2, attack: 0.04 }); },
  strike: (c, o, t) => { burst(c, o, t, 0.2, 5000, 1200, 0.3, { type: 'bandpass', q: 3, attack: 0.001 }); tone(c, o, t, 'square', 1200, 300, 0.12, 0.1); },
  clash: (c, o, t) => { burst(c, o, t, 0.3, 6000, 900, 0.35, { type: 'bandpass', q: 4, attack: 0.001 }); tone(c, o, t, 'square', 1800, 400, 0.18, 0.12); tone(c, o, t, 'sawtooth', 2600, 700, 0.1, 0.08); },
  zip: (c, o, t) => { tone(c, o, t, 'sawtooth', 300, 2400, 0.45, 0.12, { attack: 0.02 }); burst(c, o, t, 0.5, 1200, 5000, 0.1, { type: 'bandpass', q: 2, attack: 0.05 }); },
  whoosh: (c, o, t, p) => { const k = p && p.size != null ? p.size : 1; burst(c, o, t, 0.28 + 0.15 * k, 400, 2400, 0.16 * k, { type: 'bandpass', q: 0.9, attack: 0.09 }); burst(c, o, t + 0.12, 0.25, 2400, 300, 0.12 * k, { type: 'bandpass', q: 0.9, attack: 0.02 }); },
  footstep: (c, o, t, p) => { const size = p && p.size != null ? p.size : 0.5; burst(c, o, t, 0.06 + size * 0.05, 900, 200, 0.07 + size * 0.06, { attack: 0.002 }); },
  breath: (c, o, t) => { burst(c, o, t, 0.9, 700, 1400, 0.09, { type: 'bandpass', q: 0.8, attack: 0.3 }); burst(c, o, t + 1.1, 0.8, 1400, 500, 0.08, { type: 'bandpass', q: 0.8, attack: 0.25 }); },
  roar: (c, o, t, p) => { const len = p && p.sec ? p.sec : 1.2; for (let k = 0; k < 3; k++) { const a = t + k * len / 3; tone(c, o, a, 'sawtooth', 180 + k * 30, 110, len / 3 + 0.1, 0.16, { attack: 0.05 }); tone(c, o, a, 'sawtooth', 180 * 1.5 + k * 40, 160, len / 3, 0.07, { attack: 0.05, detune: 12 }); burst(c, o, a, len / 3, 900, 400, 0.08, { type: 'bandpass', q: 1.5, attack: 0.04 }); } },
  chirp: (c, o, t, p) => { const f = 2400 + ((p && p.k) || 0) * 600; tone(c, o, t, 'sine', f, f * 1.4, 0.09, 0.05, { attack: 0.01 }); tone(c, o, t + 0.13, 'sine', f * 1.2, f * 0.9, 0.08, 0.04, { attack: 0.01 }); },
  static: (c, o, t) => { burst(c, o, t, 0.08, 3000, 3000, 0.08, { type: 'bandpass', q: 0.6, attack: 0.002 }); },
  ping: (c, o, t) => { tone(c, o, t, 'sine', 1200, 900, 0.3, 0.08, { attack: 0.005 }); },
};

/* ── continuous sources: made once, driven by parameter ramps ── */
const LOOPS = {
  engine: { release: 0.5, make(c, o) { const osc = c.createOscillator(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); osc.type = 'sawtooth'; osc.frequency.value = 55; s.buffer = noise(c); s.loop = true; f.type = 'lowpass'; f.frequency.value = 300; g.gain.value = 0; osc.connect(f); s.connect(f); f.connect(g); g.connect(o); return { params: { gain: g.gain, pitch: osc.frequency, cutoff: f.frequency }, start: t => { osc.start(t); s.start(t); }, stop: t => { osc.stop(t); s.stop(t); } }; } },
  saber: { release: 0.25, make(c, o) { const o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(); o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 90; o2.frequency.value = 91.5; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0; o1.connect(f); o2.connect(f); f.connect(g); g.connect(o); return { params: { gain: g.gain, pitch: o1.frequency }, start: t => { o1.start(t); o2.start(t); }, stop: t => { o1.stop(t); o2.stop(t); } }; } },
  hover: { release: 0.4, make(c, o) { const o1 = c.createOscillator(), o2 = c.createOscillator(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : null; o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = 120; o2.frequency.value = 120; o2.detune.value = 9; s.buffer = noise(c); s.loop = true; f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 2; g.gain.value = 0; const sg = c.createGain(); sg.gain.value = 0.25; o1.connect(f); o2.connect(f); s.connect(sg); sg.connect(f); f.connect(g); if (pan) { g.connect(pan); pan.connect(o); } else g.connect(o); const pitch = { setValueAtTime: (v, t) => { o1.frequency.setValueAtTime(v, t); o2.frequency.setValueAtTime(v, t); }, linearRampToValueAtTime: (v, t) => { o1.frequency.linearRampToValueAtTime(v, t); o2.frequency.linearRampToValueAtTime(v, t); } }; return { params: { gain: g.gain, pitch, cutoff: f.frequency, pan: pan ? pan.pan : null }, start: t => { o1.start(t); o2.start(t); s.start(t); }, stop: t => { o1.stop(t); o2.stop(t); s.stop(t); } }; } },
  servo: { release: 0.3, make(c, o) { const osc = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), pan = c.createStereoPanner ? c.createStereoPanner() : null; osc.type = 'sawtooth'; osc.frequency.value = 160; f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = 0; osc.connect(f); f.connect(g); if (pan) { g.connect(pan); pan.connect(o); } else g.connect(o); return { params: { gain: g.gain, pitch: osc.frequency, cutoff: f.frequency, pan: pan ? pan.pan : null }, start: t => osc.start(t), stop: t => osc.stop(t) }; } },
  wind: { release: 1.5, make(c, o) { const s = c.createBufferSource(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); s.buffer = noise(c); s.loop = true; f1.type = 'bandpass'; f1.frequency.value = 320; f1.Q.value = 0.8; f2.type = 'bandpass'; f2.frequency.value = 900; f2.Q.value = 1.5; g.gain.value = 0; lfo.type = 'sine'; lfo.frequency.value = 0.17; lg.gain.value = 260; lfo.connect(lg); lg.connect(f1.frequency); lg.connect(f2.frequency); s.connect(f1); s.connect(f2); f1.connect(g); f2.connect(g); g.connect(o); return { params: { gain: g.gain, cutoff: f1.frequency }, start: t => { s.start(t); lfo.start(t); }, stop: t => { s.stop(t); lfo.stop(t); } }; } },
  canopy: { release: 1.5, make(c, o) { const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); s.buffer = noise(c); s.loop = true; f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.5; g.gain.value = 0; lfo.frequency.value = 0.09; lg.gain.value = 500; lfo.connect(lg); lg.connect(f.frequency); s.connect(f); f.connect(g); g.connect(o); return { params: { gain: g.gain, cutoff: f.frequency }, start: t => { s.start(t); lfo.start(t); }, stop: t => { s.stop(t); lfo.stop(t); } }; } },
  hum: { release: 1, make(c, o) { const o1 = c.createOscillator(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); o1.type = 'sine'; o1.frequency.value = 60; s.buffer = noise(c); s.loop = true; f.type = 'lowpass'; f.frequency.value = 220; g.gain.value = 0; const sg = c.createGain(); sg.gain.value = 0.5; o1.connect(g); s.connect(f); f.connect(sg); sg.connect(g); g.connect(o); return { params: { gain: g.gain, cutoff: f.frequency }, start: t => { o1.start(t); s.start(t); }, stop: t => { o1.stop(t); s.stop(t); } }; } },
};
const TRACK_GAIN = 0.42;   /* a recorded track sits under the voice at this share of the score bus */
const BEDS = { blizzard: { src: 'wind', gain: 0.5, cutoff: 380 }, snow: { src: 'wind', gain: 0.22, cutoff: 260 }, forest: { src: 'canopy', gain: 0.16, cutoff: 1400 }, desert: { src: 'wind', gain: 0.18, cutoff: 700 }, city: { src: 'hum', gain: 0.08 }, space: { src: 'hum', gain: 0.14, cutoff: 120 } };

/* ── the instruments: (ctx, out, at, {hz, len, vel}) ── */
const lfos = new WeakMap();
function lfo(ctx) { let l = lfos.get(ctx); if (l) return l; const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 5.5; g.gain.value = 6; o.connect(g); o.start(0); l = g; lfos.set(ctx, l); return l; }
function env(ctx, out, at, len, vel, { attack = 0.02, decay = 0.1, sustain = 0.7, release = 0.15 } = {}) { const g = ctx.createGain(); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vel, at + attack); g.gain.linearRampToValueAtTime(vel * sustain, at + attack + decay); g.gain.setValueAtTime(vel * sustain, at + Math.max(len, attack + decay)); g.gain.linearRampToValueAtTime(0.0001, at + Math.max(len, attack + decay) + release); g.connect(out); return { g, end: at + Math.max(len, attack + decay) + release + 0.05 }; }
const INST = {
  brass: (c, o, t, n) => { const e = env(c, o, t, n.len, n.vel * 0.22, { attack: 0.025, decay: 0.12, sustain: 0.75, release: 0.14 }), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(2600, t + 0.06); f.frequency.exponentialRampToValueAtTime(1300, t + 0.4); f.connect(e.g); for (const d of [-7, 7]) { const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = n.hz; s.detune.value = d; s.connect(f); s.start(t); s.stop(e.end); } },
  horn: (c, o, t, n) => { const e = env(c, o, t, n.len, n.vel * 0.2, { attack: 0.06, decay: 0.15, sustain: 0.8, release: 0.25 }), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500; f.connect(e.g); const s = c.createOscillator(), s2 = c.createOscillator(); s.type = 'sawtooth'; s2.type = 'triangle'; s.frequency.value = n.hz; s2.frequency.value = n.hz; const g2 = c.createGain(); g2.gain.value = 0.6; s.connect(f); s2.connect(g2); g2.connect(f); s.start(t); s2.start(t); s.stop(e.end); s2.stop(e.end); },
  strings: (c, o, t, n) => { const e = env(c, o, t, n.len, n.vel * 0.12, { attack: 0.18, decay: 0.2, sustain: 0.9, release: 0.4 }), f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; f.connect(e.g); for (const d of [-12, 0, 12]) { const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = n.hz; s.detune.value = d; s.connect(f); s.start(t); s.stop(e.end); } },
  bass: (c, o, t, n) => { const e = env(c, o, t, n.len, n.vel * 0.35, { attack: 0.01, decay: 0.25, sustain: 0.5, release: 0.12 }); const s = c.createOscillator(), sub = c.createOscillator(), g2 = c.createGain(); s.type = 'triangle'; s.frequency.value = n.hz; sub.type = 'sine'; sub.frequency.value = n.hz / 2; g2.gain.value = 0.7; s.connect(e.g); sub.connect(g2); g2.connect(e.g); s.start(t); sub.start(t); s.stop(e.end); sub.stop(e.end); },
  timpani: (c, o, t, n) => { const g = c.createGain(); g.gain.setValueAtTime(n.vel * 0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.9); g.connect(o); const s = c.createOscillator(); s.type = 'sine'; s.frequency.setValueAtTime(n.hz * 2, t); s.frequency.exponentialRampToValueAtTime(n.hz, t + 0.4); s.connect(g); s.start(t); s.stop(t + 1); burst(c, o, t, 0.08, 400, 100, n.vel * 0.3, { attack: 0.002 }); },
  snare: (c, o, t, n) => { burst(c, o, t, 0.12, 1800, 900, n.vel * 0.35, { type: 'bandpass', q: 0.9, attack: 0.001 }); tone(c, o, t, 'sine', 180, 120, 0.06, n.vel * 0.25, { attack: 0.001 }); },
  flute: (c, o, t, n) => { const e = env(c, o, t, n.len, n.vel * 0.18, { attack: 0.06, decay: 0.1, sustain: 0.85, release: 0.2 }); const s = c.createOscillator(), s2 = c.createOscillator(), g2 = c.createGain(); s.type = 'sine'; s2.type = 'triangle'; s.frequency.value = n.hz; s2.frequency.value = n.hz; g2.gain.value = 0.12; lfo(c).connect(s.detune); s.connect(e.g); s2.connect(g2); g2.connect(e.g); s.start(t); s2.start(t); s.stop(e.end); s2.stop(e.end); },
};
/* ── the cues: original motifs in the films' spirit; beats, midi notes, lengths in beats, velocity ── */
const cue = (bpm, beats, tracks, once) => ({ bpm, beats, once: !!once, tracks });
const chord = (beat, notes, len, vel) => notes.map(m => [beat, m, len, vel]);
const CUES = {
  fanfare: cue(120, 8, [
    { inst: 'brass', notes: [[0, 60, 0.9, 1], [1, 67, 0.9, 1], [2, 72, 1.8, 1], [4, 71, 0.9, 0.9], [5, 72, 0.9, 0.9], [6, 74, 2, 1]] },
    { inst: 'horn', notes: [[0, 48, 2, 0.8], [2, 55, 2, 0.8], [4, 53, 2, 0.8], [6, 55, 2, 0.9]] },
    { inst: 'strings', notes: [...chord(0, [48, 55, 64], 4, 0.8), ...chord(4, [50, 57, 65], 2, 0.8), ...chord(6, [55, 59, 62], 2, 0.9)] },
    { inst: 'timpani', notes: [[0, 36, 1, 1], [2, 36, 1, 0.8], [4, 38, 1, 0.9], [6, 36, 1, 1], [7, 36, 1, 0.7], [7.5, 36, 1, 0.8]] },
  ], true),
  hero: cue(116, 16, [
    { inst: 'brass', notes: [[0, 62, 1, 0.9], [1, 69, 0.5, 0.9], [1.5, 69, 0.5, 0.9], [2, 74, 2, 1], [4, 72, 1, 0.9], [5, 71, 1, 0.9], [6, 69, 2, 0.9], [8, 62, 1, 0.9], [9, 69, 1, 0.9], [10, 74, 1.5, 1], [11.5, 76, 0.5, 0.9], [12, 74, 1, 0.9], [13, 71, 1, 0.9], [14, 69, 2, 1]] },
    { inst: 'strings', notes: [...chord(0, [50, 57, 62], 4, 0.7), ...chord(4, [48, 55, 62], 4, 0.7), ...chord(8, [50, 57, 62], 4, 0.7), ...chord(12, [45, 52, 57], 4, 0.7)] },
    { inst: 'bass', notes: [[0, 38, 0.5, 1], [1, 38, 0.5, 0.7], [2, 38, 0.5, 1], [3, 38, 0.5, 0.7], [4, 36, 0.5, 1], [5, 36, 0.5, 0.7], [6, 36, 0.5, 1], [7, 36, 0.5, 0.7], [8, 38, 0.5, 1], [9, 38, 0.5, 0.7], [10, 38, 0.5, 1], [11, 38, 0.5, 0.7], [12, 33, 0.5, 1], [13, 33, 0.5, 0.7], [14, 33, 0.5, 1], [15, 33, 0.5, 0.7]] },
    { inst: 'snare', notes: [[1, 60, 0.2, 0.6], [3, 60, 0.2, 0.7], [5, 60, 0.2, 0.6], [7, 60, 0.2, 0.7], [7.5, 60, 0.2, 0.5], [9, 60, 0.2, 0.6], [11, 60, 0.2, 0.7], [13, 60, 0.2, 0.6], [15, 60, 0.2, 0.8], [15.5, 60, 0.2, 0.6]] },
    { inst: 'timpani', notes: [[0, 38, 1, 0.9], [4, 36, 1, 0.8], [8, 38, 1, 0.9], [12, 33, 1, 0.9]] },
  ]),
  springfield: cue(132, 12, [   // a bouncy major fanfare in the intro's spirit, swung: brass on the tune, horns on the chords, a walking bass, brushes
    { inst: 'brass', notes: [[0, 60, 0.45, 0.9], [0.66, 64, 0.3, 0.8], [1, 67, 0.9, 1], [2, 69, 0.45, 0.9], [2.66, 67, 0.3, 0.8], [3, 64, 0.9, 0.9], [4, 65, 0.45, 0.9], [4.66, 69, 0.3, 0.8], [5, 72, 0.9, 1], [6, 71, 0.45, 0.9], [6.66, 69, 0.3, 0.8], [7, 67, 0.9, 0.9], [8, 60, 0.45, 0.9], [8.66, 64, 0.3, 0.8], [9, 67, 0.45, 0.9], [9.66, 72, 0.3, 0.9], [10, 71, 0.9, 1], [11, 67, 0.9, 0.9]] },
    { inst: 'horn', notes: [...chord(0, [52, 55, 60], 2, 0.5), ...chord(2, [52, 57, 60], 2, 0.5), ...chord(4, [53, 57, 60], 2, 0.5), ...chord(6, [55, 59, 62], 2, 0.5), ...chord(8, [52, 55, 60], 2, 0.5), ...chord(10, [55, 59, 62], 2, 0.55)] },
    { inst: 'bass', notes: [[0, 36, 0.45, 1], [1, 43, 0.45, 0.8], [2, 45, 0.45, 0.9], [3, 43, 0.45, 0.8], [4, 41, 0.45, 1], [5, 45, 0.45, 0.8], [6, 43, 0.45, 0.9], [7, 38, 0.45, 0.8], [8, 36, 0.45, 1], [9, 40, 0.45, 0.8], [10, 43, 0.45, 0.9], [11, 47, 0.45, 0.8]] },
    { inst: 'snare', notes: [1, 1.66, 3, 3.66, 5, 5.66, 7, 7.66, 9, 9.66, 11, 11.33, 11.66].map((b, i) => [b, 60, 0.15, i % 2 === 0 ? 0.45 : 0.25]) },
    { inst: 'flute', notes: [[9.66, 76, 0.3, 0.5], [10, 79, 0.9, 0.6], [11, 76, 0.9, 0.5]] },
  ]),
  march: cue(104, 12, [
    { inst: 'bass', notes: [[0, 43, 0.9, 1], [1, 43, 0.9, 0.9], [2, 43, 0.9, 1], [3, 39, 0.7, 0.9], [3.75, 46, 0.25, 0.8], [4, 43, 0.9, 1], [5, 39, 0.7, 0.9], [5.75, 46, 0.25, 0.8], [6, 43, 1.8, 1], [8, 50, 0.9, 1], [9, 50, 0.9, 0.9], [10, 50, 0.9, 1], [11, 51, 0.7, 0.9], [11.75, 46, 0.25, 0.8]] },
    { inst: 'brass', notes: [[0, 55, 0.9, 0.9], [1, 55, 0.9, 0.8], [2, 55, 0.9, 0.9], [3, 51, 0.7, 0.8], [3.75, 58, 0.25, 0.7], [4, 55, 0.9, 0.9], [5, 51, 0.7, 0.8], [5.75, 58, 0.25, 0.7], [6, 55, 1.8, 1], [8, 62, 0.9, 0.9], [9, 62, 0.9, 0.8], [10, 62, 0.9, 0.9], [11, 63, 0.7, 0.9], [11.75, 58, 0.25, 0.8]] },
    { inst: 'strings', notes: [...chord(0, [43, 50, 55], 3, 0.6), ...chord(3, [39, 46, 51], 1, 0.6), ...chord(4, [43, 50, 55], 2, 0.6), ...chord(6, [43, 50, 58], 2, 0.7), ...chord(8, [50, 57, 62], 3, 0.6), ...chord(11, [51, 58, 63], 1, 0.7)] },
    { inst: 'timpani', notes: [[0, 31, 1, 1], [2, 31, 1, 0.8], [4, 31, 1, 1], [6, 31, 1, 1], [8, 38, 1, 1], [10, 38, 1, 0.8], [11.5, 31, 1, 0.9]] },
    { inst: 'snare', notes: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.25, 6.5, 6.75, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.25, 11.5, 11.75].map((b, i) => [b, 60, 0.2, 0.25 + (i % 4 === 0 ? 0.35 : 0.1) + (b >= 11 ? 0.2 : 0)]) },
  ]),
  dread: cue(60, 8, [
    { inst: 'strings', notes: [...chord(0, [36, 43, 47, 50], 4, 0.9), ...chord(4, [35, 42, 46, 50], 4, 0.9)] },
    { inst: 'bass', notes: [[0, 24, 3.5, 1], [4, 23, 3.5, 1]] },
    { inst: 'timpani', notes: [[0, 24, 1, 0.7], [3.5, 24, 1, 0.5], [4, 23, 1, 0.7]] },
  ]),
  chase: cue(152, 16, [
    { inst: 'strings', notes: [[0, 64], [0.5, 64], [1, 67], [1.5, 64], [2, 69], [2.5, 64], [3, 71], [3.5, 69], [4, 64], [4.5, 64], [5, 67], [5.5, 64], [6, 72], [6.5, 71], [7, 69], [7.5, 67], [8, 62], [8.5, 62], [9, 65], [9.5, 62], [10, 67], [10.5, 62], [11, 69], [11.5, 67], [12, 62], [12.5, 65], [13, 67], [13.5, 69], [14, 71], [14.5, 72], [15, 74], [15.5, 76]].map(([b, m]) => [b, m, 0.35, 0.9]) },
    { inst: 'horn', notes: [[0, 52, 1.5, 0.8], [2, 55, 1, 0.8], [3, 59, 1, 0.9], [6, 60, 1.5, 0.9], [8, 50, 1.5, 0.8], [10, 53, 1, 0.8], [11, 57, 1, 0.9], [13, 59, 0.5, 0.9], [14, 62, 2, 1]] },
    { inst: 'bass', notes: [[0, 40, 0.4, 1], [1, 40, 0.4, 0.8], [2, 40, 0.4, 1], [3, 40, 0.4, 0.8], [4, 40, 0.4, 1], [5, 43, 0.4, 0.8], [6, 45, 0.4, 1], [7, 47, 0.4, 0.8], [8, 38, 0.4, 1], [9, 38, 0.4, 0.8], [10, 38, 0.4, 1], [11, 38, 0.4, 0.8], [12, 38, 0.4, 1], [13, 41, 0.4, 0.8], [14, 43, 0.4, 1], [15, 47, 0.4, 0.9]] },
    { inst: 'snare', notes: [[0.5, 60, 0.2, 0.5], [1.5, 60, 0.2, 0.5], [2.5, 60, 0.2, 0.5], [3.5, 60, 0.2, 0.6], [4.5, 60, 0.2, 0.5], [5.5, 60, 0.2, 0.5], [6.5, 60, 0.2, 0.5], [7.5, 60, 0.2, 0.7], [7.75, 60, 0.2, 0.5], [8.5, 60, 0.2, 0.5], [9.5, 60, 0.2, 0.5], [10.5, 60, 0.2, 0.5], [11.5, 60, 0.2, 0.6], [12.5, 60, 0.2, 0.5], [13.5, 60, 0.2, 0.5], [14.5, 60, 0.2, 0.6], [15, 60, 0.2, 0.6], [15.5, 60, 0.2, 0.8]] },
    { inst: 'timpani', notes: [[0, 28, 1, 0.9], [4, 28, 1, 0.7], [8, 26, 1, 0.9], [12, 26, 1, 0.7], [15.5, 28, 1, 0.9]] },
  ]),
  tension: cue(90, 8, [
    { inst: 'bass', notes: [[0, 36, 0.4, 0.9], [1, 36, 0.4, 0.6], [2, 36, 0.4, 0.9], [3, 36, 0.4, 0.6], [4, 36, 0.4, 0.9], [5, 36, 0.4, 0.6], [6, 34, 0.4, 0.9], [7, 34, 0.4, 0.7]] },
    { inst: 'strings', notes: [...chord(0, [55, 58, 63], 4, 0.6), ...chord(4, [54, 58, 63], 2, 0.6), ...chord(6, [53, 58, 62], 2, 0.7)] },
    { inst: 'timpani', notes: [[0, 24, 1, 0.5], [6, 22, 1, 0.5]] },
  ]),
  camp: cue(72, 16, [
    { inst: 'flute', notes: [[0, 69, 1.8, 0.8], [2, 71, 0.9, 0.7], [3, 72, 0.9, 0.8], [4, 76, 2.8, 0.9], [7, 74, 0.9, 0.7], [8, 72, 1.8, 0.8], [10, 71, 0.9, 0.7], [11, 69, 0.9, 0.7], [12, 67, 3.5, 0.8]] },
    { inst: 'strings', notes: [...chord(0, [45, 52, 57, 60], 8, 0.7), ...chord(8, [41, 48, 53, 57], 4, 0.7), ...chord(12, [43, 50, 55, 59], 4, 0.7)] },
    { inst: 'horn', notes: [[4, 52, 4, 0.5], [12, 50, 4, 0.5]] },
  ]),
  end: cue(100, 8, [
    { inst: 'brass', notes: [[0, 67, 1, 1], [1, 65, 1, 0.9], [2, 64, 1, 0.9], [3, 62, 1, 0.9], [4, 60, 4, 1]] },
    { inst: 'horn', notes: [[0, 55, 2, 0.8], [2, 53, 2, 0.8], [4, 48, 4, 0.9]] },
    { inst: 'strings', notes: [...chord(0, [48, 55, 64], 2, 0.8), ...chord(2, [50, 53, 57], 2, 0.8), ...chord(4, [48, 52, 55, 60], 4, 0.9)] },
    { inst: 'timpani', notes: [[0, 36, 1, 0.9], [2, 38, 1, 0.8], [3.5, 36, 1, 0.6], [3.75, 36, 1, 0.7], [4, 36, 1, 1]] },
  ], true),
};
/** A cue span's notes between two reel times: the pattern repeats from the span's start; a voice cap of four per instrument, the quietest dropped. */
function expand(name, start, from, to, span) {
  const C = CUES[name]; if (!C) return []; const period = C.beats * 60 / C.bpm, out = [];
  const k0 = Math.max(0, Math.floor((from - start) / period)), k1 = C.once ? 0 : Math.floor((to - start) / period);
  for (let k = k0; k <= k1; k++) for (const tr of C.tracks) for (const n of tr.notes) { const t = start + k * period + n[0] * 60 / C.bpm; if (t < from || t >= to) continue; if (span != null && t >= span) continue; out.push({ t, inst: tr.inst, hz: midiHz(n[1]), len: n[2] * 60 / C.bpm, vel: n[3] == null ? 0.8 : n[3], cue: name }); }
  out.sort((a, b) => a.t - b.t || a.hz - b.hz);
  const live = {}; return out.filter(n => { const L = (live[n.inst] = (live[n.inst] || []).filter(e => e.end > n.t)); if (L.length >= 4) { let q = 0; for (let i = 1; i < L.length; i++) if (L[i].vel < L[q].vel) q = i; if (L[q].vel >= n.vel) return false; L.splice(q, 1); } L.push({ end: n.t + n.len, vel: n.vel }); return true; });
}

/* ── the spoken lines ── */
function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }
const lineKey = (who, text) => fnv(String(who || '').toLowerCase() + '|' + String(text || '').trim());
const VOICES = { leia: 'f', luke: 'm', han: 'm', c3po: 'droid', scout: 'radio', trooper: 'radio', pilot: 'radio', rogue: 'radio', comms: 'radio', narrator: 'm', chewbacca: 'roar', vader: 'vader', rebel: 'radio' };
const voiceOf = who => VOICES[String(who || '').toLowerCase().split(/[-\s]/)[0]] || 'm';
const lineBufs = new WeakMap(); let manifest = null, manifestP = null;
function base() { const s = document.currentScript && document.currentScript.src; return (window.__soundBase || (s ? s.replace(/\/[^/]*$/, '/') : './world/')); }
const BASE = typeof document !== 'undefined' ? base() : './world/';
function loadManifest() { if (manifest) return Promise.resolve(manifest); if (!manifestP) manifestP = fetch(BASE + 'lines/index.json').then(r => r.ok ? r.json() : {}).catch(() => ({})).then(m => (manifest = m)); return manifestP; }
function loadLine(ctx, key) {
  let m = lineBufs.get(ctx); if (!m) { m = new Map(); lineBufs.set(ctx, m); } if (m.has(key)) return m.get(key);
  const p = fetch(BASE + 'lines/' + key + '.ogg').then(r => { if (!r.ok) throw new Error('no line'); return r.arrayBuffer(); }).then(ab => new Promise((ok, no) => { const r = ctx.decodeAudioData(ab, ok, no); if (r && r.then) r.then(ok, no); })).catch(() => null);
  m.set(key, p); return p;
}
const lineEnv = key => (manifest && manifest[key] && Array.isArray(manifest[key].env) ? manifest[key].env : null);
const lineSec = (key, text) => manifest && manifest[key] && manifest[key].sec ? manifest[key].sec : 0.3 + String(text || '').split(/\s+/).length * 0.36;
/** A line through its character's colour: a radio's band and squelch, a droid's ring, a clean voice. */
const fileBufs = new WeakMap(), fileReady = new WeakMap();   /* per context: the decode promises, and the decoded buffers for the synchronous scheduler */
/** A recorded voice file (a scene's whole take, sliced by FROM and FOR), decoded once per context. */
function loadFile(ctx, file) {
  let m = fileBufs.get(ctx); if (!m) { m = new Map(); fileBufs.set(ctx, m); } if (m.has(file)) return m.get(file);
  const p = fetch(BASE + 'lines/' + file).then(r => { if (!r.ok) throw new Error('no file'); return r.arrayBuffer(); }).then(ab => new Promise((ok, no) => { const r = ctx.decodeAudioData(ab, ok, no); if (r && r.then) r.then(ok, no); })).then(buf => { let rm = fileReady.get(ctx); if (!rm) { rm = new Map(); fileReady.set(ctx, rm); } rm.set(file, buf); return buf; }).catch(() => null);
  m.set(file, p); return p;
}
function sayBuffer(ctx, out, at, buf, voice, from, dur) {
  const s = ctx.createBufferSource(); s.buffer = buf; let head = s;
  if (voice === 'radio') { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 1.2; const g = ctx.createGain(); g.gain.value = 1.8; const sh = ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 2.2); } sh.curve = c; head.connect(f); f.connect(sh); sh.connect(g); head = g; ONE.static(ctx, out, at - 0.06); ONE.static(ctx, out, at + buf.duration + 0.03); }
  else if (voice === 'droid') { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 400; const d = ctx.createDelay(0.05); d.delayTime.value = 0.011; const g = ctx.createGain(); g.gain.value = 0.9, dg = ctx.createGain(); dg.gain.value = 0.5; head.connect(f); f.connect(g); f.connect(d); d.connect(dg); dg.connect(g); head = g; }
  else if (voice === 'vader') { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1100; const d = ctx.createDelay(0.1); d.delayTime.value = 0.02; const g = ctx.createGain(); g.gain.value = 1.2; const dg = ctx.createGain(); dg.gain.value = 0.6; head.connect(f); f.connect(g); f.connect(d); d.connect(dg); dg.connect(g); head = g; }
  head.connect(out); if (dur) s.start(at, from || 0, dur); else s.start(at, from || 0);
}
/** No file: syllables of two sines, a rough voice so the line is at least heard. */
function babble(ctx, out, at, text, voice) { const n = Math.max(2, Math.round(String(text || '').replace(/[^a-z]/gi, '').length / 2.6)), f0 = voice === 'f' ? 240 : voice === 'droid' ? 300 : 150, dur = 0.12; for (let i = 0; i < n; i++) { const t = at + i * 0.15, k = ((i * 7919) % 11) / 11; tone(ctx, out, t, voice === 'droid' ? 'square' : 'sawtooth', f0 * (0.92 + k * 0.2), f0 * (0.85 + k * 0.25), dur, 0.09, { attack: 0.02 }); tone(ctx, out, t, 'sine', f0 * (2.1 + k), f0 * (2.4 + k * 0.6), dur, 0.05, { attack: 0.02 }); } }

/* ── the log and the two clocks ── */
const S = {
  armed: false, clock: () => 0, log: null, open: {}, live: null, LEAD: 0.06, cueNow: null, cueAt: 0, muted: false, bed: null,
  ONE, LOOPS, INST, CUES, BEDS, VOICES, expand, lineKey, lineEnv, loadFile, loadManifest, voiceOf, mix, noise, tone, burst, midiHz, lineSec, loadManifest,
  reset() { S.log = { events: [], curves: [], cues: [], t: 0 }; S.open = {}; S.cueNow = null; S.cueAt = 0; },
  /** The film arms the log when it plays (with its reel clock) and disarms it when it stops: open curves close, the cue ends. */
  arm(on, clock) {
    if (on) { S.clock = clock || S.clock; S.reset(); S.armed = true; if (S.live) { S.live.t0 = S.live.ctx.currentTime - S.clock(); S.live.cueSchedTo = 0; S.live.cueSpan = null; } return; }
    if (!S.armed) return; const t = S.clock(); for (const id of Object.keys(S.open)) S.loop(id, null, null); if (S.cueNow) S.cue(null); S.log.t = t; S.armed = false;
    if (S.live && S.live.cueSpan) { S.liveFadeSpan(S.live.cueSpan, S.live.at(t)); S.live.cueSpan = null; }
  },
  /** The page's context: the mix, the take's stream, the live clock. */
  attach(ctx) { const m = mix(ctx); S.live = { ctx, mix: m, t0: S.armed ? ctx.currentTime - S.clock() : 0, cueSchedTo: 0, cueSpan: null, msd: null }; S.live.at = t => Math.max(ctx.currentTime + 0.005, S.live.t0 + t + S.LEAD); if (S.armed && S.cueNow) { const name = S.cueNow; S.cueNow = null; S.cue(name, 0.5); } return m; },   // a film already playing when the first tap unlocks the sound joins it where it is
  stream() { const L = S.live; if (!L) return null; if (!L.msd) { try { L.msd = L.ctx.createMediaStreamDestination(); L.mix.master.connect(L.msd); } catch (e) { return null; } } return L.msd.stream; },
  busFor(name) { return name === 'line' || name === 'roar' ? 'voice' : name === 'note' ? 'score' : name === 'chirp' ? 'ambience' : 'foley'; },
  /** A one-shot now: counted by the caller, logged on the reel clock while armed, played live when there is a context. */
  fire(name, p) {
    if (!ONE[name] && name !== 'line') return false; const armed = S.armed && !S.held; const t = armed ? S.clock() : 0;
    if (armed) S.log.events.push({ t, name, p: p || null });
    const L = S.live; if (L && !S.muted) { const at = armed ? L.at(t) : L.ctx.currentTime + 0.005; if (name === 'line') S.playLine(L.ctx, L.mix, at, p); else ONE[name](L.ctx, L.mix[S.busFor(name)], at, p); }
    return true;
  },
  /** A line: the file through its voice, or a babble; the score ducks under it. */
  playLine(ctx, m, at, p) {
    const voice = p.voice || voiceOf(p.who), sec = p.sec || lineSec(p.key, p.text);
    m.score.gain.setTargetAtTime(0.16, at, 0.05); m.score.gain.setTargetAtTime(0.55, at + sec, 0.2);
    if (voice === 'roar') { ONE.roar(ctx, m.voice, at, { sec }); return; }
    if (p.file) { loadFile(ctx, p.file).then(buf => { if (buf) sayBuffer(ctx, m.voice, at, buf, voice, p.from || 0, sec); else babble(ctx, m.voice, at, p.text, voice); }); return; }
    if (!p.key) { babble(ctx, m.voice, at, p.text, voice); return; }
    loadLine(ctx, p.key).then(buf => { if (buf) sayBuffer(ctx, m.voice, at, buf, voice); else babble(ctx, m.voice, at, p.text, voice); });
  },
  /** A continuous source: the first call with values opens it, each call samples it, null closes it. */
  loop(id, src, values) {
    const t = S.armed ? S.clock() : (S.live ? S.live.ctx.currentTime : 0), cur = S.open[id];
    if (values == null) { if (!cur) return; cur.end = t; delete S.open[id]; if (cur.node) { const L = S.live, at = S.armed ? L.at(t) : L.ctx.currentTime + 0.005, rel = LOOPS[cur.src].release; cur.node.params.gain.cancelScheduledValues(at); cur.node.params.gain.setTargetAtTime(0, at, rel / 3); cur.node.stop(at + rel + 0.1); } return; }
    if (!cur) { const c = { id, src, start: t, end: null, samples: [], last: -1, prev: null, node: null }; S.open[id] = c; if (S.armed && !S.held) S.log.curves.push(c); if (S.live && !S.muted && LOOPS[src]) { const L = S.live, at = S.armed ? L.at(t) : L.ctx.currentTime + 0.005; c.node = LOOPS[src].make(L.ctx, L.mix[src === 'wind' || src === 'canopy' || src === 'hum' ? 'ambience' : 'foley']); c.node.start(at); } S.sample(c, t, values, true); return; }
    S.sample(cur, t, values, false);
  },
  sample(c, t, values, first) {
    if (!first) { let moved = t - c.last >= 1 / 12; if (!moved && c.prev) for (const k in values) { const a = values[k], b = c.prev[k]; if (b == null || Math.abs(a - b) > Math.abs(b) * 0.02 + 1e-3) { moved = true; break; } } if (!moved) return; }
    c.last = t; c.prev = { ...values }; c.samples.push([+t.toFixed(4), values]);
    if (c.node) { const L = S.live, at = S.armed ? L.at(t) : L.ctx.currentTime + 0.005; for (const k in values) { const P = c.node.params[k]; if (!P) continue; if (first) P.setValueAtTime(values[k], at); else P.linearRampToValueAtTime(values[k], at); } }
  },
  /** A short bend on an open loop's parameter, relative to now (the saber's swing). */
  bump(id, key, curve) { const c = S.open[id]; if (!c) return; const t = S.armed ? S.clock() : 0; if (S.armed && !S.held) S.log.events.push({ t, name: 'bump', p: { id, key, curve } }); if (c.node && c.node.params[key]) { const L = S.live, at = S.armed ? L.at(t) : L.ctx.currentTime + 0.005; applyBump(c.node.params[key], at, curve); } },
  /** The music: a cue starts (fading the last), or ends with null. */
  cue(name, fade) {
    const t = S.armed ? S.clock() : 0; if (name === S.cueNow) return; fade = fade == null ? 1.5 : fade;
    if (S.armed && !S.held) S.log.cues.push({ t, name, fade }); S.cueNow = name; S.cueAt = t;
    const L = S.live; if (!L || !S.armed) return; if (L.cueSpan) S.liveFadeSpan(L.cueSpan, L.at(t), fade); L.cueSpan = null;
    const file = name && name.startsWith('file:') ? name.slice(5) : null;   /* SCORE "file:odyssey/music/x.ogg": a recorded track, looped under the film, instead of a written cue */
    if (name && (CUES[name] || file)) { const g = L.ctx.createGain(); g.gain.setValueAtTime(0.0001, L.at(t)); g.gain.linearRampToValueAtTime(file ? TRACK_GAIN : 1, L.at(t) + fade * 0.6); g.connect(L.mix.score); const span = { name, start: t, g, schedTo: t, file }; L.cueSpan = span;
      if (file) loadFile(L.ctx, file).then(buf => { if (!buf || L.cueSpan !== span) return; const src = L.ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(g); const now = S.clock(), late = Math.max(0, now - t); src.start(L.at(now), late % buf.duration); span.src = src; }); }
  },
  liveFadeSpan(span, at, fade) { fade = fade || 1; span.g.gain.setValueAtTime(span.g.gain.value, at); span.g.gain.linearRampToValueAtTime(0.0001, at + fade); span.ended = span.schedTo; if (span.src) { try { span.src.stop(at + fade + 0.1); } catch (e) { } } setTimeout(() => { try { span.g.disconnect(); } catch (e) { } }, (fade + 3) * 1000); },
  /** Each step while armed: the running cue's notes are scheduled a quarter second ahead. */
  tick() { const L = S.live; if (!L || !S.armed || !L.cueSpan || S.muted) return; const span = L.cueSpan, t = S.clock(), to = t + 0.35; if (span.file) { span.schedTo = to; return; } if (to <= span.schedTo) return; for (const n of expand(span.name, span.start, span.schedTo, to)) { const I = INST[n.inst]; if (I) I(L.ctx, span.g, L.at(n.t), n); } span.schedTo = to; },
  /** The wind, the canopy, the hum: one bed at a time, by kind. */
  setBed(kind, gain) { const B = kind && BEDS[kind]; if (!B) { if (S.bed) { S.loop('bed', S.bed.src, null); S.bed = null; } return; } if (S.bed && S.bed.kind !== kind) { S.loop('bed', S.bed.src, null); S.bed = null; } if (!S.bed) S.bed = { kind, src: B.src }; const v = { gain: B.gain * (gain == null ? 1 : gain) }; if (B.cutoff) v.cutoff = B.cutoff; S.loop('bed', B.src, v); },
  /* ── the whole log on any context: the export, or a replay ── */
  schedule(ctx, m, log, t0, from, to) {
    for (const e of log.events) { if (e.t < from || e.t >= to) continue; const at = t0 + e.t; if (e.name === 'line') S.playLine(ctx, m, at, e.p); else if (e.name === 'bump') { /* applied with the curves */ } else if (ONE[e.name]) ONE[e.name](ctx, m[S.busFor(e.name)], at, e.p); }
    const cues = log.cues.slice().sort((a, b) => a.t - b.t);
    cues.forEach((c, i) => { const file = c.name && c.name.startsWith('file:') ? c.name.slice(5) : null; if (!c.name || (!CUES[c.name] && !file)) return; const next = cues[i + 1], end = next ? next.t + (next.fade || 1.5) : (log.t || to), top = file ? TRACK_GAIN : 1; if (!(c._g)) { const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0 + c.t); g.gain.linearRampToValueAtTime(top, t0 + c.t + (c.fade || 1.5) * 0.6); if (next) { g.gain.setValueAtTime(top, t0 + next.t); g.gain.linearRampToValueAtTime(0.0001, t0 + end); } g.connect(m.score); c._g = g; }
      if (file) { const rm = fileReady.get(ctx), buf = rm && rm.get(file); if (buf && !c._src) { const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(c._g); src.start(t0 + c.t); src.stop(t0 + end + 0.5); c._src = src; } return; }
      for (const n of expand(c.name, c.t, Math.max(from, c.t), Math.min(to, end))) { const I = INST[n.inst]; if (I) I(ctx, c._g, t0 + n.t, n); } });
  },
  scheduleCurves(ctx, m, log, t0, until) {
    for (const c of log.curves) { const Lp = LOOPS[c.src]; if (!Lp || !c.samples.length) continue; const node = Lp.make(ctx, m[c.src === 'wind' || c.src === 'canopy' || c.src === 'hum' ? 'ambience' : 'foley']); const end = c.end == null ? until : c.end; node.start(t0 + c.start);
      let first = true; for (const [t, v] of c.samples) { for (const k in v) { const P = node.params[k]; if (!P) continue; if (first) P.setValueAtTime(v[k], t0 + t); else P.linearRampToValueAtTime(v[k], t0 + t); } first = false; }
      for (const e of log.events) if (e.name === 'bump' && e.p.id === c.id && e.t >= c.start && e.t <= end && node.params[e.p.key]) applyBump(node.params[e.p.key], t0 + e.t, e.p.curve);
      node.params.gain.setTargetAtTime(0, t0 + end, Lp.release / 3); node.stop(t0 + end + Lp.release + 0.1); }
  },
  /** The log rendered whole into a WAV: an OfflineAudioContext of the film's length, scheduled in ten-second windows. */
  async renderOffline(log, seconds, rate) {
    rate = rate || 48000; const n = Math.ceil(Math.max(0.5, seconds) * rate), ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, n, rate), m = mix(ctx);
    await loadManifest(); await Promise.all(log.events.filter(e => e.name === 'line' && e.p && e.p.key).map(e => loadLine(ctx, e.p.key))); await Promise.all([...new Set(log.events.filter(e => e.name === 'line' && e.p && e.p.file).map(e => e.p.file).concat(log.cues.filter(c => c.name && c.name.startsWith('file:')).map(c => c.name.slice(5))))].map(f => loadFile(ctx, f)));
    const WIN = 10, q = 128 / rate, windows = Math.ceil(seconds / WIN); S.scheduleCurves(ctx, m, log, 0, seconds);
    for (const c of log.cues) { delete c._g; delete c._src; } S.schedule(ctx, m, log, 0, 0, WIN);
    for (let k = 1; k < windows; k++) { const at = Math.round(k * WIN / q) * q; ctx.suspend(at).then(() => { S.schedule(ctx, m, log, 0, k * WIN, (k + 1) * WIN); ctx.resume(); }); }
    const buf = await ctx.startRendering(); return S.toWav(buf);
  },
  toWav(buf) {
    const ch = buf.numberOfChannels, n = buf.length, out = new ArrayBuffer(44 + n * ch * 2), v = new DataView(out), w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * ch * 2, true);
    const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const s = clamp(chans[c][i], -1, 1); v.setInt16(o, s < 0 ? s * 32768 : s * 32767, true); o += 2; }
    return out;
  },
  stats() { const l = S.log || { events: [], curves: [], cues: [] }; const counts = {}; for (const e of l.events) counts[e.name] = (counts[e.name] || 0) + 1; return { armed: S.armed, t: +S.clock().toFixed(2), events: l.events.length, counts, curves: l.curves.map(c => ({ id: c.id, src: c.src, start: +c.start.toFixed(2), end: c.end == null ? null : +c.end.toFixed(2), n: c.samples.length })), cues: l.cues.map(c => ({ t: +c.t.toFixed(2), name: c.name })), cue: S.cueNow, bed: S.bed ? S.bed.kind : null, live: !!S.live }; },
};
function applyBump(P, at, curve) { let base = null; for (const [dt, v] of curve) { if (base == null) { P.setValueAtTime(v, at + dt); base = v; } else P.linearRampToValueAtTime(v, at + dt); } }
window.Sound = S;
})();
