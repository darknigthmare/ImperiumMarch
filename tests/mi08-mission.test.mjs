import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALKERS, ALL_MISSIONS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, departureTideAt, departureWindow, departureGateBounds, departurePersonSeeds, departureReceiptRoster, departureDecisionBody } from '../src/simulation.mjs';
import { beginCampaignMission, parseCampaign, checkpointCampaign, serializeCampaign, restoreCampaignGame } from '../src/campaign.mjs';
import { Renderer } from '../src/renderer.mjs';
import { pilotMI08, captureMI08Scene } from './helpers/mi08-driver.mjs';

const history = JSON.parse(readFileSync(new URL('./fixtures/campaign-v7-mi07.json', import.meta.url), 'utf8'));
const fromHistory = (variant = 'completed', options = {}) => beginCampaignMission(parseCampaign(JSON.stringify(history[variant])), { missionId: 'MI08', walkerId: 'WK09', seed: 1847, ...options });
const context = fromHistory().game.campaign.context;
const create = options => createGame({ missionId: 'MI08', walkerId: 'WK09', seed: 1847, campaignContext: context, ...options });
function advance(s, seconds, input = {}) { for (let n = 0; n < Math.ceil(seconds * 60); n++) updateGame(s, 1 / 60, input); }
function walkTo(s, x) {
  for (let n = 0; n < 12000 && s.status === 'playing' && Math.abs(s.player.x - x) > 30; n++) updateGame(s, 1 / 60, { move: Math.sign(x - s.player.x) });
  advance(s, 1.2, { brace: true });
  assert.ok(Math.abs(s.player.x - x) < 45, `Public movement did not reach ${x}`);
}

// Controlled negative projectiles test production collision, never a health,
// gate, identity, destination, phase or outcome setter. The public pilot itself
// uses ordinary ammunition and movement for all of its destructive variants.
function impact(s, target, { team = 'player', damage = 5000, side = false } = {}) {
  const box = s.departure.locks.includes(target) ? departureGateBounds(target) : target;
  const x = side ? box.x - box.w / 2 - 12 : box.x, y = side ? box.y : box.y - box.h / 2 - 12;
  const id = `departure-calibration-${++s.entityId}`;
  s.projectiles.push({ id, team, type: 'bullet', x, y, prevX: x, prevY: y,
    vx: side ? 6000 : 0, vy: side ? 0 : 6000, damage, radius: 2, life: 1, trail: [] });
  for (let n = 0; n < 10 && s.projectiles.some(shot => shot.id === id); n++) updateGame(s, 1 / 60, { brace: true });
}
function terminalCounts(s) {
  const d = s.departure, c = s.campaign, present = d.people.filter(p => p.phase !== 'offsite');
  assert.equal(c.peopleTotal, present.length);
  assert.equal(c.peopleArrived + c.peopleLocal + c.peopleLost, c.peopleTotal);
  assert.equal(new Set(d.people.map(p => p.id)).size, d.people.length);
  for (const person of present) {
    assert.equal(person.alive, person.hp > 0); assert.equal(person.safe, ['arrived', 'local'].includes(person.phase));
    if (person.phase === 'arrived') { assert.equal(person.x, d.refuge.x); assert.equal(person.departed, true); }
    if (person.phase === 'local') assert.equal(person.x, person.role === 'technician' ? d.serviceShelter.x : d.shelter.x);
  }
}

test('MI08 six chassis complete all three material plans through public controls, preserving every identity and actual arrival', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'delay', 'defy']) {
    const s = pilotMI08(create({ walkerId: walker.id }), { choice });
    assert.equal(s.status, 'won', `${walker.id}/${choice}: ${s.interaction}`); terminalCounts(s);
    assert.equal(s.campaign.execution, { obey: 'immediate', delay: 'delayed', defy: 'open' }[choice]);
    assert.equal(s.campaign.peopleLost, 0); assert.equal(s.campaign.peopleArrived, choice === 'obey' ? 0 : 34);
    assert.equal(s.campaign.peopleLocal, choice === 'obey' ? 36 : 2);
    assert.equal(s.campaign.patientsArrived, choice === 'obey' ? 0 : 4); assert.equal(s.campaign.patientsLocal, choice === 'obey' ? 4 : 0);
    assert.equal(s.campaign.reportTransmitted, true); assert.equal(s.campaign.reportFiled, choice === 'defy');
    assert.equal(s.campaign.closureCompleted, choice !== 'defy'); assert.equal(s.campaign.accessMaintained, choice === 'defy');
    assert.equal(s.departure.locks[1].opening, choice === 'defy' ? 1 : 0);
    assert.equal(s.campaign.registryCopied, true); assert.equal(s.campaign.forcedContractsVerified, true);
    assert.equal(s.stats.evidence, 0); assert.equal(s.stats.collateral, 0); assert.equal('fuelSpent' in s.campaign, false);
    assert.ok(s.objectives.every(o => o.complete));
    const frozen = structuredClone(s); updateGame(s, .05, { move: -1, fire: true });
    assert.equal(commandGame(s, 'choice', 'obey'), false); assert.deepEqual(s, frozen);
  }
});

