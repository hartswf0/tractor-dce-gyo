/* project.BxPoemField — after Knowlton and VanDerBeek's Poem Fields (1964-67, made in BEFLIX): words carried through a
   patterned field. Here the Sirens' song goes out from their mouths toward the ship as rings of mosaic letters, each ring a
   run of the text laid along an arc of the fan, born at the origin and travelling out, the letters spreading as the ring
   widens, a thin inverted band between rings. The rings travel by `clock` (wired from BxVoice's `spoken`, the seconds of
   voice so far, so the song moves only while the voice sounds) plus `time`; the voice on `drive` flickers the letters and
   darkens the bands. The letters are written by a combining rule (xor by default), so they read on paper and on ink. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { clone, combine, drawGlyph, hash2, orBlank } from '../../lib/mosaic';

export const definition = {
  apiVersion: 1,
  label: 'Poem Field',
  description: 'Rings of mosaic letters travelling out from an origin across a fan, with inverted bands between them.',
  icon: 'Waves',
  runsOn: 'portable',
  inputs: { field: { kind: 'data', type: 'project.mosaic' }, clock: { kind: 'data', type: 'float', default: 0 }, drive: { kind: 'data', type: 'float', default: 0 } },
  props: {
    text: { type: 'string', default: 'COME HERE', label: 'Text' },
    origin: { type: 'vec2', default: [60, 40], min: -1024, max: 1024, step: 1, label: 'Origin (cells)' },
    direction: { type: 'float', default: 30, min: -360, max: 360, step: 1, label: 'Direction (degrees, y down)' },
    spread: { type: 'float', default: 120, min: 5, max: 360, step: 1, label: 'Fan (degrees)' },
    time: { type: 'float', default: 0, min: -1000, max: 1000, step: 0.01, label: 'Time (s)' },
    clockGain: { type: 'float', default: 1, min: 0, max: 10, step: 0.01, label: 'Seconds of travel a voiced second' },
    speed: { type: 'float', default: 18, min: 0, max: 400, step: 0.1, label: 'Speed (cells a second)' },
    spacing: { type: 'float', default: 14, min: 4, max: 200, step: 0.5, label: 'Cells between rings' },
    chars: { type: 'int', default: 16, min: 1, max: 200, label: 'Letters a ring' },
    size: { type: 'int', default: 1, min: 1, max: 8, label: 'Letter magnification' },
    level: { type: 'int', default: 7, min: 0, max: 7, label: 'Ink level' },
    mode: { type: 'string', default: 'xor', control: 'select', options: ['set', 'darken', 'lighten', 'add', 'sub', 'invert', 'xor'], label: 'Rule' },
    bands: { type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Bands between rings' },
    fade: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'Letters kept' },
    flicker: { type: 'float', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Letters that sound only with the voice' },
    seed: { type: 'int', default: 12, min: 0, max: 100000, label: 'Seed' },
    on: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'On (at 0.5 and above)' }
  },
  outputs: { mosaic: { kind: 'data', type: 'project.mosaic' }, info: { kind: 'data', type: 'object' } }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const { props, inputs } = context, src = orBlank(inputs.field);
  if (props.on < 0.5 || props.fade <= 0) { context.outputs.mosaic.set(src); context.outputs.info.set({ rings: 0, letters: 0 }); return; }
  const m = clone(src), drive = Math.max(0, Math.min(1, inputs.drive || 0));
  const t = props.time + props.clockGain * (inputs.clock || 0), dist = props.speed * t, gap = props.spacing, s = props.size;
  const text = props.text.toUpperCase().replace(/\s+/g, ' ').trim() + '   ', n = Math.max(1, props.chars);
  const [ox, oy] = props.origin, dir = props.direction * Math.PI / 180, half = props.spread * Math.PI / 360;
  const rmax = Math.hypot(Math.max(ox, m.w - ox), Math.max(oy, m.h - oy)) + 8;
  /* the bands: thin inverted arcs midway between rings, inside the fan, as strong as the voice */
  const bandW = props.bands * (0.35 + 0.65 * drive) * 0.22;
  if (bandW > 0.01) for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const dx = x + 0.5 - ox, dy = y + 0.5 - oy, r = Math.hypot(dx, dy); if (r < 4 || r > dist) continue;
    let a = Math.atan2(dy, dx) - dir; a = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(a) > half) continue;
    const ph = (((dist - r) / gap + 0.5) % 1 + 1) % 1;
    if (ph < bandW) { const i = y * m.w + x; m.ink[i] = combine(m.ink[i], 7, 'xor'); }
  }
  /* the rings: ring k was born when the song had travelled k * spacing; it is now dist - k * spacing out */
  let rings = 0, letters = 0;
  const k0 = Math.max(0, Math.floor((dist - rmax) / gap)), k1 = Math.floor((dist - 6) / gap);
  for (let k = k0; k <= k1; k++) {
    const r = dist - k * gap; if (r < 6 || r > rmax) continue;
    rings++;
    const dθ = Math.max((6 * s * 1.1) / r, (2 * half) / n);          /* the fan's share, or no closer than a letter's width */
    for (let i = 0; i < n; i++) {
      const idx = (k * n + i) % text.length, ch = text[idx]; if (ch === ' ') continue;
      const h = hash2(k, i, props.seed);
      if (h > props.fade) continue;
      if (hash2(i, k, props.seed + 1) < props.flicker && drive < 0.18) continue;
      const θ = dir + (i - (n - 1) / 2) * dθ; if (Math.abs(θ - dir) > half + 1e-6) continue;
      const x = ox + r * Math.cos(θ) - 2.5 * s, y = oy + r * Math.sin(θ) - 3.5 * s;
      if (x < -6 * s || y < -8 * s || x > m.w || y > m.h) continue;
      drawGlyph(m, ch, x, y, s, props.level, props.mode); letters++;
    }
  }
  context.outputs.mosaic.set(m);
  context.outputs.info.set({ rings, letters, travelled: Math.round(dist) });
}
