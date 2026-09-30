#!/usr/bin/env python3
"""tools/forage/product/cascadepage.py — odyssey/cascade/index.html, "The Odyssey in Cascade": the Cascade project in odyssey/cascade/,
stone by stone, each with the failure it grew from, its player (players/view.html?g=<name>, the static player cascade build made),
its print (media/<name>.svg), its motion (media/<name>.mp4), and what it lets the project do that it could not before; then where
Cascade takes the project and what it cannot do yet. In the visual language of the kit pages (STYLE and HEAD from kitpages.py).

  python3 tools/forage/product/cascadepage.py

Every number is read when this runs: the verify report (odyssey/cascade/verify.json, from tools/verify.mjs), the kit's check
(odyssey/cascade/kit/*.json, from tools/gesture_kit.py), the players' sizes on disk, the clash counts (assets/clashes.json).
"""
import html, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitpages import STYLE, HEAD

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CAS = os.path.join(ROOT, 'odyssey/cascade')
E = html.escape


def size(path):
    total = 0
    for d, _, fs in os.walk(path):
        for f in fs: total += os.path.getsize(os.path.join(d, f))
    return total


def kb(n): return f'{n / 1024:,.0f} KB'


EXTRA = '''
.stone { margin-top: 18px; }
.grew { border-left: 3px solid var(--gold); padding: 6px 0 6px 14px; color: var(--muted); max-width: 900px; }
.grew b { color: var(--ink); }
.before { font-weight: 600; max-width: 900px; margin: 14px 0; }
.before::before { content: "What we could not do before: "; color: var(--blue); }
.player { width: 100%; border: 1px solid var(--rule); background: var(--card); display: block; height: 760px; }
.outs { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
.outs figure { border: 1px solid var(--rule); background: var(--card); padding: 8px; }
.outs img, .outs video { width: 100%; display: block; background: #fff; }
.outs video { background: #000; }
.facts { font-size: 13px; color: var(--muted); }
.facts code { font-size: 12px; }
ul.plain { padding-left: 20px; max-width: 900px; } ul.plain li { margin: 8px 0; }
.limits li::marker { color: var(--bad); }
.gains li::marker { color: var(--ok); }
@media (max-width: 800px) { .outs { grid-template-columns: 1fr; } .player { height: 900px; } }
'''

