#!/usr/bin/env python3
"""Measure generated walker PNGs; write metadata only, never edit image pixels.

Coordinates in anchors.json are measured in their original equal-grid cell.
All emitted source anchors use absolute atlas pixels. Endpoint rotation is a
presentation correction; the rig, contacts and simulation remain authoritative.
"""
from pathlib import Path
import hashlib
import json
import math
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/walkers'
NAMES = ['hull', 'hull-damaged', 'hull-braced', 'turret',
         'upper', 'upper-damaged', 'lower', 'lower-damaged',
         'hip', 'knee', 'foot', 'foot-damaged',
         'foot-braced', 'radiator', 'radiator-damaged', 'radiator-repaired']
RIGS = json.loads(subprocess.check_output(['node', '--input-type=module', '-e',
    "import {PRODUCTION_RIGS} from './src/production-assets.mjs'; console.log(JSON.stringify(PRODUCTION_RIGS));"], cwd=ROOT, text=True))
MEASURED = json.loads((OUT / 'anchors.json').read_text())['rigs']
rounded = lambda values: [round(float(v), 8) for v in values]
pixel_edge = lambda value: math.floor(value + .5)
layout, files = {}, []

for key, rig in RIGS.items():
    path = OUT / f'{key.lower()}.png'
    raw = path.read_bytes()
    im = Image.open(path)
    assert im.mode == 'RGBA', (key, 'Expected original RGBA PNG')
    alpha = im.getchannel('A')
    histogram = alpha.histogram()
    assert histogram[0] > im.width * im.height * .15, (key, 'No genuine transparent background')
    assert alpha.getextrema() == (0, 255), (key, 'Incomplete alpha range')
    cells, frames = [], {}
    for index, name in enumerate(NAMES):
        col, row = index % 4, index // 4
        x0, x1 = pixel_edge(col * im.width / 4), pixel_edge((col + 1) * im.width / 4)
        y0, y1 = pixel_edge(row * im.height / 4), pixel_edge((row + 1) * im.height / 4)
        mask = alpha.crop((x0, y0, x1, y1)).point(lambda value: 255 if value >= 32 else 0)
        box = mask.getbbox()
        assert box and box[0] > 0 and box[1] > 0 and box[2] < x1-x0 and box[3] < y1-y0, (key, name, 'Empty or clipped cell', box)
        bx0, by0, bx1, by1 = box
        left, top = max(0, bx0 - 2), max(0, by0 - 2)
        right, bottom = min(x1-x0, bx1+2), min(y1-y0, by1+2)
        width, height = right-left, bottom-top
        entry = {'source': [x0+left, y0+top, width, height], 'usage': 'runtime'}
        item = MEASURED[key][name]
        kind = name.split('-')[0]
        if kind in ['upper', 'lower', 'turret']:
            pivot, endpoint = item['pivot'], item['endpoint']
            dx, dy = endpoint[0]-pivot[0], endpoint[1]-pivot[1]
            length = (112 if rig['legs'] == 4 else 101 if rig['legs'] == 6 else 92) if kind == 'turret' else 100
            scale = length / math.hypot(dx, dy)
            entry['target'] = rounded([(left-pivot[0])*scale, (top-pivot[1])*scale, width*scale, height*scale])
            entry['rotation'] = round(-math.atan2(dy, dx), 12)
            end_key = 'Muzzle' if kind == 'turret' else 'Endpoint'
            entry['anchors'] = {'sourcePivot': rounded([x0+pivot[0], y0+pivot[1]]), 'pivot': [0, 0],
                'source'+end_key: rounded([x0+endpoint[0], y0+endpoint[1]]), end_key.lower(): rounded([dx*scale, dy*scale]),
                'resolved'+end_key: [length, 0]}
        elif kind == 'hull':
            # Main armor, excluding antenna/sensor protrusions; authored body
            # origin keeps leg hips beneath the hull without changing the rig.
            ax0, ay0, ax1, ay1 = item['bodyBox']
            sx = rig['width'] * 1.10 / (ax1-ax0)
            sy = rig['bodyHeight'] * 1.05 / (ay1-ay0)
            pivot = [(ax0+ax1)/2, ay1-rig['bodyHeight']*.48/sy]
            entry['target'] = rounded([(left-pivot[0])*sx, (top-pivot[1])*sy, width*sx, height*sy])
            entry['anchors'] = {'sourcePivot': rounded([x0+pivot[0], y0+pivot[1]]), 'pivot': [0, 0],
                'sourceBodyBox': [x0+ax0, y0+ay0, ax1-ax0, ay1-ay0],
                'bodyBox': rounded([-rig['width']*.55, -rig['bodyHeight']*.57, rig['width']*1.1, rig['bodyHeight']*1.05])}
        elif kind in ['hip', 'knee']:
            pivot = item['pivot']
            scale = 28 / item['diameter']
            entry['target'] = rounded([(left-pivot[0])*scale, (top-pivot[1])*scale, width*scale, height*scale])
            entry['anchors'] = {'sourcePivot': rounded([x0+pivot[0], y0+pivot[1]]), 'pivot': [0, 0]}
        elif kind == 'foot':
            ankle = item['ankle']
            # Contact lies on the flat sole directly below the ankle. It is
            # deliberately not the alpha centroid of an asymmetric shoe.
            pivot = [ankle[0], item['soleY']]
            sx = rig['footWidth'] / (item['soleRight']-item['soleLeft'])
            sy = 8 / (pivot[1]-ankle[1])
            entry['target'] = rounded([(left-pivot[0])*sx, (top-pivot[1])*sy, width*sx, height*sy])
            entry['anchors'] = {'sourcePivot': rounded([x0+pivot[0], y0+pivot[1]]), 'pivot': [0, 0],
                'sourceAnkle': rounded([x0+ankle[0], y0+ankle[1]]), 'ankle': [0, -8],
                'sourceSole': [[x0+item['soleLeft'], y0+item['soleY']], [x0+item['soleRight'], y0+item['soleY']]],
                'sole': rounded([(item['soleLeft']-pivot[0])*sx, 0, (item['soleRight']-pivot[0])*sx, 0])}
        else:
            # Portrait heat exchanger uses precisely the existing vulnerable
            # rectangle. Fittings never increase collision or hit detection.
            ax0, ay0, ax1, ay1 = item['panelBox']
            pivot = [(ax0+ax1)/2, (ay0+ay1)/2]
            sx, sy = 22/(ax1-ax0), rig['bodyHeight']*.65/(ay1-ay0)
            entry['target'] = rounded([(left-pivot[0])*sx, (top-pivot[1])*sy, width*sx, height*sy])
            entry['anchors'] = {'sourcePivot': rounded([x0+pivot[0], y0+pivot[1]]), 'pivot': [0, 0]}
        frames[name] = entry
        cells.append({'name': name, 'cell': [x0, y0, x1-x0, y1-y0], 'ink': [x0+bx0, y0+by0, bx1-bx0, by1-by0], 'source': entry['source']})
    atlas = {'image': f'assets/painted/walkers/{key.lower()}.png', 'size': list(im.size), 'grid': [4, 4], 'frames': frames}
    layout[key] = atlas
    files.append({'key': key, 'name': rig['name'], 'path': atlas['image'], 'bytes': len(raw),
        'sha256': hashlib.sha256(raw).hexdigest(), 'size': list(im.size), 'grid': [4, 4], 'frames': len(frames),
        'cells': cells, 'alphaRange': list(alpha.getextrema()), 'fullyTransparentPixels': histogram[0]})

