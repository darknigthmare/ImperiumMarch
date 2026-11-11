import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALKERS, ALL_MISSIONS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, ambulanceDecisionBody, ambulanceStopClear } from '../src/simulation.mjs';
import { beginCampaignMission, parseCampaign, checkpointCampaign, serializeCampaign, restoreCampaignGame } from '../src/campaign.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI07, captureMI07Scene } from './helpers/mi07-driver.mjs';

const context = { pumpsOnline: true, panelsLocked: 1, emergencyShoring: false, dikeFatigue: 10,
  techniciansAlive: 2, homesUninhabitable: 0, residentsSafe: 10, residentsLost: 0, circuit: 'diversion' };
const create = options => createGame({ missionId: 'MI07', walkerId: 'WK09', seed: 1847, campaignContext: context, ...options });
function advance(s, seconds, input = {}) { for (let n = 0; n < Math.ceil(seconds * 60); n++) updateGame(s, 1 / 60, input); }

// A calibration projectile is a controlled negative stimulus. Damage, source
// losses, status and casualties are always resolved by production collision.
function impact(s, target, { team = 'player', damage = 5000, fromSide = false } = {}) {
  const x = fromSide ? target.x - target.w / 2 - 12 : target.x;
  const y = fromSide ? target.y : target.y - target.h / 2 - 30;
  const id = `ambulance-calibration-${s.entityId++}`;
  s.projectiles.push({ id, team, type: 'bullet', x, y, prevX: x, prevY: y,
    vx: fromSide ? 6000 : 0, vy: fromSide ? 0 : 6000, damage, radius: 2, life: 1, trail: [] });
  for (let n = 0; n < 10 && s.projectiles.some(p => p.id === id); n++) updateGame(s, 1 / 60, { brace: true });
}

test('MI07 six chassis complete both destinations through public commands, with real arrivals and distinct vehicle custody', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const s = pilotMI07(create({ walkerId: walker.id }), { choice });
    assert.equal(s.status, 'won', `${walker.id}/${choice}: ${JSON.stringify(s.objectives)}`);
    assert.equal(s.campaign.patientsArrived, 4); assert.equal(s.campaign.patientsLost, 0);
    assert.equal(s.campaign.staffArrived, 2); assert.equal(s.campaign.staffAlive, 2); assert.equal(s.campaign.staffLost, 0);
    assert.equal(s.campaign.consentObtained, true); assert.equal(s.campaign.medicalCargoVerified, true);
    assert.equal(s.campaign.beaconRecovered, true); assert.equal(s.campaign.fixingsPreserved, true); assert.equal(s.campaign.beaconLogCopied, true);
    assert.equal(s.campaign.destination, choice === 'obey' ? 'imperial' : 'clinic');
    assert.equal(s.campaign.vehicleRecovered, true); assert.equal(s.campaign.vehicleSeized, choice === 'obey');
    assert.equal(s.campaign.reportFiled, choice === 'defy'); assert.equal(s.campaign.provenanceVerified, false);
    assert.equal(s.stats.evidence, 0); assert.equal(s.stats.collateral, 0); assert.equal('fuelSpent' in s.campaign, false);
    assert.ok(s.objectives.every(o => o.complete));
    const terminal = structuredClone(s); updateGame(s, .05, { fire: true, move: -1 });
    assert.equal(commandGame(s, 'choice', 'obey'), false); assert.deepEqual(s, terminal);
  }
});

test('route and reception consume real MI06 support without turning its residents into the new medical population', () => {
  for (const [changed, route] of [[{ dikeFatigue: 64.99 }, 'main'], [{ dikeFatigue: 65 }, 'secondary'],
    [{ emergencyShoring: true }, 'secondary'], [{ panelsLocked: 0 }, 'secondary']]) {
    const s = create({ campaignContext: { ...context, ...changed } });
    assert.equal(s.campaign.route, route); assert.equal(s.ambulance.ramp.route, route);
    assert.equal(s.ambulance.patients.length, 4); assert.equal(s.ambulance.staff.length, 2);
    assert.equal(s.campaign.patientsArrived, 0); assert.equal(s.campaign.staffArrived, 0);
    assert.equal(s.campaign.provenanceVerified, false);
  }
  const normal = create(), displaced = create({ campaignContext: { ...context, homesUninhabitable: 2 } });
  assert.equal(displaced.ambulance.receptions[1].x - normal.ambulance.receptions[1].x, 180);
  assert.equal(displaced.ambulance.receptions[0].x, normal.ambulance.receptions[0].x);
  for (const mission of ALL_MISSIONS.filter(m => m.id !== 'MI07')) assert.equal('ambulance' in createGame({ missionId: mission.id }), false);
});

