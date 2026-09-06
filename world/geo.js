/* world/geo.js — the Earth, as TERRARIUM reads it, framework-free.

   Elevation from the AWS terrarium tiles, buildings and roads from Overpass,
   aerial imagery from Esri, place names from Nominatim. Every call has a
   timeout and returns { ok: false } instead of throwing, so the world can
   always fall back to the baked farm. Units: metres, in a local frame with
   +x east and +z south (HLIÐARENDI's frame), anchored at the landing point. */
(function () {
'use strict';
const TILE = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const IMG = 'https://server.arcgisonline.com/ArcGis/rest/services/World_Imagery/MapServer/tile';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
const R = 6378137, D2R = Math.PI / 180;
const NET = { ok: true, tiles: 0, osm: 0, img: 0, geocode: 0, failures: [] };

const lon2x = (lon, z) => ((lon + 180) / 360) * 2 ** z;
const lat2y = (lat, z) => ((1 - Math.log(Math.tan(lat * D2R) + 1 / Math.cos(lat * D2R)) / Math.PI) / 2) * 2 ** z;
const pixelMetres = (lat, z) => (156543.03392 * Math.cos(lat * D2R)) / 2 ** z;
function chooseZoom(lat, targetM, max) { for (let z = max; z >= 8; z--) if (pixelMetres(lat, z) >= targetM) return z; return max; }

/** A flat local frame: metres east (x) and south (z) of the anchor. Good to a few centimetres over a few kilometres. */
function proj(lat0, lon0) {
  const kx = R * Math.cos(lat0 * D2R) * D2R, kz = R * D2R;
  return {
    lat0, lon0,
    toLocal: (lat, lon) => ({ x: (lon - lon0) * kx, z: -(lat - lat0) * kz }),
    toWGS: (x, z) => ({ lat: lat0 - z / kz, lon: lon0 + x / kx }),
  };
}

function withTimeout(p, ms, what) {
  return new Promise((ok, no) => { const t = setTimeout(() => no(new Error(what + ' timed out')), ms); p.then(v => { clearTimeout(t); ok(v); }, e => { clearTimeout(t); no(e); }); });
}
function loadImage(url, ms = 12000) {
  return withTimeout(new Promise((ok, no) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = () => no(new Error('image failed: ' + url)); im.src = url; }), ms, 'image');
}
function fail(what, e) { NET.failures.push(what + ': ' + (e && e.message || e)); console.warn('[geo]', what, e && e.message || e); }

/* ───────────────────────── elevation ───────────────────────── */
async function decodeTile(url) {
  const im = await loadImage(url);
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, 256, 256);
  const d = g.getImageData(0, 0, 256, 256).data, out = new Float32Array(256 * 256);
  for (let k = 0, p = 0; k < out.length; k++, p += 4) out[k] = d[p] * 256 + d[p + 1] + d[p + 2] / 256 - 32768;
  return out;
}
/** A square heightfield of n×n samples over spanM metres centred on lat/lon, in absolute metres a.s.l. */
async function fetchElevation({ lat, lon, spanM, n = 257, maxTiles = 16, maxZoom = 14 }) {
  const P = proj(lat, lon), half = spanM / 2;
  const nw = P.toWGS(-half, -half), se = P.toWGS(half, half);
  let z = chooseZoom(lat, spanM / n, maxZoom), x0, x1, y0, y1;
  for (;;) {
    x0 = Math.floor(lon2x(nw.lon, z)); x1 = Math.floor(lon2x(se.lon, z)); y0 = Math.floor(lat2y(nw.lat, z)); y1 = Math.floor(lat2y(se.lat, z));
    if ((x1 - x0 + 1) * (y1 - y0 + 1) <= maxTiles || z <= 8) break; z--;
  }
  const tiles = new Map(), jobs = [];
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) jobs.push(decodeTile(`${TILE}/${z}/${tx}/${ty}.png`).then(px => { tiles.set(tx + ':' + ty, px); NET.tiles++; }, e => fail('tile ' + z + '/' + tx + '/' + ty, e)));
  await Promise.all(jobs);
  if (!tiles.size) return { ok: false };
  const h = new Float32Array(n * n), res = spanM / (n - 1);
  const sample = (la, lo) => {
    const fx = lon2x(lo, z), fy = lat2y(la, z), tx = Math.floor(fx), ty = Math.floor(fy), px = tiles.get(tx + ':' + ty);
    if (!px) return NaN;
    const u = Math.min(254.999, (fx - tx) * 256), v = Math.min(254.999, (fy - ty) * 256), i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
    return (px[j * 256 + i] * (1 - a) + px[j * 256 + i + 1] * a) * (1 - b) + (px[(j + 1) * 256 + i] * (1 - a) + px[(j + 1) * 256 + i + 1] * a) * b;
  };
  let holes = 0, last = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const g = P.toWGS(-half + i * res, -half + j * res); let v = sample(g.lat, g.lon);
    if (!Number.isFinite(v)) { v = last; holes++; } last = v; h[j * n + i] = v;
  }
  const datum = h[((n - 1) / 2 | 0) * n + ((n - 1) / 2 | 0)];
  return { ok: true, n, res, h, datum, lat, lon, z, holes, tiles: tiles.size };
}

