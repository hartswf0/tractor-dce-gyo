# Film Butter: readymades and instruction theory

The prior construction edition used a narrow vocabulary repeatedly. It had bricks and counts, but little of the architectural, mechanical and landscape articulation visible in the supplied reference. The corrective action is to retrieve designed kits, preserve their internal construction, and adapt selected modules to dramatic spaces.

## Purpose and domain

A <film-case> specifies locations, cast scale, acting clearances, camera access and reusable physical details. A <donor-kit> is a versioned source file with an author, licence statement and checksum. A <submodel-definition> describes a reusable local coordinate system; a <module-instance> places that definition within a parent. These are different entities. Ten identical windows use one definition in ten instances.

[Forage] discovers actual files. [Parse] constructs the reference graph. [Extract] emits a selected root and its transitive dependencies while preserving original transforms and headers. [Inspect] isolates a module and identifies unresolved references. [Adapt] changes a copy with a recorded relationship to its donor. [Compose] places approved modules into a film set. [Instruct] operates on that same hierarchy.

The {screen-modes} are <canvas>, <diagnostics>, <module-tree> and <instructions>. They share instance identity and selection; changing screens must not regenerate geometry or change placement. On a phone, one principal viewport remains visible and secondary information occupies a temporary sheet. The four modes do not imply four simultaneous panels.

## Conditions and invariants

Every module keeps its donor, exact source definition, reference closure and placement transforms. Extracting a child does not stretch it or silently reinterpret its origin. Missing geometry is named. Counts distinguish reference placements, unique definitions, expanded leaf placements and physical inventory quantities. Generated flex geometry can inflate leaf counts; a retail piece count cannot be inferred from them.

The assembly sequence must assign every physical instance exactly once. A source submodel boundary is an authoring boundary, not automatic proof that the object can stand alone or be detached. A detachable module needs an independently checked internal connection graph and an explicit docking interface. Reused definitions remain independent occurrences in the assembled model.

For instruction pacing, use at most six additions and six distinct callout entries per step. A prebuilt module counts as a docking operation only when its separate booklet is complete. Preserve source ordering as evidence; changes to it require insertion and dependency checks. A localized BOM describes the exact additions, not the entire module inventory.

## State transitions

<discovered-reference> [retrieve] <source-file> [parse] <resolved-reference-graph> [select-root] <module-extract> [inspect] <adaptation-candidate> [validate-docking] <scene-instance>.

A failed retrieval remains a reference. A failed dependency check remains an incomplete extract. A missing strength model remains “not calculated.” None of these states can be promoted by a successful thumbnail, attractive render or large count.

Instruction instances transition from <future> to <current> to <past>. Future geometry is not drawn. Current geometry is fully legible with a distinct outline. Past geometry is subdued while remaining spatially interpretable. The full assembly view retains original colours.

## Corrections to the supplied sketch

The pasted sketch is a useful list of responsibilities, but its print statements are not their implementation. In particular, the statement about six interfaces and a stress value of 0.12 is hard-coded. There is no finite-element, clutch or torque solver behind it.

The theory specifies eight camera candidates; the code implements four. The sample count treats corner brick 2357 as a filled rectangular block, which changes both collision and visibility results. Grid axes use different physical scales: 20 LDraw units per stud and 8 per plate. Rays must operate in one consistent physical coordinate system.

The insertion test examines only twelve plate heights above the final top surface, skips the immediate top cell, and does not test the swept body volume or hand/tool geometry. It cannot establish insertion from infinity or finger clearance. Members of one batch are not inserted into the obstruction set until the batch ends. Height-and-coordinate sorting also does not enforce spatial locality or attachment dependencies.

The visibility score tests occupied voxels, not projected visible surface area, and only samples a short discrete ray. It never rejects an angle that violates the 25% threshold. A minimum score is not necessarily an acceptable view. A cutaway needs a visible convention explaining what was hidden; rotating 180 degrees cannot solve every enclosed-space blind spot.

## Required measurements for the next compiler

[Compute-insertion-trajectory] should sweep the true or explicitly conservative part envelope along the chosen insertion axis, from outside the prior assembly to the final pose. Test the candidate against prior parts and earlier additions in its batch. A part-clearance pass and a chosen hand-envelope clearance pass must be separate results. Hinges, clips, axles and side-mounted parts need their own supported insertion families.

[Solve-camera-pose] should evaluate eight azimuths in physical units and estimate projected visibility separately for every current part. Record the worst occlusion, selected angle and method. If every angle fails, reorder the operation, isolate a valid subassembly or emit a declared cutaway. Do not report compliance from a bounding-box heuristic without identifying that approximation.

