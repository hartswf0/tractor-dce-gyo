#!/usr/bin/env python3
"""tools/forage/product/shoot.py — Studio Photographer for The Shield of Achilles Line
Renders hero.jpg, top.jpg, detail.jpg, and shots.json for every kit in achilles/kits/<slug>/
using real ./ldraw/parts/*.dat meshes, ACES Filmic studio lighting, and 2x supersampled anti-aliasing.
"""
import json, math, os, sys
os.environ['SDL_VIDEODRIVER'] = 'dummy'
import pygame
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ldbox, sculpt, landscape as L, kitlib
from PIL import ImageDraw, ImageFont

ROOT = kitlib.ROOT
ARTIFACT_DIR = '/Users/gaia/.gemini/antigravity/brain/d8a4c224-935e-4162-8570-670291acacf3'

RECT_PIDS = (
    {p for _, p in sculpt.BRICKS + sculpt.PLATES + sculpt.TILES}
    | {
        '4282', '91988', '3028', '3029', '41539', '3832', '3036', '3035', '3034',
        '3958', '3032', '3795', '3031', '3020', '3021', '3022',
        '4477', '3460', '3666', '3710', '3623', '3023', '3024',
        '87079', '3068b', '4162', '6636', '2431', '63864', '3069b', '3070b', '90498',
        '4186', '3811',
    }
)
TILE_PIDS = (
    {p for _, p in sculpt.TILES}
    | {'87079', '3068b', '4162', '6636', '2431', '63864', '3069b', '3070b', '90498'}
)

if not hasattr(ldbox, 'apply'):
    def _ld_apply(m, p, x, y, z):
        return (
            p[0] + m[0] * x + m[1] * y + m[2] * z,
            p[1] + m[3] * x + m[4] * y + m[5] * z,
            p[2] + m[6] * x + m[7] * y + m[8] * z,
        )
    ldbox.apply = _ld_apply

_orig_find = ldbox.find
def _ld_find(name):
    return _orig_find(name if name.lower().endswith('.dat') else name + '.dat')
ldbox.find = _ld_find


def parse_ldconfig():
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


def hex_to_rgb(h):
    v = int(h.lstrip('#'), 16)
    return np.array([(v >> 16) & 255, (v >> 8) & 255, v & 255], dtype=np.float32) / 255.0


def build_part_world_tris(b, studded, pos, rot, covered_cells):
    """Build world-space triangles for a rectangular brick/plate/tile, omitting any top cell or stud covered at wy1."""
    x0, y0, z0, x1, y1, z1 = b
    ins = 0.25
    ax0, ay0, az0 = x0 + ins, y0 + ins * 0.4, z0 + ins
    ax1, ay1, az1 = x1 - ins, y1 - ins * 0.4, z1 - ins
    ltris = []

    nx = max(1, round((x1 - x0) / 20))
    nz = max(1, round((z1 - z0) / 20))
    dx = (ax1 - ax0) / nx
    dz = (az1 - az0) / nz

    # Subdivided Side Walls (front +z, back -z, left -x, right +x)
    for ix in range(nx):
        xa, xb = ax0 + ix * dx, ax0 + (ix + 1) * dx
        ltris.append([[xa, ay0, az0], [xb, ay0, az0], [xb, ay1, az0]])
        ltris.append([[xa, ay0, az0], [xb, ay1, az0], [xa, ay1, az0]])
        ltris.append([[xb, ay0, az1], [xa, ay0, az1], [xa, ay1, az1]])
        ltris.append([[xb, ay0, az1], [xa, ay1, az1], [xb, ay1, az1]])
    for iz in range(nz):
        za, zb = az0 + iz * dz, az0 + (iz + 1) * dz
        ltris.append([[ax0, ay0, zb], [ax0, ay0, za], [ax0, ay1, za]])
        ltris.append([[ax0, ay0, zb], [ax0, ay1, za], [ax0, ay1, zb]])
        ltris.append([[ax1, ay0, za], [ax1, ay0, zb], [ax1, ay1, zb]])
        ltris.append([[ax1, ay0, za], [ax1, ay1, zb], [ax1, ay1, za]])

    wy_top = round(-(pos[1] + y0))
    # Subdivided Top Face (ay0) & Studs per 20x20 cell (only if not covered!)
    for ix in range(nx):
        xa, xb = ax0 + ix * dx, ax0 + (ix + 1) * dx
        sx = x0 + (ix + 0.5) * 20
        for iz in range(nz):
            za, zb = az0 + iz * dz, az0 + (iz + 1) * dz
            sz = z0 + (iz + 0.5) * 20
            wx = pos[0] + rot[0, 0] * sx + rot[0, 2] * sz
            wz = pos[2] + rot[2, 0] * sx + rot[2, 2] * sz
            ci, ck = math.floor(wx / 20.0), math.floor(wz / 20.0)
            is_cov = (abs(rot[1, 1] - 1.0) < 1e-3) and ((ci, ck, wy_top) in covered_cells)
            if not is_cov:
                ltris.append([[xa, ay0, zb], [xb, ay0, zb], [xb, ay0, za]])
                ltris.append([[xa, ay0, zb], [xb, ay0, za], [xa, ay0, za]])
                if studded:
                    sy0, sy1, sr = y0, y0 - 4.0, 6.0
                    for s in range(8):
                        a0, a1 = (s / 8) * math.pi * 2, ((s + 1) / 8) * math.pi * 2
                        xA, zA = sx + math.cos(a0) * sr, sz + math.sin(a0) * sr
                        xB, zB = sx + math.cos(a1) * sr, sz + math.sin(a1) * sr
                        ltris.append([[xA, sy1, zA], [xB, sy1, zB], [xB, sy0, zB]])
                        ltris.append([[xA, sy1, zA], [xB, sy0, zB], [xA, sy0, zA]])
                        ltris.append([[sx, sy1, sz], [xB, sy1, zB], [xA, sy1, zA]])
    if not ltris:
        return np.zeros((0, 3, 3), dtype=np.float32)
    arr = np.array(ltris, dtype=np.float32)
    wt = np.einsum('nij,kj->nik', arr, rot) + pos
    wt[:, :, 1] = -wt[:, :, 1]
    return wt[:, [0, 2, 1], :]


