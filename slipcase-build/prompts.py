# -*- coding: utf-8 -*-
"""The seed prompts ("stones"): a few organised, testable prompts for LDraw assembly
by a language model, each grounded in admitted zettels and tied to the gauntlet
axes. STATUS is honest: TESTED means a number in this package came from running it;
PARTIAL means the repo already implements part of it; UNTESTED means nobody ran it.
"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
FIELD = json.load(open(os.path.join(HERE, 'work', 'field', 'field-results.json')))

def _kitrow(k):
    return f"  {k['id']:<28} pieces {k['pieces']:>5}  structural studs open {k['openStructural']:>5}  share {k['openStructuralShare']:.3f}"

def _buildrow(b):
    A = b['variants']['A-close-all']; B = b['variants']['B-ragged']
    jb = b['judgeBefore']; ja = A['judge']; jB = B['judge']
    return (f"  {b['id']:<24} share {b['before']['openStructuralShare']:.3f} → close-all {A['openStructuralShare']:.3f} → ragged {B['openStructuralShare']:.3f}"
            f"   pieces {b['before']['pieces']} → {A['pieces']} → {B['pieces']}"
            f"   bar verdict W/L {jb['wins']}/{jb['losses']} → {ja['wins']}/{ja['losses']} → {jB['wins']}/{jB['losses']}")

kits_tbl = '\n'.join(_kitrow(k) for k in FIELD['kits'] if k['pieces'])
builds_tbl = '\n'.join(_buildrow(b) for b in FIELD['builds'] if not b.get('control'))
ctrl = [b for b in FIELD['builds'] if b.get('control')]
ctrl_tbl = '\n'.join(f"  {b['id']:<24} open/piece {b['before']['openPerPiece']} → close-all {b['variants']['A-close-all']['openPerPiece']} (added {b['variants']['A-close-all']['added']['pieces']} tiles) → ragged {b['variants']['B-ragged']['openPerPiece']} (added {b['variants']['B-ragged']['added']['pieces']})" for b in ctrl)
shares = sorted(k['openStructuralShare'] for k in FIELD['kits'] if k['pieces'])
KIT_BAND = (shares[0], shares[-1])
KIT_MED = shares[len(shares)//2]

README = f"""_PROMPTS/ — the assembly instrument and the seed prompts
=========================================================

00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt   the exact prompt that assembled this package (verbatim)
00__REQUEST-LINE.txt                     the exact request line that preceded the zettel batches (verbatim)
S01 … S07                                seed prompts ("stones") for LDraw assembly by a language model

WHAT A SEED IS
A seed is a prompt template plus the world it presupposes: what the model is shown,
what it must say back, what the world returns, what is measured, and how the seed
can be mutated. A seed without a measure is a slogan. Every seed here names the
gauntlet axes it should move (GAUNTLET-CONTRACT.md in the repository: AX-VOCAB,
AX-COLOUR, AX-SNOT, AX-ROT, AX-POSE, AX-LATTICE, AX-ANATOMY, AX-REUSE, AX-SYMMETRY,
AX-DENSITY, AX-SERVICES, AX-STUFF; gates G-DET, G-KNOWN, G-CLASH, G-FLOAT, G-SCALE,
G-BUFFER, G-BLIND) and one shadow measure the critic does not yet see: the share of
structural studs facing air (defined in S01).

HOW TO TEST A SEED
1. Fix the bar: one real kit (default 5935 Island Hopper, kits/5935-island-hopper.mpd).
2. Fix the target card and seed (card castle, seed 1) so the run is deterministic.
3. Run the builder with the seed prompt and without it. Emit both MPDs.
4. Judge both blind against the bar, per axis, never summed. Ties go to the kit.
5. Also measure the shadow number (structural open-stud share). The kit band is
   {KIT_BAND[0]:.3f}–{KIT_BAND[1]:.3f} across the 16 non-empty kits (median {KIT_MED:.3f}). Landing
   inside the band counts; landing below it is an overshoot, not a win.
6. Keep the seed only if at least one axis flips to WIN and none flips to LOSS.

HOW TO EVOLVE A SEED
Population = the seven seeds plus their mutants. Each seed lists its mutation
operators. Fitness is the vector of per-axis verdicts (never a scalar) plus the
shadow number's distance to the kit band. Selection keeps a mutant only if it is
not worse on any axis (Pareto), which is the gauntlet's own rule. Record every
run as a row: seed, mutation, card, bar, axes before/after, shadow before/after.
The stones are the seeds that survive ten generations without a LOSS flip.

