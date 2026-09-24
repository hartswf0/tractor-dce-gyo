/* tools/forage/cyclops.js — Polyphemus, four ways, each stood beside Odysseus so the scale reads.

   A  troll        the LEGO big figure (60671 Troll, arms 60672/60673, hands 60640/60641) as its part authors assemble it:
                   the arms at x ∓40 from the body, the hands at (∓13.75, 45, −46) from the arm (their !HELP lines)
   B  troll-bare   the same big figure built from its sub-parts without the helmet, in skin and hide, a tree-trunk club
   C  brick        a brick-built giant designed once: sandals, legs, tunic and belt, bonded chest and arms, a beard, and one
                   eye mounted studs-sideways (a white 2 x 2 round tile with a black 1 x 1 round pupil on the face)
   D  micro        the scale trick: the troll as the Cyclops and the men as microfigures (a round brick, a round plate), so
                   the giant stands six men high without building a giant

   node tools/forage/cyclops.js   writes odyssey/cards/option.cyclops-<a..d>.mpd (render them with tools/forage/look.js) */
'use strict';
const fs = require('fs'), path = require('path');
const L = require('./ldraw.js'), B = require('./build.js'), K = B.K;
const T = require('./table.js'), C = T.C;
const ROT_FACE = [0, 0, 0, 1, 0, 0, 0, 0, -1, 0, 1, 0];   // a part's top turned to face the front (LDraw −z): a quarter turn about x

function troll(o = {}) {
  const skin = o.skin ?? C.nougat, hide = o.hide ?? C.rbrown, list = [];
  if (o.helmet) list.push(['60671', skin, 0, 0, 0]);
  else list.push(['60635', skin, 0, 0, 0], ['60637', skin, 0, 0, 0], ['60634', hide, 0, 0, 0], ['60638', C.dbrown, 0, 0, 0], ['60644', hide, 0, 0, 0]);
  list.push(['60672', skin, -40, 0, 0], ['60673', skin, 40, 0, 0], ['60640', skin, -53.75, 45, -46], ['60641', skin, 53.75, 45, -46]);
  const body = B.parts(o.helmet ? 'polyphemus (troll)' : 'polyphemus (troll, bare)', list);
  if (!o.club) return body;
  const club = B.kit('club', [0, 1, 2, 3, 4].map(i => K.part('3941', C.dbrown, 0, 0, i)).concat([K.part('3942', C.dbrown, 0, 0, 5)]));
  return B.at('polyphemus with club', [[body, 0, 0], [club, -5, -1]]);
}
function brickGiant() {
  const skin = C.nougat, cloth = C.dtan, hair = C.dbrown, ops = [];
  ops.push(K.box(1, 0, 2, 3, 1, C.rbrown), K.box(5, 0, 2, 3, 1, C.rbrown));
  ops.push(K.box(1, 1, 2, 2, 4, skin, { y: 1 }), K.box(5, 1, 2, 2, 4, skin, { y: 1 }));
  ops.push(K.box(0, 0, 8, 3, 3, cloth, { y: 5 }), K.slab(0, 0, 8, 3, C.rbrown, { y: 8 }));
  ops.push(K.box(0, 0, 8, 3, 3, skin, { y: 8, plateOffset: 1 }), K.box(1, 0, 6, 3, 1, cloth, { y: 11, plateOffset: 1 }));
  ops.push(K.box(2, 0, 4, 3, 3, skin, { y: 12, plateOffset: 1 }));                                     // the head
  ops.push(K.box(2, 2, 4, 1, 1, hair, { y: 12, plateOffset: 1 }));                                     // the beard: the front row under the eye
  ops.push(K.slab(2, 0, 4, 3, hair, { y: 15, plateOffset: 1 }), K.box(2, 0, 4, 1, 2, hair, { y: 13, plateOffset: 1 }));   // hair over the crown and down the back
  const body = B.kit('polyphemus (brick)', ops), rows = B.rowsOf(body), b = L.bounds(rows);
  /* the eye on the face, studs-sideways: front face at the box's min z, eye centred across the head at two-thirds up it */
  const faceZ = b[2], eyeY = b[1] + 36, eyeX = (b[0] + b[3]) / 2;
  const eye = B.make('the eye', 'parts', { parts: '14769 98138' }, [
    { part: '14769', col: C.white, m: L.mul(L.T(eyeX, eyeY, faceZ - 8), ROT_FACE) },
    { part: '98138', col: C.black, m: L.mul(L.T(eyeX, eyeY, faceZ - 16), ROT_FACE) }]);
  return B.make('polyphemus (brick)', 'group', { group: 2 }, [], [{ c: body, M: L.I12 }, { c: { ...eye, m: L.I12 }, M: L.T(-body.m[0], -body.m[1], -body.m[2]) }].map(s => ({ ...s, M: s.c === body ? L.I12 : L.mul(body.m, s.M) })));
}
/** E: the troll big figure, bareheaded, one eye on its face (a white 2 x 2 round tile, a black 1 x 1 round pupil), a trunk club. */
function oneEyedTroll(name = 'polyphemus') {
  const body = troll({ club: true });
  /* the eye on the head itself: measured from where the head (60635) actually lands in the settled body, not from a group's offset */
  const at = B.rowsOf(body).find(r => r.part === '60635').m;   /* the head's placement, the body's own settling included */
  const eye = B.make('the eye', 'parts', { parts: '14769 98138' }, [{ part: '14769', col: C.white, m: L.mul(L.mul(at, L.T(0, 20, -66)), ROT_FACE) }, { part: '98138', col: C.black, m: L.mul(L.mul(at, L.T(0, 20, -74)), ROT_FACE) }]);
  return B.make(name, 'group', { group: 2, figure: 'troll big figure 60671, one eye' }, [], [{ c: body, M: L.I12 }, { c: { ...eye, m: L.I12 }, M: L.I12 }]);
}
function microfig(col, i) { return B.kit('sailor ' + (i + 1), [K.part('3062b', col, 0, 0, 0), K.part('3024', C.yellow, 0, 0, 1)]); }
function odysseus() { return B.fig(T.ROLES.hero(T.rng('odysseus')), 'odysseus'); }

