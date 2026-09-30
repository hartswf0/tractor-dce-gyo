"""The staging scan: every voiced scene's take, drawing by drawing (12 a second), read for the defects of blocking and camera that
the rig desk's previz shows, from what tools/rig_probe.cjs recorded of the real take:

  odyssey/cascade/assets/rig/<scene>/cameras.json      the shot camera at every drawing
  odyssey/cascade/renders/rig/<scene>.probe.json       every figure's seven body points (face, crown, chest, hands, feet) and in-frame flag
  film-readymades/production/odyssey-<scene>.json      the location: its pieces' collider boxes (walls, floors, furniture)

Defects (runs of at least `MIN_RUN` drawings, reported with their span on the take's clock):
  cam-in-figure   the lens inside a figure's body (a cylinder of 0.2 H round its axis, feet to crown), or within 0.2 H of its face
  cam-in-set      the lens inside a set piece's collider box (not the floor it stands on)
  in-figure       two figures in frame whose axes are nearer than 0.22 H, their heights overlapping: one body through another
  on-head         a figure's feet on or over another's head (within 0.35 H across, the feet above the other's chest)
  float / sunk    an upright figure's lower foot more than 0.15 H over, or 0.1 H under, the highest surface under it
  empty-wide      a WIDE (or establishing) drawing with no figure in frame
  empty-shot      any other shot kind with no figure in frame (an OBJ insert of a prop may be fine: listed apart)

python3 odyssey/keyframes/staging_scan.py [OD-B09-S03 ...] [--md odyssey/keyframes/STAGING.md] [--json out.json]"""
from pathlib import Path
import json, math, sys

REPO = Path(__file__).resolve().parents[2]
CAS = REPO / 'odyssey/cascade'
MIN_RUN = 3


def load(sid):
    cf = CAS / 'assets/rig' / sid / 'cameras.json'; pf = CAS / 'renders/rig' / (sid + '.probe.json'); lf = REPO / 'film-readymades/production' / ('odyssey-' + sid.lower() + '.json')
    if not (cf.exists() and pf.exists()): return None
    cams = json.loads(cf.read_text())['cams']; poses = json.loads(pf.read_text())['poses']
    boxes = []
    if lf.exists():
        L = json.loads(lf.read_text()); label = {p['id']: p['label'] for p in L['pages']}; org = {r['id']: (r['x'], r['y'], r['z']) for r in L['rows']}
        for ident, bl in (L.get('colliders') or {}).items():
            o = org.get(ident, (0, 0, 0))
            for lo, hi in bl: boxes.append((label.get(ident, ident), [lo[i] + o[i] for i in range(3)], [hi[i] + o[i] for i in range(3)]))
    return cams, poses, boxes


def ground(boxes, x, z, below):
    """the highest collider top under (x, z) at or below `below`"""
    g = None
    for _, lo, hi in boxes:
        if lo[0] <= x <= hi[0] and lo[2] <= z <= hi[2] and hi[1] <= below: g = hi[1] if g is None else max(g, hi[1])
    return g


