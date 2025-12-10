# Void Management: A Paradigm for AI-Assisted Creative Systems

## Toward Constrained Possibility Spaces in Prompt Orchestration and Generative Design

---

**Abstract**

This paper examines an emergent paradigm in AI-assisted creative systems that we term "void management"—the principle that human-AI collaboration should focus on defining and filling constrained possibility spaces (voids) rather than directly constructing outputs (scenes). Drawing on primary sources from the DCE-GYO archive, we trace the conceptual roots of this paradigm in systems theory, critical pedagogy, and computational narratology. We present evidence from implemented tools, markup languages, and workflow documentation that demonstrate void management in practice. We argue that this paradigm offers advantages in scalability, coherence, and human agency over traditional scene-first approaches, while acknowledging unresolved tensions in formalization and cross-void consistency.

**Keywords:** void management, possibility space, prompt engineering, generative design, POML, semantic grids, narrative fidelity, human-AI collaboration

---

## 1. Introduction

### 1.1 The Problem of Scene-First Generation

Contemporary AI-assisted creative tools typically operate in a "scene-first" paradigm: the human provides a prompt, and the AI generates a complete output—an image, a text, a 3D model. This approach treats the AI as a production engine and the human as a specification provider. The interaction is transactional: input → output.

This paradigm faces several challenges:

1. **Opacity**: The human cannot see or influence the intermediate reasoning that produces the output.
2. **Brittleness**: Small changes in the prompt can produce wildly different outputs.
3. **Scalability**: Generating many related outputs requires many independent prompts, with no guarantee of coherence.
4. **Agency**: The human's role is reduced to approval or rejection of finished artifacts.

### 1.2 An Alternative: Void Management

This paper documents an alternative paradigm found in the DCE-GYO archive—a collection of tools, templates, and philosophical documents developed for AI-assisted worldbuilding, narrative design, and dialectical pedagogy. In this paradigm:

- The AI does not generate scenes directly.
- Instead, the AI **maps possibility spaces** (called "voids") and **evaluates candidates** against semantic constraints.
- The human provides **buckets** of raw material (parts, concepts, characters).
- The AI proposes **instantiations** that fill the voids.
- A **fidelity metric** determines when the void is sufficiently filled.

We call this paradigm "void management" because the central object of attention is not the scene (the output) but the void (the constrained space of possible outputs).

### 1.3 Scope and Method

This paper is based on close reading of primary sources from the DCE-GYO archive, including:

- Philosophical documents (`PLATOS-CAVE-OLOG.md`, `BRICKBENDER-PHILOSOPHY.md`)
- Markup specifications (`LEGOS-GPT_Grace-Master-Builder.poml`, `onyx-chapter-template.md`)
- Data exports (`onyx-story-skeleton.json`, `ewok-forest-example.json`)
- Interactive tools (`platos-cave.html`, `brickbender-philosophy.html`)

All quotations are drawn directly from these sources. Line numbers and file paths are provided for verification.

---

## 2. Theoretical Foundations

### 2.1 The Void as Semantic Hole

The term "void" appears explicitly in `PLATOS-CAVE-OLOG.md`, a document describing an "inverse 20 Questions" workflow for reconstructing the Shield of Achilles using LEGO parts:

> "Instead of the computer guessing what object the human is thinking of, the Oracle (GPT) is trying to discover **which structural and narrative voids** exist on the Shield, and which minimal vignettes of LEGO parts can satisfy them."
>
> — `PLATOS-CAVE-OLOG.md`, lines 9–11

The void is not an absence but a **semantic hole with constraints**. It is defined by:

- **Zone**: Where in the semantic space does this void exist?
- **Type**: What kind of entity, event, or relation should fill it?
- **Constraints**: What properties must the filler have?

The document specifies a four-zone topology:

> "Defines the **Ideal State** as a set of Voids:
>   - Zone 1 (Center): Core Concept / Axis Mundi.
>   - Zone 2 (Inner Ring): Systems / Protagonists.
>   - Zone 3 (Outer Ring): Environment / Antagonists.
>   - Zone 4 (Rim): Boundary / Timeframe / Oceanus."
>
> — `PLATOS-CAVE-OLOG.md`, lines 26–30

This topology is not a spatial layout but a **narrative ontology**—a classification of the kinds of things that can exist in a story-world.

### 2.2 The Semantic Grid as Constrained Possibility Space

The void topology is implemented as a 9×9 grid in multiple tools. `BRICKBENDER-PHILOSOPHY.md` provides the theoretical justification:

> "The grid has **81 cells**, indexed `0…80`. Conceptually it is a **top-down map**... So **the grid is just a flat array of indices** — philosophy and worldbuilding come from how you *label* and *layer* those indices."
>
> — `BRICKBENDER-PHILOSOPHY.md`, lines 28–54

The grid is not a canvas for drawing; it is a **coordinate system for semantic attention**. Each cell can be assigned to one of four layers:

> "- **Ground layer**: navigation base — where you can walk.
> - **Site layer**: places and boundaries — where events happen.
> - **Sky layer**: atmosphere and mood — how it feels over time.
> - **Perspective layer**: camera and viewpoint — what is actually shown."
>
> — `BRICKBENDER-PHILOSOPHY.md`, lines 15–18

The philosophy is explicit:

> "Complex systems become legible when you:
> 1) choose a finite, discrete **grid** of attention,
> 2) assign each cell a clear **semantic job**, and
> 3) define **functors** from that grid into other worlds (code, runtime, stories)."
>
> — `BRICKBENDER-PHILOSOPHY.md`, lines 468–471

The grid constrains the possibility space by limiting attention to 81 discrete locations, each with a defined semantic role.

### 2.3 Narrative Fidelity as Completion Metric

Void management requires a metric for determining when a void is "filled." The archive uses "Narrative Fidelity":

> "At the end of each round:
> - Recalculate `Narrative_Fidelity`.
> - If `Fidelity > 80%` or `Round_Count == 20`:
>   - Propose **RELEASE**: 'The scene is narratively stable. Shall I generate the MPD now?'"
>
> — `PLATOS-CAVE-OLOG.md`, lines 114–118

The threshold is 80%, not 100%. This is a deliberate design decision:

> "**Imply, Don't Saturate:** Use the viewer's imagination as the final brick."
>
> — `PLATOS-CAVE-OLOG.md`, line 93

Void management does not aim for completeness; it aims for **sufficiency**. The remaining 20% is left to the viewer's imagination or future iterations.

---

## 3. Implementation: POML and the LEGOS Grammar

### 3.1 POML: Prompt Orchestration Markup Language

The archive contains a markup language for encoding prompt logic. The file `LEGOS-GPT_Grace-Master-Builder.poml` demonstrates the structure:

```xml
<poml>
  <role kind="system">
    <name>LEGOS-GPT</name>
    <description>
      You are LEGOS-GPT, a modular narrative architect and semantic parser.
      Your job is to take ANY input — story, concept, event, scene description,
      build guide, or MPD commentary — and reframe it using the LEGOS story
      grammar into a human-readable AND machine-parsable YAML model.
    </description>
    <rules>
      <rule>
        Use the LEGOS grammar with entities, goals, obstacles, morphisms, shifts,
        locations, and timepoints, and always output a single YAML document.
      </rule>
      <rule>
        ID discipline:
        - entity ids:  e_<slug>
        - goal ids:    g_<slug>
        - obstacle ids:o_<slug>
        - shift ids:   s_<slug>
      </rule>
    </rules>
  </role>
</poml>
```
— `prompt-library/LEGOS-GPT_Grace-Master-Builder.poml`, lines 1–49

Key observations:

1. **POML encodes roles and rules, not outputs.** The file does not contain example prompts or expected responses; it contains the *logic* that governs how prompts should be processed.

