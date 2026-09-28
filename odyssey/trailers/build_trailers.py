"""odyssey/trailers/build_trailers.py: writes odyssey/trailers/<id>.json and <id>.md from the shot lists below; then run
tools/forage/product/trailers.py to check them and write the page.
Every voice clip is cut from a verified segment (vb.clip); every 'at' is summed here so the cut adds up by construction."""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from vb import clip

OUT = os.path.dirname(os.path.abspath(__file__))
HW = 'audio/'
TD, BC, HC = 'TITANS DESCENT', 'BRONZE COUNCIL', 'HOMECOMING'
def track(album, name):
    files = {TD: f"Titan’s Descent - {name} - Treblo.ogg", BC: f"Bronze Council, Waking Son - {name} - Treblo.ogg", HC: f"The Odyssey Homecoming - {name} - Treblo.ogg"}
    return HW + album + '/' + files[album]

# ── looks (overrides on the key's own look; null = as filmed) ──
DUSK = {"time": "dusk", "sky": ["#1b2233", "#d98a4a"], "fog": [300, 1400], "exposure": 0.85,
        "key": {"from": "low, behind the subject (backlight)", "elev_deg": 6, "color": "#ffb070", "intensity": 2.2, "shadow": True},
        "note": "hard low sun, long shadows, figures to silhouette"}
HAZE = {"time": "late afternoon", "sky": ["#c9c3b2", "#efe6d0"], "fog": [220, 1100], "exposure": 0.9,
        "key": {"from": "low right", "elev_deg": 12, "color": "#ffd9a0", "intensity": 1.8, "shadow": True},
        "note": "haze over the primaries; the gods as a distant bright room"}
NIGHT = {"time": "night", "sky": ["#04060b", "#17233a"], "fog": [380, 1700], "exposure": 0.8,
         "key": {"from": "moon, high left", "color": "#9fb4ff", "intensity": 0.9, "shadow": True}, "note": "blue night, one warm practical if the set has one"}
STORM = {"time": "storm night", "sky": ["#020306", "#10141c"], "fog": [180, 900], "exposure": 0.8,
         "key": {"from": "lightning, above", "color": "#dfe8ff", "intensity": 3.0, "flash": "2 flashes, 3 frames each"}, "note": "black sky, rain streak off"}
LAMP = {"time": "night interior", "exposure": 0.85, "key": {"from": "the lamp/torch practical", "color": "#ff9a4a", "intensity": 1.6, "shadow": True},
        "fill": {"sky": "#223044", "ground": "#140f0b", "intensity": 0.18}, "note": "one warm source, the rest falls to black"}
EMBER = {"time": "dusk to night", "sky": ["#120c0a", "#5a2a14"], "fog": [260, 1200], "exposure": 0.85, "key": {"from": "embers of the burning camp, low", "color": "#ff7a2e", "intensity": 1.6}}

CARD = {
    'nolan': {"style": "nolan", "type": "serif capitals, wide tracking, small (4% of frame height), centred", "color": "#e9e5da on #000", "fade_in": 0.4, "fade_out": 0.6},
    'nolan-title': {"style": "nolan-title", "type": "serif capitals, wide tracking, 9% of frame height", "color": "#f2eee4 on #000", "fade_in": 0.0, "fade_out": 1.0},
    'brick': {"style": "brick", "type": "letters built from 1x2 plates that snap on stud by stud (12 fps), primary colours", "color": "red/yellow/blue plates on #000", "fade_in": 0.0, "fade_out": 0.0},
    'bronze': {"style": "bronze", "type": "engraved serif capitals, gold leaf, slow 3% push", "color": "#d8b25a on #050403", "fade_in": 0.2, "fade_out": 0.5},
}

def mv(t, amount=0.0, ease='inOut', **kw):
    d = {"type": t, "amount": amount, "ease": ease}; d.update(kw); return d

def S(kind, dur, scene=None, key=None, kit=None, still=None, move=None, action='', actors=(), look=None, voice=None, vat=0.3,
      sfx=(), card=None, why='', silence=False, note=None):
    s = {"kind": kind, "dur": round(dur, 2)}
    if kind == 'SCENE':
        s.update(scene=scene, key=key, still=f"../keyframes/{scene}/{key}.png",
                 camera={"from": key, **({"move": move} if move else {"move": mv('hold')})})
    elif kind == 'KIT':
        s.update(kit=kit, still=f"../kits/{still}", key=None, camera={"kit_still": still, **({"move": move} if move else {"move": mv('hold')})})
    else:
        s.update(key=None, camera=None)
    s["action"] = action; s["actors"] = list(actors); s["look"] = look
    if voice:
        v = dict(voice); v["at"] = round(vat, 2); s["voice"] = v
    else:
        s["voice"] = None
    s["sfx"] = list(sfx); s["card"] = card; s["why"] = why
    if silence: s["silence"] = True
    if note: s["note"] = note
    return s

def build(tid, title, register, idea, rules, music, silences, shots, checks, hits):
    t = 0.0
    for i, s in enumerate(shots):
        s["n"] = i + 1; s["at"] = round(t, 2); t += s["dur"]
    runtime = round(t, 2)
    order = ["n", "at", "dur", "kind", "scene", "kit", "key", "still", "camera", "action", "actors", "look", "voice", "sfx", "card", "why", "silence", "note"]
    shots = [{k: s[k] for k in order if k in s} for s in shots]
    doc = {"id": tid, "title": title, "register": register, "runtime": runtime, "idea": idea, "rules": rules,
           "music": music, "silences": silences, "hits": hits, "shots": shots, "checks": checks,
           "sources": {"voice": "odyssey-halfworld/drive/voice-manifest.json + drive/voice/<scene>.m4a (gi = index into drive-script.json scene segments)",
                       "words": "the recorded words, verified per clip by forced alignment (see lines.json); DIALOGUE turns are spoken-lines.json unless the recording is the drive-script summary",
                       "music": "odyssey-halfworld/audio/<album>/<file>; in/out in track seconds, at in trailer seconds; hit times measured from 10 ms RMS (see REFERENCE.md, music method)"}}
    json.dump(doc, open(f"{OUT}/{tid}.json", "w"), indent=1, ensure_ascii=False)
    write_md(doc)
    return doc

def fmt(t): return f"{int(t//60)}:{t%60:05.2f}"