STONES = [
    dict(name='kit', title='1 · A kit of a motion, not a moment',
         grew='Every kit of the Odyssey line is one moment posed, by the brief\'s own rule (the peak of the story, posed). The motion that '
              'moves the film lives elsewhere: tools/choreograph.js writes every figure\'s servos as timed keys on the voice clock '
              '(odyssey/choreo/OD-B01-S03.json), and film-readymades/choreo.js plays them back as a pure function of time. A gesture never '
              'left the film.',
         how='project.ChoreoHand reads the choreography sheet (Telemachus\'s slice of OD-B01-S03, or Odysseus\'s of OD-B22-S01, cut small by '
             'tools/extract.cjs), samples the blocking and every keyed layer, and runs the minifigure\'s forward kinematics (the arm pivots '
             'and the hand\'s grip from world/minifig.js) for the right hand. The hand is swept through the span as a trail, which is '
             'geometry; project.StudGrid quantizes it to studs across and plates up; project.Bricks draws the cells as the plates they become. '
             'The same graph writes the print (SvgExport), the frames (cascade run --frames) and, as a JSON asset, the cells the offline kit '
             'step builds.',
         before='Telemachus\'s welcome existed only as frames of a scene. Now the one graph that reads his sheet prints it, animates it, lets a '
                'visitor scrub it and change its sampling and grid on a phone, and hands its cells to kitlib, which builds the gesture in '
                'real parts and checks it: {kit}.'),
    dict(name='attention', title='2 · The attention knob',
         grew='The acted gate was measured: {before}% of figure-drawings moving before the choreographer, {after}% after '
              '(odyssey/choreo/density). The rise is the choreographer\'s last pass: wherever a figure sits under a threshold of motion '
              '(0.5% of its height per drawing) for half a second, it is given a piece of business on the fill layer. The threshold is a '
              'constant in a generator, and the loop that enforces it is buried in the rough pass.',
         how='The twelve figures of OD-B01-S03 stand at their marks in plan (project.Hall). A cascade.core.Feedback container runs one '
             'drawing per step (12 a second, the sheet\'s own rate): project.Business measures each figure\'s motion (the scene\'s scripted '
             'layers, act, work, walk, beat, react, from the sheet), invents business where it falls below the threshold, measures again, and '
             'carries the state forward; the business decays. cascade.pop.Trail makes trails of the loop\'s history. Rings: blue, the script '
             'moves the figure; orange, business was invented this drawing; grey, still.',
         before='The fill rule was a constant in tools/choreograph.js: to see the hall at another threshold meant regenerating the sheet and '
                'rendering the scene again. Here the threshold is a slider on a live loop whose state is explicit: at zero, with the script '
                'turned off, the hall is statues; at 300 it is frenzy; the critic checks both headless.'),
    dict(name='clocks', title='3 · Two clocks',
         grew='The film has one clock. Every figure, rig and prop is keyed on the voice (odyssey-choreo/1: "clock": "cut"). Calypso\'s seven '
              'years and the four days Odysseus spends building the raft run on it at the same rate, so the poem\'s time can be cut, never '
              'shown passing.',
         how='Two channels. project.Planks lays the raft\'s logs at the performer\'s rate (logs per second of film); project.SkyArcs turns the '
             'world\'s days (the performer\'s seconds times a ratio) into the sun\'s path across the southern sky of a latitude for every day '
             'lived, higher in summer, lower in winter, with the moon\'s beside it and a tick for each year. The logs are a Circle copied to '
             'points (cascade.geo.CopyToPoints).',
         before='The world\'s rate was the performer\'s rate. Now it is a parameter: at 0.4 days a second the sky turns the poem\'s four days '
                'while the raft goes down; at 255.7 seven years pass over one raft, and the sun\'s arcs stay printable, a solargraph of the '
                'captivity.'),
    dict(name='forbidden', title='4 · The illegal Odyssey',
         grew='The eight Troy and Ithaca modules were built before the strict check and fail it: {clash:,} pairs of parts filling the same '
              'space (tools/forage/product/clicks.py). The hub of the line lists them as numbers to rebuild.',
         how='tools/clashes.py measures, offline and with the line\'s own checker, the box each pair of parts shares; the graph '
             '(project.Forbidden) draws only those volumes, card by card on one scale, in plan, front or side, and exports them as SVG: the '
             'kit of forbidden bricks.',
         before='Clashes were a count in a table. Drawn, they say what the count hid: {share}% of them are one mistake, a 2 x 8 plate '
                '(3034) in the same space as another part, most often a 2 x 4 tile ({tile:,} pairs): floors laid twice.'),
    dict(name='facing', title='5 · The facing field',
         grew='93 bows faced backward (tools/forage/product/fixbows.py): the forage placed each bow with its arrow toward its own -z and '
              'nothing said which way the archer faced. Facing was implicit, so it was wrong everywhere at once.',
         how='In the Cyclops\' cave (project.FacingField) the blinded giant gropes along a path; every object gets an orientation attribute, '
             'N, pointing away from where his hand is now, and cascade.geo.CopyToPoints turns each glyph by it. The first instance is the bow '
             '(red). Switch the attribute off and every copy keeps its glyph\'s own facing.',
         before='Orientation was a matrix typed into each placement. Here it is data a generic operator reads: move the groping point and the '
                'whole cave turns away from it; untick one box and the 93 bows\' failure comes back.'),
]


