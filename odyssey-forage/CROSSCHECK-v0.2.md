# ODYSSEY LDRAW FORAGE — CROSS-CHECK v0.2

Cross-check date: 2026-09-16.

This audit compares the existing `odyssey-forage/donors.json` corpus with the uploaded `ODYSSEY-REAL-LDRAW-FORAGE-v0.1` manifest and continues the geometry-first forage against the browsable `gkjohnson/ldraw-parts-library` mirror.

## Hard rule

- **GREEN**: actual downloadable LDraw geometry and no blocking caveat found in the verified source/header. For parts, official LDraw `Part`/`Shortcut` entries qualify. For models, OMR/known-good status is preferred.
- **AMBER**: actual `.mpd/.ldr/.dat` geometry exists, but OMR compliance or dependency resolution still needs validation.
- **RED**: reference only. PDFs, renders, instructions, Rebrickable pages, and photographs never count as geometry donors by themselves.

## Corpus cross-check

- Existing repo corpus: **30** MPD donors.
- Uploaded v0.1 corpus: **45** entries = **38 MPDs + 7 DAT readymades**.
- Exact normalized overlap: **13** donors.
- Uploaded-only: **32** donors/readymades.
- Existing-repo-only: **17** donors.
- Immediate deduplicated union before this new forage: **62** real-geometry entries.

### Uploaded-only additions to preserve

`6279 Skull Island`, `6278 Enchanted Island`, `6264 Forbidden Cove`, `6256 Island Catamaran`, `6245 Harbor Sentry`, `6235 Buried Treasure`, `1788 Treasure Chest`, `21318 Tree House`, `21325 Medieval Blacksmith`, `6071 Forestmen's Crossing`, `6066 Camouflaged Outpost`, `7410 Jungle River`, `9476 The Orc Forge`, `10228 Haunted House`, `10214 Tower Bridge`, `7327 Scorpion Pyramid`, `7326 Rise of the Sphinx`, `6716 Covered Wagon`, `6799 Showdown Canyon Carriage`, `6270 Forbidden Island`, `6271 Imperial Flagship`, `6277 Imperial Trading Post`, `21020 Trevi Fountain`, `7637 Farm`, plus DAT readymades `27256`, `3847`, `10169`, `10509`, `87621`, `64452`, `4429`.

### Existing-repo-only donors to preserve

`6234 Renegade's Raft`, `6259 Broadside's Brig`, `1481 Pirates Desert Island`, `6022 Horse Cart`, `6023 Maiden's Cart`, `6060 Knight's Challenge`, `383-2 Knight's Joust`, `697 Stagecoach`, `375-2 Castle`, `6041 Armor Shop`, `6049 Viking Voyager`, `6061 Siege Tower`, `6067 Guarded Inn`, `6040 Blacksmith Shop`, `6073 Knight's Castle`, `21024 Louvre`, `10276 Colosseum`.

**Conclusion: do not replace either corpus. Union them.** They are complementary: the uploaded set is much stronger on vegetation, water, interior life, direct animals, and alternative island/port worlds; the existing repo is stronger on horses/carts, small architecture, monumental public space, and secondary maritime grammars.

## Structural holes after the 62-entry union

The uploaded taxonomy exposes where the donor bank is thin. Counts in uploaded v0.1 were: `K14_CAVE = 1`, `K16_ATMOS = 1`, `K11_RITUAL = 2`, `K01_GROUND = 2`, `K10_FARM = 3`, `K18_SIGNATURE = 2`, `K06_COLUMN = 4`, `K15_ROAD = 4`. Atmosphere should mostly be scene state rather than dedicated geometry, but the others are real acquisition gaps.

### Highest-priority holes

