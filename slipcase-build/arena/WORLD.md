# THE WORLD — arena/world.js

One CLI. You (a seed agent) talk to it; it keeps the state, validates every placement,
keeps the field of open ports, emits LDraw, and judges the emitted file blind against
the bar kit (5935 Island Hopper) on the repository's twelve axes.

    cd /home/user/tractor-dce-gyo/slipcase-build/arena
    node world.js <SEED> <command> [args]        # your SEED is S01 … S07; state lives in runs/<SEED>/

## Commands

    init [ground] [colour]         start a fresh world: a 32x32 baseplate (3811) in green (2) by default
    intent <text>                  one line saying what you are building right now (S02 packets echo it)
    tray                           every part this world accepts, as BODY lines, plus colour codes
    field [--k N]                  the N (default 8) open up-ports that most solicit a piece, ranked
    field --level L                every open up-port at level L (plates above the ground; 0 = ground)
    field --near X Z [R]           every open up-port within R LDU (default 60) of (X,Z)
    field --all                    every open up-port (long: ~1000 on an empty baseplate)
    place <part> <colour> ON <port> FACING <n|e|s|w> [OFFSET dx dz]
                                   one placement by relation, never by coordinate
    batch <ops.json>               up to 12 placements in one call: [{"part":"3001","colour":71,"on":"p496","facing":"e","offset":[0,0]}, …]
    bring <part> [colour]          (builder's game) put a part in HAND
    put ON <port> FACING <dir>     (builder's game) place HAND;  put HERE FACING <dir> = on top of LAST
    again AT <port>                (builder's game) repeat the last part/colour/facing at another port
    name <noun>                    (builder's game) every unnamed piece since the last NAME becomes one thing
    instance <noun> AT <port> [MIRRORED]   place a copy of a named thing; emitted as a submodel (0 FILE)
    describe <file.mpd>            (decompile) BODY line + "rests on" for every piece of an existing build
    adopt <groups.json>            (decompile) {"groups":{"noun":[i,…]},"order":["noun",…]} → library + removal-order check
    undo [n]                       remove the last n pieces (counted)
    status                         counts and the shadow number
    judge                          emit + judge the emitted file: per-axis WIN/LOSS vs the kit, structural open share
    emit [file]                    write the MPD (default runs/<SEED>/castle-<SEED>.mpd)
    report                         emit + judge + write runs/<SEED>/report.json   ← run this last
    judge-file <file.mpd>          judge any MPD (S06/S07 use this on composed files)
    report-file <file.mpd> [rounds] write report.json for a composed file            ← S06/S07 run this last

## Ports and placement

A port is an open stud (nothing sits on it). Ports have stable ids p<n>. On the ground plate the
id is computable: for a stud at (x, z), id = 1 + ((x+310)/20)*32 + ((z+310)/20); x and z run
-310 … 310 in steps of 20. Studs created by your pieces get new ids: read them from `field`.

`place P C ON p FACING d`: the part's footprint is rotated by d (e = as drawn, s = 90°, w = 180°,
n = 270°); its minimum-x, minimum-z bottom cell is set ON the port; OFFSET dx dz shifts it by whole
studs. The part's bottom sits at the port's level, so a brick (24 tall) on the ground puts its
studs 3 plates up; a plate (8) one plate up.

The world refuses a placement that CLASHES (its body overlaps another body — catalogue boxes,
approximate for slopes/arches) or FLOATS (none of its cells is over an open stud at that level).
SEATED tells you which studs it took and how many it gives.

Roles: HERE / LAST-TOP = an open stud on top of the last piece; BESIDE:<noun> = an open stud at the
base level next to a named thing.

## What the judge measures

Twelve axes, blind, per axis, never summed, ties to the kit (see GAUNTLET-CONTRACT.md): VOCAB,
COLOUR, SNOT, ROT, POSE, LATTICE, ANATOMY (submodels), REUSE (instanced blocks), SYMMETRY, DENSITY,
SERVICES, STUFF. Plus the shadow number: structural open share = open studs / studs, ignoring the
ground plate. Real kits sit in 0.112–0.431. Below it is an overshoot, not a win.

## Etiquette

Only this CLI. Do not edit world.js, compose.js, other runs, or repository files. Do not use git.
Prefer `batch` once you know the port ids. About 200 world calls is a full run.
