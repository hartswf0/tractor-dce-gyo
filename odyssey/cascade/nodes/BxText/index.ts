/* project.BxText — Knowlton's TEXT: words set in the mosaic's own letters (a 5 x 7 cell font, each font cell magnified `size`
   times), broken into lines of `wrap` characters. Wired from BxVoice, `line` is what the narrator is saying and `progress`
   how far through it he is, so the words are typed as they are spoken. A `band` of paper can be laid under the lines. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { clone, drawGlyph, orBlank, textLayout } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'TEXT',
  description: 'Set words in mosaic letters (5 x 7 cells, magnified), revealed with the voice.',
  icon: 'Type',
  runsOn: 'portable',
  inputs: {
    field: { kind: 'data', type: 'project.mosaic' },
    line: { kind: 'data', type: 'string', default: '' },
    progress: { kind: 'data', type: 'float', default: 1 }
  },
  props: {
    text: { type: 'string', default: 'BEFLIX', label: 'Text (the wired line replaces it)' },
    position: { type: 'vec2', default: [126, 80], min: -1024, max: 1024, step: 1, label: 'Position (cells; x is the centre when centred)' },
    align: { type: 'string', default: 'center', control: 'select', options: ['left', 'center'], label: 'Align' },
    size: { type: 'int', default: 2, min: 1, max: 16, label: 'Cell magnification' },
    wrap: { type: 'int', default: 0, min: 0, max: 200, label: 'Characters a line (0: one line)' },
    leading: { type: 'int', default: 2, min: 0, max: 32, label: 'Cells between lines' },
    level: { type: 'int', default: 7, min: 0, max: 7, label: 'Ink level' },
    mode: { type: 'string', default: 'set', control: 'select', options: ['set', 'darken', 'lighten', 'add', 'sub', 'invert', 'xor'], label: 'Rule' },
    band: { type: 'int', default: -1, min: -1, max: 7, label: 'Band under the lines (level; -1 none)' },
    reveal: { type: 'string', default: 'words', control: 'select', options: ['all', 'chars', 'words'], label: 'Reveal by progress' },
    on: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'On (at 0.5 and above)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props, inputs } = context, src = orBlank(inputs.field);
  const text = (inputs.line && String(inputs.line).trim()) || props.text;
  if (props.on < 0.5 || !text) { context.outputs.mosaic.set(src); return; }
  const m = clone(src), s = props.size, lines = textLayout(text, props.wrap), flat = lines.join(' '), total = flat.length;
  const p = Math.max(0, Math.min(1, inputs.progress ?? 1));
  /* how many characters are shown: all, a proportion, or up to the end of the word the proportion falls in */
  let shown = total;
  if (props.reveal !== 'all') {
    shown = Math.round(p * total);
    if (props.reveal === 'words') { while (shown > 0 && shown < flat.length && flat[shown] !== ' ') shown++; }
  }
  const lh = 7 * s + props.leading, y0 = Math.round(props.position[1]);
  if (props.band >= 0) {
    const wmax = Math.max(...lines.map(l => l.length)) * 6 * s, bx0 = props.align === 'center' ? Math.round(props.position[0] - wmax / 2) : Math.round(props.position[0]);
    for (let y = Math.max(0, y0 - s - 1); y < Math.min(m.h, y0 + lines.length * lh + s); y++)
      for (let x = Math.max(0, bx0 - 2 * s - 1); x < Math.min(m.w, bx0 + wmax + 2 * s); x++) m.ink[y * m.w + x] = props.band;
  }
  let k = 0;
  lines.forEach((line, r) => {
    const w = line.length * 6 * s - s, x0 = props.align === 'center' ? Math.round(props.position[0] - w / 2) : Math.round(props.position[0]);
    for (let i = 0; i < line.length; i++, k++) if (k < shown) drawGlyph(m, line[i], x0 + i * 6 * s, y0 + r * lh, s, props.level, props.mode);
    k++;
  });
  context.outputs.mosaic.set(m);
}
