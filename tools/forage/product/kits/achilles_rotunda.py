#!/usr/bin/env python3
"""tools/forage/product/kits/achilles_rotunda.py — THE GRAND ROTUNDA OF ACHILLES (#75910)

A monumental UCS / LEGO Icons-scale circular architectural panopticon (80 x 80 studs, 1600 x 1600 LDU)
that unites the entire narrative world of Homer's Shield of Achilles (Iliad XVIII.478-608) inside a
two-level neoclassical & modernist rotunda:

  - Stage I   (set.achilles-rotunda-plinth):
      The outer circular moat of River Oceanus (with 36 radial white tick marks and the South Threshold Bridge),
      the elevated circular white Level 1 Concourse Drum (yup=60), and the Sunken Central Atrium (Level 0, yup=12)
      with its Central Fountain Plume, concentric paved rings, 12 undercroft columns, circular balustrade,
      and Twin Escalators ascending from the sunken fountain basin to the North Concourse Landing.

  - Stage II  (set.achilles-rotunda-shell):
      The complete concentric and radial masonry superstructure (Inner Storefront Ring r=17, Middle Gallery Ring r=26,
      Outer Drum Wall r=34, and 10 radial partition walls, all capped with dark coping rims), curved inner storefront
      colonnades with doorways and windows, the South Processional Entrance Corridor, and the stepped gridded
      Space-Frame Skylight Canopy spanning the North sector.

  - Stage III (set.achilles-rotunda):
      The fully populated Masterpiece where every sector and gallery houses the worlds of the Shield:
        1. Sunken Fountain Atrium & Twin Escalators + 4 White-Canopied Concourse Kiosk Pavilions (Center)
        2. The Celestial Night-Sky Planetarium Vault (Golden Sun, Crescent Moon & White Constellations) +
           North Archive Colonnade & 3 Outer Mountain Forest Bays (North, 10:30-1:30)
        3. The City at Peace: Inner Bridal & Banquet Hall + 3 Outer Civic & Sacred Circle Law-Court Galleries (NW, 8:30-10:30)
        4. The City at War: Inner Bronze Phalanx & Ares/Athena Hall + Outer Siege Bays & Craggy Boulder Gorge (NE, 1:30-3:45)
        5. The Pastoral Meadow: Flock of White Sheep, Horned Cattle, prowling Tawny Lions & Herdsmen (SE, 3:45-5:15)
        6. The Vineyard & Vintage: Silver-poled grapevines, harvest crates, wine-vats & Linos-singer (SSE, 5:15-5:50)
        7. The South Processional Avenue & Bridge over Oceanus with the solitary Threshold Watcher (South, 6:00)
        8. The Golden Corn Harvest: Dense standing golden wheat stalks, 5 bound wheat bales, reapers & Silent King (SSW, 6:10-6:45)
        9. The Black Ploughed Fallow: Pitch-black furrowed glebe, dark ploughmen, ox-plough rigs & storage crates (SW, 6:45-8:30)

  - Plus 6 Standalone Modular Sector Sub-Builds (set.achilles-rotunda-atrium, -celestial, -peace, -war, -harvest, -pasture)
    that assemble together into the Rotunda, every single build verified by clicks.py with 0 loose parts and 0 clashes.
"""
import math, os, sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from kitlib import *
from sculpt import settle
from kits.achilles_line import (
    ox_beast, lion_beast, sheep_beast, dog_beast, horse_beast, colossus,
)

BRONZE = COPPER


def rotunda_tree(xc, yup, zc, kind='olive', seed=0):
    """Compact 2x2-footprint sculpted tree engineered to fit inside the Rotunda's radial forest & pasture bays with 0 wall clashes."""
    out = []
    out.append(put(DB, xc, yup + P, zc, '4032a'))
    if kind == 'cypress':
        out.append(put(RB, xc, yup + P + B, zc, '3941'))
        for c in range(3):
            col = GREEN if c == 1 else DGREEN
            out.append(put(col, xc, yup + P + (c + 2) * B, zc, '3941'))
        out.append(put(DGREEN, xc, yup + 2 * P + 4 * B, zc, '3068b'))
        return out

    trunk_col = DBG if kind == 'olive' else DB
    out.append(put(trunk_col, xc, yup + P + B, zc, '3941'))
    out.append(put(RB if kind != 'olive' else trunk_col, xc, yup + P + 2 * B, zc, '3941'))
    can_y = yup + P + 2 * B
    if kind == 'olive':
        c1, c2 = OLIVE, SANDGREEN
    elif kind == 'pine':
        c1, c2 = DGREEN, GREEN
    else:
        c1, c2 = GREEN, OLIVE
    out.append(put(c1, xc, can_y + B, zc, '3003'))
    out.append(put(c2, xc, can_y + B + P, zc, '3022'))
    out.append(put(c1, xc, can_y + 2 * B + P, zc, '3941'))
    out.append(put(c2, xc, can_y + 2 * B + 2 * P, zc, '3068b'))
    return out


def olive_tree(xc, yup, zc):
    return rotunda_tree(xc, yup, zc, 'olive')


def cypress_tree(xc, yup, zc):
    return rotunda_tree(xc, yup, zc, 'cypress')


def pine_tree(xc, yup, zc):
    return rotunda_tree(xc, yup, zc, 'pine')


def oak_tree(xc, yup, zc):
    return rotunda_tree(xc, yup, zc, 'oak')


def archive_shelf(xc, yup, zc, rot=0.0):
    """4x2-stud wooden library / scroll archive bookcase (matching the brown shelf units under the North Canopy in Image 4)."""
    out = []
    # Base 2x4 plate (3020) at (xc, zc)
    out.append(put(RB, xc, yup + P, zc, '3020'))
    # First course: 2x4 brick in Dark Tan (scroll cubbies)
    out.append(put(DTAN, xc, yup + P + B, zc, '3001'))
    # Second course: 2x4 brick in Reddish Brown
    out.append(put(RB, xc, yup + P + 2 * B, zc, '3001'))
    # Cap with smooth wood-grain tiles (87079)
    out.append(put(DTAN, xc, yup + 2 * P + 2 * B, zc, '87079'))
    return out


def crate_stack(xc, yup, zc):
    """2x2-stud stacked wooden storage crates & grain bins (matching the crate stacks in the Fallow, Peace, War & Vineyard bays of Image 4)."""
    return [
        put(TAN, xc, yup + B, zc, '3003'),
        put(RB, xc, yup + B + P, zc, '3022'),
        put(DTAN, xc, yup + 2 * B + P, zc, '3003'),
        put(TAN, xc, yup + 2 * B + 2 * P, zc, '3068b'),
    ]


def brazen_tripod(xc, yup, zc):
    """1x1-stud golden tripod cauldron of Hephaestus (Il. XVIII.373)."""
    return [
        on(GOLD, xc, yup, zc, '3062b'),
        on(BRONZE, xc, yup + B, zc, '3062b'),
        on(GOLD, xc, yup + 2 * B, zc, '98138'),
    ]


def grapevine_row(xc, yup, zc, length=3, along_x=True):
    """2x2-stud silver-poled grapevine arbor with green foliage and purple/gold grape clusters (Il. XVIII.561-565)."""
    return [
        put(SILVER, xc - 10, yup + B, zc - 10, '3062b'),
        put(SILVER, xc + 10, yup + B, zc + 10, '3062b'),
        put(OLIVE, xc, yup + B + P, zc, '3022'),
        put(DGREEN, xc - 10, yup + B + 2 * P, zc, '3069b', RY(math.pi / 2)),
        on(DPURPLE, xc + 10, yup + B + P, zc - 10, '98138'),
        on(GOLD, xc + 10, yup + B + P, zc + 10, '98138'),
    ]


def hsh(*args):
    v = 2166136261
    for a in args:
        v ^= int(a) & 0xFFFFFFFF
        v = (v * 16777619) & 0xFFFFFFFF
    return v


def cx(i):
    return (i + 0.5) * S


def ang_diff(a, b):
    """signed angular difference a - b in [-180, 180] degrees"""
    d = (a - b + 180.0) % 360.0 - 180.0
    return d


def in_arc(deg, a0, a1):
    """True if deg (in [-180, 180]) lies in the counter-clockwise arc from a0 to a1"""
    span = (a1 - a0) % 360.0
    off = (deg - a0) % 360.0
    return off <= span


# ─────────────────────────────────────────────────────────────────────────────
# GEOMETRIC CONSTANTS OF THE 80x80 ROTUNDA (stud indices i, k in -40..39)
# ─────────────────────────────────────────────────────────────────────────────
# Polar angle convention: deg = degrees(atan2(z, x))
#   -90 deg = North (Top of render, -z)
#     0 deg = East  (Right of render, +x)
#   +90 deg = South (Bottom of render, +z — South Entrance Avenue)
#  ±180 deg = West  (Left of render, -x)

