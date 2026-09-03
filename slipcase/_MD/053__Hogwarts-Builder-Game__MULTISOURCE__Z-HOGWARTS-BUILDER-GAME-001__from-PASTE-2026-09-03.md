ZETTEL

ID:
Z-HOGWARTS-BUILDER-GAME-001

TITLE:
“Slab!” Is Not a Prompt Until the World Knows What Bringing a Slab Means

SOURCE:
Ludwig Wittgenstein — Philosophical Investigations — 1953 — §§2, 7, 23.
Peter Kulits and Cordelia Schmid — BrickNet: Graph-Backed Generative Brick Assembly — 2026. 0

PASSAGE:
[QUOTE] Wittgenstein calls the whole “consisting of language and the action into which it is woven” a language-game. 1

RESEARCH OBJECT:
The builder's game becomes technically useful for the Hogwarts problem only when “Slab!” is no longer treated as an instruction string.

It is a move inside a world that already contains:

a current partial structure,
available parts,
learned correspondences,
legal actions,
shared orientation,
an expected next state,
and visible evidence of success.

For a 6,020-piece LEGO castle, the prompt is therefore not:

“place brick 3001.”

It is closer to:

“given THIS partial assembly, THESE available interfaces, THIS target region, and THIS shared history, continue the coordinated building practice.”

LOCAL MOVE:
Translate Wittgenstein's primitive builder into an executable LEGO language-game.

SOURCE TERMS:
“builder”
“assistant”
“slab”
“language-game”
“activity”
“form of life”

BrickNet:
“connectivity”
“build sequences”
“graph-based program representation”

WHAT BECAME STRANGE:
The word “slab” is almost informationally empty compared with an LDraw coordinate.

Yet it can be operationally richer because the rest of its meaning is distributed through the shared activity.

The shortest utterance can require the thickest world.

QUESTION:
What minimum shared state must exist before a compressed LEGO prompt like “repeat that buttress on the east tower” becomes as operationally precise as explicit LDraw code?

DEEPER QUESTION:
Can expert prompting be measured by how much coordination can safely migrate out of explicit tokens and into shared state?

MECHANISM:
shared assembly state S_t

locally learned call u_t
→ resolve object / relation / action
→ execute legal connection
→ S_(t+1)
→ perceptible success/failure
→ future calls become more precise.


FORMAL SHIFT:
<COMMAND STRING>
→ <MOVE INSIDE SHARED BUILDING PRACTICE>
→ [EXECUTE]
→ <WORLD-CONDITIONED MEANING>

SOURCE FORMALISM:
Wittgenstein's builder language begins with four calls tied to learned material responses.

BrickNet represents LEGO generation through relational connectivity rather than unrestricted absolute-pose prediction. 2

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Meaning_G(u_t) =
Action selected by u_t
given:

G_t = {
partial_castle,
inventory,
connector_graph,
target,
history,
roles,
verification
}

Thus:

Meaning("buttress again")
is undefined outside G_t.

TENSION:
A transformer does not literally participate in a human form of life merely because it has state and tool access.

The stronger claim concerns the architecture of practical meaning, not biological or social equivalence.

MISSING:
A LEGO interaction environment in which linguistic compression can be measured against accumulated shared state.

BOUNDARY:
The builder's game does not by itself solve assembly planning.

CITATION TRAIL:
[[Z-PROMPT-LANGUAGING-001]]
→ Wittgenstein builder game
→ BrickNet relational representation
→ situated LEGO command language.

TEST:
Build the same 100-piece structure under two interfaces:

A. every action fully specified in coordinates;
B. progressively learned local calls with shared state.

Measure token count, ambiguity, invalid actions, and recovery after context removal.

PLATFORM:
[[HOGWARTS LANGUAGE-GAME]]

LINKS:
[[Z-PROMPT-LANGUAGING-001]]
[[Z-PROMPT-ACTION-ONTOLOGY-001]]
[[Z-BRICKNET-HOGWARTS-001]]

BIBTEX:
@book{wittgenstein1953investigations,
author     = {Ludwig Wittgenstein},
title      = {Philosophical Investigations},
publisher  = {Blackwell},
year       = {1953},
translator = {G. E. M. Anscombe}
}

@inproceedings{kulits2026bricknet,
author    = {Peter Kulits and Cordelia Schmid},
title     = {BrickNet: Graph-Backed Generative Brick Assembly},
booktitle = {Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition},
year      = {2026},
pages     = {39252--39261}
}