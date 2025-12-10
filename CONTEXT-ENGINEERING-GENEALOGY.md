# CONTEXT ENGINEERING GENEALOGY

## Tracing the Material-Semiotic Roots of Pragmatic Context Management in LLM Systems

---

```
═══════════════════════════════════════════════════════════════════════════════
RESEARCH PARAMETERS
═══════════════════════════════════════════════════════════════════════════════
Scope:          Archival, academic, and practitioner literature
Disciplines:    HCI, AI/ML, STS, Design Research, Urban Theory
Temporal Range: 1960–2025
Focus:          Context as material; engineering as design practice
Date:           December 2025
═══════════════════════════════════════════════════════════════════════════════
```

---

## PART I: CONCEPTUAL FOUNDATIONS

### 1. Thick Description (Geertz, 1973)

**SOURCE:** Clifford Geertz, "Thick Description: Toward an Interpretive Theory of Culture," *The Interpretation of Cultures* (Basic Books, 1973).

**CORE CLAIM:**
Culture is not a power to which events can be causally attributed; it is a *context* within which they can be intelligibly described.

> "As interworked systems of construable signs (what, ignoring provincial usages, I would call symbols), culture is not a power, something to which social events, behaviors, institutions, or processes can be causally attributed; it is a context, something within which they can be intelligibly—that is, thickly—described."
> — Geertz, 1973

**RELEVANCE TO CONTEXT ENGINEERING:**
Geertz's insight that context is not causal background but *constitutive frame* anticipates the LLM paradigm where context determines meaning. A prompt without context is "thin description"—syntactically valid but semantically impoverished.

**BRIDGE TO LLM PRACTICE:**
| Geertz Concept | LLM Equivalent |
|----------------|----------------|
| Thick description | Rich system prompt with examples |
| Thin description | Bare instruction without context |
| Interpretive frame | Persona, role, constraints |
| Cultural symbol | Token with semantic loading |

---

### 2. Situated Action (Suchman, 1987)

**SOURCE:** Lucy Suchman, *Plans and Situated Actions: The Problem of Human-Machine Communication* (Cambridge University Press, 1987).

**CORE CLAIM:**
Human action is fundamentally *situated*—it emerges from moment-to-moment responses to circumstances, not from the execution of pre-formed plans.

> "Suchman's argument is that much of human action is inescapably 'situated' in that it is made of responses to the specific circumstances."
> — Goodreads summary

**RELEVANCE TO CONTEXT ENGINEERING:**
Suchman's critique of the "planning model" in AI directly anticipates the failure mode of scene management. Plans (prompts) cannot anticipate all circumstances; action must be responsive to evolving context.

**KEY INSIGHT:**
The planning model assumes:
1. Agent forms complete plan
2. Agent executes plan
3. Environment passively receives action

Situated action recognizes:
1. Agent and environment co-evolve
2. Plans are resources for action, not specifications of it
3. Context is not background but *constitutive*

**BRIDGE TO LLM PRACTICE:**
| Suchman Concept | LLM Equivalent |
|-----------------|----------------|
| Plan | System prompt |
| Situated action | Turn-by-turn response |
| Circumstance | Conversation history |
| Opacity of machine | Black-box model behavior |

---

### 3. Material-Semiotic Analysis (Latour, Callon, Law, 1980s–present)

**SOURCE:** Bruno Latour, Michel Callon, John Law, Actor-Network Theory (ANT), developed through Science and Technology Studies (STS).

**CORE CLAIM:**
Meaning and materiality are inseparable. Objects, texts, and technologies are not passive carriers of human intention but active participants in networks of meaning-making.

> "ANT is an ongoing project that seeks to radically transform how social scientists talk about society's relationship to technology and other nonhuman actors."
> — Cyborgology, 2011

**RELEVANCE TO CONTEXT ENGINEERING:**
Context is not just information (semiotic) but also infrastructure (material). The context window is a *material constraint* that shapes what meanings are possible.

