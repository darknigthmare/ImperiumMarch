/**
 * ORDRE DE CENDRE — reproducible Canvas-only previews, not browser screenshots.
 *
 * Requires the optional @napi-rs/canvas package already provided by the primary
 * authoring runtime. Nothing is downloaded or installed by this script.
 *
 * Run: "$CODEX_PRIMARY_RUNTIME_NODE" tools/render-previews.mjs
 * Output: docs/previews/ (three scenes + three hangar renders).
 *
 * Scenes use real createGame states and the production Renderer. The HTML HUD,
 * menus, dialogs and CSS are intentionally absent from these Canvas captures.
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createGame } from '../src/simulation.mjs';
import { WALKERS } from '../src/content.mjs';
import { Renderer } from '../src/renderer.mjs';

const require = createRequire(import.meta.url);
let canvasAPI;
try {
  canvasAPI = require('@napi-rs/canvas');
} catch {
  throw new Error('Optional renderer dependency @napi-rs/canvas is unavailable. Use the configured primary authoring runtime; this script will not install packages.');
}
const { createCanvas, loadImage } = canvasAPI;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'docs/previews');
const panoramaPath = resolve(root, 'assets/art/vesper-panorama.png');
if (!existsSync(panoramaPath)) throw new Error(`Missing production art asset: ${panoramaPath}`);

// Renderer needs only these two browser globals. Image loading is replaced by
// an explicit, local Skia load below; no network or DOM is involved.
globalThis.window = { devicePixelRatio: 1 };
globalThis.Image = class LocalImagePlaceholder {
  set src(value) { this.source = value; }
};

const panorama = await loadImage(panoramaPath);
mkdirSync(output, { recursive: true });
const cases = [
  { missionId: 'op01', walkerId: 'WK01', scene: 'scene-vesper-vigie.png', hangar: 'hangar-vigie.png' },
  { missionId: 'op02', walkerId: 'WK05', scene: 'scene-nacre-bastion.png', hangar: 'hangar-bastion.png' },
  { missionId: 'op03', walkerId: 'WK09', scene: 'scene-thyr-pelerin.png', hangar: 'hangar-pelerin.png' },
];
const manifest = {
  title: 'ORDRE DE CENDRE', type: 'Canvas-only production renderer previews',
  engine: '@napi-rs/canvas (Skia)', seed: 1847,
  limitations: 'No HTML HUD, browser layout, menus, dialogs, input events, audio or frame-rate verification.',
  artwork: 'assets/art/vesper-panorama.png', files: [],
};

for (const entry of cases) {
  const game = createGame({ missionId: entry.missionId, walkerId: entry.walkerId, seed: 1847, difficulty: 'normal' });
  const sceneCanvas = createCanvas(1600, 900);
  const sceneRenderer = new Renderer(sceneCanvas);
  sceneRenderer.panorama = panorama;
  sceneRenderer.panoramaReady = true;
  sceneRenderer.render(game, { shake: false, reducedMotion: true });
  writeFileSync(resolve(output, entry.scene), sceneCanvas.toBuffer('image/png'));
  manifest.files.push({ file: entry.scene, kind: 'scene', width: 1600, height: 900, missionId: entry.missionId, walkerId: entry.walkerId, elapsed: game.elapsed });

  const hangarCanvas = createCanvas(960, 480);
  const hangarRenderer = new Renderer(hangarCanvas);
  hangarRenderer.renderHangar(WALKERS.find(w => w.id === entry.walkerId), 0);
  writeFileSync(resolve(output, entry.hangar), hangarCanvas.toBuffer('image/png'));
  manifest.files.push({ file: entry.hangar, kind: 'hangar', width: 960, height: 480, walkerId: entry.walkerId, animationTime: 0 });
}
writeFileSync(resolve(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('ORDRE DE CENDRE: rendered 3 simulation scenes and 3 hangars to docs/previews/.');
console.log('These are reproducible Canvas-only captures. The HTML HUD and browser interface are not included.');
