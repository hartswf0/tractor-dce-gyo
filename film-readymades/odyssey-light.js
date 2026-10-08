/* film-readymades/odyssey-light.js — practical light for an interior at night (window.OdysseyLight): the hearth and the torches as
   warm point lights that flicker on the drawing, a dim blue night that comes in through the clerestory and the open doors, and the
   few things of a set that move on the take's clock (a door swung on its hinge, the arrow slid down the axe line, two builds of a
   fire swapped). A classic script on the page's global THREE (r128); the take (odyssey-take.js, its [light] hooks) fetches it when
   the keyframes carry a `hall` section, and calls frame(t) every drawing and every time the cinematographer poses the cast.

   The look is a file (odyssey/metis/looks/<name>.json, `hall.look` in the keyframes) in the kit's own frame (LDraw units: x, yup, z),
   turned into the location's frame here with the location's centre and scale (as build_odyssey.py places every piece):
     lights   [{name, at: [x, yup, z], color, intensity, distance, decay, flicker (0-1), shadow}]  warm practicals
     night    {sky, ground, intensity}                          a hemisphere: what of the night is everywhere in the room
     moon     {at, to, color, intensity, angle, distance}        a spot down through the smoke hole
     door     {at, to, color, intensity, angle, distance}        a spot in through the great doors, as open as the doors are
     flames   [{a: label, b: label}]                             two builds of the same fire, swapped on the drawing
     glow     {labels: [...], color, intensity}                  the flames' bricks lit from inside (emissive), with the flicker
     exposure, dim                                               (dim: the location's own day lights, multiplied)
   The keyframes' `hall` section sets the clock (seconds on the take's clock, 'cut' or 'full' as the take plays):
     look     the look file
     doors    {leaves: [{label, hinge: [x, z], open: degrees}], shut: [t0, t1]}   open before t0, swung shut by t1 on the drawing
     slides   [{label, from: [dx, dy, dz] (kit units), t0, t1, hideBefore}]        a piece carried to its built place
     show     [{label, from, to}]                                                  a piece seen only between two times
   Everything is a pure function of t: a frame drawn offline at t is the frame the player shows at t. The drawing is 1/12 s. */
