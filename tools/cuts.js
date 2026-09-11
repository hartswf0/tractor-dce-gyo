#!/usr/bin/env node
/* tools/cuts.js — a reference video into its cuts, and a MENTO skeleton the director fills in.

   The first thing Trevor Carlee does with a scene is mark every camera change on the timeline. This does that with
   ffmpeg's scene detection, writes the cut list with each shot's seconds, a contact sheet (one frame per shot) to
   look at, and a film text with one SHOT line per cut, names blank. The video itself stays out of the repository.

   node tools/cuts.js <video> [--out films/<name>] [--threshold 0.18] [--min 0.8] [--name "The Simpsons intro"]
   → <out>.cuts.json { duration, cuts, shots: [{ i, from, to, sec, frame }], sheet }, <out>.sheet.jpg, <out>.skeleton.txt (a MENTO skeleton: one SHOT per cut; the film's own text is what the export writes as <name>.mento.txt) */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync, spawnSync } = require('child_process');
const args = process.argv.slice(2), video = args.find(a => !a.startsWith('--') && !(args[args.indexOf(a) - 1] || '').startsWith('--')), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
if (!video) { console.error('usage: node tools/cuts.js <video> [--out films/<name>] [--threshold 0.18] [--min 0.8] [--name ...]'); process.exit(2); }
function ffmpeg() { for (const c of [process.env.FFMPEG, 'ffmpeg']) if (c) { try { execFileSync(c, ['-version'], { stdio: 'pipe' }); return c; } catch (e) { } } try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg,sys;sys.stdout.write(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim(); } catch (e) { } throw new Error('no ffmpeg: set FFMPEG or pip install imageio-ffmpeg'); }
const FF = ffmpeg(), out = opt('out', path.join('films', path.basename(video).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-'))), thr = +opt('threshold', 0.18), minSec = +opt('min', 0.8), name = opt('name', path.basename(out));
fs.mkdirSync(path.dirname(out), { recursive: true });
/** The clip's length from ffmpeg's own report. */
const run = a => { const r = spawnSync(FF, a, { encoding: 'utf8', maxBuffer: 1 << 26 }); return String(r.stderr || '') + String(r.stdout || ''); };
function duration() { const m = run(['-hide_banner', '-i', video]).match(/Duration:\s*(\d+):(\d+):([\d.]+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0; }
/** Scene changes above the threshold, as seconds. */
function detect() { const txt = run(['-hide_banner', '-loglevel', 'info', '-i', video, '-vf', `select='gt(scene,${thr})',showinfo`, '-an', '-f', 'null', '-']); return [...txt.matchAll(/pts_time:([\d.]+)/g)].map(m => +m[1]); }
const dur = duration(); let cuts = detect().filter((t, i, a) => i === 0 || t - a[i - 1] >= minSec);
cuts = cuts.filter(t => t > minSec && t < dur - minSec);
const bounds = [0, ...cuts, dur], shots = []; for (let i = 0; i + 1 < bounds.length; i++) shots.push({ i: i + 1, from: +bounds[i].toFixed(2), to: +bounds[i + 1].toFixed(2), sec: +(bounds[i + 1] - bounds[i]).toFixed(2), frame: +((bounds[i] + bounds[i + 1]) / 2).toFixed(2) });
// the contact sheet: the middle frame of every shot, tiled
const cols = Math.min(4, shots.length), rows = Math.ceil(shots.length / cols), sel = shots.map(s => `eq(n\\,${Math.round(s.frame * 24)})`).join('+');
try { execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-vf', `select='${sel}',scale=320:-1,tile=${cols}x${rows}`, '-frames:v', '1', out + '.sheet.jpg'], { stdio: 'pipe' }); } catch (e) { console.warn('sheet: ' + String(e.stderr || e.message).slice(0, 200)); }
const mento = [`0 // MENTO film · ${name} · cut from the reference by tools/cuts.js`, '0 !MENTO ASPECT 16:9 FPS 24', ...shots.map(s => `0 !MENTO SHOT "shot ${s.i}" POS 0 4 12 TGT 0 2 0 LENS 50 SEC ${s.sec}   // ${s.from}–${s.to} s`)].join('\n') + '\n';
fs.writeFileSync(out + '.cuts.json', JSON.stringify({ name, video: path.basename(video), duration: +dur.toFixed(2), threshold: thr, cuts: cuts.map(t => +t.toFixed(2)), shots, sheet: path.basename(out) + '.sheet.jpg' }, null, 1) + '\n');
fs.writeFileSync(out + '.skeleton.txt', mento);
console.log(`${name}: ${dur.toFixed(1)} s, ${shots.length} shots at threshold ${thr}: ${shots.map(s => s.sec).join(' ')}\n${out}.cuts.json · ${out}.sheet.jpg · ${out}.skeleton.txt`);
