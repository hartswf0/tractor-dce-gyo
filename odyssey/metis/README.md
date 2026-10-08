# The Mētis mod line

Test scenes for the LEGO Odyssey that ask the world to carry the action: a sea that moves the raft, a sky the steersman
reads, a hall whose doors and pegs decide who lives. They follow the *Mētis Mod Line* fieldbook (7 October 2026, Watson
Hartsoe's working reference; it is not in this repository, because its reference images belong to their makers).

The rule of the line: **keep one performance and change how the world around it is made.** A scene's performance, voice
clock and kit stay ours. A host (this renderer now; a game later, through an adapter) only renders it. Every test keeps its
failed takes beside its passed ones.

## Where things go

| Folder | What is in it |
|---|---|
| `scenes/<id>.json` | the scene record (below): what the take is made of and what it must prove |
| `looks/<name>.json` | a reusable look: sky, sea, light sources, exposure, palette (e.g. `night-at-sea`, `hearth-hall`) |
| `evidence/<id>/` | small contact sheets, close sheets and the acceptance checks of each take, passed or failed |

Films still go to `films/odyssey/` (and `films/odyssey/tests/` for tests), takes to `films/odyssey/takes/`, experiment cards
to `odyssey/experiments/`. Game adapters (`adapters/`) and commercial game files are not kept here.

## The scene record

The record names the existing ids, so that text, voice and body stay traceable. Times are relative to the timed turn.

```json
{
  "scene": "OD-B12-S03",
  "turns": ["OD-B12-S03-T01", "..."],
  "assembly": "the kit or location asset and its version, e.g. location.odyssey-od-b12-s03 @ <commit>",
  "actors": [{"id": "odysseus", "wardrobe": "journey"}],
  "cause": "the song draws Odysseus; the binding stops him leaving",
  "contacts": ["torso-rope", "rope-mast", "oar-water"],
  "clock": "the recording's segments, with local cue offsets",
  "world": {"sea": "look:night-at-sea", "sky": "the Bear on the left hand", "course": "island bearing 40"},
  "camera": ["island wide", "rope and ear insert", "strain close"],
  "look": "looks/<name>.json, plus practical lights",
  "adapter": "native",
  "checks": [{"test": "the rope stays anchored while he strains", "passed": null, "evidence": "evidence/OD-B12-S03/rope.jpg"}],
  "capture": {"take": "films/odyssey/takes/OD-B12-S03/take2.mp4", "renderer": "tools/export-odyssey.js @ <commit>", "outcome": ""}
}
```

`adapter` is `native` (this renderer) for every test here. `valheim`, `gmod` and `captured-plate` are the fieldbook's later
host routes, and each would need its own adapter and its own passed gates. Importing a mesh is not the same as importing a
behavior.

## Acceptance is cinematic

A shot passes when its action and consequence are legible, its bodies touch the world, and its continuity survives the
cut. More stars, polygons or reflections are not a pass. Each test is judged from a contact sheet and a close sheet, with
the captions off where the test says so.

## The proofs built here (native)

1. **Raft and horizon** (`OD-B05-S05`). Calm stars, with one named constellation readable as a fixed brick pattern; then the
   wind's arrival, with sail, deck and body answering the same gust; then the loss of the raft. The horizon and the moon do
   not jump. His hands stay on the support until the named release.
2. **The Sirens on a working sea** (`OD-B12-S03`). The island stays where the viewer can find it without narration; the
   oars enter the water together; the rope stays anchored to mast and torso while he strains.
3. **The hall's causal map** (`OD-B21-S07` / `OD-B22-S01`). One room at night by hearth and torch: the threshold, the twelve
   axes on one line, the weapon pegs (full, then empty), the suitors' tables, and the doors that will close. A viewer with
   captions off can explain the turn of the room.

The fieldbook's second proof, a minifig in the bed chamber compiled into Garry's Mod, needs a Windows machine with the game.
It waits for that machine; its native counterpart is the Bed's take 4.

## The clipping gate (bodies do not run through things)

A take is kept only if `tools/metis/clip.js` reports **no visible unintended clipping lasting about 0.25 s or more**: no head
through a head, no body through a body or a hull, no feet sunk into a floor or deck, no walk through a table or a column, no
one on deck sunk into the sea, wherever the shot at that moment shows it. The scored contacts (a grip, an embrace, a hand on a
shoulder, a man under a ram) are allowed within their tolerances; the shades passing through the living are deliberate and are
reported apart. Run it on the take before it replaces the published film, and keep its JSON beside the scene record:

```
NODE_PATH=/opt/node22/lib/node_modules node tools/metis/clip.js OD-B12-S04 --take films/odyssey/OD-B12-S04-performed-r2.json --gate 0.25
```

It writes `odyssey/metis/clip/<id>.json` (the intervals: time range, who, what, against what, depth in figure heights, seconds
seen and the shot) and stills of the worst three to `odyssey/metis/evidence/<id>/clip-<n>.jpg`; `--gate 0.25` exits 1 when the
take fails. The rules, tolerances, validation and limits are in the tool's header; the audit of the published films is in
`clip/AUDIT.md`.
