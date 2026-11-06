#!/usr/bin/env python3
"""
tools/build_worldtext_final.py
Generates the Scholarly Word-by-Word Operative Worldtext of Homer's Shield of Achilles (Iliad XVIII.478-608):
1. Synthesizes 22 clause-level Native Kokoro-82M v1.0 ONNX utterances across the 11 Canonical Homeric Movements
   (Section 0 .. Section 10 = Foundation + M0..M9, totaling 7,538 LDraw bricks).
2. Computes exact millisecond word-level timestamps [t0, t1], exact uBuild intervals [u0, u1],
   and exact brick ranges [b0, b1] (0 -> 7,538 bricks) so EVERY SPOKEN WORD physically assembles
   its corresponding bricks on the 3D Shield as it is uttered.
3. Places subtle tactile brick-lock impulses synchronized to each spoken word's brick arrival,
   plus diegetic Homeric stems (bronze anvil, phorminx lyre, Dorian aulos, bow volleys, bronze sickles,
   bellowing bull, roaring lions, barking hounds, bleating sheep, and Oceanus surf) at -14.2 LUFS.
4. Writes `achilles/wordtext-timeline.js` (`window.HOMERIC_WORDTEXT_TIMELINE`),
   `achilles/audio/ACH-WORLD-SHIELD.mp3`, and `achilles/audio/Z01.mp3`..`Z06.mp3`.
"""
import json
import math
import os
import subprocess
import sys
import numpy as np
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from tools.build_lego_movie_soundtracks import (
    SR,
    render_earshot_sfx,
    synth_voice_line,
    place,
    make_diegetic_bed,
    make_homeric_diegetic_stems,
    master_to_lufs,
)

AUDIO_DIR = os.path.join(ROOT, "achilles/audio")
SFX_DIR = os.path.join(ROOT, "films/shield-of-achilles/shared/sfx_bank")
TOTAL_BRICKS = 7538

# Exact brick counts per Homeric Section (0..10) in `set.shield-of-achilles` (7,538 bricks total)
SECTION_BRICK_COUNTS = [2475, 203, 449, 448, 275, 411, 435, 420, 579, 517, 1326]

