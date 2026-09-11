/* world/face.js — a face drawn on a minifig head, and the speech that moves its mouth.

   A LEGO head is a plain painted cylinder (3626b): it cannot blink, talk or squint. This draws one on a canvas
   from a vector of channels (brows, eyes, gaze, blink, the mouth's corners, jaw, width, press, teeth, tongue) and
   wraps the canvas over the front of the head as a thin curved plane, redrawn only when the channels change.
   The speech half is a port of the Odyssey halfworld engine (engine/speech.mjs): ten visemes, not forty phonemes;
   the text says which shape, the recorded voice's energy says whether the mouth opens; a 110 ms triangular blend
   so /ah/ into /ee/ is a movement, not two cards; and a carriage, small lagged head motion derived from the same
   envelope, because a head that holds still while its owner talks is the tell after a mouth flapping in silence.
   Pure functions where they can be: every speech function is a function of its arguments, so live and offline
   render the same mouth. Works in node (the speech half) and the browser (the drawing). */
(function (root) {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), clamp01 = v => clamp(v, 0, 1), smooth = x => x * x * (3 - 2 * x);

/* ── visemes: the ten mouths a face needs ── */
const VISEMES = {
  REST: { jaw: 0.00, wide: 0.00, press: 0.15, teeth: 0.0, tongue: 0.0, w: 1.00 },
  MM:   { jaw: 0.00, wide: 0.05, press: 1.00, teeth: 0.0, tongue: 0.0, w: 0.55 },
  FF:   { jaw: 0.12, wide: 0.22, press: 0.55, teeth: 1.0, tongue: 0.0, w: 0.70 },
  TH:   { jaw: 0.22, wide: 0.15, press: 0.10, teeth: 0.5, tongue: 1.0, w: 0.70 },
  DD:   { jaw: 0.26, wide: 0.10, press: 0.05, teeth: 0.3, tongue: 0.6, w: 0.50 },
  SS:   { jaw: 0.16, wide: 0.55, press: 0.20, teeth: 0.9, tongue: 0.2, w: 0.65 },
  EE:   { jaw: 0.34, wide: 0.90, press: 0.00, teeth: 0.5, tongue: 0.0, w: 1.00 },
  AH:   { jaw: 0.92, wide: 0.30, press: 0.00, teeth: 0.2, tongue: 0.1, w: 1.15 },
  OH:   { jaw: 0.62, wide: -0.45, press: 0.00, teeth: 0.0, tongue: 0.0, w: 1.10 },
  OO:   { jaw: 0.34, wide: -0.95, press: 0.10, teeth: 0.0, tongue: 0.0, w: 1.00 },
  RR:   { jaw: 0.30, wide: -0.25, press: 0.00, teeth: 0.1, tongue: 0.3, w: 0.85 },
};
/* graphemes to visemes: digraphs before their letters, or "sh" becomes /s/ + /h/ and "the" /t/ + /h/ */
const GRAPHEMES = [['th', 'TH'], ['sh', 'SS'], ['ch', 'SS'], ['ph', 'FF'], ['wh', 'OO'], ['ee', 'EE'], ['ea', 'EE'], ['oo', 'OO'], ['ou', 'OO'], ['ow', 'OH'], ['oa', 'OH'], ['ai', 'EE'], ['ay', 'EE'], ['ie', 'EE'], ['qu', 'OO'], ['ng', 'DD'],
  ['a', 'AH'], ['e', 'EE'], ['i', 'EE'], ['o', 'OH'], ['u', 'OO'], ['y', 'EE'], ['m', 'MM'], ['b', 'MM'], ['p', 'MM'], ['f', 'FF'], ['v', 'FF'], ['w', 'OO'], ['r', 'RR'], ['s', 'SS'], ['z', 'SS'], ['c', 'SS'], ['x', 'SS'], ['j', 'SS'],
  ['t', 'DD'], ['d', 'DD'], ['n', 'DD'], ['l', 'DD'], ['k', 'DD'], ['g', 'DD'], ['h', 'AH']];
/** The text as a track of visemes over `seconds`: [{t0, t1, v}], each unit weighted by its viseme's width, words separated by a short REST. */
function visemeTrack(text, seconds) {
  const units = []; const words = String(text || '').toLowerCase().replace(/[^a-z\s']/g, ' ').split(/\s+/).filter(Boolean);
  for (const word of words) {
    let i = 0; while (i < word.length) { let hit = null; for (const [g, v] of GRAPHEMES) if (word.startsWith(g, i)) { hit = [g, v]; break; } if (!hit) { i++; continue; } units.push({ v: hit[1], w: VISEMES[hit[1]].w }); i += hit[0].length; }
    units.push({ v: 'REST', w: 0.6 });
  }
  if (!units.length) return [];
  const total = units.reduce((n, u) => n + u.w, 0), k = Math.max(0.2, +seconds || 1) / total; let t = 0; const out = [];
  for (const u of units) { const d = u.w * k; out.push({ t0: t, t1: t + d, v: u.v }); t += d; }
  return out;
}
/** The envelope's value at t: env is an array of 0..1 at `hz` samples a second. */
function envelopeAt(env, hz, t) { if (!env || !env.length) return t >= 0 ? 0.75 : 0; const x = t * (hz || 50), i = Math.floor(x); if (i < 0) return env[0]; if (i >= env.length - 1) return i >= env.length ? 0 : env[env.length - 1]; const f = x - i; return env[i] + (env[i + 1] - env[i]) * f; }
const BLEND = 0.110, FLOOR = 0.10;
/** The mouth at t: the visemes within BLEND of t under a triangular kernel, gated by the voice's energy. */
function sampleMouth(track, env, hz, t, { blend = BLEND, floor = FLOOR } = {}) {
  let jaw = 0, wide = 0, press = 0, teeth = 0, tongue = 0, wsum = 0;
  for (const seg of track || []) {
    if (seg.t1 < t - blend || seg.t0 > t + blend) continue;
    const a = Math.max(seg.t0, t - blend), b = Math.min(seg.t1, t + blend); if (b <= a) continue;
    const mid = (a + b) / 2, w = (1 - Math.abs(mid - t) / blend) * (b - a); if (w <= 0) continue;
    const V = VISEMES[seg.v] || VISEMES.REST; jaw += V.jaw * w; wide += V.wide * w; press += V.press * w; teeth += V.teeth * w; tongue += V.tongue * w; wsum += w;
  }
  if (wsum > 0) { jaw /= wsum; wide /= wsum; press /= wsum; teeth /= wsum; tongue /= wsum; } else { const V = VISEMES.REST; jaw = V.jaw; wide = V.wide; press = V.press; }
  const energy = clamp01(envelopeAt(env, hz, t)), gate = smooth(clamp01(energy * 1.25)), seal = 1 - clamp01(press) * 0.94;
  return { jaw: clamp01(Math.max(jaw * gate, floor * gate) * seal), wide: clamp(wide * (0.45 + 0.55 * gate), -1, 1), press: clamp01(press * (1 - gate * 0.25)), teeth: clamp01(teeth * gate), tongue: clamp01(tongue * gate), energy, gate };
}
/** The head under the voice: emphasis pitches it down a little, a slow drift phase-offset per character, a brow lift on the stresses; all lagged, the head follows the voice. */
function speechCarriage(env, hz, t, seed = 0) {
  const e = clamp01(envelopeAt(env, hz, t - 0.085)), e2 = clamp01(envelopeAt(env, hz, t - 0.24)), drive = smooth(e);
  return { pitch: (drive - e2 * 0.6) * 0.055, yaw: Math.sin(t * 1.15 + seed * 2.4) * 0.030 * (0.4 + 0.6 * drive), roll: Math.sin(t * 0.83 + seed * 1.7) * 0.018, chest: 0.20 + 0.35 * drive, brow: clamp01((drive - 0.45) * 1.5) * 0.55 };
}
/** An envelope from PCM samples: RMS over windows of 1/hz s, normalised to its 95th percentile. */
function envelopeOf(samples, rate, hz = 50) {
  const n = Math.max(1, Math.round(rate / hz)), out = []; for (let i = 0; i < samples.length; i += n) { let s = 0; const m = Math.min(samples.length, i + n); for (let k = i; k < m; k++) s += samples[k] * samples[k]; out.push(Math.sqrt(s / Math.max(1, m - i))); }
  const sorted = out.slice().sort((a, b) => a - b), top = sorted[Math.floor(sorted.length * 0.95)] || 1; return out.map(v => +Math.min(1, v / (top || 1)).toFixed(3));
}

/* ── the drawing ── */
const STYLES = {
  lego:    { ink: '#141414', white: '#ffffff', lip: '#141414', lw: 1.0, eye: 1.0, brow: 1.0, pupil: 1.0 },
  odyssey: { ink: '#2a2118', white: '#f4efe6', lip: '#6b3d34', lw: 0.8, eye: 0.9, brow: 0.9, pupil: 0.9 },
  bold:    { ink: '#101010', white: '#ffffff', lip: '#101010', lw: 1.4, eye: 1.15, brow: 1.3, pupil: 1.1 },
};
const FACE_CHANNELS = ['brow.up', 'brow.knit', 'brow.asym', 'eye.wide', 'eye.narrow', 'blink', 'gaze.x', 'gaze.y', 'mouth.jaw', 'mouth.wide', 'mouth.press', 'smile', 'frown', 'mouth.asym', 'cheek', 'teeth', 'tongue'];
/** Draw the face vector v onto a 2d context of w×h (the head's front, x across the face, y down). */
function draw(ctx, w, h, v, style) {
  const S = STYLES[style] || STYLES.lego, g = v || {}; const c = k => +g[k] || 0;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h); ctx.setTransform(-1, 0, 0, 1, w, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';   // mirrored: the cylinder's u runs against x on the −z side, so a raised right brow is the figure's right
  const cx = w / 2, R = w / 2, ey = h * 0.42, ex = R * 0.42, lw = Math.max(2, R * 0.075 * S.lw);
  const wide = clamp01(c('eye.wide')), narrow = clamp01(c('eye.narrow')), blink = clamp01(c('blink')), gx = clamp(c('gaze.x'), -1, 1), gy = clamp(c('gaze.y'), -1, 1);
  const eyeR = R * 0.19 * S.eye * (1 + 0.35 * wide), asym = clamp(c('brow.asym'), -1, 1);
  for (const side of [-1, 1]) {
    const x = cx + side * ex, open = clamp01((1 - blink) * (1 - narrow * 0.6)); const rw = eyeR * (1 + 0.15 * narrow), rh = eyeR * (0.25 + 0.75 * open);
    // the eye: a rounded shape that flattens at the bottom when narrowed and at the top when wide; a lid when blinking
    ctx.fillStyle = S.white; ctx.beginPath(); roundEye(ctx, x, ey, rw, rh, narrow, wide); ctx.fill();
    ctx.strokeStyle = S.ink; ctx.lineWidth = lw * 0.5; ctx.stroke();
    if (open > 0.15) { ctx.fillStyle = S.ink; ctx.beginPath(); ctx.arc(x + gx * rw * 0.45, ey + gy * rh * 0.45, eyeR * 0.42 * S.pupil, 0, Math.PI * 2); ctx.fill(); }
    // the brow: a stroke above the eye; up lifts it, knit pulls the inner ends down and in, asym lifts one side over the other
    const up = clamp01(c('brow.up')) + side * asym * 0.5, knit = clamp01(c('brow.knit'));
    const by = ey - eyeR * (1.55 + 0.9 * up), inner = x - side * rw * 0.9, outer = x + side * rw * 1.05;
    ctx.strokeStyle = S.ink; ctx.lineWidth = lw * S.brow; ctx.beginPath(); ctx.moveTo(inner, by + knit * eyeR * 0.75 - up * eyeR * 0.1); ctx.quadraticCurveTo(x, by - eyeR * 0.25 * (1 - knit), outer, by + eyeR * 0.3 * knit + eyeR * 0.15 * (1 - up)); ctx.stroke();
  }
  // the mouth: a curve corner to corner; smile lifts the corners, frown drops them, asym one of them; the jaw opens it into a lens; press thins it
  const my = h * 0.72, mw = R * (0.55 + 0.2 * clamp(c('mouth.wide'), -1, 1)) * (1 - 0.25 * clamp01(c('mouth.press'))), jaw = clamp01(c('mouth.jaw')), smile = clamp01(c('smile')), frown = clamp01(c('frown')), ma = clamp(c('mouth.asym'), -1, 1);
  const lift = (smile - frown) * R * 0.22, ly = my + lift * 0.3, lx = cx - mw, rx = cx + mw, lcy = my - lift - ma * R * 0.12, rcy = my - lift + ma * R * 0.12, open = jaw * R * 0.5 + 1;
  ctx.fillStyle = S.ink; ctx.strokeStyle = S.lip; ctx.lineWidth = lw * (1 - 0.35 * clamp01(c('mouth.press')));
  ctx.beginPath(); ctx.moveTo(lx, lcy); ctx.quadraticCurveTo(cx, ly - open * 0.35 - (smile - frown) * R * 0.05, rx, rcy); ctx.quadraticCurveTo(cx, ly + open + (smile - frown) * R * 0.28, lx, lcy); ctx.closePath();
  if (jaw > 0.04) { ctx.fill(); const teeth = clamp01(c('teeth')), tongue = clamp01(c('tongue')); ctx.save(); ctx.clip();
    if (teeth > 0.05) { ctx.fillStyle = S.white; ctx.fillRect(lx, ly - open * 0.35, rx - lx, open * 0.34 * teeth + 1); }
    if (tongue > 0.05) { ctx.fillStyle = '#b0443a'; ctx.beginPath(); ctx.ellipse(cx, ly + open * 0.95, mw * 0.55, open * 0.5 * tongue + 1, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); }
  ctx.stroke();
  const cheek = clamp01(c('cheek')); if (cheek > 0.1) { ctx.strokeStyle = S.ink; ctx.lineWidth = lw * 0.4; for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + side * mw * 1.25, my - R * 0.12); ctx.quadraticCurveTo(cx + side * mw * 1.4, my + R * 0.05, cx + side * mw * 1.2, my + R * 0.2 * cheek); ctx.stroke(); } }
}
function roundEye(ctx, x, y, rw, rh, narrow, wide) {
  // an ellipse whose bottom flattens as the eye narrows and whose top flattens as it widens low: the two shapes MecaFace uses
  const flatB = narrow * 0.7, flatT = Math.max(0, wide - 0.6) * 0.6;
  ctx.moveTo(x - rw, y); ctx.bezierCurveTo(x - rw, y - rh * (1 - flatT), x + rw, y - rh * (1 - flatT), x + rw, y);
  ctx.bezierCurveTo(x + rw, y + rh * (1 - flatB), x - rw, y + rh * (1 - flatB), x - rw, y); ctx.closePath();
}
const key = v => FACE_CHANNELS.map(k => Math.round((v[k] || 0) * 100)).join(',');

/** Attach a drawn face to a rig's head: a curved plane over the front of the head (LDraw frame: the face is the −z side, y down) with a canvas texture. */
function attach(rig, style, THREE) {
  THREE = THREE || root.THREE; if (!THREE || !rig || !rig.slots || !rig.slots.head || typeof document === 'undefined') return null;
  const size = 256, canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas); tex.anisotropy = 4; if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace; else if ('encoding' in tex && THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
  // the head is a cylinder of radius 10 LDU, 24 tall from its neck (y 0) to its crown (y −24 in the figure's y-down frame); the face plane hugs the front 110 degrees
  const geo = new THREE.CylinderGeometry(10.35, 10.35, 19, 24, 1, true, Math.PI - Math.PI * 0.306, Math.PI * 0.612);   // the front of the head is its −z side in the figure's frame
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.FrontSide });
  tex.flipY = false;   // the LDraw frame is y-down: the image's top lands at the crown
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'face'; mesh.position.set(0, 12, 0);
  rig.slots.head.add(mesh);
  const face = { rig, mesh, canvas, ctx, tex, style: style || 'lego', last: '', draws: 0 };
  paint(face, {}); return face;
}
/** Redraw when the vector changed. Returns true when it drew. */
function paint(face, v) { if (!face) return false; const k = key(v || {}); if (k === face.last) return false; face.last = k; draw(face.ctx, face.canvas.width, face.canvas.height, v || {}, face.style); face.tex.needsUpdate = true; face.draws++; return true; }
function detach(face) { if (!face || !face.mesh) return; if (face.mesh.parent) face.mesh.parent.remove(face.mesh); face.mesh.geometry.dispose(); face.mesh.material.dispose(); face.tex.dispose(); }
root.Face = { VISEMES, STYLES, FACE_CHANNELS, visemeTrack, envelopeAt, sampleMouth, speechCarriage, envelopeOf, draw, attach, paint, detach, key };
})(typeof window !== 'undefined' ? window : globalThis);
