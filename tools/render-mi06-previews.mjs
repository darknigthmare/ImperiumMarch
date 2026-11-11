/** Production Canvas renders reached by public controls; not browser screenshots. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame, updateGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI06, captureMI06Scene } from '../tests/helpers/mi06-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch { canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = canvasAPI;
const monoFont = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
if (existsSync(monoFont)) GlobalFonts.registerFromPath(monoFont, 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/previews'); mkdirSync(output, { recursive: true });
const context = { fuelAvailable: 2, channelOpen: true, refugeesPassed: 12, refugeesLost: 0, smugglerVerified: true, bargeCiviliansLost: 0 };
const create = options => createGame({ missionId: 'MI06', walkerId: 'WK09', seed: 1847, campaignContext: context, ...options });
const manifest = { version: '0.7.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)',
  limitations: 'No browser, HTML HUD, CSS, dialogs, hardware input, human playtest, audio or performance certification.',
  provenance: 'All seven states reached with public movement, aiming and interaction commands. Every complete simulation state is deeply cloned at capture; retained bytes are checked after later operations.', files: [] };
const captureBytes = [];
function capture(s, file, title) {
  assert.equal(s.status, 'playing', `Live capture required: ${file}`);
  const before = JSON.stringify(s), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false });
  assert.equal(JSON.stringify(s), before, 'the renderer cannot alter authoritative simulation');
  writeFileSync(resolve(output, file), canvas.toBuffer('image/png'));
  const scene = captureMI06Scene(s, { file, title });
  manifest.files.push(scene); captureBytes.push(JSON.stringify(scene));
}

const s = create();
for (const stage of [
  { file: 'mi06-threshold-inspection.png', title: 'Inspection locale de la marque impériale et des fenêtres occupées', stopAt: s => s.dike.houses[0].scanProgress > .55 },
  { file: 'mi06-evacuation-route.png', title: 'Habitants sortis des maisons : trajet réel et secours encore en cours', stopAt: s => s.campaign.evacuationOrdered && s.dike.residents[6].x < 1490 },
  { file: 'mi06-auxiliary-connected.png', title: 'Auxiliaire branchée : deux lots effectivement consommés, techniciens à couvert', stopAt: s => s.campaign.fuelSpent === 2 },
  { file: 'mi06-panel-support.png', title: 'Tous les pieds posés sous ancrage ; le technicien verrouille réellement le panneau', stopAt: s => s.dike.panel.latchProgress > .6 },
  { file: 'mi06-valve-diversion.png', title: 'La décision de dériver est suivie par une manœuvre de vanne encore inachevée', stopAt: s => s.dike.valve.progress > .5 },
]) {
  pilotMI06(s, { stopAt: stage.stopAt });
  assert.ok(stage.stopAt(s), `Unreached: ${stage.file}`); capture(s, stage.file, stage.title);
}
pilotMI06(s); assert.equal(s.status, 'won');

const imperial = create({ walkerId: 'WK06' });
pilotMI06(imperial, { choice: 'obey', stopAt: s => s.dike.valve.completed });
for (let frame = 0; frame < 5000 && imperial.player.x > 1340; frame++) updateGame(imperial, 1 / 60, { move: -1 });
for (let frame = 0; frame < 120; frame++) updateGame(imperial, 1 / 60, { brace: true });
assert.equal(imperial.campaign.residentsSafe, 10); assert.equal(imperial.campaign.homesUninhabitable, 2);
capture(imperial, 'mi06-imperial-flood.png', 'Dix habitants sauvés, deux logements réellement inondés par le seuil impérial');

const emergency = create({ walkerId: 'WK05', campaignContext: { ...context, fuelAvailable: 0 } });
pilotMI06(emergency, { destroyPanel: true, stopAt: s => s.campaign.emergencyShoring });
assert.equal(emergency.dike.panel.destroyed, true); assert.equal(emergency.campaign.fuelSpent, 0);
capture(emergency, 'mi06-emergency-shoring.png', 'Panneau perdu et étai distinct posé manuellement sans aucun carburant');
pilotMI06(emergency); assert.equal(emergency.status, 'won');

for (let i = 0; i < manifest.files.length; i++) assert.equal(JSON.stringify(manifest.files[i]), captureBytes[i], `Capture ${i} changed after continuing the simulation`);
writeFileSync(resolve(output, 'mi06-render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.files.length} MI06 production Canvas renders; public commands, independent complete snapshots, no browser/HUD certification.`);
