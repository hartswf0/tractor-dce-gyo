"""Encode the accepted native-hand replay with explicit evidence labels."""
from pathlib import Path
import json, subprocess
root=Path(__file__).resolve().parent
run=json.loads((root/'hand-run.json').read_text())
f=["drawtext=text='SCRIPTED HAND-CONTROL TEST':fontcolor=white:fontsize=20:x=30:y=105:box=1:boxcolor=black@0.65:boxborderw=6"]
labels={'banana':'Banana','bread':'Croissant','carrot':'Carrot'}
for e in run['events']:
 if e['type']=='checkout':continue
 label=labels.get(e['item'],'Item')+(' grasped with native hand' if e['type']=='grasp' else ' deposited at register')
 start=e['time'];end=min(run['duration'],start+1.5)
 f.append(f"drawtext=text='{label}':fontcolor=white:fontsize=20:x=30:y=140:box=1:boxcolor=black@0.65:boxborderw=6:enable='between(t,{start},{end})'")
out=root.parent/'production/Film-Butter-Hands-Test.mp4'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','12','-i',str(root/'frames-hands/%04d.png'),'-vf',','.join(f),'-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],check=True)
print(out)
