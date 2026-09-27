#!/usr/bin/env python3
"""tools/forage/product/trailers.py: checks the Odyssey trailer edit lists, odyssey/trailers/<id>.json, and writes their page,
odyssey/trailers/index.html.

  python3 tools/forage/product/trailers.py            # check all, print the table, write the page
  python3 tools/forage/product/trailers.py teaser     # check one (the page is still written with all)

What is checked, for every trailer:
  timing   shots run from 0 without gaps; each shot's `at` is the sum of the durations before it; the durations add up to `runtime`
  music    every cue's file exists in the halfworld; 0 <= in < out <= the track's measured length; cues and declared silences tile
           [0, runtime] exactly (an overlap is allowed only where the later cue says xfade); hits lie inside their cue
  voice    the segment (scene, gi) exists in drive/voice-manifest.json with the same start and dur; its text is the recorded text of
           that segment (drive-script.json's, or spoken-lines.json's line for a DIALOGUE turn); the clip's words occur in that text;
           the clip lies inside the segment and the line fits inside its shot; lines.json's verdict on which text was recorded agrees
  picture  SCENE: the keyframe spec exists and has the key; every actor named in the shot is blocked or propped in that key; the still
           exists. KIT: the card odyssey/cards/<card>.mpd and the still exist. CARD: it has text. BLACK: nothing.
  rules    the trailer's own `checks` (one voice line per shot, long holds, hits on cuts, silence before the drop, ...), evaluated here
The halfworld is found at $ODYSSEY_HALFWORLD, else ../odyssey-halfworld beside this repository.
"""
import glob, html, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitpages import STYLE, HEAD, ROOT

HW = os.environ.get('ODYSSEY_HALFWORLD') or os.path.join(os.path.dirname(ROOT), 'odyssey-halfworld')
TR = os.path.join(ROOT, 'odyssey', 'trailers')
ORDER = ['a-long-way-home', 'b-nobody', 'c-gods-watching', 'teaser']
E = html.escape
EPS = 0.011


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return 'ffmpeg'


_LEN = {}
def track_len(path):
    if path not in _LEN:
        err = subprocess.run([ffmpeg(), '-hide_banner', '-i', path], capture_output=True, text=True).stderr
        m = re.search(r'Duration:\s*(\d+):(\d+):([\d.]+)', err)
        _LEN[path] = int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]) if m else None
    return _LEN[path]


def words(t):
    t = t.lower().replace('’', "'").replace('—', ' ').replace('-', ' ')
    return [w.strip("'") for w in re.sub(r"[^a-z' ]+", ' ', t).split() if w.strip("'")]


def contains(hay, needle):
    h, n = words(hay), words(needle)
    return any(h[i:i + len(n)] == n for i in range(len(h) - len(n) + 1)) if n else False


class Sources:
    def __init__(self):
        self.manifest = json.load(open(os.path.join(HW, 'drive', 'voice-manifest.json')))
        self.script = {s['id']: s for s in json.load(open(os.path.join(HW, 'drive', 'drive-script.json')))['scenes']}
        self.spoken = json.load(open(os.path.join(HW, 'viewer', 'spoken-lines.json')))['lines']
        p = os.path.join(TR, 'lines.json')
        self.bank = {(e['scene'], e['gi']): e for e in json.load(open(p))['lines']} if os.path.exists(p) else {}
        self.specs = {}

    def spec(self, sid):
        if sid not in self.specs:
            p = os.path.join(ROOT, 'odyssey', 'keyframes', sid + '.json')
            self.specs[sid] = json.load(open(p)) if os.path.exists(p) else None
        return self.specs[sid]

    def texts(self, sid, gi):
        """the texts the segment may have been recorded with: the drive-script's, and spoken-lines.json's line for a DIALOGUE turn"""
        seg = self.script[sid]['segments'][gi]
        out = {'drive-script.json': seg['text']}
        if seg['kind'] == 'DIALOGUE':
            ln = self.spoken.get(seg.get('sourceTurnId') or '', {}).get('line')
            if ln: out['spoken-lines.json'] = ln
        return seg, out


