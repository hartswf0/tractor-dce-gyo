# Cinematic MPD Experiments

## MENTO Extensions for LDraw

These experiments extend standard LDraw/MPD format with **MENTO directives** for cinematic control:

### Lighting
```
0 !MENTO LIGHT "name" TYPE [SPOT|POINT|SUN] POS x y z TGT tx ty tz COLOR #hex INTENSITY f SHADOWS [TRUE|FALSE]
```

### Camera/Shots
```
0 !MENTO SHOT "name" POS x y z TGT tx ty tz LENS mm
```

---

## The Experiments

### 01. The Fragmented Hero
- **Deleuze**: Action-Image (Small Form: ASA')
- **Lighting**: Low-key chiaroscuro
- **Camera**: Handheld micro-jitter, 85mm portrait
- **Mood**: Intimate crisis, noir psychology

### 02. The Symbolic Void
- **Deleuze**: Any-Space-Whatever (Perception-Image)
- **Lighting**: Monochromatic cool cyan wash
- **Camera**: Extreme wide 24mm, gaseous perception
- **Mood**: Alienation, post-apocalyptic drift

### 03. The Memory Loop
- **Deleuze**: Mental-Image (Relation-Image)
- **Lighting**: Golden hour warm
- **Camera**: Bracket syntagma (object→face), 100mm macro
- **Mood**: Nostalgia, temporal displacement

### 04. The Power Shift
- **Deleuze**: Action-Image (Large Form: SAS')
- **Lighting**: High contrast divine/demonic
- **Camera**: Vertical axis crane (high→low angle)
- **Mood**: Domination, transformation

---

## Usage

1. Copy contents of any `.mpd` file
2. Paste into WAG Courage editor (DATA IMPORT)
3. MENTO directives are comments (0 prefix) - geometry loads normally
4. Future: Parser will interpret MENTO for lighting/camera control

---

## Theoretical Foundation

Based on Gilles Deleuze's *Cinema 1: The Movement-Image* and *Cinema 2: The Time-Image*:

- **Action-Image**: Situation→Action→Situation (Large Form) or Action→Situation→Action (Small Form)
- **Perception-Image**: Objective/gaseous, subjective/liquid, or semi-subjective/solid
- **Affection-Image**: Close-up, any-space-whatever
- **Mental-Image**: Relation between images, thought itself

The MENTO system translates these philosophical categories into technical camera and lighting parameters.
