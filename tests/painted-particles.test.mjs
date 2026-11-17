import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_PARTICLES_LAYOUT } from '../src/painted-particles-layout.mjs';
import { PAINTED_PARTICLE_COLORS, setPaintedParticlesImage, clearPaintedParticles,
  loadPaintedParticles, paintedParticlesStatus, paintedParticleFrame, drawPaintedParticle,
} from '../src/painted-particles.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' differs from ' + b);
const draws = r => r.calls.filter(call => call.method === 'drawImage');
const particle = (type = 'smoke', extra = {}) => ({
  type, color: PAINTED_PARTICLE_COLORS[type], x: 432, y: 628,
  vx: 12, vy: -9, size: 15, life: 1, maxLife: 1, ...extra,
});
function decoded() {
  for (const [key, atlas] of Object.entries(PAINTED_PARTICLES_LAYOUT))
    setPaintedParticlesImage(key, { key, width: atlas.size[0], height: atlas.size[1] });
}
function publicEmission(type) {
  const state = createGame({ missionId: 'MI01', walkerId: 'WK05', difficulty: 'story', seed: 1510 });
  let ticks = 0;
  while (ticks < 600 && !state.particles.some(p => p.type === type)) {
    updateGame(state, 1 / 60, type === 'dust' ? { move: 1 }
      : { brace: true, secondary: ticks === 0, aimX: 600, aimY: terrainAt(600, state.planetId) + 20 });
    ticks++;
  }
  assert.ok(state.particles.some(p => p.type === type), 'Public inputs emitted ' + type);
  return state;
}
test.afterEach(clearPaintedParticles);

test('particle ages progress through six cells without wrapping and reduced motion fixes only the artwork', () => {
  for (const type of ['smoke', 'dust']) for (let stage = 0; stage < 6; stage++) {
    const p = Object.freeze(particle(type, { life: 1 - (stage + .5) / 6 }));
    const frame = paintedParticleFrame(p), still = paintedParticleFrame(p, { reducedMotion: true });
    assert.equal(frame.name, 'age-' + stage); assert.equal(still.name, 'age-0');
    near(frame.radius, type === 'smoke' ? p.size * (2 - p.life / p.maxLife) : p.size);
    near(still.radius, frame.radius);
    assert.deepEqual(paintedParticleFrame(p), frame, 'a paused particle does not advance');
  }
  assert.equal(paintedParticleFrame(particle('dust', { life: Number.EPSILON })).name, 'age-5');
  assert.equal(paintedParticleFrame(particle('smoke', { life: 0 })), null);
});

test('all twelve measured cells keep their center and aspect ratio inside separate source rectangles', () => {
  decoded(); let count = 0;
  for (const [type, atlas] of Object.entries(PAINTED_PARTICLES_LAYOUT)) for (let stage = 0; stage < 6; stage++) {
    const p = particle(type, { life: 1 - (stage + .5) / 6 }), frame = paintedParticleFrame(p);
    const [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
    assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch);
    assert.ok(x + w <= atlas.size[0] && y + h <= atlas.size[1]);
    const [ax, ay] = frame.anchors.sourceOrigin, [tx, ty, tw, th] = frame.target;
    near(tx + (ax - x) * tw / w, 0); near(ty + (ay - y) * th / h, 0); near(tw / w, th / h);
    near(tw / w, 1 / frame.sourceRadius);
    assert.equal(frame.anchorAlphaThreshold, 2);
    assert.equal(frame.visiblePixels, frame.anchorPixels + frame.alpha1PixelsExcludedFromMeasurement);
    assert.deepEqual(frame.runtimeClip, { shape: 'circle', center: [0, 0], radius: 1 });
    const r = combatRecorder(); r.ctx.globalAlpha = .137;
    assert.ok(drawPaintedParticle(r.ctx, p)); assert.equal(draws(r).length, 1);
    assert.deepEqual(r.point(draws(r)[0], [0, 0]), [p.x, p.y]);
    near(draws(r)[0].matrix[0], frame.radius); near(draws(r)[0].matrix[3], frame.radius);
    const clipCircle = r.calls.find(call => call.method === 'arc');
    assert.deepEqual(clipCircle.args.slice(0, 3), [0, 0, 1]);
    assert.ok(r.calls.some(call => call.method === 'clip'));
    assert.equal(r.ctx.globalAlpha, .137); assert.ok(r.balanced());
    frame.target[0] = -999; assert.notEqual(paintedParticleFrame(p).target[0], -999);
    count++;
  }
  assert.equal(count, 12);
});

