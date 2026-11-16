/** Actual PNG decoding, mechanical anchor checks and normal Canvas rendering.
 * These artifacts are neither browser screenshots nor a human playtest. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_WALKER_LAYOUT } from '../src/painted-walker-layout.mjs';
import { PAINTED_WALKER_URLS, PAINTED_WALKER_FRAME_NAMES, PAINTED_WALKER_MUZZLES,
  clearPaintedWalkers, loadPaintedWalkers, paintedWalkerStatus, paintedWalkerFrame } from '../src/painted-walkers.mjs';
import { loadPaintedCombat, paintedCombatStatus } from '../src/painted-combat.mjs';
import { loadPaintedSprites, paintedSpriteStatus } from '../src/painted-sprites.mjs';
import { Renderer, drawWalker } from '../src/renderer.mjs';
import { WALKERS } from '../src/content.mjs';
import { createGame, updateGame, terrainAt, radiatorBounds } from '../src/simulation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-walkers-qa');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('This reception requires actual PNG decoding through @napi-rs/canvas.', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sourcePaths = ['src/painted-walkers.mjs', 'src/painted-walker-layout.mjs', 'src/production-assets.mjs',
  'src/renderer.mjs', 'src/simulation.mjs', 'tools/test-painted-walkers.mjs'];
const report = { createdUtc: new Date().toISOString(), version: JSON.parse(readFileSync(resolve(root, 'package.json'))).version,
  type: 'Decoded PNG and articulated walker Canvas reception', completed: false, nativeBrowserExecuted: false, humanPlaytestPerformed: false,
  sourceHashes: Object.fromEntries(sourcePaths.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  atlases: [], frames: [], views: [], annotationChecks: [], checks: {},
  rendering: { lowerDistalClip: 'Canonical x <= 100 before optical correction; foot receiver covers the distal joint half',
    farParts: 'Opaque source image with brightness(0.7)', vectorRadiatorStates: ['hit', 'repairing'] },
  limitations: ['Canvas decoding, source anchor checks and diagnostic poses do not certify native browser UI, audio, human art approval or final animation quality.',
    'Damage and repair pose sheets explicitly use diagnostic copies; only the six complete mission scenes claim preparation through public movement inputs.'] };
mkdirSync(output, { recursive: true });
const decoded = {}, pixels = {}, decodeErrors = [], pictureIds = new WeakMap();
const near = (a, b, label) => assert.ok(Math.abs(a - b) < .002, `${label}: ${a} != ${b}`);
const pointNear = (a, b, label) => { near(a[0], b[0], `${label} x`); near(a[1], b[1], `${label} y`); };
const rotate = ([x, y], angle = 0) => [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
function sourcePoint(frame, [x, y]) {
  const [sx, sy, sw, sh] = frame.source, [dx, dy, dw, dh] = frame.target;
  return rotate([dx + (x - sx) * dw / sw, dy + (y - sy) * dh / sh], frame.rotation);
}
function occupied(data, width, [x, y, w, h]) {
  let count = 0;
  for (let row = y; row < y + h; row++) for (let column = x; column < x + w; column++) if (data[(row * width + column) * 4 + 3] > 128) count++;
  return count;
}
function observePaintedDraws(ctx) {
  const calls = [], original = ctx.drawImage;
  ctx.drawImage = function(...args) {
    const id = pictureIds.get(args[0]);
    if (id) {
      const frame = Object.entries(PAINTED_WALKER_LAYOUT[id].frames).find(([, item]) => item.source.every((value, i) => value === args[i + 1]))?.[0];
      const matrix = ctx.getTransform();
      calls.push({ walkerId: id, frame, source: args.slice(1, 5), target: args.slice(5), filter: ctx.filter, alpha: ctx.globalAlpha,
        transform: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f] });
    }
    return original.apply(ctx, args);
  };
  return calls;
}
function saveView(canvas, file, details) {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, file), bytes);
  report.views.push({ file, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...details });
}
function panel(ctx, x, y, width, height, light = false) {
  ctx.fillStyle = light ? '#d6d5c8' : '#20333b'; ctx.fillRect(x + 8, y + 8, width - 16, height - 16);
}
function captions(ctx, items) {
  // Annotations are a final, explicit canvas layer. No rig filter or drawing
  // order may obscure the labels that explain a diagnostic panel.
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = 'none'; ctx.globalAlpha = 1;
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  for (const { x, y, title, detail, light } of items) {
    const before = ctx.getImageData(x + 24, y + 20, 550, 52).data;
    ctx.fillStyle = light ? '#253b42' : '#d7dfca'; ctx.font = 'bold 21px "Courier New", monospace'; ctx.fillText(title, x + 25, y + 42);
    ctx.font = '14px "Courier New", monospace'; ctx.fillText(detail, x + 25, y + 66);
    const after = ctx.getImageData(x + 24, y + 20, 550, 52).data;
    let changed = 0;
    for (let index = 0; index < before.length; index += 4) if (before[index] !== after[index] || before[index + 1] !== after[index + 1] || before[index + 2] !== after[index + 2]) changed++;
    assert.ok(changed > 100, `${title}: diagnostic caption must actually appear in the rendered pixels`);
    report.annotationChecks.push({ title, detail, region: [x + 24, y + 20, 550, 52], changedPixels: changed, rgbaSha256: sha(after) });
  }
  ctx.restore();
}
function scenePartRenderer(ctx) {
  const renderer = Object.create(Renderer.prototype); renderer.ctx = ctx; return renderer;
}
function drawRig(ctx, state, centreX, floorY, scale) {
  const before = JSON.stringify(state), p = state.player;
  ctx.save(); ctx.translate(centreX - p.x * scale, floorY - p.groundY * scale); ctx.scale(scale, scale);
  ctx.strokeStyle = '#82948b'; ctx.lineWidth = 1 / scale; ctx.beginPath();
  for (let x = p.x - 210; x <= p.x + 210; x += 5) {
    const y = terrainAt(x, state.planetId); if (x === p.x - 210) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke(); drawWalker(ctx, p, state.walker, state.elapsed);
  scenePartRenderer(ctx).drawRadiator(state, state.elapsed); ctx.restore();
  assert.equal(JSON.stringify(state), before, `${state.walkerId}: art rendering changed game state`);
}
function initial(walkerId, missionId = 'MI01') { return createGame({ walkerId, missionId, difficulty: 'story', seed: 1533 }); }
function advance(state, ticks, input) {
  for (let tick = 0; tick < ticks && state.status === 'playing'; tick++) updateGame(state, 1 / 60, input);
  return state;
}
function diagnosticPoses(walkerId) {
  const normal = initial(walkerId);
  const backward = advance(initial(walkerId), 42, { move: -1 });
  const upward = initial(walkerId); advance(upward, 1, { aimX: upward.player.x + 500, aimY: upward.player.y - 600 });
  const downLeft = initial(walkerId); advance(downLeft, 1, { aimX: downLeft.player.x - 500, aimY: downLeft.player.y + 280 });
  const brace = advance(initial(walkerId), 1, { brace: true });
  const walking = initial(walkerId);
  for (let tick = 0; tick < 80; tick++) {
    updateGame(walking, 1 / 60, { move: 1 });
    if (walking.player.feet.some(foot => !foot.contact && foot.progress > .35 && foot.progress < .65)) break;
  }
  assert.ok(walking.player.feet.some(foot => !foot.contact), `${walkerId}: a physical step must actually occur`);
  const damaged = structuredClone(normal);
  damaged.player.hull = damaged.player.maxHull * .3; damaged.player.feet.forEach(foot => { foot.health = 20; }); damaged.player.radiator.health = 25;
  const repaired = structuredClone(normal);
  repaired.player.radiator.health = 85; repaired.player.radiator.repairKits = repaired.player.radiator.maxRepairKits - 1;
  const repairing = structuredClone(damaged);
  repairing.player.radiator.repairing = true; repairing.player.radiator.repairProgress = .5;
  return [
    { title: 'REPOS / DROITE', state: normal, provenance: 'Public createGame; original terrain and feet' },
    { title: 'RECUL / GAUCHE', state: backward, provenance: '42 public update ticks with move:-1' },
    { title: 'VISÉE HAUTE', state: upward, provenance: 'Public aim input; original terrain and feet' },
    { title: 'VISÉE BASSE / GAUCHE', state: downLeft, provenance: 'Public aim input; original terrain and feet' },
    { title: 'ANCRAGE', state: brace, provenance: 'Public brace input' },
    { title: 'TRANSFERT D’APPUI', state: walking, provenance: 'Public movement until one real foot enters mid-swing' },
    { title: 'DÉGÂTS / DIAGNOSTIC', state: damaged, provenance: 'Diagnostic copy: hull 30%, leg health 20, radiator health 25' },
    { title: 'RADIATEUR RÉPARÉ', state: repaired, provenance: 'Diagnostic copy: radiator health 85 and one used repair kit' },
    { title: 'RÉPARATION À 50 %', state: repairing, provenance: 'Diagnostic copy: continuous vector radiator repair at progress 0.5' },
  ];
}

try {
  clearPaintedWalkers();
  await loadPaintedWalkers({ loadImage: async (url, id) => {
    try {
      const path = fileURLToPath(url), bytes = readFileSync(path), picture = await loadImage(path);
      const canvas = createCanvas(picture.width, picture.height), ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
      const data = ctx.getImageData(0, 0, picture.width, picture.height).data;
      let clear = 0, nearClear = 0, solid = 0;
      for (let index = 3; index < data.length; index += 4) { if (!data[index]) clear++; if (data[index] < 16) nearClear++; if (data[index] > 128) solid++; }
      assert.ok(clear > 1000 && nearClear > picture.width * picture.height * .05, `${id}: genuine transparent space required`);
      assert.ok(solid > 1000, `${id}: visible painted art required`);
      decoded[id] = picture; pixels[id] = data; pictureIds.set(picture, id);
      report.atlases.push({ walkerId: id, file: path.slice(root.length + 1), width: picture.width, height: picture.height,
        bytes: bytes.length, sha256: sha(bytes), clearPixels: clear, nearClearPixels: nearClear, opaquePixels: solid });
      return picture;
    } catch (error) { decodeErrors.push({ walkerId: id, error: error.message }); throw error; }
  } });
  assert.equal(Object.keys(decoded).length, 6, `All six original PNGs must decode: ${JSON.stringify(decodeErrors)}`);
  assert.ok(Object.values(paintedWalkerStatus()).every(status => status.state === 'ready'), 'A failed image is not a passed art reception');
  for (const walker of WALKERS) {
    const id = walker.id, atlas = PAINTED_WALKER_LAYOUT[id], picture = decoded[id];
    assert.deepEqual(Object.keys(atlas.frames), PAINTED_WALKER_FRAME_NAMES);
    for (const [index, name] of PAINTED_WALKER_FRAME_NAMES.entries()) {
      const frame = paintedWalkerFrame(id, name); assert.ok(frame, `${id}/${name}: valid frame mapping`);
      const [x, y, width, height] = frame.source;
      assert.ok(frame.source.every(Number.isInteger), `${id}/${name}: source coordinates must address whole pixels`);
      const col = index % 4, row = Math.floor(index / 4);
      // The generator can return dimensions such as 1254; cell edges must be
      // independently rounded, not truncated to a fictional uniform pixel size.
      const left = Math.round(col * picture.width / 4), top = Math.round(row * picture.height / 4);
      const right = Math.round((col + 1) * picture.width / 4), bottom = Math.round((row + 1) * picture.height / 4);
      assert.ok(x >= left && y >= top && x + width <= right && y + height <= bottom, `${id}/${name}: crop crosses a neighbour cell`);
      const count = occupied(pixels[id], picture.width, frame.source), total = occupied(pixels[id], picture.width, [left, top, right - left, bottom - top]);
      assert.ok(count > 20, `${id}/${name}: empty crop`);
      assert.ok(total - count < Math.max(50, total * .01), `${id}/${name}: significant silhouette excluded by crop`);
      let edgePixels = 0;
      for (let column = left; column < right; column++) for (const row of [top, bottom - 1]) if (pixels[id][(row * picture.width + column) * 4 + 3] > 128) edgePixels++;
      for (let row = top + 1; row < bottom - 1; row++) for (const column of [left, right - 1]) if (pixels[id][(row * picture.width + column) * 4 + 3] > 128) edgePixels++;
      assert.equal(edgePixels, 0, `${id}/${name}: opaque silhouette touches the atlas cell border`);
      assert.ok(frame.anchors?.sourcePivot, `${id}/${name}: measured source pivot`);
      pointNear(sourcePoint(frame, frame.anchors.sourcePivot), [0, 0], `${id}/${name}: pivot mapping`);
      if (name.startsWith('upper') || name.startsWith('lower')) pointNear(sourcePoint(frame, frame.anchors.sourceEndpoint), [100, 0], `${id}/${name}: segment endpoint`);
      if (name === 'turret') pointNear(sourcePoint(frame, frame.anchors.sourceMuzzle), [PAINTED_WALKER_MUZZLES[id], 0], `${id}/${name}: muzzle`);
      if (name.startsWith('foot')) pointNear(sourcePoint(frame, frame.anchors.sourceAnkle), [0, -8], `${id}/${name}: ankle receiver`);
      let opticalTip = null, soleBottom = null;
      if (name === 'turret' || name.startsWith('foot')) {
        let maxX = -Infinity, maxY = -Infinity;
        for (let row = y; row < y + height; row++) for (let column = x; column < x + width; column++) if (pixels[id][(row * picture.width + column) * 4 + 3] > 128) {
          const point = sourcePoint(frame, [column + .5, row + .5]); maxX = Math.max(maxX, point[0]); maxY = Math.max(maxY, point[1]);
        }
        if (name === 'turret') {
          opticalTip = maxX;
          assert.ok(Math.abs(opticalTip - PAINTED_WALKER_MUZZLES[id]) <= 2.5, `${id}: visible muzzle differs from physical muzzle by more than 2.5 units`);
        } else {
          soleBottom = maxY;
          assert.ok(Math.abs(soleBottom) <= 1.5, `${id}/${name}: painted sole must meet the authoritative contact plane`);
        }
      }
      report.frames.push({ walkerId: id, frame: name, source: frame.source, target: frame.target, rotation: frame.rotation || 0,
        anchors: frame.anchors, occupiedPixels: count, cellPixels: total, cellEdgePixels: edgePixels,
        ...(opticalTip !== null ? { opticalTip } : {}), ...(soleBottom !== null ? { soleBottom } : {}) });
    }
  }
  report.checks.originalPNGsDecoded = true; report.checks.all96CropsContainTheirSilhouettes = true; report.checks.measuredPivotsMatchMechanicalRig = true;

  // Existing painted assets remain loaded in full scenes, so the reception
  // represents the current assembled renderer, not a vector-only environment.
  const contextLoad = url => loadImage(fileURLToPath(url));
  await Promise.all([loadPaintedCombat({ loadImage: contextLoad }), loadPaintedSprites({ loadImage: contextLoad })]);
  const contextStates = { combat: paintedCombatStatus(), workshop: paintedSpriteStatus() };
  assert.ok(Object.values(contextStates).every(group => Object.values(group).every(status => status.state === 'ready')), 'Existing painted scene context must decode');
  report.contextAtlasCounts = { combat: Object.keys(contextStates.combat).length, workshop: Object.keys(contextStates.workshop).length };
  const oldImage = globalThis.Image, oldWindow = globalThis.window;
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  try {
    const fleet = createCanvas(2100, 1400), fleetCtx = fleet.getContext('2d'), fleetDraws = observePaintedDraws(fleetCtx);
    fleetCtx.fillStyle = '#10242b'; fleetCtx.fillRect(0, 0, fleet.width, fleet.height);
    fleetCtx.fillStyle = '#d5dfc7'; fleetCtx.font = 'bold 28px "Courier New", monospace'; fleetCtx.fillText('ORDRE DE CENDRE / SIX MARCHEURS PEINTS', 35, 45);
    fleetCtx.font = '16px "Courier New", monospace'; fleetCtx.fillText('Même échelle 1,55 px/unité · pièces articulées · vrais contacts · réception Canvas', 35, 73);
    const fleetStates = [], fleetCaptions = [];
    for (const [index, walker] of WALKERS.entries()) {
      const x = index % 3 * 700, y = 92 + Math.floor(index / 3) * 650, state = initial(walker.id);
      panel(fleetCtx, x, y, 700, 640, index % 2 === 1);
      fleetCaptions.push({ x, y, title: `${walker.id} ${walker.name.toUpperCase()} ${walker.designation}`,
        detail: `${walker.legs} APPUIS / ${walker.height} UNITÉS SOUS COQUE`, light: index % 2 === 1 });
      drawRig(fleetCtx, state, x + 350, y + 560, 1.55);
      fleetStates.push({ walkerId: walker.id, stateSha256: sha(JSON.stringify(state)), feet: structuredClone(state.player.feet) });
    }
    captions(fleetCtx, fleetCaptions);
    assert.equal(fleetDraws.length, WALKERS.reduce((count, walker) => count + walker.legs * 5 + 3, 0));
    for (const walker of WALKERS) {
      const calls = fleetDraws.filter(call => call.walkerId === walker.id), farCount = walker.legs / 2 * 5;
      assert.equal(calls.findIndex(call => call.frame === 'hull'), farCount, `${walker.id}: far legs must precede the hull`);
      assert.ok(calls.slice(0, farCount).every(call => call.filter.includes('brightness(0.7)') && call.alpha === 1), `${walker.id}: far limbs remain opaque and darker`);
      assert.ok(calls.slice(farCount).every(call => !call.filter.includes('brightness')), `${walker.id}: shading cannot leak onto near parts`);
      assert.equal(calls.at(-2).frame, 'turret'); assert.equal(calls.at(-1).frame, 'radiator');
    }
    saveView(fleet, 'walkers-common-scale.png', { type: 'Normal drawWalker and radiator path, public initial states', scale: 1.55,
      paintedDrawCalls: fleetDraws.length, states: fleetStates });

    for (const walker of WALKERS) {
      const canvas = createCanvas(1800, 1880), ctx = canvas.getContext('2d'), draws = observePaintedDraws(ctx), poses = diagnosticPoses(walker.id), poseRecords = [], poseCaptions = [];
      ctx.fillStyle = '#10242b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#d8dfc9'; ctx.font = 'bold 25px "Courier New", monospace'; ctx.fillText(`${walker.id} / ${walker.name.toUpperCase()} / POSES ET ÉTATS`, 30, 40);
      ctx.font = '15px "Courier New", monospace'; ctx.fillText('Appuis réels sur terrain · dégâts/réparation : copies de diagnostic · même échelle 1,25', 30, 69);
      for (const [index, pose] of poses.entries()) {
        const x = index % 3 * 600, y = 100 + Math.floor(index / 3) * 590, start = draws.length;
        panel(ctx, x, y, 600, 580, index % 2 === 1);
        poseCaptions.push({ x, y, title: pose.title, detail: index >= 6 ? 'ÉTAT VISUEL DE DIAGNOSTIC' : 'POSE ISSUE DES COMMANDES PUBLIQUES', light: index % 2 === 1 });
        drawRig(ctx, pose.state, x + 300, y + 505, 1.25);
        const used = draws.slice(start), expected = walker.legs * 5 + (pose.state.player.radiator.repairing ? 2 : 3);
        assert.equal(used.length, expected, `${walker.id}/${pose.title}: actual painted part consumption`);
        poseRecords.push({ title: pose.title, provenance: pose.provenance, elapsed: pose.state.elapsed,
          stateSha256: sha(JSON.stringify(pose.state)), paintedDrawCalls: used.length, frames: used.map(call => call.frame),
          feet: structuredClone(pose.state.player.feet), radiatorBounds: radiatorBounds(pose.state) });
      }
      captions(ctx, poseCaptions);
      saveView(canvas, `poses-${walker.id.toLowerCase()}.png`, { type: 'Isolated articulated pose diagnostics; not a gameplay screenshot',
        walkerId: walker.id, scale: 1.25, paintedDrawCalls: draws.length, poses: poseRecords });
    }

    const panorama = await loadImage(resolve(root, 'assets/art/vesper-panorama.png'));
    const missions = ['MI01', 'MI05', 'MI01', 'MI09', 'MI09', 'MI14'];
    for (const [index, walker] of WALKERS.entries()) {
      const state = advance(initial(walker.id, missions[index]), 180, { move: 1 });
      const canvas = createCanvas(1600, 900), ctx = canvas.getContext('2d'), draws = observePaintedDraws(ctx), renderer = new Renderer(canvas);
      renderer.panorama = panorama; renderer.panoramaReady = true;
      const before = JSON.stringify(state); renderer.render(state, { reducedMotion: true });
      assert.equal(JSON.stringify(state), before, `${walker.id}: full renderer mutation`);
      assert.equal(draws.length, walker.legs * 5 + 3, `${walker.id}: full scene consumes each painted part`);
      saveView(canvas, `scene-${walker.id.toLowerCase()}-${missions[index].toLowerCase()}.png`, { type: 'Normal Canvas mission scene after 180 public movement ticks',
        walkerId: walker.id, missionId: missions[index], elapsed: state.elapsed, stateSha256: sha(before),
        paintedDrawCalls: draws.length, feet: structuredClone(state.player.feet) });
      const hangar = createCanvas(960, 480), hangarCtx = hangar.getContext('2d'), hangarDraws = observePaintedDraws(hangarCtx);
      new Renderer(hangar).renderHangar(walker, 0);
      assert.equal(hangarDraws.length, walker.legs * 5 + 2, `${walker.id}: normal hangar consumes each articulated part`);
      saveView(hangar, `hangar-${walker.id.toLowerCase()}.png`, { type: 'Normal Canvas hangar, time zero', walkerId: walker.id, paintedDrawCalls: hangarDraws.length });
    }
  } finally { globalThis.Image = oldImage; globalThis.window = oldWindow; }

  assert.ok(Object.values(paintedWalkerStatus()).every(status => status.state === 'ready'), 'Draw errors cannot count as a painted pass');
  for (const [path, expected] of Object.entries(report.sourceHashes)) assert.equal(sha(readFileSync(resolve(root, path))), expected, `${path}: changed during reception`);
  report.checks.normalRendererConsumesAllSixAtlases = true; report.checks.simulationUnchangedByRendering = true;
  report.checks.farPartsRemainOpaqueAndOrdered = true; report.checks.continuousRadiatorRepairRetained = true;
  report.checks.diagnosticCaptionsHaveVisiblePixels = report.annotationChecks.length === 60;
  assert.ok(report.checks.diagnosticCaptionsHaveVisiblePixels, 'Every fleet and pose panel must have its own verified caption');
  report.counts = { atlases: report.atlases.length, cells: report.frames.length, views: report.views.length,
    poses: report.views.reduce((sum, view) => sum + (view.poses?.length || 0), 0),
    missionScenes: report.views.filter(view => view.missionId).length, hangarViews: report.views.filter(view => view.type === 'Normal Canvas hangar, time zero').length };
  report.completed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack, decodeErrors }; process.exitCode = 1;
} finally {
  writeFileSync(resolve(output, 'receipt.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ output, completed: report.completed, ...report.counts, failure: report.failure?.message }));
}
