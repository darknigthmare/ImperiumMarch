import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, terrainAt, livingRouteSurfaceAt, chemicalSurfaceAt, voiceSurfaceAt, relaySurfaceAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_THYR_SCENERY_LAYOUT } from '../src/painted-thyr-scenery-layout.mjs';
import { setPaintedThyrSceneryImage, clearPaintedThyrScenery, loadPaintedThyrScenery,
  paintedThyrSceneryStatus, paintedThyrSceneryFrame, thyrGroundProp,
  drawPaintedThyrTerrain, drawPaintedThyrSceneryPart,
} from '../src/painted-thyr-scenery.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} differs from ${b}`);
const draws = r => r.calls.filter(call => call.method === 'drawImage');
function decoded() {
  for (const [key, atlas] of Object.entries(PAINTED_THYR_SCENERY_LAYOUT))
    setPaintedThyrSceneryImage(key, { key: `thyr-${key}`, width: atlas.size[0], height: atlas.size[1] });
}
test.afterEach(clearPaintedThyrScenery);

test('Thyr materials remain clipped to the true ground and stationary while the camera moves', () => {
  decoded(); const first = combatRecorder(), moved = combatRecorder(), groundAt = x => terrainAt(x, 'PL03');
  assert.ok(drawPaintedThyrTerrain(first.ctx, { from: -80, to: 1800, groundAt }));
  assert.ok(drawPaintedThyrTerrain(moved.ctx, { from: 300, to: 2100, groundAt }));
  assert.ok(first.calls.some(call => call.method === 'clip'));
  const byColumn = r => {
    const map = new Map();
    for (const call of draws(r)) {
      const x = call.args[5]; near(call.args[6], groundAt(x + 4) - 1);
      if (!map.has(x)) map.set(x, []);
      map.get(x).push(call.args.slice(1));
    }
    return map;
  };
  const original = byColumn(first), current = byColumn(moved);
  for (const [x, calls] of original) if (x >= 304 && x < 1792) assert.deepEqual(current.get(x), calls);
  const fractional = combatRecorder();
  fractional.ctx.setTransform(1.25, 0, 0, 1.25, -.296992496895 * 1.25, 0);
  fractional.ctx.getTransform = () => ({ a: 1.25, b: 0, c: 0, d: 1.25, e: -.296992496895 * 1.25, f: 0 });
  assert.ok(drawPaintedThyrTerrain(fractional.ctx, { from: -80, to: 1800, groundAt }));
  assert.deepEqual(draws(fractional).map(call => call.args.slice(1, 5)), draws(first).map(call => call.args.slice(1, 5)), 'subpixel raster alignment leaves all world material samples unchanged');
  for (const call of draws(fractional)) {
    const [left] = fractional.point(call, [call.args[5], 0]), [right] = fractional.point(call, [call.args[5] + call.args[7], 0]);
    near(left, Math.round(left)); near(right, Math.round(right));
  }
  assert.ok(first.balanced() && moved.balanced());
  const invalid = combatRecorder();
  assert.equal(drawPaintedThyrTerrain(invalid.ctx, { from: 0, to: 160, groundAt: () => NaN }), false);
  assert.equal(draws(invalid).length, 0);
  assert.equal(paintedThyrSceneryStatus().terrain.state, 'ready');
});

test('Thyr material joins preserve edge continuity, measured crops and caller opacity', () => {
  decoded(); const r = combatRecorder(), seen = [], original = r.ctx.drawImage;
  r.ctx.globalAlpha = .7;
  r.ctx.drawImage = (...args) => { seen.push({ args, alpha: r.ctx.globalAlpha }); original(...args); };
  assert.ok(drawPaintedThyrTerrain(r.ctx, { from: -520, to: 2144, groundAt: () => 700 }));
  for (const x of [-512, 0, 512, 1024, 1536, 2048]) {
    const left = seen.filter(call => call.args[5] === x - 8).at(-1), joined = seen.filter(call => call.args[5] === x);
    assert.equal(joined.length, 2);
    assert.deepEqual(joined[0].args.slice(1, 5), left.args.slice(1, 5));
    assert.equal(joined[0].alpha, .7); assert.ok(joined[1].alpha > 0 && joined[1].alpha < .01);
  }
  const materials = Object.values(PAINTED_THYR_SCENERY_LAYOUT.terrain.frames).map(f => f.materialSource);
  for (const { args } of seen) {
    const [x, y, w, h] = args.slice(1, 5);
    assert.ok(materials.some(([mx, my, mw, mh]) => x >= mx && y >= my && x + w <= mx + mw + 1e-6 && y + h <= my + mh));
  }
  assert.equal(r.ctx.globalAlpha, .7); assert.ok(r.balanced());
});