def write_md(d):
    L = [f"# {d['title']}", "", f"*{d['register']}* · {d['runtime']:.2f} s · {len(d['shots'])} shots", "", "## The idea", "", d['idea'], "",
         "## Rules this cut follows", ""]
    L += [f"{i+1}. {r}" for i, r in enumerate(d['rules'])]
    L += ["", "## Music", "", "| trailer | track | in → out (track s) | gain | note |", "|---|---|---|---|---|"]
    for m in d['music']:
        L.append(f"| {fmt(m['at'])} → {fmt(m['at']+m['out']-m['in'])} | {m['album']} · {m['track']} | {m['in']:.2f} → {m['out']:.2f} | {m['gain']} dB | {m['note']} |")
    for s in d['silences']:
        L.append(f"| {fmt(s['at'])} → {fmt(s['at']+s['dur'])} | *silence* | | | {s['why']} |")
    L += ["", "Hits placed on cuts:", ""]
    L += [f"- {fmt(h['trailer'])} ← {h['track']} at {h['t']:.2f} s: {h['what']}" for h in d['hits']]
    L += ["", "## Script", "", "| time | picture | sound |", "|---|---|---|"]
    for s in d['shots']:
        if s['kind'] == 'SCENE': pic = f"**{s['scene']} {s['key']}** · {s['action']}"
        elif s['kind'] == 'KIT': pic = f"**KIT {s['kit']}** · {s['action']}"
        elif s['kind'] == 'CARD': pic = f"**CARD** “{s['card']['text']}” · {s['action']}".rstrip(' ·')
        else: pic = f"**BLACK** {s['action']}".rstrip()
        mvx = s['camera']['move'] if s.get('camera') else None
        if mvx and mvx['type'] != 'hold': pic += f" · camera {mvx['type']} {mvx['amount']}"
        snd = []
        if s['voice']:
            v = s['voice']; snd.append(f"{v['speaker'].upper()}: “{v['words']}” ({v['scene']} gi {v['gi']}, {v['clip']['in']:.2f}–{v['clip']['out']:.2f})")
        if s['sfx']: snd.append('sfx: ' + ', '.join(s['sfx']))
        if s.get('silence'): snd.append('*no music*')
        L.append(f"| {fmt(s['at'])} ({s['dur']:.2f}) | {pic} | {' · '.join(snd) or '—'} |")
    L += ["", "## Why each shot", ""]
    L += [f"{s['n']}. {s['why']}" for s in d['shots']]
    open(f"{OUT}/{d['id']}.md", "w").write('\n'.join(L) + '\n')

