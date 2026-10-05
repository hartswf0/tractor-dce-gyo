"""The Odyssey in story order: odyssey/watch/index.html, one player that plays every performed scene in book order.

Every scene card (odyssey/cards/OD-Bxx-Syy.mpd, books 1-24) is listed in order; a scene with a performed film
(films/odyssey/<id>-performed.mp4) plays, one without is shown as not yet filmed, so the gaps are honest.
Run again whenever a film is added: python3 tools/watch/build_watch.py
"""
from pathlib import Path
import json, re, html

REPO = Path(__file__).resolve().parents[2]
FILMS = REPO / 'films/odyssey'
OUT = REPO / 'odyssey/watch/index.html'
BOOKS = {1: 'Athena and Telemachus', 2: 'The Assembly and the Voyage', 3: 'Nestor at Pylos', 4: 'Menelaus and Helen at Sparta',
         5: 'Calypso and the Raft', 6: 'Nausicaa', 7: 'The Palace of Alcinous', 8: 'Songs and Games among the Phaeacians',
         9: 'The Cyclops', 10: 'Aeolus, the Laestrygonians and Circe', 11: 'The Dead', 12: 'The Sirens, Scylla and the Cattle',
         13: 'Home to Ithaca', 14: 'Eumaeus the Swineherd', 15: 'Telemachus Comes Home', 16: 'Father and Son',
         17: 'The Beggar at the Gate', 18: 'Irus and the Suitors', 19: 'Penelope and the Stranger', 20: 'Omens',
         21: 'The Bow', 22: 'The Slaughter', 23: 'The Bed', 24: 'Laertes and the Peace'}

def title_of(sid):
    card = REPO / 'odyssey/cards' / (sid + '.mpd')
    t = card.read_text(errors='replace').split('\n')[1][2:].strip() if card.exists() else sid
    small = {'a', 'an', 'and', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'its', 'his', 'her', 'from', 'with', 'as'}
    w = t.lower().split()
    return ' '.join(x if (i and x in small) else x[:1].upper() + x[1:] for i, x in enumerate(w))

def scenes():
    ids = sorted(p.stem for p in (REPO / 'odyssey/cards').glob('OD-B*-S*.mpd') if int(p.stem[4:6]) <= 24)
    out = []
    for sid in ids:
        mp4 = FILMS / (sid + '-performed.mp4')
        row = dict(id=sid, book=int(sid[4:6]), scene=int(sid[8:10]), title=title_of(sid), film=None)
        if mp4.exists():
            j = json.loads((FILMS / (sid + '-performed.json')).read_text()) if (FILMS / (sid + '-performed.json')).exists() else {}
            row['film'] = dict(src=f'../../films/odyssey/{sid}-performed.mp4', poster=f'../../films/odyssey/{sid}-performed.jpg',
                               vtt=f'../../films/odyssey/{sid}-performed.vtt' if (FILMS / (sid + '-performed.vtt')).exists() else None,
                               seconds=round(float(j.get('seconds', 0)), 1))
        out.append(row)
    return out

def build():
    rows = scenes()
    filmed = [r for r in rows if r['film']]
    total = sum(r['film']['seconds'] for r in filmed)
    playlist = [dict(id=r['id'], title=r['title'], book=r['book'], **r['film']) for r in filmed]
    books_html = []
    for b in range(1, 25):
        br = [r for r in rows if r['book'] == b]
        n = sum(1 for r in br if r['film'])
        items = []
        for r in br:
            if r['film']:
                i = next(k for k, p in enumerate(playlist) if p['id'] == r['id'])
                items.append(f'<li class="f"><button data-i="{i}" aria-label="Play {html.escape(r["title"])}"><img loading="lazy" src="{r["film"]["poster"]}" alt=""><span><b>{html.escape(r["title"])}</b><em>{r["id"]} · {int(r["film"]["seconds"] // 60)}:{int(r["film"]["seconds"] % 60):02d}</em></span></button></li>')
            else:
                items.append(f'<li class="g"><span><b>{html.escape(r["title"])}</b><em>{r["id"]} · not yet filmed</em></span></li>')
        books_html.append(f'<section class="book{" empty" if not n else ""}"><h3><span>Book {b}</span> {html.escape(BOOKS[b])} <small>{n} of {len(br)} filmed</small></h3><ol>{"".join(items)}</ol></section>')
    page = TEMPLATE.replace('%COUNT%', str(len(filmed))).replace('%CARDS%', str(len(rows))) \
        .replace('%MIN%', str(round(total / 60))).replace('%BOOKS%', '\n'.join(books_html)) \
        .replace('%PLAYLIST%', json.dumps(playlist).replace('</', '<\\/'))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(page)
    print('odyssey/watch/index.html:', len(filmed), 'films of', len(rows), 'scenes,', round(total / 60, 1), 'min')

