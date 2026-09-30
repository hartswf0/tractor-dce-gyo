/* project.BxLine — Knowlton's LINE: a line of cells from one point to another (Bresenham), `width` cells thick. With `rays`
   it is a fan of lines from one point toward a spread about the other, and with `dash` the ink marches along it by `phase`:
   the Sirens' song reaching the ship. The voice wired to `drive` lengthens the dashes. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { clone, combine, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'LINE',
  description: 'A line (or a fan of rays) of cells between two points, solid or dashed and marching.',
  icon: 'Slash',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' }, drive: { kind: 'data', type: 'float', default: 0 } },
  props: {
    from: { type: 'vec2', default: [20, 20], min: -1024, max: 1024, step: 1, label: 'From (cells)' },
    to: { type: 'vec2', default: [230, 160], min: -1024, max: 1024, step: 1, label: 'To (cells)' },
    rays: { type: 'int', default: 1, min: 1, max: 64, label: 'Rays' },
    spread: { type: 'float', default: 0, min: 0, max: 400, step: 1, label: 'Spread at the far end (cells)' },
    width: { type: 'int', default: 1, min: 1, max: 16, label: 'Width (cells)' },
    dash: { type: 'int', default: 0, min: 0, max: 64, label: 'Dash period (0: solid)' },
    phase: { type: 'float', default: 0, min: -10000, max: 10000, step: 0.1, label: 'Dash phase (cells)' },
    level: { type: 'int', default: 7, min: 0, max: 7, label: 'Ink level' },
    mode: { type: 'string', default: 'set', control: 'select', options: ['set', 'darken', 'lighten', 'add', 'sub', 'invert', 'xor'], label: 'Rule' },
    on: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'On (at 0.5 and above)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, src = orBlank(context.inputs.field);
  if (props.on < 0.5) { context.outputs.mosaic.set(src); return; }
  const m = clone(src), n = Math.max(1, props.rays), drive = Math.max(0, Math.min(1, context.inputs.drive || 0));
  const [ax, ay] = props.from, [bx, by] = props.to, len = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / len, ny = (bx - ax) / len;
  const hit = new Uint8Array(m.w * m.h), P = props.dash, on = P > 0 ? Math.max(1, Math.round(P * (0.35 + 0.5 * drive))) : 0;
  for (let k = 0; k < n; k++) {
    const u = n === 1 ? 0 : k / (n - 1) - 0.5, tx = bx + nx * u * props.spread, ty = by + ny * u * props.spread;
    let x = Math.round(ax), y = Math.round(ay); const x1 = Math.round(tx), y1 = Math.round(ty);
    const dx = Math.abs(x1 - x), dy = -Math.abs(y1 - y), sx = x < x1 ? 1 : -1, sy = y < y1 ? 1 : -1;
    let err = dx + dy, step = 0;
    for (;;) {
      const s = step - props.phase;
      if (!P || ((s % P) + P) % P < on) {
        for (let wy = 0; wy < props.width; wy++) for (let wx = 0; wx < props.width; wx++) {
          const X = x + wx - (props.width >> 1), Y = y + wy - (props.width >> 1);
          if (X >= 0 && Y >= 0 && X < m.w && Y < m.h && !hit[Y * m.w + X]) { const i = Y * m.w + X; hit[i] = 1; m.ink[i] = combine(m.ink[i], props.level, props.mode); }
        }
      }
      if (x === x1 && y === y1) break;
      const e2 = 2 * err; if (e2 >= dy) { err += dy; x += sx; } if (e2 <= dx) { err += dx; y += sy; }
      step++;
    }
  }
  context.outputs.mosaic.set(m);
}
