/* odyssey/cascade/tools/rig_graph.mjs — a rig desk graph read the way Cascade reads it: every node's props resolved at a frame by
   Cascade's own PropAnimator (a keyframe channel first, then an expression, then the stored value; the channels sampled and the
   expressions evaluated by the runtime's code, not a copy of it), and the actors' sheets loaded. Shared by tools/rig_export.mjs
   (the director's layer out to the choreography sheet) and tools/rig_density.mjs (acting density from the rig). */
import fs from 'node:fs';
import path from 'node:path';
import { PropAnimator, deserializeChannel } from 'cascade/runtime';
import { PROP_OF, GROUPS, CH } from '../lib/rig.ts';

export const HERE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const ROOT = path.resolve(HERE, '..', '..');

export function loadDesk(sid, graphFile) {
  const file = graphFile || path.join(HERE, `rig-${sid}.cascade`), doc = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nodes = doc.nodes.map(n => {
    const props = {}, bindings = {};
    for (const [k, v] of Object.entries(n.props || {})) {
      const bound = v && typeof v === 'object' && !Array.isArray(v) && ('expression' in v || 'channel' in v) && !('path' in v);
      if (bound) { props[k] = v.value; bindings[k] = { value: v.value, expression: v.expression, channel: v.channel ? deserializeChannel(v.channel) : undefined }; }
      else props[k] = v && typeof v === 'object' && 'value' in v && !('path' in v) ? v.value : v;
    }
    return { id: n.id, module: n.module, props, inputs: {}, bindings, doc: n };
  });
  const byId = new Map(nodes.map(n => [n.id, n])), errors = [];
  const animator = new PropAnimator({ nodes, node: id => byId.get(id), inputNode: () => null, report: (id, prop, e) => errors.push(`${id}/${prop}: ${e}`) });
  const fps = (doc.metadata && doc.metadata.fps) || 12; animator.setFps(fps);
  const rigs = nodes.filter(n => n.module === 'project.MinifigRig').map(n => {
    const sheetPath = path.join(HERE, n.props.sheet.path), S = JSON.parse(fs.readFileSync(sheetPath, 'utf8'));
    return { node: n, actor: S.actor, S };
  });
  /** resolve every bound prop at frame f (1-based; $T = (f - 1) / fps) */
  const at = f => { animator.setFrame(f); animator.resolveAll(); };
  return { file, doc, nodes, byId, rigs, at, fps, errors };
}
export const DIR_PROPS = CH.map(c => PROP_OF[c]);
/** the director's layer of one rig node as its props stand now (after `at`) */
export function directorOf(node) {
  const offsets = {}, weights = {};
  for (const c of CH) offsets[c] = +node.props[PROP_OF[c]] || 0;
  for (const g of GROUPS) weights[g] = node.props[g] == null ? 1 : +node.props[g];
  return { offsets, weights };
}
/** the shot camera as it stands now: position, direction, vertical fov (the view project.RigView draws through Cascade's Camera) */
export function cameraOf(desk) {
  const c = desk.byId.get('shotcam').props;
  return { pos: [c.tx, c.ty, c.tz], dir: [c.lx - c.tx, c.ly - c.ty, c.lz - c.tz], fov: c.fov, aspect: 1280 / 720 };
}
