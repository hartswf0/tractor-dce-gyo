/* project.VoiceTrack — the scene's voice as a track to key against: the recording's envelope on the take's clock (50 Hz, from the
   marks), each clip's words placed through it, the lines and who speaks them. Out: the strip as 2D geometry (the whole scene, ten
   units a second: the envelope, a tick per word, the lines as bars, the playhead), and at `time` the amplitude, the word being said,
   the line, and a window of the envelope for the previz (project.RigView draws it under the picture). */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { readJson } from '../../lib/rig';

export const definition = {
  apiVersion: 1,
  label: 'Voice Track',
  description: 'The scene\'s recorded voice on the take\'s clock: envelope, words and lines as a strip to key against, and what is said at a time.',
  icon: 'AudioLines',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: {
    track: { type: 'asset', default: { path: 'assets/rig/OD-B12-S03/scene.json' }, label: 'Scene (JSON)' },
    time: { type: 'float', default: 0, expression: '$T', min: 0, max: 600, step: 0.001, label: 'Time (s)' },
    window: { type: 'float', default: 8, min: 1, max: 60, step: 0.5, label: 'Seconds of voice shown around the playhead' }
  },
  outputs: {
    geometry: { kind: 'data', type: 'geometry' },
    amp: { kind: 'data', type: 'float' },
    word: { kind: 'data', type: 'string' },
    line: { kind: 'data', type: 'string' },
    info: { kind: 'data', type: 'object' }
  }
} as const satisfies NodeDefinition;

type Scene = { scene: string; title: string; total: number; hz: number; env: number[]; clips: { at: number; dur: number; caption: string; who: string; kind: string }[]; words: { t: number; w: string }[]; shots: { t: number; kind: string }[] };

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, S = readJson<Scene>(await context.capabilities.assets.read(p.track, { signal: context.signal })), t = p.time;
  const envAt = (x: number) => { const i = x * S.hz, i0 = Math.floor(i), f = i - i0, a = S.env[i0] ?? 0, b = S.env[i0 + 1] ?? 0; return i0 < 0 ? 0 : a + (b - a) * f; };
  /* the strip: ten units a second, the envelope 20 high */
  const gb = new GeometryBuilder({ positionSize: 3 }), cd: number[] = [], add = (pts: number[][], c: number[], closed = false) => { gb.addPrimitive(pts.map(q => gb.addPoint(q[0], q[1], 0)), { closed }); cd.push(...c); };
  const n = Math.floor(S.total * S.hz), env: number[][] = [];
  for (let i = 0; i <= n; i += 2) env.push([i / S.hz * 10, (S.env[i] || 0) * 20]);
  add(env, [0.2, 0.2, 0.22, 1]);
  for (const c of S.clips) add([[c.at * 10, -3], [(c.at + c.dur) * 10, -3], [(c.at + c.dur) * 10, -1], [c.at * 10, -1]], c.who ? [0.85, 0.45, 0.1, 1] : [0.45, 0.45, 0.5, 1], true);
  for (const w of S.words) add([[w.t * 10, 0], [w.t * 10, 22]], [0.6, 0.6, 0.64, 1]);
  for (const s of S.shots) add([[s.t * 10, -6], [s.t * 10, 24]], [0.2, 0.45, 0.8, 1]);
  add([[t * 10, -8], [t * 10, 26]], [0.85, 0.1, 0.1, 1]);
  gb.setNumericAttribute('primitive', 'Cd', cd, 4);
  context.outputs.geometry.set(gb.build());
  const clip = S.clips.find(c => t >= c.at && t <= c.at + c.dur + 0.3) || null;
  let word = ''; for (const w of S.words) if (w.t <= t && t - w.t < 0.6 && clip && w.t >= clip.at) word = w.w;
  const half = p.window / 2, win: number[] = []; for (let k = 0; k <= 160; k++) win.push(Math.round(envAt(t - half + p.window * k / 160) * 1000) / 1000);
  context.outputs.amp.set(envAt(t)); context.outputs.word.set(word); context.outputs.line.set(clip ? clip.caption : '');
  context.outputs.info.set({ scene: S.scene, title: S.title, t: Math.round(t * 1000) / 1000, total: S.total, word, line: clip ? clip.caption : '', who: clip ? clip.who : '', window: [t - half, t + half], env: win,
    words: S.words.filter(w => w.t >= t - half && w.t <= t + half), clips: S.clips.filter(c => c.at + c.dur >= t - half && c.at <= t + half), shots: S.shots.filter(s => s.t >= t - half && s.t <= t + half),
    shot: [...S.shots].reverse().find(s => s.t <= t + 1e-6)?.kind || '' });
}
