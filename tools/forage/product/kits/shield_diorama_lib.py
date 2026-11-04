#!/usr/bin/env python3
"""tools/forage/product/kits/shield_diorama_lib.py — Shared Architectural, Botanical, Plinth & Creature Library
for the Standalone Rectangular Collector's Diorama Kits of Homer's Shield of Achilles (Iliad XVIII.478-608).

Implements the exact Mediterranean Collector's Diorama design language of the five reference builds at monumental 48x32 scale:
1. Stepped Dark Blue (272) + Pearl Gold (297) Museum Plinth on a 2-layer cross-bonded plate foundation (100% one_piece=True).
2. Two-storey Mediterranean limestone/stucco houses in Tan (19), Dark Tan (28), and Light Bluish Grey (71) quoins with
   recessed doorways, doorway figures, climbing ivy with white blossoms, blue-draped second-storey balconies, and
   continuous pitched terracotta barrel-tile roofs in Dark Orange (484), Medium Nougat (84), and Reddish Brown (70).
3. Vernacular stone cottages (stathmoi) with benches and chimneys, open-fronted timber-post roofed sheep sheds (klisiai)
   with hay mangers, high-roofed cattle byres (koproi), roofed stone wine-press pavilions (lenoi), dry-stone perimeter walls
   with slatted wooden gates, classical Doric stoas, curved stepped stone exedras with sculpted Elder thrones, and
   the Golden-Columned Cliff Sanctuary of the Fates (Keres).
4. Paired Mediterranean botanicals from landscape.py (spreading gnarled Olive Trees, Great Oaks, Willows, slender Pencil
   Cypresses, river reed clumps, raised stone tree planters, wildflower meadows, and trellised grapevines).
5. Brick-built woolly white sheep with black heads and legs, brown goats, lofty-horned oxen, tawny lions, and hunting dogs.
"""
import math, os, random, sys
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from kitlib import *
import ldbox, clicks, wardrobe as W
import landscape as L

# Extra LDraw colours
SILVER  = 179   # Pearl Silver
TIN     = 80    # Metallic Silver
BRONZE  = 300   # Metallic Copper
KYANOS  = 272   # Dark Blue (Museum Plinth & Ocean/Trench)
BYELLOW = 226   # Bright Light Yellow (wheat / stars)

FLOOR = 16      # Top of the 2-layer cross-bonded Dark Blue foundation (yup=0..8, 8..16)
LAND  = 24      # Standard ground surface (1 plate + 1 tile above FLOOR=16, i.e., yup=32 finished, or yup=24 base)

PLATES_2X = [(8, '4282'), (6, '3795'), (4, '3034'), (3, '3021'), (2, '3022')]
PLATES_1X = [(8, '3460'), (6, '3666'), (4, '3710'), (3, '3623'), (2, '3023'), (1, '3024')]
TILES_RECT = [
    (4, 2, '87079', 0.0), (2, 4, '87079', math.pi * 0.5),
    (2, 2, '3068b', 0.0),
    (8, 1, '4162',  0.0), (1, 8, '4162',  math.pi * 0.5),
    (6, 1, '6636',  0.0), (1, 6, '6636',  math.pi * 0.5),
    (4, 1, '2431',  0.0), (1, 4, '2431',  math.pi * 0.5),
    (3, 1, '63864', 0.0), (1, 3, '63864', math.pi * 0.5),
    (2, 1, '3069b', 0.0), (1, 2, '3069b', math.pi * 0.5),
    (1, 1, '3070b', 0.0),
]

CURVE_ROT = {
    ( 1, -1): 0.0,
    (-1, -1): math.pi * 0.5,
    (-1,  1): math.pi,
    ( 1,  1): math.pi * 1.5,
}


def hsh(*a):
    v = 0x345678
    for x in a:
        v = ((v ^ (int(x) & 0xffffffff)) * 1000003) & 0xffffffff
        v ^= v >> 13
    return (v % 10007) / 10007


def place_box(col, i0, k0, yup, pid, rot=0.0):
    """Place any grid-aligned LDraw part so its rotated world box starts at cell (i0, k0) with its bottom at yup."""
    lo, hi = ldbox.box(pid, False)
    m = RY(rot)
    cs = [(m[3] * px + m[5] * pz, m[9] * px + m[11] * pz) for px in (lo[0], hi[0]) for pz in (lo[2], hi[2])]
    rx0, rz0 = min(c[0] for c in cs), min(c[1] for c in cs)
    return put(col, i0 * S - rx0, yup + hi[1], k0 * S - rz0, pid, m)


def put_curve_tile(col, i0, k0, yup, pid, sx, sz):
    """Place a curved macaroni tile (25269, 27925, 79393, 27507) with its convex arc facing quadrant (sx, sz)."""
    return place_box(col, i0, k0, yup, pid, CURVE_ROT[(sx, sz)])


def pack_plates(cells_col, yup, axis='x'):
    """Pack {(i, k): col} at `yup` with plates oriented predominantly along `axis` ('x' or 'z') for cross-bonding."""
    rows = []
    rem = dict(cells_col)
    if axis == 'x':
        shapes = [(8, 2), (6, 2), (4, 2), (3, 2), (2, 2), (8, 1), (6, 1), (4, 1), (3, 1), (2, 1), (1, 4), (1, 3), (1, 2), (1, 1)]
    else:
        shapes = [(2, 8), (2, 6), (2, 4), (2, 3), (2, 2), (1, 8), (1, 6), (1, 4), (1, 3), (1, 2), (4, 1), (3, 1), (2, 1), (1, 1)]
    for (k, i) in sorted((k, i) for (i, k) in list(rem)):
        if (i, k) not in rem:
            continue
        col = rem[(i, k)]
        for w, d in shapes:
            sub = [(i + di, k + dk) for di in range(w) for dk in range(d)]
            if all(c in rem and rem[c] == col for c in sub):
                for c in sub:
                    del rem[c]
                rows.append(L.block(col, 'plate', i, k, w, d, yup))
                break
    return rows


def pack_bricks(cells_col, yup, axis='x', masonry=True):
    """Pack {(i, k): col} at `yup` with full 24-LDU LEGO bricks, using embossed profile masonry bricks
    (`98283` 1x2 and `15533` 1x4) when `masonry=True` so walls have tactile 3D ashlar mortar courses."""
    rows = []
    rem = dict(cells_col)
    if axis == 'x':
        shapes = [(4, 1), (3, 1), (2, 1), (1, 4), (1, 3), (1, 2), (2, 2), (1, 1)]
    else:
        shapes = [(1, 4), (1, 3), (1, 2), (4, 1), (3, 1), (2, 1), (2, 2), (1, 1)]
    for (k, i) in sorted((k, i) for (i, k) in list(rem)):
        if (i, k) not in rem:
            continue
        col = rem[(i, k)]
        kind = 'stone' if (masonry and col in (TAN, DTAN, LBG, DBG, WHITE, DORANGE, MNOUGAT)) else 'brick'
        for w, d in shapes:
            sub = [(i + di, k + dk) for di in range(w) for dk in range(d)]
            if all(c in rem and rem[c] == col for c in sub):
                for c in sub:
                    del rem[c]
                rows.append(L.block(col, kind, i, k, w, d, yup))
                break
    return rows


def pack_tiles(cells_col, yup):
    """Pack {(i, k): col} at `yup` with rectangular tiles."""
    rows = []
    rem = dict(cells_col)
    for (k, i) in sorted((k, i) for (i, k) in list(rem)):
        if (i, k) not in rem:
            continue
        col = rem[(i, k)]
        for w, d, pid, rot in TILES_RECT:
            sub = [(i + di, k + dk) for di in range(w) for dk in range(d)]
            if all(c in rem and rem[c] == col for c in sub):
                for c in sub:
                    del rem[c]
                rows.append(put(col, (i + w * 0.5) * S, yup + P, (k + d * 0.5) * S, pid, RY(rot)))
                break
    return rows


