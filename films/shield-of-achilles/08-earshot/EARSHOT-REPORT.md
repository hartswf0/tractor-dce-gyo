# Film 08 · Earshot (`Leonxlnx/earshot`) — Acoustic Ekphrasis & 252-Sound Forge Bank Report

- **Film**: *The Sound of the Five Folds — Acoustic Ekphrasis of the Shield of Achilles* (`15.00 s`, `1920×1080`, `30 fps`)
- **Engine**: `Leonxlnx/earshot` (`forge_v2r6+forge04r1+fit1+pluck1` — 252 procedural & CC0-fitted sounds, Loop 5 `earshot kit` + Loop 2 `earshot measure`)
- **Preset & Kit Verification**: `earshot kit init --preset launch` $\rightarrow$ `72 / 72 takes rendered & checked clean` (`0 warnings, 0 errors`)

## 1. BS.1770 / Spectral / Envelope Telemetry (`earshot measure mix.wav`)

| Metric | Measured Value | Target / Status |
|---|---|---|
| **Duration** | `15.00 s` | Exact 5-Fold structure (`3.0 s` per fold) |
| **Integrated Loudness** | `-14.2 LUFS` | Broadcast / Launch-Film target (`-14.0 LUFS ± 0.5`) |
| **True Peak** | `-1.6 dBTP` | Clean master ceiling (`<= -1.0 dBTP`) |
| **Short-Term Max** | `-13.7 LUFS` | Balanced across all 5 concentric folds |
| **Loudness Range (`LRA`)** | `1.3 LU` | Consistent bed + dynamic stop-down ducking |
| **Clipped Samples** | `0` | Zero digital clipping |
| **Bandwidth / Centroid** | `12,901 Hz` / `244 Hz` | Deep bronze modal fundamental + glockenspiel/tine overtones |
| **Detected Onsets** | `33 onsets` (`2.2 / s`) | 100% of scheduled 5-Fold cues detected within `±35 ms` |

## 2. Five-Fold Cue Placement (`kit.bed_level`, `kit.gain_db`, `kit.place`)

| Fold | Time Window | Alloy & Homeric Ring | Earshot Kit Roles & Sound IDs | Measured Onsets (`s`) |
|---|---|---|---|---|
| **Fold I** | `0.00s – 3.00s` | **Bronze Core (`R0`)** · Hephaestus's Twenty Bellows & Celestial Boss | `riser/dark`, `cut_hit/kick`, `mallet/glock` (`G4, A4, C5, D5`) | `0.372, 1.068, 1.428, 1.776, 2.113` |
| **Fold II** | `3.00s – 6.00s` | **Gold Layer (`R1`)** · City at Peace (`M2` Bridal Torches, `M3` Agora Talents) | `whoosh_big/thump`, `cut_hit/punch`, `ui_pop/soft` (`×4`), `notify/mid_tine` | `2.972, 3.541, 3.855, 4.156, 4.458, 5.132` |
| **Fold III** | `6.00s – 9.00s` | **Pure Tin Layer (`R2`)** · City at War (`M4` Siege Council, `M5` Riverbed Ambush) | `reverse_swell/dark`, `cut_hit/punch`, `knock/wood` (`×3`), `shutter/dslr` | `5.921, 6.548, 6.954, 7.349, 8.197` |
| **Fold IV** | `9.00s – 12.00s` | **Second Bronze (`R3–R4`)** · Plough (`M6`), Reapers (`M7`), Vineyard (`M8`), Choros (`M9`) | `whoosh_fast/crisp`, `pro_pop_in/round` (`×4`), `mallet/pluck` (`C4, D4, E4, G4`) | `8.998, 9.485, 9.915, 10.368, 10.797, 11.029, 11.308` |
| **Fold V** | `12.00s – 15.00s` | **Outer Bronze (`R5`)** · River Oceanus Sealing the Uttermost Rim | `riser/dark`, `cut_hit/kick`, `cut_hit/punch`, `mallet/glock` (`E5, G5, A5, C6`) | `11.923, 12.771, 13.050, 13.375, 13.677` |
