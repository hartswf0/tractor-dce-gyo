#!/usr/bin/env python3
"""tools/forage/product/kits/shield_frame.py — Shared Frame, Geometry, Palette & Section Base Builder for The Shield of Achilles.

  python3 tools/forage/product/kits/shield_frame.py
    -> odyssey/cards/set.shield-frame.mpd
    -> odyssey/cards/set.shield-blockout.mpd

Owns:
- Origin (0, 0, 0) at the centre of the four 48 x 48 baseplates (4186), covering cells i, k in -48..47 (-960..960 LDU).
- Homer's metallic + enamel palette (Pearl Gold 297, Pearl Silver 179, Metallic Silver 80, Metallic Copper 300,
  Dark Blue 272, Black 0, Dark Brown 308, plus Trans-Clear 47 on water and quiet cloth colours on figures).
- Concentric domed terrace heights (Boss m0 highest at FLOOR=84, stepping down by two plates per ring to Ocean m9 at FLOOR=20).
- Disjoint 2x2-aligned section cells CELLS['m0']..CELLS['m9'] and BLOCKS['m0']..BLOCKS['m9'].
- Two-layer cross-bonded plate base builder `section_base(sec)` with curved corner plates (30565, 30357) and
  tiled floor builder `section_floor(sec)` with curved corner tiles (27507, 79393, 27925, 25269).
- 1-stud-wide dividers in Dark Blue (272) and Pearl Gold (297), one plate and a tile high.
"""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
import ldbox, wardrobe as _wardrobe

# ── Homer's Palette (docs/sets/shield-of-achilles.md) ──
GOLD   = 297   # Pearl Gold — gods, sun/moon/stars, wine cup, vines, gold cattle, daggers
SILVER = 179   # Pearl Silver — vine poles, shield rim, river glint, belts, baldric
TIN    = 80    # Metallic Silver — tin fence, tin cattle, stars, armour highlights
BRONZE = 300   # Metallic Copper — walls, roofs, spears, helmets, ploughshares, cauldron
KYANOS = 272   # Dark Blue — vineyard ditch, Ocean, night sky on boss, section dividers
BLK    = 0     # Black — ploughed earth behind ploughs, grapes, undersides, plinth
DB     = 308   # Dark Brown — timber, plough beams, oak trunk, huts, ground shadow
TCLEAR = 47    # Trans-Clear — broken water on Ocean and river ford
WHITE  = 15    # White — sheep, barley meal, bridal/dancer tunics

# Quiet cloth colours for minifigure dressing only
CLOTH_WHITE  = 15
CLOTH_TAN    = 19
CLOTH_DTAN   = 28
CLOTH_DRED   = 320
CLOTH_RB     = 70
CLOTH_YELLOW = 14

# ── Baseplate & Domed Terrace Heights (yup in LDU) ──
BASE = 4  # Top of the four 48 x 48 baseplates (4186)

BAND_OF = {
    'm0': 'boss',
    'm1': 'inner',  'm2': 'inner',
    'm3': 'middle', 'm4': 'middle', 'm5': 'middle',
    'm6': 'outer',  'm7': 'outer',  'm8': 'outer',
    'm9': 'rim',
}

# Seat height where each section's 2-layer cross-bonded plate base clicks onto the frame.
# Each ring steps down by 2 plates (16 LDU) from Boss (SEAT=68, FLOOR=84) to Rim (SEAT=4, FLOOR=20).
SEAT = {
    'm0': BASE + 8 * P,   # 68
    'm1': BASE + 6 * P,   # 52
    'm2': BASE + 6 * P,   # 52
    'm3': BASE + 4 * P,   # 36
    'm4': BASE + 4 * P,   # 36
    'm5': BASE + 4 * P,   # 36
    'm6': BASE + 2 * P,   # 20
    'm7': BASE + 2 * P,   # 20
    'm8': BASE + 2 * P,   # 20
    'm9': BASE,           # 4
}

# Top of each section's 2-layer cross-bonded plate base (studs where floor tiles, walls, trees & figures stand)
FLOOR = {sec: SEAT[sec] + 2 * P for sec in SEAT}

# ── Curved Corner Part Placement Helpers (Rule 6) ──
CURVE_ROT = {
    ( 1, -1): 0.0,
    (-1, -1): math.pi * 0.5,
    (-1,  1): math.pi,
    ( 1,  1): math.pi * 1.5,
}
CURVE_ROT_30357 = {
    ( 1,  1): 0.0,
    ( 1, -1): math.pi * 0.5,
    (-1, -1): math.pi,
    (-1,  1): math.pi * 1.5,
}

