import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, terrainAt, networkDecisionBody } from '../src/simulation.mjs';
import { pilotMI03 } from './helpers/mi03-driver.mjs';

function advance(s, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, input);
}

function approachClinic(s) {
  pilotMI03(s, { stopAt: state => state.player.x > 2210 && state.campaign.militaryRelayDisabled });
  assert.equal(s.status, 'playing');
  assert.equal(s.network.stations[1].identified, false);
}

test('MI03 has three real stations, occupied buildings and a dormant fixed observer without PALINODE knowledge', () => {
  const context = { pipeIntact: false, pipeRepaired: true, noticeFiled: true, servicesInterrupted: false,
    railRecordFiled: true, railHostagesRescued: 7, railHostagesLost: 1 };
  const s = createGame({ missionId: 'MI03', campaignContext: context });
  assert.deepEqual(s.campaign.context, context);
  assert.equal(s.network.stations.length, 3);
  assert.equal(s.network.stations.reduce((sum, station) => sum + station.population, 0), 20);
  assert.equal(s.campaign.civilRelaysOnline, 2);
  assert.equal(s.campaign.networkPreserved, false, 'the final decision has not yet been made');
  assert.equal(s.enemies.find(item => item.id === 'holt-observer').active, false);
  assert.equal(s.stats.evidence, 0);
  assert.equal(JSON.stringify(s).includes('PALINODE'), false);
  assert.equal(commandGame(s, 'interact'), false);
  assert.equal(commandGame(s, 'choice', 'defy'), false);
});

test('all six chassis can finish both MI03 choices on normal difficulty without civilian loss through public controls', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const s = createGame({ missionId: 'MI03', walkerId: walker.id, difficulty: 'normal', seed: 1847 });
    pilotMI03(s, { choice });
    assert.equal(s.status, 'won', `${walker.id}/${choice}: ${JSON.stringify(s.objectives)}`);
    assert.equal(s.campaign.signalsIdentified, 3);
    assert.equal(s.campaign.verifiedBuildings, 2);
    assert.equal(s.campaign.militaryRelayDisabled, true);
    assert.equal(s.campaign.residentsLost, 0);
    assert.equal(s.stats.collateral, 0);
    assert.equal(s.campaign.holtAlerted, true);
    assert.equal(s.campaign.reportFiled, choice === 'defy');
    assert.equal(s.campaign.civilRelaysOnline, choice === 'defy' ? 2 : 0);
    assert.equal(s.campaign.networkPreserved, choice === 'defy');
    assert.equal(s.campaign.witnessAvailable, choice === 'defy');
    assert.equal(s.campaign.phase, 'complete');
    assert.equal(s.stats.evidence, 0);
    assert.ok(s.player.reserveAmmo >= 0);
    assert.ok(s.objectives.every(objective => objective.complete));
    const final = structuredClone(s);
    updateGame(s, 0.05, { secondary: true, move: -1 });
    assert.equal(commandGame(s, 'choice', 'obey'), false);
    assert.deepEqual(s, final);
  }
});

test('inspection and military isolation require separate proximity timers and cannot be completed from spawn', () => {
  const s = createGame({ missionId: 'MI03' });
  pilotMI03(s, { stopAt: state => state.network.stations[0].scanning });
  const station = s.network.stations[0];
  assert.equal(station.identified, false);
  advance(s, 0.4, { brace: true });
  assert.ok(station.scanProgress > 0 && station.scanProgress < 1);
  advance(s, 4, { move: -1 });
  assert.equal(station.scanning, false);
  assert.equal(station.scanProgress, 0);
  assert.equal(s.campaign.militaryRelayDisabled, false);
  pilotMI03(s, { stopAt: state => state.network.stations[0].identified });
  assert.equal(station.disabled, false);
  assert.equal(commandGame(s, 'interact'), true);
  advance(s, 0.3, { brace: true });
  assert.ok(station.disableProgress > 0 && station.disableProgress < 1);
  advance(s, 4, { move: -1 });
  assert.equal(station.disableProgress, 0);
  assert.equal(station.disabling, false);
});

