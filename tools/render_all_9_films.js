/**
 * tools/render_all_9_films.js
 * Deterministic 1920x1080 30fps WebGL Stop-Motion Film Renderer + Stereo Audio Muxer
 * for all 9 Shield of Achilles films.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const FILMS_DIR = path.join(ROOT, 'films/shield-of-achilles');

const FILMS = [
  { dir: '01-huashu-motion',     mp4: 'film-01-huashu-motion.mp4',     dur: 16, posterT: 2.1 },
  { dir: '02-rossark-motion',    mp4: 'film-02-rossark-motion.mp4',    dur: 12, posterT: 7.5 },
  { dir: '03-take-one',          mp4: 'film-03-take-one.mp4',          dur: 16, posterT: 6.1 },
  { dir: '04-reanimate',         mp4: 'film-04-reanimate.mp4',         dur: 14, posterT: 12.5 },
  { dir: '05-argo',              mp4: 'film-05-argo.mp4',              dur: 16, posterT: 6.1 },
  { dir: '06-explainroo',        mp4: 'film-06-explainroo.mp4',        dur: 16, posterT: 13.8 },
  { dir: '07-video-director',    mp4: 'film-07-video-director.mp4',    dur: 12, posterT: 2.0 },
  { dir: '08-earshot',           mp4: 'film-08-earshot.mp4',           dur: 15, posterT: 7.5 },
  { dir: '09-behind-the-scenes', mp4: 'film-09-behind-the-scenes.mp4', dur: 16, posterT: 2.1 },
];

const FPS = 30;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist']
  });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const filters = process.argv.slice(2);
  for (const f of FILMS) {
    if (filters.length > 0 && !filters.some((flt) => f.dir.includes(flt))) continue;
    const fdir = path.join(FILMS_DIR, f.dir);
    const htmlPath = path.join(fdir, 'index.html');
    const outMp4 = path.join(FILMS_DIR, f.mp4);
    const posterPath = path.join(fdir, 'poster.png');
    const wavPath = path.join(fdir, 'assets/sound.wav');
    const tmpFrames = path.join('/tmp', `frames_${f.dir}`);

    fs.rmSync(tmpFrames, { recursive: true, force: true });
    fs.mkdirSync(tmpFrames, { recursive: true });

    console.log(`[Render] Loading ${f.dir}/index.html (${f.dur}s @ ${FPS}fps)...`);
    await page.goto('file://' + htmlPath, { waitUntil: 'load', timeout: 60000 });

    // Capture high-res PNG poster at hero close-up timestamp
    await page.evaluate((t) => window.renderFrame(t), f.posterT);
    await page.screenshot({ path: posterPath, type: 'png' });

    const totalFrames = f.dur * FPS;
    for (let i = 0; i < totalFrames; i++) {
      const t = i / FPS;
      await page.evaluate((sec) => window.renderFrame(sec), t);
      const frameFile = path.join(tmpFrames, `f_${String(i).padStart(4, '0')}.jpg`);
      await page.screenshot({ path: frameFile, type: 'jpeg', quality: 92 });
    }

    const ffArgs = [
      '-y',
      '-framerate', String(FPS),
      '-i', path.join(tmpFrames, 'f_%04d.jpg'),
    ];
    if (fs.existsSync(wavPath)) {
      ffArgs.push('-i', wavPath);
    }
    ffArgs.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-pix_fmt', 'yuv420p'
    );
    if (fs.existsSync(wavPath)) {
      ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
    }
    ffArgs.push('-movflags', '+faststart', outMp4);

    execFileSync('ffmpeg', ffArgs, { stdio: 'ignore' });
    fs.rmSync(tmpFrames, { recursive: true, force: true });
    const szMb = (fs.statSync(outMp4).size / (1024 * 1024)).toFixed(2);
    console.log(`  -> Wrote ${f.mp4} (${szMb} MB) + poster.png`);
  }

  await browser.close();
  console.log('All 9 films rendered and muxed with stereo audio!');
})();
