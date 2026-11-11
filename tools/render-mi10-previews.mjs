/** MI10 public-control runs rendered on Canvas. Not native browser evidence. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { chemicalSurfaceAt } from '../src/simulation.mjs';
import { WALKERS } from '../src/content.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI10 } from '../tests/helpers/mi10-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
const font = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
if (existsSync(font)) GlobalFonts.registerFromPath(font, 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/previews'); mkdirSync(output, { recursive: true });
const fixturePath = 'tests/fixtures/campaign-v9-mi09.json', fixture = JSON.parse(readFileSync(resolve(root, fixturePath), 'utf8'));
const create = (walkerId = 'WK09') => {
  const started = beginCampaignMission(parseCampaign(JSON.stringify(fixture.completed)), { missionId: 'MI10', walkerId, difficulty: 'normal', seed: 1907 });
  assert.equal(started.ok, true); return started;
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['src/content.mjs', 'src/simulation.mjs', 'src/chemical-simulation.mjs', 'src/renderer.mjs', 'src/chemical-renderer.mjs', 'src/chemical-assets.mjs', 'src/campaign.mjs', 'src/chemical-validation.mjs', 'tests/helpers/mi10-driver.mjs', 'tools/render-mi10-previews.mjs', fixturePath];
const manifest = { version: '0.11.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)', width: 1600, height: 900,
  limitations: 'No browser, HTML HUD, CSS, native focus, human playtest, hardware controller, audio listening or performance certification.',
  provenance: 'All scenes start from the authentic native v9 MI09 completed dossier. Campaign APIs migrate and begin MI10. Only public simulation commands and inputs drive movement, aiming, shooting, anchoring, interaction and choice. No direct position, health, time, tank, spill or outcome setter is used. Full states are deeply copied on capture, checked after continuation, and unchanged by the renderer.',
  historicalFixture: fixturePath, fixtureProvenance: structuredClone(fixture.provenance),
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])), files: [], checkpoints: [], runs: [] };
const frozen = [];
function capture(run, file, title, name = 'reference') {
  const s = run.game; assert.equal(s.status, 'playing', file);
  const before = JSON.stringify(s), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false }); assert.equal(JSON.stringify(s), before, 'Renderer mutated the authoritative state');
  const png = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), png);
  const scene = structuredClone({ file, title, run: name, width: 1600, height: 900, sha256: sha(png), missionId: s.missionId, walkerId: s.walkerId, elapsed: s.elapsed, playerX: s.player.x, state: s });
  manifest.files.push(scene); frozen.push(JSON.stringify(scene));
  run.campaign = checkpointCampaign(run.campaign, s);
}
function checkpoint(run, file, purpose) {
  run.campaign = checkpointCampaign(run.campaign, run.game, { beforeDecision: run.game.decision.active });
  const data = serializeCampaign(run.campaign); assert.deepEqual(parseCampaign(data), run.campaign);
  writeFileSync(resolve(output, file), data + '\n');
  manifest.checkpoints.push({ file, purpose, provenance: 'Prepared through public simulation controls for a separately recorded native browser examination, not evidence that examination has occurred.', sha256: sha(data + '\n'), elapsed: run.game.elapsed, playerX: run.game.player.x, decisionActive: run.game.decision.active, facts: structuredClone(run.game.campaign) });
}
function finish(run, options = {}, name = 'reference') {
  pilotMI10(run.game, options); assert.equal(run.game.status, 'won', `${name} must complete after its captures`);
  const end = finishCampaignMission(run.campaign, run.game); assert.equal(end.applied, true);
  assert.deepEqual(parseCampaign(serializeCampaign(end.campaign)), end.campaign);
  manifest.runs.push(structuredClone({ run: name, walkerId: run.game.walkerId, options, elapsed: run.game.elapsed, status: run.game.status, facts: run.game.campaign, firstReceipt: end.receipt }));
  return end;
}
function stage(run, name, title, stopAt, options = {}, runName = 'reference') {
  pilotMI10(run.game, { ...options, stopAt }); assert.ok(stopAt(run.game), `Unreached scene: ${name}`); capture(run, `mi10-${name}.png`, title, runName);
}

const reference = create();
capture(reference, 'mi10-arrival.png', 'Début de mission : nouveau champ, cuves inconnues et fuite active');
const referenceStages = [
  ['collector-work', 'Fermeture réellement en cours au collecteur amont, sous ancrage', s => s.chemical.collector.working && s.chemical.collector.progress > .55],
  ['tank-identification', 'Relevé en cours : le marquage de la cuve n’est pas encore acquis', s => s.chemical.tanks[0].work === 'inspect' && s.chemical.tanks[0].working && s.chemical.tanks[0].progress > .55],
  ['containment', 'Confinement de la fuite en cours ; volumes déjà libérés conservés', s => s.chemical.leak.working && s.chemical.leak.progress > .55],
  ['sampling-defense', 'Prélèvement matériel progressif et arrivée réelle des forces privées', s => s.chemical.sampler.working && s.chemical.sampler.progress > .45 && s.chemical.alert.ready],
  ['decision', 'Ordre à choisir ; aucune cuve n’est traitée par l’ouverture du dialogue', s => s.decision.active],
  ['tank-isolation', 'Isolation d’une cuve réellement en cours après le choix', s => s.chemical.tanks.some(t => t.work === 'secure' && t.working && t.progress > .55)],
  ['canal-cover', 'Pontage du premier canal en cours ; les appuis et dommages antérieurs restent consignés', s => s.chemical.canals[0].working && s.chemical.canals[0].progress > .55],
  ['water-restoration', 'Remise en eau en cours après résolution physique des volumes', s => s.chemical.water.working && s.chemical.water.progress > .55],
  ['report', 'Transmission réelle du bilan, après défense et opérations', s => s.chemical.report.working && s.chemical.report.progress > .55],
];
const reached = new Set();
pilotMI10(reference.game, { stopAt: s => s.campaign.reportTransmitted && s.player.x > 5830, observe: s => {
  for (const [name, title, predicate] of referenceStages) if (!reached.has(name) && predicate(s)) {
    capture(reference, `mi10-${name}.png`, title); reached.add(name);
    if (name === 'sampling-defense') checkpoint(reference, 'mi10-sampling-checkpoint.json', 'Resume real sampling progress and observe protection, pause and retained evidence in a native browser.');
    if (name === 'decision') checkpoint(reference, 'mi10-decision-checkpoint.json', 'Open the real MI10 choice through a valid import, choose a plan and inspect still-required operations.');
  }
} });
assert.equal(reached.size, referenceStages.length, `Unreached scenes: ${referenceStages.filter(([name]) => !reached.has(name)).map(([name]) => name).join(', ')}`);
assert.ok(reference.game.campaign.reportTransmitted && reference.game.player.x > 5830);
capture(reference, 'mi10-before-extraction.png', 'Bilan transmis et preuves conservées ; rampe encore à rejoindre');
checkpoint(reference, 'mi10-before-extraction-checkpoint.json', 'Complete the remaining physical extraction by keyboard, then inspect the tenth first report and its single reward.');
const completed = finish(reference), completedText = serializeCampaign(completed.campaign);
writeFileSync(resolve(output, 'mi10-completed-campaign.json'), completedText + '\n');
manifest.checkpoints.push({ file: 'mi10-completed-campaign.json', purpose: 'Archive and replay examination from a completed public-control run', provenance: 'Simulation and campaign APIs; not native browser execution.', sha256: sha(completedText + '\n') });

const demolition = create('WK01');
stage(demolition, 'tank-demolition', 'Opération de démolition en cours : le choix n’avait pas détruit les cuves', s => s.chemical.tanks.some(t => t.work === 'demolish' && t.working && t.progress > .55), { choice: 'obey' }, 'demolition');
stage(demolition, 'retained-demolition', 'Volumes des cuves retenus physiquement au collecteur, prélèvement déjà conservé', s => s.campaign.tanksDestroyed === 3 && s.campaign.flowResolved && s.player.x > 2850, { choice: 'obey' }, 'demolition');
finish(demolition, { choice: 'obey' }, 'demolition');

for (const [name, title, options, predicate] of [
  ['polluted-canals', 'Démolition sans rétention : contamination des deux canaux acquise par un écoulement réel', { choice: 'obey', skipCollector: true }, s => s.campaign.canalsPolluted === 2 && s.player.x > 3800],
  ['sample-source-lost', 'Source détruite par des tirs avant collecte : le prélèvement ne peut pas être reconstitué', { destroySourceBeforeSample: true }, s => s.chemical.tanks[2].destroyed && s.campaign.sampleLost],
  ['evidence-after-destruction', 'Originaux et préleveur détruits après collecte : PT02 demeure conservé à bord', { destroyOriginalsAfterSample: true }, s => s.chemical.tanks[2].destroyed && s.chemical.sampler.destroyed && s.chemical.record.destroyed && s.campaign.pt02Acquired],
]) {
  const run = create('WK01'); stage(run, name, title, predicate, options, name); finish(run, options, name);
}

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
  const run = create(walker.id), name = `${walker.id}-${choice}`;
  if (choice === 'defy') {
    stage(run, `chassis-${walker.id.toLowerCase()}`, `${walker.designation} ${walker.name} : vrais pieds sur le pontage du canal`, s => s.player.feet.some(foot => foot.contact && chemicalSurfaceAt(s, foot.x).rise > 0), { choice }, name);
    assert.ok(run.game.player.feet.some(foot => foot.contact && chemicalSurfaceAt(run.game, foot.x).rise > 0));
  }
  finish(run, { choice }, name);
}
for (let i = 0; i < manifest.files.length; i++) assert.equal(JSON.stringify(manifest.files[i]), frozen[i], `Mutated snapshot ${i}`);
for (const path of sources) assert.equal(sha(readFileSync(resolve(root, path))), manifest.sourceHashes[path], `Changed source during capture: ${path}`);
writeFileSync(resolve(output, 'mi10-scenes.json'), JSON.stringify(manifest, null, 2) + '\n');
const proof = { version: manifest.version, scope: 'MI10 Canvas validation only', generatedBy: 'node tools/render-mi10-previews.mjs', manifest: 'docs/previews/mi10-scenes.json', imageCount: manifest.files.length, completedRuns: manifest.runs.length, campaignExports: manifest.checkpoints.length, sourceHashes: manifest.sourceHashes, historicalFixture: fixturePath,
  checks: { publicControlsOnly: true, deepSnapshotsUnchangedAfterContinuation: true, rendererDoesNotMutateState: true, capturesAcceptedByCampaignValidator: true, completedReceiptsRoundTripExactly: true, sixChassisBothPlansComplete: true }, nativeBrowserExamined: false, humanPlaytestPerformed: false,
  images: manifest.files.map(({ file, title, walkerId, elapsed, sha256 }) => ({ file, title, walkerId, elapsed, sha256 })), limitations: manifest.limitations };
writeFileSync(resolve(output, 'mi10-canvas-validation.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(`${manifest.files.length} MI10 Canvas images; ${manifest.runs.length} complete public-control runs; ${manifest.checkpoints.length} campaign exports. Deep states, contacts, source hashes and renderer immutability checked.`);
