#!/usr/bin/env python3
"""tools/forensics/page.py: odyssey/forensics/index.html, the forensic report, written from odyssey/forensics/findings.json and
manifest.json (tools/forensics/findings.py, tools/forensics/manifest.py). Every number on the page comes from those two files.

  python3 tools/forensics/page.py
"""
import html, json, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'odyssey/forensics')
F = json.load(open(os.path.join(OUT, 'findings.json')))
M = json.load(open(os.path.join(OUT, 'manifest.json')))
E = lambda s: html.escape(str(s), quote=True)
GH = 'https://github.com/hartswf0/tractor-dce-gyo/commit/'
HWGH = 'https://github.com/hartswf0/odyssey-halfworld/blob/main/'


def c(h):  # a commit, linked
    return f'<a class="h" href="{GH}{E(h)}">{E(h[:8])}</a>'


def code(s): return f'<code>{E(s)}</code>'


def mb(b): return f'{b / 1e6:,.1f} MB'


def gb(b): return f'{b / 1e9:,.2f} GB'


def mmss(s):
    s = round(s); return f'{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}' if s >= 3600 else f'{s // 60}:{s % 60:02d}'


A = F['authorship']; O = F['objects_all_refs']; FI = F['films']; CA = F['cards']; V = F['voices']; CP = F['compute']
BR = F['branches']; B = 'origin/claude/odyssey-lego-ldraw-game-ahw23j'
pre = [b for b in F['bundle_history'] if b['at'] < '2026-10-03T04:37']
post = F['bundle_after_split']
tv = F['takes_verify']
blob_ok = sum(1 for r in M['files'] if r['blob_matches_HEAD'])
human = A['by_author'].get('Watson Hartsoe', 0) + A['by_author'].get('Loom Mason', 0)
claude = A['by_author'].get('Claude', 0)
cn = F['camera_notes']; fx = F['forage_indexes']
L = F['links']; idx_missing = L['index.html']['missing']; hub = L['odyssey/kits/index.html']
done_runs = [r for r in CP['runs'] if r['completed']]
first_log = datetime.datetime.utcfromtimestamp(CP['first_log']).strftime('%Y-%m-%d %H:%M'); last_log = datetime.datetime.utcfromtimestamp(CP['last_log']).strftime('%Y-%m-%d %H:%M')
illegal = FI['films_with_illegal_shots']

# ---------------------------------------------------------------- findings, numbered
SUMMARY = [
    ('Custody', f'The branch <code>claude/odyssey-lego-ldraw-game-ahw23j</code> and <code>origin/main</code> point at the same commit ({c(BR[B]["tip"])}); the branch holds {A["commits"]} commits from {c(A["first_commit"].split()[0])} (2026-09-09) to {c(A["last_commit"].split()[0])} (2026-10-03 20:44 UTC). <code>gh-pages</code> holds {BR["origin/gh-pages"]["commits"]:,} commits, {F["gh_pages_ahead_of_main"]} of them older site history not on main, and has taken {F["gh_pages_merges_from_main"]} merges of <code>origin/main</code>.',
     ['git rev-list --count', 'git log origin/gh-pages --merges']),
    ('Authorship', f'{claude} of {A["commits"]} commits ({claude / A["commits"]:.0%}) are authored as Claude; {A["with_claude_trailers"]} carry both <code>Co-Authored-By: Claude</code> and a <code>Claude-Session</code> trailer ({A["sessions"].get("https://claude.ai/code/session_01SQFS6zB4XZtaejCGAnLSib", 0)} from session 01SQFS6z, {A["sessions"].get("https://claude.ai/code/session_01MNSfMekfBH4NfPqDorH3zo", 0)} from 01MNSfMe); the other {A["claude_named_without_trailer"]} Claude commits are merges. {human} commits are human-named ({A["by_author"].get("Watson Hartsoe", 0)} Watson Hartsoe, {A["by_author"].get("Loom Mason", 0)} Loom Mason with the placeholder address user@example.com). The last human-named commit is {c(A["last_human_commit"].split()[0])} (2026-09-27, the merge of PR #11); every commit after it is the agent\'s.',
     ['git log --format=%an', 'trailers']),
    ('Unreviewed snapshots', f'{A["work_in_progress"]} commits ({A["work_in_progress"] / A["with_claude_trailers"]:.0%} of the trailered ones) are titled "Work in progress", {A["wip_by_day"].get("2026-09-30", 0)} of them on 2026-09-30 alone; {A["not_yet_reviewed_commits"]} say "not yet reviewed", {A["builder_still_running_commits"]} were taken while sub-agent builders were still running, {len(A["container_restart_commits"])} were saved across a container restart.',
     ['git log --grep="^Work in progress"']),
    ('Repository weight', f'<code>.git</code> is {E(F["git_store"]["du_git"])} on disk: {E(F["git_store"]["count_objects"]["size"])} of loose objects ({E(F["git_store"]["count_objects"]["count"])} of them, never packed) and {E(F["git_store"]["count_objects"]["size-pack"])} of packs. Across all refs there are {O["blobs"]:,} blobs, {gb(O["blob_bytes"])} uncompressed.',
     ['git count-objects -vH', 'du -sh .git']),
    ('The player bundle', f'<code>film-readymades/production/Film-Butter-Odyssey.html.gz</code> was committed in {O["bundle_versions"]} versions totalling {gb(O["bundle_bytes"])} ({O["bundle_bytes"] / O["blob_bytes"]:.0%} of every blob byte in the repository); the largest is {O["bundle_max"]:,} bytes, against GitHub\'s 100 MB file limit. Commit {c("feb5f60e")} (2026-10-03 04:37 UTC) moved the 38 locations\' geometry beside it; the {len(post)} versions since are {min(b["bytes"] for b in post) / 1e6:.2f}-{max(b["bytes"] for b in post) / 1e6:.2f} MB, and <code>production/geo/</code> holds {F["geo_split"]["files"]} files, {mb(F["geo_split"]["bytes"])}.',
     ['git rev-list --objects --all | git cat-file --batch-check']),
    ('The films', f'{FI["published_mp4"]} films are published in <code>films/odyssey/</code>: {mmss(FI["published_seconds"])} and {mb(FI["published_bytes"])} in all. {FI["performed"]} are the engine-performed scenes ({mmss(FI["performed_seconds"])}, {mb(FI["performed_bytes"])}), all 1280x720, all at 12 fps except the Sirens (OD-B12-S03, 24 fps); {FI["takes"]} superseded takes are kept in <code>films/odyssey/takes/</code> ({mmss(FI["takes_seconds"])}, {mb(FI["takes_bytes"])}).',
     ['odyssey/forensics/manifest.json', 'ffmpeg -i']),
    ('Coverage of the poem', f'Of {CA["mpd"]} LDraw files in <code>odyssey/cards/</code>, {CA["scene_cards"]} are scene cards. {CA["staged_keyframes"]} scenes have keyframes, and the same {CA["performed_scenes"]} have a performed film: {CA["performed_scenes"] / CA["scene_cards"]:.0%} of the poem\'s 152 scenes.',
     ['odyssey/cards/*.mpd', 'odyssey/keyframes/OD-*.json']),
    ('Voices and music', f'The {V["scene_recordings"]} scene recordings ({mmss(V["seconds"])}) come from the halfworld repository, voiced there with Gemini TTS (<code>harness/build-drive-audio.mjs</code>, model <code>gemini-3.1-flash-tts-preview</code>); {V["identical_to_halfworld"]} are byte-identical to the halfworld files, and the {len(V["differ_from_halfworld"])} that differ are the two with Kokoro-82M clips appended ({V["added_synthetic"]} clips, {V["added_seconds"]} s). The making-of narration is Kokoro-82M. The music beds are tracks credited only as "Treblo"; no generator or licence for them was found.',
     ['sha256sum', 'odyssey/kits/cut-restore.json']),
    ('Compute', f'{CP["logs"]} render logs survive (from {first_log} to {last_log} UTC). They record {CP["wall_hours_all"]} wall-clock hours of rendering, {CP["frames_drawn"]:,} frames drawn and {CP["frames_kept_resumed"]:,} reused from an interrupted run, a median of {CP["median_s_per_frame"]} s per 1280x720 frame on {CP["machine"]["nproc"]} CPUs with SwiftShader software GL, and {CP["solver_hours"]} h of camera solving. {len(CP["incomplete"])} runs did not finish. Renders before 2026-09-30 left no logs.',
     ['scratchpad/render-*.log']),
    ('Integrity', f'All {M["count"]} published and kept mp4s were hashed (sha256). {blob_ok} of {M["count"]} match the blob at HEAD. {sum(1 for t in tv if t["file_matches_index"] and t["commit_has_blob"])} of {len(tv)} entries in <code>films/odyssey/takes/index.json</code> name a blob that the named commit holds and the file on disk matches.',
     ['git hash-object', 'git rev-parse <commit>:<path>']),
    ('Defects', f'The camera page offers a film that was never committed (<code>{E(cn["missing_film"][0])}.mp4</code>). It says 13 shots are legal in Anticleia; the film\'s data says {cn["note_vs_json"][0]["json_legal"]} of {cn["note_vs_json"][0]["json_shots"]}. {len(illegal)} published films contain {sum(s - l for _, s, l in illegal)} shots that failed a camera check, and {cn["still_wrong"]} of {cn["scenes"]} scene notes list what is "still wrong". The home page has {F["index_html_nul_bytes"]} NUL bytes and {len(idx_missing)} broken links. Three forage indexes disagree with each other.',
     ['odyssey/perform/camera.html', 'index.html']),
]

