"""Captioned accepted replay with generated interface/footstep foley."""
from pathlib import Path
import json,subprocess,wave
import numpy as np
root=Path(__file__).resolve().parent;run=json.loads((root/'final-run.json').read_text());rate=48000;duration=run['duration']+.2
sound=np.zeros(int(duration*rate));rng=np.random.default_rng(23)
def hit(at,length,freq,amp):
 t=np.arange(int(length*rate))/rate;v=(np.sin(2*np.pi*freq*t)*.7+rng.normal(0,.22,len(t)))*np.exp(-t*14/length)*amp;i=max(0,int(at*rate));n=min(len(v),len(sound)-i)
 if n>0:sound[i:i+n]+=v[:n]
travel=0
for a,b in zip(run['frames'],run['frames'][1:]):
 travel+=np.linalg.norm(np.array(b['position'])[[0,2]]-np.array(a['position'])[[0,2]])
 if travel>18:hit(b['t'],.09,140,.14);travel%=18
for e in run['events']:
 if e['type'] in ['grasp','deposit']:hit(e['time'],.11,520 if e['type']=='grasp' else 310,.24)
 if e['type']=='checkout':
  hit(e['time'],.3,880,.32);hit(e['time']+.15,.35,1174,.3)
 if e['type']=='door-open':
  for j in range(8):hit(e['time']-.85+j*.1,.15,220+j*28,.13)
with wave.open(str(root/'final-foley.wav'),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes((np.clip(sound,-1,1)*32767).astype('<i2').tobytes())
f=["drawtext=text='FILM BUTTER  /  PLAYABLE EXPERIMENT':fontcolor=white:fontsize=20:x=30:y=105:box=1:boxcolor=black@0.65:boxborderw=6:enable='lt(t,3)'", "drawtext=text='SCRIPTED RUN':fontcolor=white:fontsize=14:x=1080:y=42"]
for e in run['events']:
 label={'grasp':'Hand contact and grasp','deposit':'Placed at the register','checkout':'Checkout complete','door-open':'Open the native entrance with a hand','exit':'Outside on the pavement'}.get(e['type'])
 if label and e['type'] in ['checkout','door-open','exit']:f.append(f"drawtext=text='{label}':fontcolor=white:fontsize=18:x=30:y=105:box=1:boxcolor=black@0.65:boxborderw=6:enable='between(t,{e['time']},{e['time']+1.5})'")
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','12','-i',str(root/'frames-final/%04d.png'),'-i',str(root/'final-foley.wav'),'-vf',','.join(f),'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart',str(root.parent/'production/Film-Butter-Final.mp4')],check=True)
