import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_MI14_LAYOUT } from '../src/painted-sprite-layout.mjs';
import {
  PAINTED_SPRITE_URLS, clearPaintedSprites, setPaintedSpriteImages,
  loadPaintedSprites, paintedSpriteStatus, paintedSpriteFrame,
} from '../src/painted-sprites.mjs';
import { WORKSHOP_ASSET_SPECS, drawWorkshopAsset } from '../src/workshop-assets.mjs';
import { drawWorkshopActors } from '../src/workshop-renderer.mjs';
import { createGame } from '../src/simulation.mjs';
import { pilotMI14 } from './helpers/mi14-driver.mjs';

// Decoded image stand-ins keep npm test independent of native raster libraries.
// The separate tools/test-painted-sprites.mjs gate decodes the actual PNG bytes.
function decodedStandIns() {
  return Object.fromEntries(Object.keys(PAINTED_SPRITE_URLS).map(key => {
    const rects = Object.values(PAINTED_MI14_LAYOUT[key].frames).flatMap(frame => [frame.source, ...(frame.rotors || []).map(rotor => rotor.source)]);
    return [key, { atlasKey: key, width: Math.ceil(Math.max(...rects.map(r => r[0] + r[2]))) + 1,
      height: Math.ceil(Math.max(...rects.map(r => r[1] + r[3]))) + 1 }];
  }));
}

function recorder() {
  const calls = [], stack = [];
  let matrix = [1, 0, 0, 1, 0, 0];
  const multiply = n => {
    const [a, b, c, d, e, f] = matrix, [A, B, C, D, E, F] = n;
    matrix = [a * A + c * B, b * A + d * B, a * C + c * D, b * C + d * D, a * E + c * F + e, b * E + d * F + f];
  };
  const methods = {
    save() { stack.push([...matrix]); },
    restore() { assert.ok(stack.length, 'Canvas state stack underflow'); matrix = stack.pop(); },
    translate(x, y) { multiply([1, 0, 0, 1, x, y]); },
    scale(x, y) { multiply([x, 0, 0, y, 0, 0]); },
    rotate(angle) { multiply([Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]); },
    drawImage(...args) { calls.push({ method: 'drawImage', args, matrix: [...matrix] }); },
  };
  const ctx = new Proxy({ ...methods }, {
    get(target, key) { return key in target ? target[key] : (...args) => calls.push({ method: key, args, matrix: [...matrix] }); },
    set(target, key, value) { target[key] = value; return true; },
  });
  return { ctx, calls, balanced: () => stack.length === 0 && matrix.every((v, i) => Math.abs(v - [1, 0, 0, 1, 0, 0][i]) < 1e-10) };
}

test.afterEach(() => clearPaintedSprites());

test('eight painted walking poses reach the live component renderer for workers and mechanics, with a closed loop', () => {
  setPaintedSpriteImages(decodedStandIns());
  for (const mechanic of [false, true]) {
    const sources = [];
    for (let i = 0; i < 8; i++) {
      const rec = recorder(), options = { part: 'worker', state: 'walking', progress: (i + .4) / 8, mechanic, x: 173, y: 419 };
      const before = JSON.stringify(options); drawWorkshopAsset(rec.ctx, options);
      assert.equal(JSON.stringify(options), before);
      const drawings = rec.calls.filter(call => call.method === 'drawImage');
      assert.equal(drawings.length, 1, 'A walking person is one selected pose, never several superposed poses');
      assert.equal(drawings[0].args[0].atlasKey, mechanic ? 'worker-mechanic' : 'worker');
      sources.push(drawings[0].args.slice(1, 5));
      assert.ok(rec.balanced());
    }
    assert.equal(new Set(sources.map(value => JSON.stringify(value))).size, 8, 'All eight poses need independent source crops');
    for (const progress of [0, 1]) {
      const rec = recorder(); drawWorkshopAsset(rec.ctx, { part: 'worker', state: 'walking', progress, mechanic });
      assert.deepEqual(rec.calls.find(call => call.method === 'drawImage').args.slice(1, 5), sources[0], 'The loop must return to its first pose');
    }
  }
});

