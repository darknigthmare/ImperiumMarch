import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_COMBAT_LAYOUT } from '../src/painted-combat-layout.mjs';
import { ENEMY_TYPES } from '../src/content.mjs';
import { createGame } from '../src/simulation.mjs';
import { ENEMY_WEAPON_RIGS, enemyWeaponPose } from '../src/enemy-weapon-pose.mjs';
import { Renderer } from '../src/renderer.mjs';
import { PAINTED_COMBAT_URLS, clearPaintedCombat, setPaintedCombatImages,
  loadPaintedCombat, paintedCombatStatus, paintedCombatFrame, paintedCombatBodyFrame } from '../src/painted-combat.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';

const near = (a, b, label) => assert.ok(Math.abs(a - b) < .001, `${label}: ${a} != ${b}`);
function standIns() {
  return Object.fromEntries(Object.keys(PAINTED_COMBAT_URLS).map(key => [key,
    { atlasKey: key, width: PAINTED_COMBAT_LAYOUT[key].size[0], height: PAINTED_COMBAT_LAYOUT[key].size[1] }]));
}
function enemy(type, values = {}) {
  return { ...ENEMY_TYPES[type], type, id: `paint-test-${type}`, x: 500, y: 500, facing: 1, active: true,
    hp: ENEMY_TYPES[type].hp, maxHp: ENEMY_TYPES[type].hp, flash: 0, phase: 'idle', targetX: 700, targetY: 250, ...values };
}
function rendererFor(record) {
  const renderer = Object.create(Renderer.prototype);
  Object.assign(renderer, { ctx: record.ctx, cameraX: 0, width: 1600, height: 900, panoramaReady: false,
    lastGame: null, combatReducedMotion: false, prepare() {}, visible: () => true });
  return renderer;
}
const imageCalls = record => record.calls.filter(call => call.method === 'drawImage');

test.afterEach(() => clearPaintedCombat());

test('normal enemy renderer uses each painted body and independently aimed weapon with exact muzzle anchors', () => {
  setPaintedCombatImages(standIns());
  const layoutSaved = JSON.stringify(PAINTED_COMBAT_LAYOUT);
  for (const type of Object.keys(ENEMY_WEAPON_RIGS)) for (const facing of [-1, 1]) {
    const e = enemy(type, { facing, phase: 'attack', targetX: 500 + facing * 200 });
    const saved = JSON.stringify(e), record = combatRecorder();
    rendererFor(record).drawEnemy(e, { planetId: 'PL01' }, 1);
    assert.equal(JSON.stringify(e), saved);
    const drawings = imageCalls(record);
    assert.equal(drawings.length, 2, `${type}: exactly one body and one attached weapon`);
    assert.ok(drawings.every(call => call.args[0].atlasKey === type));
    const frame = paintedCombatFrame(type, 'weapon');
    const weapon = drawings.find(call => JSON.stringify(call.args.slice(1, 5)) === JSON.stringify(frame.source));
    assert.ok(weapon, `${type}: independent weapon crop`);
    const anchors = PAINTED_COMBAT_LAYOUT[type].frames.weapon.anchors;
    assert.ok(anchors?.pivot && anchors?.muzzle, `${type}: measured weapon anchors are required`);
    const expected = enemyWeaponPose(e), pivot = record.point(weapon, anchors.pivot), muzzle = record.point(weapon, anchors.muzzle);
    near(pivot[0], expected.pivot[0], `${type}: pivot x`); near(pivot[1], expected.pivot[1], `${type}: pivot y`);
    near(muzzle[0], expected.muzzle[0], `${type}: muzzle x`); near(muzzle[1], expected.muzzle[1], `${type}: muzzle y`);
    assert.ok(record.balanced());
    frame.source[0] = -999; frame.target[0] = -999;
    if (frame.anchors) frame.anchors.pivot[0] = -999;
  }
  assert.equal(JSON.stringify(PAINTED_COMBAT_LAYOUT), layoutSaved, 'Frame access and rendering preserve immutable authoring data');
});

test('movement uses real displacement; idle, blocked, attack and reduced-motion people never cycle in place', () => {
  for (const type of ['rifle', 'rocket', 'sniper', 'civilian']) {
    const e = type === 'civilian' ? { x: 500, y: 500, w: 18, h: 34, alive: true, fleeing: true } : enemy(type);
    const options = { civilian: type === 'civilian', time: 0 };
    assert.equal(paintedCombatBodyFrame(e, options).frame, 'idle');
    const frames = new Set();
    for (let i = 1; i <= 8; i++) {
      e.x += e.h * .9 / 8 + .00001;
      const before = JSON.stringify(e);
      frames.add(paintedCombatBodyFrame(e, { ...options, time: i / 60 }).frame);
      assert.equal(JSON.stringify(e), before, 'Animation state never appears in entity saves');
    }
    assert.equal(frames.size, 8, `${type}: eight independent walk frames across a physical stride`);
    assert.ok([...frames].every(frame => /^walk-[0-7]$/.test(frame)));
    assert.equal(paintedCombatBodyFrame(e, { ...options, time: 9 / 60 }).frame, 'idle', 'Time advancing without displacement is not movement');
    e.x += 1;
    assert.equal(paintedCombatBodyFrame(e, { ...options, time: 10 / 60, reducedMotion: true }).frame, 'idle');
    if (type !== 'civilian') {
      e.phase = 'attack'; e.x += 1;
      assert.equal(paintedCombatBodyFrame(e, { ...options, time: 11 / 60 }).frame, 'braced');
      e.phase = 'idle'; e.active = false; e.x += 1;
      assert.equal(paintedCombatBodyFrame(e, { ...options, time: 12 / 60 }).frame, 'idle');
    }
  }
});