[Render-instructions] should frame the active module, show neutral prior geometry, outline current additions, indicate insertion direction and include counted native part thumbnails. Source steps are input evidence; they are not automatically an ergonomic manual. [Stress-inspect] requires connection stiffness, load, material and solver assumptions before producing a numerical heatmap. Until then, show dependency and transform diagnostics under their own names.

## Change tests

A rotated window must preserve its local coordinates and orientation when extracted and redocked. Two occurrences of the same chair must count twice in an assembly BOM but once in the definition library. A model with a missing printed part must expose the missing reference. A roof enclosing an interior must not be scheduled merely because its body height sorts last. Two parallel booklets must end in a physically reachable docking operation with no interleaved dependency between their independently built modules.

## This delivery

This edition performs the forage, graph analysis and rooted extraction. It includes the original donor files, authored module boundaries, source metadata, dependency reports and a searchable catalogue. It does not implement a stress solver, finger-clearance solver, camera-occlusion optimizer or new finished films. The four-screen architecture is specified above so that these capabilities can be implemented against one preserved model rather than simulated with labels.


Extraction preserves local coordinates and inherited colour 16. Parent placement transforms and colours are not baked into an isolated definition; retain the original parent instance when positioning it in a film set. Preview rasterization does not support texture maps and simplifies transparency.

## Continuation: authored grocery location in the existing Butter player

The <location> is the preserved Green Grocer building. Its <ground-floor placement>,
<upper-floor instance>, <cast member>, and <source-step batch> keep separate identities.
[Inspect interior] temporarily hides upper floors; [review source steps] displays
ordered batches of at most six direct additions, with descendant booklets available
as native MPDs. These are source-order review pages, not solver-certified instructions.
[Restore building] makes every placement visible without changing any transform.

The initial adaptation replaces the sparse grocery architecture with this authored
location and places the existing Butter cast at the checkout. Original scenes remain
available. Uniform display scaling applies equally to geometry and cast. Native export
preserves donor definitions, instance matrices, inherited colours and STEP records.
The existing edited-triangle export remains a separate snapshot operation.

Whole-floor bounds cannot serve as interior collision geometry. Walking uses conservative
native leaf envelopes, transformed with their owning editable batch, for the ground floor.
This is a navigation approximation, not a clutch, stress, insertion or hand-clearance solver.
Doors remain closed unless explicitly edited; inspection views do not open physical doors.
Assembly review pauses exploration, hides cast, distinguishes current additions from past
geometry and excludes future geometry. Leaving review restores colours and visibility.

Failure cases: missing native dependency stops compilation; source transforms must not
be silently dropped; inherited colour 16 must resolve at the parent; repeated occurrences
must stay distinct; source STEP batches must cover ground-floor placements exactly once.
Changing a floor's display visibility must not alter its export or construction order.
A saved workspace must reopen with native geometry and the same production identities.

The shop inspection view declares a horizontal clipping cut at 98 display units. This does not mutate geometry or export. Whole-building framing derives from actual rendered bounds, including roof details; it does not rely on an advertised model height.

## Continuation: performance inside the authored location

The <take> is a deterministic function of <time>, separate from the editable
<workspace snapshot>. Its entities are the cashier, customer, baby, native apple,
authored buggy, duck, checkout and camera shot. [Play], [pause] and [seek] evaluate
the same state. [Leave film] restores the pre-take actor positions and joints;
performing does not silently overwrite the user's scene.

The play pattern carries forward the earlier short: a routine scan establishes a
rule; the duck violates it; rotation and repetition fail; the baby supplies a squeak;
the cashier mistakes squeezing for a general method and crushes the next apple.
The actor has an observable problem and changes procedure. Cameras cut between
action, observation and consequence. They hold still long enough for the change to
be read. An exterior establishes the authored building before the counter sequence.

Native readymades provide the set, checkout, apple and buggy. The earlier short's
authored duck is retained as a performance prop. No new primitive architecture is
introduced. The cast uses the existing Butter skeletons; the cashier faces the
customer, and the baby is supported in a buggy. Hand contact uses the real hinge
and hand frame. Where a hinge cannot reach a target, reposition the actor or prop
within the counter geography rather than silently stretching the arm.

The original 48-second soundtrack is retained and clocked from the same take time.
Seeking pauses audio; playing resumes at the displayed time. Backgrounding pauses
both. No automatic audio playback occurs on page load. Shots share the cashier–
customer axis; portrait display fits a 16:9 film frame without cropping its action.
Titles are confined to the opening and closing intervals. Editing controls do not
cover the film frame.

Upper floors and foreground camera walls may be hidden during a shot, as declared
virtual-set cutaways. These visibility changes do not edit the native MPD. The
exported video and interactive take must evaluate the same scene, camera, action
and title at the same times. Validation covers reversible mode changes, backward
seeking, pause/resume, prop contact, framing, sound duration and output video streams.
This is animation blocking, not a physical connection or grip-force simulation.

