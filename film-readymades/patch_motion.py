"""Embed (or refresh) the motion library (motion.js, window.OdysseyMotion) and the choreography player (choreo.js,
window.OdysseyChoreo) in the built player as their own classic scripts ahead of the take scripts, and refresh the trailer runtime (odyssey-trailer.js, with its [motion] hooks) beside it, without the 3-minute rebuild.
tools/export-trailer.js injects both working-tree files anyway; this is for the player as shipped, for take mode (whose [motion]
hooks live in odyssey-take.js: pass --take to refresh that too, as patch_take.py does) and for the hand game.
Note: build_odyssey.py does not know motion.js (it does embed choreo.js); after a rebuild, run this again.
python patch_motion.py [--take] [--level 9]"""
from pathlib import Path
import gzip, sys
R = Path(__file__).parent; f = R / 'production/Film-Butter-Odyssey.html.gz'
s = gzip.decompress(f.read_bytes()).decode()
js = (R / 'motion.js').read_text()
A, B = '<script data-odyssey-motion>', '</script><!--/odyssey-motion-->'
if A in s:
    a, b = s.index(A), s.index(B)
    s = s[:a] + A + js + s[b:]
else:
    anchor = '<script data-odyssey-take="halfworld-face.js">'
    assert anchor in s, 'the take scripts are not in the player: rebuild it (build_odyssey.py)'
    s = s.replace(anchor, A + js + B + anchor, 1)
# the choreography player (odyssey/choreo/<scene>.json, read by the take's [choreo] hooks), beside the motion library
cj = (R / 'choreo.js').read_text()
CA, CB = '<script data-odyssey-choreo>', '</script><!--/odyssey-choreo-->'
if CA in s:
    a, b = s.index(CA), s.index(CB)
    s = s[:a] + CA + cj + s[b:]
else:
    s = s.replace(B, B + CA + cj + CB, 1)
# the trailer runtime, between its markers (as patch_trailer.py does)
tr = (R / 'odyssey-trailer.js').read_text()
if '/*[odyssey-trailer]*/' in s:
    a, b = s.index('/*[odyssey-trailer]*/'), s.index('/*[/odyssey-trailer]*/')
    s = s[:a] + '/*[odyssey-trailer]*/' + tr + s[b:]
else:
    b = s.index('/*[/odyssey-take]*/') + len('/*[/odyssey-take]*/')
    s = s[:b] + '\n/*[odyssey-trailer]*/' + tr + '/*[/odyssey-trailer]*/' + s[b:]
if '--take' in sys.argv:
    a, b = s.index('/*[odyssey-take]*/'), s.index('/*[/odyssey-take]*/')
    s = s[:a] + '/*[odyssey-take]*/' + (R / 'odyssey-take.js').read_text() + s[b:]
lvl = int(sys.argv[sys.argv.index('--level') + 1]) if '--level' in sys.argv else 9
f.write_bytes(gzip.compress(s.encode(), lvl)); mb = f.stat().st_size / 1e6
print('patched', f, round(mb, 1), 'MB'); assert mb < 95, 'the player is over 95 MB'
