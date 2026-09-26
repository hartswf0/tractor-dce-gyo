#!/usr/bin/env node
/* tools/forage/look.js — render forage cards through odyssey-forage.html?render=<id> and keep the frames, so a build is
   looked at before it is called done. three comes from node_modules (the page asks jsdelivr; the route answers locally).

   Serve the repository first: (setsid nohup python3 -m http.server 8899 > /dev/null 2>&1 &)
   NODE_PATH=<dir with playwright@1.56 and three@0.128> node tools/forage/look.js --out <dir> [--size 480] [--jpeg] id [id ...] | --all [--type t] */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..', '..'), args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const OUT = opt('out', path.join(ROOT, 'odyssey/thumbs')), SIZE = +opt('size', 480), BASE = opt('base', 'http://localhost:8899/');
const THREE_DIR = path.dirname(require.resolve('three/package.json'));
let ids = args.filter((a, i) => !a.startsWith('--') && !['--out', '--size', '--base', '--type', '--t', '--view', '--studio', '--az', '--el', '--zoom', '--w', '--h', '--at'].includes(args[i - 1]));
const TIMES = opt('t', '') ? opt('t').split(',').map(Number) : [null];   // --t 0,5,12: previs frames at those seconds
if (args.includes('--all')) { const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'odyssey/forage.json'), 'utf8')); ids = idx.cards.filter(c => !opt('type') || c.type === opt('type')).map(c => c.id); }
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +opt('w', SIZE), height: +opt('h', SIZE) } });
  await page.route('https://cdn.jsdelivr.net/npm/three@0.128.0/**', r => { const rel = r.request().url().split('three@0.128.0/')[1]; const f = path.join(THREE_DIR, rel); return fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'application/javascript' }) : r.abort(); });
  page.on('pageerror', e => console.error('page error:', e.message));
  let done = 0;
  for (const id of ids) {
   for (const tt of TIMES) {
    const t = Date.now();
    try {
      await page.goto(BASE + 'odyssey-forage.html?render=' + encodeURIComponent(id) + (tt != null ? '&t=' + tt : '') + (opt('view') ? '&view=' + opt('view') : '') + (opt('studio') ? '&studio=' + opt('studio') + '&az=' + opt('az', 35) + '&el=' + opt('el', 18) + '&zoom=' + opt('zoom', 1) + (opt('at') ? '&at=' + opt('at') : '') : ''), { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(i => window.__ready === i, id, { timeout: 600000 });
      await page.waitForTimeout(250);
      const file = path.join(OUT, id + (tt != null ? '@' + String(tt).padStart(5, '0') : '') + (args.includes('--jpeg') ? '.jpg' : '.png'));
      await page.screenshot({ path: file, type: args.includes('--jpeg') ? 'jpeg' : 'png', quality: args.includes('--jpeg') ? 82 : undefined, timeout: 300000 });   /* a great build takes a software renderer a while */
      console.log(`${++done}/${ids.length} ${id} ${((Date.now() - t) / 1000).toFixed(1)} s`);
    } catch (e) { console.log(`${++done}/${ids.length} ${id} FAILED ${e.message.split('\n')[0]}`); }
   }
  }
  await browser.close();
})();
