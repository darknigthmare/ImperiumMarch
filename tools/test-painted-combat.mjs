/** Decode actual PNGs, verify measured crops/rigs and render normal Canvas views.
 * This is not a browser or a human playtest. Existing evidence is never touched.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_COMBAT_LAYOUT } from '../src/painted-combat-layout.mjs';
import { PAINTED_COMBAT_URLS, loadPaintedCombat, paintedCombatStatus, clearPaintedCombat, paintedCombatFrame } from '../src/painted-combat.mjs';
import { ENEMY_WEAPON_RIGS } from '../src/enemy-weapon-pose.mjs';
import { Renderer } from '../src/renderer.mjs';
import { ENEMY_TYPES } from '../src/content.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-combat-qa');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Actual PNG decoding requires @napi-rs/canvas.', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage } = api;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
mkdirSync(output, { recursive: true });
const receipt = { createdUtc: new Date().toISOString(), type: 'Actual PNG decoding and normal renderer Canvas reception',
  completed: false, browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [],
  limitations: ['Canvas decoding and geometry checks do not certify native browser UI, audio, anatomy, artistic approval or final animation quality.'],
  sources: Object.fromEntries(['src/painted-combat.mjs', 'src/painted-combat-layout.mjs', 'src/enemy-weapon-pose.mjs',
    'src/renderer.mjs', 'src/simulation.mjs', 'tools/test-painted-combat.mjs'].map(path => [path, hash(readFileSync(resolve(root, path)))])) };

function occupied(pixels, width, [x, y, w, h], threshold = 128) {
  let count = 0;
  for (let row = y; row < y + h; row++) for (let column = x; column < x + w; column++) if (pixels[(row * width + column) * 4 + 3] > threshold) count++;
  return count;
}
const decoded = {}, pixels = {};
try {
  clearPaintedCombat();
  await loadPaintedCombat({ loadImage: async (url, key) => {
    const path = fileURLToPath(url), bytes = readFileSync(path), picture = await loadImage(path);
    const canvas = createCanvas(picture.width, picture.height), ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
    const rgba = ctx.getImageData(0, 0, picture.width, picture.height).data;
    let clear = 0, translucent = 0, solid = 0;
    for (let i = 3; i < rgba.length; i += 4) { if (rgba[i] === 0) clear++; if (rgba[i] < 16) translucent++; if (rgba[i] > 128) solid++; }
    assert.ok(clear > 1000 && translucent > picture.width * picture.height * .05, `${key}: genuine transparent space required`);
    assert.ok(solid > 1000, `${key}: visible art required`);
    decoded[key] = picture; pixels[key] = rgba;
    receipt.atlases.push({ key, path: path.slice(root.length + 1), width: picture.width, height: picture.height,
      bytes: bytes.length, sha256: hash(bytes), clearPixels: clear, nearClearPixels: translucent, solidPixels: solid });
    return picture;
  } });
  assert.equal(Object.keys(decoded).length, 9, 'All nine actual PNGs must decode');
  assert.ok(Object.values(paintedCombatStatus()).every(value => value.state === 'ready'), 'A failed resource is not a successful art check');
  for (const [key, atlas] of Object.entries(PAINTED_COMBAT_LAYOUT)) {
    const picture = decoded[key]; assert.ok(picture, `${key}: registered image`);
    const grid = atlas.grid || (['rifle', 'sniper', 'rocket', 'civilian'].includes(key) ? [4, 3] : [3, 2]);
    for (const [name, item] of Object.entries(atlas.frames)) {
      const frame = paintedCombatFrame(key, name); assert.ok(frame, `${key}/${name}: valid mapping`);
      const [x, y, w, h] = frame.source;
      assert.ok(frame.source.every(Number.isInteger), `${key}/${name}: pixel-aligned source crop`);
      const count = occupied(pixels[key], picture.width, frame.source);
      assert.ok(count > 20, `${key}/${name}: empty crop`);
      const col = Math.floor((x + w / 2) / picture.width * grid[0]), row = Math.floor((y + h / 2) / picture.height * grid[1]);
      const left = Math.round(col * picture.width / grid[0]), top = Math.round(row * picture.height / grid[1]);
      const right = Math.round((col + 1) * picture.width / grid[0]), bottom = Math.round((row + 1) * picture.height / grid[1]);
      assert.ok(x >= left && y >= top && x + w <= right && y + h <= bottom, `${key}/${name}: crop cannot cross a neighbouring cell`);
      const total = occupied(pixels[key], picture.width, [left, top, right - left, bottom - top]);
      assert.ok(total - count < Math.max(50, total * .01), `${key}/${name}: significant silhouette outside its crop`);
      if (name === 'weapon' && ENEMY_WEAPON_RIGS[key]) {
        const anchors = item.anchors; assert.ok(anchors?.pivot && anchors?.muzzle, `${key}: measured weapon anchors required`);
        const rotation = frame.rotation || 0, [mx, my] = anchors.muzzle;
        const resolved = [mx * Math.cos(rotation) - my * Math.sin(rotation), mx * Math.sin(rotation) + my * Math.cos(rotation)];
        assert.ok(Math.abs(resolved[0] - ENEMY_WEAPON_RIGS[key].length) < .001 && Math.abs(resolved[1]) < .001, `${key}: corrected optical muzzle must match physical length`);
      }
      receipt.frames.push({ atlas: key, frame: name, occupiedPixels: count, source: frame.source, target: frame.target, rotation: frame.rotation || 0 });
    }
  }

  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const bench = createCanvas(1800, 1500), ctx = bench.getContext('2d');
    ctx.fillStyle = '#14232a'; ctx.fillRect(0, 0, bench.width, bench.height);
    const renderer = new Renderer(bench); renderer.combatReducedMotion = true;
    const keys = Object.keys(PAINTED_COMBAT_URLS);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i], col = i % 3, row = Math.floor(i / 3), x = col * 600, y = row * 500;
      ctx.fillStyle = (row + col) % 2 ? '#d7d4c7' : '#293b42'; ctx.fillRect(x + 10, y + 10, 580, 480);
      ctx.fillStyle = (row + col) % 2 ? '#243841' : '#e0e5d3'; ctx.font = 'bold 23px sans-serif'; ctx.fillText(key.toUpperCase(), x + 28, y + 45);
      ctx.font = '14px sans-serif'; ctx.fillText('Rendu intégré · droite / gauche · échelle × 2', x + 28, y + 72);
      for (const [facing, localX, localY] of [[1, 300, 205], [-1, 300, 375]]) {
        ctx.save(); ctx.translate(x + localX, y + localY); ctx.scale(2, 2);
        if (key === 'civilian') renderer.drawHuman({ x: 0, y: 0, w: 18, h: 34, alive: true, fleeing: facing === 1 }, 0, true, null);
        else if (key === 'convoy') renderer.drawConvoy({ x: 0, y: 0, w: 112, h: 64, hp: 640, maxHp: 640, cargo: 24, waitTime: 0, facing }, 0);
        else renderer.drawEnemy({ ...ENEMY_TYPES[key], type: key, x: 0, y: 0, facing, phase: 'idle', active: true,
          hp: ENEMY_TYPES[key].hp, maxHp: ENEMY_TYPES[key].hp, flash: 0 }, { planetId: 'PL01' }, 0);
        ctx.restore();
      }
    }
    const benchBytes = bench.toBuffer('image/png'); writeFileSync(resolve(output, 'combat-readability.png'), benchBytes);
    receipt.views.push({ file: 'combat-readability.png', sha256: hash(benchBytes), type: 'Isolated normal renderer comparison, not gameplay screenshot' });
    const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
    for (const missionId of ['op01', 'op02', 'MI05', 'MI09', 'MI13']) {
      const state = createGame({ missionId, walkerId: 'WK01', difficulty: 'story', seed: 1555 });
      // Public inputs prepare the scene; no actors or outcomes are teleported.
      for (let frame = 0; frame < 180 && state.status === 'playing'; frame++) updateGame(state, 1 / 60, { move: 1 });
      const canvas = createCanvas(1600, 900), live = new Renderer(canvas); live.panorama = panorama; live.panoramaReady = true;
      const before = JSON.stringify(state), sourceHash = hash(before);
      live.render(state, { reducedMotion: true }); assert.equal(JSON.stringify(state), before, `${missionId}: renderer mutated simulation`);
      const name = `scene-${missionId.toLowerCase()}.png`, bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, name), bytes);
      receipt.views.push({ file: name, missionId, elapsed: state.elapsed, stateSha256: sourceHash, sha256: hash(bytes), type: 'Canvas scene after 180 public update ticks' });
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  receipt.completed = true;
  receipt.counts = { atlases: receipt.atlases.length, frames: receipt.frames.length, views: receipt.views.length };
  console.log(JSON.stringify({ output, completed: true, ...receipt.counts }));
} catch (error) {
  receipt.error = error.stack || String(error); throw error;
} finally {
  writeFileSync(resolve(output, 'receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`);
}
