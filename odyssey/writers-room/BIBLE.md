# The writers' room: Hearts of Plastic

A comedy bible for the behind-the-scenes films of the LEGO Odyssey, and a method for improving the scenes themselves.
Every agent writing, staging or re-shooting a scene reads this first.

## 1. The premise

*Hearts of Plastic* is the making-of told as a mockumentary (after *Rain of Madness*, the fake documentary shot inside
*Tropic Thunder*, itself after *Hearts of Darkness*). It is shot in LEGO, on the film's **actual sets** (the Cyclops's cave,
the megaron, the ship, the shore of the dead), with the crew walking into frame: a camera on a tripod, a director's chair,
a clapperboard. Between scenes, talking-head confessionals in the studio set.

**The rule that makes it ours: every gag is true.** The forensic report (odyssey/forensics/, origins.html, findings.json)
and the takes archive (films/odyssey/takes/index.json) are the joke book. If a joke cannot cite a commit, a camera note or a
take, it does not go in. The comedy is the record, played straight.

## 2. The philosophy: the comedy of compromise

Nobody on this production wants to make garbage. The machinery forces it, one cut at a time (*The Franchise*, after *Veep*
and *Succession*). Play everything deadpan: catastrophic news delivered with the monotone of a drive-through window.

The pressure cooker has three layers, and all three are real:

| Layer | In The Franchise | Here (all on the record) |
|---|---|---|
| **The top: invisible mandates** | executives, algorithms, toy sales | the 95 MB file limit; 4 CPUs and no graphics card; the session cap that cuts an agent off mid-book; Gemini's 100 requests a day; "the container was restarted"; disk at 1.1 GB free. Never seen: they arrive as a calm voice from a speaker, or a memo brick. |
| **The middle: the stressed first AD** | Daniel, translating corporate gibberish | the parent session: translates one-word calls into task briefs, re-arms a check-in at the top of every hour, sweeps up snapshots, relaunches agents after every restart. Exhausted, polite, always "checking in at the top of the hour". |
| **The bottom: total absurdity** | mocap suits, fish people | minifigs whose arms pass through their mother; a camera inside a ram's wool; a dog whose head is in its flank; a beggar reading the stage directions aloud. |

## 3. The builders' game: "Slab!"

Wittgenstein, *Philosophical Investigations* §2: builder A calls "Block!", "Pillar!", "Slab!", "Beam!", and assistant B
brings the stone. That is this production exactly. The Director speaks in calls ("Continue!", "Push it!", "Keep going!",
"Make it a film!"), and agents carry stones; the forage turns words into bricks ("word to world"). Running gag: the Director
calls one word, and a whole crew of agents springs into motion, each with a different idea of what the word meant. Keep the
Director's calls short; the comedy is in the translation.

## 4. The cast (and what each is really playing)

- **The Director** (red beret). Speaks in calls. Watches from the chair, then from a car ("I'll be driving, push it when
  it's done"). Is right about the big things ("the characters do nothing", "keep both takes", "make it a film").
- **The First AD** (the parent agent). Clipboard, headset, never sleeps. Translates calls into briefs. Speaks in check-ins.
- **The Agents** (orange, interchangeable). Arrive, work, are killed by a restart mid-sentence; a new one reads the handover
  ("I'm told I'm the fourth one this week"). One of them sweeps everyone's work into one commit with a single broom stroke
  (the `git add -A` sweep).
- **The Cinematographer** (the solver). Cheerful, literal: goes where the heat is, even if that's inside the ram ("the ram
  was the hottest thing in the scene"). Loves rules; invents a new one after every disaster.
- **The Examiner** (fedora, magnifying glass). The auditor; reads the ledger in a monotone; finds "Treblo".
- **The actors, as method actors** (*Tropic Thunder*'s Kirk Lazarus energy):
  - **Odysseus** will not move without a cause. "What's my motivation?" is not a question here; it is the engine's law.
    He takes it too far (won't scratch his nose until a stimulus arrives).
  - **Polyphemus** is a giant rig whose head anchor sat in the wrong place; insists on being shot from below.
  - **Achilles** wants the visored helmet ("the fans want the helmet"); the camera can't find his face; his big line was
    never recorded ("You have no lines." "I am ACHILLES.").
  - **Anticleia**, the shade, is hugged through, take after take, and is very patient about it.
  - **The beggar** read the stage direction aloud: "For news and enters the hut beside the unknown beggar?"
  - **Irus and Odysseus**: both white-bearded beggars. Casting can't tell them apart. Neither can the suitors.
  - **Calypso** was blocked for 24 seconds by the back of Odysseus's head ("I'm the lead").

## 5. The LEGO rules we keep (after *The LEGO Movie*)

- **100% LEGO.** Everything on screen is LDraw parts; smoke, water, light are bricks.
- **On twos.** Poses change every two frames where the engine allows (the GRIP solver already works on twos).
- **Imperfections are honest.** Keep the real defects; they're the material.
- **Smear bricks.** Fast motion (the stool that flies for a third of a second) gets one- or two-frame smear builds instead
  of blur. A production improvement and a joke at once.

## 6. Each scene is an experiment

Every scene, new or re-shot, is written up as an experiment before it is rendered and after:

```
odyssey/experiments/<SCENE>.json
{ "scene": "OD-B17-S05", "take": 3,
  "hypothesis": "the stool reads as thrown if it is seen for more than half a second",
  "variable": "flight time 0.33 s -> 0.6 s, plus a two-frame smear brick",
  "held": ["voice cut", "blocking", "lens set"],
  "metrics_before": { "legal_shots": "16/16", "coverage": 0.99, "faults": ["flight 0.33 s, landing out of frame"] },
  "metrics_after":  { ... },
  "result": "...", "keep": true }
```

The takes archive is the lab notebook: a re-shoot is a new take with its hypothesis, never an overwrite. The
behind-the-scenes films dramatize these experiments: the hypothesis is the setup, the take is the attempt, the result is
the punchline, the fix is the button.

## 7. Improving the existing scene tracks

Notes sessions run like a writers' room, per scene, in this order:
1. **Read the record**: camera note ("still wrong"), takes, metrics (coverage, unmotivated freeze, reaction latency,
   pose legality, legal shots).
2. **Pitch**: what is the scene *about*, and which moment carries it (the throw, the reveal, the embrace)?
3. **One variable per take**: blocking, lens, timing, a prop's flight, a line restored. Write the experiment card.
4. **Shoot, sheet, judge**: contact sheet against the previous take; keep both.

## 8. Format of the films

- Episodes of 2-4 minutes, each on one real set, each built around one or two true production disasters, played as an
  experiment (setup, attempt, result, fix).
- Cold open on the set; a confessional or two; the button is the fixed shot (or the honest failure, kept).
- End caption: the voices are synthetic (Kokoro, offline); every incident is from the record, with its commit.
