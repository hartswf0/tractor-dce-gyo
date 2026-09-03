/**
 * ARENA PAGE — the bake-off, mounted on Hilux.
 *
 * The arena was four columns wide: brief, two 3D lanes, trace, and a verdict
 * bar under all of it. At phone width the two lanes became two ~40vh boxes in
 * a page that was already over 100vh, and nothing was legible.
 *
 * Hilux has one bed, so the arena gets one bed: both doctrines still step in
 * lockstep and both are still audited every round, but you look at one lane at
 * a time and switch. The comparison was never really the two pictures anyway —
 * it is the verdict, and the verdict is a panel now, per axis, with the leader
 * named. Only the visible lane renders, which also ends the two-loaders-racing
 * stall the old page had on every step.
 *
 * DUEL runs the two doctrines from nabugo.js. AVIARY runs the three finches
 * from nabugo-evo.js. Same bed, same tray, same bus.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, E = global.NabugoEvo, U = global.NabugoUI;
  const H = Hilux.h;
  const St = { mode: 'duel', arena: null, aviary: null, viewer: null, running: false,
               briefKey: 'theseus', lane: 0, portsReady: false, lastKey: '' };
  global.NabugoArena = St;

  const hx = Hilux.mount({
    title: 'Nabugo',
    chips: ['round', 'lane', 'lead', 'cat'],
    placeholder: 'run · step · lane co · aviary · brief atlantis · help',
    wallEmpty: 'two doctrines · one brief · one catalogue',
    traceEmpty: 'no rounds yet',
    rounds: true,
    panels: [
      { id: 'run',     label: 'RUN',     glyph: '▶', title: 'the arena',                build: panelRun },
      { id: 'verdict', label: 'VERDICT', glyph: '⚖', title: 'per axis · never averaged', build: panelVerdict },
      { id: 'tray',    label: 'TRAY',    glyph: '⊞', title: 'the 9×9 · every lane at once', build: panelTray },
      { id: 'ledger',  label: 'LEDGER',  glyph: '≣', title: 'the audit, lane by lane',   build: panelLedger }
    ],
    onCommand: command,
    onWorld: async canvasEl => {
      St.viewer = await U.makeViewer(canvasEl);
      await load();
    },
    onFit: () => U.frame(St.viewer, 0.72),
    onTrace: i => {
      const rows = allRounds();
      const r = rows[i];
      if (r) hx.say('TRACE', r.label + ' — ' + r.text, { kind: 'sys' });
    },
    onResize: () => St.viewer && St.viewer.updateRendererSize()
  });
  St.hx = hx;

  async function load() {
    try {
      const meta = await N.Catalog.load('./nabugo-parts.json');
      hx.chip('cat', (meta.count / 1000).toFixed(1) + 'k parts', 'ok');
      hx.say('SYSTEM', meta.count.toLocaleString() + ' indexed parts', { kind: 'sys' });
    } catch (e) {
      hx.chip('cat', 'no catalogue', 'bad');
      hx.say('SYSTEM', 'Serve this page over HTTP — it needs nabugo-parts.json.', { kind: 'bad' });
      return;
    }
    if (N.Bus.connect('nabugo-arena')) {
      hx.say('SYSTEM', 'bus wag-frank connected', { kind: 'sys' });
      N.Bus.onInbound(({ msg }) => hx.say('BUS', msg.kind + ' from ' + (msg.source || '?'), { kind: 'hot' }));
    }
    setMode('duel');
  }

  // ── lanes ──────────────────────────────────────────────────────────────
  function lanes() {
    if (St.mode === 'duel') {
      if (!St.arena) return [];
      return [{ label: 'operator', name: 'OPERATOR', get: () => St.arena.a },
              { label: 'correspondence', name: 'CORRESPOND', get: () => St.arena.b }];
    }
    if (!St.aviary) return [];
    return St.aviary.birds.map(b => ({ label: b.finch.key, name: b.finch.name.toUpperCase(), get: () => b }));
  }
  const lane = () => lanes()[Math.min(St.lane, Math.max(0, lanes().length - 1))];

  async function setMode(mode) {
    St.running = false;
    St.mode = mode;
    if (mode === 'aviary' && !St.portsReady) {
      try { const pm = await E.Ports.load('./nabugo-ports.json'); St.portsReady = true;
            hx.say('SYSTEM', pm.ports.toLocaleString() + ' stud ports loaded', { kind: 'sys' }); }
      catch (e) { hx.say('SYSTEM', 'port registry unavailable — the compiler needs it', { kind: 'bad' });
                  St.mode = 'duel'; return; }
      // The aviary needs a brief with named voids to have anything to resolve.
      if (!(N.Brief.BRIEFS[St.briefKey] && N.Brief.BRIEFS[St.briefKey].voids)) St.briefKey = 'atlantis';
    }
    St.lane = 0;
    reset();
  }

  function reset() {
    St.running = false;
    if (St.mode === 'duel') St.arena = new N.Arena(St.briefKey);
    else St.aviary = new E.Aviary(St.briefKey);
    St.lastKey = '';
    hx.clearWall(); hx.clearRounds();
    hx.say('SYSTEM', St.mode === 'duel'
      ? 'two doctrines · one brief · one catalogue'
      : 'three beaks · one brief · one gene pool', { kind: 'sys' });
    const b = brief();
    hx.say('SYSTEM', 'brief: ' + b.title + ' — ' + b.description, { kind: 'sys' });
    paint();
    redraw(true);
  }
  const brief = () => St.mode === 'duel' ? St.arena.brief : St.aviary.brief;

  /** Only the lane you are looking at renders. */
  async function redraw(force) {
    const L = lane(); if (!L || !St.viewer) return;
    const b = L.get(), key = L.label + ':' + b.scene.places.length + ':' + (b.scene.version || 0);
    if (!force && key === St.lastKey) return;
    St.lastKey = key;
    await U.render(St.viewer, b.scene, hx.el.status, L.label);
  }

  async function step() {
    if (St.mode === 'duel') {
      if (!St.arena || (St.arena.a.settled && St.arena.b.settled)) return false;
      const was = [St.arena.a.trace.length, St.arena.b.trace.length];
      St.arena.step();
      report(was);
      paint();
      await redraw();
      return !(St.arena.a.settled && St.arena.b.settled);
    }
    if (!St.aviary || St.aviary.birds.every(b => b.settled)) return false;
    const was = St.aviary.birds.map(b => b.history.length);
    St.aviary.step();
    report(was);
    paint();
    await redraw();
    return !St.aviary.birds.every(b => b.settled);
  }

  async function run(limit) {
    if (St.running) { St.running = false; return; }
    St.running = true; hx.busy(true); hx.refresh('run');
    let n = 0;
    while (St.running && (limit == null || n++ < limit) && await step()) {
      await new Promise(r => setTimeout(r, 45));
    }
    St.running = false; hx.busy(false); hx.refresh('run');
    await redraw(true);
  }

  /** Every lane's new round, said and carded — the bake-off is the comparison. */
  function report(was) {
    if (St.mode === 'duel') {
      [St.arena.a, St.arena.b].forEach((d, i) => {
        for (let k = was[i]; k < d.trace.length; k++) {
          const r = d.trace[k];
          hx.say(d.doctrine === 'OPERATOR' ? 'OPERATOR' : 'CORRESPONDENCE',
                 r.defect.kind + ' → ' + r.note,
                 { kind: r.reverted ? 'bad' : r.delta > 0 ? 'ok' : 'sys' });
          hx.logRound({
            who: 'ROUND ' + r.round + ' · ' + d.doctrine + (r.reverted ? ' · REVERTED' : ''),
            score: r.after.fidelity + '%', delta: r.delta,
            text: N.Lens.describe(r),
            before: r.before.fidelity + '% · ' + r.before.parts + 'p',
            after: r.after.fidelity + '% · ' + r.after.parts + 'p',
            changed: r.note
          });
        }
      });
      return;
    }
    St.aviary.birds.forEach((b, i) => {
      for (let k = was[i]; k < b.history.length; k++) {
        const hgen = b.history[k], c = hgen.chosen;
        hx.say(b.finch.key.toUpperCase(),
               hgen.void + ' at ' + hgen.cell + ' · ' + hgen.generated + '→' + hgen.survivors +
               '→' + hgen.frontier + (c ? ' · ' + c.claim : ' · nothing committed'),
               { kind: c ? 'ok' : 'warn' });
        hx.logRound({
          who: 'R' + hgen.round + ' · ' + b.finch.name.toUpperCase(),
          score: c ? c.parts : 0, delta: c ? 1 : -1,
          text: c ? c.claim : (hgen.note || 'nothing survived the gates'),
          before: hgen.void, after: hgen.cell,
          changed: hgen.generated + '→' + hgen.survivors + '→' + hgen.frontier +
                   (c && c.champion ? ' · champion on ' + c.champion : '')
        });
      }
    });
  }

  function allRounds() {
    if (St.mode === 'duel' && St.arena) {
      return [...St.arena.a.trace, ...St.arena.b.trace]
        .sort((x, y) => x.round - y.round || (x.doctrine < y.doctrine ? -1 : 1))
        .map(r => ({ label: 'R' + r.round + ' ' + r.doctrine.slice(0, 2), bad: r.reverted,
                     text: r.defect.kind + ' — ' + r.note }));
    }
    if (St.aviary) {
      const rows = [];
      St.aviary.birds.forEach(b => b.history.forEach(hgen => rows.push({ b, h: hgen })));
      rows.sort((x, y) => x.h.round - y.h.round);
      return rows.map(({ b, h: g }) => ({ label: 'R' + g.round + ' ' + b.finch.key.slice(0, 3),
        bad: !g.chosen, text: b.finch.key + ' · ' + (g.chosen ? g.chosen.claim : 'nothing committed') }));
    }
    return [];
  }

  function paint() {
    const L = lane(); if (!L) return;
    if (St.mode === 'duel') {
      const A = St.arena, sb = A.scoreboard();
      hx.chip('round', 'R' + A.round + '/20');
      hx.chip('lane', L.name + ' ' + sb[L.label].fidelity + '%', 'hot');
      const leads = ['fidelity','economy','variety','soundness'].map(k => sb.leads[k]);
      const op = leads.filter(w => w === 'OPERATOR').length;
      const co = leads.filter(w => w === 'CORRESPONDENCE').length;
      hx.chip('lead', op > co ? 'operator ' + op + '–' + co : co > op ? 'correspond ' + co + '–' + op : 'tied',
              op === co ? '' : 'ok');
    } else {
      const A = St.aviary, board = A.scoreboard();
      hx.chip('round', 'R' + A.round + '/16');
      const mine = board[St.lane] || board[0];
      hx.chip('lane', L.name + ' ' + mine.audit.parts + 'p', 'hot');
      hx.chip('lead', board.map(s => s.audit.parts).join(' / '));
    }
    const rows = allRounds();
    hx.trace(rows, rows.length - 1);
    if (['verdict','tray','ledger'].includes(hx.active)) hx.refresh();
    if (hx.active === 'run') hx.refresh('run');
  }

  // ── panels ─────────────────────────────────────────────────────────────
  function panelRun(el) {
    el.appendChild(hx.cap('mode'));
    el.appendChild(hx.row(
      hx.btn(St.mode === 'duel' ? '● Duel' : 'Duel', () => setMode('duel'), St.mode === 'duel' ? 'go' : ''),
      hx.btn(St.mode === 'aviary' ? '● Aviary' : 'Aviary', () => setMode('aviary'), St.mode === 'aviary' ? 'go' : '')
    ));
    el.appendChild(hx.cap('lane in the bed'));
    el.appendChild(hx.select(lanes().map((L, i) => ({ value: String(i), label: L.name })),
      String(St.lane), v => { St.lane = +v; paint(); redraw(true); }));
    el.appendChild(hx.cap('brief'));
    el.appendChild(hx.select(
      Object.values(N.Brief.BRIEFS)
        .filter(b => St.mode === 'duel' || b.voids)
        .map(b => ({ value: b.key, label: b.title })),
      St.briefKey, v => { St.briefKey = v; reset(); }));
    el.appendChild(H('div', 'hx-empty', brief() ? brief().note || brief().description : ''));
    el.appendChild(hx.row(
      hx.btn('Step', () => step()),
      hx.btn(St.running ? 'Stop' : 'Run 20', () => run(20), St.running ? 'stop' : 'go')
    ));
    el.appendChild(hx.row(
      hx.btn('Run all', () => run(null)),
      hx.btn('Reset', () => reset())
    ));
    el.appendChild(hx.cap('take it away'));
    el.appendChild(hx.row(
      hx.btn('MPD of this lane', () => {
        const L = lane();
        U.download(L.get().toMPD(), 'nabugo-' + St.briefKey + '-' + L.label + '.mpd');
      }),
      hx.btn('Broadcast all', () => {
        let ok = false;
        for (const L of lanes()) {
          const b = L.get();
          ok = N.Bus.emit(b.scene, { name: b.brief.title + ' · ' + L.label, ...b.audit() }, 'nabugo-arena') || ok;
        }
        hx.toast(ok ? 'all lanes broadcast on wag-frank' : 'no BroadcastChannel here');
      })
    ));
    el.appendChild(hx.cap('view'));
    el.appendChild(hx.viewRow(St.viewer));
  }

  function panelVerdict(el) {
    if (St.mode === 'duel') {
      if (!St.arena) return;
      const sb = St.arena.scoreboard();
      el.appendChild(hx.cap('who leads each axis · never summed'));
      for (const k of ['fidelity', 'economy', 'variety', 'soundness']) {
        const w = sb.leads[k];
        el.appendChild(hx.kv(k, w === 'OPERATOR' ? 'operator' : w === 'CORRESPONDENCE' ? 'correspondence' : 'tie',
          w === 'TIE' || !w ? '' : 'ok'));
      }
      el.appendChild(hx.cap('what each one says is wrong'));
      const say = (who, txt) => { const d = H('div', 'hx-round');
        const hd = H('header'); hd.appendChild(H('span', 'n', who)); d.append(hd, H('div', 'd', txt)); return d; };
      el.appendChild(say('OPERATOR', sb.operator.defect.killer));
      el.appendChild(say('CORRESPONDENCE', sb.correspondence.defect.killer));
      return;
    }
    if (!St.aviary) return;
    const board = St.aviary.scoreboard();
    el.appendChild(hx.cap('champion per judge · the frontier, not an average'));
    for (const k of E.Judges.names) {
      let win = '—', top = -1;
      board.forEach(s => { const v = s.scores ? s.scores[k] : -1; if (v > top) { top = v; win = s.finch; } });
      el.appendChild(hx.kv(k, win, top >= 0 ? 'ok' : ''));
    }
    el.appendChild(hx.cap('standing'));
    board.forEach(s => el.appendChild(hx.kv(s.finch, s.audit.parts + ' pieces · ' +
      s.ledger.resolved.length + '/' + (St.aviary.brief.voids || []).length + ' voids')));
  }

  function panelTray(el) {
    const t = H('div', 'hx-tray');
    const scenes = lanes().map((L, i) => ({ scene: L.get().scene, cls: i === 1 ? 'co' : 'op' }));
    if (scenes.length) U.tray(t, scenes);
    el.appendChild(t);
    el.appendChild(hx.cap('zones and voids'));
    const b = brief();
    for (const z of [1, 2, 3, 4]) {
      const zn = b.zones[z];
      el.appendChild(hx.kv('Z' + z + ' · ' + zn.name, 'target ' + b.zoneTargets[z]));
    }
    if (b.voids && b.voids.length) {
      el.appendChild(hx.cap('voids'));
      for (const v of b.voids) el.appendChild(H('span', 'hx-tag', v.name || v.key || String(v)));
    }
  }

  function panelLedger(el) {
    for (const L of lanes()) {
      const a = L.get().audit();
      el.appendChild(hx.cap(L.name));
      el.appendChild(hx.kv('fidelity', a.fidelity + '%'));
      el.appendChild(hx.kv('parts / unique', a.parts + ' / ' + a.unique));
      el.appendChild(hx.kv('collisions', a.collisions, a.collisions ? 'bad' : 'ok'));
      el.appendChild(hx.kv('floating', a.floating, a.floating ? 'bad' : 'ok'));
      el.appendChild(hx.kv('cohesion', Math.round(a.cohesion * 100) + '%',
        a.cohesion >= .9 ? 'ok' : a.cohesion >= .6 ? 'warn' : 'bad'));
      el.appendChild(hx.kv('zones hit', a.zonesHit + ' / 4'));
      el.appendChild(hx.kv('cells / vignettes', a.cells + ' / ' + a.vignettes));
      el.appendChild(hx.kv('span LDU', a.span.join(' × ')));
    }
  }

  // ── commands ───────────────────────────────────────────────────────────
  function command(text) {
    const low = text.trim().toLowerCase();
    let m;
    if ((m = low.match(/^(run|go)(?:\s+(\d+))?$/))) return void run(m[2] ? +m[2] : 20);
    if (/^(step|next)$/.test(low)) return void step();
    if (/^(stop|halt)$/.test(low)) { St.running = false; return void hx.say('SYSTEM', 'stopped', { kind: 'warn' }); }
    if (/^reset$/.test(low)) return void reset();
    if (/^fit$/.test(low)) return void U.frame(St.viewer, 0.72);
    if (/^(duel|aviary)$/.test(low)) return void setMode(low);
    if ((m = low.match(/^lane\s+(\S+)$/))) {
      const i = lanes().findIndex(L => L.label.startsWith(m[1]) || L.name.toLowerCase().startsWith(m[1]));
      if (i < 0) return void hx.say('SYSTEM', 'lanes: ' + lanes().map(L => L.label).join(', '), { kind: 'bad' });
      St.lane = i; paint(); redraw(true);
      return void hx.say('SYSTEM', 'bed shows ' + lanes()[i].name, { kind: 'sys' });
    }
    if ((m = low.match(/^brief\s+(\w+)$/))) {
      const key = Object.keys(N.Brief.BRIEFS).find(k => k.startsWith(m[1]));
      if (!key) return void hx.say('SYSTEM', 'no such brief — ' + Object.keys(N.Brief.BRIEFS).join(', '), { kind: 'bad' });
      St.briefKey = key; return void reset();
    }
    if (/^mpd$/.test(low)) {
      const L = lane();
      return void U.download(L.get().toMPD(), 'nabugo-' + St.briefKey + '-' + L.label + '.mpd');
    }
    if (/^help$/.test(low)) return void hx.say('SYSTEM',
      'run [n] · step · stop · reset · duel · aviary · lane <name> · brief <name> · fit · mpd', { kind: 'sys' });
    hx.say('SYSTEM', 'not a command I know — try help', { kind: 'warn' });
  }
}

global.ArenaBoot = { boot };
})(window);