2. **ID discipline enforces referential integrity.** Every entity, goal, and obstacle has a unique ID, enabling cross-referencing across the void structure.

3. **The LEGOS grammar is a void schema.** Entities, goals, obstacles, shifts, and locations are the *kinds* of things that can fill voids, not specific instances.

### 3.2 The LEGOS Scene Template

The file `prompt-library/LEGOS-scene-template.yaml` provides a schema for void structures:

```yaml
title: "{{scene_title}}"
description: "{{one_sentence_summary}}"
location: "{{primary_location}}"

entities:
  - id: "e_{{slug}}"
    type: "character"
    name: "{{name}}"
    traits:
      - "{{trait_1}}"
      - "{{trait_2}}"
    location: "{{location_or_entity_id}}"

goals:
  - id: "g_{{slug}}"
    name: "{{goal_name}}"
    owner: "e_{{owner_id}}"

obstacles:
  - id: "o_{{slug}}"
    name: "{{obstacle_name}}"
    affects: "g_{{goal_id}}"

shifts:
  - id: "s_{{slug}}"
    name: "{{shift_name}}"
    causes:
      - "o_{{obstacle_id}}"
    results_in: "{{goal_or_state_id}}"
```
— `prompt-library/LEGOS-scene-template.yaml`, lines 1–34

This is a **possibility space schema**. The `{{placeholders}}` are voids to be filled. The structure defines:

- What *kinds* of entities can exist (characters, objects, systems)
- What *relations* can hold between them (ownership, causation, location)
- What *dynamics* are possible (goals, obstacles, shifts)

The schema does not generate scenes; it **constrains what scenes are possible**.

---

## 4. Void Structures in Practice

### 4.1 The Story Skeleton Export

The file `onyx-story-skeleton.json` demonstrates void structures for the DCE-GYO chapter archive:

```json
{
  "id": "chap12-bishop-foreman",
  "chapter": 12,
  "titleCore": "THE BISHOP MEETS THE FOREMAN — The Architecture of Meaning",
  "locationLine": "On the outskirts of an ancient city—a sprawling labyrinth of twisting alleyways, modern boulevards, and haphazard extensions—two figures stand amidst a dusty construction site.",
  "shiftLine": "The ground is littered with building stones: blocks, pillars, slabs, and beams.",
  "entities": [
    { "id": "bishop", "label": "THE BISHOP", "role": "theorist" },
    { "id": "foreman", "label": "THE FOREMAN", "role": "theorist" }
  ],
  "goal": "Clarify meaning as use in language-games.",
  "obstacle": "Augustinian referential model that reifies meaning as object.",
  "notes": "Location = ancient city outskirts; shift = construction site full of slabs; core = Bishop vs Foreman debate."
}
```
— `onyx-story-skeleton.json`, lines 9–22

This is not a scene; it is a **void specification**:

| Field | Void Type | Constraint |
|-------|-----------|------------|
| `locationLine` | Spatial | Must be a construction site in an ancient city |
| `shiftLine` | Temporal/Material | Must involve building stones |
| `entities` | Actors | Exactly two theorists with archetypal names |
| `goal` | Narrative | Must clarify meaning-as-use |
| `obstacle` | Conflict | Must involve referential theory |

The actual chapter (dialogue, assessment, verdict) is **instantiated** from this void specification. The void constrains the scene without determining it.

### 4.2 The Ewok Forest Workflow

The file `ewok-forest-example.json` contains a complete conversation log demonstrating void management in practice. The workflow proceeds in rounds:

**Round 1: Void Analysis**

> "Current Zone: Zone 1 (Center) + first anchors of Zone 3 (Outer Ring)
> Void (Ideal State): A readable forest-clearing battlefield that implies a whole woodland without filling the tray with trees.
> The Strategy: 'I will deploy a clearing-with-crossfire: a central stump + fallen log to define the arena, then cardinal tree anchors on the rim to complete the forest through negative space.'"
>
> — `ewok-forest-example.json`, Round 1 Response

