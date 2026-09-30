#!/usr/bin/env node
/* odyssey/cascade/tools/media.mjs — the print and motion outputs of every graph, cooked headless (no browser): the whole frame range
   as a PNG sequence (renders/, not committed), encoded to media/<name>.mp4 with ffmpeg; the last frame as media/<name>.jpg; the
   graph's SvgExport, which the CLI host writes into .cascade-cache/, copied to media/<name>.svg.

   node odyssey/cascade/tools/media.mjs [name ...]            FFMPEG=<path> overrides the encoder (default: imageio_ffmpeg's) */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cli = path.join(here, 'node_modules/cascade/dist/cli/index.js');
const ffmpeg = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
const { graphs } = JSON.parse(fs.readFileSync(path.join(here, 'graphs.json'), 'utf8'));
const want = process.argv.slice(2);
const statsFile = path.join(here, 'media', 'media.json'), stats = fs.existsSync(statsFile) ? JSON.parse(fs.readFileSync(statsFile, 'utf8')) : {};
fs.mkdirSync(path.join(here, 'media'), { recursive: true });
/* cascade 0.7.1's CLI compiles a project node once per instance into the same .cascade-cache/nodes/<Name>.mjs, concurrently, and
   can import a half-written file ("does not export execute") when a graph holds several instances of one node: retry that */
function run(args) {
  for (let k = 0; ; k++) {
    try { return execFileSync(process.execPath, args, { cwd: here, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { if (k < 4 && /does not export execute/.test(String(e.stderr) + String(e.stdout))) { console.log('  (retry: the CLI compile race)'); continue; } throw e; }
  }
}

for (const g of graphs) {
  if (want.length && !want.includes(g.name)) continue;
  const out = path.join(here, 'renders', 'media', g.name), t0 = Date.now();
  fs.rmSync(out, { recursive: true, force: true });
  const res = run([cli, 'run', g.graph, '--frames', `${g.frames[0]}-${g.frames[1]}`, '--fps', String(g.fps), '--json', '--timeout', '1800000',
    '--out', path.relative(here, out), '--node', g.output[0]]);
  const m = JSON.parse(res.trim().split('\n').reverse().find(l => l.startsWith('{')));
  const cookMs = Date.now() - t0;
  const first = m.files[0], pattern = path.join(here, first.replace(/\.\d+\.png$/, '.%04d.png'));
  const mp4 = path.join(here, 'media', g.name + '.mp4'), jpg = path.join(here, 'media', g.name + '.jpg');
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(g.fps), '-start_number', String(g.frames[0]), '-i', pattern,
    '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-movflags', '+faststart', mp4]);
  execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', path.join(here, m.files[m.files.length - 1]), '-q:v', '3', jpg]);
  /* the print: the last frame cooked once more with the whole graph (a named --node narrows the cook to that node's inputs, so the
     sequence above never reached the SvgExport), then the newest <base>.<hash>.svg the CLI host wrote into the cache */
  const base = g.svg.replace(/\.svg$/, ''), cache = path.join(here, '.cascade-cache');
  for (const f of fs.readdirSync(cache)) if (f.startsWith(base + '.') && f.endsWith('.svg')) fs.rmSync(path.join(cache, f));
  run([cli, 'run', g.graph, '--frames', String(g.frames[1]), '--fps', String(g.fps), '--json', '--timeout', '600000', '--out', path.relative(here, out + '-print')]);
  const svgs = fs.readdirSync(cache).filter(f => f.startsWith(base + '.') && f.endsWith('.svg')).map(f => path.join(cache, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (svgs.length) fs.copyFileSync(svgs[0], path.join(here, 'media', g.name + '.svg'));
  const kb = f => fs.existsSync(f) ? Math.round(fs.statSync(f).size / 1024) : 0;
  stats[g.name] = { frames: m.files.length, cookSeconds: Math.round(cookMs / 100) / 10, framesPerSecond: Math.round(m.files.length / (cookMs / 1000) * 10) / 10,
    mp4KB: kb(mp4), svgKB: kb(path.join(here, 'media', g.name + '.svg')), ran: new Date().toISOString() };
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 1) + '\n');
  console.log(`${g.name}: ${m.files.length} frames cooked in ${(cookMs / 1000).toFixed(1)} s (${(m.files.length / (cookMs / 1000)).toFixed(1)} frames/s) · mp4 ${kb(mp4)} KB · svg ${kb(path.join(here, 'media', g.name + '.svg'))} KB`);
}