def check(doc, src):
    errs, notes = [], []
    shots, runtime = doc['shots'], doc['runtime']
    # ── timing ──
    t = 0.0
    for i, s in enumerate(shots):
        if s['n'] != i + 1: errs.append(f"shot {i+1}: numbered {s['n']}")
        if abs(s['at'] - t) > EPS: errs.append(f"shot {s['n']}: at {s['at']} but the shots before it sum to {t:.2f}")
        if s['dur'] <= 0: errs.append(f"shot {s['n']}: duration {s['dur']}")
        t += s['dur']
    if abs(t - runtime) > EPS: errs.append(f"shot durations sum to {t:.2f}, runtime says {runtime}")
    cuts = sorted({round(s['at'], 3) for s in shots} | {round(runtime, 3)})
    # ── music ──
    spans = []
    for m in doc['music']:
        p = os.path.join(HW, m['file'])
        if not os.path.exists(p): errs.append(f"music: missing {m['file']}"); continue
        L = track_len(p)
        if L is None: errs.append(f"music: cannot measure {m['file']}")
        elif not (0 <= m['in'] < m['out'] <= L + 1e-6): errs.append(f"music {m['track']}: in {m['in']} / out {m['out']} outside 0..{L:.2f}")
        spans.append((m['at'], m['at'] + m['out'] - m['in'], 'cue', m.get('xfade', False), m['track']))
    for s in doc.get('silences', []):
        spans.append((s['at'], s['at'] + s['dur'], 'silence', False, 'silence'))
    spans.sort()
    x = 0.0
    for a, b, kind, xf, name in spans:
        if a > x + EPS: errs.append(f"music: nothing declared {x:.2f}-{a:.2f} (a gap must be a declared silence)")
        if a < x - EPS and not xf: errs.append(f"music: {name} at {a:.2f} overlaps the previous span (ends {x:.2f}) without xfade")
        x = max(x, b)
    if abs(x - runtime) > EPS: errs.append(f"music: cues and silences end at {x:.2f}, runtime {runtime}")
    for h in doc.get('hits', []):
        cue = next((m for m in doc['music'] if m['track'] == h['track'] and m['at'] - EPS <= h['trailer'] <= m['at'] + m['out'] - m['in'] + EPS), None)
        if not cue: errs.append(f"hit at {h['trailer']}: no {h['track']} cue sounds then")
        elif abs(cue['at'] + h['t'] - cue['in'] - h['trailer']) > 0.02: errs.append(f"hit at {h['trailer']}: the cue puts track {h['t']} at {cue['at'] + h['t'] - cue['in']:.2f}")
    # ── picture and voice ──
    for s in shots:
        n, k = s['n'], s['kind']
        if k == 'SCENE':
            sp = src.spec(s['scene'])
            if not sp: errs.append(f"shot {n}: no keyframe spec {s['scene']}"); continue
            key = next((q for q in sp['keys'] if q['id'] == s['key']), None)
            if not key: errs.append(f"shot {n}: {s['scene']} has no key {s['key']}"); continue
            ids = {b.get('id') for b in sp.get('blocking', []) + key.get('blocking', [])} | \
                  {p.get('id') or p.get('name') for p in sp.get('props', []) + key.get('props', []) if isinstance(p, dict)}
            for a in s.get('actors', []):
                if a not in ids: errs.append(f"shot {n}: '{a}' is not blocked or propped in {s['scene']} {s['key']}")
            if s['camera'].get('from') != s['key']: errs.append(f"shot {n}: camera from {s['camera'].get('from')} but key {s['key']}")
            rep = os.path.join(ROOT, 'odyssey', 'keyframes', s['scene'], 'report.json')
            if os.path.exists(rep):
                r = next((q for q in json.load(open(rep))['keys'] if q['id'] == s['key']), None)
                if r and not r.get('pass'): notes.append(f"shot {n}: {s['scene']} {s['key']} failed its gate ({'; '.join(r.get('fails', [])[:2])})")
        elif k == 'KIT':
            if not os.path.exists(os.path.join(ROOT, 'odyssey', 'cards', s['kit'] + '.mpd')): errs.append(f"shot {n}: no card {s['kit']}.mpd")
        elif k == 'CARD':
            if not (s.get('card') or {}).get('text'): errs.append(f"shot {n}: a CARD without text")
        elif k != 'BLACK':
            errs.append(f"shot {n}: unknown kind {k}")
        if s.get('still') and not os.path.exists(os.path.normpath(os.path.join(TR, s['still']))): errs.append(f"shot {n}: still {s['still']} missing")
        v = s.get('voice')
        if not v: continue
        seg = next((g for g in src.manifest.get(v['scene'], {}).get('segments', []) if g['gi'] == v['gi']), None)
        if not seg: errs.append(f"shot {n}: {v['scene']} gi {v['gi']} is not in the voice manifest"); continue
        if abs(seg['start'] - v['start']) > 1e-6 or abs(seg['dur'] - v['dur']) > 1e-6:
            errs.append(f"shot {n}: {v['scene']} gi {v['gi']} is start {seg['start']} dur {seg['dur']} in the manifest, not {v['start']}/{v['dur']}")
        sg, texts = src.texts(v['scene'], v['gi'])
        if sg['speakerName'] != v['speaker']: errs.append(f"shot {n}: speaker {v['speaker']}, the script says {sg['speakerName']}")
        if v['recorded_text_source'] not in texts or texts[v['recorded_text_source']] != v['text']:
            errs.append(f"shot {n}: voice text is not the {v['recorded_text_source']} text of {v['scene']} gi {v['gi']}")
        if not contains(v['text'], v['words']): errs.append(f"shot {n}: the words '{v['words']}' are not in the segment's text")
        b = src.bank.get((v['scene'], v['gi']))
        if not b: notes.append(f"shot {n}: {v['scene']} gi {v['gi']} has no entry in lines.json (unverified)")
        elif b['recorded_text_source'] != v['recorded_text_source']: errs.append(f"shot {n}: lines.json says the recording is the {b['recorded_text_source']} text")
        elif b['flags']: errs.append(f"shot {n}: lines.json flags this segment: {b['flags'][0]}")
        c = v['clip']
        if not (0 <= c['in'] < c['out'] <= v['dur'] + 1e-6): errs.append(f"shot {n}: clip {c['in']}-{c['out']} outside the segment (0-{v['dur']})")
        if v['at'] < 0 or v['at'] + c['out'] - c['in'] > s['dur'] + 1e-6:
            errs.append(f"shot {n}: the line ({c['out'] - c['in']:.2f} s at {v['at']}) does not fit the shot ({s['dur']} s)")
    # ── the cut's own rules ──
    results = [rule(doc, c, cuts) for c in doc.get('checks', [])]
    return errs, notes, results