test('a direct interact call can be checkpointed before another frame, with immediately consistent physical and campaign facts', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/campaign-v6-mi06.json', import.meta.url), 'utf8'));
  const start = beginCampaignMission(parseCampaign(JSON.stringify(fixture.completed)), { missionId: 'MI07', walkerId: 'WK09' });
  pilotMI07(start.game, { stopAt: s => !s.ambulance.vehicle.called && Math.abs(s.player.x - s.mission.ambulance.callX) < 175 });
  const time = start.game.elapsed;
  assert.equal(commandGame(start.game, 'interact'), true); assert.equal(start.game.elapsed, time);
  assert.equal(start.game.ambulance.vehicle.called, true); assert.equal(start.game.campaign.stopCalled, true);
  const saved = checkpointCampaign(start.campaign, start.game);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(saved))), start.game);
});

test('the ambulance needs an actual call and a cleared stop; barriers require local work and reset when abandoned', () => {
  const s = create(), x = s.ambulance.vehicle.x;
  advance(s, 1, { brace: true }); assert.equal(s.ambulance.vehicle.x, x); assert.equal(s.ambulance.vehicle.called, false);
  pilotMI07(s, { stopAt: g => g.campaign.stopCalled });
  advance(s, 2, { brace: true }); assert.equal(s.ambulance.vehicle.x, x); assert.equal(ambulanceStopClear(s), false);
  pilotMI07(s, { stopAt: g => g.ambulance.barriers[0].progress > .3 });
  assert.equal(s.ambulance.barriers[0].cleared, false);
  advance(s, 4, { move: -1 });
  assert.equal(s.ambulance.barriers[0].working, false); assert.equal(s.ambulance.barriers[0].progress, 0);
  pilotMI07(s, { stopAt: g => g.ambulance.vehicle.moving && g.ambulance.vehicle.x > 1100 });
  assert.equal(s.campaign.vehicleStopped, false); assert.equal(s.campaign.consentObtained, false);
  const movingX = s.ambulance.vehicle.x; advance(s, 1, { brace: true });
  assert.ok(s.ambulance.vehicle.x > movingX + 40 && s.ambulance.vehicle.x < movingX + 50);
  pilotMI07(s, { stopAt: g => g.ambulance.vehicle.stopReached });
  assert.equal(s.ambulance.vehicle.x, s.mission.ambulance.stopX);
  assert.equal(s.campaign.consentObtained, false); assert.equal(s.campaign.cargoInspected, false);
});

test('permission is an actual timed exchange, separate from medical examination and permission to testify', () => {
  const s = pilotMI07(create(), { stopAt: g => g.ambulance.consent.progress > .4 });
  assert.equal(s.campaign.consentObtained, false); assert.equal(s.ambulance.consent.responsibleId, null);
  assert.equal(s.campaign.medicalCargoVerified, false); assert.equal(s.campaign.witnessConsent, false);
  const copy = structuredClone(s); advance(s, .3, { brace: true }); advance(copy, .3, { brace: true }); assert.deepEqual(s, copy);
  advance(s, 4, { move: -1 }); assert.equal(s.ambulance.consent.progress, 0);
  pilotMI07(s, { stopAt: g => g.campaign.consentObtained });
  assert.equal(s.campaign.cargoInspected, false); assert.equal(s.campaign.witnessConsent, false);
  assert.ok(['ambulance-driver', 'ambulance-medic'].includes(s.ambulance.consent.responsibleId));
  pilotMI07(s, { stopAt: g => g.campaign.cargoInspected });
  assert.equal(s.campaign.medicalCargoVerified, true); assert.equal(s.campaign.beaconRecovered, false);
});

