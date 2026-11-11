/** MI11 public-control runs rendered on Canvas. No native browser claim. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { voiceSurfaceAt } from '../src/simulation.mjs';
import { WALKERS } from '../src/content.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI11 } from '../tests/helpers/mi11-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
const font = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
if (existsSync(font)) GlobalFonts.registerFromPath(font, 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/previews'); mkdirSync(output, { recursive: true });
const fixturePath = 'tests/fixtures/campaign-v10-mi10.json', fixture = JSON.parse(readFileSync(resolve(root, fixturePath), 'utf8'));
const create = (walkerId = 'WK09') => {
  const started = beginCampaignMission(parseCampaign(JSON.stringify(fixture.completed)), { missionId: 'MI11', walkerId, difficulty: 'normal', seed: 1111 });
  assert.equal(started.ok, true); return started;
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['src/content.mjs', 'src/simulation.mjs', 'src/voice-simulation.mjs', 'src/renderer.mjs', 'src/voice-renderer.mjs', 'src/voice-assets.mjs', 'src/campaign.mjs', 'src/voice-validation.mjs', 'tests/helpers/mi11-driver.mjs', 'tools/render-mi11-previews.mjs', fixturePath];
const manifest = { version: '0.12.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)', width: 1600, height: 900,
  limitations: 'No browser, HTML HUD, CSS, native focus, human playtest, hardware controller, audio listening or performance certification.',
  provenance: 'All scenes begin from the frozen v10 MI10 completed dossier produced through public simulation controls in 0.11; it is NOT native browser evidence. Campaign APIs migrate and begin MI11. Only public commands and inputs drive movement, aiming, shooting, anchoring, interactions and choices. No position, health, time, consent, source, testimony or outcome setter is used. Full states are deeply copied on capture, checked after continuation, and unchanged by the renderer.',
  historicalFixture: fixturePath, fixtureProvenance: structuredClone(fixture.provenance),
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])), files: [], checkpoints: [], runs: [] };
const frozen = [];
function capture(run, file, title, name = 'reference') {
  const s = run.game; assert.equal(s.status, 'playing', file);
  const before = JSON.stringify(s), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false }); assert.equal(JSON.stringify(s), before, 'Renderer mutated authoritative state');
  const png = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), png);
  const scene = structuredClone({ file, title, run: name, width: 1600, height: 900, sha256: sha(png), missionId: s.missionId, walkerId: s.walkerId, elapsed: s.elapsed, playerX: s.player.x, state: s });
  manifest.files.push(scene); frozen.push(JSON.stringify(scene));
  run.campaign = checkpointCampaign(run.campaign, s);
}
function checkpoint(run, file, purpose) {
  run.campaign = checkpointCampaign(run.campaign, run.game, { beforeDecision: run.game.decision.active });
  const data = serializeCampaign(run.campaign); assert.deepEqual(parseCampaign(data), run.campaign);
  writeFileSync(resolve(output, file), data + '\n');
  manifest.checkpoints.push({ file, purpose, provenance: 'Prepared through public simulation controls for a future, separately recorded native browser examination. This is not evidence that examination occurred.', sha256: sha(data + '\n'), elapsed: run.game.elapsed, playerX: run.game.player.x, decisionActive: run.game.decision.active, facts: structuredClone(run.game.campaign) });
}
function finish(run, options = {}, name = 'reference') {
  pilotMI11(run.game, options); assert.equal(run.game.status, 'won', name + ' must complete after captures');
  const end = finishCampaignMission(run.campaign, run.game); assert.equal(end.applied, true);
  assert.deepEqual(parseCampaign(serializeCampaign(end.campaign)), end.campaign);
  manifest.runs.push(structuredClone({ run: name, walkerId: run.game.walkerId, options, elapsed: run.game.elapsed, status: run.game.status, facts: run.game.campaign, firstReceipt: end.receipt }));
  return end;
}
function stage(run, name, title, stopAt, options = {}, runName = 'reference') {
  pilotMI11(run.game, { ...options, stopAt }); assert.ok(stopAt(run.game), 'Unreached scene: ' + name);
  capture(run, 'mi11-' + name + '.png', title, runName);
}
const raisedFoot = s => s.player.feet.some(foot => foot.contact && voiceSurfaceAt(s, foot.x).rise >= 28
  && Math.abs(foot.y - voiceSurfaceAt(s, foot.x).groundY) < .001);

const reference = create();
capture(reference, 'mi11-arrival.png', 'Début de mission : trois écoutes à recueillir, aucun accord ni témoignage acquis');
const referenceStages = [
  ['listening', 'Écoute réellement en cours : ancrage, pieds immobiles et silence', s => s.voice.listening[0].working && s.voice.listening[0].progress > .55],
  ['ridge-survey', 'Reconnaissance en cours du passage haut : la ponte ne reçoit aucun soin automatique', s => s.voice.ridge.working && s.voice.ridge.progress > .55],
  ['ridge-contact', 'Pieds réellement portés par la corniche reconnue au-dessus de la ponte', raisedFoot],
  ['translation-copy', 'Copie du texte impérial en cours : les paroles de Leth restent inconnues', s => s.voice.receiver.working && s.voice.receiver.progress > .55],
  ['warning-copy', 'Copie distincte du signal source, avant le témoignage de l’interprète', s => s.voice.emitter.working && s.voice.emitter.work === 'emitter' && s.voice.emitter.progress > .55],
  ['first-meeting', 'Rencontre accomplie : aucun accord ni témoignage n’en découle automatiquement', s => s.voice.leth.met && !s.voice.leth.consentAsked],
  ['private-consent', 'Demande d’accord privé en cours : aucune autorisation de diffusion publique', s => s.voice.leth.working && s.voice.leth.work === 'consent' && s.voice.leth.progress > .55],
  ['protected-exchange', 'Échange consenti réellement en cours avec les forces privées présentes', s => s.voice.leth.working && s.voice.leth.work === 'testimony' && s.voice.leth.progress > .45 && s.voice.alert.ready],
  ['decision', 'Choix de conduite ouvert : la saisie ou la remise en service exige encore un acte physique', s => s.decision.active],
  ['restoration', 'Remise en service progressive du canal des avis sur l’émetteur encore intact', s => s.voice.emitter.working && s.voice.emitter.work === 'restore' && s.voice.emitter.progress > .55],
  ['report', 'Transmission réelle des copies, du témoignage et des pertes constatées', s => s.voice.report.working && s.voice.report.progress > .55],
];
const reached = new Set();
pilotMI11(reference.game, { stopAt: s => s.campaign.reportTransmitted && s.player.x > 5860, observe: s => {
  for (const [name, title, predicate] of referenceStages) if (!reached.has(name) && predicate(s)) {
    capture(reference, 'mi11-' + name + '.png', title); reached.add(name);
    if (name === 'listening') checkpoint(reference, 'mi11-listening-checkpoint.json', 'Resume a real unfinished listening operation, inspect interruption without held anchoring, pause and restart.');
    if (name === 'protected-exchange') checkpoint(reference, 'mi11-exchange-checkpoint.json', 'Resume actual consented testimony progress and examine protection, pause and source distinctions.');
    if (name === 'decision') checkpoint(reference, 'mi11-decision-checkpoint.json', 'Open the real choice from a valid import and inspect the physical operation still required.');
  }
} });
assert.equal(reached.size, referenceStages.length, 'Unreached scenes: ' + referenceStages.filter(([name]) => !reached.has(name)).map(([name]) => name).join(', '));
assert.ok(reference.game.campaign.reportTransmitted && reference.game.player.x > 5860);
capture(reference, 'mi11-before-extraction.png', 'Rapport acquis ; sortie encore à rejoindre ; Leth demeure sur le site');
checkpoint(reference, 'mi11-before-extraction-checkpoint.json', 'Complete the physical extraction by keyboard, then inspect the eleventh first report and its one-time reward.');
const completed = finish(reference), completedText = serializeCampaign(completed.campaign);
writeFileSync(resolve(output, 'mi11-completed-campaign.json'), completedText + '\n');
manifest.checkpoints.push({ file: 'mi11-completed-campaign.json', purpose: 'Inspect the completed archive and an immutable replay', provenance: 'Simulation and campaign APIs only; not native browser execution.', sha256: sha(completedText + '\n') });

const seizure = create('WK01');
stage(seizure, 'seizure', 'Saisie matérielle en cours : la décision seule n’avait pas démonté l’émetteur', s => s.voice.emitter.working && s.voice.emitter.work === 'seize' && s.voice.emitter.progress > .55, { choice: 'obey' }, 'seizure');
stage(seizure, 'emitter-seized', 'Émetteur retiré de son socle ; copies et témoignage conservés, liaison coupée', s => s.voice.emitter.seized, { choice: 'obey' }, 'seizure');
finish(seizure, { choice: 'obey' }, 'seizure');

for (const [name, title, options, predicate] of [
  ['consent-refused', 'Ponte atteinte lors du passage au sol : refus constaté, aucune parole inventée', { skipRidge: true }, s => s.voice.leth.refused],
  ['witness-lost-before', 'Leth tué par des tirs avant l’échange : aucun témoignage ni TE01 reconstitué', { destroyLethBeforeExchange: true }, s => !s.voice.leth.alive && !s.voice.leth.testimonyRecorded],
  ['witness-lost-after', 'Témoin perdu après l’enregistrement : TE01 demeure, disponibilité future disparue', { destroyLethAfterExchange: true }, s => !s.voice.leth.alive && s.voice.leth.testimonyRecorded],
  ['copies-after-destruction', 'Originaux détruits après copie : archives conservées, aucune remise en service possible', { destroyOriginalsAfterExchange: true }, s => s.voice.emitter.destroyed && s.voice.receiver.destroyed && s.campaign.te01Acquired],
]) {
  const run = create('WK01'); stage(run, name, title, predicate, options, name); finish(run, options, name);
}

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
  const run = create(walker.id), name = walker.id + '-' + choice;
  if (choice === 'defy') {
    stage(run, 'chassis-' + walker.id.toLowerCase(), walker.designation + ' ' + walker.name + ' : appuis réels sur la corniche au-dessus de la ponte', raisedFoot, { choice }, name);
    assert.ok(raisedFoot(run.game));
  }
  finish(run, { choice }, name);
  assert.equal(run.game.campaign.nestsIntact, 3); assert.equal(run.game.campaign.te01Acquired, true);
}
for (let i = 0; i < manifest.files.length; i++) assert.equal(JSON.stringify(manifest.files[i]), frozen[i], 'Mutated snapshot ' + i);
for (const path of sources) assert.equal(sha(readFileSync(resolve(root, path))), manifest.sourceHashes[path], 'Changed source during capture: ' + path);
writeFileSync(resolve(output, 'mi11-scenes.json'), JSON.stringify(manifest, null, 2) + '\n');
const proof = { version: manifest.version, scope: 'MI11 Canvas validation only', generatedBy: 'node tools/render-mi11-previews.mjs', manifest: 'docs/previews/mi11-scenes.json', imageCount: manifest.files.length, completedRuns: manifest.runs.length, campaignExports: manifest.checkpoints.length, sourceHashes: manifest.sourceHashes, historicalFixture: fixturePath,
  checks: { publicControlsOnly: true, deepSnapshotsUnchangedAfterContinuation: true, rendererDoesNotMutateState: true, capturesAcceptedByCampaignValidator: true, completedReceiptsRoundTripExactly: true, sixChassisBothPlansComplete: true, physicalRaisedFeetObservedForEveryChassis: true, refusalAndWitnessLossDoNotInventTestimony: true, retainedCopiesSeparateFromLivingWitness: true },
  nativeBrowserExamined: false, humanPlaytestPerformed: false, images: manifest.files.map(({ file, title, walkerId, elapsed, sha256 }) => ({ file, title, walkerId, elapsed, sha256 })), limitations: manifest.limitations };
writeFileSync(resolve(output, 'mi11-canvas-validation.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(manifest.files.length + ' MI11 Canvas images; ' + manifest.runs.length + ' complete public-control runs; ' + manifest.checkpoints.length + ' campaign exports. Deep states, actual foot contacts, source hashes and renderer immutability checked.');
