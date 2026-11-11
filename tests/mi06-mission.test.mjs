import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, ALL_MISSIONS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, dikeSupportReady, dikeDecisionBody } from '../src/simulation.mjs';
import { pilotMI06, captureMI06Scene } from './helpers/mi06-driver.mjs';

const context = { fuelAvailable: 2, channelOpen: true, refugeesPassed: 12, refugeesLost: 0, smugglerVerified: true, bargeCiviliansLost: 0 };
const create = (options = {}) => createGame({ missionId: 'MI06', walkerId: 'WK09', difficulty: 'normal', seed: 1847, campaignContext: context, ...options });
function advance(s, seconds, input = {}) { for (let n = 0; n < Math.ceil(seconds * 60); n++) updateGame(s, 1 / 60, input); }

// Negative unit stimuli use a real swept projectile and production damage.
// No health, losses, destruction, work progress or result is directly assigned.
function impact(s, entity, { team = 'player', damage = 5000, fromSide = false } = {}) {
  const x = fromSide ? entity.x - entity.w / 2 - 15 : entity.x;
  const y = fromSide ? entity.y : entity.y - entity.h / 2 - 35;
  const id = `dike-calibration-${s.entityId++}`;
  s.projectiles.push({ id, team, type: 'bullet', x, y, prevX: x, prevY: y,
    vx: fromSide ? 6000 : 0, vy: fromSide ? 0 : 6000, damage, radius: 2, life: 1, trail: [] });
  for (let n = 0; n < 10 && s.projectiles.some(p => p.id === id); n++) updateGame(s, 1 / 60, { brace: true });
}

test('MI06 six chassis finish both physical circuits through public controls and separate people from homes', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const s = pilotMI06(create({ walkerId: walker.id }), { choice });
    assert.equal(s.status, 'won', `${walker.id}/${choice}: ${JSON.stringify(s.objectives)}`);
    assert.equal(s.campaign.residentsSafe, 10); assert.equal(s.campaign.residentsLost, 0);
    assert.equal(s.campaign.techniciansAlive, 2); assert.equal(s.campaign.techniciansLost, 0);
    assert.equal(s.campaign.panelsLocked, 1); assert.equal(s.campaign.pumpsOnline, true);
    assert.equal(s.campaign.homesUninhabitable, choice === 'obey' ? 2 : 0);
    assert.equal(s.campaign.circuit, choice === 'obey' ? 'imperial' : 'diversion');
    assert.equal(s.campaign.reportFiled, choice === 'defy'); assert.equal(s.campaign.fuelSpent, 2);
    assert.equal(s.stats.collateral, 0); assert.equal(s.stats.evidence, 0);
    assert.ok(s.objectives.every(o => o.complete));
    const terminal = structuredClone(s); updateGame(s, .05, { move: -1, fire: true });
    assert.equal(commandGame(s, 'choice', 'obey'), false); assert.deepEqual(s, terminal);
  }
});

test('Nacre dike has its own ten residents, two technicians and facts; historical missions gain no dike field', () => {
  for (const fuelAvailable of [0, 2]) for (const channelOpen of [false, true]) {
    const s = create({ campaignContext: { fuelAvailable, channelOpen, refugeesPassed: channelOpen ? 12 : 0 } });
    assert.equal(s.dike.residents.length, 10); assert.equal(s.campaign.residentsSafe, 0);
    assert.deepEqual(s.dike.houses.map(h => h.population), [6, 4]);
    assert.equal(s.dike.technicians.length, 2); assert.equal(s.campaign.thresholdsInspected, 0);
    assert.ok(s.dike.technicians.every(t => t.route === (channelOpen ? 'quay' : 'upper')));
    assert.equal(s.campaign.fuelSpent, 0); assert.equal(s.campaign.pumpsOnline, false);
    assert.equal(commandGame(s, 'choice', 'defy'), false);
    assert.match(dikeDecisionBody(s), /0 seuil sur deux effectivement relevé/);
  }
  for (const mission of ALL_MISSIONS.filter(m => m.id !== 'MI06')) assert.equal('dike' in createGame({ missionId: mission.id }), false);
});

