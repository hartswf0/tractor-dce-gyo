from pathlib import Path
import json,shutil
from catalogue import parse,placements
R=Path(__file__).parent;D=R/'ldraw';D.mkdir(exist_ok=True)
roots=[D]+[R.parent/x/'ldraw' for x in ['sheep-parliament-blocking','sheep-parliament-forage','butter-film-scenes','undaunted-upgrade']]
paths={p.lower():p for p in json.loads((R/'part-index.json').read_text())}
def resolve(ref):return next((paths[q] for q in [ref,'parts/'+ref,'p/'+ref] if q in paths),None)
seen=set();pending=set();unknown=set()
def visit(ref):
 path=resolve(ref)
 if not path:unknown.add(ref);return
 if path in seen:return
 seen.add(path);f=next((root/path for root in roots if (root/path).exists()),None)
 if f is None:pending.add(path);return
 dest=D/path
 if f!=dest:dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,dest)
 for p in placements(f.read_text(errors='replace').splitlines()):visit(p['ref'])
for f in (R/'donors').glob('*.mpd'):
 sec=parse(f.read_text(),f.stem+'.ldr')
 for lines in sec.values():
  for p in placements(lines):
   if p['ref'] not in sec:visit(p['ref'])
for name in ['LDConfig.ldr','CAreadme.txt']:
 src=roots[1]/name
 if src.exists():shutil.copyfile(src,D/name)
(R/'dependency-state.json').write_text(json.dumps({'resolved':len(seen)-len(pending),'pending':sorted(pending),'unknown':sorted(unknown)},indent=2))
print(json.dumps(sorted(pending)))
