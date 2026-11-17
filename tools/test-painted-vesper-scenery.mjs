/** Decode source PNGs and receive Vesper scenery in Canvas. No browser claim. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_VESPER_SCENERY_LAYOUT } from '../src/painted-vesper-scenery-layout.mjs';
import { loadPaintedVesperScenery, clearPaintedVesperScenery, paintedVesperSceneryStatus,
  paintedVesperSceneryFrame, drawPaintedVesperSceneryPart } from '../src/painted-vesper-scenery.mjs';
import { loadPaintedVesper } from '../src/painted-vesper.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedTransport } from '../src/painted-transport.mjs';
import { loadPaintedWorlds } from '../src/painted-worlds.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI02 } from '../tests/helpers/mi02-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'docs/validation/painted-vesper-scenery-v0158');
const require = createRequire(import.meta.url); let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) { if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Scenery reception requires @napi-rs/canvas', { cause }); api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = api, sha = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
const sources = ['src/painted-vesper-scenery.mjs', 'src/painted-vesper-scenery-layout.mjs', 'src/renderer.mjs',
  'assets/painted/vesper-scenery/manifest.json', 'assets/painted/vesper-scenery/prompts.json',
  'tools/index-painted-vesper-scenery.py', 'tools/test-painted-vesper-scenery.mjs', 'tests/painted-vesper-scenery.test.mjs',
  'src/painted-worlds.mjs', 'assets/painted/worlds/manifest.json',
  'src/simulation.mjs', 'tests/helpers/mi02-driver.mjs'];
const receipt = { version: '0.15.8', createdUtc: new Date().toISOString(), completed: false,
  type: 'Original PNG decoding, scenery diagnostics and public-input Vesper Canvas scenes',
  browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [],
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  limitations: ['Diagnostic cameras reveal existing scenery; they do not claim that the player reached their position.',
    'Public-input scenes start through createGame and use only updateGame/commandGame; no simulation actor is teleported.',
    'Terrain textures, ground props and viaduct pieces introduce no collider, population or mission state.',
    'No browser, audio, hardware performance, human test or complete campaign acceptance is inferred from Canvas.'] };
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/vesper-scenery/manifest.json')));
const prompts = JSON.parse(readFileSync(resolve(root, 'assets/painted/vesper-scenery/prompts.json')));
const ids = new WeakMap();
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
  ctx.fillStyle = '#12262ce8'; ctx.fillRect(0, 0, width, 39);
  ctx.fillStyle = '#e3d5b5'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(text, 20, 26, width - 40);
}
try {
  clearPaintedVesperScenery();
  await loadPaintedVesperScenery({ loadImage: async (url, key) => {
    const bytes = readFileSync(fileURLToPath(url)), image = await loadImage(fileURLToPath(url)), atlas = PAINTED_VESPER_SCENERY_LAYOUT[key];
    const file = manifest.files.find(item => item.id === key);
    assert.equal(sha(bytes), file.sha256); assert.equal(sha(bytes), prompts.selectedOutputs.find(item => item.atlas === key).sha256);
    assert.deepEqual([image.width, image.height], atlas.size);
    const c = createCanvas(image.width, image.height).getContext('2d'); c.drawImage(image, 0, 0);
    const pixels = c.getImageData(0, 0, image.width, image.height).data;
    const alpha = (x, y) => pixels[(y * image.width + x) * 4 + 3]; let clear = 0;
    for (let i = 3; i < pixels.length; i += 4) if (!pixels[i]) clear++;
    assert.ok(clear / (image.width * image.height) > (key === 'terrain' ? .3 : .7));
    const solidIn = ([x, y, w, h]) => { let n = 0; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (alpha(xx, yy) >= 32) n++; return n; };
    for (const [name, frame] of Object.entries(atlas.frames)) {
      const [x, y, w, h] = frame.cell;
      for (let dx = 0; dx < w; dx++) for (const dy of [0, 1, h - 2, h - 1]) assert.ok(alpha(x + dx, y + dy) <= 2, `${key}/${name}: row gutter`);
      for (let dy = 0; dy < h; dy++) for (const dx of [0, 1, w - 2, w - 1]) assert.ok(alpha(x + dx, y + dy) <= 2, `${key}/${name}: column gutter`);
      const solidPixels = solidIn(frame.source); assert.ok(solidPixels > 1000); assert.equal(solidPixels, solidIn(frame.cell), `${name}: cropped visible pixels`);
      receipt.frames.push({ atlas: key, name, source: frame.source, target: frame.target, solidPixels });
    }
    ids.set(image, key); receipt.atlases.push({ id: key, sha256: sha(bytes), bytes: bytes.length, dimensions: atlas.size, transparentPixels: clear });
    return image;
  } });
  assert.ok(Object.values(paintedVesperSceneryStatus()).every(status => status.state === 'ready'));
  assert.equal(receipt.frames.length, 16);
  const loader = { loadImage: url => loadImage(fileURLToPath(url)) };
  await Promise.all([loadPaintedVesper(loader), loadPaintedWalkers(loader), loadPaintedCombat(loader), loadPaintedTransport(loader), loadPaintedWorlds(loader)]);
  const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const names = Object.values(PAINTED_VESPER_SCENERY_LAYOUT).flatMap(atlas => Object.keys(atlas.frames));
    const board = createCanvas(1600, 1500), ctx = board.getContext('2d');
    ctx.fillStyle = '#142930'; ctx.fillRect(0, 0, board.width, board.height);
    caption(ctx, 'VESPER · 16 cellules · diagnostic de sprites, hors gameplay', board.width);
    names.forEach((part, i) => {
      const col = i % 4, row = Math.floor(i / 4), x = col * 400, y = 50 + row * 360;
      const light = (col + row) % 2; ctx.fillStyle = light ? '#b5bcad' : '#30454b'; ctx.fillRect(x + 8, y + 8, 384, 344);
      ctx.fillStyle = light ? '#21343b' : '#e7d4ae'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(part, x + 200, y + 35);
      const frame = paintedVesperSceneryFrame(part), scale = Math.min(330 / frame.size[0], 250 / frame.size[1]);
      const [tx, ty, tw, th] = frame.target;
      const px = x + 200 - (tx + tw / 2) * scale, py = y + 200 - (ty + th / 2) * scale;
      assert.ok(drawPaintedVesperSceneryPart(ctx, { part, x: px, y: py, scale }));
    });
    save(board, 'scenery-contact-sheet.png', { type: 'Isolated source frame diagnostic' });

    for (const cameraX of [0, 512, 1800]) {
      const state = createGame({ missionId: 'MI01', walkerId: 'WK01', seed: 1588 }), before = JSON.stringify(state);
      const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), c = canvas.getContext('2d'), calls = track(c);
      renderer.cameraX = cameraX; renderer.panorama = panorama; renderer.panoramaReady = true;
      renderer.drawBackground(state, 0); c.save(); c.translate(-cameraX, 0); renderer.drawTerrain(state, 0); c.restore();
      caption(c, `MI01 · diagnostic décor · caméra x=${cameraX} · terrainAt inchangé`, canvas.width);
      assert.equal(JSON.stringify(state), before); assert.ok(calls.terrain > 100 && calls.props > 0);
      save(canvas, `terrain-camera-${cameraX}.png`, { type: 'Initial game state, diagnostic camera only', cameraX, spriteDrawCalls: calls, stateSha256: sha(before) });
    }
    const railState = createGame({ missionId: 'MI02', walkerId: 'WK01', difficulty: 'story', seed: 1588 });
    {
      const before = JSON.stringify(railState), canvas = createCanvas(1600, 900), c = canvas.getContext('2d'), renderer = new Renderer(canvas), calls = track(c);
      renderer.cameraX = railState.train.breakX - 800; renderer.panorama = panorama; renderer.panoramaReady = true;
      renderer.drawBackground(railState, 0); c.save(); c.translate(-renderer.cameraX, 0); renderer.drawRailViaduct(railState, 0); c.restore();
      caption(c, 'MI02 · diagnostic de la rupture · voie rompue et passerelle conservées', canvas.width);
      assert.equal(JSON.stringify(railState), before); assert.ok(calls.viaduct > 100);
      save(canvas, 'viaduct-break-diagnostic.png', { type: 'Initial game state, diagnostic camera only', cameraX: renderer.cameraX, spriteDrawCalls: calls, stateSha256: sha(before) });
    }
    const live = createGame({ missionId: 'MI01', walkerId: 'WK01', difficulty: 'story', seed: 1588 });
    for (let i = 0; i < 180 && live.status === 'playing'; i++) updateGame(live, 1 / 60, { move: 1 });
    const reachedRailStop = state => state.train.stopped;
    pilotMI02(railState, { stopAt: reachedRailStop }); assert.ok(reachedRailStop(railState), 'Public pilot reaches a real train stop');
    for (const [state, file, description] of [[live, 'mi01-public-walk.png', 'MI01 after 180 public movement ticks'], [railState, 'mi02-public-train-stop.png', 'MI02 train stopped through public controls']]) {
      const before = JSON.stringify(state), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), c = canvas.getContext('2d'), calls = track(c);
      renderer.panorama = panorama; renderer.panoramaReady = true; renderer.render(state, { reducedMotion: true });
      assert.equal(JSON.stringify(state), before); caption(c, `${description} · rendu Canvas`, canvas.width);
      save(canvas, file, { type: 'Public-input Canvas scene', description, elapsed: state.elapsed, cameraX: renderer.cameraX, spriteDrawCalls: calls, stateSha256: sha(before) });
      writeFileSync(resolve(output, file.replace('.png', '-checkpoint.json')), JSON.stringify(structuredClone(state)) + '\n');
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  receipt.completed = true; receipt.counts = { atlases: receipt.atlases.length, frames: receipt.frames.length, views: receipt.views.length };
  console.log(JSON.stringify({ completed: true, output, ...receipt.counts }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); }
