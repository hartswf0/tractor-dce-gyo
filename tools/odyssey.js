#!/usr/bin/env node
/* tools/odyssey.js — an Odyssey halfworld scene compiled into a cinerium program: the faces-and-speech pipeline.

   The halfworld already has the front half of the compiler: scene → line → why → direction → face channels. Its memory
   files carry, per scene, the cast with stage positions, a score of timed rows (poses, walks, spoken lines with start
   and duration), and the recorded voice with a manifest of segments. This reads those, plus the direction table (the
   beat's direction and its reason) and the per-line directions, and writes the scene as shots on the register:
   the camera chosen per beat (a two-shot for the room, a close-up at each speaker for the line), BEAT lines with the
   why, PHRASE lines from the poses, walks as acts, SPEAK lines that slice the recorded voice (FILE FROM FOR) with the
   line's envelope beside it, ASSERT lines at the key beat. The voice file is copied next to the lines, its envelope
   computed with ffmpeg so live and offline read the same one.

   node tools/odyssey.js OD-B23-S04 [OD-B01-S03 ...] --halfworld /path/to/odyssey-halfworld [--out world/scenes-odyssey.js]
   Requires the clone (git clone https://github.com/hartswf0/odyssey-halfworld) and ffmpeg (or pip install imageio-ffmpeg). */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync, spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), ids = args.filter(a => /^OD-B\d\d-S\d\d$/.test(a)), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const HW = opt('halfworld', path.join(path.dirname(ROOT), 'hartswf0', 'odyssey-halfworld')), OUT = opt('out', path.join(ROOT, 'world', 'scenes-odyssey.js')), LINES = path.join(ROOT, 'world', 'lines', 'odyssey');
