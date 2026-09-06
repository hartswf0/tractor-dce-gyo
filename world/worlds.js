/* world/worlds.js — Star Wars planets laid over the real Earth.

   A preset recolours the sky, fog, light, the ground (by height and slope)
   and the city's brick palette. Nothing is refetched: the same footprints and
   the same relief, under another sun. */
(function () {
'use strict';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const moss = (h, sl, x, z, lo, hi) => { const t = clamp((h - lo) / Math.max(20, hi - lo), 0, 1); if (sl > .52) return [.47, .45, .42]; return [lerp(.40, .56, t), lerp(.47, .56, t), lerp(.30, .40, t)]; };
const PRESETS = {
  earth: { name: 'Earth', sky: 0xb8cbd8, fog: [0xc9d4d2, 30, 900], hemi: [0xffffff, 0xd8d8d8, 1.35], sun: [0xffffff, 1.25, [2, 3, 2]], imagery: true, paint: moss,
    palette: { walls: [19, 4, 15, 72, 379, 70, 28, 84], roofs: [320, 72, 308, 71], frame: 15, pane: 0, plinth: 72, door: 70 } },
  hoth: { name: 'Hoth', sky: 0xdfe8f2, fog: [0xe6edf5, 20, 600], hemi: [0xffffff, 0xcfd8e6, 1.5], sun: [0xfff4e6, 1.1, [1, 2, 3]], imagery: false,
    paint: (h, sl) => { const s = clamp(sl * 1.2, 0, 1); return [lerp(.93, .62, s), lerp(.95, .70, s), lerp(.98, .82, s)]; },
    palette: { walls: [15, 71, 15, 15, 71], roofs: [15, 71], frame: 72, pane: 0, plinth: 71, door: 72 } },
  tatooine: { name: 'Tatooine', sky: 0xe9d9b6, fog: [0xead9b8, 40, 1200], hemi: [0xfff0d0, 0xc8a870, 1.4], sun: [0xfff2d8, 1.4, [3, 2, 1]], imagery: false,
    paint: (h, sl, x, z, lo, hi) => { const t = clamp((h - lo) / Math.max(20, hi - lo), 0, 1); if (sl > .5) return [.55, .42, .30]; return [lerp(.80, .70, t), lerp(.68, .56, t), lerp(.45, .36, t)]; },
    palette: { walls: [19, 28, 84, 19, 19], roofs: [19, 28], frame: 70, pane: 0, plinth: 28, door: 70 } },
  endor: { name: 'Endor', sky: 0xb9c9b0, fog: [0xb4c4aa, 20, 500], hemi: [0xe8f0d8, 0x304028, 1.2], sun: [0xfff8e0, 1.0, [2, 3, 1]], imagery: false,
    paint: (h, sl, x, z, lo, hi) => { const t = clamp((h - lo) / Math.max(20, hi - lo), 0, 1), j = (Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1; return [lerp(.14, .22, t) + j * .03, lerp(.30, .40, t) + j * .03, lerp(.12, .16, t)]; },
    palette: { walls: [70, 28, 308, 70], roofs: [2, 28, 288], frame: 19, pane: 0, plinth: 308, door: 28 } },
  deathstar: { name: 'Death Star', sky: 0x0b0d12, fog: [0x0b0d12, 60, 900], hemi: [0x5a6a8a, 0x101418, 0.9], sun: [0xc8d8ff, 0.8, [1, 3, 2]], imagery: false,
    paint: (h, sl, x, z) => { const gx = ((x % 10) + 10) % 10, gz = ((z % 10) + 10) % 10; if (gx < 0.5 || gz < 0.5) return [.55, .58, .62]; return [.16, .17, .19]; },
    palette: { walls: [72, 72, 71, 72], roofs: [72, 71], frame: 71, pane: 46, plinth: 0, door: 71 } },
};
function apply(name, { scene, G, city, lights }) {
  const p = PRESETS[name] || PRESETS.earth, lin = c => new THREE.Color(c).convertSRGBToLinear();
  scene.background = new THREE.Color(p.sky); scene.fog.color.copy(lin(p.fog[0])); scene.fog.near = p.fog[1] * G.M; scene.fog.far = p.fog[2] * G.M;
  lights.hemi.color.copy(lin(p.hemi[0])); lights.hemi.groundColor.copy(lin(p.hemi[1])); lights.hemi.intensity = p.hemi[2] / Math.PI;
  lights.sun.color.copy(lin(p.sun[0])); lights.sun.intensity = p.sun[1] / Math.PI; lights.sun.position.set(...p.sun[2]).multiplyScalar(1000);
  if (city) city.setPalette(p.palette);
  return p;
}
window.Worlds = { PRESETS, apply, moss };
})();
