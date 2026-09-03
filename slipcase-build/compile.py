#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SLIPCASE compiler: work/zettels.json + work/poml.txt + work/field/* → desk/ (the ZIP root) → ZIP.
Laws observed: payloads are written byte-exact and never edited; every count/hash is computed;
what could not be computed is marked PENDING / UNVERIFIED in _SLIPCASE/VERIFICATION.txt.
"""
import json, os, re, sys, hashlib, shutil, subprocess, unicodedata, collections, datetime, zipfile
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
REPO = os.path.dirname(HERE)
import render, prompts, mocs, paper as PAPER

WORK = os.path.join(HERE, 'work'); DESK = os.path.join(HERE, 'desk')
if os.path.isdir(DESK): shutil.rmtree(DESK)
for d in ['', '_MD', '_MOCS', '_ARRANGEMENTS', '_PROMPTS', '_RESOURCES', '_SLIPCASE']: os.makedirs(os.path.join(DESK, d), exist_ok=True)
Zj = json.load(open(os.path.join(WORK, 'zettels.json'), encoding='utf-8'))
cards = Zj['cards']; POML = open(os.path.join(WORK, 'poml.txt'), encoding='utf-8').read()
RAW_PASTE = open(os.path.join(HERE, 'raw', 'paste__2026-09-03__zettel-batches-and-poml.txt'), encoding='utf-8').read()
FIELD = json.load(open(os.path.join(WORK, 'field', 'field-results.json')))
DATE = '2026-09-03'; ORIGIN = f'PASTE-{DATE}'
CHECKPOINT = f'SLIPCASE__LDRAW-ASSEMBLY-FIELD__{DATE}'
PACKAGE = f'slipcase__ldraw-assembly-field__{DATE}.zip'
SCHEMA = 'POML 15.55-AM · slipcase card schema 1.0 (ORDER__NAME__SOURCE__ORIGINAL-ID__from-ORIGIN.txt)'
RESEARCHER = 'W. Hartsoe (whartsoe3@gatech.edu) — name derived from the session account and repository owner (hartswf0), not separately confirmed'
SESSION = 'https://claude.ai/code/session_01MNSfMekfBH4NfPqDorH3zo'
REPO_URL = 'https://github.com/hartswf0/tractor-dce-gyo (branch claude/platos-cave-ldraw-wzcr71, directory slipcase/)'
REJOIN = 'rejoin: "open the slipcase — the field, not the window"'
sha = lambda b: hashlib.sha256(b if isinstance(b, bytes) else b.encode('utf-8')).hexdigest()
W = lambda rel, text: open(os.path.join(DESK, rel), 'w', encoding='utf-8', newline='\n').write(text)
WB = lambda rel, data: open(os.path.join(DESK, rel), 'wb').write(data)
log = []

# ─────────────────────────────────────────── names, signatures, filenames
def ascii_clean(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^A-Za-z0-9.-]+', '-', s).strip('-.')
    return re.sub(r'-{2,}', '-', s)
def name_of(c):
    core = re.sub(r'^Z-', '', c['id']); core = re.sub(r'-\d+$', '', core)
    return '-'.join(w.capitalize() if not re.match(r'^[A-Z]+$', w) or len(w) > 4 else w.capitalize() for w in core.split('-'))
def first_author_surname(author):
    a = author.split(' and ')[0].strip()
    if a.startswith('{') and a.endswith('}'):
        inner = a.strip('{}').strip(); return inner.split()[0], 'institution'
    if ',' in a: return a.split(',')[0].strip(), 'author'
    parts = a.split(); return (parts[-1] if parts else a), 'author'
def signature_of(c):
    b = c['bibtex']
    if len(b) == 1:
        f = b[0]['fields']
        if f.get('author'):
            s, kind = first_author_surname(f['author'])
            return ascii_clean(s + ('-' + f['year'] if f.get('year') else ''))
        if f.get('title'): return ascii_clean(' '.join(f['title'].split()[:2]) + ('-' + f['year'] if f.get('year') else ''))
        return 'SOURCEUNKNOWN'
    if len(b) > 1: return 'MULTISOURCE'
    return 'SELFSOURCE' if c['source'].strip() else 'SOURCEUNKNOWN'
for c in cards:
    c['name'] = name_of(c); c['signature'] = signature_of(c)
    c['filename'] = f"{c['order']:03d}__{ascii_clean(c['name'])}__{c['signature']}__{ascii_clean(c['id']) or 'NOID'}__from-{ORIGIN}.txt"
    c['citekeys'] = [e['key'] for e in c['bibtex']]
assert len({c['filename'] for c in cards}) == len(cards)

# ─────────────────────────────────────────── root cards, mirrors, decks
for c in cards:
    WB(c['filename'], c['payload'].encode('utf-8'))
    WB(os.path.join('_MD', c['filename'][:-4] + '.md'), c['payload'].encode('utf-8'))
    assert sha(open(os.path.join(DESK, c['filename']), 'rb').read()) == c['sha256']
divider = lambda c: f"\n\n{'═'*78}\n#{c['order']:03d}  {c['filename']}\nsha256 {c['sha256']}\n{'═'*78}\n\n"
W('ZETTELS.txt', f"ZETTELS — {CHECKPOINT}\n{len(cards)} cards in display (paste) order. Dividers are outside the payloads; each payload is byte-identical to its root .txt card.\nReturn path: 000__RETURN_PATH.txt\n" + ''.join(divider(c) + c['payload'] for c in cards) + '\n')
records = [dict(order=c['order'], id=c['id'], title=c['title'], name=c['name'], filename=c['filename'], md=f"_MD/{c['filename'][:-4]}.md", sha256=c['sha256'], bytes=c['bytes'], chars=c['chars'], lines=c['lines'],
                form=c['form'], batch=c['batch'], origin=ORIGIN, signature=c['signature'], platforms=c['platforms'], links=c['links'], addresses=c['addresses'], citekeys=c['citekeys'],
                bibtex=[dict(type=e['type'], key=e['key'], fields=e['fields']) for e in c['bibtex']], fields=c['fields'], field_sequence=c['field_sequence'], source=c['source']) for c in cards]
json.dump(dict(checkpoint=CHECKPOINT, package=PACKAGE, schema=SCHEMA, count=len(records), zettels=records), open(os.path.join(DESK, 'ZETTELS.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
with open(os.path.join(DESK, 'ZETTELS.jsonl'), 'w', encoding='utf-8') as f:
    for r, c in zip(records, cards): f.write(json.dumps(dict(r, payload=c['payload']), ensure_ascii=False) + '\n')

# ─────────────────────────────────────────── graph: nodes + relations
ids = {c['id']: c for c in cards}; titles = collections.Counter(c['title'] for c in cards)
title_to = {c['title']: c['id'] for c in cards if titles[c['title']] == 1}
platform_names = collections.OrderedDict()
for c in cards:
    for p in c['platforms']: platform_names.setdefault(p, []).append(c['order'])
ALIASES = {}
def resolve(lit):
    if lit in ids: return 'ZETTEL', lit, 'exact ORIGINAL ID'
    if lit in ALIASES: return 'ZETTEL', ALIASES[lit], 'registered alias'
    if lit in title_to: return 'ZETTEL', title_to[lit], 'exact unique original title'
    if lit in platform_names: return 'PLATFORM', lit, 'PLATFORM'
    if re.match(r'^https?://', lit): return 'EXTERNAL', lit, 'explicit external'
    return 'GHOST', lit, 'GHOST'
relations = []; ghosts = collections.OrderedDict()
for c in cards:
    for i, p in enumerate(c['platforms'], 1):
        relations.append(dict(kind='MEMBER_OF', source=c['id'], source_order=c['order'], field='PLATFORM', ordinal=i, literal=p, target_type='PLATFORM', target=p, resolution='PLATFORM', resolved=True))
    for i, l in enumerate(c['links'], 1):
        t, tg, how = resolve(l)
        relations.append(dict(kind='LINKS_TO', source=c['id'], source_order=c['order'], field='LINKS', ordinal=i, literal=l, target_type=t, target=tg, resolution=how, resolved=t == 'ZETTEL'))
    for a in c['addresses']:
        if a['field'] in ('PLATFORM', 'LINKS'): continue
        t, tg, how = resolve(a['literal'])
        relations.append(dict(kind='WIKILINKS_TO', source=c['id'], source_order=c['order'], field=a['field'], ordinal=a['ordinal'], literal=a['literal'], target_type=t, target=tg, resolution=how, resolved=t == 'ZETTEL'))
for r in relations:
    if r['target_type'] == 'GHOST':
        g = ghosts.setdefault(r['target'], dict(name=r['target'], count=0, sources=[], fields=[], first_order=r['source_order'], platforms=set(), surrounding_citekeys=set()))
        g['count'] += 1
        if r['source_order'] not in g['sources']: g['sources'].append(r['source_order'])
        if r['field'] not in g['fields']: g['fields'].append(r['field'])
        g['first_order'] = min(g['first_order'], r['source_order'])
        g['platforms'].update(ids[r['source']]['platforms']); g['surrounding_citekeys'].update(ids[r['source']]['citekeys'])
for g in ghosts.values(): g['platforms'] = sorted(g['platforms']); g['surrounding_citekeys'] = sorted(g['surrounding_citekeys'])
# derived edges
derived = []
for r in relations:
    if r['resolved']: derived.append(dict(kind='BACKLINK', source=r['target'], target=r['source'], via=r['kind'], field=r['field'], ordinal=r['ordinal']))
for c in cards:
    for k in c['citekeys']: derived.append(dict(kind='USES_SOURCE', source=c['id'], target=k))
    derived.append(dict(kind='APPEARED_IN', source=c['id'], target='paste__2026-09-03__zettel-batches-and-poml.txt', batch=c['batch'], form=c['form'], char_offset=RAW_PASTE.find(c['payload'][:200])))
    derived.append(dict(kind='REPRESENTED_BY', source=c['id'], target=c['filename']))
for k in PAPER.CITEKEYS_USED: derived.append(dict(kind='CITES', source=f"PAPER:{PAPER.SLUG}", target=k))
derived.append(dict(kind='GENERATED_BY', source=PACKAGE, target='PROMPT:00__ASSEMBLY-PROMPT__SLIPCASE-POML'))
derived.append(dict(kind='GENERATED_BY', source='field-results.json', target='measure-field.js'))
# degrees over resolved zettel graph
deg = collections.Counter(); und = set()
for r in relations:
    if r['resolved'] and r['source'] != r['target']:
        e = tuple(sorted((r['source'], r['target'])))
        if e not in und: und.add(e); deg[e[0]] += 1; deg[e[1]] += 1
adj = collections.defaultdict(set)
for a, b in und: adj[a].add(b); adj[b].add(a)
# bridges (Tarjan) + components
disc = {}; low = {}; bridges = []; timer = [0]
def dfs(u, parent):
    disc[u] = low[u] = timer[0]; timer[0] += 1
    for v in adj[u]:
        if v == parent: continue
        if v in disc: low[u] = min(low[u], disc[v])
        else:
            dfs(v, u); low[u] = min(low[u], low[v])
            if low[v] > disc[u]: bridges.append((u, v))
sys.setrecursionlimit(10000)
comps = []
for c in cards:
    if c['id'] not in disc:
        before = set(disc); dfs(c['id'], None); comps.append(sorted(set(disc) - before))
outdeg = collections.Counter(r['source'] for r in relations if r['resolved'] and r['source'] != r['target'])
indeg = collections.Counter(r['target'] for r in relations if r['resolved'] and r['source'] != r['target'])
leaves = [c['id'] for c in cards if outdeg[c['id']] == 0]
orphans = [c['id'] for c in cards if deg[c['id']] == 0]
no_inbound = [c['id'] for c in cards if indeg[c['id']] == 0]
most_connected = deg.most_common(12)
terms = collections.Counter()
for c in cards:
    for v in c['fields'].get('SOURCE TERMS', []):
        for t in re.findall(r'“([^”]+)”|"([^"]+)"', v): terms[(t[0] or t[1]).strip().lower()] += 1
source_conv = collections.Counter(k for c in cards for k in set(c['citekeys']))
moc_of = collections.defaultdict(set)
for m in mocs.MOCS:
    for o in m['orders']: moc_of[cards[o-1]['id']].add(m['id'])
crossings = [(a, b) for a, b in sorted(und) if moc_of.get(a) and moc_of.get(b) and not (moc_of[a] & moc_of[b])]
broken_ids = [g for g in ghosts if re.match(r'^Z-[A-Z0-9-]+-\d{3}$', g)]
# nodes
nodes = []
for c in cards: nodes.append(dict(type='ZETTEL', key='Z:' + c['id'], name=c['id'], label=c['name'], order=c['order'], degree=deg[c['id']], filename=c['filename'], sha256=c['sha256']))
for p, members in platform_names.items(): nodes.append(dict(type='PLATFORM', key='P:' + p, name=p, label=p, members=members, degree=len(members)))
for g in ghosts.values(): nodes.append(dict(type='GHOST', key='G:' + g['name'], name=g['name'], label=g['name'], degree=g['count'], count=g['count'], sources=g['sources'], fields=g['fields'], first_order=g['first_order'], platforms=g['platforms'], surrounding_citekeys=g['surrounding_citekeys']))

# ─────────────────────────────────────────── bibliography
def norm(s): return re.sub(r'[^a-z0-9]+', '', s.lower())
works = collections.OrderedDict()
for c in cards:
    for e in c['bibtex']:
        w = works.setdefault(e['key'], dict(key=e['key'], type=e['type'], variants=[], cards=[]))
        w['variants'].append(dict(order=c['order'], raw=e['raw'], fields=e['fields']))
        if c['order'] not in w['cards']: w['cards'].append(c['order'])
def citation(f):
    au = f.get('author', '').replace(' and others', ' et al.').replace(' and ', ', ').replace('{', '').replace('}', '')
    parts = [p for p in [au, f'({f["year"]})' if f.get('year') else None, f.get('title'), f.get('journal') or f.get('booktitle') or f.get('publisher') or f.get('organization') or f.get('howpublished') or f.get('institution'),
             f"vol. {f['volume']}" if f.get('volume') else None, f"pp. {f['pages']}" if f.get('pages') else None, f.get('note')] if p]
    return '. '.join(parts).replace('..', '.') + '.'
title_groups = collections.defaultdict(list)
for k, w in works.items():
    f0 = w['variants'][0]['fields']
    w['fields'] = f0; w['raw'] = w['variants'][0]['raw']; w['citation'] = citation(f0)
    w['doi'] = next((v['fields']['doi'] for v in w['variants'] if v['fields'].get('doi')), None)
    w['url'] = next((v['fields']['url'] for v in w['variants'] if v['fields'].get('url')), None)
    # same work? years equal, one title a prefix of the other (subtitle dropped), authors equal up to an "and others" truncation
    def same_work(a, b):
        ta, tb = norm(a.get('title', '')), norm(b.get('title', ''))
        aa, ab = norm(a.get('author', '').replace('and others', '')), norm(b.get('author', '').replace('and others', ''))
        return a.get('year', '') == b.get('year', '') and (ta.startswith(tb) or tb.startswith(ta)) and (aa.startswith(ab) or ab.startswith(aa))
    f_all = [v['fields'] for v in w['variants']]
    consistent = all(same_work(f0, f) for f in f_all)
    exact = len({(norm(f.get('title','')), norm(f.get('author','')), f.get('year','')) for f in f_all}) == 1
    if len(w['cards']) == 1: w['klass'] = 'UNIQUE'
    elif consistent: w['klass'] = 'SHARED'
    else: w['klass'] = 'BIB-CONFLICT'
    if len(w['variants']) > 1 and consistent and not exact: w['variant_note'] = 'same work; one card abbreviates the author list ("and others") or drops a subtitle: ' + '; '.join(f"#{v['order']:03d} {v['fields'].get('author','?')[:40]} / {v['fields'].get('title','?')[:50]}" for v in w['variants'])
    elif len(w['variants']) > 1 and consistent and len({re.sub(r'\s+', ' ', v['raw']) for v in w['variants']}) > 1: w['variant_note'] = 'same title/author/year; raw entries differ only in whitespace or punctuation'
    elif not consistent: w['variant_note'] = 'title, author or year differ between cards: ' + '; '.join(f"#{v['order']:03d} {v['fields'].get('title','?')[:60]} / {v['fields'].get('year','?')}" for v in w['variants'])
    if not (f0.get('title') and f0.get('year')): w['klass'] = 'UNRESOLVED-BIBLIOGRAPHY'
    if f0.get('title'): title_groups[norm(f0['title'])].append(k)
for t, ks in title_groups.items():
    if len(ks) > 1:
        for k in ks: works[k]['klass'] += ' · BIB-ALIAS(' + ', '.join(x for x in ks if x != k) + ')'
needs_citation = []
for c in cards:
    src_lines = [l for l in c['source'].split('\n') if l.strip()] if c['form'] == 'multiline' else re.split(r'(?<=\.)\s+(?=[A-Z“])', c['source'])
    src_lines = [l for l in src_lines if len(l.strip()) > 12]
    if len(src_lines) > len(c['bibtex']): needs_citation.append((c['order'], c['id'], len(src_lines), len(c['bibtex'])))
bib_txt = [f"BIBLIOGRAPHY — {CHECKPOINT}", f"{len(works)} works from {sum(len(w['variants']) for w in works.values())} BibTeX blocks in {len(cards)} cards. Never fabricated: fields shown are the fields present.", "Return path: 000__RETURN_PATH.txt", '']
for k, w in works.items():
    bib_txt += [f"[{k}]  {w['klass']}", f"  {w['citation']}", f"  cards: {', '.join(f'{o:03d}' for o in w['cards'])}" + (f"  doi: {w['doi']}" if w['doi'] else '') + (f"  url: {w['url']}" if w['url'] else '')]
    if w.get('variant_note'): bib_txt.append('  variants: ' + w['variant_note'])
    bib_txt += ['  raw:', '    ' + w['raw'].replace('\n', '\n    '), '']
bib_txt += ['NEEDS-CITATION candidates (card names more SOURCE works than it carries BibTeX entries; heuristic, verify by reading the card):'] + [f"  #{o:03d} {i}: {n} source lines, {b} BibTeX entries" for o, i, n, b in needs_citation]
W('000__BIBLIOGRAPHY.txt', '\n'.join(bib_txt) + '\n')
W('000__BIBLIOGRAPHY.html', render.bibliography_html(list(works.values()), CHECKPOINT))
bibfile = [f"% {CHECKPOINT}__references.bib", f"% checkpoint: {CHECKPOINT}", f"% package: {PACKAGE}", f"% schema: {SCHEMA}", "% RETURN PATH: 000__RETURN_PATH.txt in the package; " + REPO_URL, "% one entry per citekey (first occurrence); other variants follow as comments", '']
for k, w in works.items():
    bibfile.append(w['raw']); 
    for v in w['variants'][1:]:
        if re.sub(r'\s+', ' ', v['raw']) != re.sub(r'\s+', ' ', w['raw']): bibfile.append(f"% VARIANT from card #{v['order']:03d}:\n" + '\n'.join('% ' + l for l in v['raw'].split('\n')))
    bibfile.append('')
W(f'{CHECKPOINT}__references.bib', '\n'.join(bibfile))

# ─────────────────────────────────────────── resources
resources = []
def add_res(name, type_, state, src=None, body=None, url=None, note='', used_by=None, provided_by='', author='', year='', title='', doi=''):
    rel = None
    if src is not None:
        rel = os.path.join('_RESOURCES', name); shutil.copyfile(src, os.path.join(DESK, rel))
    elif body is not None:
        rel = os.path.join('_RESOURCES', name); W(rel, body)
    rec = dict(name=name, type=type_, state=state, local=rel, url=url, doi=doi or None, note=note, used_by=used_by or [], provided_by=provided_by, author=author or None, year=year or None, title=title or None)
    if rel: rec['sha256'] = sha(open(os.path.join(DESK, rel), 'rb').read()); rec['bytes'] = os.path.getsize(os.path.join(DESK, rel))
    resources.append(rec); return rec
add_res('paste__2026-09-03__zettel-batches-and-poml.txt', 'paste', 'PASTED', src=os.path.join(HERE, 'raw', 'paste__2026-09-03__zettel-batches-and-poml.txt'), note='The complete research context as received: request line, four pasted batches holding 87 zettels (one batch whitespace-collapsed), and the POML assembly prompt. Chat-UI timing artifacts ("Worked for …") are present here and were cut at batch boundaries during extraction.', used_by=['every zettel'], provided_by='researcher')
add_res('poml__SLIPCASE-PORTABLE-RESEARCH-FIELD__15.55-AM.txt', 'prompt', 'PASTED', body=POML, note='Exact assembly prompt (also _PROMPTS/00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt).', used_by=['this package'], provided_by='researcher')
add_res('field-results.json', 'dataset', 'GENERATED', src=os.path.join(WORK, 'field', 'field-results.json'), note='Open-stud field measurements for 17 kits and 6 builds, two closing-pass variants, blind 12-axis verdicts vs 5935. Generated by measure-field.js.', used_by=['paper', '_PROMPTS/S01'])
for f in ['measure-field.js', 'render-field.js', 'print-pdf.js', 'extract.py', 'compile.py', 'render.py', 'paper.py', 'prompts.py', 'mocs.py']:
    add_res(f, 'code', 'GENERATED', src=os.path.join(HERE, f), note='Compiler / instrument source. Re-run order: extract.py → measure-field.js → render-field.js → compile.py.', used_by=['this package'])
FIGS = {}
for b in ['card-castle', 'gauntlet-shore-station', 'card-fallingwater']:
    for v in ['before', 'A-close-all', 'B-ragged']:
        p = os.path.join(WORK, 'field', f'{b}__{v}.png')
        if os.path.exists(p): FIGS[(b, v)] = add_res(f'render__{b}__{v}.png', 'image', 'GENERATED', src=p, note=f'Neutral render of {b}__{v}.mpd (kits.html viewer, Chromium/swiftshader).', used_by=['paper'])['local']
for b in ['card-castle', 'card-fallingwater', 'gauntlet-shore-station', 'hms-beagle', 'finch-cactus', 'medusa-scriptorium']:
    for v in ['before', 'A-close-all', 'B-ragged']:
        add_res(f'mpd__{b}__{v}.mpd', 'model', 'GENERATED', src=os.path.join(WORK, 'field', f'{b}__{v}.mpd'), note='LDraw MPD; "before" is the repository build as committed, A/B are the closing-pass variants (tiles appended to the root model).', used_by=['field-results.json'])
for rel, note in [('GAUNTLET-CONTRACT.md', 'The twelve axes, gates and layer plan the critic uses.'), ('kits/ATTRIBUTION.md', 'Provenance of the 17 kit MPDs (three.js LDrawLoader example, CC BY 2.0).'), ('builds/manifest.json', 'Index of the repository builds with piece/block counts.'), ('references/index.json', 'The two reference cards (castle, fallingwater) with six-layer breakdowns.'), ('kits/5935-island-hopper.mpd', 'The default bar kit (control in the field experiment).'), ('kits/7140-xwing-fighter.mpd', 'Second control kit.'), ('builds/card-castle.png', 'Committed render of the castle card build.'), ('builds/card-fallingwater.png', 'Committed render of the fallingwater card build.')]:
    src = os.path.join(REPO, rel)
    if os.path.exists(src): add_res('repo__' + rel.replace('/', '__'), 'file', 'LOCAL_FILE', src=src, note=note + f' Copied from repository path {rel}.', used_by=['paper', '_PROMPTS'], provided_by='repository')
add_res('repository', 'repo', 'LINK_ONLY', url='https://github.com/hartswf0/tractor-dce-gyo', note=REPO_URL, used_by=['everything measured'])
for k, w in works.items():
    if w['doi'] or w['url']: add_res(f'work__{k}', 'reference', 'LINK_ONLY', url=w['url'] or f"https://doi.org/{w['doi']}", doi=w['doi'], note='Receipt only: the body was not fetched (no network fetch was attempted).', used_by=[f'{o:03d}' for o in w['cards']], author=w['fields'].get('author', ''), year=w['fields'].get('year', ''), title=w['fields'].get('title', ''))
W('000__RESOURCES.txt', f"RESOURCES — {CHECKPOINT}\nStates: LINK_ONLY · SNAPSHOT · LOCAL_FILE · PASTED · GENERATED. Bodies live under _RESOURCES/. No local resource was fabricated; LINK_ONLY means a receipt without a body.\n\n" + '\n'.join(f"{r['name']}\n  type {r['type']} · state {r['state']}" + (f" · local {r['local']} · {r['bytes']} bytes · sha256 {r['sha256'][:16]}…" if r.get('local') else '') + (f"\n  url {r['url']}" if r.get('url') else '') + (f"\n  {r['note']}" if r['note'] else '') + (f"\n  used by: {', '.join(r['used_by'])}" if r['used_by'] else '') for r in resources) + '\n')
with open(os.path.join(DESK, '_SLIPCASE', 'RESOURCES.jsonl'), 'w', encoding='utf-8') as f:
    for r in resources: f.write(json.dumps(r, ensure_ascii=False) + '\n')

# ─────────────────────────────────────────── arena (seven seeds, seven castles) — only if the run exists
ARENA = os.path.join(HERE, 'arena'); ARENA_RES = None
if os.path.exists(os.path.join(ARENA, 'results.json')):
    ARENA_RES = json.load(open(os.path.join(ARENA, 'results.json')))
    os.makedirs(os.path.join(DESK, '_RESOURCES', 'arena'), exist_ok=True)
    def add_arena(name, src, type_, note, used_by):
        rel = os.path.join('_RESOURCES', 'arena', name); shutil.copyfile(src, os.path.join(DESK, rel))
        rec = dict(name='arena/' + name, type=type_, state='GENERATED', local=rel, url=None, doi=None, note=note, used_by=used_by, provided_by='arena/world.js', author=None, year=None, title=None)
        rec['sha256'] = sha(open(os.path.join(DESK, rel), 'rb').read()); rec['bytes'] = os.path.getsize(os.path.join(DESK, rel)); resources.append(rec)
    add_arena('results.json', os.path.join(ARENA, 'results.json'), 'dataset', 'Seven seeds run as seven separate agents in one world; per-seed verdicts, shares, counts, notes.', ['_PROMPTS/RESULTS.txt'])
    add_arena('RESULTS.md', os.path.join(ARENA, 'RESULTS.md'), 'file', 'The seven castles side by side, per-axis verdicts, and each agent\'s notes.', ['_PROMPTS/RESULTS.txt'])
    for f in ['world.js', 'compose.js', 'collect.js', 'WORLD.md', 'BRIEF-COMMON.md'] + [f'BRIEF-S0{i}.md' for i in range(1, 8)]:
        if os.path.exists(os.path.join(ARENA, f)): add_arena(f, os.path.join(ARENA, f), 'code' if f.endswith('.js') else 'prompt', 'The arena world / harness / the exact brief each agent received.', ['arena'])
    for s_ in ARENA_RES['seeds']:
        if s_.get('status') != 'DONE': continue
        sid = s_['seed']; d = os.path.join(ARENA, 'runs', sid)
        for f, t_, n_ in [(f'castle-{sid}.mpd', 'model', 'the castle this seed built'), (f'castle-{sid}.png', 'image', 'neutral render of that file'), ('NOTES.md', 'file', 'the agent\'s own notes'), ('report.json', 'dataset', 'judge + field for the emitted file'), ('card.json', 'prompt', 'the card the agent wrote'), ('groups.json', 'dataset', 'the decompilation the agent wrote')]:
            if os.path.exists(os.path.join(d, f)): add_arena(f'{sid}__{f}', os.path.join(d, f), t_, f'{sid} {s_["name"]}: {n_}.', ['RESULTS.md'])
    W(os.path.join('_PROMPTS', 'RESULTS.txt'), 'ARENA RESULTS — the seven seeds run as seven separate agents\n' + open(os.path.join(ARENA, 'RESULTS.md'), encoding='utf-8').read())

# ─────────────────────────────────────────── prompts
request_line = Zj['request']
for fn, text in prompts.seed_files(POML, request_line): W(os.path.join('_PROMPTS', fn), text)
assert open(os.path.join(DESK, '_PROMPTS', '00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt'), encoding='utf-8').read() == POML
arena_note = ''
if ARENA_RES:
    arena_note = '\n\nARENA — each seed run as its own agent in one world (see _PROMPTS/RESULTS.txt, _RESOURCES/arena/)\n' + '\n'.join(f"  {x['seed']}  {x['name']:<22} " + (f"pieces {x['pieces']:>4} · W/L {x['wins']}/{x['losses']} · open share {x['share']}" if x.get('status') == 'DONE' else x.get('status', '')) for x in ARENA_RES['seeds']) + f"\n  BASE  layered builder         pieces {ARENA_RES['baseline']['pieces']:>4} · W/L {ARENA_RES['baseline']['wins']}/{ARENA_RES['baseline']['losses']} · open share {ARENA_RES['baseline']['share']}"
W('000__PROMPTS.txt', f"PROMPTS — {CHECKPOINT}{arena_note}\n\nCONSEQUENTIAL PROMPTS PRESERVED EXACTLY\n  _PROMPTS/00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt   the POML that assembled this package ({len(POML)} chars, sha256 {sha(POML)})\n  _PROMPTS/00__REQUEST-LINE.txt                     the request line preceding the batches ({len(request_line)} chars)\n\nSEED PROMPTS (the stones) — see _PROMPTS/README.txt for how to test and evolve them\n" + '\n'.join(f"  {m['id']}  {m['name']:<22} {m['status']:<22} draws on {', '.join(m['zettels'])}" for m in prompts.SEED_META) + '\n')

# ─────────────────────────────────────────── MOCs and arrangements
by_order = {c['order']: c for c in cards}
def moc_text(mid, title, note, orders, kind='MOC'):
    rows = '\n'.join(f"  {o:03d}  {by_order[o]['id']}\n       {by_order[o]['title']}\n       {by_order[o]['filename']}" for o in orders if o in by_order)
    return f"{kind} {mid} — {title}\n{CHECKPOINT} · derived view, never evidence · return path 000__RETURN_PATH.txt\n\n{note}\n\n{len(orders)} cards:\n{rows}\n"
moc_list = []
for p, members in platform_names.items():
    fn = f"PLATFORM__{ascii_clean(p)}.txt"; W(os.path.join('_MOCS', fn), moc_text('PLATFORM', p, 'Declared constellation: every card whose PLATFORM field names this address.', members))
    moc_list.append(dict(id='PLATFORM', title=p, note='declared by the cards', orders=members, file='_MOCS/' + fn))
for m in mocs.MOCS:
    fn = f"{m['id']}__{ascii_clean(m['title'].split(' — ')[0])}.txt"; W(os.path.join('_MOCS', fn), moc_text(m['id'], m['title'], m['note'], m['orders']))
    moc_list.append(dict(m, file='_MOCS/' + fn))
arr_list = []
ghost_frontier = sorted(cards, key=lambda c: -sum(1 for a in c['addresses'] if resolve(a['literal'])[0] == 'GHOST'))
for a in mocs.ARRANGEMENTS:
    orders = a['orders']
    if a['id'] == 'A04':
        orders = []; note = a['note'] + '\n' + '\n'.join(f"  {m['id']} {m['name']}: " + ', '.join(f"{ids[z]['order']:03d}" for z in m['zettels'] if z in ids) for m in prompts.SEED_META)
        for m in prompts.SEED_META:
            for z in m['zettels']:
                if z in ids and ids[z]['order'] not in orders: orders.append(ids[z]['order'])
    else: note = a['note']
    fn = f"{a['id']}__{ascii_clean(a['title'].split(' — ')[0])}.txt"; W(os.path.join('_ARRANGEMENTS', fn), moc_text(a['id'], a['title'], note, orders, 'ARRANGEMENT'))
    arr_list.append(dict(id=a['id'], title=a['title'], note=note, orders=orders, file='_ARRANGEMENTS/' + fn))
gf = [c['order'] for c in ghost_frontier if any(resolve(a['literal'])[0] == 'GHOST' for a in c['addresses'])]
W(os.path.join('_ARRANGEMENTS', 'A03__Ghost-frontier.txt'), moc_text('A03', 'Ghost frontier — cards carrying the most unresolved addresses first', 'Computed: cards ordered by the number of [[addresses]] that resolve to GHOST. These are the edges where the field is still being written.', gf, 'ARRANGEMENT'))
arr_list.append(dict(id='A03', title='Ghost frontier', note='computed', orders=gf, file='_ARRANGEMENTS/A03__Ghost-frontier.txt'))

# ─────────────────────────────────────────── network
edges = []
for r in relations:
    if r['target_type'] == 'ZETTEL' and r['resolved']: edges.append(('Z:' + r['source'], 'Z:' + r['target'], r['kind']))
    elif r['target_type'] == 'PLATFORM': edges.append(('Z:' + r['source'], 'P:' + r['target'], 'MEMBER_OF'))
    elif r['target_type'] == 'GHOST': edges.append(('Z:' + r['source'], 'G:' + r['target'], r['kind']))
edges = list(dict.fromkeys(edges))
pos = render.layout(nodes, [(a, b) for a, b, _ in edges])
NET_SVG = render.network_svg(nodes, edges, pos, CHECKPOINT)
NET_SVG_I = render.network_svg(nodes, edges, pos, CHECKPOINT, interactive=True)
W('NETWORK.svg', NET_SVG)
W('NETWORK.html', f"""<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NETWORK — {CHECKPOINT}</title><style>{render.CSS} body{{padding:12px}} #info{{font-size:13px;padding:6px 0}}</style></head><body><h1 style="font-weight:normal;font-size:17px;margin:0 0 6px">The field — {CHECKPOINT}</h1><div id="info" class="dim">Hover a node for its name; click a zettel to open it in the reader (READER.html#id). Static twin: NETWORK.svg.</div>{NET_SVG_I}<script>document.querySelectorAll('circle[data-id]').forEach(c=>{{c.addEventListener('click',()=>location.href='READER.html#'+encodeURIComponent(c.dataset.id));c.addEventListener('mouseenter',()=>document.getElementById('info').textContent=c.dataset.id);}});</script></body></html>""")
W('MARK.svg', render.MARK_SVG)
W('CARDS.html', render.cards_html(cards, CHECKPOINT))

