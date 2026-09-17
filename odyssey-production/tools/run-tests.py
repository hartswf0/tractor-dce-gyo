from pathlib import Path
import subprocess,json,datetime,sys
root=Path(__file__).resolve().parent.parent
suite=[('motion-interpolation','test_butter_motion.cjs','Numeric key-pose interpolation; not webcam tracking or contact physics.'),('spoken-coverage','test_halfworld_assembly.cjs','Audio offsets and durations, files and chapter coverage; not full-film visual review.'),('grounding','test_prop_grounding.cjs','Ground-base placement regression.'),('horse-gaits','test_horse_motion.cjs','Synthetic leg segmentation, gait and flight controller; not donor-art acceptance.'),('playable-controls','test_playable.cjs','Horse/boat controller and swept arrow hit logic.'),('period-roads','test_odyssey_world.cjs','Road rendering and support geometry.'),('scene-inventory','test_scene_catalog.cjs','Every registered native scene and catalog target, sheep still/source/video.')]
suite.append(('monkey-film','test_monkey_cut.cjs','Continuous 83-second cut, 13 camera/action cues and recorded voice assets.'))
suite.extend([('horse-performance','../tests/horse-performance.cjs','Mounted cues, manual override, expiry and Stop.'),('published-ldraw-paths','../tests/published-ldraw-paths.cjs','Geometry paths on static hosting and localhost.')])
results=[]
for id,file,scope in suite:
 p=subprocess.run(['node','tools/'+file],capture_output=True,text=True,cwd=root)
 results.append(dict(id=id,command='node tools/'+file,status='PASS' if p.returncode==0 else 'FAIL',scope=scope,output=(p.stdout+p.stderr).strip()))
 print(id,results[-1]['status'])
(root/'test-results.json').write_text(json.dumps(dict(runAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),tests=results),indent=2))
sys.exit(any(r['status']=='FAIL' for r in results))