# ---------------------------------------------------------------- charts
days = sorted(F['commits_per_day'])
def chart_bars(series, keys, labels, colors, fmt, title, unit, h=220):
    W, PL, PB, PT = 900, 52, 34, 14
    n = len(series); bw = (W - PL - 8) / n
    tot = [sum(s[k] for k in keys) for s in series]; mx = max(tot) or 1
    step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000][0]
    for st in [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]:
        if mx / st <= 5: step = st; break
    top = step * (int(mx / step) + 1)
    y = lambda v: PT + (h - PT - PB) * (1 - v / top)
    g = [f'<svg viewBox="0 0 {W} {h}" role="img" aria-label="{E(title)}" class="chart">']
    v = 0
    while v <= top:
        g.append(f'<line x1="{PL}" x2="{W - 4}" y1="{y(v):.1f}" y2="{y(v):.1f}" class="grid"/><text x="{PL - 6}" y="{y(v) + 4:.1f}" class="ax" text-anchor="end">{fmt(v)}</text>')
        v += step
    for i, s in enumerate(series):
        x = PL + i * bw + 1; base = top * 0; acc = 0
        tip = f'{s["day"]}: ' + ', '.join(f'{labels[j]} {fmt(s[k])}' for j, k in enumerate(keys)) + f' (total {fmt(tot[i])}{unit})'
        for j, k in enumerate(keys):
            if s[k] <= 0: continue
            y0, y1 = y(acc), y(acc + s[k]); acc += s[k]
            hh = max(y0 - y1 - (2 if acc < tot[i] else 0), 0.8)
            g.append(f'<rect x="{x:.1f}" y="{y1:.1f}" width="{max(bw - 3, 1):.1f}" height="{hh:.1f}" rx="1.5" fill="var({colors[j]})"/>')
        g.append(f'<rect x="{PL + i * bw:.1f}" y="{PT}" width="{bw:.1f}" height="{h - PT - PB}" class="hit" data-tip="{E(tip)}"/>')
        if i % 3 == 0 or i == n - 1:
            g.append(f'<text x="{x + bw / 2:.1f}" y="{h - PB + 16}" class="ax" text-anchor="middle">{s["day"][5:]}</text>')
    g.append(f'<line x1="{PL}" x2="{W - 4}" y1="{y(0):.1f}" y2="{y(0):.1f}" class="base"/></svg>')
    leg = ''.join(f'<span><i style="background:var({colors[j]})"></i>{E(labels[j])}</span>' for j in range(len(keys))) if len(keys) > 1 else ''
    return f'<div class="legend">{leg}</div>' + ''.join(g)


cpd = [dict(day=d, agent=F['commits_per_day'][d].get('Claude', 0), human=sum(v for k, v in F['commits_per_day'][d].items() if k != 'Claude')) for d in days]
gday = {gq['day']: gq for gq in F['growth']}
grow = [dict(day=d, bundle=gday[d]['bundle_bytes'] / 1e6, other=(gday[d]['new_bytes'] - gday[d]['bundle_bytes']) / 1e6) for d in days if d in gday]
ch_commits = chart_bars(cpd, ['agent', 'human'], ['Agent (Claude)', 'Human-named'], ['--s1', '--s2'], lambda v: f'{v:,.0f}', 'Commits per day on the branch, agent and human-named', ' commits')
ch_grow = chart_bars(grow[1:], ['other', 'bundle'], ['Other new blobs', 'Player bundle versions'], ['--s1', '--s2'], lambda v: f'{v:,.0f}', 'New blob megabytes per day', ' MB')
cum = []; cc = 0
for d in days:
    if d in gday: cc = gday[d]['cumulative']
    cum.append(dict(day=d, total=cc / 1e9))
ch_cum = chart_bars(cum, ['total'], ['Cumulative'], ['--s1'], lambda v: f'{v:,.1f}', 'Cumulative unique blob gigabytes reachable from the branch', ' GB', h=180)

