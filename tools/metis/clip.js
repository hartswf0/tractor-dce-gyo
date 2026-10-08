#!/usr/bin/env node
/* tools/metis/clip.js — the interpenetration (clipping) checker: are characters running through things?

   For a scene, the take is prepared in the player exactly as tools/export-odyssey.js prepares it (the location, its keyframes, the
   compiled sheet odyssey/score/<id>.choreo.json, the creatures, the sea kit, the hall's light) and its clock is stepped every sixth
   of a second. At every drawing it measures (tools/metis/clip-page.js):
     (a) body against body   each figure's parts (head, torso, hips, arms, legs) as oriented boxes of their own meshes (held things,
                             capes and weapons left out); two figures' parts overlapping deeper than the tolerance below. Counted:
                             head-head, head or torso or hips against another's (core), an arm or a leg through another's core
                             (limb), legs through legs. A creature's nodes (body, head, legs) against a figure's core.
     (b) body in the set     the head, torso and hips centres and each leg's middle inside a solid set part, prop or hull (of six axis
                             rays from the point, at least five meet the set and two thirds of those meet a back face first; the depth
                             is the nearest way out); a sole below the surface under it (the first face down from the knee)
     (c) body in the water   (sea-kit scenes) the hips under the brick swell's surface (OdysseySea.surface) while the figure is not
                             swimming, drowning, riding timbers or climbing out (SWIM, DROWN, RIDE, CLIMB intents)
     (d) a walk through      a (b) fault while the figure's feet are moving faster than a quarter of its height a second
   and whether the offending point is VISIBLE at that drawing: inside the frame of the shot the film cuts to at t, and not behind a set
   part nearer the lens. Faults are merged into intervals (who, what, against what; gaps of one drawing bridged).

   Allowed, not faults:
     - the score's contacts while they last (+-0.5/0.75 s): GRIP, EMBRACE, HOLD_ON, SEIZE, TEND, CARRY, TAKE,
       OFFER, STAB, PUNCH, THRUST, SWING, STRUGGLE, CARESS, FAWN, CLING, WEEP, LEAD, FOLLOW, ROPE, BIND, SEAL, CHANGE, between the actor and its target or anyone its params name (CARRY's `with`, SEAL's `ears`): their limbs on the
       other's body are not counted, their cores may meet up to 0.12 H, heads up to 0.07 H (cheek to cheek, never head through head)
     - a rider and its carrier (OdysseyCreatures.sample riders: a man under a ram, in a giant's fist)
     - shades (keyframes `shades` or a blocking entry's `shade: true`): reported apart, as deliberate, never counted
     - a body under a prop the score's objects name as a hiding place (affords 'hide': the sealskins of OD-B04-S05), for a figure whose own intents say it is under or in it: deliberate
   Tolerances (fractions of the smaller figure's height H, a minifig about 100 world units): head-head 0.04, core 0.05, limb 0.12,
   legs 0.10, creature 0.08; set 0.06 (head, torso, hips), legs 0.09; a sole 0.10 below the surface under it (a seated figure's legs: 'seated into' the seat); the hips 0.10 under the
   water (a figure wholly under the swell is not seen, so not counted). A fault is VISIBLE UNINTENDED CLIPPING when it is not a shade's and is in frame and unhidden for 0.25 s or more.

   Usage (the repository served on :8899, as for tools/export-odyssey.js; one Chromium; about 1-3 minutes a scene):
     NODE_PATH=/opt/node22/lib/node_modules node tools/metis/clip.js OD-B12-S04 [OD-B10-S01 ...]
          [--take films/odyssey/OD-B12-S04-performed.json]   the take whose shots are checked (default: the published film's json;
                                                             for a take not yet rendered, pass the plan's report json or --solve)
          [--sheet odyssey/score/<id>.choreo.json]           the sheet the take plays (default; --sheet off: none)
          [--solve]                                          solve the shots afresh with tools/cinematographer/solve.js (exact, slow:
                                                             minutes) instead of replaying the take json's cameras
          [--at <git rev>]                                   serve the scene's keyframes, sheet and score as they were at that commit
                                                             (an old take; the location's set is the bundle's current one)
          [--step 0.1667] [--stills 3 | --no-stills] [--size 640x360] [--out odyssey/metis/clip] [--evidence odyssey/metis/evidence]
          [--name <id>]                                      the output's name (default the scene id; e.g. OD-B23-S04-take3)
     Writes <out>/<name>.json (the intervals, each with time range, who, what, against what, depth in H, visible seconds and the shots
     that show it) and, for the worst three visible faults, <evidence>/<scene>/clip-<n>.jpg (640x360, the offending parts outlined in
     magenta, the other party in yellow). Prints one summary line a scene:
        CLIP OD-B12-S04 visible 1.8 s in 3 intervals (worst: odysseus torso in the hull 0.21 H at 12.3-13.1 s); shades 0.0 s; offscreen, hidden or brief 4.2 s
     and exits 0. `--gate 0.25` exits 1 when any visible unintended interval lasts 0.25 s or more (the keep rule in
     odyssey/metis/README.md).

   The camera. Without --solve the take json's cinematographer report is replayed: each shot's lens where the solver put it (moved
   with the primary's feet for a travelling shot), aimed at the middle of its subjects' heads, at its fov; the sea kit's own camera
   paths and a take without a plan (the syncwatch grammar) are the take's own. The replayed aim is not the solver's thirds-line
   framing: a part on the very edge of the frame can be judged in or out wrongly. --solve makes it exact.

   Validation (8 October 2026):
     known bad   OD-B23-S04 take 3 (--at 5d3681a0~1 --take films/odyssey/takes/OD-B23-S04/take3.json --name OD-B23-S04-take3): the
                 record says "the embrace had them head through head, so no closer camera was legal". The checker finds penelope's and
                 odysseus's heads 0.18 H into each other through the whole seated embrace, 35.0-45.7 s (10.7 s seen), and 0.14 H in the
                 standing embrace, 26.0-29.5 s (3.5 s seen): 14.8 s visible, gate failed. Rendered from above and from the side at
                 26.2 and 35.5 s, the faces are inside each other (her bun through his hair).
     the fix     OD-B23-S04 take 4 (the published film, re-staged "a hand apart"): the seated ending 36.5-45.5 s is clean (cheek to cheek
                 within 0.07 H, his HOLD_ON hand on her shoulder and her arms round him not counted). The checker still finds the
                 standing embrace 26.0-29.5 s and the sit-down 35.0-36.5 s head through head: the re-staging fixed only the ending.
     known good  tight legal contacts that must not flag, and do not: Odysseus's hands on the bow and the suitors at their tables
                 (OD-B21-S07: 0.0 s visible); the rowers seated on their benches with their hands on the oars (OD-B12-S03: no bench,
                 oar or hull fault); Anticleia's three embraces through her son (OD-B11-S04: 7.0 s, all reported as shade); the men
                 under the rams, each on his own ram (OD-B09-S10: riders allowed); OD-B01-S01, OD-B01-S02, OD-B03-S05: 0.0 s.
                 Tuning: the limb tolerance went 0.08 -> 0.12 H (an arm's box is loose: a raised arm by a neighbour's face flagged in
                 OD-B06-S03 at 0.09 H), the sole 0.05 -> 0.10 H (a walking foot on a floor of tiles and plates flagged at one plate).
   Limits: boxes, not meshes (a hand on a hip is a box in a box, so limbs get the widest tolerance; a creature's node box is
   looser than its shape); hair and hats count as the head, while things held, capes, weapons and shields are not bodies;
   creature against creature and creature against the set are not checked; a set part that is not a closed solid (one sheet
   of ground) has no inside, so a body under it is found only by the sole test; the set is the current bundle's (an old take
   replayed with --at keeps today's set); the replayed camera ignores the direction's push/pull and the solver's thirds-line aim.

   For the sea re-shoots (OD-B09-S11, OD-B10-S01, OD-B10-S02, OD-B12-S04, OD-B12-S07, OD-B26-S04): after rendering a take with
   tools/export-odyssey.js --suffix performed-r2, run
     NODE_PATH=/opt/node22/lib/node_modules node tools/metis/clip.js OD-B12-S04 --take films/odyssey/OD-B12-S04-performed-r2.json --gate 0.25
   (no Chromium may be rendering at the same time if it can be helped: the checker opens its own). The sea kit is fetched from the
   working tree as the take fetches it. Water faults ('sunk into the sea') skip figures with SWIM, DROWN, RIDE or CLIMB intents
   at that time; a figure that is wholly under the swell is reported but not counted (it is not seen). Hull faults name the hull
   piece ('walks through black ship', 'feet below the surface black ship'). Keep the take only if the gate passes; else the
   JSON's intervals say who, when and against what. */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2), sids = args.filter(a => /^OD-B\d\d-S\d\d$/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; }, has = k => args.includes('--' + k);
