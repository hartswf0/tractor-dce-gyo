#!/usr/bin/env python3
"""tools/forage/product/cineosis.py — the Odyssey's cineosis page, odyssey/kits/cineosis.html: the film read sign by sign.

  python3 tools/forage/product/cineosis.py

Reads odyssey/cineosis/score.json (every scene of the Regulars' Cut, and the 50 dropped scenes, with a primary sign and up to two
secondaries from the 45 of the cineosis table, each with the table's test answered for the beat, the sign's operation as this scene's shots,
the neighbouring sign avoided with the table's own flip condition; the per-act arcs and compounds; the monotony finding; the proposals; a
`direction` block per scene for the renderers) and odyssey/cineosis/motion.json (the moving-image vocabulary, ranked). The table's own
fields (each sign's name, question, operation, image type and place on the table, from hartswf0/cineosis-lab cineosis-table.json and the
lab's chem-data atoms) are carried in score.json's `distribution`, so the page needs no clone of the lab.

The page: a periodic-table view of the film's usage (scenes per sign, by act), a strip of the 84-minute cut coloured by primary sign (hover or
tap for the scene and its reasoning), the per-act arcs and compounds, where the palette is monotonous and where time-images belong, the motion
vocabulary with its status and the ranked build list, how the edit uses the signs (rules for the cutter), and the direction hook.
"""
import html, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitpages import STYLE, HEAD, E, ROOT

SCORE = json.load(open(os.path.join(ROOT, 'odyssey/cineosis/score.json')))
MOTION = json.load(open(os.path.join(ROOT, 'odyssey/cineosis/motion.json')))
OUT = os.path.join(ROOT, 'odyssey/kits/cineosis.html')
LAB = 'https://hartswf0.github.io/cineosis-lab/periodic-table.html'

SC, DR, DIST = SCORE['scenes'], SCORE['dropped'], SCORE['distribution']
RUN = SCORE['meta']['runtime_s']
ACTS = SCORE['arcs']
ACT_IDS = [a['act'] for a in ACTS]

# the image families (the timeline's colour): eight, in the table's column order
FAM = [('perception', 'Perception', (0,)), ('affect', 'Affection', (1,)), ('impulse', 'Impulse', (2,)), ('action', 'Action', (3, 4)),
       ('reflection', 'Reflection', (5, 6, 7)), ('mental', 'Mental', (8, 9, 10)), ('zero', 'Opsign · sonsign', (11,)),
       ('time', 'Crystal · chrono · noo · lecto', (12, 13, 14, 15))]
FAM_OF_COL = {c: i for i, (_, _, cols) in enumerate(FAM) for c in cols}
COL = {d['n']: d['col'] for d in DIST}
fam = lambda n: FAM_OF_COL[COL[n]]
TYPES = {}
for d in DIST: TYPES.setdefault(d['col'], d['image'])


def pct(x): return f'{100 * x:.0f}%'


