#!/usr/bin/env node
/* odyssey/cascade/tools/bake_halfworld.mjs — Halfworld baked into BEFLIX mosaics.

   Halfworld (a separate repository, read and never changed) is a film whose footage is programs: every asset draws itself
   in solid ink levels on paper, every scene is a program that places them on one clock. Its programs need a canvas, so this
   bake runs them in headless Chromium: it serves the Halfworld tree read-only (plus one page of its own), imports the scene
   module OD-B12-S03 (The Sirens' Song), and calls the scene's own stage(ctx, W, H, t) with its cast narrowed to one member at
   a time, so each layer is drawn by Halfworld's own staging, at the times its own timeline gives it. Each layer is rendered
   at 4x BEFLIX resolution and reduced to Knowlton's mosaic, 252 x 184 cells, one ink level 0-7 per cell with Halfworld's own
   quantizer inverted (inkLevel(l) paints grey 255 - l*255/7, so a cell of grey g holds l = round((255 - g) * 7 / 255)), and
   a cell no member painted is transparent (stored as 8).

   Writes assets/beflix/plates/<layer>.json: per layer a few states, each cropped to its ink box and run-length coded (a run is one
   pair of base-36 characters, code = length * 9 + level, see lib/mosaic.ts decodeRuns), and contact PNGs into renders/bake/
   (not committed). Close shots (SHOTS) are whole-stage plates re-drawn larger and cropped, as Halfworld's camera frames.

   node tools/bake_halfworld.mjs [--hw /home/user/odyssey-halfworld]      NODE_PATH must reach playwright */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const HW = path.resolve(opt('--hw', '/home/user/odyssey-halfworld'));
const CHROME = process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const W = 252, H = 184, K = 4;                         /* BEFLIX's mosaic, rendered at K x K pixels per cell */

/* The layers: the scene's cast, one member each, at the scene times whose states the film needs (the scene's own clock,
   0-26 s). The crew's stroke is (t * 0.14) mod 1 in the scene's staging, so eight phases of the stroke are eight times. */
const LAYERS = [
  { id: 'island', member: 'island_01', wide: 1.3, states: [['calm', 0]] },
  { id: 'sirens', member: 'sirens_01', states: [['full', 8], ['half', 21.5], ['fading', 24.2]] },
  { id: 'crew', member: 'crew_01', states: [0, 1, 2, 3, 4, 5, 6, 7].map(k => ['stroke' + k, k / 8 / 0.14]).concat([0, 2, 4, 6].map(k => ['haul' + k, 20 + ((k / 8 - (20 * 0.14) % 1 + 1) % 1) / 0.14])) },
  { id: 'mast', member: 'mast_01', states: [['apply', 1], ['secure', 8], ['tighten', 22]] },
  { id: 'odysseus', member: 'odysseus_01', states: [['longing', 8], ['straining', 16], ['subdued', 22]] },
];
/* The close shots: Halfworld's camera never enlarges pixels, it re-stages the whole field larger and crops it ("all shots are
   crops of the live restaged field", README section 6), so each close shot is the full stage drawn `zoom` times larger at a
   scene time, cropped to one BEFLIX frame about a centre given in wide-shot cells: opaque plates, every cast member in place. */
const SHOTS = [
  { id: 'cu_odysseus', centre: [126, 96], zoom: 3, states: [['longing', 8], ['straining', 16], ['subdued', 22]] },
  { id: 'cu_sirens', centre: [60, 50], zoom: 2.6, states: [['full', 8], ['fading', 24.2]] },
  { id: 'mcu_crew', centre: [180, 100], zoom: 2.2, states: [0, 1, 2, 3, 4, 5, 6, 7].map(k => ['stroke' + k, k / 8 / 0.14]) },
];

const PAGE = `<!doctype html><meta charset="utf-8"><body><script type="module">
import mod from '/scenes/OD-B12-S03.mjs';
window.__bake = async (jobs, W, H, K) => {
  const out = [];
  const cast = mod.cast.slice();
  for (const j of jobs) {
    const w = Math.round(W * (j.wide || 1)) * K, h = H * K;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true });
    if (j.zoom) {
      /* a close shot: the whole stage, zoom times larger, cropped about the centre */
      const z = j.zoom, big = document.createElement('canvas'); big.width = Math.round(W * K * z); big.height = Math.round(H * K * z);
      const bg = big.getContext('2d'); bg.fillStyle = '#ffffff'; bg.fillRect(0, 0, big.width, big.height);
      mod.stage(bg, big.width, big.height, j.t);
      const sx = Math.max(0, Math.min(big.width - w, j.centre[0] * K * z - w / 2)), sy = Math.max(0, Math.min(big.height - h, j.centre[1] * K * z - h / 2));
      g.drawImage(big, sx, sy, w, h, 0, 0, w, h);
    } else {
      mod.cast = cast.filter(c => c.instance === j.member);
      mod.stage(g, w, h, j.t);
      mod.cast = cast;
    }
    const d = g.getImageData(0, 0, w, h).data, cw = w / K, cells = new Uint8Array(cw * H);
    for (let cy = 0; cy < H; cy++) for (let cx = 0; cx < cw; cx++) {
      let a = 0, dk = 0, mx = 0;
      for (let y = 0; y < K; y++) for (let x = 0; x < K; x++) {
        const i = ((cy * K + y) * w + cx * K + x) * 4, al = d[i + 3] / 255;
        const lum = (d[i] * .299 + d[i + 1] * .587 + d[i + 2] * .114) / 255;
        const dd = (1 - lum) * al; a += al; dk += dd; if (dd > mx) mx = dd;
      }
      a /= K * K;
      /* a cell's darkness: the mean over its pixels, lifted toward its darkest so a contour thinner than a cell survives */
      const mean = a > 0 ? dk / (K * K) / a : 0, v = Math.max(mean, mx * 0.72);
      cells[cy * cw + cx] = a < 0.5 ? 8 : Math.max(0, Math.min(7, Math.round(v * 7)));
    }
    out.push({ w: cw, h: H, cells: Array.from(cells), png: cv.toDataURL('image/png') });
  }
  return out;
};
window.__ready = true;
</script>`;

