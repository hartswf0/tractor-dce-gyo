# Void Management in Practice: Implementation Patterns for Bounded Possibility Spaces in Human-AI Creative Systems

**Author:** [Anonymous for review]

**Submitted to:** [Conference/Journal]

**Date:** December 2025

---

## Abstract

Contemporary AI-assisted creative tools typically operate in a "scene-first" paradigm: the human provides a prompt, and the AI generates a complete output. This paper presents an alternative paradigm—*void management*—in which AI systems manage bounded possibility spaces rather than directly constructing outputs. We analyze three implementations from the DCE-GYO archive, a collection of tools for AI-assisted worldbuilding and narrative design. Our analysis reveals consistent implementation patterns: visible void boundaries, explicit fidelity thresholds, structure-preserving transformations, and navigable semantic coordinates. We argue that these patterns operationalize principles from situated action theory, cognitive mapping, and pattern language research, offering a coherent design paradigm for human-AI collaboration that preserves human agency while leveraging AI capabilities.

---

## 1. Introduction

The dominant paradigm in AI-assisted creative tools treats the AI as a production engine. The human specifies what they want; the AI produces it. This transactional model—prompt in, artifact out—has proven remarkably effective for many applications, from image generation to code completion. Yet it faces persistent challenges: opacity of intermediate reasoning, brittleness to prompt variation, difficulty maintaining coherence across related outputs, and reduction of human agency to approval or rejection of finished artifacts.

This paper examines an alternative paradigm that we term *void management*. Rather than generating complete outputs, void management systems prepare bounded possibility spaces—"voids"—that humans then instantiate. The AI's role shifts from production to preparation: mapping constraints, evaluating candidates, and maintaining structural coherence. The human's role shifts from specification to instantiation: selecting from prepared possibilities, filling semantic holes, and making final compositional decisions.

We ground our analysis in the DCE-GYO archive, a collection of tools, templates, and documentation developed for AI-assisted worldbuilding, narrative design, and 3D scene composition. The archive provides unusually rich primary sources: not only working implementations but also extensive philosophical documentation explaining design rationales. This combination allows us to analyze both what the tools do and why their designers made particular choices.

Our contribution is threefold. First, we identify consistent implementation patterns across three distinct tools, suggesting that void management is not an ad hoc solution but a coherent design paradigm. Second, we connect these patterns to established theoretical frameworks in human-computer interaction, demonstrating that void management operationalizes principles from situated action theory (Suchman, 1987), cognitive mapping (Lynch, 1960), and pattern language research (Alexander et al., 1977). Third, we extract design principles that may guide future development of void management systems.

---

## 2. Background and Related Work

### 2.1 The Planning Model and Its Critics

Suchman's (1987) critique of the planning model in AI remains foundational. She argued that classical AI treated plans as specifications that agents execute, when in fact plans function as resources that agents consult while responding to circumstances. Human action, she demonstrated, is fundamentally *situated*—it emerges from moment-to-moment engagement with the environment rather than from execution of pre-formed specifications.

This critique has profound implications for AI-assisted creative tools. If plans are resources rather than specifications, then AI systems should not attempt to execute human intentions directly. Instead, they should prepare resources that humans can draw upon while engaging in situated creative action. Void management can be understood as an operationalization of this insight.

### 2.2 Cognitive Mapping and Wayfinding

Lynch's (1960) research on urban imageability identified five elements that make cities navigable: paths, edges, districts, nodes, and landmarks. These elements function as a cognitive vocabulary that allows people to form mental maps of complex environments. Subsequent research has extended Lynch's framework to information spaces (Rosenfeld & Morville, 1998) and interactive systems (Dourish, 2001).

Void management systems face an analogous challenge: making possibility spaces navigable. A void is not useful if the human cannot understand its structure, locate relevant regions, or assess what has been filled and what remains empty. The implementations we analyze employ spatial metaphors—grids, layers, zones—that echo Lynch's cognitive mapping vocabulary.

### 2.3 Pattern Languages and Generative Grammars

Alexander et al. (1977) proposed that good design emerges from the application of *patterns*—recurring solutions to recurring problems organized in a generative grammar. Each pattern addresses a specific design challenge; patterns combine to produce coherent wholes. The pattern language approach has been influential in software engineering (Gamma et al., 1994) and interaction design (Tidwell, 2010).

