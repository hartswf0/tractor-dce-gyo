/* project.Paint — gives every primitive a colour and a width (and every loose point a colour), so geometry that arrives without
   them keeps a visible stroke through a Merge: cascade.geo.Merge takes the union of attributes, and a primitive with no Cd of its own
   then carries a zero, transparent one. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { createGeometry, emptyGeometry } from 'cascade/contracts';

export const definition = {
  apiVersion: 1,
  label: 'Paint',
  description: 'Set primitive Cd and width (and point Cd) on a geometry, replacing what it had.',
  icon: 'Paintbrush',
  runsOn: 'portable',
  inputs: { geometry: { kind: 'data', type: 'geometry' } },
  props: {
    color: { type: 'color', default: [0.08, 0.08, 0.08, 1] },
    width: { type: 'float', default: 1.5, min: 0, max: 40, step: 0.1 }
  },
  outputs: { geometry: { kind: 'data', type: 'geometry' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const g = context.inputs.geometry;
  if (!g) { context.outputs.geometry.set(emptyGeometry(2)); return; }
  const c = context.props.color, n = g.primitiveCount, cd = new Float64Array(n * 4), w = new Float64Array(n).fill(context.props.width);
  for (let i = 0; i < n; i++) cd.set([c[0], c[1], c[2], c[3] ?? 1], i * 4);
  const pc = new Float64Array(g.pointCount * 4); for (let i = 0; i < g.pointCount; i++) pc.set([c[0], c[1], c[2], c[3] ?? 1], i * 4);
  context.outputs.geometry.set(createGeometry({
    pointCount: g.pointCount, topology: g.topology, vertex: g.vertex, detail: g.detail, pointGroups: g.pointGroups, primitiveGroups: g.primitiveGroups,
    point: { ...g.point, Cd: { storage: 'f64', size: 4, data: pc } },
    primitive: { ...g.primitive, Cd: { storage: 'f64', size: 4, data: cd }, width: { storage: 'f64', size: 1, data: w } }
  }));
}
