# Affordance Ekphrasis: Toward a Semantic-Spatial Prompt Syntax for World Assembly

**A Philosophical Investigation into Context Engineering, Thick Description, and Operative Language**

---

## Prologue: The Brick That Speaks

A 2×4 brick does not merely *exist*. It *affords*:
- Stacking (studs up)
- Bridging (spanning gaps)
- Anchoring (weight and friction)
- Connecting (to any compatible element)

James Gibson called these **affordances**: properties of objects that implicitly specify what actions are possible. The brick doesn't describe its uses; it *embodies* them. A child seeing a 2×4 brick immediately knows what to do with it.

But an LLM seeing "2×4 brick" knows nothing. The token is flat. The affordance is lost.

This paper asks: **Can we encode affordances into language?**

---

## 1. The Three Gaps

### 1.1 The Representation Gap

```
REALITY:       A physical brick with weight, friction, studs, anti-studs
DESCRIPTION:   "Brick 2 x 4" (14 characters)
LLM ENCODING:  [0.23, -0.41, 0.87, ...] (768 floats)
```

Each translation loses information:
- Reality → Description: Loses tactile, visual, relational properties
- Description → Encoding: Loses compositionality, loses spatial structure

The LLM's embedding of "Brick 2 x 4" is a point in semantic space, not a shape in physical space.

### 1.2 The Composition Gap

When humans think "two bricks stacked," they imagine:
- Physical contact (stud-to-anti-stud)
- Spatial relation (one above other)
- Structural result (taller, more stable)

When an LLM processes "two bricks stacked," it retrieves:
- Statistical co-occurrence of tokens
- No physics, no geometry, no consequence

The LLM can say "stacked" but cannot *stack*.

### 1.3 The Context Gap

An LLM's context window is finite. Loading 33,820 part descriptions consumes:
- ~500,000 tokens
- Entire context budget
- No room for reasoning

We need a language that packs more meaning into fewer tokens.

---

## 2. Affordance as Primitive

### 2.1 Gibson's Insight

> "The affordances of the environment are what it offers the animal, what it provides or furnishes, either for good or ill." — J.J. Gibson, *The Ecological Approach to Visual Perception*

Affordances are:
- **Relational**: Between agent and environment
- **Action-oriented**: Specify possible behaviors
- **Direct**: Perceived, not inferred

A chair affords sitting. A door affords passage. A brick affords stacking.

### 2.2 Affordances as Semantic Primitives

What if we described parts not by geometry, but by affordance?

```
Traditional:   "Plate 1 x 2 with Clip on Top"
Affordance:    HOLDS_BAR ∧ LIES_FLAT ∧ CONNECTS_BELOW
```

The affordance description is:
- **Compositional**: Each predicate is independent
- **Relational**: Specifies what it can *do with* other parts
- **Abstract**: Independent of color, exact shape, material

### 2.3 The Affordance Lattice

Affordances form a lattice:

```
                    CONNECTS
                   /        \
            CONNECTS_ABOVE   CONNECTS_SIDEWAYS
               /                    \
    STUD_CONNECTS_ABOVE    CLIP_CONNECTS_SIDEWAYS
```

More specific affordances inherit from general ones. A part with STUD_CONNECTS_ABOVE also has CONNECTS.

**Filtering by affordance**: "I need something that HOLDS_BAR and CONNECTS_BELOW" returns all clips, all holders, all grips—regardless of their shape taxonomy.

---

## 3. Operative Ekphrasis

### 3.1 Ekphrasis Defined

Ekphrasis is the literary description of visual art—making the reader *see* through words.

> "The shield of Achilles, wrought with cunning art..." — Homer, *Iliad*

Traditional ekphrasis is **representational**: it depicts.

We propose **operative ekphrasis**: description that *acts*.

### 3.2 From Depicting to Enacting

Consider two descriptions of a LEGO dragon:

**Representational Ekphrasis**:
> "A fearsome red dragon with spread wings and open jaws, perched on a rocky outcrop, flames licking from its mouth."

This is evocative but non-operative. An LLM cannot build from this.

**Operative Ekphrasis**:
```
DRAGON @ E5:
  BODY[large, red] → anchors scene
  WING[left] ← attached D5, implies span
  WING[right] ← attached F5, implies span  
  HEAD[open-jaw] → faces WEST toward VILLAGE
  FLAME[×2] ← extends from jaw toward C5
  
RELATION: THREAT_LOOMS_OVER(DRAGON, VILLAGE)
```

This is buildable. Each line specifies:
- **Part** (what)
- **Position** (where)
- **Attachment** (how connected)
- **Implication** (narrative role)

