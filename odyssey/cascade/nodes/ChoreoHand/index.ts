/* project.ChoreoHand — reads a choreography sheet (a gesture cut from odyssey/choreo by tools/extract.cjs), runs the minifigure's
   forward kinematics at every sample of the gesture's span, and sweeps one hand through time: the trail is geometry. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { BONES, decodeJson, floorOf, rampAt, skeletonAt, type Gesture } from '../../lib/choreo';

export const definition = {
  apiVersion: 1,
  label: 'Choreo Hand',
  description: 'One actor\'s hand swept through a choreography sheet: the trail (segments coloured early to late), the stick figure at now, and the hand at now. LDU, y up.',
  icon: 'Hand',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: {
    sheet: { type: 'asset', default: { path: 'assets/gestures.json' }, label: 'Gestures (JSON)' },
    gesture: { type: 'string', default: 'welcome', control: 'select', options: ['welcome', 'bow'], label: 'Gesture' },
    side: { type: 'string', default: 'R', control: 'select', options: ['R', 'L'], label: 'Hand' },
    frame: { type: 'string', default: 'world', control: 'select', options: ['world', 'body'], label: 'Frame' },
    samples: { type: 'int', default: 300, min: 2, max: 4000, label: 'Samples over the span' },
    now: { type: 'float', default: 1, min: 0, max: 1, step: 0.001, label: 'Now (0..1 of the span)' },
    upto: { type: 'bool', default: true, label: 'Trail only up to now' }
  },
  outputs: {
    trail: { kind: 'data', type: 'geometry' },
    figure: { kind: 'data', type: 'geometry' },
    hand: { kind: 'data', type: 'geometry' },
    info: { kind: 'data', type: 'object' }
  }
} as const satisfies NodeDefinition;

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context;
  const all = decodeJson<Record<string, Gesture>>(await context.capabilities.assets.read(props.sheet, { signal: context.signal }));
  const g = all[props.gesture] ?? Object.values(all)[0];
  const frame = props.frame === 'body' ? 'body' : 'world', side = props.side === 'L' ? 'handL' : 'handR';
  const floor = floorOf(g), n = Math.max(2, Math.trunc(props.samples)), now = Math.max(0, Math.min(1, props.now));
  const last = props.upto ? Math.max(1, Math.round(now * (n - 1))) : n - 1;
  const pts: number[][] = [];
  for (let i = 0; i <= last; i++) { const u = i / (n - 1), t = g.t0 + (g.t1 - g.t0) * u, s = skeletonAt(g, t, frame, floor); pts.push([...s[side], u, t]); }
  /* the trail: one segment per sample step, so a print keeps the time colour (SVG colours a primitive, not a vertex) */
  const tb = new GeometryBuilder({ positionSize: 3 }), cd: number[] = [], tt: number[] = [];
  for (let i = 0; i < pts.length; i++) { tb.addPoint(pts[i][0], pts[i][1], pts[i][2]); tt.push(pts[i][4]); }
  for (let i = 1; i < pts.length; i++) { tb.addPrimitive([i - 1, i]); const c = rampAt(pts[i][3]); cd.push(c[1], c[2], c[3], 1); }
  tb.setNumericAttribute('point', 't', tt, 1);
  if (cd.length) tb.setNumericAttribute('primitive', 'Cd', cd, 4);
  context.outputs.trail.set(tb.build());
  /* the figure at now */
  const tn = g.t0 + (g.t1 - g.t0) * now, sk = skeletonAt(g, tn, frame, floor), fb = new GeometryBuilder({ positionSize: 3 });
  for (const [a, b] of BONES) { const i = fb.addPoint(...sk[a]), j = fb.addPoint(...sk[b]); fb.addPrimitive([i, j]); }
  fb.setNumericAttribute('primitive', 'Cd', BONES.flatMap(() => [0.08, 0.08, 0.08, 1]), 4);
  fb.setNumericAttribute('primitive', 'width', BONES.map((_, n) => n < 2 ? 4 : 2.5), 1);
  context.outputs.figure.set(fb.build());
  const hb = new GeometryBuilder({ positionSize: 3 }); hb.addPoint(...sk[side]); hb.setNumericAttribute('point', 'pscale', [6], 1); hb.setNumericAttribute('point', 'Cd', [0.08, 0.08, 0.08, 1], 4);
  context.outputs.hand.set(hb.build());
  context.outputs.info.set({ scene: g.scene, actor: g.actor, title: g.title, caption: g.caption, t0: g.t0, t1: g.t1, t: Math.round(tn * 100) / 100, samples: pts.length, frame });
}
