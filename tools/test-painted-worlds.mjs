/** Original PNG decoding and in-engine Canvas reception. Not a browser playthrough. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { clearPaintedWorlds, loadPaintedWorlds, paintedWorldStatus, drawPaintedWorld, worldPanoramaProjection } from '../src/painted-worlds.mjs';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-worlds-qa');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); } catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Canvas decoding requires @napi-rs/canvas', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage } = api, sha = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
const sources = ['src/painted-worlds.mjs', 'src/renderer.mjs', 'tools/test-painted-worlds.mjs', 'src/simulation.mjs'];
const report = { version: '0.15.8', createdUtc: new Date().toISOString(), type: 'original world panoramas and Canvas mission openings',
  completed: false, nativeBrowserExecuted: false, humanPlaytestPerformed: false,
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])), images: [], views: [],
  limitations: ['The horizon board is diagnostic and exercises camera ranges explicitly.',
    'Mission scenes show unchanged states returned by createGame; no campaign completion is claimed.',
    'The panoramas contain distant decorative settlements, not interactable buildings or additional people.'] };
const save = (canvas, file, details) => {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  report.views.push({ file, dimensions: [canvas.width, canvas.height], sha256: sha(bytes), ...details });
};
try {
  const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/worlds/manifest.json')));
  clearPaintedWorlds();
  await loadPaintedWorlds({ loadImage: async (url, key) => {
    const path = fileURLToPath(url), bytes = readFileSync(path), source = manifest.images.find(item => item.planetId === key);
    assert.equal(sha(bytes), source.sha256);
    const image = await loadImage(path); assert.equal(image.width, source.width); assert.equal(image.height, source.height);
    const probe = createCanvas(image.width, image.height), ctx = probe.getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    for (let i = 3; i < pixels.length; i += 4) assert.equal(pixels[i], 255, `${key}: complete opaque background`);
    report.images.push({ planetId: key, sha256: source.sha256, bytes: bytes.length, dimensions: [image.width, image.height] });
    return image;
  } });
  assert.ok(Object.values(paintedWorldStatus()).every(item => item.state === 'ready'));
  const board = createCanvas(1602, 963), c = board.getContext('2d');
  for (const [row, planetId] of ['PL02', 'PL03', 'PL04'].entries()) {
    for (const [column, progress] of [0, .5, 1].entries()) {
      const x = column * 534, y = row * 321, cameraX = 10500 * progress;
      c.save(); c.translate(x, y); c.beginPath(); c.rect(0, 0, 534, 321); c.clip(); c.scale(1 / 3, 1 / 3);
      c.fillStyle = '#17252a'; c.fillRect(0, 0, 1602, 963);
      assert.equal(drawPaintedWorld(c, { planetId, cameraX, worldLength: 12000, width: 1600, height: 900 }), true);
      c.fillStyle = '#0a151ddd'; c.fillRect(0, 0, 1600, 62); c.fillStyle = '#ece5ce'; c.font = '31px sans-serif';
      c.fillText(`${planetId} · caméra ${Math.round(progress * 100)} %`, 30, 43); c.restore();
      const pose = worldPanoramaProjection({ imageWidth: 2172, imageHeight: 724, cameraX, worldLength: 12000, width: 1600, height: 900 });
      assert.ok(pose.x <= 0 && pose.x + pose.width >= 1600);
    }
  }
  save(board, 'world-horizons.png', { diagnostic: true, cameraFractions: [0, .5, 1], worlds: ['PL02', 'PL03', 'PL04'] });

  const loader = url => loadImage(fileURLToPath(url));
  const banks = [
    ['painted-sprites', 'loadPaintedSprites'], ['painted-combat', 'loadPaintedCombat'], ['painted-walkers', 'loadPaintedWalkers'],
    ['painted-thyr', 'loadPaintedThyr'], ['painted-cerbere', 'loadPaintedCerbere'], ['painted-transport', 'loadPaintedTransport'],
    ['painted-relay', 'loadPaintedRelay'], ['painted-nacre', 'loadPaintedNacre'], ['painted-chemical', 'loadPaintedChemical'],
    ['painted-voice', 'loadPaintedVoice'], ['painted-nacre-sites', 'loadPaintedNacreSiteAssets'], ['painted-vesper', 'loadPaintedVesper'],
    ['painted-route', 'loadPaintedRoute'], ['painted-foundry-sites', 'loadPaintedFoundrySites'],
  ];
  for (const [file, name] of banks) {
    const mod = await import(pathToFileURL(resolve(root, `src/${file}.mjs`)).href);
    await mod[name]({ loadImage: loader });
  }
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    for (const [missionId, walkerId] of [['MI05', 'WK02'], ['MI09', 'WK09'], ['MI13', 'WK01'], ['MI14', 'WK05']]) {
      const state = createGame({ missionId, walkerId, difficulty: 'story', seed: 158 }), before = JSON.stringify(state);
      const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
      renderer.render(state, { shake: false, reducedMotion: false });
      assert.equal(JSON.stringify(state), before);
      save(canvas, `${missionId.toLowerCase()}-painted-world.png`, { missionId, walkerId, publicInputs: true,
        scope: 'Unmodified mission opening returned by createGame', stateSha256: sha(before), cameraX: renderer.cameraX });
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  report.completed = true;
} catch (error) { report.error = error.stack; throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2) + '\n'); }
console.log(JSON.stringify({ completed: report.completed, panoramas: report.images.length, views: report.views.length, output }, null, 2));
