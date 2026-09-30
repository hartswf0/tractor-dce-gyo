/* project.RigView — the previz frame: the rigs and the set seen through a cascade.core.Camera (its basis and lens from Cascade's own
   camera functions), the figures' boxes filled back to front and lit flat, held props and the set as lines, and under the picture the
   voice (project.VoiceTrack's window: envelope, words, lines, cuts) with the playhead, so a key can be set against the word. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { cameraBasis, frameAspect, verticalFov } from 'cascade/runtime';
import { attr, pointAt, primPoints } from '../../lib/geo';

export const definition = {
  apiVersion: 1,
  label: 'Rig View',
  description: 'The previz: rigs and set through a camera (filled boxes back to front, lines), with the voice strip and the playhead under the picture.',
  icon: 'Clapperboard',
  runsOn: 'portable',
  capabilities: ['assets'],
  inputs: {
    geometry: { kind: 'data', type: 'geometry' },
    camera: { kind: 'data', type: 'camera' },
    voice: { kind: 'data', type: 'object' }
  },
  props: {
    size: { type: 'vec2i', default: [960, 640], min: 16, max: 4096, label: 'Size (the picture is 16:9 over the strip)' },
    strip: { type: 'bool', default: true, label: 'Voice strip' },
    background: { type: 'color', default: [0.93, 0.93, 0.91, 1] },
    label: { type: 'string', default: '', label: 'Title' },
    filename: { type: 'string', default: 'previz.png' }
  },
  outputs: { image: { kind: 'data', type: 'image' }, asset: { kind: 'data', type: 'asset' } }
} as const satisfies NodeDefinition;

function css(c: readonly number[], k = 1): string { return `rgba(${Math.round(Math.min(1, c[0] * k) * 255)},${Math.round(Math.min(1, c[1] * k) * 255)},${Math.round(Math.min(1, c[2] * k) * 255)},${c[3] ?? 1})`; }

type Voice = { t: number; total: number; word: string; line: string; who: string; window: number[]; env: number[]; words: { t: number; w: string }[]; clips: { at: number; dur: number; who: string }[]; shots: { t: number; kind: string }[]; shot: string; title: string; scene: string };

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, g = context.inputs.geometry, cam = context.inputs.camera, V = context.inputs.voice as unknown as Voice | undefined;
  const [W, Htot] = p.size, SH = p.strip ? Math.round(Htot - W * 9 / 16) : 0, H = Htot - SH;
  const canvas = new OffscreenCanvas(W, Htot), ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.fillStyle = css(p.background); ctx.fillRect(0, 0, W, H);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const light = [0.35, 0.85, 0.4], ln = Math.hypot(light[0], light[1], light[2]);
  if (g && cam) {
    const B = cameraBasis(cam), k = 1 / Math.tan(verticalFov(cam) * Math.PI / 360), asp = frameAspect(cam);
    const proj = (v: number[]) => { const d = [v[0] - B.eye[0], v[1] - B.eye[1], v[2] - B.eye[2]], z = d[0] * B.forward[0] + d[1] * B.forward[1] + d[2] * B.forward[2];
      const x = d[0] * B.right[0] + d[1] * B.right[1] + d[2] * B.right[2], y = d[0] * B.up[0] + d[1] * B.up[1] + d[2] * B.up[2];
      return [W / 2 + (x * k / asp / Math.max(1e-6, z)) * W / 2, H / 2 - (y * k / Math.max(1e-6, z)) * H / 2, z]; };
    const items: { z: number; bg: number; draw: () => void }[] = [];
    for (let q = 0; q < g.primitiveCount; q++) {
      const ids = primPoints(g, q); if (!ids.length) continue;
      const P3 = ids.map(i => pointAt(g, i)), P2 = P3.map(proj);
      if (P2.some(v => v[2] < 1)) continue;
      const col = attr(g, 'primitive', 'Cd', q) || [0.1, 0.1, 0.1, 1], wd = (attr(g, 'primitive', 'width', q) || [1])[0], bg = (attr(g, 'primitive', 'bg', q) || [0])[0];
      const z = P2.reduce((a, v) => a + v[2], 0) / P2.length, closed = g.topology.closed[q], px = W / 960;
      if (closed) {
        const a = P3[0], b = P3[1], c = P3[2], u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], nl = Math.hypot(n[0], n[1], n[2]) || 1;
        const lam = Math.abs(n[0] * light[0] + n[1] * light[1] + n[2] * light[2]) / nl / ln, shade = 0.62 + 0.45 * lam;
        items.push({ z, bg, draw: () => { ctx.beginPath(); P2.forEach((s, i) => i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1])); ctx.closePath(); ctx.fillStyle = css(col, shade); ctx.fill(); ctx.strokeStyle = 'rgba(20,20,20,0.55)'; ctx.lineWidth = Math.max(0.4, wd * px); ctx.stroke(); } });
      } else items.push({ z, bg, draw: () => { ctx.beginPath(); P2.forEach((s, i) => i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1])); ctx.strokeStyle = css(col); ctx.lineWidth = Math.max(0.5, wd * px * (bg ? 1 : Math.min(4, 260 / z))); ctx.stroke(); } });
    }
    items.sort((a, b) => (b.bg - a.bg) || (b.z - a.z));
    for (const it of items) it.draw();
  }
  /* the frame's type */
  const px = W / 960; ctx.font = `600 ${Math.round(13 * px)}px monospace`; ctx.textBaseline = 'top';
  if (V) {
    ctx.fillStyle = 'rgba(20,20,20,0.8)'; ctx.fillText(`${V.scene}  ${V.t.toFixed(2)} s  d${Math.round(V.t * 12) + 1}  ${V.shot}`, 10 * px, 8 * px);
    ctx.textAlign = 'right'; ctx.fillText(p.label || 'rig desk previz', W - 10 * px, 8 * px); ctx.textAlign = 'left';
  }
  if (SH > 0) {
    ctx.fillStyle = '#16161a'; ctx.fillRect(0, H, W, SH);
    if (V) {
      const [a, b] = V.window, X = (t: number) => (t - a) / (b - a) * W, mid = H + SH * 0.58, amp = SH * 0.3;
      for (const c of V.clips) { ctx.fillStyle = c.who ? 'rgba(217,117,26,0.28)' : 'rgba(150,150,160,0.18)'; ctx.fillRect(X(c.at), H + 2, X(c.at + c.dur) - X(c.at), SH - 4); }
      ctx.beginPath(); V.env.forEach((e, i) => { const x = i / (V.env.length - 1) * W; i ? ctx.lineTo(x, mid - e * amp) : ctx.moveTo(x, mid - e * amp); });
      for (let i = V.env.length - 1; i >= 0; i--) ctx.lineTo(i / (V.env.length - 1) * W, mid + V.env[i] * amp);
      ctx.closePath(); ctx.fillStyle = 'rgba(240,240,236,0.8)'; ctx.fill();
      for (const s of V.shots) { ctx.fillStyle = '#4c8fe0'; ctx.fillRect(X(s.t) - 1, H, 2, SH); }
      ctx.font = `500 ${Math.round(11 * px)}px monospace`; ctx.fillStyle = 'rgba(240,240,236,0.9)';
      let lastX = -1e9; for (const w of V.words) { const x = X(w.t); ctx.fillRect(x, H + SH - 10 * px, 1, 8 * px); if (x - lastX > 44 * px) { ctx.fillText(w.w, x + 2, H + 4 * px); lastX = x; } }
      ctx.fillStyle = '#e03030'; ctx.fillRect(W / 2 - 1, H, 2, SH);
      if (V.line) { ctx.font = `italic 500 ${Math.round(13 * px)}px monospace`; ctx.textAlign = 'center'; const tw = ctx.measureText(V.line).width; ctx.fillStyle = 'rgba(20,20,20,0.72)'; ctx.fillRect(W / 2 - tw / 2 - 8, H - 26 * px, tw + 16, 22 * px); ctx.fillStyle = '#fff'; ctx.fillText(V.line, W / 2, H - 22 * px); ctx.textAlign = 'left'; }
    }
  }
  const blob = await canvas.convertToBlob({ type: 'image/png' }), bytes = new Uint8Array(await blob.arrayBuffer());
  const asset = await context.capabilities.assets.write(bytes, { mediaType: 'image/png', suggestedName: p.filename }, { signal: context.signal });
  context.outputs.asset.set(asset);
  context.outputs.image.set({ path: asset.path ?? p.filename, size: [W, Htot], channels: 'rgba', depth: 'u8', space: 'srgb' });
}