(function () {
'use strict';
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
function hash(n) { let h = (n * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; }
/* a flicker: two octaves of value noise on the drawing (12 a second), so a flame jumps from drawing to drawing as a cut-out would */
function flick(seed, d) { const a = hash(seed * 977 + d), b = hash(seed * 977 + Math.floor(d / 3) + 5e5); return 0.6 * a + 0.4 * b; }

function stage(o) {
  const { THREE, scene, renderer, spec, piece } = o, A = o.asset, H = spec.hall || {}, L = o.look || {};
  const c = A.center || [0, 0, 0], s = A.scale || 1, V3 = THREE.Vector3;
  const P = p => new V3((p[0] - c[0]) * s, (p[1] - c[1]) * s, (-p[2] - c[2]) * s);   /* kit (x, yup, z) to the location's frame */
  const fps = o.fps || 12, drawing = t => Math.floor(t * fps + 1e-6);
  const made = [], stats = { lights: 0, spots: 0, shadows: 0, pieces: {} };
  const add = x => { x.userData.kf = true; x.userData.hall = true; scene.add(x); made.push(x); return x; };
  /* the practicals */
  const lights = (L.lights || []).map((l, i) => { const pl = add(new THREE.PointLight(l.color || '#ff9a40', l.intensity ?? 1.5, (l.distance ?? 600) * s, l.decay ?? 1.6));
    pl.position.copy(P(l.at)); if (l.shadow) { pl.castShadow = true; pl.shadow.mapSize.set(l.shadow === true ? 512 : l.shadow, l.shadow === true ? 512 : l.shadow); pl.shadow.bias = -0.003; pl.shadow.camera.near = 2; pl.shadow.camera.far = (l.distance ?? 600) * s; stats.shadows++; }
    stats.lights++; return { l, pl, i0: pl.intensity, home: pl.position.clone(), seed: i + 1 }; });
  if (L.night) { const h = add(new THREE.HemisphereLight(L.night.sky || '#2a3a66', L.night.ground || '#1a120c', L.night.intensity ?? 0.25)); }
  const spot = d => { if (!d) return null; const sp = add(new THREE.SpotLight(d.color || '#7f9cff', d.intensity ?? 1, (d.distance ?? 900) * s, (d.angle ?? 30) * Math.PI / 180, d.penumbra ?? 0.6, d.decay ?? 1));
    sp.position.copy(P(d.at)); sp.target.position.copy(P(d.to)); scene.add(sp.target); made.push(sp.target); stats.spots++; return { d, sp, i0: sp.intensity }; };
  const moon = spot(L.moon), door = spot(L.door);
  /* the moving pieces, found by their exact label; each remembers its built place */
  const meshes = new Map(), restore = new Map();
  const get = label => { if (!meshes.has(label)) { const m = piece(label); meshes.set(label, m ? { m, p: m.position.clone(), q: m.quaternion.clone() } : null); stats.pieces[label] = !!m; } return meshes.get(label); };
  const leaves = ((H.doors || {}).leaves || []).map(l => ({ l, g: get(l.label), hinge: P([l.hinge[0], 0, l.hinge[1]]) }));
  /* the flames' bricks: trans-orange and trans-yellow are the player's glass (a child mesh at 0.2 opacity); a fire's own glass is
     made its own material, nearly opaque and lit from inside, so the flame reads as flame in the dark and not as a ghost of one */
  const glowMats = [];
  for (const g of ((L.glow || {}).labels || []).map(get).filter(Boolean)) g.m.traverse(o => { if (!o.isMesh || !o.material) return;
    const ms = [].concat(o.material).map(m => { const c = m.clone(); if (c.transparent) { c.opacity = L.glow.opacity ?? 0.85; c.depthWrite = false; } return c; });
    o.material = Array.isArray(o.material) ? ms : ms[0]; for (const m of ms) if (m.emissive) glowMats.push(m); });
  function doorShut(t) { const d = H.doors; if (!d || !d.shut) return 1; const [t0, t1] = d.shut; if (t <= t0) return 0; if (t >= t1) return 1;
    /* the leaves swing on the drawing, eased in and out: a door pushed shut */
    const q = drawing(t) / fps; return sm((q - t0) / Math.max(1e-3, t1 - t0)); }
  function frame(t) {
    const d = drawing(t);
    /* the flicker: each practical its own, the hearth slower and deeper; a flame's light also sways a little where it stands */
    let fire = 0;
    for (const x of lights) { const f = flick(x.seed, d), amp = x.l.flicker ?? 0.25; x.pl.intensity = x.i0 * (1 - amp + 2 * amp * f);
      const sw = (x.l.sway ?? 2) * s; x.pl.position.set(x.home.x + (hash(x.seed * 31 + d) - 0.5) * sw, x.home.y + (hash(x.seed * 57 + d) - 0.5) * sw, x.home.z + (hash(x.seed * 83 + d) - 0.5) * sw); fire += f; }
    fire = lights.length ? fire / lights.length : 0.5;
    /* two builds of each fire, swapped on the drawing (never the same one three drawings running) */
    for (const fl of L.flames || []) { const a = get(fl.a), b = get(fl.b); const pick = hash((fl.seed || 7) * 131 + Math.floor(d / (fl.every || 1))) < 0.5; if (a) a.m.visible = pick; if (b) b.m.visible = !pick; }
    for (const m of glowMats) { m.emissive.set(L.glow.color || '#ff7a1a'); m.emissiveIntensity = (L.glow.intensity ?? 0.6) * (0.75 + 0.5 * fire); }
    /* the doors: open, then swung shut on their hinges */
    const u = doorShut(t);
    for (const lf of leaves) { if (!lf.g) continue; const ang = (lf.l.open ?? 90) * Math.PI / 180 * (1 - u), q = new THREE.Quaternion().setFromAxisAngle(new V3(0, 1, 0), ang);
      lf.g.m.quaternion.copy(lf.g.q).premultiply(q); lf.g.m.position.copy(lf.g.p).sub(lf.hinge).applyQuaternion(q).add(lf.hinge); lf.g.m.updateMatrixWorld(true); }
    if (door) { door.sp.intensity = door.i0 * (1 - u); door.sp.userData.off = u >= 1; }   /* shut: the night at the doors is out (and not paid for) */
    if (moon) moon.sp.intensity = moon.i0 * (0.9 + 0.1 * hash(991 + Math.floor(d / 24)));
    /* slides: a piece carried along a line to its built place between t0 and t1, on the drawing (the arrow down the axes) */
    for (const sl of H.slides || []) { const g = get(sl.label); if (!g) continue; const q = drawing(t) / fps;
      if (sl.hideBefore !== false && q < (sl.showFrom ?? sl.t0)) { g.m.visible = false; continue; } g.m.visible = true;
      const k = q >= sl.t1 ? 1 : Math.max(0, (q - sl.t0) / Math.max(1e-3, sl.t1 - sl.t0)), w = sl.ease === false ? k : 1 - (1 - k) * (1 - k);
      const f = sl.from || [0, 0, 0]; g.m.position.copy(g.p).add(new V3(f[0] * s * (1 - w), f[1] * s * (1 - w), -f[2] * s * (1 - w))); g.m.updateMatrixWorld(true); }
    for (const sh of H.show || []) { const g = get(sh.label); if (!g) continue; g.m.visible = t >= (sh.from ?? -1e9) && t < (sh.to ?? 1e9); }
    for (const lb of H.hide || []) { const g = get(lb); if (g) g.m.visible = false; }
    /* a dev still's override (tools/metis/hall_dev.js): pieces hidden or shown and the practicals off for one drawing, then put back */
    for (const [g, v] of restore) g.m.visible = v; restore.clear();
    const ov = window.__hallOverride;
    for (const x of made) if (x.isLight) x.visible = !(ov && ov.noLight) && !x.userData.off;
    if (ov) for (const [list, v] of [[ov.hide || [], false], [ov.show || [], true]]) for (const lb of list) { const g = get(lb); if (g) { restore.set(g, g.m.visible); g.m.visible = v; } }
    if (stats.shadows) renderer.shadowMap.enabled = true;
  }
  function dispose() { for (const x of made) x.parent && x.parent.remove(x); for (const g of meshes.values()) if (g) { g.m.position.copy(g.p); g.m.quaternion.copy(g.q); g.m.visible = true; } }
  return { frame, dispose, stats: () => stats, P };
}
window.OdysseyLight = { stage, version: 1 };
})();
