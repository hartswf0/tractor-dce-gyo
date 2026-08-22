/**
 * FINCH PAGE
 * A single beak, watched closely. The three finch-*.html pages set FINCH_KEY
 * and BRIEF_KEY and hand over; everything they share lives here.
 *
 * What this shows that the arena does not: the whole round, generation by
 * generation. How many genomes were drawn, how many the compiler refused and
 * why, which survivors made the Pareto frontier, which axis each was champion
 * of, and what the archive kept from the ones that lost.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, E = global.NabugoEvo, U = global.NabugoUI, $ = U.$;
  const S = { pop: null, viewer: null, running: false, briefKey: cfg.brief || 'atlantis' };
  global.FinchPage = S;

  const finch = E.FINCHES[cfg.finch];
  $('beak').textContent = finch.beak;
  $('latin').textContent = finch.latin;
  $('strategy').textContent = finch.strategy;

  try {
    const cm = await N.Catalog.load('./nabugo-parts.json');
    const pm = await E.Ports.load('./nabugo-ports.json');
    $('chipCat').textContent = cm.count.toLocaleString() + ' parts · ' + pm.ports.toLocaleString() + ' ports';
    $('chipCat').className = 'chip live';
  } catch (e) {
    $('chipCat').textContent = 'catalogue failed';
    $('chipCat').className = 'chip dead';
    U.toast('Could not load the catalogue — serve this page over HTTP');
    return;
  }

  if (N.Bus.connect('finch-' + cfg.finch)) {
    $('chipBus').textContent = 'Bus wag-frank'; $('chipBus').className = 'chip live';
  } else $('chipBus').textContent = 'Bus n/a';

  try { S.viewer = await U.makeViewer($('canvas'), { background: cfg.background }); }
  catch (e) { $('status').textContent = 'viewer failed: ' + e.message; }

  U.briefOptions($('briefSel'), S.briefKey);
  $('briefSel').addEventListener('change', e => { S.briefKey = e.target.value; reset(); });

  function reset() {
    S.pop = new E.Population(cfg.finch, N.Brief.BRIEFS[S.briefKey]);
    $('briefDesc').textContent = S.pop.brief.description;
    paint();
    U.render(S.viewer, S.pop.scene, $('status'), cfg.finch);
  }

  async function step() {
    if (!S.pop || S.pop.settled) return false;
    S.pop.step();
    paint();
    await U.render(S.viewer, S.pop.scene, $('status'), cfg.finch);
    return !S.pop.settled;
  }

  async function run(n) {
    if (S.running) { S.running = false; return; }
    S.running = true; $('btnRun').textContent = 'Stop'; $('btnRun').classList.add('stop');
    for (let i = 0; i < n && S.running; i++) {
      if (!(await step())) break;
      await new Promise(r => setTimeout(r, 40));
    }
    S.running = false; $('btnRun').textContent = 'Run 16'; $('btnRun').classList.remove('stop');
  }

  function paint() {
    const p = S.pop, a = p.audit(), arc = p.archive.counts(), led = p.ledger;
    U.metrics($('metrics'), a, cfg.cls);
    U.tray($('tray'), [{ scene: p.scene, cls: cfg.cls }]);
    $('chipRound').textContent = 'Round ' + p.round + '/' + p.maxRounds + (p.settled ? ' · settled' : '');
    $('chipParts').textContent = a.parts + ' parts';
    $('chipViable').textContent = arc.viable + ' viable';

    // ---- void ledger, in place of a fidelity percentage --------------------
    const row = (state, list, cls) => list.length
      ? '<div class="ledger-row"><span class="state ' + cls + '">' + state + '</span>' +
        list.map(id => '<span class="vpill">' + U.esc(id) + '</span>').join('') + '</div>' : '';
    const sum = led.summary();
    $('voids').innerHTML =
      row('resolved', sum.resolved, 'ok') +
      row('partial', sum.partial, 'warn') +
      row('unresolved', sum.unresolved, 'bad') ||
      '<div class="muted">no voids yet</div>';

    // ---- the material talking back -----------------------------------------
    $('emergent').innerHTML = led.emergent.length
      ? led.emergent.slice().reverse().map(e =>
          '<div class="emergent"><span class="r">R' + e.round + '</span>' + U.esc(e.note) +
          '<span class="parts">' + U.esc(e.parts.join(', ')) + '</span></div>').join('')
      : '<div class="muted">The brief has not been contradicted yet. When a part from a ' +
        'neighbouring ecology survives here as structure, the void gets rewritten.</div>';

    // ---- archives ----------------------------------------------------------
    $('archive').innerHTML = Object.entries(arc).map(([k, v]) =>
      '<div class="kv"><span>' + k + '</span><b class="' +
      (k === 'fossil' ? 'muted' : k === 'novel' ? 'ok' : '') + '">' + v + '</b></div>').join('');

    // ---- generations -------------------------------------------------------
    const h = p.history;
    $('nGen').textContent = h.length;
    $('generations').innerHTML = h.length
      ? h.slice().reverse().map(genRec).join('')
      : '<div class="muted">No generations yet. Each round draws a bag, composes genomes, ' +
        'compiles them, and lets only what survives the gates reach a judge.</div>';
  }

  function genRec(r) {
    const c = r.chosen;
    const bars = c ? Object.entries(c.scores).map(([k, v]) =>
      '<div class="axis"><span>' + k.slice(0, 4) + '</span>' +
      '<i style="width:' + Math.round(v * 100) + '%"></i><b>' + v.toFixed(2) + '</b></div>').join('') : '';
    const front = (r.frontierDetail || []).map(f =>
      '<div class="cand' + (c && f.claim === c.claim ? ' won' : '') + '">' +
      '<span class="ch">' + (f.champion || '—') + '</span>' +
      '<span class="pt">' + f.parts + 'p</span>' +
      (f.lineage.length ? '<span class="lin">' + U.esc(f.lineage.join(' → ')) + '</span>' : '') +
      '</div>').join('');
    return '<div class="gen">' +
      '<div class="gen-head"><b>R' + r.round + '</b>' +
        '<span class="void">' + U.esc(r.void) + '</span>' +
        '<span class="cell">' + r.cell + '</span>' +
        '<span class="flow">' + r.generated + ' drawn · ' + r.rejected + ' refused · ' +
          r.survivors + ' viable · ' + r.frontier + ' on frontier</span></div>' +
      (c ? '<div class="gen-claim">' + U.esc(c.claim) + '</div>' +
           '<div class="gen-eco">' + (c.ecologies.length
             ? c.ecologies.map(e => '<span class="ecopill">' +
                 U.esc((E.Ecology.get(e) || {}).name || e) + '</span>').join('') : '') +
           (c.lineage.length ? '<span class="lin">' + U.esc(c.lineage.join(' → ')) + '</span>' : '') +
           '</div>' +
           '<div class="axes">' + bars + '</div>' +
           '<div class="why">' + U.esc(c.evidence[c.champion] || '') + '</div>'
         : '<div class="gen-claim muted">' + U.esc(r.note || 'nothing committed') + '</div>') +
      (r.substituted ? '<div class="sub">frontier substitution: the chosen build could not land, ' +
        '“' + U.esc(r.substituted) + '” took the cell</div>' : '') +
      (front ? '<div class="frontier">' + front + '</div>' : '') +
      (r.emergent ? '<div class="emergent inline">' + U.esc(r.emergent) + '</div>' : '') +
      '</div>';
  }

  $('btnStep').addEventListener('click', step);
  $('btnRun').addEventListener('click', () => run(16));
  $('btnReset').addEventListener('click', () => { S.running = false; reset(); });
  $('btnFit').addEventListener('click', () => U.frame(S.viewer));
  let e = true, g = true, sp = false;
  $('btnEdges').addEventListener('click', () => S.viewer && S.viewer.setDiagnostics({ showEdges: (e = !e) }));
  $('btnGrid').addEventListener('click',  () => S.viewer && S.viewer.setDiagnostics({ grid: (g = !g) }));
  $('btnSpin').addEventListener('click',  () => S.viewer && S.viewer.setAutoSpin(sp = !sp));
  $('btnDl').addEventListener('click', () =>
    U.download(S.pop.toMPD(), 'finch-' + cfg.finch + '-' + S.briefKey + '.mpd'));
  $('btnBroadcast').addEventListener('click', () => {
    U.toast(N.Bus.emit(S.pop.scene,
      { name: S.pop.brief.title + ' · ' + finch.name, ...S.pop.audit() },
      'finch-' + cfg.finch) ? 'Broadcast on wag-frank' : 'No BroadcastChannel in this browser');
  });

  reset();
}

global.FinchBoot = boot;
})(window);
