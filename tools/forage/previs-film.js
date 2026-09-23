#!/usr/bin/env node
/* tools/forage/previs-film.js — scenes of the Odyssey forage recorded as a film: the previs player in odyssey-forage.html
   stepped frame by frame in headless Chromium (no clock: every frame drawn at its time), each beat narrated by espeak-ng
   and each shot held as long as its line takes, a title card for each scene, the frames and the voice muxed by ffmpeg,
   the scenes joined into one cut.

   Serve the repository first: (setsid nohup python3 -m http.server 8899 > /dev/null 2>&1 &)
   NODE_PATH=<playwright@1.56, three@0.128> node tools/forage/previs-film.js OD-B09-S05 OD-B09-S06 ... --name odyssey-cyclops
       [--title 'The Cyclops'] [--fps 12] [--size 960x540] [--out films] [--voice en-gb] [--max-seconds n]
   Writes <out>/<name>.mp4, <out>/<name>.jpg (the poster), <out>/<name>.sheet.jpg (a frame a shot), <out>/<name>.txt (the shot list). */
'use strict';
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..'), args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ids = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').startsWith('--'));
const NAME = opt('name', 'odyssey-film'), TITLE = opt('title', ''), FPS = +opt('fps', 12), [W, H] = opt('size', '960x540').split('x').map(Number), OUT = path.join(ROOT, opt('out', 'films')), VOICE = opt('voice', 'en-gb'), MAXS = +opt('max-seconds', 0);
const BASE = opt('base', 'http://localhost:8899/'), THREE_DIR = path.dirname(require.resolve('three/package.json'));
const FF = opt('ffmpeg', process.env.FFMPEG) || execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const TMP = fs.mkdtempSync(path.join(require('os').tmpdir(), 'previs-film-'));
const say = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const RATE = 22050;
/** A line spoken to a mono 16-bit WAV; returns its samples. */
function speak(text, file) { execFileSync('espeak-ng', ['-v', VOICE, '-s', '148', '-p', '38', '-w', file, text]); return readWav(file); }
function readWav(file) { const b = fs.readFileSync(file); let o = 12, fmt = null; while (o < b.length) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { rate: b.readUInt32LE(o + 12), ch: b.readUInt16LE(o + 10) }; if (id === 'data') { const s = new Int16Array(n / 2); for (let i = 0; i < s.length; i++) s[i] = b.readInt16LE(o + 8 + i * 2); return { rate: fmt.rate, samples: s }; } o += 8 + n; } throw new Error('no data in ' + file); }
function writeWav(file, samples, rate) { const b = Buffer.alloc(44 + samples.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40); for (let i = 0; i < samples.length; i++) b.writeInt16LE(samples[i], 44 + i * 2); fs.writeFileSync(file, b); }
const TITLE_SECONDS = 2.5;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.route('https://cdn.jsdelivr.net/npm/three@0.128.0/**', r => { const f = path.join(THREE_DIR, r.request().url().split('three@0.128.0/')[1]); return fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'application/javascript' }) : r.abort(); });
  page.on('pageerror', e => say('page error:', e.message));
  const parts = [], shotList = [], sheet = [];
  for (const [n, id] of ids.entries()) {
    const pv = JSON.parse(fs.readFileSync(path.join(ROOT, 'odyssey/previs', id + '.json'), 'utf8'));
    /* the voice first: each beat's line, and each shot held for its line (and a breath) */
    const lines = pv.shots.map((s, i) => speak(s.beat, path.join(TMP, `${id}-${i}.wav`)));
    const lens = lines.map(l => l.samples.length / l.rate);
    const timing = []; let t = 0; pv.shots.forEach((s, i) => { const d = Math.max(s.t1 - s.t0, lens[i] + 0.8); timing.push([t, t + d]); t += d; });
    const total = t, audio = new Int16Array(Math.ceil((TITLE_SECONDS + total) * RATE));
    lines.forEach((l, i) => { const at = Math.round((TITLE_SECONDS + timing[i][0] + 0.3) * RATE), step = l.rate / RATE; for (let k = 0; k * step < l.samples.length && at + k < audio.length; k++) audio[at + k] = l.samples[Math.floor(k * step)]; });
    writeWav(path.join(TMP, id + '.wav'), audio, RATE);
    await page.goto(BASE + 'odyssey-forage.html?render=' + encodeURIComponent(id) + '&t=0&film=1', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(i => window.__ready === i, id, { timeout: 180000 });
    /* the previs retimed to the voice: each shot stretched to its line, its walks with it */
    await page.evaluate(timing => { const P = window.__pv(); P.data.shots.forEach((s, i) => { const [a, b] = timing[i], k = (b - a) / (s.t1 - s.t0); for (const m of s.moves) { m.t0 = a + (m.t0 - s.t0) * k; m.t1 = a + (m.t1 - s.t0) * k; } s.t0 = a; s.t1 = b; }); P.data.duration = timing[timing.length - 1][1]; P.dirs = {}; }, timing);
    await page.evaluate(([title, book]) => { const d = document.createElement('div'); d.id = 'titlecard'; d.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;background:rgba(242,241,236,.94);font:700 13px ui-monospace,Menlo,monospace;letter-spacing:.3em;text-transform:uppercase;color:#141414;z-index:99;text-align:center'; d.innerHTML = `<div><div style="color:#e01b1b;margin-bottom:14px">${book}</div><div style="font-size:30px;letter-spacing:.12em">${title}</div></div>`; document.body.appendChild(d); }, [pv.title, (TITLE && n === 0 ? TITLE + ' · ' : '') + 'Odyssey ' + id.replace('OD-', '').replace('-', ' · ')]);
    const file = path.join(TMP, id + '.mp4'), frames = Math.ceil((TITLE_SECONDS + (MAXS ? Math.min(MAXS, total) : total)) * FPS);
    const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', path.join(TMP, id + '.wav'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '96k', '-ar', '44100', '-shortest', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(res => ff.on('close', res));
    say(`${id} ${pv.title}: ${pv.shots.length} shots, ${total.toFixed(1)} s, ${frames} frames`);
    for (let f = 0; f < frames; f++) {
      const tt = f / FPS - TITLE_SECONDS;
      if (tt >= 0 && f === Math.ceil(TITLE_SECONDS * FPS)) await page.evaluate(() => document.getElementById('titlecard').remove());
      await page.evaluate(x => window.__seek(Math.max(0, x)), tt);
      const jpg = await page.screenshot({ type: 'jpeg', quality: 86 });
      if (!ff.stdin.write(jpg)) await new Promise(r => ff.stdin.once('drain', r));
      const si = timing.findIndex(([a, b]) => tt >= a && tt < b); if (si >= 0 && !sheet.some(s => s.id === id && s.i === si) && tt >= (timing[si][0] + timing[si][1]) / 2) { const fjpg = path.join(TMP, `sheet-${id}-${si}.jpg`); fs.writeFileSync(fjpg, jpg); sheet.push({ id, i: si, file: fjpg }); }
      if (f % 120 === 0) say(`  ${id} frame ${f}/${frames}`);
    }
    ff.stdin.end(); await done; parts.push(file);
    shotList.push(`${id} ${pv.title}`, ...pv.shots.map((s, i) => `  ${String(i + 1).padStart(2)} ${(TITLE_SECONDS + timing[i][0]).toFixed(1).padStart(6)}s ${s.camera.kind.padEnd(9)} ${s.beat}`));
  }
  await browser.close();
  /* the cut: the scenes joined, a poster, a sheet of a frame a shot */
  const list = path.join(TMP, 'list.txt'); fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', path.join(OUT, NAME + '.mp4')]);
  if (sheet.length > 1) { fs.copyFileSync(sheet[Math.min(sheet.length - 1, Math.floor(sheet.length / 2))].file, path.join(OUT, NAME + '.jpg'));
    const cols = 5, inputs = sheet.flatMap(s => ['-i', s.file]), rows = Math.ceil(sheet.length / cols);
    const layout = sheet.map((s, i) => `${(i % cols)}*w0_${Math.floor(i / cols)}*h0`).map(x => x.replace(/(\d+)\*w0/, (m, a) => a === '0' ? '0' : Array(+a).fill('w0').join('+')).replace(/(\d+)\*h0/, (m, a) => a === '0' ? '0' : Array(+a).fill('h0').join('+'))).join('|');
    try { execFileSync(FF, ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', sheet.map((s, i) => `[${i}:v]scale=384:216[s${i}]`).join(';') + ';' + sheet.map((s, i) => `[s${i}]`).join('') + `xstack=inputs=${sheet.length}:layout=${layout}:fill=white`, '-frames:v', '1', path.join(OUT, NAME + '.sheet.jpg')]); } catch (e) { say('sheet failed:', e.message.split('\n')[0]); } }
  fs.writeFileSync(path.join(OUT, NAME + '.txt'), `${TITLE || NAME}\n${ids.length} scenes from the Odyssey forage, previs recorded by tools/forage/previs-film.js; narration espeak-ng (${VOICE}).\n\n` + shotList.join('\n') + '\n');
  say('wrote', path.relative(ROOT, path.join(OUT, NAME + '.mp4')));
})();