test('historical source totals remain separate and a known witness is not assigned to an uncertain survivor', () => {
  const s = create(), seeds = departurePersonSeeds(context);
  assert.deepEqual(s.departure.people.map(p => Object.fromEntries(Object.keys(seeds[0]).map(k => [k, p[k]]))), seeds);
  assert.equal(seeds.filter(p => p.sourceMission === 'MI05' && p.role === 'refugee').length, context.refugeesPassed);
  assert.equal(seeds.filter(p => p.role === 'resident').length, context.residentsSafe);
  assert.equal(seeds.filter(p => p.role === 'patient').length, context.patientsArrived);
  assert.ok(seeds.filter(p => ['patient', 'resident', 'refugee'].includes(p.role)).every(p => p.sourceKind === 'aggregate' && p.originalId === null));
  const partial = departurePersonSeeds({ ...context, staffArrived: 1, staffLost: 0, medicalWitnessId: 'ambulance-medic', medicalWitnessAvailable: true });
  assert.ok(partial.filter(p => p.role === 'staff').every(p => p.originalId === null && p.sourceKind === 'aggregate'));
  const known = departurePersonSeeds({ ...context, staffArrived: 1, staffLost: 1, medicalWitnessId: 'ambulance-medic', medicalWitnessAvailable: true });
  assert.equal(known.find(p => p.role === 'staff').originalId, 'ambulance-medic');
  assert.equal(s.campaign.maraPresent, false); assert.equal(s.departure.people.find(p => p.role === 'mara').phase, 'offsite');
  for (const mission of ALL_MISSIONS.filter(m => m.id !== 'MI08')) assert.equal('departure' in createGame({ missionId: mission.id }), false);
});

test('authentic clinic, imperial, shored, no-staff and lost-ambulance histories produce only their real survivors and no new fuel', () => {
  for (const variant of ['completed', 'imperialCompleted', 'manualCompleted', 'noStaffCompleted', 'lossCompleted']) {
    const { game: s, campaign } = fromHistory(variant), before = structuredClone(campaign.resources);
    pilotMI08(s); assert.equal(s.status, 'won', variant); terminalCounts(s);
    assert.equal(s.departure.people.filter(p => p.role === 'patient').length, history[variant].completed.MI07.patientsArrived);
    assert.equal(s.departure.people.filter(p => p.role === 'staff').length, history[variant].completed.MI07.staffArrived);
    assert.deepEqual(campaign.resources, before); assert.equal(s.stats.evidence, 0);
    if (variant === 'noStaffCompleted') { assert.equal(s.campaign.patientsArrived, 2); assert.equal(s.campaign.patientsLocal, 2); }
    if (variant === 'lossCompleted') assert.equal(s.campaign.patientsTotal, 0);
  }
});

test('tide belongs to the simulation clock and basin changes continuously after an anchored intake closure', () => {
  const s = pilotMI08(create(), { stopAt: g => g.departure.locks[0].opening < .65 && g.departure.locks[0].working });
  const d = s.departure, opening = d.locks[0].opening, basin = d.basin, passage = d.locks[1].opening;
  assert.deepEqual(d.tide, departureTideAt(s.elapsed)); assert.ok(d.current > 0);
  updateGame(s, 1 / 60, { brace: false });
  assert.equal(d.locks[0].working, false); assert.equal(d.locks[0].progress, 0); assert.equal(d.locks[0].opening, opening);
  assert.equal(d.locks[1].opening, passage); assert.ok(Math.abs(d.basin - basin) < .01); assert.notEqual(d.basin, basin);
  const saved = JSON.parse(JSON.stringify(s));
  advance(s, 1, { brace: true }); advance(saved, 1, { brace: true }); assert.deepEqual(s, saved);
  pilotMI08(s, { stopAt: g => g.decision.active });
  const frozen = structuredClone(s); advance(s, 8, { move: 1, fire: true }); assert.deepEqual(s, frozen);
  assert.deepEqual(s.departure.tide, departureTideAt(s.elapsed));
  assert.equal(departureTideAt(16).slack, true); assert.equal(departureTideAt(32).slack, false);
  assert.equal(departureTideAt(48).slack, true); assert.equal(departureTideAt(62).nextSlack, 10);
});

