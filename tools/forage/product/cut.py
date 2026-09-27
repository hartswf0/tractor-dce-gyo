#!/usr/bin/env python3
"""tools/forage/product/cut.py — THE REGULARS' CUT of the halfworld Odyssey film.

  python3 tools/forage/product/cut.py [--halfworld /path/to/odyssey-halfworld] [--target 84]

"This movie is long, can't bore the regulars." The film's clock is the sum of 152 studio voice recordings (164.6 min). This computes a
75-90 minute cut out of those recordings and nothing else: whole scenes, and inside a kept scene whole voice segments (a segment is
never cut mid-line), in story order. It writes

  odyssey/kits/cut.json   the edit decision list. Every kept segment carries the voice-manifest `gi` and its `start`/`dur` inside
                          the scene's own recording (drive/voice/<scene>.m4a), plus `at`, its place on the cut's clock, so the
                          halfworld audio master (harness/build-film-audio.mjs) can assemble it with the same segment numbering.
  odyssey/kits/cut.html   the page: the numbers, the timeline of both films, the scene list, the bridges, what the regulars lose.

THE PRINCIPLES (each is a rule below, and each is checked on the result):
  1. Open strong and fast: the council, the stranger at the gate, then Odysseus. The Ogygia block (Hermes, Calypso, Odysseus on the
     shore, B05-S01..S03) is intercut straight after Book I — in the poem's own time it happens while Telemachus sails, and the council
     has just sent Hermes — so Odysseus is on screen in minutes instead of after 36.
  2. Every three to four minutes a set piece or a turn (MAX_LULL): measured as the time between the end of one event scene and the
     start of the next.
  3. No more than two talk-only scenes in a row (MAX_TALK_RUN).
  4. Every recognition and the summit are kept (RECOGNITIONS, TURNS).
  5. The tales (IX-XII) are the action spine: their floors are higher (FLOOR) and their book weight is raised (BOOK_WEIGHT).
  6. The homecoming accelerates into the bow and the hall: Books XIII-XX are trimmed hardest, XXI-XXII least.
  7. A short end: Book XXIV keeps the orchard recognition and the peace, nothing else.

Nothing is hand-timed. The hand-authored inputs are the tables at the top — NECESSITY (story necessity, 0-3, with a note), the
recognitions and turns, the one intercut move, and the bridges — and every one of them is marked as authored on the page.
"""
import glob, html, json, math, os, re, struct, sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitpages import STYLE, HEAD, ROMAN, E, SCENES as KIT_SCENES, ROOT

HW = os.environ.get('HALFWORLD', '/home/user/odyssey-halfworld')
if '--halfworld' in sys.argv: HW = sys.argv[sys.argv.index('--halfworld') + 1]
OUT_JSON = os.path.join(ROOT, 'odyssey/kits/cut.json')
OUT_HTML = os.path.join(ROOT, 'odyssey/kits/cut.html')

# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE RULES — every number the cut is made of. Change them here and run again.
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
TARGET_MIN = 84.0            # the runtime the segment trimmer aims at (minutes)
if '--target' in sys.argv: TARGET_MIN = float(sys.argv[sys.argv.index('--target') + 1])
RANGE_MIN = (75.0, 90.0)     # the brief's window; the run fails loudly outside it
MAX_LULL = 240.0             # seconds: the longest a regular waits between set pieces / turns
MAX_TALK_RUN = 2             # talk-only scenes allowed in a row

# the clock of the cut: how the kept segments are laid end to end
BREATH = 0.45                # s of silence between two kept segments inside a scene (the full film averages 0.37 s)
SCENE_PAD = 1.2              # s at each scene seam (picture lead-in + tail)
KEEP_HEADERS = False         # "Scene three. The Stranger at the Threshold." — the title card carries this; 17.9 min in the full film
KEEP_SPEAKER_CUES = False    # the narrator saying "Zeus" before Zeus speaks; the picture already shows who speaks; 6.4 min

# scene score = sum of weight * component (each component is 0..1), minus the talk penalty
W = dict(necessity=3.0, spectacle=2.0, priority=1.5, production=0.8, talk=1.2)
KEEP_SCORE = 1.5            # a scene that is not a must-keep is kept at or above this
SET_PIECE_SPECTACLE = 0.50   # spectacle component at or above this makes a scene a set piece (an "event" for the lull rule)

# spectacle: what the scene puts on screen that is not people talking (atlas asset types), plus the film's own chosen images
SPECTACLE_TYPES = {'CREATURE': 1.0, 'SET_PIECE': 1.0, 'ENVIRONMENT': 0.8, 'DIVINE_FX': 0.5, 'VEHICLE': 0.6}
SPECTACLE_ARTIFACT = 1.2     # the scene is the home of one of the 21 performing objects (scenes/_artifacts.mjs)
SPECTACLE_SUNDANCE = 1.2     # the short film cut a cue from this scene (harness/build-sundance.mjs)
SPECTACLE_ACTION = 1.2       # * share of the scene's voice that is narrated action (AUDITORY_ACTION)
SPECTACLE_FULL = 3.2         # raw spectacle that counts as 1.0

# the film's own priorities: key beat directed by hand (_direction.mjs), a recognition beat, an artifact, a sundance cue, a kit model
PRIORITY = dict(key_beat=0.6, recognition_emotion=1.0, artifact=1.0, sundance=1.2, kit_model=0.8)
PRIORITY_FULL = 2.4
# production: already built in the LEGO line (odyssey/kits/locations.json flags)
PRODUCTION = dict(keyframes=1.0, kit=1.0, in_film=0.8)
PRODUCTION_FULL = 2.0

# the tales are the spine, the homecoming must not sag: a multiplier on the scene score by book
BOOK_WEIGHT = {**{b: 1.0 for b in range(1, 25)}, 2: 0.9, 3: 0.9, 9: 1.15, 10: 1.1, 11: 1.05, 12: 1.15, 21: 1.15, 22: 1.15, 23: 1.05,
               14: 0.9, 15: 0.8, 17: 0.95, 18: 0.9, 20: 0.95, 24: 0.9}

# segments: value = kind weight * act weight + bonuses; the trimmer drops the lowest value per second first
KIND_W = {'DIALOGUE': 1.0, 'AUDITORY_ACTION': 0.95, 'NARRATION': 0.6, 'SPEAKER_CUE': 0.0, 'SCENE_HEADER': 0.0}
ACT_W = defaultdict(lambda: 0.8, {
    'REVEAL': 1.5, 'PROPHECY': 1.4, 'VOW': 1.3, 'BOAST': 1.3, 'TAUNT': 1.3, 'THREAT': 1.3, 'SUPPLICATION': 1.3, 'LAMENT': 1.2,
    'CHALLENGE': 1.2, 'COMMAND': 1.15, 'CONDEMN': 1.1, 'DECLARE': 1.05, 'PROMISE': 1.05, 'WARN': 1.05, 'MOCK': 1.0, 'SONG': 1.0,
    'PRAYER': 1.0, 'DIRECT': 1.0, 'REFUSE': 1.0, 'ACCUSE': 1.0, 'EMBODIED_ACTION': 1.0, 'INVOKE': 1.0, 'URGE': 0.95,
    'QUESTION': 0.75, 'ASSERT': 0.8, 'NARRATE': 0.75, 'RECOUNT': 0.6, 'EXPLAIN': 0.6, 'REPORT': 0.6, 'REPLY': 0.7, 'INSTRUCT': 0.7})
SEG_BONUS = dict(key_beat=1.2, sundance=1.5, exit=0.5, opening_action=0.35, opening_line=0.4, odysseus=0.15)
LEN_EXP = 0.75               # value per second = value / dur**LEN_EXP: long speeches pay a little more than their length
# how dearly a book holds on to its lines when the trimmer comes: < 1 is trimmed first (the Telemachy, the long middle on Ithaca),
# > 1 last (the tales, the bow and the hall). Multiplies each segment's value per second.
BOOK_HOLD = {**{b: 1.0 for b in range(1, 25)}, 1: 0.9, 2: 0.7, 3: 0.65, 4: 0.8, 5: 0.95, 6: 0.9, 7: 0.85, 8: 0.85,
             9: 1.25, 10: 1.2, 11: 1.1, 12: 1.25, 14: 0.8, 15: 0.75, 16: 0.9, 17: 0.9, 18: 0.8, 19: 0.95, 20: 0.8,
             21: 1.3, 22: 1.3, 23: 1.1, 24: 0.8}
EXIT_PROTECT_MAX = 30.0      # the scene's last turn is protected (never trimmed) when it is no longer than this
# the least of a kept scene's voice (share of its content seconds) the trimmer may leave, by kind of scene
FLOOR = dict(event=0.62, tales=0.55, talk=0.30, other=0.40)
FLOOR_LULL = 0.20            # the floor for talk scenes inside a lull the rule found too long

# THE ONE MOVE (principle 1): these scenes are played right after `after`, and the rest stays in id order
MOVES = [(['OD-B05-S01', 'OD-B05-S02', 'OD-B05-S03'], 'OD-B01-S06')]

# the recognitions (principle 4) and the turns: must-keeps, and events for the lull rule
RECOGNITIONS = {
    'OD-B04-S02': 'Helen and Menelaus know the son by his father\'s face',
    'OD-B04-S03': 'Helen: the beggar in Troy she alone knew',
    'OD-B07-S04': 'Arete knows the clothes her own women wove',
    'OD-B08-S05': 'he weeps at his own story and is asked his name',
    'OD-B09-S01': '"I am Odysseus, son of Laertes"',
    'OD-B13-S03': 'goddess and man know each other; Ithaca revealed',
    'OD-B16-S03': 'the father reveals himself to the son',
    'OD-B17-S03': 'Argos knows his master and dies',
    'OD-B19-S04': 'Eurycleia finds the scar',
    'OD-B21-S04': 'the scar shown to the herdsmen',
    'OD-B22-S01': 'he throws off the rags: the suitors know him',
    'OD-B23-S04': 'THE SUMMIT: the bed, and Penelope knows him',
    'OD-B24-S04': 'the scar and the orchard trees: Laertes knows his son',
}
TURNS = {'OD-B21-S07': 'THE TURN: the bow sings', 'OD-B23-S04': 'THE SUMMIT', 'OD-B01-S01': 'the council turns to Odysseus',
         'OD-B05-S03': 'Odysseus, first seen', 'OD-B13-S01': 'home, asleep, on Ithaca'}