Void management systems employ pattern-like structures to define what can fill a void. Rather than accepting arbitrary content, they specify categories (entities, goals, obstacles), relationships (ownership, causation), and constraints (type compatibility, spatial adjacency). These specifications function as generative grammars that bound the possibility space while leaving room for creative instantiation.

### 2.4 Graceful Degradation and Partial Results

Research on fault-tolerant systems has long recognized the value of graceful degradation—continuing to function, perhaps with reduced capability, when components fail (Avizienis et al., 2004). This principle has been applied to user interfaces (Nielsen, 1994) and web design (Gustafson, 2011), where it supports progressive enhancement and accessibility.

Void management extends graceful degradation from error handling to creative process. A partially filled void is not a failure state but a legitimate intermediate result. Systems that support partial instantiation allow humans to work incrementally, assess progress, and make informed decisions about where to focus further effort.

---

## 3. Method

We conducted a qualitative analysis of three implementations from the DCE-GYO archive: the GRACE editor, the HOMER studio pipeline, and the Brickbender grid system. Our analysis proceeded in three phases.

First, we performed close reading of primary documentation, including philosophy documents, technical specifications, and research ologs (structured research notes). We extracted explicit statements of design rationale, identifying passages where designers articulated why they made particular choices.

Second, we analyzed implementation artifacts, including source code, configuration files, and data schemas. We traced how stated rationales manifested in concrete technical decisions.

Third, we synthesized patterns across implementations, identifying commonalities that suggest general principles rather than tool-specific solutions.

All quotations in this paper are drawn directly from primary sources with line numbers provided for verification. We have excluded one major component of the archive (the ONYX chapter system) from this analysis due to scope constraints.

---

## 4. Case Study 1: The GRACE Editor

### 4.1 Context and Design Problem

The GRACE editor is a 3D scene viewer for LDraw files, a format for describing LEGO models. The design problem it addresses is stated directly in its documentation: "Why should ONE missing part kill the ENTIRE scene?" (GRACE-EDITOR-PHILOSOPHY.md, line 5). Traditional LDraw viewers treat missing parts as fatal errors, producing empty output when any referenced file cannot be found.

### 4.2 The Void Management Solution

GRACE implements what its documentation calls "graceful degradation" through a two-mode architecture. The "Gold" mode operates traditionally, failing on any error. The "Grace" mode continues rendering when parts are missing, substituting visible placeholders:

> Grace Editor (Forgiving Mode)
> - Philosophy: Machine of Loving Grace
> - Behavior: Load what works, show placeholders for what doesn't
> - Result: 85% beautiful scene with pink markers
> - Use case: Experimentation, learning, rapid iteration
>
> (GRACE-EDITOR-PHILOSOPHY.md, lines 17-21)

