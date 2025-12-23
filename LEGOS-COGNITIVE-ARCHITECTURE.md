# LEGOS Cognitive Architecture: Void-First Building

## The Problem with Traditional Search

Traditional part finding:
```
"I need a wheel" → Search 847 wheels → Overwhelmed → Pick randomly
```

This wastes tokens, fills context windows, and produces incoherent builds.

**The insight**: Don't search for parts. Search for *voids*.

---

## The Void Management Principle

### Start Empty. Stay Empty as Long as Possible.

```
┌─────────────────────────────────────────┐
│                                         │
│               THE VOID                  │
│                                         │
│         (Your scene doesn't exist)      │
│                                         │
│         (This is the ideal state)       │
│                                         │
└─────────────────────────────────────────┘
```

The void is not absence. It is potential. Every part you add *reduces* potential.

**The goal**: Add the *minimum* parts that tell the *maximum* story.

---

## The 9×9 Semantic Grid (The Tray)

Before touching any brick, project your narrative onto a grid:

```
    1     2     3     4     5     6     7     8     9
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
A  |     |     |     |     |     |     |     |     |     |  ← RIM: Boundary
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
B  |     |     |     |     |     |     |     |     |     |  ← OUTER: Environment
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
C  |     |     |     |     |     |     |     |     |     |
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
D  |     |     |     |     |     |     |     |     |     |  ← INNER: Protagonists
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
E  |     |     |     |     | [☼] |     |     |     |     |  ← CENTER: Axis Mundi
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
F  |     |     |     |     |     |     |     |     |     |
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
G  |     |     |     |     |     |     |     |     |     |
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
H  |     |     |     |     |     |     |     |     |     |
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
I  |     |     |     |     |     |     |     |     |     |
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
```

**Zone Semantics**:
- **Zone 1 (E5 - Center)**: Core concept. The axis mundi. What is this scene ABOUT?
- **Zone 2 (Inner Ring)**: System. Protagonists. The active forces.
- **Zone 3 (Outer Ring)**: Environment. Antagonists. Context.
- **Zone 4 (Rim)**: Boundary. Timeframe. "This is where the scene ends."

---

## The Bucket Protocol: 24-30 Parts at a Time

Instead of searching 33,820 parts, we:

1. **Request a bucket** from the Taxonomizer
2. **Score each part** using Micro-PLoT
3. **Claim or release** parts for the scene
4. **Repeat** until Narrative Fidelity > 80%

### Why 24-30?

- Small enough to evaluate each part
- Large enough to offer variety
- Fits comfortably in working memory (human or LLM)
- Matches the Taxonomizer's image grid (24 visible parts)

---

## Micro-PLoT: The Part Evaluation Protocol

Every part in the bucket gets scored:

```
Score = (G × 0.3) + (M × 0.4) + (W × 0.3)
```

| Factor | Name | Question |
|--------|------|----------|
| **G** | Geometric Prior | Does it stack, connect, provide structure? |
| **M** | Mythic Likelihood | Does it carry narrative meaning? |
| **W** | Visual Weight | Does it anchor the eye, define space? |

### Example: Scoring a "2×4 Brick" for a Castle Scene

```
G (Geometric):  0.9  — Stacks perfectly, foundational
M (Mythic):     0.5  — Generic, no narrative specificity
W (Visual):     0.4  — Low visual weight, blends in

Score = (0.9 × 0.3) + (0.5 × 0.4) + (0.4 × 0.3) = 0.27 + 0.20 + 0.12 = 0.59
```

**Verdict**: CLAIM for structure, but not for focal point.

### Example: Scoring a "Castle Turret Top" for a Castle Scene

```
G (Geometric):  0.6  — Specific connection points
M (Mythic):     0.95 — Screams "CASTLE"
W (Visual):     0.85 — Distinctive silhouette, anchors

Score = (0.6 × 0.3) + (0.95 × 0.4) + (0.85 × 0.3) = 0.18 + 0.38 + 0.26 = 0.82
```

**Verdict**: CLAIM as focal point. Build vignette around this.

---

## The Vignette Protocol: Sophisticated Composition

**The Rule**: Imply, don't saturate.

Instead of:
```
100 bricks making a literal wall
```

Build:
```
12 bricks suggesting a gatehouse
```

The viewer's imagination completes the wall.

### Vignette Patterns

| Pattern | Description | Use When |
|---------|-------------|----------|
| **Cardinal Anchors** | Place clusters at N, S, E, W | Defining zone boundaries |
| **Representative Array** | 8 parts in a ring | Implying enclosure |
| **Linear Pair** | 2 parts aligned | Implying direction |
| **Focal Cluster** | 3-5 parts dense | Creating attention point |
| **Scatter** | Parts at irregular intervals | Implying chaos/nature |

---

## The Taxonomizer Connection

The Taxonomizer is your **bucket dispenser**.

### Strategy: Narrative-Driven Category Selection

