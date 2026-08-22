/**
 * EXPEDITION PAGE — the three survey vessels, mounted on Hilux.
 *
 * The ship's log is the wall; there is nowhere better for it. Each watch is one
 * line in the voice of whoever stood it, which is what makes a four-hundred
 * watch voyage readable at all.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, E = global.NabugoEvo, M = global.NabugoModules,
        C = global.NabugoCrew, U = global.NabugoUI;
  const St = { exp: null, viewer: null, running: false, lastRender: 0,
               briefKey: cfg.brief || 'atlantis', pieces: cfg.pieces || 1800 };
  global.ExpeditionPage = St;

  const hx = Hilux.mount({
    title: cfg.title,
    chips: ['watch', 'parts', 'ground', 'cat'],
    placeholder: 'run · sail 40 · pieces 2500 · brief ingold · help',
    wallEmpty: cfg.note,
    traceEmpty: 'no watches stood',
    panels: [
      { id: 'orders',   label: 'ORDERS',  glyph: '▶', title: 'orders',            build: panelOrders },
      { id: 'manifest', label: 'WORKS',   glyph: '▦', title: 'the works, so far', build: panelManifest },
      { id: 'voids',    label: 'VOIDS',   glyph: '○', title: 'the void ledger',   build: panelVoids },
      { id: 'palette',  label: 'PALETTE', glyph: '◈', title: 'roles this district is built from', build: panelPalette }
    ],
    onCommand: command,
    onWorld: async (canvasEl, hx) => {
      St.viewer = await U.makeViewer(canvasEl, { background: cfg.background });
      await load();
    },
    onFit: () => U.frame(St.viewer, 0.72),
    onTrace: i => {
      const e = St.exp && St.exp.log[i];
      if (e) hx.say('TRACE', 'watch ' + e.watch + ' · ' + e.who + ' — ' + e.note, { kind: 'sys' });
    },
    onResize: () => St.viewer && St.viewer.updateRendererSize()
  });
  St.hx = hx;

  async function load() {
    try {
      const cm = await N.Catalog.load('./nabugo-parts.json');
      await E.Ports.load('./nabugo-ports.json');
      const st = await C.Stores.load();
      hx.chip('cat', (cm.count / 1000).toFixed(1) + 'k parts', 'ok');
      hx.say('SYSTEM', cm.count.toLocaleString() + ' parts · stores: ' + st.shells +
             ' shells, ' + st.figures + ' figures, ' + st.vessels + ' vessels', { kind: 'sys' });
    } catch (err) {
      hx.chip('cat', 'no catalogue', 'bad');
      hx.say('SYSTEM', 'Serve over HTTP — this page needs its data files.', { kind: 'bad' });
      return;
    }
    if (N.Bus.connect(cfg.source)) hx.say('SYSTEM', 'bus wag-frank connected', { kind: 'sys' });
    refit();
  }

  function refit() {
    St.exp = new C.Expedition({
      name: cfg.title, brief: N.Brief.BRIEFS[St.briefKey], roster: cfg.roster,
      pieces: St.pieces, extent: cfg.extent, maxExtent: cfg.maxExtent,
      maxWatches: cfg.maxWatches || 600, seed: cfg.seed
    });
    if (cfg.colors) St.exp.colors = cfg.colors;
    St.lastRender = 0;
    hx.clearWall();
    hx.say('SYSTEM', cfg.note, { kind: 'sys' });
    hx.say('SYSTEM', 'brief: ' + St.exp.brief.title + ' — ' + St.exp.brief.description, { kind: 'sys' });
    paint();
    render(true);
  }

  async function render(force) {
    if (!St.viewer || !St.exp) return;
    const n = St.exp.site.count;
    if (!force && n - St.lastRender < (cfg.renderEvery || 90)) return;
    St.lastRender = n;
    await U.render(St.viewer, St.exp.scene(), hx.el.status, cfg.source);
  }

  async function watch(force) {
    if (!St.exp || St.exp.settled) return false;
    const e = St.exp.watch();
    if (e) {
      const kind = e.parts > 0 ? 'ok' : /refused|no |error/i.test(e.note) ? 'warn' : 'sys';
      hx.say(e.who.toUpperCase(), (e.parts > 0 ? '+' + e.parts + ' · ' : '') + e.note, { kind });
    }
    paint();
    await render(force);
    return !St.exp.settled;
  }

  async function sail(limit) {
    if (St.running) { St.running = false; return; }
    St.running = true; hx.refresh('orders');
    let n = 0;
    while (St.running && (limit == null || n++ < limit) && await watch()) {
      await new Promise(r => setTimeout(r, n % 4 === 0 ? 45 : 0));
    }
    St.running = false; hx.refresh('orders');
    await render(true);
    paint();
    if (St.exp.settled) hx.say('SYSTEM', 'in port — ' + St.exp.site.count.toLocaleString() +
                               ' pieces over ' + St.exp.watchNo + ' watches', { kind: 'ok' });
  }

  function paint() {
    const x = St.exp; if (!x) return;
    hx.chip('watch', 'W' + x.watchNo + (x.settled ? ' · port' : ''));
    hx.chip('parts', x.site.count.toLocaleString() + ' / ' + x.piecesWanted.toLocaleString(),
            x.site.count >= x.piecesWanted ? 'ok' : 'hot');
    hx.chip('ground', x.site.extent + ' LDU');
    // One dot per watch that actually put something down; a voyage is long and
    // the trace should show the landfalls, not the empty water.
    const marks = x.log.filter(e => e.parts > 0);
    hx.trace(marks.map(e => ({ label: 'W' + e.watch + ' +' + e.parts })), marks.length - 1);
    if (['manifest','voids','palette'].includes(hx.active)) hx.refresh();
    if (hx.active === 'orders') hx.refresh('orders');
  }

  // ── trays ──────────────────────────────────────────────────────────────
  function panelOrders(el) {
    el.appendChild(hx.cap('brief'));
    el.appendChild(hx.select(
      Object.values(N.Brief.BRIEFS).map(b => ({ value: b.key, label: b.title })),
      St.briefKey, v => { St.briefKey = v; refit(); }));
    el.appendChild(hx.cap('pieces wanted'));
    const rng = Hilux.h('input', 'hx-input');
    rng.type = 'range'; rng.min = 200; rng.max = 4000; rng.step = 100; rng.value = St.pieces;
    const lbl = Hilux.h('div', 'hx-kv');
    lbl.append(Hilux.h('span', '', 'target'), Hilux.h('b', '', String(St.pieces)));
    rng.addEventListener('input', () => {
      St.pieces = +rng.value; lbl.lastChild.textContent = rng.value;
      if (St.exp) St.exp.piecesWanted = St.pieces;
    });
    el.append(rng, lbl);
    el.appendChild(hx.row(
      hx.btn(St.running ? 'Heave to' : 'Sail', () => sail(null), St.running ? 'stop' : 'go'),
      hx.btn('Watch', () => watch(true))
    ));
    el.appendChild(hx.row(
      hx.btn('Watch ×20', () => sail(20)),
      hx.btn('Refit', () => { St.running = false; refit(); })
    ));
    el.appendChild(hx.cap('view'));
    el.appendChild(hx.viewRow(St.viewer));
    el.appendChild(hx.cap('export'));
    el.appendChild(hx.row(
      hx.btn('Download MPD', () => U.download(St.exp.toMPD(), cfg.source + '-' + St.briefKey + '.mpd')),
      hx.btn('Broadcast', () => hx.toast(
        N.Bus.emit(St.exp.scene(), { name: cfg.title }, cfg.source)
          ? 'broadcast on wag-frank' : 'no BroadcastChannel here'))
    ));
  }

  function panelManifest(el) {
    const x = St.exp; if (!x) return;
    const man = x.manifest();
    if (!man.length) { el.appendChild(Hilux.h('div', 'hx-empty', 'nothing raised yet')); return; }
    el.appendChild(hx.cap('raised'));
    for (const m of man) {
      const row = hx.kv(m.module + ' ×' + m.n, m.parts);
      hx.pinnable(row, m.module + ' ×' + m.n + ' — ' + m.parts + ' pieces');
      el.appendChild(row);
    }
    el.appendChild(hx.kv('total', man.reduce((s, m) => s + m.parts, 0)));
    const a = x.lastAudit || x.audit();
    el.appendChild(hx.cap('inspector'));
    el.appendChild(hx.kv('distinct', a.unique));
    el.appendChild(hx.kv('compiles', a.compiles ? 'YES' : 'NO', a.compiles ? 'ok' : 'bad'));
    el.appendChild(hx.kv('collisions', a.collisions, a.collisions ? 'bad' : 'ok'));
    el.appendChild(hx.kv('floating', a.floating, a.floating ? 'bad' : 'ok'));
    el.appendChild(hx.kv('span LDU', a.span.join(' × ')));
  }

  function panelVoids(el) {
    const x = St.exp; if (!x) return;
    const s = x.ledger.summary();
    const block = (title, list, cls) => {
      if (!list.length) return;
      el.appendChild(hx.cap(title));
      list.forEach(v => el.appendChild(hx.kv(v, title === 'resolved' ? '✓' : '—', cls)));
    };
    block('resolved', s.resolved, 'ok');
    block('partial', s.partial, 'warn');
    block('unresolved', s.unresolved, 'bad');
    if (s.emergent && s.emergent.length) {
      el.appendChild(hx.cap('emergent · the brief, contradicted'));
      s.emergent.forEach(e => {
        const d = Hilux.h('div', 'hx-kv');
        d.appendChild(Hilux.h('span', '', e));
        hx.pinnable(d, e);
        el.appendChild(d);
      });
    }
  }

  function panelPalette(el) {
    const x = St.exp; if (!x) return;
    if (!x.palette || !x.palette.log.length) {
      el.appendChild(Hilux.h('div', 'hx-empty', 'the quarryman has not drawn yet'));
      return;
    }
    el.appendChild(hx.cap('role → part'));
    x.palette.log.slice(-14).forEach(l => {
      const [role, rest] = l.split(' → ');
      const row = hx.kv(role, rest || '');
      hx.pinnable(row, l);
      el.appendChild(row);
    });
  }

  function command(text) {
    const [verb, ...rest] = text.trim().split(/\s+/);
    const v = verb.toLowerCase(), arg = rest.join(' ');
    // `run` is what everyone types first, whatever the metaphor says.
    if (v === 'sail' || v === 'run' || v === 'go') return sail(Number(arg) || null);
    if (v === 'watch')  return Number(arg) ? sail(Number(arg)) : watch(true);
    if (v === 'stop')   { St.running = false; return hx.say('SYSTEM', 'heaving to', { kind: 'sys' }); }
    if (v === 'refit')  { St.running = false; return refit(); }
    if (v === 'pieces') { St.pieces = Number(arg) || St.pieces;
                          if (St.exp) St.exp.piecesWanted = St.pieces;
                          hx.refresh('orders'); return hx.say('SYSTEM', 'target ' + St.pieces, { kind: 'sys' }); }
    if (v === 'brief')  { if (N.Brief.BRIEFS[arg]) { St.briefKey = arg; return refit(); }
                          return hx.say('SYSTEM', 'briefs: ' + Object.keys(N.Brief.BRIEFS).join(', '), { kind: 'bad' }); }
    if (v === 'mpd')    { U.download(St.exp.toMPD(), cfg.source + '.mpd'); return hx.toast('downloaded'); }
    if (v === 'fit')    return U.frame(St.viewer, 0.72);
    if (v === 'help' || v === '?')
      return hx.say('SYSTEM', 'sail|run [n] · watch [n] · stop · refit · pieces <n> · ' +
                    'brief <key> · mpd · fit', { kind: 'sys' });
    hx.say('SYSTEM', 'unknown — try `help`', { kind: 'bad' });
  }
}
global.ExpeditionBoot = boot;
})(window);
