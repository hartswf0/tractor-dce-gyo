#!/usr/bin/env node
/* tools/creatures/page.js — odyssey/creatures/index.html: each creature of film-readymades/creatures.js with its rig (a render of the
   rest pose coloured by moving piece, the pivots marked; the pivot tree with its channels and limits), its test film, the checks the
   film made of itself (odyssey/creatures/media/checks.json, written by tools/creatures/films.js) and the scenes that need it (from
   odyssey/perform/needs.json when it names the creature).
     node tools/creatures/page.js            (writes the rig renders into odyssey/creatures/media and the page) */
'use strict';
const fs = require('fs'), path = require('path');
const C = require('../../film-readymades/creatures.js'), S = require('./stage'), R = require('./raster');
const ROOT = path.resolve(__dirname, '..', '..'), DIR = path.join(ROOT, 'odyssey/creatures'), MEDIA = path.join(DIR, 'media');
const E = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const checks = (() => { try { return JSON.parse(fs.readFileSync(path.join(MEDIA, 'checks.json'), 'utf8')); } catch (e) { return {}; } })();
const needs = (() => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'odyssey/perform/needs.json'), 'utf8')); } catch (e) { return null; } })();

/* which films show which creature, and what each shows */
const FILMS = {
  'ram-rider': { kinds: ['ram'], title: 'A ram walking with a man beneath', note: 'The lead ram scaled 2.4 walks on a planted-foot gait with its stance widened; Odysseus hangs on the belly anchor, face up, hands in the wool (B09-S10).' },
  herd: { kinds: ['ram'], title: 'The flock leaves the cave', note: 'Seven rams and sheep of three sizes and colours follow the leader\'s path out of the mouth with separation, each on its own gait clock (B09-S08, B09-S10).' },
  'polyphemus-grope': { kinds: ['polyphemus', 'ram'], title: 'Polyphemus gropes at the cave mouth', note: 'Seated in the door (the sit preset), eye shut, both hands solved together over torso, shoulders and elbows: sweeping, reaching in, patting down onto the backs that pass in threes; the men under the middle rams and under the lead ram pass beneath the search (B09-S10).' },
  'giant-walk': { kinds: ['laestrygon'], title: 'A Laestrygonian\'s heavy walk and throw', note: 'The body follows the path through a spring (it lags, then carries on past the stop), the waddle rolls it over the planted foot, each footfall shakes the camera (fx.shake); then a boulder two-handed overhead, released on a ballistic arc (B10-S02).' },
  argos: { kinds: ['dog'], title: 'Argos knows his master', note: 'Played from a scene sheet\'s creature actor through OdysseyCreatures.sample (keys over the lie preset, on twos): the head lifts, the ears prick then drop, the tail beats; the breath stops and he goes over onto his side, and holds (B17-S03).' },
  dogs: { kinds: ['dog'], title: 'Eumaeus\' dogs', note: 'Four dogs on a gait schedule (run, trot, walk, run, blended on each leg\'s phase clock) rush the sitting stranger, stop short barking (head, ears, tail), and scatter when the stones fly (B14-S01).' },
  cattle: { kinds: ['cattle'], title: 'The cattle of the Sun', note: 'Five cattle driven in along the shore as a loose herd, one felled for the sacrifice: over onto its side, legs out (B12-S06).' },
  scylla: { kinds: ['scylla'], title: 'Scylla strikes', note: 'Six necks of hose segments of fixed length, each laid along a curve from its root to its head: coiled and swaying, drawn back, striking together at six rowers, holding, lifting them to the cleft (B12-S04).' },
};
/* a rig render: the rest pose, each moving piece its own colour, the pivots marked */
function rigImage(kind) {
  const rig = C.define(kind, kind === 'ram' ? { scale: 1 } : {}), v = rig.rest(), h = rig.K.height || 60;
  const ms = S.meshes(rig, v, { tint: true }), P = rig.pose(v);
  const marks = rig.nodes.filter(n => n.parent && (!n.chain || n.chain.i === 0 || n.chain.head)).map(n => ({ p: S.P(C.m.ap(P.nodes[n.id], n.p)), r: 4, c: [20, 20, 20] }));
  /* framed on its own box: the centre, and far enough back that the largest side fills two thirds of the frame */
  const B = S.bounds(ms), c = [0, 1, 2].map(k => (B.min[k] + B.max[k]) / 2), size = Math.max(...[0, 1, 2].map(k => B.max[k] - B.min[k]));
  const tgt = [c[0], -c[1], -c[2]], views = kind === 'scylla' ? [[20, 20]] : [[32, 12], [125, 16]];
  const imgs = views.map(([az, el]) => R.render({ W: 360, H: 300, ss: 2, cam: S.cam(tgt, size * 1.9, az, el), meshes: ms, marks, ground: { y: Math.max(0, B.max[1]), size: 1600, tile: 20 }, bg: [236, 236, 230], bg2: [246, 245, 240] }));
  const img = imgs.length > 1 ? R.sheet(imgs, 2) : imgs[0];
  S.jpeg(path.join(MEDIA, kind + '-rig.jpg'), img, 4);
  return kind + '-rig.jpg';
}
/* the scenes that need a creature, from the performance engine's reading of the scenes */
const WORDS = { polyphemus: ['polyphemus'], laestrygon: ['laestryg', 'antiphates', 'giant-girl'], ram: ['ram', 'flock', 'sheep'], dog: ['dog', 'argos'], cattle: ['cattle'], scylla: ['scylla'] };
function scenesOf(K) {
  const out = [], words = WORDS[K.kind] || [K.kind];
  for (const id of K.scenes || []) {
    const sc = needs && needs.scenes && needs.scenes[id]; let title = '', intents = [];
    if (sc) { title = sc.title || ''; intents = (sc.intents || []).filter(i => words.some(w => String(i.actor || '').toLowerCase().includes(w) || String(i.target || '').toLowerCase().includes(w)))
      .map(i => `${i.kind}${i.verb ? '(' + i.verb.toLowerCase() + ')' : ''} ${i.actor}${i.target ? ' > ' + i.target : ''} ${i.t0}-${i.t1} s${i.note ? ' (' + i.note + ')' : ''}`); }
    out.push({ id, title, intents });
  }
  return out;
}
function tree(K) {
  const kids = {}; for (const n of K.nodes) (kids[n.parent] = kids[n.parent] || []).push(n);
  const chOf = n => (n.rot || []).map(r => r[0]).concat((n.move || []).map(r => r[0])).concat(n.swap ? [n.swap.ch] : []);
  const li = n => {
    if (n.chain && !n.chain.head && n.chain.i > 0) return '';
    const label = n.chain ? (n.chain.head ? `head${n.chain.neck}` : `neck ${n.chain.neck}: ${K.nodes.filter(q => q.chain && q.chain.neck === n.chain.neck && !q.chain.head).length} hose segments`) : n.id;
    const ch = chOf(n), sub = (kids[n.id] || []).map(li).join('');
    return `<li><b>${E(label)}</b>${ch.length ? ' <span class="ch">' + ch.map(E).join(' ') + '</span>' : ''}${n.chain && !n.chain.head ? ' <span class="ch">laid along the curve of neck' + n.chain.neck + '.x .y .z .slack</span>' : ''}${sub ? '<ul>' + sub + '</ul>' : ''}</li>`;
  };
  return '<ul class="tree">' + (kids[null] || []).map(li).join('') + '</ul>';
}
function page() {
  fs.mkdirSync(MEDIA, { recursive: true });
  const kinds = C.kinds(), cards = [];
  for (const k of kinds) {
    const K = C.KINDS[k.kind], img = rigImage(k.kind), films = Object.entries(FILMS).filter(([, f]) => f.kinds.includes(k.kind));
    const chans = K.kind === 'scylla' ? K.channels.filter(c => c.name.startsWith('neck1.')) : K.channels;
    const scenes = scenesOf(K);
    const partsList = [...new Set((K.cuts ? K.cuts.from.map(s => s.part) : []).concat(K.nodes.flatMap(n => (n.mesh || []).map(m => m.part).filter(Boolean))).concat(K.nodes.flatMap(n => n.swap ? n.swap.parts.flatMap(q => Array.isArray(q) ? [q[0]].concat((q[2] || []).map(m => m.part)) : q ? [q] : []) : [])))];
    cards.push(`
  <section class="creature" id="${E(k.kind)}">
    <h2>${E(K.title)}</h2>
    <p class="lede">${E(K.blurb)}</p>
    <div class="grid">
      <figure><img src="media/${E(img)}" alt="${E(K.title)} at rest, each moving piece in its own colour, the pivots marked" loading="lazy" width="720" height="300"><figcaption>At rest, each moving piece its own colour, the pivots marked. Built from ${partsList.map(p => '<code>' + E(p) + '</code>').join(', ')}${K.card ? `; the set piece is <a href="../cards/${E(K.card)}.mpd"><code>${E(K.card)}</code></a>` : ''}${K.cuts ? `; the cut pieces are in <a href="parts/${E(K.cutFrom || K.kind)}.mpd"><code>parts/${E(K.cutFrom || K.kind)}.mpd</code></a>` : ''}.</figcaption></figure>
      <div class="card"><h3>The pivot tree</h3>${tree(K)}
        <h3>Anchors</h3><p class="muted">${Object.keys(K.anchors || {}).map(a => '<code>' + E(a) + '</code>').join(' ')} (a rider, a held man, a rock, a camera's aim)</p>
        ${Object.keys(K.presets || {}).length > 1 ? `<h3>Presets</h3><p class="muted">${Object.keys(K.presets).map(a => '<code>' + E(a) + '</code>').join(' ')}</p>` : ''}
        ${K.gaits ? `<h3>Gaits</h3><p class="muted">${Object.entries(K.gaits).map(([g, G]) => `<code>${E(g)}</code> stride ${G.stride}, duty ${G.duty}`).join('; ')} (LDU, at scale 1)</p>` : ''}
      </div>
    </div>
    <h3>Channels${K.kind === 'scylla' ? ' (neck 1 shown; necks 2 to 6 the same)' : ''}</h3>
    <div class="scroll"><table class="tbl"><tr><th>Channel</th><th>Limits</th><th>What it does</th></tr>
${chans.map(c => `      <tr><td class="n">${E(c.name).replace(/\./g, '.<wbr>')}</td><td class="n">${c.min} to ${c.max}${c.unit === 'rad' ? '' : ' ' + E(c.unit)}</td><td>${E(c.doc)}</td></tr>`).join('\n')}
    </table></div>
    ${films.map(([name, f]) => `
    <h3>${E(f.title)}</h3>
    <video controls muted playsinline loop preload="none" poster="media/${E(name)}.jpg" width="480" height="270"><source src="media/${E(name)}.mp4" type="video/mp4"></video>
    <p class="muted">${E(f.note)}${checks[name] ? ' Checks, the worst frame: ' + Object.entries(checks[name]).filter(([q]) => q !== 'frames' && q !== 'seconds').map(([q, x]) => `${E(q)} ${x}`).join('; ') + '.' : ''}</p>`).join('')}
    <h3>The scenes that need it</h3>
    <ul class="scenes">${scenes.map(s => `<li><code>${E(s.id)}</code>${s.title ? ' ' + E(s.title) : ''}${s.intents.length ? '<br><span class="muted">' + s.intents.map(E).join('; ') + '</span>' : ''}</li>`).join('')}</ul>
    <p class="muted">${(K.needs || []).map(E).join('; ')}.</p>
  </section>`);
  }
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Creature Rigs</title>
<meta name="description" content="The giants and animals of the LEGO Odyssey film as articulated LDraw rigs: Polyphemus, the Laestrygonians, Scylla, the rams, the dogs, Argos and the cattle of the Sun, with gaits, a giant's heavy walk, reach and grope, a herd, and their test films.">
<style>
:root { --paper: #f4f4f0; --ink: #141414; --muted: #5d5a52; --card: #fbfbf8; --rule: #d8d6ce; --blue: #0033cc; --gold: #a8801e; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --gold: #d8b25a; } }
:root[data-theme="dark"] { --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --gold: #d8b25a; }
* { box-sizing: border-box; }
html, body { overflow-x: hidden; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.55 Inter, system-ui, sans-serif; }
main { max-width: 1180px; margin: 0 auto; padding: 28px 16px 72px; }
h1, h2 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700; margin: 0; letter-spacing: -.01em; }
h1 { font-size: clamp(36px, 7vw, 66px); line-height: .98; }
h2 { font-size: 27px; margin: 38px 0 8px; padding-top: 10px; border-top: 3px solid var(--ink); }
h3 { margin: 18px 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: .12em; }
a { color: var(--blue); }
code { font: 13px ui-monospace, Menlo, monospace; word-break: break-word; }
.kicker { text-transform: uppercase; letter-spacing: .2em; font-size: 12px; font-weight: 600; color: var(--blue); }
.lede { color: var(--muted); max-width: 840px; margin: 12px 0 16px; font-size: 16.5px; }
.grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 14px; align-items: start; }
@media (max-width: 860px) { .grid { grid-template-columns: minmax(0, 1fr); } }
figure { margin: 0; } figure img { width: 100%; height: auto; display: block; border: 1.5px solid var(--rule); }
figcaption { font-size: 13px; color: var(--muted); margin-top: 6px; }
.card { border: 1.5px solid var(--rule); background: var(--card); padding: 12px 14px; min-width: 0; }
.card h3:first-child { margin-top: 0; }
.tree, .tree ul { list-style: none; margin: 0; padding-left: 14px; }
.tree { padding-left: 0; font-size: 13.5px; }
.tree li { border-left: 2px solid var(--rule); padding: 1px 0 1px 8px; margin: 1px 0; }
.tree .ch { font: 12px ui-monospace, Menlo, monospace; color: var(--gold); word-break: break-word; }
video { width: 100%; max-width: 720px; height: auto; display: block; background: #000; aspect-ratio: 16 / 9; }
.muted { color: var(--muted); }
.tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.tbl th, .tbl td { border-bottom: 1px solid var(--rule); padding: 5px 6px; text-align: left; vertical-align: top; }
.tbl th { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); font-weight: 600; }
.tbl td.n { font: 13px ui-monospace, Menlo, monospace; white-space: nowrap; }
@media (max-width: 520px) { .tbl td.n { white-space: normal; font-size: 12px; } .tbl { font-size: 12.5px; } }
.scroll { overflow-x: auto; max-width: 100%; }
.scenes { margin: 0; padding-left: 18px; }
.toc { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 10px 0 0; padding: 0; list-style: none; }
pre { background: var(--card); border: 1.5px solid var(--rule); padding: 10px 12px; overflow-x: auto; font: 12.5px/1.5 ui-monospace, Menlo, monospace; max-width: 100%; }
footer { margin-top: 40px; color: var(--muted); font-size: 13px; }
</style>
</head>
<body>
<main>
  <div class="kicker">The Odyssey line, the workshop</div>
  <h1>The creature rigs</h1>
  <p class="lede">The giants and the animals were set pieces the performance engine could not give an intent. Here each is a pivot tree of real LDraw parts: the toy's own joints where it has them (the troll's shoulders and wrists, the cow's head, the hose segments of Scylla's necks), and the set pieces' animal parts cut on straight seams into the pieces that move (the goat, the German shepherd, the cow's body, the troll's face, jaw, forearms and legs). Every pose, gait, herd and heavy step is a pure function of time, so a frame rendered offline is the frame the player shows, scrubbed either way.</p>
  <ul class="toc">${kinds.map(k => `<li><a href="#${E(k.kind)}">${E(k.title)}</a></li>`).join('')}<li><a href="#api">The API</a></li></ul>
