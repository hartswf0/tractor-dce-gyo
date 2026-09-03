#!/usr/bin/env node
/**
 * SKELETON BACKFILL
 *
 * ldraw-part-skeletons.json already had the right shape — 23,511 entries, each
 * with `skeleton: { studs: [], ports: [] }` — and every one of them was empty.
 * assembly-line.html worked around that with `studLibrary`, a hand-written
 * table of six parts, which disagrees with the geometry where it is checkable:
 * it gives Tile 1x2 Grille two studs (tiles have none) and Panel 1x4 two studs
 * at a z-offset (it has four along x).
 *
 * This fills the registry from the ports extracted out of the real library, in
 * the schema the spec asked for — bounds, ports, collision hull — so weaver and
 * nabugo read the same numbers instead of keeping two answers.
 *
 * Reads:  nabugo-parts.json, nabugo-ports.json
 * Writes: ldraw-part-skeletons.json (in place, preserving unfilled entries)
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SKEL = path.join(ROOT, 'wag-viewer-prime-integration-20251112-055341 copy', 'ldraw-part-skeletons.json');
const AXES = [[1,0,0], [-1,0,0], [0,1,0], [0,-1,0], [0,0,1], [0,0,-1]];

function main() {
  const cat   = JSON.parse(fs.readFileSync(path.join(ROOT, 'nabugo-parts.json'), 'utf8'));
  const ports = JSON.parse(fs.readFileSync(path.join(ROOT, 'nabugo-ports.json'), 'utf8')).map;
  const skel  = JSON.parse(fs.readFileSync(SKEL, 'utf8'));

  const box = new Map(cat.parts.map(p => [p.id, p.b]));
  let filled = 0, bounded = 0;

  for (const entry of skel.parts) {
    const id = entry.filename.replace(/\.dat$/i, '');
    const b = box.get(id);
    if (b) {
      entry.bounds = { min: [b[0], b[1], b[2]], max: [b[3], b[4], b[5]] };
      entry.collision_hulls = [{ type: 'box',
        size: [ +(b[3]-b[0]).toFixed(1), +(b[4]-b[1]).toFixed(1), +(b[5]-b[2]).toFixed(1) ],
        center: [ +((b[0]+b[3])/2).toFixed(1), +((b[1]+b[4])/2).toFixed(1), +((b[2]+b[5])/2).toFixed(1) ] }];
      bounded++;
    }
    const ps = ports[id];
    if (!ps) continue;
    entry.skeleton.studs = ps.filter(p => p[0] === 0)
      .map(p => ({ x: p[1], y: p[2], z: p[3] }));
    entry.skeleton.ports = ps.map(p => ({
      type: p[0] === 0 ? 'stud' : 'antistud',
      position: [p[1], p[2], p[3]],
      direction: AXES[p[4]]
    }));
    filled++;
  }

  skel.generated = new Date().toISOString();
  skel.source = 'backfilled by build-skeleton-backfill.js from nabugo-ports.json';
  skel.note = 'studs/ports are extracted from the vendored ldraw/ tree by recursive matrix ' +
              'resolution of stud primitives. LDU, Y-down; direction -Y points up. Parts with ' +
              'more than 48 ports are omitted and their lattice is synthesisable from bounds.';
  skel.filled = filled;

  fs.writeFileSync(SKEL, JSON.stringify(skel), 'utf8');
  console.log('entries        :', skel.parts.length);
  console.log('bounds filled  :', bounded);
  console.log('skeletons filled:', filled);
  console.log('written        :', path.relative(process.cwd(), SKEL),
              '(' + (fs.statSync(SKEL).size / 1048576).toFixed(1) + ' MB)');
}
main();
