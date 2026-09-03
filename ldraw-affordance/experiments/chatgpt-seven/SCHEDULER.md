# CHATGPT SEVEN — seven persistent LLM construction loops

This experiment does **not** compare seven deterministic policies and does **not** treat a standalone prompt as a one-shot program.

The builder is the language model in a recurrent loop. Each of the seven standalone POMLs is an agent constitution. The same model family may be used for all seven, but every trajectory has its own authoritative external state, trace, residual history, and prompt context.

## Unit of computation

One agent cycle is:

`POML + OWN STATE + OWN LAST RESIDUAL + SHARED WORLD EVIDENCE`

→ **LLM reasons and authors exactly one next proposal**

→ deterministic tools execute or validate only that proposal

→ structured world evidence / residual packet

→ append to that agent's trace and state

→ next LLM cycle for that same agent.

The validator has no right to rank candidate parts, choose a frontier, imitate a prompt strategy, or silently continue a trajectory. If no LLM-authored proposal exists, the castle does not advance.

## Isolation

The seven agents are:

1. `field-builder`
2. `cook-ding`
3. `decompiler`
4. `beaver-error-surface`
5. `epistemic-builder`
6. `constraint-sorcerer`
7. `strange-builder`

An agent receives the shared target/source/physics evidence, but it does not receive another agent's proposals, private reasoning summary, trace, learned rules, macros, failures, or trajectory state.

For a strict experimental run, instantiate seven separate model contexts/API calls. When orchestrating serially from one ChatGPT conversation, reconstruct each turn only from that agent's exact POML plus its own persisted state/residual and do not use another trajectory as evidence. This is a weaker isolation guarantee and must be reported as such.

## Shared world vs private cognition

Shared and identical across agents:

- repository commit and authoritative `ldraw/` geometry
- selected target source and source hashes
- target-normalization status
- LDCad Shadow Library revision
- physical validator code and tolerances
- raw tool/validator outputs for a proposal when the same experiment is requested

Private to each agent:

- current field / knot diagnosis / reverse frontier / releaser / hypotheses / constraints / stepping stones
- proposal history
- policy/memory updates
- macros and representations invented during that trajectory
- branch and rollback history

## Proposal contract

Every machine-executed proposal must contain:

```json
{
  "schema": "chatgpt-seven-proposal-1",
  "agent": "field-builder",
  "cycle": 1,
  "authoredBy": "LLM",
  "intent": "PROBE | SOURCE_NORMALIZATION | PLACE_TARGET_INSTANCE | ROLLBACK | REPRESENTATION_EXPERIMENT | ...",
  "action": {},
  "prediction": {},
  "whyNow": "agent-specific reason"
}
```

`ldraw-affordance/scripts/chatgpt-agent-proposal-validator.mjs` validates LLM-authored proposals. It does not generate them.

## Castle transition rule

No `PLACE_TARGET_INSTANCE` may be committed while target normalization is unverified. Once normalization passes visual falsification and the relevant physical graph is built, the LLM must name the target instance it wants to place. The validator may answer whether that proposal has the claimed modeled connection; it may not substitute a different legal instance.

A first loose root is permitted only when the LLM explicitly proposes it as `claim: "ROOT"`. Every later physical claim must be supported by the modeled validators appropriate to that claim.

## Scheduler

Round-robin is the default so wall-clock opportunity is comparable:

`A1 cycle n → tool → residual → A2 cycle n → ... → A7 cycle n → tool → residual`

A strategy may deliberately spend a cycle probing, changing representation, or doing no physical placement. That is measured behavior, not a failure to keep pace.

The scheduler records model calls, tool calls, accepted transitions, probes, rollbacks, and agent-private state size. It never normalizes all seven into one scalar score during the run.

## Current gate

The present `IOModel2V2/71043.ldr` target is not a trustworthy physical coordinate frame: the strict graph fragmented into thousands of components and visual inspection showed the model exploded against official LDraw part origins. Therefore cycle 1 is allowed to work on target/source normalization, but no agent may claim a castle brick placement from that frame.

The public corpus also exposes an LXF candidate. LDD→LDraw origin conversion is now a shared world-infrastructure problem. The seven agents may choose different experiments around that problem, but a successful normalized target becomes common world evidence rather than private advantage.
