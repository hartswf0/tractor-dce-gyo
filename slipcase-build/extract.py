#!/usr/bin/env python3
"""SLIPCASE extractor.  Reads the raw pasted research context and writes
work/zettels.json (parsed cards, exact payloads, sha256) + work/poml.txt.
Nothing here rewrites a payload; boundary decisions are logged to work/extract-log.txt.
"""
import re, json, hashlib, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw', 'paste__2026-09-03__zettel-batches-and-poml.txt')
WORK = os.path.join(HERE, 'work'); os.makedirs(WORK, exist_ok=True)
text = open(RAW, encoding='utf-8').read()
log = []

# ---- 1. isolate the POML assembly prompt (verbatim) ----
pi = text.index('<poml version=')
pe = text.index('</poml>') + len('</poml>')
poml = text[pi:pe]
open(os.path.join(WORK, 'poml.txt'), 'w', encoding='utf-8').write(poml)
pre = text[:pi]           # everything before the POML: request line + five batches
log.append(f'POML span: chars {pi}-{pe} ({pe-pi} chars)')

# ---- 2. the user's request line (first line) ----
first_nl = pre.index('\n')
request = pre[:first_nl]
# UI timing artifact glued to the request line
m = re.search(r'\s*Worked for \d+m? ?\d*s?$', request)
artifacts = []
if m:
    artifacts.append(('request line', request[m.start():]))
    request = request[:m.start()]
rest = pre[first_nl+1:]

# ---- 3. split batches on the chat-UI timing artifacts ----
# The artifacts look like "}Worked for 3m 51s" (glued to a closing brace) or "`Worked for 36s".
parts = re.split(r'(`?Worked for \d+m? ?\d*s?)', rest)
batches, cur = [], ''
for i, seg in enumerate(parts):
    if i % 2 == 0: cur = seg
    else:
        artifacts.append((f'batch {len(batches)+1} end', seg))
        batches.append(cur)
if cur.strip(): batches.append(cur)   # last batch (ends at the POML)
log.append(f'batches: {len(batches)} (split on chat-UI "Worked for" artifacts: {artifacts})')

# ---- 4. split each batch into cards ----
cards = []
def add(payload, batch_no, form):
    payload = payload.strip('\n').rstrip()
    # trailing/leading whitespace outside the payload is a boundary decision, logged once below
    cards.append({'batch': batch_no, 'form': form, 'payload': payload})

for bi, b in enumerate(batches, 1):
    # a batch may hold multiline cards followed (without any separator) by whitespace-collapsed cards
    segs = re.split(r'(?=ZETTEL  ID: )', b)
    multi = segs[0]
    if multi.strip():
        chunks = re.split(r'(?m)^ZETTEL$\n', multi)
        head = chunks[0]
        if head.strip(): log.append(f'batch {bi}: text before first ZETTEL ignored as non-zettel: {head.strip()[:80]!r}')
        for c in chunks[1:]:
            add('ZETTEL\n' + c, bi, 'multiline')
    for c in segs[1:]:
        add(c, bi, 'collapsed')
log.append('payload boundary: from the literal "ZETTEL" opener up to the last non-whitespace character before the next opener (closing brace of the final BibTeX entry); surrounding blank lines are outside the payload')

# ---- 5. field parsing ----
def parse_fields_multiline(payload):
    fields, order, cur, buf = {}, [], None, []
    for line in payload.split('\n')[1:]:   # skip the ZETTEL opener
        m = re.match(r'^([A-Z][A-Z0-9 /&\-]{0,40}):\s*$', line)
        if m:
            if cur is not None: fields.setdefault(cur, []).append('\n'.join(buf).strip('\n'))
            cur, buf = m.group(1), []
            order.append(cur)
        else:
            buf.append(line)
    if cur is not None: fields.setdefault(cur, []).append('\n'.join(buf).strip('\n'))
    return fields, order

# schema = labels that occur in nearly every multiline card
lab_count = {}
for c in cards:
    if c['form'] == 'multiline':
        f, o = parse_fields_multiline(c['payload'])
        for k in set(o): lab_count[k] = lab_count.get(k, 0) + 1
n_multi = sum(1 for c in cards if c['form']=='multiline')
SCHEMA = sorted([k for k, v in lab_count.items() if v >= n_multi * 0.5], key=len, reverse=True)
log.append(f'schema fields (>=50% of multiline cards): {SCHEMA}')
sub_labels = sorted([k for k, v in lab_count.items() if v < n_multi * 0.5])
log.append(f'non-schema labels kept inside the enclosing field body: {sub_labels}')

def parse_fields_any(payload, form):
    if form == 'multiline':
        raw, order = parse_fields_multiline(payload)
        fields = {}
        for k in order:
            if k in SCHEMA:
                fields.setdefault(k, [])
        # re-walk: attach non-schema labelled chunks to the previous schema field
        cur = None; out = {}; seq = []
        for line in payload.split('\n')[1:]:
            m = re.match(r'^([A-Z][A-Z0-9 /&\-]{0,40}):\s*$', line)
            if m and m.group(1) in SCHEMA:
                cur = m.group(1); out.setdefault(cur, []).append([]); seq.append(cur)
            elif cur is not None:
                out[cur][-1].append(line)
        return {k: ['\n'.join(x).strip('\n') for x in v] for k, v in out.items()}, seq
    else:
        pat = re.compile(r'(?:^ZETTEL  |  )(' + '|'.join(re.escape(s) for s in SCHEMA) + r'): ')
        out, seq = {}, []
        pos = [(m.start(), m.end(), m.group(1)) for m in pat.finditer(payload)]
        for i, (s, e, k) in enumerate(pos):
            end = pos[i+1][0] if i+1 < len(pos) else len(payload)
            out.setdefault(k, []).append(payload[e:end].strip()); seq.append(k)
        return out, seq

