# Building sets at the level of the Odyssey line

This is the method that made the Odyssey kits: the Cave of the Cyclops (3,215 pieces), the Bow and the Hall (2,871), the Bed
(2,233), the Wooden Horse and the rest on `odyssey/kits/`. It is written for a model, or a person, about to build something bigger:
the Shield of Achilles (`docs/sets/shield-of-achilles.md`) or any set of several thousand pieces. The prompts that put it to work are in
`docs/sets/PROMPTS.md`.

Every kit on the line passes the same checker: every part clicks to the studs below, and no two parts fill the same space. That is
not because the model that built them was better at LEGO. It is because none of them was written as LDraw lines.

## Why most attempts fail

Asked for a large set, a model writes the `.ldr` lines directly, one part per line, in one pass, without looking at it. Seven things
then go wrong, and the Shield render of October 2026 shows most of them.

1. **The file is too long to write.** A 3,000-piece set is 3,000 lines of about 80 characters. No reply holds that with attention to
   each line, so the model fills space with what is cheap to repeat: walls of 1 x 1 bricks in random colours, piles of 1 x 1 round
   plates for gold or crowds, the same figure copied. On the Shield, the maze walls are a checkerboard of grey, brown and tan 1 x 1s and
   the treasure is a heap of yellow round plates.
2. **The coordinates are guessed.** LDraw has y pointing down, every part has its own origin (a brick's is its top face, a slope's is
   not), and rotations are 3 x 3 matrices. A model that guesses these puts parts in the air, inside each other, or half a stud off the
   grid. Nothing tells it.
3. **Nothing is measured.** Piece count, loose parts, clashing parts, figures standing on nothing: what is not measured drifts.
4. **Nothing is looked at.** The Odyssey kits were rendered and looked at on every pass. A set written blind repeats its mistakes.
5. **There is no moment.** "The city at war" becomes a crowd of soldiers in a pen. A scene needs one moment at its height, staged for
   a viewer: on the Shield, Ares and Athena in gold leading the army out, larger than the men; the ambush at the river; Strife dragging
   a body.
6. **Everything has the same weight.** Every band is the same height, every scene equally packed, every wall the same pattern. There
   is no focal point, no open ground, nowhere for the eye to rest.
7. **The part vocabulary is pixels.** Real sets use tiles to finish, slopes and curved parts to shape, round corner tiles for circles,
   SNOT for detail. A set built from 1 x 1 bricks and plates reads as a voxel picture, and a circle comes out as stairs.

## What the Odyssey kits do instead

**A brief before a part.** Each kit started from a written brief (`odyssey/kits/brief.html`): the moment, posed at its height (the stake
going into the eye, not "the cave"); one mechanism that re-enacts it (the door-stone rolls shut, the great doors swing); scale (a
minifigure is 1.75 m, a stud 0.37 m); the period (Bronze Age, not the Parthenon); a piece budget; a main model and a supporting build
that each stand alone.

**A program, not a list of parts.** Each kit is a Python script on a shared library, a few hundred lines that emit thousands of
parts. Change a radius and rerun; nothing is retyped.

| Tool | What it does |
|---|---|
| `tools/forage/product/kitlib.py` | `put`, `on` (a part standing on a surface, measured), `prop`, `seated`, `figure` (a cast minifigure from a card), `tile_run`, `frame` (base, nameplate), `write`, `check`, `manifest`. Heights are LDU up from the table. |
| `tools/forage/product/sculpt.py` | Rock, cliffs, mounds and domes: smooth solids (`ell`, `cone`, `seg`, `smin`, `rough`) cut into stud cells, laid as bonded bricks, every top finished with tiles, then settled until every part clicks. |
| `tools/forage/product/landscape.py` | About forty seeded builders for trees, plants, roads, walls, water and ground, grid-true and checked. |
| `odyssey/keyframes/props.json` | Props already built: the stake, bowls, the loom, the bow, a raft, Argos. |
| `odyssey/cards/character.*.mpd` | The cast, dressed; `tools/forage/product/wardrobe.py` re-dresses them. |
| `tools/forage/product/clicks.py` | The checker: parts not clicked, and pairs of parts in the same space. |
| `tools/forage/look.js` | Renders a card at any angle, for looking. |
| `tools/forage/product/blockouts.js` | Grey massing models: the composition before the detail. |

