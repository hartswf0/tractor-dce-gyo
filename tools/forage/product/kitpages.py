#!/usr/bin/env python3
"""tools/forage/product/kitpages.py — the Odyssey line's pages: one per kit, made from its odyssey/kits/<slug>/kit.json (written by
kitlib.manifest), and the hub, odyssey/kits/index.html, that shows all of it: every kit in the order of the poem, what the checker says
of every build, the film's keyframes beside the kits they became, the blockouts, the brief, and the workshop.

  python3 tools/forage/product/kitpages.py

The four kits made before the manifests (the Horse, the Cave, Troy, Ithaca) keep their hand-made pages; they are listed here in EARLIER,
and their builds are checked like the rest. Every number on the hub is measured when this runs, never typed.
"""
import glob, html, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import clicks

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
KITS, CARDS, KEYS = (os.path.join(ROOT, p) for p in ('odyssey/kits', 'odyssey/cards', 'odyssey/keyframes'))
HALFWORLD = 'https://github.com/hartswf0/odyssey-halfworld/blob/main/'
ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
         'XXI', 'XXII', 'XXIII', 'XXIV']
TIERS = ['Flagship', 'Large', 'Medium', 'Vignette', 'Module']

EARLIER = [
    dict(slug='wooden-horse', title='The Wooden Horse', book='IV', tier='Flagship', hero='hero.jpg',
         moment='The horse left before Troy, the best of the Greeks inside it.', object='The horse: rolls on its cart; the flank lifts off to the men inside.',
         builds=[dict(card='set.wooden-horse', title='The horse on its cart'), dict(card='set.wooden-horse-open', title='The flank lifted')]),
    dict(slug='cyclops', title='The Cave of the Cyclops', book='IX', tier='Flagship', hero='hero.jpg',
         moment='The blinding: the olive stake, glowing, driven into the giant\'s eye.', object='The stake; the east flank lifts off to show it.',
         builds=[dict(card='set.cyclops-cave', title='The diorama'), dict(card='set.cyclops-cave-open', title='Opened'),
                 dict(card='set.cyclops-cave-shore', title='The shore')]),
    dict(slug='troy', title='The Citadel of Troy', book='IV · VIII', tier='Module', hero='gate.jpg',
         moment='The city the horse was dragged into: a temple, a gate torn open, houses you buy by the street.', object='Modules that join into the film set.',
         builds=[dict(card='set.temple-of-athena', title='Temple of Athena'), dict(card='set.scaean-gate', title='The Scaean Gate'),
                 dict(card='set.trojan-house', title='A Trojan house'), dict(card='set.trojan-street', title='A street')]),
    dict(slug='ithaca', title='The Palace of Odysseus', book='XVII–XXIII', tier='Module', hero='hall-open.jpg',
         moment='The house the suitors eat: the hall, the court, the storeroom, Penelope\'s chamber.', object='Modules that join into the palace.',
         builds=[dict(card='set.great-hall', title='The great hall'), dict(card='set.palace-court', title='The court'),
                 dict(card='set.storeroom', title='The storeroom'), dict(card='set.penelope-chamber', title='Penelope\'s chamber')]),
]
# the film's scenes each kit is the model of (odyssey/keyframes/<scene>/sheet.jpg)
SCENES = {'wooden-horse': ['OD-B04-S04', 'OD-B08-S05'], 'cyclops': ['OD-B09-S09', 'OD-B09-S11'], 'troy': ['OD-B04-S04'],
          'ithaca': ['OD-B22-S01'], 'bow-and-hall': ['OD-B21-S07', 'OD-B22-S01'], 'scylla-charybdis': ['OD-B12-S04'],
          'the-bed': ['OD-B23-S04'], 'penelopes-loom': ['OD-B02-S02'], 'calypso-raft': ['OD-B05-S04', 'OD-B05-S05'], 'sirens': ['OD-B12-S03'],
          'land-of-the-dead': ['OD-B11-S01'], 'circes-house': ['OD-B10-S04', 'OD-B10-S05'], 'bag-of-winds': ['OD-B10-S01'],
          'recognition-argos': ['OD-B17-S03'], 'recognition-scar': ['OD-B19-S04'], 'recognition-helen': ['OD-B04-S04']}

