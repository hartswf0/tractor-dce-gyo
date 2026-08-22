/**
 * HILUX — one rail, one window, and the world always in it
 * ========================================================
 * The last pass made every panel a sheet that covered the whole window, which
 * killed the only thing the workflow actually needs: seeing the build while
 * you read what was said about it. The roots — operative-builder-trace — had
 * the 3D scene pinned to the top of the screen with the discourse sized under
 * it and a transport in between. That is what this is.
 *
 *   BED        the 3D world. Top of the window. Never covered by anything.
 *   TRANSPORT  prev · play · scrubber · next · n/total. Directly under the bed.
 *   SHEET      log, run, script, voids — every panel. Rises from the bottom,
 *              stops before the bed, sized by its grip, dragged away downward.
 *   RAIL       one rail down the side, collapsible to a strip of glyphs.
 *
 * A builder hands Hilux a config and gets a shell back:
 *
 *   const hx = Hilux.mount({
 *     title: 'Ground Finch',
 *     chips: ['round', 'parts'],
 *     panels: [ { id:'run', label:'RUN', glyph:'▶', build(el, hx){ ... } } ],
 *     onCommand(text, hx){}, onWorld(canvasEl, hx){}, onFit(hx){},
 *     onTrace(i, point, hx){}, onPlay(playing, hx){}, onResize(hx){}
 *   });
 *
 * WORLD and LOG are built in. WORLD is not a panel that opens — it is what you
 * get when the sheet is down.
 */