test('inspections are local timed work; interruption resets the reading and a global radio call does not imply a second inspection', () => {
  const s = pilotMI06(create(), { stopAt: g => g.dike.houses[0].scanProgress > .35 });
  assert.equal(s.campaign.thresholdsInspected, 0); assert.equal(s.campaign.evacuationOrdered, false);
  advance(s, 4, { move: -1 });
  assert.equal(s.dike.houses[0].scanning, false); assert.equal(s.dike.houses[0].scanProgress, 0);
  pilotMI06(s, { stopAt: g => g.dike.houses[0].inspected });
  assert.equal(s.campaign.thresholdsInspected, 1); assert.equal(s.campaign.evacuationOrdered, false);
  assert.equal(commandGame(s, 'interact'), true);
  assert.equal(s.campaign.evacuationOrdered, true); assert.equal(s.campaign.thresholdsInspected, 1);
  assert.ok(s.dike.residents.every(r => r.phase === 'evacuating'));
  assert.equal(s.campaign.residentsSafe, 0, 'a radio order is not an arrival');
});

test('the panel requires the actual support band, all planted feet and bracing; lifting an appui cancels the incomplete latch', () => {
  const s = pilotMI06(create(), { stopAt: g => g.dike.panel.latchProgress > .4 });
  assert.ok(dikeSupportReady(s)); assert.equal(s.dike.panel.supported, true);
  assert.equal(s.dike.panel.locked, false); assert.ok(s.player.feet.every(f => f.contact));
  const direction = s.player.lastGroup === 0 ? 'stepB' : 'stepA';
  updateGame(s, 1 / 60, { brace: false, [direction]: true });
  assert.ok(s.player.feet.some(f => !f.contact));
  assert.equal(dikeSupportReady(s), false); assert.equal(s.dike.panel.supported, false);
  assert.equal(s.dike.panel.latchProgress, 0); assert.equal(s.campaign.panelSecured, false);
  pilotMI06(s, { stopAt: g => g.dike.panel.locked });
  assert.equal(s.dike.panel.latchProgress, 1); assert.equal(s.campaign.panelSecured, true);
  advance(s, 3, { move: 1 });
  assert.ok(Math.abs(s.player.x - s.dike.panel.supportX) > 60);
  assert.equal(s.dike.panel.locked, true); assert.equal(s.dike.panel.supported, false);
});

test('technicians physically approach, use surviving cover under threat and remain distinct at the lock', () => {
  const s = pilotMI06(create(), { stopAt: g => g.dike.technicians.some(t => t.called && t.covering) });
  assert.ok(s.dike.technicians.some(t => t.phase === 'cover'));
  const positions = s.dike.technicians.map(t => t.x); advance(s, .1, { brace: true });
  for (let i = 0; i < 2; i++) assert.ok(Math.abs(s.dike.technicians[i].x - positions[i]) <= 3.5);
  assert.equal(s.dike.panel.locked, false);
  pilotMI06(s, { stopAt: g => g.dike.panel.latchProgress > .3 });
  assert.ok(s.dike.technicians.every(t => t.alive));
  assert.ok(Math.abs(s.dike.technicians[0].x - s.dike.technicians[1].x) > 20);
  assert.ok(Math.abs(s.dike.technicians[0].x - s.dike.panel.workX) <= 8);
});

test('the second technician alone takes the actual lock position and can secure the panel', () => {
  const s = create(); impact(s, s.dike.technicians[0]);
  assert.equal(s.dike.technicians[0].alive, false);
  pilotMI06(s, { stopAt: g => g.dike.panel.locked });
  assert.equal(s.dike.panel.locked, true); assert.equal(s.campaign.techniciansAlive, 1);
  assert.ok(Math.abs(s.dike.technicians[1].x - s.dike.panel.workX) <= 8);
  assert.equal(s.campaign.emergencyShoring, false);
  pilotMI06(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.techniciansLost, 1);
});

test('all six chassis retain a manual route without fuel or technicians after real projectile losses', () => {
  for (const walker of WALKERS) {
    const s = create({ walkerId: walker.id, campaignContext: { ...context, fuelAvailable: 0 } });
    for (const t of s.dike.technicians) impact(s, t);
    assert.equal(s.campaign.techniciansAlive, 0);
    pilotMI06(s);
    assert.equal(s.status, 'won', walker.id); assert.equal(s.campaign.residentsSafe, 10);
    assert.equal(s.campaign.emergencyShoring, true); assert.equal(s.campaign.panelsLocked, 0);
    assert.equal(s.campaign.manualIntervention, true); assert.equal(s.campaign.fuelSpent, 0);
    assert.equal(s.campaign.pumpsOnline, true); assert.equal(s.stats.collateral, 2);
  }
});

