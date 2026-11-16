#!/usr/bin/env python3
"""Measure selected MI09 original PNGs. Only metadata is written; pixels stay intact."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'assets/painted/route'
SPECS = {
    'barrier': ([0, 418, 815, 1254], ['pedestal', 'arm', 'pedestal-broken', 'arm-broken', 'control', 'control-broken']),
    'terminals': ([0, 314, 627, 940, 1254], ['map-concealed', 'map-surveyed', 'terminal-idle', 'terminal-working', 'terminal-done', 'terminal-destroyed', 'marker-imperial', 'marker-local']),
    'logistics': ([0, 418, 836, 1254], ['truck-normal', 'truck-damaged', 'truck-destroyed', 'wheel-reference', 'light-off', 'light-on']),
}
layout, files = {}, []
for key, (rows, names) in SPECS.items():
    path = FOLDER / f'{key}.png'
    original = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA' and im.size == (1254, 1254), (key, im.mode, im.size)
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] / (im.width * im.height) > .4, (key, 'Transparent background required')
    frames = {}
    for i, name in enumerate(names):
        x0, x1 = (0, 627) if i % 2 == 0 else (627, 1254)
        y0, y1 = rows[i // 2:i // 2+2]
        mask = alpha.crop((x0, y0, x1, y1)).point(lambda value: 255 if value > 12 else 0)
        bounds = mask.getbbox()
        assert bounds, (key, name)
        bx, by, ex, ey = [bounds[0]+x0, bounds[1]+y0, bounds[2]+x0, bounds[3]+y0]
        sx, sy = max(x0, bx-2), max(y0, by-2)
        sw, sh = min(x1, ex+2)-sx, min(y1, ey+2)-sy
        item = {'cell': [x0, y0, x1-x0, y1-y0], 'source': [sx, sy, sw, sh], 'alphaBounds': [bx, by, ex-bx, ey-by],
                'usage': 'reference' if name in ['wheel-reference','terminal-destroyed'] else 'runtime'}
        def anchor(source, world, scale, label='ground'):
            item['target'] = [(sx-source[0])*scale[0]+world[0], (sy-source[1])*scale[1]+world[1], sw*scale[0], sh*scale[1]]
            item['anchors'] = {label: {'source': source, 'world': world}}
        def fit(width, height, ground=0):
            anchor([(bx+ex)/2, ey], [0, ground], [width/(ex-bx), height/(ey-by)])
        if key == 'barrier':
            if name == 'pedestal':
                anchor([312, 113], [-76, -77], [34/194, 77/(397-113)], 'hinge')
            elif name == 'arm':
                anchor([679, 214], [0, 0], [167/(1229-679), 16/85], 'hinge')
            elif name == 'pedestal-broken':
                anchor([(bx+ex)/2, ey], [-76, 0], [34/194, 104/371])
            elif name == 'arm-broken':
                anchor([(bx+ex)/2, ey], [3, 0], [167/591, 42/(ey-by)])
            else:
                fit(56, 52 if name == 'control' else 50)
        elif key == 'terminals':
            if name.startswith('map-'): fit(98, 112)
            elif name.startswith('terminal-'):
                # Destruction keeps the same authored pixel scale, not the intact height.
                anchor([(bx+ex)/2, ey], [0, 0], [38/154, 70/295])
            else: fit(61 if name == 'marker-imperial' else 68, 97)
        else:
            if name.startswith('truck-'):
                anchor([(bx+ex)/2, ey], [0, 0], [126/540, 68/308])
            elif name.startswith('light-'): fit(44, 138)
            else: fit(26, 26)
        item['target'] = [round(v, 9) for v in item['target']]
        frames[name] = item
    assert original == path.read_bytes(), 'Original PNG must not be rewritten'
    digest = hashlib.sha256(original).hexdigest()
    layout[key] = {'image': f'assets/painted/route/{key}.png', 'size': list(im.size), 'grid': [2, len(rows)-1],
                   'rowBoundaries': rows, 'frames': frames}
    files.append({'id': key, 'path': layout[key]['image'], 'bytes': len(original), 'sha256': digest, 'dimensions': list(im.size),
                  'mode': im.mode, 'frames': len(frames), 'runtimeFrames': sum(f['usage'] == 'runtime' for f in frames.values()),
                  'referenceFrames': sum(f['usage'] == 'reference' for f in frames.values()),
                  'transparentFraction': round(histogram[0]/(im.width*im.height), 6), 'originalBytesUnchanged': True})
manifest = {'schema': 1, 'version': '0.15.7', 'generator': 'image_gen built-in', 'canonIds': ['MI09', 'PL03'],
            'atlasCount': len(files), 'frameCount': sum(f['frames'] for f in files), 'runtimeFrameCount': sum(f['runtimeFrames'] for f in files),
            'referenceFrameCount': sum(f['referenceFrames'] for f in files), 'files': files,
            'scope': 'MI09 barrier pieces, surveyed map, working terminals, route markers, logistics truck and floodlight. Existing state only.',
            'pixelPolicy': 'Original selected RGBA PNG bytes retained. Alpha reads and measured rectangles only; no pixel edits.',
            'layoutPolicy': 'The barrier row boundaries are measured (0,418,815,1254), not assumed equal. Shared terminal and truck state scales keep wrecks short.',
            'referencePolicy': 'The isolated wheel is a reference: complete truck images already contain both wheels. The ruined terminal is also a reference: MI09 job terminals have no simulated health or loss. No new destruction or duplicate wheel overlay is added.',
            'physicalPolicy': 'Barrier arm rotates around the historical hinge at [-76,-77] using actual opening. Foot contacts, terrain, beings and saved state remain unchanged.'}
(FOLDER / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
(ROOT / 'src/painted-route-layout.mjs').write_text('/** Metadata only; original PNGs are immutable. See tools/index-painted-route.py. */\nexport const PAINTED_ROUTE_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
print(f"MI09: {manifest['atlasCount']} original atlases / {manifest['frameCount']} cells / {manifest['runtimeFrameCount']} runtime / {manifest['referenceFrameCount']} reference")
