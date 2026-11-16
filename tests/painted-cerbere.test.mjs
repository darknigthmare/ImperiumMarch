import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_CERBERE_LAYOUT } from '../src/painted-cerbere-layout.mjs';
import { cerbereWeaponPose } from '../src/cerbere-weapon-pose.mjs';
import { CERBERE_FRAME_NAMES, clearPaintedCerbere, setPaintedCerbereImage, loadPaintedCerbere, paintedCerbereStatus,
  paintedCerbereFrame, drawCerbere, cerberePresentationPose } from '../src/painted-cerbere.mjs';
import { ENEMY_TYPES } from '../src/content.mjs';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { walkerRecorder } from './helpers/walker-render-recorder.mjs';

const near = (a, b, label = '') => assert.ok(Math.abs(a - b) < .002, `${label}: ${a} != ${b}`);
const pointNear = (actual, expected, label = '') => actual.forEach((value, i) => near(value, expected[i], label));
const decoded = () => ({ cerbere: true, width: PAINTED_CERBERE_LAYOUT.size[0], height: PAINTED_CERBERE_LAYOUT.size[1] });
const boss = (values = {}) => ({ ...ENEMY_TYPES.boss, type: 'boss', id: 'diagnostic-cerbere', x: 500, y: 500,
  hp: ENEMY_TYPES.boss.hp, maxHp: ENEMY_TYPES.boss.hp, facing: 1, active: true, dead: false,
  phase: 'guard', targetX: 800, targetY: 530, flash: 0, timer: 0, telegraph: .999, ...values });
const calls = record => record.calls.filter(call => call.method === 'drawImage' && call.args[0]?.cerbere);
function frameName(call) {
  return Object.entries(PAINTED_CERBERE_LAYOUT.frames).find(([, value]) => value.source.every((v, i) => v === call.args[i + 1]))?.[0];
}
function renderer(record) {
  return Object.assign(Object.create(Renderer.prototype), { ctx: record.ctx, cameraX: 0, width: 1600, height: 900,
    panoramaReady: false, lastGame: null, combatReducedMotion: true, prepare() {}, visible: () => true });
}
test.afterEach(() => clearPaintedCerbere());

test('Cerbère gun keeps the legacy projectile origin for either orientation and all aim angles', () => {
  for (const facing of [-1, 1]) for (const w of [89, 178, 267]) for (const target of [[270, 420], [730, 570], [500, 300], [500, 500]]) {
    const e = boss({ facing, w, phase: 'attack', targetX: target[0], targetY: target[1] });
    const before = JSON.stringify(e), pose = cerbereWeaponPose(e, { aiming: true });
    const legacyAngle = Math.atan2(e.targetY - e.y, e.targetX - e.x);
    assert.equal(pose.angle, legacyAngle);
    assert.deepEqual(pose.muzzle, [e.x + Math.cos(legacyAngle) * e.w / 2, e.y + Math.sin(legacyAngle) * e.w / 2]);
    assert.deepEqual(pose.pivot, [e.x, e.y]); assert.equal(JSON.stringify(e), before);
  }
  for (const type of ['rifle', 'fauna', 'automaton', 'WK01']) assert.equal(cerbereWeaponPose({ type, x: 0, y: 0 }), null);
});

test('Cerbère emitted rocket and warning line share the true muzzle without changing shot damage or speed', () => {
  for (const facing of [-1, 1]) {
    const state = createGame({ missionId: 'op03', difficulty: 'story', seed: 1543 });
    const x = state.player.x - facing * 350;
    const e = boss({ x, y: terrainAt(x, state.planetId) - ENEMY_TYPES.boss.h / 2, facing,
      phase: 'attack', targetX: state.player.x, targetY: state.player.y });
    state.enemies = [e]; state.bossReleased = true;
    const pose = cerbereWeaponPose(e), warning = walkerRecorder();
    renderer(warning).drawTelegraph(e, state, 0);
    const start = warning.calls.find(call => call.method === 'moveTo'); pointNear(start.args, pose.muzzle, 'warning muzzle');
    updateGame(state, 1 / 60, { brace: true });
    const shot = state.projectiles.find(projectile => projectile.team === 'enemy'); assert.ok(shot);
    pointNear([shot.prevX, shot.prevY], pose.muzzle, 'shot muzzle');
    pointNear([shot.vx, shot.vy], [Math.cos(pose.angle) * e.projectileSpeed, Math.sin(pose.angle) * e.projectileSpeed], 'shot velocity');
    assert.equal(shot.damage, ENEMY_TYPES.boss.damage); assert.equal(shot.type, 'rocket');
  }
});

test('guard and authorized standdown still prevent Cerbère firing', () => {
  for (const mode of ['guard', 'standdown']) {
    const state = createGame({ missionId: 'op03', seed: 1544 }), e = state.enemies.find(item => item.type === 'boss');
    state.enemies = [e]; state.player.x = e.x - 250; state.player.y = e.y;
    state.bossReleased = mode === 'standdown';
    if (mode === 'standdown') state.decision.choice = 'obey';
    e.phase = 'attack'; e.telegraph = 1; e.targetX = state.player.x; e.targetY = state.player.y;
    for (let tick = 0; tick < 120; tick++) updateGame(state, 1 / 60, { brace: true });
    assert.equal(state.projectiles.filter(item => item.team === 'enemy').length, 0);
    assert.equal(e.phase, mode); assert.equal(e.dead, false);
  }
});

