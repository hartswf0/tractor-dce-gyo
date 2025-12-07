# Agon Archive Media Manifest

Visual media folders for each chapter debate.

## Folder Structure

Each folder is named: `ch{number}_{SPEAKER-A}-vs-{SPEAKER-B}`

Place images, videos, and audio files in the appropriate chapter folder.

## Chapters

| # | Folder | Debate |
|---|--------|--------|
| 12 | `ch12_THE-BISHOP-vs-THE-FOREMAN` | Language as naming vs. language as tool |
| 13 | `ch13_THE-SCRIBE-vs-THE-GOLEM` | Written tradition vs. embodied knowledge |
| 14 | `ch14_THE-NAVIGATOR-vs-THE-CARTOGRAPHER` | Wayfinding vs. mapping |
| 15 | `ch15_THE-ANATOMIST-vs-THE-ARCHITECT` | Universal human nature vs. cultural particularity |
| 16 | `ch16_THE-ARCHIVIST-vs-THE-WIZARD` | Preservation vs. transformation |
| 17 | `ch17_THE-BARD-vs-THE-MECHANIC` | Oral tradition vs. mechanical reproduction |
| 18 | `ch18_THE-TAXONOMIST-vs-THE-INTERPRETER` | Classification vs. interpretation |
| 19 | `ch19_THE-WEAVER-vs-THE-CONSTRUCTOR` | Organic growth vs. engineered structure |
| 20 | `ch20_THE-SIMULATOR-vs-THE-SIMULACRUM` | Traditional AI vs. generative agents |
| 21 | `ch21_THE-ORACLE-vs-THE-CHILD` | Prophetic knowledge vs. learning |
| 22 | `ch22_THE-SYMBOLIST-vs-THE-VISUALIZER` | Symbolic vs. visual representation |
| 23 | `ch23_THE-PLAIN-MAN-vs-THE-ANTHROPOLOGIST` | Common sense vs. cultural analysis |
| 24 | `ch24_THE-FUNCTIONALIST-vs-THE-SYMBOLIST` | Function vs. meaning |
| 25 | `ch25_THE-PLANNER-vs-THE-DRIFTER` | Objective search vs. novelty search |
| 26 | `ch26_THE-PROMOTER-vs-THE-SEMIOLOGIST` | Marketing vs. semiotics |
| 27 | `ch27_THE-TRANSMITTER-vs-THE-RITUALIST` | Communication vs. communion |
| 28 | `ch28_THE-CONNOISSEUR-vs-THE-SURGEON` | Aesthetic judgment vs. analysis |
| 29 | `ch29_THE-CHRONICLER-vs-THE-RAGPICKER` | Official history vs. fragments |
| 30 | `ch30_THE-TOURIST-vs-THE-PHILOSOPHER` | Consumption vs. contemplation |
| 31 | `ch31_THE-POPULIST-vs-THE-HEGEMON` | Popular will vs. elite control |
| 32 | `ch32_THE-SCEPTIC-vs-THE-CHILD-MACHINE` | Doubt vs. learning |
| 33 | `ch33_THE-SINGULARITARIAN-vs-THE-KIN-MAKER` | Transcendence vs. kinship |
| 34 | `ch34_THE-ENGINEER-vs-THE-WOODCUTTER` | Optimization vs. craft |
| 35 | `ch35_THE-WARDEN-vs-THE-SURFER` | Control vs. flow |
| 36 | `ch36_THE-HUNTER-vs-THE-FUNCTIONARY` | Pursuit vs. procedure |
| 37 | `ch37_THE-HOST-vs-THE-PARASITE` | Hospitality vs. exploitation |
| 38 | `ch38_THE-PRODUCER-vs-THE-PARASITE` | Creation vs. extraction |
| 39 | `ch39_THE-TORTOISE-vs-THE-DUCK` | Slow deliberation vs. quick adaptation |
| 40 | `ch40_THE-MONAD-vs-THE-CACOPHONY` | Unity vs. noise |
| 41 | `ch41_THE-BROTHER-vs-THE-MONEY-CHANGER` | Gift economy vs. market exchange |
| 42 | `ch42_THE-WARRIOR-vs-THE-TROUBLEMAKER` | Conflict vs. disruption |
| 43 | `ch43_THE-SPECTATOR-vs-THE-PARASITE` | Observation vs. intervention |
| 44 | `ch44_THE-VICTOR-vs-THE-DEVIL` | Triumph vs. temptation |
| 45 | `ch45_THE-GRIEVER-vs-THE-ASTROBIOLOGIST` | Loss vs. cosmic perspective |
| 46 | `ch46_THE-PROPHET-vs-THE-ENGINEER` | Vision vs. implementation |
| 47 | `ch47_THE-BUREAUCRAT-vs-THE-CULTIVATOR` | Administration vs. growth |
| 47b | `ch47b_THE-DUALIST-vs-THE-SYMBIOGENETICIST` | Mind-body split vs. symbiosis |
| 48 | `ch48_THE-DREAMER-vs-THE-CONTROLLER` | Imagination vs. regulation |
| 49 | `ch49_THE-PLANNER-vs-THE-PILOT` | Strategy vs. navigation |
| 51 | `ch51_THE-IDEALIST-vs-THE-SYSTEM-BUILDER` | Pure ideas vs. pragmatic systems |
| 53 | `ch53_THE-KANTIAN-vs-THE-BIOLOGIST` | A priori reason vs. evolutionary epistemology |
| 63 | `ch63_THE-ARTIST-vs-THE-MACHINE` | Human creativity vs. computational generation |

## Supported Formats

- **Images**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`
- **Video**: `.mp4`, `.webm`, `.mov`
- **Audio**: `.mp3`, `.wav`, `.ogg`, `.m4a`

## Adding Media

### Option 1: Use a manifest.json (Recommended)
Create a `manifest.json` in the chapter folder:

```json
{
  "chapter": 12,
  "title": "THE BISHOP vs THE FOREMAN",
  "files": [
    { "file": "cover.png", "name": "Cover Image" },
    { "file": "p1.png", "name": "The Bishop" },
    { "file": "p2.png", "name": "The Foreman" },
    { "file": "scene1.jpg", "name": "Opening Scene" }
  ]
}
```

### Option 2: Use standard filenames
The viewer will auto-detect these filenames:
- `cover`, `hero`, `main` - Main images
- `01` through `10` - Numbered images
- `p1`, `p2`, `fighter1`, `fighter2` - Character images
- `scene1`, `scene2`, `scene3` - Scene images
- `diagram`, `chart`, `illustration` - Diagrams

## Usage

Media files placed in these folders will be automatically discovered by the viewer applications:
- `onyx-thumb.html` - Audio Player (Visual tab)
- `onyx-arena.html` - Arena Reader

### Viewing Images
- Click an image to select it
- Double-click to open in lightbox
- Press Escape or click to close lightbox