test('cargo and beacon are separate sources: damage cannot invent cargo, attachments or a log, and prior inspection survives later loss', () => {
  const wreckedCase = pilotMI07(create(), { destroyCargo: true });
  assert.equal(wreckedCase.status, 'won'); assert.equal(wreckedCase.campaign.cargoInspected, true);
  assert.equal(wreckedCase.campaign.medicalCargoVerified, false); assert.equal(wreckedCase.campaign.beaconRecovered, true);
  assert.equal(wreckedCase.campaign.patientsArrived, 4);
  const inspected = pilotMI07(create(), { stopAt: g => g.campaign.medicalCargoVerified });
  impact(inspected, inspected.ambulance.cargo);
  assert.equal(inspected.ambulance.cargo.destroyed, true); assert.equal(inspected.campaign.medicalCargoVerified, true);
  pilotMI07(inspected); assert.equal(inspected.status, 'won'); assert.equal(inspected.stats.evidence, 0);
});

test('beacon removal requires stable planted support, resets on interruption and preserves its real parts only on completion', () => {
  const s = pilotMI07(create(), { stopAt: g => g.ambulance.beacon.progress > .4 });
  assert.equal(s.campaign.beaconRecovered, false); assert.equal(s.campaign.fixingsPreserved, false); assert.equal(s.campaign.beaconLogCopied, false);
  updateGame(s, 1 / 60, { brace: false });
  assert.equal(s.ambulance.beacon.working, false); assert.equal(s.ambulance.beacon.progress, 0);
  pilotMI07(s, { stopAt: g => g.campaign.beaconRecovered });
  assert.equal(s.campaign.fixingsPreserved, true); assert.equal(s.campaign.beaconLogCopied, true);
  assert.equal(s.campaign.provenanceVerified, false); assert.equal(s.stats.evidence, 0);
  const original = structuredClone(s); impact(s, s.ambulance.beacon);
  assert.equal(s.ambulance.beacon.hp, original.ambulance.beacon.hp, 'removed inventory is no longer a physical target under the vehicle');
  assert.equal(s.campaign.beaconRecovered, true);
});

test('announced seizure drones remain absent from damage and rendering before their ten-second arrival', () => {
  const s = pilotMI07(create(), { stopAt: g => g.campaign.beaconRecovered });
  const drones = s.enemies.filter(e => e.id.startsWith('seizure-drone-'));
  assert.equal(s.ambulance.signalAnnounced, true); assert.equal(s.ambulance.raidTriggered, false);
  for (const drone of drones) impact(s, drone);
  assert.ok(drones.every(d => !d.dead && d.hp === d.maxHp && !d.active));
  const oldWindow = globalThis.window, oldImage = globalThis.Image;
  globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
  const gradient = () => ({ addColorStop() {} });
  const ctx = new Proxy({ createLinearGradient: gradient, createRadialGradient: gradient, measureText: () => ({ width: 0 }) }, { get: (object, key) => key in object ? object[key] : () => {} });
  try {
    const renderer = new Renderer({ width: 1600, height: 900, getContext: () => ctx });
    renderer.visible = () => true;
    const drawn = []; renderer.drawEnemy = e => drawn.push(e.id);
    renderer.render(s, { shake: false }); assert.ok(!drawn.some(id => id.startsWith('seizure-drone-')));
    advance(s, 9, { brace: true }); assert.equal(s.ambulance.raidTriggered, false);
    advance(s, 1.1, { brace: true }); assert.equal(s.ambulance.raidTriggered, true);
    renderer.render(s, { shake: false }); assert.ok(drawn.includes('seizure-drone-1') && drawn.includes('seizure-drone-2'));
  } finally { globalThis.window = oldWindow; globalThis.Image = oldImage; }
});

test('publicly destroying the exposed beacon leaves a completed factual route without recovered attachments, log or provenance', () => {
  const s = pilotMI07(create(), { destroyBeacon: true });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.beaconResolved, true); assert.equal(s.campaign.beaconDestroyed, true);
  for (const key of ['beaconRecovered', 'fixingsPreserved', 'beaconLogCopied', 'provenanceVerified']) assert.equal(s.campaign[key], false);
  assert.equal(s.campaign.patientsArrived, 4); assert.equal(s.campaign.staffAlive, 2);
  assert.match(s.decision.body, /ni ses attaches ni son journal/);
});

