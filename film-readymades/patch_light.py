"""The [light] hooks in the take (odyssey-take.js): film-readymades/odyssey-light.js (window.OdysseyLight), the practical light of an
interior at night and the set's moving pieces, staged for a scene whose keyframes carry a `hall` section and driven every drawing.
Four hooks, each between /*[light]*/ markers, written here so they can be laid on any version of the take (another kit's agent edits
the same file): prepare (fetch and stage), apply (every drawing), the cinematographer's poseAt (so the solver sees the doors and
the arrow where the film has them), end (dispose).

python3 film-readymades/patch_light.py [file]     (default film-readymades/odyssey-take.js; idempotent)
"""
from pathlib import Path
import sys

R = Path(__file__).parent

PIECE = ("piece:l=>{const A=filmAsset(),i=(A.pages||[]).findIndex(pg=>pg.label===l);if(i<0)return null;const p=S.parts.find(q=>q.id===A.rows[i].id);return p&&p.mesh||null;}")
STAGE = ("/*[light]*/ /* the practical light of an interior at night (film-readymades/odyssey-light.js): a scene whose keyframes carry a `hall` "
         "section gets its hearth and torches flickering on the drawing, the night through the clerestory and the doors, its doors swung and "
         "its arrow slid on the take's clock */\n"
         "  if(spec.hall)try{if(!window.OdysseyLight){const src=await (await fetch(root+'film-readymades/odyssey-light.js',{cache:'no-store'})).text();(0,eval)(src);}"
         "const look=spec.hall.look?await (await fetch(root+spec.hall.look,{cache:'no-store'})).json():{};"
         "T.light=OdysseyLight.stage({THREE,scene,renderer,camera,spec,look,asset:filmAsset()," + PIECE + "});T.light.frame(0);"
         "console.log('[take] light',JSON.stringify(T.light.stats()));}catch(e){console.warn('[take] light',e);T.light=null;}/*[/light]*/\n")
HOOKS = [
    # prepare: before the cameras are solved
    ("  if(cinePlan)await cineStart(cinePlan);\n  return info();}", STAGE + "  if(cinePlan)await cineStart(cinePlan);\n  return info();}"),
    # the cinematographer's pose
    ("shadeCast();/*[motion]*/if(T.motion)T.motion.frame(t,key);/*[/motion]*/scene.updateMatrixWorld(true);return key;},",
     "shadeCast();/*[motion]*/if(T.motion)T.motion.frame(t,key);/*[/motion]*//*[light]*/if(T.light)T.light.frame(t);/*[/light]*/scene.updateMatrixWorld(true);return key;},"),
    # every drawing
    ("/*[/sea]*/scene.updateMatrixWorld(true);return sh;}", "/*[/sea]*//*[light]*/if(T.light)T.light.frame(t);/*[/light]*/scene.updateMatrixWorld(true);return sh;}"),
    # end
    ("function end(){if(!T)return;stop();", "function end(){if(!T)return;stop();/*[light]*/if(T.light){T.light.dispose();T.light=null;}/*[/light]*/"),
]


def patch(s):
    for old, new in HOOKS:
        if new in s: continue
        if s.count(old) != 1: raise SystemExit('patch_light: anchor not found once: ' + old[:70])
        s = s.replace(old, new, 1)
    return s


if __name__ == '__main__':
    f = Path(sys.argv[1]) if len(sys.argv) > 1 else R / 'odyssey-take.js'
    s = f.read_text(); t = patch(s)
    if t != s: f.write_text(t); print('patched', f)
    else: print('already patched', f)
