import copy, datetime, hashlib, json, os, pathlib, shutil, subprocess, tempfile

root=pathlib.Path(__file__).resolve().parents[1]
tool=root/'tools/verify-bible-export.py'
python=os.environ['CODEX_PRIMARY_RUNTIME_PYTHON']
original=json.loads((root/'data/bible.json').read_bytes())
by_id=lambda d: {r['id']:r for s in d['sheets'] for r in s['rows']}

def unknown(d): d['sheets'][0]['rows'][0]['acceptance'] += ' QA999'
def range_hole(d):
    d['sheets'][0]['rows'][0]['acceptance'] += ' SY39–SY41'
    for s in d['sheets']: s['rows']=[r for r in s['rows'] if r['id']!='SY40']
def reverse_range(d): d['sheets'][0]['rows'][0]['acceptance'] += ' SY08–SY01'
def mixed_range(d): d['sheets'][0]['rows'][0]['acceptance'] += ' SY01–AS03'
def duplicate(d): d['sheets'][0]['rows'].append(copy.deepcopy(d['sheets'][0]['rows'][0]))
def missing_symbol(d): by_id(d)['NA32']['name']='Déclaration supprimée pour test négatif isolé'
def unknown_short(d): d['sheets'][0]['rows'][0]['acceptance'] += ' PT03/99'

cases=[('unknown_three_digit_id',unknown,'unresolved_reference'),
       ('missing_interior_of_closed_range',range_hole,'unresolved_reference'),
       ('descending_range',reverse_range,'invalid_range'),
       ('mixed_prefix_range',mixed_range,'invalid_range'),
       ('duplicate_source_identifier',duplicate,'duplicate_identifier'),
       ('symbol_without_canonical_declaration',missing_symbol,'missing_symbol_declaration'),
       ('unknown_abbreviated_partner',unknown_short,'unresolved_reference')]
results=[]
with tempfile.TemporaryDirectory(prefix='imperium-bible-reference-probes-') as directory:
    work=pathlib.Path(directory); (work/'data').mkdir()
    for name,mutate,expected in cases:
        data=copy.deepcopy(original); mutate(data)
        (work/'data/bible.json').write_text(json.dumps(data,ensure_ascii=False))
        run=subprocess.run([python,str(tool),str(work),'--references-only','--reference-report','probe.json'],capture_output=True,text=True)
        report=json.loads((work/'probe.json').read_text())
        assert run.returncode!=0,(name,'unexpected acceptance')
        assert any(x['type']==expected for x in report['issues']),(name,report['issues'])
        results.append({'case':name,'expectedIssue':expected,'detectedIssues':report['issues'],'rejected':True})

fallbacks=[]
with tempfile.TemporaryDirectory(prefix='imperium-bible-no-git-v010-') as directory:
    work=pathlib.Path(directory)
    release='.'.join(original['meta']['version'].split('.')[:2])
    for path in ['data/bible.json','docs/ORDRE_DE_CENDRE_Bible.xlsx',f'docs/validation/workbook-v{release}-validation.json']:
        dest=work/path; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(root/path,dest)
    (work/'tests/fixtures').mkdir(parents=True)
    for source in (root/'tests/fixtures').glob('bible-v*-ids.json'): shutil.copy2(source,work/'tests/fixtures'/source.name)
    for rev,count in [(None,816),('03c69e7',769),('1e7eadb',705),('c598bad',643),('d7d76b6',581),('c81a360',526)]:
        command=[python,str(tool),str(work)]+([rev] if rev else [])
        run=subprocess.run(command,capture_output=True,text=True)
        assert run.returncode==0,(rev,run.stderr)
        report=json.loads(run.stdout)
        assert report['historicalIdsPreserved']==count
        assert 'frozen baseline' in run.stderr
        fallbacks.append({'argument':rev or 'default','historicalIds':count,'passed':True,'withoutGit':True})
    run=subprocess.run([python,str(tool),str(work),'abcdef0'],capture_output=True,text=True)
    assert run.returncode!=0 and 'is unavailable' in run.stderr
    fallbacks.append({'argument':'abcdef0','expected':'unrecognized revision rejected','passed':True,'withoutGit':True})

report={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'sourceVersion':original['meta']['version'],
        'sourceSha256':hashlib.sha256((root/'data/bible.json').read_bytes()).hexdigest(),
        'verifierSha256':hashlib.sha256(tool.read_bytes()).hexdigest(),
        'scope':'Synthetic negative mutations in disposable source copies. Real source, workbook and historical reports are not modified.',
        'negativeReferenceProbes':results,'historicalFallbacks':fallbacks,'passed':True}
(root/'docs/validation/production-v010-reference-probes.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'negativeProbes':len(results),'fallbacks':len(fallbacks),'passed':True},ensure_ascii=False))
