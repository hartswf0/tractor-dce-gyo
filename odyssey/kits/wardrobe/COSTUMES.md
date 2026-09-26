# The Wardrobe: costumes for the cast of the Odyssey line

A guide to dressing the line's minifigures from the Late Bronze Age (Mycenaean) evidence, and to the real LEGO parts and colours that
carry it. The cast's cards (`odyssey/cards/character.*.mpd`, `ensemble.*.mpd`) are used by the film and the kits as they are and are
never edited: a costume is applied at placement time by `tools/forage/product/wardrobe.py` (`dress(card, sub, costume, x, yup, z, rot)`,
the same placement as `kitlib.figure`), and every costume below is a spec in its `COSTUMES` table. Every part named here exists in
`ldraw/parts`; the part descriptions quoted are the first lines of those files.

Run `python3 tools/forage/product/wardrobe.py survey` for the cast as it stands: every principal's parts, colours and descriptions.

## 1. What the evidence gives us

The poem was composed centuries after the palaces fell, and it mixes periods; the line dresses its cast from the palace age the poem
remembers (Late Helladic III, the 14th and 13th centuries BC), and uses Homer's own words where he describes a garment.

**Women.** The processional frescoes of the palaces (the women bearing offerings at Pylos, Tiryns and Thebes, the "Mycenaean lady"
of the Cult Centre at Mycenae) show one court dress: a close short-sleeved bodice, open at the front and edged with a bright border,
over a full skirt to the ankles, often in horizontal tiers or flounces of different colours; a belt at a narrow waist; necklaces of
beads; long hair dressed in locks and a knot or bound with a fillet. Older women and women at work wear a plain long robe. Homer's
words: the **peplos** (the women's pinned robe), the **pharos** (a great robe of linen: Calypso and Circe put on "a great silver-white
pharos, fine and lovely, and a golden belt about the waist, and a veil upon the head", V 230-232, X 543-545), the **kredemnon** (veil:
Penelope "holding her shining veil before her cheeks", I 334), the **zone** (belt).

**Men.** Warriors and working men in the frescoes (the battle scene of the Pylos hall, the hunters of Tiryns, the Warrior Vase from
Mycenae) wear a short tunic or kilt to above the knee, bare legs, sandals or leggings, and in war greaves ("the well-greaved
Achaeans"). Kings and elders wear the long robe to the feet: the lyre-player of the Pylos throne room sits in a long robe. The
Achaeans are "long-haired" (*karē komoōntes*). Homer's words: the **chiton** (tunic), the **chlaina** (a thick woollen cloak, often
purple, pinned at the shoulder), the **pharos**, the **chlamys** (a short travelling cloak, later usage), the **peronē** (brooch).
Odysseus describes his own king's dress as the beggar in XIX 225-235: "a thick purple cloak, double, and on it a brooch of gold
with twin sheaths", and a shining tunic "like the skin of a dried onion".

**Arms.** The **boar's-tusk helmet**: rows of split tusk plates on a leather cap, found in many graves and shown on frescoes and
ivories, and described by Homer when Meriones lends one to Odysseus himself (Iliad X 261-265). The **bronze corslet** of the Dendra
tomb (c. 1400 BC): a breastplate and backplate, great shoulder plates and bands for a skirt. The **figure-eight shield** and the
**tower shield** of ox-hide (both on the inlaid Lion Hunt dagger from Grave Circle A at Mycenae; Ajax's shield "like a tower",
Iliad VII 219); the figure-eight shield behind the goddess of the painted plaque from Mycenae, who wears a boar's-tusk helmet.
Bronze spears, long swords, bows.