if (!ids.length) { console.error('usage: node tools/odyssey.js OD-B23-S04 [more ids] --halfworld <clone> [--out world/scenes-odyssey.js]'); process.exit(2); }
if (!fs.existsSync(path.join(HW, 'halfworld'))) { console.error('no halfworld clone at ' + HW); process.exit(2); }
require(path.join(ROOT, 'world', 'face.js')); const Face = globalThis.Face;
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));
function ffmpeg() { for (const c of [process.env.FFMPEG, 'ffmpeg']) if (c) { try { execFileSync(c, ['-version'], { stdio: 'pipe' }); return c; } catch (e) { } } try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg,sys;sys.stdout.write(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).trim(); } catch (e) { } return null; }
const FF = ffmpeg();
/* the direction table and the per-line directions, read as data (the module is ESM with two exports) */
const dirSrc = fs.readFileSync(path.join(HW, 'scenes', '_direction.mjs'), 'utf8');
const BEATS = {}; for (const m of dirSrc.matchAll(/"(OD-B\d\d-S\d\d)":\s*\["(\w+)",\s*"([^"]*)"\]/g)) BEATS[m[1]] = [m[2], m[3]];
const spoken = (readJson(path.join(HW, 'viewer', 'spoken-lines.json')).lines) || {};
const drive = readJson(path.join(HW, 'drive', 'drive-script.json')), driveScenes = Array.isArray(drive) ? drive : drive.scenes || [];
const voices = readJson(path.join(HW, 'drive', 'voice-manifest.json')), voiceScenes = Array.isArray(voices) ? Object.fromEntries(voices.map(v => [v.id, v])) : (voices.scenes || voices);
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
/* stage to studs: the halfworld's x runs about −10..10 across the hall, its z 0 (far) to 1 (near, the camera side) */
const SX = 1.2, SZ = 16, toX = x => +(x * SX).toFixed(1), toZ = z => +((z - 1) * SZ).toFixed(1);   // metres: the hall is 24 m across and 17 m deep, like its build below (in studs, two a metre)
const CAST_DEFS = new Set(['penelope', 'odysseus', 'eurycleia', 'telemachus', 'phemius', 'athena']);
const speakerOf = seg => norm(seg.speakerId || '').replace(/^character\s*/, '').trim() || norm(seg.speakerName);
/** The whole take's envelope at 50 Hz, from ffmpeg's decode, written beside the copied file. */
function envelope(src, dst) {
  if (!FF) return null; const r = spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-i', src, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], { maxBuffer: 1 << 28 }); if (r.status !== 0 || !r.stdout) return null;
  const buf = r.stdout, n = Math.floor(buf.length / 4), samples = new Float32Array(n); for (let i = 0; i < n; i++) samples[i] = buf.readFloatLE(i * 4);
  const env = Face.envelopeOf(samples, 16000, 50); fs.writeFileSync(dst, JSON.stringify({ hz: 50, sec: +(n / 16000).toFixed(2), env }) + '\n'); return env;
}
function compile(id) {
  const book = +id.slice(4, 6), mem = readJson(path.join(HW, 'halfworld', `odyssey.book-${String(book).padStart(2, '0')}.memory.json`));
  const sceneKey = Object.keys(mem.scenes).find(k => k.startsWith(id)); if (!sceneKey) throw new Error('no scene ' + id + ' in book ' + book);
  const scene = mem.scenes[sceneKey], title = sceneKey.replace(/^OD-B\d\d-S\d\d\s*·\s*/, ''), cast = Array.isArray(scene.cast) ? scene.cast : Object.keys(scene.cast || {});
  const rows = (scene.score && scene.score.rows) || [], vm = voiceScenes[id], ds = driveScenes.find(s => s.id === id), beat = BEATS[id] || null;
  // the recorded voice: copied beside the lines, its envelope computed once
  let file = null; if (vm && vm.file && fs.existsSync(path.join(HW, vm.file))) { fs.mkdirSync(LINES, { recursive: true }); file = `odyssey/${id}.m4a`; const dst = path.join(LINES, id + '.m4a'); if (!fs.existsSync(dst)) fs.copyFileSync(path.join(HW, vm.file), dst); if (!fs.existsSync(path.join(LINES, id + '.env.json'))) envelope(dst, path.join(LINES, id + '.env.json')); }
  // the voice segments by their text, so a score row's line finds its slice of the take
  const segs = []; if (vm && ds) (ds.segments || []).forEach((seg, gi) => { const v = (vm.segments || []).find(x => x.gi === gi) || vm.segments[gi]; if (v) segs.push({ gi, kind: seg.kind, who: speakerOf(seg), text: seg.text || '', turn: seg.sourceTurnId || null, start: v.start, dur: v.dur }); });
  const findSeg = (who, text) => { const nt = norm(text).slice(0, 40); if (!nt) return null; const w = norm(who); if (w === 'narrator') return segs.find(s => s.kind !== 'DIALOGUE' && norm(s.text).startsWith(nt)) || null; return segs.find(s => s.kind === 'DIALOGUE' && norm(s.who) === w && norm(s.text).startsWith(nt)) || (nt.length >= 16 ? segs.find(s => s.kind === 'DIALOGUE' && norm(s.text).startsWith(nt)) : null) || null; };
  const NAMES = { 'athena-as-mentes': 'athena', 'athena_mentes': 'athena', mentes: 'athena', 'the-suitors': 'suitors', suitors: 'suitors', 'palace-servants': 'servants' };
  const nameOf = c => { const n = norm(c).replace(/ /g, '-'); return NAMES[n] || norm(c).replace(/ .*$/, ''); };
  // the events of the scene on one clock: lines (with their voice slices), poses, walks
  const lines = [], poses = [], walks = []; const total = vm ? vm.total : rows.reduce((m, r) => Math.max(m, (+r.s || 0) + (+r.d || 0)), 20);
  for (const r of rows) { const who = nameOf(r.c); if (!cast.some(c => nameOf(c) === who) && who !== 'narrator') continue; const m = String(r.m || ''), t = +r.s || 0;
    if (r.t && String(r.t).trim()) { const seg = findSeg(who, r.t); const spk = seg ? seg : null; const turn = spk && spk.turn, dir = turn && spoken[turn] ? spoken[turn].direction : null; lines.push({ who, text: String(r.t).trim(), t: spk ? spk.start : t, sec: spk ? spk.dur : (+r.d || 2), turn, dir }); }
    const pm = m.match(/pose=([^;]+)/); if (pm) poses.push({ who, t, name: pm[1].trim().toLowerCase() });
    const wm = m.match(/walk=(-?[\d.]+),(-?[\d.]+)/); if (wm) walks.push({ who, t, x: toX(+wm[1]), z: toZ(+wm[2]), d: +r.d || 3 });
  }
  const narr = segs.filter(s => s.kind !== 'DIALOGUE' && s.text && /NARRATION|AUDITORY|SCENE_HEADER/.test(s.kind) && !lines.some(l => Math.abs(l.t - s.start) < 0.5)).map(s => ({ who: 'narrator', text: s.text, t: s.start, sec: s.dur, narration: true }));
  // shots: one per line (a close-up at the speaker) with two-shots between, cut at the lines' starts; the whole take is one clock
  const marks = [...new Set([0, ...lines.map(l => l.t), ...walks.map(w => w.t)])].filter(t => t < total - 1).sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] >= 1.2);
  const bounds = [...marks, total], shots = [];
  const sceneCast = (scene.cast && !Array.isArray(scene.cast)) ? scene.cast : {}, named = cast.filter(c => CAST_DEFS.has(nameOf(c))), actors = named.map((c, i) => { const cm = (sceneCast[c] && typeof sceneCast[c] === 'object') ? sceneCast[c] : ((mem.cast || {})[c] || {}); const has = typeof cm.x === 'number'; return { name: nameOf(c), figure: nameOf(c), x: has ? toX(cm.x) : +((i - (named.length - 1) / 2) * 7).toFixed(1), z: has ? toZ(cm.z == null ? 0.6 : cm.z) : -14, heading: 180 }; });   // facing south, the camera's side
  for (const c of cast) { const n = nameOf(c); if (n === 'suitors' || n === 'servants') actors.push({ name: n, crowd: true, kind: 'suitor', n: n === 'suitors' ? 8 : 4, x: n === 'suitors' ? 14 : -14, z: -22, r: 5, heading: 0 }); }
  const figures = actors.filter(a => a.figure);
  const principal = (beat && lines.find(l => l.who !== 'narrator')) ? (lines.filter(l => l.who !== 'narrator').sort((a, b) => b.sec - a.sec)[0].who) : (figures[0] && figures[0].name);
  const events0 = figures.map(a => ({ what: 'LIFE', who: a.name, v: 0.08, at: 0 }));
  // where each figure faces (the film's bearings: 180 is south, the camera's side): every LOOK turns the listener toward the speaker, so a speaker's close-up stands on the side the speaker faces, a little toward the front
  const facing = Object.fromEntries(figures.map(a => [a.name, 180])), BEARS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  const bearingTo = (a, b) => { const A = figures.find(f => f.name === a), B = figures.find(f => f.name === b); if (!A || !B) return 180; return ((180 - Math.atan2(B.x - A.x, B.z - A.z) * 180 / Math.PI) % 360 + 360) % 360; };
  const closeFrom = who => { const f = facing[who]; let d = f - 180; d = ((d + 540) % 360) - 180; const want = Math.abs(d) < 20 ? 135 : 180 + (d - Math.sign(d) * 35); return BEARS[Math.round((((want % 360) + 360) % 360) / 45) % 8]; };
  for (let i = 0; i + 1 < bounds.length; i++) {
    const t0 = bounds[i], t1 = bounds[i + 1], sec = +(t1 - t0).toFixed(2); if (sec < 0.5) continue;
    const inShot = f => f.t >= t0 - 1e-6 && f.t < t1 - 1e-6, L = lines.filter(inShot), P = poses.filter(inShot), Wk = walks.filter(inShot), N = narr.filter(inShot);
    const speaker = L.length ? L[0].who : null, on = speaker && figures.some(a => a.name === speaker) ? speaker : (figures.find(a => a.name === principal) || figures[0] || { name: 'me' }).name;
    const shot = { name: speaker ? `${speaker}: ${L[0].text.slice(0, 40)}` : Wk.length ? `${Wk[0].who} crosses` : i === 0 ? 'the hall' : `the room at ${t0.toFixed(0)} s`, on, frame: speaker ? (L[0].sec > 5 ? 'close' : 'medium') : 'wide', from: speaker && figures.some(a => a.name === speaker) ? closeFrom(speaker) : speaker ? 'se' : 's', lens: speaker ? 50 : 32, sec, lamp: true, shift: id, acts: [], events: i === 0 ? events0.slice() : [] };
    for (const w of Wk) shot.acts.push({ who: w.who, to: [w.x, w.z] });
    for (const p of P) shot.events.push({ what: 'PHRASE', who: p.who, name: p.name, at: +(p.t - t0).toFixed(2), enter: 0.3 });
    for (const l of L) { const ev = { what: 'SPEAK', who: l.who, text: l.text, at: +(l.t - t0).toFixed(2), for: +l.sec.toFixed(2) }; if (file) { ev.file = file; ev.from = +l.t.toFixed(2); } if (l.dir) ev.note = l.dir; shot.events.push(ev);
      for (const o of figures) if (o.name !== l.who) { shot.events.push({ what: 'PERFORM', who: o.name, verb: 'LOOK', target: l.who, at: +Math.max(0, l.t - t0 + 0.2).toFixed(2), followHead: 0.12, keepGaze: true }); facing[o.name] = bearingTo(o.name, l.who); } }
    for (const n of N) { const ev = { what: 'SPEAK', who: 'narrator', text: n.text, at: +(n.t - t0).toFixed(2), for: +n.sec.toFixed(2) }; if (file) { ev.file = file; ev.from = +n.t.toFixed(2); } shot.events.push(ev); }
    if (beat && speaker === principal && !shots.some(s => s.events.some(e => e.what === 'BEAT'))) { const l = L[0]; shot.events.push({ what: 'BEAT', id: id + ' ' + beat[0], who: principal, at: +(l.t - t0).toFixed(2), to: +(l.t - t0 + l.sec).toFixed(2), why: beat[1], direct: beat[0] }); shot.events.push({ what: 'ASSERT', who: principal, reads: beat[0], at: +(l.t - t0 + Math.min(1.2, l.sec * 0.4)).toFixed(2) }); }
    shots.push(shot);
  }
  const hall = { name: 'megaron', ops: [{ op: 'group', name: 'floor', x: -24, z: -32, size: [48, 34, 1], ops: [{ op: 'slab', x: 0, z: 0, w: 48, d: 34, y: 0, plates: 1, col: 19 }] }, { op: 'group', name: 'far wall', x: -24, z: -33, size: [48, 1, 9], ops: [{ op: 'wall', from: [0, 0], to: [48, 0], y: 0, h: 9, col: 28 }, { op: 'band', x: 0, z: 0, w: 48, d: 1, y: 7, h: 1, col: 4 }] }, { op: 'group', name: 'great doors', x: -4, z: -33, size: [8, 1, 7], ops: [{ op: 'cut', x: 0, z: 0, w: 8, d: 1, y: 0, h: 7 }, { op: 'door', x: 0, z: 0, y: 0, facing: 's', col: 70 }, { op: 'door', x: 4, z: 0, y: 0, facing: 's', col: 70 }] }, { op: 'group', name: 'left pillar', x: -10, z: -14, size: [2, 2, 9], ops: [{ op: 'column', x: 0, z: 0, y: 0, h: 9, col: 15 }, { op: 'column', x: 1, z: 0, y: 0, h: 9, col: 15 }, { op: 'column', x: 0, z: 1, y: 0, h: 9, col: 15 }, { op: 'column', x: 1, z: 1, y: 0, h: 9, col: 15 }] }, { op: 'group', name: 'right pillar', x: 8, z: -14, size: [2, 2, 9], ops: [{ op: 'column', x: 0, z: 0, y: 0, h: 9, col: 15 }, { op: 'column', x: 1, z: 0, y: 0, h: 9, col: 15 }, { op: 'column', x: 0, z: 1, y: 0, h: 9, col: 15 }, { op: 'column', x: 1, z: 1, y: 0, h: 9, col: 15 }] }, { op: 'group', name: 'the fire', x: -2, z: -12, size: [4, 4, 2], ops: [{ op: 'box', x: 0, z: 0, w: 4, d: 4, y: 0, h: 1, col: 72 }, { op: 'part', part: '3062b', col: 25, x: 1, y: 1, z: 1 }, { op: 'part', part: '3062b', col: 46, x: 2, y: 1, z: 2 }, { op: 'part', part: '4589', col: 25, x: 1, y: 2, z: 2 }] }] };
  if (/B23/.test(id)) hall.ops.push({ op: 'group', name: 'the bed', x: Math.round(toX(9) * 2) - 3, z: Math.round(toZ(0.87) * 2) - 2, size: [6, 4, 3], ops: [{ op: 'box', x: 0, z: 0, w: 6, d: 4, y: 0, h: 2, col: 70 }, { op: 'slab', x: 0, z: 0, w: 6, d: 4, y: 2, plates: 2, col: 19 }, { op: 'tree', x: 5, z: 0, h: 5, r: 1, col: 2, trunk: 70 }] });
  if (/B01/.test(id)) hall.ops.push({ op: 'group', name: 'the threshold', x: -14, z: 2, size: [6, 2, 1], ops: [{ op: 'slab', x: 0, z: 0, w: 6, d: 2, y: 0, plates: 2, col: 72 }] }, { op: 'group', name: 'spear rack', x: -20, z: -30, size: [1, 6, 5], ops: [{ op: 'column', x: 0, z: 0, y: 0, h: 5, col: 70 }, { op: 'column', x: 0, z: 3, y: 0, h: 5, col: 70 }, { op: 'part', part: '3009', col: 70, x: 0, y: 3, z: 0, rot: 1 }] });
  const story = { title: `Odyssey ${book}: ${title}`, description: (mem.x_odyssey && mem.x_odyssey.scenes && mem.x_odyssey.scenes[sceneKey] && typeof mem.x_odyssey.scenes[sceneKey] === 'string') ? mem.x_odyssey.scenes[sceneKey] : `${title}, from the halfworld's score: ${lines.length} lines, ${poses.length} poses, ${walks.length} crossings, ${(vm && vm.total || total).toFixed(0)} s of recorded voice.`, location: 'the megaron of Ithaca', entities: figures.map(a => a.name), goals: beat ? [beat[1]] : [], obstacles: [], shifts: [{ id, text: title }], why: beat ? beat[1] : null, direction: beat ? beat[0] : null, pipeline: ['REFERENCE', 'CAMERA', 'FRAME', 'REQUIRE', 'FORAGE', 'RESOLVE', 'ASSEMBLE', 'STAGE', 'BIND', 'PERFORM', 'WATCH', 'REPAIR', 'COMMIT'], source: { halfworld: sceneKey, voice: vm ? vm.file : null, direction: beat, lines: lines.map(l => ({ who: l.who, turn: l.turn, direction: l.dir })) } };
  return { key: 'odyssey-' + id.toLowerCase(), program: { name: `Odyssey ${id}: ${title}`, time: 'day', weather: 'clear', ground: 'flat', set: { kind: 'hall', r: 40, seed: 1 }, story, actors, builds: [{ name: 'megaron', x: 0, z: 0, program: hall }], shots }, report: { id, title, lines: lines.length, poses: poses.length, walks: walks.length, shots: shots.length, total: +(vm ? vm.total : total).toFixed(1), voice: !!file, beat } };
}
const out = [`/* world/scenes-odyssey.js — Odyssey scenes compiled from the halfworld by tools/odyssey.js; do not edit by hand. */`, `(function () { if (!window.Film || !Film.SCENES) return;`];
for (const id of ids) { const r = compile(id); out.push(`Film.SCENES[${JSON.stringify(r.key)}] = ${JSON.stringify(r.program)};`); console.log(`${r.report.id} ${r.report.title}: ${r.report.shots} shots over ${r.report.total} s · ${r.report.lines} lines · ${r.report.poses} poses · ${r.report.walks} crossings · voice ${r.report.voice ? 'copied' : 'missing'} · beat ${r.report.beat ? r.report.beat[0] + ' (' + r.report.beat[1] + ')' : 'none'}`); }
out.push('})();'); fs.writeFileSync(OUT, out.join('\n') + '\n'); console.log('written ' + path.relative(ROOT, OUT));
