/**
 * NABUGO UI
 * Shared widgets for nabugo.html and the two doctrine pages. Nothing here
 * decides anything — rendering only. The engine in nabugo.js is the authority.
 */
(function (global) {
'use strict';
const N = global.Nabugo;
const $ = id => document.getElementById(id);

// ─────────────────────────────────────────────────────────────────── viewer
/**
 * A BetaPrimeEngine viewer pointed at the vendored library, with the resolve
 * map pre-seeded so the loader stops probing for 404s.
 */
async function makeViewer(host, opts = {}) {
  if (!global.THREE || !global.THREE.LDrawLoader || !global.BetaPrimeEngine) {
    throw new Error('three.js / LDrawLoader / BetaPrimeEngine not loaded');
  }
  const base = (opts.base || '.').replace(/\/$/, '');     // where ldraw/ and the resolve map live, for pages in a subfolder
  const engine = global.BetaPrimeEngine.create({
    canvas: host,
    loaderPath: base + '/ldraw/',
    background: opts.background ?? 0x050505,
    grid: { size: N.CELL * N.GRID, divisions: N.GRID, color1: 0x2a2a33, color2: 0x17171c },
    axesSize: 100
  });
  engine.setDiagnostics({ axes: false, grid: true });
  await engine.ready;
  repairEdgeColours(engine.loader);
  try {
    const res = await fetch(base + '/ldraw-resolve-map.json');
    if (res.ok) engine.setFileMap(await res.json());
  } catch (e) {
    console.warn('[nabugo] resolve map unavailable; loader will probe', e);
  }
  return engine;
}

/**
 * LDrawLoader resolves a subfile's edge colour (code 24) to the code stored on
 * the *parent* material's edgeMaterial. Some colours leave that as -1 — direct
 * `0x2RRGGBB` colours define themselves as "CODE -1", and the loader's own
 * defaults carry no code at all. The next subfile that asks for edge colour 24
 * under such a parent looks up material "-1", finds nothing, and throws from
 * inside an async callback, which strands the viewer mid-render.
 *
 * Picking parts out of a 12k catalogue means hitting this regularly, so the
 * lookup is made total: any dangling edge code is pointed back at 24, and a
 * material is registered under "-1" as a final backstop. Left alone, one
 * unlucky part freezes a lane at "rendering…" forever.
 */
function repairEdgeColours(loader) {
  if (!loader || !Array.isArray(loader.materials) || !loader.materials.length) return 0;
  const mats = loader.materials;
  const has = code => mats.some(m => String(m.userData && m.userData.code) === code);
  let fixed = 0;

  for (const m of mats) {
    const em = m.userData && m.userData.edgeMaterial;
    if (!em) continue;
    const code = em.userData ? em.userData.code : undefined;
    if (code === undefined || code === null || String(code) === '-1') {
      em.userData = em.userData || {};
      em.userData.code = '24';
      fixed++;
    }
  }

  if (!has('-1')) {
    const donor = mats.find(m => String(m.userData && m.userData.code) === '24') || mats[0];
    if (donor) {
      const fallback = donor.clone();
      fallback.name = 'Nabugo_Fallback - Edge';
      fallback.userData = { ...donor.userData, code: '-1' };
      mats.push(fallback);
      fixed++;
    }
  }

  if (fixed) loader.setMaterials(mats);
  return fixed;
}

/** Fit, then pull in — the engine's own fit leaves a lot of empty frame. */
function frame(engine, zoom = 0.6) {
  if (!engine || !engine.modelWrapper) return;
  engine.fitToCurrent();
  const cam = engine.camera, t = engine.controls.target;
  cam.position.set(t.x + (cam.position.x - t.x) * zoom,
                   t.y + (cam.position.y - t.y) * zoom,
                   t.z + (cam.position.z - t.z) * zoom);
  engine.controls.update();
}

/**
 * Rendering a scene means the loader fetches every part in it. That takes well
 * over a second, so firing a fresh render on every round — and firing both
 * lanes at once — floods the connection pool and locks the page up. Each
 * viewer therefore runs one render at a time and keeps only the latest pending
 * request: intermediate states nobody will see are dropped rather than queued.
 */
const pending = new WeakMap();

async function render(engine, scene, statusEl, label) {
  if (!engine) return;
  const text = typeof scene === 'string' ? scene : scene.toMPD();

  const state = pending.get(engine) || { busy: false, next: null };
  pending.set(engine, state);
  if (state.busy) { state.next = { text, statusEl, label }; return; }

  state.busy = true;
  let job = { text, statusEl, label };
  try {
    while (job) {
      await draw(engine, job);
      job = state.next;
      state.next = null;
    }
  } finally {
    state.busy = false;
  }
}

async function draw(engine, { text, statusEl, label }) {
  if (!/^1 /m.test(text)) {
    engine.clear();
    if (statusEl) statusEl.textContent = 'nothing built yet';
    return;
  }
  if (statusEl) statusEl.textContent = 'rendering…';
  try {
    await engine.loadText(text, { name: label || 'nabugo' }, (label || 'nabugo') + '.mpd');
    frame(engine);
    const st = engine.getStats();
    if (statusEl) statusEl.textContent =
      st.meshes + ' mesh · ' + st.triangles.toLocaleString() + ' tris';
  } catch (e) {
    console.error(e);
    if (statusEl) statusEl.textContent = 'render failed: ' + (e.message || e);
  }
}

// ─────────────────────────────────────────────────────────────────── widgets
function tray(el, scenes) {
  // scenes: [{scene, cls}] — a cell lights for whichever doctrine occupies it.
  const occ = new Map();
  for (const { scene, cls } of scenes) {
    for (const p of scene.places) {
      if (!p.cell) continue;
      const cur = occ.get(p.cell) || { n: 0, cls: cls, zone: p.zone };
      cur.n++; occ.set(p.cell, cur);
    }
  }
  const out = ['<div class="h"></div>'];
  for (let c = 0; c < N.GRID; c++) out.push('<div class="h">' + (c + 1) + '</div>');
  for (let r = 0; r < N.GRID; r++) {
    out.push('<div class="h">' + N.ROWS[r] + '</div>');
    for (let c = 0; c < N.GRID; c++) {
      const label = N.Brief.cellLabel(r, c), z = N.Brief.cellZone(r, c);
      const o = occ.get(label);
      out.push('<div class="cell z' + z + (o ? ' on' : '') + '" title="' + label +
               ' · Zone ' + z + '">' + (o ? o.n : '·') + '</div>');
    }
  }
  el.innerHTML = out.join('');
}

function metrics(el, a, cls) {
  const g = (v, good) => '<b class="' + (good ? 'ok' : v ? 'bad' : 'ok') + '">' + v + '</b>';
  el.innerHTML =
    row('fidelity', '<b>' + a.fidelity + '%</b>') +
    '<div class="meter"><i class="' + cls + '" style="width:' + a.fidelity + '%"></i></div>' +
    row('parts / unique', a.parts + ' / ' + a.unique) +
    row('compiles', a.compiles ? '<b class="ok">YES</b>' : '<b class="bad">NO</b>') +
    row('collisions', g(a.collisions)) +
    row('floating', g(a.floating)) +
    row('cohesion', '<b class="' + (a.cohesion >= 0.9 ? 'ok' : a.cohesion >= 0.6 ? 'warn' : 'bad') + '">' +
        Math.round(a.cohesion * 100) + '%</b>') +
    row('zones', a.zonesHit + ' / 4') +
    row('cells', a.cells) +
    row('vignettes', a.vignettes) +
    row('span LDU', a.span.join(' × ')) +
    row('strategies', a.strategies.map(s => '<span class="tagpill ' + s + '">' + s + '</span>').join('') || '—');
}
const row = (k, v) => '<div class="kv"><span>' + k + '</span>' + v + '</div>';

function traceRec(rec) {
  if (!rec) return '';
  const cls = rec.doctrine === 'OPERATOR' ? 'op' : 'co';
  const d = rec.delta;
  const arrow = d > 0 ? '<span class="d up">+' + d + '</span>'
              : d < 0 ? '<span class="d dn">' + d + '</span>' : '<span class="d">±0</span>';
  const verdict = N.Lens.describe(rec);
  return '<div class="rec ' + cls + (rec.reverted ? ' rev' : '') + '">' +
    '<div class="rec-head"><b>R' + rec.round + '</b><span>' + rec.defect.kind + '</span>' +
    arrow + '<span>f' + rec.after.fidelity + '</span>' +
    '<span>blast ' + rec.blast + '</span>' + (rec.reverted ? '<span>REVERTED</span>' : '') + '</div>' +
    '<div class="rec-kill">' + esc(verdict) + '</div>' +
    '<div class="rec-note">' + esc(rec.note) + '</div>' +
    (rec.commitment ? '<div class="rec-commit">COMMITMENT · ' + esc(rec.commitment) + '</div>' : '') +
    '</div>';
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function toast(msg) {
  let t = $('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1900);
}

function download(text, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function briefOptions(sel, current) {
  sel.innerHTML = Object.values(N.Brief.BRIEFS)
    .map(b => '<option value="' + b.key + '"' + (b.key === current ? ' selected' : '') + '>' +
              esc(b.title) + '</option>').join('');
}

global.NabugoUI = { makeViewer, render, frame, tray, metrics, traceRec, toast, download,
  briefOptions, repairEdgeColours, esc, $ };
})(window);
