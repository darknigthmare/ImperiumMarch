/** Real production Canvas, public simulation commands. These are not browser screenshots. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI05 } from '../tests/helpers/mi05-driver.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch { canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = canvasAPI;
const monoFont = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
if (existsSync(monoFont)) GlobalFonts.registerFromPath(monoFont, 'Courier New');
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
const output = resolve(root, 'docs/previews'); mkdirSync(output, { recursive: true });
const manifest = { version: '0.6.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)',
  limitations: 'No browser, HTML HUD, CSS, dialogs, hardware input, human playtest, audio or performance certification.',
  provenance: 'Every state below is reached by public commands. State is cloned at capture, never retained as a live reference.', files: [] };
function capture(s, file, title) {
  const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(s, { shake: false }); writeFileSync(resolve(output, file), canvas.toBuffer('image/png'));
  manifest.files.push(structuredClone({ file, title, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, campaign: s.campaign, channel: s.channel, decision: s.decision }));
}
const s = createGame({ missionId: 'MI05', walkerId: 'WK06' });
for (const stage of [
  { file: 'mi05-bank-bridge.png', title: 'Commande du tablier : passage sûr indépendant de la marée', stopAt: s => s.channel.banks[0].working && s.channel.banks[0].progress > .5 },
  { file: 'mi05-traffic-invoice.png', title: 'Tête de treuil libérée et facture de Saisie effectivement copiée', stopAt: s => s.campaign.traffickingVerified },
  { file: 'mi05-smuggler-contact.png', title: 'Vann Ostre répond depuis Rive-Courte : contact réel avec un équipage distinct', stopAt: s => s.campaign.smugglerVerified },
  { file: 'mi05-refugee-passage.png', title: 'Douze passagers dans le chenal ouvert, guidés par la vraie marée', stopAt: s => s.channel.boat.moving && s.channel.boat.x > 3550 },
]) {
  pilotMI05(s, { stopAt: stage.stopAt }); if (!stage.stopAt(s)) throw new Error(`Unreached: ${stage.file}`);
  capture(s, stage.file, stage.title);
}
const wreck = createGame({ missionId: 'MI05', walkerId: 'WK05' });
pilotMI05(wreck, { destroyBarge: 'smuggler', stopAt: s => s.channel.barges[1].inspected });
if (!wreck.channel.barges[1].destroyed || wreck.campaign.smugglerVerified) throw new Error('Wreck scenario not reached');
capture(wreck, 'mi05-smuggler-wreck.png', 'Rive-Courte détruite avant liaison : pertes documentées, aucun témoignage inventé');
writeFileSync(resolve(output, 'mi05-render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.files.length} MI05 production Canvas renders; public commands only, no browser/HUD verification.`);