# ═══════════════════════════════ A. THE LONG WAY HOME ═══════════════════════════════
def A():
    athena1 = clip('OD-B01-S01', 5, 'It is Odysseus my heart breaks for')
    athena2 = clip('OD-B01-S01', 5, "wise unlucky Odysseus held against his will on Calypso's island", "wise, unlucky Odysseus, held against his will on Calypso's island")
    athena3 = clip('OD-B01-S01', 5, 'longing only for the sight of smoke rising from his own hearth')
    home = clip('OD-B05-S03', 7, 'every day I long for home and the hour of my return')
    curse1 = clip('OD-B09-S11', 6, 'grant that Odysseus sacker of cities never reach his home', 'grant that Odysseus, sacker of cities, never reach his home.')
    curse2 = clip('OD-B09-S11', 6, 'or if he must let him come late and broken', 'Or if he must, let him come late and broken,')
    curse3 = clip('OD-B09-S11', 6, "on a stranger's ship all his comrades lost", "on a stranger's ship, all his comrades lost")
    tir = clip('OD-B11-S03', 3, 'you seek a honey sweet homecoming but a god will make it bitter', 'You seek a honey-sweet homecoming, but a god will make it bitter.')
    row = clip('OD-B12-S04', 3, 'row friends we have been in worse and lived and this too we shall remember', 'Row, friends — we have been in worse and lived, and this too we shall remember.')
    argos = clip('OD-B17-S03', 4, 'after twenty years', 'After twenty years')
    loom = clip('OD-B02-S02', 3, 'she unraveled it thread by thread', 'she unraveled it thread by thread.')
    nurse = clip('OD-B23-S01', 2, 'the man you have mourned twenty years is sitting by his own fire', 'The man you have mourned twenty years is sitting by his own fire.')
    decree = clip('OD-B05-S01', 3, 'Odysseus goes home', 'Odysseus goes home.')
    C = CARD['nolan']
    shots = [
        S('BLACK', 1.2, action='black; wind over sand', sfx=['wind, low'], why='Silence first: the trailer starts before the music does; the first drum is the first cut.'),
        S('SCENE', 4.8, 'OD-B08-S05', 'K1', move=mv('push', 0.05), look=EMBER, actors=['horse'],
          action='nothing moves but smoke from the burned tents and the surf; the wooden horse stands alone on the shore, the fleet small on the water',
          sfx=['surf', 'embers crackle', 'wind'], why='The war is over: one enormous object on an empty shore (the Nolan graves-in-the-dunes frame, in bricks).'),
        S('CARD', 5.0, card={"text": "TEN YEARS AT WAR.", **C}, action='', sfx=['single low drum (the score\'s)'], why='Time is the subject; the card lands on the second drum.'),
        S('SCENE', 5.0, 'OD-B12-S07', 'K5', move=mv('pull', 0.12), look=NIGHT, actors=['odysseus', 'fig', 'whirl'],
          action='odysseus hangs from the fig tree over the whirlpool; the camera pulls back until he is a speck against the black',
          sfx=['whirlpool, far below', 'wind'], why='One man, very small, in a great dark: scale through a tiny figure against vast ground.'),
        S('CARD', 5.0, card={"text": "TEN YEARS AT SEA.", **C}, sfx=['single low drum (the score\'s)'], why='The second decade; the fourth drum.'),
        S('SCENE', 5.05, 'OD-B01-S01', 'K1', move=mv('crane', -0.08, note='down, slow'), look=HAZE, actors=['zeus', 'athena', 'assembly-of-gods-1'],
          action='the gods sit in their ring; athena stands and turns to zeus', voice=athena1, vat=1.0,
          sfx=['high wind', 'no music under the line but the swell'], why='Someone remembers him: the gods, far off and bright, and the first spoken line.'),
        S('SCENE', 6.45, 'OD-B05-S05', 'K1', move=mv('push', 0.04), look=NIGHT, actors=['odysseus', 'raft'],
          action='odysseus at the steering oar of the raft under the stars; the sail barely moves', voice=athena2, vat=0.25,
          sfx=['water on logs', 'rope creak'], why='Held against his will: the raft on a black sea, a man steering by the stars.'),
        S('SCENE', 6.0, 'OD-B10-S01', 'K3', move=mv('push', 0.05), look=DUSK, actors=['odysseus', 'bag'],
          action='odysseus asleep at the helm at dusk; on the horizon, the watch-fires of Ithaca', voice=athena3, vat=0.5,
          sfx=['sea, calm', 'distant fire'], why='The thing he longs for is in the frame and he is asleep: memory and loss in one image.'),
        S('SCENE', 6.0, 'OD-B05-S04', 'K2', move=mv('track', 0.06, note='left to right, at shoulder height'), look=HAZE, actors=['odysseus', 'axe', 'trunk'],
          action='odysseus swings the axe; a trunk falls; he does not stop', voice=home, vat=0.4,
          sfx=['axe on wood', 'tree fall, soft'], why='Sincerity: the longing said plainly, over a man building his own way home.'),
        S('SCENE', 5.5, 'OD-B09-S11', 'K4', move=mv('crane', 0.10, note='up, past the giant to the sky'), look=NIGHT, actors=['polyphemus', 'odysseus'],
          action='polyphemus lifts both hands to the sky', voice=curse1, vat=0.35, sfx=['sea wind', 'far thunder'],
          why='The curse that makes the way long: a giant against the sky, the camera rising with his prayer.'),
        S('SCENE', 4.5, 'OD-B12-S07', 'K3', look=STORM, actors=['odysseus', 'drowning-crew-1', 'fire'],
          action='the lightning strikes the mast; the crew throw up their arms', voice=curse2, vat=0.3, sfx=['thunder crack', 'mast splinters'],
          why='The curse answered, one image per clause.'),
        S('SCENE', 4.5, 'OD-B12-S04', 'K5', move=mv('crane', 0.08, note='up with the taken men'), look=NIGHT, actors=['scylla', 'six-seized-sailors-1', 'odysseus'],
          action='the six men are lifted up the cliff; odysseus, below, raises his bow and cannot shoot', voice=curse3, vat=0.3,
          sfx=['the men calling his name, far'], why='All his comrades lost: seen from below, the way he saw it.'),
        S('SCENE', 7.5, 'OD-B11-S01', 'K3', move=mv('push', 0.06), look=NIGHT, actors=['odysseus', 's0', 's1', 's2'],
          action='odysseus holds the sword up against the pale crowd of the dead; none of them moves', voice=tir, vat=0.3,
          sfx=['the dead, a whisper chorus', 'no wind'], why='The prophecy spoken in the land of the dead: a quiet line, a still image.'),
        S('SCENE', 7.5, 'OD-B12-S04', 'K1', move=mv('pull', 0.10), look=NIGHT, actors=['odysseus', 'spout', 'six-seized-sailors-2'],
          action='the ship rows between the rock and the spout of the whirlpool; the oars dip together', voice=row, vat=0.3,
          sfx=['oars', 'whirlpool roar'], why='Endurance, and memory as consolation: the line the whole cut turns on.'),
        S('CARD', 3.0, card={"text": "THE LONG WAY HOME.", **C}, sfx=['single low drum'], why='The third movement is named.'),
        S('SCENE', 5.5, 'OD-B13-S01', 'K4', move=mv('track', 0.05, note='alongside, matching the ship'), look=NIGHT, actors=['odysseus', 'rug', 'phaeacian-convoy-crew-1'],
          action='the convoy ship runs at night; odysseus asleep on the rug in the stern', sfx=['oars', 'hull through water'],
          why='He comes home asleep: no line, the picture carries it.'),
        S('SCENE', 5.5, 'OD-B17-S03', 'K2', move=mv('push', 0.05), look=DUSK, actors=['argos', 'odysseus-as-beggar'],
          action='old Argos lifts his head on the heap; the beggar stands still', voice=argos, vat=1.6, sfx=['wind in the gate', 'one faint whine'],
          why='Twenty years measured by a dog: the most sincere image in the poem.'),
        S('SCENE', 6.0, 'OD-B02-S02', 'K3', move=mv('push', 0.04), look=LAMP, actors=['penelope-at-the-loom', 'loom'],
          action='penelope, alone, pulls the threads out of the web by torchlight', voice=loom, vat=0.2, sfx=['thread drawn', 'torch'],
          why='The one who waited: her work is unmaking time.'),
        S('SCENE', 5.0, 'OD-B19-S04', 'K3', move=mv('push', 0.06), look=LAMP, actors=['eurycleia', 'odysseus-as-beggar', 'basin'],
          action="the nurse's hands find the scar on the beggar's leg; she freezes", voice=nurse, vat=0.2, sfx=['water in the basin'],
          why='Recognition, in the words of the one who recognises him.'),
        S('SCENE', 2.0, 'OD-B21-S07', 'K2', look=NIGHT, actors=['odysseus', 'axes'],
          action='odysseus draws the string; it sings', sfx=['bowstring, a swallow-note', 'thunder, far'],
          why='The build peaks on the bow; the score is at its loudest.'),
        S('BLACK', 1.8, action='black', sfx=['a breath'], silence=True, why='Silence before the drop.'),
        S('SCENE', 2.4, 'OD-B22-S01', 'K1', look=LAMP, actors=['odysseus-revealed', 'arrows', 'telemachus'],
          action='rags off, odysseus on the threshold, the arrows poured at his feet', sfx=['score slam'], why='The drop: the beggar becomes the king.'),
        S('SCENE', 2.4, 'OD-B21-S07', 'K4', look=LAMP, actors=['arrow', 'axes', 'odysseus'],
          action='the arrow goes through the twelve axe-heads', sfx=['arrow through iron, twelve ticks'], why='The feat, one image.'),
        S('SCENE', 2.5, 'OD-B22-S01', 'K2', look=LAMP, actors=['odysseus-revealed', 'antinous', 'arrow'],
          action='antinous lifts the cup; the arrow takes him', sfx=['cup falls'], why='The reckoning, one image; the slam ends with it.'),
        S('SCENE', 5.5, 'OD-B23-S04', 'K5', move=mv('push', 0.05), look=LAMP, actors=['odysseus', 'penelope', 'eurycleia'],
          action='husband and wife hold each other by the bed built round the olive; the lamp; dawn held back', voice=decree, vat=1.5,
          sfx=['lamp flame', 'room tone'], silence=True, why='The end of the long way, said as the gods decreed it at the start.'),
        S('CARD', 4.4, card={"text": "THE ODYSSEY", **CARD['nolan-title']}, sfx=['single low drum'], silence=True, why='Title on one drum, then nothing.'),
    ]
    music = [
        {"file": track(TD, 'Trial of the Bow'), "album": "TITANS DESCENT", "track": "Trial of the Bow", "in": 0.0, "out": 27.5, "at": 0.0, "gain": -2, "fade_in": 0.0, "fade_out": 1.45,
         "note": "the four single drums (peaks 1.20, 6.00, 11.00, 16.00) and the hit at 26.05; each drum decays to near-silence (-48 LUFS) before the next"},
        {"file": track(TD, 'The King of Ithaca'), "album": "TITANS DESCENT", "track": "The King of Ithaca", "in": 41.05, "out": 116.0, "at": 26.05, "gain": -3, "fade_in": 1.2, "fade_out": 0.0, "xfade": True,
         "note": "the long build: -21 LUFS at 41 to -8 at 113-116; cut exactly as the peak ends (116.00) so the silence is a true stop; ducked 9 dB under every voice clip"},
        {"file": track(TD, 'Hearthside Soul'), "album": "TITANS DESCENT", "track": "Hearthside Soul", "in": 184.65, "out": 192.4, "at": 102.8, "gain": -1, "fade_in": 0.0, "fade_out": 0.6,
         "note": "the slam after silence: onset 184.70, a 7 s block at -8 LUFS that cuts off by itself at 191.5; the three drop shots live inside it"},
    ]
    silences = [{"at": 101.0, "dur": 1.8, "why": "silence before the drop"}, {"at": 110.55, "dur": 9.45, "why": "the ending plays on room tone and one drum"}]
    hits = [{"trailer": 1.2, "track": "Trial of the Bow", "t": 1.2, "what": "drum 1: first image"},
            {"trailer": 6.0, "track": "Trial of the Bow", "t": 6.0, "what": "drum 2: card TEN YEARS AT WAR"},
            {"trailer": 11.0, "track": "Trial of the Bow", "t": 11.0, "what": "drum 3: the man on the fig tree"},
            {"trailer": 16.0, "track": "Trial of the Bow", "t": 16.0, "what": "drum 4: card TEN YEARS AT SEA"},
            {"trailer": 26.05, "track": "Trial of the Bow", "t": 26.05, "what": "the hit: the raft (King of Ithaca enters under it)"},
            {"trailer": 101.0, "track": "The King of Ithaca", "t": 116.0, "what": "peak ends: cut to black"},
            {"trailer": 102.85, "track": "Hearthside Soul", "t": 184.70, "what": "slam: the threshold"}]
    rules = [
        "One idea per shot, and most shots hold five seconds or more; only the three shots inside the drop are shorter.",
        "Scale through a tiny figure against vast ground or sky (the horse on the empty shore, a man on a fig tree over the dark, a giant against the sky).",
        "Light is hard and low or it is night: dusk backlight, moonlight, one warm practical indoors; no flat daylight.",
        "At most one voice line per shot, spoken over a still or slowly moving frame; no line crosses a cut.",
        "The words are the characters' own recorded lines, never a synopsis; no narrator explains the plot.",
        "Title cards separate the movements and each card lands on a drum.",
        "The music is drums and one long build; it stops dead before the drop, and the drop is the only loud passage.",
        "Silence before the drop, and silence after it: the ending is room tone, one line and one drum.",
        "Restraint: no monster is shown whole, no spectacle is lingered on; the sea, the dead and the dog carry it.",
    ]
    checks = [
        {"id": "one-line-per-shot", "test": "max_voice_per_shot", "arg": 1},
        {"id": "long-holds", "test": "min_shot_dur", "arg": 4.5, "except_kinds": ["BLACK", "CARD"], "except_shots": [20, 22, 23, 24]},
        {"id": "cards-on-drums", "test": "cards_on_hits_or_drum_sfx"},
        {"id": "silence-before-drop", "test": "silence_before", "arg": {"at": 102.8, "min": 1.5}},
        {"id": "no-narrator", "test": "no_speaker", "arg": ["Epic Narrator"], "except_shots": [17]},
        {"id": "hits-on-cuts", "test": "hits_on_cuts", "arg": 0.06},
        {"id": "three-movement-cards", "test": "min_cards", "arg": 4},
    ]
    idea = ("Christopher Nolan's register, taken seriously in bricks. The subject is time: ten years at war, ten at sea, and twenty in the "
            "house where a woman unpicks her weaving and a dog waits on a dung heap. The trailer opens on the drums of Trial of the Bow, "
            "four single strokes that each die to silence, and cuts only on them: the wooden horse alone on the shore, a man clinging to a fig "
            "tree over black water, two cards. Then one long build under the voices of the story (Athena, Odysseus, the Cyclops, Tiresias, "
            "the nurse), each line spoken over one held image. The build stops dead on the bow, there is black, the only loud passage in the "
            "trailer carries the beggar onto the threshold, and it ends on the embrace in the olive-tree room with Zeus's decree: "
            "“Odysseus goes home.” The one exception to “no narrator” is “After twenty years”, three words of the epic narrator over Argos.")
    return build('a-long-way-home', 'The Long Way Home', 'Nolan: vast, grave, sincere; time and memory', idea, rules, music, silences, shots, checks, hits)

