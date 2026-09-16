# Forage round 2 — actual geometry before hero approval

28 candidates were rendered from the recovered LDraw library at native scale, each with the same Odysseus reference. Front and reverse views are saved for all 28. This is a search of the recovered library, not a claim about every part ever made.

## Two useful advances

**Projectile/aperture:** 18041 is a compact, separate harpoon-shaped projectile: 60 LDU long, maximum radial envelope 6.75 LDU. It cannot pass the old radius-6 Technic bore. The native 3917 ring is a better aperture core. Across twelve rings, 32 circumference rays at radius 7 plus the centre ray all clear. The old lane blocks all 32 circumference rays. These are sampled clearance checks; final axe blades, fletching, release rig and swept-mesh collision testing remain open.

**Mast/binding:** the first 2537 mast fit placed a cleat in the actor’s leg space. That failed render is retained. A straight stack of ten 3941 round bricks repairs the contact zone. Six levels of actual actor/mast mesh cross-sections generate offset rope paths. Native 71149k02 braid sections follow those paths without resizing rigid parts. Both loose and secured front/rear/wide views are saved. These are six separate closed-loop samples; continuous rope length, knot, cut/removal and earplug actions remain unbuilt.

## Decisions

| Part | Decision | Evidence / reason |
|---|---|---|
| 55237a — Bar  3.2L with Bow | reject for hero bow | Arrow-free but reads as a Bionicle crossbow; grip direction and profile do not match the longbow action. |
| 55237d — Bar  4.3L with Bow Blade | reject for hero bow | Ornate blade silhouette, not a drawable longbow. |
| 55237f — Bar  4.2L with Asymmetric Bow | reject for hero bow | Asymmetric fantasy weapon; no convincing longbow/string mechanism. |
| 11090 — Bar Tube with Clip | retain connector | Useful bar-and-clip joint for a separately built bow grip; connection layout not yet tested. |
| 48729b — Bar  1.5L with Clip with Truncated Sides and Hole in Shaft | retain connector | Candidate small clip joint; keep at native scale. |
| 73590a — Hose Flexible  8.5L without Tabs | reject for visible bow limb | Large end collars and hose silhouette; keep only as a flexible-mechanism reference. |
| 87994 — Bar  3L | retain shaft gauge | 60-LDU, radius-4 bar fits old bore; no point or fletching, so not a completed arrow. |
| 27257 — Minifig Spear Tip Faceted with Bar  0.4L | reject for old bore | Faceted tip envelope radius 9.85 exceeds radius 6; large against a minifigure. |
| 53451 — Minifig Helmet Viking Horn | reject for straight arrow | Curved horn; corrected Z-axis envelope radius 9.37. Useful horn, wrong straight projectile. |
| 88695 — Bar  0.5L with Faceted Spike 1L | reject for old bore | Off-axis spike envelope radius 11.75; pointed appearance alone does not make it fit. |
| 4497 — Minifig Spear with Round End | retain spear, reject arrow | 146-LDU spear exceeds intended arrow scale and radius-6 bore. |
| 18041 — Minifig Harpoon with Smooth Bar | promote flight candidate | Separate 60-LDU harpoon-shaped projectile; radius 6.75 fails old bore and clears new ring tests. Final arrow styling/fletching unresolved. |
| 57467 — Minifig Harpoon | reserve projectile | Similar size, wider 7.96 radial envelope; 18041 gives more clearance. |
| 65611 — Minifig Hand Harpoon | reject arrow assembly | Integrated hand/wrist geometry; not a clean independent arrow. |
| 3813 — Bar Pointed  1.1L with Towball | reject arrow assembly | Towball survives as a conspicuous 16-LDU ball; not a credible arrow tip. |
| 37777c01 — Minifig Torso Half Giant with Arms | reject for colossal Cyclops | Half-giant coat torso, 85 LDU tall as a part; clothing and proportions poorly match a colossal unclothed cave giant. |
| 79435 — Minifig Head  2 x  2 x  1.333 Giant | retain head reference | 38×36×38 LDU head; useful neutral proportions but insufficient by itself for the colossal rig. |
| 60671 — Figure Troll Body (Complete) | retain rig reference only | Body shortcut, NOT a complete figure: head and arms still needed. Fixed armoured anatomy also constrains collapse and groping. |
| 14769p01 — Tile  2 x  2 Round with Round Underside Stud and Black Eye Pattern | promote graphic eye option | 40-LDU bold single-eye tile, readable at distance; select only after giant head blocking. |
| 67095px1 — Tile  3 x  3 Round with Brown Eye Pattern | promote detailed eye option | 60-LDU brown-eye tile for closer shots; requires a built head and eye-contact target. |
| 3917 — Ring  2 x  2 with Stud Holder | promote aperture core | Native ring with stud holder. Twelve cores clear 32 radius-7 perimeter probes plus centre. Axe blades/overall silhouette still missing. |
| 30340 — Minifig Life Ring | reserve ring | Life-preserver silhouette and mounting features are less suitable than 3917; not selected for the new lane. |
| 4289 — Boat Mast  2 x  2 | reserve mast fitting | Short mast segment; not enough height on its own for binding and ship staging. |
| 2537 — Boat Mast  2 x  2 x 13 & 3/4 Middle | reject at binding height | Cleat intersects actor leg space in first fit test. Keep as a whole-ship mast reference or place fittings clear of actor contacts. |
| 4844b — Boat Mast Base  4 x  4 x  9 with Top Notches | reserve mast base | Large base mounting candidate; needs integration into the ship deck. |
| 76065 — String Braided 21L with End Studs and Minifig Grips | promote handling reference | 416-LDU braided string with actual minifig grip sections. Useful for hauling/handoffs, but straight default geometry is not an actor lashing. |
| 56823k04 — ~String Thin Twisted  0.6 mm Diameter - Straight  8.25 LDU Long | promote fine cord option | 8.25-LDU native flexible section, about 2.11 LDU thick; candidate for finer string detail. |
| 71149k02 — ~String Braided Segment | promote binding section | 6×3×3 LDU flexible braid section. Used at native scale around measured actor/mast cross-sections. |

## Corrections and next builds

- 60671’s “Complete” means a complete body shortcut, not a complete Cyclops. It contains no finished head or arms. A dedicated articulated giant remains necessary.
- The Viking horn’s profile is measured around its native Z connector axis, not Y. This corrected measurement is retained in the receipt.
- The 55237 bow family avoids a molded arrow but its silhouette is still inappropriate for this hero. Forage availability does not overrule production design.
- Promote 3917 to the next axe-head assembly test, 18041 as a flight candidate, 71149k02 for visible binding, and 56823k04 for finer string detail.
- Next build: axe blades around the proven opening; continuous lashing with knot/tail; custom giant head/shoulder mechanism; separate longbow limbs and string.

## Reproduce

Run the bundled `serve.py`, then open `forage-round2.html`, `aperture-forage.html` or `rigging-forage.html`. The capture buttons save the rendered evidence and JSON receipts locally. The earlier films and old gauge result remain as historical passes.
