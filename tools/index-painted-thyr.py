#!/usr/bin/env python3
"""Measure original Thyr atlases and emit source crops/registration metadata.

No image is resized, recolored or rewritten. Actual cell boundaries, including
the unequal habitat rows, describe the generated artwork rather than assuming
a dimension which the generator did not produce. Physics stays in simulation.
"""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/thyr'
SPECS = {
    'longuedorse-adult': {'grid':[4,2], 'ids':['FU07'], 'names':['waiting','walk-0','walk-1','walk-2','walk-3','arrived','diverted','dead']},
    'longuedorse-young': {'grid':[4,2], 'ids':['FU07'], 'names':['waiting','walk-0','walk-1','walk-2','walk-3','arrived','diverted','dead']},
    'fan-colony': {'grid':[3,2], 'ids':['FU08'], 'names':['settled','fly-0','fly-1','fly-2','fly-3','lost']},
    'column': {'grid':[3,2], 'ids':['FL07'], 'names':['normal','damaged','destroyed','normal-alt','damaged-alt','destroyed-alt']},
    'habitat': {'grid':[3,2], 'rowEdges':[0,500,724], 'ids':['PL03','FL07'], 'names':['home-normal','home-damaged','home-destroyed','root-normal','root-damaged','root-destroyed']},
    'plants': {'grid':[4,2], 'ids':['FL08','FL09'], 'names':['vine-normal','vine-inhale','vine-wilted','vine-burnt','grass-calm','grass-left','grass-right','grass-flattened']},
    'leth': {'grid':[4,2], 'ids':['PN06','MI11','FA05'], 'names':['waiting','listening','speaking-0','speaking-1','refusing','lost','recorder','staff']},
    'rootwatcher': {'grid':[4,3], 'ids':['FU09','OP03'], 'names':['idle']+[f'walk-{i}' for i in range(8)]+['windup','attack','dead']},
}
REFERENCE = {('plants','grass-flattened'),('leth','recorder'),('leth','staff'),('rootwatcher','dead')}
edge = lambda value: math.floor(value+.5)
rounds = lambda values: [round(float(v),8) for v in values]
layout,files = {},[]

def horizontal_anchor(alpha, cell, box, band=30):
    """Base stalk/trunk centre from a narrow band above the bottom of its ink."""
    x0,y0,w,h = cell
    bx0,by0,bx1,by1 = box
    mask = alpha.crop((x0,y0+max(by0,by1-band),x0+w,y0+by1)).point(lambda v:255 if v>=96 else 0)
    support = mask.getbbox()
    return (support[0]+support[2])/2 if support else (bx0+bx1)/2

