/**
 * HILUX — one chassis, every load
 * ================================
 * Hilux owns the DOM. A builder hands it a config and gets back a shell with
 * five things it can talk to: the world, the tray, the trace, the wall and the
 * composer. Nothing below writes its own layout, which is the whole point —
 * the previous pages each invented one, and each of them fell apart at 390px.
 *
 *   const hx = Hilux.mount({
 *     title: 'Cathedral Forager',
 *     chips: ['round', 'score', 'parts'],
 *     modes: [
 *       { id:'script', label:'SCRIPT', title:'ATORScript · the genome',
 *         build(el, hx) { ... } },
 *       { id:'run',    label:'RUN',    build(el, hx) { ... } }
 *     ],
 *     onCommand(text, hx) { ... },
 *     onWorld(canvasEl, hx) { ... }          // return whatever you like
 *   });
 *
 *   hx.chip('parts', '1,084 pieces', 'hot');
 *   hx.say('BUILDER', 'raised a colonnade at 0,0', { kind:'ok' });
 *   hx.trace(rounds.map(r => ({ label:'R'+r.n, bad:!r.ok })), current);
 *   hx.refresh('script');                    // rebuild one tray
 *
 * Interactions, from the wireframe: tap the active rail tab to collapse the
 * tray, long-press any tab to peek at it without switching, drag the divider
 * to grow the wall, and the pin on a tray row copies it to the wall.
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
const now = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
};

function mount(cfg) {
  document.body.innerHTML = '';
  document.title = cfg.title || 'Hilux';

  const root = h('div', 'hx');
  const main = h('div', 'hx-main');

  // ── header ───────────────────────────────────────────────────────────
  const head = h('header', 'hx-head');
  // Tapping the title goes back to the gallery. On a phone there is no other
  // way out of a full-screen app shell, and the browser's back button is not
  // where anyone's thumb is.
  const home = h('a', 'hx-home', '◂');
  home.href = cfg.home || './nabugo-gallery.html';
  home.title = 'back to the gallery';
  const title = h('a', 'hx-title', cfg.title || '');
  title.href = cfg.home || './nabugo-gallery.html';
  head.append(home, title);
  const chips = h('div', 'hx-chips');
  head.appendChild(chips);
  const chipEls = new Map();
  for (const id of (cfg.chips || [])) {
    const c = h('span', 'hx-chip', '—');
    chipEls.set(id, c); chips.appendChild(c);
  }

  // ── world ────────────────────────────────────────────────────────────
  const world = h('div', 'hx-world');
  const canvas = h('div', 'hx-canvas');
  const status = h('div', 'hx-world-status', 'booting…');
  const tools = h('div', 'hx-world-tools');
  world.append(canvas, status, tools);

  // ── tray ─────────────────────────────────────────────────────────────
  const tray = h('div', 'hx-tray');
  const trayTitle = h('div', 'hx-tray-title');
  const trayGrab = h('span', 'hx-grab');
  const trayLabel = h('span', '', '');
  trayTitle.append(trayLabel, trayGrab);
  const trayBody = h('div', 'hx-tray-body');
  tray.append(trayTitle, trayBody);
  world.appendChild(tray);

  // ── trace ────────────────────────────────────────────────────────────
  const trace = h('div', 'hx-trace');
  const traceRail = h('div', 'hx-trace-rail');
  trace.appendChild(traceRail);

  // ── divider + wall ───────────────────────────────────────────────────
  const divider = h('div', 'hx-divider');
  divider.appendChild(h('i'));
  const wall = h('div', 'hx-wall');

  // ── composer ─────────────────────────────────────────────────────────
  const composer = h('form', 'hx-composer');
  const plus = h('button', 'plus', '+'); plus.type = 'button';
  const input = h('input'); input.placeholder = cfg.placeholder || 'Command or message…';
  input.autocomplete = 'off'; input.autocapitalize = 'off'; input.spellcheck = false;
  const send = h('button', 'send', '➤'); send.type = 'submit';
  composer.append(plus, input, send);

  // ── rail ─────────────────────────────────────────────────────────────
  const rail = h('nav', 'hx-rail');
  const railBtns = new Map();

  main.append(head, world, trace, divider, wall, composer);
  root.append(main, rail);
  document.body.appendChild(root);
  const toast = h('div', 'hx-toast');
  document.body.appendChild(toast);

  // ═══════════════════════════════════════════════════════════════════════
  const hx = {
    el: { root, world, canvas, status, tools, tray, trayBody, trace, wall, composer, input, rail },
    modes: cfg.modes || [], active: null, collapsed: false, cfg
  };

  // ── chips ────────────────────────────────────────────────────────────
  hx.chip = (id, text, cls) => {
    let c = chipEls.get(id);
    if (!c) { c = h('span', 'hx-chip'); chipEls.set(id, c); chips.appendChild(c); }
    c.textContent = text;
    c.className = 'hx-chip' + (cls ? ' ' + cls : '');
    return c;
  };

  // ── world tools ──────────────────────────────────────────────────────
  hx.tool = (label, fn) => {
    const b = h('button', '', label);
    b.type = 'button';
    b.addEventListener('click', ev => { ev.preventDefault(); fn(hx); });
    tools.appendChild(b);
    return b;
  };
  hx.status = t => { status.textContent = t; };

  // ── the wall ─────────────────────────────────────────────────────────
  let wallCount = 0;
  hx.say = (who, text, opts = {}) => {
    if (!wallCount) wall.innerHTML = '';
    const line = h('div', 'hx-line' + (opts.kind ? ' ' + opts.kind : ''));
    line.append(h('span', 't', opts.at || now()), h('span', 'w', who || ''));
    const m = h('span', 'm');
    m.textContent = text;
    if (opts.pre) { const p = h('pre'); p.textContent = opts.pre; m.appendChild(p); }
    line.appendChild(m);
    // Stick to the bottom only when the reader is already there.
    const atBottom = wall.scrollTop + wall.clientHeight >= wall.scrollHeight - 30;
    wall.appendChild(line);
    wallCount++;
    if (atBottom) wall.scrollTop = wall.scrollHeight;
    return line;
  };
  hx.clearWall = (msg) => {
    wallCount = 0;
    wall.innerHTML = '';
    if (msg) wall.appendChild(h('div', 'hx-wall-empty', msg));
  };

  // ── the trace ────────────────────────────────────────────────────────
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
    // Keep the head of the run in view as it grows.
    if (activeIdx != null) {
      const el = traceRail.children[activeIdx];
      if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
  };

  // ── modes and the tray ───────────────────────────────────────────────
  function show(id, opts = {}) {
    const mode = hx.modes.find(m => m.id === id);
    if (!mode) return;
    // Tapping the tab that is already showing puts the tray away — the world
    // is what you came to look at.
    if (hx.active === id && !opts.force && !opts.peek) {
      hx.collapsed = !hx.collapsed;
      tray.classList.toggle('collapsed', hx.collapsed);
      return;
    }
    hx.active = id;
    hx.collapsed = false;
    tray.classList.remove('collapsed');
    tray.classList.toggle('peek', !!opts.peek);
    trayLabel.textContent = mode.title || mode.label;
    trayBody.innerHTML = '';
    try { mode.build && mode.build(trayBody, hx); }
    catch (e) { trayBody.appendChild(h('div', 'hx-wall-empty', 'tray failed: ' + e.message)); console.error(e); }
    railBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === id)));
  }
  hx.show = show;
  hx.refresh = id => { if (!id || hx.active === id) show(hx.active, { force: true }); };

  for (const m of hx.modes) {
    const b = h('button', '', m.label);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    railBtns.set(m.id, b);

    // Long-press peeks without switching: hold a tab, read it, let go.
    let timer = null, peeked = false, prior = null;
    const start = () => {
      peeked = false;
      timer = setTimeout(() => {
        peeked = true; prior = hx.active;
        show(m.id, { peek: true });
        if (navigator.vibrate) navigator.vibrate(8);
      }, 420);
    };
    const end = ev => {
      clearTimeout(timer);
      if (peeked) {
        ev.preventDefault();
        tray.classList.remove('peek');
        if (prior && prior !== m.id) show(prior, { force: true });
        peeked = false;
      }
    };
    b.addEventListener('pointerdown', start);
    b.addEventListener('pointerup', end);
    b.addEventListener('pointerleave', () => clearTimeout(timer));
    b.addEventListener('pointercancel', () => { clearTimeout(timer); peeked = false; });
    b.addEventListener('click', ev => { if (peeked) { ev.preventDefault(); return; } show(m.id); });
    rail.appendChild(b);
  }

  // ── divider: grow the wall, within limits that keep the world usable ──
  (function draggable() {
    let dragging = false, startY = 0, startH = 0;
    const px = () => wall.getBoundingClientRect().height;
    const onDown = e => {
      dragging = true; startY = (e.touches ? e.touches[0] : e).clientY; startH = px();
      divider.setPointerCapture && e.pointerId != null && divider.setPointerCapture(e.pointerId);
      e.preventDefault();
    };
    const onMove = e => {
      if (!dragging) return;
      const y = (e.touches ? e.touches[0] : e).clientY;
      const want = startH + (startY - y);
      const max = window.innerHeight * 0.66;
      document.documentElement.style.setProperty('--hx-wall',
        Math.max(64, Math.min(max, want)) + 'px');
      e.preventDefault();
    };
    const onUp = () => { dragging = false; if (cfg.onResize) cfg.onResize(hx); };
    divider.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    // Double-tap the divider to snap between a glance and a read.
    let last = 0;
    divider.addEventListener('click', () => {
      const t = Date.now();
      if (t - last < 320) {
        const big = px() > window.innerHeight * 0.4;
        document.documentElement.style.setProperty('--hx-wall', big ? '22dvh' : '58dvh');
        if (cfg.onResize) cfg.onResize(hx);
      }
      last = t;
    });
  })();

  // ── composer ─────────────────────────────────────────────────────────
  composer.addEventListener('submit', ev => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    hx.say('YOU', text, { kind: 'hot' });
    if (cfg.onCommand) cfg.onCommand(text, hx);
  });
  plus.addEventListener('click', () => {
    if (cfg.onPlus) return cfg.onPlus(hx);
    // Default: cycle the rail, so the button is never dead.
    const i = hx.modes.findIndex(m => m.id === hx.active);
    show(hx.modes[(i + 1) % hx.modes.length].id, { force: true });
  });

  // Keep the composer above the on-screen keyboard.
  if (window.visualViewport) {
    const vv = window.visualViewport;
    const fit = () => {
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      main.style.paddingBottom = gap ? gap + 'px' : '';
      if (gap) wall.scrollTop = wall.scrollHeight;
    };
    vv.addEventListener('resize', fit);
    vv.addEventListener('scroll', fit);
  }

  // ── odds and ends builders keep needing ──────────────────────────────
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
    d.append(h('span', '', k));
    d.appendChild(h('b', cls || '', String(v)));
    return d;
  };
  /** A row that can be pinned into the wall — the wireframe's pin affordance. */
  hx.pinnable = (node, text) => {
    const p = h('button', 'hx-pin', '⌖');
    p.type = 'button'; p.title = 'pin to the wall';
    p.addEventListener('click', ev => {
      ev.stopPropagation();
      hx.say('PIN', text, { kind: 'sys' });
      hx.toast('pinned');
    });
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
  hx.esc = esc;

  // ── go ───────────────────────────────────────────────────────────────
  hx.clearWall(cfg.wallEmpty || 'Nothing yet.');
  hx.trace(null);
  // Build the first tray on the next tick, not inside mount(). A builder's tray
  // function naturally closes over the shell it is being handed — running it
  // before mount() has returned means that binding is still in its temporal
  // dead zone, and every tray throws on first paint.
  if (hx.modes.length) queueMicrotask(() => show(hx.modes[0].id, { force: true }));
  if (cfg.onWorld) {
    Promise.resolve(cfg.onWorld(canvas, hx)).catch(e => {
      hx.status('world failed: ' + e.message);
      console.error(e);
    });
  }
  if (cfg.onReady) Promise.resolve().then(() => cfg.onReady(hx));
  return hx;
}

global.Hilux = { mount, h, esc };
})(window);
