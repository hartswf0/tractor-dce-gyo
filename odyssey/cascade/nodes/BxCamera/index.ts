/* project.BxCamera — BEFLIX's camera: photographs the mosaic. Knowlton's machine never kept a picture, only the grid; the
   Stromberg-Carlson 4020 microfilm recorder photographed it frame by frame. Three looks of the same frame:
     cells     the 1963 film grain: each cell a square of its ink level (Halfworld's inkLevel grey) on the mosaic's grid;
     halftone  Halfworld's post-pass ported (engine/halfworld-engine.mjs dotifyField): black dots on warm paper, one per cell,
               radius d^0.9 x cell x 0.62 x gain after the ink law's floor (0.20) and S-curve, over a faint lattice;
     lego      the LEGO mosaic from a BxLego node: 1 x 1 round tiles in real LEGO colours on a baseplate.
   `gain` (the dot gain, and in cells a darkening) is the ink density: the voice's amplitude wired in raises it. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { orBlank, type Lego } from '../../lib/mosaic';
import { photographCells, photographHalftone, photographLego } from '../../lib/camera';

export const definition = {
  apiVersion: 1,
  label: 'BEFLIX Camera',
  description: 'Photograph a mosaic as BEFLIX cells, as Halfworld halftone dots on paper, or as a LEGO tile mosaic.',
  icon: 'Camera',
  runsOn: 'portable',
  capabilities: ['assets'],
  inputs: {
    field: { kind: 'data', type: 'project.mosaic' },
    lego: { kind: 'data', type: 'project.lego' },
    drive: { kind: 'data', type: 'float', default: 0 }
  },
  props: {
    mode: { type: 'string', default: 'halftone', control: 'select', options: ['cells', 'halftone', 'lego'], label: 'Look' },
    cell: { type: 'int', default: 4, min: 1, max: 16, label: 'Pixels per cell' },
    gain: { type: 'float', default: 1, min: 0.2, max: 2, step: 0.01, label: 'Ink gain' },
    driveGain: { type: 'float', default: 0.35, min: 0, max: 2, step: 0.01, label: 'Gain added at full voice' },
    grid: { type: 'float', default: 0.14, min: 0, max: 0.6, step: 0.01, label: 'Cell grid (cells look)' },
    filename: { type: 'string', default: 'beflix.png' }
  },
  outputs: { image: { kind: 'data', type: 'image' }, asset: { kind: 'data', type: 'asset' } }
} as const satisfies NodeDefinition;

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, m = orBlank(context.inputs.field), c = Math.max(1, Math.round(props.cell));
  const W = m.w * c, H = m.h * c, drive = Math.max(0, context.inputs.drive || 0), gain = props.gain * (1 + props.driveGain * drive);
  const lego = context.inputs.lego as Lego | undefined;
  const px = props.mode === 'lego' && lego && lego.colors ? photographLego(lego, W, H)
    : props.mode === 'cells' ? photographCells(m, c, props.grid, Math.round((gain - 1) * 3))
    : photographHalftone(m, c, gain);
  const canvas = new OffscreenCanvas(W, H), g = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  const img = g.createImageData(W, H); img.data.set(px); g.putImageData(img, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/png' }), bytes = new Uint8Array(await blob.arrayBuffer());
  const asset = await context.capabilities.assets.write(bytes, { mediaType: 'image/png', suggestedName: props.filename }, { signal: context.signal });
  context.outputs.asset.set(asset);
  context.outputs.image.set({ path: asset.path ?? props.filename, size: [W, H], channels: 'rgba', depth: 'u8', space: 'srgb' });
}
