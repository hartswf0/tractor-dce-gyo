#!/usr/bin/env node
/* tools/lines.js — the spoken lines of every film program, synthesised with espeak-ng and encoded to opus.

   Reads the LINE events of Film.TRAILERS and Film.SCENES (world/film.js), gives each character a voice,
   writes world/lines/<key>.ogg and world/lines/index.json ({ key: { who, text, sec } }); a key is
   Sound.lineKey(who, text). Chewbacca's lines are roared by the page, so they get no file.

   Needs espeak-ng (apt install espeak-ng) and an ffmpeg with libopus: the one from imageio-ffmpeg
   (pip install imageio-ffmpeg) or any on the PATH; FFMPEG=/path/to/ffmpeg overrides.
   Usage: node tools/lines.js [--only key] [--dry]                                                       */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const root = path.resolve(__dirname, '..');
global.window = {}; global.document = {}; require(path.join(root, 'world/film.js')); require(path.join(root, 'world/sound.js'));
const Film = window.Film, Sound = window.Sound;
const VOICES = {
  leia: ['en-us+f3', 165, 45], luke: ['en-us+m7', 170, 55], han: ['en-us+m3', 150, 38], narrator: ['en-gb-x-rp+m2', 140, 30], vader: ['en-gb+m1', 125, 12],
  c3po: ['en-gb-x-rp+m4', 190, 70], trooper: ['en-us+m2', 165, 50], scout: ['en-us+m2', 170, 52], rogue: ['en-us+m6', 170, 48], comms: ['en-us+f2', 165, 50], pilot: ['en-us+m6', 170, 48], rebel: ['en-us+m5', 165, 45],
};
const voiceFor = who => VOICES[String(who || '').toLowerCase().split(/[-\s]/)[0]] || VOICES.narrator;
function ffmpeg() { if (process.env.FFMPEG) return process.env.FFMPEG; try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } }
const args = process.argv.slice(2), only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null, dry = args.includes('--dry');
const out = path.join(root, 'world/lines'); fs.mkdirSync(out, { recursive: true });
const lines = new Map();
for (const P of [...Object.values(Film.TRAILERS), ...Object.values(Film.SCENES)]) for (const s of P.shots) for (const e of s.events || []) if (String(e.what).toUpperCase() === 'LINE' && e.who && e.text) { const key = Sound.lineKey(e.who, e.text); if (!lines.has(key)) lines.set(key, { who: e.who, text: e.text }); }
const index = fs.existsSync(path.join(out, 'index.json')) ? JSON.parse(fs.readFileSync(path.join(out, 'index.json'), 'utf8')) : {};
const FF = ffmpeg(); let made = 0;
for (const [key, L] of lines) {
  if (only && key !== only) continue; if (Sound.voiceOf(L.who) === 'roar') { index[key] = { who: L.who, text: L.text, sec: 1.4, roar: true }; continue; }
  const [voice, speed, pitch] = voiceFor(L.who), wav = path.join(out, key + '.wav'), ogg = path.join(out, key + '.ogg');
  console.log(key, L.who + ':', L.text, dry ? '' : '');
  if (dry) continue;
  execFileSync('espeak-ng', ['-v', voice, '-s', String(speed), '-p', String(pitch), '-a', '170', '-g', '6', '-w', wav, L.text]);
  execFileSync(FF, ['-y', '-loglevel', 'error', '-i', wav, '-af', 'highpass=f=80,lowpass=f=7000,loudnorm=I=-18:TP=-2', '-ar', '48000', '-ac', '1', '-c:a', 'libopus', '-b:a', '32k', ogg]);
  const hdr = fs.readFileSync(wav), rate = hdr.readUInt32LE(24) || 22050, sec = (hdr.length - 44) / (rate * 2);   // espeak's wav: 16-bit mono
  fs.unlinkSync(wav); index[key] = { who: L.who, text: L.text, sec: +sec.toFixed(2) }; made++;
}
if (!dry) fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 1));
console.log(`${lines.size} lines, ${made} files written to world/lines/`);