The placeholder is not merely an error indicator but a *void marker*—a visible representation of what is missing. The documentation specifies its visual properties: hot pink color (#ff69b4), 20×20×20 LDU cube geometry, deep pink wireframe edges (#ff1493). These choices ensure placeholders are impossible to miss while remaining visually distinct from scene content.

### 4.3 The Fidelity Threshold

GRACE implements an explicit fidelity threshold. The documentation shows example output: "Scene Completeness: 85% / Missing: 2 components" (GRACE-EDITOR-PHILOSOPHY.md, lines 56-57). This percentage represents the ratio of successfully rendered parts to total referenced parts. The scene is considered usable when completeness exceeds the threshold, even though voids remain.

### 4.4 Theoretical Connections

The GRACE philosophy explicitly echoes Suchman's situated action framework. The documentation contrasts "Traditional Compiler Mentality" (plan fails if any step fails) with "Grace Editor Mentality" (plan is a resource; proceed with what works). The traditional compiler treats the LDraw file as a specification to execute; GRACE treats it as a resource to consult while rendering what is possible.

The documentation frames this as an ethical stance: "This editor... works with you, not against you. It tends to your work like a loving gardener, keeping what's healthy and marking what needs attention" (GRACE-EDITOR-PHILOSOPHY.md, line 203). This language suggests value-sensitive design (Friedman & Hendry, 2019), embedding values of agency, transparency, and forgiveness in technical architecture.

---

## 5. Case Study 2: The HOMER Studio Pipeline

### 5.1 Context and Design Problem

HOMER Studio is a multi-tool environment for 3D scene editing. Its documentation describes it as a "multi-panel TRUBADOR shell" that integrates seven distinct tools: SWISS (project selection), FRANK (message bus), COURAGE (scene viewing), WEAVER (template transformation), WERE (line-level editing), MASTER (spatial editing), and MENTO (capture) (HOMER-STUDIO-OLOG.md, lines 5-13).

The design problem is coordination: how can multiple specialized tools operate on the same scene while maintaining consistency? The solution is a void-centric data flow architecture.

### 5.2 GOLD as Void Structure Export

The pipeline's central artifact is the "GOLD snapshot," a data structure that captures void state:

> COURAGE... Still responsible for producing GOLD snapshots with:
> - mpd_content
> - stud_skeleton (and stud_skeleton_v2 in COOL flows)
> - diagnostics / ground plane metadata.
>
> (HOMER-STUDIO-OLOG.md, lines 42-46)

The GOLD snapshot separates void structure (stud_skeleton) from current instantiation (mpd_content). This separation allows tools to operate on structure without disturbing instantiation, or to modify instantiation while preserving structure.

### 5.3 The Transformation Loop

The documentation describes a closed editing loop:

> 1. Author in Courage (or load an MPD there).
> 2. Run XRAY (RB) or related actions to emit a GOLD snapshot.
> 3. HOMER forwards that GOLD to WERE and MASTER via studio-load-gold-from-courage.
> 4. In WERE or MASTER: Use dials and group selection to move/rotate selected parts.
> 5. Export MPD from the lab.
> 6. HOMER captures were-export-mpd / master-export-mpd and forwards a single MPD stream to Courage.
> 7. Courage recompiles and becomes the new source of truth for the scene.
>
> (HOMER-STUDIO-OLOG.md, lines 158-167)

This is a void-to-scene-to-void cycle. COURAGE exports void structure; editing tools instantiate it; the result returns to COURAGE for recompilation into a new void structure. The cycle can repeat indefinitely, with each iteration refining the instantiation while preserving structural constraints.

### 5.4 Structure-Preserving Transformations

Critically, the pipeline preserves void structure through editing operations:

> WERE now remembers the original MPD (state.sourceLines) when loading GOLD. When exporting MPD from a skeleton scene, WERE:
> - Reads the lineNum metadata from skeleton comments.
> - Copies edited x/y/z and 3×3 matrix from the 3003 proxies.
> - Rewrites those transforms onto the original MPD lines in sourceLines.
> - Leaves the original file token (tmpd/ontology part path) untouched.
>
> (HOMER-STUDIO-OLOG.md, lines 84-89)

The system distinguishes between void structure (original part paths, semantic categories) and instantiation (spatial transforms). Editing modifies instantiation while preserving structure, ensuring that the void's semantic organization survives the transformation loop.

---

## 6. Case Study 3: The Brickbender Grid System

### 6.1 Context and Design Problem

Brickbender is a worldbuilding tool that represents narrative spaces as 9×9 grids. Its documentation introduces the core philosophy: "Build from the ground up, site by site, under a sky, for a perspective" (BRICKBENDER-PHILOSOPHY.md, lines 9-11). The design problem is making abstract narrative structure concrete and manipulable.

### 6.2 The Grid as Semantic Coordinate System

The grid provides a coordinate system for semantic attention:

> The grid has 81 cells, indexed 0…80. Conceptually it is a top-down map... So the grid is just a flat array of indices—philosophy and worldbuilding come from how you label and layer those indices.
>
> (BRICKBENDER-PHILOSOPHY.md, lines 28, 54)

The grid is not a spatial layout but a semantic topology. Cells represent not physical locations but narrative functions. The 81-cell structure provides enough granularity for complex narratives while remaining visually comprehensible.

### 6.3 The Four-Layer Stack

Each cell can be painted with one of four semantic layers:

> - Ground layer: navigation base—where you can walk.
> - Site layer: places and boundaries—where events happen.
> - Sky layer: atmosphere and mood—how it feels over time.
> - Perspective layer: camera and viewpoint—what is actually shown.
>
> (BRICKBENDER-PHILOSOPHY.md, lines 15-18)

Each layer answers a different design question. Ground addresses spatial constraints; Site addresses event locations; Sky addresses temporal and tonal qualities; Perspective addresses presentation. The layers are independent but compositional—a complete world emerges from their combination.

### 6.4 Morphisms as Void Operations

The documentation frames user interactions as morphisms—formal transformations on void state:

> So each click is a morphism: (groundState, index) → groundState', either adding or removing that index from the walkable set.
>
> (BRICKBENDER-PHILOSOPHY.md, lines 85-88)

This category-theoretic framing makes void operations explicit. The void is not a passive container but an algebraic structure with well-defined operations. Users manipulate the void through these operations, building up semantic structure incrementally.

### 6.5 Theoretical Connections

The Brickbender grid directly instantiates Lynch's cognitive mapping framework. Ground corresponds to paths (where movement is possible); boundaries between painted and unpainted cells correspond to edges; Site regions correspond to districts; intersections of Ground and Site correspond to nodes; high-contrast cells in the Perspective layer correspond to landmarks.

The four-layer stack also echoes Alexander's pattern language. Each layer is a pattern type addressing a recurring design challenge. The combination of layers forms a generative grammar: not all combinations are valid, but valid combinations produce coherent narrative worlds.

---

## 7. Cross-Case Analysis

### 7.1 Common Implementation Patterns

Despite their different domains (3D rendering, pipeline coordination, narrative design), the three implementations share consistent patterns:

**Visible void boundaries.** All three systems make void structure visible. GRACE uses pink placeholders; HOMER uses stud skeletons; Brickbender uses painted cells. Users can see not only what has been instantiated but also what remains empty.

**Explicit fidelity thresholds.** All three systems define when a void is "sufficiently filled." GRACE uses percentage completeness (85%); HOMER uses release conditions; Brickbender uses layer coverage. These thresholds legitimize partial instantiation as a working state rather than a failure.

**Structure-preserving transformations.** All three systems distinguish void structure from instantiation and preserve structure through editing operations. GRACE tracks line numbers; HOMER preserves original part paths; Brickbender maintains layer separation.

**Navigable semantic coordinates.** All three systems provide coordinate systems for locating positions within the void. GRACE uses line numbers and part names; HOMER uses pipeline stages and message types; Brickbender uses grid indices and layer names.

### 7.2 Theoretical Integration

These patterns operationalize principles from established theoretical frameworks:

| Pattern | Theoretical Framework | Operationalization |
|---------|----------------------|-------------------|
| Visible boundaries | Situated action (Suchman) | Plans as resources, not specifications |
| Fidelity thresholds | Graceful degradation (Avizienis) | Partial results as legitimate states |
| Structure preservation | Actor-network theory (Latour) | Translation without betrayal |
| Semantic coordinates | Cognitive mapping (Lynch) | Navigable possibility spaces |

The convergence is not coincidental. Void management is a design paradigm that operationalizes insights from multiple theoretical traditions, combining them into a coherent approach to human-AI collaboration.

---

## 8. Design Principles

Based on our analysis, we propose five design principles for void management systems:

**Principle 1: Make void boundaries visible.** Users should see what is missing, not just what is present. Void markers should be visually distinct, impossible to overlook, and informative about what would fill them.

**Principle 2: Define explicit fidelity thresholds.** Systems should specify when a void is "sufficiently filled" for a given purpose. This legitimizes partial instantiation and helps users assess progress.

**Principle 3: Preserve void structure through transformations.** Editing operations should modify instantiation while preserving semantic structure. This ensures that the void's organization survives iterative refinement.

**Principle 4: Use typed void ontologies.** Voids should specify not only that something is missing but what categories of things could fill them. Type constraints bound the possibility space while leaving room for creative choice.

**Principle 5: Make void spaces navigable.** Users should be able to locate positions within the void, understand its organization, and move between regions. Coordinate systems, layers, and landmarks support navigation.

---

## 9. Discussion

### 9.1 Implications for Human-AI Collaboration

Void management offers a different model of human-AI collaboration than the dominant prompt-response paradigm. Rather than asking "what should the AI produce?", void management asks "what possibility space should the AI prepare?" This shift has several implications.

First, it preserves human agency. The human makes final instantiation decisions rather than approving or rejecting AI-generated artifacts. The AI's role is preparation, not production.

Second, it enables incremental progress. Partially filled voids are useful intermediate states, not failures. Users can work incrementally, assessing progress and adjusting direction.

Third, it supports iterative refinement. Void structure persists through editing, providing stable scaffolding for successive approximation. Users can refine instantiation without losing semantic organization.

### 9.2 Limitations

Our analysis has several limitations. First, we examined only three implementations from a single archive. While the consistency of patterns across implementations is suggestive, broader sampling would strengthen claims of generality.

Second, we analyzed documentation and artifacts rather than observing actual use. User studies would reveal whether the patterns we identified actually support effective human-AI collaboration in practice.

Third, we focused on creative applications (3D modeling, narrative design). Void management may be less applicable to domains where complete, correct output is required rather than creative exploration.

### 9.3 Future Work

Several directions merit further investigation. Formal specification of void operations could enable automated reasoning about void transformations. Cross-void consistency mechanisms could maintain coherence when multiple voids are instantiated in the same scene. Void versioning could track how void structures evolve over time, analogous to version control for code.

---

## 10. Conclusion

This paper has demonstrated that void management is not merely a theoretical paradigm but an implemented practice. Three case studies from the DCE-GYO archive reveal consistent implementation patterns: visible void boundaries, explicit fidelity thresholds, structure-preserving transformations, and navigable semantic coordinates. These patterns operationalize principles from situated action theory, cognitive mapping, and pattern language research.

Void management offers a coherent alternative to scene-first generation in AI-assisted creative systems. By shifting the AI's role from production to preparation, it preserves human agency while leveraging AI capabilities for constraint mapping, candidate evaluation, and structural maintenance. The implementations analyzed here demonstrate that this paradigm can be built into editors, pipelines, and coordinate systems—providing a working example of void management at scale.

---

## References

Alexander, C., Ishikawa, S., & Silverstein, M. (1977). *A Pattern Language: Towns, Buildings, Construction*. Oxford University Press.

Avizienis, A., Laprie, J.-C., Randell, B., & Landwehr, C. (2004). Basic concepts and taxonomy of dependable and secure computing. *IEEE Transactions on Dependable and Secure Computing*, 1(1), 11-33.

Dourish, P. (2001). *Where the Action Is: The Foundations of Embodied Interaction*. MIT Press.

Friedman, B., & Hendry, D. G. (2019). *Value Sensitive Design: Shaping Technology with Moral Imagination*. MIT Press.

Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley.

Gustafson, A. (2011). *Adaptive Web Design: Crafting Rich Experiences with Progressive Enhancement*. Easy Readers.

Latour, B. (1987). *Science in Action: How to Follow Scientists and Engineers Through Society*. Harvard University Press.

Lynch, K. (1960). *The Image of the City*. MIT Press.

Nielsen, J. (1994). *Usability Engineering*. Morgan Kaufmann.

Rosenfeld, L., & Morville, P. (1998). *Information Architecture for the World Wide Web*. O'Reilly Media.

Schön, D. A. (1983). *The Reflective Practitioner: How Professionals Think in Action*. Basic Books.

Suchman, L. A. (1987). *Plans and Situated Actions: The Problem of Human-Machine Communication*. Cambridge University Press.

Tidwell, J. (2010). *Designing Interfaces: Patterns for Effective Interaction Design* (2nd ed.). O'Reilly Media.

---

## Appendix: Primary Sources

The following documents from the DCE-GYO archive were analyzed in this study:

1. GRACE-EDITOR-PHILOSOPHY.md — Design rationale for graceful degradation
2. HOMER-STUDIO-OLOG.md — Architecture specification for pipeline coordination
3. BRICKBENDER-PHILOSOPHY.md — Philosophy of semantic grid worldbuilding

All quotations include line numbers for verification against source documents.
