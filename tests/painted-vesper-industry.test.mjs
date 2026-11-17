import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_VESPER_INDUSTRY_LAYOUT } from '../src/painted-vesper-industry-layout.mjs';
import { PAINTED_VESPER_LAYOUT } from '../src/painted-vesper-layout.mjs';
import { setPaintedVesperImage, clearPaintedVesper } from '../src/painted-vesper.mjs';
import { setPaintedVesperIndustryImage, clearPaintedVesperIndustry, loadPaintedVesperIndustry,
  paintedVesperIndustryStatus, paintedVesperIndustryFrame, vesperIndustryBounds,
  drawPaintedVesperIndustryPart, drawPaintedVesperIndustry, drawPaintedVesperIndustryMaintenance,
} from '../src/painted-vesper-industry.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} differs from ${b}`);
const draws = r => r.calls.filter(call => call.method === 'drawImage');
function decoded() {
  const [width, height] = PAINTED_VESPER_INDUSTRY_LAYOUT.industry.size;
  setPaintedVesperIndustryImage('industry', { key: 'vesper-industry', width, height });
}
test.afterEach(() => { clearPaintedVesperIndustry(); clearPaintedVesper(); });

test('Vesper structures keep the historical envelopes and base at all sampled heights and fractional cameras', () => {
  decoded();
  for (const part of ['silo', 'chimney']) for (const h of [125, 185.25, 245]) for (const x of [-621.125, 0, 619.704]) {
    const r = combatRecorder(), f = paintedVesperIndustryFrame(part);
    const [sx, sy, sw, sh] = f.source, [cx, cy, cw, ch] = f.cell;
    assert.ok(sx >= cx && sy >= cy && sx + sw <= cx + cw && sy + sh <= cy + ch);
    r.ctx.translate(0, 180); r.ctx.scale(1, .75); r.ctx.globalAlpha = .82;
    assert.ok(drawPaintedVesperIndustryPart(r.ctx, { part, x, h }));
    const call = draws(r)[0], [, , , , , dx, dy, dw, dh] = call.args;
    const [bx, by, bw, bh] = f.alphaBounds, [ax, ay] = f.anchors.sourceBase;
    const bounds = vesperIndustryBounds({ part, x, h });
    assert.deepEqual(r.calls.find(c => c.method === 'rect').args, bounds);
    const worldBase = r.point(call, [dx + (ax - sx) * dw / sw, dy + (ay - sy) * dh / sh]);
    near(worldBase[0], part === 'silo' ? x + 37 : x + 101.5); near(worldBase[1], 630);
    near(dx + (bx - sx) * dw / sw, bounds[0]); near(dy + (by - sy) * dh / sh, bounds[1]);
    near(bw * dw / sw, bounds[2]); near(bh * dh / sh, bounds[3]);
    assert.equal(r.ctx.globalAlpha, .82); assert.ok(r.balanced());
  }
  const copy = paintedVesperIndustryFrame('silo'); copy.alphaBounds[0] = -999;
  assert.notEqual(paintedVesperIndustryFrame('silo').alphaBounds[0], -999);
  for (const options of [{ part: 'missing' }, { part: 'silo', h: 0 }, { part: 'chimney', x: NaN }]) {
    const r = combatRecorder(); assert.equal(drawPaintedVesperIndustryPart(r.ctx, options), false); assert.equal(draws(r).length, 0);
  }
});

test('Vesper maintenance reuses the acquired atlas independently of the two new structures', () => {
  const r = combatRecorder();
  assert.equal(drawPaintedVesperIndustryMaintenance(r.ctx, { x: 620 }), false);
  const [width, height] = PAINTED_VESPER_LAYOUT.outposts.size;
  setPaintedVesperImage('outposts', { key: 'vesper-outposts', width, height });
  assert.deepEqual(drawPaintedVesperIndustry(r.ctx, { x: 620, h: 190 }), { silo: false, chimney: false });
  assert.ok(drawPaintedVesperIndustryMaintenance(r.ctx, { x: 620 }));
  const call = draws(r)[0]; assert.equal(call.args[0].key, 'vesper-outposts');
  assert.deepEqual(r.point(call, [0, 0]), [815, 599]); assert.ok(r.balanced());
  assert.equal(paintedVesperIndustryStatus().industry.state, 'idle');
});

test('Only PL01 uses the industry atlas; slot counts, legacy smoke and simulation facts remain unchanged', () => {
  const beforeLoading = combatRecorder();
  Object.assign(Object.create(Renderer.prototype), { ctx: beforeLoading.ctx }).drawIndustry(1200.25, 17);
  decoded();
  const afterLoading = combatRecorder();
  Object.assign(Object.create(Renderer.prototype), { ctx: afterLoading.ctx }).drawIndustry(1200.25, 17);
  assert.deepEqual(afterLoading.calls.filter(c => c.method === 'arc').map(c => c.args),
    beforeLoading.calls.filter(c => c.method === 'arc').map(c => c.args), 'historical smoke position, radius and count retained');
  assert.equal(afterLoading.calls.filter(c => c.method === 'arc').length, 24);
  for (const missionId of ['MI01', 'MI02', 'MI03', 'MI04', 'MI05', 'MI09', 'MI13', 'op03']) {
    const state = createGame({ missionId, seed: 1511 }), before = JSON.stringify(state), r = combatRecorder();
    const renderer = Object.assign(Object.create(Renderer.prototype), { ctx: r.ctx, cameraX: 1200.25,
      combatReducedMotion: true, panorama: { key: 'panorama', width: 2172, height: 724 }, panoramaReady: true });
    renderer.drawBackground(state, 17);
    const painted = draws(r).filter(c => c.args[0].key === 'vesper-industry');
    assert.equal(painted.length, state.planetId === 'PL01' ? 12 : 0, `${missionId}: existing six slots only`);
    assert.equal(JSON.stringify(state), before); assert.ok(r.balanced());
  }
});

test('Missing, bad-size, failed and obsolete industry images retain a usable fallback', async () => {
  const r = combatRecorder(); assert.equal(drawPaintedVesperIndustryPart(r.ctx, { part: 'silo' }), false);
  await loadPaintedVesperIndustry({ loadImage: async () => ({ width: 1, height: 1 }) });
  assert.equal(paintedVesperIndustryStatus().industry.state, 'failed');
  assert.equal(drawPaintedVesperIndustryPart(r.ctx, { part: 'chimney' }), false);
  assert.throws(() => setPaintedVesperIndustryImage('industry', { width: 1, height: 1 }), RangeError);
  clearPaintedVesperIndustry(); decoded();
  r.ctx.drawImage = () => { throw new Error('lost drawing surface'); };
  assert.equal(drawPaintedVesperIndustryPart(r.ctx, { part: 'silo' }), false);
  assert.equal(paintedVesperIndustryStatus().industry.state, 'failed'); assert.ok(r.balanced());
  clearPaintedVesperIndustry(); let release;
  const pending = loadPaintedVesperIndustry({ loadImage: () => new Promise(resolve => { release = resolve; }) });
  clearPaintedVesperIndustry(); release({ width: 1536, height: 1024 }); await pending;
  assert.equal(paintedVesperIndustryStatus().industry.state, 'idle');
});
