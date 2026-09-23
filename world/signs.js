/* world/signs.js — the words a laid set puts up: a model's plan may carry signs (play/models/<name>.json .plan.signs), each on a
   face of the build ('n', 's', 'e', 'w': the way it looks), its centre at (x, z) in studs and y in bricks, w studs wide and h bricks
   tall, with a text, a second line and a style. They are drawn here as printed boards (a canvas on a plane) where they stand, so
   a store can be read: the aisle boards, the section headers, the brands on the end caps, the shelf tags under the thing on the
   list and the thing beside it. The film and the game see the same boards.

   Signs.lay(scene, rec, M) → a group (rec: a laid donor with .solid and .plan, world/film.js layDonor); Signs.drop(group). */
(function () {
'use strict';
const BRAND = {   // [background, text, accent, font]
  buzz: ['#c4281c', '#ffe23d', '#111', '900 italic'], duff: ['#b40f1e', '#ffffff', '#ffd400', '900'], krusty: ['#ffe23d', '#c4281c', '#1a5fb4', '900'], lardlad: ['#ff8bb3', '#6b2d0e', '#ffffff', '900 italic'],
  jim: ['#2e6b30', '#fff7d6', '#e8b04b', '700'], grandma: ['#f5ead1', '#7a3b12', '#c4281c', '700 italic'], luigi: ['#1f7a3a', '#ffffff', '#d42a2a', '800 italic'], sparkle: ['#1a5fb4', '#ffffff', '#ffd400', '900'],
};
const PX = 48;   // canvas pixels per stud
function canvasFor(sg) {
  const wS = sg.w, hS = sg.h * 1.2, W = Math.min(2048, Math.max(64, Math.round(wS * PX))), H = Math.max(24, Math.round(W * hS / wS));
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const fit = (text, weight, family, maxW, maxH) => { let fs = maxH; g.font = `${weight} ${fs}px ${family}`; const w = g.measureText(text).width; if (w > maxW) fs = Math.max(8, Math.floor(fs * maxW / w)); g.font = `${weight} ${fs}px ${family}`; return fs; };
  const [kind, arg] = String(sg.style || 'card').split(':');
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (kind === 'gantry') {
    g.fillStyle = '#123a8c'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd21f'; g.fillRect(0, H - H * 0.08, W, H * 0.08);
    const [n, ...rest] = sg.text.split('  '); g.fillStyle = '#fff'; g.fillRect(H * 0.12, H * 0.14, H * 0.72, H * 0.72); g.fillStyle = '#123a8c'; fit(n, '900', 'Helvetica, Arial, sans-serif', H * 0.6, H * 0.62); g.fillText(n, H * 0.48, H * 0.52);
    g.fillStyle = '#fff'; fit(rest.join(' '), '800', 'Helvetica, Arial, sans-serif', W - H * 1.2, H * 0.4); g.fillText(rest.join(' '), (W + H * 0.95) / 2, H * 0.5);
  } else if (kind === 'header') {
    g.fillStyle = '#1d3b8b'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd21f'; g.fillRect(0, 0, W, H * 0.06); g.fillRect(0, H * 0.94, W, H * 0.06);
    g.fillStyle = '#fff'; fit(sg.text, '900', 'Helvetica, Arial, sans-serif', W * 0.9, H * (sg.sub ? 0.5 : 0.62)); g.fillText(sg.text, W / 2, H * (sg.sub ? 0.4 : 0.52));
    if (sg.sub) { g.fillStyle = '#ffd21f'; fit(sg.sub, 'italic 600', 'Georgia, serif', W * 0.8, H * 0.2); g.fillText(sg.sub, W / 2, H * 0.78); }
  } else if (kind === 'brand') {
    const [bg, fg, ac, wt] = BRAND[arg] || BRAND.duff; g.fillStyle = bg; g.fillRect(0, 0, W, H); g.strokeStyle = ac; g.lineWidth = H * 0.07; g.strokeRect(H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1);
    g.fillStyle = fg; fit(sg.text, wt, 'Impact, "Arial Black", Helvetica, sans-serif', W * 0.86, H * 0.52); g.fillText(sg.text, W / 2, H * 0.42);
    if (sg.sub) { g.fillStyle = ac; fit(sg.sub, '700', 'Helvetica, Arial, sans-serif', W * 0.8, H * 0.2); g.fillText(sg.sub, W / 2, H * 0.78); }
  } else if (kind === 'tag') {
    g.fillStyle = '#ffe23d'; g.fillRect(0, 0, W, H); g.fillStyle = '#c4281c'; g.fillRect(0, 0, W, H * 0.12);
    const pw = sg.sub ? W * 0.3 : 0; g.fillStyle = '#111'; fit(sg.text, '800', 'Helvetica, Arial, sans-serif', W - pw - H * 0.3, H * 0.5); g.textAlign = 'left'; g.fillText(sg.text, H * 0.15, H * 0.56);
    if (sg.sub) { g.textAlign = 'right'; g.fillStyle = '#c4281c'; fit(sg.sub, '900', 'Helvetica, Arial, sans-serif', pw - H * 0.2, H * 0.62); g.fillText(sg.sub, W - H * 0.15, H * 0.56); }
  } else if (kind === 'swatch') {   // Wittgenstein's shop: the drawer's label and the colour sample beside the word
    g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; g.textAlign = 'left'; fit(sg.text, '800', 'Helvetica, Arial, sans-serif', W * 0.5, H * 0.55); g.fillText(sg.text, H * 0.2, H * 0.52);
    const sx = W * 0.58; g.fillStyle = arg || '#c4281c'; g.fillRect(sx, H * 0.14, H * 0.72, H * 0.72); g.strokeStyle = '#111'; g.lineWidth = Math.max(2, H * 0.04); g.strokeRect(sx, H * 0.14, H * 0.72, H * 0.72);
    g.fillStyle = '#111'; fit(sg.sub || '', 'italic 700', 'Georgia, serif', W - sx - H * 0.95, H * 0.45); g.fillText(sg.sub || '', sx + H * 0.86, H * 0.52);
  } else if (kind === 'lane') {
    g.fillStyle = '#ffd21f'; g.beginPath(); g.arc(W / 2, H / 2, Math.min(W, H) * 0.48, 0, Math.PI * 2); g.fill(); g.fillStyle = '#111'; fit(sg.text, '900', 'Helvetica, Arial, sans-serif', W * 0.6, H * 0.7); g.fillText(sg.text, W / 2, H * 0.54);
  } else {   // a white card with black words
    g.fillStyle = '#fbf8ee'; g.fillRect(0, 0, W, H); g.strokeStyle = '#1d3b8b'; g.lineWidth = Math.max(2, H * 0.06); g.strokeRect(0, 0, W, H);
    g.fillStyle = '#111'; fit(sg.text, '800', 'Helvetica, Arial, sans-serif', W * 0.9, H * 0.55); g.fillText(sg.text, W / 2, H * 0.54);
  }
  return c;
}
const NORMAL = { n: [0, -1, Math.PI], s: [0, 1, 0], e: [1, 0, Math.PI / 2], w: [-1, 0, -Math.PI / 2] };
function lay(scene, rec, M) {
  const plan = rec.plan, solid = rec.solid; if (!plan || !plan.signs || !solid || !window.THREE) return null;
  const grp = new THREE.Group(); grp.name = 'signs:' + rec.name; const BR = 24, ST = 20;
  for (const sg of plan.signs) {
    const [wx, wz] = solid.toWorld(sg.x, sg.z), [nx, nz, ry] = NORMAL[sg.face] || NORMAL.s, tex = new THREE.CanvasTexture(canvasFor(sg));
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(sg.w * ST, sg.h * BR), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    mesh.position.set(wx + nx * 0.8, rec.y0 + sg.y * BR, wz + nz * 0.8); mesh.rotation.y = ry; mesh.name = 'sign:' + sg.text; grp.add(mesh);
  }
  scene.add(grp); return grp;
}
function drop(grp) { if (!grp) return; if (grp.parent) grp.parent.remove(grp); grp.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
window.Signs = { lay, drop, canvasFor };
})();
