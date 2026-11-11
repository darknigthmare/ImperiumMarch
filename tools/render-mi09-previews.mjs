/** Publicly piloted MI09 states rendered by Canvas; these are not browser screenshots. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { livingRouteSurfaceAt } from '../src/simulation.mjs';
import { WALKERS } from '../src/content.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI09, captureMI09Scene } from '../tests/helpers/mi09-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch { canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = canvasAPI;
const monoFont = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
if (existsSync(monoFont)) GlobalFonts.registerFromPath(monoFont, 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/previews'); mkdirSync(output, { recursive: true });
const fixturePath = 'tests/fixtures/campaign-v8-mi08.json', fixture = JSON.parse(readFileSync(resolve(root, fixturePath), 'utf8'));
const create = (walkerId = 'WK09') => {
  const started = beginCampaignMission(parseCampaign(JSON.stringify(fixture.completed)), { missionId: 'MI09', walkerId, difficulty: 'normal', seed: 1847 });
  assert.equal(started.ok, true); return started;
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['src/content.mjs', 'src/simulation.mjs', 'src/renderer.mjs', 'src/thyr-renderer.mjs', 'src/thyr-assets.mjs',
  'src/campaign.mjs', 'src/thyr-validation.mjs', 'tests/helpers/mi09-driver.mjs', 'tools/render-mi09-previews.mjs', fixturePath];
const manifest = { version: '0.10.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)', width: 1600, height: 900,
  limitations: 'No browser, HTML HUD, CSS, native focus, human playtest, hardware control, human voice or performance certification.',
  provenance: 'Every complete scene state is reached from the authentic native v8 MI08 completed dossier, migrated to v9 and begun through campaign APIs. Public movement, aiming, firing, interaction and choice commands only: no position, health, time, animal, gate or outcome setters. Each snapshot is deeply cloned on capture and checked after later continuation. Every draw must leave the authoritative state byte-identical.',
  historicalFixture: fixturePath, fixtureProvenance: structuredClone(fixture.provenance),
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])), files: [], checkpoints: [], runs: [] };
const snapshotBytes = [];
function capture(run, file, title, name = 'reference') {
  const s = run.game;
  assert.equal(s.status, 'playing', `Live scene required: ${file}`);
  const before = JSON.stringify(s), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false }); assert.equal(JSON.stringify(s), before, 'Canvas rendering changed the authoritative state');
  const png = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), png);
  const scene = captureMI09Scene(s, { file, title, run: name, width: 1600, height: 900, sha256: sha(png) });
  manifest.files.push(scene); snapshotBytes.push(JSON.stringify(scene));
  // The same state must be accepted by the persistent campaign validator.
  run.campaign = checkpointCampaign(run.campaign, s);
}
function checkpoint(run, file, purpose) {
  run.campaign = checkpointCampaign(run.campaign, run.game);
  const data = serializeCampaign(run.campaign); assert.deepEqual(parseCampaign(data), run.campaign);
  writeFileSync(resolve(output, file), data + '\n');
  manifest.checkpoints.push({ file, purpose, provenance: 'Public-control simulation checkpoint prepared for a separate native browser examination; not evidence that the browser examination occurred.',
    sha256: sha(data + '\n'), elapsed: run.game.elapsed, playerX: run.game.player.x, decisionActive: run.game.decision.active, facts: structuredClone(run.game.campaign) });
}
function finish(run, options = {}, name = 'reference') {
  pilotMI09(run.game, options); assert.equal(run.game.status, 'won', `${name} cannot finish after its captures`);
  const completed = finishCampaignMission(run.campaign, run.game); assert.equal(completed.applied, true);
  assert.deepEqual(parseCampaign(serializeCampaign(completed.campaign)), completed.campaign);
  manifest.runs.push(structuredClone({ run: name, walkerId: run.game.walkerId, options, elapsed: run.game.elapsed,
    status: run.game.status, facts: run.game.campaign, firstReceipt: completed.receipt }));
  return completed;
}

const reference = create();
capture(reference, 'mi09-arrival-thyr.png', 'Début de Thyr : un nouveau lieu, aucun recensement humain transféré depuis Nacre');
for (const stage of [
  { file: 'mi09-local-listening.png', title: 'Écoute du poste local réellement en cours, aide non encore attribuée', stopAt: s => s.livingRoute.contact.working && s.livingRoute.contact.progress > .55 },
  { file: 'mi09-guided-approach.png', title: 'Balisage guidé sous ancrage, tous les appuis en contact avant le contournement', stopAt: s => s.livingRoute.approach.working && s.livingRoute.approach.progress > .55 },
  { file: 'mi09-root-contacts.png', title: 'Appuis réels élevés par le relief de la racine porteuse ; habitat suspendu au même support', stopAt: s => s.player.x > 1110 && s.player.feet.some(foot => foot.contact && livingRouteSurfaceAt(s, foot.x).rise > 12) },
  { file: 'mi09-map-decision.png', title: 'Carte relevée et choix ouvert : aucune manœuvre ni destination animale encore accomplie', stopAt: s => s.decision.active },
]) {
  pilotMI09(reference.game, { stopAt: stage.stopAt }); assert.ok(stage.stopAt(reference.game), `Not reached: ${stage.file}`);
  capture(reference, stage.file, stage.title);
}
checkpoint(reference, 'mi09-decision-checkpoint.json', 'Import in the offline browser, resume the actual MI09 choice, choose a route, and verify that the barrier still requires an operation.');
for (const stage of [
  { file: 'mi09-barrier-operation.png', title: 'Manœuvre ancrée en cours après le choix ; troupeau encore au point de départ', stopAt: s => s.livingRoute.barrier.working && s.livingRoute.barrier.progress > .55 },
  { file: 'mi09-migration-in-progress.png', title: 'Longues-dorses en déplacement physique vers le verger, arrivée non encore acquise', stopAt: s => s.livingRoute.migrators.every(animal => animal.phase === 'migrating') && s.livingRoute.migrators[0].x > 2650 },
  { file: 'mi09-sniper-corridor.png', title: 'Tireur d’élite réellement présent après résolution du troupeau, colonne et habitat dans les angles de tir', stopAt: s => s.livingRoute.alert.triggered && s.player.x > 3280 && s.enemies.some(enemy => !enemy.dead && enemy.phase === 'attack') },
  { file: 'mi09-orchard-arrivals.png', title: 'Quatre animaux effectivement au verger, distincts du transport encore en route', stopAt: s => s.campaign.migratorsArrived === 4 && s.player.x > 4380 },
  { file: 'mi09-logistics-route.png', title: 'Transport physiquement en route et deux tireurs neutralisés ; dépôt non encore atteint', stopAt: s => s.campaign.snipersNeutralized === 2 && s.livingRoute.logistics.moving && s.livingRoute.logistics.x > 4300 },
  { file: 'mi09-report-transmission.png', title: 'Transmission du rapport en cours après l’arrivée logistique, le troupeau et la défense', stopAt: s => s.livingRoute.report.working && s.livingRoute.report.progress > .55 },
  { file: 'mi09-before-extraction.png', title: 'Bilan transmis, conséquences conservées, extraction encore à rejoindre', stopAt: s => s.campaign.reportTransmitted },
]) {
  pilotMI09(reference.game, { stopAt: stage.stopAt }); assert.ok(stage.stopAt(reference.game), `Not reached: ${stage.file}`);
  capture(reference, stage.file, stage.title);
}
checkpoint(reference, 'mi09-before-extraction-checkpoint.json', 'Import in the offline browser and complete the final physical extraction; inspect first report and single reward.');
const completedReference = finish(reference);
const completedData = serializeCampaign(completedReference.campaign);
writeFileSync(resolve(output, 'mi09-completed-campaign.json'), completedData + '\n');
manifest.checkpoints.push({ file: 'mi09-completed-campaign.json', purpose: 'Validated completed campaign for archive and replay examination', provenance: 'Completed through the public simulation driver and campaign APIs, not native browser execution.', sha256: sha(completedData + '\n') });

const diverted = create('WK01');
pilotMI09(diverted.game, { choice: 'obey', stopAt: s => s.campaign.migratorsDisplaced === 4 && s.player.x > 3110 });
assert.equal(diverted.game.campaign.migratorsArrived, 0);
capture(diverted, 'mi09-exclusion-destination.png', 'Quatre longues-dorses vivantes atteignent l’exclusion ; le verger ne reçoit pas leur passage', 'imperial-route');
finish(diverted, { choice: 'obey' }, 'imperial-route');

for (const [name, options, stopAt, title] of [
  ['root-damage', { destroyRoot: 1 }, s => s.livingRoute.roots[0].destroyed, 'Racine rompue par des tirs réels : habitat effondré, tronc encore présent'],
  ['column-damage', { destroyColumn: 1 }, s => s.livingRoute.columns[0].destroyed, 'Colonne détruite : habitat et colonie d’éventails perdus, faits non reconstruits'],
  ['broken-barrier', { destroyBarrier: true }, s => s.livingRoute.barrier.destroyed && s.livingRoute.barrier.working && s.livingRoute.barrier.progress > .55, 'Barrière détruite puis guides manuels en cours ; la brèche n’avait pas affecté le troupeau'],
]) {
  const run = create('WK01'); pilotMI09(run.game, { ...options, stopAt }); assert.ok(stopAt(run.game));
  capture(run, `mi09-${name}.png`, title, name); finish(run, options, name);
}

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
  const run = create(walker.id), name = `${walker.id}-${choice}`;
  if (choice === 'defy') {
    pilotMI09(run.game, { choice, stopAt: s => s.player.x > 1110 && s.player.feet.some(foot => foot.contact && livingRouteSurfaceAt(s, foot.x).rise > 12) });
    assert.ok(run.game.player.feet.some(foot => foot.contact && livingRouteSurfaceAt(run.game, foot.x).rise > 12));
    capture(run, `mi09-chassis-${walker.id.toLowerCase()}.png`, `${walker.designation} ${walker.name} : gabarit réel et pieds portés par la même racine`, name);
  }
  finish(run, { choice }, name);
}

for (let i = 0; i < manifest.files.length; i++) assert.equal(JSON.stringify(manifest.files[i]), snapshotBytes[i], `Capture ${i} changed after continuation`);
for (const path of sources) assert.equal(sha(readFileSync(resolve(root, path))), manifest.sourceHashes[path], `Source changed during rendering: ${path}`);
writeFileSync(resolve(output, 'mi09-render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const canvasProof = { version: manifest.version, scope: 'MI09 production Canvas validation only',
  generatedBy: 'node tools/render-mi09-previews.mjs', manifest: 'docs/previews/mi09-render-manifest.json',
  imageCount: manifest.files.length, completedRuns: manifest.runs.length, campaignExports: manifest.checkpoints.length,
  sourceHashes: manifest.sourceHashes, historicalFixture: fixturePath,
  checks: { publicControlsOnly: true, deepSnapshotsUnchangedAfterContinuation: true, rendererDidNotMutateAuthoritativeState: true,
    capturesAcceptedByCampaignValidator: true, completedReceiptsRoundTripExactly: true, allSixChassisBothRoutesComplete: true },
  nativeBrowserExamined: false, humanPlaytestPerformed: false,
  images: manifest.files.map(({ file, title, walkerId, elapsed, sha256 }) => ({ file, title, walkerId, elapsed, sha256 })),
  limitations: manifest.limitations };
writeFileSync(resolve(output, 'mi09-canvas-validation.json'), JSON.stringify(canvasProof, null, 2) + '\n');
console.log(`${manifest.files.length} MI09 Canvas images; ${manifest.runs.length} completed public-control runs; ${manifest.checkpoints.length} campaign exports. Deep snapshots, physical feet, source hashes and renderer immutability checked.`);
