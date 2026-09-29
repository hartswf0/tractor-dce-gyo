# The motion library (`film-readymades/motion.js`, `window.OdysseyMotion`)

The machinery `odyssey/cineosis/MOTION.md` asks for: keyed poses on twos, replacement tracks, brick fields and optical transitions,
in one classic script on the page's global THREE (r128), with no imports. The film uses it (trailer mode, take mode, both exporters)
and so can the hand game. Every drawing is a pure function of the shot's clock `u` (seconds). A frame rendered offline at `u` is the
frame the player shows at `u`. Stepping is on twos: a drawing is held for 1/12 s whatever the render rate. Randomness comes from
integer hashes (`rnd(a,b,c)`), so the same drawing comes out every time.

Everything is built in brick terms: tiles, plates, 1x1 round plates, round bricks and bars, made as instanced meshes in LDraw units
(stud 20, plate 8, brick 24) and scaled by the set's world units per LDU. Only matrices move; no geometry is made per frame.

## Naming motion in an edit list

A trailer shot (`odyssey/trailers/*.json`, or any `--doc`) or a keyframe key (take mode) may carry these fields:

```json
{
  "motion": [{"actor": "suitors-4", "clip": "strike", "at": 0.0, "speed": 1, "with": "telemachus", "mark": [-10, -30], "heading": 0,
              "target": "antinous", "loop": true, "until": 3.0, "shake": 1, "params": {"range": 2.5, "oar": {"side": 1}}}],
  "fields": [{"type": "sea", "state": "swell", "ride": [{"page": "black ship", "pitch": 4, "heave": 0.6}]}],
  "swaps":  [{"type": "transform", "actor": "five-scouts-2", "to": "pig", "at": 1.0}],
  "optical": {"grade": "past", "hold": 3},
  "transition": {"type": "dissolve", "dur": 0.75},
  "transition_out": {"type": "fade", "dur": 0.6}
}
```

- `motion[]` gives one run per entry. `at` is in seconds into the shot and `speed` scales the clip. Before `at` the actor stays as
  staged. A clip that does not loop holds its last drawing. Several runs on one actor chain: a later run starts where the earlier
  ones have travelled and turned to, and its pose wins while it plays.
  - `with` names a partner. For `embrace` the two turn to each other and close to a hug. For any other clip the two are opponents:
    they face each other and stand at `params.range` studs (2.5 by default) for the whole shot.
  - `target` is a point, an actor or `piece:label`. The figure turns to it (`point`, `draw-bow`).
  - `mark` (`[x,z]` or `[x,y,z]`) and `heading` move the figure for this shot only.
  - `shake` scales the two-drawing lens shake on an impact. `false` turns it off.
  - `keep: ["legRP","legLP"]` leaves those joints as staged (a seated figure reels with her arms and torso only).
- `fields[]` holds the brick fields below. `swaps[]` holds the replacement tracks below.
- `optical.grade: "past"` is the marked-past grade (desaturated, warm, vignette). `optical.hold: n` holds the drawings on n's (3 means
  8 drawings a second).
- `transition` and `transition_out` are carried out by the exporter's compositor (see Optics).
- Take mode: a key in `odyssey/keyframes/<scene>.json` may name `motion`, `fields`, `swaps` or `optical`. So may
  `tools/export-odyssey.js --plan plan.json`, as `{keys: {K2: {...}}, transitions: [...]}`. The key's clock starts at the key's time.

Nothing is named, nothing runs. Each hook checks `OdysseyMotion.named(shot)` (or looks for `T.motion` in take mode) and does nothing
otherwise, so existing films render exactly as before.

## The API