test('auxiliary connection pauses with the game, cancels out of range without expense and spends exactly two once', () => {
  const s = pilotMI06(create(), { stopAt: g => g.dike.auxiliary.progress > .4 });
  assert.equal(s.campaign.fuelSpent, 0); assert.equal(s.dike.auxiliary.connected, false);
  const original = structuredClone(s); updateGame(s, 0, { move: 1 }); assert.deepEqual(s, original);
  const resumed = structuredClone(s); advance(s, .5, { brace: true }); advance(resumed, .5, { brace: true }); assert.deepEqual(s, resumed);
  advance(s, 4, { move: -1 });
  assert.equal(s.dike.auxiliary.working, false); assert.equal(s.dike.auxiliary.progress, 0);
  assert.equal(s.campaign.fuelSpent, 0);
  pilotMI06(s, { stopAt: g => g.campaign.fuelSpent === 2 });
  assert.equal(s.dike.auxiliary.connected, true); assert.equal(s.dike.auxiliary.active, true);
  assert.equal(s.dike.auxiliary.progress, 1);
  for (let n = 0; n < 4; n++) commandGame(s, 'interact');
  advance(s, 6, { brace: true }); assert.equal(s.campaign.fuelSpent, 2);
  assert.equal(s.events.filter(e => e.text.includes('Deux lots consommés une fois')).length, 1);
});

test('destroying auxiliary before connection costs nothing; destruction afterward preserves spent fuel without an active pump', () => {
  const unconnected = create(); impact(unconnected, unconnected.dike.auxiliary, { team: 'enemy' });
  assert.equal(unconnected.dike.auxiliary.destroyed, true); assert.equal(unconnected.campaign.fuelSpent, 0);
  pilotMI06(unconnected); assert.equal(unconnected.status, 'won'); assert.equal(unconnected.campaign.fuelSpent, 0);
  const connected = pilotMI06(create(), { stopAt: s => s.campaign.fuelSpent === 2 });
  impact(connected, connected.dike.auxiliary);
  assert.equal(connected.dike.auxiliary.destroyed, true); assert.equal(connected.dike.auxiliary.connected, true);
  assert.equal(connected.dike.auxiliary.active, false); assert.equal(connected.campaign.fuelSpent, 2);
  pilotMI06(connected); assert.equal(connected.status, 'won'); assert.equal(connected.campaign.fuelSpent, 2);
});

test('the manual shoring job resets when the support is released and survives a deterministic partial-work restart', () => {
  const s = create({ campaignContext: { ...context, fuelAvailable: 0 } });
  for (const t of s.dike.technicians) impact(s, t);
  pilotMI06(s, { manualShoring: true, stopAt: g => g.dike.panel.manualProgress > .3 });
  assert.equal(s.campaign.panelSecured, false); assert.ok(dikeSupportReady(s));
  const resumed = structuredClone(s); advance(s, 1, { brace: true }); advance(resumed, 1, { brace: true }); assert.deepEqual(s, resumed);
  updateGame(s, 1 / 60, { brace: false });
  assert.equal(s.dike.panel.manualWorking, false); assert.equal(s.dike.panel.manualProgress, 0);
  pilotMI06(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.emergencyShoring, true);
});

test('a locked panel can really be destroyed; its lost lock cannot secure extraction and the independent shoring restores a route', () => {
  const s = pilotMI06(create(), { stopAt: g => g.dike.panel.locked });
  impact(s, s.dike.panel, { team: 'enemy' });
  assert.equal(s.dike.panel.destroyed, true); assert.equal(s.dike.panel.locked, false);
  assert.equal(s.dike.panel.latchProgress, 0); assert.equal(s.campaign.panelSecured, false);
  assert.equal(s.extraction.active, false);
  pilotMI06(s); assert.equal(s.status, 'won');
  assert.equal(s.dike.panel.destroyed, true); assert.equal(s.campaign.emergencyShoring, true);
  assert.equal(s.campaign.panelsLocked, 0); assert.match(s.outcome, /étai de secours/);
});