for key,spec in SPECS.items():
    path = OUT/f'{key}.png'; raw = path.read_bytes(); im=Image.open(path)
    assert im.mode=='RGBA',(key,'Expected RGBA original')
    alpha=im.getchannel('A');hist=alpha.histogram()
    assert hist[0]>im.width*im.height*.15,(key,'No transparent background')
    assert alpha.getextrema()[1]>=200,(key,'No opaque subject')
    cols,rows=spec['grid'];row_edges=spec.get('rowEdges',[edge(i*im.height/rows) for i in range(rows+1)])
    assert row_edges[0]==0 and row_edges[-1]==im.height,(key,'Unexpected row geometry')
    cells=[]
    for i,name in enumerate(spec['names']):
        x0,x1=edge((i%cols)*im.width/cols),edge((i%cols+1)*im.width/cols)
        y0,y1=row_edges[i//cols],row_edges[i//cols+1]
        cell=[x0,y0,x1-x0,y1-y0]
        box=alpha.crop((x0,y0,x1,y1)).point(lambda v:255 if v>=32 else 0).getbbox()
        assert box and box[0]>0 and box[1]>0 and box[2]<x1-x0 and box[3]<y1-y0,(key,name,'Empty/clipped cell',box)
        left,top=max(0,box[0]-2),max(0,box[1]-2)
        right,bottom=min(x1-x0,box[2]+2),min(y1-y0,box[3]+2)
        cells.append({'name':name,'cell':cell,'ink':list(box),'crop':[left,top,right-left,bottom-top]})
    frames={};measured_cells=[]
    for i,c in enumerate(cells):
        name=c['name'];x0,y0,_,_=c['cell'];bx0,by0,bx1,by1=c['ink'];left,top,w,h=c['crop']
        anchor_name='ground';anchor=[0,0]
        if key.startswith('longuedorse-'):
            first=cells[0]['ink'];target_height=94 if key.endswith('adult') else 64
            sx=sy=target_height/(first[3]-first[1]);px=(first[0]+first[2])/2;py=by1-1
        elif key=='rootwatcher':
            first=cells[0]['ink'];sx=58/(first[2]-first[0]);sy=35/(first[3]-first[1])
            px=(first[0]+first[2])/2;py=(first[3]-1) if name=='attack' else by1-1
            anchor=[0,17.5]
        elif key=='fan-colony':
            first=cells[0]['ink'];sx=sy=156/(first[2]-first[0]);px=(first[0]+first[2])/2
            py=by1-1 if name=='lost' else first[3]-1;anchor_name='perch'
        elif key=='column':
            base=cells[3 if name.endswith('alt') else 0];fb=base['ink']
            sx=370/(fb[2]-fb[0]);sy=490/(fb[3]-fb[1])
            # Use the structural base, not canopy centroid, for the second
            # asymmetrical column. A destroyed stump stays the same scale.
            px=horizontal_anchor(alpha,c['cell'],c['ink'],40);py=by1-1
        elif key=='habitat':
            if name.startswith('home'):
                fb=cells[0]['ink'];sx=174/(fb[2]-fb[0]);sy=160/(fb[3]-fb[1])
                px=(fb[0]+fb[2])/2;py=by1-2;anchor_name='floor'
            else:
                fb=cells[3]['ink'];sx=340/(fb[2]-fb[0]);sy=28/(fb[3]-fb[1])
                px=(fb[0]+fb[2])/2;py=by1-1
        elif key=='plants':
            if name.startswith('vine'):
                fb=cells[0]['ink'];sx=sy=150/(fb[3]-fb[1])
                px=horizontal_anchor(alpha,c['cell'],c['ink'],12);py=by1-1
            else:
                fb=cells[4]['ink'];sx=90/(fb[2]-fb[0]);sy=78/(fb[3]-fb[1])
                px=horizontal_anchor(alpha,c['cell'],c['ink'],8);py=by1-1
        elif key=='leth':
            fb=cells[0]['ink'];sx=sy=150/(fb[3]-fb[1])
            if name=='recorder':
                sx=sy=28/(bx1-bx0);px=(bx0+bx1)/2;py=(by0+by1)/2;anchor_name='centre'
            elif name=='staff':
                sx=sy=145/(by1-by0);px=(bx0+bx1)/2;py=by1-1
            elif name=='lost':
                px=(bx0+bx1)/2;py=by1-1
            else:
                # The staff is held separately at the right edge. Place the
                # actual feet/cape centre at x=0 instead of the whole alpha box.
                px=214 if i!=4 else 206;py=by1-1
        else:raise AssertionError(key)
        assert all(math.isfinite(v) for v in [sx,sy,px,py]) and sx>0 and sy>0,(key,name,'Invalid registration scale')
        frame={'source':[x0+left,y0+top,w,h], 'cell':c['cell'],
            'target':rounds([anchor[0]+(left-px)*sx,anchor[1]+(top-py)*sy,w*sx,h*sy]),
            'usage':'reference' if (key,name) in REFERENCE else 'runtime',
            'anchors':{'sourcePivot':rounds([x0+px,y0+py]),'pivot':anchor,'role':anchor_name,
                'sourceGround':rounds([x0+px,y0+py]),'ground':anchor}}
        if key=='habitat' and name.startswith('root'):
            frame['anchors']['contact']=[0,-28] if name!='root-destroyed' else [0,0]
            frame['anchors']['authority']='livingRouteSurfaceAt; painted alpha never changes surface or collisions'
        if key=='habitat' and name in ['home-normal','home-damaged']:
            # The first rows contain only the two suspension cords. Measure
            # their actual tips so the renderer connects them to the column.
            groups=[];start=None
            for cx in range(c['cell'][2]+1):
                occupied = cx<c['cell'][2] and sum(alpha.getpixel((x0+cx,y0+cy))>=96 for cy in range(by0,min(by0+10,by1)))>=3
                if occupied and start is None:start=cx
                if not occupied and start is not None:groups.append((start,cx));start=None
            assert len(groups)>=2,(key,name,'Two suspension ropes required')
            tips=[[(groups[0][0]+groups[0][1]-1)/2,by0],[(groups[-1][0]+groups[-1][1]-1)/2,by0]]
            frame['anchors']['sourceSuspensions']=[rounds([x0+point[0],y0+point[1]]) for point in tips]
            frame['anchors']['suspensions']=[rounds([anchor[0]+(point[0]-px)*sx,anchor[1]+(point[1]-py)*sy]) for point in tips]
        frames[name]=frame
        # Keep local alpha boxes immutable: later frames derive their scale
        # from the family's first frame. Serialize absolute boxes separately.
        measured_cells.append({'name':name,'cell':c['cell'],'source':frame['source'],
            'ink':[x0+bx0,y0+by0,bx1-bx0,by1-by0]})
    entry={'image':f'assets/painted/thyr/{key}.png','size':list(im.size),'grid':spec['grid'],'rowEdges':row_edges,'ids':spec['ids'],'frames':frames}
    layout[key]=entry
    files.append({'key':key,'path':entry['image'],'size':list(im.size),'grid':spec['grid'],'rowEdges':row_edges,'ids':spec['ids'],
        'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'frames':len(frames),'cells':measured_cells,
        'runtimeFrames':[n for n,v in frames.items() if v['usage']=='runtime'],'referenceFrames':[n for n,v in frames.items() if v['usage']=='reference'],
        'alphaRange':list(alpha.getextrema()),'fullyTransparentPixels':hist[0]})

(ROOT/'src/painted-thyr-layout.mjs').write_text('/** Measured original image crops and draw registration. No PNG pixels changed. */\nexport const PAINTED_THYR_LAYOUT = '+json.dumps(layout,ensure_ascii=False,indent=2)+';\n')
manifest={'schema':1,'version':'0.15.4','date':'2026-11-16','title':'Vie de Thyr — faune, flore, habitats et Leth',
    'generator':'image_gen.imagegen (built-in)','indexer':'tools/index-painted-thyr.py','runtime':'src/painted-thyr.mjs','layout':'src/painted-thyr-layout.mjs',
    'atlases':len(files),'cells':sum(f['frames'] for f in files),'runtimeCells':sum(len(f['runtimeFrames']) for f in files),
    'referenceCells':sum(len(f['referenceFrames']) for f in files),'walkPoses':16,'files':files,
    'status':'Prototype intégré. Animation finale et réception humaine ouvertes.',
    'provenance':'Originaux RGBA inchangés. Prompts complets conservés. Rectangles mesurés sur alpha32, marge2 pixels; aucun retrait de fond ni rééchantillonnage hors moteur.',
    'limits':['62 cellules de poses/états/références, pas 62 créatures, personnes ou nouveaux objets.',
        'Les rangées de habitat.png sont inégales (0–500–724), décrites explicitement; aucun découpage ne traverse un autre sprite.',
        'Les colonnes alternatives habillent les deux supports déjà présents. Les racines restent portées par livingRouteSurfaceAt.',
        'Le Guetteur-racine reste dans OP03 et son état mort reste une référence; aucun nouveau cadavre persistant.',
        'Bâton et enregistreur de Leth sont déjà visibles sur ses poses; cellules isolées non superposées.',
        'Vigne flétrie/brûlée et herbe aplatie sont des images, sans nouveau système écologique ni événement simulé.',
        'Marche liée au déplacement réel; la réduction des mouvements et le repli vectoriel sont conservés.',
        'La mort, la peur, les issues de migration et le consentement proviennent exclusivement de leurs domaines de simulation.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:manifest[k] for k in ['atlases','cells','runtimeCells','referenceCells','walkPoses']}))
