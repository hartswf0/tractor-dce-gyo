# tools/perform: the performance engine

Words become edits to embodied action on the film's LDraw minifig rigs, regulated by thermal and homeostatic measures. The engine
never adds motion to beat a threshold: every key it writes is caused by an intent in the score, and every intent by an utterance, a
stimulus, another body's action or a HOLD's reason. A stillness is a HOLD with a reason; motion without a cause is a defect the
metrics report.

```
node tools/perform/perform.js author   OD-B01-S03 [--force]        scene module -> score (authored layer)
node tools/perform/perform.js compile  OD-B01-S03                  score -> body score (sheet) + events
node tools/perform/perform.js measure  OD-B01-S03                  metrics and temperatures, before (the acted sheet) and after
node tools/perform/perform.js why      OD-B01-S03 telemachus 37.6  "why is he moving here?"
node tools/perform/perform.js homeostat OD-B01-S03 [--max 40]      uniselectors step the parameters until the variables are in band
node tools/perform/perform.js patch    OD-B01-S03 "make Telemachus more suspicious"
node tools/perform/perform.js chain    OD-B01-S03                  five instructions in a row, with timeline diffs
node tools/perform/perform.js hardware OD-B01-S03                  stop-motion pose sheet and servo timeline (CSV)
node tools/perform/previz.js           OD-B01-S03 [--sheet f --score f --name n --from s --to s]
node tools/perform/probe.js            OD-B09-S09 [--poses]        marks and shot cameras from the film's page (12-15 min)
  --variant wake-early [--frozen]      a disturbed run (the Blinding): odyssey/score/variants/
```

## Files

