/* world/film.js — the world as a film space: shots in the MENTO grammar, a camera that follows their keys, the reel, the take.

   A shot is one or more keys (POS, TGT, LENS) and a length in seconds: one key holds, two or more move the camera
   along a centripetal Catmull-Rom path the way mento-373 does, with the target and the field of view blended per
   segment. The reel is the shots in order; playing it cuts from one to the next. A take draws every rendered frame
   into a canvas of the chosen aspect and size and hands it to a MediaRecorder while the world is stepped exactly
   1/fps per frame, so the film has the right length however slow the phone is. Words become shots through the
   model (FILM_SPEC) or, without a key, through a small parser of the same words; either way a semantic shot (a
   subject, a frame, a bearing, a move) is staged into keys from what stands in the world.

   The text form is the MENTO grammar in the LDraw frame (y down, z flipped: world (x, y, z) is LDraw (x, -y, -z)):
     0 !MENTO SHOT "name" POS x y z TGT x y z LENS f [SEC s]      a shot and its first key
     0 !MENTO KEY POS x y z TGT x y z LENS f                        a further key of the shot above (a move)
     0 !MENTO LIGHT "name" TYPE SUN|POINT|AREA POS … [TGT …] COLOR #hex INTENSITY n [DECAY n] [SHADOWS TRUE]
     0 !MENTO ACT "me" WALK x z | DRIVE x z | AHEAD m | RIDE word | TIE | FLY | FIRE | SABER | LEAVE   what the player does during the shot
     0 !MENTO SET WORLD tatooine AS luke TIME dusk WEATHER clear      applied when the next shot starts (a planet, a character, a sky)
     0 !MENTO TITLE "text" STYLE card|logo SEC 3                       a title card: black, the words centred
     0 !MENTO PLAN {json}                                              the shot's words (subject, frame, bearing, move): staged again when it starts, so it follows a new planet or character
     0 !MENTO TIME day|dawn|dusk|night                               the sky for the film
     0 !MENTO ASPECT 16:9 FPS 24                                     the frame
   A SHOT line can end with FOLLOW: its keys are re-staged around the subject every step, so a flying TIE stays in the frame.
   LENS is the vertical field of view in degrees, as mento-373 reads it. */