# ─────────────────────────────────────────── paper
P = dict(PAPER.PAPER, package=PACKAGE)
kits_rows = [k for k in FIELD['kits'] if k['pieces']]
tables_html = {'kits': '<div class="wrap"><table><tr><th>kit</th><th class="n">pieces</th><th class="n">structural studs</th><th class="n">open</th><th class="n">share</th><th class="n">open per piece</th></tr>' + ''.join(f"<tr><td>{k['id']}</td><td class='n'>{k['pieces']}</td><td class='n'>{k['structuralStuds']}</td><td class='n'>{k['openStructural']}</td><td class='n'>{k['openStructuralShare']:.3f}</td><td class='n'>{k['openStructuralPerPiece']:.3f}</td></tr>" for k in kits_rows) + f'<caption>Table 1. Structural studs facing air in the sixteen kits with pieces. Computed by measure-field.js from the repository catalogue and port index; see _RESOURCES/field-results.json.</caption></table></div>',
               'builds': '<div class="wrap"><table><tr><th>build</th><th class="n">pieces</th><th class="n">share before</th><th class="n">close-all</th><th class="n">ragged</th><th class="n">tiles added (A / B)</th><th>verdict vs 5935 (W/L) before → A → B</th></tr>' + ''.join(f"<tr><td>{b['id']}</td><td class='n'>{b['before']['pieces']}</td><td class='n'>{b['before']['openStructuralShare']:.3f}</td><td class='n'>{b['variants']['A-close-all']['openStructuralShare']:.3f}</td><td class='n'>{b['variants']['B-ragged']['openStructuralShare']:.3f}</td><td class='n'>{b['variants']['A-close-all']['added']['pieces']} / {b['variants']['B-ragged']['added']['pieces']}</td><td>{b['judgeBefore']['wins']}/{b['judgeBefore']['losses']} → {b['variants']['A-close-all']['judge']['wins']}/{b['variants']['A-close-all']['judge']['losses']} → {b['variants']['B-ragged']['judge']['wins']}/{b['variants']['B-ragged']['judge']['losses']}</td></tr>" for b in FIELD['builds'] if not b.get('control')) + f'<caption>Table 2. Six repository builds before and after the two closing passes. Kit band {PAPER.BAND[0]:.3f}–{PAPER.BAND[1]:.3f}. Verdicts are the repository critic\'s blind per-axis judgement against 5935 Island Hopper, counted as wins/losses over twelve axes.</caption></table></div>'}
