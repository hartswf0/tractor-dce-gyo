ZETTEL

ID:
Z-HOGWARTS-PROMPT-UPSTREAM-001

TITLE:
The Prompt Begins When the Builder Notices the Roof Is Wrong

SOURCE:
Donald A. Schön — Designing as Reflective Conversation with the Materials of a Design Situation — 1992.
Ludwig Wittgenstein — Philosophical Investigations — 1953.
Ava Pun et al. — Generating Physically Stable and Buildable Brick Structures from Text — 2025. 29

PASSAGE:
[PARAPHRASE] Schön places seeing, framing, moving, and recognizing unintended consequences upstream of explicit design moves.

RESEARCH OBJECT:
For Hogwarts, the text entered into the LLM is only the LAST STAGE of prompt formation.

The prompt begins earlier:

render section
→ notice asymmetry
→ compare to target
→ identify relevant relation
→ decide whether discrepancy is structural or aesthetic
→ formulate next instruction.

If research logs only the final sentence, most of the prompt has already disappeared.

LOCAL MOVE:
Treat noticing as part of prompt orchestration.

SOURCE TERMS:
“seeing”
“moving”
“design world”
“unintended consequences”
“move experiment”

WHAT BECAME STRANGE:
“Lower that roof one plate” may contain almost no explicit context because the visual comparison already did the cognitive work.

QUESTION:
Can a prompt trace preserve the perceptual event that generated the linguistic move?

DEEPER QUESTION:
How much expert prompting skill resides in deciding WHAT TO NOTICE rather than HOW TO WORD the subsequent request?

MECHANISM:
current render
→ attention
→ discrepancy detection
→ causal hypothesis
→ linguistic encoding
→ action.

FORMAL SHIFT:
<PROMPT STARTS AT TEXT BOX>
→ <PROMPT STARTS IN SITUATED PERCEPTION>
→ [ENCODE]
→ <VISIBLE INSTRUCTION>

SOURCE FORMALISM:
Schön's account emphasizes seeing-moving-seeing within the design situation.

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

P_t =
Encode(
Notice(Render(S_t), Target),
CurrentFrame_t,
DesiredDelta_t
)

Text-only dataset preserves only P_t.

TENSION:
Including all perception risks expanding “prompt” into the whole cognitive episode.

MISSING:
A principled distinction between prompt-causing observation and merely preceding experience.

BOUNDARY:
Not every visual inspection is part of a prompt event.

CITATION TRAIL:
[[Z-PROMPT-SCHON-002]]
→ seeing-moving-seeing
→ multimodal assembly trace
→ prompt provenance.

TEST:
Record expert assembly prompting with synchronized:
screen,
prompt,
cursor,
selected parts,
render differences.

Predict next prompt from perceptual events versus previous text alone.

PLATFORM:
[[THICK PROMPT TRACE]]

LINKS:
[[Z-PROMPT-SCHON-002]]
[[Z-GEERTZ-EVENT-001]]
[[Z-HOGWARTS-MATERIAL-TALKS-BACK-001]]

BIBTEX:
@article{schon1992designing,
author  = {Donald A. Sch{"o}n},
title   = {Designing as Reflective Conversation with the Materials of a Design Situation},
journal = {Research in Engineering Design},
year    = {1992},
volume  = {3},
pages   = {131--147}
}