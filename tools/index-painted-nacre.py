#!/usr/bin/env python3
"""Measure the selected PNGs; write metadata only, never image pixels."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'assets/painted/nacre'
SPECS = {
    'ambulance': ([2, 2], ['normal', 'damaged', 'destroyed', 'wheel'], [176, 78]),
    'equipment': ([3, 2], ['case-unknown', 'case-verified', 'case-destroyed', 'beacon-attached', 'beacon-lost', 'beacon-recovered'], [74, 32]),
    'rive-courte': ([2, 3], ['waiting', 'boarding', 'moving', 'arrived', 'damaged', 'destroyed'], [184, 68]),
    'veille-aval': ([2, 3], ['waiting', 'boarding', 'moving', 'arrived', 'damaged', 'destroyed'], [164, 64]),
    'ferry': ([2, 2], ['waiting', 'arrived', 'damaged', 'destroyed'], [134, 58]),
    'saisie': ([2, 2], ['normal', 'released', 'damaged', 'destroyed'], [172, 78]),
}
REFERENCE = {'equipment/beacon-recovered'}
layout, files = {}, []
for key, (grid, names, nominal) in SPECS.items():
    path = FOLDER / f'{key}.png'
    image = Image.open(path)
    assert image.mode == 'RGBA', (key, image.mode)
    alpha = image.getchannel('A')
    assert alpha.histogram()[0] > image.width * image.height * .1, f'{key}: genuine transparent background required'
    frames, parts = {}, []
    for i, name in enumerate(names):
        left, right = [int((i % grid[0] + j) * image.width / grid[0] + .5) for j in [0, 1]]
        top, bottom = [int((i // grid[0] + j) * image.height / grid[1] + .5) for j in [0, 1]]
        mask = alpha.crop((left, top, right, bottom)).point(lambda value: 255 if value > 12 else 0)
        box = mask.getbbox()
        assert box is not None, (key, name)
        x, y, x1, y1 = box
        # Two-pixel safety border retains antialiased edges; the file stays intact.
        sx, sy = max(left, left + x - 2), max(top, top + y - 2)
        ex, ey = min(right, left + x1 + 2), min(bottom, top + y1 + 2)
        record = {'cell': [left, top, right - left, bottom - top], 'source': [sx, sy, ex - sx, ey - sy],
                  'bounds': [x, y, x1 - x, y1 - y], 'runtime': f'{key}/{name}' not in REFERENCE}
        if key in ['rive-courte', 'veille-aval', 'ferry', 'saisie']:
            # Keel is measured independently from a gangway projecting below it.
            keel = 375 if key == 'ferry' and name == 'arrived' else y1
            reference = parts[0]['bounds'] if parts else record['bounds']
            scale_x = nominal[0] / reference[2]
            scale_y = nominal[1] * 1.25 / reference[3]
            center_x = x + (x1 - x) / 2
            record['target'] = [(sx - left - center_x) * scale_x, nominal[1] / 2 + (sy - top - keel) * scale_y,
                                (ex - sx) * scale_x, (ey - sy) * scale_y]
            record['anchors'] = {'sourceKeel': [left + center_x, top + keel], 'keel': [0, nominal[1] / 2]}
        elif key == 'ambulance':
            if name == 'wheel':
                record['target'] = [-12, -12, 24, 24]
                record['anchors'] = {'hub': [0, 0], 'tread': [0, 12]}
            else:
                # The roof supports cargo at its existing simulated position.
                base_y = 58 if name == 'destroyed' else 55
                body_height = 78 if name == 'destroyed' else 94
                record['target'] = [-88, base_y - body_height, 176, body_height]
                record['anchors'] = {'roof': [0, -39], 'bodyBottom': [0, base_y]}
        elif name.startswith('case'):
            record['target'] = [-37, -16, 74, 32]
            record['anchors'] = {'center': [0, 0]}
        else:
            record['target'] = [-13, -18, 26, 28]
            record['anchors'] = {'mount': [0, 0]}
        record['target'] = [round(v, 6) for v in record['target']]
        frames[name] = record
        parts.append(record)
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    layout[key] = {'size': list(image.size), 'grid': grid, 'nominal': nominal, 'sha256': digest, 'frames': frames}
    files.append({'key': key, 'path': str(path.relative_to(ROOT)), 'size': list(image.size), 'grid': grid,
                  'sha256': digest, 'bytes': path.stat().st_size, 'cells': len(frames),
                  'runtimeCells': sum(f['runtime'] for f in frames.values()), 'frames': list(frames)})

manifest = {'schema': 1, 'version': '0.15.5', 'date': '2026-11-16', 'title': 'Nacre — ambulance, matériel et quatre embarcations',
            'generator': 'image_gen.imagegen (built-in)', 'indexer': 'tools/index-painted-nacre.py',
            'runtime': 'src/painted-nacre.mjs', 'layout': 'src/painted-nacre-layout.mjs',
            'atlases': len(files), 'cells': sum(f['cells'] for f in files), 'runtimeCells': sum(f['runtimeCells'] for f in files),
            'referenceCells': len(REFERENCE), 'imagesModifiedByIndexer': False, 'files': files,
            'scope': ['Actual existing entities and states only', 'PNG originals preserved byte-for-byte',
                      'Recovered beacon cell is reference only; a removed beacon must not be drawn on the vehicle',
                      'Passengers remain simulation-owned and drawn separately; no people are painted onto vessels',
                      'Boat keels, ambulance wheel contacts and mission appearance conditions remain unchanged']}
(FOLDER / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'src/painted-nacre-layout.mjs').write_text('// Generated metadata only. Selected source PNGs are never modified.\nexport const PAINTED_NACRE_LAYOUT = ' + json.dumps(layout, ensure_ascii=False, indent=2) + ';\n')
print(json.dumps({k: manifest[k] for k in ['atlases', 'cells', 'runtimeCells', 'referenceCells']}))
