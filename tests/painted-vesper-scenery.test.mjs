import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_VESPER_SCENERY_LAYOUT } from '../src/painted-vesper-scenery-layout.mjs';
import { setPaintedVesperSceneryImage, clearPaintedVesperScenery, loadPaintedVesperScenery,
  paintedVesperSceneryStatus, paintedVesperSceneryFrame, vesperGroundProp,
  drawPaintedVesperTerrain, drawPaintedVesperDeck, drawPaintedVesperBrace, drawPaintedVesperSceneryPart,
} from '../src/painted-vesper-scenery.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} differs from ${b}`);
const imageCalls = record => record.calls.filter(call => call.method === 'drawImage');
function standIns() {
  for (const [key, atlas] of Object.entries(PAINTED_VESPER_SCENERY_LAYOUT))
    setPaintedVesperSceneryImage(key, { key, width: atlas.size[0], height: atlas.size[1] });
}
const rendererFor = record => Object.assign(Object.create(Renderer.prototype), {
  ctx: record.ctx, cameraX: 0, combatReducedMotion: false, visible: () => true,
});
test.afterEach(clearPaintedVesperScenery);

test('Vesper scenery preserves 16 measured crops, original proportions and defensive anchors', () => {
  let count = 0;
  for (const [key, atlas] of Object.entries(PAINTED_VESPER_SCENERY_LAYOUT)) for (const name of Object.keys(atlas.frames)) {
    const f = paintedVesperSceneryFrame(name), [x, y, w, h] = f.source, [cx, cy, cw, ch] = f.cell;
    count++; assert.equal(f.atlas, key); assert.equal(f.usage, 'runtime');
    assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch);
    const [px, py] = f.anchors.sourceOrigin, [tx, ty, tw, th] = f.target;
    near(tx + (px - x) * tw / w, 0); near(ty + (py - y) * th / h, 0);
    near(tw / w, th / h); // Base sprites have a uniform scale.
    f.anchors.sourceOrigin[0] = -999;
    assert.notEqual(paintedVesperSceneryFrame(name).anchors.sourceOrigin[0], -999);
  }
  assert.equal(count, 16);
  assert.deepEqual(PAINTED_VESPER_SCENERY_LAYOUT.viaduct.columns, [0, 365, 930, 1536]);
  assert.deepEqual(PAINTED_VESPER_SCENERY_LAYOUT.viaduct.rows, [0, 596, 1024]);
  assert.equal(paintedVesperSceneryFrame('invented-platform'), null);
  assert.equal(vesperGroundProp(-1), 'slate-rubble'); assert.equal(vesperGroundProp(6), 'slate-rock');
});

test('Vesper textures follow real ground, clip their tops and remain anchored while the camera pans', () => {
  standIns(); const first = combatRecorder(), second = combatRecorder();
  const groundAt = x => terrainAt(x, 'PL01');
  assert.equal(drawPaintedVesperTerrain(first.ctx, { from: -80, to: 1800, groundAt }), true);
  assert.equal(drawPaintedVesperTerrain(second.ctx, { from: 300, to: 2100, groundAt }), true);
  assert.ok(first.calls.some(call => call.method === 'clip'));
  const draw = imageCalls(first), byColumn = record => {
    const result = new Map();
    for (const call of imageCalls(record)) {
      const x = call.args[5];
      if (!result.has(x)) result.set(x, []);
      result.get(x).push(call.args.slice(1));
    }
    return result;
  }, previous = byColumn(first), next = byColumn(second);
  for (const call of draw) {
    const x = call.args[5]; near(call.args[6], groundAt(x + 4) - 1);
  }
  for (const [x, samples] of previous) if (x >= 304 && x < 1792) assert.deepEqual(samples, next.get(x));
  assert.ok(draw.length > 100); assert.equal(first.balanced(), true); assert.equal(second.balanced(), true);
  const invalid = combatRecorder();
  assert.equal(drawPaintedVesperTerrain(invalid.ctx, { from: 0, to: 100, groundAt: () => NaN }), false);
  assert.equal(imageCalls(invalid).length, 0); assert.equal(paintedVesperSceneryStatus().terrain.state, 'ready');
});

test('successive rock materials blend at world boundaries without clipped crops or leaked opacity', () => {
  standIns(); const record = combatRecorder(), draws = [], original = record.ctx.drawImage;
  record.ctx.drawImage = (...args) => { draws.push({ args, alpha: record.ctx.globalAlpha }); original(...args); };
  assert.ok(drawPaintedVesperTerrain(record.ctx, { from: -520, to: 2144, groundAt: () => 700 }));
  for (const boundary of [-512, 0, 512, 1024, 1536, 2048]) {
    const before = draws.filter(call => call.args[5] === boundary - 8).at(-1);
    const joined = draws.filter(call => call.args[5] === boundary);
    assert.equal(joined.length, 2, 'A material boundary blends two crops');
    assert.deepEqual(joined[0].args.slice(1, 5), before.args.slice(1, 5), 'Previous edge continues across the boundary');
    assert.equal(joined[0].alpha, 1);
    assert.ok(joined[1].alpha > 0 && joined[1].alpha < .01, 'New material enters without a hard edge');
  }
  for (const { args } of draws) {
    const [x, y, w, h] = args.slice(1, 5);
    const materials = Object.values(PAINTED_VESPER_SCENERY_LAYOUT.terrain.frames).map(frame => frame.materialSource);
    assert.ok(materials.some(([mx, my, mw, mh]) => x >= mx && y >= my && x + w <= mx + mw + 1e-6 && y + h <= my + mh));
  }
  assert.equal(record.ctx.globalAlpha, 1); assert.equal(record.balanced(), true);
});

