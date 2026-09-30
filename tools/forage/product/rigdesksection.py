"""tools/forage/product/rigdesksection.py — the top section of odyssey/cascade/index.html, "Cascade on the film: the rig desk", written by
cascadepage.py from odyssey/cascade/media/rigdesk.json (tools/rig_report.mjs) and media/previz.json (tools/rig_previz.mjs)."""
import html, json, os

E = html.escape
RENDER_SPF = 5.5   # the film's renderer, tools/export-odyssey.js on swiftshader: about 5.5 s a frame (the production's own renders)
NAMES = {'OD-B01-S03': 'Athena at the gate', 'OD-B12-S03': 'The Sirens', 'OD-B22-S01': 'The first arrow'}
FIXES = [
    ('OD-B12-S03', 'rigfix-OD-B12-S03.jpg', 'The wax',
     'Sealing the crew\'s ears, Odysseus raised his hand overhead, beside his own head (19 units from it, 24 to 46 from the nearest '
     'crewman\'s ear). On the desk the right arm\'s generated layers are weighted out for the three seals and the arm, torso and heading '
     'are keyed to each ear; the crewmen step in and turn their heads to him. Hand to the crewman\'s ear at the three seals: 2.6, 1.6 '
     'and 2.3 units.'),
    ('OD-B01-S03', 'rigfix-OD-B01-S03.jpg', 'Athena\'s wait',
     'Her longest still stretch was 2.2 s at 9.25 s, a hold that did not breathe. On the desk the wait is a hold that breathes: torso, '
     'hips and head carry an expression (a 2.4 s breath faded in and out around the wait) and two keyed looks, to the house and to the '
     'road, with a re-grip of the spear. Longest still stretch on the rig now: 0.75 s.'),
    ('OD-B22-S01', 'rigfix-OD-B22-S01-throat.jpg', 'The hand to the throat',
     'Antinous\'s "hand to the throat" read as both arms flung up (the generated act layer over a raised cup arm). On the desk both arms\' '
     'generated layers are weighted out from the arrow to the fall; the left hand is keyed up to the chin (a minifigure cannot reach its '
     'own throat: 19 units is as near as the joints allow), the cup arm drops, the head snaps back.'),
    ('OD-B22-S01', 'rigfix-OD-B22-S01-bow.jpg', 'The bow in the accusation',
     'The bow in Odysseus\'s left hand, held level at the shoulder, crossed his face in the accusation close-ups. The left arm is keyed '
     'down under the lines, further where his speaking gestures lift it. Drawings from 38 s with the bow in front of his face, measured '
     'on the rig through the film\'s cameras: none.'),
]