PLATES_2X = [
    (8, '4282'), (7, '91988'), (5, '3832'), (4, '3034'), (3, '3795'), (2, '3020'), (1, '3022')
]
TILES_RECT = [
    (4, 2, '87079', 0.0), (2, 4, '87079', math.pi * 0.5),
    (2, 2, '3068b', 0.0),
    (8, 1, '4162',  0.0), (1, 8, '4162',  math.pi * 0.5),
    (6, 1, '6636',  0.0), (1, 6, '6636',  math.pi * 0.5),
    (4, 1, '2431',  0.0), (1, 4, '2431',  math.pi * 0.5),
    (3, 1, '63864', 0.0), (1, 3, '63864', math.pi * 0.5),
    (2, 1, '3069b', 0.0), (1, 2, '3069b', math.pi * 0.5),
    (1, 1, '3070b', 0.0),
]


def place_box(col, i0, k0, yup, pid, rot=0.0):
    """Place any grid-aligned LDraw part so its rotated world box starts at cell (i0, k0) with its bottom at yup."""
    lo, hi = ldbox.box(pid, False)
    m = RY(rot)
    cs = [(m[3] * px + m[5] * pz, m[9] * px + m[11] * pz) for px in (lo[0], hi[0]) for pz in (lo[2], hi[2])]
    rx0, rz0 = min(c[0] for c in cs), min(c[1] for c in cs)
    return put(col, i0 * S - rx0, yup + hi[1], k0 * S - rz0, pid, m)


def put_curve(col, i0, k0, yup, pid, sx, sz):
    """Place a curved corner plate (30357, 30565) or curved corner tile (25269, 27925, 79393, 27507)
    covering its w x w block starting at (i0, k0) with its convex arc facing outward toward quadrant (sx, sz)."""
    rot = CURVE_ROT_30357[(sx, sz)] if pid == '30357' else CURVE_ROT[(sx, sz)]
    return place_box(col, i0, k0, yup, pid, rot)


def put_curve_3x3_in_4x4(col, i0, k0, yup, sx, sz):
    """Fill a 4x4 stud block (i0..i0+3, k0..k0+3) with a 3x3 curved corner plate 30357 at the outer corner (sx, sz)
    plus two 1x3 plates (3623) and one 1x1 plate (3024) along the inner edges."""
    ic = i0 + 1 if sx > 0 else i0
    kc = k0 + 1 if sz > 0 else k0
    ii = i0 if sx > 0 else i0 + 3
    ki = k0 if sz > 0 else k0 + 3
    return [
        put_curve(col, ic, kc, yup, '30357', sx, sz),
        place_box(col, ic, ki, yup, '3623', 0.0),
        place_box(col, ii, kc, yup, '3623', math.pi * 0.5),
        place_box(col, ii, ki, yup, '3024', 0.0),
    ]


def _is_connected(S):
    if not S:
        return True
    st = next(iter(S))
    vis, q = {st}, [st]
    while q:
        x, z = q.pop()
        for nx, nz in ((x + 1, z), (x - 1, z), (x, z + 1), (x, z - 1)):
            if (nx, nz) in S and (nx, nz) not in vis:
                vis.add((nx, nz))
                q.append((nx, nz))
    return len(vis) == len(S)


def _compute_sections():
    """Partition the 96x96 stud grid into 10 disjoint, 4-connected, 2x2-block-aligned section cell sets."""
    blocks = {f'm{n}': set() for n in range(10)}
    for bi in range(-24, 24):
        for bk in range(-24, 24):
            rx, rz = 2 * bi + 1.0, 2 * bk + 1.0
            r = math.hypot(rx, rz)
            ang = math.degrees(math.atan2(rz, rx))
            if r < 9.2:
                blocks['m0'].add((bi, bk))
            elif 10.6 <= r < 21.2:
                if bi < -1:
                    blocks['m1'].add((bi, bk))
                elif bi >= 1:
                    blocks['m2'].add((bi, bk))
            elif 22.6 <= r < 33.0:
                ok = True
                for sa in (-90.0, 30.0, 150.0):
                    rad = math.radians(sa)
                    proj = rx * math.cos(rad) + rz * math.sin(rad)
                    perp = abs(-rx * math.sin(rad) + rz * math.cos(rad))
                    if proj > 0 and perp < 1.35:
                        ok = False
                if ok:
                    if -90.0 <= ang < 30.0:
                        blocks['m4'].add((bi, bk))
                    elif 30.0 <= ang < 150.0:
                        blocks['m5'].add((bi, bk))
                    else:
                        blocks['m3'].add((bi, bk))
            elif 34.4 <= r < 43.0:
                ok = True
                for sa in (90.0, -30.0, -150.0):
                    rad = math.radians(sa)
                    proj = rx * math.cos(rad) + rz * math.sin(rad)
                    perp = abs(-rx * math.sin(rad) + rz * math.cos(rad))
                    if proj > 0 and perp < 1.35:
                        ok = False
                if ok:
                    if -150.0 <= ang < -30.0:
                        blocks['m7'].add((bi, bk))
                    elif -30.0 <= ang < 90.0:
                        blocks['m8'].add((bi, bk))
                    else:
                        blocks['m6'].add((bi, bk))
            elif 44.2 <= r < 47.6:
                blocks['m9'].add((bi, bk))

    for ksec, Bset in blocks.items():
        changed = True
        while changed:
            changed = False
            drop = set()
            for (bi, bk) in Bset:
                nh = ((bi - 1, bk) in Bset) or ((bi + 1, bk) in Bset)
                nv = ((bi, bk - 1) in Bset) or ((bi, bk + 1) in Bset)
                if ksec != 'm9' and not (nh and nv):
                    drop.add((bi, bk))
                elif ksec == 'm9' and not (nh or nv):
                    drop.add((bi, bk))
            if drop:
                Bset -= drop
                changed = True

    cells = {
        ksec: {(2 * bi + dx, 2 * bk + dz) for (bi, bk) in Bset for dx in (0, 1) for dz in (0, 1)}
        for ksec, Bset in blocks.items()
    }
    return cells, blocks