STATUS OF THE SEVEN
S01 FIELD-ROUTING          TESTED (naive version) — numbers below, and in _RESOURCES/field-results.json
S02 RESIDUAL-PACKET        PARTIAL — the gauntlet brief is an axis-level residual; no per-placement residual exists
S03 BUILDERS-GAME          UNTESTED
S04 DECOMPILE-FIRST        UNTESTED — the kit index measures anatomy but nothing disassembles a kit yet
S05 BODY-AND-JOINTS        PARTIAL — computed once in the originating session, not preserved here: UNVERIFIED
S06 EVENT-TRIGGERED-CALL   UNTESTED
S07 CARD-TO-MASSING        IMPLEMENTED in nabugo-brand.js (planForCard); two cards yield two structures

THE ONE TESTED NUMBER
S01 was run in its cheapest form (a closing pass that tiles open studs). Structural
open-stud share, kits first:
{kits_tbl}

Our builds, before → close-all → ragged-only:
{builds_tbl}

Control (the pass applied to two real kits — it tiles over their deliberate open surfaces):
{ctrl_tbl}

Reading: the naive field closes ports {FIELD['builds'][0]['before']['open']}→{FIELD['builds'][0]['variants']['A-close-all']['open']} on the castle and the
kit critic barely notices (W4/L8 → W4/L8). It moves the shore station from W5/L7 to
W6/L6 in the ragged form and fallingwater from W1/L11 to W3/L9 in the close-all form,
and it overshoots every kit's band in the close-all form. So the field must be a field
of SOLICITATIONS (weighted), not a to-do list of every open port — which is what the
zettels said before the number did (Z-CASTLE-FIELD-AFFORDANCES-001,
Z-HOGWARTS-REWARD-SHAPING-TRAP-001).
"""

S01 = f"""SEED S01 — FIELD-ROUTING
"Show the builder the field of open ports, not the castle."

STATUS: TESTED in its naive form (closing pass). The routed-LLM form is UNTESTED.

GROUNDED IN
  Z-CASTLE-FIELD-AFFORDANCES-001      landscape vs field of relevant affordances (van Dijk & Rietveld)
  Z-CASTLE-AFFORDANCE-COMPETITION-001 actions compete before deliberation (Cisek)
  Z-CASTLE-ATTENTION-TAX-INVERSION-001 the tax is making the wrong things explicit
  Z-LDRAW-CONNECTION-GAP-001          LDraw knows where a brick is, not how it connects
  Z-HOGWARTS-REWARD-SHAPING-TRAP-001  closing what looks unfinished can make the build impossible

HYPOTHESIS
A model given the current field of open ports (with the piece in hand) places pieces
that bond, instead of pieces that float or interpenetrate, and its builds approach the
kits' structural open-stud share without being told coordinates.

THE SHADOW MEASURE
A stud faces air when the point 2 LDU above its base, along its own axis, lies inside
no other placement's catalogue box. Structural studs exclude baseplates and the ground
level. share = open structural studs / structural studs. Kit band: {KIT_BAND[0]:.3f}–{KIT_BAND[1]:.3f}.

THE PROMPT (system)
  You are placing one LEGO piece at a time into an LDraw model. You never see the
  whole model. You see the FIELD: the open ports that currently solicit a piece,
  ranked. Each port line reads
    PORT p<n>  on <part desc> (<colour>)  level <y/8 plates>  up|side  ragged <k of n covered>  cluster <w x d>
  and the piece in hand reads
    HAND <part> <desc>  <w x d> · <h> tall · gives <n> up · takes <m>
  Answer with ONE relation, never a coordinate:
    PLACE HAND ON p<n> FACING <north|east|south|west> [FLUSH|OFFSET 1]
  or
    PASS p<n> — <one reason: keep open for <what> | not reachable | wrong colour>
  A port you PASS stays in the field with your reason attached. The world will answer
  SEATED (which studs you took, which you gave) or REFUSED (what you hit, or what floats).

THE PROMPT (turn)
  FIELD (top {8}, of <N> open):
    p1 … p8 as above
  HAND: <BODY line>
  CARD: <one line from the reference card: e.g. "corner tower, 4 studs, 5 courses, cone roof">
  LAST: <SEATED|REFUSED packet from the previous turn>

