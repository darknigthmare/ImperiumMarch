import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_PARTICLE_IMPACTS_LAYOUT } from '../src/painted-particle-impacts-layout.mjs';
import { PAINTED_PARTICLE_IMPACTS_URLS, PAINTED_PARTICLE_IMPACTS_COLORS,
  setPaintedParticleImpactsImage, clearPaintedParticleImpacts, loadPaintedParticleImpacts,
  paintedParticleImpactsStatus, paintedImpactParticleFrame, drawPaintedImpactParticle,
} from '../src/painted-particle-impacts.mjs';

const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, a + ' differs from ' + b);
const nearPoint = (a, b) => a.forEach((value, index) => near(value, b[index]));
const draws = r => r.calls.filter(call => call.method === 'drawImage');
const particle = (type = 'spark', extra = {}) => ({
  type, color: PAINTED_PARTICLE_IMPACTS_COLORS[type], x: 432, y: 628,
  vx: 120, vy: -90, size: 5, life: 1, maxLife: 1, ...extra,
});
const atlasImage = key => ({ key, width: PAINTED_PARTICLE_IMPACTS_LAYOUT[key].size[0], height: PAINTED_PARTICLE_IMPACTS_LAYOUT[key].size[1] });
function decoded() {
  for (const key of Object.keys(PAINTED_PARTICLE_IMPACTS_LAYOUT)) setPaintedParticleImpactsImage(key, atlasImage(key));
}
function sourcePoint(r, draw, frame, x, y) {
  const [sx, sy, sw, sh] = frame.source, [tx, ty, tw, th] = frame.target;
  return r.point(draw, [tx + (x - sx) * tw / sw, ty + (y - sy) * th / sh]);
}
function clipPoints(r) {
  const points = [];
  for (const call of r.calls) {
    if (call.method === 'clip') break;
    if (call.method === 'moveTo' || call.method === 'lineTo') points.push(r.point(call, call.args));
    if (call.method === 'arc') {
      const [x, y, radius, start, end] = call.args;
      for (let i = 0; i <= 256; i++) {
        const angle = start + (end - start) * i / 256;
        points.push(r.point(call, [x + radius * Math.cos(angle), y + radius * Math.sin(angle)]));
      }
    }
  }
  return points;
}
function publicEmission(type) {
  const state = createGame({ missionId: 'MI01', walkerId: 'WK05', difficulty: 'story', seed: 1511 });
  let ticks = 0;
  while (ticks < 600 && !state.particles.some(p => p.type === type)) {
    updateGame(state, 1 / 60, { brace: true, fire: type === 'spark' && ticks === 0,
      secondary: type === 'blast' && ticks === 0, aimX: 600, aimY: terrainAt(600, state.planetId) + 20 });
    ticks++;
  }
  assert.ok(state.particles.some(p => p.type === type), 'Public MI01 inputs emitted ' + type);
  assert.ok(state.events.some(e => e.type === (type === 'spark' ? 'shot' : 'explosion')));
  return state;
}
test.afterEach(clearPaintedParticleImpacts);

test('impact lifetimes select all six ages once; reduced motion fixes only the selected cell', () => {
  for (const type of ['spark', 'blast']) for (const maxLife of [.22, 1, 7]) for (let stage = 0; stage < 6; stage++) {
    const p = Object.freeze(particle(type, { maxLife, life: maxLife * (1 - (stage + .5) / 6) }));
    const frame = paintedImpactParticleFrame(p), still = paintedImpactParticleFrame(p, { reducedMotion: true });
    assert.equal(frame.name, 'age-' + stage); assert.equal(still.name, 'age-0');
    near(frame.age, 1 - p.life / p.maxLife); assert.equal(still.age, frame.age);
    for (const property of ['radius', 'length', 'angle', 'head', 'tail', 'center']) assert.deepEqual(still[property], frame[property]);
    assert.deepEqual(paintedImpactParticleFrame(p), frame, 'repeated paused draws do not advance an age');
  }
  assert.equal(paintedImpactParticleFrame(particle('spark', { life: 1 })).name, 'age-0');
  assert.equal(paintedImpactParticleFrame(particle('blast', { life: Number.EPSILON })).name, 'age-5');
});