CELLS, BLOCKS = _compute_sections()
ALL_SECTION_CELLS = set().union(*CELLS.values())


def find_curve_2x2(Bset):
    """Find disjoint 2x2-block (4x4-stud) outer arc corners of Bset whose removal preserves vertical neighbors and connectivity."""
    found = []
    used = set()
    for (bi, bk) in sorted(Bset, key=lambda c: -math.hypot(2 * c[0] + 1, 2 * c[1] + 1)):
        sx = 1 if (2 * bi + 1) >= 0 else -1
        sz = 1 if (2 * bk + 1) >= 0 else -1
        bi0 = bi - 1 if sx > 0 else bi
        bk0 = bk - 1 if sz > 0 else bk
        b2 = {(bi0 + a, bk0 + b) for a in (0, 1) for b in (0, 1)}
        if not (b2 <= Bset) or (b2 & used):
            continue
        if (bi + sx, bk) in Bset or (bi, bk + sz) in Bset:
            continue
        rem_test = Bset - (used | b2)
        if any(((x, z - 1) not in rem_test and (x, z + 1) not in rem_test) for (x, z) in rem_test if x in (bi0, bi0 + 1)):
            continue
        if not _is_connected(rem_test):
            continue
        found.append((bi0, bk0, sx, sz, b2))
        used |= b2
    return found


def section_base(sec, col0=BLK, col1=DB):
    """Build the two-layer cross-bonded plate base for section `sec` at height SEAT[sec].
    Layer 0 (SEAT[sec]) runs horizontally along X; Layer 1 (SEAT[sec] + P) runs vertically along Z
    with curved corner plates 30565 (4x4) and 30357 (3x3) along the outer circular arc."""
    Bset = BLOCKS[sec]
    yup = SEAT[sec]
    rem0, rem1 = set(Bset), set(Bset)
    rows0, rows1 = [], []

    c4 = find_curve_2x2(Bset)
    for idx_c, (bi0, bk0, sx, sz, b2) in enumerate(c4[:6]):
        if idx_c % 2 == 0:
            rows1.append(put_curve(col1, 2 * bi0, 2 * bk0, yup + P, '30565', sx, sz))
        else:
            rows1 += put_curve_3x3_in_4x4(col1, 2 * bi0, 2 * bk0, yup + P, sx, sz)
        rem1 -= b2

    bks = sorted({bk for _, bk in rem0})
    seams0 = []
    for bk in bks:
        row_bis = sorted(bi for (bi, k) in rem0 if k == bk)
        idx = 0
        while idx < len(row_bis):
            run = [row_bis[idx]]
            idx += 1
            while idx < len(row_bis) and row_bis[idx] == run[-1] + 1:
                run.append(row_bis[idx])
                idx += 1
            pos, L = 0, len(run)
            while pos < L:
                rem_len = L - pos
                for bw, pid in PLATES_2X:
                    if (bk % 2 == 1) and pos == 0 and rem_len > 5 and bw > 3:
                        continue
                    if bw <= rem_len:
                        rows0.append(place_box(col0, 2 * run[pos], 2 * bk, yup, pid, 0.0))
                        pos += bw
                        if pos < L:
                            seams0.append((run[pos - 1], bk))
                        break

    for (bi, bk) in seams0:
        if (bi, bk) in rem1 and (bi + 1, bk) in rem1:
            has_adj = ((bi, bk - 1) in rem1 and (bi + 1, bk - 1) in rem1) or ((bi, bk + 1) in rem1 and (bi + 1, bk + 1) in rem1)
            if not has_adj:
                rows1.append(place_box(col1, 2 * bi, 2 * bk, yup + P, '3020', 0.0))
                rem1.remove((bi, bk))
                rem1.remove((bi + 1, bk))

    bis = sorted({bi for bi, _ in rem1})
    for bi in bis:
        col_bks = sorted(bk for (i, bk) in rem1 if i == bi)
        idx = 0
        while idx < len(col_bks):
            run = [col_bks[idx]]
            idx += 1
            while idx < len(col_bks) and col_bks[idx] == run[-1] + 1:
                run.append(col_bks[idx])
                idx += 1
            pos, L = 0, len(run)
            while pos < L:
                rem_len = L - pos
                for bd, pid in PLATES_2X:
                    if (bi % 2 == 1) and pos == 0 and rem_len > 5 and bd > 3:
                        continue
                    if bd <= rem_len:
                        rows1.append(place_box(col1, 2 * bi, 2 * run[pos], yup + P, pid, math.pi * 0.5))
                        pos += bd
                        break
    return rows0 + rows1