test('ground props occupy only the existing decorative Vesper slots and never alter mission facts', () => {
  standIns();
  for (const missionId of ['MI01', 'MI03', 'MI04', 'MI05', 'MI09', 'MI13']) {
    const s = createGame({ missionId, seed: 1588 }), before = JSON.stringify(s), record = combatRecorder();
    rendererFor(record).drawTerrain(s, 7);
    assert.equal(JSON.stringify(s), before);
    const props = imageCalls(record).filter(call => call.args[0].key === 'props');
    if (s.planetId !== 'PL01') { assert.equal(props.length, 0); continue; }
    const start = Math.floor(-100 / 20) * 20, end = 1700, expected = [];
    for (let k = Math.floor(start / 83); k < end / 83; k++) if (k % 3 === 0) expected.push(k);
    assert.equal(props.length, expected.length);
    for (const call of props) {
      const [x, y] = record.point(call, [0, 0]); near(y, terrainAt(x, 'PL01'));
    }
    assert.equal(record.balanced(), true);
  }
});

test('viaduct deck follows its existing support while both beam endpoints stay fixed', () => {
  standIns(); const record = combatRecorder(), groundAt = x => terrainAt(x, 'PL01');
  assert.equal(drawPaintedVesperDeck(record.ctx, { from: -24, to: 800, groundAt }), true);
  for (const call of imageCalls(record)) near(call.args[6], groundAt(call.args[5] + 2));
  for (const part of ['brace', 'tie-rod', 'sleeper']) {
    const r = combatRecorder(), a = [19, 731], b = [250, 812];
    assert.equal(drawPaintedVesperBrace(r.ctx, { part, x1: a[0], y1: a[1], x2: b[0], y2: b[1] }), true);
    const calls = imageCalls(r); assert.equal(calls.length, 3);
    const first = calls[0], last = calls[2], start = r.point(first, [first.args[5], 0]);
    const end = r.point(last, [last.args[5] + last.args[7], 0]);
    near(start[0], a[0]); near(start[1], a[1]); near(end[0], b[0]); near(end[1], b[1]);
    assert.equal(r.balanced(), true);
  }
});

test('MI02 painted viaduct retains the original rail break and continuous walking surface', () => {
  const s = createGame({ missionId: 'MI02', seed: 1588 }), before = JSON.stringify(s);
  const empty = combatRecorder(), plain = rendererFor(empty); plain.cameraX = s.train.breakX - 800; plain.drawRailViaduct(s, 3);
  standIns(); const painted = combatRecorder(), skin = rendererFor(painted); skin.cameraX = plain.cameraX; skin.drawRailViaduct(s, 3);
  assert.equal(JSON.stringify(s), before);
  const segments = record => {
    const result = [];
    for (let i = 0; i < record.calls.length - 1; i++) if (record.calls[i].method === 'moveTo' && record.calls[i+1].method === 'lineTo')
      result.push([...record.calls[i].args, ...record.calls[i+1].args]);
    return result;
  };
  const plainSegments = segments(empty), paintedSegments = segments(painted);
  const start = Math.floor((skin.cameraX - 120) / 24) * 24, end = skin.cameraX + 1720;
  const includes = (list, wanted) => list.some(segment => segment.every((n, i) => Math.abs(n - wanted[i]) < 1e-6));
  for (let x = start; x < end; x += 24) {
    const y = terrainAt(x, s.planetId), ny = terrainAt(x + 24, s.planetId);
    const deck = [x, y, x + 24, ny]; assert.ok(includes(plainSegments, deck)); assert.ok(includes(paintedSegments, deck));
    const rail = Math.abs(x - s.train.breakX) > 64 ? [x, y + 7, x + 24, ny + 7] : [x, y + 9, x + 17, y + 20 + Math.sin(x) * 7];
    assert.ok(includes(plainSegments, rail)); assert.ok(includes(paintedSegments, rail));
  }
  assert.ok(imageCalls(painted).length > 100); assert.equal(painted.balanced(), true);
});

test('missing or failed scenery images retain a balanced vector fallback', async () => {
  const r = combatRecorder(); assert.equal(drawPaintedVesperSceneryPart(r.ctx, { part: 'pier' }), false);
  await loadPaintedVesperScenery({ loadImage: async (url, key) => {
    if (key === 'terrain') throw new Error('decode unavailable');
    const atlas = PAINTED_VESPER_SCENERY_LAYOUT[key]; return { width: atlas.size[0], height: atlas.size[1], key };
  } });
  assert.equal(paintedVesperSceneryStatus().terrain.state, 'failed');
  assert.equal(paintedVesperSceneryStatus().viaduct.state, 'ready');
  r.ctx.drawImage = () => { throw new Error('drawing surface lost'); };
  assert.equal(drawPaintedVesperSceneryPart(r.ctx, { part: 'pier' }), false);
  assert.equal(paintedVesperSceneryStatus().viaduct.state, 'failed'); assert.equal(r.balanced(), true);
  const game = createGame({ missionId: 'MI02', seed: 1588 }), f = combatRecorder();
  rendererFor(f).drawRailViaduct(game, 0); assert.equal(imageCalls(f).length, 0); assert.ok(f.calls.length > 100);
});

test('clearing a pending scenery decode cannot restore obsolete images', async () => {
  const pending = [];
  const loading = loadPaintedVesperScenery({ loadImage: (url, key) => new Promise(resolve => pending.push({ key, resolve })) });
  clearPaintedVesperScenery();
  for (const item of pending) { const atlas = PAINTED_VESPER_SCENERY_LAYOUT[item.key]; item.resolve({ width: atlas.size[0], height: atlas.size[1] }); }
  await loading; assert.ok(Object.values(paintedVesperSceneryStatus()).every(status => status.state === 'idle'));
});