1. **Identify narrative need**: "I need something that says FOREST"
2. **Map to taxonomy category**: PLANT → Tree, or MINIFIG → Animals
3. **Request bucket**: Select the category, get 24 parts
4. **Score and claim**: Micro-PLoT each part
5. **Place in grid**: Update the void map

### Example Workflow

```
NARRATIVE: "A wizard's tower in a forest clearing"

VOID ANALYSIS:
- Zone 1 (Center): Tower base → Need: CYLINDER, ROUND
- Zone 2 (Inner Ring): Forest edge → Need: PLANT → Tree
- Zone 3 (Outer Ring): Clearing → Need: PLATE → Baseplate (green)
- Zone 4 (Rim): Mystery → Need: MINIFIG → Fantasy (wizard)

BUCKET REQUEST 1: BRICK → ROUND
→ Receive 24 round bricks
→ Score each for G, M, W
→ CLAIM: 4×4 round brick (tower base)
→ CLAIM: 2×2 round brick (tower segment)
→ RELEASE: Others (not needed)

BUCKET REQUEST 2: PLANT → Tree
→ Receive 24 tree/plant parts
→ Score each
→ CLAIM: Large pine tree (focal anchor)
→ CLAIM: 3 small bushes (scatter pattern)
→ RELEASE: Others

...continue until Fidelity > 80%
```

---

## The Construction Loop

```
┌──────────────────────────────────────────────────────────────┐
│                    ROUND X / 20                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. VOID ANALYSIS                                            │
│     "Which zone needs definition?"                           │
│     → Select target zone                                     │
│                                                              │
│  2. BUCKET REQUEST                                           │
│     "What taxonomy category serves this zone?"               │
│     → Taxonomizer: Select category, receive 24-30 parts      │
│                                                              │
│  3. MICRO-PLoT AUDIT                                         │
│     Score each part: G, M, W                                 │
│     → CLAIM high scorers                                     │
│     → RELEASE low scorers                                    │
│                                                              │
│  4. VIGNETTE CONSTRUCTION                                    │
│     "How do I arrange claimed parts?"                        │
│     → Apply vignette pattern                                 │
│     → Place in grid                                          │
│                                                              │
│  5. UPDATE SCENE GRAPH                                       │
│     Mark focal points on 9×9 grid                            │
│     Calculate Narrative Fidelity                             │
│                                                              │
│  6. RELEASE CHECK                                            │
│     IF Fidelity > 80% OR Round == 20:                        │
│        → Offer to generate MPD                               │
│     ELSE:                                                    │
│        → Continue to next round                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Narrative Fidelity Calculation

How do we know when we're "done"?

```
Fidelity = (Zones Defined / Total Zones) × 
           (Focal Points Placed / Required Focal Points) × 
           (Narrative Coherence Score)
```

| Component | Measurement |
|-----------|-------------|
| **Zones Defined** | How many of 4 zones have at least 1 vignette? |
| **Focal Points** | How many anchor parts are placed? |
| **Coherence** | Do parts relate to each other narratively? |

**Target**: 80% fidelity. Beyond this, you're over-building.

---

## The Standard Response Template

Every round produces this output:

```markdown
## [Scene Title] | Round [X]/20 | Fidelity: [0-100]%

### 1. Void Analysis
**Current Zone**: [Zone 2 - Inner Ring]
**Strategy**: Deploy radial cluster of tree parts to imply forest edge.

### 2. Micro-PLoT Ledger

| Part ID | Description | G | M | W | Score | Verdict |
|---------|-------------|---|---|---|-------|---------|
| 3470 | Large Pine Tree | 0.5 | 0.9 | 0.8 | 0.76 | CLAIM: Focal Anchor |
| 6255 | Small Bush | 0.4 | 0.7 | 0.3 | 0.50 | CLAIM: Scatter ×3 |
| 2435 | Palm Leaf | 0.3 | 0.2 | 0.4 | 0.29 | RELEASE: Wrong biome |

### 3. The Construct
**Vignette**: "Forest Edge" - 1 pine tree at cardinal E, 3 bushes scattered NE quadrant
**Barthesian Note**: "The single tall tree implies a forest beyond; bushes suggest density without cluttering the clearing."

### 4. Grid Update
    5     6     7     8
   +-----+-----+-----+-----+
D  |  .  |  .  | [b] |  .  |
   +-----+-----+-----+-----+
E  |  ☼  |  .  |  .  | [🌲] |  ← Pine at E8
   +-----+-----+-----+-----+
F  |  .  |  .  | [b] | [b] |  ← Bushes scattered
   +-----+-----+-----+-----+

