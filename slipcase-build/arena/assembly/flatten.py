#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Flatten an object's submodel tree into the order a builder actually works in.

Every primitive placement, in build order, carrying the transform it ends up
with in the finished object and the subassembly it came out of. That gives the
arena two things at once: a partial build is just the first k lines, and each
line knows which structure — and which copy of it — it belongs to.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, HERE)
from analyze import parse_mpd, is_library, TARGETS   # noqa: E402

IDENT = (1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)


def mul(m, n):
    """3x3 row-major multiply."""
    return tuple(
        sum(m[r * 3 + k] * n[k * 3 + c] for k in range(3))
        for r in range(3) for c in range(3)
    )


def apply(m, v):
    return tuple(sum(m[r * 3 + k] * v[k] for k in range(3)) for r in range(3))


def fmt(x):
    """LDraw numbers, short but lossless enough to place a stud."""
    r = round(x, 4)
    if r == int(r):
        return str(int(r))
    return ('%.4f' % r).rstrip('0').rstrip('.')


def flatten(path, label, cap=20000):
    blocks, order = parse_mpd(path)
    models = {k: v for k, v in blocks.items() if not is_library(v['name'])}
    if not order:
        return None
    root = order[0]
    if root not in models:
        cand = [k for k in order if k in models]
        if not cand:
            return None
        root = cand[0]

    lines, steps, subs_of_line, occ_of_line = [], [], [], []
    sub_names, sub_index = [], {}
    occ_seen = {}
    overflow = [False]

    def walk(key, mat, tr, colour, step_holder, sub_id, occ, depth):
        if overflow[0] or depth > 40:
            return
        blk = models[key]
        marks = set(blk['steps'])
        for i, (c, ref) in enumerate(blk['refs']):
            if key == root and i in marks and i > 0:
                step_holder[0] += 1
            raw = blk['raw'][i]
            cm, ct = raw['m'], raw['t']
            wm = mul(mat, cm)
            wt = tuple(a + b for a, b in zip(apply(mat, ct), tr))
            cc = colour if c == 16 else c
            rk = ref.lower()
            if rk in models:
                if rk not in sub_index:
                    sub_index[rk] = len(sub_names)
                    sub_names.append(models[rk]['name'])
                occ_seen[rk] = occ_seen.get(rk, 0) + 1
                walk(rk, wm, wt, cc, step_holder, sub_index[rk], occ_seen[rk], depth + 1)
            else:
                if len(lines) >= cap:
                    overflow[0] = True
                    return
                lines.append('1 %d %s %s %s %s %s' % (
                    cc, fmt(wt[0]), fmt(wt[1]), fmt(wt[2]),
                    ' '.join(fmt(v) for v in wm), ref))
                steps.append(step_holder[0])
                subs_of_line.append(sub_id)
                occ_of_line.append(occ)

    walk(root, IDENT, (0.0, 0.0, 0.0), 16, [0], -1, 0, 0)

    # where each subassembly copy starts and ends in the path
    spans = {}
    for i, (s, o) in enumerate(zip(subs_of_line, occ_of_line)):
        if s < 0:
            continue
        k = '%d:%d' % (s, o)
        if k not in spans:
            spans[k] = [i, i]
        else:
            spans[k][1] = i

    return {
        'id': label,
        'root': models[root]['name'],
        'lines': lines,
        'step': steps,
        'sub': subs_of_line,
        'occ': occ_of_line,
        'sub_names': sub_names,
        'spans': spans,
        'steps_total': (max(steps) + 1) if steps else 0,
        'truncated': overflow[0],
    }


def split_blocks(path):
    """Every `0 FILE` block in the file, as raw text, in order."""
    out, name, buf = [], None, []
    with open(path, encoding='utf-8', errors='ignore') as fh:
        for line in fh:
            if line.strip().lower().startswith('0 file '):
                if name is not None:
                    out.append((name, ''.join(buf)))
                name, buf = line.strip()[7:].strip(), [line]
            elif name is not None:
                buf.append(line)
    if name is not None:
        out.append((name, ''.join(buf)))
    return out


def on_disk(ref):
    """Does the vendored LDraw library already have this file?"""
    r = ref.lower().replace('\\', '/')
    for base in ('ldraw/', ''):
        if os.path.exists(os.path.join(ROOT, base + r)):
            return True
    for sub in ('parts/', 'p/'):
        if os.path.exists(os.path.join(ROOT, 'ldraw', sub + os.path.basename(r))):
            return True
    return False


def write_inline(path, label, out_dir):
    """Keep only the blocks the library on disk cannot supply.

    A kit MPD inlines every part it uses. Re-parsing that on every render costs
    the same 25 seconds each time, while parts pulled from ./ldraw/ are cached
    by the loader after the first fetch. So the arena ships the model and the
    handful of genuinely custom parts, and lets the library serve the rest.
    """
    kept = []
    for name, text in split_blocks(path):
        if is_library(name) and on_disk(name):
            continue
        if is_library(name):
            kept.append(text)
        elif os.path.basename(name).lower().endswith('.dat'):
            kept.append(text)          # a custom part masquerading as a model block
    dst = os.path.join(out_dir, label + '-inline.mpd')
    with open(dst, 'w') as fh:
        fh.write(''.join(kept))
    return len(kept), os.path.getsize(dst)


def main():
    out_dir = os.path.join(ROOT, 'assembly-paths')
    os.makedirs(out_dir, exist_ok=True)
    index = []
    for rel, label in TARGETS:
        p = os.path.join(ROOT, rel)
        if not os.path.exists(p):
            continue
        d = flatten(p, label)
        if not d or not d['lines']:
            print('skip', label); continue
        dst = os.path.join(out_dir, label + '.json')
        json.dump(d, open(dst, 'w'), separators=(',', ':'))
        n_inline, inline_bytes = write_inline(p, label, out_dir)
        index.append({'id': label, 'lines': len(d['lines']), 'steps': d['steps_total'],
                      'subs': len(d['sub_names']), 'kb': round(os.path.getsize(dst) / 1024)})
        print('%-14s %5d placements  %3d steps  %3d subassemblies  %4d KB  '
              'custom parts kept: %d (%d KB)%s'
              % (label, len(d['lines']), d['steps_total'], len(d['sub_names']),
                 index[-1]['kb'], n_inline, round(inline_bytes / 1024),
                 '  TRUNCATED' if d['truncated'] else ''))
    return index


if __name__ == '__main__':
    sys.setrecursionlimit(10000)
    main()