def place_local(M_b, col, lx, h_up, lz, pid, lm=None):
    """Place part `pid` in local frame `M_b` so its bottom sits flush at `h_up` LDU above local origin."""
    b = ldbox.box(pid, False)
    hi_y = b[1][1] if b else 0.0
    m = T(lx, -(h_up + hi_y), lz)
    if lm:
        m = mat_mul(m, lm)
    return row(col, mat_mul(M_b, m), pid)


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# 1. THE MUSEUM PLINTH & MULTI-LEVEL GROUND CANVAS
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
class DioramaCanvas:
    """Manages a W x D rectangular diorama on a stepped Dark Blue (272) + Pearl Gold (297) Museum Plinth."""
    def __init__(self, W=48, D=32, seed=0):
        self.W = W
        self.D = D
        self.seed = seed
        self.i_min = -W // 2
        self.i_max = W // 2 - 1
        self.k_min = -D // 2
        self.k_max = D // 2 - 1
        # Interior playable area inside the 2-stud museum plinth border
        self.in_i0 = self.i_min + 2
        self.in_i1 = self.i_max - 2
        self.in_k0 = self.k_min + 2
        self.in_k1 = self.k_max - 2

        self.rows = []
        self.fig_rows = []
        self.free_rows = []   # angled creatures/props that rest on tiles/studs and act as fixed obstacles for settle()
        self.h_map = {}       # (i, k) -> height in plates above FLOOR=16 (default 2 -> finished surface at yup=32)
        self.t_map = {}       # (i, k) -> terrain code ('p', 'c', 't', 'm', 'e', 'r', 'w', 'd', 'f', 'b', 'g')
        self.custom_tiles = {}  # (i, k) -> already placed tile at surface (skip auto-tiling)
        self.keep_studs = set() # (i, k) -> leave top plate studded at surface height

        for i in range(self.in_i0, self.in_i1 + 1):
            for k in range(self.in_k0, self.in_k1 + 1):
                self.h_map[(i, k)] = 2
                self.t_map[(i, k)] = 'p'

        L.AVOID.clear()
        self._build_plinth()

    def _build_plinth(self):
        """Build the 2-layer cross-bonded Dark Blue (272) plate slab (yup=0..16) and the stepped Dark Blue + Pearl Gold border."""
        all_cells = {(i, k): KYANOS for i in range(self.i_min, self.i_max + 1) for k in range(self.k_min, self.k_max + 1)}
        # Layer 0 (yup=0..8): 2xN along X
        self.rows += pack_plates(all_cells, 0, axis='x')
        # Layer 1 (yup=8..16): 2xN along Z (cross-bonds entire W x D rectangle into 1 piece!)
        self.rows += pack_plates(all_cells, P, axis='z')

        # Outer 1-stud ring (i in {i_min, i_max} or k in {k_min, k_max}):
        # Dark Blue tiles at yup=16..24, with Pearl Gold corners and front nameplate
        outer_ring = {}
        for i in range(self.i_min, self.i_max + 1):
            for k in range(self.k_min, self.k_max + 1):
                if i in (self.i_min, self.i_max) or k in (self.k_min, self.k_max):
                    is_corner = (i in (self.i_min, self.i_min + 1, self.i_max - 1, self.i_max) and
                                 k in (self.k_min, self.k_min + 1, self.k_max - 1, self.k_max))
                    if is_corner:
                        outer_ring[(i, k)] = GOLD
                    elif k == self.k_max and -6 <= i <= 5:
                        outer_ring[(i, k)] = GOLD if i in (-6, 5) else BLK
                    else:
                        outer_ring[(i, k)] = KYANOS
        self.rows += pack_tiles(outer_ring, FLOOR)

        # Inner 1-stud ring (i in {i_min+1, i_max-1} or k in {k_min+1, k_max-1}):
        # Dark Blue plates at yup=16..24 topped by a continuous Pearl Gold tile fillet at yup=24..32
        # (with a Tan/Gold stepped entrance threshold at front center k == k_max-1, i in -3..2)
        inner_plates = {}
        inner_tiles = {}
        for i in range(self.i_min + 1, self.i_max):
            for k in range(self.k_min + 1, self.k_max):
                if i in (self.i_min + 1, self.i_max - 1) or k in (self.k_min + 1, self.k_max - 1):
                    inner_plates[(i, k)] = TAN if (k == self.k_max - 1 and -3 <= i <= 2) else KYANOS
                    inner_tiles[(i, k)] = TAN if (k == self.k_max - 1 and -2 <= i <= 1) else GOLD
        self.rows += pack_plates(inner_plates, FLOOR, axis='x')
        self.rows += pack_tiles(inner_tiles, FLOOR + P)

    def surf_y(self, i, k):
        """Return the finished top surface height `yup` at interior cell (i, k)."""
        return FLOOR + self.h_map.get((i, k), 2) * P

    def set_ground(self, i0, k0, w, d, t=None, h=None):
        for i in range(i0, i0 + w):
            for k in range(k0, k0 + d):
                if (i, k) in self.h_map:
                    if t is not None:
                        self.t_map[(i, k)] = t
                    if h is not None:
                        self.h_map[(i, k)] = h

    def reserve(self, i0, k0, w=1, d=1):
        """Mark cells (i0..i0+w-1, k0..k0+d-1) to keep their top plate studded at `surf_y`."""
        for i in range(i0, i0 + w):
            for k in range(k0, k0 + d):
                self.keep_studs.add((i, k))

    def _terrain_col(self, t, i, k):
        v = L.patch(i, k, self.seed + ord(t), 3 if t not in ('p', 'c') else 2)
        r = hsh(i, k, self.seed, 19)
        if t == 'p':   # Mediterranean limestone & ashlar courtyard
            return TAN if v < 0.48 else (LBG if v < 0.78 else DTAN)
        if t == 'c':   # Cobblestone street
            return LBG if v < 0.42 else (TAN if v < 0.72 else (DTAN if v < 0.90 else DBG))
        if t == 't':   # Olive & green pasture
            return OLIVE if v < 0.50 else (GREEN if v < 0.78 else (TAN if v < 0.92 else DGREEN))
        if t == 'm':   # Lush wildflower meadow
            return OLIVE if v < 0.45 else (SANDGREEN if v < 0.75 else (TAN if v < 0.90 else GREEN))
        if t == 'e':   # Beaten earth
            return DTAN if v < 0.55 else (TAN if v < 0.85 else RB)
        if t == 'r':   # Grey rock
            return LBG if v < 0.52 else (DBG if v < 0.88 else DTAN)
        if t == 'w':   # Sparkling river shallows
            return TLBLUE if r < 0.68 else (TCLEAR if r < 0.88 else TDBLUE)
        if t == 'd':   # Deep water
            return TDBLUE if r < 0.65 else TLBLUE
        if t == 'f':   # Whitewater foam
            return TCLEAR if r < 0.55 else WHITE
        if t == 'b':   # Thrice-ploughed black fallow with golden glints
            return BLK if (k % 2 == 0) else (DB if r < 0.82 else GOLD)
        if t == 'g':   # Golden harvest soil
            return DTAN if v < 0.60 else TAN
        return TAN

    def _under_col(self, t):
        if t in ('w', 'd', 'f'):
            return KYANOS
        if t == 'b':
            return BLK
        if t == 'r':
            return DBG
        if t in ('t', 'm'):
            return OLIVE
        return DTAN

    def finish_ground(self):
        """Pack the underlying plate layers and top surface tiles/plates across all interior cells."""
        max_h = max(self.h_map.values(), default=2)
        # 1. Underlying plate layers l = 0 .. h-2
        for l in range(max_h):
            layer_cells = {}
            for (i, k), h in self.h_map.items():
                t = self.t_map[(i, k)]
                if l < h - 1:
                    layer_cells[(i, k)] = self._under_col(t)
                elif l == h - 1 and (i, k) in self.keep_studs and (i, k) not in self.custom_tiles:
                    layer_cells[(i, k)] = self._terrain_col(t, i, k) if t not in ('w', 'd', 'f') else KYANOS
            if layer_cells:
                self.rows += pack_plates(layer_cells, FLOOR + l * P, axis=('x' if l % 2 == 0 else 'z'))

        # 2. Top surface finish at l = h-1 (for cells not in keep_studs and not in custom_tiles)
        by_y = defaultdict(dict)
        cobbles = []
        meadow_flowers = []
        for (i, k), h in sorted(self.h_map.items()):
            if (i, k) in self.keep_studs or (i, k) in self.custom_tiles:
                continue
            t = self.t_map[(i, k)]
            y_tile = FLOOR + (h - 1) * P
            col = self._terrain_col(t, i, k)
            r = hsh(i, k, self.seed, 31)
            # Occasional 1x1 round cobblestone / blossom on streets/courtyards/rivers
            if t == 'c' and r < 0.34:
                c2 = WHITE if r < 0.04 else ([LBG, TAN, DTAN, DBG][int(r * 40) % 4])
                cobbles.append(put(c2, (i + 0.5) * S, y_tile + P, (k + 0.5) * S, '98138'))
            elif t == 'f' and r < 0.55:
                cobbles.append(put(WHITE if r < 0.3 else TCLEAR, (i + 0.5) * S, y_tile + P, (k + 0.5) * S, '98138'))
            elif t == 'm' and r < 0.14:
                self.rows.append(L.block(OLIVE, 'plate', i, k, 1, 1, y_tile))
                fcol = [WHITE, YELLOW, RED, MLAV][int(r * 100) % 4]
                if int(r * 1000) % 2 == 0:
                    meadow_flowers.append(put(GREEN if int(r * 50) % 2 == 0 else OLIVE, (i + 0.5) * S, y_tile + P + 3.3, (k + 0.5) * S, '32607', RY(r * 5.1)))
                    meadow_flowers.append(put(fcol, (i + 0.5) * S, y_tile + P + 10.0, (k + 0.5) * S, '24866', RY(r * 6.3)))
                else:
                    meadow_flowers.append(put(fcol, (i + 0.5) * S, y_tile + P + 2.0, (k + 0.5) * S, '24866', RY(r * 6)))
            elif t == 't' and r < 0.08:
                self.rows.append(L.block(OLIVE, 'plate', i, k, 1, 1, y_tile))
                meadow_flowers.append(put(OLIVE if int(r * 50) % 2 == 0 else DGREEN, (i + 0.5) * S, y_tile + P + 3.3, (k + 0.5) * S, '32607', RY(r * 4.7)))
            else:
                by_y[y_tile][(i, k)] = col

        for y_tile, cells_col in sorted(by_y.items()):
            self.rows += pack_tiles(cells_col, y_tile)
        self.rows += cobbles + meadow_flowers

    def add_tree(self, kind, i0, k0, y_override=None, seed=None):
        """Plant a landscape.py tree (`olive`, `cypress`, `oak`, `willow`, `poplar`, `fig`, `pine`) on 2x2 cells at (i0, k0)."""
        s = self.seed + (seed if seed is not None else (i0 * 31 + k0 * 17))
        if y_override is None:
            h = self.h_map.get((i0, k0), 2)
            for di in (0, 1):
                for dk in (0, 1):
                    self.h_map[(i0 + di, k0 + dk)] = h
                    self.keep_studs.add((i0 + di, k0 + dk))
            y_surf = FLOOR + h * P
        else:
            y_surf = y_override
        L.avoid(self.rows)
        fn = mediterranean_cypress if kind == 'cypress' else getattr(L, kind)
        p = fn(i0 * S, k0 * S, y_surf, s)
        self.rows += p.rows
        L.avoid(p.rows)

    def add_reeds(self, i0, k0, w=3, d=2, seed=None):
        """Plant a clump of river reeds (landscape.reeds) on w x d cells at (i0, k0)."""
        s = self.seed + (seed if seed is not None else (i0 * 23 + k0 * 13))
        h = self.h_map.get((i0, k0), 2)
        for di in range(w):
            for dk in range(d):
                self.h_map[(i0 + di, k0 + dk)] = h
                self.keep_studs.add((i0 + di, k0 + dk))
        y_surf = FLOOR + h * P
        p = L.reeds(i0 * S, k0 * S, w, d, y_surf, s)
        self.rows += p.rows
        L.avoid(p.rows)

    def _clean_fig_rows(self, f_rows, contact=False, root=False):
        out = []
        for l in f_rows:
            if not l.startswith('1 '):
                out.append(l)
                continue
            t = l.split()
            pid = t[14].lower().replace('.dat', '')
            if pid in ('98138', '3024'):
                out.append('0 !FORAGE ROOT')
            if pid.startswith('3815') or pid in ('36036', '24068'):
                if root:
                    out.append('0 !FORAGE ROOT')
                if contact:
                    out.append('0 !FORAGE CONTACT')
            out.append(l)
        return out

    def add_fig(self, card, sub, i, k, rot=0.0, contact=False, **dress):
        """Place a grounded minifigure on cell (i, k) at `surf_y(i, k)` with its foot cells reserved studded."""
        y_surf = self.surf_y(i, k)
        for di in (-1, 0, 1):
            for dk in (-1, 0, 1):
                if abs(di) + abs(dk) <= 1 and (i + di, k + dk) in self.h_map:
                    if self.h_map[(i + di, k + dk)] == self.h_map[(i, k)]:
                        self.keep_studs.add((i + di, k + dk))
        x, z = (i + 0.5) * S, (k + 0.5) * S
        spec = {k.replace('held_r', 'held.r').replace('held_l', 'held.l'): v for k, v in dress.items()}
        if 'held.r' not in spec:
            spec['held.r'] = None
        if 'held.l' not in spec:
            spec['held.l'] = None
        f_rows = self._clean_fig_rows(W.dress(card, sub, spec, x, y_surf, z, rot), contact=contact)
        self.fig_rows += f_rows
        return f_rows

    def add_fig_at(self, card, sub, x, y_surf, z, rot=0.0, contact=False, root=False, **dress):
        """Place a minifigure at exact coordinates (x, y_surf, z) on an architectural surface (balcony, throne, cliff)."""
        spec = {k.replace('held_r', 'held.r').replace('held_l', 'held.l'): v for k, v in dress.items()}
        if 'held.r' not in spec:
            spec['held.r'] = None
        if 'held.l' not in spec:
            spec['held.l'] = None
        f_rows = self._clean_fig_rows(W.dress(card, sub, spec, x, y_surf, z, rot), contact=contact, root=root)
        self.fig_rows += f_rows
        return f_rows

    def finalize(self):
        """Finish ground, settle any off-grid foliage against fixed figures & creatures, and return all LDraw rows."""
        self.finish_ground()
        fixed_1 = [r for r in (self.fig_rows + self.free_rows) if r.startswith('1 ')]
        settled, _ = L.settle(self.rows, fixed=fixed_1)
        return settled + self.free_rows + self.fig_rows


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# 2. PITCHED TERRACOTTA BARREL-TILE ROOFS & MEDITERRANEAN ARCHITECTURE
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def pitched_terracotta_roof(i0, k0, w, d, y_eave, ridge_axis='x', chimney=False, seed=0):
    """Build a continuous pitched Mediterranean terracotta barrel-tile roof in Dark Orange (484), Medium Nougat (84),
    and Reddish Brown (70) over a Reddish Brown timber & stone eave deck at `y_eave`.
    Every slope course uses uniform 2-plate-high `54200` cheese slopes arranged in barrel-tile rib stripes so there
    are never 1-plate dips or exposed studs."""
    rows = []
    rib_cols = [DORANGE, MNOUGAT, DORANGE, RB, MNOUGAT, DORANGE]

    # 1. Solid 1-plate timber eave deck at y_eave..y_eave+8 spanning the short dimension
    deck = {(i, k): RB for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    rows += pack_plates(deck, y_eave, axis=('x' if w <= d else 'z'))
    y_cur = y_eave + P

    if ridge_axis == 'x':
        n_steps = (d + 1) // 2
        for s in range(n_steps):
            k_lo = k0 + s
            k_hi = k0 + d - 1 - s
            if k_lo < k_hi:
                inner = {}
                for i in range(i0, i0 + w):
                    for k in range(k_lo + 1, k_hi):
                        inner[(i, k)] = (LBG if s % 2 == 0 else TAN) if i in (i0, i0 + w - 1) else RB
                if inner:
                    rows += pack_plates(inner, y_cur, axis=('z' if s % 2 == 0 else 'x'))
                ch_i = i0 + w - 2 if (chimney and s == n_steps - 1) else None
                for i in range(i0, i0 + w):
                    c1 = rib_cols[(i + (s // 2) + seed) % len(rib_cols)]
                    c2 = rib_cols[(i + (s // 2) + seed + 1) % len(rib_cols)]
                    if i == ch_i:
                        rows.append(L.block(LBG, 'brick', i, k_lo, 1, 1, y_cur))
                        rows.append(L.block(DBG, 'brick', i, k_lo, 1, 1, y_cur + B))
                        rows.append(on(DORANGE, (i + 0.5) * S, y_cur + 2 * B, (k_lo + 0.5) * S, '3062b'))
                        rows.append(on(LBG, (i + 0.5) * S, y_cur + 3 * B, (k_lo + 0.5) * S, '98138'))
                    else:
                        rows.append(on(c1, (i + 0.5) * S, y_cur, (k_lo + 0.5) * S, '54200', math.pi))
                    rows.append(on(c2, (i + 0.5) * S, y_cur, (k_hi + 0.5) * S, '54200', 0.0))
                y_cur += P
            else:
                # Ridge crest at k_lo == k_hi (raised by 1 plate + 1 tile = 16 LDU to match 54200 peaks!)
                ch_i = i0 + w - 2 if chimney else None
                ridge_pl = {
                    (i, k_lo): (LBG if i == ch_i else RB)
                    for i in range(i0, i0 + w)
                }
                rows += pack_plates(ridge_pl, y_cur, axis='x')
                for i in range(i0, i0 + w):
                    if i == ch_i:
                        rows.append(L.block(LBG, 'brick', i, k_lo, 1, 1, y_cur + P))
                        rows.append(L.block(DBG, 'brick', i, k_lo, 1, 1, y_cur + P + B))
                        rows.append(on(DORANGE, (i + 0.5) * S, y_cur + P + 2 * B, (k_lo + 0.5) * S, '3062b'))
                        rows.append(on(LBG, (i + 0.5) * S, y_cur + P + 3 * B, (k_lo + 0.5) * S, '98138'))
                    else:
                        cr = DORANGE if i % 2 == 0 else MNOUGAT
                        rows.append(on(cr, (i + 0.5) * S, y_cur + P, (k_lo + 0.5) * S, '98138' if i % 2 == 0 else '3070b'))
    else:
        # ridge_axis == 'z': slopes face -x (rot=-pi/2) and +x (rot=pi/2)
        n_steps = (w + 1) // 2
        for s in range(n_steps):
            i_lo = i0 + s
            i_hi = i0 + w - 1 - s
            if i_lo < i_hi:
                inner = {}
                for i in range(i_lo + 1, i_hi):
                    for k in range(k0, k0 + d):
                        inner[(i, k)] = (LBG if s % 2 == 0 else TAN) if k in (k0, k0 + d - 1) else RB
                if inner:
                    rows += pack_plates(inner, y_cur, axis=('x' if s % 2 == 0 else 'z'))
                for k in range(k0, k0 + d):
                    c1 = rib_cols[(k + (s // 2) + seed) % len(rib_cols)]
                    c2 = rib_cols[(k + (s // 2) + seed + 1) % len(rib_cols)]
                    rows.append(on(c1, (i_lo + 0.5) * S, y_cur, (k + 0.5) * S, '54200', -math.pi * 0.5))
                    rows.append(on(c2, (i_hi + 0.5) * S, y_cur, (k + 0.5) * S, '54200',  math.pi * 0.5))
                y_cur += P
            else:
                ridge_pl = {(i_lo, k): RB for k in range(k0, k0 + d)}
                rows += pack_plates(ridge_pl, y_cur, axis='z')
                for k in range(k0, k0 + d):
                    cr = DORANGE if k % 2 == 0 else MNOUGAT
                    rows.append(on(cr, (i_lo + 0.5) * S, y_cur + P, (k + 0.5) * S, '98138' if k % 2 == 0 else '3070b'))
    return rows


def mediterranean_cypress(x, z, yup=4, seed=0):
    """Build a dense, tapered Mediterranean Pencil Cypress spire on a 2x2 root at (x, z, yup) using `L.Grow` and `L.tiers`:
    alternates `4727` 2x2 rosettes with 4x4 -> 2x4 -> 4x2 -> 2x2 tiers fringed with `2423` (4x3 leaves), `32607` (3-leaf
    clusters), and `98138` foliage buds in Dark Green, Green, and Olive, crowned by a `3942c` tapered cone."""
    g = L.Grow(seed)
    i0, k0, y = L._root(g, x, z, yup)
    y = L._bole(g, i0, k0, y, [RB, DB], 2)
    pal = [(DGREEN, 5), (GREEN, 2), (OLIVE, 1)]
    plan = [
        ('gap', '4727', DGREEN), (4, 4), (2, 4),
        ('gap', '4727', GREEN),  (4, 4), (4, 2),
        ('gap', '4727', DGREEN), (4, 2), (2, 2),
        ('gap', '4727', GREEN),  (2, 4), (2, 2),
        ('gap', '4727', DGREEN), (2, 2),
        ('gap', '4727', DGREEN),
    ]
    L.tiers(g, i0, k0, y, plan, pal, core=2, spacer=RB,
            plate_pal=[(DGREEN, 3), (GREEN, 1)],
            small=[(DGREEN, 4), (GREEN, 2), (OLIVE, 1)],
            top_cone=(DGREEN, '3942c'))
    return g.finish(fallback=(DGREEN, '98138'), dress=L._dress(pal))


def wall_color(i, c, k, seed=0):
    """Warm Mediterranean limestone & stucco coursing in Tan (19), Dark Tan (28), and Light Bluish Grey (71) quoins.
    Groups adjacent studs in staggered 2-stud running bond (`(i + c) // 2`, `(k + c) // 2`) so `pack_bricks` places
    1x2 (`98283`) and 1x4 (`15533`) embossed profile masonry bricks rather than 1x1 posts."""
    bi = (i + c) // 2
    bk = (k + c) // 2
    if c == 0:
        return LBG if (bi + bk) % 2 == 0 else DTAN
    r = hsh(bi, c, bk, seed)
    return LBG if r < 0.24 else (DTAN if r < 0.50 else TAN)


def build_coursed_box_walls(i0, k0, w, d, y0, courses, door_cells=set(), win_cells=set(), win_courses=range(2, 4), seed=0):
    """Build a 1-stud-thick coursed masonry box around the perimeter of (i0..i0+w-1, k0..k0+d-1) for `courses` brick courses
    using full 24-LDU LEGO bricks and embossed profile masonry bricks (`98283` 1x2 and `15533` 1x4) in staggered running bond,
    with internal cross-wall ribs, LBG corner quoins, stone doorway lintels, and recessed timber window sills."""
    rows = []
    perim = [(i, k) for i in range(i0, i0 + w) for k in range(k0, k0 + d)
             if i in (i0, i0 + w - 1, i0 + w // 2) or k in (k0, k0 + d - 1, k0 + d // 2)]
    # Identify jambs adjacent to doorways so the c==3 stone lintel spans across both jambs (4-stud 15533 lintel!)
    lintel_span = set(door_cells)
    for (di, dk) in door_cells:
        for (ni, nk) in ((di - 1, dk), (di + 1, dk), (di, dk - 1), (di, dk + 1)):
            if (ni, nk) in perim:
                lintel_span.add((ni, nk))

    for c in range(courses):
        y_c = y0 + c * B
        brick_cells = {}
        for (i, k) in perim:
            is_ext = i in (i0, i0 + w - 1) or k in (k0, k0 + d - 1)
            if is_ext and (i, k) in door_cells and c < 3:
                continue
            if is_ext and (i, k) in lintel_span and c == 3:
                brick_cells[(i, k)] = LBG  # heavy 1x4 embossed stone lintel spanning doorway & jambs
                continue
            if is_ext and (i, k) in win_cells and c in win_courses:
                if c == min(win_courses):
                    # Timber window sill plate + smooth stone sill tile inside window opening
                    rows.append(L.block(RB, 'plate', i, k, 1, 1, y_c))
                    rows.append(on(TAN, (i + 0.5) * S, y_c + P, (k + 0.5) * S, '3070b'))
                continue
            # Alternating X/Z corner quoins on even/odd courses so corners interlock in 3D ashlar running bond
            if c % 2 == 0:
                is_quoin = (i in (i0, i0 + 1, i0 + w - 2, i0 + w - 1) and k in (k0, k0 + d - 1))
            else:
                is_quoin = (i in (i0, i0 + w - 1) and k in (k0, k0 + 1, k0 + d - 2, k0 + d - 1))
            if not is_ext:
                col = RB
            elif is_quoin:
                col = LBG if (c % 2 == 0) else TAN
            else:
                col = wall_color(i, c, k, seed)
            brick_cells[(i, k)] = col
        rows += pack_bricks(brick_cells, y_c, axis=('x' if c % 2 == 0 else 'z'), masonry=True)
    return rows


def build_climbing_vine(canvas, i, k, y0, height_bricks=3, seed=0):
    """Build a botanical climbing ivy/vine column with woody base stem (`3062b`), stepped leaf plates,
    spreading 3-leaf clusters (`32607`), and 5-petal LEGO blossoms (`24866`) at cell (i, k) from `y0`."""
    canvas.reserve(i, k, 1, 1)
    cx, cz = (i + 0.5) * S, (k + 0.5) * S
    for c in range(height_bricks):
        yc = y0 + c * B
        if c == 0:
            canvas.rows.append(on(DB, cx, yc, cz, '3062b'))
        elif c == 1:
            canvas.rows.append(L.block(DGREEN, 'plate', i, k, 1, 1, yc))
            canvas.rows.append(L.block(OLIVE,  'plate', i, k, 1, 1, yc + P))
            canvas.rows.append(L.block(GREEN,  'plate', i, k, 1, 1, yc + 2 * P))
        else:
            canvas.rows.append(on(DGREEN if (c + seed) % 2 == 0 else OLIVE, cx, yc, cz, '3062b'))
    y_top = y0 + height_bricks * B
    fcol = [WHITE, YELLOW, WHITE, MLAV][abs(seed) % 4]
    canvas.rows.append(put(GREEN if seed % 2 == 0 else OLIVE, cx, y_top + 3.3, cz, '32607', RY(math.pi * 0.75)))
    canvas.rows.append(put(fcol, cx, y_top + 10.0, cz, '24866', RY(seed * 1.1)))


def build_raised_tree_planter(canvas, i0, k0, w, d, tree_kind='olive', bricks=2, seed=0):
    """Build a raised coursed-stone planter bastion (`w x d` studs, `bricks` courses tall in Tan/LBG/DTan)
    using 24-LDU embossed profile masonry bricks (`98283` and `15533`) and plant `tree_kind` on the elevated 2x2 center bed."""
    canvas.reserve(i0, k0, w, d)
    y0 = canvas.surf_y(i0, k0)
    ti0 = i0 + (w - 2) // 2
    tk0 = k0 + (d - 2) // 2
    tree_cells = {(ti0 + di, tk0 + dk) for di in (0, 1) for dk in (0, 1)}

    for c in range(bricks):
        yc = y0 + c * B
        layer = {}
        for i in range(i0, i0 + w):
            for k in range(k0, k0 + d):
                is_edge = i in (i0, i0 + w - 1) or k in (k0, k0 + d - 1)
                if c % 2 == 0:
                    is_corner = i in (i0, i0 + 1, i0 + w - 2, i0 + w - 1) and k in (k0, k0 + d - 1)
                else:
                    is_corner = i in (i0, i0 + w - 1) and k in (k0, k0 + 1, k0 + d - 2, k0 + d - 1)
                if not is_edge:
                    layer[(i, k)] = DB if (i, k) in tree_cells else DTAN
                elif is_corner:
                    layer[(i, k)] = LBG if c % 2 == 0 else TAN
                else:
                    layer[(i, k)] = wall_color(i, c, k, seed)
        canvas.rows += pack_bricks(layer, yc, axis=('x' if c % 2 == 0 else 'z'), masonry=True)

    y_top = y0 + bricks * B
    rim_tiles = {}
    for i in range(i0, i0 + w):
        for k in range(k0, k0 + d):
            if (i, k) not in tree_cells:
                rim_tiles[(i, k)] = LBG if (i + k) % 2 == 0 else TAN
    canvas.rows += pack_tiles(rim_tiles, y_top)
    canvas.add_tree(tree_kind, ti0, tk0, y_override=y_top, seed=seed + 77)


def build_townhouse_2storey(canvas, i0, k0, w, d, side='left', seed=0):
    """Build a monumental two-storey Mediterranean townhouse (Reference Image 1) with recessed doorways,
    threshold woman holding an offering bowl, climbing ivy with white blossoms, projecting second-storey stone
    balcony with Royal Blue + Gold tapestry, balcony amphora, marvelling balcony figure, and pitched terracotta roof."""
    canvas.reserve(i0, k0, w, d)
    y0 = canvas.surf_y(i0, k0)
    in_i = i0 + w - 1 if i0 < 0 else i0
    balc_dir = 1 if i0 < 0 else -1  # direction toward center street (i=0)
    mid_k = k0 + d // 2
    front_i = i0 + w // 2

    door_cells = {(in_i, mid_k), (in_i, mid_k + 1), (front_i - 1, k0 + d - 1), (front_i, k0 + d - 1)}
    win_g_cells = {(in_i, k0 + 2), (in_i, k0 + d - 3)}
    win_u_cells = {(in_i, mid_k), (in_i, mid_k + 1), (front_i - 1, k0 + d - 1), (front_i, k0 + d - 1)}

    # Ground floor: 4 brick courses (96 LDU)
    canvas.rows += build_coursed_box_walls(i0, k0, w, d, y0, 4, door_cells=door_cells,
                                           win_cells=win_g_cells, win_courses=range(1, 3), seed=seed)

    # Recessed wooden door leaf inside the inner street doorway (at mid_k + 1, off the mid_k cross-rib)
    rec_i = in_i - balc_dir
    for c in range(3):
        canvas.rows.append(L.block(RB, 'brick', rec_i, mid_k + 1, 1, 1, y0 + c * B))

    # Woman standing in the front threshold doorway marvelling (Reference Image 1!)
    for di in (front_i - 1, front_i):
        for dk in (k0 + d - 2, k0 + d - 1):
            canvas.keep_studs.add((di, dk))
    d_card = 'character.penelope' if side == 'left' else 'character.eurycleia'
    d_sub  = 'penelope' if side == 'left' else 'eurycleia'
    canvas.add_fig_at(d_card, d_sub, (front_i - 0.5) * S, y0, (k0 + d - 1 + 0.5) * S, rot=math.pi,
                      hips=WHITE, legs=WHITE, torso=('973', TAN if side == 'left' else WHITE), held_r=('98138', GOLD))

    # Climbing vines with white blossoms flanking the front doorway
    for vi in (i0, i0 + w - 1):
        vk = k0 + d
        if (vi, vk) in canvas.h_map:
            build_climbing_vine(canvas, vi, vk, y0, height_bricks=3, seed=seed + vi)

    # Balcony + Second-floor slab at y_balc = y0 + 4 * B (2 plates thick = 16 LDU)
    y_balc = y0 + 4 * B
    slab1 = {(i, k): RB for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    slab2 = {(i, k): TAN for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    balc_ks = range(mid_k - 3, mid_k + 5)
    i_cant = min(in_i - balc_dir, in_i + 2 * balc_dir)
    for dk in (0, 2, 4, 6):
        kb = mid_k - 3 + dk
        canvas.rows.append(L.block(RB, 'plate', i_cant, kb, 4, 2, y_balc))
        canvas.rows.append(L.block(LBG if dk in (0, 6) else TAN, 'plate', i_cant, kb, 4, 2, y_balc + P))
        for di in range(4):
            for dkk in range(2):
                slab1.pop((i_cant + di, kb + dkk), None)
                slab2.pop((i_cant + di, kb + dkk), None)
    canvas.rows += pack_plates(slab1, y_balc, axis='x')
    canvas.rows += pack_plates(slab2, y_balc + P, axis='z')

    # Balcony parapet & Royal Blue + Gold tapestry along the outer balcony edge (bi_edge = in_i + balc_dir * 2)
    y_u0 = y_balc + 2 * P
    bi_edge = in_i + balc_dir * 2
    bi_stand = in_i + balc_dir * 1
    for k in balc_ks:
        if k in (mid_k - 3, mid_k + 4):
            canvas.rows.append(L.block(LBG, 'brick', bi_edge, k, 1, 1, y_u0))
            canvas.rows.append(on(DORANGE if k == mid_k - 3 else TAN, (bi_edge + 0.5) * S, y_u0 + B, (k + 0.5) * S,
                                  '3062b' if k == mid_k - 3 else '98138'))
            if k == mid_k - 3:
                canvas.rows.append(on(GOLD, (bi_edge + 0.5) * S, y_u0 + 2 * B, (k + 0.5) * S, '98138'))
        elif k in (mid_k - 2, mid_k + 3):
            canvas.rows.append(L.block(TAN, 'brick', bi_edge, k, 1, 1, y_u0))
            canvas.rows.append(on(LBG, (bi_edge + 0.5) * S, y_u0 + B, (k + 0.5) * S, '3070b'))
        else:
            col_tap = KYANOS if (side == 'left') else (WHITE if k % 2 == 0 else MBLUE)
            canvas.rows.append(L.block(col_tap, 'brick', bi_edge, k, 1, 1, y_u0))
            canvas.rows.append(on(GOLD, (bi_edge + 0.5) * S, y_u0 + B, (k + 0.5) * S, '3070b'))
        if k not in (mid_k, mid_k + 1):
            canvas.rows.append(on(TAN if k % 2 == 0 else LBG, (bi_stand + 0.5) * S, y_u0, (k + 0.5) * S, '3070b'))

    # Figure standing on the balcony marvelling (Il. XVIII.495-496)
    rot_w = -math.pi * 0.5 if balc_dir > 0 else math.pi * 0.5
    w_card = 'character.arete' if side == 'left' else 'character.alcinous'
    w_sub  = 'arete' if side == 'left' else 'alcinous'
    canvas.add_fig_at(w_card, w_sub,
                      (bi_stand + 0.5) * S, y_u0, (mid_k + 0.5) * S, rot=rot_w,
                      hips=WHITE if side == 'left' else TAN,
                      legs=WHITE if side == 'left' else TAN,
                      torso=('973', WHITE if side == 'left' else DGREEN))

    # Upper floor walls: 3 brick courses (72 LDU) from y_u0 to y_eave
    canvas.rows += build_coursed_box_walls(i0, k0, w, d, y_u0, 3, door_cells=set(),
                                           win_cells=win_u_cells, win_courses=range(1, 3), seed=seed + 50)
    y_eave = y_u0 + 3 * B
    canvas.rows += pitched_terracotta_roof(i0, k0, w, d, y_eave, ridge_axis='z', seed=seed + 99)


def build_stone_cottage(canvas, i0, k0, w, d, door_side='+z', chimney=True, bench=True, seed=0):
    """Build a vernacular Mediterranean stone cottage (stathmos, Reference Image 5) in Tan/DTan/LBG with recessed
    wooden door, shuttered windows, exterior wooden bench, stone chimney, and pitched terracotta barrel-tile roof."""
    canvas.reserve(i0, k0, w, d)
    y0 = canvas.surf_y(i0, k0)
    mid_i = i0 + w // 2
    door_k = k0 + d - 1 if door_side == '+z' else k0
    door_cells = {(mid_i - 1, door_k), (mid_i, door_k)}
    win_cells = {(i0 + 2, door_k), (i0 + w - 3, door_k)}

    # 4 brick courses (96 LDU) of coursed limestone walls with LBG quoins
    canvas.rows += build_coursed_box_walls(i0, k0, w, d, y0, 4, door_cells=door_cells,
                                           win_cells=win_cells, win_courses=range(1, 3), seed=seed)
    # Recessed wooden door leaf inside the doorway (at mid_i - 1, beside the internal rib at mid_i)
    inner_dk = door_k - 1 if door_side == '+z' else door_k + 1
    for c in range(3):
        canvas.rows.append(L.block(RB, 'brick', mid_i - 1, inner_dk, 1, 1, y0 + c * B))
    # Grounded recessed dark window shutter piers behind the windows
    for wi in (i0 + 2, i0 + w - 3):
        if wi != mid_i and inner_dk != k0 + d // 2:
            for c in range(3):
                canvas.rows.append(L.block(DB, 'brick', wi, inner_dk, 1, 1, y0 + c * B))

    # Optional exterior wooden bench & climbing vines in front of the cottage (Reference Image 5!)
    front_k = door_k + 1 if door_side == '+z' else door_k - 1
    if bench and (i0 + w - 3, front_k) in canvas.h_map:
        for bi in (i0 + w - 4, i0 + w - 3, i0 + w - 2):
            canvas.reserve(bi, front_k, 1, 1)
            canvas.rows.append(L.block(DB if bi != i0 + w - 3 else RB, 'plate', bi, front_k, 1, 1, y0))
            canvas.rows.append(on(RB, (bi + 0.5) * S, y0 + P, (front_k + 0.5) * S, '3070b'))
        for vi in (i0, i0 + w - 1):
            if (vi, front_k) in canvas.h_map:
                build_climbing_vine(canvas, vi, front_k, y0, height_bricks=3, seed=seed + vi)

    y_eave = y0 + 4 * B
    canvas.rows += pitched_terracotta_roof(i0, k0, w, d, y_eave, ridge_axis='x', chimney=chimney, seed=seed + 33)


def build_timber_sheep_shed(canvas, i0, k0, w, d, seed=0):
    """Build the open-fronted timber-post Roofed Sheep Shed (klisie katerephes, Reference Image 5) with
    Tan stone & Reddish Brown timber posts, coursed stone rear & gable walls, two wooden slatted hay mangers
    filled with golden hay, and a continuous pitched terracotta barrel-tile roof."""
    posts = [
        (i0, k0), (i0 + w // 2, k0), (i0 + w - 1, k0),
        (i0, k0 + d // 3), (i0 + w - 1, k0 + d // 3),
        (i0, k0 + (2 * d) // 3), (i0 + w - 1, k0 + (2 * d) // 3),
        (i0, k0 + d - 1), (i0 + w // 2, k0 + d - 1), (i0 + w - 1, k0 + d - 1),
    ]
    back_i = i0 + w - 1 if i0 > 0 else i0
    back_wall = [(back_i, k) for k in range(k0, k0 + d)] + [(i, k0) for i in range(i0, i0 + w)]
    for (pi, pk) in set(posts) | set(back_wall):
        canvas.reserve(pi, pk, 1, 1)
    y0 = canvas.surf_y(i0, k0)

    for (wi, wk) in set(back_wall):
        if (wi, wk) not in posts:
            canvas.rows.append(L.block(LBG if (wi + wk) % 2 == 0 else TAN, 'brick', wi, wk, 1, 1, y0))
            canvas.rows.append(L.block(TAN if (wi + wk) % 2 == 0 else DTAN, 'brick', wi, wk, 1, 1, y0 + B))
            canvas.rows.append(L.block(LBG if (wi + wk) % 2 == 0 else TAN, 'brick', wi, wk, 1, 1, y0 + 2 * B))

    for (pi, pk) in set(posts):
        for c in range(3):
            col_p = TAN if c < 2 else RB
            canvas.rows.append(L.block(col_p, 'brick', pi, pk, 1, 1, y0 + c * B))

    # Two brick-built wooden hay mangers inside the shed filled with golden straw
    mi = i0 + w - 3 if i0 > 0 else i0 + 2
    for mk in range(k0 + 2, k0 + d - 2):
        if mk == k0 + d // 2:
            continue
        canvas.reserve(mi, mk, 1, 1)
        canvas.rows.append(L.block(RB, 'brick', mi, mk, 1, 1, y0))
        canvas.rows.append(on(GOLD if mk % 2 == 0 else BYELLOW, (mi + 0.5) * S, y0 + B, (mk + 0.5) * S, '54200', math.pi * 0.5))

    y_eave = y0 + 3 * B
    canvas.rows += pitched_terracotta_roof(i0, k0, w, d, y_eave, ridge_axis='z', seed=seed)


def build_wine_press_pavilion(canvas, i0, k0, w, d, seed=0):
    """Build a roofed Stone Wine-Treading Pavilion (lenos) with 4 stone corner pillars, pitched terracotta roof,
    coursed stone grape-treading vat filled with crushed Dark Red & Dark Purple grapes, and golden must spout."""
    canvas.reserve(i0, k0, w, d)
    y0 = canvas.surf_y(i0, k0)
    pillars = [
        (i0, k0), (i0 + w // 2, k0), (i0 + w - 1, k0),
        (i0, k0 + d - 1), (i0 + w // 2, k0 + d - 1), (i0 + w - 1, k0 + d - 1),
    ]
    for (pi, pk) in pillars:
        for c in range(3):
            canvas.rows.append(L.block(LBG if c == 0 else (TAN if c == 1 else RB), 'brick', pi, pk, 1, 1, y0 + c * B))

    # Stone treading vat inside (i0+1 .. i0+w-2, k0+1 .. k0+d-2)
    for i in range(i0 + 1, i0 + w - 1):
        for k in range(k0 + 1, k0 + d - 1):
            is_vat_wall = i in (i0 + 1, i0 + w - 2) or k in (k0 + 1, k0 + d - 2)
            if is_vat_wall:
                canvas.rows.append(L.block(LBG if (i + k) % 2 == 0 else TAN, 'brick', i, k, 1, 1, y0))
                canvas.rows.append(on(TAN if (i + k) % 2 == 0 else LBG, (i + 0.5) * S, y0 + B, (k + 0.5) * S, '3070b'))
            else:
                canvas.rows.append(L.block(DRED, 'plate', i, k, 1, 1, y0))
                canvas.rows.append(on(TRED if (i + k) % 2 == 0 else DPURPLE, (i + 0.5) * S, y0 + P, (k + 0.5) * S, '98138'))

    # Floor tiles around the vat under the roof
    for i in range(i0, i0 + w):
        for k in (k0, k0 + d - 1):
            if (i, k) not in pillars:
                canvas.rows.append(on(TAN if i % 2 == 0 else LBG, (i + 0.5) * S, y0, (k + 0.5) * S, '3070b'))
    for i in (i0, i0 + w - 1):
        for k in range(k0 + 1, k0 + d - 1):
            if (i, k) not in pillars:
                canvas.rows.append(on(TAN if k % 2 == 0 else LBG, (i + 0.5) * S, y0, (k + 0.5) * S, '3070b'))

    y_eave = y0 + 3 * B
    canvas.rows += pitched_terracotta_roof(i0, k0, w, d, y_eave, ridge_axis='x', seed=seed)


def build_doric_stoa(canvas, i0, k0, w, d, col_side=None, face_dir=None, n_cols=4, roof=True, seed=0):
    """Build a classical Doric Stoa colonnade (Reference Image 2) with stepped stone stylobate, rear ashlar wall,
    2x2 round columns with capitals, gold-boss triglyph-metope frieze, and optional pitched terracotta roof."""
    side = face_dir or col_side or ('+x' if i0 < 0 else '-x')
    canvas.reserve(i0, k0, w, d)
    y0 = canvas.surf_y(i0, k0)
    stylo1 = {(i, k): LBG for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    stylo2 = {(i, k): TAN for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    canvas.rows += pack_plates(stylo1, y0, axis='x')
    canvas.rows += pack_plates(stylo2, y0 + P, axis='z')
    y_fl = y0 + 2 * P

    wall_i = i0 + w - 1 if side == '-x' else i0
    col_i0 = i0 if side == '-x' else i0 + w - 2
    for c in range(4):
        w_cells = {(wall_i, k): (TAN if ((k + c) // 2) % 2 == 0 else LBG) for k in range(k0, k0 + d)}
        canvas.rows += pack_bricks(w_cells, y_fl + c * B, axis='z', masonry=True)

    col_ks = [k0 + 1 + round(n * (d - 4) / max(1, n_cols - 1)) for n in range(n_cols)]
    col_footprint = set()
    for ck in col_ks:
        cx, cz = (col_i0 + 1) * S, (ck + 1) * S
        for di in (0, 1):
            for dk in (0, 1):
                col_footprint.add((col_i0 + di, ck + dk))
        canvas.rows.append(put(LBG, cx, y_fl + P, cz, '4032a'))
        for c in range(3):
            canvas.rows.append(put(TAN if c % 2 == 0 else WHITE, cx, y_fl + P + (c + 1) * B, cz, '3941'))
        canvas.rows.append(put(GOLD, cx, y_fl + 2 * P + 3 * B, cz, '4032a'))
        canvas.rows.append(put(LBG, cx, y_fl + 3 * P + 3 * B, cz, '3022'))

    fl_tiles = {(i, k): (TAN if (i + k) % 2 == 0 else LBG)
                for i in range(i0, i0 + w) for k in range(k0, k0 + d)
                if i != wall_i and (i, k) not in col_footprint}
    canvas.rows += pack_tiles(fl_tiles, y_fl)

    y_ent = y_fl + 4 * B
    ent1 = {(i, k): TAN for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    ent2 = {(i, k): (GOLD if (k % 2 == 0 and i in (col_i0, col_i0 + 1)) else LBG)
            for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    ent3 = {(i, k): TAN for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
    canvas.rows += pack_plates(ent1, y_ent, axis='x')
    canvas.rows += pack_plates(ent2, y_ent + P, axis='z')
    canvas.rows += pack_plates(ent3, y_ent + 2 * P, axis='x')
    if roof:
        canvas.rows += pitched_terracotta_roof(i0, k0, w, d, y_ent + 3 * P, ridge_axis='z', seed=seed)
    else:
        top_t = {(i, k): (TAN if (i + k) % 2 == 0 else LBG) for i in range(i0, i0 + w) for k in range(k0, k0 + d)}
        canvas.rows += pack_tiles(top_t, y_ent + 3 * P)


def build_elder_throne(canvas, i0, k0, y0, face_rot=math.pi):
    """Build a sculpted polished-stone Elder Throne (3 studs wide x 2 studs deep) on `y0`, returning `(seat_x, seat_y, seat_z)`."""
    for di in range(3):
        for dk in range(2):
            canvas.rows.append(L.block(LBG, 'plate', i0 + di, k0 + dk, 1, 1, y0))
    y1 = y0 + P
    for di in range(3):
        canvas.rows.append(L.block(TAN if di == 1 else LBG, 'brick', i0 + di, k0, 1, 1, y1))
        canvas.rows.append(L.block(LBG if di == 1 else TAN, 'brick', i0 + di, k0, 1, 1, y1 + B))
        canvas.rows.append(on(GOLD if di == 1 else TAN, (i0 + di + 0.5) * S, y1 + 2 * B, (k0 + 0.5) * S,
                              '98138' if di == 1 else '54200', 0.0))
    for di in (0, 2):
        canvas.rows.append(L.block(LBG, 'brick', i0 + di, k0 + 1, 1, 1, y1))
        canvas.rows.append(on(GOLD, (i0 + di + 0.5) * S, y1 + B, (k0 + 1.5) * S, '98138'))
    canvas.rows.append(L.block(WHITE, 'plate', i0 + 1, k0 + 1, 1, 1, y1))
    canvas.rows.append(L.block(TAN, 'plate', i0 + 1, k0 + 1, 1, 1, y1 + P))
    return (i0 + 1.5) * S, y1 + 2 * P, (k0 + 1.5) * S


def build_sacred_circle_floor(canvas, ci, ck, h=2):
    """Build a concentric circular tiled Sacred Circle floor (12x12 studs around (ci, ck)) using curved macaroni tiles
    (27507 4x4, 79393 3x3, 27925 2x2) in Tan, Dark Tan, and Light Bluish Grey, with the Two Talents of Gold at center."""
    for i in range(ci - 6, ci + 6):
        for k in range(ck - 6, ck + 6):
            canvas.h_map[(i, k)] = h
            canvas.custom_tiles[(i, k)] = True

    y_tile = FLOOR + (h - 1) * P

    occupied = set()
    for i in (ci - 1, ci):
        for k in (ck - 1, ck):
            occupied.add((i, k))
            canvas.rows.append(L.block(KYANOS, 'plate', i, k, 1, 1, y_tile))
    canvas.rows.append(on(GOLD, (ci - 0.5) * S, y_tile + P, (ck - 0.5) * S, '98138'))
    canvas.rows.append(on(GOLD, (ci + 0.5) * S, y_tile + P, (ck + 0.5) * S, '98138'))
    canvas.rows.append(on(GOLD, (ci + 0.5) * S, y_tile + P, (ck - 0.5) * S, '3070b'))
    canvas.rows.append(on(GOLD, (ci - 0.5) * S, y_tile + P, (ck + 0.5) * S, '3070b'))

    for (i0, k0, sx, sz) in ((ci - 2, ck - 2, -1, -1), (ci, ck - 2, 1, -1), (ci - 2, ck, -1, 1), (ci, ck, 1, 1)):
        canvas.rows.append(put_curve_tile(TAN, i0, k0, y_tile, '27925', sx, sz))
        for di in (0, 1):
            for dk in (0, 1):
                occupied.add((i0 + di, k0 + dk))

    for (i0, k0, sx, sz) in ((ci - 3, ck - 3, -1, -1), (ci, ck - 3, 1, -1), (ci - 3, ck, -1, 1), (ci, ck, 1, 1)):
        canvas.rows.append(put_curve_tile(DTAN, i0, k0, y_tile, '79393', sx, sz))
        for di in range(3):
            for dk in range(3):
                occupied.add((i0 + di, k0 + dk))

    for (i0, k0, sx, sz) in ((ci - 4, ck - 4, -1, -1), (ci, ck - 4, 1, -1), (ci - 4, ck, -1, 1), (ci, ck, 1, 1)):
        canvas.rows.append(put_curve_tile(LBG, i0, k0, y_tile, '27507', sx, sz))
        for di in range(4):
            for dk in range(4):
                occupied.add((i0 + di, k0 + dk))

    for (si, sk) in ((ci + 4, ck - 1), (ci + 4, ck), (ci - 5, ck - 1), (ci - 5, ck)):
        occupied.add((si, sk))
        canvas.rows.append(L.block(TAN, 'plate', si, sk, 1, 1, y_tile))

    rem_tiles = {}
    for i in range(ci - 6, ci + 6):
        for k in range(ck - 6, ck + 6):
            if (i, k) not in occupied:
                rem_tiles[(i, k)] = TAN if (i + k) % 2 == 0 else LBG
    canvas.rows += pack_tiles(rem_tiles, y_tile)


# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
# 3. LDRAW UPDATE CREATURES (WOOLLY SHEEP, PRINTED GOATS, LOFTY-HORNED OXEN, MANED FELID LIONS, HOUNDS & BIRDS)
# ══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
def woolly_sheep(x, yup, z, rot=0.0, lamb=False):
    """LDraw Update 2024-05 printed sheep/goat (95341p03) with sculpted Homeric white wool fleece, or printed lamb (98386p01)."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.11))
    if lamb:
        return [
            place_local(M_b, WHITE, 0, 0, 0, '98386p01'),
        ]
    return [
        place_local(M_b, WHITE, 0, 0, 0, '95341p03'),
        place_local(M_b, WHITE, 0, 48, 0, '98138'),
    ]


def brown_goat(x, yup, z, rot=0.0):
    """LDraw Update 2024-05 printed Mediterranean goat with black eyes, dark tan horns, and medium nougat spots (95341p01)."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.13))
    return [
        place_local(M_b, TAN, 0, 0, 0, '95341p01'),
        place_local(M_b, DTAN, 0, 48, 0, '98138'),
    ]


def ox_beast(x, yup, z, rot=0, body_col=GOLD, horn_col=SILVER):
    """LDraw printed Homeric Lofty-Horned Ox (64452p01 with blaze, muzzle & eye pattern + 13564 2.25L horns at exact !HELP pinholes)."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.08))
    yoke_col = horn_col if body_col in (GOLD, TIN, BRONZE) else body_col
    return [
        place_local(M_b, body_col, 0, 0, 0, '64452p01'),
        place_local(M_b, yoke_col, -10, 48, 0, '54200', RY(-math.pi * 0.5)),
        place_local(M_b, yoke_col,  10, 48, 0, '54200', RY( math.pi * 0.5)),
        row(horn_col, mat_mul(M_b, mat_mul(T(-10.6, -79.7, -79.0), RX(-0.65))), '13564'),
        row(horn_col, mat_mul(M_b, mat_mul(T( 10.6, -79.7, -79.0), mat_mul(RX(-0.65), RZ(math.pi)))), '13564'),
    ]


def lion_beast(x, yup, z, rot=0, body_col=TAN):
    """LDraw Update 2025-04 Adult Felid Lion (80672a) with sculpted shaggy dark-tan & reddish-brown Homeric mane ruff."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.11))
    return [
        place_local(M_b, body_col, 0, 0, 0, '80672a'),
        place_local(M_b, RB,   -10, 48, -10, '54200', RY(-math.pi * 0.5)),
        place_local(M_b, RB,    10, 48, -10, '54200', RY( math.pi * 0.5)),
        place_local(M_b, DTAN, -10, 48,  10, '54200', RY( math.pi)),
        place_local(M_b, DTAN,  10, 48,  10, '54200', RY( math.pi)),
    ]


def dog_beast(x, yup, z, rot=0, col=TAN):
    """LDraw Update 2022-01 Printed Hunting Hound (92586p01 with black eyes, nose, blaze, and dark brown muzzle pattern)."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.14))
    return [
        place_local(M_b, col, 0, 0, 0, '92586p01'),
    ]


def bird_perch(x, yup, z, rot=0.0, kind='owl', col=WHITE):
    """LDraw Update 2024-2025 perched bird: Spread-Wing Owl (67632p01), Angular Owl (92084p01), or Printed Songbird (41835p01)."""
    M_b = mat_mul(T(x, -yup, z), RY(rot + 0.09))
    pid = '67632p01' if kind == 'owl' else ('92084p01' if kind == 'owl_perched' else '41835p01')
    return [
        place_local(M_b, col, 0, 0, 0, pid),
    ]
