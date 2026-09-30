#!/usr/bin/env node
/* odyssey/cascade/tools/beflix_film.mjs — the BEFLIX graph's film, stills, print and LEGO grids, cooked headless.

     1. every frame of beflix.cascade (the camera in its halftone look) -> renders/beflix/frames/ (not committed);
     2. the sound, as Halfworld's own film mixes it (harness/build-film-audio.mjs): the scene's recording over its book's bed
        (Bronze Council, track 12, looped, entered where this scene falls in the book), the bed at 0.18 ducked to 0.10 while the
        voice speaks, with 150 ms raised-cosine edges;
     3. media/beflix.mp4 (frames + sound), media/beflix.m4a and .ogg (the sound alone, the player's clock), media/beflix.jpg (the key frame);
     4. the key frame in the camera's three looks: media/beflix-cells.png, beflix-halftone.png, beflix-lego.jpg;
     5. the key frame's print (BxPrint's SVG) -> media/beflix.svg;
     6. LEGO grids (BxLego with a filename) for the key frame at 144 x 96 studs and for the flip-book's twelve frames at 48 x 32,
        -> kit/beflix-key.json, kit/beflix-flipbook.json, read by tools/beflix_kit.py.
   node tools/beflix_film.mjs [--skip-frames]      HW=<halfworld repo> (default /home/user/odyssey-halfworld) */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const HW = process.env.HW || '/home/user/odyssey-halfworld';
const ffmpeg = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
const graph = JSON.parse(fs.readFileSync(path.join(here, 'beflix.cascade'), 'utf8'));
const [F0, F1] = graph.metadata.frames, FPS = graph.metadata.fps;
export const KEY = 827;                                          /* t = 34.4 s: the Sirens promise, the song in the field, his face inset */
const FLIP = Array.from({ length: 12 }, (_, i) => Math.round(F0 + (i + 0.5) * (F1 - F0) / 12));
const voice = JSON.parse(fs.readFileSync(path.join(here, 'assets/beflix/voice.json'), 'utf8'));
const R = p => path.join(here, p), cache = R('.cascade-cache');
fs.mkdirSync(R('media'), { recursive: true }); fs.mkdirSync(R('kit'), { recursive: true }); fs.mkdirSync(R('renders/beflix'), { recursive: true });

function cascade(args) {
  const out = execFileSync(process.execPath, [R('tools/cascade.mjs'), ...args], { cwd: here, encoding: 'utf8', maxBuffer: 64 << 20 });
  const line = out.trim().split('\n').reverse().find(l => l.startsWith('{'));
  const m = line && JSON.parse(line); if (!m || m.status !== 'completed') throw new Error(out.slice(-800));
  return m;
}
/* a variant of the graph with props replaced, written beside it, cooked, removed */
function variant(name, props, args) {
  const doc = JSON.parse(JSON.stringify(graph));
  for (const [key, v] of Object.entries(props)) { const [id, p] = key.split('/'); const n = doc.nodes.find(x => x.id === id); n.props = n.props || {}; n.props[p] = v; }
  const file = `.film-${name}.cascade`; fs.writeFileSync(R(file), JSON.stringify(doc));
  try { return cascade(['run', file, ...args]); } finally { fs.rmSync(R(file), { force: true }); }
}
function newest(prefix, ext) {
  const f = fs.readdirSync(cache).filter(f => f.startsWith(prefix + '.') && f.endsWith(ext)).map(f => path.join(cache, f));
  return f.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}
const t0 = Date.now();

