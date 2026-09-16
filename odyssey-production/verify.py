#!/usr/bin/env python3
"""Meaningful export gates: full decode, exact audio continuity, frame count and native load receipt."""
import argparse,hashlib,json,subprocess,math
from pathlib import Path
root=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('variant',nargs='?',default='v3');p.add_argument('--halfworld',default=str(root/'halfworld'));a=p.parse_args()
video=root.parent/('ODYSSEY-BED-TEST-'+a.variant+'.mp4');source=Path(a.halfworld)/'drive/voice/OD-B23-S04.m4a'
receipt=json.loads((root/'evidence'/f'{a.variant}-receipt.json').read_text())
def pcm(path):return subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-map','0:a:0','-ac','1','-ar','48000','-f','f32le','-'])
original,exported=pcm(source),pcm(video)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
v=next(s for s in probe['streams'] if s['codec_type']=='video');samples=receipt['samples'];end=samples[-1]['positions']
checks={
 'all_native_assets_loaded':not receipt['missing'],
 'supported_native_assemblies':all(not x['report']['errors'] and not x['report']['unknown'] and not x['report']['floating'] for x in receipt['assemblies']),
 'complete_660_frames':int(v['nb_frames'])==660==receipt['frames'],
 'full_55_second_scene':abs(float(v['duration'])-55)<.01,
 'exact_decoded_source_audio':original==exported,
 'audio_has_tail_room':float(v['duration'])>len(exported)/4/48000+2,
 'nurse_visibility_tracks_source':all(s['positions']['eurycleia']['visible']==(10<=s['sourceTime']<20 or s['sourceTime']>=60) for s in samples),
 'bard_remains_out_after_exit':all(not s['positions']['phemius']['visible'] for s in samples if s['sourceTime']>=7),
 'reunion_mark_close_enough_for_native_arms':math.dist(end['odysseus']['position'],end['penelope']['position'])<=50.001,
}
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True);checks['entire_encoded_movie_decodes']=True
cuts=[6.5,11.86,18,22.9,30.5,35.3,42.64]
cut_windows=[{'cut':t,'window':.25,'exactPCM':original[max(0,round((t-.25)*48000))*4:round((t+.25)*48000)*4]==exported[max(0,round((t-.25)*48000))*4:round((t+.25)*48000)*4]} for t in cuts]
result={'variant':a.variant,'checks':checks,'audio':{'decodedSamples':len(exported)//4,'decodedDuration':len(exported)/4/48000,'sha256':hashlib.sha256(exported).hexdigest(),'sourceContainerDuration':receipt['contract']['recordingDuration'],'cutWindows':cut_windows},'reviewLimit':'These checks do not constitute human listening or artistic approval. Inspect the matched frames and full movie.','video':str(video)}
(root/'evidence'/f'{a.variant}-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2));raise SystemExit(0 if all(checks.values()) else 1)
