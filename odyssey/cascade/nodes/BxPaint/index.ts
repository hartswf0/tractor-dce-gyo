/* project.BxPaint — Knowlton's PAINT: fill a region of the mosaic with an ink level, by one of the combining rules
   (set, darken, lighten, add, sub, invert, xor). The region is a rectangle of cells, the ellipse inside it, or its frame. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { clone, combine, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'PAINT',
  description: 'Fill a region of cells (rectangle, ellipse or frame) with an ink level by a combining rule.',
  icon: 'PaintBucket',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' } },
  props: {
    region: { type: 'vec4', default: [0, 0, 252, 184], min: -1024, max: 1024, step: 1, label: 'Region [x0, y0, x1, y1] (cells)' },
    shape: { type: 'string', default: 'rect', control: 'select', options: ['rect', 'ellipse', 'frame'], label: 'Shape' },
    thickness: { type: 'int', default: 2, min: 1, max: 64, label: 'Frame thickness' },
    level: { type: 'int', default: 0, min: 0, max: 7, label: 'Ink level' },
    mode: { type: 'string', default: 'set', control: 'select', options: ['set', 'darken', 'lighten', 'add', 'sub', 'invert', 'xor'], label: 'Rule' },
    on: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'On (at 0.5 and above)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, src = orBlank(context.inputs.field);
  if (props.on < 0.5) { context.outputs.mosaic.set(src); return; }
  const m = clone(src), [a, b, c, d] = props.region.map(Math.round), x0 = Math.min(a, c), x1 = Math.max(a, c), y0 = Math.min(b, d), y1 = Math.max(b, d);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2, t = props.thickness;
  for (let y = Math.max(0, y0); y < Math.min(m.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(m.w, x1); x++) {
    if (props.shape === 'ellipse') { const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v > 1) continue; }
    if (props.shape === 'frame' && x >= x0 + t && x < x1 - t && y >= y0 + t && y < y1 - t) continue;
    const i = y * m.w + x; m.ink[i] = combine(m.ink[i], props.level, props.mode);
  }
  context.outputs.mosaic.set(m);
}