MESH_CACHE = {}


def get_special_mesh(pid):
    """Extract triangles and per-triangle color overrides (e.g. black eyes on 3626bp01 head) from ./ldraw/parts/<pid>.dat."""
    if pid in MESH_CACHE:
        return MESH_CACHE[pid]
    path = ldbox.find(pid)
    if not path:
        MESH_CACHE[pid] = (np.zeros((0, 3, 3), dtype=np.float32), [])
        return MESH_CACHE[pid]
    tris = []
    tcols = []

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
                if any(base.startswith(k) for k in ('stud4', 'stud3', 'stud2a', 'stud10', 'stud6')):
                    continue
                if base in ('stud.dat', 'stud2.dat'):
                    sp_p = ldbox.apply(m, p, float(t[2]), float(t[3]), float(t[4]))
                    sp_m = ldbox.mul(m, [float(v) for v in t[5:14]])
                    pts_b = [ldbox.apply(sp_m, sp_p, 6 * math.cos(a * math.pi / 4), 0, 6 * math.sin(a * math.pi / 4)) for a in range(8)]
                    pts_t = [ldbox.apply(sp_m, sp_p, 6 * math.cos(a * math.pi / 4), -4, 6 * math.sin(a * math.pi / 4)) for a in range(8)]
                    tc = ldbox.apply(sp_m, sp_p, 0, -4, 0)
                    for a in range(8):
                        b = (a + 1) % 8
                        tris.extend([[pts_b[a], pts_b[b], pts_t[b]], [pts_b[a], pts_t[b], pts_t[a]], [tc, pts_t[b], pts_t[a]]])
                        tcols.extend([sc, sc, sc])
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
                tris.append(pts)
                tcols.append(sc)
            elif t[0] == '4' and len(t) >= 14:
                c = int(t[1])
                sc = cur_col if c in (16, 24) else c
                pts = [ldbox.apply(m, p, float(t[2 + 3 * k]), float(t[3 + 3 * k]), float(t[4 + 3 * k])) for k in range(4)]
                tris.append([pts[0], pts[1], pts[2]])
                tris.append([pts[0], pts[2], pts[3]])
                tcols.extend([sc, sc])

    walk(path, (0.0, 0.0, 0.0), [1, 0, 0, 0, 1, 0, 0, 0, 1], 16)
    arr = np.array(tris, dtype=np.float32) if tris else np.zeros((0, 3, 3), dtype=np.float32)
    MESH_CACHE[pid] = (arr, tcols)
    return MESH_CACHE[pid]


