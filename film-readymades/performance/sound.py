from pathlib import Path
import numpy as np,wave
R=Path(__file__).parent;sr=48000;dur=48;rng=np.random.default_rng(2411);audio=np.zeros((sr*dur,2),np.float64)
def add(t,s,vol=1,pan=0):
 i=int(t*sr);n=min(len(s),len(audio)-i)
 if n<=0:return
 audio[i:i+n,0]+=s[:n]*vol*np.sqrt((1-pan)/2);audio[i:i+n,1]+=s[:n]*vol*np.sqrt((1+pan)/2)
def note(t,midi,length=.8,vol=.08,pan=0):
 x=np.arange(int(sr*length))/sr;f=440*2**((midi-69)/12);a=np.sin(2*np.pi*f*x)+.36*np.sin(2*np.pi*f*2.003*x)+.13*np.sin(2*np.pi*f*3.995*x);env=(1-np.exp(-x*350))*np.exp(-x*6);add(t,a*env,vol,pan)
def beep(t,error=False):
 length=.24 if error else .12;x=np.arange(int(sr*length))/sr;f=180 if error else 1350;s=np.sin(2*np.pi*f*x)*np.hanning(len(x));
 if error:s+=.45*np.sin(2*np.pi*237*x)*np.hanning(len(x))
 add(t,s,.14,.25)
def tap(t,vol=.08,pan=0):
 x=np.arange(int(sr*.1))/sr;s=rng.normal(size=len(x))*.35*np.exp(-x*85)+np.sin(x*2*np.pi*380)*np.exp(-x*60);add(t,s,vol,pan)
def squeak(t):
 x=np.arange(int(sr*.55))/sr;freq=580+480*np.sin(np.pi*x/.55)**2;phase=2*np.pi*np.cumsum(freq)/sr;s=(np.sin(phase)+.3*np.sin(phase*3))*np.sin(np.pi*x/.55)**2*(.8+.2*np.sin(2*np.pi*32*x));add(t,s,.18,-.4)
# A small plucked theme establishes the checkout's regular rhythm.
for i in range(12):
 t=1+i*.75;note(t,[60,67,64,67][i%4],vol=.06,pan=-.25);note(t,36 if i%4==0 else 43,length=.6,vol=.045,pan=.2)
for t,m in [(12.8,63),(15.5,62),(17.6,59),(19.9,58),(22,55)]:note(t,m,vol=.065)
for t,m in [(30.1,60),(30.35,64),(30.6,67),(31,72),(35,64),(35.75,67),(36.5,69),(37.25,67),(38,64),(39,60),(40,67),(41,64)]:note(t,m,length=1.1,vol=.075)
for t in [5.3,30.0,40.1]:beep(t)
for t in [10.6,19.1,21.1]:beep(t,True)
for t in [3.6,5.6,7,8.2,9.5,18.2,20.2,22.2,27,31.7,40.3,42.8]:tap(t,.06)
squeak(29.35)
# Bag rustle, then the apple's dry crack and wet collapse, isolated for the last gag.
for t in [6.5,39.8]:
 x=np.arange(int(sr*.6))/sr;noise=rng.normal(size=len(x));add(t,noise*.018*np.sin(np.pi*x/.6)**2,.6,.65)
x=np.arange(int(sr*.42))/sr;s=rng.normal(size=len(x))*.5*np.exp(-x*14)+np.sin(2*np.pi*(240*x-190*x*x))*np.exp(-x*9);add(44.2,s,.19,.25)
note(45.0,48,length=.6,vol=.1);note(45.15,60,length=.8,vol=.07)
for t,m in [(46.1,60),(46.1,64),(46.1,67)]:note(t,m,length=1.8,vol=.05)
# Quiet store air. No borrowed music, recordings, voices or sound effects.
x=np.arange(sr*dur)/sr;air=rng.normal(size=len(x));air=np.convolve(air,np.ones(16)/16,mode='same');env=np.minimum(1,x)*np.minimum(1,dur-x);audio+=((air*.004+np.sin(2*np.pi*60*x)*.001)*env)[:,None]
peak=np.max(abs(audio));audio*=.87/max(peak,.87);pcm=(np.clip(audio,-1,1)*32767).astype('<i2')
with wave.open(str(R/'soundtrack.wav'),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes(pcm.tobytes())
print('Soundtrack',dur,'seconds; peak',float(np.max(abs(audio))))
