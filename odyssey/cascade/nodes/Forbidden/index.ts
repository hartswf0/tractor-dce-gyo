/* project.Forbidden — the illegal Odyssey: only the volumes where two parts of a build fill the same space (measured offline by
   tools/clashes.py with the line's checker), card by card, in plan, front or side, on one scale so the modules compare. The
   stud rows each card occupies are drawn faintly behind, for where; the clashes are the drawing. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';
import { decodeJson } from '../../lib/choreo';

interface Card { card: string; title: string; city: string; parts: number; clash: number; occupied: number[][]; clashes: (number | string)[][] }

export const definition = {
  apiVersion: 1,
  label: 'Forbidden',
  description: 'Draw only the clash volumes of the pre-strict modules: per card panels in plan, front or side elevation.',
  icon: 'Ban',
  runsOn: 'portable',
  capabilities: ['assets'],
  props: {
    sheet: { type: 'asset', default: { path: 'assets/clashes.json' }, label: 'Clashes (JSON)' },
    view: { type: 'string', default: 'plan', control: 'select', options: ['plan', 'front', 'side'] },
    card: { type: 'int', default: -1, min: -1, max: 7, label: 'One card (0-7), or -1 for all' },
    columns: { type: 'int', default: 4, min: 1, max: 8 },
    minDepth: { type: 'float', default: 0, min: 0, max: 24, step: 1, label: 'Only clashes at least this deep (LDU)' },
    context: { type: 'bool', default: true, label: 'Draw what each card occupies' },
    reveal: { type: 'float', default: 1, min: 0, max: 1, step: 0.01, label: 'Fraction of the clashes drawn (bottom up)' }
  },
  outputs: { geometry: { kind: 'data', type: 'geometry' }, info: { kind: 'data', type: 'object' } }
} as const satisfies NodeDefinition;

export async function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, all = decodeJson<{ cards: Card[] }>(await context.capabilities.assets.read(p.sheet, { signal: context.signal })).cards;
  const cards = p.card >= 0 && p.card < all.length ? [all[p.card]] : all;
  /* one scale for every panel: the largest card's extent in this view */
  const ext = (c: Card): number[] => {
    let x0 = Infinity, x1 = -Infinity, v0 = Infinity, v1 = -Infinity;
    for (const [k, a, b] of c.occupied) {
      const h = p.view === 'side' ? [k * 20, (k + 1) * 20] : [a * 20, (b + 1) * 20];
      x0 = Math.min(x0, h[0]); x1 = Math.max(x1, h[1]);
      if (p.view === 'plan') { v0 = Math.min(v0, -(k + 1) * 20); v1 = Math.max(v1, -k * 20); }
    }
    if (p.view !== 'plan') { v0 = 0; v1 = Math.max(24, ...c.clashes.map(q => q[5] as number)); }
    return [x0, v0, x1, v1];
  };
  const E = cards.map(ext), cw = Math.max(...E.map(e => e[2] - e[0])) + 80, ch = Math.max(...E.map(e => e[3] - e[1])) + 80;
  const cols = Math.max(1, Math.min(p.columns, cards.length));
  const g = new GeometryBuilder(), cd: number[] = [], w: number[] = [];
  let shown = 0, total = 0;
  cards.forEach((c, n) => {
    const e = E[n], ox = (n % cols) * cw - (e[0] + e[2]) / 2, oy = -Math.floor(n / cols) * ch - (e[1] + e[3]) / 2;
    const rect = (x0: number, y0: number, x1: number, y1: number, col: number[], width: number, closed = true) => {
      g.addPolygon([x0 + ox, y0 + oy, x1 + ox, y0 + oy, x1 + ox, y1 + oy, x0 + ox, y1 + oy], { closed }); cd.push(...col); w.push(width);
    };
    /* the panel's frame */
    const fx = (e[0] + e[2]) / 2, fy = (e[1] + e[3]) / 2;
    rect(fx - cw / 2 + 12, fy - ch / 2 + 12, fx + cw / 2 - 12, fy + ch / 2 - 12, [0.5, 0.48, 0.44, 1], 0.6, false);
    g.addPrimitive([g.pointCount - 1, g.pointCount - 4]); cd.push(0.5, 0.48, 0.44, 1); w.push(0.6);
    if (p.context) {
      if (p.view === 'plan') for (const [k, a, b] of c.occupied) rect(a * 20, -(k + 1) * 20, (b + 1) * 20, -k * 20, [0.8, 0.79, 0.75, 1], 0.2);
      else { g.addPolygon([e[0] + ox, oy, e[2] + ox, oy]); cd.push(0.4, 0.38, 0.35, 1); w.push(1.2); }
    }
    const list = c.clashes.filter(q => (q[5] as number) - (q[4] as number) >= p.minDepth).sort((a, b) => (a[4] as number) - (b[4] as number));
    total += list.length;
    const upto = Math.round(list.length * Math.max(0, Math.min(1, p.reveal)));
    for (const q of list.slice(0, upto)) {
      const [x0, z0, x1, z1, y0, y1] = q as number[], depth = y1 - y0, a = Math.min(1, 0.35 + depth / 24 * 0.6);
      const col = [0.78, 0.1 + 0.25 * (1 - depth / 24), 0.08, a];
      if (p.view === 'plan') rect(x0, -z1, x1, -z0, col, 1);
      else if (p.view === 'front') rect(x0, y0, x1, y1, col, 1);
      else rect(z0, y0, z1, y1, col, 1);
      shown++;
    }
  });
  if (cd.length) { g.setNumericAttribute('primitive', 'Cd', cd, 4); g.setNumericAttribute('primitive', 'width', w, 1); }
  context.outputs.geometry.set(g.build());
  context.outputs.info.set({ cards: cards.map(c => ({ card: c.card, title: c.title, city: c.city, parts: c.parts, clash: c.clash })), shown, total });
}