| call | what it does |
|---|---|
| `stage(spec, ctx) → St` | Builds a shot's runs, accessories, fields and swaps (async, because parts are parsed). `ctx`: `{scene, renderer, actorOf(id)→{rig}, cast()→[ids], scale, cam:{pos,target,fov}, pieces()→[{label,box}], parse?, props?}` |
| `St.frame(u) → overlay` | Poses the cast, then the fields (a hull riding the sea carries its crew), then the accessories and swaps. Returns `{flash, shake, tint, past, sky}` for the host to paint |
| `St.time(u)` | The shot clock after `optical.hold` (drawings on threes) |
| `St.show(bool)`, `St.dispose()` | Hide the stage, or remove it and restore every part, material, page mesh and visibility it touched |
| `takeStage(T, plan, ctx)` | One stage per take key that names motion. `.frame(t, key)`, `.ov`, `.dispose()` |
| `CLIPS`, `bind(clip, basePose)`, `sample(bound, tc)` | The clip library and the evaluator: `{pose:{armRP:[x,y,z]..}, root:{pitch,roll,yaw,fwd,side,dy,kneel,sitGround,pivot}, F, Fc, smear, events}` |
| `gaitSample('walk'\|'run'\|'carry', tc, {H, speed, dist})` | Take mode's walk cycle, sampled on twos |
| `applyPose(rig, pose)`, `applyRoot(rig, base, root, units)`, `readPose(rig)` | The gate's own pose API (kfBlock: `r[joint].rotation`, the head's `[0,yaw,0]`) and the whole-figure root turned about a pivot on the ground (heel, toe, knee) |
| `FIELDS.*`, `SWAPS.*`, `ACC.*` | The builders, each `(St, params) → {update(u, ov), dispose()}` |
| `overlay(g2d, W, H, ov)` | Paints the flash, the tint and the marked past over a rendered frame |
| `composite({op, a, b, w, strength, resolve})` | The exporters' compositor: two base64 JPEGs in, one out. `dissolve`, `double`, `fade`, `past` |
| `drawing(t, fps)`, `onTwos(t)`, `seaH(P,x,z,t)`, `partsOf(rig, part)`, `handWorld(rig, side)`, `rnd` | Helpers the game can use directly |

The clip format is `{fps: 12, len, loop, intro, holds: [{f, n}], keys: [{f, pose, root, ease, smear}], events: [{f, ev}], acc: {...}}`.

- `f` counts drawings.
- `ease` says how a key is reached from the key before: `linear`, `in`, `out`, `inOut`, `hold` (no in-between; the pose snaps at the
  key) or `snap`.
- `smear: true` draws the drawing before that key with an arc of trans-clear plates along the leading hand's sweep.
- Pose values are the gate's. A number means x for the arms, legs and torso (negative is forward and up), and the head's yaw. An
  array means `[x,y,z]`.
- A key that does not name a joint keeps what came before. The first key takes the staged pose for anything it leaves out.
- `intro` gives a loop a way in from the staged pose.

## The clips

| clip | keys, on twos | accessory |
|---|---|---|
| `row` | 14-drawing loop: catch, drive, finish, recovery, with the torso leaning into the stroke | an oar through an oarlock, outboard (auto side from the ship), with a splash of white plates at each catch |
| `pull-oar-heavy` | 22-drawing loop, deeper lean, a held finish | the oar |
| `strike` | guard, then anticipation held 4 drawings, then a smear, the strike, a 2-drawing impact (the lens shakes), the recoil and the settle | the weapon's clear-plate smear arc |
| `parry` | the block raised with a step back, a 2-drawing impact, recovery | |
| `spear-thrust` | drawn back and held, then the thrust with a lunge and a smear, held, recovery | |
| `draw-bow` | bow arm up, drawn to the cheek, held, loosed | a brick bow (reddish-brown round plates), the string to the drawing hand, a pluck on ones for 6 drawings, the arrow away at 40 studs a drawing |
| `fall`, `fall-forward` | a stiff fall about the heel (or the toe) over 4 drawings, one bounce of a plate, settle | the held weapon comes loose and lies beside him |
| `die-on-knees` | hit, clutch, to the knees (legs back, the kneel drop measured from the figure), held, then forward to the floor | the held weapon drops |
| `embrace` | relational: turn to the partner, 3 steps in, arms to about 60° with a slight out, heads together, 5° lean; eased over 8 drawings, then held | |
| `weep` | hands to the face, head down, a shaking lean (16-drawing loop) | tears: clear round plates sliding down the face |
| `kneel-supplicate` | kneeling, arms raised and pumping | |
| `lift-and-throw` | crouch, lift overhead and hold, a smear throw | the rock: a cluster of grey bricks in both hands, then a ballistic arc to `params.rock.to`, spinning 30° a drawing, a trail of 3 fading copies, a splash |
| `swim` | prone, crawl arms, flutter legs (12-drawing loop), travelling 2.2 studs a second | |
| `climb` | alternate reaches (12-drawing loop), rising 1.5 plates a cycle | |
| `walk`, `run`, `carry` | take mode's cycle (legs ±0.62, arms ∓0.45 on the stride's sine) on twos; `speed` studs/s, `to` [x,z] | carry: `params.carried.prop` held at the chest |
| `weave` | the shuttle passed across, stepping side to side (24-drawing loop) | the shuttle, a tan 1x2 plate |
| `pour-libation` | raise, tip, pour, lower | a gold cup; a stream of dark-red round plates |
| `sleep-breathe` | the body rising half a plate every 48 drawings | |
| `wake` | from on his back, a two-pose rise to sitting (seated on the ground), a look around, then standing | |
| `reel-back-in-fear` | hands up, a step back with a hop, trembling | |
| `point`, `beckon`, `stagger` | point turns to its target with an overshoot; beckon loops; stagger steps back with a roll | |