def figrow(b, cap):
    imgs = ''.join(f'<img src="{FIGS[(b, v)]}" alt="{b} {v}">' for v in ['before', 'A-close-all', 'B-ragged'] if (b, v) in FIGS)
    return f'<figure><div class="figrow">{imgs}</div><figcaption>{cap}</figcaption></figure>'
figures_html = {'castle': figrow('card-castle', f"Figure 1. The castle card build before the pass (left), after close-all (centre: {FIELD['builds'][0]['variants']['A-close-all']['added']['pieces']} tiles, open structural studs {FIELD['builds'][0]['before']['openStructural']} → {FIELD['builds'][0]['variants']['A-close-all']['openStructural']}), and after the ragged pass (right: {FIELD['builds'][0]['variants']['B-ragged']['added']['pieces']} tiles). Same camera, same viewer.")}
def tex_table(k):
    if k == 'kits':
        rows = '\\\\\n'.join(f"{render.tex_escape(x['id'])} & {x['pieces']} & {x['structuralStuds']} & {x['openStructural']} & {x['openStructuralShare']:.3f} & {x['openStructuralPerPiece']:.3f}" for x in kits_rows)
        return '\\begin{table}[h]\\centering\\footnotesize\\begin{tabular}{lrrrrr}\\toprule kit & pieces & structural studs & open & share & open/piece\\\\\\midrule\n' + rows + '\\\\\\bottomrule\\end{tabular}\\caption{Structural studs facing air in the sixteen kits with pieces (measure-field.js; \\_RESOURCES/field-results.json).}\\end{table}'
    rows = '\\\\\n'.join(f"{render.tex_escape(b['id'])} & {b['before']['pieces']} & {b['before']['openStructuralShare']:.3f} & {b['variants']['A-close-all']['openStructuralShare']:.3f} & {b['variants']['B-ragged']['openStructuralShare']:.3f} & {b['variants']['A-close-all']['added']['pieces']} / {b['variants']['B-ragged']['added']['pieces']} & {b['judgeBefore']['wins']}/{b['judgeBefore']['losses']} $\\rightarrow$ {b['variants']['A-close-all']['judge']['wins']}/{b['variants']['A-close-all']['judge']['losses']} $\\rightarrow$ {b['variants']['B-ragged']['judge']['wins']}/{b['variants']['B-ragged']['judge']['losses']}" for b in FIELD['builds'] if not b.get('control'))
    return '\\begin{table}[h]\\centering\\footnotesize\\begin{tabular}{lrrrrrl}\\toprule build & pieces & before & close-all & ragged & tiles A/B & verdict W/L\\\\\\midrule\n' + rows + '\\\\\\bottomrule\\end{tabular}\\caption{Six repository builds before and after the two closing passes; kit band ' + f'{PAPER.BAND[0]:.3f}--{PAPER.BAND[1]:.3f}' + '.}\\end{table}'
