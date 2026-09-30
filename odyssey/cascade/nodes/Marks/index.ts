/* project.Marks — the figures as marks in plan: a ring at each figure's mark (filled when business was invented this drawing,
   blue when the scene's own script moves it, grey when it stands still), a tick for its heading, a line to its hand; and the
   hall's count of who moved, as detail attributes for a caption. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { attr, pointAt } from '../../lib/geo';

export const definition = {
  apiVersion: 1,
  label: 'Marks',
  description: 'Figures drawn as marks in plan from the loop state: ring, heading, hand; coloured by what moved them.',
  icon: 'CircleDot',
  runsOn: 'portable',
  inputs: { state: { kind: 'data', type: 'geometry' } },
  props: { radius: { type: 'float', default: 9, min: 1, max: 40 } },
  outputs: { geometry: { kind: 'data', type: 'geometry' }, moving: { kind: 'data', type: 'int' }, invented: { kind: 'data', type: 'int' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const g = context.inputs.state, r = context.props.radius, b = new GeometryBuilder(), cd: number[] = [], w: number[] = [];
  let moving = 0, invented = 0;
  if (g) for (let i = 0; i < g.pointCount; i++) {
    if (!(attr(g, 'point', 'vis', i) || [1])[0]) continue;
    const mk = attr(g, 'point', 'mark', i) || [0, 0], h = (attr(g, 'point', 'h', i) || [0])[0], col = attr(g, 'point', 'Cd', i) || [0, 0, 0, 1];
    const inj = (attr(g, 'point', 'injected', i) || [0])[0], m2 = (attr(g, 'point', 'm2', i) || [0])[0];
    if (m2 > 50) moving++; if (inj) invented++;
    const ring: number[] = []; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; ring.push(mk[0] + Math.cos(a) * r, mk[1] + Math.sin(a) * r); }
    b.addPolygon(ring, { closed: true }); cd.push(...col); w.push(2);
    b.addPolygon([mk[0] + Math.sin(h) * r, mk[1] - Math.cos(h) * r, mk[0] + Math.sin(h) * r * 1.9, mk[1] - Math.cos(h) * r * 1.9], { closed: false }); cd.push(0.08, 0.08, 0.08, 1); w.push(2.5);
    const hp = pointAt(g, i); b.addPolygon([mk[0], mk[1], hp[0], hp[1]], { closed: false }); cd.push(col[0], col[1], col[2], 0.5); w.push(1);
  }
  if (cd.length) { b.setNumericAttribute('primitive', 'Cd', cd, 4); b.setNumericAttribute('primitive', 'width', w, 1); }
  b.setDetail('moving', moving); b.setDetail('invented', invented);
  context.outputs.geometry.set(b.build());
  context.outputs.moving.set(moving); context.outputs.invented.set(invented);
}
