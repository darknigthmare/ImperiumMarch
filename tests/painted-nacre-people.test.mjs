import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_NACRE_PEOPLE_LAYOUT } from '../src/painted-nacre-people-layout.mjs';
import { PAINTED_NACRE_PEOPLE_URLS, setPaintedNacrePeopleImages, clearPaintedNacrePeople,
  loadPaintedNacrePeople, paintedNacrePeopleStatus, paintedNacrePeopleFrame, paintedNacrePersonSelection,
  nacrePeopleRole, drawPaintedNacrePerson } from '../src/painted-nacre-people.mjs';

const standIns = () => Object.fromEntries(Object.entries(PAINTED_NACRE_PEOPLE_LAYOUT).map(([key, value]) =>
  [key, { atlasKey: key, width: value.size[0], height: value.size[1] }]));
const imageCalls = record => record.calls.filter(call => call.method === 'drawImage');
const person = values => ({ id: 'dike-technician-1', x: 300, y: 400, w: 20, h: 34, role: 'technician',
  phase: 'moving', alive: true, safe: false, hp: 90, maxHp: 90, ...values });
const rendererFor = record => Object.assign(Object.create(Renderer.prototype), {
  ctx: record.ctx, visible: () => true, combatReducedMotion: false, cameraX: 0,
});
test.afterEach(clearPaintedNacrePeople);

test('Nacre people crops stay within measured cells and their visible soles map to actual ground', () => {
  setPaintedNacrePeopleImages(standIns());
  const before = JSON.stringify(PAINTED_NACRE_PEOPLE_LAYOUT);
  let count = 0;
  for (const [key, atlas] of Object.entries(PAINTED_NACRE_PEOPLE_LAYOUT)) for (const name of Object.keys(atlas.frames)) {
    const item = paintedNacrePeopleFrame(key, name), [x, y, w, h] = item.source, [cx, cy, cw, ch] = item.cell;
    assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch, `${key}/${name}`);
    assert.ok([x, y, w, h].every(Number.isInteger));
    const mappedGround = item.target[1] + (item.anchors.sourceGround[1] - y) * item.target[3] / h;
    assert.ok(Math.abs(mappedGround) < .00001, `${key}/${name}: alpha baseline remains grounded`);
    item.source[0] = -1; item.anchors.ground[0] = 100;
    count++;
  }
  assert.equal(count, 28); assert.equal(JSON.stringify(PAINTED_NACRE_PEOPLE_LAYOUT), before);
  const p = person(), record = combatRecorder();
  assert.ok(drawPaintedNacrePerson(record.ctx, p, { facing: -1 }));
  assert.deepEqual(record.point(imageCalls(record)[0], [0, 0]), [p.x, p.y + p.h / 2]);
  assert.ok(record.balanced());
});

test('walk poses follow real displacement, freeze on pause and stop when blocked or reduced', () => {
  const p = person();
  assert.equal(paintedNacrePersonSelection(p).frame, 'idle');
  const frames = new Set();
  for (let i = 1; i <= 4; i++) {
    p.x += 8;
    const before = JSON.stringify(p), selected = paintedNacrePersonSelection(p, { time: i / 60 });
    frames.add(selected.frame); assert.equal(JSON.stringify(p), before);
    for (let repeat = 0; repeat < 4; repeat++) assert.deepEqual(paintedNacrePersonSelection(p, { time: i / 60 }), selected);
  }
  assert.equal(frames.size, 4);
  assert.equal(paintedNacrePersonSelection(p, { time: 5 / 60 }).frame, 'idle');
  p.x -= 5;
  assert.equal(paintedNacrePersonSelection(p, { time: 6 / 60, reducedMotion: true }).frame, 'idle');
  p.x -= 5;
  assert.equal(paintedNacrePersonSelection(p, { time: 7 / 60 }).facing, -1);
  p.x += 500;
  assert.equal(paintedNacrePersonSelection(p, { time: 8 / 60 }).frame, 'idle', 'Teleport does not animate a stride');
  p.x += 5;
  assert.equal(paintedNacrePersonSelection(p, { time: 8 }).frame, 'idle', 'Long-hidden actor resets presentation');
});

test('tech work and cover states never override death or invent new saved facts', () => {
  const p = person({ phase: 'locking', covering: false }), before = JSON.stringify(p);
  assert.equal(paintedNacrePersonSelection(p).frame, 'locking');
  assert.equal(JSON.stringify(p), before);
  p.covering = true;
  assert.equal(paintedNacrePersonSelection(p).frame, 'covering');
  p.alive = false;
  assert.equal(paintedNacrePersonSelection(p), null);
  assert.equal(paintedNacrePersonSelection(p, { allowLost: true }).frame, 'downed');
});

test('every hidden or safe phase is excluded, including when a loss texture is allowed', () => {
  setPaintedNacrePeopleImages(standIns());
  for (const phase of ['home', 'origin', 'offsite', 'aboard', 'en-route']) {
    const p = person({ phase, alive: false }), record = combatRecorder();
    assert.equal(drawPaintedNacrePerson(record.ctx, p, { allowLost: true }), false);
    assert.equal(imageCalls(record).length, 0);
  }
  assert.equal(paintedNacrePersonSelection(person({ safe: true, phase: 'arrived' })), null);
});