const MIME = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.json': 'application/json', '.html': 'text/html', '.png': 'image/png' };
const srv = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/__bake.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
    const f = path.resolve(HW, '.' + p);
    if (!f.startsWith(HW + path.sep)) { res.writeHead(403); return res.end(); }
    const body = await readFile(f); res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(body);
  } catch (e) { res.writeHead(404); res.end(String(e.message)); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage();
page.on('requestfailed', r => console.error('  [page] failed', r.url()));
page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) console.error('  [page]', r.status(), r.url()); });
page.on('pageerror', e => console.error('  [page error]', e.message));

/* run-length code: a run of one value (0-8), up to 128 long, as two base-36 characters: code = length * 9 + value (<= 1160 < 1296) */
function encodeRuns(cells) {
  let s = '';
  for (let i = 0; i < cells.length;) {
    let j = i; while (j < cells.length && cells[j] === cells[i] && j - i < 128) j++;
    s += ((j - i) * 9 + cells[i]).toString(36).padStart(2, '0'); i = j;
  }
  return s;
}
function crop(cells, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cells[y * w + x] !== 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return { x: 0, y: 0, w: 0, h: 0, cells: [] };
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, out = new Array(cw * ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) out[y * cw + x] = cells[(y + y0) * w + x + x0];
  return { x: x0, y: y0, w: cw, h: ch, cells: out };
}

const renders = path.join(here, 'renders', 'bake'); fs.mkdirSync(renders, { recursive: true });
const doc = {
  note: 'Halfworld OD-B12-S03 (The Sirens\' Song) baked into BEFLIX mosaics by tools/bake_halfworld.mjs: the scene\'s own stage() per cast member at the scene times named, reduced to 252 x 184 cells of ink 0-7 (8: nothing painted), cropped to the ink, run-length coded.',
  source: 'odyssey-halfworld scenes/OD-B12-S03.mjs', mosaic: [W, H], cellPixels: K, layers: {}
};
for (const L of LAYERS) {
  const jobs = L.states.map(([key, t]) => ({ member: L.member, t, wide: L.wide || 1 }));
  /* one fresh page per state: the engine caches a keyed cutout by id, pose, band, mode and t, not by an ensemble's own
     channels (the crew's stroke, the song's intensity), so a second state in the same page would return the first */
  const res = [];
  for (const j of jobs) {
    await page.goto(`http://127.0.0.1:${srv.address().port}/__bake.html`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
    res.push(...await page.evaluate(([jobs, W, H, K]) => window.__bake(jobs, W, H, K), [[j], W, H, K]));
  }
  doc.layers[L.id] = { member: L.member, states: {} };
  res.forEach((r, n) => {
    const [key, t] = L.states[n], c = crop(r.cells, r.w, r.h);
    doc.layers[L.id].states[key] = { t: Math.round(t * 1000) / 1000, x: c.x, y: c.y, w: c.w, h: c.h, runs: encodeRuns(c.cells) };
    fs.writeFileSync(path.join(renders, `${L.id}-${key}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(renders, `${L.id}-${key}.cells.json`), JSON.stringify({ w: r.w, h: r.h, cells: r.cells }));
    console.log(`${L.id}.${key} (t ${t.toFixed(2)}): ${c.w}x${c.h} at ${c.x},${c.y} · ${doc.layers[L.id].states[key].runs.length / 2} runs`);
  });
}
for (const S of SHOTS) {
  doc.layers[S.id] = { shot: { centre: S.centre, zoom: S.zoom }, states: {} };
  for (const [key, t] of S.states) {
    await page.goto(`http://127.0.0.1:${srv.address().port}/__bake.html`);
    await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
    const [r] = await page.evaluate(([jobs, W, H, K]) => window.__bake(jobs, W, H, K), [[{ t, zoom: S.zoom, centre: S.centre }], W, H, K]);
    const c = crop(r.cells, r.w, r.h);
    doc.layers[S.id].states[key] = { t: Math.round(t * 1000) / 1000, x: c.x, y: c.y, w: c.w, h: c.h, runs: encodeRuns(c.cells) };
    fs.writeFileSync(path.join(renders, `${S.id}-${key}.png`), Buffer.from(r.png.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(renders, `${S.id}-${key}.cells.json`), JSON.stringify({ w: r.w, h: r.h, cells: r.cells }));
    console.log(`${S.id}.${key} (t ${t.toFixed(2)}, zoom ${S.zoom}): ${doc.layers[S.id].states[key].runs.length / 2} runs`);
  }
}
await browser.close(); srv.close();
/* one file a layer, so a plate node parses only its own layer at each frame */
const dir = path.join(here, 'assets', 'beflix', 'plates'); fs.mkdirSync(dir, { recursive: true });
for (const [id, layer] of Object.entries(doc.layers)) {
  const file = path.join(dir, id + '.json');
  fs.writeFileSync(file, JSON.stringify({ note: doc.note, source: doc.source, mosaic: doc.mosaic, cellPixels: doc.cellPixels, layers: { [id]: layer } }));
  console.log(`${path.relative(here, file)}: ${(fs.statSync(file).size / 1024).toFixed(1)} KB`);
}
