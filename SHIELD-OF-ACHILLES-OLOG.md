# Shield of Achilles · Operative LDraw Worldtext & HOMER × MENTO Studio

## I. Operative Ekphrasis: From Imagetext to Worldtext in LEGO/LDraw

Grounded in Jay David Bolter & Watson Hartsoe’s *Operative Ekphrasis: From Imagetext to Worldtext* and modeled on the LDraw assembly pipeline of *The Odyssey* (`odyssey-forage.html` / `tools/odyssey-forage.js`), **The Shield of Achilles** (*Iliad* XVIII, 478–608) is realized here as a self-contained, navigable **3D LEGO/LDraw Worldtext**.

Where traditional ekphrasis uses verbal description to evoke a mental image in the listener, and generative prompting produces an *imagetext*, an **operative worldtext** compiles Homer’s verses into an inhabitable, rule-governed 3D world with a **Vision Model**, a **Memory Model**, and a **Controller**:

1. **Vision Model (Hephaestus’s Five-Metal & Niello Surface)**:
   - **Gold (`χρυσός`, LDraw `297, 14, 46`)**: Ares & Pallas Athena in divine scale, Unwearied Sun, Constellations, Two Talents of Gold in the Agora, Royal Sceptres, Golden Vines, Golden Herdsmen, Unploughed Glebe, Lofty-Horned Oxen.
   - **Silver (`ἄργυρος`, LDraw `179, 47`)**: Shield Baldric (`τελαμών`), Full Moon, Vineyard Props (`κάμακες`), Youths’ Sword-Belts, Herald Staves, Silver-Footed Thetis.
   - **Bronze & Copper (`χαλκός`, LDraw `28, 70, 84, 19`)**: Five Structural Folds (`πέντε πτύχες`), Armor of the Two Armies, Brazen Spears, Ploughshares, Cauldron Tripods.
   - **Tin (`κασσίτερος`, LDraw `71, 15`)**: Vineyard Fence (`ἕρκος κασσιτέροιο`), Tin Oxen, Polished Stone Circle of the Elders (`ξεστοῖσι λίθοισι`), Triple Glittering Rim (`ἄντυξ τρίπλαξ`).
   - **Kyanos Enamel (`κύανος`, LDraw `272, 33, 1`)**: Dark-Blue Vineyard Trench (`κυανέη κάπετος`), Night Sky Vault, Murmuring River, and the River Oceanus Rim.
   - **Blackened Glebe (`μελαίνετο`, LDraw `0, 308`)**: Thrice-Ploughed Furrow turning black behind the plough (`χρυσείη περ ἐοῦσα`), Black Grape Clusters.
   - **Blood-Crimson & Wine-Dark (`δαφοινεός`, LDraw `320, 4, 22`)**: Blood-crimsoned cloak of Destructive Fate (`Κήρ`), Sweet Wine at the Headland, Royal Chiton of the Harvest King.

2. **Memory Model (Homeric Temporal & Procedural Invariants)**:
   - **Zone I (`18.478–490`)**: The Bear (`Ἄρκτος / Ἄμαξα`) revolves around the celestial pole watching Orion and alone never bathes in the waters of Oceanus (`οἴη δ᾽ ἄμμορός ἐστι λοετρῶν Ὠκεανοῖο`).
   - **Zone II (`18.491–508`)**: Bridal torch processions whirl through the street while in the Agora Elders sit on polished stones in the Sacred Circle (`ἱερῷ ἐνὶ κύκλῳ`) and rise in turn holding herald staves to adjudicate the blood-price (`ποινή`) for two talents of gold.
   - **Zone III (`18.509–540`)**: Ares and Pallas Athena lead the ambush in **tall, golden divine scale (`καλὼ καὶ μεγάλω`, 1.6× brick-built figure height)** while mortal warriors are smaller (`οἱ δ᾽ ὑπὸλίζονες ἦσαν`); Eris, Kydoimos, and crimson-cloaked Ker drag the slain by the feet at the river watering-place.
   - **Zone IV (`18.541–572`)**: As ploughmen reach the headland (`τέλσον ἀρούρης`) and receive a goblet of sweet wine, the golden earth turns marvelously black (`μελαίνετο`) behind their ploughs; the Silent King (`βασιλεύς`) rejoices at his staff while reapers, sheaf-binders, and oak-tree sacrificers labor; youths and maidens gather black grapes along the single path through the kyanos trench and tin fence to the boy’s Linus song.
   - **Zone V (`18.573–589`)**: Two terrible lions seize a bellowing bull among the gold-and-tin oxen while four golden herdsmen urge on nine swift dogs that bark close by yet dart back (`ὑλάοντές τε καὶ ἐκτὸς ἀλυσκάζοντες`), refusing to bite.
   - **Zone VI (`18.590–608`)**: Youths with golden daggers on silver belts and garlanded maidens spin like a potter’s trial wheel (`τροχὸν ἄρμενον ἐν παλάμῃσιν`) and counter-march in rows around two spinning tumblers (`κυβιστητῆρε`), all enclosed by the mighty River Oceanus (`ποταμοῖο μέγα σθένος Ὠκεανοῖο`).

