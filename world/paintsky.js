/* world/paintsky.js — a painted sky for a film: an ultramarine zenith going warm at the horizon, and banks of cumulus round it
   the way the Western painters build them (Maggiori, Dixon): flat blue-grey bases, towers of billows, the side toward the sun
   lit cream and gold, the side away in lavender shadow, a few hard highlights, brush marks over it all. It is a sphere that
   rides with the camera (no parallax, no fog), painted on a canvas once for each sun direction and warmth.

   PaintSky.attach(scene, M) → sky; sky.paint({ azim, elev, warmth, seed, zenith, horizon, cover }); sky.follow(camera); sky.drop().
   azim is clockwise from north (as world/sky.js has it), so the lit sides face the shot's own sun. */
(function () {
'use strict';
const W = 4096, H = 2048;
const mix = (a, b, t) => { const p = x => [parseInt(x.slice(1, 3), 16), parseInt(x.slice(3, 5), 16), parseInt(x.slice(5, 7), 16)], A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
/* canvas x for an azimuth: SphereGeometry puts u = φ/2π at (−cos φ, ·, sin φ), which is azimuth 270° − φ */
const xOf = az => ((((270 - az) % 360) + 360) % 360) / 360 * W, yOf = el => (90 - el) / 180 * H;
function paintCanvas(o) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), R = rng(o.seed || 7);
  const warmth = o.warmth != null ? o.warmth : 0.6, zen = o.zenith || '#27468f', hor = o.horizon || '#e6c79c';
  // the ground of the sky: deep at the top, a clear middle blue, warm haze at the horizon, the earth's own colour below it
  const gr = g.createLinearGradient(0, 0, 0, H * 0.56);
  gr.addColorStop(0, mix(zen, '#101c40', 0.25)); gr.addColorStop(0.35, zen); gr.addColorStop(0.8, mix(zen, '#5f8fd6', 0.55)); gr.addColorStop(0.95, mix('#7fa8dc', hor, 0.45)); gr.addColorStop(1, hor);   // the blue held deep almost to the horizon, a thin warm band at it
  g.fillStyle = gr; g.fillRect(0, 0, W, H * 0.56); g.fillStyle = mix(hor, '#a8683c', 0.5); g.fillRect(0, H * 0.56, W, H * 0.44);
  // a glow round the sun low in the sky
  const sx = xOf(o.azim || 180), sy = yOf(o.elev || 25);
  for (const dx of [-W, 0, W]) { const rg = g.createRadialGradient(sx + dx, sy, 0, sx + dx, sy, H * 0.35); rg.addColorStop(0, `rgba(255,236,190,${0.55 * warmth})`); rg.addColorStop(1, 'rgba(255,236,190,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  const lit = mix('#fff6e4', '#ffc98a', warmth), lit2 = mix('#ffffff', '#ffe2b0', warmth), shade = mix('#9aa3c4', '#8a7aa6', warmth), base = mix('#7482a8', '#5e5c86', warmth);
  const clouds = []; const n = o.cover != null ? Math.round(o.cover) : 26;
  for (let i = 0; i < n; i++) clouds.push({ az: (i / n) * 360 + (R() - 0.5) * (360 / n) * 0.9, base: 3 + R() * 6, w: 10 + R() * 26, h: 5 + Math.pow(R(), 1.8) * 22 });   // banks low on the horizon, a few towers, blue between them
  clouds.sort((a, b) => b.h - a.h);   // the tall towers behind, the low banks in front
  for (const cl of clouds) {
    const cx = xOf(cl.az), by = yOf(cl.base), wpx = cl.w / 360 * W, hpx = cl.h / 180 * H, blobs = [];
    // billows: a row along the flat base, broad towers above it narrowing and leaning a little
    const cols = 4 + Math.floor(R() * 5), lean = (R() - 0.5) * 0.35;
    for (let k = 0; k < cols; k++) { const fx = (k / (cols - 1) - 0.5), tall = hpx * Math.max(0.2, 1 - Math.abs(fx) * 1.3) * (0.45 + R() * 0.7), x0 = cx + fx * wpx, r0 = wpx / cols * (0.85 + R() * 0.5);
      for (let y = 0; y < tall; y += r0 * 0.4) { const r = r0 * (1 - y / (tall + r0) * 0.5) * (0.8 + R() * 0.35); blobs.push({ x: x0 + lean * y + (R() - 0.5) * r * 0.8, y: by - r * 0.5 - y, r }); } }
    blobs.sort((p, q) => q.y - p.y);
    let d = sx - cx; if (d > W / 2) d -= W; if (d < -W / 2) d += W; const lx = Math.sign(d || 1) * Math.min(1, 0.3 + Math.abs(d) / (W * 0.2)), ly = -0.7;
    const back = Math.abs(d) < W * 0.07;   // a cloud in front of the sun: dark, with a burning rim
    // the cloud on its own sheet: one soft mass, shaded as a mass (light from the sun's side across it), the tops toward the sun caught bright, the base flat and violet
    const pad = wpx * 0.25, cw = Math.ceil(wpx * 1.7 + pad * 2), ch = Math.ceil(hpx * 1.4 + pad * 2), ox = cx - cw / 2, oy = by - ch + pad;
    const sheet = document.createElement('canvas'); sheet.width = cw; sheet.height = ch; const s = sheet.getContext('2d');
    for (const b of blobs) { const x = b.x - ox, y = b.y - oy, gr = s.createRadialGradient(x, y, b.r * 0.82, x, y, b.r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); s.fillStyle = gr; s.beginPath(); s.arc(x, y, b.r, 0, Math.PI * 2); s.fill(); }
    s.globalCompositeOperation = 'source-atop';
    const mx = cw / 2, my = by - oy - hpx * 0.45, L = Math.max(cw, hpx), lg = s.createLinearGradient(mx + lx * L * 0.45, my + ly * L * 0.35, mx - lx * L * 0.45, my - ly * L * 0.35);
    if (back) { lg.addColorStop(0, '#77709a'); lg.addColorStop(1, '#4f4c74'); } else { lg.addColorStop(0, lit); lg.addColorStop(0.45, mix(lit.replace(/rgb\(|\)/g, '').split(',').map(v => (+v).toString(16).padStart(2, '0')).reduce((a, v) => a + v, '#'), '#a9a3c6', 0.45)); lg.addColorStop(1, shade); }
    s.fillStyle = lg; s.fillRect(0, 0, cw, ch);
    for (const b of blobs) { if (R() > 0.45) continue; const x = b.x - ox + lx * b.r * 0.35, y = b.y - oy + ly * b.r * 0.35, hr = s.createRadialGradient(x, y, 0, x, y, b.r * 0.75); hr.addColorStop(0, back ? 'rgba(255,210,150,0.5)' : lit2); hr.addColorStop(1, 'rgba(255,255,255,0)'); s.fillStyle = hr; s.globalAlpha = back ? 0.6 : 0.55 + 0.35 * Math.max(0, -((b.y - by) / hpx)); s.beginPath(); s.arc(x, y, b.r * 0.75, 0, Math.PI * 2); s.fill(); }
    s.globalAlpha = 1; const bg = s.createLinearGradient(0, by - oy - hpx * 0.4, 0, by - oy); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, base);
    s.fillStyle = bg; s.fillRect(0, 0, cw, ch); s.clearRect(0, by - oy + 1, cw, ch);   // the base cut flat, as cumulus sit on their condensation level
    for (const dx of [-W, 0, W]) { if (ox + dx + cw < 0 || ox + dx > W) continue; g.save(); g.filter = 'blur(1.5px)'; g.drawImage(sheet, ox + dx, oy); g.restore(); }
  }
  // brush marks: short strokes of the colour already there, a painter's hand over the whole sky
  const img = g.getImageData(0, 0, W, Math.round(H * 0.56)), px = img.data;
  for (let i = 0; i < 26000; i++) { const x = Math.floor(R() * W), y = Math.floor(R() * H * 0.55), j = (y * W + x) * 4, a = R() * Math.PI, L = 6 + R() * 18;
    g.strokeStyle = `rgba(${px[j]},${px[j + 1]},${px[j + 2]},0.55)`; g.lineWidth = 2 + R() * 3; g.beginPath(); g.moveTo(x - Math.cos(a) * L, y - Math.sin(a) * L * 0.4); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * 0.4); g.stroke(); }
  return c;
}
function attach(scene, M) {
  const R = 1800 * M, geo = new THREE.SphereGeometry(R, 96, 48), mat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'paint-sky'; mesh.renderOrder = -10; mesh.frustumCulled = false; scene.add(mesh);
  const cache = new Map(); let key = null;
  return {
    mesh,
    paint(o) { const k = JSON.stringify(o); if (k === key) return; key = k; let tex = cache.get(k);
      if (!tex) { tex = new THREE.CanvasTexture(paintCanvas(o)); if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; cache.set(k, tex); }
      mat.map = tex; mat.needsUpdate = true; mesh.visible = true; },
    follow(cam) { mesh.position.copy(cam.position); },
    hide() { mesh.visible = false; },
    drop() { scene.remove(mesh); geo.dispose(); mat.dispose(); for (const t of cache.values()) t.dispose(); cache.clear(); }
  };
}
window.PaintSky = { attach, paintCanvas };
})();