EXTRA = '''
:root { --f1: #2a78d6; --f2: #eb6834; --f3: #1baf7a; --f4: #eda100; --f5: #e87ba4; --f6: #008300; --f7: #4a3aa7; --f8: #e34948;
  --a1: #d7d4ca; --a2: #b5b1a4; --a3: #8f8a7c; --a4: #6a6557; --a5: #454136; --a6: #1f1c16; --hatch: #a8801e; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --f1: #3987e5; --f2: #d95926; --f3: #199e70; --f4: #c98500; --f5: #d55181; --f6: #008300; --f7: #9085e9; --f8: #e66767;
  --a1: #3a3832; --a2: #57544b; --a3: #7a766a; --a4: #a09b8d; --a5: #c7c2b3; --a6: #efeadb; } }
:root[data-theme="dark"] { --f1: #3987e5; --f2: #d95926; --f3: #199e70; --f4: #c98500; --f5: #d55181; --f6: #008300; --f7: #9085e9; --f8: #e66767;
  --a1: #3a3832; --a2: #57544b; --a3: #7a766a; --a4: #a09b8d; --a5: #c7c2b3; --a6: #efeadb; }
.ptable { display: grid; grid-template-columns: repeat(16, minmax(58px, 1fr)); gap: 4px; min-width: 980px; }
.ptable .th { font-size: 9px; line-height: 1.2; overflow-wrap: anywhere; hyphens: auto; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; padding: 0 2px 4px; align-self: end; }
.ptable .th.t { color: var(--ink); }
.el { position: relative; border: 1px solid var(--rule); background: var(--card); padding: 4px 5px 5px; min-height: 86px; cursor: pointer; display: flex; flex-direction: column; }
.el:hover, .el:focus { border-color: var(--ink); outline: none; }
.el.time { background: linear-gradient(var(--card), var(--card)) padding-box; border-top: 3px solid var(--ink); }
.el .n { font-size: 10px; color: var(--muted); } .el .s { font: 700 22px/1 'Cormorant Garamond', Georgia, serif; }
.el .c { font-size: 11px; color: var(--muted); margin-top: auto; } .el .c b { font-size: 15px; color: var(--ink); }
.el.zero { opacity: .45; } .el .sw { position: absolute; top: 5px; right: 5px; width: 9px; height: 9px; border-radius: 2px; }
.el .bar { display: flex; gap: 2px; height: 6px; margin-top: 3px; } .el .bar i { display: block; height: 100%; border-radius: 1px; }
.blank { min-height: 86px; }
.tl { position: relative; margin: 14px 0 6px; overflow-x: auto; }
.tl svg { width: 100%; min-width: 900px; height: auto; display: block; font-family: Inter, system-ui, sans-serif; }
.tl svg text { fill: var(--ink); font-size: 10px; } .tl svg .mut { fill: var(--muted); }
.tl svg rect.sc { cursor: pointer; } .tl svg rect.sc:hover, .tl svg rect.sc.on { stroke: var(--ink); stroke-width: 1.5; }
.tip { position: fixed; z-index: 10; max-width: 380px; background: var(--card); border: 1px solid var(--ink); padding: 10px 12px; font-size: 13px; line-height: 1.45;
  pointer-events: none; display: none; box-shadow: 0 6px 24px rgba(0,0,0,.18); }
.tip b { font-weight: 600; } .tip .q { color: var(--muted); font-style: italic; }
.detail { border: 1px solid var(--rule); background: var(--card); padding: 14px 16px; margin: 10px 0 0; min-height: 90px; font-size: 14px; }
.detail h3 { margin-bottom: 4px; } .detail .sg { margin: 10px 0 0; padding-top: 8px; border-top: 1px solid var(--rule); }
.detail .sg p { margin: 3px 0; } .detail .lab { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
.key { font-size: 12px; color: var(--muted); display: flex; flex-wrap: wrap; gap: 4px 16px; margin: 6px 0; }
.key i { display: inline-block; width: 12px; height: 12px; vertical-align: -2px; margin-right: 5px; border-radius: 2px; }
.chip { display: inline-block; font: 600 11px/1.6 Inter, sans-serif; padding: 0 6px; margin: 1px 2px 1px 0; border: 1px solid var(--rule); color: var(--ink); white-space: nowrap; border-radius: 2px; }
.chip i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; vertical-align: 0; }
.arcs { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.arc { background: var(--card); border: 1px solid var(--rule); border-top: 3px solid var(--ink); padding: 12px 14px; font-size: 14px; }
.arc .meta { margin-bottom: 4px; } .arc .seq { margin: 8px 0; line-height: 1.9; } .arc .form { font: 600 14px/1.5 ui-monospace, Menlo, monospace; margin: 8px 0 2px; }
.arc p { color: var(--muted); }
.status { font-weight: 600; white-space: nowrap; } .status.have { color: var(--ok); } .status.partial { color: var(--gold); } .status.missing { color: var(--bad); }
.need { display: inline-block; height: 8px; background: var(--ink); vertical-align: middle; border-radius: 0 2px 2px 0; } .need.d { background: var(--rule); border-radius: 0; }
details.mv { border-bottom: 1px solid var(--rule); } details.mv summary { cursor: pointer; padding: 8px 0; display: grid; grid-template-columns: 34px 1fr 90px 210px 60px; gap: 10px; align-items: center; font-size: 14px; }
details.mv summary::-webkit-details-marker { display: none; } details.mv .body { padding: 0 0 12px 44px; font-size: 14px; } details.mv .body p { margin: 6px 0; }
details.mv .body b { font-weight: 600; } details.mv .rk { font: 700 20px/1 'Cormorant Garamond', Georgia, serif; }
.build { counter-reset: b; list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 14px; }
.build li { background: var(--card); border: 1px solid var(--rule); padding: 12px 14px; font-size: 14px; }
.build li h3 { font-size: 20px; margin-bottom: 4px; } .build li p { color: var(--muted); }
.rules { counter-reset: r; list-style: none; padding: 0; } .rules li { counter-increment: r; padding: 10px 0 10px 44px; position: relative; border-top: 1px solid var(--rule); }
.rules li::before { content: counter(r); position: absolute; left: 0; top: 6px; font: 700 26px/1 'Cormorant Garamond', Georgia, serif; color: var(--blue); }
.find { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; } .find ul { padding-left: 18px; } .find li { margin: 6px 0; font-size: 14px; }
.prop { background: var(--card); border: 1px solid var(--rule); border-left: 3px solid var(--blue); padding: 10px 14px; margin: 10px 0; font-size: 14px; }
.prop p { margin: 4px 0; } .prop .why { color: var(--muted); }
.wired img { width: 100%; height: auto; display: block; margin: 4px 0; border: 1px solid var(--rule); }
pre.hook { background: var(--card); border: 1px solid var(--rule); padding: 12px 14px; overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
table.sc td { font-size: 13px; } table.sc td.sg { white-space: nowrap; }
.pad { overflow-x: auto; padding-bottom: 6px; }
@media (max-width: 800px) { .find { grid-template-columns: 1fr; } .arcs { grid-template-columns: 1fr; }
  details.mv summary { grid-template-columns: 28px 1fr 70px; } details.mv summary .hide-sm { display: none; } details.mv .body { padding-left: 0; } }
'''


