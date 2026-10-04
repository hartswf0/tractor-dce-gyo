#!/usr/bin/env python3
"""tools/making/studio.py — the LEGO film studio the making-of film is played in: one set, built once, used by the film's four
scenes (OD-B25-S01 .. OD-B25-S04, "Book 25": the making). Writes odyssey/cards/OD-B25-S0N.mpd (the same studio and cast under each
scene's id, as the forage writes a card: a plate, then the scene's group, its first child the set, then the cast) and
odyssey/previs/OD-B25-S0N.json (the shots the build reads for its camera marks).

The set, in LDraw units (y down; the audience side is -z, the far wall +z; 20 LDU a stud, 24 a brick, 8 a plate):
  floor            40 x 32 studs of dark bluish grey 8 x 8 plates: the soundstage
  little set       back left: a sand floor, a strip of sea and a painted sky flat with clouds and a sun, where Odysseus stands
                   (the wooden horse, the raft and the ram are keyframe props, tools/forage/keyprops.js)
  chair            the director's chair: a seat with a back on a reddish brown base
  desk             the agent's desk with the video editing screen (3039pd0) and a keyboard
  farm             the render farm: four tall grey towers banded with trans green lights (the machine's 4 CPUs)
  wall             the 95 MB wall: red bricks with a gate four studs wide and five high and "95" in white bricks over it
  shelf            the shelf of film reels (the kept takes; the reels are props, their number changes)
  lectern          the ledger: an open book on a stand (the git history)
  lamps            two studio lamps on stands
Every part is a real LDraw part from ldraw/parts. Run: python3 tools/making/studio.py"""
from pathlib import Path
import json, math

REPO = Path(__file__).resolve().parents[2]
SCENES = ['OD-B25-S01', 'OD-B25-S02', 'OD-B25-S03', 'OD-B25-S04', 'OD-B25-S05', 'OD-B25-S06', 'OD-B25-S07', 'OD-B25-S08']
TITLES = {'OD-B25-S01': 'THE CHARACTERS DO NOTHING', 'OD-B25-S02': 'THE CAMERA AND THE NIGHT', 'OD-B25-S03': 'THE WALL AND THE TAKES', 'OD-B25-S04': 'THE LEDGER',
          'OD-B25-S05': 'THE CARD AND THE ATLAS', 'OD-B25-S06': 'THE LOOM AT NIGHT', 'OD-B25-S07': 'THE VOICES', 'OD-B25-S08': 'THE BRIDGE'}
PART2 = {'OD-B25-S05', 'OD-B25-S06', 'OD-B25-S07', 'OD-B25-S08'}   # the second part (the origins): the loom on the set, the sweeper in the cast
HEAD = '0 Author: tools/making/studio.py (the making-of studio)\n0 !LDRAW_ORG Unofficial_Model\n0 !LICENSE Redistributable under CCAL version 2.0 : see CAreadme.txt\n'

I = (1, 0, 0, 0, 1, 0, 0, 0, 1)
RY90 = (0, 0, 1, 0, 1, 0, -1, 0, 0)      # turned a quarter about y: the part's x along -z
RY180 = (-1, 0, 0, 0, 1, 0, 0, 0, -1)
RYm90 = (0, 0, -1, 0, 1, 0, 1, 0, 0)
def ry(a): c, s = math.cos(a), math.sin(a); return (c, 0, s, 0, 1, 0, -s, 0, c)
def f(v): v = round(v, 3); return str(int(v)) if v == int(v) else str(v)
def L(col, x, y, z, part, R=I): return '1 %d %s %s %s %s %s' % (col, f(x), f(y), f(z), ' '.join(f(v) for v in R), part)
BRICK = {1: '3005.dat', 2: '3004.dat', 3: '3622.dat', 4: '3010.dat', 6: '3009.dat', 8: '3008.dat'}

def runs(row):
    """a row of cells (colour or None) as runs [start, length, colour], each split into the lengths 1 x N bricks come in"""
    out, i = [], 0
    while i < len(row):
        c = row[i]; j = i
        while j < len(row) and row[j] == c: j += 1
        n = j - i; k = i
        while n > 0:
            m = max(b for b in BRICK if b <= n); out.append((k, m, c)); k += m; n -= m
        i = j
    return [r for r in out if r[2] is not None]

