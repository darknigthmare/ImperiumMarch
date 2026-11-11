import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, MISSIONS, CAMPAIGN_MISSIONS, ALL_MISSIONS } from '../src/content.mjs';
import { createGame, updateGame, commandGame, terrainAt } from '../src/simulation.mjs';

function advance(s, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, input);
}

function pilot(s, { route = 'secured', choice = 'defy', stopAt = null, maxFrames = 24000, followConvoy = true } = {}) {
  const observations = { pipeContact: null, enemyBeforeAmbush: false, waitObserved: false, decisions: 0 };
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) return observations;
    if (s.decision.active) { observations.decisions++; commandGame(s, 'choice', choice); continue; }
    const p = s.player, a = s.campaign;
    if (!s.notified.ambush && s.enemies.some(e => e.active)) observations.enemyBeforeAmbush = true;
    if (s.convoy.waitTime > 0) observations.waitObserved = true;
    let target = s.enemies.filter(e => !e.dead && e.active && Math.abs(e.x - p.x) < 1050)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const secure = route === 'secured' && !a.passageSecured;
    let destination = secure ? s.mission.passage.stationX : !s.evidence.collected ? s.evidence.x : !s.decision.resolved ? s.mission.decisionX : s.extraction.x;
    let move = Math.abs(destination - p.x) > 35 ? Math.sign(destination - p.x) : 0;
    if (secure && Math.abs(p.x - s.mission.passage.stationX) < 70) {
      commandGame(s, 'interact'); move = 0;
    }
    if (target && Math.abs(target.x - p.x) < 680) move = 0;
    if (a.filtersDelivered && !s.evidence.collected && Math.abs(p.x - s.evidence.x) < 190) {
      if (!s.evidence.scanning) commandGame(s, 'interact');
      move = 0;
    }
    if (s.evidence.collected && !s.decision.resolved && Math.abs(p.x - s.mission.decisionX) < 280) {
      commandGame(s, 'interact'); move = 0;
    }
    if (followConvoy && p.x > s.convoy.x + 360 && move > 0 && !s.convoy.arrived) move = 0;
    const vent = p.heat > 75 || p.overheated;
    const wasIntact = a.pipeIntact;
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent,
      secondary: Boolean(target) && !vent && target.hp > 160, aimX: target?.x, aimY: target?.y });
    if (wasIntact && !a.pipeIntact) {
      observations.pipeContact = p.feet.find(f => f.contact && f.x >= s.mission.passage.pipeFrom && f.x <= s.mission.passage.pipeTo);
      assert.ok(observations.pipeContact, 'pipe rupture must coincide with an actual grounded foot');
      assert.equal(observations.pipeContact.y, terrainAt(observations.pipeContact.x, s.planetId));
    }
  }
  return observations;
}

test('MI01 is a separate campaign mission and does not replace the three operations', () => {
  assert.deepEqual(MISSIONS.map(m => m.id), ['op01', 'op02', 'op03']);
  assert.deepEqual(CAMPAIGN_MISSIONS.map(m => m.id), ['MI01', 'MI02', 'MI03', 'MI04', 'MI05', 'MI06', 'MI07', 'MI08', 'MI09', 'MI10', 'MI11']);
  assert.equal(ALL_MISSIONS.length, 14);
  const s = createGame({ missionId: 'MI01' });
  assert.equal(s.missionId, 'MI01');
  assert.equal(s.campaign.missionId, 'MI01');
  assert.equal(s.convoy.cargo, 24);
  assert.ok(s.mission.deliveryX < s.mission.evidenceX && s.mission.evidenceX < s.extraction.x);
  assert.ok([...s.enemies, ...s.civilians, ...s.pickups].every(e => e.x < s.mission.length));
  assert.equal(createGame({ missionId: 'op01' }).campaign, null);
});

test('the opening lets the player learn real appuis without an enemy attack or an overtaking convoy', () => {
  const s = createGame({ missionId: 'MI01', assist: false });
  advance(s, 12);
  assert.equal(s.player.hull, s.player.maxHull);
  assert.equal(s.convoy.hp, s.convoy.maxHp);
  assert.ok(s.convoy.x <= s.player.x - 100);
  assert.ok(s.enemies.every(e => !e.active));
  assert.equal(s.projectiles.length, 0);
  assert.equal(commandGame(s, 'stepA'), true);
  advance(s, 0.9, { move: 1 });
  assert.equal(s.campaign.tutorial.stepped, true);
  assert.equal(commandGame(s, 'stepA'), false);
  assert.equal(commandGame(s, 'stepB'), true);
  advance(s, 1, { move: 1 });
  assert.ok(s.player.x > 350);
  assert.equal(s.campaign.pipeIntact, true);
});

test('plate deployment takes time, requires proximity, and stops the convoy', () => {
  const s = createGame({ missionId: 'MI01' });
  assert.equal(commandGame(s, 'interact'), false);
  while (s.player.x < 780) updateGame(s, 1 / 60, { move: 1 });
  assert.equal(commandGame(s, 'interact'), true);
  const convoyX = s.convoy.x;
  advance(s, 2, { brace: true });
  assert.equal(s.campaign.passageSecured, false);
  assert.ok(s.campaign.passageProgress > 0.4 && s.campaign.passageProgress < 0.5);
  assert.equal(s.convoy.x, convoyX);
  advance(s, 2.6, { brace: true });
  assert.equal(s.campaign.passageSecured, true);
  assert.equal(s.campaign.route, 'secured');
  assert.equal(s.campaign.repairCost, 0);
});