def chip(n, sym, label=None):
    return f'<span class="chip" title="{E(label or sym)}"><i style="background:var(--f{fam(n) + 1})"></i>{E(sym)}</span>'


def periodic():
    by = {(d['col'], d['row']): d for d in DIST}
    o = ['<div class="pad"><div class="ptable">']
    for c in range(16):
        o.append(f'<div class="th{" t" if c >= 11 else ""}">{E(TYPES[c])}</div>')
    for r in range(3):
        for c in range(16):
            d = by.get((c, r))
            if not d: o.append('<div class="blank"></div>'); continue
            tot = d['any_cut']
            bar = ''.join(f'<i style="flex:{d["any_by_act"].get(a, 0)};background:var(--a{k + 1})"></i>' for k, a in enumerate(ACT_IDS) if d['any_by_act'].get(a))
            o.append(f'<div class="el{" time" if d["regime"] == "time" else ""}{" zero" if not tot else ""}" tabindex="0" data-n="{E(d["n"])}">'
                     f'<span class="sw" style="background:var(--f{fam(d["n"]) + 1})"></span><span class="n">{E(d["n"])}</span><span class="s">{E(d["symbol"])}</span>'
                     f'<span class="c"><b>{d["primary_cut"]}</b> primary · {tot} any</span><span class="bar">{bar}</span></div>')
    o.append('</div></div>')
    return ''.join(o)


def timeline():
    W, H0, H = 1000, 26, 40
    o = [f'<svg viewBox="0 0 {W} 118" role="img" aria-label="The cut, 84 minutes, each scene coloured by its primary sign">']
    x = lambda t: t / RUN * W
    starts = [x(next(r for r in SC if r['act'] == a['act'])['at']) for a in ACTS] + [W]
    for k, a in enumerate(ACTS):
        x0, room = starts[k], starts[k + 1] - starts[k] - 8
        name = a['name'] if len(a['name']) * 5.6 + 22 < room else ''      # the act's name only where it fits before the next act
        o.append(f'<line x1="{x0:.1f}" x2="{x0:.1f}" y1="6" y2="{H0 + H + 34}" stroke="var(--rule)"/>'
                 f'<text x="{x0 + 3:.1f}" y="15"><tspan font-weight="600">{a["act"]}</tspan> <tspan class="mut">{E(name)}</tspan><title>Act {a["act"]}: {E(a["name"])}</title></text>')
    for b in SCORE['bridges']:
        o.append(f'<rect x="{x(b["at"]):.2f}" y="{H0}" width="{max(1.2, x(b["seconds"])):.2f}" height="{H}" fill="var(--hatch)" opacity=".55"><title>bridge: {E(b["text"])}</title></rect>')
    for k, r in enumerate(SC):
        p = r['primary']; w = x(r['seconds'])
        o.append(f'<rect class="sc" data-k="{k}" x="{x(r["at"]) + .6:.2f}" y="{H0}" width="{max(.8, w - 1.2):.2f}" height="{H}" rx="1.5" fill="var(--f{fam(p["n"]) + 1})"/>')
        ink = '#141414' if fam(p['n']) in (1, 2, 3, 4) else '#fff'      # dark letters on the light fills (orange, aqua, yellow, pink)
        if w > 13: o.append(f'<text x="{x(r["at"]) + w / 2:.1f}" y="{H0 + H / 2 + 4}" text-anchor="middle" style="fill:{ink};font-weight:600;pointer-events:none">{E(p["symbol"])}</text>')
        ts = [s for s in r['secondary'] if s['regime'] == 'time'] + ([p] if p['regime'] == 'time' else [])
        if ts: o.append(f'<rect x="{x(r["at"]) + .6:.2f}" y="{H0 + H + 4}" width="{max(.8, w - 1.2):.2f}" height="5" fill="var(--ink)" opacity="{1 if p["regime"] == "time" else .45}"/>')
    for m in range(0, int(RUN / 60) + 1, 10):
        o.append(f'<text class="mut" x="{x(m * 60):.1f}" y="{H0 + H + 26}">{m}′</text>')
    o.append('</svg>')
    return ''.join(o)


