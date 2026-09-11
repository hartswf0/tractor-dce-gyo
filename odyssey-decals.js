/* odyssey-decals.js — the halfworld's Odyssey faces on a LEGO head, for any three.js page.

   The decals are PNGs under world/faces/odyssey/<who>/<emotion>.png (tools/decals.js writes them from the halfworld's
   own drawing, dotted and masked to the print area of a 3626b head; index.json lists them). This module puts one on a
   head: a transparent cylinder segment 13.4 LDU out from the head's axis, 18 LDU tall from 2 below the crown, spanning
   the front 90 degrees, in the head part's own LDraw frame (y down, the face at -z). Word-to-Theatre uses it on the
   figure LDrawLoader builds: the head part sits at y -84 in that assembly, so the decal goes at y -84 + 11.

   import { listDecals, paintDecal, clearDecal } from './odyssey-decals.js';
   const index = await listDecals();                       // { faces: { penelope: { recognition: {file, ink}, ... } }, emotions: [...] }
   paintDecal(THREE, group, 'penelope', 'recognition', { y: -84 });   // adds (or replaces) the decal mesh on group */
export const BASE = './world/faces/odyssey/';
let indexPromise = null;
export function listDecals() { if (!indexPromise) indexPromise = fetch(BASE + 'index.json').then(r => r.json()); return indexPromise; }
export function decalUrl(who, emotion) { return `${BASE}${who}/${emotion || 'neutral'}.png`; }
const cache = new Map();
function texture(THREE, url) {
  if (cache.has(url)) return cache.get(url);
  const tex = new THREE.TextureLoader().load(url); tex.flipY = false;   // the head's frame is y down: the image's top lands at the crown
  tex.wrapS = THREE.RepeatWrapping; tex.repeat.x = -1; tex.offset.x = 1;   // the cylinder's u runs against x on its -z side
  if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  cache.set(url, tex); return tex;
}
/** The decal mesh on a group whose frame is the head part's (or the assembly's, with y the head's crown), replacing one already there. */
export function paintDecal(THREE, group, who, emotion, { y = 0, radius = 13.4, height = 18, degrees = 90, top = 2, name = 'odyssey-decal' } = {}) {
  clearDecal(group, name);
  const span = degrees * Math.PI / 180, geo = new THREE.CylinderGeometry(radius, radius, height, 24, 1, true, Math.PI - span / 2, span);
  const mat = new THREE.MeshBasicMaterial({ map: texture(THREE, decalUrl(who, emotion)), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = name; mesh.position.set(0, y + top + height / 2, 0); mesh.userData.decal = { who, emotion };
  group.add(mesh); return mesh;
}
export function clearDecal(group, name = 'odyssey-decal') { const old = group.getObjectByName(name); if (old) { old.parent.remove(old); old.geometry.dispose(); old.material.dispose(); } }
