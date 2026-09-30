/* project.BxMosaic — a BEFLIX frame: w x h cells (Knowlton's 252 x 184), every cell at one ink level. Where a film starts. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { blank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'BEFLIX Mosaic',
  description: 'A fresh mosaic of cells, each holding an ink level 0 (paper) to 7 (solid ink).',
  icon: 'Grid3x3',
  runsOn: 'portable',
  props: {
    size: { type: 'vec2i', default: [252, 184], min: 1, max: 1024, label: 'Cells across, down' },
    level: { type: 'int', default: 0, min: 0, max: 7, label: 'Ink level' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const [w, h] = context.props.size;
  context.outputs.mosaic.set(blank(w, h, context.props.level));
}