def compile_scene_tris(mpd_path):
    parsed = []
    covered_cells = set()
    box_cache = {}

    for line in open(mpd_path, errors='ignore'):
        if not line.startswith('1 '):
            continue
        t = line.split()
        col = int(t[1])
        m = [float(v) for v in t[2:14]]
        pid = t[14].lower().replace('.dat', '')
        parsed.append((col, m, pid))

        # Record grid cells covered by the bottom of this part
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

    world_tris = []
    world_rgb = []
    world_metal = []

    for col, m, pid in parsed:
        pos = np.array(m[0:3], dtype=np.float32)
        rot = np.array(m[3:12], dtype=np.float32).reshape((3, 3))
        if pid in RECT_PIDS and box_cache.get(pid) is not None:
            lo, hi = box_cache[pid]
            wt = build_part_world_tris([lo[0], lo[1], lo[2], hi[0], hi[1], hi[2]], pid not in TILE_PIDS, pos, rot, covered_cells)
            tcols = None
        else:
            ltris, tcols = get_special_mesh(pid)
            if len(ltris) == 0:
                continue
            wt = np.einsum('nij,kj->nik', ltris, rot) + pos
            wt[:, :, 1] = -wt[:, :, 1]
            wt = wt[:, [0, 2, 1], :]

        if len(wt) == 0:
            continue

        cinfo = LD_COLS.get(col, {'hex': '#888888', 'a': 1.0, 'm': 0})
        base_rgb = hex_to_rgb(cinfo['hex'])
        base_m = float(cinfo['m'])

        n = len(wt)
        world_tris.append(wt)
        if tcols and any(c != 16 for c in tcols):
            rgb_arr = np.empty((n, 3), dtype=np.float32)
            m_arr = np.empty(n, dtype=np.float32)
            for idx_t, sc in enumerate(tcols):
                if sc == 16:
                    rgb_arr[idx_t] = base_rgb
                    m_arr[idx_t] = base_m
                else:
                    sc_info = LD_COLS.get(sc, {'hex': '#1b2a34', 'a': 1.0, 'm': 0})
                    rgb_arr[idx_t] = hex_to_rgb(sc_info['hex'])
                    m_arr[idx_t] = float(sc_info['m'])
            world_rgb.append(rgb_arr)
            world_metal.append(m_arr)
        else:
            world_rgb.append(np.tile(base_rgb, (n, 1)))
            world_metal.append(np.full(n, base_m, dtype=np.float32))

    return np.concatenate(world_tris, axis=0), np.concatenate(world_rgb, axis=0), np.concatenate(world_metal, axis=0)


