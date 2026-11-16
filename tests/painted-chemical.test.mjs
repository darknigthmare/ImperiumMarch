import test from 'node:test';
import assert from 'node:assert/strict';
import { CHEMICAL_ASSET_SPECS } from '../src/chemical-assets.mjs';
import { PAINTED_CHEMICAL_LAYOUT } from '../src/painted-chemical-layout.mjs';
import { clearPaintedChemical, loadPaintedChemical, paintedChemicalStatus, setPaintedChemicalImage,
  paintedChemicalFrame, drawPaintedChemicalAsset } from '../src/painted-chemical.mjs';
import { drawChemicalSite } from '../src/chemical-renderer.mjs';
import { createGame, chemicalSurfaceAt } from '../src/simulation.mjs';

const fakeImage = key => ({ width: PAINTED_CHEMICAL_LAYOUT[key].size[0], height: PAINTED_CHEMICAL_LAYOUT[key].size[1], key });
const ready = () => { clearPaintedChemical(); for (const key of Object.keys(PAINTED_CHEMICAL_LAYOUT)) setPaintedChemicalImage(key, fakeImage(key)); };
function context() {
  const calls = [];
  return { calls, ctx: new Proxy({}, { get: (_target, key) => (...args) => {
    calls.push([key, ...args]);
    if (key === 'createLinearGradient' || key === 'createRadialGradient') return { addColorStop() {} };
    if (key === 'measureText') return { width: String(args[0]).length * 7 };
  }, set: () => true }) };
}

test('MI10 maps every existing state exactly once and exposes no empty atlas cells', () => {
  let count = 0;
  for (const [part, spec] of Object.entries(CHEMICAL_ASSET_SPECS)) for (const state of spec.states) {
    const frame = paintedChemicalFrame(part, state); assert.ok(frame, `${part}/${state}`);
    assert.equal(frame.usage, 'runtime'); assert.equal(frame.part, part); assert.equal(frame.state, state);
    assert.deepEqual(frame.anchors.ground, [0, 0]); count++;
    frame.source[0] = -123; assert.notEqual(paintedChemicalFrame(part, state).source[0], -123, 'Caller cannot rewrite stored metadata');
  }
  assert.equal(count, 24); assert.equal(paintedChemicalFrame('chemical-tank', 'firing'), null);
  assert.equal(paintedChemicalFrame('invented-reactor', 'normal'), null);
  assert.equal(Object.values(PAINTED_CHEMICAL_LAYOUT).reduce((n, a) => n+a.emptyCells.length, 0), 3);
});

test('MI10 decode failure remains isolated to its atlas and dimensions are checked', async () => {
  clearPaintedChemical();
  const status = await loadPaintedChemical({ loadImage: async (_url, key) => { if (key === 'tanks') throw new Error('decode'); return fakeImage(key); } });
  assert.equal(status.tanks.state, 'failed'); assert.equal(status.valves.state, 'ready');
  const { ctx } = context();
  assert.equal(drawPaintedChemicalAsset(ctx, { part: 'chemical-tank' }), false);
  assert.equal(drawPaintedChemicalAsset(ctx, { part: 'field-valve', state: 'normal' }), true);
  assert.throws(() => setPaintedChemicalImage('tanks', { width: 1, height: 1 }), RangeError);
  assert.throws(() => setPaintedChemicalImage('missing', fakeImage('tanks')), RangeError);
  clearPaintedChemical();
});

test('MI10 clearing an in-flight load cannot restore obsolete images', async () => {
  clearPaintedChemical(); let release;
  const blocker = new Promise(resolve => { release = resolve; });
  const old = loadPaintedChemical({ loadImage: async (_url, key) => { await blocker; return fakeImage(key); } });
  clearPaintedChemical(); release(); await old;
  assert.ok(Object.values(paintedChemicalStatus()).every(x => x.state === 'idle'));
  await loadPaintedChemical({ loadImage: async (_url, key) => fakeImage(key) });
  assert.ok(Object.values(paintedChemicalStatus()).every(x => x.state === 'ready'));
  clearPaintedChemical();
});

