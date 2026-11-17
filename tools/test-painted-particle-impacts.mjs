/** Original PNG and Canvas reception of existing spark/blast particles only. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_PARTICLE_IMPACTS_LAYOUT } from '../src/painted-particle-impacts-layout.mjs';
import { PAINTED_PARTICLE_IMPACTS_COLORS, loadPaintedParticleImpacts, clearPaintedParticleImpacts,
  setPaintedParticleImpactsImage, paintedParticleImpactsStatus, paintedImpactParticleFrame, drawPaintedImpactParticle,
} from '../src/painted-particle-impacts.mjs';
import { loadPaintedParticles } from '../src/painted-particles.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWorlds } from '../src/painted-worlds.mjs';
import { loadPaintedVesper } from '../src/painted-vesper.mjs';
import { loadPaintedVesperScenery } from '../src/painted-vesper-scenery.mjs';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-particle-impacts-qa');
const require = createRequire(import.meta.url); let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Impact reception requires @napi-rs/canvas', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage } = api, sha = value => createHash('sha256').update(value).digest('hex');
mkdirSync(output, { recursive: true });
const sources = ['src/painted-particle-impacts.mjs', 'src/painted-particle-impacts-layout.mjs',
  'assets/painted/particle-impacts/manifest.json', 'assets/painted/particle-impacts/prompts.json',
  'assets/painted/particle-impacts/README.md', 'tools/index-painted-particle-impacts.py',
  'tools/test-painted-particle-impacts.mjs', 'tests/painted-particle-impacts.test.mjs',
  'src/renderer.mjs', 'src/simulation.mjs', 'src/content.mjs', 'assets/art/vesper-panorama.png'];
const receipt = { version: '0.15.11', createdUtc: new Date().toISOString(), completed: false,
  type: 'Original PNG decoding and public-input particle impact Canvas reception on painted Vesper',
  browserExecuted: false, humanPlaytestPerformed: false,
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  atlases: [], frames: [], geometryChecks: [], views: [], publicEmissions: [],
  limitations: ['Contact sheets and magnified geometry panels are isolated diagnostics, not game events.',
    'Game states start through createGame and use only updateGame inputs; no particle or actor is inserted or teleported.',
    'Spark retains the historical two-unit round-capped segment; blast retains its small particle circle, never the explosion damage radius.',
    'No material classification, emitter, RNG call, lifetime, trajectory or saved field is introduced.',
    'Canvas does not certify native browser behavior, audio, hardware performance or human artistic approval.'] };
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/particle-impacts/manifest.json')));
const prompts = JSON.parse(readFileSync(resolve(root, 'assets/painted/particle-impacts/prompts.json')));
const decoded = {}, ids = new WeakMap();
function save(canvas, file, extra = {}) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  receipt.views.push({ file, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...extra });
}
function caption(ctx, text, width) {
  ctx.fillStyle = '#16262ee8'; ctx.fillRect(0, 0, width, 38);
  ctx.fillStyle = '#eee0c5'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(text, 16, 25, width - 32);
}
const sample = (type, stage = 0, extra = {}) => ({ type, color: PAINTED_PARTICLE_IMPACTS_COLORS[type],
  x: 128, y: 128, vx: 120, vy: 0, size: 3, life: 1 - (stage + .5) / 6, maxLife: 1, ...extra });
function nativeGeometry(p, label) {
  const frame = paintedImpactParticleFrame(p), canvas = createCanvas(256, 256), ctx = canvas.getContext('2d');
  assert.ok(frame);
  ctx.beginPath(); ctx.rect(8, 8, 240, 240); ctx.clip(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = .73;
  const alphaBefore = ctx.globalAlpha, before = JSON.stringify(p);
  assert.ok(drawPaintedImpactParticle(ctx, p)); assert.equal(JSON.stringify(p), before);
  assert.equal(ctx.globalAlpha, alphaBefore); assert.equal(ctx.imageSmoothingEnabled, false);
  const pixels = ctx.getImageData(0, 0, 256, 256).data;
  let drawnPixels = 0, maxDistance = 0;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    if (!pixels[(y * 256 + x) * 4 + 3]) continue;
    const dx = x + .5 - p.x, dy = y + .5 - p.y;
    let distance;
    if (p.type === 'spark') {
      const u = dx * Math.cos(frame.angle) + dy * Math.sin(frame.angle);
      const v = -dx * Math.sin(frame.angle) + dy * Math.cos(frame.angle);
      distance = Math.hypot(u - Math.max(-frame.length, Math.min(0, u)), v);
    } else distance = Math.hypot(dx, dy);
    assert.ok(distance <= frame.radius + 1, label + ': painted pixels cannot escape historical clip plus raster antialiasing');
    maxDistance = Math.max(maxDistance, distance); drawnPixels++;
  }
  assert.ok(drawnPixels > 0, label + ': actual sprite survives game-size rasterization');
  ctx.fillStyle = '#fff'; ctx.fillRect(10, 10, 3, 3);
  assert.ok(ctx.getImageData(11, 11, 1, 1).data[3] > 0, 'local clip restored');
  ctx.fillRect(0, 0, 3, 3); assert.equal(ctx.getImageData(1, 1, 1, 1).data[3], 0, 'caller clip preserved');
  receipt.geometryChecks.push({ label, type: p.type, frame: frame.name, radius: frame.radius,
    length: frame.length ?? null, angle: frame.angle ?? null, drawnPixels, maxDistance,
    alphaPreserved: true, smoothingPreserved: true, callerClipPreserved: true, stateUnchanged: true });
}
function publicEmission(type) {
  const state = createGame({ missionId: 'MI01', walkerId: 'WK05', difficulty: 'story', seed: 1511 }), inputs = [];
  while (inputs.length < 600 && !state.particles.some(p => p.type === type)) {
    const input = { brace: true, fire: type === 'spark' && inputs.length === 0,
      secondary: type === 'blast' && inputs.length === 0, aimX: 600, aimY: terrainAt(600, state.planetId) + 20 };
    updateGame(state, 1 / 60, input); inputs.push(input);
  }
  assert.ok(state.particles.some(p => p.type === type));
  return { state, inputs };
}
let panorama;
function renderScene(state, file, reducedMotion, description, fallback = false) {
  const before = JSON.stringify(state), canvas = createCanvas(1600, 900), ctx = canvas.getContext('2d'), renderer = new Renderer(canvas);
  renderer.panorama = panorama; renderer.panoramaReady = true;
  const calls = {}, original = ctx.drawImage;
  ctx.drawImage = function (...args) { const key = ids.get(args[0]); if (key) calls[key] = (calls[key] || 0) + 1; return original.apply(this, args); };
  renderer.render(state, { reducedMotion, shake: false });
  assert.equal(JSON.stringify(state), before); assert.ok(calls.panorama > 0);
  for (const type of ['spark', 'blast']) {
    const expected = fallback ? 0 : state.particles.filter(p => p.type === type && paintedImpactParticleFrame(p)).length;
    assert.equal(calls[type] || 0, expected);
  }
  caption(ctx, 'MI01 · ' + description + ' · Vesper peint · Canvas par commandes publiques', canvas.width);
  save(canvas, file, { type: 'Public-input Canvas scene', missionId: state.missionId, elapsed: state.elapsed,
    cameraX: renderer.cameraX, reducedMotion, fallback, description, impactDrawCalls: calls,
    particlesByType: state.particles.reduce((out, p) => { out[p.type] = (out[p.type] || 0) + 1; return out; }, {}),
    stateSha256: sha(before), stateUnchanged: true });
}

try {
  clearPaintedParticleImpacts();
  await loadPaintedParticleImpacts({ loadImage: async (url, key) => {
    try {
      const path = fileURLToPath(url), bytes = readFileSync(path), image = await loadImage(path);
      const atlas = PAINTED_PARTICLE_IMPACTS_LAYOUT[key], file = manifest.files.find(item => item.id === key);
      assert.equal(sha(bytes), file.sha256); assert.equal(sha(bytes), prompts.selectedOutputs.find(item => item.atlas === key).sha256);
      assert.deepEqual([image.width, image.height], atlas.size);
      const ctx = createCanvas(image.width, image.height).getContext('2d'); ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
      const alpha = (x, y) => pixels[(y * image.width + x) * 4 + 3];
      let transparent = 0; for (let i = 3; i < pixels.length; i += 4) if (!pixels[i]) transparent++;
      assert.ok(transparent / (image.width * image.height) > .5);
      for (const [name, frame] of Object.entries(atlas.frames)) {
        const [cx, cy, cw, ch] = frame.cell, [sx, sy, sw, sh] = frame.source;
        const [ax, ay, aw, ah] = frame.anchorBounds, [ox, oy] = frame.anchors.sourceOrigin;
        let visible = 0, measured = 0, strong = 0, maxUsefulRadius = 0;
        for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) {
          const value = alpha(x, y);
          if (x < cx + 3 || x >= cx + cw - 3 || y < cy + 3 || y >= cy + ch - 3)
            assert.ok(value <= 2, key + '/' + name + ': clear gutter');
          if (!value) continue;
          visible++; if (value >= 32) strong++;
          assert.ok(x >= sx && y >= sy && x < sx + sw && y < sy + sh, name + ': all source alpha retained');
          if (value < 2) continue;
          measured++;
          assert.ok(x >= ax && y >= ay && x < ax + aw && y < ay + ah);
          const dx = Math.max(Math.abs(x - ox), Math.abs(x + 1 - ox));
          const dy = Math.max(Math.abs(y - oy), Math.abs(y + 1 - oy));
          maxUsefulRadius = Math.max(maxUsefulRadius, Math.hypot(dx, dy) / frame.sourceRadius);
        }
        assert.equal(visible, frame.visiblePixels); assert.equal(measured, frame.anchorPixels); assert.equal(strong, frame.strongPixels);
        assert.equal(visible - measured, frame.alpha1PixelsExcludedFromMeasurement); assert.ok(strong > 500);
        if (key === 'blast') assert.ok(maxUsefulRadius <= 1 + 1e-9);
        receipt.frames.push({ atlas: key, name, source: frame.source, target: frame.target, visiblePixels: visible,
          anchorPixels: measured, strongPixels: strong, alpha1PixelsExcludedFromMeasurement: visible - measured,
          measurements: frame.measurements, normalization: frame.normalization, runtimeClip: frame.runtimeClip });
      }
      ids.set(image, key); decoded[key] = image;
      receipt.atlases.push({ id: key, bytes: bytes.length, sha256: sha(bytes), dimensions: atlas.size, transparentPixels: transparent });
      return image;
    } catch (error) { (receipt.decodingErrors ||= []).push({ atlas: key, error: error.stack || String(error) }); throw error; }
  } });
  assert.ok(Object.values(paintedParticleImpactsStatus()).every(s => s.state === 'ready'),
    'All originals must decode: ' + JSON.stringify(receipt.decodingErrors || []));
  assert.equal(receipt.frames.length, 12);
  for (const type of ['spark', 'blast']) for (let stage = 0; stage < 6; stage++) nativeGeometry(sample(type, stage), type + '-age-' + stage);
  for (const [vx, vy] of [[180, 0], [-180, 0], [0, 180], [0, -180], [120, 90], [-120, 90], [120, -90], [-120, -90], [.0001, -.0001]])
    nativeGeometry(sample('spark', 2, { vx, vy }), 'spark-velocity-' + vx + '-' + vy);
  assert.equal(drawPaintedImpactParticle(createCanvas(16, 16).getContext('2d'), sample('spark', 0, { vx: 0, vy: 0 })), false);

  const sheet = createCanvas(1800, 900), c = sheet.getContext('2d');
  c.fillStyle = '#172930'; c.fillRect(0, 0, 1800, 900);
  caption(c, 'AS22 · 12 cellules · diagnostics agrandis ; ligne haute alpha 1, ligne basse alpha historique', 1800);
  for (const [row, type] of ['spark', 'blast'].entries()) for (let stage = 0; stage < 6; stage++) {
    const x = stage * 300, y = 42 + row * 425;
    c.fillStyle = '#b8bba9'; c.fillRect(x + 5, y, 145, 415); c.fillStyle = '#253b43'; c.fillRect(x + 150, y, 145, 415);
    c.fillStyle = '#f2e2bd'; c.font = '17px sans-serif'; c.textAlign = 'center'; c.fillText(type + ' · age-' + stage, x + 150, y + 28);
    const p = sample(type, stage, { x: 0, y: 0 });
    for (const [dy, opacity] of [[125, 1], [310, p.life / p.maxLife]]) {
      c.save(); c.globalAlpha = opacity; c.translate(x + 150 + (type === 'spark' ? 45 : 0), y + dy);
      c.scale(type === 'spark' ? 30 : 20, type === 'spark' ? 30 : 20);
      assert.ok(drawPaintedImpactParticle(c, p)); c.restore();
    }
  }
  save(sheet, 'impact-contact-sheet.png', { type: 'Isolated twelve-cell diagnostic, magnification spark x30 and blast x20' });
  const geometry = createCanvas(1500, 600), g = geometry.getContext('2d');
  g.fillStyle = '#223a43'; g.fillRect(0, 0, 1500, 600);
  caption(g, 'Étincelles · orientations et vitesse faible · diagnostic x30, aucun plancher de longueur', 1500);
  const vectors = [[120, 0], [0, 120], [-120, 0], [0, -120], [.0001, -.0001]];
  vectors.forEach(([vx, vy], i) => {
    g.fillStyle = '#d9d4bd'; g.font = '17px sans-serif'; g.textAlign = 'center'; g.fillText('v = ' + vx + ' / ' + vy, i * 300 + 150, 80);
    g.save(); g.translate(i * 300 + 150, 300); g.scale(30, 30);
    assert.ok(drawPaintedImpactParticle(g, sample('spark', 2, { x: 0, y: 0, vx, vy }))); g.restore();
  });
  save(geometry, 'spark-directions-low-speed.png', { type: 'Magnified isolated geometry diagnostic; low velocity retains its exact segment length' });

  const loader = { loadImage: url => loadImage(fileURLToPath(url)) };
  await Promise.all([loadPaintedParticles(loader), loadPaintedWalkers(loader), loadPaintedCombat(loader),
    loadPaintedWorlds(loader), loadPaintedVesper(loader), loadPaintedVesperScenery(loader)]);
  panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png')); ids.set(panorama, 'panorama');
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    for (const type of ['spark', 'blast']) {
      const { state, inputs } = publicEmission(type), tracked = state.particles.find(p => p.type === type);
      const entry = { type, seed: 1511, missionId: state.missionId, deltaSeconds: 1 / 60, inputs,
        inputFrames: inputs.length, elapsedAtEmission: state.elapsed, initialCount: state.particles.filter(p => p.type === type).length,
        sourceEvents: state.events.filter(e => ['shot', 'rocket', 'explosion'].includes(e.type)), stages: [], stateUnchangedByRendering: true };
      assert.ok(entry.sourceEvents.some(e => e.type === (type === 'spark' ? 'shot' : 'explosion')));
      writeFileSync(resolve(output, type + '-public-emission-state.json'), JSON.stringify(state) + '\n');
      renderScene(state, type + '-public-emission.png', false, type === 'spark' ? 'étincelles du vrai tir' : 'particules du vrai impact');
      clearPaintedParticleImpacts();
      renderScene(state, type + '-fallback.png', false, 'repli vectoriel, mêmes faits', true);
      for (const [key, image] of Object.entries(decoded)) setPaintedParticleImpactsImage(key, image);
      let last = null;
      for (let tick = 0; tick < 180 && tracked.life > 0; tick++) {
        const frame = paintedImpactParticleFrame(tracked);
        if (frame.name !== last) {
          entry.stages.push({ name: frame.name, elapsed: state.elapsed, x: tracked.x, y: tracked.y, vx: tracked.vx, vy: tracked.vy,
            life: tracked.life, maxLife: tracked.maxLife, radius: frame.radius, length: frame.length ?? null, angle: frame.angle ?? null });
          last = frame.name;
          if (frame.name === 'age-3') {
            const before = JSON.stringify(state);
            renderScene(state, type + '-age-3.png', false, 'âge réel 3 après évolution physique');
            renderScene(state, type + '-reduced-motion.png', true, 'même état, texture fixe sous mouvement réduit');
            const first = createCanvas(1600, 900), second = createCanvas(1600, 900);
            for (const canvas of [first, second]) Object.assign(Object.create(Renderer.prototype),
              { ctx: canvas.getContext('2d'), combatReducedMotion: true, visible: () => true }).drawParticles(state);
            assert.equal(sha(first.toBuffer('image/png')), sha(second.toBuffer('image/png')));
            assert.equal(JSON.stringify(state), before); entry.pausedPixelsIdentical = true;
          }
        }
        updateGame(state, 1 / 60, { brace: true });
      }
      assert.deepEqual(entry.stages.map(f => f.name), ['age-0', 'age-1', 'age-2', 'age-3', 'age-4', 'age-5']);
      assert.ok(!state.particles.includes(tracked)); assert.equal(paintedImpactParticleFrame(tracked), null);
      entry.expiredBySimulation = true; receipt.publicEmissions.push(entry);
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  for (const source of sources) assert.equal(sha(readFileSync(resolve(root, source))), receipt.sourceHashes[source], source + ': unchanged during reception');
  receipt.completed = true; receipt.counts = { atlases: receipt.atlases.length, frames: receipt.frames.length,
    geometryChecks: receipt.geometryChecks.length, publicEmissions: receipt.publicEmissions.length, views: receipt.views.length };
  console.log(JSON.stringify({ completed: true, output, ...receipt.counts }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); }
