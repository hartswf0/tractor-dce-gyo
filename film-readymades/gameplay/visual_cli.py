"""Role-scoped CLI for an LLM operator. No direct game-state writes."""
import json,sys,time,uuid
from pathlib import Path
q=Path(__file__).parent/'visual-queue';q.mkdir(exist_ok=True)
role,op=sys.argv[1:3]
if role not in ('shopper','detective'):raise SystemExit('Unknown role')
data={'role':role,'operation':op}
if op=='act':data['action']=json.loads(sys.argv[3])
f=q/(uuid.uuid4().hex+'.request.json');tmp=f.with_suffix('.tmp');tmp.write_text(json.dumps(data));tmp.rename(f)
reply=Path(str(f).replace('.request.json','.reply.json'))
for _ in range(1200):
 if reply.exists():print(reply.read_text());break
 time.sleep(.1)
else:raise SystemExit('Operator bridge did not respond')
