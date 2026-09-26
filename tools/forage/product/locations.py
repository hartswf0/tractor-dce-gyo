#!/usr/bin/env python3
"""tools/forage/product/locations.py — the location and dialogue atlas of the Odyssey line: where the poem's words are spoken, what each
place looks like (its ground, its trees, its roads and waters, its light), who stands there and what they wear, and how much of it the
LEGO world already has (a location card, film keyframes, a kit).

  python3 tools/forage/product/locations.py [--halfworld /path/to/odyssey-halfworld]

Writes odyssey/kits/locations.json and odyssey/kits/locations.html (styled like the hub, odyssey/kits/index.html).

Sources (odyssey-halfworld, read only):
  harness/atlas.json              the 152 scenes: id, book, title, beats; the atlas's own location ids; the asset registry
  scenes/OD-Bnn-Snn.mjs           what each scene actually places: `import … from "../assets/location/<id>.mjs"` lines and
                                  `asset:"location.<id>"` casts; its cast of character.* / ensemble.* / creature.*; its header comment
  assets/location/<id>.mjs        the header comment of each set and its `states` nodes
  assets/character/<id>.mjs …     the header comment of each figure (what it wears and carries)
  atlas/spoken-lines/lines-*.json the spoken words, keyed by METIS turn id OD-Bnn-Snn-Tnn
  viewer/performance-turns.json   the speaker of every turn id (spoken-lines carry no speaker)
  scenes/_direction.mjs           BEATS: the key beat (emotion + note) of 82 scenes
  scenes/_plans/*.mjs             floor plans
Sources (this repo): odyssey/cards (location, character cards), odyssey/forage.json, odyssey/keyframes, film-readymades/build_odyssey.py
(SCENES), odyssey/kits/*/kit.json (sources) and kitpages.SCENES.

Every landscape word is found by a fixed vocabulary (VEG, ROADS, WATER, …) in the text named above; each term keeps the source it came
from and a short snippet, so any of them can be checked. Nothing on the page is typed by hand except INFERRED (below), which is marked
as such wherever it is used.
"""
import ast, glob, html, json, os, re, sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import kitpages
from kitpages import STYLE, HEAD, ROMAN, E

ROOT = kitpages.ROOT
HW = os.environ.get('HALFWORLD', '/home/user/odyssey-halfworld')
if '--halfworld' in sys.argv: HW = sys.argv[sys.argv.index('--halfworld') + 1]
KITS, CARDS, KEYS, THUMBS = kitpages.KITS, kitpages.CARDS, kitpages.KEYS, os.path.join(ROOT, 'odyssey/thumbs')

# The 28 scenes whose file places no location asset (the set is an environment, set-piece or divine field: a storm, a map, a memory).
# Where the poem is plainly still in a place the atlas has built, the scene is given that place here, by hand, from the neighbouring
# scene and the text. It is marked `location_source: "inferred"` everywhere, and its lines are counted apart. Scenes at open sea stay
# unplaced.
INFERRED = {
    'OD-B01-S02': ('location.olympian-council-hall', 'the council of B01-S01 continues; Athena leaves from Olympus'),
    'OD-B01-S04': ('location.odysseuss-palace-threshold-and-hall', 'between B01-S03 and B01-S06, both in this hall'),
    'OD-B01-S05': ('location.odysseuss-palace-threshold-and-hall', 'the header stages it "in the hall at Ithaca"'),
    'OD-B03-S03': ('location.pylos-sacrificial-beach', 'Nestor narrates to Telemachus, continuing B03-S02 on the beach'),
    'OD-B04-S07': ('location.odysseuss-palace-threshold-and-hall', 'the suitors plot at Ithaca (Od. 4.625ff.)'),
    'OD-B06-S03': ('location.river-washing-pools', 'the header: "the river washing-place"'),
    'OD-B07-S03': ('location.alcinouss-palace', "Arete's hearth in the palace of Alcinous (B07-S02, B07-S04)"),
    'OD-B09-S06': ('location.polyphemuss-cave', 'inside the cave, between B09-S05 and B09-S08'),
    'OD-B09-S07': ('location.polyphemuss-cave', 'the header: the cave floor'),
    'OD-B10-S06': ('location.circes-forest-palace', "Circe's hall, between B10-S04/05 and B10-S07"),
    'OD-B10-S08': ('location.circes-forest-palace', "Circe gives the route in her house (Od. 10.480ff.)"),
    'OD-B11-S02': ('location.cimmerian-shore-and-underworld-pit', 'the blood pit of B11-S01/S03'),
    'OD-B11-S04': ('location.cimmerian-shore-and-underworld-pit', 'at the pit (Od. 11.84ff.)'),
    'OD-B11-S05': ('location.cimmerian-shore-and-underworld-pit', 'at the pit (Od. 11.225ff.)'),
    'OD-B11-S06': ('location.cimmerian-shore-and-underworld-pit', 'at the pit (Od. 11.385ff.)'),
    'OD-B12-S02': ('location.aeaea-funeral-shore', "Circe takes him aside on Aeaea's shore after the funeral (Od. 12.33ff.)"),
    'OD-B13-S02': ('location.phorcys-harbor', 'he wakes where B13-S01 left him'),
    'OD-B13-S03': ('location.phorcys-harbor', 'the same shore; Athena lifts the mist'),
    'OD-B13-S05': ('location.phorcys-harbor', 'after hiding the treasure (B13-S04), by the olive at the harbour head'),
    'OD-B14-S03': ('location.eumaeus-hut-interior', 'the header: "read across the hearth" of the hut'),
    'OD-B14-S04': ('location.eumaeus-hut-interior', 'the night in the hut (Od. 14.457ff.)'),
    'OD-B15-S01': ('location.menelauss-palace', 'Telemachus lies in the porch of Menelaus (Od. 15.4ff.)'),
    'OD-B15-S02': ('location.menelauss-palace', 'the farewell at Sparta'),
    'OD-B20-S01': ('location.odysseuss-palace-threshold-and-hall', 'the header: the PRODOMOS, the forecourt outside the hall door; the atlas calls it palace-night-interior'),
}
AT_SEA = {'OD-B02-S07', 'OD-B05-S05', 'OD-B09-S11', 'OD-B12-S07'}   # left unplaced on purpose

# ---- vocabularies: canonical kind -> regex (word-bounded, case-insensitive) ----
def V(d): return {k: re.compile(r'\b(?:' + v + r')\b', re.I) for k, v in d.items()}
TERRAIN = V({'olympus': r'olymp\w*|immortals?|divine assembly', 'underworld': r'hades|underworld|erebus|shades?|dead|asphodel|cimmerian|persephone',
             'cave': r'caves?|cavern\w*|grotto', 'sea': r'open sea|sea|strait|whirlpool|ocean', 'island': r'islands?|isle',
             'coast': r'shores?|beach\w*|coast\w*|harbou?rs?|surf|strand|sand', 'cliff': r'cliffs?|crags?|headlands?|rock face|sheer rock',
             'mountain': r'mountains?|mount|peaks?|summit|ranges?|parnassus|neriton', 'hill': r'hills?|slopes?|ridges?|lookout|terrace\w*',
             'plain': r'plains?|fields?|meadows?|grounds?|pasture|orchard|farm\w*|steading', 'court': r'court\w*|yards?|forecourt|prodomos|gate|precinct',
             'interior': r'halls?|chambers?|rooms?|megaron|storeroom|interior|hut|hearth|roof\w*'})