SUMMIT, TURN = 'OD-B23-S04', 'OD-B21-S07'

# STORY NECESSITY — authored (0 = digression, 1 = colour, 2 = strong, 3 = the story breaks without it), with the reason.
NECESSITY = {
 'OD-B01-S01': (3, 'the premise: the gods turn to Odysseus'), 'OD-B01-S02': (3, 'two roads: free the father, wake the son'),
 'OD-B01-S03': (3, 'the stranger at the gate; the suitors eating the house'), 'OD-B01-S04': (1, 'Mentes questions the prince: exposition'),
 'OD-B01-S05': (2, 'Athena gives the boy his course'), 'OD-B01-S06': (2, 'the son overrules his mother for the first time'),
 'OD-B02-S01': (2, 'the assembly: the son claims his voice'), 'OD-B02-S02': (2, 'the loom trick, the shroud woven and unwoven'),
 'OD-B02-S03': (1, 'the eagles: an omen explained at length'), 'OD-B02-S04': (0, 'Mentor rebukes Ithaca: speech on speech'),
 'OD-B02-S05': (1, 'Athena on the shore: a second course-setting'), 'OD-B02-S06': (0, 'the stores: provisioning'),
 'OD-B02-S07': (2, 'the night launch: the son leaves'), 'OD-B03-S01': (1, 'arrival at the sacrifice'),
 'OD-B03-S02': (2, 'Nestor: the first news of the father'), 'OD-B03-S03': (1, 'the broken return: the war told again'),
 'OD-B03-S04': (0, 'Orestes as the measure: an example'), 'OD-B03-S05': (2, 'Athena reveals herself, an eagle'),
 'OD-B03-S06': (1, 'the chariot road: pure travel'), 'OD-B04-S01': (0, 'the double wedding at Sparta'),
 'OD-B04-S02': (3, 'the first recognition'), 'OD-B04-S03': (2, 'Helen\'s drug and the beggar in Troy'),
 'OD-B04-S04': (2, 'the wooden horse'), 'OD-B04-S05': (2, 'Proteus: where Odysseus is'), 'OD-B04-S06': (0, 'the gifts'),
 'OD-B04-S07': (2, 'the ambush: the house turns on the son'),
 'OD-B05-S01': (2, 'Hermes carries the decree'), 'OD-B05-S02': (2, 'Calypso must let him go'),
 'OD-B05-S03': (3, 'Odysseus, first seen, weeping on the shore'), 'OD-B05-S04': (3, 'the raft'), 'OD-B05-S05': (3, 'Poseidon breaks the sea'),
 'OD-B05-S06': (3, 'the river takes the castaway'), 'OD-B06-S01': (1, 'the dream of Nausicaa'), 'OD-B06-S02': (1, 'laundry and ball'),
 'OD-B06-S03': (3, 'the naked stranger and the princess'), 'OD-B06-S04': (1, 'bath and the road to town'),
 'OD-B07-S01': (1, 'the hidden walk through Scheria'), 'OD-B07-S02': (1, 'the palace and the golden dogs'),
 'OD-B07-S03': (2, 'supplication at the queen\'s knees'), 'OD-B07-S04': (2, 'Arete knows the clothes'),
 'OD-B08-S01': (1, 'the ship promised'), 'OD-B08-S02': (1, 'Demodocus: the quarrel'), 'OD-B08-S03': (1, 'the games: the stranger insulted'),
 'OD-B08-S04': (0, 'the song of Ares and Aphrodite'), 'OD-B08-S05': (3, 'the horse song; he weeps; "tell us your name"'),
 'OD-B09-S01': (3, 'he names himself; the tales begin'), 'OD-B09-S02': (1, 'the Cicones'), 'OD-B09-S03': (2, 'the lotus-eaters'),
 'OD-B09-S04': (1, 'goat island'), 'OD-B09-S05': (2, 'the empty cave'), 'OD-B09-S06': (3, 'the stone seals the cave'),
 'OD-B09-S07': (3, 'the first killings'), 'OD-B09-S08': (3, 'Nobody and the stake'), 'OD-B09-S09': (3, 'the blinding'),
 'OD-B09-S10': (3, 'under the rams'), 'OD-B09-S11': (3, 'the boast and the curse: the cause of everything after'),
 'OD-B10-S01': (3, 'the bag of winds'), 'OD-B10-S02': (2, 'the Laestrygonians: the fleet destroyed'), 'OD-B10-S03': (1, 'scouts on Aeaea'),
 'OD-B10-S04': (3, 'Circe turns the crew to swine'), 'OD-B10-S05': (2, 'Hermes and the moly'), 'OD-B10-S06': (2, 'the spell fails on him'),
 'OD-B10-S07': (1, 'the men restored'), 'OD-B10-S08': (2, 'the road to the dead'),
 'OD-B11-S01': (3, 'the blood pit opens'), 'OD-B11-S02': (1, 'Elpenor asks for burial'), 'OD-B11-S03': (3, 'Tiresias names the cost'),
 'OD-B11-S04': (3, 'his mother, three embraces'), 'OD-B11-S05': (0, 'the catalogue of heroines'), 'OD-B11-S06': (1, 'Agamemnon\'s warning'),
 'OD-B11-S07': (2, 'Achilles: rather a slave alive'), 'OD-B11-S08': (0, 'judges and punishments'),
 'OD-B12-S01': (0, 'Elpenor\'s funeral'), 'OD-B12-S02': (2, 'Circe maps the dangers'), 'OD-B12-S03': (3, 'the Sirens'),
 'OD-B12-S04': (3, 'Scylla and Charybdis'), 'OD-B12-S05': (2, 'the island of the Sun'), 'OD-B12-S06': (3, 'the cattle slaughtered'),
 'OD-B12-S07': (3, 'Zeus destroys the last ship'),
 'OD-B13-S01': (3, 'carried home asleep'), 'OD-B13-S02': (2, 'he wakes and does not know Ithaca'), 'OD-B13-S03': (3, 'the Cretan lie meets its match'),
 'OD-B13-S04': (1, 'the treasure hidden'), 'OD-B13-S05': (3, 'Athena makes the beggar'),
 'OD-B14-S01': (2, 'the dogs at the swineherd\'s yard'), 'OD-B14-S02': (2, 'the swineherd mourns his master to his face'),
 'OD-B14-S03': (1, 'the Cretan tale again'), 'OD-B14-S04': (0, 'the cloak test'),
 'OD-B15-S01': (2, 'Athena wakes Telemachus'), 'OD-B15-S02': (0, 'the farewell at Sparta'), 'OD-B15-S03': (0, 'Theoclymenus'),
 'OD-B15-S04': (0, 'Eumaeus tells his own story'), 'OD-B15-S05': (2, 'the son lands in secret'),
 'OD-B16-S01': (2, 'the son reaches the hut'), 'OD-B16-S02': (0, 'news carried to Penelope'), 'OD-B16-S03': (3, 'father and son'),
 'OD-B16-S04': (2, 'the plan'), 'OD-B16-S05': (1, 'the ambush fails'), 'OD-B16-S06': (1, 'the beggar again'),
 'OD-B17-S01': (1, 'Telemachus back in the palace'), 'OD-B17-S02': (1, 'Melanthius on the road'), 'OD-B17-S03': (3, 'Argos'),
 'OD-B17-S04': (2, 'the beggar enters his own hall'), 'OD-B17-S05': (3, 'the stool thrown'), 'OD-B17-S06': (1, 'Penelope summons him'),
 'OD-B17-S07': (0, 'Eumaeus leaves'), 'OD-B18-S01': (1, 'Irus challenges'), 'OD-B18-S02': (2, 'Irus dropped: the first blow'),
 'OD-B18-S03': (1, 'the warning to Amphinomus'), 'OD-B18-S04': (2, 'Penelope before the suitors'), 'OD-B18-S05': (1, 'Melantho and Eurymachus'),
 'OD-B19-S01': (2, 'the weapons leave the hall'), 'OD-B19-S02': (1, 'Penelope begins the test'), 'OD-B19-S03': (2, 'he describes himself to his wife'),
 'OD-B19-S04': (3, 'the scar'), 'OD-B19-S05': (1, 'the boar hunt: how he got the scar'), 'OD-B19-S06': (3, 'the geese, and the contest set'),
 'OD-B20-S01': (1, 'the restless night'), 'OD-B20-S02': (1, 'thunder and the mill woman'), 'OD-B20-S03': (1, 'the herdsmen arrive'),
 'OD-B20-S04': (1, 'the ox hoof'), 'OD-B20-S05': (2, 'the hall of death: the seer sees them dead'),
 'OD-B21-S01': (3, 'Penelope brings the bow'), 'OD-B21-S02': (3, 'the contest set'), 'OD-B21-S03': (2, 'the suitors fail the bow'),
 'OD-B21-S04': (2, 'the herdsmen shown the scar'), 'OD-B21-S05': (3, 'the beggar asks for the bow'), 'OD-B21-S06': (1, 'the doors secured'),
 'OD-B21-S07': (3, 'the bow sings'), 'OD-B22-S01': (3, 'Antinous falls'), 'OD-B22-S02': (2, 'Eurymachus bargains and dies'),
 'OD-B22-S03': (1, 'the storeroom'), 'OD-B22-S04': (2, 'the suitors armed'), 'OD-B22-S05': (2, 'Athena tests the battle'),
 'OD-B22-S06': (3, 'the hall cleared'), 'OD-B22-S07': (1, 'the maids'), 'OD-B22-S08': (2, 'the house calls Penelope'),
 'OD-B23-S01': (2, 'Eurycleia wakes Penelope'), 'OD-B23-S02': (2, 'Penelope studies the stranger'), 'OD-B23-S03': (1, 'the false wedding noise'),
 'OD-B23-S04': (3, 'the bed'), 'OD-B23-S05': (1, 'the journey still owed'), 'OD-B23-S06': (0, 'departure for Laertes'),
 'OD-B24-S01': (0, 'the suitors enter Hades'), 'OD-B24-S02': (0, 'Agamemnon praises Penelope'), 'OD-B24-S03': (1, 'Odysseus tests Laertes'),
 'OD-B24-S04': (3, 'the orchard'), 'OD-B24-S05': (0, 'Laertes restored'), 'OD-B24-S06': (1, 'the families demand revenge'),
 'OD-B24-S07': (0, 'Zeus and Athena set the terms'), 'OD-B24-S08': (1, 'the last clash'), 'OD-B24-S09': (3, 'Athena makes peace'),
}