E = html.escape


def measure(card):
    path = os.path.join(CARDS, card + '.mpd')
    if not os.path.exists(path): return None
    P = clicks.parts(path)
    return dict(pieces=sum(1 for l in open(path) if l.startswith('1 ')), loose=len(clicks.loose(P)), clash=len(clicks.overlaps(P)))


def book_no(book):
    """the first book a kit belongs to, as a number (for ordering by the poem)"""
    m = re.match(r'\s*([IVX]+)', book or '')
    return ROMAN.index(m.group(1)) + 1 if m and m.group(1) in ROMAN else 99


def load():
    kits = []
    for k in EARLIER:
        k = dict(k, earlier=True)
        for b in k['builds']: b.update(measure(b['card']) or {})
        kits.append(k)
    for f in sorted(glob.glob(os.path.join(KITS, '*', 'kit.json'))):
        k = json.load(open(f))
        if any(e['slug'] == k['slug'] for e in EARLIER): continue
        for b in k.get('builds', []): b.update(measure(b['card']) or {})
        k['hero'] = next((i['file'] for i in k.get('images', []) if i['file'].startswith('hero')), (k.get('images') or [{}])[0].get('file', ''))
        kits.append(k)
    for k in kits:
        main = (k.get('builds') or [{}])[0]
        k['pieces'] = main.get('pieces', 0)
        k['clean'] = all(b.get('loose') == 0 and b.get('clash') == 0 for b in k.get('builds', []))
        k['n'] = book_no(k.get('book'))
    kits.sort(key=lambda k: (k['n'], TIERS.index(k.get('tier', 'Module')) if k.get('tier') in TIERS else 9))
    return kits


def keyframes():
    out = []
    for f in sorted(glob.glob(os.path.join(KEYS, 'OD-*', 'sheet.jpg'))):
        sc = os.path.basename(os.path.dirname(f))
        meta = json.load(open(os.path.join(KEYS, sc + '.json'))) if os.path.exists(os.path.join(KEYS, sc + '.json')) else {}
        out.append(dict(scene=sc, title=meta.get('title', sc), book=int(sc[4:6])))
    return out


