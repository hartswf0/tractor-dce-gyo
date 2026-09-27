#!/usr/bin/env python3
"""tools/forage/product/integration.py — what is left on the table: the three Odyssey film stacks that do not yet talk, and the joins
that make them one film. Writes odyssey/kits/integration.html (the hub links it). The rows are kept here, by hand, as the plan; the
status of each join is updated as it is made.

  python3 tools/forage/product/integration.py
"""
import html, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kitpages import STYLE, HEAD, KITS

E = html.escape

STACKS = [
    ('Film Butter', 'this line\'s film', 'The finished sets (sets.js, finish.py, the kits\' standard), the blocking, 31 scenes of gate-checked keyframes, '
     'the light rig. Silent: stills only, never exported as video; its sound field is empty and its heads are static prints.',
     'film-readymades/build_odyssey.py, odyssey-runtime.js, keyframes.cjs, odyssey/keyframes/'),
    ('The cinerium', 'world/*.js', 'Everything a performance needs: halfworld faces on minifig heads, lip sync, a named pose library, the sound engine '
     '(beds, ducking, cues), sky and weather (sun position, storm, rain, fog, lightning), real terrain at real places, camera moves, and an mp4 '
     'exporter. It has made voiced Odyssey films, but on borrowed sets, not these.',
     'world/face.js, cinerium.js, sound.js, sky.js, geo.js, film.js, tools/export-film.js, films/'),
    ('Halfworld', 'the film\'s source', 'The clock: 152 studio recordings timed to the segment, the voice cast, 706 spoken lines with who speaks to '
     'whom, the key-beat emotions, the cutting grammar, the music and its mix law. The Regulars\' Cut is written on it.',
     'drive/voice-manifest.json, viewer/spoken-lines.json, performance-turns.json, engine/speech.mjs, _direction.mjs, audio/'),
]

# (join, from, into, what it unlocks, status)
JOINS = [
    ('The voice as the clock', 'Halfworld recordings + the Regulars\' Cut (cut.json)', 'Film Butter scene entries (sound, segments, captions)',
     'The film runs on its own performance: every key, cut and pose sits at a time on the recording, not an invented one.', 'building (OD-B01-S03)'),
    ('An Odyssey export', 'tools/export-film.js (frame-stepped, sound muxed)', 'Film Butter in take mode',
     'The first voiced LEGO Odyssey scenes as mp4, then the whole cut.', 'building (OD-B01-S03)'),
    ('Faces on the heads', 'world/faces/odyssey decals, odyssey-decals.js (24 cast)', 'Movieator heads in build_odyssey production()',
     'The halfworld\'s drawn faces on the minifigures, the same faces as the halftone film.', 'building (OD-B01-S03)'),
    ('Lip sync and the listening face', 'engine/speech.mjs, world/face.js', 'The speaking actor and the addressee in a take',
     'Mouths that say the recorded words; listeners who nod, press their lips, stop blinking when it is loud.', 'building (OD-B01-S03)'),
    ('Cutting', 'syncwatch SHOT, RHYTHM, GRAMMAR, INSERTS', 'Film Butter cameras (the gate-approved marks)',
     'Coverage that cuts on the speaker and the reaction, faster in the monster books, slower on Ogygia; inserts on the bow, the scar, the stake.', 'building (OD-B01-S03)'),
    ('Music and mix', 'Halfworld albums (track = book), build-film-audio mix law, world/sound.js', 'The take\'s sound',
     'The book\'s bed under the voice, ducked from 0.18 to 0.10 while anyone speaks.', 'building (OD-B01-S03)'),
    ('Named acting', 'world/cinerium.js PHRASES, figure-hero POSES, liveness.mjs', 'The 453 raw-radian poses in odyssey/keyframes',
     'Keys written as "pointing", "grief", "offering hand" instead of angles; idle breath between keys.', 'next'),
    ('Sky, weather and time of day', 'world/sky.js, lamps.js (and paintsky, grade on an unmerged branch)', 'kfLook / kfLight',
     'The storm at sea with rain and lightning, dawn on the beach, the hall by firelight, the night of the blinding.', 'next'),
    ('Real places', 'world/geo.js, ground.js; the rehearsals at Voidokilia, Vathy, Culbin, Ait Benhaddou', 'Backdrops, horizons and sun direction',
     'Each set\'s horizon and sun from the real place it was scouted against.', 'next'),
    ('The kits, landscape and wardrobe in the film', 'tools/forage/product (kits, landscape.py, wardrobe.py)', 'Scene cards and the cast',
     'The kits\' sets and the Bronze Age costumes on screen; today they stand beside the film.', 'partly (landscape in finish.py)'),
]

BRANCHES = [('origin/claude/studio-prompt-context-docs-gxy52t', 'neural voices (Kokoro), full sound mixes, a painted sky, per-shot grade, stills export'),
            ('origin/rover/camera-first-odyssey', 'a performance compiler: why, direction, action, body, carriage, face, speech'),
            ('origin/codex/director-composer', 'a director\'s composer for camera moves')]


