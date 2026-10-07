#!/usr/bin/env node
/* tools/sea-test.js — the sea kit's proof shot (film-readymades/odyssey-sea.js), outside the performed films.

   The Sirens' black ship (OD-B12-S03's location, its crew posed by the take's sheet) at sea on the kit's ocean: the camera low by the
   water, then rising and drawing back; dusk going to night, the stars coming out, the moon's path on the swell, the lanterns lit; a
   three-second storm burst at the end (swell x3, clouds, rain, one bolt). Drawn on the take's own renderer (OdysseyTake.frame with a
   camera and a sea of its own: exportStart({sea})), so what it proves is what a scene with look.sea gets.

   node tools/sea-test.js [--fps 12] [--size 1280x720] [--out films/odyssey/tests] [--stills 1,4.5,8,11] [--seconds 12] [--no-storm]
   Needs the repository served on :8899 and playwright on NODE_PATH (as tools/export-odyssey.js). Writes <out>/sea-test.mp4 and .jpg,
   <out>/sea-test.json (frame times, the kit's counts); --stills writes <out>/sea-test-t<s>.jpg and a strip <out>/sea-test-strip.jpg. */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fps = +opt('fps', 12), [W, H] = opt('size', '1280x720').split('x').map(Number), outDir = opt('out', 'films/odyssey/tests'), seconds = +opt('seconds', 12), stills = opt('stills', null);
const SID = 'OD-B12-S03', T0 = 0.5;   /* the take's clock at the shot's start: the crew at the oars */
const ROOT = path.resolve(__dirname, '..'), URL_ = 'http://localhost:' + (process.env.PORT || 8899) + '/film-readymades/production/Film-Butter-Odyssey.html';
const FF = (() => { try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } })();
fs.mkdirSync(outDir, { recursive: true });
const t0 = Date.now(), say = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
const sh = v => v.map(([t, x]) => [+(t + T0).toFixed(3), x]);   /* a track on the shot's clock, put on the take's */
const storm = !args.includes('--no-storm');
/* the sea: dusk to night over the first eight seconds, the stars with it; the storm in the last three */
const SEA = { swell: 1.25, wind: 0.4, dir: 60, foam: 0.5, way: 1.6, sky: ['#3a4a7a', '#f2a36b'], fog: [700, 2600],
  night: sh([[0, 0], [1.5, 0.05], [8, 1]]), moon: { az: 38, el: 13, size: 7 }, oars: { sweep: 16, period: 2.4, dip: 0.5 },
  sail: { at: [-17, 128], y0: 140, y1: 232, width: 8, depth: 3 },
  storm: storm ? sh([[0, 0], [8.8, 0], [10.2, 1]]) : 0, strikes: storm ? [+(10.9 + T0).toFixed(3)] : [] };
