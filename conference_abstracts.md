# Conference Abstracts & Titles for "Tractor Folkologicus"

---

## 1. CHI (Human Factors in Computing Systems)

### Title
**"Care Under Pressure: Designing Ethical Narrative Systems Through Time-Constrained Interaction"**

### Abstract

We present Tractor Folkologicus, an interactive system that explores how temporal constraints and spatial topology shape human moral deliberation in narrative contexts. The system places users in a bounded 9×9 grid-world inhabited by agents whose persistence depends on user attention. Central to our design is a **7-second decision window**—a constraint that shifts cognition from planning toward presence and care. 

We argue that interaction design can operationalize philosophical concepts of urgency, consequence, and ethical agency. Unlike narrative games that frame morality as abstract choice, our system embeds ethics in **rhythm, spatial navigation, and resource scarcity** (attention as metabolic necessity). Users navigate narrative consequence through a media-analysis framework (the McLuhan tetrad: Enhance/Obsolesce/Retrieve/Reverse), which serves simultaneously as a gameplay mechanic and a model for understanding cultural systems.

This paper describes the system architecture, presents findings from a pilot study (N=12) on how time pressure influences perceived moral agency, and discusses implications for designing interfaces that cultivate ethical deliberation. We propose that **temporal design** can be leveraged to increase felt responsibility in interactive systems—a principle with applications to policy deliberation, crisis simulation, and speculative design pedagogy.

Keywords: temporal design, ethics, narrative interaction, time pressure, attentional economy

---

## 2. FAccT (Fairness, Accountability, and Transparency in AI)

### Title
**"Zero Ownership as Algorithmic Governance: Forking, Replication, and Distributed Accountability in Open-Source Narrative Systems"**

### Abstract

