import argparse, collections, json, re, zipfile, hashlib, subprocess, sys
from pathlib import Path
import xml.etree.ElementTree as ET

parser=argparse.ArgumentParser(description='Reconcile the Bible XLSX and audit its identifier references.')
parser.add_argument('root',nargs='?',default=str(Path(__file__).resolve().parents[1]))
parser.add_argument('baseline',nargs='?',default='03c69e7')
parser.add_argument('--references-only',action='store_true',help='Check source identifiers and references without touching the workbook or its existing reports.')
parser.add_argument('--reference-report',type=Path,help='Write the complete reference audit to this path relative to the repository root.')
args=parser.parse_args()
root=Path(args.root).resolve()
baseline=args.baseline
file=root/'docs/ORDRE_DE_CENDRE_Bible.xlsx'
source_bytes=(root/'data/bible.json').read_bytes()
source=json.loads(source_bytes)
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
        for name in ['bible-v08-ids.json','bible-v07-ids.json','bible-v06-ids.json','bible-v05-ids.json','bible-v04-ids.json']:
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

def reference_audit(document):
    """Resolve explicit two-letter/two-or-three-digit IDs and their ranges.

    Narrative evidence and standalone operations are symbols rather than row IDs.
    Their declarations are checked in the named canonical rows, not waived as
    arbitrary unknown prefixes. This validates links, not implementation status.
    """
    aliases={
      'OP01':('NA17','standalone_operation'), 'OP02':('NA18','standalone_operation'), 'OP03':('NA19','standalone_operation'),
      'PT01':('NA32','technical_evidence'), 'PT02':('MI10','technical_evidence'), 'PT03':('MI13','technical_evidence'),
      'PT04':('MI15','technical_evidence'), 'PT05':('MI18','technical_evidence'),
      'PO01':('MI22','political_evidence'), 'PO02':('MI26','political_evidence'), 'PO03':('MI30','political_evidence'),
      'TE01':('MI11','witness_evidence'), 'TE02':('MI15','witness_evidence'),
    }
    token=re.compile(r'(?<![A-Za-z0-9])(?P<prefix>[A-Z]{2})(?P<start>\d{2,3})(?:(?P<separator>[–—-])(?P<end_prefix>[A-Z]{2})?(?P<end>\d{2,3})|/(?P<short>\d{2,3}))?(?![A-Za-z0-9])')
    rows={}; duplicate_ids=[]; fields=[]; issues=[]
    def strings(value,path):
        if isinstance(value,str): yield path,value
        elif isinstance(value,list):
            for i,item in enumerate(value): yield from strings(item,f'{path}[{i}]')
        elif isinstance(value,dict):
            for key,item in value.items(): yield from strings(item,f'{path}.{key}')
    for sheet in document['sheets']:
        for row in sheet['rows']:
            identifier=row['id']
            if identifier in rows: duplicate_ids.append(identifier)
            rows[identifier]={'sheet':sheet['name'],'row':row}
            if not re.fullmatch(r'[A-Z]{2}\d{2,3}',identifier):
                issues.append({'type':'invalid_identifier','id':identifier})
            for key,value in row.items():
                if key=='id': continue
                for path,text in strings(value,key): fields.append((sheet['name'],identifier,path,text))
    for path,text in strings(document.get('meta',{}),'meta'):
        fields.append((None,None,path,text))
    def expanded(match):
        prefix=match['prefix']; start=int(match['start'])
        if match['end']:
            other=match['end_prefix'] or prefix
            end=int(match['end'])
            if other!=prefix or end<start:
                raise ValueError('Range endpoints must share a prefix and be ascending.')
            return [f'{prefix}{i:02}' for i in range(start,end+1)]
        if match['short']: return [f'{prefix}{start:02}',f'{prefix}{int(match["short"]):02}']
        return [f'{prefix}{start:02}']
    declarations={}
    for symbol,(anchor,kind) in aliases.items():
        row=rows.get(anchor)
        declared=[]
        if row:
            for value in row['row'].values():
                if not isinstance(value,str): continue
                for match in token.finditer(value):
                    try: declared.extend(expanded(match))
                    except ValueError: pass
        if row is None or symbol not in declared:
            issues.append({'type':'missing_symbol_declaration','symbol':symbol,'anchor':anchor})
        declarations[symbol]={'anchor':anchor,'sheet':row['sheet'] if row else None,'kind':kind,'declared':symbol in declared}
    occurrences=[]; resolved=collections.Counter(); range_count=0; abbreviated=0
    for sheet,identifier,field,text in fields:
        for match in token.finditer(text):
            location={'sheet':sheet,'sourceId':identifier,'field':field,'text':match.group()}
            try: targets=expanded(match)
            except ValueError as error:
                issues.append(dict(location,type='invalid_range',reason=str(error)))
                continue
            if match['end']: range_count+=1
            if match['short']: abbreviated+=1
            locations=[]
            for target in targets:
                if target in rows:
                    resolution={'id':target,'kind':'row','sheet':rows[target]['sheet']}
                elif target in declarations and declarations[target]['declared']:
                    resolution={'id':target,**declarations[target]}
                else:
                    issues.append(dict(location,type='unresolved_reference',target=target))
                    resolution={'id':target,'kind':'unresolved'}
                resolved[resolution['kind']]+=1
                locations.append(resolution)
            occurrences.append(dict(location,targets=locations))
    for identifier in duplicate_ids: issues.append({'type':'duplicate_identifier','id':identifier})
    return {
      'source':'data/bible.json','version':document['meta']['version'],
      'sourceSha256':hashlib.sha256(source_bytes).hexdigest(),
      'scope':'All explicit two-letter/two-or-three-digit identifiers in row fields and metadata, closed ranges and abbreviated pairs such as PT03/04. Symbols resolve to canonical declaration rows. Existence of a reference does not certify gameplay, art, narrative truth or human usability.',
      'sourceSheets':len(document['sheets']),'sourceRows':sum(len(s['rows']) for s in document['sheets']),
      'uniqueIds':len(rows),'textFieldsScanned':len(fields),'referenceOccurrences':len(occurrences),
      'closedRanges':range_count,'abbreviatedPairs':abbreviated,'expandedReferences':sum(resolved.values()),
      'resolvedByKind':dict(resolved),'symbolDeclarations':declarations,'issues':issues,
      'occurrences':occurrences,'passed':not issues,
    }