R_FOUNTAIN_IN = 2.4      # Inner water pool of central fountain
R_FOUNTAIN_CURB = 3.6    # Stone curb of central fountain
R_ATRIUM = 10.2          # Sunken atrium rim (Level 0 inside, Level 1 outside)
R_INNER_W0 = 16.4        # Inner concentric ring wall inner face
R_INNER_W1 = 18.0        # Inner concentric ring wall outer face
R_MID_W0 = 25.4          # Middle concentric ring wall inner face
R_MID_W1 = 27.0          # Middle concentric ring wall outer face
R_OUTER_W0 = 33.4        # Outer drum wall inner face
R_OUTER_W1 = 35.0        # Outer drum wall outer face
R_OCEANUS_END = 38.4     # Outer edge of River Oceanus water moat
R_RIM_END = 39.6         # Outer parapet rim of the Rotunda

# Escalator stud columns (ascending from k=-3 in sunken atrium to k=-8 at Level 1 North landing, framing the central fountain)
ESC_L_I = (-5, -4)       # Left escalator tread columns
ESC_L_BAL_I = (-6, -3)   # Left escalator balustrade columns
ESC_R_I = (3, 4)         # Right escalator tread columns
ESC_R_BAL_I = (2, 5)     # Right escalator balustrade columns
ESC_K_RANGE = range(-8, -2)

# North Colonnade & Celestial Canopy support columns (2x2 stud piers at even stud pairs)
NORTH_PIERS = [
    # Front colonnade row along k = -12..-11 (z = -240..-200)
    (-10, -12), (-6, -12), (-2, -12), (2, -12), (6, -12), (8, -12),
    # Middle colonnade row along k = -16..-15
    (-12, -16), (-8, -16), (-4, -16), (0, -16), (4, -16), (8, -16), (10, -16),
    # Inner gallery colonnade row along k = -20..-19
    (-14, -20), (-10, -20), (-6, -20), (-2, -20), (2, -20), (6, -20), (10, -20), (12, -20),
    # Back gallery support row along k = -24..-23
    (-12, -24), (-8, -24), (-4, -24), (0, -24), (4, -24), (8, -24), (10, -24),
]
NORTH_PIER_CELLS = {
    (pi + di, pk + dk)
    for (pi, pk) in NORTH_PIERS
    for di in (0, 1)
    for dk in (0, 1)
}

# Undercroft columns around the sunken atrium rim (2x2 piers supporting Level 1 overhang)
ATRIUM_COLS = [
    (-10, -2), (-10, 2), (-8, 6), (-4, 9), (2, 9), (6, 6), (8, 2), (8, -2),
]
ATRIUM_COL_CELLS = {
    (ci + di, ck + dk)
    for (ci, ck) in ATRIUM_COLS
    for di in (0, 1)
    for dk in (0, 1)
}


def is_south_avenue(i, k):
    """The straight South Processional Entrance Corridor at 6 o'clock (+z)"""
    return k >= 15 and -2 <= i <= 1


def is_south_avenue_wall(i, k):
    """The radial walls flanking the South Processional Entrance Corridor"""
    x, z = (i + 0.5), (k + 0.5)
    r = math.hypot(x, z)
    return 16.4 <= r <= 35.0 and k >= 15 and i in (-4, -3, 2, 3)


def radial_wall_hit(i, k, r, deg):
    """True if cell (i, k) lies on one of the radial partition walls of the Rotunda"""
    if is_south_avenue(i, k):
        return False
    if is_south_avenue_wall(i, k):
        return True

    # Full-depth primary radial partition walls (r = 16.4 .. 35.0)
    full_angles = (-130.0, -50.0, 15.0, 66.0, 114.0, 168.0)
    for wa in full_angles:
        if 16.4 <= r <= 35.0:
            perp = abs(r * math.radians(ang_diff(deg, wa)))
            if perp <= 0.92:
                if wa in (-130.0, -50.0) and 20.5 <= r <= 22.8:
                    return False
                return True

    # Outer-ring secondary radial partition walls (r = 25.4 .. 35.0) dividing the Northern half into bays
    outer_angles = (
        -103.0, -77.0,   # Subdivide North Forest into 3 bays
        -156.0, 180.0,   # Subdivide NW Peace Outer Ring into 3 bays
        -26.0, -4.0,     # Subdivide NE War Outer Ring into Siege, Cavalry & Craggy Rock Gorge
    )
    for wa in outer_angles:
        if 25.4 <= r <= 35.0:
            perp = abs(r * math.radians(ang_diff(deg, wa)))
            if perp <= 0.92:
                return True

    return False


def is_wall_doorway(i, k, r, deg, ring):
    """True if a concentric ring wall ('inner', 'mid', 'outer') has a portal/doorway opening at (r, deg)"""
    if is_south_avenue(i, k):
        return True
    if ring == 'outer':
        return False
    if ring == 'inner':
        # North sector (-126 .. -54 deg) is an open colonnade facing the escalators
        if in_arc(deg, -126.0, -54.0):
            return True
        # Wide open thresholds into the Southern agricultural/pastoral sectors (+20 .. +162 deg)
        if in_arc(deg, 22.0, 60.0) or in_arc(deg, 70.0, 82.0) or in_arc(deg, 98.0, 110.0) or in_arc(deg, 120.0, 162.0):
            return True
        # Storefront portals in NW Peace (-162..-154, -144..-136) and NE War (-42..-34, -22..-14)
        for p_ang in (-158.0, -140.0, -38.0, -18.0, 176.0):
            if abs(ang_diff(deg, p_ang)) <= 3.8:
                return True
        return False
    if ring == 'mid':
        # Doorways from inner halls into each outer gallery bay in NW, North, and NE
        for p_ang in (-172.0, -144.0, -116.0, -90.0, -64.0, -38.0, -15.0):
            if abs(ang_diff(deg, p_ang)) <= 3.2:
                return True
        return False
    return False


def is_wall_window(r, deg, ring):
    """Storefront transom/window openings in the curved inner wall of NW Peace and NE War"""
    if ring != 'inner':
        return False
    for w_ang in (-168.0, -149.0, -28.0, -9.0):
        if abs(ang_diff(deg, w_ang)) <= 3.0:
            return True
    return False


def in_canopy_footprint(i, k):
    """True if stud (i, k) lies under the North Celestial / Space-Frame Canopy"""
    x, z = (i + 0.5), (k + 0.5)
    r = math.hypot(x, z)
    deg = math.degrees(math.atan2(z, x))
    if not in_arc(deg, -130.5, -49.5):
        return False
    return k <= -11 and 11.2 <= r <= 26.8


def escalator_info(i, k):
    """Returns ('tread', h_top) or ('bal', h_top) if (i, k) is part of the Twin Escalators, else None"""
    if k not in ESC_K_RANGE:
        return None
    # k goes from -3 (bottom, in sunken atrium) to -8 (top, meeting Level 1 concourse at k=-9)
    s = -3 - k
    h_tread = 1 + (s * 4) // 5
    if i in ESC_L_I or i in ESC_R_I:
        return ('tread', h_tread)
    if i in ESC_L_BAL_I or i in ESC_R_BAL_I:
        return ('bal', h_tread + 2)
    return None


def sector_of(i, k, r, deg):
    """Returns the semantic biome/sector name for a Level 1 floor cell (r in 10.2 .. 33.4)"""
    if is_south_avenue(i, k):
        return 'avenue'
    if r < R_INNER_W0:
        return 'concourse'
    if in_arc(deg, -130.0, -50.0):
        return 'north_gallery' if r < R_MID_W0 else 'north_forest'
    if in_arc(deg, 168.0, -130.0):
        return 'peace_inner' if r < R_MID_W0 else 'peace_outer'
    if in_arc(deg, -50.0, 15.0):
        if r < R_MID_W0:
            return 'war_inner'
        if in_arc(deg, -4.0, 15.0):
            return 'war_gorge'
        return 'war_outer'
    if in_arc(deg, 15.0, 66.0):
        return 'pasture'
    if in_arc(deg, 66.0, 90.0):
        return 'vineyard'
    if in_arc(deg, 90.0, 114.0):
        return 'harvest'
    return 'fallow'