# ═══════════════════════════════ B. NOBODY ═══════════════════════════════
def B():
    ring = clip('OD-B01-S01', 1, 'the gods take their places in a widening ring', 'The gods take their places in a widening ring.')
    blame = clip('OD-B01-S01', 3, 'how mortals love to blame the gods for their sorrows', 'How mortals love to blame the gods for their sorrows.')
    wire = clip('OD-B10-S01', 3, 'sewn shut with silver wire', 'sewn shut with silver wire.')
    opens = clip('OD-B10-S01', 5, 'the crew opens the bag believing it contains treasure', 'The crew opens the bag, believing it contains treasure,')
    out = clip('OD-B10-S01', 6, 'out of my island out worst of living men', 'Out of my island — out, worst of living men!')
    pigs = clip('OD-B10-S04', 4, 'the men become pigs in body while retaining human minds', 'The men become pigs in body while retaining human minds.')
    name = clip('OD-B09-S08', 6, 'nobody is my name', 'Nobody is my name.')
    last = clip('OD-B09-S09', 2, 'i eat nobody last after all his friends', 'I eat Nobody last, after all his friends.')
    outside = clip('OD-B09-S09', 7, 'if nobody harms you alone as you are it is sickness sent by zeus', 'If Nobody harms you, alone as you are, it is sickness sent by Zeus,')
    boast = clip('OD-B09-S11', 4, 'tell him this it was odysseus sacker of cities who blinded you', 'tell him this: it was Odysseus, sacker of cities, who blinded you')
    day = clip('OD-B02-S02', 3, 'all day she wove at that web', 'All day she wove at that web,')
    night = clip('OD-B02-S02', 3, 'she unraveled it thread by thread', 'she unraveled it thread by thread.')
    argos = clip('OD-B17-S03', 2, 'argos lifts his head drops his ears', 'Argos lifts his head, drops his ears,')
    rolls = clip('OD-B05-S05', 3, 'the raft rolls', 'The raft rolls.')
    STEP = {"stepped": 12, "note": "stop-motion: the camera moves on twos, 12 positions a second"}
    shots = [
        S('KIT', 6.3, kit='set.the-opening', still='the-opening/hero.jpg', move=mv('orbit', 0.12, **STEP),
          action='Olympus on its column of cloud bricks over Ithaca; the camera circles it like a photographer moving a tripod a stud at a time',
          voice=ring, vat=0.2, sfx=['choir swell (the score)', 'a stud clicks as the camera steps'], why='Open grand and completely sincere, on a real model: the joke needs something true to push against.'),
        S('SCENE', 6.9, 'OD-B01-S01', 'K2', move=mv('push', 0.06, **STEP), actors=['zeus'],
          action='zeus on his throne, lightning bolt raised, lectures the room', voice=blame, vat=0.15, sfx=['thunder, small and polite'],
          why='The king of the gods complaining about people: the first laugh is a character line, not a gag.'),
        S('CARD', 1.8, card={"text": "MEANWHILE, DOWN HERE", **CARD['brick']}, sfx=['plates snapping on'], why='A LEGO Movie card: the bricks build the words.'),
        S('SCENE', 3.3, 'OD-B10-S01', 'K2', move=mv('push', 0.05, **STEP), actors=['aeolus', 'bag', 'odysseus'],
          action='aeolus holds out the knotted bag; odysseus takes it in both hands', voice=wire, vat=0.4, sfx=['wind straining inside a bag'],
          why='Plant: the bag, and that it is shut.'),
        S('KIT', 6.2, kit='set.bag-of-winds', still='bag-of-winds/close.jpg', move=mv('push', 0.08, **STEP),
          action='in the stern odysseus sleeps against the steering oar; behind him the crew lean over the bag and start on the knot',
          voice=opens, vat=0.1, sfx=['snore', 'a knot creaks'], why='Set-up: the narrator says it perfectly straight, which is the joke.'),
        S('SCENE', 1.5, 'OD-B10-S01', 'K4', actors=['bag', 'winds', 'odysseus'],
          action='the bag bursts: the winds come out as white flame elements, the sail tears', sfx=['WHOOMPH', 'sail rips', 'crew yell'],
          why='Pay-off on the score\'s phrase hit.'),
        S('SCENE', 4.8, 'OD-B10-S01', 'K1', move=mv('hold'), actors=['aeolus', 'odysseus'],
          action='aeolus, on his floating island, points them away; odysseus at the rail, bedraggled', voice=out, vat=0.05, sfx=['wind dying down'],
          why='Wit: the host throws them out in one breath.'),
        S('SCENE', 6.1, 'OD-B10-S04', 'K3', move=mv('push', 0.04, **STEP), actors=['five-scouts-2', 'pig1', 'circe'],
          action='a scout with a pig\'s head raises both hands in horror; the pig beside him turns to look at him', voice=pigs, vat=0.05,
          sfx=['one oink', 'the scout\'s hands clack'], why='Pigs-for-heads: the minifig head swapped for a pig head is the gag, played deadpan.'),
        S('SCENE', 2.8, 'OD-B09-S09', 'K1', actors=['odysseus', 'polyphemus', 'bowl'],
          action='odysseus, tiny, looks up at the drunk giant and answers him', voice=name, vat=0.1, sfx=['fire', 'giant breathing'],
          why='The name that is the whole trick, said plainly.'),
        S('SCENE', 6.0, 'OD-B09-S09', 'K1', move=mv('push', 0.10, **STEP), actors=['polyphemus', 'bowl', 'wine'],
          action='polyphemus raises the bowl, promises, and topples backwards asleep; the bowl rolls', voice=last, vat=0.05, sfx=['bowl clatters', 'THUD', 'snore'],
          why='The giant\'s generosity, then the fall: timing.'),
        S('SCENE', 1.2, 'OD-B09-S09', 'K3', actors=['stake', 'odysseus', 'four-stake-bearers-1', 'polyphemus'],
          action='the four men drive the stake into the eye', sfx=['sizzle', 'squelch (a brick sound, not a wet one)'], why='The blinding in one beat, no lingering.'),
        S('SCENE', 1.5, 'OD-B09-S09', 'K4', actors=['polyphemus', 'blood', 'odysseus'],
          action='polyphemus rears up clutching his eye', sfx=['ROAR'], why='The roar that brings the neighbours.'),
        S('KIT', 6.5, kit='set.cyclops-cave-headland', still='cyclops/headland.jpg', move=mv('hold'),
          action='the cave mouth from outside at night; the other Cyclopes gather at the stone and call in', voice=outside, vat=0.08,
          sfx=['crickets', 'giant footsteps'], why='The Nobody gag lands in their mouths: they believe him.'),
        S('SCENE', 1.6, 'OD-B09-S09', 'K4', move=mv('hold'), actors=['polyphemus'],
          action='hold on polyphemus: he opens his mouth to explain, and does not', sfx=['record scratch into silence'], silence=True,
          why='The beat after the joke: the music dies with his argument.'),
        S('SCENE', 6.6, 'OD-B09-S11', 'K3', move=mv('push', 0.05, **STEP), actors=['odysseus', 'odysseus-s-crew-1', 'odysseus-s-crew-2'],
          action='odysseus on the stern, arm up, shouting; the crew behind him wave their hands at him to stop', voice=boast, vat=0.04,
          sfx=['waves', 'crew: "shhh"'], why='Character comedy: the cleverest man alive cannot help signing his work.'),
        S('SCENE', 1.6, 'OD-B09-S11', 'K2', actors=['polyphemus', 'peak'], action='polyphemus lifts the top off the mountain', sfx=['rock tearing'],
          why='Consequence, immediately.'),
        S('SCENE', 1.8, 'OD-B09-S11', 'K5', actors=['splash', 'odysseus'], action='the rock lands beside the ship; the splash stands up in white studs', sfx=['SPLASH', 'crew scream'],
          why='Button on the gag section.'),
        S('SCENE', 3.4, 'OD-B02-S02', 'K2', move=mv('push', 0.04), actors=['penelope-at-the-loom', 'loom'],
          action='penelope at the loom in the sunlit hall, weaving, not looking at the suitors', voice=day, vat=0.2, sfx=['shuttle'],
          why='The heart: the other half of the story, still funny (she is out-tricking them) and sincere.'),
        S('SCENE', 5.8, 'OD-B02-S02', 'K3', move=mv('push', 0.04), actors=['penelope-at-the-loom', 'loom'],
          action='night: penelope pulls the day\'s threads out, alone', voice=night, vat=0.04, sfx=['thread drawn', 'torch'],
          why='The same loom at night: the joke turns into love.'),
        S('SCENE', 5.2, 'OD-B17-S03', 'K2', move=mv('push', 0.05), actors=['argos', 'odysseus-as-beggar'],
          action='argos lifts his head on the pots; his ears drop; his tail thumps', voice=argos, vat=0.2, sfx=['tail thump on terracotta'],
          why='Every brick real, including the old dog: the sincerity under the jokes.'),
        S('SCENE', 2.6, 'OD-B17-S03', 'K3', move=mv('hold'), actors=['odysseus-as-beggar', 'eumaeus'],
          action='the beggar turns aside and wipes his eye with the back of his hand', sfx=['room tone'], why='The one tear in the trailer; hold it.'),
        S('SCENE', 1.2, 'OD-B21-S07', 'K4', actors=['arrow', 'axes'], action='the arrow through the twelve axes', sfx=['twelve ticks'], why='Montage: the feat.'),
        S('SCENE', 1.0, 'OD-B12-S04', 'K5', actors=['scylla', 'six-seized-sailors-1'], action='scylla lifts the men', sfx=['screams'], why='Montage: the monster.'),
        S('SCENE', 1.0, 'OD-B10-S02', 'K5', actors=['odysseus', 'sword', 'g1'], action='odysseus raises his sword; giants on the cliffs', sfx=['boulder'], why='Montage: the giants.'),
        S('SCENE', 1.0, 'OD-B05-S05', 'K2', actors=['poseidon', 'raft', 'odysseus'], action='poseidon swings the trident; the sea stands up', sfx=['wave'], why='Montage: the god.'),
        S('SCENE', 1.0, 'OD-B12-S06', 'K5', actors=['sun', 'eurylochus'], action='the sun god glares down, rays out', sfx=['sizzle'], why='Montage: the sun.'),
        S('SCENE', 1.0, 'OD-B11-S01', 'K3', actors=['odysseus', 's0'], action='odysseus faces the dead', sfx=['whoosh'], why='Montage: the dead.'),
        S('SCENE', 1.0, 'OD-B22-S01', 'K3', actors=['antinous', 'wine'], action='the table goes over, cups and all', sfx=['clatter'], why='Montage: the hall.'),
        S('SCENE', 1.1, 'OD-B23-S04', 'K3', actors=['odysseus', 'penelope'], action='penelope runs into his arms', sfx=[], why='Montage: the wife.'),
        S('SCENE', 1.2, 'OD-B16-S03', 'K5', actors=['odysseus-restored', 'telemachus'], action='father and son hug', sfx=[], why='Montage: the son; ends on the embrace.'),
        S('CARD', 3.5, card={"text": "THE ODYSSEY", **CARD['brick']}, sfx=['bricks snapping on', 'final click'], why='Title, built.'),
        S('SCENE', 3.5, 'OD-B05-S05', 'K3', actors=['odysseus', 'raft'], action='the raft tips; odysseus, arms up, goes over', voice=rolls, vat=0.4,
          sfx=['splash, small'], silence=True, why='The tag after the title: the narrator, deadpan.'),
    ]
    music = [
        {"file": track(BC, "10_Circe’s Loom and the Bagged Gales"), "album": "BRONZE COUNCIL", "track": "Circe’s Loom and the Bagged Gales", "in": 18.15, "out": 73.05, "at": 0.0, "gain": -2, "fade_in": 0.3, "fade_out": 0.0,
         "note": "the driving section; its phrase hit at 42.65 is the bag bursting; it is cut at its own drop (73.05), which becomes the record-scratch"},
        {"file": track(BC, "10_Circe’s Loom and the Bagged Gales"), "album": "BRONZE COUNCIL", "track": "Circe’s Loom and the Bagged Gales", "in": 73.4, "out": 100.4, "at": 56.5, "gain": -4, "fade_in": 0.4, "fade_out": 0.3,
         "note": "the soft pulse (-19 to -26 LUFS): under the boast and the heart (loom, Argos)"},
        {"file": track(BC, "10_Circe’s Loom and the Bagged Gales"), "album": "BRONZE COUNCIL", "track": "Circe’s Loom and the Bagged Gales", "in": 100.8, "out": 113.8, "at": 83.5, "gain": -1, "fade_in": 0.0, "fade_out": 0.25,
         "note": "the return (onset 100.85) is the first montage cut; hard button at the end of the title"},
    ]
    silences = [{"at": 54.9, "dur": 1.6, "why": "the record-scratch: the music dies with the giant's argument"}, {"at": 96.5, "dur": 3.5, "why": "the tag plays dry"}]
    hits = [{"trailer": 24.5, "track": "Circe’s Loom and the Bagged Gales", "t": 42.65, "what": "phrase hit: the bag bursts"},
            {"trailer": 54.9, "track": "Circe’s Loom and the Bagged Gales", "t": 73.05, "what": "the track's own drop: the gag's silence"},
            {"trailer": 83.55, "track": "Circe’s Loom and the Bagged Gales", "t": 100.85, "what": "the return: the montage starts"}]
    rules = [
        "The brick as brick: every gag is a real part doing its job (the pig head on a minifig, the bag's winds as flame elements, the splash as white studs).",
        "The camera moves like a stop-motion photographer's: pushes and orbits step on twos (12 positions a second).",
        "Pace: the comic section (0-66.5 s) averages under 4 s a shot with no shot over 7 s, and the montage cuts every 1.0-1.2 s.",
        "Every joke is set up straight and paid off on picture: the narrator never winks.",
        "The Nobody gag is the spine: name, promise, blinding, the neighbours, silence.",
        "Sincerity under the jokes: the music drops away for Penelope's loom and Argos, and no gag plays over them.",
        "Sound is designed to the brick: clicks, clacks and snaps under the big effects.",
        "A huge final montage on the music's return, ending on an embrace, then the title built from plates.",
        "A tag after the title.",
    ]
    checks = [
        {"id": "comic-pace", "test": "mean_shot_dur", "arg": {"from": 0, "to": 66.5, "max": 4.0}}, {"id": "no-long-holds", "test": "max_shot_dur", "arg": {"from": 0, "to": 66.5, "max": 7.0}},
        {"id": "montage-pace", "test": "max_shot_dur", "arg": {"from": 83.5, "to": 93.0, "max": 1.25}},
        {"id": "one-line-per-shot", "test": "max_voice_per_shot", "arg": 1},
        {"id": "hits-on-cuts", "test": "hits_on_cuts", "arg": 0.06},
        {"id": "nobody-spine", "test": "voice_words_contain", "arg": {"word": "Nobody", "min": 3}},
        {"id": "tag-after-title", "test": "last_shot_after_title"},
    ]
    idea = ("The LEGO Movie's register: fast, funny, completely sincere underneath, and every brick real. It opens straight-faced on the Olympus "
            "kit and Zeus's complaint about mortals, then runs the voyage as a chain of set-ups and pay-offs the poem already contains: the bag "
            "the crew open believing it holds treasure, the men who become pigs “while retaining human minds”, and the long Nobody gag (the name, "
            "“I eat Nobody last”, the stake, the neighbours' “If Nobody harms you…”, and a record-scratch into silence). Odysseus shouting his "
            "own name from the ship is the character joke that costs him. Then the music drops and the trailer tells the truth: Penelope unpicking "
            "her weaving by torchlight, Argos lifting his head, a beggar wiping his eye. The music returns into a ten-shot montage that ends on "
            "embraces, the title builds itself from plates, and a tag: “The raft rolls.”")
    return build('b-nobody', 'Nobody', 'The LEGO Movie: wit and pace, the brick as brick, a sincere heart', idea, rules, music, silences, shots, checks, hits)

