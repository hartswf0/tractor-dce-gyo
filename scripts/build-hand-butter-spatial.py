#!/usr/bin/env python3
"""Embed spatial source modules in the standalone downloadable Butter demo."""
from pathlib import Path
root = Path(__file__).resolve().parents[1]
page = root / 'WAG-HAND-BUTTER.HTML'
text = page.read_text()
start = '<!-- BUTTER SPATIAL MODULES START -->'
end = '<!-- BUTTER SPATIAL MODULES END -->'
blocks = [start, '<style>', (root/'src/hand-butter/spatial.css').read_text(), '</style>']
for name in ['spatial-core.js', 'calibration-core.js', 'spatial-runtime.js', 'input-runtime.js', 'soft-hand-runtime.js']:
    source = (root/'src/hand-butter'/name).read_text()
    if '</script' in source.lower():
        raise ValueError('Script source must not contain a closing script tag')
    blocks.extend(['<script>', source, '</script>'])
blocks.append(end)
output = '\n'.join(blocks)
if start in text:
    a = text.index(start)
    b = text.index(end, a) + len(end)
    text = text[:a] + output + text[b:]
else:
    text = text.replace('</body>', output + '\n</body>')
page.write_text(text)
print(f'Embedded spatial modules: {page.name} ({page.stat().st_size} bytes)')
