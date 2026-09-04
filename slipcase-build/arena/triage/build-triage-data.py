#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Merge cache-analysis.json (per-request timeline), arena-data.json (verdict/
health facts) and triage-assets/capture-stats.json (real-geometry triangle
counts) into one file the triage page reads. One fetch, no cross-referencing
in the browser.
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

arena = json.load(open(os.path.join(ROOT, 'arena-data.json')))
cache = json.load(open(os.path.join(ROOT, 'slipcase-build', 'arena', 'triage', 'cache-analysis.json')))
tri = json.load(open(os.path.join(ROOT, 'triage-assets', 'capture-stats.json')))

out = []
for s in arena['seeds']:
    sid = s['id']
    row = dict(
        id=sid, name=s['name'], tagline=s['tagline'], mode=s['mode'], cutoff=s.get('cutoff'),
        pieces=s['pieces'], blocks=s['blocks'], wins=s['wins'], losses=s['losses'], share=s['share'],
        axes=s['axes'], counts=s.get('counts') or {}, notes=s.get('notes') or '',
        triangles=(tri.get(sid) or {}).get('triangles'), image='triage-assets/%s.png' % sid,
    )
    c = cache.get(sid)
    if c:
        row['cache'] = dict(total=c['total'], seconds=c['seconds'], turns=c['turns'],
                             top_context_growth=c['top_context_growth'])
    out.append(row)

json.dump(dict(generated=arena.get('generated'), seeds=out),
           open(os.path.join(ROOT, 'triage-data.json'), 'w'), indent=1)
print('wrote triage-data.json:', len(out), 'seeds')
