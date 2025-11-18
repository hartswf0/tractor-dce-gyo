# Momento – Grace / Frank Brickfilm Capture Surface

Momento is a **mobile-first capture surface** that records video directly from the Grace editor's Three.js scene, using the Frank-aligned grid as its mental model. It lives alongside the existing Reality Media capture tools, but is tuned specifically for **brickfilm shots in Grace**.

This document explains:

- What Momento is and how it relates to the rest of the system
- How to open and run Momento
- How Momento connects to Grace (and indirectly to Frank)
- Where to look in the code if you want to extend it

---

## 1. Files and roles

All Momento-related files live in:

```text
Brickfilm_Studio_Kit/
  REALITY MEDIA_MOMENTO/
    momento.html             # Momento UI surface (controls, preview, map)
    momento_capture_app.js   # Capture engine talking to Grace + MediaRecorder
    momento_system_map.html  # Visual system map for Momento (docs)
```

Momento is designed to talk to a **Grace editor scene** that exposes a `MomentoInterface` from inside its window:

```text
wag-viewer-prime-integration-*/
  wag-grace-editor.html      # Grace editor (2D/3D grids, Three.js scene)
```

Grace, in turn, is conceptually aligned with **Frank** (the 9×9 grid layout tool) through shared grid spacing and the A1 corner marker.

---

## 2. How Momento fits into the larger ecosystem

At a high level:

- **Frank** lays out scenes on a 9×9 grid and produces MPD files.
- **Grace** loads those MPDs into a Three.js scene with 2D + 3D views.
- **Momento** sits beside Grace as a **capture UI** that:
  - embeds Grace in an `<iframe>`,
  - negotiates an interface for `renderer / scene / camera`, and
  - records video clips (e.g., 4:3 orbit or push shots) using `MediaRecorder`.

For a deeper architectural diagram, open:

- `REALITY MEDIA_MOMENTO/video_capture_system_map.html` – legacy capture system
- `REALITY MEDIA_MOMENTO/brickfilm_studio_system_map.html` – proposed Brickfilm runtime
- `REALITY MEDIA_MOMENTO/momento_system_map.html` – **this Momento-specific system map**

---

## 3. Opening and running Momento

### 3.1 Prerequisites

- A local HTTP server serving the `Brickfilm_Studio_Kit` folder (e.g. `http://localhost:8080/`).
- The **Grace editor** reachable at a URL path that `momento.html` expects (typically something like `wag-viewer-prime-integration-*/wag-grace-editor.html`).

### 3.2 Launching Momento

1. Start your local web server at the root of `Brickfilm_Studio_Kit`.
2. In a browser, open:

   ```text
   REALITY MEDIA_MOMENTO/momento.html
   ```

   For example:

   ```text
   http://localhost:8080/REALITY%20MEDIA_MOMENTO/momento.html
   ```

3. When the page loads, it will:
   - create the Momento control surface (cards, preview canvas, log), and
   - load the Grace editor inside an `<iframe>`.

4. Once Grace finishes initializing, it will expose `window.MomentoInterface` and send a `GRACE_SCENE_READY` `postMessage` event to the parent window. The Momento UI will update its status to indicate that the scene is ready for capture.

---

## 4. How Momento connects to Grace

### 4.1 The interface Grace exposes

Inside `wag-grace-editor.html`, after the `BetaPrimeEngine` viewer is created, Grace exposes:

```js
window.MomentoInterface = {
  get renderer() { return STATE.viewer.renderer; },
  get scene()    { return STATE.viewer.scene; },
  get camera()   { return STATE.viewer.camera; },
  renderCurrentView() {
    if (STATE.viewer && STATE.viewer.renderer && STATE.viewer.scene && STATE.viewer.camera) {
      STATE.viewer.renderer.render(STATE.viewer.scene, STATE.viewer.camera);
    }
  }
};

window._captureData = {
  renderer: window.MomentoInterface.renderer,
  scene:    window.MomentoInterface.scene,
  camera:   window.MomentoInterface.camera
};

window.parent.postMessage({ type: 'GRACE_SCENE_READY' }, '*');
```

Key points:

- Momento does **not** reach into Grace via arbitrary globals; it calls the structured `MomentoInterface`.
- For compatibility with older tooling, `_captureData` mirrors the same objects.
- The `GRACE_SCENE_READY` message is the trigger that tells Momento it can start capture.

### 4.2 What Momento does with the interface

In `momento_capture_app.js`, Momento:

- Waits for `message` events from the iframe.
- On `{ type: 'GRACE_SCENE_READY' }`, it grabs:

  ```js
  const graceWindow = graceIframe.contentWindow;
  const iface = graceWindow && graceWindow.MomentoInterface;
  ```

- Stores `iface.renderer`, `iface.scene`, `iface.camera`.
- Uses `renderer.domElement.captureStream(fps)` to obtain a `MediaStream`.
- Creates a `MediaRecorder` and records frames while:
  - calling `iface.renderCurrentView()` for each frame, and
  - updating camera parameters for orbit / push paths.

If the interface is missing or incomplete, the Momento UI surfaces meaningful log messages instead of failing silently.

---

## 5. 4:3 and camera paths (current behavior)

Momento currently supports:

- **Aspect choices** in the UI:
  - `native` – records the Grace canvas as-is.
  - `4:3` – uses a hidden 4:3 canvas, blitting from Grace and preserving a brickfilm-friendly frame.

- **Camera path presets** (driven from a dropdown in `momento.html`):
  - `manual` – honors whatever camera Grace currently has.
  - `orbit` – animates the camera around the scene center at a fixed radius.
  - `push` – moves the camera forward through the center of the scene over time.

These paths are implemented in `momento_capture_app.js` by mutating the camera's position and calling `renderCurrentView()` per frame.

---

## 6. How this will connect to shot configs and Frank

The intent is for Momento to become a **capture front-end** for more formal shot data:

- Frank and AEL-era MPDs provide **geometry + layout**.
- Future shot config JSON (or MPD comments) will provide **targets + camera paths**.
- Momento will:
  - read that shot data,
  - move the Grace camera deterministically,
  - record a clip, and
  - optionally export metadata alongside the video file.

For now, Momento operates as a **live capture tool**: you compose in Grace, then record with Momento.

---

## 7. Extending Momento

If you want to extend or customize Momento, the main places to look are:

- `momento.html`
  - Layout and styles for:
    - shot setup card
    - capture controls (fps, duration, aspect)
    - camera path select
    - preview canvas and log panel

- `momento_capture_app.js`
  - Iframe/handshake logic with Grace
  - MediaRecorder lifecycle (start / stop / download)
  - Aspect-ratio handling and 4:3 canvas blitting
  - Camera path automation (orbit, push)

- `wag-grace-editor.html`
  - Definition of `window.MomentoInterface`
  - Any future extensions (e.g., 2D grid target selection, camera anchors per FRANK cell)

When you add new capabilities (like selecting MPD lines as camera targets or visualizing camera frustums on a Momento map), prefer to:

- keep geometry + selection logic in Grace, and
- keep capture + UI logic in Momento.

This separation keeps the system coherent and easier to evolve.
