#!/usr/bin/env python3
"""tools/forensics/origins.py: odyssey/forensics/origins.html, the forensic report's chapter on origins and assembly (the halfworld,
the forage, the agents), and its numbers under "origins" in odyssey/forensics/findings.json.

  python3 tools/forensics/origins.py [--halfworld ../odyssey-halfworld]

Reads two git histories: this repository and a full (unshallowed) clone of hartswf0/odyssey-halfworld. Two counts come from outside
git and are marked so on the page: the sub-agents of this Claude Code session (the *.meta.json files of its local transcripts, when
they are on this machine; otherwise the counts stored in findings.json are kept) and the session's check-in reminders (counted from
its routine list on 2026-10-04; only the count is published).
"""
import html, json, os, re, subprocess, sys, glob, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'odyssey/forensics')
A = sys.argv
HW = os.path.abspath(A[A.index('--halfworld') + 1]) if '--halfworld' in A else os.path.join(os.path.dirname(ROOT), 'odyssey-halfworld')
SUBAGENTS = '/root/.claude/projects/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/subagents'
E = lambda s: html.escape(str(s), quote=True)
TGH = 'https://github.com/hartswf0/tractor-dce-gyo/commit/'
HGH = 'https://github.com/hartswf0/odyssey-halfworld/commit/'
HBL = 'https://github.com/hartswf0/odyssey-halfworld/blob/main/'
TBL = 'https://github.com/hartswf0/tractor-dce-gyo/blob/main/'


def git(repo, *a):
    return subprocess.run(['git', '-C', repo, *a], capture_output=True, text=True, check=True).stdout


def t(h): return f'<a class="h" href="{TGH}{E(h)}">{E(h[:8])}</a>'          # a tractor commit
def h(x): return f'<a class="h" href="{HGH}{E(x)}">hw {E(x[:7])}</a>'         # a halfworld commit
def hf(p, line=None): return f'<a href="{HBL}{E(p)}{"#L" + str(line) if line else ""}"><code>{E(p)}{":" + str(line) if line else ""}</code></a>'
def tf(p): return f'<a href="{TBL}{E(p)}"><code>{E(p)}</code></a>'
def code(s): return f'<code>{E(s)}</code>'


# ------------------------------------------------------------------ the halfworld's history
SEP = '\x1f'
def commits(repo, rev='HEAD', paths=()):
    fmt = SEP.join(['%H', '%h', '%aI', '%an', '%ae', '%s', '%(trailers:key=Co-Authored-By,valueonly,separator=;)', '%(trailers:key=Claude-Session,valueonly,separator=;)'])
    out = git(repo, 'log', '--reverse', '--format=' + fmt + '\x1e', rev, '--', *paths)
    rows = []
    for rec in out.split('\x1e'):
        rec = rec.strip('\n')
        if not rec: continue
        H, hh, at, an, ae, s, co, sess = rec.split(SEP)
        rows.append(dict(H=H, h=hh, at=at, an=an, ae=ae, s=s, co=co.strip(), sess=sess.strip()))
    return rows

if git(HW, 'rev-parse', '--is-shallow-repository').strip() != 'false':
    sys.exit('the halfworld clone is shallow: git -C ' + HW + ' fetch --unshallow')
HWC = commits(HW, 'origin/main' if git(HW, 'branch', '-r').count('origin/main') else 'HEAD')
for c in HWC:
    m = re.search(r'Claude[^<;]*', c['co']); c['model'] = m.group(0).strip() if m else ''
    c['files'] = int((re.search(r'(\d+) files? changed', git(HW, 'show', '--shortstat', '--format=', c['H'])) or [0, 0])[1])
hw_by = collections.Counter((c['an'], c['model'] or '(no trailer)') for c in HWC)
first = HWC[0]
loom = [c for c in HWC if c['an'] == 'Loom Mason']
loom_claude = [c for c in loom if c['model']]

# the per-book sweeps: what each "Book N" commit actually held
def scenes_in(H): return re.findall(r'scenes/(OD-B(\d+)-S\d+)\.mjs', git(HW, 'show', '--name-only', '--format=', H))
SWEEPS = []
for c in HWC:
    m = re.match(r'Book (\d+): assets \+ plan-blocked scenes', c['s'])
    if m:
        sc = scenes_in(c['H']); books = collections.Counter(int(b) for _, b in sc)
        assets = sum(1 for p in git(HW, 'show', '--name-only', '--format=', c['H']).split('\n') if p.startswith('assets/'))
        SWEEPS.append(dict(h=c['h'], at=c['at'], book=int(m.group(1)), scenes=dict(sorted(books.items())), assets=assets, trailer=c['model'] or ''))

# jobs per book (bookNN/jobs.json) and scene files per book
JOBS = {}
for b in range(16, 25):
    f = os.path.join(HW, f'book{b}', 'jobs.json')
    if os.path.exists(f):
        j = json.load(open(f)); JOBS[b] = dict(jobs=len(j['jobs']), scenes=len(j['scenes']), existing=len(j.get('existing', [])))
scene_files = sorted(os.path.basename(p)[:-4] for p in glob.glob(os.path.join(HW, 'scenes', 'OD-B*.mjs')))
asset_files = len(glob.glob(os.path.join(HW, 'assets', '**', '*.mjs'), recursive=True))

# the spoken lines, the drive script, the voice manifest
spoken = json.load(open(os.path.join(HW, 'viewer/spoken-lines.json')))
drive = json.load(open(os.path.join(HW, 'drive/drive-script.json')))
vman = json.load(open(os.path.join(HW, 'drive/voice-manifest.json')))
bad_turn = next((seg.get('sourceTurnId') for sc in drive['scenes'] for seg in sc.get('segments', sc.get('turns', [])) if 'For news and enters the hut' in json.dumps(seg)), None)

# the music
albums = json.load(open(os.path.join(HW, 'audio/albums.json')))
pb_titles = [l.split('title: ', 1)[1].strip() for l in open(os.path.join(HW, 'audio/promptbook.md')) if l.startswith('title: ')]
bc = next(a for a in albums['albums'] if a['id'] == 'bronze-council')
bc_match = [tr['num'] for tr in bc['tracks'] if tr['num'] <= len(pb_titles) and tr['title'].lower() == pb_titles[tr['num'] - 1].lower()]
treblo = sum(1 for a in albums['albums'] for tr in a['tracks'] if tr['file'].rstrip('.ogg').endswith('Treblo') or 'Treblo' in tr['file'])
tracks = sum(len(a['tracks']) for a in albums['albums'])

# ------------------------------------------------------------------ tractor
TC = commits(ROOT, 'HEAD')
for c in TC:
    c['who'] = 'Claude' if c['an'] == 'Claude' else c['an']
t_by = collections.Counter(c['an'] for c in TC)
sess = collections.Counter(re.sub(r'.*session_', '', c['sess'])[:8] for c in TC if c['sess'])
def sess_range(k):
    r = [c for c in TC if k in c['sess']]; return (r[0], r[-1], len(r)) if r else (None, None, 0)
S1 = sess_range('01MNSfMe'); S2 = sess_range('01SQFS6z')
def grep_count(pat): return sum(1 for c in TC if re.search(pat, c['s'], re.I))
wip = [c for c in TC if c['s'].startswith('Work in progress')]
running = [c for c in wip if re.search(r'builders? still running', c['s'], re.I)]
restart = [c for c in TC if re.search(r'container restart', c['s'], re.I)]
checkin = [c for c in TC if re.search(r'at the check-in', c['s'], re.I)]
forage_c = commits(ROOT, 'HEAD', ('odyssey-forage', 'films/forage', 'odyssey-forage.html'))
watson_forage = [c for c in forage_c if c['an'] == 'Watson Hartsoe']
engine_c = commits(ROOT, 'HEAD', ('tools/perform', 'tools/cinematographer'))
engine_by = collections.Counter(c['an'] for c in engine_c)
def lines_at(paths):
    n = 0; files = 0
    for p in git(ROOT, 'ls-files', *paths).split('\n'):
        if p.endswith('.js') or p.endswith('.py'):
            try: n += sum(1 for _ in open(os.path.join(ROOT, p), errors='ignore')); files += 1
            except FileNotFoundError: pass
    return files, n
