/* tools/forage/table.js — the forage table: for every card of the Odyssey atlas, what its build is made of.

   A card names a character, a creature, a location, a prop, an ensemble, a divine effect, a set piece, an environment,
   a vehicle, a sound source or a wearable. Each type has a way of being got:

   character    a minifigure from real parts, dressed by role (god, hero, beggar, shade, suitor, servant, seer, bard, woman, giant)
   ensemble     the role's figure, varied, as many as the name counts (to twelve), standing in ranks
   creature     animal parts as LEGO makes them (horse, pig, cow, goat, dog, wolf, eagle, octopus) in the number named
   location     a sub-build foraged from a real set (the King's Castle for a hall, the Barracuda for a harbour, the
                Lincoln Memorial for Olympus, Skull Island for a cave) with the pieces a scene needs laid beside it
   prop         the readymade part the thing is (a goblet, a bow, a quiver, twelve axe heads in a row) on a small plinth
   vehicle      the ship, the boat, the wagon, the carriage of a real set, or a raft laid from logs
   divine_fx    transparent parts: bolts, flame, mist, wind, a column of light, the god who stands in it
   environment  the weather or the fire as parts: a whirlpool of trans dishes, rain of round tiles, a hearth
   set_piece    maps and plans as tiled plates, a hearth, a scar shown on a figure
   sound_source the instrument, or the singers
   wearable     the costume on a figure

   Every build here comes out as real LDraw parts from this repository's library; the card tool audits them. */
'use strict';
const B = require('./build.js'), K = B.K;
const { fig, part, parts, kit, donor, group, at } = B;

/* colours (LDraw codes) */
const C = { black: 0, blue: 1, green: 2, red: 4, brown: 6, lgrey: 7, dgrey: 8, yellow: 14, white: 15, tan: 19, purple: 22, orange: 25, dtan: 28,
  tDBlue: 33, tGreen: 34, tRed: 36, tOrange: 57, tNeon: 38, tBlue: 43, tYellow: 46, tClear: 47, tPurple: 52, tBrown: 40,
  rbrown: 70, lbg: 71, dbg: 72, lilac: 85, silver: 179, dblue: 272, dgreen: 288, gold: 297, dbrown: 308, dred: 320, olive: 330, cgold: 334, sgreen: 378, azure: 322, dturq: 3, sblue: 379, nougat: 84 };

