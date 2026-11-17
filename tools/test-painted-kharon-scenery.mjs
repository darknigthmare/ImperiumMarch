/** Decode source PNGs and receive Kharon quarry in Canvas. No browser claim. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_KHARON_SCENERY_LAYOUT } from '../src/painted-kharon-scenery-layout.mjs';
import { loadPaintedKharonScenery, clearPaintedKharonScenery, paintedKharonSceneryStatus,
  paintedKharonSceneryFrame, drawPaintedKharonSceneryPart, setPaintedKharonSceneryImage, drawPaintedKharonTerrain } from '../src/painted-kharon-scenery.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedTransport } from '../src/painted-transport.mjs';
import { loadPaintedFoundrySites } from '../src/painted-foundry-sites.mjs';
import { loadPaintedSprites } from '../src/painted-sprites.mjs';
import { loadPaintedWorlds } from '../src/painted-worlds.mjs';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI13 } from '../tests/helpers/mi13-driver.mjs';
import { pilotMI14 } from '../tests/helpers/mi14-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-kharon-scenery-qa');
const require = createRequire(import.meta.url); let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) { if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Scenery reception requires @napi-rs/canvas', { cause }); api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = api, sha = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
const sources = ['src/painted-kharon-scenery.mjs', 'src/painted-kharon-scenery-layout.mjs', 'src/renderer.mjs',
  'assets/painted/kharon-scenery/manifest.json', 'assets/painted/kharon-scenery/prompts.json',
  'tools/index-painted-kharon-scenery.py', 'tools/test-painted-kharon-scenery.mjs', 'tests/painted-kharon-scenery.test.mjs',
  'src/painted-worlds.mjs', 'assets/painted/worlds/manifest.json',
  'src/simulation.mjs', 'src/foundry-renderer.mjs', 'src/workshop-renderer.mjs',
  'src/painted-foundry-sites.mjs', 'src/painted-sprites.mjs', 'src/painted-transport.mjs',
  'tests/helpers/mi13-driver.mjs', 'tests/helpers/mi14-driver.mjs'];
const receipt = { version: '0.15.10', createdUtc: new Date().toISOString(), completed: false,
  type: 'Original PNG decoding, quarry diagnostics and public-input Kharon Canvas scenes',
  browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [],
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  limitations: ['Diagnostic cameras reveal existing scenery; they do not claim that the player reached their position.',
    'Public-input scenes start through createGame and use only updateGame/commandGame; no simulation actor is teleported.',
    'Terrain textures and quarry props introduce no collider, population, thermal warning or mission state. FL10/FL11 remain decorative.',
    'No browser, audio, hardware performance, human test or complete campaign acceptance is inferred from Canvas.'] };
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/kharon-scenery/manifest.json')));
const prompts = JSON.parse(readFileSync(resolve(root, 'assets/painted/kharon-scenery/prompts.json')));
const ids = new WeakMap(), decodedImages = new Map();
function save(canvas, file, info = {}) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  receipt.views.push({ file, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...info });
}
function track(ctx) {
  const calls = {}, original = ctx.drawImage;
  ctx.drawImage = function (...args) { const key = ids.get(args[0]); if (key) calls[key] = (calls[key] || 0) + 1; return original.apply(this, args); };
  return calls;
}
function caption(ctx, text, width) {
  ctx.fillStyle = '#25242ce8'; ctx.fillRect(0, 0, width, 39);
  ctx.fillStyle = '#e3d5b5'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(text, 20, 26, width - 40);
}
try {
  clearPaintedKharonScenery();
  await loadPaintedKharonScenery({ loadImage: async (url, key) => {
    const bytes = readFileSync(fileURLToPath(url)), image = await loadImage(fileURLToPath(url)), atlas = PAINTED_KHARON_SCENERY_LAYOUT[key];
    const file = manifest.files.find(item => item.id === key);
    assert.equal(sha(bytes), file.sha256); assert.equal(sha(bytes), prompts.selectedOutputs.find(item => item.atlas === key).sha256);
    assert.deepEqual([image.width, image.height], atlas.size);
    const c = createCanvas(image.width, image.height).getContext('2d'); c.drawImage(image, 0, 0);
    const pixels = c.getImageData(0, 0, image.width, image.height).data;
    const alpha = (x, y) => pixels[(y * image.width + x) * 4 + 3]; let clear = 0;
    for (let i = 3; i < pixels.length; i += 4) if (!pixels[i]) clear++;
    assert.ok(clear / (image.width * image.height) > (key === 'terrain' ? .25 : .7));
    const solidIn = ([x, y, w, h]) => { let n = 0; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (alpha(xx, yy) >= 32) n++; return n; };
    for (const [name, frame] of Object.entries(atlas.frames)) {
      const [x, y, w, h] = frame.cell;
      for (let dx = 0; dx < w; dx++) for (const dy of [0, 1, h - 2, h - 1]) assert.ok(alpha(x + dx, y + dy) <= 2, `${key}/${name}: row gutter`);
      for (let dy = 0; dy < h; dy++) for (const dx of [0, 1, w - 2, w - 1]) assert.ok(alpha(x + dx, y + dy) <= 2, `${key}/${name}: column gutter`);
      const solidPixels = solidIn(frame.source); assert.ok(solidPixels > 1000); assert.equal(solidPixels, solidIn(frame.cell), `${name}: cropped visible pixels`);
      if (frame.materialSource) {
        const [mx, my, mw, mh] = frame.materialSource; let minAlpha = 255;
        for (let py = my; py < my + mh; py++) for (let px = mx; px < mx + mw; px++) minAlpha = Math.min(minAlpha, alpha(px, py));
        assert.ok(minAlpha >= 200, `${name}: opaque interior material`);
      }
      receipt.frames.push({ atlas: key, name, usage: 'runtime', source: frame.source, target: frame.target, solidPixels });
    }
    decodedImages.set(key, image); ids.set(image, key); receipt.atlases.push({ id: key, sha256: sha(bytes), bytes: bytes.length, dimensions: atlas.size, transparentPixels: clear });
    return image;
  } });
  assert.ok(Object.values(paintedKharonSceneryStatus()).every(status => status.state === 'ready'));
  assert.equal(receipt.frames.length, 10);
  // An opaque, uniform diagnostic fixture makes subpixel strip seams measurable
  // without editing any generated atlas or mistaking texture detail for a seam.
  const uniform = createCanvas(...PAINTED_KHARON_SCENERY_LAYOUT.terrain.size), uniformCtx = uniform.getContext('2d');
  uniformCtx.fillStyle = '#789abc'; uniformCtx.fillRect(0, 0, uniform.width, uniform.height);
  // Decode once as an Image, as real atlases are. Passing a mutable Canvas for
  // each strip can retain a full native snapshot on every drawImage call.
  setPaintedKharonSceneryImage('terrain', await loadImage(uniform.toBuffer('image/png')));
  receipt.rasterContinuity = { type: 'Opaque diagnostic fixture only; generated PNG bytes untouched', checks: [] };
  for (const scale of [1, 1.25, 1.5]) for (const cameraX of [0, .1114473071375, .296992496895, .5]) {
    const sample = createCanvas(512, 256), sampleCtx = sample.getContext('2d');
    sampleCtx.setTransform(scale, 0, 0, scale, -cameraX * scale, 0);
    assert.ok(drawPaintedKharonTerrain(sampleCtx, { from: -32, to: 800, groundAt: () => 40, bottom: 300 }));
    const scan = sampleCtx.getImageData(16, Math.floor(55 * scale), 480, 1).data;
    for (let i = 0; i < scan.length; i += 4) {
      assert.equal(scan[i + 3], 255, `raster alpha seam at scale ${scale}, camera ${cameraX}, pixel ${i / 4}`);
      // Canvas color conversion may round an RGB channel by one unit. Alpha
      // remains exact, so this tolerance cannot hide transparent strip edges.
      for (const [channel, expected] of [120, 154, 188].entries()) assert.ok(Math.abs(scan[i + channel] - expected) <= 1, `raster color seam at scale ${scale}, camera ${cameraX}, pixel ${i / 4}`);
    }
    receipt.rasterContinuity.checks.push({ scale, cameraX, pixels: 480, continuousOpaqueColor: true, rgbTolerance: 1, alpha: 255 });
  }
  setPaintedKharonSceneryImage('terrain', decodedImages.get('terrain'));
  const loader = { loadImage: url => loadImage(fileURLToPath(url)) };
  await Promise.all([loadPaintedWalkers(loader), loadPaintedCombat(loader), loadPaintedWorlds(loader),
    loadPaintedTransport(loader), loadPaintedFoundrySites(loader), loadPaintedSprites(loader)]);
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const names = Object.values(PAINTED_KHARON_SCENERY_LAYOUT).flatMap(atlas => Object.keys(atlas.frames));
    const board = createCanvas(1600, 1160), ctx = board.getContext('2d');
    ctx.fillStyle = '#24232c'; ctx.fillRect(0, 0, board.width, board.height);
    caption(ctx, 'KHARON · 10 cellules · diagnostic de matières et décors, hors gameplay', board.width);
    names.forEach((part, i) => {
      const col = i % 4, row = Math.floor(i / 4), x = col * 400, y = 50 + row * 360;
      const light = (col + row) % 2; ctx.fillStyle = light ? '#b5bcad' : '#37373f'; ctx.fillRect(x + 8, y + 8, 384, 344);
      ctx.fillStyle = light ? '#21343b' : '#e7d4ae'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(part, x + 200, y + 35);
      const frame = paintedKharonSceneryFrame(part), scale = Math.min(330 / frame.size[0], 250 / frame.size[1]);
      const [tx, ty, tw, th] = frame.target;
      const px = x + 200 - (tx + tw / 2) * scale, py = y + 200 - (ty + th / 2) * scale;
      assert.ok(drawPaintedKharonSceneryPart(ctx, { part, x: px, y: py, scale }));
    });
    save(board, 'kharon-scenery-contact-sheet.png', { type: 'Isolated source frame diagnostic on light and dark backgrounds' });

    for (const cameraX of [0, 512, 1800]) {
      const state = createGame({ missionId: 'MI13', walkerId: 'WK05', seed: 1510 }), before = JSON.stringify(state);
      const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), c = canvas.getContext('2d'), calls = track(c);
      renderer.cameraX = cameraX;
      renderer.drawBackground(state, 0); c.save(); c.translate(-cameraX, 0); renderer.drawTerrain(state, 0); c.restore();
      caption(c, `MI13 · diagnostic décor · caméra x=${cameraX} · terrainAt inchangé`, canvas.width);
      assert.equal(JSON.stringify(state), before); assert.ok(calls.terrain > 100 && calls.props > 0);
      save(canvas, `kharon-terrain-camera-${cameraX}.png`, { type: 'Initial game state, diagnostic camera only', cameraX, spriteDrawCalls: calls, stateSha256: sha(before) });
    }
    const foundry = createGame({ missionId: 'MI13', walkerId: 'WK09', difficulty: 'story', seed: 1510 });
    const cooling = state => state.foundry.bridges.some(bridge => bridge.circuitOpen && bridge.temperature < 65 && bridge.temperature > 33);
    pilotMI13(foundry, { stopAt: cooling }); assert.ok(cooling(foundry));
    const workshop = createGame({ missionId: 'MI14', walkerId: 'WK09', difficulty: 'story', seed: 1510 });
    const passage = state => state.campaign.picketCleared && state.workshop.workers.some(worker => worker.alive);
    pilotMI14(workshop, { stopAt: passage }); assert.ok(passage(workshop));
    for (const [state, file, description] of [
      [foundry, 'mi13-cold-ground-active-circuit.png', 'MI13: premier circuit réellement isolé, refroidissement en cours'],
      [workshop, 'mi14-workers-cleared-quarry.png', 'MI14: passage demandé, ouvriers réellement déplacés à la galerie'],
    ]) {
      const before = JSON.stringify(state), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), c = canvas.getContext('2d'), calls = track(c);
      renderer.render(state, { reducedMotion: true, shake: false });
      assert.equal(JSON.stringify(state), before); assert.ok(calls.terrain > 100 && calls.props > 0);
      caption(c, `${description} · rendu Canvas par commandes publiques`, canvas.width);
      save(canvas, file, { type: 'Public-input Canvas scene', description, missionId: state.missionId, elapsed: state.elapsed,
        cameraX: renderer.cameraX, spriteDrawCalls: calls, stateSha256: sha(before),
        thermalFacts: state.foundry ? state.foundry.bridges.map(b => ({ id: b.id, temperature: b.temperature, circuitOpen: b.circuitOpen, steamPhase: b.steam.phase })) : null,
        workerFacts: state.workshop ? state.workshop.workers.map(w => ({ id: w.id, alive: w.alive, phase: w.phase, x: w.x, y: w.y })) : null });
      writeFileSync(resolve(output, file.replace('.png', '-state.json')), JSON.stringify(structuredClone(state)) + '\n');
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  for (const source of sources) assert.equal(sha(readFileSync(resolve(root, source))), receipt.sourceHashes[source], `${source}: stable during reception`);
  receipt.completed = true; receipt.counts = { atlases: receipt.atlases.length, frames: receipt.frames.length, views: receipt.views.length };
  console.log(JSON.stringify({ completed: true, output, ...receipt.counts }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); }