def put_curve_fan(col_fn, i0, k0, w, yup, sx, sz, curve_col=None):
    """Fill a w x w corner block (i0..i0+w-1, k0..k0+w-1) with nested concentric curved tiles
    (27507 4x4, 79393 3x3, 27925 2x2, 25269 1x1) sharing the inner corner (-sx, -sz)."""
    rot = CURVE_ROT[(sx, sz)]
    fan_pids = [(4, '27507'), (3, '79393'), (2, '27925'), (1, '25269')]
    out = []
    for fw, pid in fan_pids:
        if fw > w:
            continue
        iw = i0 if sx > 0 else i0 + (w - fw)
        kw = k0 if sz > 0 else k0 + (w - fw)
        c = curve_col if curve_col is not None else col_fn(iw, kw)
        out.append(place_box(c, iw, kw, yup, pid, rot))
    return out


def section_floor(sec, col_fn, keep_studs=(), curve_col=None):
    """Tile the floor of section `sec` at height FLOOR[sec], leaving any cell in `keep_studs` exposed as a stud,
    and placing nested concentric curved corner tiles (27507, 79393, 27925, 25269) on outer arc corners."""
    yup = FLOOR[sec]
    rem = set(CELLS[sec]) - set(keep_studs)
    rows = []

    # 1. Place nested curved tile fans (4x4, 3x3, 2x2, 1x1) at outer convex corners of the section
    for w, max_cnt in ((4, 2), (3, 2), (2, 4), (1, 999)):
        cnt = 0
        for (i, k) in sorted(rem, key=lambda c: -math.hypot(c[0] + 0.5, c[1] + 0.5)):
            if (i, k) not in rem or cnt >= max_cnt:
                continue
            sx = 1 if (i + 0.5) >= 0 else -1
            sz = 1 if (k + 0.5) >= 0 else -1
            if (i + sx, k) in CELLS[sec] or (i, k + sz) in CELLS[sec]:
                continue
            i0 = i - (w - 1) if sx > 0 else i
            k0 = k - (w - 1) if sz > 0 else k
            blk = {(i0 + a, k0 + b) for a in range(w) for b in range(w)}
            if not (blk <= rem):
                continue
            rows += put_curve_fan(col_fn, i0, k0, w, yup, sx, sz, curve_col=curve_col)
            rem -= blk
            cnt += 1

    # 2. Pack remaining floor cells with rectangular tiles matching col_fn(i, k)
    for (i, k) in sorted(rem, key=lambda c: (c[1], c[0])):
        if (i, k) not in rem:
            continue
        target_col = col_fn(i, k)
        for w, d, pid, rot in TILES_RECT:
            blk = {(i + a, k + b) for a in range(w) for b in range(d)}
            if blk <= rem and all(col_fn(ci, ck) == target_col for (ci, ck) in blk):
                rows.append(place_box(target_col, i, k, yup, pid, rot))
                rem -= blk
                break
    return rows


PLATES_TERRACE_H = [
    (6, 2, '3795', 0.0), (4, 2, '3020', 0.0), (3, 2, '3021', 0.0), (2, 2, '3022', 0.0),
    (6, 1, '3666', 0.0), (4, 1, '3710', 0.0), (3, 1, '3623', 0.0), (2, 1, '3023', 0.0), (1, 1, '3024', 0.0),
]
PLATES_TERRACE_V = [
    (2, 6, '3795', math.pi * 0.5), (2, 4, '3020', math.pi * 0.5), (2, 3, '3021', math.pi * 0.5), (2, 2, '3022', 0.0),
    (1, 6, '3666', math.pi * 0.5), (1, 4, '3710', math.pi * 0.5), (1, 3, '3623', math.pi * 0.5), (1, 2, '3023', math.pi * 0.5), (1, 1, '3024', 0.0),
]