# BRIDGES — authored: where the book's own bed carries the story for a few seconds instead of a scene (a map, a voyage, a montage of
# existing plates, one line of text). A bridge plays after `after` and stands for `covers`, which must be the dropped scenes between
# `after` and the next kept scene; it is used only when `after` is kept and every scene it covers is dropped. `replaces` are scenes the
# bridge is chosen OVER: they are dropped for it even when they would score in (a bridge never replaces a must-keep). The music is the
# bed track of `book`, entered where the full film would have been playing it at the first covered scene of that book (computed).
BRIDGES = [
    dict(after='OD-B02-S02', covers=['OD-B02-S03', 'OD-B02-S04', 'OD-B02-S05', 'OD-B02-S06'], book=2, seconds=8, kind='montage',
         text='Two eagles tear the air over the assembly; the suitors laugh at the omen; by night the son takes wine and barley from the stores.'),
    dict(after='OD-B02-S07', covers=['OD-B03-S01'], book=3, seconds=6, kind='voyage',
         text='Dawn at Pylos: black bulls on the beach for Poseidon.'),
    dict(after='OD-B03-S02', covers=['OD-B03-S03', 'OD-B03-S04'], book=3, seconds=7, kind='map',
         text='The war and the broken homecomings, drawn as the map Nestor speaks from.'),
    dict(after='OD-B03-S05', covers=['OD-B03-S06', 'OD-B04-S01'], replaces=['OD-B03-S06'], book=3, seconds=9, kind='voyage',
         text='The chariot road from Pylos to Sparta: two days of dust, and a double wedding in the halls of Menelaus.'),
    dict(after='OD-B05-S06', covers=['OD-B06-S01', 'OD-B06-S02'], book=6, seconds=7, kind='montage',
         text='Athena in the princess\'s dream; the laundry at the river; a ball lost in the water wakes the sleeper.'),
    dict(after='OD-B06-S03', covers=['OD-B06-S04', 'OD-B07-S01'], book=7, seconds=7, kind='voyage',
         text='Washed and dressed, he walks into town inside Athena\'s mist.'),
    dict(after='OD-B07-S04', covers=['OD-B08-S01', 'OD-B08-S02', 'OD-B08-S03', 'OD-B08-S04'], book=8, seconds=9, kind='montage',
         text='A ship is promised. The bard sings Troy; the young men mock the stranger, and his discus flies past every mark.'),
    dict(after='OD-B09-S01', covers=['OD-B09-S02'], book=9, seconds=6, kind='voyage',
         text='Twelve ships from Troy; the raid on Ismarus, and the Cicones strike back.'),
    dict(after='OD-B10-S06', covers=['OD-B10-S07'], replaces=['OD-B10-S07'], book=10, seconds=6, kind='montage',
         text='The men restored, and a year of feasting in Circe\'s hall, until they want home.'),
    dict(after='OD-B11-S04', covers=['OD-B11-S05', 'OD-B11-S06'], book=11, seconds=6, kind='montage',
         text='The shades of queens and of Agamemnon crowd to the blood.'),
    dict(after='OD-B11-S07', covers=['OD-B11-S08', 'OD-B12-S01', 'OD-B12-S02'], replaces=['OD-B12-S02'], book=12, seconds=14, kind='map',
         text='The dead come on in thousands and he runs for the ship. On Aeaea they bury Elpenor, and Circe draws the way ahead: '
              'the Sirens, Scylla and Charybdis, the island of the Sun.'),
    dict(after='OD-B14-S01', covers=['OD-B14-S02', 'OD-B14-S03', 'OD-B14-S04'], book=14, seconds=7, kind='montage',
         text='Night at the swineherd\'s hut: pork and wine, and a Cretan\'s lies by the fire.'),
    dict(after='OD-B15-S01', covers=['OD-B15-S02', 'OD-B15-S03', 'OD-B15-S04'], book=15, seconds=7, kind='voyage',
         text='Gifts at Sparta; the ship runs home past the ambush.'),
    dict(after='OD-B18-S04', covers=['OD-B18-S05'], book=18, seconds=6, kind='montage',
         text='Evening in the hall: the suitors drink; the maids mock the beggar at the fire.'),
    dict(after='OD-B19-S06', covers=['OD-B20-S01', 'OD-B20-S02'], book=20, seconds=6, kind='montage',
         text='A sleepless night; at dawn, thunder out of a clear sky.'),
    dict(after='OD-B23-S04', covers=['OD-B23-S05', 'OD-B23-S06', 'OD-B24-S01', 'OD-B24-S02', 'OD-B24-S03'],
         replaces=['OD-B23-S05', 'OD-B23-S06', 'OD-B24-S01', 'OD-B24-S02', 'OD-B24-S03'], book=23, seconds=9, kind='montage',
         text='Athena holds back the dawn. In the morning he walks out to his father\'s farm.'),
]

ACTS = [('I', 'Two roads', lambda s: s['book'] <= 4 or s['id'] in MOVES[0][0]),
        ('II', 'The sea and the Phaeacians', lambda s: 5 <= s['book'] <= 8 and s['id'] not in MOVES[0][0]),
        ('III', 'The tales', lambda s: 9 <= s['book'] <= 12),
        ('IV', 'Ithaca in disguise', lambda s: 13 <= s['book'] <= 20),
        ('V', 'The bow and the hall', lambda s: 21 <= s['book'] <= 22),
        ('VI', 'The bed, and the end', lambda s: s['book'] >= 23)]

# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE DATA
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
J = lambda p: json.load(open(os.path.join(HW, p)))
MAN = J('drive/voice-manifest.json')
SCRIPT = {s['id']: s for s in J('drive/drive-script.json')['scenes']}
ATLAS = {s['id']: s for s in J('harness/atlas.json')['scenes']}
LINES = J('viewer/spoken-lines.json').get('lines', {})
TURNS_BY = {t['id']: t for ts in J('viewer/performance-turns.json')['byScene'].values() for t in ts}
LOC = {s['id']: s for s in json.load(open(os.path.join(ROOT, 'odyssey/kits/locations.json')))['scenes']}
IDS = sorted(MAN)                                          # id order IS the film (build-film-audio.mjs, buildTimeline)
assert len(IDS) == 152 and set(IDS) == set(NECESSITY), 'the necessity table must name all 152 scenes'
for spec in (MOVES, RECOGNITIONS, TURNS):
    pass

src = lambda p: open(os.path.join(HW, p), encoding='utf8').read()
DIRECTION = {m.group(1): (m.group(2), m.group(3)) for m in
             re.finditer(r'"(OD-B\d\d-S\d\d)":\s*\["(\w+)",\s*"([^"]*)"\]', src('scenes/_direction.mjs'))}
ARTIFACTS = defaultdict(list)
for m in re.finditer(r'export const (\w+) = \{ id: "\w+", title: "([^"]+)", scene: "(OD-B\d\d-S\d\d)"', src('scenes/_artifacts.mjs')):
    ARTIFACTS[m.group(3)].append(m.group(2))
SUNDANCE_SRC = src('harness/build-sundance.mjs')
SUNDANCE = [dict(cue=m.group(1), scene=m.group(2), pat=m.group(3), kinds=re.findall(r'"(\w+)"', m.group(4)))
            for m in re.finditer(r'\{ id: "(\w+)",\s*scene: "(OD-B\d\d-S\d\d)", pat: "([^"]*)",\s*kinds: \[([^\]]*)\]', SUNDANCE_SRC)]


def seg_text(d):
    t = d.get('sourceTurnId')
    return (t and LINES.get(t, {}).get('line')) or d.get('text') or ''


def sundance_pick(c):
    """the segment build-sundance.mjs's pick() chooses: first kind in order, first manifest segment whose text matches"""
    s, m = SCRIPT[c['scene']], MAN[c['scene']]
    for kind in c['kinds']:
        for v in m['segments']:
            d = s['segments'][v['gi']]
            if d['kind'] == kind and re.search(c['pat'], seg_text(d), re.I): return v['gi']
    return None


SUNDANCE_SEG = defaultdict(dict)
for c in SUNDANCE:
    g = sundance_pick(c)
    if g is not None: SUNDANCE_SEG[c['scene']][g] = c['cue']


def ogg_seconds(path):
    """duration of an Ogg Vorbis/Opus file: the last page's granule position over the stream's rate"""
    try:
        with open(path, 'rb') as f:
            head = f.read(4096); f.seek(0, 2); n = f.tell(); f.seek(max(0, n - 65536)); tail = f.read()
        if b'OpusHead' in head: rate = 48000
        else:
            i = head.find(b'\x01vorbis'); rate = struct.unpack('<I', head[i + 12:i + 16])[0]
        j = tail.rfind(b'OggS'); gran = struct.unpack('<q', tail[j + 6:j + 14])[0]
        return round(gran / rate, 2)
    except Exception: return None


# the bed: trackFor(book) exactly as build-film-audio.mjs resolves it (first album with a track numbered for the book)
ALB = J('audio/albums.json')
def bed_for(book):
    for a in ALB['albums']:
        for t in a['tracks']:
            if t.get('num') == book:
                p = os.path.join(HW, a['dir'], t['file'])
                return dict(album=a['name'], title=t['title'], file=a['dir'] + '/' + t['file'], seconds=ogg_seconds(p))
    return None
BEDS = {b: bed_for(b) for b in range(1, 25)}

# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE SCENES — scored
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
FILM, off = [], 0.0
for i in IDS:
    FILM.append(dict(id=i, offset=off, total=MAN[i]['total'])); off += MAN[i]['total']
FULL = off
OFFSET = {f['id']: f['offset'] for f in FILM}
WORDS = lambda s: {w for w in re.findall(r"[a-z']{4,}", s.lower())} - {'that', 'this', 'with', 'from', 'have', 'your', 'what', 'will', 'they', 'them', 'when', 'were', 'into', 'there', 'their'}


def segments(i):
    out, sc, vm = [], SCRIPT[i], MAN[i]
    for v in vm['segments']:
        d = sc['segments'][v['gi']]
        t = TURNS_BY.get(d.get('sourceTurnId') or '', {})
        out.append(dict(gi=v['gi'], start=v['start'], dur=v['dur'], kind=d['kind'], speaker=d.get('speakerName') or '',
                        turn=d.get('sourceTurnId'), act=t.get('act') or ('NARRATE' if d['kind'] != 'DIALOGUE' else 'ASSERT'),
                        text=seg_text(d), script_text=d.get('text') or ''))
    return out