The AI does not generate a forest; it **analyzes the void** (what kind of forest is needed) and **proposes a strategy** (how to imply the forest with minimal parts).

**Round 2: Micro-PLoT Evaluation**

The AI evaluates candidate parts using a weighted scoring formula:

> "**THE BALANCED LEDGER (Micro-PLoT):**
> Evaluate every part in the bucket for its specific contribution:
> 1. **Geometric Prior (G):** Does it offer structural utility (stacking, connecting)?
> 2. **Mythic Likelihood (M):** Does it embody the narrative signifier?
> 3. **Visual Weight (W):** Does it possess the gravity to serve as an anchor?
>
> **Score = (G * 0.3) + (M * 0.4) + (W * 0.3)**"
>
> — `ewok-forest-example.json`, Round 1 Prompt

Each candidate is scored and assigned a verdict:

| Part ID | Description | G | M | W | Score | Verdict |
|---------|-------------|---|---|---|-------|---------|
| 30131.dat | Tree 6×6 Hollow Stump | 0.8 | 0.9 | 0.9 | 0.87 | CLAIM |
| 2518c01.dat | Palm trunk + leaves | 0.7 | 0.8 | 0.95 | 0.82 | CLAIM |
| 6065s01.dat | Bush base (2 leaves) | 0.6 | 0.85 | 0.5 | 0.68 | CLAIM |

— Adapted from `ewok-forest-example.json`, Round 3 Response

The AI is not generating trees; it is **evaluating candidates against void constraints**.

**Round 4: Fidelity Check**

> "Moonlit Forest Skirmish (Ewoks vs. Robots) | Round 4/20 | Fidelity: 91%"
>
> — `ewok-forest-example.json`, Round 4 Response

At 91% fidelity (above the 80% threshold), the AI proposes release:

> "Narrative Fidelity: 91%
> Status: RELEASE READY"

The human then requests the final scene:

> "make the mpd"
>
> — `ewok-forest-example.json`, Round 4 Prompt

Only at this point does the AI generate the actual MPD (LEGO model) file.

---

## 5. The Chapter Template: POML in Dialectical Pedagogy

### 5.1 Structure of a Guardian Chapter

The file `onyx-chapter-template.md` defines the structure for DCE-GYO chapters:

```markdown
# Chapter 00

## When THE FIRST meets THE SECOND:
## The Title of the Encounter

**Author Name**

Opening narrative paragraph...

---

<poml>
  <meta minVersion="0.5.0" />
  <role>Dark Matter Guardian Grader</role>
  <task>
    Conduct a rigorous adversarial assessment of the two theories presented:
    1. The First Theory (Name/Label).
    2. The Second Theory (Name/Label).
  </task>
</poml>

---

# ASSESSMENT 1: CANDIDATE "THE FIRST" (Alias)
**Theoretical Submission:** Name of the theory or framework being assessed

### 1. Calibration & Rubric Digest
*   **Core Task:** One-sentence summary of what this candidate claims or asserts.
*   **Darkness Prior:** Risk level (Low/Moderate/High) of **Label**.
*   **Intended Frame:** The domain or lens.

### 2. Forensic Audit & Dark Matter Scan

#### Criterion A: Name of First Criterion
*   **Evidence:** Direct quote or paraphrase from the narrative.
*   **Guardian Critique:** Assessment of the evidence.
*   *Dark Matter:* Hidden assumptions, unstated premises, or gaps.
*   *Verdict:* **Light** / **Twilight** / **Shadow** / **Void**.
```
— `onyx-chapter-template.md`, lines 1–62

### 5.2 The POML Block as Void Specification

The `<poml>` block in the template is a void specification for the assessment:

```xml
<poml>
  <role>Dark Matter Guardian Grader</role>
  <task>
    Conduct a rigorous adversarial assessment of the two theories presented:
    1. The First Theory (Name/Label).
    2. The Second Theory (Name/Label).
  </task>
</poml>
```

This does not generate the assessment; it **constrains what kind of assessment is possible**:

- The role must be "Dark Matter Guardian Grader"
- The task must be adversarial assessment
- There must be exactly two theories

### 5.3 The Verdict Scale as Void Ontology

The template specifies four possible verdicts:

> "*Verdict:* **Light** / **Twilight** / **Shadow** / **Void**."
>
> — `onyx-chapter-template.md`, line 51

This is a **void ontology**—a classification of the kinds of judgments that can fill the verdict void. The actual verdict is instantiated from this constrained set.

---

## 6. Critique of Scene-First Framing

### 6.1 The "Thick Prompts" Critique

The file `ARCHIVE-REFRAMING-ANALYSIS.md` contains an explicit critique of scene-first framing:

> "The current `index.html` frames this archive as:
> > 'Thick Prompts: A Cybernetic Approach to AI Viscosity'
>
> This framing is **hallucinated**. It doesn't match the actual content of the 42 chapters."
>
> — `ARCHIVE-REFRAMING-ANALYSIS.md`, lines 5–8

The document argues that the archive's actual method is void-first:

> "The archive stages debates about:
> 1. **How meaning works** (reference vs. use vs. procedure)
> 2. **How knowledge is represented** (symbols vs. procedures vs. embodiment)
> 3. **How intelligence emerges** (planning vs. exploration vs. symbiosis)"
>
> — `ARCHIVE-REFRAMING-ANALYSIS.md`, lines 65–68

The chapters do not generate scenes; they **instantiate debates within constrained possibility spaces**.

### 6.2 The Retrofitting Problem

The critique identifies a common failure mode:

> "The framing appears to be:
> 1. **Retrofitted** — Imposing a trendy AI frame onto unrelated content
> 2. **Aspirational** — Describing what the author wishes it was about
> 3. **Marketing** — Making it sound relevant to current AI discourse"
>
> — `ARCHIVE-REFRAMING-ANALYSIS.md`, lines 123–126

This is the danger of scene-first thinking: the output (the framing) is generated without reference to the void (the actual content).

---

## 7. Conceptual Roots

### 7.1 Systems Theory

The void management paradigm echoes several concepts from cybernetics and systems theory:

**Variety Reduction (Ashby)**

The 9×9 grid reduces the variety of possible scenes to 81 discrete locations. This is not a limitation but a **design principle**:

> "The philosophy: before you worry about story or sky, **you must make navigation obvious and kind.**"
>
> — `BRICKBENDER-PHILOSOPHY.md`, lines 96–97

**Requisite Variety**

The void specification must match the complexity of the desired output. A simple void (2 entities, 1 goal) produces a simple scene; a complex void (many entities, nested goals) produces a complex scene.

**Feedback Loops**

The Narrative Fidelity score creates a feedback loop: each round of void-filling updates the score, which determines whether to continue or release.

### 7.2 Critical Pedagogy

The "Guardian" assessment framework echoes Freirean pedagogy:

**Problem-Posing**

Each chapter presents two theories in tension, not a single answer:

> "When THE BISHOP meets THE FOREMAN"
>
> — `onyx-chapter-template.md`, line 3

**Dialogue**

The debate format requires engagement:

> "THE FIRST speaks: 'Quote from the first character establishing their position.'
> THE SECOND responds: 'Quote from the second character establishing their counter-position.'"
>
> — `onyx-chapter-template.md`, lines 10–12

**Praxis**

The verdict is a judgment, not a fact:

> "**Winner:** **THE WINNER NAME**.
> Summary explanation of why this candidate won."
>
> — `onyx-chapter-template.md`, lines 118–119

### 7.3 Computational Narratology

The LEGOS grammar echoes formal approaches to narrative:

**Propp's Morphology**

Entities, goals, obstacles, and shifts map to Proppian functions (hero, quest, villain, transformation).

**Greimas's Actantial Model**

The two-entity structure (THE FIRST vs. THE SECOND) maps to Greimas's subject/anti-subject opposition.

