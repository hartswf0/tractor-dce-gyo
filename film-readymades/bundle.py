from pathlib import Path
import json,base64
R=Path(__file__).parent;data=json.loads((R/'catalogue.json').read_text());images={p.stem:'data:image/jpeg;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (R/'previews').glob('*.jpg')}
s=(R/'atlas.template.html').read_text()
for key,value in dict(DATA=data,CASES=json.loads((R/'cases.json').read_text()),DONORS={p.stem:p.read_text() for p in (R/'donors').glob('*.mpd')},IMAGES=images,THEORY=(R/'THEORY.md').read_text()).items():s=s.replace('/*'+key+'*/',json.dumps(value).replace('</','<\\/'))
(R/'Film-Butter-Donor-Atlas.html').write_text(s)
print(len(s),'bytes',len(images),'native preview images')