def score_scene(i):
    a, L, segs = ATLAS[i], LOC[i], segments(i)
    content = [s for s in segs if s['kind'] not in ('SCENE_HEADER', 'SPEAKER_CUE')]
    csec = sum(s['dur'] for s in content) or 1
    dia = sum(s['dur'] for s in content if s['kind'] == 'DIALOGUE') / csec
    act = sum(s['dur'] for s in content if s['kind'] == 'AUDITORY_ACTION') / csec
    sights = [x['name'] for x in a['assets'] if x['type'] in SPECTACLE_TYPES]
    spec_raw = (sum(SPECTACLE_TYPES[x['type']] for x in a['assets'] if x['type'] in SPECTACLE_TYPES)
                + SPECTACLE_ARTIFACT * bool(ARTIFACTS.get(i)) + SPECTACLE_SUNDANCE * bool(SUNDANCE_SEG.get(i)) + SPECTACLE_ACTION * act)
    spectacle = min(1.0, spec_raw / SPECTACLE_FULL)
    emo = DIRECTION.get(i, (None, None))[0]
    kit_models = [k for k, v in KIT_SCENES.items() if i in v]
    pri_raw = (PRIORITY['key_beat'] * bool(emo) + PRIORITY['recognition_emotion'] * (emo == 'recognition')
               + PRIORITY['artifact'] * bool(ARTIFACTS.get(i)) + PRIORITY['sundance'] * bool(SUNDANCE_SEG.get(i))
               + PRIORITY['kit_model'] * bool(kit_models))
    priority = min(1.0, pri_raw / PRIORITY_FULL)
    prod_raw = PRODUCTION['keyframes'] * L['has_keyframes'] + PRODUCTION['kit'] * bool(L['kits']) + PRODUCTION['in_film'] * L['in_film']
    production = min(1.0, prod_raw / PRODUCTION_FULL)
    nec, why = NECESSITY[i]
    talk = dia * (1 - spectacle)                        # talk that nothing on screen relieves
    score = BOOK_WEIGHT[a['book']] * (W['necessity'] * nec / 3 + W['spectacle'] * spectacle + W['priority'] * priority
                                      + W['production'] * production) - W['talk'] * talk
    set_piece = spectacle >= SET_PIECE_SPECTACLE
    event = set_piece or i in RECOGNITIONS or i in TURNS
    return dict(id=i, title=a['title'], book=a['book'], book_title=a['bookTitle'], total=MAN[i]['total'], offset=OFFSET[i],
                segs=segs, content_sec=round(csec, 2), dialogue_share=round(dia, 3), action_share=round(act, 3),
                necessity=nec, necessity_note=why, spectacle=round(spectacle, 3), sights=sights, artifacts=ARTIFACTS.get(i, []),
                sundance=sorted(set(SUNDANCE_SEG.get(i, {}).values())), key_beat=DIRECTION.get(i), kits=L['kits'] or kit_models,
                keyframes=L['has_keyframes'], in_film=L['in_film'], dialogue_lines=L['dialogue'],
                priority=round(priority, 3), production=round(production, 3), talk=round(talk, 3), score=round(score, 3),
                set_piece=set_piece, event=event, recognition=RECOGNITIONS.get(i), turn=TURNS.get(i),
                talk_only=(not event) and dia >= 0.45,
                must=nec == 3 or i in RECOGNITIONS or i in TURNS)


S = {i: score_scene(i) for i in IDS}


def value_segments(s):
    """value every segment of a scene; mark the ones the trimmer may never drop"""
    segs, i = s['segs'], s['id']
    content = [g for g in segs if g['kind'] not in ('SCENE_HEADER', 'SPEAKER_CUE')]
    key = None
    if s['key_beat']:
        note = WORDS(s['key_beat'][1])
        best = max(((len(note & (WORDS(g['text']) | WORDS(g['script_text']))), g['gi']) for g in content if g['kind'] == 'DIALOGUE'),
                   default=(0, None))
        key = best[1] if best[0] >= 1 else None
        if key is None:                                     # the note paraphrases: take the strongest line
            dl = [g for g in content if g['kind'] == 'DIALOGUE']
            key = max(dl, key=lambda g: ACT_W[g['act']]).get('gi') if dl else None
    last = content[-1]['gi'] if content else None
    first_action = next((g['gi'] for g in content if g['kind'] == 'AUDITORY_ACTION'), None)
    first_line = next((g['gi'] for g in content if g['kind'] == 'DIALOGUE'), None)
    for g in segs:
        v = KIND_W[g['kind']] * ACT_W[g['act']]
        tags = []
        if g['gi'] == key: v += SEG_BONUS['key_beat']; tags.append('key beat')
        if g['gi'] in SUNDANCE_SEG.get(i, {}): v += SEG_BONUS['sundance']; tags.append('sundance cue ' + SUNDANCE_SEG[i][g['gi']])
        if g['gi'] == last: v += SEG_BONUS['exit']; tags.append('exit state')
        if g['gi'] == first_action: v += SEG_BONUS['opening_action']; tags.append('establishing action')
        if g['gi'] == first_line: v += SEG_BONUS['opening_line']; tags.append('opening line')
        if g['speaker'] == 'Odysseus': v += SEG_BONUS['odysseus']
        g['value'] = round(v, 3)
        g['density'] = BOOK_HOLD[s['book']] * v / max(0.5, g['dur']) ** LEN_EXP
        g['tags'] = tags
        g['protected'] = g['kind'] not in ('SCENE_HEADER', 'SPEAKER_CUE') and (
            g['gi'] == key or g['gi'] in SUNDANCE_SEG.get(i, {}) or (g['gi'] == last and g['dur'] <= EXIT_PROTECT_MAX))
        droppable_kind = (g['kind'] == 'SCENE_HEADER' and not KEEP_HEADERS) or (g['kind'] == 'SPEAKER_CUE' and not KEEP_SPEAKER_CUES)
        g['keep'] = not droppable_kind
        g['why'] = ('scene header: the title card carries it' if g['kind'] == 'SCENE_HEADER' and not KEEP_HEADERS else
                    'speaker cue: the picture shows who speaks' if g['kind'] == 'SPEAKER_CUE' and not KEEP_SPEAKER_CUES else '')
    if content and not any(g['protected'] for g in segs):
        max(content, key=lambda g: g['value'])['protected'] = True


for s in S.values(): value_segments(s)

# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE CUT
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def order(ids):
    ids = list(ids)
    for block, after in MOVES:
        blk = [b for b in block if b in ids]
        ids = [x for x in ids if x not in blk]
        at = ids.index(after) + 1 if after in ids else next((k for k, x in enumerate(ids) if x > after), len(ids))
        ids[at:at] = blk
    return ids


keep = {i for i, s in S.items() if s['must'] or s['score'] >= KEEP_SCORE}
for i in IDS: S[i]['decision_log'] = []
for b in BRIDGES:                                            # a bridge chosen over a scene (never over a must-keep)
    for r in b.get('replaces', []):
        if r in keep and not S[r]['must']:
            keep.discard(r); S[r]['decision_log'].append(f'replaced by a {b["seconds"]} s music bridge after {b["after"]}')

# rule 3: no more than MAX_TALK_RUN talk-only scenes in a row — drop the weakest non-must talk scene of any longer run
changed = True
while changed:
    changed, run = False, []
    for i in order(sorted(keep)) + [None]:
        if i and S[i]['talk_only']: run.append(i); continue
        if len(run) > MAX_TALK_RUN:
            cand = [x for x in run if not S[x]['must']]
            if cand:
                x = min(cand, key=lambda x: S[x]['score']); keep.discard(x); changed = True
                S[x]['decision_log'].append(f'dropped to break a run of {len(run)} talk-only scenes')
                break
        run = []


def floor_of(s, lull=False):
    if s['event']: return FLOOR['event']
    if 9 <= s['book'] <= 12: return FLOOR['tales']
    if s['talk_only']: return FLOOR_LULL if lull else FLOOR['talk']
    return FLOOR['other']


def bridges_in(cut_ids):
    used, cs = [], set(cut_ids)
    for b in BRIDGES:
        if b['after'] not in cs or any(c in cs for c in b['covers']): continue
        nxt = next((i for i in IDS if i > b['after'] and i in cs), 'OD-B99')
        assert all(b['after'] < c < nxt for c in b['covers']), f'bridge after {b["after"]} covers scenes past the next kept scene {nxt}'
        used.append(b)
    return used


def runtime(cut_ids):
    t = 0.0
    for i in cut_ids:
        k = [g for g in S[i]['segs'] if g['keep']]
        t += sum(g['dur'] for g in k) + BREATH * max(0, len(k) - 1) + SCENE_PAD
    return t + sum(b['seconds'] for b in bridges_in(cut_ids))


def timeline(cut_ids):
    """lay the cut on its own clock: each kept segment gets `at`; returns scene spans and bridge spans"""
    t, spans, bmap = 0.0, [], defaultdict(list)
    for b in bridges_in(cut_ids): bmap[b['after']].append(b)
    for i in cut_ids:
        k = [g for g in S[i]['segs'] if g['keep']]
        t0 = t; t += SCENE_PAD / 2
        for n, g in enumerate(k):
            g['at'] = round(t, 3); t += g['dur'] + (BREATH if n < len(k) - 1 else 0)
        t += SCENE_PAD / 2
        spans.append(dict(id=i, t0=t0, t1=t, event=S[i]['event'], book=S[i]['book']))
        for b in bmap[i]:
            spans.append(dict(id='bridge', t0=t, t1=t + b['seconds'], event=False, book=b['book'], bridge=b)); t += b['seconds']
    return spans, t


def lulls(spans):
    """time between the end of one event and the start of the next (and from the top of the film to the first)"""
    out, last_end = [], 0.0
    for sp in spans:
        if sp['event']:
            out.append(dict(from_t=last_end, to_t=sp['t0'], gap=sp['t0'] - last_end, next=sp['id'])); last_end = sp['t1']
    if spans: out.append(dict(from_t=last_end, to_t=spans[-1]['t1'], gap=spans[-1]['t1'] - last_end, next='end'))
    return out


