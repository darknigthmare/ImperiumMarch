#!/usr/bin/env python3
"""Measure original Thyr scenery PNGs; never alter image pixels."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/thyr-scenery'
SPECS = {
    'terrain': {
        'columns': [0, 887, 1774], 'rows': [0, 444, 887],
        'names': ['dark-humus', 'fibrous-clay', 'mossy-shale', 'layered-peat'],
    },
    'props': {
        'columns': [0, 512, 1024, 1536], 'rows': [0, 512, 1024],
        'names': ['moss-stone', 'fallen-leaves', 'dead-bark', 'ground-fern', 'seed-husks', 'lichen-pebble'],
    },
}
ORIGINALS = {
    'terrain': 'exec-0d4f010e-4df2-4120-bcfe-a08a6944665e.png',
    'props': 'exec-37d57983-77e2-461f-8d61-afc41bfc3b6b.png',
}
layout, files = {}, []
for key, spec in SPECS.items():
    path = OUT / f'{key}.png'
    original = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'RGBA expected')
    assert list(im.size) == [spec['columns'][-1], spec['rows'][-1]]
    alpha = im.getchannel('A'); histogram = alpha.histogram()
    transparent = histogram[0] / (im.width * im.height)
    assert transparent > (.28 if key == 'terrain' else .7)
    frames, cells = {}, []
    cols = len(spec['columns']) - 1
    for i, name in enumerate(spec['names']):
        row, col = divmod(i, cols)
        x0, x1 = spec['columns'][col:col+2]; y0, y1 = spec['rows'][row:row+2]
        cell = [x0, y0, x1-x0, y1-y0]; cells.append(cell)
        region = alpha.crop((x0, y0, x1, y1)); w, h = region.size
        gutter = max(region.crop(box).getextrema()[1] for box in [(0,0,w,3),(0,h-3,w,h),(0,0,3,h),(w-3,0,w,h)])
        assert gutter <= 2, (key, name, 'visible pixels cross measured cell', gutter)
        bounds = region.point(lambda value: 255 if value >= 32 else 0).getbbox()
        assert bounds, (key, name)
        bx, by, ex, ey = bounds[0]+x0, bounds[1]+y0, bounds[2]+x0, bounds[3]+y0
        sx, sy = max(x0, bx-2), max(y0, by-2)
        sw, sh = min(x1, ex+2)-sx, min(y1, ey+2)-sy
        anchor = [(bx+ex)/2, ey]
        scale = 32/(ex-bx)
        if key == 'terrain':
            anchor = [bx, by]; scale = 512/(ex-bx)
        frame = {
            'cell': cell, 'source': [sx, sy, sw, sh],
            'alphaBounds': [bx, by, ex-bx, ey-by],
            'target': [round((sx-anchor[0])*scale, 9), round((sy-anchor[1])*scale, 9), round(sw*scale, 9), round(sh*scale, 9)],
            'size': [round((ex-bx)*scale, 9), round((ey-by)*scale, 9)],
            'anchors': {'sourceOrigin': anchor, 'origin': [0, 0]},
            'usage': 'runtime', 'maxCellGutterAlpha': gutter,
        }
        if key == 'terrain':
            # A fully interior material window avoids low-alpha cutout borders
            # at tile joins. It is a drawImage crop, never a pixel rewrite.
            frame['materialSource'] = [bx+8, by+8, ex-bx-16, ey-by-16]
            material = alpha.crop((bx+8, by+8, ex-8, ey-8))
            frame['materialAlphaRange'] = list(material.getextrema())
            assert frame['materialAlphaRange'][0] >= 200, (name, 'material window must remain opaque enough')
        frames[name] = frame
    assert original == path.read_bytes()
    layout[key] = {'image': f'assets/painted/thyr-scenery/{key}.png', 'size': list(im.size),
                   'columns': spec['columns'], 'rows': spec['rows'], 'cells': cells, 'frames': frames}
    files.append({'id': key, 'path': layout[key]['image'], 'bytes': len(original),
                  'sha256': hashlib.sha256(original).hexdigest(), 'dimensions': list(im.size), 'mode': im.mode,
                  'frames': len(frames), 'runtimeFrames': len(frames), 'referenceFrames': 0,
                  'transparentFraction': round(transparent, 6), 'maxCellGutterAlpha': max(f['maxCellGutterAlpha'] for f in frames.values()),
                  'originalBytesUnchanged': True})
manifest = {
    'schema': 1, 'version': '0.15.10', 'generator': 'image_gen built-in',
    'canonIds': ['PL03', 'MI09', 'MI10', 'MI11', 'MI12'],
    'atlasCount': len(files), 'frameCount': sum(f['frames'] for f in files),
    'runtimeFrameCount': 10, 'referenceFrameCount': 0, 'files': files,
    'scope': 'Thyr terrain materials and forest-floor scenery in existing decorative ground slots only.',
    'pixelPolicy': 'Selected original generated PNG bytes retained. Alpha measurement, material crops and metadata only. No script edits to pixels.',
    'layoutPolicy': 'Measured cells with half-pixel rounding handled independently. Visible alpha bounds and interior material rectangles are metadata; PNG bytes remain unchanged.',
    'physicalPolicy': 'Terrain is clipped at terrainAt. Living roots, chemical channels, voice ledges, relays and their support surfaces remain unchanged. No collider, actor, nesting site, ecology or plant response is introduced. Existing FL07/FL08/FL09 and fauna keep their separate graphics and facts.',
}
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
(ROOT/'src/painted-thyr-scenery-layout.mjs').write_text('/** Measured rectangles only. Original PNG bytes are unchanged. */\nexport const PAINTED_THYR_SCENERY_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
prompts = json.loads((OUT/'prompts.json').read_text())
prompts['selectedOutputs'] = [{'atlas': f['id'], 'originalGeneratedFile': ORIGINALS[f['id']],
                               'sha256': f['sha256'], 'originalBytesUnchanged': True} for f in files]
(OUT/'prompts.json').write_text(json.dumps(prompts, ensure_ascii=False, indent=2)+'\n')
print(f"Thyr scenery: {manifest['atlasCount']} original atlases / {manifest['frameCount']} runtime cells")
