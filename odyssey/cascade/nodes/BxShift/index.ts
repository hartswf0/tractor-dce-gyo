/* project.BxShift — Knowlton's SHIFT: move the cells of a region (or the whole frame) by an offset, wrapping round or leaving
   paper behind. `shake` adds a jitter of up to that many cells, scaled by the voice on `drive` and chosen by a hash of `seed`
   (an expression on the frame), so a struggle shakes the picture in time with the words. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { clone, hash2, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'SHIFT',
  description: 'Move a region of cells by an offset (wrapping or not), with an optional jitter driven by the voice.',
  icon: 'Move',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' }, drive: { kind: 'data', type: 'float', default: 0 } },
  props: {
    offset: { type: 'vec2', default: [0, 0], min: -1024, max: 1024, step: 1, label: 'Offset (cells)' },
    region: { type: 'vec4', default: [0, 0, 0, 0], min: -1024, max: 1024, step: 1, label: 'Region [x0, y0, x1, y1] (all zero: the frame)' },
    wrap: { type: 'bool', default: false, label: 'Wrap round' },
    fill: { type: 'int', default: 0, min: 0, max: 7, label: 'Level left behind' },
    shake: { type: 'float', default: 0, min: 0, max: 32, step: 0.5, label: 'Jitter at full voice (cells)' },
    seed: { type: 'int', default: 1, min: 0, max: 1000000, label: 'Jitter seed' },
    on: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'On (at 0.5 and above)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, src = orBlank(context.inputs.field);
  if (props.on < 0.5) { context.outputs.mosaic.set(src); return; }
  const j = props.shake * Math.max(0, context.inputs.drive || 0);
  const dx = Math.round(props.offset[0] + (hash2(props.seed, 1, 7) - 0.5) * 2 * j), dy = Math.round(props.offset[1] + (hash2(props.seed, 2, 7) - 0.5) * 2 * j);
  let [x0, y0, x1, y1] = props.region.map(Math.round);
  if (!(x1 > x0 && y1 > y0)) { x0 = 0; y0 = 0; x1 = src.w; y1 = src.h; }
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(src.w, x1); y1 = Math.min(src.h, y1);
  const m = clone(src), rw = x1 - x0, rh = y1 - y0;
  if (rw <= 0 || rh <= 0 || (!dx && !dy)) { context.outputs.mosaic.set(m); return; }
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    let sx = x - dx, sy = y - dy;
    if (props.wrap) { sx = x0 + ((((sx - x0) % rw) + rw) % rw); sy = y0 + ((((sy - y0) % rh) + rh) % rh); }
    m.ink[y * m.w + x] = sx >= x0 && sx < x1 && sy >= y0 && sy < y1 ? src.ink[sy * src.w + sx] : props.fill;
  }
  context.outputs.mosaic.set(m);
}