const STEP = +opt('step', 1 / 6), [W, H] = opt('size', '640x360').split('x').map(Number), NST = has('no-stills') ? 0 : +opt('stills', 3);
const OUT = path.resolve(ROOT, opt('out', 'odyssey/metis/clip')), EVD = path.resolve(ROOT, opt('evidence', 'odyssey/metis/evidence')), AT = opt('at', null), GATE = opt('gate', null);
const TOL = { headHead: 0.04, core: 0.05, limb: 0.12, legs: 0.10, creature: 0.08, headHeadContact: 0.07, coreContact: 0.12, set: 0.06, legSet: 0.09, sink: 0.10, water: 0.10 };
const CONTACT = ['GRIP', 'EMBRACE', 'HOLD_ON', 'SEIZE', 'TEND', 'CARRY', 'TAKE', 'OFFER', 'STAB', 'PUNCH', 'THRUST', 'SWING', 'STRUGGLE', 'CARESS', 'FAWN', 'CLING', 'WEEP', 'LEAD', 'FOLLOW', 'ROPE', 'BIND', 'SEAL', 'CHANGE'];
const WET = ['SWIM', 'DROWN', 'RIDE', 'CLIMB'];
const MIN_VIS = 0.25;
let capture = false;
const t0w = Date.now(), say = (...a) => console.log(((Date.now() - t0w) / 1000).toFixed(0).padStart(5) + 's', ...a);
const readAt = rel => AT ? execFileSync('git', ['-C', ROOT, 'show', AT + ':' + rel], { maxBuffer: 1 << 28 }).toString() : fs.readFileSync(path.join(ROOT, rel), 'utf8');
/* every name an intent's params give (with, ears, targets, cupOf...): the others it touches */
const namesIn = p => { const out = []; for (const v of Object.values(p || {})) for (const x of [].concat(v)) { if (typeof x === 'string') out.push(x); else if (Array.isArray(x) && typeof x[0] === 'string') out.push(x[0]); } return out; };
const jsonAt = rel => { try { return JSON.parse(readAt(rel)); } catch (e) { return null; } };