def wall(grid, x0, z0, along='x', y0=0):
    """a wall of 1 x N bricks from a grid (row 0 at the bottom; each cell one stud and one brick): along x from x0 (cells at x0 + 20c
    + 10) at depth z0, or along -z from z0 at x x0 (cells at z0 - 20c - 10: read left to right from the -x side)"""
    rows = []
    for r, row in enumerate(grid):
        y = y0 - 24 * (r + 1)
        for c, n, col in runs(row):
            mid = c + n / 2
            if along == 'x': rows.append(L(col, x0 + 20 * mid, y, z0, BRICK[n]))
            else: rows.append(L(col, x0, y, z0 - 20 * mid, BRICK[n], RY90))
    return rows

FONT = {'9': ['###', '#.#', '###', '..#', '###'], '5': ['###', '#..', '###', '..#', '###']}
def glyphs(text, fg, bg, width, left, rows=5, bottom=0):
    """text in the 3 x 5 font as a grid of cells, row 0 at the bottom"""
    g = [[bg] * width for _ in range(rows + bottom)]
    x = left
    for ch in text:
        for r, line in enumerate(FONT[ch]):
            for c, p in enumerate(line):
                if p == '#': g[bottom + rows - 1 - r][x + c] = fg
        x += 4
    return g

def floor():
    return [L(72, x, 0, z, '41539.dat') for x in (-320, -160, 0, 160, 320) for z in (-240, -80, 80, 240)]

def little_set():
    rows = []
    # the sand: 2 x 4 tiles over x -380..-60, z 100..220; the sea: blue 2 x 4 tiles z 220..300
    for x in range(-380, -60, 80):           # 2 x 4 tiles turned: 4 along x, 2 along z
        for z in range(100, 300, 40):
            col = 19 if z < 220 else 73
            rows.append(L(col, x + 40, -8, z + 20, '87079.dat'))
    # the painted flat: 16 studs by 6 bricks, sky with two clouds and a sun, one stud thick at z 310
    W, H = 16, 6; g = [[212] * W for _ in range(H)]
    for r, c in [(3, 2), (3, 3), (3, 4), (3, 5), (4, 3), (4, 4), (2, 9), (2, 10), (2, 11), (3, 10), (3, 11)]: g[r][c] = 15
    for r, c in [(4, 13), (4, 14), (5, 13), (5, 14)]: g[r][c] = 14
    for c in range(W): g[0][c] = 73 if c % 3 else 1   # a sea painted along the foot of the flat
    rows += wall(g, -380, 310)
    return rows

def chair():
    """the director's chair: a 2 x 2 base a brick high, the seat with its back (4079) on it"""
    x, z = -40, -60
    return [L(70, x, -24, z, '3003.dat'), L(0, x, -32, z, '3022.dat'), L(0, x, -32, z, '4079.dat', RY180)]

def desk():
    """the agent's desk: 6 studs along x by 4 along z, two bricks high; the agent works behind it (on the far side, facing the room),
    the editing screen turned to him"""
    x0, z0 = 160, 60; rows = []
    for dx in (-50, 50):
        for dz in (-30, 30):
            rows += [L(70, x0 + dx, -24, z0 + dz, '3005.dat'), L(70, x0 + dx, -48, z0 + dz, '3005.dat')]
    rows.append(L(28, x0, -56, z0, '3032.dat'))
    rows += [L(72, x0 - 10, -80, z0 + 0, '3039pd0.dat', RY180)]     # the screen: a 45 slope with the video editing screen, facing +z
    rows += [L(0, x0 + 30, -64, z0 + 20, '3069b.dat'), L(15, x0 - 50, -64, z0 + 20, '3070b.dat')]   # a keyboard and a mug
    return rows

def farm():
    """four towers, 2 x 2, nine dark grey bricks banded with trans green plates"""
    rows = []
    for i, x in enumerate((220, 270, 320, 370)):
        y = 0
        for k in range(9):
            y -= 24; rows.append(L(72 if k % 2 == 0 else 71, x, y, 270, '3003.dat'))
            if k < 8: y -= 8; rows.append(L(34, x, y, 270, '3022.dat'))
        rows.append(L(71, x, y - 8, 270, '3068b.dat'))
    return rows

