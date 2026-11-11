/** Production Canvas renders reached by public controls; not browser screenshots. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCampaign, beginCampaignMission } from '../src/campaign.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI07, captureMI07Scene } from '../tests/helpers/mi07-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch { canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = canvasAPI;
const monoFont = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
if (existsSync(monoFont)) GlobalFonts.registerFromPath(monoFont, 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/previews'); mkdirSync(output, { recursive: true });
const fixture = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v6-mi06.json'), 'utf8'));
const create = (walkerId = 'WK09', history = 'completed') => beginCampaignMission(
  parseCampaign(JSON.stringify(fixture[history])), { missionId: 'MI07', walkerId }).game;
const manifest = { version: '0.8.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)',
  limitations: 'No browser, HTML HUD, CSS, dialogs, hardware input, human playtest, audio or performance certification.',
  provenance: 'All nine states start from the authentic v6 MI06 fixture and are reached with public movement, aiming, interaction and decision commands. Each complete simulation state is deeply cloned at capture; retained bytes are checked after later operations. Loss scenes use actual public fire, never health or outcome setters.',
  historicalFixture: 'tests/fixtures/campaign-v6-mi06.json', files: [] };
const captureBytes = [];
function capture(s, file, title, history = 'completed') {
  assert.equal(s.status, 'playing', `Live capture required: ${file}`);
  const before = JSON.stringify(s), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false });
  assert.equal(JSON.stringify(s), before, 'the renderer cannot alter authoritative simulation');
  writeFileSync(resolve(output, file), canvas.toBuffer('image/png'));
  const scene = captureMI07Scene(s, { file, title, history, width: 1600, height: 900 });
  manifest.files.push(scene); captureBytes.push(JSON.stringify(scene));
}

const s = create();
for (const stage of [
  { file: 'mi07-stop-arrival.png', title: 'Aire effectivement dégagée, ambulance arrivée et personnel qui sort du véhicule', stopAt: s => s.ambulance.vehicle.stopReached },
  { file: 'mi07-consent-examination.png', title: 'Accord obtenu puis examen distinct de la caisse sanitaire encore en cours', stopAt: s => s.ambulance.cargo.scanProgress > .55 },
  { file: 'mi07-beacon-removal.png', title: 'Démontage de la balise sous ancrage, avant récupération de ses attaches et de son journal', stopAt: s => s.ambulance.beacon.progress > .5 },
  { file: 'mi07-seizure-arrival.png', title: 'Les deux drones de saisie entrent réellement après le délai annoncé de dix secondes', stopAt: s => s.ambulance.raidTriggered },
  { file: 'mi07-patient-transfer.png', title: 'L’ambulance est au quai ; les patients avancent encore vers la porte de l’accueil civil', stopAt: s => s.ambulance.patients.some(p => p.phase === 'transferring' && p.x > s.ambulance.vehicle.x + 90) },
]) {
  pilotMI07(s, { stopAt: stage.stopAt });
  assert.ok(stage.stopAt(s), `Unreached: ${stage.file}`); capture(s, stage.file, stage.title);
}
pilotMI07(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.patientsArrived, 4); assert.equal(s.campaign.staffArrived, 2);

const secondary = create('WK06', 'manualCompleted');
pilotMI07(secondary, { stopAt: s => s.ambulance.ramp.progress > .5 });
assert.equal(secondary.campaign.route, 'secondary'); assert.equal(secondary.campaign.context.emergencyShoring, true);
capture(secondary, 'mi07-secondary-ramp.png', 'Héritage authentique d’un étai MI06 : préparation du détour par la rampe secondaire', 'manualCompleted');
pilotMI07(secondary); assert.equal(secondary.status, 'won');

const imperial = create('WK10');
pilotMI07(imperial, { choice: 'obey', stopAt: s => s.campaign.transferResolved });
assert.equal(imperial.campaign.patientsArrived, 4); assert.equal(imperial.campaign.staffArrived, 2); assert.equal(imperial.campaign.vehicleSeized, true);
capture(imperial, 'mi07-imperial-arrival.png', 'Quatre patients et deux personnels admis au poste impérial, véhicule effectivement saisi');
pilotMI07(imperial, { choice: 'obey' }); assert.equal(imperial.status, 'won');

const wreck = create('WK05');
pilotMI07(wreck, { destroyVehicle: true, stopAt: s => s.ambulance.beacon.resolved });
assert.equal(wreck.campaign.vehicleDestroyed, true); assert.equal(wreck.campaign.patientsLost, 4); assert.equal(wreck.campaign.staffLost, 2);
assert.equal(wreck.campaign.medicalCargoVerified, false); assert.equal(wreck.campaign.beaconRecovered, false);
capture(wreck, 'mi07-ambulance-wreck.png', 'Constats locaux après destruction réelle : six pertes, aucune caisse vérifiée ni balise récupérée');
pilotMI07(wreck); assert.equal(wreck.status, 'won');

const manual = create('WK01', 'manualCompleted');
pilotMI07(manual, { killStaff: true, skipTechnical: true, stopAt: s => s.ambulance.vehicle.towing && s.ambulance.handover.ordered && s.ambulance.vehicle.moving && s.ambulance.vehicle.x > 2200 });
assert.equal(manual.campaign.staffLost, 2); assert.equal(manual.campaign.patientsLost, 0); assert.equal(manual.campaign.technicalHelpRequested, false);
capture(manual, 'mi07-manual-tow.png', 'Conductrice et soignant perdus : attelage réel, quatre patients remorqués sans aide technique ni coût nouveau', 'manualCompleted');
pilotMI07(manual, { skipTechnical: true }); assert.equal(manual.status, 'won'); assert.equal(manual.campaign.patientsArrived, 4);

for (let i = 0; i < manifest.files.length; i++) assert.equal(JSON.stringify(manifest.files[i]), captureBytes[i], `Capture ${i} changed after continuing the simulation`);
writeFileSync(resolve(output, 'mi07-render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.files.length} MI07 production Canvas renders; public commands, authentic inherited contexts, independent complete snapshots, no browser/HUD certification.`);
