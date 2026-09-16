/* world/lamps.js — street lamps along the roads, lit by the sky's night.

   Every 28 m along a road wide enough for wheels, alternating sides at the
   sidewalk's edge: a dark post with a head (instanced), a warm additive glow
   at the head (points) and a pool of light on the ground (flat additive
   quads). Nothing is a real light: the GPU cost is three draw calls whatever
   the count, and the night factor from sky.js sets how bright it all is. */
(function () {
'use strict';
const CAP = 900, EVERY = 28, POOL_R = 6, DEFAULT_LIGHTS = { lamp: 0xffc070, pool: 0xffb860, every: EVERY };
function radial() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
}
function create({ scene, M }) {
  const L = { scene, M, group: null, n: 0, night: 0, tex: radial(), spots: [] };
  L.drop = () => { if (!L.group) return; scene.remove(L.group); L.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && !o.isPoints) o.material.dispose(); }); L.group = null; L.n = 0; L.spots = []; };
  /** Place the lamps for a set of roads (metres) on a ground G. foot: the set of kinds that are not for wheels. */
  L.lay = (G, roads, foot, lights) => {
    L.drop(); const spots = [], LI = { ...DEFAULT_LIGHTS, ...(lights || {}) }, EVERY = LI.every || 28; L.lights = LI;
    for (const r of roads || []) {
      const w = r.w || 5; if (!r.pts || r.pts.length < 2 || w < 4 || (foot && foot.has(r.kind)) || r.kind === 'cycleway' || r.kind === 'river' || r.bridge) continue;
      let acc = EVERY * 0.5, side = 1;
      for (let i = 0; i < r.pts.length - 1 && spots.length < CAP; i++) {
        const a = r.pts[i], b = r.pts[i + 1], dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz); if (len < 0.1) continue;
        const ux = dx / len, uz = dz / len, nx = -uz, nz = ux;
        for (let s = acc; s < len; s += EVERY) { const off = (w / 2 + 0.9) * side; spots.push({ x: a.x + ux * s + nx * off, z: a.z + uz * s + nz * off, hx: -nx * side, hz: -nz * side }); side = -side; if (spots.length >= CAP) break; }
        acc = ((acc - len) % EVERY + EVERY) % EVERY;
      }
    }
    L.spots = spots; L.n = spots.length; if (!spots.length) return 0;
    const group = new THREE.Group(); group.name = 'lamps'; L.group = group;
    const postG = new THREE.CylinderGeometry(2.2, 3, 4 * M, 6); postG.translate(0, 2 * M, 0);
    const headG = new THREE.BoxGeometry(14, 7, 10); headG.translate(0, 4 * M, 0);
    const posts = new THREE.InstancedMesh(postG, new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: .7, metalness: .2 }), spots.length), heads = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: .6, emissive: LI.lamp, emissiveIntensity: 0 }), spots.length);
    posts.name = 'lampPosts'; heads.name = 'lampHeads'; posts.frustumCulled = heads.frustumCulled = false;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
    const gp = new Float32Array(spots.length * 3), PP = [], UV = [];
    spots.forEach((s, i) => {
      const y = G.hM(s.x, s.z) * M, x = s.x * M, z = s.z * M, yaw = Math.atan2(s.hx, s.hz);
      q.setFromAxisAngle(up, yaw); p.set(x, y, z); m.compose(p, q, one); posts.setMatrixAt(i, m);
      p.set(x + s.hx * 0.55 * M, y, z + s.hz * 0.55 * M); m.compose(p, q, one); heads.setMatrixAt(i, m);   // the head leans over the road
      gp[3 * i] = x + s.hx * 0.55 * M; gp[3 * i + 1] = y + 4 * M - 3; gp[3 * i + 2] = z + s.hz * 0.55 * M;
      const cx = x + s.hx * 1.2 * M, cz = z + s.hz * 1.2 * M, R = POOL_R * M, corners = [[-R, -R], [R, -R], [R, R], [-R, R]].map(([dx, dz]) => [cx + dx, G.hM((cx + dx) / M, (cz + dz) / M) * M + 0.35 * M, cz + dz]);
      for (const k of [0, 2, 1, 0, 3, 2]) { PP.push(...corners[k]); UV.push(k === 0 ? 0 : k === 1 ? 1 : k === 2 ? 1 : 0, k < 2 ? 0 : 1); }
    });
    posts.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true; group.add(posts); group.add(heads);
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
    const glow = new THREE.Points(gg, new THREE.PointsMaterial({ map: L.tex, size: 3.2 * M, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: LI.lamp, opacity: 0, fog: false })); glow.name = 'lampGlow'; glow.frustumCulled = false; group.add(glow);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); pg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
    const pools = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ map: L.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: LI.pool, opacity: 0, fog: false, side: THREE.DoubleSide })); pools.name = 'lampPools'; pools.frustumCulled = false; pools.renderOrder = 2; group.add(pools);
    L.parts = { posts, heads, glow, pools }; scene.add(group); L.setNight(L.night); return spots.length;
  };
  L.setNight = n => { L.night = n; if (!L.parts) return; L.parts.glow.material.opacity = n; L.parts.pools.material.opacity = 0.7 * n; L.parts.heads.material.emissiveIntensity = 1.6 * n; L.parts.glow.visible = n > 0.02; L.parts.pools.visible = n > 0.02; };
  L.setLights = l => { L.lights = { ...DEFAULT_LIGHTS, ...(l || {}) }; if (!L.parts) return; L.parts.glow.material.color.set(L.lights.lamp); L.parts.pools.material.color.set(L.lights.pool); L.parts.heads.material.emissive.set(L.lights.lamp); };
  L.stats = () => ({ lamps: L.n, lamp: L.lights ? new THREE.Color(L.lights.lamp).getHexString() : null, every: L.lights ? L.lights.every : null, night: +L.night.toFixed(2), glow: L.parts ? +L.parts.glow.material.opacity.toFixed(2) : 0, pools: L.parts ? +L.parts.pools.material.opacity.toFixed(2) : 0, visible: !!(L.parts && L.parts.glow.visible) });
  /** A point on the ground near (x, z) lit by a lamp: how much (0..1), for anyone who wants to stand in the light. */
  L.litAt = (x, z) => { let best = 0; for (const s of L.spots) { const d = Math.hypot(s.x * M - x, s.z * M - z) / M; if (d < POOL_R) best = Math.max(best, 1 - d / POOL_R); } return best * L.night; };
  return L;
}
window.Lamps = { create, radial, CAP, EVERY };
})();