test('vehicle destruction before arrival counts only its six actual occupants and leaves a truthful ending for either destination', () => {
  for (const choice of ['obey', 'defy']) {
    const s = pilotMI07(create(), { choice, destroyVehicle: true });
    assert.equal(s.status, 'won'); assert.equal(s.campaign.vehicleStopped, false); assert.equal(s.campaign.vehicleRecovered, false);
    assert.equal(s.campaign.patientsLost, 4); assert.equal(s.campaign.staffLost, 2); assert.equal(s.stats.collateral, 6);
    assert.equal(s.campaign.patientsArrived, 0); assert.equal(s.campaign.staffArrived, 0);
    assert.equal(s.campaign.cargoInspected, true); assert.equal(s.campaign.medicalCargoVerified, false);
    assert.equal(s.campaign.beaconResolved, true); assert.equal(s.campaign.beaconRecovered, false);
    assert.equal(s.campaign.consentObtained, false); assert.equal(s.campaign.witnessConsent, false);
    assert.equal(s.campaign.provenanceVerified, false); assert.equal(s.extraction.active, true);
  }
});

test('all six chassis can tow four patients without driver, medic, technical help or any new fuel', () => {
  for (const walker of WALKERS) {
    const s = create({ walkerId: walker.id, campaignContext: { ...context, panelsLocked: 0, emergencyShoring: true, techniciansAlive: 0 } });
    pilotMI07(s, { killStaff: true });
    assert.equal(s.status, 'won', walker.id); assert.equal(s.campaign.staffAlive, 0); assert.equal(s.campaign.staffLost, 2);
    assert.equal(s.ambulance.vehicle.towing, true); assert.equal(s.ambulance.vehicle.towProgress, 1);
    assert.equal(s.campaign.patientsArrived, 4); assert.equal(s.campaign.patientsLost, 0);
    assert.equal(s.campaign.technicalHelpRequested, false); assert.equal(s.campaign.witnessConsent, false);
    assert.equal(s.campaign.medicalCargoVerified, false, 'no examination consent may be invented after both responsible people died');
    assert.equal('fuelSpent' in s.campaign, false);
  }
});

test('a driver lost outside does not cause automatic driving; the manual tow is local, interruptible and proximity-bound', () => {
  const s = pilotMI07(create(), { stopAt: g => g.campaign.consentObtained });
  impact(s, s.ambulance.staff[0]); assert.equal(s.ambulance.staff[0].alive, false);
  const vehicleX = s.ambulance.vehicle.x;
  advance(s, 1, { brace: true }); assert.equal(s.ambulance.vehicle.x, vehicleX); assert.equal(s.ambulance.vehicle.towing, false);
  pilotMI07(s, { stopAt: g => g.ambulance.vehicle.towProgress > .3 });
  advance(s, 4, { move: -1 }); assert.equal(s.ambulance.vehicle.towWorking, false); assert.equal(s.ambulance.vehicle.towProgress, 0);
  pilotMI07(s, { stopAt: g => g.ambulance.handover.ordered });
  assert.equal(s.ambulance.vehicle.towing, true);
  advance(s, 3, { brace: true }); assert.equal(s.ambulance.vehicle.x, vehicleX, 'a remote walker cannot pull the ambulance from the reception');
  pilotMI07(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.staffArrived, 1); assert.equal(s.campaign.patientsArrived, 4);
});

test('a deceased witness keeps their recorded consent but cannot transfer that consent to the surviving colleague', () => {
  const s = pilotMI07(create(), { stopAt: g => g.campaign.witnessConsent });
  const id = s.campaign.witnessId, witness = s.ambulance.staff.find(t => t.id === id);
  assert.equal(s.campaign.witnessAvailable, true); impact(s, witness);
  assert.equal(witness.alive, false); assert.equal(s.campaign.witnessConsent, true);
  assert.equal(s.campaign.witnessId, id); assert.equal(s.campaign.witnessAvailable, false);
  assert.equal(s.campaign.staffAlive, 1); assert.match(ambulanceDecisionBody(s), /son auteur est depuis décédé/);
  pilotMI07(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.witnessId, id); assert.equal(s.campaign.witnessAvailable, false);
});