tbl_days = ''.join(f'<tr><td>{d}</td><td class="t">{cpd[i]["agent"]}</td><td class="t">{cpd[i]["human"]}</td><td class="t">{A["wip_by_day"].get(d, 0)}</td><td class="t">{gday[d]["new_bytes"] / 1e6:,.1f}</td><td class="t">{gday[d]["bundle_bytes"] / 1e6:,.1f}</td><td class="t">{gday[d]["cumulative"] / 1e9:,.2f}</td></tr>' for i, d in enumerate(days) if d in gday)

# ---------------------------------------------------------------- pipeline (provenance)
PIPE = [
    ('Text', 'Homer, tr. Samuel Butler (public domain), as cited by 43 of 44 keyframe files. The spoken script is the halfworld\'s (706 authored turns); its source text is not stated.'),
    ('Card', 'odyssey-halfworld viewer/odyssey-manifest.json: 430 asset and 152 scene cards (Loom Mason, 2026-07-30).'),
    ('Forage', 'tools/odyssey-forage.js: each card built from real LDraw parts and donor sets, checked stud by stud; odyssey/cards/*.mpd.'),
    ('Keys', 'odyssey/keyframes/OD-*.json: the scene staged as stills, each tied to the voice turn it stills.'),
    ('Score', 'odyssey/score/<scene>.json (odyssey-score/1): voice, stimulus, intent, action and contact lanes, each event with its causes.'),
    ('Body', 'tools/perform/compile.js: intents to the body score on the minifig rigs; thermo.js and homeostat.js regulate it.'),
    ('Camera', 'tools/cinematographer/solve.js and plan.js: shots chosen from the performance and tested against the set.'),
    ('Render', 'tools/export-odyssey.js: three.js player in headless Chromium, SwiftShader, one frame at a time, frames to JPEG.'),
    ('Film', 'ffmpeg (imageio-ffmpeg 7.0.2), libx264 CRF 20 and AAC: films/odyssey/<scene>-performed.mp4, poster, captions, JSON.'),
]
pipe = ''.join(f'<li><b>{i + 1}. {E(n)}</b><span>{E(t)}</span></li>' for i, (n, t) in enumerate(PIPE))

LAYERS = [
    ('Geometry', 'LDraw parts library in <code>ldraw/</code> (' + f'{F["ldraw"]["parts_dat"]:,} part files, {F["ldraw"]["subparts"]:,} sub-parts, {F["ldraw"]["primitives"]:,} primitives' + '; CC BY 2.0/4.0 under the LDraw Contributor Agreement, <code>ldraw/CAreadme.txt</code>; committed with root ' + c('4298b9dc') + ', Watson Hartsoe, 2026-09-15)',
     '<code>film-readymades/geometry_compiler.py</code> (37 lines) flattens each part to coloured triangles; <code>build_odyssey.py</code> bakes a location; <code>geo_split.py</code> writes it beside the player',
     f'<code>film-readymades/production/geo/*.json.gz</code> ({F["geo_split"]["files"]} files)', 'Compiler added by Watson Hartsoe in ' + c('48476642') + ' (2026-09-23); split by Claude in ' + c('feb5f60e')),
    ('Sets and casts', 'Halfworld cards; donor LDraw models (credited in FILE headers: Philippe Hurbain 116 lines, Stan Isachenko 16, Stefan Frenz 6, and others)',
     '<code>tools/odyssey-forage.js</code> (228 lines) and <code>tools/forage/</code> (' + f'{F["tools"]["tools/forage"]["files"]} files, {F["tools"]["tools/forage"]["lines"]:,} lines)' + ': forage, assemble, verify stud joints',
     f'{CA["mpd"]} <code>.mpd</code> files; header <code>Author: word to world, tools/odyssey-forage.js</code> on 6,318 FILE blocks', 'Claude, first in ' + c('52030958') + ' (2026-09-23)'),
    ('Text', 'Butler\'s translation (cited in keyframes); the halfworld\'s spoken lines (<code>viewer/spoken-lines.json</code>)', 'Captions read from the halfworld\'s recorded lines, not re-translated', 'WebVTT beside each film', 'The halfworld (Loom Mason, 2026-07-30); the source of its wording is not stated'),
    ('Voices', 'The halfworld recording: Gemini TTS, prebuilt voices with director notes (<a href="' + HWGH + 'harness/build-drive-audio.mjs">build-drive-audio.mjs</a>)', '<code>film-readymades/odyssey_take.py</code> copies the scene file and its segments onto the Regulars\' Cut clock', f'<code>odyssey/take/voice/</code> ({V["scene_recordings"]} files, {mb(V["bytes"])})', 'Synthetic. Recorded in the halfworld; the recording commit is ' + E(V["halfworld_voice_commit"].split()[0]) + ' there (Loom Mason)'),
    ('Added voices', 'Turns the recording lacks (<code>odyssey/kits/cut-restore.json</code>)', 'Kokoro-82M (kokoro-js, q8 ONNX), offline, loudness-matched to about -20.5 LUFS, appended to the scene file', '<code>odyssey/take/added/</code>: OD-B11-S07-T02a (Achilles), OD-B21-S03-T04a (Eurymachus)', 'Synthetic; Claude, ' + c('096b38a7') + ' (2026-10-03)'),
    ('Narration', 'The making-of script in <code>tools/making/making_of.py</code>', 'Kokoro-82M via kokoro_onnx, voice af_heart at 0.95', '<code>films/odyssey/making-of.mp4</code> and the short cut', 'Synthetic; Claude, ' + c('0c780fb2')),
    ('Music beds', 'Halfworld albums BRONZE COUNCIL, HOMECOMING and TITANS DESCENT (<code>audio/albums.json</code>, built 2026-07-24), file names suffixed "Treblo"; a cue promptbook (<code>audio/promptbook.md</code>)', 'The book\'s track looped under the scene at 0.18, ducked to 0.10 under the voice, 150 ms ramps', f'<code>odyssey/take/bed/</code> ({V["beds"]} files, {mmss(V["bed_seconds"])})', 'Provenance not stated: no generator, composer or licence found. The promptbook suggests generated music; that is an inference'),
    ('Performance', 'The scene\'s keys, voice segments, needs (<code>odyssey/perform/needs.json</code>), and its director\'s module (<code>tools/perform/scenes/</code>)', '<code>tools/perform/</code> (' + f'{F["tools"]["tools/perform"]["files"]} files, {F["tools"]["tools/perform"]["lines"]:,} lines' + '): score to intents to body, metrics, thermo, homeostat', '<code>odyssey/score/</code>, <code>&lt;scene&gt;.choreo.json</code>', 'Claude, from ' + c('6aad3cd4') + ' (2026-09-30)'),
    ('Cinematography', 'The body score, the set\'s geometry, the scene\'s direction (<code>odyssey/cineosis/score.json</code>)', '<code>tools/cinematographer/</code> (' + f'{F["tools"]["tools/cinematographer"]["files"]} files, {F["tools"]["tools/cinematographer"]["lines"]} lines' + '): solve, plan, audit, contact sheets', 'The film\'s <code>take.cine</code> shot report', 'Claude, from ' + c('a939a8f0') + ' (2026-09-30); in the last WIP commits several scenes\' shots were "planned by hand" (' + c('eb6ed0f3') + ', ' + c('1791cfa6') + ')'),
    ('Render and encode', 'The player bundle and its geometry, served on :8899', '<code>tools/export-odyssey.js</code> (131 lines): playwright Chromium, <code>--use-gl=swiftshader</code>, frames as JPEG; ffmpeg libx264 <code>-preset medium -crf 20</code>, yuv420p, faststart', '<code>films/odyssey/*.mp4|jpg|vtt|json</code>', 'Claude, from ' + c('ca6498fa') + ' (2026-09-27)'),
]
layers = ''.join(f'<tr><th>{n}</th><td>{i}</td><td>{t}</td><td>{o}</td><td>{w}</td></tr>' for n, i, t, o, w in LAYERS)