references=reference_audit(source)
if args.reference_report:
    path=root/args.reference_report
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(references,ensure_ascii=False,indent=2)+'\n')
assert references['passed'],references['issues']
if args.references_only:
    print(json.dumps({key:value for key,value in references.items() if key not in ('occurrences','symbolDeclarations')},ensure_ascii=False))
    sys.exit(0)

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
    state=root/'docs/validation/workbook-validation.json'
    q=json.loads(state.read_text())
    preview_count=len(q.get('previews',[]))
    preview_generation=q.get('previewGeneration',{})
    generated_count=preview_generation.get('generatedThisExport',preview_count)
    retained_count=preview_generation.get('retainedWithUnchangedSourceRanges',0)
    assert generated_count+retained_count==preview_count
    report={
      'workbook':file.name,'version':source['meta']['version'],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
      'sourceRecords':len(ids),'sourceCellsCompared':source_cells,'historicalRevision':baseline,'historicalIdsPreserved':len(old_ids),'addedIds':len(ids)-len(old_ids),
      'sheets':len(sheets),'namedTables':len(table_files),'calculatedFormulaCells':len(formulas),'errorCells':len(errors),
      'summaryCachesReconciled':True,'statusValidationRanges':validation_count,'conditionalFormatRules':cf_count,'frozenDataSheets':pane_count,
      'referenceAudit':{key:value for key,value in references.items() if key not in ('occurrences','symbolDeclarations')},
      'engineScope':'Recalcul et test de modification de statut exécutés dans @oai/artifact-tool. Ce contrôle lit le ZIP/XML exporté; une éventuelle exécution native est consignée séparément et ne se déduit pas de ce rapport.',
      'renderedPreviewCount':preview_count,
      'generatedPreviewCountThisExport':generated_count,'retainedPreviewCount':retained_count,
      'visualScope':f'{preview_count} vues associées à la réception : {generated_count} générées par cet export et {retained_count} conservées sur des plages source inchangées. Leur relecture effective et leurs empreintes sont consignées séparément; le nombre de vues ne certifie ni navigateur ni usage natif du classeur.' if preview_count else 'Aucune nouvelle vue générée pour cet export initial. Relecture visuelle finale et contrôle natif restent séparés de cette réconciliation XML.',
    }
    release='.'.join(source['meta']['version'].split('.')[:2])
    out=root/f'docs/validation/workbook-v{release}-export.json'; out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    q['exportValidation']=report;state.write_text(json.dumps(q,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))
