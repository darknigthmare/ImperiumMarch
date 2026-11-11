import json, re, zipfile, hashlib, subprocess, sys
from pathlib import Path
import xml.etree.ElementTree as ET

root=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parents[1]
baseline=sys.argv[2] if len(sys.argv)>2 else 'c598bad'
file=root/'docs/ORDRE_DE_CENDRE_Bible.xlsx'
source=json.loads((root/'data/bible.json').read_text())
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
N='{'+ns['s']+'}'
def col(i):
    out=''
    while i:
        i, r=divmod(i-1,26); out=chr(65+r)+out
    return out
def expected(value,key):
    if key=='legs' and str(value).isdigit(): return int(value)
    if key=='height' and re.fullmatch(r'\d+(?:[.,]\d+)?\s*m',str(value)):
        return float(str(value).removesuffix('m').strip().replace(',','.'))
    if isinstance(value,list): return '\n'.join(map(str,value))
    return value
def historical_ids(revision):
    try:
        raw=subprocess.check_output(['git','show',revision+':data/bible.json'],cwd=root,stderr=subprocess.PIPE)
    except (subprocess.CalledProcessError, FileNotFoundError) as error:
        # Published snapshots and source archives may not carry local Git history.
        # Each frozen fixture is valid for its recorded historical revision only.
        candidates=[]
        for name in ['bible-v06-ids.json','bible-v05-ids.json','bible-v04-ids.json']:
            fixture_path=root/'tests/fixtures'/name
            if fixture_path.is_file(): candidates.append(json.loads(fixture_path.read_text()))
        matches=[candidate for candidate in candidates
                 if re.fullmatch(r'[0-9a-fA-F]{7,40}',revision)
                 and re.fullmatch(r'[0-9a-f]{40}',candidate.get('sourceRevision',''))
                 and candidate['sourceRevision'].startswith(revision.lower())]
        if len(matches)!=1:
            available=', '.join(candidate.get('sourceRevision','invalid') for candidate in candidates) or 'none'
            raise RuntimeError(f'Historical Git revision {revision!r} is unavailable; frozen baselines cover {available}.') from error
        frozen=matches[0]
        recorded=frozen['sourceRevision']
        assert frozen['format']=='ordre-de-cendre.bible-id-baseline' and frozen['version']==1
        assert frozen['sourcePath']=='data/bible.json'
        assert re.fullmatch(r'[0-9a-f]{40}',frozen['sourceBlob'])
        assert re.fullmatch(r'[0-9a-f]{64}',frozen['sourceSha256'])
        sheet_names=[sheet['name'] for sheet in frozen['sheets']]
        assert len(sheet_names)==len(set(sheet_names))
        values=[identifier for sheet in frozen['sheets'] for identifier in sheet['ids']]
        assert all(isinstance(identifier,str) and identifier for identifier in values)
        assert len(values)==len(set(values))==frozen['idCount']
        print(f'Historical IDs: frozen baseline {recorded} (Git revision unavailable).',file=sys.stderr)
        return set(values)
    old=json.loads(raw)
    return {r['id'] for sheet in old['sheets'] for r in sheet['rows']}

