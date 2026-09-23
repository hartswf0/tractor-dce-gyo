/* world/shop.js — The List as a game: the supermarket (world/models/supermarket.js) as a store to shop in, Marge's list in Homer's
   hand, Ned Flanders on his trail keeping a record of what goes in the cart.

   Anscombe's shopping list (Intention §32), played. There are three documents and one cart:
     - the list (top left) is an order: it says what the cart should become. Its direction of fit is world-to-word: when the cart
       and the list disagree, the cart is wrong, and the shopper puts it right (R puts a wrong thing back). The list is never
       rewritten to fit the cart; a thing is ticked when the cart holds it.
     - the cart (under the list) is the world: what has actually been taken.
     - Ned's record (top right) is a description: it says what went in the cart. Its direction of fit is word-to-world: when the
       record and the cart disagree, the record is wrong, and Ned puts it right. He writes what he sees; when a shelf hides the
       taking he guesses (a '?' line), and when he gets a look into the cart he corrects his guesses to fit it.
   Five red apples is Wittgenstein's slip (Philosophical Investigations §1): the crate marked APPLES, the sample RED beside the
   word, and a count to five, one apple at a time. At the belt the receipt says what was bought and the three are laid side by side.

   ?film=case-grocery&shop on a page with the film (cinerium, word-to-world, word-to-momento) lays the case and starts the game
   with the player as Homer; the-list.html is the way in. Walk with the stick or WASD; E takes what is in reach; R puts back;
   N hides the notes. The plan in the model's JSON (play/models/supermarket.json .plan: items, fixtures, aisles, zones, lanes,
   signs) is in studs; the laid set's solid (world/solids.js) turns studs to the world and says where the shelves stand. */
