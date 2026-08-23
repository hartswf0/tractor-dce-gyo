/**
 * GAUNTLET PAGE — a real kit on one side, our build on the other, and a harsh
 * critic between them.
 *
 * The complaint this answers is that our builds are not real things. The fix
 * is not an opinion, it is a named fetchable file: kits/5935-island-hopper.mpd
 * is 184 pieces of shore, seaplane, jetty and minifig, and it beats every
 * generator output in this repo on all twelve axes. So the bed holds two
 * models at once and the sheet holds the argument between them.
 *
 * The comparison is BLIND. NabugoGauntlet.blind strips the filename, the
 * author line, every `0 //` comment and the submodel names from both entrants
 * and shuffles them, so the two panes are A and B until you tap REVEAL. The
 * `key` that maps A and B back to ours and theirs is sealed on the pair
 * object; this file is the only caller allowed to read it, and it reads it in
 * exactly one place — reveal().
 *
 * Nothing here judges. The critic is NabugoGauntlet, the builder is
 * NabugoBrand, the ruler is NabugoKits.measurePlacements, and the page draws
 * what they said. There is no total anywhere on it: a weighted sum is a
 * supreme judge in disguise, so the AXES panel is twelve rows and a count of
 * how many were won, never a score.
 */
(function (global) {
'use strict';

const H = (t, c, x) => Hilux.h(t, c, x);
const AX = id => String(id || '').replace(/^AX-/, '');
const fmt = v => !Number.isFinite(v) ? '—' : Math.abs(v) >= 10 ? v.toFixed(1)
                 : Math.abs(v) >= 1 ? v.toFixed(2) : v.toFixed(3);
const pct = v => Number.isFinite(v) ? Math.round(v * 100) + '%' : '—';

async function boot(cfg) {
  const N = global.Nabugo, U = global.NabugoUI,
        K = global.NabugoKits, B = global.NabugoBrand, G = global.NabugoGauntlet;

  const St = {
    g: null,                                   // GauntletState
    kit: cfg.kit || '5935-island-hopper',
    seed: cfg.seed == null ? 1 : cfg.seed,
    temperament: cfg.temperament === 'HIGH' ? 'HIGH' : 'LOW',
    viewA: null, viewB: null,                  // two engines, left and right
    paneA: null, paneB: null,                  // {p:pane, v:viewer host, cap:caption}
    bed: 'blind',                              // 'blind' | 'ours' | 'kit'
    pair: null, revealed: false,               // the sealed key lives on pair
    shots: [],                                 // per round: ours MPD + transcript row
    pickKit: cfg.kit || '5935-island-hopper',  // the KIT panel's selection
    kitVec: new Map(), flat: new Map(),        // measured kits and flattened kits, by name
    running: false, quiet: false, warned: false, promotions: 0, chain: Promise.resolve()
  };
  global.GauntletPage = St;

  const hx = Hilux.mount({
    title: cfg.title || 'The Gauntlet',
    chips: ['round', 'worst', 'wins', 'bar', 'cat'],
    placeholder: 'run 4 · step · kit 7140 · road high · axis · reveal · mpd',
    wallEmpty: cfg.note || 'A named kit on one side, our build on the other, and ties go to the kit.',
    traceEmpty: 'no rounds yet',
    rounds: true,
    panels: [
      { id: 'run',     label: 'RUN',     glyph: '▶', title: 'the loop · the exit is winning',   build: panelRun },
      { id: 'verdict', label: 'VERDICT', glyph: '⊞', title: 'twelve axes, never a total',       build: panelVerdict },
      { id: 'brief',   label: 'BRIEF',   glyph: '✎', title: 'one axis, the worst',              build: panelBrief },
      { id: 'card',    label: 'CARD',    glyph: '▤', title: 'the blind card — A against B',     build: panelCard },
      { id: 'layers',  label: 'LAYERS',  glyph: '▥', title: 'six layers, six clocks',           build: panelLayers },
      { id: 'kit',     label: 'KIT',     glyph: '★', title: 'the bar — a real set, not a description', build: panelKit }
    ],
    onCommand: command,
    onWorld: async (canvasEl) => {
      buildBed(canvasEl);
      // One after the other: BetaPrimeEngine sizes itself to its host on create,
      // and a host that is still zero-wide gives a NaN aspect ratio.
      St.viewA = await U.makeViewer(St.paneA.v, { background: cfg.background });
      St.viewB = await U.makeViewer(St.paneB.v, { background: cfg.background });
      hx.status('two entrants, unlabelled');
      await load();
    },
    onFit: () => fitBoth(),
    onTrace: i => scrub(i),
    onResize: () => resizeBoth()
  });
  St.hx = hx;

  // ══ the bed ═══════════════════════════════════════════════════════════
  // Two viewers side by side, because a blind comparison you cannot see is
  // not a comparison. Solo mode gives either one the whole bed — that is a
  // deliberate look, and it says so in the log when you take it.
  function buildBed(host) {
    host.style.display = 'flex';
    host.style.flexDirection = 'row';
    const pane = () => {
      const p = H('div');
      p.style.cssText = 'flex:1 1 0;min-width:0;position:relative;overflow:hidden';
      const v = H('div');
      v.style.cssText = 'position:absolute;inset:0';
      // At the TOP of the pane: the bed's own status sits bottom-left and its
      // fit hint bottom-right, and a caption down there fights both.
      const cap = H('div', '', 'A');
      cap.style.cssText = 'position:absolute;left:0;right:0;top:0;z-index:2;padding:4px 7px;' +
        'font:9px/1.4 var(--hx-mono);letter-spacing:.14em;text-transform:uppercase;' +
        'color:var(--hx-dim);background:linear-gradient(#000c,#0000);pointer-events:none;' +
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      p.append(v, cap);
      return { p, v, cap };
    };
    const a = pane(), b = pane();
    b.p.style.borderLeft = '1px solid var(--hx-line)';
    b.cap.textContent = 'B';
    host.append(a.p, b.p);
    St.paneA = a; St.paneB = b;
  }

  function bedMode(mode) {
    St.bed = mode;
    St.paneA.p.style.display = (mode === 'blind' || mode === 'ours') ? '' : 'none';
    St.paneB.p.style.display = (mode === 'blind' || mode === 'kit') ? '' : 'none';
    resizeBoth();
    captions();
  }

  /** A hidden pane is zero-wide, and a zero-wide host is a NaN aspect ratio. */
  function resizeBoth() {
    for (const [view, host] of [[St.viewA, St.paneA], [St.viewB, St.paneB]])
      if (view && host && host.v.clientWidth > 0) view.updateRendererSize();
  }
  function fitBoth() {
    for (const [view, host] of [[St.viewA, St.paneA], [St.viewB, St.paneB]])
      if (view && host && host.v.clientWidth > 0) U.frame(view, St.bed === 'blind' ? 1.05 : 0.8);
  }

  function captions() {
    const bar = St.g && St.g.bar;
    if (St.bed === 'ours') {
      St.paneA.cap.textContent = 'OURS · ' + (St.g && St.g.vector ? St.g.vector.pieces + ' pcs' : 'nothing built');
    } else if (St.bed === 'kit') {
      const rec = K.KITS.find(k => k.kit === St.pickKit) || {};
      St.paneB.cap.textContent = 'THE KIT · ' + (rec.set || '') + ' ' + (rec.name || St.pickKit);
    } else if (St.revealed && St.pair) {
      const key = St.pair.key;
      const label = side => key[side] === 'ours'
        ? 'OURS · ' + (St.g.vector ? St.g.vector.pieces : '?') + ' pcs'
        : 'THE KIT · ' + bar.kit + ' · ' + bar.pieces + ' pcs';
      St.paneA.cap.textContent = label('A');
      St.paneB.cap.textContent = label('B');
    } else {
      St.paneA.cap.textContent = 'A';
      St.paneB.cap.textContent = 'B';
    }
  }

  /**
   * One render at a time across BOTH viewers, and nothing on screen while one
   * is parsing.
   *
   * Two loaders fetching parts at once flood the connection pool — the arena
   * learned that — so every draw goes through one chain. The second half is
   * less obvious and was measured here: LDrawLoader paces its subobject work
   * on requestAnimationFrame, and a 200-piece LDraw model is about 147,000
   * triangles. With one such model standing in a pane the page falls from 60
   * frames a second to 4, the loader gets four ticks a second, and the next
   * parse never finishes. So both models are hidden for the length of a parse
   * and put back after it: the bed blinks, and the load completes in seconds
   * instead of never.
   */
  function draw(view, text, label) {
    if (!view || !text) return St.chain;
    St.chain = St.chain.then(async () => {
      const hidden = [];
      for (const v of [St.viewA, St.viewB])
        if (v && v.modelWrapper) { hidden.push(v.modelWrapper); v.modelWrapper.visible = false; }
      try { view.clear(); } catch (e) { /* nothing loaded yet */ }
      try {
        await U.render(view, text, null, label);
        // render() frames at 0.6, which crops badly in half a phone-wide bed.
        U.frame(view, St.bed === 'blind' ? 1.05 : 0.8);
      }
      finally { for (const m of hidden) m.visible = true; }
    }).catch(e => console.error(e));
    return St.chain;
  }

  // ══ boot ══════════════════════════════════════════════════════════════
  async function load() {
    if (!K || !B || !G) {
      hx.chip('cat', 'modules missing', 'bad');
      return hx.say('SYSTEM', 'This page needs nabugo-kits.js, nabugo-brand.js and nabugo-gauntlet.js.',
                    { kind: 'bad' });
    }
    try {
      const cm = await N.Catalog.load('./nabugo-parts.json');
      await global.NabugoEvo.Ports.load('./nabugo-ports.json');
      try { await global.NabugoCrew.Stores.load(); } catch (e) { /* the -ator libraries are optional */ }
      await K.loadIndex().catch(() => null);
      hx.chip('cat', (cm.count / 1000).toFixed(1) + 'k parts', 'ok');
      hx.say('SYSTEM', cm.count.toLocaleString() + ' parts · ' + K.KITS.length +
             ' real kits on the shelf · ties go to the kit', { kind: 'sys' });
    } catch (err) {
      hx.chip('cat', 'no catalogue', 'bad');
      return hx.say('SYSTEM', 'Serve over HTTP — this page needs its data files.', { kind: 'bad' });
    }
    if (N.Bus.connect(cfg.source || 'gauntlet')) hx.say('SYSTEM', 'bus wag-frank connected', { kind: 'sys' });
    for (const d of (G.DEPARTURES || []))
      hx.say('CONTRACT', d.clause + ' — ' + d.resolution, { kind: 'warn' });
    await reset();
  }

  async function reset() {
    St.running = false;
    St.shots = []; St.pair = null; St.revealed = false; St.warned = false; St.promotions = 0;
    hx.clearWall(); hx.clearRounds();
    hx.status('measuring the bar…');
    St.g = await G.start({ kit: St.kit, seed: St.seed, temperament: St.temperament,
                           subject: cfg.brief || '' });
    St.pickKit = St.kit;
    St.kitVec.set(St.g.bar.kit, St.g.bar.vector);
    const b = St.g.bar, rec = K.KITS.find(k => k.kit === b.kit) || {};
    hx.say('SYSTEM', 'the bar is ' + rec.set + ' ' + rec.name + ' — ' + b.file + ', ' + b.pieces +
           ' pieces, scale parity ' + b.scaleBand[0] + '–' + b.scaleBand[1] + ' pieces, ' +
           b.applicable.length + ' of ' + K.AXES.length + ' axes applicable', { kind: 'sys' });
    hx.say('CRITIC', rec.brief || '', { kind: 'sys' });
    hx.say('SYSTEM', 'temperament ' + St.temperament + ' (' + (St.temperament === 'LOW'
           ? 'Building 20 — cheap, repeated, re-cuttable' : 'the UCS shelf — refined, chiral, fine-grained') +
           ') · seed ' + St.seed, { kind: 'sys' });
    hx.status('nothing built yet — step, or run');
    paint();
  }

  // ══ the round ═════════════════════════════════════════════════════════
  async function step() {
    if (!St.g || St.g.stopped) return false;
    const before = St.g.result ? St.g.result.wins : 0;
    hx.busy(true); hx.status('building round ' + St.g.round + '…');
    try {
      await G.round(St.g);
    } catch (e) {
      hx.busy(false); hx.say('SYSTEM', 'the round threw: ' + e.message, { kind: 'bad' });
      console.error(e); return false;
    }
    hx.busy(false);
    const rows = G.transcript(St.g), t = rows[rows.length - 1];
    // Every round is kept as a scrubber point; only the last two dozen keep
    // their MPD, because a long run against an unanswerable gate would
    // otherwise hold a megabyte of text per twenty rounds.
    St.shots.push({ text: St.g.build ? St.g.build.toMPD({ filename: 'ours.mpd' }) : '', t });
    for (let i = 0; i < St.shots.length - 24; i++) St.shots[i].text = '';
    report(t, before);
    promoted();
    await reblind();
    paint();
    if (St.g.stopped) hx.say('SYSTEM', St.g.stopReason, { kind: 'warn' });
    return !St.g.stopped;
  }

  /** Run n rounds; `untilWon` runs until a round takes every applicable axis. */
  async function run(limit, untilWon) {
    if (St.running) { St.running = false; return; }
    St.running = St.quiet = true; hx.refresh('run');
    let n = 0;
    try {
      while (St.running && (limit == null || n++ < limit)) {
        const alive = await step();
        if (!alive) break;
        if (untilWon && St.g.result && St.g.result.allWon) break;
        stuck();
        await new Promise(r => setTimeout(r, 40));   // leave the rail tappable mid-run
      }
    } finally {
      St.running = St.quiet = false;
      if (St.bed === 'blind') redrawBed(); else if (St.bed === 'ours') showOurs();
      St.chain.then(() => saidStatus());
      hx.refresh('run');
    }
  }

  /** Winning promotes the bar, and that is the only thing worth shouting. */
  function promoted() {
    const p = St.g.promoted || [];
    if (p.length <= (St.promotions || 0)) return;
    St.promotions = p.length;
    const last = p[p.length - 1], r = St.g.result;
    hx.say('SYSTEM', 'THE BUILD BEATS ' + last.from + ' ON ALL ' + r.wins +
           ' APPLICABLE AXES. The bar is now ' + last.to + '.', { kind: 'ok' });
    hx.toast('bar promoted to ' + last.to);
    // `reset` still goes back to the bar the user last named, not to the one
    // the loop climbed to; the KIT panel follows the climb.
    St.pickKit = last.to;
    St.kitVec.set(St.g.bar.kit, St.g.bar.vector);
  }

  /**
   * There is no round-count exit in this loop and there must not be one: the
   * exits are winning and the user. But a gate the builder cannot answer voids
   * every round identically for as long as you let it, so the same reason five
   * times running is said out loud, once, and then it is the user's call.
   */
  function stuck() {
    // Compare the GATE, not the sentence: the reason carries the piece count
    // and 236 pieces is not a different failure from 237.
    const gate = r => String(r || '').split(':')[0];
    const h = St.g.transcript.slice(-5);
    if (h.length < 5 || !h.every(x => x.void && gate(x.voidReason) === gate(h[0].voidReason))) {
      St.warned = false; return;
    }
    if (St.warned) return;
    St.warned = true;
    hx.say('SYSTEM', 'five rounds voided on the same gate — ' + h[0].voidReason +
           '. The builder is not answering it; stop, and change the bar, the seed or the road.',
           { kind: 'bad' });
  }

  /**
   * A fresh shuffle every round: the panes are re-dealt, so neither is a tell.
   *
   * Both entrants go in as PLACEMENT LISTS, not as MPD text, and each side is
   * drawn from the blinded placements the pair hands back. Two reasons. The
   * page then never needs the key to know which pane is which — the key is
   * read in exactly one place, reveal(). And the two files are written by the
   * same writer from the same shape, so the packed kit and our submodelled
   * build cannot be told apart by how their text renders, which is a tell the
   * critic does not get and the eye should not get either.
   */
  async function reblind() {
    const g = St.g;
    if (!g || !g.vector || !g.places) return;
    const rng = N.mulberry32((St.seed * 2654435761 ^ g.round * 40503) >>> 0);
    St.pair = G.blind({ vector: g.vector, places: g.places },
                      { vector: g.bar.vector, places: await kitPlaces(g.bar.kit) }, rng);
    St.revealed = false;
    captions();
    // Mid-run the bed is not redrawn: two 140,000-triangle parses a round would
    // make a four-round run four minutes long, and nobody is reading the bed
    // while it runs. The pair is still dealt every round, so the scrubber can
    // go back to any of them, and the run redraws once at the end.
    if (St.quiet) return;
    if (St.bed === 'blind') redrawBed();
    else if (St.bed === 'ours') showOurs();
    St.chain.then(() => saidStatus());
  }

  function saidStatus() {
    const g = St.g, r = g && g.result;
    if (!g) return;
    hx.status(r && r.void ? 'VOID · ' + r.voidReason
              : 'round ' + g.round + ' · ' + (r ? r.wins + '/' + (r.wins + r.losses) + ' axes' : '—') +
                ' · ' + (St.revealed ? 'revealed' : 'blind'));
  }

  /** The bar, flattened to world coordinates once and kept. */
  async function kitPlaces(name) {
    if (!St.flat.has(name)) St.flat.set(name, K.flatten(await K.load(name)));
    return St.flat.get(name);
  }

  /** Blinded placements, through the engine's own writer. Rendering only. */
  function entrantText(places) {
    const s = new N.Scene('entrant');
    for (const q of places) s.add({ part: q.part, color: q.color, pos: q.pos, mat: q.mat, asm: q.asm });
    return s.toMPD({ filename: 'entrant.mpd' });
  }

  function reveal() {
    if (!St.pair) return hx.say('SYSTEM', 'nothing to reveal — run a round first', { kind: 'warn' });
    St.revealed = true;
    const key = St.pair.key;               // THE one read of the sealed key
    captions();
    hx.say('REVEAL', 'A is ' + (key.A === 'ours' ? 'ours' : 'the kit') + ', B is ' +
           (key.B === 'ours' ? 'ours' : 'the kit') + '. The critic never knew.', { kind: 'hot' });
    const r = St.g.result;
    hx.status('round ' + St.g.round + ' · ' + (r ? r.wins + '/' + (r.wins + r.losses) + ' axes' : '—') +
              ' · revealed');
    hx.refresh('card');
  }

  /** The round card the roots showed: accused axis, before, after, what changed. */
  function report(t, beforeWins) {
    const r = St.g.result;
    if (t.void) {
      hx.say('GATE', t.voidReason, { kind: 'bad' });
    } else {
      if (t.accused) hx.say('BUILDER', t.accused + ': ' + fmt(t.before) + ' → ' + fmt(t.after) +
                            (t.flipped ? ' — flipped to WIN' : ' — still ' + (t.now || 'LOSS')),
                            { kind: t.flipped ? 'ok' : 'warn' });
      hx.say('CRITIC', t.verdict, { kind: r && r.allWon ? 'ok' : 'bad' });
      if (t.regressed && t.regressed.length)
        hx.say('REGRESSED', t.regressed.join(' · '), { kind: 'warn' });
      if (r && r.brief) hx.say('BRIEF', r.brief.instruction, { kind: 'hot' });
    }
    hx.logRound({
      who: 'R' + t.round + ' · CRITIC · ' + (t.accused ? 'ACCUSED ' + AX(t.accused) : 'FIRST BUILD'),
      score: t.void ? 'VOID' : t.wins, delta: t.void ? 0 : t.wins - beforeWins,
      text: t.verdict,
      before: t.accused ? fmt(t.before) : t.pieces + ' pcs',
      after: t.accused ? fmt(t.after) : (r ? r.wins + '/' + (r.wins + r.losses) + ' axes' : '—'),
      changed: t.void ? 'void — no axis scored'
               : (t.flipped ? 'FLIPPED to WIN' : (t.now || '—')) + ' · ' + t.did,
      decorate: card => { if (r && r.axes && r.axes.length) card.appendChild(pips(r.axes)); }
    });
  }

  /** Twelve pips, one per axis, so a card shows the whole board without a total. */
  function pips(axes) {
    const row = H('div');
    row.style.cssText = 'display:flex;gap:3px;margin-top:7px';
    for (const v of axes) {
      const i = H('i');
      i.title = v.id + ' ' + fmt(v.ours) + ' vs ' + fmt(v.bar) + ' · ' + v.verdict;
      i.style.cssText = 'flex:1 1 0;height:4px;border-radius:2px;background:' +
        (v.verdict === 'WIN' ? 'var(--hx-ok)' : v.verdict === 'LOSS' ? 'var(--hx-bad)' : '#2a2a33');
      row.appendChild(i);
    }
    return row;
  }

  function scrub(i) {
    const s = St.shots[i];
    if (!s) return;
    hx.trace(tracePts(), i);
    hx.say('TRACE', 'round ' + s.t.round + ' · ' + (s.t.accused || 'no brief') + ' · ' + s.t.verdict,
           { kind: 'sys' });
    if (!s.text) return void hx.toast('round ' + s.t.round + ' is off the end of the reel');
    bedMode('ours');
    draw(St.viewA, s.text, 'round-' + s.t.round);
  }

  const tracePts = () => St.shots.map(s => ({
    label: 'R' + s.t.round + ' ' + (s.t.accused ? AX(s.t.accused) : 'first'),
    bad: s.t.void || s.t.losses > 0
  }));

  function paint() {
    const g = St.g; if (!g) return;
    const r = g.result;
    hx.chip('round', 'R' + g.round + (g.stopped ? ' · stopped' : ''));
    hx.chip('worst', r && r.worst ? 'accused ' + AX(r.worst.id) : r && r.allWon ? 'all won' : 'no accusation',
            r && r.worst ? 'bad' : r && r.allWon ? 'ok' : '');
    hx.chip('wins', r && !r.void ? r.wins + '/' + (r.wins + r.losses) + ' axes' : r && r.void ? 'VOID' : '— axes',
            r && r.allWon ? 'ok' : r && r.void ? 'bad' : 'hot');
    hx.chip('bar', g.bar.kit.split('-')[0] + ' · ' + g.bar.pieces + 'p');
    hx.trace(tracePts(), St.shots.length - 1);
    if (['verdict', 'brief', 'card', 'layers', 'run'].includes(hx.active)) hx.refresh();
  }

  // ══ panels ════════════════════════════════════════════════════════════
  function panelRun(el) {
    const g = St.g;
    el.appendChild(hx.cap('the loop'));
    el.appendChild(hx.row(
      hx.btn('Step', () => step()),
      hx.btn(St.running ? 'Stop' : 'Run 4', () => run(4), St.running ? 'stop' : 'go')
    ));
    el.appendChild(hx.row(
      hx.btn('Run until won', () => run(null, true)),
      hx.btn('Reset', () => { St.running = false; reset(); })
    ));
    el.appendChild(hx.kv('bar', g ? g.bar.kit : '—'));
    el.appendChild(hx.kv('round', g ? g.round : 0));
    el.appendChild(hx.kv('temperament', St.temperament + (St.temperament === 'LOW' ? ' · low road' : ' · high road')));
    el.appendChild(hx.kv('seed', St.seed));
    el.appendChild(hx.kv('scale parity', g ? g.bar.scaleBand.join('–') + ' pieces' : '—'));
    if (g && g.stopped) el.appendChild(hx.kv('stopped', g.stopReason, 'warn'));

    el.appendChild(hx.cap('the bed'));
    el.appendChild(hx.row(
      hx.btn('A | B', () => { bedMode('blind'); redrawBed(); }),
      hx.btn('Ours', () => showOurs()),
      hx.btn('The kit', () => showKit(St.g ? St.g.bar.kit : St.pickKit))
    ));
    el.appendChild(hx.row(
      hx.btn(St.revealed ? 'Revealed' : 'Reveal', () => { reveal(); hx.refresh('run'); }),
      hx.btn('Fit', () => fitBoth())
    ));
    el.appendChild(hx.row(
      hx.btn('Edges', () => both(v => v.setDiagnostics({ showEdges: (hx._e = !hx._e) }))),
      hx.btn('Grid', () => both(v => v.setDiagnostics({ grid: (hx._g = !hx._g) }))),
      hx.btn('Spin', () => both(v => v.setAutoSpin((hx._s = !hx._s))))
    ));

    el.appendChild(hx.cap('take it away'));
    el.appendChild(hx.row(
      hx.btn('MPD of ours', () => downloadOurs()),
      hx.btn('Broadcast', () => {
        if (!St.g || !St.g.build) return hx.toast('nothing built yet');
        hx.toast(N.Bus.emit(St.g.build.toScene(), { name: 'gauntlet round ' + St.g.round },
                            cfg.source || 'gauntlet') ? 'broadcast on wag-frank' : 'no BroadcastChannel here');
      })
    ));
    el.appendChild(H('div', 'hx-empty',
      'The exit is winning the blind comparison, never a round count. When every applicable axis ' +
      'is beaten the bar is promoted — 5935 to 7140 to 10174 — and the loop keeps going.'));
  }

  function both(fn) { [St.viewA, St.viewB].forEach(v => { if (v) try { fn(v); } catch (e) {} }); }

  function panelVerdict(el) {
    const r = St.g && St.g.result;
    if (!r) return void el.appendChild(H('div', 'hx-empty', 'nothing judged yet — step, or run.'));
    const gates = () => {
      el.appendChild(hx.cap('gates · checked before any axis is scored'));
      for (const gt of r.gates) {
        el.appendChild(hx.kv(gt.id, gt.ok ? 'pass' : gt.voids ? 'VOIDS THE ROUND' : 'fails, does not void',
                             gt.ok ? 'ok' : gt.voids ? 'bad' : 'warn'));
        if (!gt.ok) el.appendChild(H('div', 'hx-empty', gt.why));
      }
    };
    if (r.void) {                        // the gate is the whole story; lead with it
      el.appendChild(hx.cap('void round · no axis was scored'));
      el.appendChild(H('div', 'hx-empty', r.voidReason));
      return gates();
    }
    const worst = r.worst ? r.worst.id : null;
    // The accused axis first, then registry order. Never re-ranked by score.
    const order = worst ? r.axes.filter(v => v.id === worst).concat(r.axes.filter(v => v.id !== worst))
                        : r.axes;
    el.appendChild(hx.cap('the accused axis first · never a total'));
    for (const v of order) el.appendChild(axisRow(v, v.id === worst));
    el.appendChild(H('div', 'hx-empty',
      r.wins + ' won, ' + r.losses + ' lost, ' + r.na + ' N/A because the bar itself is outside ' +
      'those bands. Counted, never summed — each axis is won or lost on its own.'));
    gates();
  }

  /** One axis: theirs, ours, who won, by how much, and where the band is. */
  function axisRow(v, accused) {
    const c = H('div', 'hx-round');
    if (accused) c.style.borderColor = 'var(--hx-bad)';
    const hd = H('header');
    hd.append(H('span', 'n', AX(v.id) + ' · ' + v.label + ' · ' + v.layer),
              H('span', 's' + (v.verdict === 'WIN' ? ' up' : v.verdict === 'LOSS' ? ' down' : ''),
                v.verdict === 'N/A' ? 'N/A' : v.verdict));
    c.appendChild(hd);

    const lo = v.band[0], hi = v.band[1], span = Math.max(hi - lo, 1e-9);
    const at = x => Math.max(0, Math.min(100, ((x - lo) / span) * 100));
    const track = H('div');
    track.style.cssText = 'position:relative;height:12px;margin:6px 0 4px;background:#131316;border-radius:3px';
    const mark = (x, col, txt) => {
      const m = H('i');
      m.title = txt;
      m.style.cssText = 'position:absolute;top:0;bottom:0;width:2px;background:' + col +
        ';left:calc(' + at(x) + '% - 1px)';
      track.appendChild(m);
    };
    if (Number.isFinite(v.target)) mark(v.target, 'var(--hx-faint)', 'target ' + fmt(v.target));
    mark(v.bar, 'var(--hx-accent)', 'the kit ' + fmt(v.bar));
    mark(v.ours, v.verdict === 'WIN' ? 'var(--hx-ok)' : 'var(--hx-bad)', 'ours ' + fmt(v.ours));
    c.appendChild(track);

    const ba = H('div', 'ba');
    const cell = (k, val) => { const d = H('div'); d.append(H('span', '', k), document.createTextNode(val)); return d; };
    ba.append(cell('theirs', fmt(v.bar)), cell('ours', fmt(v.ours)),
              cell('margin', fmt(v.margin)));
    c.appendChild(ba);
    c.appendChild(H('div', 'd', v.why));
    if (v.unit) c.appendChild(H('div', 'd', 'band [' + lo + ', ' + hi + '] ' + v.unit));
    return c;
  }

  function panelBrief(el) {
    const b = St.g && St.g.brief;
    if (!b) {
      el.appendChild(H('div', 'hx-empty', St.g && St.g.result && St.g.result.allWon
        ? 'Nothing is lost. The bar was promoted; run again.'
        : 'no brief yet — step, or run.'));
    } else {
      el.appendChild(hx.cap('one axis. handing a builder four targets produces four half-fixes'));
      const c = H('div', 'hx-round');
      const hd = H('header');
      hd.append(H('span', 'n', AX(b.axis) + ' · ' + b.layer), H('span', 's', fmt(b.ours)));
      c.append(hd, H('div', 'd', b.instruction));
      el.appendChild(c);
      el.appendChild(hx.kv('bar value', fmt(b.barValue)));
      el.appendChild(hx.kv('band', b.band ? '[' + b.band[0] + ', ' + b.band[1] + ']' : '—'));
      el.appendChild(hx.kv('win window', b.window ? fmt(b.window[0]) + ' – ' + fmt(b.window[1]) : 'none'));
      if (b.pieceWindow)
        el.appendChild(hx.kv('in pieces', fmt(b.pieceWindow.lo) + ' – ' + fmt(b.pieceWindow.hi) +
                             ' of ' + b.pieceWindow.pieces, b.pieceWindow.feasible ? '' : 'bad'));
      if (b.pieceWindow && !b.pieceWindow.feasible)
        el.appendChild(H('div', 'hx-empty', b.pieceWindow.why));
      if (b.forbidden && b.forbidden.length) {
        el.appendChild(hx.cap('do not give these back'));
        for (const f of b.forbidden) el.appendChild(H('div', 'hx-empty', f));
      }
    }
    const rows = St.g ? G.transcriptLines(St.g) : [];
    if (rows.length) {
      el.appendChild(hx.cap('the loop, one line a round'));
      const pre = H('pre');
      pre.style.cssText = 'font:11px/1.6 var(--hx-mono);color:var(--hx-dim);white-space:pre;overflow-x:auto';
      pre.textContent = rows.join('\n');
      el.appendChild(pre);
    }
  }

  function panelCard(el) {
    if (!St.pair) return void el.appendChild(H('div', 'hx-empty',
      'no card yet. Each round the two entrants are stripped of filename, author, comments and ' +
      'submodel names, shuffled, and dealt to A and B.'));
    const key = St.revealed ? St.pair.key : null;
    const name = s => !key ? s : key[s] === 'ours' ? s + ' · OURS' : s + ' · THE KIT';
    el.appendChild(hx.cap('the blind card · ' + (St.revealed ? 'revealed' : 'labels stripped, order shuffled')));
    const head = H('div', 'hx-kv');
    head.append(H('span', '', 'axis'), H('b', '', name('A') + '   ' + name('B')));
    el.appendChild(head);
    const A = St.pair.A.vector, Bv = St.pair.B.vector;
    el.appendChild(hx.kv('pieces', (A ? A.pieces : '—') + '   ' + (Bv ? Bv.pieces : '—')));
    for (const ax of K.AXES) {
      const a = A && A.axes ? A.axes[ax.id] : NaN, b = Bv && Bv.axes ? Bv.axes[ax.id] : NaN;
      el.appendChild(hx.kv(AX(ax.id), fmt(a) + '   ' + fmt(b)));
    }
    el.appendChild(hx.row(hx.btn(St.revealed ? 'Revealed' : 'Reveal which is which',
      () => { reveal(); hx.refresh('card'); })));
    el.appendChild(H('div', 'hx-empty',
      'The critic scores from these two columns and is never told which is which. The mapping is ' +
      'sealed on the pair object and this page reads it in exactly one place.'));
  }

  function panelLayers(el) {
    el.appendChild(hx.cap('road'));
    el.appendChild(hx.row(
      hx.btn('Low road', () => road('LOW'), St.temperament === 'LOW' ? 'go' : ''),
      hx.btn('High road', () => road('HIGH'), St.temperament === 'HIGH' ? 'go' : '')
    ));
    el.appendChild(H('div', 'hx-empty', St.temperament === 'LOW'
      ? 'Building 20: staples only, 3–5 effective colours, repetition is the point (reuse 0.35), ' +
        'structure buffer 0.30 so there is room to re-cut, brick courses.'
      : 'The UCS shelf: chirality pairs and wedges required, 6–9 effective colours, snot 0.35, ' +
        'small named blocks, plate courses, structure buffer 0.45.'));

    const build = St.g && St.g.build;
    if (!build) return void el.appendChild(H('div', 'hx-empty', 'no build yet — step, or run.'));
    const a = build.audit();
    el.appendChild(hx.cap('six layers, six clocks · a fast layer is never trapped in a slow one'));
    for (const l of a.layers) {
      el.appendChild(hx.kv(l.layer + ' · ' + l.clock, l.parts + ' pcs · ' + pct(l.share) +
        ' of [' + pct(l.shareBand[0]) + '–' + pct(l.shareBand[1]) + ']',
        l.parts === 0 ? 'warn' : l.inBand ? 'ok' : 'bad'));
      const m = H('div', 'hx-meter'), i = H('i');
      i.style.width = Math.min(100, l.share / Math.max(l.shareBand[1], 1e-6) * 100) + '%';
      if (!l.inBand && l.parts) i.style.background = 'var(--hx-bad)';
      m.appendChild(i); el.appendChild(m);
    }
    el.appendChild(hx.cap('trapped layers'));
    if (!a.trapped.length) el.appendChild(hx.kv('sealed fast pieces', 'none', 'ok'));
    else for (const t of a.trapped.slice(0, 12))
      el.appendChild(hx.kv(t.layer + ' ' + t.part, t.pos.map(Math.round).join(','), 'bad'));

    el.appendChild(hx.cap('uncommitted volume · at least a quarter stays empty, permanently'));
    el.appendChild(hx.kv('uncommitted', pct(a.uncommitted), a.uncommitted >= 0.25 ? 'ok' : 'bad'));
    el.appendChild(hx.kv('STRUCTURE occupancy', fmt(a.buffer.STRUCTURE) + ' / 0.45',
      a.buffer.STRUCTURE <= 0.45 ? 'ok' : 'bad'));
    el.appendChild(hx.kv('+ SKIN', fmt(a.buffer.STRUCTURE_SKIN) + ' / 0.60',
      a.buffer.STRUCTURE_SKIN <= 0.60 ? 'ok' : 'bad'));
    el.appendChild(hx.kv('all six', fmt(a.buffer.ALL) + ' / 0.75', a.buffer.ALL <= 0.75 ? 'ok' : 'bad'));
    if (a.reserves.length) {
      el.appendChild(hx.cap('reserved for a future layer'));
      for (const r of a.reserves) el.appendChild(H('div', 'hx-empty', r));
    }
    el.appendChild(hx.cap('blocks · tier A anatomy, tier B detail atoms'));
    el.appendChild(hx.kv('blocks', a.blocks.count + ' · ' + a.blocks.instanced + ' instanced'));
    el.appendChild(hx.kv('pieces through instances', pct(a.blocks.instancedShare)));
    el.appendChild(hx.kv('largest block', pct(a.blocks.largestShare) + ' of pieces',
      a.blocks.largestShare > 0.35 ? 'bad' : 'ok'));
    el.appendChild(hx.kv('blocks of 5 parts or fewer', pct(a.blocks.tinyShare)));
    for (const f of a.blockRuleFailures) el.appendChild(H('div', 'hx-empty', f));
    el.appendChild(hx.kv('layer order', a.order.ok ? 'slowest first' : a.order.why, a.order.ok ? 'ok' : 'bad'));
  }

  function road(t) {
    if (St.temperament === t) return;
    St.temperament = t;
    hx.say('SYSTEM', t === 'LOW' ? 'low road — cheap, repeated, endlessly re-cuttable'
                                 : 'high road — durable, refined, chiral', { kind: 'sys' });
    reset();
  }

  // ── KIT: the reference card, the shelf, and the kit in the bed ─────────
  function panelKit(el) {
    const rec = K.KITS.find(k => k.kit === St.pickKit) || K.KITS[0];
    const vec = St.kitVec.get(rec.kit);

    // The reference card. Hilux has no reference plate to hang this on and the
    // chassis is not ours to change, so the card lives at the head of the panel.
    const card = H('div', 'hx-round');
    const hd = H('header');
    hd.append(H('span', 'n', 'SET ' + rec.set + (rec.bar ? ' · ' + rec.role + ' BAR' : '')),
              H('span', 's', (vec ? vec.pieces : rec.pieces) + ' pcs'));
    card.append(hd, H('div', 'd', rec.name), H('div', 'd', rec.brief));
    const ba = H('div', 'ba');
    const cell = (k, v) => { const d = H('div'); d.append(H('span', '', k), document.createTextNode(String(v))); return d; };
    ba.append(cell('blocks', vec ? vec.raw.modelBlocks : rec.blocks),
              cell('file', rec.file.replace('kits/', '')),
              cell('depth', vec ? vec.raw.maxDepth : '—'));
    card.appendChild(ba);
    hx.pinnable(card, rec.set + ' ' + rec.name + ' — ' + rec.brief);
    el.appendChild(card);

    el.appendChild(hx.cap('the shelf · ' + K.KITS.length + ' real sets, named and fetchable'));
    el.appendChild(hx.select(K.list().map(k => ({
      value: k.kit,
      label: (k.bar ? '★ ' : '  ') + k.set + ' ' + k.name + ' · ' + k.pieces + 'p' +
             (k.degenerate ? ' · NOT A KIT' : '')
    })), St.pickKit, v => { St.pickKit = v; hx.refresh('kit'); measureKit(v); }));
    el.appendChild(hx.row(
      hx.btn('Put it in the bed', () => showKit(St.pickKit)),
      hx.btn('Make it the bar', () => setBar(St.pickKit))
    ));
    if (rec.degenerate) {
      el.appendChild(H('div', 'hx-empty',
        'A single LDraw part file with zero pieces. It enters no norm and may never be a bar.'));
      return;
    }

    if (!vec) {
      el.appendChild(H('div', 'hx-empty', 'measuring…'));
      measureKit(rec.kit);
      return;
    }
    el.appendChild(hx.cap('measured · the same code path that measures us'));
    el.appendChild(hx.kv('pieces / distinct', vec.pieces + ' / ' + vec.raw.distinct));
    el.appendChild(hx.kv('blocks · depth', vec.raw.modelBlocks + ' · ' + vec.raw.maxDepth));
    el.appendChild(hx.kv('bbox studs', vec.raw.bboxStuds.map(Math.round).join(' × ')));
    el.appendChild(hx.kv('colours', vec.raw.colours));
    const ours = St.g && St.g.vector;
    for (const ax of K.AXES) {
      const v = vec.axes[ax.id], inB = v >= ax.band[0] && v <= ax.band[1];
      el.appendChild(hx.kv(AX(ax.id),
        fmt(v) + (ours ? '  (ours ' + fmt(ours.axes[ax.id]) + ')' : '') +
        '  [' + ax.band[0] + ', ' + ax.band[1] + ']', inB ? 'ok' : 'warn'));
    }
    el.appendChild(H('div', 'hx-empty',
      'An axis whose kit value is outside the band is N/A: a set that does not exercise an axis ' +
      'cannot judge it.'));
    el.appendChild(hx.cap("shearing layers, as the kit cut them"));
    for (const [k, v] of Object.entries(vec.raw.layerShare))
      if (v > 0) el.appendChild(hx.kv(k, pct(v)));
  }

  async function measureKit(name) {
    if (St.kitVec.has(name)) return;
    const rec = K.KITS.find(k => k.kit === name);
    if (!rec || rec.degenerate) return;
    try {
      St.kitVec.set(name, await K.measure(name));
      if (hx.active === 'kit') hx.refresh('kit');
    } catch (e) { hx.say('SYSTEM', 'could not measure ' + name + ': ' + e.message, { kind: 'bad' }); }
  }

  async function showKit(name) {
    const rec = K.KITS.find(k => k.kit === name);
    if (!rec || rec.degenerate) return hx.say('SYSTEM', 'not a kit', { kind: 'bad' });
    St.pickKit = name;
    bedMode('kit');
    hx.status('loading ' + rec.set + ' ' + rec.name + '…');
    const doc = await K.load(name);
    hx.say('SYSTEM', 'the bed holds ' + rec.set + ' ' + rec.name + ' — openly labelled. ' +
           'The critic still scores blind.', { kind: 'sys' });
    await draw(St.viewB, doc.text, name);
    hx.status(rec.set + ' ' + rec.name + (St.g && St.g.bar.kit === name ? ' · the bar' : ' · not the bar'));
    measureKit(name);
    hx.refresh('kit');
  }

  function showOurs() {
    if (!St.g || !St.g.build) return hx.say('SYSTEM', 'nothing built yet', { kind: 'warn' });
    bedMode('ours');
    draw(St.viewA, St.g.build.toMPD({ filename: 'ours.mpd' }), 'ours');
    hx.status('ours · round ' + St.g.round + ' · ' + St.g.vector.pieces + ' pieces');
  }

  function redrawBed() {
    if (St.bed !== 'blind' || !St.pair) return;
    draw(St.viewA, entrantText(St.pair.A.places), 'entrant-a');
    draw(St.viewB, entrantText(St.pair.B.places), 'entrant-b');
    St.chain.then(() => saidStatus());
  }

  async function setBar(name) {
    const rec = K.KITS.find(k => k.kit === name);
    if (!rec || rec.degenerate) return hx.say('SYSTEM', 'that file may never be a bar', { kind: 'bad' });
    St.kit = name;
    hx.say('SYSTEM', 'the bar is now ' + rec.set + ' ' + rec.name + ' — the loop restarts against it',
           { kind: 'hot' });
    await reset();
  }

  function downloadOurs() {
    if (!St.g || !St.g.build) return hx.toast('nothing built yet');
    U.download(St.g.build.toMPD({ filename: 'gauntlet-r' + St.g.round + '.mpd' }),
               'gauntlet-' + St.g.bar.kit + '-r' + St.g.round + '.mpd');
    hx.toast('downloaded');
  }

  // ══ commands ══════════════════════════════════════════════════════════
  function resolveKit(q) {
    const s = String(q || '').toLowerCase();
    return (K.KITS.find(k => k.kit === s) ||
            K.KITS.find(k => k.set.toLowerCase() === s) ||
            K.KITS.find(k => k.kit.startsWith(s)) ||
            K.KITS.find(k => (k.name + ' ' + k.kit).toLowerCase().includes(s)) || null);
  }

  function command(text) {
    const t = text.trim(), low = t.toLowerCase();
    let m;
    if ((m = low.match(/^(?:run|go)(?:\s+(\d+))?$/))) return void run(m[1] ? +m[1] : 4);
    if (/^(until|run until won|won)$/.test(low)) return void run(null, true);
    if (/^(step|round|next)$/.test(low)) return void step();
    if (/^(stop|halt)$/.test(low)) {
      // The first stop halts the run loop and leaves the state alive to step;
      // a second one seals it, which is the contract's only user-side exit.
      if (St.running) { St.running = false; return void hx.say('SYSTEM', 'stopped — step to continue', { kind: 'warn' }); }
      if (St.g) G.stop(St.g, 'stopped by hand');
      paint(); return void hx.say('SYSTEM', 'the loop is sealed — reset to run again', { kind: 'warn' });
    }
    if (/^reset$/.test(low)) { St.running = false; return void reset(); }
    if ((m = low.match(/^(?:kit|bar)\s+(.+)$/))) {
      const rec = resolveKit(m[1]);
      if (!rec) return void hx.say('SYSTEM', 'kits: ' + K.KITS.map(k => k.set).join(', '), { kind: 'bad' });
      if (/^bar/.test(low)) return void setBar(rec.kit);
      St.pickKit = rec.kit; hx.show('kit'); return void showKit(rec.kit);
    }
    if ((m = low.match(/^layer\s+(\w+)$/))) {
      const id = m[1].toUpperCase();
      const spec = B.LAYERS.find(l => l.id.startsWith(id));
      if (!spec) return void hx.say('SYSTEM', 'layers: ' + B.LAYERS.map(l => l.id).join(', '), { kind: 'bad' });
      const a = St.g && St.g.build ? St.g.build.audit() : null;
      const row = a && a.layers.find(l => l.layer === spec.id);
      hx.say(spec.id, spec.clock + ' — owns ' + spec.owns + '. Generates ' + spec.generates.join(', ') +
             '. May not touch ' + spec.mayNotTouch.join(', ') + '.' +
             (row ? ' Now: ' + row.parts + ' pieces, ' + pct(row.share) + '.' : ''), { kind: 'sys' });
      return void hx.show('layers');
    }
    if ((m = low.match(/^(?:road|temper|temperament)\s+(low|high)$/))) return void road(m[1].toUpperCase());
    if ((m = low.match(/^axis(?:\s+(\S+))?$/))) {
      const r = St.g && St.g.result;
      if (!r || !r.axes.length) return void hx.say('SYSTEM', 'nothing judged yet', { kind: 'warn' });
      if (m[1]) {
        const v = r.axes.find(x => x.id.toLowerCase().includes(m[1]));
        if (!v) return void hx.say('SYSTEM', 'axes: ' + K.AXES.map(a => AX(a.id)).join(', '), { kind: 'bad' });
        return void hx.say(AX(v.id), v.verdict + ' — ' + v.why, { kind: v.verdict === 'WIN' ? 'ok' : 'bad' });
      }
      hx.say('CRITIC', r.verdict, { kind: 'bad', pre: r.axes.map(v =>
        AX(v.id).padEnd(10) + String(v.verdict).padEnd(5) + 'ours ' + fmt(v.ours).padStart(8) +
        '   kit ' + fmt(v.bar).padStart(8)).join('\n') });
      return void hx.show('verdict');
    }
    if ((m = low.match(/^seed\s+(-?\d+)$/))) { St.seed = +m[1]; return void reset(); }
    if ((m = low.match(/^bed\s+(blind|ours|kit|a|b|both)$/))) {
      if (m[1] === 'ours' || m[1] === 'a') return void showOurs();
      if (m[1] === 'kit' || m[1] === 'b') return void showKit(St.g ? St.g.bar.kit : St.pickKit);
      bedMode('blind'); return void redrawBed();
    }
    if (/^reveal$/.test(low)) return void reveal();
    if (/^mpd$/.test(low)) return void downloadOurs();
    if (/^fit$/.test(low)) return void fitBoth();
    if (/^(help|\?)$/.test(low)) return void hx.say('SYSTEM',
      'run [n] · step · until · stop · reset · kit <name> · bar <name> · layer <name> · ' +
      'road low|high · axis [id] · seed <n> · bed blind|ours|kit · reveal · mpd · fit', { kind: 'sys' });
    hx.say('SYSTEM', 'not a command I know — try help', { kind: 'warn' });
  }

}

global.GauntletBoot = boot;
})(window);