def trim(cut_ids, target, lull_scenes=()):
    """drop whole segments, lowest value per second first, until the cut fits the target; never below a scene's floor"""
    pool = []
    for i in cut_ids:
        s = S[i]
        for g in s['segs']:
            if g['keep'] and not g['protected']: pool.append((g['density'], i, g))
    pool.sort(key=lambda x: x[0])
    cur = runtime(cut_ids)
    kept_sec = {i: sum(g['dur'] for g in S[i]['segs'] if g['keep'] and g['kind'] not in ('SCENE_HEADER', 'SPEAKER_CUE')) for i in cut_ids}
    for dens, i, g in pool:
        if cur <= target: break
        s = S[i]
        if kept_sec[i] - g['dur'] < floor_of(s, i in lull_scenes) * s['content_sec']: continue
        g['keep'] = False; g['why'] = f'trimmed: value {g["value"]:.2f} over {g["dur"]:.1f} s'
        kept_sec[i] -= g['dur']; cur -= g['dur'] + BREATH
    return runtime(cut_ids)


cut = order(sorted(keep))
rt = trim(cut, TARGET_MIN * 60)

# rule 2: a lull longer than MAX_LULL — first bring back a dropped set piece inside it, then trim its talk harder
for _ in range(12):
    spans, _t = timeline(cut)
    long = [l for l in lulls(spans) if l['gap'] > MAX_LULL]
    if not long: break
    l = long[0]
    inside = [sp['id'] for sp in spans if sp['t0'] >= l['from_t'] - 0.01 and sp['t1'] <= l['to_t'] + 0.01 and sp['id'] != 'bridge']
    lo = inside[0] if inside else l['next']; hi = l['next']
    back = [i for i in IDS if i not in cut and S[i]['set_piece'] and lo <= i <= (hi if hi != 'end' else 'OD-B99')]
    if back:
        x = max(back, key=lambda x: S[x]['score']); cut = order(sorted(set(cut) | {x}))
        S[x]['decision_log'].append(f'brought back: a {l["gap"] / 60:.1f} min lull had no set piece')
        continue
    before = runtime(cut)
    trim(cut, before - (l['gap'] - MAX_LULL) - 1, lull_scenes=set(inside))
    if runtime(cut) >= before - 0.5: break
rt = trim(cut, TARGET_MIN * 60)
spans, rt = timeline(cut)

# the full film's own spans and lulls, on the film clock
full_spans = [dict(id=i, t0=S[i]['offset'], t1=S[i]['offset'] + S[i]['total'], event=S[i]['event'], book=S[i]['book']) for i in IDS]
L_full, L_cut = lulls(full_spans), lulls(spans)
worst = lambda L: max(L, key=lambda l: l['gap'])

# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE EDIT DECISION LIST
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def reasons(s):
    r = [s['necessity_note']]
    if s['recognition']: r.append('recognition: ' + s['recognition'])
    if s['turn']: r.append(s['turn'])
    if s['set_piece']: r.append('set piece' + (': ' + '; '.join(s['sights'][:3]) if s['sights'] else ''))
    if s['artifacts']: r.append('artifact: ' + ', '.join(s['artifacts']))
    if s['sundance']: r.append('in the short film (' + ', '.join(s['sundance']) + ')')
    if s['kits']: r.append('kit: ' + ', '.join(s['kits']))
    if s['keyframes']: r.append('keyframes')
    if s['key_beat']: r.append(f'key beat "{s["key_beat"][0]}"')
    return list(dict.fromkeys(r))


def drop_reason(s):
    r = s['decision_log'][:] or [f'score {s["score"]:.2f} below {KEEP_SCORE}']
    r.insert(0, s['necessity_note'] + f' (necessity {s["necessity"]})')
    if s['talk_only']: r.append(f'talk-only ({round(100 * s["dialogue_share"])}% dialogue, nothing on screen)')
    b = next((b for b in bridges_in(cut) if s['id'] in b['covers']), None)
    if b: r.append(f'carried by a {b["seconds"]} s bridge after {b["after"]}')
    return r


kept_out, dropped_out = [], []
for sp in spans:
    if sp['id'] == 'bridge': continue
    s = S[sp['id']]
    k = [g for g in s['segs'] if g['keep']]
    csec = sum(g['dur'] for g in k)
    status = 'keep' if csec >= 0.9 * s['content_sec'] else 'trim'
    kept_out.append(dict(
        id=s['id'], title=s['title'], book=s['book'], status=status, file=MAN[s['id']]['file'],
        at=round(sp['t0'], 3), seconds=round(sp['t1'] - sp['t0'], 2), full_seconds=s['total'], full_offset=round(s['offset'], 3),
        voice_seconds=round(csec, 2), bed=BEDS[s['book']]['file'] if BEDS[s['book']] else None,
        segments=[dict(gi=g['gi'], start=g['start'], dur=g['dur'], at=g['at'], kind=g['kind'], speaker=g['speaker'], turn=g['turn'],
                       tags=g['tags']) for g in k],
        dropped_segments=[dict(gi=g['gi'], start=g['start'], dur=g['dur'], kind=g['kind'], why=g['why']) for g in s['segs'] if not g['keep']],
        why=reasons(s) + s['decision_log'],
        score=dict(total=s['score'], necessity=s['necessity'], spectacle=s['spectacle'], priority=s['priority'], production=s['production'],
                   talk=s['talk'], set_piece=s['set_piece'], event=s['event'], talk_only=s['talk_only'])))
for i in IDS:
    if i in cut: continue
    s = S[i]
    dropped_out.append(dict(id=i, title=s['title'], book=s['book'], seconds=s['total'], reason=drop_reason(s),
                            score=dict(total=s['score'], necessity=s['necessity'], spectacle=s['spectacle'], priority=s['priority'],
                                       production=s['production'], talk=s['talk'], talk_only=s['talk_only'])))

bridge_out = []
for sp in spans:
    if sp['id'] != 'bridge': continue
    b = sp['bridge']; bed = BEDS[b['book']]
    book_start = min(S[i]['offset'] for i in IDS if S[i]['book'] == b['book'])
    first = next((c for c in b['covers'] if S[c]['book'] == b['book']), None)
    into = S[first]['offset'] - book_start if first else 0.0
    music_in = round(into % bed['seconds'], 2) if bed and bed['seconds'] else 0.0
    bridge_out.append(dict(after=b['after'], at=round(sp['t0'], 3), seconds=b['seconds'], kind=b['kind'], covers=b['covers'],
                           covers_seconds=round(sum(S[c]['total'] for c in b['covers']), 1),
                           music=dict(album=bed['album'], track=bed['title'], file=bed['file'], track_seconds=bed['seconds'], **{'in': music_in}),
                           text=b['text']))

per_book = []
for b in range(1, 25):
    full = sum(S[i]['total'] for i in IDS if S[i]['book'] == b)
    c = sum(sp['t1'] - sp['t0'] for sp in spans if sp['book'] == b)
    per_book.append(dict(book=b, roman=ROMAN[b - 1], title=next(S[i]['book_title'] for i in IDS if S[i]['book'] == b),
                         full_min=round(full / 60, 2), cut_min=round(c / 60, 2),
                         scenes=sum(1 for i in IDS if S[i]['book'] == b), kept=sum(1 for i in cut if S[i]['book'] == b)))
acts = []
for num, name, f in ACTS:
    ids = [i for i in cut if f(S[i])]
    full = sum(S[i]['total'] for i in IDS if f(S[i]))
    c = sum(sp['t1'] - sp['t0'] for sp in spans if (sp['id'] != 'bridge' and f(S[sp['id']])) or
            (sp['id'] == 'bridge' and f(S[sp['bridge']['after']])))
    t0 = min((sp['t0'] for sp in spans if sp['id'] in ids), default=0)
    acts.append(dict(act=num, name=name, scenes=len(ids), full_min=round(full / 60, 1), cut_min=round(c / 60, 1), starts_at_min=round(t0 / 60, 1)))

first_odysseus = lambda sp_list: next(sp['t0'] for sp in sp_list if sp['id'] == 'OD-B05-S03')
talk_runs = []
run = []
for i in cut + [None]:
    if i and S[i]['talk_only']: run.append(i)
    else:
        if run: talk_runs.append(run)
        run = []
full_runs, run = [], []
for i in IDS + [None]:
    if i and S[i]['talk_only']: run.append(i)
    else:
        if run: full_runs.append(run)
        run = []
lw_f, lw_c = worst(L_full), worst(L_cut)
checks = dict(
    runtime_in_range=RANGE_MIN[0] * 60 <= rt <= RANGE_MIN[1] * 60,
    all_recognitions_kept=all(i in cut for i in RECOGNITIONS), summit_kept=SUMMIT in cut, turn_kept=TURN in cut,
    story_order=[i for i in cut if i not in MOVES[0][0]] == sorted(i for i in cut if i not in MOVES[0][0]),
    max_talk_run=max((len(r) for r in talk_runs), default=0), max_talk_run_ok=max((len(r) for r in talk_runs), default=0) <= MAX_TALK_RUN,
    longest_lull_ok=lw_c['gap'] <= MAX_LULL,
    lulls_over_limit=[dict(before=l['next'], minutes=round(l['gap'] / 60, 2)) for l in L_cut if l['gap'] > MAX_LULL])
EDL = dict(
    generated_by='tools/forage/product/cut.py', halfworld=HW, title="The Odyssey — the Regulars' Cut",
    clock=dict(note=('Scene order is the cut order. Each kept segment is (gi, start, dur) inside the scene recording drive/voice/<id>.m4a, '
                     'numbered exactly as drive/voice-manifest.json; `at` is its place on the cut clock. Segments are laid end to end with '
                     f'{BREATH} s between them inside a scene and {SCENE_PAD} s at each scene seam (split before/after); bridges are bed-only. '
                     "The bed under a scene is its book's track (trackFor(book) as in harness/build-film-audio.mjs)."),
               breath=BREATH, scene_pad=SCENE_PAD, headers_kept=KEEP_HEADERS, speaker_cues_kept=KEEP_SPEAKER_CUES),
    rules=dict(target_min=TARGET_MIN, range_min=RANGE_MIN, max_lull_s=MAX_LULL, max_talk_run=MAX_TALK_RUN, weights=W, keep_score=KEEP_SCORE,
               set_piece_spectacle=SET_PIECE_SPECTACLE, floors=FLOOR, book_weight=BOOK_WEIGHT, moves=MOVES, seg_bonus=SEG_BONUS, book_hold=BOOK_HOLD, len_exp=LEN_EXP),
    totals=dict(
        full_min=round(FULL / 60, 2), runtime_min=round(rt / 60, 2), runtime_s=round(rt, 2),
        scenes_full=len(IDS), scenes_kept=len(cut), scenes_trimmed=sum(1 for k in kept_out if k['status'] == 'trim'),
        scenes_dropped=len(dropped_out), bridges=len(bridge_out), bridge_s=sum(b['seconds'] for b in bridge_out),
        segments_full=sum(len(MAN[i]['segments']) for i in IDS), segments_kept=sum(len(k['segments']) for k in kept_out),
        odysseus_first_seen_min=dict(full=round(first_odysseus(full_spans) / 60, 1), cut=round(first_odysseus(spans) / 60, 1)),
        longest_lull=dict(full=dict(minutes=round(lw_f['gap'] / 60, 2), before=lw_f['next'], from_min=round(lw_f['from_t'] / 60, 1)),
                          cut=dict(minutes=round(lw_c['gap'] / 60, 2), before=lw_c['next'], from_min=round(lw_c['from_t'] / 60, 1))),
        events=dict(full=sum(1 for s in full_spans if s['event']), cut=sum(1 for s in spans if s['event'])),
        mean_lull_min=dict(full=round(sum(l['gap'] for l in L_full) / len(L_full) / 60, 2), cut=round(sum(l['gap'] for l in L_cut) / len(L_cut) / 60, 2)),
        talk_runs=dict(full_max=max(len(r) for r in full_runs), cut_max=max((len(r) for r in talk_runs), default=0)),
        per_book=per_book, acts=acts),
    checks=checks,
    scenes=kept_out, bridges=bridge_out, dropped=dropped_out)