def terrace_form(sec, height_fn, col_fn, keep_top_studs=()):
    """Sculpt stepped plate terraces across CELLS[sec] above FLOOR[sec] according to height_fn(i, k) (in plates >= 0),
    cross-bonding alternating layers and tiling every exposed top face except cells in `keep_top_studs`."""
    fl = FLOOR[sec]
    keep = set(keep_top_studs)
    h_map = {c: max(0, int(height_fn(c[0], c[1]))) for c in CELLS[sec]}
    max_h = max(h_map.values()) if h_map else 0
    rows = []

    # 1. Pack plate layers 1 .. max_h with alternating horizontal/vertical orientation
    for lv in range(1, max_h + 1):
        yup = fl + (lv - 1) * P
        rem = {c for c, h in h_map.items() if h >= lv}
        plist = PLATES_TERRACE_H if (lv % 2 == 1) else PLATES_TERRACE_V
        key_fn = (lambda c: (c[1], c[0])) if (lv % 2 == 1) else (lambda c: (c[0], c[1]))
        for (i, k) in sorted(rem, key=key_fn):
            if (i, k) not in rem:
                continue
            c_col = col_fn(i, k, lv)
            for w, d, pid, rot in plist:
                blk = {(i + a, k + b) for a in range(w) for b in range(d)}
                if blk <= rem and all(col_fn(ci, ck, lv) == c_col for ci, ck in blk):
                    rows.append(place_box(c_col, i, k, yup, pid, rot))
                    rem -= blk
                    break

    # 2. Tile every exposed top surface at level h = 0 .. max_h
    for h_lv in range(0, max_h + 1):
        yup_t = fl + h_lv * P
        level_all = {c for c, h in h_map.items() if h >= h_lv}
        rem_t = {c for c, h in h_map.items() if h == h_lv and c not in keep}
        if not rem_t:
            continue
        # Place curved corner tile fans at outer convex corners of level_all
        fan_specs = ((4, 2), (3, 2), (2, 4), (1, 999)) if h_lv == 0 else ((2, 4), (1, 999))
        for w, max_cnt in fan_specs:
            cnt = 0
            for (i, k) in sorted(rem_t, key=lambda c: -math.hypot(c[0] + 0.5, c[1] + 0.5)):
                if (i, k) not in rem_t or cnt >= max_cnt:
                    continue
                sx = 1 if (i + 0.5) >= 0 else -1
                sz = 1 if (k + 0.5) >= 0 else -1
                if (i + sx, k) in level_all or (i, k + sz) in level_all:
                    continue
                i0 = i - (w - 1) if sx > 0 else i
                k0 = k - (w - 1) if sz > 0 else k
                blk = {(i0 + a, k0 + b) for a in range(w) for b in range(w)}
                if not (blk <= rem_t):
                    continue
                rows += put_curve_fan(lambda ci, ck: col_fn(ci, ck, h_lv), i0, k0, w, yup_t, sx, sz)
                rem_t -= blk
                cnt += 1

        for (i, k) in sorted(rem_t, key=lambda c: (c[1], c[0])):
            if (i, k) not in rem_t:
                continue
            target_col = col_fn(i, k, h_lv)
            for w, d, pid, rot in TILES_RECT:
                blk = {(i + a, k + b) for a in range(w) for b in range(d)}
                if blk <= rem_t and all(col_fn(ci, ck, h_lv) == target_col for ci, ck in blk):
                    rows.append(place_box(target_col, i, k, yup_t, pid, rot))
                    rem_t -= blk
                    break

    return rows, {c: fl + h * P for c, h in h_map.items()}


def seat_piers_for(sec):
    """Build the structural seat piers on the baseplates (yup = BASE .. SEAT[sec]) for section `sec`."""
    target_y = SEAT[sec]
    if target_y <= BASE:
        return []
    Bset = sorted(BLOCKS[sec])
    # Pick well-spaced 2x2 blocks (every 3rd block in bi and bk, plus first and last) to support the section
    chosen = []
    used = set()
    for idx, (bi, bk) in enumerate(Bset):
        if (bi, bk) in used:
            continue
        if (bi % 2 == 0 and bk % 2 == 0) or idx in (0, len(Bset) - 1):
            # Prefer a 2x4 pier if (bi+1, bk) is also in Bset
            if (bi + 1, bk) in BLOCKS[sec] and (bi + 1, bk) not in used:
                chosen.append((2 * bi, 2 * bk, '3001', '3020'))
                used.add((bi, bk))
                used.add((bi + 1, bk))
            else:
                chosen.append((2 * bi, 2 * bk, '3003', '3022'))
                used.add((bi, bk))

    rows = []
    for i0, k0, brk_pid, plt_pid in chosen:
        y = BASE
        while y + B <= target_y:
            rows.append(place_box(BLK, i0, k0, y, brk_pid, 0.0))
            y += B
        while y + P <= target_y:
            rows.append(place_box(BLK, i0, k0, y, plt_pid, 0.0))
            y += P
    return rows


def _divider_seat_height(i, k):
    """Return the seat height (yup) for a divider cell (i, k) so its 1-plate + 1-tile cap bridges the adjacent terrace floors."""
    rx, rz = i + 0.5, k + 0.5
    r = math.hypot(rx, rz)
    if r < 11.0:
        return SEAT['m1'] + P      # 60: 1 plate + 1 tile brings top to 76 (between FLOOR m1=68 and FLOOR m0=84)
    elif r < 23.0:
        return SEAT['m3'] + P      # 44: 1 plate + 1 tile brings top to 60 (between FLOOR m3=52 and FLOOR m1=68)
    elif r < 34.8:
        return SEAT['m6'] + P      # 28: 1 plate + 1 tile brings top to 44 (between FLOOR m6=36 and FLOOR m3=52)
    else:
        return SEAT['m9'] + P      # 12: 1 plate + 1 tile brings top to 28 (between FLOOR m9=20 and FLOOR m6=36)


