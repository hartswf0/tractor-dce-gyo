#!/usr/bin/env node
/**
 * LDRAW RESOLVE MAP BUILDER
 *
 * THREE.LDrawLoader finds a referenced sub-file by trial and error: it requests
 * the name as-is, then under parts/, then p/, then models/, then relative. On a
 * static host like GitHub Pages every miss is a real 404 round-trip, so a single
 * model can fire several hundred failed requests before it finishes.
 *
 * The loader will skip all of that for any name present in its fileMap
 * (see setFileMap / scope.fileMap in examples/js/loaders/LDrawLoader.js).
 *
 * This script emits that map for the two cases the loader cannot shortcut:
 *   - p/*.dat    primitives referenced bare  ("stud.dat"   -> "p/stud.dat")
 *   - p/8/*.dat  low-res primitives          ("8/4-4cyli.dat" -> "p/8/4-4cyli.dat")
 *
 * p/48/* and parts/s/* are already handled by the loader's built-in prefix
 * rules, and parts/*.dat resolves on the loader's second attempt, so none of
 * them need an entry.
 *
 * Outputs: ldraw-resolve-map.json
 */

const fs = require('fs');
const path = require('path');

const LDRAW_DIR = path.join(__dirname, 'ldraw');
const OUTPUT    = path.join(__dirname, 'ldraw-resolve-map.json');

function addDir(map, dirRel, keyPrefix) {
  const dir = path.join(LDRAW_DIR, dirRel);
  if (!fs.existsSync(dir)) {
    console.warn('skip (missing):', dirRel);
    return 0;
  }
  let n = 0;
  for (const file of fs.readdirSync(dir)) {
    if (!file.toLowerCase().endsWith('.dat')) continue;
    const target = dirRel + '/' + file;
    // Register the on-disk spelling and its lowercase form: LDraw references
    // are case-insensitive, but a static host is not.
    for (const key of new Set([keyPrefix + file, (keyPrefix + file).toLowerCase()])) {
      if (!map[key]) { map[key] = target; n++; }
    }
  }
  return n;
}

function main() {
  const map = {};
  const a = addDir(map, 'p',   '');
  const b = addDir(map, 'p/8', '8/');
  fs.writeFileSync(OUTPUT, JSON.stringify(map), 'utf8');
  const bytes = fs.statSync(OUTPUT).size;
  console.log(`p/    entries: ${a}`);
  console.log(`p/8/  entries: ${b}`);
  console.log(`total keys:    ${Object.keys(map).length}`);
  console.log(`written:       ${path.relative(process.cwd(), OUTPUT)} (${(bytes/1024).toFixed(1)} KB)`);
}

main();
