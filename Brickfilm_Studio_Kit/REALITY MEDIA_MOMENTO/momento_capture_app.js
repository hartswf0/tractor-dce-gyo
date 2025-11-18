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
    pathInitialPos: null
  };

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
    setStatus('Grace scene ready for capture.');
    return true;
  }

  function ensureGraceAttached() {
    if (state.renderer && state.scene && state.camera) return true;
    const ok = tryAttachToGrace();
    if (!ok) {
      setStatus('Waiting for Grace scene (MomentoInterface / _captureData)…');
      log('Grace not ready yet; could not find renderer/scene/camera.');
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

    const baseCanvas = state.renderer.domElement;
    if (!baseCanvas || !baseCanvas.captureStream) {
      log('captureStream() not available on Grace canvas; MediaRecorder capture not supported.');
      setStatus('Capture not supported in this browser.');
      return;
    }

    let stream;
    const aspectSelect = document.getElementById('momento-aspect');
    const aspect = aspectSelect ? aspectSelect.value : 'native';

    let captureSource = baseCanvas;
    state.captureCanvas = null;

    if (aspect === '4_3') {
      const cap = document.getElementById('capture-canvas');
      if (cap && cap.captureStream) {
        cap.width = 640;
        cap.height = 480;
        state.captureCanvas = cap;
        captureSource = cap;
        log('Using 4:3 capture canvas (640x480).');
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
    const a = document.createElement('a');
    a.href = state.lastBlobUrl;
    a.download = 'momento_grace_capture.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  function init() {
    state.iframe = document.getElementById('grace-iframe');
    if (!state.iframe) {
      setStatus('Grace iframe not found.');
      log('No #grace-iframe element; Momento cannot attach.');
      return;
    }

    setStatus('Loading Grace into iframe…');

    state.iframe.addEventListener('load', () => {
      log('Grace iframe loaded. Waiting for MomentoInterface…');
      setStatus('Grace loaded. Waiting for scene ready…');
      setTimeout(() => {
        ensureGraceAttached();
      }, 1000);
    });

    const startBtn = document.getElementById('start-capture');
    const stopBtn = document.getElementById('stop-capture');
    const dlBtn = document.getElementById('download-last');

    if (startBtn) startBtn.addEventListener('click', startCapture);
    if (stopBtn) stopBtn.addEventListener('click', stopCapture);
    if (dlBtn) dlBtn.addEventListener('click', downloadLast);

    setupMessageListener();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
