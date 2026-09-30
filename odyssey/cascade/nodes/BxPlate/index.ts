/* project.BxPlate — Halfworld as BEFLIX footage. A layer of the Sirens' scene (drawn by Halfworld's own asset programs and
   staged by the scene's own stage(), baked by tools/bake_halfworld.mjs into ink levels) laid onto the mosaic: cells the
   program painted replace what is there, cells it left alone let the field show through. `states` lists the layer's baked
   states in the order `phase` walks them (so an expression on phase animates a stroke cycle), `pan` moves it across in
   cells (a keyframe channel on the island), `offset` places it. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { asciiJson, clone, decodeRuns, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'Halfworld Plate',
  description: 'A baked Halfworld layer (asset program + scene staging, quantized to ink 0-7) posed by state and moved in cells.',
  icon: 'Clapperboard',
  runsOn: 'portable',
  capabilities: ['assets'],
  inputs: { field: { kind: 'data', type: 'project.mosaic' } },
  props: {
    bank: { type: 'asset', default: { path: 'assets/beflix/plates/island.json' }, label: 'Baked layer (JSON, assets/beflix/plates/)' },
    layer: { type: 'string', default: 'island', control: 'select', options: ['island', 'sirens', 'crew', 'mast', 'odysseus', 'cu_odysseus', 'cu_sirens', 'mcu_crew'], label: 'Layer' },
    states: { type: 'string', default: '', label: 'States walked by phase (comma list; empty: the first)' },
    phase: { type: 'float', default: 0, min: 0, max: 64, step: 0.01, label: 'Phase (index into states)' },
    offset: { type: 'vec2', default: [0, 0], min: -512, max: 512, step: 1, label: 'Offset (cells)' },
    pan: { type: 'float', default: 0, min: -512, max: 512, step: 0.1, label: 'Pan across (cells)' },
    show: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'Shown (0 hides the layer)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' }, info: { kind: 'data', type: 'object' } }
} as const satisfies NodeDefinition;

type Bank = { mosaic: [number, number]; layers: Record<string, { states: Record<string, { x: number; y: number; w: number; h: number; runs: string }> }> };

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, out = clone(orBlank(context.inputs.field));
  if (props.show < 0.5) { context.outputs.mosaic.set(out); context.outputs.info.set({ layer: props.layer, state: null }); return; }
  const bank = asciiJson<Bank>(await context.capabilities.assets.read(props.bank, { signal: context.signal }));
  const layer = bank.layers[props.layer] ?? Object.values(bank.layers)[0];
  const names = props.states.split(',').map(s => s.trim()).filter(s => s && layer.states[s]);
  const keys = names.length ? names : [Object.keys(layer.states)[0]];
  const key = keys[((Math.floor(props.phase) % keys.length) + keys.length) % keys.length], st = layer.states[key];
  const cells = decodeRuns(st.runs, st.w * st.h);
  const ox = Math.round(st.x + props.offset[0] + props.pan), oy = Math.round(st.y + props.offset[1]);
  for (let y = 0; y < st.h; y++) {
    const Y = y + oy; if (Y < 0 || Y >= out.h) continue;
    for (let x = 0; x < st.w; x++) {
      const X = x + ox, v = cells[y * st.w + x];
      if (v === 8 || X < 0 || X >= out.w) continue;
      out.ink[Y * out.w + X] = v;
    }
  }
  context.outputs.mosaic.set(out);
  context.outputs.info.set({ layer: props.layer, state: key, box: [ox, oy, st.w, st.h] });
}
