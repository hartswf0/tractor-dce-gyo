#!/usr/bin/env python3
"""tools/forage/product/kits/wardrobe.py — THE WARDROBE (Odyssey I-XXIV), a Library kit of the Odyssey line.

  python3 tools/forage/product/kits/wardrobe.py            -> odyssey/cards/set.wardrobe-{ithaca,gods,voyage}.mpd, odyssey/kits/wardrobe/kit.json

The cast as the film has them (odyssey/cards/character.*, ensemble.*) beside the same figures re-dressed from the Late Bronze Age
evidence by tools/forage/product/wardrobe.py (see odyssey/kits/wardrobe/COSTUMES.md). Each card is a line-up on a framed 32 x 32
baseplate, laid like the painted floor of the Pylos megaron: every figure stands on a Mycenaean column (a red shaft of round bricks,
a black round cushion and a square abacus on top), the figure as cast on a black abacus, the same figure dressed on a gold one beside
it. The rows step up toward the back, one brick a row, and are staggered so that every figure shows between the ones in front.
The cards in odyssey/cards are only read, never written.
"""
import math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
from kitlib import *
from sculpt import Form, S, P, B, TILES
import wardrobe as W

PACK = Form()
BASE = 4                        # the baseplate's top
FLOOR = BASE + P                # the floor tiles' top


def column(i, k, height, cap):
    """a Mycenaean column on the 2 x 2 studs whose back-left cell is (i, k): `height` round bricks of red shaft, a black round
    cushion, a square abacus of colour `cap`; returns (rows, the abacus top)"""
    x, z = (i + 1) * S, (k + 1) * S
    rows = [put(RED, x, BASE + B * (n + 1), z, '3941') for n in range(height)]
    top = BASE + B * height
    rows.append(put(BLK, x, top + P, z, '4032'))
    rows.append(put(cap, x, top + 2 * P, z, '3022'))
    return rows, top + 2 * P


def stand(i, k, height, cap, fig_rows):
    """a column and a figure on its front row of studs, facing the viewer; a 1 x 2 tile on the back row unless a gown covers it"""
    rows, top = column(i, k, height, cap)
    rows += fig_rows(top)
    if not any(r.endswith(' 36036.dat') or r.endswith(' 24068.dat') for r in rows):
        rows.append(put(cap, (i + 1) * S, top + P, (k + 0.5) * S, '3069b'))
    return rows


def lineup(name, title, roster, per_row):
    """roster: [(label, card, sub, costume)]: a line-up of before-and-after pairs on a framed 32 x 32 base"""
    rows = [put(TAN, 0, BASE, 0, '3811')]
    fr, ring = frame(-320, -320, 32, 32, BASE)
    rows += fr
    n_rows = math.ceil(len(roster) / per_row)
    D = 30 // n_rows
    used = set(ring)
    for r in range(n_rows):
        batch = roster[r * per_row:(r + 1) * per_row]
        width = len(batch) * 6 - 1
        i0 = -15 + (30 - (per_row * 6 - 1 + 3)) // 2 + (3 if r % 2 else 0)   # alternate rows shifted half a pitch
        k0 = -16 + 31 - r * D - 3                                   # the plinth's back row: one stud of floor in front of it
        for n, (label, card, sub, costume) in enumerate(batch):
            ib = i0 + 6 * (len(batch) - 1 - n)             # the renderer shows +x on the left: the roster reads left to right
            for dx, cap, dressed in ((3, BLK, False), (0, GOLD, True)):
                i = ib + dx
                x, z = (i + 1) * S, (k0 + 1.5) * S
                if dressed: f = lambda top, x=x, z=z, card=card, sub=sub, costume=costume: W.dress(card, sub, costume, x, top, z, math.pi)
                else: f = lambda top, x=x, z=z, card=card, sub=sub: figure(card, sub, x, top, z, math.pi)
                rows += stand(i, k0, r + 1, cap, f)
                used |= {(i + a, k0 + b) for a in (0, 1) for b in (0, 1)}
    # the floor: the painted squares of the Pylos megaron, 4 x 4 studs each, tan and dark tan, a red square at the hearth's place
    cells = {(i, k) for i in range(-16, 16) for k in range(-16, 16)} - used

    def colour_of(i, k):
        a, b = (i + 16) // 4, (k + 16) // 4
        if (a, b) in ((3, 3), (4, 3), (3, 4), (4, 4)): return RED if (i + k) % 2 == 0 else YELLOW   # the hearth, in the middle
        return TAN if (a + b) % 2 == 0 else DTAN
    PACK._pack(rows, cells, FLOOR, colour_of, False, TILES)
    return write(name, title, rows)