/* 1. the frames */
const frames = R('renders/beflix/frames');
if (!process.argv.includes('--skip-frames')) {
  fs.rmSync(frames, { recursive: true, force: true });
  const m = cascade(['run', 'beflix.cascade', '--frames', `${F0}-${F1}`, '--fps', String(FPS), '--json', '--timeout', '3600000', '--out', path.relative(here, frames), '--node', 'camera']);
  console.log(`frames: ${m.files.length} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

/* 2. the sound */
const bedFile = path.join(HW, voice.bed.file);
let bedDur = 0; try { execFileSync(ffmpeg, ['-i', bedFile], { stdio: 'pipe' }); } catch (e) { const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr)); if (d) bedDur = +d[1] * 3600 + +d[2] * 60 + +d[3]; }
const bedAt = bedDur ? voice.bed.offset % bedDur : 0, total = (F1 - F0 + 1) / FPS;
const duck = voice.segments.map(s => `clip(min((t-${(s.start - 0.15).toFixed(3)})/0.15,(${(s.start + s.dur + 0.15).toFixed(3)}-t)/0.15),0,1)`);
/* the raised cosine of each edge: 0.5 - 0.5 cos(pi u) of the clipped ramp */
const gain = `${voice.bed.open}-${(voice.bed.open - voice.bed.duck).toFixed(2)}*min(1,${duck.map(u => `(0.5-0.5*cos(PI*${u}))`).join('+')})`;
const audio = R('renders/beflix/audio.m4a');
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', path.join(HW, voice.file), '-stream_loop', '-1', '-ss', bedAt.toFixed(3), '-i', bedFile,
  '-filter_complex', `[1:a]aresample=44100,aformat=channel_layouts=stereo,volume='${gain}':eval=frame[bed];[0:a]aresample=44100,aformat=channel_layouts=stereo[v];` +
  `[v][bed]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.97:level=0,apad,atrim=0:${total.toFixed(3)}[out]`,
  '-map', '[out]', '-c:a', 'aac', '-b:a', '160k', audio]);
console.log(`sound: voice + ${voice.bed.album} / ${voice.bed.track} from ${bedAt.toFixed(2)} s (looped), bed ${voice.bed.open} ducked to ${voice.bed.duck}`);

/* 3. the film */
const mp4 = R('media/beflix.mp4');
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-start_number', String(F0), '-i', path.join(frames, 'camera.%04d.png'), '-i', audio,
  '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '29', '-preset', 'slow', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', mp4]);
fs.copyFileSync(audio, R('media/beflix.m4a'));                  /* the player's clock, and an Opus copy for browsers without AAC */
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', audio, '-c:a', 'libopus', '-b:a', '64k', R('media/beflix.ogg')]);
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', path.join(frames, `camera.${String(KEY).padStart(4, '0')}.png`), '-q:v', '3', R('media/beflix.jpg')]);

/* 4. the key frame, three looks */
for (const mode of ['cells', 'halftone', 'lego']) {
  const out = `renders/beflix/look-${mode}`; fs.rmSync(R(out), { recursive: true, force: true });
  const m = variant(mode, { 'camera/mode': mode }, ['--frames', String(KEY), '--fps', String(FPS), '--json', '--timeout', '600000', '--out', out, '--node', 'camera']);
  if (mode === 'lego') execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', R(m.files[0]), '-q:v', '2', R('media/beflix-lego.jpg')]);
  else fs.copyFileSync(R(m.files[0]), R(`media/beflix-${mode}.png`));
}

/* 5 and 6. the print and the LEGO grids: the whole graph at a frame (a named --node would stop short of BxPrint and BxLego's file) */
for (const f of fs.readdirSync(cache)) if (/^beflix-(print|lego)\./.test(f)) fs.rmSync(path.join(cache, f));
variant('print', { 'lego/filename': 'beflix-lego.json', 'lego/studs': [144, 96] }, ['--frames', String(KEY), '--fps', String(FPS), '--json', '--timeout', '600000', '--out', 'renders/beflix/print']);
fs.copyFileSync(newest('beflix-print', '.svg'), R('media/beflix.svg'));
const key = JSON.parse(fs.readFileSync(newest('beflix-lego', '.json'), 'utf8'));
fs.writeFileSync(R('kit/beflix-key.json'), JSON.stringify({ frame: KEY, t: +((KEY - 1) / FPS).toFixed(3), ...key }));
const flip = [];
for (const f of FLIP) {
  for (const x of fs.readdirSync(cache)) if (/^beflix-lego\./.test(x)) fs.rmSync(path.join(cache, x));
  variant('flip', { 'lego/filename': 'beflix-lego.json', 'lego/studs': [48, 32] }, ['--frames', String(f), '--fps', String(FPS), '--json', '--timeout', '600000', '--out', 'renders/beflix/flip']);
  flip.push({ frame: f, t: +((f - 1) / FPS).toFixed(3), ...JSON.parse(fs.readFileSync(newest('beflix-lego', '.json'), 'utf8')) });
}
fs.writeFileSync(R('kit/beflix-flipbook.json'), JSON.stringify({ frames: flip }));
const kb = f => Math.round(fs.statSync(R(f)).size / 1024);
const stats = { frames: F1 - F0 + 1, fps: FPS, seconds: +total.toFixed(2), key: KEY, keySeconds: +((KEY - 1) / FPS).toFixed(2), flipbook: FLIP,
  mp4KB: kb('media/beflix.mp4'), svgKB: kb('media/beflix.svg'), bed: { ...voice.bed, enteredAt: +bedAt.toFixed(3) }, ran: new Date().toISOString(), wallSeconds: Math.round((Date.now() - t0) / 1000) };
fs.writeFileSync(R('media/beflix.json'), JSON.stringify(stats, null, 1) + '\n');
console.log(stats);
