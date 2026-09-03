ZETTEL

ID:
Z-CASTLE-DEICTIC-BINDING-001

TITLE:
“The Open Stud Beside This Window” May Scale Better Than Remembering Instance 5291 Forever

SOURCE:
Philip E. Agre — The Dynamic Structure of Everyday Life — 1988.
Polly K. Pook and Dana H. Ballard — “Deictic Human/Robot Interaction” — 1996. 6

PASSAGE:
[PARAPHRASE] Agre developed deictic representation for situated activity rather than relying only on constant global symbols. Pook and Ballard later describe a deictic human-robot strategy in which gestures momentarily bind autonomous routines to a goal and spatial context. 7

RESEARCH OBJECT:
Stable object IDs solve one Hogwarts problem while potentially creating another.

A 6,020-piece system can assign every piece a permanent identifier.

But situated building often does not need:

INSTANCE_5291
INSTANCE_5292
INSTANCE_5293.

It needs indexical roles:

THE PART IN HAND.
THE CURRENT OPEN STUD.
THE SUPPORT BELOW THIS ARCH.
THE PREVIOUSLY COMPLETED WINDOW.
THE OBSTRUCTION.

These roles can bind dynamically to whatever currently occupies the relevant practical relation.

LOCAL MOVE:
Add DEICTIC BINDINGS above stable IDs.

SOURCE TERMS:
“deictic representation”
“indexicality”
“binding”
“goal behavior”
“spatial context”
“situated”

WHAT BECAME STRANGE:
Persistent identities may be essential to the database while being toxic to the reasoning interface.

The world state can maintain exact identity.

The language-game can reason with temporary practical roles.

QUESTION:
When does global stable naming improve long-horizon assembly, and when does it impose unnecessary binding load on the model?

DEEPER QUESTION:
Could local shorthand become extremely precise because the environment dynamically binds indexical expressions to current affordances?

MECHANISM:
stable world database
→ current situation
→ establish temporary bindings:

THIS_GAP = connector_481
PART_IN_HAND = instance_5291
SUPPORT = subassembly_37

→ reason/action
→ bindings expire or update.

FORMAL SHIFT:
<GLOBAL SYMBOL FOR EVERY OBJECT>
→ <STABLE DATABASE + DEICTIC WORKING BINDINGS>
→ [SITUATED REFERENCE]
→ <LOWER BINDING LOAD>

SOURCE FORMALISM:
Agre's work contrasts constant-symbol planning with situated deictic representation.

Pook and Ballard's teleassistance binds routines temporarily to goals and spatial context. 8

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

World:
ID(p) persistent.

Working context:
Role_t → ID(p).

Example:

CURRENT_OPEN_INTERFACE
→ connector_4103_7.

The LLM reasons over Role_t.

The executor resolves Role_t against authoritative state.

TENSION:
Deictic reference becomes dangerous if multiple candidates satisfy the role.

MISSING:
A confidence rule for when deixis must fall back to explicit identity.

BOUNDARY:
Deictic representation does not remove the requirement for an authoritative identity layer.

CITATION TRAIL:
[[Z-HOGWARTS-DEIXIS-001]]
→ Agre deictic representation
→ Pook/Ballard teleassistance
→ dynamic assembly binding.

TEST:
Run identical assembly tasks using:

global IDs only,
natural-language descriptions only,
stable IDs + automatically resolved deictic roles.

Measure binding errors and prompt length.

PLATFORM:
[[HOGWARTS LANGUAGE-GAME]]

LINKS:
[[Z-HOGWARTS-DEIXIS-001]]
[[Z-HOGWARTS-BUILDER-GAME-001]]
[[Z-CASTLE-FIELD-AFFORDANCES-001]]

BIBTEX:
@phdthesis{agre1988dynamic,
author = {Philip E. Agre},
title  = {The Dynamic Structure of Everyday Life},
school = {Massachusetts Institute of Technology},
year   = {1988}
}

@article{pook1996deictic,
author  = {Polly K. Pook and Dana H. Ballard},
title   = {Deictic Human/Robot Interaction},
journal = {Robotics and Autonomous Systems},
volume  = {18},
number  = {1--2},
pages   = {259--269},
year    = {1996},
doi     = {10.1016/0921-8890(95)00080-1}
}