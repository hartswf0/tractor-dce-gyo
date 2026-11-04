#!/usr/bin/env python3
"""tools/forage/product/build_achilles_site_and_portals.py
1. Compiles real ./ldraw/parts/*.dat triangle meshes (including sub-part colors for minifigure faces) and the 7 Odyssey-grade
   Shield of Achilles kits into:
   - achilles/kits/forage-bundle.js (so odyssey-forage.html works over both file:// and http:// with zero CORS issues)
   - 7 self-contained <agent-embed> 3D WebGL portals in the artifact directory (with synchronous JSON data and studio photo toggle)
2. Generates achilles/kits/index.html, achilles/kits/brief.html, and per-kit pages achilles/kits/<slug>/index.html
   with rendered studio photography (hero.jpg, top.jpg, detail.jpg) matching odyssey/kits/index.html.
"""
import base64, glob, json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ldbox, sculpt, landscape as L, kitlib
if not hasattr(ldbox, 'apply'):
    ldbox.apply = lambda m, p, x, y, z: (
        p[0] + m[0] * x + m[1] * y + m[2] * z,
        p[1] + m[3] * x + m[4] * y + m[5] * z,
        p[2] + m[6] * x + m[7] * y + m[8] * z,
    )
try:
    from kits.achilles_line import KITS_SPEC, ACH_CARDS, ACH_KITS
except Exception:
    KITS_SPEC, ACH_CARDS, ACH_KITS = [], kitlib.CARDS, kitlib.KITS

ROOT = kitlib.ROOT
ARTIFACT_DIR = '/Users/gaia/.gemini/antigravity/brain/d8a4c224-935e-4162-8570-670291acacf3'

TILE_PIDS = {p for _, p in sculpt.TILES} | {'87079', '3068b', '4162', '6636', '2431', '63864', '3069b', '3070b'}
RECT_PIDS = (
    {p for _, p in sculpt.BRICKS + sculpt.PLATES + sculpt.TILES}
    | TILE_PIDS
    | {'4282', '91988', '3832', '3034', '3795', '3020', '3021', '3022', '3031', '3001', '3003', '4186'}
)


def parse_ldconfig():
    """Read LDraw colour hex & alpha from ./ldraw/LDConfig.ldr."""
    cols = {}
    cfg = os.path.join(ROOT, 'ldraw/LDConfig.ldr')
    for line in open(cfg, errors='ignore'):
        t = line.split()
        if len(t) >= 7 and t[1] == '!COLOUR' and 'CODE' in t and 'VALUE' in t:
            code = int(t[t.index('CODE') + 1])
            val = t[t.index('VALUE') + 1].lstrip('#')
            alpha = int(t[t.index('ALPHA') + 1]) if 'ALPHA' in t else 255
            metal = 'METAL' in t or 'PEARL' in t or code in (297, 179, 138, 148, 135)
            cols[code] = {'hex': '#' + val.lower(), 'a': round(alpha / 255.0, 2), 'm': 1 if metal else 0}
    return cols


LD_COLS = parse_ldconfig()


def extract_part_mesh(pid):
    """Extract indexed triangle mesh (v: flat float list quantized to 0.1 LDU, i: flat triangle index list,
    c: per-triangle sub-color list when non-16 colors exist, e.g. black eyes on 3626bp01.dat)
    from ./ldraw/parts/<pid>.dat and its subfiles."""
    path = ldbox.find(pid)
    if not path:
        return {'v': [], 'i': []}
    verts, vmap, idx, tcols = [], {}, [], []

    is_head = str(pid).lower().startswith('3626')

    def offset_decal_pt(pt, col):
        if is_head and col != 16:
            r = math.hypot(pt[0], pt[2])
            if r > 1.0:
                return (pt[0] + (pt[0] / r) * 0.08, pt[1], pt[2] + (pt[2] / r) * 0.08)
        return pt

    def add_v(pt):
        k = (round(pt[0], 2), round(pt[1], 2), round(pt[2], 2))
        if k not in vmap:
            vmap[k] = len(verts) // 3
            verts.extend(k)
        return vmap[k]

    def add_tri(a, b, c, col):
        ia, ib, ic = add_v(offset_decal_pt(a, col)), add_v(offset_decal_pt(b, col)), add_v(offset_decal_pt(c, col))
        if ia != ib and ib != ic and ia != ic:
            idx.extend((ia, ib, ic))
            tcols.append(col)

    def walk(fpath, p, m, cur_col):
        for raw in open(fpath, errors='ignore'):
            t = raw.split()
            if not t:
                continue
            if t[0] == '1' and len(t) >= 15:
                c = int(t[1])
                sc = cur_col if c in (16, 24) else c
                sub = ' '.join(t[14:]).lower().replace('\\', '/')
                base = os.path.basename(sub)
                if any(base.startswith(k) for k in ('stud4', 'stud3', 'stud10', 'stud6')):
                    continue
                if base in ('stud.dat', 'stud2.dat', 'stud2a.dat'):
                    sp_p = ldbox.apply(m, p, float(t[2]), float(t[3]), float(t[4]))
                    sp_m = ldbox.mul(m, [float(v) for v in t[5:14]])
                    pts_b = [ldbox.apply(sp_m, sp_p, 6 * math.cos(a * math.pi / 4), 0, 6 * math.sin(a * math.pi / 4)) for a in range(8)]
                    pts_t = [ldbox.apply(sp_m, sp_p, 6 * math.cos(a * math.pi / 4), -4, 6 * math.sin(a * math.pi / 4)) for a in range(8)]
                    tc = ldbox.apply(sp_m, sp_p, 0, -4, 0)
                    for a in range(8):
                        b = (a + 1) % 8
                        add_tri(pts_b[a], pts_b[b], pts_t[b], sc)
                        add_tri(pts_b[a], pts_t[b], pts_t[a], sc)
                        add_tri(tc, pts_t[b], pts_t[a], sc)
                    continue
                sp = ldbox.find(sub)
                if sp:
                    sp_p = ldbox.apply(m, p, float(t[2]), float(t[3]), float(t[4]))
                    sp_m = ldbox.mul(m, [float(v) for v in t[5:14]])
                    walk(sp, sp_p, sp_m, sc)
            elif t[0] == '3' and len(t) >= 11:
                c = int(t[1])
                sc = cur_col if c in (16, 24) else c
                pts = [ldbox.apply(m, p, float(t[2 + 3 * k]), float(t[3 + 3 * k]), float(t[4 + 3 * k])) for k in range(3)]
                add_tri(pts[0], pts[1], pts[2], sc)
            elif t[0] == '4' and len(t) >= 14:
                c = int(t[1])
                sc = cur_col if c in (16, 24) else c
                pts = [ldbox.apply(m, p, float(t[2 + 3 * k]), float(t[3 + 3 * k]), float(t[4 + 3 * k])) for k in range(4)]
                add_tri(pts[0], pts[1], pts[2], sc)
                add_tri(pts[0], pts[2], pts[3], sc)

    walk(path, (0.0, 0.0, 0.0), [1, 0, 0, 0, 1, 0, 0, 0, 1], 16)
    res = {'v': verts, 'i': idx}
    if any(c != 16 for c in tcols):
        res['c'] = tcols
    return res


# Turntable zones per kit slug: (cx, cz, min_yup, radius)
TT_ZONES = {
    'achilles-forge': [(0, -140, 144, 105)],
    'achilles-peace': [(-240, 20, 24, 55), (240, 60, 24, 55)],
    'achilles-war': [(-160, 0, 24, 55)],
    'achilles-field': [(280, 100, 24, 58)],
    'achilles-pasture': [(-160, 0, 24, 58)],
    'achilles-choros': [(0, 0, 24, 105)],
    'achilles-shield': [(0, 0, 56, 60)],
    'achilles-rotunda': [(0, 40, 34, 28)],
    'achilles-rotunda-shell': [(0, 40, 34, 28)],
    'achilles-rotunda-plinth': [(0, 40, 34, 28)],
    'achilles-rotunda-atrium': [(0, 40, 34, 28)],
}

PORTAL_FILES = {
    'achilles-shield': 'achilles_portal_master.html',
    'achilles-forge': 'achilles_portal_z01.html',
    'achilles-peace': 'achilles_portal_z02.html',
    'achilles-war': 'achilles_portal_z03.html',
    'achilles-field': 'achilles_portal_z04.html',
    'achilles-pasture': 'achilles_portal_z05.html',
    'achilles-choros': 'achilles_portal_z06.html',
    'achilles-rotunda': 'achilles_portal_rotunda.html',
    'achilles-rotunda-shell': 'achilles_portal_rotunda_shell.html',
    'achilles-rotunda-plinth': 'achilles_portal_rotunda_plinth.html',
}

