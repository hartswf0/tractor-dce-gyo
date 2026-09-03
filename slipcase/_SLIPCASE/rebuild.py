#!/usr/bin/env python3
"""Rebuild every root card and _MD mirror from ZETTELS.jsonl and verify each SHA-256.
usage: python3 rebuild.py ZETTELS.jsonl <out-dir>"""
import sys, os, json, hashlib
src, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, '_MD'), exist_ok=True)
ok = bad = 0
for line in open(src, encoding='utf-8'):
    r = json.loads(line); b = r['payload'].encode('utf-8')
    h = hashlib.sha256(b).hexdigest()
    open(os.path.join(out, r['filename']), 'wb').write(b)
    open(os.path.join(out, '_MD', r['filename'][:-4] + '.md'), 'wb').write(b)
    if h == r['sha256']: ok += 1
    else: bad += 1; print('HASH MISMATCH', r['filename'])
print(f'rebuilt {ok} cards; {bad} hash mismatches')
sys.exit(1 if bad else 0)
