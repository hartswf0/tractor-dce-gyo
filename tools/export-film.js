#!/usr/bin/env node
/* tools/export-film.js — a film rendered offline into an mp4: the page stepped one frame at a time in headless
   Chromium (no real-time clock, every frame drawn), the frames piped to ffmpeg as JPEGs, the film's sound log
   rendered afterwards by the page into a WAV and muxed in.

   node tools/export-film.js endor-bikes [--fps 12] [--size 960x540] [--out films] [--crf 24]
       [--url http://localhost:8899/word-to-momento.html] [--query 'at=45.0,-1.0&name=Mock%20City&noloc&sky=day&ground=real']
       [--mock /path/to/mocks.js] [--chromium /path/to/chrome] [--ffmpeg /path/to/ffmpeg] [--max-frames n]

   Needs: a static server on the repo root (python3 -m http.server 8899), `playwright` resolvable (NODE_PATH),
   an ffmpeg with libx264 and aac (pip install imageio-ffmpeg gives one; --ffmpeg or FFMPEG override).
   --mock installs the test harness's network mocks (a synthetic place) instead of the live map services.
   Writes <out>/<film>.mp4, <out>/<film>.jpg (a poster), <out>/<film>.mento.txt (the film's text), <out>/<film>.wav (the sound). */
'use strict';
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const args = process.argv.slice(2), film = args.find(a => !a.startsWith('--')) || 'endor-bikes';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const fps = +opt('fps', 12), [w, h] = opt('size', '960x540').split('x').map(Number), out = opt('out', 'films'), crf = opt('crf', '24'), maxFrames = +opt('max-frames', 0);
const url = opt('url', 'http://localhost:' + (process.env.PORT || 8899) + '/word-to-momento.html'), query = opt('query', 'at=45.0,-1.0&name=Mock%20City&noloc&sky=day&quality=high&ground=real');
const chromiumPath = opt('chromium', process.env.CHROMIUM || undefined), mockPath = opt('mock', process.env.MOCKS || null);
function ffmpegPath() { const o = opt('ffmpeg', process.env.FFMPEG); if (o) return o; try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } }
const FF = ffmpegPath(); fs.mkdirSync(out, { recursive: true });
const t0 = Date.now(), say = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: chromiumPath, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--mute-audio'] });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  if (mockPath) { const mocks = require(path.resolve(mockPath)); await ctx.route('**/cdn.jsdelivr.net/**', r => { const u = r.request().url(); try { if (/three\.min\.js/.test(u)) return r.fulfill({ path: require.resolve('three/build/three.min.js') }); if (/OrbitControls/.test(u)) return r.fulfill({ path: require.resolve('three/examples/js/controls/OrbitControls.js') }); } catch (e) { } return r.fulfill({ contentType: 'application/javascript', body: '' }); }); await mocks.routes(ctx); }
  const page = await ctx.newPage(); page.setDefaultTimeout(300000);
  page.on('pageerror', e => say('page error', e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) say('console', m.text().slice(0, 160)); });
  const prog = await page.evaluate(() => null).catch(() => null); void prog;
  await page.goto(url + '?' + query + '&film=' + film + '&export');
  await page.waitForFunction(() => window.__world && window.__world.ready);
  say('world ready; the film', film);
  await page.evaluate(() => { try { localStorage.removeItem('openai_api_key'); } catch (e) { } });
  for (let i = 0; i < 400; i++) { const st = await page.evaluate(() => { const W = window.__world, F = W.film; return { n: F ? F.shots.length : 0, scene: !F || !F.scene ? null : F.scene.ready, actors: F ? [...F.actors.values()].every(a => !!(a.it && a.it.ready) || !!a.crowd || !!a.rig) : true, relanding: W.relanding }; }); if (st.n && (st.scene === null || st.scene) && st.actors && !st.relanding) break; await new Promise(r => setTimeout(r, 250)); }
  await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));
  const info = await page.evaluate(() => window.__world.exportStart({ fps: +document.body.dataset.fps || undefined, w: innerWidth, h: innerHeight }));
  say('shots', info.shots, 'seconds', info.total.toFixed(1), 'at', fps, 'fps');
  await page.evaluate(f => { window.__world.exporting.fps = f; }, fps);
  const base = path.join(out, film), video = base + '.video.mp4';
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', video], { stdio: ['pipe', 'inherit', 'inherit'] });
  let frames = 0, held = 0, poster = null, lastShot = -1;
  for (;;) {
    const r = await page.evaluate(() => window.__world.exportFrame());
    if (!r) break;
    if (r.held) { held++; await new Promise(res => setTimeout(res, 120)); if (held % 50 === 0) say('holding:', r.why); continue; }
    const buf = Buffer.from(r.jpeg, 'base64'); if (!ff.stdin.write(buf)) await new Promise(res => ff.stdin.once('drain', res)); frames++;
    if (frames === Math.min(24, Math.max(2, Math.round(fps * 2))) || (r.shot === 2 && !poster)) poster = buf;
    if (r.shot !== lastShot) { lastShot = r.shot; say('shot', r.shot + 1, 'of', info.shots, 'at', r.t.toFixed(1), 's', 'frame', frames); }
    if (frames % 100 === 0) say('frame', frames, 'film time', r.t.toFixed(1), 's', 'wall', ((Date.now() - t0) / 1000 / 60).toFixed(1), 'min');
    if (r.done || (maxFrames && frames >= maxFrames)) break;
  }
  ff.stdin.end(); await new Promise(res => ff.on('close', res)); say('video', frames, 'frames written to', video);
  if (poster) fs.writeFileSync(base + '.jpg', poster);
  const text = await page.evaluate(() => window.__world.filmText()); fs.writeFileSync(base + '.mento.txt', text);
  // the sound, rendered whole by the page
  const a = await page.evaluate(() => window.__world.exportAudio()); say('audio', a && a.sec && a.sec.toFixed(1), 's', a && a.events, 'events', a && a.curves, 'curves', a && a.cues, 'cues');
  const wav = base + '.wav', fd = fs.openSync(wav, 'w'); for (let i = 0; ; i++) { const b64 = await page.evaluate(i => window.__world.exportAudioChunk(i), i); if (!b64) break; fs.writeSync(fd, Buffer.from(b64, 'base64')); } fs.closeSync(fd);
  await page.evaluate(() => window.__world.exportEnd()); await browser.close();
  const secs = frames / fps;
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', video, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-t', String(secs + 0.5), base + '.mp4']);
  fs.unlinkSync(video);
  const size = fs.statSync(base + '.mp4').size; say('done:', base + '.mp4', (size / 1048576).toFixed(1), 'MB', secs.toFixed(1), 's', 'in', ((Date.now() - t0) / 60000).toFixed(1), 'min');
})().catch(e => { console.error(e); process.exit(1); });
