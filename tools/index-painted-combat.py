#!/usr/bin/env python3
"""Measure original generated PNGs without changing any pixels.

Alpha bounds select source rectangles at runtime. Authored pivot/muzzle pairs
are measured in original pixel coordinates; a small draw rotation aligns the
painted barrel exactly with the simulation's firing axis.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/combat'
NAMES = {
    **{k: ['idle'] + [f'walk-{i}' for i in range(8)] + ['braced', 'downed', 'weapon'] for k in ['rifle', 'sniper', 'rocket']},
    'civilian': ['idle'] + [f'walk-{i}' for i in range(8)] + ['safe', 'crouch', 'downed'],
    'buggy': ['idle', 'damaged', 'wreck', 'weapon', 'wheel', 'detail'],
    'skimmer': ['idle', 'damaged', 'wreck', 'weapon', 'thruster', 'detail'],
    'drone': ['idle', 'damaged', 'wreck', 'weapon', 'rotor', 'detail'],
    'turret': ['idle', 'damaged', 'wreck', 'weapon', 'weapon-damaged', 'detail'],
    'convoy': ['idle', 'damaged', 'wreck', 'wheel', 'cargo', 'medical'],
}
rigs = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {ENEMY_WEAPON_RIGS} from './src/enemy-weapon-pose.mjs'; console.log(JSON.stringify(ENEMY_WEAPON_RIGS));"], cwd=ROOT, text=True))
sizes = {k: v['size'] for k, v in rigs.items()} | {'civilian': [18, 34], 'convoy': [112, 64]}
# Coordinates are local to each equal cell. Trunnions were inspected visually.
body_mount = {'buggy': [240, 175], 'skimmer': [252, 212], 'drone': [258, 340], 'turret': [231, 138]}
weapon_anchors = {
    'rifle': ([128, 146], [355, 146]),
    'sniper': ([118, 157], [356, 157]),
    'rocket': ([98, 142], [361, 142]),
    'buggy': ([128, 244], [499, 244]),
    'skimmer': ([80, 276], [488, 263]),
    'drone': ([117, 267], [452, 269]),
    'turret': ([80, 253], [491, 242]),
}
rounds = lambda values: [round(float(v), 7) for v in values]
layout = {}
files = []
for key, names in NAMES.items():
    path = OUT / f'{key}.png'
    raw = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'Expected RGBA')
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > im.width * im.height * .15, (key, 'Background is not genuinely transparent')
    assert alpha.getextrema()[1] >= 200, (key, 'No solid subject')
    cols, rows = (4, 3) if len(names) == 12 else (3, 2)
    cells = []
    for index, name in enumerate(names):
        x0, x1 = round(index % cols * im.width / cols), round((index % cols + 1) * im.width / cols)
        y0, y1 = round(index // cols * im.height / rows), round((index // cols + 1) * im.height / rows)
        mask = alpha.crop((x0, y0, x1, y1)).point(lambda v: 255 if v >= 32 else 0)
        box = mask.getbbox()
        assert box and box[0] > 0 and box[1] > 0 and box[2] < x1-x0 and box[3] < y1-y0, (key, name, 'Empty or cropped cell', box)
        cells.append({'name': name, 'origin': [x0, y0], 'cell': [x0, y0, x1-x0, y1-y0], 'ink': list(box)})
    frames = {}
    body_height = cells[0]['ink'][3] - cells[0]['ink'][1]
    base_y = cells[0]['ink'][3]
    for cell in cells:
        name = cell['name']; x0, y0 = cell['origin']; bx0, by0, bx1, by1 = cell['ink']
        left, top = max(0, bx0-2), max(0, by0-2)
        right, bottom = min(cell['cell'][2], bx1+2), min(cell['cell'][3], by1+2)
        width, height = right-left, bottom-top
        entry = {'source': [x0+left, y0+top, width, height]}
        if name.startswith('weapon'):
            pivot, muzzle = weapon_anchors[key]
            dx, dy = muzzle[0]-pivot[0], muzzle[1]-pivot[1]
            scale = rigs[key]['length']/math.hypot(dx, dy)
            entry['target'] = rounds([(left-pivot[0])*scale, (top-pivot[1])*scale, width*scale, height*scale])
            entry['rotation'] = -math.atan2(dy, dx)
            entry['anchors'] = {'sourcePivot': [x0+pivot[0], y0+pivot[1]], 'sourceMuzzle': [x0+muzzle[0], y0+muzzle[1]],
                'pivot': [0, 0], 'muzzle': rounds([dx*scale, dy*scale]), 'resolvedMuzzle': [rigs[key]['length'], 0]}
            entry['usage'] = 'runtime' if name == 'weapon' else 'reference'
        elif len(names) == 12:
            scale = sizes[key][1]/body_height
            # Stabilize the torso from the head/shoulder region, without changing
            # pixels or adding animation positions to the saved simulation.
            mask = alpha.crop((x0, y0+by0, x0+cell['cell'][2], y0+min(by1, by0+int(body_height*.22)))).point(lambda v: 255 if v >= 96 else 0)
            upper = mask.getbbox()
            origin_x = (upper[0]+upper[2])/2-7 if upper else (bx0+bx1)/2
            if name == 'downed': origin_x = (bx0+bx1)/2
            entry['target'] = rounds([(left-origin_x)*scale, sizes[key][1]/2+(top-by1)*scale, width*scale, height*scale])
            entry['usage'] = 'reference' if name in ['downed', 'crouch'] else 'runtime'
        elif name in ['idle', 'damaged', 'wreck']:
            if key in body_mount:
                px, py = body_mount[key]
                rx, ry = rigs[key]['pivot']
                scale = sizes[key][0]/(cells[0]['ink'][2]-cells[0]['ink'][0]) if key == 'drone' else (sizes[key][1]/2-ry)/(base_y-py)
                entry['target'] = rounds([rx+(left-px)*scale, ry+(top-py)*scale, width*scale, height*scale])
                entry['anchors'] = {'sourceMount': [x0+px, y0+py], 'mount': [rx, ry]}
            else:
                scale = sizes[key][0]/(cells[0]['ink'][2]-cells[0]['ink'][0])
                origin_x = (cells[0]['ink'][0]+cells[0]['ink'][2])/2
                entry['target'] = rounds([(left-origin_x)*scale, sizes[key][1]/2+(top-base_y)*scale, width*scale, height*scale])
            entry['usage'] = 'runtime' if name != 'wreck' or key == 'convoy' else 'reference'
        elif key == 'convoy' and name in ['cargo', 'medical']:
            # These symbols are restricted to the truck's existing side panel.
            scale = min(32/width, 23/height)
            entry['target'] = rounds([-19-width*scale/2, -8-height*scale/2, width*scale, height*scale])
            entry['usage'] = 'runtime'
        else:
            scale = 28/max(width, height)
            entry['target'] = rounds([-width*scale/2, -height*scale/2, width*scale, height*scale])
            entry['usage'] = 'reference'
        frames[name] = entry
    item = {'image': f'assets/painted/combat/{key}.png', 'size': list(im.size), 'grid': [cols, rows], 'nominalBody': sizes[key], 'frames': frames}
    if key == 'convoy': item['overlays'] = ['cargo', 'medical']
    layout[key] = item
    files.append({'key': key, 'path': item['image'], 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
        'size': list(im.size), 'grid': [cols, rows], 'cells': cells, 'frames': len(frames),
        'runtimeFrames': [n for n,v in frames.items() if v['usage']=='runtime'],
        'referenceFrames': [n for n,v in frames.items() if v['usage']=='reference'],
        'alphaRange': list(alpha.getextrema()), 'fullyTransparentPixels': histogram[0]})

(ROOT/'src/painted-combat-layout.mjs').write_text('/** Measured source rectangles; original PNG pixels are unchanged. */\nexport const PAINTED_COMBAT_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
manifest = {'schema': 1, 'version': '0.15.2', 'date': '2026-11-16', 'title': 'Acteurs et véhicules de combat peints',
    'generator': 'image_gen.imagegen (built-in)', 'indexer': 'tools/index-painted-combat.py', 'runtime': 'src/painted-combat.mjs',
    'layout': 'src/painted-combat-layout.mjs', 'weaponAuthority': 'src/enemy-weapon-pose.mjs', 'files': files,
    'atlases': len(files), 'cells': sum(f['frames'] for f in files), 'walkPoses': 32,
    'runtimeCells': sum(len(f['runtimeFrames']) for f in files), 'referenceCells': sum(len(f['referenceFrames']) for f in files),
    'status': 'Prototype intégré, sans réception humaine finale.',
    'provenance': 'Originaux PNG de génération conservés sans rééchantillonnage ni retouche de pixels. Prompts complets dans prompts.json.',
    'limits': ['Les cellules ne sont pas de nouvelles entités de jeu.', 'Les sept armes sont séparées et suivent les pivots et bouches de la simulation.',
        'Les corps restent dans leurs domaines et leurs dates d’arrivée. Aucun cadavre ennemi ni épave persistante n’est créé par le rendu.',
        'Roues, rotors, turbine et panneaux isolés restent des pièces de référence. Les roues déjà peintes ne sont pas dupliquées.',
        'Les variantes de faction, animations de rechargement et de reddition, rigs peints des marcheurs et autres biomes restent à produire.']}
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({k: manifest[k] for k in ['atlases','cells','walkPoses','runtimeCells','referenceCells']}))
