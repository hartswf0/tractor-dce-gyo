"""Film Butter × Odyssey forage: a forage scene card becomes a Film Butter location you can walk, re-stage and shoot.

The forage (tools/odyssey-forage.js) drafts a scene at scale: its set as sub-builds on a stage, its cast blocked on marks,
its beats read into shots (odyssey/cards/<id>.mpd, odyssey/previs/<id>.json). Film Butter holds a scene by hand: pieces you
move, walls you cannot walk through, cast who walk and turn, camera marks you frame. This joins them:

  set      each sub-build of the stage becomes one movable Film Butter piece (precompiled triangles, the geometry compiler
           reading the repository's whole LDraw library), with its leaf-part envelopes as walking colliders and its place in
           the forage's order as a source-assembly page
  cast     each blocked minifigure becomes a Movieator actor (a walking, articulated figure) dressed in the forage's parts:
           head, hair or helmet, torso, hips and legs, beard, and the item in each hand on the hand's grip; the Cyclops and
           the props stand as pieces
  shots    the previs shots become the location's camera marks, one a beat, named for the beat and framed on its subject

python build_odyssey.py [OD-B09-S09 ...] [--with-readymades]   (no ids: SCENES) writes production/Film-Butter-Odyssey.html and production/odyssey-*.json
"""
from pathlib import Path
import json, gzip, base64, hashlib, re, sys, math
import numpy as np
import geometry_compiler as G
from catalogue import parse, placements

R = Path(__file__).parent; REPO = R.parent; OUT = R / 'production'
G.ROOT = REPO / 'ldraw'                                   # the whole library, not the donor subset
G.COL.update({int(m[1]): m[2] for l in (REPO / 'ldraw/LDConfig.ldr').read_text().splitlines() if (m := re.search(r'CODE\s+(\d+)\s+VALUE\s+(#[0-9A-Fa-f]{6})', l))})
flip = np.array([1, -1, -1])
glassCodes = {int(m[1]) for l in (REPO / 'ldraw/LDConfig.ldr').read_text().splitlines() if (m := re.search(r'CODE\s+(\d+).*ALPHA\s+(\d+)', l)) and int(m[2]) < 255}
DESC = {}
def desc(ref):
    ref = ref.lower().replace('\\', '/')
    if ref not in DESC:
        f = next((REPO / 'ldraw' / d / ref for d in ['parts', 'p'] if (REPO / 'ldraw' / d / ref).exists()), None)
        DESC[ref] = f.read_text(errors='replace').splitlines()[0][2:].strip() if f else ''
    return DESC[ref]
def mat(t): v = np.array(t); return v[3:].reshape(3, 3), v[:3]
def compose(A, a, B, b): return A @ B, A @ b + a

def world_children(sec, key, A=np.eye(3), a=np.zeros(3)):
    """(child key, colour, world rotation, world position) for each placement in a file, composed from the root."""
    for p in placements(sec[key]):
        B, b = mat(p['transform']); yield p['ref'], p['color'], *compose(A, a, B, b)

def leaves(sec, key, A, a, color):
    """Every leaf part under a placement, in world: (ref, colour, rotation, position)."""
    if key in sec and not key.endswith('.dat'):
        for p in placements(sec[key]):
            B, b = mat(p['transform']); c = color if p['color'] == 16 else p['color']
            yield from leaves(sec, p['ref'], *compose(A, a, B, b), c)
    else: yield key, color, A, a

