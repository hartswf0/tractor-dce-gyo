/* project.Planks — the performer's clock on the shore: the raft's logs, laid one by one at the performer's rate. Points, one per log
   laid by `time` (log ends in elevation, left to right along the slipway), each with a pscale; wire a Circle or a Rectangle onto
   them with cascade.geo.CopyToPoints. The last log grows in as it is laid. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';

export const definition = {
  apiVersion: 1,
  label: 'Planks',
  description: 'Logs laid one after another at a rate, by a time: points for Copy to Points.',
  icon: 'Rows3',
  runsOn: 'portable',
  props: {
    time: { type: 'float', default: 0, min: 0, max: 100000, label: 'Performer seconds' },
    rate: { type: 'float', default: 2, min: 0.01, max: 100, step: 0.01, label: 'Logs per performer second' },
    count: { type: 'int', default: 20, min: 1, max: 400, label: 'Logs in the raft' },
    origin: { type: 'vec2', default: [-60, -14] },
    spacing: { type: 'float', default: 8, min: 1, max: 100 }
  },
  outputs: { points: { kind: 'data', type: 'geometry' }, laid: { kind: 'data', type: 'float' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, laid = Math.min(p.count, Math.max(0, p.time * p.rate)), b = new GeometryBuilder(), ps: number[] = [], ids: number[] = [];
  for (let i = 0; i < Math.ceil(laid); i++) { const grow = Math.min(1, laid - i); b.addPoint(p.origin[0] + i * p.spacing, p.origin[1] + 4 * grow); ps.push(grow); ids.push(i); }
  if (ps.length) { b.setNumericAttribute('point', 'pscale', ps, 1); b.setNumericAttribute('point', 'id', ids, 1, 'i32'); }
  context.outputs.points.set(b.build());
  context.outputs.laid.set(laid);
}