/* the stand-in for tools/cinematographer/solve.js: hands the take's api to the checker and replays the take json's cameras */
function stub(shots) {
  const solved = shots.filter(s => s.camera).map(s => ({ ...s, id: 'c' + s.i + ':' + s.kind + ':' + s.size, cine: true, dur: s.t1 - s.t0 })).sort((a, b) => a.t0 - b.t0);
  window.OdysseyCine = { version: 'metis-clip', solve: async (plan, api) => {
    window.__clipApi = api; const { THREE } = api, V3 = THREE.Vector3;
    const at = id => { const a = api.kfActor(id); if (a && a.rig.figure.visible !== false && !a.rig.absent) return { head: api.kfHead(id), feet: a.rig.pos.clone() };
      const g = api.T.creatures && api.T.creatures.group.getObjectByName('creature:' + id); if (!g) return null; const b = new THREE.Box3().setFromObject(g); if (b.isEmpty()) return null; const c = b.getCenter(new V3()); return { head: c, feet: new V3(c.x, b.min.y, c.z) }; };
    const S = { report: () => ({ replay: true, shots: solved }), stats: () => ({ replay: solved.length }),
      shotAt(t) { let s = solved[0]; for (const x of solved) if (x.t0 <= t + 1e-6) s = x; return s || { id: 'none', kind: 'WIDE', t0: 0, dur: 1e9, cine: true, camera: { pos: [0, 200, 400], fov: 40 }, subjects: [] }; },
      shoot(sh, t) {
        const cam = sh.camera; let pos = new V3(...cam.pos);
        if (cam.travelling && sh.primary) { const mid = (sh.t0 + sh.t1) / 2, now = at(sh.primary); if (now) { const key = api.poseAt(mid), then = at(sh.primary); api.poseAt(t); if (then) pos.add(now.feet.clone().sub(then.feet)); } }
        let tg; if (cam.target) tg = cam.target;
        else { const P = (sh.subjects || [sh.primary]).map(at).filter(Boolean); if (!P.length) { tg = pos.clone().add(new V3(0, 0, -100)).toArray(); }
          else { const c = new V3(); for (const p of P) c.add(sh.size === 'WIDE' ? p.head.clone().lerp(p.feet, 0.4) : p.head); tg = c.multiplyScalar(1 / P.length).toArray(); } }
        api.shoot({ pos: pos.toArray(), target: tg, fov: cam.fov || 40 }); } };
    return S; } };
}

