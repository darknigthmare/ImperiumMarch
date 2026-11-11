/** Production Canvas renders, reached through public gameplay controls.
 * No browser, HTML HUD, native dialogs, CSS or input hardware is exercised. */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WALKERS } from '../src/content.mjs';
import { createGame, updateGame, commandGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI04 } from '../tests/helpers/mi04-driver.mjs';
import { parseCampaign, beginCampaignMission } from '../src/campaign.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('@napi-rs/canvas is needed for optional Canvas previews.');
  canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage, GlobalFonts } = canvasAPI;
const monoFont = '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf';
const sansFont = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
if (existsSync(monoFont)) GlobalFonts.registerFromPath(monoFont, 'Courier New');
if (existsSync(sansFont)) GlobalFonts.registerFromPath(sansFont, 'Preview Sans');
globalThis.window = { devicePixelRatio: 1 };
globalThis.Image = class { set src(_) {} };
const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
const output = resolve(root, 'docs/previews');
mkdirSync(output, { recursive: true });
const manifest = {
  version: '0.5.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)',
  limitations: 'No browser, HTML HUD, CSS, native input, audio, performance or human playability certification.',
  provenance: 'All mission states reached through public gameplay controls. MI04 inherits the authentic completed v3 campaign fixture, migrated by production code. Radiator example uses actual hostile fire and repair input, not assigned health.',
  sourceFixture: 'tests/fixtures/campaign-v3-mi03.json', files: [],
};
const old = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v3-mi03.json'), 'utf8'));
function sortie(walkerId) {
  const started = beginCampaignMission(parseCampaign(JSON.stringify(old.completed)), { missionId: 'MI04', walkerId, difficulty: 'normal', seed: 1847 });
  if (!started.ok) throw new Error(started.message);
  return started.game;
}
function capture(s, file, title) {
  const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.panorama = panorama; renderer.panoramaReady = true;
  renderer.render(s, { shake: false });
  writeFileSync(resolve(output, file), canvas.toBuffer('image/png'));
  manifest.files.push(structuredClone({ file, title, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, campaign: s.campaign,
    radiator: s.player.radiator, decisionActive: s.decision.active, decisionChoice: s.decision.choice,
    industrial: s.industrial || null }));
}
const s = sortie('WK06');
for (const stage of [
  { file: 'mi04-coolant-pump.png', title: 'Conduite civile interrompue : remettre la pompe locale en pression', stopAt: s => s.industrial.pump.working && s.industrial.pump.progress > .5 },
  { file: 'mi04-turbine-cooling.png', title: 'Les ouvriers du train guident la première vanne', stopAt: s => s.industrial.turbines[0].working && s.industrial.turbines[0].progress > .5 },
  { file: 'mi04-dispensary-contact.png', title: 'Appeler le dispensaire par le canal préservé dans MI03', stopAt: s => s.industrial.contact.working && s.industrial.contact.progress > .5 },
  { file: 'mi04-maintenance-journal.png', title: 'PT01 : journal copié, deux turbines refroidies et contact radio recueilli', stopAt: s => s.decision.active },
]) {
  pilotMI04(s, { stopAt: stage.stopAt });
  if (!stage.stopAt(s)) throw new Error(`Preview not reached: ${stage.file}`);
  capture(s, stage.file, stage.title);
}
const lost = sortie('WK05');
pilotMI04(lost, { destroyPost: true, stopAt: s => s.decision.active });
if (!lost.industrial.post.destroyed || lost.campaign.technicalEvidence || !lost.decision.active) throw new Error('Lost-log route not reached');
capture(lost, 'mi04-post-destroyed.png', 'Poste détruit par de vrais tirs avant lecture : aucune preuve technique inventée');

// Expose the rear to an actual MI01 enemy, clear the local threats, then repair.
const damaged = createGame({ missionId: 'MI01', walkerId: 'WK01', difficulty: 'normal', seed: 1847 });
for (let i = 0; i < 8000 && damaged.status === 'playing' && damaged.player.x < 1590; i++) updateGame(damaged, 1 / 60, { move: 1 });
updateGame(damaged, 1 / 60, { move: -1 });
for (let i = 0; i < 1800 && damaged.status === 'playing' && damaged.player.radiator.health >= 100; i++) updateGame(damaged, 1 / 60, { brace: true });
if (damaged.player.radiator.health >= 100 || damaged.status !== 'playing') throw new Error('Hostile-fire radiator damage not reached');
for (let i = 0; i < 8000 && damaged.status === 'playing'; i++) {
  const p = damaged.player, target = damaged.enemies.filter(e => !e.dead && e.active && Math.abs(e.x - p.x) < 1100).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
  if (!target && !damaged.projectiles.some(p => p.team === 'enemy')) break;
  const vent = p.heat > 70 || p.overheated;
  updateGame(damaged, 1 / 60, { brace: true, vent, fire: Boolean(target) && !vent, secondary: Boolean(target) && target.hp > 160 && !vent, aimX: target?.x, aimY: target?.y });
}
for (let i = 0; i < 90; i++) updateGame(damaged, 1 / 60, { brace: true });
if (damaged.status !== 'playing' || !commandGame(damaged, 'repair')) throw new Error('Field repair could not start');
for (let i = 0; i < 120; i++) updateGame(damaged, 1 / 60, { brace: true });
if (!damaged.player.radiator.repairing || damaged.player.radiator.repairProgress < .45) throw new Error('Field repair did not reach midpoint');
capture(damaged, 'v05-radiator-field-repair.png', 'Radiateur atteint par un ennemi réel : réparation à mi-parcours, kit encore disponible');

writeFileSync(resolve(output, 'v05-render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${manifest.files.length} Canvas renders written; public controls only. No browser or HTML HUD verification.`);