# ---------------------------------------------------------------- tables
def row(*cells, cls=''): return '<tr>' + ''.join(f'<td class="{cls}">{x}</td>' for x in cells) + '</tr>'
br_rows = ''.join(f'<tr><td><code>{E(b.replace("origin/", ""))}</code></td><td class="t">{v["commits"]:,}</td><td>{E(v["first"][:8])} {E(v["first"].split()[1][:10])}</td><td>{c(v["tip"])} {E(v["last"][:16].replace("T", " "))}</td><td class="t">{len(v["roots"])}</td></tr>' for b, v in BR.items())
blob_rows = ''.join(f'<tr><td class="t">{b["bytes"]:,}</td><td><code>{E(b["blob"])}</code></td><td><code>{E(b["path"])}</code></td></tr>' for b in F['largest_blobs'][:10])
dir_rows = ''.join(f'<tr><td><code>{E(d["dir"])}</code></td><td class="t">{mb(d["bytes"])}</td></tr>' for d in F['tree_by_top_dir'][:12])
ext_rows = ''.join(f'<tr><td><code>{E(d["ext"])}</code></td><td class="t">{d["files"]:,}</td><td class="t">{mb(d["bytes"])}</td></tr>' for d in F['tree']['by_ext'][:12])
type_rows = ''.join(f'<tr><td>{E(k)}</td><td class="t">{v}</td></tr>' for k, v in sorted(CA['types'].items(), key=lambda kv: -kv[1]))
tool_rows = ''.join(f'<tr><td><code>{E(k)}</code></td><td class="t">{v.get("files", 1)}</td><td class="t">{v["lines"]:,}</td></tr>' for k, v in F['tools'].items())
run_rows = ''.join(f'<tr><td><code>{E(r["log"])}</code></td><td>{E(os.path.basename(r["out"] or "") or ("error: " + r["error"] if r["error"] else "stopped"))}</td><td class="t">{r["drawn"]}</td><td class="t">{r["kept"]}</td><td class="t">{r["solver_s"] or ""}</td><td class="t">{r["wall_min"]:.1f}</td><td class="t">{r["s_per_frame"] or ""}</td></tr>' for r in CP['runs'])
man_rows = ''.join(f'<tr><td><code>{E(r["path"].replace("films/odyssey/", ""))}</code></td><td class="t">{r["duration_s"]}</td><td class="t">{r["bytes"] / 1e6:.1f}</td><td class="t">{r["shots_legal"] if r["shots"] else ""}{"/" + str(r["shots"]) if r["shots"] else ""}</td><td><code title="{E(r["sha256"])}">{E(r["sha256"][:12])}</code></td><td>{c(r["introduced_commit"]) if r["introduced_commit"] else ""}</td><td class="t">{r["versions_in_history"]}</td><td>{"yes" if r["blob_matches_HEAD"] else "<b class=bad>no</b>"}</td></tr>' for r in M['files'])
tv_rows = ''.join(f'<tr><td>{E(t["scene"])}</td><td class="t">{t["n"]}</td><td>{"published" if t["published"] else "kept"}</td><td><code>{E(t["index_blob"])}</code></td><td>{c(t["index_commit"])}</td><td>{"yes" if t["commit_has_blob"] else "no"}</td><td>{"yes" if t["file_matches_index"] else "no"}</td></tr>' for t in tv)

