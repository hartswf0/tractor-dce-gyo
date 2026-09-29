/* play/odyssey-game/hud.js — what the player reads: the cue (a drawing of the hand verb and one sentence for the input in
   use), the captions (the speaker in tracked capitals, the recorded line in roman, narration in grey italic, as the take
   prints them), the meters, the kleos, the title and end cards, and an overlay canvas for the hands and the targets. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const H = OG.H = {};
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ── the gesture drawings: a hand of rounded bricks, fingers up or folded, with the motion drawn as arrows ── */
function handSVG(fingers, { thumb = 'out', pinch = false, x = 0, y = 0, s = 1, mirror = false } = {}) {
  const f = fingers, X = [21, 31, 41, 51], H0 = [28, 32, 29, 23];
  let g = `<g transform="translate(${x},${y}) scale(${mirror ? -s : s},${s})${mirror ? ' translate(-80,0)' : ''}">`;
  g += '<rect x="19" y="44" width="42" height="34" rx="11"/>';
  X.forEach((fx, i) => { const up = f[i] && !(pinch && i === 0), h = up ? H0[i] : 9; g += `<rect x="${fx}" y="${46 - h}" width="9" height="${h + 6}" rx="4.5"/>`; });
  if (pinch) g += '<path d="M25 40 C 16 30, 8 34, 12 46" fill="none" stroke-width="7" stroke-linecap="round"/><circle cx="14" cy="38" r="5" class="spark"/>';
  else if (thumb === 'out') g += '<rect x="4" y="50" width="20" height="9" rx="4.5" transform="rotate(-35 14 55)"/>';
  else g += '<rect x="14" y="54" width="18" height="9" rx="4.5"/>';
  return g + '</g>';
}
const ARROW = (d) => `<path d="${d}" class="motion" marker-end="url(#ogArrow)"/>`;
const ICONS = {
  point: () => handSVG([1, 0, 0, 0], { thumb: 'in' }) + ARROW('M70 30 q 14 8 6 24'),
  pinch: () => handSVG([1, 1, 1, 1], { pinch: true }) + ARROW('M66 64 l 18 0'),
  fist: () => handSVG([0, 0, 0, 0], { thumb: 'in' }) + '<path d="M8 18 l 64 0" class="motion dash"/>',
  open: () => handSVG([1, 1, 1, 1]) + ARROW('M6 88 l 22 0') + ARROW('M74 88 l -22 0'),
  thrust: () => handSVG([1, 1, 1, 1], { pinch: true, s: .8, x: 10, y: 12 }) + ARROW('M40 90 l 0 -6') + '<circle cx="40" cy="50" r="44" class="motion ring"/>',
  pull: () => handSVG([1, 1, 1, 1], { pinch: true, s: .55, x: -4, y: 20 }) + handSVG([1, 1, 1, 1], { pinch: true, s: .55, x: 40, y: 20, mirror: true }) + ARROW('M30 80 l -22 0') + ARROW('M52 80 l 22 0'),
  aim: () => '<circle cx="40" cy="44" r="26" class="motion ring"/><circle cx="40" cy="44" r="14" class="motion ring"/><circle cx="40" cy="44" r="3"/>',
  circle: () => handSVG([1, 0, 0, 0], { thumb: 'in', s: .7, x: 12, y: 18 }) + '<path d="M40 8 a 30 30 0 1 1 -28 20" class="motion" marker-end="url(#ogArrow)"/>',
  pump: () => handSVG([1, 1, 1, 1], { s: .7, x: 12, y: 16 }) + ARROW('M74 50 l 0 -30') + ARROW('M74 50 l 0 30'),
  steer: () => handSVG([1, 1, 1, 1], { s: .75, x: 10, y: 10 }) + ARROW('M34 90 l -30 0') + ARROW('M46 90 l 30 0'),
  lift: () => handSVG([1, 1, 1, 1], { pinch: true, s: .8, x: 8, y: 22 }) + ARROW('M72 70 l 0 -46'),
  embrace: () => handSVG([1, 1, 1, 1], { s: .5, x: -6, y: 26 }) + handSVG([1, 1, 1, 1], { s: .5, x: 46, y: 26, mirror: true }) + ARROW('M10 86 l 22 0') + ARROW('M70 86 l -22 0'),
  mouse: () => '<rect x="24" y="14" width="32" height="52" rx="16"/><path d="M40 14 l 0 20" class="cut"/>',
  keys: () => '<rect x="6" y="40" width="20" height="18" rx="3"/><rect x="30" y="40" width="20" height="18" rx="3"/><rect x="54" y="40" width="20" height="18" rx="3"/><rect x="30" y="18" width="20" height="18" rx="3"/>',
};
H.icon = (name, cls = '') => `<svg class="og-icon ${cls}" viewBox="-4 0 92 96" aria-hidden="true"><defs><marker id="ogArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="head"/></marker></defs>${(ICONS[name] || ICONS.open)()}</svg>`;