test('MI06 keeps exactly two technician appearances and factual health and work labels', () => {
  setPaintedNacrePeopleImages(standIns());
  const s = createGame({ missionId: 'MI06', seed: 158 });
  s.dike.technicians[0].phase = 'locking'; s.dike.technicians[0].hp = 45;
  const before = JSON.stringify(s), record = combatRecorder();
  rendererFor(record).drawDikePeople(s, 0);
  assert.equal(imageCalls(record).length, 2);
  assert.ok(imageCalls(record).every(call => call.args[0].atlasKey === 'technicians'));
  assert.ok(record.calls.some(call => call.method === 'fillText' && call.args[0] === 'G1 · VERROUILLE'));
  assert.ok(record.calls.some(call => call.method === 'fillRect' && call.args[2] === 13 && call.args[3] === 3));
  assert.equal(JSON.stringify(s), before); assert.ok(record.balanced());
});

test('MI07 keeps six existing actors, hides those aboard or arrived, and retains labels and losses', () => {
  setPaintedNacrePeopleImages(standIns());
  const s = createGame({ missionId: 'MI07', seed: 158 });
  let record = combatRecorder(); rendererFor(record).drawAmbulancePeople(s, 0);
  assert.equal(imageCalls(record).length, 0, 'Everyone starts aboard');
  for (const p of [...s.ambulance.staff, ...s.ambulance.patients]) p.phase = 'transferring';
  s.ambulance.patients[1].alive = false;
  const before = JSON.stringify(s); record = combatRecorder(); rendererFor(record).drawAmbulancePeople(s, 0);
  assert.equal(imageCalls(record).length, 6);
  const lost = paintedNacrePeopleFrame('patients', 'patient-2-lost').source;
  assert.ok(imageCalls(record).some(call => JSON.stringify(call.args.slice(1, 5)) === JSON.stringify(lost)));
  assert.ok(record.calls.some(call => call.method === 'fillText' && call.args[0] === 'CONDUCTRICE'));
  assert.ok(record.calls.some(call => call.method === 'fillText' && call.args[0] === 'SOIGNANT'));
  assert.equal(JSON.stringify(s), before);
  s.ambulance.staff[0].safe = true;
  record = combatRecorder(); rendererFor(record).drawAmbulancePeople(s, 0);
  assert.equal(imageCalls(record).length, 5); assert.ok(record.balanced());
});

test('MI08 does not invent staff identities, corpses or full-body boat passengers', () => {
  setPaintedNacrePeopleImages(standIns());
  assert.equal(nacrePeopleRole(person({ role: 'staff', originalId: null })), null);
  assert.equal(nacrePeopleRole(person({ role: 'staff', originalId: 'ambulance-driver' })), 'driver');
  const s = createGame({ missionId: 'MI08', seed: 158, campaignContext: { techniciansAlive: 2, patientsArrived: 4, staffArrived: 2 } });
  for (const p of s.departure.people) p.phase = 'joining';
  const unknown = s.departure.people.find(p => p.role === 'staff');
  assert.ok(unknown); assert.equal(unknown.originalId, null);
  const patient = s.departure.people.find(p => p.role === 'patient');
  patient.phase = 'aboard';
  s.departure.people.find(p => p.role === 'technician').alive = false;
  const before = JSON.stringify(s), record = combatRecorder(); rendererFor(record).drawDeparturePeople(s, 0);
  assert.equal(imageCalls(record).length, 4, 'Three exposed patients and one living technician only');
  assert.ok(imageCalls(record).every(call => call.args[0].atlasKey !== 'staff'));
  assert.equal(JSON.stringify(s), before); assert.ok(record.balanced());
});

test('decode failure preserves fallbacks and cleared stale requests cannot repopulate people images', async () => {
  let failed = await loadPaintedNacrePeople({ loadImage: async () => { throw new Error('Controlled decoding failure'); } });
  assert.equal(Object.keys(failed).length, 3); assert.ok(Object.values(failed).every(item => item.state === 'failed'));
  const s = createGame({ missionId: 'MI06', seed: 158 }), record = combatRecorder();
  rendererFor(record).drawDikePeople(s, 0);
  assert.equal(imageCalls(record).length, 0); assert.ok(record.calls.some(call => call.method === 'fill'));
  clearPaintedNacrePeople();
  let release;
  const delay = new Promise(resolve => { release = resolve; });
  const pending = loadPaintedNacrePeople({ loadImage: async (_, key) => { await delay; return standIns()[key]; } });
  clearPaintedNacrePeople(); release(); await pending;
  assert.ok(Object.values(paintedNacrePeopleStatus()).every(item => item.state === 'idle'));
  assert.throws(() => setPaintedNacrePeopleImages({ technicians: { width: 2, height: 2 } }), /dimensions/);
  assert.deepEqual(Object.keys(PAINTED_NACRE_PEOPLE_URLS), ['technicians', 'staff', 'patients']);
});

test('a runtime draw failure restores Canvas state and emits only the normal fallback shadow and labels', () => {
  setPaintedNacrePeopleImages(standIns());
  const s = createGame({ missionId: 'MI07', seed: 158 });
  s.ambulance.staff[0].phase = 'outside';
  const before = JSON.stringify(s), record = combatRecorder(), renderer = rendererFor(record);
  let shadows = 0;
  renderer.drawShadow = () => { shadows++; };
  record.ctx.drawImage = () => { throw new Error('Image invalidated after decoding'); };
  assert.doesNotThrow(() => renderer.drawAmbulancePeople(s, 0));
  assert.equal(shadows, 1, 'Only the fallback emits its shadow');
  assert.equal(paintedNacrePeopleStatus().staff.state, 'failed');
  assert.ok(record.calls.some(call => call.method === 'fillText' && call.args[0] === 'CONDUCTRICE'));
  assert.ok(record.balanced()); assert.equal(JSON.stringify(s), before);
});
