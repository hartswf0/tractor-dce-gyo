/* tools/perform/previz-draw.js — one previz frame on a 2D canvas (window.PervizDraw.frame(g, W, H, D, f)): the set's boxes, the heat of
   every body as a glow, the figures as sticks and boxes, what they hold, the giant as his needle poses him, and the readings. D is the
   scene's data, f the frame (all already projected to the screen by tools/perform/previz.js: x, y in -1..1, depth). */
(function (root) {
'use strict';
const HEAT = [[0, [40, 70, 140]], [0.25, [60, 140, 200]], [0.5, [240, 200, 80]], [0.75, [245, 120, 40]], [1, [255, 245, 220]]];
function heatRGB(u) { u = Math.max(0, Math.min(1, u)); for (let i = 1; i < HEAT.length; i++) if (u <= HEAT[i][0]) { const [a, ca] = HEAT[i - 1], [b, cb] = HEAT[i], w = (u - a) / (b - a); return ca.map((c, k) => Math.round(c + (cb[k] - c) * w)); } return HEAT[HEAT.length - 1][1]; }
const heatScale = T => 1 - Math.exp(-T / 0.8);
function frame(g, W, H, D, f) {
  const X = x => (x + 1) / 2 * W, Y = y => (1 - y) / 2 * H, dark = D.dark !== false;
  g.fillStyle = dark ? '#15171b' : '#f3f1ea'; g.fillRect(0, 0, W, H);
  /* the set: boxes, thin */
  g.lineWidth = 1; g.strokeStyle = dark ? 'rgba(200,205,215,0.16)' : 'rgba(40,40,40,0.18)';
  for (const e of f.set || []) { g.beginPath(); g.moveTo(X(e[0]), Y(e[1])); g.lineTo(X(e[2]), Y(e[3])); g.stroke(); }
  /* heat: a glow under each body, radius by its size on screen, colour by its motion heat */
  g.globalCompositeOperation = dark ? 'lighter' : 'multiply';
  for (const b of f.glow || []) { const r = Math.max(8, b.r * H * (0.7 + 0.8 * heatScale(b.T))), [cr, cg, cb] = heatRGB(heatScale(b.T)), a = 0.12 + 0.55 * heatScale(b.T);
    const gr = g.createRadialGradient(X(b.x), Y(b.y), 0, X(b.x), Y(b.y), r); gr.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(X(b.x), Y(b.y), r, 0, Math.PI * 2); g.fill(); }
  g.globalCompositeOperation = 'source-over';
  /* the giant (a prop in the take: his pose is his needle) */
  for (const G of f.giants || []) { const s = G.s * H, x = X(G.x), y = Y(G.y); g.strokeStyle = dark ? 'rgba(210,190,170,0.85)' : 'rgba(90,60,40,0.85)'; g.lineWidth = Math.max(2, s * 0.05); g.fillStyle = dark ? 'rgba(120,95,80,0.55)' : 'rgba(150,120,100,0.35)';
    const up = G.up; g.save(); g.translate(x, y); g.rotate(-(1 - up) * 1.2);
    g.beginPath(); g.ellipse(0, -s * 0.35, s * 0.18, s * 0.38, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(0, -s * 0.82 - up * s * 0.05, s * 0.12, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.15, -s * 0.6); g.lineTo(-s * 0.35 - up * s * 0.2, -s * 0.3 - up * s * 0.35); g.moveTo(s * 0.15, -s * 0.6); g.lineTo(s * 0.35 + up * s * 0.25, -s * 0.35 - up * s * 0.3); g.stroke();
    if (G.eye) { g.fillStyle = G.blind ? '#c0392b' : '#f1c40f'; g.beginPath(); g.arc(0, -s * 0.84, s * 0.03, 0, Math.PI * 2); g.fill(); }
    g.restore(); }
  /* props: lines (a spear, the stake) */
  for (const p of f.props || []) { g.strokeStyle = p.c || (dark ? '#d9c79c' : '#6b5427'); g.lineWidth = p.w || 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(X(p.a[0]), Y(p.a[1])); g.lineTo(X(p.b[0]), Y(p.b[1])); g.stroke();
    if (p.glow) { const gr = g.createRadialGradient(X(p.b[0]), Y(p.b[1]), 0, X(p.b[0]), Y(p.b[1]), 14); gr.addColorStop(0, 'rgba(255,170,60,0.95)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.beginPath(); g.arc(X(p.b[0]), Y(p.b[1]), 14, 0, Math.PI * 2); g.fill(); } }
  /* figures, far first: legs, torso box, arms, head, gaze */
  const figs = (f.figs || []).slice().sort((a, b) => b.z - a.z);
  for (const F of figs) { const P = F.p, c = F.c, lw = Math.max(1.5, F.s * H * 0.045);
    const L = (a, b, w) => { if (!P[a] || !P[b]) return; g.lineWidth = w || lw; g.beginPath(); g.moveTo(X(P[a][0]), Y(P[a][1])); g.lineTo(X(P[b][0]), Y(P[b][1])); g.stroke(); };
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = c; g.fillStyle = c;
    L('hipR', 'kneeR'); L('kneeR', 'footR'); L('hipL', 'kneeL'); L('kneeL', 'footL');
    if (P.shR && P.shL && P.hipR && P.hipL) { g.globalAlpha = 0.85; g.beginPath(); g.moveTo(X(P.shR[0]), Y(P.shR[1])); g.lineTo(X(P.shL[0]), Y(P.shL[1])); g.lineTo(X(P.hipL[0]), Y(P.hipL[1])); g.lineTo(X(P.hipR[0]), Y(P.hipR[1])); g.closePath(); g.fill(); g.globalAlpha = 1; }
    L('shR', 'elR'); L('elR', 'handR'); L('shL', 'elL'); L('elL', 'handL');
    if (P.head) { const r = Math.max(3, F.s * H * 0.11); g.beginPath(); g.arc(X(P.head[0]), Y(P.head[1]), r, 0, Math.PI * 2); g.fillStyle = dark ? '#e8d6b0' : '#c9a86a'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = c; g.stroke();
      if (P.look) { g.strokeStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X(P.head[0]), Y(P.head[1])); g.lineTo(X(P.look[0]), Y(P.look[1])); g.stroke(); } }
    if (F.label && F.s > 0.12) { g.font = '600 ' + Math.round(H * 0.022) + 'px ui-monospace,monospace'; g.fillStyle = dark ? 'rgba(235,235,235,0.8)' : 'rgba(20,20,20,0.8)'; g.textAlign = 'center'; if (P.crown) g.fillText(F.label, X(P.crown[0]), Y(P.crown[1]) - 6); }
    if (F.state) { const col = { A: '#e67e22', R: '#e74c3c', H: '#27ae60', h: '#16a085', D: '#7f8c8d' }[F.state] || '#999'; if (P.footR) { g.fillStyle = col; g.fillRect(X(P.footR[0]) - 3, Y(P.footR[1]) + 3, 6, 6); } } }
  /* readings */
  const fs = Math.round(H * 0.028); g.font = '600 ' + fs + 'px ui-monospace,monospace'; g.textAlign = 'left';
  g.fillStyle = dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)'; g.fillRect(0, H - fs * 2.9, W, fs * 2.9);
  g.fillStyle = dark ? '#eee' : '#111'; g.fillText((D.title || '') + '   ' + f.t.toFixed(2) + ' s   ' + (f.shot || ''), 10, H - fs * 1.75);
  if (f.why) { g.fillStyle = dark ? '#f5c16c' : '#8a4b00'; g.fillText(f.why.slice(0, Math.floor(W / (fs * 0.6))), 10, H - fs * 0.55); }
  /* the needles: four gauges, top right */
  if (f.needles) { const n = f.needles.length, w = Math.min(W * 0.1, 90), x0 = W - n * (w + 8) - 6, y0 = 8;
    f.needles.forEach((nd, k) => { const x = x0 + k * (w + 8), cx = x + w / 2, cy = y0 + w * 0.62, r = w * 0.46;
      g.fillStyle = dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.8)'; g.fillRect(x, y0, w, w * 0.85);
      const ang = v => Math.PI * (1 - Math.max(0, Math.min(1, v)));
      if (nd.band) { g.strokeStyle = 'rgba(46,204,113,0.8)'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r * 0.85, -ang(nd.band[0]), -ang(nd.band[1]), false); g.stroke(); }
      g.strokeStyle = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r, Math.PI, 0, false); g.stroke();
      const a = ang(nd.v); g.strokeStyle = nd.out ? '#e74c3c' : (dark ? '#fff' : '#111'); g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * r, cy - Math.sin(a) * r); g.stroke();
      g.font = '600 ' + Math.round(w * 0.14) + 'px ui-monospace,monospace'; g.textAlign = 'center'; g.fillStyle = dark ? '#ddd' : '#222'; g.fillText(nd.label, cx, y0 + w * 0.8); }); }
}
root.PervizDraw = { frame, heatRGB, heatScale };
})(typeof window !== 'undefined' ? window : globalThis);