This paper proposes **zero ownership governance** as an alternative to corporate and institutional control of narrative-generation systems. Tractor Folkologicus is an LLM-based multi-agent environment where cultural narratives are modeled through a constraint system (LEGOS schema: Land, Economy, Government, Ontology, Society) and analyzed via media-theoretical operationalization (McLuhan's tetrad). 

Critically, the system is designed for unrestricted forking and replication. We argue that **distributed ownership (where anyone can fork, modify, and re-deploy) produces accountability through plurality rather than through centralized oversight**. This inverts the dominant FAccT assumption that algorithmic accountability requires institutional gatekeeping.

We present three threat models: (1) toxic narrative forking (malicious users replicating harmful cultural perspectives), (2) semantic drift (compounding hallucinations through translation cycles), and (3) governance collapse (conflicting forks creating irreconcilable versions). For each, we propose **values-driven forking protocols**—mechanisms that allow replication while maintaining coherence of core design principles.

This work bridges commons-based peer production (Benkler, 2006) with AI governance literature, arguing that transparency and accountability can be achieved through architectural commitment to *replicability* rather than *control*. We discuss implications for open-source AI systems, educational tools, and community-governed narrative platforms.

Keywords: governance, open-source, algorithmic accountability, forking, zero ownership, narrative AI

---

## 3. Design Studies / Design Research Society

### Title
**"The Grid as Theory: Designing Media-Analytical Systems Through Constraint, Rhythm, and Ontological Liquidity"**

### Abstract

This paper presents Tractor Folkologicus as a **design framework** that operationalizes media-theoretical concepts through interactive systems. Drawing on Marshall McLuhan's tetrad (Enhance/Obsolesce/Retrieve/Reverse) and cultural anthropology (thick description, ontological relativity), we propose a bounded spatial topology (9×9 grid) as a **queryable database of cultural systems**.

Design contribution: We introduce the **LEGOS schema** (Land, Economy, Government, Ontology, Society) as a universal categorization system for decomposing narratives and cultural phenomena *without reductionist collapse*. Unlike taxonomies that force-fit cultural specificity into generic categories, LEGOS maintains what we call **ontological liquidity**—the capacity to represent incommensurable worldviews within a shared constraint structure.

The system operationalizes three design principles: (1) **Rhythm as interface** (7-second decision cycles as the primary interaction mode), (2) **Scarcity as meaning** (attention-as-nutrient, where agent persistence depends on user engagement), and (3) **Catabolic renewal** (deliberate forgetting cycles that prevent memory bloat and enforce present-moment deliberation).

We analyze the system through design case-study methodology, examining how constraint structures shape user reasoning and emotional engagement. The work contributes to **speculative design pedagogy** and demonstrates how media theory can be grounded in artifact rather than abstraction. Implications extend to interactive criticism, design education, and the role of limitation in cultivating ethical attention.

Keywords: media theory, constraint design, ontology, narrative systems, speculative design, thick description

---

## 4. DH Quarterly (Digital Humanities) / ADHO

### Title
**"Operational Ekphrasis: Encoding McLuhan's Tetrad as a Machine-Readable Theory of Media"**

### Abstract

This paper presents a digital humanities intervention: the formalization of Marshall McLuhan's tetrad (Enhance/Obsolesce/Retrieve/Reverse) as an **operational constraint system** for narrative generation. Rather than treating media theory as interpretive apparatus *external* to computation, we argue for **bringing theory into the machine**—encoding humanistic insight as executable logic.

Tractor Folkologicus instantiates this principle through a neurosymbolic architecture that translates between natural language (LLM outputs) and symbolic grid states. The system treats the McLuhan tetrad not as analytical framework but as **generative grammar**—a formal rule system for producing narratives consistent with media-ecological principles. Cultural phenomena (modeled through LEGOS: Land, Economy, Government, Ontology, Society) are decomposed and recomposed according to tetrad constraints.

Methodologically, we adopt **operational ekphrasis**—the practice of writing machines that *perform* theoretical claims rather than simply encoding them. The system's 7-second decision cycles, attentional metabolism, and catabolic forgetting are not incidental features but **embodiments of media-theoretical premises**: urgency reveals care; scarcity generates meaning; forgetting enables renewal.

This work contributes to debates in digital humanities about *code as theory*, the relationship between formalization and philosophical depth, and the role of interactive systems in humanistic scholarship. We discuss how computational grounding can test, refine, and sometimes challenge theoretical assumptions—without reducing theory to algorithm.

Keywords: operational ekphrasis, media theory, McLuhan, digital humanities, neurosymbolic systems, computational theory

---

## 5. AAAI/IJCAI (AI Safety & Multi-Agent Systems)

### Title
**"Metabolic Agency in Bounded Multi-Agent Environments: Formalizing Attention-as-Nutrient and Catabolic Narrative Generation"**

### Abstract

We present a formal multi-agent system (MAS) architecture where agent persistence is directly coupled to user attention. Unlike traditional MAS (BDI, PDDL, STRIPS), which model agents as persistent autonomous entities, **Tractor Folkologicus models agents as metabolically dependent**—their computational state decays without interaction.

**Core contribution:** We formalize the concept of attention-as-nutrient through a decay function D(t) = e^(−λq(t)), where q(t) is cumulative user queries and λ is tunable decay rate. Agents exhibit three states: (1) **anabolic** (active reasoning, full LLM context), (2) **catabolic** (lossy compression, degraded reasoning), and (3) **dormant** (minimal state, awaiting reactivation). This models narrative consequence: neglected agents become unreliable, agents under pressure focus, and renewal requires explicit attention.

We embed the McLuhan tetrad as a **constraint satisfaction problem** over narrative-state transitions. Each of four operators (Enhance, Obsolesce, Retrieve, Reverse) corresponds to a formal operator in a lifted PDDL planner, constrained by a 9×9 spatial grid and a 7-second decision window.

**Evaluation:** We provide complexity analysis (O(n²) grid updates, O(k|LLM|) for translation cycles), establish bounds on catabolic drift (semantic coherence over 20 compression cycles), and present ablation studies (grid size, window duration, tetrad forcing vs. random exploration). We compare against random sampling and traditional narrative-generation baselines (ANGELINA, Tale-Spin adapted for LLMs).

Safety implications: We model forking-as-replication, analyze hallucinogenic cascade failures, and propose error-correction protocols for neurosymbolic translation. The system provides a testbed for evaluating ethical simulation and consequence modeling in bounded, resource-scarce MAS.

Keywords: multi-agent systems, metabolic models, attention, narrative generation, formal planning, AI safety, neurosymbolic systems

---

## Guidance by Venue

### CHI
- **Best if:** You have user study data or can collect it quickly. Focus on the human experience, decision-making under time pressure, and emotional/moral impact.
- **Tone:** Experiential, empirical, design-centered.
- **Acceptance rate:** ~25% (competitive but receptive to novel interaction paradigms).
- **Timeline:** Submission typically due Sept 15 for May conference.

### FAccT
- **Best if:** You want to emphasize governance, accountability, and the political dimensions of open-source AI. Safety community highly interested in governance alternatives.
- **Tone:** Critical, policy-aware, systems-thinking.
- **Acceptance rate:** ~20% (highly competitive; excellent venue for work on AI governance alternatives).
- **Timeline:** Submission typically due Nov 15 for June conference.

### Design Studies / DRS
- **Best if:** You have case-study data and want to theorize design constraints and their philosophical implications. Humanities-adjacent, receptive to speculative design.
- **Tone:** Theoretical, artifact-centered, critical.
- **Acceptance rate:** ~15–20% (lower acceptance but high prestige; journal more forgiving than conferences).
- **Timeline:** Rolling submissions; journal review cycle 6–9 months.

### DH Quarterly / ADHO
- **Best if:** You want to emphasize the *theoretical novelty* of operationalizing McLuhan. Humanities audience values conceptual contributions over empirical validation.
- **Tone:** Scholarly, historically situated, theory-forward.
- **Acceptance rate:** ~25–30% (more receptive to conceptual work; smaller but prestigious community).
- **Timeline:** Submission typically due April 1 for June conference.

### AAAI/IJCAI
- **Best if:** You commit to formal semantics, complexity analysis, and empirical ablations. Highest bar but also highest impact in AI research community.
- **Tone:** Formal, technical, comparative.
- **Acceptance rate:** ~20% (highly competitive; requires rigorous evaluation).
- **Timeline:** Submission typically due August 15 for February conference.

---

## Strategic Submission Path

**Recommended sequence (if submitting to multiple):**

1. **Start with CHI or DRS** (lower formalism bar; builds credibility; shorter turnaround).
2. **Follow with FAccT or DH** (mid-range formalism; thematically aligned; 3–6 months later).
3. **Target AAAI/IJCAI last** (highest bar; allows time to incorporate feedback and formalize results).

**Concurrent submission:** All five venues accept simultaneous submission *except* journals (Design Studies). Check each CFP for specific policies.