perform_fl = lines_at(['tools/perform']); cine_fl = lines_at(['tools/cinematographer']); forage_fl = lines_at(['tools/odyssey-forage.js', 'tools/forage/*.js'])
modules = len([p for p in git(ROOT, 'ls-files', 'tools/perform/scenes').split('\n') if re.search(r'OD-B\d+-S\d+\.js$', p)])
cards = len(glob.glob(os.path.join(ROOT, 'odyssey/cards/*.mpd')))
first_forage = next(c for c in TC if c['h'].startswith('52030958'))
keep_takes = next(c for c in TC if c['h'].startswith('0821cda9'))
hw_tools = sorted(set(p for p in git(ROOT, 'grep', '-l', 'odyssey-halfworld', '--', 'tools', 'film-readymades').split('\n') if p))

# ------------------------------------------------------------------ the session's helpers (local, not in git)
F = json.load(open(os.path.join(OUT, 'findings.json')))
prev = F.get('origins', {})
if os.path.isdir(SUBAGENTS):
    sub = []
    for f in glob.glob(os.path.join(SUBAGENTS, '*.meta.json')):
        m = json.load(open(f)); sub.append(dict(day=datetime.datetime.utcfromtimestamp(os.path.getmtime(f)).strftime('%Y-%m-%d'), label=m.get('description', ''), kind=m.get('agentType', '')))
    sub.sort(key=lambda r: (r['day'], r['label']))
else:
    sub = prev.get('subagents', {}).get('list', [])
sub_by_day = collections.Counter(r['day'] for r in sub)
resumes = [r for r in sub if r['label'].lower().startswith('resume')]
CHECKINS = prev.get('checkins') or dict(count=74, first='2026-09-29', last='2026-10-04', source="the session's routine list (one-shot reminders it set for itself), counted 2026-10-04; contents not published")

# ------------------------------------------------------------------ findings.json["origins"]
hw_days = collections.Counter(c['at'][:10] for c in HWC)
t_days = collections.Counter(c['at'][:10] for c in TC)
O = dict(
    halfworld=dict(repo='hartswf0/odyssey-halfworld', commits=len(HWC), head=HWC[-1]['h'], first=dict(h=first['h'], at=first['at'], files=first['files'], subject=first['s']),
                   by_author_and_trailer={f'{a} | {m}': n for (a, m), n in sorted(hw_by.items())}, loom_mason=len(loom), loom_mason_with_claude_trailer=len(loom_claude),
                   asset_modules_now=asset_files, scene_programs_now=len(scene_files), jobs_books_16_24=JOBS,
                   sweeps=SWEEPS, spoken_lines=spoken.get('count'), stage_direction_turn=bad_turn, drive_turns=drive['meta'].get('turnCount'), voiced_scenes=len(vman),
                   tts_model='gemini-3.1-flash-tts-preview (harness/build-drive-audio.mjs line 22; build-drive-batch.mjs line 18)',
                   albums={a['name']: len(a['tracks']) for a in albums['albums']}, tracks=tracks, tracks_credited_treblo=treblo,
                   bronze_council_titles_matching_promptbook=bc_match, promptbook_book1_title=pb_titles[0] if pb_titles else None),
    tractor=dict(commits=len(TC), by_author=dict(t_by), sessions={k: v for k, v in sess.items()},
                 session_01MNSfMe=dict(first=S1[0]['h'] if S1[0] else None, last=S1[1]['h'] if S1[1] else None, commits=S1[2]),
                 session_01SQFS6z=dict(first=S2[0]['h'] if S2[0] else None, last=S2[1]['h'] if S2[1] else None, commits=S2[2]),
                 work_in_progress=len(wip), builders_running_snapshots=len(running), builders_running_snapshots_report=F['authorship'].get('builder_still_running_commits'), work_in_progress_report=F['authorship'].get('work_in_progress'), container_restart_commits=[c['h'] for c in restart],
                 checkin_snapshots=[(c['h'], c['at']) for c in checkin], watson_forage_corpus=[c['h'] for c in watson_forage],
                 first_forage=first_forage['h'], keep_takes=keep_takes['h'], cards_now=cards,
                 engine_commits=dict(engine_by), tools_perform=dict(files=perform_fl[0], lines=perform_fl[1]), tools_cinematographer=dict(files=cine_fl[0], lines=cine_fl[1]),
                 forage_code=dict(files=forage_fl[0], lines=forage_fl[1]), director_modules=modules, tools_reading_halfworld=hw_tools),
    subagents=dict(count=len(sub), by_day=dict(sorted(sub_by_day.items())), resumes=len(resumes), list=sub,
                   source="this Claude Code session's local sub-agent transcripts (*.meta.json: label and type only); not in git"),
    checkins=CHECKINS,
    commits_per_day=dict(halfworld=dict(sorted(hw_days.items())), tractor=dict(sorted(t_days.items()))),
)
F['origins'] = O
json.dump(F, open(os.path.join(OUT, 'findings.json'), 'w'), indent=1)

# ================================================================== the page
H_ = {c['h']: c for c in HWC}
def hwat(x): return H_[x]['at'].replace('T', ' ')[:16] + ' ' + H_[x]['at'][-6:]
def tat(x): c = next(c for c in TC if c['h'].startswith(x)); return c['at'].replace('T', ' ')[:16] + ' UTC' if c['at'].endswith('+00:00') else c['at'].replace('T', ' ')[:16] + ' ' + c['at'][-6:]
HO, TO, SB = O['halfworld'], O['tractor'], O['subagents']
rep_running = TO['builders_running_snapshots_report']; rep_wip = TO['work_in_progress_report']

STATS = [(str(HO['commits']), 'commits in the halfworld (full history)'), (str(HO['first']['files']), 'files in its first commit'), ('152 / 152', 'scenes built there'),
         ('706 / 706', 'turns given spoken lines'), ('582', 'cards foraged the first morning'), (str(SB['count']), "helpers (sub-agents) in this session")]
stats = ''.join(f'<div><b>{E(a)}</b><span>{E(b)}</span></div>' for a, b in STATS)

