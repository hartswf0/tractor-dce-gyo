/**
 * LOOP PAGE — the two script loops, mounted on Hilux.
 *
 * No layout here. Hilux owns the screen; this file only says what goes in the
 * four trays, what gets said on the wall, and what the trace means.
 *
 * The genome lives in the SCRIPT tray because that is the artefact — a
 * mutation is a visible diff in twenty lines, not a silent rearrangement of
 * sixteen hundred placements.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, E = global.NabugoEvo, S = global.NabugoScript,
        L = global.NabugoLoops, U = global.NabugoUI;
  const St = { loop: null, viewer: null, running: false, lastRender: -1, src: L.SEEDS[cfg.seedScript] };
  global.LoopPage = St;

  const hx = Hilux.mount({
    title: cfg.title,
    chips: ['round', 'score', 'parts', 'cat'],
    placeholder: 'run 5 · seed 1234 · assert parts > 1200 · help',
    wallEmpty: cfg.creed,
    traceEmpty: 'no rounds yet',
    panels: [
      { id: 'script', label: 'SCRIPT', glyph: '⌗', title: 'ATORScript · the genome', build: panelScript },
      { id: 'run',    label: 'RUN',    glyph: '▶', title: 'the loop',                build: panelRun },
      { id: 'claims', label: 'CLAIMS', glyph: '✓', title: "the script's own asserts", build: panelClaims },
      { id: 'built',  label: 'BUILT',  glyph: '▦', title: 'what compiled',           build: panelBuilt }
    ],
    onCommand: command,
    onWorld: async (canvasEl, hx) => {
      St.viewer = await U.makeViewer(canvasEl, { background: cfg.background });
      await load();
    },
    onFit: () => U.frame(St.viewer, 0.72),
    onTrace: i => {
      const h = St.loop && St.loop.history[i];
      if (h) hx.say('TRACE', 'round ' + (h.round || i + 1) + ' — ' + describe(h), { kind: 'sys' });
    },
    onResize: () => St.viewer && St.viewer.updateRendererSize()
  });
  St.hx = hx;

  // ── data ───────────────────────────────────────────────────────────────
  async function load() {
    try {
      const cm = await N.Catalog.load('./nabugo-parts.json');
      const pm = await E.Ports.load('./nabugo-ports.json');
      hx.chip('cat', (cm.count / 1000).toFixed(1) + 'k parts', 'ok');
      hx.say('SYSTEM', cm.count.toLocaleString() + ' indexed parts · ' +
             pm.ports.toLocaleString() + ' extracted stud ports', { kind: 'sys' });
    } catch (err) {
      hx.chip('cat', 'no catalogue', 'bad');
      hx.say('SYSTEM', 'Serve this page over HTTP — it needs its data files.', { kind: 'bad' });
      return;
    }
    if (N.Bus.connect(cfg.source)) hx.say('SYSTEM', 'bus wag-frank connected', { kind: 'sys' });
    make();
  }

  function make() {
    St.loop = cfg.kind === 'forager'
      ? new L.Forager({ src: St.src, maxRounds: 40, seed: cfg.seed })
      : new L.Scriptorium({ src: St.src, size: 5, maxRounds: 24, seed: cfg.seed });
    St.lastRender = -1;
    hx.clearWall();
    hx.say('SYSTEM', cfg.creed, { kind: 'sys' });
    seedCompile();
    paint();
  }

  /** Show what the seed programme already describes, before anyone presses anything. */
  function seedCompile() {
    const prog = S.parse(St.src);
    if (prog.errors.length) {
      prog.errors.forEach(e => hx.say('PARSE', 'line ' + e.line + ' — ' + e.message, { kind: 'bad' }));
      return null;
    }
    const r = S.compile(prog, {});
    St.seed = r;
    render(r.scene);
    hx.say('COMPILER', r.audit.parts.toLocaleString() + ' pieces from ' +
           prog.steps.length + ' statements · ' + r.graph.length + ' modules',
           { kind: r.audit.collisions || r.audit.floating ? 'warn' : 'ok' });
    return r;
  }

  async function render(scene) {
    if (!St.viewer || !scene) return;
    const n = scene.places.length;
    if (n === St.lastRender) return;
    St.lastRender = n;
    await U.render(St.viewer, scene, hx.el.status, cfg.source);
  }

  // ── the loop ───────────────────────────────────────────────────────────
  async function step() {
    if (!St.loop) return false;
    if (St.loop.settled) { paint(); await render(St.loop.scene()); return false; }
    const rec = St.loop.step();
    if (rec) report(rec);
    paint();
    await render(St.loop.scene());
    return !St.loop.settled;
  }

  async function run(limit) {
    if (St.running) { St.running = false; return; }
    St.running = true;
    hx.refresh('run');
    let n = 0;
    while (St.running && (limit == null || n++ < limit) && await step()) {
      await new Promise(r => setTimeout(r, 55));   // leave the rail tappable mid-run
    }
    St.running = false;
    hx.refresh('run');
    await render(St.loop.scene());
    paint();
  }

  function describe(h) {
    return cfg.kind === 'forager'
      ? (h.move || '') + (h.kept ? ' · kept' : ' · dropped')
      : 'champion ' + h.champion.lineage + ' · ' + h.champion.parts + ' pieces';
  }

  /** Each round becomes a line on the wall, in the voice of whoever did it. */
  function report(h) {
    if (cfg.kind === 'forager') {
      if (h.fail) hx.say('CRITIC', h.fail + ' — ' + h.detail, { kind: 'bad' });
      else hx.say('CRITIC', h.detail, { kind: 'ok' });
      if (h.move) hx.say('FORAGER', h.move + (h.kept ? '' : '  (dropped)'),
                         { kind: h.kept ? 'ok' : 'sys', pre: h.why || '' });
    } else {
      const c = h.champion;
      hx.say('SCRIPTORIUM', 'bred ' + h.bred + ' · frontier ' + h.frontier +
             ' · champion ' + c.lineage + ' at ' + c.parts.toLocaleString() + ' pieces, ' +
             c.height + ' LDU tall (' + c.passed + '/' + c.total + ')',
             { kind: c.passed === c.total ? 'ok' : 'warn' });
      h.offspring.filter(o => o.onFrontier).slice(0, 3).forEach(o =>
        hx.say('LINEAGE', o.lineage + ' ← ' + o.parent + ' · ' + (o.note || '') +
               ' → ' + o.parts + ' pieces', { kind: 'sys' }));
    }
  }

  // ── paint ──────────────────────────────────────────────────────────────
  function paint() {
    const l = St.loop;
    if (!l) return;
    hx.chip('round', 'R' + l.round + (l.settled ? ' · settled' : ''));
    if (cfg.kind === 'forager') {
      const pct = Math.round((l.best ? l.best.score : 0) * 100);
      hx.chip('score', pct + '% satisfied', pct >= 100 ? 'ok' : 'hot');
      const r = l.best ? l.best.r : l.result;
      if (r && r.audit) hx.chip('parts', r.audit.parts.toLocaleString() + 'p');
      if (l.best) St.src = l.best.src;
    } else {
      const c = l.champion;
      if (c) {
        hx.chip('score', c.passed + '/' + c.total + ' · ' + c.lineage,
                c.passed === c.total ? 'ok' : 'hot');
        hx.chip('parts', c.parts.toLocaleString() + 'p');
        St.src = c.src;
      }
    }
    hx.trace(l.history.map((h, i) => ({
      label: 'R' + (h.round || i + 1),
      bad: cfg.kind === 'forager' ? !h.kept : false
    })), l.history.length - 1);
    if (hx.active === 'script' || hx.active === 'claims' || hx.active === 'built') hx.refresh();
    if (hx.active === 'run') hx.refresh('run');
  }

  function current() {
    const l = St.loop;
    if (!l) return St.seed;
    if (cfg.kind === 'forager') return l.best ? l.best.r : (l.result || St.seed);
    return l.champion ? l.champion.r : St.seed;
  }

  // ── trays ──────────────────────────────────────────────────────────────
  function panelScript(el) {
    const ta = Hilux.h('textarea', 'hx-text');
    ta.spellcheck = false; ta.value = St.src;
    ta.addEventListener('input', () => { St.src = ta.value; });
    el.appendChild(ta);
    el.appendChild(hx.row(
      hx.btn('Compile as written', async () => {
        St.src = ta.value;
        const prog = S.parse(St.src);
        if (prog.errors.length) {
          prog.errors.forEach(e => hx.say('PARSE', 'line ' + e.line + ' — ' + e.message, { kind: 'bad' }));
          hx.toast(prog.errors.length + ' parse error(s)');
          return;
        }
        const r = S.compile(prog, {});
        St.seed = r; St.lastRender = -1;
        await render(r.scene);
        hx.say('COMPILER', r.audit.parts.toLocaleString() + ' pieces · ' +
               r.graph.length + ' modules · ' + r.verdicts.filter(v => v.pass).length +
               '/' + r.verdicts.length + ' claims',
               { kind: r.verdicts.every(v => v.pass) ? 'ok' : 'warn' });
        hx.show('claims', { force: true });
      }, 'go'),
      hx.btn('↓ .ator', () => U.download(St.src, cfg.source + '.ator'))
    ));
    el.appendChild(hx.row(
      hx.btn('Mutate', () => {
        const m = S.mutate(St.src, Math.random);
        St.src = m.src; ta.value = m.src;
        hx.say('MUTATION', m.note, { kind: 'hot' });
      }),
      hx.btn('Reset', () => { St.src = L.SEEDS[cfg.seedScript]; ta.value = St.src; make(); })
    ));
  }

  function panelRun(el) {
    el.appendChild(hx.row(
      hx.btn('Step', () => step()),
      hx.btn(St.running ? 'Stop' : cfg.runLabel, () => run(null), St.running ? 'stop' : 'go')
    ));
    el.appendChild(hx.row(
      hx.btn('Run 5', () => run(5)),
      hx.btn('Refit', () => { St.src = L.SEEDS[cfg.seedScript]; make(); })
    ));
    el.appendChild(hx.cap('view'));
    el.appendChild(hx.viewRow(St.viewer));
    el.appendChild(hx.cap('export'));
    el.appendChild(hx.row(
      hx.btn('Download MPD', () => U.download(St.loop.toMPD(), cfg.source + '.mpd')),
      hx.btn('Broadcast', () => hx.toast(
        N.Bus.emit(St.loop.scene(), { name: cfg.title }, cfg.source)
          ? 'broadcast on wag-frank' : 'no BroadcastChannel here'))
    ));
    const l = St.loop;
    if (l) {
      el.appendChild(hx.cap('state'));
      el.appendChild(hx.kv('round', l.round + (l.settled ? ' · settled' : '')));
      if (cfg.kind === 'forager') {
        el.appendChild(hx.kv('satisfied', Math.round((l.best ? l.best.score : 0) * 100) + '%'));
        el.appendChild(hx.kv('hypotheses tried', l.tried.size));
      } else {
        el.appendChild(hx.kv('lineages', l.lineages));
        el.appendChild(hx.kv('frontier', l.population.length));
      }
    }
  }

  function panelClaims(el) {
    const r = current();
    if (!r || !r.verdicts) { el.appendChild(Hilux.h('div', 'hx-empty', 'nothing compiled yet')); return; }
    el.appendChild(hx.cap("the script's own asserts, checked"));
    for (const v of r.verdicts) {
      const row = hx.kv(v.text, v.detail, v.pass ? 'ok' : 'bad');
      hx.pinnable(row, (v.pass ? 'PASS ' : 'FAIL ') + v.text + ' — ' + v.detail);
      el.appendChild(row);
    }
    if (r.probes && r.probes.length) {
      el.appendChild(hx.cap('probes · report, not judge'));
      for (const p of r.probes) {
        const row = hx.kv(p.name, String(p.value));
        hx.pinnable(row, p.name + ': ' + p.value + ' — ' + p.note);
        el.appendChild(row);
      }
    }
  }

  function panelBuilt(el) {
    const r = current();
    if (!r || !r.audit) { el.appendChild(Hilux.h('div', 'hx-empty', 'nothing compiled yet')); return; }
    const a = r.audit;
    el.appendChild(hx.cap('compiled'));
    el.appendChild(hx.kv('pieces', a.parts.toLocaleString()));
    el.appendChild(hx.kv('distinct', a.unique));
    el.appendChild(hx.kv('modules', (r.graph || []).length));
    el.appendChild(hx.kv('compiles', a.compiles ? 'YES' : 'NO', a.compiles ? 'ok' : 'bad'));
    el.appendChild(hx.kv('collisions', a.collisions, a.collisions ? 'bad' : 'ok'));
    el.appendChild(hx.kv('floating', a.floating, a.floating ? 'bad' : 'ok'));
    el.appendChild(hx.kv('span LDU', a.span.join(' × ')));
    if (r.graph && r.graph.length) {
      el.appendChild(hx.cap('what was raised'));
      const by = new Map();
      for (const g of r.graph) {
        const e = by.get(g.module) || { n: 0, parts: 0 };
        e.n++; e.parts += g.parts; by.set(g.module, e);
      }
      [...by.entries()].sort((x, y) => y[1].parts - x[1].parts)
        .forEach(([m, e]) => el.appendChild(hx.kv(m + ' ×' + e.n, e.parts)));
    }
  }

  // ── the composer ───────────────────────────────────────────────────────
  function command(text) {
    const [verb, ...rest] = text.trim().split(/\s+/);
    const v = verb.toLowerCase();
    const arg = rest.join(' ');
    if (v === 'run')      return run(Number(arg) || null);
    if (v === 'step')     return step();
    if (v === 'stop')     { St.running = false; return hx.say('SYSTEM', 'stopped', { kind: 'sys' }); }
    if (v === 'reset')    { St.src = L.SEEDS[cfg.seedScript]; return make(); }
    if (v === 'mutate')   { const m = S.mutate(St.src, Math.random); St.src = m.src;
                            hx.refresh('script'); return hx.say('MUTATION', m.note, { kind: 'hot' }); }
    if (v === 'seed')     { St.src = St.src.replace(/^SEED .*/m, 'SEED ' + (Number(arg) || 1));
                            hx.refresh('script'); return hx.say('SYSTEM', 'seed ' + arg, { kind: 'sys' }); }
    if (v === 'mpd')      { U.download(St.loop.toMPD(), cfg.source + '.mpd'); return hx.toast('downloaded'); }
    if (v === 'fit')      return U.frame(St.viewer, 0.72);
    if (v === 'help' || v === '?')
      return hx.say('SYSTEM', 'run [n] · step · stop · reset · mutate · seed <n> · mpd · fit · ' +
                    'anything else is appended to the script as a line', { kind: 'sys' });
    // Anything that parses as ATORScript is appended to the programme.
    const probe = global.NabugoScript.parse(text);
    if (!probe.errors.length && probe.steps.length) {
      St.src = St.src.replace(/\n(ASSERT|PROBE)/, '\n' + text + '\n$1');
      hx.refresh('script');
      return hx.say('SCRIPT', 'appended: ' + text, { kind: 'ok' });
    }
    hx.say('SYSTEM', 'not a command and not a valid statement — try `help`', { kind: 'bad' });
  }
}
global.LoopBoot = boot;
})(window);
