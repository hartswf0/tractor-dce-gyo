#!/usr/bin/env node
/* tools/forage/kit.js — everything found for building the Odyssey in LDraw, as cards: the set-design sub-assemblies (KIT), the stud-built and
   foraged furniture (FURN), the props the keyframes stage (odyssey/keyframes/props.json), and the raw parts discovered in the library for
   terrain, plants, water, ships, rigging, rope and creatures. Each becomes odyssey/cards/kit.<name>.mpd and a card of type 'kit' in
   odyssey/forage.json (so the forage viewer shows it), and odyssey/kit.json holds the catalogue for odyssey-kit.html: category, the parts
   with their LDraw titles and colours, and where each is used (sets, keyframe stills).
   Run after tools/odyssey-forage.js (which rewrites forage.json), then tools/forage/packs.js, then render thumbnails:
     node tools/forage/kit.js && node tools/forage/packs.js && node tools/forage/look.js --all --type kit --jpeg --out odyssey/thumbs */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./ldraw.js'), B = require('./build.js'), S = require('./sets.js');
const ROOT = L.ROOT, OUT = path.join(ROOT, 'odyssey/cards');
const title = id => { try { return fs.readFileSync(L.fileFor(id + '.dat') || '', 'utf8').split('\n')[0].replace(/^0\s+/, '').trim(); } catch (e) { return ''; } };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const setsSrc = fs.readFileSync(path.join(__dirname, 'sets.js'), 'utf8'), specs = fs.readdirSync(path.join(ROOT, 'odyssey/keyframes')).filter(f => /^OD-.*\.json$/.test(f)).map(f => ({ f, t: fs.readFileSync(path.join(ROOT, 'odyssey/keyframes', f), 'utf8') }));
/* where a KIT or FURN piece is used: the hero sets whose source names it */
const setsUsing = ref => { const out = []; const re = /^\s{2}(\w+): \(\) => room\(/gm; let m, starts = []; while ((m = re.exec(setsSrc))) starts.push([m[1], m.index]); starts.forEach(([n, i], k) => { const body = setsSrc.slice(i, k + 1 < starts.length ? starts[k + 1][1] : setsSrc.indexOf('};', i)); if (body.includes(ref)) out.push(n); }); return out; };
const stillsUsing = name => specs.filter(s => s.t.includes(`"name": "${name}"`)).map(s => s.f.replace('.json', ''));
const items = [];
const add = (name, category, comp, note, used) => items.push({ name, category, comp, note, used });

/* 1. set design in real kits */
const KITNOTE = { galley: 'The black ship: 22 x 8 hull, boat mast and topmast, yard, oars through the gunwale; sail set or furled', crag: 'Rock panels 23996, 6082, 6083 with plants', rocks: 'The two-part boulder and a 4 x 4 x 3 rock', boulder: 'Rock 4 x 4 x 3 (two-tone)', cypress: 'Columnar tree 3778 as a Mediterranean cypress', olive: 'Oval tree 3470 as an olive', pine: 'Pyramidal tree 3471', palm: 'Palm 2518c01', flowers: 'Flower stems 3741', bush: 'Leaves 2417 layered', bones: 'Skeleton torso, legs and bones', raft: 'Log bricks and a stub mast', splash: 'Trans-clear and white cones', caveWall: 'Rock panels in two tiers', caveFlank: 'Rock panels, flank', greatStone: 'The stone across the cave mouth', wave: 'A swell with a white crest', whirlpool: 'Charybdis: rings of trans blue and white' };
for (const [k, f] of Object.entries(S.KIT)) { let c; try { c = k === 'galley' ? f({ furled: false }) : f(); } catch (e) { continue; } add('kit ' + k, 'Set design', c, KITNOTE[k] || '', { sets: setsUsing('KIT.' + k + '(') }); }
add('kit galley furled', 'Set design', S.KIT.galley({ furled: true }), 'The black ship with its sail furled under the yard (the wind has died)', { sets: setsUsing('furled: true') });
/* 2. furniture */
for (const [k, f] of Object.entries(S.FURN)) { let c; try { c = f(); } catch (e) { continue; } if (!B.rowsOf(c).length) continue; add('furniture ' + k, 'Furniture', c, '', { sets: setsUsing('FURN.' + k + '(') }); }
/* 3. keyframe props */
const props = JSON.parse(fs.readFileSync(path.join(ROOT, 'odyssey/keyframes/props.json'), 'utf8'));
for (const [k, p] of Object.entries(props)) add('prop ' + k, 'Keyframe props', B.make(k, 'parts', { parts: p.parts.map(r => r.part).join(' ') }, p.parts.map(r => ({ part: r.part.replace(/\.dat$/, ''), col: r.color, m: r.m }))), 'Anchors: ' + Object.keys(p.anchors || {}).join(', '), { stills: stillsUsing(k) });
/* 4. the raw parts discovered for this world, by kind */
const VOCAB = {
  'Terrain and water': [['3811', 1, 'the sea: a blue 32 x 32 baseplate'], ['3857p01', 2], ['3857', 1], ['3811p02', 2], ['3811p03', 2], ['3811p05', 2], ['3867p01', 2], ['2552p04', 2], ['6024', 2], ['30271', 72], ['51542', 19]],
  'Rock': [['6082', 72], ['6083', 72], ['23996', 72], ['47847', 72], ['53934p01c01', 72], ['42291', 72], ['42284', 72], ['30294c01', 72], ['10178', 72]],
  'Plants': [['3778', 288, 'cypress'], ['3470', 2, 'olive'], ['3471', 2], ['2435', 2], ['2518c01', 70], ['2417', 2], ['2423', 2], ['3741ac01', 14], ['3741ac04', 4], ['30093', 2], ['32607', 2], ['6064', 2]],
  'Ships and rigging': [['71958c01', 0, 'the galley hull'], ['30255', 0], ['2557c01', 70], ['2559c01', 70], ['2560', 70], ['2537', 70, 'boat mast'], ['4289', 70], ['u767c02', 15, 'square sail'], ['u768c01', 15], ['96714c01', 15], ['2542', 70, 'oar'], ['2551', 70], ['29110', 70], ['14225', 28, 'braided string (rope)']],
  'Stone and wood': [['3941', 70], ['3942', 70], ['30136', 70], ['30137', 70], ['30140', 70], ['4589', 57], ['4740', 70]],
  'Creatures and bones': [['87621p01', 29, 'pig (Circe)'], ['95341', 15, 'ram (the Cyclops)'], ['92586', 70, 'dog (Argos)'], ['10509', 308, 'horse'], ['64452', 70, 'cow (Helios)'], ['6260', 15], ['6266', 15], ['92691', 15]],
  'The big figures': [['60671', 84, 'troll (the Cyclopes)'], ['60672', 84], ['60640', 84], ['14769', 15, 'the eye (a 2 x 2 round tile)'], ['98138', 0, 'the pupil']] };
for (const [cat, list] of Object.entries(VOCAB)) for (const [id, col, note] of list) { if (!L.fileFor(id + '.dat')) continue; add('part ' + id, 'Parts: ' + cat, B.make(id, 'parts', { parts: id }, [{ part: id, col, m: L.I12 }]), note || title(id), {}); }

/* write the cards and the catalogue */
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'odyssey/forage.json'), 'utf8')); idx.cards = idx.cards.filter(c => c.type !== 'kit');
const catalogue = [];
for (const it of items) {
  const rows = B.rowsOf(it.comp); if (!rows.length) continue;
  const id = 'kit.' + slug(it.name), b = L.bounds(rows), file = path.join(OUT, id + '.mpd');
  fs.writeFileSync(file, ['0 FILE ' + id + '.ldr', '0 ' + it.name, '0 Name: ' + id + '.ldr', '0 Author: word to world, tools/forage/kit.js', '0 !LDRAW_ORG Unofficial_Model', '', ...rows.map(L.lineOf)].join('\n') + '\n');
  const counts = {}; for (const r of rows) { const k = r.part + '|' + r.col; counts[k] = (counts[k] || 0) + 1; }
  const parts = Object.entries(counts).map(([k, n]) => { const [p, c] = k.split('|'); return { part: p, color: +c, n, title: title(p) }; });
  const thumb = fs.existsSync(path.join(ROOT, 'odyssey/thumbs', id + '.webp'));
  catalogue.push({ id, name: it.name, category: it.category, note: it.note, pieces: rows.length, studs: [Math.round((b[3] - b[0]) / 20), Math.round((b[5] - b[2]) / 20)], height: Math.round(b[4] - b[1]), parts, used: it.used, thumb });
  idx.cards.push({ id, type: 'kit', name: it.name.toUpperCase(), thumb, books: [], pieces: rows.length, subBuilds: 1, depth: 1, joints: 0, anchored: rows.length, held: 0, detached: 0, clips: 0, flex: 0, studs: [Math.round((b[3] - b[0]) / 20), Math.round((b[5] - b[2]) / 20)], height: { ldu: Math.round(b[4] - b[1]), bricks: +((b[4] - b[1]) / 24).toFixed(1), plates: Math.round((b[4] - b[1]) / 8) }, status: 'GREEN', why: [it.category + (it.note ? ': ' + it.note : '')], sources: [], tree: { name: it.name, how: 'kit', pieces: rows.length, source: it.category, children: [] }, butter: { parts: rows.length, cut: 0 }, files: { mpd: 'odyssey/cards/' + id + '.mpd' } });
}
fs.writeFileSync(path.join(ROOT, 'odyssey/forage.json'), JSON.stringify(idx));
fs.writeFileSync(path.join(ROOT, 'odyssey/kit.json'), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), items: catalogue }, null, 1));
const byCat = {}; for (const c of catalogue) byCat[c.category] = (byCat[c.category] || 0) + 1;
console.log(catalogue.length, 'kit cards:', JSON.stringify(byCat));
