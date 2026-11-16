/** MI14 evidence from public commands, deep snapshots and Canvas-only rendering. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { Renderer } from '../src/renderer.mjs';
import { workshopSummary } from '../src/workshop-renderer.mjs';
import { pilotMI14 } from '../tests/helpers/mi14-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'docs/validation/mi14'), require = createRequire(import.meta.url);
mkdirSync(output, { recursive: true });
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fixturePath = 'tests/fixtures/campaign-v13-mi13.json', fixtureBytes = readFileSync(resolve(root, fixturePath));
const base = parseCampaign(fixtureBytes.toString()); assert.ok(base, 'Historic v13 fixture must migrate without fabrication');
const create = (walkerId = 'WK09') => {
  const run = beginCampaignMission(base, { missionId: 'MI14', walkerId, difficulty: 'story', seed: 1415 }); assert.equal(run.ok, true); return run;
};
const sourcePaths = ['src/workshop-simulation.mjs', 'src/workshop-validation.mjs', 'src/workshop-assets.mjs', 'src/workshop-renderer.mjs',
  'src/renderer.mjs', 'src/content.mjs', 'src/simulation.mjs', 'src/campaign.mjs', 'tests/helpers/mi14-driver.mjs', 'tools/render-mi14-previews.mjs'];
const manifest = { version: '0.15.0', created: new Date().toISOString(), type: 'Canvas-only mission evidence', width: 1600, height: 900,
  renderer: '@napi-rs/canvas (Skia)',
  provenance: 'Frozen v13 MI13 dossier migrated via campaign API. Every MI14 move, work, shot and choice uses public commands. No body, clock, source, temperature or outcome is assigned by the generator. Captures copy the entire state deeply and are verified unchanged after continuation.',
  limitations: 'These scenes do not claim native browser interaction, HTML/CSS verification, hardware controller tests, human playtest, audio listening or final art approval.',
  historicalFixture: { file: fixturePath, sha256: sha(fixtureBytes), attestation: 'docs/validation/v015-historic-v13.json' },
  sourceHashes: Object.fromEntries(sourcePaths.map(path => [path, sha(readFileSync(resolve(root, path)))])), files: [], checkpoints: [], runs: [] };
const frozen = [];
function checkpoint(run, name, purpose) {
  run.campaign = checkpointCampaign(run.campaign, run.game, { beforeDecision: run.game.decision.active });
  const bytes = serializeCampaign(run.campaign) + '\n'; assert.deepEqual(parseCampaign(bytes), run.campaign, `Checkpoint ${name} roundtrip`);
  const file = `${name}-checkpoint.json`; writeFileSync(resolve(output, file), bytes);
  manifest.checkpoints.push({ file, purpose, sha256: sha(bytes), elapsed: run.game.elapsed, playerX: run.game.player.x,
    provenance: 'Prepared by public simulation commands; available for a separately documented browser import/replay.' });
}
function capture(run, name, title, options = {}, runName = 'hold-reference') {
  const before = JSON.stringify(run.game), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(run.game, { shake: false, ...options }); assert.equal(JSON.stringify(run.game), before, 'Renderer must not mutate simulation');
  const bytes = canvas.toBuffer('image/png'), file = `${name}.png`; writeFileSync(resolve(output, file), bytes);
  const entry = structuredClone({ file, title, run: runName, options, sha256: sha(bytes), elapsed: run.game.elapsed,
    walkerId: run.game.walkerId, playerX: run.game.player.x, summary: workshopSummary(run.game), state: run.game });
  manifest.files.push(entry); frozen.push(JSON.stringify(entry));
}
function finish(run, options = {}, name = 'hold-reference') {
  pilotMI14(run.game, options); assert.equal(run.game.status, 'won', `Run ${name} must complete`);
  const end = finishCampaignMission(run.campaign, run.game); assert.equal(end.applied, true); assert.deepEqual(parseCampaign(serializeCampaign(end.campaign)), end.campaign);
  manifest.runs.push(structuredClone({ run: name, options, walkerId: run.game.walkerId, status: run.game.status, elapsed: run.game.elapsed, facts: run.game.campaign, receipt: end.receipt }));
  return end;
}
const run = create();
capture(run, 'arrival', 'Arrivée à Kharon : piquet présent, machines et sources non examinées');
const stages = [
  ['passage-request', 'Demande de passage en cours ; les ouvriers n’ont pas encore quitté les appuis', s => s.workshop.picket.working && s.workshop.picket.progress > .45, true],
  ['workers-crossing', 'Déplacement réel vers la galerie commune ; attendre le dernier ouvrier', s => s.workshop.workers.every(w => w.routeProgress > .4) && !s.campaign.picketCleared, false],
  ['gallery-contact', 'Huit ouvriers en galerie ; échange distinct de toute copie du lot', s => s.workshop.contact.working && s.workshop.contact.progress > .5, false],
  ['security-active', 'Automate présent seulement après cinq secondes ; ligne de tir et corps réels', s => s.workshop.alert.ready && !s.campaign.securityNeutralized, false],
  ['isolation', 'Isolation du circuit sous ancrage ; le diagnostic et la réparation restent distincts', s => s.workshop.valve.working && s.workshop.valve.progress > .5, false],
  ['repair', 'Réparation interrompable : refroidisseur isolé, travail et température encore en cours', s => s.workshop.cooler.repair.working && s.workshop.cooler.repair.progress > .3, true],
  ['decision', 'Ordre à choisir après les opérations ; aucune commande encore accomplie', s => s.decision.active, true],
  ['control', 'Maintien de l’arrêt : cinq secondes de commande physique après le choix', s => s.workshop.control.working && s.workshop.control.progress > .5, false],
  ['cooperation', 'Accord des mécaniciens recueilli ; disponibilité locale sans recrutement', s => s.workshop.cooperation.agreed, true],
];
const reached = new Set();
pilotMI14(run.game, { stopAt: s => s.workshop.report.transmitted, observe: s => {
  for (const [name, title, predicate, exportCheckpoint] of stages) if (!reached.has(name) && predicate(s)) {
    reached.add(name); capture(run, name, title);
    if (exportCheckpoint) checkpoint(run, name, title);
  }
} });
assert.equal(reached.size, stages.length, `Unreached stages: ${stages.filter(([name]) => !reached.has(name)).map(([name]) => name).join(', ')}`);
assert.ok(run.game.extraction.x - run.game.player.x > run.game.extraction.radius + 55, 'Extraction checkpoint must still require real movement');
capture(run, 'before-extraction', 'Bilan transmis ; il faut encore rejoindre la rampe de retour');
checkpoint(run, 'before-extraction', 'Import the report-transmitted state, then physically reach extraction and inspect one-time reward.');
const complete = finish(run); const completedBytes = serializeCampaign(complete.campaign) + '\n';
writeFileSync(resolve(output, 'completed-campaign.json'), completedBytes);
manifest.checkpoints.push({ file: 'completed-campaign.json', purpose: 'Fourteen immutable receipts; prepared simulation export for browser import.', sha256: sha(completedBytes) });

const obey = create('WK02');
pilotMI14(obey.game, { choice: 'obey', stopAt: s => s.workshop.control.operated });
assert.equal(obey.game.campaign.productionOnline, true); assert.equal(obey.game.campaign.mechanicsCooperating, false);
capture(obey, 'production-restarted', 'Bastion : reprise réellement exécutée ; aucune coopération accordée automatiquement', {}, 'restart');
finish(obey, { choice: 'obey' }, 'restart');

const lost = create();
pilotMI14(lost.game, { destroyLotBeforeCopy: true, stopAt: s => s.workshop.lot.inspected });
assert.equal(lost.game.workshop.lot.destroyed, true); assert.equal(lost.game.campaign.lotRecordCopied, false);
capture(lost, 'lot-lost', 'Lot perdu avant copie : constat de perte sans relevé inventé', {}, 'lost-source');
checkpoint(lost, 'lot-lost', 'Import an actually destroyed source. The report must retain missing local evidence.');
finish(lost, { destroyLotBeforeCopy: true }, 'lost-source');

const retained = create();
pilotMI14(retained.game, { destroyLotAfterCopy: true, stopAt: s => s.workshop.lot.destroyed });
assert.equal(retained.game.campaign.lotRecordCopied, true);
capture(retained, 'copy-retained', 'Copie achevée avant la perte de l’original : le constat reste conservé', { reducedMotion: true }, 'retained-copy');
finish(retained, { destroyLotAfterCopy: true }, 'retained-copy');

for (let i = 0; i < frozen.length; i++) assert.equal(JSON.stringify(manifest.files[i]), frozen[i], 'Capture changed after continuation');
for (const path of sourcePaths) assert.equal(sha(readFileSync(resolve(root, path))), manifest.sourceHashes[path], `Source changed during capture: ${path}`);
writeFileSync(resolve(output, 'scenes.json'), JSON.stringify(manifest, null, 2) + '\n');
const proof = { version: manifest.version, created: manifest.created, type: manifest.type, renderer: manifest.renderer,
  manifest: 'docs/validation/mi14/scenes.json', imageCount: manifest.files.length, completedRuns: manifest.runs.length,
  campaignExports: manifest.checkpoints.length, checks: { publicControlsOnly: true, deepSnapshotsUnchanged: true, rendererDoesNotMutateState: true,
    exactCampaignRoundTrips: true, workerPositionsFromSimulation: true, commonGallerySurface: true, delayedSecurity: true,
    sourceLossAndRetainedCopyDistinct: true, obeyAndDefyBothComplete: true },
  sourceHashes: manifest.sourceHashes, nativeBrowserExamined: false, humanPlaytestPerformed: false,
  images: manifest.files.map(({ file, title, walkerId, elapsed, sha256 }) => ({ file, title, walkerId, elapsed, sha256 })),
  checkpoints: manifest.checkpoints, limitations: manifest.limitations };
writeFileSync(resolve(root, 'docs/validation/mi14-canvas.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify({ images: proof.imageCount, completedRuns: proof.completedRuns, campaignExports: proof.campaignExports }));
