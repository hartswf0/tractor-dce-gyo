#!/usr/bin/env node
/* tools/odyssey-forage.js — every card of the Odyssey atlas as a real LDraw build, foraged, assembled and checked.

   The atlas (odyssey-halfworld viewer/odyssey-manifest.json) has 430 asset cards and 152 scene cards. For each asset the
   forage table (tools/forage/table.js) names its components: sub-builds foraged from real LDraw sets (the donors in
   ldraw/models and the corpus films/forage/fetch-odyssey-ldraw.mjs downloads), minifigures assembled from real parts,
   readymade parts, procedural kits tiled by world/dsl.js. The card lays them on a plate, the way the trailer's builds sit
   on theirs. A scene card is its location's set with its cast on an apron in front: the scene's assets as sub-builds.

   Each card is then held to account (tools/forage/ldraw.js): every part resolved in the library, every stud of every
   piece tested against the undersides above it (stud joints), every piece traced to the plate through joints or through
   contact (clips, hands, hinges: held), the pieces that touch nothing named (detached), the ropes and hoses counted apart.

   Writes:  odyssey/cards/<id>.mpd        the build: one FILE per sub-build, donors credited in their FILE headers
            odyssey/butter/<id>.json      the same build as a Hand Butter scene (40 × 40 studs, 3000 parts at most)
            odyssey/forage.json           the index: per card its tree, sources, sheet and status
            odyssey/FORAGE.md             the report

   Usage: node tools/odyssey-forage.js --halfworld <odyssey-halfworld clone> [--corpus <dir of donor MPDs>] [--only id,id] */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./forage/ldraw.js'), B = require('./forage/build.js'), T = require('./forage/table.js');
const ROOT = L.ROOT, args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const HW = opt('halfworld', path.join(path.dirname(ROOT), 'odyssey-halfworld'));
const CORPUS = opt('corpus', path.join(ROOT, 'films/forage/odyssey-ldraw-corpus/models'));
const OUT = path.join(ROOT, opt('out', 'odyssey'));
const ONLY = opt('only', '') ? new Set(opt('only').split(',')) : null;
B.setDonorDirs([CORPUS]);
const manifest = JSON.parse(fs.readFileSync(path.join(HW, 'viewer/odyssey-manifest.json'), 'utf8'));
const { rowsOf, foot, make, kit, K } = B;
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'build';

/* ── a card: its components on a plate ── */
function onPlate(title, comps, baseCol, o = {}) {
  const live = comps.filter(c => rowsOf(c).length);
  const top = live.length === 1 && !o.forceGroup ? live[0] : B.group(title, live, { gap: 1, maxW: o.maxW || 24 });
  const f = foot(top), w = Math.min(64, f.w + 2), d = Math.min(64, f.d + 2);
  const base = kit('plate', [K.slab(0, 0, w, d, baseCol)]);
  return { top, card: make(title, 'card', { plate: w + ' x ' + d }, [], [{ c: base, M: L.I12 }, { c: top, M: L.T(0, -8, 0) }]) };
}
/** A component cut to a window of w × d studs about its centre (the set of a scene, the plate of Hand Butter). */
function crop(c, w, d, name) {
  const rows = rowsOf(c), f = foot(c); if (f.w <= w && f.d <= d) return c;
  const b = f.b, cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2;
  const keep = rows.filter(r => Math.abs(r.m[0] - cx) <= w * 10 - 10 && Math.abs(r.m[2] - cz) <= d * 10 - 10);
  const loose = new Set(L.audit(keep).floating), stands = keep.filter((r, i) => !loose.has(i));   // the window keeps what still stands once its edges are cut
  return make(name || c.name, 'crop', { ...c.source, crop: w + ' x ' + d + ' of ' + f.w + ' x ' + f.d + (loose.size ? ', ' + loose.size + ' pieces cut loose by the edge left out' : '') }, stands);
}

