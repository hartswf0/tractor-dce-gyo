# The Shopper and the Detective

Video essay for Film Butter. Conceptual basis: Watson Hartsoe, *Milk, Bread, Eggs: The Shopping List as a Partial Future-State Language*, supplied working paper, 18 September 2026. This is an implementation study, not a verification of every historical citation in that paper.

## What was actually run

Two separate Codex LLM operators issued 15 public tool actions in total. The shopper received the desired basket. The detective received position, witnessed pickups and its own notebook; the receipt was revealed after checkout. Root coordinated a pause before each pickup to give the detective an observation opportunity, without sending the detective the shopper's private checklist. The shopper independently chose banana → bread → carrot. A deterministic pathfinding tool executed requested destinations through the same collision-checked movement used by players. It did not decide what to collect or write the detective's notes.

The accepted game clock records collection at 3.033, 3.783 and 6.533 seconds, and checkout at 9.683 seconds. Model response latency and coordination pauses are omitted. The replay lasts 12.683 seconds including its receipt hold. The video essay shows it at half speed and labels that edit. Its synthesized narration uses local Flite; it is not either model's spoken reasoning. Public reasons and outcomes remain in `llm-operators.json`.

## Narration

**Opening.** A shopping list names a future without describing every step. Here, one language model shops. Another plays Maggie, the detective. They share the same native Green Grocer, but keep different records.

**Playthrough.** The shopper chooses bananas, bread, and carrots. A navigation tool supplies the route; collision checks constrain movement. Maggie writes each pickup after it appears in her witness feed. Finally, the shopper returns to the register and commits the basket.

**Comparison.** The notebook and receipt agree on three items, though their order differs. Agreement came from a running game, not from copying the goal list. This local two-tab test used two real language model operators. Phone WebRTC remains unverified. Inventory transfer is a game rule, not proof of a structurally valid LEGO build.

## Interpretation and limits

The checklist is prospective; the notebook is retrospective; the receipt records a committed transaction. Their different orderings do not prevent membership agreement. These roles implement the supplied paper's distinction between a norm for action and a record of action. They also expose the apparatus doing the missing work: source-instance grounding, route search, collision checks, visibility, event delivery and state persistence. The words alone did not execute the trip.

This run contains no missed pickups or notebook correction. It demonstrates agreement under coordinated observation opportunities, not robust detective performance under adversarial occlusion. The host visibility gate checks range and unobstructed line of sight, not the detective camera's viewing cone or visual recognition. Native item IDs are supplied in the witness feed; the LLM does not identify groceries from pixels. The implementation makes these competencies explicit rather than claiming they were inferred visually.

The two-operator run uses the explicitly labelled BroadcastChannel local transport. PeerJS signaling exchanged offers and answers, but no usable WebRTC data channel was established in this sandbox. No real phone-network or TURN test passed. QR generation is restricted to hosted web URLs and is not evidence of connectivity. The current player has not been publicly deployed.

Navigation is a swept game envelope against native leaf bounds. Collecting moves an item into inventory; no hand-grip animation is asserted. The older choreographed take remains blocked by unresolved contacts. Neither this film nor the source-step review establishes LEGO connection legality, support or structural stability.
