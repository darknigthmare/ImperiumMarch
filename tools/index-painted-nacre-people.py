#!/usr/bin/env python3
"""Measure source rectangles and ground anchors; never rewrite original PNGs."""
from pathlib import Path
import hashlib
import json
import math
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/nacre-people'
NAMES = {
    'technicians': ['idle', 'walk-0', 'walk-1', 'walk-2', 'walk-3', 'locking', 'covering', 'downed'],
    'staff': [f'{role}-{pose}' for role in ['driver', 'medic'] for pose in ['idle', 'walk-0', 'walk-1', 'walk-2', 'walk-3', 'downed']],
    'patients': [f'patient-{i}-{state}' for i in range(1, 5) for state in ['resting', 'lost']],
}
GRIDS = {'technicians': (4, 2), 'staff': (4, 3), 'patients': (2, 4)}
half_up = lambda value: math.floor(value + .5)
rounded = lambda values: [round(float(value), 7) for value in values]
layout, files, anchors = {}, [], {}
for key, names in NAMES.items():
    path = OUT / f'{key}.png'
    raw = path.read_bytes()
    image = Image.open(path)
    assert image.mode == 'RGBA', (key, 'RGBA required')
    alpha = image.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > image.width * image.height * .25, (key, 'True alpha required')
    columns, rows = GRIDS[key]
    cells = []
    for i, name in enumerate(names):
        x0, x1 = [half_up(v * image.width / columns) for v in [i % columns, i % columns + 1]]
        y0, y1 = [half_up(v * image.height / rows) for v in [i // columns, i // columns + 1]]
        mask = alpha.crop((x0, y0, x1, y1)).point(lambda value: 255 if value >= 32 else 0)
        box = mask.getbbox()
        assert box and box[0] > 2 and box[1] > 2 and box[2] < x1 - x0 - 2 and box[3] < y1 - y0 - 2, (key, name, box)
        cells.append({'name': name, 'cell': [x0, y0, x1 - x0, y1 - y0], 'ink': list(box)})
    frames, measured = {}, {}
    for i, cell in enumerate(cells):
        name = cell['name']; x0, y0, cw, ch = cell['cell']; bx0, by0, bx1, by1 = cell['ink']
        left, top, right, bottom = max(0, bx0-2), max(0, by0-2), min(cw, bx1+2), min(ch, by1+2)
        if key == 'patients':
            reference = cells[i // 2 * 2]['ink']
            scale = 34 / (reference[2] - reference[0])
            origin_x = (bx0 + bx1) / 2
            role, pose = 'patient', name.rsplit('-', 1)[1]
        else:
            reference_index = 6 if key == 'staff' and i >= 6 else 0
            reference = cells[reference_index]['ink']
            scale = 34 / (reference[3] - reference[1])
            role = 'technician' if key == 'technicians' else name.split('-', 1)[0]
            pose = name if key == 'technicians' else name.split('-', 1)[1]
            # Upper head/helmet bounds stabilize each upright figure without
            # moving the PNG or guessing an independent physical foot path.
            if pose == 'downed':
                origin_x = (bx0 + bx1) / 2
            else:
                head_height = max(8, round((by1 - by0) * (.22 if pose != 'covering' else .28)))
                upper = alpha.crop((x0, y0 + by0, x0 + cw, y0 + by0 + head_height)).point(lambda value: 255 if value >= 96 else 0).getbbox()
                origin_x = (upper[0] + upper[2]) / 2
        # This is the measured visible sole/wheel baseline, mapped to the
        # existing person's y+h/2. It does not create a collision or foot rig.
        ground = [x0 + origin_x, y0 + by1]
        measured[name] = {'sourceGround': rounded(ground), 'alphaBaseline': y0 + by1,
                          'method': 'Original alpha bounds (threshold 32); upright origin from head bounds (threshold 96)'}
        frames[name] = {'source': [x0+left, y0+top, right-left, bottom-top], 'cell': cell['cell'],
                        'target': rounded([(left-origin_x)*scale, (top-by1)*scale, (right-left)*scale, (bottom-top)*scale]),
                        'anchors': {'sourceGround': rounded(ground), 'ground': [0, 0]},
                        'role': role, 'pose': pose, 'usage': 'runtime'}
    layout[key] = {'image': f'assets/painted/nacre-people/{key}.png', 'size': list(image.size),
                   'grid': [columns, rows], 'frames': frames}
    anchors[key] = measured
    files.append({'key': key, 'path': layout[key]['image'], 'sha256': hashlib.sha256(raw).hexdigest(),
                  'bytes': len(raw), 'size': list(image.size), 'grid': [columns, rows], 'cells': cells,
                  'frames': len(frames), 'runtimeFrames': names, 'referenceFrames': [],
                  'alphaRange': list(alpha.getextrema()), 'fullyTransparentPixels': histogram[0]})
    assert hashlib.sha256(path.read_bytes()).hexdigest() == files[-1]['sha256']
(ROOT/'src/painted-nacre-people-layout.mjs').write_text('/** Measured original PNG crops and ground anchors; no pixels modified. */\nexport const PAINTED_NACRE_PEOPLE_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
(OUT/'anchors.json').write_text(json.dumps({'schema': 1, 'version': '0.15.8', 'atlases': anchors}, ensure_ascii=False, indent=2)+'\n')
manifest = {'schema': 1, 'version': '0.15.8', 'date': '2026-11-17', 'title': 'Personnes de Nacre peintes',
            'generator': 'image_gen.imagegen (built-in)', 'indexer': 'tools/index-painted-nacre-people.py',
            'runtime': 'src/painted-nacre-people.mjs', 'layout': 'src/painted-nacre-people-layout.mjs',
            'files': files, 'atlases': len(files), 'cells': sum(f['frames'] for f in files),
            'runtimeCells': sum(f['frames'] for f in files), 'referenceCells': 0, 'walkPoses': 12,
            'status': 'Prototype peint; réception humaine finale ouverte.',
            'provenance': 'Originaux PNG conservés sans retouche, sans rééchantillonnage; prompts exacts dans prompts.json.',
            'limits': ['Ces cellules ne créent aucune personne ni identité historique.',
                       'MI06 : les deux techniciens partagent une apparence de rôle; les résidents conservent leur rendu existant.',
                       'MI07 : conductrice, soignant et quatre patients conservent les faits, positions et pertes simulés.',
                       'MI08 : seuls techniciens, patients et personnel identifié reprennent ces apparences; les agrégats de personnel sans originalId ne deviennent pas des identités.',
                       'Les personnes à bord gardent leurs indicateurs existants; aucun personnage plein corps n’est superposé au bateau.',
                       'Quatre poses de marche par rôle humain, pilotées par déplacement réel; pause et réduction des mouvements conservées.',
                       'Les poses de perte sont utilisées seulement là où le rendu montrait déjà la perte; aucun cadavre supplémentaire MI08.']}
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({key: manifest[key] for key in ['atlases', 'cells', 'runtimeCells', 'referenceCells', 'walkPoses']}))