def render_shot(wt, wrgb, wmetal, eye, target, out_path=None, w=960, h=660, fov_deg=34.0, bg_rgb=(239, 236, 228)):
    ss = 2
    rw, rh = w * ss, h * ss
    eye = np.array(eye, dtype=np.float32)
    target = np.array(target, dtype=np.float32)

    z_axis = eye - target
    z_norm = np.linalg.norm(z_axis)
    if z_norm < 1e-6:
        z_axis = np.array([0.0, 1.0, 0.0], dtype=np.float32)
    else:
        z_axis /= z_norm
    if abs(z_axis[1]) > 0.98:
        up = np.array([0.0, 0.0, -1.0], dtype=np.float32)
    else:
        up = np.array([0.0, 1.0, 0.0], dtype=np.float32)
    x_axis = np.cross(up, z_axis)
    x_axis /= np.maximum(np.linalg.norm(x_axis), 1e-6)
    y_axis = np.cross(z_axis, x_axis)

    u = wt[:, 1] - wt[:, 0]
    v = wt[:, 2] - wt[:, 0]
    norms = np.cross(u, v)
    nlen = np.linalg.norm(norms, axis=1, keepdims=True)
    norms = np.divide(norms, np.maximum(nlen, 1e-6))

    centers = wt.mean(axis=1)
    view_dirs = eye - centers
    vlen = np.linalg.norm(view_dirs, axis=1, keepdims=True)
    view_dirs /= np.maximum(vlen, 1e-6)

    dot_vn = np.sum(norms * view_dirs, axis=1, keepdims=True)
    norms = np.where(dot_vn < 0, -norms, norms)

    L1 = np.array([0.45, 0.78, 0.43], dtype=np.float32); L1 /= np.linalg.norm(L1)
    L2 = np.array([-0.62, 0.45, -0.64], dtype=np.float32); L2 /= np.linalg.norm(L2)
    L3 = np.array([0.0, 0.42, -0.90], dtype=np.float32); L3 /= np.linalg.norm(L3)

    d1 = np.maximum(0.0, norms @ L1)[:, None]
    d2 = np.maximum(0.0, norms @ L2)[:, None]
    d3 = np.maximum(0.0, norms @ L3)[:, None]

    hemi_mix = (norms[:, 1:2] * 0.5 + 0.5)
    hemi_col = (1.0 - hemi_mix) * np.array([0.29, 0.25, 0.21]) + hemi_mix * np.array([1.0, 0.965, 0.90])

    base_lin = np.power(wrgb, 2.2)
    diff = base_lin * (
        hemi_col * 0.52
        + np.array([1.0, 0.95, 0.86]) * d1 * 1.15
        + np.array([0.61, 0.72, 1.0]) * d2 * 0.48
        + np.array([1.0, 0.88, 0.69]) * d3 * 0.32
    )

    H1 = L1 + view_dirs
    H1 /= np.maximum(np.linalg.norm(H1, axis=1, keepdims=True), 1e-6)
    ndoth = np.maximum(0.0, np.sum(norms * H1, axis=1, keepdims=True))
    metal = wmetal[:, None]
    shininess = 28.0 * (1.0 - metal) + 72.0 * metal
    spec_str = 0.18 * (1.0 - metal) + 0.95 * metal
    spec_col = (1.0 - metal * 0.7) * np.array([1.0, 0.97, 0.92]) + (metal * 0.7) * base_lin
    spec = spec_col * np.power(ndoth, shininess) * spec_str

    lin_out = (diff * (1.0 - metal * 0.28) + spec) * 1.06
    aces = np.clip((lin_out * (2.51 * lin_out + 0.03)) / (lin_out * (2.43 * lin_out + 0.59) + 0.14), 0.0, 1.0)
    srgb = (np.power(aces, 1.0 / 2.2) * 255.0).astype(np.uint8)

    rel = wt - eye
    cx = rel @ x_axis
    cy = rel @ y_axis
    cz = rel @ z_axis

    valid = (cz[:, 0] < -20.0) & (cz[:, 1] < -20.0) & (cz[:, 2] < -20.0)
    cx, cy, cz, srgb = cx[valid], cy[valid], cz[valid], srgb[valid]
    v_norms = norms[valid]
    v_centers = centers[valid]

    f = 1.0 / math.tan(math.radians(fov_deg) / 2.0)
    aspect = rw / rh
    ndc_x = (cx / -cz) * (f / aspect)
    ndc_y = (cy / -cz) * f

    px = ((ndc_x + 1.0) * 0.5 * rw).astype(np.int32)
    py = ((1.0 - ndc_y) * 0.5 * rh).astype(np.int32)

    # Sort back-to-front by mean cz, with top-face priority so horizontal tile/brick tops always draw cleanly over side seams
    mean_z = cz.mean(axis=1) + (v_norms[:, 1] > 0.85) * 4.5 + v_centers[:, 1] * 0.15
    order = np.argsort(mean_z)
    px, py, srgb = px[order], py[order], srgb[order]

    surf = pygame.Surface((rw, rh))
    surf.fill(bg_rgb)
    draw_poly = pygame.draw.polygon
    pts_list = np.stack([px, py], axis=-1).tolist()
    col_list = srgb.tolist()
    for pts, c in zip(pts_list, col_list):
        draw_poly(surf, c, pts)

    arr = pygame.surfarray.array3d(surf).transpose((1, 0, 2))
    img = Image.fromarray(arr).resize((w, h), Image.Resampling.LANCZOS)
    if out_path:
        os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
        img.save(out_path, quality=92)
    return img


