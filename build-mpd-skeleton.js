#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INTEGRATION_DIR = path.join(ROOT, 'wag-viewer-prime-integration-20251112-055341 copy');
const PART_SKELETONS_PATH = path.join(INTEGRATION_DIR, 'ldraw-part-skeletons.json');

const STUD_PITCH = 20; // LDU
const PLATE_HEIGHT = 8; // LDU

function usage() {
  console.error('Usage: node build-mpd-skeleton.js <path/to/scene.mpd>');
}

function parseType1Lines(mpdText) {
  const lines = mpdText.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('0')) continue;

    const firstChar = trimmed.charAt(0);
    if (firstChar !== '1') continue;

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 15) continue;

    const color = Number(tokens[1]);
    const x = Number(tokens[2]);
    const y = Number(tokens[3]);
    const z = Number(tokens[4]);

    const a = Number(tokens[5]);
    const b = Number(tokens[6]);
    const c = Number(tokens[7]);
    const d = Number(tokens[8]);
    const e = Number(tokens[9]);
    const f = Number(tokens[10]);
    const g = Number(tokens[11]);
    const h = Number(tokens[12]);
    const iMat = Number(tokens[13]);

    const partId = tokens[14];

    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) continue;

    out.push({
      lineNum: i,
      raw,
      color,
      x, y, z,
      a, b, c, d, e, f, g, h, i: iMat,
      partId
    });
  }

  return out;
}

function buildSkeletonForScene(mpdPathAbs, mpdText, partSkeletons) {
  const type1Lines = parseType1Lines(mpdText);

  const byFilename = new Map();
  for (const entry of (partSkeletons.parts || [])) {
    if (!entry || !entry.filename) continue;
    byFilename.set(entry.filename.toLowerCase(), entry);
  }

  const linesOut = [];

  for (const line of type1Lines) {
    const filename = path.basename(line.partId || '').toLowerCase();
    const partEntry = byFilename.get(filename) || null;

    const studsOut = [];

    if (partEntry && partEntry.skeleton && Array.isArray(partEntry.skeleton.studs)) {
      for (const stud of partEntry.skeleton.studs) {
        if (!stud) continue;
        const lx = Number(stud.x) || 0;
        const ly = Number(stud.y) || 0;
        const lz = Number(stud.z) || 0;

        const wx = line.a * lx + line.b * ly + line.c * lz + line.x;
        const wy = line.d * lx + line.e * ly + line.f * lz + line.y;
        const wz = line.g * lx + line.h * ly + line.i * lz + line.z;

        const gx = Math.round(wx / STUD_PITCH);
        const gz = Math.round(wz / STUD_PITCH);
        const layerIndex = Math.round(wy / PLATE_HEIGHT);
        const layerY = layerIndex * PLATE_HEIGHT;

        studsOut.push({
          role: stud.role || null,
          local: { x: lx, y: ly, z: lz },
          world: { x: wx, y: wy, z: wz },
          gridX: gx,
          gridZ: gz,
          layer: layerIndex,
          layerY
        });
      }
    }

    linesOut.push({
      lineNum: line.lineNum,
      raw: line.raw,
      partId: line.partId,
      color: line.color,
      studs: studsOut
    });
  }

  const payload = {
    generated: new Date().toISOString(),
    sourceMpd: path.relative(ROOT, mpdPathAbs),
    partSkeletonsSource: path.relative(ROOT, PART_SKELETONS_PATH),
    studPitch: STUD_PITCH,
    plateHeight: PLATE_HEIGHT,
    totalLines: linesOut.length,
    lines: linesOut
  };

  return payload;
}

function main() {
  const mpdArg = process.argv[2];
  if (!mpdArg) {
    usage();
    process.exit(1);
  }

  const mpdPathAbs = path.resolve(ROOT, mpdArg);
  if (!fs.existsSync(mpdPathAbs)) {
    console.error('MPD file not found:', mpdPathAbs);
    process.exit(1);
  }

  const mpdText = fs.readFileSync(mpdPathAbs, 'utf8');

  if (!fs.existsSync(PART_SKELETONS_PATH)) {
    console.error('Part skeleton registry not found at', PART_SKELETONS_PATH);
    console.error('Run: node build-part-skeletons.js');
    process.exit(1);
  }

  const partSkeletonsRaw = fs.readFileSync(PART_SKELETONS_PATH, 'utf8');
  const partSkeletons = JSON.parse(partSkeletonsRaw);

  const skeleton = buildSkeletonForScene(mpdPathAbs, mpdText, partSkeletons);

  const mpdDir = path.dirname(mpdPathAbs);
  const base = path.basename(mpdPathAbs, path.extname(mpdPathAbs));
  const outPath = path.join(mpdDir, base + '_skeletons.json');

  fs.writeFileSync(outPath, JSON.stringify(skeleton, null, 2), 'utf8');

  console.log('✅ Scene skeleton written to', outPath);
  console.log('   Type-1 lines processed:', skeleton.totalLines);
}

main();
