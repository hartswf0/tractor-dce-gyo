/* project.StudGrid — quantizes a 3D trail (LDU, y up) to the LEGO grid at a kit scale: a stud (20 LDU) across, a plate (8) up.
   Every cell the trail passes through, in the order it first arrives; the cells as points at their centres (in kit LDU, coloured by
   the time of first arrival), as an object, and as a JSON asset (`gesture-cells.json`) the offline kit step builds in real parts. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { encodeJson, rampAt } from '../../lib/choreo';
import { attr, pointAt, primPoints, PLATE, STUD, type V3 } from '../../lib/geo';

export const definition = {
  apiVersion: 1,
  label: 'Stud Grid',
  description: 'Quantize a 3D trail to studs across and plates up, at a kit scale. Cells in order of first arrival.',
  icon: 'Grid3x3',
  runsOn: 'portable',
  capabilities: ['assets'],
  inputs: { trail: { kind: 'data', type: 'geometry' } },
  props: {
    scale: { type: 'float', default: 1, min: 0.25, max: 8, step: 0.25, label: 'Kit scale (1: the minifigure\'s own)' },
    minRun: { type: 'int', default: 1, min: 1, max: 12, label: 'Keep cells the hand stays in for at least N samples' },
    filename: { type: 'string', default: 'gesture-cells.json' }
  },
  outputs: {
    cells: { kind: 'data', type: 'geometry' },
    trail: { kind: 'data', type: 'geometry' },
    data: { kind: 'data', type: 'object' },
    asset: { kind: 'data', type: 'asset' }
  }
} as const satisfies NodeDefinition;

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const g = context.inputs.trail, s = context.props.scale;
  const order: string[] = [], first = new Map<string, number>(), hits = new Map<string, number>();
  const scaled = new GeometryBuilder({ positionSize: 3 });
  let t0 = Infinity, t1 = -Infinity;
  if (g) for (let i = 0; i < g.pointCount; i++) { const t = (attr(g, 'point', 't', i) || [i])[0]; t0 = Math.min(t0, t); t1 = Math.max(t1, t); }
  const visit = (v: V3, t: number) => {
    const key = `${Math.round(v[0] / STUD)},${Math.round(v[2] / STUD)},${Math.max(0, Math.floor(v[1] / PLATE))}`;
    if (!first.has(key)) { first.set(key, t); order.push(key); }
    hits.set(key, (hits.get(key) || 0) + 1);
  };
  if (g) {
    for (let i = 0; i < g.pointCount; i++) { const v = pointAt(g, i); scaled.addPoint(v[0] * s, v[1] * s, v[2] * s); }
    for (let p = 0; p < g.primitiveCount; p++) {
      const pts = primPoints(g, p); const ids: number[] = [];
      for (let q = 0; q < pts.length; q++) {
        ids.push(pts[q]);
        if (q === 0) continue;
        const a = pointAt(g, pts[q - 1]).map(x => x * s) as V3, b = pointAt(g, pts[q]).map(x => x * s) as V3;
        const ta = (attr(g, 'point', 't', pts[q - 1]) || [0])[0], tb = (attr(g, 'point', 't', pts[q]) || [0])[0];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / (PLATE / 3)));   /* no cell skipped between samples */
        for (let k = q === 1 ? 0 : 1; k <= n; k++) { const u = k / n; visit([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u], ta + (tb - ta) * u); }
      }
      scaled.addPrimitive(ids);
    }
  }
  const keep = order.filter(k => (hits.get(k) || 0) >= context.props.minRun);
  const cells = keep.map(k => k.split(',').map(Number));
  /* the kit's own coordinates are centred on the origin, stud-aligned; the geometry stays where the trail is */
  const is = cells.map(c => c[0]), js = cells.map(c => c[1]);
  const ci = cells.length ? Math.round((Math.min(...is) + Math.max(...is)) / 2) : 0, cj = cells.length ? Math.round((Math.min(...js) + Math.max(...js)) / 2) : 0;
  const b = new GeometryBuilder({ positionSize: 3 }), cd: number[] = [], tt: number[] = [], out: number[][] = [];
  keep.forEach((k, n) => {
    const [i, j, lv] = cells[n], u = t1 > t0 ? ((first.get(k) as number) - t0) / (t1 - t0) : 0, c = rampAt(u);
    b.addPoint(i * STUD, lv * PLATE + PLATE / 2, j * STUD); cd.push(c[1], c[2], c[3], 1); tt.push(u);
    out.push([i - ci, j - cj, lv, Math.round(u * 1000) / 1000, c[0]]);
  });
  if (out.length) { b.setNumericAttribute('point', 'Cd', cd, 4); b.setNumericAttribute('point', 'u', tt, 1); }
  const cols = new Set(out.map(c => c[0] + ',' + c[1]));
  const data = { scale: s, stud: STUD, plate: PLATE, count: out.length, columns: cols.size, levels: out.length ? Math.max(...out.map(c => c[2])) + 1 : 0,
    offset: [ci, cj], span: [t0, t1], cells: out };
  context.outputs.cells.set(b.build());
  if (g && g.primitive.Cd) { const cdv: number[] = []; for (let p = 0; p < g.primitiveCount; p++) cdv.push(...(attr(g, 'primitive', 'Cd', p) || [0, 0, 0, 1])); scaled.setNumericAttribute('primitive', 'Cd', cdv, 4); }
  const sg = scaled.build();
  context.outputs.trail.set(sg);
  context.outputs.data.set(data);
  context.outputs.asset.set(await context.capabilities.assets.write(encodeJson(data), { mediaType: 'application/json', suggestedName: context.props.filename }, { signal: context.signal }));
}