/* ── a seeded hand, so a card's variation is the same every run ── */
function rng(seed) { let h = 2166136261; for (const ch of String(seed)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } let s = h >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const choose = (r, a) => a[Math.floor(r() * a.length)];

/* ── the wardrobe: roles as figure specs ── */
const FACE = { man: '3626bp01', brows: '3626bp05', beard: '3626bp39', grey: '3626bp0a', old: '3626bp0e', stern: '3626bp0f', woman: '3626bp02', lady: '3626bp09', lips: '3626bp08', rough: '3626bp35', droop: '3626bp3n', angry: '3626bp3r', moustache: '3626bp03' };
const HAIR = { male: '3901', long: '11255', female: '12890', bun: '13251', wavy: '20595', braid: '13766', short: '11256', swept: '32602' };
const ROLES = {
  zeus: r => ({ torso: '973p0w', top: C.white, legs: C.white, face: FACE.grey, hat: ['18165', C.gold], beard: ['10052', C.white], R: ['27256', C.tYellow], cape: C.dblue }),
  poseidon: r => ({ torso: '973p2q', top: C.dturq, legs: C.dblue, face: FACE.beard, hat: ['18165', C.cgold], beard: ['10052', C.lbg], R: ['43899', C.gold] }),
  athena: r => ({ torso: '973p2z', top: C.silver, legs: C.white, face: FACE.lady, hat: ['98366', C.gold], R: ['4497', C.gold], L: ['3876', C.gold], cape: C.dblue }),
  hermes: r => ({ torso: '973p0w', top: C.white, legs: C.tan, face: FACE.man, hat: ['95676', C.gold], R: ['36752a', C.gold], cape: C.red }),
  goddess: r => ({ torso: '973p0w', top: choose(r, [C.white, C.dturq, C.lilac, C.azure]), legs: C.white, face: FACE.lips, hat: [choose(r, [HAIR.female, HAIR.bun, HAIR.braid]), choose(r, [C.black, C.dbrown, C.yellow])], R: ['36752a', C.gold] }),
  god: r => ({ torso: '973p0w', top: C.white, legs: C.white, face: FACE.beard, hat: ['39262', C.gold], beard: ['10052', C.lbg], cape: choose(r, [C.dred, C.dblue]) }),
  hero: r => ({ torso: '973p45', top: C.dred, legs: C.dtan, face: FACE.beard, hat: [HAIR.male, C.dbrown], R: ['3847', C.lbg], cape: C.dred }),
  warrior: r => ({ torso: choose(r, ['973p45', '973p41', '973p2z']), top: choose(r, [C.dred, C.rbrown, C.dtan]), legs: choose(r, [C.dtan, C.rbrown, C.dbrown]), face: choose(r, [FACE.beard, FACE.stern, FACE.rough]), hat: [choose(r, ['98366', '95676', '3844']), choose(r, [C.gold, C.lbg, C.dbg])], R: [choose(r, ['4497', '3847', '43899']), C.lbg], L: [choose(r, ['3876', '92747', '2586']), choose(r, [C.gold, C.dred, C.tan])] }),
  king: r => ({ torso: '973p1p', top: choose(r, [C.dred, C.purple, C.dblue]), legs: C.dtan, face: choose(r, [FACE.beard, FACE.grey]), hat: ['18165', C.gold], beard: r() < 0.5 ? ['10052', C.lbg] : null, R: ['95049', C.gold], cape: choose(r, [C.dred, C.purple]) }),
  queen: r => ({ torso: '973p0w', top: choose(r, [C.dred, C.purple, C.dblue, C.white]), legs: C.white, face: FACE.lady, hat: [HAIR.bun, choose(r, [C.dbrown, C.black])], L: ['33322', C.gold] }),
  woman: r => ({ torso: choose(r, ['973p0w', '973p3y', '973']), top: choose(r, [C.white, C.tan, C.dtan, C.sblue, C.sgreen, C.lilac]), legs: choose(r, [C.white, C.tan, C.dtan]), face: choose(r, [FACE.woman, FACE.lady, FACE.lips]), hat: [choose(r, [HAIR.female, HAIR.bun, HAIR.braid, HAIR.wavy]), choose(r, [C.black, C.dbrown, C.rbrown, C.yellow, C.dtan])] }),
  maid: r => ({ torso: choose(r, ['973p3y', '973']), top: choose(r, [C.tan, C.dtan, C.white]), legs: C.tan, face: FACE.woman, hat: [choose(r, [HAIR.bun, HAIR.female]), choose(r, [C.black, C.dbrown, C.rbrown])], R: [choose(r, ['3899', '2343', '4332']), choose(r, [C.white, C.gold, C.rbrown])] }),
  suitor: r => ({ torso: choose(r, ['973p1p', '973p0d', '973p3l']), top: choose(r, [C.dred, C.purple, C.dblue, C.dgreen, C.red]), legs: choose(r, [C.black, C.dtan, C.white]), face: choose(r, [FACE.brows, FACE.moustache, FACE.angry, FACE.droop]), hat: [choose(r, [HAIR.male, HAIR.short, HAIR.swept, HAIR.wavy]), choose(r, [C.black, C.dbrown, C.rbrown, C.yellow])], R: [choose(r, ['2343', '3899', '2343']), choose(r, [C.gold, C.silver])] }),
  servant: r => ({ torso: choose(r, ['973p3y', '973p3a', '973']), top: choose(r, [C.tan, C.dtan, C.rbrown]), legs: choose(r, [C.rbrown, C.dtan, C.tan]), face: choose(r, [FACE.man, FACE.rough, FACE.droop]), hat: [choose(r, [HAIR.male, HAIR.short]), choose(r, [C.dbrown, C.black, C.lbg])], R: [choose(r, ['4496', '3899', '4332']), C.rbrown] }),
  herdsman: r => ({ torso: '973p3y', top: choose(r, [C.rbrown, C.dtan, C.olive]), legs: C.rbrown, face: choose(r, [FACE.old, FACE.rough, FACE.droop]), hat: [HAIR.male, choose(r, [C.lbg, C.dbrown])], R: ['4496', C.rbrown], cape: C.rbrown }),
  beggar: r => ({ torso: '973p3a', top: C.dtan, legs: C.rbrown, face: FACE.old, hat: [HAIR.long, C.lbg], beard: ['10052', C.lbg], R: ['3957a', C.rbrown], back: ['10169', C.tan] }),
  seer: r => ({ torso: '973p0w', top: choose(r, [C.white, C.dtan, C.lbg]), legs: C.white, face: FACE.old, hat: [HAIR.long, C.white], beard: ['10052', C.white], R: ['95049', C.gold] }),
  bard: r => ({ torso: '973p1p', top: choose(r, [C.dblue, C.dred, C.white]), legs: C.white, face: FACE.old, hat: [HAIR.long, C.lbg], beard: ['15501', C.lbg], R: ['95050', C.gold] }),
  prince: r => ({ torso: '973p1p', top: C.dblue, legs: C.dtan, face: FACE.brows, hat: [HAIR.swept, C.dbrown], R: ['4497', C.lbg], cape: C.dblue }),
  sailor: r => ({ torso: choose(r, ['973p3y', '973p3a', '973p32']), top: choose(r, [C.white, C.tan, C.dtan, C.sblue]), legs: choose(r, [C.rbrown, C.dtan, C.dblue]), face: choose(r, [FACE.rough, FACE.beard, FACE.droop, FACE.man]), hat: [choose(r, [HAIR.male, HAIR.short, HAIR.long]), choose(r, [C.black, C.dbrown, C.rbrown])], R: ['2542', C.rbrown] }),
  shade: r => ({ ghost: C.tClear, ghostHead: C.white, face: FACE.stern }),
  giant: r => ({ troll: choose(r, [C.dtan, C.sgreen, C.dbg]), R: ['3957a', C.rbrown] }),
  cyclops: r => ({ troll: C.nougat, R: ['3957a', C.rbrown] }),
  nymph: r => ({ torso: '973p0w', top: choose(r, [C.sgreen, C.dturq, C.white]), legs: C.white, face: FACE.lips, hat: [choose(r, [HAIR.braid, HAIR.female]), choose(r, [C.yellow, C.dbrown])], R: ['19119c01', C.green] }),
  child: r => ({ torso: '973', top: C.tan, legs: C.dtan, face: FACE.man, hat: [HAIR.short, C.dbrown] }),
  dancer: r => ({ torso: '973p0w', top: choose(r, [C.white, C.lilac, C.dturq, C.yellow]), legs: C.white, face: choose(r, [FACE.woman, FACE.man]), hat: [choose(r, [HAIR.female, HAIR.short, HAIR.braid]), choose(r, [C.black, C.dbrown, C.yellow])] }),
};
/* characters by name: the role, and any dressing of their own */
const WHO = [
  [/^zeus/, 'zeus'], [/^poseidon/, 'poseidon'], [/^athena as herald/, 'athena'], [/^athena as mentes|^athena as mentor/, 'seer'], [/^athena as pitcher girl/, 'maid'], [/^athena as shepherd/, 'herdsman'], [/^athena/, 'athena'],
  [/^hermes/, 'hermes'], [/^calypso|^circe|^eidothea|^ino/, 'goddess'], [/^proteus|^aeolus/, 'god'], [/shade|phantom/, 'shade'],
  [/^polyphemus/, 'cyclops'], [/^antiphates/, 'giant'], [/odysseus as|beggar|^irus/, 'beggar'], [/^sleeping odysseus/, 'hero'], [/^odysseus|^young odysseus/, 'hero'],
  [/^telemachus|^pisistratus|^laodamas/, 'prince'], [/^alcinous|^nestor|^menelaus|^agamemnon|^minos|^laertes restored/, 'king'], [/^arete|^helen|^penelope|^clytemnestra/, 'queen'],
  [/^nausicaa/, 'queen'], [/^tiresias|^halitherses|^theoclymenus|^mentor|^aegyptius|^echeneus/, 'seer'], [/^demodocus|^phemius|medon and phemius/, 'bard'],
  [/^antinous|^eurymachus|^amphinomus|^ctesippus|^leiodes|^leocritus|^eupithes/, 'suitor'], [/^eumaeus|^philoetius|^dolius|^laertes|^melanthius/, 'herdsman'],
  [/^eurycleia|^melantho|^mill woman|^anticleia/, 'maid'], [/^medon|^eurybates/, 'servant'], [/^euryalus|^elpenor|^eurylochus|sailor/, 'sailor'], [/child/, 'child'],
  [/patroclus|achilles|ajax|heracles/, 'warrior'],
];
const roleOf = name => { for (const [re, role] of WHO) if (re.test(name)) return role; return 'servant'; };
const EXTRA = {   // the thing a character is known by, in hand
  'character.odysseus': s => ({ ...s, L: ['4499', C.rbrown] }), 'character.odysseus-restored': s => ({ ...s, torso: '973p2z', top: C.silver, cape: C.dred, L: ['4499', C.rbrown] }),
  'character.odysseus-revealed': s => ({ ...s, L: ['4499', C.rbrown], back: ['4498', C.rbrown] }), 'character.penelope-at-the-loom': s => ({ ...s, R: ['4332', C.rbrown] }),
  'character.circe': s => ({ ...s, top: C.purple, R: ['36752a', C.gold], L: ['2343', C.gold] }), 'character.calypso': s => ({ ...s, top: C.dturq, R: ['19119c01', C.green] }),
  'character.eurycleia': s => ({ ...s, hat: [HAIR.bun, C.white], face: FACE.old, R: ['2654a', C.lbg] }), 'character.argos': s => s,
  'character.helen-at-the-horse': s => ({ ...s, R: ['95050', C.gold] }), 'character.nausicaa': s => ({ ...s, top: C.white, R: ['4332', C.tan] }),
  'character.eumaeus': s => ({ ...s, R: ['3957a', C.rbrown], back: null }), 'character.proteus': s => ({ ...s, top: C.sblue, face: FACE.old, beard: ['10052', C.white] }),
  'character.two-seized-sailors': s => s, 'character.elpenor': s => ({ ...s, R: ['2542', C.rbrown] }),
};
function character(a) { const r = rng(a.id), role = roleOf(a.name.toLowerCase()), base = ROLES[role](r), spec = (EXTRA[a.id] || (s => s))(base); return { comps: [fig(spec, a.name.toLowerCase())], role, base: C.tan }; }

/* ── ensembles: the role, counted ── */
const NUM = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 12 };
const ENSEMBLE_ROLE = [[/sirens/, 'nymph'], [/gods/, 'god'], [/shades|heroines/, 'shade'], [/suitor|ambush/, 'suitor'], [/maids|women|wedding household/, 'maid'], [/dancers/, 'dancer'],
  [/cyclopes/, 'cyclops'], [/giants/, 'giant'], [/army|warriors|militia|host|greek warriors|sons|helpers|bearers|fight ring/, 'warrior'], [/crew|sailors|fleet|convoy|expedition|traders|scouts/, 'sailor'],
  [/herdsmen|eumaeus|telemachus, eumaeus/, 'herdsman'], [/servants|household/, 'servant'], [/lotus-eaters|people|listeners|assembly|families|dispersing/, 'woman'], [/tityus/, 'shade']];
