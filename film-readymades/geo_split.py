"""The player's geometry beside it, not inside it: each location's baked triangles as production/geo/<id>.json.gz.

Embedded, every location's geometry rode in the player as base64 of gzip (incompressible again, a third larger), and the
player passed the 95 MB the repository holds a file to at 38 locations. Beside it, the player is small, a location's
geometry is fetched when the location loads, and a rebuild that leaves a location unchanged leaves its file byte for byte
the same (gzip without a timestamp), so git stores only the locations that changed.

build_odyssey.py calls split() on its entries and patch_loader() on the page. Run on its own, this migrates the built
player in place: python3 film-readymades/geo_split.py [production-dir]
"""
from pathlib import Path
import base64, gzip, json, sys

LOADER_OLD = ("const bytes=Uint8Array.from(atob(f.geometry),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream()"
              ".pipeThrough(new DecompressionStream('gzip'));const defs=JSON.parse(await new Response(stream).text());")
# a fetched file is gzip as stored; a server that decoded it on the way (Content-Encoding) hands back the JSON itself
LOADER_NEW = ("const bytes=f.geometryUrl?new Uint8Array(await fetch(f.geometryUrl).then(r=>{if(!r.ok)throw Error('geometry '+f.geometryUrl+' '+r.status);return r.arrayBuffer();}))"
              ":Uint8Array.from(atob(f.geometry),c=>c.charCodeAt(0));const gz=bytes[0]===31&&bytes[1]===139;"
              "const defs=JSON.parse(gz?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text():new TextDecoder().decode(bytes));")


def patch_loader(s):
    """The player's filmGeometry reads f.geometryUrl when a location has one, the embedded f.geometry otherwise."""
    if LOADER_NEW in s: return s
    if s.count(LOADER_OLD) != 1: raise SystemExit('geo_split: the player\'s geometry loader was not found once; not patched')
    return s.replace(LOADER_OLD, LOADER_NEW, 1)


def split(films, out):
    """Each film with embedded geometry: its geometry to out/geo/<id>.json.gz (rewritten only when it changed), geometryUrl set."""
    geo = Path(out) / 'geo'; geo.mkdir(exist_ok=True)
    wrote = 0
    for f in films:
        if not f.get('geometry'): continue
        data = gzip.compress(gzip.decompress(base64.b64decode(f['geometry'])), 9, mtime=0)
        p = geo / (f['id'] + '.json.gz')
        if not p.exists() or p.read_bytes() != data: p.write_bytes(data); wrote += 1
        f['geometryUrl'] = 'geo/' + f['id'] + '.json.gz'; f['geometry'] = ''
    return wrote


def migrate(out):
    path = Path(out) / 'Film-Butter-Odyssey.html.gz'
    s = gzip.decompress(path.read_bytes()).decode()
    key, tail = 'window.ButterFilmData=', ';window.ButterAssemblyPlans='
    start = s.index(key); end = s.index(tail, start)
    films = json.loads(s[start + len(key):end])
    wrote = split(films, out)
    s = s[:start] + key + json.dumps(films, separators=(',', ':')).replace('</', '<\\/') + s[end:]
    s = patch_loader(s)
    path.write_bytes(gzip.compress(s.encode(), 9))
    print('geo_split:', wrote, 'geometry files written,', sum(1 for f in films if f.get('geometryUrl')), 'locations by url; player',
          round(path.stat().st_size / 1e6, 1), 'MB gzipped')


if __name__ == '__main__':
    migrate(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).parent / 'production')
