#!/usr/bin/env node
/* tools/export-trailer.js — an Odyssey trailer (odyssey/trailers/<id>.json) rendered offline: every shot staged in the Film Butter
   player (film-readymades/odyssey-trailer.js, window.OdysseyTrailer), the frames written to a frame folder, the sound mixed by
   tools/trailer-sound.py, the two muxed.

   node tools/export-trailer.js teaser [--mode full|animatic] [--fps 12] [--size 1280x720] [--out films/trailers/teaser.mp4]
        [--frames <dir>] [--resume] [--shots 2,3] [--stills 3.5,12.2] [--samples 3] [--crf 18] [--doc path.json] [--no-sound] [--kit-rate 4]

   full      every frame at t = i / fps. Shots are grouped by scene so each location is loaded once, whatever the edit's order;
             frames land in <frames>/f00000.jpg by index, so --resume skips what is already drawn (a crashed render restarts
             where it stopped). Then ffmpeg encodes the folder at --fps and muxes the WAV.
   animatic  --samples real frames per shot (start, middle, end of its move: u = 0.06, 0.5, 0.94 of the shot; a CARD or BLACK
             gets one, a brick card three) at --size (default 960x540); tools/trailer-assemble.py then holds each for its share of
             the shot with 0.12 s crossfades, at 24 fps, under the full sound mix.
   --stills  only those trailer times, as <frames>/still-<t>.jpg (for a review or a check before a render).
   KIT shots render the kit card through odyssey-forage.html?render=<card>&studio=dark (tools/forage/look.js's studio camera) at the
             start/middle/end cameras of the move (true renders). Full mode draws a true render per position of the move stepped
             at --kit-rate positions a second (default 4; a 3000-piece kit takes about a minute a render), held between. The kit's camera is shot.camera.kit_view
             {az, el, zoom, at} (degrees; LDraw units), else KITVIEW below; orbit turns az by amount (radians), push/pull scale zoom
             by 1 ± amount, crane moves el by amount x 100 degrees.
   Needs: the repository served on :8899, playwright on NODE_PATH, imageio-ffmpeg (python3). */
'use strict';
const fs = require('fs'), path = require('path'), { spawnSync, execFileSync } = require('child_process');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const VAL = new Set(['--mode', '--fps', '--size', '--out', '--frames', '--shots', '--stills', '--samples', '--crf', '--doc', '--chromium', '--kit-rate']);
const tid = args.find((a, i) => !a.startsWith('--') && !VAL.has(args[i - 1])) || 'teaser';
const ROOT = path.resolve(__dirname, '..'), HW = process.env.ODYSSEY_HALFWORLD || path.join(path.dirname(ROOT), 'odyssey-halfworld');
const mode = opt('mode', 'full'), fps = +opt('fps', 12), [W, H] = opt('size', mode === 'animatic' ? '960x540' : '1280x720').split('x').map(Number);
const docPath = opt('doc', path.join(ROOT, 'odyssey/trailers', tid + '.json')), doc = JSON.parse(fs.readFileSync(docPath, 'utf8'));
const out = path.resolve(opt('out', path.join(ROOT, 'films/trailers', tid + (mode === 'animatic' ? '-animatic' : '') + '.mp4')));
const frames = path.resolve(opt('frames', out.replace(/\.mp4$/, '') + '.frames')), resume = args.includes('--resume');
const onlyShots = opt('shots') ? new Set(opt('shots').split(',').map(Number)) : null, stills = opt('stills') ? opt('stills').split(',').map(Number) : null;
const nSamples = +opt('samples', 3), crf = opt('crf', '18'), kitRate = +opt('kit-rate', 4);
const BASE = 'http://localhost:' + (process.env.PORT || 8899) + '/', chromiumPath = opt('chromium', process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
const FF = (() => { try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } })();
const t0 = Date.now(), say = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
fs.mkdirSync(frames, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });

/* the kit cameras for the stills the edit lists name (the studio camera of look.js), chosen by eye against the kit pages' stills */
const KITVIEW = {
  'the-opening/hero.jpg': { card: 'set.the-opening', az: -20, el: 25, zoom: 1.5 },
  'the-opening/turned.jpg': { card: 'set.the-opening-turned', az: 20, el: 35, zoom: 1.5 },
  'bag-of-winds/close.jpg': { card: 'set.bag-of-winds', az: -30, el: 35, zoom: 3.0 },
  'cyclops/headland.jpg': { card: 'set.cyclops-cave-headland', az: 150, el: 22, zoom: 1.8 },
};