H.build = function () {
  const root = H.root = el('div', '', ''); root.id = 'og-root';
  root.innerHTML = `
  <canvas id="og-overlay"></canvas>
  <div id="og-input" aria-label="Play area"></div>
  <div id="og-top"><div class="og-brand"><b>NOBODY'S HANDS</b><span>the Odyssey, played by hand · Hand Butter</span></div>
    <div id="og-level"></div>
    <div id="og-kleos"><span class="k">κλέος</span><b id="og-k">—</b><span id="og-time">0:00</span><span class="k" title="the whole poem">Σ</span><b id="og-total">0</b></div>
    <div id="og-nav"><button id="og-chart" title="Voyage chart (M)">Chart</button><button id="og-skip" title="Skip this scene (S)">Skip ⟶</button><button id="og-replay" title="Replay the level (R)">Replay</button><button id="og-hands" title="Play with your hands: the camera">Hands</button><button id="og-sound" title="Sound">Sound</button></div></div>
  <div id="og-meters"></div>
  <div id="og-cue" hidden><div id="og-cue-icon"></div><div><b id="og-cue-verb"></b><span id="og-cue-text"></span></div></div>
  <div id="og-caption" hidden><b></b><span></span></div>
  <div id="og-progress" hidden><i></i></div>
  <div id="og-banner" hidden></div>
  <div id="og-flash"></div>
  <div id="og-chartlayer" hidden><canvas id="og-map"></canvas><div id="og-mapinfo"></div></div>
  <div id="og-loading" hidden><b>Setting the stage…</b><span></span></div>`;
  document.body.appendChild(root); document.body.classList.add('og');
  H.overlay = root.querySelector('#og-overlay'); H.ctx = H.overlay.getContext('2d');
  return root;
};
H.$ = s => H.root.querySelector(s);
H.level = function (d) { H.$('#og-level').innerHTML = d ? `<span>BOOK ${roman(d.book)} · ${d.island.toUpperCase()}</span><b>${d.n}. ${d.title}</b>` : ''; };
const roman = n => { const r = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, c] of r) while (n >= v) { s += c; n -= v; } return s; };
H.roman = roman;
/** the cinema's header: the book and the scene now playing */
H.scene = function (book, item) { const e = H.$('#og-level'); if (!book) { H.$('#og-progress').hidden = true; H.$('#og-skip').hidden = true; return; } H.$('#og-skip').hidden = false; e.innerHTML = `<span>BOOK ${book.roman} · ${book.title.toUpperCase()}</span><b>${item ? item.title : book.place}</b>`; H.$('#og-progress').hidden = !item; };
H.progress = u => { H.$('#og-progress i').style.width = Math.round(Math.max(0, Math.min(1, u)) * 100) + '%'; };
H.total = k => { H.$('#og-total').textContent = k; };
/** the cue: a drawing of the verb and the sentence for the input in use */
H.cue = function (icon, verb, text) { const c = H.$('#og-cue'); if (!icon) { c.hidden = true; return; } c.hidden = false; H.$('#og-cue-icon').innerHTML = H.icon(icon); H.$('#og-cue-verb').textContent = verb || ''; H.$('#og-cue-text').textContent = text || ''; c.dataset.icon = icon; };
H.cueText = function (cue) { if (!cue) return ''; if (typeof cue === 'string') return cue; if (!cue.hand && !cue.mouse && !cue.keys) return H.cueText(Object.values(cue)[0]);   /* staged cues (string, aim, loose): the first stage's */ const src = OG.In.source, touch = matchMedia('(pointer: coarse)').matches; const t = src === 'hand' ? cue.hand : src === 'key' ? (cue.keys || cue.mouse) : (cue.mouse || cue.hand); return touch && src !== 'hand' && t ? t.replace(/the mouse button/gi, 'your finger').replace(/Hold the mouse/gi, 'Hold a finger').replace(/with the button held/gi, 'with a finger held down').replace(/Let go of the button/gi, 'Lift your finger').replace(/\bmouse\b/gi, 'finger').replace(/\bclick\b/gi, 'tap').replace(/Press and drag/gi, 'Two fingers apart, or drag').replace(/pointer/gi, 'finger') : t; };
H.caption = function (speaker, text, isLine) { const c = H.$('#og-caption'); if (!speaker) { c.hidden = true; return; } c.hidden = false; c.classList.toggle('narr', !isLine); c.querySelector('b').textContent = isLine ? speaker.toUpperCase() : ''; c.querySelector('span').textContent = text; };
/** meters: {id: {label, value 0..1, color, warn}} */
H.meters = function (list) { const m = H.$('#og-meters'); m.innerHTML = (list || []).map(x => `<div class="og-meter ${x.warn ? 'warn' : ''}" data-id="${x.id}"><span>${x.label}</span><i><em style="width:${Math.round(Math.max(0, Math.min(1, x.value)) * 100)}%;background:${x.color || '#e8c55a'}"></em></i>${x.text ? `<small>${x.text}</small>` : ''}</div>`).join(''); };
H.kleos = function (k, t) { H.$('#og-k').textContent = k == null ? '—' : k; const s = Math.max(0, Math.floor(t || 0)); H.$('#og-time').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
H.flash = function (text, kind = '') { const f = H.$('#og-flash'); f.textContent = text; f.className = 'show ' + kind; clearTimeout(H._ft); H._ft = setTimeout(() => f.className = '', 1400); };
H.banner = function (html, cls = '') { const b = H.$('#og-banner'); if (!html) { b.hidden = true; b.innerHTML = ''; return b; } b.hidden = false; b.className = cls; b.innerHTML = html; return b; };
H.loading = (on, text = '') => { const l = H.$('#og-loading'); l.hidden = !on; l.querySelector('span').textContent = text; };

/* ── the overlay: hands, cursors, targets; cleared and redrawn every frame ── */
H.begin = function () { const tb = H.$('#og-top').getBoundingClientRect().bottom; if (tb !== H._tb) { H._tb = tb; H.root.style.setProperty('--og-top-h', Math.round(tb) + 'px'); } const r = OG.E.stageRect(), c = H.overlay; if (c.width !== Math.round(r.width) || c.height !== Math.round(r.height)) { c.width = Math.round(r.width); c.height = Math.round(r.height); } H.ctx.clearRect(0, 0, c.width, c.height); H.W = c.width; H.Hh = c.height; };
H.ring = function (x, y, r, color = '#ffe28a', { width = 3, fill, label, dash, progress } = {}) {
  const g = H.ctx, X = x * H.W, Y = y * H.Hh; g.save(); g.lineWidth = width; g.strokeStyle = color; if (dash) g.setLineDash(dash);
  g.beginPath(); g.arc(X, Y, r, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } g.stroke(); g.setLineDash([]);
  if (progress != null) { g.lineWidth = width + 3; g.beginPath(); g.arc(X, Y, r + 6, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, progress))); g.stroke(); }
  if (label) { g.font = '600 13px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillStyle = 'rgba(10,14,18,.72)'; const w = g.measureText(label).width + 12; g.fillRect(X - w / 2, Y + r + 6, w, 19); g.fillStyle = color; g.fillText(label, X, Y + r + 20); }
  g.restore();
};
H.line = function (a, b, color = '#ffe28a', width = 2, dash) { const g = H.ctx; g.save(); g.strokeStyle = color; g.lineWidth = width; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(a.x * H.W, a.y * H.Hh); g.lineTo(b.x * H.W, b.y * H.Hh); g.stroke(); g.restore(); };
H.text = function (x, y, s, color = '#fff', size = 14, align = 'center') { const g = H.ctx; g.save(); g.font = `700 ${size}px ui-monospace, Menlo, monospace`; g.textAlign = align; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(s, x * H.W, y * H.Hh); g.fillStyle = color; g.fillText(s, x * H.W, y * H.Hh); g.restore(); };
const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];
const POSE_COL = { pinch: '#7fe07a', fist: '#ff8f6b', point: '#ffe28a', open: '#9fd4ff', V: '#d6a8ff', up: '#9fd4ff', down: '#9fd4ff' };
/** every cursor: a hand as its skeleton (mapped onto the stage exactly as Hand Butter maps it), a pointer as a ring */
const COARSE = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
H.hands = function (cursors) {
  const g = H.ctx;
  for (const c of cursors) {
    const col = POSE_COL[c.pose] || '#fff';
    if (c.src === 'hand' && c.marks) {
      const P = c.marks.map(m => { const p = imagePoint(m); return [p.x * H.W, p.y * H.Hh]; });
      g.save(); g.lineCap = 'round'; g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 7; g.beginPath(); for (const [a, b] of BONES) { g.moveTo(...P[a]); g.lineTo(...P[b]); } g.stroke();
      g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); for (const [a, b] of BONES) { g.moveTo(...P[a]); g.lineTo(...P[b]); } g.stroke();
      g.fillStyle = col; for (const [x, y] of P) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); } g.restore();
      H.ring(c.x, c.y, c.down ? 9 : 14, col, { width: 3 }); H.text(c.x, c.y - 28 / H.Hh, c.pose.toUpperCase(), col, 12);
    } else if (c.src === 'mouse' && (!OG.In.mouse.seen || (!c.down && COARSE && performance.now() - OG.In.mouse.seen > 1500))) { /* no pointer yet, or a lifted finger: no ring left in the middle of the picture */
    } else { H.ring(c.x, c.y, c.down ? 10 : 16, col, { width: 3, fill: c.down ? 'rgba(127,224,122,.25)' : null }); }
  }
};
})();
