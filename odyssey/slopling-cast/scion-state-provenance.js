/**
 * SCION-STATE-PROVENANCE (`window.ScionStateProvenance`)
 * Synthesizing:
 *   - Lineage #25: Rive — Interactive Puppet State Machines
 *   - Lineage #43: Collage Graph Rewriting
 *   - Lineage #48: State Machines — Characters That Can Refuse
 *   - Lineage #54: Provenance Graph — Archive-to-Puppet Lineage
 *
 * Self-contained browser & Node JS module providing:
 *   Part A (`StateMachine`): 5-Axis Dramatic State Machine for "Characters That Can Refuse"
 *   Part B (`ProvenanceGraph`): Archive-to-Puppet Provenance Graph for every cutout, prop, tableau, emotion & rig part
 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ScionStateProvenance = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this), function (root) {
  'use strict';

  // ============================================================================
  // LINEAGE THEOREMS & METADATA
  // ============================================================================
  const LINEAGES = {
    RIVE_PUPPET_STATE_MACHINES: {
      id: 25,
      name: 'Rive — Interactive Puppet State Machines',
      theorem: 'Bind articulated puppet layers and blend states directly to live state-machine inputs and transitions.'
    },
    COLLAGE_GRAPH_REWRITING: {
      id: 43,
      name: 'Collage Graph Rewriting',
      theorem: 'Every dramatic beat is a graph rewrite over the actor\'s open action set: adding edges via Assistance and Craft Transmission or pruning/contaminating edges via Poison Pills and Smokescreens.'
    },
    CHARACTERS_THAT_CAN_REFUSE: {
      id: 48,
      name: 'State Machines — Characters That Can Refuse',
      theorem: 'Turn a cast into actors who perceive, choose, resist and remember, instead of puppets that obey buttons unconditionally.'
    },
    ARCHIVE_TO_PUPPET_PROVENANCE: {
      id: 54,
      name: 'Provenance Graph — Archive-to-Puppet Lineage',
      theorem: 'Ensure no puppet, composite or scene becomes untraceable to its constituent sources or masks. The production state should answer where an image came from and how it changed.'
    }
  };

  // ============================================================================
  // PART A: CHARACTERS THAT CAN REFUSE — 5-AXIS DRAMATIC STATE MACHINE
  // ============================================================================

  const INITIAL_REGISTERS = Object.freeze({
    craftAutonomy: 35,     // Embodied skill, measurement by hand, patience (starts at 35)
    refusalCapacity: 40,   // Power to decline false promotions, slop shortcuts, coercive framing (starts at 40)
    slopEntanglement: 65,  // Institutional pressure, metric-gaming, automated smooth talk (starts at 65 in Ch I)
    lineageMemory: 20,     // Kept tools, guild oaths, navigational swells, Laertes' orchard records (starts at 20)
    actionSetOpenness: 58  // Whether choices are expanding or being restricted by poison pills / smokescreens
  });

  const REGISTER_META = Object.freeze({
    craftAutonomy: {
      key: 'craftAutonomy',
      label: 'Craft Autonomy',
      shortLabel: 'CRAFT',
      startValue: 35,
      polarity: 'positive',
      description: 'Embodied skill, measurement by hand, patience (starts at 35, rises in Craft Masters / Road / Wayfinding / Orchard).'
    },
    refusalCapacity: {
      key: 'refusalCapacity',
      label: 'Refusal Capacity',
      shortLabel: 'REFUSAL',
      startValue: 40,
      polarity: 'positive',
      description: 'Power to decline false promotions, slop shortcuts, and coercive framing (starts at 40, tested in Ch I, Circe, Sirens, Suitors).'
    },
    slopEntanglement: {
      key: 'slopEntanglement',
      label: 'Slop Entanglement',
      shortLabel: 'SLOP',
      startValue: 65,
      polarity: 'inverse',
      description: 'Institutional pressure, metric-gaming, automated smooth talk (starts at 65 in Ch I, drops as Watson recovers real craft).'
    },
    lineageMemory: {
      key: 'lineageMemory',
      label: 'Lineage Memory',
      shortLabel: 'LINEAGE',
      startValue: 20,
      polarity: 'positive',
      description: 'Kept tools, guild oaths, navigational swells, Laertes\' orchard records (starts at 20, accumulates across chapters).'
    },
    actionSetOpenness: {
      key: 'actionSetOpenness',
      label: 'Action-Set Openness',
      shortLabel: 'OPENNESS',
      startValue: 58,
      polarity: 'positive',
      description: 'Whether choices are expanding or being restricted by narrative poison pills and institutional smokescreens.'
    }
  });

  const NARRATIVE_OPERATIONS = Object.freeze({
    ASSISTANCE: 'Assistance',
    COLLISION: 'Collision',
    POISON_PILL: 'Poison Pill',
    SMOKESCREEN: 'Smokescreen',
    CONSEQUENTIAL_TURN: 'Consequential Turn',
    CRAFT_TRANSMISSION: 'Craft Transmission',
    MEASURED_REFUSAL: 'Measured Refusal',
    REVERSAL_RESTORATION: 'Reversal / Restoration'
  });

  const AUTONOMOUS_REACTIONS = Object.freeze({
    RESIST_HOLD: {
      code: 'RESIST_HOLD',
      label: 'Resist & Hold Boundary',
      rigPosePreset: 'boundary_stance',
      emotionState: 'E16',
      gestureCue: 'Planted stance, composed arms, level head; refuses coercive framing before acting.',
      description: 'Watson resists institutional velocity pressure and holds a firm boundary stance instead of obeying the prompt unconditionally.'
    },
    MEASURE_FIRST: {
      code: 'MEASURE_FIRST',
      label: 'Measure First by Hand',
      rigPosePreset: 'arm_bend',
      emotionState: 'E01',
      gestureCue: 'Viewer-left forearm raised with vernier calipers / notebook check; verifies the burr before trusting output.',
      description: 'Watson pauses automatic execution to measure tolerances by hand and inspect where the model or metric diverges from reality.'
    },
    SILENT_TEST: {
      code: 'SILENT_TEST',
      label: 'Silent Witness & Shared Test',
      rigPosePreset: 'neutral',
      emotionState: 'E17',
      gestureCue: 'Still posture, unhurried breath, no performative speech; lets shared practice or silence speak.',
      description: 'Watson withholds defensive chatter and honors the gravity of the encounter through silence and attentive observation.'
    },
    EXTEND_HAND: {
      code: 'EXTEND_HAND',
      label: 'Extend Hand in Craft Transmission',
      rigPosePreset: 'open_offer',
      emotionState: 'E14',
      gestureCue: 'Both forearms open in craft demonstration; offers the journal, calipers, or keyboard as shared practice.',
      description: 'Watson voluntarily opens the workbench — passing theory to an apprentice or offering real tokens of shared craft to his father.'
    }
  });

  function clampRegister(v) {
    return Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  }

  function resolveOdysseyData(explicitData) {
    if (explicitData && explicitData.story) return explicitData;
    if (root && root.SLOPLING_ODYSSEY_DATA && root.SLOPLING_ODYSSEY_DATA.story) return root.SLOPLING_ODYSSEY_DATA;
    if (root && root.SLOPLING_ODYSSEY && root.SLOPLING_ODYSSEY.story) return root.SLOPLING_ODYSSEY;
    if (explicitData && Array.isArray(explicitData.beats)) return { story: explicitData };
    return null;
  }

  function resolveRigManifest(explicitData) {
    if (explicitData && explicitData.rigManifest) return explicitData.rigManifest;
    if (root && root.WATSON_RIG_MANIFEST) return root.WATSON_RIG_MANIFEST;
    return null;
  }

  function parseBeatNumber(beatId) {
    const m = String(beatId || '').match(/beat_(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
  }

  // Per-beat authored dramatic profile for all 97 beats
  const BEAT_DRAMATIC_PROFILES = {
    beat_0: {
      registers: { craftAutonomy: 35, refusalCapacity: 40, slopEntanglement: 65, lineageMemory: 20, actionSetOpenness: 58 },
      operation: NARRATIVE_OPERATIONS.CONSEQUENTIAL_TURN,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Accept corporate velocity defaults', 'Browse cast passively'],
      afterOptions: ['Begin Beat 1 at the Workbench (E01)', 'Enter Dana\'s Offer with critical attention (E02)', 'Jump to Laertes\'s Orchard (E14)']
    },
    beat_1: {
      registers: { craftAutonomy: 38, refusalCapacity: 40, slopEntanglement: 65, lineageMemory: 22, actionSetOpenness: 58 },
      operation: NARRATIVE_OPERATIONS.ASSISTANCE,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Ship unverified model output', 'Let tests pass without reading the diff'],
      afterOptions: ['Notice the subtle VAT rounding burr by hand', 'Feel the gap between prompting and making']
    },
    beat_2: {
      registers: { craftAutonomy: 36, refusalCapacity: 44, slopEntanglement: 70, lineageMemory: 22, actionSetOpenness: 52 },
      operation: NARRATIVE_OPERATIONS.SMOKESCREEN,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Say thank you and sign the Team Lead offer immediately'],
      afterOptions: ['Ask "Why me?" (+Leverage)', 'Ask "What happens to my code?" (+Craft/+Leverage)', 'Ask "Can I think about it?" (Delay coercive closure)']
    },
    beat_3: {
      registers: { craftAutonomy: 37, refusalCapacity: 45, slopEntanglement: 68, lineageMemory: 24, actionSetOpenness: 55 },
      operation: NARRATIVE_OPERATIONS.COLLISION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Blend into the open-plan office chorus'],
      afterOptions: ['Distinguish Chad\'s smooth talk and Dougie\'s upward drift from Ines\'s real engineering question']
    },
    beat_4: {
      registers: { craftAutonomy: 38, refusalCapacity: 44, slopEntanglement: 66, lineageMemory: 30, actionSetOpenness: 54 },
      operation: NARRATIVE_OPERATIONS.COLLISION,
      reaction: 'SILENT_TEST',
      beforeOptions: ['Boast about the management title to win Father\'s status pride'],
      afterOptions: ['Hear the difference between Father\'s Pride (status ladder) and Father\'s Sight (recognition of craft)']
    },
    beat_5: {
      registers: { craftAutonomy: 43, refusalCapacity: 46, slopEntanglement: 62, lineageMemory: 34, actionSetOpenness: 60 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Assume the model holds the theory of the program'],
      afterOptions: ['Invoke Ryle (knowing-how vs knowing-that) and Naur (programming as theory building)']
    },
    beat_6: {
      registers: { craftAutonomy: 48, refusalCapacity: 49, slopEntanglement: 56, lineageMemory: 42, actionSetOpenness: 74 },
      operation: NARRATIVE_OPERATIONS.ASSISTANCE,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Go straight to sleep without examining the workbench'],
      afterOptions: ['Inspect the Prompt Journal (+Craft, +Leverage)', 'Pick up Father\'s Brass Calipers (unlocks knowsFatherCraft)', 'Read the printed Offer Letter (+Leverage)']
    },
    beat_7: {
      registers: { craftAutonomy: 53, refusalCapacity: 50, slopEntanglement: 53, lineageMemory: 46, actionSetOpenness: 76 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Leave model failures undocumented'],
      afterOptions: ['Keep the Prompt Journal in inventory as empirical proof of hand-judgment']
    },
    beat_8: {
      registers: { craftAutonomy: 55, refusalCapacity: 52, slopEntanglement: 50, lineageMemory: 54, actionSetOpenness: 80 },
      operation: NARRATIVE_OPERATIONS.ASSISTANCE,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Forget why your father gave you vernier calipers at age twelve'],
      afterOptions: ['Remember the Hendry lathe and carry the Brass Calipers (unlocks Orchard & Calling Home tokens)']
    },
    beat_9: {
      registers: { craftAutonomy: 48, refusalCapacity: 54, slopEntanglement: 58, lineageMemory: 44, actionSetOpenness: 68 },
      operation: NARRATIVE_OPERATIONS.POISON_PILL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Read the equity number as pure reward'],
      afterOptions: ['Recognize Graeber\'s taskmaster trap inside the Agentic Velocity Lead role (+Leverage)']
    },
    beat_10: {
      registers: { craftAutonomy: 54, refusalCapacity: 54, slopEntanglement: 52, lineageMemory: 48, actionSetOpenness: 75 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Paste a quick AI fix for Ines or ignore her 11 p.m. message'],
      afterOptions: ['Return to the Desk props', 'Walk Ines through the billing-retry theory (sets mentoredInes = true)', 'Rest before Friday\'s decision']
    },
    beat_10b: {
      registers: { craftAutonomy: 60, refusalCapacity: 56, slopEntanglement: 46, lineageMemory: 54, actionSetOpenness: 80 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Treat mentoring as a ticket-closing transaction'],
      afterOptions: ['Spend forty unseen minutes transmitting the mental model to Ines (unlocks Road & Bow succession)']
    },
    beat_12: {
      registers: { craftAutonomy: 54, refusalCapacity: 62, slopEntanglement: 58, lineageMemory: 50, actionSetOpenness: 72 },
      operation: NARRATIVE_OPERATIONS.CONSEQUENTIAL_TURN,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Accept the Team Lead title unconditionally (Scylla)', 'Stall and surrender agency to a Slack poll'],
      afterOptions: ['Decline and stay at the workbench (E16 boundary)', 'Renegotiate to lead craft instead of people (gated on Leverage >= 3)', 'Accept with open eyes', 'Feign madness at the plough']
    },
    beat_13: {
      registers: { craftAutonomy: 34, refusalCapacity: 35, slopEntanglement: 78, lineageMemory: 42, actionSetOpenness: 42 },
      operation: NARRATIVE_OPERATIONS.POISON_PILL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Keep full workbench autonomy while holding the title'],
      afterOptions: ['Inherit five reports, calendar fragmentation, and Circe\'s Offsite (callChoice = accept)']
    },
    beat_14: {
      registers: { craftAutonomy: 64, refusalCapacity: 74, slopEntanglement: 42, lineageMemory: 54, actionSetOpenness: 74 },
      operation: NARRATIVE_OPERATIONS.MEASURED_REFUSAL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Apologize for lacking executive ambition'],
      afterOptions: ['Hold the workbench boundary (callChoice = decline, +Craft, +Father\'s Recognition)']
    },
    beat_15a: {
      registers: { craftAutonomy: 66, refusalCapacity: 72, slopEntanglement: 40, lineageMemory: 56, actionSetOpenness: 82 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Accept binary Scylla/Charybdis framing'],
      afterOptions: ['Carve out a Staff Craft Charter through accumulated Leverage (Leverage >= 3)']
    },
    beat_15b: {
      registers: { craftAutonomy: 40, refusalCapacity: 42, slopEntanglement: 74, lineageMemory: 44, actionSetOpenness: 36 },
      operation: NARRATIVE_OPERATIONS.SMOKESCREEN,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Renegotiate the role without preparation'],
      afterOptions: ['Discover the org chart only has management rungs when Leverage < 3']
    },
    beat_16: {
      registers: { craftAutonomy: 42, refusalCapacity: 44, slopEntanglement: 75, lineageMemory: 42, actionSetOpenness: 34 },
      operation: NARRATIVE_OPERATIONS.COLLISION,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Escape the call by feigning madness on the sprint board'],
      afterOptions: ['Face Dana dragging the production database into the furrow (Palamedes test)']
    },
    beat_16r: {
      registers: { craftAutonomy: 36, refusalCapacity: 34, slopEntanglement: 80, lineageMemory: 40, actionSetOpenness: 28 },
      operation: NARRATIVE_OPERATIONS.SMOKESCREEN,
      reaction: 'SILENT_TEST',
      beforeOptions: ['Choose your own path deliberately'],
      afterOptions: ['Watch a randomized Slack poll decide your career fate']
    },
    beat_19: {
      registers: { craftAutonomy: 52, refusalCapacity: 54, slopEntanglement: 56, lineageMemory: 48, actionSetOpenness: 66 },
      operation: NARRATIVE_OPERATIONS.COLLISION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Accept "vibe coding" as effortless magic or total fraud'],
      afterOptions: ['Test whether your metis is in your hands or leased from the model\'s weights']
    },
    beat_21: {
      registers: { craftAutonomy: 54, refusalCapacity: 66, slopEntanglement: 60, lineageMemory: 52, actionSetOpenness: 58 },
      operation: NARRATIVE_OPERATIONS.POISON_PILL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Drink Circe\'s alignment framework and transform into a Swine Taskmaster'],
      afterOptions: ['Eat the Moly herb: defend one non-negotiable coding hour a day (+Craft, +Refusal)']
    },
    beat_24: {
      registers: { craftAutonomy: 58, refusalCapacity: 60, slopEntanglement: 46, lineageMemory: 56, actionSetOpenness: 88 },
      operation: NARRATIVE_OPERATIONS.ASSISTANCE,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Follow a linear corporate training syllabus'],
      afterOptions: ['Navigate 10 mythic craft islands (Hassaby\'s Charter Room unlocked only when Leverage >= 5)']
    },
    beat_31: {
      registers: { craftAutonomy: 64, refusalCapacity: 62, slopEntanglement: 42, lineageMemory: 64, actionSetOpenness: 74 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Add more agents/people to a late software project'],
      afterOptions: ['Read Fred Brookes\'s Ledger on conceptual integrity and essential complexity']
    },
    beat_34: {
      registers: { craftAutonomy: 62, refusalCapacity: 70, slopEntanglement: 50, lineageMemory: 62, actionSetOpenness: 64 },
      operation: NARRATIVE_OPERATIONS.MEASURED_REFUSAL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Drown in 312 unread notifications in the Inbox Sea'],
      afterOptions: ['Stuff ears with wax (notifications off, +Craft)', 'Lash to the mast to hear Linos Torwald without surrendering the helm']
    },
    beat_36: {
      registers: { craftAutonomy: 68, refusalCapacity: 62, slopEntanglement: 36, lineageMemory: 68, actionSetOpenness: 62 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Lose two voyage turns daydreaming in the Bell Works Lotus Garden'],
      afterOptions: ['Study Ken Tomson and Claude Shanning\'s clean primitives and return to the ship']
    },
    beat_38: {
      registers: { craftAutonomy: 58, refusalCapacity: 64, slopEntanglement: 52, lineageMemory: 60, actionSetOpenness: 60 },
      operation: NARRATIVE_OPERATIONS.SMOKESCREEN,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Surrender human craft to the Scaling Oracle\'s inevitability sermon'],
      afterOptions: ['Ask Ilya Sutskov how a prophet ends up running payroll (gated on Cunning >= 3)']
    },
    beat_40: {
      registers: { craftAutonomy: 68, refusalCapacity: 68, slopEntanglement: 34, lineageMemory: 64, actionSetOpenness: 76 },
      operation: NARRATIVE_OPERATIONS.ASSISTANCE,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Assume every team needs a middle-management layer'],
      afterOptions: ['Witness Gabe Newall\'s Flat Island (sets roleUnneeded = true)']
    },
    beat_42: {
      registers: { craftAutonomy: 76, refusalCapacity: 72, slopEntanglement: 30, lineageMemory: 70, actionSetOpenness: 74 },
      operation: NARRATIVE_OPERATIONS.MEASURED_REFUSAL,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Stay in executive steering committees out of obligation'],
      afterOptions: ['Hear Jon Carmick\'s exile workshop ethic: one person at a terminal building real things']
    },
    beat_44: {
      registers: { craftAutonomy: 62, refusalCapacity: 68, slopEntanglement: 48, lineageMemory: 66, actionSetOpenness: 50 },
      operation: NARRATIVE_OPERATIONS.POISON_PILL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Remain in Calypso\'s golden Charter Room forever (costs 2 island slots)'],
      afterOptions: ['See the hidden cost of Denis Hassaby\'s golden cage and choose the mortal orchard']
    },
    beat_46: {
      registers: { craftAutonomy: 82, refusalCapacity: 74, slopEntanglement: 24, lineageMemory: 78, actionSetOpenness: 82 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Climb upward on the org chart away from the source text'],
      afterOptions: ['Descend Knuthe\'s ladder into literate craft and pass the practice on (sets passedOnCraft = true)']
    },
    beat_47: {
      registers: { craftAutonomy: 86, refusalCapacity: 78, slopEntanglement: 20, lineageMemory: 86, actionSetOpenness: 86 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Accept the corporate ladder as the only form of seniority'],
      afterOptions: ['Walk with Compagnons carpenters, stonemasons, potters, Ise Jingu shrinewrights, and Ijazah scholars']
    },
    beat_48: {
      registers: { craftAutonomy: 89, refusalCapacity: 80, slopEntanglement: 16, lineageMemory: 92, actionSetOpenness: 88 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'SILENT_TEST',
      beforeOptions: ['Demand verbal summaries and dashboard telemetry for navigation'],
      afterOptions: ['Sit quietly beside Mau Piailug and feel the Pacific swells through the canoe hull']
    },
    beat_49: {
      registers: { craftAutonomy: 90, refusalCapacity: 82, slopEntanglement: 16, lineageMemory: 93, actionSetOpenness: 90 },
      operation: NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Hoard craft privately as personal leverage'],
      afterOptions: ['Take Ines on properly as a master chooses (requires mentoredInes)', 'Resolve to go deeper, not higher', 'Write to your father about the Compagnons and the canoe (+Recognition)']
    },
    beat_51: {
      registers: { craftAutonomy: 80, refusalCapacity: 86, slopEntanglement: 28, lineageMemory: 84, actionSetOpenness: 76 },
      operation: NARRATIVE_OPERATIONS.MEASURED_REFUSAL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Recite your title, velocity chart, and headcount plan to the KPI Cyclops'],
      afterOptions: ['Declare "My name is Nobody" (gated on Standing <= 4; sets roleUnneeded = true)', 'Blind the single metric eye by proving it measures the wrong thing']
    },
    beat_62: {
      registers: { craftAutonomy: 78, refusalCapacity: 76, slopEntanglement: 32, lineageMemory: 88, actionSetOpenness: 80 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Give your father another vague update about job titles'],
      afterOptions: ['Speak the lathe token: "You feel the burr before you see it" (gated on knowsFatherCraft = true)']
    },
    beat_64: {
      registers: { craftAutonomy: 74, refusalCapacity: 74, slopEntanglement: 44, lineageMemory: 82, actionSetOpenness: 60 },
      operation: NARRATIVE_OPERATIONS.COLLISION,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Assume the office stayed frozen while you sailed'],
      afterOptions: ['Observe the Suitors (Chad & Dougie) redistributing your desk and roadmap']
    },
    beat_71: {
      registers: { craftAutonomy: 80, refusalCapacity: 84, slopEntanglement: 24, lineageMemory: 90, actionSetOpenness: 66 },
      operation: NARRATIVE_OPERATIONS.CONSEQUENTIAL_TURN,
      reaction: 'SILENT_TEST',
      beforeOptions: ['Attempt to win an argument with Ajax\'s shade or gloat over surviving'],
      afterOptions: ['Honor Ajax\'s E17 silence with humble self-compassion (E13 Director Audit override)']
    },
    beat_74: {
      registers: { craftAutonomy: 84, refusalCapacity: 82, slopEntanglement: 20, lineageMemory: 91, actionSetOpenness: 78 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Accept Ajax\'s ruin as the only fate for a quiet builder'],
      afterOptions: ['Witness the alternate forge where Ajax lives and teaches apprentices (E09 -> E01 -> E15)']
    },
    beat_77: {
      registers: { craftAutonomy: 84, refusalCapacity: 85, slopEntanglement: 30, lineageMemory: 88, actionSetOpenness: 74 },
      operation: NARRATIVE_OPERATIONS.COLLISION,
      reaction: 'MEASURE_FIRST',
      beforeOptions: ['Fight the Suitors with slide decks and status jargon'],
      afterOptions: ['Step up to the failing production build where talk cannot fake the fix']
    },
    beat_78: {
      registers: { craftAutonomy: 90, refusalCapacity: 88, slopEntanglement: 20, lineageMemory: 90, actionSetOpenness: 86 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Let the Suitors keep guessing at the broken build'],
      afterOptions: ['String the Bow: steer the model line by line (gated on Craft >= 5)', 'Hand the Bow to Ines: "You know this one. Go." (gated on passedOnCraft == true)']
    },
    beat_81: {
      registers: { craftAutonomy: 86, refusalCapacity: 90, slopEntanglement: 22, lineageMemory: 88, actionSetOpenness: 84 },
      operation: NARRATIVE_OPERATIONS.MEASURED_REFUSAL,
      reaction: 'RESIST_HOLD',
      beforeOptions: ['Surrender completely to management ("The people are the craft now")'],
      afterOptions: ['Keep the chair with one sacred coding hour defended like Penelope\'s loom', 'Hand the chair back and return to the bench']
    },
    beat_93: {
      registers: { craftAutonomy: 91, refusalCapacity: 88, slopEntanglement: 14, lineageMemory: 94, actionSetOpenness: 88 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'SILENT_TEST',
      beforeOptions: ['Arrive in Ithaca announcing your corporate rank'],
      afterOptions: ['Enter the late-afternoon orchard quietly while Laertes grafts at the branch']
    },
    beat_94: {
      registers: { craftAutonomy: 94, refusalCapacity: 90, slopEntanglement: 12, lineageMemory: 96, actionSetOpenness: 92 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Give up explaining and retreat into polite distance (i3 -> E17)'],
      afterOptions: [
        'Hold out the Prompt Journal (gated on Prompt Journal in inventory -> E14)',
        'Ask about the Hendry lathe he gave up (gated on knowsFatherCraft -> E13)',
        'Present the Brass Calipers you still carry (gated on Brass Calipers -> E14/E06)',
        'Stand alongside him in good shared silence (i2c -> E15)'
      ]
    },
    beat_100: {
      registers: { craftAutonomy: 98, refusalCapacity: 94, slopEntanglement: 8, lineageMemory: 99, actionSetOpenness: 96 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Claim kinship through abstract titles'],
      afterOptions: ['Name the Bramley, the three Discoveries, "the committee" graft, and show where your hands were in the code']
    },
    beat_101: {
      registers: { craftAutonomy: 99, refusalCapacity: 95, slopEntanglement: 6, lineageMemory: 100, actionSetOpenness: 98 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Remain unseen behind institutional jargon'],
      afterOptions: ['Complete the Orchard Restoration: two craftspeople recognizing each other\'s hands']
    },
    beat_102: {
      registers: { craftAutonomy: 90, refusalCapacity: 86, slopEntanglement: 16, lineageMemory: 92, actionSetOpenness: 88 },
      operation: NARRATIVE_OPERATIONS.REVERSAL_RESTORATION,
      reaction: 'EXTEND_HAND',
      beforeOptions: ['Remain at arm\'s length across generations'],
      afterOptions: ['Bridge the distance in the Telemachus embrace']
    },
    beat_104: {
      registers: { craftAutonomy: 88, refusalCapacity: 78, slopEntanglement: 26, lineageMemory: 84, actionSetOpenness: 58 },
      operation: NARRATIVE_OPERATIONS.COLLISION,
      reaction: 'SILENT_TEST',
      beforeOptions: ['Force recognition when the shared tokens were never gathered'],
      afterOptions: ['Accept Argos\'s recognition: the old work knows your hand even when your father only sees status pride']
    },
    beat_106: {
      registers: { craftAutonomy: 46, refusalCapacity: 42, slopEntanglement: 72, lineageMemory: 50, actionSetOpenness: 20 },
      operation: NARRATIVE_OPERATIONS.POISON_PILL,
      reaction: 'SILENT_TEST',
      beforeOptions: ['Reclaim the workbench after trading away both craft and tokens'],
      afterOptions: ['Stand in Ajax\'s E17 silence as status talk closes the orchard']
    }
  };

  function inferFallbackProfile(beat, beatIndex, binding) {
    const bNum = parseBeatNumber(beat && beat.id);
    const chapter = (binding && binding.chapter) || (beat && beat.cluster) || 'I. The Call';
    const notes = ((beat && beat.notes) || '').toLowerCase();
    const name = ((beat && beat.name) || '').toLowerCase();

    let craftAutonomy = 35 + Math.round((beatIndex / 96) * 52);
    let refusalCapacity = 40 + Math.round((beatIndex / 96) * 46);
    let slopEntanglement = Math.max(12, 65 - Math.round((beatIndex / 96) * 48));
    let lineageMemory = 20 + Math.round((beatIndex / 96) * 72);
    let actionSetOpenness = 58 + Math.round((beatIndex / 96) * 24);

    let operation = NARRATIVE_OPERATIONS.CONSEQUENTIAL_TURN;
    let reaction = 'MEASURE_FIRST';

    if (bNum <= 17) {
      if (notes.includes('poison') || name.includes('offer') || name.includes('yes')) {
        operation = NARRATIVE_OPERATIONS.POISON_PILL;
        reaction = 'RESIST_HOLD';
      } else if (name.includes('poll') || name.includes('rungs')) {
        operation = NARRATIVE_OPERATIONS.SMOKESCREEN;
        reaction = 'RESIST_HOLD';
      } else if (name.includes('no') || name.includes('decline')) {
        operation = NARRATIVE_OPERATIONS.MEASURED_REFUSAL;
        reaction = 'RESIST_HOLD';
      } else {
        operation = NARRATIVE_OPERATIONS.ASSISTANCE;
        reaction = 'MEASURE_FIRST';
      }
    } else if (bNum <= 29) {
      operation = name.includes('circe') ? NARRATIVE_OPERATIONS.POISON_PILL : NARRATIVE_OPERATIONS.COLLISION;
      reaction = 'RESIST_HOLD';
    } else if (bNum >= 45 && bNum <= 49) {
      operation = NARRATIVE_OPERATIONS.CRAFT_TRANSMISSION;
      reaction = bNum === 48 ? 'SILENT_TEST' : 'EXTEND_HAND';
      craftAutonomy = Math.max(craftAutonomy, 85);
      lineageMemory = Math.max(lineageMemory, 86);
      slopEntanglement = Math.min(slopEntanglement, 20);
    } else if (bNum >= 50 && bNum <= 59) {
      operation = NARRATIVE_OPERATIONS.MEASURED_REFUSAL;
      reaction = 'RESIST_HOLD';
    } else if (bNum >= 70 && bNum <= 76) {
      operation = NARRATIVE_OPERATIONS.CONSEQUENTIAL_TURN;
      reaction = 'SILENT_TEST';
    } else if (bNum >= 77 && bNum <= 92) {
      operation = NARRATIVE_OPERATIONS.REVERSAL_RESTORATION;
      reaction = 'EXTEND_HAND';
    } else if (bNum >= 93) {
      operation = NARRATIVE_OPERATIONS.REVERSAL_RESTORATION;
      reaction = 'EXTEND_HAND';
      craftAutonomy = Math.max(craftAutonomy, 92);
      lineageMemory = Math.max(lineageMemory, 94);
      slopEntanglement = Math.min(slopEntanglement, 14);
    }

    return {
      registers: {
        craftAutonomy: clampRegister(craftAutonomy),
        refusalCapacity: clampRegister(refusalCapacity),
        slopEntanglement: clampRegister(slopEntanglement),
        lineageMemory: clampRegister(lineageMemory),
        actionSetOpenness: clampRegister(actionSetOpenness)
      },
      operation,
      reaction,
      chapter,
      beforeOptions: [`Default progression through ${beat ? beat.name : 'scene'}`],
      afterOptions: [`Actor-evaluated path through ${beat ? beat.name : 'scene'}`]
    };
  }

  function extractBeatOptions(beat, binding) {
    const rawChoices = [];
    const gatedChoices = [];
    const params = (beat && beat.parameters) || {};

    if (Array.isArray(params.choices)) {
      params.choices.forEach(c => {
        const label = c.text || c.label || c.id || 'Choice';
        rawChoices.push(label);
        if (Array.isArray(c.conditions) && c.conditions.length) {
          gatedChoices.push({
            id: c.id,
            label,
            conditions: c.conditions
          });
        }
      });
    }
    if (Array.isArray(params.props)) {
      params.props.forEach(p => {
        rawChoices.push(`Inspect ${p.displayName || p.name || p.id}`);
      });
    }
    if (params.dialogTree && Array.isArray(params.dialogTree.choices)) {
      params.dialogTree.choices.forEach(c => {
        if (c.text) rawChoices.push(c.text);
        if (Array.isArray(c.conditions) && c.conditions.length) {
          gatedChoices.push({
            id: c.id,
            label: c.text || c.id,
            conditions: c.conditions
          });
        }
      });
    }
    if (binding && Array.isArray(binding.nodes)) {
      binding.nodes.filter(n => n.kind === 'choice' && n.source_text).forEach(n => {
        if (!rawChoices.includes(n.source_text)) {
          rawChoices.push(n.source_text);
        }
      });
    }
    return { rawChoices, gatedChoices };
  }

  function applyChoiceHistoryDeltas(baseRegisters, choiceHistory) {
    const regs = Object.assign({}, baseRegisters);
    const appliedLog = [];

    if (!choiceHistory) return { registers: regs, appliedLog };

    // Support object form (e.g. state.storyVars or { choices: [...], storyVars: {...} })
    const varsObj = (!Array.isArray(choiceHistory) && typeof choiceHistory === 'object')
      ? (choiceHistory.storyVars || choiceHistory)
      : null;
    const list = Array.isArray(choiceHistory)
      ? choiceHistory
      : (choiceHistory && Array.isArray(choiceHistory.choices) ? choiceHistory.choices : []);

    if (varsObj) {
      if (varsObj.promotionAccepted === true || varsObj.callChoice === 'accept') {
        regs.slopEntanglement += 12;
        regs.craftAutonomy -= 6;
        regs.refusalCapacity -= 5;
        regs.actionSetOpenness -= 8;
        appliedLog.push('promotionAccepted: +12 slopEntanglement, -6 craftAutonomy');
      } else if (varsObj.callChoice === 'decline') {
        regs.refusalCapacity += 12;
        regs.craftAutonomy += 8;
        regs.slopEntanglement -= 10;
        regs.actionSetOpenness += 6;
        appliedLog.push('callChoice=decline: +12 refusalCapacity, +8 craftAutonomy, -10 slopEntanglement');
      }
      if (varsObj.molyTaken === true) {
        regs.refusalCapacity += 8;
        regs.craftAutonomy += 6;
        regs.slopEntanglement -= 8;
        appliedLog.push('molyTaken: +8 refusalCapacity, +6 craftAutonomy, -8 slopEntanglement');
      }
      if (varsObj.sirensPlugged === true) {
        regs.refusalCapacity += 7;
        regs.slopEntanglement -= 7;
        appliedLog.push('sirensPlugged: +7 refusalCapacity, -7 slopEntanglement');
      }
      if (varsObj.cyclopsBlinded === true || varsObj.roleUnneeded === true) {
        regs.refusalCapacity += 8;
        regs.slopEntanglement -= 9;
        regs.actionSetOpenness += 7;
        appliedLog.push('cyclopsBlinded: +8 refusalCapacity, -9 slopEntanglement, +7 actionSetOpenness');
      }
      if (varsObj.threadKept === true || varsObj.knowsFatherCraft === true) {
        regs.lineageMemory += 10;
        regs.craftAutonomy += 6;
        regs.actionSetOpenness += 8;
        appliedLog.push('threadKept/knowsFatherCraft: +10 lineageMemory, +6 craftAutonomy');
      }
      if (varsObj.orchardReached === true) {
        regs.lineageMemory += 12;
        regs.craftAutonomy += 8;
        regs.slopEntanglement -= 12;
        regs.actionSetOpenness += 10;
        appliedLog.push('orchardReached: +12 lineageMemory, +8 craftAutonomy, -12 slopEntanglement');
      }
    }

    list.forEach(item => {
      const token = typeof item === 'string'
        ? item.toLowerCase()
        : `${item.id || ''} ${item.choiceId || ''} ${item.label || ''} ${item.target || ''} ${item.state || ''}`.toLowerCase();

      if (token.includes('call_decline') || token.includes('decline') || token.includes('beat_14')) {
        regs.refusalCapacity += 10;
        regs.craftAutonomy += 6;
        regs.slopEntanglement -= 8;
        appliedLog.push('Choice [Decline Offer]: +10 refusalCapacity, +6 craftAutonomy');
      }
      if (token.includes('call_accept') || token.includes('beat_13') || token.includes('circe_drink')) {
        regs.slopEntanglement += 10;
        regs.craftAutonomy -= 6;
        regs.actionSetOpenness -= 6;
        appliedLog.push('Choice [Accept Ladder / Framework]: +10 slopEntanglement, -6 craftAutonomy');
      }
      if (token.includes('circe_moly') || token.includes('moly') || token.includes('sacred coding hour')) {
        regs.refusalCapacity += 9;
        regs.craftAutonomy += 7;
        regs.slopEntanglement -= 8;
        appliedLog.push('Choice [Eat Moly]: +9 refusalCapacity, +7 craftAutonomy');
      }
      if (token.includes('caliper') || token.includes('journal') || token.includes('lathe') || token.includes('beat_7') || token.includes('beat_8')) {
        regs.lineageMemory += 9;
        regs.craftAutonomy += 6;
        regs.actionSetOpenness += 6;
        appliedLog.push('Choice [Keep Craft Token]: +9 lineageMemory, +6 craftAutonomy');
      }
      if (token.includes('ines') || token.includes('rd1') || token.includes('bow2') || token.includes('beat_10b')) {
        regs.craftAutonomy += 7;
        regs.lineageMemory += 8;
        regs.actionSetOpenness += 7;
        appliedLog.push('Choice [Mentor Ines / Transmit Craft]: +7 craftAutonomy, +8 lineageMemory');
      }
      if (token.includes('nobody') || token.includes('cy1') || token.includes('cy3')) {
        regs.refusalCapacity += 8;
        regs.slopEntanglement -= 9;
        appliedLog.push('Choice [Defy KPI Cyclops]: +8 refusalCapacity, -9 slopEntanglement');
      }
      if (token.includes('trees') || token.includes('beat_100') || token.includes('i2b') || token.includes('i2a')) {
        regs.lineageMemory += 10;
        regs.craftAutonomy += 8;
        regs.slopEntanglement -= 10;
        regs.actionSetOpenness += 8;
        appliedLog.push('Choice [Orchard Recognition Token]: +10 lineageMemory, +8 craftAutonomy');
      }
    });

    Object.keys(regs).forEach(k => {
      regs[k] = clampRegister(regs[k]);
    });

    return { registers: regs, appliedLog };
  }

  /**
   * Computes the 5-axis dramatic state, active narrative operation, action-set rewrite,
   * and autonomous actor reaction for a given beat and choice history.
   */
  function computeStateForBeat(beatInput, choiceHistory, storyData) {
    const data = resolveOdysseyData(storyData);
    const beats = (data && data.story && data.story.beats) || [];
    const bindings = (data && data.performanceBindings && data.performanceBindings.beats) || [];

    let beat = null;
    let beatIndex = 0;

    if (typeof beatInput === 'string') {
      beatIndex = beats.findIndex(b => b.id === beatInput);
      beat = beatIndex >= 0 ? beats[beatIndex] : { id: beatInput, name: beatInput, type: 'stage_scene' };
      if (beatIndex < 0) beatIndex = parseBeatNumber(beatInput);
    } else if (beatInput && typeof beatInput === 'object') {
      beat = beatInput;
      const foundIdx = beats.findIndex(b => b.id === beat.id);
      beatIndex = foundIdx >= 0 ? foundIdx : parseBeatNumber(beat.id);
    } else {
      beat = beats[2] || { id: 'beat_2', name: "Dana's Offer", type: 'dialogTree' };
      beatIndex = 2;
    }

    const beatId = beat.id || 'beat_2';
    const binding = bindings.find(b => b.beat_id === beatId) || {};
    const profile = BEAT_DRAMATIC_PROFILES[beatId] || inferFallbackProfile(beat, beatIndex, binding);
    const { registers, appliedLog } = applyChoiceHistoryDeltas(profile.registers, choiceHistory);

    const extracted = extractBeatOptions(beat, binding);
    const beforeOptions = (profile.beforeOptions && profile.beforeOptions.length)
      ? profile.beforeOptions.slice()
      : ['Obey default scene prompt unconditionally'];
    const afterOptions = (profile.afterOptions && profile.afterOptions.length)
      ? profile.afterOptions.slice()
      : (extracted.rawChoices.length ? extracted.rawChoices.slice(0, 4) : ['Proceed with measured attention']);

    // Merge any authored gated choices into afterOptions so the caller sees exact condition gates
    extracted.gatedChoices.forEach(gc => {
      const condSummary = gc.conditions.map(c => `${c.variable || c.item || c.beatId} ${c.operator || c.checkType || ''} ${c.value !== undefined ? c.value : ''}`.trim()).join(' & ');
      const formatted = `${gc.label} [Gated: ${condSummary}]`;
      if (!afterOptions.some(o => o.includes(gc.label.slice(0, 18)))) {
        afterOptions.push(formatted);
      }
    });

    // Determine Autonomous Actor Reaction from registers + beat context
    let reactionKey = profile.reaction || 'MEASURE_FIRST';
    if (registers.slopEntanglement >= 68 && registers.refusalCapacity >= 42) {
      reactionKey = 'RESIST_HOLD';
    } else if (registers.lineageMemory >= 85 && (beatId === 'beat_48' || beatId === 'beat_71' || beatId === 'beat_93')) {
      reactionKey = 'SILENT_TEST';
    } else if (registers.craftAutonomy >= 75 && registers.lineageMemory >= 70 && ['Craft Transmission', 'Reversal / Restoration'].includes(profile.operation)) {
      reactionKey = 'EXTEND_HAND';
    }

    const reactionMeta = AUTONOMOUS_REACTIONS[reactionKey] || AUTONOMOUS_REACTIONS.MEASURE_FIRST;
    const canRefuseNow = registers.refusalCapacity >= 45 || registers.craftAutonomy >= 55;

    const actionSetDeltaSummary = `${profile.operation}: Action set rewritten from ${beforeOptions.length} baseline puppet option(s) to ${afterOptions.length} actor-evaluated option(s) (Openness ${registers.actionSetOpenness}/100).`;

    return {
      beatId,
      beatName: beat.name || binding.name || beatId,
      beatIndex,
      chapter: binding.chapter || beat.cluster || 'I. The Call',
      theorem: LINEAGES.CHARACTERS_THAT_CAN_REFUSE.theorem,
      registers,
      // Direct top-level accessors for convenience
      craftAutonomy: registers.craftAutonomy,
      refusalCapacity: registers.refusalCapacity,
      slopEntanglement: registers.slopEntanglement,
      lineageMemory: registers.lineageMemory,
      actionSetOpenness: registers.actionSetOpenness,
      registerMeta: REGISTER_META,
      activeNarrativeOperation: profile.operation,
      narrativeOperation: {
        name: profile.operation,
        lineageId: 43,
        lineageName: LINEAGES.COLLAGE_GRAPH_REWRITING.name,
        summary: actionSetDeltaSummary
      },
      beforeOptions,
      afterOptions,
      actionSetChange: {
        operation: profile.operation,
        beforeOptions,
        afterOptions,
        gatedBranches: extracted.gatedChoices,
        opennessScore: registers.actionSetOpenness,
        summary: actionSetDeltaSummary
      },
      autonomousReaction: {
        code: reactionMeta.code,
        label: reactionMeta.label,
        triggered: true,
        canRefuse: canRefuseNow,
        rigPosePreset: reactionMeta.rigPosePreset,
        emotionState: reactionMeta.emotionState,
        gestureCue: reactionMeta.gestureCue,
        description: reactionMeta.description
      },
      reactionCode: reactionMeta.code,
      choiceHistoryApplied: appliedLog
    };
  }

  const StateMachine = {
    theorem: LINEAGES.CHARACTERS_THAT_CAN_REFUSE.theorem,
    lineages: [
      LINEAGES.RIVE_PUPPET_STATE_MACHINES,
      LINEAGES.COLLAGE_GRAPH_REWRITING,
      LINEAGES.CHARACTERS_THAT_CAN_REFUSE
    ],
    INITIAL_REGISTERS,
    REGISTER_META,
    NARRATIVE_OPERATIONS,
    AUTONOMOUS_REACTIONS,
    computeStateForBeat
  };

  // ============================================================================
  // PART B: ARCHIVE-TO-PUPPET PROVENANCE GRAPH (`ProvenanceGraph`)
  // ============================================================================

  const CAST_POSITIONS_9X9 = [[4, 4], [4, 2], [4, 6], [3, 4], [5, 4], [3, 2], [3, 6]];
  const PROP_COORDS_9X9 = [[3, 1], [3, 7], [5, 1], [5, 7], [4, 0], [4, 8]];
  const TABLEAU_COORD_9X9 = [3, 3];

  const SOURCE_ARCHIVE_CATALOG = Object.freeze({
    master_rig_sheet: {
      sheet: 'source/master_B.png',
      category: 'master_rig_sheet',
      archivePack: 'Cardboard_Family_Film_Kits_v2 / Master Cut v2',
      resolution: '1024×1536',
      sha256: 'f663852f62dc4e4bd8723fced5b1be7e390cda5c7440c1f20ece6f3fd60e2511'
    },
    watson_emotion_sheet: {
      sheet: 'watson_emotion_sheet (Cardboard_Family_Film_Kits_v2/parts/watson/heads/E00–E17.png)',
      category: 'watson_emotion_sheet',
      archivePack: 'Cardboard_Family_Film_Kits_v2',
      resolution: '18-state expression matrix (E00–E17)'
    },
    orchard_tableau_sheet: {
      sheet: 'orchard_tableau_sheet (Odyssey_Scene_Ensembles_v3/tableaux/orchard/)',
      category: 'orchard_tableau_sheet',
      archivePack: 'Odyssey_Scene_Ensembles_v3',
      resolution: 'Multi-character orchard stage plates (6 plates)'
    },
    road_tableau_sheet: {
      sheet: 'road_craft_tableau_sheet (Odyssey_Scene_Ensembles_v3/tableaux/road/)',
      category: 'orchard_tableau_sheet',
      archivePack: 'Odyssey_Scene_Ensembles_v3',
      resolution: 'Craft lineage road plates (5 plates)'
    },
    wayfinding_tableau_sheet: {
      sheet: 'wayfinding_tableau_sheet (Odyssey_Scene_Ensembles_v3/tableaux/wayfinding/)',
      category: 'orchard_tableau_sheet',
      archivePack: 'Odyssey_Scene_Ensembles_v3',
      resolution: 'Wayfinding outrigger canoe plates (3 plates)'
    },
    hazard_tableau_sheet: {
      sheet: 'monster_hazard_tableau_sheet (Odyssey_Watson_Kits/tableaux/)',
      category: 'orchard_tableau_sheet',
      archivePack: 'Odyssey_Watson_Kits',
      resolution: 'Scylla & Charybdis composite plates (2 plates)'
    },
    fullkit_reference: {
      sheet: 'fullkit_reference (Odyssey_Scene_Ensembles_v3/characters/ & Cardboard_Family_Film_Kits_v2/parts/)',
      category: 'fullkit_reference',
      archivePack: 'Odyssey_Scene_Ensembles_v3 + Cardboard_Family_Film_Kits_v2',
      resolution: '27 full-body pose kits (110 poses) + 71 E00 portraits + 27 torsos'
    },
    die_cut_props_sheet: {
      sheet: 'die_cut_props_sheet (Odyssey_Watson_Kits/props/ & extras/)',
      category: 'die_cut_props_sheet',
      archivePack: 'Odyssey_Watson_Kits',
      resolution: '36 die-cut cardboard stage prop tokens'
    }
  });

  function resolvePlayerPoseUrl(emotionState, posesIndex) {
    const playerPoses = (posesIndex && posesIndex.char_player) || [];
    const byId = Object.fromEntries(playerPoses.map(p => [p.id, p.url]));
    if (['E01'].includes(emotionState)) return { id: 'bench_focus', url: byId.bench_focus || 'odyssey/slopling-cast/poses/char_player_bench_focus.png' };
    if (['E05', 'E12'].includes(emotionState)) return { id: 'polite_strain', url: byId.polite_strain || 'odyssey/slopling-cast/poses/char_player_polite_strain.png' };
    if (['E04', 'E08', 'E10', 'E11'].includes(emotionState)) return { id: 'doubt', url: byId.doubt || 'odyssey/slopling-cast/poses/char_player_doubt.png' };
    if (['E09', 'E16', 'E17'].includes(emotionState)) return { id: 'boundary', url: byId.boundary || 'odyssey/slopling-cast/poses/char_player_boundary.png' };
    if (['E06', 'E07', 'E13', 'E15'].includes(emotionState)) return { id: 'show_work', url: byId.show_work || 'odyssey/slopling-cast/poses/char_player_show_work.png' };
    return { id: 'listen', url: byId.listen || 'odyssey/slopling-cast/poses/char_player_listen.png' };
  }

  function resolveAuditStatus(beatId, nodeId, entityId, activeState, actingReview) {
    const findings = (actingReview && actingReview.findings) || [];
    const passedChecks = (actingReview && actingReview.passed_checks) || [];
    const qualifiedTarget = nodeId
      ? (String(nodeId).includes('::') ? String(nodeId) : `${beatId}::${nodeId}`)
      : beatId;

    // 1. Check exact qualified_id + entityId match in findings
    let finding = findings.find(f => f.qualified_id === qualifiedTarget && (!entityId || f.entity_id === entityId));
    // 2. Fallback to exact qualified_id match
    if (!finding) {
      finding = findings.find(f => f.qualified_id === qualifiedTarget);
    }
    // 3. Fallback to any finding in the same beat for this entity
    if (!finding && entityId) {
      finding = findings.find(f => (f.qualified_id === beatId || f.qualified_id.startsWith(beatId + '::')) && f.entity_id === entityId);
    }
    // 4. Fallback to any finding in the same beat
    if (!finding) {
      finding = findings.find(f => f.qualified_id === beatId || f.qualified_id.startsWith(beatId + '::'));
    }

    const passed = passedChecks.find(p => p.scope && p.scope.includes(beatId));

    if (finding) {
      const isSemantic = finding.priority === 'semantic' || Boolean(finding.semantic_context);
      const fromStates = (finding.current_states || []).join(',');
      const toStates = (finding.recommended_states || []).join(',');
      const status = isSemantic ? 'SEMANTIC_GUARD' : 'OVERRIDDEN';
      const summary = isSemantic
        ? `SEMANTIC GUARD (${finding.qualified_id}): ${fromStates} retained with status_pride_visual_reuse guard — ${finding.reason}`
        : `DIRECTOR OVERRIDE (${finding.priority.toUpperCase()} · ${finding.qualified_id}): ${fromStates} → ${toStates} — ${finding.reason}`;
      return {
        summary,
        status,
        overridden: !isSemantic,
        verified: true,
        qualifiedId: finding.qualified_id,
        priority: finding.priority,
        currentStates: finding.current_states,
        recommendedStates: finding.recommended_states,
        reason: finding.reason,
        semanticContext: finding.semantic_context || null
      };
    }

    if (passed) {
      const summary = `VERIFIED PASS (${passed.scope}): ${passed.result}`;
      return {
        summary,
        status: 'VERIFIED_PASS',
        overridden: false,
        verified: true,
        qualifiedId: qualifiedTarget,
        priority: 'verified',
        currentStates: activeState ? [activeState] : [],
        recommendedStates: activeState ? [activeState] : [],
        reason: passed.result,
        semanticContext: null
      };
    }

    const summary = `VERIFIED AUTHORED (${qualifiedTarget}): Source affect and performance binding verified without director override.`;
    return {
      summary,
      status: 'VERIFIED_AUTHORED',
      overridden: false,
      verified: true,
      qualifiedId: qualifiedTarget,
      priority: 'normal',
      currentStates: activeState ? [activeState] : [],
      recommendedStates: activeState ? [activeState] : [],
      reason: 'Authored performance binding passes acting direction review.',
      semanticContext: null
    };
  }

  function resolveBeatTableauId(beatId, binding) {
    const bNum = parseBeatNumber(beatId);
    const title = ((binding && binding.name) || '').toLowerCase();
    const setting = ((binding && binding.setting) || '').toLowerCase();

    if (bNum >= 93 || setting.includes('orchard') || title.includes('orchard') || title.includes('trees')) {
      if (beatId === 'beat_93') return 'orchard_journal';
      if (beatId === 'beat_94') return 'orchard_calipers';
      if (beatId === 'beat_100' || title.includes('tree')) return 'orchard_trees';
      if (beatId === 'beat_101') return 'orchard_hand';
      if (beatId === 'beat_102' || beatId === 'beat_103') return 'orchard_embrace';
      return 'orchard_silence';
    }
    if (beatId === 'beat_47' || title.includes('road of older ladders')) return 'road_carpenter';
    if (beatId === 'beat_48') return 'wayfinding_swells';
    if (beatId === 'beat_49') return 'wayfinding_share';
    if (beatId === 'beat_75') return 'wayfinding_keep';
    if (beatId === 'beat_24' || title.includes('scylla')) return 'scylla_assembled';
    if (beatId === 'beat_33a' || beatId === 'beat_33b' || title.includes('charybdis')) return 'charybdis_assembled';
    return null;
  }

  /**
   * Traces any stage artifact (`cast`, `prop`, `tableau`, `emotion`, or `rig` part)
   * back to its master archive sheet, extraction mask/method, local asset file,
   * performance binding rule, director audit status, and 9x9 ONYX coordinate.
   */
  function traceArtifact(artifactType, id, beatId, nodeId, odysseyData) {
    const data = resolveOdysseyData(odysseyData);
    const rigManifest = resolveRigManifest(odysseyData);
    const bindings = (data && data.performanceBindings && data.performanceBindings.beats) || [];
    const emotionsList = (data && data.performanceBindings && data.performanceBindings.emotions) || [];
    const actingReview = (data && data.actingReview) || {};
    const actorsList = (data && data.actors) || [];
    const posesIndex = (data && data.posesIndex) || {};
    const tableauxIndex = (data && data.tableauxIndex) || {};
    const propMap = (data && data.propMap) || {};
    const torsoMap = (data && data.torsoMap) || {};

    const cleanBeatId = beatId || 'beat_2';
    const binding = bindings.find(b => b.beat_id === cleanBeatId) || bindings[2] || {};
    const nodes = (binding && binding.nodes) || [];

    // Resolve active node if nodeId is provided (can be index, short id like 'c1'/'i2b', or qualified_id 'beat_94::i2b')
    let activeNode = nodes[0] || null;
    let matchedNode = null;
    if (nodeId !== undefined && nodeId !== null && nodeId !== '') {
      if (typeof nodeId === 'number' && nodes[nodeId]) {
        matchedNode = nodes[nodeId];
        activeNode = matchedNode;
      } else {
        const qId = String(nodeId).includes('::') ? String(nodeId) : `${cleanBeatId}::${nodeId}`;
        matchedNode = nodes.find(n => n.qualified_id === qId || n.qualified_id === String(nodeId)) || null;
        if (matchedNode) activeNode = matchedNode;
      }
    }

    const qualifiedKey = matchedNode
      ? matchedNode.qualified_id
      : (nodeId !== undefined && nodeId !== null && nodeId !== '' && typeof nodeId !== 'number'
        ? (String(nodeId).includes('::') ? String(nodeId) : `${cleanBeatId}::${nodeId}`)
        : ((activeNode && activeNode.qualified_id) || cleanBeatId));

    const normalizedType = String(artifactType || 'cast').toLowerCase().trim();
    const rawId = String(id || '').trim();

    // Determine active emotion state on this beat/node
    let activeEmotion = 'E00';
    if (activeNode && Array.isArray(activeNode.performances) && activeNode.performances.length) {
      const p0 = activeNode.performances[0];
      if (p0.states && p0.states[0] && p0.states[0].state) {
        activeEmotion = p0.states[0].state;
      }
    } else if (binding.cast && binding.cast[0] && binding.cast[0].suggested_performances && binding.cast[0].suggested_performances[0]) {
      activeEmotion = binding.cast[0].suggested_performances[0].state;
    }
    if (cleanBeatId === 'beat_94' && String(nodeId) === 'c1') {
      activeEmotion = 'E17';
    }

    // ------------------------------------------------------------------------
    // CASE 1: RIG PART (`rig` / 15-Part Articulated Watson Rig)
    // ------------------------------------------------------------------------
    if (normalizedType === 'rig' || normalizedType === 'joint' || normalizedType === 'rig_part') {
      const parts = (rigManifest && rigManifest.parts) || [];
      const part = parts.find(p => p.id === rawId) || parts.find(p => p.id === 'torso') || {
        id: rawId || 'torso',
        label: 'Torso and shoulder caps',
        pivot: [512, 701],
        parent: 'pelvis',
        layer: 50,
        rect: [311, 221, 398, 500],
        polygon: [],
        underlap_pads: [{ kind: 'concealed_neck_joint_backing', center: [512, 315], radius: 28 }],
        data: `odyssey/slopling-cast/rig/${rawId || 'torso'}.png`
      };

      const padSummary = (part.underlap_pads && part.underlap_pads.length)
        ? part.underlap_pads.map(u => `${u.kind} (r=${u.radius}px @ [${u.center.join(',')}])`).join(' + ')
        : 'Direct parent-pivot brass-brad overlap';

      const sourceArchive = `source/master_B.png · Master Cut v2 (master_rig_sheet · 1024×1536 · SHA-256 f663852f...60e2511)`;
      const extractionMethod = `15-Part Polygon Mask (${(part.polygon || []).length} vertices, rect [${(part.rect || []).join(',')}]) + Concealed Garment Underlap Tab (${padSummary})`;
      const assetPath = part.data || `odyssey/slopling-cast/rig/${part.id}.png`;
      const bindingRule = `${qualifiedKey} -> watson_rig::${part.id} (parent: ${part.parent || 'root'}, pivot: [${(part.pivot || []).join(',')}], z-layer: ${part.layer}) + ${activeEmotion}`;
      const auditObj = resolveAuditStatus(cleanBeatId, nodeId, 'char_player', activeEmotion, actingReview);
      const onyxCellCoord = [3, 3];

      return buildProvenanceRecord({
        artifactType: 'rig',
        id: part.id,
        label: `Watson 15-Part Rig · ${part.label || part.id}`,
        beatId: cleanBeatId,
        nodeId: qualifiedKey,
        sourceArchive,
        sourceArchiveCategory: 'master_rig_sheet',
        extractionMethod,
        assetPath,
        bindingRule,
        directorAudit: auditObj.summary,
        directorAuditDetails: auditObj,
        onyxCellCoord,
        extraMeta: {
          pivot: part.pivot,
          rect: part.rect,
          parent: part.parent,
          layer: part.layer,
          underlapPads: part.underlap_pads
        }
      });
    }

    // ------------------------------------------------------------------------
    // CASE 2: EMOTION HEAD (`emotion` / `E00`–`E17`)
    // ------------------------------------------------------------------------
    if (normalizedType === 'emotion' || normalizedType === 'head' || /^E\d{2}$/i.test(rawId)) {
      const emoId = /^E\d{2}$/i.test(rawId) ? rawId.toUpperCase() : activeEmotion;
      const emoObj = emotionsList.find(e => e.id === emoId) || { id: emoId, name: 'Attentive listening', cue: 'Focused gaze' };

      // Find exact cell in Rows 3–6 where this emotion is staged
      let emoCoord = [6, parseInt(emoId.replace(/\D/g, ''), 10) % 9];
      const cast = (binding && binding.cast) || [];
      const allSuggested = cast.flatMap(m => (m.suggested_performances || []).map(sp => sp.state));
      const sugPos = allSuggested.indexOf(emoId);
      const freeEmotionSlots = [[3, 0], [3, 5], [3, 8], [4, 1], [4, 3], [4, 5], [4, 7], [5, 0], [5, 2], [5, 3], [5, 5], [5, 6], [5, 8]];
      if (sugPos >= 0 && sugPos < freeEmotionSlots.length) {
        emoCoord = freeEmotionSlots[sugPos];
      }

      const sourceArchive = `watson_emotion_sheet · Cardboard_Family_Film_Kits_v2/parts/watson/heads/${emoId}.png (18-State Face Bank)`;
      const extractionMethod = `SCION-GRABCUT + Alpha-Channel Neck-Collar Registration & 18-Cell Expression Sheet Slicing`;
      const assetPath = `odyssey/slopling-cast/watson-heads/${emoId}.png`;
      const bindingRule = `${qualifiedKey} -> ${emoId} (${emoObj.name} — "${emoObj.cue}")`;
      const auditObj = resolveAuditStatus(cleanBeatId, nodeId, 'char_player', emoId, actingReview);

      return buildProvenanceRecord({
        artifactType: 'emotion',
        id: emoId,
        label: `${emoId} · ${emoObj.name}`,
        beatId: cleanBeatId,
        nodeId: qualifiedKey,
        sourceArchive,
        sourceArchiveCategory: 'watson_emotion_sheet',
        extractionMethod,
        assetPath,
        bindingRule,
        directorAudit: auditObj.summary,
        directorAuditDetails: auditObj,
        onyxCellCoord: emoCoord,
        extraMeta: {
          emotionName: emoObj.name,
          actingCue: emoObj.cue
        }
      });
    }

    // ------------------------------------------------------------------------
    // CASE 3: SCENE TABLEAU (`tableau`)
    // ------------------------------------------------------------------------
    if (normalizedType === 'tableau' || tableauxIndex[rawId]) {
      const tabId = tableauxIndex[rawId] ? rawId : (resolveBeatTableauId(cleanBeatId, binding) || 'orchard_calipers');
      const tabUrl = tableauxIndex[tabId] || `odyssey/slopling-cast/tableaux/${tabId}.png`;

      let sheetName = 'orchard_tableau_sheet · Odyssey_Scene_Ensembles_v3/tableaux/orchard/';
      if (tabId.startsWith('road_')) sheetName = 'orchard_tableau_sheet (road_craft_series) · Odyssey_Scene_Ensembles_v3/tableaux/road/';
      else if (tabId.startsWith('wayfinding_')) sheetName = 'orchard_tableau_sheet (wayfinding_series) · Odyssey_Scene_Ensembles_v3/tableaux/wayfinding/';
      else if (tabId.startsWith('scylla') || tabId.startsWith('charybdis')) sheetName = 'orchard_tableau_sheet (hazard_diorama_series) · Odyssey_Watson_Kits/tableaux/';

      const sourceArchive = `${sheetName}${tabId}.png`;
      const extractionMethod = `SCION-GRABCUT Multi-Figure Diorama Isolation + Layered Paper Depth-Plane Matting`;
      const assetPath = tabUrl;
      const bindingRule = `${qualifiedKey} -> ${tabId} + ${activeEmotion}`;
      const auditObj = resolveAuditStatus(cleanBeatId, nodeId, null, activeEmotion, actingReview);
      const onyxCellCoord = TABLEAU_COORD_9X9.slice();

      return buildProvenanceRecord({
        artifactType: 'tableau',
        id: tabId,
        label: `Tableau · ${tabId.replace(/_/g, ' ')}`,
        beatId: cleanBeatId,
        nodeId: qualifiedKey,
        sourceArchive,
        sourceArchiveCategory: 'orchard_tableau_sheet',
        extractionMethod,
        assetPath,
        bindingRule,
        directorAudit: auditObj.summary,
        directorAuditDetails: auditObj,
        onyxCellCoord
      });
    }

    // ------------------------------------------------------------------------
    // CASE 4: DIE-CUT STAGE PROP (`prop`)
    // ------------------------------------------------------------------------
    if (normalizedType === 'prop' || propMap[rawId]) {
      let propKey = rawId;
      if (!propMap[propKey]) {
        const lower = rawId.toLowerCase();
        propKey = Object.keys(propMap).find(k => lower.includes(k) || k.includes(lower)) || 'calipers';
      }
      const propUrl = propMap[propKey] || `odyssey/slopling-cast/props/${propKey}.png`;
      const rawProps = (binding && binding.props_and_fx) || [];
      const rawMatch = rawProps.find(p => p.toLowerCase().includes(propKey.replace(/_/g, ' ').split(' ')[0])) || propKey;

      // Determine which prop slot [row, col] this prop occupies in the beat
      const propIndex = Math.max(0, rawProps.indexOf(rawMatch));
      const onyxCellCoord = (PROP_COORDS_9X9[propIndex % PROP_COORDS_9X9.length] || [3, 1]).slice();
      const tableauForBeat = resolveBeatTableauId(cleanBeatId, binding);
      const targetToken = tableauForBeat && cleanBeatId === 'beat_94' && propKey === 'calipers'
        ? `orchard_calipers + ${activeEmotion}`
        : `${propKey} (props_and_fx: "${rawMatch}") + ${activeEmotion}`;

      const sourceArchive = `die_cut_props_sheet · Odyssey_Watson_Kits/props/${propKey}.png`;
      const extractionMethod = `SCION-GRABCUT + Die-Cut Contour Alpha Extraction & Cardstock Bevel Matte`;
      const assetPath = propUrl;
      const bindingRule = `${qualifiedKey} -> ${targetToken}`;
      const auditObj = resolveAuditStatus(cleanBeatId, nodeId, null, activeEmotion, actingReview);

      return buildProvenanceRecord({
        artifactType: 'prop',
        id: propKey,
        label: `Die-Cut Prop · ${propKey.replace(/_/g, ' ')}`,
        beatId: cleanBeatId,
        nodeId: qualifiedKey,
        sourceArchive,
        sourceArchiveCategory: 'die_cut_props_sheet',
        extractionMethod,
        assetPath,
        bindingRule,
        directorAudit: auditObj.summary,
        directorAuditDetails: auditObj,
        onyxCellCoord
      });
    }

    // ------------------------------------------------------------------------
    // CASE 5: STAGE CUTOUT / CAST ACTOR (`cast`, `pose`, `portrait`, `torso`)
    // ------------------------------------------------------------------------
    const entityId = rawId || 'char_player';
    const actorMeta = actorsList.find(a => a.actorId === entityId) ||
      actorsList.find(a => a.actorId.includes(entityId) || entityId.includes(a.actorId)) || null;

    const castList = (binding && binding.cast) || [];
    const castIdx = Math.max(0, castList.findIndex(c => c.entity_id === entityId));
    const castEntry = castList[castIdx] || castList[0] || { entity_id: entityId, suggested_performances: [{ state: activeEmotion, cue: 'on stage' }] };
    const sp0 = (castEntry.suggested_performances && castEntry.suggested_performances[0]) || { state: activeEmotion, cue: 'on stage' };
    const charEmotion = sp0.state || activeEmotion;

    let posePath = `odyssey/slopling-cast/poses/${entityId}_p0.png`;
    let poseId = 'p0';
    if (entityId === 'char_player') {
      const resolvedPose = resolvePlayerPoseUrl(charEmotion, posesIndex);
      posePath = resolvedPose.url;
      poseId = resolvedPose.id;
    } else if (posesIndex[entityId] && posesIndex[entityId].length) {
      posePath = posesIndex[entityId][0].url;
      poseId = posesIndex[entityId][0].id;
    } else if (actorMeta && actorMeta.portraitUrl) {
      posePath = actorMeta.portraitUrl;
      poseId = 'portrait_cutout';
    }

    const upstreamSource = (actorMeta && actorMeta.sourcePath)
      ? actorMeta.sourcePath
      : (entityId === 'char_player'
        ? 'source/master_B.png + Cardboard_Family_Film_Kits_v2/parts/watson/'
        : `Odyssey_Scene_Ensembles_v3/characters/${entityId}/heads/E00.png`);

    const archiveCategory = entityId === 'char_player' ? 'master_rig_sheet + fullkit_reference' : 'fullkit_reference';
    const sourceArchive = `${archiveCategory} · ${upstreamSource}`;
    const extractionMethod = entityId === 'char_player'
      ? `15-Part Polygon Mask + Concealed Garment Underlap Tab & SCION-GRABCUT Pose Composite (${poseId})`
      : `SCION-GRABCUT + Vertical Alpha-Valley Connected-Component Split & Brass-Brad Torso/Head Assembly`;
    const assetPath = normalizedType === 'portrait'
      ? ((actorMeta && actorMeta.portraitUrl) || `odyssey/slopling-cast/portraits/${entityId}.png`)
      : (normalizedType === 'torso'
        ? (torsoMap[entityId] || `odyssey/slopling-cast/torsos/${entityId}.png`)
        : posePath);

    const bindingRule = `${qualifiedKey} -> cast[${entityId}]::${poseId} + ${charEmotion} ("${sp0.cue || 'staged'}")`;
    const auditObj = resolveAuditStatus(cleanBeatId, nodeId, entityId, charEmotion, actingReview);
    const onyxCellCoord = (CAST_POSITIONS_9X9[castIdx % CAST_POSITIONS_9X9.length] || [4, 4]).slice();

    return buildProvenanceRecord({
      artifactType: 'cast',
      id: entityId,
      label: (actorMeta && actorMeta.name) || entityId,
      beatId: cleanBeatId,
      nodeId: qualifiedKey,
      sourceArchive,
      sourceArchiveCategory: 'fullkit_reference',
      extractionMethod,
      assetPath,
      bindingRule,
      directorAudit: auditObj.summary,
      directorAuditDetails: auditObj,
      onyxCellCoord,
      extraMeta: {
        portraitPath: (actorMeta && actorMeta.portraitUrl) || `odyssey/slopling-cast/portraits/${entityId}.png`,
        torsoPath: torsoMap[entityId] || null,
        poseId,
        emotionState: charEmotion,
        group: (actorMeta && actorMeta.group) || 'cast'
      }
    });
  }

  function buildProvenanceRecord(fields) {
    const coord = Array.isArray(fields.onyxCellCoord) ? fields.onyxCellCoord : [4, 4];
    const lineageSteps = [
      { step: 1, stage: 'Source Archive', value: fields.sourceArchive },
      { step: 2, stage: 'Extraction Method', value: fields.extractionMethod },
      { step: 3, stage: 'Local Asset Path', value: fields.assetPath },
      { step: 4, stage: 'Performance Binding Rule', value: fields.bindingRule },
      { step: 5, stage: 'Director Audit Review', value: fields.directorAudit },
      { step: 6, stage: 'ONYX 9×9 Spatial Cell', value: `[${coord[0]}, ${coord[1]}]` }
    ];

    return Object.assign({
      theorem: LINEAGES.ARCHIVE_TO_PUPPET_PROVENANCE.theorem,
      artifactType: fields.artifactType,
      id: fields.id,
      label: fields.label,
      beatId: fields.beatId,
      nodeId: fields.nodeId,
      sourceArchive: fields.sourceArchive,
      sourceArchiveCategory: fields.sourceArchiveCategory,
      extractionMethod: fields.extractionMethod,
      assetPath: fields.assetPath,
      bindingRule: fields.bindingRule,
      directorAudit: fields.directorAudit,
      directorAuditDetails: fields.directorAuditDetails,
      onyxCellCoord: coord,
      onyxCellCoordLabel: `[${coord[0]}, ${coord[1]}]`,
      lineageSteps
    }, fields.extraMeta || {});
  }

  /**
   * Returns the complete set of provenance chains for all active stage artifacts in a beat.
   */
  function traceBeatProvenance(beatId, nodeId, odysseyData) {
    const data = resolveOdysseyData(odysseyData);
    const bindings = (data && data.performanceBindings && data.performanceBindings.beats) || [];
    const cleanBeatId = beatId || 'beat_2';
    const binding = bindings.find(b => b.beat_id === cleanBeatId) || {};

    const castRecords = ((binding.cast && binding.cast.length) ? binding.cast : [{ entity_id: 'char_player' }])
      .slice(0, 4)
      .map(c => traceArtifact('cast', c.entity_id, cleanBeatId, nodeId, data));

    const primaryState = (castRecords[0] && castRecords[0].emotionState) || 'E00';
    const emotionRecord = traceArtifact('emotion', primaryState, cleanBeatId, nodeId, data);

    const tableauId = resolveBeatTableauId(cleanBeatId, binding);
    const tableauRecord = tableauId ? traceArtifact('tableau', tableauId, cleanBeatId, nodeId, data) : null;

    const rawProps = (binding.props_and_fx || []).slice(0, 4);
    const propRecords = rawProps.map(p => traceArtifact('prop', p, cleanBeatId, nodeId, data));

    const rigRecord = traceArtifact('rig', 'torso', cleanBeatId, nodeId, data);

    return {
      beatId: cleanBeatId,
      nodeId: nodeId || null,
      theorem: LINEAGES.ARCHIVE_TO_PUPPET_PROVENANCE.theorem,
      cast: castRecords,
      emotion: emotionRecord,
      tableau: tableauRecord,
      props: propRecords,
      rig: rigRecord
    };
  }

  const ProvenanceGraph = {
    theorem: LINEAGES.ARCHIVE_TO_PUPPET_PROVENANCE.theorem,
    lineage: LINEAGES.ARCHIVE_TO_PUPPET_PROVENANCE,
    SOURCE_ARCHIVE_CATALOG,
    traceArtifact,
    traceBeatProvenance
  };

  return {
    version: '1.0.0',
    LINEAGES,
    StateMachine,
    ProvenanceGraph,
    // Top-level convenience aliases
    computeStateForBeat,
    traceArtifact,
    traceBeatProvenance
  };
});
