/* world/kits.js — real LEGO sets as props: the UCS AT-ST, the mini AT-AT, the mini X-wing, the mini Imperial shuttle.

   A kit is a flattened set (assembly-paths/<label>.json: one placement per part, y down)
   and its part pack (<label>-full.mpd.txt). Both are fetched once, the first time the
   kit is needed. The placements are split into groups by position (legs, body), each
   group written as a sub-model at its pivot, parsed once through the page's loader and
   merged into one vertex-coloured geometry per group. A built kit is a small tree of
   meshes on their pivots, scaled to the world and turned to face south like every
   vehicle here, so its legs can swing and it costs a few draw calls, not a thousand. */
(function () {
'use strict';
const V1 = new THREE.Vector3();
const KITS = {
  atst: { label: 'AT-ST', scale: 0.34, yaw: 0, kind: 'atst', name: 'AT-ST', drop: (x, y, z) => x < -100,
    groups: [{ name: 'leg-r', pick: (x, y, z) => x < 120 && y > -690, pivot: [45, -640, 40] }, { name: 'leg-l', pick: (x, y, z) => x > 280 && y > -690, pivot: [390, -640, 40] }, { name: 'body' }] },
  atat: { label: 'AT-AT-MINI', scale: 3.7, yaw: 0, kind: 'atat', name: 'AT-AT',
    groups: [['leg-fl', 30, -50], ['leg-fr', -30, -50], ['leg-rl', 30, 50], ['leg-rr', -30, 50]].map(([n, lx, lz]) => ({ name: n, pick: (x, y, z) => Math.abs(x - lx) < 14 && Math.abs(z - lz) < 14 && y > 30, pivot: [lx, 32, lz] })).concat([{ name: 'body' }]) },
  xwing: { label: 'XWING-MINI', scale: 2.4, yaw: Math.PI, kind: 'plane', name: 'X-wing', groups: [{ name: 'body' }] },
  shuttle: { label: 'SHUTTLE-MINI', scale: 3, yaw: 0, kind: 'craft', name: 'shuttle', groups: [{ name: 'body' }] },
};
let K = null;
function create({ props, fetchText }) {
  K = { props, fetchText: fetchText || (u => fetch(u).then(r => r.text())), templates: new Map(), fetched: 0, parsed: 0 };
  return K;
}
/** Merge every mesh under a group into one geometry in the group's own frame, colours from the materials. */
function merge(root) {
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), P = [], N = [], C = [], v = new THREE.Vector3();
  root.traverse(o => {
    if (!o.isMesh) return; const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld), nm = new THREE.Matrix3().getNormalMatrix(m);
    const pos = g.attributes.position, nor = g.attributes.normal, mats = Array.isArray(o.material) ? o.material : [o.material], groups = g.groups && g.groups.length ? g.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
    for (const gr of groups) { const mat = mats[gr.materialIndex] || mats[0], c = mat && mat.color ? mat.color : new THREE.Color(0.5, 0.5, 0.5); const end = gr.count === Infinity ? pos.count : Math.min(pos.count, gr.start + gr.count);
      for (let i = gr.start; i < end; i++) { v.fromBufferAttribute(pos, i).applyMatrix4(m); P.push(v.x, v.y, v.z); if (nor) { v.fromBufferAttribute(nor, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); } else N.push(0, 1, 0); C.push(c.r, c.g, c.b); } }
  });
  if (!P.length) return null;
  // weld: vertices on a 1.5 LDU grid, a triangle that collapses or repeats goes, so a thousand studs cost what they look like
  const q = 2.5, seen = new Set(), P2 = [], N2 = [], C2 = [], e1 = new THREE.Vector3(), e2 = new THREE.Vector3(); let dropped = 0;
  for (let t = 0; t < P.length; t += 9) { const key = []; const vs = [];
    for (let k = 0; k < 3; k++) { const x = Math.round(P[t + k * 3] / q) * q, y = Math.round(P[t + k * 3 + 1] / q) * q, z = Math.round(P[t + k * 3 + 2] / q) * q; vs.push([x, y, z]); key.push(x + ',' + y + ',' + z); }
    if (key[0] === key[1] || key[1] === key[2] || key[0] === key[2]) { dropped++; continue; }
    e1.set(vs[1][0] - vs[0][0], vs[1][1] - vs[0][1], vs[1][2] - vs[0][2]); e2.set(vs[2][0] - vs[0][0], vs[2][1] - vs[0][1], vs[2][2] - vs[0][2]); if (e1.cross(e2).length() < 6) { dropped++; continue; }   // slivers smaller than a few square LDU
    const sig = key.slice().sort().join('|'); if (seen.has(sig)) { dropped++; continue; } seen.add(sig);
    for (let k = 0; k < 3; k++) { P2.push(...vs[k]); N2.push(N[t + k * 3], N[t + k * 3 + 1], N[t + k * 3 + 2]); C2.push(C[t + k * 3], C[t + k * 3 + 1], C[t + k * 3 + 2]); } }
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); out.setAttribute('normal', new THREE.Float32BufferAttribute(N2, 3)); out.setAttribute('color', new THREE.Float32BufferAttribute(C2, 3));
  out.userData.dropped = dropped; out.computeBoundingBox(); out.computeBoundingSphere(); return out;
}
/** The template for a kit: fetched, split, parsed and merged once. */
function load(name) {
  const def = KITS[name]; if (!def || !K) return Promise.reject(new Error('no kit ' + name));
  if (K.templates.has(name)) return K.templates.get(name);
  const p = (async () => {
    const [json, pack] = await Promise.all([fetch(`./assembly-paths/${def.label}.json`).then(r => r.json()), K.fetchText(`./assembly-paths/${def.label}-full.mpd.txt`)]); K.fetched += 2;
    // the placements: dropped ones out, feet to y = 0, centred in x and z
    let rows = json.lines.map(l => { const t = l.trim().split(/\s+/); return { col: t[1], x: +t[2], y: +t[3], z: +t[4], rot: t.slice(5, 14).join(' '), part: t.slice(14).join(' ') }; }).filter(r => !(def.drop && def.drop(r.x, r.y, r.z)));
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity, yMax = -Infinity; for (const r of rows) { x0 = Math.min(x0, r.x); x1 = Math.max(x1, r.x); z0 = Math.min(z0, r.z); z1 = Math.max(z1, r.z); yMax = Math.max(yMax, r.y); }
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, feet = yMax;
    const taken = new Set(), main = [`0 FILE kit-${name}.ldr`, '0 !LDRAW_ORG Unofficial_Model'], subs = [], pivots = [];
    for (const g of def.groups) {
      const mine = rows.filter((r, i) => !taken.has(i) && (!g.pick || g.pick(r.x, r.y, r.z))); rows.forEach((r, i) => { if (mine.includes(r)) taken.add(i); });
      if (!mine.length) continue; const pv = g.pivot ? [g.pivot[0] - cx, g.pivot[1] - feet, g.pivot[2] - cz] : [0, 0, 0], file = `kit-${name}-${g.name}.ldr`;
      main.push(`1 16 ${pv[0]} ${pv[1]} ${pv[2]} 1 0 0 0 1 0 0 0 1 ${file}`); pivots.push({ name: g.name, pivot: pv });
      subs.push([`0 FILE ${file}`, '0 !LDRAW_ORG Unofficial_Model', ...mine.map(r => `1 ${r.col} ${(r.x - cx - pv[0]).toFixed(3)} ${(r.y - feet - pv[1]).toFixed(3)} ${(r.z - cz - pv[2]).toFixed(3)} ${r.rot} ${r.part}`)].join('\n'));
    }
    const text = [main.join('\n'), ...subs, pack].join('\n');
    const parsed = await K.props.parse(text, `kit-${name}.mpd`); K.parsed++;
    const groups = []; parsed.updateMatrixWorld(true);
    for (const child of parsed.children) { if (!child.isGroup) continue; const geometry = merge(child); if (!geometry) continue; const pv = pivots[groups.length] || { name: 'body', pivot: [0, 0, 0] }; groups.push({ name: pv.name, geometry, pivot: new THREE.Vector3(...pv.pivot), tris: geometry.attributes.position.count / 3 }); }
    if (!groups.length) throw new Error('kit ' + name + ' parsed to nothing');
    return { name, def, groups, parts: rows.length };
  })();
  K.templates.set(name, p); p.catch(() => K.templates.delete(name)); return p;
}
/** A fresh copy of a kit: meshes on their pivots, LDraw turned to the world, scaled, facing south. Feet at y = 0. */
async function build(name) {
  const t = await load(name), def = t.def;
  const outer = new THREE.Group(); outer.name = 'kit:' + name; const yawG = new THREE.Group(); yawG.rotation.y = def.yaw || 0; outer.add(yawG);
  const flip = new THREE.Group(); flip.rotation.x = Math.PI; flip.scale.setScalar(def.scale); yawG.add(flip);
  for (const g of t.groups) { const grp = new THREE.Group(); grp.name = g.name; grp.position.copy(g.pivot); const mesh = new THREE.Mesh(g.geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .55, metalness: .05, side: THREE.DoubleSide })); mesh.material.fog = true; mesh.name = 'kit:' + name + ':' + g.name; grp.add(mesh); flip.add(grp); }
  outer.userData.kit = name; outer.userData.kind = def.kind;
  return outer;
}
function stats() { return K ? { fetched: K.fetched, parsed: K.parsed, templates: [...K.templates.keys()] } : null; }
window.Kits = { KITS, create, load, build, merge, stats };
})();
