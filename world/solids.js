/* world/solids.js — a laid model is solid: what its pieces stand in, a figure, a player or a cart cannot walk through.

   A model built by tools/model.js carries its pieces in play/models/<name>.json (stud cells x, z, w, d; y and hp in
   plates). Laid as a donor (world/donors.js, world/film.js layDonor) it is centred on its footprint and turned by its
   heading; here the same placement is applied to a grid of stud cells, each marked blocked where some piece occupies
   the band a body moves through: from a knee (three plates, so floors, rugs, path and water are walked on) up to a
   head (eleven plates). Open things are passed through: a door frame (60596) is the way in.

   Solids.fromModel(json, { x, z, heading, M }) → { push(pos, r), boxes(x, z, r, y0), blocked(x, z) } in world LDU.
   push moves a point (a figure's feet) out of every blocked cell within r; boxes gives the cells near a point as
   Box3s for a vehicle's collider. */
(function () {
'use strict';
const OPEN = new Set(['60596', '30179', '60623']);   // door frames and doors: the way through
const KNEE = 3, HEAD = 11;                          // plates
function fromModel(json, o) {
  const M = o.M || 40, cellL = M / 2;              // a stud is half a metre
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const p of json.pieces) { x0 = Math.min(x0, p.x); z0 = Math.min(z0, p.z); x1 = Math.max(x1, p.x + p.w); z1 = Math.max(z1, p.z + p.d); }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, cells = new Set(), key = (i, j) => i + ',' + j;
  for (const p of json.pieces) {
    if (OPEN.has(p.part)) continue; const bottom = p.y, top = p.y + (p.hp || 3);
    if (top <= KNEE || bottom >= HEAD) continue;
    for (let i = p.x; i < p.x + p.w; i++) for (let j = p.z; j < p.z + p.d; j++) cells.add(key(i, j));
  }
  const h = ((o.heading || 0) % 360 + 360) % 360, flip = h === 180 ? 1 : -1;   // heading 180 reads straight (stud x east, stud z south); heading 0 negates both
  const toStud = (wx, wz) => [cx + flip * (wx - o.x) / cellL, cz + flip * (wz - o.z) / cellL];
  const toWorld = (sx, sz) => [o.x + flip * (sx - cx) * cellL, o.z + flip * (sz - cz) * cellL];
  const blocked = (wx, wz) => { const [sx, sz] = toStud(wx, wz); return cells.has(key(Math.floor(sx), Math.floor(sz))); };
  /** Push a point out of the blocked cells within r (world LDU); true when it moved. */
  function push(pos, r) {
    let moved = false;
    for (let pass = 0; pass < 3; pass++) {
      const [sx, sz] = toStud(pos.x, pos.z), rs = r / cellL; let hit = false;
      for (let i = Math.floor(sx - rs); i <= Math.floor(sx + rs); i++) for (let j = Math.floor(sz - rs); j <= Math.floor(sz + rs); j++) {
        if (!cells.has(key(i, j))) continue;
        const nx = Math.max(i, Math.min(sx, i + 1)), nz = Math.max(j, Math.min(sz, j + 1)); let dx = sx - nx, dz = sz - nz, d = Math.hypot(dx, dz);
        if (d >= rs) continue;
        if (d < 1e-6) { const l = sx - i, rr = i + 1 - sx, t = sz - j, b = j + 1 - sz, m = Math.min(l, rr, t, b); dx = m === l ? -1 : m === rr ? 1 : 0; dz = m === t ? -1 : m === b ? 1 : 0; d = 0; }   // inside the cell: out by the nearest side
        const k = (rs - d) / (Math.hypot(dx, dz) || 1), nsx = sx + dx * k, nsz = sz + dz * k, [wx, wz] = toWorld(nsx, nsz); pos.x = wx; pos.z = wz; hit = true; moved = true;
        break;
      }
      if (!hit) break;
    }
    return moved;
  }
  /** The blocked cells within r of a point, as boxes a vehicle's collider stops at. */
  function boxes(wx, wz, r, y0) {
    const out = [], [sx, sz] = toStud(wx, wz), rs = r / cellL + 1;
    for (let i = Math.floor(sx - rs); i <= Math.floor(sx + rs); i++) for (let j = Math.floor(sz - rs); j <= Math.floor(sz + rs); j++) {
      if (!cells.has(key(i, j))) continue; const a = toWorld(i, j), b = toWorld(i + 1, j + 1);
      out.push(new THREE.Box3(new THREE.Vector3(Math.min(a[0], b[0]), (y0 || 0), Math.min(a[1], b[1])), new THREE.Vector3(Math.max(a[0], b[0]), (y0 || 0) + 2.4 * M, Math.max(a[1], b[1]))));
    }
    return out;
  }
  return { push, boxes, blocked, toStud, toWorld, cellL, cells: cells.size, centre: [cx, cz] };
}
window.Solids = { fromModel };
})();