def rule(doc, c, cuts):
    shots, T, arg = doc['shots'], c['test'], c.get('arg')
    ok, why = True, ''
    exc = set(c.get('except_shots', []))
    voiced = [s for s in shots if s.get('voice')]
    within = lambda s, a: s['at'] >= a['from'] - EPS and s['at'] + s['dur'] <= a['to'] + EPS
    if T == 'max_voice_per_shot':
        ok = all(not isinstance(s.get('voice'), list) or len(s['voice']) <= arg for s in shots)
    elif T == 'max_voice_total':
        ok = len(voiced) <= arg; why = f"{len(voiced)} lines"
    elif T == 'min_shot_dur':
        bad = [s['n'] for s in shots if s['kind'] not in c.get('except_kinds', []) and s['n'] not in exc and s['dur'] < arg - EPS]
        ok = not bad; why = f"short: {bad}" if bad else ''
    elif T == 'mean_shot_dur':
        ss = [s for s in shots if within(s, arg)]; mean = sum(s['dur'] for s in ss) / max(1, len(ss))
        ok = mean <= arg['max'] + EPS; why = f"mean {mean:.2f} s over {len(ss)} shots"
    elif T == 'max_shot_dur':
        ss = [s for s in shots if within(s, arg)]; mx = max((s['dur'] for s in ss), default=0)
        ok = mx <= arg['max'] + EPS; why = f"longest {mx:.2f} s over {len(ss)} shots"
    elif T == 'hits_on_cuts':
        off = [h['trailer'] for h in doc.get('hits', []) if min(abs(h['trailer'] - x) for x in cuts) > arg]
        ok = not off; why = f"{len(doc.get('hits', []))} hits" + (f"; off a cut: {off}" if off else '')
    elif T == 'cards_on_hits_or_drum_sfx':
        hits = [h['trailer'] for h in doc.get('hits', [])]
        bad = [s['n'] for s in shots if s['kind'] == 'CARD' and not any(abs(s['at'] - h) <= 0.06 for h in hits) and not any('drum' in x for x in s['sfx'])]
        ok = not bad; why = f"cards off a drum: {bad}" if bad else ''
    elif T == 'silence_before':
        prev = next((s for s in shots if abs(s['at'] + s['dur'] - arg['at']) <= 0.06), None)
        ok = bool(prev and (prev['kind'] == 'BLACK' or prev.get('silence')) and prev['dur'] >= arg['min'] - EPS)
        why = f"shot {prev['n']} {prev['kind']} {prev['dur']} s" if prev else 'no shot ends there'
    elif T == 'no_speaker':
        bad = [s['n'] for s in voiced if s['voice']['speaker'] in arg and s['n'] not in exc]
        ok = not bad; why = f"shots {bad}" if bad else ''
    elif T == 'min_cards':
        n = sum(1 for s in shots if s['kind'] == 'CARD'); ok = n >= arg; why = f"{n} cards"
    elif T == 'voice_words_contain':
        n = sum(1 for s in voiced if arg['word'].lower() in words(s['voice']['words'])); ok = n >= arg['min']; why = f"{n} lines"
    elif T == 'last_shot_after_title':
        t = [s for s in shots if s['kind'] == 'CARD' and 'ODYSSEY' in s['card']['text']]
        ok = bool(t) and shots[-1]['kind'] != 'CARD' and t[-1]['n'] < shots[-1]['n']
    elif T == 'max_locations':
        locs = {s.get('scene') or s.get('kit') for s in shots if s['kind'] in ('SCENE', 'KIT')}; ok = len(locs) <= arg; why = ', '.join(sorted(locs))
    elif T == 'gods_return':
        marks = [s['at'] for s in shots if set(s.get('actors', [])) & set(arg['ids']) or (s.get('voice') and s['voice']['speaker'] in arg['speakers'])
                 or (s.get('kit') or '').startswith('set.the-opening')]
        gaps = [b - a for a, b in zip([0.0] + marks, marks + [doc['runtime']])]
        ok = max(gaps) <= arg['every'] + EPS; why = f"longest stretch without a god: {max(gaps):.1f} s"
    else:
        ok, why = False, 'unknown test'
    return {'id': c['id'], 'test': T, 'ok': ok, 'why': why}


