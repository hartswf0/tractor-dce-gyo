#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Compile arena-data.json for arena.html: for each seed, the build in placement order,
the trace that produced it, the seed prompt, the brief, and the judge's verdict.

Nothing here is invented. Steps come from the world's own state (runs/<S>/state.json)
for the seeds that placed pieces, and from the emitted file's own order for the two
that composed. Traces come from the world log and, for S06/S07, from the round files.
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import isorender as ISO

NAMES = {
 'S01': ('FIELD-ROUTING', 'Show the builder the field of open ports, not the castle.'),
 'S02': ('RESIDUAL-PACKET', 'The useful part of "wrong" is the difference it points to.'),
 'S03': ('BUILDERS-GAME', '"Slab!" is not a prompt until the world knows what bringing a slab means.'),
 'S04': ('DECOMPILE-FIRST', 'Do not ask how to build it first; ask how it can come apart.'),
 'S05': ('BODY-AND-JOINTS', 'Give the piece proprioception: it knows what it takes and gives.'),
 'S06': ('EVENT-TRIGGERED-CALL', 'The reasoner is scheduled by the castle, not by the clock.'),
 'S07': ('CARD-TO-MASSING', 'The reference card compiles to a build order.'),
}
PLACED = ('S01', 'S02', 'S03', 'S04', 'S05')     # placed piece by piece through the world
COMPOSED = ('S06', 'S07')                        # the repo's layered builder built it

def desc(pid):
    r = ISO.resolve(pid)
    return ISO.PARTS[r]['d'].replace('  ', ' ').strip() if r else pid

def resolvable(pid):
    return ISO.resolve(pid) is not None

def r2(v):
    return round(v, 2)

def ldraw_line(part, colour, pos, mat):
    """An exact type-1 LDraw line for one placement, in world coordinates."""
    p = ' '.join(str(r2(x)) for x in pos)
    m = ' '.join(str(r2(x)) for x in mat)
    return f"1 {colour} {p} {m} {part}.dat"

def read(path, default=''):
    return open(path, encoding='utf-8').read() if os.path.exists(path) else default

def steps_from_state(seed):
    S = json.load(open(f'{HERE}/runs/{seed}/state.json'))
    log = S.get('log', [])
    by_i = {e['i']: e for e in log if e.get('t') == 'seated' and 'i' in e}
    inst_at = {}
    for inst in S.get('instances', []):
        if inst.get('members'): inst_at[inst['members'][0]] = inst
    # refusals, in order, attach to the piece index that followed them
    refusals, seen = {}, 0
    for e in log:
        if e.get('t') == 'seated': seen = e.get('i', seen)
        elif e.get('t') == 'refused': refusals.setdefault(seen + 1, []).append(e)
    steps = []
    for i, p in enumerate(S['places']):
        if not resolvable(p['part']): continue
        e = by_i.get(i)
        st = dict(i=i, part=p['part'], d=desc(p['part']), c=p.get('color', 16),
                  pos=[r2(x) for x in p['pos']], mat=[r2(x) for x in p['mat']],
                  line=ldraw_line(p['part'], p.get('color', 16), p['pos'], p['mat']),
                  g=p.get('group') or p.get('instanceOf') or None)
        if i == 0: st['cmd'] = f"init — {desc(p['part'])}"; st['reply'] = 'the ground: every stud is an open port'
        elif i in inst_at:
            n = inst_at[i]
            st['cmd'] = f"instance {n['noun']} AT ({n['at'][0]},{n['at'][2]}){' MIRRORED' if n.get('mat', [1])[0] == -1 else ''}"
            st['reply'] = f"INSTANCED {n['noun']} → {len(n['members'])} pieces in one submodel"
            st['mark'] = 'instance'
        elif p.get('instanceOf'):
            st['cmd'] = None
        elif e:
            f = e.get('facing', 'e')
            verb = 'again' if e.get('note') == 'again' else 'place'
            st['cmd'] = f"{verb} {e['part']} {e['colour']} FACING {f}"
            pos = e.get('pos') or p['pos']
            st['reply'] = f"SEATED {desc(e['part'])} at ({pos[0]},{pos[1]},{pos[2]}) · took {e.get('takes', '?')} stud(s)"
        if i in refusals:
            st['refused'] = [f"REFUSED {r.get('part', '')} → {r.get('why', '')[:150]}" for r in refusals[i]]
        steps.append(st)
    named = [k for k in S.get('groups', {}) if not k.startswith('__')]
    return steps, named, S

