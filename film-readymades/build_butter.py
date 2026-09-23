from pathlib import Path
import json,re,gzip,base64
R=Path(__file__).parent;B=R.parent/'butter-film-scenes';out=R/'production'
s=gzip.decompress((R/'base-player.html.gz').read_bytes()).decode()
# Articulate the actual native lower assembly on the existing hip/leg pivots.
s=s.replace("else if(p.role==='LOWER'||p.role==='OVERLAY')add('hipsP',p.file,color);", "else if(p.role==='LOWER'&&p.file==='3815c01.dat'){add('hipsP','3815.dat',color);add('legRP','3816.dat',color);add('legLP','3817.dat',color);}else if(p.role==='LOWER'||p.role==='OVERLAY')add('hipsP',p.file,color);")
# Preserve the established builder and every previous scene. Add the authored location first.
payload=s.split('window.ButterFilmData=',1)[1].split(';window.ButterAssemblyPlans=',1)[0]
a=json.loads(payload);a.insert(0,json.loads((out/'location.json').read_text()));a[0]['title']='Shopping trip · Green Grocer'
start=s.index('window.ButterFilmData=');end=s.index(';window.ButterAssemblyPlans=',start)
s=s[:start]+'window.ButterFilmData='+json.dumps(a,separators=(',',':')).replace('</','<\\/')+s[end:]
anchor='window.ButterWorkspace={fork,switchTo,send,capture,restoreReceipt,session,importSession'
s=s.replace(anchor,(R/'location-runtime.js').read_text()+'\n'+(R/'performance/take.js').read_text()+'\n'+(R/'performance/contact-review.js').read_text()+'\n'+(R/'gameplay/shop.js').read_text()+'\n'+(R/'gameplay/peers.js').read_text()+'\n'+(R/'gameplay/operators.js').read_text()+'\n'+(R/'gameplay/visual-play.js').read_text()+'\n'+(R/'gameplay/embodied-hands.js').read_text()+'\n'+(R/'gameplay/doors.js').read_text()+'\n'+anchor,1)
performance_data='<script>window.GrocerTakeAssets='+(out/'performance-assets.json').read_text()+';window.GrocerTakeSound='+json.dumps('data:audio/mpeg;base64,'+base64.b64encode((R/'performance/soundtrack.mp3').read_bytes()).decode())+';</script>'
evidence_path=R/'gameplay/final-run-verification.json'
if not evidence_path.exists() or not json.loads(evidence_path.read_text()).get('passed'): evidence_path=R/'gameplay/hand-verification.json'
hand_evidence=json.loads(evidence_path.read_text()) if evidence_path.exists() else {}
if hand_evidence.get('passed'): hand_evidence['run']['label']='Scripted playthrough · hands, checkout and exit' if evidence_path.name.startswith('final') else 'Scripted hand-control test'
hand_recording=json.dumps(hand_evidence.get('run') if hand_evidence.get('passed') else None,separators=(',',':'))
operator_data='<script>window.FilmHandRecording='+hand_recording+';window.FilmOperatorRecording='+((R/'gameplay/llm-run.json').read_text() if (R/'gameplay/llm-run.json').exists() else 'null')+';</script>'
s=s.replace('</head>',operator_data+performance_data+'<script>'+(R/'gameplay/vendor/peerjs.min.js').read_text()+'</script><script>'+(R/'gameplay/vendor/qrcode.js').read_text()+'</script></head>',1)
s=s.replace('butter-films-base-v1','butter-readymade-base-v1').replace('butter-films-scenes-v1','butter-readymade-scenes-v1').replace('butter-films-workspace-v1','butter-readymade-workspace-v1')
css='''#locationReview{position:absolute;bottom:14px;left:14px;right:14px;z-index:42;background:#132320ed;border:1px solid #667b65;border-radius:9px;padding:8px 12px;color:#eaf0df;font:12px/1.4 system-ui;max-height:130px;overflow:auto}#locationReview[hidden],#locationView[hidden]{display:none!important}#locationReview>div{display:flex;align-items:center;gap:10px}#locationReview input{flex:1;min-width:20px;accent-color:#c4f46a}#locationReview p{margin:4px 0}#locationReview button{min-height:32px;min-width:32px}#locationView{max-width:145px}body[data-film-mode=walk] #locationView{display:none}'''
css+=(R/'performance/take.css').read_text()+(R/'gameplay/shop.css').read_text()
s=s.replace('renderer.shadowMap.enabled=true','renderer.shadowMap.enabled=false')
s=s.replace('</body>','<style>'+css+'</style></body>')
(out/'Film-Butter-Readymades.html').write_text(s)
print('Built',len(s),'characters;',len(a),'locations')
