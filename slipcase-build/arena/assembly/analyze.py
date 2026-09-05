#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Assembly-theory metrics, read straight off the LDraw files.

For each object: the submodel DAG, how many times each distinct subassembly
actually occurs (copy number), the shortest build that is allowed to reuse
anything it has already made (assembly index), and the build with no reuse at
all. Nothing here is estimated — every number falls out of the file.
"""
import json, math, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))


def is_library(name):
    """A reference that resolves to the LDraw parts library, not to a subassembly."""
    n = name.lower().replace('\\', '/')
    return n.startswith('parts/') or n.startswith('p/') or n.startswith('s/')


def parse_mpd(path):
    """-> (blocks, order). blocks[name] = {'refs': [(colour, name)], 'steps': [n_refs...]}

    Blocks are delimited by `0 FILE`. Whatever sits before the first FILE is one
    more block, named by its last `0 Name:` (an MPD may open with an inlined
    LDConfig, which carries no geometry, followed by the root model).
    """
    blocks, order = {}, []
    cur, raw, name, lead_names = [], [], None, []
    steps = [0]

    def close():
        if name is None:
            return
        blocks[name.lower()] = {'name': name, 'refs': list(cur), 'raw': list(raw),
                                'steps': list(steps)}
        order.append(name.lower())

    with open(path, encoding='utf-8', errors='ignore') as fh:
        for line in fh:
            s = line.strip()
            if s.lower().startswith('0 file '):
                close()
                name, cur, raw, steps = s[7:].strip(), [], [], [0]
                lead_names = []
            elif s.lower().startswith('0 name:') and name is None:
                lead_names.append(s[7:].strip())
            elif s.upper().startswith('0 STEP'):
                steps.append(len(cur))
            elif s.startswith('1 '):
                f = s.split(None, 14)
                if len(f) >= 15:
                    try:
                        v = [float(x) for x in f[2:14]]
                    except ValueError:
                        continue
                    cur.append((int(f[1]), f[14].strip()))
                    raw.append({'t': (v[0], v[1], v[2]), 'm': tuple(v[3:12])})
                    if name is None and lead_names:
                        name = lead_names[-1]   # the root model in the leading chunk
        close()
    return blocks, order


def analyse(path, label):
    blocks, order = parse_mpd(path)
    if not order:
        return None
    models = {k: v for k, v in blocks.items() if not is_library(v['name'])}
    root = order[0]
    if root not in models:                       # fall back to first model-ish block
        cand = [k for k in order if k in models]
        if not cand:
            return None
        root = cand[0]

    def children(key):
        """Immediate children of a node: (kind, key_or_partname) per instance."""
        out = []
        for colour, ref in models[key]['refs']:
            rk = ref.lower()
            if rk in models:
                out.append(('sub', rk))
            else:
                out.append(('part', os.path.basename(rk)))
        return out

    # ---- recursive size + per-node assembly index, memoised over the DAG ----
    size_memo, ai_memo, guard = {}, {}, set()

    def size(key):
        """Total primitive parts once fully expanded."""
        if key in size_memo:
            return size_memo[key]
        if key in guard:
            return 0                              # cyclic reference: refuse to loop
        guard.add(key)
        n = 0
        for kind, ref in children(key):
            n += size(ref) if kind == 'sub' else 1
        guard.discard(key)
        size_memo[key] = n
        return n

    def assembly_index(key):
        """Shortest build of this node that may reuse anything already built:
        every distinct subassembly in its cone is built once, and joining k
        pieces costs k-1 joins."""
        if key in ai_memo:
            return ai_memo[key]
        seen, total = set(), 0
        stack = [key]
        while stack:
            k = stack.pop()
            if k in seen:
                continue
            seen.add(k)
            ch = children(k)
            total += max(0, len(ch) - 1)
            for kind, ref in ch:
                if kind == 'sub' and ref not in seen:
                    stack.append(ref)
        ai_memo[key] = total
        return total

    # ---- copy numbers: how many instances of each node in the finished object ----
    copies = {}

    def count(key, mult):
        for kind, ref in children(key):
            copies[ref] = copies.get(ref, 0) + mult
            if kind == 'sub':
                count(ref, mult)
    count(root, 1)

    total_parts = size(root)
    a_reuse = assembly_index(root)
    a_naive = max(0, total_parts - 1)

    # ---- distinct subassemblies, ranked by what their reuse actually saves ----
    subs = []
    for key in models:
        if key == root or key not in copies:
            continue
        n = copies[key]
        a = assembly_index(key)
        subs.append({
            'id': models[key]['name'],
            'parts': size(key),
            'a': a,
            'n': n,
            'saved': (n - 1) * size(key),          # parts you never place twice
        })
    subs.sort(key=lambda d: (-d['saved'], -d['n']))

    # ---- Assembly A = sum_i e^{a_i}(n_i - 1)/N, held in log space ----
    log_terms = [d['a'] + math.log(d['n'] - 1) - math.log(total_parts)
                 for d in subs if d['n'] > 1 and total_parts]
    if log_terms:
        m = max(log_terms)
        log10_A = (m + math.log(sum(math.exp(t - m) for t in log_terms))) / math.log(10)
    else:
        log10_A = None

    # ---- part vocabulary ----
    vocab = {}
    for ref, n in copies.items():
        if ref.lower().endswith('.dat'):
            vocab[ref] = n

    # ---- the root's own build order, cut at its STEP markers ----
    r = models[root]
    marks = sorted(set(r['steps'] + [len(r['refs'])]))
    steps = []
    for i in range(len(marks) - 1):
        a_, b_ = marks[i], marks[i + 1]
        if b_ > a_:
            steps.append(b_ - a_)

    return {
        'id': label,
        'file': os.path.relpath(path, ROOT),
        'root': models[root]['name'],
        'parts': total_parts,
        'placements': len(r['refs']),
        'subassemblies': len([k for k in models if k in copies or k == root]),
        'distinct_parts': len(vocab),
        'a_reuse': a_reuse,
        'a_naive': a_naive,
        'compression': round(a_naive / a_reuse, 2) if a_reuse else None,
        'log10_A': round(log10_A, 2) if log10_A is not None else None,
        'root_steps': steps,
        'top_subs': subs[:14],
        'vocab': vocab,
    }


TARGETS = [
    ('kits/75421-darth-vader-tie-fighter.mpd', 'VADER-TIE'),
    ('kits/10174-imperial-atst-ucs.mpd', 'AT-ST'),
    ('kits/7140-xwing-fighter.mpd', 'X-WING'),
    ('kits/5935-island-hopper.mpd', 'ISLAND-HOPPER'),
    ('kits/1621-lunar-mpv.mpd', 'LUNAR-MPV'),
    ('kits/4489-atat-mini.mpd', 'AT-AT-MINI'),
    ('kits/889-radar-truck.mpd', 'RADAR-TRUCK'),
    ('kits/30023-lighthouse.mpd', 'LIGHTHOUSE'),
    ('builds/card-castle.mpd', 'CASTLE-CARD'),
]


def main():
    out = []
    for rel, label in TARGETS:
        p = os.path.join(ROOT, rel)
        if not os.path.exists(p):
            print('missing', rel); continue
        try:
            d = analyse(p, label)
        except RecursionError:
            print('too deep', rel); continue
        if d:
            out.append(d)
            print('%-14s parts %6d  subs %4d  a(reuse) %6d  a(naive) %6d  x%-6s log10A %s'
                  % (d['id'], d['parts'], d['subassemblies'], d['a_reuse'], d['a_naive'],
                     d['compression'], d['log10_A']))

    # joint assembly space: distinct part types two objects share
    joint = {}
    for i, a in enumerate(out):
        for b in out[i + 1:]:
            sa, sb = set(a['vocab']), set(b['vocab'])
            if not sa or not sb:
                continue
            joint['%s|%s' % (a['id'], b['id'])] = {
                'shared': len(sa & sb),
                'only_a': len(sa - sb), 'only_b': len(sb - sa),
                'jaccard': round(len(sa & sb) / len(sa | sb), 3),
            }

    dst = os.path.join(ROOT, 'assembly-data.json')
    json.dump({'objects': out, 'joint': joint}, open(dst, 'w'), indent=1)
    print('wrote', os.path.relpath(dst, ROOT))


if __name__ == '__main__':
    sys.setrecursionlimit(10000)
    main()