def page():
    out = [HEAD.format(title='Left on the Table', style=STYLE)]
    out.append('''  <div class="kicker"><a href="index.html">The Odyssey Line</a> · the integration map</div>
  <h1>Left on the table</h1>
  <p class="lede">Many experiments in these repositories have pushed toward one film: recorded voices, drawn faces, acting, staging,
    sound, real places, weather and light. Most of what they learned has never reached the film. Three stacks each hold part of it, and
    none of them talks to the others. This is the map of the joins that make them one film, and where each stands.</p>''')
    out.append('  <h2>Three stacks</h2>\n  <div class="grid">')
    for name, tag, what, files in STACKS:
        out.append(f'    <div class="card" style="padding:16px"><div class="meta"><b>{E(tag)}</b></div><h3>{E(name)}</h3><p>{E(what)}</p><p><code>{E(files)}</code></p></div>')
    out.append('  </div>')
    out.append('''  <figure style="margin:28px 0"><svg viewBox="0 0 900 200" width="100%" role="img" aria-label="Halfworld feeds the clock and the performance, the cinerium brings the machinery, Film Butter brings the sets and blocking; together they make the film">
    <style>.b{fill:var(--card);stroke:var(--ink);stroke-width:2}.t{font:600 15px Inter,sans-serif;fill:var(--ink)}.s{font:12px Inter,sans-serif;fill:var(--muted)}.a{stroke:var(--blue);stroke-width:2.5;fill:none;marker-end:url(#h)}.f{fill:var(--ink)}.ft{font:700 16px Inter,sans-serif;fill:var(--paper)}</style>
    <defs><marker id="h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--blue)"/></marker></defs>
    <rect class="b" x="10" y="20" width="230" height="64"/><text class="t" x="24" y="46">Halfworld</text><text class="s" x="24" y="68">clock, lines, faces, cutting, music</text>
    <rect class="b" x="10" y="116" width="230" height="64"/><text class="t" x="24" y="142">The cinerium</text><text class="s" x="24" y="164">face, sound, sky, geo, export</text>
    <rect class="b" x="330" y="68" width="230" height="64"/><text class="t" x="344" y="94">Film Butter</text><text class="s" x="344" y="116">sets, blocking, keyframes, light</text>
    <rect class="f" x="650" y="68" width="240" height="64"/><text class="ft" x="668" y="97">The film, voiced</text><text class="ft" x="668" y="119" style="font-weight:400;font-size:13px">mp4, the Regulars' Cut</text>
    <path class="a" d="M240 52 C290 52 290 90 328 92"/><path class="a" d="M240 148 C290 148 290 110 328 108"/><path class="a" d="M560 100 L648 100"/>
  </svg><figcaption>What each brings. Today only the middle box makes anything for this line, and it makes stills.</figcaption></figure>''')
    out.append('  <h2>The joins</h2>\n  <div class="tablewrap"><table>\n    <tr><th>#</th><th>Join</th><th>From</th><th>Into</th><th>What it unlocks</th><th>Where it stands</th></tr>')
    for n, (j, a, b, why, st) in enumerate(JOINS, 1):
        cls = 'ok' if st.startswith('done') else 'bad' if st == 'next' else ''
        out.append(f'    <tr><td class="n">{n}</td><td><b>{E(j)}</b></td><td>{E(a)}</td><td>{E(b)}</td><td>{E(why)}</td><td class="{cls}">{E(st)}</td></tr>')
    out.append('  </table></div>')
    out.append('''  <h2>The order</h2>
  <ol>
    <li><b>One scene through everything</b>, the opening at the gate (OD-B01-S03): voice clock, captions, faces and lip sync, cutting, the bed,
      exported as an mp4. It proves the joins 1 to 6 work together before they are spread.</li>
    <li><b>The 31 filmed scenes</b> the same way, then the <a href="cut.html">Regulars' Cut</a> as one film: its edit list already speaks the
      voice manifest's segment numbers.</li>
    <li><b>Named acting</b> in place of raw angles, so direction can be written in words and checked against the halfworld's key beats.</li>
    <li><b>Sky, weather and real places</b>: the storm, the night, the dawns, and each set's horizon from where it was scouted.</li>
    <li><b>The kits and the wardrobe on screen</b>: the sets and costumes this line built, in the film it came from.</li>
  </ol>''')
    out.append('  <h2>On other branches</h2>\n  <p class="sub">Work toward the same film that is not on this branch yet. Merging is a decision to make together.</p>\n  <ul>' +
               ''.join(f'<li><code>{E(b)}</code>: {E(w)}</li>' for b, w in BRANCHES) + '</ul>')
    out.append('  <footer>Made by <code>tools/forage/product/integration.py</code>. <a href="index.html">The Odyssey Line</a> · <a href="cut.html">The Regulars\' Cut</a> · <a href="locations.html">Locations</a></footer>\n</main>\n</body>\n</html>')
    open(os.path.join(KITS, 'integration.html'), 'w').write('\n'.join(out) + '\n')


if __name__ == '__main__':
    page(); print('wrote odyssey/kits/integration.html')