test('technical assistance requires accepted service and a living person at the intake; no survivor means the full manual duration', () => {
  for (const absent of [false, true]) {
    const s = create({ campaignContext: absent ? { ...context, techniciansAlive: 0, techniciansLost: 2 } : context });
    assert.equal(s.campaign.techniciansAssigned, 0); assert.equal(s.departure.technical.contacted, false);
    pilotMI08(s, { stopAt: g => g.departure.locks[0].working && (absent || g.departure.people.some(p => p.role === 'technician' && p.phase === 'duty')) });
    const gate = s.departure.locks[0], remaining = gate.opening, start = s.elapsed;
    assert.equal(s.departure.technical.contacted, !absent);
    while (gate.working && s.elapsed - start < 10) updateGame(s, 1 / 60, { brace: true });
    assert.equal(gate.opening, 0); assert.ok(Math.abs(s.elapsed - start - remaining * (absent ? 8 : 4)) < .04);
    if (!absent) assert.ok(s.departure.people.filter(p => p.role === 'technician').every(p => p.serviceAccepted));
    pilotMI08(s); assert.equal(s.status, 'won'); terminalCounts(s);
  }
});

test('origin contacts and Mara travel precede presence at the quay and never grant a destination consent', () => {
  const s = pilotMI08(create(), { stopAt: g => g.departure.origins[0].progress > .45 });
  const group = s.departure.people.filter(p => p.sourceGroup === 'mi05-passengers');
  assert.ok(group.every(p => p.phase === 'origin' && !p.met && !p.consent));
  advance(s, 4, { move: -1 }); assert.equal(s.departure.origins[0].progress, 0);
  pilotMI08(s, { stopAt: g => g.departure.origins[0].resolved });
  assert.ok(group.every(p => p.met && p.phase === 'joining' && !p.consent && p.destination === 'unselected'));
  const firstX = group[0].x; advance(s, 1, { brace: true }); assert.ok(group[0].x > firstX + 40);
  pilotMI08(s, { stopAt: g => g.campaign.maraContacted });
  const mara = s.departure.people.find(p => p.role === 'mara');
  assert.equal(mara.phase, 'joining'); assert.ok(mara.x < s.departure.quay.x); assert.equal(mara.consent, false);
  assert.equal(s.campaign.peopleArrived, 0); assert.equal(s.campaign.peopleDeparted, 0);
});

test('all three choices leave physical gates, capacities and people unchanged until later operations', () => {
  const base = pilotMI08(create(), { stopAt: g => g.decision.active });
  for (const choice of ['obey', 'delay', 'defy']) {
    const s = structuredClone(base), opening = s.departure.locks.map(g => g.opening), people = structuredClone(s.departure.people), boats = structuredClone(s.departure.boats), time = s.elapsed;
    assert.equal(commandGame(s, 'choice', choice), true); assert.equal(s.elapsed, time);
    assert.deepEqual(s.departure.locks.map(g => g.opening), opening); assert.deepEqual(s.departure.people, people); assert.deepEqual(s.departure.boats, boats);
    assert.equal(s.departure.boarding.ordered, false); assert.equal(s.campaign.peopleArrived, 0); assert.equal(s.campaign.reportTransmitted, false);
    assert.equal(s.campaign.plan, { obey: 'close', delay: 'window', defy: 'open' }[choice]);
  }
});