function ensemble(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id); let n = 5; for (const [w, v] of Object.entries(NUM)) if (new RegExp('\\b' + w + '\\b').test(n0)) n = v;
  if (/^telemachus, eumaeus, and philoetius|^eumaeus and philoetius|^tityus/.test(n0)) n = n0.split(/,| and /).filter(s => s.trim()).length;
  let role = 'servant'; for (const [re, ro] of ENSEMBLE_ROLE) if (re.test(n0)) { role = ro; break; }
  const mixed = /people|assembly|families|listeners|reaction|uproar|wave|dispersing|feast/.test(n0);
  const figs = []; for (let i = 0; i < n; i++) { const ro = mixed ? choose(r, ['woman', 'servant', 'suitor', 'herdsman']) : role; figs.push(fig(ROLES[ro](r), ro + ' ' + (i + 1))); }
  if (/oars|rowing/.test(n0)) figs.forEach(f => f);
  return { comps: [group(n0, figs, { gap: 1, maxW: Math.min(20, 3 * Math.ceil(Math.sqrt(n)) + 2) })], role, base: C.tan };
}

/* ── creatures ── */
const ANIMALS = [
  [/horse|team/, ['10509', C.dbrown], 2], [/pig|swine|boar/, ['87621', C.nougat], 5], [/cattle|heifer|bulls|cow/, ['64452', C.rbrown], 3], [/goat|ram|ewe|flock/, ['95341', C.white], 5],
  [/dog|hound|argos/, ['92586', C.rbrown], 2], [/wolves|lions/, ['48812', C.dbg], 3], [/eagle|hawk/, ['11467', C.rbrown], 2], [/geese|goose|dove/, ['12891', C.white], 6], [/stag/, ['10509', C.rbrown], 1],
];
function creature(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id);
  if (/scylla/.test(n0)) return { comps: [parts('scylla', [['6086', C.dgreen, 0, 0, 0], ['6027', C.dgreen, -24, -40, 0], ['6027', C.dgreen, 24, -40, 0], ['6027', C.dgreen, 0, -48, 16]]), fig(ROLES.sailor(r), 'seized sailor')], base: C.dbg };
  if (/crew-to-swine/.test(n0)) return { comps: [fig(ROLES.sailor(r), 'sailor'), part('87621', C.nougat, { n: 3, name: 'swine' })], base: C.tan };
  if (/black bulls and altar/.test(n0)) return { comps: [part('64452', C.black, { n: 2, step: 100, name: 'black bulls' }), kit('altar fire', [K.box(0, 0, 2, 2, 1, C.lbg), K.part('3062b', C.orange, 0, 0, 1), K.part('3062b', C.yellow, 1, 1, 1)])], base: C.dtan };
  for (const [re, [id, col], n] of ANIMALS) if (re.test(n0)) {
    let count = n; for (const [w, v] of Object.entries(NUM)) if (new RegExp('\\b' + w + '\\b').test(n0)) count = Math.min(v, 8);
    if (/lead ram|great stag|parnassus boar|argos/.test(n0)) count = 1;
    const col2 = /black/.test(n0) ? C.black : /gold|silver/.test(n0) ? (/silver/.test(n0) ? C.silver : C.gold) : /boar/.test(n0) ? C.dbrown : col;
    const herd = []; for (let i = 0; i < count; i++) herd.push(part(id, /and silver/.test(n0) ? (i % 2 ? C.silver : C.gold) : col2, { name: n0.split(' ').pop() + ' ' + (i + 1) }));
    const extra = /stag/.test(n0) ? [part('1613', C.tan, { name: 'antlers' })] : /escape ram/.test(n0) ? [fig(ROLES.sailor(r), 'crewman under the ram')] : /festival|gilded heifer/.test(n0) ? [kit('altar', [K.box(0, 0, 2, 2, 1, C.white), K.part('3062b', C.orange, 0, 0, 1)])] : [];
    return { comps: [group(n0, herd, { gap: 1 }), ...extra], base: /eagle|hawk|geese|dove/.test(n0) ? C.lbg : C.green };
  }
  return { comps: [part('87621', C.nougat)], base: C.green };
}

