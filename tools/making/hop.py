#!/usr/bin/env python3
"""tools/making/hop.py — Hearts of Plastic: the behind-the-scenes episodes shot on the film's own sets (odyssey/writers-room/BIBLE.md).

Each episode is a "book 26" scene (OD-B26-S0N) whose card is a real location's card (the set the Odyssey film was shot on, as the
forage wrote it), with the Odyssey actors it needs kept, the others struck, and the crew walked onto it: the Director, the First AD
and the Cinematographer, the minifigures of the making-of studio (tools/making/studio.py). The crew's furniture (the camera on its
tripod, the director's chair, the clapperboard) are keyframe props (tools/forage/keyprops.js), placed per key (tools/making/hop_keys.py).

Writes odyssey/cards/OD-B26-S0N.mpd and odyssey/previs/OD-B26-S0N.json. The crew stand inside the set's own bounds, so the build's
frame (its centre and scale) is the source location's, and marks written in that location's coordinates hold here.

    python3 tools/making/hop.py [OD-B26-S01 ...]"""
from pathlib import Path
import json, math, re, subprocess, sys
REPO = Path(__file__).resolve().parents[2]; sys.path.insert(0, str(Path(__file__).parent))
import studio as ST

CREW = {c[0]: c for c in ST.CAST + [ST.SWEEPER, ST.FIRSTAD]}
# episode id: the source location, its title, the cast kept from the source card (by file stem), cast borrowed from other cards
# (source scene, file stem, new name), the crew, and where each stands in the card (location x, z: the build's frame)
EPISODES = {
 'OD-B26-S01': dict(src='OD-B09-S06', title='HEARTS OF PLASTIC: THE CAVE', keep=['odysseus', 'polyphemus', 'stone', 'fire-and-dry-logs', 'cyclops-flock'], borrow=[],
                    crew=dict(director=(-160, 110), firstad=(-110, 130), cinematographer=(-60, 150))),
 'OD-B26-S02': dict(src='OD-B17-S05', title='HEARTS OF PLASTIC: THE HALL', keep=['odysseus-as-beggar', 'antinous', 'chair'], borrow=[('OD-B18-S02', 'irus', 'irus')],
                    borrow_at=dict(irus=(-40, 200)), crew=dict(director=(120, 180), firstad=(40, 120), cinematographer=(-5, 155))),
 # Achilles as he was cast before 5d16363d took the visored gladiator helmet (95676) off him: the helmet the fans want
 'OD-B26-S03': dict(src='OD-B11-S04', title='HEARTS OF PLASTIC: THE UNDERWORLD', keep=['odysseus', 'anticleia'], borrow=[('OD-B11-S07', 'achilles', 'achilles', '5d16363d^')],
                    borrow_at=dict(achilles=(240, 180)), crew=dict(director=(90, 230), firstad=(40, 200), cinematographer=(-30, 265))),
}

def _blocks(text): return [b for b in re.split(r'(?m)^(?=0 FILE )', text) if b.startswith('0 FILE ')]
def _name(b): return b.split('\n', 1)[0][7:].strip()

def card(eid):
    E = EPISODES[eid]; src = E['src']
    prod = json.loads((REPO / 'film-readymades/production' / ('odyssey-' + src.lower() + '.json')).read_text())
    s, c = prod['scale'], prod['center']
    to_ldraw = lambda x, z: (x / s + c[0], -(z / s + c[2]))
    text = (REPO / 'odyssey/cards' / (src + '.mpd')).read_text().replace(src, eid)
    pv = json.loads((REPO / 'odyssey/previs' / (src + '.json')).read_text().replace(src, eid))
    blocks = _blocks(text); main = blocks[0]
    group = re.findall(r'(?m)^1 .* (' + re.escape(eid) + r' - [^\n]+\.ldr)\s*$', main)[1]   # the plate first, then the scene's group
    gb = next(b for b in blocks if _name(b) == group)
    lines = gb.rstrip('\n').split('\n'); refs = [l for l in lines if l.startswith('1 ')]
    stage = refs[0].split(' ', 14)[14]
    keep = {f'{eid} - {k}.ldr' for k in E['keep']} | {stage}
    out_lines = [l for l in lines if not l.startswith('1 ') or l.split(' ', 14)[14] in keep]
    extra = []
    for bsid, stem, new, *rev in E['borrow']:   # rev: a commit to take the figure from (the card as it was then)
        text_b = subprocess.run(['git', 'show', f'{rev[0]}:odyssey/cards/{bsid}.mpd'], cwd=REPO, capture_output=True, text=True, check=True).stdout if rev else (REPO / 'odyssey/cards' / (bsid + '.mpd')).read_text()
        bb = next(b for b in _blocks(text_b) if _name(b) == f'{bsid} - {stem}.ldr')
        fn = f'{eid} - {new}.ldr'; extra.append(bb.replace(f'{bsid} - {stem}.ldr', fn))
        x, z = to_ldraw(*E['borrow_at'][new]); out_lines.append(f'1 16 {x:.0f} -8 {z:.0f} 1 0 0 0 1 0 0 0 1 {fn}')
        pv['cast'].append(dict(who='character.' + new, name=new.replace('-', ' ').upper(), type='character', file=fn))
    for n, (lx, lz) in E['crew'].items():
        _, who, note, *_, rows = CREW[n]; fn = f'{eid} - {n}.ldr'; x, z = to_ldraw(lx, lz)
        out_lines.append(f'1 16 {x:.0f} -8 {z:.0f} 1 0 0 0 1 0 0 0 1 {fn}')
        extra.append(ST.block(fn, n, ['0 // figure: ' + note] + rows))
        pv['cast'].append(dict(who='character.' + n, name=n.upper(), type='character', file=fn))
    files_kept = {l.split(' ', 14)[14] for l in out_lines if l.startswith('1 ')}
    pv['cast'] = [m for m in pv['cast'] if m.get('file') in files_kept]
    # every FILE still reachable from the main file
    by = {_name(b): b for b in blocks}; by[group] = '\n'.join(out_lines) + '\n'
    for b in extra: by[_name(b)] = b
    need, todo = [], [_name(main)]
    while todo:
        n = todo.pop(0)
        if n in need or n not in by: continue
        need.append(n); todo += re.findall(r'(?m)^1 (?:\S+ ){13}(.+\.ldr)\s*$', by[n])
    mpd = '\n'.join(by[n].rstrip('\n') + '\n' for n in need)
    mpd = mpd.replace('0 ' + pv['title'] + '\n', '0 ' + E['title'] + '\n', 1)
    pv.update(id=eid, title=E['title'], book=26)
    for sh in pv['shots']: sh['camera']['subject'] = 0
    return mpd, pv

if __name__ == '__main__':
    for eid in [a for a in sys.argv[1:] if a.startswith('OD-B26')] or list(EPISODES):
        mpd, pv = card(eid)
        (REPO / 'odyssey/cards' / (eid + '.mpd')).write_text(mpd)
        (REPO / 'odyssey/previs' / (eid + '.json')).write_text(json.dumps(pv, indent=1))
        print(eid, 'card', mpd.count('\n1 '), 'placements;', 'cast', [m['name'] for m in pv['cast']])
