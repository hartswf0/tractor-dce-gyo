#!/usr/bin/env node
/* odyssey/cascade/tools/beflix_ops.mjs — one picture per BEFLIX operator, for the page: each node of the machine applied alone to
   the same Halfworld plate (Odysseus close, straining) and photographed in the BEFLIX cells look. A throwaway graph is written
   beside the project's (.ops.cascade), cooked once per operator with cascade run --node, and removed.
   Writes media/beflix-op-<op>.png (504 x 368). */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const here = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const plate = { bank: { path: 'assets/beflix/plates/cu_odysseus.json', mediaType: 'application/json' }, layer: 'cu_odysseus', states: 'straining' };
const OPS = [
  ['plate', 'project.BxPlate', null, {}],
  ['paint', 'project.BxPaint', 'field', { region: [150, 20, 240, 110], shape: 'ellipse', level: 7, mode: 'invert' }],
  ['line', 'project.BxLine', 'field', { from: [4, 4], to: [150, 110], rays: 6, spread: 150, dash: 9, level: 7, mode: 'set', width: 2 }],
  ['text', 'project.BxText', 'field', { text: 'LOOSE ME', position: [126, 120], size: 3, level: 7, mode: 'xor', reveal: 'all' }],
  ['shift', 'project.BxShift', 'field', { offset: [60, 0], region: [0, 40, 252, 100], wrap: true }],
  ['zoom', 'project.BxZoom', 'field', { centre: [80, 50], factor: 3 }],
  ['expand', 'project.BxExpand', 'field', { mode: 'expand', steps: 2 }],
  ['shrink', 'project.BxExpand', 'field', { mode: 'shrink', steps: 2 }],
  ['copy', 'project.BxCopy', 'field', { from: [48, 18, 110, 80], to: [150, 90], scale: 1.4, border: 7, repeat: 1 }],
  ['dissolve', 'project.BxDissolve', 'a', { amount: 0.5, field: 'radial', centre: [80, 50] }],
  ['poem', 'project.BxPoemField', 'field', { text: 'COME HERE FAR-FAMED ODYSSEUS GREAT GLORY OF THE ACHAEANS', origin: [-40, 40], direction: 15, spread: 60, time: 14, speed: 12, spacing: 22, gap: 10, size: 2, bands: 0.5, flicker: 0 }],
];
const nodes = [{ id: 'paper', module: 'project.BxMosaic', position: [0, 0], source: 'project' },
  { id: 'src', module: 'project.BxPlate', position: [200, 0], source: 'project', props: plate }];
const conns = [[['paper', 0, 'mosaic'], ['src', 0, 'field']]];
OPS.forEach(([name, mod, port, props], k) => {
  const id = 'op_' + name, cam = 'cam_' + name;
  if (mod === 'project.BxPlate') nodes.push({ id, module: 'project.BxZoom', position: [400, k * 120], source: 'project', props: { factor: 1 } });
  else nodes.push({ id, module: mod, position: [400, k * 120], source: 'project', props });
  conns.push([['src', 0, 'mosaic'], [id, 0, port || 'field']]);
  if (name === 'dissolve') conns.push([['paper', 0, 'mosaic'], [id, 0, 'b']]);
  nodes.push({ id: cam, module: 'project.BxCamera', position: [640, k * 120], source: 'project', props: { mode: 'cells', cell: 2, grid: 0.1 } });
  conns.push([[id, 0, 'mosaic'], [cam, 0, 'field']]);
});
const file = path.join(here, '.ops.cascade');
fs.writeFileSync(file, JSON.stringify({ version: '0.2', metadata: { name: 'BEFLIX operators' }, nodes, connections: conns, annotations: [] }));
try {
  for (const [name] of OPS) {
    const out = `renders/ops/${name}`;
    const res = execFileSync(process.execPath, [path.join(here, 'tools/cascade.mjs'), 'run', '.ops.cascade', '--frames', '1', '--json', '--timeout', '120000', '--out', out, '--node', 'cam_' + name], { cwd: here, encoding: 'utf8' });
    const m = JSON.parse(res.trim().split('\n').reverse().find(l => l.startsWith('{')));
    fs.copyFileSync(path.join(here, m.files[0]), path.join(here, `media/beflix-op-${name}.png`));
    console.log(name, 'ok');
  }
} finally { fs.rmSync(file, { force: true }); }
