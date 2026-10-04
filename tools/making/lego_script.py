"""The making-of LEGO film's script: who says what, on which keyframe key, after how long a pause. Read by tools/making/voices.py
(the voices, the take) and by the director's modules (tools/perform/scenes/OD-B25-S0N.js read the take, not this file).

Every number the examiner and the crew say is from the forensic report (odyssey/forensics/findings.json, generated at 0c780fb2):
  638 commits on the branch; 541 (85%) authored as Claude                  authorship.commits, by_author.Claude
  290 "Work in progress" commits, 149 of them on 2026-09-30                 authorship.work_in_progress, wip_by_day
  41.8 h of rendering logged, 31,810 frames drawn, 2,548 reused             compute.wall_hours_all, frames_drawn, frames_kept_resumed
  4 CPUs, SwiftShader software GL, a median 3.79 s a frame                  compute.machine, median_s_per_frame
  the player bundle's largest version 90,157,621 bytes; the patch refuses   objects_all_refs.bundle_max; film-readymades/patch_motion.py
  one of 95 MB; GitHub refuses a file over 100 MB; about 6 MB since the     (assert mb < 95); bundle_after_split
  split (feb5f60e)
  70 of 70 published and kept films match their hash                        the report's Integrity paragraph (manifest.json)
  16 scenes re-shot, 33 takes                                               films/odyssey/takes/index.json before the making-of's entry
  the music credited only as "Treblo", no generator or licence found         voices.music
Odysseus's line is the Odyssey's first sentence in Samuel Butler's translation (public domain)."""

# the characters: the face each wears (one of the twelve drawn faces, world/faces/odyssey) and the Kokoro-82M voice each speaks in
CAST = {
    'director':        dict(name='The Director',        face='nestor',    voice='bm_george', speed=0.95),
    'agent':           dict(name='The Agent',           face='athena',    voice='af_heart',  speed=1.0),
    'cinematographer': dict(name='The Cinematographer', face='eumaeus',   voice='am_michael', speed=1.0),
    'odysseus':        dict(name='Odysseus',            face='odysseus',  voice='am_onyx',   speed=0.92),
    'examiner':        dict(name='The Examiner',        face='eurycleia', voice='bf_emma',   speed=0.95),
}