def scene(sid):
    text = (REPO / 'odyssey/cards' / (sid + '.mpd')).read_text(); sec = parse(text, sid + '.ldr')
    pv = json.loads((REPO / 'odyssey/previs' / (sid + '.json')).read_text())
    main = sid.lower() + '.ldr'; kids = list(world_children(sec, main))
    plate = kids[0]; top = kids[1]; tops = list(world_children(sec, top[0], top[2], top[3]))
    stage, cast_places = tops[0], tops[1:]
    stage_kids = list(world_children(sec, stage[0], stage[2], stage[3]))
    cast_files = {c['file'].lower(): c for c in pv['cast'] if c.get('file')}
    # the frame: every leaf in world, flipped to y up; the floor at y 0, the footprint centred, scaled to Butter's plate
    allf = []
    tall = []   # each cast member's height, LDU, for framing
    for k, c, A, a in [plate, stage] + cast_places:
        ys = [(b * flip)[1] for ref, col, B, b in leaves(sec, k, A, a, c)]; allf += [b * flip for ref, col, B, b in leaves(sec, k, A, a, c)]
        tall.append(max(ys) - min(ys) + 24 if ys else 72)
    tall = tall[2:]
    allf = np.array(allf); lo = allf.min(0); hi = allf.max(0)
    center = np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2]); ext = max(hi[0] - lo[0], hi[2] - lo[2]) / 2
    scale = min(1.0, 330 / ext)
    B_ = lambda v: (np.asarray(v) * flip - center) * scale
    defs, rows, colliders, pages, actors, kinds, solid = [], [], {}, [], [], [], []
    def piece(label, placed, layer, collide=True, bulk=False):
        faces, colors, boxes = [], [], []
        for k, c, A, a in placed:
            for ref, col, Bm, b in leaves(sec, k, A, a, c if c != 16 else 7):
                try: ff, cc = G.geometry(ref, sec, col if col != 16 else 7)
                except FileNotFoundError: continue
                if not len(ff): continue
                w = ((ff @ Bm.T + b) * flip - center) * scale; faces.append(w); colors += cc
                if collide: boxes.append([w.min((0, 1)), w.max((0, 1))]); solid.append(boxes[-1])
        if not faces: return None
        if bulk: solid.append([np.concatenate(faces).min((0, 1)), np.concatenate(faces).max((0, 1))])   # a cast piece blocks sight as one box, legs and all
        f = np.concatenate(faces); flo = f.min((0, 1)); fhi = f.max((0, 1)); origin = np.array([(flo[0] + fhi[0]) / 2, flo[1], (flo[2] + fhi[2]) / 2]); f = f - origin
        ident = 'odyssey-' + sid.lower() + '-' + str(len(rows))
        rgb = np.array([[int(G.COL.get(c, '#a6b4b9')[i:i + 2], 16) for i in [1, 3, 5]] for c in colors], dtype=np.uint8)
        defs.append(dict(id=ident, name=label, h=float(fhi[1] - flo[1]), offsetY=0, bounds=[float(flo[0] - origin[0]), float(fhi[0] - origin[0]), float(flo[2] - origin[2]), float(fhi[2] - origin[2])],
                         vertices=base64.b64encode(f.astype('<f4').tobytes()).decode(), colors=base64.b64encode(rgb).decode(), ref=placed[0][0], sourceLine=None, layer=layer, reviewPage=len(pages),
                         glassTriangles=[i for i, c in enumerate(colors) if c in glassCodes], collectibles=[]))
        rows.append(dict(id=ident, part=ident, color=15, x=float(origin[0]), y=float(origin[1]), z=float(origin[2]), r=0))
        if boxes and collide: colliders[ident] = [[(lo_ - origin).tolist(), (hi_ - origin).tolist()] for lo_, hi_ in boxes if (hi_ - lo_)[1] > 4]
        pages.append(dict(id=ident, label=label, box=[round(float(v), 1) for v in list(flo) + list(fhi)], sourceStep=len(pages) + 1, placements=[len(pages)], bom=[dict(ref=placed[0][0], color=placed[0][1], quantity=1, subassembly=True)]))
        return ident
    piece('stage plate', [plate], 'shop', collide=False)
    for k, c, A, a in stage_kids: piece(re.sub(r'^od-b\d\d-s\d\d - ', '', k).replace('.ldr', '').replace('-', ' '), [(k, c, A, a)], 'shop', collide=True)
    # the cast: minifigures to actors, everything else a piece
    for k, c, A, a in cast_places:
        info = cast_files.get(k); refs = [p['ref'] for p in placements(sec[k])] if k in sec else []
        is_fig = any(r.startswith('3626') for r in refs) and any(r.startswith('973') for r in refs)
        if is_fig and len(actors) < 12:
            kind, prod = production(sec, k, info['name'] if info else k, sid, scale)
            p = B_(a); heading = math.atan2(A[0, 2], A[2, 2])   # the figure's turn about y, as placed
            solid.append([p + np.array([-12, 0, -12]) * scale, p + np.array([12, 76, 12]) * scale])   # an actor blocks a camera's sight as a minifigure-sized box
            actors.append(dict(kind=kind, x=float(p[0]), y=float(p[1]) + 8 * scale, z=float(p[2]), heading=float(heading))); kinds.append(prod)
        else: piece((info['name'].lower() if info else k), [(k, c, A, a)], 'shop', collide=True, bulk=True)
    # the shots: a camera mark a beat, framed on its subject from the front
    cams = []
    who = [B_(a) for k, c, A, a in cast_places]
    for s in pv['shots']:
        si = s['camera']['subject']; subj = who[si] if 0 <= si < len(who) else np.zeros(3)
        big = max(1.0, (tall[si] if 0 <= si < len(tall) else 72) / 80)   # a troll is framed as a troll, not at a minifigure's chest
        head = subj + np.array([0, 60 * scale * big, 0]); kind = s['camera']['kind']
        if kind in ('establish', 'pullback'): target = np.array([0, 40 * scale, 0]); dist, rise, want = ext * scale * 1.6, ext * scale * 0.8, -0.35
        elif kind == 'orbit': target = head; dist, rise, want = 290 * scale * big, 90 * scale * big, 0.8
        elif kind == 'push': target = head; dist, rise, want = 175 * scale * big, 10 * scale * big, -0.25
        else: target = head; dist, rise, want = 250 * scale * big, 30 * scale * big, -0.3
        pos = clear_mark(target, dist, rise, want, solid, subj)
        cams.append(dict(name=f"{s['n']} · {kind} · {s['beat'][:60]}", pos=pos.round(1).tolist(), target=target.round(1).tolist(), fov=38, seconds=round(s['t1'] - s['t0'], 1), purpose=s['beat']))
    src = text; entry = dict(id='odyssey-' + sid.lower(), caseId='odyssey', title=f"Odyssey · {pv['title'].title()}", file=sid + '.mpd', sourceText=src, hash=hashlib.sha256(src.encode()).hexdigest(),
        rows=rows, upgradeRows=rows, upgradeActors=actors, geometry=base64.b64encode(gzip.compress(json.dumps(defs, separators=(',', ':')).encode())).decode(), scale=scale, center=center.tolist(),
        bounds=[[float((lo[0] - center[0]) * scale), 0, float((lo[2] - center[2]) * scale)], [float((hi[0] - center[0]) * scale), float((hi[1] - center[1]) * scale), float((hi[2] - center[2]) * scale)]],
        upgradeExtent=[float((hi[0] - lo[0]) * scale), float((hi[2] - lo[2]) * scale)], cameras=cams, beats=[s['beat'] for s in pv['shots']], shotIdeas=[c['name'] for c in cams],
        brief=f"{pv['title'].title()} (Odyssey {sid}). The forage's draft: {len(stage_kids)} set sub-builds, {len(actors)} walking actors, {len(cams)} camera marks. Move pieces, walk the cast, frame the marks.",
        acting='Blocked by the forage on the set\'s marks; re-block by hand.', sound='', proof='Forage audit: stud joints and clipping in odyssey/forage.json.', notes='Drafted by tools/odyssey-forage.js; staged here by hand.',
        warnings=['Actors hold their items on the hand grip; arm poses are the Movieator\'s, not the forage\'s.', 'Pieces are precompiled triangles; edit the forage and rebuild to change a sub-build.'],
        upgradeChanges=['A forage scene card as a Film Butter location.'], colliders=colliders, pages=pages, doors=[], production=kinds)
    return entry, kinds

