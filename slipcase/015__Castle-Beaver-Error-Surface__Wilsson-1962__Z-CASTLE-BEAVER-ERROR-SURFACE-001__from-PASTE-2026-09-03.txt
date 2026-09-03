ZETTEL

ID:
Z-CASTLE-BEAVER-ERROR-SURFACE-001

TITLE:
The Beaver Does Not Need a Representation of Dam Integrity If the Leak Recruits Repair

SOURCE:
Lars Wilsson — “Observations on the Dambuilding Behavior of the Beaver (Castor Fiber L.)” — 1962. 41

PASSAGE:
[PARAPHRASE] Wilsson's experiments reported that dam-building was released by comparatively simple stimulus situations, notably acoustic cues from rapidly running water and visible indentations in the dam, while several other water-related stimuli did not elicit the same construction response. 42

RESEARCH OBJECT:
The useful lesson is more specific than:

SIMPLE INSTINCTS ARE GOOD.

The beaver system has an ERROR SURFACE embodied in the environment.

A subset of dam failures produces cues that recruit the behavior capable of changing those failures.

For Hogwarts, the analogue is not simply COLLISION = ERROR.

It is designing observables whose appearance naturally selects the appropriate repair routine.

NOT_SEATED
→ reseat routine.

UNSUPPORTED
→ support routine.

CAVITY_CLOSING_TOO_EARLY
→ dependency check.

LOCAL MOVE:
Design errors so their representation already narrows the repair policy.

SOURCE TERMS:
“stimulus-situation”
“released”
“acoustical stimuli”
“indentations”
“dam-building activity”

WHAT BECAME STRANGE:
A good error code may do more than report failure.

It can route directly into the family of actions capable of fixing that failure.

QUESTION:
Can each common assembly failure be paired with a low-cost environmental cue that invokes a narrow repair policy before LLM deliberation?

DEEPER QUESTION:
What failure classes resist simple cue-to-repair mappings and therefore genuinely require model-based reasoning?

MECHANISM:
world deviation
→ diagnostic environmental cue
→ reflex/policy family recruited
→ local repair
→ cue disappears.

FORMAL SHIFT:
<ERROR → GENERAL REASONER>
→ <ERROR CUE → MATCHED REPAIR ROUTINE>
→ [VERIFY]
→ <ESCALATE ONLY IF CUE PERSISTS>

SOURCE FORMALISM:
Wilsson reports selective stimulus conditions associated with release of dam-building behavior. 43

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Cue taxonomy:

c_i → π_repair_i.

Escalate to deliberation iff:

π_repair_i fails k times
or
cue is ambiguous between several repair families.

TENSION:
Beaver behavior depends on ecological context beyond a single running-water cue; simplistic stimulus-response retellings overstate the result.

MISSING:
A LEGO error taxonomy empirically organized by which cues predict which successful repairs.

BOUNDARY:
The beaver experiment does not license reducing complex construction to fixed reflexes.

CITATION TRAIL:
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
→ Wilsson
→ error cues
→ matched repair routines
→ escalation after failed reflex.

TEST:
Mine thousands of assembly failures.

Cluster residual signatures and test whether each cluster supports a reliable cheap repair policy.

PLATFORM:
[[BEAVER ATTENTION ROUTER]]

LINKS:
[[Z-HOGWARTS-ERROR-RESIDUAL-001]]
[[Z-CASTLE-EVENT-TRIGGERED-THOUGHT-001]]
[[Z-HOGWARTS-ERROR-COMPILES-POLICY-001]]

BIBTEX:
@techreport{wilsson1962beaver,
author      = {Lars Wilsson},
title       = {Observations on the Dambuilding Behavior of the Beaver (Castor Fiber L.)},
year        = {1962},
number      = {AD632813},
institution = {National Technical Information Service}
}