/* ── the frames to draw: [{i, t, shot, u, file}] ── */
const shots = doc.shots.filter(s => !onlyShots || onlyShots.has(s.n));
const shotAt = t => doc.shots.find(s => t >= s.at - 1e-9 && t < s.at + s.dur - 1e-9) || doc.shots[doc.shots.length - 1];
let jobs = [];
if (stills) jobs = stills.map(t => { const s = shotAt(t); return { t, shot: s, u: t - s.at, file: path.join(frames, `still-${t.toFixed(2)}.jpg`) }; });
else if (mode === 'animatic') {
  for (const s of shots) {
    const k = s.kind === 'SCENE' || s.kind === 'KIT' || (s.kind === 'CARD' && (s.card || {}).style === 'brick') ? nSamples : 1;
    const us = k === 1 ? [s.kind === 'CARD' ? Math.min(s.dur * 0.5, Math.max(0.6, (s.card.fade_in || 0) + 0.3)) : s.dur * 0.5] : Array.from({ length: k }, (_, j) => s.dur * (k === 2 ? [0.1, 0.9][j] : 0.06 + 0.88 * j / (k - 1)));
    us.forEach((u, j) => jobs.push({ t: s.at + u, shot: s, u, j, of: us.length, file: path.join(frames, `s${String(s.n).padStart(2, '0')}-${j}.jpg`) }));
  }
} else {
  const N = Math.round(doc.runtime * fps);
  for (let i = 0; i < N; i++) { const t = i / fps, s = shotAt(t + 1e-6); if (onlyShots && !onlyShots.has(s.n)) continue; jobs.push({ i, t, shot: s, u: t - s.at, file: path.join(frames, `f${String(i).padStart(5, '0')}.jpg`) }); }
}
/*[motion]*/ /* optics (film-readymades/motion.js): a shot's `transition` {type: dissolve|double|fade, dur} in from the shot before, and its
   `transition_out` {type: fade, dur} to black. A frame inside one is drawn as layers (the outgoing shot run on past its end, the
   incoming at its head) into <frames>/layers and composited after; a film that names no optics draws exactly the jobs it did. */
const { draws, comps } = optics(jobs);
function optics(jobs) {
  if (mode === 'animatic' || !doc.shots.some(s => s.transition || s.transition_out)) return { draws: jobs, comps: [] };
  const byAt = [...doc.shots].sort((a, b) => a.at - b.at), prevOf = s => byAt[byAt.indexOf(s) - 1] || null, L = path.join(frames, 'layers'); fs.mkdirSync(L, { recursive: true });
  const nOf = tr => Math.max(1, Math.round(tr.frames || (tr.dur || 0.5) * fps)), ease = x => x * x * (3 - 2 * x), wAt = (k, n) => ease((k + 0.5) / n);
  const draws = [], comps = [];
  for (const j of jobs) {
    const s = j.shot, tr = s.transition, to = s.transition_out, prev = prevOf(s), layer = (sh, u, tag) => ({ t: j.t, i: j.i, shot: sh, u, file: path.join(L, path.basename(j.file).replace(/\.jpg$/, '-' + tag + '.jpg')), final: j.file });
    let c = null;
    if (tr && (tr.type === 'dissolve' || tr.type === 'double') && prev && prev.kind !== 'KIT' && s.kind !== 'KIT') { const n = nOf(tr), k = Math.floor(j.u * fps + 1e-6);
      if (k < n) c = { job: j, op: tr.type, w: wAt(k, n), strength: tr.strength, resolve: tr.resolve, a: layer(prev, j.t - prev.at, 'out'), b: layer(s, j.u, 'in') }; }
    if (!c && tr && (tr.type === 'fade' || tr.type === 'black')) { const n = nOf(tr), k = Math.floor(j.u * fps + 1e-6); if (k < n) c = { job: j, op: 'fade', w: 1 - wAt(k, n), a: layer(s, j.u, 'in') }; }
    if (!c && to && (to.type === 'fade' || to.type === 'black')) { const n = nOf(to), k = Math.floor((s.dur - j.u) * fps - 1e-6); if (k < n) c = { job: j, op: 'fade', w: 1 - wAt(k, n), a: layer(s, j.u, 'in') }; }
    if (!c) { draws.push(j); continue; }
    comps.push(c); draws.push(c.a); if (c.b) draws.push(c.b);
  }
  say('optics:', comps.length, 'frames composited');
  return { draws, comps };
}
async function composite(browser) {
  if (!comps.length) return;
  const cp = await browser.newPage(); const THREE_DIR = path.dirname(require.resolve('three/package.json'));
  await cp.addScriptTag({ path: path.join(THREE_DIR, 'build/three.min.js') }); await cp.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'film-readymades/motion.js'), 'utf8') });
  for (const c of comps) { if (resume && fs.existsSync(c.job.file) && !fs.existsSync(c.a.file)) continue; const rd = f => fs.readFileSync(f).toString('base64');
    const out = await cp.evaluate(o => OdysseyMotion.composite(o), { op: c.op, w: c.w, strength: c.strength, resolve: c.resolve, a: rd(c.a.file), b: c.b ? rd(c.b.file) : null, quality: 0.92 });
    fs.writeFileSync(c.job.file, Buffer.from(out, 'base64')); }
  await cp.close(); say('composited', comps.length, 'frames');
}
/*[/motion]*/
const todo = draws.filter(j => !(resume && fs.existsSync(j.final || j.file)));
say(tid, mode, `${W}x${H}`, mode === 'full' ? fps + ' fps' : '', jobs.length, 'frames,', todo.length, 'to draw');