const OPTIONS = {
  a: () => B.at('A · troll', [[troll({ helmet: true, skin: C.sgreen }), 0, 0], [odysseus(), 7, -1]]),
  b: () => B.at('B · troll, bare', [[troll({ club: true }), 0, 0], [odysseus(), 8, -1]]),
  c: () => B.at('C · brick giant', [[brickGiant(), 0, 0], [odysseus(), 8, -1]]),
  e: () => B.at('E · troll with one eye', [[oneEyedTroll(), 0, 0], [odysseus(), 8, -1]]),
  d: () => B.at('D · troll and microfigures', [[troll({ club: true }), 0, 0], ...[0, 1, 2, 3, 4, 5].map(i => [microfig([C.white, C.tan, C.dtan, C.red][i % 4], i), 5 + (i % 3) * 2, -3 + Math.floor(i / 3) * 2])]),
};
if (require.main === module) {
  B.setDonorDirs([process.argv[2] || path.join(L.ROOT, 'films/forage/odyssey-ldraw-corpus/models')]);
  for (const [k, f] of Object.entries(OPTIONS)) {
    const comp = f(), rows = B.rowsOf(comp), au = L.audit(rows), b = L.bounds(rows), id = 'option.cyclops-' + k;
    const text = ['0 FILE ' + id + '.ldr', '0 ' + comp.name, '0 Name: ' + id + '.ldr', '0 Author: word to world, tools/forage/cyclops.js', '0 !LDRAW_ORG Unofficial_Model', '', ...rows.map(L.lineOf)].join('\n') + '\n';
    fs.writeFileSync(path.join(L.ROOT, 'odyssey/cards', id + '.mpd'), text);
    console.log(`${id}: ${comp.name}, ${au.pieces} pieces, ${au.joints} stud joints, ${au.floating.length} detached, ${Math.round((b[4] - b[1]) / 24 * 10) / 10} bricks high`);
  }
}
module.exports = { OPTIONS, troll, brickGiant, oneEyedTroll };
