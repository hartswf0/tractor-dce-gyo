#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m3.py — Section M3: Ploughing the Rich Fallow (Iliad XVIII.541-549).

  python3 tools/forage/product/kits/shield_m3.py
    -> odyssey/cards/set.shield-m3.mpd
    -> odyssey/cards/set.shield-m3-on-frame.mpd

Homer's moment:
  "Furthermore he set in the shield a soft fresh-ploughed field, rich tilth and wide, that was three times ploughed;
   and many ploughmen therein were wheeling their yokes and driving them this way and that. And whenever they turned
   and reached the headland of the field, a man would come forth to each and give into his hands a goblet of
   honey-sweet wine; and the others would turn back along the furrows, eager to reach the headland of the deep tilth.
   And the field grew black behind them and looked like earth that had been ploughed, though it was made of gold;
   that was a very miracle of the craft."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m3():
    sec = 'm3'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m3'] at SEAT['m3'] = 36
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Sculpted furrow ridges (2-stud-wide ridges & troughs so every 2x2 block is level) and the northern Headland:
    # - Headland terrace (k <= -22, -14 <= i <= -3): rises to level 3 where the Wine-Giver hands the golden goblet
    #   to the turning ploughman.
    # - Ploughed field (-21 <= k <= 12): alternating 2-stud furrow ridges (h=2) and troughs (h=1).
    #   Ahead of the southward-driving ploughs (k >= 0), the unploughed tilth gleams in Pearl Gold (297);
    #   behind the ploughs (k < 0), the earth turns Black (0) and Dark Brown (308) ("though it was made of gold").
    ox_turn_cells = {(-16 + a, -20 + b) for a in (0, 1) for b in (0, 1)}
    ox_1_cells    = {(-30 + a, -2 + b) for a in (0, 1) for b in (0, 1)}
    ox_2_cells    = {(-26 + a, 2 + b) for a in (0, 1) for b in (0, 1)}
    plough_1_cell = {(-29, -5), (-30, -5)}
    plough_2_cell = {(-25, -1), (-26, -1)}
    crater_cells  = {(-8, -26)}

    def h_fn(i, k):
        # Headland terrace at the North-East where the ploughs wheel around
        if k <= -22 and -14 <= i <= -3:
            return 3 if (-12 <= i <= -5 and -28 <= k <= -23) else 2
        # Parallel 2-stud furrow ridges (even bi -> ridge h=2, odd bi -> trough h=1)
        bi = i // 2
        return 2 if bi % 2 == 0 else 1

    def col_fn(i, k, lv):
        # Headland terrace in Bronze and Pearl Gold
        if k <= -22 and -14 <= i <= -3:
            return GOLD if lv >= 3 else BRONZE
        bi = i // 2
        # Ahead of the ploughs: gleaming Pearl Gold (297) and Bronze (300) fallow
        if (bi <= -15 and k >= -1) or (bi > -15 and k >= 3):
            return GOLD if bi % 2 == 0 else BRONZE
        # Behind the ploughs: turned Black (0) furrow ridges and Dark Brown (308) troughs
        if k >= -18:
            return BLK if bi % 2 == 0 else DB
        # Upper turning furrows approaching the headland: newly turned Black & Gold gleam
        return BLK if bi % 2 == 0 else GOLD

    fig_wine_giver   = (-8, -24)
    fig_turn_plough  = (-11, -24)
    fig_ploughman_1  = (-29, -7)
    fig_ploughman_2  = (-25, -3)

    keep = (
        ox_turn_cells | ox_1_cells | ox_2_cells
        | plough_1_cell | plough_2_cell | crater_cells
        | {fig_wine_giver, fig_turn_plough, fig_ploughman_1, fig_ploughman_2}
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. Primary Focal Moment at the Headland: The Golden Cup of Honey-Sweet Wine ──
    # Mixing-bowl / wine amphora on the headland beside the wine-giver
    yc = y_top[(-8, -26)]
    rows.append(place_box(BRONZE, -8, -26, yc,     '3024', 0.0))
    rows.append(on(BRONZE, (-8 + 0.5) * S, yc + P,     (-26 + 0.5) * S, '3062b'))
    rows.append(on(GOLD,   (-8 + 0.5) * S, yc + P + B, (-26 + 0.5) * S, '98138'))

    # The Wine-Giver stepping forth at the headland with the golden goblet (2343) in his outstretched hand
    rows += shield_fig(
        'character.menelaus', 'menelaus',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_DRED), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': ('2343', GOLD), 'held.l': None},
        (fig_wine_giver[0] + 0.5) * S, y_top[fig_wine_giver], (fig_wine_giver[1] + 0.5) * S, rot=math.pi * 0.72
    )
    # Turning Ploughman at the headland receiving the golden cup of wine
    rows += shield_fig(
        'character.philoetius', 'philoetius',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('2343', GOLD), 'held.l': ('95049', DB)},
        (fig_turn_plough[0] + 0.5) * S, y_top[fig_turn_plough], (fig_turn_plough[1] + 0.5) * S, rot=-math.pi * 0.72
    )
    # Wheeling ox at the headland turning back into the furrow
    rows += cow_on(DB, GOLD, -16, -20, y_top[(-16, -20)], rot=-math.pi * 0.75, base_col=BRONZE)

    # ── 4. Secondary Moment: The Furrow Ploughs Turning Golden Tilth to Black Earth ──
    # First Ox & Bronze Plough driving South along furrow bi=-15 (i=-30..-29)
    rows += cow_on(GOLD, SILVER, -30, -2, y_top[(-30, -2)], rot=math.pi, base_col=BLK)
    yp1 = y_top[(-30, -5)]
    rows.append(place_box(DB,     -30, -5, yp1,     '3023', 0.0))
    rows.append(place_box(BRONZE, -30, -5, yp1 + P, '54200', 0.0))
    rows.append(place_box(SILVER, -29, -5, yp1 + P, '54200', 0.0))
    rows += shield_fig(
        'character.eumaeus', 'eumaeus',
        {'hips': DB, 'legs': DB, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('95049', DB), 'held.l': None},
        (fig_ploughman_1[0] + 0.5) * S, y_top[fig_ploughman_1], (fig_ploughman_1[1] + 0.5) * S, rot=math.pi
    )

    # Second Ox & Bronze Plough driving South along furrow bi=-13 (i=-26..-25)
    rows += cow_on(BRONZE, GOLD, -26, 2, y_top[(-26, 2)], rot=math.pi, base_col=BLK)
    yp2 = y_top[(-26, -1)]
    rows.append(place_box(DB,     -26, -1, yp2,     '3023', 0.0))
    rows.append(place_box(BRONZE, -26, -1, yp2 + P, '54200', 0.0))
    rows.append(place_box(SILVER, -25, -1, yp2 + P, '54200', 0.0))
    rows += shield_fig(
        'character.dolius', 'dolius',
        {'hips': CLOTH_RB, 'legs': CLOTH_RB, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_DTAN,
         'headgear': None, 'held.r': ('95049', DB), 'held.l': None},
        (fig_ploughman_2[0] + 0.5) * S, y_top[fig_ploughman_2], (fig_ploughman_2[1] + 0.5) * S, rot=math.pi
    )

    return rows


if __name__ == '__main__':
    m3_rows = build_m3()
    n_alone = write('set.shield-m3', 'Shield of Achilles — M3: Ploughing the Rich Fallow', m3_rows)
    n_frame = write('set.shield-m3-on-frame', 'Shield of Achilles — M3 on Frame', build_frame(['m3']) + m3_rows)
    print(f'set.shield-m3: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m3')
    check('set.shield-m3-on-frame')
