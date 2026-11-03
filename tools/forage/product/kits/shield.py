#!/usr/bin/env python3
"""tools/forage/product/kits/shield.py — Master Assembly of The Shield of Achilles (Iliad XVIII.478-608).

  python3 tools/forage/product/kits/shield.py
    -> odyssey/cards/set.shield-of-achilles.mpd
    -> odyssey/kits/shield-of-achilles/kit.json

Assembles the structural Bronze, Kyanos & Gold Frame (`shield_frame.py`) together with all ten lift-out modular
sections (`shield_m0.py` .. `shield_m9.py`), and runs the physical click & collision checker on every section
alone, on the frame, and on the complete assembled Shield of Achilles.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from shield_frame import *
from shield_m0 import build_m0
from shield_m1 import build_m1
from shield_m2 import build_m2
from shield_m3 import build_m3
from shield_m4 import build_m4
from shield_m5 import build_m5
from shield_m6 import build_m6
from shield_m7 import build_m7
from shield_m8 import build_m8
from shield_m9 import build_m9


SECTION_BUILDERS = [
    ('m0', 'M0: The Heavens on the Boss (XVIII.483-489)',           build_m0),
    ('m1', 'M1: The City at Peace (XVIII.490-508)',                 build_m1),
    ('m2', 'M2: The City at War (XVIII.509-540)',                   build_m2),
    ('m3', 'M3: Ploughing the Rich Fallow (XVIII.541-549)',         build_m3),
    ('m4', 'M4: The Royal Harvest & Feast (XVIII.550-560)',         build_m4),
    ('m5', 'M5: The Golden Vineyard & Linos Song (XVIII.561-572)',  build_m5),
    ('m6', 'M6: Herd of Gold & Tin and Two Lions (XVIII.573-586)',  build_m6),
    ('m7', 'M7: The Fair Glen of White Sheep (XVIII.587-589)',      build_m7),
    ('m8', 'M8: The Choros Dance Floor of Daedalus (XVIII.590-606)',build_m8),
    ('m9', 'M9: The Great Strength of River Ocean (XVIII.607-608)', build_m9),
]


def build_shield():
    rows = build_frame()
    sec_counts = {}
    for sec, title, fn in SECTION_BUILDERS:
        s_rows = fn()
        n_s = write(f'set.shield-{sec}', f'Shield of Achilles — {title}', s_rows)
        n_f = write(f'set.shield-{sec}-on-frame', f'Shield of Achilles — {sec.upper()} on Frame', build_frame([sec]) + s_rows)
        sec_counts[sec] = (n_s, n_f)
        rows += s_rows
    return rows, sec_counts


if __name__ == '__main__':
    frame_rows = build_frame()
    n_frame_only = write('set.shield-frame', 'Shield of Achilles — Structural Frame', frame_rows)
    print(f'set.shield-frame: {n_frame_only} pieces')
    check('set.shield-frame')

    full_rows, counts = build_shield()
    n_total = write('set.shield-of-achilles', 'The Shield of Achilles (Iliad XVIII.478-608)', full_rows)

    print('\n=== SECTION CHECK SUMMARY ===')
    for sec, title, _ in SECTION_BUILDERS:
        n_s, n_f = counts[sec]
        g_s, nc_s, cl_s = check(f'set.shield-{sec}')
        g_f, nc_f, cl_f = check(f'set.shield-{sec}-on-frame')
        print(f'  {sec.upper()}: {n_s:4d} pcs alone ({g_s:4d} grid, {nc_s} loose, {cl_s} clash) | {n_f:4d} pcs on frame ({g_f:4d} grid, {nc_f} loose, {cl_f} clash) — {title}')

    print(f'\n=== COMPLETE SHIELD OF ACHILLES ({n_total} pieces) ===')
    check('set.shield-of-achilles')

    manifest(
        'shield-of-achilles',
        number='XVIII',
        name='The Shield of Achilles',
        subtitle='Iliad XVIII.478–608 · Hephaestus’s Cosmos in Five Concentric Rings & Ten Lift-Out Kits',
        book='Iliad XVIII, 478–608',
        pieces=n_total,
        footprint='96 × 96 studs (76.8 × 76.8 cm · 4 × 4186 baseplates)',
        quote='On it he wrought the earth, the sea, the heaven, the unwearying sun, the moon at the full, and all the signs that crown the sky… and around the uttermost rim he set the great strength of the River Ocean.',
    )
