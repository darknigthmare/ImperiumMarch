#!/usr/bin/env python3
"""Measure original walker-FX PNGs and write metadata only; never image pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/walker-fx'
CORE = [[0, -7], [33, -3], [18, 0], [41, 4], [1, 8]]
prompts = json.loads((OUT / 'prompts.json').read_text())
selected = {Path(a['output']).stem: a for a in prompts['attempts'] if a['selected']}
layout, files = {}, []

for key, columns_count, count, threshold in [('muzzle', 2, 4, 2), ('vent', 3, 6, 4)]:
    path = OUT / (key + '.png')
    original = path.read_bytes()
    digest = hashlib.sha256(original).hexdigest()
    assert digest == selected[key]['sha256'], (key, 'selected original differs')
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'RGBA expected')
    width, height = im.size
    alpha = im.getchannel('A')
    transparent = alpha.histogram()[0] / (width * height)
    assert transparent > .5, (key, 'genuine transparent background required')
    columns = [round(i * width / columns_count) for i in range(columns_count + 1)]
    rows = [round(i * height / 2) for i in range(3)]
    frames, cells, measurements = {}, [], []
    for index in range(count):
        row, column = divmod(index, columns_count)
        x0, x1 = columns[column:column + 2]
        y0, y1 = rows[row:row + 2]
        cell = [x0, y0, x1 - x0, y1 - y0]
        cells.append(cell)
        region = alpha.crop((x0, y0, x1, y1))
        w, h = region.size
        gutter = max(region.crop(box).getextrema()[1] for box in
                     [(0, 0, w, 3), (0, h - 3, w, h), (0, 0, 3, h), (w - 3, 0, w, h)])
        assert gutter <= 1, (key, index, 'visible pixels cross a cell', gutter)
        bounds = region.getbbox()
        measured = region.point(lambda opacity: 255 if opacity >= threshold else 0).getbbox()
        assert bounds and measured, (key, index, 'empty cell')
        bx, by, ex, ey = bounds
        ax, ay, ar, ab = measured
        samples = region.load()
        histogram = region.histogram()
        alpha_pixels = sum(histogram[1:])
        useful_pixels = sum(histogram[threshold:])
        strong = sum(histogram[32:])
        assert strong > 1000, (key, index, 'insufficient art')
        thresholds = {str(q): list(region.point(lambda value, q=q: 255 if value >= q else 0).getbbox())
                      for q in [2, 4, 8, 32, 128]}
        if key == 'muzzle':
            # The generated tongues share a left root. Measure its axis from
            # the first 3% of useful flame width, without reading faint residue.
            root_end = min(ar, ax + max(4, round((ar - ax) * .03)))
            weight, weighted_y = 0, 0
            for y in range(ay, ab):
                for x in range(ax, root_end):
                    opacity = samples[x, y]
                    if opacity >= 32:
                        weight += opacity
                        weighted_y += (y + .5) * opacity
            assert weight > 0
            origin = [float(ax), weighted_y / weight]
            measurements.append({'right': ar - origin[0], 'up': origin[1] - ay, 'down': ab - origin[1]})
            extra = {'sourceOriginMethod': 'Left useful flame edge and alpha-weighted axis in its first 3 percent; threshold 32 for axis only.',
                     'runtimeClip': {'shape': 'polygon', 'points': CORE}}
        else:
            origin = [(ax + ar) / 2, (ay + ab) / 2]
            max_radius_squared = 0
            for y in range(ay, ab):
                for x in range(ax, ar):
                    if samples[x, y] >= threshold:
                        dx = max(abs(x - origin[0]), abs(x + 1 - origin[0]))
                        dy = max(abs(y - origin[1]), abs(y + 1 - origin[1]))
                        max_radius_squared = max(max_radius_squared, dx * dx + dy * dy)
            radius = math.sqrt(max_radius_squared)
            assert radius > 0
            extra = {'sourceRadius': radius, 'sourceOriginMethod': 'Center of useful-alpha bounds; circumscribed useful-pixel radius.',
                     'runtimeClip': {'shape': 'circle', 'center': [0, 0], 'radius': 1}}
        source = [x0 + bx, y0 + by, ex - bx, ey - by]
        source_origin = [x0 + origin[0], y0 + origin[1]]
        frames['age-' + str(index)] = {
            'cell': cell, 'source': source, 'alphaBounds': source,
            'anchorBounds': [x0 + ax, y0 + ay, ar - ax, ab - ay],
            'anchors': {'sourceOrigin': source_origin, 'origin': [0, 0]},
            'anchorAlphaThreshold': threshold, 'alphaBoundsByThresholdInCell': thresholds,
            'visiblePixels': alpha_pixels, 'anchorPixels': useful_pixels,
            'lowAlphaPixelsExcludedFromMeasurementOnly': alpha_pixels - useful_pixels,
            'strongPixels': strong, 'usage': 'runtime', 'maxCellGutterAlpha': gutter, **extra,
        }
    if key == 'muzzle':
        # One scale for all four phases preserves their relative growth.
        common_scale = min(41 / max(m['right'] for m in measurements),
                           7 / max(m['up'] for m in measurements),
                           8 / max(m['down'] for m in measurements))
    for frame in frames.values():
        scale = common_scale if key == 'muzzle' else 1 / frame['sourceRadius']
        sx, sy, sw, sh = frame['source']
        ox, oy = frame['anchors']['sourceOrigin']
        frame['target'] = [(sx - ox) * scale, (sy - oy) * scale, sw * scale, sh * scale]
        frame['sourceToTargetScale'] = scale
    assert original == path.read_bytes(), (key, 'PNG modified')
    layout[key] = {'image': 'assets/painted/walker-fx/' + key + '.png',
                   'size': [width, height], 'grid': [columns_count, 2],
                   'columns': columns, 'rows': rows, 'cells': cells, 'frames': frames}
    if key == 'muzzle':
        layout[key]['commonSourceScale'] = common_scale
    files.append({'id': key, 'path': layout[key]['image'], 'bytes': len(original),
                  'sha256': digest, 'dimensions': [width, height], 'mode': im.mode,
                  'frames': count, 'runtimeFrames': count, 'referenceFrames': 0,
                  'transparentFraction': round(transparent, 6),
                  'maxCellGutterAlpha': max(f['maxCellGutterAlpha'] for f in frames.values()),
                  'anchorAlphaThreshold': threshold, 'originalBytesUnchanged': True})

manifest = {
    'schema': 1, 'version': '0.15.11', 'generator': 'image_gen built-in',
    'canonIds': ['AS09', 'AS22', 'SY08', 'SY09', 'SY127', 'PX19'],
    'atlasCount': 2, 'frameCount': 10, 'runtimeFrameCount': 10, 'referenceFrameCount': 0,
    'files': files,
    'scope': 'Four primary muzzle-core phases and six cooling-puff phases for the existing six playable walkers.',
    'pixelPolicy': 'Selected Imagegen PNG bytes copied unchanged. Metadata and runtime clipping only; no recoloring, alpha edit, resize, compositing or re-encoding.',
    'layoutPolicy': 'Muzzle roots measured at useful alpha 2, with one common scale preserving phase growth. Vent centers/radii use alpha 4: threshold 2 has sparse remote pixels, while 4/8/32 bound the same visible puff. All nonzero-alpha source pixels are retained in their cell crops; low-alpha pixels are excluded from measurement only.',
    'physicalPolicy': 'The caller retains the exact muzzle halo and core polygon; fireCooldown>.1 and !hangar remain the presence gate. No secondary-only flash. Five existing purge circles retain their condition, phase, center, radius and caller alpha. No particle, timer, random call, collider, actor or saved field is added.',
    'muzzlePolicy': {'window': 'fireRate - 0.1; never extended', 'age': 'clamp((fireRate-fireCooldown)/(fireRate-0.1),0,1)',
                     'reducedMotion': 'age-0', 'corePolygon': CORE,
                     'retainedProceduralHalo': {'centerFromMuzzle': [8, 0], 'radius': 42, 'color': '#ffd58766'}},
    'ventPolicy': {'condition': 'player.venting || player.heat > 70', 'count': 5,
                   'phase': '(time*0.8 + index*0.23) % 1',
                   'time': 'elapsed, or 0 with reduced motion', 'radius': '9 + phase*27',
                   'alpha': '(1-phase)*0.18', 'paletteReference': '#d2d5c6',
                   'clip': 'Exact historical circle; no extra halo or emitter'},
    'acceptance': 'Partial AS09/AS22 art only. No enemy muzzle flashes, damage flashes, recoil mechanism, casing, reloading animation, material impacts, heat mechanic or human acceptance is added.',
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'src/painted-walker-fx-layout.mjs').write_text(
    '/** Measured source rectangles and anchors only. Original PNG bytes are unchanged. */\n'
    'export const PAINTED_WALKER_FX_LAYOUT = ' + json.dumps(layout, ensure_ascii=False, indent=2) + ';\n')
print('Walker FX: 2 original atlases / 10 runtime cells; source PNG bytes unchanged')