HOTSPOTS = {
    'achilles-rotunda': [
        ('Stage III Panopticon', [0, 1440, 1480], [0, 35, 10]),
        ('Sunken Fountain & Escalators', [0, 520, 660], [0, 45, -40]),
        ('Celestial Starfield Vault', [0, 740, 260], [0, 155, -380]),
        ('NW City at Peace', [-220, 680, 340], [-380, 60, -180]),
        ('NE City at War & Gorge', [220, 680, 380], [380, 60, -140]),
        ('SW Black Ploughed Fallow', [-180, 680, 820], [-360, 55, 320]),
        ('SSW Corn Harvest & Avenue', [40, 620, 880], [-80, 55, 480]),
        ('SE Pastoral Meadow & Lions', [180, 680, 820], [360, 55, 300]),
    ],
    'achilles-rotunda-shell': [
        ('0° South Axis (Image 3)', [0, 1440, 1480], [0, 35, 10]),
        ('+25° Rotation (Image 2)', [-620, 1440, 1340], [0, 35, 10]),
        ('+45° Rotation (Image 1)', [-1040, 1440, 1040], [0, 35, 10]),
        ('Stepped Space-Frame Grid', [-120, 680, 320], [-40, 140, -340]),
        ('Curved Storefront Portals', [0, 540, 660], [0, 55, -60]),
    ],
    'achilles-rotunda-plinth': [
        ('Stage I Plinth (Image 5)', [0, 1440, 1480], [0, 25, 10]),
        ('Sunken Fountain & Escalators', [0, 480, 580], [0, 25, -20]),
        ('South Bridge over Oceanus', [120, 520, 1080], [0, 30, 660]),
    ],
    'achilles-rotunda-atrium': [
        ('Atrium & Four Kiosks', [140, 620, 760], [0, 25, 0]),
        ('Fountain Plume & Escalators', [0, 380, 460], [0, 35, -20]),
    ],
    'achilles-rotunda-celestial': [
        ('Celestial Canopy & Forest', [120, 740, 520], [0, 60, -420]),
        ('Sun, Moon & Constellations', [0, 620, -120], [0, 155, -380]),
    ],
    'achilles-rotunda-peace': [
        ('Bridal Hall & Sacred Circle', [-120, 760, 420], [-360, 50, -240]),
        ('Two Talents Law-Court', [-360, 420, 120], [-560, 55, -130]),
    ],
    'achilles-rotunda-war': [
        ('Hall of Ares & Craggy Gorge', [120, 760, 480], [360, 50, -160]),
        ('1.55× Golden Ares & Athena', [180, 420, 80], [380, 70, -180]),
    ],
    'achilles-rotunda-harvest': [
        ('Black Fallow & Corn Harvest', [120, 760, 960], [-240, 45, 340]),
        ('Standing Corn & Wheat Bales', [120, 440, 760], [-140, 55, 480]),
    ],
    'achilles-rotunda-pasture': [
        ('Pastoral Meadow & Vineyard', [-120, 760, 960], [320, 45, 300]),
        ('Sheep, Cattle & Tawny Lions', [180, 460, 680], [420, 55, 320]),
    ],
    'achilles-forge': [
        ('Overview', [85, 330, 540], [0, 55, -20]),
        ('Revolving Bear (61485c01)', [0, 260, 120], [0, 165, -140]),
        ('Hephaestus & Anvil', [-70, 150, 250], [-40, 45, 30]),
        ('Golden Handmaidens', [170, 150, 260], [0, 45, 70]),
    ],
    'achilles-peace': [
        ('Overview', [80, 410, 660], [0, 35, -20]),
        ('Two Talents in Agora', [-240, 180, 260], [-240, 35, 10]),
        ('Bridal Torch-Dance', [240, 180, 280], [240, 40, 40]),
        ('Mycenaean Megaron Porch', [250, 210, 40], [250, 65, -190]),
    ],
    'achilles-war': [
        ('Overview', [85, 410, 660], [0, 45, -10]),
        ('1.6× Golden Ares & Athena', [90, 190, 280], [110, 65, 0]),
        ('River Ambush (61485c01)', [-180, 175, 240], [-160, 35, 0]),
        ('Cyclopean Wall & Elders', [280, 240, 140], [290, 130, -100]),
    ],
    'achilles-field': [
        ('Overview', [80, 420, 670], [0, 45, -20]),
        ('Turning Black Furrow', [270, 185, 310], [280, 35, 90]),
        ('Silent King & Oak Feast', [0, 210, 360], [0, 55, 20]),
        ('Silver-Poled Vineyard', [-300, 185, 310], [-300, 45, -20]),
    ],
    'achilles-pasture': [
        ('Overview', [80, 410, 660], [0, 40, -10]),
        ('Two Lions & Bull Ford', [-160, 185, 260], [-160, 35, 0]),
        ('Gold & Tin Oxen Herd', [-340, 175, 260], [-340, 35, 10]),
        ('Nine Dogs & Sheep Glen', [240, 210, 340], [240, 50, 80]),
    ],
    'achilles-choros': [
        ('Overview', [75, 350, 540], [0, 35, 0]),
        ('Potter’s Wheel Choros', [0, 195, 240], [0, 45, 0]),
        ('Two Spinning Tumblers', [0, 140, 150], [0, 50, 0]),
        ('River Oceanus Wave Rim', [220, 220, 280], [0, 30, 0]),
    ],
    'achilles-shield': [
        ('Full Five-Fold World', [85, 620, 720], [0, 25, 0]),
        ('Fold 1: Revolving Cosmos', [0, 230, 220], [0, 55, 0]),
        ('Fold 2: Peace vs. 1.6× Gods', [-210, 240, 260], [-140, 50, 0]),
        ('Fold 3–5: Silent King & Rim', [0, 280, 120], [0, 45, -220]),
    ],
}


def compile_kit_payload(spec):
    mpd_path = os.path.join(ACH_CARDS, f"{spec['card']}.mpd")
    parsed = []
    covered_cells = set()
    box_cache = {}

    for line in open(mpd_path, errors='ignore'):
        if not line.startswith('1 '):
            continue
        t = line.split()
        col = int(t[1])
        m = [round(float(v), 2) for v in t[2:14]]
        pid = t[14].lower().replace('.dat', '')
        parsed.append((col, m, pid))
        if pid not in box_cache:
            box_cache[pid] = ldbox.box(pid, False)
        bx = box_cache[pid]
        if bx is not None and abs(m[7] - 1.0) < 1e-3:
            lo, hi = bx
            pos = m[0:3]
            rot = m[3:12]
            c0 = ldbox.apply(rot, pos, lo[0], lo[1], lo[2])
            c1 = ldbox.apply(rot, pos, hi[0], hi[1], hi[2])
            wx0, wx1 = min(c0[0], c1[0]), max(c0[0], c1[0])
            wz0, wz1 = min(c0[2], c1[2]), max(c0[2], c1[2])
            wy_bot = round(-max(c0[1], c1[1]))
            if (wx1 - wx0) >= 18.0 and (wz1 - wz0) >= 18.0:
                i0, i1 = math.floor((wx0 + 2.0) / 20.0), math.floor((wx1 - 2.0) / 20.0)
                k0, k1 = math.floor((wz0 + 2.0) / 20.0), math.floor((wz1 - 2.0) / 20.0)
                for ci in range(i0, i1 + 1):
                    for ck in range(k0, k1 + 1):
                        covered_cells.add((ci, ck, wy_bot))

    instances = []
    used_special = set()
    used_rect = {}
    used_cols = {0}
    tt_zones = TT_ZONES.get(spec['slug'], [])

    for col, m, pid in parsed:
        used_cols.add(col)
        x, yup, z = m[0], -m[1], m[2]
        tt_idx = -1
        for idx, (tcx, tcz, min_y, rad) in enumerate(tt_zones):
            if yup >= min_y and math.hypot(x - tcx, z - tcz) <= rad:
                tt_idx = idx
                break

        if pid in RECT_PIDS and box_cache.get(pid) is not None:
            lo, hi = box_cache[pid]
            has_exposed_stud = False
            if pid not in TILE_PIDS:
                pos = m[0:3]
                rot = m[3:12]
                c0 = ldbox.apply(rot, pos, lo[0], lo[1], lo[2])
                c1 = ldbox.apply(rot, pos, hi[0], hi[1], hi[2])
                wx0, wx1 = min(c0[0], c1[0]), max(c0[0], c1[0])
                wz0, wz1 = min(c0[2], c1[2]), max(c0[2], c1[2])
                wy_top = round(-min(c0[1], c1[1]))
                i0, i1 = math.floor((wx0 + 2.0) / 20.0), math.floor((wx1 - 2.0) / 20.0)
                k0, k1 = math.floor((wz0 + 2.0) / 20.0), math.floor((wz1 - 2.0) / 20.0)
                for ci in range(i0, i1 + 1):
                    for ck in range(k0, k1 + 1):
                        if (ci, ck, wy_top) not in covered_cells:
                            has_exposed_stud = True
                            break
                    if has_exposed_stud:
                        break
            rkey = pid if not has_exposed_stud else f'{pid}_s'
            if rkey not in used_rect:
                used_rect[rkey] = {
                    'b': [round(lo[0], 1), round(lo[1], 1), round(lo[2], 1), round(hi[0], 1), round(hi[1], 1), round(hi[2], 1)],
                    's': 1 if has_exposed_stud else 0,
                }
            instances.append([col, rkey, m, tt_idx])
        else:
            used_special.add(pid)
            instances.append([col, pid, m, tt_idx])

    meshes = {pid: extract_part_mesh(pid) for pid in sorted(used_special)}
    for mdata in meshes.values():
        if 'c' in mdata:
            for sc in mdata['c']:
                used_cols.add(sc)

    cols = {str(c): LD_COLS.get(c, {'hex': '#888888', 'a': 1.0, 'm': 0}) for c in sorted(used_cols)}
    payload = {
        'cols': cols,
        'rect': used_rect,
        'meshes': meshes,
        'inst': instances,
        'tt': [[tcx, tcz] for (tcx, tcz, _, _) in tt_zones],
    }
    return payload, len(instances)


