// Print an HTML twin of the paper to PDF with the pre-installed Chromium (no TeX here).
const { chromium } = require('/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad/node_modules/playwright');
const [,, html, pdf] = process.argv;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.goto('file://' + html, { waitUntil: 'load' });
  await p.pdf({ path: pdf, format: 'A4', printBackground: false, margin: { top: '22mm', bottom: '22mm', left: '20mm', right: '20mm' },
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: '<div style="font: 8px Georgia, serif; color:#666; width:100%; text-align:center;"><span class="pageNumber"></span></div>' });
  await b.close();
  console.log('pdf written', pdf);
})().catch(e => { console.error(e); process.exit(1); });
