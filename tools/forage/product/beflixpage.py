#!/usr/bin/env python3
"""tools/forage/product/beflixpage.py — odyssey/cascade/beflix.html, "BEFLIX in Cascade": Ken Knowlton's BEFLIX machine (Bell Labs,
1963) as a Cascade node graph (odyssey/cascade/beflix.cascade), running Halfworld's The Sirens' Song as its footage and Halfworld's
recording of the scene as its clock, every frame also a LEGO mosaic. In the visual language of the kit pages (STYLE and HEAD from
kitpages.py) and of the Odyssey in Cascade page.

  python3 tools/forage/product/beflixpage.py

Every number is read when this runs: media/beflix.json (tools/beflix_film.mjs), kit/cascade.beflix-*.json (tools/beflix_kit.py),
assets/beflix/voice.json (tools/bake_voice.mjs), verify.json (tools/verify.mjs), the graph, the player's size on disk.
"""
import html, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitpages import STYLE, HEAD

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
CAS = os.path.join(ROOT, 'odyssey/cascade')
E = html.escape


def J(p): return json.load(open(os.path.join(CAS, p)))


def size(path):
    return sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(path) for f in fs)


def kb(n): return f'{n / 1024:,.0f} KB'


EXTRA = '''
.film { width: 100%; display: block; background: #000; border: 1px solid var(--rule); aspect-ratio: 1008 / 736; }
.facts { font-size: 13px; color: var(--muted); }
.looks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
.looks img { width: 100%; display: block; background: #fff; image-rendering: auto; }
.player { width: 100%; border: 1px solid var(--rule); background: var(--card); display: block; height: 1180px; }
.ops { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; margin-top: 12px; }
.ops figure { border: 1px solid var(--rule); background: var(--card); padding: 8px; }
.ops img { width: 100%; display: block; image-rendering: pixelated; }
.ops b { font-family: ui-monospace, Menlo, monospace; letter-spacing: .06em; }
.env { width: 100%; height: auto; display: block; color: var(--ink); margin: 10px 0 4px; }
.env .seg { fill: var(--blue); opacity: .12; } .env .lbl { font: 11px Inter, sans-serif; fill: var(--muted); }
.parts { font-size: 14px; } .parts td.n { white-space: nowrap; }
.sw { display: inline-block; width: 12px; height: 12px; border-radius: 50%; vertical-align: -2px; margin-right: 6px; border: 1px solid rgba(128,128,128,.6); }
.kitfig img { width: 100%; display: block; background: #111; }
ul.plain { padding-left: 20px; max-width: 900px; } ul.plain li { margin: 8px 0; }
.limits li::marker { color: var(--bad); }
blockquote.song { font-size: 22px; }
@media (max-width: 800px) { .looks { grid-template-columns: 1fr; } .player { height: 1500px; } .two { grid-template-columns: 1fr; } }
'''

OPS = [
    ('plate', 'Halfworld plate', 'project.BxPlate', "The footage. A layer of the Sirens' scene, drawn by Halfworld's own asset program, placed by the scene's own stage(), baked to ink levels; posed by state (a stroke cycle is a phase expression), moved by a keyframe channel (the shore panning past)."),
    ('paint', 'PAINT', 'project.BxPaint', 'Fill a region (rectangle, ellipse or frame) with an ink level by a combining rule: set, darken, lighten, add, subtract, invert, xor. The film uses it for the flash when the song begins.'),
    ('line', 'LINE', 'project.BxLine', "A line of cells, or a fan of them, dashed and marching: the Sirens' song reaching the mast. The voice lengthens the dashes."),
    ('text', 'TEXT', 'project.BxText', "Words in the mosaic's own 5 x 7 letters, magnified by whole cells. Wired to the voice, it types what the narrator says as he says it."),
    ('shift', 'SHIFT', 'project.BxShift', 'Move a region of cells, wrapping or leaving paper. With the voice on its drive input it shakes: Odysseus against the ropes.'),
    ('zoom', 'ZOOM', 'project.BxZoom', 'Cell magnification about a centre, nearest cell: the grain grows. The camera closes on Odysseus at the mast this way before the film cuts to the true close shot.'),
    ('expand', 'EXPAND', 'project.BxExpand', "Ink takes the darkest of its neighbours. On the title it swells with the voice."),
    ('shrink', 'SHRINK', 'project.BxExpand', 'Ink withdraws to the lightest of its neighbours: the song fading, the last seconds of the film.'),
    ('copy', 'COPY', 'project.BxCopy', "A region laid elsewhere, magnified, framed, from the field or a second mosaic: while the Sirens promise, his face in a window of the wide shot."),
    ('dissolve', 'DISSOLVE', 'project.BxDissolve', 'A to B cell by cell, each cell turning when the amount passes its threshold in a field: noise, radial, ordered (Bayer), rows, rain. Every cut in the film is one; the voice pushes a dissolve under way.'),
    ('poem', 'Poem Field', 'project.BxPoemField', "After Knowlton and VanDerBeek: Homer's words as rings from the Sirens' mouths, each ring the next word, repeated along its arc, multiplying as it travels, moving only while the voice sounds."),
]