(async () => {
  if (!sids.length) { console.error('usage: node tools/metis/clip.js OD-Bxx-Syy [...] (see the header)'); process.exit(2); }
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } }); page.setDefaultTimeout(3600000);
  page.on('pageerror', e => say('page error', e.message.slice(0, 300))); page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/Failed to load/.test(t)) say('console', t.slice(0, 200)); });
  await page.route('**/tools/cinematographer/solve.js*', r => capture ? r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.OdysseyCine={version:"capture",solve:async(p,api)=>{window.__clipApi=api;return null;}};' }) : r.continue());
  if (AT) for (const sid of sids) for (const rel of [`odyssey/keyframes/${sid}.json`, `odyssey/choreo/${sid}.json`]) await page.route('**/' + rel + '*', r => { try { r.fulfill({ status: 200, contentType: 'application/json', body: readAt(rel) }); } catch (e) { r.fulfill({ status: 404, body: '' }); } });
  await page.goto('http://localhost:' + (process.env.PORT || 8899) + '/film-readymades/production/Film-Butter-Odyssey.html', { timeout: 1800000 });
  await page.waitForFunction(() => window.ButterLocation && window.ButterFilms?.current && !ButterFilms.busy && ButterCast.cast.length, null, { timeout: 1800000 });
  await page.evaluate(() => { document.body.classList.add('kf'); const st = document.createElement('style'); st.textContent = 'body.kf header,body.kf .topbar,body.kf footer,body.kf nav,body.kf #filmWorldTools{visibility:hidden!important}'; document.head.appendChild(st); });
  await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'clip-page.js'), 'utf8') });
  let worstExit = 0;
  for (const sid of sids) {
    try { worstExit = Math.max(worstExit, await one(page, sid)); } catch (e) { say(sid, 'error', e.stack || e.message); worstExit = Math.max(worstExit, 2); }
  }
  await browser.close(); process.exit(worstExit);
})();

