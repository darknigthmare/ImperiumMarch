#!/usr/bin/env python3
"""Measure original spark/blast atlases; never modify generated image pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/particle-impacts'
layout, files = {}, []
prompts = json.loads((OUT / 'prompts.json').read_text())
for key in ('spark', 'blast'):
    path = OUT / (key + '.png')
    original = path.read_bytes()
    selected = next(item for item in prompts['selectedOutputs'] if item['atlas'] == key)
    assert hashlib.sha256(original).hexdigest() == selected['sha256']
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'RGBA required')
    width, height = im.size
    columns = [round(i * width / 3) for i in range(4)]
    rows = [round(i * height / 2) for i in range(3)]
    alpha = im.getchannel('A')
    transparent = alpha.histogram()[0] / (width * height)
    assert transparent > .5, (key, 'empty transparent space required', transparent)
    frames, cells = {}, []
    for index in range(6):
        row, col = divmod(index, 3)
        x0, x1 = columns[col:col + 2]
        y0, y1 = rows[row:row + 2]
        cell = [x0, y0, x1 - x0, y1 - y0]
        cells.append(cell)
        region = alpha.crop((x0, y0, x1, y1))
        w, h = region.size
        gutter = max(region.crop(box).getextrema()[1] for box in
                     [(0, 0, w, 3), (0, h - 3, w, h), (0, 0, 3, h), (w - 3, 0, w, h)])
        assert gutter <= 2, (key, index, 'visible cell bleed', gutter)
        all_bounds = region.getbbox()
        assert all_bounds, (key, index, 'empty cell')
        measurements = {}
        pixels = region.load()
        for threshold in (2, 8, 32):
            bounds = region.point(lambda value: 255 if value >= threshold else 0).getbbox()
            assert bounds, (key, index, threshold, 'empty measured silhouette')
            left, top, right, bottom = bounds
            cx, cy = (left + right) / 2, (top + bottom) / 2
            count, radius_squared = 0, 0
            for y in range(top, bottom):
                for x in range(left, right):
                    if pixels[x, y] < threshold:
                        continue
                    count += 1
                    dx = max(abs(x - cx), abs(x + 1 - cx))
                    dy = max(abs(y - cy), abs(y + 1 - cy))
                    radius_squared = max(radius_squared, dx * dx + dy * dy)
            measurements[str(threshold)] = {
                'bounds': [x0 + left, y0 + top, right - left, bottom - top],
                'center': [x0 + cx, y0 + cy], 'pixels': count,
                'radius': math.sqrt(radius_squared),
                'cellOccupancy': count / (w * h),
            }
        useful = measurements['2']
        assert measurements['32']['pixels'] > 500, (key, index, 'insufficient visible artwork')
        bx, by, ex, ey = all_bounds
        source = [x0 + bx, y0 + by, ex - bx, ey - by]
        anchor = useful['center']
        if key == 'spark':
            # Map the useful cutout to a normalized box. Runtime maps the box
            # into the historical segment plus round caps, then clips exactly.
            _, _, aw, ah = useful['bounds']
            assert aw / ah > 3, (key, index, 'one horizontal filament expected')
            scale_x, scale_y = 2 / aw, 2 / ah
        else:
            scale_x = scale_y = 1 / useful['radius']
        visible = sum(region.histogram()[1:])
        frames['age-' + str(index)] = {
            'cell': cell, 'source': source, 'alphaBounds': source,
            'anchorBounds': useful['bounds'], 'anchorAlphaThreshold': 2,
            'anchors': {'sourceOrigin': anchor, 'origin': [0, 0]},
            'target': [(source[0] - anchor[0]) * scale_x,
                       (source[1] - anchor[1]) * scale_y,
                       source[2] * scale_x, source[3] * scale_y],
            'size': [2, 2], 'sourceRadius': useful['radius'],
            'visiblePixels': visible, 'anchorPixels': useful['pixels'],
            'strongPixels': measurements['32']['pixels'],
            'alpha1PixelsExcludedFromMeasurement': visible - useful['pixels'],
            'measurements': measurements, 'usage': 'runtime',
            'maxCellGutterAlpha': gutter,
            'normalization': 'useful-bounds-to-unit-box' if key == 'spark' else 'useful-support-to-unit-circle',
            'runtimeClip': 'historical-round-capped-segment-width-2' if key == 'spark' else 'historical-circle-radius-size',
        }
    assert original == path.read_bytes(), 'Original PNG must remain byte-identical'
    layout[key] = {'image': 'assets/painted/particle-impacts/' + key + '.png',
                   'size': [width, height], 'grid': [3, 2], 'columns': columns, 'rows': rows,
                   'cells': cells, 'frames': frames}
    files.append({'id': key, 'path': layout[key]['image'], 'bytes': len(original),
                  'sha256': hashlib.sha256(original).hexdigest(), 'dimensions': [width, height], 'mode': im.mode,
                  'frames': 6, 'runtimeFrames': 6, 'referenceFrames': 0,
                  'transparentFraction': round(transparent, 6),
                  'maxCellGutterAlpha': max(f['maxCellGutterAlpha'] for f in frames.values()),
                  'originalBytesUnchanged': True})

manifest = {
    'schema': 1, 'version': '0.15.11', 'generator': 'image_gen built-in',
    'canonIds': ['AS22'], 'atlasCount': 2, 'frameCount': 12,
    'runtimeFrameCount': 12, 'referenceFrameCount': 0, 'files': files,
    'scope': 'Six nonlooping texture ages for existing spark and blast particles only.',
    'pixelPolicy': 'Selected original PNG bytes retained. Source rectangles and measurements only; no pixel edits.',
    'anchorPolicy': 'Source crops retain every alpha>0 pixel. Centers and useful envelopes use alpha>=2 after comparing thresholds 2, 8 and 32. Alpha-1 residue is excluded from anchor measurement only.',
    'sparkPolicy': 'The particle position is the historical segment head, the tail is position minus 0.025 times current velocity. Width stays 2 with round caps of radius 1. Sprite size is not taken from particle.size. All drawing stays clipped to that capsule.',
    'blastPolicy': 'One small particle, centered on its existing position and clipped to the historical circle of radius particle.size. It is not a complete explosion and never uses the 90-unit damage radius.',
    'physicalPolicy': 'No emitter, particle, collider, material class, RNG draw, lifetime, velocity, trajectory or saved field is added. Caller alpha and simulation counts remain unchanged.',
    'fallbackPolicy': 'Custom colors, unsupported types, missing/invalid images and invalid or degenerate geometry keep the vector fallback.',
    'motionPolicy': 'Frames follow 1-life/maxLife; reduced motion fixes age-0 while positions, current spark orientation, radius, alpha and expiration stay simulated.',
    'acceptance': 'Partial AS22 reception only. Material-specific impacts, ricochets, flames, debris, persistent traces, native performance and human approval remain open.',
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'src/painted-particle-impacts-layout.mjs').write_text(
    '/** Measured source rectangles and useful envelopes only. Original PNG bytes are unchanged. */\n'
    'export const PAINTED_PARTICLE_IMPACTS_LAYOUT = ' + json.dumps(layout, ensure_ascii=False, indent=2) + ';\n')
print('Particle impacts: 2 original atlases / 12 runtime ages; PNG bytes unchanged')
