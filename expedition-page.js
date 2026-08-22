/**
 * EXPEDITION PAGE
 * The driving surface. hms-beagle.html, isabela.html and santiago.html set a
 * config and hand over.
 *
 * One button does the work. The rest of the page is the ship's log: who was on
 * watch, what they raised, how many pieces it took, and what the inspector
 * found. Resurrecting a city is a great many watches, so the log is the thing
 * you actually read.
 */
(function (global) {
'use strict';

async function boot(cfg) {
  const N = global.Nabugo, E = global.NabugoEvo, M = global.NabugoModules,
        C = global.NabugoCrew, U = global.NabugoUI, $ = U.$;
  const S = { exp: null, viewer: null, running: false, briefKey: cfg.brief || 'atlantis',
              dirty: false, lastRender: 0 };
  global.ExpeditionPage = S;

  $('vesselName').textContent = cfg.title;
  $('vesselNote').textContent = cfg.note;

  try {
    const cm = await N.Catalog.load('./nabugo-parts.json');
    const pm = await E.Ports.load('./nabugo-ports.json');
    const st = await C.Stores.load();
    $('chipCat').textContent = cm.count.toLocaleString() + ' parts · ' + pm.ports.toLocaleString() + ' ports';
    $('chipCat').className = 'chip live';
    $('chipStores').textContent = st.shells + ' shells · ' + st.figures + ' figures · ' + st.vessels + ' vessels';
    $('chipStores').className = st.figures ? 'chip live' : 'chip dead';
  } catch (e) {
    $('chipCat').textContent = 'catalogue failed'; $('chipCat').className = 'chip dead';
    U.toast('Serve this page over HTTP — it needs its data files'); return;
  }

  if (N.Bus.connect(cfg.source)) { $('chipBus').textContent = 'Bus wag-frank'; $('chipBus').className = 'chip live'; }
  else $('chipBus').textContent = 'Bus n/a';

  try { S.viewer = await U.makeViewer($('canvas'), { background: cfg.background }); }
  catch (e) { $('status').textContent = 'viewer failed: ' + e.message; }

  U.briefOptions($('briefSel'), S.briefKey);
  $('briefSel').addEventListener('change', e => { S.briefKey = e.target.value; reset(); });
  $('pieces').addEventListener('input', e => {
    $('piecesVal').textContent = e.target.value;
    if (S.exp) S.exp.piecesWanted = +e.target.value;
  });

  function reset() {
    S.exp = new C.Expedition({
      name: cfg.title, brief: N.Brief.BRIEFS[S.briefKey],
      roster: cfg.roster, pieces: +$('pieces').value,
      extent: cfg.extent, maxExtent: cfg.maxExtent,
      maxWatches: cfg.maxWatches || 600, seed: cfg.seed
    });
    if (cfg.colors) S.exp.colors = cfg.colors;
    $('briefDesc').textContent = S.exp.brief.description;
    paint(true);
    U.render(S.viewer, S.exp.scene(), $('status'), cfg.source);
  }

  /** One watch. Rendering 1,700 parts every watch would be unwatchable, so the
   *  viewer refreshes on a piece-count delta instead of on every turn. */
  async function watch(force) {
    if (!S.exp || S.exp.settled) return false;
    const before = S.exp.site.count;
    S.exp.watch();
    if (S.exp.site.count !== before) S.dirty = true;
    paint();
    if (force || (S.dirty && S.exp.site.count - S.lastRender >= (cfg.renderEvery || 90))) {
      S.lastRender = S.exp.site.count; S.dirty = false;
      await U.render(S.viewer, S.exp.scene(), $('status'), cfg.source);
    }
    return !S.exp.settled;
  }

  async function sail(n) {
    if (S.running) { S.running = false; return; }
    S.running = true;
    $('btnSail').textContent = 'Heave to';
    $('btnSail').classList.add('stop');
    for (let i = 0; i < n && S.running; i++) {
      if (!(await watch())) break;
      if (i % 4 === 3) await new Promise(r => setTimeout(r, 0));
    }
    S.running = false;
    $('btnSail').textContent = 'Sail';
    $('btnSail').classList.remove('stop');
    await U.render(S.viewer, S.exp.scene(), $('status'), cfg.source);
    paint();
  }

  function paint(full) {
    const x = S.exp, a = x.lastAudit || (full ? x.audit() : null);
    $('chipWatch').textContent = 'Watch ' + x.watchNo + (x.settled ? ' · in port' : '');
    $('chipParts').textContent = x.site.count.toLocaleString() + ' / ' + x.piecesWanted.toLocaleString() + ' pieces';
    const pct = Math.min(100, Math.round(100 * x.site.count / x.piecesWanted));
    $('progress').style.width = pct + '%';
    $('chipGround').textContent = x.site.extent + ' LDU of ground';

    // ---- manifest: what has actually been raised ---------------------------
    const man = x.manifest();
    $('manifest').innerHTML = man.length
      ? man.map(m => '<div class="kv"><span>' + U.esc(m.module) + ' ×' + m.n +
          '</span><b>' + m.parts + '</b></div>').join('') +
        '<div class="kv" style="border-top:1px solid var(--soft);margin-top:3px;padding-top:3px">' +
        '<span>total</span><b>' + man.reduce((s, m) => s + m.parts, 0) + '</b></div>'
      : '<div class="muted">nothing raised yet</div>';

    // ---- the palette this district is being built from ---------------------
    $('palette').innerHTML = x.palette && x.palette.log.length
      ? x.palette.log.slice(-9).map(l => '<div class="palrow">' + U.esc(l) + '</div>').join('')
      : '<div class="muted">the quarryman has not drawn yet</div>';

    // ---- void ledger --------------------------------------------------------
    const sum = x.ledger.summary();
    const row = (k, list, cls) => list.length
      ? '<div class="ledger-row"><span class="state ' + cls + '">' + k + '</span>' +
        list.map(v => '<span class="vpill">' + U.esc(v) + '</span>').join('') + '</div>' : '';
    $('voids').innerHTML = row('resolved', sum.resolved, 'ok') +
                           row('partial', sum.partial, 'warn') +
                           row('unresolved', sum.unresolved, 'bad') ||
                           '<div class="muted">no voids</div>';

    if (a) {
      $('inspect').innerHTML =
        kv('parts', a.parts.toLocaleString()) + kv('distinct', a.unique) +
        kv('compiles', a.compiles ? 'YES' : 'NO', a.compiles ? 'ok' : 'bad') +
        kv('collisions', a.collisions, a.collisions ? 'bad' : 'ok') +
        kv('floating', a.floating, a.floating ? 'bad' : 'ok') +
        kv('span LDU', a.span.join(' × '));
    }

    // ---- ship's log ---------------------------------------------------------
    const log = x.log;
    $('nLog').textContent = log.length;
    const view = log.slice(-160).reverse();
    $('log').innerHTML = view.length ? view.map(e =>
      '<div class="watchrow' + (e.parts > 0 ? ' did' : '') + '">' +
        '<span class="w">' + e.watch + '</span>' +
        '<span class="who ' + e.who.toLowerCase() + '">' + e.who + '</span>' +
        '<span class="p">' + (e.parts > 0 ? '+' + e.parts : '·') + '</span>' +
        '<span class="n">' + U.esc(e.note) + '</span>' +
      '</div>').join('')
      : '<div class="muted">No watches stood. SAIL sets the crew to work — surveyor, ' +
        'quarryman, bosun, then the masons.</div>';
  }
  const kv = (k, v, cls) => '<div class="kv"><span>' + k + '</span><b' +
    (cls ? ' class="' + cls + '"' : '') + '>' + v + '</b></div>';

  $('btnWatch').addEventListener('click', () => watch(true));
  $('btnSail').addEventListener('click', () => sail(cfg.maxWatches || 600));
  $('btnReset').addEventListener('click', () => { S.running = false; reset(); });
  $('btnFit').addEventListener('click', () => U.frame(S.viewer, 0.72));
  let e = true, g = true, sp = false;
  $('btnEdges').addEventListener('click', () => S.viewer && S.viewer.setDiagnostics({ showEdges: (e = !e) }));
  $('btnGrid').addEventListener('click',  () => S.viewer && S.viewer.setDiagnostics({ grid: (g = !g) }));
  $('btnSpin').addEventListener('click',  () => S.viewer && S.viewer.setAutoSpin(sp = !sp));
  $('btnDl').addEventListener('click', () => U.download(S.exp.toMPD(), cfg.source + '-' + S.briefKey + '.mpd'));
  $('btnBroadcast').addEventListener('click', () =>
    U.toast(N.Bus.emit(S.exp.scene(), { name: S.exp.brief.title + ' · ' + cfg.title }, cfg.source)
      ? 'Broadcast on wag-frank' : 'No BroadcastChannel in this browser'));

  reset();
}

global.ExpeditionBoot = boot;
})(window);