test('decode failures retain visible vector bodies, keep simulation untouched and reject stale loads', async () => {
  const failed = await loadPaintedCombat({ loadImage: async () => { throw new Error('controlled decode failure'); } });
  assert.equal(Object.keys(failed).length, 9); assert.ok(Object.values(failed).every(status => status.state === 'failed'));
  for (const type of Object.keys(ENEMY_WEAPON_RIGS)) {
    const e = enemy(type), before = JSON.stringify(e), record = combatRecorder();
    rendererFor(record).drawEnemy(e, { planetId: 'PL01' }, 0);
    assert.equal(imageCalls(record).length, 0); assert.ok(record.calls.some(call => call.method === 'fill'));
    assert.equal(JSON.stringify(e), before); assert.ok(record.balanced());
  }
  clearPaintedCombat();
  let release;
  const delayed = new Promise(resolve => { release = resolve; });
  const pending = loadPaintedCombat({ loadImage: (_, key) => key === 'rifle' ? delayed : Promise.reject(new Error('not loaded')) });
  clearPaintedCombat(); release(standIns().rifle); await pending;
  assert.ok(Object.values(paintedCombatStatus()).every(status => status.state === 'idle'));
  assert.throws(() => setPaintedCombatImages({ rifle: { width: 1, height: 1 } }), /dimensions/);
});

test('civilian identity labels and convoy status/health remain in the normal renderer after painting', () => {
  setPaintedCombatImages(standIns());
  const person = { x: 480, y: 660, w: 18, h: 34, alive: true, safe: false, fleeing: false };
  const peopleRecord = combatRecorder();
  rendererFor(peopleRecord).drawHuman(person, 0, true, 'CIVIL');
  assert.equal(imageCalls(peopleRecord)[0].args[0].atlasKey, 'civilian');
  assert.ok(peopleRecord.calls.some(call => call.method === 'fillText' && call.args[0] === 'CIVIL'));
  const convoy = { x: 640, y: 650, w: 112, h: 64, hp: 320, maxHp: 640, cargo: 24, moving: false, arrived: false, waitTime: 2 };
  const before = JSON.stringify(convoy), record = combatRecorder();
  rendererFor(record).drawConvoy(convoy, 0);
  assert.equal(imageCalls(record)[0].args[0].atlasKey, 'convoy');
  assert.ok(record.calls.some(call => call.method === 'fillText' && call.args[0] === 'SAMI · ATTENTE 2 s'));
  assert.ok(record.calls.some(call => call.method === 'fillRect' && call.args[2] === 45 && call.args[3] === 4), 'Convoy health remains visible');
  assert.equal(JSON.stringify(convoy), before); assert.ok(record.balanced());
});

test('normal attack telegraphs start at the same muzzle as the independently drawn weapon', () => {
  for (const type of Object.keys(ENEMY_WEAPON_RIGS)) {
    const e = enemy(type, { phase: 'attack', telegraph: .4, facing: -1, targetX: 250 });
    const record = combatRecorder(), pose = enemyWeaponPose(e);
    rendererFor(record).drawTelegraph(e, {}, 0);
    const origin = record.calls.find(call => call.method === 'moveTo'); assert.ok(origin);
    near(origin.args[0], pose.muzzle[0], `${type}: telegraph x`); near(origin.args[1], pose.muzzle[1], `${type}: telegraph y`);
  }
});

test('painted images do not bypass mission arrival gates in the complete normal renderer', () => {
  setPaintedCombatImages(standIns());
  const cases = [
    ['MI03', 'holt-observer', state => { state.network.scrutinyTriggered = true; }],
    ['MI07', 'seizure-drone-', state => { state.ambulance.raidTriggered = true; }],
    ['MI08', 'aval-control-drone-', state => { state.departure.alert.triggered = true; }],
    ['MI09', 'thyr-sniper-', state => { state.livingRoute.alert.triggered = true; }],
    ['MI10', 'chemical-private-', state => { state.chemical.alert.ready = true; }],
    ['MI11', 'voice-private-', state => { state.voice.alert.ready = true; }],
    ['MI13', 'foundry-private-', state => { state.foundry.alert.ready = true; }],
  ];
  for (const [missionId, prefix, arrive] of cases) {
    const state = createGame({ missionId, difficulty: 'story', seed: 1554 });
    const gated = state.enemies.filter(e => e.id.startsWith(prefix)); assert.ok(gated.length, `${missionId}: test covers real dormant units`);
    const dormantRecord = combatRecorder(), dormant = rendererFor(dormantRecord), seen = [];
    dormant.drawEnemy = function (e, s, t) { seen.push(e.id); return Renderer.prototype.drawEnemy.call(this, e, s, t); };
    const saved = JSON.stringify(state); dormant.render(state, { reducedMotion: true });
    assert.equal(JSON.stringify(state), saved, `${missionId}: drawing must preserve every game fact`);
    assert.ok(gated.every(e => !seen.includes(e.id)), `${missionId}: no body or weapon before arrival`);
    arrive(state); seen.length = 0;
    const activeSaved = JSON.stringify(state); dormant.render(state, { reducedMotion: true });
    assert.ok(gated.every(e => seen.includes(e.id)), `${missionId}: actual arrival enables the normal renderer`);
    assert.equal(JSON.stringify(state), activeSaved); assert.ok(dormantRecord.balanced());
  }
});
