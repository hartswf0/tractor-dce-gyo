# The creature rigs

`film-readymades/creatures.js` (`window.OdysseyCreatures`, and a CommonJS module for node tools) turns the Odyssey film's giants
and animals from set pieces into articulated rigs the performance engine can give intents: Polyphemus, the Laestrygonians
(Antiphates and the giant girl are the same rig recoloured and rescaled), Scylla, the rams and the flock, the dogs and Argos, and
the cattle of the Sun. The page is `odyssey/creatures/index.html`; the tools are in `tools/creatures/`.

Like `film-readymades/choreo.js`, everything is a pure function of its inputs: a pose of its channels, a gait, a herd, a giant's
lagging weight or a strike of `t` (what needs integrating, a spring or a flock, is integrated from its start on a fixed grid and
memoised), so a frame rendered offline at `t` is the frame the player shows at `t`, scrubbed either way.

## What each creature is built from

| Kind | Parts | Pivots (channels) |
| --- | --- | --- |
| `polyphemus` | the troll big figure of `kit.prop-polyphemus` (60634 back, 60635/60637 body halves, 60638 belt, 60644 legs and skirt, 60672/60673 arms, 60640/60641 hands) and its eye (14769 white 2 x 2 round tile, a 98138 pupil) | hips (`hips.dy`, `body.yaw/pitch/roll`); legs (`leg.R/L.pitch`, `leg.R/L.out`) and knees (`knee.R/L`), cut from 60644; torso at the waist (`torso.lean/twist/roll`); the face cut from the body (`head.yaw/pitch`) with the tusked jaw (`jaw`); the eye (`eye` 0 open, 1 half, 2 shut, 3 put out: a replacement pupil; `eye.x/y` where it looks); shoulders (the toy's: `arm.R/L.pitch`, `arm.R/L.out`); elbows cut from the arm moulding (`elbow.R/L`); wrists (the toy's: `hand.R/L.roll`) |
| `laestrygon` | the same troll, the helmet 60636 for a head | as Polyphemus, without the eye |
| `ram` | the goat 95341 of `kit.prop-ram`, recoloured (white, black, grey, tan) | body (`body.dy/pitch/roll/yaw`), head and neck (`head.yaw/pitch`), tail (`tail.pitch/yaw`), four legs at the shoulder or hip (`leg.FL/FR/HL/HR`, `leg.*.out`) and knee or hock (`knee.*`) |
| `dog` | the German shepherd 92586 of `kit.prop-dog` and `kit.prop-argos` (brown, black, white, tan) | as the ram, and both ears (`ear.L/R` laid back or pricked, `ear.*.flick`) |
| `cattle` | the cow 64452p01 of `kit.prop-cow`: the body 64779c01 cut, the head 64835p01c01 on the toy's own joint, horns 13564 | as the ram |
| `scylla` | six necks of 46 Technic ribbed-hose segments 71944k02 each (the set piece's), six dragon heads 6027 | per neck N 1..6: `neckN.x/y/z` (the head's target from its root), `neckN.slack` (a bow or an S), `neckN.head` (the head's pitch). The segments keep their spacing: each neck is laid along a curve of its own fixed length |

Where the toy has a joint the rig uses it; where it has not, the set piece's part is cut on straight seams into the pieces that
move (`tools/creatures/build.js`: every triangle and edge of the part is clipped against the kind's region boxes, so a seam is a
saw cut, and the pieces are written once into `odyssey/creatures/parts/<kind>.mpd`, one sub-file per piece, colour 16 kept so
a rig recolours its animal; the Laestrygonians use Polyphemus's pieces).

Every channel has limits (`kind.channels`, all of them in `OdysseyCreatures.CLAMP` as `'kind:channel'`); `rig.clamp(v)` holds
them. The page lists every channel with its limits and what it does.

## Frames

A creature is authored in its own LDraw frame: LDU, y down, the ground at y 0, facing -z (x < 0 is its right). It stands in the
take's world (y up, a figure facing +z at heading 0, the same world units the keyframes' props use) by its root channels:

    world = T(root.x, root.y, root.z) . RY(root.h) . RX(root.pitch) . RZ(root.roll) . S(scale) . FLIP      FLIP: (x, y, z) -> (x, -y, -z)

in the order the choreography player turns a minifig (Euler 'YXZ'). `scale` is the rig's (`define(kind, {scale})`), as a
keyframe prop's `scale`: the lead ram of B09-S10 is 2.4, Polyphemus 1.4 to 1.7.

## The API

    const rig = OdysseyCreatures.define(kind, { id, scale, colour })     // colour: a name from the kind's colours or an LDraw code
    rig.channels                       // [{name, min, max, rest, unit, doc}] (root.* first)
    rig.rest(), rig.preset(name)       // {channel: value}; presets: stand, sit, crouch, roar, sprawl (giants); graze, lie (ram);
                                       // bark, lie, sit (dog); graze, fallen (cattle)
    rig.clamp(v)
    rig.pose(v)    -> { nodes: {id: M}, world: W, local: {id: M} }        // M: 12 numbers [x y z a b c d e f g h i], LDraw's order;
                                       // a node's matrix takes its pieces from rest (the creature frame) to the world
    rig.rows(v, { frame: 'world' | 'ldraw' }) -> [{ node, file | part, col, m }]    // the posed creature as placed LDraw parts
    rig.ldr(v)                         // one frame as an LDraw model (its node files are the kind's MPD's sub-files)
    rig.anchor(name, v) -> M           // an anchor's frame, turned with its node, in the creature's axes but at world scale
    rig.point(name, v) -> [x, y, z]
    rig.attach(THREE, group, meshOf)   // once: a group per node under `group`; meshOf(fileOrPart, colour) returns a THREE object
                                       // in the LDraw frame of that file or part (the take's own part meshes, or the MPD's pieces)
    rig.apply(v)                       // every frame: the node groups' matrices, the replacement eye's visibility

Anchors: giants `grip.R`, `grip.L` (a man held, a stake, a rock), `head`, `brow`, `eye`, `mouth`, `lap`, `foot.R`, `foot.L`;
quadrupeds `belly` (a man clinging beneath, face up), `back` (a giant's hand on it), `head`, `mouth`; Scylla `jaw1` to `jaw6`
(a seized rower). A rider is placed by `M = rig.anchor(at, v) . T(offset) . R(turn)`, the offset in world units along the
creature's own axes (y toward its belly, -z its front).

### Procedures (channels at t)

    OdysseyCreatures.gait(rig, t, { path, gait, blend, stance, y, base, h0 })
      path   keys [[t, x, z(, 'linear')], ...] in the world, or a function t -> [x, z]
      gait   'walk' | 'trot' | 'run' | {stride, duty, lift, crouch, bob, phase: {FL, FR, HL, HR}} | a schedule [[t, gait], ...]
      stance LDU the feet are planted out from under the hips (a man slung beneath)
      -> channels (root.* from the path), and v._feet {leg: {at, planted, u, cyc}}
    Each leg runs its own phase clock (arc length over stride, integrated on a fixed grid, plus the leg's offset), so a change of
    speed or of gait never makes a phase jump. A foot is planted where its hip passes over at mid-stance and stays there until it
    lifts; it swings on an arc to the next plant; the legs are solved to their feet (hip and knee in the leg's plane, turned out
    on the hip against the body's roll). Standing still the clocks stop with it; a turn on the spot is counted as distance, so it
    steps round. Measured (tools/creatures/test.js): planted feet move 0.02 to 0.13 LDU a frame (walk to run).

    OdysseyCreatures.heavy(rig, t, { path, stride, duty, w, z, shake, crouch, lift, base })
      The giant's walk: the body follows the path through a spring (w stiffness, z damping: it lags, then carries on past a stop
      and rocks back), faces where it means to go, rolls over the planted foot (a waddle), bobs down onto each footfall; the legs
      are solved to their feet. v._fx.shake is a ring that decays after each footfall (offset a camera or the set by it),
      v._fx.falls lists the footfalls of the last 0.6 s (dust where they landed).

    OdysseyCreatures.reach(rig, v, 'R', [x, y, z])            one hand
    OdysseyCreatures.reach(rig, v, [['R', p], ['L', q]])       both, sharing the torso
      Damped least squares over the torso's twist and lean, each shoulder's pitch and out, each elbow, from the pose given.

    OdysseyCreatures.grope(rig, t, { center, width, depth, period, pat, hover, palm, surface, base, hand })
      The blind search: each hand sweeps its own half of what is in front of the giant, reaches in and out, pats down; surface(x, z)
      returns the world height of whatever is there (the rams' backs) and the palm rests on it, never through. v._target, v._touch.

    OdysseyCreatures.herd({ n, path, abreast, gap, spacing, spread, seed, speed, separation })
      A flock following the leader's path in a formation (rows of `abreast`, `gap` apart, `spacing` behind one another) with
      separation, integrated from its start on a fixed 1/60 s grid: .at(i, t) -> {x, z, h, s}, .path(i), .channels(rig, i, t,
      gait, extra), .slots (edit a slot's side and back to put the lead ram last and alone).

    OdysseyCreatures.strike(rig, t, { targets, t0, strike, hold, lift, liftTo, delays, base })
      Scylla's six heads: coiled and swaying, drawn back, striking at their targets (world) at t0 plus a stagger, holding (the
      seizing: v._fx.seized), lifting toward the cleft.

    OdysseyCreatures.throwArc(t, { from, to, t0, t1, g })     a thrown rock's world position (a parabola under g)
    OdysseyCreatures.follow(fn, t, { w, z, t0 })               the spring on its own

### A creature actor in a scene sheet (odyssey-choreo/1)

A sheet holds its creatures beside its actors (so the minifig player never clamps a creature's `head.pitch` by a minifig's limits):

    "creatures": {
      "polyphemus": { "kind": "polyphemus", "scale": 1.4, "at": [x, y, z, h], "layer": "abs" | "add",
        "procs": [ { "type": "preset", "name": "sit" },
                   { "type": "grope", "from": 4, "to": 50, "fade": 0.5, "center": [0, 100, 0], "width": 200 },
                   { "type": "gait" | "heavy" | "reach" | "strike" | "herd", "from", "to", "fade", ...params } ],
        "channels": { "head.yaw": [[t, v, ease], ...], "eye": [[0, 2]], "jaw@life": [...] },
        "riders": [ { "actor": "odysseus", "at": "belly", "from": 23.4, "to": 53.0, "offset": [0, 22, -8], "turn": [rx, ry, rz] } ] } }

`OdysseyCreatures.fragment(id, kind, opts)` makes one. `OdysseyCreatures.sample(sheet, id, t)` returns `{ v, fx, riders, rig }`:
the rest pose (and `at`), each procedure over its span faded in and out, then the keys (absolute keys replace the procedures'
values; with `layer: 'add'` they add; layers `channel@name` sum), clamped, sampled on the sheet's step (twos) like the actors.
`riders` gives each rider's world matrix (a minifig's figure frame: set its position and rotation from it).

## Wiring it into the film (for the engine)

1. Load `film-readymades/creatures.js` with `choreo.js` in the player bundle.
2. In the take, for each creature in the sheet's `creatures`: hide its set piece (the prop named in the keyframes: `polyphemus`,
   `polyphemusRoar`, `polyphemusSprawl`, `ram`, `ramBlack`, `dog`, `dogBlack`, `dogWhite`, `argos`, `cow`, `cowRed`,
   `laestrygon*`, `antiphates`, `scyllaStrike`, `scyllaLift`), `define` the rig with the prop's scale and colour, and `attach`
   it to a group in the scene with a `meshOf` that builds a part's mesh the way the player builds set pieces, and a cut piece's
   from `odyssey/creatures/parts/<kind>.mpd` (the pieces are flat LDraw: triangles, quads and edges, no sub-file references).
3. Every frame, after the actors: `const s = OdysseyCreatures.sample(C, id, t); rig.apply(s.v);` then place each rider's
   figure from `s.riders[i].m` (and mark the rider as carried: the blocking must not put it on the floor), and add `s.fx.shake`
   to the camera for a giant's footfalls.
4. The compiler (tools/perform) can emit a creature's intents as procedures: HERD and the flock: `herd`; walk, run, PURSUE, FLEE:
   `gait` with a path and a schedule; the giant's steps: `heavy`; SEIZE, CARESS, GROPE: `reach` / `grope` to a man's or a back's
   anchor, then a rider on `grip.R`; THROW: a `reach` overhead then `throwArc` for the prop; DIE: keys over `lie` and `root.roll`
   (see the Argos film); Scylla's STRIKE and LIFT: `strike` with the rowers' positions, riders on `jawN`.

## Checks

`node tools/creatures/test.js` (120 checks: definitions, limits, rest identity, pieces present, determinism in any order, feet
that do not slide or sink, reach, strike, sheets). `node tools/creatures/films.js --out <dir> [--sheets <dir>] [name ...]`
renders the test films on the CPU and writes what each measured of itself into `checks.json`; `node tools/creatures/page.js`
makes the page.