def section(cas):
    R = json.load(open(os.path.join(cas, 'media/rigdesk.json')))
    P = json.load(open(os.path.join(cas, 'media/previz.json')))
    full = {k[7:]: v for k, v in P.items() if k.startswith('previz-')}
    frames = sum(v['frames'] for v in full.values()) or 1
    spf = sum(v['cookSeconds'] for v in full.values()) / frames
    cooks = [v['cookSeconds'] for v in full.values()] or [0]
    rows = []
    for sid, v in R['scenes'].items():
        pv = full.get(sid, {})
        page = v.get('pageBeforeDesk') or {}
        rows.append(
            f'<tr><td>{sid}<br><span class="dim">{E(NAMES.get(sid, ""))}</span></td><td>{pv.get("frames", "")}</td>'
            f'<td>{pv.get("cookSeconds", "")} s</td><td>about {round(pv.get("frames", 0) * RENDER_SPF / 60)} min</td>'
            f'<td>{"yes" if v["roundTripNoOp"] and v["sheetInStep"] else "no"}</td>'
            f'<td>{round(v["rigBare"]["mean"] * 100)}% / {round(page.get("mean", 0) * 100)}% / {round(v["rigDirector"]["mean"] * 100)}%</td>'
            f'<td>{max(v["densityMs"])} ms</td></tr>')
    vids = ''.join(
        f'    <figure><video src="media/previz-{sid}.mp4" poster="media/previz-{sid}.jpg" controls playsinline preload="none"></video>'
        f'<figcaption>{sid}, {E(n)}: <a href="media/previz-{sid}.mp4">the previz</a> with the film\'s sound, '
        f'<a href="rig-{sid}.cascade">the rig graph</a></figcaption></figure>\n' for sid, n in NAMES.items())
    figs = ''.join(
        f'    <figure class="wide"><img src="media/{img}" alt="{E(t)}: the acted film, the rig with the choreographer\'s pass, the rig with the director\'s keys" loading="lazy">'
        f'<figcaption><b>{E(t)}</b> ({sid}). {E(txt)}</figcaption></figure>\n' for sid, img, t, txt in FIXES)
    return f'''  <h2 id="rigdesk">Cascade on the film: the rig desk</h2>
  <div class="stone">
    <p class="sub">The film's characters are practical rigs programmed like animatronics: a choreography sheet
      (<code>odyssey/choreo/&lt;scene&gt;.json</code>) keys every servo of every figure on the voice's clock. Until now the sheet was
      written by a script and could only be changed as raw <code>overrides</code> in JSON, and the only way to see a change was the full
      render: about {RENDER_SPF} s a frame, 40 to 60 minutes a scene, after a page load of 10 to 14 minutes. The rig desk makes Cascade the
      place where that choreography is programmed. Each scene is a graph: one Subnet per actor holding a <code>project.MinifigRig</code>
      (forward kinematics on the film's own skeleton: the take's blocking, the choreographer's layers, and the take's performance layer
      baked from the page, so the rig lands on the page's poses), the voice as a track, the set's pieces and floor marks, and the acted
      film's shot camera as keyed props into a <code>cascade.core.Camera</code>. The director's layer is the rig's own props, an offset
      per servo and a weight per body part on the generated layers, set as keyframe channels in Studio's Inspector and Timeline, or as
      expressions where the motion is procedural (a breath).</p>
    <ol class="loop">
      <li><b>Open</b> the scene in Studio and key the rig against the voice.</li>
      <li><b>Preview</b> headless, the whole scene through the film's cameras with its sound: {1 / spf:.1f} frames a second
        ({spf:.2f} s a frame, {min(cooks):.0f} to {max(cooks):.0f} s a scene) against about {RENDER_SPF} s a frame for the film,
        about {RENDER_SPF / spf:.0f} times faster.</li>
      <li><b>Export</b>: the director's props, resolved at every drawing by Cascade's own channel and expression code, become the
        sheet's <code>overrides</code>, which the choreographer keeps and the film's renderer plays.</li>
      <li><b>Render</b> with the real renderer; <code>--from</code> and <code>--to</code> re-shoot just the span that changed.</li>
    </ol>
    <div class="tablewrap"><table>
      <tr><th>Scene</th><th>Frames</th><th>Previz cook</th><th>Film render</th><th>Import, export: no-op</th><th>Moving drawings: rig / page / with the director's keys</th><th>Rig density</th></tr>
      {"".join(rows)}
    </table></div>
    <p class="facts">Acting density (the share of drawings in which a figure in frame visibly moves) is raw data here, not a target:
      stillness can be the strongest part of a performance. From the rig it takes under half a second a scene, against about 15
      minutes in the page, and agrees with the page's measure to a point or two.</p>
    <div class="outs">
{vids}    </div>
    <h3>The director's keys for three defects</h3>
    <p class="sub">Keyed in the graphs, previewed headless, exported into the sheets' overrides. Each picture: the acted film as it is, the
      rig with the choreographer's pass, the rig with the director's keys. The films have not been re-rendered; the next render of each
      scene plays these overrides.</p>
    <div class="outs">
{figs}    </div>
    <h3>Run it on your machine</h3>
    <pre><code>cd odyssey/cascade && npm install
npx cascade rig-OD-B12-S03.cascade        # Studio: open an actor's Subnet, select its Minifig Rig, key it
node tools/rig_previz.mjs OD-B12-S03       # the scene headless, film cameras and sound
node tools/rig_density.mjs OD-B12-S03 --compare
node tools/rig_export.mjs OD-B12-S03       # into odyssey/choreo/OD-B12-S03.json overrides
cd ../.. && node tools/export-odyssey.js OD-B12-S03 --mode cut --fps 12 --suffix acted --from 9 --to 17</code></pre>
    <p class="facts">A scene's score and measurements attach at <code>assets/rig/&lt;scene&gt;/score.json</code> (format odyssey-score/0:
      envelope, event, span and metric lanes on the take's clock), shown by <code>project.ScoreLanes</code> as rows under the previz;
      the voice and its words are there now, and <code>tools/rig_density.mjs --score</code> adds each figure's motion as a metric.
      What Cascade could not do: a keyframe channel holds one number, so a camera position is three props; node inputs cannot hold
      keys, so the camera's keys live on <code>project.ShotCam</code>; there is no shaded 3D render, so the previz is boxes drawn by a
      project node; the headless runner saves only images, so export and density read the graph with Cascade's own PropAnimator
      beside the cook; and the film's hero cameras follow a figure the director moves, while the previz keeps the take's camera as
      recorded.</p>
  </div>
'''
