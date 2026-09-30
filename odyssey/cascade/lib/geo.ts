/* lib/geo.ts — small helpers the project's geometry nodes share: an orthographic view (azimuth about y, then elevation), reading
   positions, and the stud grid. Pure functions; nothing here remembers anything. */
import type { Geometry } from 'cascade/contracts';

export type V3 = [number, number, number];

/** a point of a geometry as a 3-vector (2D geometry gets z = 0) */
export function pointAt(g: Geometry, i: number): V3 {
  const P = g.point.P as { size: number; data: ArrayLike<number> };
  const s = P.size;
  return [P.data[i * s], P.data[i * s + 1], s > 2 ? P.data[i * s + 2] : 0];
}

/** orthographic view: turn the world by `az` degrees about y (the viewer walks round), tip it by `el` degrees (90: from above,
    the front of the set at the bottom of the page). Returns [x, y, depth], depth growing toward the viewer. */
export function view(v: V3, az: number, el: number): V3 {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  const x = v[0] * Math.cos(a) - v[2] * Math.sin(a), z = v[0] * Math.sin(a) + v[2] * Math.cos(a), y = v[1];
  return [x, y * Math.cos(e) - z * Math.sin(e), y * Math.sin(e) + z * Math.cos(e)];
}

/** a primitive's point indices */
export function primPoints(g: Geometry, p: number): number[] {
  const { vertexPoints, offsets } = g.topology, out: number[] = [];
  for (let v = offsets[p]; v < offsets[p + 1]; v++) out.push(vertexPoints[v]);
  return out;
}

/** a numeric attribute element, or undefined */
export function attr(g: Geometry, level: 'point' | 'primitive', name: string, i: number): number[] | undefined {
  const A = (level === 'point' ? g.point : g.primitive)[name] as { size: number; data: ArrayLike<number>; storage: string } | undefined;
  if (!A || A.storage === 'string') return undefined;
  const out: number[] = [];
  for (let c = 0; c < A.size; c++) out.push(A.data[i * A.size + c]);
  return out;
}

export const STUD = 20, PLATE = 8;
