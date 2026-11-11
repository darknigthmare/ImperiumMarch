#!/usr/bin/env node
/** Add versioned receipts to the immutable 133-item production baseline.
 * Does not infer acceptance from source-file presence or change Bible statuses.
 * Supply explicit receipts; --freeze hashes their real evidence after validation.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freeze = process.argv.includes('--freeze');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name)));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const baselinePath = 'docs/validation/production-v09-baseline.json';
const bible = read('data/bible.json');
const release = bible.meta.version.split('.').slice(0, 2).join('.');
const previousRelease = bible.meta.previousRelease.version.split('.').slice(0, 2).join('.');
const releaseTag = release.replace('.', '');
const previousTag = previousRelease.replace('.', '');
const receiptKey = `v${releaseTag}`;
const previousKey = `v${previousTag}`;
const previousPath = `docs/validation/production-v${previousTag}-registry.json`;
const receiptPath = `data/production-v${releaseTag}-receipts.json`;
const destination = `docs/validation/production-v${releaseTag}-registry.json`;
const baseline = read(baselinePath), previous = read(previousPath), receipt = read(receiptPath);
assert.equal(receipt.version, bible.meta.version);
assert.equal(baseline.records.length, 133);
assert.equal(previous.records.length, 133);
const originals = new Map(baseline.records.map(row => [row.id, row]));
const current = new Map(bible.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row])));
const additions = new Map(receipt.records.map(row => [row.id, row]));
assert.equal(additions.size, receipt.records.length, 'duplicate receipt ID');
for (const id of additions.keys()) assert.ok(originals.has(id), `receipt outside immutable baseline: ${id}`);
const records = previous.records.map(old => {
  const original = originals.get(old.id);
  assert.ok(original, `missing baseline ${old.id}`);
  assert.equal(old.criterion, original.criterion, `original criterion changed: ${old.id}`);
  assert.deepEqual(old.sourceRecord, original.sourceRecord, `original source row changed: ${old.id}`);
  assert.ok(current.has(old.id));
  const addition = additions.get(old.id);
  const status = current.get(old.id).status;
  const item = structuredClone(old);
  item.previousReleaseStatus = old.currentStatus;
  item.currentStatus = status;
  item[receiptKey] = addition ? {
    state: addition.state,
    workPerformed: addition.workPerformed,
    deliverables: addition.deliverables,
    evidence: addition.evidence,
    remainingWork: addition.remainingWork,
    statusChange: status === old.currentStatus ? null : { from: old.currentStatus, to: status, basis: addition.statusBasis },
  } : { state: 'no_new_receipt', workPerformed: [], deliverables: [], evidence: [], remainingWork: old[previousKey].remainingWork, statusChange: null };
  if (!addition) assert.equal(status, old.currentStatus, `status changed without a versioned receipt: ${old.id}`);
  for (const name of [...item[receiptKey].deliverables, ...item[receiptKey].evidence]) assert.ok(fs.existsSync(path.join(root, name)), `missing receipt file: ${name}`);
  return item;
});
const counts = Object.fromEntries(['Assets', 'Production', 'QA'].map(sheet => {
  const subset = records.filter(row => row.sheet === sheet);
  return [sheet, { baseline: subset.length, ...Object.fromEntries(['Conçu', 'Prototype', 'À produire', 'Vérifié'].map(status => [status, subset.filter(row => row.currentStatus === status).length])) }];
}));
const proofPaths = [...new Set(records.flatMap(row => row[receiptKey].evidence))].sort();
const proofs = freeze ? proofPaths.map(name => { const bytes = fs.readFileSync(path.join(root, name)); return { path: name, bytes: bytes.length, sha256: hash(bytes) }; }) : [];
const registry = {
  schemaVersion: previous.schemaVersion,
  version: receipt.version,
  auditStage: freeze ? 'final_receipts' : 'receipts_awaiting_source_freeze',
  baseline: previous.baseline,
  previousRelease: { version: previous.version, path: previousPath, sha256: hash(fs.readFileSync(path.join(root, previousPath))) },
  scope: `All 133 initial pending criteria remain present with their exact original source rows and acceptance text. All receipts through version ${previousRelease} are preserved; only explicit version ${release} work is added. New Bible rows do not inflate this denominator.`,
  statusRule: previous.statusRule,
  counts: { baselineRecords: records.length, bySheet: counts, [`recordsWithV${releaseTag}Work`]: additions.size, [`statusChangesSinceV${previousTag}`]: records.filter(row => row[receiptKey].statusChange).length,
    currentBaselineStatuses: Object.fromEntries(['Conçu', 'Prototype', 'À produire', 'Vérifié'].map(status => [status, records.filter(row => row.currentStatus === status).length])) },
  evidenceCatalog: previous.evidenceCatalog,
  historicalProofs: { ...previous.historicalProofs, [`${previousKey}CurrentProofs`]: previous.currentProofs, ...(previous.deliveries ? { [`${previousKey}Deliveries`]: previous.deliveries } : {}) },
  historicalProofRule: 'Preserved receipts and hashes describe their immutable historical source. A link to a current code file does not claim that its bytes are still the historical bytes. This registry never overwrites those receipts.',
  records,
  currentProofs: proofs,
  sourceFreeze: freeze ? { recordedAt: new Date().toISOString(), bibleSha256: hash(fs.readFileSync(path.join(root, 'data/bible.json'))), receiptSha256: hash(fs.readFileSync(path.join(root, receiptPath))) } : null,
};
fs.writeFileSync(path.join(root, destination), JSON.stringify(registry, null, 2) + '\n');
const esc = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const link = name => `[${name}](${name.startsWith('docs/') ? name.slice(5) : '../' + name})`;
const lines = [
  `# Registre des 133 critères de production — version ${release}`, '',
  `**133 critères initiaux conservés.** La réception ${release} s’ajoute aux travaux reçus jusqu’à la ${previousRelease}. Un prototype reçu ne clôt pas automatiquement un critère d’art final, d’usage natif ou d’essai humain.`, '',
  `Le [registre structuré](validation/production-v${releaseTag}-registry.json) conserve chaque ligne source, critère, audit et réception antérieure. La [baseline 0.8](validation/production-v09-baseline.json) et le [registre ${previousRelease}](PRODUCTION_REGISTER_V${previousTag.slice(1).padStart(2, '0')}.md) restent inchangés. Les nouveaux systèmes et QA ne modifient pas le dénominateur.`, '',
  freeze ? `Les empreintes des preuves ${release} ont été fixées après réception. Elles identifient les fichiers contrôlés, sans certifier une portée supérieure à celle de leur rapport.` : 'Les réceptions sont présentes; leurs empreintes finales attendent le gel de livraison. Aucun contrôle prévu n’est présenté comme une exécution.', '',
  '## État des critères initiaux', '',
  '| Domaine | Critères initiaux | Prototype | Vérifié | À produire |', '| --- | ---: | ---: | ---: | ---: |',
  ...Object.entries(counts).map(([sheet, n]) => `| ${sheet} | ${n.baseline} | ${n.Prototype} | ${n['Vérifié']} | ${n['À produire']} |`), '',
  'Ces valeurs décrivent des statuts de réception, pas un pourcentage du jeu terminé. Le texte initial du critère apparaît ci-dessous. Les preuves antérieures conservent leur date et leur portée.', '',
  `## Réceptions de la ${release}`, '',
  '| ID | Travail reçu | Livrables et preuves | Travail restant |', '| --- | --- | --- | --- |',
];
for (const row of records.filter(row => additions.has(row.id))) lines.push('| ' + [row.id, row[receiptKey].workPerformed.join(' '), [...row[receiptKey].deliverables, ...row[receiptKey].evidence].map(link).join('; '), row[receiptKey].remainingWork].map(esc).join(' | ') + ' |');
lines.push('', '## Critères intégraux', '', `Les 133 critères et leurs textes d’origine restent ci-dessous. La colonne « Réceptions jusqu’à la ${previousRelease} » décrit les travaux historiques; la colonne suivante ne décrit que le travail ajouté dans cette tranche. Chaque reçu antérieur reste intégralement disponible dans le registre structuré.`, '');
for (const sheet of ['Assets', 'Production', 'QA']) {
  lines.push(`### ${sheet}`, '', `| ID et critère initial | Réceptions jusqu’à la ${previousRelease} | Réception ${release} | Statut et reste |`, '| --- | --- | --- | --- |');
  for (const row of records.filter(row => row.sheet === sheet)) {
    const historicalWork = Object.entries(row).filter(([key, value]) => /^v\d+$/.test(key) && key !== receiptKey && Array.isArray(value?.workPerformed)).flatMap(([key, value]) => value.workPerformed.map(work => `${key === 'v09' ? '0.9' : '0.' + key.slice(2)} : ${typeof work === 'string' ? work : work.description}`)).join(' ') || row.audit.workAlreadyObserved;
    const newWork = row[receiptKey].workPerformed.join(' ') || 'Aucune réception nouvelle pour ce critère.';
    const remainder = `**${row.currentStatus}**. ${row[receiptKey].remainingWork}`;
    lines.push('| ' + [`**${row.id} — ${row.deliverable}**. ${row.criterion}`, historicalWork, newWork, remainder].map(esc).join(' | ') + ' |');
  }
  lines.push('');
}
lines.push('## Limites de réception', '',
  'QA19 conserve les deux observations natives 0.9 et la réception partielle 0.10 : des pauses sont visibles dans une instance dupliquée, un autre contexte demeure contradictoire et le tir maintenu n’est pas reçu. Les gestes sont natifs dans les deux contextes; leur différence ne démontre aucune cause liée à l’acquisition du DOM. QA20 garde la petite fenêtre réelle à contrôler malgré ses zooms reçus. QA29 garde son besoin de tri, filtres, volets et édition dans un logiciel bureautique interactif. Les essais humains de Thyr et les critères matériels restent ouverts.', '',
  bible.meta.scope, '');
fs.writeFileSync(path.join(root, `docs/PRODUCTION_REGISTER_V${releaseTag.slice(1).padStart(2, '0')}.md`), lines.join('\n'));
const report = { version: receipt.version, baselineRecords: 133, originalRowsUnchanged: true, originalCriteriaUnchanged: true, v09ReceiptsPreserved: true,
  previousReceiptsPreservedThrough: previous.version, bibleStatusesReconciled: true, counts: registry.counts, currentProofsFrozen: freeze, evidenceFiles: proofPaths.length, registrySha256: hash(fs.readFileSync(path.join(root, destination))) };
fs.writeFileSync(path.join(root, `docs/validation/production-v${releaseTag}-registry-check.json`), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
