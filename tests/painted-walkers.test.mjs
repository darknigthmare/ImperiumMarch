import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_WALKER_LAYOUT } from '../src/painted-walker-layout.mjs';
import { WALKERS, ENEMY_TYPES } from '../src/content.mjs';
import { PRODUCTION_PART_NAMES, productionPartGeometry, productionLegPose } from '../src/production-assets.mjs';
import { createGame, updateGame, radiatorBounds } from '../src/simulation.mjs';
import { Renderer, drawWalker } from '../src/renderer.mjs';
import { PAINTED_WALKER_URLS, PAINTED_WALKER_FRAME_NAMES, PAINTED_WALKER_PART_SIZES, PAINTED_WALKER_MUZZLES,
  clearPaintedWalkers, setPaintedWalkerImage, setPaintedWalkerImages, loadPaintedWalkers, paintedWalkerStatus,
  paintedWalkerFrame, paintedWalkerPartFrame, isPaintedWalkerPartReady, drawPaintedWalkerPart } from '../src/painted-walkers.mjs';
import { walkerRecorder } from './helpers/walker-render-recorder.mjs';

const near = (a, b, label) => assert.ok(Math.abs(a - b) < .002, `${label}: ${a} != ${b}`);
const pointNear = (actual, expected, label) => { near(actual[0], expected[0], `${label} x`); near(actual[1], expected[1], `${label} y`); };
const rotate = ([x, y], angle = 0) => [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
const imageCalls = record => record.calls.filter(call => call.method === 'drawImage' && call.args[0]?.walkerId);
const standIns = () => Object.fromEntries(Object.entries(PAINTED_WALKER_URLS).map(([id]) => [id,
  { walkerId: id, width: PAINTED_WALKER_LAYOUT[id].size[0], height: PAINTED_WALKER_LAYOUT[id].size[1] }]));
const sourcePoint = (frame, [x, y]) => {
  const [sx, sy, sw, sh] = frame.source, [dx, dy, dw, dh] = frame.target;
  return [dx + (x - sx) * dw / sw, dy + (y - sy) * dh / sh];
};
function frameName(call) {
  return Object.entries(PAINTED_WALKER_LAYOUT[call.args[0].walkerId].frames)
    .find(([, item]) => item.source.every((value, i) => value === call.args[i + 1]))?.[0];
}
function rendererFor(record) {
  const renderer = Object.create(Renderer.prototype);
  Object.assign(renderer, { ctx: record.ctx, cameraX: 0, width: 1600, height: 900, panoramaReady: false,
    lastGame: null, combatReducedMotion: true, prepare() {}, visible: () => true });
  return renderer;
}
function drawState(state, record = walkerRecorder()) {
  drawWalker(record.ctx, state.player, state.walker, state.elapsed);
  rendererFor(record).drawRadiator(state, state.elapsed);
  return record;
}

test.afterEach(() => clearPaintedWalkers());

test('painted walker source anchors retain the vector rig units and resolve to all mechanical pivots', () => {
  assert.deepEqual(Object.keys(PAINTED_WALKER_URLS), WALKERS.map(walker => walker.id));
  const saved = JSON.stringify(PAINTED_WALKER_LAYOUT);
  for (const walker of WALKERS) {
    const atlas = PAINTED_WALKER_LAYOUT[walker.id];
    assert.deepEqual(Object.keys(atlas.frames), PAINTED_WALKER_FRAME_NAMES, `${walker.id}: sixteen authored frames`);
    for (const part of PRODUCTION_PART_NAMES) assert.deepEqual(PAINTED_WALKER_PART_SIZES[walker.id][part], productionPartGeometry({ walkerId: walker.id, part }).size);
    for (const name of PAINTED_WALKER_FRAME_NAMES) {
      const frame = paintedWalkerFrame(walker.id, name); assert.ok(frame, `${walker.id}/${name}`);
      assert.ok(frame.source.every(Number.isInteger), 'Source crops address whole pixels');
      assert.ok(frame.anchors?.sourcePivot && frame.anchors?.pivot, `${walker.id}/${name}: measured pivot`);
      pointNear(sourcePoint(frame, frame.anchors.sourcePivot), frame.anchors.pivot, `${walker.id}/${name}: source pivot mapping`);
      pointNear(rotate(frame.anchors.pivot, frame.rotation), [0, 0], `${walker.id}/${name}: resolved origin`);
      if (name.startsWith('upper') || name.startsWith('lower')) {
        assert.ok(frame.anchors.sourceEndpoint && frame.anchors.endpoint && frame.anchors.resolvedEndpoint);
        pointNear(sourcePoint(frame, frame.anchors.sourceEndpoint), frame.anchors.endpoint, `${walker.id}/${name}: source endpoint`);
        pointNear(rotate(frame.anchors.endpoint, frame.rotation), [100, 0], `${walker.id}/${name}: physical endpoint`);
        pointNear(frame.anchors.resolvedEndpoint, [100, 0], `${walker.id}/${name}: recorded endpoint`);
      }
      if (name === 'turret') {
        assert.ok(frame.anchors.sourceMuzzle && frame.anchors.muzzle && frame.anchors.resolvedMuzzle);
        pointNear(sourcePoint(frame, frame.anchors.sourceMuzzle), frame.anchors.muzzle, `${walker.id}: source muzzle`);
        pointNear(rotate(frame.anchors.muzzle, frame.rotation), [PAINTED_WALKER_MUZZLES[walker.id], 0], `${walker.id}: physical muzzle`);
        pointNear(frame.anchors.resolvedMuzzle, [PAINTED_WALKER_MUZZLES[walker.id], 0], `${walker.id}: recorded muzzle`);
      }
      if (name.startsWith('foot')) {
        assert.ok(frame.anchors.sourceAnkle, `${walker.id}/${name}: measured ankle receiver`);
        pointNear(rotate(sourcePoint(frame, frame.anchors.sourceAnkle), frame.rotation), [0, -8], `${walker.id}/${name}: foot ankle`);
      }
      frame.source[0] = -999; frame.target[0] = -999; frame.anchors.pivot[0] = -999;
    }
  }
  assert.equal(JSON.stringify(PAINTED_WALKER_LAYOUT), saved, 'No caller can mutate the authored frames through accessors');
});

test('normal walker rendering preserves each true foot, limb endpoint, depth order and radiator bounds for all six chassis', () => {
  setPaintedWalkerImages(standIns());
  for (const walker of WALKERS) {
    const state = createGame({ walkerId: walker.id, missionId: 'MI01', seed: 1533 });
    for (let tick = 0; tick < 42; tick++) updateGame(state, 1 / 60, { move: 1 });
    const before = JSON.stringify(state), record = drawState(state), calls = imageCalls(record);
    assert.equal(calls.length, walker.legs * 5 + 3, `${walker.id}: one image for each visible part`);
    assert.equal(record.calls.filter(call => call.method === 'stroke' && call.strokeStyle === '#152123').length, 0, 'Painted segments have no duplicate offset vector underlays');
    assert.equal(record.calls.filter(call => call.method === 'stroke' && call.strokeStyle === '#101a1d' && call.lineWidth === 8).length, walker.legs, 'The real articulated hydraulic links remain visible');
    const orderedFeet = [...state.player.feet.filter(foot => foot.side === 'back'), ...state.player.feet.filter(foot => foot.side !== 'back')];
    const footCalls = calls.filter(call => frameName(call) === 'foot');
    const upperCalls = calls.filter(call => frameName(call) === 'upper'), lowerCalls = calls.filter(call => frameName(call) === 'lower');
    const clips = record.calls.filter(call => call.method === 'clip');
    assert.equal(clips.length, walker.legs, 'Only the lower plates are clipped at the ankle plane');
    for (const rect of record.calls.filter(call => call.method === 'rect')) near(rect.args[0] + rect.args[2], 100, 'Canonical distal clipping plane');
    for (const [i, foot] of orderedFeet.entries()) {
      const pose = productionLegPose(state.player, walker, foot);
      pointNear(record.point(clips[i], [100, 0]), pose.ankle, `${walker.id}/${foot.id}: clipping plane passes through the real ankle`);
      for (const [call, part, start, end] of [[upperCalls[i], 'upper', pose.hip, pose.knee], [lowerCalls[i], 'lower', pose.knee, pose.ankle]]) {
        const anchors = paintedWalkerFrame(walker.id, part).anchors;
        pointNear(record.sourcePoint(call, anchors.sourcePivot), start, `${walker.id}/${foot.id}/${part}: pivot`);
        pointNear(record.sourcePoint(call, anchors.sourceEndpoint), end, `${walker.id}/${foot.id}/${part}: endpoint`);
      }
      pointNear(record.sourcePoint(footCalls[i], paintedWalkerFrame(walker.id, 'foot').anchors.sourcePivot), [foot.x, foot.y], `${walker.id}/${foot.id}: actual sole contact`);
      pointNear(record.sourcePoint(footCalls[i], paintedWalkerFrame(walker.id, 'foot').anchors.sourceAnkle), pose.ankle, `${walker.id}/${foot.id}: ankle receiver`);
      assert.equal(footCalls[i].filter, foot.side === 'back' ? 'brightness(0.7)' : 'none');
      assert.equal(footCalls[i].alpha, 1, 'Far parts remain opaque and are darkened instead of becoming transparent');
    }
    const hullIndex = calls.findIndex(call => frameName(call) === 'hull');
    assert.equal(hullIndex, walker.legs / 2 * 5, 'Only far legs precede the hull');
    assert.equal(frameName(calls.at(-2)), 'turret'); assert.equal(frameName(calls.at(-1)), 'radiator');
    const box = radiatorBounds(state), radiator = calls.at(-1), anchors = paintedWalkerFrame(walker.id, 'radiator').anchors;
    pointNear(record.sourcePoint(radiator, anchors.sourcePivot), [box.x, box.y], `${walker.id}: radiator physical centre`);
    assert.equal(JSON.stringify(state), before); assert.ok(record.balanced()); assert.equal(record.ctx.filter, 'none');
  }
});

test('independently aimed painted turrets keep their measured muzzle at the existing physical radius in every direction', () => {
  setPaintedWalkerImages(standIns());
  for (const walker of WALKERS) for (const facing of [-1, 1]) for (const angle of [0, -.8, .8, Math.PI, -Math.PI * .75, Math.PI * .75]) {
    const state = createGame({ walkerId: walker.id, missionId: 'MI01' });
    state.player.facing = facing; state.player.aimAngle = angle;
    const before = JSON.stringify(state), record = drawState(state), call = imageCalls(record).find(item => frameName(item) === 'turret');
    const frame = paintedWalkerFrame(walker.id, 'turret'), length = PAINTED_WALKER_MUZZLES[walker.id], pivot = [state.player.x + 9, state.player.y + 8];
    pointNear(record.sourcePoint(call, frame.anchors.sourcePivot), pivot, `${walker.id}/${facing}/${angle}: mount`);
    pointNear(record.sourcePoint(call, frame.anchors.sourceMuzzle), [pivot[0] + Math.cos(angle) * length, pivot[1] + Math.sin(angle) * length], `${walker.id}/${facing}/${angle}: muzzle`);
    const [a, b, c, d] = call.matrix;
    assert.equal(Math.sign(a * d - b * c), Math.cos(angle) < 0 ? -1 : 1, 'Local reflection preserves the upper side of the turret to the left');
    assert.equal(JSON.stringify(state), before); assert.ok(record.balanced());
  }
});

test('public player shots retain their existing spread, pivot and physical muzzle radius', () => {
  for (const walker of WALKERS) for (const side of [-1, 1]) {
    const state = createGame({ walkerId: walker.id, missionId: 'op01', seed: 1533 });
    state.player.stability = 62;
    const aim = { aimX: state.player.x + side * 600, aimY: state.player.y - 80, fire: true };
    updateGame(state, 1 / 60, aim);
    const shot = state.projectiles.find(item => item.team === 'player'); assert.ok(shot, `${walker.id}: public shot`);
    const angle = Math.atan2(shot.vy, shot.vx), length = PAINTED_WALKER_MUZZLES[walker.id];
    pointNear([shot.prevX, shot.prevY], [state.player.x + 9 + Math.cos(angle) * length, state.player.y + 8 + Math.sin(angle) * length], `${walker.id}: existing spread origin`);
    assert.ok(Math.abs(angle - state.player.aimAngle) > 1e-8, 'The nonzero existing spread was not replaced with the painted aim axis');
  }
});

test('damage and brace select their own pieces while continuous radiator repair retains vector feedback', () => {
  setPaintedWalkerImages(standIns());
  for (const walker of WALKERS) {
    const state = createGame({ walkerId: walker.id, missionId: 'MI01' });
    state.player.hull = state.player.maxHull * .3; state.player.feet[0].health = 20; state.player.radiator.health = 25;
    let record = drawState(state), names = imageCalls(record).map(frameName);
    for (const name of ['hull-damaged', 'upper-damaged', 'lower-damaged', 'foot-damaged', 'radiator-damaged']) assert.ok(names.includes(name), `${walker.id}: ${name}`);
    state.player.hull = state.player.maxHull; state.player.feet[0].health = 100;
    updateGame(state, 1 / 60, { brace: true });
    record = drawState(state); names = imageCalls(record).map(frameName);
    assert.ok(names.includes('hull-braced')); assert.equal(names.filter(name => name === 'foot-braced').length, walker.legs);
    state.player.radiator.health = 85; state.player.radiator.repairKits = state.player.radiator.maxRepairKits - 1;
    assert.ok(imageCalls(drawState(state)).some(call => frameName(call) === 'radiator-repaired'));
    state.player.radiator.repairing = true; state.player.radiator.repairProgress = .5;
    record = walkerRecorder(); const before = JSON.stringify(state); rendererFor(record).drawRadiator(state, 1);
    assert.equal(imageCalls(record).length, 0, 'Repairing fins use their continuous vector state');
    assert.ok(record.calls.some(call => call.method === 'fillRect' && call.args[2] === 22 && call.args[3] === 4), 'Half-completed repair progress remains visible');
    assert.equal(JSON.stringify(state), before); assert.ok(record.balanced());
  }
});

test('missing or failed painted atlases preserve the complete vector walker and reject stale image callbacks', async () => {
  const statuses = await loadPaintedWalkers({ loadImage: async () => { throw new Error('controlled decoding failure'); } });
  assert.equal(Object.keys(statuses).length, 6); assert.ok(Object.values(statuses).every(status => status.state === 'failed'));
  for (const walker of WALKERS) {
    const state = createGame({ walkerId: walker.id, missionId: 'MI01' }), before = JSON.stringify(state), record = drawState(state);
    assert.equal(imageCalls(record).length, 0); assert.ok(record.calls.some(call => call.method === 'fill'));
    assert.equal(record.calls.filter(call => call.method === 'stroke' && call.strokeStyle === '#152123').length, walker.legs * 2, 'Each fallback leg keeps both original vector underlays');
    assert.equal(JSON.stringify(state), before); assert.ok(record.balanced());
  }
  clearPaintedWalkers();
  let release; const delayed = new Promise(resolve => { release = resolve; });
  const pending = loadPaintedWalkers({ loadImage: (_, id) => id === 'WK01' ? delayed : Promise.reject(new Error('not available')) });
  clearPaintedWalkers(); release(standIns().WK01); await pending;
  assert.ok(Object.values(paintedWalkerStatus()).every(status => status.state === 'idle'));
  assert.throws(() => setPaintedWalkerImage('WK03', { width: 10, height: 10 }), /Unknown/);
  assert.throws(() => setPaintedWalkerImage('WK01', { width: 0, height: 0 }), /Undecoded/);
  assert.throws(() => setPaintedWalkerImage('WK01', { width: 1, height: 1 }), /dimensions/);
});

test('Cerbère, unrelated production parts and unavailable states cannot inherit a painted playable chassis', () => {
  setPaintedWalkerImages(standIns());
  assert.equal(paintedWalkerPartFrame({ part: 'hull' }), null);
  assert.equal(paintedWalkerPartFrame({ walkerId: 'WK03', part: 'hull' }), null);
  assert.equal(paintedWalkerPartFrame({ walkerId: 'WK01', part: 'ambulance' }), null);
  assert.equal(paintedWalkerPartFrame({ walkerId: 'WK01', part: 'radiator', state: 'repairing' }), null);
  assert.equal(paintedWalkerPartFrame({ walkerId: 'WK01', part: 'radiator', state: 'hit' }), null, 'The vector hit flashes have no painted equivalent');
  assert.equal(paintedWalkerPartFrame({ walkerId: 'WK01', part: 'hull', state: 'repaired' }), null);
  assert.equal(isPaintedWalkerPartReady({ walkerId: 'WK01', part: 'upper' }), true);
  assert.equal(isPaintedWalkerPartReady({ walkerId: 'WK01', part: 'upper', state: 'repaired' }), false);
  assert.equal(isPaintedWalkerPartReady({ part: 'upper' }), false);
  assert.equal(paintedWalkerFrame('WK03', 'hull'), null);
  const enemy = { ...ENEMY_TYPES.boss, type: 'boss', x: 500, y: 500, maxHp: ENEMY_TYPES.boss.hp, phase: 'attack', flash: 0 };
  const state = createGame({ missionId: 'op01' }), before = JSON.stringify(enemy), record = walkerRecorder();
  rendererFor(record).drawEnemy(enemy, state, 0);
  assert.equal(imageCalls(record).length, 0, 'The enemy walker has no registered player rig ID');
  assert.equal(record.calls.filter(call => call.method === 'stroke' && call.strokeStyle === '#152123').length, 4, 'Cerbère retains both underlays on each of its two legs');
  assert.ok(record.calls.some(call => call.method === 'fillText' && call.args[0] === 'CERBÈRE'));
  assert.equal(JSON.stringify(enemy), before); assert.ok(record.balanced());
});

test('the normal hangar and full renderer use painted pieces without changing game state or animating idle feet', () => {
  setPaintedWalkerImages(standIns());
  for (const walker of WALKERS) {
    const state = createGame({ walkerId: walker.id, missionId: 'MI01' }), before = JSON.stringify(state);
    const scene = walkerRecorder(), renderer = rendererFor(scene);
    renderer.render(state, { reducedMotion: true });
    assert.equal(imageCalls(scene).length, walker.legs * 5 + 3);
    assert.equal(JSON.stringify(state), before); assert.ok(scene.balanced());
    const hangar = walkerRecorder(); rendererFor(hangar).renderHangar(walker, 0);
    const names = imageCalls(hangar).map(frameName);
    assert.equal(names.length, walker.legs * 5 + 2); assert.ok(names.includes('hull'));
    assert.ok(!names.some(name => /damaged|braced/.test(name)), 'Simplified hangar player defaults to normal pieces');
    assert.ok(hangar.balanced());
    const first = drawState(state), second = drawState(state);
    assert.deepEqual(imageCalls(first).map(call => call.matrix), imageCalls(second).map(call => call.matrix), 'Rendering has no gait clock of its own');
  }
});

test('draw failure restores canvas state and leaves an explicit failed atlas for vector fallback', () => {
  setPaintedWalkerImages(standIns()); const record = walkerRecorder();
  record.ctx.filter = 'sepia(0.25)'; record.ctx.globalAlpha = .8;
  record.ctx.drawImage = () => { throw new Error('controlled draw failure'); };
  assert.equal(drawPaintedWalkerPart(record.ctx, { walkerId: 'WK01', part: 'upper', x: 1, y: 2, back: true }), false);
  assert.equal(paintedWalkerStatus().WK01.state, 'failed'); assert.equal(record.ctx.filter, 'sepia(0.25)');
  assert.equal(record.ctx.globalAlpha, .8); assert.ok(record.balanced());
});
