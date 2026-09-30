/* project.Business — one step of the attention loop, inside a cascade.core.Feedback. For each figure at this drawing: measure its
   motion (the scene's scripted layers, from the hall, plus the business still playing out); where it is below the threshold,
   invent a piece of business (a push of energy in a new direction, its size seeded from the figure and the drawing, never from a
   clock or Math.random); measure again. The business decays each drawing. The hand moves by the measured motion, exaggerated so a
   plan shows it, and springs back toward its rest before the figure's mark. The state is the points, carried by the loop. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { emptyGeometry } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { attr, pointAt } from '../../lib/geo';
import { hash01, markAt, type HallData } from '../../lib/hall';

export const definition = {
  apiVersion: 1,
  label: 'Business',
  description: 'One drawing of the attention loop: measure, invent business below the threshold, measure again.',
  icon: 'Activity',
  runsOn: 'portable',
  inputs: {
    state: { kind: 'data', type: 'geometry' },
    step: { kind: 'data', type: 'int', default: 0 },
    hall: { kind: 'data', type: 'object' }
  },
  props: {
    threshold: { type: 'float', default: 50, min: 0, max: 400, step: 1, label: 'Threshold (ten-thousandths of a figure\'s height per drawing; the choreographer uses 50)' },
    script: { type: 'float', default: 1, min: 0, max: 2, step: 0.05, label: 'How much of the scene\'s scripted motion to keep (0: none)' },
    decay: { type: 'float', default: 0.86, min: 0, max: 0.99, step: 0.01, label: 'Business decay per drawing' },
    invent: { type: 'float', default: 1.4, min: 0, max: 6, step: 0.05, label: 'How much business is invented against the shortfall' },
    exaggerate: { type: 'float', default: 5, min: 1, max: 60, step: 1, label: 'Exaggerate the hand\'s motion in the plan' },
    spring: { type: 'float', default: 0.8, min: 0, max: 0.99, step: 0.01, label: 'How much of its offset the hand keeps each drawing' },
    seed: { type: 'int', default: 7, min: 0, max: 99999 }
  },
  outputs: { state: { kind: 'data', type: 'geometry' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const g = context.inputs.state, d = context.inputs.hall as unknown as HallData, n = context.inputs.step, p = context.props;
  if (!g || !d) { context.outputs.state.set(emptyGeometry(2)); return; }
  const t = n / d.drawings, b = new GeometryBuilder();
  const cols = { still: [0.62, 0.62, 0.6, 1], scripted: [0.0, 0.2, 0.8, 1], business: [0.85, 0.46, 0.1, 1] };
  const ids: number[] = [], off: number[] = [], amp: number[] = [], th: number[] = [], m1s: number[] = [], m2s: number[] = [], inj: number[] = [], cd: number[] = [];
  const mark: number[] = [], head: number[] = [], vis: number[] = [], base: number[] = [], vel: number[] = [];
  for (let i = 0; i < g.pointCount; i++) {
    const id = (attr(g, 'point', 'id', i) || [i])[0], f = d.figs[id], m = markAt(d, f.id, t);
    let a = (attr(g, 'point', 'amp', i) || [0])[0] * p.decay, theta = (attr(g, 'point', 'theta', i) || [0])[0];
    const o = attr(g, 'point', 'off', i) || [0, 0], mb = (f.base[Math.min(n, f.base.length - 1)] || 0) * p.script;
    const m1 = mb + a; let injected = 0;
    if (m.vis && m1 < p.threshold) {                       /* below the threshold: a new piece of business */
      a += (p.threshold - m1) * p.invent * (0.6 + 0.8 * hash01(p.seed, id, n));
      theta = hash01(p.seed + 1, id, n) * Math.PI * 2; injected = 1;
    }
    const m2 = mb + a;
    /* the hand: a step of the measured motion, turning a little each drawing, springing back to rest */
    theta += (hash01(p.seed + 2, id, n) - 0.5) * 1.2;
    const len = m2 / 10000 * f.H * p.exaggerate;
    const ox = o[0] * p.spring + Math.cos(theta) * len, oy = o[1] * p.spring + Math.sin(theta) * len;
    const rx = m.x + Math.sin(m.h) * 8, ry = m.y - Math.cos(m.h) * 8;
    vel.push((ox - o[0]) * d.drawings, (oy - o[1]) * d.drawings);
    b.addPoint(rx + ox, ry + oy);
    ids.push(id); off.push(ox, oy); amp.push(a); th.push(theta); m1s.push(m1); m2s.push(m2); inj.push(injected); base.push(mb);
    mark.push(m.x, m.y); head.push(m.h); vis.push(m.vis ? 1 : 0);
    cd.push(...(injected ? cols.business : mb >= p.threshold && mb > 0 ? cols.scripted : a > 1 ? cols.business : cols.still));
  }
  b.setNumericAttribute('point', 'id', ids, 1, 'i32');
  b.setNumericAttribute('point', 'off', off, 2); b.setNumericAttribute('point', 'amp', amp, 1); b.setNumericAttribute('point', 'theta', th, 1);
  b.setNumericAttribute('point', 'm1', m1s, 1); b.setNumericAttribute('point', 'm2', m2s, 1); b.setNumericAttribute('point', 'injected', inj, 1);
  b.setNumericAttribute('point', 'base', base, 1); b.setNumericAttribute('point', 'mark', mark, 2); b.setNumericAttribute('point', 'h', head, 1);
  b.setNumericAttribute('point', 'vis', vis, 1); b.setNumericAttribute('point', 'Cd', cd, 4);
  /* what makes the state particle geometry, so cascade.pop.Trail takes the loop's history: velocity, age, life, the next id */
  b.setNumericAttribute('point', 'v', vel, 2, 'f32');
  b.setNumericAttribute('point', 'age', ids.map(() => t), 1, 'f32'); b.setNumericAttribute('point', 'life', ids.map(() => 1e6), 1, 'f32');
  b.setDetail('nextid', ids.length); b.setDetail('step', n);
  context.outputs.state.set(b.build());
}