${cards.join('\n')}
  <section id="api">
    <h2>The API</h2>
    <p class="lede"><code>film-readymades/creatures.js</code> (<code>window.OdysseyCreatures</code>, and a CommonJS module for the tools), documented in <a href="../../film-readymades/CREATURES.md"><code>film-readymades/CREATURES.md</code></a>.</p>
    <pre>const rig = OdysseyCreatures.define('ram', { scale: 2.4, colour: 'white' });
const v = OdysseyCreatures.gait(rig, t, { path: [[0, -260, 0], [8, 220, 0]], gait: 'walk', stance: 5 });
rig.attach(THREE, group, (fileOrPart, colour) => meshFor(fileOrPart, colour));   // once
rig.apply(v);                                                                   // every frame
const belly = rig.anchor('belly', v);                                           // where Odysseus clings

// in a scene sheet (odyssey-choreo/1): a creature actor with procedures and keys
sheet.creatures = OdysseyCreatures.fragment('argos', 'dog', { scale: 1.3, colour: 'brown', procs: [{ type: 'preset', name: 'lie' }], channels: { 'head.pitch': [[2, -0.25], [2.8, 0.45, 'out']] } });
const { v: pose, fx, riders } = OdysseyCreatures.sample(sheet, 'argos', t);</pre>
  </section>
  <footer>Made by <code>tools/creatures/page.js</code>; the films by <code>tools/creatures/films.js</code> on the CPU (<code>tools/creatures/raster.js</code>), the cut pieces by <code>tools/creatures/build.js</code>, the checks by <code>tools/creatures/test.js</code>. LDraw parts under CCAL 2.0.</footer>
</main>
</body>
</html>
`;
  fs.writeFileSync(path.join(DIR, 'index.html'), html);
  console.log('odyssey/creatures/index.html', (html.length / 1024).toFixed(0) + ' KB,', kinds.length, 'creatures');
}
page();
