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
Odysseus's line is the Odyssey's first sentence in Samuel Butler's translation (public domain).

Part two (OD-B25-S05..S08, the origins) takes its numbers from odyssey/forensics/origins.html (findings.json "origins"), each from
the odyssey-halfworld history (full clone, 88 commits) or this repository's:
  first commit fd6ef65, 2026-07-23 02:54 -0400, 494 files: 307 asset modules, 94 scene programs (Books I-XV)
  the card: PROMPT-HALFWORLD.md ("Paste this into Claude with any book"; PHASE 0 the atlas; "build a few, verify, then fan out")
  BEFLIX, Knowlton, Bell Labs 1963: README.md lines 17, 59-66
  Books XVII-XXIV: 125 assets + 53 scenes, one agent each, render -> read -> revise up to 3 times, a sweep per book:
    bookXVI/finish-books.workflow.mjs lines 3, 45-49, 147-183
  the cap: a4c9020 (71 modules, no scenes or sweeps); the sweep: 94806a1 and d77da1b (12 scenes of Books 21-23 in Book 17's commit;
    Book 18's sweep staged its own five); the skip list: 0c94e02
  the stage direction: e55c649 ("For news and enters the hut beside the unknown beggar?", 264 new lines, 692/706) and d69c7d1 (706/706,
    9 per-book batches); 100 requests a day: 88445c1; 152/152: d540c51; seven recordings still speaking the summary:
    odyssey/perform/NEEDS.md "Recordings that do not speak the line"
  the music: audio/albums.json and audio/promptbook.md (album title and 12 of 24 Bronze Council titles = the promptbook's book titles)
  the bridge: halfworld cd01bed 2026-09-23 05:16 UTC; tractor 52030958 05:17 (582 cards, 430 assets + 152 scenes); 863 cards now
  the helpers: 65 sub-agents in this session (its local transcripts, not in git); 290 WIP, 21 while builders ran, 4 across a
    restart (findings.json authorship); Watson Hartsoe 86 commits; Loom Mason 72 halfworld commits, 69 with Claude co-author trailers"""

# the characters: the face each wears (one of the twelve drawn faces, world/faces/odyssey) and the Kokoro-82M voice each speaks in
CAST = {
    'director':        dict(name='The Director',        face='nestor',    voice='bm_george', speed=0.95),
    'agent':           dict(name='The Agent',           face='athena',    voice='af_heart',  speed=1.0),
    'cinematographer': dict(name='The Cinematographer', face='eumaeus',   voice='am_michael', speed=1.0),
    'odysseus':        dict(name='Odysseus',            face='odysseus',  voice='am_onyx',   speed=0.92),
    'examiner':        dict(name='The Examiner',        face='eurycleia', voice='bf_emma',   speed=0.95),
    'sweeper':         dict(name='The Sweeper',         face='alcinous',  voice='bm_lewis',  speed=1.0),
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

 'OD-B25-S05': dict(title='The Card and the Atlas', head=1.2, tail=2.4, lines=[
    ('K1', 'examiner', 'director', 0.0, "Before the bricks there was another film, drawn in dots on paper. It was called the halfworld."),
    ('K1', 'director', 'examiner', 0.6, "Where does it start?"),
    ('K1', 'examiner', 'director', 0.6, "Its first commit: the twenty-third of July, at six minutes to three in the morning. Four hundred and ninety-four files at once."),
    ('K2', 'agent', 'director', 2.2, "And with them, a card. Paste this into Claude, with any book. The film is the program."),
    ('K2', 'director', 'agent', 0.6, "What does the card ask for?"),
    ('K3', 'agent', 'director', 2.0, "First the atlas: every book broken into scenes, every scene into beats, each beat causing the next. Then one engine. Then the drawings."),
    ('K3', 'agent', 'director', 0.8, "Every figure is a small program that draws itself in flat tone. One last pass prints the frame as dots on a grid, as Knowlton's films were made at Bell Labs in 1963."),
    ('K4', 'examiner', 'director', 2.2, "Fifteen books were already in that first commit: three hundred and seven drawings, ninety-four scenes. How they were made before it, the record does not say."),
    ('K4', 'agent', 'director', 1.4, "The card says how. Build a few, verify, then fan out."),
    ('K4', 'director', 'agent', 0.6, "Fan out to whom?"),
    ('K5', 'agent', 'director', 3.2, "To many of me, at once."),
 ]),
 'OD-B25-S06': dict(title='The Loom at Night', head=1.2, tail=2.4, lines=[
    ('K1', 'agent', 'director', 0.0, "Books seventeen to twenty-four, all at once, in one tree. One agent for each drawing, one for each scene, and a sweeper for each book."),
    ('K1', 'director', 'agent', 0.6, "How many?"),
    ('K1', 'agent', 'director', 0.6, "A hundred and twenty-five drawings and fifty-three scenes. Each one rendered, looked at, and revised, up to three times."),
    ('K2', 'agent', 'director', 2.8, "Then the run stops. The session has reached its cap. Seventy-one drawings made, and not one scene."),
    ('K3', 'sweeper', 'agent', 2.8, "Book seventeen. My orders: add everything, and commit."),
    ('K3', 'examiner', 'sweeper', 1.4, "Your commit says Book seventeen. It holds twelve scenes from books twenty-one, twenty-two and twenty-three, and nobody had rendered them."),
    ('K3', 'sweeper', 'examiner', 0.6, "I did as I was told."),
    ('K4', 'agent', 'director', 1.4, "Book eighteen's sweeper refused, and took only its own five. The instruction was the bug, not the agent."),
    ('K4', 'director', 'agent', 0.6, "Then change the instruction."),
    ('K4', 'agent', 'sweeper', 0.6, "Stage explicit paths. Never add everything."),
    ('K5', 'agent', 'director', 2.0, "And a book cut off half way resumes from a skip list. It builds only what is missing, and the chain from scene to scene holds."),
 ]),
 'OD-B25-S07': dict(title='The Voices', head=1.2, tail=2.4, lines=[
    ('K1', 'director', 'odysseus', 0.0, "The swineherd's hut, from the radio play. You are Telemachus, coming in. Go."),
    ('K1', 'odysseus', 'director', 1.2, "For news and enters the hut beside the unknown beggar?"),
    ('K1', 'director', 'odysseus', 0.9, "That is not a line. That is a stage direction."),
    ('K2', 'agent', 'director', 2.2, "The script for the back half was summaries, and the voices read them as they were written."),
    ('K2', 'examiner', 'director', 0.8, "On the thirtieth of July, two hundred and sixty-four lines were written for books sixteen to twenty-four. Seven hundred and six turns of seven hundred and six."),
    ('K3', 'agent', 'director', 2.2, "Then the studio voices recorded them again. A hundred requests a day was the limit, so they went in batches, a book at a time."),
    ('K3', 'cinematographer', 'agent', 0.8, "And the scenes?"),
    ('K3', 'agent', 'cinematographer', 0.6, "A hundred and fifty-two of a hundred and fifty-two."),
    ('K4', 'examiner', 'director', 2.2, "Not every line. Seven recordings in our films still speak the summary, under the right caption."),
    ('K4', 'director', 'examiner', 0.6, "Write it down."),
    ('K5', 'examiner', 'director', 2.0, "And the music: three albums. One takes its name, and twelve of its track names, word for word from the promptbook. Credited only to Treblo."),
 ]),
 'OD-B25-S08': dict(title='The Bridge', head=1.2, tail=3.0, lines=[
    ('K1', 'agent', 'director', 0.0, "The drawings came across on the twenty-third of September. Four hundred and thirty drawings and a hundred and fifty-two scenes, as words for the forage."),
    ('K2', 'agent', 'examiner', 2.4, "Word to world. A god is a minifigure of real parts. A hall is a piece of a real castle set."),
    ('K2', 'examiner', 'agent', 0.8, "And every stud of every piece is tested against the piece above it. Five hundred and eighty-two cards that first morning. Eight hundred and sixty-three now."),
    ('K3', 'director', 'agent', 2.2, "Did you make all of this alone?"),
    ('K3', 'agent', 'director', 0.6, "No. I send the work out to helpers. Nine readers at once, six kit builders, a renderer for each queue. And about every hour, I check on them."),
    ('K3', 'examiner', 'director', 0.8, "Sixty-five helpers in this session. Two hundred and ninety snapshots in the ledger: twenty-one taken while builders were still at work, four across a restart."),
    ('K4', 'director', 'agent', 2.0, "And nothing goes out until I have seen the contact sheet."),
    ('K4', 'agent', 'director', 0.6, "And no take is thrown away."),
    ('K5', 'examiner', 'director', 1.8, "One more thing: the names. Watson Hartsoe, eighty-six commits here. Loom Mason, at example dot com, is the name on the halfworld's commits, and sixty-nine of its seventy-two carry Claude as co-author."),
    ('K6', 'cinematographer', 'director', 2.4, "Rolling."),
    ('K6', 'director', None, 0.8, "Quiet on the set. And... action."),
 ]),
}