WHAT THE WORLD RETURNS
  SEATED  took <n> studs of p<n>; gave <m> up, <k> side; field now <N'> open (+new ports listed)
  REFUSED <clash with part … | floats: no port under | off lattice>

MEASURE
  Shadow: structural open share before/after, against the kit band.
  Axes: AX-DENSITY, AX-LATTICE (relation placement is on-lattice by construction),
        AX-SNOT (side-facing ports), AX-REUSE (unchanged: this seed does not name modules).
  Gates: G-CLASH and G-FLOAT must stay green: every SEATED is a bonded placement.

EVIDENCE (naive form: no model, a pass that tiles every open structural stud)
{builds_tbl}
  Control on real kits (the pass is wrong there — kits keep surfaces open on purpose):
{ctrl_tbl}

FAILURE MODE FOUND
  Close-all overshoots below every kit's band; the routed form must rank ports by
  solicitation (raggedness, proximity to the working front, card intent) and let the
  model PASS ports with a reason. That is exactly the "keep this cavity open" line
  in Z-CASTLE-FIELD-AFFORDANCES-001.

MUTATION OPERATORS
  m1  rank ports by raggedness only / by proximity to last placement / by card intent
  m2  field size k = 4, 8, 16
  m3  allow PASS with reason vs. forbid PASS
  m4  include side ports (SNOT) in the field vs. up ports only
  m5  hand chosen by the world (inventory prior) vs. chosen by the model from a 20-part tray
"""

S02 = """SEED S02 — RESIDUAL-PACKET
"The useful part of 'wrong' is the difference it points to."

STATUS: PARTIAL. The gauntlet brief already returns an axis-level residual
("STRUCTURE: … You are at 0.09 (too low); 5935 is at 0.33. Land inside 0.28–0.40").
No per-placement residual exists yet.

GROUNDED IN
  Z-HOGWARTS-ERROR-RESIDUAL-001        YOU PLACED / TARGET / CONSEQUENCE (Lightman, Shinn, Pun)
  Z-CASTLE-PRECISION-WEIGHTED-ERROR-001 weigh the residual by how much the validator can be trusted
  Z-CASTLE-BEAVER-ERROR-SURFACE-001    an error code that already narrows the repair routine
  Z-HOGWARTS-REWARD-TWO-CHANNELS-001   reward and explanation train different things

HYPOTHESIS
A builder that receives a structured residual after every refused placement corrects
the right variable on its next attempt more often than one receiving "refused" or a
scalar, and the correction transfers to the next occurrence of the same motif.

THE PACKET (what the world says after each placement)
  YOU PLACED   <part> <colour> at p<n> facing <dir>
  TARGET       <what the card wanted here: e.g. "curtain wall course 3, crenellated">
  CONSEQUENCE  clash: <parts hit, overlap in LDU> | float: <no port under, gap in LDU>
               | open-port delta: +<gave> −<took> | axis delta: AX-… <ours before → after> vs bar
  TRUST        <validator name>: exact | approximate (AABB) | visual
  REPAIR       <one of: reseat | lower one plate | rotate 90 | change part | leave open>

THE PROMPT (turn)
  LAST: <the packet>
  Then: "Say which field of the packet you are changing, then place again."

MEASURE
  Corrections per refusal (how many turns until SEATED), repeat-error rate on the next
  homologous motif, and the axis the packet named (does it move toward the band?).

MUTATION OPERATORS
  m1  packet with / without REPAIR hint
  m2  packet with / without TRUST line
  m3  scalar only (−1) as the ablation
  m4  packet plus a one-line LESSON the model must write before its next move (Reflexion form)
"""

S03 = """SEED S03 — BUILDERS-GAME
"'Slab!' is not a prompt until the world knows what bringing a slab means."

STATUS: UNTESTED.

GROUNDED IN
  Z-HOGWARTS-BUILDER-GAME-001          the call is a move inside a shared world (Wittgenstein, BrickNet)
  Z-HOGWARTS-DEIXIS-001                "d — slab — there": count, reference, place, orientation
  Z-CASTLE-DEICTIC-BINDING-001         THE OPEN STUD BESIDE THIS WINDOW beats instance 5291 (Agre; Pook & Ballard)
  Z-HOGWARTS-HIERARCHICAL-SLAB-001     "slab" must eventually name a tower
  Z-HOGWARTS-TWO-ASSEMBLIES-001        building the castle builds the language that can build it

