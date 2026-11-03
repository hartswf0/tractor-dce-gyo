#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m0.py — Section M0: The Heavens on the Boss (Iliad XVIII.483-489).

  python3 tools/forage/product/kits/shield_m0.py
    -> odyssey/cards/set.shield-m0.mpd
    -> odyssey/cards/set.shield-m0-on-frame.mpd

Homer's moment:
  "On it he wrought the earth, the sea, the heaven, the unwearying sun, the moon at the full, and all the signs
   that crown the sky: the Pleiades, the Hyades, the strength of Orion, and the Bear, which men also call the
   Wain, that turns about in her place and watches Orion, and alone has no part in the baths of Ocean."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m0():
    sec = 'm0'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m0'] at SEAT['m0'] = 68 (highest terrace of the shield)
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Stepped celestial dome in Dark Blue (KYANOS 272), Black (0), Bronze (300), Pearl Silver (179) & Pearl Gold (297)
    # Studs left open on the dome for the central turntable, Sun disc, Moon disc, Pleiades, Hyades, and Orion
    turntable_cells = {(i, k) for i in range(-2, 2) for k in range(-2, 2)}
    sun_cells       = {(4 + a, -1 + b) for a in (0, 1) for b in (0, 1)}
    moon_cells      = {(-6 + a, -1 + b) for a in (0, 1) for b in (0, 1)}
    orion_cells     = {(-1, -6), (0, -6)}
    pleiades_cells  = [(-3, 5), (-2, 6), (-1, 5), (0, 6), (1, 5), (2, 6), (0, 4)]
    hyades_cells    = [(-5, 3), (-4, 4), (3, 4), (4, 3)]

    def h_fn(i, k):
        r = math.hypot(i + 0.5, k + 0.5)
        if (i, k) in turntable_cells:
            return 4   # Central plateau for the 4x4 revolving turntable (61485c01) of the Bear/Wain
        if (i, k) in (sun_cells | moon_cells | orion_cells):
            return 2   # Level pads for Sun, Moon & Orion
        if r < 4.8:
            return 3   # Inner vault of heaven
        if r < 7.2:
            return 2   # Middle ring of Sun (East), Moon (West), Orion (North) & Pleiades (South)
        if r < 8.6:
            return 1   # Horizon ring of Earth (South, Bronze) & Sea (North, Kyanos/Silver)
        return 0

    def col_fn(i, k, lv):
        r = math.hypot(i + 0.5, k + 0.5)
        if lv >= 3:
            return KYANOS if r < 3.6 else BLK
        if lv == 2:
            # East: solar aura of Helios; West: lunar aura of Selene; centre vault: deep Kyanos
            if i >= 3 and -3 <= k <= 2:
                return GOLD
            if i <= -4 and -3 <= k <= 2:
                return SILVER
            return KYANOS
        # Outer horizon ring: Earth (Bronze/Dark Brown) in South hemisphere, Sea (Kyanos/Silver) in North hemisphere
        if k >= 1:
            return BRONZE if r < 8.2 else DB
        return KYANOS if r < 8.2 else SILVER

    keep = turntable_cells | sun_cells | moon_cells | orion_cells | set(pleiades_cells) | set(hyades_cells)
    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. Central 4x4 Turntable (61485c01): The Bear / Wain Turning in Her Place ──
    yt = y_top[(-2, -2)]
    rows.append(place_box(KYANOS, -2, -2, yt, '61485c01', 0.0))
    yt_top = yt + 2 * P   # 61485c01 is 16 LDU (2 plates) high with studs on top
    # Sculpt the 4x4 revolving celestial boss on the turntable with the 7 golden stars of the Bear (Ursa Major)
    rows.append(place_box(KYANOS, -2, -2, yt_top, '3031', 0.0))
    bear_stars = {(-2, -2), (-1, -2), (0, -1), (1, -1), (1, 0), (0, 1), (-1, 1)}
    for bi in range(-2, 2):
        for bk in range(-2, 2):
            if (bi, bk) in bear_stars:
                rows.append(place_box(GOLD, bi, bk, yt_top + P, '98138', 0.0))
            else:
                rows.append(put_curve(KYANOS, bi, bk, yt_top + P, '25269',
                                      1 if bi >= 0 else -1, 1 if bk >= 0 else -1))

    # ── 4. The Unwearying Sun (East: i=4..5, k=-1..0) — Full Circular Golden Orb ──
    ys = y_top[(4, -1)]
    rows.append(place_box(BRONZE, 4, -1, ys,     '3022', 0.0))
    rows.append(place_box(GOLD,   4, -1, ys + P, '3022', 0.0))
    for da, sx in ((0, -1), (1, 1)):
        for db, sz in ((0, -1), (1, 1)):
            rows.append(put_curve(GOLD, 4 + da, -1 + db, ys + 2 * P, '25269', sx, sz))

    # ── 5. The Moon at the Full (West: i=-6..-5, k=-1..0) — Full Circular Silver Orb ──
    ym = y_top[(-6, -1)]
    rows.append(place_box(TIN,    -6, -1, ym,     '3022', 0.0))
    rows.append(place_box(SILVER, -6, -1, ym + P, '3022', 0.0))
    for da, sx in ((0, -1), (1, 1)):
        for db, sz in ((0, -1), (1, 1)):
            rows.append(put_curve(SILVER, -6 + da, -1 + db, ym + 2 * P, '25269', sx, sz))

    # ── 6. The Strength of Orion (North: i=-1..0, k=-6), Facing the Bear & Viewer (rot=math.pi) ──
    yo = y_top[(-1, -6)]
    rows += shield_fig(
        'character.odysseus-restored', 'odysseus-restored',
        {'hips': SILVER, 'legs': BRONZE, 'torso': ('973', GOLD), 'arms': GOLD,
         'head': ('3626bp01', GOLD), 'headgear': ('3844', GOLD),
         'held.r': ('3847', GOLD), 'held.l': ('75902', SILVER), 'neck': None, 'beard': None},
        0.0, yo, (-6 + 0.5) * S, rot=math.pi
    )

    # ── 7. The Seven Pleiades (South, Fleeing Orion) & The Hyades ──
    for idx_p, (pi, pk) in enumerate(pleiades_cells):
        if (pi, pk) in y_top:
            yp = y_top[(pi, pk)]
            rows.append(place_box(KYANOS, pi, pk, yp, '3024', 0.0))
            rows.append(place_box(GOLD if idx_p % 2 == 0 else SILVER, pi, pk, yp + P, '98138', 0.0))

    for idx_h, (hi, hk) in enumerate(hyades_cells):
        if (hi, hk) in y_top:
            yh = y_top[(hi, hk)]
            rows.append(place_box(BRONZE, hi, hk, yh, '3024', 0.0))
            rows.append(place_box(SILVER if idx_h % 2 == 0 else GOLD, hi, hk, yh + P, '98138', 0.0))

    return rows


if __name__ == '__main__':
    m0_rows = build_m0()
    n_alone = write('set.shield-m0', 'Shield of Achilles — M0: The Heavens on the Boss', m0_rows)
    n_frame = write('set.shield-m0-on-frame', 'Shield of Achilles — M0 on Frame', build_frame(['m0']) + m0_rows)
    print(f'set.shield-m0: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m0')
    check('set.shield-m0-on-frame')
