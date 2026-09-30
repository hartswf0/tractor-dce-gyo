/* project.BxCopy — Knowlton's COPY: the cells of one region laid onto another, magnified `scale` times (nearest cell), from
   the field itself or from a second mosaic on `source` (a picture in the picture). Paper can be left out (`keyPaper`) so only
   ink lands, a frame of ink drawn round the copy, and `repeat` lays it again `step` further on each time. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { clampLevel, clone, isMosaic, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'COPY',
  description: 'Copy a region of cells (from the field or a second mosaic) to another place, magnified, keyed, framed, repeated.',
  icon: 'Copy',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' }, source: { kind: 'data', type: 'project.mosaic' } },
  props: {
    from: { type: 'vec4', default: [100, 60, 150, 100], min: -1024, max: 1024, step: 1, label: 'From [x0, y0, x1, y1] (cells)' },
    to: { type: 'vec2', default: [160, 10], min: -1024, max: 1024, step: 1, label: 'To, top left (cells)' },
    scale: { type: 'float', default: 1, min: 0.25, max: 16, step: 0.01, label: 'Magnification' },
    keyPaper: { type: 'bool', default: false, label: 'Leave paper out (ink only)' },
    border: { type: 'int', default: -1, min: -1, max: 7, label: 'Frame level (-1: none)' },
    repeat: { type: 'int', default: 1, min: 1, max: 32, label: 'Copies' },
    step: { type: 'vec2', default: [0, 0], min: -1024, max: 1024, step: 1, label: 'Step between copies (cells)' },
    on: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'On (at 0.5 and above)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, field = orBlank(context.inputs.field);
  if (props.on < 0.5) { context.outputs.mosaic.set(field); return; }
  const src = isMosaic(context.inputs.source) ? context.inputs.source : field, m = clone(field);
  const [a, b, c, d] = props.from.map(Math.round), x0 = Math.min(a, c), y0 = Math.min(b, d), w = Math.abs(c - a), h = Math.abs(d - b);
  const s = props.scale, W = Math.round(w * s), H = Math.round(h * s);
  for (let k = 0; k < props.repeat; k++) {
    const tx = Math.round(props.to[0] + props.step[0] * k), ty = Math.round(props.to[1] + props.step[1] * k);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const X = tx + x, Y = ty + y; if (X < 0 || Y < 0 || X >= m.w || Y >= m.h) continue;
      const sx = x0 + Math.floor(x / s), sy = y0 + Math.floor(y / s);
      const v = sx >= 0 && sy >= 0 && sx < src.w && sy < src.h ? src.ink[sy * src.w + sx] : 0;
      if (props.keyPaper && v === 0) continue;
      m.ink[Y * m.w + X] = v;
    }
    if (props.border >= 0) {
      const L = clampLevel(props.border);
      for (let x = -1; x <= W; x++) for (const y of [-1, H]) { const X = tx + x, Y = ty + y; if (X >= 0 && Y >= 0 && X < m.w && Y < m.h) m.ink[Y * m.w + X] = L; }
      for (let y = -1; y <= H; y++) for (const x of [-1, W]) { const X = tx + x, Y = ty + y; if (X >= 0 && Y >= 0 && X < m.w && Y < m.h) m.ink[Y * m.w + X] = L; }
    }
  }
  context.outputs.mosaic.set(m);
}