### 5. Release Check
- **Fidelity**: 45% → Continue refining
- **Next Request**: BRICK → ROUND for tower construction
```

---

## Why This Works: Cognitive Efficiency

### Token Savings
- Instead of dumping 33,820 parts into context: **0 tokens**
- Each bucket: ~500 tokens for 24 parts
- 10 rounds × 500 = **5,000 tokens** (vs. flooding context)

### Coherent Builds
- Every part is *justified* through Micro-PLoT
- Parts relate to each other through zone placement
- Narrative drives selection, not random browsing

### Manageable Complexity
- 9×9 grid = 81 cells, but you only fill ~15-20
- Max 20 rounds = bounded process
- Clear exit condition (80% fidelity)

---

## The Taxonomizer as Oracle

Think of the Taxonomizer as an oracle you query:

> **Builder**: "I need parts that signify MEDIEVAL WARFARE"
> **Oracle**: "Query CASTLE, or MINIFIG → Soldier, or WEAPON"
> **Builder**: *Selects CASTLE → Wall*
> **Oracle**: *Returns bucket of 24 wall parts with images*
> **Builder**: *Scores each, claims 3, releases 21*

The oracle doesn't decide. You decide. The oracle provides *bounded possibilities*.

---

## Worked Example: "Dragon Attack on Village"

### Narrative YAML
```yaml
scene: Dragon Attack on Village
zones:
  center: Dragon (the threat)
  inner: Burning buildings (the crisis)
  outer: Fleeing villagers (the consequence)
  rim: Castle walls (the boundary/hope)
```

### Round 1: Establish Center

**Bucket Request**: ANIMAL → Fantasy → Dragon
**Parts Received**: 24 dragon-related parts

| Part | G | M | W | Score | Verdict |
|------|---|---|---|-------|---------|
| Dragon Body (Red) | 0.7 | 1.0 | 0.95 | 0.92 | CLAIM: Axis Mundi |
| Dragon Wing ×2 | 0.6 | 0.8 | 0.7 | 0.71 | CLAIM: Extension |
| Small Drake | 0.5 | 0.6 | 0.4 | 0.51 | RELEASE: Too small |

**Vignette**: Dragon placed at E5, wings at D5/F5, facing West (toward village)
**Fidelity**: 25% (1/4 zones defined)

### Round 2: Inner Ring - Burning Buildings

**Bucket Request**: BRICK → House + COLOR → Orange/Red (flames)
**Receive**: 24 house + flame parts

| Part | G | M | W | Score | Verdict |
|------|---|---|---|-------|---------|
| 2×4 Brick (tan) | 0.9 | 0.4 | 0.3 | 0.54 | CLAIM: Building structure |
| Flame piece | 0.2 | 0.9 | 0.8 | 0.66 | CLAIM: Fire detail ×4 |
| Window frame | 0.6 | 0.6 | 0.5 | 0.57 | CLAIM: Implies building |

**Vignette**: "Burning Cottage" - 6 bricks stacked, window, 2 flames on top. Cardinal W at C3.
**Fidelity**: 45% (2/4 zones, growing coherence)

### Round 3: Outer Ring - Fleeing Villagers

**Bucket Request**: MINIFIG → Town + MINIFIG → Torso
**Receive**: 24 minifig parts

| Part | G | M | W | Score | Verdict |
|------|---|---|---|-------|---------|
| Scared Face | 0.4 | 0.95 | 0.6 | 0.68 | CLAIM: Perfect expression |
| Running Legs | 0.5 | 0.7 | 0.4 | 0.55 | CLAIM: Motion |
| Pitchfork | 0.3 | 0.8 | 0.5 | 0.56 | CLAIM: Peasant signifier |

**Vignette**: 3 minifigs at B6, B7, B8 - running toward rim (escape direction)
**Fidelity**: 65% (3/4 zones)

### Round 4: Rim - Castle Walls

**Bucket Request**: CASTLE → Wall
**Receive**: 24 wall/battlement parts

**Vignette**: 2 wall sections at A3, A7 with crenellations - implies safety beyond frame
**Fidelity**: 82% → RELEASE CONDITION MET

### Final Grid

```
    1     2     3     4     5     6     7     8     9
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
A  |     |     | [🏰] |     |     |     | [🏰] |     |     |  ← Castle walls (hope)
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
B  |     |     |     |     |     | 🏃 | 🏃 | 🏃 |     |  ← Fleeing villagers
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
C  |     |     | 🔥🏠 |     |     |     |     |     |     |  ← Burning cottage
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
D  |     |     |     |     |  🐉  |     |     |     |     |  ← Dragon wing
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
E  |     |     |     |     | [🐲] |     |     |     |     |  ← DRAGON (Axis Mundi)
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
F  |     |     |     |     |  🐉  |     |     |     |     |  ← Dragon wing
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
G  |     |     |     |     |     |     |     |     |     |
   +-----+-----+-----+-----+-----+-----+-----+-----+-----+
```

**Total Parts Used**: ~25 (vs. 500+ in a "realistic" build)
**Narrative Fidelity**: 82%
**Rounds**: 4

---

## The Philosophy: Less is More

> "The best LEGO scenes are not the ones with the most bricks.
> They are the ones where every brick is *necessary*."

Void management inverts the question:
- NOT "What can I add?"
- BUT "What must I add to tell this story?"

The Taxonomizer provides the vocabulary.
Micro-PLoT provides the grammar.
The 9×9 grid provides the page.
And you, the builder, write the sentence.

---

*Build less. Mean more.*
