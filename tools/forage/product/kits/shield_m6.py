#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m6.py — Section M6: The Herd of Gold & Tin and the Two Terrible Lions (Iliad XVIII.573-586).

  python3 tools/forage/product/kits/shield_m6.py
    -> odyssey/cards/set.shield-m6.mpd
    -> odyssey/cards/set.shield-m6-on-frame.mpd

Homer's moment:
  "On it he made a herd of straight-horned cattle: and the cattle were wrought of gold and of tin, and with lowing
   they hurried from the dung-yard to pasture beside a sounding river, beside the waving reed. And golden herdsmen
   walked beside the cattle, four in number, and nine dogs swift of foot followed them. But two terrible lions among
   the foremost cattle were holding a loud-bellowing bull, and he, bellowing mightily, was dragged away, and the dogs
   and the young men followed after him... while the dogs shrank from biting the lions, but stood very near and
   barked and sprang aside."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m6():
    sec = 'm6'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m6'] at SEAT['m6'] = 20
    rows += section_base(sec, col0=BLK, col1=DB)

    # 2. Sculpted terrain (defined on 2x2 blocks bi=i//2, bk=k//2 so every 2x2 animal footprint is 100% level):
    # - North-West Dung-Yard Gate (bk <= -5, i.e. k <= -9): rises to h=2..3
    # - Cattle Drive Trail (-4 <= bk <= 7, i.e. -8 <= k <= 15): h=1 in Dark Brown & Bronze
    # - Sounding River & Waving Reed-Bed (8 <= bk <= 11, i.e. 16 <= k <= 23): h=0 stream in Dark Blue, Silver & Trans-Clear
    # - Southern Pasture Knoll where the Two Lions seize the Bellowing Bull (bk >= 15, i.e. k >= 30): h=2
    def h_fn(i, k):
        bi, bk = i // 2, k // 2
        if bk <= -5:
            return 3 if bk <= -7 else 2
        if 8 <= bk <= 11:
            return 0   # Sounding river channel
        if bk >= 15 and bi >= -11:
            return 2   # Southern pasture knoll of the Lion Attack
        return 1

    def col_fn(i, k, lv):
        bi, bk = i // 2, k // 2
        if 8 <= bk <= 11 and lv == 0:
            if bk in (9, 10):
                return TCLEAR if bi % 2 == 0 else SILVER
            return KYANOS
        if bk <= -5:
            return BRONZE if lv >= 3 else DB
        if bk >= 15 and bi >= -11:
            return BRONZE if lv >= 2 else DB
        return DB if bk <= 7 else BRONZE

    # Even-aligned 2x2 footprints for the Bull, the Two Terrible Lions, and the Cattle of Gold and Tin
    bull_pad   = (-10, 36)
    lion_1_pad = (-6,  34)
    lion_2_pad = (-14, 34)
    cow_1_pad  = (-40, -8)   # Gold cow hastening from dung-yard
    cow_2_pad  = (-38, 0)    # Tin cow hastening toward river
    cow_3_pad  = (-38, 8)    # Gold cow approaching river reed-bed

    animal_2x2_cells = set()
    for (i0, k0) in (bull_pad, lion_1_pad, lion_2_pad, cow_1_pad, cow_2_pad, cow_3_pad):
        for da in (0, 1):
            for db in (0, 1):
                animal_2x2_cells.add((i0 + da, k0 + db))

    # Nine swift dogs (1x1 footprints) — fanned in a wide arc barking & shrinking back from the lions
    dog_cells = [
        (-16, 32), (-17, 36), (-19, 30),
        (-21, 34), (-23, 28), (-25, 32),
        (-29, 26), (-35, 13), (-36, 4),
    ]

    # Four Golden Herdsmen (Iliad XVIII.577: χρύσειοι δὲ νομῆες ἅμ’ ἐστιχόωντο βόεσσι τέσσαρες)
    herdsmen_cells = [
        (-18, 33),   # Foremost herdsman cheering on the hounds against the lions
        (-22, 31),   # Second herdsman brandishing golden staff
        (-27, 28),   # Third herdsman hastening past the river bank
        (-36, -3),   # Fourth herdsman driving the cattle of gold and tin from the dung-yard
    ]

    # Waving reeds along the sounding river (k in 16..24) & Dung-yard gate posts (k = -15)
    reed_cells = [(-37, 16), (-33, 17), (-35, 22), (-31, 23), (-27, 24)]
    gate_posts = [(-39, -15), (-35, -15)]

    keep = (
        animal_2x2_cells | set(dog_cells) | set(herdsmen_cells)
        | set(reed_cells) | set(gate_posts)
    )

    t_rows, y_top = terrace_form(sec, h_fn, col_fn, keep_top_studs=keep)
    rows += t_rows

    # ── 3. Dung-Yard Gate Posts (North-West) & Waving Reed-Bed by the Sounding River ──
    for gi, gk in gate_posts:
        yg = y_top[(gi, gk)]
        rows.append(on(DB,     (gi + 0.5) * S, yg,         (gk + 0.5) * S, '3062b'))
        rows.append(on(BRONZE, (gi + 0.5) * S, yg + B,     (gk + 0.5) * S, '3062b'))
        rows.append(on(GOLD,   (gi + 0.5) * S, yg + 2 * B, (gk + 0.5) * S, '98138'))

    for idx_r, (ri, rk) in enumerate(reed_cells):
        if (ri, rk) in y_top:
            yr = y_top[(ri, rk)]
            rcol = GOLD if idx_r % 2 == 0 else DB
            rows.append(on(DB,   (ri + 0.5) * S, yr,         (rk + 0.5) * S, '3062b'))
            rows.append(on(rcol, (ri + 0.5) * S, yr + B,     (rk + 0.5) * S, '3062b'))
            rows.append(on(GOLD, (ri + 0.5) * S, yr + 2 * B, (rk + 0.5) * S, '98138'))

    # ── 4. The Herd of Straight-Horned Cattle Wrought of Gold (297) and Tin (80) ──
    rows += cow_on(GOLD, SILVER, cow_1_pad[0], cow_1_pad[1], y_top[cow_1_pad], rot=math.pi, base_col=DB)
    rows += cow_on(TIN,  GOLD,   cow_2_pad[0], cow_2_pad[1], y_top[cow_2_pad], rot=math.pi, base_col=DB)
    rows += cow_on(GOLD, SILVER, cow_3_pad[0], cow_3_pad[1], y_top[cow_3_pad], rot=math.pi * 0.90, base_col=DB)

    # ── 5. Primary Focal Moment: Two Terrible Lions Holding the Loud-Bellowing Bull ──
    # The Bellowing Bull at (-10, 36) facing South-West while the Two Terrible Lions leap from (-6, 34) and (-14, 34)
    rows += cow_on(BRONZE, GOLD, bull_pad[0],   bull_pad[1],   y_top[bull_pad],   rot=math.pi * 0.88,  base_col=BLK)
    rows += lion_on(GOLD,        lion_1_pad[0], lion_1_pad[1], y_top[lion_1_pad], rot=math.pi * 0.65,  base_col=BLK)
    rows += lion_on(BRONZE,      lion_2_pad[0], lion_2_pad[1], y_top[lion_2_pad], rot=-math.pi * 0.65, base_col=BLK)

    # ── 6. Nine Swift Dogs Barking and Shrinking Back from the Lions ──
    dog_Palette = [SILVER, TIN, BRONZE, GOLD, SILVER, TIN, BRONZE, SILVER, TIN]
    for idx_d, (di, dk) in enumerate(dog_cells):
        dcol = dog_Palette[idx_d % len(dog_Palette)]
        drot = -math.pi * 0.65 if dk >= 24 else math.pi * 0.90
        rows += dog_on(dcol, di, dk, y_top[(di, dk)], rot=drot, base_col=DB)

    # ── 7. Four Golden Herdsmen Walking Beside the Herd & Cheering on the Dogs ──
    herdsmen_cards = [
        ('character.odysseus-restored', 'odysseus-restored', -math.pi * 0.68),
        ('character.menelaus',          'menelaus',          -math.pi * 0.62),
        ('character.telemachus',        'telemachus',        -math.pi * 0.75),
        ('character.euryalus',          'euryalus',           math.pi * 0.92),
    ]
    for (hi, hk), (card, sub, hrot) in zip(herdsmen_cells, herdsmen_cards):
        rows += shield_fig(
            card, sub,
            {'hips': GOLD, 'legs': GOLD, 'torso': ('973', GOLD), 'arms': GOLD,
             'head': ('3626bp01', GOLD), 'headgear': None,
             'held.r': ('95049', GOLD), 'held.l': None, 'neck': None, 'beard': None},
            (hi + 0.5) * S, y_top[(hi, hk)], (hk + 0.5) * S, rot=hrot
        )

    return rows


if __name__ == '__main__':
    m6_rows = build_m6()
    n_alone = write('set.shield-m6', 'Shield of Achilles — M6: Herd of Gold & Tin and the Two Lions', m6_rows)
    n_frame = write('set.shield-m6-on-frame', 'Shield of Achilles — M6 on Frame', build_frame(['m6']) + m6_rows)
    print(f'set.shield-m6: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m6')
    check('set.shield-m6-on-frame')
