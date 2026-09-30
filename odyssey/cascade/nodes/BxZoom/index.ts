/* project.BxZoom — Knowlton's ZOOM: cell magnification. Every cell of the window about `centre` becomes a block of `factor`
   cells (nearest cell, never blended: the grain grows, as it did in 1963). A factor between integers steps the blocks unevenly,
   which is how a BEFLIX zoom moves. The voice on `drive` adds `pulse` to the factor. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'ZOOM',
  description: 'Magnify the cells about a centre by a factor (nearest cell), the window kept inside the frame.',
  icon: 'ZoomIn',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' }, drive: { kind: 'data', type: 'float', default: 0 } },
  props: {
    centre: { type: 'vec2', default: [126, 92], min: -1024, max: 1024, step: 1, label: 'Centre (cells)' },
    factor: { type: 'float', default: 1, min: 0.25, max: 64, step: 0.01, label: 'Magnification' },
    pulse: { type: 'float', default: 0, min: 0, max: 8, step: 0.01, label: 'Magnification added at full voice' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, src = orBlank(context.inputs.field);
  const f = Math.max(0.25, props.factor + props.pulse * Math.max(0, context.inputs.drive || 0));
  if (Math.abs(f - 1) < 1e-3) { context.outputs.mosaic.set(src); return; }
  const W = src.w, H = src.h, ww = W / f, wh = H / f;
  /* keep the window inside the frame when it is smaller than the frame */
  const cx = f >= 1 ? Math.max(ww / 2, Math.min(W - ww / 2, props.centre[0])) : props.centre[0];
  const cy = f >= 1 ? Math.max(wh / 2, Math.min(H - wh / 2, props.centre[1])) : props.centre[1];
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const sy = Math.floor(cy - wh / 2 + (y + 0.5) / f);
    for (let x = 0; x < W; x++) {
      const sx = Math.floor(cx - ww / 2 + (x + 0.5) / f);
      out[y * W + x] = sx >= 0 && sy >= 0 && sx < W && sy < H ? src.ink[sy * W + sx] : 0;
    }
  }
  context.outputs.mosaic.set({ w: W, h: H, ink: out });
}