def steps_from_mpd(seed, path):
    """The composed builds carry their order in the file: layer submodel by layer submodel."""
    text = read(path)
    # walk the root in order, remembering which submodel each piece came from
    blocks, order, cur, name = {}, [], [], None
    for line in text.split('\n'):
        s = line.strip()
        if s.lower().startswith('0 file '):
            if name: blocks[name] = cur
            name = s[7:].strip().lower(); cur = []; order.append(name)
        elif s.startswith('1 '): cur.append(s)
    if name: blocks[name] = cur
    steps = []
    def walk(bn, pos, mat, colour, tag, depth=0):
        if depth > 10: return
        for s in blocks.get(bn, []):
            f = s.split()
            if len(f) < 15: continue
            c = int(f[1]); t = [float(x) for x in f[2:5]]; m = [float(x) for x in f[5:14]]
            ref = ' '.join(f[14:]).strip().lower()
            wp = [pos[i] + ISO.apply(mat, t)[i] for i in range(3)]
            wm = ISO.mmul(mat, m)
            wc = colour if c == 16 else c
            if ref in blocks: walk(ref, wp, wm, wc, ref.replace('.ldr', ''), depth + 1)
            else:
                pid = ref.replace('.dat', '').replace('\\', '/').rsplit('/', 1)[-1]
                if resolvable(pid):
                    steps.append(dict(i=len(steps), part=pid, d=desc(pid), c=wc,
                                       pos=[r2(x) for x in wp], mat=[r2(x) for x in wm],
                                       line=ldraw_line(pid, wc, wp, wm), g=tag))
    walk(order[0], [0, 0, 0], [1, 0, 0, 0, 1, 0, 0, 0, 1], 7, 'root')
    return steps

def rounds_for(seed):
    out = []
    d = f'{HERE}/runs/{seed}'
    for n in range(0, 9):
        j = f'{d}/judge{n}.json'
        spec = f'{d}/plan{n}.json' if seed == 'S06' else f'{d}/card-r{n}.json'
        rec = {'n': n}
        if os.path.exists(j):
            try:
                v = json.load(open(j)); rec['wins'] = v.get('wins'); rec['losses'] = v.get('losses')
                rec['pieces'] = v.get('pieces'); rec['share'] = (v.get('field') or {}).get('share')
            except Exception: pass
        if os.path.exists(spec):
            try: rec['spec'] = json.dumps(json.load(open(spec)))[:1200]
            except Exception: pass
        if len(rec) > 1: out.append(rec)
    return out

def main():
    seeds = []
    for sid, (name, tagline) in NAMES.items():
        rp = f'{HERE}/runs/{sid}/report.json'
        if not os.path.exists(rp): continue
        rep = json.load(open(rp))
        notes = read(f'{HERE}/runs/{sid}/NOTES.md')
        prompt = read(f'{REPO}/slipcase/_PROMPTS/{sid}__' + {
            'S01': 'FIELD-ROUTING', 'S02': 'RESIDUAL-PACKET', 'S03': 'BUILDERS-GAME',
            'S04': 'DECOMPILE-FIRST', 'S05': 'BODY-AND-JOINTS', 'S06': 'EVENT-TRIGGERED-CALL',
            'S07': 'CARD-TO-MASSING'}[sid] + '.txt')
        brief = read(f'{HERE}/BRIEF-{sid}.md')
        if sid in PLACED:
            steps, named, S = steps_from_state(sid)
            counts = dict(seated=S.get('seated'), refusals=S.get('refusals'), undos=S.get('undos'),
                          calls=S.get('calls'), named=len(named), instances=len(S.get('instances', [])),
                          joints=S.get('jointsChecks'))
            rounds = []
        else:
            steps = steps_from_mpd(sid, f'{HERE}/runs/{sid}/castle-{sid}.mpd')
            named = sorted({s['g'] for s in steps if s.get('g')})
            counts = dict(rounds=rep.get('rounds'))
            rounds = rounds_for(sid)
        seeds.append(dict(id=sid, name=name, tagline=tagline, mode='placed' if sid in PLACED else 'composed',
                          cutoff=('cut off by the session running out of usage credits' if 'compiler, not by the agent' in notes else None),
                          pieces=rep['pieces'], blocks=rep['blocks'],
                          wins=rep['judge']['wins'], losses=rep['judge']['losses'],
                          share=rep['field']['share'], axes=rep['judge']['axes'],
                          counts=counts, rounds=rounds, named=named, steps=steps,
                          notes=notes, prompt=prompt, brief=brief,
                          mpd=f'slipcase-build/arena/runs/{sid}/castle-{sid}.mpd'))
    base = json.load(open(f'{HERE}/results.json'))['baseline']
    baseline = dict(id='BASE', name='NO AGENT', tagline='the layered builder, unattended: the castle card as the code compiles it',
                    mode='composed', cutoff=None, pieces=base['pieces'], blocks=19, wins=base['wins'], losses=base['losses'],
                    share=base['share'], axes=base['axes'], counts={}, rounds=[], named=[],
                    steps=steps_from_mpd('BASE', f'{REPO}/builds/card-castle.mpd'), notes='', prompt='', brief='',
                    mpd='builds/card-castle.mpd')
    colours = {str(k): '#%02x%02x%02x' % v for k, v in ISO.COL.items()}
    data = dict(generated=__import__('datetime').datetime.utcnow().isoformat() + 'Z',
                bar='5935 Island Hopper', band=[0.112, 0.431], colours=colours,
                world=read(f'{HERE}/WORLD.md'), common=read(f'{HERE}/BRIEF-COMMON.md'),
                seeds=[baseline] + seeds)
    out = f'{REPO}/arena-data.json'
    json.dump(data, open(out, 'w'), separators=(',', ':'))
    print(out, os.path.getsize(out), 'bytes ·', len(data['seeds']), 'builds ·',
          sum(len(s['steps']) for s in data['seeds']), 'steps total')

if __name__ == '__main__':
    main()