json.dump(EDL, open(OUT_JSON, 'w'), indent=1, ensure_ascii=False)

# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
#  THE PAGE
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
EXTRA = '''
.stats.eight { margin-top: 0; border-top: 0; }
.big { font: 700 clamp(46px, 9vw, 96px)/1 'Cormorant Garamond', Georgia, serif; margin: 22px 0 4px; letter-spacing: -.02em; }
.big s { color: var(--muted); text-decoration-thickness: 3px; } .big em { font-style: normal; color: var(--blue); }
svg.tl { width: 100%; height: auto; display: block; margin: 12px 0 2px; font-family: Inter, system-ui, sans-serif; }
svg.tl text { fill: var(--ink); font-size: 11px; } svg.tl .mut { fill: var(--muted); } svg.tl .lbl { font-size: 12px; font-weight: 600; }
svg.tl .bk { fill: var(--card); stroke: var(--rule); } svg.tl .bk.alt { fill: var(--rule); }
svg.tl .ev { fill: var(--ink); } svg.tl .ev.rec { fill: var(--blue); } svg.tl .ev.top { fill: var(--gold); }
svg.tl .br { fill: var(--gold); opacity: .8; }
svg.tl .link { fill: var(--blue); opacity: .10; } svg.tl .link.ev { opacity: .22; }
svg.tl .ax { stroke: var(--rule); } svg.tl .lim { stroke: var(--bad); stroke-dasharray: 4 4; }
svg.tl .lf { fill: none; stroke: var(--muted); stroke-width: 1.3; } svg.tl .lc { fill: none; stroke: var(--blue); stroke-width: 2; }
svg.tl .af { fill: var(--muted); opacity: .12; } svg.tl .ac { fill: var(--blue); opacity: .14; }
.key { font-size: 12px; color: var(--muted); display: flex; flex-wrap: wrap; gap: 4px 16px; }
.key i { display: inline-block; width: 12px; height: 12px; vertical-align: -2px; margin-right: 5px; }
.chip { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: .04em; padding: 1px 6px; margin: 1px 2px 1px 0; border: 1px solid var(--rule); color: var(--muted); white-space: nowrap; }
.chip.keep { border-color: var(--ok); color: var(--ok); } .chip.trim { border-color: var(--gold); color: var(--gold); } .chip.drop { border-color: var(--bad); color: var(--bad); border-style: dashed; }
.chip.ev { border-color: var(--ink); color: var(--ink); } .chip.rec { border-color: var(--blue); color: var(--blue); }
tr.drop td { color: var(--muted); } tr.drop td b { font-weight: 600; }
.segbar { display: flex; gap: 1px; height: 8px; min-width: 120px; margin-top: 4px; }
.segbar span { display: block; height: 100%; background: var(--ink); } .segbar span.x { background: var(--rule); }
td.why { font-size: 13px; color: var(--muted); max-width: 440px; }
.acts { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; border: 2px solid var(--ink); margin: 18px 0; }
.acts div { padding: 12px 12px; border-right: 1px solid var(--rule); } .acts div:last-child { border-right: 0; }
.acts b { display: block; font: 700 28px/1 'Cormorant Garamond', Georgia, serif; } .acts span { font-size: 12px; color: var(--muted); display: block; }
.acts .nm { font-weight: 600; color: var(--ink); font-size: 13px; margin-top: 4px; }
.bridges { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.bridge { background: var(--card); border: 1px solid var(--rule); border-top: 3px solid var(--gold); padding: 12px 14px; font-size: 14px; }
.bridge .meta { margin-bottom: 4px; } .bridge p { color: var(--muted); }
.loss { display: grid; grid-template-columns: 1fr 1fr; gap: 26px; } .loss ul { padding-left: 20px; } .loss li { margin: 6px 0; }
.note { font-size: 13px; color: var(--muted); max-width: 900px; }
.checks { font-size: 14px; } .checks li { margin: 4px 0; } .ok { color: var(--ok); font-weight: 600; } .bad { color: var(--bad); font-weight: 600; }
@media (max-width: 800px) { .acts { grid-template-columns: repeat(2, 1fr); } .loss { grid-template-columns: 1fr; } .hide-sm { display: none; } }
'''


def mmss(s): return f'{int(s // 60)}:{int(round(s % 60)):02d}' if round(s % 60) < 60 else f'{int(s // 60) + 1}:00'


def svg_timeline():
    Wd, x0, x1 = 1200, 70, 1190
    sc = (x1 - x0) / FULL
    X = lambda t: x0 + t * sc
    yF, yC, h = 34, 150, 30
    o = [f'<svg class="tl" viewBox="0 0 {Wd} 214" role="img" aria-label="The full film and the cut, by book, on one clock">']
    # links: each kept scene from its place in the full film to its place in the cut
    cut_at = {sp['id']: sp for sp in spans if sp['id'] != 'bridge'}
    for i in IDS:
        if i not in cut_at: continue
        s, c = S[i], cut_at[i]
        a0, a1, b0, b1 = X(s['offset']), X(s['offset'] + s['total']), X(c['t0']), X(c['t1'])
        o.append(f'<path class="link{" ev" if s["event"] else ""}" d="M{a0:.1f},{yF + h} L{a1:.1f},{yF + h} L{b1:.1f},{yC} L{b0:.1f},{yC} Z"/>')
    for label, y, sp_list, tot in (('FULL FILM', yF, full_spans, FULL), ("REGULARS' CUT", yC, spans, rt)):
        o.append(f'<text x="{x0}" y="{y - 8}" class="lbl">{label} · {tot / 60:.1f} min</text>')
        # book blocks
        books = []
        for sp in sp_list:
            if books and books[-1]['book'] == sp['book']: books[-1]['t1'] = sp['t1']
            else: books.append(dict(book=sp['book'], t0=sp['t0'], t1=sp['t1']))
        for n, b in enumerate(books):
            o.append(f'<rect class="bk{" alt" if b["book"] % 2 == 0 else ""}" x="{X(b["t0"]):.1f}" y="{y}" width="{max(.5, X(b["t1"]) - X(b["t0"])):.1f}" height="{h}"><title>Book {ROMAN[b["book"] - 1]}: {(b["t1"] - b["t0"]) / 60:.1f} min</title></rect>')
            if X(b['t1']) - X(b['t0']) > 16:
                o.append(f'<text x="{(X(b["t0"]) + X(b["t1"])) / 2:.1f}" y="{y + h + 13}" text-anchor="middle" class="mut">{ROMAN[b["book"] - 1]}</text>')
        for sp in sp_list:
            if sp['id'] == 'bridge':
                o.append(f'<rect class="br" x="{X(sp["t0"]):.1f}" y="{y + h - 6}" width="{max(1.5, X(sp["t1"]) - X(sp["t0"])):.1f}" height="6"><title>bridge {sp["bridge"]["seconds"]} s: {E(sp["bridge"]["text"])}</title></rect>')
            elif sp['event']:
                s = S[sp['id']]
                cls = 'top' if sp['id'] in (SUMMIT, TURN) else 'rec' if s['recognition'] else ''
                o.append(f'<rect class="ev {cls}" x="{X(sp["t0"]):.1f}" y="{y + 4}" width="{max(1.5, X(sp["t1"]) - X(sp["t0"])):.1f}" height="{h - 14}"><title>{E(sp["id"])} {E(s["title"])} · {(s["recognition"] or s["turn"] or "set piece")}</title></rect>')
    for m in range(0, int(FULL / 60) + 1, 15):
        o.append(f'<line class="ax" x1="{X(m * 60):.1f}" x2="{X(m * 60):.1f}" y1="{yC + h + 18}" y2="{yC + h + 24}"/>'
                 f'<text x="{X(m * 60):.1f}" y="{yC + h + 36}" text-anchor="middle" class="mut">{m}′</text>')
    o.append('</svg>')
    return '\n'.join(o)


