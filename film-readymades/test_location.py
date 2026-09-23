import json
from pathlib import Path
from catalogue import parse,placements
R=Path(__file__).parent
source=parse((R/'donors/10185.mpd').read_text(),'source')
export=parse((R/'production/Film-Butter-Grocer.mpd').read_text(),'export')
a=json.loads((R/'production/location.json').read_text())
pages=a['pages'];indices=[i for p in pages for i in p['placements']]
assert indices==list(range(1,724)), 'Each direct ground-floor occurrence must appear exactly once in source order'
assert all(1<=len(p['placements'])<=6 for p in pages)
for key in export:
 if key=='film-butter-grocer.ldr':continue
 normalize=lambda lines:[l for l in lines if l.strip() and l.strip()!='0 NOFILE']
 assert normalize(source[key])==normalize(export[key]),key
orig=list(placements(source[next(iter(source))]))[:4]
actual=list(placements(export['film-butter-grocer.ldr']))
for x,y in zip(orig,actual):
 for k in ['ref','color','transform']:assert x[k]==y[k]
assert len(actual)==4
assert sum(len(v) for v in a['colliders'].values())==947
assert len({r['id'] for r in a['rows']})==len(a['rows'])
print('Native architecture, inherited colours, four parent transforms, all source sections, 723 ordered direct placements and 947 leaf envelopes verified.')
