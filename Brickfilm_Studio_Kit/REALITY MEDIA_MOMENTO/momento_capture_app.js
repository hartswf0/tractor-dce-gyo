(function () {
  const state = {
    iframe: null,
    graceWindow: null,
    renderer: null,
    scene: null,
    camera: null,
    mediaRecorder: null,
    chunks: [],
    recording: false,
    lastBlobUrl: null,
    previewRunning: false,
    captureCanvas: null,
    pathStartTime: null,
    pathInitialPos: null,
    shots: [],
    mentoShots: []
  };

  const params = new URLSearchParams(window.location.search || '');
  const hostMode = params.get('host') || '';

  function log(message) {
    const logEl = document.getElementById('log');
    const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
    const line = `[${timestamp}] ${message}`;
    if (logEl) {
      logEl.textContent += line + '\n';
      logEl.scrollTop = logEl.scrollHeight;
    }
    // Also mirror to console for debugging
    console.log('[MOMENTO]', message);
  }

  function setStatus(text) {
    const statusEl = document.getElementById('status-line');
    if (statusEl) statusEl.textContent = text;
  }

  function setCameraState(isRecording) {
    const el = document.getElementById('cameraState');
    if (!el) return;
    if (isRecording) {
      el.textContent = 'REC';
      el.classList.add('recording');
    } else {
      el.textContent = 'STBY';
      el.classList.remove('recording');
    }
  }

  function getSceneName() {
    let sceneName = 'scene';
    try {
      if (state.graceWindow && state.graceWindow.document) {
        const el = state.graceWindow.document.getElementById('file-name');
        const raw = el && el.textContent ? el.textContent.trim() : '';
        if (raw) sceneName = raw;
      }
    } catch (e) {
      // best-effort only
    }
    return sceneName;
  }

  function updateShotMeta() {
    const metaEl = document.getElementById('shot-meta');
    if (!metaEl) return;

    const sceneName = getSceneName();
    const fpsInput = document.getElementById('momento-fps');
    const durInput = document.getElementById('momento-duration');
    const aspectSelect = document.getElementById('momento-aspect');
    const qualitySelect = document.getElementById('momento-quality');
    const pathSelect = document.getElementById('momento-camera-path');

    const fps = parseInt(fpsInput && fpsInput.value, 10) || 30;
    const maxSeconds = parseInt(durInput && durInput.value, 10) || 10;
    const aspectValue = aspectSelect ? aspectSelect.value : 'native';
    const qualityValue = qualitySelect ? qualitySelect.value : '720p';
    const pathValue = pathSelect ? pathSelect.value : 'manual';

    const aspectLabel = aspectValue === '4_3' ? '4:3' : 'NATIVE';
    const qualityLabel = (qualityValue || '').toUpperCase();
    const pathLabel = (pathValue || 'manual').toUpperCase();

    metaEl.textContent = `${sceneName} · ${fps}fps · ${maxSeconds}s · ${aspectLabel} · ${qualityLabel} · ${pathLabel}`;
  }

  function setMentoShotText(text) {
    const area = document.getElementById('mento-shot-text');
    if (!area) return;
    area.value = text || '';
  }

  function parseMentoShotsFromText(text) {
    const shots = [];
    if (!text) return shots;
    const lines = String(text).split(/\r?\n/);
    const pattern = /^0\s+!MENTO\s+SHOT\s+"([^"]+)"\s+POS\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+TGT\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+LENS\s+([-\d.]+)/;
    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line.startsWith('0 !MENTO SHOT')) return;
      const m = line.match(pattern);
      if (!m) return;
      const label = m[1];
      const px = parseFloat(m[2]);
      const py = parseFloat(m[3]);
      const pz = parseFloat(m[4]);
      const tx = parseFloat(m[5]);
      const ty = parseFloat(m[6]);
      const tz = parseFloat(m[7]);
      const lens = parseFloat(m[8]);
      shots.push({
        id: `SHOT_${shots.length + 1}`,
        label,
        pos: { x: px, y: py, z: pz },
        tgt: { x: tx, y: ty, z: tz },
        lens
      });
    });
    return shots;
  }

  function populateMentoShotSelect(shots) {
    const select = document.getElementById('mento-shot-select');
    if (!select) return;
    select.innerHTML = '';
    if (!shots || !shots.length) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '-- none loaded --';
      select.appendChild(opt);
      return;
    }
    shots.forEach((shot, index) => {
      const opt = document.createElement('option');
      opt.value = String(index);
      opt.textContent = `${index + 1}. ${shot.label}`;
      select.appendChild(opt);
    });
  }

  function applyMentoShot(shot) {
    if (!shot) return;
    if (!ensureGraceAttached()) {
      log('Cannot apply MENTO shot: Grace not ready.');
      return;
    }
    const cam = state.camera;
    if (!cam) {
      log('Cannot apply MENTO shot: camera not attached.');
      return;
    }
    try {
      // Grace / viewer-prime load LDraw MPDs with a 180° rotation around X (group.rotation.x = Math.PI).
      // MENTO shots are authored in the original LDraw coordinate frame, so we need to apply the
      // same transform to camera positions/targets: (x, y, z) → (x, -y, -z).
      const pos = shot.pos || { x: 0, y: 0, z: 0 };
      const tgt = shot.tgt || { x: 0, y: 0, z: 0 };
      const worldPos = {
        x: pos.x,
        y: -pos.y,
        z: -pos.z
      };
      const worldTgt = {
        x: tgt.x,
        y: -tgt.y,
        z: -tgt.z
      };

      cam.position.set(worldPos.x, worldPos.y, worldPos.z);
      if (state.graceWindow && state.graceWindow.THREE) {
        const THREE = state.graceWindow.THREE;
        const target = new THREE.Vector3(worldTgt.x, worldTgt.y, worldTgt.z);
        cam.lookAt(target);
      } else if (typeof cam.lookAt === 'function') {
        cam.lookAt(worldTgt.x, worldTgt.y, worldTgt.z);
      }
      if (typeof shot.lens === 'number' && isFinite(shot.lens) && 'fov' in cam && typeof cam.updateProjectionMatrix === 'function') {
        cam.fov = shot.lens;
        cam.updateProjectionMatrix();
      }
      log(`Applied MENTO shot "${shot.label}"`);
      setStatus(`Applied MENTO shot: ${shot.label}`);
      try {
        if (state.graceWindow && state.graceWindow.MomentoInterface && typeof state.graceWindow.MomentoInterface.renderCurrentView === 'function') {
          state.graceWindow.MomentoInterface.renderCurrentView();
        }
      } catch (e) {}
    } catch (err) {
      log('Error applying MENTO shot: ' + err.message);
    }
  }

  function playCameraSound(kind) {
    // Try explicit audio elements first (mento-sound-rec/save), then fall back to a tiny Web Audio beep.
    const el = document.getElementById(kind === 'save' ? 'mento-sound-save' : 'mento-sound-rec');
    if (el && typeof el.play === 'function') {
      try { el.currentTime = 0; el.play(); return; } catch (e) {}
    }
    if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
    try {
      const Ctx = AudioContext || webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = kind === 'save' ? 880 : 440;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Silent failure is fine; sound is purely cosmetic.
    }
  }

  function addShotToGallery(filename, url) {
    const gallery = document.getElementById('shot-gallery');
    if (!gallery) return;

    const srcUrl = url || state.lastBlobUrl;
    if (!srcUrl) return;

    // Avoid duplicating the top-most shot if filename matches.
    if (state.shots && state.shots.length && state.shots[0].filename === filename) return;

    let thumb = null;
    try {
      const preview = document.getElementById('preview-canvas');
      if (preview && typeof preview.toDataURL === 'function') {
        thumb = preview.toDataURL('image/jpeg', 0.8);
      }
    } catch (e) {
      thumb = null;
    }

    state.shots = state.shots || [];
    state.shots.unshift({ filename, url: srcUrl, thumb });
    if (state.shots.length > 9) state.shots.length = 9;

    const frag = document.createDocumentFragment();
    gallery.innerHTML = '';
    state.shots.forEach((shot) => {
      const item = document.createElement('div');
      item.className = 'shot-thumb';
      if (shot.thumb) {
        item.style.backgroundImage = `url(${shot.thumb})`;
      }
      const label = document.createElement('div');
      label.className = 'shot-thumb-label';
      label.textContent = shot.filename.replace(/\.webm$/i, '');
      item.appendChild(label);
      item.addEventListener('click', () => {
        if (shot.url) {
          window.open(shot.url, '_blank');
        }
      });
      frag.appendChild(item);
    });
    gallery.appendChild(frag);
  }

  function resolveSourceIframe() {
    if (hostMode === 'homer') {
      try {
        if (window.parent && window.parent.document) {
          const frame = window.parent.document.querySelector('section[data-panel="courage"] iframe');
          if (frame) return frame;
        }
      } catch (err) {
        log('Unable to locate Courage iframe in Homer: ' + err.message);
      }
    }
    return document.getElementById('grace-iframe');
  }

  function tryAttachToGrace() {
    if (!state.iframe) return false;
    const win = state.iframe.contentWindow;
    if (!win) return false;

    const iface = win.MomentoInterface || win.VideoCaptureInterface || null;
    const captureData = win._captureData || {};

    const renderer = iface && iface.renderer ? iface.renderer : captureData.renderer;
    const scene = iface && iface.scene ? iface.scene : captureData.scene;
    const camera = iface && iface.camera ? iface.camera : captureData.camera;

    if (!renderer || !renderer.domElement || !scene || !camera) {
      return false;
    }

    state.graceWindow = win;
    state.renderer = renderer;
    state.scene = scene;
    state.camera = camera;

    log('Attached to Grace renderer/scene/camera.');
    setStatus('Scene ready for capture.');
    updateShotMeta();
    setCameraState(false);
    return true;
  }

  function ensureGraceAttached() {
    if (state.renderer && state.scene && state.camera) return true;
    const ok = tryAttachToGrace();
    if (!ok) {
      setStatus('Waiting for scene (MomentoInterface / _captureData)…');
      log('Capture scene not ready yet; could not find renderer/scene/camera.');
    }
    return ok;
  }

  function getCameraPathMode() {
    const select = document.getElementById('momento-camera-path');
    return select ? select.value : 'manual';
  }

  function applyCameraPathStep(timestamp) {
    if (!state.camera || !state.graceWindow || !state.graceWindow.THREE) return;
    const mode = getCameraPathMode();
    if (mode === 'manual') {
      state.pathStartTime = null;
      state.pathInitialPos = null;
      return;
    }

    if (!state.pathStartTime) {
      state.pathStartTime = timestamp;
      state.pathInitialPos = state.camera.position.clone();
    }

    const THREE = state.graceWindow.THREE;
    const center = new THREE.Vector3(0, 0, 0);
    const t = (timestamp - state.pathStartTime) / 1000; // seconds

    if (mode === 'orbit') {
      const startPos = state.pathInitialPos;
      const radius = startPos.distanceTo(center) || 1;
      const height = startPos.y;
      const speed = 0.4; // radians / second
      const angle = t * speed;
      state.camera.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      state.camera.lookAt(center);
    } else if (mode === 'push') {
      const startPos = state.pathInitialPos;
      const total = startPos.distanceTo(center) * 0.8;
      const duration = 4; // seconds to complete push
      const travel = Math.min(total, (t / duration) * total);
      const dir = new THREE.Vector3().subVectors(center, startPos).normalize();
      const newPos = new THREE.Vector3().copy(startPos).addScaledVector(dir, travel);
      state.camera.position.copy(newPos);
      state.camera.lookAt(center);
    }
  }

  function drawWithAspect(srcCanvas, ctx, destWidth, destHeight) {
    const srcW = srcCanvas.width;
    const srcH = srcCanvas.height;
    if (!srcW || !srcH) return;

    const srcAspect = srcW / srcH;
    const dstAspect = destWidth / destHeight;
    let sx = 0, sy = 0, sw = srcW, sh = srcH;

    if (srcAspect > dstAspect) {
      // source is wider – crop horizontally
      sh = srcH;
      sw = sh * dstAspect;
      sx = (srcW - sw) / 2;
    } else if (srcAspect < dstAspect) {
      // source is taller – crop vertically
      sw = srcW;
      sh = sw / dstAspect;
      sy = (srcH - sh) / 2;
    }

    ctx.clearRect(0, 0, destWidth, destHeight);
    ctx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, destWidth, destHeight);
  }

  function drawPreviewLoop(timestamp) {
    if (!state.previewRunning) return;
    const preview = document.getElementById('preview-canvas');
    if (!preview || !state.renderer || !state.renderer.domElement) {
      requestAnimationFrame(drawPreviewLoop);
      return;
    }
    applyCameraPathStep(timestamp || performance.now());

    try {
      const src = state.renderer.domElement;
      const previewCtx = preview.getContext('2d');

      if (state.captureCanvas) {
        const cap = state.captureCanvas;
        const capCtx = cap.getContext('2d');
        // First draw from renderer to 4:3 capture canvas
        drawWithAspect(src, capCtx, cap.width, cap.height);
        // Then draw capture canvas into preview so it matches captured frame
        drawWithAspect(cap, previewCtx, preview.width, preview.height);
      } else {
        // Native aspect – just fit into preview
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        previewCtx.drawImage(src, 0, 0, src.width, src.height, 0, 0, preview.width, preview.height);
      }
    } catch (err) {
      log('Error updating preview: ' + err.message);
    }

    requestAnimationFrame(drawPreviewLoop);
  }

  function pickMimeType() {
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  function startCapture() {
    if (state.recording) return;
    if (!ensureGraceAttached()) {
      log('Cannot start capture: Grace not ready.');
      return;
    }

    const fpsInput = document.getElementById('momento-fps');
    const durInput = document.getElementById('momento-duration');
    const fps = parseInt(fpsInput && fpsInput.value, 10) || 30;
    const maxSeconds = parseInt(durInput && durInput.value, 10) || 10;
    updateShotMeta();

    const baseCanvas = state.renderer.domElement;
    if (!baseCanvas || !baseCanvas.captureStream) {
      log('captureStream() not available on Grace canvas; MediaRecorder capture not supported.');
      setStatus('Capture not supported in this browser.');
      return;
    }

    let stream;
    const aspectSelect = document.getElementById('momento-aspect');
    const aspect = aspectSelect ? aspectSelect.value : 'native';
    const qualitySelect = document.getElementById('momento-quality');
    const quality = qualitySelect ? qualitySelect.value : '720p';

    let captureSource = baseCanvas;
    state.captureCanvas = null;

    if (aspect === '4_3') {
      const cap = document.getElementById('capture-canvas');
      if (cap && cap.captureStream) {
        if (quality === '960p') {
          cap.width = 1280;
          cap.height = 960;
        } else if (quality === '720p') {
          cap.width = 960;
          cap.height = 720;
        } else {
          cap.width = 640;
          cap.height = 480;
        }
        state.captureCanvas = cap;
        captureSource = cap;
        log(`Using 4:3 capture canvas (${cap.width}x${cap.height}).`);
      } else {
        log('4:3 aspect requested but capture canvas unavailable; falling back to native.');
      }
    }

    try {
      stream = captureSource.captureStream(fps);
    } catch (err) {
      log('Error creating captureStream: ' + err.message);
      setStatus('Failed to start capture stream.');
      return;
    }

    const mimeType = pickMimeType();
    let recorder;
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    } catch (err) {
      log('MediaRecorder init failed: ' + err.message);
      setStatus('MediaRecorder not available.');
      return;
    }

    state.chunks = [];
    state.mediaRecorder = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.chunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      state.recording = false;
      state.previewRunning = false;
      state.pathStartTime = null;
      state.pathInitialPos = null;
      const startBtn = document.getElementById('start-capture');
      const stopBtn = document.getElementById('stop-capture');
      const dlBtn = document.getElementById('download-last');
      if (startBtn) startBtn.disabled = false;
      if (stopBtn) stopBtn.disabled = true;

      if (state.chunks.length) {
        const blob = new Blob(state.chunks, { type: 'video/webm' });
        if (state.lastBlobUrl) {
          URL.revokeObjectURL(state.lastBlobUrl);
        }
        state.lastBlobUrl = URL.createObjectURL(blob);
        if (dlBtn) dlBtn.disabled = false;
        log(`Capture finished. ${blob.size} bytes ready for download.`);
        setStatus('Capture finished. Ready to download.');
      } else {
        if (dlBtn) dlBtn.disabled = true;
        log('Recorder stopped but no data was captured.');
        setStatus('Capture stopped (no data).');
      }
      setCameraState(false);
      if (navigator.vibrate) {
        try { navigator.vibrate([30, 40, 30]); } catch (e) {}
      }
      playCameraSound('save');
    };

    recorder.onerror = (e) => {
      log('MediaRecorder error: ' + e.error);
      setStatus('MediaRecorder error.');
    };

    try {
      recorder.start();
    } catch (err) {
      log('MediaRecorder.start() failed: ' + err.message);
      setStatus('Failed to start recording.');
      return;
    }

    state.recording = true;
    state.previewRunning = true;
    state.pathStartTime = null;
    state.pathInitialPos = null;
    drawPreviewLoop();

    const startBtn = document.getElementById('start-capture');
    const stopBtn = document.getElementById('stop-capture');
    const dlBtn = document.getElementById('download-last');
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;
    if (dlBtn) dlBtn.disabled = true;

    setStatus(`Recording at ${fps} fps (up to ${maxSeconds}s)…`);
    log(`Recording started at ${fps} fps; max duration ${maxSeconds}s.`);
    setCameraState(true);
    if (navigator.vibrate) {
      try { navigator.vibrate(40); } catch (e) {}
    }
    playCameraSound('rec');

    if (Number.isFinite(maxSeconds) && maxSeconds > 0) {
      setTimeout(() => {
        if (state.recording && state.mediaRecorder && state.mediaRecorder.state === 'recording') {
          log('Auto-stopping capture after max duration.');
          state.mediaRecorder.stop();
        }
      }, maxSeconds * 1000);
    }
  }

  function stopCapture() {
    if (!state.recording || !state.mediaRecorder) return;
    if (state.mediaRecorder.state === 'inactive') return;
    log('Stopping capture by user request.');
    state.mediaRecorder.stop();
  }

  function downloadLast() {
    if (!state.lastBlobUrl) {
      log('No capture available to download.');
      return;
    }
    const sceneName = getSceneName();
    const safeName = sceneName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'scene';
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const filename = `mento_${safeName}_${date}_${time}.webm`;

    const a = document.createElement('a');
    a.href = state.lastBlobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addShotToGallery(filename, state.lastBlobUrl);
    log('Triggered download of last capture.');
  }

  function setupMessageListener() {
    window.addEventListener('message', (event) => {
      try {
        const data = event.data || {};
        if (data.type === 'GRACE_SCENE_READY') {
          log('Received GRACE_SCENE_READY from iframe.');
          setTimeout(() => {
            if (!ensureGraceAttached()) {
              log('GRACE_SCENE_READY received but attachment failed; will retry lazily.');
            }
          }, 200);
        }
      } catch (err) {
        log('Error handling postMessage: ' + err.message);
      }
    });
  }

  function setupFrankBus() {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      const bus = new BroadcastChannel('wag-frank');
      bus.onmessage = (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object') return;
        if (msg.kind === 'mento-shot-mpd') {
          const payload = msg.payload || {};
          let text = '';
          if (Array.isArray(payload.mpdLines)) {
            text = payload.mpdLines.join('\n');
          } else if (typeof payload.mpdText === 'string') {
            text = payload.mpdText;
          } else if (typeof msg.mpdText === 'string') {
            text = msg.mpdText;
          }
          if (!text) return;
          const shots = parseMentoShotsFromText(text);
          if (!shots.length) {
            log('Received mento-shot-mpd over wag-frank but no !MENTO SHOT lines were found.');
            return;
          }
          state.mentoShots = shots;
          populateMentoShotSelect(shots);
          setMentoShotText(text);
          setStatus(`Loaded ${shots.length} MENTO shots from wag-frank.`);
          log(`Loaded ${shots.length} MENTO shots from wag-frank.`);
        }
      };
    } catch (err) {
      log('Unable to attach wag-frank BroadcastChannel: ' + err.message);
    }
  }

  function init() {
    state.iframe = resolveSourceIframe();
    if (!state.iframe) {
      setStatus('Capture source iframe not found.');
      log('No capture source iframe; Momento cannot attach.');
      return;
    }

    if (hostMode === 'homer') {
      setStatus('Using Courage scene from Homer…');
      setTimeout(() => {
        ensureGraceAttached();
      }, 1000);
    } else {
      setStatus('Loading Grace into iframe…');

      state.iframe.addEventListener('load', () => {
        log('Grace iframe loaded. Waiting for MomentoInterface…');
        setStatus('Grace loaded. Waiting for scene ready…');
        setTimeout(() => {
          ensureGraceAttached();
        }, 1000);
      });
    }

    const startBtn = document.getElementById('start-capture');
    const stopBtn = document.getElementById('stop-capture');
    const dlBtn = document.getElementById('download-last');

    const shotFileInput = document.getElementById('mento-shot-file');
    const shotSelect = document.getElementById('mento-shot-select');
    const applyShotBtn = document.getElementById('mento-apply-shot');
    const shotTextArea = document.getElementById('mento-shot-text');
    var copyShotBtn = document.getElementById('mento-copy-shot-text');
    const parseShotBtn = document.getElementById('mento-parse-shot-text');

    if (copyShotBtn && shotTextArea) {
      copyShotBtn.addEventListener('click', () => {
        const text = shotTextArea.value || '';
        if (!text) {
          setStatus('No MENTO MPD to copy yet.');
          return;
        }
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text)
            .then(() => setStatus('Copied MENTO MPD to clipboard.'))
            .catch(() => setStatus('Unable to copy MENTO MPD.'));
        } else {
          const temp = document.createElement('textarea');
          temp.style.position = 'fixed';
          temp.style.opacity = '0';
          temp.value = text;
          document.body.appendChild(temp);
          temp.focus();
          temp.select();
          try {
            document.execCommand('copy');
            setStatus('Copied MENTO MPD to clipboard.');
          } catch (e) {
            setStatus('Unable to copy MENTO MPD.');
          }
          document.body.removeChild(temp);
        }
      });
    }

    if (startBtn) startBtn.addEventListener('click', startCapture);
    if (stopBtn) stopBtn.addEventListener('click', stopCapture);
    if (dlBtn) dlBtn.addEventListener('click', downloadLast);

    if (shotFileInput) {
      shotFileInput.addEventListener('change', (event) => {
        const input = event.target;
        const file = input && input.files && input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const text = String(reader.result || '');
          setMentoShotText(text);
          const shots = parseMentoShotsFromText(text);
          if (!shots.length) {
            setStatus('No MENTO shots found in file.');
            log('No !MENTO SHOT lines found in selected file.');
            state.mentoShots = [];
            populateMentoShotSelect(state.mentoShots);
            return;
          }
          state.mentoShots = shots;
          populateMentoShotSelect(shots);
          setStatus(`Loaded ${shots.length} MENTO shots from ${file.name}.`);
          log(`Loaded ${shots.length} MENTO shots from ${file.name}.`);
        };
        reader.onerror = () => {
          setStatus('Failed to read MENTO shot file.');
          log('Error reading MENTO shot file.');
        };
        reader.readAsText(file);
      });
    }

    if (shotSelect && applyShotBtn) {
      applyShotBtn.addEventListener('click', () => {
        if (!state.mentoShots || !state.mentoShots.length) {
          if (shotTextArea && shotTextArea.value.trim()) {
            const text = shotTextArea.value;
            const shots = parseMentoShotsFromText(text);
            state.mentoShots = shots;
            populateMentoShotSelect(shots);
            if (!shots.length) {
              setStatus('No MENTO shots found in text.');
              return;
            }
          } else {
            setStatus('No MENTO shots loaded yet.');
            return;
          }
        }
        const idx = parseInt(shotSelect.value, 10);
        if (!Number.isFinite(idx) || idx < 0 || idx >= state.mentoShots.length) {
          setStatus('Select a MENTO shot first.');
          return;
        }
        applyMentoShot(state.mentoShots[idx]);
      });

      shotSelect.addEventListener('change', () => {
        if (!state.mentoShots || !state.mentoShots.length) return;
        const idx = parseInt(shotSelect.value, 10);
        if (!Number.isFinite(idx) || idx < 0 || idx >= state.mentoShots.length) return;
        applyMentoShot(state.mentoShots[idx]);
      });
    }

    if (parseShotBtn && shotTextArea) {
      parseShotBtn.addEventListener('click', () => {
        const text = shotTextArea.value || '';
        const shots = parseMentoShotsFromText(text);
        state.mentoShots = shots;
        populateMentoShotSelect(shots);
        if (!shots.length) {
          setStatus('No MENTO shots found in text.');
          log('MENTO text parse produced no shots.');
        } else {
          setStatus(`Loaded ${shots.length} MENTO shots from text.`);
          log(`Loaded ${shots.length} MENTO shots from text.`);
        }
      });
    }

    ['momento-fps', 'momento-duration', 'momento-aspect', 'momento-quality', 'momento-camera-path']
      .forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('change', updateShotMeta);
          el.addEventListener('input', updateShotMeta);
        }
      });

    setupMessageListener();
    setupFrankBus();
    updateShotMeta();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