# ─────────────────────────────── the page ───────────────────────────────
PAGE_CSS = '''
.opt { margin-top: 18px; }
.strip { display: flex; gap: 2px; overflow-x: auto; padding: 4px 0 10px; }
.strip .f { flex: 0 0 auto; position: relative; height: 92px; background: #000; overflow: hidden; }
.strip .f img { height: 100%; width: 100%; object-fit: cover; display: block; }
.strip .f .t { position: absolute; left: 3px; top: 2px; font: 600 10px Inter, sans-serif; color: #fff; text-shadow: 0 0 3px #000; }
.strip .f .v { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: var(--gold); }
.strip .f.card, .strip .f.black { display: flex; align-items: center; justify-content: center; }
.strip .f.card span { color: #eee; font: 700 10px 'Cormorant Garamond', Georgia, serif; letter-spacing: .12em; text-align: center; padding: 0 4px; }
.lane { position: relative; height: 26px; background: var(--card); border: 1px solid var(--rule); margin: 6px 0 2px; }
.lane i { position: absolute; top: 3px; bottom: 3px; font: 600 10px/20px Inter, sans-serif; color: var(--paper); background: var(--ink); overflow: hidden; white-space: nowrap; padding-left: 4px; font-style: normal; }
.lane i.sil { background: repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 7px); color: var(--muted); }
.lane b { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--bad); }
.scale { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }
.rules { columns: 2; column-gap: 28px; font-size: 14px; } .rules li { break-inside: avoid; margin: 3px 0; }
.chk { font-size: 13px; } .chk span { display: inline-block; margin: 2px 10px 2px 0; }
.chk .ok { color: var(--ok); } .chk .bad { color: var(--bad); }
details { margin: 10px 0; } summary { cursor: pointer; font-weight: 600; }
td.pic { min-width: 260px; } td.snd { min-width: 240px; color: var(--muted); }
td.time { white-space: nowrap; font-variant-numeric: tabular-nums; }
.gaps li { margin: 6px 0; }
@media (max-width: 800px) { .rules { columns: 1; } .strip .f { height: 64px; } }
'''


def fmt(t):
    return f"{int(t // 60)}:{t % 60:04.1f}"


