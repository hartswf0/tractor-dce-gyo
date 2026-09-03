#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pull each agent's own transcript into arena-traces.json: what it thought, what it ran,
what came back, and what it cost. Read straight from the session's task transcripts; no
summarising by another model, and nothing invented — where a field is absent it stays absent.

usage: python3 extract-traces.py [tasks-dir]
"""
import json, os, sys, re, datetime

TASKS = sys.argv[1] if len(sys.argv) > 1 else \
    '/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/tasks'
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
AGENTS = {                      # agent id → seed, as launched
 'adb7353e9d56af0d5': 'S01', 'a2ae3fc9b17e32ef8': 'S02', 'add3a0467d8af9fce': 'S03',
 'a4ec093332da1bc4e': 'S04', 'a7be5dc0182ed1050': 'S05', 'ae2f87c629495c9a3': 'S06',
 'ac76ce4c0764603ba': 'S07',
}
CAP = 2600          # per-block character cap: enough to read, small enough to ship

def clip(s, n=CAP):
    s = (s or '').strip()
    return s if len(s) <= n else s[:n].rstrip() + f'\n… [{len(s) - n} more characters in the transcript]'

def text_of(content):
    if isinstance(content, str): return content
    out = []
    for b in content or []:
        if isinstance(b, dict) and b.get('type') == 'text': out.append(b.get('text', ''))
    return '\n'.join(out)

def main():
    seeds = {}
    for aid, sid in AGENTS.items():
        path = os.path.join(TASKS, aid + '.output')
        if not os.path.exists(path): continue
        events, usage = [], dict(input=0, output=0, cache_write=0, cache_read=0, requests=0)
        t0 = t1 = None
        tools = {}
        for line in open(path, encoding='utf-8', errors='ignore'):
            try: e = json.loads(line)
            except Exception: continue
            ts = e.get('timestamp')
            if ts:
                t0 = t0 or ts; t1 = ts
            typ = e.get('type')
            msg = e.get('message') or {}
            if typ == 'assistant':
                u = msg.get('usage') or {}
                if u:
                    usage['requests'] += 1
                    usage['input'] += u.get('input_tokens', 0)
                    usage['output'] += u.get('output_tokens', 0)
                    usage['cache_write'] += u.get('cache_creation_input_tokens', 0)
                    usage['cache_read'] += u.get('cache_read_input_tokens', 0)
                for b in msg.get('content') or []:
                    if not isinstance(b, dict): continue
                    if b.get('type') == 'thinking' and b.get('thinking'):
                        events.append(dict(k='think', t=ts, s=clip(b['thinking'])))
                    elif b.get('type') == 'text' and b.get('text', '').strip():
                        events.append(dict(k='say', t=ts, s=clip(b['text'])))
                    elif b.get('type') == 'tool_use':
                        name = b.get('name', '?'); inp = b.get('input') or {}
                        tools[name] = tools.get(name, 0) + 1
                        if name == 'Bash': arg = inp.get('command', '')
                        elif name in ('Read', 'Write', 'Edit'): arg = inp.get('file_path', '')
                        elif name == 'Grep': arg = inp.get('pattern', '') + ' ' + str(inp.get('path', ''))
                        else: arg = json.dumps(inp)
                        events.append(dict(k='run', t=ts, tool=name, s=clip(str(arg), 1400),
                                           id=b.get('id')))
            elif typ == 'user':
                for b in (msg.get('content') if isinstance(msg.get('content'), list) else []) or []:
                    if isinstance(b, dict) and b.get('type') == 'tool_result':
                        c = b.get('content')
                        s = c if isinstance(c, str) else text_of(c)
                        events.append(dict(k='back', t=ts, s=clip(s, 1800),
                                           err=bool(b.get('is_error')), id=b.get('tool_use_id')))
        dur = None
        if t0 and t1:
            try:
                a = datetime.datetime.fromisoformat(t0.replace('Z', '+00:00'))
                b = datetime.datetime.fromisoformat(t1.replace('Z', '+00:00'))
                dur = round((b - a).total_seconds())
            except Exception: pass
        seeds[sid] = dict(agent=aid, events=events, usage=usage, tools=tools,
                          seconds=dur, started=t0, ended=t1,
                          note='Read from this session\'s own task transcript. Thinking blocks are the '
                               'agent\'s reasoning as recorded; long blocks are clipped and say so.')
    out = os.path.join(REPO, 'arena-traces.json')
    json.dump(dict(generated=datetime.datetime.utcnow().isoformat() + 'Z', seeds=seeds),
              open(out, 'w'), separators=(',', ':'))
    tot = dict(input=0, output=0, cache_write=0, cache_read=0, requests=0)
    for sid, s in sorted(seeds.items()):
        u = s['usage']
        for k in tot: tot[k] += u[k]
        print(f"{sid}  {len(s['events']):4d} events · {u['requests']:3d} requests · "
              f"out {u['output']:7,d} · in {u['input']:6,d} · cache w {u['cache_write']:8,d} r {u['cache_read']:9,d} · "
              f"{s['seconds']}s · tools " + ', '.join(f'{k}×{v}' for k, v in sorted(s['tools'].items(), key=lambda x: -x[1])))
    print(f"TOTAL  {tot['requests']} requests · output {tot['output']:,} · input {tot['input']:,} · "
          f"cache write {tot['cache_write']:,} · cache read {tot['cache_read']:,}")
    print(out, os.path.getsize(out), 'bytes')

if __name__ == '__main__':
    main()
