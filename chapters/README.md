# ONYX Chapters — Asset Folder Structure

This folder contains 42 chapter asset directories for the ONYX Dark Matter Guardian archive.

## Folder Naming Convention

Each folder follows the pattern:
```
{ID}_{P1}-vs-{P2}
```

Example: `M-12_THE-BISHOP-vs-THE-FOREMAN`

- **ID**: Chapter identifier (M-12, M-13, etc.)
- **P1**: First participant/theory name
- **P2**: Second participant/theory name

## Subfolder Structure

Each chapter folder contains:
```
M-XX_NAME-vs-NAME/
├── images/       # Character portraits, scene illustrations
├── diagrams/     # Concept diagrams, comparison visuals
└── audio/        # Narration, sound effects (future)
```

## Asset Naming Conventions

### Images
- `portrait-p1.png` — Portrait of first participant
- `portrait-p2.png` — Portrait of second participant
- `scene-01.png`, `scene-02.png` — Narrative scene illustrations
- `winner-badge.png` — Winner announcement graphic

### Diagrams
- `comparison-table.svg` — Visual version of the verdict table
- `criterion-a.svg`, `criterion-b.svg` — Criterion verdict cards
- `concept-map.svg` — Theoretical relationship diagram

### Audio
- `dialogue.json` — **Auto-generated** speaker/text pairs for TTS
- `narration.mp3` — Full chapter narration (to be created)
- `p1-voice.mp3` — First participant dialogue (to be created)
- `p2-voice.mp3` — Second participant dialogue (to be created)

## Dialogue Extraction

Each chapter folder contains a `dialogue.json` with parsed speaker lines:

```json
{
  "id": "M-12",
  "title": "When THE BISHOP meets THE FOREMAN:",
  "participants": { "p1": "THE BISHOP", "p2": "THE FOREMAN" },
  "dialogue": [
    { "speaker": "THE BISHOP", "text": "Observe", "verb": "says" },
    { "speaker": "THE FOREMAN", "text": "My dear Bishop...", "verb": "sighs" }
  ]
}
```

**Total extracted: 587 dialogue lines across 42 chapters**

To regenerate dialogue files:
```bash
node parse-chapter-dialogue.js
```

Top speakers by line count:
| Speaker | Lines |
|---------|-------|
| THE PARASITE | 22 |
| THE SYMBOLIST | 12 |
| THE INTERPRETER | 11 |
| THE CHILD | 11 |
| THE SEMIOLOGIST | 10 |

## Manifest

See `manifest.json` for the complete chapter index with:
- Chapter ID and file reference
- Title and subtitle
- Folder path
- Participant names (p1, p2)
- Winner name
- Scores

## Data Sources

- **Full export**: `../onyx-full-data-*.json` — Complete parsed data
- **Viewer**: `../onyx-thumb.html` — Interactive chapter browser
- **Template**: `../onyx-chapter-template.md` — Markdown structure reference

## Adding Visuals

1. Open `manifest.json` to find the chapter folder
2. Add images to the appropriate subfolder
3. Update the chapter's `images` array in the full data export (or regenerate)

## Chapter List

