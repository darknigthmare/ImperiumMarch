#!/usr/bin/env python3
"""Index selected original MI13 PNGs. Writes metadata only; never edits image pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/foundry-sites'
ANCHORS = json.loads((OUT / 'anchors.json').read_text())
SPECS = {
    'valves': ['closed', 'warning', 'jet', 'open', 'destroyed', 'wheel'],
    'cranes': ['idle', 'working', 'received', 'quarantine', 'hook'],
    'consoles': ['console-idle', 'console-working', 'console-complete', 'manifest-sealed', 'manifest-copied', 'manifest-destroyed'],
    'thermal': ['deck-hot', 'deck-cooling', 'deck-cooled', 'vent-rest', 'vent-warning', 'vent-jet'],
}
rounded = lambda xs: [round(float(x), 9) for x in xs]
layout, files = {}, []
for key, names in SPECS.items():
    path = OUT / f'{key}.png'
    original = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA' and im.size == (1536, 1024), (key, im.mode, im.size)
    alpha = im.getchannel('A')
    hist = alpha.histogram()
    assert hist[0] / (im.width * im.height) > .35 and alpha.getextrema()[1] >= 230, (key, 'Opaque subject and transparent background required')
    frames, gutters = {}, []
    for index in range(6):
        x, y, w, h = index % 3 * 512, index // 3 * 512, 512, 512
        cell = alpha.crop((x, y, x+w, y+h))
        gutter = max(cell.crop(box).getextrema()[1] for box in [(0,0,w,3), (0,h-3,w,h), (0,0,3,h), (w-3,0,w,h)])
        assert gutter <= 2, (key, index, 'Visible pixel in atlas gutter', gutter)
        gutters.append(gutter)
        box = cell.point(lambda a: 255 if a >= 32 else 0).getbbox()
        if index >= len(names):
            assert box is None, (key, index, 'Unused cell must contain no visible subject')
            continue
        name = names[index]
        assert box and min(box[:2]) > 2 and max(box[2:]) < 510, (key, name, box)
        left, top, right, bottom = box[0]-2, box[1]-2, box[2]+2, box[3]+2
        measures = ANCHORS[key]
        if key == 'consoles': measures = measures[name.split('-')[0]]
        if key == 'thermal': measures = measures[name.split('-')[0]]
        if name in ['wheel', 'hook']: measures = measures[name]
        px, py = measures.get('ground', measures.get('pivot'))
        sx, sy = measures['scale']
        frames[name] = {
            'cell': [x,y,w,h], 'source': [x+left,y+top,right-left,bottom-top],
            'target': rounded([(left-px)*sx,(top-py)*sy,(right-left)*sx,(bottom-top)*sy]),
            'usage': 'runtime', 'anchors': {'sourcePivot': [x+px,y+py], 'pivot': [0,0]},
        }
        if key == 'valves' and name != 'wheel':
            axle = ANCHORS[key]['wheelAxle']
            frames[name]['wheelAxle'] = rounded([(axle[0]-px)*sx,(axle[1]-py)*sy])
        if key == 'cranes' and name != 'hook':
            hoist = ANCHORS[key]['hoist']
            frames[name]['hoist'] = rounded([(hoist[0]-px)*sx,(hoist[1]-py)*sy])
        if key == 'thermal' and name.startswith('deck-'):
            frames[name]['tile'] = {'source': [x+27,y+236,460,118], 'width': 96, 'height': 24}
    assert path.read_bytes() == original, 'Indexer must preserve original PNG bytes'
    layout[key] = {'image': f'assets/painted/foundry-sites/{key}.png', 'size': list(im.size), 'grid': [3,2],
                   'frames': frames, 'emptyCells': list(range(len(names),6))}
    files.append({'id': key, 'path': layout[key]['image'], 'bytes':len(original), 'sha256': hashlib.sha256(original).hexdigest(),
                  'dimensions': list(im.size), 'mode':im.mode, 'frames':len(frames), 'runtimeFrames':len(frames), 'referenceFrames':0,
                  'transparentFraction':round(hist[0]/(im.width*im.height),6), 'alphaRange':list(alpha.getextrema()),
                  'maxCellGutterAlpha':max(gutters), 'emptyCells':layout[key]['emptyCells'], 'originalBytesUnchanged':True})
manifest = {'schema':1,'version':'0.15.7','generator':'image_gen built-in','canonIds':['MI13','PL04','PT03'],
            'atlasCount':len(files),'frameCount':sum(f['frames'] for f in files),'runtimeFrameCount':sum(f['frames'] for f in files),
            'referenceFrameCount':0,'files':files,'layout':'src/painted-foundry-sites-layout.mjs','anchors':'assets/painted/foundry-sites/anchors.json',
            'scope':'MI13 existing valves, cranes, terminals, manifests, thermal decks and steam outlets; no new simulated body, stock, evidence or damage state.',
            'pixelPolicy':'Selected original PNG files copied byte-for-byte. Indexing measures alpha, source rectangles and pivots only.',
            'physicalSurface':'Deck slices follow foundrySurfaceAt. Warning/jet vapor and danger extents remain procedural. Crane hook is presentation only and does not change cargo positions.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/painted-foundry-sites-layout.mjs').write_text('/** Generated metadata of original MI13 PNGs; see tools/index-painted-foundry-sites.py. */\nexport const PAINTED_FOUNDRY_SITES_LAYOUT = '+json.dumps(layout,ensure_ascii=False,indent=2)+';\n')
print(json.dumps({k:manifest[k] for k in ['atlasCount','frameCount','runtimeFrameCount','referenceFrameCount']}))