test('destination agreements are interruptible, reserve actual seats and stretchers, and load neither people nor boats instantly', () => {
  const s = pilotMI08(create(), { stopAt: g => g.departure.boarding.progress > .15 && !g.departure.boarding.assigned });
  const nonTechnicians = s.departure.people.filter(p => p.role !== 'technician');
  assert.ok(nonTechnicians.every(p => !p.consent && p.boatId === null));
  advance(s, 4, { move: Math.sign(s.player.x - s.departure.quay.x) }); assert.equal(s.departure.boarding.progress, 0); assert.equal(s.departure.boarding.assigned, false);
  pilotMI08(s, { stopAt: g => g.departure.boarding.assigned });
  assert.ok(nonTechnicians.every(p => p.consent)); assert.equal(s.campaign.peopleAboard, 0); assert.equal(s.campaign.peopleDeparted, 0);
  for (const boat of s.departure.boats) {
    const members = nonTechnicians.filter(p => p.boatId === boat.id), patients = members.filter(p => p.role === 'patient');
    assert.ok(members.filter(p => !['crew', 'harbourmaster', 'patient'].includes(p.role)).length <= boat.seatCapacity);
    assert.ok(members.filter(p => ['crew', 'harbourmaster'].includes(p.role)).length <= boat.crewCapacity);
    assert.ok(patients.length <= boat.stretcherCapacity); assert.ok(!patients.length || members.some(p => ['staff', 'mara'].includes(p.role)));
    assert.ok(members.every(p => p.phase === 'boarding')); assert.equal(boat.x, s.mission.departure.boatXs[s.departure.boats.indexOf(boat)]);
  }
  assert.equal(nonTechnicians.filter(p => p.destination === 'refuge').length, 34);
});

test('boarding, movement, departure, docking and individual arrival are distinct and the passage waits for a real current window', () => {
  const { game: s, campaign } = fromHistory();
  let loaded = false, held = false, departedBeforeArrival = false, dockedBeforePeople = false, firstLanding = null;
  pilotMI08(s, { observe: g => {
    const d = g.departure;
    const [rear, front] = [...d.boats].sort((a, b) => a.x - b.x);
    assert.ok(front.x - rear.x - (rear.w + front.w) / 2 >= 32 - 1e-8, 'active hulls retain a physical gap, including their distinct destination berths');
    loaded ||= g.campaign.peopleAboard > 0 && g.campaign.peopleAtQuay > 0 && !g.campaign.peopleDeparted;
    held ||= d.boats.some((b, i) => b.x > g.mission.departure.boatXs[i] && b.phase === 'crossing' && !b.moving && !b.departed && !departureWindow(g, b));
    departedBeforeArrival ||= g.campaign.peopleDeparted > 0 && g.campaign.peopleArrived === 0;
    dockedBeforePeople ||= g.campaign.boatsArrived > 0 && d.people.some(p => p.phase === 'landing');
    if (!firstLanding && d.people.some(p => p.phase === 'landing')) firstLanding = structuredClone(g);
  } });
  assert.equal(s.status, 'won'); assert.ok(loaded && held && departedBeforeArrival && dockedBeforePeople);
  assert.ok(firstLanding.departure.boats.filter(b => b.arrived).every(b => !b.moving));
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(checkpointCampaign(campaign, firstLanding)))), firstLanding);
  assert.ok(s.departure.people.filter(p => p.phase === 'arrived').every(p => p.x === s.departure.refuge.x));
  assert.ok(s.departure.boats.every((b, i) => b.arrived && b.departed && b.x === s.mission.departure.refugeDockXs[i]));
});

test('mechanism damage freezes a partially reached opening; separate emergency work reduces inflow without repairing the gate', () => {
  const s = pilotMI08(create(), { stopAt: g => g.departure.locks[0].working && g.departure.locks[0].opening < .6 });
  const gate = s.departure.locks[0], opening = gate.opening; impact(s, gate.mechanism);
  assert.equal(gate.mechanism.destroyed, true); assert.equal(gate.destroyed, false); assert.equal(gate.opening, opening); assert.equal(gate.working, false);
  pilotMI08(s, { stopAt: g => g.departure.locks[0].sealProgress > .5 });
  assert.equal(gate.sealed, false); updateGame(s, 1 / 60, { brace: false });
  assert.equal(gate.sealProgress, 0); assert.equal(gate.sealWorking, false); assert.equal(gate.opening, opening);
  pilotMI08(s); assert.equal(s.status, 'won'); assert.equal(gate.sealed, true); assert.equal(gate.mechanism.hp, 0);
  assert.equal(gate.opening, opening); assert.equal(s.campaign.execution, 'damaged'); assert.equal(s.campaign.peopleLost, 0);
});