def blocked(a, b, boxes, skip):
    """Whether the sight line a to b passes through a collider box (slab test), leaving out boxes that stand on the subject's spot."""
    d = b - a
    for lo, hi in boxes:
        if all(lo[i] - 2 <= skip[i] <= hi[i] + 2 for i in (0, 2)): continue
        t0, t1, miss = 0.02, 0.98, False
        for i in range(3):
            if abs(d[i]) < 1e-9:
                if a[i] < lo[i] or a[i] > hi[i]: miss = True; break
                continue
            u, v = (lo[i] - a[i]) / d[i], (hi[i] - a[i]) / d[i]
            t0, t1 = max(t0, min(u, v)), min(t1, max(u, v))
            if t0 > t1: miss = True; break
        if not miss: return True
    return False
def clear_mark(target, dist, rise, want, boxes, subj):
    """A camera mark on a ring round the target, as near the wanted bearing as it can see the target and the frame round it clear (seven rays);
    the ring pulls in, then climbs, before it gives up and takes the wanted bearing high."""
    k_ = dist / 250
    eyes = [target + np.array(o) * k_ for o in ([0, 0, 0], [0, -25, 0], [0, 20, 0], [-30, -10, 0], [30, -10, 0], [0, -10, -30], [0, -10, 30])]   # head, chest, above, and the frame's sides
    rings = [(dist, rise), (dist * 0.75, rise), (dist, rise * 2.2), (dist * 0.6, rise * 3), (dist * 1.3, rise * 2.2)]
    for arc, d_, up in [(9, d, u) for d, u in rings] + [(18, d, u) for d, u in rings]:   # the front half at every range first, then all round
        for k in sorted(range(-arc, arc), key=abs):
            ang = want + k * math.pi / 18
            pos = target + np.array([math.sin(ang) * d_, up, math.cos(ang) * d_])
            if any(all(lo[i] - 30 * k_ <= pos[i] <= hi[i] + 30 * k_ for i in range(3)) for lo, hi in boxes): continue   # not in anyone's hair
            if not any(blocked(pos, e, boxes, subj) for e in eyes): return pos
    return target + np.array([math.sin(want) * dist, rise * 3, math.cos(want) * dist])

