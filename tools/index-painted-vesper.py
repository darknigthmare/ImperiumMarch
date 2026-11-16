#!/usr/bin/env python3
"""Index Vesper source PNGs without ever rewriting their pixels."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/vesper'
NETWORK = ['active', 'disabled', 'damaged', 'disabled-damaged', 'destroyed']
NAMES = {
    'military': NETWORK, 'dispensary': NETWORK, 'housing': NETWORK,
    'outposts': ['depot', 'filter-crate', 'maintenance', 'maintenance-damaged', 'maintenance-destroyed', 'record-terminal'],
    'machinery': ['pump-disconnected', 'pump-connected', 'turbine-hot', 'turbine-cooled', 'turbine-rotor', 'radio-unavailable', 'radio-available', 'radio-contacted'],
    'civilworks': ['slab-winch', 'slab-wheel', 'harpoon-latched', 'harpoon-released', 'harpoon-reel', 'terminal-exposed', 'terminal-protected', 'pipe', 'slab'],
}
edge = lambda x: math.floor(x + .5)
layout, files = {}, []
for key, names in NAMES.items():
    path = OUT / (key + '.png')
    original = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA'
    alpha = im.getchannel('A'); histogram = alpha.histogram()
    assert histogram[0] / (im.width * im.height) > .4, (key, 'transparent cutout required')
    frames, cells, empty = {}, [], []
    row_count = 3 if key in ['machinery', 'civilworks'] else 2
    rows = [0, 370, 730, 1024] if key == 'civilworks' else [edge(i * im.height / row_count) for i in range(row_count + 1)]
    for i in range(3 * row_count):
        row, col = i // 3, i % 3
        columns = ([0, 710, 1090, 1536] if row == 0 else [0, 512, 1080, 1536]) if key == 'outposts' else [edge(j * im.width / 3) for j in range(4)]
        x0, x1 = columns[col:col+2]; y0, y1 = rows[row:row+2]
        cell = [x0, y0, x1-x0, y1-y0]; cells.append(cell)
        region = alpha.crop((x0, y0, x1, y1)); w, h = region.size
        gutter = max(region.crop(box).getextrema()[1] for box in [(0,0,w,3),(0,h-3,w,h),(0,0,3,h),(w-3,0,w,h)])
        assert gutter <= 2, (key, i, 'measured cell crosses visible pixels', gutter)
        bounds = region.point(lambda value: 255 if value >= 32 else 0).getbbox()
        if i >= len(names):
            assert region.getextrema()[1] <= 2, (key, i, 'reserved cell must be empty')
            empty.append(i); continue
        assert bounds, (key, i)
        bx, by, ex, ey = bounds[0]+x0, bounds[1]+y0, bounds[2]+x0, bounds[3]+y0
        sx, sy = max(x0,bx-2), max(y0,by-2)
        sw, sh = min(x1,ex+2)-sx, min(y1,ey+2)-sy
        name = names[i]
        anchor = [(bx+ex)/2, ey]; world = [0,0]
        scale = [1,1]; pivot = None
        if key == 'military': scale = [64/167,198/478]
        elif key == 'dispensary': scale = [160/461,184/307]
        elif key == 'housing': scale = [170/522,156/302]
        elif key == 'outposts':
            if name == 'depot': scale = [228/(ex-bx),121/(ey-by)]
            elif name == 'filter-crate': scale = [24/(ex-bx),14/(ey-by)]
            elif name.startswith('maintenance'): scale = [152/382,160/425]
            else: scale = [42/(ex-bx),59/(ey-by)]
        elif key == 'machinery':
            if name.startswith('pump-'): scale = [72/393,50/196]
            elif name.startswith('turbine-') and name != 'turbine-rotor':
                # The bitmap socket joins the pre-existing world rotor at y=-71.
                pivot = [x0+247, y0+117]
                anchor = [pivot[0],ey]; scale = [90/279,71/(ey-pivot[1])]
            elif name == 'turbine-rotor':
                anchor = [x0+254,y0+158]; scale = [72/274,72/274]; world = [0,0]
            else: scale = [44/170,107/297]
        else:
            if name == 'slab-winch':
                anchor = [272,ey]; scale = [74/457,31/(ey-181)]; pivot = [272,181]
            elif name == 'slab-wheel':
                anchor = [768,207]; scale = [32/266,32/266]
            elif name in ['harpoon-latched','harpoon-released']:
                pivot = [x0+253,205 if name == 'harpoon-latched' else 554]
                anchor = [pivot[0],ey]; scale = [81/464,27/(ey-pivot[1])]
            elif name == 'harpoon-reel':
                anchor = [768,555]; scale = [36/279,36/279]
            elif name.startswith('terminal-'): scale = [36/(ex-bx),25/(ey-by)]
            elif name == 'pipe': scale = [80/(ex-bx),13/(ey-by)]
            else: scale = [28/(ex-bx),13/(ey-by)]
        item = {'cell':cell,'source':[sx,sy,sw,sh], 'alphaBounds':[bx,by,ex-bx,ey-by],
                'target':[round((sx-anchor[0])*scale[0]+world[0],9), round((sy-anchor[1])*scale[1]+world[1],9), round(sw*scale[0],9), round(sh*scale[1],9)],
                'usage':'runtime','anchors':{'sourceOrigin':anchor,'origin':world},'maxCellGutterAlpha':gutter}
        if pivot: item['anchors']['sourcePivot']=pivot; item['anchors']['pivot']=[round((pivot[j]-anchor[j])*scale[j],9) for j in range(2)]
        frames[name]=item
    assert original == path.read_bytes(), 'PNG mutation is forbidden'
    layout[key]={'image':f'assets/painted/vesper/{key}.png','size':list(im.size),'grid':[3,row_count],'cells':cells,'emptyCells':empty,'frames':frames}
    files.append({'id':key,'path':layout[key]['image'],'bytes':len(original),'sha256':hashlib.sha256(original).hexdigest(),'dimensions':list(im.size),'mode':im.mode,
                  'frames':len(frames),'runtimeFrames':len(frames),'referenceFrames':0,'transparentFraction':round(histogram[0]/(im.width*im.height),6),
                  'maxCellGutterAlpha':max(f['maxCellGutterAlpha'] for f in frames.values()),'originalBytesUnchanged':True})
manifest={'schema':1,'version':'0.15.7','generator':'image_gen built-in','canonIds':['MI01','MI02','MI03','MI04','PL01','PT01'],
          'atlasCount':len(files),'frameCount':sum(f['frames'] for f in files),'runtimeFrameCount':38,'referenceFrameCount':0,'files':files,
          'scope':'Existing Vesper equipment and buildings only. No new actors, damage states, evidence or physical surfaces.',
          'pixelPolicy':'Selected original generated PNG bytes retained. Alpha measurement and rectangles only. No image editing by scripts.',
          'layoutPolicy':'Outpost cells and civilworks rows are measured individually. Do not assume an equally spaced grid. Network ruins share intact pixel scale and stay short.',
          'physicalPolicy':'Doors and boxes share their real ground. Rotor, handwheel and reel use measured source pivots. Cable endpoints, pipe gaps and slabs remain simulation geometry.',
          'recovery':'No byte source for the earlier unpublished 0.15.7 was recoverable. This lot is freshly generated against verified public 0.15.6.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/painted-vesper-layout.mjs').write_text('/** Measured metadata only; original PNG bytes unchanged. */\nexport const PAINTED_VESPER_LAYOUT = '+json.dumps(layout,ensure_ascii=False,indent=2)+';\n')
print(f"Vesper: {manifest['atlasCount']} original atlases / {manifest['frameCount']} runtime cells")