def scene_js():
    rows = []
    for r in SC:
        rows.append(dict(id=r['id'], t=r['title'], act=r['act'], at=round(r['at'] / 60, 1), sec=round(r['seconds']),
                         kb=(r.get('key_beat') or {}).get('emotion'), note=r.get('note'),
                         s=[dict(n=s['n'], sym=s['symbol'], name=s['name'], q=s['question'], a=s['answer'], op=s['operation'],
                                 av=f'{s["avoided"]["name"]} ({s["avoided"]["symbol"]}): {s["avoided"]["why_not"]}', f=fam(s['n']) + 1, role=s['role'])
                            for s in [r['primary']] + r['secondary']],
                         d=r['direction']))
    signs = {d['n']: dict(sym=d['symbol'], name=d['name'], q=d['question'], op=d['operation'], img=d['image'], p=d['primary_cut'], a=d['any_cut'],
                          acts=d['any_by_act'], sc=d['scenes'], dr=d['primary_dropped']) for d in DIST}
    return json.dumps(dict(sc=rows, signs=signs), ensure_ascii=False).replace('</', '<\\/')


def arcs():
    comp = {c['act']: c for c in SCORE['compounds']}
    o = ['<div class="arcs">']
    for a in ACTS:
        c = comp[a['act']]
        seq = ''.join(chip(r['primary']['n'], r['primary']['symbol'], f'{r["id"]} {r["title"]}: {r["primary"]["name"]}') for r in SC if r['act'] == a['act'])
        near = c['nearest_lab'][0]
        o.append(f'''<div class="arc"><div class="meta">Act {a["act"]} · {a["minutes"]}′ · {a["scenes"]} scenes · pT <b>{a["pT"]}</b> · {a["distinct_primary"]} signs</div>
<h3>{E(a["name"])}</h3><div class="seq">{seq}</div>
<div class="form">{E(c["formula"])}</div><div class="meta">compound: <b>{E(c["name"])}</b> · radicals {E(", ".join(c["radicals"]) or "none")}</div>
<p>{E(c["reading"])}</p>
<p class="meta">nearest in the lab: {E(near["name"])} ({near["kind"]}, poem {near["poem"]}; shares {E(", ".join(near["shared"]))})</p></div>''')
    w = SCORE['compound_whole']
    o.append('</div>')
    o.append(f'<p class="sub">The whole cut, by the same rule: <code>{E(w["formula"])}</code> (pT {w["pT"]}). {E(w["reading"])}</p>')
    return ''.join(o)


def findings():
    M = SCORE['monotony']
    a0, p0 = M['no_time_image_any'][0], M['no_time_image_primary'][0]
    sd = M['same_domain_runs']
    ttl = {r['id']: r['title'] for r in SC}
    o = ['<div class="find"><div><h3>Where the palette is monotonous</h3><ul>']
    o.append(f'<li><b>{p0["minutes"]} minutes</b> ({p0["from_min"]}′–{p0["to_min"]}′, {p0["scenes"]} scenes, {E(ttl[p0["from_id"]])} to {E(ttl[p0["to_id"]])}) '
             f'with no time-image as a primary sign: {" ".join(p0["signs"])}. {a0["minutes"]} minutes of it ({E(ttl[a0["from_id"]])} to {E(ttl[a0["to_id"]])}) have no time-image even as a secondary.</li>')
    p1 = M['no_time_image_primary'][1]
    o.append(f'<li><b>{p1["minutes"]} minutes</b> in Act V ({E(ttl[p1["from_id"]])} to {E(ttl[p1["to_id"]])}): marks, duels and vectors. This one is right: the bow and the '
             f'slaughter are the film\'s action climax, and the only time-image the act needs is the bowstring\'s sonsign.</li>')
    for r in sd[:2]:
        o.append(f'<li>{r["scenes"]} {E(r["dom"])}-images in a row, {r["minutes"]}′: {E(ttl[r["from_id"]])} to {E(ttl[r["to_id"]])}.</li>')
    o.append(f'<li>Movement-images carry <b>{pct(M["movement_share_primary_seconds"])}</b> of the cut\'s seconds as primary signs. Six of the 45 signs are never used '
             f'({", ".join(d["symbol"] for d in DIST if d["any_cut"] == 0)}); none of them is asked for by a beat.</li>')
    arcs = ', '.join(f'{a["act"]} {a["pT"]}' for a in ACTS)
    o.append(f'<li>pT by act (the lab\'s measure: 14 × the time-image share of seconds): {arcs}. Act II (Scheria) and Act V (the hall) are the flattest; Act IV (disguise) is the richest.</li>')
    o.append('</ul></div><div><h3>Where time-images belong</h3>')
    for p in SCORE['proposals']:
        o.append(f'<div class="prop"><p><b>{E(p["where"])}</b> · {chip(p["to"], next(d["symbol"] for d in DIST if d["n"] == p["to"]))}</p><p>{E(p["proposal"])}</p><p class="why">{E(p["why"])}</p></div>')
    o.append('</div></div>')
    return ''.join(o)