ITHACA = [
    ('Penelope', 'character.penelope', 'penelope', 'penelope'),
    ('Penelope at the loom', 'character.penelope-at-the-loom', 'penelope-at-the-loom', 'penelope-at-the-loom'),
    ('Telemachus', 'character.telemachus', 'telemachus', 'telemachus'),
    ('Eurycleia', 'character.eurycleia', 'eurycleia', 'eurycleia'),
    ('Laertes', 'character.laertes', 'laertes', 'laertes'),
    ('Laertes restored', 'character.laertes-restored', 'laertes-restored', 'laertes-restored'),
    ('Eumaeus', 'character.eumaeus', 'eumaeus', 'eumaeus'),
    ('Philoetius', 'character.philoetius', 'philoetius', 'philoetius'),
    ('Melantho', 'character.melantho', 'melantho', 'melantho'),
    ('Melanthius', 'character.melanthius', 'melanthius', 'melanthius'),
    ('A loyal maid', 'ensemble.loyal-maids', 'maid-1', 'maid-loyal'),
    ('A disloyal maid', 'ensemble.disloyal-maids', 'maid-2', 'maid'),
    ('Antinous', 'character.antinous', 'antinous', 'antinous'),
    ('Eurymachus', 'character.eurymachus', 'eurymachus', 'eurymachus'),
    ('Amphinomus', 'character.amphinomus', 'amphinomus', 'amphinomus'),
    ('A suitor', 'ensemble.suitors', 'suitor-2', 'suitor'),
]
GODS = [
    ('Zeus', 'character.zeus', 'zeus', 'zeus'),
    ('Poseidon', 'character.poseidon', 'poseidon', 'poseidon'),
    ('Athena', 'character.athena', 'athena', 'athena'),
    ('Hermes', 'character.hermes', 'hermes', 'hermes'),
    ('Athena as Mentes', 'character.athena-as-mentes', 'athena-as-mentes', 'athena-as-mentes'),
    ('Athena as Mentor', 'character.athena-as-mentor', 'athena-as-mentor', 'athena-as-mentor'),
    ('Athena as herald', 'character.athena-as-herald', 'athena-as-herald', 'athena-as-herald'),
    ('Hermes psychopomp', 'character.hermes-psychopomp', 'hermes-psychopomp', 'hermes-psychopomp'),
    ('Athena as pitcher girl', 'character.athena-as-pitcher-girl', 'athena-as-pitcher-girl', 'athena-as-pitcher-girl'),
    ('Athena as shepherd', 'character.athena-as-shepherd', 'athena-as-shepherd', 'athena-as-shepherd'),
    ('Hermes as a young man', 'character.hermes-as-young-man', 'hermes-as-young-man', 'hermes-as-young-man'),
]
VOYAGE = [
    ('Odysseus', 'character.odysseus', 'odysseus', 'odysseus'),
    ('Odysseus, the Trojan beggar', 'character.odysseus-as-trojan-beggar', 'odysseus-as-trojan-beggar', 'odysseus-as-trojan-beggar'),
    ('Odysseus, the old beggar', 'character.odysseus-as-old-beggar', 'odysseus-as-old-beggar', 'odysseus-as-old-beggar'),
    ('Odysseus revealed', 'character.odysseus-revealed', 'odysseus-revealed', 'odysseus-revealed'),
    ('Odysseus restored', 'character.odysseus-restored', 'odysseus-restored', 'odysseus-restored'),
    ('An oarsman', 'ensemble.crew', 'sailor-3', 'crew'),
    ('A fighting man of the crew', 'ensemble.crew', 'sailor-1', 'crew-warrior'),
    ('Calypso', 'character.calypso', 'calypso', 'calypso'),
    ('Circe', 'character.circe', 'circe', 'circe'),
    ('Nausicaa', 'character.nausicaa', 'nausicaa', 'nausicaa'),
    ("Nausicaa's maid", 'ensemble.nausicaas-maids', 'maid-1', 'maid'),
    ('Alcinous', 'character.alcinous', 'alcinous', 'alcinous'),
    ('Arete', 'character.arete', 'arete', 'arete'),
    ('A Phaeacian sailor', 'ensemble.phaeacian-sailors', 'sailor-1', 'phaeacian'),
    ('Helen', 'character.helen', 'helen', 'helen'),
    ('Menelaus', 'character.menelaus', 'menelaus', 'menelaus'),
]
CARDS_ = [('set.wardrobe-ithaca', 'THE WARDROBE: ITHACA, the household and the suitors', ITHACA, 4),
          ('set.wardrobe-gods', 'THE WARDROBE: the Olympians and the guises of Athena', GODS, 4),
          ('set.wardrobe-voyage', "THE WARDROBE: Odysseus's guises, the crew, the nymphs and the Phaeacians", VOYAGE, 4)]


if __name__ == '__main__':
    only = sys.argv[1:]
    for name, title, roster, per in CARDS_:
        if only and name not in only: continue
        n = lineup(name, title, roster, per)
        print(name, n, 'pieces'); check(name)
