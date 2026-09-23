/* world/shop.js — The List as a game: the supermarket (world/models/supermarket.js) as a store to shop in, Homer's list in your hand,
   Ned Flanders on your trail keeping his own record of what you take.

   The working paper's two documents are the game's two notes. The list (top left) is the shopper's: a partial future-state
   language, what the shopping is to make true; an item is struck when it is taken, a thing taken that was never on it is written in
   in red. Ned's record (top right) is the detective's: what he saw put in the cart, written as he sees it; when a shelf hides the
   taking he writes his best guess with a query, and a guess can be wrong. At the belt the receipt says what was bought, and the
   three are laid side by side: where the list and the receipt disagree the mistake is in the performance (the shopping should be
   put right), where Ned's record and the receipt disagree the mistake is in the record (the record should be put right). Anscombe's
   shopper and detective, played.

   ?film=case-grocery&shop on any page with the film (word-to-world, cinerium, word-to-momento) lays the case and starts the game
   with the player as Homer. Walk with the stick or WASD; E or the button takes what is in reach; the belt at a lane checks out.
   The cart (with Maggie) rolls ahead of you; Bart and Lisa, then Ned, follow the way you walked (a trail of your steps, so no one
   cuts through a shelf). The plan in the model's JSON (play/models/supermarket.json .plan) is in studs; the laid set's solid
   (world/solids.js) turns studs to the world and says where the shelves stand. */