/* the camera: low by the water off the port quarter, then rising and drawing back over the ship */
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }, L = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
function camAt(t) { const u = sm((t - 3) / 7);
  return { pos: L(L([-300, 26, 400], [-310, 29, 390], sm(t / 3)), [-470, 250, 620], u), target: L([-17, 52, 112], [-10, 62, 30], u), fov: 40 }; }

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } }); page.setDefaultTimeout(900000);
  page.on('pageerror', e => say('page error', e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) say('console', m.text().slice(0, 300)); if (/^\[(take|sea)\]/.test(m.text())) say(m.text().slice(0, 400)); });
  await page.goto(URL_, { timeout: 900000 });
  await page.waitForFunction(() => window.ButterLocation && window.ButterFilms?.current && !ButterFilms.busy && ButterCast.cast.length, null, { timeout: 900000 });
  const loc = 'odyssey-' + SID.toLowerCase();
  if ((await page.evaluate(() => ButterFilms.current.sourceId)) !== loc) {
    await page.evaluate(id => { const t = ButterFilms.records.find(r => r.id === id).title, o = [...document.querySelectorAll('#versionSelect option')].find(o => o.textContent.trim() === t); return ButterFilms.switchTo(o.value); }, loc);
    await page.waitForFunction(id => ButterFilms.current?.sourceId === id && !ButterFilms.busy && ButterCast.cast.length, loc, { timeout: 300000 }); }
  await page.evaluate(() => { document.body.classList.add('kf'); const st = document.createElement('style'); st.textContent = 'body.kf header,body.kf .topbar,body.kf footer,body.kf nav,body.kf #filmWorldTools{visibility:hidden!important}'; document.head.appendChild(st); });
  await page.waitForTimeout(800);
  const info = await page.evaluate(o => OdysseyTake.exportStart(o).then(i => ({ total: i.total, keys: i.keys })), { mode: 'cut', w: W, h: H, sea: SEA, shots: false });
  say('take', JSON.stringify(info).slice(0, 300), 'sea', JSON.stringify(await page.evaluate(() => OdysseyTake.sea())).slice(0, 400));
  const draw = async t => page.evaluate(([ts, cam]) => { const r = OdysseyTake.frame(ts, { cam, captions: false, quality: 0.9 }); return { jpeg: r.jpeg, ms: r.ms, sea: OdysseyTake.sea() }; }, [T0 + t, camAt(t)]);
  const ms = [];
  if (stills) {
    const list = stills.split(',').map(Number), files = [];
    for (const s of list) { const r = await draw(s); const f = path.join(outDir, `sea-test-t${s.toFixed(1)}.jpg`); fs.writeFileSync(f, Buffer.from(r.jpeg, 'base64')); files.push(f); say('still', f, 'ms', r.ms.join('/'), JSON.stringify(r.sea && { drawn: r.sea.drawn, foam: r.sea.foam, glints: r.sea.glints, stars: r.sea.stars, rain: r.sea.rain, clouds: r.sea.clouds, strike: r.sea.strike })); }
    await browser.close();
    const n = files.length, inputs = files.flatMap(f => ['-i', f]);
    execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', files.map((f, i) => `[${i}:v]scale=640:360[v${i}]`).join(';') + ';' + files.map((f, i) => `[v${i}]`).join('') + `xstack=inputs=${n}:layout=` + files.map((f, i) => `${(i % 2) * 640}_${Math.floor(i / 2) * 360}`).join('|'), path.join(outDir, 'sea-test-strip.jpg')]);
    say('strip', path.join(outDir, 'sea-test-strip.jpg')); return; }
  const FD = path.join(outDir, 'sea-test.frames'); fs.mkdirSync(FD, { recursive: true });
  const frames = Math.round(seconds * fps); let stats = null;
  for (let i = 0; i < frames; i++) { const f = path.join(FD, String(i).padStart(5, '0') + '.jpg'); if (fs.existsSync(f) && fs.statSync(f).size > 0) continue;
    const a = Date.now(), r = await draw(i / fps); fs.writeFileSync(f, Buffer.from(r.jpeg, 'base64')); ms.push(Date.now() - a); stats = r.sea;
    if (i % 12 === 0) say('frame', i, 'of', frames, 'wall ms', Date.now() - a, 'apply/render/encode', r.ms.join('/')); }
  const poster = await draw(9.0); fs.writeFileSync(path.join(outDir, 'sea-test.jpg'), Buffer.from(poster.jpeg, 'base64'));
  await browser.close();
  execFileSync(FF, ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(FD, '%05d.jpg'), '-frames:v', String(frames), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', path.join(outDir, 'sea-test.mp4')]);
  const mean = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : null;
  fs.writeFileSync(path.join(outDir, 'sea-test.json'), JSON.stringify({ scene: SID, location: loc, fps, size: [W, H], seconds, frames, takeClockAt: T0, sea: SEA, camera: 'camAt(t) in tools/sea-test.js', frameWallMs: { mean: mean && Math.round(mean), max: ms.length ? Math.max(...ms) : null, n: ms.length }, kit: stats }, null, 1));
  if (!args.includes('--keep-frames')) fs.rmSync(FD, { recursive: true, force: true });
  say('done', path.join(outDir, 'sea-test.mp4'), 'mean frame', mean && Math.round(mean), 'ms');
})().catch(e => { console.error(e); process.exit(1); });