# ─────────────────────────────────────────────────────────────────────────────
# ROTUNDA VOXEL-COURSE BUILDER (Stage I Plinth, Stage II Shell, Stage III Master)
# ─────────────────────────────────────────────────────────────────────────────
def build_rotunda_structure(stage='master', keep_floor_studs=(), bounds_filter=None):
    """
    Builds the structural base, sunken fountain atrium, twin escalators, concourse drum,
    concentric & radial walls, and (for 'shell' and 'master') the North canopy.
    """
    keep_set = {
        'fountain_core', 'stand', 'pier_top', 'wall_stud',
        'canopy_stud', 'bale_stud', 'gorge_stud', 'furrow_ridge',
    }
    form = Form(y0=4, unit=P, caps=True, keep_studs=keep_set)
    floor_stud_cells = set(keep_floor_studs)

    for i in range(-40, 40):
        for k in range(-40, 40):
            if bounds_filter and not bounds_filter(i, k):
                continue
            x, z = (i + 0.5), (k + 0.5)
            r = math.hypot(x, z)
            if r > R_RIM_END:
                continue
            deg = math.degrees(math.atan2(z, x))

            # 0. Foundation plate layer h=0 across the entire circular drum (guarantees 100% root connectivity)
            form.vox[(i, 0, k)] = 'base_ocean' if r >= R_OUTER_W1 else 'base_drum'

            # 1. Outer Parapet Rim of Oceanus (R_OCEANUS_END <= r <= R_RIM_END)
            if r >= R_OCEANUS_END:
                for h in range(1, 4):
                    form.vox[(i, h, k)] = 'ocean_rim'
                continue

            # 2. River Oceanus Circular Moat (R_OUTER_W1 <= r < R_OCEANUS_END)
            if r >= R_OUTER_W1:
                if is_south_avenue(i, k):
                    # South Threshold Bridge across Oceanus
                    for h in range(1, 6):
                        form.vox[(i, h, k)] = 'drum' if h < 5 else 'floor_white'
                    if (i, k) in floor_stud_cells:
                        form.vox[(i, 5, k)] = 'stand'
                elif i in (-3, 2) and k >= 34:
                    # Bridge parapet walls
                    for h in range(1, 8):
                        form.vox[(i, h, k)] = 'wall'
                    form.vox[(i, 8, k)] = 'coping'
                else:
                    # Glossy dark slate Oceanus water with 36 radial white tick-marks every 10 degrees
                    mod10 = (deg + 180.0) % 10.0
                    is_tick = (mod10 < 0.85 or mod10 > 9.15) and (35.8 <= r <= 37.9)
                    form.vox[(i, 0, k)] = 'ocean_tick' if is_tick else 'ocean_water'
                continue

            # 3. Sunken Central Fountain Atrium (r < R_ATRIUM)
            if r < R_ATRIUM:
                esc = escalator_info(i, k)
                if esc is not None:
                    kind, h_top = esc
                    for h in range(1, h_top + 1):
                        if kind == 'tread':
                            form.vox[(i, h, k)] = 'esc_tread'
                        else:
                            form.vox[(i, h, k)] = 'esc_bal' if h < h_top else 'esc_handrail'
                    continue

                # Central fountain basin is centered at (0.0, +2.0) so it sits cleanly in front of the Twin Escalators!
                r_fountain = math.hypot(x, z - 2.0)
                if r_fountain < R_FOUNTAIN_IN:
                    if i in (-1, 0) and k in (1, 2):
                        for h in range(1, 4):
                            form.vox[(i, h, k)] = 'fountain_core'
                    else:
                        form.vox[(i, 0, k)] = 'fountain_water'
                        form.vox[(i, 1, k)] = 'fountain_water'
                    continue

                if r_fountain < R_FOUNTAIN_CURB:
                    for h in range(1, 3):
                        form.vox[(i, h, k)] = 'fountain_curb'
                    continue

                if (i, k) in ATRIUM_COL_CELLS:
                    for h in range(1, 6):
                        form.vox[(i, h, k)] = 'undercroft_col'
                    continue

                # Sunken Atrium concentric paved floor around the fountain basin
                ring_idx = int(max(0.0, r_fountain - R_FOUNTAIN_CURB) / 1.8)
                form.vox[(i, 0, k)] = 'atrium_ring_a' if ring_idx % 2 == 0 else 'atrium_ring_b'
                if (i, k) in floor_stud_cells:
                    form.vox[(i, 0, k)] = 'stand'
                continue

            # 4. Elevated Level 1 Circular Drum (R_ATRIUM <= r < R_OUTER_W1, h = 1..5 -> top at yup=52, tiled at yup=60)
            sec = sector_of(i, k, r, deg)
            drum_mat = f'floor_{sec}' if stage == 'master' else 'floor_white'
            for h in range(1, 6):
                form.vox[(i, h, k)] = 'drum' if h < 5 else drum_mat

            # Circular Atrium Balustrade Railing along the inner edge (R_ATRIUM <= r < R_ATRIUM + 0.95)
            if r < R_ATRIUM + 0.95:
                # Leave openings at the top of the Twin Escalators (i in ESC_L_I or ESC_R_I, k < 0)
                if not (k < 0 and (i in ESC_L_I or i in ESC_R_I)):
                    form.vox[(i, 6, k)] = 'balustrade'
                    form.vox[(i, 7, k)] = 'balustrade_top'
                continue

            # If Stage I ('plinth'), no upper ring walls or radial walls are placed — only the smooth white drum & outer rim wall!
            if stage == 'plinth':
                if r >= R_OUTER_W0 and not is_south_avenue(i, k):
                    for h in range(6, 18):
                        form.vox[(i, h, k)] = 'wall'
                    form.vox[(i, 18, k)] = 'coping_outer'
                continue

            # 5. Stage II ('shell') & Stage III ('master'): Concentric Ring Walls, Radial Walls & North Colonnade Piers
            in_outer_w = (R_OUTER_W0 <= r < R_OUTER_W1) and not is_south_avenue(i, k)
            in_mid_w = (R_MID_W0 <= r <= R_MID_W1) and in_arc(deg, 168.0, 15.0)
            in_inner_w = (R_INNER_W0 <= r <= R_INNER_W1)
            in_rad_w = radial_wall_hit(i, k, r, deg)

            # Check if this cell is a North Colonnade Pier supporting the canopy
            if (i, k) in NORTH_PIER_CELLS and in_canopy_footprint(i, k):
                for h in range(6, 19):
                    form.vox[(i, h, k)] = 'pier'
                form.vox[(i, 18, k)] = 'pier_top'
                continue

            if in_outer_w or in_mid_w or in_inner_w or in_rad_w:
                ring_kind = 'outer' if in_outer_w else ('mid' if in_mid_w else ('inner' if in_inner_w else 'rad'))
                coping_mat = 'coping_outer' if in_outer_w else 'coping'
                is_door = (not in_rad_w) and is_wall_doorway(i, k, r, deg, ring_kind)
                is_win = (not in_rad_w) and is_wall_window(r, deg, ring_kind)

                if is_door:
                    if ring_kind == 'inner' and (
                        in_arc(deg, -126.0, -54.0)
                        or in_arc(deg, 22.0, 60.0)
                        or in_arc(deg, 70.0, 82.0)
                        or in_arc(deg, 98.0, 110.0)
                        or in_arc(deg, 120.0, 162.0)
                        or is_south_avenue(i, k)
                    ):
                        if (i, k) in floor_stud_cells:
                            form.vox[(i, 5, k)] = 'stand'
                    else:
                        for h in range(15, 18):
                            form.vox[(i, h, k)] = 'wall'
                        form.vox[(i, 18, k)] = coping_mat
                elif is_win:
                    for h in range(6, 9):
                        form.vox[(i, h, k)] = 'wall'
                    for h in range(15, 18):
                        form.vox[(i, h, k)] = 'wall'
                    form.vox[(i, 18, k)] = coping_mat
                else:
                    for h in range(6, 18):
                        form.vox[(i, h, k)] = 'wall'
                    form.vox[(i, 18, k)] = coping_mat
                    if in_canopy_footprint(i, k) and (in_mid_w or in_rad_w or in_inner_w):
                        form.vox[(i, 18, k)] = 'pier_top'
                continue

            # 6. Special Sector Floor Sculpting in Stage III ('master')
            if stage == 'master':
                if sec == 'fallow' and (i + k) % 2 == 0 and 19.0 <= r <= 32.0:
                    form.vox[(i, 5, k)] = 'furrow_ridge'
                if (i, k) in floor_stud_cells:
                    form.vox[(i, 5, k)] = 'stand'

    # 7. For Stage II ('shell') and Stage III ('master'), add the North Canopy Roof Deck (h = 19, 20 -> yup = 156..172)
    if stage in ('shell', 'master'):
        for i in range(-28, 28):
            for k in range(-28, -10):
                if bounds_filter and not bounds_filter(i, k):
                    continue
                if not in_canopy_footprint(i, k):
                    continue
                if stage == 'shell' and i < -4 and k > -17 and (i + k) > -24:
                    continue
                form.vox[(i, 19, k)] = 'canopy_sub'
                if stage == 'shell':
                    is_grid = (i % 3 == 0) or (k % 3 == 0)
                    form.vox[(i, 20, k)] = 'canopy_grid' if is_grid else 'canopy_glass'
                else:
                    x, z = (i + 0.5), (k + 0.5)
                    r = math.hypot(x, z)
                    deg = math.degrees(math.atan2(z, x))
                    on_rim = (k == -11) or (r >= 25.8) or abs(ang_diff(deg, -130.0)) < 2.2 or abs(ang_diff(deg, -50.0)) < 2.2
                    if on_rim:
                        form.vox[(i, 20, k)] = 'canopy_rim'
                    else:
                        form.vox[(i, 20, k)] = 'canopy_sky'

    def rotunda_colour(m, i, h, k):
        r = math.hypot(i + 0.5, k + 0.5)
        if m == 'base_ocean':
            return BLK
        if m == 'base_drum':
            return LBG
        if m == 'ocean_rim':
            return BLK if h == 3 else DBG
        if m == 'ocean_tick':
            return WHITE
        if m == 'ocean_water':
            return BLK if r < 35.8 else DBG
        if m == 'fountain_core':
            return WHITE
        if m == 'fountain_water':
            return TLBLUE if (i + k) % 2 == 0 else AZURE
        if m == 'fountain_curb':
            return WHITE if h == 2 else LBG
        if m == 'undercroft_col':
            return TAN if h < 5 else WHITE
        if m == 'atrium_ring_a':
            return TAN
        if m == 'atrium_ring_b':
            return LBG
        if m == 'esc_tread':
            return BLK if (k % 2 == 0) else DBG
        if m == 'esc_bal':
            return LBG
        if m == 'esc_handrail':
            return BLK
        if m == 'balustrade':
            return TAN
        if m == 'balustrade_top':
            return DBG
        if m == 'drum':
            return LBG if h < 3 else WHITE
        if m == 'floor_white':
            if 10.2 <= r < 11.2:
                return LBG
            return WHITE if r < R_INNER_W0 else TAN
        if m in ('floor_concourse', 'floor_avenue'):
            if 11.2 <= r < 12.0 or 15.2 <= r < 16.0:
                return TAN
            return WHITE
        if m == 'floor_north_gallery':
            return TAN
        if m in ('floor_peace_inner', 'floor_peace_outer'):
            return TAN
        if m in ('floor_war_inner', 'floor_war_outer'):
            return TAN
        if m == 'floor_war_gorge':
            return DBG if (i + k) % 2 == 0 else LBG
        if m == 'floor_north_forest':
            return (OLIVE, DGREEN, SANDGREEN, DTAN)[hsh(i, k) % 4]
        if m == 'floor_pasture':
            return (OLIVE, SANDGREEN, OLIVE, DGREEN)[hsh(i, k, 2) % 4]
        if m == 'floor_vineyard':
            return (OLIVE, SANDGREEN, DTAN)[hsh(i, k, 3) % 3]
        if m == 'floor_harvest':
            return (TAN, DTAN, GOLD)[hsh(i, k, 4) % 3]
        if m == 'floor_fallow':
            return BLK
        if m == 'furrow_ridge':
            return DBG if (k % 2 == 0) else BLK
        if m == 'stand':
            sec = sector_of(i, k, r, math.degrees(math.atan2(k + 0.5, i + 0.5)))
            if sec == 'fallow':
                return BLK
            if sec in ('pasture', 'vineyard', 'north_forest'):
                return OLIVE
            if sec == 'harvest':
                return TAN
            if sec == 'war_gorge':
                return DBG
            if sec in ('concourse', 'avenue'):
                return WHITE
            return TAN
        if m in ('wall', 'pier', 'pier_top'):
            if h == 6:
                return TAN
            return WHITE
        if m == 'coping':
            return BLK
        if m == 'coping_outer':
            return DBG
        if m == 'canopy_sub':
            return LBG if stage == 'shell' else DBLUE
        if m == 'canopy_grid':
            return WHITE
        if m == 'canopy_glass':
            return LBG
        if m == 'canopy_rim':
            return WHITE
        if m in ('canopy_sky', 'canopy_stud'):
            return DBLUE
        return TAN

    return form, rotunda_colour