The scripts in `tools/forage/product/kits/` are the worked examples; read `the-bed.py` and `bow-and-hall.py` first, then `cyclops.py`
for sculpted rock.

**Blockout, then detail.** Grey masses first (rock grey, masonry in its colour, water blue, real props and figures for scale), looked at
from the viewer's height, approved, and only then detailed.

**Looked at, every pass.** Render the hero angle, the opened angle and close-ups at minifigure eye level; put them on one sheet beside a
reference image of a real set; write down what is wrong; fix it in the script; render again. The Cave took several passes: it was
5,851 pieces at first and is 3,215 now.

**Proven.** `kitlib.check` must print 0 not clicked and 0 in the same space for every build. The kit page shows the result.

## The craft rules

These are what separate the kits from the voxel pictures. A reviewer checks every one.

1. **One moment per build,** at its height, readable from the front without a caption. Everything else in the build serves it.
2. **Open ground.** Leave a third or more of the floor of a scene clear. A crowd is five figures doing one legible thing, not twenty
   standing in a pen.
3. **Figures act.** Each figure faces what it is doing, stands on studs, and keeps a stud of air from the next unless they touch on
   purpose (a hand on a shoulder, a dancer's hand on a wrist). Use `kitlib.figure`, never hand-built minifigures.
4. **Texture from structure, not noise.** A wall is courses of bricks with offsets, a cap, a plinth: strata of dark tan in the grey,
   patches four studs across, moss with plants growing from it. Never a random checkerboard of 1 x 1s.
5. **Finished surfaces.** Tiles on every flat the sky sees, cheese slopes off edges, studs only where something stands.
6. **A real part vocabulary.** Round corner tiles (`25269`, `27925`, `79393`, `27507`) and round corner plates (`30357`, `30565`) for
   curves; wedges and wing plates for arcs; slopes and curved slopes (`11477`, `15068`) for shape; printed and specialised parts where the
   story names a thing. A 1 x 1 brick is the last resort.
7. **A palette with meaning,** six to eight colours, each a material. Pick it in the brief and keep to it.
8. **Hierarchy.** Vary height and density. One focal point per build, quieter ground around it.
9. **Proven.** 0 loose, 0 in the same space, a piece count inside the budget.
10. **True to the source.** Every element points to a line of the text. Name the line in the brief.

## Giant sets: break them into builds

A set of 5,000 to 10,000 pieces is several builds that share a frame, never one script or one prompt.

- **Modules of at most about 1,500 pieces,** each its own script and card, each standing alone on its own base and passing the checker
  alone.
- **A shared frame:** one file of numbers every module imports: the stud grid origin, the base plates, the height datum of each band, the
  boundary of each module in stud cells, the palette. Modules never redefine these.
- **Interfaces, not overlaps.** Two modules meet on a boundary line; neither places parts across it. Dividers belong to the frame.
- **An assembly file** that brings the modules together as submodels, checked as a whole as well as each part.
- **One builder per module,** working from the brief, with a reviewer who sees only renders and the checker's numbers.
- **Order:** frame, then blockout of everything, then the hero module to the full bar, then the rest. The first finished module sets
  the standard the others are held to.

## Running it

```
(setsid nohup python3 -m http.server 8899 --directory <repo> > /dev/null 2>&1 &)
python3 tools/forage/product/kits/<kit>.py                       # writes odyssey/cards/<card>.mpd and checks it
python3 tools/forage/product/clicks.py odyssey/cards/<card>.mpd   # the checker on its own
NODE_PATH=<dir with playwright and three@0.128> node tools/forage/look.js --out <dir> --w 1600 --h 1100 --jpeg \
    --studio dark --az 200 --el 24 --zoom 1.3 <card id>          # a render at azimuth 200, elevation 24
```

The checker does not yet check minifigures (they are not on the stud grid). Until it does, the reviewer checks figure grounding and
spacing from close-up renders.
