#!/usr/bin/env python3
"""Measure original MI10 PNGs; write metadata only, never image pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/chemical'
MEASURED = json.loads((OUT / 'anchors.json').read_text())['atlases']
SPECS = {
    'tanks': ([3, 2], [('chemical-tank', x) for x in ['unknown', 'identified', 'leaking', 'sealed', 'destroyed']]),
    'instruments': ([4, 2], [('sampling-rig', x) for x in ['idle', 'working', 'secured', 'lost']]
                    + [('batch-ledger', x) for x in ['unread', 'copied', 'lost']]),
    'valves': ([2, 2], [('field-valve', x) for x in ['normal', 'working', 'operated', 'destroyed']]),
    'canals': ([2, 3], [('canal-junction', x) for x in ['open', 'covering', 'covered', 'contaminated', 'destroyed']]),
    'homes': ([3, 1], [('village-supply', x) for x in ['habitable', 'contaminated', 'destroyed']]),
}
edge = lambda x: math.floor(x + .5)
rounded = lambda values: [round(float(x), 9) for x in values]
layout, files = {}, []
for key, (grid, states) in SPECS.items():
    path = OUT / f'{key}.png'
    original = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'RGBA original required')
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] / (im.width * im.height) > .4, (key, 'Background is not a cutout')
    assert alpha.getextrema()[1] >= 250, (key, 'Opaque subject missing')
    frames, empty, gutters = {}, [], []
    for index in range(grid[0] * grid[1]):
        x0, x1 = edge(index % grid[0] * im.width / grid[0]), edge((index % grid[0] + 1) * im.width / grid[0])
        y0, y1 = edge(index // grid[0] * im.height / grid[1]), edge((index // grid[0] + 1) * im.height / grid[1])
        region = alpha.crop((x0, y0, x1, y1))
        w, h = region.size
        gutter = max(region.crop(box).getextrema()[1] for box in
                     [(0, 0, w, 6), (0, h-6, w, h), (0, 0, 6, h), (w-6, 0, w, h)])
        assert gutter <= 2, (key, index, 'Visible pixels in cell gutter', gutter)
        gutters.append(gutter)
        if index >= len(states):
            assert region.getextrema()[1] <= 2, (key, index, 'Reserved cell is not empty')
            empty.append(index)
            continue
        part, state = states[index]
        family = 'sample' if part == 'sampling-rig' else 'ledger' if part == 'batch-ledger' else None
        measured = MEASURED[key]['families'][family] if family else MEASURED[key]
        name = f'{family}-{state}' if family else state
        px, py = measured['frames'][state]
        sx, sy = measured['scale']
        bounds = region.point(lambda a: 255 if a >= 32 else 0).getbbox()
        assert bounds and bounds[0] > 2 and bounds[1] > 2 and bounds[2] < w-2 and bounds[3] < h-2, (key, name, bounds)
        left, top, right, bottom = bounds[0]-2, bounds[1]-2, bounds[2]+2, bounds[3]+2
        assert 0 <= px < w and 0 <= py < h, (key, name, 'Ground anchor outside cell')
        frames[name] = {
            'part': part, 'state': state, 'usage': 'runtime',
            'cell': [x0, y0, w, h],
            'source': [x0+left, y0+top, right-left, bottom-top],
            'target': rounded([(left-px)*sx, (top-py)*sy, (right-left)*sx, (bottom-top)*sy]),
            'anchors': {'sourceGround': [x0+px, y0+py], 'ground': [0, 0]},
            'alphaBounds': [x0+bounds[0], y0+bounds[1], bounds[2]-bounds[0], bounds[3]-bounds[1]],
        }
    assert path.read_bytes() == original, 'Indexer must not rewrite an original PNG'
    layout[key] = {'image': f'assets/painted/chemical/{key}.png', 'size': list(im.size), 'grid': grid, 'emptyCells': empty, 'frames': frames}
    if key == 'canals':
        overlay = MEASURED[key]['coverOverlay']
        u, v, w, h = overlay['source']
        assert u >= 0 and v >= 0 and u+w <= im.width and v+h <= im.height
        layout[key]['coverOverlay'] = overlay
    files.append({'id': key, 'path': layout[key]['image'], 'bytes': len(original), 'sha256': hashlib.sha256(original).hexdigest(),
                  'dimensions': list(im.size), 'mode': im.mode, 'frames': len(frames), 'runtimeFrames': len(frames),
                  'referenceFrames': 0, 'emptyCells': empty, 'transparentFraction': round(histogram[0]/(im.width*im.height), 6),
                  'maxCellGutterAlpha': max(gutters), 'originalBytesUnchanged': True})

manifest = {'schema': 1, 'version': '0.15.6', 'generator': 'image_gen built-in', 'canonIds': ['MI10', 'PL03', 'PT02', 'AS18', 'SY99', 'SY100', 'SY101', 'SY102', 'SY103'],
            'atlasCount': len(files), 'frameCount': sum(x['frames'] for x in files), 'runtimeFrameCount': 24, 'referenceFrameCount': 0,
            'emptyGridCellCount': sum(len(x['emptyCells']) for x in files), 'files': files,
            'scope': 'Six existing MI10 equipment families. No bodies, populations, evidence, fluid mass or gameplay states added.',
            'pixelPolicy': 'Original selected generated PNGs copied intact. Indexing reads alpha and writes metadata only. Empty cells and gutter alpha <= 2 are not counted as sprites.',
            'physicalSurface': 'Canal bitmap slices follow real terrain. Covered channels reuse a thin region of the covered frame above the clean or contaminated body. chemicalSurfaceAt still supplies the exact cover and foot contacts. Real plumes and retained basin volume remain separately drawn.'}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'src/painted-chemical-layout.mjs').write_text('/** Generated metadata; see tools/index-painted-chemical.py. Original PNG bytes unchanged. */\nexport const PAINTED_CHEMICAL_LAYOUT = ' + json.dumps(layout, ensure_ascii=False, indent=2) + ';\n')
print(f"MI10: {len(files)} original PNGs / {manifest['frameCount']} runtime frames / {manifest['emptyGridCellCount']} empty cells")