def compute_camera(wt, az=200.0, el=24.0, zoom=1.25, at=None, view=None, fov_deg=34.0):
    pts = wt.reshape(-1, 3)
    lo = pts.min(axis=0)
    hi = pts.max(axis=0)
    span = np.maximum(hi - lo, 40.0)
    radius = float(np.linalg.norm(span)) * 0.5
    if at is not None:
        target = np.array(at, dtype=np.float32)
    else:
        target = (lo + hi) * 0.5
    if view == 'top':
        el = 88.0
        az = 180.0
    elif view == 'front':
        el = 14.0
        az = 180.0
    rad_az = math.radians(float(az))
    rad_el = math.radians(float(el))
    base_dist = (radius / math.tan(math.radians(fov_deg * 0.5))) * 1.15
    dist = max(120.0, base_dist / max(float(zoom), 0.1))
    eye = target + dist * np.array([
        math.sin(rad_az) * math.cos(rad_el),
        math.sin(rad_el),
        -math.cos(rad_az) * math.cos(rad_el),
    ], dtype=np.float32)
    return eye, target


def resolve_card_mpd(card_id):
    for d in (os.path.join(ROOT, 'odyssey/cards'), os.path.join(ROOT, 'achilles/cards')):
        p = os.path.join(d, card_id if card_id.endswith('.mpd') else f'{card_id}.mpd')
        if os.path.exists(p):
            return p
    if os.path.exists(card_id):
        return card_id
    raise FileNotFoundError(f'Cannot find card MPD for {card_id}')


def render_contact_sheet(card_id, out_path, title=None, c1=None, c2=None, studio='dark'):
    """Render the 5 required views from docs/sets/shield-builder.md onto one 1920x1240 contact sheet:
    1. Hero angle (--az 200 --el 24)
    2. From minifigure height (--az 200 --el 5)
    3. From above (--el 88)
    4. Close-up 1 of the moment
    5. Close-up 2 of the moment
    """
    pygame.init()
    mpd_path = resolve_card_mpd(card_id)
    wt, wrgb, wmetal = compile_scene_tris(mpd_path)
    bg = (22, 24, 29) if studio == 'dark' else (239, 236, 228)

    pts = wt.reshape(-1, 3)
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    ctr = (lo + hi) * 0.5
    span = hi - lo

    # Default close-up targets if not explicitly passed
    if c1 is None:
        t1 = [float(ctr[0] - span[0] * 0.12), float(lo[1] + span[1] * 0.48), float(ctr[2] - span[2] * 0.12)]
        c1 = (t1, 198.0, 18.0, 2.75, '4. Close-up I - Primary Focal Moment')
    if c2 is None:
        t2 = [float(ctr[0] + span[0] * 0.12), float(lo[1] + span[1] * 0.42), float(ctr[2] + span[2] * 0.15)]
        c2 = (t2, 168.0, 16.0, 2.75, '5. Close-up II - Secondary Action & Craft')

    e_hero, t_hero = compute_camera(wt, az=200.0, el=24.0, zoom=1.80)
    e_low, t_low = compute_camera(wt, az=200.0, el=5.0, zoom=1.85)
    e_top, t_top = compute_camera(wt, az=180.0, el=88.0, zoom=1.55)
    e_c1, t_c1 = compute_camera(wt, az=c1[1], el=c1[2], zoom=c1[3], at=c1[0])
    e_c2, t_c2 = compute_camera(wt, az=c2[1], el=c2[2], zoom=c2[3], at=c2[0])

    img_hero = render_shot(wt, wrgb, wmetal, e_hero, t_hero, w=940, h=570, bg_rgb=bg)
    img_low  = render_shot(wt, wrgb, wmetal, e_low,  t_low,  w=940, h=570, bg_rgb=bg)
    img_top  = render_shot(wt, wrgb, wmetal, e_top,  t_top,  w=620, h=570, bg_rgb=bg)
    img_c1   = render_shot(wt, wrgb, wmetal, e_c1,   t_c1,   w=620, h=570, bg_rgb=bg)
    img_c2   = render_shot(wt, wrgb, wmetal, e_c2,   t_c2,   w=620, h=570, bg_rgb=bg)

    sheet = Image.new('RGB', (1920, 1240), (14, 16, 20))
    draw = ImageDraw.Draw(sheet)
    hdr = (title or f'{card_id} - Five-Angle Craft & Moment Contact Sheet').replace('—', '-')
    draw.text((24, 14), hdr, fill=(240, 232, 210))

    panels = [
        (img_hero, 20,  48,  '1. Hero Angle (--az 200 --el 24)'),
        (img_low,  960, 48,  '2. Minifigure Eye Level (--az 200 --el 5)'),
        (img_top,  20,  644, '3. Plan View from Above (--el 88)'),
        (img_c1,   650, 644, c1[4].replace('—', '-')),
        (img_c2,   1280,644, c2[4].replace('—', '-')),
    ]
    for im, px, py, lbl in panels:
        sheet.paste(im, (px, py))
        draw.rectangle([px, py, px + im.width - 1, py + 26], fill=(18, 20, 26))
        draw.text((px + 10, py + 6), lbl, fill=(235, 225, 195))

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    sheet.save(out_path, quality=92)
    return out_path


