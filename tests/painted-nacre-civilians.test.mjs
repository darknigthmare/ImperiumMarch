import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_NACRE_CIVILIANS_LAYOUT } from '../src/painted-nacre-civilians-layout.mjs';
import { PAINTED_NACRE_CIVILIANS_URLS, setPaintedNacreCivilianImages, clearPaintedNacreCivilians,
  loadPaintedNacreCivilians, paintedNacreCivilianStatus, paintedNacreCivilianFrame,
  paintedNacreCivilianSelection, nacreCivilianRole, nacreCivilianVariation,
  drawPaintedNacreCivilian } from '../src/painted-nacre-civilians.mjs';
import { PAINTED_NACRE_PEOPLE_LAYOUT } from '../src/painted-nacre-people-layout.mjs';
import { setPaintedNacrePeopleImages, clearPaintedNacrePeople } from '../src/painted-nacre-people.mjs';

const standIns = () => Object.fromEntries(Object.entries(PAINTED_NACRE_CIVILIANS_LAYOUT).map(([key, value]) =>
  [key, { atlasKey: key, width: value.size[0], height: value.size[1] }]));
const imageCalls = record => record.calls.filter(call => call.method === 'drawImage');
const person = values => ({ id: 'house-white-mark-resident-1', homeId: 'house-white-mark', role: 'resident',
  x: 300, y: 400, w: 19, h: 34, phase: 'evacuating', alive: true, safe: false, hp: 90, maxHp: 90, ...values });
const rendererFor = record => Object.assign(Object.create(Renderer.prototype), {
  ctx: record.ctx, visible: () => true, combatReducedMotion: false, cameraX: 0,
});
const fullContext = { refugeesPassed: 12, refugeesLost: 0, residentsSafe: 10, residentsLost: 0,
  techniciansAlive: 2, techniciansLost: 0, patientsArrived: 4, patientsLost: 0, staffArrived: 2, staffLost: 0,
  smugglerVerified: true, bargeCiviliansLost: 0, medicalDestination: 'clinic', medicalVehicleRecovered: true };
test.afterEach(() => { clearPaintedNacreCivilians(); clearPaintedNacrePeople(); });

test('42 runtime crops remain inside original cells, all 6 references are excluded, and visible feet meet the physical ground', () => {
  setPaintedNacreCivilianImages(standIns());
  const before = JSON.stringify(PAINTED_NACRE_CIVILIANS_LAYOUT);
  let runtime = 0, references = 0;
  for (const [key, atlas] of Object.entries(PAINTED_NACRE_CIVILIANS_LAYOUT)) for (const [name, raw] of Object.entries(atlas.frames)) {
    const selected = paintedNacreCivilianFrame(key, name);
    if (raw.usage === 'reference') { assert.equal(selected, null); references++; continue; }
    const [x, y, w, h] = selected.source, [cx, cy, cw, ch] = selected.cell;
    assert.ok([x, y, w, h].every(Number.isInteger));
    assert.ok(x >= cx && y >= cy && x+w <= cx+cw && y+h <= cy+ch, `${key}/${name}`);
    const ground = selected.target[1] + (selected.anchors.sourceGround[1]-y)*selected.target[3]/h;
    assert.ok(Math.abs(ground) < .00001, `${key}/${name}: visible sole grounded`);
    selected.source[0] = -1; selected.anchors.ground[0] = 100;
    runtime++;
  }
  assert.equal(runtime, 42); assert.equal(references, 6);
  assert.equal(JSON.stringify(PAINTED_NACRE_CIVILIANS_LAYOUT), before);
  for (const facing of [-1, 1]) {
    const p = person(), record = combatRecorder();
    assert.ok(drawPaintedNacreCivilian(record.ctx, p, { facing }));
    assert.deepEqual(record.point(imageCalls(record)[0], [0, 0]), [p.x, p.y+p.h/2]);
    assert.ok(record.balanced());
  }
});

test('current-roster variation is stable across loading and rendering without assigning historical identities', () => {
  const subjects = Array.from({ length: 10 }, (_, i) => person({ id: `house-white-mark-resident-${i+1}` }));
  assert.deepEqual(new Set(subjects.map(nacreCivilianVariation)), new Set([1, 2]));
  for (const p of subjects) {
    const before = JSON.stringify(p), first = nacreCivilianVariation(p);
    clearPaintedNacreCivilians();
    assert.equal(nacreCivilianVariation(JSON.parse(before)), first);
    assert.equal(paintedNacreCivilianSelection(p).variation, first);
    assert.equal(JSON.stringify(p), before);
  }
});