### 3.3 The Operative Principle

Operative language must:
1. **Specify action**: What gets placed where
2. **Encode relation**: How parts connect
3. **Carry meaning**: What the arrangement signifies

Traditional description fails (2) and (3).
Traditional code fails (3).
Operative ekphrasis satisfies all three.

---

## 4. Thick Description Meets Assembly

### 4.1 Geertz's Thick Description

Clifford Geertz distinguished:
- **Thin description**: "He winked" (behavioral fact)
- **Thick description**: "He winked conspiratorially to signal the joke was on the newcomer" (cultural meaning)

Thin description records behavior. Thick description interprets significance.

### 4.2 Thin vs. Thick Part Description

**Thin**:
```
1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat
```
(LDraw line: color 4, identity matrix, part 3001)

This says *what* and *where*. Nothing about *why*.

**Thick**:
```
BRICK[2x4, red] @ FOUNDATION.northwest
  ROLE: anchor
  NARRATIVE: "establishes the mass of the wall"
  AFFORDS: stacking, bridging
  RELATES: adjacent to BRICK[2x4, red] @ FOUNDATION.north
  IMPLIES: wall continues beyond frame
```

This says what, where, why, how, and what-next.

### 4.3 Thick Description as Context Compression

Paradox: Thick description is *longer* than thin description. How does it compress context?

Answer: Thick description **replaces inference with statement**.

An LLM reading thin descriptions must *infer*:
- Why this part? (narrative reasoning)
- What it affords (physical reasoning)
- How it relates (spatial reasoning)

Each inference consumes tokens and introduces error.

Thick description provides answers, freeing the model to *build*, not *guess*.

---

## 5. Semantic-Spatial Encoding

### 5.1 The Dual Channel Problem

Spatial information: "part A is north of part B"
Semantic information: "part A threatens part B"

Traditional encodings separate these:
- Geometry in coordinates
- Meaning in prose

But in LEGO scenes, space *is* meaning:
- The dragon is above → dominates
- The villagers are at the edge → escaping
- The castle wall is at the boundary → protecting

### 5.2 A Unified Syntax

We propose a syntax that encodes both channels:

```
@CELL(row, col) : PART [affordances] → ROLE ← RELATIONS
```

Example:
```
@E5 : DRAGON[large, menacing, ANCHORS] → THREAT ← LOOMS_OVER(@C3)
@C3 : COTTAGE[burning, SUPPORTS_FLAME] → VICTIM ← BURNS_FROM(@E5)
@B7 : MINIFIG[running, DIRECTIONAL] → ESCAPEE ← FLEES(@E5)
```

This syntax:
- Fixes **position** (@E5)
- Specifies **part** (DRAGON)
- Lists **affordances** (large, ANCHORS)
- Assigns **narrative role** (THREAT)
- Declares **relations** (LOOMS_OVER)

### 5.3 The Grid as Coordinate System

The 9×9 grid is not arbitrary. It encodes:

| Zone | Cells | Semantic Role |
|------|-------|---------------|
| Center | E5 | Axis Mundi—core concept |
| Inner | D4-F6 | Protagonists, active forces |
| Outer | B2-H8 | Environment, context |
| Rim | A*, I*, *1, *9 | Boundary, frame, implied beyond |

Saying "@E5" already carries meaning: "this is the center, the main thing."

### 5.4 Relations as First-Class

Traditional LDraw says nothing about relations. Our syntax makes them explicit:

```
SPATIAL RELATIONS:
  ABOVE(A, B)      → A stacks on B
  ADJACENT(A, B)   → A touches B horizontally
  SPANS(A, B, C)   → A bridges from B to C
  ENCLOSES(A, B)   → A surrounds B

NARRATIVE RELATIONS:
  THREATENS(A, B)  → A poses danger to B
  PROTECTS(A, B)   → A shields B
  FLEES(A, B)      → A escapes from B
  ANCHORS(A)       → A defines the scene center
```

An LLM can reason over these relations without parsing geometry.

---

## 6. Novel Language Insight: The Constraint Poem

### 6.1 Beyond Prose, Beyond Code

We seek a form that is:
- **Denser** than prose (fewer tokens, more meaning)
- **Richer** than code (carries narrative, not just structure)
- **Operational** (can be executed into a scene)

We call this form the **Constraint Poem**.

### 6.2 Example: The Dragon Attack

