/** Decode original particle PNGs and receive real public-input Canvas scenes.
 * This is neither browser execution nor a human artistic approval.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_PARTICLES_LAYOUT } from '../src/painted-particles-layout.mjs';
import { PAINTED_PARTICLE_COLORS, loadPaintedParticles, clearPaintedParticles, setPaintedParticlesImage,
  paintedParticlesStatus, paintedParticleFrame, drawPaintedParticle } from '../src/painted-particles.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWorlds } from '../src/painted-worlds.mjs';
import { loadPaintedVesper } from '../src/painted-vesper.mjs';
import { loadPaintedVesperScenery } from '../src/painted-vesper-scenery.mjs';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-particles-qa');
const require = createRequire(import.meta.url); let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Particle reception requires @napi-rs/canvas', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage } = api, sha = value => createHash('sha256').update(value).digest('hex');
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, a + ' differs from ' + b);
mkdirSync(output, { recursive: true });
const sources = ['src/painted-particles.mjs', 'src/painted-particles-layout.mjs',
  'assets/painted/particles/manifest.json', 'assets/painted/particles/prompts.json',
  'assets/painted/particles/README.md', 'tools/index-painted-particles.py',
  'tools/test-painted-particles.mjs', 'tests/painted-particles.test.mjs',
  'src/renderer.mjs', 'src/simulation.mjs', 'src/content.mjs'];
const receipt = { version: '0.15.10', createdUtc: new Date().toISOString(), completed: false,
  type: 'Original PNG decoding, circular-support checks and public-input particle Canvas scenes',
  browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], views: [], publicEmissions: [], renderedCircleChecks: [],
  anchorPolicy: 'Center/radius use alpha>=2 after comparing thresholds 2, 8 and 32. Every source pixel remains in the crop; alpha-1 residue is excluded from measurement only. Runtime clips the whole draw to the historical circle.',
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  limitations: ['The contact sheet is an isolated artwork diagnostic; it creates no game particle.',
    'Game scenes start through createGame and use only updateGame inputs; no actor or particle is teleported or inserted.',
    'The painted lot changes no contact, collision, counter, lifetime, emission, RNG state or saved field.',
    'AS22 remains partial: material-specific impacts, ricochets, flames, debris and persistent traces are not added.',
    'Canvas does not certify native browser behavior, audio, hardware performance or human artistic approval.'] };
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/particles/manifest.json')));
const prompts = JSON.parse(readFileSync(resolve(root, 'assets/painted/particles/prompts.json')));
const decoded = {}, ids = new WeakMap();
const historicalAlpha = p => Math.max(0, Math.min(1, p.life / p.maxLife)) * (p.type === 'smoke' ? .32 : 1);
function save(canvas, file, info = {}) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  receipt.views.push({ file, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...info });
}
function caption(ctx, text, width) {
  ctx.fillStyle = '#15262ee8'; ctx.fillRect(0, 0, width, 38);
  ctx.fillStyle = '#e6dac4'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(text, 16, 25, width - 32);
}
function register() {
  for (const [key, image] of Object.entries(decoded)) setPaintedParticlesImage(key, image);
}
function renderScene(state, file, reducedMotion, info = {}) {
  const before = JSON.stringify(state), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), ctx = canvas.getContext('2d');
  const calls = {}, original = ctx.drawImage;
  ctx.drawImage = function (...args) {
    const key = ids.get(args[0]); if (key) calls[key] = (calls[key] || 0) + 1;
    return original.apply(this, args);
  };
  renderer.render(state, { reducedMotion, shake: false });
  assert.equal(JSON.stringify(state), before);
  caption(ctx, 'MI01 · ' + info.description + ' · commandes publiques · Canvas', canvas.width);
  save(canvas, file, { type: 'Public-input Canvas scene', missionId: state.missionId, elapsed: state.elapsed,
    reducedMotion, particleDrawCalls: calls, particlesByType: state.particles.reduce((map, p) => {
      map[p.type] = (map[p.type] || 0) + 1; return map;
    }, {}), stateSha256: sha(before), ...info });
  return calls;
}
function publicEmission(type) {
  const state = createGame({ missionId: 'MI01', walkerId: 'WK05', difficulty: 'story', seed: 1510 }), inputs = [];
  while (inputs.length < 600 && !state.particles.some(p => p.type === type)) {
    const input = type === 'dust' ? { move: 1 }
      : { brace: true, secondary: inputs.length === 0, aimX: 600, aimY: terrainAt(600, state.planetId) + 20 };
    updateGame(state, 1 / 60, input); inputs.push(input);
  }
  assert.ok(state.particles.some(p => p.type === type)); return { state, inputs };
}

try {
  clearPaintedParticles();
  await loadPaintedParticles({ loadImage: async (url, key) => {
    try {
    const bytes = readFileSync(fileURLToPath(url)), image = await loadImage(fileURLToPath(url)), atlas = PAINTED_PARTICLES_LAYOUT[key];
    const file = manifest.files.find(item => item.id === key);
    assert.equal(sha(bytes), file.sha256);
    assert.equal(sha(bytes), prompts.selectedOutputs.find(item => item.atlas === key).sha256);
    assert.deepEqual([image.width, image.height], atlas.size);
    const ctx = createCanvas(image.width, image.height).getContext('2d'); ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    const alpha = (x, y) => pixels[(y * image.width + x) * 4 + 3];
    let transparent = 0;
    for (let i = 3; i < pixels.length; i += 4) if (!pixels[i]) transparent++;
    assert.ok(transparent / (image.width * image.height) > .2);
    for (const [name, frame] of Object.entries(atlas.frames)) {
      const [cx, cy, cw, ch] = frame.cell, [sx, sy, sw, sh] = frame.source;
      const [ax, ay] = frame.anchors.sourceOrigin;
      assert.ok(sx >= cx && sy >= cy && sx + sw <= cx + cw && sy + sh <= cy + ch);
      let visible = 0, measured = 0, strong = 0, maxMeasuredRadius = 0, maxUnclippedRadius = 0, faintOutsideRadius = 0;
      for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) {
        const opacity = alpha(x, y);
        if (x < cx + 3 || x >= cx + cw - 3 || y < cy + 3 || y >= cy + ch - 3)
          assert.ok(opacity <= 2, key + '/' + name + ': clear cell separation');
        if (!opacity) continue;
        visible++; if (opacity >= 32) strong++;
        assert.ok(x >= sx && y >= sy && x < sx + sw && y < sy + sh, name + ': all alpha remains inside the crop');
        const dx = Math.max(Math.abs(x - ax), Math.abs(x + 1 - ax)), dy = Math.max(Math.abs(y - ay), Math.abs(y + 1 - ay));
        const normalizedRadius = Math.hypot(dx, dy) / frame.sourceRadius;
        maxUnclippedRadius = Math.max(maxUnclippedRadius, normalizedRadius);
        if (opacity >= 2) { measured++; maxMeasuredRadius = Math.max(maxMeasuredRadius, normalizedRadius); }
        else if (normalizedRadius > 1) faintOutsideRadius++;
      }
      assert.equal(visible, frame.visiblePixels); assert.equal(strong, frame.strongPixels);
      assert.equal(measured, frame.anchorPixels); assert.equal(visible - measured, frame.alpha1PixelsExcludedFromMeasurement);
      assert.equal(frame.anchorAlphaThreshold, 2);
      assert.ok(maxMeasuredRadius <= 1 + 1e-9, name + ': alpha>=2 fits the historical circle');
      assert.ok(strong > 1000);
      receipt.frames.push({ atlas: key, name, usage: 'runtime', source: frame.source,
        target: frame.target, visiblePixels: visible, strongPixels: strong, anchorPixels: measured,
        alpha1PixelsExcludedFromMeasurement: visible - measured, maxMeasuredRadius,
        maxUnclippedRadius, faintSourcePixelsBeyondRadius: faintOutsideRadius });
    }
    ids.set(image, key); decoded[key] = image;
    receipt.atlases.push({ id: key, sha256: sha(bytes), bytes: bytes.length, dimensions: atlas.size, transparentPixels: transparent });
    return image;
    } catch (error) {
      (receipt.decodingErrors ||= []).push({ atlas: key, error: error.stack || String(error) });
      throw error;
    }
  } });
  assert.ok(Object.values(paintedParticlesStatus()).every(status => status.state === 'ready'),
    'All particle atlases must decode: ' + JSON.stringify(receipt.decodingErrors || []));
  assert.equal(receipt.frames.length, 12);
  // Exercise the real Canvas clip, alpha, smoothing and enclosing caller clip.
  // A source rectangle may contain alpha-1 residue outside the measured radius;
  // none may escape the rendered circle (one pixel covers raster antialiasing).
  for (const type of ['smoke', 'dust']) for (let stage = 0; stage < 6; stage++) {
    const canvas = createCanvas(256, 256), ctx = canvas.getContext('2d');
    ctx.beginPath(); ctx.rect(8, 8, 240, 240); ctx.clip();
    ctx.translate(3, 5); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = .47;
    const alphaBefore = ctx.globalAlpha;
    const p = { type, color: PAINTED_PARTICLE_COLORS[type], x: 125, y: 123, size: 30,
      life: 1 - (stage + .5) / 6, maxLife: 1 }, frame = paintedParticleFrame(p);
    assert.ok(drawPaintedParticle(ctx, p));
    assert.equal(ctx.globalAlpha, alphaBefore); assert.equal(ctx.imageSmoothingEnabled, false);
    const rgba = ctx.getImageData(0, 0, 256, 256).data;
    let drawnPixels = 0, maxRenderedPixelRadius = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      if (!rgba[(y * 256 + x) * 4 + 3]) continue;
      const distance = Math.hypot(x + .5 - 128, y + .5 - 128);
      drawnPixels++; maxRenderedPixelRadius = Math.max(maxRenderedPixelRadius, distance);
      assert.ok(distance <= frame.radius + 1, type + '/' + frame.name + ': runtime circle clips all pixels');
    }
    assert.ok(drawnPixels > 100);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(6, 4, 5, 5);
    assert.ok(ctx.getImageData(10, 10, 1, 1).data[3] > 0, 'particle clip must be restored');
    ctx.fillRect(-3, -5, 4, 4);
    assert.equal(ctx.getImageData(1, 1, 1, 1).data[3], 0, 'caller clip must remain active');
    receipt.renderedCircleChecks.push({ atlas: type, frame: frame.name, radius: frame.radius,
      maxRenderedPixelRadius, drawnPixels, callerAlphaPreserved: true, callerSmoothingPreserved: true, callerClipPreserved: true });
  }

  const sheet = createCanvas(1800, 900), sheetCtx = sheet.getContext('2d');
  sheetCtx.fillStyle = '#17262c'; sheetCtx.fillRect(0, 0, sheet.width, sheet.height);
  caption(sheetCtx, 'AS22 · 12 cellules · en haut : source sans alpha historique ; en bas : alpha du renderer · diagnostic isolé', sheet.width);
  for (const [row, type] of ['smoke', 'dust'].entries()) for (let stage = 0; stage < 6; stage++) {
    const x = stage * 300, y = 42 + row * 425, life = 1 - (stage + .5) / 6;
    sheetCtx.fillStyle = '#c1c0ae'; sheetCtx.fillRect(x + 5, y, 145, 415);
    sheetCtx.fillStyle = '#293e47'; sheetCtx.fillRect(x + 150, y, 145, 415);
    sheetCtx.fillStyle = '#f3e2c3'; sheetCtx.font = '17px sans-serif'; sheetCtx.textAlign = 'center';
    sheetCtx.fillText(type + ' · age-' + stage, x + 150, y + 29);
    const p = { type, color: PAINTED_PARTICLE_COLORS[type], x: x + 150, y: y + 130,
      life, maxLife: 1, size: 75 / (type === 'smoke' ? 2 - life : 1) };
    sheetCtx.imageSmoothingEnabled = false;
    sheetCtx.globalAlpha = 1; assert.ok(drawPaintedParticle(sheetCtx, p)); near(sheetCtx.globalAlpha, 1);
    assert.equal(sheetCtx.imageSmoothingEnabled, false, 'real Canvas restores caller smoothing');
    p.y = y + 320; sheetCtx.globalAlpha = historicalAlpha(p);
    // Canvas backends may quantize alpha internally. Verify conservation of the
    // actual caller value, not whether the backend stores every decimal bit.
    const callerAlpha = sheetCtx.globalAlpha;
    assert.ok(drawPaintedParticle(sheetCtx, p)); assert.equal(sheetCtx.globalAlpha, callerAlpha); sheetCtx.globalAlpha = 1;
  }
  save(sheet, 'particles-contact-sheet.png', { type: 'All six ages per atlas on light and dark backgrounds; isolated diagnostic' });
  const loader = { loadImage: url => loadImage(fileURLToPath(url)) };
  await Promise.all([loadPaintedWalkers(loader), loadPaintedCombat(loader), loadPaintedWorlds(loader),
    loadPaintedVesper(loader), loadPaintedVesperScenery(loader)]);

  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    for (const type of ['dust', 'smoke']) {
      const { state, inputs } = publicEmission(type), tracked = state.particles.find(p => p.type === type);
      const emission = { type, missionId: state.missionId, seed: 1510, deltaSeconds: 1 / 60,
        inputFrames: inputs.length, inputs, elapsedAtEmission: state.elapsed,
        emittedCount: state.particles.filter(p => p.type === type).length,
        sourceEvents: state.events.filter(event => ['step', 'rocket', 'explosion'].includes(event.type)),
        stages: [], noRenderMutation: true };
      assert.ok(emission.sourceEvents.some(event => event.type === (type === 'dust' ? 'step' : 'explosion')));
      const before = JSON.stringify(state);
      writeFileSync(resolve(output, type + '-public-emission-state.json'), before + '\n');
      const calls = renderScene(state, type + '-public-emission.png', false,
        { description: type === 'dust' ? 'poussière des deux vrais appuis' : 'fumée du vrai impact de roquette' });
      assert.equal(calls[type], emission.emittedCount);
      clearPaintedParticles();
      const fallback = renderScene(state, type + '-fallback.png', false, { description: 'fallback des ressources non chargées' });
      assert.equal(fallback[type] || 0, 0); register();
      assert.equal(JSON.stringify(state), before);
      let last = null;
      for (let tick = 0; tick < 180 && tracked.life > 0; tick++) {
        const frame = paintedParticleFrame(tracked);
        if (frame.name !== last) {
          emission.stages.push({ frame: frame.name, elapsed: state.elapsed, life: tracked.life, maxLife: tracked.maxLife,
            x: tracked.x, y: tracked.y, size: tracked.size, radius: frame.radius, rendererAlpha: historicalAlpha(tracked) });
          last = frame.name;
          if (frame.name === 'age-3') {
            const snapshot = JSON.stringify(state);
            renderScene(state, type + '-age-3.png', false, { description: 'âge réel 3, après évolution physique' });
            renderScene(state, type + '-reduced-motion.png', true, { description: 'même état, réduction des mouvements' });
            assert.equal(JSON.stringify(state), snapshot);
            // A pause is a repeated render of unchanged game data, not elapsed wall time.
            const first = createCanvas(1600, 900), second = createCanvas(1600, 900);
            for (const canvas of [first, second]) Object.assign(Object.create(Renderer.prototype),
              { ctx: canvas.getContext('2d'), combatReducedMotion: true, visible: () => true }).drawParticles(state);
            assert.equal(sha(first.toBuffer('image/png')), sha(second.toBuffer('image/png')));
            emission.pausedParticlePixelsIdentical = true;
          }
        }
        updateGame(state, 1 / 60, { brace: true });
      }
      assert.deepEqual(emission.stages.map(stage => stage.frame), ['age-0', 'age-1', 'age-2', 'age-3', 'age-4', 'age-5']);
      assert.ok(!state.particles.includes(tracked)); assert.equal(paintedParticleFrame(tracked), null);
      emission.expiredBySimulation = true; receipt.publicEmissions.push(emission);
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  for (const source of sources) assert.equal(sha(readFileSync(resolve(root, source))), receipt.sourceHashes[source], source + ': stable during reception');
  receipt.completed = true;
  receipt.counts = { atlases: receipt.atlases.length, frames: receipt.frames.length, publicEmissions: receipt.publicEmissions.length, views: receipt.views.length };
  console.log(JSON.stringify({ completed: true, output, ...receipt.counts }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally { writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n'); }
