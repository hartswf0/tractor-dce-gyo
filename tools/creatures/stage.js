/* tools/creatures/stage.js — the creature rigs put on the software stage (tools/creatures/raster.js): a posed rig as meshes in the
   renderer's frame, a camera, frames piped to ffmpeg (an mp4, a poster, a contact sheet).
     const S = require('./stage');
     S.meshes(rig, v, {tint})           -> meshes for raster.render (world y up turned to the renderer's LDraw frame)
     S.figure(rows)                      -> meshes for extra LDraw rows (a minifig, a rock) given in world (y up)
     S.cam(target, dist, az, el, fov)    -> a camera looking at a world point (y up) from azimuth az (0: from +z, in front of a creature
                                            at heading 0), elevation el (degrees)
     S.film(file, W, H, fps, frameFn)    -> writes an mp4 (h264, yuv420p, small), returns the frames kept for a sheet */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ld = require('./ld'), R = require('./raster');
const FF = (() => { try { return cp.execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } })();
const MPD = new Map();
function mpdOf(kind) { if (!MPD.has(kind)) { const f = path.join(ld.ROOT, 'odyssey/creatures/parts', kind + '.mpd'); MPD.set(kind, fs.existsSync(f) ? ld.mpdFiles(fs.readFileSync(f, 'utf8')) : new Map()); } return MPD.get(kind); }
const PAL = [[220, 70, 60], [60, 140, 220], [240, 190, 40], [90, 180, 90], [200, 90, 200], [60, 200, 200], [240, 130, 40], [150, 110, 80], [120, 120, 240], [230, 110, 150], [140, 200, 60], [90, 90, 90], [250, 220, 150], [40, 90, 140]];
/* a row's geometry in the renderer's frame (LDraw: y down): world (y up) -> (x, -y, -z) */
const GEO = new Map();
function geo(row, files) {
  const key = (row.file || row.part) + '|' + row.col;
  if (!GEO.has(key)) GEO.set(key, row.file ? ld.flat(row.file, row.col, files) : ld.flat(row.part, row.col));
  return GEO.get(key);
}
function place(g, m, tint) {
  const t = new Float32Array(g.tri.length), s = new Float32Array(g.seg.length);
  const tr = (src, dst) => { for (let i = 0; i < src.length; i += 3) { const x = src[i], y = src[i + 1], z = src[i + 2];
    dst[i] = m[0] + m[3] * x + m[4] * y + m[5] * z; dst[i + 1] = -(m[1] + m[6] * x + m[7] * y + m[8] * z); dst[i + 2] = -(m[2] + m[9] * x + m[10] * y + m[11] * z); } };
  tr(g.tri, t); tr(g.seg, s); return { tri: t, tc: g.tc, seg: s, sc: g.sc, tint };
}
function meshes(rig, v, { tint = false } = {}) {
  const files = mpdOf(rig.K.cutFrom || rig.kind), ids = rig.nodes.map(n => n.id);
  return rig.rows(v).map(r => place(geo(r, files), r.m, tint ? PAL[ids.indexOf(r.node) % PAL.length] : null));
}
function figure(rows) { return rows.map(r => place(geo(r, null), r.m, r.tint || null)); }
function cam(target, dist, az, el, fov = 34) {
  const a = az * Math.PI / 180, e = el * Math.PI / 180, p = [target[0] + dist * Math.sin(a) * Math.cos(e), target[1] + dist * Math.sin(e), target[2] + dist * Math.cos(a) * Math.cos(e)];
  return { pos: [p[0], -p[1], -p[2]], at: [target[0], -target[1], -target[2]], fov };
}
/* world point (y up) -> renderer frame */
const P = p => [p[0], -p[1], -p[2]];
function film(file, W, H, fps, n, frameFn, { keep = 12, crf = 30 } = {}) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const ff = cp.spawn(FF, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const kept = [], every = Math.max(1, Math.floor(n / keep));
  return new Promise((res, rej) => {
    let i = 0;
    const next = () => { while (i < n) { const img = frameFn(i); if (i % every === 0 && kept.length < keep) kept.push({ i, img }); i++; if (!ff.stdin.write(img.rgb)) { ff.stdin.once('drain', next); return; } } ff.stdin.end(); };
    ff.on('close', c => c === 0 ? res(kept) : rej(new Error('ffmpeg ' + c))); next();
  });
}
function jpeg(file, img, q = 3) { fs.mkdirSync(path.dirname(file), { recursive: true }); cp.execFileSync(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-i', '-', '-q:v', String(q), file], { input: R.ppm(img) }); }
module.exports = { meshes, figure, cam, film, jpeg, P, FF, PAL, mpdOf };