def run_look_cli(argv):
    pygame.init()
    def opt(k, d=None):
        if f'--{k}' in argv:
            i = argv.index(f'--{k}')
            if i + 1 < len(argv):
                return argv[i + 1]
        return d

    out_dir = opt('out', os.path.join(ROOT, 'odyssey/thumbs'))
    size = int(opt('size', 480))
    w = int(opt('w', size))
    h = int(opt('h', size))
    studio = opt('studio', 'dark')
    az = float(opt('az', 200.0 if opt('studio') else 35.0))
    el = float(opt('el', 24.0 if opt('studio') else 18.0))
    zoom = float(opt('zoom', 1.3))
    view = opt('view', None)
    at_str = opt('at', None)
    at = [float(x) for x in at_str.split(',')] if at_str else None
    is_jpg = '--jpeg' in argv
    bg = (22, 24, 29) if studio == 'dark' else (239, 236, 228)

    skip_Flags = {'--out', '--size', '--base', '--type', '--t', '--view', '--studio', '--az', '--el', '--zoom', '--w', '--h', '--at'}
    ids = []
    i = 0
    while i < len(argv):
        a = argv[i]
        if a in skip_Flags:
            i += 2
            continue
        if a.startswith('--'):
            i += 1
            continue
        ids.append(a)
        i += 1

    os.makedirs(out_dir, exist_ok=True)
    for idx, cid in enumerate(ids, 1):
        t0 = pygame.time.get_ticks()
        mpd_path = resolve_card_mpd(cid)
        wt, wrgb, wmetal = compile_scene_tris(mpd_path)
        eye, target = compute_camera(wt, az=az, el=el, zoom=zoom, at=at, view=view)
        ext = '.jpg' if is_jpg else '.png'
        out_file = os.path.join(out_dir, cid + ext)
        render_shot(wt, wrgb, wmetal, eye, target, out_file, w=w, h=h, bg_rgb=bg)
        dt = (pygame.time.get_ticks() - t0) / 1000.0
        print(f'{idx}/{len(ids)} {cid} {dt:.1f} s -> {out_file}')


def main():
    if '--look' in sys.argv:
         idx = sys.argv.index('--look')
         run_look_cli(sys.argv[idx + 1:])
         return
    if '--contact' in sys.argv:
        idx = sys.argv.index('--contact')
        cid = sys.argv[idx + 1]
        out_p = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else os.path.join(ARTIFACT_DIR, f'{cid}_contact.jpg')
        title = sys.argv[sys.argv.index('--title') + 1] if '--title' in sys.argv else None
        def gopt(k, d):
            return float(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
        c1 = None
        if '--cu1-tx' in sys.argv or '--cu1-tz' in sys.argv:
            c1 = ([gopt('--cu1-tx', 0.0), gopt('--cu1-ty', -60.0), gopt('--cu1-tz', 0.0)],
                  gopt('--cu1-az', 200.0), gopt('--cu1-el', 20.0), gopt('--cu1-zoom', 2.85),
                  '4. Close-up I - Primary Focal Moment')
        c2 = None
        if '--cu2-tx' in sys.argv or '--cu2-tz' in sys.argv:
            c2 = ([gopt('--cu2-tx', 0.0), gopt('--cu2-ty', -60.0), gopt('--cu2-tz', 0.0)],
                  gopt('--cu2-az', 175.0), gopt('--cu2-el', 20.0), gopt('--cu2-zoom', 2.85),
                  '5. Close-up II - Secondary Action & Craft')
        p = render_contact_sheet(cid, out_p, title=title, c1=c1, c2=c2)
        print(f'Contact sheet -> {p}')
        return
    from kits.achilles_line import KITS_SPEC, ACH_CARDS, ACH_KITS
    if '--rotunda' in sys.argv:
        shoot_rotunda()
        return


if __name__ == '__main__':
    main()