1. **Underworld / bones / death-world grammar.** Existing architecture can make the shore, but not the material vocabulary of shades, exposed bones, burial, and ritual boundaries.
2. **Scylla / serpent / multi-neck monster anatomy.** The strait has world donors; the creature itself has almost no real reusable geometry in the donor corpus.
3. **Argos + hounds.** The Halfworld has Argos and two hounds, but v0.1 contains no dog readymade.
4. **Omen eagles / bird grammar.** The Halfworld's two omen eagles have no direct donor in v0.1.
5. **Sheep / goat grammar.** Cow, horse and pig are covered; Polyphemus's flock and Helios's sheep are not.
6. **Ritual kit.** Altar, blood pit, sacrifice, libation, offering surfaces, and funerary boundaries remain thin despite good monumental architecture.
7. **Hospitality / feast micro-kit.** Chair, footstool, basin, goblet, tables, bowls, storage vessels, bones/meat, and depleted-feast states should be indexed as reusable readymades rather than hidden inside whole buildings.
8. **Bow / axe / weapon-test kit.** Sword is covered, but the bow contest, axe lane, spear and Poseidon trident need explicit atomic geometry.
9. **Loom / lyre.** No verified direct LDraw loom or lyre was found in this pass; these remain custom-assembly targets unless a real MPD/submodel is located.
10. **Cave topology.** `Rock Island Refuge` is useful, but cave mouths, blocked thresholds, shelves and interior rock chambers still need several independent ancestors so Cyclops/Ogygia/Nymph Cave do not collapse into the same world.

## New real-geometry finds in this pass

See `new-finds-v0.2.json` for exact source paths, hashes, status and Halfworld targets.

### New MPDs

- **6232-1 Skeleton Crew.mpd** — actual multi-submodel LDraw model. Its top level explicitly calls `Island`, `Skeleton`, and `Pirate` submodels. Major Underworld/bone/shore donor.
- **6718 Raindance Ridge.mpd** — actual model with named `Ridge`, `Horse`, minifig and totem submodels. Major ground/ridge/horse decomposition donor.
- **6761-1 Bandit's Secret Hide-Out.mpd** — actual geometry. Useful for broken-rock enclosure, concealed threshold, rough shelter, secret landing/cave-edge grammar. Dependency/OMR normalization still pending.
- **6755-1 Sheriff's Lock-Up.mpd** — actual geometry but header is `Unofficial_Model`; keep AMBER. Useful barred threshold, small timber/stone interior, yard and enclosure grammar.
- **10224 Town Hall.mpd** — actual multi-level LDraw model with explicit `Level 0` through `Level 3` submodels. Useful as an extraction donor for stairs, public hall, balconies, formal circulation and multi-level decomposition, not as a stylistic Greek donor.

### New official DAT readymades

- **92586.dat — Animal Dog German Shepherd** → Argos, Two Hounds, Eumaeus dog ecology.
- **11467.dat — Animal Eagle Body (Complete)** plus poseable eagle wings `11777.dat` / `11778.dat` → Two Omen Eagles.
- **92290.dat — Minifig Weapon Trident** → Poseidon / sea-god weapon grammar.
- **43746.dat — Animal Serpent Basilisk Head** → Scylla head grammar.
- **43936p01.dat — Animal Serpent Basilisk Body Segment** → Scylla neck/body segmentation.
- **43750p01.dat — Animal Serpent Basilisk Tail/Neck S Curve** → reusable articulated Scylla neck curve.
- **28588.dat — Animal Snake Head with Open Mouth, Fangs and Curved Neck with Bar** → alternative monster head and bite geometry.
- **93231.dat — Minifig Long Bow with Arrow** → Odysseus's bow / bow contest.
- **92290.dat — trident** and **3849.dat / 98338.dat — spear grammars** → divine and warrior weapon families.
- **2343.dat / 6269.dat — Minifig Goblet variants** → hospitality, feast, libation and depletion states.

## Revised acquisition order

`HALFWORLD SCENE → WORLD MPD → SITE SUBMODEL → OBJECT SUBMODEL → OFFICIAL DAT READYMADES → CUSTOM DELTA`.

The next ingest work should therefore prioritize: (1) 6232 Skeleton Crew, (2) dog/eagle/serpent readymades, (3) 6718 Ridge/Horse submodels, (4) 6761 hide-out rock/threshold chunks, then (5) systematic hospitality/ritual parts.

## Status discipline

A browsable mirror proves that bytes exist; it does **not** by itself prove OMR compliance or that every reference resolves. New MPDs discovered only through the mirror are therefore AMBER until `ingest-mpd.mjs --ldraw <library>` resolves their type-1 graph. Official DAT files with `!LDRAW_ORG Part` or `Shortcut` and an official update are safe GREEN atomic donors.