**KEY CONCEPTS:**

| ANT Concept | Definition | LLM Application |
|-------------|------------|-----------------|
| **Actor** | Any entity that makes a difference | Token, prompt, tool, user |
| **Network** | Heterogeneous assemblage of actors | Context window contents |
| **Translation** | Process of aligning interests | Prompt engineering |
| **Inscription** | Encoding of interests in artifacts | System prompt design |
| **Black box** | Stabilized network treated as unit | Fine-tuned model |

---

### 4. Situated Knowledges (Haraway, 1988)

**SOURCE:** Donna Haraway, "Situated Knowledges: The Science Question in Feminism and the Privilege of Partial Perspective," *Feminist Studies* 14(3), 1988.

**CORE CLAIM:**
All knowledge is produced from particular positions; objectivity is not a "view from nowhere" but accountability for one's situatedness.

> "Feminist objectivity means quite simply situated knowledges."
> — Haraway, 1988

**RELEVANCE TO CONTEXT ENGINEERING:**
LLM outputs are not objective truths but *situated productions*—shaped by training data, system prompts, and conversation history. Context engineering is the practice of *accountable situating*.

**BRIDGE TO LLM PRACTICE:**
| Haraway Concept | LLM Equivalent |
|-----------------|----------------|
| Partial perspective | Model's training distribution |
| Situatedness | Context window state |
| Accountability | Transparency about constraints |
| Vision as embodied | Attention as architectural |

---

### 5. Embodied Interaction (Dourish, 2001)

**SOURCE:** Paul Dourish, *Where the Action Is: The Foundations of Embodied Interaction* (MIT Press, 2001).

**CORE CLAIM:**
Interaction is not abstract information exchange but *embodied practice*—shaped by physical, social, and temporal context.

> "Context is not something that describes a setting; it is something that people do. It is an achievement, not an observation."
> — Dourish, 2004

**RELEVANCE TO CONTEXT ENGINEERING:**
Dourish's critique of "context-aware computing" anticipates the limits of naive context injection. Context cannot simply be "captured" and "provided"—it must be *enacted* through interaction.

**KEY INSIGHT:**
Early context-aware computing assumed:
1. Context is a set of observable features
2. These features can be sensed and encoded
3. Systems can adapt behavior based on encoded context

Dourish argues:
1. Context is interactionally constituted
2. Meaning emerges from practice, not representation
3. Systems must support contextual *action*, not just contextual *information*

---

### 6. Reflective Practice (Schön, 1983)

**SOURCE:** Donald Schön, *The Reflective Practitioner: How Professionals Think in Action* (Basic Books, 1983).

**CORE CLAIM:**
Professional expertise is not the application of technical rules but *reflection-in-action*—a conversation with the situation.

> "They deal with highly contingent problems by reflecting on the observed consequences of their moves ('reflection-in-action') and on their approach to the problem ('reflection-on-action')."
> — Andy Matuschak notes

**RELEVANCE TO CONTEXT ENGINEERING:**
Prompt engineering is not rule-following but reflective practice. The engineer observes model behavior, reflects on prompt structure, and iteratively refines.

**BRIDGE TO LLM PRACTICE:**
| Schön Concept | LLM Equivalent |
|---------------|----------------|
| Reflection-in-action | Iterative prompt refinement |
| Conversation with situation | Observing model outputs |
| Repertoire | Library of prompt patterns |
| Problem framing | Task decomposition |

---

## PART II: ARCHITECTURAL METAPHORS

### 7. The Image of the City (Lynch, 1960)

**SOURCE:** Kevin Lynch, *The Image of the City* (MIT Press, 1960).

**CORE CLAIM:**
People navigate cities through *cognitive maps* built from five elements: paths, edges, districts, nodes, and landmarks.

> "Lynch's conclusion was that people formed mental maps of their cities consisting of five elements: paths, edges, districts, nodes, and landmarks."
> — Wikipedia

