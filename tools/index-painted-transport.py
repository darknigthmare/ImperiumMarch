#!/usr/bin/env python3
"""Measure generated originals and emit only metadata; PNG bytes stay untouched."""
import hashlib
import json
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/transport'
SPECS = {
    'locomotive': {'grid': [2, 2], 'ids': ['MI02'], 'names': ['intact', 'damaged', 'wreck', 'wheel']},
    'wagons': {'grid': [4, 2], 'ids': ['MI02'], 'names': ['ore-intact', 'ore-damaged', 'ore-wreck', 'hostages-closed', 'hostages-damaged', 'hostages-wreck', 'hostages-open', 'hostages-open-damaged']},
    'carrier': {'grid': [2, 2], 'ids': ['MI13', 'PL04'], 'names': ['intact', 'damaged', 'wreck', 'wheel']},
    'cargo': {'grid': [2, 2], 'ids': ['MI13', 'PT03'], 'names': ['sealed', 'copied', 'damaged', 'destroyed']},
}
edge = lambda n: math.floor(n + .5)
rounded = lambda xs: [round(float(x), 8) for x in xs]
anchors = json.loads((OUT / 'anchors.json').read_text())
layout, files = {}, []
for key, spec in SPECS.items():
    path = OUT / f'{key}.png'
    raw = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'RGBA required')
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > im.width * im.height * .15, (key, 'Transparency required')
    assert sum(histogram[128:]) > 1000, (key, 'Solid artwork required')
    cols, rows = spec['grid']
    cells = []
    for i, name in enumerate(spec['names']):
        x0, x1 = edge(i % cols * im.width / cols), edge((i % cols + 1) * im.width / cols)
        y0, y1 = edge(i // cols * im.height / rows), edge((i // cols + 1) * im.height / rows)
        mask = alpha.crop((x0, y0, x1, y1)).point(lambda v: 255 if v >= 32 else 0)
        box = mask.getbbox()
        assert box and box[0] > 0 and box[1] > 0 and box[2] < x1-x0 and box[3] < y1-y0, (key, name, 'Clipped cell', box)
        cells.append({'name': name, 'cell': [x0, y0, x1-x0, y1-y0], 'ink': list(box)})
    frames = {}
    for i, cell in enumerate(cells):
        name = cell['name']
        x0, y0, cw, ch = cell['cell']
        l, t, r, b = cell['ink']
        left, top, right, bottom = max(0,l-2), max(0,t-2), min(cw,r+2), min(ch,b+2)
        wheel = name == 'wheel'
        base = cells[3 if key == 'wagons' and name.startswith('hostages') else 0]['ink']
        bl, bt, br, bb = base
        if wheel:
            # Circular rotation uses the actual axle centre, not a cell centre.
            sx, sy = 2/(r-l), 2/(b-t)
            px, py = (l+r)/2, (t+b)/2
            nominal, pivot, role = [1,1], [0,0], 'axle'
        elif key == 'locomotive':
            sx, sy = 154/(br-bl), 74/(bb-bt)
            px, py = (l+r)/2, b
            nominal, pivot, role = [154,92], [0,28], 'chassis-bottom'
        elif key == 'wagons':
            occupied = name.startswith('hostages')
            sx, sy = (160 if occupied else 150)/(br-bl), (62 if occupied else 54)/(bb-bt)
            px, py = (l+r)/2, b
            nominal, pivot, role = ([160,80] if occupied else [150,64]), [0,22 if occupied else 14], 'chassis-bottom'
        elif key == 'cargo':
            sx, sy = 100/(br-bl), 76/(bb-bt)
            px, py = (l+r)/2, b
            nominal, pivot, role = [100,76], [0,0], 'cargo-base'
        else:
            # The loading deck is registered to the two real cargo bases. A
            # low cab below the deck avoids drawing cargo through the driver.
            sx = 260/(br-bl)
            sy = anchors['carrier']['verticalScale']
            px, py = (l+r)/2, anchors['carrier']['deckY'][name]
            nominal, pivot, role = [242,48], [0,-24], 'loading-deck'
        target = rounded([pivot[0]+(left-px)*sx, pivot[1]+(top-py)*sy, (right-left)*sx, (bottom-top)*sy])
        item = {'source': [x0+left,y0+top,right-left,bottom-top], 'cell': cell['cell'], 'target': target,
                'nominal': nominal, 'usage': 'runtime', 'anchors': {'role':role,'sourcePivot':rounded([x0+px,y0+py]),'pivot':pivot}}
        if key in ['locomotive', 'wagons'] and not wheel:
            couplers = anchors[key]['couplers'][name]
            item['anchors']['sourceCouplers'] = {side: rounded([x0+point[0], y0+point[1]]) for side, point in couplers.items()}
            item['anchors']['couplers'] = {side: rounded([pivot[0]+(point[0]-px)*sx, pivot[1]+(point[1]-py)*sy]) for side, point in couplers.items()}
        if key == 'wagons' and name.startswith('hostages') and name != 'hostages-wreck':
            wx,wy,ww,wh = anchors['wagons']['window'][name]
            item['window'] = rounded([(wx-px)*sx+pivot[0], (wy-py)*sy+pivot[1], ww*sx, wh*sy])
        frames[name] = item
    layout[key] = {'size': list(im.size), 'grid':spec['grid'], 'frames':frames}
    files.append({'id':key,'file':f'assets/painted/transport/{key}.png','size':list(im.size),'grid':spec['grid'],
                  'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'canonIds':spec['ids'],
                  'transparentPixels':histogram[0],'cells':len(cells),'runtimeCells':len(cells),'referenceCells':0})

manifest = {'version':'0.15.5','method':'Built-in image_gen; original PNG files unchanged; Python only measures alpha and emits metadata.',
            'atlases':len(files),'cells':sum(f['cells'] for f in files),'runtimeCells':sum(f['runtimeCells'] for f in files),
            'files':files,'layout':'src/painted-transport-layout.mjs','prompts':'assets/painted/transport/prompts.json'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/painted-transport-layout.mjs').write_text('/** Generated metadata only; source PNG originals are unchanged. */\nexport const PAINTED_TRANSPORT_LAYOUT = '+json.dumps(layout,ensure_ascii=False,indent=2)+';\n')
print(json.dumps({'atlases':manifest['atlases'],'cells':manifest['cells'],'files':[f['file'] for f in files]}))
