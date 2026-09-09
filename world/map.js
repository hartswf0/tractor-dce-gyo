/* world/map.js — knowing where you are: a round minimap, a full map with names, a waypoint, the nearest street.

   Both maps are 2-D canvases drawn from what the window already holds (rings,
   roads, areas in local metres; +x east, +z south), north up. The minimap
   rides at the bottom left; a tap opens the full map, which pans, pinches,
   names the streets and buildings, sets a waypoint on a tap and goes there on
   a long press. Nothing here touches the 3-D scene except the waypoint's beam. */
(function () {
'use strict';
const ROAD_C = { river: '#4a86c8' }, COVER_C = { water: '#5b8fc9', park: '#7bb56a', pitch: '#6cae5c', wood: '#5b8a4f', cemetery: '#b3bba6', stadium: '#6cae5c', parking: '#8d9096', plaza: '#cfc8b8' };
const roadColour = r => ROAD_C[r.kind] || (/footway|path|steps|pedestrian|track/.test(r.kind) ? '#c9b58c' : r.kind === 'cycleway' ? '#a06a60' : '#4a4e56');
function create({ W, M, onWaypoint, onGo }) {
  const mini = document.getElementById('minimap'), big = document.getElementById('bigmap'), bc = big.querySelector('canvas');
  const S = { W, M, mini, big, bc, open: false, view: { cx: 0, cz: 0, ppm: 0.43 }, waypoint: null, acc: 0, drawn: { roads: 0, buildings: 0, names: 0 }, names: [], t: 0 };
  const dpr = Math.min(2, devicePixelRatio || 1);
  const size = (c, w, h) => { if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); } };
  const player = () => { const p = W.mode === 'fly' ? W.tie.pos : W.mode === 'ride' && W.veh ? W.veh.pos : W.rig.pos; return { x: p.x / M, z: p.z / M }; };
  const heading = () => W.mode === 'fly' ? Math.atan2(W.tie.vel.x, W.tie.vel.z) : W.mode === 'ride' && W.veh ? W.veh.heading : W.rig.heading;
  /** Draw the map layers into a context whose transform already maps metres to pixels. */
  function layers(g, ppm, bounds, names) {
    const win = W.win; if (!win) return; const { x0, x1, z0, z1 } = bounds; S.drawn = { roads: 0, buildings: 0, names: 0 };
    const inView = (x, z, pad = 0) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad;
    for (const a of win.areas || []) { const c = COVER_C[a.kind]; if (!c || !a.ring.some(p => inView(p.x, p.z, 50))) continue; g.fillStyle = c; g.beginPath(); a.ring.forEach((p, i) => i ? g.lineTo(p.x, p.z) : g.moveTo(p.x, p.z)); g.closePath(); g.fill(); }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const r of win.roads || []) { if (!r.pts.some(p => inView(p.x, p.z, 30))) continue; g.strokeStyle = roadColour(r); g.lineWidth = Math.max(1.6 / ppm, r.w || 3); g.beginPath(); r.pts.forEach((p, i) => i ? g.lineTo(p.x, p.z) : g.moveTo(p.x, p.z)); g.stroke(); S.drawn.roads++; }
    for (const b of win.buildings || []) { if (!b.ring.some(p => inView(p.x, p.z, 20))) continue; g.fillStyle = b.name ? '#5a5e68' : '#787c86'; g.beginPath(); b.ring.forEach((p, i) => i ? g.lineTo(p.x, p.z) : g.moveTo(p.x, p.z)); g.closePath(); g.fill(); S.drawn.buildings++; }
    if (names) {
      g.fillStyle = '#1a1f2a'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3 / ppm; g.textAlign = 'center'; g.textBaseline = 'middle'; const px = 11 / ppm; g.font = `600 ${px}px -apple-system, Segoe UI, Helvetica, Arial, sans-serif`;
      for (const r of win.roads || []) { if (!r.name) continue; let bi = 0, bl = 0; for (let i = 0; i < r.pts.length - 1; i++) { const L = Math.hypot(r.pts[i + 1].x - r.pts[i].x, r.pts[i + 1].z - r.pts[i].z); if (L > bl) { bl = L; bi = i; } }
        if (bl * ppm < r.name.length * 7 + 20) continue; const a = r.pts[bi], b = r.pts[bi + 1], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2; if (!inView(mx, mz)) continue; let ang = Math.atan2(b.z - a.z, b.x - a.x); if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
        g.save(); g.translate(mx, mz); g.rotate(ang); g.strokeText(r.name, 0, -(r.w || 4) / 2 - px * 0.7); g.fillText(r.name, 0, -(r.w || 4) / 2 - px * 0.7); g.restore(); S.drawn.names++; S.names.push(r.name); }
      g.font = `700 ${px}px -apple-system, Segoe UI, Helvetica, Arial, sans-serif`;
      const label = (name, x, z) => { if (!inView(x, z)) return; g.strokeText(name, x, z); g.fillText(name, x, z); S.drawn.names++; S.names.push(name); };
      for (const b of win.buildings || []) { if (!b.name) continue; let area = 0, cx = 0, cz = 0; const n = b.ring.length; for (let i = 0; i < n; i++) { const p = b.ring[i], q = b.ring[(i + 1) % n]; area += p.x * q.z - q.x * p.z; cx += p.x; cz += p.z; } if (Math.abs(area) / 2 < 400 / Math.max(1, ppm)) continue; label(b.name, cx / n, cz / n); }
      for (const a of win.areas || []) { if (!a.name || a.kind === 'parking') continue; const n = a.ring.length; let cx = 0, cz = 0; for (const p of a.ring) { cx += p.x; cz += p.z; } label(a.name, cx / n, cz / n); }
      for (const p of win.points || []) if (p.name) label(p.name, p.x, p.z);
    }
  }
  function marks(g, ppm, mini) {
    const me = player(), h = heading(); S.drawn.marks = 0;
    if (S.waypoint) { g.fillStyle = '#d8382e'; g.beginPath(); g.arc(S.waypoint.x, S.waypoint.z, 4 / ppm, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#d8382e'; g.lineWidth = 1.5 / ppm; g.beginPath(); g.arc(S.waypoint.x, S.waypoint.z, 8 / ppm, 0, Math.PI * 2); g.stroke(); }
    if (W.crowd) for (const n of W.crowd.npcs) { if (!n.alive || n.kind !== 'trooper') continue; const x = n.pos.x / M, z = n.pos.z / M; if (Math.hypot(x - me.x, z - me.z) > 60) continue; g.fillStyle = '#e03a2e'; g.beginPath(); g.arc(x, z, 2 / ppm, 0, Math.PI * 2); g.fill(); S.drawn.marks++; }
    if (W.ship && W.mode !== 'fly') { g.fillStyle = '#e6eaf2'; g.strokeStyle = '#1a1f2a'; g.lineWidth = 1 / ppm; g.beginPath(); g.arc(W.ship.position.x / M, W.ship.position.z / M, 3 / ppm, 0, Math.PI * 2); g.fill(); g.stroke(); }
    if (W.props) for (const it of W.props.items.values()) { if (!it.src || !it.src.kind && !it.src.ride) continue; g.fillStyle = '#c8901c'; g.beginPath(); g.arc(it.x / M, it.z / M, 2.5 / ppm, 0, Math.PI * 2); g.fill(); }
    if (W.remotes) for (const r of W.remotes.values()) { const x = r.pos.x / M, z = r.pos.z / M, rh = r.tgt && r.tgt.m === 'fly' ? Math.atan2(r.tgt.v ? r.tgt.v[0] : 0, r.tgt.v ? r.tgt.v[2] : 1) : r.heading || 0;
      g.save(); g.translate(x, z); g.rotate(Math.PI - rh); g.fillStyle = '#2f7fe0'; g.strokeStyle = '#0b1a3a'; g.lineWidth = 1.2 / ppm; const s = (mini ? 6 : 8) / ppm; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, s * 0.8); g.lineTo(0, s * 0.35); g.lineTo(-s * 0.7, s * 0.8); g.closePath(); g.fill(); g.stroke(); g.restore();
      { g.fillStyle = '#0b1a3a'; g.font = `700 ${(mini ? 9 : 11) / ppm}px -apple-system, Segoe UI, Helvetica, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillText(r.name || r.id.slice(0, 6), x, z - 9 / ppm); } S.drawn.marks++; }
    g.save(); g.translate(me.x, me.z); g.rotate(Math.PI - h); g.fillStyle = '#2fbf3f'; g.strokeStyle = '#0b2a10'; g.lineWidth = 1.2 / ppm; const s = (mini ? 7 : 9) / ppm; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, s * 0.8); g.lineTo(0, s * 0.35); g.lineTo(-s * 0.7, s * 0.8); g.closePath(); g.fill(); g.stroke(); g.restore();
  }
  S.drawMini = () => {
    const c = mini, w = 118; size(c, w, w); const g = c.getContext('2d'), me = player(), ppm = w / 220;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, w); g.save(); g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 1, 0, Math.PI * 2); g.clip();
    g.fillStyle = W.night > 0.5 ? '#1c2230' : '#8fb37a'; g.fillRect(0, 0, w, w);
    g.translate(w / 2, w / 2); g.scale(ppm, ppm); g.translate(-me.x, -me.z);
    layers(g, ppm, { x0: me.x - 120, x1: me.x + 120, z0: me.z - 120, z1: me.z + 120 }, false); marks(g, ppm, true); g.restore();
    g.strokeStyle = 'rgba(26,31,42,.55)'; g.lineWidth = 2; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 1, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#d8382e'; g.font = '800 11px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText('N', w / 2, 3);
  };
  S.drawBig = () => {
    if (!S.open) return; const c = bc, w = innerWidth, h = innerHeight; size(c, w, h); const g = c.getContext('2d'), v = S.view;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = W.night > 0.5 ? '#1c2230' : '#9dbb8c'; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2); g.scale(v.ppm, v.ppm); g.translate(-v.cx, -v.cz); S.names = [];
    layers(g, v.ppm, { x0: v.cx - w / 2 / v.ppm, x1: v.cx + w / 2 / v.ppm, z0: v.cz - h / 2 / v.ppm, z1: v.cz + h / 2 / v.ppm }, true); marks(g, v.ppm, false); g.restore();
    const bar = [10, 20, 50, 100, 200, 500].find(m => m * v.ppm > 60) || 500; g.fillStyle = 'rgba(26,31,42,.8)'; g.fillRect(14, h - 30, bar * v.ppm, 3); g.font = '600 11px ui-monospace, Menlo, monospace'; g.textAlign = 'left'; g.textBaseline = 'bottom'; g.fillText(bar + ' m', 14, h - 34);
    g.fillStyle = '#d8382e'; g.font = '800 14px ui-monospace, Menlo, monospace'; g.textAlign = 'right'; g.textBaseline = 'top'; g.fillText('N', w - 16, 12 + (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0));
  };
  S.toWorld = (px, py) => { const v = S.view; return { x: v.cx + (px - innerWidth / 2) / v.ppm, z: v.cz + (py - innerHeight / 2) / v.ppm }; };
  S.setOpen = on => { S.open = on; big.classList.toggle('open', on); if (on) { const me = player(); S.view.cx = me.x; S.view.cz = me.z; S.view.ppm = Math.max(0.35, Math.min(innerWidth, innerHeight) / 700); S.drawBig(); } };
  S.setWaypoint = (x, z) => { S.waypoint = x == null ? null : { x, z }; if (onWaypoint) onWaypoint(S.waypoint); S.drawMini(); S.drawBig(); return S.waypoint; };
  /** The nearest road within `within` metres of a point (metres), or null. */
  S.nearestRoad = (x, z, within = 12) => { let best = null; for (const r of (W.win && W.win.roads) || []) { if (r.kind === 'river') continue; const half = (r.w || 3) / 2 + within; for (let i = 0; i < r.pts.length - 1; i++) { const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2)), d = Math.hypot(x - a.x - dx * t, z - a.z - dz * t) - (r.w || 3) / 2; if (d < within && (!best || d < best.d)) best = { d, r }; } } return best ? best.r : null; };
  S.buildingAt = (x, z) => { for (const b of (W.win && W.win.buildings) || []) { let inside = false; const ring = b.ring; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const p = ring[i], q = ring[j]; if ((p.z > z) !== (q.z > z) && x < (q.x - p.x) * (z - p.z) / (q.z - p.z) + p.x) inside = !inside; } if (inside) return b; } return null; };
  S.compass = () => { let fx, fz; if (W.mode === 'walk') { const y = W.rig.cam.yaw; fx = -Math.sin(y); fz = -Math.cos(y); } else { const d = W.camera.getWorldDirection(new THREE.Vector3()); fx = d.x; fz = d.z; } const L = Math.hypot(fx, fz) || 1; fx /= L; fz /= L; const rx = -fz, rz = fx; return Math.atan2(-rz, -fz) * 180 / Math.PI; };   // north = -z: its angle clockwise from the view's forward
  S.step = dt => { S.t += dt; if ((S.acc += dt) < 0.25) return; S.acc = 0; S.drawMini(); if (S.open) S.drawBig(); };
  S.stats = () => ({ open: S.open, drawn: S.drawn, names: S.names.slice(0, 12), waypoint: S.waypoint, view: { ...S.view }, mini: [mini.width, mini.height] });
  // the full map's pointers: drag pans, two fingers pinch, a tap sets the waypoint, a long press goes there
  const PT = new Map(); let pinch0 = null, pressT = 0, moved = 0;
  bc.addEventListener('pointerdown', e => { bc.setPointerCapture(e.pointerId); PT.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY }); if (PT.size === 1) { pressT = performance.now(); moved = 0; } else pinch0 = null; });
  bc.addEventListener('pointermove', e => { const p = PT.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; moved = Math.max(moved, Math.hypot(p.x - p.x0, p.y - p.y0));
    if (PT.size === 1) { S.view.cx -= dx / S.view.ppm; S.view.cz -= dy / S.view.ppm; S.drawBig(); }
    else if (PT.size === 2) { const [a, b] = [...PT.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 == null) pinch0 = { d, ppm: S.view.ppm }; else { S.view.ppm = Math.max(0.2, Math.min(6, pinch0.ppm * d / pinch0.d)); S.drawBig(); } } });
  const up = e => { const p = PT.get(e.pointerId); if (!p) return; PT.delete(e.pointerId); if (PT.size) { pinch0 = null; return; } const age = performance.now() - pressT; if (moved < 10) { const w = S.toWorld(p.x, p.y); if (age > 500) { if (onGo) onGo(w); } else S.setWaypoint(w.x, w.z); } };
  bc.addEventListener('pointerup', up); bc.addEventListener('pointercancel', up);
  bc.addEventListener('wheel', e => { e.preventDefault(); S.view.ppm = Math.max(0.2, Math.min(6, S.view.ppm * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); S.drawBig(); }, { passive: false });
  big.querySelector('button').addEventListener('click', () => S.setOpen(false));
  mini.addEventListener('click', () => S.setOpen(true));
  window.addEventListener('resize', () => { if (S.open) S.drawBig(); });
  return S;
}
window.Map2D = { create, roadColour, COVER_C };
})();