def motion():
    K = MOTION['kinds']; mx = max(k['scenes_all'] for k in K)
    o = []
    for k in K:
        ic = {'have': '●', 'partial': '◐', 'missing': '○'}[k['status']]
        bar = f'<span class="need" style="width:{k["scenes_cut"] / mx * 120:.0f}px"></span><span class="need d" style="width:{(k["scenes_all"] - k["scenes_cut"]) / mx * 120:.0f}px"></span>'
        o.append(f'''<details class="mv"><summary><span class="rk">{k["rank"]}</span><span>{E(k["name"])}</span><span class="status {k["status"]}">{ic} {k["status"]}</span>
<span class="hide-sm">{bar} <span class="meta">{k["scenes_cut"]}/{k["scenes_all"]}</span></span><span class="hide-sm meta">{k["value"]}</span></summary>
<div class="body"><p><b>Excellent.</b> {E(k["excellent"])}</p><p><b>We have.</b> {E(k["have"])}</p><p><b>Missing.</b> {E(k["missing"])}</p>
<p><b>Technique.</b> {E(k["technique"])}</p><p class="meta">scenes: {E(", ".join(i.replace("OD-", "") for i in k["scenes"]))}</p></div></details>''')
    return ''.join(o)


def buildlist():
    o = ['<ol class="build">']
    for k in MOTION['kinds'][:12]:
        o.append(f'<li><div class="meta">{k["rank"]} · <span class="status {k["status"]}">{k["status"]}</span> · {k["scenes_cut"]} scenes in the cut</div>'
                 f'<h3>{E(k["name"])}</h3><p>{E(k["technique"])}</p></li>')
    o.append('</ol>')
    return ''.join(o)


def scene_table():
    o = ['<div class="tablewrap"><table class="sc"><tr><th>At</th><th>Scene</th><th>Primary</th><th>Secondary</th><th>Direction</th></tr>']
    for r in SC:
        d = r['direction']
        bias = ' '.join(f'{k}{int(v * 100)}' for k, v in sorted(d['shot_bias'].items(), key=lambda x: -x[1]))
        flags = ' '.join(x for x, on in (('empty', d['empty_frame']), ('sound-forward', d['sound_forward'])) if on)
        o.append(f'<tr><td class="n">{r["at"] / 60:.1f}′</td><td><b>{E(r["id"][3:])}</b> {E(r["title"])}</td><td class="sg">{chip(r["primary"]["n"], r["primary"]["symbol"], r["primary"]["name"])} {E(r["primary"]["name"])}</td>'
                 f'<td class="sg">{"".join(chip(s["n"], s["symbol"], s["name"]) for s in r["secondary"])}</td>'
                 f'<td class="meta">{E(d["cut_rhythm"])} · {E(d["move"])} · hold ≥{d["hold_min_s"]:g}s · {E(bias)} {E(flags)}</td></tr>')
    o.append('</table></div>')
    o.append('<details><summary class="meta" style="cursor:pointer;margin-top:12px">The 50 dropped scenes, scored too</summary><div class="tablewrap"><table class="sc">'
             '<tr><th>Scene</th><th>Primary</th><th>Secondary</th><th>Would sit after</th></tr>')
    for r in DR:
        o.append(f'<tr class="drop"><td><b>{E(r["id"][3:])}</b> {E(r["title"])}</td><td class="sg">{chip(r["primary"]["n"], r["primary"]["symbol"], r["primary"]["name"])} {E(r["primary"]["name"])}</td>'
                 f'<td class="sg">{"".join(chip(s["n"], s["symbol"], s["name"]) for s in r["secondary"])}</td><td>{E((r.get("would_sit_after") or "")[3:])}</td></tr>')
    o.append('</table></div></details>')
    return ''.join(o)


RULES = [
    ("Cut by the scene's primary sign, not by the book.", "The book tempo (the syncwatch's RHYTHM) is the default; the score's <code>cut_rhythm</code> overrides it where they disagree. "
     "They disagree in {conf} scenes, almost always a slow sign in a fast book: the Sirens, the lotus-eaters, Argos, the father revealed. Hold those."),
    ("Every secondary sign gets one shot, not a mood.", "A secondary is a shot you owe the scene: the empty throne (Dm) in the council, the deaf crew's silent view (Op) at the Sirens, "
     "Ajax turning away in silence (Sn). If a secondary has no shot, drop it from the score rather than spreading it thin."),
    ("Recognitions are cut by their own test.", "Helen and Argos are icons (hold the face past information). Telemachus's is limpid and opaque (he has no memory: no flashback). "
     "Eurycleia's is the index of lack that opens a recollection. Penelope's and Laertes's are strong destiny: a marked flashback that returns into the embrace."),
    ("Mark a flashback or do not flash back.", "Strong destiny needs the dissolve, the warmer grade and the return to the face; a told past with no marker is weak destiny and stays in the present shot."),
    ("A series is framed the same way every time.", "Marks (the loom, the rams, the begging hand, the axes, the scar, the thrown stools) only read if each term has the same lens, the same height and the "
     "same length. The demark (the lead ram last, the dogs silent, the beggar stringing the bow) is framed in that same set-up with the aberration in it."),
    ("Monsters in faces first.", "The trailer's rule and the icon's operation agree: the Cyclops, Scylla and the Laestrygonians are shown through the faces that see them; the creature gets the wide and the insert, never the close."),
    ("Sound forward means do not cut on words.", "In a sonsign (the horse, the Sirens, the bowstring, Ajax) the sound is the situation: drop or hold the bed, hold the listener, let the image starve."),
    ("Empty frames are shots, not gaps.", "Any-space-whatever and the opsign need a wide with no figure: Ogygia's grove, the Cimmerian shore, the fogged harbour of Ithaca, the hall full of sulphur smoke. Give them their length."),
    ("Do not force variety.", "Act V is duels, vectors and marks, and should be. Add a time-image only where the score's proposal says the poem supports one."),
]