/* ── props: the readymade a thing is ── */
const PROPS = [
  [/bow\b|odysseus's bow/, [['4499', C.rbrown]]], [/quiver/, [['4498', C.rbrown], ['4499', C.rbrown]]], [/arrow/, [['4499', C.rbrown]]], [/twelve axe/, 'axes'],
  [/sword/, [['3847', C.lbg]]], [/spear/, [['4497', C.gold]]], [/cup|goblet|drugged/, [['2343', C.gold]]], [/mixing bowl|basin|pitcher/, [['2654a', C.silver], ['4429', C.gold]]],
  [/wine skin|bag of winds|begging bag|barley bags|laundry bundles|bag\b/, [['10169', C.tan]]], [/wine jars|jars|milk vessels/, [['4429', C.tan], ['4429', C.tan], ['4429', C.rbrown]]],
  [/wand/, [['36752a', C.gold]]], [/staff/, [['95049', C.gold]]], [/lyre/, [['95050', C.gold]]], [/aegis/, [['3876', C.gold]]], [/sandals/, [['11100', C.gold], ['11100', C.gold]]],
  [/body/, 'body'], [/oar/, [['2542', C.rbrown]]], [/loom|shroud/, 'loom'], [/millstone|mills/, 'mill'], [/stone|rocks/, 'stone'], [/stake/, [['3957a', C.rbrown]]], [/cable|rope/, [['30104', C.dbg]]],
  [/table|feast|meal|sausages|meat|ambrosia|victory/, 'table'], [/chest|treasure|gifts|gift/, 'chest'], [/bed/, 'bed'], [/chair|footstool/, 'chair'], [/armor|armour|weapon/, 'rack'],
  [/cloak|tunic|garments|clothing|veil|rags/, 'garment'], [/moly|lotus|leafy|branch/, [['19119c01', C.green], ['2417', C.green]]], [/ball/, [['3068b', C.white]]], [/discus/, [['4032', C.lbg]]],
  [/fire|tallow/, 'fire'], [/tools|shipbuilding/, [['3835', C.lbg], ['4522b', C.rbrown], ['18826', C.lbg]]], [/doors|gate/, 'door'], [/hoof/, [['3957a', C.dbrown]]], [/cheese/, 'table'],
];
function prop(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id);
  for (const [re, how] of PROPS) if (re.test(n0)) {
    if (Array.isArray(how)) return { comps: [group(n0, how.map(([id, col]) => part(id, col)), { gap: 1 })], base: C.dtan };
    return { comps: [PROP_KITS[how](n0, r)], base: C.dtan };
  }
  return { comps: [PROP_KITS.chest(n0, r)], base: C.dtan };
}
const PROP_KITS = {
  axes: n => { const l = []; for (let i = 0; i < 12; i++) l.push(['3835', C.lbg, i * 40, 0, 0]); return parts('twelve axe heads in a row', l); },
  loom: n => kit('loom', [K.part('3062b', C.rbrown, 0, 0, 0), K.part('3062b', C.rbrown, 0, 0, 1), K.part('3062b', C.rbrown, 0, 0, 2), K.part('3062b', C.rbrown, 0, 0, 3), K.part('3062b', C.rbrown, 5, 0, 0), K.part('3062b', C.rbrown, 5, 0, 1), K.part('3062b', C.rbrown, 5, 0, 2), K.part('3062b', C.rbrown, 5, 0, 3), K.slab(0, 0, 6, 1, C.rbrown, { y: 4 }), K.box(1, 0, 4, 1, 3, /shroud/.test(n) ? C.white : C.tan)]),
  mill: n => kit('millstone', [K.box(0, 0, 4, 4, 1, C.dbg), K.slab(0, 0, 4, 4, C.lbg, { y: 1 }), K.part('3941', C.lbg, 1, 1, 1, { plate: 1 })]),
  stone: n => kit('stone', [K.box(0, 0, 4, 4, 2, C.dbg), K.roof(0, 0, 4, 4, 2, 'hip', C.dbg)]),
  table: n => kit('table', [K.part('3062b', C.rbrown, 0, 0, 0), K.part('3062b', C.rbrown, 5, 0, 0), K.part('3062b', C.rbrown, 0, 3, 0), K.part('3062b', C.rbrown, 5, 3, 0), K.slab(0, 0, 6, 4, C.rbrown, { y: 1 }), K.part('3062b', C.yellow, 1, 1, 1, { plate: 1 }), K.part('3062b', C.red, 3, 2, 1, { plate: 1 }), K.part('3062b', C.white, 4, 1, 1, { plate: 1 })]),
  chest: n => group('chest', [kit('chest', [K.box(0, 0, 4, 2, 1, C.rbrown), K.slab(0, 0, 4, 2, C.gold, { y: 1 })]), part('2343', C.gold), part('30153', C.tRed)]),
  bed: n => group('olive bed', [kit('bed', [K.box(0, 0, 4, 6, 1, C.rbrown), K.slab(0, 0, 4, 6, C.white, { y: 1 })]), kit('olive stump', [K.part('3941', C.rbrown, 0, 0, 0), K.part('3941', C.rbrown, 0, 0, 1), K.part('3941', C.rbrown, 0, 0, 2)])]),
  chair: n => kit('chair', [K.box(0, 0, 2, 2, 1, C.rbrown), K.box(0, 0, 2, 1, 2, C.rbrown, { y: 1 })]),
  rack: n => group('arms', [part('98366', C.gold), part('3876', C.gold), part('4497', C.lbg), part('3847', C.lbg), part('973p2z', C.silver)]),
  garment: n => group('garment', [part(/rags/.test(n) ? '973p3a' : '973p0w', /rags/.test(n) ? C.dtan : C.white), part('4524', /veil/.test(n) ? C.white : C.dred)]),
  fire: n => kit('fire', [K.fire(0, 0)]),
  door: n => kit('doors', [K.box(0, 0, 6, 1, 1, C.lbg), K.door(1, 0, 's', 1, C.rbrown)]),
  body: n => group('body', [fig({ ...ROLES.sailor(rng(n)), R: null }, 'laid out'), part('2542', C.rbrown)]),
};