# ═══════════════════════════════ C. THE GODS ARE WATCHING ═══════════════════════════════
def Cc():
    empty = clip('OD-B01-S01', 1, "poseidon's seat remains empty", "Poseidon's seat remains empty.")
    blame = clip('OD-B01-S01', 3, 'how mortals love to blame the gods for their sorrows', 'How mortals love to blame the gods for their sorrows.')
    rages = clip('OD-B01-S01', 6, 'it is poseidon the earth shaker who rages without rest for the blinding of his cyclops son',
                 'It is Poseidon the earth-shaker who rages without rest for the blinding of his Cyclops son,')
    hear = clip('OD-B09-S11', 6, 'hear me poseidon dark haired shaker of the earth', 'Hear me, Poseidon, dark-haired shaker of the earth,')
    storm = clip('OD-B05-S05', 2, 'gathers clouds and strikes the sea with a four wind storm', 'gathers clouds, and strikes the sea with a four-wind storm.')
    hate = clip('OD-B10-S01', 6, 'the blessed gods themselves hate you', 'the blessed gods themselves hate you.')
    scylla = clip('OD-B12-S04', 5, "scylla's six heads strike lifting six screaming men from the ship", "Scylla's six heads strike, lifting six screaming men from the ship.")
    bolt = clip('OD-B12-S07', 4, 'zeus gathers a black cloud and strikes the mast with lightning', 'Zeus gathers a black cloud and strikes the mast with lightning.')
    grudge = clip('OD-B11-S03', 3, 'you blinded the son he loved and he does not forget', 'you blinded the son he loved, and he does not forget.')
    goes = clip('OD-B01-S02', 2, 'hard enduring odysseus goes home', 'hard-enduring Odysseus goes home.')
    strings = clip('OD-B21-S07', 1, 'odysseus strings the bow effortlessly', 'Odysseus strings the bow effortlessly,')
    rags = clip('OD-B22-S01', 1, 'odysseus strips off his rags leaps onto the threshold', 'Odysseus strips off his rags, leaps onto the threshold,')
    all_ = clip('OD-B01-S01', 6, 'one god cannot hold out against us all', 'one god cannot hold out against us all.')
    G = {"time": "day, high sun", "exposure": 1.0, "key": {"from": "high front", "color": "#fff4dc", "intensity": 1.6, "shadow": True}, "note": "Olympus: bright, marble and gold, the only sunlit place in the cut"}
    shots = [
        S('KIT', 4.2, kit='set.the-opening-turned', still='the-opening/turned.jpg', move=mv('crane', -0.15, note='down the column from the council to Ithaca'), look=G,
          action='the council, turned on its turntable, looks down the cloud column at the island; athena on the golden trail', sfx=['high wind', 'far thunder'],
          why='The thesis in one move: the gods above, men below, the camera travelling between them.'),
        S('SCENE', 6.6, 'OD-B01-S01', 'K1', move=mv('push', 0.05), look=G, actors=['zeus', 'athena', 'assembly-of-gods-1'],
          action='the gods in their ring; the camera finds the one empty throne with the trident on it', voice=empty, vat=1.0, sfx=['choir, low'],
          why='The absent god is the antagonist; name him by his empty chair.'),
        S('SCENE', 6.6, 'OD-B01-S01', 'K2', move=mv('push', 0.04), look=G, actors=['zeus'],
          action='zeus on his throne, bolt in hand', voice=blame, vat=0.1, sfx=['thunder under the line'], why='The king of the gods, grand and bored.'),
        S('SCENE', 8.4, 'OD-B01-S01', 'K4', move=mv('orbit', 0.10), look=G, actors=['zeus', 'athena'],
          action='zeus and athena face each other across the hall; poseidon\'s trident stands between them', voice=rages, vat=0.05, sfx=['wind'],
          why='The whole plot in a sentence, from the one who can settle it.'),
        S('SCENE', 1.8, 'OD-B09-S09', 'K3', actors=['stake', 'polyphemus', 'odysseus', 'four-stake-bearers-1'],
          action='the stake goes into the eye', sfx=['hiss', 'ROAR'], why='The crime the god avenges, in one beat.'),
        S('SCENE', 5.0, 'OD-B09-S11', 'K4', move=mv('crane', 0.12, note='up with his arms'), look=NIGHT, actors=['polyphemus'],
          action='polyphemus lifts his hands and prays to his father', voice=hear, vat=0.05, sfx=['sea', 'thunder answering'],
          why='The son calls the god down.'),
        S('SCENE', 3.9, 'OD-B09-S11', 'K2', move=mv('push', 0.08), actors=['polyphemus', 'peak'],
          action='polyphemus tears off the mountain top and lifts it over his head', sfx=['rock tearing', 'rising rumble'], why='Scale and threat; the cut out of it is the score\'s big hit.'),
        S('SCENE', 6.4, 'OD-B05-S05', 'K2', move=mv('push', 0.06), look=STORM, actors=['poseidon', 'raft', 'odysseus'],
          action='poseidon swings the trident; the water stands up in pillars round the raft', voice=storm, vat=0.1, sfx=['storm', 'wave hit'],
          why='The god himself arrives on the hit.'),
        S('SCENE', 3.2, 'OD-B10-S01', 'K4', look=NIGHT, actors=['winds', 'bag', 'odysseus'],
          action='the winds burst from the bag; the sail tears', voice=hate, vat=0.2, sfx=['wind howl'], why='Even a kind god turns: every power is against him.'),
        S('SCENE', 3.5, 'OD-B10-S02', 'K4', look=DUSK, actors=['g1', 'g2', 'r1', 'wreck1'],
          action='the Laestrygonians hurl boulders down on the ships at sunset', sfx=['boulders', 'hulls crushed'], why='Escalation: giants by the dozen.'),
        S('SCENE', 4.0, 'OD-B10-S02', 'K5', move=mv('push', 0.05), look=DUSK, actors=['odysseus', 'sword', 'g1', 'g2'],
          action='odysseus raises his sword and cuts the cable; giants loom on both cliffs', sfx=['cable parts', 'oars'], why='The hero, small, in the middle of it.'),
        S('SCENE', 7.25, 'OD-B12-S04', 'K5', move=mv('crane', 0.10, note='up the cliff with the men'), actors=['scylla', 'six-seized-sailors-1', 'odysseus'],
          action='the six heads lift six men up the cliff; odysseus below with the bow', voice=scylla, vat=0.0, sfx=['heads strike', 'screams, far'],
          why='The monster in full, the narrator plain.'),
        S('SCENE', 6.15, 'OD-B12-S07', 'K3', look=STORM, actors=['odysseus', 'fire', 'drowning-crew-1'],
          action='lightning strikes the mast; the crew throw up their arms', voice=bolt, vat=0.02, sfx=['thunderbolt'],
          why='Zeus himself strikes; the score drops out under the bolt.'),
        S('SCENE', 7.8, 'OD-B11-S01', 'K3', move=mv('push', 0.05), look=NIGHT, actors=['odysseus', 's0', 's1', 's2'],
          action='odysseus holds his sword up against the gathered dead', voice=grudge, vat=0.8, sfx=['the dead whisper'], silence=True,
          why='In the silence, the dead prophet says why: the god does not forget.'),
        S('SCENE', 5.2, 'OD-B13-S01', 'K4', move=mv('track', 0.05), look=NIGHT, actors=['odysseus', 'rug'],
          action='the convoy ship runs through the night, odysseus asleep in the stern', voice=goes, vat=0.8, sfx=['oars', 'score returns'],
          why='Athena turns the gods; the build starts.'),
        S('SCENE', 5.0, 'OD-B21-S07', 'K1', move=mv('push', 0.06), look=LAMP, actors=['odysseus', 'axes'],
          action='down the line of twelve axe-heads: odysseus strings the bow', voice=strings, vat=0.05, sfx=['string pulled taut'],
          why='The last trial, symmetrical and still.'),
        S('SCENE', 3.0, 'OD-B21-S07', 'K2', look=NIGHT, actors=['odysseus', 'axes'],
          action='the bow against the night sky; he plucks the string', sfx=['the string sings (swallow)', 'thunder from a clear sky'], why='Zeus answers: the gods have chosen a side.'),
        S('SCENE', 6.4, 'OD-B22-S01', 'K1', move=mv('push', 0.05), look=LAMP, actors=['odysseus-revealed', 'arrows', 'telemachus'],
          action='the rags come off; he leaps onto the threshold and the arrows pour down at his feet', voice=rags, vat=0.0, sfx=['arrows spill'],
          why='The man becomes the king.'),
        S('SCENE', 1.2, 'OD-B21-S07', 'K4', look=LAMP, actors=['arrow', 'axes'], action='the arrow through the axes', sfx=['twelve ticks'], why='Montage.'),
        S('SCENE', 1.2, 'OD-B22-S01', 'K2', look=LAMP, actors=['antinous', 'arrow'], action='antinous lifts the cup; the arrow', sfx=['arrow'], why='Montage.'),
        S('SCENE', 1.2, 'OD-B22-S01', 'K3', look=LAMP, actors=['antinous', 'wine', 'blood'], action='the table goes over', sfx=['crash'], why='Montage.'),
        S('SCENE', 4.9, 'OD-B01-S01', 'K3', move=mv('push', 0.06), look=G, actors=['athena', 'zeus'],
          action='athena, spear upright, looks down; zeus behind her', voice=all_, vat=0.2, sfx=['score at full'],
          why='Back to the gods for the verdict.'),
        S('BLACK', 3.45, action='black', sfx=['a bowstring creaks, once'], silence=True, why='Silence before the drop (the score\'s own dip).'),
        S('CARD', 3.65, card={"text": "THE ODYSSEY", **CARD['bronze']}, sfx=['score slam'], why='Title on the slam.'),
    ]
    music = [
        {"file": track(TD, 'Boulder-Drop Bass'), "album": "TITANS DESCENT", "track": "Boulder-Drop Bass", "in": 20.0, "out": 130.0, "at": 0.0, "gain": -2, "fade_in": 0.5, "fade_out": 0.3,
         "note": "one cue, the whole cut: the entry at 24.2, the big hit at 56.5, the drop to silence 87.0-94.8 (the dead), the build 95-120, the dip 122.9-126.3 and the slam at 126.35"},
    ]
    silences = []
    hits = [{"trailer": 4.2, "track": "Boulder-Drop Bass", "t": 24.2, "what": "the score enters: Olympus"},
            {"trailer": 36.5, "track": "Boulder-Drop Bass", "t": 56.5, "what": "the big hit: Poseidon's storm"},
            {"trailer": 67.0, "track": "Boulder-Drop Bass", "t": 87.0, "what": "drop to silence: the dead"},
            {"trailer": 74.8, "track": "Boulder-Drop Bass", "t": 94.8, "what": "the return: the ship home"},
            {"trailer": 102.9, "track": "Boulder-Drop Bass", "t": 122.9, "what": "dip: black"},
            {"trailer": 106.35, "track": "Boulder-Drop Bass", "t": 126.35, "what": "slam: the title"}]
    rules = [
        "Cut between above and below: every act returns to Olympus or to a god (Zeus, Poseidon, Aeolus, Helios's lightning, Athena).",
        "Olympus is the only sunlit place; the world of men is dusk, storm and night.",
        "Escalate: each monster bigger than the last, from one giant to many, to the six heads, to Zeus's own bolt.",
        "Every monster is a god's instrument, and the voice says so (the curse, 'the blessed gods themselves hate you', 'he does not forget').",
        "Cut on the score: every section change is a hit in the one cue, and the score's own silence belongs to the dead.",
        "The bow and the hall are the climax, answered by thunder: the gods choose a side.",
        "Silence before the drop, the title on the slam.",
        "At most one voice line per shot, and no line crosses a cut.",
    ]
    checks = [
        {"id": "gods-every-act", "test": "gods_return", "arg": {"every": 30.0, "ids": ["zeus", "athena", "poseidon", "polyphemus", "winds", "sun", "fire"], "speakers": ["Zeus", "Athena", "Polyphemus", "Aeolus", "Tiresias"]}},
        {"id": "one-line-per-shot", "test": "max_voice_per_shot", "arg": 1},
        {"id": "hits-on-cuts", "test": "hits_on_cuts", "arg": 0.06},
        {"id": "silence-before-drop", "test": "silence_before", "arg": {"at": 106.35, "min": 3.0}},
    ]
    idea = ("Mythic spectacle, with a thesis: the gods are watching, and the Odyssey is a quarrel in heaven fought out on one man. Olympus is "
            "the only sunlit place in the cut; everything below is dusk, storm and night. It opens on the turned council looking down its "
            "column at Ithaca, names the enemy by his empty throne, and lets Zeus state the plot. Then the monsters escalate, each one a god's "
            "instrument and each announced as such: the blinding, the Cyclops praying to his father, Poseidon's storm on the score's big hit, "
            "Aeolus's “the blessed gods themselves hate you”, the Laestrygonians, Scylla, Zeus's own lightning. The score drops out for the "
            "dead (“he does not forget”), comes back as Athena sends him home, and builds through the bow, Zeus's thunder and the hall to the "
            "verdict: “one god cannot hold out against us all.” Black, and the title on the slam.")
    return build('c-gods-watching', 'The Gods Are Watching', 'Mythic spectacle: Olympus above, men below', idea, rules, music, silences, shots, checks, hits)