def scan(sid):
    d = load(sid)
    if not d: return None
    cams, poses, boxes = d
    n = min(len(cams), len(poses)); hits = {}
    def hit(kind, who, i, t): hits.setdefault((kind, who), []).append((i, t))
    for i in range(n):
        c, P = cams[i], poses[i]; t = P['t']; cp = c['pos']; acts = P['actors']
        vis = {k: a for k, a in acts.items() if not a.get('absent')}
        on = [k for k, a in vis.items() if a.get('on')]
        for k, a in vis.items():
            H = a['H']; p = a['p']; face, crown, feet = p[0], p[1], [p[5], p[6]]
            axis = [(feet[0][0] + feet[1][0]) / 2, (feet[0][2] + feet[1][2]) / 2]; chest = p[2]
            lo_y = min(f[1] for f in feet); hi_y = crown[1]
            upright = hi_y - lo_y > 0.6 * H
            ax = [(axis[0] + chest[0]) / 2, (axis[1] + chest[2]) / 2] if upright else [chest[0], chest[2]]
            r = math.hypot(cp[0] - ax[0], cp[2] - ax[1])
            if (upright and r < 0.2 * H and lo_y - 0.05 * H <= cp[1] <= hi_y + 0.05 * H) or math.dist(cp, face) < 0.2 * H: hit('cam-in-figure', k, i, t)
            if upright and boxes and a.get('on'):
                g = ground(boxes, axis[0], axis[1], lo_y + 0.12 * H)
                if g is not None and lo_y - g > 0.15 * H: hit('float', k, i, t)
                gs = ground(boxes, axis[0], axis[1], lo_y + 0.6 * H)
                if gs is not None and gs - lo_y > 0.1 * H and gs - lo_y < 0.6 * H: hit('sunk', k, i, t)
        ks = list(vis)
        for x in range(len(ks)):
            for y in range(x + 1, len(ks)):
                A, B = vis[ks[x]], vis[ks[y]]
                if not (A.get('on') or B.get('on')): continue
                H = min(A['H'], B['H'])
                ca, cb = A['p'][2], B['p'][2]
                dh = math.hypot(ca[0] - cb[0], ca[2] - cb[2])
                ya = (min(A['p'][5][1], A['p'][6][1]), A['p'][1][1]); yb = (min(B['p'][5][1], B['p'][6][1]), B['p'][1][1])
                ov = min(ya[1], yb[1]) - max(ya[0], yb[0])
                if dh < 0.22 * H and ov > 0.5 * H: hit('in-figure', ks[x] + ' / ' + ks[y], i, t)
                for top, bot, tn, bn in ((A, B, ks[x], ks[y]), (B, A, ks[y], ks[x])):
                    fy = min(top['p'][5][1], top['p'][6][1]); fx = [(top['p'][5][0] + top['p'][6][0]) / 2, (top['p'][5][2] + top['p'][6][2]) / 2]
                    if math.hypot(fx[0] - bot['p'][0][0], fx[1] - bot['p'][0][2]) < 0.35 * H and fy > bot['p'][2][1] and fy < bot['p'][1][1] + 0.25 * H: hit('on-head', tn + ' on ' + bn, i, t)
        for lab, lo, hi in boxes:
            if lab in ('floor', 'stage plate'): continue
            if all(lo[j] + 1 < cp[j] < hi[j] - 1 for j in range(3)): hit('cam-in-set', lab, i, t); break
        if not on:
            hit('empty-wide' if c.get('kind') in ('WIDE', 'EST') or P.get('kind') in ('WIDE', 'EST') else 'empty-shot', P.get('kind') or c.get('kind'), i, t)
    out = []
    for (kind, who), fr in hits.items():
        run = [fr[0]]
        for f in fr[1:] + [(None, None)]:
            if f[0] is not None and f[0] == run[-1][0] + 1: run.append(f); continue
            if len(run) >= MIN_RUN: out.append(dict(kind=kind, who=who, t0=round(run[0][1], 2), t1=round(run[-1][1], 2), n=len(run), shot=poses[run[0][0]].get('shot')))
            if f[0] is not None: run = [f]
    return sorted(out, key=lambda r: (r['t0'], r['kind']))


def main():
    args = sys.argv[1:]
    md = args[args.index('--md') + 1] if '--md' in args else None
    js = args[args.index('--json') + 1] if '--json' in args else None
    ids = [a for a in args if a.startswith('OD-')] or sorted(p.name for p in (CAS / 'assets/rig').iterdir() if p.is_dir())
    res = {}
    for sid in ids:
        r = scan(sid)
        if r is None: print(sid, 'no probe'); continue
        res[sid] = r
        by = {}
        for x in r: by[x['kind']] = by.get(x['kind'], 0) + 1
        print(sid, len(r), 'runs', by)
    if js: Path(js).write_text(json.dumps(res, indent=1))
    if md: write_md(Path(md), res)
    return res


OWN = {'cam-in-figure': 'take camera (cutter)', 'cam-in-set': 'take camera (cutter)', 'empty-shot': 'take camera (cutter)', 'empty-wide': 'blocking',
       'in-figure': 'blocking', 'on-head': 'blocking', 'float': 'blocking', 'sunk': 'blocking'}
A, B = '<!-- scan:begin -->', '<!-- scan:end -->'


def write_md(path, res):
    """the scan's table between the markers of STAGING.md (the hand-written sections round it are kept)"""
    rows = ['| scene | defect | who | take clock (s) | drawings | shot | whose |', '|---|---|---|---|---|---|---|']
    for sid, r in res.items():
        if not r: rows.append(f'| {sid} | none found | | | | | |'); continue
        for x in r: rows.append(f"| {sid} | {x['kind']} | {x['who']} | {x['t0']}-{x['t1']} | {x['n']} | {x['shot']} | {OWN[x['kind']]} |")
    block = A + '\n' + '\n'.join(rows) + '\n' + B
    text = path.read_text() if path.exists() else '# Staging\n\n' + A + '\n' + B + '\n'
    if A not in text: text += '\n' + A + '\n' + B + '\n'
    path.write_text(text[:text.index(A)] + block + text[text.index(B) + len(B):])


if __name__ == '__main__':
    main()
