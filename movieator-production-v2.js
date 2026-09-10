import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {
  actorPorts,
  headFamily,
  isFaceCandidate,
  isHeadwearCandidate,
  isNeckLayerCandidate,
  probeCrownSocket,
  probeGrip,
  headwearCompatibility,
  CLOCKS
} from './movieator-rig.js';

const $ = id => document.getElementById(id);
const norm = s => String(s || '').toLowerCase();
const P = (role, file, description, extra = {}) => ({ role, file, description, exact: true, ...extra });
const DESCRIPTORS = './wag-viewer-prime-integration-20251112-055341%20copy/all-parts-descriptors.json';

const SKINS = [
  { code: 14, name: 'Classic Yellow', hex: '#FAC80A' },
  { code: 78, name: 'Light Nougat', hex: '#FFC995' },
  { code: 84, name: 'Medium Nougat', hex: '#AA7D55' },
  { code: 92, name: 'Nougat', hex: '#BB805A' },
  { code: 128, name: 'Dark Nougat', hex: '#AD6140' },
  { code: 70, name: 'Reddish Brown', hex: '#5F3109' },
  { code: 308, name: 'Dark Brown', hex: '#352100' }
];

const PAINTS = [
  { code: 0, name: 'Black', hex: '#1B2A34' },
  { code: 15, name: 'White', hex: '#F4F4F4' },
  { code: 4, name: 'Red', hex: '#B40000' },
  { code: 1, name: 'Blue', hex: '#1E5AA8' },
  { code: 2, name: 'Green', hex: '#00852B' },
  { code: 14, name: 'Yellow', hex: '#FAC80A' },
  { code: 25, name: 'Orange', hex: '#D67923' },
  { code: 19, name: 'Tan', hex: '#D7BA8C' },
  { code: 70, name: 'Reddish Brown', hex: '#5F3109' },
  { code: 71, name: 'Light Bluish Grey', hex: '#969696' },
  { code: 72, name: 'Dark Bluish Grey', hex: '#646464' },
  { code: 272, name: 'Dark Blue', hex: '#19325A' }
];

const WORLDS = [
  { id: 'simpsons', label: 'The Simpsons' },
  { id: 'star-wars', label: 'Star Wars' },
  { id: 'gremlins', label: 'Gremlins' },
  { id: 'scooby-doo', label: 'Scooby-Doo' },
  { id: 'back-to-future', label: 'Back to the Future' },
  { id: 'stranger-things', label: 'Stranger Things' }
];

