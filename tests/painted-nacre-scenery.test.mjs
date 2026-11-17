import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_NACRE_SCENERY_LAYOUT } from '../src/painted-nacre-scenery-layout.mjs';
import { setPaintedNacreSceneryImage, clearPaintedNacreScenery, loadPaintedNacreScenery,
  paintedNacreSceneryStatus, paintedNacreSceneryFrame, nacreGroundProp,
  drawPaintedNacreTerrain, drawPaintedNacreSceneryPart,
} from '../src/painted-nacre-scenery.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} differs from ${b}`);
const draws = r => r.calls.filter(call => call.method === 'drawImage');
function decoded() {
  for (const [key, atlas] of Object.entries(PAINTED_NACRE_SCENERY_LAYOUT))
    setPaintedNacreSceneryImage(key, { key: `nacre-${key}`, width: atlas.size[0], height: atlas.size[1] });
}
test.afterEach(clearPaintedNacreScenery);

test('Nacre materials remain clipped to the true ground and stationary while the camera moves', () => {
  decoded(); const first = combatRecorder(), moved = combatRecorder(), groundAt = x => terrainAt(x, 'PL02');
  assert.ok(drawPaintedNacreTerrain(first.ctx, { from: -80, to: 1800, groundAt }));
  assert.ok(drawPaintedNacreTerrain(moved.ctx, { from: 300, to: 2100, groundAt }));
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
  assert.ok(first.balanced() && moved.balanced());
  const invalid = combatRecorder();
  assert.equal(drawPaintedNacreTerrain(invalid.ctx, { from: 0, to: 160, groundAt: () => NaN }), false);
  assert.equal(draws(invalid).length, 0);
  assert.equal(paintedNacreSceneryStatus().terrain.state, 'ready');
});

test('Nacre material joins preserve edge continuity, measured crops and caller opacity', () => {
  decoded(); const r = combatRecorder(), seen = [], original = r.ctx.drawImage;
  r.ctx.globalAlpha = .7;
  r.ctx.drawImage = (...args) => { seen.push({ args, alpha: r.ctx.globalAlpha }); original(...args); };
  assert.ok(drawPaintedNacreTerrain(r.ctx, { from: -520, to: 2144, groundAt: () => 700 }));
  for (const x of [-512, 0, 512, 1024, 1536, 2048]) {
    const left = seen.filter(call => call.args[5] === x - 8).at(-1), joined = seen.filter(call => call.args[5] === x);
    assert.equal(joined.length, 2);
    assert.deepEqual(joined[0].args.slice(1, 5), left.args.slice(1, 5));
    assert.equal(joined[0].alpha, .7); assert.ok(joined[1].alpha > 0 && joined[1].alpha < .01);
  }
  const materials = Object.values(PAINTED_NACRE_SCENERY_LAYOUT.terrain.frames).map(f => f.materialSource);
  for (const { args } of seen) {
    const [x, y, w, h] = args.slice(1, 5);
    assert.ok(materials.some(([mx, my, mw, mh]) => x >= mx && y >= my && x + w <= mx + mw + 1e-6 && y + h <= my + mh));
  }
  assert.equal(r.ctx.globalAlpha, .7); assert.ok(r.balanced());
});

test('Nacre props keep their ground anchors and cannot add surfaces, inhabitants or mission facts', () => {
  decoded();
  for (const [key, atlas] of Object.entries(PAINTED_NACRE_SCENERY_LAYOUT)) for (const name of Object.keys(atlas.frames)) {
    const frame = paintedNacreSceneryFrame(name), [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
    assert.equal(frame.atlas, key); assert.equal(frame.usage, 'runtime');
    assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch);
    const [px, py] = frame.anchors.sourceOrigin, [tx, ty, tw, th] = frame.target;
    near(tx + (px - x) * tw / w, 0); near(ty + (py - y) * th / h, 0); near(tw / w, th / h);
    frame.target[0] = -999; assert.notEqual(paintedNacreSceneryFrame(name).target[0], -999);
  }
  assert.equal(nacreGroundProp(-1), 'weathered-planks'); assert.equal(nacreGroundProp(6), 'shore-rock');
  for (const missionId of ['MI01', 'MI05', 'MI06', 'MI07', 'MI08', 'MI09', 'MI13']) {
    const s = createGame({ missionId, seed: 1599 }), before = JSON.stringify(s), r = combatRecorder();
    const renderer = Object.assign(Object.create(Renderer.prototype), { ctx: r.ctx, cameraX: 0, combatReducedMotion: true, visible: () => true });
    renderer.drawTerrain(s, 0); assert.equal(JSON.stringify(s), before);
    const rendered = draws(r).filter(call => call.args[0].key === 'nacre-props');
    if (s.planetId !== 'PL02') { assert.equal(rendered.length, 0); continue; }
    assert.ok(rendered.length > 0, `${missionId}: shoreline props used by the normal renderer`);
    for (const call of rendered) { const [x, y] = r.point(call, [0, 0]); near(y, terrainAt(x, 'PL02')); }
    assert.ok(draws(r).filter(call => call.args[0].key === 'nacre-terrain').length > 100);
    assert.ok(r.balanced());
  }
});

test('Nacre scenery handles missing, broken and obsolete images without losing the other bank', async () => {
  const r = combatRecorder(); assert.equal(drawPaintedNacreSceneryPart(r.ctx, { part: 'shore-rock' }), false);
  await loadPaintedNacreScenery({ loadImage: async (url, key) => {
    if (key === 'terrain') throw new Error('decode failure');
    const atlas = PAINTED_NACRE_SCENERY_LAYOUT[key]; return { width: atlas.size[0], height: atlas.size[1] };
  } });
  assert.equal(paintedNacreSceneryStatus().terrain.state, 'failed');
  assert.equal(paintedNacreSceneryStatus().props.state, 'ready');
  assert.ok(drawPaintedNacreSceneryPart(r.ctx, { part: 'shore-rock' }));
  r.ctx.drawImage = () => { throw new Error('drawing surface lost'); };
  assert.equal(drawPaintedNacreSceneryPart(r.ctx, { part: 'shore-rock' }), false);
  assert.equal(paintedNacreSceneryStatus().props.state, 'failed'); assert.ok(r.balanced());
  assert.throws(() => setPaintedNacreSceneryImage('terrain', { width: 1, height: 1 }), RangeError);
  clearPaintedNacreScenery(); const pending = [];
  const loading = loadPaintedNacreScenery({ loadImage: (url, key) => new Promise(resolve => pending.push({ key, resolve })) });
  clearPaintedNacreScenery();
  for (const item of pending) { const atlas = PAINTED_NACRE_SCENERY_LAYOUT[item.key]; item.resolve({ width: atlas.size[0], height: atlas.size[1] }); }
  await loading; assert.ok(Object.values(paintedNacreSceneryStatus()).every(status => status.state === 'idle'));
});