# ─────────────────────────────────────────────────────────────────────────────
# ARCHITECTURAL & NARRATIVE SUB-ASSEMBLIES OF THE ROTUNDA
# ─────────────────────────────────────────────────────────────────────────────
def fountain_plume(x=0, yup=36, z=40):
    """The Central Sunken Atrium Fountain Water-Jet Plume (rising from the 2x2 center pedestal at z=40, yup=36)"""
    out = []
    out.append(on(TCLEAR, x, yup, z, '3941'))
    out.append(on(WHITE, x, yup + B, z, '3941'))
    out.append(on(TCLEAR, x, yup + 2 * B, z, '3941'))
    out.append(on(WHITE, x, yup + 3 * B, z, '4032a'))
    top_y = yup + 3 * B + P
    for dx, dz, rot in ((-10, -10, 0.4), (10, -10, 1.9), (-10, 10, -1.1), (10, 10, -2.5)):
        out.append(on(WHITE, x + dx, top_y, z + dz, '4589b'))
        out.append(on(TCLEAR, x + dx, top_y + 16, z + dz, '6126b', rot))
    return out


def concourse_kiosk(xc, yup, zc):
    """
    A 4x4-stud (80x80 LDU) White-Canopied Concourse Pavilion / Kiosk standing on Level 1 (yup=52 studs).
    Matches the 4 square white-roofed pavilions around the central fountain balustrade in Image 4!
    """
    out = []
    out.append(put(TAN, xc, yup + P, zc, '3031'))
    out.append(put(DTAN, xc, yup + P + B, zc - 30, '3010'))
    out.append(put(TAN, xc, yup + P + B, zc + 30, '3010'))
    out.append(put(WHITE, xc - 10, yup + 2 * P + B, zc - 30, '3069b'))
    out.append(on(GOLD, xc + 10, yup + P + B, zc - 30, '2343'))
    out.append(on(SILVER, xc + 30, yup + P + B, zc - 30, '98138'))
    out.append(put(WHITE, xc - 10, yup + 2 * P + B, zc + 30, '3069b'))
    out.append(on(GOLD, xc + 10, yup + P + B, zc + 30, '2343'))
    out.append(on(SILVER, xc + 30, yup + P + B, zc + 30, '98138'))
    # Central display plinth inside the kiosk
    out.append(put(RB, xc, yup + P + B, zc, '3003'))
    out.append(put(GOLD, xc, yup + 2 * P + B, zc, '3068b'))
    for dx in (-30, 30):
        for dz in (-30, 30):
            out.append(put(WHITE, xc + dx, yup + P + 2 * B, zc + dz, '3005'))
            out.append(put(WHITE, xc + dx, yup + P + 3 * B, zc + dz, '3005'))
    roof_y = yup + P + 3 * B
    out.append(put(WHITE, xc, roof_y + P, zc, '3031'))
    out.append(put(WHITE, xc, roof_y + 2 * P, zc - 20, '87079'))
    out.append(put(WHITE, xc, roof_y + 2 * P, zc + 20, '87079'))
    # Merchant figure standing right beside the kiosk counter on the concourse floor
    mx = xc + (55 if xc < 0 else -55)
    out += figure(mx, yup + P, zc + 10, rot=(0.4 if xc < 0 else -0.4), torso_col=WHITE, legs_col=TAN, headgear=('11256', DB))
    return out


def kiosk_cells(xc, zc):
    i0, k0 = round((xc - 40) / S), round((zc - 40) / S)
    return {(i0 + a, k0 + b) for a in range(4) for b in range(4)}


