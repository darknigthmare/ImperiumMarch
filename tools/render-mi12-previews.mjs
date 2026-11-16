/** Reconstructed MI12: public-control scenes rendered on Canvas, never native-browser claims. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { WALKERS } from '../src/content.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI12 } from '../tests/helpers/mi12-driver.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/validation/rebuild-mi12'), fixturePath = 'tests/fixtures/campaign-v11-mi11.json'; mkdirSync(output, { recursive: true });
const fixture = JSON.parse(readFileSync(resolve(root, fixturePath), 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const sources = ['src/content.mjs', 'src/simulation.mjs', 'src/relay-simulation.mjs', 'src/renderer.mjs', 'src/relay-renderer.mjs', 'src/relay-assets.mjs', 'src/campaign.mjs', 'src/relay-validation.mjs', 'tests/helpers/mi12-driver.mjs', 'tools/render-mi12-previews.mjs', fixturePath];
const manifest = { version: '0.14.1', created: '2026-11-12', type: 'Reconstructed MI12 Canvas production verification', renderer: '@napi-rs/canvas (Skia)', width: 1600, height: 900,
  provenance: 'New runs from the preserved public 0.12 v11 dossier. Public simulation commands and campaign APIs only; no positions, health, elapsed time, copy flags or outcomes are assigned by this driver. Snapshots are deeply copied and rendering is checked for state mutation. These are new 0.14.1 proofs and do not reproduce missing 0.13 bytes.',
  limitations: 'Canvas only. No HTML HUD, CSS, real browser focus, human playtest, hardware controller, audio or performance certification.',
  historicalFixture: fixturePath, fixtureProvenance: structuredClone(fixture.provenance),
  sourceHashes: Object.fromEntries(sources.map(p => [p, sha(readFileSync(resolve(root, p)))])), files: [], checkpoints: [], runs: [] };
const frozen = [];
function create(walkerId = 'WK09') { const run = beginCampaignMission(parseCampaign(JSON.stringify(fixture.completed)), { missionId: 'MI12', walkerId, difficulty: 'normal', seed: 2147 }); assert.equal(run.ok, true); return run; }
function capture(run, name, title, runName = 'reference') {
  const s = run.game; assert.equal(s.status, 'playing'); const before = JSON.stringify(s), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false }); assert.equal(JSON.stringify(s), before, 'Renderer mutated scene');
  const png = canvas.toBuffer('image/png'), file = `${name}.png`; writeFileSync(resolve(output, file), png);
  const snapshot = structuredClone({ file, title, run: runName, sha256: sha(png), missionId: s.missionId, walkerId: s.walkerId, elapsed: s.elapsed, playerX: s.player.x, state: s });
  manifest.files.push(snapshot); frozen.push(JSON.stringify(snapshot)); run.campaign = checkpointCampaign(run.campaign, s);
}
function checkpoint(run, name, purpose) {
  run.campaign = checkpointCampaign(run.campaign, run.game, { beforeDecision: run.game.decision.active });
  const data = serializeCampaign(run.campaign); assert.deepEqual(parseCampaign(data), run.campaign);
  writeFileSync(resolve(output, `${name}.json`), data + '\n'); manifest.checkpoints.push({ file: `${name}.json`, purpose, sha256: sha(data + '\n'), elapsed: run.game.elapsed, provenance: 'Prepared through public simulation commands for a separately recorded browser examination; not evidence that examination occurred.' });
}
function finish(run, options = {}, name = 'reference') {
  pilotMI12(run.game, options); assert.equal(run.game.status, 'won', `Incomplete ${name}`);
  const result = finishCampaignMission(run.campaign, run.game); assert.equal(result.applied, true); assert.deepEqual(parseCampaign(serializeCampaign(result.campaign)), result.campaign);
  manifest.runs.push(structuredClone({ run: name, walkerId: run.game.walkerId, options, elapsed: run.game.elapsed, status: run.game.status, facts: run.game.campaign, receipt: result.receipt }));
  return result;
}
const reference = create(); capture(reference, 'arrival', 'Trois relais présents ; aucune copie ni intervention déjà accomplie');
const stages = [
  ['inspection', 'Relevé réel du premier relais, ancrage et durée de trois secondes', s => s.relay.relays[0].working && s.relay.relays[0].progress > .55],
  ['copy-window', 'Troisième relevé achevé : fenêtre de quarante-cinq secondes ouverte', s => s.relay.window.opened && !s.relay.copy.started],
  ['copy-active', 'Copie de vingt-quatre secondes réellement en cours ; Prétoire arrivé', s => s.relay.copy.working && s.relay.copy.progress > .45 && s.relay.alert.ready],
  ['praetor-lock', 'Verrou hydraulique encore intact devant la coque et capteur neutralisé', s => s.relay.praetor.sensor.destroyed && !s.relay.praetor.hydraulicLock.destroyed && Math.abs(s.player.x - s.relay.praetor.x) < 500],
  ['praetor-exposed', 'Verrou rompu : blindage réduit et recul physique du Prétoire', s => s.relay.praetor.hydraulicLock.destroyed && !s.relay.praetor.destroyed && s.relay.praetor.x > s.mission.relay.praetorX + 10],
  ['decision', 'Trois réponses disponibles ; aucun relais purgé par le choix seul', s => s.decision.active],
  ['first-purge', 'Purge progressive du premier relais, après le choix clandestin', s => s.relay.relays[0].work === 'erase' && s.relay.relays[0].working && s.relay.relays[0].progress > .55],
  ['third-isolation', 'Isolement physique du troisième relais ; copie embarquée conservée', s => s.relay.relays[2].work === 'isolate' && s.relay.relays[2].working && s.relay.relays[2].progress > .55],
  ['report', 'Transmission des actes, composants atteints et commandes effectivement copiées', s => s.relay.report.working && s.relay.report.progress > .55],
];
const reached = new Set();
pilotMI12(reference.game, { stopAt: s => s.relay.report.transmitted && s.player.x > 5780, observe: s => {
  for (const [name, title, predicate] of stages) if (!reached.has(name) && predicate(s)) {
    capture(reference, name, title); reached.add(name);
    if (['inspection', 'copy-active', 'decision'].includes(name)) checkpoint(reference, `${name}-checkpoint`, `Examiner la reprise de ${name}, les commandes et les états sans les simuler dans le navigateur.`);
  }
} });
assert.equal(reached.size, stages.length, `Missing: ${stages.filter(([n]) => !reached.has(n)).map(([n]) => n).join(', ')}`);
capture(reference, 'before-extraction', 'Rapport transmis, sortie physique encore à rejoindre'); checkpoint(reference, 'before-extraction-checkpoint', 'Achever physiquement MI12 puis contrôler son rapport et la dotation unique.');
const completed = finish(reference), completedText = serializeCampaign(completed.campaign); writeFileSync(resolve(output, 'completed-campaign.json'), completedText + '\n');
manifest.checkpoints.push({ file: 'completed-campaign.json', purpose: 'Inspecter le premier reçu MI12 et lancer MI13', sha256: sha(completedText + '\n'), provenance: 'Public simulation and campaign APIs only.' });
for (const [name, title, options, predicate] of [
  ['three-purges', 'Ordre exécuté : troisième purge réelle, copie acquise avant effacement', { choice: 'obey' }, s => s.relay.relays[2].erased],
  ['public-refusal', 'Refus ouvert : les trois relais sont isolés, refuge impérial fermé', { choice: 'refuse' }, s => s.campaign.operationsResolved],
  ['expired-copy', 'Fenêtre expirée sans copie complète ; aucun texte industriel reconstitué', { skipCopy: true }, s => s.relay.copy.expired],
  ['lost-source-before-copy', 'Troisième relais détruit par de vrais tirs avant la copie', { destroySourceBeforeCopy: true }, s => s.relay.relays[2].destroyed],
  ['copy-survives-source', 'Source détruite après la copie ; commandes embarquées préservées', { destroySourceAfterCopy: true }, s => s.relay.relays[2].destroyed && s.campaign.ordersCopied],
]) {
  const run = create('WK09'); pilotMI12(run.game, { ...options, stopAt: predicate }); assert.ok(predicate(run.game), name); capture(run, name, title, name); finish(run, options, name);
}
for (const walker of WALKERS) for (const choice of ['obey', 'defy', 'refuse']) {
  const run = create(walker.id), name = `${walker.id}-${choice}`;
  if (choice === 'defy') { pilotMI12(run.game, { choice, stopAt: s => s.relay.copy.progress > .5 }); assert.ok(run.game.relay.copy.progress > .5); capture(run, `chassis-${walker.id.toLowerCase()}`, `${walker.designation} ${walker.name} : copie tenue avec les appuis du châssis réel`, name); }
  finish(run, { choice }, name);
}
for (let i = 0; i < manifest.files.length; i++) assert.equal(JSON.stringify(manifest.files[i]), frozen[i], `Mutated snapshot ${i}`);
for (const p of sources) assert.equal(sha(readFileSync(resolve(root, p))), manifest.sourceHashes[p], `Changed during capture: ${p}`);
writeFileSync(resolve(output, 'scenes.json'), JSON.stringify(manifest, null, 2) + '\n');
const proof = { version: manifest.version, created: manifest.created, scope: manifest.type, generatedBy: 'node tools/render-mi12-previews.mjs', manifest: 'docs/validation/rebuild-mi12/scenes.json', imageCount: manifest.files.length, completedRuns: manifest.runs.length, campaignExports: manifest.checkpoints.length, sourceHashes: manifest.sourceHashes, historicalFixture: fixturePath,
  checks: { publicControlsOnly: true, snapshotsDeepAndUnchanged: true, rendererDoesNotMutateState: true, snapshotsAcceptedByCampaignValidator: true, receiptsRoundTripExactly: true, sixChassisThreeChoicesComplete: true, windowAndLossDoNotInventCopies: true, copiedCommandsSurviveOriginalLoss: true },
  nativeBrowserExamined: false, humanPlaytestPerformed: false, images: manifest.files.map(({ file, title, walkerId, elapsed, sha256 }) => ({ file, title, walkerId, elapsed, sha256 })), limitations: manifest.limitations };
writeFileSync(resolve(output, 'canvas-validation.json'), JSON.stringify(proof, null, 2) + '\n');
console.log(`${manifest.files.length} MI12 Canvas images; ${manifest.runs.length} complete public-control runs; ${manifest.checkpoints.length} campaign exports. Deep snapshots and source hashes checked.`);