FINDINGS = [
 ('The halfworld begins with a finished body of work, not with its making.', f'Its first commit, {h(first["h"])} ({hwat(first["h"])}), adds {first["files"]} files at once: "307 asset modules + 94 scene programs (Books I–XV)", nine front-ends and the music suite. Whatever produced Books I to XV happened before the history starts; the record does not show it. The README of that commit says Books XVI to XXIV were "specified and paused" ({hf("README.md", 30)}).',
  [h(first['h']), hf('README.md', 30)]),
 ('The method is one prompt meant to be pasted into Claude with any book.', f'{hf("PROMPT-HALFWORLD.md")} ("Paste this into Claude with any book, epic, play, album, or poem … the film IS the program") lays the work out as phases: PHASE 0 the atlas (every scene as 4 to 6 causal beats and an exit state), PHASE 1 one engine (~700 lines), PHASE 2 contracts, PHASE 3 agentic generation (one job per missing asset or scene, fanned to parallel subagents, verified headlessly), PHASE 4 the front-ends, PHASE 5 music. Its usage line: "build a few, verify, then fan out". It was committed in the first commit, so it describes a method already used; it is not the first prompt itself, which is not in the record.',
  [hf('PROMPT-HALFWORLD.md', 2), hf('PROMPT-HALFWORLD.md', 4), hf('PROMPT-HALFWORLD.md', 45)]),
 ('The drawings are programs; the dots are one shared pass, after BEFLIX.', 'Each asset is an ES module exporting an object with states, anchors, channels and a <code>draw(ctx,W,H,state)</code> that paints flat tone; it never draws dots (' + hf('engine/asset-contract.mjs', 1) + '). One post-pass, <code>dotifyField</code>, prints the composed frame as discs on a lattice; the README names the lineage: Ken Knowlton\'s BEFLIX at Bell Labs (1963), "a film is a grid of cells with ink values" (' + hf('README.md', 17) + ', ' + hf('README.md', 59) + ').',
  [hf('engine/asset-contract.mjs'), hf('README.md', 59)]),
 ('The last eight books were built by a fan-out of agents writing into one tree.', f'{hf("bookXVI/finish-books.workflow.mjs")} ("Autonomous completion of Books XVII–XXIV: 125 assets + 53 plan-blocked scenes") runs, per book, one agent per asset in parallel (write, render, read the PNG, revise up to 3 times), then one agent per scene strictly in order (each imports the last scene\'s <code>exitOccupancy</code>), then one sweep agent that renders every scene and commits the book. Books overlap: book N\'s scenes run while book N+1\'s assets build. Each agent returns a structured result with a self-assessment.',
  [hf('bookXVI/finish-books.workflow.mjs', 3), hf('bookXVI/finish-books.workflow.mjs', 147), hf('bookXVI/BUILD-BRIEF.md')]),
 ('A session cap cut the first autonomous run off before any scene was written.', f'{h("a4c9020")} ({hwat("a4c9020")}): "71 new modules (B17 10/10, B18 11/11, B19 18/18, B20 12/12, B21 18/18, B22 18/20, B23 4/11) — the run was cut off by the session cap before any scenes or sweeps ran", and it "includes three files an earlier \'git add -A\' had captured mid-write". A second run ({code("wf_6392e0c5-44c")}, {h("0c3628f")}) lost Book XXIII\'s agent to the cap after its sixth scene landed; the workflow then gained a per-book <code>skip</code> list so a resumed book rebuilds only its missing scenes and keeps the chain ({h("0c94e02")}).',
  [h('a4c9020'), h('0c3628f'), h('0c94e02')]),
 ('One sweep committed three other books\' unverified scenes under its own name.', f'Book 17\'s sweep, {h("d77da1b")}, holds 7 Book 17 scenes and 12 more (4 each of Books 21, 22 and 23) that no sweep had rendered. Two minutes later {h("94806a1")} changed the sweep prompt: "stage EXPLICIT paths, never \'git add -A\' … Book 18\'s sweep correctly refused and staged only its own five. The instruction was the bug, not the agent — concurrent books write into one tree". The guard text is at {hf("bookXVI/finish-books.workflow.mjs", 135)}.',
  [h('d77da1b'), h('94806a1')]),
 ('The back half of the poem spoke stage directions until 706 of 706 turns had lines.', f'The delivered drive script\'s fallback text was summary, not speech: {h("e55c649")} quotes Telemachus saying "For news and enters the hut beside the unknown beggar?" ({code(HO.get("stage_direction_turn") or "OD-B16-S01-T04")} in {hf("drive/drive-script.json")}). 428 lines for Books I–XV were authored on 2026-07-24 ({h("1a1634b")}); 264 more on 2026-07-30 (692/706), and the last 14 a minute later ({h("d69c7d1")}: 706/706). The studio voices are Gemini TTS (<code>gemini-3.1-flash-tts-preview</code>, {hf("harness/build-drive-audio.mjs", 22)}), sent in batches because "interactive tier caps at 100 req/day" ({h("88445c1")}); the re-recording went as 9 per-book batches, and {h("d540c51")} says all 152 scenes were re-voiced. This repository found seven recordings that still speak the summary ({tf("odyssey/perform/NEEDS.md")}).',
  [h('e55c649'), h('d69c7d1'), h('d540c51')]),
 ('The music is credited only to "Treblo"; its titles come from the project\'s own promptbook.', f'{HO["tracks"]} tracks in three albums ({", ".join(f"{k} {v}" for k, v in HO["albums"].items())}), every file name ending "- Treblo" ({hf("audio/albums.json")}, built 2026-07-24). The album title BRONZE COUNCIL is the first words of the promptbook\'s Book 1 title ("{E(HO["promptbook_book1_title"])}"), and {len(HO["bronze_council_titles_matching_promptbook"])} of its 24 track titles match the promptbook\'s book titles word for word ({hf("audio/promptbook.md")}). The prompt names "Suno or similar" as the generator ({hf("PROMPT-HALFWORLD.md", 64)}); no commit names the service, the account or a licence.',
  [h('95bfb6b'), hf('audio/promptbook.md'), hf('PROMPT-HALFWORLD.md', 64)]),
 ('"Loom Mason" is the name the halfworld\'s agents committed under.', f'{HO["loom_mason"]} of the halfworld\'s {HO["commits"]} commits are by Loom Mason &lt;user@example.com&gt;, a placeholder address; {HO["loom_mason_with_claude_trailer"]} of them carry a Claude co-author trailer (Claude Fable 5: 9, from the first commit; Claude Opus 4.8: 54, from {h("bfcd1b5")}; plain "Claude": 6, the per-book sweeps). The workflows point at a local checkout under <code>~/Downloads</code> ({hf("bookXVI/finish-books.workflow.mjs", 11)}). Watson Hartsoe authored 15 commits there (House of Dust, 2026-09-15) and 86 here; Claude authored one there, {h("cd01bed")}, in this session.',
  [h('fd6ef65'), h('bfcd1b5'), h('cd01bed')]),
 ('The bridge is one minute wide: the halfworld card links, then the forage.', f'On 2026-09-23 this session committed {h("cd01bed")} in the halfworld (05:16 UTC, "Link every atlas card to its LDraw build") and {t("52030958")} here (05:17 UTC): "tools/odyssey-forage.js builds all 582 atlas cards (430 assets, 152 scenes) as real LDraw". The forage reads the halfworld\'s {hf("viewer/odyssey-manifest.json")}; the donor corpus it draws on was assembled by Watson Hartsoe on 2026-09-15 ({t("56aa48b0")} and ten more commits). {len(TO["tools_reading_halfworld"])} tools here read the halfworld clone.',
  [h('cd01bed'), t('52030958'), t('56aa48b0')]),
 ('Word to world is rules written by the agent, not a model call per card.', f'{tf("tools/forage/table.js")} maps each card type to a way of being got (a character is a minifigure dressed by role, a location a sub-build foraged from a real set, a prop the readymade part), with a seeded random hand so a card is the same every run; {tf("tools/forage/ldraw.js")} then tests every stud of every piece against the undersides above it and names what floats. No file in <code>tools/forage</code>, <code>tools/perform</code> or <code>tools/cinematographer</code> calls a language model. The model\'s part is the code ({TO["forage_code"]["lines"]:,} lines of forage, {TO["tools_perform"]["lines"]:,} of performance engine, {TO["tools_cinematographer"]["lines"]:,} of cinematographer; {TO["engine_commits"].get("Claude", 0)} of {sum(TO["engine_commits"].values())} engine commits authored as Claude) and the data it wrote: keyframes and {TO["director_modules"]} director\'s modules.',
  [tf('tools/forage/table.js'), tf('tools/forage/ldraw.js')]),
 ('This session ran as one parent and many helpers, and its snapshots show it.', f'{SB["count"]} sub-agents were started from this session between {min(SB["by_day"])} and {max(SB["by_day"])} (22 on 2026-09-26 alone: ten blind readers and six kit builders at once), {SB["resumes"]} of them to resume work after a restart; source: the session\'s local transcripts, not git. In git: {rep_wip} "work in progress" snapshots by the report\'s count, {rep_running} taken while builders were still running, 4 across container restarts ({", ".join(t(x) for x in TO["container_restart_commits"])}), 6 "at the check-in" on 2026-09-30. The parent also set itself {CHECKINS["count"]} one-shot check-in reminders, about an hour apart (count from the session\'s routine list). The keep-takes rule arrived in {t("0821cda9")}; publication waited on a contact-sheet review.',
  [t('0821cda9'), t('a0baeb64')]),
]
findings = ''.join(f'<li><b>{E(a)}</b> {b}<span class="ev">{" ".join(f"<code>{x}</code>" if not x.startswith("<") else x for x in ev)}</span></li>' for a, b, ev in FINDINGS)