(function () {
'use strict';
const Q = new URLSearchParams(location.search);
/** What a shelf offers where no fixture names it: by the aisle face's category or the zone. */
const VOCAB = {
  bread: ['white bread', 'hot dog buns', 'bagels'], cereal: ["Krusty-O's", 'Frosty Krusty Flakes', 'oatmeal'], coffee: ['coffee', 'tea bags', 'cocoa'],
  canned: ["Uncle Jim's Country Fillin'", 'canned corn', 'canned peaches'], soup: ['tomato soup', 'chicken noodle soup'], oil: ['vegetable oil', 'vinegar'],
  condiments: ['ketchup', 'mustard', 'mayonnaise', 'relish'], baking: ['plain flour', 'sugar', 'baking soda'], spices: ['salt', 'pepper', 'cinnamon'],
  pasta: ["Luigi's spaghetti", 'macaroni', 'rice'], intl: ['salsa', 'soy sauce', 'tortillas'], snacks: ['potato chips', 'pork rinds', 'cheese puffs'], drinks: ['Buzz Cola', 'Duff beer', 'orange juice'],
  household: ['Mr. Sparkle', 'bleach', 'sponges'], paper: ['paper towels', 'toilet paper'], baby: ['diapers', 'baby food', 'formula'],
  produce: ['lettuce', 'celery', 'peppers', 'tomatoes'], frozen: ['frozen peas', 'ice cream', 'frozen pizza'], dairy: ['milk', 'eggs', 'cheese', 'butter', 'yogurt'],
  meat: ['pork chops', 'ground beef', 'bacon'], endcap: ['Lard Lad donuts', 'Buzz Cola', "Krusty-O's"],
};
/** Ned's guess when a shelf hid the taking: the thing's plainer neighbour. */
const GUESS = { 'organic flour': 'plain flour', 'extra virgin olive oil': 'olive oil', 'southwest style hash browns': 'hash browns', 'black berries': 'berries', 'green bananas': 'bananas', 'red apples': 'apples' };
const NED = {
  hello: 'Hi-diddly-ho, neighborino! Got a list, have we? I\'ll just keep a little record.',
  saw: ['Okily-dokily: {x}. Noted.', 'Well, {x}, is it? Into the book it goes.', 'A-ha, {x}-diddly-oo.', 'Scribble scribble: {x}.'],
  missed: ['Now where\'d he get to-diddly-oo?', 'Shelves in the way, gosh darn it. Darn it! Forgive me.', 'Hmm, something went in that cart.'],
  guess: 'Something from {w}. I\'ll put down {x}?',
  fix: 'Oh, that\'s {x}, not {y}! My record was wrong. Fixed.',
  back: 'Put it back, did he? Then out of my record it goes.',
  offlist: ['{x}? That\'s not on any list I\'d write!', 'Oh, {x}. The flesh is weak, neighbor.'],
  caught: 'Just reading the labels-a-diddly-abels!',
};
const LISA = { colour: 'Dad, the list says red. Put the green ones back.', wrong: 'Dad, the list doesn\'t say {x}. Change the cart, not the list.', count: 'That\'s {n}. The list says five.' };
const S = { on: false };
let W, F, solid, plan, M = 40;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pick = (a, k) => a[((k % a.length) + a.length) % a.length];
const fill = (t, o) => t.replace(/\{(\w)\}/g, (m, k) => o[k] != null ? o[k] : m);

/* ── the page ── */
function ui() {
  if ($('#shopList')) return;
  const st = document.createElement('style'); st.textContent = `
  body.shop-on #film,body.shop-on #fb,body.shop-on #reel,body.shop-on #perform,body.shop-on #wb,body.shop-on #det,body.shop-on #build,body.shop-on #backdropPanel,body.shop-on #hint,body.shop-on #prompt,body.shop-on #room,body.shop-on #chat,body.shop-on #title,body.shop-on #caption,body.shop-on #place,body.shop-on #words,body.shop-on #menuBtn,body.shop-on #tally{display:none!important}
  .shopNote{position:fixed;z-index:60;top:10px;width:min(38vw,200px);padding:7px 9px 8px 18px;font:italic 13px/1.4 Georgia,"Times New Roman",serif;color:#1d2a57;box-shadow:2px 3px 8px rgba(0,0,0,.35);pointer-events:none;transition:opacity .25s}
  body.shop-notes-off .shopNote,body.shop-notes-off #shopCart{opacity:0}
  #shopList{left:10px;background:#fbf5df;transform:rotate(-1.5deg);background-image:linear-gradient(90deg,transparent 11px,rgba(200,70,70,.5) 11px,rgba(200,70,70,.5) 12px,transparent 12px)}
  #shopRec{right:10px;background:#f1eee4;transform:rotate(1.2deg);font-family:"Courier New",ui-monospace,monospace;font-style:normal;font-size:12px;color:#22303a;border-top:4px solid #2a7a2a;padding-left:10px}
  .shopNote h4{margin:0 0 2px;font:700 13px Georgia,serif;font-style:normal;display:flex;justify-content:space-between;gap:6px}.shopNote h4 small{font:italic 10px Georgia,serif;color:#7a6a4a}
  #shopRec h4{font-family:"Courier New",monospace;font-size:12px;text-transform:uppercase}#shopRec h4 small{font-family:Georgia,serif;text-transform:none}
  .shopNote div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .shopNote .got{text-decoration:line-through;text-decoration-thickness:2px;opacity:.72}.shopNote .q,.shopNote .add{color:#b0341e}.shopNote .x{text-decoration:line-through;color:#b0341e;opacity:.7}.shopNote .dim{opacity:.55}
  #shopCart{position:fixed;z-index:60;left:10px;top:calc(14px + var(--listH,140px));width:min(38vw,200px);padding:5px 9px;background:rgba(18,24,44,.82);color:#fff;font:12px/1.35 Helvetica,Arial,sans-serif;border-radius:3px;pointer-events:none;transition:opacity .25s}
  #shopCart b{color:#ffd21f;font-size:11px;text-transform:uppercase;letter-spacing:.05em}#shopCart .bad{color:#ff9b8a}
  #shopWhere{position:fixed;z-index:60;top:10px;left:50%;transform:translateX(-50%);padding:4px 12px;background:#1d3b8b;color:#fff;font:700 13px Helvetica,Arial,sans-serif;border-radius:3px;box-shadow:0 2px 6px rgba(0,0,0,.35);pointer-events:none;white-space:nowrap;max-width:44vw;overflow:hidden;text-overflow:ellipsis}
  #shopWhere b{display:inline-block;min-width:18px;margin-right:7px;padding:0 5px;background:#fff;color:#1d3b8b;border-radius:2px;text-align:center}
  #shopTime{position:fixed;z-index:60;top:40px;left:50%;transform:translateX(-50%);color:#fff;font:700 12px ui-monospace,monospace;text-shadow:0 1px 3px #000;pointer-events:none}
  #shopActs{position:fixed;z-index:61;bottom:84px;left:50%;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;justify-content:center;max-width:94vw}
  #shopActs button{padding:10px 16px;border:0;border-radius:22px;background:#ffd21f;color:#1b1b1b;font:700 15px Helvetica,Arial,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.4);cursor:pointer}
  #shopActs button.back{background:#fff;color:#b0341e}#shopActs kbd{margin-right:7px;padding:0 5px;border:1px solid currentColor;border-radius:3px;font:700 11px ui-monospace,monospace}
  #shopSay{position:fixed;z-index:60;right:12px;top:calc(18px + var(--recH,120px));max-width:min(44vw,250px);padding:6px 10px;background:#fff;color:#222;border:2px solid #2a7a2a;border-radius:11px;font:13px/1.35 Helvetica,Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.3);pointer-events:none;transition:opacity .3s}
  #shopSay[data-who]::before{content:attr(data-who);display:block;font-weight:700;color:#2a7a2a;font-size:11px}#shopSay[data-who="Lisa"]{border-color:#c4281c}#shopSay[data-who="Lisa"]::before{color:#c4281c}
  #shopFit{position:fixed;z-index:62;top:62px;left:50%;transform:translateX(-50%);padding:9px 14px 8px;background:rgba(12,16,34,.9);color:#fff;border-radius:6px;text-align:center;pointer-events:none;transition:opacity .35s;font:13px/1.3 Helvetica,Arial,sans-serif;max-width:94vw}
  #shopFit .row{display:flex;align-items:center;justify-content:center;gap:10px}#shopFit .box{padding:5px 10px;border-radius:3px;color:#111;font-weight:800;min-width:92px}#shopFit .box small{display:block;font:italic 11px Georgia,serif}
  #shopFit .arr{color:#ffd21f;font-size:22px;font-weight:900}#shopFit .say{margin-top:6px;font-weight:600}#shopFit .dir{margin-top:2px;color:#9fb3ff;font:italic 11px Georgia,serif}
  #shopWitt{position:fixed;z-index:60;bottom:140px;left:50%;transform:translateX(-50%);display:flex;gap:6px;pointer-events:none;font:700 12px Helvetica,Arial,sans-serif}
  #shopWitt span{padding:4px 9px;background:#fbf8ee;color:#111;border-radius:3px;box-shadow:0 2px 5px rgba(0,0,0,.35)}#shopWitt i{display:inline-block;width:11px;height:11px;margin:0 5px -1px 0;background:#c4281c;border:1px solid #111}
  #shopStart,#shopEnd{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(10,14,30,.74);padding:14px}
  #shopStart[hidden],#shopEnd[hidden],#shopFit[hidden],#shopWitt[hidden]{display:none}
  .shopCard{max-width:860px;width:100%;max-height:100%;overflow:auto;background:#fffdf5;border-radius:6px;padding:16px 18px;font:15px/1.45 Georgia,serif;color:#1d2a57;box-shadow:0 8px 30px rgba(0,0,0,.5)}
  .shopCard h3{margin:0 0 4px;font:700 22px Georgia,serif}.shopCard .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:12px 0}
  @media (max-width:640px){.shopCard .cols{grid-template-columns:1fr}.shopNote,#shopCart{width:44vw;font-size:11px}}
  .shopCard .col{background:#f4efdc;padding:9px 11px;border-radius:4px}.shopCard .col h4{margin:0 0 6px;font:700 13px Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:.05em}.shopCard .col h4 small{display:block;font:italic 11px Georgia,serif;text-transform:none;letter-spacing:0;color:#7a6a4a}
  .shopCard .verdict{margin:6px 0;padding-left:10px;border-left:3px solid #b0341e}.shopCard .verdict b.dir{color:#1d3b8b}.shopCard button{margin-top:10px;padding:9px 16px;border:0;border-radius:4px;background:#1d3b8b;color:#fff;font:700 14px Helvetica,Arial,sans-serif;cursor:pointer}
  .shopCard .keys{font:13px Helvetica,Arial,sans-serif;color:#333}.shopCard kbd{padding:0 5px;border:1px solid #333;border-radius:3px;font:700 11px ui-monospace,monospace}`;
  document.head.appendChild(st);
  const add = (tag, id) => { const e = document.createElement(tag); e.id = id; document.body.appendChild(e); return e; };
  add('div', 'shopList').className = 'shopNote'; add('div', 'shopCart'); add('div', 'shopRec').className = 'shopNote'; add('div', 'shopWhere'); add('div', 'shopTime');
  const acts = add('div', 'shopActs'); acts.addEventListener('pointerdown', e => e.stopPropagation());
  add('div', 'shopSay').style.opacity = 0; add('div', 'shopFit').hidden = true; add('div', 'shopWitt').hidden = true; add('div', 'shopStart').hidden = true; add('div', 'shopEnd').hidden = true;
  window.addEventListener('keydown', e => { if (!S.on || /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.code === 'KeyE') { act('take'); e.stopImmediatePropagation(); e.preventDefault(); } else if (e.code === 'KeyR') { act('back'); e.stopImmediatePropagation(); e.preventDefault(); } else if (e.code === 'KeyN') document.body.classList.toggle('shop-notes-off'); }, true);
}
const itemLine = it => { const n = it.count || 1, k = Math.min(it.have, n); return `${esc(it.name)}${n > 1 ? ` <span class="dim">(${k} of ${n})</span>` : ''}`; };
function paint() {
  const L = $('#shopList'), C = $('#shopCart'), R = $('#shopRec');
  L.innerHTML = '<h4>Marge\'s list <small>an order</small></h4>' + S.items.map(it => `<div class="${it.have >= (it.count || 1) ? 'got' : ''}">${itemLine(it)}</div>`).join('');
  const bad = S.basket.filter(b => !b.item);
  C.innerHTML = `<b>In the cart</b> ${S.basket.length ? S.basket.length + ' thing' + (S.basket.length > 1 ? 's' : '') : 'nothing yet'}` + (bad.length ? '<br>' + bad.map(b => `<span class="bad">${esc(b.name)}: not on the list</span>`).join('<br>') : '');
  R.innerHTML = '<h4>Ned\'s record <small>a description</small></h4>' + (S.record.length ? S.record.map(r => `<div class="${r.struck ? 'x' : r.sure ? '' : 'q'}">${esc(r.text)}${!r.sure && !r.struck ? ' ?' : ''}</div>`).join('') : '<div class="dim">(nothing yet, neighbor)</div>');
  document.documentElement.style.setProperty('--listH', L.offsetHeight + 'px'); document.documentElement.style.setProperty('--recH', R.offsetHeight + 'px');
}
let sayT = 0, fitT = 0;
function say(text, who = 'Ned', sec = 3.4) { const e = $('#shopSay'); if (!e) return; e.dataset.who = who; e.textContent = text; e.style.opacity = 1; sayT = sec; }
/** The direction-of-fit card: 'list' (the cart is changed to fit the list) or 'record' (the record is changed to fit the cart). */
function fit(dir, a, b) {
  const e = $('#shopFit'), list = dir === 'list';
  e.innerHTML = `<div class="row"><span class="box" style="background:${list ? '#fbf5df' : '#e8e2cf'}">${list ? 'THE LIST' : 'THE CART'}<small>${esc(a)}</small></span><span class="arr">&#10142;</span><span class="box" style="background:${list ? '#ffe23d' : '#bfe3b9'}">${list ? 'THE CART' : "NED'S RECORD"}<small>${esc(b)}</small></span></div>
    <div class="say">${list ? 'The list stays as written: the cart is changed to fit it.' : 'The cart stays as it is: the record is changed to fit it.'}</div><div class="dir">${list ? 'world-to-word fit: the words say how the world should be' : 'word-to-world fit: the words say how the world is'}</div>`;
  e.hidden = false; e.style.opacity = 1; fitT = 4.2;
}

/* ── the store ── */
const toW = (x, z) => { const [wx, wz] = solid.toWorld(x, z); return { x: wx, z: wz }; };
const here = p => { const [x, z] = solid.toStud(p.x, p.z); return { x, z }; };
function zoneAt(s) {
  for (const a of plan.aisles) if (s.x >= a.x0 - 0.5 && s.x < a.x1 + 0.5 && s.z >= a.z0 - 1 && s.z < a.z1 + 1) return { aisle: a, name: a.name, n: a.n };
  for (const z of plan.zones) if (s.x >= z.x0 && s.x < z.x1 && s.z >= z.z0 && s.z < z.z1) return { name: z.name };
  return { name: s.z < 8 ? 'Outside' : 'The Store' };
}
const fixtureAt = (cx, cz) => (plan.fixtures || []).find(f => cx >= f.x0 && cx < f.x1 && cz >= f.z0 && cz < f.z1) || null;
function categoryAt(cx, cz, zone) {
  const a = zone.aisle; if (a) { const face = cx < (a.x0 + a.x1) / 2 ? 'west' : 'east'; return a[face] || 'canned'; }
  if (cz >= 28 && cz < 32 || cz >= 78 && cz < 80) return 'endcap';
  const n = zone.name; if (/Produce/.test(n)) return 'produce'; if (/Frozen/.test(n)) return 'frozen'; if (/Dairy/.test(n)) return 'dairy'; if (/Meat/.test(n)) return 'meat';
  if (/Bread|Bakery/.test(n)) return 'bread'; if (cz >= 88) return 'dairy'; return null;
}
/** The list item a fixture's thing answers to: the same words, or the list's words with a number in front (five red apples). */
const itemFor = name => S.items.find(it => it.name === name || it.name.replace(/^(one|two|three|four|five|six)\s+/, '') === name) || null;
/** What is in reach: the thing on the shelf in front (a fixture's, or the aisle's), what can go back to it, or the belt. */
function reach() {
  const p = W.rig.pos, s = here(p), zone = zoneAt(s), out = { zone, take: null, back: null, belt: null };
  if (S.basket.length) for (const L of plan.lanes) if (Math.hypot(s.x - L.customer[0], s.z - L.customer[1]) < 3.2) out.belt = L;
  const h = W.rig.heading, fx = Math.sin(h), fz = Math.cos(h);
  for (const [dx, dz] of [[fx, fz], [fz, -fx], [-fz, fx]]) { for (const d of [0.9, 1.6]) {
    const wx = p.x + dx * d * M, wz = p.z + dz * d * M; if (!solid.blocked(wx, wz)) continue;
    const c = here({ x: wx, z: wz }), cx = Math.floor(c.x), cz = Math.floor(c.z), fxr = fixtureAt(cx, cz);
    let name = fxr && fxr.name; if (!name) { const cat = categoryAt(cx, cz, zone); if (!cat || !VOCAB[cat]) continue; name = pick(VOCAB[cat], cat === 'endcap' ? cx : Math.floor(cz / 3) * 7 + Math.floor(cx / 3)); }
    out.take = { name, fixture: name, cell: [cx, cz] }; break; } if (out.take) break; }
  if (!out.take) for (const it of S.items) if (Math.hypot(s.x - (it.at[0] + 0.5), s.z - (it.at[1] + 0.5)) < 2.6) { const nm = it.name.replace(/^five\s+/, ''); out.take = { name: nm, fixture: nm }; break; }
  if (out.take) { const back = [...S.basket].reverse().find(b => b.fixture === out.take.fixture); if (back) out.back = back; }
  return out;
}
function clear(a, b) { const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(d / (0.35 * M)); for (let i = 1; i < n; i++) { const t = i / n; if (solid.blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false; } return true; }
const clock = () => { const t = Math.floor(S.t); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const wantsMore = it => it && it.have < (it.count || 1);

/* ── taking and putting back ── */
function act(what) {
  if (!S.on || S.done || !S.started) return false; const r = S.reach; if (!r) return false;
  if (what === 'belt' || (what === 'take' && r.belt && !r.take)) { if (r.belt) { finish(r.belt); return true; } return false; }
  if (what === 'back') { if (!r.back) return false; return putBack(r.back); }
  if (!r.take) return false;
  const t = r.take, listed = itemFor(t.name), where = r.zone.n ? 'Aisle ' + r.zone.n : r.zone.name;
  const b = { name: t.name, fixture: t.fixture, item: wantsMore(listed) ? listed : null, where, t: S.t, clock: clock(), seen: false };
  if (b.item) b.item.have++; S.basket.push(b);
  const ned = nedPos(); b.seen = !!ned && Math.hypot(ned.x - W.rig.pos.x, ned.z - W.rig.pos.z) < 16 * M && clear(ned, W.rig.pos);
  if (b.seen) { S.record.push({ text: t.name, sure: true, of: b }); if (!b.item) say(fill(pick(NED.offlist, S.basket.length), { x: t.name })); else if (!b.item.count || b.item.have >= b.item.count) say(fill(pick(NED.saw, S.basket.length), { x: b.item.name })); }
  else { S.unseen.push(b); say(pick(NED.missed, S.basket.length)); }
  // the list's own voice, Lisa's: a wrong colour, one too many, a thing not asked for
  if (!b.item) { const apples = S.items.find(it => /apples$/.test(it.name)); if (/apples$/.test(t.name) && apples && !listed) setTimeout(() => say(LISA.colour, 'Lisa'), 900); else if (listed) setTimeout(() => say(fill(LISA.count, { n: listed.have + S.basket.filter(x => x.fixture === t.fixture && !x.item).length }), 'Lisa'), 900); else if (S.basket.filter(x => !x.item).length === 1) setTimeout(() => say(fill(LISA.wrong, { x: t.name }), 'Lisa'), 900); }
  if (b.item && b.item.count) countUp(b.item);
  if (window.Fx && Fx.Sfx && Fx.Sfx.click) try { Fx.Sfx.click(); } catch (e) { }
  paint(); return true;
}
/** Wittgenstein's shopkeeper, for five red apples: the drawer, the sample, the count. */
function countUp(it) { const w = $('#shopWitt'); w.innerHTML = `<span>APPLES: the crate marked APPLES</span><span><i></i>RED: the sample beside the word</span><span>FIVE: ${['one', 'two', 'three', 'four', 'five'].slice(0, Math.min(5, it.have)).join(', ')}${it.have >= 5 ? '.' : '...'}</span>`; w.hidden = false; S.wittT = 4; }
function putBack(b) {
  const i = S.basket.lastIndexOf(b); if (i < 0) return false; S.basket.splice(i, 1); if (b.item) b.item.have--;
  S.backs.push({ name: b.name, clock: clock() });
  if (!b.item) fit('list', 'does not ask for ' + b.name, b.name + ' goes back');
  const ned = nedPos(); if (ned && Math.hypot(ned.x - W.rig.pos.x, ned.z - W.rig.pos.z) < 16 * M && clear(ned, W.rig.pos)) { const r = S.record.find(x => x.of === b && !x.struck); if (r) { r.struck = true; say(NED.back); } }
  S.unseen = S.unseen.filter(x => x !== b); paint(); return true;
}
/** Ned catches up with what he missed the moment he has you in sight again: a guess, with a query. */
function nedCatchUp() {
  if (!S.unseen.length) return; const ned = nedPos(); if (!ned || Math.hypot(ned.x - W.rig.pos.x, ned.z - W.rig.pos.z) > 10 * M || !clear(ned, W.rig.pos)) return;
  for (const b of S.unseen) { const g = GUESS[b.name] || b.name; S.record.push({ text: g, sure: g === b.name, of: b }); say(fill(NED.guess, { w: b.where, x: g })); }
  S.unseen = []; paint();
}
/** Ned looks into the cart when he is close to it: a guess that the cart does not bear out is corrected; a thing put back is struck. */
function nedInspect() {
  const ned = nedPos(), cart = cartPos(); if (!ned || !cart || Math.hypot(ned.x - cart.x, ned.z - cart.z) > 3.2 * M || !clear(ned, cart)) return;
  for (const r of S.record) {
    if (r.struck) continue; const inCart = S.basket.includes(r.of);
    if (!inCart) { r.struck = true; say(NED.back); paint(); return; }
    if (r.text !== r.of.name) { r.struck = true; S.record.splice(S.record.indexOf(r) + 1, 0, { text: r.of.name, sure: true, of: r.of, fixed: true }); say(fill(NED.fix, { x: r.of.name, y: r.text })); fit('record', r.of.name + ' in the cart', r.text + ' crossed out'); paint(); return; }
  }
}

/* ── the cast: a trail of the player's steps; Bart, Lisa and Ned walk it some way behind ── */
function nedPos() { const a = F.actors.get('flanders'); return a && a.rig ? a.rig.pos : null; }
function cartPos() { const a = F.actors.get('cart'); return a && a.V ? a.V.pos : null; }
function trail() { const p = W.rig.pos, last = S.crumbs[S.crumbs.length - 1]; if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 0.7 * M) { S.crumbs.push({ x: p.x, z: p.z }); if (S.crumbs.length > 600) { S.crumbs.shift(); for (const f of S.followers) f.i = Math.max(0, f.i - 1); } } }
function follower(name, lag, ned) {
  const a = F.actors.get(name); if (!a || !a.rig) return null; const f = { name, a, i: 0, lag };
  a.free = true; a.act = null; a.poseNow = 'stand'; a.drive = (ctl, rig) => {
    if (!S.on || !S.started) return; const p = W.rig.pos, dMe = Math.hypot(p.x - rig.pos.x, p.z - rig.pos.z);
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
  const put = (name, x, z, h) => { const a = F.actors.get(name); if (!a) return; const w = toW(x, z); if (a.rig) { a.rig.pos.set(w.x, a.rig.pos.y, w.z); a.rig.heading = h || 0; a.rig.figure.rotation.y = a.rig.heading; a.poseNow = 'stand'; } else if (a.V) { a.V.pos.x = w.x; a.V.pos.z = w.z; a.V.heading = h || 0; } };
  put('cart', plan.door[0] + 0.5, plan.door[1] + 7, 0); put('bart', plan.door[0] - 2, plan.door[1] + 1); put('lisa', plan.door[0] + 3, plan.door[1] + 1); put('flanders', 47, 20, -Math.PI / 2);
  const clerk = plan.lanes[0]; put('clerk', clerk.clerk[0], clerk.clerk[1], Math.PI / 2);
  const cart = F.actors.get('cart'); if (cart) { cart.free = true; cart.act = { lead: 'homer', ahead: 2.2 }; }
  S.items = plan.items.map(it => ({ ...it, have: 0 })); S.basket = []; S.record = []; S.unseen = []; S.backs = []; S.crumbs = []; S.t = 0; S.done = false; S.started = false;
  S.followers = [follower('bart', 2.4), follower('lisa', 3.2), follower('flanders', 6.5, true)].filter(Boolean);
  ui(); document.body.classList.add('shop-on'); paint(); S.on = true;
  const st = $('#shopStart'); st.innerHTML = `<div class="shopCard"><h3>The List</h3>
    <p>Marge wrote a list and gave it to Homer. It is an <b>order</b>: it says what the cart should become. If the cart and the list disagree, the cart is wrong: put the wrong thing back. You never rewrite the list.</p>
    <p>Ned Flanders is following you with a notebook. His record is a <b>description</b>: it says what went in the cart. If his record and the cart disagree, his record is wrong, and he has to fix it. When a shelf hides what you take, he guesses.</p>
    <p><i>Five red apples</i>: find the crate marked APPLES, check the colour against the sample, count them out one at a time.</p>
    <p class="keys"><kbd>WASD</kbd> or the stick: walk &nbsp; <kbd>E</kbd> take &nbsp; <kbd>R</kbd> put back &nbsp; <kbd>N</kbd> hide the notes &nbsp; at a checkout lane: <kbd>E</kbd> pay</p>
    <button id="shopGo">Start shopping</button></div>`;
  st.hidden = false; $('#shopGo').onclick = () => { st.hidden = true; S.started = true; say(NED.hello, 'Ned', 5); };
  if (Q.get('go') != null) $('#shopGo').click();
  return true;
}
S.step = dt => {
  if (!S.on || S.done || !S.started) return; S.t += dt; trail();
  S.reach = reach(); const r = S.reach, box = $('#shopActs'); let html = '';
  if (r.take) { const it = itemFor(r.take.name); html += `<button data-a="take"><kbd>E</kbd>take ${esc(r.take.name)}${it && it.count && it.have < it.count ? ` (${it.have + 1} of ${it.count})` : ''}</button>`; }
  if (r.back) html += `<button class="back" data-a="back"><kbd>R</kbd>put back ${esc(r.back.name)}</button>`;
  if (r.belt) html += `<button data-a="belt"><kbd>E</kbd>unload at lane ${r.belt.n} and pay</button>`;
  if (box.dataset.html !== html) { box.dataset.html = html; box.innerHTML = html; box.querySelectorAll('button').forEach(b => b.onclick = e => { e.stopPropagation(); act(b.dataset.a); }); }
  const z = r.zone, w = $('#shopWhere'); w.innerHTML = z.n ? `<b>${z.n}</b>${esc(z.name)}` : esc(z.name);
  $('#shopTime').textContent = clock();
  if ((S.lookT = (S.lookT || 0) + dt) > 0.4) { S.lookT = 0; nedCatchUp(); nedInspect(); }
  if (sayT > 0 && (sayT -= dt) <= 0) $('#shopSay').style.opacity = 0;
  if (fitT > 0 && (fitT -= dt) <= 0) { $('#shopFit').style.opacity = 0; setTimeout(() => { if (fitT <= 0) $('#shopFit').hidden = true; }, 400); }
  if (S.wittT > 0 && (S.wittT -= dt) <= 0) $('#shopWitt').hidden = true;
};
function finish(lane) {
  S.done = true; $('#shopActs').innerHTML = ''; $('#shopActs').dataset.html = ''; nedCatchUp();
  // at the belt Ned reads the receipt, and his record is put right to fit it
  const fixes = []; for (const r of [...S.record]) { if (r.struck) continue; if (!S.basket.includes(r.of)) { r.struck = true; fixes.push(`${r.text} (put back)`); } else if (r.text !== r.of.name) { r.struck = true; S.record.splice(S.record.indexOf(r) + 1, 0, { text: r.of.name, sure: true, of: r.of, fixed: true }); fixes.push(`${r.text} to ${r.of.name}`); } }
  const missed = S.basket.filter(b => !S.record.some(r => r.of === b && !r.struck)); for (const b of missed) { S.record.push({ text: b.name, sure: true, of: b, fixed: true }); fixes.push(`added ${b.name}`); }
  const short = S.items.filter(it => it.have < (it.count || 1)), extras = S.basket.filter(b => !b.item);
  const col = (title, sub, rows) => `<div class="col"><h4>${title}<small>${sub}</small></h4>${rows.join('') || '<div>(nothing)</div>'}</div>`;
  const v = [];
  if (short.length) v.push(`<b class="dir">The list and the cart disagree.</b> ${short.map(it => `<b>${esc(it.name)}</b>${it.count ? ` (${it.have} of ${it.count})` : ''}`).join(', ')} ${short.length > 1 ? 'were' : 'was'} ordered and not bought. The mistake is in the performance: the list stays as it is, the cart should have been changed to fit it.`);
  if (extras.length) v.push(`<b class="dir">The cart holds what the list never asked for:</b> <b>${extras.map(b => esc(b.name)).join(', ')}</b>. Again the cart is wrong, not the list: put ${extras.length > 1 ? 'them' : 'it'} back next time. ${S.backs.length ? `You did put back ${S.backs.map(b => esc(b.name)).join(', ')}: that is changing the world to fit the words.` : ''}`);
  else if (S.backs.length) v.push(`<b class="dir">You put back</b> ${S.backs.map(b => esc(b.name)).join(', ')}: the list stayed, the cart was changed to fit it.`);
  if (fixes.length) v.push(`<b class="dir">Ned's record and the cart disagreed</b> (${fixes.map(esc).join('; ')}). The mistake was in the record, so the record was changed: the words were made to fit the world.`);
  if (!short.length && !extras.length && !fixes.length) v.push('The list, the cart and the record agree: the shopping made the list true, and the record says truly what was done.');
  $('#shopEnd').innerHTML = `<div class="shopCard"><h3>Lane ${lane.n}: the receipt</h3><div>${clock()} in the store, ${S.basket.length} thing${S.basket.length === 1 ? '' : 's'} on the belt.</div>
    <div class="cols">${col("Marge's list", 'an order: the cart must fit it', S.items.map(it => `<div style="${it.have >= (it.count || 1) ? 'text-decoration:line-through' : 'color:#b0341e'}">${itemLine(it)}</div>`))}
    ${col('The receipt', 'what was bought', S.basket.map(b => `<div style="${b.item ? '' : 'color:#b0341e'}">${esc(b.name)} <span style="opacity:.6">(${esc(b.where)})</span></div>`))}
    ${col("Ned's record", 'a description: it must fit the cart', S.record.map(r => `<div style="${r.struck ? 'text-decoration:line-through;color:#b0341e;opacity:.7' : r.fixed ? 'color:#2a7a2a' : ''}">${esc(r.text)}${r.fixed ? ' (fixed)' : ''}</div>`))}</div>
    ${v.map(x => `<div class="verdict">${x}</div>`).join('')}<button id="shopAgain">Shop again</button></div>`;
  $('#shopEnd').hidden = false; $('#shopAgain').onclick = () => location.reload(); paint();
  say(short.length ? 'Well, that list isn\'t true yet, neighbor!' : fixes.length ? 'My record needed fixing, but it\'s right now-diddly-ow!' : 'Hi-diddly-done! And it\'s all in my book.', 'Ned', 6);
}
S.start = start; S.act = act; window.Shop = S;
/* ?shop: once the case's set is laid and solid, the game begins */
if (Q.get('shop') != null) { const t0 = performance.now(); const wait = () => { const w = window.__world, f = w && w.film; if (f && f.scene && f.scene.ready && [...f.donors.values()].some(d => d.plan)) { start().then(ok => { if (!ok) setTimeout(wait, 500); }); return; } if (performance.now() - t0 < 180000) setTimeout(wait, 400); }; setTimeout(wait, 600); }
})();
