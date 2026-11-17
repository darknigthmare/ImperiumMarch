/** Real PNG/Canvas reception of the existing walker muzzle and five purge puffs.
 * Public inputs produce the scenes; isolated clips remain explicit diagnostics. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WALKERS } from '../src/content.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { PAINTED_WALKER_FX_LAYOUT } from '../src/painted-walker-fx-layout.mjs';
import { WALKER_MUZZLE_CORE_POINTS, loadPaintedWalkerFx, paintedWalkerFxStatus,
  setPaintedWalkerFxImage, clearPaintedWalkerFx, paintedMuzzleFlashFrame,
  paintedVentPuffFrame, drawPaintedMuzzleFlash, drawPaintedVentPuff } from '../src/painted-walker-fx.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedVesper } from '../src/painted-vesper.mjs';
import { loadPaintedVesperScenery } from '../src/painted-vesper-scenery.mjs';
import { loadPaintedVesperIndustry } from '../src/painted-vesper-industry.mjs';
import { loadPaintedParticles } from '../src/painted-particles.mjs';
import { loadPaintedParticleImpacts } from '../src/painted-particle-impacts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-walker-fx-qa');
const require = createRequire(import.meta.url); let canvasApi;
try { canvasApi = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('@napi-rs/canvas is required', { cause });
  canvasApi = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage } = canvasApi, sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/walker-fx/manifest.json')));
const prompts = JSON.parse(readFileSync(resolve(root, 'assets/painted/walker-fx/prompts.json')));
const sourcePaths = ['assets/painted/walker-fx/manifest.json', 'assets/painted/walker-fx/prompts.json',
  'assets/painted/walker-fx/README.md', 'src/painted-walker-fx.mjs', 'src/painted-walker-fx-layout.mjs',
  'tools/index-painted-walker-fx.py', 'tools/test-painted-walker-fx.mjs', 'tests/painted-walker-fx.test.mjs',
  'src/renderer.mjs', 'src/main.mjs', 'src/simulation.mjs', 'src/content.mjs', 'assets/art/vesper-panorama.png'];
mkdirSync(output, { recursive: true });
const receipt = { version: '0.15.11', createdUtc: new Date().toISOString(), completed: false,
  type: 'Decoded original PNGs, real Canvas clips and public-input scenes',
  browserExecuted: false, humanPlaytestPerformed: false, atlases: [], frames: [], clipChecks: [], views: [],
  publicInputs: [], sourceHashes: Object.fromEntries(sourcePaths.map(p => [p, sha(readFileSync(resolve(root, p)))])),
  limitations: ['The contact sheet and clip tests are isolated artwork diagnostics.',
    'Scene actors, timing, heat and firing come only from createGame/updateGame public inputs.',
    'The scene renderer explicitly receives the decoded historical Vesper panorama.',
    'No enemy muzzle, hit flash, new particle, RNG call, collider or saved field is created.',
    'AS09/AS22 remain partial; Canvas does not receive browser behavior, hardware performance or human artistic approval.'] };
const decoded = {}, ids = new WeakMap();
let panorama;
const frameCounts = { muzzle: new Set(), vent: new Set() };
function caption(ctx, label, width) {
  ctx.fillStyle = '#14262fe8'; ctx.fillRect(0, 0, width, 38);
  ctx.font = '15px sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#e7d7ba'; ctx.fillText(label, 15, 25, width - 30);
}
function save(canvas, file, info = {}) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  receipt.views.push({ file, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...info });
}
function register() { for (const [key, image] of Object.entries(decoded)) setPaintedWalkerFxImage(key, image); }
function publicTick(state, inputs, delta, input) { updateGame(state, delta, input); inputs.push({ delta, input }); }
function renderScene(state, file, description, { reducedMotion = false, expectMuzzle, expectVent, expectedFallback = false } = {}) {
  const before = JSON.stringify(state), canvas = createCanvas(1600, 900), renderer = new Renderer(canvas), ctx = canvas.getContext('2d');
  renderer.panorama = panorama; renderer.panoramaReady = true;
  const drawCalls = { muzzle: [], vent: [] }, original = ctx.drawImage;
  ctx.drawImage = function (...args) {
    const key = ids.get(args[0]);
    if (key) {
      const match = Object.entries(PAINTED_WALKER_FX_LAYOUT[key].frames).find(([, frame]) => frame.source.every((value, i) => value === args[i + 1]));
      assert.ok(match); frameCounts[key].add(match[0]);
      const m = ctx.getTransform();
      drawCalls[key].push({ frame: match[0], alpha: ctx.globalAlpha, transform: [m.a, m.b, m.c, m.d, m.e, m.f] });
    }
    return original.apply(this, args);
  };
  renderer.render(state, { reducedMotion, shake: false });
  assert.equal(JSON.stringify(state), before);
  if (expectMuzzle !== undefined) assert.equal(drawCalls.muzzle.length, expectMuzzle);
  if (expectVent !== undefined) assert.equal(drawCalls.vent.length, expectVent);
  const pixelSha256BeforeCaption = sha(canvas.toBuffer('image/png'));
  if (file) {
    caption(ctx, state.missionId + ' · ' + state.walker.name + ' · ' + description + ' · commandes publiques / Canvas', canvas.width);
    save(canvas, file, { type: 'Public-input Canvas scene', missionId: state.missionId, walkerId: state.walkerId,
      elapsed: state.elapsed, facing: state.player.facing, aimAngle: state.player.aimAngle,
      fireCooldown: state.player.fireCooldown, fireRate: state.walker.fireRate, heat: state.player.heat,
      venting: state.player.venting, reducedMotion, expectedFallback, panoramaLoaded: true,
      sourcePanorama: 'assets/art/vesper-panorama.png', drawCalls, stateSha256: sha(before), pixelSha256BeforeCaption });
    writeFileSync(resolve(output, file.replace('.png', '-state.json')), before + '\n');
  }
  return { drawCalls, pixelSha256BeforeCaption };
}

try {
  await loadPaintedWalkerFx({ loadImage: async (url, key) => {
    try {
    const path = fileURLToPath(url), bytes = readFileSync(path), image = await loadImage(path);
    const file = manifest.files.find(f => f.id === key), selected = prompts.attempts.find(a => a.selected && a.output === file.path);
    assert.equal(sha(bytes), file.sha256); assert.equal(sha(bytes), selected.sha256);
    // ImageGen source paths attest the local production session; they are not
    // dependencies of a fresh repository checkout. Their recorded hash remains
    // mandatory above, and the original bytes are also compared when available.
    const originalSourceAvailable = existsSync(selected.generatedSource);
    if (originalSourceAvailable) assert.equal(sha(readFileSync(selected.generatedSource)), file.sha256);
    assert.deepEqual([image.width, image.height], file.dimensions);
    const surface = createCanvas(image.width, image.height), ctx = surface.getContext('2d'); ctx.drawImage(image, 0, 0);
    const rgba = ctx.getImageData(0, 0, image.width, image.height).data;
    const alpha = (x, y) => rgba[(y * image.width + x) * 4 + 3];
    let transparent = 0; for (let i = 3; i < rgba.length; i += 4) if (!rgba[i]) transparent++;
    assert.ok(transparent / (image.width * image.height) > .5);
    for (const [name, frame] of Object.entries(PAINTED_WALKER_FX_LAYOUT[key].frames)) {
      const [cx, cy, cw, ch] = frame.cell, [sx, sy, sw, sh] = frame.source;
      let gutter = 0, visible = 0, useful = 0, maxRadius = 0;
      for (let y = cy; y < cy + ch; y++) for (let x = cx; x < cx + cw; x++) {
        const a = alpha(x, y);
        if (x < cx + 3 || x >= cx + cw - 3 || y < cy + 3 || y >= cy + ch - 3) gutter = Math.max(gutter, a);
        if (!a) continue;
        visible++; assert.ok(x >= sx && y >= sy && x < sx + sw && y < sy + sh);
        if (a >= frame.anchorAlphaThreshold) {
          useful++;
          if (key === 'vent') {
            const [ax, ay] = frame.anchors.sourceOrigin;
            maxRadius = Math.max(maxRadius, Math.hypot(Math.max(Math.abs(x - ax), Math.abs(x + 1 - ax)),
              Math.max(Math.abs(y - ay), Math.abs(y + 1 - ay))) / frame.sourceRadius);
          }
        }
      }
      assert.equal(gutter, frame.maxCellGutterAlpha); assert.ok(gutter <= 1);
      assert.equal(visible, frame.visiblePixels); assert.equal(useful, frame.anchorPixels);
      if (key === 'vent') assert.ok(maxRadius <= 1 + 1e-9);
      receipt.frames.push({ atlas: key, name, source: frame.source, target: frame.target,
        anchorAlphaThreshold: frame.anchorAlphaThreshold, visiblePixels: visible, usefulPixels: useful,
        maxCellGutterAlpha: gutter, maxUsefulNormalizedRadius: key === 'vent' ? maxRadius : null });
    }
    decoded[key] = image; ids.set(image, key);
    receipt.atlases.push({ id: key, dimensions: file.dimensions, bytes: bytes.length,
      sha256: sha(bytes), selectedSourceHashMatched: true, originalSourceAvailable,
      originalBytesIdentical: originalSourceAvailable ? true : null, transparentFraction: transparent / (image.width * image.height) });
    return image;
    } catch (error) { (receipt.decodingErrors ||= []).push({ atlas: key, error: error.stack || String(error) }); throw error; }
  } });
  assert.ok(Object.values(paintedWalkerFxStatus()).every(s => s.state === 'ready'),
    'Both atlases must decode and pass provenance checks: ' + JSON.stringify(receipt.decodingErrors || []));
  assert.equal(receipt.frames.length, 10);

  // Check exact historical support on a real raster canvas, with an enclosing
  // caller clip and caller alpha. One-pixel adjacency accommodates edge AA.
  for (const key of ['muzzle', 'vent']) for (let stage = 0; stage < (key === 'muzzle' ? 4 : 6); stage++) {
    const surface = createCanvas(256, 256), mask = createCanvas(256, 256), ctx = surface.getContext('2d'), mc = mask.getContext('2d');
    for (const c of [ctx, mc]) { c.beginPath(); c.rect(8, 8, 240, 240); c.clip(); }
    ctx.globalAlpha = .47; ctx.imageSmoothingEnabled = false; const alphaBefore = ctx.globalAlpha;
    if (key === 'muzzle') {
      for (const c of [ctx, mc]) { c.translate(30, 128); c.scale(4, 4); }
      const options = { fireRate: .25, fireCooldown: .25 - (stage + .5) / 4 * .15, muzzleX: 0 };
      assert.ok(drawPaintedMuzzleFlash(ctx, options));
      mc.beginPath(); mc.moveTo(...WALKER_MUZZLE_CORE_POINTS[0]);
      for (const point of WALKER_MUZZLE_CORE_POINTS.slice(1)) mc.lineTo(...point);
      mc.closePath(); mc.fillStyle = '#ffffff'; mc.fill();
    } else {
      assert.ok(drawPaintedVentPuff(ctx, { x: 128, y: 128, radius: 56, phase: (stage + .5) / 6 }));
      mc.beginPath(); mc.arc(128, 128, 56, 0, Math.PI * 2); mc.fillStyle = '#ffffff'; mc.fill();
    }
    assert.equal(ctx.globalAlpha, alphaBefore); assert.equal(ctx.imageSmoothingEnabled, false);
    const pixels = ctx.getImageData(0, 0, 256, 256).data, allowed = mc.getImageData(0, 0, 256, 256).data;
    let painted = 0, peak = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const a = pixels[(y * 256 + x) * 4 + 3]; if (!a) continue;
      painted++; peak = Math.max(peak, a);
      let inside = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if (x + dx >= 0 && x + dx < 256 && y + dy >= 0 && y + dy < 256 && allowed[((y + dy) * 256 + x + dx) * 4 + 3]) inside = true;
      assert.ok(inside, key + '/' + stage + ': no pixel beyond historical support');
    }
    assert.ok(painted > 100); assert.ok(peak <= Math.ceil(alphaBefore * 255) + 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#ffffff'; ctx.fillRect(10, 10, 5, 5);
    assert.ok(ctx.getImageData(12, 12, 1, 1).data[3] > 0, 'effect clip restored');
    ctx.fillRect(0, 0, 4, 4); assert.equal(ctx.getImageData(1, 1, 1, 1).data[3], 0, 'caller clip retained');
    receipt.clipChecks.push({ atlas: key, frame: 'age-' + stage, paintedPixels: painted, peakAlpha: peak,
      callerAlphaPreserved: true, callerSmoothingPreserved: true, callerClipPreserved: true, historicalSupportPreserved: true });
  }

  const sheet = createCanvas(1200, 760), sc = sheet.getContext('2d');
  sc.fillStyle = '#203540'; sc.fillRect(0, 0, 1200, 760);
  caption(sc, 'Walker FX · diagnostic isolé : core 4× puis taille réelle ; vapeur pleine opacité puis alpha historique', 1200);
  for (let stage = 0; stage < 4; stage++) {
    const x = stage * 300, opts = { fireRate: .25, fireCooldown: .25 - (stage + .5) / 4 * .15, muzzleX: 0 };
    sc.fillStyle = '#b9c1b0'; sc.fillRect(x + 8, 50, 142, 260);
    sc.fillStyle = '#243b43'; sc.fillRect(x + 150, 50, 142, 260);
    sc.fillStyle = '#fff0ca'; sc.font = '15px sans-serif'; sc.fillText('muzzle / age-' + stage, x + 25, 77);
    sc.save(); sc.translate(x + 35, 145); sc.scale(4, 4); assert.ok(drawPaintedMuzzleFlash(sc, opts)); sc.restore();
    sc.save(); sc.translate(x + 130, 250); assert.ok(drawPaintedMuzzleFlash(sc, opts)); sc.restore();
  }
  for (let stage = 0; stage < 6; stage++) {
    const x = stage * 200, phase = (stage + .5) / 6;
    sc.fillStyle = '#b9c1b0'; sc.fillRect(x + 8, 328, 92, 410);
    sc.fillStyle = '#243b43'; sc.fillRect(x + 100, 328, 92, 410);
    sc.fillStyle = '#fff0ca'; sc.font = '14px sans-serif'; sc.fillText('vent / age-' + stage, x + 25, 354);
    assert.ok(drawPaintedVentPuff(sc, { x: x + 100, y: 450, radius: 65, phase }));
    sc.globalAlpha = (1 - phase) * .18;
    assert.ok(drawPaintedVentPuff(sc, { x: x + 100, y: 630, radius: 9 + phase * 27, phase })); sc.globalAlpha = 1;
  }
  save(sheet, 'walker-fx-contact-sheet.png', { type: 'Isolated diagnostic; no game actor or event claimed' });

  const loader = { loadImage: url => loadImage(fileURLToPath(url)) };
  await Promise.all([loadPaintedWalkers(loader), loadPaintedCombat(loader), loadPaintedVesper(loader),
    loadPaintedVesperScenery(loader), loadPaintedVesperIndustry(loader), loadPaintedParticles(loader), loadPaintedParticleImpacts(loader)]);
  panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    let bastion, bastionInputs;
    for (const [index, walker] of WALKERS.entries()) {
      const state = createGame({ missionId: 'MI01', walkerId: walker.id, difficulty: 'story', seed: 1511 }), inputs = [];
      const facing = index % 2 ? -1 : 1, aimX = state.player.x + facing * 900, aimY = state.player.y + (index % 2 ? -100 : 80);
      publicTick(state, inputs, 1 / 60, { move: facing, brace: true, fire: true, aimX, aimY });
      publicTick(state, inputs, .001, { brace: true, vent: true, aimX, aimY });
      assert.ok(state.events.some(e => e.type === 'shot')); assert.equal(state.player.venting, true);
      renderScene(state, walker.id.toLowerCase() + '-public-shot-and-vent.png', 'tir primaire puis purge immédiate', { expectMuzzle: 1, expectVent: 5 });
      receipt.publicInputs.push({ walkerId: walker.id, seed: 1511, inputs: structuredClone(inputs),
        fireWindow: walker.fireRate - .1, events: state.events.filter(e => ['shot', 'rocket'].includes(e.type)),
        noActorOrEffectInjection: true, noRenderMutation: true });
      if (walker.id === 'WK05') { bastion = state; bastionInputs = inputs; }
    }
    while (paintedMuzzleFlashFrame({ fireCooldown: bastion.player.fireCooldown, fireRate: bastion.walker.fireRate }).name !== 'age-2')
      publicTick(bastion, bastionInputs, .01, { brace: true, vent: true, aimX: bastion.player.aimX, aimY: bastion.player.aimY });
    const received = renderScene(bastion, 'wk05-public-age-2.png', 'âge réel 2 du flash', { expectMuzzle: 1, expectVent: 5 });
    const paused = renderScene(bastion, null, '', { expectMuzzle: 1, expectVent: 5 });
    assert.equal(paused.pixelSha256BeforeCaption, received.pixelSha256BeforeCaption);
    const reduced = renderScene(bastion, 'wk05-reduced-motion.png', 'même état / mouvements réduits', { reducedMotion: true, expectMuzzle: 1, expectVent: 5 });
    assert.equal(reduced.drawCalls.muzzle[0].frame, 'age-0');
    const reducedAgain = renderScene(bastion, null, '', { reducedMotion: true, expectMuzzle: 1, expectVent: 5 });
    assert.equal(reducedAgain.pixelSha256BeforeCaption, reduced.pixelSha256BeforeCaption);
    receipt.pausedCanvasPixelsIdentical = { normal: true, reducedMotion: true };
    clearPaintedWalkerFx();
    renderScene(bastion, 'wk05-fallback.png', 'même état / repli vectoriel', { expectMuzzle: 0, expectVent: 0, expectedFallback: true });
    register();
    receipt.publicInputs.push({ walkerId: 'WK05', scenario: 'continued age-2 and unchanged paused/reduced/fallback views', inputs: bastionInputs });
    const hot = createGame({ missionId: 'MI01', walkerId: 'WK05', difficulty: 'story', seed: 1511 }), heatInputs = [];
    while (hot.player.heat <= 78 && heatInputs.length < 900)
      publicTick(hot, heatInputs, 1 / 60, { brace: true, fire: true, aimX: 1000, aimY: hot.player.y });
    assert.ok(hot.player.heat > 78);
    while (hot.player.fireCooldown > .1) publicTick(hot, heatInputs, 1 / 60, { brace: true });
    assert.equal(hot.player.venting, false); assert.ok(hot.player.heat > 70);
    renderScene(hot, 'wk05-public-hot-without-vent.png', 'chaleur réelle > 70 / ventilation non tenue', { expectMuzzle: 0, expectVent: 5 });
    receipt.publicInputs.push({ walkerId: 'WK05', scenario: 'sustained public firing then fire release; automatic hot puffs', inputs: heatInputs,
      heat: hot.player.heat, venting: hot.player.venting, shots: hot.stats.shots, noActorOrEffectInjection: true });
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }
  receipt.publicFramesObserved = Object.fromEntries(Object.entries(frameCounts).map(([key, names]) => [key, [...names].sort()]));
  receipt.panoramaDecoded = { width: panorama.width, height: panorama.height, sha256: receipt.sourceHashes['assets/art/vesper-panorama.png'] };
  receipt.completed = true; receipt.passed = true;
} catch (error) {
  receipt.error = error.stack || String(error); receipt.passed = false; process.exitCode = 1;
} finally {
  writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: receipt.passed, atlases: receipt.atlases.length, cells: receipt.frames.length,
  clipChecks: receipt.clipChecks.length, publicScenarios: receipt.publicInputs.length, views: receipt.views.length, error: receipt.error }));