/* ── divine effects, environments, sound, set pieces ── */
const column = (col, h, x = 0, z = 0) => { const o = []; for (let i = 0; i < h; i++) o.push(K.part('3062b', col, x, z, i)); return o; };
const cloud = (col, w = 6, d = 4) => kit('cloud', [K.box(0, 0, w, d, 1, col), K.roof(0, 0, w, d, 1, 'hip', col)]);
function fx(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id);
  if (/thunderbolt|thunder/.test(n0)) return { comps: [cloud(C.dbg), part('27256', C.tYellow, { n: 3, step: 40, name: 'bolts' }), ...(/zeus/.test(n0) ? [fig(ROLES.zeus(r), 'zeus')] : [])], base: C.dbg };
  if (/mist|darkness|concealment|concealing/.test(n0)) return { comps: [cloud(C.tClear, 8, 6), cloud(C.white, 6, 4), cloud(C.tClear, 4, 4)], base: C.lbg };
  if (/wind/.test(n0)) return { comps: [kit('wind', [...column(C.tClear, 4, 0, 0), ...column(C.tClear, 3, 3, 1), ...column(C.tClear, 5, 6, 0)]), part('4495b', C.white, { name: 'streamer' })], base: C.sblue };
  if (/lamp|golden/.test(n0)) return { comps: [part('3959', C.gold), part('3062b', C.tYellow, { n: 3, step: 20, name: 'light' }), fig(ROLES.athena(r), 'athena')], base: C.dbg };
  if (/eagle|birdlike|sea-eagle/.test(n0)) return { comps: [fig(ROLES.athena(r), 'athena'), part('11467', C.rbrown, { name: 'sea eagle' })], base: C.lbg };
  if (/transformation|disguise|shepherd-to-goddess|proteus/.test(n0)) return { comps: [fig(ROLES.beggar(r), 'before'), kit('change', column(C.tClear, 3)), fig(/proteus/.test(n0) ? ROLES.god(r) : ROLES.athena(r), 'after'), ...(/proteus/.test(n0) ? [part('48812', C.dbg, { name: 'lion' }), part('30115', C.green, { name: 'serpent' })] : [])], base: C.lbg };
  if (/oath|decree|peace|vow/.test(n0)) return { comps: [kit('oath stone', [K.box(0, 0, 4, 2, 2, C.white), K.slab(0, 0, 4, 2, C.gold, { y: 2 })]), fig(ROLES.athena(r), 'witness'), fig(ROLES.king(r), 'swearer')], base: C.white };
  if (/memory|tableau|field|song|genealogy|life-story|dream|phantom|imagined|embrace|mourning|grief|attention|restoration|beautification|courage|emphasis|doom|curse|prophecy|path|absence|complaint|descent|flight|dawn|river god/.test(n0)) {
    const who = /penelope/.test(n0) ? 'queen' : /troy|trojan|neoptolemus|armed/.test(n0) ? 'warrior' : /poseidon/.test(n0) ? 'poseidon' : /helios/.test(n0) ? 'god' : /athena/.test(n0) ? 'athena' : /orestes|aegisthus|murder/.test(n0) ? 'king' : /ares|aphrodite|hephaestus/.test(n0) ? 'god' : /river god/.test(n0) ? 'god' : /ithaca|family|master/.test(n0) ? 'hero' : 'shade';
    const glow = /poseidon|sea|river/.test(n0) ? C.tBlue : /dawn|restoration|beautification|courage|helios/.test(n0) ? C.tYellow : /grief|mourning|melting/.test(n0) ? C.tClear : /curse|doom|murder|sack/.test(n0) ? C.tRed : C.tPurple;
    const n = /tableau|song|family|genealogy/.test(n0) ? 3 : 1, figs = []; for (let i = 0; i < n; i++) figs.push(fig(ROLES[i ? choose(r, ['queen', 'hero', 'god', 'woman']) : who](r), who + ' ' + (i + 1)));
    return { comps: [kit('frame of ' + (glow === C.tRed ? 'blood' : 'light'), [...column(glow, 5, 0, 0), ...column(glow, 5, 5, 0), K.slab(0, 0, 6, 1, glow, { y: 5 })]), ...figs], base: C.dbg };
  }
  return { comps: [kit('column of light', column(C.tClear, 6)), fig(ROLES.athena(r), 'goddess')], base: C.dbg };
}
function environment(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id);
  if (/charybdis/.test(n0)) return { comps: [parts('whirlpool', [['3961', C.tDBlue, 0, 0, 0], ['44375b', C.tBlue, 0, -8, 0], ['3960', C.white, 0, -16, 0], ['4740', C.tDBlue, 0, -24, 0]])], base: C.dblue };
  if (/storm|surge|contrary/.test(n0)) return { comps: [cloud(C.dbg, 8, 6), part('27256', C.tYellow, { n: 2, step: 60 }), kit('waves', [K.box(0, 0, 8, 2, 1, C.tDBlue), K.roof(0, 0, 8, 2, 1, 'gable', C.tBlue)])], base: C.dblue };
  if (/winds/.test(n0)) return { comps: [part('10169', C.tan, { name: 'bag of winds' }), kit('winds', column(C.tClear, 4)), cloud(C.tClear, 4, 4)], base: C.lbg };
  if (/fire|logs|sulfur/.test(n0)) return { comps: [kit('fire', [K.fire(0, 0)]), ...(/logs|hut/.test(n0) ? [kit('logs', [K.log(0, 0, 6, C.rbrown)])] : []), ...(/sulfur/.test(n0) ? [part('3062b', C.yellow, { n: 3, step: 20, name: 'sulfur' })] : [])], base: C.dbg };
  if (/rain|cold/.test(n0)) return { comps: [cloud(C.dbg, 6, 4), kit('rain', [...column(C.tClear, 2, 0, 0), ...column(C.tClear, 3, 2, 1), ...column(C.tClear, 2, 4, 0)]), fig({ ...ROLES.beggar(r) }, 'odysseus in the cold')], base: C.dbg };
  if (/foam|following wind/.test(n0)) return { comps: [kit('sea', [K.box(0, 0, 8, 4, 1, C.tDBlue), K.slab(0, 0, 8, 1, C.white, { y: 1 })]), part('4495b', C.white)], base: C.dblue };
  if (/ithaca revealed/.test(n0)) return { comps: [kit('ithaca', [K.box(0, 0, 8, 6, 2, C.dtan), K.roof(0, 0, 8, 6, 2, 'hip', C.green)]), kit('olive', [K.tree(0, 0, 3, { r: 2, leaf: C.olive })])], base: C.tDBlue };
  if (/feast cycle/.test(n0)) return { comps: [PROP_KITS.table(n0), fig(ROLES.hero(r), 'odysseus'), fig(ROLES.goddess(r), 'circe')], base: C.dtan };
  return { comps: [cloud(C.lbg)], base: C.dbg };
}
function sound(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id);
  if (/bow-string/.test(n0)) return { comps: [part('4499', C.rbrown), fig({ ...ROLES.hero(r), R: null, L: ['4499', C.rbrown] }, 'odysseus stringing')], base: C.dtan };
  if (/wedding music|feast noise/.test(n0)) return { comps: [fig(ROLES.bard(r), 'singer'), fig(ROLES.dancer(r), 'dancer'), fig(ROLES.dancer(r), 'dancer'), fig(ROLES.suitor(r), 'suitor')], base: C.dtan };
  if (/wives|voices/.test(n0)) return { comps: [kit('wooden horse flank', [K.box(0, 0, 6, 2, 2, C.rbrown)]), fig(ROLES.queen(r), 'helen')], base: C.dtan };
  if (/sneeze/.test(n0)) return { comps: [fig(ROLES.prince(r), 'telemachus'), fig(ROLES.queen(r), 'penelope')], base: C.dtan };
  if (/chorus/.test(n0)) return { comps: [group('chorus', [0, 1, 2, 3, 4].map(i => fig(ROLES.shade(r), 'shade ' + (i + 1))))], base: C.dbg };
  return { comps: [fig(ROLES.bard(r), 'singer')], base: C.dtan };
}
function setPiece(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id);
  if (/map|route|plan|instructions/.test(n0)) { const sea = [], land = C.dtan, route = /underworld/.test(n0) ? C.dred : C.rbrown; for (let i = 0; i < 8; i += 2) for (let j = 0; j < 6; j += 2) sea.push(K.slab(i, j, 2, 2, (i * 3 + j) % 5 < 2 ? land : C.tDBlue)); for (let i = 0; i < 8; i++) sea.push(K.part('3024', route, i, 2 + ((i >> 1) % 2), 0, { plate: 1 }));
    return { comps: [kit('map', sea), ...(/suitor|force|ambush/.test(n0) ? [group('markers', [0, 1, 2, 3].map(i => part('3062b', C.red)))] : [])], base: C.white }; }
  if (/lane|threshold|formation/.test(n0)) return { comps: [PROP_KITS.axes(n0), fig({ ...ROLES.hero(r), L: ['4499', C.rbrown] }, 'archer')], base: C.dtan };
  if (/blood|pit|cave floor/.test(n0)) return { comps: [kit('pit', [K.box(0, 0, 6, 6, 1, C.dbg, { hollow: true }), K.slab(1, 1, 4, 4, C.dred)]), fig(ROLES.shade(r), 'shade')], base: C.dbg };
  if (/scar|boar/.test(n0)) return { comps: [fig(ROLES.beggar(r), 'odysseus'), fig(ROLES.maid(r), 'eurycleia'), part('2654a', C.silver, { name: 'basin' }), ...(/boar/.test(n0) ? [part('87621', C.dbrown, { name: 'boar' })] : [])], base: C.dtan };
  if (/fig tree/.test(n0)) return { comps: [kit('fig tree', [K.tree(0, 0, 4, { r: 2, leaf: C.dgreen })]), kit('rock', [K.rock(0, 0, 6, 6, 2, C.dbg)])], base: C.tDBlue };
  if (/olive leaf|shelter/.test(n0)) return { comps: [kit('leaf bed', [K.bush(0, 0, 6, 4, C.olive)]), fig(ROLES.beggar(r), 'sleeper')], base: C.dtan };
  if (/hearth/.test(n0)) return { comps: [kit('hearth', [K.box(0, 0, 6, 6, 1, C.dbg, { hollow: true }), K.part('3062b', C.orange, 2, 2, 0), K.part('3062b', C.yellow, 3, 3, 0), K.part('3062b', C.tOrange, 2, 3, 1)])], base: C.lbg };
  if (/inventory|orchard/.test(n0)) return { comps: [0, 1, 2].map(i => kit('tree ' + (i + 1), [K.tree(0, 0, 3, { r: 2, leaf: choose(r, [C.green, C.olive, C.dgreen]) })])), base: C.green };
  return { comps: [kit('marker', column(C.white, 3))], base: C.dtan };
}
function wearable(a) { const n0 = a.name.toLowerCase(), r = rng(a.id); return { comps: [fig(/rags/.test(n0) ? ROLES.beggar(r) : { ...ROLES.herdsman(r), cape: C.dbrown }, n0), PROP_KITS.garment(n0)], base: C.tan }; }

