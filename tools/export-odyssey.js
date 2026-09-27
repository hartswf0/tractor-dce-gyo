#!/usr/bin/env node
/* tools/export-odyssey.js — an Odyssey scene of Film Butter rendered offline as voiced film.

   The player (film-readymades/production/Film-Butter-Odyssey.html) is opened headless, switched to the scene's location, and
   put in take mode (film-readymades/odyssey-take.js): the page's own drawing is stopped, as the keyframe gate stops it, and
   every frame is posed and drawn on request at t = i / fps, so the film does not depend on how fast swiftshader draws.
   The frames go to ffmpeg as JPEGs; the page's sound log (the voice clips on the take's clock, the book's bed and its duck
   law) is rendered here into a WAV of exactly the video's length and muxed in. Also writes a poster and a WebVTT caption file.

   node tools/export-odyssey.js OD-B01-S03 [--mode full|cut] [--fps 24] [--size 1280x720] [--out films/odyssey] [--crf 20]
        [--from s] [--to s] [--stills 5,20.5,44] [--chromium path] [--ffmpeg path]
   --stills renders only those times, as <out>/<scene>[-cut]-t<time>.jpg, for checking a take before a whole render.

   Needs the repository served on :8899 (python3 -m http.server 8899), playwright on NODE_PATH, an ffmpeg with libx264 and aac
   (imageio-ffmpeg's). Writes <out>/<scene>[-cut].mp4, .jpg (poster), .vtt (captions), .json (the take's plan and timings). */
'use strict';
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const args = process.argv.slice(2), sid = args.find(a => !a.startsWith('--') && /^OD-B\d\d-S\d\d$/.test(a)) || 'OD-B01-S03';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const mode = opt('mode', 'full'), fps = +opt('fps', 24), [W, H] = opt('size', '1280x720').split('x').map(Number), outDir = opt('out', 'films/odyssey'), crf = opt('crf', '20');
const from = +opt('from', 0), to = opt('to', null), stills = opt('stills', null);
const ROOT = path.resolve(__dirname, '..'), URL_ = 'http://localhost:' + (process.env.PORT || 8899) + '/film-readymades/production/Film-Butter-Odyssey.html';
const chromiumPath = opt('chromium', process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
function ffmpegPath() { const o = opt('ffmpeg', process.env.FFMPEG); if (o) return o; try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } }
const FF = ffmpegPath(); fs.mkdirSync(outDir, { recursive: true });
const base = path.join(outDir, sid + (mode === 'cut' ? '-cut' : ''));
const t0 = Date.now(), say = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
const SR = 48000;

/* the sound log rendered: the voice clips laid on the clock, the bed looped from its place in the book, under the duck law */
function decode(file) { const raw = execFileSync(FF, ['-v', 'error', '-i', file, '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 }); return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4); }
function renderSound(log, seconds) {
  const n = Math.round(seconds * SR), out = new Float32Array(n * 2), voice = decode(path.join(ROOT, log.voice.file)), bed = decode(path.join(ROOT, log.bed.file));
  const vn = voice.length / 2, bn = bed.length / 2, edge = Math.round(0.012 * SR);   /* a cut clip gets 12 ms edges so the splice does not click */
  for (const c of log.voice.clips) { const a = Math.round(c.at * SR), s = Math.round(c.start * SR), d = Math.round(c.dur * SR) + (log.voice.clips.length > 1 ? Math.round(0.08 * SR) : 0);
    for (let i = 0; i < d; i++) { const o = a + i, v = s + i; if (o < 0 || o >= n || v >= vn) continue; const g = log.voice.clips.length > 1 ? Math.min(1, i / edge, (d - i) / edge) : 1; out[o * 2] += voice[v * 2] * g; out[o * 2 + 1] += voice[v * 2 + 1] * g; } }
  const b = log.bed, r = b.ramp, spans = log.spans;
  const gain = t => { let w = 0; for (const c of spans) { const a = c.at, e = c.at + c.dur; let x = 0; if (t >= a && t <= e) x = 1; else if (t > a - r && t < a) x = 0.5 - 0.5 * Math.cos(Math.PI * (t - (a - r)) / r); else if (t > e && t < e + r) x = 0.5 + 0.5 * Math.cos(Math.PI * (t - e) / r); if (x > w) w = x; } return b.open - (b.open - b.duck) * w; };
  const off = Math.round((b.offset || 0) * SR); let gk = 0, g = gain(0);
  for (let i = 0; i < n; i++) { if (i >= gk) { g = gain(i / SR); gk = i + 48; }   /* the law sampled at 1 kHz, as the harness draws it */
    const t = i / SR, fade = Math.min(1, t / 0.4, (seconds - t) / 1.2), j = (off + i) % bn; out[i * 2] += bed[j * 2] * g * fade; out[i * 2 + 1] += bed[j * 2 + 1] * g * fade; }
  const buf = Buffer.alloc(44 + n * 4); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  let peak = 0; for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs(out[i])); const k = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0; i < out.length; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(out[i] * k * 32767))), 44 + i * 2);
  return { buf, peak, samples: n };
}
const stamp = s => { const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = (s % 60).toFixed(3).padStart(6, '0'); return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + x; };
function vtt(caps, seconds) { return 'WEBVTT\n\n' + caps.filter(c => c.t0 < seconds).map((c, i) => `${i + 1}\n${stamp(Math.max(0, c.t0))} --> ${stamp(Math.min(seconds, c.t1 + 0.4))}\n${c.name ? `<v ${c.name}>` : ''}${c.isLine ? '' : '<i>'}${c.text}${c.isLine ? '' : '</i>'}\n`).join('\n'); }