test('a passage blocked partway returns loaded boats and living people physically to the local reception', () => {
  const s = pilotMI08(create(), { stopAt: g => g.decision.active }); commandGame(s, 'choice', 'delay');
  walkTo(s, s.departure.locks[1].controlX - 110); commandGame(s, 'interact');
  advance(s, .45, { brace: true });
  const gate = s.departure.locks[1], opening = gate.opening; assert.ok(opening > .65 && opening < .85);
  impact(s, gate.mechanism); assert.equal(gate.opening, opening); assert.equal(gate.mechanism.destroyed, true);
  pilotMI08(s, { stopAt: g => g.departure.boarding.assigned }); advance(s, 65, { brace: true });
  assert.ok(s.departure.boats.some((b, i) => b.x > s.mission.departure.boatXs[i] + 50));
  let returningBoat = false, returningPerson = false;
  pilotMI08(s, { observe: g => { returningBoat ||= g.departure.boats.some(b => b.returning); returningPerson ||= g.departure.people.some(p => p.phase === 'returning' && p.role !== 'technician'); } });
  assert.equal(s.status, 'won'); assert.ok(returningBoat && returningPerson); assert.equal(s.departure.boarding.recallOrdered, true);
  assert.equal(s.campaign.peopleArrived, 0); assert.equal(s.campaign.peopleLocal, 36); assert.equal(s.campaign.peopleLost, 0);
  assert.equal(s.campaign.execution, 'damaged'); terminalCounts(s);
});

test('both real gate bodies can be destroyed without an impossible objective or a fictitious repaired leaf', () => {
  for (const index of [0, 1]) {
    const s = pilotMI08(create(), { stopAt: g => g.departure.technical.resolved });
    const gate = s.departure.locks[index]; impact(s, gate);
    assert.equal(gate.destroyed, true); assert.equal(gate.mechanism.destroyed, true); assert.equal(gate.opening, 1);
    pilotMI08(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.execution, 'damaged'); assert.equal(gate.hp, 0);
    if (!index) assert.equal(gate.sealed, true);
    assert.equal(s.campaign.peopleLost, 0); terminalCounts(s);
  }
});

test('public destructive variants keep capacities, operators, local refuge and copied sources truthful', () => {
  const variants = [{ destroyRamp: true }, { destroyRamp: 2 }, { destroyIntake: true }, { destroyPassage: true },
    { destroyBoats: true }, { destroyRegistry: true }, { destroyRefugeRadio: true }, { killTechnicians: true }, { killHarbourmaster: true }, { killMara: true }];
  for (const options of variants) {
    const s = pilotMI08(create(), options); assert.equal(s.status, 'won', JSON.stringify(options)); terminalCounts(s);
    assert.equal(s.campaign.reportTransmitted, true); assert.equal(s.stats.evidence, 0);
    if (options.destroyBoats) { assert.equal(s.campaign.boatsLost, 2); assert.equal(s.campaign.peopleLocal, 36); assert.equal(s.campaign.peopleDeparted, 0); }
    if (options.destroyRegistry) { assert.equal(s.campaign.registryCopied, false); assert.equal(s.campaign.forcedContractsVerified, false); }
    if (options.destroyRefugeRadio) { assert.equal(s.campaign.refugeAvailable, false); assert.equal(s.campaign.peopleLocal, 36); }
    if (options.killTechnicians) assert.equal(s.campaign.peopleLost, 2);
    if (options.killHarbourmaster) { assert.equal(s.campaign.peopleLost, 1); assert.equal(s.departure.boats[1].departed, false); assert.equal(s.campaign.peopleArrived, 24); }
    if (options.killMara) { assert.equal(s.campaign.peopleLost, 1); assert.equal(s.campaign.maraDeparted, false); }
  }
});

test('a hull lost during boarding counts only actual occupants; survivors on the ramp have a living route of withdrawal', () => {
  const s = pilotMI08(create(), { stopAt: g => g.departure.people.some(p => p.phase === 'aboard') && g.departure.people.some(p => p.phase === 'boarding') });
  const boat = s.departure.boats.find(b => s.departure.people.some(p => p.boatId === b.id && p.phase === 'aboard'));
  const aboard = s.departure.people.filter(p => p.boatId === boat.id && p.phase === 'aboard').map(p => p.id);
  const ashore = s.departure.people.filter(p => p.boatId === boat.id && p.phase === 'boarding').map(p => p.id);
  assert.ok(aboard.length && ashore.length); impact(s, boat);
  assert.equal(boat.destroyed, true); assert.equal(s.campaign.peopleLost, aboard.length);
  assert.ok(aboard.every(id => !s.departure.people.find(p => p.id === id).alive));
  assert.ok(ashore.every(id => s.departure.people.find(p => p.id === id).alive));
  pilotMI08(s); assert.equal(s.status, 'won'); terminalCounts(s);
  assert.ok(ashore.every(id => s.departure.people.find(p => p.id === id).phase === 'local'));
});