test('walk cycles follow displacement, freeze at identical time, and stop for blocks, teleports and reduced motion', () => {
  const p = person();
  assert.match(paintedNacreCivilianSelection(p).frame, /-idle$/);
  const frames = new Set();
  for (let i = 1; i <= 4; i++) {
    p.x += 8;
    const before = JSON.stringify(p), selected = paintedNacreCivilianSelection(p, { time: i/60 });
    frames.add(selected.frame); assert.equal(JSON.stringify(p), before);
    for (let repeat = 0; repeat < 3; repeat++) assert.deepEqual(paintedNacreCivilianSelection(p, { time: i/60 }), selected);
  }
  assert.equal(frames.size, 4);
  assert.match(paintedNacreCivilianSelection(p, { time: 5/60 }).frame, /-idle$/);
  p.x -= 5;
  assert.match(paintedNacreCivilianSelection(p, { time: 6/60, reducedMotion: true }).frame, /-idle$/);
  p.x -= 5; assert.equal(paintedNacreCivilianSelection(p, { time: 7/60 }).facing, -1);
  p.x += 500; assert.match(paintedNacreCivilianSelection(p, { time: 8/60 }).frame, /-idle$/);
  p.x += 5; assert.match(paintedNacreCivilianSelection(p, { time: 8 }).frame, /-idle$/);
  assert.match(paintedNacreCivilianSelection(p, { time: 0 }).frame, /-idle$/, 'Rewinding resets presentation history');
});

test('normal renderer keeps actual facing under reduced motion for Nacre civilians and personnel while idle poses and paused state stay fixed', () => {
  setPaintedNacreCivilianImages(standIns());
  setPaintedNacrePeopleImages(Object.fromEntries(Object.entries(PAINTED_NACRE_PEOPLE_LAYOUT).map(([key, atlas]) =>
    [key, { atlasKey: key, width: atlas.size[0], height: atlas.size[1] }])));
  const scenarios = [
    ['MI06', 'resident', s => s.dike.residents[0], s => [...s.dike.residents, ...s.dike.technicians], 'evacuating'],
    ['MI06', 'technician', s => s.dike.technicians[0], s => [...s.dike.residents, ...s.dike.technicians], 'moving'],
    ['MI07', 'medic', s => s.ambulance.staff.find(p => p.role === 'medic'), s => [...s.ambulance.staff, ...s.ambulance.patients], 'transferring'],
    ['MI08', 'resident', s => s.departure.people.find(p => p.role === 'resident'), s => s.departure.people, 'joining'],
    ['MI08', 'technician', s => s.departure.people.find(p => p.role === 'technician'), s => s.departure.people, 'joining'],
  ];
  for (const [missionId, role, select, roster, phase] of scenarios) {
    const s = createGame({ missionId, seed: 159, campaignContext: fullContext }), p = select(s);
    for (const other of roster(s)) other.safe = true;
    Object.assign(p, { safe: false, alive: true, phase, x: s.player.x + 150 });
    const record = combatRecorder(), renderer = Object.assign(rendererFor(record), {
      width: 1600, height: 900, prepare() {},
    });
    const render = () => {
      record.calls.length = 0;
      const before = JSON.stringify(s);
      renderer.render(s, { reducedMotion: true, shake: false });
      const draws = imageCalls(record);
      assert.equal(draws.length, 1, `${missionId}/${role}: exactly one selected actor`);
      assert.equal(JSON.stringify(s), before, `${missionId}/${role}: rendering preserves state`);
      assert.ok(record.balanced());
      return draws[0];
    };
    const initial = render(), idleSource = initial.args.slice(1, 5);
    p.x -= 6; s.elapsed += 1 / 60;
    const left = render();
    assert.ok(left.matrix[0] < 0, `${missionId}/${role}: actual leftward displacement flips the idle pose`);
    assert.deepEqual(left.args.slice(1, 5), idleSource, `${missionId}/${role}: no walk cycle under reduced motion`);
    assert.deepEqual(record.point(left, [0, 0]), [p.x - renderer.cameraX, p.y + p.h / 2]);
    assert.deepEqual(render().matrix, left.matrix, `${missionId}/${role}: a paused clock preserves the exact pose`);
    p.x += 6; s.elapsed += 1 / 60;
    const right = render();
    assert.ok(right.matrix[0] > 0, `${missionId}/${role}: a real turn remains visible`);
    assert.deepEqual(right.args.slice(1, 5), idleSource, `${missionId}/${role}: turning does not enable animation`);
  }
});