# the id is the strongest evidence of what kind of ground a set is: tokens in the id decide the primary terrain
ID_TERRAIN = [('olympus', r'olympian'), ('underworld', r'hades|underworld|punishment'), ('cave', r'cave|cavern'), ('sea', r'strait'),
              ('interior', r'hall|chamber|storeroom|interior|grain-room|wooden-horse|memory-set'), ('mountain', r'mount-'),
              ('island', r'island|thrinacia|aeolia'), ('coast', r'shore|beach|coast|harbor|landing|river-mouth'),
              ('court', r'threshold|yard|gate|courtyard|dung-heap'), ('plain', r'field|ground|orchard|farm|meadow|garden|road|route|path|pools|feast'),
              ('interior', r'palace|hut')]
VEG = V({'olive': r'olives?|olive[- ]wood|olive[- ]tree', 'cypress': r'cypress\w*', 'poplar': r'poplars?', 'oak': r'oaks?|oak[- ]wood',
         'alder': r'alders?', 'willow': r'willows?|osiers?', 'pine': r'pines?|fir|firs', 'fig': r'figs?|fig[- ]tree', 'pear': r'pears?',
         'apple': r'apples?', 'pomegranate': r'pomegranates?', 'vine': r'vines?|vineyards?|grapes?|vine terrace', 'reeds': r'reeds?|rushes|sedge',
         'meadow flowers': r'violets?|parsley|flowers?|flowering|blossom\w*|crocus|hyacinth|lilies|lily', 'asphodel': r'asphodel',
         'lotus': r'lotus', 'moly': r'moly', 'laurel': r'laurels?|bay[- ]tree', 'myrtle': r'myrtles?', 'palm': r'palm[- ]trees?|date[- ]palms?|young palm',
         'grass & meadow': r'grass\w*|meadows?|pasture|turf', 'scrub & thicket': r'thickets?|brush\w*|scrub|bushes|undergrowth|thorns?|brambles?',
         'woods & forest': r'woods|wooded|woodland|forests?|groves?|treeline|copse', 'orchard': r'orchards?|fruit[- ]trees?', 'garden': r'gardens?|beds of',
         'grain': r'grain|wheat|barley|corn|threshing', 'hedge': r'hedges?|hedgerows?', 'seaweed': r'seaweed|kelp|wrack'})
ROADS = V({'road': r'roads?|carriageway|highway', 'path & track': r'paths?|tracks?|trails?|footpaths?|lanes?|ways? up|walk', 'route': r'routes?|approach',
           'stair & steps': r'stairs?|stairways?|steps|staircase|ramps?', 'threshold & sill': r'thresholds?|sills?|doorways?|doors?|portals?',
           'gate': r'gates?|gateway', 'harbour & landing': r'harbou?rs?|landings?|moorings?|quays?|anchorage|haul(?:ed)?[- ]out|slipway',
           'fountain & spring': r'fountains?|springs?|wellhead', 'courtyard': r'courtyards?|court|forecourt|yard', 'bridge & ford': r'bridges?|fords?|causeway'})
WATER = V({'sea': r'sea|seas|surf|breakers|ocean(?:us)?|seaward|seashore', 'harbour': r'harbou?rs?|bay|anchorage|haven', 'river': r'rivers?|river-mouth|streams?|brooks?|current',
           'spring & fountain': r'springs?|fountains?', 'pool & basin': r'pools?|basins?|troughs?|cistern', 'bath': r'baths?|bathing|bathtub',
           'strait & whirlpool': r'straits?|whirlpools?|charybdis', 'rain & storm': r'rain\w*|storm\w*|squalls?', 'underworld rivers': r'styx|acheron|cocytus|pyriphlegethon|river of ocean',
           'blood & libation': r'blood[- ]pit|libations?|trench'})
ARCH = V({'stone': r'stones?|stonework|rubble|ashlar|masonry|boulders?', 'timber': r'timbers?|beams?|planks?|wooden|logs?', 'bronze': r'bronze',
          'gold & silver': r'gold\w*|silver\w*', 'columns & pillars': r'columns?|pillars?|posts?', 'hearth & fire': r'hearths?|fires?|braziers?|embers?',
          'altar': r'altars?', 'loom': r'looms?', 'walls': r'walls?|wall[- ]runs?|precinct wall', 'roof & porch': r'roofs?|portico|porch|eaves|prodomos',
          'thatch & wattle': r'thatch\w*|wattle|reed[- ]roof', 'benches & tables': r'benches|tables?|trestles?|boards', 'throne & seats': r'thrones?|seats?|chairs?',
          'doors & bars': r'doors?|bars?|bolts?', 'tents & camp': r'tents?|camp\w*', 'ships': r'ships?|galleys?|hulls?|raft', 'huts & sties': r'huts?|sties|sty|pens?|steading',
          'bed': r'beds?|bedpost', 'weapons on walls': r'arms on the walls|axes?|spears?|bows?|shields?', 'bones & blood': r'bones?|blood|bodies'})
TIME = V({'dawn': r'dawn|daybreak|sunrise|early light', 'day': r'day(?:light)?|noon|morning', 'dusk': r'dusk|sunset|evening|twilight',
          'night': r'night\w*|moon\w*|midnight|dark(?:ness)?|lamp[- ]?lit|torch\w*'})
WEATHER = V({'storm': r'storms?|tempest|gale', 'wind': r'winds?|gusts?|breeze', 'rain': r'rain\w*', 'mist & fog': r'mists?|fog|haze|murk',
             'thunder & lightning': r'thunder\w*|lightning|thunderbolt', 'calm': r'calm|still water|becalmed', 'cold': r'cold|frost|snow',
             'smoke': r'smoke|smoking|fumes?|sulphur'})
WEAR = re.compile(r'\b(tunic|cloak|robe|gown|dress|veil\w*|rags?|ragged|helmet|armou?r|cuirass|greaves|mantle|fillet|crown|diadem|sandals?|hat|cap|belt\w*|'
                  r'staff|spear|bow|sword|shield|lyre|hide|fleece|kilt|chiton|peplos|wrap|scrip|wallet|bag|headband|headscarf|wreath|pelt|'
                  r'chlamys|hood|shawl|apron|kerchief|beard\w*|barefoot|naked|bare|jewell?ed|earrings|necklace|brooch|pin|girdle|skirt)\b', re.I)


GARB = re.compile(r'\b(tunic|cloak|robe|gown|dress|veil\w*|rags?|ragged|helmet|armou?r|cuirass|mantle|fillet|diadem|sandals?|'
                  r'girdle|kilt|chiton|peplos|scrip|wallet|headscarf|kerchief|apron|shawl|pelt|fleece|naked|barefoot|wreath|jewell?ed|brooch)\b', re.I)