def strip(doc):
    px = 22   # pixels per second
    out = ['<div class="strip">']
    for s in doc['shots']:
        w = max(10, round(s['dur'] * px))
        lab = f'<span class="t">{s["n"]} · {fmt(s["at"])}</span>'
        vv = '<span class="v" title="voice"></span>' if s.get('voice') else ''
        tip = E(f"{s['n']}. {s.get('scene') or s.get('kit') or s['kind']} {s.get('key') or ''} · {s['action'] or ''}")
        if s['kind'] in ('SCENE', 'KIT'):
            out.append(f'<div class="f" style="width:{w}px" title="{tip}"><img loading="lazy" src="{E(s["still"])}" alt="{tip}">{lab}{vv}</div>')
        elif s['kind'] == 'CARD':
            out.append(f'<div class="f card" style="width:{w}px" title="{tip}"><span>{E(s["card"]["text"])}</span>{lab}</div>')
        else:
            out.append(f'<div class="f black" style="width:{w}px" title="black">{lab}</div>')
    out.append('</div>')
    return '\n'.join(out)


def lanes(doc):
    R = doc['runtime']; pc = lambda t: f"{100 * t / R:.3f}%"
    cues = ''.join(f'<i style="left:{pc(m["at"])};width:{pc(m["out"] - m["in"])}" title="{E(m["track"])} {m["in"]}-{m["out"]}">{E(m["track"])}</i>' for m in doc['music'])
    sil = ''.join(f'<i class="sil" style="left:{pc(s["at"])};width:{pc(s["dur"])}" title="{E(s["why"])}">silence</i>' for s in doc.get('silences', []))
    hits = ''.join(f'<b style="left:{pc(h["trailer"])}" title="{E(h["what"])} ({fmt(h["trailer"])})"></b>' for h in doc.get('hits', []))
    voice = ''.join(f'<i style="left:{pc(s["at"] + s["voice"]["at"])};width:{pc(s["voice"]["clip"]["out"] - s["voice"]["clip"]["in"])};background:var(--gold)" title="{E(s["voice"]["speaker"] + ": " + s["voice"]["words"])}"></i>' for s in doc['shots'] if s.get('voice'))
    return (f'<div class="lane" aria-label="music">{cues}{sil}{hits}</div><div class="lane" aria-label="voice">{voice}</div>'
            f'<div class="scale"><span>0:00</span><span>music (red: hits on cuts) · voice</span><span>{fmt(R)}</span></div>')


def script_table(doc):
    rows = []
    for s in doc['shots']:
        if s['kind'] == 'SCENE': pic = f"<b>{E(s['scene'])} {E(s['key'])}</b> · {E(s['action'])}"
        elif s['kind'] == 'KIT': pic = f"<b>KIT {E(s['kit'])}</b> · {E(s['action'])}"
        elif s['kind'] == 'CARD': pic = f"<b>CARD</b> “{E(s['card']['text'])}” <span class=\"meta\">{E(s['card']['style'])}</span>"
        else: pic = f"<b>BLACK</b> {E(s['action'])}"
        mv = (s.get('camera') or {}).get('move')
        if mv and mv['type'] != 'hold': pic += f" <span class=\"meta\">camera {E(mv['type'])} {mv['amount']}{' stepped' if mv.get('stepped') else ''}</span>"
        if s.get('look'): pic += f" <span class=\"meta\">look: {E(s['look'].get('time', ''))}</span>"
        snd = []
        if s.get('voice'):
            v = s['voice']; snd.append(f"<b>{E(v['speaker'])}</b>: “{E(v['words'])}” <span class=\"meta\">{E(v['scene'])} gi {v['gi']} · {v['clip']['in']:.2f}–{v['clip']['out']:.2f}</span>")
        if s['sfx']: snd.append('sfx: ' + E(', '.join(s['sfx'])))
        if s.get('silence'): snd.append('<i>no music</i>')
        rows.append(f"<tr><td class=\"time\">{fmt(s['at'])}<br><span class=\"meta\">{s['dur']:.2f} s</span></td><td class=\"pic\">{pic}<br><span class=\"meta\">{E(s['why'])}</span></td><td class=\"snd\">{'<br>'.join(snd) or '—'}</td></tr>")
    return '<div class="tablewrap"><table><tr><th>time</th><th>picture</th><th>sound</th></tr>' + '\n'.join(rows) + '</table></div>'


