import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, industrialDecisionBody } from '../src/simulation.mjs';
import { pilotMI04 } from './helpers/mi04-driver.mjs';

export const supportedVesper = { pipeIntact: true, pipeRepaired: false, noticeFiled: true, servicesInterrupted: false,
  railRecordFiled: true, railHostagesRescued: 8, railHostagesLost: 0,
  dispensaryIntact: true, witnessAvailable: true, civilRelaysOnline: 2 };
function create(options = {}) { return createGame({ missionId: 'MI04', campaignContext: supportedVesper, ...options }); }
function advance(s, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, input);
}

// These are full victories obtained only by movement, aiming, interaction and choices.
test('MI04 six chassis finish both decisions with two cooled turbines, a real contact and PT01', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const s = pilotMI04(create({ walkerId: walker.id, difficulty: 'normal', seed: 1847 }), { choice });
    assert.equal(s.status, 'won', `${walker.id}/${choice}: ${JSON.stringify(s.objectives)}`);
    assert.equal(s.campaign.turbinesCooled, 2);
    assert.equal(s.campaign.witnessContacted, true);
    assert.equal(s.campaign.maintenanceInspected, true);
    assert.equal(s.campaign.logRecovered, true);
    assert.equal(s.campaign.technicalEvidence, true);
    assert.equal(s.campaign.evidenceSource, 'PT01');
    assert.equal(s.campaign.reportFiled, choice === 'defy');
    assert.equal(s.campaign.alternativeSourceNeeded, false);
    assert.equal(s.stats.evidence, 1);
    assert.equal(s.stats.collateral, 0);
    assert.ok(s.objectives.every(goal => goal.complete));
    const finished = structuredClone(s);
    updateGame(s, 0.05, { move: -1, secondary: true });
    assert.equal(commandGame(s, 'choice', 'obey'), false);
    assert.deepEqual(s, finished);
  }
});

test('MI04 starts without acquired evidence, an actual testimony or a free decision', () => {
  const s = create();
  assert.deepEqual(s.campaign.context, supportedVesper);
  assert.equal(s.stats.evidence, 0);
  assert.equal(s.campaign.logRecovered, false);
  assert.equal(s.campaign.witnessContacted, false);
  assert.equal(s.industrial.contact.available, true);
  assert.equal(commandGame(s, 'interact'), false);
  assert.equal(commandGame(s, 'choice', 'defy'), false);
  assert.equal(s.extraction.active, false);
});

test('an unrepaired MI01 pipe requires a real five-second portable pump without repairing the inherited world', () => {
  const s = create({ campaignContext: { ...supportedVesper, pipeIntact: false, servicesInterrupted: true } });
  assert.equal(s.industrial.pump.connected, false);
  assert.equal(s.campaign.coolantRestored, false);
  let workTime = 0;
  pilotMI04(s, { stopAt: state => state.campaign.coolantRestored,
    observe: state => { if (state.industrial.pump.working) workTime += 1 / 60; } });
  assert.equal(s.industrial.pump.connected, true);
  assert.ok(workTime > 4.95 && workTime < 5.05, workTime);
  assert.equal(s.campaign.context.servicesInterrupted, true);
  assert.equal(s.campaign.context.pipeRepaired, false);
  assert.equal(s.campaign.turbinesCooled, 0);
  pilotMI04(s);
  assert.equal(s.status, 'won');
});

test('repairing the earlier pipe restores supply at departure and avoids the portable pump action', () => {
  const s = create({ campaignContext: { ...supportedVesper, pipeIntact: false, pipeRepaired: true } });
  assert.equal(s.industrial.pump.connected, true);
  assert.equal(s.industrial.pump.progress, 1);
  assert.equal(s.campaign.coolantRestored, true);
});

test('MI02 rescued workers reduce actual valve time from seven to four seconds', () => {
  const durations = [];
  for (const count of [0, 8]) {
    const s = create({ campaignContext: { ...supportedVesper, railHostagesRescued: count, railHostagesLost: 8 - count } });
    let workTime = 0;
    pilotMI04(s, { stopAt: state => state.campaign.turbinesCooled === 1,
      observe: state => { if (state.industrial.turbines[0].working) workTime += 1 / 60; } });
    assert.equal(s.campaign.coolingAssistance, count > 0);
    assert.ok(Math.abs(workTime - (count ? 4 : 7)) < 0.06, `${count}: ${workTime}`);
    durations.push(workTime);
  }
  assert.ok(durations[0] - durations[1] > 2.9);
});

test('leaving the valve resets incomplete cooling and leaves the turbine hot', () => {
  const s = create();
  pilotMI04(s, { stopAt: state => state.industrial.turbines[0].working });
  advance(s, 0.6, { brace: true });
  assert.ok(s.industrial.turbines[0].progress > 0);
  advance(s, 4, { move: -1 });
  assert.equal(s.industrial.turbines[0].working, false);
  assert.equal(s.industrial.turbines[0].progress, 0);
  assert.equal(s.industrial.turbines[0].temperature, 90);
  assert.equal(s.campaign.turbinesCooled, 0);
  pilotMI04(s);
  assert.equal(s.status, 'won');
});

test('a surviving channel is only an opportunity: deliberately skipping the call records no testimony', () => {
  const s = pilotMI04(create(), { skipContact: true });
  assert.equal(s.status, 'won');
  assert.equal(s.industrial.contact.available, true);
  assert.equal(s.campaign.witnessContacted, false);
  assert.match(industrialDecisionBody(s), /Aucun témoignage/);
  assert.equal(s.campaign.technicalEvidence, true, 'technical proof is independent of this call');
});