(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: chromiumPath, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } }); page.setDefaultTimeout(900000);
  page.on('pageerror', e => say('page error', e.message)); page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) say('console', m.text().slice(0, 200)); if (/^\[take\]/.test(m.text())) say(m.text().slice(0, 200)); });
  await page.goto(URL_, { timeout: 900000 });
  await page.waitForFunction(() => window.ButterLocation && window.ButterFilms?.current && !ButterFilms.busy && ButterCast.cast.length, null, { timeout: 900000 });
  const loc = 'odyssey-' + sid.toLowerCase();
  if ((await page.evaluate(() => ButterFilms.current.sourceId)) !== loc) {
    await page.evaluate(id => { const t = ButterFilms.records.find(r => r.id === id).title, o = [...document.querySelectorAll('#versionSelect option')].find(o => o.textContent.trim() === t); return ButterFilms.switchTo(o.value); }, loc);
    await page.waitForFunction(id => ButterFilms.current?.sourceId === id && !ButterFilms.busy && ButterCast.cast.length, loc, { timeout: 300000 }); }
  say('location', loc, 'loaded');
  await page.evaluate(() => { document.body.classList.add('kf'); const st = document.createElement('style'); st.textContent = 'body.kf header,body.kf .topbar,body.kf footer,body.kf nav,body.kf #filmWorldTools{visibility:hidden!important}'; document.head.appendChild(st); });
  await page.waitForTimeout(800);
  const info = await page.evaluate(o => OdysseyTake.exportStart(o), { mode, w: W, h: H });
  say('take', info.scene, info.mode, info.total.toFixed(2), 's; keys', JSON.stringify(info.keys), '; faces', info.faces.join(','), '; shots', JSON.stringify(info.shots));
  if (stills) {
    for (const s of stills.split(',').map(Number)) { const r = await page.evaluate(t => OdysseyTake.frame(t, { quality: 0.92 }), s); const f = `${base}-t${s.toFixed(1)}.jpg`; fs.writeFileSync(f, Buffer.from(r.jpeg, 'base64')); say('still', f, r.key, r.shot, 'ms apply/render/encode', r.ms.join('/')); }
    await browser.close(); return; }
  const end = to != null ? Math.min(+to, info.total) : info.total, frames = Math.round((end - from) * fps), seconds = frames / fps;
  const video = base + '.video.mp4';
  const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', video], { stdio: ['pipe', 'inherit', 'inherit'] });
  let last = '', drawn = 0; const shots = [];
  for (let i = 0; i < frames; i++) {
    const t = from + i / fps, r = await page.evaluate(t => OdysseyTake.frame(t), t), buf = Buffer.from(r.jpeg, 'base64');
    if (!ff.stdin.write(buf)) await new Promise(res => ff.stdin.once('drain', res)); drawn++;
    if (r.shot !== last) { last = r.shot; shots.push({ t: +t.toFixed(3), shot: r.shot, kind: r.kind, key: r.key }); }
    if (i % 48 === 0) say('frame', i, 'of', frames, 't', t.toFixed(2), r.key, r.shot, 'wall', ((Date.now() - t0) / 60000).toFixed(1), 'min');
  }
  ff.stdin.end(); await new Promise(res => ff.on('close', res)); say('video', drawn, 'frames');
  // the poster: the key beat, a third of the way into its line
  const pt = await page.evaluate(() => { const i = OdysseyTake.info(), k = i.clips.find(c => c.gi === OdysseyTake.take.keyGi) || i.clips[Math.floor(i.clips.length / 2)]; return k.at + k.dur * 0.33; });
  fs.writeFileSync(base + '.jpg', Buffer.from((await page.evaluate(t => OdysseyTake.frame(t, { quality: 0.92 }), Math.min(end - 0.1, Math.max(from, pt)))).jpeg, 'base64'));
  const log = await page.evaluate(() => OdysseyTake.soundLog()), caps = await page.evaluate(() => OdysseyTake.captions());
  await browser.close();
  // the sound: rendered to the video's own length, so the two end together
  const snd = renderSound(from ? { ...log, voice: { ...log.voice, clips: log.voice.clips.map(c => ({ ...c, at: c.at - from })) }, spans: log.spans.map(c => ({ ...c, at: c.at - from })), bed: { ...log.bed, offset: (log.bed.offset || 0) + from } } : log, seconds);
  const wav = base + '.wav'; fs.writeFileSync(wav, snd.buf); say('sound', (snd.samples / SR).toFixed(3), 's, peak', snd.peak.toFixed(2));
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', video, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', seconds.toFixed(3), '-movflags', '+faststart', base + '.mp4']);
  fs.unlinkSync(video); fs.unlinkSync(wav);
  fs.writeFileSync(base + '.vtt', vtt(caps.map(c => ({ ...c, t0: c.t0 - from, t1: c.t1 - from })).filter(c => c.t1 > 0), seconds));
  fs.writeFileSync(base + '.json', JSON.stringify({ scene: sid, mode, fps, size: [W, H], seconds, frames, from, take: info, shots, sound: log }, null, 1));
  say('done:', base + '.mp4', (fs.statSync(base + '.mp4').size / 1048576).toFixed(1), 'MB,', seconds.toFixed(2), 's at', fps, 'fps, in', ((Date.now() - t0) / 60000).toFixed(1), 'min');
})().catch(e => { console.error(e); process.exit(1); });