test('MI10 artwork keeps body-bottom origin and independent width/height scaling', () => {
  ready(); const { ctx, calls } = context();
  const options = Object.freeze({ part: 'chemical-tank', state: 'leaking', x: 2000, y: 692, width: 140, height: 160, facing: -1 });
  assert.equal(drawPaintedChemicalAsset(ctx, options), true);
  assert.deepEqual(calls.find(c => c[0] === 'translate'), ['translate', 2000, 692]);
  assert.deepEqual(calls.find(c => c[0] === 'scale'), ['scale', -140/144, 160/194]);
  assert.equal(calls.filter(c => c[0] === 'drawImage').length, 1);
  assert.equal(drawPaintedChemicalAsset(ctx, { ...options, width: 0 }), false);
  assert.equal(drawPaintedChemicalAsset(ctx, { ...options, x: NaN }), false);
  clearPaintedChemical();
});

test('MI10 image drawing errors restore Canvas state before the vector fallback', () => {
  ready(); let saved = 0;
  const ctx = { save: () => saved++, restore: () => saved--, translate() {}, scale() {}, drawImage() { throw new Error('image lost'); } };
  assert.equal(drawPaintedChemicalAsset(ctx, { part: 'sampling-rig', state: 'working' }), false);
  assert.equal(saved, 0); clearPaintedChemical();
});

test('MI10 canal artwork follows terrain while keeping its physical width and cover origin', () => {
  ready(); const { ctx, calls } = context(), x = 3400, groundAt = value => 700 + (value-x)*.08;
  assert.equal(drawPaintedChemicalAsset(ctx, { part:'canal-junction', state:'covered', x, y:720, width:260, height:56, groundAt }), true);
  const images = calls.filter(call => call[0] === 'drawImage' && call[3] === paintedChemicalFrame('canal-junction','covered').source[1]); assert.ok(images.length > 50);
  const frame = paintedChemicalFrame('canal-junction','covered'), sx=260/200, sy=56/70;
  for (const call of images) {
    const localX=call[6], localY=call[7], stripWidth=call[8]-.06;
    const expected=frame.target[1] + (groundAt(x+(localX+stripWidth/2)*sx)-groundAt(x))/sy;
    assert.ok(Math.abs(localY-expected)<1e-7);
  }
  clearPaintedChemical();
});

test('MI10 covered contamination retains both the polluted body and real bridge plate', () => {
  ready(); const {ctx,calls}=context(), frame=paintedChemicalFrame('canal-junction','contaminated');
  assert.equal(drawPaintedChemicalAsset(ctx,{part:'canal-junction',state:'contaminated',covered:true,x:0,y:0}),true);
  const draws=calls.filter(c=>c[0]==='drawImage'); assert.equal(draws.length,2);
  assert.deepEqual(draws[0].slice(2,6),frame.source);
  assert.deepEqual(draws[1].slice(2,6),PAINTED_CHEMICAL_LAYOUT.canals.coverOverlay.source);
  const broken=context();drawPaintedChemicalAsset(broken.ctx,{part:'canal-junction',state:'destroyed',covered:true});
  assert.equal(broken.calls.filter(c=>c[0]==='drawImage').length,1,'A destroyed canal does not regain its cover');
  clearPaintedChemical();
});

test('MI10 scene rendering does not mutate jobs, samples, fluid mass or physical canal surfaces', () => {
  ready(); const s = createGame({ missionId: 'MI10', walkerId: 'WK09', seed: 156 });
  s.chemical.canals[0].covered = true;
  s.chemical.sampler.collected = true;
  s.chemical.tanks[0].destroyed = true;
  s.chemical.homes[1].habitable = false;
  const before = structuredClone(s), surface = chemicalSurfaceAt(s, s.chemical.canals[0].x), { ctx, calls } = context();
  drawChemicalSite({ ctx, visible: () => true, cameraX: 2800 }, s, s.elapsed);
  assert.deepEqual(s, before); assert.deepEqual(chemicalSurfaceAt(s, s.chemical.canals[0].x), surface);
  assert.equal(surface.rise, 10);
  assert.ok(calls.some(c => c[0] === 'lineTo' && Math.abs(c[1]-s.chemical.canals[0].x) < 1e-8 && Math.abs(c[2]-surface.groundY) < 1e-8), 'Cover still follows chemicalSurfaceAt');
  assert.ok(calls.filter(c => c[0] === 'drawImage').length >= 15, 'Equipment is painted without changing simulation');
  clearPaintedChemical();
});