test('unsupported load produces an announced structural failure and truthful nearby casualties without a mission lock', () => {
  const s = pilotMI06(create({ campaignContext: { ...context, fuelAvailable: 0 } }), { stopAt: g => g.dike.panel.latchProgress > .2 });
  advance(s, 205, { brace: false });
  assert.equal(s.dike.panel.fatigue, 100); assert.equal(s.dike.panel.destroyed, true);
  assert.equal(s.campaign.techniciansLost, 2); assert.equal(s.campaign.panelSecured, false);
  assert.ok(s.events.some(e => e.text.includes('soixante-cinq')));
  pilotMI06(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.emergencyShoring, true);
});

test('evacuees walk to the shelter; a death in transit is not an arrival and sheltered residents remain out of fire', () => {
  const s = pilotMI06(create(), { stopAt: g => g.campaign.evacuationOrdered });
  assert.equal(s.campaign.residentsSafe, 0);
  const resident = s.dike.residents[0], initialX = resident.x;
  advance(s, 4, { brace: true }); assert.ok(resident.x < initialX - 90);
  impact(s, resident, { team: 'enemy' });
  assert.equal(resident.alive, false); assert.equal(resident.phase, 'lost'); assert.equal(resident.safe, false);
  pilotMI06(s, { stopAt: g => g.campaign.residentsSafe === 9 });
  assert.equal(s.campaign.residentsLost, 1); assert.equal(s.campaign.residentsSafe, 9);
  const safe = s.dike.residents.find(r => r.safe), health = safe.hp;
  impact(s, safe); assert.equal(safe.hp, health); assert.equal(s.campaign.residentsSafe, 9);
  pilotMI06(s); assert.equal(s.status, 'won'); assert.match(s.outcome, /9 habitants à l’abri, 1 perdu/);
});

test('the imperial circuit physically floods occupied houses when no evacuation is ordered and still yields a factual ending', () => {
  const s = pilotMI06(create(), { choice: 'obey', skipEvacuation: true, stopAt: g => g.dike.valve.completed });
  assert.equal(s.campaign.evacuationOrdered, false); assert.equal(s.campaign.residentsSafe, 0);
  assert.equal(s.campaign.residentsLost, 0); assert.equal(s.campaign.homesUninhabitable, 0);
  assert.equal(s.extraction.active, false);
  advance(s, 8, { brace: true });
  assert.equal(s.campaign.residentsLost, 10); assert.equal(s.campaign.homesUninhabitable, 2);
  assert.ok(s.dike.houses.every(h => h.flooded && !h.destroyed));
  assert.match(s.decision.body, /10 sont perdus/);
  pilotMI06(s, { choice: 'obey', skipEvacuation: true }); assert.equal(s.status, 'won');
  assert.equal(s.campaign.residentsSafe, 0); assert.equal(s.stats.collateral, 10);
});

test('destroyed homes retain inspectable thresholds, losses are counted once, and choosing diversion cannot rebuild them', () => {
  const s = pilotMI06(create(), { destroyHouse: 'house-white-mark' });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.thresholdsInspected, 2);
  assert.equal(s.campaign.homesUninhabitable, 1); assert.equal(s.campaign.residentsLost, 6);
  assert.equal(s.campaign.residentsSafe, 4); assert.equal(s.stats.collateral, 6);
  assert.equal(s.campaign.circuit, 'diversion'); assert.equal(s.dike.houses[0].destroyed, true);
  assert.equal(s.stats.evidence, 0); assert.match(s.decision.body, /1 logement est déjà inhabitable/);
});

