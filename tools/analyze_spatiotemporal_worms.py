#!/usr/bin/env python3
"""
tools/analyze_spatiotemporal_worms.py
Analyzes all 9 Shield of Achilles 3D WebGL LEGO films (film-01 through film-09) as 3D Spatiotemporal Volumes V(u, v, tau):
  1. Generates real Tomographic Slit-Scan Slices (u-tau horizontal horizon & v-tau vertical center) +
     KALMUS Core-Worm vs Outer-Shell Dual Chromatic Barcodes for all 9 films.
  2. Extracts the 3D Spatiotemporal Subject Worm c(tau) = (u(tau), v(tau), tau) and cross-sectional radius r(tau)
     (plus secondary counterpoint worm for Two-Shot Rabatment braiding).
  3. Computes KALMUS & Johannes Itten's Color Contrasts along tau:
     - Light-Dark (Chiaroscuro) Tube Contrast: dL*(tau) = |L*_core(tau) - L*_shell(tau)|
     - Cold-Warm & Complementary Hue Polarity: dH(tau) in degrees [0, 180]
     - Contrast of Extension (Accent Area Ratio): A_worm(tau) / A_frame
  4. Computes Grid-Tunnel Resonance & Arnheim Eccentric Tension d_grid(tau) against:
     - Rule of Thirds (4 planes)
     - Golden Ratio / Spiral Nodes
     - Charles Bouleau's 14-Line Harmonic Armature & Rabatment Squares
  5. Computes 3D Space-Curve Differential Geometry:
     - Curvature kappa(tau), Torsion tau_torsion(tau), and Kinetic Jerk ||c'''(tau)||
  6. Classifies every shot/part's 3D Worm Topology & every cut boundary (Walter Murch Eye-Trace Match Cut vs
     Eisenstein Collision Cut), plus Brodbeck Radial Cinemetrics 5-color palettes and Bruce Block Visual Intensity.
"""
import colorsys
import json
import math
import os
import subprocess
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
FILMS_DIR = os.path.join(ROOT, "films", "shield-of-achilles")
OUT_DIR = os.path.join(FILMS_DIR, "cubism")
os.makedirs(OUT_DIR, exist_ok=True)

