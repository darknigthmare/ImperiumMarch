#!/usr/bin/env python3
"""Measure selected original MI11 PNGs; write metadata only, never image pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/voice'
ANCHORS = json.loads((OUT / 'anchors.json').read_text())
SPECS = {
    'instruments': ([4, 2], ['listen-idle', 'listen-listening', 'listen-recorded', 'listen-lost',
                            'record-untranslated', 'record-copying', 'record-copied', 'record-lost']),
    'emitter': ([3, 2], ['transmitting', 'working', 'seized', 'preserved', 'destroyed']),
    'terrain-sites': ([2, 4], ['nest-intact', 'nest-disturbed', 'nest-damaged', 'nest-lost',
                             'ridge-unknown', 'ridge-surveyed', 'ridge-damaged', 'ridge-destroyed']),
}
edge = lambda n: math.floor(n + .5)
rounded = lambda xs: [round(float(x), 8) for x in xs]
layout, files = {}, []
for key, (grid, names) in SPECS.items():
    path = OUT / f'{key}.png'
    original = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'Expected original RGBA')
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > im.width * im.height * .3 and alpha.getextrema()[1] >= 250, (key, 'Cutout alpha required')
    frames = {}
    for index, name in enumerate(names):
        x0, x1 = edge(index % grid[0] * im.width / grid[0]), edge((index % grid[0] + 1) * im.width / grid[0])
        y0, y1 = edge(index // grid[0] * im.height / grid[1]), edge((index // grid[0] + 1) * im.height / grid[1])
        cell = alpha.crop((x0, y0, x1, y1))
        box = cell.point(lambda a: 255 if a >= 32 else 0).getbbox()
        assert box and box[0] > 0 and box[1] > 0 and box[2] < x1-x0 and box[3] < y1-y0, (key, name, box)
        left, top, right, bottom = max(0, box[0]-2), max(0, box[1]-2), min(x1-x0, box[2]+2), min(y1-y0, box[3]+2)
        measured = ANCHORS[key][name]
        px, py = measured['pivot']
        sx, sy = measured['scale']
        target = rounded([(left-px)*sx, (top-py)*sy, (right-left)*sx, (bottom-top)*sy])
        assert all(math.isfinite(v) for v in target) and min(target[2:]) > 0
        frames[name] = {'cell': [x0, y0, x1-x0, y1-y0], 'source': [x0+left, y0+top, right-left, bottom-top],
                        'target': target, 'usage': 'runtime',
                        'anchors': {'sourceGround': [x0+px, y0+py], 'ground': [0, 0]}}
    if key == 'emitter':
        empty = alpha.crop((edge(2*im.width/3), edge(im.height/2), im.width, im.height))
        assert empty.point(lambda a: 255 if a >= 32 else 0).getbbox() is None, 'Emitter sixth cell must stay unused'
    layout[key] = {'image': f'assets/painted/voice/{key}.png', 'size': list(im.size), 'grid': grid, 'frames': frames}
    files.append({'id': key, 'path': f'assets/painted/voice/{key}.png', 'sha256': hashlib.sha256(original).hexdigest(),
                  'size': list(im.size), 'bytes': len(original), 'mode': im.mode, 'alphaRange': list(alpha.getextrema()),
                  'transparentPixels': histogram[0], 'cells': len(frames), 'runtimeCells': len(frames), 'referenceCells': 0})
    assert path.read_bytes() == original, 'Indexer altered original image'
(ROOT/'src/painted-voice-layout.mjs').write_text('/** Measured original MI11 PNG rectangles and ground anchors. Pixels unchanged. */\nexport const PAINTED_VOICE_LAYOUT = ' + json.dumps(layout, indent=2) + ';\n')
manifest = {'version': '0.15.6', 'method': 'Built-in image_gen; selected original PNG pixels retained without retouching',
            'scope': 'Five existing MI11 site families, no new being, physical surface, acquisition or consent',
            'atlasCount': len(files), 'cellCount': sum(f['cells'] for f in files),
            'runtimeCellCount': sum(f['runtimeCells'] for f in files), 'referenceCellCount': 0,
            'files': files, 'layout': 'src/painted-voice-layout.mjs', 'anchors': 'assets/painted/voice/anchors.json',
            'prompts': 'assets/painted/voice/prompts.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['atlasCount','cellCount','runtimeCellCount','referenceCellCount']}))
