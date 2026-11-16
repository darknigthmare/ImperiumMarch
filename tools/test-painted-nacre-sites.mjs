/** Decode real immutable PNGs and receive diagnostic Canvas views, never a browser/human test. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_NACRE_SITE_LAYOUT } from '../src/painted-nacre-sites-layout.mjs';
import { loadPaintedNacreSiteAssets, clearPaintedNacreSites, paintedNacreSiteAssetSnapshot, paintedNacreSiteFrame } from '../src/painted-nacre-sites.mjs';
import { loadPaintedNacre } from '../src/painted-nacre.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { Renderer } from '../src/renderer.mjs';
import { createGame, updateGame, terrainAt, departureGateBounds } from '../src/simulation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'docs/validation/painted-nacre-sites-v0156');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); }
catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = api;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
const receipt = { version: '0.15.6', date: new Date().toISOString(), completed: false,
  type: 'Actual PNG decoding, original integrity, measured anchors and diagnostic Canvas renderer views',
  browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [],
  sources: Object.fromEntries(['src/painted-nacre-sites.mjs', 'src/painted-nacre-sites-layout.mjs', 'src/renderer.mjs', 'src/simulation.mjs',
    'tools/index-painted-nacre-sites.py', 'tools/test-painted-nacre-sites.mjs', 'tests/painted-nacre-sites.test.mjs']
    .map(path => [path, hash(readFileSync(resolve(root, path)))])),
  limitations: ['Camera-focused scenes use ordinary renderer calls after 120 public update ticks, not complete mission walkthroughs.',
    'Damage, high water, controls, gate openings and prepared ramps in labelled diagnostic panels are imposed on independent copies.',
    'No occupants are painted into houses, refuges or vessels. Actual people and their arrival/loss conditions remain simulated.',
    'Water, the .65 house threshold, tide instruments, support struts, cables and status signals remain code-driven.',
    'Destroyed MI08 ramps retain the existing vector fallback; no invented destroyed-ramp cell exists.',
    'No browser execution or human recognition/readability criterion is claimed by this receipt.'] };
const decoded = {};
function countPixels(data, width, rectangle, threshold = 128) {
  const [x, y, w, h] = rectangle; let count = 0;
  for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) if (data[(row * width + col) * 4 + 3] > threshold) count++;
  return count;
}
function save(canvas, file, info) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  receipt.views.push({ file, sha256: hash(bytes), ...info });
}
function game(missionId) { return createGame({ missionId, walkerId: 'WK02', difficulty: 'story', seed: 1566 }); }
function panel(ctx, rectangle, title, dark = true) {
  const [x, y, w, h] = rectangle;
  ctx.fillStyle = dark ? '#284950' : '#c0c9b8'; ctx.fillRect(x + 7, y + 7, w - 14, h - 14);
  ctx.fillStyle = dark ? '#dddcc0' : '#24434a'; ctx.font = 'bold 17px sans-serif'; ctx.fillText(title, x + 23, y + 32);
  ctx.font = '12px sans-serif'; ctx.fillText('Diagnostic Canvas · états imposés sur une copie', x + 23, y + 52);
}
function drawFocused(canvas, rect, s, { targetX, groundY, scale = 2, visibleX = targetX, method, time = 4 }) {
  const c = canvas.getContext('2d'), [x, y, w, h] = rect, renderer = new Renderer(canvas);
  renderer.combatReducedMotion = true; renderer.cameraX = targetX - 800; renderer.visible = value => Math.abs(value - visibleX) < 1;
  c.save(); c.beginPath(); c.rect(x + 8, y + 65, w - 16, h - 73); c.clip();
  c.translate(x + w / 2, y + h - 40); c.scale(scale, scale); c.translate(-targetX, -groundY);
  const saved = JSON.stringify(s); renderer[method](s, time); assert.equal(JSON.stringify(s), saved, `${method}: world mutation`);
  c.restore();
}
try {
  clearPaintedNacreSites();
  const promptSet = JSON.parse(readFileSync(resolve(root, 'assets/painted/nacre-sites/prompts.json')));
  await loadPaintedNacreSiteAssets({ loadImage: async (url, key) => {
    const path = fileURLToPath(url), bytes = readFileSync(path), picture = await loadImage(path), layout = PAINTED_NACRE_SITE_LAYOUT[key];
    assert.equal(hash(bytes), layout.sha256, `${key}: immutable selected image`);
    const original = promptSet.images.find(item => item.key === key)?.source;
    if (original && existsSync(original)) assert.equal(hash(readFileSync(original)), hash(bytes), `${key}: generator original byte-for-byte`);
    const canvas = createCanvas(picture.width, picture.height), ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
    const pixels = ctx.getImageData(0, 0, picture.width, picture.height).data;
    let clear = 0; for (let i = 3; i < pixels.length; i += 4) if (pixels[i] === 0) clear++;
    assert.ok(clear > picture.width * picture.height * .35, `${key}: true empty alpha, not an opaque veil`);
    receipt.atlases.push({ key, path: path.slice(root.length + 1), bytes: bytes.length, size: [picture.width, picture.height], sha256: hash(bytes), clearPixels: clear });
    for (const name of Object.keys(layout.frames)) {
      const frame = paintedNacreSiteFrame(key, name), [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
      assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch, `${key}/${name}: crop crosses neighbour`);
      const count = countPixels(pixels, picture.width, frame.source), cellCount = countPixels(pixels, picture.width, frame.cell);
      assert.ok(count > 100 && cellCount - count < Math.max(30, cellCount * .002), `${key}/${name}: clipped silhouette`);
      for (const anchor of Object.values(frame.anchors)) {
        assert.ok(Math.abs(frame.target[0] + (anchor.source[0] - x) / w * frame.target[2] - anchor.world[0]) < .00001);
        assert.ok(Math.abs(frame.target[1] + (anchor.source[1] - y) / h * frame.target[3] - anchor.world[1]) < .00001);
      }
      receipt.frames.push({ key, name, part: frame.part, state: frame.state, source: frame.source, target: frame.target, runtime: frame.runtime, solidPixels: count });
    }
    decoded[key] = picture; return picture;
  } });
  assert.equal(Object.keys(decoded).length, 5);
  assert.ok(Object.values(paintedNacreSiteAssetSnapshot()).every(value => value.state === 'ready'));
  await Promise.all([loadPaintedNacre({ loadImage: url => loadImage(fileURLToPath(url)) }),
    loadPaintedCombat({ loadImage: url => loadImage(fileURLToPath(url)) }), loadPaintedWalkers({ loadImage: url => loadImage(fileURLToPath(url)) })]);
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const bench = createCanvas(1800, 1860), c = bench.getContext('2d'); c.fillStyle = '#142e35'; c.fillRect(0, 0, bench.width, bench.height);
    const allFrames = Object.entries(PAINTED_NACRE_SITE_LAYOUT).flatMap(([key, atlas]) => Object.entries(atlas.frames).map(([name, frame]) => ({ key, name, frame })));
    allFrames.forEach(({ key, name, frame }, index) => {
      const x = index % 6 * 300, y = Math.floor(index / 6) * 372;
      c.fillStyle = index % 2 ? '#c5cabc' : '#315159'; c.fillRect(x + 7, y + 7, 286, 358);
      const scale = Math.min(254 / frame.source[2], 280 / frame.source[3]);
      c.drawImage(decoded[key], ...frame.source, x + (300 - frame.source[2] * scale) / 2, y + 18 + (285 - frame.source[3] * scale) / 2, frame.source[2] * scale, frame.source[3] * scale);
      c.fillStyle = index % 2 ? '#27434a' : '#dedfc7'; c.font = '15px sans-serif'; c.fillText(name, x + 15, y + 326); c.font = '12px sans-serif'; c.fillText(`${key} · cellule de rendu`, x + 15, y + 346);
    });
    save(bench, 'nacre-sites-state-grid.png', { type: 'Thirty measured source cells on alternating backgrounds; no gameplay claim' });

    const housing = createCanvas(1800, 880), hc = housing.getContext('2d'); hc.fillStyle = '#142e35'; hc.fillRect(0, 0, 1800, 880);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      const s = game('MI06'), house = s.dike.houses[row], rect = [col * 600, row * 440, 600, 440];
      s.dike.waterLevel = col ? .8 : .1; house.flooded = col > 0;
      if (col === 2) { house.destroyed = true; house.hp = 0; }
      panel(hc, rect, `MI06 · maison ${row + 1} · ${['eau basse', 'seuil dépassé', 'ruines + repère'][col]}`, col % 2 === 0);
      drawFocused(housing, rect, s, { targetX: house.x, groundY: house.y + house.h / 2, scale: 2.1, method: 'drawDike' });
    }
    save(housing, 'dike-housing-water-diagnostic.png', { type: 'Imposed low/high water and ruined house copies; .65 threshold stays code-driven' });

    const controls = createCanvas(1800, 1360), cc = controls.getContext('2d'); cc.fillStyle = '#142e35'; cc.fillRect(0, 0, 1800, 1360);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
      const s = game(row === 3 ? 'MI05' : 'MI06'), rect = [col * 600, row * 340, 600, 340];
      let object, method, visibleX, scale = 2.2, name;
      if (row === 0) {
        object = s.dike.auxiliary; object.active = col === 1; object.connected = col === 1; object.destroyed = col === 2;
        method = 'drawDikeControls'; name = `pompe · ${['arrêtée', 'alimentée', 'détruite'][col]}`;
      } else if (row === 1) {
        object = s.dike.valve; object.working = col === 1; object.completed = col === 2; s.campaign.circuit = 'diversion';
        method = 'drawDikeControls'; scale = 1.7; name = `vanne · ${['repos', 'manœuvre', 'dérivation'][col]}`;
      } else if (row === 2) {
        object = s.dike.panel; object.hp = object.maxHp * (col === 1 ? .4 : col === 2 ? 0 : 1); object.destroyed = col === 2; object.locked = col === 0;
        method = 'drawDike'; visibleX = object.supportX; scale = 1.4; name = `panneau · ${['verrouillé', 'endommagé', 'détruit'][col]}`;
      } else {
        object = s.channel.winches[0]; object.released = col === 1 || col === 2; object.destroyed = col === 2;
        method = 'drawChannel'; scale = 2.3; name = `treuil · ${['retenue', 'câble libéré', 'détruit'][col]}`;
      }
      panel(cc, rect, name, col % 2 === 0);
      drawFocused(controls, rect, s, { targetX: object.x, groundY: object.y + object.h / 2 + 10, visibleX: visibleX ?? object.x, scale, method });
    }
    save(controls, 'nacre-controls-diagnostic.png', { type: 'Imposed mechanical states; separate rotors, wheels, latches, winches, cables and supports' });

    const gates = createCanvas(1800, 820), gc = gates.getContext('2d'); gc.fillStyle = '#142e35'; gc.fillRect(0, 0, 1800, 820);
    for (let col = 0; col < 4; col++) {
      const s = game('MI08'), gate = s.departure.locks[1], rect = [col * 450, 0, 450, 820];
      gate.opening = [0, .5, 1, 1][col]; if (col === 3) { gate.destroyed = true; gate.hp = 0; gate.mechanism.destroyed = true; }
      panel(gc, rect, `MI08 · ${['fermée', 'levée 50 %', 'levée 100 %', 'brèche'][col]}`, col % 2 === 0);
      drawFocused(gates, rect, s, { targetX: gate.x, groundY: gate.y + gate.h / 2, scale: 1.8, method: 'drawDepartureSite' });
      if (!gate.destroyed) {
        const bounds = departureGateBounds(gate), x = col * 450 + 225 - bounds.w / 2 * 1.8;
        const y = 780 + (bounds.y - bounds.h / 2 - gate.y - gate.h / 2) * 1.8;
        gc.strokeStyle = '#88d5d2'; gc.lineWidth = 1; gc.strokeRect(x, y, bounds.w * 1.8, bounds.h * 1.8);
      }
    }
    save(gates, 'gate-motion-diagnostic.png', { type: 'Imposed gate openings; cyan outline is authoritative departureGateBounds, rails and destroyed remains stay grounded' });

    const ramps = createCanvas(1800, 760), rc = ramps.getContext('2d'); rc.fillStyle = '#142e35'; rc.fillRect(0, 0, 1800, 760);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      const s = game(row ? 'MI08' : 'MI07'), ramp = row ? s.departure.ramps[0] : s.ambulance.ramp, rect = [col * 600, row * 380, 600, 380];
      ramp.prepared = col === 2; ramp.working = col === 1; ramp.progress = col === 1 ? .5 : col === 2 ? 1 : 0;
      panel(rc, rect, `${row ? 'MI08' : 'MI07'} · rampe ${['repliée', 'préparation 50 %', 'préparée'][col]}`, col % 2 === 0);
      drawFocused(ramps, rect, s, { targetX: ramp.x, groundY: terrainAt(ramp.x, s.planetId) + 30, scale: 2,
        method: row ? 'drawDepartureSite' : 'drawAmbulanceSite' });
    }
    save(ramps, 'ramp-preparation-diagnostic.png', { type: 'Imposed ramp preparation copies; MI07 decking follows actual terrain, MI08 pitch follows progress' });

    const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
    for (const [missionId, camera, file] of [['MI05', 1350, 'scene-mi05-sites-camera.png'], ['MI06', 1120, 'scene-mi06-sites-camera.png'],
      ['MI07', 4050, 'scene-mi07-sites-camera.png'], ['MI08', 3350, 'scene-mi08-quay-camera.png'], ['MI08', 5200, 'scene-mi08-refuge-camera.png']]) {
      const s = game(missionId); for (let i = 0; i < 120; i++) updateGame(s, 1 / 60, {});
      const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas); renderer.panorama = panorama; renderer.panoramaReady = true;
      const target = Math.max(0, Math.min(s.mission.length - 1500, s.player.x - 528));
      renderer.lastGame = s; renderer.cameraX = (camera - target * .12) / .88;
      const saved = JSON.stringify(s); renderer.render(s); assert.equal(JSON.stringify(s), saved, `${missionId}: normal render mutated world`);
      save(canvas, file, { type: 'Normal renderer with camera framing only; no actor teleportation or mission accomplishment', missionId,
        cameraX: renderer.cameraX, publicUpdateTicks: 120, elapsed: s.elapsed, stateSha256: hash(saved) });
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  receipt.completed = true;
  receipt.counts = { atlases: receipt.atlases.length, cells: receipt.frames.length, runtimeCells: receipt.frames.filter(frame => frame.runtime).length,
    referenceCells: receipt.frames.filter(frame => !frame.runtime).length, views: receipt.views.length };
  console.log(JSON.stringify({ output, completed: true, ...receipt.counts }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); }
