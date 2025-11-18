const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const GRID_ROWS = 9;
const GRID_COLS = 9;

const STATE = {
  disc: null,
  scenes: [],
  currentIndex: 0,
  fps: 30,
  sceneDurationSeconds: 5,
  mediaRecorder: null,
  recordedChunks: [],
  isRecording: false,
};

function $(id) { return document.getElementById(id); }

window.addEventListener('DOMContentLoaded', () => {
  const canvas = $('gridCanvas');
  const ctx = canvas.getContext('2d');

  $('prevSceneBtn').addEventListener('click', () => {
    if (!STATE.scenes.length) return;
    STATE.currentIndex = (STATE.currentIndex - 1 + STATE.scenes.length) % STATE.scenes.length;
    drawCurrentScene(ctx);
  });

  $('nextSceneBtn').addEventListener('click', () => {
    if (!STATE.scenes.length) return;
    STATE.currentIndex = (STATE.currentIndex + 1) % STATE.scenes.length;
    drawCurrentScene(ctx);
  });

  $('downloadPngBtn').addEventListener('click', () => {
    if (!STATE.scenes.length) return;
    downloadCurrentPng(canvas);
  });

  $('downloadAllPngBtn').addEventListener('click', async () => {
    if (!STATE.scenes.length) return;
    for (let i = 0; i < STATE.scenes.length; i++) {
      STATE.currentIndex = i;
      drawCurrentScene(ctx);
      await downloadPngForIndex(canvas, i, false);
      await sleep(300);
    }
    setStatus(`Downloaded ${STATE.scenes.length} PNGs (check your browser downloads).`);
  });

  $('recordVideoBtn').addEventListener('click', async () => {
    if (!STATE.scenes.length) return;
    if (STATE.isRecording) {
      // no-op; recording will stop automatically after all scenes
      return;
    }
    await recordAllScenes(canvas, ctx);
  });

  loadDisc(ctx);
});

async function loadDisc(ctx) {
  try {
    setStatus('Loading undaunted-disc.json…');
    const res = await fetch('undaunted-disc.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    STATE.disc = json;
    STATE.scenes = Array.isArray(json.disc_data) ? json.disc_data : [];
    STATE.currentIndex = 0;
    if (!STATE.scenes.length) {
      setStatus('No scenes found in disc_data');
      return;
    }
    drawCurrentScene(ctx);
    setStatus(`Loaded ${STATE.scenes.length} scenes.`);
  } catch (err) {
    console.error(err);
    setStatus('Failed to load undaunted-disc.json');
  }
}

function drawCurrentScene(ctx) {
  const canvas = ctx.canvas;
  const scene = STATE.scenes[STATE.currentIndex];
  if (!scene) return;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Title & meta at top
  const margin = 40;
  ctx.fillStyle = '#E5E7EB';
  ctx.font = '28px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const label = `SCENE ${scene.scene_number}: ${scene.title || ''}`;
  ctx.fillText(label, margin, margin);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '18px "Courier New", monospace';
  const sub = scene.time_period || '';
  if (sub) ctx.fillText(sub, margin, margin + 34);

  // Layout: 9×9 grid on the left, bold credits panel on the right, all inside 16:9.
  const chatWidth = CANVAS_WIDTH * 0.50;
  const maxGridWidth = CANVAS_WIDTH - margin * 3 - chatWidth;
  const maxGridHeight = CANVAS_HEIGHT - margin * 2;
  const gridSize = Math.min(maxGridWidth, maxGridHeight);
  const gridX = margin;
  const gridY = (CANVAS_HEIGHT - gridSize) / 2;
  const chatX = gridX + gridSize + margin;
  const chatY = gridY;
  const chatHeight = gridSize;

  const legend = buildSceneLegend(scene);
  drawSceneGrid(ctx, scene, gridX, gridY, gridSize, legend);
  drawSceneChat(ctx, scene, chatX, chatY, chatWidth, chatHeight, legend);

  const sceneLabel = $('sceneLabel');
  if (sceneLabel) {
    sceneLabel.textContent = `Scene ${STATE.currentIndex + 1} / ${STATE.scenes.length} — ${scene.title || ''}`;
  }
}

function buildSceneLegend(scene) {
  const layout = scene.initial_grid_layout || [];
  const seen = new Set();
  const list = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let idx = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const symbol = (layout[r] && layout[r][c]) || '';
      if (!symbol || !symbol.trim()) continue;
      if (seen.has(symbol)) continue;
      seen.add(symbol);

      let code;
      if (idx < letters.length) {
        code = letters[idx];
      } else {
        const base = letters[idx % letters.length];
        const suffix = Math.floor(idx / letters.length) + 1;
        code = `${base}${suffix}`;
      }
      list.push({ symbol, code });
      idx++;
    }
  }

  const map = new Map();
  list.forEach(entry => map.set(entry.symbol, entry.code));
  return { map, list };
}