(ROOT/'src/painted-walker-layout.mjs').write_text('/** Measured original PNG cells and mechanical anchors. No PNG pixels are modified. */\nexport const PAINTED_WALKER_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
manifest = {'schema': 1, 'version': '0.15.3', 'date': '2026-11-16', 'title': 'Six marcheurs jouables — pièces peintes articulées',
    'generator': 'image_gen.imagegen (built-in)', 'indexer': 'tools/index-painted-walkers.py',
    'runtime': 'src/painted-walkers.mjs', 'layout': 'src/painted-walker-layout.mjs',
    'rigAuthority': 'src/production-assets.mjs', 'anchorMeasurements': 'assets/painted/walkers/anchors.json',
    'atlases': len(files), 'cells': sum(f['frames'] for f in files), 'runtimeCells': sum(f['frames'] for f in files),
    'referenceCells': 0, 'files': files,
    'status': 'Prototype de pièces articulées ; réception humaine et animation finale ouvertes.',
    'provenance': 'PNG originaux conservés sans retouche ni rééchantillonnage. Prompts complets dans prompts.json. Mesures, cadrages et corrections optiques au rendu seulement.',
    'limits': ['Seuls WK01, WK02, WK05, WK06, WK09 et WK10 disposent de ces atlas. Aucun châssis jouable supplémentaire.',
        '96 cellules de pièces et états, pas 96 personnages ni 96 poses complètes de marche.',
        'Le rig et les pieds simulés pilotent les pièces. Les variantes lointaines réutilisent les cellules avec assombrissement au rendu.',
        'Les vérins entre articulations restent procéduraux. Les impacts et réparations progressives du radiateur conservent le rendu vectoriel.',
        'Le canon garde ses pivots et bouches physiques ; aucune modification du tir ou de sa dispersion.',
        'Les cycles finaux, hauteurs réglables, équipements spécialisés, six autres châssis et biomes restent à produire.']}
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({key: manifest[key] for key in ['atlases', 'cells', 'runtimeCells', 'referenceCells']}))
