#!/usr/bin/env python3
"""Encode and fully decode-check the three native blocking studies."""
from pathlib import Path
import json,subprocess,hashlib
ROOT=Path(__file__).resolve().parent
WORK=ROOT.parent.parent/'work'
results=[]
for name in ['bed','stake','axes']:
    frames=WORK/('frames-hero-'+name+'-v1')
    expected=[frames/f'{i:05}.jpg' for i in range(216)]
    if not all(p.is_file() for p in expected): raise SystemExit('Incomplete frames: '+name)
    out=ROOT.parent/('ODYSSEY-HERO-'+name.upper()+'-TEST.mp4')
    subprocess.run(['ffmpeg','-v','error','-y','-framerate','12','-i',str(frames/'%05d.jpg'),'-frames:v','216','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(out)],check=True)
    subprocess.run(['ffmpeg','-v','error','-i',str(out),'-f','null','-'],check=True)
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out)]))
    video=next(s for s in info['streams'] if s['codec_type']=='video')
    assert video['width']==1280 and video['height']==720 and int(video['nb_frames'])==216 and abs(float(info['format']['duration'])-18)<.01
    results.append({'test':name,'file':out.name,'frames':216,'fps':12,'duration':18,'dimensions':[1280,720],'audio':'intentionally silent blocking study','fullDecode':'pass','sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
(ROOT/'evidence'/'hero-video-verification.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