**Ryan's Possible Worlds**

The void is a possible world; the scene is an actualized world. Void management is the process of moving from possibility to actuality.

---

## 8. Advantages of Void Management

### 8.1 Scalability

Void management scales better than scene-first generation because:

1. **Voids are reusable.** The same void structure can be instantiated with different candidates.
2. **Voids are composable.** Complex scenes can be built from nested voids.
3. **Voids are versionable.** Changes to the void specification propagate to all instantiations.

### 8.2 Coherence

Void management produces more coherent outputs because:

1. **Constraints are explicit.** The void specification documents what must be true.
2. **Candidates are evaluated.** The Micro-PLoT ledger ensures that fillers meet constraints.
3. **Fidelity is measured.** The Narrative Fidelity score detects incomplete or inconsistent scenes.

### 8.3 Human Agency

Void management preserves human agency because:

1. **Humans define voids.** The possibility space is human-authored.
2. **Humans provide buckets.** The raw material is human-curated.
3. **Humans approve release.** The final scene requires human consent.

> "The Vignette Protocol: **Imply, Don't Saturate.** Use the viewer's imagination as the final brick."
>
> — `PLATOS-CAVE-OLOG.md`, lines 92–93

The human imagination is not replaced; it is **invited**.

---

## 9. Unresolved Tensions

### 9.1 Formalization

The term "void management" does not appear in the archive. The paradigm is documented but not named. This creates challenges for:

- **Communication**: How do practitioners refer to the paradigm?
- **Education**: How do newcomers learn the paradigm?
- **Research**: How do scholars cite the paradigm?

### 9.2 Human Agency in Practice

While the paradigm claims to preserve human agency, the actual workflow places humans in a limited role:

> "User selects an MPD bucket from Swiss and opens it in a text editor.
> User pastes the bucket into the GPT (LEGOS Architect) as the current **evidence set**."
>
> — `PLATOS-CAVE-OLOG.md`, lines 134–136

The human is a "bucket provider," not a co-creator. The AI performs the analysis, evaluation, and composition.

### 9.3 Cross-Void Coherence

The archive does not document mechanisms for ensuring consistency across multiple voids. If Chapter 12 and Chapter 13 share entities, how is consistency maintained?

### 9.4 Scalability Testing

The archive contains ~50 chapters. Void management at scale (1000+ chapters, 100+ entities) is untested.

---

## 10. Conclusion

### 10.1 Summary of Findings

The DCE-GYO archive documents a paradigm for AI-assisted creative systems that we term "void management." Key findings:

1. **Voids are semantic holes with constraints**, not empty spaces.
2. **Semantic grids constrain possibility spaces** to finite, discrete locations.
3. **Narrative Fidelity measures void coverage**, not output quality.
4. **POML encodes prompt logic**, not prompt outputs.
5. **Micro-PLoT evaluates candidates** against void constraints.
6. **The paradigm has roots** in systems theory, critical pedagogy, and computational narratology.

### 10.2 Implications for AI Engineering

Void management suggests that:

1. **Prompt libraries should encode logic, not examples.**
2. **Generative systems should export possibility spaces, not just outputs.**
3. **Evaluation metrics should measure void coverage, not output quality alone.**
4. **Human-AI collaboration should focus on void definition and candidate curation.**

### 10.3 Future Work

1. **Formalize the paradigm.** Create a glossary, specification, and reference implementation.
2. **Test scalability.** Apply void management to large-scale archives (1000+ chapters).
3. **Measure human agency.** Track how bucket selection and void definition affect outcomes.
4. **Develop cross-void coherence.** Create mechanisms for consistency across multiple voids.
5. **Compare to existing paradigms.** Map void management to constraint satisfaction, planning, and other formal frameworks.

---

## References

### Primary Sources (DCE-GYO Archive)