def envelope_svg(v):
    env = [int(v['env'][i:i + 2], 36) / 1295 for i in range(0, len(v['env']), 2)]
    W, H, n = 1000, 120, len(env)
    step = max(1, n // 500)
    pts = []
    for j in range(0, n, step):
        x = j / (n - 1) * W; y = H - 18 - max(env[j:j + step]) * (H - 30)
        pts.append(f'{x:.1f},{y:.1f}')
    segs = ''.join(f'<rect class="seg" x="{s["start"] / v["total"] * W:.1f}" y="4" width="{s["dur"] / v["total"] * W:.1f}" height="{H - 22}"/>'
                   f'<text class="lbl" x="{s["start"] / v["total"] * W + 3:.1f}" y="{H - 4}">{k}</text>' for k, s in enumerate(v['segments']))
    return (f'<svg class="env" viewBox="0 0 {W} {H}" role="img" aria-label="The recording\'s amplitude over its {v["total"]} seconds, the seven spoken segments shaded">'
            f'{segs}<polyline points="{" ".join(pts)}" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>')


def main():
    graph = J('beflix.cascade'); media = J('media/beflix.json'); voice = J('assets/beflix/voice.json')
    key = J('kit/cascade.beflix-key.json'); flip = J('kit/cascade.beflix-flipbook.json')
    verify = J('verify.json'); vb = next(g for g in verify['graphs'] if g['name'] == 'beflix'); cr = vb['critic']
    spec = next(g for g in J('graphs.json')['graphs'] if g['name'] == 'beflix')
    nodes = [n for n in graph['nodes']]
    bx = sorted({n['module'] for n in nodes if n['module'].startswith('project.Bx')})
    player = size(os.path.join(CAS, 'players/beflix'))
    plates = sum(os.path.getsize(os.path.join(CAS, 'assets/beflix/plates', f)) for f in os.listdir(os.path.join(CAS, 'assets/beflix/plates')))
    render = os.path.exists(os.path.join(CAS, 'kit/cascade.beflix-key.jpg'))
    frender = os.path.exists(os.path.join(CAS, 'kit/cascade.beflix-flipbook.jpg'))
    song = next(l for l in json.load(open('/home/user/odyssey-halfworld/viewer/spoken-lines.json'))['lines'].items() if l[0] == 'OD-B12-S03-T04')[1]['line'] \
        if os.path.exists('/home/user/odyssey-halfworld/viewer/spoken-lines.json') else ''
    homer = next(n for n in nodes if n['id'] == 'poem')['props']['text']

    out = [HEAD.format(title='BEFLIX in Cascade', style=STYLE + EXTRA)]
    out.append(f'''  <div class="kicker">Word to World · the Odyssey in Cascade</div>
  <h1>BEFLIX in Cascade</h1>
  <p class="lede">In 1963 Ken Knowlton at Bell Labs wrote BEFLIX, a language for making films on a computer. A frame was a mosaic of
    252 by 184 cells, each holding an ink level from 0 to 7; a film was a program of operations on that mosaic (paint a region, draw
    a line, write letters, shift, zoom, expand, copy, dissolve), and a camera photographed the grid, frame after frame. This page is
    that machine rebuilt as a Cascade node graph, one node per operation. Its footage is Halfworld's <i>The Sirens' Song</i>, drawn by
    Halfworld's own programs; its clock is Halfworld's recording of the scene, whose loudness drives the dissolves, the zoom, the
    words and the ink. And every frame it makes is also a LEGO mosaic you could build.</p>
  <video class="film" src="media/beflix.mp4" poster="media/beflix.jpg" controls playsinline preload="metadata"></video>
  <p class="facts">The film, with sound: <a href="media/beflix.mp4">media/beflix.mp4</a>, {media["seconds"]} s, {media["frames"]} frames at
    {media["fps"]} a second, {media["mp4KB"] // 1024 if media["mp4KB"] > 2048 else media["mp4KB"]}{" MB" if media["mp4KB"] > 2048 else " KB"},
    every frame cooked headless by <code>cascade run --frames</code> from <code>beflix.cascade</code>. The sound is Halfworld's
    recording of OD-B12-S03 over its book's bed ({E(media["bed"]["album"].title())}, <i>{E(media["bed"]["track"])}</i>, looped as Halfworld's own film
    loops it), the bed at {media["bed"]["open"]} ducked to {media["bed"]["duck"]} while the voice speaks.</p>''')
    out.append(f'''  <div class="stats">
    <div><b>252 x 184</b><span>cells, ink 0 to 7</span></div>
    <div><b>{len(bx)}</b><span>BEFLIX nodes · {len(nodes)} in the graph</span></div>
    <div><b>{kb(player)}</b><span>the live player</span></div>
    <div><b>{key["pieces"]:,}</b><span>pieces in the key frame · {key["loose"]} loose · {key["clash"]} clashes</span></div>
  </div>''')

    # the voice and the line
    segs = ''.join(f'<tr><td class="n">{k}</td><td class="n">{s["start"]:.2f}</td><td class="n">{s["dur"]:.2f}</td><td>{E(s["kind"].replace("_", " ").lower())}</td><td>{E(s["text"])}</td></tr>'
                   for k, s in enumerate(voice['segments']))
    out.append(f'''  <h2 id="voice">The scene, the voice and the line</h2>
  <p class="sub">Book XII, OD-B12-S03, <i>The Sirens' Song</i>: the wind dies, Odysseus seals his crew's ears with wax, they bind him to
    the mast, the Sirens promise him all knowledge, he strains to be loosed, and Perimedes and Eurylochus tie him tighter until the
    song fades. It was chosen over Polyphemus because its recording is clean: Halfworld's voice manifest cuts the recording into seven
    segments, and each speaks the drive script's sentence for it, a narrator throughout. The Cyclops scenes' dialogue segments speak
    the scene's summary in the first person instead of a line ("I promise: Nobody the last death as a guest-gift, and collapses"), and
    only one dialogue segment in the whole manifest is close to the line Halfworld authored for it.</p>
  {envelope_svg(voice)}
  <div class="tablewrap"><table>
    <tr><th class="n">Segment</th><th class="n">Starts (s)</th><th class="n">Lasts (s)</th><th>Kind</th><th>What the recording says</th></tr>
    {segs}
  </table></div>
  <p class="sub">So what the voice says is set as it is said: <code>project.BxVoice</code> reads the envelope and the segments at
    <code>$T</code>, and a TEXT node types each sentence word by word across the bottom of the frame. Homer's line is not in the
    recording. The Sirens' song, as Halfworld wrote it for this scene (spoken-lines, turn T04), is the Poem Field: it goes out from
    the Sirens' mouths as rings of words while the narrator says "The Sirens promise total knowledge", and it is silent. The crew
    have wax in their ears; the audience, like Odysseus, is the one who takes it in.</p>
  <blockquote class="song">{E(song or homer)}</blockquote>''')

    # the three looks
    out.append(f'''  <h2 id="looks">One frame, three looks</h2>
  <p class="sub">The key frame, {media["keySeconds"]} s: the Sirens promise, the song in the field, his face inset. The same mosaic, the
    camera node's <code>mode</code> changed: Knowlton's cells, Halfworld's halftone (its post-pass ported: black dots on warm paper, one
    a cell, after the ink law's floor and S-curve), and the LEGO mosaic (144 x 96 studs of 1 x 1 round tiles).</p>
  <div class="looks">
    <figure><img src="media/beflix-cells.png" alt="The key frame as BEFLIX cells: square grey levels on a grid" loading="lazy"><figcaption>cells: the 1963 grain</figcaption></figure>
    <figure><img src="media/beflix-halftone.png" alt="The key frame as Halfworld halftone: black dots on paper" loading="lazy"><figcaption>halftone: Halfworld's print</figcaption></figure>
    <figure><img src="media/beflix-lego.jpg" alt="The key frame as LEGO round tiles in white, tan, greys and black" loading="lazy"><figcaption>lego: round tiles on baseplates</figcaption></figure>
  </div>
  <p class="facts">And a print: <a href="media/beflix.svg">media/beflix.svg</a> ({media["svgKB"]:,} KB), the key frame's halftone as
    vectors, one disc per inked cell, written by the graph's <code>project.BxPrint</code>.</p>''')

    # the player
    out.append(f'''  <h2 id="player">The machine, live</h2>
  <p class="sub">The graph's static player (<code>cascade build</code>, {kb(player)}, of which the baked plates are {kb(plates)} and the
    voice envelope {kb(os.path.getsize(os.path.join(CAS, "assets/beflix/voice.json")))}), with the recording as its clock: press Play and
    the frame shown is the sound's time (the player cooks the newest frame asked for and skips the rest, so the picture keeps the
    voice's time). Change the look, the LEGO resolution and colours, the ink; the parts count follows every frame.</p>
  <iframe class="player" src="players/beflix.html" title="BEFLIX in Cascade: the live player" loading="lazy"></iframe>''')

    # LEGO
    tiles = ''.join(f'<tr><td><span class="sw" style="background:{ {15: "#f4f4f4", 19: "#d7ba8c", 71: "#969696", 28: "#897d62", 72: "#646464", 0: "#1b2a34"}.get(t["color"], "#888") }"></span>{E(t["colorName"])}</td><td>98138, 1 x 1 round tile</td><td class="n">{t["n"]:,}</td></tr>' for t in key['tiles'])
    out.append(f'''  <h2 id="lego">Every frame is a LEGO mosaic</h2>
  <p class="sub"><code>project.BxLego</code> resamples the mosaic to a grid of studs, prints each stud's mean darkness through
    Halfworld's ink law, and maps the eight ink levels to LEGO colours that fall in the same order of lightness, paper to ink: White,
    Tan, Light Bluish Grey, Dark Tan, Dark Bluish Grey, Black. One 1 x 1 round tile on every stud, 48 x 48 baseplates beneath, as the
    LEGO Art mosaics are built. Offline, <code>tools/beflix_kit.py</code> writes the grid as an LDraw model with the line's kitlib and
    checks it: every part on the grid, none loose, none in the same space as another.</p>
  <div class="two">
    <figure class="kitfig"><img src="{"kit/cascade.beflix-key.jpg" if render else "kit/cascade.beflix-key-plan.png"}" alt="The key frame built in LEGO: six baseplates of round tiles" loading="lazy">
      <figcaption>The key frame built: <a href="kit/cascade.beflix-key.mpd">kit/cascade.beflix-key.mpd</a>, {key["studs"][0]} x {key["studs"][1]} studs,
      {key["pieces"]:,} pieces, {key["loose"]} loose, {key["clash"]} clashes (kitlib.check){", rendered by tools/forage/look.js" if render else ""}.</figcaption></figure>
    <div><table class="parts"><tr><th>Colour</th><th>Part</th><th class="n">Pieces</th></tr>{tiles}
      <tr><td>Light Bluish Grey</td><td>4186, 48 x 48 baseplate</td><td class="n">{key["plates"]}</td></tr>
      <tr><td><b>Total</b></td><td></td><td class="n"><b>{key["pieces"]:,}</b></td></tr></table>
      <p class="facts">At the player's other resolutions the same frame is 48 x 32 studs on one baseplate, 96 x 64 on four, or the whole mosaic,
      252 x 184, one tile a cell: 46,368 tiles on 24 baseplates.</p></div>
  </div>
  <h3 style="margin-top:28px">The flip-book: a film strip in LEGO</h3>
  <p class="sub">Twelve moments of the film, each a 48 x 34 mosaic on its own 48 x 48 baseplate between black film edges with
    sprocket holes, the twelve plates side by side: <a href="kit/cascade.beflix-flipbook.mpd">kit/cascade.beflix-flipbook.mpd</a>,
    {flip["pieces"]:,} pieces ({flip["tileCount"]:,} round tiles, {flip["plates"]} baseplates), {flip["loose"]} loose, {flip["clash"]} clashes.
    Frames at {", ".join(f'{f["t"]:.1f}' for f in flip["frames"])} s.</p>
  <figure class="kitfig"><img src="{"kit/cascade.beflix-flipbook.jpg" if frender else "kit/cascade.beflix-flipbook-plan.png"}" alt="Twelve frames of the film as LEGO mosaics on a strip of baseplates with sprocket holes" loading="lazy">
    <figcaption>{"Rendered by tools/forage/look.js." if frender else "Plan, from above, drawn from the LDraw file in two rows of six plates (tools/beflix_plan.py)."}</figcaption></figure>''')

    # operators
    cards = ''.join(f'<figure><img src="media/beflix-op-{k}.png" alt="{E(name)} applied to Odysseus close, in BEFLIX cells" loading="lazy">'
                    f'<figcaption><b>{E(name)}</b> · <code>{E(mod)}</code><br>{E(text)}</figcaption></figure>' for k, name, mod, text in OPS)
    out.append(f'''  <h2 id="operators">Knowlton's operations, one node each</h2>
  <p class="sub">Each picture is that node alone applied to the same Halfworld plate (Odysseus close, straining) and photographed in the
    cells look, cooked by Cascade (<code>tools/beflix_ops.mjs</code>). The mosaic travels on the wires as a project type,
    <code>project.mosaic</code>: width, height and one byte a cell. Every node makes a new one; nothing is changed in place.</p>
  <div class="ops">{cards}</div>
  <p class="facts">Also in the graph: <code>project.BxMosaic</code> (a fresh frame), <code>project.BxVoice</code> (the recording as data:
    amplitude, seconds voiced so far, the line and its progress), <code>project.BxLego</code>, <code>project.BxCamera</code> and
    <code>project.BxPrint</code>. The edit is expressions on <code>$T</code> and one keyframe channel; the voice reaches the operators
    through wires into their <code>drive</code> inputs.</p>''')

    # lineage
    out.append('''  <h2 id="lineage">Where this comes from</h2>
  <p class="sub">Knowlton wrote BEFLIX in 1963 to make <i>A Computer Technique for the Production of Animated Movies</i>, a film that
    explains itself; the mosaic was photographed from a Stromberg-Carlson 4020 microfilm recorder, so a film was only ever a grid of
    numbers and a program. From 1964 to 1967 he and the filmmaker Stan VanDerBeek made the <i>Poem Fields</i> with it: words moving
    through fields of pattern, coloured afterwards on film. Halfworld, the Odyssey's procedural atlas, says in its methods paper that
    it is the same machine with three substitutions: the cell grid became a halftone lattice, the ink level became continuous
    darkness, and the operations became the canvas calls of four hundred asset programs; its engine still carries an eight-step
    quantizer, <code>inkLevel(l)</code>, as a homage. This graph turns the substitution back: Halfworld's programs are run, and what
    they draw is quantized with that same function to Knowlton's 252 by 184 by eight levels, then worked by his operations. LEGO Art
    closes the loop from the other side: its mosaics are grids of 1 x 1 round tiles in a few colours, which is to say a BEFLIX frame you
    press into a baseplate.</p>''')

    # critic and limits
    meas = ', '.join(f'{k} {v:,}' for k, v in cr.items() if k not in ('ask', 'ok'))
    out.append(f'''  <h2 id="critic">The critic</h2>
  <p class="sub"><code>tools/verify.mjs</code> cooks the graph headless (static check, {vb["run"]["files"]} frames across the film, all
    distinct) and asks: {E(cr["ask"])} Answer: <b>{"yes" if cr["ok"] else "no"}</b> ({E(meas)}). Run {E(verify["ran"][:16].replace("T", " "))} UTC,
    with the five other graphs of the project; <a href="verify.json">verify.json</a>.</p>
  <h2 id="limits">What Cascade could not do</h2>
  <ul class="plain limits">
    <li><b>Many instances of one node race.</b> Cascade 0.7.1's command line compiles a project node once per instance into one cache
      file, concurrently; this graph holds six plates, five dissolves and five texts, and most runs failed with "does not export
      execute". <code>tools/cascade.mjs</code> launches the same CLI with that one function serialized as it loads (nothing in
      node_modules is changed); every run since has succeeded first time.</li>
    <li><b>No cache across frames.</b> A node may not keep module state, so each plate parses its baked layer at every frame (the
      plates are split one file a layer to keep that small). In the browser a frame cooks in about a quarter of a second, so the player
      plays at the sound's time by skipping frames rather than showing all 24 a second.</li>
    <li><b>The player has no sound.</b> Nothing in a graph can play audio, so the page plays the recording and drives the player's
      <code>seek</code> from it.</li>
    <li><b>Skia draws many small arcs slowly.</b> One path of five thousand dots took three seconds headless, so the camera draws into
      a pixel buffer: a dot of each ink level computed once a frame and stamped on every cell that holds it.</li>
    <li><b>Only images come out of a frame sequence.</b> The LEGO grids and the SVG print are assets the CLI writes into
      <code>.cascade-cache/</code> under a hash, found by a second, whole-graph run; naming a node narrows the cook to its inputs.</li>
    <li><b>Keyframe channels are scalar, and inputs take no expressions.</b> The shore's pan is one channel and the Sirens follow it
      by <code>ch("island/pan")</code>; a point that moves is an expression returning <code>[x, y]</code>; every value the voice drives
      comes in on a <code>drive</code> input beside a prop, since a wire and an expression cannot share a port.</li>
    <li><b>No shaded 3D.</b> The LEGO look in the player is drawn by the camera node from above; the built model is rendered by the
      line's own three.js renderer.</li>
  </ul>
  <h2>The files</h2>
  <ul class="links">
    <li><code>beflix.cascade</code>: the graph (''' + str(len(nodes)) + ''' nodes)</li>
    <li><code>nodes/</code>: ''' + ', '.join(E(b.replace('project.', '')) for b in bx) + '''</li>
    <li><code>lib/mosaic.ts</code>, <code>lib/camera.ts</code>: the mosaic, the font, the ink law, the LEGO colours; the three looks</li>
    <li><code>assets/beflix/</code>: the baked plates and the voice (<code>tools/bake_halfworld.mjs</code>, <code>tools/bake_voice.mjs</code>)</li>
    <li><code>tools/beflix_film.mjs</code>, <code>beflix_ops.mjs</code>, <code>beflix_kit.py</code>, <code>beflix_plan.py</code>, <code>cascade.mjs</code></li>
    <li><a href="players/beflix.html">players/beflix.html</a> (the player page) and <code>players/beflix/</code> (cascade build)</li>
    <li><a href="index.html">The Odyssey in Cascade</a> · <a href="../kits/index.html">the Odyssey line</a></li>
  </ul>
  <footer>Made by <code>tools/forage/product/beflixpage.py</code>; every number read from the project when it ran.</footer>
</main>
<script>
for (const f of document.querySelectorAll('iframe.player')) {
  const fit = () => { try { const h = f.contentDocument && f.contentDocument.documentElement.scrollHeight; if (h > 200) f.style.height = h + 'px'; } catch (e) {} };
  f.addEventListener('load', () => { fit(); setTimeout(fit, 800); setTimeout(fit, 3000); });
  addEventListener('resize', fit);
}
</script>
</body>
</html>''')
    open(os.path.join(CAS, 'beflix.html'), 'w').write('\n'.join(out) + '\n')
    print('odyssey/cascade/beflix.html', os.path.getsize(os.path.join(CAS, 'beflix.html')), 'bytes')


if __name__ == '__main__':
    main()