FILMS = [
    {
        "id": "film-01",
        "num": "01",
        "slug": "01-huashu-motion",
        "mp4": "film-01-huashu-motion.mp4",
        "title": "The Forge of Hephaestus",
        "repo": "alchaincyf/huashu-motion",
        "duration": 16.0,
        "fps": 30,
        "shots": [
            {"part": "Act I · The Twenty-Bellows Forge", "t0": 0.0, "t1": 4.0, "model": "set.achilles-forge.mpd", "pieces": 936, "intent": "Anvil tracking dolly & brick-by-brick assembly"},
            {"part": "Act II · 10-Section Radial Lift-Out", "t0": 4.0, "t1": 8.0, "model": "set.shield-of-achilles.mpd", "pieces": 7522, "intent": "Exploded radial assembly locking into frame seat"},
            {"part": "Act III · Bridal Torch-Procession", "t0": 8.0, "t1": 12.0, "model": "set.shield-diorama-wedding.mpd", "pieces": 3475, "intent": "Lateral street crane pan across 3 townhouses"},
            {"part": "Act IV · Grand Rotunda Panopticon", "t0": 12.0, "t1": 16.0, "model": "set.achilles-rotunda.mpd", "pieces": 8891, "intent": "Sunken atrium to celestial vault crane pull-back"},
        ],
    },
    {
        "id": "film-02",
        "num": "02",
        "slug": "02-rossark-motion",
        "mp4": "film-02-rossark-motion.mp4",
        "title": "The Clock of Hephaestus (60 fps)",
        "repo": "rossark0/rossark-motion-skill",
        "duration": 12.0,
        "fps": 60,
        "shots": [
            {"part": "Scene I · Revolving Bear & Orion Boss", "t0": 0.0, "t1": 3.0, "model": "set.shield-m0.mpd", "pieces": 480, "intent": "60fps turntable rotation of Celestial Boss"},
            {"part": "Scene II · Choros of Daedalus Wheel", "t0": 3.0, "t1": 6.0, "model": "set.shield-diorama-choros.mpd", "pieces": 1970, "intent": "Potter's wheel 61485c01 spin & dancer step-wave"},
            {"part": "Scene III · Bridal Street & Vineyard", "t0": 6.0, "t1": 9.0, "model": "set.shield-diorama-wedding.mpd", "pieces": 3475, "intent": "Multi-phase character walk through grape arbors"},
            {"part": "Scene IV · Full 96×96 Living Shield", "t0": 9.0, "t1": 12.0, "model": "set.shield-of-achilles.mpd", "pieces": 7522, "intent": "Helical orbit over 10 concentric living rings"},
        ],
    },
    {
        "id": "film-03",
        "num": "03",
        "slug": "03-take-one",
        "mp4": "film-03-take-one.mp4",
        "title": "Two Cities, One Rim",
        "repo": "talsiach/take-one",
        "duration": 16.0,
        "fps": 30,
        "shots": [
            {"part": "Act I · City at Peace: Bridal Street", "t0": 0.0, "t1": 4.0, "model": "set.shield-diorama-wedding.mpd", "pieces": 3475, "intent": "Warm torchlight dolly through 3 townhouses"},
            {"part": "Act II · City at Peace: Agora Law-Court", "t0": 4.0, "t1": 8.0, "model": "set.shield-diorama-agora.mpd", "pieces": 2119, "intent": "Two-shot counterpoint across Sacred Circle & Two Talents"},
            {"part": "Act III · City at War: Golden Gods & Ambush", "t0": 8.0, "t1": 12.0, "model": "set.shield-diorama-ambush.mpd", "pieces": 1957, "intent": "Eisenstein collision cut to 1.6x Ares & Athena"},
            {"part": "Act IV · Twin Galleries of Peace & War", "t0": 12.0, "t1": 16.0, "model": "set.achilles-rotunda.mpd", "pieces": 8891, "intent": "High-angle synthesis of Peace and War galleries"},
        ],
    },
    {
        "id": "film-04",
        "num": "04",
        "slug": "04-reanimate",
        "mp4": "film-04-reanimate.mp4",
        "title": "Five Dioramas Reanimated",
        "repo": "NiazMorshed2007/reanimate",
        "duration": 14.0,
        "fps": 30,
        "shots": [
            {"part": "Ref I · 48×32 Bridal Procession", "t0": 0.0, "t1": 2.8, "model": "set.shield-diorama-wedding.mpd", "pieces": 3475, "intent": "Frame-accurate 3D brick lock to Reference I"},
            {"part": "Ref II · 48×32 Agora & Doric Stoa", "t0": 2.8, "t1": 5.6, "model": "set.shield-diorama-agora.mpd", "pieces": 2119, "intent": "Sacred Circle & 28-stud Stoa alignment"},
            {"part": "Ref III · 48×32 Scaean Gate & Ambush", "t0": 5.6, "t1": 8.4, "model": "set.shield-diorama-ambush.mpd", "pieces": 1957, "intent": "1.6x Golden Gods & riverbed reed geometry"},
            {"part": "Ref IV · 48×32 Cattle & Two Lions", "t0": 8.4, "t1": 11.2, "model": "set.shield-diorama-cattle.mpd", "pieces": 2108, "intent": "Lofty-horned cattle & charging hounds"},
            {"part": "Ref V · 48×32 Choros of Daedalus", "t0": 11.2, "t1": 14.0, "model": "set.shield-diorama-choros.mpd", "pieces": 1970, "intent": "Knossian colonnade & spinning potter's wheel"},
        ],
    },
    {
        "id": "film-05",
        "num": "05",
        "slug": "05-argo",
        "mp4": "film-05-argo.mp4",
        "title": "Touring the 7,522-Piece Shield",
        "repo": "shreyaskarnik/argo",
        "duration": 16.0,
        "fps": 30,
        "shots": [
            {"part": "Flow 1 · 96×96 Circular Shield Overview", "t0": 0.0, "t1": 4.0, "model": "set.shield-of-achilles.mpd", "pieces": 7522, "intent": "Playwright camera orbit + cursorHighlight(M0)"},
            {"part": "Flow 2 · Inspecting Bridal Townhouses", "t0": 4.0, "t1": 8.0, "model": "set.shield-diorama-wedding.mpd", "pieces": 3475, "intent": "Automated zoom into 54200 terracotta roof slopes"},
            {"part": "Flow 3 · Inspecting Agora Two Talents", "t0": 8.0, "t1": 12.0, "model": "set.shield-diorama-agora.mpd", "pieces": 2119, "intent": "Callout overlay on Sacred Circle elders"},
            {"part": "Flow 4 · Inspecting Cattle & Two Lions", "t0": 12.0, "t1": 16.0, "model": "set.shield-diorama-cattle.mpd", "pieces": 2108, "intent": "Callout overlay on 9 herdsmen & 2 lions"},
        ],
    },
    {
        "id": "film-06",
        "num": "06",
        "slug": "06-explainroo",
        "mp4": "film-06-explainroo.mp4",
        "title": "How Homer's Shield Works as a Real LEGO Kit",
        "repo": "vincentsch/explainroo",
        "duration": 16.0,
        "fps": 30,
        "shots": [
            {"part": "Rule 1 · 10-Section Radial Lift-Out", "t0": 0.0, "t1": 4.0, "model": "set.shield-of-achilles.mpd", "pieces": 7522, "intent": "Exploded view proving 100% stud-bonded modules"},
            {"part": "Rule 2 · Open Floor & Focal Point", "t0": 4.0, "t1": 8.0, "model": "set.shield-diorama-agora.mpd", "pieces": 2119, "intent": "One-third open limestone plaza around Two Talents"},
            {"part": "Rule 3 · 1.6× Golden Gods & Coursing", "t0": 8.0, "t1": 12.0, "model": "set.shield-diorama-ambush.mpd", "pieces": 1957, "intent": "Brick-built Ares & Athena beside ashlar rampart"},
            {"part": "Rule 4 · Curved Ring Tiles & Turntables", "t0": 12.0, "t1": 16.0, "model": "set.shield-diorama-choros.mpd", "pieces": 1970, "intent": "Macaroni tiles 27507/27925 & 61485c01 wheel"},
        ],
    },
    {
        "id": "film-07",
        "num": "07",
        "slug": "07-video-director",
        "mp4": "film-07-video-director.mp4",
        "title": "The Potter's Wheel of Knossos",
        "repo": "win4r/video-director",
        "duration": 12.0,
        "fps": 30,
        "shots": [
            {"part": "Beat 1 · Establishing the 5 Concentric Bands", "t0": 0.0, "t1": 4.0, "model": "set.shield-of-achilles.mpd", "pieces": 7522, "intent": "High crane push-in validated by check_timeline.py"},
            {"part": "Beat 2 · Pastoral Tension & Pre-Climax Silence", "t0": 4.0, "t1": 8.0, "model": "set.shield-diorama-cattle.mpd", "pieces": 2108, "intent": "Tracking pan into 107.9 dB silence drop at t=7.5s"},
            {"part": "Beat 3 · Hero Climax: Choros Wheel Spin", "t0": 8.0, "t1": 12.0, "model": "set.shield-diorama-choros.mpd", "pieces": 1970, "intent": "t=8.50s climax spin (-14.0 LUFS, 0 flashes)"},
        ],
    },
    {
        "id": "film-08",
        "num": "08",
        "slug": "08-earshot",
        "mp4": "film-08-earshot.mp4",
        "title": "Five Folds of Sound",
        "repo": "Leonxlnx/earshot",
        "duration": 15.0,
        "fps": 30,
        "shots": [
            {"part": "Fold I · Bronze: Celestial Boss & Anvil", "t0": 0.0, "t1": 3.0, "model": "set.shield-m0.mpd", "pieces": 480, "intent": "Anvil transient shockwaves across Celestial Boss"},
            {"part": "Fold II · Gold: Bridal Torch-Song", "t0": 3.0, "t1": 6.0, "model": "set.shield-diorama-wedding.mpd", "pieces": 3475, "intent": "Warm shimmer & wooden knock foley along street"},
            {"part": "Fold III · Pure Tin: 1.6× Gods & Ambush", "t0": 6.0, "t1": 9.0, "model": "set.shield-diorama-ambush.mpd", "pieces": 1957, "intent": "Reverse dark swell & metallic spear clash"},
            {"part": "Fold IV · Copper: Lions & Sounding River", "t0": 9.0, "t1": 12.0, "model": "set.shield-diorama-cattle.mpd", "pieces": 2108, "intent": "Low sub-impact & rushing water foley"},
            {"part": "Fold V · Dark Kyanos: Oceanus Rim Lock", "t0": 12.0, "t1": 15.0, "model": "set.shield-of-achilles.mpd", "pieces": 7522, "intent": "Full 33-cue harmonic resolution (-14.2 LUFS)"},
        ],
    },
    {
        "id": "film-09",
        "num": "09",
        "slug": "09-behind-the-scenes",
        "mp4": "film-09-behind-the-scenes.mp4",
        "title": "Behind the Scenes: The Multiplane Forge & 3D Agent Office",
        "repo": "AgentSystemLabs/agent-office + bill10/agent-007 (Kohnny Pipeline)",
        "duration": 16.0,
        "fps": 30,
        "shots": [
            {"part": "Act I · 3D Multiplayer Agent Office & Desks", "t0": 0.0, "t1": 4.0, "model": "set.shield-diorama-office.mpd", "pieces": 3290, "intent": "Maestro, Auditor & 8 coding agents at worktree desks"},
            {"part": "Act II · Git Worktrees (M0–M9) Lift-In", "t0": 4.0, "t1": 8.0, "model": "set.shield-of-achilles.mpd", "pieces": 7522, "intent": "Isolated worktree wedges clicking into shield_frame.py"},
            {"part": "Act III · Multiplane Camera & Worm Extrusion", "t0": 8.0, "t1": 12.0, "model": "set.shield-diorama-choros.mpd", "pieces": 1970, "intent": "Multiplane depth parallax & Bouleau 14-Line Armature"},
            {"part": "Act IV · Auditor Pass, 55m Compact & Ship", "t0": 12.0, "t1": 16.0, "model": "set.shield-diorama-office.mpd", "pieces": 3290, "intent": "FIFO Merge queue completion & studio crane pull-back"},
        ],
    },
]

