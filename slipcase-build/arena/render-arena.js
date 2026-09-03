// Render each arena castle in the neutral kits.html viewer.
// Two hazards this handles: (1) the first render after a page load dies inside the
// loader and takes the page with it, so a throwaway warm-up absorbs that and we wait
// for the page to come back; (2) after a reload the page loads its own default kit,
// so every render is verified by triangle count before the shot is taken — a picture
// of the default kit is a failure, not a result.
const { chromium } = require('/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad/node_modules/playwright');
const fs = require('fs');
const SP = '/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad';
const RUNS = __dirname + '/runs';
const STRIP = `.hx-head,.hx-ticker,.hx-transport,.hx-sheet,.hx-composer,.hx-rail,.hx-status,.hx-hint,.hx-ref{display:none!important}.hx-bed{min-height:100dvh!important}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const seeds = fs.readdirSync(RUNS).filter(s => /^S0\d$/.test(s) && fs.existsSync(`${RUNS}/${s}/castle-${s}.mpd`)).sort();
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 900, height: 600 } });
  await ctx.route('**/cdn.jsdelivr.net/**', async r => { const u = r.request().url(); let f = null;
    if (u.includes('three.min.js')) f = SP + '/node_modules/three/build/three.min.js';
    else if (u.includes('OrbitControls')) f = SP + '/node_modules/three/examples/js/controls/OrbitControls.js';
    return r.fulfill({ status: 200, contentType: 'application/javascript', body: f ? fs.readFileSync(f, 'utf8') : '' }); });
  const stats = async p => { try { return await p.evaluate(() => window.KitsPage && window.KitsPage.viewer ? window.KitsPage.viewer.getStats() : null); } catch (e) { return null; } };
  const fresh = async () => {
    const p = await ctx.newPage();
    await p.goto('http://localhost:8899/kits.html', { waitUntil: 'load', timeout: 60000 });
    await sleep(18000);
    // absorb the first-render crash
    try { await p.evaluate(async () => { const S = window.KitsPage, U = window.NabugoUI;
      await U.render(S.viewer, '0 FILE w.ldr\n0 Name: w.ldr\n1 71 0 0 0 1 0 0 0 1 0 0 0 1 3005.dat\n', null, 'w'); }); } catch (e) {}
    await sleep(20000);                       // the page may have reloaded and reloads its own default kit
    await p.addStyleTag({ content: STRIP }).catch(() => {});
    await p.evaluate(() => { const v = window.KitsPage.viewer; if (v && v.updateRendererSize) v.updateRendererSize(); }).catch(() => {});
    await sleep(1200);
    return p;
  };
  let p = await fresh();
  const base = await stats(p);
  console.log('default kit stats (a shot with these numbers is a failure):', JSON.stringify(base));
  for (const s of seeds) {
    let done = false;
    for (let attempt = 0; attempt < 3 && !done; attempt++) {
      try {
        const r = await p.evaluate(async seed => { const S = window.KitsPage, U = window.NabugoUI;
          const resp = await fetch(`./slipcase-build/arena/runs/${seed}/castle-${seed}.mpd`); if (!resp.ok) return { ok: false, why: 'fetch ' + resp.status };
          const t = await resp.text(); await U.render(S.viewer, t, null, seed);
          return { ok: true, lines: (t.match(/^1 /gm) || []).length, stats: S.viewer.getStats() }; }, s);
        if (!r.ok) { console.log('ERR', s, r.why); break; }
        if (base && r.stats && r.stats.triangles === base.triangles) { console.log('RETRY', s, 'viewer still shows the default kit'); await p.close(); p = await fresh(); continue; }
        await p.evaluate(() => window.NabugoUI.frame(window.KitsPage.viewer, 0.46));
        await sleep(2500);
        await p.locator('.hx-bed').screenshot({ path: `${RUNS}/${s}/castle-${s}.png`, timeout: 90000 });
        console.log('shot', s, r.lines, 'lines ·', r.stats.triangles.toLocaleString(), 'tris');
        done = true;
      } catch (e) { console.log('crashed on', s, '— reloading:', e.message.slice(0, 60)); try { await p.close(); } catch (x) {} p = await fresh(); }
    }
    if (!done) console.log('FAILED', s);
  }
  await b.close();
})();
