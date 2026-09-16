import json,wave,math,subprocess
from pathlib import Path
import numpy as np
r=Path('.');cut=json.loads((r/'monkey-cut.json').read_text());sr=24000;mix=np.zeros(cut['duration']*sr)
def note(at,freq,dur,vol):
 start=int(at*sr);n=min(int(dur*sr),len(mix)-start)
 if n<=0:return
 t=np.arange(n)/sr;mix[start:start+n]+=np.sin(2*np.pi*freq*t)*np.exp(-t*7/dur)*vol
for b in range(int(cut['duration']*2.8)):
 t=b/2.8;tense=19<=t<64;note(t,([110,116.54,164.81,146.83] if tense else [130.81,164.81,196,261.63])[b%4],.3,.07)
 if b%4==0:note(t,55,.3,.13)
 if tense and b%8==0:note(t,880,.18,.06)
 if b%2==0 and t<45:note(t,1800+b%7*100,.025,.04)
for f in [523,659,784]:note(64,f,1.2,.08)
for i,s in enumerate(cut['shots']):
 p=r/'monkey-audio'/f'{i}.wav'
 if not p.exists():continue
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-ac','1','-ar',str(sr),'-']);data=np.frombuffer(raw,dtype=np.float32);start=int(s['start']*sr);n=min(len(data),len(mix)-start);mix[start:start+n]+=data[:n]*.85
note(78,880,.14,.06)
mix[-sr:]*=np.linspace(1,0,sr)
mix=np.tanh(mix)
with wave.open('NIGHT-SHIFT-score.wav','wb') as w:w.setparams((1,2,sr,0,'NONE','not compressed'));w.writeframes((mix*30000).astype('<i2').tobytes())