```
SCENE: Dragon Attack on Village
GRID: 9×9
FIDELITY_TARGET: 0.80

[CENTER]
@E5 DRAGON{red, wings-spread} → AXIS_MUNDI
    AFFORDS: anchors, menaces, LOOMS
    IMPLIES: "the threat made manifest"

[INNER-WEST]  
@C3 COTTAGE{tan, burning} → VICTIM
    FLAME{×2} ← attached roof
    AFFORDS: burns, collapses
    RELATES: BURNS_FROM(DRAGON)
    IMPLIES: "destruction in progress"

[OUTER-EAST]
@B6..B8 MINIFIG{peasant, ×3} → ESCAPEES
    MOTION: running → east
    RELATES: FLEE(DRAGON), TOWARD(RIM)
    IMPLIES: "hope lies beyond the frame"

[RIM-NORTH]
@A3, @A7 WALL{castle, crenellated} → BOUNDARY
    AFFORDS: protects, delimits
    IMPLIES: "safety exists; will they reach it?"

[VOIDS]
@G* : pending → ground definition
@D4, @F4 : pending → dragon's shadow/victims
```

### 6.3 Properties of the Constraint Poem

1. **Positional**: Each stanza anchors to grid cells
2. **Typed**: Parts have affordances and roles
3. **Relational**: RELATES clauses link stanzas
4. **Implicational**: IMPLIES clauses carry narrative
5. **Incomplete**: VOIDS mark what's missing

The poem is both **specification** and **interpretation**—thick description rendered operational.

---

## 7. Context Engineering Implications

### 7.1 Token Efficiency

| Representation | Tokens for "Dragon Attack" |
|----------------|----------------------------|
| Natural prose | ~2,000 |
| LDraw MPD | ~5,000 |
| Constraint Poem | ~400 |

The Constraint Poem is **5× denser** than prose and **12× denser** than code.

### 7.2 Reasoning Efficiency

With prose, an LLM must:
1. Parse narrative intent (inference)
2. Imagine spatial layout (inference)
3. Select parts (retrieval + inference)
4. Arrange parts (inference)

With Constraint Poem, an LLM:
1. Reads positions (given)
2. Reads roles (given)
3. Fills voids (constrained inference)
4. Generates MPD (translation)

Steps 1-2 become *lookup*, not inference. Reasoning concentrates on steps 3-4.

### 7.3 Error Reduction

Prose: "Put the dragon in the center, looming over the village."
- What's "center"? (ambiguous)
- What's "looming"? (metaphor)
- Where's the village? (not specified)

Constraint Poem: "@E5 DRAGON → LOOMS_OVER(@C3 COTTAGE)"
- E5 is defined
- LOOMS_OVER is a typed relation
- C3 COTTAGE is explicit

Ambiguity collapses. Errors decrease.

---

## 8. Testing LEGOs: A New Methodology

### 8.1 The LEGO Test

We propose LEGO scene generation as a **benchmark for spatial-semantic reasoning**:

> Given a narrative prompt, generate a Constraint Poem. Given a Constraint Poem, generate MPD. Given MPD, render and evaluate.

This tests:
- **Spatial reasoning**: Are parts placed correctly?
- **Semantic reasoning**: Do relations hold?
- **Narrative fidelity**: Does the scene tell the story?
- **Token efficiency**: How many tokens consumed?

### 8.2 Metrics

| Metric | Measures |
|--------|----------|
| **Structural Validity** | Does MPD parse without errors? |
| **Spatial Coherence** | Do parts connect correctly? |
| **Semantic Coherence** | Do roles/relations make sense? |
| **Narrative Fidelity** | Does human judge recognize the story? |
| **Token Economy** | Tokens consumed / parts placed |

### 8.3 Why LEGO?

LEGO is ideal because:
- **Discrete**: Finite part library (33,820)
- **Compositional**: Parts combine predictably
- **Grounded**: Physical constraints (studs, dimensions)
- **Semantic**: Parts carry cultural meaning (dragon, castle, minifig)
- **Scalable**: Scenes can be trivial or complex

If an LLM can master LEGO assembly, it has demonstrated:
- Spatial reasoning in discrete grids
- Semantic reasoning about objects and roles
- Constraint satisfaction under resource limits
- Narrative interpretation into physical form

---

## 9. The Deeper Insight: Language as Assembly

### 9.1 The Metaphor Reversed

We usually say: "Building is like writing—you compose elements."

We now say: "Writing is like building—you place meanings in spatial relation."

A sentence is a 1D constraint poem. A paragraph is a 2D grid. A document is a 3D scene.

The syntax we propose for LEGO may generalize to *all* structured generation.

### 9.2 From Prompt Engineering to Assembly Language

Traditional prompt engineering:
> "Please generate a story about a dragon attacking a village, making sure to include a burning cottage, fleeing villagers, and distant castle walls."

