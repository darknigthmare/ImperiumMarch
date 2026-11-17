#!/usr/bin/env python3
"""Index original Nacre civilian PNGs. No image pixels are modified."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/nacre-civilians'
POSES = ['idle', 'walk-0', 'walk-1', 'walk-2', 'walk-3', 'downed']
ROLES = {'residents': ['resident-1', 'resident-2'], 'refugees': ['refugee-1', 'refugee-2'],
         'dockworkers': ['crew', 'harbourmaster'], 'mara': ['mara'], 'ancillary': ['ancillary']}
GRIDS = {key: (4, 3) if len(roles) == 2 else (3, 2) for key, roles in ROLES.items()}
# Original generated bodies do not all obey the nominal grid boundaries.
# Measured empty gutters isolate these wide lying poses without editing pixels.
# Their adjacent upright cells are narrowed only through empty alpha space.
CELL_RECTS = {
    'residents': {4: [0, 362, 310, 362], 5: [310, 362, 414, 362],
                  10: [724, 724, 351, 362], 11: [1075, 724, 373, 362]},
    'refugees': {10: [724, 724, 350, 362], 11: [1074, 724, 374, 362]},
    'mara': {4: [512, 512, 388, 512], 5: [900, 512, 636, 512]},
    'ancillary': {4: [512, 512, 388, 512], 5: [900, 512, 636, 512]},
}
half_up = lambda value: math.floor(value + .5)
rounded = lambda values: [round(float(value), 7) for value in values]
layout, files, anchors = {}, [], {}
for key, roles in ROLES.items():
    path = OUT / f'{key}.png'
    raw = path.read_bytes()
    image = Image.open(path)
    assert image.mode == 'RGBA', (key, 'RGBA required')
    alpha = image.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > image.width * image.height * .25, (key, 'True alpha required')
    columns, rows = GRIDS[key]
    names = [f'{role}-{pose}' for role in roles for pose in POSES]
    cells = []
    for i, name in enumerate(names):
        x0, x1 = [half_up(v * image.width / columns) for v in [i % columns, i % columns + 1]]
        y0, y1 = [half_up(v * image.height / rows) for v in [i // columns, i // columns + 1]]
        if i in CELL_RECTS.get(key, {}):
            expected = (1448, 1086) if len(roles) == 2 else (1536, 1024)
            assert image.size == expected, (key, 'Review measured cell overrides for changed source dimensions')
            x0, y0, width, height = CELL_RECTS[key][i]
            x1, y1 = x0+width, y0+height
        mask = alpha.crop((x0, y0, x1, y1)).point(lambda value: 255 if value >= 32 else 0)
        box = mask.getbbox()
        assert box and box[0] > 2 and box[1] > 2 and box[2] < x1-x0-2 and box[3] < y1-y0-2, (key, name, box)
        cells.append({'name': name, 'cell': [x0, y0, x1-x0, y1-y0], 'ink': list(box)})
    frames, measured, runtime, reference = {}, {}, [], []
    for i, cell in enumerate(cells):
        name = cell['name']; x0, y0, cw, ch = cell['cell']; bx0, by0, bx1, by1 = cell['ink']
        left, top, right, bottom = max(0, bx0-2), max(0, by0-2), min(cw, bx1+2), min(ch, by1+2)
        idle = cells[i//6*6]['ink']
        scale = 34 / (idle[3]-idle[1])
        role, pose = roles[i//6], POSES[i%6]
        if pose == 'downed':
            origin_x = (bx0+bx1)/2
        else:
            head_height = max(8, round((by1-by0)*.22))
            head = alpha.crop((x0, y0+by0, x0+cw, y0+by0+head_height)).point(lambda value: 255 if value >= 96 else 0).getbbox()
            assert head, (key, name, 'Head anchor missing')
            origin_x = (head[0]+head[2])/2
        ground = [x0+origin_x, y0+by1]
        usage = 'reference' if pose == 'downed' and key != 'residents' else 'runtime'
        (runtime if usage == 'runtime' else reference).append(name)
        measured[name] = {'sourceGround': rounded(ground), 'alphaBaseline': y0+by1,
                          'method': 'Alpha bounds threshold 32; upright origin from upper-head bounds threshold 96'}
        frames[name] = {'source': [x0+left, y0+top, right-left, bottom-top], 'cell': cell['cell'],
                        'target': rounded([(left-origin_x)*scale, (top-by1)*scale, (right-left)*scale, (bottom-top)*scale]),
                        'anchors': {'sourceGround': rounded(ground), 'ground': [0, 0]},
                        'role': role, 'pose': pose, 'usage': usage,
                        'scope': 'MI06 exposed resident loss only' if usage == 'runtime' and pose == 'downed'
                          else 'No persistent MI08 body in the current simulation' if usage == 'reference' else 'Existing exposed person only'}
    layout[key] = {'image': f'assets/painted/nacre-civilians/{key}.png', 'size': list(image.size),
                   'grid': [columns, rows], 'measuredCells': bool(CELL_RECTS.get(key)), 'frames': frames}
    anchors[key] = measured
    files.append({'key': key, 'path': layout[key]['image'], 'sha256': hashlib.sha256(raw).hexdigest(),
                  'bytes': len(raw), 'size': list(image.size), 'grid': [columns, rows], 'cells': cells,
                  'measuredCellOverrides': CELL_RECTS.get(key, {}),
                  'frames': len(frames), 'runtimeFrames': runtime, 'referenceFrames': reference,
                  'alphaRange': list(alpha.getextrema()), 'fullyTransparentPixels': histogram[0]})
    assert hashlib.sha256(path.read_bytes()).hexdigest() == files[-1]['sha256']
(ROOT/'src/painted-nacre-civilians-layout.mjs').write_text('/** Measured original PNG crops and ground anchors; no pixels modified. */\nexport const PAINTED_NACRE_CIVILIANS_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
(OUT/'anchors.json').write_text(json.dumps({'schema': 1, 'version': '0.15.9', 'atlases': anchors}, ensure_ascii=False, indent=2)+'\n')
manifest = {'schema': 1, 'version': '0.15.9', 'date': '2026-11-17', 'title': 'Habitants et services du quai de Nacre',
            'generator': 'image_gen.imagegen (built-in)', 'indexer': 'tools/index-painted-nacre-civilians.py',
            'runtime': 'src/painted-nacre-civilians.mjs', 'layout': 'src/painted-nacre-civilians-layout.mjs',
            'files': files, 'atlases': len(files), 'cells': sum(f['frames'] for f in files),
            'runtimeCells': sum(len(f['runtimeFrames']) for f in files),
            'referenceCells': sum(len(f['referenceFrames']) for f in files), 'walkPoses': 32,
            'status': 'Prototype peint; réception humaine finale ouverte.',
            'provenance': 'PNG originaux sans retouche ni rééchantillonnage; prompts exacts dans prompts.json.',
            'limits': ['Les variantes par ID courant ne rétablissent aucune identité historique entre missions.',
                       'Résidents : deux apparences, avec pertes visibles seulement dans MI06; MI08 ne crée aucune dépouille.',
                       'L’équipage est anonyme et ne représente pas une identification de Vann Ostre PN08.',
                       'Mara PN07 apparaît uniquement dans MI08 après la liaison et son trajet réel; MI06/MI07 restent radio.',
                       'Le personnel sanitaire générique habille seulement les agrégats staff sans originalId.',
                       'Les personnes à bord gardent les indicateurs uniques de pont et ne reçoivent aucun corps plein supplémentaire.',
                       'Les six poses de perte hors résidents restent références exclues du runtime.',
                       'Marche par distance réelle, arrêt et réduction des mouvements; aucune donnée graphique dans les sauvegardes.']}
assert (manifest['atlases'], manifest['cells'], manifest['runtimeCells'], manifest['referenceCells']) == (5, 48, 42, 6)
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({key: manifest[key] for key in ['atlases', 'cells', 'runtimeCells', 'referenceCells', 'walkPoses']}))
