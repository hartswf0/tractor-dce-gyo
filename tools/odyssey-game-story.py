#!/usr/bin/env python3
"""tools/odyssey-game-story.py: the whole Odyssey as the spine of Nobody's Hands (play/odyssey-game.html).

  python3 tools/odyssey-game-story.py [--no-audio]

The spine is the Regulars' Cut (odyssey/kits/cut.json, tools/forage/product/cut.py): 102 kept scenes in story order across
the 24 books, each with its kept voice segments on the cut clock, the book's bed, and 11 music bridges over what was cut.
Writes play/odyssey-game/story.json: 24 books, each a list of items played in order —
  scene   a voiced cinematic: the scene's Butter card (odyssey/butter/<id>.json) staged, its kept segments as one clip
          (play/odyssey-game/cut/<id>.ogg: the segments end to end with the cut's 0.45 s breaths, Opus mono), captions from
          the halfworld's spoken lines (dialogue) or the drive script (narration), the key cameras when the scene has
          gate-checked keyframes (odyssey/keyframes/<id>.json), and, where natural, a TOUCH: a small hand action that
          never blocks the story;
  level   a hand-verb level at the poem's turn (play/odyssey-game/levels/<id>.json names the scenes it plays); the scene
          cinematic stays in the item as its fallback, so a level can be skipped and the story watched through;
  bridge  the cut's bed-only bridge: a title card over the book's music, covering scenes the cut left out.
Beds: the book's BRONZE COUNCIL track, odyssey/take/bed/bronze-council-NN.ogg (copied from the halfworld when missing).
The halfworld is read from ODYSSEY_HALFWORLD or ../odyssey-halfworld (read only).
"""
import glob, json, os, re, shutil, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HW = os.environ.get('ODYSSEY_HALFWORLD') or os.path.join(os.path.dirname(ROOT), 'odyssey-halfworld')
GAME = os.path.join(ROOT, 'play/odyssey-game')
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import importlib.util
spec = importlib.util.spec_from_file_location('trailer_sound', os.path.join(ROOT, 'tools/trailer-sound.py'))
TS = importlib.util.module_from_spec(spec); spec.loader.exec_module(TS)
FF, SR = TS.FF, TS.SR

# where each book happens on the voyage chart (0..1, x east, y south) and what the place is called
PLACES = {1: ('Olympus · Ithaca', .74, .40), 2: ('Ithaca: the assembly', .80, .36), 3: ('Pylos', .90, .27), 4: ('Sparta', .96, .39),
          5: ('Ogygia', .10, .72), 6: ('Scheria: the river', .55, .13), 7: ('Scheria: the palace', .61, .09), 8: ('Scheria: the games', .67, .13),
          9: ('The Cyclops', .30, .30), 10: ('Aeolia · Aeaea', .44, .20), 11: ('The Dead', .06, .30), 12: ('Sirens · Scylla · the Sun', .27, .56),
          13: ('Ithaca: the shore', .71, .50), 14: ("Eumaeus's hut", .69, .59), 15: ('Home from Pylos', .85, .46), 16: ('The hut', .72, .67),
          17: ('The palace door', .78, .62), 18: ('The hall', .84, .60), 19: ('The hall by night', .89, .66), 20: ('The last feast', .85, .73),
          21: ('The bow', .79, .73), 22: ('The hall', .73, .78), 23: ('The chamber', .79, .84), 24: ("Laertes's farm", .88, .81)}
# a small hand action inside a cinematic: verb, the thing, the sentence; `seg` is the kept segment it rides on (index)
TOUCHES = {
    'OD-B01-S05': ('pinch', 'the spear', 'Take the stranger\'s spear: pinch it', 0),
    'OD-B02-S02': ('weave', 'the shuttle', 'Unweave the shroud: sweep your hand left and right', 1),
    'OD-B03-S02': ('pour', 'the libation', 'Pour the libation: pinch the cup and tip it down', 0),
    'OD-B04-S04': ('circle', 'the horse', 'Helen circles the horse: trace a circle', 1),
    'OD-B06-S02': ('pinch', 'the ball', 'Catch the ball: pinch it', 1),
    'OD-B07-S03': ('fist', "the queen's knees", 'Clasp the queen\'s knees: close your hand', 1),
    'OD-B08-S05': ('pinch', 'the lyre', 'Hand Demodocus the lyre: pinch it', 0),
    'OD-B10-S05': ('pinch', 'the moly', 'Take the moly from Hermes: pinch it', 1),
    'OD-B11-S01': ('point', 'the blood pit', 'Hold the shades back: point at the pit and hold', 1),
    'OD-B13-S04': ('thrust', 'the stone', 'Seal the treasure cave: push the stone', 1),
    'OD-B14-S01': ('open', 'the dogs', 'Calm the dogs: show an open palm', 0),
    'OD-B15-S05': ('pump', 'the oars', 'Row ashore in secret: pump your hand', 0),
    'OD-B16-S03': ('open', 'his son', 'The embrace: open both hands', 2),
    'OD-B17-S03': ('weave', 'old Argos', 'Stroke old Argos: move your hand gently side to side', 1),
    'OD-B18-S02': ('fist', 'Irus', 'Drop Irus: close your fist', 2),
    'OD-B19-S04': ('point', 'the scar', 'Point to the scar', 1),
    'OD-B20-S05': ('open', 'the vision', 'Shield your eyes from the vision: open palm', 1),
    'OD-B22-S01': ('pinch', 'the arrow', 'Loose the arrow: pinch and open', 1),
    'OD-B24-S09': ('open', 'the peace', 'Make peace: show an open palm', 2),
}