DEFECTS = [
    ('Missing film', f'<code>odyssey/perform/camera.html</code> lists <code>OD-B01-S03-performed-shot</code> as the Gate\'s "after" film. No such file exists, and git history has never contained one (<code>git log --all -- films/odyssey/OD-B01-S03-performed-shot.*</code> returns nothing). The page shows a player that cannot load and a contact sheet with no matching film.'),
    ('Claim against data', f'The Anticleia note (<code>camera.html</code>) says "13 shots legal". <code>films/odyssey/OD-B11-S04-performed.json</code> has 13 shots, 12 of them legal; shot 9 (41.6-45.1 s, TWO) failed "L3 the back of anticleia in a two-shot".'),
    ('Shots that failed a check, published', 'Five published films carry shots their own report marks illegal: ' + ', '.join(f'<code>{E(os.path.basename(p))}</code> {l}/{s}' for p, s, l in illegal) + f'. In all, {FI["shots_legal"]} of {FI["shots"]} shots in the {FI["performed"]} performed films are legal.'),
    ('Known faults, disclosed', f'<code>odyssey/perform/camera-wrong.json</code> lists {cn["known_faults"]} standing faults of the cinematographer, among them: cameras sampled at 3-4 drawings per shot, not every drawing; the inside test depends on triangle winding, but LDraw parts are not all BFC-certified; eyelines are not measured. {cn["still_wrong"]} of the {cn["scenes"]} scene notes on the camera page end with "Still wrong".'),
    ('Synthetic voices', f'All dialogue is synthetic. The halfworld cast is Gemini TTS. Two added turns ({", ".join(code(os.path.basename(x)) for x in V["added_files"])}) and the making-of narration are Kokoro-82M. The added clips are disclosed in <code>cut-restore.json</code>, and the narration is disclosed on the making-of page and in the film\'s end card. The performed films\' own pages do not say that their voices are synthetic.'),
    ('Snapshots of unfinished agent work', f'{A["work_in_progress"]} "Work in progress" commits, {A["not_yet_reviewed_commits"]} marked "not yet reviewed" and {A["builder_still_running_commits"]} "builder(s) still running". The parent session committed sub-agents\' in-flight files so that a container restart would not lose them ({", ".join(c(h) for h in A["container_restart_commits"])} say so). Each was pushed and merged to <code>gh-pages</code>, so unreviewed states were public.'),
    ('The bundle in git', f'{O["bundle_versions"]} versions of an 60-90 MB gzip of the whole player, {gb(O["bundle_bytes"])} in all, before {c("feb5f60e")}. They remain in history, and the {E(F["git_store"]["count_objects"]["size"])} of loose objects is mostly them, unpacked. The split stopped the growth: versions are about 6.2 MB since, and a rebuild rewrites only the location files that changed.'),
    ('Excluded from git', 'Patterns in <code>.git/info/exclude</code> (local, not versioned): ' + ', '.join(code(x) for x in F['exclude']) + '. Alternate renders (<code>-r2</code>, <code>-span</code>) are made beside the published film and never committed. <code>.gitignore</code> drops render frame folders. <code>odyssey/cascade/</code> holds 5.1 GB on disk, nearly all ignored <code>node_modules</code> and renders.'),
    ('The home page', f'<code>index.html</code> contains {F["index_html_nul_bytes"]} NUL bytes where a non-breaking space (<code>\\u00a0</code>) was meant ("BRICK\\x00a0ARCH"); they have been there since {c("09368e1a")} (2026-09-15, Watson Hartsoe) and are live on gh-pages. Three of its {L["index.html"]["checked"]} local links point to files that do not exist: ' + ', '.join(code(x) for x in idx_missing) + f'. Every one of the {hub["checked"]} local references on the hub (<code>odyssey/kits/index.html</code>) resolves.'),
    ('Forage indexes disagree', f'<code>odyssey/FORAGE.md</code> ({E(fx["FORAGE_md"]["last_commit"][:8])}, 2026-09-24) reports {fx["FORAGE_md"]["cards"]} cards, {fx["FORAGE_md"]["green"]} green and {fx["FORAGE_md"]["yellow"]} yellow. <code>odyssey/forage.json</code> ({E(fx["forage_json"]["last_commit"][:8])}, 2026-09-26) has {fx["forage_json"]["cards"]} entries ({fx["forage_json"]["green"]} green, {fx["forage_json"]["yellow"]} yellow). The directory holds {fx["cards_dir"]["files"]} <code>.mpd</code> files, whose headers say {fx["cards_dir"]["green"]} GREEN and {fx["cards_dir"]["yellow"]} YELLOW, with {fx["cards_dir"]["no_status"]} carrying no status line (kit parts, furniture, set pieces written by other tools). The report and index were not regenerated after later forages.'),
    ('Licence statements differ', 'The library\'s <code>CAreadme.txt</code> states CC BY 2.0 and CC BY 4.0. Every card header written by the forage says "Redistributable under CCAL version 2.0". The music has no licence statement anywhere in either repository.'),
    ('Identity', 'The author "Loom Mason" uses <code>user@example.com</code>, a placeholder. Human-named commits carry no record of tools: some (for example "Add files via upload") are GitHub web uploads, and the repository has <code>codex/*</code> branches, so these commits could also be machine-assisted. The evidence does not settle it.'),
    ('Compute record incomplete', f'Render logs exist only in the session scratchpad, which is not versioned, and only from {first_log} UTC on. The films rendered from 2026-09-27 to 09-29 (the animatic, the cut, the acted scenes, the first performed films) have no timing record. {len(CP["incomplete"])} runs ended early: ' + ', '.join(code(x) for x in CP['incomplete']) + ' (two with "Target page, context or browser has been closed").'),
    ('Disk', f'The container\'s volume shows {E(CP["machine"]["disk"].split()[3])} free ({E(CP["machine"]["disk"].split()[4])} used) at the time of this report. Repacking the loose objects (<code>git gc</code>) needs working space on the same volume.'),
]
defects = ''.join(f'<li><b>{E(t)}.</b> {d}</li>' for t, d in DEFECTS)

summary = ''.join(f'<li><b>{E(t)}.</b> {d} <span class="ev">{" ".join(code(e) for e in ev)}</span></li>' for t, d, ev in SUMMARY)

METHOD = r'''# all read-only; run from the repository root
git fetch origin
git rev-list --count origin/main origin/gh-pages origin/claude/odyssey-lego-ldraw-game-ahw23j
git rev-list --count origin/main..origin/gh-pages; git rev-list --count origin/gh-pages..origin/main
git log origin/gh-pages --merges --grep=origin/main --oneline | wc -l
git log origin/main --format=%an | sort | uniq -c
git log origin/main --grep='Claude-Session:' --format=%B | grep -o 'Claude-Session: .*' | sort | uniq -c
git log origin/main --grep='^Work in progress' --format=%ad --date=short | sort | uniq -c
git log origin/main -i --grep='container restart' --oneline
du -sh .git; git count-objects -vH
mkdir -p $SCRATCH/fx
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(objectsize:disk) %(rest)' > $SCRATCH/fx/objects.txt
sort -k3 -nr $SCRATCH/fx/objects.txt | head -30          # largest blobs
git log origin/main --reverse --raw --no-abbrev --no-renames --format='C %H %cd %an' --date=format:%Y-%m-%d > $SCRATCH/fx/raw.txt
git log origin/main --format='%h %cI' -- film-readymades/production/Film-Butter-Odyssey.html.gz   # each version; git cat-file -s <h>:<path>
git show --stat feb5f60e
python3 tools/forensics/manifest.py                      # sha256, bytes, ffmpeg duration, git blob, introducing commit
# the takes: for each entry, git rev-parse <commit>:films/odyssey/<scene>-performed.mp4 against the entry's blob, and git hash-object on the file
# the voices: sha256sum odyssey/take/voice/X.m4a against odyssey-halfworld/drive/voice/X.m4a
# links: every href/src/poster and quoted file path in index.html and odyssey/kits/index.html resolved against the tree
# camera notes: SCENES evaluated out of odyssey/perform/camera.html, "N shots legal" compared with films/odyssey/<after>.json take.cine.shots
SCRATCH=<scratchpad> python3 tools/forensics/findings.py  # parses $SCRATCH/render-*.log and writes findings.json
python3 tools/forensics/page.py                          # this page'''

STATS = [(f'{A["commits"]}', 'commits on the branch'), (f'{claude / A["commits"]:.0%}', 'authored as Claude'), (f'{A["work_in_progress"]}', '"work in progress" commits'),
         (mmss(FI['performed_seconds']), f'of {FI["performed"]} performed films'), (f'{CP["wall_hours_all"]} h', 'logged render time'), (gb(O['bundle_bytes']), 'of player bundles in git')]
stats = ''.join(f'<div><b>{E(a)}</b><span>{E(b)}</span></div>' for a, b in STATS)