def main():
    graphs = {g['name']: g for g in json.load(open(os.path.join(CAS, 'graphs.json')))['graphs']}
    verify = json.load(open(os.path.join(CAS, 'verify.json')))
    kit = json.load(open(os.path.join(CAS, 'kit/cascade.gesture-welcome.json')))
    dens = json.load(open(os.path.join(CAS, 'assets/hall.json')))['density']
    clashes = json.load(open(os.path.join(CAS, 'assets/clashes.json')))['cards']
    n_clash = sum(len(c['clashes']) for c in clashes)
    with_plate = sum(1 for c in clashes for q in c['clashes'] if '3034' in q[6:8])
    tile = sum(1 for c in clashes for q in c['clashes'] if sorted(q[6:8]) == ['3034', '87079'])
    players = {n: size(os.path.join(CAS, 'players', n)) for n in graphs}
    nodes = sorted(os.listdir(os.path.join(CAS, 'nodes')))
    fps = {g['name']: g for g in verify['graphs']}
    media = json.load(open(os.path.join(CAS, 'media/media.json')))
    rates = sorted(m['framesPerSecond'] for m in media.values())
    kit_s = f'{kit["pieces"]} pieces, {kit["loose"]} loose, {kit["clash"]} clashes'
    fill = dict(kit=kit_s, before=round(dens['before'] * 100, 1), after=round(dens['after'] * 100, 1), clash=n_clash,
                share=round(with_plate / n_clash * 100), tile=tile)

    out = [HEAD.format(title='The Odyssey in Cascade', style=STYLE + EXTRA)]
    out.append('''  <div class="kicker">Word to World · the Odyssey in Cascade</div>
  <h1>The Odyssey in Cascade</h1>
  <p class="lede">Cascade is FIELD.IO's open-source node-graph runtime (MIT, <a href="https://github.com/marcuswendt/cascade">github.com/marcuswendt/cascade</a>,
    npm <code>@field/cascade</code> 0.7.1): Houdini's way of working (small typed operators, explicit data flow, parameters that hold
    values, expressions or keyframes, explicit feedback, particles whose trails are geometry) in TypeScript, with a project that is an
    ordinary folder of diffable <code>.cascade</code> graphs. The same graph cooks headless from the command line (Skia for Canvas 2D,
    no browser) and plays in a static web player of a few hundred kilobytes. That is why it is here: the Odyssey's film, game and kits
    are three stacks that do not talk, and each of these five graphs grew from a failure or an aberration of one of them. Every player
    below is live: scrub it, change its parameters.</p>''')
    total_players = sum(players.values())
    out.append(f'''  <div class="stats">
    <div><b>{len(graphs)}</b><span>graphs</span></div>
    <div><b>{len(nodes)}</b><span>project nodes</span></div>
    <div><b>{kb(total_players)}</b><span>all five players</span></div>
    <div><b>{kit["pieces"]}</b><span>pieces in the gesture kit · {kit["loose"]} loose · {kit["clash"]} clashes</span></div>
  </div>''')
    for s in STONES:
        g, v = graphs[s['name']], fps[s['name']]
        pl = os.path.join(CAS, 'players', s['name'])
        out.append(f'  <h2 id="{s["name"]}">{E(s["title"])}</h2>\n  <div class="stone">')
        out.append(f'    <p class="grew"><b>Grew from:</b> {E(s["grew"].format(**fill))}</p>')
        out.append(f'    <p class="sub">{E(s["how"])}</p>')
        out.append(f'    <iframe class="player" src="players/view.html?g={s["name"]}" title="{E(g["title"])}: the Cascade player" loading="lazy"></iframe>')
        out.append(f'    <p class="facts">Player: <code>players/{s["name"]}/</code>, {kb(players[s["name"]])} (cascade build of <code>{g["graph"]}</code>), '
                   f'frames {g["frames"][0]} to {g["frames"][1]} at {g["fps"]} a second. Scene {E(v.get("scene", ""))}, {E(v.get("title", ""))}: '
                   f'cineosis sign {E(v.get("sign", ""))} ({E(v.get("signName", ""))}).</p>')
        out.append('    <div class="outs">')
        out.append(f'      <figure><a href="media/{s["name"]}.svg"><img src="media/{s["name"]}.svg" alt="{E(g["title"])}: the print, SVG" loading="lazy"></a>'
                   f'<figcaption>Print: <a href="media/{s["name"]}.svg">media/{s["name"]}.svg</a>, written by cascade.geo.SvgExport</figcaption></figure>')
        out.append(f'      <figure><video src="media/{s["name"]}.mp4" poster="media/{s["name"]}.jpg" controls muted loop playsinline preload="none"></video>'
                   f'<figcaption>Motion: <a href="media/{s["name"]}.mp4">media/{s["name"]}.mp4</a>, every frame cooked headless by cascade run --frames</figcaption></figure>')
        if s['name'] == 'kit':
            out.append('      <figure><img src="kit/cascade.gesture-welcome.jpg" alt="The gesture kit rendered: a wall of 1 x 1 plates and bricks tracing the hand from the feast to the gate" loading="lazy">'
                       f'<figcaption>Build: <a href="kit/cascade.gesture-welcome.mpd">kit/cascade.gesture-welcome.mpd</a>, {E(kit_s)} '
                       '(kitlib.check). Each column rises to the highest plate the hand reached over that stud; each coloured plate is a cell the hand passed through, dark blue at the feast, red at the gate.</figcaption></figure>')
            out.append('      <figure><img src="kit/cascade.gesture-welcome-side.jpg" alt="The gesture kit from the side: the hand\'s height as a skyline of plates" loading="lazy">'
                       '<figcaption>From the side: the hand\'s height, plate by plate, as he rises, crosses and greets her (tools/forage/look.js).</figcaption></figure>')
        out.append('    </div>')
        out.append(f'    <p class="before">{E(s["before"].format(**fill))}</p>')
        out.append('  </div>')

    # the critics
    out.append('''  <h2 id="critics">6 · The critics</h2>
  <p class="sub">The agent-facing contract. <code>node odyssey/cascade/tools/verify.mjs</code> cooks every graph headless with bounded
    frames and a timeout (<code>cascade run --frames --json --timeout</code>), reads the JSON manifest, checks every listed frame exists,
    is not blank and differs from the others, and asks one question per graph in the terms of its scene's cineosis sign: a variant of the
    graph with a parameter changed is cooked and its pixels counted. No browser is opened.</p>''')
    out.append('  <div class="tablewrap"><table>\n    <tr><th>Graph</th><th>Sign</th><th>Static check</th><th class="n">Frames</th><th class="n">Cook (ms)</th><th>The critic asks</th><th>Answer</th></tr>')
    for r in verify['graphs']:
        c = r.get('critic') or {}
        meas = ', '.join(f'{k} {v}' for k, v in c.items() if k not in ('ask', 'ok') and not isinstance(v, dict))
        if isinstance(c.get('kit'), dict): meas += (', ' if meas else '') + ', '.join(f'kit {k} {v}' for k, v in c['kit'].items())
        ok = lambda b: 'ok' if b else 'bad'
        out.append(f'    <tr><td><a href="#{r["name"]}">{E(r["name"])}</a></td><td>{E(r.get("sign", ""))} · {E(r.get("signName", ""))}</td>'
                   f'<td class="{ok(r["check"])}">{"passed" if r["check"] else "failed"}</td><td class="n">{r["run"].get("files", 0)}</td>'
                   f'<td class="n">{r["run"].get("ms", "")}</td><td>{E(c.get("ask", ""))}</td><td class="{ok(c.get("ok"))}">{"yes" if c.get("ok") else "no"}: {E(meas)}</td></tr>')
    out.append(f'  </table></div>\n  <p class="facts">Run {E(verify["ran"][:16].replace("T", " "))} UTC with Cascade {E(verify["cascade"])}: '
               f'{"every graph passed" if verify["ok"] else "failures above"}. The report is <a href="verify.json">verify.json</a>.</p>')

    # where it takes us
    out.append('''  <h2 id="where">Where Cascade takes us</h2>
  <ul class="plain gains">
    <li><b>One graph cooks to print, motion, web and LDraw.</b> The gesture graph is the SVG, the frame sequence, the player and (through
      one asset and kitlib) the checked kit. Nothing is re-authored between them, so they cannot drift apart.</li>
    <li><b>Visitors scrub and change parameters without the engine.</b> The five players together weigh ''' + kb(total_players) + ''';
      the game and the film build are one 29 MB page each (play/odyssey-game.html). A parameter change cooks in tens of milliseconds
      in a browser, measured in headless Chromium through <code>embed.js</code>.</li>
    <li><b>Explicit state beside a pure function of time.</b> The choreography is a function of t, which is what lets the film scrub;
      the attention loop keeps state from drawing to drawing, which is what invented business is. Cascade holds both in one graph:
      a Feedback container re-simulates from the first drawing, so the stateful loop scrubs too.</li>
    <li><b>Headless CPU cooks with a JSON contract.</b> <code>cascade run --frames --json --timeout</code> renders on Skia at ''' + \
        f'{rates[0]:.1f} to {rates[-1]:.1f}' + ''' (the whole sequence of each graph, measured by <code>tools/media.mjs</code>) frames a second on this machine and returns a
      manifest an agent can check, instead of scraping a browser at 1.2 frames a second.</li>
    <li><b>Graphs are diffable direction.</b> The fill threshold, the ratio of the two clocks, the kit scale are values in a
      <code>.cascade</code> file: a change of direction is a one-line diff a reviewer can read.</li>
  </ul>
  <h2 id="limits">What it cannot do yet</h2>
  <ul class="plain limits">
    <li><b>No shaded 3D.</b> Cascade's scene view and <code>cascade.geo.Render</code> draw wireframes and points; lights exist and shade
      nothing. The plates in the players are drawn by a project node (project.Bricks: three faces and a stud, painter-sorted, in 2D). The
      real LEGO look still comes from the forage renderer (tools/forage/look.js, three.js).</li>
    <li><b>WebGPU needs a real GPU.</b> Headless Chromium here renders with SwiftShader, and the CLI's Dawn host is optional; every node
      in this project is CPU and Canvas 2D so it runs everywhere.</li>
    <li><b>The kit step is outside the browser graph.</b> Players reject file, Python and shell nodes; the LDraw build is Python
      (kitlib), reading the cells the graph wrote as an asset, which the CLI host puts in <code>.cascade-cache/</code> under a content
      hash. The frames runner saves only image outputs, and naming a node (<code>--node</code>) narrows the cook to its inputs, so an SVG
      export needs a second, whole-graph run.</li>
    <li><b>Rough edges we hit.</b> Node inputs take values but not expressions (only props do); <code>cascade.geo.Merge</code> gives a
      primitive with no colour a transparent one, so strokes vanish until painted (project.Paint); <code>cascade.pop.Trail</code> wants full
      particle geometry (v, age, life, nextid) from any loop; there is no attribute-promote node; a module-level <code>const</code> helper
      in a node is refused by the architecture check; <code>setProp</code> does not override an expression on the same prop; the
      player's own page offers play and a frame box but no parameters, so <code>players/view.html</code> builds them from
      <code>graphs.json</code> with <code>embed.js</code>.</li>
  </ul>''')
    out.append('''  <h2>The files</h2>
  <ul class="links">
    <li><code>odyssey/cascade/</code>: the Cascade project (<code>cascade.json</code>, <code>package.json</code> pinning 0.7.1, <code>AGENTS.md</code>, <code>README.md</code>)</li>
    <li><code>kit.cascade</code>, <code>attention.cascade</code>, <code>clocks.cascade</code>, <code>forbidden.cascade</code>, <code>facing.cascade</code>: the graphs</li>
    <li><code>nodes/</code>: ''' + ', '.join(E(n) for n in nodes) + '''</li>
    <li><code>lib/</code>: the choreography sampler and minifigure kinematics, the hall, the view</li>
    <li><code>assets/</code>: gestures.json, hall.json, clashes.json, cut small from odyssey/choreo and odyssey/cards</li>
    <li><code>tools/</code>: extract.cjs, clashes.py, gesture_kit.py, build.mjs, media.mjs, verify.mjs</li>
    <li><code>players/</code>: the five static players and <a href="players/view.html?g=kit">view.html</a>, their controls</li>
    <li><a href="../kits/index.html">The Odyssey line</a> · <a href="../choreo/index.html">the dope sheet</a> · <a href="../kits/cineosis.html">cineosis</a></li>
  </ul>
  <footer>Made by <code>tools/forage/product/cascadepage.py</code>; every number read from the project when it ran.</footer>
</main>
<script>
/* each player's frame is on this origin: size it to what it holds */
for (const f of document.querySelectorAll('iframe.player')) {
  const fit = () => { try { const h = f.contentDocument && f.contentDocument.documentElement.scrollHeight; if (h > 200) f.style.height = h + 'px'; } catch (e) {} };
  f.addEventListener('load', () => { fit(); setTimeout(fit, 600); setTimeout(fit, 2500); });
  addEventListener('resize', fit);
}
</script>
</body>
</html>''')
    open(os.path.join(CAS, 'index.html'), 'w').write('\n'.join(out) + '\n')
    print('odyssey/cascade/index.html', os.path.getsize(os.path.join(CAS, 'index.html')), 'bytes')


if __name__ == '__main__':
    main()