Assembly-style prompt:
```
NARRATIVE: dragon-attack
ZONES:
  CENTER: threat.dragon
  INNER: victim.cottage, crisis.fire
  OUTER: escape.villagers[×3]
  RIM: boundary.castle-wall[×2]
RELATIONS:
  dragon THREATENS cottage
  fire CONSUMES cottage  
  villagers FLEE dragon
  wall PROTECTS (implied beyond)
GENERATE: prose | mpd | image
```

The assembly prompt is:
- **Parseable** by the model
- **Constraining** of the output
- **Inspectable** by the user
- **Modifiable** in parts

### 9.3 Operative Language as Control Flow

The Constraint Poem is not just description—it is **control flow for generation**:

```
FOR zone IN [CENTER, INNER, OUTER, RIM]:
    FOR cell IN zone.cells:
        IF cell.void:
            part = SELECT(taxonomy, cell.constraints)
            PLACE(part, cell)
            PROPAGATE(cell.neighbors, part.affords)
    EVALUATE(zone.fidelity)
UNTIL fidelity > 0.80
```

The poem is simultaneously:
- A specification (what to build)
- A program (how to build)
- An interpretation (why to build)

---

## 10. Conclusion: The Grammar of Making

### 10.1 Summary

We have proposed:

1. **Affordance primitives**: Parts described by what they can *do*, not what they *are*
2. **Operative ekphrasis**: Description that specifies construction, not just appearance
3. **Thick assembly description**: Encoding why, not just what and where
4. **Semantic-spatial syntax**: A unified language for position + meaning
5. **The Constraint Poem**: A dense, operational, interpretable scene specification
6. **The LEGO Test**: A benchmark for spatial-semantic LLM reasoning

### 10.2 The Philosophical Core

Wittgenstein: "The meaning of a word is its use in the language."
Gibson: "The meaning of an object is its affordance in the environment."

We synthesize: **The meaning of a part is its role in the assembly.**

A brick does not mean "brick." A brick means "what I can build with it here, now, given what's already placed."

Context determines meaning. Assembly is context. Therefore: **Assembly is the production of meaning through spatial constraint.**

### 10.3 Final Thought

The 33,820 LEGO parts are not objects. They are **verbs awaiting subjects**.

The 9×9 grid is not space. It is **syntax awaiting utterance**.

The Constraint Poem is not code. It is **operative ekphrasis—the language that builds what it describes**.

---

*"When we describe affordances, we do not describe objects.*
*We describe the conversations objects can have with each other.*
*When we build, we do not arrange matter.*
*We speak in the grammar of making."*

---

## Appendix: Constraint Poem Grammar (BNF)

```bnf
<poem>        ::= <header> <stanza>+ <voids>?
<header>      ::= "SCENE:" <name> "\n" "GRID:" <dims> "\n" "FIDELITY_TARGET:" <float>
<stanza>      ::= "[" <zone> "]" "\n" <placement>+
<zone>        ::= "CENTER" | "INNER-" <direction> | "OUTER-" <direction> | "RIM-" <direction>
<placement>   ::= <cell> <part> "→" <role> "\n" <attributes>*
<cell>        ::= "@" <row> <col> | "@" <row> <col> ".." <row> <col>
<part>        ::= <name> "{" <properties> "}"
<role>        ::= <identifier>
<attributes>  ::= <indent> <attr_type> ":" <value> "\n"
<attr_type>   ::= "AFFORDS" | "RELATES" | "IMPLIES" | "MOTION"
<voids>       ::= "[VOIDS]" "\n" (<cell> ":" "pending" "→" <constraint> "\n")+
```

---

## Appendix: Example Taxonomizer Query in Affordance Mode

```
QUERY:
  AFFORDS: HOLDS_BAR, CONNECTS_BELOW
  SCALE: minifig-hand-compatible
  ROLE: grip, weapon-hold

RESULT (24 parts):
  - Plate 1 x 1 with Clip Horizontal [G:0.7, M:0.6, W:0.3]
  - Plate 1 x 2 with Clip on Top [G:0.8, M:0.7, W:0.4]
  - Minifig Hand [G:0.5, M:0.9, W:0.5]
  - ...

FILTER BY NARRATIVE:
  ROLE = weapon-hold
  MYTHIC > 0.7

RESULT (6 parts):
  - Minifig Hand [CLAIM: perfect fit]
  - Skeleton Hand [CLAIM: variant]
  - ...
```

The Taxonomizer, queried by affordance + role, returns parts the narrative *needs*, not parts that match text.