## Replacement tracks (`swaps`)

- **`transform`** `{actor, at, to: 'pig'|'young'|'beggar'|'restored', steps: [{df, part, prop|file+ldColor|color|hide}], flash, reverse}`.
  - Part groups are read as the gate reads them: `head`, `hat`/`hair`, `torso`, `arms`, `hands`, `legs`, `held`/`heldR`/`heldL`.
  - A prop comes from `odyssey/keyframes/props.json` (the pig mask `17351p01`). A file is an LDraw part (hair `3901`, spear `4497`),
    hung in the weapon slot for held parts.
  - Colours are private material clones. The first drawing gets a white-hot flash on the figure and a 40% screen flash (`flash: false`
    turns both off, as for Athena's slow changes).
  - `pig` is Circe's swine: the head first, then the body pink down to the feet, two drawings a part.
- **`glow`** `{actor, color, rim, warm, glint: [u..], from, until}` is the god among men. It gives a warm point-light rim from behind
  the figure (the side away from the lens), a warm emissive grade on that figure only, and two-drawing glints.
- **`sail`** `{at, w, h, heading, belly, fill: [[u,'slack'|'half'|'full']]}` is a sheet of 1x2 plates with a red band. Its belly is
  stepped between three builds, with one in-between drawing at each change.
- **`flames`** `{at, size, count, intensity}` gives cones of trans-red, trans-orange and trans-yellow round plates. Three builds cycle
  on twos, with a warm light in phase.

## Brick fields (`fields`)

- **`sea`** `{page:'the sea'|box, state: calm|swell|storm, amp, dir, tile: 1|2, clear: [pages], lee, hide: ['swell*','splash*'],
  ride: [{page, pitch, heave, float, lift}], colors}`.
  - Columns of tiles are raised by a sum of three travelling waves, quantised to plate steps. Swell is 2 plates on a 48-stud
    wavelength. Storm is 4 plates on 30 studs with darker colours.
  - Calm has a glint layer of trans-clear plates toggled at random.
  - White round plates are laid where a crest is high and about to fall.
  - Tiles are kept clear of hulls, with a calmer lee `lee` studs around them. The set's static swell and splash pages are hidden.
  - `ride` makes a page mesh (the ship, the raft) and the figures standing on it heave and pitch on the sea's own `h(x,t)`.
  - `height(x,z,u)` is exposed, so rain splashes land on the waves.
- **`rain`** `{count, speed, len, width, wind, near, far, box, ground, splash}` drops clear round plates in streaks through the view
  frustum (or a box). They fall on twos, and a share splash as two small plates where they land.
- **`smoke`** `{at, every: 4, life: 36, rise, wind, size, steam}` spawns 2x2 and 1x1 round bricks every 4 drawings. They rise a plate
  a drawing, drift, swell and then thin out (puffs drop out as they age). Steam is the same in white and faster.
- **`whirlpool`** `{page:'the whirlpool'|at, radius, rings, depth, speed}` turns rings of 1x2 tiles, the inner ones faster
  (radius-dependent speed), sinking toward the middle, with foam on three spiral arms.
- **`mist`** `{box|page, count, height, drift, opacity}` drifts translucent 4x4 plates in two opacities, swelling in and out.
- **`lightning`** `{at: [u..], where, sky, fill, key, flash, thick, height}`.
  - Each strike spikes the sky, a hemisphere fill and a directional key for 2 drawings, with a third at a third of the strength.
  - The bolt is a zigzag of emissive 1x2 plates from the cloud to the sea, placed across the frame from the camera unless `where` is
    given.
- **`rocks`** `{rocks: [{from, to, at, frames, apex, size}], splash: water|dust}` throws grey brick clusters on ballistic arcs. They
  spin 30° a drawing, trail three fading copies and burst on landing.

## Optics

- **Trailer exporter** (`tools/export-trailer.js`). A shot's `transition` (`dissolve`, `double` or `fade`, over `dur` seconds or
  `frames`) comes in from the shot before it. `transition_out: {type:'fade'}` goes to black.
  - A frame inside a transition is drawn as layers in `<frames>/layers`. The outgoing shot runs on past its end; the incoming shot is
    at its head. The layers are composited in a page after drawing. The weight is smoothstepped per frame.
  - `double` adds the incoming shot at 40% (`strength`) over the outgoing one, then resolves into it. `resolve: false` keeps the
    superimposition for the whole overlap.
  - An edit list with no optics draws exactly the jobs it drew before.
  - `--no-sound` now writes the picture alone.
