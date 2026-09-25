#!/usr/bin/env python3
"""tools/lines-neural.py: a scene's spoken lines re-voiced with a neural TTS (Kokoro, open weights, run offline through ONNX), cast per
character, fitted to the time the edit gives each line, and finished for the room they are said in. It writes world/lines/<key>.ogg and
updates world/lines/index.json, the same files tools/lines.js (espeak-ng) writes, so the film plays them with no other change.

The casting gives each character a type, not an impersonation: no real performer's voice is cloned or imitated. A cast entry is
[kokoro voice, speed, semitones of pitch shift, EQ colour]; pitch is shifted with the duration kept.

Needs: pip install kokoro-onnx soundfile; the model files kokoro-v1.0.int8.onnx and voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx
releases) in $KOKORO_DIR; an ffmpeg with libopus ($FFMPEG, or imageio-ffmpeg).
Usage: python3 tools/lines-neural.py <scene> [--room store] [--only who] [--missing]
"""
import json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

MAXSPEED = 1.12
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAST = {   # who: [voice, speed, semitones, colour]
    'homer':    ['am_onyx', 0.94, -1.5, 'gruff'],
    'flanders': ['am_puck', 1.10, 2.0, 'nasal'],
    'lisa':     ['af_nova', 1.04, 3.5, 'bright'],
    'bart':     ['af_sarah', 1.08, 1.5, 'rasp'],
    'marge':    ['af_bella', 0.98, -1.0, 'rasp'],
    'clerk':    ['am_eric', 0.96, -0.5, 'flat'],
    'narrator': ['am_michael', 0.97, 0.0, 'clean'],
}
COLOUR = {   # an EQ per type: what makes a gruff voice gruff and a nasal one nasal, after the voice itself
    'gruff': 'equalizer=f=180:t=q:w=1:g=3,equalizer=f=2500:t=q:w=1:g=-2',
    'nasal': 'equalizer=f=1400:t=q:w=1.2:g=5,equalizer=f=250:t=q:w=1:g=-3',
    'bright': 'equalizer=f=3500:t=q:w=1:g=3',
    'rasp': 'equalizer=f=2800:t=q:w=1:g=3,equalizer=f=200:t=q:w=1:g=-2',
    'flat': 'equalizer=f=1000:t=q:w=2:g=-2',
    'clean': 'anull',
}
ROOMS = {   # the space the line is said in: a supermarket's hard shelves and tile give a short bright slap
    'store': 'aecho=0.8:0.55:23|41|67:0.16|0.11|0.07',
    'dry': 'anull',
}

def ffmpeg():
    if os.environ.get('FFMPEG'): return os.environ['FFMPEG']
    import imageio_ffmpeg; return imageio_ffmpeg.get_ffmpeg_exe()

def main():
    args = sys.argv[1:]; scene = args[0]; room = args[args.index('--room') + 1] if '--room' in args else 'store'
    only = args[args.index('--only') + 1] if '--only' in args else None
    kd = os.environ.get('KOKORO_DIR', '.'); tts = Kokoro(os.path.join(kd, 'kokoro-v1.0.int8.onnx') if os.path.exists(os.path.join(kd, 'kokoro-v1.0.int8.onnx')) else os.path.join(kd, 'kokoro.onnx'), os.path.join(kd, 'voices-v1.0.bin') if os.path.exists(os.path.join(kd, 'voices-v1.0.bin')) else os.path.join(kd, 'voices.bin'))
    dump = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'tools/lines-dump.js'), scene]))
    out = os.path.join(ROOT, 'world/lines'); idx_path = os.path.join(out, 'index.json'); index = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    FF = ffmpeg(); done = set()
    for e in dump['events']:
        if 'key' not in e or e['key'] in done: continue
        who = e['who'].lower().split('-')[0]
        if only and who != only: continue
        if '--missing' in args and e['key'] in index and os.path.exists(os.path.join(out, e['key'] + '.ogg')): continue   # --missing: voice only the lines not yet voiced
        voice, speed, semi, colour = CAST.get(who, CAST['narrator'])
        slot = float(e.get('slot') or 0) or None
        for attempt in range(4):   # fit the line to its slot in the edit: speed it up a little, never past MAXSPEED (1.12: faster reads as rushed; re-space the scene instead)
            samples, sr = tts.create(e['text'], voice=voice, speed=speed, lang='en-us')
            dur = len(samples) / sr
            if not slot or dur <= slot * 1.2 or speed >= MAXSPEED: break
            speed = min(MAXSPEED, speed * min(1.15, dur / (slot * 1.1)))
        # trim the model's leading and trailing silence
        a = np.abs(samples); on = np.where(a > 0.01)[0]
        if len(on): samples = samples[max(0, on[0] - int(0.02 * sr)): min(len(samples), on[-1] + int(0.08 * sr))]
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, 'l.wav'); sf.write(wav, samples, sr)
            r = 2 ** (semi / 12.0)
            chain = [f'asetrate={int(sr * r)}', f'aresample={sr}', f'atempo={1 / r:.5f}', 'highpass=f=90', COLOUR[colour], 'acompressor=threshold=-20dB:ratio=3:attack=5:release=80', ROOMS.get(room, 'anull'), 'loudnorm=I=-17:TP=-2']
            ogg = os.path.join(out, e['key'] + '.ogg')
            subprocess.run([FF, '-y', '-loglevel', 'error', '-i', wav, '-af', ','.join(chain), '-ar', '48000', '-ac', '1', '-c:a', 'libopus', '-b:a', '48k', ogg], check=True)
        sec = round(len(samples) / sr + 0.05, 2)
        index[e['key']] = {'who': e['who'], 'text': e['text'], 'sec': sec, 'voice': 'kokoro:' + voice}
        done.add(e['key']); print(f"{e['at']:6.2f} {who:9s} {sec:4.2f}s (slot {slot}) speed {speed:.2f}  {e['text']}")
    json.dump(index, open(idx_path, 'w'), indent=1)
    print(len(done), 'lines voiced')

if __name__ == '__main__': main()
