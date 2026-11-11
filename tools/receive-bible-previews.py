"""Receive changed Bible previews and retain only proven-identical old ranges.

The baseline workbook must be the exact workbook identified by the first visual
receipt. This compares exported cell values, formulas, styles and row/column
geometry; it does not substitute for visual review of newly rendered images.
"""
import argparse, hashlib, json, os, re, shutil, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('baseline_workbook',type=Path)
parser.add_argument('output_dir',type=Path)
parser.add_argument('--config',default='data/bible-v010-final-previews.json')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
source=json.loads((root/'data/bible.json').read_text())
release='.'.join(source['meta']['version'].split('.')[:2])
suffix=os.environ.get('BIBLE_RECEIPT_SUFFIX','')
assert re.fullmatch(r'[a-z0-9][a-z0-9-]*',suffix), 'A distinct BIBLE_RECEIPT_SUFFIX is required'
base=f'workbook-v{release}'
current=f'{base}-{suffix}'
config=json.loads((root/args.config).read_text())
initial_path=root/f'docs/validation/{base}-visual-review.json'
initial=json.loads(initial_path.read_text())
state_path=root/f'docs/validation/{current}-validation.json'
state=json.loads(state_path.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(args.baseline_workbook)==initial['workbookSha256'], 'Wrong baseline workbook'
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
rel_ns='http://schemas.openxmlformats.org/officeDocument/2006/relationships'

def inspect(path):
    with zipfile.ZipFile(path) as archive:
        strings=[]
        if 'xl/sharedStrings.xml' in archive.namelist():
            strings=[''.join(n.text or '' for n in x.findall('.//s:t',ns)) for x in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        targets={r.attrib['Id']:r.attrib['Target'].lstrip('/') for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        sheets={}
        for spec in ET.fromstring(archive.read('xl/workbook.xml')).find('s:sheets',ns):
            target=targets[spec.attrib['{'+rel_ns+'}id']]
            if not target.startswith('xl/'): target='xl/'+target
            tree=ET.fromstring(archive.read(target)); cells={}
            for cell in tree.findall('s:sheetData/s:row/s:c',ns):
                value=cell.find('s:v',ns); raw=value.text if value is not None else None
                kind=cell.attrib.get('t'); formula=cell.find('s:f',ns)
                if kind=='s': raw=strings[int(raw)]
                elif kind=='inlineStr': raw=''.join(n.text or '' for n in cell.findall('.//s:t',ns))
                cells[cell.attrib['r']]={'value':raw,'formula':formula.text if formula is not None else None,'style':cell.attrib.get('s'),'kind':'string' if kind in ['s','inlineStr'] else kind}
            sheets[spec.attrib['name']]={'cells':cells,'rows':{int(row.attrib['r']):dict(row.attrib) for row in tree.findall('s:sheetData/s:row',ns)},'columns':[dict(col.attrib) for col in tree.findall('s:cols/s:col',ns)]}
        return sheets,hashlib.sha256(archive.read('xl/styles.xml')).hexdigest()

before,old_styles=inspect(args.baseline_workbook)
after,new_styles=inspect(root/'docs/ORDRE_DE_CENDRE_Bible.xlsx')
assert old_styles==new_styles, 'Workbook styles changed; old previews require fresh rendering'

def column_number(text):
    result=0
    for character in text: result=result*26+ord(character)-64
    return result

def signature(sheet,area):
    match=re.fullmatch(r'([A-Z]+)(\d+):([A-Z]+)(\d+)',area)
    assert match,area
    a,b,c,d=match.groups(); left,right=column_number(a),column_number(c); top,bottom=int(b),int(d)
    selected={}
    for ref,value in sheet['cells'].items():
        m=re.fullmatch(r'([A-Z]+)(\d+)',ref); col,row=column_number(m[1]),int(m[2])
        if left<=col<=right and top<=row<=bottom: selected[ref]=value
    return {'cells':selected,'rows':{n:v for n,v in sheet['rows'].items() if top<=n<=bottom},'columns':sheet['columns']}

replacement={item['replaces']:item for item in config['ranges']}
assert len(replacement)==len(config['ranges']), 'Duplicate replaced preview'
old_files={Path(item['path']).name for item in initial['views']}
assert set(replacement)<=old_files
assert set(state['previews'])=={item['file'] for item in replacement.values()}, 'Unexpected generated previews'
destination=root/f'docs/previews/bible-v{release.replace(".","")}-{suffix}'
destination.mkdir(parents=True,exist_ok=True)
views=[]; retained=0; generated=0
for previous in initial['views']:
    name=Path(previous['path']).name
    if name in replacement:
        item=replacement[name]; image=args.output_dir/item['file']
        assert image.is_file(),image
        shutil.copy2(image,destination/item['file'])
        views.append({'path':str((destination/item['file']).relative_to(root)),'sheet':item['sheetName'],'range':item['range'],'sha256':sha(image),'method':'newly_rendered','replaces':previous['path']})
        generated+=1
    else:
        image=root/previous['path']; assert sha(image)==previous['sha256'],image
        sheet,area=previous['sheet'],previous['range']
        assert signature(before[sheet],area)==signature(after[sheet],area),(sheet,area,'Retained source range changed')
        views.append({'path':previous['path'],'sheet':sheet,'range':area,'sha256':previous['sha256'],'method':'retained_exact_range','sourceRangeAndLayoutIdentical':True,'previousVisualReceipt':str(initial_path.relative_to(root))})
        retained+=1
state['previews']=[item['path'] for item in views]
state['previewGeneration']={'generatedThisExport':generated,'retainedWithUnchangedSourceRanges':retained}
state['previewIntegrityReport']=f'docs/validation/{current}-preview-integrity.json'
state_path.write_text(json.dumps(state,ensure_ascii=False,indent=2)+'\n')
report={'version':source['meta']['version'],'workbookSha256':sha(root/'docs/ORDRE_DE_CENDRE_Bible.xlsx'),'sourceSha256':sha(root/'data/bible.json'),'baselineWorkbookSha256':initial['workbookSha256'],'baselineVisualReceipt':str(initial_path.relative_to(root)),'baselineVisualReceiptSha256':sha(initial_path),'stylesIdentical':True,'generated':generated,'retained':retained,'total':len(views),'views':views,'scope':'Old previews are retained only when values, formulas, style references, row heights and column geometry match exactly and the image still has its reviewed hash. Newly rendered images still require an explicit visual review.','passed':True}
(root/f'docs/validation/{current}-preview-integrity.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:report[key] for key in ['generated','retained','total','stylesIdentical','passed']}))