# the scenes the Odyssey player carries: the Cyclops's cave, then the sea
SCENES = ['OD-B17-S03', 'OD-B09-S03', 'OD-B05-S04', 'OD-B12-S06', 'OD-B21-S07', 'OD-B09-S09', 'OD-B09-S11', 'OD-B10-S01', 'OD-B10-S04', 'OD-B12-S03', 'OD-B12-S04', 'OD-B12-S07', 'OD-B05-S05', 'OD-B13-S01']
HAND = {'R': [-23.688, -5.24, -9.884, 0.985, -0.12, 0.12, 0.17, 0.697, -0.697, 0, 0.707, 0.707], 'L': [23.688, -5.24, -9.884, 0.985, -0.12, -0.12, 0.002, 0.717, -0.697, 0.17, 0.686, 0.707]}
def inv12(M):
    R_ = np.array(M[3:]).reshape(3, 3); t = np.array(M[:3]); return (-R_.T @ t).tolist() + R_.T.reshape(-1).tolist()
def mul12(A, B):
    RA = np.array(A[3:]).reshape(3, 3); RB = np.array(B[3:]).reshape(3, 3); return (RA @ np.array(B[:3]) + np.array(A[:3])).tolist() + (RA @ RB).reshape(-1).tolist()
def production(sec, key, name, sid, scale):
    """A Movieator production from a forage minifigure file: its head, headgear, torso, legs, beard and held items."""
    parts, skin = [], 14; lines = list(placements(sec[key]))
    for p in lines:
        r, c = p['ref'], p['color']; d = desc(r)
        if r.startswith('3626'): skin = c; parts.append(dict(role='HEAD', file=r, color=c, mountY=-84))   # the standard head: the Movieator's head pivot at mountY + 60 = 24 LDU over the torso
    for p in lines:
        r, c, t = p['ref'], p['color'], p['transform']; d = desc(r)
        if r.startswith('3626') or r.startswith('381') or r.startswith('3820'): continue
        if r.startswith('973'): parts.append(dict(role='TORSO', file=r, color=c))
        elif re.search('Headwear|Hair|Helmet|Crown|Hat|Headdress', d): parts.append(dict(role='HEADGEAR', file=r, color=c))
        elif re.search('Neckwear|Beard', d): parts.append(dict(role='NECK', file=r, color=c))
        elif re.search('Cape', d): parts.append(dict(role='NECK', file=r, color=c, offset=[0, -2, 0]))
        else:
            hands = [q for q in lines if q['ref'].startswith('3820')]
            hand = min(hands, key=lambda q: sum((np.array(q['transform'][:3]) - np.array(t[:3])) ** 2)) if hands else None
            side = 'R' if (hand['transform'][0] if hand else t[0]) < 0 else 'L'
            rel = mul12(inv12(hand['transform'] if hand else HAND[side]), t)   # the item in its hand's frame: the grip, whatever the arm does
            parts.append(dict(role='HELD_' + side, file=r, color=c, rel=[round(v, 4) for v in rel]))
    legs = next((p['color'] for p in lines if p['ref'].startswith('3816')), 7)
    parts.append(dict(role='LOWER', file='3815c01.dat', color=legs))
    kind = 'odyssey-' + sid.lower() + '-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return kind, dict(id=kind, name=name.title(), world='odyssey', production=dict(id=kind, world='odyssey', name=name.title(), skin=skin, parts=parts, scale=round(scale, 4)))   # a true-scale minifigure on this set

def pack_texts(files):
    """The part texts the Movieator needs, from the forage's packs: keyed both ways the loader looks."""
    out = {}
    for f in files:
        pid = f.lower().replace('.dat', ''); pk = REPO / 'odyssey/packs' / (pid.replace('/', '_') + '.json')
        if not pk.exists():
            from subprocess import run
            continue
        for k, v in json.loads(pk.read_text()).items():
            out[k] = v; out['parts/' + k if not k.startswith(('parts/', 'p/')) else k] = v
            if k.startswith('p/'): out[k[2:]] = v
    return out