/* ───────────────────────── buildings and roads ───────────────────────── */
const ROAD_W = { motorway: 12, trunk: 10, primary: 9, secondary: 8, tertiary: 7, residential: 6, unclassified: 5, service: 4, living_street: 5, pedestrian: 4, footway: 2, path: 1.5, cycleway: 2, track: 3 };
const GUESS_H = { house: 4, residential: 6, apartments: 12, hut: 2.6, shed: 2.6, garage: 2.6, industrial: 8, warehouse: 8, commercial: 7, retail: 6, school: 7, church: 9, roof: 3, cathedral: 20, office: 14, hotel: 15 };
function buildingHeight(tags) {
  const h = parseFloat(tags.height || tags['building:height']); if (Number.isFinite(h) && h > 0) return h;
  const lv = parseFloat(tags['building:levels'] || tags.levels); if (Number.isFinite(lv) && lv > 0) return lv * 3.1;
  return GUESS_H[tags.building] || 5;
}
const overpassQuery = b => `[out:json][timeout:25];(way["building"](${b});relation["building"](${b});way["highway"](${b}););out geom;`;
async function fetchOverpass(bbox) {
  const key = 'world-osm:' + bbox.map(v => v.toFixed(4)).join(',');
  try { const c = localStorage.getItem(key); if (c) return JSON.parse(c); } catch (e) {}
  let lastErr = null;
  for (let round = 0; round < 2; round++) for (const url of MIRRORS) {
    try {
      const r = await withTimeout(fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(overpassQuery(bbox.join(','))), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }), 25000, 'overpass');
      if (r.status === 429 || r.status === 503 || r.status === 504) { lastErr = new Error('busy ' + r.status); continue; }
      if (!r.ok) { lastErr = new Error('http ' + r.status); continue; }
      const j = await r.json();
      try { rememberOSM(key, j); } catch (e) {}
      return j;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('overpass failed');
}
function rememberOSM(key, j) {                     // a small LRU in localStorage: the last 12 windows
  const idxKey = 'world-osm:index'; let idx = []; try { idx = JSON.parse(localStorage.getItem(idxKey) || '[]'); } catch (e) {}
  idx = idx.filter(k => k !== key); idx.push(key);
  while (idx.length > 12) localStorage.removeItem(idx.shift());
  localStorage.setItem(key, JSON.stringify(j)); localStorage.setItem(idxKey, JSON.stringify(idx));
}
/** Buildings (rings in local metres, height in metres) and roads (polylines with a width) inside spanM of lat/lon. */
async function fetchOSM({ lat, lon, spanM, P }) {
  P = P || proj(lat, lon); const half = spanM / 2, nw = P.toWGS(-half, -half), se = P.toWGS(half, half);
  const bbox = [se.lat, nw.lon, nw.lat, se.lon];
  let j; try { j = await fetchOverpass(bbox); NET.osm++; } catch (e) { fail('overpass', e); return { ok: false, buildings: [], roads: [] }; }
  const buildings = [], roads = [];
  const ring = geom => { const r = geom.map(g => P.toLocal(g.lat, g.lon)); if (r.length > 1 && Math.hypot(r[0].x - r[r.length - 1].x, r[0].z - r[r.length - 1].z) < 0.01) r.pop(); return r; };
  for (const el of j.elements || []) {
    const tags = el.tags || {};
    if (el.type === 'way' && tags.building && el.geometry && el.geometry.length >= 4) buildings.push({ id: el.id, ring: ring(el.geometry), h: buildingHeight(tags), kind: tags.building });
    else if (el.type === 'relation' && tags.building && el.members) {
      const h = buildingHeight(tags);
      for (const m of el.members) if (m.role === 'outer' && m.geometry && m.geometry.length >= 4) buildings.push({ id: el.id * 100 + (m.ref % 100), ring: ring(m.geometry), h, kind: tags.building });
    } else if (el.type === 'way' && tags.highway && el.geometry && el.geometry.length >= 2) {
      const w = ROAD_W[tags.highway] || (tags.highway.endsWith('_link') ? 5 : 3);
      roads.push({ id: el.id, pts: el.geometry.map(g => P.toLocal(g.lat, g.lon)), w, kind: tags.highway });
    }
  }
  return { ok: true, buildings, roads, bbox };
}

