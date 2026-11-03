#!/usr/bin/env node
/**
 * Compiles compact, self-contained LDraw 3D payloads for:
 *   1. Workspace bundle: achilles/worldtext-bundle.js (used by achilles-forage.html & achilles-kit.html for zero-server file:// support)
 *   2. Per-zone & full-world payloads in achilles/portals-data.json so interactive Generative UI artifacts can be built.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const LD = path.join(ROOT, 'ldraw');
const ACH = path.join(ROOT, 'achilles');

function fileFor(ref) {
  const id = String(ref || '').trim().replace(/\\/g, '/').toLowerCase().replace(/\.dat$/, '').replace(/^parts\//, '').replace(/^p\//, '');
  const tries = id.startsWith('s/')
    ? [['parts', id]]
    : (id.startsWith('48/') || id.startsWith('8/'))
      ? [['p', id]]
      : [['parts', id], ['p', id], ['parts', 's/' + id]];
  for (const [dir, rel] of tries) {
    const f = path.join(LD, dir, rel + '.dat');
    if (fs.existsSync(f)) return f;
  }
  return null;
}

function mm(a, b) {
  return [
    a[0] + a[3] * b[0] + a[4] * b[1] + a[5] * b[2],
    a[1] + a[6] * b[0] + a[7] * b[1] + a[8] * b[2],
    a[2] + a[9] * b[0] + a[10] * b[1] + a[11] * b[2],
    a[3] * b[3] + a[4] * b[6] + a[5] * b[9], a[3] * b[4] + a[4] * b[7] + a[5] * b[10], a[3] * b[5] + a[4] * b[8] + a[5] * b[11],
    a[6] * b[3] + a[7] * b[6] + a[8] * b[9], a[6] * b[4] + a[7] * b[7] + a[8] * b[10], a[6] * b[5] + a[7] * b[8] + a[8] * b[11],
    a[9] * b[3] + a[10] * b[6] + a[11] * b[9], a[9] * b[4] + a[10] * b[7] + a[11] * b[10], a[9] * b[5] + a[10] * b[8] + a[11] * b[11]
  ];
}

function mv(m, v) {
  return [
    m[0] + m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[1] + m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
    m[2] + m[9] * v[0] + m[10] * v[1] + m[11] * v[2]
  ];
}

const STUD_TOP_RE = /^(stud|stud2|stud2a|studa|studel)\.dat$/;

function classifyShape(partId) {
  if (/^(50990a|44375a|3960|4740|3846)$/.test(partId)) return 'dish';
  if (/^(3062b|6141|30361c|6255)$/.test(partId)) return 'cyl';
  if (/^(4589b|98100)$/.test(partId)) return 'cone';
  if (/^(93273|3039|3040b|85984|54200|85970|60481)$/.test(partId)) return 'slope';
  if (/^(3659|6182|60596)$/.test(partId)) return 'arch';
  if (/^3626b/.test(partId)) return 'head';
  if (/^(3901|30171)$/.test(partId)) return 'hair';
  if (/^973/.test(partId)) return 'torso';
  if (partId === '3815') return 'hips';
  if (/^381[67]$/.test(partId)) return 'leg';
  if (/^381[89]$/.test(partId)) return 'arm';
  if (partId === '64452') return 'ox';
  if (partId === '64847') return 'horn';
  if (partId === '95341') return 'sheep';
  if (partId === '92586') return 'dog';
  if (partId === '10509') return 'horse';
  if (partId === '14734' || partId === '30274') return 'lion';
  if (partId === '3959') return 'torch';
  if (partId === '2343') return 'goblet';
  if (partId === '4523') return 'basket';
  if (partId === '11609') return 'star';
  if (partId === '3778' || partId === '3470') return 'tree';
  if (/^(37341d|95049|95050|55295|3849|30173a)$/.test(partId)) return 'tool';
  return 'box';
}

function analyzePart(partId) {
  let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
  const studs = [];
  function walk(ref, xf, depth) {
    if (depth > 9) return;
    const low = String(ref || '').trim().replace(/\\/g, '/').toLowerCase();
    const base = path.basename(low);
    if (STUD_TOP_RE.test(base)) {
      studs.push([Math.round(xf[0]), Math.round(xf[1]), Math.round(xf[2])]);
      return;
    }
    const f = fileFor(low);
    if (!f) return;
    for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const t = line.trim().split(/\s+/);
      if (t[0] === '1' && t.length >= 15) {
        walk(t.slice(14).join(' '), mm(xf, [+t[2], +t[3], +t[4], +t[5], +t[6], +t[7], +t[8], +t[9], +t[10], +t[11], +t[12], +t[13]]), depth + 1);
      } else if ((t[0] === '3' || t[0] === '4') && t.length >= 11) {
        const pts = t[0] === '3'
          ? [[+t[2], +t[3], +t[4]], [+t[5], +t[6], +t[7]], [+t[8], +t[9], +t[10]]]
          : [[+t[2], +t[3], +t[4]], [+t[5], +t[6], +t[7]], [+t[8], +t[9], +t[10]], [+t[11], +t[12], +t[13]]];
        for (const p of pts) {
          const w = mv(xf, p);
          if (w[0] < x0) x0 = w[0]; if (w[0] > x1) x1 = w[0];
          if (w[1] < y0) y0 = w[1]; if (w[1] > y1) y1 = w[1];
          if (w[2] < z0) z0 = w[2]; if (w[2] > z1) z1 = w[2];
        }
      }
    }
  }
  walk(partId, [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], 0);
  if (x0 > x1) { x0 = -10; y0 = -24; z0 = -10; x1 = 10; y1 = 0; z1 = 10; }
  return {
    k: classifyShape(partId),
    b: [Math.round(x0), Math.round(y0), Math.round(z0), Math.round(x1), Math.round(y1), Math.round(z1)],
    s: studs
  };
}

function main() {
  const forage = JSON.parse(fs.readFileSync(path.join(ACH, 'forage.json'), 'utf8'));
  const packFiles = fs.readdirSync(path.join(ACH, 'packs'));
  const partDefs = {};
  for (const f of packFiles) {
    const pid = f.replace(/\.json$/, '').replace(/_/g, '/');
    partDefs[pid] = analyzePart(pid);
  }

  const mpds = {};
  const previs = {};
  for (const c of forage.cards) {
    mpds[c.id] = fs.readFileSync(path.join(ACH, 'cards', c.id + '.mpd'), 'utf8');
    const pFile = path.join(ACH, 'previs', c.id + '.json');
    if (fs.existsSync(pFile)) {
      previs[c.id] = JSON.parse(fs.readFileSync(pFile, 'utf8'));
    }
  }

  // Write workspace bundle achilles/worldtext-bundle.js for zero-server file:// support
  const bundleObj = { forage, partDefs, mpds, previs };
  fs.writeFileSync(
    path.join(ACH, 'worldtext-bundle.js'),
    `window.ACHILLES_WORLDTEXT_BUNDLE = ${JSON.stringify(bundleObj)};\n`
  );

  console.log('Wrote achilles/worldtext-bundle.js (' + (fs.statSync(path.join(ACH, 'worldtext-bundle.js')).size / 1024).toFixed(1) + ' KB)');
}

main();