test('leaving a partial deployment cancels it; an airborne foot alone does not damage the pipe', () => {
  const s = createGame({ missionId: 'MI01' });
  while (s.player.x < 780) updateGame(s, 1 / 60, { move: 1 });
  commandGame(s, 'interact'); advance(s, 0.4);
  let sawAirborneOverPipe = false;
  for (let i = 0; i < 900 && s.campaign.pipeIntact; i++) {
    updateGame(s, 1 / 60, { move: 1 });
    if (s.player.feet.some(f => !f.contact && f.x >= s.mission.passage.pipeFrom && f.x <= s.mission.passage.pipeTo)) {
      sawAirborneOverPipe = true;
      if (!s.player.feet.some(f => f.contact && f.x >= s.mission.passage.pipeFrom && f.x <= s.mission.passage.pipeTo)) assert.equal(s.campaign.pipeIntact, true);
    }
  }
  assert.equal(s.campaign.passageSecured, false);
  assert.equal(s.campaign.passageWorking, false);
  assert.equal(s.campaign.passageProgress, 0);
  assert.equal(sawAirborneOverPipe, true);
  assert.equal(s.campaign.pipeIntact, false);
});

test('all six walkers complete both routes and both report choices through public controls', () => {
  for (const w of WALKERS) for (const route of ['secured', 'direct']) for (const choice of ['obey', 'defy']) {
    const s = createGame({ missionId: 'MI01', walkerId: w.id, difficulty: 'normal' });
    const observed = pilot(s, { route, choice });
    const context = `${w.id}/${route}/${choice}`;
    assert.equal(s.status, 'won', `${context}: ${JSON.stringify(s.objectives)}`);
    assert.equal(observed.enemyBeforeAmbush, false);
    assert.equal(observed.decisions, 1);
    assert.equal(s.campaign.phase, 'complete');
    assert.equal(s.campaign.route, route);
    assert.equal(s.campaign.pipeIntact, route === 'secured');
    assert.equal(s.campaign.pipeDamage, route === 'secured' ? 0 : 100);
    assert.equal(s.campaign.repairCost, route === 'secured' ? 0 : 2);
    assert.equal(Boolean(observed.pipeContact), route === 'direct');
    assert.equal(observed.waitObserved, route === 'direct');
    assert.equal(s.campaign.filtersDelivered, true);
    assert.equal(s.campaign.filtersDeliveredCount, 24);
    assert.ok(s.campaign.deliveryTime > 0);
    assert.ok(s.convoy.hp > 0);
    assert.equal(s.campaign.convoyIntegrity, s.convoy.hp / s.convoy.maxHp);
    assert.equal(s.campaign.noticeFiled, choice === 'defy');
    assert.equal(s.stats.evidence, 0, 'a manifest omission is not an authenticated PALINODE proof');
    assert.ok(s.stats.kills > 0, context);
    assert.ok(s.objectives.every(o => o.complete), context);
    const before = structuredClone(s.campaign);
    assert.equal(commandGame(s, 'choice', choice === 'defy' ? 'obey' : 'defy'), false);
    advance(s, 1, { interact: true });
    assert.deepEqual(s.campaign, before, 'finished consequences are immutable');
  }
});

test('a manifest and decision cannot be obtained at spawn or before delivery', () => {
  const s = createGame({ missionId: 'MI01' });
  assert.equal(commandGame(s, 'choice', 'defy'), false);
  advance(s, 3, { interact: true });
  assert.equal(s.evidence.collected, false);
  assert.equal(s.campaign.manifestRead, false);
  assert.equal(s.extraction.active, false);
  pilot(s, { stopAt: state => state.campaign.filtersDelivered });
  assert.equal(s.evidence.collected, false, 'delivery alone does not read the document');
  assert.equal(s.campaign.manifestRead, false);
  assert.equal(s.decision.resolved, false);
  assert.equal(s.extraction.active, false);
});

test('reaching the manifest ahead of Sami does not grant the delivery, document, or decision', () => {
  const s = createGame({ missionId: 'MI01' });
  pilot(s, { followConvoy: false, stopAt: state => Math.abs(state.player.x - state.evidence.x) < 180 });
  assert.equal(s.status, 'playing');
  assert.ok(Math.abs(s.player.x - s.evidence.x) < 230);
  assert.equal(s.campaign.filtersDelivered, false);
  assert.equal(commandGame(s, 'interact'), false);
  advance(s, 3, { brace: true });
  assert.equal(s.campaign.manifestRead, false);
  assert.equal(s.evidence.scanning, false);
  assert.equal(s.decision.active, false);
  assert.equal(s.extraction.active, false);
});

test('a destroyed transport ends the campaign attempt without delivering filters', () => {
  const s = createGame({ missionId: 'MI01' });
  // Isolated damage fixture; successful mission runs above never edit simulation state.
  s.convoy.hp = 0;
  updateGame(s, 1 / 60, { move: 1 });
  assert.equal(s.status, 'lost');
  assert.equal(s.campaign.filtersDelivered, false);
  assert.equal(s.campaign.filtersDeliveredCount, 0);
  assert.equal(s.campaign.convoyIntegrity, 0);
  assert.equal(s.campaign.phase, 'approach');
  assert.match(s.outcome, /camion de Sami est perdu/);
  assert.equal(s.extraction.active, false);
});

test('campaign state round-trips without changing the next deterministic public actions', () => {
  const original = createGame({ missionId: 'MI01', seed: 71 });
  pilot(original, { route: 'direct', stopAt: s => s.campaign.filtersDelivered });
  const restored = JSON.parse(JSON.stringify(original));
  for (const s of [original, restored]) {
    commandGame(s, 'interact'); advance(s, 2.6, { brace: true });
    commandGame(s, 'interact'); commandGame(s, 'choice', 'defy');
    pilot(s, { route: 'direct' });
  }
  assert.deepEqual(restored, original);
  assert.equal(restored.status, 'won');
});
