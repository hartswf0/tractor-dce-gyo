/* project.BxExpand — Knowlton's EXPAND and SHRINK: ink grows into its neighbours (each cell takes the darkest of its 3 x 3
   neighbourhood) or withdraws from them (the lightest), `steps` times, in a region. The voice on `drive` adds steps. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'EXPAND / SHRINK',
  description: 'Grow ink into neighbouring cells (expand) or pull it back (shrink), a number of steps, in a region.',
  icon: 'Expand',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' }, drive: { kind: 'data', type: 'float', default: 0 } },
  props: {
    mode: { type: 'string', default: 'expand', control: 'select', options: ['expand', 'shrink'], label: 'Operation' },
    steps: { type: 'float', default: 1, min: 0, max: 16, step: 0.01, label: 'Steps' },
    driveSteps: { type: 'float', default: 0, min: 0, max: 8, step: 0.1, label: 'Steps added at full voice' },
    region: { type: 'vec4', default: [0, 0, 0, 0], min: -1024, max: 1024, step: 1, label: 'Region [x0, y0, x1, y1] (all zero: the frame)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, src = orBlank(context.inputs.field);
  const n = Math.round(Math.max(0, props.steps + props.driveSteps * Math.max(0, context.inputs.drive || 0)));
  if (!n) { context.outputs.mosaic.set(src); return; }
  let [x0, y0, x1, y1] = props.region.map(Math.round);
  if (!(x1 > x0 && y1 > y0)) { x0 = 0; y0 = 0; x1 = src.w; y1 = src.h; }
  x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(src.w, x1); y1 = Math.min(src.h, y1);
  const W = src.w, H = src.h, grow = props.mode !== 'shrink';
  let cur = src.ink.slice(), nxt = src.ink.slice();
  for (let k = 0; k < n; k++) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      let v = cur[y * W + x];
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const u = cur[Y * W + X]; if (grow ? u > v : u < v) v = u;
      }
      nxt[y * W + x] = v;
    }
    const t = cur; cur = nxt; nxt = t; nxt.set(cur);
  }
  context.outputs.mosaic.set({ w: W, h: H, ink: cur });
}