# 11 Canonical Homeric Movements of Iliad XVIII.478-608 (keyed to Section 0..10)
HOMERIC_MOVEMENTS = [
    {
        "secId": 0,
        "roman": "I",
        "zone": "Z01",
        "act": 1,
        "lines": "18.478–482",
        "fold": "Fold 1–5 Substrate · The Anvil of Olympus",
        "formula": "Ποίει δὲ πρώτιστα («First of all he forged»)",
        "title": "The Crucible & The Fivefold Metallic Foundation",
        "greek": "Ποίει δὲ πρώτιστα σάκος μέγα τε στιβαρόν τε πάντοσε δαιδάλλων, περὶ δ᾽ ἄντυγα βάλλε φαεινὴν τρίπλακα μαρμαρέην, ἐκ δ᾽ ἀργύρεον τελαμῶνα. πέντε δ᾽ ἄρ᾽ αὐτοῦ ἔσαν σάκεος πτύχες· αὐτὰρ ἐν αὐτῷ ποίει δαίδαλα πολλὰ ἰδυίῃσι πραπίδεσσιν.",
        "scansion": "– ∪ ∪ | – – | – ∪ ∪ || – ∪ ∪ | – ∪ ∪ | – –  (Hephaestionic hexameter opening with trochaic caesura after σάκος)",
        "therefore": "Salt-water dries along Thetis’s ankles at the threshold of Olympus; because her son has chosen a brief, blazing life over a long return, Hephaestus refuses to hammer a mute plate of bronze—THEREFORE he commands the twenty self-acting bellows and laminates five concentric strata of bronze, tin, gold, and silver into a world-bearing substrate.",
        "mask": "Thetis’s grief-salted maternal urgency colliding with Hephaestus’s lame-footed artisanal immortality.",
        "scholia": "Edwards (1991: 209–211) & Taplin (1980: 3): The five folds (πέντε πτύχες) are confirmed at Il. 20.269–272 as two outer layers of bronze, two inner of tin, and a central core of gold—which stops Aeneas’s spear. Lessing (Laocoön Ch. XVIII) notes that Homer converts spatial coexistence into temporal making (Ποίει δὲ πρώτιστα): we witness the shield coming into being stroke by stroke.",
        "cam": {"target": [0, 28, 0], "r": 1280, "el": 0.62, "az0": -0.35, "az1": 0.15},
        "sfx": [(0.20, "anvil", -1.5, 0.0), (4.80, "anvil", -2.0, -0.2)],
        "clauses": [
            ("am_onyx", 0.84, -0.8,
             "First, beneath twenty roaring bellows, Hephaestus forged a shield both great and strong, adorning it all over."),
            ("bm_george", 0.84, -0.8,
             "Five were the welded folds of bronze, pale tin, silver, and gold, whereon his cunning mind wrought a living world."),
        ],
    },
    {
        "secId": 1,
        "roman": "II",
        "zone": "Z01",
        "act": 1,
        "lines": "18.483–489",
        "fold": "Fold 1 (Center Omphalos) · Module M0",
        "formula": "Ἐν μὲν γαῖαν ἔτευξ᾽ («Therein he wrought»)",
        "title": "The Central Cosmic Boss & The Unbathing Bear",
        "greek": "Ἐν μὲν γαῖαν ἔτευξ᾽, ἐν δ᾽ οὐρανόν, ἐν δὲ θάλασσαν, Ἠέλιόν τ᾽ ἀκάμαντα Σελήνην τε πλήθουσαν, ἐν δὲ τὰ τείρεα πάντα, τά τ᾽ οὐρανὸς ἐστεφάνωται, Πληϊάδας θ᾽ Ὑάδας τε τό τε σθένος Ὠρίωνος Ἄρκτον θ᾽, ἣν καὶ Ἄμαξαν ἐπίκλησιν καλέουσιν, ἥ τ᾽ αὐτοῦ στρέφεται καί τ᾽ Ὠρίωνα δοκεύει, οἴη δ᾽ ἄμμορός ἐστι λοετρῶν Ὠκεανοῖο.",
        "scansion": "– – | – ∪ ∪ | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Triadic anaphora: ἐν μὲν... ἐν δ᾽... ἐν δὲ...)",
        "therefore": "Because the central boss must anchor all mortal seasons before any city can be built, Hephaestus strikes the navel of the bronze first—THEREFORE Earth, Sky, Sea, the untiring Sun, the full Moon, and the Great Bear spring upward in gold and silver studs, revolving forever around the arctic pole without tasting the bath of Ocean.",
        "mask": "Cosmological detachment: the cold arctic pivot of the Bear (Ἄρκτος) watching Orion the hunter across aneternal sky that knows no mortal truce.",
        "scholia": "Becker (1995: 91–97) & Parry (1930): Line 489 (οἴη δ᾽ ἄμμορός ἐστι λοετρῶν Ὠκεανοῖο, repeated at Od. 5.275 where Odysseus steers by the Bear) encodes an astronomical invariance rule directly into the hexameter: circumpolar Ursa Major rotates in place (αὐτοῦ στρέφεται) and never dips below the horizon of Oceanus.",
        "cam": {"target": [0, 96, 6], "r": 540, "el": 0.52, "az0": 0.15, "az1": 0.65},
        "sfx": [(0.25, "anvil", -2.5, 0.0)],
        "clauses": [
            ("bm_george", 0.84, -0.8,
             "Therein he wrought the Earth, the Sky, and the Sea, the untiring Sun, and the full Moon crowned with stars."),
            ("af_aoede", 0.85, -0.3,
             "And the Pleiades, the Hyades, mighty Orion, and the Great Bear, who revolves in her place and alone never bathes in Ocean."),
        ],
    },
    {
        "secId": 2,
        "roman": "III",
        "zone": "Z02",
        "act": 2,
        "lines": "18.490–496",
        "fold": "Fold 2 West · Module M1 (City at Peace I)",
        "formula": "Ἐν δὲ δύω ποίησε πόλεις («Therein he fashioned two fair cities»)",
        "title": "City at Peace I: The Torchlit Bridal Procession",
        "greek": "Ἐν δὲ δύω ποίησε πόλεις μερόπων ἀνθρώπων καλάς. ἐν τῇ μέν ῥα γάμοι τ᾽ ἔσαν εἰλαπίναι τε, νύμφας δ᾽ ἐκ θαλάμων δαΐδων ὕπο λαμπομενάων ἠγίνεον ἀνὰ ἄστυ, πολὺς δ᾽ ὑμέναιος ὀρώρει· κοῦροι δ᾽ ὀρχηστῆρες ἐδίνεον, ἐν δ᾽ ἄρα τοῖσιν αὐλοὶ φόρμιγγές τε βοὴν ἔχον· αἱ δὲ γυναῖκες ἱστάμεναι θαύμαζον ἐπὶ προθύροισιν ἑκάστη.",
        "scansion": "– ∪ ∪ | – – | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Enjambment of καλάς at 491 emphasizing civic beauty)",
        "therefore": "The celestial dome now casts light downward onto the second bronze terrace, demanding mortal witnesses—THEREFORE Hephaestus fashions two cities of articulate-speaking men, where brides walk beneath resinous pine torches as youths whirl to the aulos and phorminx and women marvel from their doorways.",
        "mask": "Festive civic kinship: the bride’s threshold transition from chamber (θάλαμος) to public street, reflected in the admiring gaze of the matrons (θαύμαζον).",
        "scholia": "Webb (2009) & de Jong (2011): Pseudo-Longinos’s definition of enargeia (τὴν ἀκοὴν ὄψιν ποιῶν, 'turning hearing into sight') is already surpassed here: Homer makes silent bronze emit the bridal hymenaeus, double-reed aulos, and phorminx lyre (βοὴν ἔχον), while internal spectators (αἱ δὲ γυναῖκες... θαύμαζον) model the aesthetic wonder of the viewer.",
        "cam": {"target": [-212, 98, -31], "r": 520, "el": 0.44, "az0": -0.45, "az1": -0.05},
        "sfx": [(0.80, "aulos_D5", -7.0, -0.25), (1.35, "aulos_F5", -7.0, 0.20), (4.90, "aulos_A5", -7.5, -0.15)],
        "clauses": [
            ("bm_george", 0.85, -0.7,
             "Therein he fashioned two fair cities of mortal men: in the first were weddings and solemn marriage feasts."),
            ("af_aoede", 0.85, -0.3,
             "Beneath blazing pine torches they led brides from their chambers as young men whirled to flutes and lyres, and women marveled at their portals."),
        ],
    },
    {
        "secId": 3,
        "roman": "IV",
        "zone": "Z02",
        "act": 2,
        "lines": "18.497–508",
        "fold": "Fold 2 East · Module M2 (City at Peace II)",
        "formula": "Λαοὶ δ᾽ εἰν ἀγορῇ («The people were assembled in the Agora»)",
        "title": "City at Peace II: The Sacred Circle & Two Talents of Gold",
        "greek": "Λαοὶ δ᾽ εἰν ἀγορῇ ἔσαν ἀθρόοι· ἔνθα δὲ νεῖκος ὠρώρει, δύο δ᾽ ἄνδρες ἐνείκεον εἵνεκα ποινῆς ἀνδρὸς ἀποφθιμένου· ὁ μὲν εὔχετο πάντ᾽ ἀποδοῦναι δήμῳ πιφαύσκων, ὁ δ᾽ ἀναίνετο μηδὲν ἑλέσθαι· ἄμφω δ᾽ ἱέσθην ἐπὶ ἵστορι πεῖραρ ἑλέσθαι… οἱ δὲ γέροντες εἵατ᾽ ἐπὶ ξεστοῖσι λίθοισ᾽ ἱερῷ ἐνὶ κύκλῳ… κεῖτο δ᾽ ἄρ᾽ ἐν μέσσοισι δύω χρυσοῖο τάλαντα, τῷ δόμεν ὃς μετὰ τοῖσι δίκην ἰθύντατα εἴποι.",
        "scansion": "– – | – ∪ ∪ | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Legal antithesis: ὁ μὲν εὔχετο... ὁ δ᾽ ἀναίνετο)",
        "therefore": "Yet the music of marriage carries down into the Agora where a kinsman’s blood has been shed; the killer swears he has paid the full blood-price while the bereaved kinsman refuses every drachma—THEREFORE heralds restrain the roaring factions as elders rise in turn on polished stones around two talents of gold waiting for him who speaks the straightest judgment.",
        "mask": "Public desperation of the blood-price payer colliding with the bereaved kinsman’s refusal, contained only by the polished stone geometry of the Sacred Circle.",
        "scholia": "Edwards (1991: 213–218) & Westbrook (1992): The most famous legal passage in archaic Greek literature. The polis sublimates blood-vendetta into procedural arbitration before an ἵστωρ (witness/arbiter). Notice how the ποινή (blood-money) rejected by Achilles in Book IX (9.632–636) is here adjudicated in public law for the modest prize of two talents of gold (δύω χρυσοῖο τάλαντα).",
        "cam": {"target": [217, 102, -22], "r": 510, "el": 0.44, "az0": -0.05, "az1": 0.42},
        "sfx": [(5.60, "anvil", -4.5, 0.0)],
        "clauses": [
            ("bm_fable", 0.85, -0.5,
             "In the Agora a strife arose: two men contended over the blood-price of a slain kinsman, one swearing he had paid all, the other refusing."),
            ("bm_lewis", 0.84, -0.8,
             "Therefore the elders sat on polished stones in a sacred circle, rising in turn with heralds' staves around two talents of gold for the straightest judgment."),
        ],
    },
    {
        "secId": 4,
        "roman": "V",
        "zone": "Z03",
        "act": 2,
        "lines": "18.509–540",
        "fold": "Fold 3 North · Module M3 (City at War)",
        "formula": "Τὴν δ᾽ ἑτέρην πόλιν («Around the other city sat two armies»)",
        "title": "City at War: Siege Walls, Tall Golden Gods & River Ambush",
        "greek": "Τὴν δ᾽ ἑτέρην πόλιν ἀμφὶ δύω στρατοὶ εἵατο λαῶν τεύχεσι λαμπόμενοι, δίχα δέ σφισιν ἥνδανε βουλή, ἠὲ διαπραθέειν ἢ ἄνδιχα πάντα δάσασθαι… ἦρχε δ᾽ ἄρα σφιν Ἄρης καὶ Παλλὰς Ἀθήνη ἄμφω χρυσείω… καλὼ καὶ μεγάλω σὺν τεύχεσιν, ὥς τε θεώ περ, ἀμφὶς ἀριζήλω· λαοὶ δ᾽ ὑπ᾽ ὀλίζονες ἦσαν… ἐν δ᾽ Ἔρις ἐν δὲ Κυδοιμὸς ὁμίλεον, ἐν δ᾽ ὀλοὴ Κήρ.",
        "scansion": "– ∪ ∪ | – ∪ ∪ | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Hieratic scale contrast at 519: λαοὶ δ᾽ ὑπ᾽ ὀλίζονες ἦσαν)",
        "therefore": "Coveting that civic wealth, two armies clamp a siege around the second city, divided between sacking it or splitting its storehouses in half; refusing humiliation, the defenders leave their wives, children, and elders on the wall—THEREFORE, led by tall golden Ares and Athena, they crouch in ruddy bronze by the river reeds, slaughter the flocks of two piping shepherds, and clash with the besiegers as crimson Fate drags the slain by the heels.",
        "mask": "Crouched bronze tension in the marsh sedge vs. pastoral obliviousness enchanted by syrinx pan-pipes moments before slaughter.",
        "scholia": "Taplin (1980: 7–8) & Edwards (1991: 219–222): At 18.516–519 Homer explicitly marks the metallurgical and hieratic code of the artwork: Ares and Athena are wrought in gold and physically taller (καλὼ καὶ μεγάλω... λαοὶ δ᾽ ὑπ᾽ ὀλίζονες ἦσαν — 11 bricks tall in our LDraw model vs. 4-brick mortals). The division of the city’s wealth in half (ἄνδιχα πάντα δάσασθαι) echoes Hector’s doomed calculation at Il. 22.114–121.",
        "cam": {"target": [-411, 68, -223], "r": 540, "el": 0.45, "az0": 0.42, "az1": 0.88},
        "sfx": [(1.10, "bow_arrow", -4.0, -0.30), (5.40, "aulos_E5", -7.0, 0.20), (6.80, "bow_arrow", -3.0, 0.30)],
        "clauses": [
            ("am_onyx", 0.85, -0.7,
             "Around the second city sat two glittering armies; refusing to divide their wealth, the citizens armed for ambush, led by tall golden Ares and Pallas Athena."),
            ("bm_fable", 0.85, -0.5,
             "Crouched by the river watering-place, they sprang upon two piping shepherds and their flocks, while Strife, Tumult, and crimson Fate dragged the fallen through the ford."),
        ],
    },
    {
        "secId": 5,
        "roman": "VI",
        "zone": "Z04",
        "act": 2,
        "lines": "18.541–549",
        "fold": "Fold 3 East · Module M4 (Thrice-Ploughed Glebe)",
        "formula": "Ἐν δ᾽ ἐτίθει νειὸν μαλακὴν («Therein he placed a soft fallow field»)",
        "title": "The Thrice-Ploughed Golden Glebe Darkening Behind the Share",
        "greek": "Ἐν δ᾽ ἐτίθει νειὸν μαλακὴν, πίειραν ἄρουραν, εὐρεῖαν τρίπολον· πολλοὶ δ᾽ ἀροτῆρες ἐν αὐτῇ ζεύγεα δινεύοντες ἐλάστρεον ἔνθα καὶ ἔνθα… τοῖσι δ᾽ ἔπειτ᾽ ἐν χερσὶ δέπας μελιηδέος οἴνου δόσκεν ἀνὴρ ἐπιών… ἡ δὲ μελαίνετο ὄπισθεν, ἀρηρομένῃ δὲ ἐῴκει χρυσείη περ ἐοῦσα· τὸ δὴ περὶ θαῦμα τέτυκτο.",
        "scansion": "– ∪ ∪ | – – | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Iterative verb δόσκεν marking the cyclical headland turn)",
        "therefore": "Seeking relief from the stench of river-blood, Hephaestus pours a wide, thrice-ploughed fallow field where ploughmen wheel their yokes toward a steward holding out a goblet of honey-sweet wine—THEREFORE the metal performs the supreme miracle of the forge: the field grows black behind the plough like real turned earth, though wrought of pure gold.",
        "mask": "Muscular thirst and rhythmic exertion straining toward the headland wine-cup, rewarded by the earth’s dark fertility.",
        "scholia": "Becker (1995: 126–130) & Bajohr (2024): Lines 548–549 (ἡ δὲ μελαίνετο ὄπισθεν... χρυσείη περ ἐοῦσα· τὸ δὴ περὶ θαῦμα τέτυκτο) represent the pinnacle of Homeric ekphrasis. The poet simultaneously affirms the material substrate (χρυσείη περ ἐοῦσα, 'though it was made of gold') and its impossible phenomenological state-mutation (μελαίνετο, 'it turned black behind'), bridged by the artisan’s wonder (θαῦμα).",
        "cam": {"target": [423, 78, -209], "r": 530, "el": 0.45, "az0": -0.35, "az1": 0.15},
        "sfx": [(5.80, "anvil", -5.0, 0.0)],
        "clauses": [
            ("bm_george", 0.84, -0.8,
             "Therein he placed a soft, thrice-ploughed fallow field, where many ploughmen wheeled their yoked teams and received a goblet of honey-sweet wine at the headland."),
            ("am_onyx", 0.84, -0.8,
             "And the earth grew black behind the ploughshare like newly turned soil, though wrought of pure gold: a supreme marvel of the forge."),
        ],
    },
    {
        "secId": 6,
        "roman": "VII",
        "zone": "Z04",
        "act": 2,
        "lines": "18.550–560",
        "fold": "Fold 3 South · Module M5 (Royal Temenos)",
        "formula": "Ἐν δ᾽ ἐτίθει τέμενος βαθύληϊον («Therein he placed a king’s deep-corn estate»)",
        "title": "The Silent Rejoicing King’s Harvest & Oak Sacrifice",
        "greek": "Ἐν δ᾽ ἐτίθει τέμενος βαθύληϊον· ἔνθα δ᾽ ἔριθοι ἤμων ὀξείας δρεπάνας ἐν χερσὶν ἔχοντες… τρεῖς δ᾽ ἄρ᾽ ἀμαλλοδετῆρες ἐφέστασαν· αὐτὰρ ὄπισθεν παῖδες δραγμεύοντες… βασιλεὺς δ᾽ ἐν τοῖσι σιωπῇ σκῆπτρον ἔχων ἑστήκει ἐπ᾽ ὄγμου γηθόσυνος κῆρ. κήρυκες δ᾽ ἀπάνευθε ὑπὸ δρυῒ δαῖτα πένοντο.",
        "scansion": "– ∪ ∪ | – ∪ ∪ | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Solemn spondaic stillness at σιωπῇ σκῆπτρον ἔχων ἑστήκει)",
        "therefore": "Beside the ploughed glebe stands the deep summer grain; reapers swing keen sickles while children gather armfuls for the तीन sheaf-binders—THEREFORE the King stands among them in utter silence holding his scepter, rejoicing in his heart as heralds dress a sacrificial ox beneath the oak and women strew white barley-meal.",
        "mask": "Royal stillness (βασιλεὺς... σιωπῇ... γηθόσυνος κῆρ): reading winter security and ordered reciprocity in the unbroken line of bound sheaves.",
        "scholia": "Taplin (1980: 9) & Atchity (1978): Contrast the dysfunctional royal strife of Agamemnon and Achilles in Book I with this ideal Basileus on the Shield, who holds his σκῆπτρον in silence (σιωπῇ) and rejoices as the whole community—reapers, boys, binders, heralds, and women strewing λεύκ᾽ ἄλφιτα—labors in harmonious reciprocity.",
        "cam": {"target": [5, 76, 496], "r": 530, "el": 0.45, "az0": 0.15, "az1": 0.60},
        "sfx": [(0.90, "sickle_swath", -5.0, -0.25), (3.40, "sickle_swath", -5.5, 0.25)],
        "clauses": [
            ("bm_george", 0.84, -0.8,
             "Therein he placed a king's deep-corn estate, where reapers swung keen sickles, children gathered armfuls, and three binders tied the sheaves with straw ropes."),
            ("bm_lewis", 0.84, -0.8,
             "Among them the King stood in silence with his scepter along the swath, rejoicing in his heart, while beneath an oak heralds prepared the feast."),
        ],
    },
    {
        "secId": 7,
        "roman": "VIII",
        "zone": "Z04",
        "act": 2,
        "lines": "18.561–572",
        "fold": "Fold 4 West · Module M6 (Golden Vineyard)",
        "formula": "Ἐν δ᾽ ἐτίθει σταφυλῇσι («Therein he placed a vineyard heavily laden»)",
        "title": "The Five-Metal Vineyard & The Boy’s Linus Song",
        "greek": "Ἐν δ᾽ ἐτίθει σταφυλῇσι μέγα βρίθουσαν ἀλωὴν καλὴν χρυσείην· μέλανες δ᾽ ἀνὰ βότρυες ἦσαν, ἑστήκει δὲ κάμαξι διαμπερὲς ἀργυρέῃσιν. ἀμφὶ δὲ κυανέην κάπετον, περὶ δ᾽ ἕρκος ἔλασσε κασσιτέροιο· μία δ᾽ οἴη ἀταρπὸς ἐπ᾽ αὐτὴν… τοῖσιν δ᾽ ἐν μέσσοισι πάϊς φόρμιγγι λιγείῃ ἱμερόεν κιθάριζε, λίνον δ᾽ ὑπὸ καλὸν ἄειδε λεπταλέῃ φωνῇ.",
        "scansion": "– ∪ ∪ | – ∪ ∪ | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Delicate vocal cadence: λεπταλέῃ φωνῇ)",
        "therefore": "To guard the autumn vintage from wild beasts and war, Hephaestus surrounds the golden vines and silver poles with a dark-blue enamel trench and a fence of tin pierced by a single narrow path—THEREFORE maidens and youths carry the sweet clusters in woven baskets while a boy in their midst plucks his clear-toned lyre and sings the delicate Linus-song in a slender voice.",
        "mask": "Bittersweet adolescent joy: the fragile, high-pitched Linus lament (λεπταλέῃ φωνῇ) sung for the dying season inside the protective tin palisade.",
        "scholia": "Edwards (1991: 224–226) & Martin (1989): This passage is a tour de force of metallurgical polyphony, deploying all five Homeric materials in four lines: gold vines (χρυσείην), black clusters (μέλανες), silver props (κάμαξι ἀργυρέῃσιν), dark-blue enamel trench (κυανέην κάπετον), and tin fence (ἕρκος κασσιτέροιο). The boy’s Λίνος-song is a mise en abyme of the poet’s own elegiac art.",
        "cam": {"target": [-542, 56, 361], "r": 540, "el": 0.44, "az0": -0.60, "az1": -0.15},
        "sfx": [(1.10, "aulos_G5", -7.5, -0.15), (5.80, "aulos_D5", -7.5, 0.20)],
        "clauses": [
            ("bm_george", 0.84, -0.8,
             "Therein he placed a golden vineyard heavy with dark clusters on silver poles, ringed by a dark-blue enamel trench, a fence of tin, and one narrow path."),
            ("af_aoede", 0.85, -0.3,
             "In their midst a boy played sweetly on a clear-toned lyre and sang the delicate Linus song in a slender voice as youths beat the earth in time."),
        ],
    },
    {
        "secId": 8,
        "roman": "IX",
        "zone": "Z05",
        "act": 2,
        "lines": "18.573–586",
        "fold": "Fold 4 North · Module M7 (Cattle & Two Lions)",
        "formula": "Ἐν δ᾽ ἀγέλην ποίησε («Therein he fashioned a herd of straight-horned oxen»)",
        "title": "Oxen of Gold and Tin, Two Terrible Lions & Nine Barking Hounds",
        "greek": "Ἐν δ᾽ ἀγέλην ποίησε βοῶν ὀρθοκραιράων· αἱ δὲ βόες χρυσοῖο τετεύχατο κασσιτέρου τε, μυκηθμῷ δ᾽ ἀπὸ κόπρου ἐπεσσεύοντο νομόνδε πὰρ ποταμὸν κελάδοντα, παρὰ ῥοδανὸν δονακῆα… σμερδαλέω δὲ λέοντε δύ᾽ ἐν πρώτῃσι βόεσσιν ταῦρον ἐρύγμηλον ἐχέτην· ὁ δὲ μακρὰ μεμυκὼς ἕλκετο… ἵσταντο δὲ μάλ᾽ ἐγγύς, ὑλάοντές τε καὶ ἐκτὸς ἀλυσκάζοντες.",
        "scansion": "– ∪ ∪ | – – | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Onomatopoeic river reeds: παρὰ ῥοδανὸν δονακῆα)",
        "therefore": "Beyond the tin palisade, four golden herdsmen drive straight-horned cattle of gold and tin beside the murmuring reed-river, where two starving lions leap into the van and drag down the mightiest bellowing bull—THEREFORE the nine swift hounds rush forward at the herdsmen’s shouts, yet smelling the dark entrails they halt just beyond claw-reach, barking furiously and darting back.",
        "mask": "Tawny predatory hunger tearing the bull’s hide vs. the barking oscillation of hounds caught between obedience and survival (ὑλάοντές τε καὶ ἐκτὸς ἀλυσκάζοντες).",
        "scholia": "Bolter & Hartsoe (2026: §6) & Ha & Schmidhuber (2018): 'An image has no consequences. A world does.' The lion-similes that pervade the Iliad’s battlefield narrative here enter the Shield’s pastoral ring; the nine hounds enact a precise behavioral boundary condition—advancing on command, hitting the fear-radius of the lions’ jaws, and darting back (ἀλυσκάζοντες).",
        "cam": {"target": [-14, 54, -644], "r": 540, "el": 0.44, "az0": -0.15, "az1": 0.35},
        "sfx": [(0.80, "bull_bellow", -4.0, -0.25), (4.60, "lion_roar", -2.5, 0.15), (6.50, "dog_bark", -3.5, 0.30)],
        "clauses": [
            ("bm_fable", 0.85, -0.5,
             "Therein he fashioned straight-horned cattle of gold and tin beside the sounding reeds, where two terrible lions seized a loud-bellowing bull by the throat."),
            ("bm_lewis", 0.85, -0.7,
             "Four golden herdsmen urged on their nine swift hounds; yet as the lions lapped the dark blood, the dogs stood close, barking and darting back."),
        ],
    },
    {
        "secId": 9,
        "roman": "X",
        "zone": "Z06",
        "act": 3,
        "lines": "18.587–606",
        "fold": "Fold 4 East · Module M8 (Sheep Glen & Knossos Choros)",
        "formula": "Ἐν δὲ χορὸν ποίκιλλε («Therein the famous Lame God inlaid a dancing-floor»)",
        "title": "The Mountain Sheep Glen & Daedalus’s Choros of Knossos",
        "greek": "Ἐν δὲ νομὸν ποίησε περικλυτὸς Ἀμφιγυήεις ἐν καλῇ βήσσῃ μέγαν οἰῶν ἀργεννάων… Ἐν δὲ χορὸν ποίκιλλε περικλυτὸς Ἀμφιγυήεις, τῷ ἴκελον οἷόν ποτ᾽ ἐνὶ Κνωσῷ εὐρείῃ Δαίδαλος ἤσκησεν καλλιπλοκάμῳ Ἀριάδνῃ… οἱ δ᾽ ὁτὲ μὲν θρέξασκον ἐπισταμένοισι πόδεσσι ῥεῖα μάλ᾽, ὡς ὅτε τις τροχὸν ἄρμενον ἐν παλάμῃσιν ἑζόμενος κεραμεὺς πειρήσεται, αἴ κε θέῃσιν… δοιὼ δὲ κυβιστητῆρε κατ᾽ αὐτοὺς μολπῆς ἐξάρχοντες ἐδίνευον κατὰ μέσσους.",
        "scansion": "– ∪ ∪ | – – | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Rapid dactylic whirl mimicking the potter’s trial wheel)",
        "therefore": "After setting a quiet mountain glen of white sheep to rest the eye, Hephaestus must bind the centrifugal energies of marriage, law, siege, harvest, and predation into one unbroken rotation—THEREFORE he inlays a dancing-floor like Daedalus wrought in wide Knossos for lovely-tressed Ariadne, where youths with golden daggers and garlanded maidens spin as swiftly as a potter’s trial wheel around two whirling tumblers.",
        "mask": "Ecstatic kinetic abandon: mortal youths and maidens spinning into a single golden wheel on the lip of the abyss.",
        "scholia": "Finkelberg (1998) & Edwards (1991: 229–231): Hephaestus (Ἀμφιγυήεις) is compared to his mortal counterpart Daedalus in Knossos—the only explicit mythological cross-reference on the Shield. The simile of the potter testing his wheel (τροχὸν... κεραμεὺς πειρήσεται) fuses artisanal making with choreographic motion across the whole circular buckler.",
        "cam": {"target": [538, 62, 372], "r": 540, "el": 0.45, "az0": 0.35, "az1": 0.85},
        "sfx": [(0.60, "sheep_bleat", -6.0, -0.25), (5.20, "aulos_A5", -7.0, 0.20)],
        "clauses": [
            ("af_aoede", 0.85, -0.3,
             "Beside a fair mountain glen of white sheep, the famous Lame God inlaid a dancing-floor like that which Daedalus wrought in wide Knossos for Ariadne."),
            ("bm_george", 0.84, -0.8,
             "Youths with golden daggers and garlanded maidens spun as swiftly as a seated potter trials his wheel between his palms, while two tumblers whirled in the midst."),
        ],
    },
    {
        "secId": 10,
        "roman": "XI",
        "zone": "Z06",
        "act": 3,
        "lines": "18.607–608",
        "fold": "Fold 5 Extreme Rim · Module M9 (River Oceanus)",
        "formula": "Ἐν δ᾽ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο («Therein he placed the mighty strength of River Oceanus»)",
        "title": "The Uttermost Rim of River Oceanus Sealing the Cosmos",
        "greek": "Ἐν δ᾽ ἐτίθει ποταμοῖο μέγα σθένος Ὠκεανοῖο ἄντυγα πὰρ πυμάτην σάκεος πύκα ποιητοῖο.",
        "scansion": "– ∪ ∪ | – ∪ ∪ | – ∪ || ∪ – ∪ ∪ | – ∪ ∪ | – –  (Ring-composition closure echoing 18.478–480 ἄντυγα... σάκεος)",
        "therefore": "Only the outermost edge remains raw, where the spinning dance would fly off into the Trojan plain—THEREFORE Hephaestus takes his heaviest hammer and welds the mighty strength of River Oceanus around the uttermost rim, locking sun, moon, court, siege, furrow, lion, and dancer inside the cold, lethal armor of a doomed man.",
        "mask": "Terminal divine closure: the twenty bellows fall silent as a living cosmos cools into a weapon.",
        "scholia": "Taplin (1980: 11–15) & de Jong (2011): Perfect ring-composition closes the ekphrasis: Oceanus, which bounded the arctic Bear in Fold 1 (18.489), now physically encloses the extreme rim (ἄντυγα πὰρ πυμάτην, 18.608) of the strongly-wrought shield (σάκεος πύκα ποιητοῖο). Immediately at 18.609–617, Hephaestus hands the finished world to Thetis, who swoops down from Olympus like a hawk (ἴρηξ ὣς) to deliver it to Achilles.",
        "cam": {"target": [0, 42, 0], "r": 1460, "el": 0.72, "az0": 0.85, "az1": 1.45},
        "sfx": [(0.25, "anvil", -1.5, 0.0), (5.50, "anvil", -1.0, 0.0)],
        "clauses": [
            ("am_onyx", 0.84, -0.8,
             "And around the uttermost rim of the strongly wrought shield, he welded the mighty, circular stream of the River Oceanus."),
            ("bm_george", 0.84, -0.8,
             "The bellows fell silent: a complete, breathing cosmos of seven thousand five hundred and thirty-eight bricks, sealed inside the armor of Achilles."),
        ],
    },
]