function drawSceneGrid(ctx, scene, gridX, gridY, gridSize, legend) {
  const cellW = gridSize / GRID_COLS;
  const cellH = gridSize / GRID_ROWS;

  // Grid backdrop
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(gridX, gridY, gridSize, gridSize);
  ctx.fill();
  ctx.stroke();

  const layout = scene.initial_grid_layout || [];

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const x = gridX + c * cellW;
      const y = gridY + r * cellH;
      const symbol = (layout[r] && layout[r][c]) || '';

      if (symbol && symbol.trim()) {
        ctx.fillStyle = '#0B1220';
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);
      }

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 0.75;
      ctx.strokeRect(x, y, cellW, cellH);

      if (symbol && symbol.trim()) {
        ctx.save();
        // Strong, Saul Bass–style letter in the cell
        ctx.fillStyle = '#FBBF24';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const code = legend && legend.map ? (legend.map.get(symbol) || '?') : '?';
        const baseSize = Math.min(cellW, cellH) * 0.65;
        ctx.font = `${baseSize}px "Courier New", monospace`;
        ctx.fillText(code, x + cellW / 2, y + cellH / 2);
        ctx.restore();
      }
    }
  }
}

function drawSceneChat(ctx, scene, x, y, width, height, legend) {
  const pad = 16;
  const innerX = x + pad;
  let yy = y + pad;
  const maxWidth = width - pad * 2;
  const maxY = y + height - pad;

  // Panel backdrop
  ctx.fillStyle = '#020617';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, width, height);
  ctx.strokeRect(x, y, width, height);

  // Scene and title – big, poster-like type
  ctx.fillStyle = '#F9FAFB';
  ctx.font = '28px "Courier New", monospace';
  wrapText(ctx, `SCENE ${scene.scene_number}`, innerX, yy, maxWidth, 30);
  yy += 36;

  if (scene.title && yy < maxY) {
    ctx.fillStyle = '#FBBF24';
    ctx.font = '30px "Courier New", monospace';
    wrapText(ctx, scene.title.toUpperCase(), innerX, yy, maxWidth, 34);
    yy += 44;
  }

  if (scene.time_period && yy < maxY) {
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px "Courier New", monospace';
    wrapText(ctx, scene.time_period, innerX, yy, maxWidth, 22);
    yy += 30;
  }

  // Key figures block — big, one name per line, like film credits
  if (Array.isArray(scene.key_figures) && scene.key_figures.length && yy < maxY) {
    ctx.fillStyle = '#E5E7EB';
    ctx.font = '20px "Courier New", monospace';
    wrapText(ctx, 'WITH', innerX, yy, maxWidth, 26);
    yy += 32;

    ctx.fillStyle = '#F9FAFB';
    ctx.font = '22px "Courier New", monospace';
    const maxNames = 8;
    for (let i = 0; i < Math.min(maxNames, scene.key_figures.length); i++) {
      if (yy > maxY) break;
      const name = scene.key_figures[i];
      wrapText(ctx, name.toUpperCase(), innerX, yy, maxWidth, 28);
      yy += 34;
    }
  }

  // Compact grid legend: letter → symbol name
  if (legend && Array.isArray(legend.list) && legend.list.length && yy < maxY) {
    yy += 8;
    if (yy < maxY) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px "Courier New", monospace';
      wrapText(ctx, 'GRID', innerX, yy, maxWidth, 20);
      yy += 26;

      ctx.fillStyle = '#D1D5DB';
      ctx.font = '14px "Courier New", monospace';
      const maxLegendLines = 6;
      for (let i = 0; i < Math.min(maxLegendLines, legend.list.length); i++) {
        if (yy > maxY) break;
        const entry = legend.list[i];
        const line = `${entry.code} — ${entry.symbol}`;
        wrapText(ctx, line, innerX, yy, maxWidth, 22);
        yy += 26;
      }
    }
  }

  // One-sentence summary line (plot or theme)
  let summaryLine = '';
  if (Array.isArray(scene.core_plot_points) && scene.core_plot_points[0]) {
    summaryLine = scene.core_plot_points[0];
  }

  if (!summaryLine) {
    summaryLine = Array.isArray(scene.themes_narrative_focus) && scene.themes_narrative_focus[0]
      ? scene.themes_narrative_focus[0]
      : scene.emotional_arc_lewis || '';
  }

  if (summaryLine && yy < maxY) {
    yy += 8;
    ctx.fillStyle = '#A855F7';
    ctx.font = '16px "Courier New", monospace';
    wrapText(ctx, summaryLine, innerX, yy, maxWidth, 22);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/g);
  let line = '';
  let yy = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, yy);
      line = words[n] + ' ';
      yy += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, yy);
}

