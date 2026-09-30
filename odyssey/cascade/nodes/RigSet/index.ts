/* project.RigSet — the set around the rigs, for context: the footprint of each set piece (its box as edges, from the take's
   marks) and every actor's marks on the floor (a cross at each key's position, in the actor's colour). All of it flagged `bg` so
   project.RigView draws it behind the figures. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { readJson } from '../../lib/rig';

export const definition = {
  apiVersion: 1,
  label: 'Rig Set',
  description: 'The set pieces as box edges and the actors\' floor marks, in the film\'s world, behind the rigs.',
  icon: 'Box',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: {
    track: { type: 'asset', default: { path: 'assets/rig/OD-B12-S03/scene.json' }, label: 'Scene (JSON)' },
    pieces: { type: 'bool', default: true, label: 'Set pieces' },
    marks: { type: 'bool', default: true, label: 'Floor marks' }
  },
  outputs: { geometry: { kind: 'data', type: 'geometry' } }
} as const satisfies NodeDefinition;

type Scene = { pieces: { label: string; box: number[] }[]; marks: { actor: string; p: number[]; colour: number[] }[] };

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, S = readJson<Scene>(await context.capabilities.assets.read(p.track, { signal: context.signal }));
  const gb = new GeometryBuilder({ positionSize: 3 }), cd: number[] = [], w: number[] = [];
  const line = (a: number[], b: number[], c: number[], wd: number) => { gb.addPrimitive([gb.addPoint(a[0], a[1], a[2]), gb.addPoint(b[0], b[1], b[2])]); cd.push(...c); w.push(wd); };
  if (p.pieces) for (const pc of S.pieces) {
    const [x0, y0, z0, x1, y1, z1] = pc.box, big = /plate|sea|floor|ground/.test(pc.label), c = big ? [0.62, 0.62, 0.6, 1] : [0.45, 0.47, 0.5, 1];
    const v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) { if (big && a >= 4) continue; line(v[a], v[b], c, big ? 0.6 : 0.9); }
  }
  if (p.marks) for (const m of S.marks) { const r = 4, y = m.p[1] + 0.2; line([m.p[0] - r, y, m.p[2]], [m.p[0] + r, y, m.p[2]], m.colour, 1.4); line([m.p[0], y, m.p[2] - r], [m.p[0], y, m.p[2] + r], m.colour, 1.4); }
  gb.setNumericAttribute('primitive', 'Cd', cd, 4); gb.setNumericAttribute('primitive', 'width', w, 1); gb.setNumericAttribute('primitive', 'bg', w.map(() => 1), 1);
  context.outputs.geometry.set(gb.build());
}
