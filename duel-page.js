/**
 * DUEL PAGE — the two duelling doctrines, mounted on Hilux.
 *
 * OPERATOR and CORRESPONDENCE were the last two pages still on the old three
 * column layout: 250px of controls, a squeezed viewport, 320px of trace, and
 * at phone width all three stacked to about 130vh of screen inside 100vh.
 * They run the same engine (N.Doctrine) with different creeds, so they get the
 * same bootstrap and differ only in what their cards say.
 *
 * The round card is the point of both doctrines and it is what the roots put
 * on screen: what was accused, what was done about it, and what the build was
 * before and after. OPERATOR adds the blast radius; CORRESPONDENCE adds the
 * scout → critic → builder chain.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, U = global.NabugoUI;
  const H = Hilux.h;
  const St = { d: null, viewer: null, running: false, briefKey: cfg.brief || 'theseus' };
  global.DuelPage = St;
  const isOp = cfg.doctrine === 'OPERATOR';

  const hx = Hilux.mount({
    title: cfg.title,
    chips: ['round', 'fid', 'parts', 'cat'],
    placeholder: 'run · step · brief cave · mpd · help',
    wallEmpty: cfg.creed,
    traceEmpty: 'no rounds yet',
    rounds: true,
    panels: [
      { id: 'run',    label: 'RUN',    glyph: '▶', title: cfg.creed,            build: panelRun },
      { id: 'scan',   label: isOp ? 'SCAN' : 'ECONOMY', glyph: isOp ? '⌾' : '¤',
        title: isOp ? 'registered scan · measured, not inferred' : 'what the parts are carrying',
        build: panelScan },
      { id: 'tray',   label: 'TRAY',   glyph: '⊞', title: 'the 9×9 · where the build actually is', build: panelTray },
      { id: 'ledger', label: 'LEDGER', glyph: '≣', title: 'the audit',          build: panelLedger }
    ],
    onCommand: command,
    onWorld: async (canvasEl) => {
      St.viewer = await U.makeViewer(canvasEl, { background: cfg.background });
      await load();
    },
    onFit: () => U.frame(St.viewer, 0.72),
    onTrace: i => {
      const r = St.d && St.d.trace[i];
      if (r) hx.say('TRACE', 'round ' + r.round + ' · ' + r.defect.kind + ' — ' + r.note,
                    { kind: r.reverted ? 'warn' : 'sys' });
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
    if (N.Bus.connect(cfg.source)) hx.say('SYSTEM', 'bus wag-frank connected', { kind: 'sys' });
    reset();
  }

  function reset() {
    St.running = false;
    St.d = new N.Doctrine(cfg.doctrine, N.Brief.BRIEFS[St.briefKey]);
    hx.clearWall(); hx.clearRounds();
    hx.say('SYSTEM', cfg.creed, { kind: 'sys' });
    hx.say('SYSTEM', 'brief: ' + St.d.brief.title + ' — ' + St.d.brief.description, { kind: 'sys' });
    paint();
    U.render(St.viewer, St.d.scene, hx.el.status, cfg.source);
  }

  async function step() {
    if (!St.d || St.d.settled) return false;
    St.d.step();
    const r = St.d.trace[St.d.trace.length - 1];
    if (r) report(r);
    paint();
    await U.render(St.viewer, St.d.scene, hx.el.status, cfg.source);
    return !St.d.settled;
  }

  async function run(limit) {
    if (St.running) { St.running = false; return; }
    St.running = true; hx.refresh('run'); hx.busy(true);
    let n = 0;
    while (St.running && (limit == null || n++ < limit) && await step()) {
      await new Promise(r => setTimeout(r, 45));
    }
    St.running = false; hx.busy(false); hx.refresh('run');
  }

  /** One round, said out loud and carded. */
  function report(r) {
    const verdict = N.Lens.describe(r);
    if (isOp) {
      hx.say('SCAN', r.defect.kind + ' — ' + r.defect.killer, { kind: 'warn' });
      hx.say('OPERATOR', r.note + '  (+' + r.added.length + ' −' + r.removed.length + ')',
             { kind: r.reverted ? 'bad' : r.delta > 0 ? 'ok' : 'sys' });
      if (r.reverted) hx.say('REVERT', 'regression — the gesture was taken back', { kind: 'bad' });
    } else {
      const zone = r.defect.zone && St.d.brief.zones[r.defect.zone]
        ? St.d.brief.zones[r.defect.zone].name : 'the whole tray';
      hx.say('SCOUT', zone, { kind: 'sys' });
      hx.say('CRITIC', verdict, { kind: 'warn' });
      hx.say('BUILDER', r.note, { kind: r.delta > 0 ? 'ok' : 'sys' });
      if (r.commitment) hx.say('COMMITMENT', r.commitment, { kind: 'warn' });
    }
    const card = hx.logRound({
      who: 'ROUND ' + r.round + ' · ' + (isOp ? 'OPERATOR' : 'CORRESPONDENCE') +
           (r.reverted ? ' · REVERTED' : ''),
      score: r.after.fidelity + '%', delta: r.delta,
      text: verdict,
      before: r.before.fidelity + '% · ' + r.before.parts + 'p',
      after: r.after.fidelity + '% · ' + r.after.parts + 'p',
      changed: r.note,
      decorate: card => card.appendChild(isOp ? blastBar(r) : chain(r))
    });
  }

  /** OPERATOR's own metric: how much of the world each gesture disturbed. */
  function blastBar(r) {
    const total = Math.max(1, r.added.length + r.removed.length);
    const b = H('div', 'hx-blast'), bar = H('div', 'bar');
    const add = H('i', 'add'), rm = H('i', 'rm');
    add.style.width = (100 * r.added.length / total) + '%';
    rm.style.width = (100 * r.removed.length / total) + '%';
    bar.append(add, rm);
    b.append(bar, H('span', '', '+' + r.added.length + ' −' + r.removed.length +
                    ' · blast ' + r.blast));
    return b;
  }

  /** CORRESPONDENCE's own shape: where to look, what is wrong, what was done. */
  function chain(r) {
    const zone = r.defect.zone && St.d.brief.zones[r.defect.zone]
      ? St.d.brief.zones[r.defect.zone].name : 'the whole tray';
    const c = H('div', 'hx-chain');
    const link = (cls, who, said, kill) => {
      const l = H('div', 'link ' + cls);
      l.append(H('div', 'who', who), H('div', 'said' + (kill ? ' kill' : ''), said));
      return l;
    };
    c.appendChild(link('scout', 'Scout · where to look', zone));
    c.appendChild(link('critic', 'Critic · ' + r.defect.kind, N.Lens.describe(r), true));
    c.appendChild(link('builder', 'Builder · one gesture', r.note));
    if (r.commitment) c.appendChild(link('', 'Commitment · the accusation survived twice', r.commitment));
    return c;
  }

  function paint() {
    const d = St.d; if (!d) return;
    const a = d.audit();
    hx.chip('round', 'R' + d.round + '/20' + (d.settled ? ' · settled' : ''));
    hx.chip('fid', a.fidelity + '% fidelity', a.fidelity >= 70 ? 'ok' : 'hot');
    hx.chip('parts', a.parts + ' parts', a.collisions || a.floating ? 'bad' : '');
    hx.trace(d.trace.map(r => ({ label: 'R' + r.round + ' ' + r.defect.kind, bad: r.reverted })),
             d.trace.length - 1);
    if (['scan', 'tray', 'ledger'].includes(hx.active)) hx.refresh();
    if (hx.active === 'run') hx.refresh('run');
    if (hx.active === 'rounds') hx.refresh('rounds');
  }

  // ── panels ─────────────────────────────────────────────────────────────
  function panelRun(el) {
    el.appendChild(hx.cap('brief'));
    el.appendChild(hx.select(
      Object.values(N.Brief.BRIEFS).map(b => ({ value: b.key, label: b.title })),
      St.briefKey, v => { St.briefKey = v; reset(); }));
    el.appendChild(H('div', 'hx-empty', St.d ? St.d.brief.description : ''));
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
      hx.btn('MPD', () => U.download(St.d.toMPD(), cfg.source + '-' + St.briefKey + '.mpd')),
      hx.btn('Broadcast', () => {
        const a = St.d.audit();
        hx.toast(N.Bus.emit(St.d.scene, { name: St.d.brief.title + ' · ' + cfg.doctrine, ...a }, cfg.source)
          ? 'broadcast on wag-frank' : 'no BroadcastChannel here');
      })
    ));
    el.appendChild(hx.cap('view'));
    el.appendChild(hx.viewRow(St.viewer));
  }

  function panelScan(el) {
    const d = St.d; if (!d) return void el.appendChild(H('div', 'hx-empty', 'nothing yet'));
    const a = d.audit();
    if (isOp) {
      el.appendChild(hx.kv('WORLD_TRUE objects', a.parts));
      el.appendChild(hx.kv('distinct parts', a.unique));
      el.appendChild(hx.kv('interpenetrations', a.collisions, a.collisions ? 'bad' : 'ok'));
      el.appendChild(hx.kv('unsupported', a.floating, a.floating ? 'bad' : 'ok'));
      el.appendChild(hx.kv('cluster cohesion', Math.round(a.cohesion * 100) + '%',
        a.cohesion >= .9 ? 'ok' : a.cohesion >= .6 ? 'warn' : 'bad'));
      el.appendChild(hx.kv('separate clusters', a.components));
      el.appendChild(hx.kv('worst penetration', a.worstPen + ' LDU³', a.worstPen ? 'bad' : 'ok'));
      el.appendChild(hx.kv('last blast radius', d.trace.length ? d.trace[d.trace.length - 1].blast : 0));
      el.appendChild(hx.kv('reverted gestures', d.trace.filter(r => r.reverted).length,
        d.trace.some(r => r.reverted) ? 'warn' : 'ok'));
      el.appendChild(hx.cap('the current accusation'));
      el.appendChild(H('div', 'hx-empty', a.defect.kind + ' — ' + a.defect.killer));
    } else {
      const big = H('div', 'hx-round');
      const hd = H('header');
      hd.append(H('span', 'n', 'parts carrying the whole brief'), H('span', 's', String(a.parts)));
      big.append(hd, H('div', 'd', a.parts
        ? a.fidelity + '% of the brief told with ' + a.parts + ' part' + (a.parts === 1 ? '' : 's') +
          ' across ' + a.cells + ' cell' + (a.cells === 1 ? '' : 's') +
          '. Every part left out is one the viewer supplies.'
        : 'Nothing placed yet.'));
      el.appendChild(big);
      el.appendChild(hx.cap('the current accusation'));
      el.appendChild(H('div', 'hx-empty', a.defect.kind + ' — ' + a.defect.killer));
    }
  }

  function panelTray(el) {
    const t = H('div', 'hx-tray');
    if (St.d) U.tray(t, [{ scene: St.d.scene, cls: isOp ? 'op' : 'co' }]);
    el.appendChild(t);
    el.appendChild(hx.cap('zones'));
    for (const z of [1, 2, 3, 4]) {
      const zone = St.d && St.d.brief.zones[z];
      el.appendChild(hx.kv('Z' + z, zone ? zone.name : '—'));
    }
  }

  function panelLedger(el) {
    const d = St.d; if (!d) return void el.appendChild(H('div', 'hx-empty', 'nothing yet'));
    const a = d.audit();
    const m = H('div', 'hx-meter'); const i = H('i'); i.style.width = a.fidelity + '%'; m.appendChild(i);
    el.appendChild(hx.kv('fidelity', a.fidelity + '%'));
    el.appendChild(m);
    el.appendChild(hx.kv('parts / unique', a.parts + ' / ' + a.unique));
    el.appendChild(hx.kv('compiles', a.compiles ? 'YES' : 'NO', a.compiles ? 'ok' : 'bad'));
    el.appendChild(hx.kv('collisions', a.collisions, a.collisions ? 'bad' : 'ok'));
    el.appendChild(hx.kv('floating', a.floating, a.floating ? 'bad' : 'ok'));
    el.appendChild(hx.kv('zones hit', a.zonesHit + ' / 4'));
    el.appendChild(hx.kv('cells', a.cells));
    el.appendChild(hx.kv('vignettes', a.vignettes));
    el.appendChild(hx.kv('span LDU', a.span.join(' × ')));
    el.appendChild(hx.kv('strategies', a.strategies.join(', ') || '—'));
  }

  // ── commands ───────────────────────────────────────────────────────────
  function command(text) {
    const t = text.trim(), low = t.toLowerCase();
    let m;
    if ((m = low.match(/^(run|go)(?:\s+(\d+))?$/))) return void run(m[2] ? +m[2] : 20);
    if (/^(step|next)$/.test(low)) return void step();
    if (/^(stop|halt)$/.test(low)) { St.running = false; return void hx.say('SYSTEM', 'stopped', { kind: 'warn' }); }
    if (/^reset$/.test(low)) return void reset();
    if (/^fit$/.test(low)) return void U.frame(St.viewer, 0.72);
    if ((m = low.match(/^brief\s+(\w+)$/))) {
      const key = Object.keys(N.Brief.BRIEFS).find(k => k.startsWith(m[1]));
      if (!key) return void hx.say('SYSTEM', 'no such brief — ' + Object.keys(N.Brief.BRIEFS).join(', '), { kind: 'bad' });
      St.briefKey = key; return void reset();
    }
    if (/^mpd$/.test(low)) return void U.download(St.d.toMPD(), cfg.source + '-' + St.briefKey + '.mpd');
    if (/^help$/.test(low)) return void hx.say('SYSTEM',
      'run [n] · step · stop · reset · brief <name> · fit · mpd', { kind: 'sys' });
    hx.say('SYSTEM', 'not a command I know — try help', { kind: 'warn' });
  }
}

global.DuelBoot = { boot };
})(window);