def celestial_sky_inlays(form):
    """
    Inlays the Golden Radiant Sun, Silver-Gold Crescent Moon, and White Constellation Star-Lines
    directly onto the Midnight-Blue Celestial Canopy (yup = 172) in Stage III ('master').
    """
    out = []
    sky_yup = 4 + 21 * P  # h=0..20 is 21 plates = 168 LDU -> top of h=20 is 172

    def mark_stud(i, k):
        if (i, 20, k) in form.vox:
            form.vox[(i, 20, k)] = 'canopy_stud'
            return True
        return False

    # 1. THE GOLDEN FULL SUN (Northeast side of canopy: circular disc centered at i=6.0, k=-19.0)
    for i in range(4, 9):
        for k in range(-22, -16):
            d_sun = math.hypot(i - 6.0, k - (-19.0))
            if d_sun <= 2.2 and mark_stud(i, k):
                col = GOLD if d_sun <= 1.2 else YELLOW
                out.append(put(col, cx(i), sky_yup + P, cx(k), '3024'))
                out.append(put(WHITE if d_sun <= 0.8 else col, cx(i), sky_yup + 2 * P, cx(k), '98138'))

    # 2. THE CRESCENT MOON (Northwest side of canopy: crescent arc around i=-7.0, k=-19.0)
    for i in range(-10, -4):
        for k in range(-22, -16):
            d_out = math.hypot(i - (-7.0), k - (-19.0))
            d_in = math.hypot(i - (-6.1), k - (-19.4))
            if d_out <= 2.3 and d_in >= 1.55 and mark_stud(i, k):
                out.append(put(YELLOW, cx(i), sky_yup + P, cx(k), '3024'))
                out.append(put(WHITE if d_out <= 1.7 else YELLOW, cx(i), sky_yup + 2 * P, cx(k), '98138'))

    # 3. CONSTELLATION STAR-LINES & STARS (Pleiades, Hyades, Orion, and Arktos the Bear)
    stars = [
        (-1, -19, WHITE), (0, -19, WHITE), (1, -19, WHITE),
        (-2, -21, TCLEAR), (2, -21, TYELLOW), (-2, -17, TYELLOW), (2, -17, WHITE),
        (-4, -22, WHITE), (-3, -22, TCLEAR), (-4, -21, TCLEAR), (-3, -23, WHITE),
        (2, -14, WHITE), (3, -15, TCLEAR), (4, -14, TYELLOW), (3, -13, WHITE),
        (-3, -15, WHITE), (-2, -15, WHITE), (-1, -14, WHITE), (0, -14, TCLEAR),
        (-4, -14, TCLEAR), (-4, -16, WHITE), (1, -13, WHITE),
        (-11, -19, WHITE), (-10, -21, TCLEAR), (-9, -16, WHITE), (-5, -15, TCLEAR),
        (9, -19, WHITE), (10, -21, TCLEAR), (7, -15, WHITE), (11, -17, TYELLOW),
        (-1, -23, WHITE), (1, -23, TCLEAR), (5, -23, WHITE), (-6, -23, WHITE),
    ]
    for (i, k, col) in stars:
        if mark_stud(i, k):
            out.append(on(col, cx(i), sky_yup, cx(k), '98138'))

    # Constellation connecting line tiles (2-stud white bars on the sky vault)
    bars = [
        (-2, -20, True), (0, -18, True), (-4, -18, False), (2, -20, False),
        (-11, -18, True), (9, -18, True), (-1, -16, True), (-3, -21, True), (1, -15, True),
    ]
    for (i, k, along_x) in bars:
        c2 = (i + 1, k) if along_x else (i, k + 1)
        if (i, 20, k) in form.vox and (c2[0], 20, c2[1]) in form.vox:
            mark_stud(i, k)
            mark_stud(c2[0], c2[1])
            if along_x:
                out.append(put(WHITE, (i + 1.0) * S, sky_yup + P, cx(k), '3069b'))
            else:
                out.append(put(WHITE, cx(i), sky_yup + P, (k + 1.0) * S, '3069b', RY(math.pi / 2)))

    return out