# (key, speaker, addressee, pause before the line in seconds, the line). A key's blocking begins with its first line; keys with no line
# of their own (the night scene's dark and its light again, the wall's split) begin at a time after another key (tools/making/keys.py)
SCENES = {
 'OD-B25-S01': dict(title='The Characters Do Nothing', head=1.2, tail=2.0, lines=[
    ('K1', 'director', 'odysseus', 0.0, "Quiet on the set. And... action."),
    ('K1', 'director', 'cinematographer', 4.0, "Cut. We have a set built of real bricks. We have voices, and faces that move their lips. And the characters do nothing."),
    ('K1', 'cinematographer', 'director', 0.6, "Nobody turns. Nobody moves."),
    ('K2', 'director', 'agent', 2.2, "Can you make them act?"),
    ('K2', 'agent', 'director', 0.7, "Not by moving them for the sake of it. Every movement needs a cause."),
    ('K3', 'agent', 'odysseus', 2.6, "First the voice: what is said. Then the intent: what he wants. Then the body that carries it out: the head, the arms, the weight."),
    ('K3', 'agent', 'director', 0.8, "And if he stands still, he stands still for a reason."),
    ('K4', 'director', 'odysseus', 2.0, "Again. Action."),
    ('K4', 'odysseus', None, 1.2, "Tell me, O Muse, of that ingenious hero who travelled far and wide after he had sacked the famous town of Troy."),
    ('K5', 'director', 'agent', 1.0, "He turned to the horse. Why?"),
    ('K5', 'agent', 'director', 0.6, "Because the line names Troy. Ask the engine why any figure moves, and it tells you the cause."),
 ]),
 'OD-B25-S02': dict(title='The Camera and the Night', head=1.0, tail=2.0, lines=[
    ('K1', 'cinematographer', 'director', 0.0, "Rolling."),
    ('K1', 'director', 'agent', 1.6, "What am I looking at?"),
    ('K1', 'agent', 'director', 0.6, "Wool. The camera is inside the ram."),
    ('K2', 'cinematographer', 'agent', 1.0, "The ram was the hottest thing in the scene. I went where the heat was."),
    ('K2', 'agent', 'cinematographer', 0.6, "Then test every camera against the set before you roll. Is the lens inside something? Is every face in the frame, and seen?"),
    ('K3', 'cinematographer', 'director', 2.4, "Out of the wool. Off his shoulder. Both of them in the frame."),
    ('K3', 'director', 'cinematographer', 0.6, "Good. Shoot the scene."),
    ('K4', 'agent', 'odysseus', 3.0, "Night. Four processors, and no graphics card. Every frame drawn in software, one at a time: almost four seconds a frame."),
    ('K4', 'odysseus', 'agent', 0.8, "How many frames?"),
    ('K4', 'agent', 'odysseus', 0.6, "Twelve for every second of film. Seven hundred and twenty for a minute."),
    ('K4', 'odysseus', 'agent', 2.8, "The lights."),
    ('K4', 'agent', 'odysseus', 0.8, "The container has restarted."),
    ('K4', 'agent', 'odysseus', 2.4, "Nothing is lost. Every frame is kept as it is drawn, so the render goes on from where it stopped."),
 ]),
 'OD-B25-S03': dict(title='The Wall and the Takes', head=1.4, tail=2.0, lines=[
    ('K1', 'director', 'agent', 0.0, "What is that?"),
    ('K1', 'agent', 'director', 0.6, "The player. Every set, every figure, every brick of geometry, packed in one file. Ninety megabytes."),
    ('K1', 'cinematographer', 'agent', 0.6, "And the wall?"),
    ('K1', 'agent', 'cinematographer', 0.6, "Ninety-five. A bigger player is refused, and the host takes no file over a hundred."),
    ('K2', 'agent', 'director', 2.6, "So it is split. Each location's geometry goes beside the player, in a file of its own, fetched when the scene loads."),
    ('K2', 'agent', 'director', 0.8, "The player is six megabytes now."),
    ('K3', 'agent', 'director', 2.4, "The raft is shot again, and the new take is better. I'll put it over the old one."),
    ('K3', 'director', 'agent', 0.5, "Stop. Keep both."),
    ('K4', 'director', 'agent', 1.6, "Keep every take. I want to see how it got there."),
    ('K4', 'agent', 'director', 0.6, "Then nothing is overwritten. The old take goes on the shelf, with a note of what the next one changed, and why."),
    ('K4', 'cinematographer', 'director', 0.8, "Sixteen scenes shot again. Thirty-three takes."),
 ]),
 'OD-B25-S04': dict(title='The Ledger', head=1.4, tail=3.0, lines=[
    ('K1', 'examiner', 'director', 0.0, "I have read the ledger, every commit of it."),
    ('K1', 'examiner', 'director', 0.8, "Six hundred and thirty-eight commits on the branch. Five hundred and forty-one of them, eighty-five percent, by the agent."),
    ('K1', 'examiner', 'agent', 0.8, "Two hundred and ninety are snapshots, marked work in progress. A hundred and forty-nine of them in a single day."),
    ('K2', 'examiner', 'director', 2.4, "Forty-one point eight hours of rendering are logged. Thirty-one thousand, eight hundred and ten frames drawn, and two thousand, five hundred and forty-eight reused after an interruption."),
    ('K3', 'examiner', 'director', 2.4, "Every film, published and kept, was checked by its hash. Seventy of seventy match."),
    ('K4', 'examiner', 'director', 1.6, "One gap. The music under the scenes is credited only as Treblo. I found no maker, and no licence."),
    ('K4', 'director', 'examiner', 0.6, "Then the report says so."),
    ('K5', 'director', 'agent', 1.4, "And the first film about all this was a slide show."),
    ('K5', 'agent', 'director', 0.6, "Pictures of the work, and one voice over them."),
    ('K5', 'director', 'agent', 0.7, "No slides. Make it a film. With bricks, and with us in it."),
    ('K6', 'cinematographer', 'director', 2.6, "Rolling."),
    ('K6', 'director', None, 0.8, "Quiet on the set. And... action."),
 ]),
}