test('Holt scrutiny counts actual live civilian verification time and activates a pre-existing drone once', () => {
  const s = createGame({ missionId: 'MI03' });
  const observer = s.enemies.find(item => item.id === 'holt-observer');
  const count = s.enemies.length;
  advance(s, 3, { brace: true });
  assert.equal(s.network.scrutinyElapsed, 0);
  pilotMI03(s, { stopAt: state => state.network.stations[1].identified });
  assert.ok(s.network.scrutinyElapsed >= 4 && s.network.scrutinyElapsed < 4.1);
  assert.equal(observer.active, false);
  assert.equal(s.campaign.holtAlerted, false);
  pilotMI03(s, { stopAt: state => state.campaign.holtAlerted });
  assert.equal(s.network.scrutinyElapsed, 6);
  assert.equal(s.enemies.length, count);
  assert.equal(s.network.scrutinyTriggered, true);
  pilotMI03(s);
  assert.equal(s.status, 'won');
  assert.equal(s.enemies.length, count);
  assert.equal(s.events.filter(event => event.text.startsWith('Holt : « Ces vérifications')).length <= 1, true);
});

test('the observer save slot cannot intercept bullets or receive blast damage before its actual arrival', () => {
  const s = createGame({ missionId: 'MI03', difficulty: 'story' });
  pilotMI03(s, { stopAt: state => state.player.x > 2820 });
  const observer = s.enemies.find(item => item.id === 'holt-observer');
  assert.equal(s.network.scrutinyTriggered, false);
  const hp = observer.hp;
  const before = s.stats.shots;
  advance(s, 3, { brace: true, fire: true, secondary: true, aimX: observer.x, aimY: observer.y });
  advance(s, 1, { brace: true, vent: true });
  assert.ok(s.stats.shots > before, 'real ammunition was fired at the dormant slot');
  assert.equal(observer.hp, hp);
  assert.equal(observer.dead, false);
  assert.equal(observer.active, false);
  assert.equal(s.network.scrutinyTriggered, false);
});

test('real rockets destroy an unverified dispensary; ruins remain inspectable without inventing testimony', () => {
  const s = createGame({ missionId: 'MI03', difficulty: 'story' });
  approachClinic(s);
  const clinic = s.network.stations[1];
  const stock = s.player.rockets;
  advance(s, 2.8, { brace: true, secondary: true, aimX: clinic.x, aimY: clinic.y });
  advance(s, 0.5, { brace: true });
  assert.equal(s.player.rockets, stock - 3);
  assert.equal(clinic.destroyed, true);
  assert.equal(clinic.casualties, 8);
  assert.equal(s.campaign.residentsLost, 8);
  assert.equal(s.stats.collateral, 8);
  pilotMI03(s, { choice: 'defy' });
  assert.equal(s.status, 'won');
  assert.equal(clinic.identified, true);
  assert.equal(clinic.verified, false);
  assert.equal(s.campaign.verifiedBuildings, 1);
  assert.equal(s.campaign.civilRelaysOnline, 1);
  assert.equal(s.campaign.networkPreserved, false);
  assert.equal(s.campaign.witnessAvailable, false);
  assert.equal(s.campaign.dispensaryIntact, false);
  assert.match(s.decision.body, /Une émission civile/);
  assert.match(s.decision.body, /Un seul circuit/);
  assert.match(s.decision.body, /dispensaire est détruit/);
  assert.equal(s.stats.evidence, 0);
});

test('verification protects the ground terminal only; later bullets still cause irreversible human losses', () => {
  const s = createGame({ missionId: 'MI03', difficulty: 'story' });
  pilotMI03(s, { stopAt: state => state.network.stations[1].identified });
  const clinic = s.network.stations[1];
  assert.equal(clinic.secured, true);
  assert.equal(clinic.verified, true);
  const hp = clinic.hp;
  advance(s, 2.5, { brace: true, fire: true, aimX: clinic.x, aimY: clinic.y });
  advance(s, 0.3, { brace: true });
  assert.ok(clinic.hp < hp);
  assert.ok(clinic.casualties > 0);
  const casualties = clinic.casualties;
  pilotMI03(s);
  assert.equal(s.status, 'won');
  assert.equal(clinic.verified, true, 'copied identification is not erased by later damage');
  assert.ok(s.campaign.residentsLost >= casualties);
  assert.equal(s.decision.body, networkDecisionBody(s));
});