test('twelve measured source crops stay inside their atlas and preserve their authored center', () => {
  let count = 0;
  for (const [type, atlas] of Object.entries(PAINTED_PARTICLE_IMPACTS_LAYOUT)) {
    assert.equal(Object.keys(atlas.frames).length, 6);
    for (let stage = 0; stage < 6; stage++) {
      const p = particle(type, { life: 1 - (stage + .5) / 6 }), frame = paintedImpactParticleFrame(p);
      const [x, y, w, h] = frame.source, [tx, ty, tw, th] = frame.target;
      const [ax, ay, aw, ah] = frame.anchorBounds, [ox, oy] = frame.anchors.sourceOrigin;
      assert.ok(x >= 0 && y >= 0 && x + w <= atlas.size[0] && y + h <= atlas.size[1]);
      assert.ok(ax >= x && ay >= y && ax + aw <= x + w && ay + ah <= y + h);
      near(tx + (ox - x) * tw / w, 0); near(ty + (oy - y) * th / h, 0);
      assert.equal(frame.usage, 'runtime');
      if (type === 'spark') {
        near(tx + (ax - x) * tw / w, -1); near(ty + (ay - y) * th / h, -1);
        near(tx + (ax + aw - x) * tw / w, 1); near(ty + (ay + ah - y) * th / h, 1);
      } else { near(tw / w, th / h); near(tw / w, 1 / frame.sourceRadius); }
      frame.target[0] = -999; frame.anchors.sourceOrigin[0] = -999; frame.center[0] = -999;
      const unchanged = paintedImpactParticleFrame(p);
      assert.notEqual(unchanged.target[0], -999); assert.notEqual(unchanged.anchors.sourceOrigin[0], -999);
      assert.notEqual(unchanged.center[0], -999); count++;
    }
  }
  assert.equal(count, 12);
});

test('spark head, tail and useful paint envelope follow velocity in every quadrant with exact round caps', () => {
  decoded();
  for (const [vx, vy] of [[160, 0], [0, 160], [-160, 0], [0, -160], [120, -90], [-120, 90]]) {
    const p = particle('spark', { vx, vy }), frame = paintedImpactParticleFrame(p), r = combatRecorder();
    assert.ok(drawPaintedImpactParticle(r.ctx, p)); assert.equal(draws(r).length, 1);
    const draw = draws(r)[0], speed = Math.hypot(vx, vy), u = [vx / speed, vy / speed];
    const head = [p.x, p.y], tail = [p.x - .025 * vx, p.y - .025 * vy];
    near(frame.length, .025 * speed); near(frame.angle, Math.atan2(vy, vx));
    nearPoint(frame.head, head); nearPoint(frame.tail, tail);
    nearPoint(r.point(draw, [0, 0]), [(head[0] + tail[0]) / 2, (head[1] + tail[1]) / 2]);
    const [ax, ay, aw, ah] = frame.anchorBounds;
    nearPoint(sourcePoint(r, draw, frame, ax + aw, ay + ah / 2), [head[0] + u[0], head[1] + u[1]]);
    nearPoint(sourcePoint(r, draw, frame, ax, ay + ah / 2), [tail[0] - u[0], tail[1] - u[1]]);
    const arcs = r.calls.filter(call => call.method === 'arc');
    assert.equal(arcs.length, 2);
    for (const [index, expected] of [head, tail].entries()) {
      nearPoint(r.point(arcs[index], arcs[index].args.slice(0, 2)), expected);
      near(arcs[index].args[2], 1); near(Math.hypot(...arcs[index].matrix.slice(0, 2)), 1);
      near(Math.hypot(...arcs[index].matrix.slice(2, 4)), 1);
    }
    // Every directional support of the actual clip equals that of the old
    // two-unit round-capped segment, including directions oblique to its axis.
    const points = clipPoints(r);
    for (let sample = 0; sample < 16; sample++) {
      const angle = sample * Math.PI / 8, nx = Math.cos(angle), ny = Math.sin(angle);
      const actual = Math.max(...points.map(([x, y]) => x * nx + y * ny));
      const expected = Math.max(head[0] * nx + head[1] * ny, tail[0] * nx + tail[1] * ny) + 1;
      near(actual, expected, .0001);
    }
    assert.ok(r.balanced());
  }
});