def frame_dividers_and_rim():
    """Build the 1-stud-wide kyanos-and-gold dividers (1 plate + 1 tile high at each terrace step)
    between all sections, plus the bronze-and-gold outer shield rim and black corner spandrels."""
    rows = []
    div_by_y = {}
    rim_cells = set()
    spandrel_cells = set()

    for i in range(-48, 48):
        for k in range(-48, 48):
            if (i, k) in ALL_SECTION_CELLS:
                continue
            rx, rz = i + 0.5, k + 0.5
            r = math.hypot(rx, rz)
            if r < 44.5:
                yh = _divider_seat_height(i, k)
                div_by_y.setdefault(yh, set()).add((i, k))
            elif r <= 48.2:
                rim_cells.add((i, k))
            else:
                spandrel_cells.add((i, k))

    plate_1d = [
        (8, 1, '3460', 0.0), (1, 8, '3460', math.pi * 0.5),
        (6, 1, '3666', 0.0), (1, 6, '3666', math.pi * 0.5),
        (4, 1, '3710', 0.0), (1, 4, '3710', math.pi * 0.5),
        (3, 1, '3623', 0.0), (1, 3, '3623', math.pi * 0.5),
        (2, 1, '3023', 0.0), (1, 2, '3023', math.pi * 0.5),
        (2, 2, '3022', 0.0), (1, 1, '3024', 0.0),
    ]
    brick_1d = [
        (4, 2, '3001', 0.0), (2, 4, '3001', math.pi * 0.5),
        (2, 2, '3003', 0.0),
        (6, 1, '3009', 0.0), (1, 6, '3009', math.pi * 0.5),
        (4, 1, '3010', 0.0), (1, 4, '3010', math.pi * 0.5),
        (3, 1, '3622', 0.0), (1, 3, '3622', math.pi * 0.5),
        (2, 1, '3004', 0.0), (1, 2, '3004', math.pi * 0.5),
        (1, 1, '3005', 0.0),
    ]

    # 1. Build stepped support + 1 Dark Blue plate + 1 Dark Blue/Gold tile for each divider group
    for yh, dcells in sorted(div_by_y.items()):
        # Support from BASE up to yh in BLK
        y = BASE
        while y + B <= yh:
            rem_b = set(dcells)
            for (i, k) in sorted(rem_b, key=lambda c: (c[1], c[0])):
                if (i, k) not in rem_b:
                    continue
                for w, d, pid, rot in brick_1d:
                    blk = {(i + a, k + b) for a in range(w) for b in range(d)}
                    if blk <= rem_b:
                        rows.append(place_box(BLK, i, k, y, pid, rot))
                        rem_b -= blk
                        break
            y += B
        while y + P <= yh:
            rem_s = set(dcells)
            for (i, k) in sorted(rem_s, key=lambda c: (c[1], c[0])):
                if (i, k) not in rem_s:
                    continue
                for w, d, pid, rot in plate_1d:
                    blk = {(i + a, k + b) for a in range(w) for b in range(d)}
                    if blk <= rem_s:
                        rows.append(place_box(BLK, i, k, y, pid, rot))
                        rem_s -= blk
                        break
            y += P

        # Top divider plate at yh in KYANOS (272)
        rem_p = set(dcells)
        for (i, k) in sorted(rem_p, key=lambda c: (c[1], c[0])):
            if (i, k) not in rem_p:
                continue
            for w, d, pid, rot in plate_1d:
                blk = {(i + a, k + b) for a in range(w) for b in range(d)}
                if blk <= rem_p:
                    rows.append(place_box(KYANOS, i, k, yh, pid, rot))
                    rem_p -= blk
                    break

        # Top divider tile at yh + P in KYANOS (272) with Pearl Gold (297) round 1x1 tiles (98138)
        rem_t = set(dcells)
        for (i, k) in sorted(rem_t):
            if (i + k) % 4 == 0 and (i % 2 == 0):
                rows.append(place_box(GOLD, i, k, yh + P, '98138', 0.0))
                rem_t.remove((i, k))
        for (i, k) in sorted(rem_t, key=lambda c: (c[1], c[0])):
            if (i, k) not in rem_t:
                continue
            for w, d, pid, rot in TILES_RECT:
                blk = {(i + a, k + b) for a in range(w) for b in range(d)}
                if blk <= rem_t:
                    rows.append(place_box(KYANOS, i, k, yh + P, pid, rot))
                    rem_t -= blk
                    break

    # 2. Outer threefold rim (r in 47.6..48.2): raised 2 plates + 1 tile in Bronze (300), Silver (179) & Pearl Gold (297)
    for y_rim, col_r in ((BASE, DB), (BASE + P, BRONZE)):
        rem_r = set(rim_cells)
        for (i, k) in sorted(rem_r, key=lambda c: (c[1], c[0])):
            if (i, k) not in rem_r:
                continue
            for w, d, pid, rot in plate_1d:
                blk = {(i + a, k + b) for a in range(w) for b in range(d)}
                if blk <= rem_r:
                    rows.append(place_box(col_r, i, k, y_rim, pid, rot))
                    rem_r -= blk
                    break
    rem_rt = set(rim_cells)
    for (i, k) in sorted(rem_rt, key=lambda c: (c[1], c[0])):
        if (i, k) not in rem_rt:
            continue
        col = GOLD if (i + k) % 3 == 0 else (SILVER if (i + k) % 3 == 1 else BRONZE)
        for w, d, pid, rot in TILES_RECT:
            blk = {(i + a, k + b) for a in range(w) for b in range(d)}
            if blk <= rem_rt and all(((ci + ck) % 3) == ((i + k) % 3) for ci, ck in blk):
                rows.append(place_box(col, i, k, BASE + 2 * P, pid, rot))
                rem_rt -= blk
                break

    # 3. Black tiled corner spandrels outside the shield circle (r > 48.2) so no raw baseplate studs show
    rem_sp = set(spandrel_cells)
    for (i, k) in sorted(rem_sp, key=lambda c: (c[1], c[0])):
        if (i, k) not in rem_sp:
            continue
        for w, d, pid, rot in TILES_RECT:
            blk = {(i + a, k + b) for a in range(w) for b in range(d)}
            if blk <= rem_sp:
                rows.append(place_box(BLK, i, k, BASE, pid, rot))
                rem_sp -= blk
                break

    return rows


