/* project.Bricks — cells on the LEGO grid (points at cell centres, kit LDU, with Cd) drawn as the plates they become, seen from an
   azimuth and an elevation: three faces of each 1x1 plate and its stud, shaded, painter-sorted. The supports the kit needs (the
   column under each cell, down to the base) can be drawn in grey. 2D polygons with a primitive Cd, for Plot. Not a renderer: a
   drawing of boxes, which is what the player can show while Cascade's scene view is wireframe only. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { attr, pointAt, PLATE, STUD, view, type V3 } from '../../lib/geo';

export const definition = {
  apiVersion: 1,
  label: 'Bricks',
  description: 'Cells drawn as 1x1 plates with studs (three faces, shaded), from an azimuth and elevation; optional grey supports.',
  icon: 'Box',
  runsOn: 'portable',
  inputs: { cells: { kind: 'data', type: 'geometry' } },
  props: {
    azimuth: { type: 'float', default: 35, min: -180, max: 180, step: 1 },
    elevation: { type: 'float', default: 30, min: -90, max: 90, step: 1 },
    supports: { type: 'bool', default: true, label: 'Draw the supports' },
    support: { type: 'color', default: [0.63, 0.65, 0.64, 1], label: 'Support colour' },
    studs: { type: 'bool', default: true }
  },
  outputs: { geometry: { kind: 'data', type: 'geometry' }, pieces: { kind: 'data', type: 'int' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const g = context.inputs.cells, { azimuth: az, elevation: el } = context.props;
  const boxes = new Map<string, { c: V3; col: number[] }>();
  const key = (c: V3) => `${Math.round(c[0] / STUD)},${Math.round((c[1] - PLATE / 2) / PLATE)},${Math.round(c[2] / STUD)}`;
  if (g) for (let i = 0; i < g.pointCount; i++) { const c = pointAt(g, i); boxes.set(key(c), { c, col: attr(g, 'point', 'Cd', i) || [0.2, 0.2, 0.2, 1] }); }
  if (context.props.supports && g) {
    const top = new Map<string, number>();
    for (const k of boxes.keys()) { const [i, lv, j] = k.split(',').map(Number); const q = i + ',' + j; top.set(q, Math.max(top.get(q) ?? -1, lv)); }
    for (const [q, t] of top) { const [i, j] = q.split(',').map(Number);
      for (let lv = 0; lv < t; lv++) { const k = `${i},${lv},${j}`; if (!boxes.has(k)) boxes.set(k, { c: [i * STUD, lv * PLATE + PLATE / 2, j * STUD], col: context.props.support.slice() }); } }
  }
  const list = [...boxes.values()].map(b => ({ ...b, d: view(b.c, az, el)[2] })).sort((a, b) => a.d - b.d);
  const out = new GeometryBuilder({ positionSize: 2 }), cd: number[] = [];
  const hx = STUD / 2, hy = PLATE / 2;
  const faces: [V3, V3[]][] = [
    [[0, 1, 0], [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]]], [[0, -1, 0], [[-1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, -1, -1]]],
    [[1, 0, 0], [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]]], [[-1, 0, 0], [[-1, -1, -1], [-1, 1, -1], [-1, 1, 1], [-1, -1, 1]]],
    [[0, 0, 1], [[-1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]]],
  ];
  const light: V3 = [0.45, 0.8, 0.4];
  const shade = (col: number[], n: V3) => { const k = 0.55 + 0.45 * Math.max(0, n[0] * light[0] + n[1] * light[1] + n[2] * light[2]); return [col[0] * k, col[1] * k, col[2] * k, col[3] ?? 1]; };
  const poly = (pts: V3[], col: number[]) => { const flat: number[] = []; for (const p of pts) { const v = view(p, az, el); flat.push(v[0], v[1]); } out.addPolygon(flat, { closed: true }); cd.push(...col); };
  for (const b of list) {
    for (const [n, corners] of faces) {
      if (view(n, az, el)[2] <= 1e-6) continue;
      poly(corners.map(q => [b.c[0] + q[0] * hx, b.c[1] + q[1] * hy, b.c[2] + q[2] * hx] as V3), shade(b.col, n));
    }
    if (context.props.studs && view([0, 1, 0], az, el)[2] > 1e-6) {
      const ring = (y: number) => Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return [b.c[0] + Math.cos(a) * 6, y, b.c[2] + Math.sin(a) * 6] as V3; });
      const y0 = b.c[1] + hy, y1 = y0 + 3.4;
      /* the stud's side as a band, then its top */
      const lo = ring(y0), hi = ring(y1), side: V3[] = [];
      const vis = lo.map(p => view([p[0] - b.c[0], 0, p[2] - b.c[2]], az, el)[2]);
      for (let i = 0; i < 14; i++) if (vis[i] >= 0) side.push(hi[i]);
      for (let i = 13; i >= 0; i--) if (vis[i] >= 0) side.push(lo[i]);
      if (side.length > 2) poly(side, shade(b.col, [0.7, 0, 0.7]));
      poly(hi, shade(b.col, [0, 1, 0]).map((v, i) => i < 3 ? Math.min(1, v * 1.08) : v));
    }
  }
  if (cd.length) out.setNumericAttribute('primitive', 'Cd', cd, 4);
  context.outputs.geometry.set(out.build());
  context.outputs.pieces.set(boxes.size);
}