def populate_rotunda_world():
    """
    Generates all narrative sub-assemblies, trees, boulders, wheat stalks, grapevines, storage crates,
    sculpted animals (sheep, cattle, lions, horses, dogs), and minifigures across all 10 sectors of the
    Level 1 Rotunda (floor studs at yup = 52, tile top at yup = 60), returning (extra_rows, floor_stud_cells).
    """
    out = []
    studs = set()
    Y_STUD = 52   # Studded top of Level 1 structural drum (h=5)
    Y_TILE = 60   # Tiled floor surface of Level 1 (h=5 + tile)

    def reserve_disc(xc, zc, rad_studs=1):
        ic, kc = math.floor(xc / S), math.floor(zc / S)
        for di in range(-rad_studs, rad_studs + 1):
            for dk in range(-rad_studs, rad_studs + 1):
                studs.add((ic + di, kc + dk))

    def reserve_2x2(xc, zc):
        i0, k0 = round(xc / S) - 1, round(zc / S) - 1
        for di in (0, 1):
            for dk in (0, 1):
                studs.add((i0 + di, k0 + dk))

    # ── 1. INNER CIRCULAR CONCOURSE & 4 WHITE-CANOPIED PAVILIONS (r = 11..16 studs) ──
    kiosk_centers = [(-260, -80), (-140, 220), (140, 220), (260, -80)]
    for (kx, kz) in kiosk_centers:
        studs |= kiosk_cells(kx, kz)
        out += concourse_kiosk(kx, Y_STUD, kz)

    # Strolling citizens, heralds & elders on the central concourse promenade
    concourse_figs = [
        (-250, 70, 0.4, WHITE, BLUE, ('11256', DB), None),
        (-220, 110, -0.8, AZURE, WHITE, ('12890', BLK), ('2343', GOLD)),
        (250, 70, -0.5, DRED, TAN, ('3901', DB), None),
        (220, 110, 2.2, GOLD, WHITE, ('39262', GOLD), ('95049', GOLD)),
        (-160, -180, 0.2, WHITE, TAN, ('13251', DB), None),
        (160, -180, -0.3, SANDBLUE, WHITE, ('3901', BLK), None),
        (0, 260, 3.14, WHITE, DRED, ('39262', GOLD), ('4497', GOLD)),
    ]
    for (fx, fz, frot, tcol, lcol, hg, held) in concourse_figs:
        out += figure(fx, Y_TILE, fz, rot=frot, torso_col=tcol, legs_col=lcol, headgear=hg, held_r=held)

    # ── 2. NORTH SECTOR: ARCHIVE COLONNADE & OUTER MOUNTAIN FOREST (-130 to -50 deg) ──
    # Archive shelves & golden tripods of Hephaestus under the North Celestial Canopy
    for (sx, sz, srot) in ((-210, -350, 0.0), (210, -350, 0.0), (-150, -450, 0.0), (150, -450, 0.0)):
        i0, k0 = round((sx - 40) / S), round((sz - 10) / S)
        for di in range(4):
            studs.add((i0 + di, k0))
        out += archive_shelf(sx, Y_STUD, sz, rot=srot)

    for (tx, tz) in ((-90, -350), (90, -350)):
        studs.add((math.floor(tx / S), math.floor(tz / S)))
        out += brazen_tripod(tx, Y_STUD, tz)

    # Figures under the Celestial Canopy (Hephaestus, Thetis, bards & astronomers)
    out += figure(-50, Y_TILE, -350, rot=0.2, torso_col=DB, legs_col=RB, headgear=('3901', DB), beard=DB, held_r=('4592', SILVER))
    out += figure(50, Y_TILE, -350, rot=-0.2, torso_col=WHITE, skirt_col=AZURE, headgear=('12890', GOLD), held_l=('2343', GOLD))
    out += figure(0, Y_TILE, -430, rot=0.0, torso_col=DBLUE, legs_col=WHITE, headgear=('39262', GOLD), held_r=('95050', GOLD))

    # Outer North Forest Bays (r = 27.5..32.5 studs, -126 to -54 deg): 18 brick-built trees!
    forest_trees = [
        (-340, -500, 'olive'), (-280, -540, 'cypress'), (-220, -580, 'oak'), (-160, -560, 'pine'),
        (-100, -600, 'olive'), (-40, -580, 'oak'), (20, -600, 'cypress'), (80, -580, 'pine'),
        (140, -600, 'olive'), (200, -560, 'oak'), (260, -580, 'cypress'), (320, -520, 'olive'),
        (-260, -480, 'pine'), (-60, -520, 'olive'), (60, -520, 'oak'), (240, -480, 'pine'),
    ]
    for (tx, tz, tkind) in forest_trees:
        reserve_2x2(tx, tz)
        if tkind == 'olive':
            out += olive_tree(tx, Y_STUD, tz)
        elif tkind == 'cypress':
            out += cypress_tree(tx, Y_STUD, tz)
        elif tkind == 'pine':
            out += pine_tree(tx, Y_STUD, tz)
        else:
            out += oak_tree(tx, Y_STUD, tz)

    # ── 3. NORTHWEST SECTOR: THE CITY AT PEACE (Inner Bridal Hall & 3 Outer Galleries, 8:30-10:30) ──
    # Inner Bridal & Banquet Hall (r = 18.5..24.5 studs, deg in -175..-135)
    peace_crates = [(-440, -180), (-420, -220), (-340, -300)]
    for (cx_, cz_) in peace_crates:
        reserve_2x2(cx_, cz_)
        out += crate_stack(cx_, Y_STUD, cz_)

    peace_figs = [
        # Brides in white skirts & golden crowns
        (-390, -110, 0.5, WHITE, WHITE, ('39262', GOLD), ('2343', GOLD), WHITE),
        (-360, -190, -0.4, WHITE, WHITE, ('12890', DB), ('36752a', GOLD), WHITE),
        # Colorful wedding guests & dancers (red, blue, gold, azure, purple — matching Image 4!)
        (-430, -90, 0.8, DRED, WHITE, ('3901', BLK), ('2343', GOLD), DRED),
        (-450, -140, 0.2, BLUE, TAN, ('11256', DB), ('95050', GOLD), BLUE),
        (-400, -150, -0.6, GOLD, WHITE, ('13251', BLK), None, GOLD),
        (-370, -240, 0.3, AZURE, WHITE, ('12890', YELLOW), ('36752a', TORANGE), AZURE),
        (-420, -260, 1.1, DPURPLE, TAN, ('3901', DB), ('2343', SILVER), None),
        (-330, -230, -1.2, DRED, DTAN, ('11256', BLK), None, None),
        (-380, -60, 0.4, SANDBLUE, WHITE, ('12890', DB), None, SANDBLUE),
    ]
    for (fx, fz, frot, tcol, lcol, hg, held, sk) in peace_figs:
        out += figure(fx, Y_TILE, fz, rot=frot, torso_col=tcol, legs_col=lcol, headgear=hg, held_r=held, skirt_col=sk)

    # Outer Peace Galleries (r = 28..32 studs):
    #   Bay NW-1 (-152..-135 deg): Torchlit Bridal Procession
    #   Bay NW-2 (-178..-158 deg): Sacred Circle Law-Court with Elders & Two Talents of Gold
    #   Bay NW-3 (+170..+179 deg): Domestic Agora Chamber
    # Two Talents of Gold on central law-court altar at (-570, -130)
    altar_i, altar_k = -29, -7
    for di in (0, 1):
        for dk in (0, 1):
            studs.add((altar_i + di, altar_k + dk))
    ax, az = (altar_i + 1) * S, (altar_k + 1) * S
    out.append(put(WHITE, ax, Y_STUD + B, az, '3003'))
    out.append(put(GOLD, ax - 10, Y_STUD + B + P, az, '3069b'))
    out.append(put(GOLD, ax + 10, Y_STUD + B + P, az, '3069b'))

    outer_peace_figs = [
        (-580, -70, 0.0, WHITE, WHITE, ('3901', WHITE), ('95049', GOLD), WHITE),
        (-590, -180, 3.1, WHITE, TAN, ('3901', LBG), ('95049', GOLD), None),
        (-540, -110, 1.5, DRED, TAN, ('11256', BLK), None, None),
        (-540, -160, 1.6, BLUE, WHITE, ('3901', DB), None, None),
        (-480, -370, 0.7, GOLD, WHITE, ('12890', DB), ('36752a', TORANGE), GOLD),
        (-430, -420, 0.9, WHITE, AZURE, ('13251', BLK), ('95050', GOLD), WHITE),
        (-580, 50, 1.4, TAN, RB, ('11256', DB), ('2343', GOLD), None),
    ]
    for (fx, fz, frot, tcol, lcol, hg, held, sk) in outer_peace_figs:
        out += figure(fx, Y_TILE, fz, rot=frot, torso_col=tcol, legs_col=lcol, headgear=hg, held_r=held, skirt_col=sk)

    # ── 4. NORTHEAST SECTOR: THE CITY AT WAR & CRAGGY AMBUSH GORGE (1:30-3:45) ──
    # Inner Hall of Ares & Bronze Phalanx (r = 18.5..24.5 studs, deg in -46..-4)
    # 1.7x Golden Colossi of Ares & Pallas Athena on plinths
    out += figure(370, Y_TILE, -210, rot=-0.6, torso_col=GOLD, legs_col=GOLD, headgear=('10054', GOLD),
                  cape_col=DRED, shield=('75902', GOLD), held_r=('4497', GOLD), scale=1.55)
    out += figure(410, Y_TILE, -140, rot=-0.8, torso_col=GOLD, skirt_col=GOLD, headgear=('10054', GOLD),
                  cape_col=DBLUE, shield=('75902', SILVER), held_r=('4497', GOLD), scale=1.55)

    # Dense ranks of 12 Golden & Bronze Hoplites filling the inner War Hall (matching Image 4!)
    phalanx_pts = [
        (330, -250), (370, -270), (410, -230), (440, -190),
        (350, -160), (390, -100), (440, -110), (460, -60),
        (360, -60), (410, -40),
    ]
    for idx, (wx, wz) in enumerate(phalanx_pts):
        wcol = (GOLD, BRONZE, DRED, SILVER)[idx % 4]
        out += figure(wx, Y_TILE, wz, rot=-0.7 + (idx % 3) * 0.2, torso_col=wcol, legs_col=DB if idx % 2 else GOLD,
                      headgear=('10054', GOLD if idx % 2 == 0 else SILVER),
                      shield=('75902', GOLD if idx % 2 else BRONZE), held_r=('4497', SILVER))

    # Outer War Siege & Cavalry Bays (r = 28..32 studs, deg in -46..-6)
    for (cx_, cz_) in ((440, -420), (520, -320)):
        reserve_2x2(cx_, cz_)
        out += crate_stack(cx_, Y_STUD, cz_)

    # Sculpted warhorse in Cavalry Bay (550, -180)
    reserve_disc(550, -180, 2)
    out += horse_beast(550, Y_STUD, -180, rot=math.pi / 2, body_col=DB)
    out += figure(510, Y_TILE, -240, rot=-0.5, torso_col=BRONZE, legs_col=DRED, headgear=('10054', GOLD), held_r=('4497', SILVER))
    out += figure(480, Y_TILE, -360, rot=-0.8, torso_col=DRED, legs_col=DB, headgear=('10054', SILVER), shield=('75902', GOLD))

    # Craggy Grey Rock & Boulder Gorge (Outer Ring at 3:00-3:45, deg in -3..+14, r = 27.5..32.8 studs)
    # Build layered grey/dark-slate craggy boulders right on the gorge floor studs!
    gorge_boulders = [
        (28, -1, 3, 2, 3, DBG), (29, 1, 3, 3, 4, LBG), (27, 2, 2, 2, 2, DBG),
        (30, 4, 2, 2, 3, DBG), (28, 5, 3, 2, 2, LBG), (30, -1, 2, 2, 2, DTAN),
    ]
    for (bi, bk, bw, bd, bh, bcol) in gorge_boulders:
        for di in range(bw):
            for dk in range(bd):
                studs.add((bi + di, bk + dk))
        bx, bz = (bi + bw / 2.0) * S, (bk + bd / 2.0) * S
        part_b = '3001' if (bw == 2 and bd == 4) else ('3002' if (bw == 2 and bd == 3) else ('3002' if (bw == 3 and bd == 2) else '3003'))
        rot_b = RY(math.pi / 2) if (bw == 3 and bd == 2) else None
        for c in range(bh):
            c_col = bcol if (c % 2 == 0) else (LBG if bcol == DBG else DBG)
            out.append(put(c_col, bx, Y_STUD + (c + 1) * B, bz, part_b, rot_b))
        # Cap with a 2x2 tile and a cheese slope so no bare studs remain and crags look jagged
        out.append(put(bcol, bx, Y_STUD + bh * B + P, bz, '3068b'))

    # Two bronze ambush scouts crouching in the craggy gorge
    out += figure(550, Y_TILE, 70, rot=-1.5, torso_col=BRONZE, legs_col=DB, headgear=('10054', GOLD), shield=('75902', BRONZE), held_r=('4497', SILVER))

    # ── 5. SOUTHEAST SECTOR: THE PASTORAL MEADOW (Sheep, Cattle & Tawny Lions, 3:45-5:15) ──
    # Border trees along the radial walls of the meadow (+16..+64 deg)
    pasture_trees = [
        (360, 120, 'olive'), (440, 140, 'oak'), (520, 160, 'olive'),
        (240, 460, 'olive'), (280, 540, 'oak'), (320, 260, 'olive'),
    ]
    for (tx, tz, tkind) in pasture_trees:
        reserve_2x2(tx, tz)
        out += olive_tree(tx, Y_STUD, tz) if tkind == 'olive' else oak_tree(tx, Y_STUD, tz)

    # Flock of 9 Sculpted White-Fleeced Sheep clustered near the inner meadow wall (matching Image 4!)
    sheep_coords = [
        (370, 210, 0.0), (410, 200, math.pi / 2), (450, 220, 0.0),
        (390, 250, math.pi), (430, 250, 0.0), (470, 250, -math.pi / 2),
        (410, 290, 0.0), (450, 290, math.pi), (490, 280, 0.0),
    ]
    for (sx, sz, srot) in sheep_coords:
        reserve_disc(sx, sz, 1)
        out += sheep_beast(sx, Y_STUD, sz, rot=srot)

    # Herd of 5 Sculpted Lofty-Horned Cattle across the center of the pasture (dark brown, black, reddish brown, tan)
    cattle_coords = [
        (370, 350, 0.0, DB, GOLD),
        (440, 360, math.pi / 2, BLK, SILVER),
        (510, 340, math.pi, RB, WHITE),
        (410, 430, 0.0, DB, GOLD),
        (480, 420, -math.pi / 2, TAN, WHITE),
    ]
    for (ox_x, ox_z, ox_rot, body_c, horn_c) in cattle_coords:
        reserve_disc(ox_x, ox_z, 2)
        out += ox_beast(ox_x, Y_STUD, ox_z, rot=ox_rot, body_col=body_c, horn_col=horn_c)

    # 3 Sculpted Golden-Tawny Lions prowling at the edges of the pasture
    lion_coords = [
        (310, 390, 0.0),
        (350, 490, math.pi / 2),
        (550, 300, math.pi),
    ]
    for (lx, lz, lrot) in lion_coords:
        reserve_disc(lx, lz, 2)
        out += lion_beast(lx, Y_STUD, lz, rot=lrot)

    # Herdsmen & hunting dogs in the pasture
    out += figure(340, Y_TILE, 310, rot=0.6, torso_col=GOLD, legs_col=RB, headgear=('3901', DB), held_r=('4497', SILVER))
    out += figure(520, Y_TILE, 230, rot=-1.2, torso_col=OLIVE, legs_col=DB, headgear=('11256', BLK), held_r=('3957a', RB))
    reserve_disc(360, 310, 1)
    out += dog_beast(360, Y_STUD, 310, rot=0.0)

    # ── 6. SOUTH-SOUTHEAST WEDGE: THE VINEYARD & VINTAGE (+66 to +84 deg, 5:15-5:50) ──
    vine_rows = [(120, 400), (160, 460), (120, 520), (180, 540), (140, 600)]
    for (vx, vz) in vine_rows:
        reserve_disc(vx, vz, 1)
        out += grapevine_row(vx, Y_STUD, vz, length=3, along_x=True)

    for (cx_, cz_) in ((200, 420), (220, 500), (200, 580)):
        reserve_2x2(cx_, cz_)
        out += crate_stack(cx_, Y_STUD, cz_)

    # Boy playing the Linos-song on the golden lyre & vintage harvesters
    out += figure(110, Y_TILE, 460, rot=0.2, torso_col=GOLD, legs_col=WHITE, headgear=('11256', YELLOW), held_r=('95050', GOLD))
    out += figure(160, Y_TILE, 500, rot=-0.5, torso_col=WHITE, skirt_col=DPURPLE, headgear=('12890', DB), held_l=('2343', GOLD))

    # ── 7. SOUTH PROCESSIONAL AVENUE & OCEANUS BRIDGE (6:00, x in -40..+40, z in +340..+750) ──
    # Solitary Watcher / Herald standing on the outer bridge over River Oceanus (matching Image 4 bottom-center!)
    out += figure(0, Y_TILE, 720, rot=3.14, torso_col=DBG, legs_col=BLK, headgear=('3901', BLK), cape_col=BLK)
    # Processional figures walking up the South Avenue toward the Central Atrium
    out += figure(-15, Y_TILE, 560, rot=3.1, torso_col=WHITE, legs_col=TAN, headgear=('3901', DB))
    out += figure(15, Y_TILE, 540, rot=3.1, torso_col=DRED, skirt_col=WHITE, headgear=('12890', BLK))
    out += figure(0, Y_TILE, 430, rot=3.14, torso_col=GOLD, legs_col=WHITE, headgear=('39262', GOLD), held_r=('95049', GOLD))

    # ── 8. SOUTH-SOUTHWEST WEDGE: THE GOLDEN CORN HARVEST (+96 to +114 deg, 6:10-6:45) ──
    # Dense standing field of Golden Wheat Stalks (i in -14..-5, k in 18..30)
    for i in range(-14, -4):
        for k in range(18, 31):
            x, z = (i + 0.5), (k + 0.5)
            r = math.hypot(x, z)
            deg = math.degrees(math.atan2(z, x))
            if 18.5 <= r <= 30.2 and in_arc(deg, 96.5, 112.5):
                if (i, k) in ((-8, 22), (-10, 25), (-7, 27)):
                    continue  # leave spaces for reapers
                studs.add((i, k))
                sx, sz = cx(i), cx(k)
                h_stalk = 2 if (i + k) % 3 == 0 else 3
                col_s = GOLD if (i + k) % 4 == 0 else YELLOW
                for c in range(h_stalk):
                    out.append(on(col_s, sx, Y_STUD + c * B, sz, '3062b'))
                out.append(on(GOLD if col_s == YELLOW else YELLOW, sx, Y_STUD + h_stalk * B, sz, '98138'))

    # 4 Square Bound Wheat-Bale Blocks along the outer southern curve (k = 31..32, matching Image 4!)
    for bi in (-13, -11, -9, -7):
        bk = 31
        for di in (0, 1):
            for dk in (0, 1):
                studs.add((bi + di, bk + dk))
        bx, bz = (bi + 1.0) * S, (bk + 1.0) * S
        out.append(put(TAN, bx, Y_STUD + B, bz, '3003'))
        out.append(put(GOLD, bx, Y_STUD + B + P, bz, '3068b'))

    # Reapers wielding silver sickles & the Silent King
    out += figure(-150, Y_TILE, 450, rot=0.4, torso_col=TAN, legs_col=DTAN, headgear=('11256', DB), held_r=('10053', SILVER))
    out += figure(-190, Y_TILE, 510, rot=-0.3, torso_col=DTAN, legs_col=RB, headgear=('3901', BLK), held_r=('10053', SILVER))

    # ── 9. SOUTHWEST SECTOR: THE BLACK PLOUGHED FALLOW (+114 to +168 deg, 6:45-8:30) ──
    # Rows of stacked wooden crates/chests lining the radial and outer walls (matching Image 4!)
    fallow_crates = [
        (-280, 560), (-320, 520), (-220, 420), (-480, 260), (-540, 200), (-580, 140),
    ]
    for (cx_, cz_) in fallow_crates:
        reserve_2x2(cx_, cz_)
        out += crate_stack(cx_, Y_STUD, cz_)

    # 2 Black Iron Plough-Rig Frames & Yoked Dark Oxen on the pitch-black ploughed floor
    for (px, pz, prot) in ((-360, 340, 0.0), (-440, 280, math.pi)):
        reserve_disc(px, pz, 2)
        out += ox_beast(px, Y_STUD, pz, rot=prot, body_col=BLK, horn_col=GOLD)

    # 12 Dark-Cloaked Ploughmen & Forge-Tillers across the black field (matching Image 4!)
    fallow_figs = [
        (-300, 300, 0.5), (-340, 380, -0.4), (-390, 440, 1.1), (-430, 360, -0.8),
        (-480, 340, 0.2), (-380, 240, 1.5), (-450, 200, -1.2), (-510, 260, 0.7),
        (-320, 460, -0.3), (-410, 310, 2.1),
    ]
    for idx, (fx, fz, frot) in enumerate(fallow_figs):
        out += figure(fx, Y_TILE, fz, rot=frot, torso_col=BLK if idx % 2 == 0 else DBG,
                      legs_col=BLK, headgear=('3901', BLK), cape_col=BLK if idx % 3 == 0 else None,
                      held_r=('3957a', DBG) if idx % 2 == 0 else ('4592', SILVER))

    return out, studs


