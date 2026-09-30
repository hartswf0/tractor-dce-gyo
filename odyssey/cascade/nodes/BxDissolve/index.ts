/* project.BxDissolve — Knowlton's DISSOLVE: from mosaic A to mosaic B cell by cell, each cell changing when `amount` passes its
   own threshold in a field: noise (a hash of the cell), radial (distance from a centre, roughened), ordered (the 8 x 8 Bayer
   matrix), rows, or rain (each column falling at its own speed). The voice on `drive` pushes a dissolve that is under way. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { hash2, isMosaic, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'DISSOLVE',
  description: 'Change mosaic A into mosaic B cell by cell, by a threshold field (noise, radial, ordered, rows, rain).',
  icon: 'Blend',
  runsOn: 'portable',
  inputs: { a: { kind: 'data', type: 'project.mosaic' }, b: { kind: 'data', type: 'project.mosaic' }, drive: { kind: 'data', type: 'float', default: 0 } },
  props: {
    amount: { type: 'float', default: 0.5, min: 0, max: 1, step: 0.001, label: 'Amount (0: A, 1: B)' },
    field: { type: 'string', default: 'noise', control: 'select', options: ['noise', 'radial', 'ordered', 'rows', 'rain'], label: 'Threshold field' },
    centre: { type: 'vec2', default: [126, 92], min: -1024, max: 1024, step: 1, label: 'Centre (radial)' },
    seed: { type: 'int', default: 3, min: 0, max: 100000, label: 'Seed' },
    driveGain: { type: 'float', default: 0, min: 0, max: 1, step: 0.01, label: 'Push from the voice' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

function bayer(x: number, y: number): number {
  let v = 0;
  for (let bit = 0; bit < 3; bit++) { const xb = (x >> bit) & 1, yb = (y >> bit) & 1; v |= ((xb ^ yb) << (2 * (2 - bit) + 1)) | (yb << (2 * (2 - bit))); }
  return (v + 0.5) / 64;
}

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, A = orBlank(context.inputs.a), B = isMosaic(context.inputs.b) ? context.inputs.b : orBlank(undefined, A.w, A.h);
  let t = Math.max(0, Math.min(1, props.amount));
  if (t > 0 && t < 1) t = Math.max(0, Math.min(1, t + props.driveGain * Math.max(0, context.inputs.drive || 0) * 4 * t * (1 - t)));
  if (t <= 0) { context.outputs.mosaic.set(A); return; }
  if (t >= 1) { context.outputs.mosaic.set(B); return; }
  const W = A.w, H = A.h, out = new Uint8Array(W * H), [cx, cy] = props.centre;
  const rmax = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) || 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = hash2(x, y, props.seed);
    let th: number;
    switch (props.field) {
      case 'radial': th = 0.85 * Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / rmax + 0.15 * n; break;
      case 'ordered': th = bayer(x & 7, y & 7); break;
      case 'rows': th = 0.8 * (y / H) + 0.2 * hash2(0, y, props.seed); break;
      case 'rain': th = 0.55 * (y / H) + 0.45 * hash2(x, 0, props.seed); break;
      default: th = n;
    }
    const i = y * W + x, j = y < B.h && x < B.w ? y * B.w + x : -1;
    out[i] = th < t && j >= 0 ? B.ink[j] : A.ink[i];
  }
  context.outputs.mosaic.set({ w: W, h: H, ink: out });
}