def svg_lull():
    Wd, x0, x1, y0, y1 = 1200, 70, 1190, 20, 230
    sc = (x1 - x0) / FULL
    top = max(lw_f['gap'], lw_c['gap'], MAX_LULL) / 60 * 1.08
    X = lambda t: x0 + t * sc
    Y = lambda m: y1 - (m / top) * (y1 - y0)

    def path(sp_list):
        pts, last_end = [(0, 0)], 0.0
        for sp in sp_list:
            if sp['event']:
                pts += [(sp['t0'], (sp['t0'] - last_end) / 60), (sp['t0'], 0), (sp['t1'], 0)]; last_end = sp['t1']
        end = sp_list[-1]['t1']; pts.append((end, (end - last_end) / 60))
        d = 'M' + ' L'.join(f'{X(t):.1f},{Y(m):.1f}' for t, m in pts)
        return d, d + f' L{X(end):.1f},{Y(0):.1f} Z'
    o = [f'<svg class="tl" viewBox="0 0 {Wd} 262" role="img" aria-label="Minutes since the last set piece, full film and cut">']
    for m in range(0, int(top) + 1, 2):
        o.append(f'<line class="ax" x1="{x0}" x2="{x1}" y1="{Y(m):.1f}" y2="{Y(m):.1f}"/><text x="{x0 - 8}" y="{Y(m) + 4:.1f}" text-anchor="end" class="mut">{m}′</text>')
    o.append(f'<line class="lim" x1="{x0}" x2="{x1}" y1="{Y(MAX_LULL / 60):.1f}" y2="{Y(MAX_LULL / 60):.1f}"/>'
             f'<text x="{x1}" y="{Y(MAX_LULL / 60) - 5:.1f}" text-anchor="end" class="mut">the rule: {MAX_LULL / 60:.0f} min</text>')
    for cls, sp_list in (('f', full_spans), ('c', spans)):
        d, a = path(sp_list)
        o.append(f'<path class="a{cls}" d="{a}"/><path class="l{cls}" d="{d}"/>')
    for l, lab, cls in ((lw_f, 'full film', 'mut'), (lw_c, 'cut', 'lbl')):
        t = l['to_t']; o.append(f'<text x="{X(t) + 4:.1f}" y="{Y(l["gap"] / 60) - 4:.1f}" class="{cls}">{lab}: {l["gap"] / 60:.1f} min before {E(l["next"][3:])}</text>')
    for m in range(0, int(FULL / 60) + 1, 15):
        o.append(f'<text x="{X(m * 60):.1f}" y="{y1 + 20}" text-anchor="middle" class="mut">{m}′</text>')
    o.append('</svg>')
    return '\n'.join(o)


def segbar(s):
    tot = s['total'] or 1
    return '<div class="segbar">' + ''.join(
        f'<span class="{"" if g["keep"] else "x"}" style="flex:{g["dur"] / tot:.4f}" title="gi {g["gi"]} · {g["kind"].lower()} · {g["dur"]:.1f} s"></span>'
        for g in s['segs']) + '</div>'


def tlen(b):
    ts = b['music']['track_seconds']
    return f' of {mmss(ts)}' if ts else ''


