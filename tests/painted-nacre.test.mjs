import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_NACRE_LAYOUT } from '../src/painted-nacre-layout.mjs';
import { PAINTED_NACRE_URLS, setPaintedNacreImages, clearPaintedNacre, loadPaintedNacre,
  paintedNacreStatus, paintedNacreFrame, paintedNacreBoatFrame, paintedNacreEquipmentFrame,
  nacreAmbulanceWheelPoses, drawPaintedNacreBoat } from '../src/painted-nacre.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < .00001, `${a} != ${b}`);
const standIns = () => Object.fromEntries(Object.keys(PAINTED_NACRE_URLS).map(key => [key, { atlasKey: key,
  width: PAINTED_NACRE_LAYOUT[key].size[0], height: PAINTED_NACRE_LAYOUT[key].size[1] }]));
const images = record => record.calls.filter(call => call.method === 'drawImage');
function rendererFor(record) {
  return Object.assign(Object.create(Renderer.prototype), { ctx: record.ctx, cameraX: 0, width: 1600, height: 900,
    panoramaReady: false, lastGame: null, combatReducedMotion: false, visible: () => true, prepare() {} });
}
test.afterEach(clearPaintedNacre);

test('ambulance draws two distinct grounded wheels, body, case and attached beacon without mutating mission facts', () => {
  setPaintedNacreImages(standIns());
  const s = createGame({ missionId: 'MI07', seed: 1555 }), saved = JSON.stringify(s), record = combatRecorder();
  rendererFor(record).drawAmbulanceVehicle(s, 10);
  assert.equal(JSON.stringify(s), saved);
  assert.equal(images(record).length, 5);
  const wheelSource = paintedNacreFrame('ambulance', 'wheel').source;
  const wheels = images(record).filter(call => call.args[0].atlasKey === 'ambulance' && JSON.stringify(call.args.slice(1, 5)) === JSON.stringify(wheelSource));
  assert.equal(wheels.length, 2);
  const ground = terrainAt(s.ambulance.vehicle.x, s.planetId);
  const poses = nacreAmbulanceWheelPoses(s.ambulance.vehicle, ground);
  wheels.forEach((wheel, index) => { const hub = record.point(wheel, [0, 0]); near(hub[0], poses[index].x); near(hub[1], ground - 11); });
  assert.equal(record.balanced(), true);
});

test('recovered beacon is absent from the vehicle while acquired damage and persistent losses remain visible', () => {
  setPaintedNacreImages(standIns());
  const s = createGame({ missionId: 'MI07', seed: 1555 });
  s.ambulance.beacon.recovered = true; s.ambulance.cargo.destroyed = true; s.ambulance.vehicle.destroyed = true;
  const saved = JSON.stringify(s), record = combatRecorder(); rendererFor(record).drawAmbulanceVehicle(s, 4);
  assert.equal(images(record).length, 2, 'Destroyed hull and case, no ghost beacon and no duplicate wheels');
  assert.equal(JSON.stringify(s), saved);
  assert.equal(paintedNacreEquipmentFrame('beacon', s.ambulance.beacon), null);
});

test('Nacre vessels select real loss, damage, travel, boarding and arrival facts with damage taking precedence', () => {
  const boat = { x: 0, y: 0, w: 184, h: 68, hp: 100, maxHp: 100 };
  for (const atlas of ['rive-courte', 'veille-aval', 'ferry', 'saisie']) {
    assert.equal(paintedNacreBoatFrame({ ...boat, destroyed: true, arrived: true }, atlas).frame, 'destroyed');
    assert.equal(paintedNacreBoatFrame({ ...boat, hp: 60, arrived: true }, atlas).frame, 'damaged');
  }
  assert.equal(paintedNacreBoatFrame({ ...boat, arrived: true }, 'ferry').frame, 'arrived');
  assert.equal(paintedNacreBoatFrame({ ...boat, moving: true }, 'rive-courte').frame, 'moving');
  assert.equal(paintedNacreBoatFrame({ ...boat, phase: 'boarding' }, 'veille-aval').frame, 'boarding');
  assert.equal(paintedNacreBoatFrame(boat, 'saisie', { released: true }).frame, 'released');
  assert.equal(paintedNacreBoatFrame({ ...boat, inspected: true }, 'saisie').frame, 'normal', 'Inspection does not release a winch');
});

test('channel and departure render the appropriate painted hulls once, without changing their population or position', () => {
  setPaintedNacreImages(standIns());
  for (const missionId of ['MI05', 'MI08']) {
    const s = createGame({ missionId, seed: 1555 }), saved = JSON.stringify(s), record = combatRecorder();
    const renderer = rendererFor(record);
    if (missionId === 'MI05') renderer.drawChannel(s, 0); else renderer.drawDepartureBoats(s, 0);
    assert.deepEqual(images(record).map(call => call.args[0].atlasKey), missionId === 'MI05' ? ['saisie', 'rive-courte', 'ferry'] : ['rive-courte', 'veille-aval']);
    assert.equal(JSON.stringify(s), saved); assert.equal(record.balanced(), true);
  }
});

test('missing or undecodable Nacre atlases preserve vector fallback and cannot leave a partially painted ambulance', async () => {
  const failed = await loadPaintedNacre({ loadImage: async () => { throw new Error('Deliberate image failure'); } });
  assert.ok(Object.values(failed).every(value => value.state === 'failed'));
  const s = createGame({ missionId: 'MI07', seed: 1555 }), record = combatRecorder();
  rendererFor(record).drawAmbulanceVehicle(s, 0);
  assert.equal(images(record).length, 0);
  assert.ok(record.calls.some(call => call.method === 'fill'));
  assert.equal(drawPaintedNacreBoat(record.ctx, { x: 0, y: 0, w: 100, h: 40, hp: 100, maxHp: 100 }, { atlas: 'ferry' }), false);
});

test('painted frame access is defensive and wheel motion responds to displacement while reduced motion stays fixed', () => {
  const saved = JSON.stringify(PAINTED_NACRE_LAYOUT), frame = paintedNacreFrame('rive-courte', 'arrived');
  frame.target[0] = -999; frame.anchors.keel[1] = -999;
  assert.equal(JSON.stringify(PAINTED_NACRE_LAYOUT), saved);
  const a = { x: 120, y: 0 }, b = { x: 132, y: 0 };
  near(nacreAmbulanceWheelPoses(b, 500)[0].angle - nacreAmbulanceWheelPoses(a, 500)[0].angle, 1);
  assert.equal(nacreAmbulanceWheelPoses(b, 500, { reducedMotion: true })[0].angle, 0);
  assert.equal(paintedNacreFrame('ferry', 'missing'), null);
  assert.equal(Object.keys(paintedNacreStatus()).length, 6);
});