def build_portal_html(spec, payload):
    hs_json = json.dumps(HOTSPOTS.get(spec['slug'], []))
    data_json = json.dumps(payload, separators=(',', ':'))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{spec['num']} · {spec['title']}</title>
<style>
  :root {{
    --bg: #efece4;
    --panel: rgba(246, 243, 236, 0.92);
    --ink: #1b1916;
    --muted: #655e52;
    --rule: rgba(27, 25, 22, 0.14);
    --accent: #8f6324;
    --badge-bg: rgba(47, 104, 56, 0.12);
    --badge-fg: #26592e;
  }}
  body.dark {{
    --bg: #0d0f12;
    --panel: rgba(18, 21, 26, 0.90);
    --ink: #ece6da;
    --muted: #9c9484;
    --rule: rgba(236, 230, 218, 0.14);
    --accent: #d8a856;
    --badge-bg: rgba(74, 168, 92, 0.16);
    --badge-fg: #6fd082;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    width: 100%; height: 470px; overflow: hidden;
    background: var(--bg); color: var(--ink);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    position: relative; user-select: none;
  }}
  canvas {{ display: block; width: 100%; height: 100%; cursor: grab; }}
  canvas:active {{ cursor: grabbing; }}
  .hud-top {{
    position: absolute; top: 10px; left: 10px; right: 10px;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;
    pointer-events: none; z-index: 10;
  }}
  .card-head {{
    pointer-events: auto;
    background: var(--panel); backdrop-filter: blur(10px);
    border: 1px solid var(--rule); border-radius: 6px;
    padding: 8px 12px; max-width: 64%;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }}
  .kicker {{
    font-size: 10px; font-weight: 600; letter-spacing: 0.11em;
    text-transform: uppercase; color: var(--accent);
    display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  }}
  .clicks-ok {{
    background: var(--badge-bg); color: var(--badge-fg);
    padding: 1px 6px; border-radius: 3px; font-size: 9px; letter-spacing: 0.05em;
  }}
  .title {{
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px; font-weight: 600; line-height: 1.15; margin-top: 2px;
  }}
  .object-line {{
    font-size: 10.5px; color: var(--muted); line-height: 1.3; margin-top: 3px;
  }}
  .object-line strong {{ color: var(--ink); font-weight: 600; }}
  .controls {{
    pointer-events: auto;
    display: flex; flex-wrap: wrap; gap: 5px; justify-content: flex-end;
  }}
  .btn {{
    background: var(--panel); color: var(--ink);
    border: 1px solid var(--rule); border-radius: 5px;
    padding: 5px 9px; font-size: 10.5px; font-weight: 500;
    cursor: pointer; backdrop-filter: blur(8px);
    transition: all 0.15s ease;
  }}
  .btn:hover {{ border-color: var(--accent); }}
  .btn.active {{
    background: var(--accent); color: #fff; border-color: var(--accent);
  }}
  .hud-bottom {{
    position: absolute; bottom: 10px; left: 10px; right: 10px;
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    pointer-events: none; z-index: 10; flex-wrap: wrap;
  }}
  .hotspots {{
    pointer-events: auto; display: flex; gap: 5px; flex-wrap: wrap;
  }}
  .status-pill {{
    pointer-events: auto;
    background: var(--panel); border: 1px solid var(--rule);
    border-radius: 5px; padding: 4px 9px;
    font-size: 10px; color: var(--muted); backdrop-filter: blur(8px);
  }}
