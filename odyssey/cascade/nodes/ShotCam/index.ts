/* project.ShotCam — the acted film's shot camera as keyed props: where it stands, where it looks, its vertical field of view. The
   keys are the take's own camera at every drawing where it changes (tools/rig_import.mjs reads them from the take with
   tools/rig_probe.cjs; a cut is a constant key), so the previz frames the film's shots. A Camera node's inputs cannot hold keys, so
   this node holds them and wires translate, lookat and focal into cascade.core.Camera. A channel is one number, so a position is
   three props here (Cascade 0.7.1 keys scalars). */
import type { NodeDefinition, NodeExecutionContext } from 'cascade/contracts';

export const definition = {
  apiVersion: 1,
  label: 'Shot Camera',
  description: 'The take\'s shot camera as keyframe channels (position, look-at point, vertical field of view), out as translate, lookat and focal for cascade.core.Camera.',
  icon: 'Video',
  runsOn: 'portable',
  props: {
    tx: { type: 'float', default: 0, step: 0.1, label: 'Position x' },
    ty: { type: 'float', default: 60, step: 0.1, label: 'Position y' },
    tz: { type: 'float', default: 300, step: 0.1, label: 'Position z' },
    lx: { type: 'float', default: 0, step: 0.1, label: 'Look at x' },
    ly: { type: 'float', default: 40, step: 0.1, label: 'Look at y' },
    lz: { type: 'float', default: 0, step: 0.1, label: 'Look at z' },
    fov: { type: 'float', default: 38, min: 5, max: 120, step: 0.1, label: 'Vertical field of view (degrees)' },
    aperture: { type: 'float', default: 41.4214, label: 'The Camera node\'s aperture (mm)' },
    resolution: { type: 'vec2i', default: [1280, 720], label: 'The Camera node\'s resolution' },
    shot: { type: 'int', default: 0, label: 'Shot number (keyed at the cuts)' }
  },
  outputs: {
    translate: { kind: 'data', type: 'vec3' },
    lookat: { kind: 'data', type: 'vec3' },
    focal: { kind: 'data', type: 'float' },
    shot: { kind: 'data', type: 'int' }
  }
} as const satisfies NodeDefinition;

export function execute(context: NodeExecutionContext<typeof definition>) {
  const p = context.props, [rx, ry] = p.resolution;
  /* Houdini's lens: the vertical aperture is the horizontal one times the frame's height over its width */
  const vap = p.aperture * ry / Math.max(1, rx), focal = vap / (2 * Math.tan(p.fov * Math.PI / 360));
  context.outputs.translate.set([p.tx, p.ty, p.tz]);
  context.outputs.lookat.set([p.lx, p.ly, p.lz]);
  context.outputs.focal.set(focal);
  context.outputs.shot.set(p.shot);
}
