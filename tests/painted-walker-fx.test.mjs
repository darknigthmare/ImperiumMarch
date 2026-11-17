import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS } from '../src/content.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';
import { drawWalker } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_WALKER_FX_LAYOUT } from '../src/painted-walker-fx-layout.mjs';
import { WALKER_MUZZLE_CORE_POINTS, clearPaintedWalkerFx, setPaintedWalkerFxImage,
  loadPaintedWalkerFx, paintedWalkerFxStatus, paintedMuzzleFlashFrame, paintedVentPuffFrame,
  drawPaintedMuzzleFlash, drawPaintedVentPuff } from '../src/painted-walker-fx.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' differs from ' + b);
const length = walker => walker.legs === 4 ? 112 : walker.legs === 6 ? 101 : 92;
const calls = (r, key) => r.calls.filter(c => c.method === 'drawImage' && c.args[0].key === key);
function decoded() {
  for (const [key, atlas] of Object.entries(PAINTED_WALKER_FX_LAYOUT))
    setPaintedWalkerFxImage(key, { key, width: atlas.size[0], height: atlas.size[1] });
}
function stateFor(walker) { return createGame({ missionId: 'MI01', walkerId: walker.id, difficulty: 'story', seed: 1511 }); }
test.afterEach(clearPaintedWalkerFx);

test('ten measured frames retain source pixels, anchors, shared core scale and historical clips', () => {
  let count = 0;
  assert.deepEqual(WALKER_MUZZLE_CORE_POINTS, [[0, -7], [33, -3], [18, 0], [41, 4], [1, 8]]);
  for (const [key, atlas] of Object.entries(PAINTED_WALKER_FX_LAYOUT)) for (const frame of Object.values(atlas.frames)) {
    const [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
    const [ax, ay] = frame.anchors.sourceOrigin, [tx, ty, tw, th] = frame.target;
    assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch);
    near(tx + (ax - x) * tw / w, 0); near(ty + (ay - y) * th / h, 0); near(tw / w, th / h);
    assert.equal(frame.visiblePixels, frame.anchorPixels + frame.lowAlphaPixelsExcludedFromMeasurementOnly);
    assert.ok(frame.maxCellGutterAlpha <= 1); assert.equal(frame.usage, 'runtime');
    if (key === 'muzzle') {
      near(tw / w, atlas.commonSourceScale);
      assert.deepEqual(frame.runtimeClip, { shape: 'polygon', points: WALKER_MUZZLE_CORE_POINTS });
    } else {
      near(tw / w, 1 / frame.sourceRadius);
      assert.deepEqual(frame.runtimeClip, { shape: 'circle', center: [0, 0], radius: 1 });
    }
    count++;
  }
  assert.equal(count, 10);
});

test('six chassis and both aiming directions retain exact muzzle origins, core clip and procedural halo', () => {
  decoded();
  for (const walker of WALKERS) for (const facing of [-1, 1]) for (const elevation of [-.25, .25]) {
    const s = stateFor(walker), p = s.player;
    p.facing = facing; p.aimAngle = facing === 1 ? elevation : Math.PI - elevation;
    p.fireCooldown = walker.fireRate;
    const before = JSON.stringify(s), r = combatRecorder(), gradients = [];
    r.ctx.createRadialGradient = (...args) => {
      const entry = { args, stops: [] }; gradients.push(entry);
      return { addColorStop: (...stop) => entry.stops.push(stop) };
    };
    drawWalker(r.ctx, p, walker, s.elapsed, { reducedMotion: false });
    const image = calls(r, 'muzzle'); assert.equal(image.length, 1);
    const point = r.point(image[0], [0, 0]);
    near(point[0], p.x + 9 + Math.cos(p.aimAngle) * length(walker));
    near(point[1], p.y + 8 + Math.sin(p.aimAngle) * length(walker));
    assert.ok(r.calls.some(c => c.method === 'clip'));
    const halo = gradients.find(g => g.args[5] === 42);
    assert.deepEqual(halo.args, [length(walker) + 8, 0, 0, length(walker) + 8, 0, 42]);
    assert.deepEqual(halo.stops, [[0, '#ffd58766'], [1, 'transparent']]);
    assert.equal(JSON.stringify(s), before); assert.ok(r.balanced());
  }
});

