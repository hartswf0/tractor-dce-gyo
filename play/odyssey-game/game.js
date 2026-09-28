/* play/odyssey-game/game.js — the runner: boot, the chart, the whole poem (story.js), a level's life (stage → title card →
   play → won or lost → continue / replay / watch the scene instead), kleos, and the test hooks.

   A level registers itself with OG.level({ id, icon, setup(ctx), update(dt, ctx), teardown(ctx), debug(ctx) }); its data
   is levels/<id>.json (with `scenes`: the scenes of the cut it plays). ctx gives the level: data, the phase clock, win(stats)
   / lose(reason), cue(key), say(key, actor), and the engine (OG.E), input (OG.In), audio (OG.A), HUD (OG.H).
   KLEOS (glory): 600 × accuracy + 400 × time (1 at or under par, falling to 0 at the time limit). Three stars from 850, two from 600.
   URL: ?level=<id> plays one trial; ?book=<n> plays the poem from that book; ?speed=<k> runs the game clock k times faster;
   ?nostage draws no scene cards (tests); ?lite turns shadows off; ?mute. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const G = OG.G = { levels: {}, order: [], data: {}, best: {}, active: false, phase: 'boot', cur: null, ctx: null, results: [], log: [], onEnd: null };
OG.level = def => { G.levels[def.id] = def; };
const Q = new URLSearchParams(location.search);

G.boot = async function () {
  const H = OG.H, In = OG.In, E = OG.E, A = OG.A;
  H.build(); In.attach(H.$('#og-input')); OG.M.build();
  H.loading(true, 'Hand Butter is building the workshop');
  G.active = true;
  H.$('#og-chart').onclick = () => G.chart(); H.$('#og-replay').onclick = () => G.cur && G.phase !== 'story' && G.start(G.cur.id, { onEnd: G.onEnd });
  H.$('#og-skip').onclick = () => G.skip();
  H.$('#og-sound').onclick = () => { A.unlock(); A.setMuted(!A.muted); H.$('#og-sound').classList.toggle('on', !A.muted); H.$('#og-sound').textContent = A.muted ? 'Muted' : 'Sound'; };
  H.$('#og-hands').onclick = async () => { A.unlock(); try { if (G.handsOn()) stopHands(); else await startHands(); } catch (e) { H.flash('Camera: ' + e.message, 'bad'); } setTimeout(() => H.$('#og-hands').classList.toggle('on', G.handsOn()), 400); };
  document.addEventListener('pointerdown', () => A.unlock(), { capture: true, once: true });
  In.on((type, arg) => {
    if (type === 'key') {
      if (arg === 'KeyM') G.chart();
      if (arg === 'KeyS' && (G.phase === 'story' || G.phase === 'intro')) G.skip();
      if (G.phase === 'story' && (arg === 'Space' || arg === 'Enter') && OG.ST.cardSkip) OG.ST.cardSkip();
      if (G.phase !== 'play') { if (arg === 'KeyR' && G.cur && G.phase !== 'story') G.start(G.cur.id, { onEnd: G.onEnd }); if ((arg === 'KeyN' || arg === 'Enter') && G.phase === 'end') G.next(); if ((arg === 'Enter' || arg === 'Space') && G.phase === 'intro') G.play(); if (arg === 'KeyW' && G.phase === 'end' && G.onEnd) G.finish('watch'); }
    }
    if (type === 'press' && G.phase === 'intro' && G.introReady) G.play();
    if (G.phase === 'play' && G.cur && G.ctx) { const c = G.cur; if (type === 'key' && c.onKey) c.onKey(G.ctx, arg); if (type === 'press' && c.onPress) c.onPress(G.ctx, arg); if (type === 'release' && c.onRelease) c.onRelease(G.ctx, arg); }
  });
  await A.load(); await OG.ST.load();
  await Promise.all(Object.keys(G.levels).sort().map(async id => { const r = await fetch('odyssey-game/levels/' + id + '.json'); G.data[id] = await r.json(); }));
  G.order = Object.keys(G.levels).sort();
  if (Q.get('speed')) E.timeScale = Math.max(0.25, Math.min(12, +Q.get('speed')));
  if (Q.has('mute')) A.setMuted(true);
  OG.ST.noStage = Q.has('nostage');
  if (Q.get('render')) { const every = +Q.get('render'); let last = 0; window.OdysseyRenderGate = now => { if (window.OdysseyRenderNow) { window.OdysseyRenderNow--; last = now; return true; } if (now - last < every) return false; last = now; return true; }; }   // tests only: ?render=ms renders at most that often (OdysseyRenderNow = n forces the next n frames, for a screenshot)
  await E.ready(); E.setup(); H.loading(false); H.total(OG.ST.kleos());
  G.phase = 'chart';
  const want = Q.get('level'), book = +Q.get('book');
  if (want && G.levels[want]) await G.start(want); else if (book >= 1 && book <= 24) OG.ST.play(book, +(Q.get('item') || 0)); else G.chart();
  G.ready = true;
};
G.handsOn = () => { try { return !!window.eval('H').active; } catch (e) { return false; } };   // Hand Butter's hand state (const H in the workspace)
G.chart = function () { OG.ST.stop(); G.teardown(); OG.E.clearParts(); G.phase = 'chart'; G.onEnd = null; OG.A.stopAll(); OG.M.show(); OG.E.setView({ bg: 0x0c1116, floor: null }); G.cur = null; };
G.skip = function () { if (G.phase === 'story') OG.ST.skip(); else if ((G.phase === 'intro' || G.phase === 'play' || G.phase === 'end') && G.onEnd) G.finish('watch'); };
G.teardown = function () {
  const c = G.cur, ctx = G.ctx; if (c && c.teardown && ctx) try { c.teardown(ctx); } catch (e) { console.error(e); }
  if (window.S && S.tx) try { finish(false); } catch (e) { }
  OG.E.clearProps(); OG.E.removeActors(); OG.In.reset(); OG.A.hush(); OG.A.stopLoops(); OG.A.stopDrone(); OG.H.banner(null); OG.H.cue(null); OG.H.meters([]); OG.H.caption(null);
  G.ctx = null;
};
/** a trial inside the poem: resolves {result, action: 'continue' | 'watch'} when the player moves on */
G.runLevel = id => new Promise(resolve => G.start(id, { onEnd: (action, result) => resolve({ action, result }) }));
G.finish = function (action) { const f = G.onEnd; G.onEnd = null; const r = G.result; G.teardown(); G.cur = null; if (f) { G.phase = 'story'; f(action, r); } else G.chart(); };
G.start = async function (id, { onEnd } = {}) {
  const def = G.levels[id], data = G.data[id]; if (!def || G.starting) return; G.starting = true;
  try {
    OG.M.hide(); if (!onEnd) OG.ST.stop(); G.teardown(); G.onEnd = onEnd || null; G.cur = def; G.phase = 'loading'; G.result = null; OG.H.loading(true, data.title); OG.H.level(data); OG.H.scene(null);
    const E = OG.E; E.setView({ bg: 0x9fc6e0, floor: null, fog: null }); const cam = data.camera; E.setCamera(cam.pos, cam.look, { fov: cam.fov });
    const ctx = G.ctx = makeCtx(def, data);
    await def.setup(ctx);
    OG.A.bed(data.bed); OG.H.loading(false);
    G.phase = 'intro'; G.introReady = false; setTimeout(() => G.introReady = true, 600);
    const cueTxt = def.cueKey ? OG.H.cueText(data.cue[def.cueKey]) : OG.H.cueText(data.cue);
    OG.H.banner(`<h2>BOOK ${OG.H.roman(data.book)} · A TRIAL OF THE HAND</h2><h1>${data.title}</h1><p>${data.sub}</p><div class="verb">${OG.H.icon(def.icon || 'point')}<div style="text-align:left"><b style="letter-spacing:.24em">${data.verbName}</b><p style="margin:4px 0 0;max-width:340px">${cueTxt}</p></div></div><div class="row"><button class="primary" id="og-go">Begin</button>${G.onEnd ? '<button id="og-watch">Watch the scene instead (S)</button>' : ''}</div><small>pinch · click · Space to begin</small>`);
    OG.H.$('#og-go').onclick = () => G.play(); const w = OG.H.$('#og-watch'); if (w) w.onclick = () => G.finish('watch');
    if (def.intro) def.intro(ctx);
    G.log.push(['start', id]);
  } finally { G.starting = false; }
};
G.play = function () { if (G.phase !== 'intro') return; OG.H.banner(null); G.phase = 'play'; G.ctx.t = 0; G.ctx.phaseT = 0; const def = G.cur; if (def.begin) def.begin(G.ctx); };
G.next = function () { if (G.onEnd) return G.finish('continue'); const i = G.order.indexOf(G.cur && G.cur.id); if (i >= 0 && i < G.order.length - 1) G.start(G.order[i + 1]); else G.chart(); };
function makeCtx(def, data) {
  const ctx = { def, data, t: 0, phaseT: 0, stage: null, E: OG.E, In: OG.In, A: OG.A, H: OG.H, stats: { hits: 0, tries: 0 }, s: {} };
  ctx.say = (key, actor) => { const id = Array.isArray(data.lines[key]) ? data.lines[key] : [data.lines[key]]; let p = Promise.resolve(); for (const x of id) p = p.then(() => G.ctx === ctx ? OG.A.say(x, { actor }) : false); return p; };
  ctx.cue = (key, icon, verb) => { ctx.cueKey = key; const c = key ? data.cue[key] : data.cue; OG.H.cue(icon || def.icon, verb || data.verbName, OG.H.cueText(c)); ctx._cue = [key, icon, verb, OG.In.source]; };
  ctx.setStage = name => { ctx.stage = name; ctx.phaseT = 0; G.log.push(['stage', def.id, name]); };
  ctx.win = stats => end(ctx, true, stats || {});
  ctx.lose = (reason, stats) => end(ctx, false, { ...(stats || {}), reason });
  return ctx;
}
function kleos(data, t, acc) { const timeScore = t <= data.par ? 1 : Math.max(0, (data.timeLimit - t) / Math.max(1, data.timeLimit - data.par)); return Math.round(600 * Math.max(0, Math.min(1, acc)) + 400 * timeScore); }
function end(ctx, won, stats) {
  if (G.phase !== 'play' || G.ctx !== ctx) return; G.phase = 'end'; const data = ctx.data, t = ctx.t;
  const acc = stats.accuracy ?? 1, k = won ? kleos(data, t, acc) : 0, stars = won ? (k >= 850 ? 3 : k >= 600 ? 2 : 1) : 0;
  const result = { level: data.id, won, time: Math.round(t * 10) / 10, accuracy: Math.round(acc * 100) / 100, kleos: k, stars, reason: stats.reason || null, detail: stats.detail || null };
  G.result = result; G.results.push(result); G.log.push(['end', data.id, won]); OG.ST.levelDone(result);
  OG.H.cue(null); OG.H.kleos(k, t);
  const story = !!G.onEnd;
  const show = () => { if (G.ctx !== ctx) return;
    OG.H.banner(`<h2>${won ? 'KLEOS WON' : 'THE SEA KEEPS ITS OWN'}</h2><h1>${won ? (stats.title || 'Well sung') : (stats.title || 'Not this time')}</h1><p>${won ? (stats.text || '') : (stats.reason || '')}</p>
      ${won ? `<div class="stats"><div><b>${k}</b>κλέος</div><div><b>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</b>stars</div><div><b>${fmt(t)}</b>time (par ${fmt(data.par)})</div><div><b>${Math.round(acc * 100)}%</b>${stats.accLabel || 'accuracy'}</div></div>` : ''}
      <div class="row"><button id="og-again">Replay (R)</button>${won ? `<button class="primary" id="og-next">${story ? 'Continue the poem' : 'Next trial'} (N)</button>` : story ? '<button class="primary" id="og-watch2">Watch the scene instead (W)</button>' : ''}<button id="og-tochart">Chart (M)</button></div>`, won ? 'win' : 'lose');
    OG.H.$('#og-again').onclick = () => G.start(data.id, { onEnd: G.onEnd }); OG.H.$('#og-tochart').onclick = () => G.chart(); const n = OG.H.$('#og-next'); if (n) n.onclick = () => G.next(); const w = OG.H.$('#og-watch2'); if (w) w.onclick = () => G.finish('watch'); };
  setTimeout(show, won ? 1600 : 1200);
  if (won && data.lines.win) ctx.say('win', ctx.winSpeaker);
}
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
G.frame = function (dt, dtReal, now) {
  OG.In.frame(dtReal); OG.H.begin();
  if (G.phase === 'chart') OG.M.frame(dtReal, now / 1000);
  if (G.phase === 'story') OG.C.frame(dt);
  const ctx = G.ctx, def = G.cur;
  if (ctx && def && (G.phase === 'play' || G.phase === 'intro' || G.phase === 'end')) {
    if (G.phase === 'play') { ctx.t += dt; ctx.phaseT += dt; OG.H.kleos(null, ctx.t); if (ctx.t > ctx.data.timeLimit && def.timeout !== false) ctx.lose(def.timeoutText || 'Time ran out.', { title: 'The day is spent' }); }
    try { def.update(dt, ctx, G.phase); } catch (e) { console.error('[level ' + def.id + ']', e); G.log.push(['error', String(e && e.message)]); }
    if (G.phase === 'play' && ctx._cue && ctx._cue[3] !== OG.In.source) ctx.cue(...ctx._cue.slice(0, 3));   // the sentence follows the input in use
  }
  OG.H.hands(OG.In.cursors());
};
/** the tests' window: phase, level, result, the level's own debug (targets as stage fractions), the story position */
G.debug = () => ({ phase: G.phase, level: G.cur && G.cur.id, stage: G.ctx && G.ctx.stage, t: G.ctx && G.ctx.t, result: G.result || null, info: (() => { try { return G.cur && G.cur.debug && G.ctx && ['intro', 'play', 'end'].includes(G.phase) ? G.cur.debug(G.ctx) : null; } catch (e) { return { error: e.message }; } })(), source: OG.In.source,
  hands: OG.In.hands.map(h => [h.pose, +h.x.toFixed(3), +h.y.toFixed(3)]), audio: OG.A.log.slice(-6),
  story: { playing: OG.ST.playing, book: OG.ST.book && OG.ST.book.n, item: OG.ST.item, scene: OG.C.playing ? OG.C.item.id : null, t: OG.C.t, touch: OG.C.touch ? OG.C.touch.state : null, card: !!OG.ST.cardSkip, done: Object.keys(OG.ST.save.done).map(Number), kleos: OG.ST.kleos() } });
window.OdysseyGame = { boot: G.boot, start: id => G.start(id), chart: () => G.chart(), play: () => G.play(), book: (n, i) => { OG.ST.play(n, i || 0); }, skip: () => G.skip(), debug: G.debug, G, OG };
})();
