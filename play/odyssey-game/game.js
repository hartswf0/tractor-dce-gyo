/* play/odyssey-game/game.js — the runner: boot, the chart, a level's life (stage → title card → play → won or lost → replay),
   kleos, and the test hooks.

   A level registers itself with OG.level({ id, icon, setup(ctx), update(dt, ctx), teardown(ctx), debug(ctx) }); its data
   is levels/<id>.json. ctx gives the level: data, the phase clock, win(stats)/lose(reason), cue(key), say(key, actor), and the
   engine (OG.E), input (OG.In), audio (OG.A), HUD (OG.H).
   KLEOS (glory): 600 × accuracy + 400 × time (1 at or under par, falling to 0 at the time limit). Three stars from 850, two from 600.
   URL: ?level=<id> sails straight there; ?speed=<k> runs the game clock k times faster (the tests); ?mute. */
(function () {
'use strict';
const OG = window.OG = window.OG || {};
const G = OG.G = { levels: {}, order: [], data: {}, best: {}, active: false, phase: 'boot', cur: null, ctx: null, results: [], log: [] };
OG.level = def => { G.levels[def.id] = def; };
const Q = new URLSearchParams(location.search);
try { G.best = JSON.parse(localStorage.getItem('odyssey-game-best') || '{}'); } catch (e) { G.best = {}; }

G.boot = async function () {
  const H = OG.H, In = OG.In, E = OG.E, A = OG.A;
  H.build(); In.attach(H.$('#og-input')); OG.M.build();
  H.loading(true, 'Hand Butter is building the workshop');
  G.active = true;
  H.$('#og-chart').onclick = () => G.chart(); H.$('#og-replay').onclick = () => G.cur && G.start(G.cur.id);
  H.$('#og-sound').onclick = () => { A.unlock(); A.setMuted(!A.muted); H.$('#og-sound').classList.toggle('on', !A.muted); H.$('#og-sound').textContent = A.muted ? 'Muted' : 'Sound'; };
  H.$('#og-hands').onclick = async () => { A.unlock(); try { if (H$active()) { stopHands(); } else { await startHands(); } } catch (e) { H.flash('Camera: ' + e.message, 'bad'); } setTimeout(() => H.$('#og-hands').classList.toggle('on', H$active()), 400); };
  const H$active = () => { try { return !!(H_ && H_.active); } catch (e) { return false; } };
  const H_ = (() => { try { return window.eval('H'); } catch (e) { return null; } })();   // Hand Butter's hand state (const H in the workspace script)
  document.addEventListener('pointerdown', () => A.unlock(), { capture: true, once: true });
  In.on((type, arg) => { if (type === 'key' && G.phase !== 'play') { if (arg === 'KeyM') G.chart(); if (arg === 'KeyR' && G.cur) G.start(G.cur.id); if (arg === 'KeyN' && G.phase === 'end') G.next(); if ((arg === 'Enter' || arg === 'Space') && G.phase === 'intro') G.play(); if (arg === 'Enter' && G.phase === 'end') G.next(); }
    if (type === 'press' && G.phase === 'intro' && G.introReady) G.play();
    if (G.phase === 'play' && G.cur && G.ctx) { const c = G.cur; if (type === 'key' && c.onKey) c.onKey(G.ctx, arg); if (type === 'press' && c.onPress) c.onPress(G.ctx, arg); if (type === 'release' && c.onRelease) c.onRelease(G.ctx, arg); } });
  await A.load();
  await Promise.all(Object.keys(G.levels).sort().map(async id => { const r = await fetch('odyssey-game/levels/' + id + '.json'); G.data[id] = await r.json(); }));
  G.order = Object.keys(G.levels).sort();
  if (Q.get('speed')) E.timeScale = Math.max(0.25, Math.min(8, +Q.get('speed')));
  if (Q.has('mute')) A.setMuted(true);
  await E.ready(); E.setup(); H.loading(false);
  G.phase = 'chart';
  const want = Q.get('level'); if (want && G.levels[want]) await G.start(want); else G.chart();
  G.ready = true;
};
G.chart = function () { G.teardown(); G.phase = 'chart'; OG.A.stopAll(); OG.M.show(); OG.E.setView({ bg: 0x0c1116, floor: null }); G.cur = null; };
G.teardown = function () {
  const c = G.cur, ctx = G.ctx; if (c && c.teardown) try { c.teardown(ctx); } catch (e) { console.error(e); }
  if (window.S && S.tx) try { finish(false); } catch (e) { }
  OG.E.clearProps(); OG.E.removeActors(); OG.In.reset(); OG.A.hush(); OG.A.stopLoops(); OG.H.banner(null); OG.H.cue(null); OG.H.meters([]); OG.H.caption(null);
  G.ctx = null;
};
G.start = async function (id) {
  const def = G.levels[id], data = G.data[id]; if (!def || G.starting) return; G.starting = true;
  try {
    OG.M.hide(); G.teardown(); G.cur = def; G.phase = 'loading'; OG.H.loading(true, data.title); OG.H.level(data);
    const E = OG.E; E.setView({ bg: 0x9fc6e0, floor: null, fog: null }); const cam = data.camera; E.setCamera(cam.pos, cam.look, { fov: cam.fov });
    const ctx = G.ctx = makeCtx(def, data);
    await def.setup(ctx);
    OG.A.bed(data.bed); OG.H.loading(false);
    G.phase = 'intro'; G.introReady = false; setTimeout(() => G.introReady = true, 600);
    const cueTxt = def.cueKey ? OG.H.cueText(data.cue[def.cueKey]) : OG.H.cueText(data.cue);
    OG.H.banner(`<h2>BOOK ${OG.H.roman(data.book)} · ${data.bookTitle.toUpperCase()}</h2><h1>${data.title}</h1><p>${data.sub}</p><div class="verb">${OG.H.icon(def.icon || 'point')}<div style="text-align:left"><b style="letter-spacing:.24em">${data.verbName}</b><p style="margin:4px 0 0;max-width:340px">${cueTxt}</p></div></div><div class="row"><button class="primary" id="og-go">Begin</button></div><small>pinch · click · Space to begin</small>`);
    OG.H.$('#og-go').onclick = () => G.play();
    if (def.intro) def.intro(ctx);
    G.log.push(['start', id]);
  } finally { G.starting = false; }
};
G.play = function () { if (G.phase !== 'intro') return; OG.H.banner(null); G.phase = 'play'; G.ctx.t = 0; G.ctx.phaseT = 0; const def = G.cur; if (def.begin) def.begin(G.ctx); };
G.next = function () { const i = G.order.indexOf(G.cur && G.cur.id); if (i >= 0 && i < G.order.length - 1) G.start(G.order[i + 1]); else G.chart(); };
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
  G.result = result; G.results.push(result); G.log.push(['end', data.id, won]);
  if (won) { const b = G.best[data.id]; if (!b || b.kleos < k) { G.best[data.id] = { kleos: k, stars }; try { localStorage.setItem('odyssey-game-best', JSON.stringify(G.best)); } catch (e) { } } }
  OG.H.cue(null); OG.H.kleos(k, t);
  const show = () => { if (G.ctx !== ctx) return; const last = G.order.indexOf(data.id) === G.order.length - 1;
    OG.H.banner(`<h2>${won ? 'KLEOS WON' : 'THE SEA KEEPS ITS OWN'}</h2><h1>${won ? (stats.title || 'Well sung') : (stats.title || 'Not this time')}</h1><p>${won ? (stats.text || '') : (stats.reason || '')}</p>
      ${won ? `<div class="stats"><div><b>${k}</b>κλέος</div><div><b>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</b>stars</div><div><b>${fmt(t)}</b>time (par ${fmt(data.par)})</div><div><b>${Math.round(acc * 100)}%</b>${stats.accLabel || 'accuracy'}</div></div>` : ''}
      <div class="row"><button id="og-again">Replay (R)</button>${won ? `<button class="primary" id="og-next">${last ? 'The chart' : 'Next island'} (N)</button>` : ''}<button id="og-tochart">Chart (M)</button></div>`, won ? 'win' : 'lose');
    OG.H.$('#og-again').onclick = () => G.start(data.id); OG.H.$('#og-tochart').onclick = () => G.chart(); const n = OG.H.$('#og-next'); if (n) n.onclick = () => G.next(); };
  setTimeout(show, won ? 1600 : 1200);
  if (won && data.lines.win) ctx.say('win', ctx.winSpeaker);
}
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
G.frame = function (dt, dtReal, now) {
  OG.In.frame(dtReal); OG.H.begin();
  if (G.phase === 'chart') OG.M.frame(dtReal, now / 1000);
  const ctx = G.ctx, def = G.cur;
  if (ctx && (G.phase === 'play' || G.phase === 'intro' || G.phase === 'end')) {
    if (G.phase === 'play') { ctx.t += dt; ctx.phaseT += dt; OG.H.kleos(null, ctx.t); if (ctx.t > ctx.data.timeLimit && def.timeout !== false) ctx.lose(def.timeoutText || 'Time ran out.', { title: 'The day is spent' }); }
    try { def.update(dt, ctx, G.phase); } catch (e) { console.error('[level ' + def.id + ']', e); G.log.push(['error', String(e && e.message)]); }
    if (G.phase === 'play' && ctx._cue && ctx._cue[3] !== OG.In.source) ctx.cue(...ctx._cue.slice(0, 3));   // the sentence follows the input in use
  }
  OG.H.hands(OG.In.cursors());
};
/** the tests' window: phase, level, result, and the level's own debug (targets as stage fractions) */
G.debug = () => ({ phase: G.phase, level: G.cur && G.cur.id, stage: G.ctx && G.ctx.stage, t: G.ctx && G.ctx.t, result: G.result || null, info: G.cur && G.cur.debug && G.ctx ? G.cur.debug(G.ctx) : null, source: OG.In.source, hands: OG.In.hands.map(h => [h.pose, +h.x.toFixed(3), +h.y.toFixed(3)]), audio: OG.A.log.slice(-6) });
window.OdysseyGame = { boot: G.boot, start: id => G.start(id), chart: () => G.chart(), play: () => G.play(), debug: G.debug, G, OG };
})();