test('destroyed civilian sources can be documented without a living voice or an invented control delay', () => {
  const s = createGame({ missionId: 'MI03', difficulty: 'story' });
  approachClinic(s);
  const clinic = s.network.stations[1], homes = s.network.stations[2];
  advance(s, 2.8, { brace: true, secondary: true, aimX: clinic.x, aimY: clinic.y });
  advance(s, 0.5, { brace: true });
  pilotMI03(s, { stopAt: state => state.player.x > 3390 && !homes.identified });
  advance(s, 4.1, { brace: true, secondary: true, aimX: homes.x, aimY: homes.y });
  advance(s, 0.5, { brace: true });
  assert.equal(homes.destroyed, true);
  pilotMI03(s);
  assert.equal(s.status, 'won');
  assert.equal(s.campaign.verifiedBuildings, 0);
  assert.equal(s.campaign.residentsLost, 20);
  assert.equal(s.campaign.civilRelaysOnline, 0);
  assert.equal(s.campaign.witnessAvailable, false);
  assert.equal(s.campaign.holtAlerted, false);
  assert.equal(s.network.scrutinyElapsed, 0);
  assert.match(s.decision.body, /Aucune émission civile/);
  assert.equal(s.stats.evidence, 0);
});

test('destruction after the signed decision still changes the extraction facts and future witness access', () => {
  const s = createGame({ missionId: 'MI03', difficulty: 'story' });
  pilotMI03(s, { stopAt: state => state.decision.active });
  commandGame(s, 'choice', 'defy');
  assert.equal(s.campaign.networkPreserved, true);
  const clinic = s.network.stations[1];
  while (s.player.x > clinic.x + 350) updateGame(s, 1 / 60, { move: -1 });
  advance(s, 2.8, { brace: true, secondary: true, aimX: clinic.x, aimY: clinic.y });
  advance(s, 0.5, { brace: true });
  assert.equal(clinic.destroyed, true);
  assert.equal(clinic.verified, true);
  assert.equal(s.campaign.civilRelaysOnline, 1);
  assert.equal(s.campaign.witnessAvailable, false);
  assert.equal(s.campaign.reportFiled, true);
  pilotMI03(s);
  assert.equal(s.status, 'won');
  assert.equal(s.campaign.networkPreserved, false);
  assert.equal(s.campaign.verifiedBuildings, 2);
  assert.equal(s.decision.body, networkDecisionBody(s));
  assert.match(s.outcome, /1 circuit civil encore alimenté/);
});

test('unsecured terminal damage coincides with a real planted foot, not body proximity', () => {
  const s = createGame({ missionId: 'MI03', walkerId: 'WK10', difficulty: 'story' });
  approachClinic(s);
  const clinic = s.network.stations[1];
  const terminalX = clinic.x + clinic.w / 2 + 30;
  let contactSeen = false;
  for (let frame = 0; frame < 900 && s.player.x < clinic.x + 260; frame++) {
    const before = s.eventId;
    updateGame(s, 1 / 60, { move: 1 });
    if (s.events.some(event => event.id > before && event.text.includes('Le pied a arraché'))) {
      const foot = s.player.feet.find(item => item.contact && Math.abs(item.x - terminalX) < 18);
      assert.ok(foot);
      assert.equal(foot.y, terrainAt(foot.x, s.planetId));
      contactSeen = true; break;
    }
  }
  assert.equal(contactSeen, true);
  assert.equal(clinic.secured, false);
  assert.ok(clinic.hp < clinic.maxHp);
});

test('decision freezes inspection, ammunition, enemy timers and world state until a valid response', () => {
  const s = createGame({ missionId: 'MI03', walkerId: 'WK06' });
  pilotMI03(s, { stopAt: state => state.decision.active });
  assert.equal(s.decision.active, true);
  const snapshot = structuredClone(s);
  advance(s, 3, { move: 1, secondary: true, fire: true, interact: true });
  assert.equal(commandGame(s, 'choice', 'invented'), false);
  assert.deepEqual(s, snapshot);
  assert.equal(commandGame(s, 'choice', 'obey'), true);
  assert.equal(s.campaign.civilRelaysOnline, 0);
  assert.equal(s.campaign.residentsLost, 0, 'electrical interruption does not invent immediate deaths');
});

test('a mid-inspection snapshot resumes with identical inputs, physics, ammunition and consequence facts', () => {
  const initial = createGame({ missionId: 'MI03', walkerId: 'WK02', seed: 926 });
  pilotMI03(initial, { stopAt: state => state.network.stations[2].scanProgress > 0.3 });
  const restored = JSON.parse(JSON.stringify(initial));
  pilotMI03(initial); pilotMI03(restored);
  assert.equal(initial.status, 'won');
  assert.deepEqual(restored, initial);
});