PAGE = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Forensic report: tractor-dce-gyo</title>
<meta name="description" content="An evidence-based account of how the LEGO Odyssey in tractor-dce-gyo was made: what exists, by what tools and hands, when, at what cost, with what defects. Every claim cites a commit, a file, a log line or a hash.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
:root {{ --paper: #f4f4f0; --ink: #141414; --muted: #5d5a52; --card: #fbfbf8; --rule: #d8d6ce; --blue: #0033cc; --bad: #b3261e; --ok: #1d6b3a;
  --s1: #2f5be0; --s2: #c27c0e; --b-red: #c91a09; --b-yellow: #f2cd37; --b-blue: #0055bf; --b-green: #237841; --b-orange: #fe8a18; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --bad: #ff8a80; --ok: #6fcf8f; --s1: #5b7cf0; --s2: #a8801e; }} }}
:root[data-theme="dark"] {{ --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --bad: #ff8a80; --ok: #6fcf8f; --s1: #5b7cf0; --s2: #a8801e; }}
* {{ box-sizing: border-box; }}
html, body {{ overflow-x: hidden; }}
body {{ margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.55 Inter, system-ui, sans-serif; }}
main {{ max-width: 1120px; margin: 0 auto; padding: 36px 16px 72px; }}
h1, h2, h3 {{ font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 700; margin: 0; letter-spacing: -0.01em; }}
h1 {{ font-size: clamp(38px, 7vw, 72px); line-height: .95; }}
h2 {{ font-size: 32px; margin: 56px 0 6px; padding-top: 14px; border-top: 3px solid var(--ink); }}
h3 {{ font-size: 22px; margin: 26px 0 6px; }}
p {{ margin: 8px 0; }}
a {{ color: var(--blue); }}
a.h {{ font: 12.5px ui-monospace, Menlo, monospace; }}
code {{ font: 12.5px ui-monospace, Menlo, monospace; overflow-wrap: anywhere; }}
.kicker {{ text-transform: uppercase; letter-spacing: .2em; font-size: 12px; font-weight: 600; color: var(--blue); }}
.kicker a {{ color: inherit; text-decoration: none; }}
.lede {{ font-size: 18px; color: var(--muted); max-width: 820px; margin: 16px 0 18px; }}
.sub, .note {{ color: var(--muted); max-width: 820px; }}
.note {{ font-size: 14px; }}
.studs {{ display: flex; gap: 6px; margin: 18px 0 0; }}
.studs i {{ width: 34px; height: 14px; border-radius: 3px; position: relative; }}
.studs i::before, .studs i::after {{ content: ''; position: absolute; top: -5px; width: 10px; height: 5px; border-radius: 2px 2px 0 0; background: inherit; }}
.studs i::before {{ left: 5px; }} .studs i::after {{ right: 5px; }}
.links {{ display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; }}
.links a {{ font: 600 13px Inter, sans-serif; padding: 7px 12px; border: 1.5px solid var(--ink); color: var(--ink); text-decoration: none; }}
.links a:hover {{ background: var(--ink); color: var(--paper); }}
.stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0; border-top: 6px solid var(--ink); margin: 26px 0 0; }}
.stats div {{ padding: 12px 12px 10px 0; }}
.stats b {{ display: block; font: 700 30px 'Cormorant Garamond', Georgia, serif; }}
.stats span {{ font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); }}
ol.findings {{ padding-left: 22px; max-width: 900px; }}
ol.findings li {{ margin: 0 0 12px; }}
.ev {{ display: block; margin-top: 2px; }}
.ev code {{ font-size: 11.5px; color: var(--muted); border: 1px solid var(--rule); padding: 0 4px; margin-right: 4px; }}
.scroll {{ overflow-x: auto; border: 1px solid var(--rule); background: var(--card); margin: 10px 0; max-width: 100%; }}
table {{ border-collapse: collapse; width: 100%; font-size: 13.5px; }}
th, td {{ text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--rule); vertical-align: top; }}
thead th {{ font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); font-weight: 600; position: sticky; top: 0; background: var(--card); }}
td.t {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}
tbody th {{ font-family: 'Cormorant Garamond', Georgia, serif; font-size: 18px; white-space: nowrap; }}
.bad {{ color: var(--bad); }}
.grid2 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }}
.chart {{ width: 100%; height: auto; display: block; background: var(--card); border: 1px solid var(--rule); }}
.chart .grid {{ stroke: var(--rule); stroke-width: 1; }}
.chart .base {{ stroke: var(--muted); stroke-width: 1; }}
.chart .ax {{ fill: var(--muted); font: 11px Inter, sans-serif; }}
.chart .hit {{ fill: transparent; }}
.chart .hit:hover {{ fill: var(--ink); fill-opacity: .06; }}
.legend {{ display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--muted); margin: 6px 0; }}
.legend i {{ display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }}
#tip {{ position: fixed; pointer-events: none; background: var(--ink); color: var(--paper); font-size: 12.5px; padding: 5px 8px; border-radius: 3px; display: none; z-index: 5; max-width: 280px; }}
ol.pipe {{ list-style: none; padding: 0; margin: 16px 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0; counter-reset: p; }}
ol.pipe li {{ border: 2px solid var(--ink); background: var(--card); padding: 10px 12px; margin: 0 22px 14px 0; position: relative; min-width: 0; }}
ol.pipe li::after {{ content: '\\2192'; position: absolute; right: -20px; top: 50%; transform: translateY(-50%); font-weight: 700; color: var(--muted); }}
ol.pipe li:last-child::after {{ content: ''; }}
ol.pipe li:nth-child(1) {{ border-top: 6px solid var(--b-red); }} ol.pipe li:nth-child(2) {{ border-top: 6px solid var(--b-yellow); }} ol.pipe li:nth-child(3) {{ border-top: 6px solid var(--b-blue); }}
ol.pipe li:nth-child(4) {{ border-top: 6px solid var(--b-green); }} ol.pipe li:nth-child(5) {{ border-top: 6px solid var(--b-orange); }} ol.pipe li:nth-child(6) {{ border-top: 6px solid var(--b-red); }}
ol.pipe li:nth-child(7) {{ border-top: 6px solid var(--b-yellow); }} ol.pipe li:nth-child(8) {{ border-top: 6px solid var(--b-blue); }} ol.pipe li:nth-child(9) {{ border-top: 6px solid var(--b-green); }}
ol.pipe b {{ display: block; font: 700 19px 'Cormorant Garamond', Georgia, serif; }}
ol.pipe span {{ font-size: 13px; color: var(--muted); }}
ul.defects {{ padding-left: 20px; max-width: 900px; }} ul.defects li {{ margin: 0 0 12px; }}
pre {{ background: var(--card); border: 1px solid var(--rule); padding: 12px; overflow-x: auto; font: 12px/1.5 ui-monospace, Menlo, monospace; }}
details summary {{ cursor: pointer; font-size: 14px; color: var(--blue); margin: 6px 0; }}
.split {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }}
footer {{ margin-top: 64px; font-size: 13px; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 16px; }}
@media (max-width: 700px) {{ h2 {{ font-size: 28px; }} ol.pipe li {{ margin-right: 0; margin-bottom: 26px; }} ol.pipe li::after {{ content: '\\2193'; right: auto; left: 50%; top: auto; bottom: -24px; transform: none; }} }}
</style>
</head>
<body>
<main>
<p class="kicker"><a href="../kits/index.html">The Odyssey in LEGO</a> &middot; forensics</p>
<h1>Forensic report: tractor-dce-gyo</h1>
<div class="studs" aria-hidden="true"><i style="background:var(--b-red)"></i><i style="background:var(--b-yellow)"></i><i style="background:var(--b-blue)"></i><i style="background:var(--b-green)"></i><i style="background:var(--b-orange)"></i></div>
<p class="lede">This report covers what exists in the repository, how and by what each part was made, when, at what cost, and what is wrong with it. Each claim cites its evidence: a commit, a file path, a log line or a hash. Where there is no evidence, the report says so. Examined at commit {c(F["generated_at_commit"])}, 2026-10-03.</p>
<div class="links"><a href="origins.html">Chapter two: origins and assembly</a><a href="manifest.json">Manifest (JSON)</a><a href="manifest.csv">Manifest (CSV)</a><a href="findings.json">Raw numbers</a><a href="../making/index.html">The making-of</a><a href="../perform/camera.html">The cinematographer</a><a href="../kits/index.html">The hub</a></div>
<div class="stats">{stats}</div>