def big_wall():
    """the 95 MB wall: 12 studs along z at x 330, ten bricks high, a gate four studs wide and five bricks high (a minifigure walks through it; the player bundle does not), 95 over it"""
    W = 12; g = [[4] * W for _ in range(5)]
    for r in range(5):
        for c in range(4, 8): g[r][c] = None
    top = glyphs('95', 15, 4, W, 2, rows=5)
    return wall(g + top, 330, -60, along='z')

def shelf():
    """the reels' shelf: 10 studs along x at the far wall, two shelves on 1 x 2 posts"""
    rows = []
    for x in (-10, 190):
        for k in range(5): rows.append(L(70, x, -24 * (k + 1), 290, '3004.dat', RY90))
    rows += [L(70, 90, -48, 290, '3832.dat'), L(70, 90, -120, 290, '3832.dat')]   # 2 x 10 plates: the shelves (tops at 56 and 128)
    return rows

def lectern():
    """the ledger on its stand: an open book (white pages on a dark red cover) on a 2 x 2 column"""
    x, z = -300, -200
    rows = [L(70, x, -24, z, '3003.dat'), L(70, x, -48, z, '3003.dat'), L(320, x, -56, z, '3021.dat', RY90)]
    rows += [L(15, x - 10, -64, z, '3069b.dat', RY90), L(15, x + 10, -64, z, '3069b.dat', RY90), L(0, x, -64, z - 20, '3024.dat')]
    return rows

def loom():
    """the loom (part two only): a workbench 12 studs along x at the front right, the 24 books on it as two rows of twelve 1 x 1 tiles
    in turn colours (the books woven at once), and eight small agents behind it facing the room (the halfworld's per-book agents: one
    costume, the agent's). They are set, not cast: they do not move or speak."""
    rows, x0, z0 = [], -20, -200
    for k in range(6):                      # the bench: 2 x 2 bricks two high, a 2 x 12 plate on top
        x = x0 + 20 + 40 * k
        rows += [L(70, x, -24, z0, '3003.dat'), L(70, x, -48, z0, '3003.dat')]
    rows += [L(28, x0 + 120, -56, z0, '2445.dat', RY90)]   # 2 x 12 plate along x
    cols = [4, 14, 1, 2, 25, 15, 22, 19, 5, 13, 26, 27]
    for r, dz in enumerate((-10, 10)):
        for c in range(12): rows.append(L(cols[(c + 5 * r) % 12], x0 + 10 + 20 * c, -64, z0 + dz, '3070b.dat'))
    hair = ['11256', '3901', '13251', '12890']
    for i in range(8):                      # the agents, behind the bench (z0 + 45), turned to face -z (the room)
        x = x0 + 15 + 30 * i
        for line in figure('973', 402, 15, 15, '3626bp01', hair[i % 4], [308, 0, 6, 70][i % 4]):
            parts = line.split(); col = int(parts[1]); fx, fy, fz = map(float, parts[2:5]); R = [float(v) for v in parts[5:14]]
            # turned half round about y: x -> -x, z -> -z
            M = [-R[0], -R[1], -R[2], R[3], R[4], R[5], -R[6], -R[7], -R[8]]
            rows.append(L(col, x - fx, fy, z0 + 45 - fz, parts[14], tuple(M)))
    return rows

def lamps():
    rows = []
    for x, z in ((-400 + 30, 60), (-30, 300)):
        for k in range(5): rows.append(L(0, x, -24 * (k + 1), z, '3941.dat'))
        rows += [L(0, x, -128, z, '4032a.dat'), L(46, x, -136, z, '3062b.dat')]
    return rows

# ---- the cast: minifigures as the forage writes them (figure origin under the hips, feet on y 0) ----
ARMS = ['-15.552 -63 0 0.985 -0.085 -0.147 0.17 0.49 0.854 0 -0.867 0.498 3818.dat',
        '15.552 -63 0 0.985 0.17 0 -0.17 0.985 0 0 0 1 3819.dat']
HANDS = ['-20.611 -63.042 -21.292 0.998 0.002 -0.045 0.01 0.966 0.258 0.043 -0.258 0.965 3820.dat',
         '23.688 -45.24 -9.884 0.985 -0.12 -0.12 0.002 0.717 -0.697 0.17 0.686 0.707 3820.dat']