**RELEVANCE TO CONTEXT ENGINEERING:**
Context engineering is *cognitive cartography* for LLMs. The system prompt defines paths (workflows), edges (boundaries), districts (domains), nodes (decision points), and landmarks (key examples).

**BRIDGE TO LLM PRACTICE:**
| Lynch Element | LLM Equivalent |
|---------------|----------------|
| **Path** | Workflow, procedure, chain-of-thought |
| **Edge** | Constraint, boundary, forbidden action |
| **District** | Domain, topic, persona scope |
| **Node** | Decision point, branching logic |
| **Landmark** | Key example, canonical case |

---

### 8. A Pattern Language (Alexander, 1977)

**SOURCE:** Christopher Alexander, Sara Ishikawa, Murray Silverstein, *A Pattern Language: Towns, Buildings, Construction* (Oxford University Press, 1977).

**CORE CLAIM:**
Good design emerges from the application of *patterns*—recurring solutions to recurring problems, organized in a generative grammar.

> "A Pattern Language... described a practical architectural system in a form that a theoretical mathematician or computer scientist might call a generative grammar."
> — Wikipedia

**RELEVANCE TO CONTEXT ENGINEERING:**
Prompt patterns are Alexander patterns for LLM interaction. Each pattern addresses a recurring problem (e.g., "how to elicit step-by-step reasoning") with a proven solution (e.g., "chain-of-thought prompting").

**BRIDGE TO LLM PRACTICE:**
| Alexander Concept | LLM Equivalent |
|-------------------|----------------|
| Pattern | Prompt template |
| Pattern language | Prompt library |
| Generative grammar | Composable prompt structure |
| Quality without a name | Effective model behavior |

---

### 9. Information Architecture (Rosenfeld & Morville, 1998)