**Colours.** Dyed wool and linen: saffron (Dawn is *krokopeplos*, "saffron-robed"), purple and red (Homer's *porphyreos*,
*phoinikoeis*), white linen, and the blues, reds and yellows of the fresco painters; gold for the rich (the gold of the shaft
graves, sewn discs and diadems, and Homer's golden brooches, belts and sandals).

**Costume objects in the poem.** The beggar's kit Athena gives Odysseus (XIII 434-438): a vile cloak and tunic, torn, filthy, black
with smoke, over them the great hide of a deer worn bald, a staff, and a wretched **pera** (wallet) full of holes on a twisted cord.
Laertes in his orchard (XXIV 227-231): a dirty patched tunic, stitched ox-hide leggings against the scratches, gloves against the
thorns, a goatskin cap. Hermes (V 44-49): the golden immortal sandals that carry him over sea and land, and the wand (*rhabdos*)
with which he charms men's eyes to sleep (also XXIV 2-4). Athena's **aegis**, the fringed goatskin she raises from the roof of the
hall (XXII 297).

## 2. The parts that carry it

| Idea | Part (ldraw/parts) | Used for |
|---|---|---|
| long gown / robe to the feet | 36036 Minifig Hips and Skirt (replaces hips and legs) | queens, goddesses, kings, elders |
| flounced skirt | 18200c01 Minifig Skirt 1.5L Fringed with Stepped Edge, over 36036 in a second colour | the court dress of the frescoes |
| short kilt / tunic hem | 600880c01 Minifig Skirt 1.1L with Straight Bottom | men at work and war |
| ragged hem | 14295c01 Minifig Skirt 1.5L Fringed | beggars, Laertes; a longer chiton |
| pointed hem | 16820c01 Minifig Skirt 0.7L with 11 Diamond Points | Hermes |
| bare legs and sandals | 3816cpn4 / 3817cpn4 Leg with Reddish Brown Sandals, in Yellow | every bare-legged man |
| loincloth | 3815bpq1 Hips with Gold X-Belt and Decorated Loincloth, 3816cpq1 / 3817cpq1 | Poseidon |
| chiton | 973p3y Torso with Shirt with Open Collar and Wrinkles | men, Hermes, the herald |
| robe pinned at the shoulder | 973pmc Torso with Robe Gather Lines, Wrinkles and Clasp at Right Shoulder | kings, the restored |
| open bodice, gold border | 973p0w Torso with Female Gold Trim and Gold Belt | nymphs, princesses |
| bead necklace bodice | 973pd13 Torso with Dress and Red Beads Necklace | maids, Melantho |
| apron | 973p88 Torso with Dress, White Apron and Red Beads Necklace | Eurycleia, loyal maids |
| veiled queen | 973p5e Torso with Gold Dress and Veil Top | Penelope |
| queen's robe | 973pmd Torso with Female Robe, Center Panel with Silver Spots and Pendant | Arete |
| goddess's collar | 973pc2g Torso with Gold Collar with Blue Jewel, White Belt with Gold Cord | Athena |
| bare chest | 973pbi Torso with Muscles and Gold Belt, in Yellow | Poseidon |
| rags and pera | 973p4v Torso with Dark Brown Collar, Patch, Rope Belt and Pouch | the old beggar, Laertes |
| leather jerkin | 973p4i Torso with Studded Leather Tunic and Belt | Mentes, Melanthius |
| cloak (chlaina, pharos, chlamys) | 50231c01 Minifig Cape Cloth (formed) | kings, heroes, gods |
| torn cloak / bald deer hide | 86038c01 Minifig Cape Cloth with Holes and Tattered Edges | the beggars |
| aegis | 38301c01 Minifig Cape Cloth Scalloped 6 Points | Athena |
| boar's-tusk helmet | 60751 Minifig Helmet with Cheek Protection and Thin Bands, in White | Odysseus, Athena, the crew |
| Dendra corslet | 2587 Minifig Armour Plate, in Pearl Gold | Odysseus, the crew |
| the pera on its cord | 61976 Minifig Satchel | the old beggar |
| figure-eight shield (nearest) | 2586 Minifig Shield Ovoid | Athena, the crew |
| tower shield (nearest) | 30166 Minifig Shield Rectangular 2 x 3 with Bent Sides | available in `grip()`, not yet used |
| bronze spear | 4497 Minifig Spear with Round End, in Pearl Gold | |
| bow and quiver | 4499 Minifig Bow with Arrow, 4498 Minifig Arrow Quiver | Odysseus |
| Hermes's wand | 36752a Minifig Tool Wand, in Pearl Gold | Hermes, Calypso's golden shuttle |
| winged cap (petasos) | 60747 Minifig Helmet Cap with Wings, in Pearl Gold | Hermes |
| moly | 24855c01 Plant Flower Stem with Bar and 3 Flowers, white flowers | Hermes on the road |
| trident, thunderbolt | 92290 Minifig Weapon Trident; 27256 Minifig Lightning Bolt | Poseidon; Zeus (the card's own) |
| herald's staff | 95049 Minifig Staff with Spherical End | Athena as herald, the kings |
| veil, kerchief | 30381 Minifig Hood; 4505a Minifig Hood Medieval Cowl | Penelope; Eurycleia |
| fillet, crown | 33322 Minifig Crown Tiara; 39262 Minifig Crown with 5 Points (the cards') | Helen, Arete; Zeus, Alcinous |
| wreath, long hair | 11264 Hair Short with Laurel Wreath; 11255 Hair Long with Curls; 40251 Hair Long Wavy; 40239 Hair Long Straight; 88283 Hair Mid-Length Tousled; 20595 Hair Long Tousled; 93562 Hair Female with Top Knot Bun and Forelock; 13251 Hair Female with Elaborate Knot Bun | |

Colours (LDraw codes): White 15, Red 4, Dark Red 320, Bright Light Orange 191 (saffron), Magenta 26 and Purple 22 (purple), Dark Blue 272
and Sand Blue 379, Dark Turquoise 3, Tan 19, Dark Tan 28, Medium Nougat 84, Reddish Brown 70, Dark Brown 308, Olive Green 330, Dark
Green 288, Pearl Gold 297 (gold and bronze), Yellow 14 (skin, as the cast has it).

## 3. The principals

Each entry gives the scene states, what the figure should wear in each, and the spec that realises it (`COSTUMES['name']`). "Card"
means the figure as cast. The line-ups in `odyssey/cards/set.wardrobe-*.mpd` show every spec beside the figure it dresses.

### Odysseus
| State | Should wear | Spec | Parts |
|---|---|---|---|
| king at war and at sea (IX-XII, the Cyclops, Circe, the Sirens) | short kilt, bare legs and sandals, bronze corslet over the tunic, boar's-tusk helmet; bow and sword | `odysseus` | card torso 973p45 in Dark Red under 2587 Pearl Gold; 600880c01 Dark Red; 3816cpn4/3817cpn4; 60751 White; card's bow and sword |
| the Trojan beggar of Helen's tale (IV 244-250) | his own face and dark curls, rags of a slave, a torn rag of a cloak, a sack | `odysseus-as-trojan-beggar` | head 3626bp88, hair 3901 Dark Brown, beard piece off; 973p4v Dark Tan; 14295c01 and 86038c01 Dark Brown; card's staff and sack |
| Athena's old beggar (XIII-XXII) | rags black with smoke, the bald deer hide, staff, the pera on its twisted cord | `odysseus-as-old-beggar` (and `odysseus-as-beggar`) | 973p4v Dark Tan; 14295c01 Dark Brown; 86038c01 Medium Nougat (the hide); 61976 Reddish Brown; card's staff; the card's sack taken away (the pera replaces it) |
| revealed on the threshold (XXII 1-7) | rags stripped: the tunic, the quiver on his back, the great bow | `odysseus-revealed` | 973p3y White; 600880c01 White; 4498 Reddish Brown at the neck; card's bow and sword; the cape taken off |
| restored, bathed and anointed (VI 224-235, XXIII 153-163) | a fresh tunic and the purple double cloak with its gold brooch; unarmed | `odysseus-restored` (and `odysseus-king`) | 973pmc White (the clasp at the shoulder is the brooch); 14295c01 White; 50231c01 Magenta; weapons taken away |

### The household of Ithaca
| Figure | State | Should wear | Spec | Parts |
|---|---|---|---|---|
| Penelope | the queen in grief (I, XVIII, XIX, XXIII) | long robe, the veil drawn over her head | `penelope` | 973p5e Dark Blue; 36036 Dark Blue; 30381 White; the card's goblet taken away |
| Penelope | at the loom (II 93-110, XIX 137-156) | the court dress: open gold-edged bodice, flounced skirt; a wooden pin-beater | `penelope-at-the-loom` | 973p0w Purple; 36036 White under 18200c01 Purple; 36752a Reddish Brown |
| Telemachus | the prince at the assembly and on his voyage (II, III, IV) | white chiton and kilt, red cloak, long hair, bronze spear | `telemachus` | 973p3y White; 600880c01 White; sandals; 50231c01 Red; 88283 Dark Brown; 4497 Pearl Gold |
| Eurycleia | the old nurse (II, XIX, XXII, XXIII) | long dark dress, apron, kerchief | `eurycleia` | 973p88 Dark Tan; 36036 Dark Tan; 4505a White |
| Laertes | in the orchard (XXIV 226-231) | patched tunic, ox-hide leggings, gloves, goatskin cap | `laertes` | head 3626bp8m (white-bearded); 973p4v Dark Tan; 14295c01 Dark Tan; legs Reddish Brown (leggings); hands Reddish Brown (gloves); 27059 Medium Nougat; the card's cape off |
| Laertes | restored (XXIV 365-371) and fighting (XXIV 516-525) | bathed, the long robe and a fine cloak, white hair; the spear he throws | `laertes-restored` | head 3626bp8m; 3901 White; 973pmc White; 36036 White; 50231c01 Dark Red; 4497 Pearl Gold |
| Eumaeus | the swineherd (XIV-XVII) | a tunic, a hide cloak, sandals he cut himself (XIV 23), his staff | `eumaeus` | 973p3y Tan; 600880c01 Tan; sandals; 50231c01 Reddish Brown; card's staff |
| Philoetius | the cowherd (XX-XXII) | sun-bleached tunic, bare shins, a dark cloak, the goad | `philoetius` | 973p3y White; 600880c01 White; sandals; 50231c01 Dark Green; card's goad |
| Melanthius | the goatherd (XVII, XXII) | leather jerkin, short kilt, his cape | `melanthius` | 973p4i Reddish Brown; 600880c01 Dark Brown; sandals |
| Melantho | the favoured maid (XVIII 321-336) | a flounced gift-gown she was never given for work | `melantho` | 973pd13 Bright Light Orange; 36036 Red under 18200c01 Bright Light Orange |
| the maids | at work; the disloyal (XXII) | bead-necklace bodice over a long skirt; the loyal in aprons | `maid`, `maid-loyal` | 973pd13 White and 36036 Bright Light Orange; 973p88 Tan and 36036 Dark Tan |

### The suitors
| Figure | Should wear | Spec | Parts |
|---|---|---|---|
| Antinous | the ringleader: red tunic and kilt, purple cloak, long black curls; the cup he is shot drinking from (XXII 8-21) | `antinous` | 973p1p Red; 600880c01 Red; sandals; 50231c01 Purple; 11255 Black; card's cup in Pearl Gold |
| Eurymachus | moneyed: the long robe and a saffron mantle | `eurymachus` | 973p3l Magenta; 36036 Magenta; 50231c01 Bright Light Orange; 20595 Dark Brown |
| Amphinomus | the decent suitor: blue tunic, white cloak | `amphinomus` | 973p1p Dark Blue; 600880c01 Dark Blue; sandals; 50231c01 White; 11255 Dark Brown |
| any suitor | kilt, sandals, a saffron cloak, long hair over the card's own torso | `suitor` | 600880c01 Red; sandals; 50231c01 Bright Light Orange; 40251 Dark Brown |

### The gods and Athena's guises
| Figure | Should wear | Spec | Parts |
|---|---|---|---|
| Zeus | the long robe pinned at the shoulder, a purple mantle; the card's crown, beard and thunderbolt | `zeus` | 973pmc White; 36036 White; 50231c01 Purple |
| Poseidon | bare-chested, the gold-belted loincloth, a sea-green mantle, the trident | `poseidon` | 973pbi Yellow; 3815bpq1 / 3816cpq1 / 3817cpq1 Yellow; 50231c01 Dark Turquoise; 92290 Pearl Gold |
| Athena | as the goddess of the Mycenae painted plaque: white peplos, boar's-tusk helmet, the fringed aegis, figure-eight shield, spear | `athena` | 973pc2g White; 36036 White; 60751 White; 38301c01 Pearl Gold; 2586 White; 4497 Pearl Gold |
| Athena as Mentes (I) | a dark-bearded Taphian captain: leather jerkin, kilt, travelling cloak, bronze spear | `athena-as-mentes` | head 3626bpq5; 3901 Black; beard piece off; 973p4i Reddish Brown; 600880c01; sandals; 50231c01 Dark Orange; 4497 |
| Athena as Mentor (II, III, XXII, XXIV) | the elder: a long robe of blue-grey, a dark cloak, a wooden staff | `athena-as-mentor` | 973pmc Sand Blue; 36036 Sand Blue; 50231c01 Dark Blue; the card's staff in Reddish Brown |
| Athena as herald (VIII) | a short tunic, herald's cloak, olive wreath, the knobbed staff | `athena-as-herald` | 11264 Dark Brown; 973p3y White; 600880c01 Bright Light Orange; 50231c01 Red; 95049 Pearl Gold; the card's shield away |
| Athena as the pitcher girl (VII) | a short belted dress, bare legs, short hair, a clay pitcher | `athena-as-pitcher-girl` | 973pq6 White; 600880c01 White; sandals; 62711 Dark Brown; the card's goblet in Dark Orange |
| Athena as shepherd (XIII) | a herd-boy's tunic, cloak thrown back, a staff | `athena-as-shepherd` | 973p3y Tan; 600880c01 Tan; 50231c01 Olive Green; 88283 Dark Brown; 3957a Reddish Brown |
| Hermes (V) | short chiton with a pointed hem, a saffron chlamys, sandals, the winged cap, the golden wand | `hermes` | 973p3y White; 16820c01 White; sandals; 60747 Pearl Gold; 50231c01 Bright Light Orange; card's 36752a Pearl Gold |
| Hermes psychopomp (XXIV) | the same body, a dark cloak for the road to the dead, the golden wand | `hermes-psychopomp` | as `hermes`, 50231c01 Dark Blue |
| Hermes as a young man (X) | no divine tells; the moly, black root and milk-white flower | `hermes-as-young-man` | 973p3y White; 600880c01 White; 88283 Dark Brown; 50231c01 Bright Light Orange; 24855c01 White |

### The voyage: nymphs, Phaeacians, crew, Sparta
| Figure | Should wear | Spec | Parts |
|---|---|---|---|
| Calypso | at the parting (V 230-232): the great silver-white robe, golden belt; the golden shuttle (V 62) | `calypso` | 973p0w White; 36036 White under 18200c01 Dark Turquoise; 36752a Pearl Gold |
| Calypso | at the loom in her cave | `calypso-at-the-loom` | 973p5c Dark Turquoise; 36036 Dark Turquoise under 18200c01 White |
| Circe | the singing host (X 220-223): the court dress in red and saffron, auburn hair, wand and cup (the card's) | `circe` | 973p0w Dark Red; 36036 Bright Light Orange under 18200c01 Dark Red; 13251 Dark Orange |
| Nausicaa | at the washing places and the ball game (VI) | `nausicaa` | 973p0w White; 36036 White under 18200c01 Bright Light Orange; 93562 Dark Brown; the card's broom taken away |
| Alcinous | king: the long robe, a red cloak, the card's crown and sceptre | `alcinous` | 973pmc White; 36036 White; 50231c01 Red |
| Arete | queen: robe over gown, iron-grey hair, a gold fillet | `arete` | 973pmd Dark Blue; 36036 Dark Blue under 18200c01 Red; 13251 Light Bluish Grey; 33322 Pearl Gold |
| a Phaeacian | seafarers: saffron tunic, azure kilt, long hair | `phaeacian` | 973p3y Bright Light Orange; 600880c01 Dark Azure; sandals; 40251 Black |
| an oarsman | a white tunic, tan kilt, bare legs | `crew` | 973p3y White; 600880c01 Tan; legs Yellow; card's oar |
| a fighting man of the crew | the Dendra panoply: tusk helmet, bronze corslet, kilt, spear and figure-eight shield | `crew-warrior` | 60751 White; 2587 Pearl Gold; 973p3y White; 600880c01 White; sandals; 4497; 2586 White |
| Helen | Sparta (IV): the court dress, long hair and a gold fillet; the cup she drugs with nepenthe (the card's) | `helen` | 973p0w Magenta; 36036 White under 18200c01 Magenta; 40239 Dark Brown; 33322 Pearl Gold |
| Menelaus | the fair-haired (xanthos) king: a saffron robe, purple cloak, a wreath for his circlet, a fair beard over the card's dark one | `menelaus` | 973pmc Bright Light Orange; 36036 Bright Light Orange; 50231c01 Purple; 11264 Tan; beard piece Tan |

## 4. What the parts cannot do

- **Printed torsos are what they are.** No LEGO torso prints a Mycenaean bodice or a Dendra corslet; the chosen prints are the nearest
  (open gold border, bead necklace, a robe pinned at one shoulder, patched rags with a pouch). Their printed colours cannot change,
  only the base colour: a gold border stays gold, a shirt's grey wrinkles stay grey. Some cards' heads carry printed faces that
  disagree with the poem (Laertes restored and Menelaus are cast with a black beard; Athena as Mentes with Mentor's white beard);
  the specs change the head (3626bp8m, 3626bpq5) or lay a beard piece over it, which is a new part for that figure, not the card's.
- **Cloth in metallic colours** (the aegis in Pearl Gold) and 18200c01 in most colours have not been produced as real elements; the
  specs are colour-true to the evidence, not to what can be bought.
- **No figure-eight shield.** 2586 (ovoid) stands for it; 30166 is the nearest tower shield.
- **No golden sandals.** The sandal legs are printed Reddish Brown; Hermes's gold is in his cap and wand.
- **Layering.** The flounce (18200c01) over the gown (36036) and the kilt over the legs are drawn as they would sit on a real
  figure, but the renderer does not test cloth against plastic; where a cloak meets a satchel or a quiver at the neck both are real
  neck pieces, and a real figure takes two only with care.
- **Held things** are put in the hand by the grip the cast's own cards use (`wardrobe.grip`); things the card already holds stay where
  the card put them, and some of those (the bows, the Mentor staff) are held away from the hand in the cards themselves.