(function () {
'use strict';
const Q = new URLSearchParams(location.search);
/** What a shelf offers when it is not the thing on the list: the first of each is what Ned guesses when he did not see. */
const VOCAB = {
  bread: ['white bread', 'donuts', 'bagels', 'hot dog buns'], cereal: ["Krusty-O's", 'frosted flakes', 'oatmeal'], coffee: ['coffee', 'tea bags', 'cocoa'],
  canned: ['canned beans', 'canned corn', 'canned peaches'], soup: ['tomato soup', 'chicken noodle soup'], oil: ['vegetable oil', 'plain olive oil', 'vinegar', 'light olive oil'],
  condiments: ['ketchup', 'mustard', 'mayonnaise', 'relish'], baking: ['plain flour', 'sugar', 'baking soda', 'self-raising flour'], spices: ['salt', 'pepper', 'cinnamon'],
  pasta: ['spaghetti', 'macaroni', 'rice'], intl: ['salsa', 'soy sauce', 'tortillas'], snacks: ['potato chips', 'pork rinds', 'cheese puffs'], drinks: ['Buzz Cola', 'Duff beer', 'orange juice'],
  household: ['dish soap', 'bleach', 'sponges'], paper: ['paper towels', 'toilet paper'], baby: ['diapers', 'baby food', 'formula'],
  produce: ['apples', 'potatoes', 'lettuce', 'yellow bananas', 'blueberries', 'raspberries'], frozen: ['frozen peas', 'ice cream', 'frozen pizza', 'fish sticks'],
  dairy: ['milk', 'eggs', 'cheese', 'butter', 'yogurt'], meat: ['pork chops', 'ground beef', 'bacon'], endcap: ['donuts', 'Duff beer', 'potato chips'], flowers: ['flowers'],
};
const NED = {
  hello: 'Hi-diddly-ho, neighborino! Don\'t mind me, just browsing-diddly-owsing.',
  saw: ['Okily-dokily: {x}. Noted.', 'Well, {x}, is it? Into the book it goes.', 'A-ha, {x}-diddly-oo.', 'Scribble scribble: {x}.'],
  missed: ['Now where\'d he get to-diddly-oo?', 'Shelves in the way, gosh darn it. Darn it! Forgive me.', 'Hmm, something went in that cart.'],
  guess: 'Something from {w}. Let\'s say {x}?',
  offlist: ['{x}? That\'s not on any list I\'d write!', 'Oh, {x}. The flesh is weak, neighbor.'],
  caught: 'Just reading the labels-a-diddly-abels!',
};
const S = { on: false };
let W, F, solid, plan, M = 40;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pick = (a, k) => a[((k % a.length) + a.length) % a.length];
const fmt = (t, x) => t.replace('{x}', x).replace('{w}', x);

/* ── the page: two notes, where you are, the button, Ned's line, the end card ── */
function ui() {
  if ($('#shopList')) return;
  const st = document.createElement('style'); st.textContent = `
  .shopNote{position:fixed;z-index:60;top:14px;width:min(40vw,230px);padding:10px 12px 12px 22px;font:italic 15px/1.45 Georgia,"Times New Roman",serif;color:#1d2a57;box-shadow:2px 3px 8px rgba(0,0,0,.35);pointer-events:none}
  #shopList{left:12px;background:#fbf5df;transform:rotate(-2deg);background-image:linear-gradient(90deg,transparent 14px,rgba(200,70,70,.5) 14px,rgba(200,70,70,.5) 15px,transparent 15px),repeating-linear-gradient(transparent 0 20px,rgba(90,130,190,.3) 20px 21px)}
  #shopRec{right:12px;background:#f3f0e6;transform:rotate(1.5deg);font-family:"Courier New",ui-monospace,monospace;font-style:normal;font-size:13px;color:#233}
  .shopNote h4{margin:0 0 4px;font:700 15px Georgia,serif;font-style:normal}
  #shopRec h4{font-family:"Courier New",monospace;font-size:13px;text-transform:uppercase;letter-spacing:.06em}
  .shopNote div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .shopNote .got{text-decoration:line-through;text-decoration-thickness:2px;opacity:.75}.shopNote .add{color:#b0341e}.shopNote .q{color:#b0341e}.shopNote .dim{opacity:.55}
  #shopWhere{position:fixed;z-index:60;top:12px;left:50%;transform:translateX(-50%);padding:5px 14px;background:#1d3b8b;color:#fff;font:700 14px Helvetica,Arial,sans-serif;border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap}
  #shopWhere b{display:inline-block;min-width:22px;margin-right:8px;padding:0 5px;background:#fff;color:#1d3b8b;border-radius:2px;text-align:center}
  #shopAct{position:fixed;z-index:61;bottom:92px;left:50%;transform:translateX(-50%);padding:11px 20px;border:0;border-radius:24px;background:#ffd21f;color:#1b1b1b;font:700 16px Helvetica,Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.4);cursor:pointer}
  #shopAct[hidden]{display:none}#shopAct kbd{margin-right:8px;padding:0 6px;border:1px solid #1b1b1b;border-radius:3px;font:700 12px ui-monospace,monospace}
  #shopSay{position:fixed;z-index:60;right:14px;top:calc(14px + var(--recH,120px) + 12px);max-width:min(46vw,260px);padding:8px 11px;background:#fff;color:#222;border:2px solid #2a7a2a;border-radius:12px;font:14px/1.35 Helvetica,Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.3);pointer-events:none;transition:opacity .3s}
  #shopSay::before{content:"Ned";display:block;font-weight:700;color:#2a7a2a;font-size:12px}
  #shopTime{position:fixed;z-index:60;top:48px;left:50%;transform:translateX(-50%);color:#fff;font:700 13px ui-monospace,monospace;text-shadow:0 1px 3px #000;pointer-events:none}
  #shopEnd{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(10,14,30,.72);padding:16px}
  #shopEnd[hidden]{display:none}
  #shopEnd .card{max-width:860px;width:100%;max-height:100%;overflow:auto;background:#fffdf5;border-radius:6px;padding:18px 20px;font:15px/1.45 Georgia,serif;color:#1d2a57;box-shadow:0 8px 30px rgba(0,0,0,.5)}
  #shopEnd h3{margin:0 0 4px;font:700 22px Georgia,serif}#shopEnd .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:12px 0}
  @media (max-width:640px){#shopEnd .cols{grid-template-columns:1fr}.shopNote{width:44vw;font-size:13px}}
  #shopEnd .col{background:#f4efdc;padding:10px 12px;border-radius:4px}#shopEnd .col h4{margin:0 0 6px;font:700 14px Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.05em}
  #shopEnd .verdict{margin:6px 0;padding-left:10px;border-left:3px solid #b0341e}#shopEnd button{margin-top:10px;padding:9px 16px;border:0;border-radius:4px;background:#1d3b8b;color:#fff;font:700 14px Helvetica,Arial,sans-serif;cursor:pointer}`;
  document.head.appendChild(st);
  const add = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; document.body.appendChild(e); return e; };
  add('div', 'shopList').className = 'shopNote'; add('div', 'shopRec').className = 'shopNote'; add('div', 'shopWhere'); add('div', 'shopTime');
  const b = add('button', 'shopAct'); b.hidden = true; b.addEventListener('click', e => { e.stopPropagation(); act(); }); b.addEventListener('pointerdown', e => e.stopPropagation());
  add('div', 'shopSay').style.opacity = 0; add('div', 'shopEnd').hidden = true;
  window.addEventListener('keydown', e => { if (!S.on || /INPUT|TEXTAREA/.test(e.target.tagName)) return; if (e.code === 'KeyE') { act(); e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
function paint() {
  const L = $('#shopList'), R = $('#shopRec');
  L.innerHTML = '<h4>Homer\'s list</h4>' + S.items.map(it => `<div class="${it.got ? 'got' : ''}">${it.n}. ${esc(it.name)}</div>`).join('') + S.extra.map(x => `<div class="add">+ ${esc(x)}</div>`).join('');
  R.innerHTML = '<h4>Ned\'s record</h4>' + (S.record.length ? S.record.map(r => `<div class="${r.sure ? '' : 'q'}">${esc(r.clock)} ${esc(r.text)}${r.sure ? '' : ' ?'}</div>`).join('') : '<div class="dim">(nothing yet, neighbor)</div>');
  document.documentElement.style.setProperty('--recH', R.offsetHeight + 'px');
}
let sayT = 0;
function say(text, sec = 3.2) { const e = $('#shopSay'); if (!e) return; e.textContent = text; e.style.opacity = 1; sayT = sec; }

/* ── the store: studs to the world, the zone you are in, the shelf in front of you ── */
const toW = (x, z) => { const [wx, wz] = solid.toWorld(x, z); return { x: wx, z: wz }; };
const here = p => { const [x, z] = solid.toStud(p.x, p.z); return { x, z }; };
function zoneAt(s) {
  for (const a of plan.aisles) if (s.x >= a.x0 - 0.5 && s.x < a.x1 + 0.5 && s.z >= a.z0 - 1 && s.z < a.z1 + 1) return { aisle: a, name: a.name, n: a.n };
  for (const z of plan.zones) if (s.x >= z.x0 && s.x < z.x1 && s.z >= z.z0 && s.z < z.z1) return { name: z.name };
  return { name: s.z < 8 ? 'Outside' : 'The Store' };
}
/** The category on the shelf at a stud cell, from where it stands. */
function categoryAt(cx, cz, zone) {
  const a = zone.aisle; if (a) { const face = cx < (a.x0 + a.x1) / 2 ? 'west' : 'east'; return a[face] || 'canned'; }
  if (cz >= 28 && cz < 32 || cz >= 78 && cz < 80) return 'endcap';
  const n = zone.name; if (/Produce/.test(n)) return 'produce'; if (/Frozen/.test(n)) return 'frozen'; if (/Dairy/.test(n)) return 'dairy'; if (/Meat/.test(n)) return 'meat';
  if (/Bread/.test(n)) return 'bread'; if (/Service/.test(n)) return 'flowers'; if (cz >= 88) return 'dairy'; return null;
}
/** What is in reach: a thing on the list, a shelf's goods, or the belt. */
function reach() {
  const p = W.rig.pos, s = here(p), zone = zoneAt(s);
  for (const it of S.items) if (!it.got && Math.hypot(s.x - (it.at[0] + 0.5), s.z - (it.at[1] + 0.5)) < 2.8) return { kind: 'item', it, label: 'take ' + it.name, zone };
  if (S.bought.length) for (const L of plan.lanes) if (Math.hypot(s.x - L.customer[0], s.z - L.customer[1]) < 3.2) return { kind: 'belt', lane: L, label: 'unload at lane ' + L.n + ' and pay', zone };
  const h = W.rig.heading, fx = Math.sin(h), fz = Math.cos(h);   // the shelf ahead first, then either side
  for (const [dx, dz] of [[fx, fz], [fz, -fx], [-fz, fx]]) for (const d of [0.9, 1.6]) {
    const wx = p.x + dx * d * M, wz = p.z + dz * d * M; if (!solid.blocked(wx, wz)) continue;
    const c = here({ x: wx, z: wz }), cx = Math.floor(c.x), cz = Math.floor(c.z), cat = categoryAt(cx, cz, zone); if (!cat || !VOCAB[cat]) continue;
    const name = pick(VOCAB[cat], (cat === 'endcap' ? cx : Math.floor(cz / 3) * 7 + Math.floor(cx / 3)));
    return { kind: 'shelf', cat, name, label: 'take ' + name, zone, cell: [cx, cz] };
  }
  return { kind: null, zone };
}
/** A clear line between two world points: no shelf or wall stands on it. */
function clear(a, b) { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / (0.35 * M)); for (let i = 1; i < n; i++) { const t = i / n; if (solid.blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; } return true; }
const clock = () => { const t = Math.floor(S.t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

/* ── taking ── */
function act() {
  if (!S.on || S.done) return false; const r = S.reach; if (!r || !r.kind) return false;
  if (r.kind === 'belt') { finish(r.lane); return true; }
  const item = r.kind === 'item' ? r.it : null, name = item ? item.name : r.name, where = r.zone.n ? 'Aisle ' + r.zone.n : r.zone.name;
  if (item) item.got = true; else S.extra.push(name);
  const take = { name, list: item ? item.n : null, where, cat: item ? null : r.cat, t: S.t, clock: clock(), seen: false };
  S.bought.push(take);
  const ned = nedPos(); take.seen = !!ned && Math.hypot(ned.x - W.rig.pos.x, ned.z - W.rig.pos.z) < 16 * M && clear(ned, W.rig.pos);
  if (take.seen) { S.record.push({ text: name, sure: true, clock: take.clock, of: take }); say(item ? fmt(pick(NED.saw, S.bought.length), name) : fmt(pick(NED.offlist, S.bought.length), name)); }
  else { S.unseen.push(take); say(pick(NED.missed, S.bought.length)); }
  if (window.Fx && Fx.Sfx && Fx.Sfx.click) try { Fx.Sfx.click(); } catch (e) { }
  paint(); return true;
}
/** Ned catches up with what he missed the moment he has you in sight again: a guess from where you were, with a query. */
function nedCatchUp() {
  if (!S.unseen.length) return; const ned = nedPos(); if (!ned || Math.hypot(ned.x - W.rig.pos.x, ned.z - W.rig.pos.z) > 10 * M || !clear(ned, W.rig.pos)) return;
  for (const tk of S.unseen) { const cat = tk.cat || guessCat(tk); const g = cat && VOCAB[cat] ? VOCAB[cat][0] : 'something'; S.record.push({ text: g, sure: false, clock: clock(), of: tk }); say(fmt(NED.guess.replace('{w}', tk.where), g)); }
  S.unseen = []; paint();
}
const guessCat = tk => { const it = plan.items.find(i => i.n === tk.list); if (!it) return null; return { 1: 'produce', 2: 'produce', 3: 'oil', 4: 'baking', 5: 'frozen' }[it.n] || null; };

/* ── the cast: a trail of the player's steps; Bart, Lisa and Ned walk it some way behind ── */
function nedPos() { const a = F.actors.get('flanders'); return a && a.rig ? a.rig.pos : null; }
function trail(dt) {
  const p = W.rig.pos, last = S.crumbs[S.crumbs.length - 1];
  if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 0.7 * M) { S.crumbs.push({ x: p.x, z: p.z }); if (S.crumbs.length > 400) { S.crumbs.shift(); for (const f of S.followers) f.i = Math.max(0, f.i - 1); } }
}
/** A follower's driver: walk the trail crumb by crumb, stop lag metres behind the player, face them; Ned hides his face in a shelf when looked at. */
function follower(name, lag, ned) {
  const a = F.actors.get(name); if (!a || !a.rig) return null; const f = { name, a, i: 0, lag };
  a.free = true; a.act = null; a.drive = (ctl, rig) => {
    if (!S.on) return; const p = W.rig.pos, dMe = Math.hypot(p.x - rig.pos.x, p.z - rig.pos.z);
    while (f.i < S.crumbs.length - 1 && Math.hypot(S.crumbs[f.i].x - rig.pos.x, S.crumbs[f.i].z - rig.pos.z) < 0.8 * M) f.i++;
    const c = S.crumbs[f.i], ahead = S.crumbs.length - 1 - f.i;
    if (c && dMe > lag * M && ahead > 0) { const dx = c.x - rig.pos.x, dz = c.z - rig.pos.z, d = Math.hypot(dx, dz) || 1; ctl.move.x = dx / d; ctl.move.z = dz / d; ctl.move.mag = 1; ctl.run = ahead > 14 || dMe > (lag + 6) * M; }
    else { ctl.move.mag = 0; rig.heading = Math.atan2(p.x - rig.pos.x, p.z - rig.pos.z); rig.figure.rotation.y = rig.heading;
      if (ned) { const h = W.rig.heading, lx = rig.pos.x - p.x, lz = rig.pos.z - p.z, ang = Math.acos(Math.max(-1, Math.min(1, (Math.sin(h) * lx + Math.cos(h) * lz) / (Math.hypot(lx, lz) || 1))));
        if (ang < 0.35 && dMe < 9 * M) { rig.heading += Math.PI * 0.5; rig.figure.rotation.y = rig.heading; if (S.t - (S.caughtT || -99) > 12) { S.caughtT = S.t; say(NED.caught); } } } }
  };
  return f;
}

/* ── start, step, finish ── */
async function start() {
  W = window.__world; F = W && W.film; if (!F) return false;
  const d = [...F.donors.values()].find(x => x.set === 'supermarket' && x.solid && x.plan); if (!d) return false;
  solid = d.solid; plan = d.plan; M = solid.cellL * 2;
  if (!F.rehearse.part) F.takePart('homer');
  const door = toW(plan.door[0] + 0.5, plan.door[1] + 2.5); W.rig.pos.set(door.x, W.rig.pos.y, door.z); W.rig.heading = 0; W.rig.figure.rotation.y = 0; if (W.rig.cam) W.rig.cam.set = false;
  const put = (name, x, z, h) => { const a = F.actors.get(name); if (!a) return; const w = toW(x, z); if (a.rig) { a.rig.pos.set(w.x, a.rig.pos.y, w.z); a.rig.heading = h || 0; a.rig.figure.rotation.y = a.rig.heading; } else if (a.V) { a.V.pos.x = w.x; a.V.pos.z = w.z; a.V.heading = h || 0; } };
  put('cart', plan.door[0] + 0.5, plan.door[1] + 7, 0); put('bart', plan.door[0] - 2, plan.door[1] + 1); put('lisa', plan.door[0] + 3, plan.door[1] + 1); put('flanders', 40, 22, Math.PI * 0.6);
  const clerk = plan.lanes[0]; put('clerk', clerk.clerk[0], clerk.clerk[1], -Math.PI / 2);
  const cart = F.actors.get('cart'); if (cart) { cart.free = true; cart.act = { lead: 'homer', ahead: 2.2 }; }
  S.items = plan.items.map(it => ({ ...it, got: false })); S.extra = []; S.bought = []; S.record = []; S.unseen = []; S.crumbs = []; S.t = 0; S.done = false;
  S.followers = [follower('bart', 2.4), follower('lisa', 3.2), follower('flanders', 6.5, true)].filter(Boolean);
  ui(); paint(); S.on = true; say(NED.hello, 4.5);
  return true;
}
S.step = dt => {
  if (!S.on || S.done) return; S.t += dt; trail(dt);
  S.reach = reach(); const b = $('#shopAct');
  if (S.reach.kind) { b.hidden = false; b.innerHTML = '<kbd>E</kbd>' + esc(S.reach.label); } else b.hidden = true;
  const z = S.reach.zone, w = $('#shopWhere'); w.innerHTML = z.n ? `<b>${z.n}</b>${esc(z.name)}` : esc(z.name);
  $('#shopTime').textContent = clock();
  if ((S.lookT = (S.lookT || 0) + dt) > 0.4) { S.lookT = 0; nedCatchUp(); }
  if (sayT > 0 && (sayT -= dt) <= 0) $('#shopSay').style.opacity = 0;
};
function finish(lane) {
  S.done = true; $('#shopAct').hidden = true; nedCatchUp();
  const listed = S.items, missing = listed.filter(i => !i.got), extras = S.bought.filter(b => b.list == null);
  const wrong = S.record.filter(r => r.text !== r.of.name), unrecorded = S.bought.filter(b => !S.record.some(r => r.of === b));
  const col = (title, rows) => `<div class="col"><h4>${title}</h4>${rows.join('') || '<div>(nothing)</div>'}</div>`;
  const v = [];
  if (missing.length) v.push(`The list and the receipt disagree: <b>${missing.map(i => esc(i.name)).join(', ')}</b> ${missing.length > 1 ? 'were' : 'was'} on the list and not bought. The mistake is in the performance: the list stands, the shopping should be put right.`);
  if (extras.length) v.push(`<b>${extras.map(b => esc(b.name)).join(', ')}</b> went in the cart and on the receipt, never on the list. The list did not ask for ${extras.length > 1 ? 'them' : 'it'}; the shopping went past it.`);
  if (wrong.length) v.push(`Ned's record and the receipt disagree: he wrote <b>${wrong.map(r => esc(r.text)).join(', ')}</b> where the receipt has <b>${wrong.map(r => esc(r.of.name)).join(', ')}</b>. The mistake is in the record: it is the record that should be put right.`);
  if (unrecorded.length) v.push(`Ned's record is short by ${unrecorded.length}: ${unrecorded.length > 1 ? 'things' : 'a thing'} went in the cart where he could not see. A record can be wrong by leaving out as well as by getting wrong; the receipt is what it answers to.`);
  if (!missing.length && !extras.length && !wrong.length && !unrecorded.length) v.push('The list, the record and the receipt agree. The shopping made the list true, and the record describes what was done.');
  $('#shopEnd').innerHTML = `<div class="card"><h3>Lane ${lane.n}: the receipt</h3><div>${clock()} in the store, ${S.bought.length} thing${S.bought.length === 1 ? '' : 's'} on the belt.</div>
    <div class="cols">${col("Homer's list", [...listed.map(i => `<div style="${i.got ? 'text-decoration:line-through' : ''}">${i.n}. ${esc(i.name)}</div>`), ...extras.map(b => `<div style="color:#b0341e">+ ${esc(b.name)}</div>`)])}
    ${col("Ned's record", S.record.map(r => `<div style="${r.text !== r.of.name ? 'color:#b0341e' : ''}">${esc(r.clock)} ${esc(r.text)}${r.sure ? '' : ' ?'}</div>`).concat(unrecorded.map(b => `<div style="opacity:.6">(missed one)</div>`)))}
    ${col('The receipt', S.bought.map(b => `<div>${esc(b.name)} <span style="opacity:.6">(${esc(b.where)})</span></div>`))}</div>
    ${v.map(x => `<div class="verdict">${x}</div>`).join('')}<button id="shopAgain">Shop again</button></div>`;
  $('#shopEnd').hidden = false; $('#shopAgain').onclick = () => location.reload();
  say(missing.length ? 'Well, that list isn\'t true yet, neighbor!' : 'Hi-diddly-done! And it\'s all in my book.', 5);
}
S.start = start; S.act = act; window.Shop = S;
/* ?shop: once the case's set is laid and solid, the game begins */
if (Q.get('shop') != null) { const t0 = performance.now(); const wait = () => { const w = window.__world, f = w && w.film; if (f && f.scene && f.scene.ready && [...f.donors.values()].some(d => d.plan)) { start().then(ok => { if (!ok) setTimeout(wait, 500); }); return; } if (performance.now() - t0 < 180000) setTimeout(wait, 400); }; setTimeout(wait, 600); }
})();
