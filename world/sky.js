/* world/sky.js — the sky over the place: a sun that keeps the clock, stars at night, clouds, fog and rain.

   One group named `sky` rides with the camera. A back-facing dome carries a
   zenith→horizon gradient and the sun's disc; a cloud of points is the stars;
   sprites are the clouds; a box of falling points is the rain. The world
   preset gives the daytime colours; the sun's height (from the device clock
   and the place's latitude and longitude, or pinned by a mode) blends them
   toward night, and the weather greys, dims and fogs them. Everything is
   drawn from canvases, nothing is fetched. Units: LDU, M per metre. */
(function () {
'use strict';
const DEG = Math.PI / 180, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const MODES = { auto: null, day: 55, dawn: 6, dusk: -2, night: -30 };            // pinned sun elevations in degrees; auto follows the clock
const WEATHER = {
  clear: { name: 'clear', clouds: 0.35, sun: 1, hemi: 1, far: 1, near: 1, grey: 0, dark: 0, rain: 0 },
  cloudy: { name: 'cloudy', clouds: 1, sun: 0.55, hemi: 0.95, far: 0.8, near: 1, grey: 0.5, dark: 0.08, rain: 0 },
  fog: { name: 'fog', clouds: 0, sun: 0.4, hemi: 0.85, nearM: 3, farM: 90, grey: 0.7, dark: 0.05, rain: 0 },
  rain: { name: 'rain', clouds: 1, sun: 0.35, hemi: 0.8, nearM: 10, farM: 350, grey: 0.7, dark: 0.18, rain: 1 },
  storm: { name: 'storm', clouds: 1, sun: 0.2, hemi: 0.6, nearM: 8, farM: 250, grey: 0.85, dark: 0.38, rain: 1.5, lightning: true },
};
const NIGHT = { zenith: 0x060914, horizon: 0x141a2c, fog: 0x10141f, hemi: [0x2e3a5c, 0x0e1118, 0.5], sun: [0x8fa8e0, 0.18] };   // enough moonlight to walk by; the lamps and windows do the rest
const DUSK = 0xf2a25a;
const C = (h) => new THREE.Color(h), C1 = new THREE.Color(), C2 = new THREE.Color(), C3 = new THREE.Color();
const grey = (c, k, dark) => { const l = 0.3 * c.r + 0.59 * c.g + 0.11 * c.b; c.r = lerp(c.r, l, k) * (1 - dark); c.g = lerp(c.g, l, k) * (1 - dark); c.b = lerp(c.b, l, k) * (1 - dark); return c; };

/** Where the sun is: elevation and azimuth (degrees, azimuth clockwise from north) for a place at a moment. */
function sunAt(lat, lon, date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1), n = (date.getTime() - start) / 864e5;
  const decl = -23.44 * Math.cos(2 * Math.PI * (n + 10) / 365) * DEG, phi = lat * DEG;
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600 + lon / 15, H = (h - 12) * 15 * DEG;
  const sinE = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H), elev = Math.asin(clamp(sinE, -1, 1));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(decl) * Math.cos(phi)) + Math.PI;
  return { elev: elev / DEG, azim: ((az / DEG) + 360) % 360, hour: (((h % 24) + 24) % 24) };
}
function dirOf(elevDeg, azimDeg, out) { const e = elevDeg * DEG, a = azimDeg * DEG; return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); }   // +x east, -z north

function puffTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  const blobs = [[128, 76, 60], [80, 84, 44], [176, 82, 46], [110, 60, 40], [150, 58, 38], [50, 90, 30], [206, 90, 30]];
  for (const [x, y, r] of blobs) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
}
function streakTexture() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 32; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(3, 0, 2, 32);
  const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearFilter; return t;
}