test('spark never reads size and preserves arbitrarily short representable segments without a length floor', () => {
  decoded();
  const p = particle('spark');
  Object.defineProperty(p, 'size', { get() { throw new Error('Spark size must not be read'); } });
  assert.ok(paintedImpactParticleFrame(p)); assert.ok(drawPaintedImpactParticle(combatRecorder().ctx, p));
  const reference = combatRecorder(); drawPaintedImpactParticle(reference.ctx, particle());
  for (const size of [undefined, 0, -2, NaN, Infinity, 1e12]) {
    const r = combatRecorder(); assert.ok(drawPaintedImpactParticle(r.ctx, particle('spark', { size })));
    assert.deepEqual(r.calls, reference.calls);
  }
  for (const speed of [1, .01, .000001]) {
    const small = particle('spark', { x: 0, y: 0, vx: speed, vy: 0 }), r = combatRecorder();
    const frame = paintedImpactParticleFrame(small); near(frame.length, speed * .025);
    assert.ok(drawPaintedImpactParticle(r.ctx, small)); near(draws(r)[0].matrix[0], 1 + speed * .0125);
  }
  for (const extra of [{ vx: 0, vy: 0 }, { x: 0, y: 0, vx: Number.MIN_VALUE, vy: 0 },
    { x: 1e20, y: 1e20, vx: 1, vy: 1 }]) {
    const r = combatRecorder(); assert.equal(paintedImpactParticleFrame(particle('spark', extra)), null);
    assert.equal(drawPaintedImpactParticle(r.ctx, particle('spark', extra)), false); assert.equal(draws(r).length, 0);
  }
});

test('blast retains its exact simulated circle and both kinds preserve caller opacity through every age', () => {
  decoded();
  for (const type of ['spark', 'blast']) for (let stage = 0; stage < 6; stage++) for (const reducedMotion of [false, true]) {
    const p = particle(type, { life: 1 - (stage + .5) / 6 }), r = combatRecorder();
    r.ctx.globalAlpha = .137;
    assert.ok(drawPaintedImpactParticle(r.ctx, p, { reducedMotion }));
    assert.equal(r.ctx.globalAlpha, .137); assert.ok(r.balanced());
    if (type === 'blast') {
      const circle = r.calls.find(call => call.method === 'arc'), draw = draws(r)[0];
      nearPoint(r.point(circle, [0, 0]), [p.x, p.y]); nearPoint(r.point(draw, [0, 0]), [p.x, p.y]);
      near(circle.args[2], 1); near(circle.matrix[0], p.size); near(circle.matrix[3], p.size);
      near(draw.matrix[0], p.size); near(draw.matrix[3], p.size);
    }
  }
  assert.ok(drawPaintedImpactParticle(combatRecorder().ctx, particle('blast', { vx: undefined, vy: NaN })));
});

