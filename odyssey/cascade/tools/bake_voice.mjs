#!/usr/bin/env node
/* odyssey/cascade/tools/bake_voice.mjs — the Halfworld recording as data for the BEFLIX graph (assets/beflix/voice.json).

   Reads (never changes) the Halfworld repository: drive/voice/OD-B12-S03.m4a (the scene's recording), drive/voice-manifest.json
   (its segments: gi, start, dur) and drive/drive-script.json (what each segment gi says, and of what kind). Decodes the audio with
   ffmpeg, measures the RMS in 20 ms windows, normalises to the 97th percentile, smooths it (fast attack, slow release, as a
   meter), and writes it as two base-36 characters a sample (0..1295). Also writes, for the film's mix, where in the book's bed
   (Bronze Council, track 12, as Halfworld's own film maps books to beds) this scene begins: the sum of the earlier Book XII scenes.

   node tools/bake_voice.mjs [--hw /home/user/odyssey-halfworld] [--scene OD-B12-S03] */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const argv = process.argv.slice(2), opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const HW = path.resolve(opt('--hw', '/home/user/odyssey-halfworld')), SCENE = opt('--scene', 'OD-B12-S03');
const ffmpeg = process.env.FFMPEG || execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim();
const man = JSON.parse(fs.readFileSync(path.join(HW, 'drive/voice-manifest.json'), 'utf8'));
const script = JSON.parse(fs.readFileSync(path.join(HW, 'drive/drive-script.json'), 'utf8'));
const vm = man[SCENE], ds = script.scenes.find(s => s.id === SCENE);
const SR = 8000, RATE = 50, win = SR / RATE;
const pcm = execFileSync(ffmpeg, ['-v', 'error', '-i', path.join(HW, vm.file), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.length / 4);
const rms = [];
for (let i = 0; i + win <= x.length; i += win) { let s = 0; for (let k = 0; k < win; k++) s += x[i + k] * x[i + k]; rms.push(Math.sqrt(s / win)); }
const sorted = rms.slice().sort((a, b) => a - b), ref = sorted[Math.floor(sorted.length * 0.97)] || 1;
let e = 0; const env = rms.map(v => { const u = Math.min(1, v / ref); e = u > e ? e + (u - e) * 0.6 : e + (u - e) * 0.18; return Math.pow(e, 0.8); });
const code = env.map(v => Math.round(v * 1295).toString(36).padStart(2, '0')).join('');
const segments = vm.segments.map(s => { const g = ds.segments[s.gi]; return { start: s.start, dur: s.dur, gi: s.gi, kind: g.kind, speaker: g.speakerName, text: g.text }; });
/* the bed: Halfworld's film plays each book's track from the book's first scene, so this scene sits after its book's earlier scenes */
const book = ds.book, earlier = Object.keys(man).filter(id => id.startsWith(`OD-B${String(book).padStart(2, '0')}-`) && id < SCENE).sort();
const bedOffset = earlier.reduce((a, id) => a + (+man[id].total || 0), 0);
const albums = JSON.parse(fs.readFileSync(path.join(HW, 'audio/albums.json'), 'utf8'));
const album = albums.albums.find(a => a.tracks.some(t => t.num === book)), track = album.tracks.find(t => t.num === book);
const doc = {
  note: `The Halfworld recording of ${SCENE} (${ds.title}) as data: RMS envelope at ${RATE} Hz, two base-36 characters a sample (0..1295), and the recording's segments with what each says (drive-script). Baked by tools/bake_voice.mjs.`,
  scene: SCENE, title: ds.title, book, bookTitle: ds.bookTitle, file: vm.file, total: vm.total, rate: RATE, samples: env.length, env: code, segments,
  bed: { album: album.name, track: track.title, file: path.join(album.dir, track.file), offset: Math.round(bedOffset * 1000) / 1000, open: 0.18, duck: 0.10 }
};
fs.mkdirSync(path.join(here, 'assets/beflix'), { recursive: true });
fs.writeFileSync(path.join(here, 'assets/beflix/voice.json'), JSON.stringify(doc, null, 1));
console.log(`voice.json: ${env.length} samples (${(env.length / RATE).toFixed(2)} s of ${vm.total}), ${segments.length} segments, bed ${album.name} / ${track.title} from ${bedOffset.toFixed(2)} s`);
for (const s of segments) console.log(`  ${s.start.toFixed(2)}-${(s.start + s.dur).toFixed(2)} ${s.kind} ${s.speaker}: ${s.text}`);
