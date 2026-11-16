#!/usr/bin/env python3
"""Measure immutable Nacre site PNGs and write only layout/provenance metadata."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / 'assets/painted/nacre-sites'
SPECS = {
    'barriers': (3, 2, ['panel-normal', 'panel-damaged', 'panel-destroyed', 'gate-normal', 'gate-damaged', 'gate-destroyed']),
    'hydraulics': (4, 2, ['pump-normal', 'pump-destroyed', 'pump-rotor', 'valve', 'valve-wheel', 'control-normal', 'control-destroyed', 'latch']),
    'houses': (3, 2, ['house-a-normal', 'house-a-damaged', 'house-a-destroyed', 'house-b-normal', 'house-b-damaged', 'house-b-destroyed']),
    'shelters': (2, 2, ['quay-shelter', 'clinic', 'imperial', 'refuge']),
    'quays': (2, 3, ['dock', 'ramp-folded', 'deck-slat', 'winch-normal', 'winch-drum', 'winch-destroyed']),
}
ASSETS = {
    'barriers': ['AS48', 'AS50'], 'hydraulics': ['AS48', 'AS50'],
    'houses': ['AS48', 'AS52'], 'shelters': ['AS48', 'AS49', 'AS50'],
    'quays': ['AS44', 'AS45', 'AS46', 'AS49', 'AS50'],
}
layout, files = {}, []
for key, (cols, rows, names) in SPECS.items():
    path = FOLDER / f'{key}.png'
    image = Image.open(path)
    assert image.mode == 'RGBA', (key, image.mode)
    alpha = image.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > image.width * image.height * .35, f'{key}: genuinely transparent canvas required'
    frames = {}
    for i, name in enumerate(names):
        left, right = [int((i % cols + j) * image.width / cols + .5) for j in [0, 1]]
        top, bottom = [int((i // cols + j) * image.height / rows + .5) for j in [0, 1]]
        # The selected artwork has intentionally measured, unequal lower cells.
        if key == 'shelters' and i >= 2:
            left, right = (0, 498) if i == 2 else (498, 1254)
        if key == 'hydraulics' and i in [6, 7]:
            left, right = (627, 960) if i == 6 else (960, 1254)
        mask = alpha.crop((left, top, right, bottom)).point(lambda value: 255 if value > 12 else 0)
        box = mask.getbbox()
        assert box, (key, name)
        bx, by, ex, ey = box
        bx += left; ex += left; by += top; ey += top
        sx, sy = max(left, bx - 2), max(top, by - 2)
        sw, sh = min(right, ex + 2) - sx, min(bottom, ey + 2) - sy
        record = {'cell': [left, top, right - left, bottom - top], 'source': [sx, sy, sw, sh],
                  'alphaBounds': [bx, by, ex - bx, ey - by], 'runtime': True, 'usage': 'runtime'}

        def anchor_map(source_point, world_point, scale_x, scale_y, label):
            record['target'] = [(sx - source_point[0]) * scale_x + world_point[0],
                                (sy - source_point[1]) * scale_y + world_point[1], sw * scale_x, sh * scale_y]
            record['anchors'] = {label: {'source': source_point, 'world': world_point}}

        def fit(width, height, base, center=None, label='base'):
            anchor_map([center if center is not None else (bx + ex) / 2, ey], [0, base],
                       width / (ex - bx), height / (ey - by), label)

        if key == 'barriers':
            family, state = name.split('-')
            record.update(part=family, state=state, nominal=[78, 144] if family == 'panel' else [96, 180])
            if family == 'panel': fit(90 if state == 'destroyed' else 78, 54 if state == 'destroyed' else 144, 72)
            else: fit(90 if state == 'destroyed' else 80, 43 if state == 'destroyed' else 171, 90 if state == 'destroyed' else 86)
        elif key == 'hydraulics':
            part, state = {'pump-normal': ('pump', 'normal'), 'pump-destroyed': ('pump', 'destroyed'),
                           'control-normal': ('gate-control', 'normal'), 'control-destroyed': ('gate-control', 'destroyed')}.get(name, (name, 'normal'))
            record.update(part=part, state=state)
            if part == 'pump':
                record['nominal'] = [72, 68]
                if state == 'normal':
                    anchor_map([131, 392], [-6, -2], 72 / (ex - bx), 36 / (ey - 392), 'rotor')
                    record['anchors']['ground'] = {'source': [131, ey], 'world': [-6, 34]}
                else: fit(72, 68, 34)
            elif part == 'pump-rotor':
                record['nominal'] = [46, 46]
                anchor_map([784, 391], [0, 0], 46 / (ex - bx), 46 / (ey - by), 'axis')
            elif part == 'valve':
                record['nominal'] = [68, 80]
                anchor_map([1093, 395], [0, 11], 68 / (ex - bx), 29 / (ey - 395), 'wheel')
                record['anchors']['ground'] = {'source': [1093, ey], 'world': [0, 40]}
            elif part == 'valve-wheel':
                record['nominal'] = [38, 38]
                anchor_map([161, 885], [0, 0], 38 / (ex - bx), 38 / (ey - by), 'axis')
            elif part == 'gate-control':
                record['nominal'] = [56, 52]
                if state == 'normal':
                    anchor_map([477, 854], [0, -2], 56 / (ex - bx), 28 / (ey - 854), 'gauge')
                    record['anchors']['ground'] = {'source': [477, ey], 'world': [0, 26]}
                else: fit(56, 52, 26)
            elif part == 'latch':
                record['nominal'] = [20, 40]
                anchor_map([1106, 958], [0, 0], 18 / (ex - bx), 18 / (ex - bx), 'axis')
        elif key == 'houses':
            family, state = name.rsplit('-', 1)
            record.update(part=family, state=state, nominal=[170, 144 if family == 'house-a' else 128])
            ref_width, ref_height = (387, 382) if family == 'house-a' else (405, 300)
            centers = {'house-a-normal': 219, 'house-a-damaged': 632, 'house-b-normal': 222, 'house-b-damaged': 636}
            anchor_map([centers.get(name, (bx + ex) / 2), ey], [0, 0], 170 / ref_width,
                       record['nominal'][1] / ref_height, 'entrance' if state != 'destroyed' else 'ground')
        elif key == 'shelters':
            nominal, visual, door = {'quay-shelter': ([142, 102], [160, 118], 347), 'clinic': ([138, 140], [158, 157], 906),
                                     'imperial': ([138, 140], [158, 157], 270), 'refuge': ([212, 152], [212, 152], 794)}[name]
            record.update(part=name, state='normal', nominal=nominal)
            fit(*visual, 0, door, 'entrance')
        elif key == 'quays':
            part, state = ('winch', name.split('-')[1]) if name in ['winch-normal', 'winch-destroyed'] else (name, 'normal')
            record.update(part=part, state=state)
            if part == 'dock':
                record['nominal'] = [240, 88]
                anchor_map([(bx + ex) / 2, 158], [0, -16], 240 / (ex - bx), 60 / (ey - 158), 'deck')
                record['anchors']['pileBase'] = {'source': [(bx + ex) / 2, ey], 'world': [0, 44]}
            elif part == 'ramp-folded':
                record['nominal'] = [86, 32]; fit(86, 32, 0)
            elif part == 'deck-slat':
                record['nominal'] = [20, 8]; fit(20, 8, 4)
            elif part == 'winch':
                record['nominal'] = [44, 44]
                if state == 'normal':
                    anchor_map([939, 615], [0, 0], 44 / (ex - bx), 22 / (ey - 615), 'drum')
                    record['anchors']['base'] = {'source': [939, ey], 'world': [0, 22]}
                else: fit(44, 32, 22)
            elif part == 'winch-drum':
                record['nominal'] = [26, 26]
                anchor_map([312, 1038], [0, 0], 26 / (ex - bx), 26 / (ey - by), 'axis')
        assert 'target' in record and 'nominal' in record
        record['target'] = [round(value, 9) for value in record['target']]
        frames[name] = record
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    layout[key] = {'size': list(image.size), 'grid': [cols, rows], 'sha256': digest, 'frames': frames}
    files.append({'key': key, 'path': str(path.relative_to(ROOT)), 'bytes': path.stat().st_size,
                  'size': list(image.size), 'sha256': digest, 'alphaZeroPixels': histogram[0],
                  'cells': len(frames), 'runtimeCells': len(frames), 'referenceCells': 0,
                  'bibleAssets': ASSETS[key], 'frames': frames})

manifest = {'version': '0.15.6', 'atlasCount': len(files), 'cellCount': sum(f['cells'] for f in files),
            'runtimeCellCount': sum(f['cells'] for f in files), 'referenceCellCount': 0,
            'sourcePolicy': 'Selected built-in Imagegen RGBA originals copied byte-for-byte; no pixel editing, compression or resampling.',
            'scope': 'Presentation of existing Nacre sites only; no physical, water, population, mission or save changes.',
            'files': files}
(FOLDER / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
(ROOT / 'src/painted-nacre-sites-layout.mjs').write_text('// Generated metadata only by tools/index-painted-nacre-sites.py. PNGs remain unchanged.\nexport const PAINTED_NACRE_SITE_LAYOUT = Object.freeze(' + json.dumps(layout, indent=2, ensure_ascii=False) + ');\n')
print(f"Indexed {len(files)} original PNGs / {manifest['cellCount']} runtime cells / 0 reference cells / {sum(f['bytes'] for f in files)} bytes")