/* ───────────────────────── imagery ───────────────────────── */
/** Aerial imagery stitched into one canvas; uv(x,z) maps local metres into it. */
async function fetchImagery({ lat, lon, spanM, P, maxTiles = 16, maxZoom = 17 }) {
  P = P || proj(lat, lon); const half = spanM / 2, nw = P.toWGS(-half, -half), se = P.toWGS(half, half);
  let z = maxZoom, x0, x1, y0, y1;
  for (;;) {
    x0 = Math.floor(lon2x(nw.lon, z)); x1 = Math.floor(lon2x(se.lon, z)); y0 = Math.floor(lat2y(nw.lat, z)); y1 = Math.floor(lat2y(se.lat, z));
    if ((x1 - x0 + 1) * (y1 - y0 + 1) <= maxTiles || z <= 10) break; z--;
  }
  const c = document.createElement('canvas'); c.width = (x1 - x0 + 1) * 256; c.height = (y1 - y0 + 1) * 256;
  const g = c.getContext('2d'); g.fillStyle = '#7d8a6a'; g.fillRect(0, 0, c.width, c.height);
  let got = 0;
  await Promise.all(Array.from({ length: (x1 - x0 + 1) * (y1 - y0 + 1) }, (_, k) => {
    const tx = x0 + k % (x1 - x0 + 1), ty = y0 + Math.floor(k / (x1 - x0 + 1));
    return loadImage(`${IMG}/${z}/${ty}/${tx}`).then(im => { g.drawImage(im, (tx - x0) * 256, (ty - y0) * 256, 256, 256); got++; }, e => fail('imagery ' + z + '/' + ty + '/' + tx, e));
  }));
  if (!got) return { ok: false };
  NET.img += got;
  const uv = (x, zz) => { const w = P.toWGS(x, zz); return { u: (lon2x(w.lon, z) - x0) * 256 / c.width, v: 1 - (lat2y(w.lat, z) - y0) * 256 / c.height }; };
  return { ok: true, canvas: c, uv, z, tiles: got };
}

/* ───────────────────────── place names ───────────────────────── */
function parseCoordinates(q) {
  const m = q.replace(/[@()]/g, ' ').match(/(-?\d{1,2}(?:\.\d+)?)\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null; const lat = +m[1], lon = +m[2];
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon, name: `${lat.toFixed(4)}, ${lon.toFixed(4)}` } : null;
}
async function geocode(q) {
  const c = parseCoordinates(q); if (c) return c;
  try {
    const r = await withTimeout(fetch(`${NOMINATIM}?q=${encodeURIComponent(q)}&format=jsonv2&limit=1`, { headers: { Accept: 'application/json' } }), 12000, 'geocode');
    const j = await r.json(); NET.geocode++;
    if (j && j[0]) return { lat: +j[0].lat, lon: +j[0].lon, name: (j[0].display_name || q).split(',').slice(0, 2).join(',') };
  } catch (e) { fail('geocode', e); }
  return null;
}
function locate(ms = 10000) {
  return new Promise(ok => {
    if (!navigator.geolocation) return ok(null);
    const t = setTimeout(() => ok(null), ms);
    navigator.geolocation.getCurrentPosition(p => { clearTimeout(t); ok({ lat: p.coords.latitude, lon: p.coords.longitude, name: 'here' }); }, () => { clearTimeout(t); ok(null); }, { timeout: ms, maximumAge: 600000 });
  });
}

window.Geo = { NET, proj, lon2x, lat2y, pixelMetres, fetchElevation, fetchOSM, fetchImagery, geocode, parseCoordinates, locate, buildingHeight, ROAD_W };
})();