/* ── vehicles ── */
function raft(n0) { const ops = []; for (let i = 0; i < 6; i++) ops.push(K.box(i * 2, 0, 2, 10, 1, C.rbrown)); ops.push(...column(C.rbrown, 6, 5, 4)); return kit(n0.includes('storm') ? 'broken raft' : 'raft', ops); }
function vehicle(a) {
  const n0 = a.name.toLowerCase(), r = rng(a.id);
  if (/raft/.test(n0)) return { comps: [raft(n0), ...(/storm/.test(n0) ? [fig(ROLES.hero(r), 'odysseus'), kit('wave', [K.box(0, 0, 6, 2, 1, C.tDBlue)])] : [])], base: C.tDBlue };
  if (/chariot/.test(n0)) return { comps: [donor('6799', '6799 - Carrige.ldr', { name: 'chariot' }), part('10509', C.white, { n: 2, step: 60, name: 'horses' }), ...(/gift/.test(n0) ? [PROP_KITS.chest(n0)] : [])], base: C.dtan };
  if (/wagon/.test(n0)) return { comps: [donor('6716', '6716 - Wagon.ldr', { name: 'wagon' }), part('10509', C.dbrown, { name: 'mule' }), part('10169', C.white, { n: 2, step: 40, name: 'laundry' })], base: C.dtan };
  if (/twelve-ship|fleet|destroyed/.test(n0)) { const n = /twelve/.test(n0) ? 6 : 4, boats = []; for (let i = 0; i < n; i++) boats.push(donor(i % 2 ? '6279' : '6285', i % 2 ? '6279 - Boat 1.ldr' : '6285 - jollyboat.ldr', { name: 'ship ' + (i + 1), noFlex: true }));
    return { comps: [group(n0, boats, { gap: 2 })], base: C.tDBlue }; }
  if (/convoy|phaeacian/.test(n0)) return { comps: [donor('6286', null, { name: 'phaeacian ship' })], base: C.tDBlue };
  return { comps: [donor('6285', null, { name: 'black ship' })], base: C.tDBlue };
}

