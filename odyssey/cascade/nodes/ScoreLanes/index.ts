/* project.ScoreLanes — the place on the rig desk where a scene's score and its measurements attach: assets/rig/<scene>/score.json
   (format odyssey-score/0), a list of lanes on the take's clock, each one of
     envelope  values sampled at hz (the voice; any continuous signal: stimulus, intent strength)
     events    [{t, label}] (words, causes, contacts, cues)
     spans     [{t0, t1, label}] (actions, holds, intents)
     metric    values sampled at hz, with an optional range (a measurement of the performance: motion per drawing, heat, ...)
   tools/rig_import.mjs writes the voice lane; other tools add lanes by id (tools/rig_density.mjs --score adds each figure's motion
   as a metric). Out: the lanes as a 2D strip (ten units a second, one row each) for Studio's viewer, and the window around `time`
   for project.RigView, which draws every lane but the voice (the voice has its own strip) as a row under the picture. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { readJson } from '../../lib/rig';

export const definition = {
  apiVersion: 1,
  label: 'Score Lanes',
  description: 'The scene\'s score and metric tracks (voice, stimulus, intent, action, contact, measurements) as lanes on the take\'s clock: a strip, and the window at a time.',
  icon: 'Rows3',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: {
    track: { type: 'asset', default: { path: 'assets/rig/OD-B12-S03/score.json' }, label: 'Score (JSON, odyssey-score/0)' },
    time: { type: 'float', default: 0, expression: '$T', min: 0, max: 600, step: 0.001, label: 'Time (s)' },
    window: { type: 'float', default: 8, min: 1, max: 60, step: 0.5, label: 'Seconds shown around the playhead' },
    only: { type: 'string', default: '', label: 'Lanes to show (ids, comma separated; empty: all)' }
  },
  outputs: {
    geometry: { kind: 'data', type: 'geometry' },
    info: { kind: 'data', type: 'object' }
  }
} as const satisfies NodeDefinition;

type Lane = { id: string; label?: string; kind: 'envelope' | 'metric' | 'events' | 'spans'; hz?: number; values?: number[]; range?: number[]; events?: { t: number; label?: string }[]; spans?: { t0: number; t1: number; label?: string }[] };
type Score = { format: string; scene: string; total: number; lanes: Lane[] };

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, S = readJson<Score>(await context.capabilities.assets.read(p.track, { signal: context.signal })), t = p.time, half = p.window / 2;
  const want = p.only.split(',').map(s => s.trim()).filter(Boolean), lanes = S.lanes.filter(l => !want.length || want.includes(l.id));
  const gb = new GeometryBuilder({ positionSize: 3 }), cd: number[] = [];
  const add = (pts: number[][], c: number[]) => { gb.addPrimitive(pts.map(q => gb.addPoint(q[0], q[1], 0))); cd.push(...c); };
  const out: unknown[] = [];
  lanes.forEach((L, row) => {
    const y0 = -row * 30, lo = L.range ? L.range[0] : 0, hi = L.range ? L.range[1] : Math.max(1e-6, ...(L.values || [1]));
    const norm = (v: number) => (v - lo) / Math.max(1e-6, hi - lo);
    if (L.values && L.hz) {
      const pts: number[][] = []; for (let i = 0; i < L.values.length; i += Math.max(1, Math.round(L.hz / 25))) pts.push([i / L.hz * 10, y0 + norm(L.values[i]) * 20]);
      add(pts, L.kind === 'metric' ? [0.2, 0.45, 0.8, 1] : [0.2, 0.2, 0.22, 1]);
      const n = 160, win: number[] = []; for (let k = 0; k <= n; k++) { const x = (t - half + p.window * k / n) * L.hz, i = Math.floor(x); win.push(i >= 0 && i < L.values.length ? Math.round(norm(L.values[i]) * 1000) / 1000 : 0); }
      out.push({ id: L.id, label: L.label || L.id, kind: L.kind, window: win });
    } else if (L.events) {
      for (const e of L.events) add([[e.t * 10, y0], [e.t * 10, y0 + 20]], [0.6, 0.3, 0.1, 1]);
      out.push({ id: L.id, label: L.label || L.id, kind: L.kind, events: L.events.filter(e => e.t >= t - half && e.t <= t + half) });
    } else if (L.spans) {
      for (const s of L.spans) add([[s.t0 * 10, y0 + 10], [s.t1 * 10, y0 + 10]], [0.3, 0.55, 0.3, 1]);
      out.push({ id: L.id, label: L.label || L.id, kind: L.kind, spans: L.spans.filter(s => s.t1 >= t - half && s.t0 <= t + half) });
    }
  });
  add([[t * 10, 25], [t * 10, -lanes.length * 30]], [0.85, 0.1, 0.1, 1]);
  gb.setNumericAttribute('primitive', 'Cd', cd, 4);
  context.outputs.geometry.set(gb.build());
  context.outputs.info.set({ scene: S.scene, t: Math.round(t * 1000) / 1000, window: [t - half, t + half], lanes: out });
}