(function () {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ASPECTS = { '16:9': 16 / 9, '2.39': 2.39, '4:3': 4 / 3, '9:16': 9 / 16 };
  const SIZES = { '720p': 720, '1080p': 1080 };
  const BEAR = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };            // where the camera stands, seen from the subject: north is -z, east is +x
  const FRAMES = { wide: 3, medium: 1.5, close: 0.8, aerial: 2.2, low: 1.6, shoulder: 0 };      // the camera's distance as a multiple of the subject's size
  const LENS = { wide: 60, medium: 45, close: 35, aerial: 50, low: 55, shoulder: 50 };
  const MOVES = ['hold', 'push', 'pull', 'orbit', 'crane', 'track'];
  const num = s => { const v = parseFloat(s); return Number.isFinite(v) ? v : 0; };
  const fmt = v => String(+v.toFixed(2));
  const wrap = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

  const FILM_SPEC = `You are a film director working inside a LEGO world. You answer ONLY with a JSON object {"name": string, "shots": [...]}: a shot list that a camera compiler stages into real camera keys.
Each shot is {"name": string, "on": subject, "frame": "wide|medium|close|aerial|low|shoulder", "from": "n|ne|e|se|s|sw|w|nw", "lens": 20-90, "sec": 1-30, "move": "hold|push|pull|orbit|crane|track", "act": null | {"who": "me", "walk": [x, z]} | {"who": "me", "drive": [x, z]}}.
The subject "on" is "me" (the player's figure), a landmark id from the scene list, a building name from the scene list, a kit or vehicle word (atat, atst, xwing, shuttle, speeder, car, truck, bus) or [x, z] in metres (x east, z south, north is negative z).
"frame" is how big the subject is in the frame; "from" is where the camera stands seen from the subject; "lens" is the vertical field of view in degrees (wide 60, normal 45, long 30); "move" adds a second key: push halves the distance, pull doubles it, orbit turns a quarter around the subject, crane rises to an aerial view, track slides sideways.
An act makes the player's figure walk (or the ride drive) to a point during the shot. Keep the film to 2-8 shots, name each like a storyboard, vary frames and bearings, and answer with the JSON only.`;

  /** The trailer of the first film, as words the world stages where it stands: the droids in the desert, the twin suns, a landspeeder, the smuggler and the Wookiee, the princess, the troopers, the Dark Lord, a TIE, the run on the station. */
  const TRAILERS = {
    'a-new-hope': { name: 'A New Hope', shots: [
      { title: 'A long time ago in a galaxy far,\nfar away....', style: 'card', sec: 4, world: 'tatooine', as: 'c3po', time: 'day' },
      { title: 'STAR WARS', style: 'logo', sec: 3 },
      { name: 'The droid in the desert', on: 'me', frame: 'wide', from: 'e', move: 'push', sec: 5, act: { ahead: 24 } },
      { name: 'A farm boy', as: 'luke', time: 'dusk', on: 'me', frame: 'shoulder', from: 's', move: 'hold', sec: 4, act: { ahead: 6 } },
      { name: 'The twin suns', on: 'me', frame: 'low', from: 'w', move: 'crane', sec: 4 },
      { name: 'The landspeeder', time: 'day', on: 'me', frame: 'medium', from: 'e', move: 'track', sec: 5, follow: true, act: { ride: 'speeder', ahead: 80, fly: true } },
      { name: 'The smuggler', as: 'han', on: 'me', frame: 'close', from: 'sw', move: 'push', sec: 3, act: { leave: true, ahead: 3 } },
      { name: 'The Wookiee', as: 'chewbacca', on: 'me', frame: 'medium', from: 's', move: 'orbit', sec: 3 },
      { name: 'The princess', as: 'leia', on: 'me', frame: 'close', from: 'n', move: 'pull', sec: 3 },
      { name: 'Stormtroopers', as: 'stormtrooper', on: 'me', frame: 'wide', from: 'n', move: 'push', sec: 4, act: { ahead: 10, fire: true } },
      { title: 'The Empire', style: 'card', sec: 2, world: 'deathstar', as: 'vader', time: 'night' },
      { name: 'The Dark Lord', on: 'me', frame: 'medium', from: 's', move: 'push', sec: 4, act: { saber: true, ahead: 4 } },
      { name: 'The TIE', on: 'tie', frame: 'wide', from: 'sw', move: 'hold', sec: 6, follow: true, act: { tie: true, fly: true, fire: true } },
      { name: 'The run', as: 'luke', on: 'me', frame: 'wide', from: 's', move: 'hold', sec: 6, follow: true, act: { leave: true, ride: 'xwing', ahead: 120, fly: true, fire: true } },
      { title: 'STAR WARS', style: 'logo', sec: 2 },
      { title: 'A New Hope\nmade with word to momento', style: 'card', sec: 3 },
    ] },
  };

  function create({ W, M }) {
    const F = {
      shots: [], sel: -1, mode: 'view', play: { on: false, i: 0, t: 0, all: false }, rec: null, aspect: '16:9', fps: 24, size: '720p', sec: 4,
      lights: [], extra: [], time: null, sun: null, blob: null, url: null, take: null, steps: 0, running: false, onChange: null, local: false, busy: false, status: '',
      free: { pos: new THREE.Vector3(), yaw: 0, pitch: 0, fov: 50 }, viewT: 0, log: [],
    };
    const V1 = new THREE.Vector3(), V2 = new THREE.Vector3();
    const gameFov = () => innerHeight > innerWidth ? 55 : 50;
    const groundH = (x, z) => W.G ? W.G.h(x, z) + (window.Ground ? Ground.layerAt(W.G, x, z) : 0) : 0;
    const changed = what => { for (const s of F.shots) if (s.keys.length > 1 && (!s.curve || s.curveN !== s.keys.length)) s.curve = null; F.save(); if (F.onChange) { try { F.onChange(what); } catch (e) { } } };
    const say = (text, cls) => { F.status = text; F.statusCls = cls || ''; if (F.onStatus) { try { F.onStatus(text, cls); } catch (e) { } } };

    /* ── the grammar ── */
    const keyOf = m => ({ pos: new THREE.Vector3(+m[1], -m[2], -m[3]), tgt: new THREE.Vector3(+m[4], -m[5], -m[6]), fov: clamp(+m[7] || 50, 5, 150) });
    const KEY_RE = /POS\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+TGT\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+LENS\s+([\d.]+)/;
    F.parse = (text, keepOld) => {
      const shots = keepOld ? F.shots.slice() : [], lights = keepOld ? F.lights.slice() : []; let cur = null, n = 0, pendingSet = null;
      for (const raw of String(text || '').split(/\r?\n/)) {
        const line = raw.trim(); if (!/!MENTO/.test(line)) continue;
        const name = (line.match(/"([^"]*)"/) || [])[1];
        if (/!MENTO\s+SHOT/.test(line)) { const m = line.match(KEY_RE); if (!m) continue; const sec = line.match(/\bSEC\s+([\d.]+)/); cur = { name: name || `Shot ${shots.length + 1}`, keys: [keyOf(m)], sec: sec ? clamp(num(sec[1]), 0.5, 120) : F.sec, act: null, set: pendingSet, follow: /\bFOLLOW\b/.test(line) }; pendingSet = null; shots.push(cur); n++; }
        else if (/!MENTO\s+TITLE/.test(line)) { const sec = line.match(/\bSEC\s+([\d.]+)/), st = line.match(/\bSTYLE\s+(\w+)/), words = (name || '').replace(/\\n/g, '\n'); cur = { name: words.split('\n')[0] || 'Title', title: words, style: st ? st[1].toLowerCase() : 'card', keys: [], sec: sec ? clamp(num(sec[1]), 0.5, 120) : 3, act: null, set: pendingSet }; pendingSet = null; shots.push(cur); n++; }
        else if (/!MENTO\s+SET\b/.test(line)) { const w = line.match(/\bWORLD\s+(\w+)/), a = line.match(/\bAS\s+(\w+)/), t = line.match(/\bTIME\s+(\w+)/), we = line.match(/\bWEATHER\s+(\w+)/); pendingSet = { world: w ? w[1].toLowerCase() : null, as: a ? a[1].toLowerCase() : null, time: t ? t[1].toLowerCase() : null, weather: we ? we[1].toLowerCase() : null }; }
        else if (/!MENTO\s+PLAN\b/.test(line)) { const m = line.match(/PLAN\s+(\{[\s\S]*\})\s*$/); if (m && cur) { try { cur.plan = JSON.parse(m[1]); } catch (e) { } } }
        else if (/!MENTO\s+KEY/.test(line)) { const m = line.match(KEY_RE); if (m && cur) cur.keys.push(keyOf(m)); }
        else if (/!MENTO\s+LIGHT/.test(line)) { const L = parseLight(line); if (L) lights.push(L); }
        else if (/!MENTO\s+ACT/.test(line)) { if (cur) cur.act = parseAct(line.replace(/^.*!MENTO\s+ACT\s*("[^"]*")?/, ''), name || 'me'); }
        else if (/!MENTO\s+TIME/.test(line)) { const m = line.match(/TIME\s+(day|dawn|dusk|night|auto)/i); if (m) F.time = m[1].toLowerCase(); }
        else if (/!MENTO\s+ASPECT/.test(line)) { const a = line.match(/ASPECT\s+([\d.:]+)/), f = line.match(/FPS\s+(\d+)/); if (a && ASPECTS[a[1]]) F.aspect = a[1]; if (f) F.fps = clamp(+f[1], 6, 60); }
      }
      F.shots = shots; F.lights = lights; if (F.sel >= shots.length) F.sel = shots.length - 1; if (F.sel < 0 && shots.length) F.sel = 0;
      applyLights(); if (F.time && W.setSky) W.setSky(F.time); changed('parse'); return { shots: n, lights: lights.length };
    };
    /** The act tokens: WALK x z, DRIVE x z, AHEAD m, RIDE word, TIE, FLY, FIRE, SABER, LEAVE, LOOK x z. */
    function parseAct(text, who) {
      const a = { who: who || 'me' }, t = String(text || '').trim(); if (!t) return null;
      const xy = (re) => { const m = t.match(re); return m ? { x: +m[1], z: -m[2] } : null; };
      const walk = xy(/\bWALK\s+(-?[\d.]+)\s+(-?[\d.]+)/), drive = xy(/\bDRIVE\s+(-?[\d.]+)\s+(-?[\d.]+)/), look = xy(/\bLOOK\s+(-?[\d.]+)\s+(-?[\d.]+)/);
      if (walk) { a.kind = 'walk'; a.x = walk.x; a.z = walk.z; } else if (drive) { a.kind = 'drive'; a.x = drive.x; a.z = drive.z; }
      const ahead = t.match(/\bAHEAD\s+(-?[\d.]+)/); if (ahead) a.ahead = +ahead[1];
      const ride = t.match(/\bRIDE\s+([\w-]+)/); if (ride) a.ride = ride[1].toLowerCase();
      if (/\bTIE\b/.test(t)) a.tie = true; if (/\bFLY\b/.test(t)) a.fly = true; if (/\bFIRE\b/.test(t)) a.fire = true; if (/\bSABER\b/.test(t)) a.saber = true; if (/\bLEAVE\b/.test(t)) a.leave = true; if (look) a.look = look;
      return Object.keys(a).length > 1 ? a : null;
    }
    const actText = a => { const t = []; if (a.leave) t.push('LEAVE'); if (a.ride) t.push('RIDE ' + a.ride); if (a.tie) t.push('TIE'); if (a.kind === 'walk') t.push(`WALK ${fmt(a.x)} ${fmt(-a.z)}`); if (a.kind === 'drive') t.push(`DRIVE ${fmt(a.x)} ${fmt(-a.z)}`); if (a.ahead) t.push('AHEAD ' + fmt(a.ahead)); if (a.look) t.push(`LOOK ${fmt(a.look.x)} ${fmt(-a.look.z)}`); if (a.fly) t.push('FLY'); if (a.fire) t.push('FIRE'); if (a.saber) t.push('SABER'); return t.join(' '); };
    function parseLight(line) {
      const name = (line.match(/"([^"]*)"/) || [])[1] || 'light', type = (line.match(/TYPE\s+(\w+)/) || [])[1] || 'POINT', p = line.match(/POS\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/); if (!p) return null;
      const t = line.match(/TGT\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/), c = line.match(/COLOR\s+(#[0-9a-fA-F]{6})/), i = line.match(/INTENSITY\s+([\d.]+)/), d = line.match(/DECAY\s+([\d.]+)/);
      return { name, type: type.toUpperCase(), pos: new THREE.Vector3(+p[1], -p[2], -p[3]), tgt: t ? new THREE.Vector3(+t[1], -t[2], -t[3]) : null, color: c ? c[1] : '#ffffff', intensity: i ? num(i[1]) : 1, decay: d ? num(d[1]) : 0, shadows: /SHADOWS\s+TRUE/i.test(line), line };
    }
    const ld = v => `${fmt(v.x)} ${fmt(-v.y)} ${fmt(-v.z)}`;
    const keyLine = k => `POS ${ld(k.pos)} TGT ${ld(k.tgt)} LENS ${fmt(k.fov)}`;
    F.text = () => {
      const out = [`0 // MENTO film · ${W.place && W.place.name ? W.place.name : 'the world'} · word to momento`, `0 !MENTO ASPECT ${F.aspect} FPS ${F.fps}`];
      if (F.time) out.push(`0 !MENTO TIME ${F.time}`);
      for (const L of F.lights) out.push(L.line);
      F.shots.forEach((s, i) => {
        out.push(`0 // SHOT ${i + 1}: ${s.name.toUpperCase()}`);
        if (s.set && (s.set.world || s.set.as || s.set.time || s.set.weather)) out.push(`0 !MENTO SET${s.set.world ? ' WORLD ' + s.set.world : ''}${s.set.as ? ' AS ' + s.set.as : ''}${s.set.time ? ' TIME ' + s.set.time : ''}${s.set.weather ? ' WEATHER ' + s.set.weather : ''}`);
        if (s.title != null) { out.push(`0 !MENTO TITLE "${s.title.replace(/"/g, "'").replace(/\n/g, '\\n')}" STYLE ${s.style || 'card'} SEC ${fmt(s.sec)}`); return; }
        const k0 = s.keys[0] || { pos: new THREE.Vector3(), tgt: new THREE.Vector3(0, 0, -1), fov: 50 };
        out.push(`0 !MENTO SHOT "${s.name.replace(/"/g, "'")}" ${keyLine(k0)} SEC ${fmt(s.sec)}${s.follow ? ' FOLLOW' : ''}`);
        if (s.plan) out.push(`0 !MENTO PLAN ${JSON.stringify(s.plan)}`);
        for (const k of s.keys.slice(1)) out.push(`0 !MENTO KEY ${keyLine(k)}`);
        if (s.act) { const t = actText(s.act); if (t) out.push(`0 !MENTO ACT "${s.act.who || 'me'}" ${t}`); }
      });
      return out.join('\n') + '\n';
    };

    /* ── the lights ── */
    function applyLights() {
      for (const l of F.extra) W.scene.remove(l); F.extra = []; F.sun = null;
      for (const L of F.lights) {
        if (L.type === 'SUN') { F.sun = { color: new THREE.Color(L.color), intensity: L.intensity }; continue; }
        let light;
        if (L.type === 'AREA' || L.type === 'SPOT') { light = new THREE.SpotLight(L.color, L.intensity, L.decay || 0, 0.7, 0.4, 1); light.position.copy(L.pos); light.target.position.copy(L.tgt || new THREE.Vector3(L.pos.x, L.pos.y - 100, L.pos.z)); W.scene.add(light.target); F.extra.push(light.target); }
        else { light = new THREE.PointLight(L.color, L.intensity, L.decay || 0, 1); light.position.copy(L.pos); }
        W.scene.add(light); F.extra.push(light);
      }
    }
    const applySun = () => { const s = F.sun, d = window.Ground && Ground.daylight.lights; if (!s || !d) return; d.sun.color.copy(s.color); d.sun.intensity = s.intensity / Math.PI; };

    /* ── the camera ── */
    F.owns = () => F.play.on || !!F.rec || F.mode !== 'view';
    F.holds = () => F.mode === 'free' && !F.play.on;
    function poseAt(cam, s, t) {
      if (s.title != null || !s.keys.length) return;                                  // a title card: the camera stays where it is, the card covers the frame
      if (s.follow && s.plan) { const st = F.stage(s.plan); s.keys = st.keys; s.curve = null; }   // the subject moves: the keys move with it
      const n = s.keys.length; let pos, tgt, fov;
      if (n === 1) { pos = s.keys[0].pos; tgt = s.keys[0].tgt; fov = s.keys[0].fov; }
      else {
        const u = clamp(t / s.sec, 0, 1); if (!s.curve || s.curveN !== n) { s.curve = new THREE.CatmullRomCurve3(s.keys.map(k => k.pos), false, 'centripetal'); s.curveN = n; }
        pos = s.curve.getPointAt(u); const seg = n - 1, raw = u * seg, i = Math.min(Math.floor(raw), seg - 1), a = raw - i;
        tgt = V1.lerpVectors(s.keys[i].tgt, s.keys[i + 1].tgt, a); fov = s.keys[i].fov + (s.keys[i + 1].fov - s.keys[i].fov) * a;
      }
      cam.position.copy(pos); cam.up.set(0, 1, 0); cam.lookAt(tgt); if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
    }
    function poseFree(cam) {
      const f = F.free; cam.position.copy(f.pos); V1.set(-Math.sin(f.yaw) * Math.cos(f.pitch), Math.sin(f.pitch), -Math.cos(f.yaw) * Math.cos(f.pitch)).add(f.pos);
      cam.up.set(0, 1, 0); cam.lookAt(V1); if (Math.abs(cam.fov - f.fov) > 1e-3) { cam.fov = f.fov; cam.updateProjectionMatrix(); }
    }
    F.camera = (cam, dt) => {
      if (F.play.on) { const s = F.shots[F.play.i]; if (s) { poseAt(cam, s, F.play.t); return; } }
      if (F.mode === 'shot') { const s = F.shots[F.sel]; if (s) { poseAt(cam, s, F.viewT); return; } }
      poseFree(cam);
    };
    F.setMode = m => {
      if (!['view', 'shot', 'free'].includes(m)) return F.mode; if (m === 'shot' && !F.shots.length) m = 'free';
      if (m === 'free' && F.mode !== 'free') { const c = W.camera; F.free.pos.copy(c.position); c.getWorldDirection(V1); F.free.yaw = Math.atan2(-V1.x, -V1.z); F.free.pitch = Math.asin(clamp(V1.y, -1, 1)); F.free.fov = c.fov; }
      F.mode = m; F.viewT = 0;
      if (m === 'view') { W.camera.fov = gameFov(); W.camera.updateProjectionMatrix(); if (W.rig) W.rig.cam.set = false; }
      if (F.onChange) F.onChange('mode'); return m;
    };
    F.look = (dx, dy) => { F.free.yaw -= dx; F.free.pitch = clamp(F.free.pitch - dy, -1.45, 1.45); };
    F.zoom = k => { F.free.fov = clamp(F.free.fov * k, 12, 110); };
    F.setLens = fov => { fov = clamp(+fov || 50, 12, 110); if (F.mode === 'free' || !F.shots[F.sel]) F.free.fov = fov; else { for (const k of F.shots[F.sel].keys) k.fov = fov; changed('lens'); } };
    F.setSec = sec => { sec = clamp(+sec || 4, 0.5, 120); F.sec = sec; const s = F.shots[F.sel]; if (s) { s.sec = sec; changed('sec'); } };
    F.setAspect = a => { if (ASPECTS[a]) { F.aspect = a; changed('aspect'); } return F.aspect; };
    F.setFps = f => { F.fps = clamp(+f || 24, 6, 60); changed('fps'); };
    F.setSize = s => { if (SIZES[s]) { F.size = s; changed('size'); } };
    F.setTime = t => { F.time = t; if (W.setSky) W.setSky(t); changed('time'); };

    /* ── the reel ── */
    F.select = i => { F.sel = clamp(i | 0, -1, F.shots.length - 1); F.viewT = 0; if (F.onChange) F.onChange('select'); return F.sel; };
    F.view = i => { F.select(i); F.stop(); if (F.shots[F.sel]) F.setMode('shot'); return F.sel; };
    F.here = asKey => {
      const c = W.camera, k = { pos: c.position.clone(), tgt: c.getWorldDirection(V1).multiplyScalar(20 * M).add(c.position).clone(), fov: c.fov };
      const s = asKey && F.shots[F.sel];
      if (s) { s.keys.push(k); s.curve = null; changed('key'); return { shot: F.sel, keys: s.keys.length }; }
      F.shots.push({ name: `Shot ${F.shots.length + 1}`, keys: [k], sec: F.sec, act: null }); F.sel = F.shots.length - 1; changed('shot'); return { shot: F.sel, keys: 1 };
    };
    F.remove = i => { if (i == null) i = F.sel; if (!F.shots[i]) return; F.shots.splice(i, 1); F.sel = Math.min(F.sel, F.shots.length - 1); if (!F.shots.length && F.mode === 'shot') F.setMode('view'); changed('remove'); };
    F.moveShot = (i, dir) => { const j = i + dir; if (!F.shots[i] || !F.shots[j]) return; const t = F.shots[i]; F.shots[i] = F.shots[j]; F.shots[j] = t; if (F.sel === i) F.sel = j; changed('order'); };
    F.rename = (i, name) => { const s = F.shots[i]; if (!s) return; s.name = String(name || '').trim() || s.name; changed('name'); };
    const truce = on => { if (on) { if (F.truceWas == null) F.truceWas = !!W.truce; W.truce = true; } else if (F.truceWas != null) { W.truce = F.truceWas; F.truceWas = null; } };   // nobody shoots the actors while the film plays
    F.playShot = i => { if (!F.shots[i]) return false; F.play = { on: true, i, t: 0, all: false }; F.sel = i; truce(true); enter(i); if (F.onChange) F.onChange('play'); return true; };
    F.playAll = () => { if (!F.shots.length) return false; F.play = { on: true, i: 0, t: 0, all: true }; F.sel = 0; truce(true); enter(0); if (F.onChange) F.onChange('play'); return true; };
    F.stop = () => { const was = F.play.on; truce(false); F.play = { on: false, i: F.play.i, t: 0, all: false }; F.running = false; F.hold = null; F.actState = null; showTitle(null); if (was && F.onChange) F.onChange('stop'); if (F.mode === 'view' && W.rig) { W.camera.fov = gameFov(); W.camera.updateProjectionMatrix(); W.rig.cam.set = false; } return was; };
    F.total = () => F.shots.reduce((s, x) => s + x.sec, 0);
    /** A shot starts: its SET lines change the planet, the character or the sky; the clock holds until the world has laid what it lays; a planned shot is staged again; its act begins. */
    function enter(i) {
      const s = F.shots[i]; F.running = false; F.actState = null; F.hold = null; if (!s) return;
      let changed = false; const set = setFor(i);
      if (set) {
        if (set.as && W.setCharacter && W.character !== set.as) { F.ground(); W.setCharacter(set.as); changed = true; }
        if (set.world && W.setWorld && W.world !== set.world) { F.ground(); W.setWorld(set.world); changed = true; }
        if (s.set) { if (s.set.time && W.setSky) W.setSky(s.set.time); if (s.set.weather && W.setWeather) W.setWeather(s.set.weather); }
      }
      if (s.act && s.act.leave) F.ground();
      if (changed) F.hold = { until: performance.now() + 8000, least: performance.now() + 400, why: 'the world is laying' };
      if (!F.hold) settle(s);
      showTitle(s.title != null ? s : null);
    }
    /** The hold is over: a planned shot is staged where things now stand, the act's first moves happen. */
    function settle(s) {
      if (s.plan) { try { const st = F.stage(s.plan); s.keys = st.keys; s.curve = null; s.name = s.name || st.name; } catch (e) { F.log.push('stage: ' + (e.message || e)); } }
      const a = s.act; if (!a) return; const st = F.actState = { fireT: 0, saberT: 0, started: true, boarded: false, aimed: false };
      if (a.look && W.rig) { W.rig.heading = Math.atan2(a.look.x - W.rig.pos.x, a.look.z - W.rig.pos.z); W.rig.figure.rotation.y = W.rig.heading; }
      if (!a.ride && !a.tie) { board(a, st); aimAhead(a, st); }
    }
    /** Into the named ride or the TIE; tried every step until it works, since a planet's vehicles come a moment after the planet. */
    function board(a, st) {
      if (st.boarded) return; if (a.ride && W.mode === 'walk') { const S = F.subject(a.ride), it = W.props && W.props.items.get(S.what); if (it && it.ready && W.teleport && W.boardVehicle) { W.teleport(S.x + S.r + 1.2 * M, S.z); W.rig.heading = it.yaw * Math.PI / 2; W.boardVehicle(it.id); if (W.mode === 'ride') st.boarded = true; } return; }
      if (a.tie && W.mode === 'walk' && W.board && W.ship) { W.teleport(W.ship.position.x + 3 * M, W.ship.position.z); W.board(); if (W.mode === 'fly') st.boarded = true; return; }
      st.boarded = true;
    }
    /** AHEAD m: the point that far along the clearest of eight headings (the figure's own first), so a walk does not start into a wall. */
    function aimAhead(a, st) {
      if (st.aimed || !a.ahead) return; st.aimed = true;
      const ride = W.mode === 'ride' && W.veh, p = ride ? W.veh.pos : W.rig.pos, h0 = ride ? W.veh.heading : W.rig.heading, d = a.ahead * M;
      const shipR = 7 * M, ship = W.ship && W.mode !== 'fly' ? W.ship.position : null;
      const blocked = h => { let n = 0; for (let t = 0.12; t <= 1; t += 0.11) { const x = p.x + Math.sin(h) * d * t, z = p.z + Math.cos(h) * d * t; let hit = false;
        if (W.city && window.Bricks) for (const b of W.city.near(x, z, 2 * M)) if (Bricks.pointInRing(x / M, z / M, b.ring)) { hit = true; break; }
        if (!hit && W.props) for (const it of W.props.near(x, z, 2 * M)) { const b = it.box; if (b && x > b.min.x - M && x < b.max.x + M && z > b.min.z - M && z < b.max.z + M && !(ride && W.veh.prop === it)) { hit = true; break; } }
        if (!hit && ship && Math.hypot(ship.x - x, ship.z - z) < shipR) hit = true;
        if (hit) n++; } return n; };
      let best = h0, bn = blocked(h0); if (bn) for (let k = 1; k < 8 && bn; k++) { const h = h0 + k * Math.PI / 4 * (k % 2 ? 1 : -1); const n = blocked(h); if (n < bn) { bn = n; best = h; } }
      a.kind = ride ? 'drive' : 'walk'; a.x = p.x + Math.sin(best) * d; a.z = p.z + Math.cos(best) * d;
      if (!ride && W.rig) { W.rig.heading = best; W.rig.figure.rotation.y = best; }
    }
    const laidAll = () => { if (!W.vehicles) return true; const l = W.vehicles.list(); return l.every(v => v.ready); };
    /** The planet and the character a shot plays in: its own SET, or the last one before it, so a shot played on its own starts where the reel would have it. */
    function setFor(i) { const out = { world: null, as: null }; for (let k = i; k >= 0; k--) { const st = F.shots[k].set; if (!st) continue; if (!out.world && st.world) out.world = st.world; if (!out.as && st.as) out.as = st.as; if (out.world && out.as) break; } return out.world || out.as ? out : null; }
    F.ground = () => { if (W.filmGround) W.filmGround(); };
    /** The title card on the page while a title shot plays (the take draws its own). */
    function showTitle(s) {
      let el = document.getElementById('title'); if (!el) { el = document.createElement('div'); el.id = 'title'; el.innerHTML = '<span></span>'; document.body.appendChild(el); }
      el.hidden = !s; if (s) { el.dataset.style = s.style || 'card'; el.querySelector('span').textContent = s.title; }
    }

    /* ── the step: the reel's clock, the free camera's dolly, the sun ── */
    F.step = dt => {
      if (F.hold) { const s = F.shots[F.play.i], now = performance.now(); if (now > F.hold.until || (now > F.hold.least && laidAll())) { F.hold = null; if (s) settle(s); } else return; }   // the clock waits for the planet's things
      if (F.rec) F.rec.t += dt;
      if (F.play.on && F.actState) stepAct(dt);
      if (F.play.on) {
        F.play.t += dt; const s = F.shots[F.play.i];
        if (!s || F.play.t >= s.sec - 1e-9) {
          if (F.play.all && F.play.i + 1 < F.shots.length) { F.play.i++; F.play.t = 0; F.sel = F.play.i; enter(F.play.i); if (F.onChange) F.onChange('cut'); }
          else { F.stop(); if (F.rec && F.rec.until == null) F.rec.done = true; }
        }
      } else if (F.mode === 'shot') { const s = F.shots[F.sel]; if (s && s.keys.length > 1) F.viewT = Math.min(F.viewT + dt, s.sec); }   // a move is previewed once, then holds its last key
      if (F.mode === 'free' && !F.play.on) {
        const I = W.input, f = F.free, run = I.run || I.boost || I.runHook, v = (run ? 18 : 6) * M * dt;
        if (I.look) { F.look(I.look.dx, I.look.dy); I.look.dx = I.look.dy = 0; }
        if (I.L && I.L.mag) { const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw), rx = Math.cos(f.yaw), rz = -Math.sin(f.yaw); f.pos.x += (fx * I.L.y + rx * I.L.x) * v; f.pos.z += (fz * I.L.y + rz * I.L.x) * v; f.pos.y += Math.sin(f.pitch) * I.L.y * v; }
        const g = groundH(f.pos.x, f.pos.z) + 0.4 * M; if (f.pos.y < g) f.pos.y = g;
      }
      if (F.sun) applySun();
    };

    /* ── direction: the figure or the ride goes where the shot says ── */
    const act = () => F.play.on && F.shots[F.play.i] && F.shots[F.play.i].act;
    /** The act's running parts: the throttle of a flight, the trigger, the saber. */
    function stepAct(dt) {
      const a = act(), st = F.actState, I = W.input; if (!a || !st) return;
      if (!st.boarded) { board(a, st); if (!st.boarded) return; } aimAhead(a, st);
      if (a.fly && W.mode === 'fly') { I.fly.x = 0; I.fly.y = 0.35; I.fly.mag = 0.6; I.fly.held = true; }   // a ride's flight is steered from the ride branch (F.steer)
      if (a.fire) { st.fireT += dt; if (st.fireT > 0.45) { st.fireT = 0; if (W.mode === 'fly' || W.mode === 'ride') I.fireOnce = true; else I.saber = true; } }
      if (a.saber) { st.saberT += dt; if (st.saberT > 1.1) { st.saberT = 0; if (W.mode === 'walk') I.saber = true; } }
    }
    F.acting = () => { const a = act(); return !!a && !F.hold && ((a.kind === 'walk' && W.mode === 'walk') || (W.mode === 'ride' && (a.kind === 'drive' || a.fly))); };
    F.move = out => {
      const a = act(), p = W.rig.pos; if (!a) { out.x = out.z = out.mag = 0; return out; }
      const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz);
      if (d < 1 * M) { out.x = out.z = out.mag = 0; F.running = false; return out; }
      out.x = dx / d; out.z = dz / d; out.mag = 1; F.running = d > 8 * M; return out;
    };
    F.steer = V => {
      const a = act(); if (!a) return; V.input.boost = false;
      const alt = V.pos.y - groundH(V.pos.x, V.pos.z), hover = V.K.stall === 0;
      const lift = !a.fly ? 0 : hover ? (alt < 2.5 * M ? 0.5 : alt > 4 * M ? -0.3 : 0) : (!V.airborne || alt < 12 * M ? 1 : 0.1);   // a hover skims two and a half metres up; a plane climbs to twelve, then levels
      if (a.kind !== 'drive') { V.input.x = 0; V.input.y = lift; V.input.mag = a.fly ? 1 : 0; return; }   // a flight with no point: straight on
      const dx = a.x - V.pos.x, dz = a.z - V.pos.z, d = Math.hypot(dx, dz), err = wrap(Math.atan2(dx, dz) - V.heading);
      V.input.x = clamp(-err * 1.5, -1, 1); V.input.y = a.fly ? lift : d > 3 * M ? (Math.abs(err) > 1.2 ? 0.35 : 1) : 0; V.input.mag = a.fly ? 1 : Math.min(1, Math.hypot(V.input.x, V.input.y));
    };

    /* ── the take ── */
    const MIMES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
    F.canRecord = () => typeof MediaRecorder !== 'undefined' && !!document.createElement('canvas').captureStream;
    F.record = sec => {
      if (F.rec) return F.stopRec();
      if (!F.canRecord()) { say('this browser cannot record a canvas', 'warn'); return false; }
      const src = W.renderer.domElement, A = ASPECTS[F.aspect], H = SIZES[F.size], w = A >= 1 ? Math.round(H * A / 2) * 2 : Math.round(H * A / 2) * 2, h = H;
      const cap = document.createElement('canvas'); cap.width = w; cap.height = h; const ctx = cap.getContext('2d');
      const mime = MIMES.find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
      if (!mime) { say('no video format to record with', 'warn'); return false; }
      const stream = cap.captureStream(F.fps); let rec;
      try { rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: H >= 1080 ? 12e6 : 6e6 }); } catch (e) { say('could not start the recorder: ' + (e.message || e), 'warn'); return false; }
      const chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const R = { rec, cap, ctx, src, frames: 0, t: 0, until: sec ? +sec : null, done: false, mime, started: performance.now() };
      rec.onstop = () => { F.blob = new Blob(chunks, { type: mime.split(';')[0] }); if (F.url) { try { URL.revokeObjectURL(F.url); } catch (e) { } } F.url = URL.createObjectURL(F.blob); F.take = { size: F.blob.size, type: F.blob.type, frames: R.frames, sec: +R.t.toFixed(3), fps: F.fps, w, h, ms: Math.round(performance.now() - R.started) }; if (F.rec === R) F.rec = null; say(`take done · ${R.frames} frames · ${(F.blob.size / 1024).toFixed(0)} KB · save it`, 'ok'); if (F.onChange) F.onChange('take'); };
      F.rec = R; F.blob = null; F.steps = 0;
      if (R.until == null) { if (!F.shots.length) { R.until = F.sec; } else if (F.mode === 'shot' && F.shots[F.sel] && !F.playAllWanted) F.playShot(F.sel); else F.playAll(); }
      rec.start(); say(R.until != null ? `recording ${R.until} s of the live view` : `recording the reel · ${F.total().toFixed(1)} s`, 'busy'); if (F.onChange) F.onChange('rec'); return true;
    };
    F.stopRec = () => { const R = F.rec; if (!R) return false; if (F.play.on) F.stop(); try { R.rec.state !== 'inactive' && R.rec.stop(); } catch (e) { F.rec = null; } return true; };
    F.afterRender = () => {
      const R = F.rec; if (!R) return;
      if (F.hold) return;                                                          // the world is still laying a planet: no frame goes into the take
      drawWithAspect(R.src, R.ctx, R.cap.width, R.cap.height); R.frames++;
      const s = F.play.on && F.shots[F.play.i]; if (s && s.title != null) drawTitle(R.ctx, R.cap.width, R.cap.height, s);
      if (R.done || (R.until != null && R.t >= R.until - 1e-6)) F.stopRec();
    };
    function drawTitle(ctx, w, h, s) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h); const logo = s.style === 'logo';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = logo ? '#ffe81f' : '#4bd5ee';
      const lines = String(s.title).split('\n'), size = logo ? Math.round(h * 0.17) : Math.round(h * 0.06); ctx.font = `${logo ? '900' : '400'} ${size}px ${logo ? 'Impact, "Arial Black", Helvetica, sans-serif' : 'Helvetica, Arial, sans-serif'}`;
      lines.forEach((l, i) => ctx.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.3, w * 0.9));
    }
    function drawWithAspect(src, ctx, dw, dh) {
      const sw = src.width || dw, sh = src.height || dh, k = Math.min(dw / sw, dh / sh), w = sw * k, h = sh * k;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, dw, dh); try { ctx.drawImage(src, (dw - w) / 2, (dh - h) / 2, w, h); } catch (e) { }
    }
    F.download = () => { if (!F.url) return false; const a = document.createElement('a'); a.href = F.url; a.download = `momento-${((W.place && W.place.name) || 'world').replace(/[^\w]+/g, '-').toLowerCase()}.${/mp4/.test(F.blob.type) ? 'mp4' : 'webm'}`; document.body.appendChild(a); a.click(); a.remove(); return true; };
    /** A still of a shot's first key for its card: one extra render, then a copy into the small canvas. */
    F.thumb = (i, canvas) => {
      const s = F.shots[i], cam = W.camera, real = W.renderReal; if (!s || !cam || !real) return false;
      if (s.title != null) { drawTitle(canvas.getContext('2d'), canvas.width, canvas.height, s); return true; }
      const pos = cam.position.clone(), q = cam.quaternion.clone(), fov = cam.fov, asp = cam.aspect;
      cam.aspect = canvas.width / canvas.height; poseAt(cam, s, 0); real(W.scene, cam);
      const ctx = canvas.getContext('2d'); drawWithAspect(W.renderer.domElement, ctx, canvas.width, canvas.height);
      cam.position.copy(pos); cam.quaternion.copy(q); cam.fov = fov; cam.aspect = asp; cam.updateProjectionMatrix(); return true;
    };

    /* ── memory ── */
    const key = () => 'world.film.' + (W.placeKey ? W.placeKey() : 'here');
    F.save = () => { try { if (F.shots.length || F.lights.length) localStorage.setItem(key(), F.text()); else localStorage.removeItem(key()); } catch (e) { } };
    F.load = () => { let t = null; try { t = localStorage.getItem(key()); } catch (e) { } if (!t) return 0; const r = F.parse(t); return r.shots; };

    /* ── words → shots ── */
    /** What the world has to point a camera at: the player, the landmarks, the named buildings, the kits. */
    F.scene = () => {
      const p = W.rig ? W.rig.pos : new THREE.Vector3(), out = { me: { x: +(p.x / M).toFixed(1), z: +(p.z / M).toFixed(1), mode: W.mode, character: W.character }, landmarks: [], buildings: [], sun: W.sky ? W.sky.stats() : null };
      if (W.props) for (const it of W.props.items.values()) if (it.src && (it.src.landmark || it.kit)) out.landmarks.push({ id: it.id, kind: it.kit || it.src.kind || it.src.op, x: +(it.x / M).toFixed(1), z: +(it.z / M).toFixed(1) });
      if (W.city) for (const b of W.city.buildings) { if (!b.name) continue; const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d > 400 * M) continue; out.buildings.push({ name: b.name, kind: b.kind || 'building', x: +b.cx.toFixed(1), z: +b.cz.toFixed(1), h: +((b.yTop - b.y0) / M).toFixed(1), d: +(d / M).toFixed(0) }); }
      out.buildings.sort((a, b) => a.d - b.d); out.buildings = out.buildings.slice(0, 24); return out;
    };
    const KIT_WORDS = { atat: /\bat-?at\b|walker/i, atst: /\bat-?st\b|scout walker/i, xwing: /\bx-?wing\b/i, shuttle: /\bshuttle\b/i, speeder: /\bspeeder\b/i, car: /\bcar\b/i, truck: /\btruck\b/i, bus: /\bbus\b/i, tie: /\btie\b/i };
    /** A subject from a word, an id, a name, or a point: its centre, its footprint, its height. */
    F.subject = on => {
      const p = W.rig ? W.rig.pos : new THREE.Vector3();
      const me = () => { const c = W.mode === 'ride' && W.veh ? W.veh.pos : W.mode === 'fly' ? W.tie.pos : p; return { x: c.x, z: c.z, y0: groundH(c.x, c.z), h: (W.mode === 'walk' ? 2.5 : 4) * M, r: (W.mode === 'walk' ? 0.5 : 2) * M, what: 'me' }; };
      const prop = it => { const b = it.box; if (!b) return null; return { x: (b.min.x + b.max.x) / 2, z: (b.min.z + b.max.z) / 2, y0: b.min.y, h: b.max.y - b.min.y, r: Math.max(b.max.x - b.min.x, b.max.z - b.min.z) / 2, what: it.id }; };
      const bld = b => ({ x: b.cx * M, z: b.cz * M, y0: b.y0, h: b.yTop - b.y0, r: (b.r || 5) * M, what: b.name || b.kind || b.id });
      if (Array.isArray(on) && on.length >= 2) { const x = +on[0] * M, z = +on[1] * M; return { x, z, y0: groundH(x, z), h: 2 * M, r: 1 * M, what: `${on[0]}, ${on[1]}` }; }
      const s = String(on == null ? 'me' : on).trim(); if (!s || /^(me|myself|i|the (player|hero|figure)|vader|us)$/i.test(s)) return me();
      if (W.props) { const it = W.props.items.get(s); if (it) return prop(it) || me(); }
      if (W.tie && /^(tie|the tie|ship)$/i.test(s)) { const c = W.tie.flying ? W.tie.pos : W.ship.position; return { x: c.x, z: c.z, y0: c.y, h: 4 * M, r: 4 * M, what: 'the TIE' }; }
      for (const [k, re] of Object.entries(KIT_WORDS)) if (re.test(s) && W.props) { let best = null, bd = Infinity; for (const it of W.props.items.values()) { if (!(it.kit === k || (it.src && (it.src.kind === k || it.src.kit === k)))) continue; const d = Math.hypot(it.x - p.x, it.z - p.z); if (d < bd) { bd = d; best = it; } } if (best) return prop(best) || me(); if (k === 'tie' && W.ship) { const c = W.ship.position; return { x: c.x, z: c.z, y0: c.y, h: 4 * M, r: 4 * M, what: 'the TIE' }; } }
      if (W.city) {
        const words = s.toLowerCase().replace(/^the\s+/, ''); let best = null, bd = Infinity;
        for (const b of W.city.buildings) { const name = (b.name || '').toLowerCase(), kind = (b.kind || '').toLowerCase(); const hit = (name && (name === words || name.includes(words) || words.includes(name))) || (kind && (kind === words || (/tower|church|stadium|cathedral|school|station|hall|hotel|museum|library|bridge|temple|mosque|castle|shop|house/.test(words) && kind.includes(words.split(/\s+/).pop())))); if (!hit) continue; const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d < bd) { bd = d; best = b; } }
        if (!best && /tower|tallest|highest|skyscraper/.test(words)) { let hh = 0; for (const b of W.city.buildings) { const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z), h = b.yTop - b.y0; if (d < 300 * M && h > hh) { hh = h; best = b; } } }
        if (!best && /house|building|the nearest|nearby/.test(words)) { for (const b of W.city.buildings) { const d = Math.hypot(b.cx * M - p.x, b.cz * M - p.z); if (d < bd) { bd = d; best = b; } } }
        if (best) return bld(best);
      }
      return me();
    };
    /** A semantic shot staged into keys: the subject's size sets the distance, the bearing the side, the move the second key. */
    F.stage = sh => {
      const S = F.subject(sh.on), frame = FRAMES[sh.frame] != null ? sh.frame : 'medium', size = Math.max(S.h, 2 * S.r, 1.5 * M);
      let d = Math.max(3 * M, FRAMES[frame] * size), bear = (BEAR[String(sh.from || '').toLowerCase()] != null ? BEAR[String(sh.from).toLowerCase()] : 180) * Math.PI / 180;
      if (frame === 'shoulder' && W.rig) { bear = -W.rig.heading; if (String(sh.on || 'me') === 'me') d = 2.6 * M; }   // a heading h looks along (sin h, cos h); the bearing b stands the camera at (sin b, -cos b): behind the figure is b = -h
      const fov = clamp(+sh.lens || LENS[frame], 12, 110), sec = clamp(+sh.sec || F.sec, 0.5, 120), tgtY = S.y0 + S.h * (frame === 'wide' ? 0.45 : frame === 'low' ? 0.6 : 0.5);
      const pose = (dist, b, kind) => {
        const k = kind || frame; let cx = S.x + Math.sin(b) * dist, cz = S.z - Math.cos(b) * dist, cy;
        if (k === 'aerial') { cx = S.x + Math.sin(b) * dist * 0.6; cz = S.z - Math.cos(b) * dist * 0.6; cy = S.y0 + S.h + dist * 0.8; }
        else if (k === 'low') cy = groundH(cx, cz) + 0.4 * M;
        else if (k === 'shoulder') cy = S.y0 + S.h * 0.9;
        else cy = Math.max(S.y0 + S.h * (k === 'wide' ? 0.6 : 0.45), groundH(cx, cz) + 0.6 * M);
        if (k !== 'aerial' && k !== 'low') { const g = groundH(cx, cz) + 0.5 * M; if (cy < g) cy = g; }
        const tgt = new THREE.Vector3(S.x, tgtY, S.z); if (k === 'shoulder') { tgt.x = S.x - Math.sin(b) * 6 * M; tgt.z = S.z + Math.cos(b) * 6 * M; tgt.y = S.y0 + S.h * 0.7; }
        return { pos: new THREE.Vector3(cx, cy, cz), tgt, fov };
      };
      const keys = [pose(d, bear)], move = MOVES.includes(sh.move) ? sh.move : 'hold';
      if (move === 'push') keys.push(pose(d / 2, bear)); else if (move === 'pull') keys.push(pose(d * 2, bear));
      else if (move === 'orbit') { keys.push(pose(d, bear + Math.PI / 4)); keys.push(pose(d, bear + Math.PI / 2)); }
      else if (move === 'crane') keys.push(pose(d, bear, 'aerial')); else if (move === 'track') { const k2 = pose(d, bear); k2.pos.x += Math.cos(bear) * d * 0.6; k2.pos.z += Math.sin(bear) * d * 0.6; keys.push(k2); }
      let act = null; if (sh.act && sh.act.who) { const w = sh.act.walk || sh.act.drive; if (Array.isArray(w) && w.length >= 2) act = { who: 'me', kind: sh.act.drive ? 'drive' : 'walk', x: +w[0] * M, z: +w[1] * M }; else if (typeof w === 'string') { const T = F.subject(w); act = { who: 'me', kind: sh.act.drive ? 'drive' : 'walk', x: T.x, z: T.z }; } }
      return { name: String(sh.name || `${frame} on ${S.what}`).slice(0, 48), keys, sec, act, on: S.what, frame, from: sh.from || 's', move };
    };
    /** The same words without the model: subjects, frames, bearings, seconds and moves, one shot per clause. */
    F.parseWords = text => {
      const shots = []; let prev = null;
      for (let clause of String(text || '').split(/\bthen\b|;|\n|\.\s+(?=[A-Za-z])/i)) {
        clause = clause.trim().replace(/^(and|next|after that|finally|first|now)\s+/i, ''); if (!clause) continue;
        const low = clause.toLowerCase(), sh = { name: clause.replace(/[.,]+$/, '').slice(0, 48) };
        const bareMove = /^\s*(push|dolly|move|pull|zoom|orbit|circle|crane|rise|track|slide|pan|hold)\b/.test(low.replace(/^(the camera|camera|we|it)\s+/, '')) && !/\b(of|on|at|from)\b/.test(low);
        if (bareMove && prev) {   // "then push in, 3 seconds" is the previous shot's move, not a new shot
          prev.move = /\b(push|dolly in|move in|closer|zoom in)\b/.test(low) ? 'push' : /\b(pull|dolly out|move out|pull back|zoom out|reveal)\b/.test(low) ? 'pull' : /\b(orbit|circle|around)\b/.test(low) ? 'orbit' : /\b(crane|rise|rising|lift)\b/.test(low) ? 'crane' : /\b(track|tracking|slide|pan|sideways)\b/.test(low) ? 'track' : 'hold';
          const sec = low.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds?)\b/); if (sec) prev.sec = +sec[1]; continue;
        }
        sh.frame = /\b(wide|establishing|long shot|far)\b/.test(low) ? 'wide' : /\b(close|close-up|closeup|tight|detail)\b/.test(low) ? 'close' : /\b(aerial|overhead|top-?down|bird|from above|drone)\b/.test(low) ? 'aerial' : /\b(low angle|low shot|from below|worm|from the ground)\b/.test(low) ? 'low' : /\b(over the shoulder|over-the-shoulder|shoulder|behind me|from behind)\b/.test(low) ? 'shoulder' : 'medium';
        const fm = low.match(/from the (north-?east|north-?west|south-?east|south-?west|north|south|east|west)\b/); sh.from = fm ? fm[1].replace('-', '').replace(/north(east|west)/, 'n$1').replace(/south(east|west)/, 's$1').replace(/^n(east)$/, 'ne').replace(/^n(west)$/, 'nw').replace(/^s(east)$/, 'se').replace(/^s(west)$/, 'sw').replace(/^north$/, 'n').replace(/^south$/, 's').replace(/^east$/, 'e').replace(/^west$/, 'w') : (/\bfrom behind\b/.test(low) ? 'behind' : 's');
        const sec = low.match(/(\d+(?:\.\d+)?)\s*(?:s|sec|secs|seconds?)\b/); sh.sec = sec ? +sec[1] : F.sec;
        const lens = low.match(/(?:lens|fov)\s*(\d+)|(\d+)\s*mm/); sh.lens = lens ? (lens[1] ? +lens[1] : Math.round(2 * Math.atan(12 / +lens[2]) * 180 / Math.PI)) : 0;
        sh.move = /\b(push|dolly in|move in|closer|zoom in)\b/.test(low) ? 'push' : /\b(pull|dolly out|move out|pull back|zoom out|reveal)\b/.test(low) ? 'pull' : /\b(orbit|circle|around)\b/.test(low) ? 'orbit' : /\b(crane|rise|rising|lift|up and away)\b/.test(low) ? 'crane' : /\b(track|tracking|slide|pan|sideways)\b/.test(low) ? 'track' : 'hold';
        const walk = low.match(/\b(?:i|me|we)?\s*(?:walk|walks|walking|run|runs|go|goes)\s+(?:to|toward|towards|up to)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:for|while|as|and|then)\b|$)/); if (walk) sh.act = { who: 'me', walk: walk[1].trim() };
        const drive = low.match(/\b(?:drive|drives|driving|fly|flies)\s+(?:to|toward|towards)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:for|while|as|and|then)\b|$)/); if (drive) sh.act = { who: 'me', drive: drive[1].trim() };
        let on = null; const of = low.match(/\b(?:of|on|at)\s+(the\s+[\w' -]+?|[\w'-]+)(?=[,.;]|\s+(?:from|for|while|as|and|then|with|in|at|over|walking|walks|walk|push|pull|orbit|crane|track|\d)|$)/);
        if (/\b(me|myself|on me|of me|the hero|vader|the player)\b/.test(low) && !(of && !/^(me|myself|the hero|the player|vader)$/.test(of[1]))) on = 'me';
        else if (of) on = of[1]; else { for (const [k, re] of Object.entries(KIT_WORDS)) if (re.test(low)) { on = k; break; } if (!on) { const tw = low.match(/\b(tower|church|stadium|cathedral|bridge|station|castle|house|building)\b/); on = tw ? 'the ' + tw[1] : 'me'; } }
        if (sh.from === 'behind') { sh.frame = sh.frame === 'medium' ? 'shoulder' : sh.frame; sh.from = 's'; }
        if (on === 'me' && prev && !/\b(me|myself|the hero|vader|the player)\b/.test(low) && !of) on = prev.on;   // a clause without a subject stays on the last one
        sh.on = on; shots.push(sh); prev = sh;
      }
      return { name: String(text || '').slice(0, 40), shots };
    };
    /** Words to a shot list: the model with the film spec and the scene, or the local parser; every shot is staged and joins the reel. */
    F.words = async (text, opts = {}) => {
      text = String(text || '').trim(); if (!text || F.busy) return null;
      F.busy = true; let plan = null, how = 'local';
      try {
        const Ai = window.Ai;
        if (!opts.local && !F.local && Ai && Ai.key()) {
          say('asking the model for a shot list', 'busy');
          try {
            const scene = F.scene(); const brief = `SCENE (metres, x east, z south): player ${JSON.stringify(scene.me)}; landmarks ${JSON.stringify(scene.landmarks)}; named buildings ${JSON.stringify(scene.buildings)}; sky ${scene.sun ? scene.sun.mode + ', night ' + scene.sun.night : 'day'}.\nFILM BRIEF: ${text}\nAnswer with the shot list as one JSON object.`;
            const r = await Ai.request(brief, { system: FILM_SPEC, stage: 'FRAMING', detail: 'a shot list', parse: raw => { let p = null; try { p = JSON.parse(raw); } catch (e) { const m = String(raw || '').match(/\{[\s\S]*\}/); if (m) try { p = JSON.parse(m[0]); } catch (x) { } } if (!p || !Array.isArray(p.shots)) throw new Error('the model did not return a shot list'); return p; }, signal: opts.signal });
            plan = r.program; how = 'model';
          } catch (e) { if (e && e.name === 'AbortError') throw e; F.log.push('model: ' + (e.message || e)); plan = null; }
        }
        if (!plan) plan = F.parseWords(text);
        const staged = plan.shots.map(sh => { try { return F.stage(sh); } catch (e) { F.log.push('stage: ' + (e.message || e)); return null; } }).filter(Boolean);
        if (!staged.length) { say('no shot in those words', 'warn'); return null; }
        const at = F.shots.length; F.shots.push(...staged); F.sel = at; changed('words');
        say(`${staged.length} shot${staged.length === 1 ? '' : 's'} from your words (${how}) · ${staged.map(s => s.name).join(' · ')}`, 'ok');
        F.setMode('shot');
        return { how, shots: staged.map(s => ({ name: s.name, on: s.on, frame: s.frame, from: s.from, move: s.move, keys: s.keys.length, sec: s.sec, act: s.act })) };
      } finally { F.busy = false; }
    };

    /* ── a film from a program: shots as words (staged when they play), titles, planets and characters ── */
    F.loadProgram = (prog, append) => {
      const shots = [];
      for (const sh of (prog && prog.shots) || []) {
        const set = (sh.world || sh.as || sh.time || sh.weather) ? { world: sh.world || null, as: sh.as || null, time: sh.time || null, weather: sh.weather || null } : null;
        if (sh.title != null) { shots.push({ name: sh.name || sh.title.slice(0, 32), title: sh.title, style: sh.style || 'card', keys: [], sec: clamp(+sh.sec || 3, 0.5, 120), act: null, set }); continue; }
        const plan = { on: sh.on || 'me', frame: sh.frame || 'medium', from: sh.from || 's', lens: sh.lens || 0, sec: sh.sec || F.sec, move: sh.move || 'hold', name: sh.name };
        let act = null; if (sh.act) { act = { who: 'me', ...sh.act }; if (Array.isArray(act.walk)) { act.kind = 'walk'; act.x = act.walk[0] * M; act.z = act.walk[1] * M; } if (Array.isArray(act.drive)) { act.kind = 'drive'; act.x = act.drive[0] * M; act.z = act.drive[1] * M; } delete act.walk; delete act.drive; }
        shots.push({ name: sh.name || `${plan.frame} on ${plan.on}`, keys: [{ pos: new THREE.Vector3(0, 4 * M, 0), tgt: new THREE.Vector3(0, 2 * M, -10 * M), fov: 50 }], sec: clamp(+sh.sec || F.sec, 0.5, 120), act, set, plan, follow: !!sh.follow });
      }
      if (!append) { F.shots = []; } F.shots.push(...shots); F.sel = F.shots.length ? (append ? F.shots.length - shots.length : 0) : -1; F.name = prog && prog.name || F.name; changed('program'); return shots.length;
    };
    F.trailer = name => { const t = TRAILERS[name || 'a-new-hope']; if (!t) return 0; const n = F.loadProgram(t); say(`${t.name}: ${n} shots · Play previews it, Rec takes it`, 'ok'); return n; };

    /* ── what the page and the tests read ── */
    F.line = () => {
      if (F.hold && F.play.on) return `shot ${F.play.i + 1}/${F.shots.length} · ${F.hold.why}`;
      if (F.rec) { const R = F.rec; return `REC ${R.t.toFixed(1)} s · ${R.frames} frames${F.play.on && F.shots[F.play.i] ? ` · ${F.play.i + 1}/${F.shots.length} ${F.shots[F.play.i].name}` : ''}`; }
      if (F.play.on && F.shots[F.play.i]) return `shot ${F.play.i + 1}/${F.shots.length} · ${F.shots[F.play.i].name} · ${F.play.t.toFixed(1)} / ${F.shots[F.play.i].sec} s`;
      if (F.mode === 'free') return `free camera · lens ${Math.round(F.free.fov)} · left thumb dollies, right looks, pinch zooms`;
      if (F.mode === 'shot' && F.shots[F.sel]) { const s = F.shots[F.sel]; return `shot ${F.sel + 1}/${F.shots.length} · ${s.name} · ${s.keys.length > 1 ? 'a move over ' : 'held '}${s.sec} s`; }
      return '';
    };
    F.state = () => ({ mode: F.mode, sel: F.sel, n: F.shots.length, play: { ...F.play }, hold: !!F.hold, name: F.name || null, world: W.world, character: W.character, playerMode: W.mode, rec: F.rec ? { t: +F.rec.t.toFixed(3), frames: F.rec.frames, until: F.rec.until } : null, aspect: F.aspect, fps: F.fps, size: F.size, time: F.time, lights: F.lights.length, sun: F.sun ? { color: '#' + F.sun.color.getHexString(), intensity: F.sun.intensity } : null, steps: F.steps, take: F.take, busy: F.busy, status: F.status, free: { pos: F.free.pos.toArray().map(v => +v.toFixed(1)), yaw: +F.free.yaw.toFixed(3), pitch: +F.free.pitch.toFixed(3), fov: +F.free.fov.toFixed(1) },
      shots: F.shots.map(s => ({ name: s.name, sec: s.sec, title: s.title != null ? s.title : undefined, style: s.style, set: s.set || null, plan: s.plan || null, follow: !!s.follow, act: s.act ? { ...s.act } : null, keys: s.keys.map(k => ({ pos: k.pos.toArray().map(v => +v.toFixed(1)), tgt: k.tgt.toArray().map(v => +v.toFixed(1)), fov: +k.fov.toFixed(1) })) })) });
    F.ASPECTS = ASPECTS; F.SIZES = SIZES; F.FRAMES = FRAMES; F.SPEC = FILM_SPEC;
    return F;
  }

  window.Film = { create, ASPECTS, SIZES, FRAMES, BEAR, MOVES, TRAILERS, SPEC: FILM_SPEC };
})();
