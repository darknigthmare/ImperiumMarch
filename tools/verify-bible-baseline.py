"""Verify Bible continuity against its frozen, authentic previous release.

This checks source identity, ordered IDs, untouched historical receipts, and the
versioned production registry. Workbook cell/formula checks are a separate tool.
"""
import argparse, datetime, hashlib, json, subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path)
parser.add_argument('--prepare', action='store_true', help='Prepare historical checks before the first new registry exists; run again without this flag before freezing receipts.')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source_bytes = (root/'data/bible.json').read_bytes()
source = json.loads(source_bytes)
previous = source['meta']['previousRelease']
fixture_path = root/previous['ids']
fixture = json.loads(fixture_path.read_bytes())
git = lambda *cmd: subprocess.check_output(['git', *cmd], cwd=root, stderr=subprocess.PIPE)
revision = None
for candidate in dict.fromkeys([fixture.get('localSourceRevision'), fixture['sourceRevision']]):
    if not candidate:
        continue
    try:
        git('cat-file', '-e', candidate+':data/bible.json')
        revision = candidate
        break
    except subprocess.CalledProcessError:
        continue
if revision is None:
    raise RuntimeError('The authentic previous commit is required for byte comparisons; use verify-bible-export.py for the frozen-ID check without Git history.')
sha = lambda raw: hashlib.sha256(raw).hexdigest()
old_bytes = git('show', revision+':data/bible.json')
old = json.loads(old_bytes)
assert sha(old_bytes) == fixture['sourceSha256']
assert git('rev-parse', revision+':data/bible.json').decode().strip() == fixture['sourceBlob']
assert git('rev-parse', revision+'^{tree}').decode().strip() == fixture['sourceTree']
assert fixture['sourceRevision'] == previous['sourceRevision']
expected_sheets = [{'name': s['name'], 'ids': [r['id'] for r in s['rows']]} for s in old['sheets']]
assert fixture['sheets'] == expected_sheets
assert fixture['idCount'] == sum(len(s['rows']) for s in old['sheets']) == previous['recordCount']
assert [s['name'] for s in source['sheets']] == [s['name'] for s in old['sheets']]
changes = []
added = []
for before, after in zip(old['sheets'], source['sheets']):
    assert before['columns'] == after['columns'], before['name']
    ids = [r['id'] for r in before['rows']]
    assert [r['id'] for r in after['rows'][:len(ids)]] == ids, before['name']
    current = {r['id']: r for r in after['rows']}
    for row in before['rows']:
        fields = [key for key in row if row[key] != current[row['id']].get(key)]
        if fields:
            changes.append({'sheet': before['name'], 'id': row['id'], 'fields': fields})
    added.extend(r['id'] for r in after['rows'][len(ids):])

tracked = git('ls-tree', '-r', '--name-only', revision).decode().splitlines()
protected = [p for p in tracked if p.startswith(('docs/validation/', 'tests/fixtures/', 'docs/previews/bible-v'))
             or (p.startswith('data/production-v') and p.endswith('-receipts.json'))
             or (p.startswith('docs/PRODUCTION_REGISTER_V') and p.endswith('.md'))]
for name in protected:
    assert (root/name).is_file(), f'Missing historical file: {name}'
    assert (root/name).read_bytes() == git('show', revision+':'+name), f'Historical bytes changed: {name}'

previous_tag = ''.join(previous['version'].split('.')[:2])
release_tag = ''.join(source['meta']['version'].split('.')[:2])
previous_registry = json.loads((root/f'docs/validation/production-v{previous_tag}-registry.json').read_bytes())
registry_path = root/f'docs/validation/production-v{release_tag}-registry.json'
registry = previous_registry if args.prepare else json.loads(registry_path.read_bytes())
baseline = json.loads((root/'docs/validation/production-v09-baseline.json').read_bytes())
assert len(baseline['records']) == len(previous_registry['records']) == len(registry['records']) == 133
originals = {r['id']: r for r in baseline['records']}
new_records = {r['id']: r for r in registry['records']}
for row in previous_registry['records']:
    new = new_records[row['id']]
    original = originals[row['id']]
    assert new['criterion'] == row['criterion'] == original['criterion']
    assert new['sourceRecord'] == row['sourceRecord'] == original['sourceRecord']
    for key in row:
        if key.startswith('v') and key[1:].isdigit():
            assert new[key] == row[key], (row['id'], key)

report = {
    'version': source['meta']['version'], 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Authentic historical source and ordered ID conservation. Original criteria, prior versioned receipts and historical files are compared exactly. Does not certify gameplay, workbook native interaction or human usability.',
    'sourceRevision': fixture['sourceRevision'], 'localSourceRevision': fixture.get('localSourceRevision'),
    'resolvedHistoricalRevision': revision, 'sourceTree': fixture['sourceTree'],
    'sourcePath': fixture['sourcePath'], 'sourceBlob': fixture['sourceBlob'], 'historicalJsonSha256': sha(old_bytes),
    'fixturePath': previous['ids'], 'fixtureSha256': sha(fixture_path.read_bytes()),
    'fixtureExactlyMatchesHistoricalIdsBySheet': True, 'historicalIdsPreserved': fixture['idCount'],
    'currentIds': sum(len(s['rows']) for s in source['sheets']), 'addedIds': added, 'changedHistoricalRows': changes,
    'historicalFilesCompared': len(protected), 'historicalBytesUnchanged': True,
    'originalPendingCriteria': 133, 'originalRowsUnchanged': True, 'originalCriteriaUnchanged': True,
    'previousReceiptsPreservedThrough': previous['version'], 'newRegistryCompared': not args.prepare,
    'currentSourceSha256': sha(source_bytes),
    'registryRecordsSha256': None if args.prepare else sha(json.dumps(registry['records'],ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()),
    'passed': True,
}
output = args.output or root/f'docs/validation/workbook-v{".".join(source["meta"]["version"].split(".")[:2])}-baseline-check.json'
if not output.is_absolute(): output = root/output
output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps({key: report[key] for key in ['historicalIdsPreserved', 'currentIds', 'historicalFilesCompared', 'originalPendingCriteria', 'passed']}, ensure_ascii=False))
