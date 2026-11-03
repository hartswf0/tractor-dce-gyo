#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m4.py — Section M4: The Royal Harvest & Feast Beneath the Oak (Iliad XVIII.550-560).

  python3 tools/forage/product/kits/shield_m4.py
    -> odyssey/cards/set.shield-m4.mpd
    -> odyssey/cards/set.shield-m4-on-frame.mpd

Homer's moment:
  "Thereon he set also the precinct of a king, where labourers were reaping, holding sharp sickles in their hands.
   Some handfuls were falling in rows along the swath, while others the sheaf-binders were binding in twisted bands
   of straw. Three sheaf-binders stood over them, while behind them boys gathered the handfuls and bearing them in
   their arms gave them constantly; and among them the king in silence stood at the swath with his staff, rejoicing
   in his heart. And heralds apart beneath an oak were making ready a feast, and dressing a great ox they had
   sacrificed; while the women were strewing much white barley to be a supper for the labourers."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m4():
    sec = 'm4'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m4'] at SEAT['m4'] = 36
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Sculpted terraces of the King's Precinct (temenos):
    # - Oak Grove Knoll at North-West (k <= -20, 2 <= i <= 17): rises to h=3 where the great Oak stands and the ox
    #   and white barley supper are prepared.
    # - The King's Swath Dais (18 <= i <= 23, -12 <= k <= -6): rises to h=3 in Pearl Gold & Bronze where the King
    #   stands in silence holding his staff.
    # - Standing Golden Corn on the East (bi = i // 2 >= 14, i.e. i in 28..31): rises to h=3 in Pearl Gold.
    # - Cut Swathes in the Middle Furrow (i in 24..27): h=2 in Pearl Gold & Bronze.
    # - Stubble & Dark Earth Trough on the West (i in 20..23, k >= -5): h=1 in Dark Brown.
    oak_trunk_cells = {(6 + a, -28 + b) for a in (0, 1) for b in (0, 1)}
    ox_feast_cells  = {(10 + a, -26 + b) for a in (0, 1) for b in (0, 1)}
    barley_cells    = {(8, -23), (9, -23)}
    standing_stalks = [
        (29, -10), (30, -8), (29, -6), (30, -4), (29, -2),
        (30, 0), (29, 2), (30, 4), (29, 6),
    ]
    bound_sheaves   = [(25, -4), (25, 2), (25, 6)]

    def h_fn(i, k):
        # Oak grove knoll in the northern precinct
        if k <= -20:
            if 4 <= i <= 15 and -30 <= k <= -22:
                return 3
            return 2
        # The King's Swath Dais
        if 18 <= i <= 23 and -12 <= k <= -6:
            return 3
        bi = i // 2
        # Uncut standing golden grain on the eastern edge (i >= 28)
        if bi >= 14:
            return 3
        # Cut swathes falling along the middle furrow (24 <= i <= 27)
        if bi >= 12:
            return 2
        return 1

    def col_fn(i, k, lv):
        if k <= -20:
            return BRONZE if lv >= 3 else DB
        if 18 <= i <= 23 and -12 <= k <= -6:
            return GOLD if lv >= 3 else BRONZE
        bi = i // 2
        if bi >= 14:
            return GOLD
        if bi >= 12:
            return GOLD if lv >= 2 else BRONZE
        return DB

    fig_king      = (21, -9)
    fig_reaper_1  = (26, -7)
    fig_reaper_2  = (26, -1)
    fig_binder    = (23, 1)
    fig_boy       = (23, 5)
    fig_herald    = (14, -25)
    fig_woman     = (6, -24)

    keep = (
        oak_trunk_cells | ox_feast_cells | barley_cells
        | set(standing_stalks) | set(bound_sheaves)
        | {fig_king, fig_reaper_1, fig_reaper_2, fig_binder, fig_boy, fig_herald, fig_woman}
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. The Spreading Oak Tree & The Harvest Feast (North-West Precinct) ──
    # Tall 2x2 Dark Brown oak trunk at (6, -28) rising 5 bricks (120 LDU) high so its boughs spread over the figures
    yt = y_top[(6, -28)]
    for b_idx in range(5):
        rows.append(place_box(DB, 6, -28, yt + b_idx * B, '3003', 0.0))
    yc_base = yt + 5 * B
    # Lower spreading boughs: two 2x6 plates (3795) spanning i=4..9, k=-29..-26
    rows.append(place_box(DB, 4, -29, yc_base, '3795', 0.0))
    rows.append(place_box(DB, 4, -27, yc_base, '3795', 0.0))
    # Middle foliage tier: 4x4 plate (3031) at (5, -29) + outer curved corner tiles on (4, -29) and (8, -29)
    rows.append(place_box(BRONZE, 5, -29, yc_base + P, '3031', 0.0))
    rows.append(put_curve(GOLD, 4, -29, yc_base + P, '25269', -1, -1))
    rows.append(put_curve(GOLD, 4, -26, yc_base + P, '25269', -1,  1))
    rows.append(put_curve(GOLD, 9, -29, yc_base + P, '25269',  1, -1))
    rows.append(put_curve(GOLD, 9, -26, yc_base + P, '25269',  1,  1))
    rows.append(place_box(DB,   4, -28, yc_base + P, '3069b', math.pi * 0.5))
    rows.append(place_box(DB,   9, -28, yc_base + P, '3069b', math.pi * 0.5))
    # Upper crown: four 2x2 curved fans tiling the 4x4 3031 canopy at yc_base + 2*P
    for da, sx in ((0, -1), (2, 1)):
        for db, sz in ((0, -1), (2, 1)):
            rows += put_curve_fan(lambda ci, ck: BRONZE, 5 + da, -29 + db, 2, yc_base + 2 * P, sx, sz, curve_col=GOLD)

    # Great Sacrificed Ox beneath the oak & Herald dressing the feast
    rows += cow_on(BRONZE, GOLD, 10, -26, y_top[(10, -26)], rot=math.pi * 0.85, base_col=DB)
    rows += shield_fig(
        'character.medon', 'medon',
        {'hips': CLOTH_RB, 'legs': CLOTH_RB, 'torso': ('973', CLOTH_DRED), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('3847', BRONZE), 'held.l': None},
        (fig_herald[0] + 0.5) * S, y_top[fig_herald], (fig_herald[1] + 0.5) * S, rot=math.pi * 0.65
    )

    # Kneading trough with White Barley (WHITE = 15) & Woman strewing barley meal for the reapers
    yb = y_top[(8, -23)]
    rows.append(place_box(BRONZE, 8, -23, yb,     '3023', 0.0))
    rows.append(place_box(WHITE,  8, -23, yb + P, '98138', 0.0))
    rows.append(place_box(WHITE,  9, -23, yb + P, '98138', 0.0))
    rows += shield_fig(
        'character.eurycleia', 'eurycleia',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': ('2343', WHITE), 'held.l': None},
        (fig_woman[0] + 0.5) * S, y_top[fig_woman], (fig_woman[1] + 0.5) * S, rot=-math.pi * 0.75
    )

    # ── 4. Primary Focal Moment: The King in Silence at the Swath & The Reapers ──
    # Standing golden grain stalks along the eastern ridge (i=29)
    for si, sk in standing_stalks:
        if (si, sk) in y_top:
            ys = y_top[(si, sk)]
            rows.append(on(GOLD, (si + 0.5) * S, ys,         (sk + 0.5) * S, '3062b'))
            rows.append(on(GOLD, (si + 0.5) * S, ys + B,     (sk + 0.5) * S, '3062b'))
            rows.append(on(GOLD, (si + 0.5) * S, ys + 2 * B, (sk + 0.5) * S, '98138'))

    # Bound golden sheaves along the middle swath (i=25)
    for bi, bk in bound_sheaves:
        if (bi, bk) in y_top:
            ysh = y_top[(bi, bk)]
            rows.append(on(GOLD,   (bi + 0.5) * S, ysh,         (bk + 0.5) * S, '3062b'))
            rows.append(on(BRONZE, (bi + 0.5) * S, ysh + B,     (bk + 0.5) * S, '3024'))
            rows.append(on(GOLD,   (bi + 0.5) * S, ysh + B + P, (bk + 0.5) * S, '98138'))

    # The King standing in silence on the swath holding his golden staff (95049), rejoicing in his heart
    rows += shield_fig(
        'character.alcinous', 'alcinous',
        {'hips': CLOTH_DRED, 'legs': CLOTH_DRED, 'torso': ('973', GOLD), 'arms': CLOTH_WHITE,
         'held.r': ('95049', GOLD), 'held.l': None},
        (fig_king[0] + 0.5) * S, y_top[fig_king], (fig_king[1] + 0.5) * S, rot=-math.pi * 0.80
    )

    # Two Reapers cutting the standing grain with sharp sickles
    rows += shield_fig(
        'character.odysseus', 'odysseus',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('3847', SILVER), 'held.l': None},
        (fig_reaper_1[0] + 0.5) * S, y_top[fig_reaper_1], (fig_reaper_1[1] + 0.5) * S, rot=-math.pi * 0.65
    )
    rows += shield_fig(
        'character.euryalus', 'euryalus',
        {'hips': CLOTH_DTAN, 'legs': CLOTH_DTAN, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('3847', SILVER), 'held.l': None},
        (fig_reaper_2[0] + 0.5) * S, y_top[fig_reaper_2], (fig_reaper_2[1] + 0.5) * S, rot=-math.pi * 0.65
    )

    # Sheaf-Binder tying golden sheaves & Gatherer Boy carrying an armful of corn
    rows += shield_fig(
        'character.philoetius', 'philoetius',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('98138', GOLD), 'held.l': None},
        (fig_binder[0] + 0.5) * S, y_top[fig_binder], (fig_binder[1] + 0.5) * S, rot=-math.pi * 0.75
    )
    rows += shield_fig(
        'character.child-eumaeus-memory-variant', 'child-eumaeus-memory-variant',
        {'hips': CLOTH_TAN, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('98138', GOLD), 'held.l': None},
        (fig_boy[0] + 0.5) * S, y_top[fig_boy], (fig_boy[1] + 0.5) * S, rot=-math.pi * 0.85
    )

    return rows


if __name__ == '__main__':
    m4_rows = build_m4()
    n_alone = write('set.shield-m4', 'Shield of Achilles — M4: The Royal Harvest', m4_rows)
    n_frame = write('set.shield-m4-on-frame', 'Shield of Achilles — M4 on Frame', build_frame(['m4']) + m4_rows)
    print(f'set.shield-m4: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m4')
    check('set.shield-m4-on-frame')