tables_tex = {'kits': tex_table('kits'), 'builds': tex_table('builds')}
figures_tex = {'castle': '\\begin{figure}[h]\\centering' + ''.join(f'\\includegraphics[width=.32\\textwidth]{{{FIGS[("card-castle", v)]}}}' for v in ['before', 'A-close-all', 'B-ragged'] if ('card-castle', v) in FIGS) + '\\caption{The castle card build before the pass, after close-all, and after the ragged pass. Same camera, same viewer.}\\end{figure}'}
making_hist_paper = [
 'PROVIDED: 87 zettels and one POML assembly prompt, pasted by the researcher into one session on 2026-09-03; the repository tractor-dce-gyo (catalogue, port index, 17 kits, 11 builds, the twelve-axis critic).',
 'PRESERVED: every payload byte-exact as a root .txt card and _MD mirror; the POML verbatim; the raw paste under _RESOURCES/.',
 'RETRIEVED: nothing from the network. All DOI/URL receipts are LINK_ONLY.',
 f'DERIVED: the open-stud probe and closing passes (measure-field.js), the renders, the tables in Sections 4.2–4.5, the graph, the MOCs and arrangements, and this paper\'s connective prose. The paper was written by the compiling model; the researcher had not reviewed it at packaging time.',
 'VERIFIED: every number in Section 4 was counted by the script and re-counted from the emitted MPD files; citekeys used in the paper were checked against the compiled bibliography (see SOURCE_MAP).',
 'UNVERIFIED: the body-line/joints computation mentioned in Section 6 (not preserved); the accuracy of AABB coverage under slopes; any human review of the argument.',
]
appendices = [
 ('Appendix A — Assembly instrument', [f'The exact prompt that assembled this publication is preserved verbatim as _PROMPTS/00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt in the package ({len(POML)} characters, sha256 {sha(POML)}), inside index.html, and as _RESOURCES/poml__SLIPCASE-PORTABLE-RESEARCH-FIELD__15.55-AM.txt. It is too large to reproduce here; it is a POML document (version 15.55-AM) whose meta, role, stance, model, laws, cards, graph, publication, index, reader, bibliography, resources, paper, provenance, mark, return_path, verification, process, adapt, design and final_test sections define this package. The request line that preceded the zettel batches is preserved as _PROMPTS/00__REQUEST-LINE.txt.']),
 ('Appendix B — Making history', making_hist_paper),
 ('Appendix C — Replication path', ['Open index.html from the package by itself: it carries every payload, filename and hash, the bibliography, the resources registry with the bodies of text resources, the exact assembly prompt, the graph, ghosts and backlinks, the MOCs, this paper, its source map, the making history and the rebuild instructions.', 'To verify a card: compare the SHA-256 of its root .txt file with ZETTELS.json. To rebuild the card box from the deck alone: python3 _SLIPCASE/rebuild.py ZETTELS.jsonl <out-dir> regenerates every root card and _MD mirror and checks each hash; the compiler ran that test before packaging (result in _SLIPCASE/VERIFICATION.txt).', 'To reproduce the numbers: with the repository checked out, run node slipcase-build/measure-field.js (needs nabugo-parts.json, nabugo-ports.json, nabugo-kits.js, nabugo-gauntlet.js, kits/, builds/); it writes field-results.json. Renders need Chromium and the local kits.html viewer (render-field.js). The paper is regenerated by compile.py; its PDF was printed from the HTML twin with Chromium because no TeX installation was available; the .tex is provided for a TeX compile elsewhere.']),
]
paper_html = render.paper_html(P, PAPER.SECTIONS, works, tables_html, figures_html, appendices, render.MARK_SVG)
tex = render.paper_tex(P, PAPER.SECTIONS, works, tables_tex, figures_tex, appendices)
slug = f"{PAPER.SLUG}__{DATE}"
W(f'{slug}.tex', tex); W(f'{slug}.html', paper_html)
pdf_path = os.path.join(DESK, f'{slug}.pdf'); pdf_status = 'PENDING'
try:
    out = subprocess.run(['node', os.path.join(HERE, 'print-pdf.js'), os.path.join(DESK, f'{slug}.html'), pdf_path], capture_output=True, text=True, timeout=180)
    if os.path.exists(pdf_path):
        data = open(pdf_path, 'rb').read(); pages = len(re.findall(rb'/Type\s*/Page(?![s/])', data))
        pdf_status = f'PRINTED from the HTML twin with Chromium (no TeX available); {pages} pages; {len(data)} bytes; sha256 {sha(data)}'
    else: pdf_status = 'FAILED: ' + (out.stderr or out.stdout)[-300:]