test('late local damage cannot cancel acquired departures, kill offshore people or erase a copied register', () => {
  const s = pilotMI08(create(), { stopAt: g => g.campaign.boatsDeparted === 2 });
  const departed = s.departure.people.filter(p => p.departed).map(p => p.id), hp = s.departure.boats.map(b => b.hp);
  impact(s, s.departure.locks[1].mechanism); impact(s, s.departure.registry);
  for (const boat of s.departure.boats) impact(s, boat);
  assert.deepEqual(s.departure.boats.map(b => b.hp), hp); assert.equal(s.campaign.peopleDeparted, departed.length);
  assert.equal(s.campaign.registryCopied, true); assert.equal(s.campaign.forcedContractsVerified, true);
  pilotMI08(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.peopleArrived, departed.length); assert.equal(s.campaign.peopleLost, 0);
  assert.ok(departed.every(id => s.departure.people.find(p => p.id === id).phase === 'arrived'));
});

test('a refuge confirmation survives later radio loss, whereas an unconfirmed broken radio never invents distant places', () => {
  const s = pilotMI08(create(), { stopAt: g => g.departure.refugeRadio.contacted });
  impact(s, s.departure.refugeRadio); assert.equal(s.campaign.refugeAvailable, true);
  pilotMI08(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.peopleArrived, 34);
  const noContact = pilotMI08(create(), { destroyRefugeRadio: true });
  assert.equal(noContact.campaign.refugeAvailable, false); assert.equal(noContact.campaign.peopleArrived, 0);
});

test('destroying an accepted service member preserves the historical agreement without replacing that person', () => {
  const s = pilotMI08(create(), { stopAt: g => g.campaign.techniciansAssigned === 2 });
  const person = s.departure.people.find(p => p.role === 'technician'), id = person.id;
  impact(s, person); assert.equal(person.alive, false); assert.equal(person.serviceAccepted, true); assert.equal(person.phase, 'lost');
  pilotMI08(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.techniciansAssigned, 2); assert.equal(s.campaign.peopleLost, 1);
  assert.equal(s.departure.people.filter(p => p.id === id).length, 1); assert.equal(s.departure.people.find(p => p.id === id).alive, false);
});

test('absence of all historical passengers and services remains a playable manual scene with only its two new people', () => {
  const empty = { ...context, refugeesPassed: 0, refugeesLost: 12, residentsSafe: 0, residentsLost: 10,
    techniciansAlive: 0, techniciansLost: 2, smugglerVerified: false, bargeCiviliansLost: 4,
    patientsArrived: 0, patientsLost: 4, staffArrived: 0, staffLost: 2, medicalWitnessAvailable: false, medicalWitnessId: null };
  const s = pilotMI08(create({ campaignContext: empty }));
  assert.equal(s.status, 'won'); assert.equal(s.departure.people.length, 2); assert.equal(s.campaign.peopleTotal, 2);
  assert.equal(s.campaign.vannContacted, false); assert.equal(s.departure.boats[0].available, false);
  assert.equal(s.campaign.techniciansAssigned, 0); assert.equal(s.campaign.peopleArrived, 2); terminalCounts(s);
});

