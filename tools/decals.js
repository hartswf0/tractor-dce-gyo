#!/usr/bin/env node
/* tools/decals.js — the halfworld's faces as LEGO head decals, one PNG per character and direction.

   node tools/decals.js [--out world/faces/odyssey] [--who penelope,odysseus] [--emotions recognition,joy] [--size 256]
       [--chromium /path/to/chrome]

   Headless Chromium runs world/halfworld-face.js and the decal pass of world/face.js (the same code the film uses live)
   on a bare page: for each face in HalfFace.FACES and each direction in HalfFace.EMOTIONS plus 'neutral', the drawing is
   dotted and masked to the print area and written as <out>/<who>/<emotion>.png (transparent, black dots), with a contact
   sheet <out>/sheet.png of every face at every direction and <out>/index.json listing what is there and how the decal
   maps onto a 3626b head (the print spans 90 degrees of the front and 18 LDU from 2 below the crown). A page that wants a
   face on a head without the film (word-to-theatre, a poster, a print) reads the PNG; the film draws the same thing live. */
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const ROOT = path.join(__dirname, '..'), OUT = path.resolve(opt('out', path.join(ROOT, 'world', 'faces', 'odyssey'))), SIZE = +opt('size', 256);
const onlyWho = opt('who', '') ? opt('who').split(',') : null, onlyEmo = opt('emotions', '') ? opt('emotions').split(',') : null;
const chromiumPath = opt('chromium', process.env.CHROMIUM || undefined);
(async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: chromiumPath, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.on('pageerror', e => console.error('page error', e.message));
  const src = f => fs.readFileSync(path.join(ROOT, 'world', f), 'utf8');
  await page.setContent('<!doctype html><html><body></body></html>');
  await page.addScriptTag({ content: src('halfworld-face.js') }); await page.addScriptTag({ content: src('face.js') });
  const result = await page.evaluate(({ SIZE, onlyWho, onlyEmo }) => {
    const H = window.HalfFace, F = window.Face, out = { faces: [], emotions: ['neutral', ...Object.keys(H.EMOTIONS)], pngs: {} };
    const who = Object.keys(H.FACES).filter(w => !onlyWho || onlyWho.includes(w)), emos = out.emotions.filter(e => !onlyEmo || onlyEmo.includes(e));
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = SIZE; const ctx = canvas.getContext('2d');
    const srcc = document.createElement('canvas'); srcc.width = srcc.height = F.HW.size; const sctx = srcc.getContext('2d', { willReadFrequently: true });
    const sheet = document.createElement('canvas'); const cell = 96; sheet.width = cell * emos.length; sheet.height = cell * who.length; const sg = sheet.getContext('2d'); sg.fillStyle = '#f4f4f0'; sg.fillRect(0, 0, sheet.width, sheet.height);
    for (let r = 0; r < who.length; r++) {
      const w = who[r]; out.faces.push(w);
      for (let c = 0; c < emos.length; c++) {
        const e = emos[c], st = e === 'neutral' ? {} : H.EMOTIONS[e]; const v = {};   // the direction as the film's channels
        for (const [k, ch] of F.HW_MAP) if (st[k]) v[ch] = st[k];
        const face = { who: w, ctx, canvas, sctx, src: srcc, ink: 0 }; if (!F.drawHalfworld(face, v)) continue;
        // the decal PNG is drawn un-mirrored (the film mirrors for the cylinder's u)
        const flat = document.createElement('canvas'); flat.width = flat.height = SIZE; const fg = flat.getContext('2d'); fg.translate(SIZE, 0); fg.scale(-1, 1); fg.drawImage(canvas, 0, 0);
        out.pngs[w + '/' + e] = { data: flat.toDataURL('image/png'), ink: face.ink };
        sg.drawImage(flat, c * cell + 4, r * cell + 4, cell - 8, cell - 8);
      }
    }
    sg.fillStyle = '#141414'; sg.font = '10px monospace'; for (let c = 0; c < emos.length; c++) sg.fillText(emos[c].slice(0, 12), c * cell + 4, 10); for (let r = 0; r < who.length; r++) sg.fillText(who[r], 4, r * cell + cell - 4);
    out.sheet = sheet.toDataURL('image/png'); return out;
  }, { SIZE, onlyWho, onlyEmo });
  await browser.close();
  fs.mkdirSync(OUT, { recursive: true }); let n = 0; const index = { source: 'odyssey-halfworld assets/character/_close/face.mjs via world/halfworld-face.js', head: '3626b', print: { degrees: 90, top: 2, height: 18, radius: 13.4, note: 'LDU from the crown; the decal fills the print area, x across the face' }, size: SIZE, faces: {}, emotions: result.emotions };
  for (const [k, v] of Object.entries(result.pngs)) { const [w, e] = k.split('/'); fs.mkdirSync(path.join(OUT, w), { recursive: true }); fs.writeFileSync(path.join(OUT, w, e + '.png'), Buffer.from(v.data.split(',')[1], 'base64')); (index.faces[w] = index.faces[w] || {})[e] = { file: `${w}/${e}.png`, ink: v.ink }; n++; }
  fs.writeFileSync(path.join(OUT, 'sheet.png'), Buffer.from(result.sheet.split(',')[1], 'base64')); fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
  console.log(`${n} decals for ${result.faces.length} faces at ${result.emotions.length} directions in ${OUT}; sheet.png, index.json`);
})().catch(e => { console.error(e); process.exit(1); });