def music_table(doc):
    rows = [f"<tr><td class=\"time\">{fmt(m['at'])}–{fmt(m['at'] + m['out'] - m['in'])}</td><td><b>{E(m['track'])}</b><br><span class=\"meta\">{E(m['album'])}</span></td>"
            f"<td class=\"n\">{m['in']:.2f} → {m['out']:.2f}</td><td class=\"n\">{m['gain']} dB</td><td>{E(m['note'])}</td></tr>" for m in doc['music']]
    rows += [f"<tr><td class=\"time\">{fmt(s['at'])}–{fmt(s['at'] + s['dur'])}</td><td><i>silence</i></td><td></td><td></td><td>{E(s['why'])}</td></tr>" for s in doc.get('silences', [])]
    return '<div class="tablewrap"><table><tr><th>trailer</th><th>track</th><th>in → out (s)</th><th>gain</th><th>why</th></tr>' + ''.join(rows) + '</table></div>'


GAPS = [
    ("KIT shots need their cards staged as locations", "b-nobody 1, 5, 13 and c-gods-watching 1 cut to set.the-opening, set.bag-of-winds, set.cyclops-cave-headland and set.the-opening-turned. None is a filmed location yet; the renderer must load the .mpd card as a set (camera from the kit still, then the move). The headland shot also needs the other Cyclopes placed outside the cave mouth: they exist only in OD-B09-S09 (hidden there as 'cyclopes outside 1-4')."),
    ("Looks are overrides the gate never saw", "The Nolan cut re-lights nearly every key (dusk backlight, night, storm, lamp). These keys passed their gates in their own light; a relit frame should be re-gated (framing does not change, legibility can)."),
    ("Cards, black and the title builds", "CARD shots are typography, not sets: four styles (nolan, nolan-title, brick, bronze). The brick title in b-nobody is an animation of 1x2 plates snapping on, which needs a small build-up renderer or a pre-rendered clip."),
    ("Sound effects are named, not sourced", "Every sfx (drum, surf, bowstring, record scratch, oink, stud click...) is a name; there is no effects library in the repository. The single low drums in the Nolan cut are the score's own (Trial of the Bow), except the two on the last card, which need a sample."),
    ("Actions beyond the key", "Several actions animate between or past a key's pose: Polyphemus toppling asleep (B09-S09 K1), the Scylla heads lifting (B12-S04 K5), the bag bursting (B10-S01 K4), Argos's tail, the raft tipping (B05-S05 K3), the camera orbit/crane moves. The take mode eases between keys; these need either a second key or a scripted prop animation."),
    ("Gate failures avoided", "No shot uses a key that failed its gate (B09-S09 K2, B12-S03 K3/K4, B12-S04 K4, B12-S07 K4, B10-S01 K5, B10-S02 K2/K3, B05-S04 K4, B12-S06 K2/K3, B24-S05 K3/K4, B04-S05 K3). If a re-shoot passes, B12-S04 K4 (the heads striking) and B09-S09 K2 (the stake heating) are the ones worth having."),
    ("Lines that cannot be used as written", "“You dogs…” (OD-B22-S01 gi 6), Penelope's bed test (OD-B23-S04 gi 2 and 7), “I am Odysseus, home in the twentieth year” (OD-B24-S03 gi 5), Laertes's challenge (gi 7), Penelope's “Only come back to this bed” (OD-B23-S05 gi 6), the scar reveal (OD-B21-S04 gi 3) and Zeus's thunder line (OD-B21-S07 gi 5) were recorded as the drive-script's summary sentence, not the spoken-lines.json line; three of them also begin with a spoken direction. “Tell me, O Muse, of the man…” was never recorded. These need re-recording to be used; see lines.json."),
]