test('direct tactile-equivalent interactions have consistent facts before another frame and exact snapshots survive JSON', () => {
  let { game: s, campaign } = fromHistory();
  pilotMI08(s, { stopAt: g => g.decision.resolved && !g.departure.boarding.ordered && Math.abs(g.player.x - g.departure.quay.x) < 150 });
  const time = s.elapsed; assert.equal(commandGame(s, 'interact'), true);
  assert.equal(s.elapsed, time); assert.equal(s.departure.boarding.ordered, true); assert.equal(s.campaign.boardingOrdered, true);
  campaign = checkpointCampaign(campaign, s); const restored = restoreCampaignGame(parseCampaign(serializeCampaign(campaign)));
  assert.deepEqual(restored, s); advance(s, .7, { brace: true }); advance(restored, .7, { brace: true }); assert.deepEqual(s, restored);
  const fresh = fromHistory(), key = fresh.game;
  pilotMI08(key, { stopAt: g => g.campaign.manifestRead && !g.decision.active });
  const elapsed = key.elapsed, basin = key.departure.basin;
  updateGame(key, 1 / 60, { interact: true, brace: true });
  assert.equal(key.decision.active, true); assert.equal(key.elapsed, elapsed + 1 / 60); assert.equal(key.departure.basin, basin);
  assert.deepEqual(key.departure.tide, departureTideAt(key.elapsed));
  assert.equal(key.departure.current, Math.abs(key.departure.tide.flow) + Math.abs(basin - key.departure.tide.level) * .8);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(checkpointCampaign(fresh.campaign, key)))), key);
});

test('partial intake, invitation, ramp, allocation, passage and report work resumes with identical public futures', () => {
  const predicates = [g => g.departure.locks[0].working && g.departure.locks[0].progress > .3,
    g => g.departure.origins[1].working && g.departure.origins[1].progress > .4,
    g => g.departure.ramps[0].working && g.departure.ramps[0].progress > .4,
    g => g.departure.boarding.working && g.departure.boarding.progress > .4,
    g => g.departure.locks[1].working && g.departure.locks[1].progress > .4,
    g => g.departure.report.working && g.departure.report.progress > .4];
  const s = create();
  for (const stopAt of predicates) {
    pilotMI08(s, { stopAt }); assert.ok(stopAt(s));
    const restored = JSON.parse(JSON.stringify(s));
    advance(s, .2, { brace: true }); advance(restored, .2, { brace: true }); assert.deepEqual(s, restored);
    const future = structuredClone(s); pilotMI08(future); pilotMI08(restored); assert.deepEqual(future, restored); assert.equal(future.status, 'won');
  }
  pilotMI08(s); assert.equal(s.status, 'won');
});

test('a completed material outcome still requires a timed report and actual extraction; report prose follows observed losses', () => {
  const s = pilotMI08(create(), { choice: 'obey', stopAt: g => g.campaign.peopleLocal === 36 && g.campaign.closureCompleted && !g.departure.report.working });
  assert.equal(s.campaign.reportTransmitted, false); assert.equal(s.extraction.active, false);
  walkTo(s, s.extraction.x); assert.equal(s.status, 'playing');
  pilotMI08(s, { choice: 'obey', stopAt: g => g.departure.report.progress > .4 });
  assert.equal(s.campaign.reportTransmitted, false); advance(s, 4, { move: -1 }); assert.equal(s.departure.report.progress, 0);
  pilotMI08(s, { choice: 'obey', stopAt: g => g.campaign.reportTransmitted });
  assert.equal(s.status, 'playing'); assert.equal(s.extraction.active, true); assert.equal(s.campaign.reportFiled, false);
  assert.match(departureDecisionBody(s), /36 à l’accueil local/); assert.equal(s.decision.body, departureDecisionBody(s));
  pilotMI08(s, { choice: 'obey' }); assert.equal(s.status, 'won');
});

test('enemy projectiles use the same physical objects and exposed people, without reaching people still inside origin shelters', () => {
  const s = create(), registry = s.departure.registry, patient = s.departure.people.find(p => p.role === 'patient');
  impact(s, registry, { team: 'enemy', damage: 20 });
  assert.equal(registry.hp, registry.maxHp - 20 * s.difficulty.damage);
  impact(s, patient, { team: 'enemy' }); assert.equal(patient.hp, patient.maxHp); assert.equal(patient.phase, 'origin');
  pilotMI08(s, { stopAt: g => g.departure.origins[0].resolved });
  const exposed = s.departure.people.filter(p => p.sourceGroup === 'mi05-passengers').at(-1);
  assert.equal(exposed.phase, 'joining'); impact(s, exposed, { team: 'enemy' });
  assert.equal(exposed.alive, false); assert.equal(exposed.phase, 'lost'); assert.equal(s.campaign.peopleLost, 1);
  pilotMI08(s); assert.equal(s.status, 'won'); terminalCounts(s);
});

