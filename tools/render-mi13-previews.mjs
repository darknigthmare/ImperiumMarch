/** MI13 reconstruction evidence: public controls, Canvas-only captures, deep snapshots. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { updateGame, foundrySurfaceAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI12 } from '../tests/helpers/mi12-driver.mjs';
import { pilotMI13, moveMI13 } from '../tests/helpers/mi13-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'docs/validation/rebuild-mi13'), require = createRequire(import.meta.url);
mkdirSync(output, { recursive: true });
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fixturePath = 'tests/fixtures/campaign-v11-mi11.json', fixture = JSON.parse(readFileSync(resolve(root, fixturePath), 'utf8'));
const relay = beginCampaignMission(parseCampaign(JSON.stringify(fixture.completed)), { missionId: 'MI12', walkerId: 'WK09', difficulty: 'story', seed: 1314 });
assert.equal(relay.ok, true); pilotMI12(relay.game, { choice: 'defy' }); assert.equal(relay.game.status, 'won');
const base = finishCampaignMission(relay.campaign, relay.game); assert.equal(base.applied, true);
const create = (walkerId = 'WK09') => { const run = beginCampaignMission(base.campaign, { missionId: 'MI13', walkerId, difficulty: 'story', seed: 1314 }); assert.equal(run.ok, true); return run; };
const sources = ['src/content.mjs', 'src/simulation.mjs', 'src/renderer.mjs', 'src/foundry-simulation.mjs', 'src/foundry-renderer.mjs',
  'src/foundry-assets.mjs', 'src/foundry-validation.mjs', 'src/campaign.mjs', 'tests/helpers/mi13-driver.mjs', 'tools/render-mi13-previews.mjs', fixturePath];
const manifest = { version: '0.14.1', created: new Date().toISOString(), type: 'Canvas-only reconstruction evidence', renderer: '@napi-rs/canvas (Skia)',
  width: 1600, height: 900,
  provenance: 'The frozen historical v11 MI11 dossier is migrated by campaign APIs. MI12 and MI13 are then played through public commands. No body, position, time, temperature, source or outcome is assigned by this generator. Captures deeply copy the entire state, and are checked again after continuation. Prepared dossier exports are not native browser evidence.',
  historicalFixture: fixturePath, historicalFixtureProvenance: fixture.provenance,
  limitations: 'No native browser, HTML/CSS HUD, controller hardware, audio listening, human playtest or performance certification is claimed. Former 0.14 evidence was lost; these are new reconstruction runs.',
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])), files: [], checkpoints: [], runs: [] };
const frozen = [];
function capture(run, name, title, options = {}, runName = 'reference') {
  const before = JSON.stringify(run.game), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(run.game, { shake: false, ...options }); assert.equal(JSON.stringify(run.game), before, 'Canvas must not mutate state');
  const bytes = canvas.toBuffer('image/png'), file = `${name}.png`; writeFileSync(resolve(output, file), bytes);
  const entry = structuredClone({ file, title, run: runName, options, sha256: sha(bytes), elapsed: run.game.elapsed, walkerId: run.game.walkerId,
    playerX: run.game.player.x, status: run.game.status, state: run.game });
  manifest.files.push(entry); frozen.push(JSON.stringify(entry));
  run.campaign = checkpointCampaign(run.campaign, run.game, { beforeDecision: run.game.decision.active });
}
function checkpoint(run, name, purpose) {
  run.campaign = checkpointCampaign(run.campaign, run.game, { beforeDecision: run.game.decision.active });
  const bytes = serializeCampaign(run.campaign) + '\n'; assert.deepEqual(parseCampaign(bytes), run.campaign);
  const file = `${name}.json`; writeFileSync(resolve(output, file), bytes); manifest.checkpoints.push({ file, purpose,
    sha256: sha(bytes), elapsed: run.game.elapsed, playerX: run.game.player.x, provenance: 'Prepared through public simulated controls; no native browser execution claimed.' });
}
function finish(run, options = {}, name = 'reference') {
  pilotMI13(run.game, options); assert.equal(run.game.status, 'won', `${name} must win after its captures`);
  const end = finishCampaignMission(run.campaign, run.game); assert.equal(end.applied, true); assert.deepEqual(parseCampaign(serializeCampaign(end.campaign)), end.campaign);
  manifest.runs.push(structuredClone({ run: name, options, walkerId: run.game.walkerId, status: run.game.status, elapsed: run.game.elapsed,
    facts: run.game.campaign, receipt: end.receipt })); return end;
}
function stage(run, name, title, predicate, options = {}, runName = name, render = {}) {
  pilotMI13(run.game, { ...options, stopAt: predicate }); assert.ok(predicate(run.game), `Unreached ${name}`); capture(run, name, title, render, runName);
}

const reference = create(); capture(reference, 'arrival', 'Début de Kharon : porteur, deux caisses et deux circuits physiques ; aucune preuve acquise');
const stages = [
  ['manifest-copy', 'Copie réelle du bordereau porté par le véhicule', s => s.foundry.manifest.working && s.foundry.manifest.progress > .55],
  ['carrier-release', 'Libération physique du porteur sous ancrage', s => s.foundry.carrier.release.working && s.foundry.carrier.release.progress > .55],
  ['thermal-valve', 'Vanne en cours : la chaleur ne disparaît pas au lancement', s => s.foundry.bridges[0].valve.working && s.foundry.bridges[0].valve.progress > .55],
  ['bridge-contact', 'Pieds et roues suivent le tablier réel, porté au-dessus du sol', s => s.player.feet.some(f => f.contact && foundrySurfaceAt(s, f.x).rise > 20) && s.foundry.carrier.wheels.some(w => w.bridgeId)],
  ['ambush-arrival', 'Deux drones et une tourelle n’existent dans le monde actif qu’après leur délai de six secondes', s => s.foundry.alert.ready && s.campaign.privateNeutralized < 3],
  ['cargo-marking', 'Marquage matériel réellement copié après l’embuscade', s => s.foundry.cargo.some(c => c.marking.working && c.marking.progress > .55)],
  ['tess-analysis', 'Analyse en liaison de Tess ; les copies ne suffisent pas avant huit secondes', s => s.foundry.analysis.working && s.foundry.analysis.progress > .55],
  ['destination-decision', 'Choix ouvert après examen ; porteur et caisses attendent encore leur trajet', s => s.decision.active],
  ['quarantine-escort', 'Destination choisie : escorte réelle vers la quarantaine', s => s.campaign.plan === 'quarantine' && s.foundry.carrier.x > 5060 && !s.foundry.carrier.arrived],
  ['quarantine-arrival', 'Porteur physiquement arrivé avant tout transfert', s => s.foundry.carrier.arrived && s.campaign.cargoTransferred === 0 && !s.foundry.cargo[0].transfer.working],
  ['partial-transfer', 'Transfert progressif : la caisse est entre la plate-forme et la baie', s => s.foundry.cargo[0].transfer.working && s.foundry.cargo[0].transfer.progress > .55],
  ['reception-report', 'Rapport réel de réception après transfert et relevé des pertes', s => s.foundry.report.working && s.foundry.report.progress > .55],
];
const reached = new Set();
pilotMI13(reference.game, { stopAt: s => s.campaign.reportTransmitted && s.player.x > 6500, observe: s => {
  for (const [name, title, predicate] of stages) if (!reached.has(name) && predicate(s)) {
    reached.add(name); capture(reference, name, title);
    if (['tess-analysis', 'destination-decision', 'partial-transfer'].includes(name)) checkpoint(reference, `${name}-checkpoint`, `Resume the actually reached ${name} state through a separately documented UI/browser examination.`);
    if (name === 'partial-transfer') {
      const cargo = s.foundry.cargo[0], x = cargo.x, y = cargo.y, progress = cargo.transfer.progress;
      updateGame(s, 1 / 60, { move: -1 }); assert.equal(cargo.transfer.working, false); assert.equal(cargo.transfer.progress, progress); assert.equal(cargo.x, x); assert.equal(cargo.y, y);
      capture(reference, 'interrupted-transfer', 'Interruption réelle : position de caisse et temps acquis conservés');
      checkpoint(reference, 'interrupted-transfer-checkpoint', 'Resume an interrupted transfer; retained time and physical cargo position must not reset.');
    }
  }
} });
assert.equal(reached.size, stages.length, 'Unreached scenes: ' + stages.filter(([name]) => !reached.has(name)).map(([name]) => name).join(', '));
capture(reference, 'before-extraction', 'Réception acquise ; extraction encore à rejoindre, dommages des caisses conservés');
checkpoint(reference, 'before-extraction-checkpoint', 'Finish physical extraction, inspect the thirteenth immutable receipt and one-time reward.');
const completed = finish(reference); const completedBytes = serializeCampaign(completed.campaign) + '\n';
writeFileSync(resolve(output, 'completed-campaign.json'), completedBytes); manifest.checkpoints.push({ file: 'completed-campaign.json', purpose: 'Completed thirteen-report campaign; reconstructed through simulation, not a browser.', sha256: sha(completedBytes) });

const delivery = create('WK02');
stage(delivery, 'central-arrival', 'Bastion à la fonderie centrale ; le choix n’avait pas téléporté la charge', s => s.foundry.carrier.arrived, { choice: 'obey' }, 'central-delivery');
stage(delivery, 'central-transfer', 'Bastion : transfert réel dans la baie de livraison', s => s.foundry.cargo[1].transfer.working && s.foundry.cargo[1].transfer.progress > .5, { choice: 'obey' }, 'central-delivery');
finish(delivery, { choice: 'obey' }, 'central-delivery');

const hot = create(); moveMI13(hot.game, hot.game.foundry.bridges[0].steam.x);
while (hot.game.foundry.bridges[0].steam.phase !== 'warning') updateGame(hot.game, 1 / 60, { brace: true });
capture(hot, 'hot-warning', 'Tablier non isolé à 90 °C, avertissement physique de vapeur', { reducedMotion: true }, 'hot-route');
while (hot.game.foundry.bridges[0].steam.phase !== 'jet') updateGame(hot.game, 1 / 60, { brace: true });
capture(hot, 'steam-reduced-motion', 'Jet réel toujours signalé avec animations réduites ; phase issue de l’horloge simulée', { reducedMotion: true }, 'hot-route');
finish(hot, { skipValves: true }, 'hot-route'); assert.ok(hot.game.foundry.thermal.wheelDamage > 0);

for (const [name, title, options, predicate] of [
  ['cargo-lost-before-copy', 'Caisse perdue avant copie : constat sans marquage et PT03 absent', { destroyCargoBeforeCopy: true }, s => s.foundry.cargo[0].destroyed && s.campaign.analysisCompleted],
  ['manifest-lost-before-copy', 'Bordereau perdu avant copie : aucun texte reconstitué', { destroyManifestBeforeCopy: true }, s => s.campaign.analysisCompleted && !s.campaign.manifestCopied],
  ['copies-after-original-loss', 'Deux caisses et bordereau perdus après copie : PT03 demeure conservée', { destroyCargoAfterCopy: true, destroyManifestAfterCopy: true }, s => s.campaign.cargoLost === 2 && s.foundry.manifest.destroyed && s.campaign.pt03Acquired],
]) {
  const run = create(); stage(run, name, title, predicate, options, name); finish(run, options, name);
}
const terminal = create(); pilotMI13(terminal.game, { destroyCarrier: true }); assert.equal(terminal.game.status, 'lost');
capture(terminal, 'carrier-terminal-loss', 'Porteur détruit : défaite terminale avec marcheur encore vivant', {}, 'carrier-loss');
checkpoint(terminal, 'carrier-loss-checkpoint', 'A terminal carrier loss cannot resume as a live sortie.');
manifest.runs.push({ run: 'carrier-loss', status: terminal.game.status, elapsed: terminal.game.elapsed, facts: structuredClone(terminal.game.campaign) });

for (let i = 0; i < frozen.length; i++) assert.equal(JSON.stringify(manifest.files[i]), frozen[i], 'Snapshot mutated after continuation');
for (const path of sources) assert.equal(sha(readFileSync(resolve(root, path))), manifest.sourceHashes[path], `Source changed during capture: ${path}`);
writeFileSync(resolve(output, 'scenes.json'), JSON.stringify(manifest, null, 2) + '\n');
const proof = { version: manifest.version, created: manifest.created, type: manifest.type, renderer: manifest.renderer,
  manifest: 'docs/validation/rebuild-mi13/scenes.json', imageCount: manifest.files.length, completedRuns: manifest.runs.filter(run => run.status === 'won').length,
  terminalRuns: manifest.runs.filter(run => run.status === 'lost').length, campaignExports: manifest.checkpoints.length,
  checks: { publicControlsOnly: true, physicalCarrierWheels: true, progressiveHeatAndTransfers: true, dormantAmbushDelayed: true,
    deepSnapshotsUnchanged: true, rendererDoesNotMutateState: true, campaignRoundTrips: true, thermalWarningsVisibleWithReducedMotion: true,
    damagedCargoRetained: true, lossesDoNotFabricateSources: true, copiesSurviveOriginalLoss: true },
  sourceHashes: manifest.sourceHashes, nativeBrowserExamined: false, humanPlaytestPerformed: false,
  images: manifest.files.map(({ file, title, walkerId, elapsed, sha256 }) => ({ file, title, walkerId, elapsed, sha256 })),
  checkpoints: manifest.checkpoints, limitations: manifest.limitations };
writeFileSync(resolve(root, 'docs/validation/rebuild-mi13-canvas.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(JSON.stringify({ images: proof.imageCount, completedRuns: proof.completedRuns, terminalRuns: proof.terminalRuns, campaignExports: proof.campaignExports }));