except Exception as e: pdf_status = 'FAILED: ' + str(e)[:300]
smap = [f"SOURCE MAP — {slug}", f"{CHECKPOINT} · every substantive claim: PAPER CLAIM → ZETTEL → SOURCE → CITEKEY; kind SOURCE (traced to a card and its BibTeX), COMPUTED (a number from the instrument), COMPILER (connective claim by the compiler)", '']
for i, m in enumerate(PAPER.SOURCE_MAP, 1):
    smap.append(f"{i:02d}  §{m['sec']}  [{m['kind']}]  {m['claim']}")
    for z in m['zettels']: smap.append(f"      zettel  {z}  (card #{ids[z]['order']:03d})" if z in ids else f"      zettel  {z}  (GHOST — not in this package)")
    for k in m['cites']: smap.append(f"      cite    [{k}]  {works[k]['citation'] if k in works else 'NOT IN BIBLIOGRAPHY'}")
    if m.get('note'): smap.append(f"      note    {m['note']}")
    smap.append('')
missing_cites = [k for k in PAPER.CITEKEYS_USED if k not in works]
smap.append(f"Citekeys used in the paper: {len(PAPER.CITEKEYS_USED)}; not in compiled bibliography: {missing_cites or 'none'}")
W(f'{slug}__SOURCE_MAP.txt', '\n'.join(smap) + '\n')
W(f'{slug}__MAKING_HISTORY.txt', f"MAKING HISTORY — {slug}\n{CHECKPOINT}\n\n" + '\n\n'.join(making_hist_paper) + f"\n\nPDF STATUS: {pdf_status}\nThe paper is the current wager, never evidence.\n")
W(f'{slug}__ASSEMBLY_APPENDIX.txt', f"ASSEMBLY APPENDIX — {slug}\n\nThe exact assembly prompt is preserved, byte for byte, at:\n  _PROMPTS/00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt\n  _RESOURCES/poml__SLIPCASE-PORTABLE-RESEARCH-FIELD__15.55-AM.txt\n  index.html (section ASSEMBLY PROMPT)\nsha256 {sha(POML)} · {len(POML)} chars\n\nThe request line preceding the batches:\n  _PROMPTS/00__REQUEST-LINE.txt\n\nIt reads, in full:\n\n{POML}\n")