STYLE = '''
:root { --paper: #f4f4f0; --ink: #141414; --muted: #5d5a52; --card: #fbfbf8; --rule: #d8d6ce; --blue: #0033cc; --gold: #a8801e; --ok: #1d6b3a; --bad: #b3261e; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --gold: #d8b25a; --ok: #6fcf8f; --bad: #ff8a80; } }
:root[data-theme="dark"] { --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --gold: #d8b25a; --ok: #6fcf8f; --bad: #ff8a80; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.55 Inter, system-ui, sans-serif; }
main { max-width: 1240px; margin: 0 auto; padding: 36px 16px 72px; }
h1, h2, h3 { font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700; margin: 0; letter-spacing: -0.01em; }
h1 { font-size: clamp(42px, 8vw, 84px); line-height: .95; }
h2 { font-size: 32px; margin: 64px 0 6px; padding-top: 14px; border-top: 3px solid var(--ink); }
h3 { font-size: 23px; line-height: 1.1; }
p { margin: 8px 0; }
a { color: var(--blue); }
.kicker { text-transform: uppercase; letter-spacing: .2em; font-size: 12px; font-weight: 600; color: var(--blue); }
.lede { font-size: 19px; color: var(--muted); max-width: 820px; margin: 16px 0 22px; }
.sub { color: var(--muted); max-width: 820px; }
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 2px solid var(--ink); margin: 26px 0 8px; }
.stats div { padding: 14px 16px; border-right: 1px solid var(--rule); } .stats div:last-child { border-right: 0; }
.stats b { display: block; font: 700 38px/1 'Cormorant Garamond', Georgia, serif; }
.stats span { font-size: 12px; text-transform: uppercase; letter-spacing: .12em; color: var(--muted); }
.ribbon { display: grid; grid-template-columns: repeat(24, 1fr); gap: 2px; margin: 18px 0 4px; }
.ribbon a, .ribbon div { display: block; min-height: 64px; padding: 4px 2px; text-align: center; text-decoration: none; color: var(--ink); background: var(--card); border: 1px solid var(--rule); font-size: 11px; }
.ribbon .has { background: var(--ink); color: var(--paper); border-color: var(--ink); }
.ribbon .film { box-shadow: inset 0 -4px 0 var(--blue); }
.ribbon i { display: block; font-style: normal; font-weight: 700; font-size: 13px; }
.legend { font-size: 12px; color: var(--muted); }
.legend s { display: inline-block; width: 12px; height: 12px; vertical-align: -2px; margin: 0 4px 0 12px; text-decoration: none; }
.filters { display: flex; flex-wrap: wrap; gap: 6px; margin: 16px 0; }
.filters button { font: 600 13px Inter, sans-serif; padding: 7px 12px; border: 1.5px solid var(--ink); background: transparent; color: var(--ink); cursor: pointer; }
.filters button[aria-pressed="true"] { background: var(--ink); color: var(--paper); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 18px; }
.card { background: var(--card); border: 1px solid var(--rule); display: flex; flex-direction: column; text-decoration: none; color: var(--ink); }
.card:hover { border-color: var(--ink); }
.card img { width: 100%; aspect-ratio: 16/11; object-fit: cover; display: block; background: #000; }
.card .body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.meta { font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }
.meta b { color: var(--blue); }
.card p { font-size: 14px; color: var(--muted); }
.badge { margin-top: auto; font-size: 12px; font-weight: 600; }
.badge.ok { color: var(--ok); } .badge.bad { color: var(--bad); }
.noimg { width: 100%; aspect-ratio: 16/11; background: repeating-linear-gradient(45deg, var(--rule) 0 2px, transparent 2px 10px); }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
td, th { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--rule); vertical-align: top; }
th { font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
td.n { text-align: right; font-variant-numeric: tabular-nums; }
td.ok { color: var(--ok); font-weight: 600; } td.bad { color: var(--bad); font-weight: 600; }
.tablewrap { overflow-x: auto; }
.frames { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
figure { margin: 0; } figure img { width: 100%; display: block; background: #000; }
.frames img { aspect-ratio: 16/10; object-fit: cover; }
figcaption { font-size: 13px; color: var(--muted); padding: 6px 2px 0; }
.links { columns: 2; column-gap: 32px; } .links li { margin: 4px 0; break-inside: avoid; }
footer { margin-top: 64px; font-size: 13px; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 16px; }
code { font-size: 13px; }
.kitgrid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 26px; align-items: start; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
blockquote { margin: 16px 0; padding: 12px 16px; border-left: 3px solid var(--blue); background: var(--card); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 21px; }
.sub-row { display: grid; grid-template-columns: 1fr 1.3fr; gap: 20px; padding: 16px 0; border-top: 1px solid var(--rule); align-items: start; }
@media (max-width: 800px) { .stats { grid-template-columns: repeat(2, 1fr); } .stats div:nth-child(2) { border-right: 0; }
  .ribbon { grid-template-columns: repeat(8, 1fr); } .links { columns: 1; } .kitgrid, .two, .sub-row { grid-template-columns: 1fr; } }
'''
HEAD = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>{style}</style>
</head>
<body>
<main>
'''


def badge(k):
    if not k.get('builds'): return '<span class="badge">not yet built</span>'
    if k['clean']: return '<span class="badge ok">every part clicks · no clashes</span>'
    L = sum(b.get('loose', 0) for b in k['builds']); C = sum(b.get('clash', 0) for b in k['builds'])
    return f'<span class="badge bad">{L:,} loose · {C:,} clashes: to rebuild</span>'


def hub(kits, frames):
    by_book = {}
    for k in kits:
        for n in range(1, 25):
            if k['n'] == n: by_book.setdefault(n, []).append(k)
    film_books = {f['book'] for f in frames}
    new = [k for k in kits if not k.get('earlier')]
    total = sum(k['pieces'] for k in kits if k.get('tier') != 'Module')
    cards = [b for k in kits for b in k.get('builds', []) if 'pieces' in b]
    clean = sum(1 for b in cards if b['loose'] == 0 and b['clash'] == 0)
    out = [HEAD.format(title='The Odyssey Line', style=STYLE)]
    out.append('''  <div class="kicker">Word to World · the Odyssey in LEGO</div>
  <h1>The Odyssey Line</h1>
  <p class="lede">Every kit made from the poem so far, in the order the poem tells it. Each is one moment and the one object that performs
    it, built in real parts at minifigure scale and checked by machine: every part must click to the studs below it, and no two parts may
    fill the same space. Beside each kit, the frames of the film it came from.</p>''')
    out.append(f'''  <div class="stats">
    <div><b>{len([k for k in kits if k.get('tier') != 'Module'])}</b><span>kits</span></div>
    <div><b>{total:,}</b><span>pieces in the kits</span></div>
    <div><b>{clean} / {len(cards)}</b><span>builds that pass the checker</span></div>
    <div><b>{len(frames)}</b><span>film scenes with keyframes</span></div>
  </div>''')
    # the ribbon of books
    out.append('  <h2>The poem, book by book</h2>\n  <p class="sub">Twenty-four books. Black: a kit is made from this book. Blue underline: the film has keyframes here.</p>\n  <div class="ribbon">')
    for n in range(1, 25):
        ks = by_book.get(n, [])
        cls = ' '.join(c for c, on in (('has', ks), ('film', n in film_books)) if on)
        label = '<br>'.join(E(k['title'].replace('The ', '')) for k in ks[:2])
        tag = f'a href="#kit-{ks[0]["slug"]}"' if ks else 'div'
        out.append(f'    <{tag} class="{cls}" title="Book {ROMAN[n - 1]}"><i>{ROMAN[n - 1]}</i>{label}</{tag.split()[0]}>')
    out.append('  </div>\n  <div class="legend"><s style="background:var(--ink)"></s>a kit<s style="box-shadow:inset 0 -4px 0 var(--blue);border:1px solid var(--rule)"></s>film keyframes</div>')
    # the kits
    out.append('  <h2>The kits</h2>\n  <p class="sub">Held to the Ideas bar: 200 to 5,000 pieces, one concept, the peak of the story posed, finished surfaces, a play feature that works. <a href="brief.html">The design brief</a> sets it out.</p>')
    out.append('  <div class="filters" role="group" aria-label="Filter kits">' + ''.join(
        f'<button type="button" data-f="{t}" aria-pressed="{str(t == "All").lower()}">{t if t != "Module" else "Earlier modules"}</button>' for t in ['All'] + TIERS) + '</div>')
    out.append('  <div class="grid" id="kits">')
    for k in kits:
        img = f'<img src="{k["slug"]}/{k["hero"]}" alt="{E(k["title"])}" loading="lazy">' if k.get('hero') and os.path.exists(os.path.join(KITS, k['slug'], k['hero'])) else '<div class="noimg"></div>'
        out.append(f'''    <a class="card" id="kit-{k["slug"]}" data-t="{k.get("tier", "")}" href="{k["slug"]}/">{img}<div class="body">
      <div class="meta"><b>{E(k.get("tier", ""))}</b> · Book {E(k.get("book", ""))}{f" · {k['pieces']:,} pieces" if k["pieces"] else ""}</div>
      <h3>{E(k["title"])}</h3><p>{E(k.get("moment", ""))}</p><p><b>The object:</b> {E(k.get("object", ""))}</p>{badge(k)}</div></a>''')
    out.append('  </div>')
    # the film
    kit_of = {s: k for k in kits for s in SCENES.get(k['slug'], [])}
    out.append('  <h2>In the film</h2>\n  <p class="sub">Keyframes from the film\'s previs, each checked by the keyframe gate (<code>film-readymades/keyframes.cjs</code>). Where a kit has been made of the scene, it is named.</p>\n  <div class="frames">')
    for f in frames:
        k = kit_of.get(f['scene'])
        cap = f'{E(f["scene"])} · {E(f["title"])}' + (f' · <a href="{k["slug"]}/">{E(k["title"])}</a>' if k else '')
        out.append(f'    <figure><img src="../keyframes/{f["scene"]}/sheet.jpg" alt="Keyframes of {E(f["title"])}" loading="lazy"><figcaption>{cap}</figcaption></figure>')
    out.append('  </div>')
    # blockouts
    bo = sorted(glob.glob(os.path.join(KITS, 'blockouts', '*.jpg')))
    if bo:
        out.append('  <h2>Blockouts</h2>\n  <p class="sub">The grey massing models each flagship began from: the composition before the detail.</p>\n  <div class="frames">')
        for f in bo:
            n = os.path.basename(f)[:-4]
            out.append(f'    <figure><img src="blockouts/{n}.jpg" alt="Massing model: {E(n)}" loading="lazy"><figcaption>{E(n.replace("-", " "))}</figcaption></figure>')
        out.append('  </div>')
    # the checker's table
    out.append('  <h2>What the checker says</h2>\n  <p class="sub">Every build, measured when this page was made (<code>tools/forage/product/clicks.py</code>). Loose: parts on the grid not clicked to the rest. Clashes: pairs of parts in the same space. The earlier Troy and Ithaca modules predate the strict check and fail it; they are rebuilt as their kits come up.</p>\n  <div class="tablewrap"><table>\n    <tr><th>Kit</th><th>Build</th><th>File</th><th class="n">Pieces</th><th class="n">Loose</th><th class="n">Clashes</th></tr>')
    for k in kits:
        for b in k.get('builds', []):
            if 'pieces' not in b: continue
            cl = lambda v: 'ok' if v == 0 else 'bad'
            out.append(f'    <tr><td><a href="{k["slug"]}/">{E(k["title"])}</a></td><td>{E(b.get("title", ""))}</td><td><a href="../cards/{b["card"]}.mpd"><code>{b["card"]}</code></a></td>'
                       f'<td class="n">{b["pieces"]:,}</td><td class="n {cl(b["loose"])}">{b["loose"]:,}</td><td class="n {cl(b["clash"])}">{b["clash"]:,}</td></tr>')
    out.append('  </table></div>')
    # the workshop
    out.append('''  <h2>The workshop</h2>
  <ul class="links">
    <li><a href="brief.html">The design brief</a>: the rules, the Ideas bar, what the film decided, the whole line, the archaeology</li>
    <li><a href="https://hartswf0.github.io/odyssey-halfworld/">Odyssey Halfworld</a>: the film this line is drawn from, 24 books, 152 scenes</li>
    <li><a href="../../odyssey-forage.html">The forage viewer</a>: every card in the world, in 3D</li>
    <li><a href="../../odyssey-kit.html">The kit viewer</a></li>
    <li><a href="../../film-readymades/production/Film-Butter-Odyssey.html">The film build</a>: the Odyssey locations as a playable film (large)</li>
    <li><a href="../../odyssey-production/cyclops-sequence.html">The Cyclops sequence</a></li>
    <li><code>tools/forage/product/kitlib.py</code>: what every kit is built with</li>
    <li><code>tools/forage/product/sculpt.py</code>: the sculptor for rock, trunks and horses</li>
    <li><code>tools/forage/product/clicks.py</code>: the checker</li>
    <li><code>tools/forage/product/kitpages.py</code>: this page and every kit page</li>
    <li><code>tools/forage/look.js</code>: the studio renders</li>
    <li><code>tools/forage/product/kits/</code>: one script per kit</li>
  </ul>
  <footer>Made by <code>tools/forage/product/kitpages.py</code> from each kit's <code>kit.json</code>; every number measured when it ran.</footer>
