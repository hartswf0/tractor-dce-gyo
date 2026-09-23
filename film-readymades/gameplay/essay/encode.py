import subprocess,json
from pathlib import Path
R=Path(__file__).resolve().parent;G=R.parent;P=G.parent/'production'
def duration(p):return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','json',str(p)]).decode().split('"duration": "')[1].split('"')[0])
def ff(args):subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error']+list(map(str,args)),check=True)
common=['-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart']
for name in ['intro','end']:
 ff(['-loop','1','-framerate','24','-i',R/(name+'.png'),'-i',R/(name+'.wav'),'-t',duration(R/(name+'.wav'))+.8,'-af','apad']+common+[R/(name+'.mp4')])
run=json.loads((G/'llm-run.json').read_text());total=max(run['duration']*2,duration(R/'play.wav')+.8)
ff(['-framerate','12','-i',G/'frames-llm/%04d.png','-i',R/'play.wav','-vf',"setpts=2*PTS,fps=24,tpad=stop_mode=clone:stop_duration=5,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='ACTUAL LLM TOOL RUN  |  LOCAL TWO-TAB  |  HALF SPEED':fontsize=16:fontcolor=white:box=1:boxcolor=0x10231f@0.9:boxborderw=8:x=32:y=612",'-af','apad','-t',total]+common+[R/'play.mp4'])
(R/'concat.txt').write_text('\n'.join("file '"+str(R/(n+'.mp4'))+"'" for n in ['intro','play','end']))
ff(['-f','concat','-safe','0','-i',R/'concat.txt','-c','copy','-movflags','+faststart',P/'Shopper-and-Detective-Video-Essay.mp4'])
# Normal-speed source playthrough is separately available without narration.
ff(['-framerate','12','-i',G/'frames-llm/%04d.png','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',P/'Two-LLM-Playthrough.mp4'])
print('Essay seconds:',duration(P/'Shopper-and-Detective-Video-Essay.mp4'))