def ogg_opus(x, path):
    y = np.clip(x.mean(1) if x.ndim == 2 else x, -1, 1).astype('<f4')
    subprocess.run([FF, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libopus', '-b:a', '32k', '-ar', '48000', path],
                   input=y.tobytes(), check=True)


def bed_file(num):
    """odyssey/take/bed/bronze-council-NN.ogg, copied from the halfworld album when the take has not copied it"""
    dst = os.path.join(ROOT, 'odyssey/take/bed', 'bronze-council-%02d.ogg' % num)
    if not os.path.exists(dst):
        alb = json.load(open(os.path.join(HW, 'audio/albums.json')))['albums'][0]
        t = next(t for t in alb['tracks'] if t['num'] == num)
        src = os.path.join(HW, alb['dir'], t['file']) if 'dir' in alb else os.path.join(HW, 'audio', alb['name'], t['file'])
        shutil.copyfile(src, dst); print('bed copied:', os.path.basename(dst))
    return os.path.basename(dst)


def main(argv):
    audio = '--no-audio' not in argv
    cut = json.load(open(os.path.join(ROOT, 'odyssey/kits/cut.json')))
    ds = {s['id']: s for s in json.load(open(os.path.join(HW, 'drive/drive-script.json')))['scenes']}
    spoken = json.load(open(os.path.join(HW, 'viewer/spoken-lines.json')))['lines']
    keyed = {os.path.basename(f)[:-5] for f in glob.glob(os.path.join(ROOT, 'odyssey/keyframes/OD-*.json'))}
    levels = {}
    for f in sorted(glob.glob(os.path.join(GAME, 'levels/*.json'))):
        d = json.load(open(f))
        for sid in d.get('scenes', []): levels[sid] = d['id']
    per_book = {b['book']: b for b in cut['totals']['per_book']}
    bridges = {b['after']: b for b in cut['bridges']}
    os.makedirs(os.path.join(GAME, 'cut'), exist_ok=True)
    books = []
    for n in range(1, 25):
        pb = per_book.get(n, {}); place, cx, cy = PLACES[n]
        book = dict(n=n, roman=pb.get('roman'), title=pb.get('title') or ds[next(i for i in ds if ds[i]['book'] == n)]['bookTitle'],
                    place=place, chart=[cx, cy], bed=bed_file(n), items=[], minutes=pb.get('cut_min'))
        scenes = [s for s in cut['scenes'] if s['book'] == n]
        placed = set()
        for s in scenes:
            sid = s['id']; d = ds[sid]
            segs = []
            for g in s['segments']:
                seg = d['segments'][g['gi']]; line = (spoken.get(seg.get('sourceTurnId')) or {}).get('line') or ''
                is_line = bool(line) and seg['kind'] == 'DIALOGUE'
                segs.append(dict(gi=g['gi'], at=round(g['at'] - s['at'], 3), dur=g['dur'], kind=g['kind'], speaker=seg['speakerName'],
                                 caption=line if is_line else seg['text'], isLine=is_line, tags=g.get('tags', [])))
            item = dict(type='scene', id=sid, title=s['title'], seconds=s['seconds'], file='cut/%s.ogg' % sid, keyframes=sid in keyed, segs=segs)
            t = TOUCHES.get(sid)
            if t: item['touch'] = dict(verb=t[0], thing=t[1], text=t[2], seg=min(t[3], len(segs) - 1))
            lv = levels.get(sid)
            if lv:
                if lv in placed:
                    book['items'][-1]['covers'].append(item)   # the level plays this scene too
                else:
                    placed.add(lv); book['items'].append(dict(type='level', id=lv, covers=[item]))
            else:
                book['items'].append(item)
            if audio:
                path = os.path.join(GAME, 'cut', sid + '.ogg')
                if not os.path.exists(path):
                    src = os.path.join(ROOT, 'odyssey/take/voice', sid + '.m4a')
                    if not os.path.exists(src): src = os.path.join(HW, s['file'])
                    total = np.zeros((int((s['seconds'] + 0.5) * SR), 2))
                    for g in s['segments']:
                        x = TS.decode(src, g['start'], g['dur']); k = int(0.012 * SR)
                        w = np.ones(len(x)); w[:k] = np.linspace(0, 1, k); w[-k:] = np.linspace(1, 0, k); x = x * w[:, None]
                        a = int((g['at'] - s['at']) * SR); x = x[: max(0, len(total) - a)]; total[a:a + len(x)] += x
                    pk = np.abs(total).max() + 1e-9; ogg_opus(total / pk * 0.89, path)
            b = bridges.get(sid)
            if b:
                num = int(re.search(r' - (\d\d)_', b['music']['file']).group(1))
                book['items'].append(dict(type='bridge', kind=b['kind'], seconds=b['seconds'], text=b['text'], bed=bed_file(num), at=b['music'].get('in', 0),
                                          covers=b['covers']))
        books.append(book)
        print('Book %2d %-38s %2d items: %s' % (n, book['title'][:38], len(book['items']), ' '.join(i['type'][0] + ('*' if i.get('touch') else '') for i in book['items'])))
    story = dict(title="The Odyssey — the Regulars' Cut, played by hand", source='odyssey/kits/cut.json', runtime_min=cut['totals']['runtime_min'],
                 scenes=sum(1 for b in books for i in b['items'] for _ in ([i] if i['type'] == 'scene' else i.get('covers', []))), books=books)
    json.dump(story, open(os.path.join(GAME, 'story.json'), 'w'), indent=1, ensure_ascii=False)
    print('story.json:', len(books), 'books,', story['scenes'], 'scenes,', sum(1 for b in books for i in b['items'] if i['type'] == 'level'), 'levels,',
          sum(1 for b in books for i in b['items'] if i.get('touch')), 'touches')


if __name__ == '__main__':
    main(sys.argv[1:])
