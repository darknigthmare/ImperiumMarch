/** Actual decoding and Canvas reception of the Thyr originals. The images
 * produced here are diagnostic renders, not browser captures or playtests. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_THYR_LAYOUT } from '../src/painted-thyr-layout.mjs';
import { PAINTED_THYR_URLS, clearPaintedThyr, loadPaintedThyr, paintedThyrStatus,
  paintedThyrFrame, paintedThyrPartFrame, paintedThyrFaunaFrame, drawPaintedThyrPart, drawPaintedThyrFauna } from '../src/painted-thyr.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedSprites } from '../src/painted-sprites.mjs';
import { Renderer } from '../src/renderer.mjs';
import { ENEMY_TYPES } from '../src/content.mjs';
import { createGame, updateGame, livingRouteSurfaceAt } from '../src/simulation.mjs';
import { pilotMI09 } from '../tests/helpers/mi09-driver.mjs';
import { pilotMI11 } from '../tests/helpers/mi11-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-thyr-qa');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Actual PNG reception requires @napi-rs/canvas.', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage, GlobalFonts } = api;
const fontFiles = [
  ['/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New'],
  ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'ODC Sans'],
];
for (const [path, family] of fontFiles) if (existsSync(path)) GlobalFonts.registerFromPath(path, family);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const decoded = {}, pixels = {}, atlasIds = new WeakMap();
const sourcePaths = ['src/painted-thyr.mjs', 'src/painted-thyr-layout.mjs', 'src/thyr-renderer.mjs',
  'src/voice-renderer.mjs', 'src/thyr-assets.mjs', 'src/voice-assets.mjs', 'src/renderer.mjs', 'tools/test-painted-thyr.mjs'];
const receipt = { createdUtc: new Date().toISOString(), version: JSON.parse(readFileSync(resolve(root, 'package.json'))).version,
  type: 'Actual original PNG decoding and Thyr Canvas rendering', completed: false,
  browserExecuted: false, humanPlaytestPerformed: false, canvasFonts: fontFiles.filter(([path]) => existsSync(path)),
  sourceHashes: Object.fromEntries(sourcePaths.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  atlases: [], frames: [], views: [],
  limitations: ['PNG decoding, source bounds, state selection and Canvas inspection do not certify browser UI, audio, artistic approval or final animation quality.',
    'The state boards explicitly exercise existing graphical states on diagnostic inputs. They do not report completed missions, new deaths or acquired consent.',
    'The Guetteur-racine dead cell, separate Leth tools and flattened grass remain reference images. No persistent corpse, extra character or new flora rule is created.'] };
mkdirSync(output, { recursive: true });

function occupied(data, width, [x, y, w, h], threshold = 128) {
  let count = 0;
  for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) if (data[(row * width + col) * 4 + 3] > threshold) count++;
  return count;
}
function saveView(canvas, name, details) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, name), bytes);
  receipt.views.push({ file: name, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...details });
}
function trackImages(ctx) {
  const calls = [], original = ctx.drawImage;
  ctx.drawImage = function(...args) {
    const atlas = atlasIds.get(args[0]);
    if (atlas) {
      const frame = Object.entries(PAINTED_THYR_LAYOUT[atlas].frames).find(([, item]) => item.source.every((value, i) => value === args[i + 1]))?.[0];
      calls.push({ atlas, frame });
    }
    return original.apply(ctx, args);
  };
  return calls;
}
function backdrop(ctx, width, height) { ctx.fillStyle = '#142b28'; ctx.fillRect(0, 0, width, height); }
function panel(ctx, x, y, w, h, light) { ctx.fillStyle = light ? '#d6d5bf' : '#263f38'; ctx.fillRect(x + 8, y + 8, w - 16, h - 16); }
function caption(ctx, title, detail, x, y, light = false) {
  ctx.save(); ctx.fillStyle = light ? '#263d33' : '#e2e3c4'; ctx.font = 'bold 21px "ODC Sans", sans-serif'; ctx.textAlign = 'left';
  ctx.fillText(title, x + 25, y + 40); ctx.font = '14px "ODC Sans", sans-serif'; ctx.fillText(detail, x + 25, y + 65); ctx.restore();
}

try {
  clearPaintedThyr();
  await loadPaintedThyr({ loadImage: async (url, key) => {
    const path = fileURLToPath(url), bytes = readFileSync(path), picture = await loadImage(path);
    const canvas = createCanvas(picture.width, picture.height), ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
    const rgba = ctx.getImageData(0, 0, picture.width, picture.height).data;
    let clear = 0, solid = 0;
    for (let i = 3; i < rgba.length; i += 4) { if (rgba[i] === 0) clear++; if (rgba[i] > 128) solid++; }
    assert.ok(clear > picture.width * picture.height * .05, `${key}: genuine transparent background`);
    assert.ok(solid > 1000, `${key}: solid artwork`);
    decoded[key] = picture; pixels[key] = rgba; atlasIds.set(picture, key);
    receipt.atlases.push({ key, path: path.slice(root.length + 1), width: picture.width, height: picture.height,
      bytes: bytes.length, sha256: sha(bytes), fullyTransparentPixels: clear, solidPixels: solid });
    return picture;
  } });
  assert.equal(Object.keys(decoded).length, 8);
  assert.ok(Object.values(paintedThyrStatus()).every(status => status.state === 'ready'));
  for (const [key, atlas] of Object.entries(PAINTED_THYR_LAYOUT)) {
    const picture = decoded[key]; assert.ok(picture, `${key}: decoded image`);
    const grid = atlas.grid || (key === 'rootwatcher' ? [4, 3] : ['column', 'habitat', 'fan-colony'].includes(key) ? [3, 2] : [4, 2]);
    for (const [name, item] of Object.entries(atlas.frames)) {
      const frame = paintedThyrFrame(key, name); assert.ok(frame, `${key}/${name}: valid bounds`);
      const [x, y, w, h] = frame.source;
      assert.ok(frame.source.every(Number.isInteger), `${key}/${name}: whole source pixels`);
      const col = Math.floor((x + w / 2) / picture.width * grid[0]), row = Math.floor((y + h / 2) / picture.height * grid[1]);
      // The original habitat atlas has a tall home row and a shallow root row;
      // authored per-frame cells take precedence over an equal-grid estimate.
      const cell = item.cell || [Math.round(col * picture.width / grid[0]), Math.round(row * picture.height / grid[1]),
        Math.round((col + 1) * picture.width / grid[0]) - Math.round(col * picture.width / grid[0]),
        Math.round((row + 1) * picture.height / grid[1]) - Math.round(row * picture.height / grid[1])];
      const [left, top, cellWidth, cellHeight] = cell, right = left + cellWidth, bottom = top + cellHeight;
      assert.ok(x >= left && y >= top && x + w <= right && y + h <= bottom, `${key}/${name}: no neighbouring cell`);
      const cropInk = occupied(pixels[key], picture.width, frame.source), cellInk = occupied(pixels[key], picture.width, [left, top, right - left, bottom - top]);
      assert.ok(cropInk > 20, `${key}/${name}: nonempty image`);
      assert.ok(cellInk - cropInk < Math.max(50, cellInk * .01), `${key}/${name}: significant art outside crop`);
      receipt.frames.push({ atlas: key, frame: name, source: frame.source, target: frame.target,
        occupiedPixels: cropInk, usage: item.usage || 'runtime' });
    }
  }
  assert.equal(receipt.frames.length, 62);

  // Readability board: each part uses the same function and nominal transform
  // as the live scene, displayed at a documented comparison scale.
  const pieces = [
    ['column', 'Colonne-mère · FL07', .85], ['suspended-home', 'Habitat suspendu · PL03', 2], ['root', 'Racine porteuse · FL07', 1.4],
    ['longuedorse-adult', 'Longue-dorse adulte · FU07', 2.5], ['longuedorse-young', 'Longue-dorse jeune · FU07', 3], ['fan-colony', 'Colonie d’éventails · FU08', 2.4],
    ['breathing-vine', 'Vigne respirante · FL08', 2], ['echo-grass', 'Herbe à écho · FL09', 3], ['leth-interpreter', 'Leth · PN06', 2.3],
  ];
  const bench = createCanvas(1800, 1680), ctx = bench.getContext('2d'); backdrop(ctx, bench.width, bench.height);
  const calls = trackImages(ctx), labels = [];
  for (const [i, [part, title, scale]] of pieces.entries()) {
    const x = i % 3 * 600, y = Math.floor(i / 3) * 560, light = i % 2 === 1;
    panel(ctx, x, y, 600, 560, light);
    ctx.strokeStyle = light ? '#71836a' : '#799176'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 35, y + 490); ctx.lineTo(x + 565, y + 490); ctx.stroke();
    assert.ok(drawPaintedThyrPart(ctx, { part, x: x + 300, y: y + 490, scale, reducedMotion: true }));
    labels.push([title, `Rendu intégré · repère au sol · échelle × ${scale}`, x, y, light]);
  }
  for (const args of labels) caption(ctx, ...args);
  saveView(bench, 'thyr-readability.png', { type: 'Isolated normal part renderers, not a gameplay screenshot', imageCalls: calls });

  // States are diagnostic inputs, never an invented campaign receipt.
  const cases = [
    ...['waiting', 'moving', 'arrived', 'diverted', 'dead'].map(state => ({ part: 'longuedorse-adult', state, label: `FU07 adulte · ${state}`, scale: 1.8 })),
    ...['settled', 'dispersed', 'lost'].map(state => ({ part: 'fan-colony', state, label: `FU08 · ${state}`, scale: 1.55 })),
    ...['waiting', 'listening', 'speaking', 'refusing', 'lost'].map(state => ({ part: 'leth-interpreter', state, label: `PN06 · ${state}`, scale: 1.45 })),
    ...['normal', 'damaged', 'destroyed'].map(state => ({ part: 'suspended-home', state, label: `Habitat · ${state}`, scale: 1.35 })),
    ...['normal', 'damaged', 'destroyed'].map(state => ({ part: 'root', state, label: `Racine · ${state}`, scale: 1 })),
    ...['normal', 'wilted', 'burnt'].map(state => ({ part: 'breathing-vine', state, label: `Vigne · ${state}`, scale: 1.4 })),
    ...['calm', 'moving'].map(state => ({ part: 'echo-grass', state, label: `Herbe · ${state}`, scale: 2 })),
  ];
  const stateBoard = createCanvas(1600, Math.ceil(cases.length / 4) * 320), stateCtx = stateBoard.getContext('2d'); backdrop(stateCtx, stateBoard.width, stateBoard.height);
  const stateCalls = trackImages(stateCtx);
  for (const [i, item] of cases.entries()) {
    const x = i % 4 * 400, y = Math.floor(i / 4) * 320, light = i % 2 === 1;
    panel(stateCtx, x, y, 400, 320, light);
    assert.ok(drawPaintedThyrPart(stateCtx, { ...item, x: x + 200, y: y + 289, progress: .3, time: .75 }));
    caption(stateCtx, item.label, 'État graphique imposé pour inspection', x, y, light);
  }
  saveView(stateBoard, 'thyr-state-grid.png', { type: 'Diagnostic state board; states imposed only on drawing inputs', imageCalls: stateCalls });

  const fauna = createCanvas(1600, 720), faunaCtx = fauna.getContext('2d'); backdrop(faunaCtx, fauna.width, fauna.height);
  const faunaCalls = trackImages(faunaCtx);
  for (const [i, [facing, phase, telegraph]] of [[1, 'idle', 0], [-1, 'idle', 0], [1, 'attack', .3], [-1, 'attack', .95]].entries()) {
    const x = i % 2 * 800, y = Math.floor(i / 2) * 360, light = i % 2 === 1;
    panel(faunaCtx, x, y, 800, 360, light);
    faunaCtx.save(); faunaCtx.translate(x + 400, y + 225); faunaCtx.scale(6, 6);
    const enemy = { ...ENEMY_TYPES.fauna, type: 'fauna', x: 0, y: 0, hp: 100, active: true, facing, phase, telegraph };
    assert.ok(drawPaintedThyrFauna(faunaCtx, enemy, { time: 0, reducedMotion: true })); faunaCtx.restore();
    caption(faunaCtx, `GUETTEUR-RACINE · ${phase === 'idle' ? 'attente' : telegraph < .8 ? 'préparation' : 'attaque'}`, `FU09 · ${facing === 1 ? 'droite' : 'gauche'} · échelle × 6 · corps inchangé`, x, y, light);
  }
  saveView(fauna, 'rootwatcher-readability.png', { type: 'Diagnostic predator poses with unchanged simulation body', imageCalls: faunaCalls });

  // Render actual prepared game states with public movement inputs. No beings,
  // positions, mission outcomes or resources are inserted for the capture.
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const loader = url => loadImage(fileURLToPath(url));
    await Promise.all([loadPaintedCombat({ loadImage: loader }), loadPaintedWalkers({ loadImage: loader }), loadPaintedSprites({ loadImage: loader })]);
    const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
    for (const [missionId, view] of [['MI09', 'supports'], ['MI09', 'migration'], ['MI11', 'exchange'], ['op03', 'fauna']]) {
      const s = createGame({ missionId, walkerId: 'WK01', difficulty: 'story', seed: 1554 });
      let executed = 0;
      const observe = state => {
        executed++;
        for (const animal of state.livingRoute?.migrators || []) paintedThyrPartFrame({ part: `longuedorse-${animal.age}`,
          state: animal.destroyed ? 'dead' : animal.moving ? 'moving' : 'waiting', entity: animal, time: state.elapsed });
        for (const enemy of state.enemies) if (enemy.type === 'fauna') paintedThyrFaunaFrame(enemy, { time: state.elapsed });
      };
      if (view === 'supports') {
        pilotMI09(s, { maxFrames: 20000, observe, stopAt: state => state.livingRoute.approach.prepared && state.player.feet.some(foot =>
          foot.contact && livingRouteSurfaceAt(state, foot.x).rise > 0 && Math.abs(foot.y - livingRouteSurfaceAt(state, foot.x).groundY) < .001) });
        assert.ok(s.player.feet.some(foot => foot.contact && livingRouteSurfaceAt(s, foot.x).rise > 0), 'Support capture must contain a true root contact');
      } else if (missionId === 'MI09') {
        pilotMI09(s, { maxFrames: 20000, observe, stopAt: state => state.livingRoute.migrators.some(animal => animal.moving && animal.x > 2020) });
        assert.ok(s.livingRoute.migrators.some(animal => animal.moving), 'MI09 capture must reach an actual migration');
      } else if (missionId === 'MI11') {
        pilotMI11(s, { maxFrames: 20000, observe, stopAt: state => state.voice.leth.working && state.voice.leth.work === 'testimony' && state.voice.leth.progress > .3 });
        assert.ok(s.voice.leth.consent && s.voice.leth.working && s.voice.leth.work === 'testimony', 'MI11 capture must reach a consented live exchange');
      } else {
        while (executed < 2400 && s.status === 'playing') {
          if (executed && s.enemies.some(enemy => enemy.type === 'fauna' && !enemy.dead && enemy.active && Math.abs(enemy.x - s.player.x) < 400)) break;
          updateGame(s, 1 / 60, { move: 1 }); observe(s);
        }
      }
      const canvas = createCanvas(1600, 900), live = new Renderer(canvas); live.panorama = panorama; live.panoramaReady = true;
      const sceneCalls = trackImages(canvas.getContext('2d')), before = JSON.stringify(s);
      live.render(s, { reducedMotion: false, shake: false }); assert.equal(JSON.stringify(s), before, `${missionId}: rendering changed the scene`);
      if (view === 'migration') assert.ok(sceneCalls.some(call => call.atlas.startsWith('longuedorse') && call.frame.startsWith('walk-')), 'Live migration must draw a measured walk pose');
      if (missionId === 'MI11') assert.ok(sceneCalls.some(call => call.atlas === 'leth' && call.frame.startsWith('speaking-')), 'Live testimony must draw Leth speaking');
      if (missionId === 'op03') assert.ok(sceneCalls.some(call => call.atlas === 'rootwatcher'), 'Live operation must draw the existing predator');
      saveView(canvas, `scene-${missionId.toLowerCase()}${view === 'supports' ? '-supports' : ''}.png`, { type: 'Normal Canvas scene prepared through public simulation commands', missionId, scenario: view,
        publicTicks: executed, elapsed: s.elapsed, status: s.status, playerX: s.player.x, stateSha256: sha(before), imageCalls: sceneCalls });
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  receipt.completed = true;
  receipt.counts = { atlases: receipt.atlases.length, cells: receipt.frames.length,
    runtimeCells: receipt.frames.filter(frame => frame.usage !== 'reference').length,
    referenceCells: receipt.frames.filter(frame => frame.usage === 'reference').length, views: receipt.views.length };
  console.log(JSON.stringify({ output, completed: true, ...receipt.counts }));
} catch (error) {
  receipt.error = error.stack || String(error); throw error;
} finally {
  writeFileSync(resolve(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
