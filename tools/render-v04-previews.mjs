/** Production Canvas renders, reached through public gameplay controls.
 * No browser, HTML HUD, native dialogs, CSS or input hardware is exercised. */
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WALKERS } from '../src/content.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI03 } from '../tests/helpers/mi03-driver.mjs';

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
  version: '0.4.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)',
  limitations: 'No browser, HTML HUD, CSS, native input, audio, performance or human playability certification.',
  provenance: 'Mission states reached by public createGame/updateGame/commandGame, never by editing state. Fleet panel uses production hangar render at a common scale.',
  previewFonts: { labels: existsSync(monoFont) ? 'Liberation Mono, Courier-compatible fallback' : 'Canvas fallback', panel: existsSync(sansFont) ? 'DejaVu Sans' : 'Canvas fallback' },
  files: [],
};

const fleet = createCanvas(1920, 1720), f = fleet.getContext('2d');
f.fillStyle = '#102126'; f.fillRect(0, 0, fleet.width, fleet.height);
f.fillStyle = '#dec7a0'; f.font = '32px "Preview Sans", sans-serif'; f.fillText('ORDRE DE CENDRE / SIX CHÂSSIS JOUABLES', 30, 48);
f.fillStyle = '#9fb6a9'; f.font = '18px "Preview Sans", sans-serif'; f.fillText('Une échelle commune · silhouettes du rendu de jeu · version 0.4', 30, 80);
for (const [index, walker] of WALKERS.entries()) {
  const canvas = createCanvas(960, 480), renderer = new Renderer(canvas);
  renderer.renderHangar(walker, 0);
  const x = index % 2 * 960, y = 110 + Math.floor(index / 2) * 530;
  f.drawImage(canvas, x, y);
  f.fillStyle = '#d4d5bb'; f.font = '23px "Preview Sans", sans-serif'; f.fillText(`${walker.designation} ${walker.name.toUpperCase()}`, x + 30, y + 509);
  f.fillStyle = '#9bb6a8'; f.font = '16px "Preview Sans", sans-serif';
  f.fillText(`${walker.profile} · ${walker.ammo} tirs + ${walker.ammo * 8} en réserve`, x + 390, y + 507);
}
writeFileSync(resolve(output, 'v04-six-chassis.png'), fleet.toBuffer('image/png'));
manifest.files.push({ file: 'v04-six-chassis.png', type: 'production hangar panels', walkerIds: WALKERS.map(w => w.id), commonScale: true });

const stages = [
  { file: 'mi03-dispensary.png', title: 'Identifier le dispensaire avant de franchir sa gaine', stopAt: s => s.network.stations[1].scanning && s.network.stations[1].scanProgress > .55 },
  { file: 'mi03-oversight.png', title: 'Contrôle de Holt pendant la vérification des maisons', stopAt: s => s.campaign.holtAlerted && s.network.stations[2].scanning },
  { file: 'mi03-network-verified.png', title: 'Deux émissions civiles vérifiées et toujours actives, avant le choix final', stopAt: s => s.network.stations[2].verified },
];
const game = createGame({ missionId: 'MI03', walkerId: 'WK06', difficulty: 'normal', seed: 1847 });
for (const stage of stages) {
  pilotMI03(game, { stopAt: stage.stopAt });
  if (!stage.stopAt(game)) throw new Error(`Preview not reached: ${stage.file}; status=${game.status}`);
  const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.panorama = panorama; renderer.panoramaReady = true;
  renderer.render(game, { shake: false });
  writeFileSync(resolve(output, stage.file), canvas.toBuffer('image/png'));
  manifest.files.push({ file: stage.file, title: stage.title, missionId: game.missionId, walkerId: game.walkerId,
    elapsed: game.elapsed, playerX: game.player.x, phase: game.campaign.phase,
    signalsIdentified: game.campaign.signalsIdentified, verifiedBuildings: game.campaign.verifiedBuildings,
    civilRelaysOnline: game.campaign.civilRelaysOnline, holtAlerted: game.campaign.holtAlerted,
    residentsLost: game.campaign.residentsLost, decisionResolved: game.decision.resolved });
}
const damaged = createGame({ missionId: 'MI03', walkerId: 'WK01', difficulty: 'story', seed: 1847 });
pilotMI03(damaged, { stopAt: s => s.player.x > 2210 && s.campaign.militaryRelayDisabled });
const clinic = damaged.network.stations[1];
for (let frame = 0; frame < 168; frame++) updateGame(damaged, 1 / 60, { brace: true, secondary: true, aimX: clinic.x, aimY: clinic.y });
for (let frame = 0; frame < 30; frame++) updateGame(damaged, 1 / 60, { brace: true });
if (!clinic.destroyed || clinic.casualties !== 8) throw new Error('The real projectile damage scenario did not reach its expected state.');
pilotMI03(damaged, { stopAt: s => s.network.stations[1].identified });
const damagedCanvas = createCanvas(1600, 900), damagedRenderer = new Renderer(damagedCanvas);
damagedRenderer.panorama = panorama; damagedRenderer.panoramaReady = true;
damagedRenderer.render(damaged, { shake: false });
writeFileSync(resolve(output, 'mi03-damaged-dispensary.png'), damagedCanvas.toBuffer('image/png'));
manifest.files.push({ file: 'mi03-damaged-dispensary.png', title: 'Constat d’un dispensaire détruit par trois tirs réels de roquettes',
  missionId: damaged.missionId, walkerId: damaged.walkerId, elapsed: damaged.elapsed, playerX: damaged.player.x,
  clinicIdentified: clinic.identified, clinicVerified: clinic.verified, clinicDestroyed: clinic.destroyed,
  civilRelaysOnline: damaged.campaign.civilRelaysOnline, residentsLost: damaged.campaign.residentsLost,
  decisionResolved: damaged.decision.resolved });
writeFileSync(resolve(output, 'v04-render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Rendered ${manifest.files.length} Canvas previews. Mission states use public controls; these are not browser screenshots.`);