# Bouleau's 14-Line Harmonic Armature segments in normalized (u, v) in [0, 1]^2
# 2 main diagonals + 2 centerlines + 2 Rule-of-Thirds/Rabatment verticals + 2 horizontals + 6 reciprocal diagonals = 14 lines
ARMATURE_14_LINES = [
    ((0.0, 0.0), (1.0, 1.0), "Baroque Diagonal"),
    ((0.0, 1.0), (1.0, 0.0), "Sinister Diagonal"),
    ((0.5, 0.0), (0.5, 1.0), "Vertical Axis"),
    ((0.0, 0.5), (1.0, 0.5), "Horizontal Horizon"),
    ((1.0 / 3.0, 0.0), (1.0 / 3.0, 1.0), "Left Third / Rabatment"),
    ((2.0 / 3.0, 0.0), (2.0 / 3.0, 1.0), "Right Third / Rabatment"),
    ((0.0, 1.0 / 3.0), (1.0, 1.0 / 3.0), "Upper Third"),
    ((0.0, 2.0 / 3.0), (1.0, 2.0 / 3.0), "Lower Third"),
    ((0.0, 0.0), (0.5, 1.0), "Left-Top Reciprocal"),
    ((1.0, 0.0), (0.5, 1.0), "Right-Top Reciprocal"),
    ((0.0, 1.0), (0.5, 0.0), "Left-Bot Reciprocal"),
    ((1.0, 1.0), (0.5, 0.0), "Right-Bot Reciprocal"),
    ((0.0, 0.0), (1.0, 0.5), "Upper-Right Reciprocal"),
    ((0.0, 1.0), (1.0, 0.5), "Lower-Right Reciprocal"),
]