old_ids=historical_ids(baseline)
ids=[r['id'] for s in source['sheets'] for r in s['rows']]
assert len(ids)==len(set(ids))
assert old_ids<=set(ids)
with zipfile.ZipFile(file) as z:
    strings=[]
    if 'xl/sharedStrings.xml' in z.namelist():
        strings=[''.join(t.text or '' for t in si.iter(N+'t')) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    wb=ET.fromstring(z.read('xl/workbook.xml'))
    relationships=ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    targets={r.attrib['Id']:r.attrib['Target'] for r in relationships}
    sheets={}
    for s in wb.find('s:sheets',ns):
        t=targets[s.attrib['{'+ns['r']+'}id']]
        p=t.lstrip('/') if t.startswith('/') else 'xl/'+t
        sheets[s.attrib['name']]=ET.fromstring(z.read(p))
    assert list(sheets)==['Synthèse']+[s['name'] for s in source['sheets']]
    def cells(sheet):
        out={}
        for c in sheet.findall('.//s:sheetData/s:row/s:c',ns):
            v=c.find('s:v',ns); text=v.text if v is not None else None
            t=c.attrib.get('t')
            if t=='s': val=strings[int(text)]
            elif t=='inlineStr': val=''.join(n.text or '' for n in c.iter(N+'t'))
            elif text is None: val=None
            elif t in ['str','e']: val=text
            else: val=float(text); val=int(val) if val.is_integer() else val
            out[c.attrib['r']]=(val,c)
        return out
    source_cells=0; pane_count=0; validation_count=0; cf_count=0
    formulas=[]; errors=[]
    for name, sx in sheets.items():
        for ref,(v,c) in cells(sx).items():
            if c.find('s:f',ns) is not None: formulas.append((name,ref,c.find('s:f',ns).text,v))
            if c.attrib.get('t')=='e': errors.append((name,ref,v))
    assert not errors,errors
    for spec in source['sheets']:
        name=spec['name']; sx=sheets[name]; cv=cells(sx)
        for i,row in enumerate(spec['rows'],7):
            for j,field in enumerate(spec['columns'],1):
                ref=f'{col(j)}{i}'; exp=expected(row.get(field['key']),field['key'])
                actual=cv.get(ref,(None,None))[0]
                assert actual==exp,(name,ref,exp,actual)
                source_cells+=1
        last=6+len(spec['rows']); last_col=col(len(spec['columns']))
        pane=sx.find('s:sheetViews/s:sheetView/s:pane',ns)
        assert pane is not None and pane.attrib.get('xSplit')=='2' and pane.attrib.get('ySplit')=='6',(name,ET.tostring(pane) if pane is not None else None)
        pane_count+=1
        stat_idx=next(i+1 for i,c in enumerate(spec['columns']) if c['key']=='status')
        val=sx.find('s:dataValidations/s:dataValidation',ns)
        assert val is not None and val.attrib['sqref']==f'{col(stat_idx)}7:{col(stat_idx)}{last}'
        assert val.attrib['type']=='list'
        assert all(s in val.find('s:formula1',ns).text for s in ['Conçu','Prototype','À produire','Vérifié'])
        validation_count+=1
        cf=sx.findall('s:conditionalFormatting/s:cfRule',ns)
        assert len(cf)==4,(name,len(cf)); cf_count+=len(cf)
    summary=cells(sheets['Synthèse'])
    for i,spec in enumerate(source['sheets'],12):
        assert summary[f'A{i}'][0]==spec['name']
        assert summary[f'B{i}'][0]==len(spec['rows'])
        for j,status in enumerate(['Conçu','Prototype','À produire','Vérifié'],3):
            count=sum(r.get('status')==status for r in spec['rows'])
            assert summary[f'{col(j)}{i}'][0]==count
        assert summary[f'G{i}'][0]==0
    assert summary['B32'][0]==len(ids)
    for j,status in enumerate(['Conçu','Prototype','À produire','Vérifié'],3):
        assert summary[f'{col(j)}32'][0]==sum(r['status']==status for s in source['sheets'] for r in s['rows'])
    assert summary['G32'][0]==0
    table_files=[n for n in z.namelist() if re.fullmatch(r'xl/tables/table\d+\.xml',n)]
    assert len(table_files)==len(source['sheets'])
    for i,spec in enumerate(source['sheets'],1):
        tables=[ET.fromstring(z.read(f)) for f in table_files]
        table=next(t for t in tables if t.attrib['name']==f'Bible_{i:02}')
        assert table.attrib['ref']==f'A6:{col(len(spec["columns"]))}{6+len(spec["rows"])}'
    report={
      'workbook':file.name,'version':source['meta']['version'],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
      'sourceRecords':len(ids),'sourceCellsCompared':source_cells,'historicalRevision':baseline,'historicalIdsPreserved':len(old_ids),'addedIds':len(ids)-len(old_ids),
      'sheets':len(sheets),'namedTables':len(table_files),'calculatedFormulaCells':len(formulas),'errorCells':len(errors),
      'summaryCachesReconciled':True,'statusValidationRanges':validation_count,'conditionalFormatRules':cf_count,'frozenDataSheets':pane_count,
      'engineScope':'Recalcul et test de modification de statut exécutés dans @oai/artifact-tool. Contrôle du fichier XLSX exporté par lecture XML; aucune exécution native dans Excel ni LibreOffice.',
      'visualScope':'Synthèse et vues des domaines ajoutés ou modifiés, avec aperçus des lignes nouvelles. Mise en page des autres tables conservée. Pas de validation navigateur ni de comportement natif Excel.',
    }
    release='.'.join(source['meta']['version'].split('.')[:2])
    out=root/f'docs/validation/workbook-v{release}-export.json'; out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    state=root/'docs/validation/workbook-validation.json'; q=json.loads(state.read_text());q['exportValidation']=report;state.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))
