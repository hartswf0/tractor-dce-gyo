#!/usr/bin/env python3
"""tools/forage/product/kits/shield_m9.py — Section M9: The Great Strength of the River Ocean (Iliad XVIII.607-608).

  python3 tools/forage/product/kits/shield_m9.py
    -> odyssey/cards/set.shield-m9.mpd
    -> odyssey/cards/set.shield-m9-on-frame.mpd

Homer's moment:
  "And on it he set the great strength of the River Ocean, around the uttermost rim of the strongly-made shield."
"""
import math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shield_frame import *


def build_m9():
    sec = 'm9'
    rows = []

    # 1. Two-layer cross-bonded plate base on CELLS['m9'] at SEAT['m9'] = 4
    rows += section_base(sec, col0=BLK, col1=KYANOS)

    # 2. Eight rhythmic Ocean swells (Okeanos) flowing around the uttermost circular rim in Dark Blue (272),
    #    Pearl Silver (179), and Trans-Clear (47), with curved corner tiles on every inner and outer arc.
    def h_fn(i, k):
        bi, bk = i // 2, k // 2
        theta = math.atan2(2 * bk + 1.0, 2 * bi + 1.0)
        wave = math.cos(8.0 * theta)
        if wave > 0.35:
            return 2   # Crested silver & trans-clear Ocean swell
        if wave > -0.35:
            return 1   # Flowing Dark Blue current
        return 0       # Deep Kyanos Ocean trough

    def col_fn(i, k, lv):
        bi, bk = i // 2, k // 2
        if lv >= 2:
            return TCLEAR if (bi + bk) % 3 == 0 else SILVER
        if lv == 1:
            return KYANOS if (bi + bk) % 4 != 0 else SILVER
        return KYANOS

    t_rows, _ = terrace_form(sec, h_fn, col_fn, keep_top_studs=set())
    rows += t_rows
    return rows


if __name__ == '__main__':
    m9_rows = build_m9()
    n_alone = write('set.shield-m9', 'Shield of Achilles — M9: The Great Strength of the River Ocean', m9_rows)
    n_frame = write('set.shield-m9-on-frame', 'Shield of Achilles — M9 on Frame', build_frame(['m9']) + m9_rows)
    print(f'set.shield-m9: {n_alone} pieces alone; {n_frame} pieces on frame')
    check('set.shield-m9')
    check('set.shield-m9-on-frame')