/* ── locations: a real set foraged, and what the scene needs laid beside it ── */
const trees = (n, r, leaf = C.green) => Array.from({ length: n }, (_, i) => kit('tree ' + (i + 1), [K.tree(0, 0, 3 + Math.floor(r() * 3), { r: 2 + (r() < 0.4 ? 1 : 0), leaf: choose(r, [leaf, C.dgreen, C.olive]) })]));
const rocks = (n, r, col = C.dbg) => Array.from({ length: n }, (_, i) => kit('rock ' + (i + 1), [K.rock(0, 0, 3 + Math.floor(r() * 3), 3 + Math.floor(r() * 3), 1 + Math.floor(r() * 3), col)]));
const water = (w, d) => kit('water', [K.slab(0, 0, w, d, C.tDBlue)]);
const colonnade = (n = 6, col = C.white) => { const o = [K.slab(0, 0, n * 3, 6, col)]; for (let i = 0; i < n; i++) { o.push(...column(col, 6, i * 3 + 1, 1).map(p => ({ ...p, y: p.y + 0, plate: 1 })), ...column(col, 6, i * 3 + 1, 4).map(p => ({ ...p, plate: 1 }))); } o.push(K.slab(0, 0, n * 3, 6, col, { y: 6, plateOffset: 1 })); return kit('colonnade', o); };
const hall = (name, w, d, col, floor = C.tan) => kit(name, [K.slab(0, 0, w, d, floor), K.wall ? { op: 'wall', from: [0, 0], to: [w - 1, 0], h: 4, col } : K.box(0, 0, w, 1, 4, col), K.box(0, 0, 1, d, 4, col, { y: 0 }), K.box(w - 1, 0, 1, d, 4, col), ...[4, w - 5].flatMap(x => column(C.white, 5, x, Math.floor(d / 2)).map(p => ({ ...p, plate: 1 }))), K.box(Math.floor(w / 2) - 2, Math.floor(d / 2) - 2, 4, 4, 1, C.dbg, { hollow: true, plateOffset: 1 }), K.part('3062b', C.orange, Math.floor(w / 2) - 1, Math.floor(d / 2) - 1, 0, { plate: 1 })]);
const hut = (name, col = C.rbrown) => kit(name, [K.box(0, 0, 8, 6, 3, col, { hollow: true }), K.door(3, 5, 's', 0, C.rbrown), K.roof(0, 0, 8, 6, 3, 'gable', C.dtan)]);
const seats = (n = 3, col = C.lbg) => kit('stone seats', [K.stairs(0, 0, 's', n, 10, col)]);
const altar = () => kit('altar', [K.box(0, 0, 3, 2, 1, C.white), K.part('3062b', C.orange, 1, 0, 1), K.part('3062b', C.yellow, 1, 1, 1)]);
/* each location: its components (the first the donor set, if any) */
const LOC = {
  'location.aeaea-coast-and-forest': r => [donor('6071', null, { name: "forestmen's crossing" }), ...trees(3, r)],
  'location.aeaea-funeral-shore': r => [donor('ithaca-cove', null, { name: 'shore', crop: [-16, -16, 16, 16] }), altar(), part('2542', C.rbrown, { name: "elpenor's oar" })],
  'location.aeolia-floating-island': r => [donor('6276', null, { name: 'fortress island' }), donor('6264', null, { name: 'bronze-walled island', crop: [-20, -14, 20, 14] })],
  'location.alcinouss-palace': r => [donor('21022', null, { name: 'palace colonnade' }), kit('gold dogs', [K.part('3062b', C.gold, 0, 0, 0), K.part('3062b', C.silver, 3, 0, 0)])],
  'location.cimmerian-shore-and-underworld-pit': r => [donor('cave-of-shadows', null, { name: 'underworld', crop: [-20, -16, 20, 16] }), setPiece({ id: 'pit', name: 'blood-pit boundary' }).comps[0]],
  'location.circes-forest-palace': r => [donor('21325', null, { name: "circe's hall" }), ...trees(2, r)],
  'location.cyclops-beach-and-waiting-ship': r => [donor('6285', '6285 - jollyboat.ldr', { name: 'waiting ship', noFlex: true }), ...rocks(3, r), water(12, 8)],
  'location.cyclops-coast': r => [donor('6279', '6279 - Island.ldr', { name: 'cyclops coast' }), part('95341', C.white, { n: 3, name: 'goats' })],
  'location.eumaeus-hut-interior': r => [donor('6066', '6066 - Building rock side.ldr', { name: 'hut' }), kit('hearth', [K.fire(0, 0)]), part('87621', C.nougat, { n: 2 })],
  'location.eumaeuss-pig-farm': r => [hut('swineherd hut'), kit('sties', [K.box(0, 0, 12, 8, 1, C.rbrown, { hollow: true })]), part('87621', C.nougat, { n: 4, name: 'pigs' }), part('92586', C.rbrown, { name: 'dog' })],
  'location.farm-battlefield-at-peace': r => [hut('laertes farm'), ...trees(2, r, C.olive), kit('field wall', [K.box(0, 0, 16, 1, 1, C.dbg)])],
  'location.farm-to-palace-route': r => [kit('road', [K.slab(0, 0, 6, 24, C.dtan)]), ...trees(3, r, C.olive), ...rocks(2, r)],
  'location.farmhouse-feast': r => [hut('farmhouse'), PROP_KITS.table('feast')],
  'location.feast-hall-at-attentive-silence': r => [hall('feast hall', 24, 16, C.tan), PROP_KITS.table('feast'), PROP_KITS.table('feast')],
  'location.fight-threshold': r => [donor('6080', '6080 - Front.ldr', { name: 'threshold' }), PROP_KITS.axes('')],
  'location.forest-meeting-path': r => [donor('forest-clearing', null, { name: 'forest path', crop: [-20, -8, 20, 8] })],
  'location.goat-island-harbor': r => [donor('6278', null, { name: 'goat island', crop: [-20, -16, 20, 16] }), part('95341', C.white, { n: 4, name: 'goats' })],
  'location.hand-mills-and-grain-room': r => [hall('grain room', 16, 12, C.tan), PROP_KITS.mill(''), PROP_KITS.mill(''), part('10169', C.tan, { n: 3, step: 40, name: 'grain sacks' })],
  'location.island-of-syria-memory': r => [donor('6245', '6245 - Harbor Sentry.ldr', { name: 'harbour' }), hut('syrian house', C.white)],
  'location.ismarus-coast-and-town': r => [donor('21041', null, { name: 'town wall' }), hut('ciconian house', C.white), water(10, 6)],
  'location.ithaca-town-road-and-fountain': r => [kit('road', [K.slab(0, 0, 6, 20, C.dtan)]), kit('fountain', [K.box(0, 0, 6, 6, 1, C.white, { hollow: true }), K.slab(1, 1, 4, 4, C.tDBlue), ...column(C.white, 3, 2, 2)]), ...trees(2, r, C.olive)],
  'location.ithacan-assembly-ground': r => [seats(3), seats(3), kit('speaker stone', [K.box(0, 0, 2, 2, 1, C.white)])],
  'location.ithacan-meeting-and-funeral-ground': r => [seats(2), altar(), ...trees(2, r, C.olive)],
  'location.ithacan-shore': r => [donor('ithaca-cove', null, { name: 'ithacan shore', crop: [-20, -16, 20, 16] })],
  'location.laertess-orchard': r => [...trees(6, r, C.olive), kit('terrace wall', [K.box(0, 0, 16, 1, 1, C.dbg)])],
  'location.lotus-shore-and-meadow': r => [donor('6278', null, { name: 'lotus shore', crop: [-20, -16, 20, 16] }), part('19119c01', C.green, { n: 3, step: 40, name: 'lotus' })],
  'location.marriage-chamber': r => [hall('chamber', 16, 12, C.tan), PROP_KITS.bed('')],
  'location.megaron-hall': r => [hall('megaron', 28, 20, C.tan, C.dtan), colonnade(4, C.white)],
  'location.menelauss-palace': r => [donor('21022', null, { name: "menelaus's colonnade" }), PROP_KITS.chest('gold')],
  'location.mount-parnassus-hunt': r => [...rocks(4, r), ...trees(3, r, C.dgreen), part('87621', C.dbrown, { name: 'boar' })],
  'location.narrow-monster-strait': r => [donor('6279', '6279 - Island.ldr', { name: 'scylla rock' }), environment({ id: 'charybdis', name: 'charybdis' }).comps[0], water(12, 8)],
  'location.nestors-palace-and-courtyard': r => [donor('21022', null, { name: "nestor's palace" }), seats(2)],
  'location.nymph-cave': r => [donor('7327', '7327 - Stairway.ldr', { name: 'cave mouth' }), ...rocks(3, r), part('4429', C.tan, { n: 2, name: 'mixing bowls' })],
  'location.odysseuss-palace-threshold-and-hall': r => [donor('6080', '6080 - Front.ldr', { name: 'palace front' }), hall('hall', 20, 14, C.tan, C.dtan)],
  'location.ogygia-cavern-and-grove': r => [donor('ogygia-grove', null, { name: 'ogygia grove', crop: [-20, -16, 20, 16] })],
  'location.ogygia-shore': r => [donor('ogygia-grove', null, { name: 'ogygia shore', crop: [-20, -16, 20, 16] }), water(12, 6)],
  'location.ogygia-timber-grove': r => [...trees(6, r, C.dgreen), kit('felled logs', [K.log(0, 0, 8, C.rbrown), K.log(0, 3, 8, C.rbrown)])],
  'location.olympian-council-hall': r => [donor('21022', null, { name: 'olympian hall' }), cloud(C.white, 10, 6)],
  'location.olympian-decision-space': r => [colonnade(4, C.white), cloud(C.white, 10, 6), cloud(C.tClear, 6, 4)],
  'location.palace-dung-heap-and-gate': r => [donor('6080', '6080 - Drawbridge.ldr', { name: 'gate' }), kit('dung heap', [K.rock(0, 0, 6, 4, 1, C.dbrown)])],
  'location.palace-outer-yard': r => [donor('6080', '6080 - Back Left.ldr', { name: 'outer wall' }), kit('yard', [K.slab(0, 0, 16, 12, C.dtan)]), altar()],
  'location.palace-storeroom': r => [hall('storeroom', 16, 12, C.tan), part('4429', C.tan, { n: 4, name: 'wine jars' }), PROP_KITS.chest('')],
  'location.phaeacian-assembly-ground': r => [seats(3, C.white), seats(3, C.white)],
  'location.phaeacian-athletic-field': r => [kit('field', [K.slab(0, 0, 24, 16, C.green)]), part('4032', C.lbg, { name: 'discus' }), seats(2, C.white)],
  'location.phaeacian-feast-hall': r => [hall('phaeacian hall', 24, 16, C.white, C.tan), PROP_KITS.table('feast')],
  'location.phaeacian-orchard-and-garden': r => [...trees(6, r, C.green), kit('spring', [K.box(0, 0, 4, 4, 1, C.white, { hollow: true }), K.slab(1, 1, 2, 2, C.tDBlue)])],
  'location.phaeacian-royal-chamber': r => [hall('royal chamber', 16, 12, C.white, C.tan), PROP_KITS.chair(''), PROP_KITS.chair('')],
  'location.phorcys-harbor': r => [donor('ithaca-cove', null, { name: "phorcys's harbour", crop: [-20, -16, 20, 16] }), trees(1, r, C.olive)[0]],
  'location.polyphemuss-cave': r => [donor('6279', '6279 - Island.ldr', { name: 'cave' }), PROP_KITS.stone(''), kit('cheese racks', [K.box(0, 0, 6, 1, 3, C.rbrown)])],
  'location.punishment-landscape': r => [...rocks(4, r, C.dbg), kit('boulder hill', [K.stairs(0, 0, 'e', 6, 4, C.dbg)])],
  'location.pylos-harbor': r => [donor('6285', null, { name: 'pylian harbour ship', crop: [-17, -20, 17, 20] })],
  'location.pylos-sacrificial-beach': r => [donor('ithaca-cove', null, { name: 'beach', crop: [-20, -16, 20, 16] }), part('64452', C.black, { n: 3, step: 100, name: 'black bulls' }), altar()],
  'location.pylos-to-sparta-road': r => [kit('road', [K.slab(0, 0, 6, 28, C.dtan)]), donor('6799', '6799 - Carrige.ldr', { name: 'chariot' }), ...trees(2, r, C.olive)],
  'location.river-washing-pools': r => [donor('7410', null, { name: 'river' }), water(10, 6), part('10169', C.white, { n: 2, name: 'laundry' })],
  'location.road-from-river-to-scheria': r => [kit('road', [K.slab(0, 0, 6, 24, C.dtan)]), ...trees(3, r, C.olive), donor('6716', '6716 - Wagon.ldr', { name: 'mule cart' })],
  'location.road-to-hades': r => [donor('cave-of-shadows', null, { name: 'road down', crop: [-20, -10, 20, 10] })],
  'location.road-to-laertess-farm': r => [kit('road', [K.slab(0, 0, 6, 24, C.dtan)]), ...trees(4, r, C.olive)],
  'location.scheria-city-and-harbor': r => [donor('6286', null, { name: 'phaeacian ship', crop: [-16, -20, 16, 20] }), donor('21041', null, { name: 'city wall' })],
  'location.scherian-coast-and-river-mouth': r => [donor('7410', null, { name: 'river mouth' }), ...trees(2, r, C.olive), water(12, 8)],
  'location.seal-beach': r => [donor('7326', '7326 - Sphinx.ldr', { name: 'pharos sphinx' }), part('3399', C.lbg, { n: 4, step: 60, name: 'seals' }), water(10, 6)],
  'location.secret-ithacan-landing': r => [donor('6066', null, { name: 'secret landing' }), water(10, 6)],
  'location.sirens-island': r => [donor('6278', null, { name: "sirens' island", crop: [-20, -16, 20, 16] }), kit('bones', [K.box(0, 0, 4, 2, 1, C.white)])],
  'location.telepylus-harbor': r => [donor('6279', '6279 - Island.ldr', { name: 'harbour cliffs' }), donor('6279', '6279 - Boat 1.ldr', { name: 'trapped boat' })],
  'location.thrinacia': r => [donor('6264', null, { name: 'thrinacia', crop: [-20, -14, 20, 14] }), part('64452', C.white, { n: 3, step: 100, name: "helios's cattle" })],
  'location.troy-interior-memory-set': r => [donor('21041', null, { name: 'walls of troy' }), donor('7327', '7327 - Column with Arch.ldr', { name: 'gate arch' })],
  'location.upper-chamber-and-stair': r => [hall('upper chamber', 16, 12, C.tan), kit('stair', [K.stairs(0, 0, 'e', 6, 3, C.lbg)])],
  'location.weapon-storeroom': r => [hall('weapon room', 14, 10, C.tan), PROP_KITS.rack('')],
  'location.wooden-horse-interior': r => [kit('horse belly', [K.box(0, 0, 16, 8, 3, C.rbrown, { hollow: true }), K.roof(0, 0, 16, 8, 3, 'gable', C.rbrown)]), group('hidden', [0, 1, 2].map(i => fig(ROLES.warrior(rng('h' + i)), 'hidden warrior')))],
};
function location(a) { const r = rng(a.id); const f = LOC[a.id]; if (f) return { comps: f(r).flat(), base: C.green, set: true }; return { comps: [...trees(2, r), ...rocks(2, r)], base: C.green, set: true, fallback: true }; }

const BY_TYPE = { character, ensemble, creature, prop, divine_fx: fx, environment, sound_source: sound, set_piece: setPiece, wearable, vehicle, location };
function recipe(a) { const f = BY_TYPE[a.type]; if (!f) throw new Error('no recipe for type ' + a.type); return f(a); }
module.exports = { recipe, ROLES, C, rng, LOC, roleOf };