test('public primary shots traverse four ages in their exact per-chassis window, never prolonging Caracal', () => {
  decoded();
  for (const walker of WALKERS) {
    const s = stateFor(walker), input = { brace: true, aimX: 1000, aimY: s.player.y + 8 };
    updateGame(s, 1 / 60, { ...input, fire: true });
    assert.ok(s.events.some(e => e.type === 'shot'));
    const origin = s.elapsed, window = walker.fireRate - .1, seen = new Set();
    for (let tick = 0; tick < 10; tick++) {
      const opts = { fireCooldown: s.player.fireCooldown, fireRate: walker.fireRate, muzzleX: length(walker) };
      const detail = paintedMuzzleFlashFrame(opts), before = JSON.stringify(s), r = combatRecorder();
      drawWalker(r.ctx, s.player, walker, s.elapsed);
      if (s.player.fireCooldown > .1) {
        assert.ok(detail); seen.add(detail.name); assert.equal(calls(r, 'muzzle').length, 1);
        assert.equal(paintedMuzzleFlashFrame({ ...opts, reducedMotion: true }).name, 'age-0');
      } else { assert.equal(detail, null); assert.equal(calls(r, 'muzzle').length, 0); }
      assert.equal(JSON.stringify(s), before);
      updateGame(s, window / 8, input);
    }
    assert.equal(seen.size, 4); assert.ok(s.elapsed - origin >= window);
    if (walker.id === 'WK02') near(window, .02);
  }
});

test('historical primary gate excludes secondary-only fire, threshold and hangar without suppressing the fallback', () => {
  decoded();
  for (const walker of WALKERS) {
    const s = stateFor(walker);
    updateGame(s, 1 / 60, { brace: true, secondary: true, aimX: 1000, aimY: s.player.y });
    assert.ok(s.events.some(e => e.type === 'rocket'));
    assert.equal(s.player.fireCooldown, 0);
    for (const [cooldown, hangar, expected] of [[0, false, 0], [.1, false, 0], [.100001, false, 1], [walker.fireRate, true, 0]]) {
      s.player.fireCooldown = cooldown; const r = combatRecorder(), before = JSON.stringify(s);
      drawWalker(r.ctx, s.player, walker, s.elapsed, { hangar });
      assert.equal(calls(r, 'muzzle').length, expected); assert.equal(JSON.stringify(s), before);
    }
  }
});

test('purge preserves its five circles, alpha, heat threshold, direction and reduced-time phases on six chassis', () => {
  decoded();
  for (const walker of WALKERS) for (const facing of [-1, 1]) for (const reduced of [false, true]) {
    const s = stateFor(walker), p = s.player;
    p.facing = facing;
    for (const [heat, venting, expected] of [[0, false, 0], [70, false, 0], [70.0001, false, 5], [0, true, 5]]) {
      p.heat = heat; p.venting = venting;
      const t = reduced ? 0 : 2.173, r = combatRecorder(), alpha = [], originalDraw = r.ctx.drawImage;
      r.ctx.drawImage = (...args) => { if (args[0].key === 'vent') alpha.push(r.ctx.globalAlpha); originalDraw(...args); };
      const before = JSON.stringify(s); drawWalker(r.ctx, p, walker, t, { reducedMotion: reduced });
      const actual = calls(r, 'vent'); assert.equal(actual.length, expected);
      for (let i = 0; i < actual.length; i++) {
        const phase = (t * .8 + i * .23) % 1, radius = 9 + phase * 27;
        const point = r.point(actual[i], [0, 0]);
        near(point[0], p.x - facing * (p.width * .47 + phase * 20));
        near(point[1], p.y - 30 - phase * 85);
        near(actual[i].matrix[0], radius); near(actual[i].matrix[3], radius);
        near(alpha[i], (1 - phase) * .18);
        assert.deepEqual(actual[i].args.slice(1, 5), PAINTED_WALKER_FX_LAYOUT.vent.frames['age-' + Math.floor(phase * 6)].source);
      }
      assert.equal(JSON.stringify(s), before); assert.equal(r.ctx.globalAlpha, 1); assert.ok(r.balanced());
    }
  }
});