- **Marked past**: `optical: {grade:'past', hold:3}` is painted by `overlay()` in the trailer's `frame()`.
- **Take exporter** (`tools/export-odyssey.js --plan`): `transitions: [{type: fade|fade-out|past|dissolve|double, at, dur}]`. A take
  has one clock, so a take dissolve crossfades from the frame held just before `at`.

## Hooks (each marked `/*[motion]*/ … /*[/motion]*/`)

- `film-readymades/odyssey-trailer.js`:
  - `shot()` disposes the last stage and stages the shot's own when `named(sh)`.
  - `frame()` applies the hold on threes, runs `MO.frame(u)` after the snapshot pose, shakes the lens on impacts, updates shadows
    while motion runs, and paints the overlay.
  - `endScene()` disposes the stage.
- `film-readymades/odyssey-take.js` (staging only):
  - `prepare()` calls `takeStage`.
  - `apply()` runs the key's stage after `poseCast`.
  - `frame()` paints the overlay.
  - `end()` disposes the stages.
  - The cutting functions are untouched.
- `tools/export-trailer.js` injects `motion.js`, adds the optics pass and compositor, and adds the `--no-sound` path.
  `tools/export-odyssey.js` adds `--plan` and take optics.
- `film-readymades/patch_motion.py` embeds `motion.js` in the built player as `<script data-odyssey-motion>` and refreshes the trailer
  runtime. `--take` also refreshes the take runtime. `build_odyssey.py` does not know `motion.js`, so run this again after a rebuild.

## The test films (`films/motion/`)

Each is an edit list (`*.json`) rendered with
`node tools/export-trailer.js <id> --doc films/motion/<id>.json --out films/motion/<id>.mp4 --no-sound` at 12 fps, 1280x720.

| film | scene | what it shows |
|---|---|---|
| `motion-row` | B12-S04 | the black ship rowed through a swell: four rowers on `row` with oars and catch splashes, the hull heaving and pitching, crests |
| `motion-storm` | B05-S05 | the raft in a storm sea; rain; Poseidon's strike answered by lightning (flash and bolt); Odysseus reels |
| `motion-combat` | B22-S01 | Telemachus and a suitor: strike (anticipation, smear, impact), parry, counter-strike, fall |
| `motion-fall` | B22-S01 | Odysseus draws and looses (the bow accessory), cut to Antinous falling stiff about the heel, with a bounce; the cup comes loose |
| `motion-embrace` | B23-S04 | Penelope and Odysseus step in and embrace, held |
| `motion-circe` | B10-S04 | Circe points; three men become swine one by one (flash, pig head, pink body) |
| `motion-scar` | B19-S04, B14-S01, B19-S04 | fade in on the scar; a dissolve into the marked past (the young Odysseus, made by `transform: young`, spear-thrust at the boar, held on threes); a dissolve back; fade out |

`films/motion/take-plan-B23-S04.json` is a take-mode plan. It puts the embrace and Eurycleia weeping on K3 and a mist on K5. It was
checked with `export-odyssey.js --plan --stills` against a player patched with `patch_motion.py --take`.

### What reads, and what does not (from the rendered frames)

- **Reads well:**
  - the sea (travelling brick waves, crest foam, the ship heaving);
  - the oars sweeping, with a splash at each catch;
  - the rain streaks and the lightning bolt with its flash;
  - the strike, parry and counter-strike, with the smear arc and the fall;
  - Antinous's stiff fall with its bounce;
  - the step-in embrace and the held two-shot;
  - the pig head and pink body with the flash;
  - the fade, the dissolve into the warm, stepped past and back, and the fade out.
- **Reads weakly:**
  - The draw-bow shot. The minifig's pitch-only arms make the draw and the release a small change, and the brick bow sits behind the
    staged bow prop.
  - The ship's pitch. Four degrees is hard to see at a wide.
  - Circe's second and third men, who are at the frame's edge.
  - The storm, which is busy at 520 drops.
- **Stand-ins:**
  - The flashback boar is one of the swineherd's dogs.
  - The embrace's arms pass through the partner's body, because minifig arms cannot close.
