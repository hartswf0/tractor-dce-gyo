#!/usr/bin/env python3
"""tools/forage/product/build_shield_portals.py
1. Builds interactive 3D WebGL <agent-embed> portals for The Shield of Achilles.
2. Compiles achilles/kits/shield-dioramas-bundle.js containing:
   - Master Circular Shield (set.shield-of-achilles, set.shield-frame, set.shield-m0..m9)
   - All 8 Monumental 48x32 Standalone Diorama Kits (set.shield-diorama-*)
   so odyssey-forage.html and shield-experiments.html can load any of them in live 3D WebGL.
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import kitlib
import build_achilles_site_and_portals as B

# Point card lookup to odyssey/cards where set.shield-*.mpd live
B.ACH_CARDS = kitlib.CARDS

# Register turntable zones for M0 (Boss Bear at 0,0), M8 (Choros Potter's Wheel at 360, 680), and Dioramas
B.TT_ZONES['shield-of-achilles']     = [(0, 0, 110, 45), (360, 680, 40, 45)]
B.TT_ZONES['shield-m0']              = [(0, 0, 110, 45)]
B.TT_ZONES['shield-m8']              = [(360, 680, 40, 45)]
B.TT_ZONES['shield-diorama-wedding'] = [(0, 80, 20, 75)]
B.TT_ZONES['shield-diorama-agora']   = [(0, 40, 20, 45)]
B.TT_ZONES['shield-diorama-choros']  = [(0, 60, 20, 95)]
B.TT_ZONES['shield-diorama-office']  = [(0, 40, 20, 45)]

B.HOTSPOTS['shield-of-achilles'] = [
    ('Hero Overview',        [340, 960, 1280], [0, 50, 0]),
    ('M0: Heavens on Boss',  [0, 320, 260],    [0, 115, 0]),
    ('M1: Sacred Circle',    [-320, 260, 360], [-220, 80, 160]),
    ('M2: Ares & Athena',    [360, 260, 140],  [260, 85, -80]),
    ('M3: Black Furrows',    [-560, 260, 240], [-540, 65, -40]),
    ('M4: Silent King & Oak',[580, 260, 140],  [460, 65, -140]),
    ('M5: Golden Vineyard',  [0, 260, 740],    [0, 65, 500]),
    ('M6: Two Lions & Bull', [-260, 240, 940], [-200, 48, 700]),
    ('M7: White Sheep Glen', [0, 260, -440],   [0, 48, -720]),
    ('M8: Choros Turntable', [460, 240, 920],  [360, 48, 680]),
]

B.HOTSPOTS['shield-m2'] = [
    ('M2 Hero Overview',     [420, 320, 420],  [240, 75, 0]),
    ('Golden Ares & Athena', [280, 190, 120],  [260, 95, -80]),
    ('River Ambush & Cattle',[240, 180, 360],  [200, 65, 200]),
    ('Besieged City Wall',   [160, 220, -120], [140, 105, -300]),
]

B.HOTSPOTS['shield-m8'] = [
    ('M8 Hero Overview',     [560, 380, 720],  [440, 45, 240]),
    ('Potter’s Wheel Choros',[380, 180, 880],  [360, 50, 680]),
    ('Knossian Portico',     [740, 210, 260],  [720, 55, 60]),
]

DIORAMA_HOTSPOTS = [
    ('Hero Stage View',      [120, 480, 760],  [0, 75, -20]),
    ('Minifig Street Level', [40, 165, 420],   [0, 65, -40]),
    ('Architectural Facade', [-180, 310, 460], [-60, 110, -140]),
    ('Top-Down Plan',        [0, 960, 120],    [0, 40, 0]),
]
for dslug in (
    'shield-diorama-wedding', 'shield-diorama-agora', 'shield-diorama-ambush',
    'shield-diorama-sheepfold', 'shield-diorama-harvest', 'shield-diorama-vineyard',
    'shield-diorama-cattle', 'shield-diorama-choros', 'shield-diorama-office',
):
    B.HOTSPOTS[dslug] = DIORAMA_HOTSPOTS

PORTAL_SPECS = [
    {
        'slug': 'shield-of-achilles',
        'card': 'set.shield-of-achilles',
        'num': 'MASTER ASSEMBLY (M0–M9)',
        'lines': 'ILIAD XVIII.478–608',
        'pieces': 7522,
        'title': 'The Shield of Achilles — Five Concentric Rings & Ten Lift-Out Kits',
        'object': '96×96 stud bronze, kyanos & gold domed frame with 10 independent lift-out sections (0 not clicked, 0 clashes)',
        'out': 'shield_portal_complete.html',
    },
    {
        'slug': 'shield-m2',
        'card': 'set.shield-m2',
        'num': 'SECTION M2 (HERO KIT)',
        'lines': 'ILIAD XVIII.509–540',
        'pieces': 527,
        'title': 'M2: The City at War — Golden Ares & Athena and the River Ambush',
        'object': 'Besieged bronze battlements, raised Pearl Gold Ares & Athena (+32 LDU), reed-bed scouts, and riverbank cattle ambush',
        'out': 'shield_portal_m2.html',
    },
    {
        'slug': 'shield-m8',
        'card': 'set.shield-m8',
        'num': 'SECTION M8 (OUTER RING)',
        'lines': 'ILIAD XVIII.590–606',
        'pieces': 470,
        'title': 'M8: The Choros Dance Floor of Daedalus & Potter’s Wheel',
        'object': 'Revolving 4×4 turntable (61485c01) with two whirling tumblers and wrist-in-wrist youths and maidens',
        'out': 'shield_portal_m8.html',
    },
]

BUNDLE_SPECS = [
    ('shield-of-achilles',       'set.shield-of-achilles',       'MASTER M0–M9', 'The Shield of Achilles (96×96 Circular Assembly)', 7522),
    ('shield-frame',             'set.shield-frame',             'FRAME',        'The Shield Frame (96×96 Stepped Seats & Dividers)', 2754),
    ('shield-m0',                'set.shield-m0',                'SECTION M0',   'M0: Earth, Sea, Sky, Sun, Moon & Bear on the Boss', 376),
    ('shield-m1',                'set.shield-m1',                'SECTION M1',   'M1: The City at Peace — Bridal Torch-Song & Agora', 486),
    ('shield-m2',                'set.shield-m2',                'SECTION M2',   'M2: The City at War — Golden Ares & Athena & Ambush', 527),
    ('shield-m3',                'set.shield-m3',                'SECTION M3',   'M3: The Thrice-Ploughed Field & Headland Wine-Cup', 437),
    ('shield-m4',                'set.shield-m4',                'SECTION M4',   'M4: The King’s Estate, Reapers & Oak Ox-Feast', 497),
    ('shield-m5',                'set.shield-m5',                'SECTION M5',   'M5: The Golden Vineyard, Kyanos Trench & Linus Boy', 443),
    ('shield-m6',                'set.shield-m6',                'SECTION M6',   'M6: Cattle of Gold & Tin, Two Lions & Nine Dogs', 413),
    ('shield-m7',                'set.shield-m7',                'SECTION M7',   'M7: The Fair Glen of White Sheep, Roofed Folds & Cots', 426),
    ('shield-m8',                'set.shield-m8',                'SECTION M8',   'M8: The Choros Dance Floor of Daedalus & Potter’s Wheel', 470),
    ('shield-m9',                'set.shield-m9',                'SECTION M9',   'M9: The Mighty Stream of River Oceanus & Triple Rim', 693),
    ('shield-diorama-wedding',   'set.shield-diorama-wedding',   'DIORAMA I (48×32)',    'The Bridal Torch-Procession & Three Townhouses', 3475),
    ('shield-diorama-agora',     'set.shield-diorama-agora',     'DIORAMA II (48×32)',   'The Agora Dispute, Doric Stoa & Two Talents of Gold', 2119),
    ('shield-diorama-ambush',    'set.shield-diorama-ambush',    'DIORAMA III (48×32)',  'The City at War, Scaean Gate, 1.6× Gods & River Ambush', 1957),
    ('shield-diorama-sheepfold', 'set.shield-diorama-sheepfold', 'DIORAMA IV (48×32)',   'The Fair Glen of White Sheep, Roofed Folds & Steading', 1998),
    ('shield-diorama-harvest',   'set.shield-diorama-harvest',   'DIORAMA V (48×32)',    'The King’s Harvest, Thrice-Ploughed Glebe & Oak Feast', 1673),
    ('shield-diorama-vineyard',  'set.shield-diorama-vineyard',  'DIORAMA VI (48×32)',   'The Golden Vineyard, Kyanos Trench & Wine-Press Pavilion', 1809),
    ('shield-diorama-cattle',    'set.shield-diorama-cattle',    'DIORAMA VII (48×32)',  'Straight-Horned Cattle of Gold & Tin & Two Tawny Lions', 2168),
    ('shield-diorama-choros',    'set.shield-diorama-choros',    'DIORAMA VIII (48×32)', 'The Choros of Daedalus, Knossian Palace & Tumblers', 1970),
    ('shield-diorama-office',    'set.shield-diorama-office',    'DIORAMA IX (48×32)',   'The Agent Office — Hephaestus’s Cybernetic Foundry & Eleven Workstations', 2529),
]

if __name__ == '__main__':
    bundle_ext = {}
    for slug, card, num, title, pcs in BUNDLE_SPECS:
        spec = {'slug': slug, 'card': card, 'num': num, 'title': title, 'pieces': pcs}
        payload, n_inst = B.compile_kit_payload(spec)
        entry = {
            'slug': slug,
            'card': card,
            'num': num,
            'title': title,
            'pieces': pcs,
            'hotspots': B.HOTSPOTS.get(slug, DIORAMA_HOTSPOTS),
            'data': payload,
        }
        bundle_ext[slug] = entry
        bundle_ext[card] = entry
        print(f"  Compiled {card:30s} -> {n_inst:5d} instances")

    ext_path = os.path.join(kitlib.ROOT, 'achilles/kits/shield-dioramas-bundle.js')
    with open(ext_path, 'w', encoding='utf-8') as f:
        f.write('window.ACHILLES_BUNDLE = Object.assign(window.ACHILLES_BUNDLE || {}, ')
        f.write(json.dumps(bundle_ext, separators=(',', ':')))
        f.write(');\n')
    print(f"Wrote {ext_path} ({os.path.getsize(ext_path)//1024} KB)")

    for s in PORTAL_SPECS:
        payload = bundle_ext[s['slug']]['data']
        html = B.build_portal_html(s, payload)
        out_path = os.path.join(B.ARTIFACT_DIR, s['out'])
        with open(out_path, 'w') as f:
            f.write(html)
        print(f"Wrote {out_path} ({len(html)//1024} KB)")
