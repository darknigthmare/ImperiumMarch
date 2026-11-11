"""Compare unaffected workbook content and layout with the exact prior export."""
import argparse, hashlib, json, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('baseline_workbook', type=Path)
parser.add_argument('baseline_source', type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source = json.loads((root/'data/bible.json').read_text())
before_source = json.loads(args.baseline_source.read_text())
current = root/'docs/ORDRE_DE_CENDRE_Bible.xlsx'
ns = {'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
rel = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()

def inspect(path):
    with zipfile.ZipFile(path) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(t.text or '' for t in si.findall('.//s:t', ns)) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        targets = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for sheet in ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', ns):
            target = targets[sheet.attrib[rel]]
            target = target.lstrip('/') if target.startswith('/') else 'xl/'+target
            tree = ET.fromstring(z.read(target))
            cells = {}
            for c in tree.findall('s:sheetData/s:row/s:c', ns):
                value = c.find('s:v', ns)
                raw = value.text if value is not None else None
                kind = c.attrib.get('t')
                if kind == 's': raw = strings[int(raw)]
                elif kind == 'inlineStr': raw = ''.join(t.text or '' for t in c.findall('.//s:t', ns))
                formula = c.find('s:f', ns)
                cells[c.attrib['r']] = {'value':raw, 'formula':formula.text if formula is not None else None, 'style':c.attrib.get('s'), 'kind':'string' if kind in ['s','inlineStr'] else kind}
            sheets[sheet.attrib['name']] = {
                'cells':cells,
                'rows':{int(r.attrib['r']):dict(r.attrib) for r in tree.findall('s:sheetData/s:row', ns)},
                'columns':[dict(c.attrib) for c in tree.findall('s:cols/s:col', ns)],
                'views':ET.tostring(tree.find('s:sheetViews', ns)),
            }
        return sheets, hashlib.sha256(z.read('xl/styles.xml')).hexdigest()

before, old_styles = inspect(args.baseline_workbook)
after, new_styles = inspect(current)
assert list(before) == list(after)
assert old_styles == new_styles, 'Unrequested workbook style changes'
unchanged_cells = 0
unchanged_rows = 0
changed_rows = []
changed_descriptions = []
def column(index):
    result = ''
    while index:
        index, remainder = divmod(index-1,26)
        result = chr(65+remainder)+result
    return result

for old_spec, spec in zip(before_source['sheets'], source['sheets']):
    name = spec['name']
    old_sheet, sheet = before[name], after[name]
    assert old_sheet['columns'] == sheet['columns'], (name, 'columns')
    assert old_sheet['views'] == sheet['views'], (name, 'views and panes')
    assert old_spec['columns'] == spec['columns']
    changed_addresses = {'A4'}  # The release/count label is expected to change.
    if old_spec.get('description') != spec.get('description'):
        assert sheet['cells']['A3']['value'] == spec.get('description'), (name, 'description differs from source')
        changed_addresses.add('A3')
        changed_descriptions.append({'sheet':name, 'cell':'A3', 'before':old_spec.get('description'), 'after':spec.get('description')})
    changed_numbers = set()
    for i, old_row in enumerate(old_spec['rows'],7):
        row = spec['rows'][i-7]
        assert row['id'] == old_row['id']
        fields = []
        for j, field in enumerate(spec['columns'],1):
            if row.get(field['key']) != old_row.get(field['key']):
                fields.append(field['key'])
                changed_addresses.add(f'{column(j)}{i}')
        if fields:
            changed_numbers.add(i)
            changed_rows.append({'sheet':name, 'row':i, 'id':row['id'], 'fields':fields})
        else:
            unchanged_rows += 1
    for address, cell in old_sheet['cells'].items():
        newer = sheet['cells'].get(address)
        assert newer is not None, (name,address,'missing cell')
        assert cell['style'] == newer['style'], (name,address,'style')
        if address not in changed_addresses:
            assert cell == newer, (name,address,'unaffected cell differs')
            unchanged_cells += 1
    for number, attributes in old_sheet['rows'].items():
        if number not in changed_numbers:
            assert attributes == sheet['rows'][number], (name,number,'unaffected row geometry')

assert before['Synthèse']['columns'] == after['Synthèse']['columns']
assert before['Synthèse']['rows'] == after['Synthèse']['rows']
for address, cell in before['Synthèse']['cells'].items():
    assert cell['style'] == after['Synthèse']['cells'][address]['style'], ('Synthèse',address,'style')

report = {
    'version':source['meta']['version'], 'baselineVersion':before_source['meta']['version'],
    'baselineWorkbookSha256':sha(args.baseline_workbook), 'baselineSourceSha256':sha(args.baseline_source),
    'workbookSha256':sha(current), 'sourceSha256':sha(root/'data/bible.json'),
    'sheetOrderPreserved':True, 'stylesXmlUnchanged':True, 'columnGeometryUnchanged':True,
    'viewsAndPanesUnchanged':True, 'unaffectedCellsCompared':unchanged_cells,
    'unaffectedDataRowsCompared':unchanged_rows, 'changedDataRows':changed_rows,
    'changedDescriptions':changed_descriptions,
    'scope':'Unchanged source cells, styles, row/column geometry and sheet views are compared exactly. Release labels, descriptions reconciled to source, and declared data edits are excluded only from value equality. New or changed text requires separate visual review. Summary formulas/results are independently reconciled by verify-bible-export.py.',
    'passed':True,
}
release = '.'.join(source['meta']['version'].split('.')[:2])
(root/f'docs/validation/workbook-v{release}-layout.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({key:report[key] for key in ['unaffectedCellsCompared','unaffectedDataRowsCompared','stylesXmlUnchanged','passed']}))