HYPOTHESIS
A builder allowed to coin a noun for a completed relation, which the world then
instances as a submodel, reaches the kit's reuse and anatomy bands faster than one
that places pieces one by one — and its prompts get shorter as it goes.

THE PROMPT (system)
  You build by calls, not coordinates. The world keeps the state. Roles you may use:
    HAND, HERE (the port you last seated on), LAST (the last piece), THE OPEN STUD
    BESIDE <named thing>, THE <name> (anything you have named).
  Calls:
    BRING <part> [<colour>]                     the world puts it in HAND
    PUT HERE | PUT ON <role> FACING <dir>       one placement
    AGAIN <role> AT <role>                      repeat the last placement pattern there
    NAME THIS <noun>                            the pieces since your last NAME become one thing
    <noun> AT <role> [MIRRORED]                 instance a named thing (the world writes a 0 FILE)
  The world answers SEATED / REFUSED (packet as in S02) and, after NAME, tells you the
  noun's BODY line (size, height, gives/takes) so you can use it like a part.

MEASURE
  AX-REUSE (instanced blocks), AX-ANATOMY (submodel depth), AX-SYMMETRY (MIRRORED),
  tokens per placement over the run (should fall), and the number of nouns coined.

MUTATION OPERATORS
  m1  forbid NAME (ablation) / allow NAME / require NAME every 12 placements
  m2  deictic roles only vs. stable ids only vs. both
  m3  the world proposes a noun after a repeated pattern (stigmergic) vs. the model must
"""

S04 = """SEED S04 — DECOMPILE-FIRST
"Do not ask how to build it first; ask how it can come apart."

STATUS: UNTESTED. The kit index measures anatomy (kit-index.json) but nothing yet
disassembles a kit into a removable-order plan.

GROUNDED IN
  Z-ASAP-DISASSEMBLY-001               assembly by disassembly (Tian et al., ASAP)
  Z-HOGWARTS-DEMONSTRATION-001         three completed towers specify the fourth
  Z-LDRAW-HISTORY-001                  the MPD carries a real construction history that is not the minimal one
  Z-MANUAL2SKILL-HIERARCHY-001         the manual compiles into a hierarchy before it compiles into motion

HYPOTHESIS
Given a real kit, a model that first lists the order in which pieces can be removed
(each removal must leave every remaining piece supported) produces a build order whose
replay, with the card's substitutions, lands inside the kit's anatomy and reuse bands.

THE PROMPT (turn 1: decompile)
  Here is a kit as a list of BODY lines with their supports (which pieces each piece
  rests on, from the open-port field). List the pieces in an order in which each can be
  removed leaving the rest supported. Group consecutive removals that share a support
  into a named sub-assembly. Output: a tree, not a list.
THE PROMPT (turn 2: rebuild by substitution)
  Replay the tree in reverse as a build order. Wherever the card says <substitution>,
  swap the sub-assembly but keep its BODY line (same footprint and height).

MEASURE
  AX-ANATOMY, AX-REUSE, AX-SYMMETRY against the same kit; G-FLOAT on the replay.

MUTATION OPERATORS
  m1  support from AABB contact vs. from the port index
  m2  grouping threshold: 2, 4, 8 pieces per named sub-assembly
  m3  reverse replay exact vs. with one substitution per sub-assembly
"""

S05 = """SEED S05 — BODY-AND-JOINTS
"Give the piece proprioception: it knows what space it takes and what it can take."

