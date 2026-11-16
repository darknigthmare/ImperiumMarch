"""Inspect original PNG alpha and write non-destructive runtime atlas metadata.

No generated image pixels are changed. Source rectangles are consumed by drawImage.
The original PNG bytes, exact prompts and individually measured rig anchors remain
auditable. Pillow is used only to READ image dimensions and alpha bounds.
"""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/painted/mi14'
NAMES = {
    'worker': ['standing'] + [f'walking-{i}' for i in range(8)] + ['safe', 'kneeling', 'lost'],
    'worker-mechanic': ['standing'] + [f'walking-{i}' for i in range(8)] + ['safe', 'kneeling', 'lost'],
    'cooler': ['broken', 'isolated', 'repairing', 'online', 'destroyed', 'neutral-reference'],
    'valve': ['open', 'isolated', 'destroyed'],
    'disputed-lot': ['sealed', 'inspected', 'released', 'blocked', 'destroyed', 'neutral-reference'],
    'workshop-control': ['idle', 'working', 'production', 'stopped', 'destroyed', 'neutral-reference'],
    'security-automaton': ['dormant', 'warning', 'active', 'destroyed', 'cannon', 'cannon-destroyed'],
    'picket-post': ['closed', 'clearing', 'open'],
}
layout = {}
manifest = {
    'schema': 1, 'version': '0.15.1', 'date': '2026-11-16',
    'title': 'Les mains noires — sprites peints de Kharon',
    'source': 'assets/painted/mi14/prompts.json',
    'generator': 'tools/index-painted-sprites.py',
    'runtime': 'src/painted-sprites.mjs',
    'layout': 'src/painted-sprite-layout.mjs',
    'provenance': 'Eight original images generated with the built-in image_gen tool; original RGBA bytes preserved, not rasterizations of the vector kit.',
    'status': 'Prototype integrated art; not a final art or human animation approval.',
    'authority': 'All world positions, facing, state changes, losses, alert and cannon aim come from the existing simulation. Ground and muzzle anchors stay in its local coordinates.',
    'limitations': [
        'Atlas cells are frames and material states, not new gameplay entities.',
        'Kneeling, neutral, dormant and warning cells are authoring references, not new actions or an early enemy spawn.',
        'The cooler has a protected static fan grille; thermal indicators and repair states change, but the grille does not rotate.',
        'Walk cycle art is a first production pass; full body diversity, human animation review and the remaining campaign art are open.',
    ],
    'files': [],
}

def rounded(values):
    return [round(float(x), 5) for x in values]

for key, names in NAMES.items():
    path = OUT / f'{key}.png'
    data = path.read_bytes()
    image = Image.open(path)
    assert image.mode == 'RGBA', (key, image.mode)
    alpha = image.getchannel('A')
    cols, rows = (4, 3) if key.startswith('worker') else (3, 1) if key in ['valve', 'picket-post'] else (3, 2)
    cells = []
    for index, name in enumerate(names):
        x0, x1 = round(index % cols * image.width / cols), round((index % cols + 1) * image.width / cols)
        y0, y1 = round(index // cols * image.height / rows), round((index // cols + 1) * image.height / rows)
        box = alpha.crop((x0, y0, x1, y1)).point(lambda v: 255 if v >= 32 else 0).getbbox()
        assert box, (key, name, 'empty frame')
        cells.append({'name': name, 'origin': [x0, y0], 'cell': [x0, y0, x1-x0, y1-y0], 'ink': list(box)})
    frames = {}
    for index, cell in enumerate(cells):
        name = cell['name']
        x0, y0 = cell['origin']
        bx0, by0, bx1, by1 = cell['ink']
        # Two-pixel transparent/antialiased fringe is kept around measured ink.
        left, top = max(0, bx0-2), max(0, by0-2)
        right, bottom = min(cell['cell'][2], bx1+2), min(cell['cell'][3], by1+2)
        width, height = right-left, bottom-top
        if key.startswith('worker'):
            scale = 60 / (333 if key == 'worker' else 324)
            origin_x = 184 if key == 'worker' else 190
            origin_y = by1
            if name == 'lost':
                origin_x = (bx0+bx1)/2
            target = [(left-origin_x)*scale, (top-origin_y)*scale, width*scale, height*scale]
        elif key == 'cooler':
            # Shared cabinet scale, ground baseline and centre preserve pipes.
            scale = 174 / 444
            target = [(left-245)*scale, (top-454)*scale, width*scale, height*scale]
        elif key == 'workshop-control':
            scale = 122 / 479
            origin_x = (bx0+bx1)/2
            target = [(left-origin_x)*scale, (top-by1)*scale, width*scale, height*scale]
        elif key == 'valve':
            scale = 100 / 637
            target = [(left-362)*scale, (top-678)*scale, width*scale, height*scale]
        elif key == 'disputed-lot':
            scale = 132 / 474
            target = [(left-256)*scale, (top-by1)*scale, width*scale, height*scale]
        elif key == 'picket-post':
            scale = 104 / 598
            target = [(left-378.5)*scale, (top-666)*scale, width*scale, height*scale]
        elif key == 'security-automaton' and name in ['cannon', 'cannon-destroyed']:
            # Measured circular trunnion centre; muzzle aligns exactly with the
            # collision/fire model's x=56. Source includes the whole trunnion.
            pivot_x, pivot_y = (84, 249) if name == 'cannon' else (82, 249)
            scale = 56 / (right - pivot_x)
            target = [(left-pivot_x)*scale, (top-pivot_y)*scale, width*scale, height*scale]
        else:
            # The round mount on the illustrated body meets physical [0,-55].
            # Its base is grounded at 0; the warning light may extend higher.
            scale_x = 112 / 409
            pivot_x, pivot_y, ground_y = 298, 221, 466 if index == 0 else 465
            scale_y = 55 / (ground_y-pivot_y)
            target = [(left-pivot_x)*scale_x, (top-ground_y)*scale_y, width*scale_x, height*scale_y]
        frames[name] = {'source': [x0+left, y0+top, width, height], 'target': rounded(target)}
        if key == 'security-automaton' and name in ['cannon', 'cannon-destroyed']:
            frames[name]['anchors'] = {'pivot': [0, 0], 'muzzle': [56, 0]}
        cell['runtimeFrame'] = frames[name]
    histogram = alpha.histogram()
    entry = {'image': f'assets/painted/mi14/{key}.png', 'size': list(image.size), 'grid': [cols, rows], 'frames': frames}
    layout[key] = entry
    manifest['files'].append({
        'key': key, 'file': entry['image'], 'bytes': len(data),
        'sha256': hashlib.sha256(data).hexdigest(), 'dimensions': list(image.size),
        'mode': image.mode, 'grid': [cols, rows], 'frameCount': len(frames),
        'alpha': {'range': list(alpha.getextrema()), 'emptyFraction': round(histogram[0]/(image.width*image.height), 6),
                  'clearFraction': round(sum(histogram[:16])/(image.width*image.height), 6)},
        'cells': cells,
    })

manifest['counts'] = {'atlases': len(layout), 'frames': sum(len(v['frames']) for v in layout.values()),
                       'walkFrames': 16, 'characterTypes': 2, 'machineFamilies': 6,
                       'bytes': sum(f['bytes'] for f in manifest['files'])}
(OUT/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
(ROOT/'src/painted-sprite-layout.mjs').write_text('/** Measured source rectangles; original PNG bytes are unchanged. See assets/painted/mi14/manifest.json. */\nexport const PAINTED_MI14_LAYOUT = '+json.dumps(layout, ensure_ascii=False, indent=2)+';\n')
print(json.dumps(manifest['counts']))
