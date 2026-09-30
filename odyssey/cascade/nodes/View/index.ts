/* project.View — 3D geometry seen orthographically from an azimuth and an elevation, flattened to 2D for SvgExport and Plot.
   Topology and every attribute are kept; a point attribute `depth` records how near the viewer each point was. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { createGeometry, emptyGeometry } from 'cascade/contracts';
import { pointAt, view } from '../../lib/geo';

export const definition = {
  apiVersion: 1,
  label: 'View',
  description: 'Orthographic view of 3D geometry: azimuth about y, then elevation (90 looks straight down, the front at the bottom).',
  icon: 'Eye',
  runsOn: 'portable',
  inputs: { geometry: { kind: 'data', type: 'geometry' } },
  props: {
    azimuth: { type: 'float', default: 0, min: -180, max: 180, step: 1, label: 'Azimuth (degrees)' },
    elevation: { type: 'float', default: 90, min: -90, max: 90, step: 1, label: 'Elevation (degrees)' },
    scale: { type: 'float', default: 1, min: 0.01, max: 100, label: 'Uniform scale' }
  },
  outputs: { geometry: { kind: 'data', type: 'geometry' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const g = context.inputs.geometry;
  if (!g || g.pointCount === 0) { context.outputs.geometry.set(emptyGeometry(2)); return; }
  const P = new Float64Array(g.pointCount * 2), D = new Float64Array(g.pointCount);
  for (let i = 0; i < g.pointCount; i++) { const v = view(pointAt(g, i), context.props.azimuth, context.props.elevation); const k = context.props.scale; P[i * 2] = v[0] * k; P[i * 2 + 1] = v[1] * k; D[i] = v[2] * k; }
  context.outputs.geometry.set(createGeometry({
    pointCount: g.pointCount, topology: g.topology, vertex: g.vertex, primitive: g.primitive, detail: g.detail,
    pointGroups: g.pointGroups, primitiveGroups: g.primitiveGroups,
    point: { ...g.point, P: { storage: 'f64', size: 2, data: P }, depth: { storage: 'f64', size: 1, data: D } }
  }));
}