test('custom colors, expired particles, invalid geometry, sparks and blasts retain the caller fallback', () => {
  decoded();
  const cases = [null, {}, particle('spark'), particle('blast'), particle('smoke', { color: '#884422' }),
    particle('dust', { color: undefined }), particle('dust', { life: 0 }), particle('dust', { life: -1 }),
    particle('dust', { life: 2 }), particle('smoke', { maxLife: 0 }), particle('smoke', { size: 0 }),
    particle('smoke', { size: -1 }), particle('smoke', { size: Infinity }),
    particle('smoke', { size: Number.MAX_VALUE, life: .1 }), particle('smoke', { x: NaN }),
    particle('dust', { y: Infinity }), particle('dust', { life: NaN }), particle('dust', { maxLife: Infinity })];
  for (const p of cases) {
    const r = combatRecorder(); r.ctx.globalAlpha = .48;
    assert.equal(paintedParticleFrame(p), null); assert.equal(drawPaintedParticle(r.ctx, p), false);
    assert.equal(draws(r).length, 0); assert.equal(r.ctx.globalAlpha, .48); assert.ok(r.balanced());
  }
  assert.ok(drawPaintedParticle(combatRecorder().ctx, particle('dust', { color: '#BEA58C' })));
});

test('real footfalls and a real projectile impact traverse every age without rendering writes or extra particles', () => {
  decoded();
  for (const type of ['dust', 'smoke']) {
    const state = publicEmission(type), p = state.particles.find(item => item.type === type), seen = new Set();
    assert.ok(state.events.some(e => e.type === (type === 'dust' ? 'step' : 'explosion')));
    for (let tick = 0; tick < 180 && p.life > 0; tick++) {
      const before = JSON.stringify(state), frame = paintedParticleFrame(p), r = combatRecorder();
      seen.add(frame.name);
      assert.ok(drawPaintedParticle(r.ctx, p)); assert.ok(drawPaintedParticle(r.ctx, p, { reducedMotion: true }));
      assert.equal(JSON.stringify(state), before);
      updateGame(state, 1 / 60, { brace: true });
    }
    assert.equal(seen.size, 6); assert.equal(paintedParticleFrame(p), null);
    assert.ok(!state.particles.includes(p), 'simulation expiration removes the tracked particle');
  }
});

