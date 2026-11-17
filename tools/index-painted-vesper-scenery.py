#!/usr/bin/env python3
"""Measure original Vesper scenery PNGs; never alter image pixels."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/vesper-scenery'
SPECS = {
    'terrain': {
        'columns': [0, 887, 1774], 'rows': [0, 450, 887],
        'names': ['shale', 'basalt', 'sediment', 'scoria'],
    },
    'props': {
        'columns': [0, 512, 1024, 1536], 'rows': [0, 512, 1024],
        'names': ['slate-rock', 'basalt-rock', 'scoria-rock', 'crust-lichen', 'fan-lichen', 'slate-rubble'],
    },
    'viaduct': {
        'columns': [0, 365, 930, 1536], 'rows': [0, 596, 1024],
        'names': ['pier', 'brace', 'deck', 'stanchion', 'sleeper', 'tie-rod'],
    },
}
ORIGINALS = {
    'terrain': 'exec-d9620ee8-56af-4c84-aa4b-ce1865d8560d.png',
    'props': 'exec-8dfb1d74-c111-44a3-a2b0-5b9a505f3687.png',
    'viaduct': 'exec-a980240d-ad0d-4b87-99e4-11b18fef53f7.png',
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
    assert transparent > (.3 if key == 'terrain' else .7)
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
        elif name == 'pier':
            anchor = [(bx+ex)/2, by]; scale = 88/(ex-bx)
        elif name == 'deck':
            anchor = [bx, by]; scale = 192/(ex-bx)
        elif name == 'stanchion':
            scale = 39/(ey-by)
        elif key == 'viaduct':
            anchor = [bx, (by+ey)/2]
            scale = (14 if name == 'sleeper' else 238)/(ex-bx)
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
        frames[name] = frame
    assert original == path.read_bytes()
    layout[key] = {'image': f'assets/painted/vesper-scenery/{key}.png', 'size': list(im.size),
                   'columns': spec['columns'], 'rows': spec['rows'], 'cells': cells, 'frames': frames}
    files.append({'id': key, 'path': layout[key]['image'], 'bytes': len(original),
                  'sha256': hashlib.sha256(original).hexdigest(), 'dimensions': list(im.size), 'mode': im.mode,
                  'frames': len(frames), 'runtimeFrames': len(frames), 'referenceFrames': 0,
                  'transparentFraction': round(transparent, 6), 'maxCellGutterAlpha': max(f['maxCellGutterAlpha'] for f in frames.values()),
                  'originalBytesUnchanged': True})
manifest = {
    'schema': 1, 'version': '0.15.8', 'generator': 'image_gen built-in',
    'canonIds': ['PL01', 'MI01', 'MI02', 'MI03', 'MI04'],
    'atlasCount': len(files), 'frameCount': sum(f['frames'] for f in files),
    'runtimeFrameCount': 16, 'referenceFrameCount': 0, 'files': files,
    'scope': 'Vesper terrain material, existing decorative ground slots, and MI02 viaduct presentation only.',
    'pixelPolicy': 'Selected original generated PNG bytes retained. Alpha measurement, material crops and metadata only. No script edits to pixels.',
    'layoutPolicy': 'Measured cells. Viaduct columns 0/365/930/1536 and rows 0/596/1024 are intentionally not an equal grid.',
    'physicalPolicy': 'Terrain is clipped at terrainAt. Maintenance deck follows the same surface; railway gaps and vector rail endpoints are unchanged. No new collider, actor, light mechanic or plant interaction.',
}
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
(ROOT/'src/painted-vesper-scenery-layout.mjs').write_text('/** Measured rectangles only. Original PNG bytes are unchanged. */\nexport const PAINTED_VESPER_SCENERY_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
prompts = json.loads((OUT/'prompts.json').read_text())
prompts['selectedOutputs'] = [{'atlas': f['id'], 'originalGeneratedFile': ORIGINALS[f['id']],
                               'sha256': f['sha256'], 'originalBytesUnchanged': True} for f in files]
(OUT/'prompts.json').write_text(json.dumps(prompts, ensure_ascii=False, indent=2)+'\n')
print(f"Vesper scenery: {manifest['atlasCount']} original atlases / {manifest['frameCount']} runtime cells")
