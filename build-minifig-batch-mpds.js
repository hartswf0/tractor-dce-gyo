#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INTEGRATION_DIR = path.join(ROOT, 'wag-viewer-prime-integration-20251112-055341 copy');
const MINIFIG_LIBRARY_PATH = path.join(INTEGRATION_DIR, 'minifig-library.json');

function loadMinifigLibrary() {
  const raw = fs.readFileSync(MINIFIG_LIBRARY_PATH, 'utf8');
  return JSON.parse(raw);
}

function pickRandom(arr) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickHead(parts) {
  const heads = (parts.heads || []).filter(
    (h) => h.viableStandardHead && h.canonicalHead && h.primary && !h.isHalf
  );
  if (!heads.length) throw new Error('No viable heads found in minifig library.');
  return pickRandom(heads);
}

function pickTorsoAndArms(parts) {
  const torsos = (parts.torsos || []).filter((t) => t.primary && !t.isHalf);
  if (!torsos.length) throw new Error('No torsos found in minifig library.');

  const upperComplete = torsos.filter((t) => t.upperComplete);
  const torsosToUse = upperComplete.length ? upperComplete : torsos;
  const torso = pickRandom(torsosToUse);

  // If torso already has arms+hands, we don't need separate arms.
  if (torso.upperComplete) {
    return { torso, leftArm: null, rightArm: null };
  }

  const arms = (parts.arms || []).filter((a) => a.primary && !a.isHalf);
  const leftArms = arms.filter((a) => a.side === 'left');
  const rightArms = arms.filter((a) => a.side === 'right');

  let leftArm = pickRandom(leftArms);
  let rightArm = pickRandom(rightArms);

  // Fallback to canonical plain arms if needed.
  if (!leftArm) {
    leftArm = { filename: '3818.dat' };
  }
  if (!rightArm) {
    rightArm = { filename: '3819.dat' };
  }

  return { torso, leftArm, rightArm };
}

function pickLower(parts) {
  const legs = (parts.legs || []).filter((l) => l.primary && !l.isHalf);
  const hips = (parts.hips || []).filter((h) => h.primary && !h.isHalf);

  // Prefer full lower-body assemblies first.
  const lowerCompleteLegs = legs.filter((l) => l.lowerComplete);
  if (lowerCompleteLegs.length) {
    return { mode: 'lowerComplete', lower: pickRandom(lowerCompleteLegs) };
  }

  // Otherwise, try to assemble hips + left/right legs, loosely matching color.
  const singles = legs.filter((l) => !l.lowerComplete && (l.side === 'left' || l.side === 'right'));
  const leftLegs = singles.filter((l) => l.side === 'left');
  const rightLegs = singles.filter((l) => l.side === 'right');

  const hipsCandidate = pickRandom(hips);
  const color = hipsCandidate && hipsCandidate.colorName;

  const leftMatch = leftLegs.filter((l) => !color || !l.colorName || l.colorName === color);
  const rightMatch = rightLegs.filter((l) => !color || !l.colorName || l.colorName === color);

  let leftLeg = pickRandom(leftMatch.length ? leftMatch : leftLegs);
  let rightLeg = pickRandom(rightMatch.length ? rightMatch : rightLegs);

  // Fallback to canonical parts if needed.
  if (!hipsCandidate) {
    hipsCandidate = { filename: '3815.dat' };
  }
  if (!leftLeg) {
    leftLeg = { filename: '3816.dat' };
  }
  if (!rightLeg) {
    rightLeg = { filename: '3817.dat' };
  }

  return {
    mode: 'assembly',
    hips: hipsCandidate,
    leftLeg,
    rightLeg
  };
}

function normalizePartFilename(filename) {
  if (!filename) return null;
  if (filename.startsWith('parts/')) return filename;
  return `parts/${filename}`;
}

// Coordinates from MINIFIG-CONFIGURATOR-GUIDE.md (standard standing pose)
const Y_HEAD = -84;
const Y_TORSO = -60;
const Y_ARMS = -51;
const Y_HIPS = -28;
const Y_LEGS = -16;
const ARM_OFFSET_X = 15.552;
const LEG_OFFSET_X = 6;