test('Thyr props keep their ground anchors and cannot add surfaces, inhabitants or mission facts', () => {
  decoded();
  for (const [key, atlas] of Object.entries(PAINTED_THYR_SCENERY_LAYOUT)) for (const name of Object.keys(atlas.frames)) {
    const frame = paintedThyrSceneryFrame(name), [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
    assert.equal(frame.atlas, key); assert.equal(frame.usage, 'runtime');
    assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch);
    const [px, py] = frame.anchors.sourceOrigin, [tx, ty, tw, th] = frame.target;
    near(tx + (px - x) * tw / w, 0); near(ty + (py - y) * th / h, 0); near(tw / w, th / h);
    frame.target[0] = -999; assert.notEqual(paintedThyrSceneryFrame(name).target[0], -999);
  }
  assert.equal(thyrGroundProp(-1), 'lichen-pebble'); assert.equal(thyrGroundProp(6), 'moss-stone');
  for (const missionId of ['MI01', 'MI05', 'MI09', 'MI10', 'MI11', 'MI12', 'MI13', 'op03']) {
    const s = createGame({ missionId, seed: 1510 }), before = JSON.stringify(s), r = combatRecorder();
    const renderer = Object.assign(Object.create(Renderer.prototype), { ctx: r.ctx, cameraX: 0, combatReducedMotion: true, visible: () => true });
    const surfaceAt = s.livingRoute ? livingRouteSurfaceAt : s.chemical ? chemicalSurfaceAt : s.voice ? voiceSurfaceAt : s.relay ? relaySurfaceAt : null;
    const samples = surfaceAt ? Array.from({ length: 121 }, (_, i) => surfaceAt(s, i * 53)) : null;
    renderer.drawTerrain(s, 0); assert.equal(JSON.stringify(s), before);
    if (surfaceAt) assert.deepEqual(Array.from({ length: 121 }, (_, i) => surfaceAt(s, i * 53)), samples);
    const rendered = draws(r).filter(call => call.args[0].key === 'thyr-props');
    if (s.planetId !== 'PL03') { assert.equal(rendered.length, 0); continue; }
    assert.ok(rendered.length > 0, `${missionId}: forest-floor props used by the normal renderer`);
    for (const call of rendered) { const [x, y] = r.point(call, [0, 0]); near(y, terrainAt(x, 'PL03')); }
    assert.ok(draws(r).filter(call => call.args[0].key === 'thyr-terrain').length > 100);
    assert.ok(r.balanced());
  }
});

test('Thyr scenery handles missing, broken and obsolete images without losing the other bank', async () => {
  const r = combatRecorder(); assert.equal(drawPaintedThyrSceneryPart(r.ctx, { part: 'moss-stone' }), false);
  await loadPaintedThyrScenery({ loadImage: async (url, key) => {
    if (key === 'terrain') throw new Error('decode failure');
    const atlas = PAINTED_THYR_SCENERY_LAYOUT[key]; return { width: atlas.size[0], height: atlas.size[1] };
  } });
  assert.equal(paintedThyrSceneryStatus().terrain.state, 'failed');
  assert.equal(paintedThyrSceneryStatus().props.state, 'ready');
  assert.ok(drawPaintedThyrSceneryPart(r.ctx, { part: 'moss-stone' }));
  r.ctx.drawImage = () => { throw new Error('drawing surface lost'); };
  assert.equal(drawPaintedThyrSceneryPart(r.ctx, { part: 'moss-stone' }), false);
  assert.equal(paintedThyrSceneryStatus().props.state, 'failed'); assert.ok(r.balanced());
  assert.throws(() => setPaintedThyrSceneryImage('terrain', { width: 1, height: 1 }), RangeError);
  clearPaintedThyrScenery(); const pending = [];
  const loading = loadPaintedThyrScenery({ loadImage: (url, key) => new Promise(resolve => pending.push({ key, resolve })) });
  clearPaintedThyrScenery();
  for (const item of pending) { const atlas = PAINTED_THYR_SCENERY_LAYOUT[item.key]; item.resolve({ width: atlas.size[0], height: atlas.size[1] }); }
  await loading; assert.ok(Object.values(paintedThyrSceneryStatus()).every(status => status.state === 'idle'));
});