# ---------------------------------------------------------------- the timeline (both repositories)
d0 = datetime.date(2026, 7, 23); d1 = datetime.date(2026, 10, 4)
days = [(d0 + datetime.timedelta(n)).isoformat() for n in range((d1 - d0).days + 1)]
hwd = collections.Counter(); hwh = collections.Counter(); tcl = collections.Counter(); thu = collections.Counter()
for c in HWC:
    (hwd if c['model'] else hwh)[c['at'][:10]] += 1
for c in TC:
    if c['at'][:10] >= days[0]: (tcl if c['an'] == 'Claude' else thu)[c['at'][:10]] += 1
def chart(days):
    W, PL, PB, PT, Hh = 900, 40, 34, 14, 230
    tot = [hwd[d] + hwh[d] + tcl[d] + thu[d] for d in days]; mx = max(tot); top = 25 * (mx // 25 + 1); n = len(days); bw = (W - PL - 6) / n
    y = lambda v: PT + (Hh - PT - PB) * (1 - v / top)
    g = [f'<svg viewBox="0 0 {W} {Hh}" role="img" aria-label="Commits per day in both repositories" class="chart">']
    for v in range(0, top + 1, 25): g.append(f'<line x1="{PL}" x2="{W - 4}" y1="{y(v):.1f}" y2="{y(v):.1f}" class="grid"/><text x="{PL - 6}" y="{y(v) + 4:.1f}" class="ax" text-anchor="end">{v}</text>')
    for i, d in enumerate(days):
        x = PL + i * bw + 0.5; acc = 0
        for val, col in ((hwd[d], '--s3'), (hwh[d], '--s4'), (tcl[d], '--s1'), (thu[d], '--s2')):
            if not val: continue
            y0, y1 = y(acc), y(acc + val); acc += val
            g.append(f'<rect x="{x:.1f}" y="{y1:.1f}" width="{max(bw - 1.5, 1):.1f}" height="{max(y0 - y1, 1):.1f}" fill="var({col})"/>')
        tip = f'{d}: halfworld {hwd[d] + hwh[d]} ({hwd[d]} with a Claude trailer), tractor {tcl[d] + thu[d]} ({tcl[d]} as Claude)'
        g.append(f'<rect x="{PL + i * bw:.1f}" y="{PT}" width="{bw:.1f}" height="{Hh - PT - PB}" class="hit" data-tip="{E(tip)}"/>')
        if d.endswith('-01') or d in ('2026-07-23',):
            g.append(f'<text x="{x:.1f}" y="{Hh - PB + 16}" class="ax">{d[5:]}</text>')
    g.append(f'<line x1="{PL}" x2="{W - 4}" y1="{y(0):.1f}" y2="{y(0):.1f}" class="base"/></svg>')
    return ''.join(g)
ch_both = chart(days)

TIMELINE = [
 ('2026-07-23 02:54 -04', 'halfworld', h('fd6ef65'), 'First commit: 494 files, Books I–XV as 307 asset modules and 94 scene programs, nine front-ends, the prompt (PROMPT-HALFWORLD.md). Trailer: Claude Fable 5.'),
 ('2026-07-23 03:09 -04', 'halfworld', h('aded1a3'), 'Relative imports inside all 401 modules; .nojekyll so Pages stops dropping the scene contract (321bbd2).'),
 ('2026-07-23 23:58 -04', 'halfworld', h('bfcd1b5'), 'From here the trailer reads Claude Opus 4.8.'),
 ('2026-07-24 02:39 -04', 'halfworld', h('95bfb6b'), 'TITAN\'S DESCENT album (23 tracks) and a mixer; BRONZE COUNCIL and HOMECOMING were in the first commit.'),
 ('2026-07-24 13:40 -04', 'halfworld', h('1a1634b'), 'The spoken line atlas: 428 authored first-person lines for Books I–XV.'),
 ('2026-07-24 15:32 -04', 'halfworld', h('2f33ce5'), 'Studio voices: Gemini 3.1 Flash TTS, a cast with director notes; Book I rendered.'),
 ('2026-07-24 15:47 -04', 'halfworld', h('88445c1'), 'Interactive TTS capped at 100 requests a day: a batch pipeline; 970 segments submitted.'),
 ('2026-07-24 16:09 -04', 'halfworld', h('2a4f529'), '144 of 152 scenes voiced from the batches (151 by ad77028).'),
 ('2026-07-29 00:32 -04', 'halfworld', h('e0acb19'), 'Books XVI+ foundation, additive: guise, blocking, two authored rooms, the build workflow.'),
 ('2026-07-29 00:48 -04', 'halfworld', h('cf26311'), 'BUILD-BRIEF for Books XVI–XXIV: agents read the brief "instead of being handed inlined job data".'),
 ('2026-07-29 01:31 -04', 'halfworld', h('71ada02'), 'Book XVI complete (6/6 scenes); the brief patched mid-run (4a0a1cc) "so the Books XVII–XXIV agents get it".'),
 ('2026-07-30 03:43 -04', 'halfworld', h('a4c9020'), 'The autonomous run cut off by the session cap: 71 modules, no scenes, no sweeps.'),
 ('2026-07-30 06:35 – 07:35 -04', 'halfworld', h('0428346') + ' … ' + h('d77da1b'), 'Per-book sweeps for Books 18, 20, 19, 17; Book 17\'s holds twelve scenes of Books 21–23.'),
 ('2026-07-30 07:37 -04', 'halfworld', h('94806a1'), 'Sweep prompt fixed: stage explicit paths, never git add -A.'),
 ('2026-07-30 12:07 -04', 'halfworld', h('0c3628f'), 'Books XXI–XXIII scenes from wf_6392e0c5-44c, validated by render; Book XXIII\'s agent cut off by the cap after S06.'),
 ('2026-07-30 12:08 -04', 'halfworld', h('0c94e02'), 'The per-book skip list.'),
 ('2026-07-30 16:36 -04', 'halfworld', h('8633ba3'), 'Integration: 93 → 149 scenes, 307 → 430 assets in the manifest.'),
 ('2026-07-30 16:41 -04', 'halfworld', h('d69c7d1'), '706/706 turns have authored lines; Books XVI–XXIV resubmitted as 9 per-book batches.'),
 ('2026-07-30 18:06 -04', 'halfworld', h('0c54cd5'), 'Book XXIV complete, 152/152, committed by hand because the sweep\'s guard refused.'),
 ('2026-07-30 18:07 -04', 'halfworld', h('d540c51'), 'The whole Odyssey integrated: 152 scenes, 430 assets, all re-voiced. The voices this repository uses come from this tree.'),
 ('2026-07-31 11:13 -04', 'halfworld', h('d3acfdd'), 'Working paper "The film is the program": BEFLIX lineage; "706 turns of stage directions that the voice track dutifully spoke aloud".'),
 ('2026-08-19 17:13 -04', 'halfworld', h('d5791e7'), 'SPOKEN INTO BEING: faces, speech visemes, glyphs (Loom Mason, no trailer).'),
 ('2026-09-09 22:06 UTC', 'tractor', t('348a3694'), 'First commit of the earlier Claude session (01MNSfMe) on this branch: sound, a theatre, mp4 export.'),
 ('2026-09-15 01:02 -04', 'halfworld', h('30e8662'), 'Watson Hartsoe\'s House of Dust (15 commits that night).'),
 ('2026-09-15 22:49 -04', 'tractor', t('56aa48b0'), 'Watson Hartsoe: the Odyssey real-LDraw forage corpus and MPD inspector (11 commits to 00:23).'),
 ('2026-09-16 10:27 UTC', 'tractor', t('a173797e'), 'Session 01MNSfMe: scenes to play, stage and rehearse on the forage\'s real sets.'),
 ('2026-09-23 05:16 UTC', 'halfworld', h('cd01bed'), 'This session: every atlas card linked to its LDraw build.'),
 ('2026-09-23 05:17 UTC', 'tractor', t('52030958'), 'This session begins here: the atlas as LDraw, 582 cards foraged and checked.'),
 ('2026-09-26 21:23 UTC', 'tractor', t('f89d06dd'), 'First snapshot "as their builders leave them": parallel kit builders.'),
 ('2026-09-28 03:08 UTC', 'tractor', t('0ad817b9'), 'First snapshot saved across a container restart.'),
 ('2026-09-30 07:35 UTC', 'tractor', t('8502ec8f'), 'The performance engine (tools/perform): the three temperatures and the homeostat; 149 "work in progress" commits that day.'),
 ('2026-10-03 20:05 UTC', 'tractor', t('0821cda9'), 'The takes archive: a re-shoot never overwrites.'),
 ('2026-10-03 21:51 UTC', 'tractor', t('e61f878d'), 'The forensic report.'),
 ('2026-10-04 07:42 UTC', 'tractor', t('efe9ae46'), 'The making-of as a LEGO film (four scenes).'),
]
tl_rows = ''.join(f'<tr><td>{E(a)}</td><td>{E(b)}</td><td>{c}</td><td>{E(d)}</td></tr>' for a, b, c, d in TIMELINE)

# ---------------------------------------------------------------- the tables
sweep_rows = ''.join(f'<tr><td>{h(s["h"])}</td><td>{E(s["at"][11:16])}</td><td class="t">{s["book"]}</td><td>{E(", ".join(f"B{b}: {n}" for b, n in s["scenes"].items()) or "none")}</td><td class="t">{s["assets"]}</td><td>{E(s["trailer"] or "none")}</td></tr>' for s in HO['sweeps'])
jobs_rows = ''.join(f'<tr><td class="t">{b}</td><td class="t">{j["jobs"]}</td><td class="t">{j["existing"]}</td><td class="t">{j["scenes"]}</td></tr>' for b, j in HO['jobs_books_16_24'].items())
hw_auth_rows = ''.join(f'<tr><td>{E(k.split(" | ")[0])}</td><td>{E(k.split(" | ")[1])}</td><td class="t">{v}</td></tr>' for k, v in HO['by_author_and_trailer'].items())
sub_days = ''.join(f'<tr><td>{d}</td><td class="t">{n}</td><td>{E("; ".join(r["label"] for r in SB["list"] if r["day"] == d))}</td></tr>' for d, n in SB['by_day'].items())

# ---------------------------------------------------------------- diagrams
def box(x, y, w, hh, title, sub='', cls='bx'):
    lines = [f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" rx="4" class="{cls}"/>', f'<text x="{x + 10}" y="{y + 20}" class="bt">{E(title)}</text>']
    for i, s in enumerate(sub.split('\n') if sub else []):
        lines.append(f'<text x="{x + 10}" y="{y + 38 + 15 * i}" class="bs">{E(s)}</text>')
    return ''.join(lines)
def arrow(x1, y1, x2, y2, cls='ar'): return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{cls}" marker-end="url(#ah)"/>'
DEFS = '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahp"/></marker></defs>'

def diagram_halfworld():
    g = [f'<svg viewBox="0 0 900 520" role="img" aria-label="The halfworld\'s per-book fan-out of agents" class="dia">', DEFS]
    g.append(box(10, 10, 200, 76, 'The card', 'PROMPT-HALFWORLD.md\n"paste this into Claude"', 'bx b1'))
    g.append(box(240, 10, 200, 76, 'The atlas', 'harness/atlas.json\n24 books, 152 scenes', 'bx b2'))
    g.append(box(470, 10, 200, 76, 'The jobs', 'gen-book-jobs.mjs\nbookNN/jobs.json', 'bx b3'))
    g.append(box(700, 10, 190, 76, 'The brief', 'BUILD-BRIEF.md: additive,\nthe look, render-read-revise', 'bx b4'))
    g += [arrow(210, 48, 238, 48), arrow(440, 48, 468, 48), arrow(670, 48, 698, 48)]
    g.append('<text x="10" y="120" class="bt">finish-books.workflow.mjs: books overlap; within a book, assets in parallel, scenes in order, then one sweep</text>')
    lanes = [(17, 12, 7), (18, 12, 5), (19, 19, 6)]
    for i, (b, nA, nS) in enumerate(lanes):
        y = 136 + i * 74; x0 = 10 + i * 70
        g.append(f'<text x="{x0}" y="{y + 30}" class="bt">B{b}</text>')
        g.append(box(x0 + 42, y, 210, 58, f'Assets: {nA} jobs', 'one agent each, in parallel', 'bx b5'))
        for k in range(min(nA, 12)):
            g.append(f'<circle cx="{x0 + 52 + k * 16}" cy="{y + 48}" r="5" class="ag"/>')
        g.append(arrow(x0 + 252, y + 29, x0 + 270, y + 29))
        g.append(box(x0 + 272, y, 230, 58, f'Scenes: {nS}, in id order', 'each imports the last exitOccupancy', 'bx b5'))
        g.append(arrow(x0 + 502, y + 29, x0 + 520, y + 29))
        g.append(box(x0 + 522, y, 160, 58, 'Sweep', 'render all, commit the book', 'bx b6'))
    g.append('<text x="290" y="370" class="bs">… Books 20 to 24 the same way; book N\'s scenes run while book N+1\'s assets build</text>')
    g.append(box(10, 386, 880, 44, 'One shared working tree (one git checkout): every agent of every book writes here', '', 'bx tree'))
    for x in (120, 360, 600, 830):
        g.append(arrow(x, 380, x, 388, 'ar thin'))
    g.append(box(10, 446, 280, 66, 'The cap (a4c9020, 0c3628f)', 'a run stops mid-book: 71 modules, no scenes\nfix: a skip list per book (0c94e02)', 'bx bad'))
    g.append(box(305, 446, 300, 66, 'git add -A (d77da1b)', "Book 17's sweep commits 12 unrendered\nscenes of Books 21-23; fix: explicit paths (94806a1)", 'bx bad'))
    g.append(box(620, 446, 270, 66, 'The guard', '`git status --short`: nothing tracked\nmodified, or do not commit (0c54cd5)', 'bx b4'))
    g.append('</svg>')
    return ''.join(g)

def diagram_session():
    g = [f'<svg viewBox="0 0 900 470" role="img" aria-label="This session: one parent, many sub-agents, a render queue and a review gate" class="dia">', DEFS]
    g.append(box(10, 10, 250, 70, 'The director', 'the person the session works for:\nasks, looks, says what to keep', 'bx b1'))
    g.append(box(320, 10, 300, 70, 'The parent session', 'Claude, session 01SQFS6z: plans, dispatches,\nsnapshots, reviews, publishes', 'bx b2'))
    g.append(box(680, 10, 210, 70, 'Check-ins', f'{CHECKINS["count"]} reminders it set itself,\nabout an hour apart', 'bx b4'))
    g += [arrow(260, 38, 318, 38), arrow(320, 56, 262, 56), arrow(678, 52, 622, 52), arrow(620, 32, 678, 32)]
    subs = [('Readers', '10 blind readers\n(2026-09-26)'), ('Kit builders', '6 at once\n(2026-09-26)'), ('Trailers, game', '3 trailer rounds,\nthe game (09-27/28)'),
            ('Engine, renders', 'staging, scoring,\nrender queues'), ('Resumers', f'{SB["resumes"]} after restarts\nor reboots')]
    for i, (a, b) in enumerate(subs):
        x = 10 + i * 178
        g.append(arrow(470, 80, x + 84, 118, 'ar thin'))
        g.append(box(x, 120, 168, 64, a, b, 'bx b5'))
    g.append(f'<text x="10" y="208" class="bs">{SB["count"]} sub-agents in all (source: the session\'s transcripts, not git). While they ran, the parent committed snapshots: {rep_wip} "work in progress" by the report\'s count, {rep_running} with builders still running.</text>')
    g.append(box(10, 224, 280, 70, 'The render queue', 'one export at a time, niced; frames kept\nas drawn, so a restart resumes', 'bx b3'))
    g.append(box(310, 224, 270, 70, 'The review gate', 'a contact sheet of every shot,\nlooked at before anything is published', 'bx b6'))
    g.append(box(600, 224, 290, 70, 'Keep the takes', 'a re-shoot never overwrites:\nfilms/odyssey/takes/ (0821cda9)', 'bx b4'))
    g += [arrow(290, 259, 308, 259), arrow(580, 259, 598, 259)]
    g.append(box(10, 318, 430, 64, 'Container restarts', '4 snapshots across a restart (0ad817b9, ff694a08, 9f7e7ab3,\na0baeb64); a resumer picks up from the last commit', 'bx bad'))
    g.append(box(460, 318, 430, 64, 'Publish', 'the branch first; then main and gh-pages once\nthe sheet is passed (PR #11 was merged by hand)', 'bx b2'))
    g.append(arrow(745, 294, 745, 316))
    g.append('<text x="10" y="410" class="bs">What the agents write is code and data: the forage, the performance engine, the cinematographer,</text>')
    g.append('<text x="10" y="426" class="bs">keyframes and director\'s modules. Nothing in the film pipeline calls a language model when it runs.</text>')
    g.append('</svg>')
    return ''.join(g)
dia_hw = diagram_halfworld(); dia_s = diagram_session()

# ---------------------------------------------------------------- what is missing
MISSING = [
 'How Books I to XV were generated. The halfworld\'s history begins with them finished (fd6ef65); the jobs, prompts and agent results of that phase are not in git. The asset manifest keeps each asset\'s generation prompt (the prompt\'s PHASE 2 asks for it), but not the run that used it.',
 'The first prompt. PROMPT-HALFWORLD.md is a method written down after the fact, in the first commit. Nothing records what was first typed, or by whom.',
 'The run plan. bookXVI/run-plan.json is empty in every commit; the arguments each workflow run received are not recorded, nor are the agents\' structured results.',
 'Who pressed the buttons in the halfworld. Loom Mason is a placeholder identity; the trailers say which model co-authored a commit, not which person ran the session.',
 'The music\'s maker and licence. The files and the promptbook are there; the service, the account behind "Treblo" and the terms are not.',
 'The text of the drive script and the integration report. drive/ holds them "delivered" (f80f0a3); who or what wrote them, and from which translation, is not stated.',
 'This session\'s sub-agent counts and check-ins come from the session\'s own local records (transcript metadata, the routine list). They are not in git and cannot be checked from the repository alone; the labels are published, the transcripts are not.',
]
missing = ''.join(f'<li>{E(m)}</li>' for m in MISSING)

METHOD = f'''git -C ../odyssey-halfworld fetch --unshallow          # the clone was 51 commits deep; full history: {HO["commits"]} commits
git -C ../odyssey-halfworld log --reverse --format='%h %aI %an <%ae> %(trailers:key=Co-Authored-By,valueonly)'
git -C ../odyssey-halfworld show --name-only d77da1b    # what Book 17's sweep committed
git log --format='%h %aI %an %s' | grep -i 'work in progress'
python3 tools/forensics/origins.py --halfworld ../odyssey-halfworld   # this page and findings.json "origins"'''

PAGE = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Origins and assembly</title>
<meta name="description" content="A chapter of the forensic report: where the halfworld came from, how its books were built by fanned-out agents, how its drawings became LEGO in the forage, and how this session assembled the films with one parent and many sub-agents. Every claim cites a commit or a file.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<style>
:root {{ --paper: #f4f4f0; --ink: #141414; --muted: #5d5a52; --card: #fbfbf8; --rule: #d8d6ce; --blue: #0033cc; --bad: #b3261e; --ok: #1d6b3a;
  --s1: #2f5be0; --s2: #c27c0e; --s3: #6b4fa0; --s4: #8a8577; --b-red: #c91a09; --b-yellow: #f2cd37; --b-blue: #0055bf; --b-green: #237841; --b-orange: #fe8a18; }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --bad: #ff8a80; --ok: #6fcf8f; --s1: #5b7cf0; --s2: #a8801e; --s3: #9a82d0; --s4: #6d6a62; }} }}
:root[data-theme="dark"] {{ --paper: #0f0f0e; --ink: #ecebe6; --muted: #a09d94; --card: #181816; --rule: #2c2b28; --blue: #6f8cff; --bad: #ff8a80; --ok: #6fcf8f; --s1: #5b7cf0; --s2: #a8801e; --s3: #9a82d0; --s4: #6d6a62; }}
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
ol.findings li {{ margin: 0 0 14px; }}
.ev {{ display: block; margin-top: 2px; }}
.ev code {{ font-size: 11.5px; color: var(--muted); border: 1px solid var(--rule); padding: 0 4px; margin-right: 4px; }}
.ev a {{ margin-right: 6px; }}
.scroll {{ overflow-x: auto; border: 1px solid var(--rule); background: var(--card); margin: 10px 0; max-width: 100%; }}
table {{ border-collapse: collapse; width: 100%; font-size: 13.5px; }}
th, td {{ text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--rule); vertical-align: top; }}
thead th {{ font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); font-weight: 600; position: sticky; top: 0; background: var(--card); }}
td.t {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}
.chart, .dia {{ width: 100%; height: auto; display: block; background: var(--card); border: 1px solid var(--rule); }}
.chart .grid {{ stroke: var(--rule); stroke-width: 1; }} .chart .base {{ stroke: var(--muted); stroke-width: 1; }}
.chart .ax {{ fill: var(--muted); font: 11px Inter, sans-serif; }}
.chart .hit {{ fill: transparent; }} .chart .hit:hover {{ fill: var(--ink); fill-opacity: .06; }}
.dia .bx {{ fill: var(--paper); stroke: var(--ink); stroke-width: 1.5; }}
.dia .b1 {{ stroke: var(--b-red); stroke-width: 2.5; }} .dia .b2 {{ stroke: var(--b-blue); stroke-width: 2.5; }} .dia .b3 {{ stroke: var(--b-green); stroke-width: 2.5; }}
.dia .b4 {{ stroke: var(--b-yellow); stroke-width: 2.5; }} .dia .b5 {{ stroke: var(--b-orange); stroke-width: 2; }} .dia .b6 {{ stroke: var(--b-blue); stroke-width: 2; stroke-dasharray: 5 3; }}
.dia .tree {{ fill: var(--card); stroke: var(--muted); stroke-dasharray: 3 3; }} .dia .bad {{ stroke: var(--bad); stroke-width: 2; }}
.dia .bt {{ fill: var(--ink); font: 600 13px Inter, sans-serif; }} .dia .bs {{ fill: var(--muted); font: 12px Inter, sans-serif; }}
.dia .ar {{ stroke: var(--muted); stroke-width: 1.6; }} .dia .thin {{ stroke-width: 1; }} .dia .ahp {{ fill: var(--muted); }}
.dia .ag {{ fill: var(--b-orange); }}
.legend {{ display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 13px; color: var(--muted); margin: 6px 0; }}
.legend i {{ display: inline-block; width: 12px; height: 12px; border-radius: 2px; margin-right: 6px; vertical-align: -1px; }}
#tip {{ position: fixed; pointer-events: none; background: var(--ink); color: var(--paper); font-size: 12.5px; padding: 5px 8px; border-radius: 3px; display: none; z-index: 5; max-width: 280px; }}
ul.defects {{ padding-left: 20px; max-width: 900px; }} ul.defects li {{ margin: 0 0 10px; }}
pre {{ background: var(--card); border: 1px solid var(--rule); padding: 12px; overflow-x: auto; font: 12px/1.5 ui-monospace, Menlo, monospace; }}
details summary {{ cursor: pointer; font-size: 14px; color: var(--blue); margin: 6px 0; }}
.grid2 {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; }}
footer {{ margin-top: 64px; font-size: 13px; color: var(--muted); border-top: 1px solid var(--rule); padding-top: 16px; }}
@media (max-width: 700px) {{ h2 {{ font-size: 28px; }} }}
</style>
</head>
<body>
<main>
<p class="kicker"><a href="index.html">Forensic report</a> &middot; chapter two</p>
<h1>Origins and assembly: the halfworld, the forage, the agents</h1>
<div class="studs" aria-hidden="true"><i style="background:var(--b-red)"></i><i style="background:var(--b-yellow)"></i><i style="background:var(--b-blue)"></i><i style="background:var(--b-green)"></i><i style="background:var(--b-orange)"></i></div>
<p class="lede">The LEGO Odyssey did not start in this repository. Its scenes, its spoken lines, its voices and its music came from an earlier project, the halfworld, where an adaptation prompt and fanned-out agents drew the whole poem as halftone programs. This chapter follows that history from its first commit, across the bridge into LEGO, to the way this session assembled the films. Each claim cites a commit (<code>hw</code> marks the halfworld's) or a file; where the record is silent, the chapter says so.</p>
<div class="links"><a href="index.html">The forensic report</a><a href="findings.json">Raw numbers ("origins")</a><a href="../making/index.html">The making-of</a><a href="https://github.com/hartswf0/odyssey-halfworld">The halfworld repository</a></div>
<div class="stats">{stats}</div>

<h2 id="findings">Findings</h2>
<ol class="findings">{findings}</ol>

<h2 id="timeline">Timeline across both repositories</h2>
<p class="sub">Commits per day, 2026-07-23 to 2026-10-04: the halfworld ({HO["commits"]} commits, full history after unshallowing a 51-commit clone) and this branch. Hover a day for its numbers.</p>
<div class="legend"><span><i style="background:var(--s3)"></i>Halfworld, Claude trailer</span><span><i style="background:var(--s4)"></i>Halfworld, no trailer</span><span><i style="background:var(--s1)"></i>Tractor, authored as Claude</span><span><i style="background:var(--s2)"></i>Tractor, human-named</span></div>
{ch_both}
<div class="scroll"><table><thead><tr><th>when</th><th>where</th><th>commit</th><th>what</th></tr></thead><tbody>{tl_rows}</tbody></table></div>
<p class="note">Halfworld times are the author's local time (-04:00); this branch's agent commits are UTC. There is a gap from 2026-08-19 to 2026-09-15 in the halfworld and no activity there after 2026-09-23.</p>

<h2 id="halfworld">The halfworld</h2>
<h3>The card and the atlas</h3>
<p class="sub">The adaptation prompt, {hf("PROMPT-HALFWORLD.md")}, is meant to be pasted "into Claude with any book". It names the unit of pacing ("Books/cantos/chapters are the unit of pacing — build a few, verify, then fan out"), then six phases: the atlas (each scene as causal beats, its assets, and the state handed to the next scene), the engine (the dot law, keying, ink cut-outs, restaging), the contracts, agentic generation, the front-ends and the music. The atlas itself was parsed from a markdown file outside the repository ({hf("harness/parse-atlas.mjs")} reads <code>odyssey_complete_two_view_scene_atlas.md</code> from a local Downloads folder); that file is not in git.</p>
<h3>Drawings that are programs</h3>
<p class="sub">An asset is an ES module of about 200 to 400 lines whose <code>draw()</code> paints flat tone, never dots ({hf("engine/asset-contract.mjs")}). The engine's one post-pass, <code>dotifyField</code>, prints the composed frame on a lattice: lightness L, darkness d = 1 - L, nothing below d = 0.10, otherwise a disc of radius d<sup>0.9</sup> &middot; &Delta; &middot; 0.62 ({hf("README.md", 46)}). The README places this in the lineage of Ken Knowlton's BEFLIX (Bell Labs, 1963). There are {HO["asset_modules_now"]} asset modules and {HO["scene_programs_now"]} scene programs in the tree today. The later engine files are also agent work: {hf("engine/guise.mjs")} and {hf("engine/blocking.mjs")} ({h("e0acb19")}), {hf("engine/liveness.mjs")} ({h("edd1cec")}: breath on a 4.1 s period, weight drift 9.3 s, "pure functions of (seed,t)"), {hf("engine/speech.mjs")} ({h("d5791e7")}).</p>
<h3>Who committed</h3>
<div class="grid2"><div><div class="scroll"><table><thead><tr><th>author</th><th>co-author trailer</th><th>commits</th></tr></thead><tbody>{hw_auth_rows}</tbody></table></div></div>
<div><p class="note">The trailers change model on 2026-07-23 at 23:58 ({h("bfcd1b5")}): Claude Fable 5 before, Claude Opus 4.8 after. The six plain "Claude" trailers are on the per-book sweep commits and one comment fix (c84c9b4), which the workflow's agents wrote; two sweeps (d77da1b, 1570427) carry no trailer at all. The one Claude-authored commit, {h("cd01bed")}, carries this session's id.</p></div></div>

<h2 id="fanout">The per-book fan-out</h2>
<p class="sub">Book XVI was built first, with a workflow of its own ({hf("bookXVI/build-book-xvi.workflow.mjs")}) and the reference scene OD-B16-S03; what it taught went into the brief mid-run ({h("4a0a1cc")}). Books XVII to XXIV then ran through {hf("bookXVI/finish-books.workflow.mjs")}. The diagram is drawn from that file.</p>
{dia_hw}
<div class="grid2">
<div><h3>The jobs per book</h3><div class="scroll"><table><thead><tr><th>book</th><th>new asset jobs</th><th>reused</th><th>scenes</th></tr></thead><tbody>{jobs_rows}</tbody></table></div>
<p class="note">From <code>bookNN/jobs.json</code>: 134 new asset jobs for Books XVII–XXIV, where the workflow's description says 125. Its asset prompt tells an agent whose job is another hall or hut to skip it as a duplicate room ({hf("bookXVI/finish-books.workflow.mjs", 73)}); the list the run actually received is not recorded (<code>bookXVI/run-plan.json</code> is empty).</p></div>
<div><h3>What each sweep committed</h3><div class="scroll"><table><thead><tr><th>commit</th><th>time</th><th>book</th><th>scenes in it</th><th>assets</th><th>trailer</th></tr></thead><tbody>{sweep_rows}</tbody></table></div>
<p class="note">Read from <code>git show --name-only</code>. Book 17's row is the <code>git add -A</code> sweep. Books 21–23's own scenes were then committed from the second run ({h("0c3628f")}, "all seven validated by render before commit"), and Book 24 by hand ({h("0c54cd5")}).</p></div>
</div>

<h2 id="voices">The voices and the music</h2>
<p class="sub">The drive script and an integration report arrived as delivered files ({h("f80f0a3")}: "both delivered drive systems installed under drive/"); its counts are 152 scenes and {HO["drive_turns"]} turns ({hf("drive/integration-report-v4.json")}). The halfworld then wrote its own first-person lines over the script's payload text and had them performed by Gemini's prebuilt voices with director notes ({hf("harness/build-drive-audio.mjs", 10)}: <code>gemini-3.1-flash-tts-preview</code>; the key in a gitignored file). The batch route ({hf("harness/build-drive-batch.mjs")}) exists because the interactive tier stopped at 100 requests a day. {h("d69c7d1")} cleared Books XVI–XXIV's audio and resubmitted it as nine per-book batches "so the studio cast re-records against the authored lines instead of the drive script's payload fragments". This repository later measured that seven dialogue segments in its 34 voiced takes still speak the summary (all in Books XVI–XXIV), so caption and sound disagree there.</p>
<p class="sub">The music: {HO["tracks"]} Ogg files in three albums, all suffixed "Treblo". The promptbook ({hf("audio/promptbook.md")}, 24 books, 152 scenes) writes a soundtrack genome per book; BRONZE COUNCIL's album title and the titles of tracks {", ".join(map(str, HO["bronze_council_titles_matching_promptbook"]))} are its book titles word for word. The prompt says to "generate tracks (Suno or similar)". That the albums were generated from the promptbook is an inference from the matching titles; the generator, the account and the licence are not recorded.</p>

<h2 id="bridge">The bridge into LEGO</h2>
<p class="sub">Three steps, three hands. On 2026-09-15 Watson Hartsoe committed a corpus of real LDraw models for the Odyssey and a gap audit ({t("56aa48b0")} to {t("e9352284")}, 11 commits, no trailers). On 2026-09-16 the earlier Claude session (01MNSfMe, {TO["session_01MNSfMe"]["commits"]} commits from {t(TO["session_01MNSfMe"]["first"])} to {t(TO["session_01MNSfMe"]["last"])}) put scenes on those sets ({t("a173797e")}). On 2026-09-23 this session linked the halfworld's cards to LDraw builds there ({h("cd01bed")}) and, a minute later, foraged all 582 cards here ({t("52030958")}).</p>
<p class="sub">The forage turns words into bricks by rule. {tf("tools/forage/table.js")} gives each type a way of being got: "character: a minifigure from real parts, dressed by role (god, hero, beggar, shade, suitor …)"; "location: a sub-build foraged from a real set (the King's Castle for a hall, the Barracuda for a harbour, the Lincoln Memorial for Olympus, Skull Island for a cave)"; "prop: the readymade part the thing is". A seeded random hand varies a card the same way on every run. {tf("tools/forage/ldraw.js")} then holds the build to account: every part resolved in the library, "every stud of every piece tested against the undersides above it", every piece traced to the plate through stud joints or contact, the rest named as floating. The card files say who did it: <code>0 Author: word to world, tools/odyssey-forage.js</code>, with donors credited in their FILE headers. There are {TO["cards_now"]} card files now: the 863 the report counted and the 8 cards of the making-of studio. The staged keyframes, the director's modules and the props were written the same way, by the agent, as files the engine reads.</p>
<p class="note">Tools in this repository that read the halfworld clone ({len(TO["tools_reading_halfworld"])}): {", ".join(code(p) for p in TO["tools_reading_halfworld"])}.</p>

<h2 id="session">This session's assembly</h2>
<p class="sub">Session 01SQFS6z has {TO["session_01SQFS6z"]["commits"]} commits on the branch, from {t(TO["session_01SQFS6z"]["first"])}. It worked as one parent and many helpers. The parent took the director's requests, wrote briefs, started sub-agents in the background for builds, readings and render queues, committed snapshots of their work while they ran ("as their builders leave them", "not yet reviewed"), and set itself reminders to check on them. Renders ran one at a time; each frame is written to disk as it is drawn, so a render interrupted by a container restart resumes where it stopped. Nothing was published until a contact sheet of every shot had been looked at, and since {t("0821cda9")} a re-shoot never overwrites the take it replaces.</p>
{dia_s}
<div class="grid2">
<div><h3>Sub-agents by day</h3><div class="scroll"><table><thead><tr><th>day</th><th>started</th><th>their labels</th></tr></thead><tbody>{sub_days}</tbody></table></div>
<p class="note">Source: {E(SB["source"])}. The day is when each transcript's metadata was written.</p></div>
<div><h3>What git shows of it</h3>
<ul class="defects">
<li>{rep_wip} "work in progress" commits by the report's count ({TO["work_in_progress"]} at this page's commit); 149 of the report's on 2026-09-30.</li>
<li>{rep_running} snapshots taken while builders were still running (the report's count; {TO["builders_running_snapshots"]} subjects say so in their first line).</li>
<li>4 snapshots across a container restart: {", ".join(t(x) for x in TO["container_restart_commits"])}.</li>
<li>6 snapshots "at the check-in" on 2026-09-30: {", ".join(t(x) + " " + E(a[11:16]) for x, a in TO["checkin_snapshots"])}.</li>
<li>{CHECKINS["count"]} check-in reminders from {E(CHECKINS["first"])} to {E(CHECKINS["last"])}: {E(CHECKINS["source"])}.</li>
<li>The engine as written code: <code>tools/perform</code> {TO["tools_perform"]["files"]} files, {TO["tools_perform"]["lines"]:,} lines; <code>tools/cinematographer</code> {TO["tools_cinematographer"]["files"]} files, {TO["tools_cinematographer"]["lines"]:,} lines; {sum(TO["engine_commits"].values())} commits, all authored as Claude. The forage: {TO["forage_code"]["files"]} files, {TO["forage_code"]["lines"]:,} lines.</li>
</ul></div>
</div>

<h2 id="missing">Where the record is silent</h2>
<ul class="defects">{missing}</ul>

<h2 id="method">Method</h2>
<p class="sub">Both histories read with git, nothing rewritten; the halfworld clone was only fetched. This page and findings.json's <code>origins</code> are written by <code>tools/forensics/origins.py</code>.</p>
<pre>{E(METHOD)}</pre>

<footer>Chapter two of the forensic report, written by Claude (Claude Code, session 01SQFS6z) from the two repositories' records. The making-of film's part two (OD-B25-S05..S08) acts these findings out. &middot; <a href="index.html">the report</a> &middot; <a href="../making/index.html">the making-of</a> &middot; <a href="../kits/index.html">the hub</a></footer>
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
open(os.path.join(OUT, 'origins.html'), 'w').write(PAGE)
print('wrote odyssey/forensics/origins.html', len(PAGE), 'and findings.json "origins"')