</main>
<script>
const bs = document.querySelectorAll('.filters button'), cs = document.querySelectorAll('#kits .card');
bs.forEach(b => b.addEventListener('click', () => {
  bs.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  cs.forEach(c => { c.style.display = (b.dataset.f === 'All' || c.dataset.t === b.dataset.f) ? '' : 'none'; });
}));
</script>
</body>
</html>''')
    open(os.path.join(KITS, 'index.html'), 'w').write('\n'.join(out) + '\n')


def page(k, frames):
    d = os.path.join(KITS, k['slug'])
    imgs = k.get('images', [])
    hero = next((i for i in imgs if i['file'] == k.get('hero')), imgs[0] if imgs else None)
    rest = [i for i in imgs if i is not hero]
    out = [HEAD.format(title=E(k['title']), style=STYLE)]
    out.append(f'''  <div class="kicker"><a href="../">The Odyssey Line</a> · {E(k.get("tier", ""))} · Book {E(k.get("book", ""))} · {k["pieces"]:,} pieces</div>
  <h1>{E(k["title"])}</h1>
  <p class="lede">{E(k.get("moment", ""))}</p>''')
    if k.get('quote'): out.append(f'  <blockquote>{E(k["quote"])}</blockquote>')
    if hero: out.append(f'  <figure><img src="{E(hero["file"])}" alt="{E(hero.get("alt", k["title"]))}"><figcaption>{E(hero.get("caption", ""))}</figcaption></figure>')
    out.append(f'  <h2>The object</h2>\n  <p>{E(k.get("object", ""))}</p>')
    if rest:
        out.append('  <div class="two">' + ''.join(f'<figure><img src="{E(i["file"])}" alt="{E(i.get("alt", ""))}" loading="lazy"><figcaption>{E(i.get("caption", ""))}</figcaption></figure>' for i in rest) + '</div>')
    if k.get('features'):
        out.append('  <h2>How it is built</h2>\n  <ul>' + ''.join(f'<li>{E(f)}</li>' for f in k['features']) + '</ul>')
    if k.get('subs'):
        out.append('  <h2>The builds inside the build</h2>')
        for s in k['subs']:
            img = f'<figure><img src="{E(s["file"])}" alt="{E(s["title"])}" loading="lazy"></figure>' if s.get('file') and os.path.exists(os.path.join(d, s['file'])) else '<div class="noimg"></div>'
            out.append(f'  <div class="sub-row">{img}<div><div class="meta">{E(str(s.get("pieces", "")))} pieces</div><h3>{E(s["title"])}</h3><p>{E(s.get("text", ""))}</p></div></div>')
    out.append('  <h2>What the checker says</h2>\n  <div class="tablewrap"><table><tr><th>Build</th><th>File</th><th class="n">Pieces</th><th class="n">Loose</th><th class="n">Clashes</th></tr>')
    for b in k.get('builds', []):
        if 'pieces' not in b: continue
        cl = lambda v: 'ok' if v == 0 else 'bad'
        out.append(f'  <tr><td>{E(b.get("title", ""))}</td><td><a href="../../cards/{b["card"]}.mpd"><code>{b["card"]}</code></a></td><td class="n">{b["pieces"]:,}</td>'
                   f'<td class="n {cl(b["loose"])}">{b["loose"]}</td><td class="n {cl(b["clash"])}">{b["clash"]}</td></tr>')
    out.append('  </table></div>')
    fr = [f for f in frames if f['scene'] in SCENES.get(k['slug'], [])]
    if fr:
        out.append('  <h2>In the film</h2>\n  <div class="frames">' + ''.join(
            f'<figure><img src="../../keyframes/{f["scene"]}/sheet.jpg" alt="Keyframes of {E(f["title"])}" loading="lazy"><figcaption>{E(f["scene"])} · {E(f["title"])}</figcaption></figure>' for f in fr) + '</div>')
    if k.get('next'): out.append('  <h2>Still to do</h2>\n  <ul>' + ''.join(f'<li>{E(n)}</li>' for n in k['next']) + '</ul>')
    src = ''.join(f'<li><a href="{HALFWORLD}{E(s)}"><code>{E(s)}</code></a></li>' for s in k.get('sources', []))
    out.append(f'''  <footer>Built by <code>tools/forage/product/kits/{k["slug"]}.py</code> with <code>kitlib.py</code>; checked by <code>clicks.py</code>. Drawn from the film's sources:<ul>{src}</ul>
    <a href="../">All the kits</a> · <a href="../brief.html">The design brief</a></footer>
</main>
</body>
</html>''')
    open(os.path.join(d, 'index.html'), 'w').write('\n'.join(out) + '\n')


if __name__ == '__main__':
    kits, frames = load(), keyframes()
    for k in kits:
        if not k.get('earlier'): page(k, frames)
    hub(kits, frames)
    print(len(kits), 'kits;', sum(1 for k in kits if k['clean']), 'clean;', len(frames), 'keyframe scenes; wrote odyssey/kits/index.html')
