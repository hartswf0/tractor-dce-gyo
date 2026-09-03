ZETTEL

ID:
Z-CASTLE-EXTENDED-STIGMERGY-001

TITLE:
Construction Blocks Themselves Can Carry the Coordination State

SOURCE:
Justin Werfel, Yaneer Bar-Yam, Radhika Nagpal — “Construction by Robot Swarms Using Extended Stigmergy” — 2005. 12

PASSAGE:
[PARAPHRASE] Werfel, Bar-Yam, and Nagpal describe robots constructing predefined structures using local behaviors while limited communication capabilities embedded in the building blocks provide enough structural information to support construction without detailed global plans. 13

RESEARCH OBJECT:
This suggests a stranger Hogwarts architecture.

Do not make the central LLM remember:

which subassembly is complete,
what operation is next,
where an interface lies.

Let SUBASSEMBLIES expose machine-readable local state.

A tower could report:

COMPLETE.
OPEN_INTERFACES = {east_3, roof_2}.
DEPENDENCY = bridge_pending.
DO_NOT_CLOSE = stair_pending.

The block becomes part of the control system.

LOCAL MOVE:
Move state from CONTEXT MEMORY into ADDRESSABLE CONSTRUCTION OBJECTS.

SOURCE TERMS:
“extended stigmergy”
“structural knowledge”
“building blocks”
“local behaviors”
“construction”
“environmental information”

WHAT BECAME STRANGE:
A semantic subassembly can literally carry the information required to operate on it.

This makes the assembled object and the orchestration state partially coincide.

QUESTION:
What is the minimum metadata each Hogwarts subassembly must expose so that agents can coordinate locally without reconstructing global state?

DEEPER QUESTION:
Does a smart construction object turn distributed assembly into something closer to packet routing than centralized planning?

MECHANISM:
construct subassembly
→ attach metadata/state
→ future agent encounters it
→ reads local state
→ selects permitted next operation
→ updates structure and metadata.

FORMAL SHIFT:
<CASTLE AS PASSIVE TARGET>
→ <CASTLE AS ACTIVE STATE-BEARING MEDIUM>
→ [LOCAL READ/WRITE]
→ <DISTRIBUTED ASSEMBLY CONTROL>

SOURCE FORMALISM:
The cited system extends stigmergy by increasing the information available through the blocks that form the environment. 14

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

Subassembly node H exposes:

H.state = {
completion,
open_interfaces,
unresolved_dependencies,
local_constraints,
policy_cache_key
}.

Agents retrieve H.state only when operating near H.

TENSION:
Adding rich metadata may simply relocate the global representation rather than eliminate it.

MISSING:
A comparison of local metadata complexity against centralized world-state complexity.

BOUNDARY:
The Werfel system concerns much simpler construction than a heterogeneous LEGO castle.

CITATION TRAIL:
[[Z-CASTLE-STIGMERGIC-MEMORY-001]]
→ extended stigmergy
→ smart structural blocks
→ addressable Hogwarts subassembly state.

TEST:
Build a simulator where subassemblies can expose progressively richer local state.

Measure how central context requirements fall as environmental state becomes more informative.

PLATFORM:
[[CASTLE AS COGNITIVE INFRASTRUCTURE]]

LINKS:
[[Z-CASTLE-STIGMERGIC-MEMORY-001]]
[[Z-HOGWARTS-HIERARCHICAL-SLAB-001]]
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]

BIBTEX:
@techreport{werfel2005stigmergy,
author      = {Justin Werfel and Yaneer Bar-Yam and Radhika Nagpal},
title       = {Construction by Robot Swarms Using Extended Stigmergy},
institution = {MIT Computer Science and Artificial Intelligence Laboratory},
number      = {AIM-2005-011},
year        = {2005}
}