# ═══════════════════════════════ TEASER ═══════════════════════════════
def T():
    name = clip('OD-B09-S08', 6, 'nobody is my name', 'Nobody is my name.')
    FIRE = None
    shots = [
        S('BLACK', 3.0, action='black; firelight flickers on nothing', sfx=['fire crackle', 'a giant breathing, slow'], why='Sound before picture: the giant is heard before he is seen.'),
        S('SCENE', 9.2, 'OD-B09-S09', 'K1', move=mv('push', 0.10), look=FIRE, actors=['polyphemus', 'odysseus', 'four-stake-bearers-2', 'bowl'],
          action='the giant asleep on his back in the firelight; odysseus stands at his shoulder, looking at the face', voice=name, vat=5.9,
          sfx=['fire', 'snore'], why='Scale and the one line: a small man beside a sleeping mountain, and his false name in the music\'s silence.'),
        S('SCENE', 3.7, 'OD-B09-S09', 'K3', move=mv('push', 0.06), actors=['stake', 'odysseus', 'four-stake-bearers-1', 'polyphemus'],
          action='the four men drive the glowing stake into the eye; steam', sfx=['hiss'], why='The act, as the score swells.'),
        S('SCENE', 4.7, 'OD-B09-S09', 'K4', actors=['polyphemus', 'blood'], action='polyphemus rears up, clutching the eye, roaring', sfx=['ROAR'],
          why='The swell peaks on the roar.'),
        S('SCENE', 4.75, 'OD-B09-S11', 'K4', move=mv('crane', 0.12, note='up, past the giant into the night'), look=NIGHT, actors=['polyphemus'],
          action='outside, at night, the blinded giant lifts his hands to the sky', sfx=['sea', 'thunder, far'],
          why='The consequence, in the score\'s silence: he is calling his father.'),
        S('CARD', 4.65, card={"text": "THE ODYSSEY", **CARD['nolan-title']}, sfx=['score hit'], why='Title on the hit.'),
    ]
    music = [{"file": track(TD, 'Underworld Descent'), "album": "TITANS DESCENT", "track": "Underworld Descent", "in": 0.0, "out": 30.0, "at": 0.0, "gain": -2, "fade_in": 0.0, "fade_out": 0.8,
              "note": "swell to 3.5, fall to silence 8.5-12.5 (the line), swell to 16.0 (the roar), fall to silence 21-24.5 (the prayer), hit at 25.35 (the title)"}]
    hits = [{"trailer": 15.9, "track": "Underworld Descent", "t": 15.9, "what": "swell peak: the roar"},
            {"trailer": 25.35, "track": "Underworld Descent", "t": 25.35, "what": "hit: the title"}]
    rules = [
        "One idea: the man who called himself Nobody, and what it cost.",
        "Two locations only (the cave, the shore) plus a title: it is also the test of the whole render path.",
        "One line, spoken in the music's silence.",
        "Scale: the man small beside the sleeping giant; the giant small against the night.",
        "Firelight inside, moonlight outside; nothing else.",
        "The title lands on the hit.",
    ]
    checks = [{"id": "one-line", "test": "max_voice_total", "arg": 1}, {"id": "two-locations", "test": "max_locations", "arg": 2},
              {"id": "hits-on-cuts", "test": "hits_on_cuts", "arg": 0.06}]
    idea = ("Thirty seconds, one idea, one line. In the firelight of the cave a small man stands at the shoulder of a sleeping giant, and in "
            "the moment the score falls silent he gives his name: “Nobody is my name.” The stake, the roar on the score's swell; then outside, "
            "at night, the blinded giant raising his hands to his father in the sky while the music drops away again; the title on the hit. "
            "It uses two filmed locations (OD-B09-S09, OD-B09-S11) and a card, so it is the first thing to render end to end.")
    return build('teaser', 'Nobody (teaser)', 'Teaser and render test: one idea, one line', idea, rules, music, [], shots, checks, hits)

if __name__ == '__main__':
    for f in (A, B, Cc, T):
        d = f()
        print(f"{d['id']:18s} {d['runtime']:7.2f}s {len(d['shots'])} shots")
        for s in d['shots']:
            v = s['voice']
            vs = f"  V[{v['at']:.2f}+{v['clip']['out']-v['clip']['in']:.2f}={v['at']+v['clip']['out']-v['clip']['in']:.2f}/{s['dur']}] {v['words'][:50]}" if v else ''
            print(f"   {s['n']:2d} {s['at']:7.2f} {s['dur']:5.2f} {s['kind']:5s} {(s.get('scene') or s.get('kit') or '')} {s.get('key') or ''}{vs}")