GRIP_R = (-20.7, -63, -30.7)   # where the right hand closes (the forage's staff passes there)
def figure(torso, tcol, legs, hips, head, hat=None, hcol=None, held=None, extra=()):
    rows = [L(hips, 0, -40, 0, '3815b.dat'), L(legs, 0, -28, 0, '3816c.dat'), L(legs, 0, -28, 0, '3817c.dat'), L(tcol, 0, -72, 0, torso + '.dat')]
    rows += ['1 %d %s' % (tcol, a) for a in ARMS] + ['1 14 %s' % h for h in HANDS]
    rows.append(L(14, 0, -96, 0, head + '.dat'))
    if hat: rows.append(L(hcol, 0, -96, 0, hat + '.dat'))
    if held:
        part, col, dy = held; rows.append(L(col, GRIP_R[0], GRIP_R[1] + dy, GRIP_R[2], part + '.dat'))
    return rows + list(extra)
ODYSSEUS = ['1 28 0 -40 0 1 0 0 0 1 0 0 0 1 3815b.dat', '1 28 0 -28 0 1 0 0 0 1 0 0 0 1 3816c.dat', '1 28 0 -28 0 1 0 0 0 1 0 0 0 1 3817c.dat',
            '1 320 0 -72 0 1 0 0 0 1 0 0 0 1 973p45.dat', '1 320 -15.552 -63 0 0.985 -0.085 -0.147 0.17 0.49 0.854 0 -0.867 0.498 3818.dat',
            '1 14 -20.611 -63.042 -21.292 0.998 0.002 -0.045 0.01 0.966 0.258 0.043 -0.258 0.965 3820.dat',
            '1 71 -20.17 -66.385 -30.628 0.998 -0.01 -0.044 0.01 0.999 0.009 0.043 -0.009 0.999 3847.dat',
            '1 320 15.552 -63 0 0.1 0.995 0 -0.995 0.1 0 0 0 1 3819.dat', '1 14 34.824 -66.086 -9.884 0.707 -0.057 -0.703 0.011 0.996 -0.071 0.706 0.042 0.707 3820.dat',
            '1 14 0 -96 0 1 0 0 0 1 0 0 0 1 3626bp88.dat', '1 308 0 -96 0 1 0 0 0 1 0 0 0 1 3901.dat', '1 320 0 -74 0 1 0 0 0 1 0 0 0 1 4524.dat']
CAST = [  # (file name, who, note, at x, z, facing y-turn, rows)
    ('director', 'THE DIRECTOR', 'the human who directs: plaid jacket, dark red beret', -40, -100, 0,
     figure('973p0l', 0, 72, 72, '3626bp35', '90386', 320)),
    ('agent', 'THE AGENT', 'Claude, the builder: orange (terracotta) torso and arms, white legs', 160, 120, math.pi,
     figure('973', 402, 15, 15, '3626bp01', '11256', 308, held=('3003', 14, -12))),
    ('cinematographer', 'THE CINEMATOGRAPHER', 'leather vest, cap with headphones', -220, -60, 0,
     figure('973p0u', 272, 72, 72, '3626bp35', '2514', 0)),
    ('odysseus', 'ODYSSEUS', 'the actor in costume: the hero\'s armour, sword and cape', -220, 170, 0, ODYSSEUS),
    ('examiner', 'THE EXAMINER', 'the forensic investigator: dark tan jacket and fedora, a magnifying glass', -300, -250, 0,
     figure('973p1y', 308, 72, 72, '3626bp01', '61506', 308, held=('30152ap01', 0, 0))),
]
# part two: the sweeper, the agent that commits a book (the halfworld's per-book sweep): the agent's orange, a cap, a broom
SWEEPER = ('sweeper', 'THE SWEEPER', 'the agent that sweeps a book into the record: orange torso, dark grey cap, a broom', 300, -120, 0,
           figure('973', 402, 72, 72, '3626bp01', '4485b', 72, held=('4332', 6, -34)))
def cast_of(sid): return CAST + [SWEEPER] if sid in PART2 else CAST

def block(name, title, rows): return f'0 FILE {name}\n0 {title}\n0 Name: {name}\n' + HEAD + '\n' + '\n'.join(rows) + '\n'