def page():
    T = EDL['totals']
    cutrow = {k['id']: k for k in kept_out}
    droprow = {d['id']: d for d in dropped_out}
    o = [HEAD.format(title="The Regulars' Cut", style=STYLE + EXTRA)]
    o.append(f'''  <div class="kicker"><a href="index.html">The Odyssey Line</a> · <a href="locations.html">locations and dialogue</a> · the regulars' cut</div>
  <h1>The Regulars' Cut</h1>
  <p class="lede">"This movie is long, can't bore the regulars." The halfworld film runs as long as its 152 voice recordings laid end to end.
    This is a cut of it made only from those recordings: whole scenes, and whole spoken segments inside them, never a line cut in half,
    in the order of the story. Every number here was worked out by <code>tools/forage/product/cut.py</code> when this page was made.</p>
  <div class="big"><s>{T["full_min"]:.1f}</s> → <em>{T["runtime_min"]:.1f}</em> min</div>
  <div class="stats">
    <div><b>{T["scenes_kept"]} / {T["scenes_full"]}</b><span>scenes kept ({T["scenes_trimmed"]} trimmed)</span></div>
    <div><b>{T["odysseus_first_seen_min"]["full"]:.0f}′ → {T["odysseus_first_seen_min"]["cut"]:.0f}′</b><span>until Odysseus is first seen</span></div>
    <div><b>{T["longest_lull"]["full"]["minutes"]:.1f}′ → {T["longest_lull"]["cut"]["minutes"]:.1f}′</b><span>longest wait for a set piece</span></div>
    <div><b>{T["bridges"]}</b><span>music bridges ({T["bridge_s"]} s in all)</span></div>
  </div>
  <div class="stats eight">
    <div><b>{T["segments_kept"]} / {T["segments_full"]}</b><span>voice segments kept</span></div>
    <div><b>{T["events"]["full"]} → {T["events"]["cut"]}</b><span>set pieces and turns</span></div>
    <div><b>{T["mean_lull_min"]["full"]:.1f}′ → {T["mean_lull_min"]["cut"]:.1f}′</b><span>average wait between them</span></div>
    <div><b>{T["talk_runs"]["full_max"]} → {T["talk_runs"]["cut_max"]}</b><span>most talk-only scenes in a row</span></div>
  </div>''')
    o.append('  <div class="acts">' + ''.join(
        f'<div><span>Act {a["act"]} · from {a["starts_at_min"]:.0f}′</span><b>{a["cut_min"]:.1f}′</b><span>was {a["full_min"]:.1f}′ · {a["scenes"]} scenes</span><span class="nm">{E(a["name"])}</span></div>'
        for a in acts) + '</div>')
    # ---- principles
    ch = EDL['checks']
    ok = lambda b: '<span class="ok">yes</span>' if b else '<span class="bad">no</span>'
    o.append(f'''  <h2>The rules it was cut by</h2>
  <p class="sub">Each principle is a rule in the script, and each is checked on the result.</p>
  <ul class="checks">
    <li><b>Open strong and fast.</b> The council, the stranger at the gate, Athena setting the son his course; then the film crosses straight to Ogygia
      (Hermes, Calypso, Odysseus weeping on the shore: Book V, scenes 1-3), which in the poem happens while Telemachus sails. Odysseus is on
      screen at {T["odysseus_first_seen_min"]["cut"]:.1f} min instead of {T["odysseus_first_seen_min"]["full"]:.1f}. The Telemachy keeps its
      essentials: the loom, Nestor, Athena's eagle, the first recognition, Helen, the horse, Proteus, the ambush. That is the one move out
      of the id order; everything else plays as the film does.</li>
    <li><b>A set piece or a turn every three to four minutes.</b> Longest wait {T["longest_lull"]["full"]["minutes"]:.1f} min in the full
      film, {T["longest_lull"]["cut"]["minutes"]:.1f} min in the cut (the rule is {MAX_LULL / 60:.0f}); within the rule: {ok(ch["longest_lull_ok"])}.
      A set piece is a scene whose spectacle score reaches {SET_PIECE_SPECTACLE} (creatures, set pieces, environments, divine effects, the
      film's performing objects and short-film cues, and narrated action); a turn is a recognition, the bow, the summit.</li>
    <li><b>No more than two talk-only scenes in a row.</b> The full film has a run of {T["talk_runs"]["full_max"]}; the cut's longest is
      {T["talk_runs"]["cut_max"]}: {ok(ch["max_talk_run_ok"])}.</li>
    <li><b>Keep every recognition and the summit.</b> {len(RECOGNITIONS)} recognitions, all kept: {ok(ch["all_recognitions_kept"])}; the bow:
      {ok(ch["turn_kept"])}; the bed: {ok(ch["summit_kept"])}.</li>
    <li><b>The tales are the action spine.</b> Books IX-XII: {sum(p["full_min"] for p in per_book[8:12]):.1f} → {sum(p["cut_min"] for p in per_book[8:12]):.1f}
      min, the most kept of any stretch ({100 * sum(p["cut_min"] for p in per_book[8:12]) / sum(p["full_min"] for p in per_book[8:12]):.0f}%).</li>
    <li><b>The homecoming accelerates.</b> Books XIII-XX keep {100 * sum(p["cut_min"] for p in per_book[12:20]) / sum(p["full_min"] for p in per_book[12:20]):.0f}%,
      the bow and the hall (XXI-XXII) {100 * sum(p["cut_min"] for p in per_book[20:22]) / sum(p["full_min"] for p in per_book[20:22]):.0f}%.</li>
    <li><b>A short end.</b> After the bed: a bridge, the orchard, the peace. Book XXIV runs {per_book[23]["cut_min"]:.1f} min (was {per_book[23]["full_min"]:.1f}).</li>
    <li><b>Runtime in {RANGE_MIN[0]:.0f}-{RANGE_MIN[1]:.0f} min:</b> {ok(ch["runtime_in_range"])} · in story order: {ok(ch["story_order"])}</li>
  </ul>''')
    # ---- timeline
    o.append(f'''  <h2>Both films on one clock</h2>
  <p class="sub">The full film above, the cut below, drawn to the same scale. Each band joins a kept scene to its new place; the darker
    bands are set pieces and turns. The Ogygia band crossing backwards is the one move.</p>
  {svg_timeline()}
  <div class="key"><span><i style="background:var(--ink)"></i>set piece</span><span><i style="background:var(--blue)"></i>recognition</span>
    <span><i style="background:var(--gold)"></i>the bow, the bed · music bridge</span></div>
  <h3 style="margin-top:34px">Minutes since the last set piece</h3>
  <p class="sub">The line climbs while nothing happens and drops to zero at every set piece or turn. Grey is the full film, blue the cut,
    on the same clock, so the cut's line ends at {rt / 60:.0f} minutes.</p>
  {svg_lull()}''')
    # ---- per book table
    o.append('''  <h2>Book by book</h2>
  <div class="tablewrap"><table><tr><th>Book</th><th></th><th class="n">Scenes kept</th><th class="n">Full</th><th class="n">Cut</th><th>Share</th></tr>''')
    for p in per_book:
        share = p['cut_min'] / p['full_min'] if p['full_min'] else 0
        o.append(f'<tr><td><b>{p["roman"]}</b></td><td>{E(p["title"])}</td><td class="n">{p["kept"]} / {p["scenes"]}</td>'
                 f'<td class="n">{p["full_min"]:.1f}′</td><td class="n">{p["cut_min"]:.1f}′</td>'
                 f'<td style="min-width:160px"><span class="segbar"><span style="flex:{share:.3f}"></span><span class="x" style="flex:{1 - share:.3f}"></span></span></td></tr>')
    o.append('</table></div>')
    # ---- scene list
    o.append(f'''  <h2>Every scene</h2>
  <p class="sub">In the order of the cut; dropped scenes sit where they were. The bar under each title is its recording, one block per voice
    segment: black is kept, grey is gone (the dropped scene headers and speaker cues are grey in every row).</p>
  <div class="filters" role="group" aria-label="Show">
    <button aria-pressed="true" data-f="all">All 152</button><button aria-pressed="false" data-f="keep">Kept whole</button>
    <button aria-pressed="false" data-f="trim">Trimmed</button><button aria-pressed="false" data-f="drop">Dropped</button></div>
  <div class="tablewrap"><table id="scenes"><tr><th>Scene</th><th>Title</th><th class="n">Full</th><th class="n">Cut</th><th class="n hide-sm">Score</th><th>Why</th></tr>''')
    rows = []
    listed = set()
    bmap = defaultdict(list)
    for b in bridge_out: bmap[b['after']].append(b)
    seq = []
    for i in cut:
        seq.append(i)
    # dropped scenes are shown after the kept scene that precedes them in id order
    shown = []
    for i in seq:
        shown.append(i)
        nxt = [d for d in IDS if d not in cut and d > i and (not [c for c in cut if i < c < d and c not in MOVES[0][0]])
               and d not in listed and not (i in MOVES[0][0])]
        for d in nxt: listed.add(d); shown.append(d)
    for d in IDS:
        if d not in cut and d not in listed: shown.append(d)
    for i in shown:
        s = S[i]
        chips = ''
        if s['recognition']: chips += '<span class="chip rec">recognition</span>'
        if i in (SUMMIT, TURN): chips += f'<span class="chip ev">{"summit" if i == SUMMIT else "the turn"}</span>'
        elif s['set_piece']: chips += '<span class="chip ev">set piece</span>'
        if s['talk_only']: chips += '<span class="chip">talk</span>'
        if i in cutrow:
            k = cutrow[i]
            rows.append(f'<tr class="{k["status"]}" data-s="{k["status"]}"><td><code>{i[3:]}</code><br><span class="chip {k["status"]}">{k["status"]}</span></td>'
                        f'<td><b>{E(s["title"])}</b> {chips}{segbar(s)}</td><td class="n">{mmss(s["total"])}</td><td class="n">{mmss(k["seconds"])}</td>'
                        f'<td class="n hide-sm">{s["score"]:.2f}</td><td class="why">{E("; ".join(k["why"]))}</td></tr>')
            for b in bmap.get(i, []):
                rows.append(f'<tr data-s="bridge"><td><span class="chip trim">bridge</span></td><td colspan="2"><i>{E(b["text"])}</i></td>'
                            f'<td class="n">0:{b["seconds"]:02d}</td><td class="hide-sm"></td><td class="why">music only: {E(b["music"]["track"])} from {b["music"]["in"]:.0f} s · stands for {", ".join(c[3:] for c in b["covers"])}</td></tr>')
        else:
            d = droprow[i]
            rows.append(f'<tr class="drop" data-s="drop"><td><code>{i[3:]}</code><br><span class="chip drop">drop</span></td><td><b>{E(s["title"])}</b> {chips}</td>'
                        f'<td class="n">{mmss(s["total"])}</td><td class="n">—</td><td class="n hide-sm">{s["score"]:.2f}</td><td class="why">{E("; ".join(d["reason"]))}</td></tr>')
    o.append('\n'.join(rows) + '</table></div>')
    o.append('''<script>
document.querySelectorAll('.filters button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.filters button').forEach(x => x.setAttribute('aria-pressed', x === b));
  const f = b.dataset.f;
  document.querySelectorAll('#scenes tr[data-s]').forEach(r => { r.style.display = (f === 'all' || r.dataset.s === f) ? '' : 'none'; });
}));
</script>''')
    # ---- bridges
    o.append(f'''  <h2>Where the music carries it</h2>
  <p class="sub">{len(bridge_out)} bridges, {sum(b["seconds"] for b in bridge_out)} seconds in all, stand in for
    {sum(b["covers_seconds"] for b in bridge_out) / 60:.1f} minutes of dropped scenes. Each is the book's own bed, the track the full film
    plays under those scenes, entered at the point it would have reached there, over a map or a voyage montage and one line of text.</p>
  <div class="bridges">''')
    for b in bridge_out:
        o.append(f'<div class="bridge"><div class="meta">after <b>{b["after"][3:]}</b> · {b["seconds"]} s · {b["kind"]}</div><i>{E(b["text"])}</i>'
                 f'<p>{E(b["music"]["album"].title())}: “{E(b["music"]["track"])}” from {mmss(b["music"]["in"])}'
                 f'{tlen(b)}. '
                 f'Stands for {", ".join(c[3:] for c in b["covers"])} ({b["covers_seconds"] / 60:.1f} min).</p></div>')
    o.append('</div>')
    # ---- the loss
    big_drops = sorted(dropped_out, key=lambda d: -d['seconds'])
    lost_set = [d for d in dropped_out if S[d['id']]['set_piece']]
    o.append(f'''  <h2>What the regulars lose, and why it is worth it</h2>
  <div class="loss"><div>
  <p>The cut drops {len(dropped_out)} scenes ({sum(d["seconds"] for d in dropped_out) / 60:.1f} min) and trims the rest by whole lines. What goes:</p>
  <ul>
    <li><b>The narrator's scaffolding.</b> Every spoken scene header ("Scene three. The Stranger at the Threshold.") and every speaker
      cue ("Zeus") — {sum(g["dur"] for i in IDS for g in S[i]["segs"] if g["kind"] in ("SCENE_HEADER", "SPEAKER_CUE")) / 60:.1f} minutes of the
      full film. They were written for listeners without a picture; the film has a title card and a face.</li>
    <li><b>The speeches about speeches.</b> Mentor's rebuke, the eagles explained, Nestor's second war story, Orestes as the example,
      the stores. The Telemachy keeps the son's growing up and loses its politics.</li>
    <li><b>The catalogues.</b> The heroines of the past, the judges and punishments, the gifts at Sparta, Theoclymenus. The poem's
      audience knew those names; ours meets them once and never again.</li>
    <li><b>Book XV nearly whole, and most of the second half's hall-talk.</b> The farewell at Sparta, Eumaeus's own story, Irus's
      challenge, Melantho, the restless night. The disguise plays out in fewer, sharper humiliations: the stool, the fight, the scar.</li>
    <li><b>The long end.</b> The suitors' ghosts, Agamemnon's praise of Penelope, Laertes restored, the last clash: after the bed the
      film is going home, and the regulars can feel it.</li>
  </ul></div><div>
  <p>Longest dropped scenes: {", ".join(f'{E(d["title"])} ({mmss(d["seconds"])})' for d in big_drops[:6])}.</p>
  <p>Set pieces lost ({len(lost_set)}): {", ".join(E(S[d["id"]]["title"]) for d in lost_set) or "none"}.
    {'Each is carried by a bridge or is a smaller spectacle next to a kept one.' if lost_set else ''}</p>
  <p><b>Why it is worth it.</b> The film's argument is recognition: a man nobody knows, known in turn by a son, a dog, a nurse, a wife, a
    father. Every one of those is still here, and so is every monster. What goes is the poem's patience — the courtesy between men who
    already know how the story ends. The regulars get the cave at minute {next(sp["t0"] for sp in spans if sp["id"] == "OD-B09-S06") / 60:.0f}
    instead of {S["OD-B09-S06"]["offset"] / 60:.0f}, the bow at {next(sp["t0"] for sp in spans if sp["id"] == TURN) / 60:.0f} instead of
    {S[TURN]["offset"] / 60:.0f}, and they never wait more than {math.ceil(T["longest_lull"]["cut"]["minutes"])} minutes for something to happen.</p>
  <p class="note">What this does not decide: whether the picture can be cut the same way. The film's picture is timed to the whole
    recordings; a trimmed scene needs its camera re-timed to the kept segments (the <code>at</code> offsets in <code>cut.json</code>),
    and a bridge needs a picture, which is new work (a map or a montage of existing plates).</p>
  </div></div>''')
    o.append(f'''  <h2>How it was scored</h2>
  <p class="sub">A scene's score is {W["necessity"]} × story necessity + {W["spectacle"]} × spectacle + {W["priority"]} × the film's own
    priorities + {W["production"]} × production, times a book weight (the tales and the hall up, the long middle down), minus
    {W["talk"]} × talk that nothing on screen relieves. Necessity (0-3) is authored, with a reason, for all 152 scenes; everything else is
    read from the halfworld data: atlas asset types, <code>scenes/_artifacts.mjs</code>, <code>scenes/_direction.mjs</code>,
    <code>harness/build-sundance.mjs</code>, and the LEGO line's keyframes, kits and film sets (<code>locations.json</code>). A scene is
    kept if it is a recognition, a turn, necessity 3, or scores {KEEP_SCORE} or more. Inside a kept scene each voice segment is valued by its
    kind and speech act (from <code>viewer/performance-turns.json</code>), with bonuses for the scene's key beat, a short-film cue, the exit
    state and the establishing action; the lowest value per second goes first, never below a floor ({", ".join(f"{k} {int(v * 100)}%" for k, v in FLOOR.items())}
    of the scene's voice) and never the key beat, the short-film cue or a short exit line.</p>
  <footer>Written by <code>tools/forage/product/cut.py</code> from <code>odyssey-halfworld</code> (read only):
    <code>drive/voice-manifest.json</code>, <code>drive/drive-script.json</code>, <code>harness/atlas.json</code>,
    <code>viewer/spoken-lines.json</code>, <code>viewer/performance-turns.json</code>, <code>scenes/_direction.mjs</code>,
    <code>scenes/_artifacts.mjs</code>, <code>harness/build-sundance.mjs</code>, <code>audio/albums.json</code>; and this repo's
    <code>odyssey/kits/locations.json</code>. The edit decision list is <a href="cut.json">cut.json</a>.
    <br><a href="index.html">All the kits</a> · <a href="locations.html">Locations and dialogue</a></footer>
</main>
</body>
</html>''')
    open(OUT_HTML, 'w').write('\n'.join(o) + '\n')


page()
T = EDL['totals']
print(f"THE REGULARS' CUT  {T['full_min']:.1f} → {T['runtime_min']:.1f} min · {T['scenes_kept']} scenes kept ({T['scenes_trimmed']} trimmed), "
      f"{T['scenes_dropped']} dropped, {T['bridges']} bridges")
print(f"  Odysseus first seen {T['odysseus_first_seen_min']['full']}′ → {T['odysseus_first_seen_min']['cut']}′ · longest lull "
      f"{T['longest_lull']['full']['minutes']}′ → {T['longest_lull']['cut']['minutes']}′ · talk run {T['talk_runs']['full_max']} → {T['talk_runs']['cut_max']}")
for a in acts: print(f"  Act {a['act']:4s} {a['name']:28s} {a['full_min']:6.1f} → {a['cut_min']:5.1f} min  ({a['scenes']} scenes, from {a['starts_at_min']}′)")
print('  checks:', {k: v for k, v in checks.items() if k != 'lulls_over_limit'}, checks['lulls_over_limit'] or '')
print('wrote', os.path.relpath(OUT_JSON, ROOT), 'and', os.path.relpath(OUT_HTML, ROOT))
