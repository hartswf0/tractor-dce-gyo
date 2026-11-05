#!/usr/bin/env python3
"""
tools/build_worldtext_final.py
Synthesizes the Full Final Version of Worldtext (Iliad XVIII.478-608):
1. Per-Zone & Master Native Kokoro-82M v1.0 ONNX Homeric Rhapsode audio tracks
   (`achilles/audio/ACH-WORLD-SHIELD.mp3`, `Z01.mp3` .. `Z06.mp3`) with ancient gravitas,
   warm chest resonance (+2.8 dB < 195 Hz), stone-megaron early reflections, phorminx lyre,
   bronze anvil, river reeds, cattle/lions foley, and Oceanus surf (-14.2 LUFS).
2. The complete, unabridged 1080p Master Worldtext Film (`films/shield-of-achilles/film-worldtext-final.mp4`)
   uniting all 3 Acts of the Directorial Gardener Emergent Chronicle across the 5 concentric rings.
"""
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
    add_brick_cascade,
    add_stopmotion_footsteps_and_staff,
    make_diegetic_bed,
    make_homeric_diegetic_stems,
    master_to_lufs,
)

AUDIO_DIR = os.path.join(ROOT, "achilles/audio")
SFX_DIR = os.path.join(ROOT, "films/shield-of-achilles/shared/sfx_bank")