STATUS: PARTIAL / UNVERIFIED here. A BODY line per part and a JOINTS line per placement
were computed once in the originating session (e.g. "3001 Brick 2x4 4x2 · 24 tall ·
gives 8 up · takes 3"); that computation is not preserved in this package, so treat
the format as a proposal and the earlier numbers as unverified.

GROUNDED IN
  Z-CASTLE-MULTIPLE-BODY-SCHEMAS-001   several partial action schemas, not one self-model
  Z-CASTLE-CONTACT-AS-OBSERVATION-001  the click is evidence, not only reward
  Z-LDRAW-CONNECTION-GAP-001           geometry is not connectability
  Z-HOGWARTS-ACTION-GRAMMAR-001        verbs before parts

HYPOTHESIS
A model that must echo a JOINTS line ("takes studs 3,4 of p17; gives 8 up, 0 side")
before the world accepts a placement makes fewer floating and interpenetrating
placements than one that emits LDraw lines directly.

THE LINES
  BODY   <part> <desc>  <w x d> · <h> tall · gives <n> up [· <m> side] · takes <k>
  JOINTS <placement>: takes <studs> of <port owner>; gives <n> up, <m> side; touches <parts>

THE PROMPT (system)
  Every part you may use is listed once with its BODY line. Before each placement you
  write its JOINTS line as a prediction. The world checks it: if the prediction is
  wrong the placement is REFUSED with the true JOINTS line. Say what you learned in
  one line, then place again.

MEASURE
  G-CLASH, G-FLOAT (should be green by construction); prediction accuracy of the
  JOINTS line over the run (should rise); AX-SNOT if side ports are used.

MUTATION OPERATORS
  m1  BODY lines for the 20 most common parts only vs. for every part in the tray
  m2  JOINTS predicted vs. JOINTS reported after the fact (ablation)
  m3  add the port index's exact stud coordinates vs. counts only
"""

S06 = """SEED S06 — EVENT-TRIGGERED-CALL
"The reasoner is scheduled by the castle, not by the clock."

STATUS: UNTESTED.

GROUNDED IN
  Z-CASTLE-EVENT-TRIGGERED-THOUGHT-001 event-triggered control (Tabuada)
  Z-CASTLE-COOK-DING-SCHEDULER-001     change regime at the complicated joint
  Z-HOGWARTS-ATTENTION-BUDGET-001      not every brick deserves a chain of thought
  Z-HOGWARTS-VERIFY-COMPUTE-001        some bricks need thinking, others need checking
  Z-CASTLE-ULTRASTABLE-ESCALATION-001  change policy only when an essential variable leaves its band

HYPOTHESIS
Running the layer generators (SITE→STUFF) unattended and calling the model only on
events reaches the same per-axis verdicts as calling it every placement, at a fraction
of the tokens, and does better at the junctions where the generators refuse.

EVENTS (each is a packet, the packet is the prompt)
  E1 REFUSAL-STREAK   the generator refused k placements in a row at one site
  E2 VALIDATORS-DISAGREE  AABB says clash, port index says seated
  E3 AXIS-LEFT-BAND   an axis that was in band left it after this layer
  E4 NOVEL-MOTIF      a placement pattern with no precedent in the run
  E5 FIELD-STAGNANT   the open-port field has not changed for n placements

THE PROMPT (turn, on event)
  EVENT <id> at <site>: <packet>. Options: continue | change part | change generator
  parameter <name> | name and instance the last k pieces | leave open and move on.
  Answer with one option and one sentence.

MEASURE
  Tokens per run, model calls per run, per-axis verdicts vs. the every-placement
  baseline, and success rate at refusal sites.

MUTATION OPERATORS
  m1  event set {E1} / {E1,E3} / all five
  m2  streak threshold k = 2, 4, 8
  m3  model may change one parameter vs. may rewrite the generator's plan
"""

S07 = """SEED S07 — CARD-TO-MASSING
"The reference card compiles to a build order."

STATUS: IMPLEMENTED in the repository (nabugo-brand.js: CARDS, planForCard, massingPass).
Two cards yield two different structures: builds/card-castle.mpd (182 pieces) and
builds/card-fallingwater.mpd (93 pieces), rendered in builds/*.png.

GROUNDED IN
  Z-MANUAL2SKILL-HIERARCHY-001         manual → hierarchical graph → subgoal → pose
  Z-HOLODECK-CONSTRAINT-COMPILER-001   language specifies relations; a solver spends the coordinates
  Z-HOGWARTS-SPACE-COLLAPSE-001        the inventory is a prior, not a lookup table
  Z-CASTLE-SPACE-AS-COMPUTATION-001    arrange the workspace so geometry does the reasoning

HYPOTHESIS
A model asked to write a CARD (massing in the six Brand layers: site, structure, skin,
services, space plan, stuff) for a reference image produces, through the fixed
compiler, a build that lands in more axis bands than a model asked to write LDraw.

THE PROMPT (turn)
  Here is the reference (image + one line). Write the card, not the model:
    ground <part> ; colours {structure, skin, accent, ground}
    massing: block|wall|terrace|water entries with at/from/to, studs, courses, roof,
             door/window/gate, instances (mirrored positions)
    figures: <count and where> ; props: <list>
  The compiler will build it; you will get the per-axis verdict back and may edit
  the card, never the LDraw.

MEASURE
  All twelve axes against the chosen kit; pieces and blocks; refusals per layer
  (the compiler reports them).

MUTATION OPERATORS
  m1  card fields exposed: massing only / massing + colours / everything
  m2  one edit per round vs. rewrite the card each round
  m3  the model sees the kit's own card (decompiled by S04) as a one-shot example
"""

def seed_files(poml_text, request_line):
    return [
        ('README.txt', README),
        ('00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt', poml_text),
        ('00__REQUEST-LINE.txt', request_line),
        ('S01__FIELD-ROUTING.txt', S01),
        ('S02__RESIDUAL-PACKET.txt', S02),
        ('S03__BUILDERS-GAME.txt', S03),
        ('S04__DECOMPILE-FIRST.txt', S04),
        ('S05__BODY-AND-JOINTS.txt', S05),
        ('S06__EVENT-TRIGGERED-CALL.txt', S06),
        ('S07__CARD-TO-MASSING.txt', S07),
    ]

SEED_META = [
    {'id': 'S01', 'name': 'FIELD-ROUTING', 'status': 'TESTED (naive form)', 'zettels': ['Z-CASTLE-FIELD-AFFORDANCES-001','Z-CASTLE-AFFORDANCE-COMPETITION-001','Z-CASTLE-ATTENTION-TAX-INVERSION-001','Z-LDRAW-CONNECTION-GAP-001','Z-HOGWARTS-REWARD-SHAPING-TRAP-001']},
    {'id': 'S02', 'name': 'RESIDUAL-PACKET', 'status': 'PARTIAL', 'zettels': ['Z-HOGWARTS-ERROR-RESIDUAL-001','Z-CASTLE-PRECISION-WEIGHTED-ERROR-001','Z-CASTLE-BEAVER-ERROR-SURFACE-001','Z-HOGWARTS-REWARD-TWO-CHANNELS-001']},
    {'id': 'S03', 'name': 'BUILDERS-GAME', 'status': 'UNTESTED', 'zettels': ['Z-HOGWARTS-BUILDER-GAME-001','Z-HOGWARTS-DEIXIS-001','Z-CASTLE-DEICTIC-BINDING-001','Z-HOGWARTS-HIERARCHICAL-SLAB-001','Z-HOGWARTS-TWO-ASSEMBLIES-001']},
    {'id': 'S04', 'name': 'DECOMPILE-FIRST', 'status': 'UNTESTED', 'zettels': ['Z-ASAP-DISASSEMBLY-001','Z-HOGWARTS-DEMONSTRATION-001','Z-LDRAW-HISTORY-001','Z-MANUAL2SKILL-HIERARCHY-001']},
    {'id': 'S05', 'name': 'BODY-AND-JOINTS', 'status': 'PARTIAL / UNVERIFIED', 'zettels': ['Z-CASTLE-MULTIPLE-BODY-SCHEMAS-001','Z-CASTLE-CONTACT-AS-OBSERVATION-001','Z-LDRAW-CONNECTION-GAP-001','Z-HOGWARTS-ACTION-GRAMMAR-001']},
    {'id': 'S06', 'name': 'EVENT-TRIGGERED-CALL', 'status': 'UNTESTED', 'zettels': ['Z-CASTLE-EVENT-TRIGGERED-THOUGHT-001','Z-CASTLE-COOK-DING-SCHEDULER-001','Z-HOGWARTS-ATTENTION-BUDGET-001','Z-HOGWARTS-VERIFY-COMPUTE-001','Z-CASTLE-ULTRASTABLE-ESCALATION-001']},
    {'id': 'S07', 'name': 'CARD-TO-MASSING', 'status': 'IMPLEMENTED', 'zettels': ['Z-MANUAL2SKILL-HIERARCHY-001','Z-HOLODECK-CONSTRAINT-COMPILER-001','Z-HOGWARTS-SPACE-COLLAPSE-001','Z-CASTLE-SPACE-AS-COMPUTATION-001']},
]
