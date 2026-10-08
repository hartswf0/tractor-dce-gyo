"""Rebuild some locations of the built player in place, without the whole rebuild (build_odyssey.py builds all 61 in about eight
minutes): each named scene's entry is built again (build_odyssey.scene, its staging overlay and all), its geometry written beside the
player (geo_split), and its record in the player's ButterFilmData replaced; the rest of the player is left byte for byte as it was.
The cast's character entries are not touched: use this when a set changes and its cast does not (else rebuild).

python3 film-readymades/patch_locations.py OD-B21-S07 OD-B22-S01
Take the bundle lock as for a rebuild (tools/perform/README.md, Rebuilding the player).
"""
from pathlib import Path
import gzip, json, sys
import build_odyssey as B
import geo_split

R = Path(__file__).parent; OUT = R / 'production'; f = OUT / 'Film-Butter-Odyssey.html.gz'
ids = [a for a in sys.argv[1:] if not a.startswith('--')]
entries = [B.scene(sid)[0] for sid in ids]
print('geometry files written:', geo_split.split(entries, OUT))
s = gzip.decompress(f.read_bytes()).decode()
key, tail = 'window.ButterFilmData=', ';window.ButterAssemblyPlans='
a = s.index(key); b = s.index(tail, a)
films = json.loads(s[a + len(key):b]); byid = {e['id']: e for e in entries}
n = 0
for i, film in enumerate(films):
    if film.get('id') in byid: films[i] = byid[film['id']]; n += 1
if n != len(entries): raise SystemExit(f'patch_locations: {len(entries) - n} of the scenes are not in the player (rebuild it)')
s = s[:a] + key + json.dumps(films, separators=(',', ':')).replace('</', '<\\/') + s[b:]
f.write_bytes(gzip.compress(s.encode(), 9))
for e in entries: (OUT / (e['id'] + '.json')).write_text(json.dumps({k: v for k, v in e.items() if k not in ('geometry', 'sourceText')}, indent=1))
print('patched', n, 'locations;', f, round(f.stat().st_size / 1e6, 1), 'MB')