def card(sid):
    P = lambda n: f'{sid} - {n}.ldr'
    pieces = [('floor', floor()), ('little-set', little_set()), ('chair', chair()), ('desk', desk()), ('farm', farm()), ('wall', big_wall()),
              ('shelf', shelf()), ('lectern', lectern()), ('lamps', lamps())] + ([('loom', loom())] if sid in PART2 else [])
    cast = cast_of(sid)
    plate = [L(72, 0, 8, 0, '3958.dat')]   # a 6 x 6 plate under the floor's middle: the card's plate (the floor is the set)
    out = [block(f'{sid}.ldr', TITLES[sid], ['0 // card', '1 16 0 0 0 1 0 0 0 1 0 0 0 1 ' + P('plate'), '0 STEP', '1 16 0 0 0 1 0 0 0 1 0 0 0 1 ' + P('the-studio-scene'), '0 STEP'])]
    out.append(block(P('the-studio-scene'), 'the studio scene', ['0 // group', '1 16 0 0 0 1 0 0 0 1 0 0 0 1 ' + P('the-studio')] +
                     [L(16, x, 0, z, P(n), ry(a)) for n, _, _, x, z, a, _ in cast]))
    out.append(block(P('the-studio'), 'the studio', ['0 // group'] + ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 ' + P(n) for n, _ in pieces]))
    for n, rows in pieces: out.append(block(P(n), n.replace('-', ' '), rows))
    for n, who, note, *_, rows in cast: out.append(block(P(n), n, ['0 // figure: ' + note] + rows))
    out.append(block(P('plate'), 'plate', plate))
    return '\n'.join(out)

def previs(sid, shots):
    return dict(id=sid, title=TITLES[sid], book=25, set='THE LEGO FILM STUDIO', size=[40, 32], marks={}, duration=shots[-1][1],
                cast=[dict(who='character.' + n, name=n.upper(), type='character', file=f'{sid} - {n}.ldr', at=[x, 0, z]) for n, who, _, x, z, _, _ in cast_of(sid)],
                shots=[dict(n=i + 1, t0=a, t1=b, beat=beat, camera=dict(kind=kind, subject=subj, object=-1), speaker=-1, action=-1, moves=[]) for i, (a, b, beat, kind, subj) in enumerate(shots)])

BEATS = {
 'OD-B25-S01': [(0, 20, 'The animatic: the director calls action and Odysseus stands frozen on the little set.', 'establish', 3),
                (20, 40, 'The agent wires voice to intent to body.', 'medium', 1), (40, 60, 'Odysseus acts, and every movement has a cause.', 'medium', 3)],
 'OD-B25-S02': [(0, 20, 'The camera inside the ram\'s wool, then a clean shot.', 'medium', 2), (20, 40, 'The render farm at night.', 'establish', 1),
                (40, 60, 'The lights go out and the render resumes where it stopped.', 'medium', 1)],
 'OD-B25-S03': [(0, 20, 'The player bundle at the 95 MB wall.', 'establish', 1), (20, 40, 'Split into small files, it passes.', 'medium', 1),
                (40, 60, 'Keep both: the shelf of takes.', 'medium', 0)],
 'OD-B25-S04': [(0, 20, 'The examiner reads the ledger.', 'medium', 4), (20, 40, 'One gap: the music.', 'medium', 4), (40, 60, 'Make it a film.', 'pullback', 0)],
 'OD-B25-S05': [(0, 20, 'The examiner: before the bricks, the halfworld.', 'medium', 4), (20, 40, 'The card: paste this into Claude with any book.', 'medium', 1), (40, 60, 'Fan out: the loom.', 'establish', 1)],
 'OD-B25-S06': [(0, 20, 'The loom at night: every book at once.', 'establish', 1), (20, 40, 'The cap; the sweeper sweeps up three other books.', 'medium', 5), (40, 60, 'Stage explicit paths; the skip list.', 'medium', 1)],
 'OD-B25-S07': [(0, 20, 'A stage direction spoken aloud.', 'medium', 3), (20, 40, '706 of 706 lines written; re-recorded in batches.', 'medium', 1), (40, 60, 'Seven still speak the summary; the music.', 'medium', 4)],
 'OD-B25-S08': [(0, 20, 'The drawings handed across.', 'medium', 1), (20, 40, 'Word to world, stud by stud; one parent, many helpers.', 'medium', 4), (40, 60, 'The names; action.', 'pullback', 0)],
}

if __name__ == '__main__':
    for sid in SCENES:
        (REPO / 'odyssey/cards' / (sid + '.mpd')).write_text(card(sid))
        (REPO / 'odyssey/previs' / (sid + '.json')).write_text(json.dumps(previs(sid, BEATS[sid]), indent=1))
        print(sid, 'card and previs written')