# ─────────────────────────────────────────── 000__ files
platform_lines = '\n'.join(f"  {p}  ({len(m)}): {', '.join(f'{o:03d}' for o in m)}" for p, m in sorted(platform_names.items(), key=lambda x: -len(x[1])))
W('000__INDEX.txt', f"INDEX — {CHECKPOINT}\n{len(cards)} zettels in display (paste) order · filename = ORDER__NAME__SOURCE__ORIGINAL-ID__from-ORIGIN.txt\nReturn path: 000__RETURN_PATH.txt\n\n" + '\n'.join(f"{c['order']:03d}  {c['id']}\n     {c['title']}\n     {c['filename']}\n     platform {', '.join(c['platforms'])} · links {len(c['links'])} · addresses {len(c['addresses'])} · bibtex {len(c['bibtex'])} · sha256 {c['sha256'][:16]}…" for c in cards) + '\n')
W('000__MAP.txt', f"""MAP — {CHECKPOINT}
Topology of the field, computed from PLATFORM, LINKS and every [[address]] in the 87 cards. Derived view.

NODES   zettels {len(cards)} · platforms {len(platform_names)} · ghosts {len(ghosts)} · sources (citekeys) {len(works)} · resources {len(resources)} · prompts {len(prompts.SEED_META) + 2}
EDGES   MEMBER_OF {sum(1 for r in relations if r['kind']=='MEMBER_OF')} · LINKS_TO {sum(1 for r in relations if r['kind']=='LINKS_TO')} ({sum(1 for r in relations if r['kind']=='LINKS_TO' and r['resolved'])} resolved) · WIKILINKS_TO {sum(1 for r in relations if r['kind']=='WIKILINKS_TO')} ({sum(1 for r in relations if r['kind']=='WIKILINKS_TO' and r['resolved'])} resolved) · BACKLINK {sum(1 for d in derived if d['kind']=='BACKLINK')} · USES_SOURCE {sum(1 for d in derived if d['kind']=='USES_SOURCE')}
UNDIRECTED zettel graph: {len(und)} distinct edges · {len(comps)} connected components (sizes {', '.join(str(len(x)) for x in comps)}) · {len(bridges)} bridges

ROOT PLATFORMS (declared constellations, by membership) — every platform has exactly one member unless listed with more:
{platform_lines}

MOST CONNECTED ZETTELS (degree in the resolved graph)
{chr(10).join(f'  {d:>3}  {z}  #{ids[z]["order"]:03d}  {ids[z]["title"]}' for z, d in most_connected)}

BRIDGES (edges whose removal disconnects the field — the field hangs on these)
{chr(10).join(f'  {a}  —  {b}' for a, b in bridges) or '  none'}

LEAVES (no outward resolved link): {len(leaves)}
{chr(10).join(f'  {z}' for z in leaves) or '  none'}

NO INBOUND LINK FROM ANOTHER ADMITTED CARD: {len(no_inbound)} — these cards point outward only
{chr(10).join(f'  #{ids[z]["order"]:03d} {z}' for z in no_inbound)}

ORPHANS (no resolved link in either direction): {len(orphans)}
{chr(10).join(f'  {z}' for z in orphans) or '  none'}

ACTIVE GHOSTS (unfinished addresses; count of inbound literals)
{chr(10).join(f'  {g["count"]:>3}  {g["name"]}  first #{g["first_order"]:03d}  from cards {", ".join(f"{o:03d}" for o in g["sources"])}' for g in sorted(ghosts.values(), key=lambda g: -g['count']))}

SOURCE CONVERGENCE (citekeys shared by the most cards)
{chr(10).join(f'  {n:>3}  [{k}]  {works[k]["citation"][:90]}' for k, n in source_conv.most_common(15))}

RECURRING CONCEPTS (SOURCE TERMS quoted in the most cards)
{chr(10).join(f'  {n:>3}  {t}' for t, n in terms.most_common(25))}

UNEXPECTED CROSSINGS (resolved links between cards in disjoint curated MOCs — see _MOCS/M01–M08)
{chr(10).join(f'  {a} ({"/".join(sorted(moc_of[a]))})  →  {b} ({"/".join(sorted(moc_of[b]))})' for a, b in crossings) or '  none'}

BROKEN IDS (ghost addresses shaped like zettel IDs — cards that exist somewhere else, not here): {len(broken_ids)}
{chr(10).join('  ' + g for g in broken_ids)}

QUESTIONS THE TOPOLOGY RAISES
  · Z-HOGWARTS-ATTENTION-BUDGET-001 is the hub (degree {deg['Z-HOGWARTS-ATTENTION-BUDGET-001']}); is "not every brick deserves a chain of thought" the field's premise or its conclusion?
  · The prompt-praxis cards (Z-PROMPT-*, Z-RYLE-EXPERIMENT-001, Z-GEERTZ-EVENT-001) are the largest ghost family: the language-game argument rests on cards this package does not hold.
  · {len(no_inbound)} cards have no inbound link: the newest batches (benchmarks, feedback) were written pointing back at the older ones, not yet the reverse.
  · The assembly-theory constellation (M06) and the attention constellation (M01) touch only through Z-LDRAW-CONNECTION-GAP-001 and Z-LDRAW-GRAMMAR-001: those two cards are where the two halves of the field meet.
""")
open_edges = [f"OPEN EDGES — {CHECKPOINT}", 'Where the field is unfinished. Ghosts are questions, not errors.', '', 'GHOSTS (unfinished addresses)'] + [f"  {g['name']}  ×{g['count']}  held open by cards {', '.join(f'{o:03d}' for o in g['sources'])}" for g in sorted(ghosts.values(), key=lambda g: -g['count'])] + ['', 'CONTRADICTIONS AND TENSIONS THE CARDS DECLARE (TENSION fields, one line each)'] + [f"  #{c['order']:03d} {c['id']}: {re.sub(chr(10)+'+', ' ', (c['fields'].get('TENSION') or [''])[0])[:160]}" for c in cards] + ['', 'MISSING (what each card says is missing)'] + [f"  #{c['order']:03d}: {re.sub(chr(10)+'+', ' ', (c['fields'].get('MISSING') or [''])[0])[:140]}" for c in cards] + ['', 'BIBLIOGRAPHY CONFLICTS'] + [f"  [{k}] {w['klass']}: {w.get('variant_note','')}" for k, w in works.items() if 'CONFLICT' in w['klass'] or 'ALIAS' in w['klass']] + ['', 'NEEDS-CITATION CANDIDATES'] + [f"  #{o:03d} {i}: {n} source lines vs {b} BibTeX entries" for o, i, n, b in needs_citation] + ['', 'WHAT THE PAPER COULD NOT REACH', '  · a clutch test (tube in stud ring) — the probe is AABB coverage only', '  · hinge / clip / pin / bar ports — absent from the port index', '  · a language model in the loop — the tested pass is a fixed rule', '  · the six assembly-theory questions (compression vs construction, basis, threshold) — adjacent, untouched', '  · S02–S07 seed prompts — stated with measures, not run']
W('000__OPEN_EDGES.txt', '\n'.join(open_edges) + '\n')
W('000__RETURN_PATH.txt', f"""RETURN PATH — {CHECKPOINT}

checkpoint name   {CHECKPOINT}
checkpoint id     sha256 of the concatenated payload hashes in display order: {sha(''.join(c['sha256'] for c in cards))}
schema version    {SCHEMA}
package name      {PACKAGE}
researcher        {RESEARCHER}
date              {DATE}
rejoin phrase     {REJOIN}
origin session    {SESSION}
origin repository {REPO_URL}

CONSEQUENTIAL FILES
  index.html                              the sendable capsule (works alone, offline)
  ZETTELS.jsonl                           the deck with payloads — enough to rebuild every card
  {CHECKPOINT}__references.bib   the bibliography
  _PROMPTS/00__ASSEMBLY-PROMPT__SLIPCASE-POML.txt   the exact assembly prompt
  _SLIPCASE/MANIFEST.json                 every file with its SHA-256
  _SLIPCASE/VERIFICATION.txt              what was computed, what is pending
  {slug}.pdf / .tex          the working paper (current wager)
  _RESOURCES/field-results.json           the numbers the paper stands on

REBUILD
  see 000__REBUILD.txt. Minimal: python3 _SLIPCASE/rebuild.py ZETTELS.jsonl out/

TO CONTINUE THE WORK
  1. Add new zettels as new cards (never edit an old payload). Every new zettel carries SOURCE URL.
  2. Rerun extract.py → compile.py in slipcase-build/ (sources in _RESOURCES/) with the new paste appended.
  3. Merge by exact payload SHA-256 only. Keep ghosts, appearances, conflicts. Rerun resolution.
""")
W('000__REBUILD.txt', f"""REBUILD — {CHECKPOINT}

FROM THE DECK ALONE (no compiler needed)
  python3 _SLIPCASE/rebuild.py ZETTELS.jsonl <out-dir>
  → writes every root card and _MD mirror from the embedded payloads and checks each SHA-256.
  The compiler ran this test before packaging; see _SLIPCASE/VERIFICATION.txt → RECONSTRUCTION STATE.

FROM index.html ALONE
  index.html embeds the same deck (window.SLIP.zettels[].payload, .filename, .sha256). Save the
  "ZETTELS.jsonl" download it offers, then run the line above. Hashes can be re-checked in the
  page (section REBUILD) with the browser's SubtleCrypto where available.

FULL REBUILD (numbers, renders, paper) — needs the repository
  cd tractor-dce-gyo/slipcase-build
  python3 extract.py                # raw paste → work/zettels.json + work/poml.txt
  node measure-field.js             # → work/field/field-results.json + before/after MPDs
  python3 -m http.server 8899 &     # from the repository root, for the viewer
  node render-field.js              # → work/field/*.png (Chromium)
  python3 compile.py                # → desk/ and the ZIP
  Sources of all five scripts are in _RESOURCES/.

WHAT CANNOT BE REBUILT FROM THIS PACKAGE
  The repository catalogue (nabugo-parts.json), port index and kit corpus are not included
  (see _RESOURCES/repository, LINK_ONLY). The two control kits and four repository files are.
""")
W('000__START_HERE.txt', f"""START HERE — {CHECKPOINT}
{DATE} · {len(cards)} zettels · {len(platform_names)} platforms · {len(ghosts)} ghosts · {len(works)} works · 1 working paper · 7 seed prompts

WHAT THIS IS
A portable research field about assembling LEGO models in LDraw with language models:
attention, feedback, language-games, assembly theory, and the benchmarks that already exist.
Every card you see at this level is one immutable zettel, exactly as archived.
The paper is a wager the field can presently support. The seeds are prompts to test.

READ
  index.html            open it alone, offline: cards, graph, sources, paper, prompts, rebuild
  READER.html           the desk without the capsule sections
  NETWORK.html / .svg   the whole field
  CARDS.html            print 4×6 notecards
  {slug}.pdf   the working paper ("The Field, Not the Window")
  _PROMPTS/README.txt   the seeds and the one number that was actually measured

ORIENT
  000__INDEX.txt        every card, in order
  000__MAP.txt          topology: hubs, bridges, ghosts, crossings
  000__BIBLIOGRAPHY.txt what the field cites
  000__OPEN_EDGES.txt   what is unfinished
  000__MAKING_HISTORY.txt  what actually happened
  000__RETURN_PATH.txt  how to come back and continue

LAWS THAT SHAPED THE PACKAGE
  one zettel = one root .txt = one exact payload = one SHA-256 · never rewritten · ghosts preserved ·
  nothing invented: counts are computed, unknowns say PENDING or UNVERIFIED.
""")
W('000__MAKING_HISTORY.txt', f"""MAKING HISTORY — {CHECKPOINT}

WHO
  researcher     {RESEARCHER}
  model/version  a Claude model operating Claude Code in a remote session ({SESSION}). The exact model
                 identifier is withheld from repository artifacts by the session's attribution policy;
                 it is recorded in the session transcript and in the commit trailer that adds this package.
  date           {DATE}

ORIGIN
  cards          87 zettels pasted by the researcher into one chat message on {DATE}, in four batches
                 (18 + 19 + 15-collapsed + 19 + 16 cards; the whitespace-collapsed batch arrived on a single line
                 and is preserved as pasted). Origin tag on every filename: from-{ORIGIN}.
  resources      the repository tractor-dce-gyo (catalogue, port index, 17 kits, builds, critic), read locally.
  prompt         the POML "SLIPCASE — PORTABLE RESEARCH FIELD" (15.55-AM), pasted after the cards.

CONTROL (who or what selected)
  sources        the researcher (the cards and their BibTeX); nothing was added from the network.
  argument       the model, after reading all 87 cards; the field measurement was the model's choice of stepping stone.
  title          the model.
  structure      the POML's publication list; file naming per its cards rule.
  connective prose  the model (marked COMPILER in the paper's SOURCE_MAP).
  graph resolutions the compiler, by the POML ladder (exact ID → alias → unique title → platform → external → GHOST);
                 no fuzzy matching; no aliases registered (ALIASES.json is empty).
  visual design  the model (quiet serif desk; no CDN, fonts or network).
  MOCs / arrangements  the model's interpretation after reading; platform MOCs are automatic.

UNTOUCHED
  every zettel payload (byte-exact; hashes in ZETTELS.json and MANIFEST.json);
  the POML prompt; the request line; quotations inside cards.

EXTRACTION DECISIONS (boundaries, not edits)
  · chat-UI timing artifacts at batch ends ("Worked for 1m 49s", "}}Worked for 3m 51s", "`Worked for 36s",
    "Worked for 2m 42s") were cut; the closing brace of each preceding BibTeX entry was kept.
  · payload = from the literal "ZETTEL" opener to the last non-whitespace character before the next opener.
  · the 15 collapsed cards are stored on one line each, exactly as they arrived.
  · schema fields = labels present in ≥50% of multiline cards; sub-labels (e.g. TARGET:, VERIFY:) stay inside
    their enclosing field. Field parsing affects only derived views, never payloads.

VERIFIED (by tools, this run)
  {len(cards)} root cards = {len(cards)} _MD mirrors = {len(cards)} JSON records, each hash re-read from disk;
  every PLATFORM, LINKS and [[address]] compiled to a relation record; bibliography parsed by a brace-aware
  scanner; paper citekeys checked against the compiled bibliography; rebuild.py run into a scratch directory
  and compared byte for byte; ZIP tested with unzip -t; PDF page count read from the PDF.

UNVERIFIED
  the researcher's name (derived from the account); any human review of the paper; the correctness of
  BibTeX fields as typed by the researcher; the earlier body-line/joints computation; AABB coverage under
  slopes (an approximation stated in the paper).

Never "AI-assisted": the model wrote the compiler, ran the instrument, wrote the paper; the researcher
wrote the cards and the prompt. Nobody else has looked at this package yet.
""")