TEMPLATE = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Watch the Odyssey</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
:root { --paper:#f4f4f0; --ink:#141414; --muted:#5d5a52; --card:#fbfbf8; --rule:#d8d6ce; --blue:#0033cc; --red:#c91a09; --yellow:#f2cd37; --green:#237841; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper:#0f0f0e; --ink:#ecebe6; --muted:#a09d94; --card:#181816; --rule:#2c2b28; --blue:#6f8cff; } }
:root[data-theme="dark"] { --paper:#0f0f0e; --ink:#ecebe6; --muted:#a09d94; --card:#181816; --rule:#2c2b28; --blue:#6f8cff; }
* { box-sizing:border-box; } html,body { overflow-x:hidden; }
body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.5 Inter,system-ui,sans-serif; }
main { max-width:1240px; margin:0 auto; padding:32px 16px 72px; }
h1,h2,h3 { font-family:'Cormorant Garamond',Georgia,serif; font-weight:700; margin:0; }
h1 { font-size:clamp(40px,8vw,76px); line-height:.95; }
.kicker { text-transform:uppercase; letter-spacing:.2em; font-size:12px; font-weight:600; color:var(--blue); }
.kicker a { color:inherit; text-decoration:none; }
.lede { color:var(--muted); font-size:18px; max-width:820px; margin:12px 0 20px; }
.stage { display:grid; grid-template-columns:minmax(0,2.2fr) minmax(0,1fr); gap:18px; align-items:start; }
@media (max-width:860px) { .stage { grid-template-columns:1fr; } }
video { width:100%; aspect-ratio:16/9; background:#000; display:block; border:2px solid var(--ink); }
.now { border:2px solid var(--ink); background:var(--card); padding:14px; }
.now .n { font:12px ui-monospace,Menlo,monospace; color:var(--muted); }
.now h2 { font-size:30px; line-height:1.05; margin:4px 0 10px; }
.ctl { display:flex; flex-wrap:wrap; gap:8px; }
.ctl button { font:600 13px Inter,sans-serif; padding:8px 12px; border:1.5px solid var(--ink); background:transparent; color:var(--ink); cursor:pointer; }
.ctl button.main { background:var(--ink); color:var(--paper); }
.bar { height:6px; background:var(--rule); margin:12px 0 4px; } .bar i { display:block; height:100%; background:var(--red); width:0; }
.small { font-size:13px; color:var(--muted); }
.book { margin:34px 0 0; border-top:3px solid var(--ink); padding-top:10px; }
.book h3 { font-size:26px; display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 12px; }
.book h3 span { font:600 12px Inter,sans-serif; text-transform:uppercase; letter-spacing:.16em; color:var(--blue); }
.book h3 small { font:13px Inter,sans-serif; color:var(--muted); }
.book.empty h3 { color:var(--muted); }
ol { list-style:none; padding:0; margin:12px 0 0; display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; }
li button { all:unset; cursor:pointer; display:block; width:100%; border:1px solid var(--rule); background:var(--card); }
li button:hover, li button:focus-visible, li.on button { outline:2px solid var(--red); }
li img { width:100%; aspect-ratio:16/9; object-fit:cover; display:block; background:#000; }
li span { display:block; padding:8px 10px 10px; } li b { display:block; font-weight:600; font-size:14px; line-height:1.3; }
li em { font:12px ui-monospace,Menlo,monospace; color:var(--muted); font-style:normal; }
li.g span { border:1px dashed var(--rule); color:var(--muted); min-height:100%; } li.g b { font-weight:400; }
</style></head><body><main>
<div class="kicker"><a href="../../index.html">tractor-dce-gyo</a> · <a href="../kits/index.html">the Odyssey line</a> · watch</div>
<h1>Watch the Odyssey</h1>
<p class="lede">Every performed scene in the order Homer tells it: %COUNT% filmed of %CARDS% scenes, about %MIN% minutes. Press play and it runs from Book 1 to Book 24, skipping what is not yet filmed. The gaps are listed below as they are.</p>
<div class="stage">
  <div><video id="v" controls playsinline preload="metadata"><track id="t" kind="captions" srclang="en" label="English" default></video></div>
  <div class="now"><div class="n" id="pos"></div><h2 id="ttl">The Odyssey</h2>
    <div class="ctl"><button class="main" id="play">Play in order</button><button id="prev">Previous</button><button id="next">Next</button></div>
    <div class="bar"><i id="prog"></i></div><div class="small" id="left"></div>
    <p class="small">Also: <a href="../making/index.html">the making-of and every take</a> · <a href="../making/index.html#hearts-of-plastic">Hearts of Plastic</a> · <a href="../forensics/index.html">the forensic report</a></p></div>
</div>
%BOOKS%
</main>
<script>
const P = %PLAYLIST%;
const v = document.getElementById('v'), tr = document.getElementById('t');
let i = 0, auto = false;
const total = P.reduce((a, p) => a + p.seconds, 0);
function load(k, go) {
  i = Math.max(0, Math.min(P.length - 1, k)); const p = P[i];
  v.poster = p.poster; v.src = p.src; if (p.vtt) { tr.src = p.vtt; } else { tr.removeAttribute('src'); }
  document.getElementById('ttl').textContent = p.title;
  document.getElementById('pos').textContent = 'Book ' + p.book + ' · ' + p.id + ' · ' + (i + 1) + ' of ' + P.length;
  const done = P.slice(0, i).reduce((a, q) => a + q.seconds, 0);
  document.getElementById('prog').style.width = (100 * done / total) + '%';
  document.getElementById('left').textContent = Math.round((total - done) / 60) + ' minutes from here to the end';
  document.querySelectorAll('li.on').forEach(e => e.classList.remove('on'));
  const b = document.querySelector('button[data-i="' + i + '"]'); if (b) b.parentElement.classList.add('on');
  try { history.replaceState(null, '', '#' + p.id); } catch (e) {}
  if (go) v.play().catch(() => {});
}
v.addEventListener('ended', () => { if (auto && i < P.length - 1) load(i + 1, true); });
document.getElementById('play').onclick = () => { auto = true; load(i, true); };
document.getElementById('next').onclick = () => load(i + 1, auto);
document.getElementById('prev').onclick = () => load(i - 1, auto);
document.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => { auto = true; load(+b.dataset.i, true); window.scrollTo({ top: 0, behavior: 'smooth' }); });
const h = location.hash.slice(1), at = P.findIndex(p => p.id === h); load(at >= 0 ? at : 0, false);
</script></body></html>
'''

if __name__ == '__main__':
    build()
