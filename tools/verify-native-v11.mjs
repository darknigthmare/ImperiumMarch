#!/usr/bin/env node
/** Read-only audit of MI10 campaign files supplied after native UI actions.
 * No input generation, simulation advancement, browser control or implied reception.
 * Only --report writes a file. Missing exports always leave a pending result.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { execFileSync } from 'node:child_process';

const self = fileURLToPath(import.meta.url), here = path.dirname(self);
const SOURCE_COMMIT = 'ce56e044f311d5e39a1647672940dd0db3674f8b';
const SOURCE_TREE = 'a1c40fc9e0946fe29a417ccd494b415b8653861a';
const SOURCE_HASHES = {
  'src/campaign.mjs': '2631d8c89255e0c8eecb01766644fdd85b4deb46265e6b9ea304fc64183704a2',
  'src/chemical-validation.mjs': 'ed00e720b26e66b310707e589f90146bdd1309c5812a9449856dcd7980abb3ba',
  'src/chemical-simulation.mjs': '778651c4accc7dd78189d5613d2e06896f16f0587651b7272b269d0d7a743f34',
  'src/simulation.mjs': '7e83c1f3d21b8ecf6cfbd4f9458d01ebcaafea1456ba05140f9ddaddf6971aa7',
  'src/content.mjs': '6448818cd6f0d23f226d4f29904fd63c5c9bcaa7d380427bffa1bccbcf87dca4',
  'src/thyr-validation.mjs': 'a365282f81eb792e7184605267552543498413f9087815af7fc0b574d56aba9a',
  'src/departure-validation.mjs': 'ca3c680c78b99fa8762fc4314555f7f24901c4d28253acfd3c782b53307eff5b',
};
const FILES = {
  baseline: { file: 'native-v9-baseline.json', kind: 'historical_native_export', version: 9,
    sha256: 'de5ece01c690b27435878c0f84f7dfd7f86723500a23a3703e3f8ffce28e6898' },
  migrated: { file: 'native-v10-migrated.json', kind: 'supplied_native_export', version: 10 },
  paused: { file: 'native-sampling-paused.json', kind: 'supplied_native_export', version: 10 },
  samplingReloaded: { file: 'native-sampling-reloaded.json', kind: 'supplied_native_export', version: 10 },
  choice: { file: 'native-choice-defy.json', kind: 'supplied_native_export', version: 10 },
  completed: { file: 'native-mi10-completed.json', kind: 'supplied_native_export', version: 10 },
  reloaded: { file: 'native-mi10-reloaded.json', kind: 'supplied_native_export', version: 10 },
  samplingInput: { file: 'docs/previews/mi10-sampling-checkpoint.json', kind: 'prepared_simulation_checkpoint', version: 10,
    sha256: '2addf5888b70fe1f1cfd5a0efda8082e4eca3b6ab625dbdf4dc85038076daea1' },
  decisionInput: { file: 'docs/previews/mi10-decision-checkpoint.json', kind: 'prepared_simulation_checkpoint', version: 10,
    sha256: '096cec3487aedd5a010875cd2325604e0d41bd467b3b5fbdf964710ec5eb5329' },
  extractionInput: { file: 'docs/previews/mi10-before-extraction-checkpoint.json', kind: 'prepared_simulation_checkpoint', version: 10,
    sha256: 'cfb5b4235138de03077fa671a60643f9c846b93d08bb44e30e49fcfa585cdb0d' },
};
const REQUIRED = {
  migration: ['baseline', 'migrated'],
  sampling: ['baseline', 'samplingInput', 'paused', 'samplingReloaded'],
  choice: ['baseline', 'decisionInput', 'choice'],
  completion: ['baseline', 'extractionInput', 'completed'],
  reload: ['baseline', 'completed', 'reloaded'],
};
const OLD_IDS = Array.from({ length: 9 }, (_, i) => `MI${String(i + 1).padStart(2, '0')}`);
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const clone = value => structuredClone(value);
const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value?.[key]]));
const same = (a, b) => isDeepStrictEqual(a, b);
const help = `Usage: node verify-native-v11.mjs [--mode migration|sampling|choice|completion|reload|all]
  [--repo /absolute/ImperiumMarch] [--evidence-dir /absolute/native-v11]
  [--report /absolute/output.json]

Default mode: all. Default inputs: <repo>/docs/validation/native-v11.
The three prepared checkpoints stay under <repo>/docs/previews.
No files are written without --report; input paths cannot be overwritten.
Exit 0 = every requested phase passed; 1 = failed; 2 = missing input(s).
Native gestures, screenshots, focus and pause UI are separate observations.
This verifier neither performs nor certifies them, and never plays the mission.
For exact reload comparisons, export from the bridge without resuming gameplay.
`;

function argumentsOf(args) {
  const out = { mode: 'all' };
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (key === '--help' || key === '-h') { process.stdout.write(help); process.exit(0); }
    if (!['--mode', '--repo', '--evidence-dir', '--report'].includes(key) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Invalid argument: ${key}`);
    out[key.slice(2)] = args[++i];
  }
  if (out.mode !== 'all' && !Object.hasOwn(REQUIRED, out.mode)) throw new Error(`Unknown mode: ${out.mode}`);
  return out;
}

function findRepo() {
  let dir = here;
  while (true) {
    for (const candidate of [dir, path.join(dir, 'ImperiumMarch')]) if (fs.existsSync(path.join(candidate, 'src/campaign.mjs'))) return candidate;
    const parent = path.dirname(dir); if (parent === dir) break; dir = parent;
  }
  throw new Error('Cannot locate the repository; supply --repo.');
}

function differences(expected, actual, root = '$', limit = 16) {
  const out = [];
  const visit = (a, b, at) => {
    if (same(a, b) || out.length >= limit) return;
    if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (out.length >= limit) break;
        if (!Object.hasOwn(a, key) || !Object.hasOwn(b, key)) out.push({ path: `${at}.${key}`, difference: Object.hasOwn(a, key) ? 'removed' : 'added' });
        else visit(a[key], b[key], `${at}.${key}`);
      }
    } else out.push({ path: at, expected: a === undefined ? '<absent>' : a, actual: b === undefined ? '<absent>' : b });
  };
  visit(expected, actual, root); return out;
}

async function main() {
  const options = argumentsOf(process.argv.slice(2));
  const repo = path.resolve(options.repo || findRepo());
  const directory = path.resolve(options['evidence-dir'] || path.join(repo, 'docs/validation/native-v11'));
  const phases = options.mode === 'all' ? Object.keys(REQUIRED) : [options.mode];
  const needed = [...new Set(phases.flatMap(phase => REQUIRED[phase]))];
  const inputPath = id => path.resolve(FILES[id].kind === 'prepared_simulation_checkpoint' ? repo : directory, FILES[id].file);
  if (options.report) {
    const destination = path.resolve(options.report);
    if (destination === self || Object.keys(FILES).some(id => inputPath(id) === destination) || Object.keys(SOURCE_HASHES).some(file => path.resolve(repo, file) === destination)) throw new Error('A report must not overwrite the verifier, a source module or any input.');
  }
  const report = {
    schema: 'imperium.native-export-verification.v11.1', productVersion: '0.11.0',
    checkedAtUtc: new Date().toISOString(), mode: options.mode,
    method: 'Read-only Node comparison plus the pinned campaign parser and chemical validators. No simulation update, gameplay command, browser interaction or input repair.',
    scope: 'Exact v9-to-v10 migration, persistence of an unfinished sample, decision without tank operations, completion from a prepared extraction checkpoint, and unchanged final reload/export.',
    limits: [
      'Filenames and JSON alone do not establish browser provenance; download records and native observations remain separate evidence.',
      'The sampling, decision and extraction inputs were prepared by the deterministic simulation. Their earlier operations are not a native playthrough.',
      'Pause controls, focus, visuals, accessibility, audio, viewport size and hardware gamepad behavior are not certified by this comparison.',
      'No full MI10 mission played natively and no QA status is inferred by this verifier.',
      'Exact comparisons do not ignore revision, elapsed time, physical damage, inventory or historical receipts.',
    ],
    browserOperatedByVerifier: false, simulationAdvancedByVerifier: false, inputsModified: false,
    verifier: { file: path.basename(self), sha256: sha(fs.readFileSync(self)) },
    sourceSnapshot: { expectedCommit: SOURCE_COMMIT, expectedTree: SOURCE_TREE, modules: {} },
    repository: repo, evidenceDirectory: directory, inputs: {}, phases: {}, checks: [],
  };
  const loaded = new Map();
  const check = (id, ok, details = {}) => report.checks.push({ id, status: ok ? 'passed' : 'failed', ...details });
  const equal = (id, expected, actual) => check(id, same(expected, actual), same(expected, actual) ? {} : { differences: differences(expected, actual), differenceLimit: 16 });
  const run = (id, callback) => { try { callback(); check(id, true); } catch (error) { check(id, false, { error: error.message }); } };
  const pending = (id, reason) => report.checks.push({ id, status: 'pending', reason });
  const requireInputs = (phase, ids, callback) => {
    const absent = ids.filter(id => !loaded.has(id));
    if (absent.length) { pending(`${phase}.comparison`, `Unavailable or invalid inputs: ${absent.join(', ')}`); return; }
    try { callback(...ids.map(id => loaded.get(id).raw)); } catch (error) { check(`${phase}.comparison_exception`, false, { error: error.message }); }
  };
  try {
    const [commit, tree] = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD', 'HEAD^{tree}'], { encoding: 'utf8' }).trim().split('\n');
    report.sourceSnapshot.observedCommit = commit; report.sourceSnapshot.observedTree = tree;
  } catch (error) { report.sourceSnapshot.gitMetadataUnavailable = error.message; }
  let sourceValid = true;
  for (const [file, expected] of Object.entries(SOURCE_HASHES)) {
    const full = path.join(repo, file), actual = fs.existsSync(full) ? sha(fs.readFileSync(full)) : null;
    report.sourceSnapshot.modules[file] = { expectedSha256: expected, sha256: actual };
    equal(`source.${file}`, expected, actual); sourceValid &&= actual === expected;
  }
  let parseCampaign, serializeCampaign, createChemicalDossier, chemicalDossierFromGame, validateChemicalSortie;
  if (sourceValid) {
    ({ parseCampaign, serializeCampaign } = await import(pathToFileURL(path.join(repo, 'src/campaign.mjs')).href));
    ({ createChemicalDossier, chemicalDossierFromGame, validateChemicalSortie } = await import(pathToFileURL(path.join(repo, 'src/chemical-validation.mjs')).href));
  }
  for (const id of needed) {
    const definition = FILES[id], full = inputPath(id);
    const item = report.inputs[id] = { file: path.relative(repo, full), kind: definition.kind, status: 'pending' };
    if (!fs.existsSync(full)) { pending(`input.${id}`, 'File absent; no result or provenance inferred.'); continue; }
    try {
      const bytes = fs.readFileSync(full), text = bytes.toString('utf8');
      Object.assign(item, { bytes: bytes.length, sha256: sha(bytes), status: 'read' });
      const raw = JSON.parse(text);
      if (definition.sha256) equal(`input.${id}.pinned_bytes`, definition.sha256, item.sha256);
      equal(`input.${id}.version`, definition.version, raw.version);
      if (!sourceValid) { pending(`input.${id}.strict_parse`, 'Pinned source modules do not match; parsing with different code is not accepted.'); continue; }
      const parsed = parseCampaign(text);
      check(`input.${id}.strict_parse`, true);
      if (definition.version === 10) equal(`input.${id}.parser_no_changes`, raw, parsed);
      equal(`input.${id}.strict_round_trip`, parsed, parseCampaign(serializeCampaign(parsed)));
      Object.assign(item, { status: 'parsed', observed: {
        version: raw.version, revision: raw.revision, stage: raw.stage, activeMissionId: raw.activeMissionId,
        completedMissions: Object.keys(raw.completed), resources: raw.resources,
        ...(raw.checkpoint ? { mission: raw.checkpoint.missionId, elapsed: raw.checkpoint.elapsed, sample: pick(raw.checkpoint.chemical?.sampler, ['started', 'working', 'progress', 'collected', 'lost']), choice: raw.checkpoint.decision.choice } : {}),
      } });
      loaded.set(id, { raw, parsed, text, full, hash: item.sha256 });
    } catch (error) { item.status = 'invalid'; item.error = error.message; check(`input.${id}.read_or_parse`, false, { error: error.message }); }
  }
  if (loaded.has('baseline')) {
    const baseline = loaded.get('baseline').raw;
    equal('baseline.nine_reports', OLD_IDS, Object.keys(baseline.completed));
    equal('baseline.resources', { parts: 42, fuel: 0 }, baseline.resources);
    check('baseline.no_chemical_dossier', !Object.hasOwn(baseline.world.thyr, 'chemical'));
  }
  const historical = (prefix, value, parts) => {
    const baseline = loaded.get('baseline').raw;
    for (const id of OLD_IDS) equal(`${prefix}.preserved_${id}`, baseline.completed[id], value.completed[id]);
    for (const planet of ['vesper', 'nacre']) equal(`${prefix}.world_${planet}`, baseline.world[planet], value.world[planet]);
    equal(`${prefix}.mi09_route`, baseline.world.thyr.route, value.world.thyr.route);
    equal(`${prefix}.resources`, { parts, fuel: baseline.resources.fuel }, value.resources);
    equal(`${prefix}.fuel_ledger`, baseline.world.nacre.fuelSpent, value.world.nacre.fuelSpent);
    equal(`${prefix}.maintenance_history`, baseline.maintenanceLog, value.maintenanceLog);
  };
  const active = (prefix, prepared, value) => {
    historical(prefix, value, 42);
    equal(`${prefix}.stage`, 'mission', value.stage);
    equal(`${prefix}.active_mission`, 'MI10', value.activeMissionId);
    equal(`${prefix}.nine_reports`, OLD_IDS, Object.keys(value.completed));
    equal(`${prefix}.checkpoint_playing`, 'playing', value.checkpoint.status);
    equal(`${prefix}.campaign_outside_checkpoint`,
      pick(prepared, ['format', 'version', 'stage', 'activeMissionId', 'completed', 'resources', 'crew', 'authority', 'world', 'fleet', 'lastDebrief', 'maintenanceLog']),
      pick(value, ['format', 'version', 'stage', 'activeMissionId', 'completed', 'resources', 'crew', 'authority', 'world', 'fleet', 'lastDebrief', 'maintenanceLog']));
    run(`${prefix}.valid_continuation_from_prepared`, () => validateChemicalSortie(prepared.checkpoint, value.checkpoint));
    check(`${prefix}.revision_not_rewound`, value.revision >= prepared.revision, { prepared: prepared.revision, observed: value.revision });
  };

  if (phases.includes('migration')) requireInputs('migration', ['baseline', 'migrated'], (before, after) => {
    equal('migration.equals_strict_parse_v9', loaded.get('baseline').parsed, after);
    const reduced = clone(after); reduced.version = before.version; delete reduced.world.thyr.chemical;
    equal('migration.only_version_and_chemical_added', before, reduced);
    equal('migration.empty_chemical', createChemicalDossier(), after.world.thyr.chemical);
    equal('migration.stage_preserved', before.stage, after.stage);
    equal('migration.revision_preserved', before.revision, after.revision);
    equal('migration.checkpoint_preserved', before.checkpoint, after.checkpoint);
    equal('migration.predecision_preserved', before.preDecisionCheckpoint, after.preDecisionCheckpoint);
    historical('migration', after, 42);
  });

  if (phases.includes('sampling')) {
    requireInputs('sampling.pause', ['samplingInput', 'paused', 'baseline'], (prepared, paused) => {
      active('sampling.pause', prepared, paused);
      const before = prepared.checkpoint, now = paused.checkpoint, sample = now.chemical.sampler;
      equal('sampling.pause.decision_unselected', { active: false, resolved: false, choice: null }, pick(now.decision, ['active', 'resolved', 'choice']));
      check('sampling.pause.sample_unfinished', sample.started && sample.working && !sample.collected && !sample.lost && sample.progress > 0 && sample.progress < 1, { observed: pick(sample, ['started', 'working', 'progress', 'collected', 'lost']) });
      equal('sampling.pause.sample_start_preserved', pick(before.chemical.sampler, ['firstStartedAt', 'startedAt']), pick(sample, ['firstStartedAt', 'startedAt']));
      check('sampling.pause.progress_not_rewound', sample.progress >= before.chemical.sampler.progress);
      equal('sampling.pause.pt02_not_yet_acquired', false, now.campaign.pt02Acquired);
      equal('sampling.pause.no_collected_volume', 0, sample.volumeCollected);
      equal('sampling.pause.tanks_unchanged', before.chemical.tanks, now.chemical.tanks);
      equal('sampling.pause.predecision_preserved', prepared.preDecisionCheckpoint, paused.preDecisionCheckpoint);
      report.samplingObservation = {
        preparedElapsed: before.elapsed, pausedElapsed: now.elapsed, observedAdvanceSincePreparedSeconds: now.elapsed - before.elapsed,
        preparedProgress: before.chemical.sampler.progress, pausedProgress: sample.progress,
        origin: 'Prepared deterministic state followed by supplied native continuation; no full native sampling run inferred.',
      };
    });
    requireInputs('sampling.reload', ['paused', 'samplingReloaded', 'baseline'], (paused, reloaded) => {
      equal('sampling.reload.entire_campaign_exact', paused, reloaded);
      equal('sampling.reload.checkpoint_exact', paused.checkpoint, reloaded.checkpoint);
      equal('sampling.reload.chemical_exact', paused.checkpoint.chemical, reloaded.checkpoint.chemical);
      equal('sampling.reload.elapsed_exact', paused.checkpoint.elapsed, reloaded.checkpoint.elapsed);
      equal('sampling.reload.sample_progress_exact', paused.checkpoint.chemical.sampler.progress, reloaded.checkpoint.chemical.sampler.progress);
      historical('sampling.reload', reloaded, 42);
      report.samplingReloadBytesIdentical = loaded.get('paused').hash === loaded.get('samplingReloaded').hash;
    });
  }

  if (phases.includes('choice')) requireInputs('choice', ['decisionInput', 'choice', 'baseline'], (prepared, chosen) => {
    active('choice', prepared, chosen);
    const before = prepared.checkpoint, now = chosen.checkpoint;
    equal('choice.prepared_decision_open', { active: true, resolved: false, choice: null }, pick(before.decision, ['active', 'resolved', 'choice']));
    equal('choice.defy_selected', { active: false, resolved: true, choice: 'defy' }, pick(now.decision, ['active', 'resolved', 'choice']));
    equal('choice.secure_plan', 'secure', now.campaign.plan);
    equal('choice.no_physical_operation_invented', before.chemical, now.chemical);
    equal('choice.three_tanks_not_yet_secured', 0, now.campaign.tanksSecured);
    equal('choice.no_tank_demolition', 0, now.campaign.tanksDestroyed);
    equal('choice.operations_not_resolved', false, now.campaign.operationsResolved);
    equal('choice.no_water_work', false, now.campaign.waterDispositionRecorded);
    equal('choice.no_report_transmission', false, now.campaign.reportTransmitted);
    equal('choice.acquired_sample_and_pt02_preserved', { sampleCollected: true, copiedMarks: 3, orisonRecordCopied: true, pt02Acquired: true }, pick(now.campaign, ['sampleCollected', 'copiedMarks', 'orisonRecordCopied', 'pt02Acquired']));
    equal('choice.choice_counts', { ordersDefied: 1, ordersObeyed: 0 }, pick(now.stats, ['ordersDefied', 'ordersObeyed']));
    equal('choice.predecision_checkpoint_exact', prepared.preDecisionCheckpoint, chosen.preDecisionCheckpoint);
    report.choiceObservation = { preparedElapsed: before.elapsed, exportedElapsed: now.elapsed, noPhysicalOperationFromChoice: same(before.chemical, now.chemical), provenance: 'The sample and its material provenance were acquired in the prepared input; this native export tests the administrative choice only.' };
  });

  if (phases.includes('completion')) requireInputs('completion', ['extractionInput', 'completed', 'baseline'], (prepared, finished) => {
    const before = prepared.checkpoint, receipt = finished.completed.MI10;
    historical('completion', finished, 46);
    equal('completion.ten_reports', [...OLD_IDS, 'MI10'], Object.keys(finished.completed));
    equal('completion.stage', 'complete', finished.stage);
    equal('completion.no_active_mission', null, finished.activeMissionId);
    equal('completion.no_live_checkpoint', null, finished.checkpoint);
    equal('completion.predecision_preserved', prepared.preDecisionCheckpoint, finished.preDecisionCheckpoint);
    equal('completion.last_debrief_matches_receipt', receipt, finished.lastDebrief);
    check('completion.mi10_receipt_present', !!receipt);
    if (!receipt) return;
    const expected = { missionId: 'MI10', walkerId: before.walkerId, choice: 'defy', plan: 'secure', partsGranted: 4,
      tanksTotal: 3, tanksInspected: 3, copiedMarks: 3, tanksSecured: 3, tanksDestroyed: 0,
      sampleCollected: true, sampleLost: false, orisonRecordCopied: true, pt02Acquired: true,
      leakContained: true, leakStopped: true, flowResolved: true, spillInTransit: 0,
      canalsIntact: 2, canalsCovered: 2, canalsPolluted: 0, homesHabitable: 2, villageHabitable: true,
      waterDispositionRecorded: true, waterRestored: true, privateNeutralized: 3,
      operationsResolved: true, reportTransmitted: true, collateral: 0, kills: 3 };
    for (const [key, wanted] of Object.entries(expected)) equal(`completion.mi10.${key}`, wanted, receipt[key]);
    equal('completion.exact_prepared_material_dossier', chemicalDossierFromGame(before), finished.world.thyr.chemical);
    const dossierKeys = Object.keys(createChemicalDossier());
    equal('completion.world_matches_receipt', pick(receipt, dossierKeys), finished.world.thyr.chemical);
    equal('completion.roster_preserved_from_prepared_extraction', chemicalDossierFromGame(before).roster, receipt.roster);
    check('completion.elapsed_advanced_after_prepared', receipt.elapsed > before.elapsed, { prepared: before.elapsed, completed: receipt.elapsed });
    check('completion.live_hull_recorded', receipt.hull > 0 && receipt.hull <= before.player.hull);
    equal('completion.sample_five_units', 5, receipt.roster.sampler.volumeCollected);
    check('completion.sample_duration_twenty_seconds', Math.abs(receipt.roster.sampler.collectedAt - receipt.roster.sampler.startedAt - 20) <= .051);
    const mass = receipt.roster.tanks.reduce((total, tank) => total + tank.volume, 0) + receipt.roster.sampler.volumeCollected + receipt.roster.spill.pendingMass + receipt.roster.plumes.reduce((total, plume) => total + plume.mass, 0);
    check('completion.mass_conserved', Math.abs(mass - 300) <= 1e-6, { initial: 300, observed: mass });
    equal('completion.parts_awarded_once', 4, finished.resources.parts - prepared.resources.parts);
    equal('completion.fuel_not_spent', prepared.resources.fuel, finished.resources.fuel);
    report.completionObservation = { preparedElapsed: before.elapsed, preparedPlayerX: before.player.x, extractionX: before.extraction.x, extractionRadius: before.extraction.radius, receiptElapsed: receipt.elapsed, elapsedAfterPreparedSeconds: receipt.elapsed - before.elapsed, provenance: 'Native extraction after importing a prepared simulation checkpoint. The receipt does not retain final player coordinates; the native observation is the independent evidence for the movement and victory UI.' };
  });

  if (phases.includes('reload')) requireInputs('reload', ['completed', 'reloaded', 'baseline'], (finished, reloaded) => {
    equal('reload.entire_campaign_exact', finished, reloaded);
    equal('reload.mi10_receipt_exact', finished.completed.MI10, reloaded.completed.MI10);
    equal('reload.ten_reports', [...OLD_IDS, 'MI10'], Object.keys(reloaded.completed));
    equal('reload.revision_exact', finished.revision, reloaded.revision);
    equal('reload.no_double_reward', finished.resources, reloaded.resources);
    equal('reload.resources_46', { parts: 46, fuel: 0 }, reloaded.resources);
    equal('reload.world_exact', finished.world, reloaded.world);
    equal('reload.fleet_exact', finished.fleet, reloaded.fleet);
    equal('reload.crew_exact', finished.crew, reloaded.crew);
    equal('reload.authority_exact', finished.authority, reloaded.authority);
    historical('reload', reloaded, 46);
    report.finalReloadBytesIdentical = loaded.get('completed').hash === loaded.get('reloaded').hash;
  });

  for (const [id, input] of loaded) equal(`integrity.input.${id}`, input.hash, sha(fs.readFileSync(input.full)));
  for (const [file, expected] of Object.entries(SOURCE_HASHES)) if (fs.existsSync(path.join(repo, file))) equal(`integrity.source.${file}`, expected, sha(fs.readFileSync(path.join(repo, file))));
  for (const phase of phases) {
    const checks = report.checks.filter(item => item.id.startsWith(`${phase}.`) || item.id.startsWith('source.') || REQUIRED[phase].some(id => item.id.startsWith(`input.${id}.`) || item.id === `input.${id}`));
    const missing = REQUIRED[phase].filter(id => !loaded.has(id));
    report.phases[phase] = { status: checks.some(item => item.status === 'failed') ? 'failed' : missing.length || checks.some(item => item.status === 'pending') ? 'pending' : 'passed', requiredInputs: REQUIRED[phase], unavailableInputs: missing };
  }
  report.counts = Object.fromEntries(['passed', 'failed', 'pending'].map(status => [status, report.checks.filter(item => item.status === status).length]));
  report.status = report.counts.failed ? 'failed' : report.counts.pending || Object.values(report.phases).some(phase => phase.status === 'pending') ? 'pending' : 'passed';
  const output = JSON.stringify(report, null, 2) + '\n';
  if (options.report) {
    const destination = path.resolve(options.report); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, output);
    process.stdout.write(JSON.stringify({ status: report.status, counts: report.counts, phases: report.phases, report: destination, sha256: sha(output) }, null, 2) + '\n');
  } else process.stdout.write(output);
  process.exitCode = report.status === 'passed' ? 0 : report.status === 'pending' ? 2 : 1;
}

main().catch(error => { process.stderr.write(`Verification error: ${error.message}\n`); process.exitCode = 1; });
