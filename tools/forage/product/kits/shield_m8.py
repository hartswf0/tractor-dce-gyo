#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m8.py — Section M8: The Choros Dance Floor of Daedalus (Iliad XVIII.590-606).

  python3 tools/forage/product/kits/shield_m8.py
    -> odyssey/cards/set.shield-m8.mpd
    -> odyssey/cards/set.shield-m8-on-frame.mpd

Homer's moment:
  "And on it the famous Strong-Arm wrought a dancing-floor, like unto that which once in wide Knossos Daedalus
   fashioned for Ariadne of the lovely tresses. There were youths dancing and maidens of costly wooing, their hands
   upon one another's wrists. Of these the maidens wore fine linen, while the youths were clad in well-spun tunics
   faintly glistening with oil; and the maidens had fair wreaths, and the youths had daggers of gold hanging from
   silver belts. And now would they run round with deft feet exceeding lightly, as when a potter sitting by his wheel
   that fits between his hands makes trial of it whether it will run... and two tumblers whirled up and down among
   them as the song began."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m8():
    sec = 'm8'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m8'] at SEAT['m8'] = 20
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Sculpted terraces (defined on 2x2 blocks bi=i//2, bk=k//2 so the 4x4 turntable pad is 100% level):
    # - The Circular Choros Dance Floor of Daedalus centered at (17.5, 33.5) (bi in 5..10, bk in 14..18):
    #   raised circular marble/silver dance platform (h=2), with central 4x4 Turntable Pad at i in 16..19, k in 32..35 (h=3).
    # - Knossian Spectator Portico & Stepped Terrace on the North (bk <= 10, i.e. k <= 21): rises to h=2..3.
    turntable_cells = {(i, k) for i in range(16, 20) for k in range(32, 36)}

    def h_fn(i, k):
        if (i, k) in turntable_cells:
            return 3   # Central plateau for the 4x4 Potter's Wheel Turntable (61485c01)
        bi, bk = i // 2, k // 2
        d_ch = math.hypot((2 * bi + 1.0) - 18.0, (2 * bk + 1.0) - 34.0)
        if d_ch <= 6.8:
            return 2   # Circular Choros dance floor
        if bk <= 2:
            return 3 if bk <= -3 else 2   # Northern Knossian spectator portico
        return 1

    def col_fn(i, k, lv):
        if (i, k) in turntable_cells:
            return GOLD if lv >= 3 else SILVER
        bi, bk = i // 2, k // 2
        d_ch = math.hypot((2 * bi + 1.0) - 18.0, (2 * bk + 1.0) - 34.0)
        if d_ch <= 6.8:
            return SILVER if lv >= 2 else BRONZE
        if bk <= 2:
            return BRONZE if lv >= 2 else DB
        return DB

    # Knossian portico columns on the northern spectator terrace (k = -10, -4)
    portico_pillars = [(35, -10), (38, -10), (35, -4), (38, -4)]

    # Wrist-in-wrist Youth & Maiden dancer pairs around the circular Choros floor (contact=True):
    # Pair 1 (North-West of turntable): Maiden at (12, 32), Youth at (13, 32)
    # Pair 2 (North-East of turntable): Maiden at (21, 31), Youth at (22, 31)
    # Pair 3 (South-West of turntable): Maiden at (12, 36), Youth at (13, 36)
    dancer_cells = {
        (12, 32), (13, 32),
        (21, 31), (22, 31),
        (12, 36), (13, 36),
    }

    # Spectators & Bard admiring the lovely dance from the northern terrace
    spectator_cells = {(35, 4), (38, 8), (33, 18)}

    keep = (
        turntable_cells | set(portico_pillars)
        | dancer_cells | spectator_cells
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. Northern Knossian Portico Columns ──
    for pi, pk in portico_pillars:
        if (pi, pk) in y_top:
            yp = y_top[(pi, pk)]
            rows.append(on(BRONZE, (pi + 0.5) * S, yp,         (pk + 0.5) * S, '3062b'))
            rows.append(on(SILVER, (pi + 0.5) * S, yp + B,     (pk + 0.5) * S, '3062b'))
            rows.append(on(GOLD,   (pi + 0.5) * S, yp + 2 * B, (pk + 0.5) * S, '98138'))

    # ── 4. Central 4x4 Turntable (61485c01): The Potter's Wheel & The Two Whirling Tumblers ──
    yt = y_top[(16, 32)]
    rows.append(place_box(SILVER, 16, 32, yt, '61485c01', 0.0))
    yt_top = yt + 2 * P
    # 4x4 Pearl Gold dance disc (3031) on the turntable
    rows.append(place_box(GOLD, 16, 32, yt_top, '3031', 0.0))
    # Tile the 4 corners of the turntable disc with curved tiles (25269) leaving (16, 33) and (19, 34) studded for the Two Tumblers
    tumbler_1 = (16, 33)
    tumbler_2 = (19, 34)
    for ti in range(16, 20):
        for tk in range(32, 36):
            if (ti, tk) in (tumbler_1, tumbler_2):
                continue
            if (ti in (16, 19)) and (tk in (32, 35)):
                rows.append(put_curve(GOLD, ti, tk, yt_top + P, '25269',
                                      1 if ti >= 18 else -1, 1 if tk >= 34 else -1))
            else:
                rows.append(place_box(SILVER if (ti + tk) % 2 == 0 else GOLD, ti, tk, yt_top + P, '3070b', 0.0))

    # The Two Tumblers (κυβιστητῆρε δύω) whirling in the midst on the revolving turntable
    rows += shield_fig(
        'character.laodamas', 'laodamas',
        {'hips': GOLD, 'legs': CLOTH_WHITE, 'torso': ('973', GOLD), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': ('98138', GOLD), 'held.l': ('98138', GOLD)},
        (tumbler_1[0] + 0.5) * S, yt_top + P, (tumbler_1[1] + 0.5) * S, rot=math.pi * 0.85, contact=True
    )
    rows += shield_fig(
        'character.euryalus', 'euryalus',
        {'hips': GOLD, 'legs': CLOTH_WHITE, 'torso': ('973', GOLD), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': ('98138', SILVER), 'held.l': ('98138', SILVER)},
        (tumbler_2[0] + 0.5) * S, yt_top + P, (tumbler_2[1] + 0.5) * S, rot=-math.pi * 0.85, contact=True
    )

    # ── 5. Primary Focal Moment: Youths & Maidens Dancing Wrist-in-Wrist around the Choros ──
    # Maidens wear fine white linen (CLOTH_WHITE = 15) and golden wreaths (crown: 98138 in GOLD);
    # Youths wear glistening tunics (CLOTH_TAN / CLOTH_DTAN) with silver belts (hips: SILVER) and golden daggers (3847 in GOLD).
    dancer_specs = [
        # Pair 1 (North-West): Maiden (12, 32) & Youth (13, 32)
        ((12, 32), 'character.nausicaa', 'nausicaa',
         {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_WHITE,
          'crown': ('98138', GOLD), 'held.r': None, 'held.l': None}, math.pi * 0.90),
        ((13, 32), 'character.telemachus', 'telemachus',
         {'hips': SILVER, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_TAN), 'arms': CLOTH_WHITE,
          'headgear': None, 'held.r': ('3847', GOLD), 'held.l': None}, math.pi * 0.85),
        # Pair 2 (North-East): Maiden (21, 31) & Youth (22, 31)
        ((21, 31), 'character.helen', 'helen',
         {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_WHITE,
          'crown': ('98138', GOLD), 'held.r': None, 'held.l': None}, math.pi * 0.80),
        ((22, 31), 'character.menelaus', 'menelaus',
         {'hips': SILVER, 'legs': CLOTH_DTAN, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_TAN,
          'headgear': None, 'held.r': ('3847', GOLD), 'held.l': None}, math.pi * 0.75),
        # Pair 3 (South-West): Maiden (12, 36) & Youth (13, 36)
        ((12, 36), 'ensemble.wedding-household', 'maid-3',
         {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_WHITE,
          'crown': ('98138', GOLD), 'held.r': None, 'held.l': None}, -math.pi * 0.75),
        ((13, 36), 'character.odysseus', 'odysseus',
         {'hips': SILVER, 'legs': CLOTH_TAN, 'torso': ('973', CLOTH_DRED), 'arms': CLOTH_TAN,
          'headgear': None, 'held.r': ('3847', GOLD), 'held.l': None}, -math.pi * 0.70),
    ]
    for (di, dk), card, sub, spec, drot in dancer_specs:
        rows += shield_fig(
            card, sub, spec,
            (di + 0.5) * S, y_top[(di, dk)], (dk + 0.5) * S, rot=drot, contact=True
        )

    # ── 6. Spectators & Bard Standing Round the Lovely Dance Taking Joy Therein ──
    rows += shield_fig(
        'character.demodocus', 'demodocus',
        {'hips': CLOTH_DRED, 'legs': CLOTH_DRED, 'torso': ('973', CLOTH_WHITE), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('3959', GOLD), 'held.l': None},
        (33 + 0.5) * S, y_top[(33, 18)], (18 + 0.5) * S, rot=math.pi * 0.80
    )
    rows += shield_fig(
        'character.alcinous', 'alcinous',
        {'hips': CLOTH_RB, 'legs': CLOTH_RB, 'torso': ('973', BRONZE), 'arms': CLOTH_TAN,
         'headgear': None, 'held.r': ('95049', GOLD), 'held.l': None},
        (35 + 0.5) * S, y_top[(35, 4)], (4 + 0.5) * S, rot=math.pi * 0.85
    )
    rows += shield_fig(
        'character.arete', 'arete',
        {'hips': CLOTH_WHITE, 'legs': CLOTH_WHITE, 'torso': ('973', CLOTH_DTAN), 'arms': CLOTH_WHITE,
         'headgear': None, 'held.r': None, 'held.l': None},
        (38 + 0.5) * S, y_top[(38, 8)], (8 + 0.5) * S, rot=math.pi * 0.85
    )

    return rows


if __name__ == '__main__':
    m8_rows = build_m8()
    n_alone = write('set.shield-m8', 'Shield of Achilles — M8: The Choros Dance Floor of Daedalus', m8_rows)
    n_frame = write('set.shield-m8-on-frame', 'Shield of Achilles — M8 on Frame', build_frame(['m8']) + m8_rows)
    print(f'set.shield-m8: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m8')
    check('set.shield-m8-on-frame')
