#!/usr/bin/env node
/* tools/cinematographer/contact.js — a contact sheet of a rendered take: one frame from the middle of every shot (the film's own
   shot list, films/odyssey/<name>.json `shots`), six across, each labelled with its time and shot.

     node tools/cinematographer/contact.js films/odyssey/OD-B09-S09-performed-shot.mp4 out.jpg [--every s]
   --every s: a frame every s seconds instead (for comparing two films at the same times). */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const args = process.argv.slice(2), mp4 = args[0], out = args[1], ev = args.indexOf('--every') >= 0 ? +args[args.indexOf('--every') + 1] : 0;
const FF = (() => { try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } })();
const meta = JSON.parse(fs.readFileSync(mp4.replace(/\.mp4$/, '.json'), 'utf8')), total = meta.seconds;
let times = [];
if (ev) for (let t = ev / 2; t < total; t += ev) times.push([t, '']);
else { const S = meta.shots; S.forEach((s, i) => { const e = i + 1 < S.length ? S[i + 1].t : total; times.push([(s.t + e) / 2, s.shot]); }); }
const tmp = fs.mkdtempSync(path.join(path.dirname(path.resolve(out)), '.contact-'));
times.forEach(([t, lab], i) => {
  execFileSync(FF, ['-v', 'error', '-y', '-ss', t.toFixed(3), '-i', mp4, '-frames:v', '1', '-vf', 'scale=320:-1', path.join(tmp, String(i).padStart(3, '0') + '.jpg')]);
});
/* tiled and labelled with PIL (this ffmpeg has no drawtext) */
fs.writeFileSync(path.join(tmp, 'labels.json'), JSON.stringify(times.map(([t, l]) => t.toFixed(1) + 's ' + l)));
execFileSync('python3', ['-c', `
import json,sys,glob
from PIL import Image,ImageDraw
d=sys.argv[1];L=json.load(open(d+'/labels.json'));fs=sorted(glob.glob(d+'/[0-9]*.jpg'));im=[Image.open(f) for f in fs];w,h=im[0].size;c=6;r=(len(im)+c-1)//c
S=Image.new('RGB',(w*c,h*r),(20,20,20))
for i,x in enumerate(im):
  g=ImageDraw.Draw(x);g.rectangle([0,0,w,14],fill=(0,0,0));g.text((3,1),L[i],fill=(255,255,255));S.paste(x,((i%c)*w,(i//c)*h))
S.save(sys.argv[2],quality=85)`, tmp, out]);
for (const f of fs.readdirSync(tmp)) fs.unlinkSync(path.join(tmp, f)); fs.rmdirSync(tmp);
console.log(out, times.length, 'frames');