/* the voice clip's envelope (world/face.js envelopeOf: 50 Hz RMS, normalised to its 95th percentile) for the lips */
const manifest = JSON.parse(fs.readFileSync(path.join(HW, 'drive/voice-manifest.json'), 'utf8'));
function envelope(v) {
  const seg = manifest[v.scene].segments.find(g => g.gi === v.gi), a = seg.start + v.clip.in, d = v.clip.out - v.clip.in;
  const raw = execFileSync(FF, ['-v', 'error', '-ss', a.toFixed(3), '-t', d.toFixed(3), '-i', path.join(HW, manifest[v.scene].file), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4), n = 320, e = [];
  for (let i = 0; i + n <= x.length; i += n) { let s = 0; for (let j = 0; j < n; j++) s += x[i + j] * x[i + j]; e.push(Math.sqrt(s / n)); }
  const top = [...e].sort((p, q) => p - q)[Math.floor(e.length * 0.95)] || 1; return e.map(v => +Math.min(1, v / top).toFixed(3));
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: chromiumPath, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const timing = { scene: 0, kit: 0, card: 0, frames: 0, loads: 0 };
  const byKind = k => todo.filter(j => j.shot.kind === k);
  /* ── the player: SCENE, CARD and BLACK ── */
  const need = todo.filter(j => j.shot.kind !== 'KIT');
  if (need.length) {
    const page = await browser.newPage({ viewport: { width: W, height: H } }); page.setDefaultTimeout(900000);
    page.on('pageerror', e => say('page error', e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) say('console', m.text().slice(0, 200)); });
    await page.goto(BASE + 'film-readymades/production/Film-Butter-Odyssey.html', { timeout: 900000 });
    await page.waitForFunction(() => window.ButterLocation && window.ButterFilms?.current && !ButterFilms.busy && ButterCast.cast.length, null, { timeout: 900000 });
    await page.evaluate(() => { document.body.classList.add('kf'); const st = document.createElement('style'); st.textContent = 'body.kf header,body.kf .topbar,body.kf footer,body.kf nav,body.kf #filmWorldTools{visibility:hidden!important}'; document.head.appendChild(st); });
    /* the runtime from the working tree, so an edit needs no re-patch of the player */
    await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'film-readymades/odyssey-trailer.js'), 'utf8') });
    /*[motion]*/ if (fs.existsSync(path.join(ROOT, 'film-readymades/motion.js'))) await page.addScriptTag({ content: fs.readFileSync(path.join(ROOT, 'film-readymades/motion.js'), 'utf8') }); /*[/motion]*/
    await page.evaluate(o => OdysseyTrailer.start(o), { w: W, h: H, grade: doc.grade || null });
    say('player ready');
    const put = (j, r) => { fs.writeFileSync(j.file, Buffer.from(r.jpeg, 'base64')); timing.frames++; };
    // cards and black first: they need no location
    for (const j of need.filter(j => j.shot.kind === 'CARD' || j.shot.kind === 'BLACK')) { const m = Date.now(); put(j, await page.evaluate(({ s, u }) => OdysseyTrailer.card(s, u, { quality: 0.92 }), { s: j.shot, u: j.u })); timing.card += Date.now() - m; }
    // the scenes, each location loaded once, in the order the edit first reaches them
    const scenes = [...new Set(need.filter(j => j.shot.kind === 'SCENE').map(j => j.shot.scene))];
    for (const sid of scenes) {
      const loc = 'odyssey-' + sid.toLowerCase(); let m = Date.now();
      if ((await page.evaluate(() => ButterFilms.current.sourceId)) !== loc) {
        await page.evaluate(() => OdysseyTrailer.end());
        await page.evaluate(id => { const t = ButterFilms.records.find(r => r.id === id).title, o = [...document.querySelectorAll('#versionSelect option')].find(o => o.textContent.trim() === t); return ButterFilms.switchTo(o.value); }, loc);
        await page.waitForFunction(id => ButterFilms.current?.sourceId === id && !ButterFilms.busy && ButterCast.cast.length, loc, { timeout: 600000 });
        await page.evaluate(o => OdysseyTrailer.start(o), { w: W, h: H, grade: doc.grade || null });
      }
      const li = await page.evaluate(sid => OdysseyTrailer.location(sid), sid); timing.loads += Date.now() - m;
      say('location', sid, 'faces', li.faces.join(','), ((Date.now() - m) / 1000).toFixed(1) + ' s');
      const js = need.filter(j => j.shot.kind === 'SCENE' && j.shot.scene === sid), inShots = [...new Set(js.map(j => j.shot))];
      for (const s of inShots) {
        m = Date.now(); const env = s.voice ? envelope(s.voice) : null;
        const si = await page.evaluate(({ s, env }) => OdysseyTrailer.shot(s, { env, hz: 50 }), { s, env });
        say(`  shot ${s.n} ${sid} ${s.key} ${((s.camera || {}).move || {}).type || ''}`, si.speaker ? 'speaker ' + si.speaker : '', 'staged in', ((Date.now() - m) / 1000).toFixed(1), 's; cam', JSON.stringify(si.cam));
        let k = 0;
        for (const j of js.filter(j => j.shot === s)) {
          const m2 = Date.now(), r = await page.evaluate(u => OdysseyTrailer.frame(u, { quality: 0.92 }), j.u); put(j, r); timing.scene += Date.now() - m2;
          if (++k % 24 === 0) say(`    frame ${k} of ${js.filter(q => q.shot === s).length} (u ${j.u.toFixed(2)}) ms ${r.ms.join('/')}; drawn ${timing.frames} of ${todo.length}, wall ${((Date.now() - t0) / 60000).toFixed(1)} min`);
        }
      }
    }
    await page.close();
  }
  /* ── the kits: the forage page's studio ── */
  const kits = byKind('KIT');
  if (kits.length) {
    const kp = await browser.newPage({ viewport: { width: W, height: H } }); kp.setDefaultTimeout(900000);
    const THREE_DIR = path.dirname(require.resolve('three/package.json'));
    await kp.route('https://cdn.jsdelivr.net/npm/three@0.128.0/**', r => { const rel = r.request().url().split('three@0.128.0/')[1]; const f = path.join(THREE_DIR, rel); return fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'application/javascript' }) : r.abort(); });
    const drawn = new Map();   /* one render per distinct camera (a stepped move repeats positions) */
    for (const j of kits) {
      const s = j.shot, cam = kitCam(s, j.u), key = JSON.stringify(cam);
      if (drawn.has(key)) { fs.copyFileSync(drawn.get(key), j.file); continue; }
      const m = Date.now(), url = BASE + 'odyssey-forage.html?render=' + encodeURIComponent(cam.card) + '&studio=dark&az=' + cam.az.toFixed(2) + '&el=' + cam.el.toFixed(2) + '&zoom=' + cam.zoom.toFixed(3) + (cam.at ? '&at=' + cam.at.join(',') : '');
      await kp.goto(url, { waitUntil: 'domcontentloaded' }); await kp.waitForFunction(i => window.__ready === i, cam.card, { timeout: 600000 }); await kp.waitForTimeout(250);
      await kp.screenshot({ path: j.file, type: 'jpeg', quality: 92, timeout: 300000 }); drawn.set(key, j.file); timing.kit += Date.now() - m; timing.frames++;
      say(`  kit shot ${s.n} ${cam.card} az ${cam.az.toFixed(1)} el ${cam.el.toFixed(1)} zoom ${cam.zoom.toFixed(2)} in ${((Date.now() - m) / 1000).toFixed(1)} s`);
    }
    await kp.close();
  }
  /*[motion]*/ await composite(browser); /*[/motion]*/
  await browser.close();
  say('drawn', timing.frames, 'frames; scene', (timing.scene / 1000).toFixed(0), 's, locations', (timing.loads / 1000).toFixed(0), 's, kits', (timing.kit / 1000).toFixed(0), 's, cards', (timing.card / 1000).toFixed(0), 's');
  fs.writeFileSync(path.join(frames, 'jobs.json'), JSON.stringify({ tid, mode, fps, size: [W, H], runtime: doc.runtime, timing, jobs: jobs.map(j => ({ file: path.basename(j.file), t: j.t, u: j.u, n: j.shot.n, kind: j.shot.kind, at: j.shot.at, dur: j.shot.dur, j: j.j, of: j.of })) }, null, 1));
  if (stills) return;
  /* ── the sound, then the film ── */
  const wav = out.replace(/\.mp4$/, '.wav');
  if (!args.includes('--no-sound')) { const r = spawnSync('python3', [path.join(ROOT, 'tools/trailer-sound.py'), tid, '--doc', docPath, '--out', wav], { stdio: 'inherit' }); if (r.status) throw Error('sound failed'); }
  if (mode === 'animatic') {
    const r = spawnSync('python3', [path.join(ROOT, 'tools/trailer-assemble.py'), path.join(frames, 'jobs.json'), wav, out], { stdio: 'inherit' }); if (r.status) throw Error('assemble failed');
  } else {
    const v = out.replace(/\.mp4$/, '.video.mp4');
    execFileSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(frames, 'f%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-r', String(fps), v]);
    /*[motion]*/ if (args.includes('--no-sound') || !fs.existsSync(wav)) fs.renameSync(v, out); else /*[/motion]*/ { execFileSync(FF, ['-y', '-loglevel', 'error', '-i', v, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-t', doc.runtime.toFixed(3), '-movflags', '+faststart', out]);
    fs.unlinkSync(v); }
  }
  say('done:', out, (fs.statSync(out).size / 1048576).toFixed(1), 'MB in', ((Date.now() - t0) / 60000).toFixed(1), 'min');
}