**SOURCE:** Louis Rosenfeld & Peter Morville, *Information Architecture for the World Wide Web* (O'Reilly, 1998; 4th ed. 2015).

**CORE CLAIM:**
Information must be *architected*—organized, labeled, and structured—to be findable and usable.

> "Information architecture (IA) is far more challenging—and necessary—than ever. With the glut of information available today, anything your organization wants to share should be easy to find, navigate, and understand."
> — O'Reilly description

**RELEVANCE TO CONTEXT ENGINEERING:**
Context engineering is information architecture for the context window. The engineer must organize, label, and structure information so the model can "find" and "use" it effectively.

**BRIDGE TO LLM PRACTICE:**
| IA Concept | LLM Equivalent |
|------------|----------------|
| Organization | Prompt structure (sections, headers) |
| Labeling | XML tags, markdown formatting |
| Navigation | Tool descriptions, workflow guidance |
| Search | Retrieval-augmented generation |

---

## PART III: CONTEMPORARY CONTEXT ENGINEERING

### 10. The Emergence of Context Engineering (2024–2025)

**KEY MOMENT:** Andrej Karpathy's tweet (June 2025) endorsing "context engineering" over "prompt engineering."

> "After coining 'vibe coding', Andrej Karpathy just dropped another bomb of a tweet mentioning he prefers context engineering over prompt engineering."
> — Reddit, r/PromptEngineering

**DEFINITION (Anthropic, 2025):**

> "Context engineering is the art and science of curating what will go into the limited context window from that constantly evolving universe of possible information."
> — Anthropic Engineering Blog

**PARADIGM SHIFT:**

| Prompt Engineering | Context Engineering |
|--------------------|---------------------|
| Focus on instruction text | Focus on entire context state |
| One-shot optimization | Iterative, multi-turn management |
| Static prompt design | Dynamic context curation |
| "What to say" | "What to include" |

---

### 11. Context Rot and Attention Scarcity (2024–2025)

**SOURCE:** Chroma Research, "Context Rot" (2024); Anthropic Engineering Blog (2025).

**CORE CLAIM:**
As context length increases, model performance degrades. Context is a *finite resource with diminishing marginal returns*.

> "Studies on needle-in-a-haystack style benchmarking have uncovered the concept of context rot: as the number of tokens in the context window increases, the model's ability to accurately recall information from that context decreases."
> — Anthropic, 2025

**MECHANISM:**
- Transformer attention is O(n²) in context length
- Models trained on shorter sequences have less experience with long-range dependencies
- Every token depletes the "attention budget"

**IMPLICATION:**
Context engineering is *resource management*. The engineer must maximize signal-to-noise ratio within a finite attention budget.

---

### 12. Compaction and Structured Note-Taking (2025)

**SOURCE:** Anthropic Engineering Blog, "Effective Context Engineering for AI Agents" (2025).

**COMPACTION:**
> "Compaction is the practice of taking a conversation nearing the context window limit, summarizing its contents, and reinitiating a new context window with the summary."

**STRUCTURED NOTE-TAKING:**
> "Structured note-taking, or agentic memory, is a technique where the agent regularly writes notes persisted to memory outside of the context window. These notes get pulled back into the context window at later times."

**RELEVANCE TO VOID MANAGEMENT:**
These techniques are *implicit void management*. Compaction reduces scenes to voids (essential structure). Structured notes externalize voids for later instantiation.

---

### 13. Model Context Protocol (MCP) (2024–2025)

**SOURCE:** Anthropic, "Introducing the Model Context Protocol" (November 2024).

**CORE CLAIM:**
MCP is an open protocol for connecting LLMs to external data sources and tools, replacing fragmented custom integrations.

> "Instead of maintaining separate connectors for each data source, developers can now build against a standard protocol. As the ecosystem matures, AI systems will maintain context as they move between different tools and datasets."
> — Anthropic, 2024

**RELEVANCE TO CONTEXT ENGINEERING:**
MCP is *infrastructure for context*. It standardizes how context flows into the model, enabling systematic context engineering at scale.

---

### 14. A Survey of Context Engineering (Mei et al., 2025)

**SOURCE:** Lingrui Mei et al., "A Survey of Context Engineering for Large Language Models," arXiv:2507.13334 (July 2025).

**CORE CLAIM:**
Context engineering is a formal discipline encompassing:
1. **Context retrieval and generation** — obtaining relevant information
2. **Context processing** — transforming information for model consumption
3. **Context management** — maintaining coherence over time

**TAXONOMY:**
```
Context Engineering
├── Foundational Components
│   ├── Context Retrieval & Generation
│   ├── Context Processing
│   └── Context Management
└── System Implementations
    ├── Retrieval-Augmented Generation (RAG)
    ├── Memory Systems & Tool-Integrated Reasoning
    └── Multi-Agent Systems
```

**KEY FINDING:**
> "A fundamental asymmetry exists between model capabilities. While current models, augmented by advanced context engineering, demonstrate remarkable proficiency in understanding complex contexts, they exhibit pronounced limitations in generating equally sophisticated, long-form outputs."

---

## PART IV: ETHICAL AND RISK DIMENSIONS

### 15. Constitutional AI (Anthropic, 2022)

**SOURCE:** Yuntao Bai et al., "Constitutional AI: Harmlessness from AI Feedback," arXiv:2212.08073 (December 2022).

**CORE CLAIM:**
AI systems can be aligned with human values by training against a set of principles (a "constitution") that the model uses to evaluate and revise its own outputs.

> "The approach is called Constitutional AI (CAI) because it gives an AI system a set of principles (i.e., a 'constitution') against which it can evaluate its own outputs."
> — Anthropic, 2022

**RELEVANCE TO CONTEXT ENGINEERING:**
The constitution is a *meta-context*—a set of constraints that shape all subsequent context processing. This is void management at the training level.

---

### 16. Prompt Injection and Guardrails (2023–2025)

**SOURCE:** OpenAI, "Understanding Prompt Injections" (2025); Lakera, "Guide to Prompt Injection" (2024).

**CORE CLAIM:**
Prompt injection is a security vulnerability where malicious input overrides system instructions. Guardrails are defensive context engineering.

> "New levels of intelligence and capability require the technology, society, and the risk mitigation strategy to co-evolve."
> — OpenAI, 2025

**RELEVANCE TO CONTEXT ENGINEERING:**
Risk mitigation is *defensive context architecture*. The engineer must design context structures that are robust to adversarial manipulation.

**GUARDRAIL PATTERNS:**
| Pattern | Description |
|---------|-------------|
| Input validation | Filter malicious tokens before context |
| Output filtering | Block harmful generations |
| Privilege separation | Limit tool access based on context |
| Instruction hierarchy | System > user > injected |

---

### 17. Value Sensitive Design (Friedman & Hendry, 2019)

**SOURCE:** Batya Friedman & David G. Hendry, *Value Sensitive Design: Shaping Technology with Moral Imagination* (MIT Press, 2019).

**CORE CLAIM:**
Technology design should proactively account for human values, not just functional requirements.

**RELEVANCE TO CONTEXT ENGINEERING:**
Context engineering is *value-laden*. The choice of what to include in context, how to structure it, and what to exclude embeds values in the system.

**VALUE DIMENSIONS:**
| Value | Context Engineering Implication |
|-------|--------------------------------|
| **Agency** | User control over context |
| **Transparency** | Visibility of context state |
| **Privacy** | What context is retained/discarded |
| **Fairness** | Whose perspectives are included |

---

## PART V: COMMUNITY AND PRACTICE

### 18. Open-Source Prompt Communities (2022–2025)

**KEY REPOSITORIES:**
- **Awesome-Prompt-Engineering** (promptslab/GitHub) — curated prompt resources
- **Awesome-LLM** (Hannibal046/GitHub) — comprehensive LLM resources
- **Microsoft Prompt Engine** — library for prompt construction
- **LangChain** — framework for LLM application development
- **DSPy** — programming model for LLM pipelines

**COMMUNITY PRACTICES:**
| Practice | Description |
|----------|-------------|
| Prompt sharing | Public repositories of effective prompts |
| Template libraries | Reusable prompt structures |
| Evaluation benchmarks | Standardized tests for prompt quality |
| Collaborative refinement | Community iteration on prompts |

---

### 19. Creative Coding and Generative Art (2022–2025)

**SOURCE:** Wu & Compton, "Exploring Bridges Between Algorithmic and AI-generated Art," arXiv:2406.05508 (2024).

**CORE CLAIM:**
AI-generated art and algorithmic art share common ground in *generative systems*—processes that produce outputs from constrained possibility spaces.

> "By focusing on algorithmic art, we are interested in the generative art practice where artists 'program computers to undertake creative instructions.'"
> — Wu & Compton, 2024

**RELEVANCE TO CONTEXT ENGINEERING:**
Creative coding with LLMs is *context-as-medium*. The artist shapes the context to shape the generation, treating the prompt as sculptural material.

---

### 20. Interactive Fiction and Digital Storytelling (2020–2025)

**KEY DEVELOPMENTS:**
- AI Dungeon (2019) — early LLM-powered interactive fiction
- NovelAI (2021) — community-driven AI storytelling
- Character.AI (2022) — persona-based conversation
- Branching narrative tools (2024–2025) — multi-path story generation

**CONTEXT ENGINEERING IN NARRATIVE:**
| Narrative Element | Context Engineering Technique |
|-------------------|------------------------------|
| World state | Persistent context memory |
| Character voice | Persona prompts |
| Plot coherence | Structured note-taking |
| Player agency | Void-based possibility spaces |

---

## PART VI: SYNTHESIS — CONTEXT AS MATERIAL

### The Material Turn in Context Engineering

Context engineering represents a *material turn* in AI practice. Context is not just information to be processed but *material to be shaped*—with properties, constraints, and affordances.

**MATERIAL PROPERTIES OF CONTEXT:**

| Property | Description | Engineering Implication |
|----------|-------------|------------------------|
| **Finitude** | Context window has fixed size | Compression, selection |
| **Decay** | Attention degrades with length | Prioritization, compaction |
| **Structure** | Organization affects retrieval | Formatting, sectioning |
| **Composition** | Elements interact | Coherence, conflict resolution |
| **Persistence** | Some context survives, some doesn't | Memory architecture |

### Architectural Metaphor

Context engineering is to LLM systems as urban planning is to cities:

| Urban Planning | Context Engineering |
|----------------|---------------------|
| Zoning | Domain separation |
| Infrastructure | Tool integration (MCP) |
| Wayfinding | Workflow guidance |
| Landmarks | Key examples |
| Density limits | Token budgets |
| Historic preservation | Context persistence |

### The Void Management Connection

The void management thesis is a *specific theory* within the broader practice of context engineering:

| Context Engineering (General) | Void Management (Specific) |
|-------------------------------|---------------------------|
| Curate context for optimal performance | Define bounded possibility spaces |
| Manage context over time | Prevent complexity accumulation |
| Structure context for retrieval | Export void structures independently |
| Balance signal and noise | Maintain narrative fidelity threshold |

---

## PART VII: KEY FIGURES AND TIMELINE

### Intellectual Genealogy

```
1960s-1970s: FOUNDATIONAL THEORY
├── Geertz (1973) — Thick description
├── Simon (1962) — Architecture of complexity
└── Alexander (1977) — Pattern language

1980s-1990s: SITUATED COMPUTING
├── Suchman (1987) — Situated action
├── Winograd & Flores (1986) — Understanding computers
├── Haraway (1988) — Situated knowledges
├── Schön (1983) — Reflective practitioner
└── Latour et al. (1980s) — Actor-network theory

2000s: EMBODIED INTERACTION
├── Dourish (2001) — Embodied interaction
├── Bowker & Star (1999) — Sorting things out
└── Rosenfeld & Morville (1998) — Information architecture

2010s: DEEP LEARNING ERA
├── Attention mechanism (2014) — Bahdanau et al.
├── Transformer (2017) — Vaswani et al.
└── GPT-2 (2019) — OpenAI

2020s: CONTEXT ENGINEERING ERA
├── GPT-3 (2020) — OpenAI
├── Constitutional AI (2022) — Anthropic
├── ChatGPT (2022) — OpenAI
├── MCP (2024) — Anthropic
├── Context rot research (2024) — Chroma
├── Karpathy "context engineering" (2025)
└── Survey of Context Engineering (2025) — Mei et al.
```

### Key Figures

| Figure | Contribution | Era |
|--------|--------------|-----|
| **Clifford Geertz** | Thick description, context as interpretive frame | 1970s |
| **Lucy Suchman** | Situated action, critique of planning model | 1980s |
| **Bruno Latour** | Actor-network theory, material-semiotic analysis | 1980s–2000s |
| **Donna Haraway** | Situated knowledges, accountability | 1980s |
| **Paul Dourish** | Embodied interaction, context as achievement | 2000s |
| **Christopher Alexander** | Pattern language, generative design | 1970s |
| **Kevin Lynch** | Cognitive mapping, urban imageability | 1960s |
| **Donald Schön** | Reflective practice | 1980s |
| **Andrej Karpathy** | "Context engineering" framing | 2025 |
| **Anthropic Engineering** | MCP, compaction, structured notes | 2024–2025 |

---

## PART VIII: FULL BIBLIOGRAPHY

### Primary Sources (Foundational Theory)

1. Alexander, C., Ishikawa, S., & Silverstein, M. (1977). *A Pattern Language: Towns, Buildings, Construction*. Oxford University Press.

2. Bowker, G. C., & Star, S. L. (1999). *Sorting Things Out: Classification and Its Consequences*. MIT Press.

3. Dourish, P. (2001). *Where the Action Is: The Foundations of Embodied Interaction*. MIT Press.

4. Dourish, P. (2004). What we talk about when we talk about context. *Personal and Ubiquitous Computing*, 8(1), 19–30.

5. Friedman, B., & Hendry, D. G. (2019). *Value Sensitive Design: Shaping Technology with Moral Imagination*. MIT Press.

6. Geertz, C. (1973). Thick description: Toward an interpretive theory of culture. In *The Interpretation of Cultures* (pp. 3–30). Basic Books.

7. Haraway, D. (1988). Situated knowledges: The science question in feminism and the privilege of partial perspective. *Feminist Studies*, 14(3), 575–599.

8. Latour, B. (1987). *Science in Action: How to Follow Scientists and Engineers Through Society*. Harvard University Press.

9. Lynch, K. (1960). *The Image of the City*. MIT Press.

10. Rosenfeld, L., & Morville, P. (1998). *Information Architecture for the World Wide Web*. O'Reilly Media.

11. Schön, D. A. (1983). *The Reflective Practitioner: How Professionals Think in Action*. Basic Books.

12. Star, S. L., & Griesemer, J. R. (1989). Institutional ecology, 'translations' and boundary objects. *Social Studies of Science*, 19(3), 387–420.

13. Suchman, L. A. (1987). *Plans and Situated Actions: The Problem of Human-Machine Communication*. Cambridge University Press.

14. Winograd, T., & Flores, F. (1986). *Understanding Computers and Cognition: A New Foundation for Design*. Ablex.

### Secondary Sources (Contemporary AI/HCI)

15. Anthropic. (2024, November). Introducing the Model Context Protocol. https://www.anthropic.com/news/model-context-protocol

16. Anthropic. (2025). Effective context engineering for AI agents. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

17. Bai, Y., et al. (2022). Constitutional AI: Harmlessness from AI feedback. arXiv:2212.08073.

18. Mei, L., et al. (2025). A survey of context engineering for large language models. arXiv:2507.13334.

19. OpenAI. (2025). Understanding prompt injections: A frontier security challenge. https://openai.com/index/prompt-injections/

20. Schmid, P. (2025). The new skill in AI is not prompting, it's context engineering. Hugging Face Blog.

### Tertiary Sources (Community and Practice)

21. Awesome-Prompt-Engineering. GitHub: promptslab/Awesome-Prompt-Engineering.

22. LangChain. https://www.langchain.com/

23. Microsoft Prompt Engine. GitHub: microsoft/prompt-engine.

24. Wu, J., & Compton, K. (2024). Exploring bridges between algorithmic and AI-generated art. arXiv:2406.05508.

---

## APPENDIX: GLOSSARY OF TERMS

| Term | Definition | Source |
|------|------------|--------|
| **Thick description** | Interpretive account that includes context and meaning | Geertz (1973) |
| **Situated action** | Action that emerges from circumstances, not plans | Suchman (1987) |
| **Material-semiotic** | Inseparability of meaning and materiality | Latour et al. |
| **Situated knowledges** | Knowledge produced from particular positions | Haraway (1988) |
| **Embodied interaction** | Interaction shaped by physical/social context | Dourish (2001) |
| **Reflection-in-action** | Thinking while doing, responsive to situation | Schön (1983) |
| **Pattern language** | Generative grammar of design solutions | Alexander (1977) |
| **Boundary object** | Artifact enabling collaboration across communities | Star & Griesemer (1989) |
| **Context rot** | Degradation of model performance with context length | Chroma (2024) |
| **Compaction** | Summarizing context to fit window limits | Anthropic (2025) |
| **MCP** | Model Context Protocol for tool integration | Anthropic (2024) |
| **Constitutional AI** | Training against explicit value principles | Anthropic (2022) |
| **Void management** | Managing bounded possibility spaces, not scenes | DCE-GYO thesis |

---

*Genealogy complete. Context engineering is not a new invention but the convergence of thick description, situated action, material-semiotic analysis, and architectural design thinking—now applied to the material constraints of LLM context windows.*

*Report compiled December 2025.*