| ID | Matchup | Folder |
|----|---------|--------|
| M-12 | BISHOP vs FOREMAN | `M-12_THE-BISHOP-vs-THE-FOREMAN` |
| M-13 | SCRIBE vs GOLEM | `M-13_THE-SCRIBE-vs-THE-GOLEM` |
| M-14 | NAVIGATOR vs CARTOGRAPHER | `M-14_THE-NAVIGATOR-vs-THE-CARTOGRAPHER` |
| M-15 | ANATOMIST vs ARCHITECT | `M-15_THE-ANATOMIST-vs-THE-ARCHITECT` |
| M-16 | ARCHIVIST vs WIZARD | `M-16_THE-ARCHIVIST-vs-THE-WIZARD` |
| M-17 | BARD vs MECHANIC | `M-17_THE-BARD-vs-THE-MECHANIC` |
| M-18 | TAXONOMIST vs INTERPRETER | `M-18_THE-TAXONOMIST-vs-THE-INTERPRETER` |
| M-19 | WEAVER vs CONSTRUCTOR | `M-19_THE-WEAVER-vs-THE-CONSTRUCTOR` |
| M-20 | SIMULATOR vs SIMULACRUM | `M-20_THE-SIMULATOR-vs-THE-SIMULACRUM` |
| M-21 | ORACLE vs CHILD | `M-21_THE-ORACLE-vs-THE-CHILD` |
| M-22 | SYMBOLIST vs VISUALIZER | `M-22_THE-SYMBOLIST-vs-THE-VISUALIZER` |
| M-23 | PLAIN MAN vs ANTHROPOLOGIST | `M-23_THE-PLAIN-MAN-vs-THE-ANTHROPOLOGIST` |
| M-24 | FUNCTIONALIST vs SYMBOLIST | `M-24_THE-FUNCTIONALIST-vs-THE-SYMBOLIST` |
| M-25 | PLANNER vs DRIFTER | `M-25_THE-PLANNER-vs-THE-DRIFTER` |
| M-26 | PROMOTER vs SEMIOLOGIST | `M-26_THE-PROMOTER-vs-THE-SEMIOLOGIST` |
| M-27 | TRANSMITTER vs RITUALIST | `M-27_THE-TRANSMITTER-vs-THE-RITUALIST` |
| M-28 | CONNOISSEUR vs SURGEON | `M-28_THE-CONNOISSEUR-vs-THE-SURGEON` |
| M-29 | CHRONICLER vs RAGPICKER | `M-29_THE-CHRONICLER-vs-THE-RAGPICKER` |
| M-30 | TOURIST vs PHILOSOPHER | `M-30_THE-TOURIST-vs-THE-PHILOSOPHER` |
| M-31 | POPULIST vs HEGEMON | `M-31_THE-POPULIST-vs-THE-HEGEMON` |
| M-32 | SCEPTIC vs CHILD-MACHINE | `M-32_THE-SCEPTIC-vs-THE-CHILD-MACHINE` |
| M-33 | SINGULARITARIAN vs KIN-MAKER | `M-33_THE-SINGULARITARIAN-vs-THE-KIN-MAKER` |
| M-34 | ENGINEER vs WOODCUTTER | `M-34_THE-ENGINEER-vs-THE-WOODCUTTER` |
| M-35 | WARDEN vs SURFER | `M-35_THE-WARDEN-vs-THE-SURFER` |
| M-36 | HUNTER vs FUNCTIONARY | `M-36_THE-HUNTER-vs-THE-FUNCTIONARY` |
| M-37 | HOST vs PARASITE | `M-37_THE-HOST-vs-THE-PARASITE` |
| M-38 | PRODUCER vs PARASITE | `M-38_THE-PRODUCER-vs-THE-PARASITE` |
| M-39 | TORTOISE vs DUCK | `M-39_THE-TORTOISE-vs-THE-DUCK` |
| M-40 | MONAD vs CACOPHONY | `M-40_THE-MONAD-vs-THE-CACOPHONY` |
| M-41 | BROTHER vs MONEY-CHANGER | `M-41_THE-BROTHER-vs-THE-MONEY-CHANGER` |
| M-42 | WARRIOR vs TROUBLEMAKER | `M-42_THE-WARRIOR-vs-THE-TROUBLEMAKER` |
| M-43 | SPECTATOR vs PARASITE | `M-43_THE-SPECTATOR-vs-THE-PARASITE` |
| M-44 | VICTOR vs DEVIL | `M-44_THE-VICTOR-vs-THE-DEVIL` |
| M-45 | GRIEVER vs ASTROBIOLOGIST | `M-45_THE-GRIEVER-vs-THE-ASTROBIOLOGIST` |
| M-46 | PROPHET vs ENGINEER | `M-46_THE-PROPHET-vs-THE-ENGINEER` |
| M-47 | BUREAUCRAT vs CULTIVATOR | `M-47_THE-BUREAUCRAT-vs-THE-CULTIVATOR` |
| M-48 | DREAMER vs CONTROLLER | `M-48_THE-DREAMER-vs-THE-CONTROLLER` |
| M-49 | PLANNER vs PILOT | `M-49_THE-PLANNER-vs-THE-PILOT` |
| M-51 | IDEALIST vs SYSTEM-BUILDER | `M-51_THE-IDEALIST-vs-THE-SYSTEM-BUILDER` |
| M-53 | KANTIAN vs BIOLOGIST | `M-53_THE-KANTIAN-vs-THE-BIOLOGIST` |
| M-63 | ARTIST vs MACHINE | `M-63_THE-ARTIST-vs-THE-MACHINE` |
