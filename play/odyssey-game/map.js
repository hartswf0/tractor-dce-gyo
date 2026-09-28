/* play/odyssey-game/map.js — the voyage chart: the Aegean as a studded blue baseplate, the land in brick, the islands of the
   levels as medallions, the route of the voyage drawn in the order it was sailed (Troy, the Cyclops, Aeolia, the Sirens, the
   Straits, Ogygia, home). Point or hover to choose; pinch, click, Space or a steady point (1.4 s) sets sail. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const M = OG.M = { open: false, hover: null, dwell: 0, sel: 0 };
const STUD = 22;
// land: brick outlines on a 0..1 chart (x right, y down); the Greek mainland on the east, Sicily west, the islands between
const LAND = [
  { c: '#b9a26f', top: '#cdb884', cells: [[.86, .05, .14, .30], [.92, .35, .08, .45], [.80, .15, .08, .12]] },            // mainland Greece
  { c: '#8c9c62', top: '#a3b476', cells: [[.00, .40, .10, .18], [.04, .34, .06, .08]] },                                        // Sicily's shore
  { c: '#6e7a52', top: '#86935f', cells: [[.88, .06, .08, .07]] },                                                               // Olympus
  { c: '#b9a26f', top: '#cdb884', cells: [[.95, .80, .05, .12], [.62, .88, .12, .06]] },                                          // the south
];
const VOYAGE = ['03-cyclops', '05-winds', '06-sirens', '07-scylla', '02-raft', '01-opening', '04-bow', '08-bed'];
M.build = function () { M.canvas = OG.H.$('#og-map'); M.g = M.canvas.getContext('2d'); M.info = OG.H.$('#og-mapinfo'); };
M.show = function () {
  M.open = true; OG.H.$('#og-chartlayer').hidden = false; M.dwell = 0; OG.H.level(null); OG.H.cue(null); OG.H.meters([]); OG.H.banner(null);
  OG.In.pressPose = 'pinch'; M.pick(M.sel); if (!M.unsub) M.unsub = OG.In.on((type, arg) => { if (!M.open) return;
    if (type === 'press') { const i = M.at(OG.In.primary()); if (i != null) { M.pick(i); M.go(); } }
    if (type === 'key') { if (arg === 'Tab' || arg === 'ArrowRight' || arg === 'ArrowDown') M.pick((M.sel + 1) % M.levels().length); if (arg === 'ArrowLeft' || arg === 'ArrowUp') M.pick((M.sel + M.levels().length - 1) % M.levels().length); if (arg === 'Enter') M.go(); } });
};
M.hide = function () { M.open = false; OG.H.$('#og-chartlayer').hidden = true; };
M.levels = () => OG.G.order.map(id => OG.G.data[id]);
M.pos = d => { const r = OG.E.stageRect(); return { x: d.chart[0] * r.width, y: (0.1 + d.chart[1] * 0.78) * r.height }; };
M.at = function (c) { if (!c) return null; const r = OG.E.stageRect(); let best = null, bd = 1e9; M.levels().forEach((d, i) => { const p = M.pos(d), dd = Math.hypot(p.x - c.x * r.width, p.y - c.y * r.height); if (dd < bd) { bd = dd; best = i; } }); return bd < 60 ? best : null; };
M.pick = function (i) { M.sel = i; const d = M.levels()[i]; if (!d) return; const best = OG.G.best[d.id];
  M.info.innerHTML = `<span>BOOK ${OG.H.roman(d.book)} · ${d.island.toUpperCase()}</span><b>${d.n}. ${d.title}</b><span>${d.sub}</span><div style="display:flex;align-items:center;justify-content:center;gap:8px">${OG.H.icon(OG.G.levels[d.id] ? OG.G.levels[d.id].icon || 'point' : 'point')}<span><b style="font:700 13px ui-monospace;letter-spacing:.2em">${d.verbName}</b>${best ? 'best κλέος ' + best.kleos + ' ' + '★'.repeat(best.stars) : 'not yet sailed'}</span></div><button class="primary" id="og-sail">Set sail ⟶</button>`;
  M.info.querySelector('#og-sail').onclick = () => M.go(); };
M.go = function () { const d = M.levels()[M.sel]; if (d) OG.G.start(d.id); };
M.frame = function (dt, t) {
  if (!M.open) return; const cv = M.canvas, r = OG.E.stageRect(); if (cv.width !== Math.round(r.width) || cv.height !== Math.round(r.height)) { cv.width = Math.round(r.width); cv.height = Math.round(r.height); }
  const g = M.g, W = cv.width, Hh = cv.height;
  g.fillStyle = '#1b567f'; g.fillRect(0, 0, W, Hh);
  // the studs of the sea
  for (let y = STUD / 2; y < Hh; y += STUD) for (let x = STUD / 2; x < W; x += STUD) { g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.arc(x + 1.2, y + 1.6, 6.2, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.09)'; g.beginPath(); g.arc(x, y, 6.2, 0, 7); g.fill(); }
  // swell: slow rows of lighter studs
  for (let y = STUD / 2; y < Hh; y += STUD) { const off = (Math.sin(y * .05 + t * .6) * .5 + .5); for (let x = STUD / 2; x < W; x += STUD) if (((x / STUD + y / STUD + Math.floor(t * 2)) | 0) % 9 === 0 && off > .5) { g.fillStyle = 'rgba(160,210,240,.18)'; g.beginPath(); g.arc(x, y, 6.2, 0, 7); g.fill(); } }
  const brick = (x, y, w, h, c, top) => { // a land brick snapped to the stud grid
    const X = Math.round(x * W / STUD) * STUD, Y = Math.round(y * Hh / STUD) * STUD, BW = Math.max(STUD, Math.round(w * W / STUD) * STUD), BH = Math.max(STUD, Math.round(h * Hh / STUD) * STUD);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(X + 4, Y + 6, BW, BH); g.fillStyle = c; g.fillRect(X, Y, BW, BH);
    for (let yy = Y + STUD / 2; yy < Y + BH; yy += STUD) for (let xx = X + STUD / 2; xx < X + BW; xx += STUD) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(xx + 1, yy + 1.5, 6.5, 0, 7); g.fill(); g.fillStyle = top; g.beginPath(); g.arc(xx, yy, 6.5, 0, 7); g.fill(); }
  };
  for (const l of LAND) for (const [x, y, w, h] of l.cells) brick(x, y, w, h, l.c, l.top);
  // islands under the medallions
  const levels = M.levels(), byId = Object.fromEntries(levels.map(d => [d.id, d]));
  for (const d of levels) { const p = M.pos(d); brick(p.x / W - .035, p.y / Hh - .04, .07, .08, '#c9b27a', '#dcc68f'); brick(p.x / W - .015, p.y / Hh - .07, .03, .04, '#6f8a4e', '#88a35f'); }
  // the route: Troy (north-east) and the voyage in the order it was sailed
  const troy = { x: .97 * W, y: .12 * Hh }; g.save(); g.setLineDash([10, 8]); g.lineWidth = 4; g.strokeStyle = 'rgba(243,236,216,.85)'; g.lineDashOffset = -t * 20; g.beginPath(); g.moveTo(troy.x, troy.y);
  for (const id of VOYAGE) { const d = byId[id]; if (!d) continue; const p = M.pos(d); g.lineTo(p.x, p.y); } g.stroke(); g.restore();
  g.font = '700 12px ui-monospace, Menlo, monospace'; g.fillStyle = '#f3ecd8'; g.textAlign = 'center'; g.fillText('TROY', troy.x - 20, troy.y - 12); g.fillText('OLYMPUS', .92 * W, .05 * Hh);
  // hover by any cursor; a steady point sets sail
  const c = OG.In.primary(), h = M.at(c); if (h != null && h !== M.sel) { M.pick(h); M.dwell = 0; }
  if (h != null && c.src === 'hand' && c.pose === 'point') M.dwell += dt; else M.dwell = 0;
  if (M.dwell > 1.4) { M.dwell = 0; M.go(); }
  levels.forEach((d, i) => { const p = M.pos(d), sel = i === M.sel, best = OG.G.best[d.id];
    g.save(); g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(p.x + 3, p.y + 5, sel ? 27 : 23, 0, 7); g.fill();
    g.fillStyle = best ? '#e8c55a' : '#f3ecd8'; g.strokeStyle = '#10151b'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, sel ? 27 : 23, 0, 7); g.fill(); g.stroke();
    if (sel) { g.strokeStyle = '#ffe28a'; g.lineWidth = 3; g.beginPath(); g.arc(p.x, p.y, 34 + Math.sin(t * 4) * 2, 0, 7); g.stroke(); if (M.dwell > 0) { g.lineWidth = 5; g.strokeStyle = '#7fe07a'; g.beginPath(); g.arc(p.x, p.y, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * M.dwell / 1.4); g.stroke(); } }
    g.fillStyle = '#10151b'; g.font = '700 20px Georgia, serif'; g.textAlign = 'center'; g.fillText(String(d.n), p.x, p.y + 7);
    g.font = '700 12px ui-monospace, Menlo, monospace'; const label = d.title.toUpperCase(), w = g.measureText(label).width + 12; g.fillStyle = 'rgba(16,21,27,.8)'; g.fillRect(p.x - w / 2, p.y + 32, w, 19); g.fillStyle = sel ? '#ffe28a' : '#f3ecd8'; g.fillText(label, p.x, p.y + 46);
    if (best) { g.fillStyle = '#ffe28a'; g.fillText('★'.repeat(best.stars), p.x, p.y - 32); } g.restore(); });
  g.font = '700 26px Georgia, serif'; g.textAlign = 'left'; g.fillStyle = '#f3ecd8'; g.fillText('The voyage chart', 22, 92); g.font = '13px ui-monospace, Menlo, monospace'; g.fillStyle = 'rgba(243,236,216,.8)'; g.fillText('Choose an island: point at it and hold, pinch, click, or press Tab and Space.', 22, 114);
};
})();