def page(docs, results):
    out = [HEAD.format(title='The Odyssey: trailers', style=STYLE + PAGE_CSS)]
    tot = sum(len(d['shots']) for d in docs)
    out.append('''  <div class="kicker">Word to World · the Odyssey in LEGO</div>
  <h1>Trailers</h1>
  <p class="lede">Three trailers and a teaser for the brick Odyssey, as edit lists a renderer can play: every shot is a filmed keyframe, a kit,
    a card or black; every line is a recorded voice clip checked word by word against its audio; every cut that should land on the score does.
    The rules each cut follows are written into it and tested here.</p>''')
    out.append(f'''  <div class="stats">
    <div><b>{len(docs)}</b><span>cuts</span></div>
    <div><b>{tot}</b><span>shots</span></div>
    <div><b>{sum(1 for d in docs for s in d["shots"] if s.get("voice"))}</b><span>voice clips</span></div>
    <div><b>{sum(1 for r in results.values() if not r[0])} / {len(docs)}</b><span>pass every check</span></div>
  </div>
  <p class="sub">Read first: <a href="REFERENCE.md">REFERENCE.md</a> (what the studio trailer and The LEGO Movie do, and what the first brick trailer lacked) ·
    <a href="lines.json">lines.json</a> (every voice segment auditioned, with its word timings) · each cut as a script: {" · ".join(f'<a href="{d["id"]}.md">{E(d["id"])}.md</a>' for d in docs)}</p>''')
    for d in docs:
        errs, notes, res = results[d['id']]
        out.append(f'<h2 id="{E(d["id"])}">{E(d["title"])}</h2>')
        out.append(f'<p class="meta"><b>{E(d["register"])}</b> · {d["runtime"]:.2f} s · {len(d["shots"])} shots · '
                   f'{sum(1 for s in d["shots"] if s.get("voice"))} lines · {len(d["music"])} music cue{"s" if len(d["music"]) != 1 else ""} · '
                   + ('<span class="badge ok">checks pass</span>' if not errs and all(r['ok'] for r in res) else f'<span class="badge bad">{len(errs)} errors</span>') + '</p>')
        out.append(f'<p class="lede" style="font-size:17px">{E(d["idea"])}</p>')
        out.append('<div class="opt">' + strip(d) + lanes(d) + '</div>')
        out.append('<h3 style="margin-top:22px">Rules</h3><ol class="rules">' + ''.join(f'<li>{E(r)}</li>' for r in d['rules']) + '</ol>')
        out.append('<p class="chk">' + ''.join(f'<span class="{"ok" if r["ok"] else "bad"}">{"✓" if r["ok"] else "✗"} {E(r["id"])}{": " + E(r["why"]) if r["why"] else ""}</span>' for r in res) + '</p>')
        out.append('<details open><summary>Script</summary>' + script_table(d) + '</details>')
        out.append('<details><summary>Music plan</summary>' + music_table(d) + '</details>')
        if errs or notes:
            out.append('<details><summary>Validator notes</summary><ul>' + ''.join(f'<li class="bad">{E(e)}</li>' for e in errs) + ''.join(f'<li>{E(n)}</li>' for n in notes) + '</ul></details>')
    out.append('<h2>What the render path must still build</h2><ul class="gaps">' + ''.join(f'<li><b>{E(a)}.</b> {E(b)}</li>' for a, b in GAPS) + '</ul>')
    out.append('<footer>Written by <code>tools/forage/product/trailers.py</code> from <code>odyssey/trailers/*.json</code>. Every number here is measured when it runs.</footer>\n</main>\n</body>\n</html>\n')
    open(os.path.join(TR, 'index.html'), 'w').write('\n'.join(out))


def main(argv):
    src = Sources()
    ids = [i for i in ORDER if os.path.exists(os.path.join(TR, i + '.json'))]
    ids += sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(TR, '*.json')) if os.path.basename(p)[:-5] not in ids + ['lines'])
    docs = [json.load(open(os.path.join(TR, i + '.json'))) for i in ids]
    results = {d['id']: check(d, src) for d in docs}
    show = [d for d in docs if not argv or d['id'] in argv]
    print(f"{'trailer':18s} {'runtime':>8s} {'shots':>5s} {'lines':>5s} {'music':>5s} {'kits':>4s} {'cards':>5s} {'rules':>7s} {'errors':>6s}")
    for d in show:
        errs, notes, res = results[d['id']]
        k = sum(1 for s in d['shots'] if s['kind'] == 'KIT'); c = sum(1 for s in d['shots'] if s['kind'] == 'CARD')
        print(f"{d['id']:18s} {d['runtime']:8.2f} {len(d['shots']):5d} {sum(1 for s in d['shots'] if s.get('voice')):5d} {len(d['music']):5d} {k:4d} {c:5d} "
              f"{sum(r['ok'] for r in res):3d}/{len(res):<3d} {len(errs):6d}")
    for d in show:
        errs, notes, res = results[d['id']]
        for e in errs: print(f"  ERROR {d['id']}: {e}")
        for r in res:
            if not r['ok']: print(f"  RULE  {d['id']}: {r['id']} failed ({r['why']})")
        for n in notes: print(f"  note  {d['id']}: {n}")
    page(docs, results)
    print('wrote odyssey/trailers/index.html')
    return 1 if any(results[d['id']][0] or not all(r['ok'] for r in results[d['id']][2]) for d in show) else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
