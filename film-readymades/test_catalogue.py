from pathlib import Path
import json
from catalogue import parse,closure,leaves,placements
R=Path(__file__).parent;a=json.loads((R/'catalogue.json').read_text())
for m in a['modules']:
 source=parse((R/'donors'/(m['kit']+'.mpd')).read_text(),m['kit']+'.ldr');out=parse((R/m['file']).read_text(),m['name'])
 assert next(iter(out))==m['name']
 assert set(out)==set(closure(source,m['name']))
 assert leaves(out,m['name'])==m['leafInstances']
 for k in out:
  assert list(placements(out[k]))==list(placements(source[k])), 'changed transform or source step'
# A definition reused twice must remain two instance occurrences.
s=parse('0 FILE root.ldr\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 child.ldr\n1 16 20 0 0 1 0 0 0 1 0 0 0 1 child.ldr\n0 FILE child.ldr\n1 4 0 0 0 1 0 0 0 1 0 0 0 1 3003.dat','root.ldr')
assert len(closure(s,'root.ldr'))==2 and leaves(s,'root.ldr')==2
s['child.ldr'].append('1 16 0 0 0 1 0 0 0 1 0 0 0 1 root.ldr')
try:closure(s,'root.ldr');raise AssertionError('cycle not rejected')
except ValueError:pass
print(f"{len(a['modules'])} rooted extracts preserve dependency closure, transforms, source steps and leaf occurrence counts. Repeated-instance and cycle tests pass.")
