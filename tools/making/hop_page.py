#!/usr/bin/env python3
"""tools/making/hop_page.py — the "Hearts of Plastic" section of the making-of page (odyssey/making/index.html), from the episodes
that exist (films/odyssey/hearts-of-plastic-e<N>.json, written by hop_film.py) and their experiment cards (odyssey/experiments/).
The section sits between <!--hop--> and <!--/hop--> after the making-of film; run again after each episode.

    python3 tools/making/hop_page.py"""
import html, json, re
from pathlib import Path
REPO = Path(__file__).resolve().parents[2]; PAGE = REPO / 'odyssey/making/index.html'
STYLE = """<style>
.hop { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 440px), 1fr)); gap: 18px; margin-top: 14px; }
.hop .ep { border: 2px solid var(--ink); background: var(--card); padding: 12px; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.hop .ep h3 { font-size: 24px; } .hop .ep .n { font: 600 12px Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }
.hop .hyp { border-left: 4px solid var(--b-yellow); padding: 2px 0 2px 10px; font-size: 14px; }
.hop .res { border-left: 4px solid var(--b-green); padding: 2px 0 2px 10px; font-size: 14px; }
.hop ul { margin: 4px 0 0; padding-left: 18px; font-size: 13px; color: var(--muted); } .hop li { margin: 3px 0; overflow-wrap: anywhere; }
</style>"""

def section():
    eps = sorted(REPO.glob('films/odyssey/hearts-of-plastic-e*.json'), key=lambda p: int(re.search(r'e(\d+)', p.stem)[1]))
    cards = []
    for f in eps:
        d = json.loads(f.read_text()); n = d['episode']; base = f'../../films/odyssey/hearts-of-plastic-e{n}'
        ex = REPO / 'odyssey/experiments' / (d['scene'] + '.json'); X = json.loads(ex.read_text()) if ex.exists() else {}
        m, s = divmod(round(d['seconds']), 60)
        ev = ''.join(f'<li><b>{html.escape(e["gag"])}</b>: {html.escape(e["record"])}</li>' for e in d['evidence'])
        cards.append(f'''<article class="ep" id="hop-e{n}"><span class="n">Episode {n} &middot; {m} min {s:02d} s &middot; on the set of {html.escape(d['set'])}</span>
<h3>{html.escape(d['title'].split(': ', 1)[-1])}</h3>
<figure><video controls preload="none" playsinline poster="{base}.jpg" src="{base}.mp4" aria-label="{html.escape(d['title'])}"><track kind="captions" srclang="en" label="English" src="{base}.vtt"></video></figure>
<p class="hyp"><b>Hypothesis.</b> {html.escape(d['hypothesis'])}</p>
{f'<p class="res"><b>Result.</b> {html.escape(X["result"])}</p>' if X.get('result') else ''}
<details><summary>Every gag, and where it is on the record</summary><ul>{ev}</ul></details>
<p class="note">{d['shots']} shots, {d['legal']} legal. The dailies are the real takes. The voices are synthetic (Kokoro-82M, offline). Experiment card: <a href="../experiments/{d['scene']}.json">{d['scene']}.json</a>.</p></article>''')
    return f'''<!--hop-->{STYLE}
<h2 id="hearts-of-plastic">Hearts of Plastic</h2>
<p class="sub">The behind-the-scenes as a mockumentary, shot on the film's own sets: the crew walk into the Cyclops's cave, the megaron, the shore of the dead and the Sirens' ship with a camera on a tripod, a director's chair and a clapperboard, and the Odyssey's actors play themselves as method actors. Every gag is true: each one cites a take, a camera note or a commit, and when the crew watch the dailies, those are the real takes. Each episode is an experiment (the hypothesis is the setup, the take the attempt, the punchline the result, the button the fix or the honest failure, kept). After the writers' room bible, <code>odyssey/writers-room/BIBLE.md</code>.</p>
<div class="hop">{''.join(cards)}</div>
<!--/hop-->'''

if __name__ == '__main__':
    t = PAGE.read_text(); sec = section()
    if '<!--hop-->' in t: t = re.sub(r'<!--hop-->.*?<!--/hop-->', lambda _: sec, t, flags=re.S)
    else: t = t.replace('\n<h2>The evolution</h2>', '\n' + sec + '\n\n<h2>The evolution</h2>', 1)
    PAGE.write_text(t); print('Hearts of Plastic section:', t.count('class="ep"'), 'episodes')
