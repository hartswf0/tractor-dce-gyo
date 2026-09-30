/* project.MinifigRig — one actor of a scene on the rig desk: the choreographer's sheet for that actor (its generated layers, baked by
   tools/rig_import.mjs into assets/rig/<scene>/<actor>.json with the take's blocking), and the director's layer as this node's own
   props: an offset per servo (the '@dir' layer, keyed in Studio's Timeline or written as an expression) and a weight per part of the
   body on the generated layers (1 keeps the pass, 0 mutes it). Forward kinematics on the film's skeleton (lib/rig.ts) give the figure
   as boxes and its held props as lines, in the film's world (y up), and the pose as data (the seven points the density reads).
   tools/rig_export.mjs reads these props back out of the graph and writes them into the sheet's overrides. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { figureFaces, poseAt, readJson, type ActorSheet, type Director } from '../../lib/rig';

export const definition = {
  apiVersion: 1,
  label: 'Minifig Rig',
  description: 'One actor: the generated choreography plus the director\'s layer (an offset per servo, a weight per body part), posed by the minifigure\'s forward kinematics. Boxes and prop lines in the film\'s world; the pose as data.',
  icon: 'PersonStanding',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: {
    sheet: { type: 'asset', default: { path: 'assets/rig/OD-B12-S03/odysseus.json' }, label: 'Actor sheet (JSON)' },
    time: { type: 'float', default: 0, expression: '$T', min: 0, max: 600, step: 0.001, label: 'Time (s)' },
    solo: { type: 'bool', default: false, label: 'Highlight this actor' },
    rootX: { type: 'float', default: 0, min: -200, max: 200, step: 0.1, label: 'root.x (world units)' },
    rootZ: { type: 'float', default: 0, min: -200, max: 200, step: 0.1, label: 'root.z (world units)' },
    rootY: { type: 'float', default: 0, min: -200, max: 200, step: 0.1, label: 'root.y (world units)' },
    rootH: { type: 'float', default: 0, min: -3.2, max: 3.2, step: 0.01, label: 'root.h heading' },
    rootPitch: { type: 'float', default: 0, min: -1.6, max: 1.6, step: 0.01, label: 'root.pitch' },
    rootRoll: { type: 'float', default: 0, min: -1.6, max: 1.6, step: 0.01, label: 'root.roll' },
    hipsDy: { type: 'float', default: 0, min: -14, max: 14, step: 0.1, label: 'hips.dy (LDU)' },
    torsoLean: { type: 'float', default: 0, min: -0.7, max: 0.7, step: 0.005, label: 'torso.lean' },
    torsoTwist: { type: 'float', default: 0, min: -1.1, max: 1.1, step: 0.005, label: 'torso.twist' },
    torsoRoll: { type: 'float', default: 0, min: -0.3, max: 0.3, step: 0.005, label: 'torso.roll' },
    headYaw: { type: 'float', default: 0, min: -2.9, max: 2.9, step: 0.01, label: 'head.yaw' },
    headPitch: { type: 'float', default: 0, min: -0.44, max: 0.44, step: 0.005, label: 'head.pitch' },
    armRPitch: { type: 'float', default: 0, min: -3.2, max: 3.2, step: 0.01, label: 'arm.R.pitch (negative raises)' },
    armROut: { type: 'float', default: 0, min: -0.75, max: 0.75, step: 0.005, label: 'arm.R.out' },
    handRRoll: { type: 'float', default: 0, min: -1.3, max: 1.3, step: 0.01, label: 'hand.R.roll' },
    armLPitch: { type: 'float', default: 0, min: -3.2, max: 3.2, step: 0.01, label: 'arm.L.pitch (negative raises)' },
    armLOut: { type: 'float', default: 0, min: -0.75, max: 0.75, step: 0.005, label: 'arm.L.out' },
    handLRoll: { type: 'float', default: 0, min: -1.3, max: 1.3, step: 0.01, label: 'hand.L.roll' },
    legRPitch: { type: 'float', default: 0, min: -2.5, max: 2.5, step: 0.01, label: 'leg.R.pitch' },
    legLPitch: { type: 'float', default: 0, min: -2.5, max: 2.5, step: 0.01, label: 'leg.L.pitch' },
    wRoot: { type: 'float', default: 1, min: 0, max: 2, step: 0.01, label: 'Generated weight: root' },
    wTorso: { type: 'float', default: 1, min: 0, max: 2, step: 0.01, label: 'Generated weight: torso and hips' },
    wHead: { type: 'float', default: 1, min: 0, max: 2, step: 0.01, label: 'Generated weight: head' },
    wArmR: { type: 'float', default: 1, min: 0, max: 2, step: 0.01, label: 'Generated weight: right arm and hand' },
    wArmL: { type: 'float', default: 1, min: 0, max: 2, step: 0.01, label: 'Generated weight: left arm and hand' },
    wLegs: { type: 'float', default: 1, min: 0, max: 2, step: 0.01, label: 'Generated weight: legs' }
  },
  outputs: {
    geometry: { kind: 'data', type: 'geometry' },
    pose: { kind: 'data', type: 'object' }
  }
} as const satisfies NodeDefinition;

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props;
  const S = readJson<ActorSheet>(await context.capabilities.assets.read(p.sheet, { signal: context.signal }));
  const D: Director = {
    offsets: { 'root.x': p.rootX, 'root.z': p.rootZ, 'root.y': p.rootY, 'root.h': p.rootH, 'root.pitch': p.rootPitch, 'root.roll': p.rootRoll, 'hips.dy': p.hipsDy,
      'torso.lean': p.torsoLean, 'torso.twist': p.torsoTwist, 'torso.roll': p.torsoRoll, 'head.yaw': p.headYaw, 'head.pitch': p.headPitch,
      'arm.R.pitch': p.armRPitch, 'arm.R.out': p.armROut, 'hand.R.roll': p.handRRoll, 'arm.L.pitch': p.armLPitch, 'arm.L.out': p.armLOut, 'hand.L.roll': p.handLRoll,
      'leg.R.pitch': p.legRPitch, 'leg.L.pitch': p.legLPitch },
    weights: { wRoot: p.wRoot, wTorso: p.wTorso, wHead: p.wHead, wArmR: p.wArmR, wArmL: p.wArmL, wLegs: p.wLegs }
  };
  const P = poseAt(S, p.time, D), gb = new GeometryBuilder({ positionSize: 3 }), cd: number[] = [], kind: number[] = [], shade = S.colour;
  if (P && P.vis) {
    /* the boxes: closed quads coloured by part (skin for head and hands, the actor's colour for the torso and arms, darker legs) */
    for (const f of figureFaces(P)) {
      const ids = f.p.map(v => gb.addPoint(v[0], v[1], v[2])); gb.addPrimitive(ids, { closed: true });
      const skin = /head|hand/.test(f.part), leg = /leg|foot|hips/.test(f.part), k = leg ? 0.55 : 1;
      if (f.part === 'face') cd.push(0.12, 0.1, 0.08, 1); else if (skin) cd.push(0.96, 0.8, 0.26, 1); else cd.push(shade[0] * k, shade[1] * k, shade[2] * k, 1);
      kind.push(0);
    }
    for (const l of P.props) { const a = gb.addPoint(...l[0]), b = gb.addPoint(...l[1]); gb.addPrimitive([a, b]); cd.push(0.35, 0.22, 0.1, 1); kind.push(1); }
  }
  gb.setNumericAttribute('primitive', 'Cd', cd, 4);
  gb.setNumericAttribute('primitive', 'width', kind.map(k => (k ? 3 : 0.6) * (p.solo ? 1.6 : 1)), 1);
  context.outputs.geometry.set(gb.build());
  const r = (v: number) => Math.round(v * 1000) / 1000;
  context.outputs.pose.set({ actor: S.actor, t: r(p.time), vis: !!(P && P.vis), H: S.H, pts: P && P.vis ? P.pts.map(v => v.map(r)) : [], head: P && P.vis ? P.head.map(r) : null, hips: P && P.vis ? P.hips.map(r) : null,
    ch: P ? Object.fromEntries(Object.entries(P.ch).map(([k, v]) => [k, r(v)])) : {} });
}