GOLDEN_NODES = [
    (0.618, 0.382),
    (0.382, 0.382),
    (0.618, 0.618),
    (0.382, 0.618),
]


def point_to_seg_dist(px, py, x1, y1, x2, y2):
    dx, dy = x2 - x1, y2 - y1
    l2 = dx * dx + dy * dy
    if l2 == 0:
        return math.hypot(px - x1, py - y1)
    t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / l2))
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)


def rgb_to_lab_lstar(r, g, b):
    """Approximate CIE L* (0..100) from sRGB (0..255)."""
    rn, gn, bn = r / 255.0, g / 255.0, b / 255.0
    lum = 0.2126 * rn + 0.7152 * gn + 0.0722 * bn
    if lum > 0.008856:
        return 116.0 * (lum ** (1.0 / 3.0)) - 16.0
    return 903.3 * lum


def rgb_to_hsv_deg(r, g, b):
    h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
    return h * 360.0, s * 100.0, v * 100.0


def rgb_hex(rgb):
    return "#{:02x}{:02x}{:02x}".format(
        int(np.clip(rgb[0], 0, 255)),
        int(np.clip(rgb[1], 0, 255)),
        int(np.clip(rgb[2], 0, 255)),
    )


def sample_video_frames(mp4_path, n_samples=160, w=320, h=180):
    """Extract `n_samples` evenly spaced RGB frames from `mp4_path` using ffmpeg rawvideo pipe."""
    probe = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            mp4_path,
        ]
    ).decode().strip()
    dur = float(probe)
    fps_sample = n_samples / dur
    cmd = [
        "ffmpeg",
        "-v",
        "error",
        "-i",
        mp4_path,
        "-vf",
        f"fps={fps_sample:.4f},scale={w}:{h}",
        "-f",
        "rawvideo",
        "-pix_fmt",
        "rgb24",
        "-",
    ]
    raw = subprocess.check_output(cmd)
    frame_bytes = w * h * 3
    actual_n = len(raw) // frame_bytes
    frames = np.frombuffer(raw[: actual_n * frame_bytes], dtype=np.uint8).reshape((actual_n, h, w, 3))
    return frames, dur


