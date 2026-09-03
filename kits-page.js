/**
 * KITS — the bar, on the shelf.
 *
 * Seventeen real LEGO sets authored in LDraw, and until now they existed only
 * as a folder of text and a column of numbers. You cannot build toward a thing
 * you have never looked at, so this page puts them in the bed.
 *
 * These are "Packed" MPDs: every part .dat the model references is inlined as
 * a further 0 FILE block, so LDrawLoader resolves the whole set from the text
 * alone and NabugoUI.render takes a raw MPD string. No catalogue lookup, no
 * part resolution, no 404 storm.
 *
 * The numbers beside each set come from kit-index.json — the same measurements,
 * computed the same way, that the gauntlet judges our own builds on.
 */
(function (global) {
'use strict';

const H = () => Hilux.h;

async function boot() {
  const U = global.NabugoUI;
  const St = { index: null, kit: null, viewer: null, loading: false };
  global.KitsPage = St;

  const hx = Hilux.mount({
    title: 'The Bar',
    home: './nabugo-gallery.html',
    chips: ['kit', 'pieces', 'blocks', 'corpus'],
    placeholder: 'xwing · atst · lighthouse · next · random · help',
    wallEmpty: '17 real LEGO kits. Build toward the cards; be judged against these.',
    traceEmpty: 'no kit loaded',
    panels: [
      { id: 'shelf',   label: 'SHELF',   glyph: '▤', title: 'seventeen real sets',        build: panelShelf },
      { id: 'measure', label: 'MEASURE', glyph: '⌾', title: 'what this kit actually is',  build: panelMeasure },
      { id: 'layers',  label: 'LAYERS',  glyph: '⧉', title: "Brand's six, as the kit cut them", build: panelLayers },
      { id: 'parts',   label: 'PARTS',   glyph: '⊞', title: 'the workhorses',             build: panelParts }
    ],
    onCommand: command,
    onWorld: async canvasEl => {
      St.viewer = await U.makeViewer(canvasEl, { background: 0x0b0d10 });
      await load();
    },
    onFit: () => U.frame(St.viewer, 0.72),
    onTrace: i => { const k = St.index.kits[i]; if (k) show(k.kit); },
    onResize: () => St.viewer && St.viewer.updateRendererSize()
  });
  St.hx = hx;

  async function load() {
    try {
      const r = await fetch('./kit-index.json');
      if (!r.ok) throw new Error('HTTP ' + r.status);
      St.index = await r.json();
    } catch (e) {
      hx.chip('corpus', 'no index', 'bad');
      hx.say('SYSTEM', 'Serve this page over HTTP — it needs kit-index.json.', { kind: 'bad' });
      return;
    }
    // A kit whose root turns out to be a part file rather than a model has no
    // build to look at; 6156 Window Brick is one. Keep it on the shelf, say so.
    St.index.kits.sort((a, b) => a.pieces - b.pieces);
    hx.chip('corpus', St.index.kits.length + ' kits', 'ok');
    hx.say('SYSTEM', St.index.kits.length + ' kits · ' +
           St.index.kits.reduce((n, k) => n + k.pieces, 0).toLocaleString() +
           ' placements · LDraw OMR, CC BY 2.0', { kind: 'sys' });
    hx.trace(St.index.kits.map(k => ({ label: k.kit, bad: !!k.degenerate })), null);
    await show('5935-island-hopper');
  }

  const rec = id => St.index && St.index.kits.find(k => k.kit === id);

  async function show(id) {
    const k = rec(id);
    if (!k) return hx.say('SYSTEM', 'no kit called ' + id, { kind: 'bad' });
    St.kit = k;
    hx.chip('kit', title(k), 'hot');
    hx.chip('pieces', k.pieces.toLocaleString() + ' pcs');
    hx.chip('blocks', (k.submodel ? k.submodel.modelBlocks : 1) + ' blocks');
    hx.reference({ name: title(k), sub: 'SET ' + setNo(k), kind: 'kit',
                   tagline: k.pieces.toLocaleString() + ' placements · ' +
                            (k.submodel ? k.submodel.modelBlocks : 1) + ' model blocks · ' +
                            k.distinct + ' distinct parts' });
    hx.trace(St.index.kits.map(x => ({ label: x.kit, bad: !!x.degenerate })),
             St.index.kits.indexOf(k));
    hx.say('SHELF', title(k) + ' — ' + k.pieces + ' placements, ' + k.distinct +
           ' distinct parts, ' + k.colours + ' colours', { kind: 'ok' });
    if (['measure', 'layers', 'parts', 'shelf'].includes(hx.active)) hx.refresh();

    if (k.degenerate || !k.pieces) {
      hx.status('this file is a part, not a model');
      return;
    }
    St.loading = true; hx.busy(true); hx.status('fetching ' + k.file + '…');
    try {
      const r = await fetch('./' + k.file);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const text = await r.text();
      hx.status('rendering ' + Math.round(text.length / 1024) + ' KB…');
      await U.render(St.viewer, text, hx.el.status, k.kit);
      U.frame(St.viewer, 0.72);
    } catch (e) {
      hx.status('could not load: ' + e.message);
      hx.say('SYSTEM', 'could not load ' + k.file + ' — ' + e.message, { kind: 'bad' });
    } finally { St.loading = false; hx.busy(false); }
  }

  const setNo = k => (k.kit.match(/^(\d+)/) || [, '—'])[1];
  const title = k => k.kit.replace(/^\d+-/, '').replace(/-/g, ' ')
                      .replace(/\b\w/g, c => c.toUpperCase());
  const pct = v => (v == null ? '—' : (v * 100).toFixed(1) + '%');

  /** Where this kit sits in the corpus, which is the only context a number has. */
  function band(metric, v) {
    const m = St.index.kitNorm && St.index.kitNorm.metrics[metric];
    if (!m || v == null) return '';
    return v <= m.p25 ? 'warn' : v >= m.p75 ? 'ok' : '';
  }

  // ── panels ─────────────────────────────────────────────────────────────
  function panelShelf(el) {
    if (!St.index) return void el.appendChild(H()('div', 'hx-empty', 'no index'));
    el.appendChild(H()('div', 'hx-empty',
      'From the LDraw Official Model Repository, by way of the three.js LDrawLoader example. ' +
      'CC BY 2.0. Tap one to put it in the bed.'));
    for (const k of St.index.kits) {
      const c = H()('div', 'hx-round');
      const hd = H()('header');
      hd.append(H()('span', 'n', 'SET ' + setNo(k) + (k.degenerate ? ' · part file' : '')),
                H()('span', 's' + (St.kit === k ? ' up' : ''), String(k.pieces)));
      c.appendChild(hd);
      c.appendChild(H()('div', 'd', title(k) + ' — ' + k.distinct + ' distinct parts, ' +
        k.colours + ' colours, ' + (k.submodel ? k.submodel.modelBlocks : 1) + ' model blocks'));
      c.addEventListener('click', () => show(k.kit));
      el.appendChild(c);
    }
  }

  function panelMeasure(el) {
    const k = St.kit;
    if (!k) return void el.appendChild(H()('div', 'hx-empty', 'no kit loaded'));
    const sm = k.submodel || {};
    el.appendChild(hx.cap('the set'));
    el.appendChild(hx.kv('set number', setNo(k)));
    el.appendChild(hx.kv('root model', k.rootModel || '—'));
    el.appendChild(hx.kv('placements', k.pieces.toLocaleString()));
    el.appendChild(hx.cap('vocabulary'));
    el.appendChild(hx.kv('distinct parts', k.distinct, band('distinct', k.distinct)));
    el.appendChild(hx.kv('distinct / pieces', (k.distinctRatio || 0).toFixed(3),
                         band('distinctRatio', k.distinctRatio)));
    el.appendChild(hx.kv('top-5 share', pct(k.top5Share)));
    el.appendChild(hx.kv('colours', k.colours));
    el.appendChild(hx.kv('top-5 colour share', pct(k.top5ColourShare)));
    el.appendChild(hx.cap('how it is built'));
    el.appendChild(hx.kv('model blocks', sm.modelBlocks, band('modelBlocks', sm.modelBlocks)));
    el.appendChild(hx.kv('nesting depth', sm.maxDepth));
    el.appendChild(hx.kv('reused blocks', sm.reusedBlocks != null ? sm.reusedBlocks : '—'));
    el.appendChild(hx.kv('build steps', k.steps ? k.steps.stepsAllModelBlocks : '—'));
    el.appendChild(hx.kv('pieces per step', k.steps ? (k.steps.piecesPerStepAll || 0).toFixed(1) : '—'));
    el.appendChild(hx.cap('geometry'));
    el.appendChild(hx.kv('studs to fly it off in the plan',
      k.bboxStuds ? k.bboxStuds.map(v => v.toFixed(0)).join(' × ') : '—'));
    el.appendChild(hx.kv('density (pcs / M LDU³)', (k.density || 0).toFixed(2),
                         band('density', k.density)));
    el.appendChild(hx.kv('SNOT, local', pct(k.snotRateLocal)));
    el.appendChild(hx.kv('on the lattice, local', pct(k.gridAlignLocal)));
    el.appendChild(hx.cap('the corpus'));
    el.appendChild(H()('div', 'hx-empty',
      'Bands are against the other sixteen: amber is bottom quartile, green top quartile. ' +
      'A kit is not judged against a target, it is judged against its peers — which is also ' +
      'how the gauntlet judges us.'));
  }

  function panelLayers(el) {
    const k = St.kit;
    if (!k || !k.shearingLayerShare) return void el.appendChild(H()('div', 'hx-empty', 'no layer data'));
    el.appendChild(H()('div', 'hx-empty',
      'Every part classified into one of Brand’s six by its family. This is the set’s own ' +
      'answer to how much of a build is frame, how much is weather face, and how much is ' +
      'the fast layer that has to stay reachable.'));
    const order = ['SITE', 'STRUCTURE', 'SKIN', 'SERVICES', 'SPACE PLAN', 'STUFF', 'UNASSIGNED'];
    const S = k.shearingLayerShare;
    for (const L of order) {
      if (S[L] == null) continue;
      const row = hx.kv(L.toLowerCase(), pct(S[L]), S[L] > 0 ? '' : 'warn');
      el.appendChild(row);
      const m = H()('div', 'hx-meter'); const i = H()('i');
      i.style.width = Math.min(100, S[L] * 100) + '%'; m.appendChild(i);
      el.appendChild(m);
    }
    el.appendChild(hx.cap('family mix'));
    const fs = Object.entries(k.familyShare || {}).filter(([, v]) => v > 0)
                     .sort((a, b) => b[1] - a[1]);
    for (const [f, v] of fs) el.appendChild(hx.kv(f, pct(v)));
  }

  function panelParts(el) {
    const k = St.kit;
    if (!k) return void el.appendChild(H()('div', 'hx-empty', 'no kit loaded'));
    el.appendChild(H()('div', 'hx-empty',
      'A real kit leans on a few workhorses and spends the rest on accents. This is that list.'));
    for (const p of (k.top12Parts || [])) {
      el.appendChild(hx.kv(p.part + '  ' + (p.desc || ''), p.count + ' · ' + pct(p.share)));
    }
    el.appendChild(hx.cap('colour'));
    for (const c of (k.colourTable || []).slice(0, 8)) {
      el.appendChild(hx.kv('LDraw ' + c.code, c.count + ' · ' + pct(c.share)));
    }
  }

  // ── commands ───────────────────────────────────────────────────────────
  function command(text) {
    const low = text.trim().toLowerCase();
    if (!St.index) return void hx.say('SYSTEM', 'no index loaded', { kind: 'bad' });
    const list = St.index.kits;
    if (/^help$/.test(low)) return void hx.say('SYSTEM',
      'a set number or a name (xwing, atst, lighthouse, hopper) · next · prev · random · fit', { kind: 'sys' });
    if (/^fit$/.test(low)) return void U.frame(St.viewer, 0.72);
    const at = list.indexOf(St.kit);
    if (/^next$/.test(low)) return void show(list[(at + 1) % list.length].kit);
    if (/^prev$/.test(low)) return void show(list[(at - 1 + list.length) % list.length].kit);
    if (/^random$/.test(low)) return void show(list[Math.floor(Math.random() * list.length)].kit);
    const hit = list.find(k => k.kit.toLowerCase().includes(low.replace(/\s+/g, '-'))) ||
                list.find(k => k.kit.toLowerCase().replace(/[^a-z0-9]/g, '')
                                .includes(low.replace(/[^a-z0-9]/g, '')));
    if (hit) return void show(hit.kit);
    hx.say('SYSTEM', 'no kit matches that — ' + list.map(k => k.kit.replace(/^\d+-/, '')).join(', '),
           { kind: 'warn' });
  }
}

global.KitsBoot = { boot };
})(window);