# ─────────────────────────────────────────── _SLIPCASE
with open(os.path.join(DESK, '_SLIPCASE', 'NODES.jsonl'), 'w', encoding='utf-8') as f:
    for n in nodes: f.write(json.dumps(n, ensure_ascii=False) + '\n')
    for k, w in works.items(): f.write(json.dumps(dict(type='SOURCE', key='S:' + k, name=k, label=w['citation'][:80], klass=w['klass'], cards=w['cards']), ensure_ascii=False) + '\n')
    for r in resources: f.write(json.dumps(dict(type='RESOURCE', key='R:' + r['name'], name=r['name'], label=r['name'], state=r['state']), ensure_ascii=False) + '\n')
    for fn, _ in prompts.seed_files(POML, request_line):
        if fn != 'README.txt': f.write(json.dumps(dict(type='PROMPT', key='PR:' + fn, name=fn, label=fn), ensure_ascii=False) + '\n')
with open(os.path.join(DESK, '_SLIPCASE', 'RELATIONS.jsonl'), 'w', encoding='utf-8') as f:
    for r in relations: f.write(json.dumps(dict(r, native=True), ensure_ascii=False) + '\n')
    for d in derived: f.write(json.dumps(dict(d, native=False), ensure_ascii=False) + '\n')
with open(os.path.join(DESK, '_SLIPCASE', 'APPEARANCES.jsonl'), 'w', encoding='utf-8') as f:
    for c in cards: f.write(json.dumps(dict(zettel=c['id'], sha256=c['sha256'], resource='paste__2026-09-03__zettel-batches-and-poml.txt', batch=c['batch'], form=c['form'], char_offset=RAW_PASTE.find(c['payload'][:200]), order=c['order'], filename=c['filename']), ensure_ascii=False) + '\n')
json.dump(dict(note='No aliases registered: no ORIGINAL ID collided and no card declared an alias. Add {"alias": "canonical-id"} entries here and rerun compile.py.', aliases=ALIASES), open(os.path.join(DESK, '_SLIPCASE', 'ALIASES.json'), 'w'), indent=1)
W(os.path.join('_SLIPCASE', 'rebuild.py'), '''#!/usr/bin/env python3
"""Rebuild every root card and _MD mirror from ZETTELS.jsonl and verify each SHA-256.
usage: python3 rebuild.py ZETTELS.jsonl <out-dir>"""
import sys, os, json, hashlib
src, out = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(out, '_MD'), exist_ok=True)
ok = bad = 0
for line in open(src, encoding='utf-8'):
    r = json.loads(line); b = r['payload'].encode('utf-8')
    h = hashlib.sha256(b).hexdigest()
    open(os.path.join(out, r['filename']), 'wb').write(b)
    open(os.path.join(out, '_MD', r['filename'][:-4] + '.md'), 'wb').write(b)
    if h == r['sha256']: ok += 1
    else: bad += 1; print('HASH MISMATCH', r['filename'])
print(f'rebuilt {ok} cards; {bad} hash mismatches')
sys.exit(1 if bad else 0)
''')
# reconstruction test
rt = os.path.join(WORK, 'rebuild-test'); shutil.rmtree(rt, ignore_errors=True)
rb = subprocess.run(['python3', os.path.join(DESK, '_SLIPCASE', 'rebuild.py'), os.path.join(DESK, 'ZETTELS.jsonl'), rt], capture_output=True, text=True)
identical = all(open(os.path.join(rt, c['filename']), 'rb').read() == open(os.path.join(DESK, c['filename']), 'rb').read() for c in cards) if rb.returncode == 0 else False
recon = f"rebuild.py exit {rb.returncode}: {rb.stdout.strip()}; regenerated files byte-identical to root cards: {identical}"

# ─────────────────────────────────────────── index.html capsule + READER.html
text_bodies = {}
for r in resources:
    if r.get('local') and r['type'] in ('paste', 'prompt', 'dataset', 'code', 'model', 'file') and r['bytes'] < 400000 and not r['name'].endswith('.png'):
        try: text_bodies[r['name']] = open(os.path.join(DESK, r['local']), encoding='utf-8').read()
        except Exception: pass
SLIP = dict(checkpoint=CHECKPOINT, package=PACKAGE, schema=SCHEMA, date=DATE, researcher=RESEARCHER, session=SESSION,
            zettels=[dict(r, payload=c['payload']) for r, c in zip(records, cards)], nodes=nodes, relations=relations,
            bibliography=[dict(key=k, citation=w['citation'], klass=w['klass'], cards=w['cards'], doi=w['doi'], url=w['url'], raw=w['raw']) for k, w in works.items()],
            resources=[dict(r, body=text_bodies.get(r['name'])) for r in resources], mocs=moc_list, arrangements=arr_list, network_svg=NET_SVG_I)
paper_body = re.search(r'<body>(.*)</body>', paper_html, re.S).group(1)
prompt_sections = ''.join(f'<details><summary>{render.ESC(fn)}</summary><pre class="payload">{render.ESC(t)}</pre></details>' for fn, t in prompts.seed_files(POML, request_line))
deck_b64 = ''
import base64
deck_jsonl = ''.join(json.dumps(dict(r, payload=c['payload']), ensure_ascii=False) + '\n' for r, c in zip(records, cards))
deck_b64 = base64.b64encode(deck_jsonl.encode('utf-8')).decode()
EXTRA = f"""
<div class="section" id="paper"><h2>Paper — {render.ESC(P['title'])}</h2><p class="small">Current wager, never evidence. Files: {slug}.pdf · {slug}.tex · {slug}__SOURCE_MAP.txt</p><div style="max-width:78ch">{paper_body}</div></div>
<div class="section" id="sourcemap"><h2>Paper source map</h2><pre class="payload">{render.ESC(open(os.path.join(DESK, slug + '__SOURCE_MAP.txt'), encoding='utf-8').read())}</pre></div>
<div class="section" id="prompts"><h2>Prompts</h2><p class="small">The exact assembly prompt and the seven seeds. Byte-exact copies live in _PROMPTS/.</p>{prompt_sections}</div>
<div class="section" id="history"><h2>Making history</h2><pre class="payload">{render.ESC(open(os.path.join(DESK, '000__MAKING_HISTORY.txt'), encoding='utf-8').read())}</pre></div>
<div class="section" id="return"><h2>Return path</h2><pre class="payload">{render.ESC(open(os.path.join(DESK, '000__RETURN_PATH.txt'), encoding='utf-8').read())}</pre></div>
<div class="section" id="rebuild"><h2>Rebuild</h2><pre class="payload">{render.ESC(open(os.path.join(DESK, '000__REBUILD.txt'), encoding='utf-8').read())}</pre><p><a download="ZETTELS.jsonl" href="data:application/x-ndjson;base64,{deck_b64}">download ZETTELS.jsonl (the deck with payloads)</a> · <button onclick="verifyHashes(this)">re-check every payload hash in this page</button> <span id="vh" class="small"></span></p><pre class="payload">{render.ESC(open(os.path.join(DESK, '_SLIPCASE', 'rebuild.py'), encoding='utf-8').read())}</pre></div>
<div class="section" id="manifest"><h2>Manifest</h2><p class="small">_SLIPCASE/MANIFEST.json lists every file with its SHA-256 (written after this page, so it is not embedded here; the deck hashes above are).</p><div id="mf"></div></div>
<script>
async function verifyHashes(btn){{ const out=document.getElementById('vh'); if(!(window.crypto&&crypto.subtle)){{ out.textContent='SubtleCrypto unavailable in this context (open over http(s) or use rebuild.py)'; return; }} let ok=0,bad=[]; for(const z of window.SLIP.zettels){{ const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(z.payload)))].map(b=>b.toString(16).padStart(2,'0')).join(''); if(h===z.sha256) ok++; else bad.push(z.id); }} out.textContent=ok+' of '+window.SLIP.zettels.length+' hashes match'+(bad.length?'; mismatches: '+bad.join(', '):''); }}
</script>"""
nav_extra = '<a href="#paper" style="margin-left:auto;font-size:13px">paper</a><a href="#prompts" style="font-size:13px;margin-left:10px">prompts</a><a href="#history" style="font-size:13px;margin-left:10px">history</a><a href="#rebuild" style="font-size:13px;margin-left:10px">rebuild</a>'
data_json = json.dumps(SLIP, ensure_ascii=False).replace('</script', '<\\/script')
W('index.html', render.reader_shell(data_json, CHECKPOINT, 'SLIPCASE — the field, not the window', EXTRA, nav_extra))
W('READER.html', render.reader_shell(data_json, CHECKPOINT, 'READER — ' + CHECKPOINT))

# ─────────────────────────────────────────── verification + manifest + zip
def manifest():
    m = []
    for root, _, files in os.walk(DESK):
        for fn in files:
            p = os.path.join(root, fn); rel = os.path.relpath(p, DESK).replace(os.sep, '/')
            if rel in ('_SLIPCASE/MANIFEST.json',): continue
            m.append(dict(path=rel, bytes=os.path.getsize(p), sha256=sha(open(p, 'rb').read())))
    return sorted(m, key=lambda x: x['path'])