<h2 id="summary">Summary of findings</h2>
<ol class="findings">{summary}</ol>
<p class="note"><b>Chapter two.</b> Where all this came from and how agents assembled it: the halfworld's first commit and adaptation prompt, its per-book fan-out of agents (the session cap, the <code>git add -A</code> sweep, the skip list), its voices and music, the bridge into LEGO through the forage, and this session's parent and sub-agents. <a href="origins.html">Origins and assembly: the halfworld, the forage, the agents</a>.</p>

<h2 id="custody">Chain of custody</h2>
<p class="sub">Work ran in a Claude Code session on the branch <code>claude/odyssey-lego-ldraw-game-ahw23j</code>. Each finished step was merged to <code>main</code> and then into <code>gh-pages</code>, which serves hartswf0.github.io/tractor-dce-gyo. The local <code>main</code> and <code>gh-pages</code> are stale; the figures below use the <code>origin/</code> refs after a fetch. The repository has {F["remote_branches"]} remote branches and {F["all_refs_commits"]:,} commits across all refs.</p>
<div class="scroll"><table><thead><tr><th>branch</th><th>commits</th><th>first</th><th>tip</th><th>roots</th></tr></thead><tbody>{br_rows}</tbody></table></div>
<p class="note">The branch history has {len(BR[B]["roots"])} root commits: earlier trees by Watson Hartsoe and Claude were joined by merges ({A["merges"]} merges on the branch). <code>gh-pages</code> begins on 2025-11-13 ({E(BR["origin/gh-pages"]["first"][:8])}, Loom Mason) and contains all of main. Session trailers: {", ".join(f"<code>{E(k.rsplit('/', 1)[1])}</code> {v}" for k, v in A["sessions"].items())}.</p>
<h3>The largest objects</h3>
<div class="scroll"><table><thead><tr><th>bytes</th><th>blob</th><th>path</th></tr></thead><tbody>{blob_rows}</tbody></table></div>
<p class="note">All ten are versions of the player bundle. The bundle has {O["bundle_versions"]} versions in history, {gb(O["bundle_bytes"])}. Before the split: {len(pre)} versions on the branch from {E(pre[-1]["at"][:10])} to {E(pre[0]["at"][:16].replace("T", " "))}. After {c("feb5f60e")}: {len(post)}, each about 6.2-6.3 MB.</p>

<h2 id="timeline">Timeline</h2>
<p class="sub">Commits per day on the branch, by whom. Hover a day for its numbers.</p>
{ch_commits}
<h3>New bytes per day</h3>
<p class="sub">Megabytes of blobs that first appear on each day, with the player bundle shown apart. The first day (2026-09-09, {gday["2026-09-09"]["new_bytes"] / 1e6:,.0f} MB) is the inherited tree and is left off the scale.</p>
{ch_grow}
<h3>Cumulative size</h3>
{ch_cum}
<details><summary>The same numbers as a table</summary><div class="scroll"><table><thead><tr><th>day</th><th>agent</th><th>human</th><th>WIP</th><th>new MB</th><th>bundle MB</th><th>cumulative GB</th></tr></thead><tbody>{tbl_days}</tbody></table></div></details>

<h2 id="inventory">Inventory</h2>
<p class="sub">The tree at HEAD holds {F["tree"]["files"]:,} files and {gb(F["tree"]["bytes"])}. The Odyssey is one project among many in it; the root also holds earlier studios, editors and essays.</p>
<div class="grid2">
<div><h3>By top-level directory</h3><div class="scroll"><table><thead><tr><th>dir</th><th>size</th></tr></thead><tbody>{dir_rows}</tbody></table></div></div>
<div><h3>By extension</h3><div class="scroll"><table><thead><tr><th>ext</th><th>files</th><th>size</th></tr></thead><tbody>{ext_rows}</tbody></table></div></div>
</div>
<div class="split">
<div><h3>The LDraw library</h3><p><code>ldraw/</code>: {F["ldraw"]["parts_dat"]:,} part files, {F["ldraw"]["subparts"]:,} sub-parts, {F["ldraw"]["primitives"]:,} primitives ({F["ldraw"]["p48"]} hi-res, {F["ldraw"]["p8"]} lo-res). Licence: LDraw.org Parts Library under CC BY 2.0 and CC BY 4.0 (<code>ldraw/CAreadme.txt</code>, <code>CAlicense.txt</code>, <code>CAlicense4.txt</code>). The film's own copy, <code>film-readymades/ldraw/</code>, holds {F["ldraw"]["film_readymades_ldraw"]["parts"]:,} parts and {F["ldraw"]["film_readymades_ldraw"]["prims"]} primitives.</p></div>
<div><h3>Cards</h3><p><code>odyssey/cards/</code>: {CA["mpd"]} <code>.mpd</code> files; {CA["scene_cards"]} scene cards; {CA["staged_keyframes"]} scenes staged (keyframes); {CA["performed_scenes"]} filmed as performed. Every staged scene has been filmed.</p>
<details><summary>Cards by type</summary><div class="scroll"><table><tbody>{type_rows}</tbody></table></div></details></div>
<div><h3>Films</h3><p>{FI["published_mp4"]} published mp4s ({mmss(FI["published_seconds"])}, {mb(FI["published_bytes"])}), {FI["takes"]} kept takes ({mmss(FI["takes_seconds"])}, {mb(FI["takes_bytes"])}). Frame rates: {", ".join(f"{k} fps &times; {v}" for k, v in FI["fps"].items())}. All 1280x720, H.264 and AAC. The duration each film's JSON records agrees with ffmpeg's to within 0.15 s for all of them.</p></div>
<div><h3>Sound</h3><p>{V["scene_recordings"]} scene voice files ({mmss(V["seconds"])}, {mb(V["bytes"])}); {V["added_synthetic"]} added clips ({V["added_seconds"]} s); {V["beds"]} music beds ({mmss(V["bed_seconds"])}, {mb(V["bed_bytes"])}).</p></div>
</div>
<h3>Tools</h3>
<div class="scroll"><table><thead><tr><th>path</th><th>files</th><th>lines</th></tr></thead><tbody>{tool_rows}</tbody></table></div>

