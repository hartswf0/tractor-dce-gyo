/* play/odyssey-game/map.js — the voyage chart: the Aegean as a studded blue baseplate, the land in brick, Ithaca drawn large
   (half the poem happens there), the 24 books as numbered medallions where they happen, Odysseus's voyage and Telemachus's
   road drawn as routes. Sailed books are gold; where you are pulses. Point and hold, pinch, click, or Tab + Enter: a book's
   card offers to play it, or to continue from where the poem was left. Below, the eight trials of the hand, playable alone. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const M = OG.M = { open: false, sel: 0, dwell: 0 };
const STUD = 22;
const LAND = [
  { c: '#b9a26f', top: '#cdb884', cells: [[.88, .05, .12, .28], [.93, .33, .07, .30], [.84, .14, .06, .08]] },   // the mainland: Pylos, Sparta
  { c: '#8c9c62', top: '#a3b476', cells: [[.00, .40, .07, .16]] },                                                // the west
  { c: '#6e7a52', top: '#86935f', cells: [[.66, .30, .06, .06]] },                                                // Olympus, far off
  { c: '#b9a26f', top: '#cdb884', cells: [[.66, .44, .26, .44]] },                                                // Ithaca, drawn large
  { c: '#9fb070', top: '#b6c585', cells: [[.52, .05, .20, .12]] },                                                // Scheria
];
const VOYAGE = [9, 10, 11, 12, 5, 6, 7, 8, 13], ROAD = [1, 2, 3, 4, 15], HOME = [13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24];
M.build = function () { M.canvas = OG.H.$('#og-map'); M.g = M.canvas.getContext('2d'); M.info = OG.H.$('#og-mapinfo'); };
M.books = () => OG.ST.story.books;
M.show = function () {
  M.open = true; OG.H.$('#og-chartlayer').hidden = false; M.dwell = 0; OG.H.level(null); OG.H.scene(null); OG.H.cue(null); OG.H.meters([]); OG.H.banner(null); OG.H.caption(null);
  OG.In.pressPose = 'pinch'; const at = OG.ST.save.at; M.pick(at ? at.book - 1 : 0);
  if (!M.unsub) M.unsub = OG.In.on((type, arg) => { if (!M.open) return;
    if (type === 'press') { const i = M.at(OG.In.primary()); if (i != null) { if (i === M.sel) M.go(); else M.pick(i); } }
    if (type === 'key') { const n = M.books().length; if (arg === 'Tab' || arg === 'ArrowRight' || arg === 'ArrowDown') M.pick((M.sel + 1) % n); if (arg === 'ArrowLeft' || arg === 'ArrowUp') M.pick((M.sel + n - 1) % n); if (arg === 'Enter' || arg === 'Space') M.go(); if (arg === 'KeyC') M.cont(); } });
};
M.hide = function () { M.open = false; OG.H.$('#og-chartlayer').hidden = true; };
M.pos = b => { const r = OG.E.stageRect(), f = M.frameBox(); return { x: f.x0 + b.chart[0] * f.w, y: f.y0 + b.chart[1] * f.h }; };
M.frameBox = function () { const r = OG.E.stageRect(), top = OG.H.$('#og-top').getBoundingClientRect().bottom + 56, info = M.info && !M.info.hidden ? M.info.getBoundingClientRect() : null, narrow = r.width < 760, bottom = narrow && info ? info.top - 16 : r.height * .94; return { x0: narrow ? 18 : 0, w: narrow ? r.width - 36 : r.width, y0: narrow ? top : r.height * .1, h: Math.max(120, (narrow ? bottom - top : r.height * .74)) }; };
M.at = function (c) { if (!c) return null; const r = OG.E.stageRect(); let best = null, bd = 1e9; M.books().forEach((b, i) => { const p = M.pos(b), d = Math.hypot(p.x - c.x * r.width, p.y - c.y * r.height); if (d < bd) { bd = d; best = i; } }); return bd < (r.width < 760 ? 26 : 30) ? best : null; };
M.pick = function (i) {
  M.sel = i; const b = M.books()[i]; if (!b) return; const S = OG.ST.save, at = S.at;
  const trials = b.items.filter(x => x.type === 'level').map(x => OG.G.data[x.id]).filter(Boolean), touches = b.items.filter(x => x.touch).map(x => x.touch.thing), scenes = b.items.filter(x => x.type === 'scene').length + trials.reduce((a, d) => a + (d.scenes || []).length, 0);
  M.info.innerHTML = `<span>BOOK ${b.roman} · ${b.place.toUpperCase()}${S.done[b.n] ? ' · SAILED' : ''}</span><b>${b.title}</b><span>${scenes} scenes · ${b.minutes ? b.minutes.toFixed(1) + ' min of the cut' : ''}${trials.length ? ' · trial: ' + trials.map(d => d.title).join(', ') : ''}${touches.length ? ' · touch: ' + touches.join(', ') : ''}</span>
    <div class="row" style="display:flex;gap:8px;justify-content:center;margin-top:8px"><button class="primary" id="og-playbook">Play book ${b.roman} (Enter)</button>${at && (at.book > 1 || at.item > 0) ? `<button id="og-continue">Continue · Book ${M.books()[at.book - 1].roman}: ${OG.ST.label(M.books()[at.book - 1], at.item)} (C)</button>` : ''}</div>
    <div id="og-trials"><span>TRIALS OF THE HAND</span>${OG.G.order.map(id => { const d = OG.G.data[id], l = S.levels[id]; return `<button data-level="${id}" title="${d.sub}">${d.n}. ${d.title}${l ? ' ' + '★'.repeat(l.stars) : ''}</button>`; }).join('')}</div>`;
  M.info.querySelector('#og-playbook').onclick = () => M.go(); const c = M.info.querySelector('#og-continue'); if (c) c.onclick = () => M.cont();
  M.info.querySelectorAll('[data-level]').forEach(el => el.onclick = () => OG.G.start(el.dataset.level));
};
M.go = function () { const b = M.books()[M.sel]; if (b) OG.ST.play(b.n, 0); };
M.cont = function () { const at = OG.ST.save.at; if (at) OG.ST.play(at.book, at.item); };
M.frame = function (dt, t) {
  if (!M.open) return; const cv = M.canvas, r = OG.E.stageRect(); if (cv.width !== Math.round(r.width) || cv.height !== Math.round(r.height)) { cv.width = Math.round(r.width); cv.height = Math.round(r.height); }
  const g = M.g, W = cv.width, Hh = cv.height, S = OG.ST.save;
  g.fillStyle = '#1b567f'; g.fillRect(0, 0, W, Hh);
  for (let y = STUD / 2; y < Hh; y += STUD) for (let x = STUD / 2; x < W; x += STUD) { g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.arc(x + 1.2, y + 1.6, 6.2, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(x, y, 6.2, 0, 7); g.fill(); }
  const fb = M.frameBox(); const brick = (x, y, w, h, c, top) => { const X = Math.round((fb.x0 + x * fb.w) / STUD) * STUD, Y = Math.round((fb.y0 + y * fb.h) / STUD) * STUD, BW = Math.max(STUD, Math.round(w * fb.w / STUD) * STUD), BH = Math.max(STUD, Math.round(h * fb.h / STUD) * STUD);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X + 4, Y + 6, BW, BH); g.fillStyle = c; g.fillRect(X, Y, BW, BH);
    for (let yy = Y + STUD / 2; yy < Y + BH; yy += STUD) for (let xx = X + STUD / 2; xx < X + BW; xx += STUD) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(xx + 1, yy + 1.5, 6.5, 0, 7); g.fill(); g.fillStyle = top; g.beginPath(); g.arc(xx, yy, 6.5, 0, 7); g.fill(); } };
  for (const l of LAND) for (const [x, y, w, h] of l.cells) brick(x, y, w, h, l.c, l.top);
  const books = M.books(), P = n => M.pos(books[n - 1]);
  const route = (list, col, dash, from) => { g.save(); g.setLineDash(dash); g.lineWidth = 4; g.strokeStyle = col; g.lineDashOffset = -t * 18; g.beginPath(); if (from) g.moveTo(from.x, from.y); list.forEach((n, i) => { const p = P(n); if (i || from) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }); g.stroke(); g.restore(); };
  const troy = { x: .97 * W, y: .06 * Hh }; route(VOYAGE, 'rgba(243,236,216,.9)', [10, 8], troy); route(ROAD, 'rgba(255,214,120,.8)', [4, 7]); route(HOME, 'rgba(243,236,216,.55)', [3, 6]);
  g.font = '700 12px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillStyle = '#f3ecd8'; g.fillText('TROY', troy.x - 24, troy.y + 4); g.fillText('ITHACA', fb.x0 + .79 * fb.w, fb.y0 + .9 * fb.h);
  const c = OG.In.primary(), h = M.at(c); if (h != null && h !== M.sel) { M.pick(h); M.dwell = 0; }
  if (h != null && c.src === 'hand' && c.pose === 'point') M.dwell += dt; else M.dwell = 0; if (M.dwell > 1.4) { M.dwell = 0; M.go(); }
  const cur = S.at ? S.at.book : 1;
  books.forEach((b, i) => { const p = M.pos(b), sel = i === M.sel, done = S.done[b.n], lv = b.items.some(x => x.type === 'level'), R = W < 700 ? (sel ? 14 : 11) : (sel ? 17 : 14);
    g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(p.x + 2, p.y + 4, R, 0, 7); g.fill();
    g.fillStyle = done ? '#e8c55a' : '#f3ecd8'; g.strokeStyle = lv ? '#d2452f' : '#10151b'; g.lineWidth = lv ? 4 : 2.5; g.beginPath(); g.arc(p.x, p.y, R, 0, 7); g.fill(); g.stroke();
    if (b.n === cur) { g.strokeStyle = '#7fe07a'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, R + 6 + Math.sin(t * 4) * 2, 0, 7); g.stroke(); }
    if (sel) { g.strokeStyle = '#ffe28a'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, R + 11, 0, 7); g.stroke(); if (M.dwell > 0) { g.lineWidth = 5; g.strokeStyle = '#7fe07a'; g.beginPath(); g.arc(p.x, p.y, R + 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * M.dwell / 1.4); g.stroke(); } }
    g.fillStyle = '#10151b'; g.font = `700 ${W < 700 ? (b.n > 9 ? 9 : 11) : (b.n > 9 ? 12 : 14)}px Georgia, serif`; g.textAlign = 'center'; g.fillText(b.roman, p.x, p.y + 5);
    if (sel) { g.font = '700 12px ui-monospace, Menlo, monospace'; const label = b.title.toUpperCase(), w = g.measureText(label).width + 12; g.fillStyle = 'rgba(16,21,27,.85)'; g.fillRect(p.x - w / 2, p.y - R - 30, w, 19); g.fillStyle = '#ffe28a'; g.fillText(label, p.x, p.y - R - 16); }
    g.restore(); });
  const top = OG.H.$('#og-top').getBoundingClientRect().bottom + 6, narrow = W < 700;
  g.fillStyle = 'rgba(12,20,28,.55)'; g.fillRect(0, top, Math.min(W, narrow ? W : 760), narrow ? 44 : 50);
  g.font = `700 ${narrow ? 18 : 24}px Georgia, serif`; g.textAlign = 'left'; g.fillStyle = '#f3ecd8'; g.fillText('The voyage chart · the whole Odyssey', 14, top + (narrow ? 20 : 24)); g.font = `${narrow ? 10 : 12}px ui-monospace, Menlo, monospace`; g.fillStyle = 'rgba(243,236,216,.85)';
  g.fillText(narrow ? '24 books. Red ring: a trial of the hand. Gold: sailed. Tap a book.' : '24 books on the Regulars\' Cut. Red rings: a trial of the hand. Gold: sailed. Point and hold, pinch, click, or Tab and Enter.', 14, top + (narrow ? 36 : 42));
};
})();
