/* world/donors.js — real LEGO sets as the ground a scene stands on: the forage's donors.

   The Odyssey forage (ODYSSEY-REAL-LDRAW-FORAGE v0.1) is a manifest of real, downloadable LDraw
   models whose geometry answers a scene's need: a pirate ship for the black Ithacan ship, a skull
   island for the Cyclops's cave, a king's castle for the hall at Ithaca, a forestmen's crossing for
   Circe's wood, a tree house for Calypso's grove, a blacksmith's yard for the swineherd's hut, a
   catamaran for the raft. A donor is fetched once from ./ldraw/models/, parsed through the page's
   loader with every subfile it carries, merged into one vertex-coloured geometry (kits.js's merge),
   and stood on the ground scaled to the figures: the rig here is two and a half minifigures tall,
   so a set at 2.5 is the size it would be to the figure that sits in it. A scene lists them as
   `donors: [{ name, set, x, z, heading, scale }]`; film.js lays them at setup and drops them at
   teardown, and a shot may point its camera at one by name. */
(function () {
'use strict';
const DONORS = {
  '6285': { file: '6285 - Black Seas Barracuda.mpd', name: 'the Black Seas Barracuda', target: 'the black Ithacan ship', scale: 2.5 },
  '6286': { file: '6286 - Skulls Eye Schooner.mpd', name: "the Skull's Eye Schooner", target: 'a second hull', scale: 2.5 },
  '6279': { file: '6279-1 - Skull Island.mpd', name: 'Skull Island', target: "the Cyclops's cave", scale: 2.5 },
  '6278': { file: '6278 6292 - Enchanted Island.mpd', name: 'the Enchanted Island', target: "Calypso's shore", scale: 2.5 },
  '6264': { file: '6264 - Forbidden Cove.mpd', name: 'the Forbidden Cove', target: "Phorcys's harbour", scale: 2.5 },
  '6256': { file: '6256 - Island Catamaran.mpd', name: 'the Island Catamaran', target: 'the raft', scale: 2.5 },
  '6245': { file: '6245 - Harbor Sentry.mpd', name: 'the Harbor Sentry', target: 'the harbour at Pylos', scale: 2.5 },
  '6080': { file: '6080 - Kings Castle.mpd', name: "the King's Castle", target: 'the hall at Ithaca', scale: 2.5 },
  '6071': { file: '6071 - Forestmens Crossing.mpd', name: "the Forestmen's Crossing", target: "Circe's wood", scale: 2.5 },
  '6066': { file: '6066 - Camouflaged Outpost.mpd', name: 'the Camouflaged Outpost', target: "Circe's wood", scale: 2.5 },
  '21318': { file: '21318 - Tree House.mpd', name: 'the Tree House', target: "Calypso's grove", scale: 2.5 },   /* 1.3 million triangles: not kept in the repository; fetch it with films/forage/fetch-odyssey-ldraw.mjs and pack it to use it */
  '21325': { file: '21325 - Medieval Blacksmith.mpd', name: 'the Medieval Blacksmith', target: "the swineherd's hut", scale: 2.5 },
  '6716': { file: '6716-1 - Covered Wagon.mpd', name: 'the Covered Wagon', target: 'the road to Sparta', scale: 2.5 },
  '7410': { file: '7410-1 - Jungle River.mpd', name: 'the Jungle River', target: 'the washing pools', scale: 2.5 },
  '1788': { file: '1788 - Treasure Chest.mpd', name: 'the Treasure Chest', target: 'the storeroom', scale: 2.5 },
  monkey: { file: 'monkey-data-center-modular.mpd', name: 'the monkey data centre', target: 'the control room', scale: 2.5 },   /* the repository's own build, at 4X: four textured walls, the floor, three monkeys */
  /* the cases (world/scenes-cases.js): the repository's own scene builds, packed by tools/donor-pack.js */
  'grocery-store': { file: 'grocery-store.mpd', name: 'the corner grocery', target: 'The Checkout', scale: 1 },   /* built by tools/model.js from world/models/grocery-store.js: a real model at minifig scale, so scale 1 */
  'forest-clearing': { file: 'forest-clearing.mpd', name: 'the forest clearing', target: 'The Forest Skirmish', scale: 1 },
  'cave-of-shadows': { file: 'cave-of-shadows.mpd', name: 'the cave of shadows', target: 'The Cave', scale: 1 },
  homestead: { file: 'homestead.mpd', name: 'the homestead', target: 'The Searchers', scale: 1 },   /* world/models/homestead.js: the log cabin, its porch and yard */
  buttes: { file: 'buttes.mpd', name: 'the buttes', target: 'The Searchers', scale: 1 },            /* world/models/buttes.js: the country the door frames */
  'simpsons-grocery': { file: 'simpsons-grocery.mpd', name: 'the grocery checkout', target: 'The Checkout', scale: 2.5 },
  'simpsons-band': { file: 'simpsons-band.mpd', name: 'the band classroom', target: 'Band Class', scale: 2.5 },
  'ewoks-forest': { file: 'ewoks-forest.mpd', name: 'the forest clearing', target: 'The Forest Skirmish', scale: 2.5 },
  'platos-cave': { file: 'platos-cave.mpd', name: "Plato's cave", target: 'The Cave', scale: 2.5 },
  searchers: { file: 'searchers.mpd', name: 'the homestead', target: 'The Searchers', scale: 2.5 },
  'rocket-launch': { file: 'rocket-launch.mpd', name: 'the launch pad', target: 'The Launch', scale: 2.5 },
  'ogygia-grove': { file: 'ogygia-grove.mpd', name: 'Ogygia grove', target: 'Ogygia', scale: 2.5 },
  'ithaca-cove': { file: 'ithaca-cove.mpd', name: 'Ithaca cove', target: 'Ithaca Cove', scale: 2.5 },
  'undaunted-fort-mandan': { file: 'undaunted-fort-mandan.mpd', name: 'Fort Mandan', target: 'Fort Mandan', scale: 2.5 },
};
let K = null;
function create({ props, fetchText, scene }) { K = { props, scene, fetchText: fetchText || (u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status + ' ' + u); return r.text(); })), templates: new Map(), fetched: 0, parsed: 0 }; return K; }
/** The template of a donor: fetched, parsed with its subfiles and merged once. Geometry in LDraw units, y down, its feet at y = 0 and its footprint centred. */
function load(id) {
  const def = DONORS[id]; if (!def || !K) return Promise.reject(new Error('no donor ' + id));
  if (K.templates.has(id)) return K.templates.get(id);
  const p = (async () => {
    let text; try { text = await K.fetchText('./ldraw/models/' + encodeURIComponent(def.file.replace(/\.mpd$/i, '') + '-full.mpd.txt')); K.packed = (K.packed || 0) + 1; } catch (e) { text = await K.fetchText('./ldraw/models/' + encodeURIComponent(def.file)); }   /* the packed model (tools/donor-pack.js) carries every part inlined: no fetch per part; the bare model is the fallback */
    K.fetched++;
    const parsed = await K.props.parse(text, 'donor-' + id + '.mpd', { timeout: 180000 }); K.parsed++;
    const lines = []; parsed.traverse(o => { if (o.isLine || o.isLineSegments) lines.push(o); }); for (const l of lines) l.parent.remove(l);   // a set is a place, not a drawing
    const geometry = window.Kits && Kits.merge ? Kits.merge(parsed) : null; if (!geometry) throw new Error('donor ' + id + ' merged to nothing');
    const bb = geometry.boundingBox, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, feet = bb.max.y;   // LDraw y is down: the lowest brick has the greatest y
    geometry.translate(-cx, -feet, -cz); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    return { id, def, geometry, tris: geometry.attributes.position.count / 3, size: { w: size.x, h: size.y, d: size.z } };
  })();
  K.templates.set(id, p); p.catch(() => K.templates.delete(id)); return p;
}
/** A fresh copy of a donor standing at the origin: LDraw turned to the world, scaled to the figures, feet at y = 0. */
async function build(id, opts = {}) {
  const t = await load(id), scale = opts.scale || t.def.scale || 2.5;
  const outer = new THREE.Group(); outer.name = 'donor:' + id; const yawG = new THREE.Group(); yawG.rotation.y = opts.yaw || 0; outer.add(yawG);
  const flip = new THREE.Group(); flip.rotation.x = Math.PI; flip.scale.setScalar(scale); yawG.add(flip);
  const mesh = new THREE.Mesh(t.geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .6, metalness: .02, side: THREE.DoubleSide })); mesh.material.fog = true; mesh.castShadow = true; mesh.receiveShadow = true; mesh.name = 'donor:' + id + ':body'; flip.add(mesh);
  outer.userData.donor = id; outer.userData.size = { w: t.size.w * scale, h: t.size.h * scale, d: t.size.d * scale }; outer.userData.tris = t.tris;
  return outer;
}
function stats() { return K ? { fetched: K.fetched, parsed: K.parsed, templates: [...K.templates.keys()] } : null; }
window.Donors = { DONORS, create, load, build, stats };
})();
