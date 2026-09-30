#!/usr/bin/env node
/* odyssey/cascade/tools/build.mjs — build every graph in graphs.json into a static player, players/<name>/ (cascade build needs a new
   directory, so the old one is removed first). Run from odyssey/cascade: node tools/build.mjs [name ...] */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { graphs } = JSON.parse(fs.readFileSync(path.join(here, 'graphs.json'), 'utf8'));
const want = process.argv.slice(2);
const cli = path.join(here, 'node_modules/cascade/dist/cli/index.js');
for (const g of graphs) {
  if (want.length && !want.includes(g.name)) continue;
  if (g.player === false) continue;   /* the rig desk's graphs are opened in Studio, not played on the page */
  const out = path.join(here, 'players', g.name);
  fs.rmSync(out, { recursive: true, force: true });
  execFileSync(process.execPath, [cli, 'build', g.graph, '--out', path.relative(here, out)], { cwd: here, stdio: 'inherit' });
  let bytes = 0; const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); const s = fs.statSync(p); if (s.isDirectory()) walk(p); else bytes += s.size; } }; walk(out);
  console.log(`${g.name}: ${(bytes / 1024).toFixed(0)} KB`);
}