test('public ventilation and paused shots keep identical calls without render state, RNG or saved fields', () => {
  decoded(); const s = stateFor(WALKERS[0]);
  updateGame(s, 1 / 60, { brace: true, fire: true, aimX: 900, aimY: s.player.y });
  updateGame(s, 1 / 600, { brace: true, vent: true });
  assert.equal(s.player.venting, true);
  const before = JSON.stringify(s);
  for (const reducedMotion of [false, true]) {
    const first = combatRecorder(), second = combatRecorder(), t = reducedMotion ? 0 : s.elapsed;
    drawWalker(first.ctx, s.player, s.walker, t, { reducedMotion });
    drawWalker(second.ctx, s.player, s.walker, t, { reducedMotion });
    assert.deepEqual(first.calls, second.calls); assert.equal(calls(first, 'vent').length, 5);
    assert.equal(calls(first, 'muzzle').length, 1); assert.equal(JSON.stringify(s), before);
  }
});

test('invalid geometry and unavailable atlases retain caller fallback and independent load failures', async () => {
  const muzzle = { fireCooldown: .15, fireRate: .18, muzzleX: 92 };
  const vent = { x: 40, y: 50, radius: 20, phase: .4 }, r = combatRecorder(); r.ctx.globalAlpha = .137;
  assert.equal(drawPaintedMuzzleFlash(r.ctx, muzzle), false); assert.equal(drawPaintedVentPuff(r.ctx, vent), false);
  await loadPaintedWalkerFx({ loadImage: async (url, key) => {
    if (key === 'muzzle') throw new Error('decode failure');
    const atlas = PAINTED_WALKER_FX_LAYOUT[key]; return { width: atlas.size[0], height: atlas.size[1] };
  } });
  assert.equal(paintedWalkerFxStatus().muzzle.state, 'failed'); assert.equal(paintedWalkerFxStatus().vent.state, 'ready');
  assert.equal(drawPaintedMuzzleFlash(r.ctx, muzzle), false); assert.ok(drawPaintedVentPuff(r.ctx, vent));
  decoded();
  for (const invalid of [{ fireRate: .1 }, { fireCooldown: NaN }, { muzzleX: Infinity }, { hangar: true }])
    assert.equal(drawPaintedMuzzleFlash(r.ctx, { ...muzzle, ...invalid }), false);
  for (const invalid of [{ x: NaN }, { y: Infinity }, { radius: 0 }, { radius: -1 }, { radius: Number.MAX_VALUE }, { phase: -1 }, { phase: 1 }])
    assert.equal(drawPaintedVentPuff(r.ctx, { ...vent, ...invalid }), false);
  const copy = paintedVentPuffFrame(vent); copy.target[0] = -999; assert.notEqual(paintedVentPuffFrame(vent).target[0], -999);
  r.ctx.drawImage = () => { throw new Error('surface lost'); };
  assert.equal(drawPaintedMuzzleFlash(r.ctx, muzzle), false);
  assert.equal(paintedWalkerFxStatus().muzzle.state, 'failed'); assert.equal(paintedWalkerFxStatus().vent.state, 'ready');
  assert.equal(r.ctx.globalAlpha, .137); assert.ok(r.balanced());
  assert.throws(() => setPaintedWalkerFxImage('vent', { width: 1, height: 1 }), RangeError);
});

test('late image completions cannot resurrect a cleared walker-FX batch', async () => {
  const pending = [], loading = loadPaintedWalkerFx({ loadImage: (url, key) => new Promise(resolve => pending.push({ key, resolve })) });
  clearPaintedWalkerFx();
  for (const item of pending) { const atlas = PAINTED_WALKER_FX_LAYOUT[item.key]; item.resolve({ width: atlas.size[0], height: atlas.size[1] }); }
  await loading;
  assert.ok(Object.values(paintedWalkerFxStatus()).every(value => value.state === 'idle'));
});