test('witness, Mara and technical contacts remain individually optional and are never inferred from availability', () => {
  for (const [options, key] of [[{ skipWitness: true }, 'witnessConsent'], [{ skipMara: true }, 'maraContacted'], [{ skipTechnical: true }, 'technicalHelpRequested']]) {
    const s = pilotMI07(create(), options); assert.equal(s.status, 'won'); assert.equal(s.campaign[key], false);
    assert.equal(s.campaign.patientsArrived, 4); assert.equal(s.campaign.provenanceVerified, false);
  }
});

test('technical help changes the real ramp duration only after a completed exchange, not from inherited survivors alone', () => {
  for (const skipTechnical of [false, true]) {
    const s = pilotMI07(create(), { skipTechnical, stopAt: g => g.ambulance.ramp.working });
    const remaining = 1 - s.ambulance.ramp.progress, start = s.elapsed;
    assert.equal(s.campaign.technicalHelpRequested, !skipTechnical);
    for (let n = 0; n < 600 && !s.ambulance.ramp.prepared; n++) updateGame(s, 1 / 60, { brace: true });
    assert.equal(s.ambulance.ramp.prepared, true);
    assert.ok(Math.abs(s.elapsed - start - remaining * (skipTechnical ? 8 : 4)) < .035);
  }
});

test('ramp work resets outside its range and restores identical partial progress, physics and future public actions', () => {
  const s = pilotMI07(create(), { stopAt: g => g.ambulance.ramp.progress > .4 });
  const resumed = JSON.parse(JSON.stringify(s));
  advance(s, .7, { brace: true }); advance(resumed, .7, { brace: true }); assert.deepEqual(s, resumed);
  advance(s, 5, { move: -1 }); assert.equal(s.ambulance.ramp.working, false); assert.equal(s.ambulance.ramp.progress, 0);
  pilotMI07(s); assert.equal(s.status, 'won');
});

test('the decision freezes time and selects a destination without deploying a ramp, preparing reception or moving patients', () => {
  const s = pilotMI07(create(), { stopAt: g => g.decision.active });
  const frozen = structuredClone(s); advance(s, 5, { move: 1, fire: true }); assert.deepEqual(s, frozen);
  assert.equal(commandGame(s, 'choice', 'obey'), true);
  assert.equal(s.campaign.destination, 'imperial'); assert.equal(s.campaign.vehicleSeized, false);
  assert.equal(s.campaign.rampPrepared, false); assert.equal(s.campaign.receptionReady, false);
  assert.equal(s.campaign.transferOrdered, false); assert.equal(s.campaign.patientsArrived, 0);
  pilotMI07(s, { choice: 'obey', stopAt: g => g.ambulance.receptions[0].ready });
  assert.equal(s.campaign.transferOrdered, false); assert.equal(s.ambulance.vehicle.x, s.mission.ambulance.stopX);
  const elapsed = s.elapsed; commandGame(s, 'interact');
  assert.equal(s.elapsed, elapsed); assert.equal(s.ambulance.handover.ordered, true); assert.equal(s.campaign.transferOrdered, true);
  assert.equal(s.campaign.patientsArrived, 0);
});

test('arrival at the quay precedes unloading and each individual arrival at the medical doorway', () => {
  const s = pilotMI07(create(), { stopAt: g => g.ambulance.vehicle.arrived });
  const reception = s.ambulance.receptions.find(r => r.kind === s.campaign.destination);
  assert.equal(s.ambulance.vehicle.x, reception.x - 180); assert.equal(s.campaign.vehicleRecovered, true);
  assert.equal(s.campaign.patientsArrived, 0); assert.equal(s.ambulance.handover.completed, false);
  pilotMI07(s, { stopAt: g => g.ambulance.handover.completed });
  assert.equal(s.campaign.patientsArrived, 0); assert.ok(s.ambulance.patients.every(p => p.phase === 'transferring'));
  assert.equal(s.extraction.active, false);
  const x = s.ambulance.patients[0].x; advance(s, 1, { brace: true });
  assert.ok(s.ambulance.patients[0].x > x + 23); assert.equal(s.campaign.patientsArrived, 0);
  pilotMI07(s); assert.equal(s.status, 'won'); assert.ok(s.ambulance.patients.every(p => p.safe && p.x === reception.x));
});