1. `PLATOS-CAVE-OLOG.md` — Philosophical specification for inverse 20Q void-filling workflow
2. `BRICKBENDER-PHILOSOPHY.md` — Theoretical foundation for 9×9 semantic grids
3. `ARCHIVE-REFRAMING-ANALYSIS.md` — Critique of scene-first framing
4. `ONYX-DOWNSTREAM-PROMPT.md` — Data contract for void-to-scene pipelines
5. `onyx-chapter-template.md` — POML structure for Guardian chapters
6. `prompt-library/LEGOS-GPT_Grace-Master-Builder.poml` — POML library encoding prompt logic
7. `prompt-library/LEGOS-scene-template.yaml` — Possibility space schema
8. `onyx-story-skeleton.json` — Void structure exports for chapter archive
9. `ewok-forest-example.json` — Complete conversation log demonstrating void management workflow
10. `platos-cave.html` — Interactive tool for inverse 20Q void-filling
11. `brickbender-philosophy.html` — Interactive 9×9 semantic grid implementation

### Secondary Sources (Conceptual Roots)

12. Ashby, W. R. (1956). *An Introduction to Cybernetics*. Chapman & Hall.
13. Freire, P. (1970). *Pedagogy of the Oppressed*. Continuum.
14. Greimas, A. J. (1966). *Structural Semantics*. University of Nebraska Press.
15. Propp, V. (1928). *Morphology of the Folktale*. University of Texas Press.
16. Ryan, M.-L. (1991). *Possible Worlds, Artificial Intelligence, and Narrative Theory*. Indiana University Press.

---

## Appendix A: Glossary

**Bucket**: A curated set of candidate parts, concepts, or entities provided by the human for void-filling.

**Fidelity**: A metric (0–100%) measuring how well the current instantiation fills the void specification.

**LEGOS Grammar**: A schema for narrative structures including entities, goals, obstacles, shifts, locations, and timepoints.

**Micro-PLoT**: A scoring formula for evaluating candidates: Score = (G × 0.3) + (M × 0.4) + (W × 0.3), where G = Geometric Prior, M = Mythic Likelihood, W = Visual Weight.

**Narrative Fidelity**: The threshold (typically 80%) at which a void is considered sufficiently filled.

**POML**: Prompt Orchestration Markup Language. An XML-based format for encoding prompt logic (roles, rules, tasks) rather than prompt outputs.

**Semantic Grid**: A finite, discrete coordinate system (typically 9×9) for organizing semantic attention.

**Void**: A semantic hole with constraints. The constrained possibility space that a scene must fill.

**Void Management**: The paradigm of defining and filling constrained possibility spaces rather than directly constructing outputs.

**Zone**: A region of the semantic grid with a defined narrative function (Center, Inner Ring, Outer Ring, Rim).

---

## Appendix B: File Inventory

| File | Type | Lines | Key Contribution |
|------|------|-------|------------------|
| `PLATOS-CAVE-OLOG.md` | Markdown | 285 | Void definition, inverse 20Q, Micro-PLoT |
| `BRICKBENDER-PHILOSOPHY.md` | Markdown | 484 | Semantic grid theory, layer model |
| `ARCHIVE-REFRAMING-ANALYSIS.md` | Markdown | 184 | Critique of scene-first framing |
| `ONYX-DOWNSTREAM-PROMPT.md` | Markdown | 291 | Data contract, TypeScript interfaces |
| `onyx-chapter-template.md` | Markdown | 120 | POML structure, verdict scale |
| `LEGOS-GPT_Grace-Master-Builder.poml` | POML/XML | 111 | Role/rule encoding, ID discipline |
| `LEGOS-scene-template.yaml` | YAML | 48 | Possibility space schema |
| `onyx-story-skeleton.json` | JSON | 67 | Void structure exports |
| `ewok-forest-example.json` | JSON | 74 | Complete workflow log |
| `platos-cave.html` | HTML | ~500 | Interactive void-filling tool |
| `brickbender-philosophy.html` | HTML | ~400 | Interactive semantic grid |

---

*Paper compiled from DCE-GYO archive analysis, December 2025.*
