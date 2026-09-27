#!/usr/bin/env python3
"""tools/forage/product/shoot.py — re-shoot a kit's pictures from its recorded cameras, so a fix to a build is one command from its page.

  python3 tools/forage/product/shoot.py <slug> [file ...]       (default: every shot in odyssey/kits/<slug>/shots.json)

shots.json is a list of {file, card, w, h, az, el, zoom, at?, studio?}: the studio camera of tools/forage/look.js (az and el in degrees,
zoom, at an LDraw point to aim at, studio 'dark' by default). Each shot is rendered one at a time (renders of thousands of parts are slow
and the CPUs are shared) and saved into odyssey/kits/<slug>/<file> at JPEG quality 80. Needs the http server on :8899 and NODE_PATH with
playwright and three (see kitlib's docstring).
"""
import json, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
NODE_PATH = os.environ.get('NODE_PATH') or '/tmp/claude-0/-home-user/4aa29a79-b8f5-55cd-b69e-84f439d17223/scratchpad/nm/node_modules'


def shoot(slug, only=()):
    kit = os.path.join(ROOT, 'odyssey/kits', slug)
    for s in json.load(open(os.path.join(kit, 'shots.json'))):
        if only and s['file'] not in only: continue
        tmp = tempfile.mkdtemp(prefix='shoot-')
        cmd = ['node', os.path.join(ROOT, 'tools/forage/look.js'), '--out', tmp, '--w', str(s.get('w', 1600)), '--h', str(s.get('h', 1100)), '--jpeg',
               '--studio', s.get('studio', 'dark'), '--az', str(s['az']), '--el', str(s['el']), '--zoom', str(s['zoom'])]
        if s.get('at'): cmd += ['--at', ','.join(str(v) for v in s['at'])]
        r = subprocess.run(cmd + [s['card']], cwd=ROOT, env=dict(os.environ, NODE_PATH=NODE_PATH), capture_output=True, text=True, timeout=1200)
        src = os.path.join(tmp, s['card'] + '.jpg')
        if not os.path.exists(src): print(s['file'], 'FAILED', r.stdout.strip()[-200:], r.stderr.strip()[-200:]); continue
        from PIL import Image
        Image.open(src).save(os.path.join(kit, s['file']), quality=80)
        print(s['file'], 'from', s['card'], r.stdout.strip().split('\n')[-1])


if __name__ == '__main__':
    shoot(sys.argv[1], set(sys.argv[2:]))