def wired():
    """the before/after of tools/odyssey-wired.js: shot counts and the contact sheets, where they have been made"""
    d = os.path.join(ROOT, 'odyssey/cineosis/wired'); out = []
    if not os.path.isdir(d): return ''
    for f in sorted(os.listdir(d)):
        if not f.endswith('.json'): continue
        w = json.load(open(os.path.join(d, f))); sid = w['scene']
        def summary(L): return f"{len(L)} shots, {sum(x['dur'] for x in L) / max(1, len(L)):.1f} s mean"
        out.append(f'''<div class="wired"><h3>{E(sid)} · {E(w['title'])} <span class="sub">({E(w['direction'].get('cut_rhythm',''))}, hold ≥ {w['direction'].get('hold_min_s')} s, {E(w['direction'].get('move',''))})</span></h3>
    <p class="sub">before: {summary(w['before'])} · after: {summary(w['after'])} — {E(' · '.join(x['kind'] + ('*' if (x.get('why') or '').startswith('series') else '') for x in w['after']))}</p>
    <img loading="lazy" src="../cineosis/wired/{sid}-before.jpg" alt="{E(sid)} before"><img loading="lazy" src="../cineosis/wired/{sid}-after.jpg" alt="{E(sid)} after"></div>''')
    if not out: return ''
    return '  <h3>Before and after, on the phone build (Pixel 7)</h3>\n  ' + '\n  '.join(out)