/* a kit shot's studio camera at u seconds into the shot */
function kitCam(s, u) {
  const still = (s.camera || {}).kit_still || (s.still || '').replace(/^\.\.\/kits\//, ''), base = Object.assign({ card: s.kit, az: 35, el: 18, zoom: 1 }, KITVIEW[still] || {}, (s.camera || {}).kit_view || {});
  const mv = (s.camera || {}).move || { type: 'hold', amount: 0 }; const steps = mv.stepped ? Math.min(mv.stepped, kitRate) : mode === 'full' ? kitRate : 0;   /* a kit render is a minute: full mode holds each true render 1/kitRate s */
  let x = Math.max(0, Math.min(1, u / s.dur)); if (steps) x = Math.floor(u * steps) / steps / s.dur;
  const e = mv.ease === 'linear' ? x : x * x * (3 - 2 * x), a = (mv.amount || 0) * e, c = { ...base };
  if (mv.type === 'orbit') c.az = base.az + a * 180 / Math.PI;
  else if (mv.type === 'push') c.zoom = base.zoom * (1 + a); else if (mv.type === 'pull') c.zoom = base.zoom / (1 + a);
  else if (mv.type === 'crane') c.el = base.el + a * 100;
  else if (mv.type === 'track') c.az = base.az + a * 40;
  else c.zoom = base.zoom * (1 + 0.012 * e);
  c.az = Math.round(c.az * 4) / 4; c.el = Math.round(c.el * 4) / 4; c.zoom = Math.round(c.zoom * 500) / 500;   /* quantised: identical cameras share a render */
  return c;
}
main().catch(e => { console.error(e); process.exit(1); });
