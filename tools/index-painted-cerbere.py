#!/usr/bin/env python3
"""Index original Cerbere PNG and measured mechanical anchors; no pixel edits."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/cerbere'
MEASURED = json.loads((OUT / 'anchors.json').read_text())['frames']
REFERENCES = {'upper-damaged', 'lower-damaged', 'foot-damaged', 'radiator-damaged', 'radiator-repaired'}
rounded = lambda values: [round(float(v), 8) for v in values]
edge = lambda value: math.floor(value + .5)
path = OUT / 'cerbere.png'
raw = path.read_bytes()
im = Image.open(path)
assert im.mode == 'RGBA', 'Expected original RGBA'
alpha = im.getchannel('A')
histogram = alpha.histogram()
assert histogram[0] > im.width * im.height * .15
assert alpha.getextrema() == (0, 255)
frames, cells = {}, []
for index, (name, item) in enumerate(MEASURED.items()):
    col, row = index % 4, index // 4
    x0, x1 = edge(col*im.width/4), edge((col+1)*im.width/4)
    y0, y1 = edge(row*im.height/4), edge((row+1)*im.height/4)
    box = alpha.crop((x0,y0,x1,y1)).point(lambda v: 255 if v >= 32 else 0).getbbox()
    assert box and box[0] > 0 and box[1] > 0 and box[2] < x1-x0 and box[3] < y1-y0, (name, 'Empty/clipped cell', box)
    bx0,by0,bx1,by1 = box
    left,top = max(0,bx0-2),max(0,by0-2)
    right,bottom = min(x1-x0,bx1+2),min(y1-y0,by1+2)
    width,height = right-left,bottom-top
    frame = {'source':[x0+left,y0+top,width,height], 'usage':'reference' if name in REFERENCES else 'runtime'}
    kind = name.split('-')[0]
    if kind in ['upper','lower','turret']:
        pivot,endpoint = item['pivot'],item['endpoint']
        dx,dy = endpoint[0]-pivot[0],endpoint[1]-pivot[1]
        length = 89 if kind == 'turret' else 100
        scale = length/math.hypot(dx,dy)
        frame['target'] = rounded([(left-pivot[0])*scale,(top-pivot[1])*scale,width*scale,height*scale])
        frame['rotation'] = round(-math.atan2(dy,dx),12)
        end_name = 'Muzzle' if kind == 'turret' else 'Endpoint'
        frame['anchors'] = {'sourcePivot':[x0+pivot[0],y0+pivot[1]],'pivot':[0,0],
            'source'+end_name:[x0+endpoint[0],y0+endpoint[1]],end_name.lower():rounded([dx*scale,dy*scale]),'resolved'+end_name:[length,0]}
    elif kind == 'hull':
        ax0,ay0,ax1,ay1 = item['bodyBox']
        sx,sy = 150/(ax1-ax0),78/(ay1-ay0)
        pivot = [(ax0+ax1)/2,(ay0+ay1)/2]
        frame['target'] = rounded([(left-pivot[0])*sx,(top-pivot[1])*sy,width*sx,height*sy])
        frame['anchors'] = {'sourcePivot':rounded([x0+pivot[0],y0+pivot[1]]),'pivot':[0,0],
            'sourceBodyBox':[x0+ax0,y0+ay0,ax1-ax0,ay1-ay0],'bodyBox':[-75,-39,150,78]}
    elif kind in ['hip','knee']:
        pivot = item['pivot']; scale = 28/item['diameter']
        frame['target'] = rounded([(left-pivot[0])*scale,(top-pivot[1])*scale,width*scale,height*scale])
        frame['anchors'] = {'sourcePivot':[x0+pivot[0],y0+pivot[1]],'pivot':[0,0]}
    elif kind == 'foot':
        ankle = item['ankle']; pivot = [ankle[0],item['soleY']]
        # Cerbere's legs are a presentation rig, unlike player contacts. Preserve
        # shoe aspect and connect the shin to its measured ankle above the same
        # unchanged ground contact; do not flatten the armor into an 8-unit gap.
        sx = 64/(item['soleRight']-item['soleLeft']); sy = sx
        frame['target'] = rounded([(left-pivot[0])*sx,(top-pivot[1])*sy,width*sx,height*sy])
        frame['anchors'] = {'sourcePivot':[x0+pivot[0],y0+pivot[1]],'pivot':[0,0],
            'sourceAnkle':[x0+ankle[0],y0+ankle[1]],'ankle':rounded([0,(ankle[1]-pivot[1])*sy]),
            'sourceSole':[[x0+item['soleLeft'],y0+item['soleY']],[x0+item['soleRight'],y0+item['soleY']]],
            'sole':rounded([(item['soleLeft']-pivot[0])*sx,0,(item['soleRight']-pivot[0])*sx,0])}
    else:
        ax0,ay0,ax1,ay1 = item['panelBox']; pivot=[(ax0+ax1)/2,(ay0+ay1)/2]
        sx,sy = 22/(ax1-ax0),50.7/(ay1-ay0)
        frame['target'] = rounded([(left-pivot[0])*sx,(top-pivot[1])*sy,width*sx,height*sy])
        frame['anchors'] = {'sourcePivot':rounded([x0+pivot[0],y0+pivot[1]]),'pivot':[0,0]}
    frames[name] = frame
    cells.append({'name':name,'cell':[x0,y0,x1-x0,y1-y0],'ink':[x0+bx0,y0+by0,bx1-bx0,by1-by0],'source':frame['source']})
layout = {'image':'assets/painted/cerbere/cerbere.png','size':list(im.size),'grid':[4,4],'frames':frames}
(ROOT/'src/painted-cerbere-layout.mjs').write_text('/** Original PNG rectangles and measured anchors. Pixels unchanged. */\nexport const PAINTED_CERBERE_LAYOUT = '+json.dumps(layout,ensure_ascii=False,indent=2)+';\n')
file = {'key':'cerbere','path':layout['image'],'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'size':list(im.size),
    'grid':[4,4],'frames':len(frames),'cells':cells,'alphaRange':list(alpha.getextrema()),'fullyTransparentPixels':histogram[0],
    'runtimeFrames':[n for n in frames if n not in REFERENCES],'referenceFrames':[n for n in frames if n in REFERENCES]}
manifest = {'schema':1,'version':'0.15.4','date':'2026-11-16','title':'Cerbère — montage ennemi peint','generator':'image_gen.imagegen (built-in)',
    'indexer':'tools/index-painted-cerbere.py','runtime':'src/painted-cerbere.mjs','layout':'src/painted-cerbere-layout.mjs',
    'weaponAuthority':'src/cerbere-weapon-pose.mjs','anchorMeasurements':'assets/painted/cerbere/anchors.json',
    'atlases':1,'cells':16,'runtimeCells':11,'referenceCells':5,'files':[file],
    'status':'Prototype intégré. Réception humaine et mécanique finale ouvertes.',
    'provenance':'PNG original conservé sans retouche. Mesures et corrections au rendu seulement. Prompt complet dans prompts.json.',
    'limits':['Aucun nouveau boss, châssis jouable, composant destructible ni cadavre persistant.',
        'Le rig des jambes du boss reste une présentation; il ne simule pas les appuis physiques individuels des six châssis joueurs.',
        'Les cinq variantes de dégâts/réparation de composants restent références; aucune santé locale ennemie n’est inventée.',
        'La bouche du canon peint suit le tir existant de portée locale 89, sans changer projectile, vitesse, dommage ou dispersion.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['atlases','cells','runtimeCells','referenceCells']}))
