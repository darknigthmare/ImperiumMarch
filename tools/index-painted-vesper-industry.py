#!/usr/bin/env python3
"""Measure the selected Vesper industry PNG. Never save or edit image pixels."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/vesper-industry'
path = OUT / 'industry.png'
original = path.read_bytes()
im = Image.open(path)
assert im.mode == 'RGBA' and im.size == (1536, 1024)
alpha = im.getchannel('A')
transparent = alpha.histogram()[0] / (im.width * im.height)
assert transparent > .65
frames = {}
for i, name in enumerate(['silo', 'chimney']):
    x0, y0, x1, y1 = i * 768, 0, (i + 1) * 768, 1024
    region = alpha.crop((x0, y0, x1, y1))
    gutter = max(region.crop(box).getextrema()[1] for box in
                 [(0, 0, 768, 3), (0, 1021, 768, 1024),
                  (0, 0, 3, 1024), (765, 0, 768, 1024)])
    assert gutter <= 1, (name, gutter)
    bounds = {}
    for threshold in [2, 32, 128]:
        b = region.point(lambda a: 255 if a >= threshold else 0).getbbox()
        assert b
        bounds[str(threshold)] = [x0 + b[0], b[1], b[2] - b[0], b[3] - b[1]]
    bx, by, bw, bh = bounds['32']
    ux, uy, uw, uh = bounds['2']
    source = [max(x0, ux - 2), max(y0, uy - 2), 0, 0]
    source[2] = min(x1, ux + uw + 2) - source[0]
    source[3] = min(y1, uy + uh + 2) - source[1]
    frames[name] = {
        'cell': [x0, y0, x1 - x0, y1 - y0], 'source': source,
        'alphaBounds': bounds['32'], 'alphaBoundsByThreshold': bounds,
        'anchors': {'sourceBase': [bx + bw / 2, by + bh],
                    'sourceTop': [bx + bw / 2, by], 'base': [.5, 1]},
        'usage': 'runtime', 'maxCellGutterAlpha': gutter,
    }
layout = {'industry': {'image': 'assets/painted/vesper-industry/industry.png',
                       'size': list(im.size), 'columns': [0, 768, 1536],
                       'rows': [0, 1024], 'frames': frames}}
sha = hashlib.sha256(original).hexdigest()
prompts = json.loads((OUT / 'prompts.json').read_text())
selected = prompts['selectedOutputs'][0]
assert selected['sha256'] == sha and selected['path'] == layout['industry']['image']
source_path = Path(selected['originalGeneratedPath'])
if source_path.exists():
    assert source_path.read_bytes() == original, 'Selected output bytes differ'
manifest = {
    'schema': 1, 'version': '0.15.11', 'generator': 'image_gen built-in',
    'canonIds': ['PL01', 'MI01', 'MI02', 'MI03', 'MI04'],
    'atlasCount': 1, 'frameCount': 2, 'runtimeFrameCount': 2, 'referenceFrameCount': 0,
    'files': [{'id': 'industry', 'path': layout['industry']['image'], 'bytes': len(original),
               'sha256': sha, 'dimensions': list(im.size), 'mode': im.mode,
               'frames': 2, 'runtimeFrames': 2, 'referenceFrames': 0,
               'transparentFraction': round(transparent, 9),
               'maxCellGutterAlpha': max(f['maxCellGutterAlpha'] for f in frames.values()),
               'originalGeneratedFile': selected['originalGeneratedFile'],
               'originalBytesUnchanged': True}],
    'scope': 'Two PL01 midground structures in the existing drawIndustry slots.',
    'pixelPolicy': 'Selected original PNG bytes retained exactly. The indexer writes metadata only.',
    'layoutPolicy': 'Alpha >=32 defines the visible envelope and base. Source crops retain all alpha >=2 plus two pixels. Residual alpha 1 outside crops is not used for placement. The runtime clips to each historical envelope; no PNG pixel is changed.',
    'geometry': {'silo': {'xOffset': -6, 'top': '584-h', 'width': 86, 'height': 'h+16', 'baseY': 600},
                 'chimney': {'xOffset': 89, 'top': '541-h', 'width': 25, 'height': 'h+59', 'baseY': 600}},
    'reuse': {'maintenance': 'Existing assets/painted/vesper/outposts.png, normal maintenance frame, 96x101 at base x+195,y599. Not a new cell.'},
    'physicalPolicy': 'No collider, terrain sample, actor, smoke emitter, ecological effect, mission state or saved data. The parent renderer retains translate(0,180), scale(1,.75), camera parallax .32, spacing 620 and its historical heights and smoke.',
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'src/painted-vesper-industry-layout.mjs').write_text(
    '/** Measured metadata only; selected PNG bytes remain unchanged. */\n'
    'export const PAINTED_VESPER_INDUSTRY_LAYOUT = ' + json.dumps(layout, indent=2) + ';\n')
assert path.read_bytes() == original
print('Vesper industry: 1 original atlas / 2 runtime cells; PNG bytes unchanged')
