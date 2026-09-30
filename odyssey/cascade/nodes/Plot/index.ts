/* project.Plot — 2D geometry rasterized on a Canvas 2D surface (the browser's own, or Skia under `cascade run`): closed primitives
   filled with their Cd, open ones stroked with it, loose points as dots of their pscale. A fixed world frame (`bounds`) keeps a
   sequence steady; all zero fits the drawing. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { attr, pointAt, primPoints } from '../../lib/geo';

export const definition = {
  apiVersion: 1,
  label: 'Plot',
  description: 'Rasterize 2D geometry: closed primitives filled with Cd, open ones stroked with Cd, loose points as dots.',
  icon: 'Image',
  runsOn: 'portable',
  capabilities: ['assets'],
  inputs: { geometry: { kind: 'data', type: 'geometry' } },
  props: {
    size: { type: 'vec2i', default: [960, 640], min: 16, max: 4096 },
    bounds: { type: 'vec4', default: [0, 0, 0, 0], label: 'World frame [minX, minY, maxX, maxY] (0: fit)' },
    margin: { type: 'float', default: 24, min: 0, max: 400 },
    background: { type: 'color', default: [0.957, 0.957, 0.941, 1] },
    stroke: { type: 'color', default: [0.08, 0.08, 0.08, 1] },
    strokeWidth: { type: 'float', default: 1.5, min: 0, max: 40, step: 0.1 },
    edge: { type: 'color', default: [0.08, 0.08, 0.08, 0.55], label: 'Edge of filled shapes' },
    edgeWidth: { type: 'float', default: 0.6, min: 0, max: 10, step: 0.1 },
    filename: { type: 'string', default: 'plot.png' }
  },
  outputs: { image: { kind: 'data', type: 'image' }, asset: { kind: 'data', type: 'asset' } }
} as const satisfies NodeDefinition;

function css(c: readonly number[]): string { return `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${c[3] ?? 1})`; }

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const { props } = context, g = context.inputs.geometry, [W, H] = props.size;
  let [x0, y0, x1, y1] = props.bounds;
  if (!(x1 > x0 && y1 > y0) && g && g.pointCount) {
    x0 = Infinity; y0 = Infinity; x1 = -Infinity; y1 = -Infinity;
    for (let i = 0; i < g.pointCount; i++) { const p = pointAt(g, i); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  }
  if (!(x1 > x0)) { x0 -= 1; x1 += 1; } if (!(y1 > y0)) { y0 -= 1; y1 += 1; }
  const m = props.margin, k = Math.min((W - 2 * m) / (x1 - x0), (H - 2 * m) / (y1 - y0));
  const ox = (W - k * (x1 - x0)) / 2 - k * x0, oy = (H - k * (y1 - y0)) / 2 + k * y1;   /* +y up in the geometry, down on the canvas */
  const canvas = new OffscreenCanvas(W, H), ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.fillStyle = css(props.background); ctx.fillRect(0, 0, W, H);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (g) {
    const used = new Uint8Array(g.pointCount);
    for (let p = 0; p < g.primitiveCount; p++) {
      const pts = primPoints(g, p); if (!pts.length) continue;
      ctx.beginPath();
      pts.forEach((i, n) => { used[i] = 1; const q = pointAt(g, i); const X = ox + k * q[0], Y = oy - k * q[1]; if (n) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      const col = attr(g, 'primitive', 'Cd', p) || attr(g, 'point', 'Cd', pts[0]) || props.stroke, w = (attr(g, 'primitive', 'width', p) || [props.strokeWidth])[0];
      if (g.topology.closed[p]) { ctx.closePath(); ctx.fillStyle = css(col); ctx.fill(); if (props.edgeWidth > 0) { ctx.strokeStyle = css(props.edge); ctx.lineWidth = props.edgeWidth; ctx.stroke(); } }
      else { ctx.strokeStyle = css(col); ctx.lineWidth = w; ctx.stroke(); }
    }
    for (let i = 0; i < g.pointCount; i++) {
      if (used[i]) continue;
      const q = pointAt(g, i), r = (attr(g, 'point', 'pscale', i) || [2])[0], col = attr(g, 'point', 'Cd', i) || props.stroke;
      ctx.beginPath(); ctx.arc(ox + k * q[0], oy - k * q[1], Math.max(0.5, r), 0, Math.PI * 2); ctx.fillStyle = css(col); ctx.fill();
    }
  }
  const blob = await canvas.convertToBlob({ type: 'image/png' }), bytes = new Uint8Array(await blob.arrayBuffer());
  const asset = await context.capabilities.assets.write(bytes, { mediaType: 'image/png', suggestedName: props.filename }, { signal: context.signal });
  context.outputs.asset.set(asset);
  context.outputs.image.set({ path: asset.path ?? props.filename, size: [W, H], channels: 'rgba', depth: 'u8', space: 'srgb' });
}