3. **Controller (Previs Choreography, Concentric Radar & Studio Bridge)**:
   - **63 Audited LDraw Cards** (`12,462` pieces, `411` sub-builds, `72,122` stud joints, `78` pre-bundled part packs, `63 GREEN / 0 YELLOW / 0 RED`):
     - `ACH-WORLD-SHIELD`: Master 84×84-stud 5-Fold Concentric Shield of Achilles (`3,735` pieces).
     - `12` Directed Scene Cards (`ACH-Z01-S01` through `ACH-Z06-S01`) with multi-shot Previs timelines (`achilles/previs/<id>.json`).
     - `50` Reusable Forge Kit Asset Cards (`location`, `character`, `divine_fx`, `ensemble`, `creature`, `prop`, `set_piece`, `environment`, `sound_source`).

### Files & Surfaces
- Generator: [`tools/achilles-forage.js`](tools/achilles-forage.js) (`node tools/achilles-forage.js`)
- 3D Worldtext Forage & Previs Explorer: [`achilles-forage.html`](achilles-forage.html)
- Hephaestus’s Forge Kit & Metallurgy Catalog: [`achilles-kit.html`](achilles-kit.html)
- Studio Shell (Worldtext + Forge Kit + Swiss/Frank/Courage/Weaver/Were/Master/Mento): [`shield-of-achilles.html`](shield-of-achilles.html)
- Markdown & JSON Indexes: [`achilles/FORAGE.md`](achilles/FORAGE.md), [`achilles/forage.json`](achilles/forage.json), [`achilles/kit.json`](achilles/kit.json)

---

## II. Lineage: Shield of Achilles · HOMER × MENTO Shell

**Shield of Achilles** (`shield-of-achilles.html`) is also the **HOMER-derived studio shell** that:

- Mounts **`Worldtext`** (`achilles-forage.html`) and **`Forge Kit`** (`achilles-kit.html`) as the primary entry tabs.
- Keeps the full **Swiss / Frank / Courage / Weaver / Were / Master** chain.
- Docks the **MENTO v8 camera surface** (`mento-373.html`) in the `Mento` tab.
- Relays `achilles-load-mpd` messages from `achilles-forage.html` ("⚡ Send to Studio") directly into **Courage**, **Weaver**, **Were**, **Master**, and **Mento**, automatically docking Courage side-by-side with the Worldtext explorer in `MULTI` mode.

### From HOMER Studio

HOMER (see `HOMER-STUDIO-OLOG.md`) is a TRUBADOR shell that:

- Docks:
  - SWISS Designator.
  - WAG FRANK (Homer-tuned wrapper).
  - COURAGE.
  - Unified Ontology Weaver.
  - WAG WERE.
  - WAG MASTER.
  - Momento / Mento capture panel.
- Bridges GOLD / MPD between Courage, Weaver, Were, and Master.

### From MENTO v8 (368 / 369 / 373)

The MENTO v8 surfaces (`mento-368.html`, `mento-369.html`, `mento-373.html`) are **standalone camera and capture instruments**:

- Own their own Three.js scene and MPD/GLB loader.
- Parse `!MENTO SHOT` manifests into structured shot objects.
- Provide a sculptural camera path editor and deterministic capture timing.
- Receive `studio-load-gold-into-mento` messages whenever a Shield of Achilles card is broadcast from `achilles-forage.html` or Courage.