/* ── the MPD: one FILE per sub-build ── */
function toMPD(id, title, card, sheet, notes) {
  const files = [], names = new Map(), used = new Set();
  const nameOf = c => { if (names.has(c)) return names.get(c); let n = `${id} - ${slug(c.name)}`, k = 2; while (used.has(n)) n = `${id} - ${slug(c.name)}-${k++}`; used.add(n); names.set(c, n + '.ldr'); return n + '.ldr'; };
  const emit = (c, main) => {
    const fname = main ? id + '.ldr' : nameOf(c), lines = [`0 FILE ${fname}`, `0 ${main ? title : c.name}`, `0 Name: ${fname}`];
    const src = c.source || {};
    lines.push(`0 Author: ${src.author ? src.author + '; foraged by word to world, tools/odyssey-forage.js' : 'word to world, tools/odyssey-forage.js'}`, '0 !LDRAW_ORG Unofficial_Model', `0 !LICENSE ${src.license || 'Redistributable under CCAL version 2.0 : see CAreadme.txt'}`, '');
    if (main) { lines.push(...notes.map(n => '0 // ' + n), `0 !FORAGE ${JSON.stringify(sheet)}`, ''); }
    if (src.donor) lines.push(`0 // foraged from ${src.file || src.donor}${src.sub ? ' : ' + src.sub : ''}${src.title ? ' (' + src.title + ')' : ''}${src.crop ? ', cropped ' + src.crop : ''}`);
    else if (c.how) lines.push(`0 // ${c.how}${src.figure ? ': ' + src.figure : src.part ? ': ' + src.part + ' ' + (src.desc || '') : src.kit ? ': ' + src.kit : ''}`);
    for (const r of c.local) lines.push(L.lineOf({ ...r, m: L.mul(c.m, r.m) }));
    for (const s of c.subs) { const sub = emit(s.c, false); lines.push(`1 16 ${L.mul(c.m, s.M).map(L.fmt).join(' ')} ${sub}`); if (main) lines.push('0 STEP'); }
    files.push(lines.join('\n'));
    return fname;
  };
  emit(card, true);
  return files.reverse().join('\n\n') + '\n';   // the main file first: it was emitted last
}
/* ── the tree, for the index and the viewer ── */
function treeOf(c, depth = 0) { const n = rowsOf(c).length; return { name: c.name, how: c.how, pieces: n, source: c.source && (c.source.donor ? `${c.source.file || c.source.donor}${c.source.sub ? ' : ' + c.source.sub : ''}` : c.source.figure || c.source.part || c.source.kit || c.source.parts || null), children: c.subs.map(s => treeOf(s.c, depth + 1)) }; }
const countSubs = t => t.children.reduce((s, k) => s + 1 + countSubs(k), 0), depthOf = t => t.children.length ? 1 + Math.max(...t.children.map(depthOf)) : 0;
function sources(c, out = []) { const s = c.source || {}; if (s.donor && !out.some(o => o.donor === s.donor && o.sub === s.sub)) out.push({ donor: s.donor, file: s.file, sub: s.sub, title: s.title, author: s.author, license: s.license, found: s.found !== false }); for (const k of c.subs) sources(k.c, out); return out; }
function missingOf(c, out = new Set()) { for (const m of c.missing || []) out.add(m); for (const k of c.subs) missingOf(k.c, out); return out; }

/* ── Hand Butter: LDraw (y down) to the plate (y up, −z), each part by the bottom of its own geometry ── */
function quatOf(R) {   // R = F·M·F as a quaternion [x, y, z, w]
  const [a, b, c, d, e, f, g, h, i] = [R[0], -R[1], -R[2], -R[3], R[4], R[5], -R[6], R[7], R[8]], t = a + e + i; let q;
  if (t > 0) { const s = Math.sqrt(t + 1) * 2; q = [(h - f) / s, (c - g) / s, (d - b) / s, 0.25 * s]; }
  else if (a > e && a > i) { const s = Math.sqrt(1 + a - e - i) * 2; q = [0.25 * s, (b + d) / s, (c + g) / s, (h - f) / s]; }
  else if (e > i) { const s = Math.sqrt(1 + e - a - i) * 2; q = [(b + d) / s, 0.25 * s, (f + h) / s, (c - g) / s]; }
  else { const s = Math.sqrt(1 + i - a - e) * 2; q = [(c + g) / s, (f + h) / s, 0.25 * s, (d - b) / s]; }
  return q.map(v => +v.toFixed(5));
}
const rot = (q, v) => { const [x, y, z, w] = q, [vx, vy, vz] = v, ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz; return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x]; };
function toButter(rows) {
  const solid = rows.filter(r => !L.isPrimitive(r.part) && L.info(r.part).ok && L.info(r.part).box);
  const b = L.bounds(solid), cx = (b[0] + b[3]) / 2, cz = (b[2] + b[5]) / 2, floor = b[4];
  const out = []; let cut = 0;
  for (const r of solid) {
    const m = r.m, q = quatOf([m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11]]), bmax = L.info(r.part).box[4], off = rot(q, [0, bmax, 0]);
    const x = +(m[0] - cx - off[0]).toFixed(2), y = +(floor - m[1] - off[1]).toFixed(2), z = +(-(m[2] - cz) - off[2]).toFixed(2);
    if (Math.abs(x) > 400 || Math.abs(z) > 400 || y < -100 || y > 700) { cut++; continue; }
    const ident = Math.abs(q[3]) > 0.99999, col = r.col === 16 || r.col === 24 ? 7 : r.col;
    out.push({ id: 's' + out.length, part: r.part, color: col, x, y, z, r: 0, ...(ident ? {} : { q }) });
  }
  out.sort((a, c) => a.y - c.y); const kept = out.slice(0, 3000); kept.forEach((p, i) => { p.id = 's' + i; });
  return { parts: kept, cut: cut + out.length - kept.length };
}

