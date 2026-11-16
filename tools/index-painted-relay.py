#!/usr/bin/env python3
"""Index original transparent MI12 atlases; never write or retouch image pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/relay'
MEASURED = json.loads((OUT / 'anchors.json').read_text())
SPECS = {
    'praetor': ([4, 4], ['hull-guard', 'hull-attack', 'hull-exposed', 'hull-destroyed',
        'upper', 'lower', 'foot', 'hip', 'knee', 'cannon', 'sensor-tracking', 'sensor-locking',
        'sensor-disabled', 'lock-anchored', 'lock-broken', 'cannon-damaged']),
    'relay-mast': ([3, 2], ['live', 'reviewed', 'purging', 'isolated', 'erased', 'destroyed']),
    'consoles': ([4, 2], ['copy-idle', 'copy-copying', 'copy-copied', 'copy-expired',
        'post-idle', 'post-working', 'post-transmitted', 'cassette']),
}
rounded = lambda xs: [round(float(x), 8) for x in xs]
edge = lambda n: math.floor(n + .5)
layout, files = {}, []
for key, (grid, names) in SPECS.items():
    path = OUT / f'{key}.png'
    before = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'Expected original RGBA')
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > im.width * im.height * .3 and alpha.getextrema()[1] >= 250, (key, 'Missing transparent alpha')
    frames = {}
    for i, name in enumerate(names):
        x0, x1 = edge(i % grid[0] * im.width / grid[0]), edge((i % grid[0] + 1) * im.width / grid[0])
        y0, y1 = edge(i // grid[0] * im.height / grid[1]), edge((i // grid[0] + 1) * im.height / grid[1])
        box = alpha.crop((x0, y0, x1, y1)).point(lambda a: 255 if a >= 32 else 0).getbbox()
        assert box and box[0] > 0 and box[1] > 0 and box[2] < x1-x0 and box[3] < y1-y0, (key, name, 'Empty or clipped cell', box)
        left, top, right, bottom = max(0, box[0]-2), max(0, box[1]-2), min(x1-x0, box[2]+2), min(y1-y0, box[3]+2)
        measured = MEASURED[key][name]
        px, py = measured['pivot']
        rotation = 0
        if key == 'praetor':
            if name.startswith('hull-'):
                bx0, by0, bx1, by1 = measured['bodyBox']
                sx, sy = 172 / (bx1-bx0), 92 / (by1-by0)
            elif name in ['upper', 'lower', 'cannon', 'cannon-damaged']:
                ex, ey = measured['endpoint']; dx, dy = ex-px, ey-py
                length = 71 if name.startswith('cannon') else 100
                sx = sy = length / math.hypot(dx, dy)
                # Cannon remains left-facing. Leg components resolve to +X.
                rotation = (math.pi if name.startswith('cannon') else 0) - math.atan2(dy, dx)
                if rotation > math.pi: rotation -= 2 * math.pi
            elif name == 'foot': sx = sy = 34 / measured['width']
            elif name in ['hip', 'knee']: sx = sy = (20 if name == 'hip' else 15) / measured['diameter']
            elif name.startswith('sensor-'):
                bx0, by0, bx1, by1 = measured['bodyBox']; sx, sy = 40/(bx1-bx0), 34/(by1-by0)
            else: sx = sy = 52 / measured['height']
        elif key == 'relay-mast': sx = sy = 174 / 490
        elif name.startswith('copy-'): sx = sy = 106 / 335
        elif name.startswith('post-'): sx = sy = 86 / 463
        else: sx = sy = .22
        entry = {
            'cell': [x0, y0, x1-x0, y1-y0],
            'source': [x0+left, y0+top, right-left, bottom-top],
            'target': rounded([(left-px)*sx, (top-py)*sy, (right-left)*sx, (bottom-top)*sy]),
            'usage': measured.get('usage', 'runtime'),
            'anchors': {'sourcePivot': rounded([x0+px, y0+py]), 'pivot': [0, 0]},
        }
        if rotation: entry['rotation'] = round(rotation, 12)
        if 'endpoint' in measured:
            ex, ey = measured['endpoint']
            entry['anchors']['sourceEndpoint'] = rounded([x0+ex, y0+ey])
            entry['anchors']['resolvedEndpoint'] = [-71, 0] if name.startswith('cannon') else [100, 0]
        if 'ankle' in measured:
            ax, ay = measured['ankle']
            entry['anchors']['sourceAnkle'] = rounded([x0+ax, y0+ay])
            entry['anchors']['ankle'] = rounded([(ax-px)*sx, (ay-py)*sy])
        assert all(math.isfinite(v) for v in entry['target']) and min(entry['target'][2:]) > 0
        frames[name] = entry
    layout[key] = {'image': f'assets/painted/relay/{key}.png', 'size': list(im.size), 'grid': grid, 'frames': frames}
    files.append({'id': key, 'path': f'assets/painted/relay/{key}.png', 'sha256': hashlib.sha256(before).hexdigest(),
        'size': list(im.size), 'bytes': len(before), 'mode': im.mode, 'alphaRange': list(alpha.getextrema()),
        'transparentPixels': histogram[0], 'cells': len(frames), 'runtimeCells': sum(f['usage']=='runtime' for f in frames.values()),
        'referenceCells': sum(f['usage']=='reference' for f in frames.values())})
    assert path.read_bytes() == before, 'Indexer altered source PNG'
(ROOT / 'src/painted-relay-layout.mjs').write_text('/** Original MI12 PNG rectangles and measured anchors. Pixels unchanged. */\nexport const PAINTED_RELAY_LAYOUT = ' + json.dumps(layout, indent=2) + ';\n')
manifest = {'version': '0.15.5', 'method': 'Built-in image_gen; original PNG pixels retained without retouching',
    'scope': 'MI12 existing relay sites, consoles and articulated VE12 Praetor; no new simulation or people',
    'atlasCount': len(files), 'cellCount': sum(f['cells'] for f in files), 'runtimeCellCount': sum(f['runtimeCells'] for f in files),
    'referenceCellCount': sum(f['referenceCells'] for f in files), 'files': files,
    'layout': 'src/painted-relay-layout.mjs', 'anchors': 'assets/painted/relay/anchors.json', 'prompts': 'assets/painted/relay/prompts.json'}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: manifest[k] for k in ['atlasCount', 'cellCount', 'runtimeCellCount', 'referenceCellCount']}))