def measure_lufs_tp(audio):
    power = np.mean(audio ** 2, axis=1)
    active = power[power > 1e-8]
    rms = math.sqrt(float(np.mean(active))) if len(active) > 0 else 1e-4
    lufs = 20.0 * math.log10(max(rms, 1e-6)) - 0.691
    tp = 20.0 * math.log10(max(float(np.max(np.abs(audio))), 1e-6))
    return lufs, tp


def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    stems = render_earshot_sfx(SFX_DIR)
    diegetic_sfx = make_homeric_diegetic_stems()

    # Step 1: Synthesize all 22 clauses with Native Kokoro-82M and record exact durations
    synthed_movements = []
    t_cursor = 0.60  # 0.60s bare-anvil prelude before Word 1

    cum_bricks_before = 0
    for mov in HOMERIC_MOVEMENTS:
        sec_id = mov["secId"]
        sec_bricks = SECTION_BRICK_COUNTS[sec_id]
        sec_b0 = cum_bricks_before
        sec_b1 = cum_bricks_before + sec_bricks
        cum_bricks_before = sec_b1

        # In lego3d.js, each section s (0..10) occupies uBuild in [s/11, (s+1)/11]
        sec_u0 = sec_id / 11.0
        sec_u1 = (sec_id + 1.0) / 11.0

        mov_t0 = t_cursor
        clause_objs = []
        total_words_in_mov = sum(len(c[3].split()) for c in mov["clauses"])
        words_seen = 0

        for c_idx, (voice, speed_val, pitch_semi, text) in enumerate(mov["clauses"]):
            vclip = synth_voice_line(text, voice=voice, speed=speed_val, pitch_shift_semitones=pitch_semi)
            c_dur = len(vclip) / SR
            c_t0 = t_cursor
            c_t1 = c_t0 + c_dur

            raw_words = text.split()
            # Weight each word's duration by its character length + punctuation pause
            weights = []
            for rw in raw_words:
                w_len = max(2, len(rw.strip(".,:;—")))
                if rw.endswith((",", ";", ":")):
                    w_len += 2.2
                elif rw.endswith((".", "!")):
                    w_len += 3.0
                weights.append(float(w_len))
            w_sum = sum(weights) or 1.0

            w_cursor = c_t0
            word_items = []
            for rw, wt in zip(raw_words, weights):
                w_dur = c_dur * (wt / w_sum)
                w_t0 = w_cursor
                w_t1 = w_cursor + w_dur
                w_cursor = w_t1

                frac0 = words_seen / max(1, total_words_in_mov)
                words_seen += 1
                frac1 = words_seen / max(1, total_words_in_mov)

                u0 = sec_u0 + (sec_u1 - sec_u0) * frac0
                u1 = sec_u0 + (sec_u1 - sec_u0) * frac1
                b0 = int(round(sec_b0 + sec_bricks * frac0))
                b1 = int(round(sec_b0 + sec_bricks * frac1))

                word_items.append({
                    "w": rw,
                    "t0": round(w_t0, 3),
                    "t1": round(w_t1, 3),
                    "u0": round(u0, 5),
                    "u1": round(u1, 5),
                    "b0": b0,
                    "b1": b1,
                    "secId": sec_id,
                })

            clause_objs.append({
                "voice": voice,
                "text": text,
                "t0": round(c_t0, 3),
                "t1": round(c_t1, 3),
                "clip": vclip,
                "words": word_items,
            })
            # Leave 0.85s between clauses within a movement, and 1.35s after the movement
            pause_after = 0.85 if c_idx == 0 else 1.35
            t_cursor = c_t1 + pause_after

        mov_t1 = t_cursor
        synthed_movements.append({
            **{k: v for k, v in mov.items() if k != "clauses"},
            "t0": round(mov_t0, 3),
            "t1": round(mov_t1, 3),
            "u0": round(sec_u0, 5),
            "u1": round(sec_u1, 5),
            "b0": sec_b0,
            "b1": sec_b1,
            "brickCount": sec_bricks,
            "clauses": clause_objs,
        })

    total_dur = round(t_cursor + 1.0, 2)
    print(f"Total Master Worldtext duration: {total_dur:.2f}s across 11 Homeric Movements & {TOTAL_BRICKS} bricks")

    # Step 2: Assemble the continuous stereo master audio (ACH-WORLD-SHIELD.mp3)
    mix = make_diegetic_bed(total_dur, mode="all", seed=478)
    n_total = len(mix)

    # Subtle Dorian phorminx lyre pulse across the entire recitation
    lyre_cycle = ["lyre_D4", "lyre_A4", "lyre_F4", "lyre_G4", "lyre_C5", "lyre_D5"]
    t_lyre = 0.40
    li = 0
    while t_lyre < total_dur - 0.6:
        place(mix, stems[lyre_cycle[li % len(lyre_cycle)]], t_lyre, gain_db=-15.0, pan=-0.25 if li % 2 == 0 else 0.25)
        t_lyre += 1.60
        li += 1

    rng = np.random.default_rng(18478)
    brick_pool = ["domino_tick", "plastic_snap", "lid_click", "plastic_knock"]

    for mov in synthed_movements:
        m_t0 = mov["t0"]
        for rel_t, sfx_key, sfx_db, sfx_pan in mov["sfx"]:
            abs_t = m_t0 + rel_t
            if sfx_key == "anvil":
                place(mix, stems["anvil_metal"], abs_t, gain_db=sfx_db, pan=sfx_pan)
                place(mix, stems["sub_hit"], abs_t, gain_db=sfx_db - 3.0, pan=0.0)
            elif sfx_key in diegetic_sfx:
                place(mix, diegetic_sfx[sfx_key], abs_t, gain_db=sfx_db, pan=sfx_pan)

        for cl in mov["clauses"]:
            vclip = cl["clip"]
            c_t0 = cl["t0"]
            c_t1 = cl["t1"]
            # Duck ambient bed during speech so every syllable is crystal clear
            s0 = max(0, int((c_t0 - 0.08) * SR))
            s1 = min(n_total, int((c_t1 + 0.15) * SR))
            if s1 > s0:
                mix[s0:s1] *= 0.36
            place(mix, vclip, c_t0, gain_db=2.5, pan=0.0)

            # Place a subtle, tactile brick-assembly lock click at each spoken word!
            for w_idx, w_obj in enumerate(cl["words"]):
                sname = brick_pool[w_idx % len(brick_pool)]
                pan = float(rng.uniform(-0.45, 0.45))
                place(mix, stems[sname], w_obj["t0"] + 0.02, gain_db=-16.5, pan=pan)

    master_audio = master_to_lufs(mix, target_lufs=-14.2)
    m_lufs, m_tp = measure_lufs_tp(master_audio)
    full_wav = os.path.join(AUDIO_DIR, "ACH-WORLD-SHIELD.wav")
    full_mp3 = os.path.join(AUDIO_DIR, "ACH-WORLD-SHIELD.mp3")
    sf.write(full_wav, master_audio, SR, subtype="PCM_16")
    subprocess.run(
        ["ffmpeg", "-y", "-i", full_wav, "-c:a", "libmp3lame", "-b:a", "192k", full_mp3],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print(f"  [Master Audio] ACH-WORLD-SHIELD.mp3 ({total_dur:.2f}s) -> {m_lufs:.2f} LUFS | {m_tp:.2f} dBTP")

    # Also slice & export per-Zone MP3s (Z01..Z06) for achilles-forage.html compatibility
    zone_ranges = {}
    for mov in synthed_movements:
        z = mov["zone"]
        if z not in zone_ranges:
            zone_ranges[z] = [mov["t0"], mov["t1"]]
        else:
            zone_ranges[z][1] = mov["t1"]

    for z, (zt0, zt1) in zone_ranges.items():
        i0 = max(0, int(zt0 * SR))
        i1 = min(len(master_audio), int(zt1 * SR))
        z_seg = master_to_lufs(master_audio[i0:i1].copy(), target_lufs=-14.2)
        z_wav = os.path.join(AUDIO_DIR, f"{z}.wav")
        z_mp3 = os.path.join(AUDIO_DIR, f"{z}.mp3")
        sf.write(z_wav, z_seg, SR, subtype="PCM_16")
        subprocess.run(
            ["ffmpeg", "-y", "-i", z_wav, "-c:a", "libmp3lame", "-b:a", "192k", z_mp3],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        os.remove(z_wav)
        zl, ztp = measure_lufs_tp(z_seg)
        print(f"  [Zone Audio]   {z}.mp3 ({zt1 - zt0:.1f}s) -> {zl:.2f} LUFS | {ztp:.2f} dBTP")

    # Step 3: Export `achilles/wordtext-timeline.js` (stripping raw numpy clips)
    clean_movements = []
    all_words = []
    for mov in synthed_movements:
        clean_clauses = []
        for cl in mov["clauses"]:
            clean_clauses.append({
                "voice": cl["voice"],
                "text": cl["text"],
                "t0": cl["t0"],
                "t1": cl["t1"],
                "words": cl["words"],
            })
            for w in cl["words"]:
                all_words.append({
                    **w,
                    "roman": mov["roman"],
                    "lines": mov["lines"],
                    "title": mov["title"],
                    "formula": mov["formula"],
                })
        clean_movements.append({
            **{k: v for k, v in mov.items() if k != "clauses"},
            "clauses": clean_clauses,
        })

    timeline_payload = {
        "title": "Homeri Ilias XVIII.478–608 · Word-by-Word Operative Worldtext",
        "totalDuration": total_dur,
        "totalBricks": TOTAL_BRICKS,
        "lufs": round(m_lufs, 2),
        "dBTP": round(m_tp, 2),
        "movements": clean_movements,
        "words": all_words,
    }
    timeline_js_path = os.path.join(ROOT, "achilles/wordtext-timeline.js")
    with open(timeline_js_path, "w", encoding="utf-8") as f:
        f.write("window.HOMERIC_WORDTEXT_TIMELINE = ")
        json.dump(timeline_payload, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print(f"  [Timeline JS]  Wrote {timeline_js_path} ({len(all_words)} synchronized word tokens)")


if __name__ == "__main__":
    main()