## Contact and cutaway repair after visible failure

The rendered take failed the user's practical acceptance condition: hand, prop and fixture occupy the same space. Source preservation and deterministic playback are distinct from geometric clearance and construction validity. Neither previous test establishes those properties.

<desired-pose>, <accepted-pose>, <fixture>, <contact-envelope> and <validation-report> must remain distinct. [Propose pose] must be followed by [Check clearance] before [Display]. Camera access must hide whole native leaf instances rather than slice uncapped triangles. Transparent fixtures remain obstacles. Changes to the set invalidate a cached clearance result. Conservative geometric envelopes can establish separation within their scope but cannot certify studs, clutch, insertion order, strength, balance or a legal LEGO grip. An unresolved intersection must be reported, not renamed stylization.


### Implemented acceptance boundary

The contact reviewer samples 577 proposed poses over 48 seconds. It compares cast/prop AABBs to a BVH of visible native triangles, with transparent glass retained as an obstacle; buggy and display geometry are included. It separately reports overlapping hand/prop envelopes as unresolved grips. These conservative tests are a rejection mechanism, not an exact solid-intersection or force solver. Self-collision, solid containment, continuous swept motion, support and connection legality remain unverified. Playback and frame export reject a failed report. The batch renderer also checks before resuming cached frames and binds any newly generated frame cache to the player's SHA-256. Inspection remains reversible; it does not silently rewrite the desired animation or certify it.

## Playable shopping task, before implementation

<purpose>: a player fulfills a shopping list in the existing authored shop, then commits a checkout. <entities>: three native stock instances, a persistent inventory, a visitor, native obstacle envelopes, a checkout, an accepted-action journal and a replay. [Move] uses the same bounded collision-tested movement for human play and automation. [Collect] requires an uncollected instance within reach and line of sight; it removes that exact visible instance and adds one inventory entry. [Checkout] requires the complete list and presence at the register; it creates one receipt. [Replay] reads the recorded accepted state transitions and camera path, never inventing successful pickups.

The desired list, available stock and acquired inventory remain distinct. Collection order is free. Repeated pickup and checkout are idempotently refused. Restart restores stock. Leaving the level restores the editable scene. Saving preserves progress. A blocked path does not count as movement. The first list uses actual acquired donor foods: croissant (bread), banana and carrot with its top. Inventory transfer is a game action, not a simulated hand grasp. Collision envelopes constrain navigation; they do not certify the source building structurally. The old failed character take stays archived, not promoted as this run's film.

## Shopper and detective: two operators, two norms (23 September 2026)

The supplied shopping-list working paper motivates a two-role game. The shopper's list specifies the intended basket. Maggie's notebook describes witnessed events; copying the shopper's intention into that notebook would erase Anscombe's distinction. The host owns inventory and checkout. A guest may move and write observations, never mutate stock. Movement requests are bounded and checked against the same environment. Pickups are broadcast as observations only when the detective has line of sight and is nearby; the final receipt may then expose omissions and mistaken notes. A notebook is editable, not an automatically perfect transcript.

PeerJS supplies signaling and a WebRTC data channel, not a structural LEGO solver, a game server, or guaranteed connectivity on every mobile network. A QR code must encode a reachable hosted URL; a file URL or localhost cannot honestly be advertised as a phone invitation. Session tokens separate rooms; the host validates commands and disconnects extra guests. This prototype trusts the host, and is not an anti-cheat or financial transaction system.

LLM operators must use the same accepted actions as humans. Their log records commands, short public reasons, returned observations and outcomes, not hidden chain of thought. Scripted navigation may implement a requested destination, but must never be labelled an LLM decision. The video essay must identify whether its actual run used human, scripted or LLM operators, and distinguish observed completion from structural validation. A configured API adapter is capability, not evidence of a run.

## Correction: visual play is not an event-fed transaction test

The September 23 transaction demonstration did not test visual grocery finding or observation. `go(item)` knew item coordinates; `follow` knew the shopper's position; the detective was told pickup IDs, and the facilitator paused the shopper at each item. Agreement under those conditions is not evidence that the detective recognized a purchase. Retain the recording as an assisted integration test, not as the requested perception experiment.

The revised arena restores the original Marge, Maggie and cashier models. Human play needs visible characters, legible facing and feedback for selecting and carrying a grocery. A chase camera must not use through-wall views as an agent's evidence. The visual agent surface exposes a rendered role-specific image, the shopper's own goal and inventory or the detective's own notebook, and bounded move/turn/interact actions. It must not expose native stock coordinates, target IDs for automatic navigation, the partner's position, a pickup event feed, or the partner's inventory. A separate evaluator retains ground truth and compares notes only after the run.

