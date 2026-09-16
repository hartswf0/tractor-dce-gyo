#!/usr/bin/env python3
"""Mux the entire recorded performance once; camera cuts cannot affect it."""
import argparse,json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('variant');p.add_argument('--halfworld',default=str(root/'halfworld'));a=p.parse_args()
root=Path(__file__).resolve().parent;work=root.parent.parent/'work';c=json.loads((root/'bed-test.contract.json').read_text())
frames=work/('frames-'+a.variant);expected=round(c['renderDuration']*c['fps'])
assert len(list(frames.glob('*.jpg')))==expected, 'Incomplete render: refusing export'
output=root.parent/('ODYSSEY-BED-TEST-'+a.variant+'.mp4')
subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(c['fps']),'-i',str(frames/'%05d.jpg'),'-i',str(Path(a.halfworld)/'drive/voice/OD-B23-S04.m4a'),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(output)],check=True)
subprocess.run(['ffprobe','-v','error','-show_entries','format=duration:stream=codec_name,duration,nb_frames','-of','json',str(output)],check=True)
print(output)