ZONE_CHRONICLES = [
    {
        "id": "Z01",
        "dur": 20.0,
        "amb_mode": "forge",
        "title": "Act I · Zone I: The Crucible & The Cosmic Boss (Iliad 18.478–490)",
        "voice_lines": [
            (0.35, "af_aoede", 0.85, -0.3,
             "Salt-water dries along Thetis's ankles at the threshold of Olympus. Every spark rising from the hearth is already the funeral pyre of Achilles."),
            (6.80, "am_onyx", 0.84, -0.8,
             "Therefore, Hephaestus commands the twenty bellows. First he forges a shield both great and strong, pouring five folds of bronze, tin, silver, and gold."),
            (13.40, "bm_george", 0.84, -0.8,
             "He strikes the central boss: the untiring Sun, the full Moon, and the Great Bear, who watches Orion and never tastes the bath of Ocean."),
        ],
        "diegetic": [
            (0.25, "anvil", -2.0, 0.0),
            (6.60, "anvil", -1.5, -0.2),
            (13.20, "anvil", -2.0, 0.2),
        ],
    },
    {
        "id": "Z02",
        "dur": 20.0,
        "amb_mode": "all",
        "title": "Act II · Zone II: City at Peace — Bridal Torches & The Two Talents of Gold (Iliad 18.491–508)",
        "voice_lines": [
            (0.35, "bm_george", 0.85, -0.7,
             "The celestial dome casts light downward onto the second ring. Therefore, Hephaestus speaks two cities of mortal men into the cooling bronze."),
            (6.60, "bm_fable", 0.86, -0.4,
             "Beneath pine torches brides walk through the streets, while in the Agora two men contend over the blood-price of a slain kinsman."),
            (13.00, "bm_lewis", 0.84, -0.8,
             "Therefore, the elders rise in turn from polished stones, and two talents of gold lie in the center for the judge who speaks the straightest doom."),
        ],
        "diegetic": [
            (1.20, "aulos_D5", -7.5, -0.25),
            (1.75, "aulos_F5", -7.5, -0.15),
            (7.50, "aulos_A5", -8.0, 0.25),
            (12.80, "anvil", -4.5, 0.0),
        ],
    },
    {
        "id": "Z03",
        "dur": 20.0,
        "amb_mode": "water",
        "title": "Act II · Zone III: City at War — The Siege Wall & River Ambush (Iliad 18.509–540)",
        "voice_lines": [
            (0.35, "bm_george", 0.85, -0.7,
             "Across the ridge, two armies clamp a siege around the second city, divided between sacking the citadel or splitting its wealth in half."),
            (6.70, "am_onyx", 0.85, -0.7,
             "Therefore, the besieged citizens refuse surrender. Led by tall golden Ares and Athena, their scouts crouch by the river reeds where the cattle drink."),
            (13.30, "bm_fable", 0.85, -0.5,
             "Two piping shepherds hear no bronze in the sedge; therefore the ambush springs, and crimson Fate drags the fallen through the red ford."),
        ],
        "diegetic": [
            (5.80, "bow_arrow", -4.0, -0.35),
            (11.40, "aulos_E5", -7.0, 0.20),
            (13.10, "bow_arrow", -3.0, 0.30),
            (15.60, "bull_bellow", -5.0, -0.20),
        ],
    },
    {
        "id": "Z04",
        "dur": 21.0,
        "amb_mode": "pasture",
        "title": "Act II · Zone IV: The Thrice-Ploughed Golden Glebe, Silent King & Vineyard (Iliad 18.541–572)",
        "voice_lines": [
            (0.35, "bm_george", 0.84, -0.8,
             "Seeking relief from river-blood, Hephaestus pours soft thrice-ploughed fallow land. Each ploughman strains toward the headland for a cup of sweet wine."),
            (7.20, "am_onyx", 0.84, -0.8,
             "Therefore, the metal performs the supreme marvel of the forge: the field grows black behind the plough like turned earth, though wrought of pure gold."),
            (14.10, "af_aoede", 0.85, -0.3,
             "Among the sheaves the King stands in silence, rejoicing in his heart, while in the silver-propped vineyard a boy sings the delicate Linus song."),
        ],
        "diegetic": [
            (2.20, "sickle_swath", -5.5, -0.25),
            (7.00, "anvil", -5.0, 0.0),
            (11.50, "sickle_swath", -5.5, 0.25),
            (15.50, "aulos_G5", -7.5, 0.15),
        ],
    },
    {
        "id": "Z05",
        "dur": 20.0,
        "amb_mode": "pasture",
        "title": "Act II · Zone V: Cattle of Gold and Tin & The Two Terrible Lions (Iliad 18.573–589)",
        "voice_lines": [
            (0.35, "bm_george", 0.84, -0.8,
             "Beyond the tin fence, four golden herdsmen drive straight-horned cattle of gold and tin beside the sounding river and the waving reeds."),
            (6.60, "bm_fable", 0.85, -0.5,
             "Two terrible lions leap from the reed-brake and seize the mightiest bellowing bull by the throat, dragging him down as he roars."),
            (13.00, "bm_lewis", 0.85, -0.7,
             "Therefore, the nine swift dogs rush up, yet smelling the dark blood they halt just beyond claw-reach, barking furiously and darting back."),
        ],
        "diegetic": [
            (1.10, "bull_bellow", -4.5, -0.30),
            (6.30, "lion_roar", -2.5, 0.15),
            (8.40, "bull_bellow", -3.0, -0.15),
            (12.80, "dog_bark", -3.5, 0.30),
            (16.60, "sheep_bleat", -6.5, -0.25),
        ],
    },
    {
        "id": "Z06",
        "dur": 21.0,
        "amb_mode": "water",
        "title": "Act III · Zone VI: The Knossos Choros Wheel & The Rim of Oceanus (Iliad 18.590–608)",
        "voice_lines": [
            (0.35, "af_aoede", 0.85, -0.3,
             "To bind the weight of law, ambush, harvest, and terror into one rotation, Hephaestus hammers a dancing-floor like Daedalus wrought in wide Knossos."),
            (7.00, "bm_george", 0.84, -0.8,
             "Youths and maidens spin as swiftly as a crouched potter tests his wheel between his palms. Therefore, all mortal life blurs into one golden centrifuge."),
            (14.00, "am_onyx", 0.84, -0.8,
             "Around the uttermost rim he welds the mighty River Oceanus, sealing a living universe inside the armor of a doomed man."),
        ],
        "diegetic": [
            (1.50, "aulos_D5", -7.0, -0.20),
            (6.80, "anvil", -4.0, 0.0),
            (13.80, "anvil", -1.5, 0.0),
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


def build_zone_audio(zspec, stems, diegetic_sfx):
    dur = zspec["dur"]
    n = int(round(dur * SR))
    mix = make_diegetic_bed(dur, mode=zspec["amb_mode"], seed=hash(zspec["id"]) % 997)

    # Gentle brick-assembly cascade during the opening spoken verse
    add_brick_cascade(mix, stems, 0.15, 2.2, density_hz=15.0, gain_db=-12.5, seed=hash(zspec["id"]) % 997)
    add_stopmotion_footsteps_and_staff(mix, stems, 0.4, dur - 0.5, gain_db=-16.0, with_staff=True, seed=hash(zspec["id"]) % 503)

    # Subtle Dorian phorminx lyre pulse across the chronicle
    lyre_cycle = ["lyre_D4", "lyre_A4", "lyre_F4", "lyre_G4", "lyre_C5", "lyre_D5"]
    t_lyre = 0.6
    li = 0
    while t_lyre < dur - 0.8:
        place(mix, stems[lyre_cycle[li % len(lyre_cycle)]], t_lyre, gain_db=-14.0, pan=-0.25 if li % 2 == 0 else 0.25)
        t_lyre += 1.45
        li += 1

    for t_sfx, sfx_key, sfx_db, sfx_pan in zspec["diegetic"]:
        if sfx_key == "anvil":
            place(mix, stems["anvil_metal"], t_sfx, gain_db=sfx_db, pan=sfx_pan)
            place(mix, stems["sub_hit"], t_sfx, gain_db=sfx_db - 3.0, pan=0.0)
        elif sfx_key in diegetic_sfx:
            place(mix, diegetic_sfx[sfx_key], t_sfx, gain_db=sfx_db, pan=sfx_pan)

    cursor = 0.25
    for t_req, voice, speed_val, pitch_semi, text in zspec["voice_lines"]:
        vclip = synth_voice_line(text, voice=voice, speed=speed_val, pitch_shift_semitones=pitch_semi)
        t_actual = max(float(t_req), cursor)
        clip_dur = len(vclip) / SR
        if t_actual + clip_dur > dur - 0.15:
            avail = max(1.8, (dur - 0.15) - t_actual)
            if clip_dur > avail:
                from scipy import signal as _sig
                n_fit = int(round(avail * SR))
                vclip = _sig.resample(vclip, n_fit, axis=0).astype(np.float32)
                clip_dur = avail

        s0 = max(0, int((t_actual - 0.08) * SR))
        s1 = min(n, int((t_actual + clip_dur + 0.15) * SR))
        if s1 > s0:
            mix[s0:s1] *= 0.38

        place(mix, vclip, t_actual, gain_db=2.4, pan=0.0)
        cursor = t_actual + clip_dur + 0.65

    master = master_to_lufs(mix, target_lufs=-14.2)
    lufs, tp = measure_lufs_tp(master)
    return master, lufs, tp


def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    stems = render_earshot_sfx(SFX_DIR)
    diegetic_sfx = make_homeric_diegetic_stems()

    zone_masters = []
    for z in ZONE_CHRONICLES:
        master, lufs, tp = build_zone_audio(z, stems, diegetic_sfx)
        wav_path = os.path.join(AUDIO_DIR, f"{z['id']}.wav")
        mp3_path = os.path.join(AUDIO_DIR, f"{z['id']}.mp3")
        sf.write(wav_path, master, SR, subtype="PCM_16")
        subprocess.run(
            ["ffmpeg", "-y", "-i", wav_path, "-c:a", "libmp3lame", "-b:a", "192k", mp3_path],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        os.remove(wav_path)
        zone_masters.append(master)
        print(f"  [Kokoro Worldtext] {z['id']}.mp3 ({z['dur']:.1f}s) -> {lufs:.2f} LUFS | {tp:.2f} dBTP")

    # Concatenate into full ACH-WORLD-SHIELD master audio
    full_audio = np.concatenate(zone_masters, axis=0)
    full_audio = master_to_lufs(full_audio, target_lufs=-14.2)
    full_lufs, full_tp = measure_lufs_tp(full_audio)
    full_wav = os.path.join(AUDIO_DIR, "ACH-WORLD-SHIELD.wav")
    full_mp3 = os.path.join(AUDIO_DIR, "ACH-WORLD-SHIELD.mp3")
    sf.write(full_wav, full_audio, SR, subtype="PCM_16")
    subprocess.run(
        ["ffmpeg", "-y", "-i", full_wav, "-c:a", "libmp3lame", "-b:a", "192k", full_mp3],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    print(f"  [Kokoro Master] ACH-WORLD-SHIELD.mp3 ({len(full_audio)/SR:.1f}s) -> {full_lufs:.2f} LUFS | {full_tp:.2f} dBTP")

    # Build the Master Full Final Version of Worldtext Film (film-worldtext-final.mp4)
    films_dir = os.path.join(ROOT, "films/shield-of-achilles")
    out_mp4 = os.path.join(films_dir, "film-worldtext-final.mp4")

    zone_film_sources = [
        ("Z01", os.path.join(films_dir, "film-01-huashu-motion.mp4"), 20.0),
        ("Z02", os.path.join(films_dir, "film-03-take-one.mp4"), 20.0),
        ("Z03", os.path.join(films_dir, "film-06-explainroo.mp4"), 20.0),
        ("Z04", os.path.join(films_dir, "film-04-reanimate.mp4"), 21.0),
        ("Z05", os.path.join(films_dir, "film-07-video-director.mp4"), 20.0),
        ("Z06", os.path.join(films_dir, "film-02-rossark-motion.mp4"), 21.0),
    ]

    seg_paths = []
    for zid, src_mp4, target_dur in zone_film_sources:
        probe = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", src_mp4
        ]).decode().strip()
        src_dur = float(probe)
        pts_scale = target_dur / src_dur
        seg_out = f"/tmp/worldtext_seg_{zid}.mp4"
        subprocess.run([
            "ffmpeg", "-y", "-i", src_mp4, "-an",
            "-filter:v", f"setpts={pts_scale:.6f}*PTS,fps=30",
            "-t", f"{target_dur:.3f}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-pix_fmt", "yuv420p",
            seg_out
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        seg_paths.append(seg_out)

    concat_list = "/tmp/worldtext_concat.txt"
    with open(concat_list, "w") as f:
        for sp in seg_paths:
            f.write(f"file '{sp}'\n")

    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
        "-i", full_wav,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
        "-movflags", "+faststart", out_mp4
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    os.remove(full_wav)
    for sp in seg_paths:
        if os.path.exists(sp):
            os.remove(sp)

    sz_mb = os.path.getsize(out_mp4) / (1024 * 1024)
    print(f"=== Built Master Worldtext Film: {out_mp4} ({sz_mb:.2f} MB, 122.0s, -14.2 LUFS) ===")


if __name__ == "__main__":
    main()