test('a patient lost during the actual transfer is never counted as arrived, while admitted patients leave the firing world', () => {
  const s = pilotMI07(create(), { stopAt: g => g.ambulance.handover.completed });
  advance(s, 6, { brace: true });
  const patient = s.ambulance.patients.find(p => p.alive && !p.safe && p.x > s.ambulance.vehicle.x + 100);
  assert.ok(patient); impact(s, patient);
  assert.equal(patient.alive, false); assert.equal(patient.safe, false); assert.equal(s.campaign.patientsLost, 1);
  pilotMI07(s, { stopAt: g => g.campaign.patientsArrived === 3 });
  assert.equal(s.campaign.patientsLost, 1);
  const safe = s.ambulance.patients.find(p => p.safe), hp = safe.hp; impact(s, safe);
  assert.equal(safe.hp, hp); assert.equal(safe.safe, true);
  pilotMI07(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.patientsArrived, 3); assert.equal(s.campaign.patientsLost, 1);
});

test('destroying the vehicle after unloading cannot recall transferred people or destroy a recovered beacon', () => {
  const s = pilotMI07(create(), { stopAt: g => g.ambulance.handover.completed });
  assert.equal(s.campaign.beaconRecovered, true);
  impact(s, s.ambulance.vehicle, { fromSide: true });
  assert.equal(s.ambulance.vehicle.destroyed, true); assert.equal(s.campaign.vehicleRecovered, false);
  assert.equal(s.campaign.patientsLost, 0); assert.equal(s.campaign.staffLost, 0);
  assert.equal(s.campaign.beaconRecovered, true); assert.equal(s.campaign.beaconLogCopied, true);
  pilotMI07(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.patientsArrived, 4);
  assert.match(s.decision.body, /Le véhicule est perdu/);
});

test('both teams hit real exposed components and staff while aboard people are protected by the hull', () => {
  for (const team of ['player', 'enemy']) {
    const shielded = create(), driver = shielded.ambulance.staff[0], hp = shielded.ambulance.vehicle.hp;
    impact(shielded, driver, { team, damage: 30 });
    assert.equal(driver.hp, driver.maxHp); assert.ok(shielded.ambulance.vehicle.hp < hp);
    const exposed = pilotMI07(create(), { stopAt: g => g.campaign.consentObtained });
    impact(exposed, exposed.ambulance.staff[1], { team });
    assert.equal(exposed.ambulance.staff[1].alive, false); assert.equal(exposed.campaign.staffLost, 1);
    const cargo = create(); impact(cargo, cargo.ambulance.cargo, { team }); assert.equal(cargo.ambulance.cargo.destroyed, true);
    const beacon = create(); impact(beacon, beacon.ambulance.beacon, { team, fromSide: true }); assert.equal(beacon.ambulance.beacon.destroyed, true);
  }
});

test('all preview scene states are deep copies that remain frozen across later decisions, losses and transfers', () => {
  const s = pilotMI07(create(), { stopAt: g => g.ambulance.beacon.progress > .5 });
  const scene = captureMI07Scene(s, { file: 'mi07-beacon-removal.png' }), bytes = JSON.stringify(scene);
  assert.notStrictEqual(scene.state, s); assert.notStrictEqual(scene.state.ambulance.patients[0], s.ambulance.patients[0]);
  assert.notStrictEqual(scene.state.player.feet[0], s.player.feet[0]);
  pilotMI07(s); assert.equal(s.status, 'won'); assert.equal(JSON.stringify(scene), bytes);
  assert.equal(scene.state.campaign.beaconRecovered, false); assert.equal(scene.state.campaign.destination, 'unselected');
  assert.equal(scene.state.ambulance.handover.ordered, false);
});
