#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m7.py — Section M7: The Fair Glen of White Sheep (Iliad XVIII.587-589).

  python3 tools/forage/product/kits/shield_m7.py
    -> odyssey/cards/set.shield-m7.mpd
    -> odyssey/cards/set.shield-m7-on-frame.mpd

Homer's moment:
  "And on it the famous Strong-Arm made a pasture in a fair glen, a great pasture of white sheep, and folds, and
   roofed huts, and pens."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m7():
    sec = 'm7'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m7'] at SEAT['m7'] = 20
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Sculpted valley floor & hillside walls (defined on 2x2 blocks bi=i//2, bk=k//2):
    # - Central Glen Floor (-6 <= bi <= 5, i.e. -12 <= i <= 11): sunken peaceful pasture (h=0..1)
    # - West Hillside Shelf (bi <= -7, i.e. i <= -13): rises to h=2..3 where the Roofed Shepherd Hut stands
    # - East Hillside Shelf (bi >= 6, i.e. i >= 12): rises to h=2..3 where the Stone Sheepfold & Pens stand
    def h_fn(i, k):
        bi, bk = i // 2, k // 2
        if bi <= -10 or bi >= 9:
            return 3
        if bi <= -7 or bi >= 6:
            return 2
        if bk <= -19:
            return 1
        return 0

    def col_fn(i, k, lv):
        bi, bk = i // 2, k // 2
        if bi <= -7 or bi >= 6:
            return BRONZE if lv >= 2 else DB
        # Open valley floor in Dark Brown pasture with a Bronze shepherd track
        return BRONZE if -3 <= bi <= 2 and bk >= -18 else DB

    # Roofed Shepherd Hut footprint on West shelf: i in -18..-15, k in -36..-33 (4x4 block)
    hut_wall_cells = {
        (-18, -36), (-17, -36), (-16, -36), (-15, -36),
        (-18, -35),                         (-15, -35),
        (-18, -34),                         (-15, -34),
    }

    # Dry-Stone Sheepfold & Pen on East shelf: i in 12..17, k in -36..-33
    fold_wall_cells = {
        (12, -36), (13, -36), (14, -36), (15, -36), (16, -36), (17, -36),
        (12, -35),                                              (17, -35),
        (12, -33), (13, -33),                       (16, -33), (17, -33),
    }

    # Twelve White Sheep (WHITE = 15, LDraw 95341) grazing in open clusters across the glen and inside the fold
    sheep_spots = [
        # Main grazing cluster in the open central valley (k in -40..-35)
        ((-9, -37), -math.pi * 0.70),
        ((-7, -35), -math.pi * 0.80),
        ((-5, -39),  math.pi * 0.85),
        ((-3, -36), -math.pi * 0.65),
        ((-1, -38),  math.pi * 0.90),
        (( 1, -35),  math.pi * 0.75),
        (( 3, -39),  math.pi * 0.65),
        (( 5, -36),  math.pi * 0.80),
        (( 8, -37),  math.pi * 0.70),
        # Straggler lambs on the western & eastern meadow slopes
        ((-21, -31), -math.pi * 0.85),
        (( 21, -31),  math.pi * 0.85),
        # Sheep resting inside the eastern stone sheepfold
        ((14, -35),  math.pi * 0.90),
    ]
    sheep_cells = {pos for pos, _ in sheep_spots}

    # One quiet Shepherd & one faithful Sheepdog watching the flock from the western knoll edge
    fig_shepherd = (-12, -36)
    dog_spot     = (-10, -35)

    # Two mountain pines/oaks framing the outer wings of the glen
    tree_spots = [(-24, -31), (23, -31)]

    keep = (
        hut_wall_cells | fold_wall_cells | sheep_cells
        | {fig_shepherd, dog_spot} | set(tree_spots)
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. The Roofed Shepherd Hut (κλισίας κατηρεφέας) on the West Shelf (i=-18..-15, k=-36..-34) ──
    yh = y_top[(-18, -36)]
    # Coursed stone & timber walls (2 bricks high) with open southern doorway at (-17..-16, -34)
    # Back wall (k=-36): 1x4 brick (3010) in Bronze + 1x4 brick in Dark Brown
    rows.append(place_box(BRONZE, -18, -36, yh,     '3010', 0.0))
    rows.append(place_box(DB,     -18, -36, yh + B, '3010', 0.0))
    # Side walls (i=-18 and i=-15, k=-35..-34): 1x2 bricks (3004) rotated along Z
    rows.append(place_box(DB,     -18, -35, yh,     '3004', math.pi * 0.5))
    rows.append(place_box(BRONZE, -18, -35, yh + B, '3004', math.pi * 0.5))
    rows.append(place_box(DB,     -15, -35, yh,     '3004', math.pi * 0.5))
    rows.append(place_box(BRONZE, -15, -35, yh + B, '3004', math.pi * 0.5))
    # Roof plate (4x4 plate 3031 covering -18..-15, -36..-33) + pitched bronze/gold thatch roof
    yr_hut = yh + 2 * B
    rows.append(place_box(DB, -18, -36, yr_hut, '3031', 0.0))
    for da, sx in ((0, -1), (2, 1)):
        for db, sz in ((0, -1), (2, 1)):
            rows += put_curve_fan(lambda ci, ck: GOLD if (ci in (-17, -16)) else BRONZE,
                                  -18 + da, -36 + db, 2, yr_hut + P, sx, sz, curve_col=GOLD)

    # ── 4. The Stone Sheepfold & Pens (σταθμούς τε ... ἰδὲ σηκούς) on the East Shelf (i=12..17, k=-36..-33) ──
    yf = y_top[(12, -36)]
    # Back dry-stone wall (k=-36, i=12..17): 1x6 brick (3009) in Metallic Silver (80) capped with Pearl Silver tile (6636)
    rows.append(place_box(TIN,    12, -36, yf,     '3009', 0.0))
    rows.append(place_box(SILVER, 12, -36, yf + B, '6636', 0.0))
    # Side posts at (12, -35) and (17, -35)
    rows.append(on(SILVER, (12 + 0.5) * S, yf,     (-35 + 0.5) * S, '3062b'))
    rows.append(on(GOLD,   (12 + 0.5) * S, yf + B, (-35 + 0.5) * S, '98138'))
    rows.append(on(SILVER, (17 + 0.5) * S, yf,     (-35 + 0.5) * S, '3062b'))
    rows.append(on(GOLD,   (17 + 0.5) * S, yf + B, (-35 + 0.5) * S, '98138'))
    # Front gate piers at (12..13, -33) and (16..17, -33) leaving 2-stud open pen gate at (14..15, -33)
    rows.append(place_box(TIN,    12, -33, yf,     '3004', 0.0))
    rows.append(place_box(SILVER, 12, -33, yf + B, '3069b', 0.0))
    rows.append(place_box(TIN,    16, -33, yf,     '3004', 0.0))
    rows.append(place_box(SILVER, 16, -33, yf + B, '3069b', 0.0))

    # Framing mountain cypresses at (-22, -33) and (20, -33)
    for ti, tk in tree_spots:
        if (ti, tk) in y_top:
            yt = y_top[(ti, tk)]
            rows.append(on(DB,     (ti + 0.5) * S, yt,         (tk + 0.5) * S, '3062b'))
            rows.append(on(BRONZE, (ti + 0.5) * S, yt + B,     (tk + 0.5) * S, '3062b'))
            rows.append(on(DB,     (ti + 0.5) * S, yt + 2 * B, (tk + 0.5) * S, '3062b'))
            rows.append(on(GOLD,   (ti + 0.5) * S, yt + 3 * B, (tk + 0.5) * S, '98138'))

    # ── 5. Primary Focal Moment: The Great Flock of White Sheep & The Solitary Shepherd ──
    for (si, sk), srot in sheep_spots:
        if (si, sk) in y_top:
            rows += sheep_on(WHITE, si, sk, y_top[(si, sk)], rot=srot, base_col=DB)

    # Faithful sheepdog watching the flock
    rows += dog_on(SILVER, dog_spot[0], dog_spot[1], y_top[dog_spot], rot=-math.pi * 0.78, base_col=DB)

    # Solitary Shepherd leaning on his staff watching the white flock across the quiet valley
    rows += shield_fig(
        'character.athena-as-shepherd', 'athena-as-shepherd',
        {'hips': CLOTH_TAN, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': ('95049', GOLD), 'held.l': None},
        (fig_shepherd[0] + 0.5) * S, y_top[fig_shepherd], (fig_shepherd[1] + 0.5) * S, rot=-math.pi * 0.78
    )

    return rows


if __name__ == '__main__':
    m7_rows = build_m7()
    n_alone = write('set.shield-m7', 'Shield of Achilles — M7: The Fair Glen of White Sheep', m7_rows)
    n_frame = write('set.shield-m7-on-frame', 'Shield of Achilles — M7 on Frame', build_frame(['m7']) + m7_rows)
    print(f'set.shield-m7: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m7')
    check('set.shield-m7-on-frame')
