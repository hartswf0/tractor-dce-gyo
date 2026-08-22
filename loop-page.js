/**
 * LOOP PAGE — driving surface for the two script loops.
 *
 * The thing worth showing here is the genome itself. Both pages put the live
 * ATORScript on screen, because that is what the loop is actually editing —
 * a mutation is a visible diff in a twenty-line programme, not a silent
 * rearrangement of fifteen hundred placements.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, E = global.NabugoEvo, M = global.NabugoModules,
        S = global.NabugoScript, L = global.NabugoLoops, U = global.NabugoUI, $ = U.$;
  const St = { loop: null, viewer: null, running: false, lastRender: -1 };
  global.LoopPage = St;

  $('creed').textContent = cfg.creed;

  try {
    const cm = await N.Catalog.load('./nabugo-parts.json');
    const pm = await E.Ports.load('./nabugo-ports.json');
    $('chipCat').textContent = cm.count.toLocaleString() + ' parts · ' + pm.ports.toLocaleString() + ' ports';
    $('chipCat').className = 'chip live';
  } catch (e) {
    $('chipCat').textContent = 'catalogue failed'; $('chipCat').className = 'chip dead';
    U.toast('Serve over HTTP — this page needs its data files'); return;
  }
  if (N.Bus.connect(cfg.source)) { $('chipBus').textContent = 'Bus wag-frank'; $('chipBus').className = 'chip live'; }
  else $('chipBus').textContent = 'Bus n/a';

  try { St.viewer = await U.makeViewer($('canvas'), { background: cfg.background }); }
  catch (e) { $('status').textContent = 'viewer failed: ' + e.message; }

  $('script').value = L.SEEDS[cfg.seedScript];

  function make() {
    const src = $('script').value;
    St.loop = cfg.kind === 'forager'
      ? new L.Forager({ src, maxRounds: 40, seed: cfg.seed })
      : new L.Scriptorium({ src, size: 5, maxRounds: 24, seed: cfg.seed });
    St.lastRender = -1;
    // Compile the seed programme straight away. Opening on an empty viewport
    // and "0 pieces" reads as broken; the script already describes a building,
    // so show the building it describes before anyone presses anything.
    try {
      const prog = S.parse(src);
      if (!prog.errors.length) {
        const r = S.compile(prog, {});
        showAudit(r); showClaims(r);
        U.render(St.viewer, r.scene, $('status'), cfg.source);
        St.lastRender = r.scene.places.length;
      }
    } catch (e) { console.warn('[loop] seed compile failed', e); }
    paint();
  }

  async function render(force) {
    const sc = St.loop.scene();
    const n = sc.places.length;
    if (!force && n === St.lastRender) return;
    St.lastRender = n;
    await U.render(St.viewer, sc, $('status'), cfg.source);
  }

  async function step() {
    if (!St.loop) return false;
    if (St.loop.settled) { paint(); await render(true); return false; }
    St.loop.step();
    paint();
    await render();
    return !St.loop.settled;
  }

  async function run() {
    if (St.running) { St.running = false; return; }
    St.running = true;
    $('btnRun').textContent = 'Stop'; $('btnRun').classList.add('stop');
    while (St.running && await step()) { await new Promise(r => setTimeout(r, 20)); }
    St.running = false;
    $('btnRun').textContent = cfg.runLabel; $('btnRun').classList.remove('stop');
    await render(true);
  }

  function paint() {
    return cfg.kind === 'forager' ? paintForager() : paintScriptorium();
  }

  function paintForager() {
    const f = St.loop, r = f.best ? f.best.r : f.result;
    $('chipRound').textContent = 'Round ' + f.round + (f.settled ? ' · settled' : '');
    const pct = Math.round((f.best ? f.best.score : 0) * 100);
    $('chipScore').textContent = pct + '% satisfied';
    $('progress').style.width = pct + '%';
    if (r && r.audit) {
      $('chipParts').textContent = r.audit.parts.toLocaleString() + ' pieces';
      $('script').value = f.best ? f.best.src : f.src;
      showAudit(r);
      showClaims(r);
    }
    $('nLog').textContent = f.history.length;
    $('log').innerHTML = f.history.length ? f.history.slice().reverse().map(h =>
      '<div class="rnd' + (h.kept ? ' kept' : '') + '">' +
        '<div class="rnd-head"><b>R' + h.round + '</b>' +
          '<span class="sc">' + h.score + '%</span>' +
          '<span>' + h.passed + '/' + h.total + '</span>' +
          '<span>' + h.parts + 'p · ' + h.modules + 'm</span>' +
          (h.kept ? '<span class="keep">KEPT</span>' : '<span class="drop">dropped</span>') + '</div>' +
        (h.fail ? '<div class="fail">' + U.esc(h.fail) + ' — ' + U.esc(h.detail) + '</div>' : '') +
        '<div class="move">' + U.esc(h.move || '') + '</div>' +
        (h.why ? '<div class="why">' + U.esc(h.why) + '</div>' : '') +
      '</div>').join('')
      : '<div class="muted">No rounds. The forager reads the loudest failing ASSERT, ' +
        'forms one hypothesis about the gene pool, and tries it.</div>';
  }

  function paintScriptorium() {
    const s = St.loop, c = s.champion;
    $('chipRound').textContent = 'Round ' + s.round + (s.settled ? ' · settled' : '');
    if (c) {
      $('chipScore').textContent = c.passed + '/' + c.total + ' asserts · ' + c.lineage;
      $('progress').style.width = Math.round(100 * c.passed / Math.max(1, c.total)) + '%';
      $('chipParts').textContent = c.parts.toLocaleString() + ' pieces';
      $('script').value = c.src;
      showAudit(c.r);
      showClaims(c.r);
      $('traits').innerHTML = Object.entries(c.traits).map(([k, v]) =>
        '<div class="axis"><span>' + k + '</span><i style="width:' + Math.round(v * 100) + '%"></i>' +
        '<b>' + v.toFixed(2) + '</b></div>').join('');
    }
    $('nLog').textContent = s.history.length;
    $('log').innerHTML = s.history.length ? s.history.slice().reverse().map(h =>
      '<div class="rnd kept">' +
        '<div class="rnd-head"><b>R' + h.round + '</b>' +
          '<span>bred ' + h.bred + '</span><span>frontier ' + h.frontier + '</span>' +
          '<span class="keep">' + h.champion.lineage + '</span>' +
          '<span>' + h.champion.parts + 'p · ' + h.champion.height + 'h</span></div>' +
        h.offspring.map(o => '<div class="child' + (o.onFrontier ? ' on' : '') + '">' +
          '<span class="lin">' + o.lineage + '←' + o.parent + '</span>' +
          '<span class="note">' + U.esc(o.note || '') + '</span>' +
          '<span class="p">' + o.parts + 'p ' + o.passed + '/' + o.total + '</span></div>').join('') +
      '</div>').join('')
      : '<div class="muted">No generations. Each round breeds mutations and crossings of the ' +
        'programme, compiles every one, and keeps a Pareto frontier.</div>';
  }

  function showAudit(r) {
    if (!r || !r.audit) return;
    const a = r.audit;
    $('audit').innerHTML =
      kv('pieces', a.parts.toLocaleString()) + kv('distinct', a.unique) +
      kv('modules', (r.graph || []).length) +
      kv('compiles', a.compiles ? 'YES' : 'NO', a.compiles ? 'ok' : 'bad') +
      kv('collisions', a.collisions, a.collisions ? 'bad' : 'ok') +
      kv('floating', a.floating, a.floating ? 'bad' : 'ok') +
      kv('span LDU', a.span.join(' × '));
  }

  function showClaims(r) {
    if (!r || !r.verdicts) return;
    $('claims').innerHTML =
      r.verdicts.map(v => '<div class="claim ' + (v.pass ? 'pass' : 'fail') + '">' +
        '<span class="t">' + U.esc(v.text) + '</span>' +
        '<span class="d">' + U.esc(v.detail) + '</span></div>').join('') +
      (r.probes || []).map(p => '<div class="claim probe">' +
        '<span class="t">' + U.esc(p.name) + '</span>' +
        '<span class="d">' + U.esc(String(p.value)) + ' — ' + U.esc(p.note) + '</span></div>').join('');
  }

  const kv = (k, v, cls) => '<div class="kv"><span>' + k + '</span><b' +
    (cls ? ' class="' + cls + '"' : '') + '>' + v + '</b></div>';

  $('btnStep').addEventListener('click', step);
  $('btnRun').addEventListener('click', run);
  $('btnReset').addEventListener('click', () => { St.running = false; $('script').value = L.SEEDS[cfg.seedScript]; make(); });
  $('btnCompile').addEventListener('click', async () => {
    // Run whatever is in the box, as written. The script is the artefact.
    const prog = S.parse($('script').value);
    if (prog.errors.length) {
      $('claims').innerHTML = prog.errors.map(e =>
        '<div class="claim fail"><span class="t">line ' + e.line + '</span>' +
        '<span class="d">' + U.esc(e.message) + '</span></div>').join('');
      U.toast(prog.errors.length + ' parse error(s)');
      return;
    }
    const r = S.compile(prog, {});
    showAudit(r); showClaims(r);
    await U.render(St.viewer, r.scene, $('status'), cfg.source);
    U.toast(r.audit.parts + ' pieces from ' + prog.steps.length + ' statements');
  });
  $('btnFit').addEventListener('click', () => U.frame(St.viewer, 0.72));
  let e = true, g = true, sp = false;
  $('btnEdges').addEventListener('click', () => St.viewer && St.viewer.setDiagnostics({ showEdges: (e = !e) }));
  $('btnGrid').addEventListener('click',  () => St.viewer && St.viewer.setDiagnostics({ grid: (g = !g) }));
  $('btnSpin').addEventListener('click',  () => St.viewer && St.viewer.setAutoSpin(sp = !sp));
  $('btnDl').addEventListener('click', () => U.download(St.loop.toMPD(), cfg.source + '.mpd'));
  $('btnDlScript').addEventListener('click', () => U.download($('script').value, cfg.source + '.ator'));
  $('btnBroadcast').addEventListener('click', () =>
    U.toast(N.Bus.emit(St.loop.scene(), { name: cfg.title }, cfg.source)
      ? 'Broadcast on wag-frank' : 'No BroadcastChannel in this browser'));

  make();
}
global.LoopBoot = boot;
})(window);
