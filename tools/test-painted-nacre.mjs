/** Actual PNG decoding and diagnostic Canvas views; no browser/human claim. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_NACRE_LAYOUT } from '../src/painted-nacre-layout.mjs';
import { loadPaintedNacre, clearPaintedNacre, paintedNacreStatus, paintedNacreFrame } from '../src/painted-nacre.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { Renderer } from '../src/renderer.mjs';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'docs/validation/painted-nacre-v0155');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); }
catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = api;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
const receipt = { date: new Date().toISOString(), version: '0.15.5', completed: false,
  type: 'Actual PNG decoding, source integrity and diagnostic Canvas renderer views',
  browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [],
  sources: Object.fromEntries(['src/painted-nacre.mjs', 'src/painted-nacre-layout.mjs', 'src/renderer.mjs', 'src/simulation.mjs',
    'tools/test-painted-nacre.mjs'].map(path => [path, hash(readFileSync(resolve(root, path)))])),
  limitations: ['Camera-focused Canvas scenes are visual diagnostics, not complete mission walkthroughs.',
    'The labelled ambulance state panel imposes damage and recovery states on copies.',
    'No new passengers, supplies, collision, mission progress or population are created by the artwork.',
    'The separate recovered beacon cell is a production reference only.'] };
const decoded = {};
function countPixels(data, width, rectangle, threshold = 128) {
  const [x, y, w, h] = rectangle; let count = 0;
  for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) if (data[(row * width + col) * 4 + 3] > threshold) count++;
  return count;
}
function save(canvas, file, info = {}) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  receipt.views.push({ file, sha256: hash(bytes), ...info });
}
try {
  clearPaintedNacre();
  await loadPaintedNacre({ loadImage: async (url, key) => {
    const path = fileURLToPath(url), bytes = readFileSync(path), picture = await loadImage(path), layout = PAINTED_NACRE_LAYOUT[key];
    assert.equal(hash(bytes), layout.sha256, `${key}: original image checksum`);
    const canvas = createCanvas(picture.width, picture.height), ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
    const pixels = ctx.getImageData(0, 0, picture.width, picture.height).data;
    let clear = 0; for (let i = 3; i < pixels.length; i += 4) if (pixels[i] === 0) clear++;
    assert.ok(clear > picture.width * picture.height * .1, `${key}: real transparent background`);
    receipt.atlases.push({ key, path: path.slice(root.length + 1), size: [picture.width, picture.height], sha256: hash(bytes), clearPixels: clear });
    for (const name of Object.keys(layout.frames)) {
      const frame = paintedNacreFrame(key, name), [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
      assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch, `${key}/${name}: crop crosses neighbouring cell`);
      const count = countPixels(pixels, picture.width, frame.source), cellCount = countPixels(pixels, picture.width, frame.cell);
      assert.ok(count > 100 && cellCount - count < Math.max(30, cellCount * .002), `${key}/${name}: no clipped silhouette`);
      if (frame.anchors?.sourceKeel) {
        const actualY = frame.target[1] + (frame.anchors.sourceKeel[1] - y) * frame.target[3] / h;
        assert.ok(Math.abs(actualY - layout.nominal[1] / 2) < .00001, `${key}/${name}: true hull datum`);
      }
      receipt.frames.push({ key, name, source: frame.source, target: frame.target, runtime: frame.runtime, solidPixels: count });
    }
    decoded[key] = picture; return picture;
  } });
  assert.equal(Object.keys(decoded).length, 6); assert.ok(Object.values(paintedNacreStatus()).every(value => value.state === 'ready'));
  await Promise.all([loadPaintedCombat({ loadImage: url => loadImage(fileURLToPath(url)) }), loadPaintedWalkers({ loadImage: url => loadImage(fileURLToPath(url)) })]);

  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const bench = createCanvas(1800, 1590), c = bench.getContext('2d'); c.fillStyle = '#142b32'; c.fillRect(0, 0, bench.width, bench.height);
    Object.entries(PAINTED_NACRE_LAYOUT).forEach(([key, atlas], index) => {
      const originX = index % 2 * 900, originY = Math.floor(index / 2) * 530;
      c.fillStyle = '#d0d7be'; c.font = 'bold 22px sans-serif'; c.fillText(key.toUpperCase(), originX + 20, originY + 35);
      c.font = '13px sans-serif'; c.fillText('Banc de cellules peintes · pas une capture de partie', originX + 20, originY + 58);
      Object.entries(atlas.frames).forEach(([name, frame], i) => {
        const x = originX + i % 3 * 300, y = originY + 80 + Math.floor(i / 3) * 210;
        c.fillStyle = i % 2 ? '#d5d2c1' : '#304a50'; c.fillRect(x + 7, y, 286, 196);
        const scale = Math.min(250 / frame.source[2], 140 / frame.source[3]);
        c.drawImage(decoded[key], ...frame.source, x + (300 - frame.source[2] * scale) / 2, y + (155 - frame.source[3] * scale) / 2, frame.source[2] * scale, frame.source[3] * scale);
        c.fillStyle = i % 2 ? '#263e43' : '#e1dfc7'; c.font = '14px sans-serif'; c.fillText(`${name}${frame.runtime ? '' : ' · RÉFÉRENCE'}`, x + 15, y + 181);
      });
    });
    save(bench, 'nacre-state-grid.png', { type: 'Thirty measured source cells, labelled runtime/reference' });

    const comparison = createCanvas(1600, 900), q = comparison.getContext('2d');
    q.fillStyle = '#193239'; q.fillRect(0, 0, 1600, 900);
    for (const [index, mode] of ['intact', 'damaged', 'destroyed', 'beacon-recovered'].entries()) {
      const s = createGame({ missionId: 'MI07', walkerId: 'WK02', difficulty: 'story', seed: 1555 }), a = s.ambulance;
      if (mode === 'damaged') { a.vehicle.hp = a.vehicle.maxHp * .5; a.cargo.verified = true; }
      if (mode === 'destroyed') { a.vehicle.destroyed = true; a.vehicle.hp = 0; a.cargo.destroyed = true; a.beacon.destroyed = true; }
      if (mode === 'beacon-recovered') { a.beacon.recovered = true; a.cargo.verified = true; }
      const x = index % 2 * 800, y = Math.floor(index / 2) * 450;
      q.fillStyle = index % 2 ? '#b9c3b4' : '#315158'; q.fillRect(x + 10, y + 10, 780, 430);
      q.fillStyle = index % 2 ? '#24434a' : '#e3dfbd'; q.font = '20px sans-serif'; q.fillText(`MI07 · ${mode} · état diagnostique`, x + 30, y + 48);
      const renderer = new Renderer(comparison); renderer.combatReducedMotion = true; renderer.visible = () => true;
      q.save(); q.translate(x + 400, y + 250); q.scale(2.5, 2.5); q.translate(-a.vehicle.x, -a.vehicle.y);
      const ground = terrainAt(a.vehicle.x, s.planetId); q.strokeStyle = '#b8be99'; q.lineWidth = .8; q.beginPath(); q.moveTo(a.vehicle.x - 140, ground); q.lineTo(a.vehicle.x + 140, ground); q.stroke();
      const snapshot = JSON.stringify(s); renderer.drawAmbulanceVehicle(s, 0); assert.equal(JSON.stringify(s), snapshot);
      q.restore();
    }
    save(comparison, 'ambulance-diagnostic-states.png', { type: 'Normal ambulance renderer with imposed states on independent copies, ×2.5 view' });

    const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
    for (const [missionId, camera] of [['MI05', 850], ['MI07', 0], ['MI08', 3250]]) {
      const s = createGame({ missionId, walkerId: 'WK02', difficulty: 'story', seed: 1555 });
      for (let i = 0; i < 120; i++) updateGame(s, 1 / 60, {});
      const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas); renderer.panorama = panorama; renderer.panoramaReady = true;
      // Camera framing only; no subject or player is teleported and no event is fabricated.
      const target = Math.max(0, Math.min(s.mission.length - 1500, s.player.x - 528));
      renderer.lastGame = s; renderer.cameraX = (camera - target * .12) / .88;
      const snapshot = JSON.stringify(s); renderer.render(s); assert.equal(JSON.stringify(s), snapshot, `${missionId}: render altered world`);
      save(canvas, `scene-${missionId.toLowerCase()}-camera-diagnostic.png`, { type: 'Normal renderer, camera-focused Canvas diagnostic', missionId, cameraX: renderer.cameraX,
        publicUpdateTicks: 120, elapsed: s.elapsed, stateSha256: hash(snapshot) });
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  receipt.completed = true;
  receipt.counts = { atlases: receipt.atlases.length, cells: receipt.frames.length, runtimeCells: receipt.frames.filter(frame => frame.runtime).length, referenceCells: receipt.frames.filter(frame => !frame.runtime).length, views: receipt.views.length };
  console.log(JSON.stringify({ output, completed: true, ...receipt.counts }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); }