# sentences about the machinery (files, rigs, pixels, plans), not about the figure
TECH = re.compile(r'\brig\b|dotify|halftone|anchors?\b|POSES|solid grays|reference module|\.mjs|#[0-9a-f]{3,6}|state\.|\bctx\b|\bpx\b|'
                  r'\bz \.|frame x|\bplan\b|stations?\b|guise|module|channel|offsets?|\bmode\b|instanced|template|capability', re.I)


def near(a, b, x, gap=60):
    """a name and a garment within `gap` characters of each other in one sentence"""
    return any(abs(m.start() - n.start()) < gap for m in a.finditer(x) for n in b.finditer(x))


def strip_code_comment(text):
    """the first /* … */ block of a module, as plain prose"""
    m = re.match(r'\s*/\*(.*?)\*/', text, re.S)
    return re.sub(r'\s+', ' ', m.group(1)).strip() if m else ''


def sentences(t): return [s.strip() for s in re.split(r'(?<=[.;:!?])\s+(?=[A-Z`"(])', t) if s.strip()]


def snippet(text, rx, width=110):
    m = rx.search(text)
    if not m: return ''
    a, b = max(0, m.start() - width // 2), min(len(text), m.end() + width // 2)
    return ('…' if a else '') + text[a:b].strip() + ('…' if b < len(text) else '')


def title_of(aid): return re.sub(r'[-_]', ' ', aid.split('.', 1)[1]).title().replace("'S", "'s")


def read(p):
    with open(p, encoding='utf-8', errors='replace') as f: return f.read()


# ---------------------------------------------------------------------------------------------------------------------------------
def load_halfworld():
    atlas = json.load(open(os.path.join(HW, 'harness/atlas.json')))
    reg = {r['id']: r for r in atlas['assetRegistry']}
    # spoken lines, and the speaker of each from the performance turns
    lines = {}
    for f in sorted(glob.glob(os.path.join(HW, 'atlas/spoken-lines/lines-*.json'))): lines.update(json.load(open(f)))
    pt = json.load(open(os.path.join(HW, 'viewer/performance-turns.json')))
    turns = {t['id']: t for ts in pt['byScene'].values() for t in ts}
    # the key beats: parse the BEATS object of _direction.mjs as a Python literal
    d = read(os.path.join(HW, 'scenes/_direction.mjs'))
    body = d[d.index('export const BEATS'):]; body = body[body.index('{'):body.index('};') + 1]
    beats = ast.literal_eval(re.sub(r',\s*}', '}', body))
    plans = {os.path.basename(p)[:-4]: read(p) for p in glob.glob(os.path.join(HW, 'scenes/_plans/*.mjs'))}
    return atlas, reg, lines, turns, beats, plans


IMPORT = re.compile(r'^import\b[^;]*?from\s+["\']\.\./assets/(location|character|ensemble|creature|prop)/([\w-]+)\.mjs["\']', re.M)
CAST = re.compile(r'asset\s*:\s*["\']((?:location|character|ensemble|creature|prop)\.[\w-]+)["\']')


def scene_file(sid):
    t = read(os.path.join(HW, 'scenes', sid + '.mjs'))
    code = re.sub(r'/\*.*?\*/', '', t, flags=re.S)
    code = re.sub(r'^\s*//.*$', '', code, flags=re.M)
    ids = {f'{k}.{n}' for k, n in IMPORT.findall(code)} | set(CAST.findall(code))
    return t, strip_code_comment(t), ids


def asset_file(kind, aid):
    p = os.path.join(HW, 'assets', kind, aid.split('.', 1)[1] + '.mjs')
    return read(p) if os.path.exists(p) else ''


def state_names(t):
    m = re.search(r'\bstates\s*:\s*\{(.*?)\bedges\b|\bstates\s*:\s*\{(.*?)\n\s*\},', t, re.S)
    if not m: return [], ''
    block = m.group(1) or m.group(2) or ''
    ini = re.search(r'initial\s*:\s*["\']([\w-]+)["\']', block)
    nodes = block[block.find('nodes'):] if 'nodes' in block else ''
    names = re.findall(r'(?:^|[{,\n])\s*["\']?([A-Za-z][\w-]*)["\']?\s*:\s*(?:\{|node\()', nodes)
    return [n for n in dict.fromkeys(names) if n not in ('nodes', 'preview')], ini.group(1) if ini else ''


def find(vocab, texts, weak=None, strict=True):
    """texts: [(source, text)] → [{kind, sources, snippet}], the asset's own words first. A kind named only in the text of ONE scene (not by
    the asset, nor the atlas registry) is kept apart in `weak` (it may belong to a place the scene only mentions)."""
    out = {}
    for src, t in texts:
        for k, rx in vocab.items():
            if rx.search(t):
                r = out.setdefault(k, dict(kind=k, sources=[], snippet=snippet(t, rx)))
                if src not in r['sources']: r['sources'].append(src)
    rows = sorted(out.values(), key=lambda r: (r['sources'][0] != 'asset', -len(r['sources'])))
    need = max(2, (len(texts) - 1) // 5)   # a set with many scenes (the megaron has 36) needs a term in a fifth of them
    strong = [r for r in rows if {'asset', 'atlas'} & set(r['sources']) or len(r['sources']) >= need]
    if weak is not None: weak.extend(r for r in rows if r not in strong)
    return strong if strict else rows


def terrain_of(lid, texts):
    prim = next((t for t, rx in ID_TERRAIN if re.search(rx, lid)), None)
    c = Counter()
    for src, t in texts:
        w = 3 if src == 'asset' else 1
        for k, rx in TERRAIN.items(): c[k] += w * len(rx.findall(t))
    ranked = [k for k, _ in c.most_common() if _ > 0]
    prim = prim or (ranked[0] if ranked else 'plain')
    return prim, [prim] + [k for k in ranked if k != prim][:3]


def costume_note(kind, aid):
    """the sentences of a figure's own header that say what it wears or carries"""
    h = strip_code_comment(asset_file(kind, aid))
    h = re.sub(r'^[\w.-]+ — ', '', h)
    s = [x for x in sentences(h) if WEAR.search(x) and not TECH.search(x)]
    note = ' '.join(s[:2])
    return (note[:260].rsplit(' ', 1)[0] + '…') if len(note) > 260 else note


# ---------------------------------------------------------------------------------------------------------------------------------
def build():
    atlas, reg, lines, turns, beats, plans = load_halfworld()
    forage = {c['id']: c for c in json.load(open(os.path.join(ROOT, 'odyssey/forage.json')))['cards']}
    bo = read(os.path.join(ROOT, 'film-readymades/build_odyssey.py'))
    film = set(ast.literal_eval(re.search(r'^SCENES\s*=\s*(\[.*?\])', bo, re.M).group(1)))
    keyed = {os.path.basename(os.path.dirname(f)) for f in glob.glob(os.path.join(KEYS, 'OD-*', 'sheet.jpg'))}
    loc_assets = sorted('location.' + os.path.basename(p)[:-4] for p in glob.glob(os.path.join(HW, 'assets/location/*.mjs')))
    # kits: kitpages.SCENES (the film scenes each kit models) and each kit.json's sources (scenes and location files it was drawn from)
    kits = {k['slug']: k for k in kitpages.load()}
    kit_scenes, kit_locs, planned = defaultdict(list), defaultdict(list), defaultdict(list)
    for slug, ss in kitpages.SCENES.items():   # a slug in SCENES with no kit on disk yet is a kit planned, not a kit
        for s in ss: (kit_scenes if slug in kits else planned)[s].append(slug)
    for slug, k in kits.items():
        for src in k.get('sources', []):
            m = re.search(r'scenes/(OD-B\d\d-S\d\d)\.mjs', src)
            if m and slug not in kit_scenes[m.group(1)]: kit_scenes[m.group(1)].append(slug)
            m = re.search(r'assets/location/([\w-]+)\.mjs', src)
            if m: kit_locs['location.' + m.group(1)].append(slug)

    # ---- scenes ----
    scenes, loc_scenes = [], defaultdict(list)
    scene_texts = {}
    for a in atlas['scenes']:
        sid = a['id']
        raw, hdr, ids = scene_file(sid)
        scene_texts[sid] = hdr
        placed = sorted(i for i in ids if i.startswith('location.') and i in loc_assets)
        atlas_locs = [x['id'] for x in a['assets'] if x['type'] == 'LOCATION']
        src = 'scene file' if placed else None
        locs = placed
        if not placed and sid in INFERRED:
            locs, src = [INFERRED[sid][0]], 'inferred'
        cast = sorted(i for i in ids if i.split('.')[0] in ('character', 'ensemble', 'creature'))
        props = sorted(i for i in ids if i.startswith('prop.'))
        tids = sorted(k for k in lines if k.startswith(sid + '-T'))
        spoken = [k for k in tids if lines[k]['line'].strip()]
        spk = Counter()
        names = {}
        for k in spoken:
            t = turns.get(k, {})
            sp = t.get('sp', '?'); spk[sp] += 1; names[sp] = t.get('spName', sp)
        narr = spk.get('PERFORMER.NARRATOR', 0)
        kb = beats.get(sid)
        ks = kit_scenes.get(sid, [])
        s = dict(id=sid, book=a['book'], n=a['n'], title=a['title'], book_title=a.get('bookTitle', ''),
                 locations=locs, location_source=src, inferred_reason=INFERRED[sid][1] if src == 'inferred' else None,
                 at_sea=sid in AT_SEA, atlas_locations=atlas_locs,
                 characters=cast, props=props, turns=len(tids), lines=len(spoken), dialogue=len(spoken) - narr, narration=narr,
                 speakers=[dict(id=sp, name=names[sp], lines=n) for sp, n in spk.most_common()],
                 key_beat=dict(emotion=kb[0], note=kb[1]) if kb else None,
                 has_scene_card=os.path.exists(os.path.join(CARDS, sid + '.mpd')),
                 has_location_card=bool(locs) and all(os.path.exists(os.path.join(CARDS, l + '.mpd')) for l in locs),
                 has_keyframes=sid in keyed, keyframe_sheet=f'odyssey/keyframes/{sid}/sheet.jpg' if sid in keyed else None,
                 in_film=sid in film, kit=ks[0] if ks else None, kits=ks, kits_planned=planned.get(sid, []),
                 first_line=next((lines[k]['line'] for k in spoken if turns.get(k, {}).get('sp') != 'PERFORMER.NARRATOR'), ''))
        scenes.append(s)
        for l in locs: loc_scenes[l].append(s)

    # ---- locations ----
    alias = defaultdict(set)   # the atlas's names for a set that the film folded into another asset
    for s in scenes:
        for al in s['atlas_locations']:
            if al not in loc_assets:
                for l in s['locations']: alias[l].add(al)
    char_note = {}
    locations = []
    for lid in sorted(set(loc_assets) | set(loc_scenes)):
        at = asset_file('location', lid)
        hdr = strip_code_comment(at)
        ss = sorted(loc_scenes.get(lid, []), key=lambda s: s['n'])
        perfs = [p['perf'] for a_ in [lid, *sorted(alias[lid])] for p in reg.get(a_, {}).get('perfs', [])]
        texts = [('asset', hdr)] + [('atlas', p) for p in perfs] + [(s['id'], scene_texts[s['id']] + ' ' + ' '.join(
            next(a['beats'] for a in atlas['scenes'] if a['id'] == s['id']))) for s in ss]
        states, initial = state_names(at)
        prim, terr = terrain_of(lid, texts[:1 + len(perfs)])   # the ground is read from the set's own words, not its scenes'
        weak = {k: [] for k in ('vegetation', 'roads', 'water')}
        lit = [('asset', 'states: ' + ' '.join(s_.replace('-', ' ') for s_ in states))] + texts   # light and weather: the set's own states first, then every text
        # figures seen there
        figs = defaultdict(lambda: dict(scenes=[], lines=0))
        spoken_by = Counter()
        for s in ss:
            for c in s['characters']: figs[c]['scenes'].append(s['id'])
            for sp in s['speakers']:
                # a speaker is credited to the figure placed for it in that scene: character.odysseus speaks through odysseus-b16 in XVI–XXIV
                fig = next((c for c in s['characters'] if c == sp['id']), None) or next((c for c in s['characters'] if c.startswith(sp['id'] + '-')), sp['id'])
                spoken_by[fig] += sp['lines']
        figures = []
        for c, v in figs.items():
            kind = c.split('.')[0]
            if c not in char_note: char_note[c] = costume_note(kind, c)
            says = []
            name_rx = re.compile(r'\b' + re.escape(title_of(c).split()[0]) + r'\w*', re.I)
            for s in ss:
                if s['id'] in v['scenes']:
                    for x in sentences(scene_texts[s['id']]):
                        if near(name_rx, GARB, x) and not TECH.search(x) and len(x) < 320: says.append(dict(scene=s['id'], text=re.sub(r'\s\d+\.$', '', x.replace('`', ''))))
            figures.append(dict(id=c, name=reg.get(c, {}).get('name') or title_of(c), scenes=v['scenes'], lines=spoken_by.get(c, 0),
                                wears=char_note[c], staged=says[:2], has_card=os.path.exists(os.path.join(CARDS, c + '.mpd')),
                                thumb=f'odyssey/thumbs/{c}.webp' if os.path.exists(os.path.join(THUMBS, c + '.webp')) else None))
        figures.sort(key=lambda f: (-f['lines'], -len(f['scenes']), f['name']))
        props = sorted({p for s in ss for p in s['props']})
        card = forage.get(lid)
        kitset = list(dict.fromkeys(kit_locs.get(lid, []) + [k for s in ss for k in s['kits']]))
        keysc = [s['id'] for s in ss if s['has_keyframes']]
        placed_ss = [s for s in ss if s['location_source'] == 'scene file']
        locations.append(dict(
            id=lid, name=(reg.get(lid, {}).get('name') or title_of(lid)), is_asset=lid in loc_assets, atlas_aliases=sorted(alias[lid]),
            summary=re.sub(r'^location\.[\w-]+ — ', '', sentences(hdr)[0] if hdr else '')[:240],
            books=sorted({s['book'] for s in ss}), scenes=[s['id'] for s in ss], scenes_inferred=[s['id'] for s in ss if s['location_source'] == 'inferred'],
            n_scenes=len(ss), n_scenes_placed=len(placed_ss),
            lines=sum(s['lines'] for s in ss), dialogue=sum(s['dialogue'] for s in ss), narration=sum(s['narration'] for s in ss),
            dialogue_placed=sum(s['dialogue'] for s in placed_ss), dialogue_inferred=sum(s['dialogue'] for s in ss if s['location_source'] == 'inferred'),
            speakers=[dict(id=k, lines=n) for k, n in spoken_by.most_common() if k != 'PERFORMER.NARRATOR'],   # figure ids (variants credited)
            landscape=dict(terrain=prim, terrain_all=terr, vegetation=find(VEG, texts, weak['vegetation']), roads=find(ROADS, texts, weak['roads']), water=find(WATER, texts, weak['water']),
                           mentioned_once={k: [dict(kind=r['kind'], scene=r['sources'][0], snippet=r['snippet']) for r in v] for k, v in weak.items()},
                           architecture=[r['kind'] for r in find(ARCH, texts)], time_of_day=[r['kind'] for r in find(TIME, lit, strict=False)],
                           weather=[r['kind'] for r in find(WEATHER, lit, strict=False)], states=states, initial_state=initial,
                           floor_plan=next((f'scenes/_plans/{p}.mjs' for p, t in plans.items() if lid.split('.', 1)[1] in t or p in lid), None)),
            figures=figures, props=props,
            has_location_card=os.path.exists(os.path.join(CARDS, lid + '.mpd')),
            card=dict(file=f'odyssey/cards/{lid}.mpd', pieces=card['pieces'], status=card['status'], studs=card['studs'], scenes=card.get('scenes', []))
            if card else None,
            has_keyframes=bool(keysc), keyframe_scenes=keysc, kits=kitset, kit=kitset[0] if kitset else None,
            kits_planned=sorted({k for s in ss for k in s['kits_planned']} - set(kitset)),
            in_film=[s['id'] for s in ss if s['in_film']]))

    by_dlg = sorted(locations, key=lambda l: (-l['dialogue'], -l['lines'], -l['n_scenes'], l['id']))
    gaps = lambda f: [dict(id=l['id'], name=l['name'], dialogue=l['dialogue'], scenes=l['n_scenes']) for l in by_dlg if l['dialogue'] > 0 and f(l)]
    unplaced = [s for s in scenes if not s['locations']]
    palette = {}
    for key in ('vegetation', 'roads', 'water'):
        agg = defaultdict(list)
        for l in locations:
            for r in l['landscape'][key]: agg[r['kind']].append(l['id'])
        palette[key] = sorted(({'kind': k, 'n_locations': len(v), 'dialogue_there': sum(x['dialogue'] for x in locations if x['id'] in v), 'locations': v}
                               for k, v in agg.items()), key=lambda r: (-r['n_locations'], r['kind']))
    for key in ('terrain', 'time_of_day', 'weather', 'architecture'):
        c = Counter(); w = defaultdict(list)
        for l in locations:
            vals = [l['landscape']['terrain']] if key == 'terrain' else l['landscape'][key]
            for v in vals: c[v] += 1; w[v].append(l['id'])
        palette[key] = [{'kind': k, 'n_locations': n, 'locations': w[k]} for k, n in c.most_common()]

    totals = dict(scenes=len(scenes), locations=len(locations), location_assets=len(loc_assets),
                  turns=sum(s['turns'] for s in scenes), lines=sum(s['lines'] for s in scenes), dialogue=sum(s['dialogue'] for s in scenes),
                  narration=sum(s['narration'] for s in scenes),
                  scenes_placed=sum(1 for s in scenes if s['location_source'] == 'scene file'),
                  scenes_inferred=sum(1 for s in scenes if s['location_source'] == 'inferred'), scenes_unplaced=len(unplaced),
                  dialogue_unplaced=sum(s['dialogue'] for s in unplaced),
                  locations_with_card=sum(1 for l in locations if l['has_location_card']),
                  locations_with_keyframes=sum(1 for l in locations if l['has_keyframes']),
                  locations_with_kit=sum(1 for l in locations if l['kits']),
                  locations_with_dialogue=sum(1 for l in locations if l['dialogue']),
                  locations_unused=[l for l in loc_assets if not loc_scenes.get(l)],
                  scenes_with_keyframes=sum(1 for s in scenes if s['has_keyframes']), scenes_in_film=sum(1 for s in scenes if s['in_film']),
                  scenes_with_kit=sum(1 for s in scenes if s['kits']), scenes_with_key_beat=sum(1 for s in scenes if s['key_beat']))
    return dict(
        generated_by='tools/forage/product/locations.py', halfworld=HW,
        method=dict(
            lines='A spoken line is an entry of atlas/spoken-lines/lines-*.json whose "line" is non-empty (74 turns are silent action). Lines are '
                  'matched to scenes exactly by their METIS turn id, OD-Bnn-Snn-Tnn, whose prefix is the scene id; the speaker of each is the "sp" '
                  'of the same turn id in viewer/performance-turns.json (the line files carry no speaker). "dialogue" excludes the narrator '
                  '(PERFORMER.NARRATOR); "lines" includes it.',
            locations='A scene\'s location is what its scene file places: `import … from "../assets/location/<id>.mjs"` and `asset:"location.<id>"` '
                      'in its code (comments stripped). The atlas\'s own location ids are kept as atlas_locations; nine of them name no asset (the film '
                      'folded them into megaron-hall and weapon-storeroom) and appear as atlas_aliases. 24 scenes that place no location are given one '
                      'by hand (INFERRED, location_source "inferred", with the reason); 4 at open sea are left unplaced. A scene that places two sets '
                      'counts its lines at both.',
            landscape='Terrain: the id decides the primary kind when it names one (shore, cave, hall…); otherwise, and for the secondary kinds, '
                      'keyword counts over the texts (the asset\'s own header weighted 3x). Vegetation, roads, water, architecture, time and weather: '
                      'fixed word lists matched in the location asset\'s header comment ("asset"), the atlas registry\'s description of it ("atlas") '
                      'and the header comment and beats of every scene set there (scene id). Each term keeps its sources and a snippet. A term '
                      'named only in the text of one scene (not by the asset or atlas) is set apart in mentioned_once, since it may belong to a place '
                      'the scene only mentions; terms named in two scenes, or a fifth of a set\'s scenes when it has more than ten, are kept. Secondary terrain kinds are read from the asset and atlas only. States are the asset\'s own `states` nodes.',
            costumes='Figures are the character/ensemble/creature assets placed in the scenes set there. "wears" is lifted from the figure\'s own '
                     'asset header (sentences naming clothing or things carried); "staged" from the scene header sentences naming the figure and a '
                     'garment or object.',
            flags='has_location_card: odyssey/cards/<location>.mpd exists. has_keyframes: odyssey/keyframes/<scene>/sheet.jpg. in_film: '
                  'film-readymades/build_odyssey.py SCENES. kit: kitpages.SCENES plus the scene files named in each kit.json "sources"; a location '
                  'also has a kit when a kit.json names its asset file. A slug in kitpages.SCENES with no kit on disk is listed as kits_planned, not as a kit.'),
        totals=totals, scenes=scenes, locations=by_dlg,
        rankings=dict(
            locations_by_dialogue=[dict(id=l['id'], dialogue=l['dialogue'], lines=l['lines'], scenes=l['n_scenes']) for l in by_dlg],
            locations_by_scenes=[dict(id=l['id'], scenes=l['n_scenes'], dialogue=l['dialogue']) for l in
                                 sorted(locations, key=lambda l: (-l['n_scenes'], -l['dialogue'], l['id']))],
            scenes_by_dialogue=[dict(id=s['id'], title=s['title'], dialogue=s['dialogue'], lines=s['lines'], locations=s['locations'])
                                for s in sorted(scenes, key=lambda s: (-s['dialogue'], -s['lines'], s['n']))[:30]]),
        gaps=dict(no_location_card=gaps(lambda l: not l['has_location_card']), no_keyframes=gaps(lambda l: not l['has_keyframes']),
                  no_kit=gaps(lambda l: not l['kits']), no_keyframes_and_no_kit=gaps(lambda l: not l['has_keyframes'] and not l['kits']),
                  scenes_without_location=[dict(id=s['id'], title=s['title'], dialogue=s['dialogue'], at_sea=s['at_sea']) for s in unplaced],
                  atlas_locations_without_asset=sorted({a for s in scenes for a in s['atlas_locations'] if a not in loc_assets}),
                  location_assets_unused=totals['locations_unused']),
        palette=palette)


# ---------------------------------------------------------------------------------------------------------------------------------
EXTRA = '''
.stats.eight { margin-top: 0; border-top: 0; }
.chip { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: .04em; padding: 1px 6px; margin: 1px 2px 1px 0; border: 1px solid var(--rule); color: var(--muted); white-space: nowrap; text-decoration: none; }
.chip.on { border-color: var(--ok); color: var(--ok); } a.chip.on:hover { background: var(--ok); color: var(--paper); }
.chip.off { border-style: dashed; color: var(--bad); border-color: var(--bad); opacity: .8; }
.chip.inf { border-color: var(--gold); color: var(--gold); }
.tag { font-size: 12px; color: var(--muted); } .tag b { color: var(--ink); font-weight: 600; }
.bar { display: block; height: 6px; background: var(--ink); border-radius: 0 4px 4px 0; margin-top: 3px; min-width: 2px; }
.bar.alt { background: var(--gold); }
.terr { font: 600 11px Inter, sans-serif; text-transform: uppercase; letter-spacing: .1em; color: var(--blue); }
th[data-k] { cursor: pointer; user-select: none; } th[data-k]:hover { color: var(--ink); } th[aria-sort="descending"]::after { content: " ↓"; } th[aria-sort="ascending"]::after { content: " ↑"; }
input[type=search] { font: 14px Inter, sans-serif; padding: 7px 10px; border: 1.5px solid var(--ink); background: var(--card); color: var(--ink); min-width: 240px; }
.pal { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 22px; }
.pal table td:first-child { width: 34%; font-weight: 600; }
.pal .locs { font-size: 12px; color: var(--muted); }
details { border-top: 1px solid var(--rule); padding: 8px 0; } details > summary { cursor: pointer; font-weight: 600; list-style-position: outside; }
details > summary .tag { font-weight: 400; margin-left: 8px; }
.figs { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin: 10px 0 6px; }
.fig { display: grid; grid-template-columns: 48px 1fr; gap: 10px; background: var(--card); border: 1px solid var(--rule); padding: 8px; font-size: 13px; }
.fig img, .fig .ph { width: 48px; height: 48px; object-fit: contain; background: var(--paper); }
.fig .ph { background: repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 8px); }
.fig p { margin: 2px 0; color: var(--muted); } .fig i { color: var(--ink); }
.speakers { font-size: 13px; } .speakers span { white-space: nowrap; }
.beat { font-size: 12px; color: var(--muted); font-style: italic; }
.book h3 { margin-top: 30px; }
.note { font-size: 13px; color: var(--muted); max-width: 900px; }
.gapgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 22px; }
.gapgrid ol { padding-left: 22px; margin: 6px 0; font-size: 14px; } .gapgrid li { margin: 3px 0; }
td.sm { font-size: 12px; color: var(--muted); max-width: 240px; }
@media (max-width: 800px) { .hide-sm { display: none; } input[type=search] { min-width: 0; width: 100%; } }
'''


def chip(on, label, href=None, title=''):
    cls = 'chip on' if on else 'chip off'
    t = f' title="{E(title)}"' if title else ''
    return f'<a class="{cls}" href="{E(href)}"{t}>{E(label)}</a>' if (on and href) else f'<span class="{cls}"{t}>{E(label)}</span>'


INF_CHIP = ' <span class="chip inf">inferred</span>'


def short(lid): return lid.split('.', 1)[1]


def page(D):
    T, L, S = D['totals'], D['locations'], D['scenes']
    name = {l['id']: l['name'] for l in L}
    kit_title = {k['slug']: k['title'] for k in kitpages.load()}
    maxd = max(l['dialogue'] for l in L) or 1
    out = [HEAD.format(title='Locations and Dialogue', style=STYLE + EXTRA)]
    out.append(f'''  <div class="kicker"><a href="index.html">The Odyssey Line</a> · the location and dialogue atlas</div>
  <h1>Where the words happen</h1>
  <p class="lede">Every place the film builds, ranked by how much is said there: the ground and trees and roads and waters of each, the
    light it plays in, the people who stand in it and what they wear, and how much of it the LEGO world already has. Drawn from the film's
    152 scenes and every spoken line, measured when this page was made.</p>
  <div class="stats">
    <div><b>{T["scenes"]}</b><span>scenes</span></div>
    <div><b>{T["locations"]}</b><span>locations</span></div>
    <div><b>{T["dialogue"]:,}</b><span>lines of dialogue</span></div>
    <div><b>{T["narration"]:,}</b><span>lines of narration</span></div>
  </div>
  <div class="stats eight">
    <div><b>{T["locations_with_card"]} / {T["locations"]}</b><span>locations with a card</span></div>
    <div><b>{T["locations_with_keyframes"]}</b><span>locations with keyframes</span></div>
    <div><b>{T["locations_with_kit"]}</b><span>locations with a kit</span></div>
    <div><b>{T["scenes_placed"]} + {T["scenes_inferred"]}</b><span>scenes placed + inferred</span></div>
  </div>
  <p class="note">{T["scenes_with_keyframes"]} scenes have keyframes, {T["scenes_in_film"]} are in the film build, {T["scenes_with_kit"]} are
    covered by a kit. {T["scenes_unplaced"]} scenes play at open sea with no set ({T["dialogue_unplaced"]} lines of dialogue).
    <a href="locations.json">locations.json</a> holds everything below.</p>''')

    # ---- ranked table ----
    out.append('''  <h2>The locations, ranked by dialogue</h2>
  <p class="sub">Lines of dialogue spoken in scenes set there (the narrator's apart); click a heading to sort. Gold figures count scenes
    placed here by inference. Chips: <b>card</b> the LEGO location card, <b>frames</b> the film's keyframe sheets, <b>kit</b> a kit drawn from the place.</p>
  <div class="filters"><input type="search" id="q" placeholder="Filter: a place, a tree, a road, a book…" aria-label="Filter locations"></div>
  <div class="tablewrap"><table id="loc">
    <thead><tr><th data-k="n" class="n">#</th><th data-k="s">Location</th><th data-k="n" class="n" aria-sort="descending">Dialogue</th><th data-k="n" class="n">Scenes</th>
    <th data-k="s">Ground</th><th>Vegetation</th><th class="hide-sm">Roads &amp; paths</th><th class="hide-sm">Water</th><th>In the LEGO world</th></tr></thead><tbody>''')
    for i, l in enumerate(L, 1):
        ls = l['landscape']
        books = ', '.join(ROMAN[b - 1] for b in l['books'])
        inf = f' <span style="color:var(--gold)" title="of which inferred">({l["dialogue_inferred"]})</span>' if l['dialogue_inferred'] else ''
        chips = [chip(l['has_location_card'], 'card', f'../cards/{l["id"]}.mpd', f'{l["card"]["pieces"]} pieces · {l["card"]["status"]}' if l['card'] else '')]
        if l['keyframe_scenes']:
            chips += [chip(True, 'frames ' + s[3:], f'../keyframes/{s}/sheet.jpg', 'keyframe sheet') for s in l['keyframe_scenes']]
        else: chips.append(chip(False, 'frames'))
        chips += [chip(True, 'kit: ' + kit_title.get(k, k), f'{k}/') for k in l['kits']] or [chip(False, 'kit')]
        chips += [f'<span class="chip inf" title="named in kitpages.SCENES, not built yet">kit planned: {E(k)}</span>' for k in l['kits_planned']]
        search = ' '.join([l['name'], l['id'], books, ls['terrain'], *(r['kind'] for r in ls['vegetation'] + ls['roads'] + ls['water'])]).lower()
        out.append(f'''    <tr data-q="{E(search)}"><td class="n">{i}</td><td data-v="{E(l["name"])}"><b>{E(l["name"])}</b><br><span class="tag">{E(short(l["id"]))} · Book {books or "–"}</span></td>
      <td class="n" data-v="{l["dialogue"]}"><b>{l["dialogue"]}</b>{inf}<span class="bar" style="width:{max(2, 100 * l["dialogue"] // maxd)}%"></span><span class="tag">+{l["narration"]} narr.</span></td>
      <td class="n" data-v="{l["n_scenes"]}">{l["n_scenes"]}</td><td data-v="{ls["terrain"]}"><span class="terr">{E(ls["terrain"])}</span><br><span class="tag">{E(", ".join(ls["terrain_all"][1:]))}</span></td>
      <td class="sm">{E(", ".join(r["kind"] for r in ls["vegetation"][:6])) or "–"}</td><td class="sm hide-sm">{E(", ".join(r["kind"] for r in ls["roads"][:5])) or "–"}</td>
      <td class="sm hide-sm">{E(", ".join(r["kind"] for r in ls["water"][:4])) or "–"}</td><td>{"".join(chips)}</td></tr>''')
    out.append('  </tbody></table></div>')

    # ---- the scenes with most dialogue ----
    top = D['rankings']['scenes_by_dialogue'][:15]
    maxs = top[0]['dialogue'] or 1
    out.append('  <h2>The scenes with the most said</h2>\n  <p class="sub">The fifteen scenes with the most lines of dialogue, and where they are set.</p>\n  <div class="tablewrap"><table>'
               '<tr><th>Scene</th><th>Title</th><th>Set in</th><th class="n">Dialogue</th><th class="hide-sm">Speakers</th></tr>')
    byid = {s['id']: s for s in S}
    for r in top:
        s = byid[r['id']]
        where = ', '.join(E(name.get(l, l)) for l in s['locations']) or '<i>at sea</i>'
        sp = ' · '.join(f'{E(x["name"])} {x["lines"]}' for x in s['speakers'] if x['id'] != 'PERFORMER.NARRATOR')
        out.append(f'  <tr><td><a href="#{s["id"]}">{s["id"]}</a></td><td>{E(s["title"])}</td><td>{where}{INF_CHIP if s["location_source"] == "inferred" else ""}</td>'
                   f'<td class="n"><b>{s["dialogue"]}</b><span class="bar alt" style="width:{100 * s["dialogue"] // maxs}%"></span></td><td class="speakers hide-sm">{sp}</td></tr>')
    out.append('  </table></div>')

    # ---- landscape palette ----
    P = D['palette']
    out.append('''  <h2>The landscape palette</h2>
  <p class="sub">What the whole poem is made of: each kind of ground, growth, way and water, with the number of locations whose sources name it
    and the places themselves (the most-spoken first). Found by word lists in the asset and scene texts; see the method below.</p>
  <div class="pal">''')
    rank = {l['id']: i for i, l in enumerate(L)}
    for key, label in (('terrain', 'Ground'), ('vegetation', 'Vegetation'), ('roads', 'Roads and paths'), ('water', 'Waters'),
                       ('time_of_day', 'Time of day'), ('weather', 'Weather')):
        rows = P[key]; mx = max((r['n_locations'] for r in rows), default=1)
        out.append(f'    <div><h3>{label}</h3><table>')
        for r in rows[:14]:
            locs = sorted(r['locations'], key=lambda x: rank.get(x, 999))
            ls_ = ', '.join(E(name.get(x, x)) for x in locs[:5]) + (f' and {len(locs) - 5} more' if len(locs) > 5 else '')
            out.append(f'      <tr title="{E(r["kind"])}: {r["n_locations"]} locations"><td>{E(r["kind"])}</td><td class="n">{r["n_locations"]}</td>'
                       f'<td><span class="bar" style="width:{100 * r["n_locations"] // mx}%"></span><span class="locs">{ls_}</span></td></tr>')
        out.append('    </table></div>')
    out.append('  </div>')

    # ---- costumes by place ----
    out.append('''  <h2>Costumes by place</h2>
  <p class="sub">Who stands in each place and what they wear or carry: from each figure's own asset, and (in italics) from the scene that
    stages them there. Portraits are the LEGO character cards. Places in order of dialogue.</p>''')
    for l in L:
        if not l['figures']: continue
        out.append(f'  <details{" open" if rank[l["id"]] < 3 else ""}><summary>{E(l["name"])}<span class="tag">{len(l["figures"])} figures · {l["dialogue"]} lines · '
                   f'{E(l["landscape"]["terrain"])}</span></summary>')
        if l['props']: out.append(f'    <p class="tag"><b>Props there:</b> {E(", ".join(title_of(p) for p in l["props"]))}</p>')
        out.append('    <div class="figs">')
        for f in l['figures'][:18]:
            img = f'<img src="../thumbs/{f["id"]}.webp" alt="{E(f["name"])}" loading="lazy" width="48" height="48">' if f['thumb'] else '<div class="ph"></div>'
            st = ''.join(f'<p><i>{E(x["text"][:200])}</i> ({x["scene"][3:]})</p>' for x in f['staged'][:1])
            out.append(f'      <div class="fig">{img}<div><b>{E(f["name"])}</b> <span class="tag">{len(f["scenes"])} sc · {f["lines"]} lines</span>'
                       f'<p>{E(f["wears"]) or "—"}</p>{st}</div></div>')
        more = len(l['figures']) - 18
        out.append('    </div>' + (f'<p class="tag">and {more} more in locations.json</p>' if more > 0 else '') + '\n  </details>')

    # ---- book by book ----
    out.append('''  <h2>Book by book</h2>
  <p class="sub">Every scene: where it is set, who speaks and how often, the key beat the film plays it on (<code>scenes/_direction.mjs</code>),
    and what the LEGO world has of it.</p>''')
    for b in range(1, 25):
        bs = [s for s in S if s['book'] == b]
        out.append(f'  <div class="book"><h3>Book {ROMAN[b - 1]} · {E(bs[0]["book_title"])}</h3><span class="tag">{sum(s["dialogue"] for s in bs)} lines of dialogue in {len(bs)} scenes</span>'
                   '\n  <div class="tablewrap"><table><tr><th>Scene</th><th>Set in</th><th>Speakers</th><th class="n">Lines</th><th class="hide-sm">Key beat</th><th>Has</th></tr>')
        for s in bs:
            where = ', '.join(E(name.get(l, l)) for l in s['locations']) or ('<i>at sea</i>' if s['at_sea'] else '<i>no set</i>')
            if s['location_source'] == 'inferred': where += f' <span class="chip inf" title="{E(s["inferred_reason"])}">inferred</span>'
            sp = ' · '.join(f'<span>{E(x["name"])} {x["lines"]}</span>' for x in s['speakers'] if x['id'] != 'PERFORMER.NARRATOR') or '—'
            kb = f'<span class="beat">{E(s["key_beat"]["emotion"])}: {E(s["key_beat"]["note"])}</span>' if s['key_beat'] else ''
            has = (chip(True, 'frames', f'../keyframes/{s["id"]}/sheet.jpg') if s['has_keyframes'] else '') + \
                  (chip(True, 'film') if s['in_film'] else '') + ''.join(chip(True, 'kit', f'{k}/', kit_title.get(k, k)) for k in s['kits'][:1])
            out.append(f'    <tr id="{s["id"]}"><td><b>{s["id"][4:]}</b><br>{E(s["title"])}</td><td>{where}</td><td class="speakers">{sp}</td>'
                       f'<td class="n"><b>{s["dialogue"]}</b><br><span class="tag">+{s["narration"]}</span></td><td class="hide-sm">{kb}</td><td>{has}</td></tr>')
        out.append('  </table></div></div>')

    # ---- gaps ----
    G = D['gaps']
    def gl(rows, n=15):
        return '<ol>' + ''.join(f'<li>{E(r["name"])} <span class="tag">{r["dialogue"]} lines · {r["scenes"]} sc</span></li>' for r in rows[:n]) + '</ol>' + \
               (f'<p class="tag">and {len(rows) - n} more</p>' if len(rows) > n else '')
    out.append(f'''  <h2>The gaps</h2>
  <p class="sub">Places where the poem speaks and the LEGO world has not yet caught up, the most-spoken first.</p>
  <div class="gapgrid">
    <div><h3>No keyframes and no kit</h3><p class="tag">{len(G["no_keyframes_and_no_kit"])} locations with dialogue</p>{gl(G["no_keyframes_and_no_kit"])}</div>
    <div><h3>No kit</h3><p class="tag">{len(G["no_kit"])} locations with dialogue</p>{gl(G["no_kit"])}</div>
    <div><h3>No keyframes</h3><p class="tag">{len(G["no_keyframes"])} locations with dialogue</p>{gl(G["no_keyframes"])}</div>
    <div><h3>No location card</h3><p class="tag">{len(G["no_location_card"])} locations with dialogue{" (every location asset has its card)" if not G["no_location_card"] else ""}</p>{gl(G["no_location_card"]) if G["no_location_card"] else ""}
      <h3 style="margin-top:18px">Scenes with no set</h3><p class="tag">{len(G["scenes_without_location"])} scenes at open sea</p><ol>{"".join(f'<li><a href="#{r["id"]}">{r["id"]}</a> {E(r["title"])} <span class="tag">{r["dialogue"]} lines</span></li>' for r in G["scenes_without_location"])}</ol>
      <h3 style="margin-top:18px">Atlas places with no asset</h3><p class="tag">folded by the film into another set</p><p class="tag">{E(", ".join(short(x) for x in G["atlas_locations_without_asset"]))}</p></div>
  </div>''')

    # ---- method ----
    M = D['method']
    out.append('  <h2>How this was measured</h2>\n  <ul class="note">' + ''.join(f'<li><b>{E(k)}.</b> {E(v)}</li>' for k, v in M.items()) +
               '<li><b>inferred scenes.</b> ' + '; '.join(f'{E(k[3:])} → {E(short(v[0]))}' for k, v in INFERRED.items()) + '.</li></ul>')
    out.append('''  <footer>Made by <code>tools/forage/product/locations.py</code> from the film's sources (odyssey-halfworld) and this repository's cards,
    keyframes and kits; every number measured when it ran. <a href="index.html">Back to the Odyssey Line</a> · <a href="locations.json">locations.json</a></footer>
</main>
<script>
(() => {
  const t = document.getElementById('loc'), tb = t.tBodies[0], q = document.getElementById('q');
  q.addEventListener('input', () => { const v = q.value.trim().toLowerCase();
    for (const r of tb.rows) r.style.display = !v || r.dataset.q.includes(v) || r.textContent.toLowerCase().includes(v) ? '' : 'none'; });
  t.querySelectorAll('th[data-k]').forEach((th, i) => th.addEventListener('click', () => {
    const num = th.dataset.k === 'n', desc = th.getAttribute('aria-sort') !== 'descending';
    t.querySelectorAll('th').forEach(x => x.removeAttribute('aria-sort')); th.setAttribute('aria-sort', desc ? 'descending' : 'ascending');
    const val = r => { const c = r.cells[i]; const v = c.dataset.v ?? c.textContent; return num ? parseFloat(v) || 0 : v.toLowerCase(); };
    [...tb.rows].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1); }).forEach(r => tb.appendChild(r));
  }));
})();
</script>
</body>
</html>''')
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    D = build()
    with open(os.path.join(KITS, 'locations.json'), 'w') as f: json.dump(D, f, indent=1, ensure_ascii=False)
    with open(os.path.join(KITS, 'locations.html'), 'w') as f: f.write(page(D))
    T = D['totals']
    print(f"{T['scenes']} scenes ({T['scenes_placed']} placed, {T['scenes_inferred']} inferred, {T['scenes_unplaced']} at sea); {T['locations']} locations; "
          f"{T['lines']} lines ({T['dialogue']} dialogue, {T['narration']} narration); cards {T['locations_with_card']}, keyframes "
          f"{T['locations_with_keyframes']}, kits {T['locations_with_kit']}; wrote odyssey/kits/locations.json and locations.html")
