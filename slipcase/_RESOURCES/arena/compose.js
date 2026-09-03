#!/usr/bin/env node
// Run the repository's layered builder (NabugoBrand.compose) in the local viewer page
// with either a custom CARD (S07) or PLAN overrides (S06). Writes an MPD and prints a
// JSON report of what each layer placed and refused. Needs: python3 -m http.server 8899
// running from the repository root.
// usage: node compose.js (--card card.json | --plan plan.json) --out file.mpd [--seed 1] [--temperament LOW|HIGH]
const { chromium } = require('/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad/node_modules/playwright');
const fs = require('fs'), path = require('path');
const SP = '/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad';
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const cardFile = arg('--card'), planFile = arg('--plan'), out = arg('--out') || 'composed.mpd', seed = +(arg('--seed') || 1), temperament = arg('--temperament') || 'LOW';
if (!cardFile && !planFile) { console.log('give --card card.json or --plan plan.json'); process.exit(2); }
const card = cardFile ? JSON.parse(fs.readFileSync(cardFile, 'utf8')) : null;
const plan = planFile ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : null;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
  await ctx.route('**/cdn.jsdelivr.net/**', async r => { const u = r.request().url(); let f = null; if (u.includes('three.min.js')) f = SP + '/node_modules/three/build/three.min.js'; else if (u.includes('OrbitControls')) f = SP + '/node_modules/three/examples/js/controls/OrbitControls.js'; return r.fulfill({ status: 200, contentType: 'application/javascript', body: f ? fs.readFileSync(f, 'utf8') : '' }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:8899/gauntlet.html', { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(16000);
  const r = await p.evaluate(async ({ card, plan, seed, temperament }) => {
    const B = window.NabugoBrand;
    try {
      if (card) { card.id = 'agent'; B.CARDS.agent = card; }
      const build = await B.compose({ card: card ? 'agent' : 'castle', seed, temperament, plan: plan || undefined });
      const mpd = build.toMPD({}); const a = B.audit(build);
      const layers = (build.reports || []).map(x => ({ layer: x.layer, placed: x.placed, refused: x.refusedCount,
        why: x.refused.reduce((m, r) => { const k = x.layer + '/' + r.gen + ': ' + String(r.why).slice(0, 70); m[k] = (m[k] || 0) + 1; return m; }, {}) }));
      return { ok: true, pieces: build.site.places.length, blocks: (mpd.match(/^0 FILE /gm) || []).length, layers, trapped: (a.trapped || []).length, uncommitted: a.uncommitted != null ? +a.uncommitted.toFixed(3) : null, plan: Object.keys(build.plan || {}), mpd };
    } catch (e) { return { ok: false, error: String(e && e.stack || e).slice(0, 600) }; }
  }, { card, plan, seed, temperament });
  await b.close();
  if (!r.ok) { console.log(JSON.stringify({ ok: false, error: r.error, pageErrors: errs })); process.exit(1); }
  fs.writeFileSync(out, r.mpd); delete r.mpd; r.out = out; r.pageErrors = errs;
  console.log(JSON.stringify(r, null, 1));
})();