/* ── build every card ── */
const index = { generated: new Date().toISOString().slice(0, 10), halfworld: manifest.generated || null, donors: {}, cards: [] };
fs.mkdirSync(path.join(OUT, 'cards'), { recursive: true }); fs.mkdirSync(path.join(OUT, 'butter'), { recursive: true });
const built = new Map();
function finish(id, type, a, card, top, extra) {
  const rows = rowsOf(card), au = L.audit(rows), b = L.bounds(rows.filter(r => !L.isPrimitive(r.part))), tree = treeOf(card);
  const W = Math.round((b[3] - b[0]) / 20), D = Math.round((b[5] - b[2]) / 20), H = Math.round(b[4] - b[1]);
  const missing = [...missingOf(card)], srcs = sources(card), lost = srcs.filter(s => !s.found);
  const detached = au.floating.length, notOk = [...new Set(rows.filter(r => !L.info(r.part).ok).map(r => r.part))];
  const status = !rows.length ? 'RED' : (missing.length || lost.length || notOk.length || detached > Math.max(2, au.pieces * 0.02) || extra.fallback) ? 'YELLOW' : 'GREEN';
  const why = [missing.length && `${missing.length} parts the library lacks were left out (${missing.slice(0, 6).join(', ')})`, lost.length && `donor not found: ${lost.map(s => s.donor + (s.sub ? ' : ' + s.sub : '')).join(', ')}`, notOk.length && `parts with unresolved subfiles: ${notOk.join(', ')}`, detached && `${detached} pieces touch nothing (a donor's loose detail or ropes' ends)`, extra.fallback && 'no set named for this place yet: trees and rocks stand in'].filter(Boolean);
  const bt = toButter(rows);
  const sheet = { id, type, pieces: au.pieces, subBuilds: countSubs(tree), depth: depthOf(tree), joints: au.joints, anchored: au.anchored, held: au.held, detached, flex: au.flex, studs: [W, D], height: { ldu: H, bricks: +(H / 24).toFixed(1), plates: Math.round(H / 8) }, cm: [+(W * 0.8).toFixed(1), +(D * 0.8).toFixed(1), +(H * 0.04).toFixed(1)], status };
  const notes = [`${a.name}: ${type}${extra.role ? ' (' + extra.role + ')' : ''}`, `${sheet.pieces} pieces, ${sheet.subBuilds} sub-builds, ${sheet.joints} stud joints; ${sheet.anchored} held by studs to the plate, ${sheet.held} by contact, ${detached} detached, ${sheet.flex} rope and hose segments`, `${W} x ${D} studs, ${sheet.height.bricks} bricks high (${sheet.cm.join(' x ')} cm)`, ...why];
  fs.writeFileSync(path.join(OUT, 'cards', id + '.mpd'), toMPD(id, a.name, card, sheet, notes));
  const desc = `${a.name}. ${type.replace('_', ' ')}${a.books ? ', books ' + a.books.join(', ') : a.book ? ', book ' + a.book : ''}. ${sheet.pieces} pieces in ${sheet.subBuilds} sub-builds, ${sheet.joints} stud joints.${bt.cut ? ' ' + bt.cut + ' parts beyond the 40 x 40 plate left out here; the MPD has them all.' : ''}`;
  fs.writeFileSync(path.join(OUT, 'butter', id + '.json'), JSON.stringify({ version: 1, id, name: a.name, description: desc, parts: bt.parts, actors: [] }));
  for (const s of srcs) if (s.found) { const k = s.file || s.donor; index.donors[k] = index.donors[k] || { title: s.title, author: s.author, license: s.license, cards: 0 }; index.donors[k].cards++; }
  const thumb = fs.existsSync(path.join(OUT, 'thumbs', id + '.webp'));
  index.cards.push({ id, type, name: a.name, thumb, books: a.books || (a.book ? [a.book] : []), scenes: a.scenes || undefined, assets: a.assets || undefined, role: extra.role, ...sheet, why, sources: srcs.map(s => ({ donor: s.donor, file: s.file, sub: s.sub, author: s.author })), tree, butter: { parts: bt.parts.length, cut: bt.cut }, files: { mpd: 'odyssey/cards/' + id + '.mpd', butter: 'odyssey/butter/' + id + '.json' } });
  return sheet;
}
const t0 = Date.now(); let n = 0;
for (const a of manifest.assets) {
  if (ONLY && !ONLY.has(a.id)) continue;
  let rec; try { rec = T.recipe(a); } catch (e) { console.error(a.id, e.message); rec = { comps: [], base: 19 }; }
  const { top, card } = onPlate(a.name, rec.comps, rec.base, { maxW: rec.set ? 44 : 24, forceGroup: false });
  built.set(a.id, { top, rec, a });
  const s = finish(a.id, a.type, a, card, top, rec);
  if (++n % 50 === 0 || ONLY) console.log(`${n} ${a.id}: ${s.status} ${s.pieces} pieces ${s.subBuilds} subs ${s.joints} joints ${s.studs.join('x')} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}
/* scenes: the location's set at the back (cut to the plate), the cast on an apron in front */
for (const sc of manifest.scenes) {
  if (ONLY && !ONLY.has(sc.id)) continue;
  const parts = sc.assets.map(id => built.get(id) || (() => { const a = manifest.assets.find(x => x.id === id); if (!a) return null; const rec = T.recipe(a); const r = onPlate(a.name, rec.comps, rec.base, { maxW: rec.set ? 44 : 24 }); const v = { top: r.top, rec, a }; built.set(id, v); return v; })()).filter(Boolean);
  const loc = parts.find(p => p.a.type === 'location'), cast = parts.filter(p => p !== loc).map(p => crop(p.top, 36, 26, p.a.name)).filter(c => rowsOf(c).length);   // a ship on the apron is framed like a set
  const castGroup = cast.length ? B.group('cast', cast, { gap: 2, maxW: 38 }) : null, cf = castGroup ? foot(castGroup) : { w: 0, d: 0 };
  const set = loc ? crop(loc.top, 38, Math.max(12, 38 - cf.d - 2), loc.a.name) : null, sf = set ? foot(set) : { w: 0, d: 0 };
  const list = []; if (set) list.push([set, 0, -Math.ceil((cf.d + 2) / 2)]); if (castGroup) list.push([castGroup, 0, Math.ceil((sf.d + 2) / 2)]);
  const top = B.at(sc.title.toLowerCase(), list);
  const { card } = onPlate(sc.title, [top], loc ? loc.rec.base : 19, {});
  const s = finish(sc.id, 'scene', { name: sc.title, book: sc.book, assets: sc.assets }, card, top, {});
  if (++n % 50 === 0 || ONLY) console.log(`${n} ${sc.id}: ${s.status} ${s.pieces} pieces ${s.subBuilds} subs ${s.joints} joints ${s.studs.join('x')}`);
}
if (!ONLY) {
  fs.writeFileSync(path.join(OUT, 'forage.json'), JSON.stringify(index));
  const by = k => index.cards.reduce((m, c) => (m[c[k]] = (m[c[k]] || 0) + 1, m), {});
  const tot = k => index.cards.reduce((s, c) => s + c[k], 0);
  fs.writeFileSync(path.join(OUT, 'FORAGE.md'), report(index));
  console.log(`${index.cards.length} cards; status ${JSON.stringify(by('status'))}; ${tot('pieces')} pieces, ${tot('subBuilds')} sub-builds, ${tot('joints')} stud joints; ${Object.keys(index.donors).length} donors; ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
function report(ix) {
  const C = ix.cards, n = v => v.toLocaleString('en'), tot = (list, k) => list.reduce((s, c) => s + c[k], 0), by = k => C.reduce((m, c) => (m[c[k]] = (m[c[k]] || 0) + 1, m), {});
  const types = [...new Set(C.map(c => c.type))], st = by('status');
  const L = ['# The Odyssey as LDraw: the forage', '',
    `Generated ${ix.generated} by \`tools/odyssey-forage.js\` from the atlas in odyssey-halfworld (\`viewer/odyssey-manifest.json\`). Browse it in [odyssey-forage.html](../odyssey-forage.html); load any card in [Hand Butter](../play/hand-butter-odyssey.html?scene=OD-B01-S01).`, '',
    `**${n(C.length)} cards** (${C.filter(c => c.type !== 'scene').length} assets, ${C.filter(c => c.type === 'scene').length} scenes) · **${n(tot(C, 'pieces'))} pieces** · **${n(tot(C, 'subBuilds'))} sub-builds** · **${n(tot(C, 'joints'))} stud joints** · ${Object.keys(ix.donors).length} donor sets · ${st.GREEN || 0} green, ${st.YELLOW || 0} yellow, ${st.RED || 0} red.`, '',
    '## How a card is foraged', '',
    'The trailer builds a city as a tree: the whole model, its builds, their sub-builds, down to parts, every joint counted. The forage does the same for the atlas.', '',
    '1. **Forage.** Each card type has its way of being got (`tools/forage/table.js`). Locations and vehicles take a sub-build from a real set: a FILE block of a community LDraw model, flattened, minifigures stripped. Characters are minifigures assembled from real parts on the standard skeleton, dressed by role, with accessories held in a hand grip measured from the donors. Creatures, props and effects are readymade parts (horse, pig, goblet, bow, lightning bolt, transparent columns). The pieces a scene needs beside a set (colonnades, hearths, seats, trees, rocks, roads, water) are procedural kits laid by `world/dsl.js`.',
    '2. **Assemble.** The components are settled (the lowest underside on the ground, the stud lattice in phase) and laid side by side on a plate. A scene card is its location\'s set, cut to a window, with its cast of asset cards on an apron in front: the scene\'s assets are its sub-builds.',
    '3. **Verify.** `tools/forage/ldraw.js` resolves every part in `ldraw/`, finds every stud on every piece, and tests it against the undersides above it (a stud joint). It then traces each piece to the plate through joints, or through contact for clips, hands and hinges. Pieces that touch nothing are reported as detached. Rope and hose segments carry contact but are counted apart. A card is green when every part resolves, every donor is found and almost nothing is detached.',
    '4. **Look.** `tools/forage/look.js` renders cards through the viewer; the thumbnails in `odyssey/thumbs/` are those frames.',
    '5. **Play.** `tools/butter-odyssey.js` writes Hand Butter with a scene per card; each scene file (`odyssey/butter/<id>.json`) is fetched when loaded, and a foraged build stands pinned until a piece is picked up.', '',
    '## By type', '', '| type | cards | pieces | sub-builds | stud joints | yellow |', '|---|---|---|---|---|---|',
    ...types.map(t => { const l = C.filter(c => c.type === t); return `| ${t.replace('_', ' ')} | ${l.length} | ${n(tot(l, 'pieces'))} | ${n(tot(l, 'subBuilds'))} | ${n(tot(l, 'joints'))} | ${l.filter(c => c.status !== 'GREEN').length} |`; }), '',
    '## Donors', '', 'Community LDraw models, redistributed under CCAL 2.0; each foraged FILE keeps its author in its header.', '', '| model | author | cards |', '|---|---|---|',
    ...Object.entries(ix.donors).sort((a, b) => b[1].cards - a[1].cards).map(([k, d]) => `| ${k} | ${(d.author || '').replace(/\|/g, '/')} | ${d.cards} |`), '',
    '## Not green, and why', '', ...C.filter(c => c.status !== 'GREEN').map(c => `- **${c.id}** ${c.name}: ${c.why.join('; ')}`), '',
    '## Rebuilding', '', '```', 'git clone https://github.com/hartswf0/odyssey-halfworld ../odyssey-halfworld', 'cd films/forage && node fetch-odyssey-ldraw.mjs && cd ../..   # the donor corpus (not kept in the repository)', 'node tools/odyssey-forage.js --halfworld ../odyssey-halfworld', 'node tools/butter-odyssey.js WAG-HAND-BUTTER-26.HTML', 'NODE_PATH=<playwright@1.56, three@0.128> node tools/forage/look.js --all --jpeg --out <dir>   # then convert to webp in odyssey/thumbs', '```', '',
    '## What comes next', '',
    '- **Sub-build kits by function.** The trailer shows 113 builds grouped into repeatable kits: tower, tree, arcade, canopy, lamp. The next forage should cut donors into connected chunks (a mast, a gate, a stair, a palm) and index them by what they do, so one Ithacan hall can be assembled from a castle gate, a Lincoln Memorial colonnade and a blacksmith\'s hearth rather than taken whole.',
    '- **More donors.** The 14 models the fetcher could not reach (Eldorado Fortress, Imperial Trading Post, Viking Village, Trevi Fountain and others) would each replace a stand-in; the part 6029b (the islands\' palm base) is missing from the library.',
    '- **Staging.** Scenes stand their cast on an apron. The halfworld plans (`scenes/_plans`, the MOVES tables `tools/odyssey.js` already reads) give each figure a mark on the set; laying the cast on those marks turns a scene card into a set for the film.',
    '- **The joint graph.** The audit knows every joint; drawing it over the model, as the trailer does in blue and orange, would show where a set is weak before it is shot.', ''];
  return L.join('\n');
}
module.exports = { toButter, quatOf };
