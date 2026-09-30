/* project.FacingField — the Cyclops' cave in plan, and facing as an explicit attribute. The blinded giant gropes along a path (a
   moving point); every object in the cave (the flock, the men under the rams, and first of all the bow) gets an `N` that points
   away from where his hand is now. cascade.geo.CopyToPoints turns each glyph by that `N`. With `explicit` off the attribute is not
   written, and every copy keeps the glyph's own facing: the way the forage placed 93 bows arrow-backward, because nothing said which
   way was front. The objects are scattered from a seed, never from Math.random. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { hash01 } from '../../lib/hall';

export const definition = {
  apiVersion: 1,
  label: 'Facing Field',
  description: 'Objects in the cave facing away from a moving groping point, as an explicit N attribute; glyphs to copy.',
  icon: 'Compass',
  runsOn: 'portable',
  props: {
    time: { type: 'float', default: 0, label: 'Seconds' },
    center: { type: 'vec2', default: [0, 0], label: 'The groping path\'s centre' },
    reach: { type: 'vec2', default: [120, 70], label: 'The groping path\'s reach (x, y)' },
    speed: { type: 'float', default: 0.5, min: 0, max: 4, step: 0.01, label: 'Groping speed (turns a minute x 60)' },
    wander: { type: 'float', default: 1.37, min: 0.1, max: 4, step: 0.01, label: 'Ratio of the path\'s two beats' },
    count: { type: 'int', default: 90, min: 1, max: 1000, label: 'Objects in the cave' },
    explicit: { type: 'bool', default: true, label: 'Facing is an explicit attribute' },
    seed: { type: 'int', default: 9, min: 0, max: 99999 },
    trail: { type: 'float', default: 3, min: 0, max: 30, label: 'Seconds of the groping path drawn' }
  },
  outputs: {
    flock: { kind: 'data', type: 'geometry' }, bow: { kind: 'data', type: 'geometry' },
    glyph: { kind: 'data', type: 'geometry' }, bowGlyph: { kind: 'data', type: 'geometry' },
    grope: { kind: 'data', type: 'geometry' }, cave: { kind: 'data', type: 'geometry' }
  }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props;
  const G = (t: number): [number, number] => [p.center[0] + p.reach[0] * Math.sin(t * p.speed), p.center[1] + p.reach[1] * Math.sin(t * p.speed * p.wander + 0.7)];
  const hand = G(p.time);
  /* the cave: a rough ellipse */
  const cave = new GeometryBuilder(), rim: number[] = [], R = (a: number) => 1 + 0.08 * Math.sin(a * 5 + p.seed) + 0.05 * Math.sin(a * 11);
  for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2; rim.push(Math.cos(a) * 220 * R(a), Math.sin(a) * 140 * R(a)); }
  cave.addPolygon(rim, { closed: false }); cave.addPrimitive([63, 0]);
  cave.setNumericAttribute('primitive', 'Cd', [0.35, 0.3, 0.25, 1, 0.35, 0.3, 0.25, 1], 4); cave.setNumericAttribute('primitive', 'width', [2.5, 2.5], 1);
  context.outputs.cave.set(cave.build());
  /* the objects, scattered in the cave; the first is the bow */
  const pts: [number, number][] = [];
  for (let i = 0; pts.length < p.count && i < p.count * 20; i++) {
    const a = hash01(p.seed, i, 1) * Math.PI * 2, r = Math.sqrt(hash01(p.seed, i, 2)) * 0.88;
    const x = Math.cos(a) * 220 * r, y = Math.sin(a) * 140 * r;
    if (pts.every(q => Math.hypot(q[0] - x, q[1] - y) > 15)) pts.push([x, y]);
  }
  const make = (list: [number, number][], scale: number, col: number[]) => {
    const b = new GeometryBuilder(), n: number[] = [], ps: number[] = [], cd: number[] = [];
    for (const [x, y] of list) { b.addPoint(x, y); const dx = x - hand[0], dy = y - hand[1], l = Math.hypot(dx, dy) || 1; n.push(dx / l, dy / l); ps.push(scale); cd.push(...col); }
    if (list.length) {
      if (p.explicit) b.setNumericAttribute('point', 'N', n, 2);
      b.setNumericAttribute('point', 'pscale', ps, 1); b.setNumericAttribute('point', 'Cd', cd, 4);
    }
    return b.build();
  };
  context.outputs.bow.set(make(pts.slice(0, 1), 1.6, [0.75, 0.1, 0.08, 1]));
  context.outputs.flock.set(make(pts.slice(1), 1, [0.25, 0.25, 0.28, 1]));
  /* a ram seen from above, its head toward +x: body, head, and the man clinging beneath as a line */
  const gl = new GeometryBuilder(), body: number[] = [];
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; body.push(Math.cos(a) * 6, Math.sin(a) * 4); }
  gl.addPolygon(body, { closed: true }); gl.addPolygon([5, -2.2, 10, -1.5, 10, 1.5, 5, 2.2], { closed: true });
  context.outputs.glyph.set(gl.build());
  /* the bow, its arrow toward +x: the stave as an arc, the string, the arrow */
  const bg = new GeometryBuilder(), arc: number[] = [];
  for (let k = 0; k <= 12; k++) { const a = -1.1 + k / 12 * 2.2; arc.push(Math.cos(a) * 7 - 3, Math.sin(a) * 9); }
  bg.addPolygon(arc); bg.addPolygon([Math.cos(1.1) * 7 - 3, Math.sin(1.1) * 9, Math.cos(-1.1) * 7 - 3, Math.sin(-1.1) * 9]);
  bg.addPolygon([-2, 0, 12, 0]); bg.addPolygon([9, 2.5, 12.5, 0, 9, -2.5]);
  context.outputs.bowGlyph.set(bg.build());
  /* the groping hand and the path it has taken */
  const gr = new GeometryBuilder(), path: number[] = [];
  for (let k = 0; k <= 60; k++) { const q = G(p.time - p.trail * (1 - k / 60)); path.push(q[0], q[1]); }
  gr.addPolygon(path);
  const ring: number[] = []; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; ring.push(hand[0] + Math.cos(a) * 9, hand[1] + Math.sin(a) * 9); }
  gr.addPolygon(ring, { closed: true });
  gr.setNumericAttribute('primitive', 'Cd', [0.55, 0.3, 0.1, 0.8, 0.55, 0.3, 0.1, 0.35], 4); gr.setNumericAttribute('primitive', 'width', [2, 1], 1);
  context.outputs.grope.set(gr.build());
}
