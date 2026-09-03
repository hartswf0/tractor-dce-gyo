ZETTEL

ID:
Z-MULTIAGENT-TOPOLOGY-001

TITLE:
The Arrangement of the Agents Is Part of the Prompt Architecture

SOURCE:
Kunlun Zhu et al. — MultiAgentBench: Evaluating the Collaboration and Competition of LLM Agents — ACL 2025. 18

PASSAGE:
[PARAPHRASE] MultiAgentBench explicitly compares star, chain, tree, and graph coordination topologies as well as vanilla prompting, chain-of-thought, group discussion, and cognitive planning. Performance changes with coordination protocol rather than simply agent count. 19

RESEARCH OBJECT:
“USE MULTIPLE AGENTS” is radically underspecified.

A Hogwarts multi-agent system has another design object:

WHO CAN TALK TO WHOM?

That topology may be as consequential as the system prompts.

LOCAL MOVE:
Treat orchestration topology as an experimental variable.

SOURCE TERMS:
“star”
“chain”
“tree”
“graph”
“coordination protocol”
“group discussion”
“cognitive planning”

WHAT BECAME STRANGE:
A castle already has a dependency graph.

The multi-agent organization does not have to resemble an office org chart.

It could follow the object:

tower agent
↔ bridge agent
only where their subassemblies mate.

QUESTION:
Should communication topology mirror the current assembly dependency graph?

DEEPER QUESTION:
Can orchestration topology change dynamically as separate subassemblies become coupled?

MECHANISM:
assembly dependency graph G_t
→ derive communication graph C_t
→ local agents reason
→ messages cross dependency edges
→ integration agent resolves shared interfaces.

FORMAL SHIFT:
<FIXED MULTI-AGENT TEAM>
→ <TOPOLOGY AS CONTROL VARIABLE>
→ [REWIRE WITH TASK]
→ <STRUCTURE-AWARE COLLABORATION>

SOURCE FORMALISM:
MultiAgentBench evaluates centralized and decentralized star, tree, graph, and chain structures plus several planning-prompt strategies. 20

OUR FORMALIZATION:
[OUR FORMALIZATION — NOT SOURCE SYNTAX]

C_t = f(AssemblyDependencyGraph_t)

rather than:

C_t = fixed complete graph.

TENSION:
MultiAgentBench's strongest topology in one scenario cannot be transferred directly to physical assembly.

MISSING:
A benchmark where task-dependency topology is known and agent topology can be matched or mismatched experimentally.

BOUNDARY:
Graph coordination being useful in general agent benchmarks does not prove graph-isomorphic orchestration is optimal for Hogwarts.

CITATION TRAIL:
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]
→ MultiAgentBench
→ coordination topology
→ assembly-dependent agent graph.

TEST:
Use the same agent roles under:
star,
all-to-all,
hierarchical tree,
assembly-graph-matched topology.

Hold total token budget constant.

PLATFORM:
[[ORCHESTRATION TOPOLOGY]]

LINKS:
[[Z-HOGWARTS-DISTRIBUTED-BUILDER-001]]
[[Z-HOGWARTS-THREE-LOOPS-001]]

BIBTEX:
@inproceedings{zhu2025multiagentbench,
author    = {Kunlun Zhu and Hongyi Du and Zhaochen Hong and Xiaocheng Yang and Shuyi Guo and Zhe Wang and Zhenhailong Wang and Cheng Qian and Xiangru Tang and Heng Ji and Jiaxuan You},
title     = {MultiAgentBench: Evaluating the Collaboration and Competition of LLM Agents},
booktitle = {Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics},
pages     = {8580--8622},
year      = {2025},
doi       = {10.18653/v1/2025.acl-long.421}
}