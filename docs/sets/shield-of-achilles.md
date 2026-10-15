# The Shield of Achilles: brief

Iliad XVIII.478–608. Hephaestus makes Achilles a shield of five layers, and on it the whole world: the heavens, two cities, the
farmer's year, the herds, a dance, and the river Ocean round the rim. This brief turns it into ten builds on one frame, built by the
method in `docs/sets/README.md`.

## The concept

A shield, not a diorama. It is round and convex, made of metal, and it shows the world in relief. Three things follow from that:

- **The palette is Homer's metals.** He names gold, silver, tin, bronze and kyanos (dark blue enamel), and he makes the colour do the
  work: the ploughed field is gold yet turns dark behind the plough; the vines are gold with black grapes on silver poles.
- **The form is a dome in bands.** The centre stands highest, like a shield's boss, and each ring steps down to the rim. Each band is a
  flat terrace, so a camera at minifigure height can look into a scene.
- **The figures are the relief.** People act on open ground. Dividers between scenes are low and finished, never walls.

**The mechanism.** The heavens turn: the centre stands on a turntable (`61485c01`, as on The Opening's Olympus), so the sun, moon and
stars come round. The dancers, who run "as a potter sits and tries his wheel", stand on a second turntable in the dance floor.

**Scale.** Minifigure scale, so the cast and props of the Odyssey line can be used. The shield is 96 studs across, on four 48 x 48
baseplates, about 7,000 to 8,000 pieces in ten builds. That is above the LEGO Ideas limit of 5,000, so this is a giant set in builds,
like a UCS model, and each build is held to the Ideas bar on its own.

## The palette

| Material | Homer | LDraw colour |
|---|---|---|
| Gold | the vines, Ares and Athena, the cattle, the daggers | Pearl Gold 297 |
| Silver | the vine poles, the belts | Pearl Silver 179 |
| Tin | the fence, some of the cattle, the greaves | Metallic Silver 80 |
| Bronze | the shield's body, the frame | Metallic Copper 300 |
| Kyanos | the ditch round the vineyard, the bands between scenes | Dark Blue 272 |
| Black earth | the ploughed field, the grapes | Black 0, Dark Brown 308 |
| Ocean | the rim | Dark Blue 272 with Trans-Clear and Pearl Silver |

Figures keep their own cloth colours, kept quiet: tan, white, dark tan, dark red.

## The frame

All builds import one file, `tools/forage/product/kits/shield_frame.py` (to be written first), which fixes:

- the origin: the shield's centre at stud (0, 0), the four baseplates around it;
- each band's radii in studs and its terrace height (yup, LDU above the table);
- each module's cells: the stud squares inside its ring and between its two angles;
- the dividers: one stud wide, Dark Blue tiles with Pearl Gold round tiles at the joins, built by the frame and not by the modules;
- the palette above.

| Band | Radius (studs) | Height | Modules |
|---|---|---|---|
| Boss | 0 to 10 | highest | M0 The heavens |
| Inner ring | 10 to 22 | | M1 City at peace, M2 City at war (half each) |
| Middle ring | 22 to 34 | | M3 Ploughing, M4 Harvest, M5 Vineyard (a third each) |
| Outer ring | 34 to 44 | | M6 Herd and lions, M7 Sheep in the glen, M8 Dance floor |
| Rim | 44 to 48 | lowest | M9 Ocean |

The edges of each ring are stepped stud cells finished with round corner tiles and plates, so the circle reads as a curve.

## The ten builds

Each line gives the moment, what must be there, and a piece budget. The builder writes one script per module.

**M0 The heavens** (about 450). "The earth, the heaven, the sea, the unwearied sun and the moon at the full, and all the
constellations": the Pleiades, the Hyades, Orion, and the Bear, "which alone has no part in the baths of Ocean". A raised boss: earth
and sea as two halves of the dome, a gold sun and a silver moon, the four constellations as gold round tiles on Dark Blue, the Bear
set apart from the rest. On the turntable.

**M1 The city at peace** (about 900). Two moments. A wedding: brides led from their rooms by torchlight, young men whirling in the
dance, flutes and lyres, women standing at their doors to watch. A trial in the place of assembly: two men dispute the blood-price of a
man killed, the people shout for each side, heralds hold them back, elders sit on polished stones in a sacred circle with sceptres, and
two talents of gold lie in the middle for whoever judges straightest.

**M2 The city at war** (about 900). The city is besieged by two armies. On the wall stand wives, children and old men. The army goes
out led by Ares and Pallas Athena, both in gold, "fair and great in their armour, as gods should be, far seen; and the folk at their
feet were smaller": use larger figures or raised bases for the gods. An ambush by a river where cattle come to drink; two herdsmen
playing pipes, not knowing; the fight by the river; Strife, Tumult and Fate among them, Fate dragging a dead man by the feet.

**M3 Ploughing** (about 700). A soft fallow field, broad and thrice-ploughed, ploughmen wheeling their yokes; at each turn at the
headland a man puts a cup of wine in their hands. "And the field grew black behind them, like ploughed land, though it was of gold":
gold ground ahead of the ploughs, black behind.

**M4 Harvest** (about 800). The king's land, reapers with sickles, the swathes falling in lines, three binders, boys gathering the
sheaves; the king stands silent among them with his staff, glad at heart; heralds apart under an oak preparing a feast of an ox, and
women strewing white barley.

**M5 The vineyard** (about 800). Gold vines heavy with black grapes on silver poles; round it a ditch of kyanos and a fence of tin;
one path through it, for the carriers at the vintage. Girls and youths carry the fruit in wicker baskets; among them a boy plays the
lyre and sings the Linos song, and they follow him, stamping and shouting.

**M6 The herd and the lions** (about 900). Straight-horned cattle of gold and tin hurry lowing from the yard to pasture by a sounding
river and waving reeds; four herdsmen of gold, nine swift dogs. Two lions have seized a bellowing bull at the head of the herd; the
herdsmen set on the dogs, but the dogs shy from the lions and stand close, barking. The moment is the lions on the bull.

**M7 Sheep in the glen** (about 500). A great pasture of white sheep in a lovely glen, with folds, roofed huts and pens. The quiet
build between the lions and the dance: open ground, few figures.

**M8 The dance floor** (about 900). "A dancing-floor like the one Daedalus made in broad Knossos for Ariadne." Youths and maidens dance
holding each other by the wrist; the maidens in fine linen with garlands, the youths in shirts with gold daggers on silver belts. They
run round lightly "as a potter sits and tries his wheel": the ring of dancers stands on a turntable. A crowd stands round delighting;
two tumblers whirl in the middle, leading the song.

**M9 Ocean** (about 450). "The great might of the river Ocean, round the uttermost rim of the shield." Dark Blue with Trans-Clear and
Pearl Silver, flowing all the way round, finished with curved tiles. No figures.

## Order of work

1. The frame file and a grey blockout of all ten builds on it, looked at from above and from minifigure height.
2. M2, the city at war, to the full bar: it has the most kinds of action and sets the standard.
3. M0 and M9, which finish the shape, then the rest in any order.
4. The assembly file, checked as a whole.

## What the Shield render of October 2026 teaches

Keep: the banded dome, the sea rim, the idea of scenes in their own fields.
Change: the sky goes to the centre where Homer puts it; the maze walls of random 1 x 1s become low finished dividers; the treasure
pile becomes two talents of gold on the ground of the trial; the packed crowds become a few figures each doing one thing; the gods are
set apart by size and gold; the stepped circle is finished with round tiles.
