/**
 * FINCH PAGE — one beak, mounted on Hilux.
 *
 * The wall carries the generation-by-generation account: what was drawn, what
 * the compiler refused and why, which survivor took the cell and on which axis
 * it was champion. That reads far better as a running discourse than it ever
 * did as a third column.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, E = global.NabugoEvo, U = global.NabugoUI;
  const St = { pop: null, viewer: null, running: false, briefKey: cfg.brief || 'atlantis', lastRender: -1 };
  global.FinchPage = St;
  const finch = E.FINCHES[cfg.finch];

  const hx = Hilux.mount({
    title: finch.name,
    chips: ['round', 'parts', 'viable', 'cat'],
    placeholder: 'run · step · brief cave · mpd · help',
    wallEmpty: finch.strategy,
    traceEmpty: 'no generations yet',
    rounds: true,
    panels: [
      { id: 'run',     label: 'RUN',     glyph: '▶', title: finch.latin + ' · ' + finch.beak, build: panelRun },
      { id: 'voids',   label: 'VOIDS',   glyph: '○', title: 'void ledger · not a percentage', build: panelVoids },
      { id: 'archive', label: 'ARCHIVE', glyph: '⧉', title: 'losers are kept',                build: panelArchive },
      { id: 'built',   label: 'BUILT',   glyph: '▦', title: 'the standing build',             build: panelBuilt }
    ],
    onCommand: command,
    onWorld: async (canvasEl, hx) => {
      St.viewer = await U.makeViewer(canvasEl, { background: cfg.background });
      await load();
    },
    onFit: () => U.frame(St.viewer, 0.72),
    onTrace: i => {
      const h = St.pop && St.pop.history[i];
      if (h) hx.say('TRACE', 'round ' + h.round + ' · ' + h.void + ' at ' + h.cell +
                    (h.chosen ? ' — ' + h.chosen.claim : ' — nothing committed'), { kind: 'sys' });
    },
    onResize: () => St.viewer && St.viewer.updateRendererSize()
  });
  St.hx = hx;

  async function load() {
    try {
      const cm = await N.Catalog.load('./nabugo-parts.json');
      const pm = await E.Ports.load('./nabugo-ports.json');
      hx.chip('cat', (cm.count / 1000).toFixed(1) + 'k parts', 'ok');
      hx.say('SYSTEM', cm.count.toLocaleString() + ' parts · ' + pm.ports.toLocaleString() +
             ' ports · beak: ' + finch.beak, { kind: 'sys' });
    } catch (err) {
      hx.chip('cat', 'no catalogue', 'bad');
      hx.say('SYSTEM', 'Serve over HTTP — this page needs its data files.', { kind: 'bad' });
      return;
    }
    if (N.Bus.connect('finch-' + cfg.finch)) hx.say('SYSTEM', 'bus wag-frank connected', { kind: 'sys' });
    reset();
  }

  function reset() {
    St.pop = new E.Population(cfg.finch, N.Brief.BRIEFS[St.briefKey]);
    St.lastRender = -1;
    hx.clearWall(); hx.clearRounds();
    hx.say('SYSTEM', finch.strategy, { kind: 'sys' });
    hx.say('SYSTEM', 'brief: ' + St.pop.brief.title, { kind: 'sys' });
    paint();
    render();
  }

  async function render() {
    if (!St.viewer || !St.pop) return;
    const n = St.pop.scene.places.length;
    if (n === St.lastRender) return;
    St.lastRender = n;
    await U.render(St.viewer, St.pop.scene, hx.el.status, cfg.finch);
  }

  async function step() {
    if (!St.pop || St.pop.settled) return false;
    const before = St.pop.scene.places.length;
    const rec = St.pop.step();
    if (rec) report(rec, before);
    paint();
    await render();
    return !St.pop.settled;
  }

  async function run(limit) {
    if (St.running) { St.running = false; return; }
    St.running = true; hx.refresh('run');
    let n = 0;
    while (St.running && (limit == null || n++ < limit) && await step()) {
      await new Promise(r => setTimeout(r, 55));   // leave the rail tappable mid-run
    }
    St.running = false; hx.refresh('run');
    await render();
  }

  function report(r, before) {
    // The card the roots showed: who acted, what it cost, before and after.
    const after = St.pop.scene.places.length;
    hx.logRound({
      who: 'CYCLE ' + r.round + ' · ' + (r.chosen ? 'BUILDER' : 'SCOUT'),
      score: after, delta: after - (before == null ? after : before),
      text: r.chosen ? r.chosen.claim : (r.note || 'nothing survived the gates'),
      before: (before == null ? after : before) + ' pcs',
      after: after + ' pcs',
      changed: r.void + ' at ' + r.cell + ' · ' + r.survivors + '/' + r.generated + ' viable'
    });
    hx.say('SCOUT', r.void + ' at ' + r.cell + ' · zone ' + r.zone, { kind: 'sys' });
    hx.say('COMPILER', r.generated + ' genomes drawn · ' + r.rejected + ' refused by the gates · ' +
           r.survivors + ' viable · ' + r.frontier + ' on the frontier',
           { kind: r.survivors ? 'sys' : 'warn' });
    if (r.chosen) {
      const c = r.chosen;
      hx.say('JUDGES', 'champion on ' + (c.champion || '—') + ' — ' + c.claim +
             ' (' + c.parts + ' pieces)',
             { kind: 'ok',
               pre: c.lineage && c.lineage.length ? c.lineage.join(' → ') : '' });
      if (c.ecologies && c.ecologies.length)
        hx.say('ECOLOGY', c.ecologies.map(e => (E.Ecology.get(e) || {}).name || e).join(' · '), { kind: 'sys' });
    } else if (r.note) {
      hx.say('SYSTEM', r.note, { kind: 'warn' });
    }
    if (r.emergent) hx.say('EMERGENT', r.emergent, { kind: 'warn' });
  }

  function paint() {
    const p = St.pop; if (!p) return;
    const a = p.audit(), arc = p.archive.counts();
    hx.chip('round', 'R' + p.round + '/' + p.maxRounds + (p.settled ? ' · settled' : ''));
    hx.chip('parts', a.parts + ' pieces', a.collisions || a.floating ? 'bad' : 'hot');
    hx.chip('viable', arc.viable + ' viable · ' + arc.novel + ' novel');
    hx.trace(p.history.map(h => ({ label: 'R' + h.round + ' ' + h.void, bad: !h.chosen })),
             p.history.length - 1);
    if (['voids','archive','built'].includes(hx.active)) hx.refresh();
    if (hx.active === 'run') hx.refresh('run');
  }

  function panelRun(el) {
    el.appendChild(hx.cap('brief'));
    el.appendChild(hx.select(
      Object.values(N.Brief.BRIEFS).map(b => ({ value: b.key, label: b.title })),
      St.briefKey, v => { St.briefKey = v; reset(); }));
    el.appendChild(hx.row(
      hx.btn('Step', () => step()),
      hx.btn(St.running ? 'Stop' : 'Run', () => run(null), St.running ? 'stop' : 'go')
    ));
    el.appendChild(hx.row(
      hx.btn('Run 5', () => run(5)),
      hx.btn('Reset', () => { St.running = false; reset(); })
    ));
    el.appendChild(hx.cap('this beak'));
    el.appendChild(hx.kv('composition', Object.entries(finch.composition)
      .map(([k, v]) => k.slice(0, 4) + ' ' + v).join(' ')));
    el.appendChild(hx.kv('migrant / wild', finch.migrantFrom + ' / ' + finch.wild));
    el.appendChild(hx.kv('population', finch.population + ' + ' + finch.mutationsPerRound));
    el.appendChild(hx.kv('operators', finch.ops.join(', ')));
    el.appendChild(hx.cap('view'));
    el.appendChild(hx.viewRow(St.viewer));
    el.appendChild(hx.cap('export'));
    el.appendChild(hx.row(
      hx.btn('Download MPD', () => U.download(St.pop.toMPD(), 'finch-' + cfg.finch + '-' + St.briefKey + '.mpd')),
      hx.btn('Broadcast', () => hx.toast(
        N.Bus.emit(St.pop.scene, { name: finch.name }, 'finch-' + cfg.finch)
          ? 'broadcast on wag-frank' : 'no BroadcastChannel here'))
    ));
  }

  function panelVoids(el) {
    const s = St.pop.ledger.summary();
    const block = (t, list, cls) => { if (!list.length) return;
      el.appendChild(hx.cap(t)); list.forEach(v => el.appendChild(hx.kv(v, t === 'resolved' ? '✓' : '—', cls))); };
    block('resolved', s.resolved, 'ok');
    block('partial', s.partial, 'warn');
    block('unresolved', s.unresolved, 'bad');
    if (s.emergent.length) {
      el.appendChild(hx.cap('emergent'));
      s.emergent.forEach(e => { const d = Hilux.h('div', 'hx-kv');
        d.appendChild(Hilux.h('span', '', e)); hx.pinnable(d, e); el.appendChild(d); });
    }
  }

  function panelArchive(el) {
    const c = St.pop.archive.counts();
    el.appendChild(hx.cap('archives · a rejected genome can mutate and return'));
    Object.entries(c).forEach(([k, v]) =>
      el.appendChild(hx.kv(k, v, k === 'novel' ? 'ok' : k === 'fossil' ? '' : '')));
  }

  function panelBuilt(el) {
    const a = St.pop.audit();
    el.appendChild(hx.cap('standing build'));
    el.appendChild(hx.kv('pieces', a.parts));
    el.appendChild(hx.kv('distinct', a.unique));
    el.appendChild(hx.kv('compiles', a.compiles ? 'YES' : 'NO', a.compiles ? 'ok' : 'bad'));
    el.appendChild(hx.kv('collisions', a.collisions, a.collisions ? 'bad' : 'ok'));
    el.appendChild(hx.kv('floating', a.floating, a.floating ? 'bad' : 'ok'));
    el.appendChild(hx.kv('cohesion', Math.round(a.cohesion * 100) + '%'));
    el.appendChild(hx.kv('zones', a.zonesHit + ' / 4'));
    el.appendChild(hx.kv('cells', a.cells));
    el.appendChild(hx.kv('span LDU', a.span.join(' × ')));
    if (a.strategies.length) {
      el.appendChild(hx.cap('strategies'));
      const d = Hilux.h('div');
      a.strategies.forEach(s => d.appendChild(Hilux.h('span', 'hx-tag', s)));
      el.appendChild(d);
    }
  }

  function command(text) {
    const [verb, ...rest] = text.trim().split(/\s+/);
    const v = verb.toLowerCase(), arg = rest.join(' ');
    if (v === 'run')   return run(Number(arg) || null);
    if (v === 'step')  return step();
    if (v === 'stop')  { St.running = false; return hx.say('SYSTEM', 'stopped', { kind: 'sys' }); }
    if (v === 'reset') { St.running = false; return reset(); }
    if (v === 'brief') { if (N.Brief.BRIEFS[arg]) { St.briefKey = arg; return reset(); }
                         return hx.say('SYSTEM', 'briefs: ' + Object.keys(N.Brief.BRIEFS).join(', '), { kind: 'bad' }); }
    if (v === 'mpd')   { U.download(St.pop.toMPD(), 'finch-' + cfg.finch + '.mpd'); return hx.toast('downloaded'); }
    if (v === 'fit')   return U.frame(St.viewer, 0.72);
    if (v === 'help' || v === '?')
      return hx.say('SYSTEM', 'run [n] · step · stop · reset · brief <key> · mpd · fit', { kind: 'sys' });
    hx.say('SYSTEM', 'unknown — try `help`', { kind: 'bad' });
  }
}
global.FinchBoot = boot;
})(window);