| file | what |
|---|---|
| `body.js` | the take's blocking at any t (a port of odyssey-take.js castAt), the sheet laid over it as choreo.js lays it, forward kinematics on the film's pivot tree (checked against the page's own points: 0.15 units mean) |
| `score.js` | the score format (odyssey-score/1): lanes, events, causes, `why()`, the rig desk's lane view |
| `compile.js` | the intent compiler: utterances, intents, machinery, walks, breath, solvers, legality -> odyssey-choreo/1 sheet + events |
| `intents.js` | attention, holds, speech acts (WELCOME, GUARDED_WELCOME), the handoff (OFFER/TAKE), LEAD/FOLLOW, business (GAMBLE, DRINK, POUR, REACT, GESTURE) |
| `intents-action.js` | labour, force, combat: SIGNAL, HEAT, CARRY, THRUST, TWIST, STRAIN, RECOIL, HIDE, CLING, ADVANCE, RETIME, THREAT, SHOOT, IMPACT, FALL, DUCK, EVADE, SEARCH, LEAP, POUR_OUT, SEPARATION, RETARGET, RECOVER, PURSUIT |
| `machinery.js` | the Blinding's coupled homeostat model; ROWING (one phase clock, per-body offsets); SIRENS_CHAIN (crew force -> hull -> mast -> rope -> strain) |
| `metrics.js` | per actor per drawing states through the shot cameras; the report |
| `thermo.js` | motion heat (through couplings, by material), causal entropy, media temperature, contrast, viability, the field |
| `homeostat.js` | the uniselector homeostat and the coupled four-unit homeostat |
| `patches.js` | instruction -> patch table; timeline and body diffs |
| `hardware.js` | pose sheet and servo timeline |
| `previz.js`, `previz-draw.js` | the light previz |
| `scenes/<scene>.js` | a scene's direction (authors the score) |

Data: `odyssey/score/<scene>.json` (score), `<scene>.choreo.json` (sheet the take plays: `tools/export-odyssey.js --choreo`),
`measures/`, `chains/`, `variants/`, `cameras/`, `hardware/`.

## The score (odyssey-score/1)

```
{ format, scene, title, type: dialogue|fight|revelation|machinery, total, clock, marks,
  actors:  { id: { role, body: 'minifig'|'prop', principal?, group?, affect?: {fear, weight, suspicion, cunning, heat} } },
  objects: { id: { kind, material, at?: [x,y,z] | track?: [[t,[x,y,z]],...], holder?: 'actor:R', touches?: [ids], exit?, affords: [...] } },
  authored: { intents, holds, stimuli, goals, couplings, machinery, causal, camera?, coupled? },
  params, params0, bands, events, measures, log: { homeostat, patches } }
```

Lanes, top to bottom: VOICE STIMULUS INTENT ACTION CONTACT | ROOT WEIGHT TORSO HEAD GAZE ARM.L ARM.R HAND.L HAND.R LEG.L LEG.R FACE
PROP | CAMERA LIGHT SET/VEHICLE FX. An event: `{id, lane, actor?, actors?, t0, t1, kind, label, because: [{id, latency, rel?}],
lanes?, params?}`. An ACTION carries the body lanes it moves in `lanes`. `because` is the causal graph (rel: `anticipates` for a
body's preparation before its intent's nominal start, `realises` for an intent that realises an utterance). `validate()` checks that
causes exist and precede their effects.

## Authoring a scene module

`tools/perform/scenes/<scene>.js` exports `author(M, X)` where `M` is the marks and `X.voiceOf(clip)` gives
`{phrases, stresses, words}` for a clip (words placed on the voice's phrases by their letters). It returns
`{type, title, actors, objects, authored}`. Times come from the take: `M.keys` (each key `{id, t, win:[t0,t1], snap, moves}`), the
clips' words, the stresses. See `scenes/OD-B01-S03.js` (acting: dialogue, a handoff) and `scenes/OD-B09-S09.js` (a coupled
homeostat decides the timings).

An intent: `{id, actor, kind, t0, t1, target?, utterance? (a clip gi), key? (the blocking key whose walk it owns), label, params,
because: [{id}]}`. A hold: `{id, actor, t0, t1, reason, params: {look: [[target, seconds], ...], weight: bool, grip: 'R'|'L',
still: bool, offset}, because}`. A stimulus: `{id, t0, t1, kind (SOUND, SIGHT, SCENE, WORD, NEEDLE, ...), label, actor?, because}`.
A target is an actor id, an object id, or a point `[x,y,z]`.

### Intent kinds and their parameters

- `ATTEND {target, params.track}`; `NOTICE {target, params.gazeHold}` (the double take); `SHAME {params.lookAt, hold}`;
  `DECIDE`; `LISTEN {target, params.nods: [t]}`; `REACT {params: how (nod|laugh|lean|flinch|startle|turn), lookAt, latencyScale}`.
- `HOLD` (see above). `STEP {target, params.dist (heights, + toward), dur}`. `SET_DOWN {params.side, what}` (hides the held prop).
  `RISE`. `ARRIVE {params.from: [dx,dz], dur}`. `KNOCK {params.stim}` (writes a SOUND stimulus). `APPROACH {key, target}` (owns the
  blocking walk; the head tracks the target).
- `WELCOME` / `GUARDED_WELCOME {target, utterance, params: approach, openness, headLead, weight, handToSpearDelay, gazeHold,
  backBias, maxBeats, beatsOnlyKey, side}`: PRE (the head acquires the target), ON STRESS (the act's gesture), AFTER (the gaze held),
  TRANSITION (the handoff and the lead are their own intents).
- `TAKE {target (giver), params: prop, from 'giver:R', to 'receiver:R', word, of (the speech intent), reach}` with
  `OFFER {params.with (the TAKE id)}`: the grip instant is the word + the speech act's handToSpearDelay; both hands are solved by
  forward kinematics to a meeting point; CONTACT GRIP SYNC; props `give` (persistent state at t).
- `LEAD {params: path [[x,z],...], speed (heights/s), freeArm}` / `FOLLOW {params: leader (LEAD id), path, speed}`.
- `GAMBLE {params.throws: [t]}` (writes stimuli `dice:<actor>:<k>`), `DRINK {params.at}`, `POUR {params.at, cupOf}`,
  `GESTURE {params: shape (open|point|chop|fist|chest|dismiss|plead|recoil), at, side, amp, hold}`.
- `SIGNAL {params: how (go|hush|flee), to: [ids], lookAt, side}` (the signalled answer); `HEAT {params.glowAt, glowId}`;
  `CARRY {params.with}`; `THRUST {target, params: with, impactId, impact}` (CONTACT IMPACT); `TWIST {params.period}` (FX steam);
  `STRAIN`; `RECOIL {params.from}`; `HIDE {params: from, to}`; `CLING`.
- `ADVANCE {params: key, arrive}` and `RETIME {params: key, delay}`: a blocking move to a key started early or held, as a whole
  (root, heading, every joint, the legs walking).
- Combat: `THREAT {target, params.side}`, `SHOOT {target, params: draw, hold, looseId}` (SOUND stimulus at the loose),
  `IMPACT {params: until, label}`, `FALL {params.key}`, `DUCK`, `EVADE`, `SEARCH`, `LEAP {params.landId}`, `POUR_OUT`,
  `SEPARATION`, `RETARGET {target}`, `RECOVER`, `PURSUIT {target}`.

Every realiser writes through `X.move(actor, layer, kind, cause, k => { k(t, {channel: value | X.sheet.rel(d) | {abs: v}}, ease) })`
(a move starts from where its lane is; `{abs}` is an absolute joint angle, converted to an offset over the blocking's pose) and
`X.look(actor, target, t, cause, opts)`. Layers: `gaze act grip loco weight react mech limit`. Add a kind by adding a function
`(X, I, e)` to `intents.js` or `intents-action.js`.

### Machinery

`authored.machinery: [{kind: 'ROWING', clock: {period, t0, t1}, offsets: {actor: fraction}, amp, busy}, {kind: 'SIRENS_CHAIN', ...}]`
(see `machinery.js`). Couplings for the heat: `authored.couplings: [{from, to, via (a material), k?, t0, t1, env?}]`.

### The causal model

`authored.causal: {tau, actions: {actor: [{a, base, f: {'feature:arg:arg': weight}, uses: [object ids]}]}}`. Features (thermo.js):
`dist:x`, `near:x:r`, `sees:x`, `seated[:x]`, `walking[:x]`, `holds:prop`, `intent:KIND`, `after:eventId`, `threat:x`,
`speaking[:x]`, `open:door`. p = softmax(u / tau), S_c = -sum p log2 p.

## Compiler parameters (the homeostat's selectors, 25 positions each)

`latency amp separation threat attack pause camera affordance env horizon focus` (compile.js PARAMS: range and default). amp scales
every expressive move (act, react, weight layers); focus cools figures the scene does not name as principals.

## Metrics, temperatures, homeostat

States per actor per drawing: ACTION, REACTION, ALIVE_HOLD (authored HOLD, or attention on something active, or a motivated state
change within 2 s), DEAD. The report: coverage, literal movement, unmotivated freeze and action, reaction latency, gesture density,
channel diversity, contact integrity, pose legality, balance. Temperatures: T_m (heights/s squared, integrated, conducted), S_c
(bits), T_media (0-1, McLuhan's definition, not thermodynamics), C_T (hottest on screen minus the room), V (violations).
Homeostat essential variables H1-H4 with bands by scene type (homeostat.js WORD, TYPES); patches set bands relative to the scene's
current reading.

## Hooks for later work

- A creature rig (film-readymades/creatures.js, to come) gives a giant or a quadruped channels: add them to body.js's pivot tree,
  to choreo.js's CLAMP and applyRig, and write GIANT_RIG / QUADRUPED intents (SEIZE, EAT, THROW, HERD) here.
- The needs catalogue (odyssey/perform/needs.json) lists the kinds scenes ask for; missing today: POSTURE, WEEP, ROPE_WORK, ROW (as an
  intent), TOOL_WORK, ARM, EAT, RECOGNISE, sustained CONTACT (SEIZE, HOLD, EMBRACE, DRAG), BLOCK, ship, sea.