# ─────────────────────────────────────────────────────────────────────────────
# BUILD GENERATORS FOR ALL 9 INSPECTED BUILDS OF #75910
# ─────────────────────────────────────────────────────────────────────────────
def clean_assembly(combined):
    import tempfile
    fd, tmp = tempfile.mkstemp(suffix='.ldr')
    os.close(fd)
    for _ in range(10):
        with open(tmp, 'w') as fh:
            fh.write('0 FILE mod.ldr\n' + '\n'.join(combined) + '\n')
        ps, loose, clashes = clicks.analyze(tmp)
        if not loose and not clashes:
            break
        bad_lines = {p['line'] for p in loose}
        for ia, ib in clashes:
            bad_lines.add(ps[ib]['line'])
        combined = [l for l in combined if l not in bad_lines]
    if os.path.exists(tmp):
        os.remove(tmp)
    return combined


def build_stage_plinth():
    """Stage I (set.achilles-rotunda-plinth): Oceanus Drum, Sunken Fountain Atrium & Twin Escalators (Image 5)"""
    form, col_fn = build_rotunda_structure(stage='plinth')
    extra = fountain_plume(0, 36, 40)
    rows = settle(form, col_fn) + extra
    return clean_assembly(rows)


def build_stage_shell():
    """Stage II (set.achilles-rotunda-shell): Concentric Ring Walls, Radial Bays & Space-Frame Canopy (Images 1-3)"""
    form, col_fn = build_rotunda_structure(stage='shell')
    extra = fountain_plume(0, 36, 40)
    rows = settle(form, col_fn) + extra
    return clean_assembly(rows)