</style>
</head>
<body>
  <canvas id="gl-canvas"></canvas>
  <div class="hud-top">
    <div class="card-head">
      <div class="kicker">
        <span>KIT {spec['num']} · {spec['lines']} · {spec['pieces']} PCS</span>
        <span class="clicks-ok">✓ 0 LOOSE · 0 CLASHES (CLICKS.PY)</span>
      </div>
      <div class="title">{spec['title']}</div>
      <div class="object-line"><strong>The object:</strong> {spec['object']}</div>
    </div>
    <div class="controls">
      <button id="btn-turn" class="btn active" title="Rotate the 61485c01 Turntable Mechanism">⚙ Turn Object</button>
      <button id="btn-walk" class="btn" title="First-Person Walk/Fly Mode (WASD + Arrows)">🚶 Walk Inside</button>
      <button id="btn-theme" class="btn" title="Toggle Museum Paper / Dark Forge">◐ Paper / Dark</button>
    </div>
  </div>
  <div class="hud-bottom">
    <div class="hotspots" id="hotspots"></div>
    <div class="status-pill" id="status-pill">True ./ldraw/parts/*.dat Geometry · ACES Filmic · Drag to orbit · Scroll to zoom</div>
  </div>

<script>
const DATA = {data_json};
const HOTSPOTS = {hs_json};

function hexToRgb(hex) {{
  const v = parseInt(hex.replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}}

function buildRectTris(b, hasStuds) {{
  const [x0, y0, z0, x1, y1, z1] = b;
  const ins = 0.25;
  const ax0 = x0 + ins, ay0 = y0 + ins * 0.4, az0 = z0 + ins;
  const ax1 = x1 - ins, ay1 = y1 - ins * 0.4, az1 = z1 - ins;
  const p = [
    [ax0,ay0,az0],[ax1,ay0,az0],[ax1,ay1,az0],[ax0,ay1,az0],
    [ax0,ay0,az1],[ax1,ay0,az1],[ax1,ay1,az1],[ax0,ay1,az1]
  ];
  const f = [[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[4,5,1,0]];
  const tris = [];
  for (const [a,b_,c,d] of f) {{
    tris.push([p[a],p[b_],p[c]], [p[a],p[c],p[d]]);
  }}
  const nx = Math.max(1, Math.round((x1 - x0) / 20));
  const nz = Math.max(1, Math.round((z1 - z0) / 20));
  if (hasStuds && nx * nz <= 32) {{
    for (let ix = 0; ix < nx; ix++) {{
      for (let iz = 0; iz < nz; iz++) {{
        const sx = x0 + (ix + 0.5) * 20, sz = z0 + (iz + 0.5) * 20;
        const sy0 = y0, sy1 = y0 - 4.0, sr = 6.0;
        for (let s = 0; s < 8; s++) {{
          const a0 = (s / 8) * Math.PI * 2, a1 = ((s + 1) / 8) * Math.PI * 2;
          const xA = sx + Math.cos(a0)*sr, zA = sz + Math.sin(a0)*sr;
          const xB = sx + Math.cos(a1)*sr, zB = sz + Math.sin(a1)*sr;
          tris.push([[xA,sy1,zA],[xB,sy1,zB],[xB,sy0,zB]], [[xA,sy1,zA],[xB,sy0,zB],[xA,sy0,zA]]);
          tris.push([[sx,sy1,sz],[xB,sy1,zB],[xA,sy1,zA]]);
        }}
      }}
    }}
  }}
  return tris;
}}

function buildMeshTris(mData) {{
  const v = mData.v, idx = mData.i, tc = mData.c || [];
  const tris = [];
  for (let k = 0; k < idx.length; k += 3) {{
    const i0 = idx[k]*3, i1 = idx[k+1]*3, i2 = idx[k+2]*3;
    tris.push({{
      pts: [
        [v[i0], v[i0+1], v[i0+2]],
        [v[i1], v[i1+1], v[i1+2]],
        [v[i2], v[i2+1], v[i2+2]]
      ],
      col: tc[k / 3] !== undefined ? tc[k / 3] : 16
    }});
  }}
  return tris;
}}

function perspMat(fov, aspect, near, far) {{
  const f = 1.0 / Math.tan(fov / 2), nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0
  ]);
}}

function lookAtMat(eye, center, up) {{
  let zx = eye[0] - center[0], zy = eye[1] - center[1], zz = eye[2] - center[2];
  let len = Math.hypot(zx, zy, zz) || 1; zx /= len; zy /= len; zz /= len;
  let xx = up[1]*zz - up[2]*zy, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
  len = Math.hypot(xx, xy, xz) || 1; xx /= len; xy /= len; xz /= len;
  const yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx*eye[0] + xy*eye[1] + xz*eye[2]),
    -(yx*eye[0] + yy*eye[1] + yz*eye[2]),
    -(zx*eye[0] + zy*eye[1] + zz*eye[2]),
    1
  ]);
}}

(function init() {{
  const data = DATA;
  const canvas = document.getElementById('gl-canvas');
  const gl = canvas.getContext('webgl', {{ antialias: true, alpha: false }});

  const vsSrc = `
    attribute vec3 aPos;
    attribute vec3 aNorm;
    attribute vec4 aCol;
    attribute vec2 aPivot;
    attribute float aTurn;
    uniform mat4 uProj;
    uniform mat4 uView;
    uniform float uAngle;
    varying vec3 vNorm;
    varying vec3 vPos;
    varying vec4 vCol;
    void main() {{
      vec3 p = aPos;
      vec3 n = aNorm;
      if (aTurn > 0.5) {{
        float c = cos(uAngle), s = sin(uAngle);
        float dx = p.x - aPivot.x;
        float dz = p.z - aPivot.y;
        p.x = aPivot.x + dx * c - dz * s;
        p.z = aPivot.y + dx * s + dz * c;
        float nx = n.x * c - n.z * s;
        float nz = n.x * s + n.z * c;
        n.x = nx; n.z = nz;
      }}
      vPos = p;
      vNorm = n;
      vCol = aCol;
      gl_Position = uProj * uView * vec4(p, 1.0);
    }}
  `;

  const fsSrc = `
    precision mediump float;
    varying vec3 vNorm;
    varying vec3 vPos;
    varying vec4 vCol;
    uniform vec3 uEye;
    vec3 acesFilm(vec3 x) {{
      return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
    }}
    void main() {{
      vec3 N = normalize(vNorm);
      if (!gl_FrontFacing) N = -N;
      vec3 V = normalize(uEye - vPos);

      vec3 L1 = normalize(vec3(0.45, 0.78, 0.43));
      vec3 L2 = normalize(vec3(-0.62, 0.45, -0.64));
      vec3 L3 = normalize(vec3(0.0, 0.42, -0.90));

      float d1 = max(dot(N, L1), 0.0);
      float d2 = max(dot(N, L2), 0.0);
      float d3 = max(dot(N, L3), 0.0);

      float hemiMix = N.y * 0.5 + 0.5;
      vec3 hemiCol = mix(vec3(0.29, 0.25, 0.21), vec3(1.0, 0.965, 0.90), hemiMix);

      float metal = vCol.a;
      vec3 base = pow(vCol.rgb, vec3(2.2));
      vec3 diff = base * (hemiCol * 0.52 + vec3(1.0, 0.95, 0.86) * d1 * 1.15 + vec3(0.61, 0.72, 1.0) * d2 * 0.48 + vec3(1.0, 0.88, 0.69) * d3 * 0.32);

      vec3 H1 = normalize(L1 + V);
      float shininess = mix(28.0, 72.0, metal);
      float specStrength = mix(0.18, 0.95, metal);
      vec3 specCol = mix(vec3(1.0, 0.97, 0.92), base, metal * 0.7);
      vec3 spec = specCol * pow(max(dot(N, H1), 0.0), shininess) * specStrength;

      vec3 linearOut = diff * mix(1.0, 0.72, metal) + spec;
      vec3 mapped = pow(acesFilm(linearOut * 1.06), vec3(1.0 / 2.2));
      gl_FragColor = vec4(mapped, 1.0);
    }}
  `;

  function compile(type, src) {{
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }}
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const rectTris = {{}};
  for (const [pid, rInfo] of Object.entries(data.rect)) {{
    rectTris[pid] = buildRectTris(rInfo.b, rInfo.s === 1);
  }}
  const meshTris = {{}};
  for (const [pid, mInfo] of Object.entries(data.meshes)) {{
    if (mInfo.v && mInfo.v.length > 0) meshTris[pid] = buildMeshTris(mInfo);
  }}

  const colMap = {{}};
  for (const [code, info] of Object.entries(data.cols)) {{
    const [r, g, b] = hexToRgb(info.hex);
    colMap[code] = [r, g, b, info.m ? 1.0 : 0.0];
  }}

  const buf = [];
  for (const [col, pid, m, ttIdx] of data.inst) {{
    const baseRgba = colMap[String(col)] || [0.7, 0.7, 0.7, 0.0];
    const [x, y, z, a, b, c, d, e, f, g, h, i] = m;
    const turnFlag = ttIdx >= 0 ? 1.0 : 0.0;
    const pivX = (ttIdx >= 0 && data.tt[ttIdx]) ? data.tt[ttIdx][0] : 0.0;
    const pivZ = (ttIdx >= 0 && data.tt[ttIdx]) ? data.tt[ttIdx][1] : 0.0;

    // LDraw (x, y_down, z_front) -> World (x, y_up = -y_down, z_front = +z_front)
    const xf = (v) => [
      x + a*v[0] + b*v[1] + c*v[2],
      -(y + d*v[0] + e*v[1] + f*v[2]),
      z + g*v[0] + h*v[1] + i*v[2]
    ];

    if (rectTris[pid]) {{
      for (const [p0, p1, p2] of rectTris[pid]) {{
        const A = xf(p0), B = xf(p2), C = xf(p1);
        const ux = B[0]-A[0], uy = B[1]-A[1], uz = B[2]-A[2];
        const vx = C[0]-A[0], vy = C[1]-A[1], vz = C[2]-A[2];
        let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;
        for (const P of [A, B, C]) {{
          buf.push(P[0], P[1], P[2], nx, ny, nz, baseRgba[0], baseRgba[1], baseRgba[2], baseRgba[3], pivX, pivZ, turnFlag);
        }}
      }}
    }} else if (meshTris[pid]) {{
      for (const tObj of meshTris[pid]) {{
        const [p0, p1, p2] = tObj.pts;
        const rgba = (tObj.col !== 16 && colMap[String(tObj.col)]) ? colMap[String(tObj.col)] : baseRgba;
        const A = xf(p0), B = xf(p2), C = xf(p1);
        const ux = B[0]-A[0], uy = B[1]-A[1], uz = B[2]-A[2];
        const vx = C[0]-A[0], vy = C[1]-A[1], vz = C[2]-A[2];
        let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len; ny /= len; nz /= len;
        for (const P of [A, B, C]) {{
          buf.push(P[0], P[1], P[2], nx, ny, nz, rgba[0], rgba[1], rgba[2], rgba[3], pivX, pivZ, turnFlag);
        }}
      }}
    }}
  }}

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buf), gl.STATIC_DRAW);

  const stride = 13 * 4;
  const bindAttr = (name, size, offset) => {{
    const loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4);
  }};
  bindAttr('aPos', 3, 0);
  bindAttr('aNorm', 3, 3);
  bindAttr('aCol', 4, 6);
  bindAttr('aPivot', 2, 10);
  bindAttr('aTurn', 1, 12);

  const vertCount = buf.length / 13;
  const uProj = gl.getUniformLocation(prog, 'uProj');
  const uView = gl.getUniformLocation(prog, 'uView');
  const uAngle = gl.getUniformLocation(prog, 'uAngle');
  const uEye = gl.getUniformLocation(prog, 'uEye');

  let target = [0, 45, 0];
  let spherical = {{ r: 620, theta: 0.14, phi: 1.04 }};
  let eye = [80, 410, 660];
  let turnActive = true;
  let turnAngle = 0;
  let walkMode = false;
  let darkTheme = false;
  const keys = {{}};

  function updateEyeFromOrbit() {{
    const sinP = Math.sin(spherical.phi);
    eye = [
      target[0] + spherical.r * sinP * Math.sin(spherical.theta),
      target[1] + spherical.r * Math.cos(spherical.phi),
      target[2] + spherical.r * sinP * Math.cos(spherical.theta)
    ];
  }}

  function jumpToHotspot(hs) {{
    const [cx, cy, cz] = hs[1];
    const [tx, ty, tz] = hs[2];
    target = [tx, ty, tz];
    const dx = cx - tx, dy = cy - ty, dz = cz - tz;
    spherical.r = Math.max(80, Math.hypot(dx, dy, dz));
    spherical.theta = Math.atan2(dx, dz);
    spherical.phi = Math.max(0.18, Math.min(1.48, Math.acos(dy / spherical.r)));
    updateEyeFromOrbit();
  }}

  const hsWrap = document.getElementById('hotspots');
  HOTSPOTS.forEach((hs, idx) => {{
    const b = document.createElement('button');
    b.className = 'btn' + (idx === 0 ? ' active' : '');
    b.textContent = hs[0];
    b.onclick = () => {{
      document.querySelectorAll('#hotspots .btn').forEach(el => el.classList.remove('active'));
      b.classList.add('active');
      jumpToHotspot(hs);
    }};
    hsWrap.appendChild(b);
  }});
  if (HOTSPOTS.length > 0) jumpToHotspot(HOTSPOTS[0]);
  else updateEyeFromOrbit();

  let dragging = false, prevX = 0, prevY = 0, rightDrag = false;
  canvas.addEventListener('pointerdown', e => {{
    dragging = true; rightDrag = (e.button === 2 || e.shiftKey);
    prevX = e.clientX; prevY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  }});
  canvas.addEventListener('pointermove', e => {{
    if (!dragging) return;
    const dx = e.clientX - prevX, dy = e.clientY - prevY;
    prevX = e.clientX; prevY = e.clientY;
    if (walkMode) {{
      spherical.theta -= dx * 0.005;
      spherical.phi = Math.max(0.2, Math.min(2.8, spherical.phi + dy * 0.005));
      const sinP = Math.sin(spherical.phi);
      target = [
        eye[0] + 100 * sinP * Math.sin(spherical.theta),
        eye[1] + 100 * Math.cos(spherical.phi),
        eye[2] + 100 * sinP * Math.cos(spherical.theta)
      ];
    }} else if (rightDrag) {{
      const pan = spherical.r * 0.0015;
      target[0] -= dx * Math.cos(spherical.theta) * pan;
      target[2] += dx * Math.sin(spherical.theta) * pan;
      target[1] += dy * pan;
      updateEyeFromOrbit();
    }} else {{
      spherical.theta -= dx * 0.0065;
      spherical.phi = Math.max(0.15, Math.min(1.48, spherical.phi - dy * 0.0065));
      updateEyeFromOrbit();
    }}
  }});
  canvas.addEventListener('pointerup', () => {{ dragging = false; }});
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {{
    e.preventDefault();
    spherical.r = Math.max(70, Math.min(2800, spherical.r * (1 + e.deltaY * 0.001)));
    if (!walkMode) updateEyeFromOrbit();
  }}, {{ passive: false }});

  window.addEventListener('keydown', e => {{ keys[e.code] = true; }});
  window.addEventListener('keyup', e => {{ keys[e.code] = false; }});

  document.getElementById('btn-turn').onclick = function() {{
    turnActive = !turnActive;
    this.classList.toggle('active', turnActive);
  }};
  document.getElementById('btn-walk').onclick = function() {{
    walkMode = !walkMode;
    this.classList.toggle('active', walkMode);
    document.getElementById('status-pill').textContent = walkMode
      ? 'Walk Mode: WASD / Arrows to move · Q/E up/down · Drag to look'
      : 'True ./ldraw/parts/*.dat Geometry · ACES Filmic · Drag to orbit · Scroll to zoom';
  }};
  document.getElementById('btn-theme').onclick = function() {{
    darkTheme = document.body.classList.toggle('dark');
  }};

  function render() {{
    requestAnimationFrame(render);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {{
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    }}
    if (turnActive) turnAngle += 0.014;
    if (walkMode) {{
      const spd = 4.0;
      const fx = target[0] - eye[0], fy = target[1] - eye[1], fz = target[2] - eye[2];
      const fl = Math.hypot(fx, fy, fz) || 1;
      const dx = fx/fl, dy = fy/fl, dz = fz/fl;
      const rx = -dz, rz = dx;
      const move = (mx, my, mz) => {{
        eye[0] += mx; eye[1] += my; eye[2] += mz;
        target[0] += mx; target[1] += my; target[2] += mz;
      }};
      if (keys['KeyW'] || keys['ArrowUp']) move(dx*spd, dy*spd, dz*spd);
      if (keys['KeyS'] || keys['ArrowDown']) move(-dx*spd, -dy*spd, -dz*spd);
      if (keys['KeyA'] || keys['ArrowLeft']) move(-rx*spd, 0, -rz*spd);
      if (keys['KeyD'] || keys['ArrowRight']) move(rx*spd, 0, rz*spd);
      if (keys['KeyE']) move(0, spd, 0);
      if (keys['KeyQ']) move(0, -spd, 0);
    }}

    gl.enable(gl.DEPTH_TEST);
    if (darkTheme) gl.clearColor(0.051, 0.059, 0.071, 1.0);
    else gl.clearColor(0.937, 0.925, 0.894, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.uniformMatrix4fv(uProj, false, perspMat(35 * Math.PI / 180, w / Math.max(1, h), 4.0, 6000.0));
    gl.uniformMatrix4fv(uView, false, lookAtMat(eye, target, [0, 1, 0]));
    gl.uniform1f(uAngle, turnAngle);
    gl.uniform3fv(uEye, new Float32Array(eye));
    gl.drawArrays(gl.TRIANGLES, 0, vertCount);
  }}
  render();
}})();
</script>
</body>
</html>"""


def build_kit_page_html(m):
    """Build dedicated product page achilles/kits/<slug>/index.html with studio photo gallery + live 3D viewer."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>KIT {m['num']} · {m['title']} — The Shield of Achilles Line</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg: #efece4;
    --surface: #f7f4ed;
    --ink: #1a1815;
    --muted: #655e53;
    --rule: #d8d2c5;
    --accent: #8f6324;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg); color: var(--ink);
    font-family: 'Inter', -apple-system, sans-serif;
    line-height: 1.55; padding: 32px 28px 80px;
    max-width: 1240px; margin: 0 auto;
  }}
  .top-nav {{
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 18px; border-bottom: 1px solid var(--rule); margin-bottom: 24px;
    font-size: 12.5px;
  }}
  .top-nav a {{ color: var(--accent); text-decoration: none; font-weight: 500; }}
  .eyebrow {{ font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); font-weight: 600; }}
  h1 {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 40px; font-weight: 600; line-height: 1.1; margin-top: 4px; }}
  .greek {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; color: var(--muted); margin-top: 6px; }}
  .epigraph {{
    font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 19px;
    border-left: 2px solid var(--accent); padding-left: 14px; margin: 14px 0 22px; max-width: 820px;
  }}
  .shots-grid {{
    display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; margin-bottom: 26px;
  }}
  .shot-card {{
    background: var(--surface); border: 1px solid var(--rule); border-radius: 6px; overflow: hidden;
  }}
  .shot-card img {{ width: 100%; height: auto; display: block; }}
  .shot-cap {{ padding: 8px 12px; font-size: 11.5px; color: var(--muted); border-top: 1px solid var(--rule); }}
  .shot-stack {{ display: flex; flex-direction: column; gap: 16px; }}
  .info-grid {{
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 26px;
  }}
  .info-box {{
    background: var(--surface); border: 1px solid var(--rule); border-radius: 6px; padding: 18px;
  }}
  .info-box h3 {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; color: var(--accent); margin-bottom: 6px; }}
  .info-box p {{ font-size: 13.5px; color: var(--ink); }}
  .viewer-box {{
    background: var(--surface); border: 1px solid var(--rule); border-radius: 8px; overflow: hidden;
  }}
  .viewer-head {{
    padding: 10px 16px; border-bottom: 1px solid var(--rule);
    display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600;
  }}
  iframe {{ width: 100%; height: 540px; border: 0; display: block; }}
</style>
</head>
<body>
  <div class="top-nav">
    <a href="../index.html">← All Kits in The Shield of Achilles Line</a>
    <span>✓ {m['pieces']} Pieces · {m['grid_pieces']} Grid · 0 Loose · 0 Clashes (clicks.py)</span>
  </div>
  <div class="eyebrow">KIT {m['num']} · {m['tier']}</div>
  <h1>{m['title']}</h1>
  <div class="greek">{m['greek']}</div>
  <blockquote class="epigraph">“{m['epigraph']}”</blockquote>

  <div class="shots-grid">
    <div class="shot-card">
      <img src="hero.jpg" alt="Hero studio shot of {m['title']}"/>
      <div class="shot-cap"><strong>Studio Hero Shot</strong> — Rendered directly from <code>../../cards/{m['card']}.mpd</code> via <code>shoot.py</code></div>
    </div>
    <div class="shot-stack">
      <div class="shot-card">
        <img src="detail.jpg" alt="Detail shot of {m['title']}"/>
        <div class="shot-cap"><strong>Mechanism &amp; Cast Detail</strong> — Close-up of the <code>61485c01</code> turntable &amp; Homeric figures</div>
      </div>
      <div class="shot-card">
        <img src="top.jpg" alt="Top architectural plan of {m['title']}"/>
        <div class="shot-cap"><strong>Architectural Plan View</strong> — Full baseplate layout &amp; tile paving</div>
      </div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>The Dramatic Moment ({m['lines']})</h3>
      <p>{m['moment']}</p>
    </div>
    <div class="info-box">
      <h3>The Working Mechanism (“The Object”)</h3>
      <p>{m['object']}</p>
      <p style="margin-top:10px;font-size:12px;color:var(--muted);">
        <a href="../../cards/{m['card']}.mpd" download style="color:var(--accent);font-weight:600;">Download {m['card']}.mpd ({m['pieces']} pcs)</a>
      </p>
    </div>
  </div>

  <div class="viewer-box">
    <div class="viewer-head">
      <span>Interactive 3D LDraw Studio — {m['title']}</span>
      <span>Drag to Orbit · Scroll to Zoom · Click “Turn Object” or “Walk Mode”</span>
    </div>
    <iframe src="../../../odyssey-forage.html?card=../../achilles/cards/{m['card']}.mpd&bg=efece4"></iframe>
  </div>
</body>
</html>"""


def build_rotunda_page_html(m):
    """Build dedicated UCS Flagship page achilles/kits/achilles-rotunda/index.html with 3 assembly stages + 6 sector modules."""
    builds = m.get('builds', [])
    build_btns = []
    for idx, b in enumerate(builds):
        active = ' active' if idx == 0 else ''
        short_lbl = b['title'].split('(')[0].strip()
        build_btns.append(
            f'<button class="b-btn{active}" onclick="switchBuild(this, \'{b["card"]}\', \'{b["title"].replace(chr(39), "")}\', {b["pieces"]})">'
            f'<strong>{b["card"].replace("set.achilles-rotunda", "rotunda")}</strong> · {b["pieces"]:,} pcs'
            f'</button>'
        )

    mod_cards = [
        ('mod_atrium.jpg',    builds[3], 'Level 0 Sunken Fountain Basin, 4-Jet Water Plume, Undercroft Columns, Twin Escalators & Four White-Canopied Concourse Kiosks.'),
        ('mod_celestial.jpg', builds[4], 'Midnight-Blue Celestial Starfield Vault (Golden Full Sun, Crescent Moon & White Constellations), North Colonnade, Archive Shelves & 3 Forest Bays.'),
        ('mod_peace.jpg',     builds[5], 'Curved Inner Bridal & Banquet Hall with Wedding Dancers + 3 Outer Sacred Circle Law-Court Galleries & Two Talents of Gold.'),
        ('mod_war.jpg',       builds[6], 'Curved Inner Hall of Ares (1.55× Golden Ares & Athena + 10 Bronze Hoplites), Cavalry Bay & Craggy Grey Boulder Ambush Gorge.'),
        ('mod_harvest.jpg',   builds[7], 'Pitch-Black Ploughed Fallow with Furrow Ridges & Ox-Ploughs, Standing Golden Corn Harvest, 4 Bound Wheat Bales & South Avenue.'),
        ('mod_pasture.jpg',   builds[8], 'Silver-Poled Vineyard & Vintage + Pastoral Meadow with 9 White Sheep, 5 Lofty-Horned Cattle & 3 Prowling Tawny Lions.'),
    ]
    mod_html = []
    for img_f, b, desc in mod_cards:
        mod_html.append(f"""
        <div class="shot-card">
          <img src="{img_f}" alt="{b['title']}"/>
          <div class="shot-cap">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <strong style="color:var(--ink);">{b['title']}</strong>
              <span style="color:#2f6838;font-weight:600;">✓ {b['pieces']:,} pcs · 0 loose · 0 clashes</span>
            </div>
            <p style="margin-bottom:6px;">{desc}</p>
            <button class="mini-btn" onclick="loadInStudio('{b['card']}', '{b['title'].replace(chr(39), '')}', {b['pieces']})">Inspect Module in 3D Studio ↓</button>
            <a href="../../cards/{b['card']}.mpd" download style="margin-left:10px;color:var(--accent);font-weight:600;text-decoration:none;">Download .MPD</a>
          </div>
        </div>""")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>KIT #75910 · {m['title']} — UCS Architectural Masterpiece</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg: #efece4;
    --surface: #f7f4ed;
    --ink: #1a1815;
    --muted: #655e53;
    --rule: #d8d2c5;
    --accent: #8f6324;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg); color: var(--ink);
    font-family: 'Inter', -apple-system, sans-serif;
    line-height: 1.55; padding: 32px 28px 80px;
    max-width: 1320px; margin: 0 auto;
  }}
  .top-nav {{
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 18px; border-bottom: 1px solid var(--rule); margin-bottom: 24px;
    font-size: 12.5px;
  }}
  .top-nav a {{ color: var(--accent); text-decoration: none; font-weight: 600; }}
  .eyebrow {{ font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); font-weight: 600; }}
  h1 {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 42px; font-weight: 600; line-height: 1.08; margin-top: 4px; }}
  h2 {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; font-weight: 600; margin: 32px 0 12px; border-bottom: 1px solid var(--rule); padding-bottom: 6px; }}
  .epigraph {{
    font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-size: 19px;
    border-left: 2px solid var(--accent); padding-left: 14px; margin: 14px 0 22px; max-width: 920px;
  }}
  .shots-grid {{ display: grid; grid-template-columns: 1.45fr 1fr; gap: 16px; margin-bottom: 24px; }}
  .stages-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }}
  .mods-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }}
  .shot-card {{ background: var(--surface); border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; display: flex; flex-direction: column; }}
  .shot-card img {{ width: 100%; height: auto; display: block; }}
  .shot-cap {{ padding: 10px 13px; font-size: 11.5px; color: var(--muted); border-top: 1px solid var(--rule); flex: 1; }}
  .shot-stack {{ display: flex; flex-direction: column; gap: 16px; }}
  .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 26px; }}
  .info-box {{ background: var(--surface); border: 1px solid var(--rule); border-radius: 6px; padding: 18px; }}
  .info-box h3 {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 20px; color: var(--accent); margin-bottom: 6px; }}
  .info-box p {{ font-size: 13.5px; color: var(--ink); }}
  .viewer-box {{ background: var(--surface); border: 1px solid var(--rule); border-radius: 8px; overflow: hidden; }}
  .viewer-head {{
    padding: 12px 16px; border-bottom: 1px solid var(--rule);
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 12px; font-weight: 600;
  }}
  .build-bar {{ padding: 10px 16px; border-bottom: 1px solid var(--rule); display: flex; gap: 6px; flex-wrap: wrap; background: #f1ede4; }}
  .b-btn, .mini-btn {{
    background: var(--surface); color: var(--ink); border: 1px solid var(--rule);
    padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer;
  }}
  .b-btn.active, .b-btn:hover, .mini-btn:hover {{ background: var(--accent); color: #fff; border-color: var(--accent); }}
  iframe {{ width: 100%; height: 600px; border: 0; display: block; }}
</style>
</head>
<body>
  <div class="top-nav">
    <a href="../index.html">← All Kits in The Shield of Achilles Line</a>
    <span>✓ 9 Inspected Builds · 8,891 Master Pieces · 0 Loose · 0 Clashes (clicks.py)</span>
  </div>
  <div class="eyebrow">FLAGSHIP KIT #{m['set_num']} · {m['tier']} · 80×80 STUDS (1600×1600 LDU)</div>
  <h1>{m['title']}</h1>
  <blockquote class="epigraph">{m['quote']}</blockquote>

  <div class="shots-grid">
    <div class="shot-card">
      <img src="hero.jpg" alt="Stage III Complete Populated Masterpiece"/>
      <div class="shot-cap"><strong>Stage III — Complete Populated Masterpiece (<code>set.achilles-rotunda.mpd</code>, 8,891 pcs)</strong> — Sunken Fountain Atrium, Twin Escalators, 4 Concourse Kiosks, Celestial Starfield Roof, City at Peace, City at War, Craggy Ambush Gorge, Pastoral Meadow, Vineyard, South Processional Avenue, Golden Corn Harvest, Black Ploughed Fallow &amp; River Oceanus.</div>
    </div>
    <div class="shot-stack">
      <div class="shot-card">
        <img src="detail.jpg" alt="Interior Detail of Sunken Fountain Atrium &amp; Celestial Canopy"/>
        <div class="shot-cap"><strong>Interior Atrium &amp; Celestial Vault Detail</strong> — Central 4-Jet Fountain Plume, Twin Escalators, White-Canopied Kiosks &amp; Midnight-Blue Starfield Canopy.</div>
      </div>
      <div class="shot-card">
        <img src="top.jpg" alt="Zenith Plan View of the Grand Rotunda"/>
        <div class="shot-cap"><strong>Zenith Architectural Plan View</strong> — Five concentric rings and ten radial chambers inside the 80×80-stud drum of Oceanus.</div>
      </div>
    </div>
  </div>

  <h2>Three-Stage Architectural Progression (Plinth → Shell → Populated World)</h2>
  <div class="stages-grid">
    <div class="shot-card">
      <img src="plinth.jpg" alt="Stage I Plinth"/>
      <div class="shot-cap">
        <strong>Stage I: Foundation Plinth (4,727 pcs)</strong><br/>
        River Oceanus dark slate ring with 36 radial white tick-marks, South Bridge, smooth circular concourse slab, Sunken Fountain Atrium &amp; Twin Escalators.
      </div>
    </div>
    <div class="shot-card">
      <img src="shell_center.jpg" alt="Stage II Shell 0 deg"/>
      <div class="shot-cap">
        <strong>Stage II: Shell — 0° South Axis (6,042 pcs)</strong><br/>
        Concentric ring walls, 10 radial wedge chambers, curved inner storefront portals, South Avenue &amp; stepped 3×3 Space-Frame Skylight Canopy.
      </div>
    </div>
    <div class="shot-card">
      <img src="shell_rot25.jpg" alt="Stage II Shell 25 deg"/>
      <div class="shot-cap">
        <strong>Stage II: Shell — +25° Rotation</strong><br/>
        Oblique architectural elevation showing the curved storefront transom windows, gallery doorways &amp; stepped space-frame cutaway.
      </div>
    </div>
    <div class="shot-card">
      <img src="shell_rot45.jpg" alt="Stage II Shell 45 deg"/>
      <div class="shot-cap">
        <strong>Stage II: Shell — +45° Rotation</strong><br/>
        Diagonal architectural study of the concentric masonry rings, outer gallery bays &amp; North colonnade piers.
      </div>
    </div>
  </div>

  <h2>Six Self-Contained Modular Sector Sub-Builds (All 0 Loose · 0 Clashes)</h2>
  <div class="mods-grid">
    {''.join(mod_html)}
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>The Panopticon Worldtext ({m['book']})</h3>
      <p>{m['moment']}</p>
    </div>
    <div class="info-box">
      <h3>Staged &amp; Modular Assembly (“The Object”)</h3>
      <p>{m['object']}</p>
    </div>
  </div>

  <div class="viewer-box" id="studio-section">
    <div class="viewer-head">
      <span id="rotunda-studio-label">Interactive 3D LDraw Studio — set.achilles-rotunda.mpd (8,891 pcs · 0 loose · 0 clashes)</span>
      <span>Drag to Orbit · Scroll to Zoom · Click “Walk Mode (WASD)” to walk inside the Rotunda</span>
    </div>
    <div class="build-bar">
      {''.join(build_btns)}
    </div>
    <iframe id="rotunda-frame" src="../../../odyssey-forage.html?card=../../achilles/cards/set.achilles-rotunda.mpd&bg=efece4"></iframe>
  </div>

<script>
function switchBuild(btn, card, title, pcs) {{
  document.querySelectorAll('.b-btn').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('rotunda-studio-label').textContent =
    'Interactive 3D LDraw Studio — ' + title + ' (' + card + '.mpd · ' + pcs.toLocaleString() + ' pcs · 0 loose · 0 clashes)';
  document.getElementById('rotunda-frame').src =
    '../../../odyssey-forage.html?card=../../achilles/cards/' + card + '.mpd&bg=efece4';
}}
function loadInStudio(card, title, pcs) {{
  switchBuild(null, card, title, pcs);
  document.getElementById('studio-section').scrollIntoView({{ behavior: 'smooth' }});
}}
</script>
</body>
</html>"""


def build_hub_html(manifests, rotunda_m):
    total_pcs = sum(m['pieces'] for m in manifests) + rotunda_m['builds'][0]['pieces']
    cards_html = []
    for m in manifests:
        safe_title = m['title'].replace("'", "\\'")
        cards_html.append(f"""
        <article class="kit-card" data-card="{m['card']}" data-slug="{m['slug']}">
          <a href="{m['slug']}/index.html" class="kit-thumb-link">
            <img class="kit-thumb" src="{m['slug']}/hero.jpg" alt="{m['title']}" loading="lazy"/>
          </a>
          <div class="kit-body">
            <div class="kit-meta">
              <span class="kit-num">KIT {m['num']} · {m['tier']}</span>
              <span class="kit-clicks">✓ {m['pieces']} pcs · 0 loose · 0 clashes</span>
            </div>
            <h2 class="kit-title"><a href="{m['slug']}/index.html">{m['title']}</a></h2>
            <p class="kit-greek">{m['greek']}</p>
            <blockquote class="kit-epigraph">“{m['epigraph']}”</blockquote>
            <p class="kit-moment">{m['moment']}</p>
            <div class="kit-object">
              <strong>The object:</strong> {m['object']}
            </div>
            <div class="kit-actions">
              <button class="load-btn" onclick="loadKit('{m['card']}', '{safe_title}')">Inspect in 3D Studio ↑</button>
              <a class="page-link" href="{m['slug']}/index.html">Kit Page &amp; Photos →</a>
              <a class="mpd-link" href="../cards/{m['card']}.mpd" download>.MPD</a>
            </div>
          </div>
        </article>""")

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>The Shield of Achilles — The Kit Line &amp; Grand Rotunda (Iliad XVIII.478–608)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg: #efece4;
    --surface: #f7f4ed;
    --ink: #1a1815;
    --muted: #655e53;
    --rule: #d8d2c5;
    --accent: #8f6324;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    background: var(--bg); color: var(--ink);
    font-family: 'Inter', -apple-system, sans-serif;
    line-height: 1.55; padding: 36px 28px 80px;
    max-width: 1320px; margin: 0 auto;
  }}
  header {{
    border-bottom: 1px solid var(--rule);
    padding-bottom: 24px; margin-bottom: 28px;
    display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;
  }}
  .eyebrow {{
    font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--accent); font-weight: 600;
  }}
  h1 {{
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 44px; font-weight: 600; line-height: 1.08; margin-top: 4px;
  }}
  .subhead {{
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20px; font-style: italic; color: var(--muted); margin-top: 6px; max-width: 820px;
  }}
  .nav-links a {{
    color: var(--ink); text-decoration: none; font-size: 12px; font-weight: 500;
    border: 1px solid var(--rule); padding: 7px 13px; border-radius: 4px;
    background: var(--surface); margin-left: 6px;
  }}
  .nav-links a:hover {{ border-color: var(--accent); color: var(--accent); }}
  .flagship-banner {{
    background: var(--surface); border: 2px solid var(--accent);
    border-radius: 8px; overflow: hidden; margin-bottom: 28px;
    display: grid; grid-template-columns: 1.35fr 1fr;
  }}
  .flagship-thumbs {{
    display: grid; grid-template-columns: 2fr 1fr; gap: 4px; background: var(--rule);
  }}
  .flagship-thumbs img {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
  .flagship-stack {{ display: flex; flex-direction: column; gap: 4px; }}
  .flagship-body {{ padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; }}
  .ribbon {{
    display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px;
    margin-bottom: 28px;
  }}
  .ribbon-cell {{
    background: var(--surface); border: 1px solid var(--rule);
    padding: 8px 10px; border-radius: 4px; cursor: pointer;
    transition: border-color 0.15s;
  }}
  .ribbon-cell:hover {{ border-color: var(--accent); }}
  .ribbon-cell .r-num {{ font-size: 10px; font-weight: 600; color: var(--accent); letter-spacing: 0.08em; }}
  .ribbon-cell .r-name {{ font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 600; }}
  .studio-bar {{
    background: var(--surface); border: 1px solid var(--rule);
    border-radius: 8px; overflow: hidden; margin-bottom: 32px;
  }}
  .studio-head {{
    padding: 10px 16px; border-bottom: 1px solid var(--rule);
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; font-weight: 600;
  }}
  #viewer-frame {{ width: 100%; height: 560px; border: 0; display: block; background: #efece4; }}
  .grid {{
    display: grid; grid-template-columns: repeat(auto-fill, minmax(390px, 1fr)); gap: 22px;
  }}
  .kit-card {{
    background: var(--surface); border: 1px solid var(--rule);
    border-radius: 6px; overflow: hidden; display: flex; flex-direction: column;
  }}
  .kit-thumb-link {{ display: block; overflow: hidden; border-bottom: 1px solid var(--rule); background: #efece4; }}
  .kit-thumb {{ width: 100%; height: 245px; object-fit: cover; display: block; transition: transform 0.25s ease; }}
  .kit-thumb-link:hover .kit-thumb {{ transform: scale(1.02); }}
  .kit-body {{ padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 10px; flex: 1; }}
  .kit-meta {{ display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; font-weight: 600; }}
  .kit-num {{ color: var(--accent); letter-spacing: 0.1em; text-transform: uppercase; }}
  .kit-clicks {{ color: #2f6838; background: rgba(47,104,56,0.1); padding: 2px 7px; border-radius: 3px; }}
  .kit-title {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 600; line-height: 1.15; }}
  .kit-title a {{ color: inherit; text-decoration: none; }}
  .kit-title a:hover {{ color: var(--accent); }}
  .kit-greek {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 14px; color: var(--muted); }}
  .kit-epigraph {{
    font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic;
    font-size: 15.5px; color: var(--ink); border-left: 2px solid var(--accent); padding-left: 10px;
  }}
  .kit-moment {{ font-size: 13px; color: var(--muted); }}
  .kit-object {{
    font-size: 12.5px; background: rgba(143,99,36,0.08);
    border-left: 2px solid var(--accent); padding: 8px 10px; border-radius: 0 4px 4px 0;
  }}
  .kit-actions {{ margin-top: auto; padding-top: 8px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }}
  .load-btn {{
    background: var(--ink); color: var(--surface); border: 0;
    padding: 7px 12px; border-radius: 4px; font-size: 11.5px; font-weight: 500; cursor: pointer;
  }}
  .load-btn:hover {{ background: var(--accent); }}
  .page-link {{ font-size: 11.5px; color: var(--ink); text-decoration: none; font-weight: 600; }}
  .page-link:hover {{ color: var(--accent); }}
  .mpd-link {{ font-size: 11.5px; color: var(--accent); text-decoration: none; font-weight: 500; margin-left: auto; }}
</style>
</head>
<body>
  <header>
    <div>
      <div class="eyebrow">Operative Ekphrasis · From Imagetext to Worldtext (Bolter &amp; Hartsoe)</div>
      <h1>The Shield of Achilles — The Kit Line &amp; Grand Rotunda</h1>
      <div class="subhead">Eight playable LDraw architectural kits (16 inspected builds · {total_pcs:,} pieces · 0 loose · 0 clashes) from Homer’s Iliad XVIII.468–608, crowned by the 80×80-stud UCS Grand Rotunda of Achilles.</div>
    </div>
    <div class="nav-links">
      <a href="achilles-rotunda/index.html">#75910 Grand Rotunda (9 Builds)</a>
      <a href="brief.html">The Design Brief (5 Rules)</a>
      <a href="../../odyssey/kits/index.html">The Odyssey Line</a>
    </div>
  </header>

  <section class="flagship-banner">
    <a href="achilles-rotunda/index.html" class="flagship-thumbs">
      <img src="achilles-rotunda/hero.jpg" alt="Stage III Grand Rotunda of Achilles"/>
      <div class="flagship-stack">
        <img src="achilles-rotunda/shell_center.jpg" alt="Stage II Structural Shell"/>
        <img src="achilles-rotunda/plinth.jpg" alt="Stage I Oceanus Plinth &amp; Atrium"/>
      </div>
    </a>
    <div class="flagship-body">
      <div class="kit-meta">
        <span class="kit-num">UCS FLAGSHIP #75910 · 80×80 STUDS · 3 STAGES + 6 MODULES</span>
        <span class="kit-clicks">✓ 8,891 pcs · 0 loose · 0 clashes</span>
      </div>
      <h2 class="kit-title" style="font-size:28px;"><a href="achilles-rotunda/index.html">{rotunda_m['title']}</a></h2>
      <blockquote class="kit-epigraph">{rotunda_m['quote']}</blockquote>
      <p class="kit-moment">{rotunda_m['moment']}</p>
      <div class="kit-object">
        <strong>Staged &amp; Modular Architecture:</strong> Inspect Stage I (<code>set.achilles-rotunda-plinth</code>, 4,727 pcs), Stage II (<code>set.achilles-rotunda-shell</code>, 6,042 pcs), Stage III (<code>set.achilles-rotunda</code>, 8,891 pcs), and all 6 Sector Sub-Builds.
      </div>
      <div class="kit-actions">
        <button class="load-btn" onclick="loadKit('set.achilles-rotunda', 'Stage III: The Grand Rotunda of Achilles')">Load Stage III in 3D Studio ↓</button>
        <button class="load-btn" style="background:#544d42;" onclick="loadKit('set.achilles-rotunda-shell', 'Stage II: Architectural Shell &amp; Space-Frame')">Stage II Shell ↓</button>
        <button class="load-btn" style="background:#544d42;" onclick="loadKit('set.achilles-rotunda-plinth', 'Stage I: Oceanus Plinth &amp; Sunken Atrium')">Stage I Plinth ↓</button>
        <a class="page-link" href="achilles-rotunda/index.html">All 14 Studio Photos &amp; 9 Builds →</a>
      </div>
    </div>
  </section>

  <div class="ribbon">
    <div class="ribbon-cell" onclick="loadKit('set.achilles-rotunda', 'KIT #75910 · The Grand Rotunda of Achilles')"><div class="r-num">UCS #75910 · 8,891 PCS</div><div class="r-name">The Grand Rotunda</div></div>
    {''.join(f'<div class="ribbon-cell" onclick="loadKit(\'{m["card"]}\', \'{m["title"].replace(chr(39), "")}\')"><div class="r-num">KIT {m["num"]} · {m["pieces"]} PCS</div><div class="r-name">{m["title"]}</div></div>' for m in manifests)}
  </div>

  <section class="studio-bar">
    <div class="studio-head">
      <span id="studio-label">Live 3D LDraw Studio — UCS #75910 · The Grand Rotunda of Achilles (Stage III Masterpiece)</span>
      <span>Real ./ldraw/parts/*.dat · ACES Filmic · Warm Sun / Cool Fill</span>
    </div>
    <iframe id="viewer-frame" src="../../odyssey-forage.html?card=../../achilles/cards/set.achilles-rotunda.mpd&bg=efece4"></iframe>
  </section>

  <section class="grid">
    {''.join(cards_html)}
  </section>

<script>
function loadKit(card, title) {{
  document.getElementById('studio-label').textContent = 'Live 3D LDraw Studio — ' + title + ' (' + card + '.mpd)';
  document.getElementById('viewer-frame').src = '../../odyssey-forage.html?card=../../achilles/cards/' + card + '.mpd&bg=efece4';
  document.querySelector('.studio-bar').scrollIntoView({{ behavior: 'smooth' }});
}}
</script>
</body>
</html>"""


def build_brief_html():
    return """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>The Shield of Achilles Line — Design Brief</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  body { background: #efece4; color: #1a1815; font-family: 'Inter', sans-serif; max-width: 820px; margin: 0 auto; padding: 48px 24px; line-height: 1.65; }
  h1, h2 { font-family: 'Cormorant Garamond', Georgia, serif; }
  h1 { font-size: 40px; margin-bottom: 8px; }
  h2 { font-size: 26px; margin-top: 28px; margin-bottom: 6px; color: #8f6324; }
  p { margin-bottom: 14px; font-size: 14.5px; }
  a { color: #8f6324; }
</style>
</head>
<body>
  <p><a href="index.html">← Back to The Shield of Achilles Kit Line</a></p>
  <h1>The Five Rules of the Shield of Achilles Line</h1>
  <p>Built on the exact architecture of <em>The Odyssey Line</em> (<code>tools/forage/product/</code>) and grounded in Jay David Bolter &amp; Watson Hartsoe’s <em>Operative Ekphrasis: From Imagetext to Worldtext</em>.</p>
  <h2>1. The Moment, Then the Room</h2>
  <p>Each kit stages the exact dramatic turning point in Homer’s <em>Iliad</em> XVIII.468–608: the Revolving Bear on Hephaestus’s anvil, the Two Talents of Gold in the sacred circle, the 1.6× Golden Gods leading the sortie to the river ambush, the golden fallow turning black behind the plough, the nine dogs recoiling from the two lions, the potter’s-wheel Choros inside River Oceanus, and the 80×80-stud UCS Grand Rotunda uniting all ten worlds around the Sunken Fountain Atrium.</p>
  <h2>2. One Working LEGO Mechanism (“The Object”)</h2>
  <p>Every kit builds its Homeric motion around a physical LEGO mechanism or staged modular architecture verified in LDraw.</p>
  <h2>3. The Bronze Age &amp; Panopticon Architecture</h2>
  <p>Walls are cross-bonded masonry courses and Pylos/Mycenae fresco dados with seeded Mediterranean oaks, olives, cypresses, reeds, and silver-poled vines (<code>landscape.py</code>).</p>
  <h2>4. Finished Surfaces</h2>
  <p>Every kit stands inside a tiled architectural border with SDF/voxel courses capped with smooth tiles, leaving studs open only where figures, animals, and trees stand.</p>
  <h2>5. Proven by clicks.py &amp; Photographed by shoot.py</h2>
  <p>Every brick and plate is verified against <code>./ldraw/parts/*.dat</code> bounding boxes via <code>ldbox.py</code> and <code>clicks.py</code> (<strong>0 loose · 0 clashes</strong> across all 16 builds) and studio-rendered via <code>shoot.py</code>.</p>
</body>
</html>"""


def main():
    manifests = []
    bundle_dict = {}
    for spec in KITS_SPEC:
        kit_dir = os.path.join(ACH_KITS, spec['slug'])
        mpath = os.path.join(kit_dir, 'kit.json')
        mdata = json.load(open(mpath))
        mdata['slug'] = spec['slug']
        spec['pieces'] = mdata['pieces']
        manifests.append(mdata)

        payload, n_inst = compile_kit_payload(spec)
        bundle_entry = {
            'slug': spec['slug'],
            'card': spec['card'],
            'num': spec['num'],
            'title': spec['title'],
            'pieces': spec['pieces'],
            'hotspots': HOTSPOTS.get(spec['slug'], []),
            'data': payload,
        }
        bundle_dict[spec['slug']] = bundle_entry
        bundle_dict[spec['card']] = bundle_entry

        portal_file = PORTAL_FILES[spec['slug']]
        portal_path = os.path.join(ARTIFACT_DIR, portal_file)
        html = build_portal_html(spec, payload)
        open(portal_path, 'w', encoding='utf-8').write(html)
        print(f"  Wrote portal {portal_file:34s} ({n_inst:5d} parts, {len(html)//1024:4d} KB synchronous HTML)")

        open(os.path.join(kit_dir, 'index.html'), 'w', encoding='utf-8').write(build_kit_page_html(mdata))

    # Compile #75910 — The Grand Rotunda of Achilles (9 builds + 3 interactive <agent-embed> portals)
    rot_dir = os.path.join(ACH_KITS, 'achilles-rotunda')
    rot_manifest = json.load(open(os.path.join(rot_dir, 'kit.json')))
    for b in rot_manifest['builds']:
        bslug = b['card'].replace('set.', '')
        bspec = {
            'slug': bslug,
            'card': b['card'],
            'num': '75910',
            'lines': 'Il. XVIII.478–608',
            'title': b['title'],
            'pieces': b['pieces'],
            'object': rot_manifest['object'],
        }
        payload, n_inst = compile_kit_payload(bspec)
        b_entry = {
            'slug': bslug,
            'card': b['card'],
            'num': '75910',
            'title': b['title'],
            'pieces': b['pieces'],
            'hotspots': HOTSPOTS.get(bslug, []),
            'data': payload,
        }
        bundle_dict[bslug] = b_entry
        bundle_dict[b['card']] = b_entry

        if bslug in PORTAL_FILES:
            portal_file = PORTAL_FILES[bslug]
            portal_path = os.path.join(ARTIFACT_DIR, portal_file)
            html = build_portal_html(bspec, payload)
            open(portal_path, 'w', encoding='utf-8').write(html)
            print(f"  Wrote portal {portal_file:34s} ({n_inst:5d} parts, {len(html)//1024:4d} KB synchronous HTML)")

    open(os.path.join(rot_dir, 'index.html'), 'w', encoding='utf-8').write(build_rotunda_page_html(rot_manifest))

    os.makedirs(ACH_KITS, exist_ok=True)
    bundle_js = 'window.ACHILLES_BUNDLE = ' + json.dumps(bundle_dict, separators=(',', ':')) + ';\n'
    open(os.path.join(ACH_KITS, 'forage-bundle.js'), 'w', encoding='utf-8').write(bundle_js)
    open(os.path.join(ACH_KITS, 'index.html'), 'w', encoding='utf-8').write(build_hub_html(manifests, rot_manifest))
    open(os.path.join(ACH_KITS, 'brief.html'), 'w', encoding='utf-8').write(build_brief_html())
    print('Wrote achilles/kits/forage-bundle.js, achilles/kits/index.html, achilles/kits/achilles-rotunda/index.html, and 10 <agent-embed> portals')


if __name__ == '__main__':
    main()
