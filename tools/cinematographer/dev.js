#!/usr/bin/env node
/* tools/cinematographer/dev.js — a take kept open in the player for working on its shots without preparing it again (a take takes
   about ten minutes to prepare on swiftshader; a plan re-solves in one or two).

     NODE_PATH=<playwright> node tools/cinematographer/dev.js OD-B09-S09 --dir <scratch dir> [--sheet odyssey/score/<scene>.choreo.json]
          [--size 640x360]

   Then write commands, one per line, to <dir>/cmd (the file is consumed):
     solve              re-plan (tools/cinematographer/plan.js) and re-solve (solve.js, read afresh) -> <dir>/report.json
     stills a,b,c       frames at those times -> <dir>/t<time>.jpg
     sheet [name]       one frame in the middle of every shot -> <dir>/<name>/NN.jpg and <dir>/<name>.jpg (a contact sheet)
     exit
   Needs the repository served on :8899 and a player that carries the take's cinematographer hook. */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2), sid = args.find(a => /^OD-B\d\d-S\d\d$/.test(a));
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const dir = path.resolve(opt('dir', '.')), sheet = opt('sheet', `odyssey/score/${sid}.choreo.json`), [W, H] = opt('size', '640x360').split('x').map(Number);
fs.mkdirSync(dir, { recursive: true });
const t0 = Date.now(), say = (...a) => console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(5) + 's', ...a);
const FF = (() => { try { return execFileSync('python3', ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim(); } catch (e) { return 'ffmpeg'; } })();
const Plan = require('./plan.js');
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--mute-audio'] });
  const page = await browser.newPage({ viewport: { width: W, height: H } }); page.setDefaultTimeout(3600000);
  page.on('pageerror', e => say('page error', e.message)); page.on('console', m => { const t = m.text(); if (/^\[(take|creatures)\]/.test(t) || m.type() === 'error' && !/Failed to load/.test(t)) say(t.slice(0, 300)); });
  await page.goto('http://localhost:' + (process.env.PORT || 8899) + '/film-readymades/production/Film-Butter-Odyssey.html', { timeout: 1800000 });
  await page.waitForFunction(() => window.ButterLocation && window.ButterFilms?.current && !ButterFilms.busy && ButterCast.cast.length, null, { timeout: 1800000 });
  const loc = 'odyssey-' + sid.toLowerCase();
  if ((await page.evaluate(() => ButterFilms.current.sourceId)) !== loc) {
    await page.evaluate(l => { const t = ButterFilms.records.find(r => r.id === l).title, o = [...document.querySelectorAll('#versionSelect option')].find(o => o.textContent.trim() === t); return ButterFilms.switchTo(o.value); }, loc);
    await page.waitForFunction(l => ButterFilms.current?.sourceId === l && !ButterFilms.busy && ButterCast.cast.length, loc, { timeout: 900000 }); }
  await page.evaluate(() => { document.body.classList.add('kf'); const st = document.createElement('style'); st.textContent = 'body.kf header,body.kf .topbar,body.kf footer,body.kf nav,body.kf #filmWorldTools{visibility:hidden!important}'; document.head.appendChild(st); });
  say('location', loc, 'loaded; preparing');
  const C = JSON.parse(fs.readFileSync(path.join(ROOT, sheet), 'utf8'));
  const plan0 = Plan.plan(sid, { sheet }); fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify(plan0, null, 1));
  const info = await page.evaluate(o => OdysseyTake.exportStart(o), { mode: 'cut', w: W, h: H, choreo: C, shots: plan0 });
  fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(info.cine, null, 1)); say('prepared; shots', JSON.stringify(info.shots));
  const cmdF = path.join(dir, 'cmd');
  const still = async (t, f) => { const r = await page.evaluate(t => OdysseyTake.frame(t, { quality: 0.85 }), t); fs.writeFileSync(f, Buffer.from(r.jpeg, 'base64')); return r; };
  for (;;) {
    if (!fs.existsSync(cmdF)) { await new Promise(r => setTimeout(r, 1500)); continue; }
    const lines = fs.readFileSync(cmdF, 'utf8').split('\n').map(s => s.trim()).filter(Boolean); fs.unlinkSync(cmdF);
    for (const L of lines) {
      const [cmd, arg] = L.split(/\s+/); say('>', L);
      try {
        if (cmd === 'exit') { await browser.close(); return; }
        if (cmd === 'solve') { delete require.cache[require.resolve('./plan.js')]; const P = require('./plan.js').plan(sid, { sheet }); fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify(P, null, 1));
          const rep = await page.evaluate(P => OdysseyTake.cineReload(P), P); fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(rep, null, 1));
          say('solved in', rep.solvedIn, 's; legal', rep.shots.filter(s => s.legal).length, 'of', rep.shots.length); }
        if (cmd === 'stills') for (const t of arg.split(',').map(Number)) { const r = await still(t, path.join(dir, 't' + t.toFixed(1) + '.jpg')); say('still', t, r.shot); }
        if (cmd === 'mark') for (const t of arg.split(',').map(Number)) { const f = path.join(dir, 'm' + t.toFixed(1) + '.jpg'); await still(t, f); const d = await page.evaluate(t => OdysseyTake.cineDraw(t), t);
          fs.writeFileSync(f + '.json', JSON.stringify(d)); execFileSync('python3', ['-c', `
import json,sys
from PIL import Image,ImageDraw
f=sys.argv[1];d=json.load(open(f+'.json'));im=Image.open(f);g=ImageDraw.Draw(im);w,h=im.size
for m in d['marks']:
  if m['z']>1: continue
  x,y=m['u']*w,m['v']*h;c={'head':(255,0,255),'eye':(0,255,255),'crown':(255,255,0),'feet':(0,255,0),'box':(255,128,0)}.get(m['n'],(255,255,255))
  g.ellipse([x-4,y-4,x+4,y+4],outline=c,width=2);g.text((x+5,y-5),m['id'][:6]+':'+m['n'],fill=c)
im.save(f)`, f]); say('mark', f, JSON.stringify(d.report && { kind: d.report.kind, legal: d.report.legal, cam: d.report.camera })); }
        if (cmd === 'js') { const fn = require(path.resolve(arg)); delete require.cache[require.resolve(path.resolve(arg))]; say('js', JSON.stringify(await fn(page, dir)).slice(0, 2000)); }
        if (cmd === 'sheet') { const name = arg || 'sheet', D = path.join(dir, name); fs.mkdirSync(D, { recursive: true }); for (const f of fs.readdirSync(D)) fs.unlinkSync(path.join(D, f));
          const rep = await page.evaluate(() => OdysseyTake.info().cine); let k = 0;
          for (const s of rep.shots) { const t = (s.t0 + s.t1) / 2; await still(t, path.join(D, String(k++).padStart(2, '0') + '.jpg')); }
          const cols = 6, rows = Math.ceil(k / cols);
          execFileSync(FF, ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(D, '%02d.jpg'), '-vf', `scale=320:-1,tile=${cols}x${rows}`, '-frames:v', '1', path.join(dir, name + '.jpg')]);
          say('sheet', path.join(dir, name + '.jpg'), k, 'shots'); }
      } catch (e) { say('error', e.message.slice(0, 500)); }
    }
  }
})();
