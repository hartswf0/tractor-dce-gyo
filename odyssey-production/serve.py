#!/usr/bin/env python3
"""Local, deterministic native-render capture. No remote writes or publishing."""
import argparse, json, re, subprocess
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent
WORK = ROOT.parent.parent / 'work'
parser = argparse.ArgumentParser()
parser.add_argument('--halfworld', default=str(ROOT / 'halfworld'))
parser.add_argument('--native', default=str(ROOT / 'native'))
parser.add_argument('--port', type=int, default=8917)
args = parser.parse_args()
MOUNTS = {'/films/': ROOT / 'films', '/native/': Path(args.native), '/halfworld/': Path(args.halfworld), '/': ROOT}
class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = unquote(urlsplit(path).path)
        for prefix, base in MOUNTS.items():
            if p.startswith(prefix):
                dest = (base / p[len(prefix):]).resolve()
                if not dest.is_relative_to(base.resolve()): return str(ROOT / '__denied__')
                return str(dest)
    def log_message(self, fmt, *values):
        if values and ('404' in str(values) or '500' in str(values)): print(fmt % values, flush=True)
    def do_POST(self):
        p = urlsplit(self.path).path
        if m := re.fullmatch(r'/capture/([a-z][a-z0-9-]+)/([0-9]{5})', p):
            folder = WORK / ('frames-' + m[1]); folder.mkdir(parents=True,exist_ok=True)
            (folder / (m[2] + '.jpg')).write_bytes(self.rfile.read(int(self.headers['Content-Length'])))
            self.send_response(200); self.end_headers(); self.wfile.write(b'ok'); return
        if m := re.fullmatch(r'/evidence/([A-Za-z0-9_.-]+)\.(png|json)', p):
            folder = ROOT / 'evidence'; folder.mkdir(parents=True,exist_ok=True)
            (folder / (m[1]+'.'+m[2])).write_bytes(self.rfile.read(int(self.headers['Content-Length'])))
            self.send_response(200); self.end_headers(); self.wfile.write(b'ok'); return
        self.send_error(404)

print(f'Native render workbench: http://127.0.0.1:{args.port}/render.html', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
