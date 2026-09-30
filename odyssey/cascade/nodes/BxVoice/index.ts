/* project.BxVoice — the voice that drives the machine. Reads the Halfworld recording's envelope and segment timing (baked by
   tools/bake_voice.mjs from drive/voice/OD-B12-S03.m4a, drive/voice-manifest.json and drive/drive-script.json) at `time`
   (an expression, $T) and gives the graph: the amplitude now, the seconds of voice so far (the integral of the envelope), the
   words being spoken and how far through them, the segment's number, and whether anyone is speaking. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { decodeJson } from '../../lib/choreo';

export const definition = {
  apiVersion: 1,
  label: 'Voice',
  description: 'The recording as data: amplitude, voiced seconds so far, the line being spoken and its progress, at a time.',
  icon: 'AudioLines',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: {
    track: { type: 'asset', default: { path: 'assets/beflix/voice.json' }, label: 'Voice envelope (JSON)' },
    time: { type: 'float', default: 0, min: -10, max: 10000, step: 0.001, label: 'Time in the recording (s)' },
    hold: { type: 'float', default: 0.35, min: 0, max: 3, step: 0.01, label: 'Seconds a line stays after it is spoken' }
  },
  outputs: {
    amp: { kind: 'data', type: 'float' },
    spoken: { kind: 'data', type: 'float' },
    line: { kind: 'data', type: 'string' },
    progress: { kind: 'data', type: 'float' },
    seg: { kind: 'data', type: 'int' },
    speaking: { kind: 'data', type: 'float' },
    info: { kind: 'data', type: 'object' }
  }
} as const satisfies NodeDefinition;

type Track = { rate: number; env: string; total: number; segments: { start: number; dur: number; text: string; kind: string }[] };

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, v = decodeJson<Track>(await context.capabilities.assets.read(props.track, { signal: context.signal }));
  const n = v.env.length >> 1, at = (i: number) => parseInt(v.env.slice(2 * i, 2 * i + 2), 36) / 1295;
  const x = props.time * v.rate, i0 = Math.floor(x), f = x - i0;
  const amp = i0 < 0 || i0 >= n ? 0 : at(i0) * (1 - f) + (i0 + 1 < n ? at(i0 + 1) : 0) * f;
  let spoken = 0; for (let i = 0; i < Math.min(n, Math.max(0, i0)); i++) spoken += at(i) / v.rate;
  if (i0 >= 0 && i0 < n) spoken += at(i0) * f / v.rate;
  let seg = -1, progress = 0, line = '', speaking = 0;
  v.segments.forEach((s, k) => {
    if (props.time >= s.start && props.time < s.start + s.dur + props.hold) { seg = k; line = s.text; progress = Math.min(1, (props.time - s.start) / s.dur); speaking = props.time < s.start + s.dur ? 1 : 0; }
  });
  context.outputs.amp.set(amp); context.outputs.spoken.set(spoken); context.outputs.line.set(line);
  context.outputs.progress.set(progress); context.outputs.seg.set(seg); context.outputs.speaking.set(speaking);
  context.outputs.info.set({ time: Math.round(props.time * 1000) / 1000, amp: Math.round(amp * 1000) / 1000, spoken: Math.round(spoken * 100) / 100, seg, line, progress: Math.round(progress * 1000) / 1000 });
}
