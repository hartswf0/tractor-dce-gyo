# MOTION.md: living illustrations in this project (`02-rossark-motion`)

> Based on `rossark0/rossark-motion-skill`. Part 1 is the canonical Rossark Motion Method; Part 2 specifies the Shield of Achilles 60fps SVG Cosmology & Automaton Rig.

---

## Part 1. The method

**The goal:** anything drawn (a character, a plant, a flame, a street, a logo, a chart) feels alive and calm. Nothing teleports, nothing bounces, nothing shouts.

### Principles
1. **Never teleport:** interpolate everything; never swap drawings.
2. **Calm by default:** strong curves, no bouncy overshoot.
3. **Small amplitudes:** when unsure, halve it.
4. **Arcs and pivots:** each moving part is a layer rotating around its joint (stem base, hinge, neck, hook).
5. **Overlap and follow-through:** tips and trailing parts move later and further; give each part the same wave with a growing phase delay.
6. **Variety without chaos:**
   - repeated items get a seeded phase, speed and size (`seeded(i)`);
   - nothing moves in sync, and there's no random value per frame.
7. **One main action per scene, plus two or three idle loops.** Side things stay quiet.
8. **Opacity only to appear or disappear.**
9. **The layout never moves:** motion lives inside the drawing.
10. **Reduced motion:** loops freeze on a good frame 0, and one-shots show their final frame.
11. **Nothing runs unseen:** pause off screen, when hidden and in the background.
12. **Enough frames:** anything under ~100 ms flickers at 30 fps; render and export at 60 fps (`data-fps="60"`). Blinks close in ~110 ms and reopen in ~190 ms with `'out'`.

### The engine (`motion.ts`)
- **Clocks:** one clock `t` (in ms) drives the entire scene (`12,000 ms` master cycle at `60 fps` = `720` frames).
- **Tracks:** keyframes `[ms, value, 'out'?]` read with `track(t, keys)`. The last key equals the first. `track` stops at every key, so use it for one move (a blink, a lid). For acting (a chain of poses), use `flow(t, keys)`, which passes through the keys without stopping and never overshoots (monotone cubic Hermite interpolation).
- **Helpers:**
  - `wave(t, period, phase)` (−1 to 1), for sway and breathing;
  - `loop(t, period, phase)` (0 to 1), for drift and falling;
  - `bell(p)`, to fade in and out;
  - `seg(t, a, b)`, for one beat of a one-shot;
  - `seeded(i)`, for per-item variety.
- **Curves:**
  - travel uses ease-in-out `bezier(0.77, 0, 0.175, 1)`;
  - open and arrive use ease-out `bezier(0.23, 1, 0.32, 1)`;
  - leaving uses ease-in `bezier(0.55, 0, 1, 0.45)`.

---

## Part 2. This project — The Clock of Hephaestus (Shield of Achilles SVG Rig)

### Where the code is
- **Platform:** Web SVG (`1920×1080` at `60 fps`), driven by the exact `rossark-motion-skill` engine (`track`, `flow`, `seg`, `wave`, `loop`, `bell`, `seeded`).
- **Art kit, characters, poses:** `films/shield-of-achilles/02-rossark-motion/index.html`
  - **Coordinate System:** `1920×1080` SVG canvas split into the **Central 5-Fold Cosmic Shield Boss (`cx=610, cy=555, R=420`)** and the **Four Living Rig Inspections (`x=1100..1860`)**:
    1. **Rig A — Hephaestus & Furnace Bellows (`Iliad 18.468–477`)**: Live `Choreo` face rig (`lookX`, `lookY`, `lid` blink at `2400 ms`, `6100 ms`, `9800 ms` with `110 ms` close / `190 ms` `'out'` reopen, `headTilt`), 2-joint hammer arm (`shoulder` + `elbow` with `90 ms` trailing follow-through `joint(t) += 0.45 * (parent(t - 90) - parent(t))`), dual-period furnace flame (`700 ms` & `1100 ms`), and rising bronze sparks (`bell(p)`).
    2. **Rig B — The Revolving Bear & Constellation Boss (`Iliad 18.483–489`)**: `Ursa Major` (`61485c01`) revolving on a continuous `loop(t, 12000)` arc around the North Star while watching Orion (`lookX/lookY` gaze tracking), never dipping into the `wave`-rippling River Oceanus rim (`24` travelling wave nodes around `r=410`).
    3. **Rig C — 1.6× Golden Ares & Athena (`Iliad 18.516–519`)**: Divine levitation rig (`wave(t, 4000)` vertical float, limp hanging feet trading knees slowly, floor shadow scaling inversely with height, 2.5D head yaw sliding eyes 10% and nose 13%).
    4. **Rig D — The Choros Potter's Wheel & Two Tumblers (`Iliad 18.590–606`)**: 8 dancers on a monotone cubic `flow(t, keys)` angular velocity curve (accelerating like a potter's wheel and gliding into counter-rotation), with 2 center tumblers executing gravity parabola hops (`lift = top * (1 - k^2)`) and volume-preserving contact squash (`width = 1 / sy^0.6`).

### The owner's rules
- **No teleporting (`0` discontinuous jumps across all 720 frames at 60 fps)**: every loop closes (`keys[last][1] === keys[0][1]`), and every periodical wave divides `12,000 ms` (`12000`, `6000`, `4000`, `3000`, `2400`, `2000`, `1500`, `1200`, `1000`, `600`).
- **Homer's palette only**: Kyanos Dark Blue (`#0b1220`, `#142238`), Pearl Gold (`#e5bd43`, `#f6d86b`), Metallic Silver (`#c8d0dc`), Metallic Copper (`#c86d44`), Obsidian (`#070b14`), and Ivory (`#f6f1e4`).

### How changes are checked
- Sampled and verified with `tools/video-skills/rossark-motion-skill/tools/track_edges.py` and `sample_colors.py`, plus contact sheet (`tools/sheet.sh`).
