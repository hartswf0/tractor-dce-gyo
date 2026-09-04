#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Triage: read the seven agents' own raw transcripts and build a per-REQUEST
timeline (not just totals) — what tool ran, how big its result was, and how much
the cache grew right after — so "the cache took a lot of tokens" has an actual
cause attached to it instead of being a black box.
"""
import json, os, sys, datetime

TASKS = '/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/tasks'
HERE = os.path.dirname(os.path.abspath(__file__))
AGENTS = {
 'adb7353e9d56af0d5': 'S01', 'a2ae3fc9b17e32ef8': 'S02', 'add3a0467d8af9fce': 'S03',
 'a4ec093332da1bc4e': 'S04', 'a7be5dc0182ed1050': 'S05', 'ae2f87c629495c9a3': 'S06',
 'ac76ce4c0764603ba': 'S07',
}

def tool_arg(name, inp):
    if name == 'Bash': return (inp.get('command') or '')[:120]
    if name in ('Read', 'Write', 'Edit'): return inp.get('file_path', '')
    if name == 'Grep': return (inp.get('pattern', '') + ' ' + str(inp.get('path', '')))[:120]
    return json.dumps(inp)[:120]

def result_text_len(content):
    if isinstance(content, str): return len(content)
    if isinstance(content, list):
        return sum(len(b.get('text', '')) for b in content if isinstance(b, dict) and b.get('type') == 'text')
    return 0

def main():
    out = {}
    for aid, sid in AGENTS.items():
        path = os.path.join(TASKS, aid + '.output')
        if not os.path.exists(path): continue
        turns = []               # one per assistant message that carries usage
        pending_tools = {}       # tool_use_id -> {name, arg, requested_at_turn}
        cur_turn = None
        t0 = t1 = None
        for line in open(path, encoding='utf-8', errors='ignore'):
            try: e = json.loads(line)
            except Exception: continue
            ts = e.get('timestamp')
            if ts: t0 = t0 or ts; t1 = ts
            typ = e.get('type'); msg = e.get('message') or {}
            if typ == 'assistant':
                u = msg.get('usage') or {}
                toolsUsed = []
                for b in msg.get('content') or []:
                    if isinstance(b, dict) and b.get('type') == 'tool_use':
                        arg = tool_arg(b.get('name', '?'), b.get('input') or {})
                        toolsUsed.append({'name': b.get('name'), 'arg': arg})
                        pending_tools[b.get('id')] = {'name': b.get('name'), 'arg': arg}
                if u:
                    cur_turn = dict(ts=ts,
                        input=u.get('input_tokens', 0), output=u.get('output_tokens', 0),
                        cache_write=u.get('cache_creation_input_tokens', 0), cache_read=u.get('cache_read_input_tokens', 0),
                        tools_called=toolsUsed, tool_result_chars=0, tool_result_names=[])
                    turns.append(cur_turn)
            elif typ == 'user':
                content = msg.get('content')
                if isinstance(content, list):
                    for b in content:
                        if isinstance(b, dict) and b.get('type') == 'tool_result':
                            tid = b.get('tool_use_id')
                            info = pending_tools.get(tid, {})
                            n = result_text_len(b.get('content'))
                            if turns:
                                turns[-1]['tool_result_chars'] += n
                                turns[-1]['tool_result_names'].append(info.get('name', '?') + (':' + info.get('arg', '')[:60] if info.get('arg') else ''))
        # cache_read at turn i is what the API re-read (i.e. everything cached from
        # turns < i); its GROWTH turn to turn should track the size of what got
        # added to context by the previous turn's own output + its tool results.
        for i, t in enumerate(turns):
            prev_read = turns[i - 1]['cache_read'] if i > 0 else 0
            prev_write = turns[i - 1]['cache_write'] if i > 0 else 0
            t['cache_delta'] = t['cache_read'] - (prev_read + prev_write)
        total = dict(requests=len(turns), input=sum(t['input'] for t in turns), output=sum(t['output'] for t in turns),
                     cache_write=sum(t['cache_write'] for t in turns), cache_read=sum(t['cache_read'] for t in turns))
        # biggest single contributors to context growth: which tool results were largest
        by_result = sorted(turns, key=lambda t: -t['tool_result_chars'])[:6]
        top_results = [dict(ts=t['ts'], chars=t['tool_result_chars'], names=t['tool_result_names'][:3]) for t in by_result if t['tool_result_chars'] > 500]
        dur = None
        if t0 and t1:
            try:
                a = datetime.datetime.fromisoformat(t0.replace('Z', '+00:00')); b = datetime.datetime.fromisoformat(t1.replace('Z', '+00:00'))
                dur = round((b - a).total_seconds())
            except Exception: pass
        out[sid] = dict(agent=aid, total=total, seconds=dur, turns=[
            dict(n=i, cache_read=t['cache_read'], cache_write=t['cache_write'], output=t['output'],
                 tools=[x['name'] for x in t['tools_called']], result_chars=t['tool_result_chars'])
            for i, t in enumerate(turns)], top_context_growth=top_results)
    json.dump(out, open(os.path.join(HERE, 'cache-analysis.json'), 'w'), indent=1)
    for sid, d in sorted(out.items()):
        t = d['total']
        print(f"{sid}  requests {t['requests']:3d}  output {t['output']:7,d}  cache_read(total,summed-across-turns) {t['cache_read']:9,d}  "
              f"peak_single_turn_cache_read {max((x['cache_read'] for x in d['turns']), default=0):9,d}  "
              f"biggest tool result: {d['top_context_growth'][0]['chars'] if d['top_context_growth'] else 0} chars "
              f"({d['top_context_growth'][0]['names'] if d['top_context_growth'] else []})")

if __name__ == '__main__':
    main()
