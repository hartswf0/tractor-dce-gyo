#!/usr/bin/env node
/**
 * tools/render_worldtext_master_film.js
 * ============================================================================
 * Renders the single-continuous-take Word-by-Word 1080p Master Film:
 *   films/shield-of-achilles/film-worldtext-final.mp4 (1920x1080, 246.39s)
 * directly from `worldtext.html?render=1` using 8 parallel Playwright workers,
 * muxed with `achilles/audio/ACH-WORLD-SHIELD.wav`.
 *
 * Also captures verification screenshots of both the interactive Two-Column
 * Critical Edition (`worldtext.html`) and the 1080p Render Frame (`?render=1`)
 * into the artifacts directory.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT_MP4 = path.join(ROOT, 'films', 'shield-of-achilles', 'film-worldtext-final.mp4');
const AUDIO_WAV = path.join(ROOT, 'achilles', 'audio', 'ACH-WORLD-SHIELD.wav');
const FRAMES_DIR = path.join('/tmp', 'worldtext_master_frames');
const ARTIFACT_DIR = '/Users/gaia/.gemini/antigravity/brain/d8a4c224-935e-4162-8570-670291acacf3';

const FPS = 12;
const WORKERS = 8;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const cleanUrl = decodeURIComponent(req.url.split('?')[0]);
      const relPath = cleanUrl === '/' ? '/worldtext.html' : cleanUrl;
      const filePath = path.join(rootDir, relPath);
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function main() {
  // Load timeline duration
  const timelineCode = fs.readFileSync(path.join(ROOT, 'achilles', 'wordtext-timeline.js'), 'utf8');
  const durMatch = timelineCode.match(/"totalDuration":\s*([0-9.]+)/);
  const DURATION = durMatch ? parseFloat(durMatch[1]) : 246.39;
  const TOTAL_FRAMES = Math.ceil(DURATION * FPS);

  console.log(`=== Rendering Homeric Word-by-Word Master Film ===`);
  console.log(`Duration: ${DURATION.toFixed(2)}s | FPS: ${FPS} | Total Frames: ${TOTAL_FRAMES} | Workers: ${WORKERS}`);

  if (fs.existsSync(FRAMES_DIR)) {
    fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(FRAMES_DIR, { recursive: true });

  const { server, port } = await startStaticServer(ROOT);
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist']
  });

  // 1. Capture interactive Two-Column Critical Edition verification screenshots
  console.log(`Capturing interactive Digital Critical Edition screenshots...`);
  const uiPage = await browser.newPage({ viewport: { width: 1680, height: 1020 } });
  uiPage.on('pageerror', (err) => console.error('PAGEERROR:', err.message, err.stack));
  uiPage.on('console', (msg) => console.log('PAGE CONSOLE:', msg.type(), msg.text()));
  await uiPage.goto(`${baseUrl}/worldtext.html`, { waitUntil: 'load' });

  const uiChecks = [
    { sec: 0.0,   name: 'worldtext_scholarly_t000_bare_anvil.png' },
    { sec: 28.5,  name: 'worldtext_scholarly_t028_cosmic_boss.png' },
    { sec: 64.0,  name: 'worldtext_scholarly_t064_agora_talents.png' },
    { sec: 122.0, name: 'worldtext_scholarly_t122_golden_glebe.png' },
    { sec: DURATION - 0.1, name: 'worldtext_scholarly_t246_oceanus_complete.png' }
  ];

  for (const chk of uiChecks) {
    await uiPage.evaluate((s) => {
      window.seekToTime(s, false);
      window.renderFrame(s);
    }, chk.sec);
    await uiPage.waitForTimeout(80);
    const outPath = path.join(ARTIFACT_DIR, chk.name);
    await uiPage.screenshot({ path: outPath });
    console.log(`  [UI Screenshot] ${chk.name} (t=${chk.sec.toFixed(1)}s)`);
  }
  await uiPage.close();

  // 2. Render 1920x1080 frames across 8 parallel workers
  const tStart = Date.now();
  let completedFrames = 0;

  async function runWorker(workerIdx) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`${baseUrl}/worldtext.html?render=1`, { waitUntil: 'load' });

    for (let f = workerIdx; f < TOTAL_FRAMES; f += WORKERS) {
      const sec = f / FPS;
      await page.evaluate((s) => window.renderFrame(s), sec);
      const framePath = path.join(FRAMES_DIR, `frame_${String(f).padStart(5, '0')}.jpg`);
      await page.screenshot({ path: framePath, type: 'jpeg', quality: 90 });

      completedFrames++;
      if (completedFrames % 300 === 0 || completedFrames === TOTAL_FRAMES) {
        const elapsed = ((Date.now() - tStart) / 1000).toFixed(1);
        const pct = ((completedFrames / TOTAL_FRAMES) * 100).toFixed(1);
        console.log(`  [Progress] ${completedFrames}/${TOTAL_FRAMES} frames (${pct}%) in ${elapsed}s`);
      }
    }
    await page.close();
  }

  await Promise.all(Array.from({ length: WORKERS }, (_, i) => runWorker(i)));
  await browser.close();
  server.close();

  // Copy final 1080p render frame to artifacts as film09_3d_poster.png
  const posterSrc = path.join(FRAMES_DIR, `frame_${String(TOTAL_FRAMES - 2).padStart(5, '0')}.jpg`);
  const posterDst = path.join(ARTIFACT_DIR, 'film09_3d_poster.png');
  execFileSync('ffmpeg', ['-y', '-i', posterSrc, posterDst], { stdio: 'ignore' });

  // 3. Encode 1080p MP4 muxed with ACH-WORLD-SHIELD.wav
  console.log(`Muxing 1920x1080 MP4 with Kokoro-82M master soundtrack...`);
  execFileSync('ffmpeg', [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(FRAMES_DIR, 'frame_%05d.jpg'),
    '-i', AUDIO_WAV,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '22',
    '-r', '24',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    OUT_MP4
  ], { stdio: 'inherit' });

  const stat = fs.statSync(OUT_MP4);
  console.log(`=== Master Film Ready: ${OUT_MP4} (${(stat.size / (1024 * 1024)).toFixed(2)} MB) ===`);

  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
