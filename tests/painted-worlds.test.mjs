import test from 'node:test';
import assert from 'node:assert/strict';
import { clearPaintedWorlds, loadPaintedWorlds, paintedWorldStatus, setPaintedWorldImage,
  drawPaintedWorld, worldPanoramaProjection } from '../src/painted-worlds.mjs';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';

const image = () => ({ width: 2172, height: 724 });
const context = () => {
  const calls = [], gradient = { addColorStop() {} };
  return { calls, ctx: new Proxy({}, { get: (_target, key) => (...args) => {
    calls.push([key, ...args]);
    if (String(key).includes('Gradient')) return gradient;
  }, set: () => true }) };
};

test('panoramas cover both edges across short and long missions without stretching or wrapping', () => {
  for (const width of [390, 1600, 2560]) for (const worldLength of [900, 3400, 15000]) {
    let previous = Infinity;
    for (let i = 0; i <= 50; i++) {
      const cameraX = Math.max(0, worldLength - width + 100) * i / 50;
      const pose = worldPanoramaProjection({ imageWidth: 2172, imageHeight: 724, width, height: 740, cameraX, worldLength });
      assert.ok(pose.x <= 0 && pose.x + pose.width >= width - 1e-9);
      assert.ok(pose.y <= 0 && pose.y + pose.height >= 740 - 1e-9);
      assert.ok(Math.abs(pose.width / pose.height - 3) < 1e-12);
      assert.ok(pose.x <= previous); previous = pose.x;
    }
  }
  assert.equal(worldPanoramaProjection({ imageWidth: 0, imageHeight: 724 }), null);
  assert.equal(worldPanoramaProjection({ imageWidth: 2172, imageHeight: 724, cameraX: NaN }), null);
});

test('reduced motion fixes the same panorama view at every camera position', () => {
  const options = { imageWidth: 2172, imageHeight: 724, worldLength: 12000, reducedMotion: true };
  assert.deepEqual(worldPanoramaProjection({ ...options, cameraX: 0 }), worldPanoramaProjection({ ...options, cameraX: 10000 }));
});

test('one failed world keeps its vector fallback without disabling the other planets', async () => {
  clearPaintedWorlds();
  const status = await loadPaintedWorlds({ loadImage: async (_url, id) => {
    if (id === 'PL03') throw Error('decode'); return image();
  } });
  assert.equal(status.PL03.state, 'failed');
  const { ctx, calls } = context();
  assert.equal(drawPaintedWorld(ctx, { planetId: 'PL03' }), false);
  assert.equal(drawPaintedWorld(ctx, { planetId: 'PL02' }), true);
  assert.equal(drawPaintedWorld(ctx, { planetId: 'PL04' }), true);
  assert.equal(drawPaintedWorld(ctx, { planetId: 'PL01' }), false);
  assert.equal(calls.filter(call => call[0] === 'drawImage').length, 2);
  status.PL02.state = 'tampered'; assert.equal(paintedWorldStatus().PL02.state, 'ready');
  assert.throws(() => setPaintedWorldImage('PL02', { width: 1, height: 1 }), RangeError);
  assert.throws(() => setPaintedWorldImage('PL08', image()), RangeError);
  clearPaintedWorlds();
});

test('a cancelled load cannot reactivate a cleared panorama bank', async () => {
  clearPaintedWorlds(); let release;
  const gate = new Promise(resolve => { release = resolve; });
  const old = loadPaintedWorlds({ loadImage: async () => { await gate; return image(); } });
  clearPaintedWorlds(); release(); await old;
  assert.ok(Object.values(paintedWorldStatus()).every(value => value.state === 'idle'));
});

test('a lost decoded image restores the Canvas state before vector fallback', () => {
  clearPaintedWorlds(); setPaintedWorldImage('PL02', image()); let depth = 0;
  const ctx = { save() { depth++; }, restore() { depth--; }, drawImage() { throw Error('image lost'); } };
  assert.equal(drawPaintedWorld(ctx, { planetId: 'PL02' }), false);
  assert.equal(depth, 0); assert.equal(paintedWorldStatus().PL02.state, 'failed'); clearPaintedWorlds();
});

test('mission backgrounds consume their own planet image without changing any saved fact', () => {
  clearPaintedWorlds();
  for (const planetId of ['PL02', 'PL03', 'PL04']) setPaintedWorldImage(planetId, image());
  for (const missionId of ['MI05', 'MI06', 'MI07', 'MI08', 'MI09', 'MI10', 'MI11', 'MI12', 'MI13', 'MI14']) {
    const state = createGame({ missionId, walkerId: 'WK01', seed: 158 }), before = structuredClone(state);
    const { ctx, calls } = context();
    const renderer = { ctx, cameraX: 200, combatReducedMotion: false, panoramaReady: false,
      drawHarbor() { assert.fail('painted Nacre must replace the vector horizon'); },
      drawForest() { assert.fail('painted Thyr must replace the vector horizon'); },
      drawFoundryHorizon() { assert.fail('painted Kharon must replace the vector horizon'); } };
    Renderer.prototype.drawBackground.call(renderer, state, state.elapsed);
    assert.equal(calls.filter(call => call[0] === 'drawImage').length, 1);
    assert.deepEqual(state, before);
  }
  clearPaintedWorlds();
});

test('the historical vector horizon is reachable when a world image is unavailable', () => {
  clearPaintedWorlds();
  const state = createGame({ missionId: 'MI05', walkerId: 'WK02', seed: 158 });
  const { ctx, calls } = context(); let harbor = 0;
  Renderer.prototype.drawBackground.call({ ctx, cameraX: 0, panoramaReady: false, drawHarbor() { harbor++; } }, state, 0);
  assert.equal(harbor, 1); assert.equal(calls.filter(call => call[0] === 'drawImage').length, 0);
});

test('a lost historical Vesper panorama restores opacity and renders its fallback in the same frame', () => {
  clearPaintedWorlds();
  const state = createGame({ missionId: 'MI01', walkerId: 'WK01', seed: 158 }), before = structuredClone(state);
  const stack = [], calls = [];
  const target = { globalAlpha: 1 };
  const ctx = new Proxy(target, { get: (object, key) => {
    if (key in object) return object[key];
    if (key === 'save') return () => stack.push(object.globalAlpha);
    if (key === 'restore') return () => { object.globalAlpha = stack.pop(); };
    if (key === 'drawImage') return () => { throw Error('Historical image invalidated'); };
    if (String(key).includes('Gradient')) return () => ({ addColorStop() {} });
    return (...args) => { calls.push([key, ...args]); };
  } });
  let industry = 0;
  const renderer = { ctx, cameraX: 0, panoramaReady: true, panorama: image(),
    drawIndustry() { industry++; } };
  assert.doesNotThrow(() => Renderer.prototype.drawBackground.call(renderer, state, 0));
  assert.equal(renderer.panoramaReady, false);
  assert.equal(target.globalAlpha, 1); assert.equal(stack.length, 0);
  assert.equal(industry, 1); assert.ok(calls.some(call => call[0] === 'closePath'), 'Fallback ridgelines were drawn');
  assert.deepEqual(state, before);
});