async function one(page, sid) {
  const name = sids.length === 1 && opt('name', null) || sid, loc = 'odyssey-' + sid.toLowerCase();
  if ((await page.evaluate(() => ButterFilms.current.sourceId)) !== loc) {
    await page.evaluate(l => { const r = ButterFilms.records.find(r => r.id === l); if (!r) throw Error('no location ' + l); const o = [...document.querySelectorAll('#versionSelect option')].find(o => o.textContent.trim() === r.title); return ButterFilms.switchTo(o.value); }, loc);
    await page.waitForFunction(l => ButterFilms.current?.sourceId === l && !ButterFilms.busy && ButterCast.cast.length, loc, { timeout: 900000 }); }
  say(sid, 'location loaded');
  const takeF = path.resolve(ROOT, opt('take', `films/odyssey/${sid}-performed.json`)), take = fs.existsSync(takeF) ? JSON.parse(fs.readFileSync(takeF, 'utf8')) : null;
  const cine = take && take.take && take.take.cine, shots = cine && cine.shots ? cine.shots : (take && take.time && take.shots ? take.shots : null);
  const sheetRel = opt('sheet', `odyssey/score/${sid}.choreo.json`), sheet = sheetRel === 'off' ? false : jsonAt(sheetRel);
  const score = jsonAt(`odyssey/score/${sid}.json`), intents = ((score && score.authored && score.authored.intents) || []).map(i => ({ kind: i.kind, actor: i.actor, target: i.target, t0: i.t0, t1: i.t1, params: { with: namesIn(i.params) } }));
  const mode = (take && take.mode) || (sheet && sheet.clock) || 'cut';
  let solveMode = has('solve') ? 'solve' : shots ? 'replay' : 'grammar';
  await page.evaluate(() => { delete window.OdysseyCine; window.__clipApi = null; });
  if (solveMode === 'replay') await page.evaluate(stub, shots);
  if (solveMode === 'solve') { await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'tools/cinematographer/solve.js'), 'utf8') });
    await page.evaluate(() => { const s = OdysseyCine.solve; OdysseyCine.solve = async (p, api) => { window.__clipApi = api; return s(p, api); }; }); }
  const plan = solveMode === 'replay' ? { replay: true, shots: [] } : solveMode === 'solve' ? require(path.join(ROOT, 'tools/cinematographer/plan.js')).plan(sid, { sheet: sheetRel }) : false;
  const info = await page.evaluate(o => OdysseyTake.exportStart(o).then(i => ({ total: i.total, keys: i.keys, shots: i.shots })), { mode, w: W, h: H, choreo: sheet === false ? false : sheet || undefined, shots: plan });
  if (solveMode === 'grammar') {   /* no plan: the take's own cameras; the api is caught by a solver that solves nothing (served in place of solve.js once) */
    capture = true; await page.evaluate(() => OdysseyTake.cineReload({ capture: true }).catch(() => null)); capture = false; }
  say(sid, 'prepared', mode, info.total.toFixed(2), 's; camera', solveMode);
  const okApi = await page.evaluate(o => { if (!window.__clipApi) return false; window.__clip = MetisClip.make(window.__clipApi, o); return true; }, { tol: TOL, intents, contactKinds: CONTACT, wetKinds: WET });
  if (!okApi) throw Error('the take handed no api to the checker');
  const samples = [];
  for (let t = 0; t < info.total - 1e-6; t += STEP) { const s = await page.evaluate(t => window.__clip.sample(t), t); samples.push(s); }
  say(sid, samples.length, 'drawings measured');
  /* ── intervals ── */
  const open = new Map(), done = [], gap = 2.01 * STEP;
  const keyOf = r => r.kind + '|' + r.who.join('+') + '|' + (r.kind === 'set' ? r.against : r.cls === 'head-head' ? 'head' : '');
  for (const s of samples) { const seenNow = new Map();
    for (const r of s.out) { const k = keyOf(r); let I = open.get(k);
      if (I && s.t - I.last > gap) { done.push(I); I = null; }
      if (!I) { I = { key: k, kind: r.kind, who: r.who, against: r.against || null, t0: s.t, last: s.t, n: 0, vis: 0, off: 0, hid: 0, depth: 0, cls: {}, parts: {}, shots: {}, shade: false, contact: false, walking: false, worst: null }; open.set(k, I); }
      I.last = s.t; I.cls[r.cls] = (I.cls[r.cls] || 0) + 1; I.parts[r.parts.join(' / ')] = (I.parts[r.parts.join(' / ')] || 0) + 1; I.shade = I.shade || r.shade; I.contact = I.contact || !!r.contact; I.walking = I.walking || !!r.walking;
      const seen = r.v.inFrame && !r.v.hidden, st = seen ? 2 : r.v.inFrame ? 1 : 0; seenNow.set(I, Math.max(seenNow.get(I) ?? -1, st));
      const score = r.depth + (seen ? 1 : 0); if (!I.worst || score > I.worst.score) I.worst = { score, t: s.t, box: r.box, depth: r.depth, seen, uv: r.v.uv, shot: s.shot };
      I.depth = Math.max(I.depth, r.depth); }
    /* one drawing counts once for an interval, seen if any of its part pairs is seen */
    for (const [I, st] of seenNow) { I.n++; if (st === 2) { I.vis++; I.shots[s.shot] = (I.shots[s.shot] || 0) + 1; } else if (st === 1) I.hid++; else I.off++; } }
  done.push(...open.values());
  /* the score's hiding places (an object that affords 'hide': the sealskins over Menelaus's men): a body under one is meant */
  const hideStems = Object.entries((score && score.objects) || {}).filter(([k, o]) => (o.affords || []).includes('hide')).map(([k]) => k.toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, ''));
  /* ...for those whose own intents say they are under or in it ("springs out from under the skin"), not for one who walks round it */
  const hiders = new Map(); for (const i of ((score && score.authored && score.authored.intents) || [])) for (const st of hideStems) if (new RegExp('\\b(under|in|inside|beneath|into)\\b[^,;:]{0,12}' + st).test(i.label || '')) { if (!hiders.has(i.actor)) hiders.set(i.actor, new Set()); hiders.get(i.actor).add(st); }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(x => x[0]);
  const ivs = done.map(I => { const cls = top(I.cls)[0]; const what = I.kind === 'body' ? ({ 'head-head': 'head through head', core: 'body through body', limb: 'limb through body', legs: 'legs through legs', creature: 'body through a creature' }[cls] || cls)
      : I.kind === 'water' ? 'sunk into the sea' : ({ sink: 'feet below the surface', seat: 'seated into', walk: 'walks through', leg: 'leg through', body: 'body inside' }[cls] || cls) + ' ' + I.against;
    const hid = I.kind === 'set' && /^prop:/.test(I.against || '') && [...(hiders.get(I.who[0]) || [])].some(st => I.against.slice(5).toLowerCase().replace(/[^a-z]/g, '').startsWith(st));
    const vsec = +(I.vis * STEP).toFixed(2), deliberate = I.shade ? 'shade' : hid ? 'hidden under ' + I.against.slice(5) : null;
    return { key: I.key, t0: +I.t0.toFixed(2), t1: +(I.last + STEP).toFixed(2), dur: +((I.last - I.t0) + STEP).toFixed(2), who: I.who, kind: I.kind, what, cls, parts: top(I.parts).slice(0, 3), against: I.against,
      depthH: +I.depth.toFixed(3), visibleSec: vsec, hiddenSec: +(I.hid * STEP).toFixed(2), offscreenSec: +(I.off * STEP).toFixed(2), shots: top(I.shots), walking: I.walking, inContact: I.contact, deliberate,
      fault: !deliberate && vsec >= MIN_VIS, worst: { t: +I.worst.t.toFixed(2), depthH: +I.worst.depth.toFixed(3), seen: I.worst.seen, at: I.worst.uv, shot: I.worst.shot, box: I.worst.box } }; });
  const rank = (a, b) => (b.fault - a.fault) || (b.visibleSec * (0.5 + b.depthH) - a.visibleSec * (0.5 + a.depthH)) || (b.depthH - a.depthH);
  ivs.sort(rank);
  /* the visible seconds: the union over the clock of the drawings in which some unintended fault is seen */
  const visT = new Set(), offT = new Set(), shT = new Set();
  const faultKeys = new Set(ivs.filter(i => i.fault).map(i => i.key));
  for (const s of samples) for (const r of s.out) { const k = keyOf(r); if (r.shade) { shT.add(s.t); continue; } if (r.v.inFrame && !r.v.hidden && faultKeys.has(k)) visT.add(s.t); else offT.add(s.t); }
  const sum = { scene: sid, name, measured: new Date().toISOString().slice(0, 10), take: path.relative(ROOT, takeF), at: AT, camera: solveMode, step: +STEP.toFixed(4), total: +info.total.toFixed(2),
    visibleSec: +(visT.size * STEP).toFixed(2), faults: ivs.filter(i => i.fault).length, offscreenSec: +(offT.size * STEP).toFixed(2), shadeSec: +(shT.size * STEP).toFixed(2),
    longestVisible: Math.max(0, ...ivs.filter(i => i.fault).map(i => i.visibleSec)), tolerances: TOL, minVisible: MIN_VIS };
  const w = ivs.find(i => i.fault);
  const line = `CLIP ${name} visible ${sum.visibleSec.toFixed(1)} s in ${sum.faults} intervals` + (w ? ` (worst: ${w.who.join(' + ')} ${w.what}${w.parts[0] ? ' [' + w.parts[0] + ']' : ''} ${w.depthH.toFixed(2)} H at ${w.t0.toFixed(1)}-${w.t1.toFixed(1)} s)` : '') + `; shades ${sum.shadeSec.toFixed(1)} s; offscreen, hidden or brief ${sum.offscreenSec.toFixed(1)} s`;
  sum.line = line;
  /* ── stills: the worst three visible faults, the offending parts outlined ── */
  const stills = [];
  if (NST) { const D = path.join(EVD, sid); fs.mkdirSync(D, { recursive: true });
    for (const [n, I] of ivs.filter(i => i.fault).slice(0, NST).entries()) {
      const t = I.worst.t, f = path.join(D, `clip-${name === sid ? '' : name.replace(sid + '-', '') + '-'}${n + 1}.jpg`);
      const r = await page.evaluate(({ t, who, part, kind }) => { const fr = OdysseyTake.frame(t, { quality: 0.8, captions: false }); const P = ['headP', 'torsoP', 'hipsP', 'armRP', 'armLP', 'legRP', 'legLP'];
        const boxes = []; boxes.push({ c: 'm', p: window.__clip.outline(who[0], part) });
        if (kind === 'body' && who[1]) { for (const k of P) { const o = window.__clip.outline(who[1], k); if (o) boxes.push({ c: 'y', p: o }); } }
        return { jpeg: fr.jpeg, shot: fr.shot, boxes }; }, { t, who: I.worst.box[0] === I.who[0] ? I.who : [I.worst.box[0], I.who[0]], part: I.worst.box[1], kind: I.kind });
      fs.writeFileSync(f, Buffer.from(r.jpeg, 'base64'));
      const label = `${t.toFixed(2)} s  ${I.who.join(' + ')}: ${I.what} (${I.depthH.toFixed(2)} H, ${I.visibleSec.toFixed(2)} s seen)`;
      execFileSync('python3', ['-c', `
import json,sys
from PIL import Image,ImageDraw
f=sys.argv[1];B=json.loads(sys.argv[2]);lab=sys.argv[3];im=Image.open(f).convert('RGB');g=ImageDraw.Draw(im);w,h=im.size
for b in B:
  P=[q for q in (b['p'] or []) if q[2]<1]
  if not P: continue
  xs=[q[0]*w for q in P];ys=[q[1]*h for q in P];c=(255,0,255) if b['c']=='m' else (255,220,0)
  g.rectangle([min(xs),min(ys),max(xs),max(ys)],outline=c,width=3 if b['c']=='m' else 1)
g.rectangle([0,h-20,w,h],fill=(0,0,0));g.text((6,h-16),lab[:110],fill=(255,255,255))
im.save(f,quality=72)`, f, JSON.stringify(r.boxes), label]);
      I.still = path.relative(ROOT, f); stills.push(I.still); } }
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify({ ...sum, stills, intervals: ivs }, null, 1));
  console.log(line); say(sid, 'written', path.relative(ROOT, path.join(OUT, name + '.json')));
  await page.evaluate(() => OdysseyTake.end());
  return GATE != null && ivs.some(i => i.fault && i.visibleSec >= +GATE) ? 1 : 0;
}