test('sustained measured pressure announces real mechanism wear, and an ordinary public death keeps the terminal scene immutable', () => {
  const s = pilotMI08(create(), { stopAt: g => g.departure.locks[0].opening === 0 });
  const gate = s.departure.locks[0];
  for (let n = 0; n < 100000 && !s.notified['aval-pressure-intake']; n++) updateGame(s, .05, { brace: true });
  assert.equal(s.notified['aval-pressure-intake'], true); assert.ok(gate.fatigue >= 85 && gate.pressure > .34);
  assert.ok(gate.mechanism.hp < gate.mechanism.maxHp); assert.ok(s.events.some(e => e.type === 'pressure'));
  const lost = create();
  for (let n = 0; n < 20000 && lost.status === 'playing'; n++) updateGame(lost, 1 / 60, { move: lost.player.x < 470 ? 1 : 0 });
  assert.equal(lost.status, 'lost'); assert.equal(lost.player.hull, 0); assert.equal(lost.campaign.reportTransmitted, false);
  const frozen = structuredClone(lost); updateGame(lost, .05, { move: 1, fire: true }); assert.deepEqual(lost, frozen);
});

test('the new receipt and captured scenes are deep copies preserving origins, people and individual boat outcomes', () => {
  const s = pilotMI08(create(), { stopAt: g => g.campaign.peopleAboard > 0 });
  const scene = captureMI08Scene(s, { label: 'boarding' }), receipt = departureReceiptRoster(s);
  const sceneBytes = JSON.stringify(scene), receiptBytes = JSON.stringify(receipt);
  pilotMI08(s); assert.equal(s.status, 'won'); assert.equal(JSON.stringify(scene), sceneBytes); assert.equal(JSON.stringify(receipt), receiptBytes);
  assert.equal(receipt.people.length, s.departure.people.length); assert.ok(receipt.people.some(p => p.phase === 'aboard'));
  const final = departureReceiptRoster(s); assert.equal(final.people.filter(p => p.phase === 'arrived').length, 34);
  assert.ok(final.boats.every(b => b.departed && b.arrived && !b.destroyed));
});

function withRenderer(callback) {
  const oldWindow = globalThis.window, oldImage = globalThis.Image;
  globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
  const gradient = () => ({ addColorStop() {} }), ctx = new Proxy({ createLinearGradient: gradient, createRadialGradient: gradient, measureText: () => ({ width: 0 }) }, { get: (o, k) => k in o ? o[k] : () => {} });
  try { callback(new Renderer({ width: 1600, height: 900, getContext: () => ctx })); }
  finally { globalThis.window = oldWindow; globalThis.Image = oldImage; }
}

test('announced controls are absent from collisions and drawing until their twelve simulated seconds elapse', () => {
  const s = pilotMI08(create(), { stopAt: g => g.decision.active }); commandGame(s, 'choice', 'defy');
  const drones = s.enemies.filter(e => e.id.startsWith('aval-control-drone-'));
  for (const drone of drones) impact(s, drone);
  assert.ok(drones.every(d => !d.dead && d.hp === d.maxHp && !d.active));
  withRenderer(renderer => {
    renderer.visible = () => true; const drawn = []; renderer.drawEnemy = e => drawn.push(e.id);
    renderer.render(s, { shake: false }); assert.ok(!drawn.some(id => id.startsWith('aval-control-drone-')));
    advance(s, 11, { brace: true }); assert.equal(s.departure.alert.triggered, false);
    advance(s, 1.1, { brace: true }); assert.equal(s.departure.alert.triggered, true);
    renderer.render(s, { shake: false }); assert.ok(drawn.includes('aval-control-drone-1') && drawn.includes('aval-control-drone-2'));
  });
});

test('production drawing reads gate, boat, people and foot authority without mutating captured scenes or duplicating the HTML instrument', () => {
  const scenes = [create(), pilotMI08(create(), { stopAt: g => g.departure.boarding.progress > .4 }),
    pilotMI08(create(), { stopAt: g => g.campaign.boatsDeparted > 0 }), pilotMI08(create(), { destroyPassage: true, stopAt: g => g.departure.boarding.recallOrdered })];
  withRenderer(renderer => {
    let instrument = 0; const draw = renderer.drawDepartureInstrument.bind(renderer); renderer.drawDepartureInstrument = s => { instrument++; draw(s); };
    for (const s of scenes) { const before = JSON.stringify(s); renderer.render(s, { shake: false, departureInstrument: false }); assert.equal(JSON.stringify(s), before); }
    assert.equal(instrument, 0); renderer.render(scenes[0], { shake: false }); assert.equal(instrument, 1);
  });
});
