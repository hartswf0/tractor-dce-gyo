import json,wave,math,struct
from pathlib import Path
r=Path(__file__).parent;run=json.loads((r/'completed-run.json').read_text());rate=22050;n=int((run['duration']+.15)*rate);audio=[0.0]*n
for e in run['events']:
 hz=880 if e['type']=='checkout' else 660
 start=int(e['time']*rate)
 for j in range(int(.18*rate)):
  if start+j<n:audio[start+j]+=.15*math.sin(2*math.pi*hz*j/rate)*math.exp(-j/(rate*.04))
with wave.open(str(r/'game-audio.wav'),'w') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,x))*32767)) for x in audio))