const FIGURES = [
  { id: 'homer', world: 'simpsons', name: 'Homer Simpson', skin: 14, note: 'prosthetic sculpt + printed upper', parts: [P('HEAD', '15527p02.dat', 'Homer Simpson head', { mountY: -64 }), P('UPPER', '16360p87.dat', 'Homer Simpson shirt / tie / ID upper'), P('LOWER', '3815c01.dat', 'blue hips + legs', { exact: false, color: 1 })] },
  { id: 'marge', world: 'simpsons', name: 'Marge Simpson', skin: 14, note: 'prosthetic sculpt + formed skirt', parts: [P('HEAD', '15522p02.dat', 'Marge Simpson head', { mountY: -64 }), P('UPPER', '76382pd13.dat', 'Marge Simpson dress upper'), P('LOWER', '3815c01.dat', 'green hips + legs under skirt', { exact: false, color: 2 }), P('OVERLAY', 'u9209c01.dat', 'Marge formed skirt')] },
  { id: 'bart', world: 'simpsons', name: 'Bart Simpson', skin: 14, note: 'prosthetic sculpt + slingshot torso', parts: [P('HEAD', '15523p02.dat', 'Bart Simpson head', { mountY: -64 }), P('TORSO', '973pd12.dat', 'Bart slingshot torso', { color: 4 }), P('LOWER', '16709p02.dat', 'Bart short hips + legs')] },
  { id: 'lisa', world: 'simpsons', name: 'Lisa Simpson', skin: 14, note: 'prosthetic sculpt + beads upper', parts: [P('HEAD', '15524p02.dat', 'Lisa Simpson head', { mountY: -64 }), P('UPPER', '76382pd14.dat', 'Lisa Simpson beads upper'), P('LOWER', '3815c01.dat', 'red hips + legs', { exact: false, color: 4 })] },
  { id: 'maggie', world: 'simpsons', name: 'Maggie Simpson', skin: 14, body: 'baby', note: 'baby rig', parts: [P('BABY', '15526.dat', 'Maggie baby body', { color: 1 }), P('BABY_HEAD', '15525p02.dat', 'Maggie Simpson head', { mountY: -58 })] },
  { id: 'ned', world: 'simpsons', name: 'Ned Flanders', skin: 14, note: 'prosthetic sculpt + apron body', parts: [P('HEAD', '15529p01.dat', 'Ned Flanders head', { mountY: -64 }), P('UPPER', '76382p89.dat', 'Ned apron upper'), P('LOWER', '73200p89.dat', 'Ned apron hips + legs')] },

  { id: 'vader', world: 'star-wars', name: 'Darth Vader', skin: 14, note: 'standard rig + exact Vader helmet', parts: [P('HEAD', '3626b.dat', 'head under helmet', { exact: false, color: 0, mountY: -84 }), P('TORSO', '973.dat', 'black torso base', { exact: false, color: 0 }), P('LOWER', '3815c01.dat', 'black lower', { exact: false, color: 0 }), P('HEADGEAR', '30368.dat', 'Darth Vader helmet', { color: 0 })] },
  { id: 'yoda', world: 'star-wars', name: 'Yoda', skin: 84, note: 'prosthetic sculpt', parts: [P('HEAD', '13195p01.dat', 'Yoda patterned head', { mountY: -64 }), P('TORSO', '973.dat', 'tan robe torso', { exact: false, color: 19 }), P('LOWER', '3815c01.dat', 'tan robe lower', { exact: false, color: 19 })] },
  { id: 'luke', world: 'star-wars', name: 'Luke Skywalker', skin: 78, note: 'Word-to-Mento cast base', parts: [P('HEAD', '3626b.dat', 'standard film head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'light tunic base', { exact: false, color: 15 }), P('LOWER', '3815c01.dat', 'tan lower', { exact: false, color: 19 })] },
  { id: 'leia', world: 'star-wars', name: 'Leia Organa', skin: 78, note: 'Word-to-Mento cast base', parts: [P('HEAD', '3626b.dat', 'standard film head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'white torso base', { exact: false, color: 15 }), P('LOWER', '3815c01.dat', 'white lower', { exact: false, color: 15 })] },
  { id: 'han', world: 'star-wars', name: 'Han Solo', skin: 78, note: 'Word-to-Mento cast base', parts: [P('HEAD', '3626b.dat', 'standard film head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'shirt base', { exact: false, color: 15 }), P('LOWER', '3815c01.dat', 'dark lower', { exact: false, color: 0 })] },
  { id: 'chewie', world: 'star-wars', name: 'Chewbacca', skin: 70, note: 'Word-to-Mento cast base; prosthetic pending', parts: [P('HEAD', '3626b.dat', 'temporary standard head', { exact: false, color: 70, mountY: -84 }), P('TORSO', '973.dat', 'brown torso base', { exact: false, color: 70 }), P('LOWER', '3815c01.dat', 'brown lower', { exact: false, color: 70 })] },
  { id: 'c3po', world: 'star-wars', name: 'C-3PO', skin: 14, note: 'Word-to-Mento cast base; droid sculpt pending', parts: [P('HEAD', '3626b.dat', 'temporary droid head', { exact: false, color: 14, mountY: -84 }), P('TORSO', '973.dat', 'droid torso base', { exact: false, color: 14 }), P('LOWER', '3815c01.dat', 'droid lower', { exact: false, color: 14 })] },
  { id: 'storm', world: 'star-wars', name: 'Stormtrooper', skin: 14, note: 'Word-to-Mento cast base; exact helmet pending', parts: [P('HEAD', '3626b.dat', 'head base', { exact: false, color: 0, mountY: -84 }), P('TORSO', '973.dat', 'white armor base', { exact: false, color: 15 }), P('LOWER', '3815c01.dat', 'white armor lower', { exact: false, color: 15 })] },
  { id: 'pilot', world: 'star-wars', name: 'Rebel Pilot', skin: 78, note: 'Word-to-Mento cast base', parts: [P('HEAD', '3626b.dat', 'pilot head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'orange flight torso', { exact: false, color: 25 }), P('LOWER', '3815c01.dat', 'orange flight lower', { exact: false, color: 25 })] },
  { id: 'rebel', world: 'star-wars', name: 'Rebel Trooper', skin: 78, note: 'Word-to-Mento cast base', parts: [P('HEAD', '3626b.dat', 'trooper head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'rebel torso base', { exact: false, color: 19 }), P('LOWER', '3815c01.dat', 'rebel lower', { exact: false, color: 19 })] },
  { id: 'rey', world: 'star-wars', name: 'Rey', skin: 78, note: 'Word-to-Mento cast base', parts: [P('HEAD', '3626b.dat', 'standard film head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'sand torso base', { exact: false, color: 19 }), P('LOWER', '3815c01.dat', 'sand lower', { exact: false, color: 19 })] },

  { id: 'gremlin', world: 'gremlins', name: 'Gremlin', skin: 78, note: 'patterned prosthetic', parts: [P('HEAD', '26056px0.dat', 'patterned Gremlin / Mogwai head', { mountY: -64 }), P('TORSO', '973.dat', 'neutral torso', { exact: false, color: 0 }), P('LOWER', '3815c01.dat', 'neutral lower', { exact: false, color: 0 })] },
  { id: 'fred', world: 'scooby-doo', name: 'Fred', skin: 14, note: 'standard head + exact ascot torso', parts: [P('HEAD', '3626b.dat', 'standard head', { exact: false, mountY: -84 }), P('TORSO', '973px3.dat', 'Fred sweater + orange ascot', { color: 15 }), P('LOWER', '3815c01.dat', 'blue lower', { exact: false, color: 1 })] },
  { id: 'shaggy', world: 'scooby-doo', name: 'Shaggy', skin: 14, note: 'standard head + compatible hair', parts: [P('HEAD', '3626b.dat', 'standard head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'green torso base', { exact: false, color: 2 }), P('LOWER', '3815c01.dat', 'brown lower', { exact: false, color: 70 }), P('HEADGEAR', '21787.dat', 'Shaggy Rogers hair', { color: 70 })] },
  { id: 'marty', world: 'back-to-future', name: 'Marty McFly', skin: 78, note: 'film base', parts: [P('HEAD', '3626b.dat', 'standard head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'red torso base', { exact: false, color: 4 }), P('LOWER', '3815c01.dat', 'blue lower', { exact: false, color: 1 })] },
  { id: 'doc', world: 'back-to-future', name: 'Doc Brown', skin: 78, note: 'film base', parts: [P('HEAD', '3626b.dat', 'standard head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'white torso base', { exact: false, color: 15 }), P('LOWER', '3815c01.dat', 'white lower', { exact: false, color: 15 })] },
  { id: 'lucas', world: 'stranger-things', name: 'Lucas Sinclair', skin: 92, note: 'film base', parts: [P('HEAD', '3626b.dat', 'standard head', { exact: false, mountY: -84 }), P('TORSO', '973.dat', 'red torso base', { exact: false, color: 4 }), P('LOWER', '3815c01.dat', 'blue lower', { exact: false, color: 1 })] }
];

const PROSTHETICS = [
  { filename: '15527p02.dat', description: 'Homer Simpson prosthetic head', mountY: -64 },
  { filename: '15522p02.dat', description: 'Marge Simpson prosthetic head', mountY: -64 },
  { filename: '15523p02.dat', description: 'Bart Simpson prosthetic head', mountY: -64 },
  { filename: '15524p02.dat', description: 'Lisa Simpson prosthetic head', mountY: -64 },
  { filename: '15529p01.dat', description: 'Ned Flanders prosthetic head', mountY: -64 },
  { filename: '13195p01.dat', description: 'Yoda prosthetic head', mountY: -64 },
  { filename: '26056px0.dat', description: 'Patterned Gremlin / Mogwai prosthetic', mountY: -64 }
];

const state = {
  world: 'simpsons',
  fig: null,
  root: null,
  mode: null,
  submode: null,
  cache: new Map(),
  catalogLoaded: false,
  catalog: { face: [], hair: [], neck: [], top: [], bottom: [], prop: [], setprop: [] },
  look: {}
};

function collect(node, out, seen) {
  if (!node || typeof node !== 'object' || seen.has(node)) return;
  seen.add(node);
  if (!Array.isArray(node)) {
    const filename = node.filename || node.name;
    const description = node.description || node.desc || '';
    const partPath = node.path || '';
    if (filename && /\.dat$/i.test(filename) && (/(^|\/)parts\//i.test(partPath) || !partPath)) {
      out.push({ filename: String(filename), description: String(description), path: partPath ? String(partPath) : `parts/${filename}` });
    }
  }
  for (const value of Array.isArray(node) ? node : Object.values(node)) collect(value, out, seen);
}

function classify(records) {
  const primary = records.filter(r => r.description && !r.description.trim().startsWith('~') && !/obsolete/i.test(r.description));
  const uniq = rows => [...new Map(rows.map(r => [r.filename, r])).values()].sort((a, b) => a.description.localeCompare(b.description));
  state.catalog.face = uniq(primary.filter(isFaceCandidate));
  state.catalog.hair = uniq(primary.filter(isHeadwearCandidate));
  state.catalog.neck = uniq(primary.filter(isNeckLayerCandidate));
  state.catalog.top = uniq(primary.filter(r => /^Minifig Torso\b/i.test(r.description) && !/with (?:Arms|Dual Mould Arms)/i.test(r.description)));
  state.catalog.bottom = uniq(primary.filter(r => /^Minifig (?:Hips and Legs|Hips and Legs Short)\b/i.test(r.description)));
  const propWords = /\b(?:accessory|weapon|sword|saber|lightsaber|blaster|gun|rifle|pistol|shield|wand|slingshot|camera|radio|microphone|guitar|cup|mug|bottle|book|briefcase|bag|tool|axe|hammer|staff|spear|bow|torch)\b/i;
  state.catalog.prop = uniq(primary.filter(r => /^Minifig\b/i.test(r.description) && propWords.test(r.description) && !/^Minifig (?:Head|Hair|Hat|Helmet|Headgear)/i.test(r.description)));
  state.catalog.setprop = uniq(primary.filter(r => propWords.test(r.description)));
  state.catalogLoaded = true;
  $('catalogReady').textContent = 'CATALOG READY';
  $('catalogReady').classList.add('ok');
  if (state.mode) renderTray();
}

// Real LDraw viewer ----------------------------------------------------------
const host = $('threeHost');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1eee5);
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2.25));
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(120, 180, 160);
scene.add(key);
const grid = new THREE.GridHelper(280, 14, 0x999999, 0xd2cfc7);
scene.add(grid);
const loader = new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
loader.setPartsLibraryPath('./ldraw/');
let ldrawReady = false;

function resize() {
  const width = host.clientWidth;
  const height = host.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function tick() {
  requestAnimationFrame(tick);
  resize();
  controls.update();
  renderer.render(scene, camera);
}
tick();

function dispose(root) {
  root?.traverse(obj => {
    obj.geometry?.dispose?.();
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    mats.filter(Boolean).forEach(mat => mat.dispose?.());
  });
}

function clearScene() {
  if (!state.root) return;
  scene.remove(state.root);
  dispose(state.root);
  state.root = null;
}

function fit(root) {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const extent = Math.min(170, Math.max(size.x, size.y, size.z, 62));
  controls.target.copy(center);
  camera.position.set(center.x + extent * 1.18, center.y + extent * 0.66, center.z + extent * 1.6);
  camera.far = 10000;
  camera.updateProjectionMatrix();
  grid.position.y = box.min.y - 0.8;
}

new ResizeObserver(() => {
  resize();
  if (state.root) setTimeout(() => fit(state.root), 40);
}).observe(host);

function ref(color, x, y, z, file, matrix = '1 0 0 0 1 0 0 0 1') {
  return `1 ${color ?? 16} ${x} ${y} ${z} ${matrix} parts/${file}`;
}

const HANDS = {
  left: { p: [-23.6904, -33.226, -9.8982], m: [0.985, -0.1202, 0.1202, 0.17, 0.6964, -0.6964, 0, 0.707, 0.707] },
  right: { p: [23.6904, -33.226, -9.8982], m: [0.985, 0.1202, -0.1202, -0.17, 0.6964, -0.6964, 0, 0.707, 0.707] }
};
const HAND_GRIP_LOCAL = [0, -0.8229, -9.8948];
const mv = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const add = (a, b) => a.map((x, i) => x + b[i]);
const handGrip = side => add(HANDS[side].p, mv(HANDS[side].m, HAND_GRIP_LOCAL));

function torsoLines(part) {
  const color = part.color ?? state.look.topColor;
  const skin = state.look.skin;
  return [
    ref(color, 0, -60, 0, part.file),
    ref(color, -15.552, -51, 0, '3818.dat', '0.985 -0.17 0 0.17 0.985 0 0 0 1'),
    ref(color, 15.552, -51, 0, '3819.dat', '0.985 0.17 0 -0.17 0.985 0 0 0 1'),
    ref(skin, ...HANDS.left.p, '3820.dat', HANDS.left.m.join(' ')),
    ref(skin, ...HANDS.right.p, '3820.dat', HANDS.right.m.join(' '))
  ];
}

async function expandUpper(part) {
  try {
    const response = await fetch(`./ldraw/parts/${part.file}`, { cache: 'force-cache' });
    if (!response.ok) throw new Error('upper fetch');
    const text = await response.text();
    const out = [];
    for (const raw of text.split(/\r?\n/)) {
      const a = raw.trim().split(/\s+/);
      if (a[0] !== '1' || a.length < 15) continue;
      let color = +a[1];
      const x = +a[2];
      const y = +a[3] - 60;
      const z = +a[4];
      const matrix = a.slice(5, 14).join(' ');
      const file = a.slice(14).join(' ').replace(/^parts\//, '');
      const low = file.toLowerCase();
      if (low.endsWith('3820.dat')) color = state.look.skin;
      else if ((low.endsWith('3818.dat') || low.endsWith('3819.dat')) && color === 14) color = state.look.skin;
      else if (color === 16) color = part.color ?? state.look.topColor;
      out.push(ref(color, x, y, z, file, matrix));
    }
    return out.length ? out : [ref(part.color ?? state.look.topColor, 0, -60, 0, part.file)];
  } catch {
    return [ref(part.color ?? state.look.topColor, 0, -60, 0, part.file)];
  }
}

function originalHead() {
  return state.fig?.parts.find(p => p.role === 'HEAD' || p.role === 'BABY_HEAD') || null;
}

function currentHead() {
  if (state.look.prosthetic) return { file: state.look.prosthetic.filename, filename: state.look.prosthetic.filename, description: state.look.prosthetic.description, mountY: state.look.prosthetic.mountY };
  if (state.look.face) return { file: state.look.face.filename, filename: state.look.face.filename, description: state.look.face.description, mountY: -84 };
  return originalHead();
}

function currentPorts() {
  return actorPorts({ head: currentHead() });
}

function effectiveParts() {
  const out = [];
  for (const part of state.fig.parts) {
    if ((state.look.face || state.look.prosthetic) && (part.role === 'HEAD' || part.role === 'BABY_HEAD')) continue;
    if (state.look.top && (part.role === 'TORSO' || part.role === 'UPPER')) continue;
    if (state.look.bottom && part.role === 'LOWER') continue;
    if (state.look.hair !== undefined && part.role === 'HEADGEAR') continue;
    out.push({ ...part });
  }
  if (state.look.face) out.push(P('HEAD', state.look.face.filename, state.look.face.description, { exact: false, wardrobe: true, mountY: -84 }));
  if (state.look.prosthetic) out.push(P(state.fig.body === 'baby' ? 'BABY_HEAD' : 'HEAD', state.look.prosthetic.filename, state.look.prosthetic.description, { exact: false, wardrobe: true, mountY: state.look.prosthetic.mountY }));
  if (state.look.top) out.push(P('TORSO', state.look.top.filename, state.look.top.description, { exact: false, color: state.look.topColor, wardrobe: true }));
  if (state.look.bottom) out.push(P('LOWER', state.look.bottom.filename, state.look.bottom.description, { exact: false, color: state.look.bottomColor, wardrobe: true }));
  if (state.look.hair) out.push(P('HEADGEAR', state.look.hair.filename, state.look.hair.description, { exact: false, color: state.look.hairColor, wardrobe: true }));
  if (state.look.leftProp) out.push(P('HAND_PROP', state.look.leftProp.record.filename, state.look.leftProp.record.description, { exact: false, color: state.look.propColor, side: 'left', probe: state.look.leftProp.probe }));
  if (state.look.rightProp) out.push(P('HAND_PROP', state.look.rightProp.record.filename, state.look.rightProp.record.description, { exact: false, color: state.look.propColor, side: 'right', probe: state.look.rightProp.probe }));
  if (state.look.setProp) out.push(P('SET_PROP', state.look.setProp.filename, state.look.setProp.description, { exact: false, color: state.look.propColor }));
  return out;
}

function propTransform(part) {
  const probe = part.probe;
  const side = part.side;
  const clock = (state.look[`${side}Clock`] || 0) * Math.PI / 180;
  const from = new THREE.Vector3(...probe.axis).normalize();
  const to = new THREE.Vector3(0, -1, 0);
  const align = new THREE.Quaternion().setFromUnitVectors(from, to);
  const around = new THREE.Quaternion().setFromAxisAngle(to, clock);
  const q = around.multiply(align);
  const localMid = new THREE.Vector3(...probe.localPoint).add(new THREE.Vector3(...probe.axis).multiplyScalar(probe.length * 0.5)).applyQuaternion(q);
  const target = new THREE.Vector3(...handGrip(side));
  const translation = target.sub(localMid);
  const matrix4 = new THREE.Matrix4().makeRotationFromQuaternion(q);
  const e = matrix4.elements;
  const matrix = [e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]];
  return { t: [translation.x, translation.y, translation.z], matrix };
}

async function buildAssembly() {
  const lines = [`0 FILE production_${state.fig.id}.mpd`, `0 Name: ${state.fig.name}`, '0 !LDRAW_ORG Model', '0 // Movieator: only committed production slots', ''];
  for (const part of effectiveParts()) {
    const color = part.color ?? 16;
    switch (part.role) {
      case 'HEAD': lines.push(ref(part.color ?? state.look.skin, 0, part.mountY ?? -84, 0, part.file)); break;
      case 'BABY_HEAD': lines.push(ref(part.color ?? state.look.skin, 0, part.mountY ?? -58, 0, part.file)); break;
      case 'HEADGEAR': lines.push(ref(color, 0, -84, 0, part.file)); break;
      case 'UPPER': lines.push(...await expandUpper(part)); break;
      case 'TORSO': lines.push(...torsoLines(part)); break;
      case 'LOWER': lines.push(ref(color, 0, -28, 0, part.file)); break;
      case 'OVERLAY': lines.push(ref(color, 0, -28, 0, part.file)); break;
      case 'BABY': lines.push(ref(color, 0, -42, 0, part.file)); break;
      case 'HAND_PROP': {
        const x = propTransform(part);
        lines.push(ref(color, ...x.t, part.file, x.matrix.join(' ')));
        break;
      }
      case 'SET_PROP': lines.push(ref(color, 55, -18, 24, part.file)); break;
    }
    lines.push('');
  }
  return lines.join('\n');
}

async function renderFigure() {
  if (!ldrawReady || !state.fig) return;
  $('portBadge').textContent = 'BUILDING';
  const text = await buildAssembly();
  loader.parse(text, group => {
    clearScene();
    state.root = new THREE.Group();
    state.root.rotation.x = Math.PI;
    state.root.add(group);
    scene.add(state.root);
    fit(state.root);
    updatePortBadge();
  }, error => {
    $('portBadge').textContent = 'LOAD ERROR';
    $('portBadge').className = 'portBadge bad';
    console.error(error);
  });
}

function updatePortBadge() {
  const ports = currentPorts();
  const bits = [ports.crown ? 'CROWN' : 'NO CROWN', ports.neckLayer ? 'NECK' : 'NO NECK', 'L GRIP', 'R GRIP'];
  $('portBadge').textContent = bits.join(' · ');
  $('portBadge').className = 'portBadge';
}

// Actor state ---------------------------------------------------------------
function worldFigures() {
  return FIGURES.filter(f => f.world === state.world);
}

function resetLook(render = true) {
  const f = state.fig;
  state.look = {
    skin: f.skin ?? 14,
    face: null,
    prosthetic: null,
    hair: undefined,
    neck: null,
    top: null,
    bottom: null,
    leftProp: null,
    rightProp: null,
    setProp: null,
    leftClock: 0,
    rightClock: 0,
    topColor: f.parts.find(p => p.role === 'TORSO' || p.role === 'UPPER')?.color ?? 4,
    bottomColor: f.parts.find(p => p.role === 'LOWER')?.color ?? 1,
    hairColor: f.parts.find(p => p.role === 'HEADGEAR')?.color ?? 0,
    propColor: 14
  };
  if (render) renderFigure();
  if (state.mode) renderTray();
}

function selectFigure(fig) {
  state.fig = fig;
  $('figName').textContent = fig.name;
  $('figNote').textContent = fig.note;
  $('figure').value = fig.id;
  resetLook(false);
  renderFigure();
  if (state.mode) renderTray();
}

function renderSelectors() {
  const worlds = WORLDS.filter(w => FIGURES.some(f => f.world === w.id));
  $('world').innerHTML = worlds.map(w => `<option value="${w.id}">${w.label}</option>`).join('');
  $('world').value = state.world;
  $('figure').innerHTML = worldFigures().map(f => `<option value="${f.id}">${f.name}</option>`).join('');
}

// Mobile production departments --------------------------------------------
function openMode(mode) {
  state.mode = mode;
  state.submode = mode === 'hmu' ? 'face' : mode === 'wardrobe' ? 'top' : mode === 'props' ? 'right' : mode;
  $('app').classList.add('trayOpen');
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  renderTray();
  setTimeout(() => state.root && fit(state.root), 70);
}

function closeTray() {
  state.mode = null;
  state.submode = null;
  $('app').classList.remove('trayOpen');
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
  setTimeout(() => state.root && fit(state.root), 70);
}

function tabsForMode() {
  if (state.mode === 'hmu') return [['face', 'FACE'], ['prosthetic', 'PROSTHETIC'], ['hair', 'HAIR / HAT'], ['neck', 'BEARD / NECK'], ['skin', 'SKIN']];
  if (state.mode === 'wardrobe') return [['top', 'TOP'], ['bottom', 'BOTTOM']];
  if (state.mode === 'props') return [['left', 'LEFT HAND'], ['right', 'RIGHT HAND'], ['setprop', 'SET'], ['clock', 'CLOCK']];
  return [];
}

function renderTray() {
  if (!state.mode) return;
  $('trayTitle').textContent = state.mode === 'hmu' ? 'HAIR / MAKEUP' : state.mode.toUpperCase();
  const tabs = tabsForMode();
  $('subtabs').innerHTML = tabs.map(([id, label]) => `<button data-sub="${id}" class="${state.submode === id ? 'active' : ''}">${label}</button>`).join('');
  document.querySelectorAll('[data-sub]').forEach(button => {
    button.onclick = () => {
      state.submode = button.dataset.sub;
      renderTray();
    };
  });

  if (state.mode === 'pieces') return renderPieces();
  if (state.submode === 'face') return renderFace();
  if (state.submode === 'prosthetic') return renderProsthetics();
  if (state.submode === 'hair') return renderHair();
  if (state.submode === 'neck') return renderNeck();
  if (state.submode === 'skin') return renderSkin();
  if (state.submode === 'top' || state.submode === 'bottom') return renderWardrobeSlot(state.submode);
  if (state.submode === 'left' || state.submode === 'right') return renderHandProps(state.submode);
  if (state.submode === 'setprop') return renderSetProps();
  if (state.submode === 'clock') return renderClock();
}

function rigLine(status, reason) {
  return `<div class="rigState"><span class="state ${status.toLowerCase()}">${status}</span><span>${reason}</span></div>`;
}

function loadingCatalog(message) {
  $('trayBody').innerHTML = rigLine('PROBE', message) + '<div class="hint">The actor rig is already live. The 33,820-part catalog is loading separately.</div>';
}

function renderFace() {
  if (!state.catalogLoaded) return loadingCatalog('LOADING STANDARD FACE FAMILY');
  const rows = state.catalog.face;
  $('trayBody').innerHTML = rigLine('CLICK', '3626 STANDARD HEAD FAMILY') + '<div class="hint">FACE changes within one mechanically compatible head family. It does not substitute an arbitrary sculpt.</div><div class="search"><input id="q" placeholder="search face / expression"></div><div id="rows"></div>';
  const draw = () => {
    const q = norm($('q').value);
    const list = (q ? rows.filter(r => norm(`${r.description} ${r.filename}`).includes(q)) : rows).slice(0, 100);
    $('rows').innerHTML = `<button class="choice original" data-original><b>ORIGINAL</b><span>restore indexed head</span><span class="state click">CLICK</span></button>${list.map(r => `<button class="choice" data-file="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state click">CLICK</span></button>`).join('')}`;
    document.querySelector('[data-original]').onclick = () => {
      state.look.face = null;
      state.look.prosthetic = null;
      renderFigure();
      renderTray();
    };
    document.querySelectorAll('[data-file]').forEach(button => {
      button.onclick = () => {
        state.look.face = rows.find(r => r.filename === button.dataset.file);
        state.look.prosthetic = null;
        state.look.neck = null;
        renderFigure();
        renderTray();
      };
    });
  };
  $('q').oninput = draw;
  draw();
}

function renderProsthetics() {
  $('trayBody').innerHTML = rigLine('CLICK', 'APPROVED PROSTHETIC MOUNTS') + '<div class="hint">A prosthetic replaces the complete head geometry and closes crown / beard ports unless separately calibrated.</div>' + PROSTHETICS.map(r => `<button class="choice" data-pro="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state click">CLICK</span></button>`).join('');
  document.querySelectorAll('[data-pro]').forEach(button => {
    button.onclick = () => {
      state.look.prosthetic = PROSTHETICS.find(r => r.filename === button.dataset.pro);
      state.look.face = null;
      state.look.hair = null;
      state.look.neck = null;
      renderFigure();
      renderTray();
    };
  });
}

async function renderHair() {
  const head = currentHead();
  const ports = currentPorts();
  if (!ports.crown) {
    $('trayBody').innerHTML = rigLine('BLOCKED', 'CURRENT HEAD EXPOSES NO CROWN PORT') + '<div class="hint">Choose a standard FACE first. Sculpted prosthetics cannot receive arbitrary hair or hats.</div>';
    return;
  }
  if (!state.catalogLoaded) return loadingCatalog('LOADING HEADWEAR');
  const rows = state.catalog.hair;
  $('trayBody').innerHTML = rigLine('CLICK', 'CROWN OPEN · ANTI-STUD REQUIRED') + '<div class="search"><input id="q" placeholder="search hair / hat / helmet"></div><div id="rows"></div>';

  const draw = () => {
    const q = norm($('q').value);
    const list = (q ? rows.filter(r => norm(`${r.description} ${r.filename}`).includes(q)) : rows).slice(0, 36);
    $('rows').innerHTML = `<button class="choice original" data-original><b>ORIGINAL</b><span>restore indexed headwear</span><span class="state click">CLICK</span></button><button class="choice none" data-none><b>NONE</b><span>leave crown open</span><span class="state click">CLICK</span></button>${list.map(r => `<button class="choice" data-probe="${r.filename}" disabled><b>${r.filename}</b><span>${r.description}</span><span class="state probe">PROBE</span></button>`).join('')}`;
    document.querySelector('[data-original]').onclick = () => {
      state.look.hair = undefined;
      renderFigure();
    };
    document.querySelector('[data-none]').onclick = () => {
      state.look.hair = null;
      renderFigure();
    };
    for (const record of list) {
      headwearCompatibility({ actorHead: head, candidate: record, cache: state.cache }).then(test => {
        const button = document.querySelector(`[data-probe="${CSS.escape(record.filename)}"]`);
        if (!button) return;
        button.disabled = !test.ok;
        const badge = button.querySelector('.state');
        badge.textContent = test.status;
        badge.className = `state ${test.status.toLowerCase()}`;
        button.title = test.reason;
        if (test.ok) {
          button.onclick = () => {
            state.look.hair = record;
            renderFigure();
          };
        }
      });
    }
  };
  $('q').oninput = draw;
  draw();
}

function renderNeck() {
  if (!currentPorts().neckLayer) {
    $('trayBody').innerHTML = rigLine('BLOCKED', 'CURRENT HEAD EXPOSES NO NECK-LAYER PORT') + '<div class="hint">A prosthetic sculpt owns this volume. Arbitrary beards and respirators are hidden.</div>';
    return;
  }
  if (!state.catalogLoaded) return loadingCatalog('LOADING NECK LAYERS');
  $('trayBody').innerHTML = rigLine('INFERRED', 'NECK FAMILY FOUND · CLEARANCE NOT YET PROVEN') + '<div class="hint">These candidates remain disabled until collision clearance is implemented. They cannot wreck the actor while still inferred.</div>' + state.catalog.neck.slice(0, 60).map(r => `<button class="choice" disabled><b>${r.filename}</b><span>${r.description}</span><span class="state inferred">INFERRED</span></button>`).join('');
}

function renderSkin() {
  if (headFamily(currentHead()) !== 'standard') {
    $('trayBody').innerHTML = rigLine('BLOCKED', 'PROSTHETIC HEAD HAS AUTHORED SKIN') + '<div class="hint">Choose FACE to return to the standard head rig before changing skin tone.</div>';
    return;
  }
  $('trayBody').innerHTML = rigLine('CLICK', 'STANDARD HEAD + REBUILDABLE HANDS') + `<div class="section"><div class="sectionTitle">SKIN</div><div class="skins">${SKINS.map(s => `<button class="swatch ${state.look.skin === s.code ? 'active' : ''}" data-skin="${s.code}" title="${s.name}" style="background:${s.hex}"></button>`).join('')}</div></div>`;
  document.querySelectorAll('[data-skin]').forEach(button => {
    button.onclick = () => {
      state.look.skin = +button.dataset.skin;
      renderSkin();
      renderFigure();
    };
  });
}

function renderWardrobeSlot(slot) {
  if (state.fig.body === 'baby') {
    $('trayBody').innerHTML = rigLine('BLOCKED', 'BABY RIG HAS DIFFERENT BODY PORTS');
    return;
  }
  if (!state.catalogLoaded) return loadingCatalog(`LOADING ${slot.toUpperCase()} WARDROBE`);
  const rows = state.catalog[slot];
  $('trayBody').innerHTML = rigLine('CLICK', `STANDARD ${slot.toUpperCase()} SLOT`) + `<div class="search"><input id="q" placeholder="search ${slot}"></div><div id="rows"></div>`;
  const draw = () => {
    const q = norm($('q').value);
    const list = (q ? rows.filter(r => norm(`${r.description} ${r.filename}`).includes(q)) : rows).slice(0, 80);
    $('rows').innerHTML = `<button class="choice original" data-original><b>ORIGINAL</b><span>restore indexed ${slot}</span><span class="state click">CLICK</span></button>${list.map(r => `<button class="choice" data-file="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state click">CLICK</span></button>`).join('')}`;
    document.querySelector('[data-original]').onclick = () => {
      state.look[slot] = null;
      renderFigure();
    };
    document.querySelectorAll('[data-file]').forEach(button => {
      button.onclick = () => {
        state.look[slot] = rows.find(r => r.filename === button.dataset.file);
        renderFigure();
      };
    });
  };
  $('q').oninput = draw;
  draw();
}

function renderHandProps(side) {
  if (state.fig.body === 'baby') {
    $('trayBody').innerHTML = rigLine('BLOCKED', 'BABY RIG HAS NO STANDARD HAND GRIP');
    return;
  }
  if (!state.catalogLoaded) return loadingCatalog('LOADING HAND PROPS');
  const rows = state.catalog.prop;
  $('trayBody').innerHTML = rigLine('CLICK', `${side.toUpperCase()} GRIP OPEN · ~8 LDU SHAFT REQUIRED`) + '<div class="hint">Names only find candidates. Geometry decides whether the hand can hold them.</div><div class="search"><input id="q" placeholder="search hand props"></div><div id="rows"></div>';

  const draw = () => {
    const q = norm($('q').value);
    const list = (q ? rows.filter(r => norm(`${r.description} ${r.filename}`).includes(q)) : rows).slice(0, 28);
    $('rows').innerHTML = `<button class="choice none" data-none><b>NONE</b><span>empty ${side} hand</span><span class="state click">CLICK</span></button>${list.map(r => `<button class="choice" data-probe="${r.filename}" disabled><b>${r.filename}</b><span>${r.description}</span><span class="state probe">PROBE</span></button>`).join('')}`;
    document.querySelector('[data-none]').onclick = () => {
      state.look[`${side}Prop`] = null;
      renderFigure();
    };
    for (const record of list) {
      probeGrip(record, { cache: state.cache }).then(test => {
        const button = document.querySelector(`[data-probe="${CSS.escape(record.filename)}"]`);
        if (!button) return;
        button.disabled = !test.ok;
        const badge = button.querySelector('.state');
        badge.textContent = test.status;
        badge.className = `state ${test.status.toLowerCase()}`;
        button.title = test.reason;
        if (test.ok) {
          button.onclick = () => {
            state.look[`${side}Prop`] = { record, probe: test };
            renderFigure();
            renderTray();
          };
        }
      });
    }
  };
  $('q').oninput = draw;
  draw();
}

function renderSetProps() {
  if (!state.catalogLoaded) return loadingCatalog('LOADING SET PROPS');
  const rows = state.catalog.setprop;
  $('trayBody').innerHTML = rigLine('INFERRED', 'SET PROP DOES NOT OCCUPY A HAND PORT') + '<div class="hint">Set props are spatial dressing. Search first, then place beside the actor.</div><div class="search"><input id="q" placeholder="search set props"></div><div id="rows"></div>';
  const draw = () => {
    const q = norm($('q').value);
    const list = q ? rows.filter(r => norm(`${r.description} ${r.filename}`).includes(q)).slice(0, 60) : [];
    $('rows').innerHTML = `<button class="choice none" data-none><b>NONE</b><span>remove set prop</span></button>${list.map(r => `<button class="choice" data-file="${r.filename}"><b>${r.filename}</b><span>${r.description}</span><span class="state inferred">SET</span></button>`).join('')}`;
    document.querySelector('[data-none]').onclick = () => {
      state.look.setProp = null;
      renderFigure();
    };
    document.querySelectorAll('[data-file]').forEach(button => {
      button.onclick = () => {
        state.look.setProp = rows.find(r => r.filename === button.dataset.file);
        renderFigure();
      };
    });
  };
  $('q').oninput = draw;
  draw();
}

function renderClock() {
  $('trayBody').innerHTML = '<div class="hint">CLOCK rotates a fitted prop around its verified grip shaft without moving the grip point.</div>' + ['left', 'right'].map(side => {
    const held = state.look[`${side}Prop`];
    return `<div class="section"><div class="sectionTitle">${side.toUpperCase()} HAND · ${held ? held.record.description : 'EMPTY'}</div><div class="clocks">${CLOCKS.map(c => `<button class="clock ${state.look[`${side}Clock`] === c ? 'active' : ''}" data-clock="${side}|${c}" ${held ? '' : 'disabled'}>${c}°</button>`).join('')}</div></div>`;
  }).join('');
  document.querySelectorAll('[data-clock]').forEach(button => {
    button.onclick = () => {
      const [side, value] = button.dataset.clock.split('|');
      state.look[`${side}Clock`] = +value;
      renderFigure();
      renderClock();
    };
  });
}

function renderPieces() {
  const parts = effectiveParts();
  const ports = currentPorts();
  $('trayBody').innerHTML = `<div class="slotSummary"><div class="slotCard"><b>HEAD FAMILY</b><span>${headFamily(currentHead()).toUpperCase()}</span><small>${currentHead()?.file || currentHead()?.filename || ''}</small></div><div class="slotCard"><b>OPEN PORTS</b><span>${[ports.crown ? 'CROWN' : null, ports.neckLayer ? 'NECK' : null, 'L GRIP', 'R GRIP'].filter(Boolean).join(' · ')}</span></div></div><div class="hint">Committed assembly only. Search candidates never appear here until they pass their slot test.</div>${parts.map((p, i) => `<button class="piece" data-piece="${i}"><b>${String(i + 1).padStart(2, '0')} · ${p.file}</b><span>${p.description}</span><small>${p.role}</small></button>`).join('')}<pre id="partHeader" class="headerText">Tap a piece for its .dat header.</pre>`;
  document.querySelectorAll('[data-piece]').forEach(button => {
    button.onclick = async () => {
      const part = parts[+button.dataset.piece];
      try {
        const response = await fetch(`./ldraw/parts/${part.file}`, { cache: 'no-store' });
        $('partHeader').textContent = (await response.text()).split(/\r?\n/).slice(0, 30).join('\n');
      } catch {
        $('partHeader').textContent = `${part.file}\nheader unavailable`;
      }
    };
  });
}

// Events --------------------------------------------------------------------
document.querySelectorAll('[data-mode]').forEach(button => {
  button.onclick = () => state.mode === button.dataset.mode ? closeTray() : openMode(button.dataset.mode);
});
$('closeTray').onclick = closeTray;
$('world').onchange = event => {
  state.world = event.target.value;
  renderSelectors();
  selectFigure(worldFigures()[0]);
};
$('figure').onchange = event => selectFigure(FIGURES.find(f => f.id === event.target.value));

// Startup: rig and renderer first, 33k-part catalog second ------------------
renderSelectors();
state.fig = worldFigures()[0];
$('figName').textContent = state.fig.name;
$('figNote').textContent = state.fig.note;
resetLook(false);

try {
  await loader.preloadMaterials('./ldraw/LDConfig.ldr');
  ldrawReady = true;
  $('ldrawReady').textContent = 'LDRAW READY';
  $('ldrawReady').classList.add('ok');
  await renderFigure();
} catch (error) {
  $('ldrawReady').textContent = 'LDRAW ERROR';
  $('ldrawReady').classList.add('bad');
  console.error(error);
}

async function selfTest() {
  const checks = [];
  checks.push(headFamily({ file: '15527p02.dat', description: 'Homer Simpson' }) === 'prosthetic');
  checks.push(headFamily({ file: '3626b.dat', description: 'Minifig Head' }) === 'standard');
  checks.push((await probeCrownSocket({ filename: '21787.dat' }, { cache: state.cache })).ok);
  checks.push(!(await headwearCompatibility({ actorHead: { file: '15527p02.dat', description: 'Homer Simpson' }, candidate: { filename: '21787.dat', description: 'Minifig Hair Short Quiff' }, cache: state.cache })).ok);
  checks.push((await probeGrip({ filename: '39802.dat', description: 'Minifig Axe with Pick End and Long Handle' }, { cache: state.cache })).ok);
  const pass = checks.filter(Boolean).length;
  $('rigReady').textContent = `RIG ${pass}/${checks.length}`;
  $('rigReady').classList.add(pass === checks.length ? 'ok' : 'bad');
}
await selfTest();

async function loadCatalog() {
  try {
    const response = await fetch(DESCRIPTORS);
    if (!response.ok) throw new Error('descriptor fetch failed');
    const data = await response.json();
    const records = [];
    collect(data, records, new WeakSet());
    classify(records);
  } catch (error) {
    $('catalogReady').textContent = 'CATALOG ERROR';
    $('catalogReady').classList.add('bad');
    console.error(error);
  }
}
loadCatalog();
