/** Production Canvas scenes reached by public controls; never browser screenshots. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, beginCampaignMission } from '../src/campaign.mjs';
import { updateGame, departureWindow } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI08, captureMI08Scene } from '../tests/helpers/mi08-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch { canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = canvasAPI;
const monoFont = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
if (existsSync(monoFont)) GlobalFonts.registerFromPath(monoFont, 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/previews'); mkdirSync(output, { recursive: true });
const fixturePath = 'tests/fixtures/campaign-v7-mi07.json', fixture = JSON.parse(readFileSync(resolve(root, fixturePath), 'utf8'));
const create = (walkerId = 'WK09', history = 'completed') => beginCampaignMission(parseCampaign(JSON.stringify(fixture[history])), { missionId: 'MI08', walkerId, seed: 1847 }).game;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['src/content.mjs', 'src/simulation.mjs', 'src/renderer.mjs', 'src/production-assets.mjs', 'tests/helpers/mi08-driver.mjs', fixturePath];
const manifest = { version: '0.9.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)', width: 1600, height: 900,
  limitations: 'No browser, HTML HUD, CSS, dialogs, hardware input, human playtest, audio or performance certification.',
  cardLayout: 'Scene cards use one central viewport column, at most three cards constrained to y=200..500. The HTML objectives/instrument area at left, radio at right and lower gauges remain reserved. departureInstrument:false removes the standalone Canvas instrument for the browser.',
  provenance: 'All complete scene states are reached from authentic v7 MI07 dossiers with public movement, aiming, firing, interaction and choice commands. No position, health, time, person, gate or outcome setters. Each snapshot is deeply cloned when captured, then retained bytes are checked after every later continuation. Each draw must leave the authoritative state identical.',
  historicalFixture: fixturePath, sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])), files: [], runs: [] };
const snapshotBytes = [];
function capture(s, file, title, run = 'reference', history = 'completed') {
  assert.equal(s.status, 'playing', `Live capture required: ${file}`);
  const before = JSON.stringify(s), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false }); assert.equal(JSON.stringify(s), before, 'rendering cannot alter simulation authority');
  const png = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), png);
  const scene = captureMI08Scene(s, { file, title, run, history, width: 1600, height: 900, sha256: sha(png) });
  manifest.files.push(scene); snapshotBytes.push(JSON.stringify(scene));
}
function finish(s, options = {}, run = 'reference', history = 'completed') {
  pilotMI08(s, options); assert.equal(s.status, 'won', `${run} must remain finishable after capture`);
  manifest.runs.push(structuredClone({ run, history, walkerId: s.walkerId, options, elapsed: s.elapsed, status: s.status, campaign: s.campaign }));
}
function walk(s, targetX, stopAt = null, maxFrames = 15000) {
  for (let n = 0; n < maxFrames && s.status === 'playing' && !stopAt?.(s); n++) {
    const move = Math.abs(s.player.x - targetX) > 28 ? Math.sign(targetX - s.player.x) : 0;
    updateGame(s, 1 / 60, { move, brace: !move });
    if (!stopAt && !move) break;
  }
  if (stopAt) assert.ok(stopAt(s), 'the public follow-camera path did not reach its physical scene');
}

const reference = create();
for (const stage of [
  { file: 'mi08-intake-service.png', title: 'Techniciens physiquement au poste, ancrage et fermeture progressive de l’amenée', stopAt: s => s.departure.locks[0].working && s.departure.locks[0].opening < .52 },
  { file: 'mi08-origin-contact.png', title: 'Nouvelle invitation des survivants du chenal, avant trajet et consentement de destination', stopAt: s => s.departure.origins[0].progress > .55 },
  { file: 'mi08-quay-meeting.png', title: 'Consultation réelle du responsable du quai et des capacités encore à réserver', stopAt: s => s.departure.quay.progress > .55 },
  { file: 'mi08-refuge-link.png', title: 'Liaison avec le refuge encore en cours, aucune arrivée distante attribuée', stopAt: s => s.departure.refugeRadio.progress > .55 },
  { file: 'mi08-boarding-agreements.png', title: 'Accords de destination distincts de l’invitation, avant réservation achevée et embarquement', stopAt: s => s.departure.boarding.progress > .55 && !s.departure.boarding.assigned },
  { file: 'mi08-boarding-individual.png', title: 'Personnes réellement à bord et personnes encore en marche vers leurs passerelles', stopAt: s => s.campaign.peopleAboard > 5 && s.campaign.peopleAtQuay > 5 },
  { file: 'mi08-passage-window.png', title: 'Deux coques distinctes attendent leur fenêtre, le passage étant encore trop fermé ou le courant trop fort', stopAt: s => s.departure.locks[1].working && s.departure.boats.some((b, i) => b.x > s.mission.departure.boatXs[i] && !b.moving && !departureWindow(s, b)) },
  { file: 'mi08-two-boats-crossing.png', title: 'Deux bateaux en traversée réelle, gardant leur écart de coque et leurs propres passagers', stopAt: s => s.departure.boats.every(b => b.x > s.departure.locks[1].x && b.moving && !b.departed) },
  { file: 'mi08-window-closed.png', title: 'La fermeture après fenêtre est matériellement achevée ; les départs acquis restent acquis', stopAt: s => s.campaign.execution === 'delayed' && !s.departure.locks[1].working },
]) {
  pilotMI08(reference, { stopAt: stage.stopAt }); assert.ok(stage.stopAt(reference), `Unreached: ${stage.file}`);
  capture(reference, stage.file, stage.title);
}
finish(reference);

const open = create('WK06');
pilotMI08(open, { choice: 'defy', stopAt: s => s.departure.locks[1].opening === 1 && !s.departure.locks[1].working });
walk(open, 5940, s => s.player.x > 5400 && s.departure.people.some(p => p.phase === 'landing'
  && p.x > s.departure.boats.find(b => b.id === p.boatId).x + 112));
capture(open, 'mi08-refuge-arrival.png', 'Accostage distinct de l’accueil : des personnes marchent encore vers la porte du refuge', 'open');
pilotMI08(open, { choice: 'defy', stopAt: s => s.campaign.reportTransmitted });
capture(open, 'mi08-access-maintained.png', 'Passage maintenu, trente-quatre arrivées confirmées et rapport transmis après les opérations', 'open');
finish(open, { choice: 'defy' }, 'open');

const immediate = create('WK01');
pilotMI08(immediate, { choice: 'obey', stopAt: s => s.campaign.peopleLocal === 36 && s.campaign.closureCompleted });
walk(immediate, immediate.departure.shelter.x);
capture(immediate, 'mi08-immediate-local.png', 'Fermeture immédiate et accueil local réellement atteint, sans attribuer une traversée', 'immediate');
finish(immediate, { choice: 'obey' }, 'immediate');

const seal = create('WK10');
pilotMI08(seal, { destroyIntake: true, stopAt: s => s.departure.locks[0].sealProgress > .55 });
assert.equal(seal.departure.locks[0].mechanism.destroyed, true); assert.equal(seal.departure.locks[0].sealed, false);
capture(seal, 'mi08-emergency-seal.png', 'Mécanisme d’amenée détruit : obturation manuelle sous ancrage, sans réparation fictive', 'emergency-seal');
finish(seal, { destroyIntake: true }, 'emergency-seal');

const blocked = create('WK05');
pilotMI08(blocked, { destroyPassage: true, stopAt: s => s.departure.locks[1].damageNoted });
assert.equal(blocked.departure.locks[1].opening, .65);
capture(blocked, 'mi08-blocked-passage.png', 'Porte de passage bloquée à son ouverture réelle ; constat avant le repli vivant vers Aval', 'blocked');
finish(blocked, { destroyPassage: true }, 'blocked'); assert.equal(blocked.campaign.peopleLocal, 36);

const loss = create('WK05');
pilotMI08(loss, { stopAt: s => s.campaign.peopleAboard > 0 });
pilotMI08(loss, { destroyBoats: true, stopAt: s => s.campaign.boatsLost > 0 });
assert.ok(loss.campaign.peopleLost > 0);
capture(loss, 'mi08-boat-loss.png', 'Tirs réels sur une coque chargée : pertes de ses occupants, personnes restantes suivies séparément', 'loaded-loss');
// The first loaded hull is now lost. The following public route protects the
// other boat and reports both material outcomes instead of shooting through
// the passage mechanism that shields its later waiting position.
finish(loss, {}, 'loaded-loss');

const imperial = create('WK02', 'imperialCompleted');
pilotMI08(imperial, { stopAt: s => s.departure.origins[2].progress > .55 });
assert.equal(imperial.campaign.context.medicalDestination, 'imperial');
capture(imperial, 'mi08-imperial-origin.png', 'Héritage sanitaire impérial authentique : liaison plus longue, véhicule saisi toujours absent', 'imperial-origin', 'imperialCompleted');
finish(imperial, {}, 'imperial-origin', 'imperialCompleted');

const noStaff = create('WK09', 'noStaffCompleted');
pilotMI08(noStaff, { stopAt: s => s.campaign.patientsLocal === 2 && s.campaign.peopleAboard > 0 });
assert.equal(noStaff.departure.people.filter(p => p.role === 'staff').length, 0);
capture(noStaff, 'mi08-no-staff-capacity.png', 'Sans personnel sanitaire hérité, Mara accompagne un bateau ; deux autres patients gagnent l’accueil local', 'no-staff', 'noStaffCompleted');
finish(noStaff, {}, 'no-staff', 'noStaffCompleted'); assert.equal(noStaff.campaign.patientsArrived, 2);

for (let i = 0; i < manifest.files.length; i++) assert.equal(JSON.stringify(manifest.files[i]), snapshotBytes[i], `Capture ${i} changed during continuation`);
for (const path of sources) assert.equal(sha(readFileSync(resolve(root, path))), manifest.sourceHashes[path], `Source changed while rendering: ${path}`);
writeFileSync(resolve(output, 'mi08-render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.files.length} MI08 production Canvas renders; public commands, authentic contexts, individual deep snapshots, no state mutation. Manifest: docs/previews/mi08-render-manifest.json`);