test('choosing a circuit does not perform valve work; interruption and restart preserve deterministic concrete operations', () => {
  const s = pilotMI06(create(), { stopAt: g => g.decision.active });
  const before = structuredClone(s); advance(s, 2, { move: 1, fire: true }); assert.deepEqual(s, before);
  assert.equal(commandGame(s, 'choice', 'defy'), true); assert.equal(s.campaign.circuit, 'diversion');
  assert.equal(s.campaign.pumpsOnline, false); assert.equal(s.dike.valve.progress, 0);
  assert.equal(commandGame(s, 'interact'), true); advance(s, 2, { brace: true });
  assert.ok(s.dike.valve.progress > 0 && s.dike.valve.progress < 1);
  const resumed = structuredClone(s); advance(s, 1, { brace: true }); advance(resumed, 1, { brace: true }); assert.deepEqual(s, resumed);
  advance(s, 5, { move: -1 }); assert.equal(s.dike.valve.working, false); assert.equal(s.dike.valve.progress, 0);
  pilotMI06(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.pumpsOnline, true);
});

test('technicians remain vulnerable after arrival and their later deaths clear arrival and refresh the final factual body', () => {
  const s = pilotMI06(create(), { stopAt: g => g.dike.technicians.every(t => t.arrived) });
  assert.equal(s.status, 'playing'); assert.equal(s.campaign.techniciansAlive, 2);
  const technician = s.dike.technicians[0]; impact(s, technician);
  assert.equal(technician.alive, false); assert.equal(technician.arrived, false); assert.equal(technician.phase, 'lost');
  assert.equal(s.campaign.techniciansAlive, 1); assert.match(s.decision.body, /1 technicien reste en vie/);
  pilotMI06(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.techniciansLost, 1);
});

test('both projectile teams collide with real worksite objects and ground raiders stop outside the tall panel', () => {
  for (const team of ['player', 'enemy']) for (const kind of ['house', 'cover', 'panel', 'auxiliary', 'technician']) {
    const s = create(), target = kind === 'house' ? s.dike.houses[0] : kind === 'cover' ? s.dike.covers[0] : kind === 'technician' ? s.dike.technicians[0] : s.dike[kind];
    impact(s, target, { team });
    assert.equal(kind === 'technician' ? !target.alive : target.destroyed, true, `${team}/${kind}`);
  }
  const s = pilotMI06(create(), { stopAt: g => g.player.x > 2250 });
  const skimmer = s.enemies.find(e => e.type === 'skimmer'); advance(s, 8, { brace: true });
  if (!skimmer.dead && !s.dike.panel.destroyed) assert.ok(skimmer.x - skimmer.w / 2 >= s.dike.panel.x + s.dike.panel.w / 2);
});

test('an active auxiliary gives its real eight-second shoring benefit while an unfuelled job needs twelve', () => {
  for (const fuelAvailable of [0, 2]) {
    const s = create({ campaignContext: { ...context, fuelAvailable } });
    for (const t of s.dike.technicians) impact(s, t);
    pilotMI06(s, { stopAt: g => g.dike.panel.manualWorking });
    const remaining = 1 - s.dike.panel.manualProgress, start = s.elapsed;
    assert.equal(s.dike.auxiliary.active, fuelAvailable === 2);
    for (let n = 0; n < 800 && !s.dike.panel.emergencyShoring; n++) updateGame(s, 1 / 60, { brace: true });
    assert.equal(s.dike.panel.emergencyShoring, true);
    assert.ok(Math.abs(s.elapsed - start - remaining * (fuelAvailable ? 8 : 12)) < .035);
    assert.equal(s.campaign.fuelSpent, fuelAvailable);
  }
});

test('captured scene states are independent deep copies of feet, residents, work progress and later decisions', () => {
  const s = pilotMI06(create(), { stopAt: g => g.dike.panel.latchProgress > .5 });
  const scene = captureMI06Scene(s, { file: 'mi06-panel-support.png', title: 'Soutien réel' });
  const bytes = JSON.stringify(scene);
  assert.notStrictEqual(scene.state, s); assert.notStrictEqual(scene.state.dike, s.dike);
  assert.notStrictEqual(scene.state.player.feet[0], s.player.feet[0]);
  assert.notStrictEqual(scene.state.dike.residents[0], s.dike.residents[0]);
  pilotMI06(s, { choice: 'obey' });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.homesUninhabitable, 2);
  assert.equal(JSON.stringify(scene), bytes);
  assert.equal(scene.state.campaign.circuit, 'unselected'); assert.equal(scene.state.dike.panel.locked, false);
  assert.ok(scene.state.dike.panel.latchProgress > .5 && scene.state.dike.panel.latchProgress < 1);
});
