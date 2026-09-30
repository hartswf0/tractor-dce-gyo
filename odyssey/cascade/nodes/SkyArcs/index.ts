/* project.SkyArcs — the world's clock over Ogygia: for every day the world has lived, the sun's path across the southern sky as an
   arc (azimuth across, altitude up; higher in summer, lower in winter), and the moon's, rising later each day; today's sun where
   the world's hour puts it; the horizon and the island. The world's days are the performer's seconds times `ratio`: two clocks,
   one parameter between them. Printable: every arc is a polyline, a solargraph. */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';
import { GeometryBuilder } from 'cascade/runtime';

export const definition = {
  apiVersion: 1,
  label: 'Sky Arcs',
  description: 'Sun and moon paths for every world day elapsed, at a latitude; today\'s sun; the horizon.',
  icon: 'Sun',
  runsOn: 'portable',
  props: {
    time: { type: 'float', default: 0, min: 0, max: 100000, label: 'Performer seconds (the film\'s clock)' },
    ratio: { type: 'float', default: 255.7, min: 0, max: 5000, step: 0.1, label: 'World days per performer second' },
    latitude: { type: 'float', default: 36, min: -66, max: 66, step: 1, label: 'Latitude (degrees)' },
    maxArcs: { type: 'int', default: 420, min: 1, max: 5000, label: 'Most arcs drawn (every nth day beyond)' },
    moon: { type: 'bool', default: true }
  },
  outputs: { arcs: { kind: 'data', type: 'geometry' }, sun: { kind: 'data', type: 'geometry' }, ground: { kind: 'data', type: 'geometry' }, info: { kind: 'data', type: 'object' } }
} as const satisfies NodeDefinition;

function sky(lat: number, dec: number, H: number): [number, number] {
  /* altitude and azimuth (from south, west positive) of a body at declination dec and hour angle H, all radians */
  const alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
  return [az, alt];
}

export function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, lat = p.latitude * Math.PI / 180, days = Math.max(0, p.time * p.ratio), whole = Math.floor(days);
  const X = 200 / Math.PI, Y = 200 / Math.PI;           /* 180 degrees of azimuth across 400 units; altitude on the same scale */
  const stepDays = Math.max(1, Math.ceil((whole + 1) / p.maxArcs));
  const arcs = new GeometryBuilder(), cd: number[] = [], w: number[] = [];
  const decSun = (d: number) => 23.44 * Math.PI / 180 * Math.sin(2 * Math.PI * (d - 80) / 365.25);
  const decMoon = (d: number) => 28 * Math.PI / 180 * Math.sin(2 * Math.PI * d / 27.32);
  const path = (dec: number, H0: number, rgba: number[], width: number) => {
    const flat: number[] = [];
    for (let k = 0; k <= 48; k++) { const H = H0 + (k / 48) * 2 * Math.PI, [az, alt] = sky(lat, dec, H); if (alt < 0) { if (flat.length > 2) { arcs.addPolygon(flat.slice()); cd.push(...rgba); w.push(width); } flat.length = 0; continue; } flat.push(az * X, alt * Y); }
    if (flat.length > 2) { arcs.addPolygon(flat); cd.push(...rgba); w.push(width); }
  };
  for (let d = whole; d >= 0; d -= stepDays) {
    const age = whole > 0 ? (whole - d) / Math.max(1, whole) : 0, fade = 0.25 + 0.75 * (1 - age);
    path(decSun(d), -Math.PI, [0.86, 0.55, 0.1, fade], d === whole ? 2.2 : 0.7);
    if (p.moon) path(decMoon(d), -Math.PI + 2 * Math.PI * ((d * 0.0339) % 1), [0.35, 0.42, 0.62, fade * 0.7], 0.5);
  }
  if (cd.length) { arcs.setNumericAttribute('primitive', 'Cd', cd, 4); arcs.setNumericAttribute('primitive', 'width', w, 1); }
  context.outputs.arcs.set(arcs.build());
  /* today's sun, where the world's hour puts it (a dot, or nothing under the horizon) */
  const sun = new GeometryBuilder(), hour = days - whole, [az, alt] = sky(lat, decSun(whole), -Math.PI + hour * 2 * Math.PI);
  if (alt > 0) { sun.addPoint(az * X, alt * Y); sun.setNumericAttribute('point', 'pscale', [7], 1); sun.setNumericAttribute('point', 'Cd', [0.95, 0.6, 0.05, 1], 4); }
  context.outputs.sun.set(sun.build());
  /* the horizon (the sea to the south), the shore the raft is built on, and a tick for every world year gone */
  const gnd = new GeometryBuilder(), gc: number[] = [], gw: number[] = [];
  gnd.addPolygon([-200, 0, 200, 0]); gc.push(0.3, 0.42, 0.6, 1); gw.push(1.6);
  const shore: number[] = []; for (let k = 0; k <= 40; k++) { const x = -200 + k * 10; shore.push(x, -20 + 9 * Math.exp(-(((x + 120) / 60) ** 2)) + 1.2 * Math.sin(k * 1.3)); }
  gnd.addPolygon(shore); gc.push(0.75, 0.66, 0.45, 1); gw.push(1.2);
  for (let y = 0; y < Math.floor(days / 365.25); y++) { gnd.addPolygon([190 - y * 7, -30, 190 - y * 7, -38]); gc.push(0.95, 0.6, 0.05, 1); gw.push(2); }
  gnd.setNumericAttribute('primitive', 'Cd', gc, 4); gnd.setNumericAttribute('primitive', 'width', gw, 1);
  context.outputs.ground.set(gnd.build());
  context.outputs.info.set({ days: Math.round(days * 10) / 10, years: Math.round(days / 365.25 * 100) / 100, arcs: Math.floor(whole / stepDays) + 1, everyNthDay: stepDays });
}
