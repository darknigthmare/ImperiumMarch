/** Actual PNG decoding and Canvas scene reception. No browser or human QA is claimed. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_MI14_LAYOUT } from '../src/painted-sprite-layout.mjs';
import { PAINTED_SPRITE_URLS, clearPaintedSprites, loadPaintedSprites, paintedSpriteStatus, paintedSpriteFrame } from '../src/painted-sprites.mjs';
import { WORKSHOP_ASSET_SPECS, drawWorkshopAsset } from '../src/workshop-assets.mjs';
import { Renderer } from '../src/renderer.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'docs/validation/painted-mi14');
const require = createRequire(import.meta.url);
let api;
try { api = require('@napi-rs/canvas'); }
catch (cause) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('This gate requires @napi-rs/canvas; missing dependencies do not count as a passed check.', { cause });
  api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas'));
}
const { createCanvas, loadImage, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const atlasGrids = { worker: [4, 3], 'worker-mechanic': [4, 3], cooler: [3, 2], 'workshop-control': [3, 2],
  'disputed-lot': [3, 2], 'security-automaton': [3, 2], valve: [3, 1], 'picket-post': [3, 1] };
const sourcePaths = ['src/painted-sprites.mjs', 'src/painted-sprite-layout.mjs', 'src/workshop-assets.mjs', 'src/workshop-renderer.mjs',
  'src/renderer.mjs', 'src/simulation.mjs', 'src/workshop-simulation.mjs', 'tools/test-painted-sprites.mjs'];
const historyPath = 'docs/validation/mi14/scenes.json', historicalBytes = readFileSync(resolve(root, historyPath));
const historical = JSON.parse(historicalBytes);
const report = { createdUtc: new Date().toISOString(), version: JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version,
  type: 'Decoded PNG and Node Canvas reception', completed: false,
  historicalSceneSource: { path: historyPath, sha256: sha(historicalBytes), provenance: historical.provenance },
  sourceHashes: Object.fromEntries(sourcePaths.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  atlases: [], frames: [], scenes: [], checks: {}, nativeBrowserExecuted: false, humanPlaytestPerformed: false,
  limitations: ['PNG alpha, crop, rig placement and Canvas assertions do not certify anatomy, visual style, human readability, CSS, browser interactions, audio or production-ready animation.'] };
mkdirSync(output, { recursive: true });

function imagePixels(image) {
  const canvas = createCanvas(image.width, image.height), ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0); return { canvas, ctx, data: ctx.getImageData(0, 0, image.width, image.height).data };
}
function alphaBounds(data, width, rect) {
  const [x, y, w, h] = rect.map(Math.round);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, count = 0;
  for (let j = Math.max(0, y); j < y + h; j++) for (let i = Math.max(0, x); i < x + w; i++) if (data[(j * width + i) * 4 + 3] > 128) {
    minX = Math.min(minX, i); minY = Math.min(minY, j); maxX = Math.max(maxX, i); maxY = Math.max(maxY, j); count++;
  }
  return { count, bounds: count ? [minX, minY, maxX + 1, maxY + 1] : null };
}
function within(rect, width, height, label) {
  assert.ok(Array.isArray(rect) && rect.length === 4 && rect.every(Number.isFinite), `${label}: finite source rectangle`);
  assert.ok(rect[0] >= 0 && rect[1] >= 0 && rect[2] > 0 && rect[3] > 0 && rect[0] + rect[2] <= width && rect[1] + rect[3] <= height,
    `${label}: source crop outside actual decoded PNG ${width}x${height}`);
}

try {
  const decoded = {}, pixelSets = {};
  clearPaintedSprites();
  await loadPaintedSprites({ loadImage: async (url, key) => {
    // Decode from the actual PNG file. The installed Skia build rejects some
    // generated PNG Buffers through its SVG sniffing path, while file decoding
    // supports those same PNG bytes. No image is converted or rewritten here.
    const path = fileURLToPath(url), bytes = readFileSync(path), image = await loadImage(path);
    decoded[key] = image; pixelSets[key] = imagePixels(image);
    let transparent = 0, nearlyTransparent = 0, opaque = 0;
    for (let i = 3; i < pixelSets[key].data.length; i += 4) {
      if (pixelSets[key].data[i] === 0) transparent++;
      if (pixelSets[key].data[i] <= 8) nearlyTransparent++;
      if (pixelSets[key].data[i] > 128) opaque++;
    }
    report.atlases.push({ key, path: path.slice(root.length + 1), bytes: bytes.length, sha256: sha(bytes), width: image.width, height: image.height,
      transparentPixels: transparent, nearlyTransparentPixels: nearlyTransparent, occupiedPixels: opaque });
    // Generated cutouts may keep sub-4%-opacity antialiasing in a gutter. Require
    // genuine empty pixels and sizeable clear space without mistaking that alpha
    // fringe for an opaque rectangle around the sprite.
    assert.ok(transparent > 1000 && nearlyTransparent > image.width * image.height * .03, `${key}: actual transparent background is required`);
    assert.ok(opaque > 1000, `${key}: atlas has no useful visible pixels`);
    return image;
  } });
  assert.equal(Object.keys(decoded).length, 8);
  assert.ok(Object.values(paintedSpriteStatus()).every(status => status.state === 'ready'), 'All eight PNGs must actually decode; failure cannot be received as a pass');
  report.checks.eightPngAtlasesDecoded = true;
  const originalLayout = JSON.stringify(PAINTED_MI14_LAYOUT), walkingGround = {};
  for (const [key, atlas] of Object.entries(PAINTED_MI14_LAYOUT)) {
    assert.ok(decoded[key], `${key}: layout needs a loaded image`);
    const image = decoded[key], { ctx, data } = pixelSets[key], [cols, rows] = atlasGrids[key];
    const fingerprints = new Set(); walkingGround[key] = [];
    for (const [name, entry] of Object.entries(atlas.frames)) {
      const label = `${key}/${name}`, frame = paintedSpriteFrame(key, name);
      assert.ok(frame, `${label}: no usable draw mapping`); within(frame.source, image.width, image.height, label);
      const [sx, sy, sw, sh] = frame.source, [tx, ty, tw, th] = frame.target;
      const occupied = alphaBounds(data, image.width, frame.source); assert.ok(occupied.count > 50, `${label}: empty or negligible frame`);
      const column = Math.min(cols - 1, Math.floor((sx + sw / 2) / image.width * cols));
      const row = Math.min(rows - 1, Math.floor((sy + sh / 2) / image.height * rows));
      const left = Math.round(column * image.width / cols), top = Math.round(row * image.height / rows);
      const right = Math.round((column + 1) * image.width / cols), bottom = Math.round((row + 1) * image.height / rows);
      assert.ok(sx >= left && sy >= top && sx + sw <= right && sy + sh <= bottom, `${label}: source crop mixes neighboring cells`);
      const cell = alphaBounds(data, image.width, [left, top, right - left, bottom - top]);
      const outsideCrop = Math.max(0, cell.count - occupied.count);
      // High-alpha body pixels at a cell edge indicate a cut-off sprite, unlike
      // a tightly trimmed source rectangle whose padding was intentionally removed.
      let edgePixels = 0;
      for (let x = left; x < right; x++) for (const y of [top, bottom - 1]) if (data[(y * image.width + x) * 4 + 3] > 128) edgePixels++;
      for (let y = top + 1; y < bottom - 1; y++) for (const x of [left, right - 1]) if (data[(y * image.width + x) * 4 + 3] > 128) edgePixels++;
      const pixels = ctx.getImageData(Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh)).data;
      const frameHash = sha(pixels);
      const record = { atlas: key, frame: name, source: frame.source, target: frame.target, occupiedPixels: occupied.count,
        occupiedSourceBounds: occupied.bounds, cellEdgePixels: edgePixels, excludedCellPixels: outsideCrop, pixelSha256: frameHash };
      report.frames.push(record);
      assert.equal(edgePixels, 0, `${label}: opaque body touches a cell boundary (${edgePixels} pixels), inspect possible truncation`);
      assert.ok(outsideCrop <= Math.max(12, cell.count * .002), `${label}: crop excludes ${outsideCrop} occupied pixels from its cell`);
      for (const rotor of entry.rotors || []) within(rotor.source, image.width, image.height, `${label}/rotor`);
      if (key === 'security-automaton' && name === 'cannon') {
        const muzzle = entry.anchors?.muzzle;
        assert.ok(Array.isArray(muzzle) && muzzle.length === 2, 'The cannon needs a registered bore anchor');
        const opaqueRight = tx + (occupied.bounds[2] - sx) / sw * tw;
        assert.ok(Math.abs(muzzle[0] - opaqueRight) <= 1, 'Opaque cannon art must reach its physical muzzle within one world unit');
        const boreY = sy + (muzzle[1] - ty) / th * sh;
        assert.ok(boreY >= occupied.bounds[1] && boreY <= occupied.bounds[3], 'The registered bore must pass through cannon pixels');
        record.muzzle = { anchor: muzzle, opaqueRight, sourceBoreY: boreY };
      }
      if (/^walking-\d+$/.test(name)) {
        fingerprints.add(frameHash);
        walkingGround[key].push(ty + (occupied.bounds[3] - sy) / sh * th);
      }
      const part = key === 'worker-mechanic' ? 'worker' : key;
      if (name !== 'cannon') {
        const [bx, by, bw, bh] = WORKSHOP_ASSET_SPECS[part].bounds;
        // A fallen body or debris can be wider than the old procedural export's
        // bounds. Those bounds never clip the live drawing. Record the margin
        // for visual review; require intact source crops and unclipped rendering.
        record.vectorEnvelopeOverhang = [Math.max(0, bx - tx), Math.max(0, by - ty),
          Math.max(0, tx + tw - bx - bw), Math.max(0, ty + th - by - bh)];
      }
    }
    if (key === 'worker' || key === 'worker-mechanic') {
      assert.equal(walkingGround[key].length, 8, `${key}: eight walking frames`);
      assert.equal(fingerprints.size, 8, `${key}: eight independently painted poses`);
      const min = Math.min(...walkingGround[key]), max = Math.max(...walkingGround[key]);
      assert.ok(max - min <= 2.5, `${key}: planted-foot baseline jumps by ${max - min} world units`);
      assert.ok(Math.abs(min) <= 4 && Math.abs(max) <= 4, `${key}: feet float away from the physical ground anchor`);
    }
  }
  report.checks.sourceCropsWithinImages = true;
  report.checks.cellBoundariesUnclipped = true;
  report.checks.noOccupiedBodyDiscardedByCrop = true;
  report.checks.eightUniqueWalkingPosesPerRole = true;
  report.checks.walkingGroundAnchorStable = true;

  // Render each material/worker state in a separate, generously padded viewport.
  const componentImages = [];
  for (const [part, spec] of Object.entries(WORKSHOP_ASSET_SPECS)) for (const state of spec.states) for (const mechanic of part === 'worker' ? [false, true] : [false]) {
    const canvas = createCanvas(760, 600), c = canvas.getContext('2d');
    const options = { part, state, mechanic, x: 380, y: 485, scale: 2.5, progress: .42 }, before = JSON.stringify(options);
    drawWorkshopAsset(c, options); assert.equal(JSON.stringify(options), before);
    const pixels = c.getImageData(0, 0, canvas.width, canvas.height).data;
    const alpha = alphaBounds(pixels, canvas.width, [0, 0, canvas.width, canvas.height]); assert.ok(alpha.count > 300, `${part}/${state}: invisible component`);
    const [x1, y1, x2, y2] = alpha.bounds;
    assert.ok(x1 > 8 && y1 > 8 && x2 < canvas.width - 8 && y2 < canvas.height - 8, `${part}/${state}: isolated rendering is clipped`);
    const file = `${part}${mechanic ? '-mechanic' : ''}-${state}.png`, bytes = canvas.toBuffer('image/png');
    writeFileSync(resolve(output, file), bytes); componentImages.push({ file, part, state, mechanic, sha256: sha(bytes), visibleBounds: alpha.bounds });
  }
  report.components = componentImages;
  report.checks.allMaterialStatesRendered = true;

  // The panorama decoder is intentionally inactive: these are Kharon snapshots.
  globalThis.window = { devicePixelRatio: 1 };
  globalThis.Image = class { set src(_) {} };
  const imageKeys = new Map(Object.entries(decoded).map(([key, image]) => [image, key]));
  for (const scene of historical.files) {
    const game = structuredClone(scene.state), before = JSON.stringify(game), canvas = createCanvas(historical.width, historical.height);
    const renderer = new Renderer(canvas), native = renderer.ctx, draws = [];
    renderer.ctx = new Proxy(native, {
      get(target, key) {
        if (key === 'drawImage') return (...args) => { if (imageKeys.has(args[0])) draws.push({ atlas: imageKeys.get(args[0]), source: args.slice(1, 5), target: args.slice(5) }); return target.drawImage(...args); };
        const value = Reflect.get(target, key); return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, key, value) { return Reflect.set(target, key, value); },
    });
    renderer.render(game, { shake: false, ...scene.options });
    assert.equal(JSON.stringify(game), before, `${scene.file}: painted renderer mutated an authoritative scene`);
    const bytes = canvas.toBuffer('image/png'), file = scene.file;
    writeFileSync(resolve(output, file), bytes);
    report.scenes.push({ file, title: scene.title, elapsed: scene.elapsed, walkerId: scene.walkerId, sha256: sha(bytes), stateSha256: sha(before), paintedDrawCalls: draws.length,
      paintedAtlases: [...new Set(draws.map(draw => draw.atlas))] });
  }
  assert.equal(JSON.stringify(PAINTED_MI14_LAYOUT), originalLayout, 'Rendering changed atlas mappings');
  assert.equal(sha(readFileSync(resolve(root, historyPath))), sha(historicalBytes), 'Historical evidence was overwritten');
  assert.ok(report.scenes.reduce((count, scene) => count + scene.paintedDrawCalls, 0) > 20, 'Mission captures never consumed the actual painted atlases');
  for (const [path, hash] of Object.entries(report.sourceHashes)) assert.equal(sha(readFileSync(resolve(root, path))), hash, `${path}: source changed during verification`);
  report.checks.historicalScenesUnchanged = true;
  report.checks.rendererPreservesSimulation = true;
  report.checks.actualPaintedImagesConsumedByMission = true;
  report.completed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
} finally {
  clearPaintedSprites();
  writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ completed: report.completed, atlases: report.atlases.length, frames: report.frames.length,
    components: report.components?.length || 0, scenes: report.scenes.length, output, failure: report.failure?.message }));
}
