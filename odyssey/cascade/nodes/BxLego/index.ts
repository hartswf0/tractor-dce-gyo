/* project.BxLego — every frame a buildable LEGO mosaic. The mosaic is resampled to a tile grid (cover-fitted, the mean
   darkness of the cells under each stud), the ink levels mapped to real LEGO colours (lib/mosaic.ts legoRamp: White, Tan,
   Light Bluish Grey, Dark Tan, Dark Bluish Grey, Black), one 1 x 1 round tile (98138) per stud on 48 x 48 baseplates (4186).
   The info output counts the pieces: tiles per colour, plates, the total. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { clampLevel, legoColor, legoRamp, orBlank, type Lego } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'LEGO Mosaic',
  description: 'The mosaic as 1 x 1 round LEGO tiles on 48 x 48 baseplates, at a chosen resolution, with a live parts count.',
  icon: 'Blocks',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' } },
  props: {
    studs: { type: 'vec2i', default: [96, 64], min: 8, max: 512, label: 'Studs across, down' },
    ramp: { type: 'string', default: 'paper', control: 'select', options: ['paper', 'grey', 'two'], label: 'Colour ramp' }
  },
  outputs: { lego: { kind: 'data', type: 'project.lego' }, info: { kind: 'data', type: 'object' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const m = orBlank(context.inputs.field), [w, h] = context.props.studs.map(v => Math.max(1, Math.round(v))) as [number, number];
  const ramp = legoRamp(context.props.ramp);
  /* cover: the scale that fills the tile grid, the source window centred */
  const s = Math.min(m.w / w, m.h / h), sx0 = (m.w - s * w) / 2, sy0 = (m.h - s * h) / 2;
  const colors = new Uint16Array(w * h), counts: Record<string, number> = {};
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a0 = sx0 + x * s, a1 = a0 + s, b0 = sy0 + y * s, b1 = b0 + s;
    let sum = 0, wt = 0;
    for (let cy = Math.floor(b0); cy < Math.ceil(b1); cy++) for (let cx = Math.floor(a0); cx < Math.ceil(a1); cx++) {
      if (cx < 0 || cy < 0 || cx >= m.w || cy >= m.h) continue;
      const k = (Math.min(cx + 1, a1) - Math.max(cx, a0)) * (Math.min(cy + 1, b1) - Math.max(cy, b0));
      if (k > 0) { sum += m.ink[cy * m.w + cx] * k; wt += k; }
    }
    const code = ramp[clampLevel(wt ? sum / wt : 0)];
    colors[y * w + x] = code; counts[code] = (counts[code] || 0) + 1;
  }
  const plates: [number, number] = [Math.ceil(w / 48), Math.ceil(h / 48)];
  const lego: Lego = { w, h, colors, plates, counts };
  context.outputs.lego.set(lego);
  const tiles = Object.entries(counts).map(([code, n]) => ({ code: +code, name: legoColor(+code).name, part: '98138', n })).sort((a, b) => b.n - a.n);
  context.outputs.info.set({ studs: [w, h], plates: plates[0] * plates[1], platesAcross: plates, platePart: '4186', tilePart: '98138', tiles, tileCount: w * h, pieces: w * h + plates[0] * plates[1] });
}