if __name__ == '__main__':
    KEEP_BASE = '--with-readymades' in sys.argv
    ids = [a for a in sys.argv[1:] if not a.startswith('--')] or SCENES
    entries, kinds = [], {}
    for sid in ids:
        e, ks = scene(sid); entries.append(e)
        for k in ks: kinds[k['id']] = k
        print(sid, len(e['rows']), 'pieces,', len(e['upgradeActors']), 'actors,', len(e['cameras']), 'camera marks,', sum(map(len, e['colliders'].values())), 'colliders, scale', round(e['scale'], 3))
    s = gzip.decompress((R / 'base-player.html.gz').read_bytes()).decode()
    # the lower body on its own pivots, as build_butter.py does it
    s = s.replace("else if(p.role==='LOWER'||p.role==='OVERLAY')add('hipsP',p.file,color);", "else if(p.role==='LOWER'&&p.file==='3815c01.dat'){add('hipsP','3815.dat',color);add('legRP','3816.dat',color);add('legLP','3817.dat',color);}else if(p.role==='NECK')add('torsoP',p.file,color,p.offset||[0,0,0]);else if(p.role==='HELD_R'||p.role==='HELD_L'){const side=p.role.slice(5),slot=Minifig.SLOTS['arm'+side],hand=Minifig['HAND_'+side],r=p.rel,H=new THREE.Matrix4().set(hand[3],hand[4],hand[5],hand[0]-slot[1],hand[6],hand[7],hand[8],hand[1]-slot[2],hand[9],hand[10],hand[11],hand[2]-slot[3],0,0,0,1),M=new THREE.Matrix4().set(r[3],r[4],r[5],r[0],r[6],r[7],r[8],r[1],r[9],r[10],r[11],r[2],0,0,0,1);H.multiply(M);const e=H.elements;add(side==='R'?'armRP':'armLP',p.file,color,[e[12],e[13],e[14]],[e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]]);}else if(p.role==='LOWER'||p.role==='OVERLAY')add('hipsP',p.file,color);", 1)
    s = s.replace("rig.figure.scale.setScalar(1.65);rig.pos.set(0,0,-215);ButterSpatialRuntime.plate.add(rig.figure);return rig;}catch", "rig.figure.scale.setScalar(def.scale||1.65);rig.pos.set(0,0,-215);ButterSpatialRuntime.plate.add(rig.figure);return rig;}catch", 1)
    s = s.replace("cameras.map(x=>({...filmClone(x),seconds:5,purpose:'Inspect the camera embedded in the source MPD.'}))", "cameras.map(x=>({...filmClone(x),seconds:x.seconds||5,purpose:x.purpose||'Inspect the camera embedded in the source MPD.'}))", 1)
    s = s.replace("base='https://hartswf0.github.io/tractor-dce-gyo/ldraw/'", "base=new URL('../../ldraw/',location.href).href", 1)   # the repository's own library, served beside the page
    s = s.replace("b.type=held?CANNON.Body.KINEMATIC:CANNON.Body.DYNAMIC;", "if(held&&PH.pinned)PH.pinned.delete(p.id);b.type=held?CANNON.Body.KINEMATIC:PH.pinned&&PH.pinned.has(p.id)?CANNON.Body.STATIC:CANNON.Body.DYNAMIC;", 1)
    idx = json.loads((REPO / 'odyssey/packs/index.json').read_text())
    known = set(re.findall(r'"id":"([^"]+)"', s[s.find('window.ButterMovieatorIndex='):s.find('window.ButterMovieatorIndex=') + 3000000]))
    more = [dict(id=pid, name=(desc(pid + '.dat') or pid).lstrip('~'), category='Odyssey') for pid in idx if pid not in known]
    s = s.replace('window.ButterMovieatorIndex=[', 'window.ButterMovieatorIndex=[' + ','.join(json.dumps(m) for m in more) + (',' if more else ''), 1)
    payload = s.split('window.ButterFilmData=', 1)[1].split(';window.ButterAssemblyPlans=', 1)[0]
    films = json.loads(payload); films = entries + (films if KEEP_BASE else [])   # the Odyssey's locations only, unless --with-readymades
    start = s.index('window.ButterFilmData='); end = s.index(';window.ButterAssemblyPlans=', start)
    s = s[:start] + 'window.ButterFilmData=' + json.dumps(films, separators=(',', ':')).replace('</', '<\\/') + s[end:]
    # the Odyssey cast in the character catalogue, their parts in the loader's cache
    need = {p['file'] for k in kinds.values() for p in k['production']['parts']} | {'3815.dat', '3816.dat', '3817.dat', '3818.dat', '3819.dat', '3820.dat'}
    extra = '<script>(function(){const c=window.ButterAssetCatalog;if(c)c.characters.push(...' + json.dumps(list(kinds.values())) + ');Object.assign(window.ButterLDraw.parts,' + json.dumps(pack_texts(need)).replace('</', '<\\/') + ');})();</script>'
    s = s.replace('<script data-butter-module="movieator">', extra + '<script data-butter-module="movieator">', 1)
    # Film Butter's location layer (walk colliders, assembly pages) for any location that carries colliders; the forage shelf
    rt = (R / 'location-runtime.js').read_text().replace("return filmOf()?.sourceId==='grocer-location';", "return !!filmAsset()?.colliders;")
    anchor = 'window.ButterWorkspace={fork,switchTo,send,capture,restoreReceipt,session,importSession'
    s = s.replace(anchor, rt + '\n' + (R / 'odyssey-runtime.js').read_text() + '\n' + anchor, 1)
    s = s.replace('butter-films-base-v1', 'butter-odyssey-base-v1').replace('butter-films-scenes-v1', 'butter-odyssey-scenes-v1').replace('butter-films-workspace-v1', 'butter-odyssey-workspace-v1')
    s = s.replace('renderer.shadowMap.enabled=true', 'renderer.shadowMap.enabled=false')
    # a keyframe's held pose: the walk cycle leaves a held rig as the keyframe set it
    s = s.replace('rig.armLP.rotation.z=rig.armRP.rotation.z=0;', 'if(!rig.hold)rig.armLP.rotation.z=rig.armRP.rotation.z=0;', 1).replace('arm.rotation.set(state.armAngles[i],0,0);', 'if(!rig.hold)arm.rotation.set(state.armAngles[i],0,0);', 1)
    s = re.sub(r'rig\.headP\.rotation\.y=0;(\s*)marker\.visible=false;', lambda m: 'if(!rig.hold)rig.headP.rotation.y=0;' + m.group(1) + 'marker.visible=false;', s, count=1)
    s = s.replace('function pose(rig, st) {', 'function pose(rig, st) {\n  if (rig.hold) { for (const k of [\'armRP\', \'armLP\', \'headP\', \'torsoP\', \'legRP\', \'legLP\']) { const v = rig.hold[k] || [0, 0, 0]; rig[k].rotation.set(v[0], v[1], v[2]); } return; }', 1)
    css = '#locationReview{position:absolute;bottom:14px;left:14px;right:14px;z-index:42;background:#132320ed;border:1px solid #667b65;border-radius:9px;padding:8px 12px;color:#eaf0df;font:12px/1.4 system-ui;max-height:130px;overflow:auto}#locationReview[hidden],#locationView[hidden]{display:none!important}#locationReview>div{display:flex;align-items:center;gap:10px}#locationReview input{flex:1;min-width:20px;accent-color:#c4f46a}#locationReview p{margin:4px 0}#locationReview button{min-height:32px;min-width:32px}#locationView{max-width:145px}'
    s = s.replace('</body>', '<style>' + css + (R / 'odyssey-runtime.css').read_text() + '</style></body>')
    s = s.replace('<title>', '<title>Odyssey · ', 1)
    (OUT / 'Film-Butter-Odyssey.html.gz').write_bytes(gzip.compress(s.encode(), 9))   # the player, gzipped, behind a small loader page as Film-Butter-Readymades is
    stub = (OUT / 'Film-Butter-Readymades.html').read_text().replace('Film-Butter-Readymades.html.gz', 'Film-Butter-Odyssey.html.gz').replace('<title>Film Butter', '<title>Film Butter · Odyssey').replace('<h1>Film Butter', '<h1>Film Butter · Odyssey')
    (OUT / 'Film-Butter-Odyssey.html').write_text(stub)
    for e in entries: (OUT / (e['id'] + '.json')).write_text(json.dumps({k: v for k, v in e.items() if k not in ('geometry', 'sourceText')}, indent=1))
    print('Built production/Film-Butter-Odyssey.html,', round(len(s) / 1e6, 1), 'MB,', len(films), 'locations')
