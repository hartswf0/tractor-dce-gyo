#!/usr/bin/env python3
"""Embed the operator modules into the standalone download, preserving legacy Butter."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
page=root/'WAG-HAND-BUTTER-11.HTML'
text=page.read_text()
for name in ['eye-scenes','cast-controls','catalog','scenes-data','scenes','movieator','movieator-index','movieator-props','operator-picker']:
    source=(root/'src/hand-butter-11'/('scenes.json' if name=='scenes-data' else f'{name}.{"json" if name in ["catalog","movieator-index"] else "js"}')).read_text()
    if name=='movieator-index':source='window.ButterMovieatorIndex='+source+';'
    if name=='catalog':source='window.ButterAssetCatalog='+source+';'
    if name=='scenes-data':source='window.ButterScenePresets='+source+';'
    if '</script' in source.lower():raise ValueError('Unexpected closing script tag')
    pattern=r'(<script data-butter-module="'+name+r'">)[\s\S]*?(</script>)'
    text,count=re.subn(pattern,lambda m:m[1]+source+m[2],text)
    if count!=1:raise ValueError('Expected one module: '+name)
a=text.index('/* world/minifig.js');b=text.index('window.ButterLDraw=',a)
text=text[:a]+(root/'world/minifig.js').read_text()+'\n'+(root/'examples/js/loaders/LDrawLoader.js').read_text()+'\n'+text[b:]
page.write_text(text)
print('Embedded eye view, cast controls and catalog.')