test('a lost or cut dispensary channel stays unavailable and does not block the industrial mission', () => {
  for (const context of [{ witnessAvailable: false }, { dispensaryIntact: false }, { civilRelaysOnline: 0 }]) {
    const s = pilotMI04(create({ campaignContext: { ...supportedVesper, ...context } }));
    assert.equal(s.status, 'won');
    assert.equal(s.industrial.contact.available, false);
    assert.equal(s.industrial.contact.contacted, false);
    assert.equal(s.campaign.witnessContacted, false);
    assert.equal(s.campaign.technicalEvidence, true);
  }
});

test('real projectiles can destroy the unscanned post; both choices finish without invented PT01', () => {
  for (const choice of ['obey', 'defy']) {
    const s = pilotMI04(create({ walkerId: 'WK05' }), { choice, destroyPost: true });
    assert.equal(s.status, 'won');
    assert.equal(s.industrial.post.destroyed, true);
    assert.equal(s.campaign.maintenanceInspected, true);
    assert.equal(s.campaign.maintenanceIntact, false);
    assert.equal(s.campaign.logRecovered, false);
    assert.equal(s.campaign.evidenceSource, 'none');
    assert.equal(s.campaign.alternativeSourceNeeded, true);
    assert.equal(s.stats.evidence, 0);
    assert.equal(s.campaign.reportFiled, choice === 'defy');
    assert.ok(s.stats.shots > 0);
    assert.match(industrialDecisionBody(s), /Aucun contenu technique n’est reconstitué/);
  }
});

test('copying the journal preserves PT01 when the post is destroyed before the final decision', () => {
  const s = create({ walkerId: 'WK05' });
  pilotMI04(s, { stopAt: state => state.campaign.logRecovered });
  const post = s.industrial.post;
  assert.equal(s.decision.resolved, false);
  advance(s, 3.2, { brace: true, secondary: true, aimX: post.x, aimY: post.y });
  advance(s, 0.6, { brace: true });
  assert.equal(post.destroyed, true);
  assert.equal(s.campaign.logRecovered, true);
  assert.equal(s.campaign.technicalEvidence, true);
  assert.equal(s.campaign.alternativeSourceNeeded, false);
  pilotMI04(s, { choice: 'obey' });
  assert.equal(s.status, 'won');
  assert.equal(s.campaign.evidenceSource, 'PT01');
  assert.equal(s.campaign.reportFiled, false);
  assert.equal(s.stats.evidence, 1);
});

test('the industrial sequence is deterministic at identical seed and public pilot inputs', () => {
  const a = pilotMI04(create({ walkerId: 'WK10', seed: 901 }));
  const b = pilotMI04(create({ walkerId: 'WK10', seed: 901 }));
  assert.equal(a.status, 'won');
  assert.deepEqual(a, b);
});

test('the private hauler can actually withdraw; escape does not award a destruction or remain an active target', () => {
  const s = create({ walkerId: 'WK05', difficulty: 'story' });
  pilotMI04(s, { allowRetreat: true, stopAt: state => state.campaign.maintenanceInspected });
  const hauler = s.enemies.find(item => item.id === 'private-hauler');
  assert.equal(s.industrial.retreatTriggered, true);
  assert.equal(hauler.dead, false);
  const kills = s.stats.kills;
  for (let frame = 0; frame < 5000 && !s.industrial.retreatEscaped && s.status === 'playing'; frame++)
    updateGame(s, 1 / 60, { brace: true, vent: true });
  assert.equal(s.industrial.retreatEscaped, true);
  assert.equal(hauler.dead, false);
  assert.equal(hauler.active, false);
  assert.equal(hauler.phase, 'withdrawn');
  assert.equal(s.stats.kills, kills);
  pilotMI04(s, { allowRetreat: true });
  assert.equal(s.status, 'won');
});

test('hot turbines add measurable heat, cooled turbines stop radiating, and radiator damage reverses the thermal margin', () => {
  const changes = [];
  for (const damaged of [false, true]) {
    const s = create();
    pilotMI04(s, { stopAt: state => state.industrial.turbines[0].working });
    advance(s, 0.1, { brace: true });
    if (damaged) {
      // Controlled enemy projectile exercises the real local collision before
      // the thermal calibration. This fixture does not fabricate mission progress.
      const p = s.player, x = p.x - p.width / 2 - 76, y = p.y - 2;
      s.projectiles.push({ id: `thermal-${s.entityId++}`, team: 'enemy', type: 'bullet',
        x, y, prevX: x, prevY: y, vx: 600, vy: 0, damage: 100, radius: 2, life: 1, trail: [] });
      advance(s, 0.4, { brace: true });
      assert.equal(s.player.radiator.health, 0);
    }
    assert.equal(s.industrial.turbines[0].cooled, false);
    s.player.heat = 70;
    updateGame(s, 0.05, { brace: true });
    const hot = s.player.heat - 70;
    advance(s, 4.1, { brace: true });
    assert.equal(s.industrial.turbines[0].cooled, true);
    assert.equal(s.industrial.turbines[0].temperature, 25);
    s.player.heat = 70;
    updateGame(s, 0.05, { brace: true });
    const cooled = s.player.heat - 70;
    assert.ok(hot > cooled + 0.49 && hot < cooled + 0.51, 'the hot source adds ten heat per second over the same cooling rule');
    assert.ok(cooled < 0, 'the cooled area permits recovery even with the damaged component');
    changes.push(hot);
  }
  assert.ok(changes[0] < 0, 'a healthy Vigie can absorb the local idle heat');
  assert.ok(changes[1] > 0, 'a damaged Vigie accumulates local heat until it cools the turbine or vents');
});