<h2 id="provenance">Provenance by layer</h2>
<p class="sub">How a line of the poem becomes a film. Each stage reads the one before it from files in this repository or in the halfworld clone, <code>/home/user/odyssey-halfworld</code> (<a href="https://github.com/hartswf0/odyssey-halfworld">hartswf0/odyssey-halfworld</a>, 51 commits, last {E(V["halfworld_head"][:7])}).</p>
<ol class="pipe">{pipe}</ol>
<div class="scroll"><table><thead><tr><th>layer</th><th>inputs</th><th>transformation</th><th>outputs</th><th>made by</th></tr></thead><tbody>{layers}</tbody></table></div>

<h2 id="compute">Compute</h2>
<p class="sub">Machine: {CP["machine"]["nproc"]} CPUs, {E(CP["machine"]["mem"])} RAM, no GPU. {E(CP["machine"]["gl"])}. A frame is posed and drawn on request at t = i / fps, so a film comes out the same however slowly SwiftShader draws (<code>tools/export-odyssey.js</code> lines 3-8). An interrupted render resumes from the frames it kept.</p>
<div class="stats"><div><b>{CP["logs"]}</b><span>render logs</span></div><div><b>{CP["wall_hours_all"]} h</b><span>wall time logged</span></div><div><b>{CP["frames_drawn"]:,}</b><span>frames drawn</span></div><div><b>{CP["frames_kept_resumed"]:,}</b><span>frames resumed</span></div><div><b>{CP["median_s_per_frame"]} s</b><span>median per frame</span></div><div><b>{CP["solver_hours"]} h</b><span>camera solving</span></div></div>
<p class="note">The longest run is <code>{E(CP["max_wall"])}</code>: the Sirens at 24 fps, 1,136 frames, 257.1 min. Renders of alternates (<code>-r2</code>, <code>-r3</code>, <code>-span</code>) count here even when they were not published: {sum(1 for r in done_runs if r["out"] and ("-r" in os.path.basename(r["out"]) or "span" in r["out"]))} of the {len(done_runs)} completed runs wrote an alternate. Seconds per frame = (wall minus solver) / frames drawn now.</p>
<details><summary>Every logged run</summary><div class="scroll"><table><thead><tr><th>log</th><th>wrote</th><th>drawn</th><th>resumed</th><th>solver s</th><th>wall min</th><th>s/frame</th></tr></thead><tbody>{run_rows}</tbody></table></div></details>

<h2 id="authorship">Authorship</h2>
<div class="split">
<div><h3>Agent execution</h3><p>{claude} commits authored as Claude. {A["with_claude_trailers"]} carry session trailers; {A["claude_named_without_trailer"]} are merges without them. All code under <code>tools/perform</code>, <code>tools/cinematographer</code>, <code>tools/making</code> and <code>tools/forensics</code>, all scene cards, keyframes, scores and published Odyssey films first appear in Claude commits (see Provenance).</p></div>
<div><h3>Human direction</h3><p>{human} commits are human-named: Watson Hartsoe {A["by_author"].get("Watson Hartsoe", 0)} (2026-09-10 to 09-27: Hand Butter builds, uploads, the Film Butter experiment with <code>geometry_compiler.py</code>, PR merges #8 and #11) and Loom Mason {A["by_author"].get("Loom Mason", 0)}. The halfworld, source of the cards, voices and music, is Loom Mason's (35 of its 51 commits). Instructions given to the agent in chat are not in the repository. The only evidence of direction after 2026-09-27 is in the agent's own commit messages, for example "re-staged", "re-shot", "planned by hand".</p></div>
<div><h3>Unreviewed work</h3><p>{A["work_in_progress"]} WIP commits by day: {", ".join(f"{d[5:]}: {n}" for d, n in A["wip_by_day"].items())}. These were saved by the parent session while sub-agents worked and were merged to the public site with the rest.</p></div>
</div>

<h2 id="integrity">Integrity</h2>
<p class="sub">The <a href="manifest.json">manifest</a> (<a href="manifest.csv">CSV</a>) lists every published film and kept take: sha256, bytes, ffmpeg duration, frame rate, size, shot counts, git blob, the commit that first added the path, and how many versions of the path history holds. Results: {blob_ok} of {M["count"]} files are byte-identical to the blob at HEAD. All {len(tv)} take-index entries check out: the named commit holds the named blob, and the file on disk matches it. {V["identical_to_halfworld"]} of {V["scene_recordings"]} voice files are byte-identical to the halfworld's.</p>
<details open><summary>The manifest</summary><div class="scroll"><table><thead><tr><th>file</th><th>s</th><th>MB</th><th>legal</th><th>sha256</th><th>added in</th><th>versions</th><th>= HEAD</th></tr></thead><tbody>{man_rows}</tbody></table></div></details>
<details><summary>The takes, checked against git</summary><div class="scroll"><table><thead><tr><th>scene</th><th>take</th><th>state</th><th>blob (index)</th><th>commit</th><th>commit holds blob</th><th>file matches</th></tr></thead><tbody>{tv_rows}</tbody></table></div></details>
<p class="note">"Added in" is the first commit to add the path. Where a re-shoot was renamed over a published film, that is the first take's commit, and the current bytes are a later version (see "versions").</p>

<h2 id="defects">Defects and anomalies</h2>
<ul class="defects">{defects}</ul>

<h2 id="method">Method</h2>
<p class="sub">Read-only except for the files this report writes. No renders were run. Anyone with the two clones can reproduce every number; the render logs are the one exception, because they live only in this session's scratchpad.</p>
<pre>{E(METHOD)}</pre>

<footer>Forensic report written by Claude (Claude Code, session 01SQFS6z) from the repository's own records; the code that writes it is <code>tools/forensics/</code>. The Odyssey in LEGO &middot; <a href="../kits/index.html">the hub</a> &middot; <a href="../making/index.html">the making-of</a> &middot; <a href="../../index.html">home</a></footer>
</main>
<div id="tip" role="status"></div>
<script>
const tip = document.getElementById('tip');
document.querySelectorAll('.hit').forEach(r => {{
  r.addEventListener('pointermove', e => {{ tip.textContent = r.dataset.tip; tip.style.display = 'block';
    const x = Math.min(e.clientX + 12, innerWidth - tip.offsetWidth - 8); tip.style.left = x + 'px'; tip.style.top = (e.clientY + 14) + 'px'; }});
  r.addEventListener('pointerleave', () => tip.style.display = 'none');
}});
</script>
</body>
</html>
'''
open(os.path.join(OUT, 'index.html'), 'w').write(PAGE)
print('wrote odyssey/forensics/index.html', len(PAGE))