test('custom palettes, unknown types and invalid relevant geometry keep the vector fallback', () => {
  decoded();
  const cases = [null, {}, particle('dust'), particle('smoke'), particle('toString'),
    particle('spark', { color: '#884422' }), particle('blast', { color: undefined }), particle('spark', { color: ' #ffd09a' }),
    particle('spark', { vx: NaN }), particle('spark', { vy: Infinity }), particle('spark', { vx: Number.MAX_VALUE, vy: Number.MAX_VALUE }),
    particle('blast', { size: 0 }), particle('blast', { size: -1 }), particle('blast', { size: NaN }),
    particle('blast', { size: Infinity }), particle('blast', { size: Number.MAX_VALUE })];
  for (const type of ['spark', 'blast']) for (const extra of [{ x: NaN }, { y: Infinity }, { life: 0 }, { life: -1 },
    { life: 2 }, { life: NaN }, { maxLife: 0 }, { maxLife: Infinity }]) cases.push(particle(type, extra));
  for (const p of cases) {
    const r = combatRecorder(); r.ctx.globalAlpha = .48;
    assert.equal(paintedImpactParticleFrame(p), null); assert.equal(drawPaintedImpactParticle(r.ctx, p), false);
    assert.equal(draws(r).length, 0); assert.equal(r.ctx.globalAlpha, .48); assert.ok(r.balanced());
  }
  for (const type of ['spark', 'blast']) assert.ok(drawPaintedImpactParticle(combatRecorder().ctx,
    particle(type, { color: PAINTED_PARTICLE_IMPACTS_COLORS[type].toUpperCase() })));
});

test('real MI01 shots and rocket impacts traverse six ages and expire without rendering changes to simulation', () => {
  decoded();
  for (const type of ['spark', 'blast']) {
    const state = publicEmission(type), p = state.particles.find(item => item.type === type), seen = new Set();
    for (let tick = 0; tick < 180 && p.life > 0; tick++) {
      const before = JSON.stringify(state), frame = paintedImpactParticleFrame(p);
      seen.add(frame.name);
      for (const reducedMotion of [false, true]) {
        const first = combatRecorder(), second = combatRecorder();
        assert.ok(drawPaintedImpactParticle(first.ctx, p, { reducedMotion }));
        assert.ok(drawPaintedImpactParticle(second.ctx, p, { reducedMotion }));
        assert.deepEqual(first.calls, second.calls, 'the same paused simulation tick keeps the same exact drawing');
      }
      assert.equal(JSON.stringify(state), before, 'including particles, RNG and events');
      updateGame(state, 1 / 60, { brace: true });
    }
    assert.equal(seen.size, 6); assert.equal(paintedImpactParticleFrame(p), null);
    assert.ok(!state.particles.includes(p), 'the simulation removes the expired particle');
  }
});

test('the real particle renderer keeps historical alpha, custom fallback, visibility and reduced-motion geometry', () => {
  decoded();
  for (const reducedMotion of [false, true]) {
    const particles = [particle('spark', { life: .7 }), particle('blast', { life: .4 }),
      particle('spark', { color: '#124578' }), particle('blast', { color: '#975321' })];
    const state = { particles }, before = JSON.stringify(state), r = combatRecorder(), painted = [];
    const originalDraw = r.ctx.drawImage;
    r.ctx.drawImage = (...args) => { painted.push({ key: args[0].key, alpha: r.ctx.globalAlpha }); originalDraw(...args); };
    const renderer = Object.assign(Object.create(Renderer.prototype), { ctx: r.ctx, combatReducedMotion: reducedMotion, visible: () => true });
    renderer.drawParticles(state);
    assert.deepEqual(painted, [{ key: 'spark', alpha: .7 }, { key: 'blast', alpha: .4 }]);
    assert.equal(r.calls.filter(call => call.method === 'stroke').length, 1, 'custom spark remains a line');
    assert.equal(r.calls.filter(call => call.method === 'fill').length, 1, 'custom blast remains a circle');
    assert.equal(JSON.stringify(state), before); assert.equal(r.ctx.globalAlpha, 1); assert.ok(r.balanced());
    const paused = combatRecorder(); renderer.ctx = paused.ctx; renderer.drawParticles(state);
    assert.deepEqual(draws(r), draws(paused));
    const hidden = combatRecorder(); renderer.ctx = hidden.ctx; renderer.visible = () => false;
    renderer.drawParticles(state); assert.equal(hidden.calls.length, 0);
  }
});

