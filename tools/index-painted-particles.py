#!/usr/bin/env python3
"""Measure original smoke/dust PNGs and write metadata, never image pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/particles'
layout, files = {}, []
for key in ('smoke', 'dust'):
    path = OUT / (key + '.png')
    original = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'RGBA expected')
    width, height = im.size
    columns = [round(i * width / 3) for i in range(4)]
    rows = [round(i * height / 2) for i in range(3)]
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    transparent = histogram[0] / (width * height)
    assert transparent > .20, (key, 'genuine transparent background required', transparent)
    frames, cells = {}, []
    for index in range(6):
        row, column = divmod(index, 3)
        x0, x1 = columns[column:column + 2]
        y0, y1 = rows[row:row + 2]
        cell = [x0, y0, x1 - x0, y1 - y0]
        cells.append(cell)
        region = alpha.crop((x0, y0, x1, y1))
        w, h = region.size
        gutter = max(region.crop(box).getextrema()[1] for box in
                     [(0, 0, w, 3), (0, h - 3, w, h), (0, 0, 3, h), (w - 3, 0, w, h)])
        assert gutter <= 2, (key, index, 'visible pixels cross measured cell', gutter)
        bounds = region.getbbox()
        assert bounds, (key, index, 'empty cell')
        bx, by, ex, ey = bounds
        anchor_bounds = region.point(lambda opacity: 255 if opacity >= 2 else 0).getbbox()
        assert anchor_bounds, (key, index, 'empty visible cloud')
        ax, ay, ar, ab = anchor_bounds
        center = [(ax + ar) / 2, (ay + ab) / 2]
        # Thresholds 2, 8 and 32 were measured before selecting the lowest one.
        # Sparse alpha-1 encoding residue reaches remote cell edges and must
        # not determine the visible cloud's scale. It remains in the source.
        # Runtime clips the complete image to the historical particle circle.
        samples = region.load()
        radius_squared, all_radius_squared, visible, measured, strong = 0, 0, 0, 0, 0
        for y in range(by, ey):
            for x in range(bx, ex):
                opacity = samples[x, y]
                if not opacity:
                    continue
                visible += 1
                strong += opacity >= 32
                dx = max(abs(x - center[0]), abs(x + 1 - center[0]))
                dy = max(abs(y - center[1]), abs(y + 1 - center[1]))
                distance_squared = dx * dx + dy * dy
                all_radius_squared = max(all_radius_squared, distance_squared)
                if opacity >= 2:
                    measured += 1
                    radius_squared = max(radius_squared, distance_squared)
        assert strong > 1000, (key, index, 'insufficient visible art', strong)
        radius = math.sqrt(radius_squared)
        assert radius > 0
        source = [x0 + bx, y0 + by, ex - bx, ey - by]
        anchor = [x0 + center[0], y0 + center[1]]
        target = [(source[0] - anchor[0]) / radius, (source[1] - anchor[1]) / radius,
                  source[2] / radius, source[3] / radius]
        frames['age-' + str(index)] = {
            'cell': cell, 'source': source, 'alphaBounds': source,
            'anchorBounds': [x0 + ax, y0 + ay, ar - ax, ab - ay],
            'target': target, 'size': [2, 2],
            'anchors': {'sourceOrigin': anchor, 'origin': [0, 0]},
            'sourceRadius': radius, 'visiblePixels': visible, 'strongPixels': strong,
            'anchorAlphaThreshold': 2, 'anchorPixels': measured,
            'alpha1PixelsExcludedFromMeasurement': visible - measured,
            'maxUnclippedNormalizedRadius': math.sqrt(all_radius_squared) / radius,
            'runtimeClip': {'shape': 'circle', 'center': [0, 0], 'radius': 1},
            'usage': 'runtime', 'maxCellGutterAlpha': gutter,
        }
    assert original == path.read_bytes()
    layout[key] = {'image': 'assets/painted/particles/' + key + '.png',
                   'size': [width, height], 'grid': [3, 2], 'columns': columns,
                   'rows': rows, 'cells': cells, 'frames': frames}
    files.append({'id': key, 'path': layout[key]['image'], 'bytes': len(original),
                  'sha256': hashlib.sha256(original).hexdigest(), 'dimensions': [width, height],
                  'mode': im.mode, 'frames': 6, 'runtimeFrames': 6, 'referenceFrames': 0,
                  'transparentFraction': round(transparent, 6),
                  'maxCellGutterAlpha': max(f['maxCellGutterAlpha'] for f in frames.values()),
                  'originalBytesUnchanged': True})

manifest = {
    'schema': 1, 'version': '0.15.10', 'generator': 'image_gen built-in',
    'canonIds': ['AS22'], 'atlasCount': 2, 'frameCount': 12,
    'runtimeFrameCount': 12, 'referenceFrameCount': 0, 'files': files,
    'scope': 'Six nonlooping ages of smoke and dust emitted by the existing simulation.',
    'pixelPolicy': 'Original generated PNG bytes retained; measurement and source rectangles only. No pixel edits.',
    'layoutPolicy': 'Measured 3 by 2 cells. Source rectangles retain every nontransparent pixel. Center and radius are measured on alpha>=2; sparse alpha-1 residue is excluded from measurement only. The complete image is clipped at runtime to the historical particle circle.',
    'physicalPolicy': 'No particle, collider, contact, emission, random value or saved field is added. Position, radius, lifetime and caller alpha retain their simulated values. Custom colors, sparks and blasts keep their vector fallback.',
    'motionPolicy': 'Age is 1 - life/maxLife, selecting one of six frames without looping. Reduced motion selects age-0; physical radius and opacity remain unchanged.',
    'acceptance': 'Partial AS22 art reception only. Material-specific impacts, ricochets, flames, debris, persistent foot traces, browser performance and human approval remain open.',
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'src/painted-particles-layout.mjs').write_text(
    '/** Measured rectangles and circular anchors only. Original PNG bytes are unchanged. */\n'
    'export const PAINTED_PARTICLES_LAYOUT = ' + json.dumps(layout, ensure_ascii=False, indent=2) + ';\n')
print('Particles: 2 original atlases / 12 runtime ages; source PNG bytes unchanged')
