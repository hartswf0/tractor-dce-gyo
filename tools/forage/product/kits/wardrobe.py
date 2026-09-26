#!/usr/bin/env python3
"""tools/forage/product/kits/wardrobe.py — THE WARDROBE (Odyssey I-XXIV), a Library kit of the Odyssey line.

  python3 tools/forage/product/kits/wardrobe.py            -> odyssey/cards/set.wardrobe-{ithaca,gods,voyage}.mpd, odyssey/kits/wardrobe/kit.json

The cast as the film has them (odyssey/cards/character.*, ensemble.*) beside the same figures re-dressed from the Late Bronze Age
evidence by tools/forage/product/wardrobe.py (see odyssey/kits/wardrobe/COSTUMES.md). Each card is a line-up on a framed baseplate
(48 x 32 for the household and for the voyage, 32 x 32 for the gods), laid like the painted floor of the Pylos megaron in squares of
tan and dark tan with the hearth in red and yellow at its middle. Every figure stands on a Mycenaean column: a red shaft of round
bricks, a black round cushion and a square abacus. The figure as cast stands on a black abacus, the same figure dressed on a gold one
to its right; the rows step up toward the back one brick a row so that every figure shows over the row in front.
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


def lineup(name, title, roster, per_row, wide=False):
    """roster: [(label, card, sub, costume)]: a line-up of before-and-after pairs on a framed base, 32 x 32 or (wide) 48 x 32.
    A pair: the figure as cast on a black abacus, two studs of air, the figure dressed on a gold abacus; a stud between pairs."""
    W_ = 48 if wide else 32
    x0 = -W_ * S // 2
    if wide: rows = [put(TAN, x0 + 320, BASE, 0, '3811'), put(TAN, x0 + 640 + 160, BASE, 0, '3857', RY(math.pi / 2))]
    else: rows = [put(TAN, 0, BASE, 0, '3811')]
    fr, ring = frame(x0, -320, W_, 32, BASE)
    rows += fr
    n_rows = math.ceil(len(roster) / per_row)
    D = 30 // n_rows
    pitch = 7
    I0 = round(x0 / S)
    used = set(ring)
    for r in range(n_rows):
        batch = roster[r * per_row:(r + 1) * per_row]
        width = len(batch) * pitch - 1
        i0 = I0 + 1 + (W_ - 2 - width) // 2
        k0 = -16 + 31 - r * D - 3                                   # the plinth's back row: one stud of floor in front of it
        for n, (label, card, sub, costume) in enumerate(batch):
            ib = i0 + pitch * (len(batch) - 1 - n)             # the renderer shows +x on the left: the roster reads left to right
            for dx, cap, dressed in ((4, BLK, False), (0, GOLD, True)):
                i = ib + dx
                x, z = (i + 1) * S, (k0 + 1.5) * S
                if dressed: f = lambda top, x=x, z=z, card=card, sub=sub, costume=costume: W.dress(card, sub, costume, x, top, z, math.pi)
                else: f = lambda top, x=x, z=z, card=card, sub=sub: figure(card, sub, x, top, z, math.pi)
                rows += stand(i, k0, r + 1, cap, f)
                used |= {(i + a, k0 + b) for a in (0, 1) for b in (0, 1)}
    # the floor: the painted squares of the Pylos megaron, 4 x 4 studs each, tan and dark tan, the hearth in red and yellow
    cells = {(i, k) for i in range(I0, I0 + W_) for k in range(-16, 16)} - used
    mid = (W_ // 8 - 1, 3)

    def colour_of(i, k):
        a, b = (i - I0) // 4, (k + 16) // 4
        if a in (mid[0], mid[0] + 1) and b in (3, 4): return RED if (i + k) % 2 == 0 else YELLOW
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
    ('Alcinous', 'character.alcinous', 'alcinous', 'alcinous'),
    ('Arete', 'character.arete', 'arete', 'arete'),
    ('A Phaeacian sailor', 'ensemble.phaeacian-sailors', 'sailor-1', 'phaeacian'),
    ('Helen', 'character.helen', 'helen', 'helen'),
    ('Menelaus', 'character.menelaus', 'menelaus', 'menelaus'),
]
CARDS_ = [('set.wardrobe-ithaca', 'THE WARDROBE: ITHACA, the household and the suitors', ITHACA, 5, True),
          ('set.wardrobe-gods', 'THE WARDROBE: the Olympians and the guises of Athena', GODS, 4, False),
          ('set.wardrobe-voyage', "THE WARDROBE: Odysseus's guises, the crew, the nymphs, the Phaeacians and the hosts of Sparta", VOYAGE, 5, True)]


HALFWORLD = ['odysseus', 'odysseus-as-trojan-beggar', 'odysseus-as-old-beggar', 'odysseus-as-beggar', 'odysseus-revealed', 'odysseus-restored',
             'penelope', 'penelope-at-the-loom', 'telemachus', 'eurycleia', 'laertes', 'laertes-restored', 'eumaeus', 'philoetius',
             'melanthius', 'melantho', 'antinous', 'eurymachus', 'amphinomus', 'zeus', 'poseidon', 'athena', 'athena-as-mentes',
             'athena-as-mentor', 'athena-as-herald', 'athena-as-pitcher-girl', 'athena-as-shepherd', 'hermes', 'hermes-as-young-man',
             'hermes-psychopomp', 'calypso', 'circe', 'nausicaa', 'alcinous', 'arete', 'helen', 'menelaus']


def record():
    n = {c: pieces(c) for c, *_ in CARDS_}
    manifest('wardrobe', title='The Wardrobe', book='I-XXIV', tier='Library',
             moment="The cast of the Odyssey line as the film has them, each beside the same figure re-dressed from the Late Bronze Age "
                    "evidence: the palace frescoes of Pylos, Mycenae and Tiryns, the Dendra panoply, the shaft-grave gold, and Homer's own "
                    "descriptions of cloak, robe, veil, rags and arms.",
             quote='"She threw about him a foul rag of a cloak and a tunic, tattered, filthy, black with smoke, and over them the great '
                   'hide of a swift deer, worn bald; and she gave him a staff and a wretched wallet full of holes, with a twisted cord '
                   'to hang it by." (Odyssey XIII 434-438, translated for this kit)',
             object="The costume spec: tools/forage/product/wardrobe.py dress(card, sub, costume, x, yup, z, rot) places a cast figure "
                    "exactly as kitlib.figure does and swaps what it wears and holds by role (gown, kilt, torso, cloak, helmet, held "
                    "things), without touching the card; COSTUMES holds a spec for every principal.",
             builds=[{'card': 'set.wardrobe-ithaca', 'title': 'Ithaca: the household and the suitors'},
                     {'card': 'set.wardrobe-gods', 'title': 'The Olympians and the guises of Athena'},
                     {'card': 'set.wardrobe-voyage', 'title': "Odysseus's guises, the crew, the nymphs, the Phaeacians, and Sparta"}],
             images=[{'file': 'hero.jpg', 'caption': "The voyage line-up: Odysseus in five guises at the front (the king at war in a boar's-tusk "
                      "helmet and bronze corslet, the Trojan beggar, Athena's old beggar with his pera, the archer on the threshold, the "
                      "man restored in his purple cloak), the crew, the nymphs and the Phaeacians behind, the hosts of Sparta at the back.",
                      'alt': 'Thirty minifigures on red round-brick columns in three stepped rows on a floor of tan and dark tan tiles, each '
                             'figure as cast on a black capital beside the same figure re-dressed on a gold one.'},
                     {'file': 'odysseus.jpg', 'caption': "Odysseus's guises: each figure as cast (black abacus) and as dressed (gold abacus).",
                      'alt': 'Close view of the front row: bearded minifigures in red studded armour beside the same figures in a white '
                             'banded helmet and gold breastplate, in rags and torn cloaks with a satchel, in a white tunic with a quiver, and in a '
                             'white robe with a purple cloak.'},
                     {'file': 'ithaca.jpg', 'caption': 'Ithaca: Penelope veiled and at the loom, Telemachus, Eurycleia, Laertes in the orchard '
                      'and restored, the herdsmen and the maids at the front and middle; the suitors, long-haired and cloaked, at the back.',
                      'alt': 'Thirty minifigures in three stepped rows on red columns, women in long gowns with tiered skirts, men in short '
                             'kilts and cloaks.'},
                     {'file': 'household.jpg', 'caption': 'The household close: Penelope in her veil and at the loom in the flounced court '
                      'dress, Telemachus with his bronze spear, Eurycleia in her kerchief, Laertes with his gloves, leggings and goatskin cap.',
                      'alt': 'Close view of a row of minifigure pairs: a woman in a white hood and dark blue gown, a woman in a purple '
                             'bodice and tiered skirt, a young man in white with a red cloak and a spear, an old woman in a kerchief and '
                             'apron, an old man in a brown cap and patched tunic.'},
                     {'file': 'gods.jpg', 'caption': 'The Olympians and the guises of Athena and Hermes.',
                      'alt': 'Twenty-two minifigures on red columns: crowned bearded gods, a goddess in a banded helmet with an oval shield, a '
                             'messenger in a gold winged cap, and the same goddess as a bearded captain, an elder, a herald, a girl and a shepherd.'},
                     {'file': 'olympians.jpg', 'caption': "Zeus in the long robe and purple mantle, Poseidon bare-chested with the trident, "
                      "Athena as the Mycenae warrior goddess in the boar's-tusk helmet with the aegis and a figure-eight shield, Hermes in "
                      "the winged cap.",
                      'alt': 'Close view of the front row of gods, each beside its re-dressed double.'}],
             features=['Nothing in the cast is edited: dress() reads the card as kitlib.figure does and substitutes parts by role at placement, '
                       'so the film and the other kits keep their figures.',
                       "Women wear the court dress of the frescoes: a gown to the feet (36036) under a tiered flounce in a second colour "
                       "(18200c01), an open gold-bordered or bead-necklace bodice; queens and old women the long robe and veil.",
                       'Men wear the short kilt (600880c01) over bare legs printed with sandals (3816cpn4 / 3817cpn4); kings and elders the '
                       'long robe pinned at one shoulder (973pmc) and a cloak (50231c01) in purple, red or saffron.',
                       "Arms from the graves and the poem: the boar's-tusk helmet (60751 in white), the Dendra corslet (2587 in pearl gold), "
                       "the figure-eight shield (2586), bronze spears; things new to a hand are set in its grip, learned from the cast's cards.",
                       "Homer's costume objects: the beggar's rags, bald deer hide and pera on its cord; Laertes's gloves, leggings and "
                       "goatskin cap; the purple cloak of the restored king; Hermes's winged cap and golden wand; the moly.",
                       'Each line-up stands on Mycenaean columns (red round-brick shafts, black cushion, square abacus: black for the figure '
                       'as cast, gold for the dressed) over a floor of painted squares with the hearth at its middle, framed and named.'],
             subs=[{'file': 'ithaca.jpg', 'title': 'Ithaca', 'pieces': n['set.wardrobe-ithaca'],
                    'text': '15 pairs on 48 x 32: Penelope (twice), Telemachus, Eurycleia, Laertes (twice), Eumaeus, Philoetius, Melantho, '
                            'Melanthius, two maids, Antinous, Eurymachus, Amphinomus.'},
                   {'file': 'gods.jpg', 'title': 'The gods', 'pieces': n['set.wardrobe-gods'],
                    'text': '11 pairs on 32 x 32: Zeus, Poseidon, Athena, Hermes; Athena as Mentes, Mentor, the herald, the pitcher girl, '
                            'the shepherd; Hermes psychopomp and as a young man.'},
                   {'file': 'hero.jpg', 'title': 'The voyage', 'pieces': n['set.wardrobe-voyage'],
                    'text': "15 pairs on 48 x 32: Odysseus's five guises, an oarsman and a fighting man, Calypso, Circe, Nausicaa, Alcinous, "
                            'Arete, a Phaeacian, Helen, Menelaus.'}],
             sources=[f'assets/character/{c}.mjs' for c in HALFWORLD],
             status='Built to the bar',
             next=['Printed torsos cannot be matched to a Mycenaean bodice or corslet; the nearest prints stand in, and their printed colours '
                   'do not change with the base colour (see COSTUMES.md, section 4).',
                   'Several specs change a head or lay a beard piece over a printed beard where the card disagrees with the poem (Laertes, '
                   'Menelaus, Athena as Mentes): those are new parts for those figures, not the card.',
                   'Cloth parts in pearl gold (the aegis) and many of the chosen cloth colours were never produced as real elements.',
                   'There is no figure-eight shield part and no golden sandal; 2586 and the reddish-brown sandal print stand in.',
                   "Held things the cards place away from the hand (the bows of the Odysseus cards) are kept where the card has them; "
                   "from the hero angle a bow of a figure as cast crosses in front of its dressed neighbour.",
                   'Figures are not checked by the click checker: every figure stands with its feet on the two front studs of its abacus, '
                   'and every gown (36036) is checked and clicks on its abacus.',
                   'Not yet dressed: the ensembles in bulk (every suitor, every sailor), the shades of the dead, the Cyclopes and the '
                   'monsters; and the tower shield (30166) is in the grip table but on no one.'])


if __name__ == '__main__':
    only = sys.argv[1:]
    for name, title, roster, per, wide in CARDS_:
        if only and name not in only: continue
        n = lineup(name, title, roster, per, wide)
        print(name, n, 'pieces'); check(name)
    if not only: record()