test('missing, undecodable and wrong-size atlases fall back independently; draw failure restores caller state', async () => {
  const r = combatRecorder(); r.ctx.globalAlpha = .21;
  assert.equal(drawPaintedImpactParticle(r.ctx, particle()), false);
  assert.deepEqual(paintedParticleImpactsStatus(), { spark: { state: 'idle' }, blast: { state: 'idle' } });
  await loadPaintedParticleImpacts({ loadImage: async (url, key) => {
    assert.equal(url, PAINTED_PARTICLE_IMPACTS_URLS[key]);
    if (key === 'spark') throw new Error('decode failure');
    return atlasImage(key);
  } });
  assert.equal(paintedParticleImpactsStatus().spark.state, 'failed'); assert.equal(paintedParticleImpactsStatus().blast.state, 'ready');
  assert.equal(drawPaintedImpactParticle(r.ctx, particle()), false); assert.ok(drawPaintedImpactParticle(r.ctx, particle('blast')));
  decoded(); r.ctx.drawImage = () => { throw new Error('surface lost'); };
  assert.equal(drawPaintedImpactParticle(r.ctx, particle()), false); assert.equal(paintedParticleImpactsStatus().spark.state, 'failed');
  assert.equal(paintedParticleImpactsStatus().blast.state, 'ready'); assert.equal(r.ctx.globalAlpha, .21); assert.ok(r.balanced());
  assert.throws(() => setPaintedParticleImpactsImage('spark', { width: 1, height: 1 }), RangeError);
  assert.throws(() => setPaintedParticleImpactsImage('toString', atlasImage('spark')), RangeError);
  clearPaintedParticleImpacts();
  await loadPaintedParticleImpacts({ loadImage: async (url, key) => key === 'spark' ? { width: 1, height: 1 } : atlasImage(key) });
  assert.equal(paintedParticleImpactsStatus().spark.state, 'failed'); assert.equal(paintedParticleImpactsStatus().blast.state, 'ready');
  const status = paintedParticleImpactsStatus(); status.blast.state = 'failed';
  assert.equal(paintedParticleImpactsStatus().blast.state, 'ready');
});

test('loader deduplicates work and late completions cannot restore cleared images or overwrite a new generation', async () => {
  const pending = [];
  const first = loadPaintedParticleImpacts({ loadImage: (url, key) => new Promise((resolve, reject) => pending.push({ key, resolve, reject })) });
  assert.equal(loadPaintedParticleImpacts({ loadImage: () => { throw new Error('must reuse the active batch'); } }), first);
  assert.equal(pending.length, 2); assert.ok(Object.values(paintedParticleImpactsStatus()).every(status => status.state === 'loading'));
  clearPaintedParticleImpacts();
  for (const item of pending) item.resolve(atlasImage(item.key));
  await first;
  assert.ok(Object.values(paintedParticleImpactsStatus()).every(status => status.state === 'idle'));
  assert.equal(drawPaintedImpactParticle(combatRecorder().ctx, particle()), false);

  const stale = [];
  const oldBatch = loadPaintedParticleImpacts({ loadImage: (url, key) => new Promise((resolve, reject) => stale.push({ key, resolve, reject })) });
  clearPaintedParticleImpacts();
  const currentImages = Object.fromEntries(Object.keys(PAINTED_PARTICLE_IMPACTS_URLS).map(key => [key, atlasImage(key)]));
  await loadPaintedParticleImpacts({ loadImage: async (url, key) => currentImages[key] });
  stale[0].reject(new Error('late old failure')); stale[1].resolve(atlasImage(stale[1].key)); await oldBatch;
  for (const type of ['spark', 'blast']) {
    assert.equal(paintedParticleImpactsStatus()[type].state, 'ready');
    const r = combatRecorder(); assert.ok(drawPaintedImpactParticle(r.ctx, particle(type)));
    assert.equal(draws(r)[0].args[0], currentImages[type]);
  }
});