def page():
    M = SCORE['monotony']; K = MOTION['kinds']
    conf = sum(1 for r in SC if r['direction']['tempo_conflict'])
    used = sum(1 for d in DIST if d['any_cut'])
    tshare = 1 - M['movement_share_primary_seconds']
    missing = sum(1 for k in K if k['status'] == 'missing')
    o = [HEAD.format(title='Cineosis: the sign score', style=STYLE + EXTRA)]
    o.append(f'''  <div class="kicker"><a href="index.html">The Odyssey Line</a> · <a href="cut.html">the regulars' cut</a> · <a href="locations.html">locations and dialogue</a> · cineosis</div>
  <h1>Cineosis</h1>
  <p class="lede">Every scene of the Regulars' Cut read by Deleuze's cinematic signs, after David Deamer: the 45 elements of the
    <a href="{LAB}">cineosis periodic table</a>. Each scene has a primary sign and up to two secondaries; each one is kept only when the beat answers the sign's own test,
    and each names the neighbouring sign it could be mistaken for and why it is not. Beside it, the moving images the film still has to learn to make.</p>
  <div class="stats">
    <div><b>{used} / 45</b><span>signs the cut uses</span></div>
    <div><b>{pct(tshare)}</b><span>of the cut's seconds under a time-image primary</span></div>
    <div><b>{M["no_time_image_primary"][0]["minutes"]}′</b><span>longest stretch without one (the tales)</span></div>
    <div><b>{missing} / {len(K)}</b><span>kinds of motion still missing</span></div>
  </div>
  <div class="viz">
  <h2>The film on the periodic table</h2>
  <p class="sub">Sixteen image types as columns, the movement-image (0–10) then the time-image (11–15, marked with a rule on top); two rows of composition and one of genesis.
    Each element shows how many scenes of the cut take it as the primary sign and how many use it at all; the bar splits the uses by act, Act I lightest to Act VI darkest.
    Hover or tap an element.</p>
  {periodic()}
  <div class="key">{"".join(f'<span><i style="background:var(--a{k + 1})"></i>Act {a["act"]} {E(a["name"])}</span>' for k, a in enumerate(ACTS))}</div>
  <div class="detail" id="signdetail"><span class="meta">Choose an element to see its test and the scenes that answer it.</span></div>

  <h2>The cut, by primary sign</h2>
  <p class="sub">The {SCORE["meta"]["runtime_s"] / 60:.0f} minutes of the cut in order; each block a scene, coloured by the family of its primary sign, its symbol written where there is room.
    The gold slivers are the music bridges; the ticks underneath mark a time-image (solid: primary; faint: secondary). Hover for the reasoning; tap or click to keep it below.</p>
  <div class="key">{"".join(f'<span><i style="background:var(--f{k + 1})"></i>{E(name)}</span>' for k, (_, name, _) in enumerate(FAM))}<span><i style="background:var(--hatch)"></i>bridge</span></div>
  <div class="tl">{timeline()}</div>
  <div class="detail" id="scenedetail"><span class="meta">Choose a scene on the strip.</span></div>

  <h2>Arcs and compounds, act by act</h2>
  <p class="sub">The primary signs in cut order, then the act's compound built by the lab's own measuring rule (Narrative Chemistry, ontology v1): the signs with at least 6% of the act's seconds,
    in order of first appearance, each bonded to the latest earlier sign with free valence by the strongest lawful bond: <code>#</code> rhyme (same image type), <code>~</code> resonance
    (confusion neighbours), <code>&gt;</code> break (movement into time), <code>-</code> a cut. pT is 14 × the time-image share.</p>
  {arcs()}
  </div>

  <h2>Monotony, and where the time-images belong</h2>
  {findings()}

  <h2>The moving-image vocabulary</h2>
  <p class="sub">What the Odyssey has to make move, found in the beats of all 152 scenes and ranked by value: scenes in the cut (dropped scenes at 0.3) × how much it carries the story
    × how weak we are now. The bar is scenes in the cut (dark) and dropped (light). Open a row for what excellent looks like, what the renderers do today, what is missing,
    and the technique in brick terms. The full write-up is <code>odyssey/cineosis/MOTION.md</code>.</p>
  <div class="viz">{motion()}</div>

  <h2>The build list</h2>
  <p class="sub">The first twelve, in order. Three pieces of machinery cover most of them: a keyed-pose track on twos (combat, falls, rowing, archery, the creatures, the embrace),
    a replacement track (transformation, disguise, sails, flames), and instanced brick fields driven by a function (sea, rain, smoke, the whirlpool, the loom); plus a dissolve in the exporters.</p>
  {buildlist()}

  <h2>How the edit uses it</h2>
  <ol class="rules">{"".join(f'<li><b>{E(t)}</b> {b.format(conf=conf)}</li>' for t, b in RULES)}</ol>

  <h2>The direction, wired</h2>
  <p class="sub">Each scene in <code>odyssey/cineosis/score.json</code> carries a <code>direction</code> block derived from its signs' operations (the primary at 0.6, the secondaries sharing 0.4).
    It now cuts the game's cinema and the film take; the full account is <code>odyssey/cineosis/WIRING.md</code>. The Sirens' block:</p>
  <pre class="hook">{E(json.dumps(next(r for r in SC if r["id"] == "OD-B12-S03")["direction"], indent=1))}</pre>
  <ul class="checks">
    <li><b><code>play/odyssey-game/cinema.js</code> (desktop and the one-file phone build, which carries the block inline as <code>directions.js</code>):</b> <code>C.cut</code> draws shot lengths from
      <code>cut_rhythm</code> floored at <code>hold_min_s</code> (shorter shots merge across the seam) and each shot's kind from <code>shot_bias</code>, seeded by scene and segment; CLOSE is on the
      <code>subject</code>'s head, OBJ on the <code>insert_object</code> found in the previs; every shot moves by <code>move</code> on twos; <code>empty_frame</code> (or an any-space-whatever) opens on the
      set with no figure in any phone's frame; <code>sound_forward</code> cuts off the line seams and leaves the bed open. A mark cuts a matched series, a demark breaks it with its last shot.</li>
    <li><b><code>film-readymades/odyssey-take.js</code>:</b> <code>tempoOf()</code> is <code>cut_rhythm</code>; <code>cutAt()</code> draws SPK/REACT/OBJ/WIDE from <code>shot_bias</code> and floors at
      <code>hold_min_s</code>; <code>insertAt()</code> falls back to <code>insert_object</code>; <code>shootAt()</code> moves by <code>move</code>; <code>bedGain()</code> and the exporter's sound log do not duck
      where <code>sound_forward</code>, and <code>shotAt()</code> no longer cuts on the seams there. <code>odyssey_take.py</code> attaches the block to each take.</li>
    <li><b>The tempo rule ({conf} conflicts):</b> the sign wins inside its scene; the book's rhythm governs the transitions (the entry and exit shots are cut at the book's length).</li>
  </ul>
{wired()}
  <h2>Every scene</h2>
  <p class="sub">The score as a table: the primary and secondary signs of every kept scene and its direction block (rhythm, move, minimum hold, shot bias).</p>
  {scene_table()}

  <footer>Built by <code>tools/forage/product/cineosis.py</code> from <code>odyssey/cineosis/score.json</code> and <code>odyssey/cineosis/motion.json</code>.
    The signs, their tests, operations and confusions are the cineosis table's (<a href="{LAB}">the periodic table</a>, <a href="https://github.com/hartswf0/cineosis-lab">hartswf0/cineosis-lab</a>),
    after David Deamer, <i>Deleuze's Cinema Books</i> (2016). The readings are an editor's judgements, not measurements.
    <br><a href="index.html">The Odyssey Line</a> · <a href="cut.html">The Regulars' Cut</a> · <a href="locations.html">Locations and dialogue</a></footer>
</main>
<div class="tip" id="tip"></div>
<script>
const D = {scene_js()};
const tip = document.getElementById('tip'), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}})[c]);
function place(e) {{ const w = tip.offsetWidth, h = tip.offsetHeight; let x = e.clientX + 14, y = e.clientY + 14; if (x + w > innerWidth - 8) x = e.clientX - w - 14; if (y + h > innerHeight - 8) y = innerHeight - h - 8; tip.style.left = Math.max(8, x) + 'px'; tip.style.top = Math.max(8, y) + 'px'; }}
function sceneHTML(r, full) {{
  const s = r.s.map(g => `<div class="sg"><span class="lab">${{g.role}}</span> <span class="chip"><i style="background:var(--f${{g.f}})"></i>${{esc(g.sym)}}</span> <b>${{esc(g.name)}}</b>
    <p class="q">${{esc(g.q)}}</p><p>${{esc(g.a)}}</p>${{full ? `<p><span class="lab">shots</span> ${{esc(g.op)}}</p><p><span class="lab">not</span> ${{esc(g.av)}}</p>` : ''}}</div>`).join('');
  const d = r.d, bias = Object.entries(d.shot_bias).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + Math.round(v * 100)).join(' · ');
  return `<div class="meta">${{esc(r.id)}} · Act ${{r.act}} · ${{r.at}}′ · ${{r.sec}} s${{r.kb ? ' · key beat ' + esc(r.kb) : ''}}</div><h3>${{esc(r.t)}}</h3>${{s}}`
    + (full ? `<div class="sg"><span class="lab">direction</span> <p>${{d.cut_rhythm}} rhythm (book: ${{d.book_tempo}}) · ${{d.move}} · hold ≥ ${{d.hold_min_s}} s · ${{bias}}${{d.empty_frame ? ' · an empty frame' : ''}}${{d.sound_forward ? ' · sound forward' : ''}}${{d.insert_object ? ' · insert: ' + esc(d.insert_object) : ''}}</p>${{r.note ? `<p class="q">${{esc(r.note)}}</p>` : ''}}</div>` : '');
}}
document.querySelectorAll('rect.sc').forEach(el => {{
  const r = D.sc[+el.dataset.k];
  el.addEventListener('mousemove', e => {{ tip.innerHTML = sceneHTML(r, false); tip.style.display = 'block'; place(e); }});
  el.addEventListener('mouseleave', () => tip.style.display = 'none');
  el.addEventListener('click', () => {{ document.querySelectorAll('rect.sc.on').forEach(x => x.classList.remove('on')); el.classList.add('on'); document.getElementById('scenedetail').innerHTML = sceneHTML(r, true); tip.style.display = 'none'; }});
}});
const byId = Object.fromEntries(D.sc.map(r => [r.id, r]));
function showSign(n) {{
  const g = D.signs[n], acts = Object.entries(g.acts).map(([a, v]) => 'Act ' + a + ' ' + v).join(' · ');
  const list = g.sc.map(i => byId[i] ? `<li><b>${{esc(i.slice(3))}}</b> ${{esc(byId[i].t)}}: ${{esc(byId[i].s[0].a)}}</li>` : '').join('');
  document.getElementById('signdetail').innerHTML = `<div class="meta">${{esc(n)}} · ${{esc(g.img)}}</div><h3>${{esc(g.sym)}} · ${{esc(g.name)}}</h3><p class="q">${{esc(g.q)}}</p><p>${{esc(g.op)}}</p>
    <p class="meta">${{g.p}} scenes primary, ${{g.a}} using it at all${{acts ? ' (' + acts + ')' : ''}}; ${{g.dr}} dropped scenes primary</p>${{list ? '<ul>' + list + '</ul>' : '<p class="meta">No scene of the cut takes it as primary.</p>'}}`;
}}
document.querySelectorAll('.el').forEach(el => {{
  el.addEventListener('mousemove', e => {{ const g = D.signs[el.dataset.n]; tip.innerHTML = `<b>${{esc(g.sym)}} · ${{esc(g.name)}}</b><br><span class="q">${{esc(g.q)}}</span><br>${{g.p}} primary · ${{g.a}} any`; tip.style.display = 'block'; place(e); }});
  el.addEventListener('mouseleave', () => tip.style.display = 'none');
  el.addEventListener('click', () => showSign(el.dataset.n)); el.addEventListener('keydown', e => {{ if (e.key === 'Enter' || e.key === ' ') {{ e.preventDefault(); showSign(el.dataset.n); }} }});
}});
</script>
</body>
</html>''')
    return '\n'.join(o) + '\n'


if __name__ == '__main__':
    open(OUT, 'w').write(page())
    print(f'wrote {os.path.relpath(OUT, ROOT)}: {len(SC)} scenes, {len(DR)} dropped, {len(MOTION["kinds"])} kinds of motion')
