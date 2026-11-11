/** Reproducible Canvas renders from MI02 states reached only through public controls.
 * These are not browser screenshots. Menus, HTML HUD and CSS are absent. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI02 } from '../tests/helpers/mi02-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('The optional @napi-rs/canvas package is required for this rendering task.');
  canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage } = canvasAPI;
globalThis.window = { devicePixelRatio: 1 };
globalThis.Image = class { set src(_) {} };
const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
const output = resolve(root, 'docs/previews');
mkdirSync(output, { recursive: true });
const manifest = { version: '0.3.0', type: 'Canvas-only production renderer', renderer: '@napi-rs/canvas (Skia)',
  limitations: 'No browser, HTML HUD, CSS, native input, audio, frame rate or human playability certification.',
  provenance: 'Every state reached by createGame/updateGame/commandGame, without simulation state edits.', files: [] };
const stages = [
  { file: 'mi02-harpoons.png', title: 'Libération du second harpon', stopAt: s => s.train.harpoons[1].working && s.train.harpoons[1].progress > .4 },
  { file: 'mi02-braking.png', title: 'Liaison de freinage du train', stopAt: s => s.train.brakeWorking && s.train.brakeProgress > .4 },
  { file: 'mi02-rescue.png', title: 'Wagon ouvert et registre inspecté', stopAt: s => s.decision.active },
];
const game = createGame({ missionId: 'MI02', walkerId: 'WK01', difficulty: 'normal', seed: 1847 });
for (const stage of stages) {
  pilotMI02(game, { stopAt: stage.stopAt });
  if (!stage.stopAt(game)) throw new Error(`Preview state not reached: ${stage.file}; status=${game.status}`);
  const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.panorama = panorama; renderer.panoramaReady = true;
  renderer.render(game, { shake: false });
  writeFileSync(resolve(output, stage.file), canvas.toBuffer('image/png'));
  manifest.files.push({ file: stage.file, title: stage.title, missionId: game.missionId, walkerId: game.walkerId,
    elapsed: game.elapsed, trainX: game.train.x, phase: game.campaign.phase, hostagesRescued: game.campaign.hostagesRescued,
    hostagesLost: game.campaign.hostagesLost, evidencePreserved: game.campaign.evidencePreserved });
}
writeFileSync(resolve(output, 'mi02-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Rendered three MI02 Canvas states reached through public controls. These are not browser screenshots.');
