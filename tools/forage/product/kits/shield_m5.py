#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m5.py — Section M5: The Golden Vineyard & The Linos Song (Iliad XVIII.561-572).

  python3 tools/forage/product/kits/shield_m5.py
    -> odyssey/cards/set.shield-m5.mpd
    -> odyssey/cards/set.shield-m5-on-frame.mpd

Homer's moment:
  "Thereon he set a vineyard heavily laden with clusters, fair and golden; and the clusters along it were black,
   and the vines stood throughout on silver poles. And around it he drove a ditch of kyanos, and around that a fence
   of tin; and a single path led to it, whereby the vintagers went whenever they gathered the vintage. And maidens
   and youths in childish glee were bearing the sweet fruit in woven baskets; and in their midst a boy made pleasant
   music with a clear-toned lyre, and sang thereto a sweet Linos-song with delicate voice; and they beating the
   ground in accompaniment followed with skipping feet and song and shouting."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m5():
    sec = 'm5'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m5'] at SEAT['m5'] = 36
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Sculpted architecture of the Vineyard:
    # - Central Single Path (-2 <= i <= 1, 18 <= k <= 29): raised stone causeway (h=2, with central h=3 Linos Dais
    #   at -2 <= i <= 1, 22 <= k <= 25) bridging the Kyanos ditch.
    # - West & East Vineyard Beds (-12 <= i <= -5 and 4 <= i <= 11, 20 <= k <= 25): h=2 dark earth terraces where
    #   silver vine poles support golden vines laden with black clusters.
    # - Ditch of Kyanos (Dark Blue 272): recessed moat (h=0) surrounding the vineyard beds (-14 <= i <= 13, 18 <= k <= 27)
    #   except where the single path crosses.
    # - Outer Fence of Tin (Metallic Silver 80): raised curb (h=2) outside the Kyanos ditch (-16 <= i <= -15, 14 <= i <= 15,
    #   and k in 28..29 for -12 <= i <= 11).
    west_poles = [(-11, 23), (-8, 23), (-5, 23), (-11, 26), (-8, 26), (-5, 26)]
    east_poles = [(4, 23),   (7, 23),  (10, 23), (4, 26),   (7, 26),  (10, 26)]
    tin_posts  = [(-15, 22), (-15, 27), (14, 22), (14, 27), (-8, 30), (-4, 30), (3, 30), (7, 30)]
    basket_pads = [(-3, 25), (2, 25)]

    def h_fn(i, k):
        # Central Single Path & Linos-Song Dais
        if -2 <= i <= 1 and 22 <= k <= 31:
            return 3 if 24 <= k <= 27 else 2
        # West & East Vineyard Beds
        if (-12 <= i <= -5 or 4 <= i <= 11) and 22 <= k <= 27:
            return 2
        # Outer Fence of Tin around the Kyanos Ditch
        if ((-16 <= i <= -15 or 14 <= i <= 15) and 22 <= k <= 27) or (-12 <= i <= 11 and 30 <= k <= 31):
            return 2
        # Ditch of Kyanos surrounding the vineyard beds
        if -14 <= i <= 13 and 20 <= k <= 29:
            return 0
        return 1

    def col_fn(i, k, lv):
        # Single Path & Central Dais in Pearl Gold and Bronze
        if -2 <= i <= 1 and 22 <= k <= 31:
            return GOLD if lv >= 3 else BRONZE
        # Fence of Tin in Metallic Silver (80) and Pearl Silver (179)
        if ((-16 <= i <= -15 or 14 <= i <= 15) and 22 <= k <= 27) or (-12 <= i <= 11 and 30 <= k <= 31):
            return TIN if lv >= 2 else SILVER
        # Vineyard Beds in Dark Brown tilth
        if (-12 <= i <= -5 or 4 <= i <= 11) and 22 <= k <= 27:
            return DB
        # Ditch of Kyanos in pure Dark Blue (272)
        if -14 <= i <= 13 and 20 <= k <= 29:
            return KYANOS
        return BRONZE if -18 <= i <= 17 else DB

    fig_lyre_boy = (0, 25)
    fig_maiden_1 = (-1, 22)
    fig_youth_1  = (1, 28)
    fig_maiden_2 = (-7, 24)
    fig_youth_2  = (6, 24)

    keep = (
        set(west_poles) | set(east_poles) | set(tin_posts) | set(basket_pads)
        | {fig_lyre_boy, fig_maiden_1, fig_youth_1, fig_maiden_2, fig_youth_2}
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. The Fence of Tin (Metallic Silver 80 Posts around the Kyanos Ditch) ──
    for ti, tk in tin_posts:
        if (ti, tk) in y_top:
            yt = y_top[(ti, tk)]
            rows.append(on(TIN,    (ti + 0.5) * S, yt,     (tk + 0.5) * S, '3062b'))
            rows.append(on(SILVER, (ti + 0.5) * S, yt + B, (tk + 0.5) * S, '98138'))

    # ── 4. Silver Vine Poles, Golden Vine Arbours & Black Grape Clusters ──
    # Build the 4 vine trellises: West-North (i=-11..-5, k=23), West-South (i=-11..-5, k=26),
    # East-North (i=4..10, k=23), East-South (i=4..10, k=26)
    for (i_start, k_row) in [(-11, 23), (-11, 26), (4, 23), (4, 26)]:
        yp = y_top[(i_start, k_row)]
        for pi in (i_start, i_start + 3, i_start + 6):
            # Silver poles (179) standing 2 bricks high
            rows.append(on(SILVER, (pi + 0.5) * S, yp,     (k_row + 0.5) * S, '3062b'))
            rows.append(on(SILVER, (pi + 0.5) * S, yp + B, (k_row + 0.5) * S, '3062b'))
        # Golden vine beam (3666 1x6 plate + 3024 1x1 plate = 7 studs long) spanning i_start .. i_start+6
        yv = yp + 2 * B
        rows.append(place_box(GOLD, i_start,     k_row, yv, '3666', 0.0))
        rows.append(place_box(GOLD, i_start + 6, k_row, yv, '3024', 0.0))
        # Black grape clusters (BLK = 0) and golden vine leaves crowning the trellis
        for offset in range(7):
            ci = i_start + offset
            if offset % 2 == 1:
                # Hanging/heaped black grape cluster in Black (0)
                rows.append(place_box(BLK, ci, k_row, yv + P,     '3024', 0.0))
                rows.append(place_box(BLK, ci, k_row, yv + 2 * P, '98138', 0.0))
            else:
                # Golden vine leaf cap in Pearl Gold (297)
                rows.append(place_box(GOLD, ci, k_row, yv + P, '98138', 0.0))

    # Woven vintage baskets (Dark Brown 3062b + Black grape cluster 98138) flanking the central dais
    for bi, bk in basket_pads:
        if (bi, bk) in y_top:
            yb = y_top[(bi, bk)]
            rows.append(on(DB,  (bi + 0.5) * S, yb,     (bk + 0.5) * S, '3062b'))
            rows.append(on(BLK, (bi + 0.5) * S, yb + B, (bk + 0.5) * S, '98138'))

    # ── 5. Primary Focal Moment: The Boy with the Clear-Toned Lyre & Skipping Vintagers ──
    # The Boy in their midst singing the sweet Linos-song with his golden lyre
    rows += shield_fig(
        'character.child-eumaeus-memory-variant', 'child-eumaeus-memory-variant',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN,
         'crown': ('98138', GOLD), 'held.r': ('3959', GOLD), 'held.l': None},
        (fig_lyre_boy[0] + 0.5) * S, y_top[fig_lyre_boy], (fig_lyre_boy[1] + 0.5) * S, rot=math.pi
    )

    # Maidens and Youths bearing the sweet black grapes in baskets and skipping along the single path
    rows += shield_fig(
        'character.nausicaa', 'nausicaa',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': ('2343', DB), 'held.l': None},
        (fig_maiden_1[0] + 0.5) * S, y_top[fig_maiden_1], (fig_maiden_1[1] + 0.5) * S, rot=-math.pi * 0.85
    )
    rows += shield_fig(
        'character.telemachus', 'telemachus',
        {'hips': CLOTH_DRED, 'legs': CLOTH_DRED, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('2343', GOLD), 'held.l': None},
        (fig_youth_1[0] + 0.5) * S, y_top[fig_youth_1], (fig_youth_1[1] + 0.5) * S, rot=math.pi * 0.85
    )
    rows += shield_fig(
        'ensemble.wedding-household', 'maid-2',
        {'hips': CLOTH_TAN, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': ('98138', BLK), 'held.l': None},
        (fig_maiden_2[0] + 0.5) * S, y_top[fig_maiden_2], (fig_maiden_2[1] + 0.5) * S, rot=-math.pi * 0.70
    )
    rows += shield_fig(
        'character.laodamas', 'laodamas',
        {'hips': CLOTH_DTAN, 'legs': CLOTH_DTAN, 'torso': ('973', CLOTH_DRED), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('98138', BLK), 'held.l': None},
        (fig_youth_2[0] + 0.5) * S, y_top[fig_youth_2], (fig_youth_2[1] + 0.5) * S, rot=math.pi * 0.70
    )

    return rows


if __name__ == '__main__':
    m5_rows = build_m5()
    n_alone = write('set.shield-m5', 'Shield of Achilles — M5: The Golden Vineyard', m5_rows)
    n_frame = write('set.shield-m5-on-frame', 'Shield of Achilles — M5 on Frame', build_frame(['m5']) + m5_rows)
    print(f'set.shield-m5: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m5')
    check('set.shield-m5-on-frame')