(function (global) {
'use strict';

const h = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

function mount(cfg) {
  document.body.innerHTML = '';
  document.title = cfg.title || 'Hilux';
  const root = h('div', 'hx');

  // ── head ──────────────────────────────────────────────────────────────
  const head = h('header', 'hx-head');
  const home = h('a', 'hx-home', '◂');
  home.href = cfg.home || './nabugo-gallery.html';
  const title = h('a', 'hx-title', cfg.title || '');
  title.href = cfg.home || './nabugo-gallery.html';
  const chips = h('div', 'hx-chips');
  head.append(home, title, chips);
  const chipEls = new Map();
  for (const id of (cfg.chips || [])) {
    const c = h('span', 'hx-chip', '—'); chipEls.set(id, c); chips.appendChild(c);
  }

  // ── ticker ────────────────────────────────────────────────────────────
  const ticker = h('div', 'hx-ticker');
  const tickWho = h('span', 'w', ''), tickMsg = h('span', 'm', cfg.wallEmpty || 'ready');
  ticker.append(tickWho, tickMsg);

  // ── the window: bed · transport · sheet ───────────────────────────────
  const win = h('main', 'hx-window');

  const bed = h('div', 'hx-bed');
  const canvas = h('div', 'hx-canvas');
  const status = h('div', 'hx-status', 'booting…');
  const hint = h('div', 'hx-hint', 'double-tap to fit');
  bed.append(canvas, status, hint);

  const transport = h('div', 'hx-transport');
  const tPrev = h('button', 'hx-tbtn', '⏮'); tPrev.type = 'button'; tPrev.title = 'previous';
  const tPlay = h('button', 'hx-tbtn', '▶'); tPlay.type = 'button'; tPlay.title = 'play';
  const scrub = h('div', 'hx-scrub');
  const traceRail = h('div', 'hx-trace-rail');
  scrub.appendChild(traceRail);
  const tNext = h('button', 'hx-tbtn', '⏭'); tNext.type = 'button'; tNext.title = 'next';
  const tCount = h('span', 'hx-count', '0/0');
  tPlay.hidden = !cfg.onPlay;
  transport.append(tPrev, tPlay, scrub, tNext, tCount);

  const sheet = h('div', 'hx-sheet');
  const grip = h('div', 'hx-grip');
  const gripBar = h('i');
  const gripTitle = h('span', 't', 'LOG');
  const gripTall = h('button', '', '⌃'); gripTall.type = 'button'; gripTall.title = 'taller';
  const gripDown = h('button', '', '✕'); gripDown.type = 'button'; gripDown.title = 'close';
  grip.append(gripBar, gripTitle, gripTall, gripDown);
  const panel = h('section', 'hx-panel');
  sheet.append(grip, panel);
  sheet.hidden = true;

  win.append(bed, transport, sheet);

  // ── composer ──────────────────────────────────────────────────────────
  const composer = h('form', 'hx-composer');
  const plus = h('button', 'plus', '+'); plus.type = 'button';
  const input = h('input');
  input.placeholder = cfg.placeholder || 'command…';
  input.autocomplete = 'off'; input.autocapitalize = 'off'; input.spellcheck = false;
  const send = h('button', 'send', '➤'); send.type = 'submit';
  composer.append(plus, input, send);

  // ── the one rail, down the side ───────────────────────────────────────
  const rail = h('nav', 'hx-rail');
  const stack = h('div', 'hx-stack');
  stack.append(head, ticker, win, composer);
  root.append(stack, rail);
  document.body.appendChild(root);
  const toast = h('div', 'hx-toast');
  document.body.appendChild(toast);

  const hx = { el: { root, stack, win, bed, world: bed, canvas, status, panel, sheet,
                     transport, composer, input, rail },
               active: 'world', cfg };

  const lines = [];
  const railBtns = new Map();

  // ══ THE SHEET ═════════════════════════════════════════════════════════
  // Height in px, driven by the grip. The bed has a CSS floor (26dvh) and the
  // sheet is flex-shrinkable, so no drag can ever push the world off screen —
  // the layout refuses before the maths does. HALF and TALL are the two rests.
  let sheetH = 0, lastOpen = 0;
  const sheetMax = () => Math.max(120, win.clientHeight - Math.round(window.innerHeight * 0.28) - 34);
  const rests = () => { const m = sheetMax(); return [0, Math.round(m * 0.58), m]; };

  function setSheet(px, animate) {
    sheetH = Math.round(clamp(px, 0, sheetMax()));
    sheet.classList.toggle('snapping', !!animate);
    sheet.hidden = sheetH <= 0;
    root.style.setProperty('--hx-sheet', sheetH + 'px');
    if (sheetH > 0) lastOpen = sheetH;
    gripTall.textContent = sheetH >= sheetMax() - 8 ? '⌄' : '⌃';
    // The bed just changed size; the renderer has to hear about it.
    if (animate) setTimeout(bedResized, 200); else bedResized();
  }
  let resizeT = 0;
  function bedResized() {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (cfg.onResize) cfg.onResize(hx); }, 20);
  }
  window.addEventListener('resize', () => { if (sheetH) setSheet(sheetH); bedResized(); });

  (function dragGrip() {
    let id = null, y0 = 0, h0 = 0, moved = false;
    grip.addEventListener('pointerdown', ev => {
      if (ev.target.tagName === 'BUTTON') return;
      id = ev.pointerId; y0 = ev.clientY; h0 = sheetH; moved = false;
      grip.setPointerCapture(id);
      sheet.classList.remove('snapping');
    });
    grip.addEventListener('pointermove', ev => {
      if (id == null || ev.pointerId !== id) return;
      const d = y0 - ev.clientY;
      if (Math.abs(d) > 3) moved = true;
      setSheet(h0 + d, false);
    });
    const end = ev => {
      if (id == null || (ev && ev.pointerId !== id)) return;
      id = null;
      if (!moved) { setSheet(sheetH >= rests()[2] - 8 ? rests()[1] : rests()[2], true); return; }
      const r = rests();
      let best = r[0];
      for (const v of r) if (Math.abs(v - sheetH) < Math.abs(best - sheetH)) best = v;
      setSheet(best, true);
      if (best === 0) show('world');
    };
    grip.addEventListener('pointerup', end);
    grip.addEventListener('pointercancel', end);
  })();

  gripTall.addEventListener('click', () => {
    const r = rests();
    const tall = sheetH >= r[2] - 8;
    setSheet(tall ? r[1] : r[2], true);
    gripTall.textContent = tall ? '⌃' : '⌄';
  });
  gripDown.addEventListener('click', () => show('world'));

  // ══ log ═══════════════════════════════════════════════════════════════
  hx.chip = (id, text, cls) => {
    let c = chipEls.get(id);
    if (!c) { c = h('span', 'hx-chip'); chipEls.set(id, c); chips.appendChild(c); }
    c.textContent = text; c.className = 'hx-chip' + (cls ? ' ' + cls : '');
  };
  hx.status = t => { status.textContent = t; };
  hx.busy = on => {
    root.dataset.busy = on ? '1' : '';
    tickWho.textContent = on ? 'WORKING' : tickWho.textContent;
  };

  hx.say = (who, text, opts = {}) => {
    const rec = { who: who || '', text, kind: opts.kind || '', pre: opts.pre || '' };
    lines.push(rec);
    if (lines.length > 600) lines.splice(0, 200);
    tickWho.textContent = rec.who;
    tickMsg.textContent = text;
    ticker.className = 'hx-ticker' + (rec.kind ? ' ' + rec.kind : '');
    if (hx.active === 'log') appendLine(rec);
    return rec;
  };
  hx.clearWall = msg => {
    lines.length = 0;
    tickWho.textContent = ''; tickMsg.textContent = msg || cfg.wallEmpty || 'ready';
    ticker.className = 'hx-ticker';
    if (hx.active === 'log') show('log', { force: true });
  };

  function appendLine(rec) {
    const body = panel.querySelector('.hx-log');
    if (!body) return;
    const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 40;
    body.appendChild(lineEl(rec));
    if (atBottom) panel.scrollTop = panel.scrollHeight;
  }
  function lineEl(rec) {
    const el = h('div', 'hx-line' + (rec.kind ? ' ' + rec.kind : ''));
    el.append(h('span', 'w', rec.who));
    el.appendChild(h('span', 'm', rec.text));
    if (rec.pre) { const p = h('pre'); p.textContent = rec.pre; el.appendChild(p); }
    return el;
  }

  // ══ transport ═════════════════════════════════════════════════════════
  let tracePts = [], traceIdx = null;
  hx.trace = (points, activeIdx) => {
    tracePts = points || []; traceIdx = activeIdx;
    traceRail.innerHTML = '';
    const n = tracePts.length;
    tCount.textContent = n ? ((activeIdx == null ? n : activeIdx + 1) + '/' + n) : '0/0';
    tPrev.disabled = tNext.disabled = !n;
    if (!n) {
      traceRail.appendChild(h('span', 'hx-trace-empty', cfg.traceEmpty || 'no rounds yet'));
      return;
    }
    tracePts.forEach((p, i) => {
      const d = h('div', 'hx-trace-dot' +
        (i === activeIdx ? ' now' : i < (activeIdx == null ? n : activeIdx) ? ' done' : '') +
        (p.bad ? ' bad' : ''));
      d.title = p.label || ('#' + (i + 1));
      d.appendChild(h('i'));
      d.addEventListener('click', () => goTrace(i));
      traceRail.appendChild(d);
    });
    if (activeIdx != null) {
      const el = traceRail.children[activeIdx];
      if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  };
  function goTrace(i) {
    if (!tracePts.length) return;
    i = clamp(i, 0, tracePts.length - 1);
    if (cfg.onTrace) cfg.onTrace(i, tracePts[i], hx);
    else hx.trace(tracePts, i);
  }
  tPrev.addEventListener('click', () => goTrace((traceIdx == null ? tracePts.length : traceIdx) - 1));
  tNext.addEventListener('click', () => goTrace((traceIdx == null ? -1 : traceIdx) + 1));
  hx.playing = false;
  tPlay.addEventListener('click', () => {
    hx.playing = !hx.playing;
    tPlay.textContent = hx.playing ? '❚❚' : '▶';
    tPlay.classList.toggle('on', hx.playing);
    if (cfg.onPlay) cfg.onPlay(hx.playing, hx);
  });
  hx.setPlaying = on => {
    hx.playing = !!on;
    tPlay.textContent = hx.playing ? '❚❚' : '▶';
    tPlay.classList.toggle('on', hx.playing);
  };

  // ══ panels ════════════════════════════════════════════════════════════
  const WORLD = { id: 'world', label: 'WORLD', glyph: '◫' };
  const LOG = {
    id: 'log', label: 'LOG', glyph: '≡',
    build(el) {
      const body = h('div', 'hx-log');
      if (!lines.length) body.appendChild(h('div', 'hx-empty', cfg.wallEmpty || 'nothing yet'));
      else for (const r of lines) body.appendChild(lineEl(r));
      el.appendChild(body);
      requestAnimationFrame(() => { panel.scrollTop = panel.scrollHeight; });
    }
  };
  // The roots kept a card per cycle: who acted, what it scored, what it did,
  // and what the build was before and after. A page opts in with rounds:true
  // and calls hx.logRound() once a cycle; the transport scrubs them.
  const rounds = [];
  hx.rounds = rounds;
  hx.logRound = rec => {
    rounds.push(rec || {});
    if (hx.active === 'rounds') show('rounds', { force: true });
    return rec;
  };
  hx.clearRounds = () => { rounds.length = 0; if (hx.active === 'rounds') show('rounds', { force: true }); };
  const ROUNDS = {
    id: 'rounds', label: 'ROUNDS', glyph: '◆', title: 'cycle by cycle',
    build(el) {
      if (!rounds.length) return void el.appendChild(h('div', 'hx-empty', 'no cycles yet'));
      for (let i = rounds.length - 1; i >= 0; i--) {
        const c = hx.round(rounds[i]);
        c.addEventListener('click', () => goTrace(i));
        el.appendChild(c);
      }
    }
  };
  const panels = [WORLD, LOG, ...(cfg.rounds ? [ROUNDS] : []), ...(cfg.panels || [])];
  hx.panels = panels;

  function show(id, opts = {}) {
    const p = panels.find(x => x.id === id);
    if (!p) return;
    hx.active = id;
    railBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === id)));

    if (id === 'world') {
      setSheet(0, true);
      panel.innerHTML = '';
      return;
    }
    gripTitle.textContent = p.title || p.label;
    panel.innerHTML = '';
    try { p.build && p.build(panel, hx); }
    catch (e) { panel.appendChild(h('div', 'hx-empty', 'panel failed: ' + e.message)); console.error(e); }
    panel.scrollTop = 0;
    if (sheetH <= 0) setSheet(lastOpen || rests()[1], true);
  }
  hx.show = show;
  hx.refresh = id => { if (!id || hx.active === id) show(hx.active, { force: true }); };
  /** Size the sheet from a page: 'peek' | 'half' | 'tall' | 'down'. */
  hx.sheet = where => {
    const r = rests();
    if (where === 'down') return show('world');
    setSheet(where === 'tall' ? r[2] : where === 'peek' ? Math.round(r[1] * 0.55) : r[1], true);
  };

  for (const p of panels) {
    const b = h('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    const g = h('span', 'g', p.glyph || '•'), l = h('span', 'l', p.label);
    b.append(g, l);
    b.addEventListener('click', () => {
      show(hx.active === p.id && p.id !== 'world' ? 'world' : p.id);
    });
    railBtns.set(p.id, b);
    rail.appendChild(b);
  }

  // ── rail collapse ─────────────────────────────────────────────────────
  // The rail is 58px of a 390px screen. On a long script or a wide log that is
  // worth reclaiming, so it folds to a strip of glyphs and every mode is still
  // one tap away. The choice is remembered.
  const railToggle = h('button', 'hx-railtoggle');
  railToggle.type = 'button';
  railToggle.title = 'collapse the rail';
  railToggle.appendChild(h('span', 'g', '›'));
  rail.insertBefore(railToggle, rail.firstChild);
  function setRail(slim) {
    root.dataset.rail = slim ? 'slim' : '';
    railToggle.firstChild.textContent = slim ? '‹' : '›';
    railToggle.title = slim ? 'expand the rail' : 'collapse the rail';
    try { localStorage.setItem('hx.rail', slim ? 'slim' : 'wide'); } catch (e) {}
    bedResized();
  }
  railToggle.addEventListener('click', () => setRail(root.dataset.rail !== 'slim'));
  let slim0 = false;
  try { slim0 = localStorage.getItem('hx.rail') === 'slim'; } catch (e) {}
  setRail(slim0);

  // Tapping the ticker opens the log it is a one-line summary of.
  ticker.addEventListener('click', () => show(hx.active === 'log' ? 'world' : 'log'));

  // Double-tap the bed to fit.
  (function doubleTapFit() {
    let last = 0;
    bed.addEventListener('pointerdown', () => { hint.style.opacity = '0'; }, { once: true });
    bed.addEventListener('pointerup', () => {
      const t = Date.now();
      if (t - last < 320 && cfg.onFit) cfg.onFit(hx);
      last = t;
    });
  })();

  // ── composer ──────────────────────────────────────────────────────────
  composer.addEventListener('submit', ev => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.blur();
    hx.say('YOU', text, { kind: 'hot' });
    if (cfg.onCommand) cfg.onCommand(text, hx);
  });
  plus.addEventListener('click', () => {
    if (cfg.onPlus) return cfg.onPlus(hx);
    const i = panels.findIndex(p => p.id === hx.active);
    show(panels[(i + 1) % panels.length].id);
  });

  if (window.visualViewport) {
    const vv = window.visualViewport;
    const fit = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.paddingBottom = gap ? gap + 'px' : '';
    };
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
  }

  // ── furniture ─────────────────────────────────────────────────────────
  hx.toast = msg => {
    toast.textContent = msg; toast.classList.add('on');
    clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('on'), 1900);
  };
  hx.row = (...kids) => { const r = h('div', 'hx-row'); r.append(...kids); return r; };
  hx.btn = (label, fn, cls) => {
    const b = h('button', 'hx-btn' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    b.addEventListener('click', () => fn(hx, b));
    return b;
  };
  hx.cap = t => h('div', 'hx-cap', t);
  hx.kv = (k, v, cls) => {
    const d = h('div', 'hx-kv');
    d.append(h('span', '', k), h('b', cls || '', String(v)));
    return d;
  };
  /** A round, the way the roots showed one: who, what it scored, what it did,
   *  and what the build looked like before and after. */
  hx.round = (o = {}) => {
    const c = h('div', 'hx-round');
    const hd = h('header');
    hd.append(h('span', 'n', o.who || 'ROUND'));
    if (o.score != null) hd.appendChild(h('span', 's' + (o.delta > 0 ? ' up' : o.delta < 0 ? ' down' : ''),
      String(o.score)));
    c.appendChild(hd);
    if (o.text) c.appendChild(h('div', 'd', o.text));
    if (o.before != null || o.after != null || o.changed != null) {
      const ba = h('div', 'ba');
      const cell = (label, v) => { const d = h('div'); d.append(h('span', '', label), document.createTextNode(String(v))); return d; };
      if (o.before != null) ba.appendChild(cell('before', o.before));
      if (o.after != null) ba.appendChild(cell('after', o.after));
      if (o.changed != null) ba.appendChild(cell('what changed', o.changed));
      c.appendChild(ba);
    }
    // A doctrine decorates its own card — a blast bar, an accusation chain —
    // without Hilux needing to know what either of those is.
    if (typeof o.decorate === 'function') { try { o.decorate(c, hx); } catch (e) {} }
    return c;
  };
  hx.pinnable = (node, text) => {
    const p = h('button', 'hx-pin', '⌖');
    p.type = 'button';
    p.addEventListener('click', ev => { ev.stopPropagation(); hx.say('PIN', text, { kind: 'sys' }); hx.toast('pinned to the log'); });
    node.insertBefore(p, node.firstChild);
    return node;
  };
  hx.select = (options, value, fn) => {
    const s = h('select', 'hx-sel');
    for (const o of options) {
      const opt = h('option', '', o.label);
      opt.value = o.value;
      if (o.value === value) opt.selected = true;
      s.appendChild(opt);
    }
    s.addEventListener('change', () => fn(s.value, hx));
    return s;
  };
  hx.viewRow = viewer => hx.row(
    hx.btn('Fit',   () => cfg.onFit && cfg.onFit(hx)),
    hx.btn('Edges', () => { hx._e = !hx._e; viewer && viewer.setDiagnostics({ showEdges: hx._e }); }),
    hx.btn('Grid',  () => { hx._g = !hx._g; viewer && viewer.setDiagnostics({ grid: hx._g }); }),
    hx.btn('Spin',  () => { hx._s = !hx._s; viewer && viewer.setAutoSpin(hx._s); })
  );
  hx._e = true; hx._g = true; hx._s = false;
  hx.esc = esc;

  hx.trace(null);
  show('world');
  if (cfg.onWorld) {
    Promise.resolve(cfg.onWorld(canvas, hx)).catch(e => {
      hx.status('world failed: ' + e.message); console.error(e);
    });
  }
  if (cfg.onReady) Promise.resolve().then(() => cfg.onReady(hx));
  global.__hx = hx;   // one handle, for the console and for the tests
  return hx;
}

global.Hilux = { mount, h, esc };
})(window);