def build_frame(sections=None):
    """Build the complete shield frame (four 48x48 baseplates, seat piers for `sections` or all 10 sections,
    and kyanos-and-gold dividers + bronze/gold rim)."""
    secs = sections if sections is not None else sorted(CELLS.keys())
    rows = [
        put(BLK, -480, BASE, -480, '4186'),
        put(BLK,  480, BASE, -480, '4186'),
        put(BLK, -480, BASE,  480, '4186'),
        put(BLK,  480, BASE,  480, '4186'),
    ]
    for s in secs:
        rows += seat_piers_for(s)
    rows += frame_dividers_and_rim()
    return rows


def build_blockout():
    """Build the Step 1 grey blockout: the frame plus every section M0..M9 at its target domed terrace height."""
    rows = build_frame()
    for idx, sec in enumerate(sorted(CELLS.keys())):
        col0 = DBG if idx % 2 == 0 else LBG
        col1 = LBG if idx % 2 == 0 else DBG
        rows += section_base(sec, col0=col0, col1=col1)
        rows += section_floor(sec, lambda i, k, c=col1: c)
    return rows


ALLOWED_FIG_COLS = {GOLD, SILVER, TIN, BRONZE, KYANOS, BLK, DB, WHITE, CLOTH_TAN, CLOTH_DTAN, CLOTH_DRED, CLOTH_RB, CLOTH_YELLOW}
FIG_COL_REMAP = {
    71: SILVER, 72: DB, 73: KYANOS, 378: CLOTH_DTAN, 379: KYANOS,
    330: CLOTH_DTAN, 288: DB, 92: CLOTH_TAN, 84: CLOTH_RB, 484: BRONZE,
    85: CLOTH_DRED, 324: CLOTH_TAN, 191: GOLD, 25: GOLD, 4: CLOTH_DRED,
    1: KYANOS, 2: DB, 6: DB, 7: SILVER, 8: DB,
}


def shield_fig(card, sub, costume, x, yup, z, rot=0.0, contact=False, root=False):
    """Place a minifigure from `odyssey/cards/` re-dressed via `wardrobe.dress`, enforcing the strict Shield palette."""
    raw = _wardrobe.dress(card, sub, costume, x=x, yup=yup, z=z, rot=rot)
    out = []
    for l in raw:
        if not l.startswith('1 '):
            out.append(l)
            continue
        t = l.split()
        c = int(t[1])
        if c not in ALLOWED_FIG_COLS:
            c = FIG_COL_REMAP.get(c, DB)
            t[1] = str(c)
        pid = t[14].lower().replace('.dat', '')
        if pid in ('98138', '3024'):
            out.append('0 !FORAGE ROOT')
        if pid.startswith('3815') or pid in ('36036', '24068'):
            if root:
                out.append('0 !FORAGE ROOT')
            if contact:
                out.append('0 !FORAGE CONTACT')
        out.append(' '.join(t))
    return out


def god_fig(card, sub, i0, k0, yup, rot=0.0, held_r=None, held_l=None):
    """Place a god wrought entirely in Pearl Gold (297), raised on a 2x2 Pearl Gold stature plinth (brick + plate = +32 LDU) at (i0, k0)."""
    spec = {
        'hips': GOLD, 'legs': GOLD, 'torso': ('973', GOLD), 'arms': GOLD,
        'hands': GOLD, 'head': ('3626bp01', GOLD), 'headgear': ('3844', GOLD),
        'neck': None, 'neck2': None, 'beard': None,
        'held.r': (held_r, GOLD) if isinstance(held_r, str) else held_r,
        'held.l': (held_l, GOLD) if isinstance(held_l, str) else held_l,
    }
    cx, cz = (i0 + 1.0) * S, (k0 + 1.0) * S
    plinth = [
        place_box(GOLD, i0, k0, yup,     '3003', 0.0),
        place_box(GOLD, i0, k0, yup + B, '3022', 0.0),
    ]
    return plinth + shield_fig(card, sub, spec, cx, yup + B + P, cz, rot=rot)


