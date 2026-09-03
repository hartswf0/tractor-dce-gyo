ZETTEL

ID:
Z-LDRAW-HISTORY-001

TITLE:
LDraw Can Contain a Construction History That Is Not the Minimal History

SOURCE:
LDraw.org Standards Board — LDraw File Format Specification — STEP.
LDraw.org — Official Model Repository Specification — MPD structure.

PASSAGE:
[PARAPHRASE] 0 STEP explicitly marks a building step. The OMR's MPD structure also preserves named internal models, and distinct objects such as vehicles or minifigures are represented as separate internal files. 8

RESEARCH OBJECT:
An LDraw/MPD model can contain something Assembly Theory usually throws away:

an ACTUAL chosen construction path.

That gives us at least three histories:

H_manual
the published human instruction sequence.

H_MPD
the community modeler's submodel/step organization.

H_min
the mathematically shortest reusable construction path.

These need not coincide.

LOCAL MOVE:
Put historical path and minimal path into empirical collision.

SOURCE TERMS:
“STEP”
“MPD”
“subfile”
“individual model”
“hierarchy”

WHAT BECAME STRANGE:
Assembly Theory calls shortest possible history physically informative.

LDraw can preserve a non-minimal history actually used by builders.

For a designed artifact, the distance between those histories may itself be more revealing than either alone.

QUESTION:
What is lost when the real 1,000-plus-step human trajectory is compressed into the shortest possible assembly grammar?

DEEPER QUESTION:
Could the gap

|H_actual| - |H_min|

measure pedagogy, accessibility, ergonomics, visibility, stability, or human cognitive constraint?

MECHANISM:
designer architecture
→ instructional decomposition
→ step sequence
→ physical building process.

Separately:

final object
→ repeated-substructure analysis
→ theoretical minimum sequence.

FORMAL SHIFT:
<OBJECT HAS ONE CONSTRUCTION HISTORY>
→ <ACTUAL HISTORY / REPRESENTED HISTORY / MINIMAL HISTORY>
→ [COMPARE]
→ <HISTORY GAP>

SOURCE FORMALISM:
LDraw:

0 STEP

marks a building step. 9

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Define:

Δ_history =
Cost(H_actual) - Cost(H_min)

Then analyze what the “redundant” operations accomplish.

TENSION:
A community MPD author's steps may not reproduce LEGO's official manual and cannot automatically be treated as historical ground truth.

MISSING:
An exact digital transcription of the 71043 official instruction sequence aligned to final LDraw part instances.

BOUNDARY:
Manual step count is not Assembly Index.

CITATION TRAIL:
[[Z-GEERTZ-EVENT-001]]
→ LDraw STEP
→ human instructions
→ minimum assembly path
→ why humans deliberately choose nonminimal paths.

TEST:
Align one complete set's official manual with its final LDraw graph.

Compute:
legal alternative sequences,
shortest sequence,
manual sequence.

Locate every place where the manual intentionally chooses a longer route.

PLATFORM:
[[CONSTRUCTION HISTORY]]

LINKS:
[[Z-GEERTZ-EVENT-001]]
[[Z-RYLE-EXPERIMENT-001]]

BIBTEX:
@manual{ldrawformatspec,
author       = {{LDraw.org Standards Board}},
title        = {LDraw File Format Specification},
organization = {LDraw.org}
}

@manual{ldrawomr,
author       = {{LDraw.org}},
title        = {Official Model Repository Specification},
organization = {LDraw.org}
}