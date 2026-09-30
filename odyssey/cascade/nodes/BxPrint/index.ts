/* project.BxPrint — the print: a mosaic written as an SVG of Halfworld's halftone, one disc per inked cell (the ink law's floor
   and S-curve, radius d^0.9 x cell x 0.62), on paper, each ink level one group of <use> references to one disc, so the file
   stays small and every dot stays a vector a plotter or a printer can take. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { inkGrade, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'Print (SVG)',
  description: 'Write the mosaic as an SVG halftone: one vector disc per inked cell, grouped by ink level.',
  icon: 'Printer',
  runsOn: 'portable',
  capabilities: ['assets'],
  inputs: { field: { kind: 'data', type: 'project.mosaic' } },
  props: {
    cell: { type: 'float', default: 4, min: 1, max: 40, step: 0.5, label: 'Units per cell' },
    gain: { type: 'float', default: 1, min: 0.2, max: 2, step: 0.01, label: 'Ink gain' },
    filename: { type: 'string', default: 'beflix-print.svg' }
  },
  outputs: { svg: { kind: 'data', type: 'string' }, asset: { kind: 'data', type: 'asset' } }
} as const satisfies NodeDefinition;

function encodeUtf8(s: string): Uint8Array {
  const b = unescape(encodeURIComponent(s)), out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out;
}

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, m = orBlank(context.inputs.field), c = props.cell, W = m.w * c, H = m.h * c;
  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">`,
    `<rect width="${W}" height="${H}" fill="#fdfdfa"/>`, '<defs>'];
  const radii: number[] = [];
  for (let l = 0; l <= 7; l++) {
    const d = l / 7; radii[l] = d < 0.2 ? 0 : Math.pow(inkGrade(d), 0.9) * c * 0.62 * props.gain;
    if (radii[l] > 0.05) parts.push(`<circle id="d${l}" r="${radii[l].toFixed(2)}"/>`);
  }
  parts.push('</defs>');
  for (let l = 1; l <= 7; l++) {
    if (!(radii[l] > 0.05)) continue;
    const g: string[] = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.ink[y * m.w + x] === l) g.push(`<use xlink:href="#d${l}" x="${+(x * c + c / 2).toFixed(1)}" y="${+(y * c + c / 2).toFixed(1)}"/>`);
    if (g.length) parts.push(`<g fill="#0a0a0a" data-level="${l}">${g.join('')}</g>`);
  }
  parts.push('</svg>');
  const svg = parts.join('\n');
  const asset = await context.capabilities.assets.write(encodeUtf8(svg), { mediaType: 'image/svg+xml', suggestedName: props.filename }, { signal: context.signal });
  context.outputs.svg.set(svg); context.outputs.asset.set(asset);
}
