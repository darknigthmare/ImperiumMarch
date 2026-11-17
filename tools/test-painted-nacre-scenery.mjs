/** Decode source PNGs and receive Nacre shoreline in Canvas. No browser claim. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_NACRE_SCENERY_LAYOUT } from '../src/painted-nacre-scenery-layout.mjs';
import { loadPaintedNacreScenery, clearPaintedNacreScenery, paintedNacreSceneryStatus,
  paintedNacreSceneryFrame, drawPaintedNacreSceneryPart } from '../src/painted-nacre-scenery.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedNacre } from '../src/painted-nacre.mjs';
import { loadPaintedNacreSiteAssets } from '../src/painted-nacre-sites.mjs';
import { loadPaintedNacrePeople } from '../src/painted-nacre-people.mjs';
import { loadPaintedNacreCivilians } from '../src/painted-nacre-civilians.mjs';
import { loadPaintedWorlds } from '../src/painted-worlds.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI05 } from '../tests/helpers/mi05-driver.mjs';
import { pilotMI06 } from '../tests/helpers/mi06-driver.mjs';
import { pilotMI08 } from '../tests/helpers/mi08-driver.mjs';
import { beginCampaignMission, parseCampaign } from '../src/campaign.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-nacre-scenery-qa');
const require = createRequire(import.meta.url); let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) { if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Scenery reception requires @napi-rs/canvas', { cause }); api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = api, sha = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
const sources = ['src/painted-nacre-scenery.mjs', 'src/painted-nacre-scenery-layout.mjs', 'src/renderer.mjs',
  'assets/painted/nacre-scenery/manifest.json', 'assets/painted/nacre-scenery/prompts.json',
  'tools/index-painted-nacre-scenery.py', 'tools/test-painted-nacre-scenery.mjs', 'tests/painted-nacre-scenery.test.mjs',
  'src/painted-worlds.mjs', 'assets/painted/worlds/manifest.json',
  'src/simulation.mjs', 'tests/helpers/mi05-driver.mjs', 'tests/helpers/mi06-driver.mjs', 'tests/helpers/mi08-driver.mjs',
  'src/campaign.mjs', 'tests/fixtures/campaign-v7-mi07.json'];
const receipt = { version: '0.15.9', createdUtc: new Date().toISOString(), completed: false,
  type: 'Original PNG decoding, shoreline diagnostics and public-input Nacre Canvas scenes',
  browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [],
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  limitations: ['Diagnostic cameras reveal existing scenery; they do not claim that the player reached their position.',
    'Public-input scenes start through createGame and use only updateGame/commandGame; no simulation actor is teleported.',
    'Terrain textures and shoreline props introduce no collider, population, tide marker or mission state. FL06 remains decorative.',
    'No browser, audio, hardware performance, human test or complete campaign acceptance is inferred from Canvas.'] };
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/nacre-scenery/manifest.json')));
const prompts = JSON.parse(readFileSync(resolve(root, 'assets/painted/nacre-scenery/prompts.json')));
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
  clearPaintedNacreScenery();
  await loadPaintedNacreScenery({ loadImage: async (url, key) => {
    const bytes = readFileSync(fileURLToPath(url)), image = await loadImage(fileURLToPath(url)), atlas = PAINTED_NACRE_SCENERY_LAYOUT[key];
    const file = manifest.files.find(item => item.id === key);
    assert.equal(sha(bytes), file.sha256); assert.equal(sha(bytes), prompts.selectedOutputs.find(item => item.atlas === key).sha256);
    assert.deepEqual([image.width, image.height], atlas.size);
    const c = createCanvas(image.width, image.height).getContext('2d'); c.drawImage(image, 0, 0);
    const pixels = c.getImageData(0, 0, image.width, image.height).data;
    const alpha = (x, y) => pixels[(y * image.width + x) * 4 + 3]; let clear = 0;
    for (let i = 3; i < pixels.length; i += 4) if (!pixels[i]) clear++;
    assert.ok(clear / (image.width * image.height) > (key === 'terrain' ? .28 : .7));
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
    ids.set(image, key); receipt.atlases.push({ id: key, sha256: sha(bytes), bytes: bytes.length, dimensions: atlas.size, transparentPixels: clear });
    return image;
  } });
  assert.ok(Object.values(paintedNacreSceneryStatus()).every(status => status.state === 'ready'));
  assert.equal(receipt.frames.length, 10);
  const loader = { loadImage: url => loadImage(fileURLToPath(url)) };
  await Promise.all([loadPaintedWalkers(loader), loadPaintedCombat(loader), loadPaintedWorlds(loader),
    loadPaintedNacre(loader), loadPaintedNacreSiteAssets(loader), loadPaintedNacrePeople(loader), loadPaintedNacreCivilians(loader)]);
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const names = Object.values(PAINTED_NACRE_SCENERY_LAYOUT).flatMap(atlas => Object.keys(atlas.frames));
    const board = createCanvas(1600, 1160), ctx = board.getContext('2d');
    ctx.fillStyle = '#142930'; ctx.fillRect(0, 0, board.width, board.height);
    caption(ctx, 'NACRE · 10 cellules · diagnostic de matières et décors, hors gameplay', board.width);
    names.forEach((part, i) => {
      const col = i % 4, row = Math.floor(i / 4), x = col * 400, y = 50 + row * 360;
      const light = (col + row) % 2; ctx.fillStyle = light ? '#b5bcad' : '#30454b'; ctx.fillRect(x + 8, y + 8, 384, 344);
      ctx.fillStyle = light ? '#21343b' : '#e7d4ae'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(part, x + 200, y + 35);
      const frame = paintedNacreSceneryFrame(part), scale = Math.min(330 / frame.size[0], 250 / frame.size[1]);
      const [tx, ty, tw, th] = frame.target;
      const px = x + 200 - (tx + tw / 2) * scale, py = y + 200 - (ty + th / 2) * scale;
      assert.ok(drawPaintedNacreSceneryPart(ctx, { part, x: px, y: py, scale }));
    });
    save(board, 'nacre-scenery-contact-sheet.png', { type: 'Isolated source frame diagnostic on light and dark backgrounds' });

    for (const cameraX of [0, 512, 1800]) {
      const state = createGame({ missionId: 'MI05', walkerId: 'WK05', seed: 1599 }), before = JSON.stringify(state);
      const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), c = canvas.getContext('2d'), calls = track(c);
      renderer.cameraX = cameraX;
      renderer.drawBackground(state, 0); c.save(); c.translate(-cameraX, 0); renderer.drawTerrain(state, 0); c.restore();
      caption(c, `MI05 · diagnostic décor · caméra x=${cameraX} · terrainAt inchangé`, canvas.width);
      assert.equal(JSON.stringify(state), before); assert.ok(calls.terrain > 100 && calls.props > 0);
      save(canvas, `nacre-terrain-camera-${cameraX}.png`, { type: 'Initial game state, diagnostic camera only', cameraX, spriteDrawCalls: calls, stateSha256: sha(before) });
    }
    const channel = createGame({ missionId: 'MI05', walkerId: 'WK05', difficulty: 'story', seed: 1599 });
    const bridgeReady = state => state.channel.banks.some(bank => bank.bridgeRaised);
    pilotMI05(channel, { stopAt: bridgeReady }); assert.ok(bridgeReady(channel));
    const dike = createGame({ missionId: 'MI06', walkerId: 'WK09', seed: 1599,
      campaignContext: { fuelAvailable: 2, channelOpen: true, refugeesPassed: 12, refugeesLost: 0, smugglerVerified: true, bargeCiviliansLost: 0 } });
    const evacuation = state => state.campaign.evacuationOrdered && state.dike.residents.some(person => person.phase === 'evacuating');
    pilotMI06(dike, { stopAt: evacuation }); assert.ok(evacuation(dike));
    const historical = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v7-mi07.json')));
    const departure = beginCampaignMission(parseCampaign(JSON.stringify(historical.completed)), { missionId: 'MI08', walkerId: 'WK09', seed: 1599 }).game;
    const agreements = state => state.departure.boarding.progress > .55 && !state.departure.boarding.assigned;
    pilotMI08(departure, { stopAt: agreements }); assert.ok(agreements(departure));
    const operation = createGame({ missionId: 'op02', walkerId: 'WK05', difficulty: 'story', seed: 1599 });
    for (let i = 0; i < 180 && operation.status === 'playing'; i++) updateGame(operation, 1 / 60, { move: 1 });
    for (const [state, file, description] of [[channel, 'mi05-first-bridge-raised.png', 'MI05: premier pont réellement relevé'],
      [dike, 'mi06-residents-on-nacre-shore.png', 'MI06: appel et évacuation réellement commencés'],
      [departure, 'mi08-nacre-quay.png', 'MI08: groupes au quai depuis la fixture historique MI07'],
      [operation, 'op02-nacre-terrain.png', 'OP02: simulation indépendante après 180 commandes de marche']]) {
      const before = JSON.stringify(state), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), c = canvas.getContext('2d'), calls = track(c);
      renderer.render(state, { reducedMotion: true, shake: false });
      assert.equal(JSON.stringify(state), before); assert.ok(calls.terrain > 100 && calls.props > 0);
      caption(c, `${description} · rendu Canvas par commandes publiques`, canvas.width);
      save(canvas, file, { type: 'Public-input Canvas scene', description, missionId: state.missionId, elapsed: state.elapsed,
        cameraX: renderer.cameraX, spriteDrawCalls: calls, stateSha256: sha(before) });
      writeFileSync(resolve(output, file.replace('.png', '-state.json')), JSON.stringify(structuredClone(state)) + '\n');
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  for (const source of sources) assert.equal(sha(readFileSync(resolve(root, source))), receipt.sourceHashes[source], `${source}: stable during reception`);
  receipt.completed = true; receipt.counts = { atlases: receipt.atlases.length, frames: receipt.frames.length, views: receipt.views.length };
  console.log(JSON.stringify({ completed: true, output, ...receipt.counts }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); }