def fallen_fig(card, sub, costume, x, yup, z, rot=0.0):
    """Place a fallen warrior lying horizontally on the ground at `yup` (with 0 !FORAGE ROOT)."""
    m = mat_mul(RY(rot), RX(math.pi * 0.5))
    raw = _wardrobe.dress(card, sub, costume, x=x, yup=yup + 14, z=z, m=m)
    out = []
    for l in raw:
        if not l.startswith('1 '):
            out.append(l)
            continue
        t = l.split()
        c = int(t[1])
        if c not in ALLOWED_FIG_COLS:
            t[1] = str(FIG_COL_REMAP.get(c, DB))
        pid = t[14].lower().replace('.dat', '')
        if pid.startswith('3815') or pid in ('36036', '24068'):
            out.append('0 !FORAGE ROOT')
            out.append('0 !FORAGE CONTACT')
        out.append(' '.join(t))
    return out


def cow_on(col, horn_col, i0, k0, yup, rot=0.0, base_col=DB):
    """Place a crooked-horned ox/cow (64452p01 + lofty horns 13564) on a 2x2 stud plate at (i0, k0)."""
    cx, cz = (i0 + 1.0) * S, (k0 + 1.0) * S
    m = RY(rot)
    # Official LDraw 64452p01 !HELP horn pinholes: X = +/-10.6, Y = -31.7, Z = -79
    h_pos = mat_mul(T(cx, -(yup + P + 48.0), cz), m)
    hl = row(horn_col, mat_mul(h_pos, mat_mul(T(-10.6, -31.7, -79.0), RX(-0.65))), '13564')
    hr = row(horn_col, mat_mul(h_pos, mat_mul(T( 10.6, -31.7, -79.0), mat_mul(RX(-0.65), RZ(math.pi)))), '13564')
    return [
        place_box(base_col, i0, k0, yup, '3022', 0.0),
        on(col, cx, yup + P, cz, '64452p01', rot),
        hl, hr,
    ]


def lion_on(col, i0, k0, yup, rot=0.0, base_col=DB):
    """Place a tawny adult lion (80672a LDraw Update 2025-04 + sculpted mane ruff) on a 2x2 stud plate at (i0, k0)."""
    cx, cz = (i0 + 1.0) * S, (k0 + 1.0) * S
    m = RY(rot)
    m_pos = mat_mul(T(cx, -(yup + P + 48.0), cz), m)
    mane_col = DB if col == BRONZE else BRONZE
    ml = row(mane_col, mat_mul(m_pos, mat_mul(T(-10.0, -16.0, -10.0), RY(-math.pi * 0.5))), '54200')
    mr = row(mane_col, mat_mul(m_pos, mat_mul(T( 10.0, -16.0, -10.0), RY( math.pi * 0.5))), '54200')
    return [
        place_box(base_col, i0, k0, yup, '3022', 0.0),
        on(col, cx, yup + P, cz, '80672a', rot),
        '0 !FORAGE ROOT', ml,
        '0 !FORAGE ROOT', mr,
    ]


def dog_on(col, i, k, yup, rot=0.0, base_col=DB):
    """Place a swift printed hound (92586p01 LDraw Update 2022-01) on a 1x1 plate at (i, k)."""
    cx, cz = (i + 0.5) * S, (k + 0.5) * S
    return [
        place_box(base_col, i, k, yup, '3024', 0.0),
        on(col, cx, yup + P, cz, '92586p01', rot),
    ]


def sheep_on(col, i, k, yup, rot=0.0, base_col=DB):
    """Place a white-fleeced sheep (95341p03 LDraw Update 2024-05 + wool tuft 98138) on a 1x1 plate at (i, k)."""
    cx, cz = (i + 0.5) * S, (k + 0.5) * S
    m_pos = mat_mul(T(cx, -(yup + P + 48.0), cz), RY(rot))
    fleece = row(col, mat_mul(m_pos, T(0.0, -8.0, 0.0)), '98138')
    return [
        place_box(base_col, i, k, yup, '3024', 0.0),
        on(col, cx, yup + P, cz, '95341p03', rot),
        '0 !FORAGE ROOT', fleece,
    ]


if __name__ == '__main__':
    nf = write('set.shield-frame', 'The Shield of Achilles — Frame, Seats & Kyanos Dividers', build_frame())
    nb = write('set.shield-blockout', 'The Shield of Achilles — Domed Terrace Blockout (M0..M9)', build_blockout())
    print(f'set.shield-frame: {nf} pieces; set.shield-blockout: {nb} pieces')
    check('set.shield-frame')
    check('set.shield-blockout')