A real test requires uncoordinated observation opportunities, ambiguous/occluded views, and recorded screenshots for every model decision. Success and failure must both be retained. Implementing this interface does not itself constitute a passed visual test. Fun remains a playtest question: short movement loops, visible characters, aiming at a shelf object, reversible choices and a clear checkout goal provide concrete mechanics to assess rather than a claim that the game is now fun.

## Shared embodied manipulation, before implementation

The user's Build-hand reference changes the transaction boundary. A vegetable should not become acquired merely because the actor is nearby. Required states are shelf → reachable → grasped by a named hand → carried → released into checkout. Human webcam/pointer inputs and machine reach/grip commands must call one controller. Body orientation defines forward, lateral and vertical axes; the camera supplies a view, never the hand's coordinate system. Left and right remain attached to the same shoulders through camera rotation.

The existing Build controller selects editable architecture batches. Directly applying it to the shop would pick up a crate or floor containing many objects. The already extracted native stock occurrences must become the graspable identities. Reuse hand tracking, pinch hysteresis, open/release and loss-of-tracking conventions; do not reuse arbitrary build-object translation as an unlimited arm.

Native minifig arms are rigid hinged pieces, not elastic human arms. Measure shoulder-to-grip range and reachable shelf surfaces before choosing target limits. If original fixture placement is unreachable, adapt the native display subassembly or placement and preserve provenance; do not silently stretch the arm or claim success through a wall. Grasp acceptance requires actual grip proximity and clearance. Carrying updates the same native instance from the accepted grip transform; release requires support or an explicit valid checkout receiver. The detective sees those rendered operations rather than receiving their item names.


### Hand-controller contact scope

A rigid native shoulder hinge defines the arm path. Pixel aiming minimizes distance along that hinge arc; it may orient toward an unreachable point, but cannot acquire the object unless the actual grip is within three scene units of its native surface. Seven offset rays sample the arm envelope. Carried native triangles are checked for surface crossings against a BVH of fixture triangles; coplanar contact is permitted. These checks do not establish solid containment, continuous collision freedom, finger closure, clutch, or structural soundness. The first successful banana grasp required backing away, raising the arm, then approaching; straight withdrawal from the crate was rejected. A complete lift, carry, deposit and checkout remains a separate acceptance test.


### Checkout inventory boundary

The register receives one physically carried item at a time. After a supported hand release onto the native desk, the item enters the checkout basket represented by the checklist and is removed from the 3D work surface. This is an explicit game inventory transition, not a simulated cashier, bag, or rigid-body pile. It keeps the small native register usable for the next item. Payment remains a separate action requiring all three deposited goods and the shopper at the register.

## Human grab repair · 23 September

The earlier scripted route did not establish usable human control. A rigid shoulder aimed at the exact clicked surface point often cannot reach it, even when another point on the same food is reachable. <food> selection must choose a reachable contact on that native surface, preserve fixture checks, and visibly distinguish [select], [reach], [grasp] and [place]. A tap on reachable food performs reach and grasp; an unreachable selection reports the missing distance. The same pixel action is available to human and machine. <gait> must follow actual displacement, animate the native leg geometry, and preserve held-arm poses. No motion against an obstacle should advance the walk cycle.

Human reach uses a bounded lateral shoulder angle (up to 0.65 radians) as well as the forward hinge. This is virtual character articulation of the native rigid arm, without stretching its geometry; it is not a claim that a physical LEGO shoulder has that joint freedom.

The carrot stood beyond a comfortable frontal reach at the navigation boundary. Move its native instance two world units toward the aisle on the existing native tile cap. This is an authored display adaptation, not an increase to the grasp-distance threshold.

The center of the C-hand is empty space. Grasp acceptance now also checks vertices of the actual native hand against native food triangles, with a 1.5-unit surface tolerance. This prevents the old center-point test from rejecting visible hand contact.

The old navigation cylinder used an 18-unit radius through the entire figure, including the hair clearance at shelf height. Use a 12-unit body radius and retain a 15-unit upper-head clearance for tall obstacles. This lets the body approach the display while keeping fixture checks; it remains an approximate navigation envelope.

## Door and exterior continuation

A <door> is a native panel mounted on its source hinge, with [open] and [close] changing both visible geometry and navigation obstacles. The shopper uses the same attached hand to reach the panel; a screen tap or machine pixel action chooses it. The frame remains fixed. <outside> remains part of the acquired base and pavement. Paid shopping must not disable walking. Door angles and the exit event belong in the saved run and replay. Near a low doorway, Marge must visibly duck her upper body rather than pass her hair through the lintel. Door sweep checks are game approximations, not structural certification.