test('hidden, safe and aboard people never produce a full body, even when a resident loss is requested', () => {
  setPaintedNacreCivilianImages(standIns());
  for (const phase of ['home', 'origin', 'offsite', 'aboard', 'en-route']) {
    const p = person({ phase, alive: false }), record = combatRecorder();
    assert.equal(drawPaintedNacreCivilian(record.ctx, p, { allowLost: true }), false);
    assert.equal(imageCalls(record).length, 0);
  }
  assert.equal(paintedNacreCivilianSelection(person({ safe: true, phase: 'arrived' })), null);
});

test('only exposed MI06 residents use loss cells; MI08 cannot gain corpses through an allowLost option', () => {
  const resident = person({ alive: false });
  assert.equal(paintedNacreCivilianSelection(resident), null);
  assert.match(paintedNacreCivilianSelection(resident, { allowLost: true }).frame, /-downed$/);
  for (const role of ['resident', 'refugee', 'crew', 'harbourmaster', 'staff']) {
    const p = person({ id: `aval-${role}-1`, homeId: undefined, role, alive: false, originalId: null, phase: 'lost' });
    assert.equal(paintedNacreCivilianSelection(p, { allowLost: true }), null, role);
  }
  const mara = person({ id: 'aval-mara', homeId: undefined, role: 'mara', originalId: 'PN07', sourceMission: 'MI08', alive: false, phase: 'lost' });
  assert.equal(paintedNacreCivilianSelection(mara, { allowLost: true }), null);
});

test('anonymous staff remain anonymous and known driver or medic identities stay with their existing atlas', () => {
  for (const originalId of [null, undefined]) {
    const p = person({ id: 'aval-staff-survivor-1', homeId: undefined, role: 'staff', originalId, sourceKind: 'aggregate' });
    const before = JSON.stringify(p);
    assert.equal(nacreCivilianRole(p), 'ancillary');
    assert.equal(paintedNacreCivilianSelection(p).atlas, 'ancillary');
    assert.equal(JSON.stringify(p), before);
  }
  for (const originalId of ['ambulance-driver', 'ambulance-medic', 'another-known-person']) {
    const p = person({ role: 'staff', originalId });
    assert.equal(nacreCivilianRole(p), null);
    assert.equal(paintedNacreCivilianSelection(p), null);
  }
  const crew = person({ role: 'crew', homeId: undefined, originalId: null, sourceKind: 'aggregate' });
  const before = JSON.stringify(crew);
  assert.equal(paintedNacreCivilianSelection(crew).frame, 'crew-idle');
  assert.equal(JSON.stringify(crew), before, 'No Vann identity is inserted');
});

test('Mara has no physical sprite before the explicit MI08 actor and offsite gate allow it', () => {
  assert.equal(nacreCivilianRole(person({ role: 'mara' })), null);
  const s = createGame({ missionId: 'MI08', seed: 159, campaignContext: fullContext });
  const mara = s.departure.people.find(p => p.role === 'mara');
  assert.equal(mara.phase, 'offsite');
  assert.equal(paintedNacreCivilianSelection(mara), null);
  mara.phase = 'joining';
  assert.equal(paintedNacreCivilianSelection(mara).frame, 'mara-idle');
  assert.equal(paintedNacreCivilianSelection({ ...mara, sourceMission: 'MI06' }), null);
});