WIKI = re.compile(r'\[\[([^\[\]]+?)\]\]')

def parse_bibtex(s):
    """brace-aware BibTeX entry scanner; returns list of dicts. Never repairs."""
    entries, i = [], 0
    while True:
        m = re.search(r'@(\w+)\s*\{', s[i:])
        if not m: break
        start = i + m.start(); j = i + m.end(); depth = 1
        while j < len(s) and depth:
            if s[j] == '{': depth += 1
            elif s[j] == '}': depth -= 1
            j += 1
        raw = s[start:j]
        body = s[i+m.end():j-1] if depth == 0 else s[i+m.end():]
        etype = m.group(1)
        km = re.match(r'\s*([^,\s]+)\s*,', body)
        key = km.group(1) if km else None
        fields = {}
        rest = body[km.end():] if km else body
        # scan field = {value} / "value" / bare
        p = 0
        while p < len(rest):
            fm = re.match(r'\s*(\w+)\s*=\s*', rest[p:])
            if not fm: break
            name = fm.group(1).lower(); p += fm.end()
            if p < len(rest) and rest[p] == '{':
                d = 1; q = p + 1
                while q < len(rest) and d:
                    if rest[q] == '{': d += 1
                    elif rest[q] == '}': d -= 1
                    q += 1
                val = rest[p+1:q-1]; p = q
            elif p < len(rest) and rest[p] == '"':
                q = rest.index('"', p+1); val = rest[p+1:q]; p = q + 1
            else:
                vm = re.match(r'([^,\n]*)', rest[p:]); val = vm.group(1).strip(); p += vm.end()
            fields[name] = re.sub(r'\s+', ' ', val.strip())
            cm = re.match(r'\s*,', rest[p:])
            if cm: p += cm.end()
        entries.append({'type': etype, 'key': key, 'fields': fields, 'raw': raw.strip(), 'closed': depth == 0})
        i = j if depth == 0 else len(s)
    return entries

for n, c in enumerate(cards, 1):
    f, seq = parse_fields_any(c['payload'], c['form'])
    c['order'] = n
    c['fields'] = f
    c['field_sequence'] = seq
    g = lambda k: (f.get(k) or [''])[0]
    c['id'] = g('ID').strip() or None
    c['title'] = re.sub(r'\s+', ' ', g('TITLE')).strip() or None
    c['source'] = g('SOURCE')
    c['platforms'] = WIKI.findall(g('PLATFORM'))
    c['links'] = WIKI.findall(g('LINKS'))
    # every [[address]] anywhere, with field + ordinal
    addr = []
    for k, vals in f.items():
        for v in vals:
            for o, mm in enumerate(WIKI.finditer(v), 1):
                addr.append({'field': k, 'ordinal': o, 'literal': mm.group(1)})
    c['addresses'] = addr
    c['bibtex'] = parse_bibtex(g('BIBTEX'))
    c['sha256'] = hashlib.sha256(c['payload'].encode('utf-8')).hexdigest()
    c['bytes'] = len(c['payload'].encode('utf-8'))
    c['chars'] = len(c['payload'])
    c['lines'] = c['payload'].count('\n') + 1

json.dump({'request': request, 'cards': cards, 'schema': SCHEMA, 'artifacts': artifacts,
           'batches': [{'no': i+1, 'chars': len(b), 'cards': sum(1 for c in cards if c['batch']==i+1),
                        'form': next((c['form'] for c in cards if c['batch']==i+1), None)} for i, b in enumerate(batches)]},
          open(os.path.join(WORK, 'zettels.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
open(os.path.join(WORK, 'extract-log.txt'), 'w', encoding='utf-8').write('\n'.join(log) + '\n')

# ---- report ----
print('cards:', len(cards), '| multiline:', n_multi, '| collapsed:', len(cards)-n_multi)
ids = [c['id'] for c in cards]
print('ids missing:', sum(1 for i in ids if not i), '| distinct ids:', len(set(ids)), '| distinct payload sha:', len(set(c['sha256'] for c in cards)))
print('cards with PLATFORM:', sum(1 for c in cards if c['platforms']), '| with LINKS:', sum(1 for c in cards if c['links']), '| with BIBTEX entries:', sum(1 for c in cards if c['bibtex']))
print('bib entries:', sum(len(c['bibtex']) for c in cards), '| unclosed:', sum(1 for c in cards for e in c['bibtex'] if not e['closed']), '| keyless:', sum(1 for c in cards for e in c['bibtex'] if not e['key']))
print('addresses total:', sum(len(c['addresses']) for c in cards))
print('platforms:', sorted(set(p for c in cards for p in c['platforms'])))
print('fields per card (min/max):', min(len(c['field_sequence']) for c in cards), max(len(c['field_sequence']) for c in cards))
for c in cards:
    if len(c['field_sequence']) < 15 or not c['id'] or not c['bibtex']:
        print('  THIN?', c['order'], c['form'], c['id'], len(c['field_sequence']), 'bib', len(c['bibtex']))
print('\n'.join(log))
