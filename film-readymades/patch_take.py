"""Swap the take runtime (odyssey-take.js) in the built player without rebuilding the 31 locations: for iterating on take mode.
python patch_take.py [--level 6]"""
from pathlib import Path
import gzip, sys, re
R = Path(__file__).parent; f = R / 'production/Film-Butter-Odyssey.html.gz'
s = gzip.decompress(f.read_bytes()).decode()
a, b = s.index('/*[odyssey-take]*/'), s.index('/*[/odyssey-take]*/')
s = s[:a] + '/*[odyssey-take]*/' + (R / 'odyssey-take.js').read_text() + s[b:]
lvl = int(sys.argv[sys.argv.index('--level') + 1]) if '--level' in sys.argv else 9
f.write_bytes(gzip.compress(s.encode(), lvl)); print('patched', f, round(f.stat().st_size / 1e6, 1), 'MB')