function create({ scene, M, lights, onLightning, onColour, onNight }) {
  const R = 40000, group = new THREE.Group(); group.name = 'sky'; group.frustumCulled = false;
  const uniforms = { zenith: { value: C(0x6f95c8) }, horizon: { value: C(0xb8cbd8) }, below: { value: C(0xc9d4d2) }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: C(0xffffff) }, disc: { value: 1 }, glow: { value: 0.35 } };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), new THREE.ShaderMaterial({ uniforms, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    vertexShader: 'varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 zenith, horizon, below, sunDir, sunCol; uniform float disc, glow; varying vec3 vDir;
      void main() { vec3 d = normalize(vDir); float t = d.y; vec3 col = mix(horizon, zenith, pow(max(t, 0.0), 0.55)); col = mix(col, below, smoothstep(0.0, -0.06, t));
        float c = dot(d, sunDir); col += sunCol * glow * pow(max(c, 0.0), 40.0) * smoothstep(-0.1, 0.05, sunDir.y + 0.02); col += sunCol * disc * smoothstep(0.99935, 0.99975, c);
        gl_FragColor = vec4(col, 1.0); }` }));
  dome.name = 'skydome'; dome.renderOrder = -10; dome.frustumCulled = false; group.add(dome);
  // stars: points on the dome, a little smaller than a pixel pair, additive
  const N_STARS = 1600, sp = new Float32Array(N_STARS * 3); for (let i = 0; i < N_STARS; i++) { const u = Math.random(), v = Math.random(), th = 2 * Math.PI * u, y = Math.pow(v, 0.7); const r = Math.sqrt(1 - y * y) * (R * 0.97); sp[3 * i] = Math.cos(th) * r; sp[3 * i + 1] = y * R * 0.97 - 0.02 * R; sp[3 * i + 2] = Math.sin(th) * r; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: false, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false }));
  stars.name = 'stars'; stars.renderOrder = -9; stars.frustumCulled = false; stars.visible = false; group.add(stars);
  // clouds: sprites in a ring about the camera, drifting east
  const N_CLOUDS = 18, cloudTex = puffTexture(), clouds = [];
  for (let i = 0; i < N_CLOUDS; i++) { const a = (i / N_CLOUDS) * 2 * Math.PI + Math.random() * 0.3, r = (450 + Math.random() * 1000) * M, w = (500 + Math.random() * 700) * M;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.85 })); s.scale.set(w, w * 0.42, 1); s.renderOrder = -8; s.name = 'cloud';
    s.userData = { ox: Math.cos(a) * r, oz: Math.sin(a) * r, h: (350 + Math.random() * 250) * M }; s.visible = false; clouds.push(s); group.add(s); }
  // rain: points in a box about the camera, falling and wrapping
  const N_RAIN = 1400, RB = 20 * M, RH = 30 * M, rp = new Float32Array(N_RAIN * 3); for (let i = 0; i < N_RAIN; i++) { rp[3 * i] = (Math.random() * 2 - 1) * RB; rp[3 * i + 1] = Math.random() * RH; rp[3 * i + 2] = (Math.random() * 2 - 1) * RB; }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3));
  const rain = new THREE.Points(rg, new THREE.PointsMaterial({ size: 0.45 * M, map: streakTexture(), transparent: true, opacity: 0.5, depthWrite: false, color: 0xdfe6f0, fog: false })); rain.name = 'rain'; rain.frustumCulled = false; rain.visible = false; rain.renderOrder = 5; scene.add(rain);
  scene.add(group);
  const S = { group, dome, stars, clouds, rain, uniforms, M, lights, preset: null, mode: 'auto', weather: 'clear', lat: 45, lon: 0, now: null, sun: { elev: 55, azim: 180, hour: 12 }, acc: 0, t: 0, bolt: 0, nextBolt: 8, cloudCover: 0, hemiBase: 0, fog: [0, 0], horizonHex: '#b8cbd8', dark: false, night: 0, day: 1, rainSpeed: 0, onLightning, onColour, onNight, stats: null, set: null, step: null };
  const sunDir = new THREE.Vector3();
  function apply() {
    const p = S.preset || { sky: 0xb8cbd8, fog: [0xc9d4d2, 30, 900], hemi: [0xffffff, 0xd8d8d8, 1.35], sun: [0xffffff, 1.25, [2, 3, 2]] }, w = WEATHER[S.weather] || WEATHER.clear, space = !!p.space;
    const weather = space ? WEATHER.clear : w;
    const elev = space ? 25 : S.sun.elev, d = space ? 1 : smooth(-8, 12, elev), warm = space ? 0 : (1 - clamp(Math.abs(elev) / 12, 0, 1)) * 0.65 * (1 - weather.grey * 0.7);
    // colours: the preset's day blended toward night, warmed at the horizon, greyed by the weather
    const zenith = C1.set(p.zenith != null ? p.zenith : p.sky).lerp(C2.set(NIGHT.zenith), 1 - d); if (!space) grey(zenith, weather.grey * 0.6, weather.dark);
    const horizon = C2.set(p.sky).lerp(C3.set(NIGHT.horizon), 1 - d); horizon.lerp(C3.set(DUSK), warm * 0.7); grey(horizon, weather.grey, weather.dark);
    const fogC = C3.set(p.fog[0]).lerp(new THREE.Color(NIGHT.fog), 1 - d); grey(fogC, weather.grey, weather.dark); if (weather.farM) fogC.copy(horizon);
    uniforms.zenith.value.copy(zenith); uniforms.horizon.value.copy(horizon); uniforms.below.value.copy(fogC);
    // the sun: its place, its colour, and the light it casts
    if (space) dirOf(25, 60, sunDir); else dirOf(elev, S.sun.azim, sunDir);
    uniforms.sunDir.value.copy(sunDir);
    const sunC = new THREE.Color(p.sun[0]).lerp(new THREE.Color(0xffb070), space ? 0 : warm * 0.8);
    uniforms.sunCol.value.copy(sunC); uniforms.disc.value = space ? 0.8 : (1 - weather.grey) * smooth(-3, 1, elev); uniforms.glow.value = space ? 0.1 : 0.35 * (1 - weather.grey) * smooth(-6, 2, elev);
    const lights = S.lights, lin = c => c.clone().convertSRGBToLinear();
    const night = 1 - d, hemiSky = new THREE.Color(p.hemi[0]).lerp(new THREE.Color(NIGHT.hemi[0]), night), hemiGround = new THREE.Color(p.hemi[1]).lerp(new THREE.Color(NIGHT.hemi[1]), night);
    lights.hemi.color.copy(lin(hemiSky)); lights.hemi.groundColor.copy(lin(hemiGround)); S.hemiBase = lerp(NIGHT.hemi[2], p.hemi[2], d) * weather.hemi / Math.PI; lights.hemi.intensity = S.hemiBase;
    const sunI = lerp(NIGHT.sun[1], p.sun[1] * smooth(-2, 15, elev), d) * weather.sun; lights.sun.color.copy(lin(d > 0.5 ? sunC : new THREE.Color(NIGHT.sun[0]))); lights.sun.intensity = Math.max(0.05, sunI) / Math.PI;
    if (elev > 2 || space) lights.sun.position.copy(sunDir).multiplyScalar(1000); else lights.sun.position.set(-sunDir.x, Math.max(0.35, -sunDir.y), -sunDir.z).multiplyScalar(1000);   // the moon stands opposite
    // fog and background meet the dome at the horizon
    const near = weather.nearM != null ? weather.nearM : p.fog[1] * (weather.near || 1) * (0.6 + 0.4 * d), far = weather.farM != null ? weather.farM : p.fog[2] * (weather.far || 1) * (0.5 + 0.5 * d);
    scene.fog.color.copy(lin(fogC)); scene.fog.near = near * M; scene.fog.far = far * M; S.fog = [near, far];
    scene.background.copy(horizon);
    // stars, clouds, rain
    S.cloudCover = weather.clouds; const starA = space ? 1 : clamp(night * 1.3 - 0.2, 0, 1) * (1 - weather.clouds * 0.9); stars.material.opacity = starA; stars.visible = starA > 0.01;
    const shown = space ? 0 : Math.round(N_CLOUDS * weather.clouds), cloudC = new THREE.Color(1, 1, 1).lerp(new THREE.Color(0x30343c), weather.grey * 0.7 + weather.dark).lerp(horizon.clone().multiplyScalar(1.25), night * 0.9);
    clouds.forEach((s, i) => { s.visible = i < shown; s.material.color.copy(cloudC); s.material.opacity = (0.8 + 0.15 * weather.grey) * (1 - 0.55 * night); });   // at night the clouds fade into the dark
    S.rainSpeed = weather.rain ? (weather.rain > 1 ? 14 : 11) * M : 0; rain.visible = !!weather.rain && !space; rain.material.opacity = weather.rain > 1 ? 0.6 : 0.45; rain.material.color.set(night > 0.5 ? 0x9aa6b8 : 0xdfe6f0);
    S.lightning = !!weather.lightning && !space; S.horizonHex = '#' + horizon.getHexString(); S.dark = (0.3 * horizon.r + 0.59 * horizon.g + 0.11 * horizon.b) < 0.45;
    S.night = p.litAlways || space ? 1 : clamp(night * 1.25 - 0.1, 0, 1); S.day = d;   // what the lamps and the windows go by
    if (S.onColour) S.onColour(S.horizonHex, S.dark, horizon);
    if (S.onNight) S.onNight(S.night);
  }
  function refresh() { if (S.mode === 'auto') S.sun = sunAt(S.lat, S.lon, S.now || new Date()); else { const d = S.now || new Date(); const s = sunAt(S.lat, S.lon, d); S.sun = { elev: MODES[S.mode], azim: MODES[S.mode] > 0 ? 200 : 300, hour: s.hour }; } }
  S.set = ({ preset, mode, weather, lat, lon, now } = {}) => { if (preset) S.preset = preset; if (mode && mode in MODES) S.mode = mode; if (weather && WEATHER[weather]) S.weather = weather; if (Number.isFinite(lat)) S.lat = lat; if (Number.isFinite(lon)) S.lon = lon; if (now !== undefined) S.now = now; refresh(); apply(); return S.stats(); };
  S.step = (dt, camera) => {
    S.t += dt; group.position.copy(camera.position);
    if (S.mode === 'auto' && (S.acc += dt) > 30) { S.acc = 0; refresh(); apply(); }
    for (const s of clouds) { if (!s.visible) continue; const u = s.userData; u.ox += 3 * M * dt; if (u.ox > 1500 * M) u.ox -= 3000 * M; s.position.set(camera.position.x + u.ox, camera.position.y + u.h, camera.position.z + u.oz); }
    if (rain.visible) { rain.position.copy(camera.position); rain.position.y -= 2 * M; const a = rg.attributes.position.array, dy = S.rainSpeed * dt; for (let i = 1; i < a.length; i += 3) { a[i] -= dy; if (a[i] < 0) a[i] += RH; } rg.attributes.position.needsUpdate = true; }
    if (S.lightning) { S.nextBolt -= dt; if (S.nextBolt <= 0) { S.nextBolt = 6 + Math.random() * 8; S.bolt = 0.12; S.bolts = (S.bolts || 0) + 1; if (S.onLightning) S.onLightning(); } if (S.bolt > 0) { S.bolt -= dt; S.lights.hemi.intensity = S.hemiBase * (S.bolt > 0 ? 4 : 1); } }
  };
  S.stats = () => ({ mode: S.mode, weather: S.weather, night: +S.night.toFixed(2), hour: +S.sun.hour.toFixed(2), elev: +S.sun.elev.toFixed(1), azim: +S.sun.azim.toFixed(0), sun: sunDir.toArray().map(v => +v.toFixed(3)), stars: +stars.material.opacity.toFixed(2), clouds: clouds.filter(s => s.visible).length, rain: rain.visible, fog: S.fog.map(v => Math.round(v)), horizon: S.horizonHex, dark: S.dark, bolts: S.bolts || 0, lat: S.lat, lon: S.lon });
  return S;
}
window.Sky = { create, sunAt, MODES, WEATHER };
})();