test('MI06 renderer paints its ten existing residents, preserves exposed losses and hides sheltered people', () => {
  setPaintedNacreCivilianImages(standIns());
  const s = createGame({ missionId: 'MI06', seed: 159 });
  let record = combatRecorder(); rendererFor(record).drawDikePeople(s, 0);
  assert.equal(imageCalls(record).length, 0, 'Residents begin inside their homes');
  for (const p of s.dike.residents) p.phase = 'evacuating';
  s.dike.residents[0].alive = false;
  const before = JSON.stringify(s); record = combatRecorder(); rendererFor(record).drawDikePeople(s, 0);
  assert.equal(imageCalls(record).length, 10);
  assert.ok(imageCalls(record).every(call => call.args[0].atlasKey === 'residents'));
  const selected = paintedNacreCivilianSelection(s.dike.residents[0], { role: 'resident', allowLost: true });
  const downed = paintedNacreCivilianFrame('residents', selected.frame).source;
  assert.ok(imageCalls(record).some(call => JSON.stringify(call.args.slice(1, 5)) === JSON.stringify(downed)));
  assert.equal(JSON.stringify(s), before); assert.ok(record.balanced());
  s.dike.residents[1].safe = true;
  record = combatRecorder(); rendererFor(record).drawDikePeople(s, 0);
  assert.equal(imageCalls(record).length, 9);
});

test('MI08 renderer preserves roles, unknown identity, boarding progress and its single occupant rendering', () => {
  setPaintedNacreCivilianImages(standIns());
  const s = createGame({ missionId: 'MI08', seed: 159, campaignContext: fullContext });
  for (const p of s.departure.people) p.phase = 'joining';
  const before = JSON.stringify(s), record = combatRecorder(); rendererFor(record).drawDeparturePeople(s, 0);
  assert.equal(imageCalls(record).length, 30, '12 refugees, 10 residents, 4 crew, harbourmaster, Mara and 2 anonymous staff');
  assert.equal(JSON.stringify(s), before); assert.ok(record.balanced());
  s.departure.people.find(p => p.role === 'resident').alive = false;
  s.departure.people.find(p => p.role === 'refugee').phase = 'aboard';
  s.departure.people.find(p => p.role === 'staff').originalId = 'ambulance-driver';
  const boarding = s.departure.people.find(p => p.role === 'crew'); boarding.phase = 'boarding'; boarding.boardingProgress = .5;
  const after = JSON.stringify(s), second = combatRecorder(); rendererFor(second).drawDeparturePeople(s, 0);
  assert.equal(imageCalls(second).length, 27, 'No dead MI08 resident, no duplicate body aboard, and no false anonymous known staff');
  assert.ok(second.calls.some(call => call.method === 'fillRect' && call.args[2] === 9 && call.args[3] === 3), 'Boarding indicator preserved');
  assert.equal(JSON.stringify(s), after); assert.ok(second.balanced());
});

test('decoder errors preserve fallback and cancelled requests cannot restore stale images', async () => {
  const failed = await loadPaintedNacreCivilians({ loadImage: async () => { throw new Error('Controlled decoding error'); } });
  assert.equal(Object.keys(failed).length, 5); assert.ok(Object.values(failed).every(item => item.state === 'failed'));
  assert.equal(drawPaintedNacreCivilian(combatRecorder().ctx, person()), false);
  clearPaintedNacreCivilians();
  let release;
  const deferred = new Promise(resolve => { release = resolve; });
  const pending = loadPaintedNacreCivilians({ loadImage: async (_, key) => { await deferred; return standIns()[key]; } });
  clearPaintedNacreCivilians(); release(); await pending;
  assert.ok(Object.values(paintedNacreCivilianStatus()).every(item => item.state === 'idle'));
  assert.throws(() => setPaintedNacreCivilianImages({ mara: { width: 3, height: 2 } }), /dimensions/);
  assert.deepEqual(Object.keys(PAINTED_NACRE_CIVILIANS_URLS), ['residents', 'refugees', 'dockworkers', 'mara', 'ancillary']);
});

test('a broken atlas restores Canvas state and leaves the other roles available', () => {
  setPaintedNacreCivilianImages(standIns());
  const record = combatRecorder(), p = person(), before = JSON.stringify(p);
  let shadows = 0;
  record.ctx.drawImage = () => { throw new Error('Image invalidated after decoding'); };
  assert.equal(drawPaintedNacreCivilian(record.ctx, p, { shadow: () => { shadows++; } }), false);
  assert.equal(shadows, 0); assert.ok(record.balanced()); assert.equal(JSON.stringify(p), before);
  assert.equal(paintedNacreCivilianStatus().residents.state, 'failed');
  assert.equal(paintedNacreCivilianStatus().refugees.state, 'ready');
  assert.ok(drawPaintedNacreCivilian(combatRecorder().ctx, person({ homeId: undefined, role: 'refugee' })));
});