test('painted Cerbère assembles separate feet, hull and ventral weapon without creating component damage', () => {
  setPaintedCerbereImage(decoded());
  assert.deepEqual(Object.keys(PAINTED_CERBERE_LAYOUT.frames), CERBERE_FRAME_NAMES);
  for (const facing of [-1, 1]) for (const phase of ['guard', 'attack', 'standdown']) {
    const e = boss({ facing, phase, hp: 1, targetX: 500 + facing * 300 });
    const before = JSON.stringify(e), record = walkerRecorder(), ground = 609;
    assert.equal(drawCerbere(record.ctx, e, { ground, time: 2 }), true);
    assert.equal(JSON.stringify(e), before); assert.ok(record.balanced());
    const images = calls(record), names = images.map(frameName);
    assert.equal(images.length, 13, 'Two legs of five pieces, hull, cooling panel and independent gun');
    assert.ok(names.includes('hull-damaged')); assert.equal(names.filter(name => name === 'turret').length, 1);
    assert.ok(!names.some(name => ['upper-damaged', 'lower-damaged', 'foot-damaged', 'radiator-damaged', 'radiator-repaired'].includes(name)));
    const gun = images.find(call => frameName(call) === 'turret'), gunFrame = paintedCerbereFrame('turret');
    const pose = cerbereWeaponPose(e);
    pointNear(record.sourcePoint(gun, gunFrame.anchors.sourcePivot), pose.pivot, 'painted gun pivot');
    pointNear(record.sourcePoint(gun, gunFrame.anchors.sourceMuzzle), pose.muzzle, 'painted muzzle');
    const feet = images.filter(call => frameName(call)?.startsWith('foot'));
    const lower = images.filter(call => frameName(call) === 'lower');
    for (let i = 0; i < feet.length; i++) {
      const frame = paintedCerbereFrame(frameName(feet[i]));
      pointNear(record.sourcePoint(feet[i], frame.anchors.sourcePivot), [e.x + (i ? 55 : -55), ground], 'foot presentation contact');
      const lowerFrame = paintedCerbereFrame('lower');
      pointNear(record.sourcePoint(lower[i], lowerFrame.anchors.sourceEndpoint), record.sourcePoint(feet[i], frame.anchors.sourceAnkle), 'lower segment joins the shoe receiver');
    }
    assert.equal(images[0].filter.includes('brightness(0.7)'), true, 'Far limb is drawn first and darker');
  }
});

test('Cerbère presentation does not march while guarding, blocked, retired or in reduced motion', () => {
  const e = boss(), ground = 609;
  const first = cerberePresentationPose(e, ground, 0);
  const second = cerberePresentationPose(e, ground, .1);
  assert.deepEqual(first.body.feet, second.body.feet);
  e.phase = 'recover'; e.x += 2;
  const moving = cerberePresentationPose(e, ground, .2);
  assert.notEqual(moving.body.feet[0].x, e.x - 55);
  assert.deepEqual(cerberePresentationPose(e, ground, .2).body.feet, moving.body.feet, 'Repeated draw of one tick is stable');
  const stopped = cerberePresentationPose(e, ground, .3);
  assert.equal(stopped.body.feet[0].x, e.x - 55);
  e.x += 2;
  const reduced = cerberePresentationPose(e, ground, .4, { reducedMotion: true });
  assert.equal(reduced.body.feet[0].x, e.x - 55);
});

test('missing, failed and stale atlas loads retain vector Cerbère and reject all dead bosses', async () => {
  const e = boss(), record = walkerRecorder();
  assert.equal(drawCerbere(record.ctx, e, { ground: 609 }), true); assert.equal(calls(record).length, 0);
  assert.equal(record.calls.filter(call => call.method === 'stroke' && call.strokeStyle === '#152123').length, 4);
  const result = await loadPaintedCerbere({ loadImage: async () => { throw new Error('expected unavailable image'); } });
  assert.equal(result.state, 'failed');
  clearPaintedCerbere(); let finish;
  const pending = loadPaintedCerbere({ loadImage: () => new Promise(resolve => { finish = resolve; }) });
  await Promise.resolve(); clearPaintedCerbere(); finish(decoded()); await pending;
  assert.equal(paintedCerbereStatus().state, 'idle', 'Stale load cannot repopulate a cleared cache');
  setPaintedCerbereImage(decoded()); const dead = walkerRecorder();
  assert.equal(drawCerbere(dead.ctx, { ...e, dead: true }, { ground: 609 }), false);
  assert.equal(dead.calls.length, 0, 'No invented persistent boss wreck');
  const bad = walkerRecorder(); bad.ctx.drawImage = () => { throw new Error('decode lost'); };
  assert.equal(drawCerbere(bad.ctx, e, { ground: 609 }), true); assert.equal(paintedCerbereStatus().state, 'failed');
  assert.ok(bad.balanced());
});
