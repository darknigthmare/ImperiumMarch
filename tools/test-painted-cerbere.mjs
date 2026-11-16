/** Decode the generated PNG and inspect Cerbère through the real Canvas path.
 * Diagnostic poses and scene copies are explicitly not browser playthroughs. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_CERBERE_LAYOUT } from '../src/painted-cerbere-layout.mjs';
import { CERBERE_FRAME_NAMES, PAINTED_CERBERE_URL, loadPaintedCerbere, clearPaintedCerbere,
  drawCerbere, paintedCerbereFrame } from '../src/painted-cerbere.mjs';
import { cerbereWeaponPose } from '../src/cerbere-weapon-pose.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedSprites } from '../src/painted-sprites.mjs';
import { createGame, terrainAt, updateGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-cerbere-qa');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Cerbère reception requires a real PNG decoder (@napi-rs/canvas).', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage } = api, sha = bytes => createHash('sha256').update(bytes).digest('hex');
const paths = ['src/painted-cerbere.mjs', 'src/painted-cerbere-layout.mjs', 'src/cerbere-weapon-pose.mjs', 'src/renderer.mjs', 'src/simulation.mjs', 'tools/test-painted-cerbere.mjs'];
const report = { createdUtc: new Date().toISOString(), version: JSON.parse(readFileSync(resolve(root, 'package.json'))).version,
  type: 'Decoded Cerbère PNG and diagnostic Canvas reception', completed: false, nativeBrowserExecuted: false, humanPlaytestPerformed: false,
  sourceHashes: Object.fromEntries(paths.map(path => [path, sha(readFileSync(resolve(root, path)))])), frames: [], views: [], shots: [],
  limitations: ['Six diagnostic poses and one diagnostic operation scene; no claim of a naturally completed mission.',
    'Cerbère has no independent simulated foot contacts or component health. Its limb placement remains a presentation rig.',
    'Five component damage/repair cells are references only; no persistent boss corpse is introduced.'] };
mkdirSync(output, { recursive: true });
const sourcePath = fileURLToPath(PAINTED_CERBERE_URL), bytes = readFileSync(sourcePath), decoded = await loadImage(sourcePath);
const imageCanvas = createCanvas(decoded.width, decoded.height), imageContext = imageCanvas.getContext('2d');
imageContext.drawImage(decoded, 0, 0); const pixels = imageContext.getImageData(0, 0, decoded.width, decoded.height).data;
let transparent = 0, solid = 0;
for (let i = 3; i < pixels.length; i += 4) { if (!pixels[i]) transparent++; if (pixels[i] > 200) solid++; }
assert.ok(transparent > decoded.width * decoded.height * .15, 'The source has real transparent background');
assert.ok(solid > 0); assert.deepEqual([decoded.width, decoded.height], PAINTED_CERBERE_LAYOUT.size);
report.atlas = { path: 'assets/painted/cerbere/cerbere.png', sha256: sha(bytes), bytes: bytes.length, size: [decoded.width, decoded.height],
  fullyTransparentPixels: transparent, solidPixels: solid };
for (const name of CERBERE_FRAME_NAMES) {
  const frame = paintedCerbereFrame(name); assert.ok(frame, `Frame exists: ${name}`);
  const [x, y, width, height] = frame.source;
  let ink = 0;
  for (let row = y; row < y + height; row++) for (let col = x; col < x + width; col++) if (pixels[(row * decoded.width + col) * 4 + 3] > 96) ink++;
  assert.ok(ink > 10, `Decoded frame contains visible subject: ${name}`);
  report.frames.push({ name, source: frame.source, target: frame.target, visiblePixels: ink, usage: frame.usage || 'unspecified' });
}
const status = await loadPaintedCerbere({ loadImage: async () => decoded }); assert.equal(status.state, 'ready');
const save = (canvas, name, details) => {
  const buffer = canvas.toBuffer('image/png'); writeFileSync(resolve(output, name), buffer);
  report.views.push({ file: name, size: [canvas.width, canvas.height], sha256: sha(buffer), ...details });
};
const base = createGame({ missionId: 'op03', walkerId: 'WK01', seed: 1545 });
const originalBoss = base.enemies.find(item => item.type === 'boss');
const board = createCanvas(1500, 940), ctx = board.getContext('2d');
const configurations = [
  { name: 'Garde immobile', phase: 'guard', facing: 1 },
  { name: 'Visée à droite', phase: 'attack', facing: 1, targetX: 680, targetY: 300 },
  { name: 'Visée à gauche', phase: 'attack', facing: -1, targetX: -100, targetY: 350 },
  { name: 'Coque endommagée', phase: 'recover', facing: -1, hp: 80, targetX: -100, targetY: 350 },
  { name: 'Repli autorisé', phase: 'standdown', facing: -1, active: false },
  { name: 'Repli vectoriel après absence', phase: 'guard', facing: 1, vector: true },
];
for (let i = 0; i < configurations.length; i++) {
  const config = configurations[i], px = i % 3 * 500, py = Math.floor(i / 3) * 470;
  const enemy = { ...structuredClone(originalBoss), ...config, x: 250, y: 281, targetX: config.targetX ?? 550, targetY: config.targetY ?? 281 };
  const before = JSON.stringify(enemy);
  ctx.fillStyle = i % 2 ? '#d4d3c6' : '#263b40'; ctx.fillRect(px, py, 500, 470);
  ctx.save(); ctx.translate(px, py); ctx.lineWidth = 1; ctx.strokeStyle = i % 2 ? '#7c8e80' : '#718e7e';
  ctx.beginPath(); ctx.moveTo(25, 390); ctx.lineTo(475, 390); ctx.stroke();
  if (config.vector) clearPaintedCerbere();
  assert.equal(drawCerbere(ctx, enemy, { ground: 390, time: 0, reducedMotion: true }), true);
  const pose = cerbereWeaponPose(enemy);
  ctx.strokeStyle = '#d2935f'; ctx.beginPath(); ctx.arc(...pose.muzzle, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.restore(); assert.equal(JSON.stringify(enemy), before);
  ctx.fillStyle = i % 2 ? '#1b3034' : '#e1dfc7'; ctx.font = 'bold 19px sans-serif'; ctx.fillText(config.name, px + 20, py + 35);
  ctx.font = '13px sans-serif'; ctx.fillText('Pose diagnostique · cercle = bouche physique', px + 20, py + 57);
}
save(board, 'cerbere-diagnostic-poses.png', { diagnostic: true, panels: configurations.map(item => item.name) });
await loadPaintedCerbere({ loadImage: async () => decoded });
const imageLoader = url => loadImage(fileURLToPath(url));
await Promise.all([loadPaintedWalkers({ loadImage: imageLoader }), loadPaintedCombat({ loadImage: imageLoader }), loadPaintedSprites({ loadImage: imageLoader })]);
const previousImage = globalThis.Image, previousWindow = globalThis.window;
globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
try {
  const state = createGame({ missionId: 'op03', walkerId: 'WK01', seed: 1545 });
  const enemy = state.enemies.find(item => item.type === 'boss');
  const displacement = 3500; state.player.x += displacement;
  for (const foot of state.player.feet) { foot.x += displacement; foot.y = terrainAt(foot.x, state.planetId); }
  state.player.groundY = terrainAt(state.player.x, state.planetId); state.player.y = state.player.groundY - state.walker.height;
  state.bossReleased = true; state.decision.choice = 'defy'; state.enemies = [enemy];
  enemy.phase = 'attack'; enemy.telegraph = .8; enemy.targetX = state.player.x; enemy.targetY = state.player.y;
  const before = JSON.stringify(state), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.render(state, { reducedMotion: true, shake: false }); assert.equal(JSON.stringify(state), before);
  save(canvas, 'cerbere-op03-diagnostic.png', { diagnostic: true, mission: 'op03', camera: 'Player relocated only in this diagnostic copy', state: JSON.parse(before) });
} finally { globalThis.Image = previousImage; globalThis.window = previousWindow; }
for (const facing of [-1, 1]) {
  const state = createGame({ missionId: 'op03', seed: 1545 }), enemy = state.enemies.find(item => item.type === 'boss');
  enemy.x = state.player.x - facing * 350; enemy.y = terrainAt(enemy.x, state.planetId) - enemy.h / 2;
  enemy.facing = facing; enemy.phase = 'attack'; enemy.telegraph = .999; enemy.targetX = state.player.x; enemy.targetY = state.player.y;
  state.enemies = [enemy]; state.bossReleased = true;
  const pose = cerbereWeaponPose(enemy); updateGame(state, 1 / 60, { brace: true });
  const shot = state.projectiles.find(item => item.team === 'enemy'); assert.ok(shot);
  assert.ok(Math.hypot(shot.prevX - pose.muzzle[0], shot.prevY - pose.muzzle[1]) < .002);
  report.shots.push({ facing, muzzle: pose.muzzle, emittedFrom: [shot.prevX, shot.prevY], damage: shot.damage, type: shot.type });
}
report.completed = true;
writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ completed: true, frames: report.frames.length, views: report.views.length, shotOrientations: report.shots.length, output }));