test('normal renderer preserves historical opacity and circles for custom colors, sparks and blasts', () => {
  decoded();
  const particles = [particle('smoke', { life: .7 }), particle('dust', { life: .4 }),
    particle('dust', { color: '#124578' }), particle('smoke', { color: '#975321' }),
    particle('spark', { color: '#ffd09a' }), particle('blast', { color: '#f4a56d' })];
  const state = { particles }, before = JSON.stringify(state), r = combatRecorder(), painted = [], circles = [];
  const originalDraw = r.ctx.drawImage, originalArc = r.ctx.arc, originalFill = r.ctx.fill;
  let circleRadius = null;
  r.ctx.drawImage = (...args) => { painted.push({ key: args[0].key, alpha: r.ctx.globalAlpha }); originalDraw(...args); };
  r.ctx.arc = (...args) => { circleRadius = args[2]; originalArc(...args); };
  r.ctx.fill = (...args) => {
    if (circleRadius !== null) circles.push({ radius: circleRadius, color: r.ctx.fillStyle, alpha: r.ctx.globalAlpha });
    circleRadius = null; originalFill(...args);
  };
  const renderer = Object.assign(Object.create(Renderer.prototype), { ctx: r.ctx, combatReducedMotion: false, visible: () => true });
  renderer.drawParticles(state);
  assert.deepEqual(painted, [{ key: 'smoke', alpha: .7 * .32 }, { key: 'dust', alpha: .4 }]);
  assert.equal(circles.length, 3);
  assert.ok(circles.some(circle => circle.color === '#124578' && circle.radius === 15 && circle.alpha === 1));
  assert.ok(circles.some(circle => circle.color === '#975321' && circle.radius === 15 && circle.alpha === .32));
  assert.ok(circles.some(circle => circle.color === '#f4a56d'));
  assert.equal(JSON.stringify(state), before); assert.equal(r.ctx.globalAlpha, 1); assert.ok(r.balanced());
  const hidden = combatRecorder(); renderer.ctx = hidden.ctx; renderer.visible = () => false;
  renderer.drawParticles(state); assert.equal(draws(hidden).length, 0);
});

test('real paused emission keeps exact draw calls in both motion settings and never changes simulation state', () => {
  decoded();
  for (const type of ['smoke', 'dust']) {
    const state = publicEmission(type), before = JSON.stringify(state);
    for (const reducedMotion of [false, true]) {
      const first = combatRecorder(), second = combatRecorder();
      const draw = r => Object.assign(Object.create(Renderer.prototype), { ctx: r.ctx, combatReducedMotion: reducedMotion, visible: () => true }).drawParticles(state);
      draw(first); draw(second);
      assert.deepEqual(draws(first), draws(second)); assert.ok(draws(first).length > 0);
      assert.equal(draws(first).length, state.particles.filter(p => p.type === 'smoke' || p.type === 'dust').length);
      assert.equal(JSON.stringify(state), before);
    }
  }
});

test('missing and failed images preserve fallback, restore Canvas state, and leave the other atlas usable', async () => {
  const r = combatRecorder(); r.ctx.globalAlpha = .21;
  assert.equal(drawPaintedParticle(r.ctx, particle()), false);
  await loadPaintedParticles({ loadImage: async (url, key) => {
    if (key === 'smoke') throw new Error('decode failure');
    const atlas = PAINTED_PARTICLES_LAYOUT[key]; return { width: atlas.size[0], height: atlas.size[1] };
  } });
  assert.equal(paintedParticlesStatus().smoke.state, 'failed'); assert.equal(paintedParticlesStatus().dust.state, 'ready');
  assert.equal(drawPaintedParticle(r.ctx, particle()), false); assert.ok(drawPaintedParticle(r.ctx, particle('dust')));
  decoded();
  r.ctx.drawImage = () => { throw new Error('surface lost'); };
  assert.equal(drawPaintedParticle(r.ctx, particle()), false); assert.equal(paintedParticlesStatus().smoke.state, 'failed');
  assert.equal(paintedParticlesStatus().dust.state, 'ready'); assert.equal(r.ctx.globalAlpha, .21); assert.ok(r.balanced());
  assert.throws(() => setPaintedParticlesImage('smoke', { width: 1, height: 1 }), RangeError);
});

test('late image completions cannot resurrect a cleared particle batch', async () => {
  const pending = [];
  const loading = loadPaintedParticles({ loadImage: (url, key) => new Promise(resolve => pending.push({ key, resolve })) });
  clearPaintedParticles();
  for (const item of pending) {
    const atlas = PAINTED_PARTICLES_LAYOUT[item.key]; item.resolve({ width: atlas.size[0], height: atlas.size[1] });
  }
  await loading;
  assert.ok(Object.values(paintedParticlesStatus()).every(status => status.state === 'idle'));
});