test('every existing MI14 material state has a usable painted replacement without mutating layout or draw inputs', () => {
  setPaintedSpriteImages(decodedStandIns()); const layoutBefore = JSON.stringify(PAINTED_MI14_LAYOUT);
  for (const [part, spec] of Object.entries(WORKSHOP_ASSET_SPECS)) for (const state of spec.states) {
    for (const mechanic of part === 'worker' ? [false, true] : [false]) {
      const rec = recorder(), options = { part, state, mechanic, progress: .41, x: 96, y: 220, facing: -1 };
      const before = JSON.stringify(options); drawWorkshopAsset(rec.ctx, options);
      assert.ok(rec.calls.some(call => call.method === 'drawImage'), `${part}/${state} must not silently fall back after a successful load`);
      assert.equal(JSON.stringify(options), before); assert.ok(rec.balanced(), `${part}/${state} leaks a transform`);
    }
  }
  assert.equal(JSON.stringify(PAINTED_MI14_LAYOUT), layoutBefore);
  const frame = paintedSpriteFrame('worker', 'walking-0');
  assert.ok(frame); frame.source[0] = -999; frame.target[0] = -999;
  assert.equal(JSON.stringify(PAINTED_MI14_LAYOUT), layoutBefore, 'Returned frame rectangles must not expose mutable layout storage');
});

test('decoder failure preserves the visible vector body and clearing presentation cancels late image loads', async () => {
  const results = await loadPaintedSprites({ loadImage: async () => { throw new Error('fixture decoding failure'); } });
  assert.ok(Object.values(results).every(result => result.state === 'failed'));
  const rec = recorder(); drawWorkshopAsset(rec.ctx, { part: 'cooler', state: 'broken' });
  assert.equal(rec.calls.filter(call => call.method === 'drawImage').length, 0);
  assert.ok(rec.calls.some(call => call.method === 'fill'), 'A failed image cannot leave an invisible machine');
  assert.ok(rec.balanced()); clearPaintedSprites();
  let resolveLate;
  const late = new Promise(resolve => { resolveLate = resolve; });
  const pending = loadPaintedSprites({ loadImage: (_, key) => key === 'worker' ? late : Promise.reject(new Error('unused fixture atlas')) });
  clearPaintedSprites(); resolveLate(decodedStandIns().worker); await pending;
  assert.ok(Object.values(paintedSpriteStatus()).every(result => result.state === 'idle'), 'Old decode results must not repopulate a cleared presentation');
});

test('the painted cannon muzzle matches an actual enemy projectile emitted through public MI14 controls', () => {
  setPaintedSpriteImages(decodedStandIns());
  const game = createGame({ missionId: 'MI14', walkerId: 'WK09', difficulty: 'story', seed: 1415 });
  pilotMI14(game, { noFire: true, stopAt: state => state.projectiles.some(shot => shot.team === 'enemy') });
  const shot = game.projectiles.find(projectile => projectile.team === 'enemy');
  assert.ok(shot, 'The automaton must emit a real projectile');
  const before = JSON.stringify(game), rec = recorder();
  drawWorkshopActors({ ctx: rec.ctx, visible: () => true }, game);
  assert.equal(JSON.stringify(game), before);
  const cannon = paintedSpriteFrame('security-automaton', 'cannon'); assert.ok(cannon);
  const drawn = rec.calls.find(call => call.method === 'drawImage' && call.args[0].atlasKey === 'security-automaton'
    && JSON.stringify(call.args.slice(1, 5)) === JSON.stringify(cannon.source));
  assert.ok(drawn, 'The separately aimed cannon is drawn');
  const [dx, dy, dw, dh] = drawn.args.slice(5), [a, b, c, d, e, f] = drawn.matrix;
  // A crop includes irregular armor and padding; its geometric mid-height is
  // not necessarily the cannon bore. Use the registered bore anchor and also
  // ensure it lies at the crop's forward edge, inside its vertical extent.
  const muzzle = PAINTED_MI14_LAYOUT['security-automaton'].frames.cannon.anchors.muzzle;
  assert.ok(Math.abs(muzzle[0] - (dx + dw)) < 1e-7);
  assert.ok(muzzle[1] >= dy && muzzle[1] <= dy + dh);
  const muzzleX = a * muzzle[0] + c * muzzle[1] + e;
  const muzzleY = b * muzzle[0] + d * muzzle[1] + f;
  assert.ok(Math.abs(muzzleX - shot.prevX) < 1e-7, `Painted muzzle x=${muzzleX}, emitted projectile x=${shot.prevX}`);
  assert.ok(Math.abs(muzzleY - shot.prevY) < 1e-7, `Painted muzzle y=${muzzleY}, emitted projectile y=${shot.prevY}`);
  assert.ok(rec.balanced());
});
