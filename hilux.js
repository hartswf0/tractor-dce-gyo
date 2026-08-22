/**
 * HILUX — one rail, one window
 * =============================
 * The previous version had two rails on the same edge: modes down the right,
 * and the view controls stacked down the right of the world inside it. A rail
 * in a window beside a rail, with about eighty pixels of window left between
 * them. This one has exactly one of each.
 *
 *   ONE RAIL     horizontal, at the base, where the thumb is.
 *   ONE WINDOW   above it. The world is its floor and never unmounts — panels
 *                slide over, so the WebGL context survives a mode switch and
 *                you are always one tap from the build.
 *
 * A builder hands Hilux a config and gets a shell back:
 *
 *   const hx = Hilux.mount({
 *     title: 'Ground Finch',
 *     chips: ['round', 'parts'],
 *     panels: [
 *       { id:'run', label:'RUN', glyph:'▶', build(el, hx){ ... } },
 *       { id:'voids', label:'VOIDS', glyph:'○', build(el, hx){ ... } }
 *     ],
 *     onCommand(text, hx){ ... },
 *     onWorld(canvasEl, hx){ ... }
 *   });
 *
 * WORLD and LOG are built in and always first — every builder needs them and
 * none of them should have to write them. View controls are not a rail: the
 * window fits on a double-tap and the rest live in the WORLD panel.
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

  // ── the one window ────────────────────────────────────────────────────
  const win = h('main', 'hx-window');
  const world = h('div', 'hx-world');
  const canvas = h('div', 'hx-canvas');
  const status = h('div', 'hx-status', 'booting…');
  const hint = h('div', 'hx-hint', 'drag · pinch · double-tap to fit');
  world.append(canvas, status, hint);
  const panel = h('section', 'hx-panel');
  panel.hidden = true;
  win.append(world, panel);

  // ── trace ─────────────────────────────────────────────────────────────
  const trace = h('div', 'hx-trace');
  const traceRail = h('div', 'hx-trace-rail');
  trace.appendChild(traceRail);

  // ── composer ──────────────────────────────────────────────────────────
  const composer = h('form', 'hx-composer');
  const plus = h('button', 'plus', '+'); plus.type = 'button';
  const input = h('input');
  input.placeholder = cfg.placeholder || 'command…';
  input.autocomplete = 'off'; input.autocapitalize = 'off'; input.spellcheck = false;
  const send = h('button', 'send', '➤'); send.type = 'submit';
  composer.append(plus, input, send);

  // ── the one rail ──────────────────────────────────────────────────────
  const rail = h('nav', 'hx-rail');
  root.append(head, ticker, win, trace, composer, rail);
  document.body.appendChild(root);
  const toast = h('div', 'hx-toast');
  document.body.appendChild(toast);

  const hx = { el: { root, win, world, canvas, status, panel, trace, composer, input, rail },
               active: 'world', cfg };

  // ── log store. The wall is a panel now, so the lines live here and the
  //    panel renders them on demand rather than being the only copy. ─────
  const lines = [];
  const railBtns = new Map();

  hx.chip = (id, text, cls) => {
    let c = chipEls.get(id);
    if (!c) { c = h('span', 'hx-chip'); chipEls.set(id, c); chips.appendChild(c); }
    c.textContent = text; c.className = 'hx-chip' + (cls ? ' ' + cls : '');
  };
  hx.status = t => { status.textContent = t; };
  /** Mark the shell busy. A round can block the thread for most of a second,
   *  and an unexplained unresponsive tab reads as broken rather than working. */
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

  hx.trace = (points, activeIdx) => {
    traceRail.innerHTML = '';
    if (!points || !points.length) {
      traceRail.appendChild(h('span', 'hx-trace-empty', cfg.traceEmpty || 'no rounds yet'));
      return;
    }
    points.forEach((p, i) => {
      const d = h('div', 'hx-trace-dot' +
        (i === activeIdx ? ' now' : i < (activeIdx == null ? points.length : activeIdx) ? ' done' : '') +
        (p.bad ? ' bad' : ''));
      d.title = p.label || ('#' + (i + 1));
      d.appendChild(h('i'));
      d.addEventListener('click', () => cfg.onTrace && cfg.onTrace(i, p, hx));
      traceRail.appendChild(d);
    });
    if (activeIdx != null) {
      const el = traceRail.children[activeIdx];
      if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  };

  // ── panels ────────────────────────────────────────────────────────────
  // WORLD and LOG are built in. Every builder wants them and none of them
  // should have to write them, or invent a second place for view controls.
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
  const panels = [WORLD, LOG, ...(cfg.panels || [])];
  hx.panels = panels;

  function show(id, opts = {}) {
    const p = panels.find(x => x.id === id);
    if (!p) return;
    hx.active = id;
    railBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === id)));

    if (id === 'world') {
      panel.hidden = true;
      panel.innerHTML = '';
      // The renderer sized itself while hidden behind a panel; give it the
      // window back before the next frame.
      if (cfg.onResize) cfg.onResize(hx);
      return;
    }
    panel.hidden = false;
    panel.innerHTML = '';
    panel.appendChild(h('div', 'hx-panel-head', p.title || p.label));
    try { p.build && p.build(panel, hx); }
    catch (e) { panel.appendChild(h('div', 'hx-empty', 'panel failed: ' + e.message)); console.error(e); }
    panel.scrollTop = 0;
  }
  hx.show = show;
  hx.refresh = id => { if (!id || hx.active === id) show(hx.active, { force: true }); };

  for (const p of panels) {
    const b = h('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.append(h('span', 'g', p.glyph || '•'), h('span', '', p.label));
    b.addEventListener('click', () => {
      // Tapping the panel you are already on returns you to the world. One tap
      // to anything, one tap back — no tab is ever a dead end.
      show(hx.active === p.id && p.id !== 'world' ? 'world' : p.id);
    });
    railBtns.set(p.id, b);
    rail.appendChild(b);
  }

  // Tapping the ticker opens the log it is a one-line summary of.
  ticker.addEventListener('click', () => show(hx.active === 'log' ? 'world' : 'log'));

  // Double-tap the window to fit. This is the only view control that needs to
  // be instant, so it is the only one that gets to be a gesture.
  (function doubleTapFit() {
    let last = 0;
    world.addEventListener('pointerup', () => {
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

  // Keep the composer clear of the on-screen keyboard.
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
  /** The view controls, as a row of buttons in a panel. Not a rail. */
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
  return hx;
}

global.Hilux = { mount, h, esc };
})(window);