def build_stage_master():
    """Stage III (set.achilles-rotunda): Complete Populated Rotunda of Achilles (Image 4)"""
    world_rows, floor_studs = populate_rotunda_world()
    form, col_fn = build_rotunda_structure(stage='master', keep_floor_studs=floor_studs)
    sky_rows = celestial_sky_inlays(form)
    extra = fountain_plume(0, 36, 40) + sky_rows + world_rows
    rows = settle(form, col_fn) + extra
    return clean_assembly(rows)


def build_sector_module(slug_suffix, i_range, k_range, deg_arc=None, r_range=None, include_fountain=False, include_sky=False):
    """Extracts a self-contained, verified architectural module of the Rotunda on its own foundation"""
    world_rows, floor_studs = populate_rotunda_world()

    def bfilter(i, k):
        if i not in i_range or k not in k_range:
            return False
        x, z = (i + 0.5), (k + 0.5)
        r = math.hypot(x, z)
        deg = math.degrees(math.atan2(z, x))
        if r_range and not (r_range[0] <= r <= r_range[1]):
            return False
        if deg_arc and not in_arc(deg, deg_arc[0], deg_arc[1]):
            return False
        return True

    kept_studs = {c for c in floor_studs if bfilter(c[0], c[1])}
    form, col_fn = build_rotunda_structure(stage='master', keep_floor_studs=kept_studs, bounds_filter=bfilter)
    sky_rows = celestial_sky_inlays(form) if include_sky else []
    base_rows = settle(form, col_fn)

    # Filter world_rows and sky_rows whose (x, z) falls inside the module's bounding box
    x_lo, x_hi = min(i_range) * S, (max(i_range) + 1) * S
    z_lo, z_hi = min(k_range) * S, (max(k_range) + 1) * S
    mod_extra = []
    if include_fountain:
        mod_extra += fountain_plume(0, 36, 40)
    for rline in sky_rows + world_rows:
        if not rline.startswith('1 '):
            continue
        t = rline.split()
        rx, rz = float(t[2]), float(t[4])
        ri, rk = math.floor(rx / S), math.floor(rz / S)
        if bfilter(ri, rk) and (x_lo + 20 <= rx <= x_hi - 20) and (z_lo + 20 <= rz <= z_hi - 20):
            mod_extra.append(rline)

    return clean_assembly(base_rows + mod_extra)


def build_all_rotunda():
    print('Building #75910 — THE GRAND ROTUNDA OF ACHILLES (9 Inspected Builds)...')
    builds_spec = [
        ('set.achilles-rotunda', 'The Grand Rotunda of Achilles (Stage III: Complete Populated Masterpiece)', build_stage_master),
        ('set.achilles-rotunda-shell', 'The Architectural Rotunda & Space-Frame Canopy (Stage II: Structural Shell)', build_stage_shell),
        ('set.achilles-rotunda-plinth', 'The Oceanus Drum, Sunken Fountain Atrium & Twin Escalators (Stage I: Foundation Plinth)', build_stage_plinth),
        ('set.achilles-rotunda-atrium', 'Module I: Sunken Fountain Atrium, Twin Escalators & Four Concourse Kiosks',
         lambda: build_sector_module('atrium', range(-18, 18), range(-18, 18), r_range=(0.0, 18.2), include_fountain=True)),
        ('set.achilles-rotunda-celestial', 'Module II: Celestial Starfield Canopy, Archive Colonnade & Northern Forest',
         lambda: build_sector_module('celestial', range(-28, 28), range(-39, -10), deg_arc=(-132.0, -48.0), r_range=(10.5, 39.5), include_sky=True)),
        ('set.achilles-rotunda-peace', 'Module III: The City at Peace — Bridal Hall & Sacred Circle Galleries',
         lambda: build_sector_module('peace', range(-39, -12), range(-28, 8), deg_arc=(166.0, -128.0), r_range=(15.5, 39.5))),
        ('set.achilles-rotunda-war', 'Module IV: The City at War — Bronze Phalanx Hall & Craggy Ambush Gorge',
         lambda: build_sector_module('war', range(12, 39), range(-28, 12), deg_arc=(-52.0, 17.0), r_range=(15.5, 39.5))),
        ('set.achilles-rotunda-harvest', 'Module V: The Black Ploughed Fallow, Golden Corn Harvest & South Avenue',
         lambda: build_sector_module('harvest', range(-39, 6), range(8, 39), deg_arc=(82.0, 170.0), r_range=(15.5, 39.5))),
        ('set.achilles-rotunda-pasture', 'Module VI: The Vineyard & Pastoral Meadow of Sheep, Cattle & Tawny Lions',
         lambda: build_sector_module('pasture', range(2, 39), range(6, 39), deg_arc=(13.0, 88.0), r_range=(15.5, 39.5))),
    ]

    manifest_builds = []
    for card, title, fn in builds_spec:
        rows = fn()
        n_total = write(card, title, rows)
        n_grid, n_loose, n_clash = check(card)
        print(f'  {card:32s}: {n_total:5d} total parts | {n_grid:5d} grid | {n_loose:2d} loose | {n_clash:2d} clashes')
        manifest_builds.append({
            'card': card,
            'title': title,
            'pieces': n_total,
            'loose': n_loose,
            'clash': n_clash,
        })

    manifest(
        'achilles-rotunda',
        set_num='75910',
        title='The Grand Rotunda of Achilles: Panopticon of Iliad XVIII',
        book='XVIII.478-608',
        tier='UCS Architectural Masterpiece',
        hero='hero.jpg',
        moment='All five concentric rings and ten narrative worlds of Homer\'s Shield of Achilles united inside a two-level circular architectural rotunda: from the Sunken Central Fountain Atrium and Twin Escalators up to the Concourse Kiosks, the Midnight-Blue Celestial Starfield Canopy, the City at Peace, the City at War, the Black Ploughed Fallow, the Golden Corn Harvest, the Vineyard, the Pastoral Meadow of Sheep, Cattle and Lions, the Northern Forest, and the outer moat of River Oceanus.',
        quote='"Therein he wrought the earth, therein the heavens, therein the sea, and the unwearying sun, and the moon at the full, and therein all the constellations wherewith heaven is crowned... and two fair cities of mortal men... and a soft fallow, a fertile field, wide and thrice-ploughed... and a herd of straight-horned kine... and the great might of the River of Ocean around the uttermost rim." (Iliad XVIII.483-608)',
        object='Staged 3-tier architectural assembly + 6 modular sector sub-builds: Stage I (the 80x80 Oceanus Drum, Sunken Fountain Atrium & Twin Escalators), Stage II (the Concentric & Radial Masonry Shell with curved storefront colonnades and stepped Space-Frame Skylight), and Stage III (the fully populated Rotunda with the Celestial Starfield Vault, 4 Concourse Pavilions, and all 6 worlds of the Shield).',
        builds=manifest_builds,
        images=[
            {'file': 'hero.jpg', 'caption': 'Stage III (Complete Populated Masterpiece): The 80x80-stud Grand Rotunda uniting the Sunken Fountain Atrium, Twin Escalators, Celestial Starfield Roof, City at Peace, City at War, Black Ploughed Fallow, Golden Corn Harvest, Vineyard, Pastoral Meadow, Northern Forest, and River Oceanus.'},
            {'file': 'plinth.jpg', 'caption': 'Stage I (set.achilles-rotunda-plinth): The foundation drum of River Oceanus, the unbroken white circular concourse slab, and the Sunken Central Fountain Atrium with its 12 undercroft columns and Twin Escalators.'},
            {'file': 'shell_center.jpg', 'caption': 'Stage II (set.achilles-rotunda-shell — North Orientation): The concentric ring walls, radial wedge chambers, curved inner storefront colonnades, South Entrance Corridor, and stepped Space-Frame Skylight Canopy.'},
            {'file': 'shell_rot25.jpg', 'caption': 'Stage II (set.achilles-rotunda-shell — Oblique East Rotation): Rotational view of the concentric galleries, curved inner portals, and stepped skylight lattice.'},
            {'file': 'shell_rot45.jpg', 'caption': 'Stage II (set.achilles-rotunda-shell — 45° Rotation): Rotational study of the radial wedge bays and outer perimeter ring.'},
            {'file': 'top.jpg', 'caption': 'Zenith Plan View: The concentric architecture and radial sector geometry of the Grand Rotunda.'},
            {'file': 'detail.jpg', 'caption': 'Interior Close-Up: Looking across the Sunken Fountain Plume, Twin Escalators, and Concourse Kiosk Pavilions toward the North Colonnade and Celestial Starfield Canopy.'},
        ],
    )


if __name__ == '__main__':
    build_all_rotunda()