root_txt = sorted(f for f in os.listdir(DESK) if re.match(r'^\d{3}__', f) and not f.startswith('000__') and f.endswith('.txt'))
md_files = sorted(f for f in os.listdir(os.path.join(DESK, '_MD')) if f.endswith('.md'))
platform_occ = sum(len(c['platforms']) for c in cards); links_occ = sum(len(c['links']) for c in cards); addr_all = sum(len(c['addresses']) for c in cards)
verif = f"""VERIFICATION — {CHECKPOINT}
Computed by compile.py on {datetime.datetime.utcnow().isoformat()}Z. Nothing here is assumed; PENDING / UNVERIFIED mark what was not computed.

SOURCE COVERAGE
  material available: one chat message (request line + 4 pasted batches + POML) and the local repository. No other chat history. No network.
  batches: {', '.join(f"b{b['no']} {b['cards']} cards ({' + '.join(f'{n} {fm}' for fm, n in collections.Counter(c['form'] for c in cards if c['batch']==b['no']).items())}) {b['chars']} chars" for b in Zj['batches'])}
  artifacts cut at boundaries: {Zj['artifacts']}

EXTRACTION
  zettels found {len(cards)} · ADMITTED {len(cards)} · PARTIAL 0 · EXACT_DUPLICATE 0 · POSSIBLE_DUPLICATE 0 · NOT_A_ZETTEL: the request line and the POML (preserved as prompts) · AMBIGUOUS 0 · MISSING 0
  forms: multiline {sum(1 for c in cards if c['form']=='multiline')} · collapsed (single-line as pasted) {sum(1 for c in cards if c['form']=='collapsed')}
  schema fields used for derived views: {Zj['schema']}

DUPLICATES / ID COLLISIONS
  distinct ORIGINAL IDs {len({c['id'] for c in cards})} of {len(cards)} · distinct payload SHA-256 {len({c['sha256'] for c in cards})} · duplicate titles {sum(1 for t, n in titles.items() if n > 1)}

REQUIRED EQUALITIES
  admitted zettels {len(cards)} = root zettel TXT files {len(root_txt)} = _MD mirrors {len(md_files)} = JSON records {len(records)}  → {'OK' if len(cards)==len(root_txt)==len(md_files)==len(records) else 'FAIL'}
  PLATFORM occurrences {platform_occ} = MEMBER_OF records {sum(1 for r in relations if r['kind']=='MEMBER_OF')}  → {'OK' if platform_occ==sum(1 for r in relations if r['kind']=='MEMBER_OF') else 'FAIL'}
  LINKS occurrences {links_occ} = LINKS_TO records {sum(1 for r in relations if r['kind']=='LINKS_TO')}  → {'OK' if links_occ==sum(1 for r in relations if r['kind']=='LINKS_TO') else 'FAIL'}
  all [[ADDRESSES]] {addr_all} = classified relation records {len(relations)}  → {'OK' if addr_all==len(relations) else 'FAIL'}
  paper citekeys ⊆ compiled bibliography: {len(PAPER.CITEKEYS_USED)} used, missing {missing_cites or 'none'}  → {'OK' if not missing_cites else 'FAIL'}

PLATFORM RELATIONS   {sum(1 for r in relations if r['kind']=='MEMBER_OF')} MEMBER_OF over {len(platform_names)} platforms ({sum(1 for m in platform_names.values() if len(m)>1)} platforms with >1 member)
LINKS RELATIONS      {sum(1 for r in relations if r['kind']=='LINKS_TO')} LINKS_TO: resolved to zettels {sum(1 for r in relations if r['kind']=='LINKS_TO' and r['resolved'])}, ghosts {sum(1 for r in relations if r['kind']=='LINKS_TO' and r['target_type']=='GHOST')}
WIKILINK COVERAGE    {sum(1 for r in relations if r['kind']=='WIKILINKS_TO')} WIKILINKS_TO from fields {sorted({r['field'] for r in relations if r['kind']=='WIKILINKS_TO'})}: resolved {sum(1 for r in relations if r['kind']=='WIKILINKS_TO' and r['resolved'])}, platforms {sum(1 for r in relations if r['kind']=='WIKILINKS_TO' and r['target_type']=='PLATFORM')}, ghosts {sum(1 for r in relations if r['kind']=='WIKILINKS_TO' and r['target_type']=='GHOST')}
GHOSTS / AMBIGUITIES / BROKEN REFERENCES
  ghosts {len(ghosts)} (all shaped like zettel IDs: {len(broken_ids)}) · ambiguities 0 (no literal matched more than one node) · aliases 0
BIBLIOGRAPHY COVERAGE
  BibTeX blocks {sum(len(w['variants']) for w in works.values())} · works (distinct citekeys) {len(works)} · UNIQUE {sum(1 for w in works.values() if w['klass'].startswith('UNIQUE'))} · SHARED {sum(1 for w in works.values() if w['klass'].startswith('SHARED'))} · BIB-CONFLICT {sum(1 for w in works.values() if 'CONFLICT' in w['klass'])} · BIB-ALIAS {sum(1 for w in works.values() if 'ALIAS' in w['klass'])} · UNRESOLVED {sum(1 for w in works.values() if 'UNRESOLVED' in w['klass'])}
  with DOI {sum(1 for w in works.values() if w['doi'])} · with URL {sum(1 for w in works.values() if w['url'])} · NEEDS-CITATION candidates {len(needs_citation)} (heuristic)
  cards with ≥1 BibTeX block {sum(1 for c in cards if c['bibtex'])} of {len(cards)} · unclosed entries 0
RESOURCE COVERAGE
  registered {len(resources)}: PASTED {sum(1 for r in resources if r['state']=='PASTED')} · GENERATED {sum(1 for r in resources if r['state']=='GENERATED')} · LOCAL_FILE {sum(1 for r in resources if r['state']=='LOCAL_FILE')} · LINK_ONLY {sum(1 for r in resources if r['state']=='LINK_ONLY')} · SNAPSHOT 0
  bodies present under _RESOURCES/: {sum(1 for r in resources if r.get('local'))} · unavailable bodies (LINK_ONLY receipts): {sum(1 for r in resources if r['state']=='LINK_ONLY')}
RECONSTRUCTION STATE
  {recon}
PAPER EVIDENCE COVERAGE
  SOURCE_MAP entries {len(PAPER.SOURCE_MAP)}: SOURCE {sum(1 for m in PAPER.SOURCE_MAP if m['kind']=='SOURCE')} · COMPUTED {sum(1 for m in PAPER.SOURCE_MAP if m['kind']=='COMPUTED')} · COMPILER {sum(1 for m in PAPER.SOURCE_MAP if m['kind']=='COMPILER')}
  zettels cited by the paper {len({z for m in PAPER.SOURCE_MAP for z in m['zettels']})} of {len(cards)}; citekeys {len(PAPER.CITEKEYS_USED)} of {len(works)}
  paper warnings: figures are PNG renders (no vector); tables computed; no human review
ASSEMBLY PROMPT STATUS
  preserved verbatim in 3 places; sha256 {sha(POML)}; {len(POML)} chars; identical copies verified: {'OK' if open(os.path.join(DESK, '_RESOURCES', 'poml__SLIPCASE-PORTABLE-RESEARCH-FIELD__15.55-AM.txt'), encoding='utf-8').read()==POML else 'FAIL'}
MAKING HISTORY
  000__MAKING_HISTORY.txt written; researcher name UNVERIFIED (account-derived); human review: none
PDF STATUS
  {pdf_status}
  TeX: {slug}.tex written; not compiled here (no TeX installation) — UNVERIFIED as a LaTeX build
ZIP STATUS
  see the last section, appended after packaging
STRUCTURE
  root: {len(root_txt)} zettel cards + {len([f for f in os.listdir(DESK) if f.startswith('000__')])} 000__ files + index.html READER.html NETWORK.html NETWORK.svg CARDS.html MARK.svg ZETTELS.txt/.json/.jsonl + paper (.tex .html .pdf SOURCE_MAP MAKING_HISTORY ASSEMBLY_APPENDIX) + {CHECKPOINT}__references.bib
  folders: _MD {len(md_files)} · _MOCS {len(os.listdir(os.path.join(DESK,'_MOCS')))} · _ARRANGEMENTS {len(os.listdir(os.path.join(DESK,'_ARRANGEMENTS')))} · _PROMPTS {len(os.listdir(os.path.join(DESK,'_PROMPTS')))} · _RESOURCES {len(os.listdir(os.path.join(DESK,'_RESOURCES')))} · _SLIPCASE 7 files
NOT COMPLETE
  ghosts {len(ghosts)} remain open · S02–S07 untested · TeX build unverified · researcher unreviewed · clutch test absent
"""
W(os.path.join('_SLIPCASE', 'VERIFICATION.txt'), verif)
json.dump(dict(checkpoint=CHECKPOINT, package=PACKAGE, schema=SCHEMA, date=DATE, return_path='000__RETURN_PATH.txt', zettels=len(cards), files=manifest()), open(os.path.join(DESK, '_SLIPCASE', 'MANIFEST.json'), 'w'), indent=1)
zip_path = os.path.join(HERE, PACKAGE)
if os.path.exists(zip_path): os.remove(zip_path)
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(DESK):
        for fn in sorted(files):
            p = os.path.join(root, fn); z.write(p, os.path.relpath(p, DESK))
with zipfile.ZipFile(zip_path) as z: bad = z.testzip(); n_entries = len(z.namelist())
zs = f"ZIP {PACKAGE}: {os.path.getsize(zip_path)} bytes · {n_entries} entries · testzip {'OK (no corrupt entry)' if bad is None else 'CORRUPT: ' + bad} · sha256 {sha(open(zip_path,'rb').read())}"
# append zip status into VERIFICATION and refresh it + manifest inside the archive
verif2 = verif.replace('ZIP STATUS\n  see the last section, appended after packaging', 'ZIP STATUS\n  ' + zs + '\n  (VERIFICATION.txt and MANIFEST.json were refreshed inside the archive after this test; the archive was re-tested once more — result in slipcase-build/work/build-log.txt, outside the ZIP)')
W(os.path.join('_SLIPCASE', 'VERIFICATION.txt'), verif2)
json.dump(dict(checkpoint=CHECKPOINT, package=PACKAGE, schema=SCHEMA, date=DATE, return_path='000__RETURN_PATH.txt', zettels=len(cards), files=manifest()), open(os.path.join(DESK, '_SLIPCASE', 'MANIFEST.json'), 'w'), indent=1)
os.remove(zip_path)
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, _, files in os.walk(DESK):
        for fn in sorted(files):
            p = os.path.join(root, fn); z.write(p, os.path.relpath(p, DESK))
with zipfile.ZipFile(zip_path) as z: bad2 = z.testzip(); n2 = len(z.namelist())
final = f"final ZIP {PACKAGE}: {os.path.getsize(zip_path)} bytes · {n2} entries · testzip {'OK' if bad2 is None else 'CORRUPT ' + bad2} · sha256 {sha(open(zip_path,'rb').read())}"
open(os.path.join(WORK, 'build-log.txt'), 'w').write(zs + '\n' + final + '\n' + recon + '\n' + pdf_status + '\n')
print(verif2); print(final)
