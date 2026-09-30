#!/usr/bin/env node
/* odyssey/cascade/tools/rig_previz.mjs — a scene's rigs through the film's shot camera, cooked headless by Cascade, with the acted
   film's sound: media/previz-<scene>.mp4 (and a .jpg), and the cook timed.

     node tools/rig_previz.mjs OD-B12-S03 [--graph file.cascade] [--from s] [--to s] [--name previz-OD-B12-S03] [--frames-only]

   The graph is run with `cascade run --frames a-b --fps 12` (tools/cascade.mjs, the CLI with its compile race fixed), the frames
   (renders/rig/<name>/, not committed) are encoded at 12 frames a second with the scene's own voice and bed taken from
   films/odyssey/<scene>-acted.mp4 over the same span. Writes media/previz.json: per previz, frames, cook seconds, seconds a frame. */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), ROOT = path.resolve(HERE, '..', '..');
const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a)), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!sid) { console.log('node tools/rig_previz.mjs OD-Bxx-Syy [--graph g.cascade] [--from s] [--to s] [--name n]'); process.exit(1); }
const ffmpeg = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
const graph = opt('graph', `rig-${sid}.cascade`), doc = JSON.parse(fs.readFileSync(path.join(HERE, graph), 'utf8'));
const [F0, F1] = doc.metadata.frames, from = +opt('from', 0), to = opt('to', null);
const a = Math.max(F0, Math.round(from * 12) + 1), b = Math.min(F1, to != null ? Math.round(+to * 12) + 1 : F1);
const name = opt('name', `previz-${sid}`), out = path.join(HERE, 'renders/rig', name);
fs.rmSync(out, { recursive: true, force: true });
const t0 = Date.now();
let res;
for (let k = 0; ; k++) {
  try { res = execFileSync(process.execPath, [path.join(HERE, 'tools/cascade.mjs'), 'run', graph, '--frames', `${a}-${b}`, '--fps', '12', '--json', '--timeout', '3600000', '--out', path.relative(HERE, out), '--node', 'view'], { cwd: HERE, encoding: 'utf8', maxBuffer: 256 << 20, stdio: ['ignore', 'pipe', 'pipe'] }); break; }
  catch (e) { if (k < 4 && /does not export execute/.test(String(e.stderr) + String(e.stdout))) continue; throw e; }
}
const m = JSON.parse(res.trim().split('\n').reverse().find(l => l.startsWith('{'))), cook = (Date.now() - t0) / 1000, n = m.files.length;
console.log(`${name}: ${n} frames cooked in ${cook.toFixed(1)} s (${(cook / n).toFixed(3)} s a frame, ${(n / cook).toFixed(1)} frames a second; the runtime's own ${(m.durationMs / 1000).toFixed(1)} s)`);
if (args.includes('--frames-only')) process.exit(0);
const pattern = path.join(out, 'view.%04d.png'), mp4 = path.join(HERE, 'media', name + '.mp4'), film = path.join(ROOT, `films/odyssey/${sid}-acted.mp4`);
const ss = ((a - 1) / 12).toFixed(3), dur = (n / 12).toFixed(3);
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', '12', '-start_number', String(a), '-i', pattern, ...(fs.existsSync(film) ? ['-ss', ss, '-t', dur, '-i', film, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '96k'] : []),
  '-vf', 'scale=720:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '30', '-preset', 'slow', '-r', '12', '-t', dur, '-movflags', '+faststart', mp4]);
const mid = m.files[Math.floor(n * 0.45)];
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', path.join(HERE, mid), '-vf', 'scale=720:-2', '-q:v', '4', path.join(HERE, 'media', name + '.jpg')]);
const sf = path.join(HERE, 'media/previz.json'), S = fs.existsSync(sf) ? JSON.parse(fs.readFileSync(sf, 'utf8')) : {};
S[name] = { scene: sid, graph, frames: n, from: (a - 1) / 12, to: (b - 1) / 12, cookSeconds: +cook.toFixed(1), secondsPerFrame: +(cook / n).toFixed(3), runtimeMs: Math.round(m.durationMs), bytes: fs.statSync(mp4).size, measured: new Date().toISOString().slice(0, 10) };
fs.writeFileSync(sf, JSON.stringify(S, null, 1));
console.log('wrote', path.relative(HERE, mp4), (fs.statSync(mp4).size / 1048576).toFixed(2), 'MB');