function setStatus(msg) {
  const el = $('statusLine');
  if (el) el.textContent = msg || '';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sceneSlug(scene) {
  const base = scene && scene.title ? scene.title : `scene-${scene.scene_number}`;
  return String(base).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'scene';
}

async function downloadCurrentPng(canvas) {
  await downloadPngForIndex(canvas, STATE.currentIndex, true);
}

async function downloadPngForIndex(canvas, index, updateStatus) {
  const scene = STATE.scenes[index];
  if (!scene) return;
  const slug = sceneSlug(scene);
  return new Promise(resolve => {
    canvas.toBlob(blob => {
      if (!blob) return resolve();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `undaunted-${String(scene.scene_number).padStart(2, '0')}-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (updateStatus) {
        setStatus(`Downloaded PNG for scene ${scene.scene_number}: ${scene.title || ''}`);
      }
      resolve();
    }, 'image/png');
  });
}

async function recordAllScenes(canvas, ctx) {
  const totalScenes = STATE.scenes.length;
  const totalSeconds = totalScenes * STATE.sceneDurationSeconds;
  setStatus(`Recording video: ${totalScenes} scenes × ${STATE.sceneDurationSeconds}s ≈ ${totalSeconds}s total…`);

  const stream = canvas.captureStream(STATE.fps);
  const options = { mimeType: 'video/webm;codecs=vp9' };
  let recorder;
  try {
    recorder = new MediaRecorder(stream, options);
  } catch (e) {
    recorder = new MediaRecorder(stream);
  }

  STATE.mediaRecorder = recorder;
  STATE.recordedChunks = [];
  STATE.isRecording = true;

  recorder.ondataavailable = evt => {
    if (evt.data && evt.data.size > 0) {
      STATE.recordedChunks.push(evt.data);
    }
  };

  recorder.onstop = () => {
    STATE.isRecording = false;
    const blob = new Blob(STATE.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'undaunted-courage-grid-slideshow.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setStatus('Video recording complete (downloaded WebM).');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  recorder.start();

  // Play each scene as a still frame for sceneDurationSeconds
  for (let i = 0; i < STATE.scenes.length; i++) {
    STATE.currentIndex = i;
    drawCurrentScene(ctx);
    await sleep(STATE.sceneDurationSeconds * 1000);
  }

  recorder.stop();
}
