/* play/odyssey-game/audio.js — the voice, the bed and the effects.

   VOICE  the halfworld recordings: each line a level speaks is a segment of the scene recording (drive/voice-manifest.json
          start + dur, the speaker and the authored line from drive-script.json and viewer/spoken-lines.json), cut by
          tools/odyssey-game-audio.py into play/odyssey-game/voice/<scene>-<gi>.ogg and listed in voice/lines.json.
   BED    the book's BRONZE COUNCIL track (odyssey/take/bed/bronze-council-NN.ogg), streamed, looped, and ducked under every
          voice line by the take's bed law: 0.18 open, 0.10 under the voice, 150 ms raised-cosine edges (odyssey_take.py).
   SFX    the trailer's synthesised library (tools/trailer-sound.py FX: clang, splash, hiss, roar, thunder, bowstring…), rendered
          to play/odyssey-game/sfx/*.ogg by the same tool; beds among them (fire, sea, wind, whirlpool, oars) loop.
   The voice's live level (an analyser) moves the speaking actor's mouth. Everything degrades to silence: a line that cannot
   play still shows its caption for its length, so a level never waits on sound. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const U = p => (window.OG_URL ? window.OG_URL(p) : p);
const A = OG.A = { ctx: null, lines: {}, buffers: new Map(), loops: new Map(), bedEl: null, voiceEl: null, open: 0.36, duckRatio: 0.10 / 0.18, muted: false, speaking: null, log: [], failures: 0 };
A.load = async function () { try { const r = await fetch('odyssey-game/voice/lines.json'); A.lines = await r.json(); } catch (e) { A.lines = {}; console.warn('[audio] no lines.json'); } };
A.unlock = function () {
  if (A.ctx) { if (A.ctx.state !== 'running') A.ctx.resume().catch(() => { }); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext; A.ctx = new C(); A.master = A.ctx.createGain(); A.master.connect(A.ctx.destination);
    A.bedGain = A.ctx.createGain(); A.bedGain.gain.value = 0; A.bedGain.connect(A.master);
    A.voiceGain = A.ctx.createGain(); A.voiceGain.gain.value = 1; A.analyser = A.ctx.createAnalyser(); A.analyser.fftSize = 512; A.voiceGain.connect(A.analyser); A.analyser.connect(A.master);
    A.fxGain = A.ctx.createGain(); A.fxGain.gain.value = .8; A.fxGain.connect(A.master);
    A.bedEl = new Audio(); A.bedEl.loop = true; A.bedEl.crossOrigin = 'anonymous'; A.ctx.createMediaElementSource(A.bedEl).connect(A.bedGain);
    A.voiceEl = new Audio(); A.voiceEl.crossOrigin = 'anonymous'; A.ctx.createMediaElementSource(A.voiceEl).connect(A.voiceGain);
    A.sceneEl = new Audio(); A.sceneEl.crossOrigin = 'anonymous'; A.ctx.createMediaElementSource(A.sceneEl).connect(A.voiceGain);
    if (A.ctx.state !== 'running') A.ctx.resume().catch(() => { });
  } catch (e) { A.failures++; console.warn('[audio]', e); }
  try { if (window.startSound) startSound(); } catch (e) { }   // Hand Butter's own click and impact samples
};
A.setMuted = m => { A.muted = m; if (A.master) A.master.gain.value = m ? 0 : 1; };
function ramp(param, to, sec = 0.15) { if (!A.ctx) return; const t = A.ctx.currentTime; param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(to, t + sec); }
/** the book's bed: bronze-council-NN.ogg from odyssey/take/bed */
A.bed = function (file, { gain, at } = {}) {
  A.unlock(); if (!A.bedEl) return; const src = '../odyssey/take/bed/' + file;
  if (A.bedFile !== file) { A.bedFile = file; A.bedEl.src = U(src); A.bedEl.currentTime = at || 0; } else if (at != null) A.bedEl.currentTime = at;
  A.bedEl.play().catch(() => A.failures++); A.bedOpen = gain ?? A.open; ramp(A.bedGain.gain, A.speaking ? A.bedOpen * A.duckRatio : A.bedOpen, 1.2); A.log.push(['bed', file]);
};
A.stopBed = function (sec = 1) { if (!A.bedEl) return; ramp(A.bedGain.gain, 0, sec); setTimeout(() => { if (A.bedGain.gain.value < .01) A.bedEl.pause(); }, sec * 1000 + 50); };
/** a scene's kept segments as one clip (cinema); the bed ducks per segment through A.duck */
A.scene = function (file) { A.unlock(); A.sceneOn = !!file; if (!file || !A.sceneEl) return; A.sceneEl.src = U('odyssey-game/' + file); A.sceneEl.currentTime = 0; A.sceneEl.play().catch(() => A.failures++); A.log.push(['scene', file]); };
A.sceneStop = function () { A.sceneOn = false; if (A.sceneEl) A.sceneEl.pause(); A.duck(false); };
A.sceneClock = () => A.sceneOn && A.sceneEl && !A.sceneEl.paused && A.sceneEl.readyState >= 2 ? A.sceneEl.currentTime : null;
A.duck = function (on) { if (!A.bedGain || A.ducked === on) return; A.ducked = on; ramp(A.bedGain.gain, (A.bedOpen ?? A.open) * (on ? A.duckRatio : 1), 0.15); };
/** a line: resolves when it has been heard (or its length has passed); the caption runs for its length either way */
A.say = function (id, { actor, caption = true } = {}) {
  const L = A.lines[id]; if (!L) { console.warn('[audio] no line', id); return Promise.resolve(false); }
  A.unlock(); A.log.push(['voice', id]); const dur = L.dur;
  if (A.speaking && A.speaking.actor) A.speaking.actor.speaking = false;
  const me = A.speaking = { id, actor, t0: performance.now() }; if (actor) actor.speaking = true;
  if (A.bedGain) ramp(A.bedGain.gain, (A.bedOpen ?? A.open) * A.duckRatio, 0.15);
  if (caption && OG.H) OG.H.caption(L.speaker, L.caption, L.isLine);
  if (A.voiceEl) { A.voiceEl.src = U('odyssey-game/' + L.file); A.voiceEl.currentTime = 0; A.voiceEl.play().catch(() => A.failures++); }
  return new Promise(resolve => {
    const done = () => { if (A.speaking !== me) return resolve(false); A.speaking = null; if (actor) actor.speaking = false; if (A.bedGain) ramp(A.bedGain.gain, A.bedOpen ?? A.open, 0.15); if (OG.H) OG.H.caption(null); resolve(true); };
    setTimeout(done, dur * 1000 / Math.max(0.25, (OG.E && OG.E.timeScale) || 1) + 250);
  });
};
A.hush = function () { if (A.voiceEl) A.voiceEl.pause(); if (A.speaking && A.speaking.actor) A.speaking.actor.speaking = false; A.speaking = null; if (OG.H) OG.H.caption(null); if (A.bedGain) ramp(A.bedGain.gain, A.bedOpen ?? A.open, .15); };
/** the voice's level now, 0..1, for the mouth */
A.level = function () { if (!A.analyser || !(A.speaking || A.sceneOn)) return 0; const a = new Float32Array(A.analyser.fftSize); A.analyser.getFloatTimeDomainData(a); let s = 0; for (const v of a) s += v * v; const rms = Math.sqrt(s / a.length); return Math.min(1, rms * 6); };
async function buffer(name) { if (A.buffers.has(name)) return A.buffers.get(name); const p = fetch('odyssey-game/sfx/' + name + '.ogg').then(r => r.arrayBuffer()).then(b => A.ctx.decodeAudioData(b)).catch(() => null); A.buffers.set(name, p); return p; }
A.preload = names => { A.unlock(); if (A.ctx) for (const n of names) buffer(n); };
/** a synthesised effect from the trailer library, once */
A.sfx = async function (name, { gain = 1, rate = 1 } = {}) {
  A.log.push(['sfx', name]); A.unlock(); if (!A.ctx) return; const b = await buffer(name); if (!b) return;
  const s = A.ctx.createBufferSource(), g = A.ctx.createGain(); s.buffer = b; s.playbackRate.value = rate; g.gain.value = gain; s.connect(g); g.connect(A.fxGain); s.start();
};
/** an effect bed, looped until stopped (fire, sea, wind, whirlpool, oars) */
A.loop = async function (name, { gain = .6 } = {}) {
  A.unlock(); if (!A.ctx || A.loops.has(name)) return; A.loops.set(name, null); const b = await buffer(name); if (!b || !A.loops.has(name)) return;
  const s = A.ctx.createBufferSource(), g = A.ctx.createGain(); s.buffer = b; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(A.fxGain); s.start(); ramp(g.gain, gain, .6); A.loops.set(name, { s, g }); A.log.push(['loop', name]);
};
A.loopGain = (name, gain) => { const l = A.loops.get(name); if (l) ramp(l.g.gain, gain, .2); };
A.stopLoops = function () { for (const [n, l] of A.loops) { if (l) { ramp(l.g.gain, 0, .4); const s = l.s; setTimeout(() => { try { s.stop(); } catch (e) { } }, 500); } } A.loops.clear(); };
/** a drone of voices made of oscillators (the Sirens' song under the narration): vowel-coloured, with a slow vibrato */
A.drone = function (gain = .2, freqs = [220, 277.2, 329.6, 440]) {
  A.unlock(); if (!A.ctx) return; if (!A.droneNode) { const g = A.ctx.createGain(); g.gain.value = 0; const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = .8; f.connect(g); g.connect(A.fxGain);
    const oscs = freqs.map((hz, i) => { const o = A.ctx.createOscillator(), lfo = A.ctx.createOscillator(), lg = A.ctx.createGain(); o.type = i % 2 ? 'triangle' : 'sawtooth'; o.frequency.value = hz; lfo.frequency.value = 4.5 + i * .4; lg.gain.value = hz * .012; lfo.connect(lg); lg.connect(o.frequency); const og = A.ctx.createGain(); og.gain.value = .25; o.connect(og); og.connect(f); o.start(); lfo.start(); return [o, lfo]; });
    A.droneNode = { g, oscs }; }
  ramp(A.droneNode.g.gain, gain, .4);
};
A.stopDrone = function () { const d = A.droneNode; if (!d) return; A.droneNode = null; ramp(d.g.gain, 0, .5); setTimeout(() => d.oscs.forEach(([o, l]) => { try { o.stop(); l.stop(); } catch (e) { } }), 700); };
A.stopAll = function () { A.stopDrone(); A.hush(); A.stopLoops(); A.stopBed(.6); };
})();
