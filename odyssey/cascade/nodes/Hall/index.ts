/* project.Hall — the hall of OD-B01-S03 read from assets/hall.json: the data for the loop, the twelve figures' starting state (one
   point each, at the hand's rest before its mark, with an `id` for trails), and the stage in plan (the floor, the court, the feast,
   the gate) as outlines. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { decodeJson } from '../../lib/choreo';
import { markAt, type HallData } from '../../lib/hall';

export const definition = {
  apiVersion: 1,
  label: 'Hall',
  description: 'The figures of a scene at their marks, with per-drawing motion; the stage in plan.',
  icon: 'Users',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: { sheet: { type: 'asset', default: { path: 'assets/hall.json' }, label: 'Hall (JSON)' } },
  outputs: {
    hall: { kind: 'data', type: 'object' },
    initial: { kind: 'data', type: 'geometry' },
    stage: { kind: 'data', type: 'geometry' }
  }
} as const satisfies NodeDefinition;

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const d = decodeJson<HallData>(await context.capabilities.assets.read(context.props.sheet, { signal: context.signal }));
  context.outputs.hall.set(d as unknown as Record<string, unknown>);
  const b = new GeometryBuilder(), ids: number[] = [], zero: number[] = [];
  d.figs.forEach((f, n) => { const m = markAt(d, f.id, 0); b.addPoint(m.x + Math.sin(m.h) * 8, m.y - Math.cos(m.h) * 8); ids.push(n); zero.push(0, 0); });
  b.setNumericAttribute('point', 'id', ids, 1, 'i32');
  b.setNumericAttribute('point', 'off', zero, 2);
  b.setNumericAttribute('point', 'amp', ids.map(() => 0), 1);
  b.setNumericAttribute('point', 'theta', ids.map((_, n) => n * 2.39996), 1);
  b.setNumericAttribute('point', 'v', zero, 2, 'f32'); b.setNumericAttribute('point', 'age', ids.map(() => 0), 1, 'f32');
  b.setNumericAttribute('point', 'life', ids.map(() => 1e6), 1, 'f32'); b.setDetail('nextid', ids.length);
  context.outputs.initial.set(b.build());
  const s = new GeometryBuilder(), cd: number[] = [];
  for (const p of d.pieces) { const [x0, , z0, x1, , z1] = p.box; s.addPolygon([x0, -z0, x1, -z0, x1, -z1, x0, -z1], { closed: false });
    s.addPrimitive([s.pointCount - 1, s.pointCount - 4]); cd.push(0.55, 0.53, 0.48, 1, 0.55, 0.53, 0.48, 1); }
  if (cd.length) s.setNumericAttribute('primitive', 'Cd', cd, 4);
  context.outputs.stage.set(s.build());
}
