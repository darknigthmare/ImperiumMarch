import json, hashlib, shutil, subprocess, tempfile, zipfile, posixpath, os, signal, re
from pathlib import Path
from xml.etree import ElementTree as ET

root=Path(__file__).resolve().parents[1]
original=root/'docs/ORDRE_DE_CENDRE_Bible.xlsx'
outdir=root/'docs/validation'
source=json.loads((root/'data/bible.json').read_text())
receipt_suffix=os.environ.get('BIBLE_RECEIPT_SUFFIX','')
assert not receipt_suffix or re.fullmatch(r'[a-z0-9][a-z0-9-]*',receipt_suffix), 'Invalid BIBLE_RECEIPT_SUFFIX'
release='.'.join(source['meta']['version'].split('.')[:2])+('-'+receipt_suffix if receipt_suffix else '')
N='http://schemas.openxmlformats.org/spreadsheetml/2006/main'; R='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
ns={'s':N}; tag=lambda x:'{'+N+'}'+x
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def col(n):
 s=''
 while n: n,m=divmod(n-1,26);s=chr(65+m)+s
 return s
def inspect(p):
 z=zipfile.ZipFile(p); strings=[]
 if 'xl/sharedStrings.xml' in z.namelist():
  strings=[''.join(n.text or '' for n in x.iter(tag('t'))) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
 rels={r.attrib['Id']:posixpath.normpath(posixpath.join('xl',r.attrib['Target'])) if not r.attrib['Target'].startswith('/') else r.attrib['Target'].lstrip('/') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
 book=ET.fromstring(z.read('xl/workbook.xml')); sheets={}; formulas={}; errors=[]; structural={}
 for s in book.find(tag('sheets')):
  name=s.attrib['name']; sx=ET.fromstring(z.read(rels[s.attrib['{'+R+'}id']])); cv={}
  for c in sx.findall('.//s:sheetData/s:row/s:c',ns):
   ref=c.attrib['r']; v=c.find(tag('v')); raw=v.text if v is not None else None; typ=c.attrib.get('t')
   if typ=='s': val=strings[int(raw)]
   elif typ=='inlineStr': val=''.join(n.text or '' for n in c.iter(tag('t')))
   elif raw is None: val=None
   elif typ in ['str','e']: val=raw
   elif typ=='b': val=bool(int(raw))
   else:
    val=float(raw); val=int(val) if val.is_integer() else val
   if val is not None:cv[ref]=val
   f=c.find(tag('f'))
   if f is not None:formulas[name+'!'+ref]={'formula':f.text,'value':val}
   if typ=='e':errors.append({'sheet':name,'cell':ref,'error':val})
  sheets[name]=cv
  structural[name]={'validationRanges':len(sx.findall('s:dataValidations/s:dataValidation',ns)),
   'conditionalRules':len(sx.findall('s:conditionalFormatting/s:cfRule',ns)),
   'pane':(sx.find('s:sheetViews/s:sheetView/s:pane',ns).attrib if sx.find('s:sheetViews/s:sheetView/s:pane',ns) is not None else None)}
 return {'sheets':sheets,'formulas':formulas,'errors':errors,'tableFiles':len([n for n in z.namelist() if n.startswith('xl/tables/') and n.endswith('.xml')]),'structural':structural}

before=sha(original); initial=inspect(original)
assert len(initial['formulas'])==126 and not initial['errors']
work=Path(tempfile.mkdtemp(prefix='ordre-bible-native-'))
(work/'input').mkdir(); (work/'output').mkdir()
copy=work/'input'/original.name
cleared=0
# Verification stimulus only: remove cached formula values on a disposable copy.
# Source values, formula expressions, formatting and the final workbook remain intact.
with zipfile.ZipFile(original) as zin,zipfile.ZipFile(copy,'w') as zout:
 for info in zin.infolist():
  data=zin.read(info.filename)
  if info.filename.startswith('xl/worksheets/') and info.filename.endswith('.xml'):
   sx=ET.fromstring(data); changed=False
   for c in sx.findall('.//s:sheetData/s:row/s:c',ns):
    if c.find(tag('f')) is not None:
     v=c.find(tag('v'))
     if v is not None: c.remove(v)
     cleared+=1; changed=True
   if changed:data=ET.tostring(sx,encoding='utf-8',xml_declaration=True)
  zout.writestr(info,data)
blank=inspect(copy)
assert cleared==126 and all(v['value'] is None for v in blank['formulas'].values())
assert {k:v['formula'] for k,v in blank['formulas'].items()}=={k:v['formula'] for k,v in initial['formulas'].items()}
for name,values in initial['sheets'].items():
 for ref,value in values.items():
  if name+'!'+ref not in initial['formulas']:assert blank['sheets'][name].get(ref)==value

version=subprocess.run(['soffice','--version'],text=True,capture_output=True,check=True).stdout.strip()
cmd=['soffice','-env:UserInstallation='+ (work/'profile').as_uri(),'--headless','--convert-to','xlsx:Calc MS Excel 2007 XML','--outdir',str(work/'output'),str(copy)]
proc=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,start_new_session=True)
try:stdout,stderr=proc.communicate(timeout=55)
except subprocess.TimeoutExpired:
 os.killpg(proc.pid,signal.SIGKILL);stdout,stderr=proc.communicate();raise RuntimeError('LibreOffice exceeded 55 seconds: '+stderr)
result=work/'output'/original.name
report={'version':source['meta']['version'],'method':'LibreOffice headless Calc XLSX import and export, disposable copy with all 126 formula caches removed; no interactive GUI test.',
 'nativeApplication':version,'command':cmd,'exitCode':proc.returncode,'stdout':stdout,'stderr':stderr,
 'originalSha256Before':before,'originalSha256After':sha(original),'sourceJsonSha256':sha(root/'data/bible.json'),
 'formulaCachesClearedInTestCopy':cleared,'testInputSha256':sha(copy),'originalUnchanged':before==sha(original),
 'scopeLimit':'Does not certify native GUI sorting/filtering, freeze-pane use, user editing, Excel desktop, game UI, human usability or hardware.'}
if proc.returncode==0 and result.exists():
 final=inspect(result); diffs=[]
 for name in set(initial['sheets'])|set(final['sheets']):
  left=initial['sheets'].get(name,{});right=final['sheets'].get(name,{})
  for cell in set(left)|set(right):
   if left.get(cell)!=right.get(cell):diffs.append({'sheet':name,'cell':cell,'before':left.get(cell),'after':right.get(cell)})
 count=0;sourceDiffs=[]
 for s in source['sheets']:
  for i,row in enumerate(s['rows'],7):
   for j,c in enumerate(s['columns'],1):
    expected=row.get(c['key']);actual=final['sheets'][s['name']].get(col(j)+str(i))
    if c['key']=='legs':expected=int(expected)
    if c['key']=='height':expected=float(expected.replace('m','').strip().replace(',','.'))
    if expected!=actual:sourceDiffs.append({'sheet':s['name'],'cell':col(j)+str(i),'expected':expected,'actual':actual})
    count+=1
 formulaDiffs=[{'cell':k,'before':v,'after':final['formulas'].get(k)} for k,v in initial['formulas'].items() if final['formulas'].get(k,{}).get('value')!=v['value']]
 report.update(outputSha256=sha(result),sheetCount=len(final['sheets']),formulaCells=len(final['formulas']),
  populatedFormulaCaches=sum(v['value'] is not None for v in final['formulas'].values()),
  errorCells=final['errors'],sourceCellsCompared=count,sourceCellDifferences=sourceDiffs,allCellValueDifferences=diffs,
  formulaResultDifferences=formulaDiffs,formulaExpressionsChanged=[k for k,v in initial['formulas'].items() if final['formulas'].get(k,{}).get('formula')!=v['formula']],
  structuralBefore={'tableFiles':initial['tableFiles'],'sheets':initial['structural']},
  structuralAfter={'tableFiles':final['tableFiles'],'sheets':final['structural']},
  passed=not diffs and not sourceDiffs and not formulaDiffs and not final['errors'] and len(final['formulas'])==126 and report['originalUnchanged'])
else: report['passed']=False
(outdir/f'workbook-v{release}-libreoffice.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(outdir/f'workbook-v{release}-libreoffice.txt').write_text((version+'\n'+'\n'.join(cmd)+'\n'+stdout+'\n'+stderr).rstrip()+'\n')
print(json.dumps({k:report.get(k) for k in ['passed','nativeApplication','formulaCachesClearedInTestCopy','populatedFormulaCaches','sourceCellsCompared','sourceCellDifferences','formulaResultDifferences','allCellValueDifferences','originalUnchanged']},ensure_ascii=False))
assert report['passed'], f'Native copy inspection found differences; see workbook-v{release}-libreoffice.json'
