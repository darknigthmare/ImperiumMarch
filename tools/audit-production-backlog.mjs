/** Reproducible Node evidence for eight v0.9 production backlog criteria. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const relativeTest = 'tests/production-backlog.test.mjs';
const ids = ['QA05', 'QA08', 'QA11', 'QA12', 'QA13', 'QA14', 'QA24', 'QA28'];
const sourcePaths = [relativeTest, 'tools/audit-production-backlog.mjs', 'src/simulation.mjs', 'src/content.mjs', 'src/campaign.mjs', 'src/main.mjs'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const snapshots = () => Object.fromEntries(sourcePaths.map(path => [path, hash(readFileSync(resolve(root, path)))]));
const before = snapshots();
const child = spawnSync(process.execPath, ['--test', '--test-reporter=tap', relativeTest], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
if (child.error) throw child.error;
const output = child.stdout + child.stderr;
if (child.status !== 0) {
  process.stderr.write(output);
  throw new Error(`Backlog tests failed with exit ${child.status}; no passing audit was written.`);
}
if (JSON.stringify(before) !== JSON.stringify(snapshots())) throw new Error('A tested source changed during the audit. Rerun on the frozen sources.');
const count = key => Number(output.match(new RegExp(`^# ${key} (\\d+)$`, 'm'))?.[1] ?? NaN);
const run = { tests: count('tests'), passed: count('pass'), failed: count('fail'), skipped: count('skipped'), todo: count('todo') };
const tests = [...output.matchAll(/^ok \d+ - (.+)$/gm)].map(match => match[1]);
const evidence = [...output.matchAll(/^\s*# QA_EVIDENCE (.+)$/gm)].map(match => JSON.parse(match[1]));
if (run.tests !== 16 || run.passed !== run.tests || run.failed || run.skipped || run.todo || evidence.length !== 16 || tests.length !== 16) {
  throw new Error(`Incomplete audit run: ${JSON.stringify({ run, tests: tests.length, evidence: evidence.length })}`);
}

const bibleBytes = readFileSync(resolve(root, 'data/bible.json'));
const rows = new Map();
function visit(value) {
  if (Array.isArray(value)) { value.forEach(visit); return; }
  if (!value || typeof value !== 'object') return;
  if (ids.includes(value.id)) rows.set(value.id, value);
  Object.values(value).forEach(visit);
}
visit(JSON.parse(bibleBytes));
for (const id of ids) if (!rows.has(id)) throw new Error(`Missing original acceptance criterion ${id}`);

const coverage = {
  QA05: {
    level: 'partial',
    existing: [{ file: 'tests/ammunition.test.mjs', scope: 'Five tests already cover all starting stocks, partial and final reloads, complete exhaustion and one-time supplies.' }],
    added: 'Six authentic MI01 starts, three real shots, mid-reload checkpoint serialization/restoration and 36 refused in-flight chassis selections preserve finite ammunition.',
    remaining: ['The navigation handlers for pause → menu → different chassis/operation selection → resume are not invoked by this audit. A DOM flow can supply that final UI link.'],
  },
  QA08: {
    level: 'automated-criterion-demonstrated',
    existing: [{ file: 'tests/simulation.test.mjs', scope: 'Existing gait tests validate alternating groups and fixed planted feet, without the requested contact-versus-nearby damage contrast.' }],
    added: 'One isolated enemy geometry proves airborne/no damage, landing damage, close miss and no repeated damage from idling. Two public backwards-step journeys prove damage on the actual transport landing.',
    remaining: [],
  },
  QA11: {
    level: 'automated-criterion-demonstrated',
    existing: [{ file: 'tests/simulation.test.mjs', scope: 'Remote rejection and successful scanning existed; those older tests remove threats directly and do not exercise interrupted scanning.' }],
    added: 'A complete public approach starts the scan, leaves its 250-unit retention radius, resets progress, returns, completes it and retries five times without awarding another copy. Cadence tests also exercise the same authentic approach.',
    remaining: ['Visual legibility of the progress indicator is not a human usability result; numerical progress is verified.'],
  },
  QA12: {
    level: 'automated-criterion-demonstrated',
    existing: [{ file: 'tests/simulation.test.mjs', scope: 'An eighteen-operation/chassis public matrix already proves ordinary completions. The older gate test directly marks relays destroyed and does not prove alternate real orders.' }],
    added: 'Three public destruction orders (0→1→2, 2→1→0, 1→0→2), exact counters after every update, no early activation, active-but-unreached extraction and victory only inside the extraction radius.',
    remaining: ['Three orders are covered; this is not a claim that all six permutations were run.'],
  },
  QA13: {
    level: 'partial',
    existing: [{ file: 'tests/simulation.test.mjs', scope: 'Public successful escorts existed. The older failure test assigns convoy.hp=0 directly.' }],
    added: 'An actually protected OP02 escort wins with an arrived transport. A second public journey parks without firing and enemies destroy the transport while the walker survives. The actual isolated main report writes the successful record and no successful record for the loss.',
    remaining: [
      'OP02 describes 47 families but has no individual occupant or family roster. convoy.cargo=0 is not a census. No survivor count or death count for those families is proved or invented.',
      'The tested collateral count describes the independently modelled civilians; it does not establish the protected transport occupants’ fate.',
    ],
  },
  QA14: {
    level: 'partial',
    existing: [{ file: 'tests/simulation.test.mjs', scope: 'Choice hostility/objective contrast existed with edited enemy state; the public operation matrix only chose defy.' }],
    added: 'Both complete OP03 journeys now select and lock a choice publicly. Defy defeats Cerbère; obey leaves the boss alive and permits withdrawal. The unmodified main.showResult function is executed in an isolated VM to check distinct report text and actual operation record serialization.',
    remaining: [
      'The literal scenario says defeat the boss then test each choice. The authored operation instead asks the choice first; obey permits withdrawal without killing Cerbère. Acceptance wording needs that distinction.',
      'This audit stubs persist() and report DOM elements. It does not exercise the full decision dialog → result → localStorage → fresh application → operation archive chain. A DOM runtime flow can cover it without claiming a hardware/browser trial.',
    ],
  },
  QA24: {
    level: 'automated-criterion-demonstrated-with-bounded-tolerance',
    existing: [{ file: 'tests/simulation.test.mjs', scope: 'Identical-seed/identical-delta determinism and invalid-delta clamping existed, without a comparison across cadences.' }],
    added: 'A time-based ten-second public combat sequence and one authentic OP01 scan run at 30, 60 and 120 simulation updates per second, mirroring the application’s variable-delta update contract.',
    tolerance: {
      elapsedSeconds: 1e-9,
      combat: 'Exact equality of shots, hits, kills, step-group count, ammunition, reserve, hull and final heat for the tested sequence.',
      positionWorldUnits: 10,
      scanProgressFraction: 1e-10,
      scanCompletionSeconds: 'At most one update quantum beyond the 2.4-second scan duration (maximum 1/30 s).',
    },
    remaining: ['This is Node simulation at emulated frame intervals. It is not a browser frame-pacing, GPU performance, background-tab or sub-20-Hz test, nor a bit-identical claim for arbitrary variable-delta combat.'],
  },
  QA28: {
    level: 'automated-prototype-collision-criterion-demonstrated',
    existing: [{ file: 'tests/simulation.test.mjs', scope: 'Civilian bullet accounting existed, but the legacy convoy ignored player fire, splash and foot impacts.' }],
    added: 'MI01 and OP02 now use the same swept transport target for both teams, finite-radius splash excluding a directly-hit transport, and real landing contacts. Public direct shots, deliberate backwards steps and all-six-chassis safe following accompany geometric edge/radius fixtures. Friendly damage emits an explicit consequence warning.',
    remaining: ['The unmodelled OP02 family census remains the separate QA13 limitation; this collision proof does not invent occupant casualties.'],
  },
};
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
const report = {
  schema: 'ordre-de-cendre.production-backlog-audit.v1',
  generatedAt: new Date().toISOString(),
  productVersion: JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version,
  sourceHead: head.status === 0 ? head.stdout.trim() : null,
  sourceHashes: before,
  bibleSnapshotSha256: hash(bibleBytes),
  command: `node --test --test-reporter=tap ${relativeTest}`,
  environment: { node: process.version, platform: process.platform, arch: process.arch, dependencies: 'Node built-ins only' },
  run: { ...run, exitCode: child.status, tapSha256: hash(child.stdout), testNames: tests },
  claimBoundary: {
    publicJourneyRule: 'createGame/beginCampaignMission, commandGame and updateGame only; no field writes in public pilots. Deep copies preserve authentic states between probes.',
    geometricUnits: 'Explicitly named geometric-unit diagnostics isolate target/projectile geometry. They are not presented as public journeys.',
    reportUnits: 'Actual showResult source is executed with stub DOM/audio/persist adapters. No browser or full UI traversal is claimed.',
    humanValidation: false,
    fullNodeSuiteExecutedByThisTool: false,
    historicalFixturesRegenerated: false,
  },
  authorizedRuntimeCorrection: {
    file: 'src/simulation.mjs',
    affected: ['hitConvoy', 'stomp', 'explosion', 'updateProjectiles', 'updateWorld legacy convoy following'],
    isolatedFrom: ['MI08 departure logic', 'campaign schema', 'content'],
    behavior: [
      'Both projectile teams collide with the same transport volume; enemy damage still uses the selected difficulty multiplier.',
      'Splash has finite range and never doubles the transport’s direct rocket damage.',
      'Only a landed foot overlapping the actual horizontal footprint and ground-height band damages the transport.',
      'The driver waits behind announced landing footprints; no rewind, health restoration or damage immunity was added.',
      'The first player-caused hit emits a message explaining that losing the protected transport fails the escort.',
    ],
    preFixObservation: {
      provenance: 'Observed during this work before the patch, not rerun by this tool.',
      seed: 20261111, walkerId: 'WK01', difficulty: 'story',
      steps: 'For each MI01/op02 and bullet/rocket: brace, aim at the real convoy, fire once at frame 0, update 90 frames at 1/60 s.',
      resultBefore: 'All four cases fired one shot and left convoy.hp at 640.',
      resultAfter: 'Current assertions verify 22 direct bullet damage or 165 direct rocket damage, exactly once.',
    },
  },
  criteria: ids.map(id => ({ ...rows.get(id), audit: coverage[id], evidence: evidence.filter(item => item.qa.includes(id)) })),
};
const destination = resolve(root, 'docs/validation/v09-backlog-audit.json');
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Backlog audit: ${run.passed}/${run.tests} passed; ${ids.length} criteria mapped; no skipped tests or human claims.`);
console.log('Written docs/validation/v09-backlog-audit.json');