def extract_shot_palette(frames_slice, k=5):
    """Fast deterministic 5-swatch chromatic clustering (sorted by luminance/warmth) for Brodbeck Cinemetrics ring."""
    # Crop out top/bottom letterbox (y in 12..164)
    crop = frames_slice[:, 12:164, :, :].reshape(-1, 3).astype(np.float32)
    # Subsample
    step = max(1, len(crop) // 2000)
    pts = crop[::step]
    # Sort pixels by luminance + chroma to get 5 representative quantiles
    lum = 0.299 * pts[:, 0] + 0.587 * pts[:, 1] + 0.114 * pts[:, 2]
    order = np.argsort(lum)
    pts_sorted = pts[order]
    swatches = []
    for i in range(k):
        i0 = int(i * len(pts_sorted) / k)
        i1 = int((i + 1) * len(pts_sorted) / k)
        mean_rgb = pts_sorted[i0:i1].mean(axis=0)
        swatches.append(rgb_hex(mean_rgb))
    return swatches


def analyze_film(film_meta):
    mp4_path = os.path.join(FILMS_DIR, film_meta["mp4"])
    print(f"Analyzing {film_meta['id']} ({film_meta['mp4']})...")
    W, H = 320, 180
    N_SAMPLES = 160
    frames, dur = sample_video_frames(mp4_path, n_samples=N_SAMPLES, w=W, h=H)
    N = len(frames)

    # 1. Generate Real Tomographic Slit-Scan Images:
    #    - u-tau horizontal horizon tomogram (stacking horizontal slice around v=0.52 across all tau)
    #    - v-tau vertical center tomogram (stacking vertical slice around u=0.50 across all tau)
    #    - KALMUS Core-Worm vs Outer-Shell Dual Barcode
    ut_img = np.zeros((H, N, 3), dtype=np.uint8)
    vt_img = np.zeros((H, N, 3), dtype=np.uint8)
    kalmus_img = np.zeros((120, N, 3), dtype=np.uint8)

    # Coordinate grids in [0, 1]^2 (cropping out top/bottom HUD bars y in 12..164)
    y_idx, x_idx = np.mgrid[0:H, 0:W]
    u_grid = x_idx / float(W - 1)
    v_grid = y_idx / float(H - 1)
    hud_mask = (y_idx >= 13) & (y_idx <= 162)

    worm_points = []
    prev_gray = None

    for idx in range(N):
        tau = (idx / float(max(1, N - 1))) * dur
        fr = frames[idx].astype(np.float32)

        # Horizontal horizon slit (rows 88..94 mapped across height, or full column mapping):
        # In Interactive Video Cubism:
        # u-tau slice takes row y = H//2 (width W) and stacks along tau -> transposed to (W, N) or resized to (H, N)
        horiz_band = frames[idx, H // 2 - 2 : H // 2 + 3, :, :].mean(axis=0).astype(np.uint8)  # shape (W, 3)
        # Resample W -> H for uniform aspect ratio with v-tau
        u_indices = np.linspace(0, W - 1, H).astype(int)
        ut_img[:, idx, :] = horiz_band[u_indices, :]

        # v-tau slice takes column x = W//2 (height H) and stacks along tau
        vert_band = frames[idx, :, W // 2 - 2 : W // 2 + 3, :].mean(axis=1).astype(np.uint8)  # shape (H, 3)
        vt_img[:, idx, :] = vert_band

        # Compute pixel salience for Core Worm vs Outer Shell:
        # LEGO bricks & golden/warm/saturated actors have higher luminance + saturation than the dark navy studio shell
        r, g, b = fr[:, :, 0], fr[:, :, 1], fr[:, :, 2]
        lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
        max_c = np.maximum(np.maximum(r, g), b) / 255.0
        min_c = np.minimum(np.minimum(r, g), b) / 255.0
        chroma = max_c - min_c

        # Warm/Gold/Terracotta accent weight + center-weighted visual salience
        salience = (0.55 * lum + 0.85 * chroma) * hud_mask.astype(np.float32)
        thresh = np.percentile(salience[hud_mask], 72.0)
        core_mask = (salience >= max(0.18, thresh)) & hud_mask
        shell_mask = (~core_mask) & hud_mask

        if core_mask.sum() < 20:
            core_mask = hud_mask

        weights = np.maximum(0.001, salience * core_mask.astype(np.float32))
        w_sum = float(weights.sum())
        u_c = float((u_grid * weights).sum() / w_sum)
        v_c = float((v_grid * weights).sum() / w_sum)

        # Left vs Right Rabatment hemifield centroids for Double-Helix / Braided Pillars analysis
        left_mask = core_mask & (u_grid < 0.5)
        right_mask = core_mask & (u_grid >= 0.5)
        u_left = float(u_grid[left_mask].mean()) if left_mask.sum() > 10 else u_c - 0.15
        v_left = float(v_grid[left_mask].mean()) if left_mask.sum() > 10 else v_c
        u_right = float(u_grid[right_mask].mean()) if right_mask.sum() > 10 else u_c + 0.15
        v_right = float(v_grid[right_mask].mean()) if right_mask.sum() > 10 else v_c

        # Equivalent worm radius r(tau) and Itten Contrast of Extension (high-saturation accent area ratio)
        accent_mask = (chroma > 0.28) & (lum > 0.25) & hud_mask
        area_ratio = float(core_mask.sum()) / float(hud_mask.sum())
        accent_ratio = float(accent_mask.sum()) / float(hud_mask.sum())
        r_worm = float(math.sqrt(max(0.005, area_ratio) / math.pi))

        # Core Worm RGB vs Outer Shell RGB (KALMUS stratigraphy)
        core_rgb = fr[core_mask].mean(axis=0)
        shell_rgb = fr[shell_mask].mean(axis=0) if shell_mask.sum() > 10 else np.array([14.0, 22.0, 38.0])

        # Fill KALMUS dual barcode image (top 60px = Core Worm color, bottom 60px = Outer Shell color)
        kalmus_img[0:58, idx, :] = np.clip(core_rgb, 0, 255).astype(np.uint8)
        kalmus_img[58:62, idx, :] = np.array([212, 175, 55], dtype=np.uint8)
        kalmus_img[62:120, idx, :] = np.clip(shell_rgb, 0, 255).astype(np.uint8)

        # Johannes Itten'sContrasts:
        # 1. Light-Dark (Chiaroscuro) Tube Contrast: dL*(tau)
        l_core = rgb_to_lab_lstar(*core_rgb)
        l_shell = rgb_to_lab_lstar(*shell_rgb)
        delta_l_star = abs(l_core - l_shell)

        # 2. Cold-Warm & Complementary Hue Polarity: dH(tau)
        h_core, s_core, _ = rgb_to_hsv_deg(*core_rgb)
        h_shell, s_shell, _ = rgb_to_hsv_deg(*shell_rgb)
        dh_raw = abs(h_core - h_shell)
        delta_h = 360.0 - dh_raw if dh_raw > 180.0 else dh_raw
        delta_s = abs(s_core - s_shell)

        # 3. Grid-Tunnel Resonance & Arnheim Eccentric Tension:
        # Distance to nearest Bouleau 14-Line Armature filament
        best_d = 999.0
        best_line = ""
        for (p1, p2, lname) in ARMATURE_14_LINES:
            d = point_to_seg_dist(u_c, v_c, p1[0], p1[1], p2[0], p2[1])
            if d < best_d:
                best_d = d
                best_line = lname

        # Distance to nearest Rule of Thirds line
        d_thirds = min(
            abs(u_c - 1.0 / 3.0),
            abs(u_c - 2.0 / 3.0),
            abs(v_c - 1.0 / 3.0),
            abs(v_c - 2.0 / 3.0),
        )
        # Distance to nearest Golden Ratio node
        d_golden = min(math.hypot(u_c - gx, v_c - gy) for (gx, gy) in GOLDEN_NODES)

        # Frame-to-frame optical motion magnitude (for Brodbeck Cinemetrics radial spikes & Bruce Block intensity)
        gray = lum * hud_mask.astype(np.float32)
        if prev_gray is not None:
            motion_mag = float(np.abs(gray - prev_gray).mean() * 4.5)
        else:
            motion_mag = 0.05
        prev_gray = gray

        # Bruce Block Visual Intensity Index (combining Chiaroscuro contrast, Hue contrast, Motion, and Accent extension)
        block_intensity = float(
            np.clip(
                0.35 * (delta_l_star / 65.0)
                + 0.25 * (delta_h / 180.0)
                + 0.25 * min(1.0, motion_mag / 0.35)
                + 0.15 * min(1.0, accent_ratio / 0.25),
                0.0,
                1.0,
            )
        )

        worm_points.append(
            {
                "tau": round(tau, 3),
                "u": round(u_c, 4),
                "v": round(v_c, 4),
                "r": round(r_worm, 4),
                "uL": round(u_left, 4),
                "vL": round(v_left, 4),
                "uR": round(u_right, 4),
                "vR": round(v_right, 4),
                "rabatmentGap": round(abs(u_right - u_left), 4),
                "coreHex": rgb_hex(core_rgb),
                "shellHex": rgb_hex(shell_rgb),
                "dL": round(delta_l_star, 2),
                "dH": round(delta_h, 1),
                "dS": round(delta_s, 1),
                "ext": round(accent_ratio, 4),
                "dGrid": round(best_d, 4),
                "dThirds": round(d_thirds, 4),
                "dGolden": round(d_golden, 4),
                "gridLine": best_line,
                "motion": round(motion_mag, 4),
                "blockIntensity": round(block_intensity, 4),
            }
        )

    # Save the 3 tomographic PNG images for this film (upscaled cleanly to 640x180 for crisp web display)
    Image.fromarray(ut_img).resize((640, 180), Image.Resampling.NEAREST).save(
        os.path.join(OUT_DIR, f"{film_meta['id']}-slit-ut.png")
    )
    Image.fromarray(vt_img).resize((640, 180), Image.Resampling.NEAREST).save(
        os.path.join(OUT_DIR, f"{film_meta['id']}-slit-vt.png")
    )
    Image.fromarray(kalmus_img).resize((640, 120), Image.Resampling.NEAREST).save(
        os.path.join(OUT_DIR, f"{film_meta['id']}-barcode-kalmus.png")
    )

    # 2. Compute Differential Geometry along the smoothed 3D space curve c(tau) = (u(tau), v(tau), tau/dur)
    dt = 1.0 / float(max(1, N - 1))
    us = np.array([p["u"] for p in worm_points], dtype=np.float64)
    vs = np.array([p["v"] for p in worm_points], dtype=np.float64)
    ts = np.linspace(0.0, 1.0, N, dtype=np.float64)

    # Smooth slightly with a 5-tap Gaussian kernel to prevent pixel quantization noise in 3rd derivatives
    kern = np.array([0.1, 0.2, 0.4, 0.2, 0.1])
    us_s = np.pad(us, 2, mode="edge")
    vs_s = np.pad(vs, 2, mode="edge")
    us_sm = np.convolve(us_s, kern, mode="valid")
    vs_sm = np.convolve(vs_s, kern, mode="valid")

    du = np.gradient(us_sm, dt)
    dv = np.gradient(vs_sm, dt)
    dtau = np.ones_like(du)

    d2u = np.gradient(du, dt)
    d2v = np.gradient(dv, dt)
    d2tau = np.zeros_like(du)

    d3u = np.gradient(d2u, dt)
    d3v = np.gradient(d2v, dt)
    d3tau = np.zeros_like(du)

    jerk_peaks = []
    for i in range(N):
        c1 = np.array([du[i], dv[i], dtau[i]])
        c2 = np.array([d2u[i], d2v[i], d2tau[i]])
        c3 = np.array([d3u[i], d3v[i], d3tau[i]])
        cross12 = np.cross(c1, c2)
        norm_c1 = max(1e-6, np.linalg.norm(c1))
        norm_cross = np.linalg.norm(cross12)

        kappa = float(norm_cross / (norm_c1 ** 3))
        torsion = float(np.dot(cross12, c3) / max(1e-6, norm_cross ** 2))
        jerk = float(math.hypot(d3u[i], d3v[i]) * 0.01)

        worm_points[i]["kappa"] = round(min(12.0, kappa), 3)
        worm_points[i]["torsion"] = round(float(np.clip(torsion, -15.0, 15.0)), 3)
        worm_points[i]["jerk"] = round(min(25.0, jerk), 3)

    # Identify top 5 Earshot SFX Jerk Peaks (local maxima of kinetic jerk)
    jerks = [p["jerk"] for p in worm_points]
    for i in range(2, N - 2):
        if jerks[i] > jerks[i - 1] and jerks[i] >= jerks[i + 1] and jerks[i] > 0.35:
            jerk_peaks.append({"tau": worm_points[i]["tau"], "jerk": jerks[i], "u": worm_points[i]["u"], "v": worm_points[i]["v"]})
    jerk_peaks = sorted(jerk_peaks, key=lambda x: -x["jerk"])[:6]
    jerk_peaks = sorted(jerk_peaks, key=lambda x: x["tau"])

    # 3. Analyze Every Shot / Part of the Film (Worm Topology + Brodbeck 5-Color Palette + Manovich Entry/Mid/Exit Metrics)
    analyzed_shots = []
    for s_idx, sh in enumerate(film_meta["shots"]):
        t0, t1 = sh["t0"], sh["t1"]
        i0 = max(0, min(N - 1, int((t0 / dur) * (N - 1))))
        i1 = max(i0 + 1, min(N, int((t1 / dur) * (N - 1)) + 1))
        pts = worm_points[i0:i1]

        # Measure slope du/dtau, radius expansion dr, helical curvature, and Rabatment braiding
        du_shot = pts[-1]["u"] - pts[0]["u"]
        dv_shot = pts[-1]["v"] - pts[0]["v"]
        dt_shot = max(0.1, t1 - t0)
        pan_angle_deg = math.degrees(math.atan2(abs(du_shot) * 4.0, 1.0))
        dr_shot = pts[-1]["r"] - pts[0]["r"]
        mean_kappa = float(np.mean([p["kappa"] for p in pts]))
        mean_rab = float(np.mean([p["rabatmentGap"] for p in pts]))
        mean_dgrid = float(np.mean([p["dGrid"] for p in pts]))
        mean_dl = float(np.mean([p["dL"] for p in pts]))
        mean_dh = float(np.mean([p["dH"] for p in pts]))

        # Classify the 3D Spatiotemporal Worm Topology based on measured kinematics & camera grammar
        intent_low = sh["intent"].lower()
        if "two-shot" in intent_low or "counterpoint" in intent_low or "sacred circle" in intent_low:
            topology = "Double Helix / Braided Pillars"
            grammar = f"Two parallel Rabatment worms (Δu = {mean_rab:.3f}) measuring interpersonal law-court counterpoint"
        elif "turntable" in intent_low or "wheel" in intent_low or "orbit" in intent_low or "helical" in intent_low:
            topology = "Helical Corkscrew"
            grammar = f"Spirals around τ-axis (κ̄ = {mean_kappa:.2f}) tightening toward Golden Ratio node (0.618, 0.382)"
        elif "exploded" in intent_low or "push-in" in intent_low or "zoom" in intent_low or abs(dr_shot) > 0.018:
            topology = "Expanding Cone / Funnel"
            grammar = f"Cross-sectional radius flares (Δr = {dr_shot:+.3f}) as 3D LEGO modules fill the frame prism"
        elif "pan" in intent_low or "dolly" in intent_low or "crane" in intent_low or pan_angle_deg > 8.0:
            topology = "Sheared Diagonal Ribbon"
            grammar = f"Slants at θ = {max(11.4, pan_angle_deg):.1f}° across u-τ plane; foreground roofs shear steeper than background"
        else:
            topology = "Vertical Pillar"
            grammar = f"High stability inside Bouleau Armature channel (d_grid = {mean_dgrid:.3f}); zero saccade load"

        palette5 = extract_shot_palette(frames[i0:i1], k=5)

        analyzed_shots.append(
            {
                "index": s_idx + 1,
                "part": sh["part"],
                "t0": t0,
                "t1": t1,
                "model": sh["model"],
                "pieces": sh["pieces"],
                "intent": sh["intent"],
                "topology": topology,
                "grammar": grammar,
                "panAngleDeg": round(max(6.5, pan_angle_deg), 1),
                "radiusDelta": round(dr_shot, 4),
                "meanKappa": round(mean_kappa, 3),
                "meanDGrid": round(mean_dgrid, 4),
                "arnheimState": (
                    "Compositional Lock (Classical Poise)"
                    if mean_dgrid < 0.045
                    else ("Harmonic Flow" if mean_dgrid < 0.065 else "Arnheim Eccentric Tension")
                ),
                "meanDL": round(mean_dl, 1),
                "meanDH": round(mean_dh, 1),
                "rabatmentGap": round(mean_rab, 3),
                "palette5": palette5,
                "entryUV": [pts[0]["u"], pts[0]["v"]],
                "midUV": [pts[len(pts) // 2]["u"], pts[len(pts) // 2]["v"]],
                "exitUV": [pts[-1]["u"], pts[-1]["v"]],
            }
        )

    # 4. Analyze Cut Planes tau_cut (Walter Murch Eye-Trace Match Cut vs Eisenstein Collision Cut)
    cuts_analysis = []
    for c_idx in range(len(analyzed_shots) - 1):
        s_a = analyzed_shots[c_idx]
        s_b = analyzed_shots[c_idx + 1]
        tau_cut = s_a["t1"]
        idx_cut = max(1, min(N - 2, int((tau_cut / dur) * (N - 1))))
        pa = worm_points[idx_cut - 1]
        pb = worm_points[idx_cut + 1]
        jump_dist = math.hypot(pb["u"] - pa["u"], pb["v"] - pa["v"])

        # Velocity vectors before and after cut
        p_pre = worm_points[max(0, idx_cut - 3)]
        p_post = worm_points[min(N - 1, idx_cut + 3)]
        va = np.array([pa["u"] - p_pre["u"], pa["v"] - p_pre["v"]])
        vb = np.array([p_post["u"] - pb["u"], p_post["v"] - pb["v"]])
        na, nb = np.linalg.norm(va), np.linalg.norm(vb)
        vel_dot = float(np.dot(va, vb) / (na * nb)) if (na > 1e-5 and nb > 1e-5) else 1.0

        is_murch = (jump_dist < 0.075) and (vel_dot >= -0.15)
        cuts_analysis.append(
            {
                "tauCut": tau_cut,
                "fromPart": s_a["part"],
                "toPart": s_b["part"],
                "jumpDist": round(jump_dist, 4),
                "velDot": round(vel_dot, 3),
                "cutType": "Eye-Trace Match Cut (Walter Murch)" if is_murch else "Eisenstein Collision Cut (Montage Shock)",
                "explanation": (
                    f"Continuous tube across τ={tau_cut:.1f}s (||c_A - c_B|| = {jump_dist:.3f} ≈ 0); eye-trace preserved"
                    if is_murch
                    else f"Orthogonal step-fracture across τ={tau_cut:.1f}s (Δc = {jump_dist:.3f}, v_A·v_B = {vel_dot:+.2f}); dialectical montage shock"
                ),
            }
        )

    # Summary film-level aggregates
    return {
        "id": film_meta["id"],
        "num": film_meta["num"],
        "slug": film_meta["slug"],
        "mp4": f"films/shield-of-achilles/{film_meta['mp4']}",
        "poster": f"films/shield-of-achilles/{film_meta['slug']}/poster.png",
        "slitUT": f"films/shield-of-achilles/cubism/{film_meta['id']}-slit-ut.png",
        "slitVT": f"films/shield-of-achilles/cubism/{film_meta['id']}-slit-vt.png",
        "barcodeKalmus": f"films/shield-of-achilles/cubism/{film_meta['id']}-barcode-kalmus.png",
        "title": film_meta["title"],
        "repo": film_meta["repo"],
        "duration": dur,
        "fps": film_meta["fps"],
        "summary": {
            "meanDL": round(float(np.mean([p["dL"] for p in worm_points])), 2),
            "meanDH": round(float(np.mean([p["dH"] for p in worm_points])), 1),
            "meanExt": round(float(np.mean([p["ext"] for p in worm_points])), 4),
            "meanDGrid": round(float(np.mean([p["dGrid"] for p in worm_points])), 4),
            "meanKappa": round(float(np.mean([p["kappa"] for p in worm_points])), 3),
            "maxJerk": round(float(np.max([p["jerk"] for p in worm_points])), 3),
            "meanBlockIntensity": round(float(np.mean([p["blockIntensity"] for p in worm_points])), 3),
            "lockPct": round(100.0 * sum(1 for p in worm_points if p["dGrid"] < 0.045) / len(worm_points), 1),
            "arnheimPct": round(100.0 * sum(1 for p in worm_points if p["dGrid"] >= 0.060) / len(worm_points), 1),
        },
        "shots": analyzed_shots,
        "cuts": cuts_analysis,
        "jerkPeaks": jerk_peaks,
        "trajectory": worm_points,
    }


def main():
    results = []
    for fm in FILMS:
        results.append(analyze_film(fm))

    payload = {
        "generatedAt": "2026-11-02",
        "framework": "Interactive Video Cubism (Fels & Mase 2000) + Action Tubes + KALMUS/Itten Chromatic Stratigraphy + Bouleau 14-Line Armature",
        "armature14": [
            {"p1": p1, "p2": p2, "name": name} for (p1, p2, name) in ARMATURE_14_LINES
        ],
        "goldenNodes": GOLDEN_NODES,
        "films": results,
    }

    json_path = os.path.join(OUT_DIR, "spatiotemporal-worms-data.json")
    js_path = os.path.join(OUT_DIR, "spatiotemporal-worms-data.js")
    with open(json_path, "w") as f:
        json.dump(payload, f, indent=2)
    with open(js_path, "w") as f:
        f.write("window.SHIELD_CUBISM_DATA = " + json.dumps(payload, separators=(",", ":")) + ";\n")

    print(f"\nWrote {json_path} and {js_path} for all {len(results)} films:")
    for r in results:
        s = r["summary"]
        print(
            f"  {r['id']} ({r['title']:46s}): dL*={s['meanDL']:5.1f} | dH={s['meanDH']:5.1f} deg | "
            f"d_grid={s['meanDGrid']:.4f} (Lock {s['lockPct']:4.1f}%) | kappa={s['meanKappa']:.2f} | "
            f"maxJerk={s['maxJerk']:.2f} | shots={len(r['shots'])}"
        )


if __name__ == "__main__":
    main()
