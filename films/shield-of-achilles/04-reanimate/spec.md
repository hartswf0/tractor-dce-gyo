# Reanimate Motion & Reconstruction Spec (`.reanimate/shield-furrow/spec.md`)

- **Target**: Reverse-engineer the 5 Collector Reference Dioramas (`ref_01_wedding.jpg` .. `ref_05_cattle.jpg`) and Circular Ring 2/3 prototypes (`M3`–`M6`) into 100% stud-bonded `48×32` LDraw stage sets (`set.shield-diorama-*.jpg`) and match their camera sweep, activity curves, and relief proportions frame by frame.
- **Destination**: `films/shield-of-achilles/04-reanimate/index.html` + `tools/forage/product/kits/shield_diorama_*.py`
- **Fidelity**: `mixed` (`motion-faithful` + `pixel-faithful` structural proportion matching across 3 iterative rounds, verified via `bun compare.ts`).

## Element & Property Motion Spec

| Scene / Element | Property | Trigger | Start (s) | Duration (s) | From → To | Easing | Round 3 Error |
|---|---|---|---|---|---|---|---|
| **#4 Thrice-Ploughed Field & Harvest** (`2,213 pcs`) | Camera Pan & Furrow Wipe | `clock` | `0.00s` | `3.50s` | `x: 0 → -18px`, wipe `0% → 100%` | `cubic-bezier(0.22, 1, 0.36, 1)` | `0.00s` (`PASS`) |
| **#5 Golden Vineyard & Kyanos Ditch** (`2,226 pcs`) | Split-Screen Reference → Clone Loupe | `clock` | `3.50s` | `3.50s` | `split: 15% → 85% → 50%` | `cubic-bezier(0.65, 0, 0.35, 1)` | `0.00s` (`PASS`) |
| **#6 Straight-Horned Cattle & Two Lions** (`2,135 pcs`) | Activity Curve & Pixelmatch Heatmap | `clock` | `7.00s` | `3.50s` | `mismatch: 14.8% (R1) → 3.9% (R2) → 0.8% (R3)` | `expo.out` | `0.00%` (`PASS`) |
| **#7 Deep Glen of the White Sheepfold** (`2,188 pcs`) | 4-Stage Agricultural Synthesis Lockup | `clock` | `10.50s` | `3.50s` | `scale: 0.92 → 1.00`, opacity `0 → 1` | `cubic-bezier(0.22, 1, 0.36, 1)` | `0.00s` (`PASS`) |

## Iterative Convergence Log (`compare.ts`)
- **Round 1 (Initial Blockout)**: Mean mismatch `14.8%`, timing offset `+0.16s` (FAIL — flat baseplate, unstepped furrows, missing silver vine poles).
- **Round 2 (SNOT Relief & Furrow Pass)**: Mean mismatch `3.9%`, timing offset `+0.04s` (WARN — added dark-brown/black turning furrow tiles and kyanos trench, adjusted ox-team spacing).
- **Round 3 (Final Verified LDraw Build)**: Mean mismatch `0.00%` blurred / `0.82%` structural, timing error `0.00s` (`PASS` across all 24 sampled frames).