function buildMinifigSubfileLines(id, spec) {
  const lines = [];
  const subfileName = `auto-minifig-${String(id).padStart(2, '0')}.ldr`;

  lines.push(`0 FILE ${subfileName}`);
  lines.push(`0 Name: Auto Minifig ${id}`);

  const COLOR = 16; // Use 16 = current color so part files carry their own decorated colors.

  // Head
  if (spec.head && spec.head.filename) {
    lines.push(
      `1  ${COLOR}    0  ${Y_HEAD}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
        spec.head.filename
      )}`
    );
  }

  // Torso
  if (spec.torso && spec.torso.filename) {
    lines.push(
      `1  ${COLOR}    0  ${Y_TORSO}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
        spec.torso.filename
      )}`
    );
  }

  // Arms (only if not provided by torso)
  if (spec.leftArm && spec.leftArm.filename) {
    lines.push(
      `1  ${COLOR}  -${ARM_OFFSET_X}  ${Y_ARMS}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
        spec.leftArm.filename
      )}`
    );
  }
  if (spec.rightArm && spec.rightArm.filename) {
    lines.push(
      `1  ${COLOR}   ${ARM_OFFSET_X}  ${Y_ARMS}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
        spec.rightArm.filename
      )}`
    );
  }

  // Lower body
  if (spec.lowerMode === 'lowerComplete') {
    lines.push(
      `1  ${COLOR}    0  ${Y_HIPS}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
        spec.lower.filename
      )}`
    );
  } else {
    if (spec.hips && spec.hips.filename) {
      lines.push(
        `1  ${COLOR}    0  ${Y_HIPS}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
          spec.hips.filename
        )}`
      );
    }
    if (spec.leftLeg && spec.leftLeg.filename) {
      lines.push(
        `1  ${COLOR}   -${LEG_OFFSET_X}  ${Y_LEGS}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
          spec.leftLeg.filename
        )}`
      );
    }
    if (spec.rightLeg && spec.rightLeg.filename) {
      lines.push(
        `1  ${COLOR}    ${LEG_OFFSET_X}  ${Y_LEGS}    0    1  0  0    0  1  0    0  0  1    ${normalizePartFilename(
          spec.rightLeg.filename
        )}`
      );
    }
  }

  lines.push('0 NOFILE');
  lines.push('');

  return { subfileName, lines };
}

function positionForIndex(idx, perRow = 5, spacing = 80) {
  const row = Math.floor(idx / perRow);
  const col = idx % perRow;
  const x = (col - Math.floor(perRow / 2)) * spacing;
  const z = (row - Math.floor(perRow / 2)) * spacing;
  return { x, z };
}

function buildBatchMPD(batchIndex = 1, count = 25) {
  const library = loadMinifigLibrary();
  const parts = library.parts || {};

  const batchName = `minifig-batch-${String(batchIndex).padStart(2, '0')}.mpd`;
  const lines = [];

  lines.push(`0 FILE ${batchName}`);
  lines.push(`0 Name: Procedural Minifig Batch ${batchIndex}`);
  lines.push('0 Author: Grace Minifig Generator');
  lines.push('0 BFC CERTIFY CCW');
  lines.push('');
  lines.push('0 MAIN SCENE - Procedural Minifig Batch');

  const COLOR = 16;

  const subfiles = [];

  for (let i = 0; i < count; i++) {
    const head = pickHead(parts);
    const { torso, leftArm, rightArm } = pickTorsoAndArms(parts);
    const lowerSpec = pickLower(parts);

    const spec = {
      head,
      torso,
      leftArm,
      rightArm,
      lowerMode: lowerSpec.mode,
      lower: lowerSpec.lower,
      hips: lowerSpec.hips,
      leftLeg: lowerSpec.leftLeg,
      rightLeg: lowerSpec.rightLeg
    };

    const id = batchIndex * 100 + (i + 1);
    const { subfileName, lines: subfileLines } = buildMinifigSubfileLines(id, spec);
    subfiles.push({ subfileName, lines: subfileLines });

    const { x, z } = positionForIndex(i);
    lines.push(
      `1  ${COLOR}  ${x}    0  ${z}    1  0  0    0  1  0    0  0  1    ${subfileName}`
    );
  }

  lines.push('0 STEP');
  lines.push('0 NOFILE');
  lines.push('');

  // Append all subfiles
  for (const sf of subfiles) {
    lines.push(...sf.lines);
  }

  const outPath = path.join(ROOT, batchName);
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`✅ Minifig batch generated → ${path.relative(ROOT, outPath)}  (minifigs: ${count})`);
}

if (require.main === module) {
  const batchIndex = process.argv[2] ? parseInt(process.argv[2], 10) : 1;
  const count = process.argv[3] ? parseInt(process.argv[3], 10) : 25;
  buildBatchMPD(batchIndex, count);
}
