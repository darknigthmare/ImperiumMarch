import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, ALL_MISSIONS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, chemicalSurfaceAt, chemicalReceiptRoster } from '../src/simulation.mjs';
import { pilotMI10, captureMI10Scene, moveMI10, fireAtMI10 } from './helpers/mi10-driver.mjs';

const create = (walkerId = 'WK01', options = {}) => createGame({ missionId: 'MI10', walkerId, difficulty: 'normal', seed: 1010, ...options });
const idle = (s, seconds, input = {}) => {
  for (let i = 0; i < Math.ceil(seconds * 60) && s.status === 'playing' && !s.decision.active; i++) updateGame(s, 1 / 60, { brace: true, ...input });
  return s;
};
const close = (a, b, label = 'numeric equality') => assert.ok(Math.abs(a - b) < 1e-6, `${label}: ${a} versus ${b}`);

function massBalance(s) {
  const d = s.chemical, initial = d.tanks.reduce((total, tank) => total + tank.initialVolume, 0);
  const stock = d.tanks.reduce((total, tank) => total + tank.volume, 0);
  const released = d.spill.pendingMass + d.plumes.reduce((total, plume) => total + plume.mass, 0);
  close(stock + d.sampler.volumeCollected + released, initial, 'conserved material');
  close(released, d.spill.totalReleased, 'released material');
  for (const [index, canal] of d.canals.entries()) close(canal.contamination,
    d.plumes.reduce((total, plume) => total + plume.deposits[index], 0), 'historical canal exposure');
  for (const plume of d.plumes) {
    assert.ok(plume.mass > 0); assert.ok(plume.x >= d.tanks.find(tank => tank.id === plume.sourceId).x);
    for (const deposit of plume.deposits) assert.ok(deposit === 0 || deposit === plume.mass);
    assert.equal(plume.arrivedAt === null, plume.phase === 'flowing');
  }
}

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI10 ${walker.id}/${choice}: physical works, defended sample and extraction through public controls`, t => {
  const s = create(walker.id);
  let raisedContact = false, travelling = false, duringSample = false, checkpoints = 0;
  pilotMI10(s, { choice, observe: (state, frame) => {
    raisedContact ||= state.player.feet.some(foot => foot.contact && chemicalSurfaceAt(state, foot.x).rise === 10
      && Math.abs(foot.y - chemicalSurfaceAt(state, foot.x).groundY) < .001);
    travelling ||= state.chemical.plumes.some(plume => plume.phase === 'flowing' && plume.x > 2200 && plume.x < 2900);
    duringSample ||= state.chemical.sampler.progress > .1 && state.chemical.sampler.progress < .9 && state.chemical.alert.ready;
    if (frame % 180 === 0) { massBalance(state); checkpoints++; }
  } });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.phase, 'complete');
  assert.equal(s.campaign.plan, choice === 'obey' ? 'demolish' : 'secure');
  assert.equal(s.campaign.tanksDestroyed, choice === 'obey' ? 3 : 0);
  assert.equal(s.campaign.tanksSecured, choice === 'defy' ? 3 : 0);
  assert.equal(s.campaign.tanksInspected, 3); assert.equal(s.campaign.copiedMarks, 3);
  assert.equal(s.campaign.sampleCollected, true); assert.equal(s.campaign.sampleLost, false);
  assert.equal(s.campaign.pt02Acquired, true); assert.equal(s.stats.evidence, 1); assert.equal(s.evidence.collected, true);
  assert.equal(s.campaign.privateNeutralized, 3); assert.equal(s.campaign.canalsIntact, 2); assert.equal(s.campaign.canalsCovered, 2);
  assert.equal(s.campaign.canalsPolluted, 0); assert.equal(s.campaign.homesHabitable, 2); assert.equal(s.campaign.villageHabitable, true);
  assert.equal(s.campaign.waterRestored, true); assert.equal(s.campaign.reportTransmitted, true);
  assert.equal(s.campaign.flowResolved, true); assert.equal(s.campaign.spillDelivered, 0);
  assert.ok(s.chemical.sampler.collectedAt - s.chemical.sampler.startedAt >= 20 - 1e-6);
  assert.ok(s.chemical.alert.readyAt - s.chemical.alert.triggeredAt >= 5 - 1e-6);
  for (const tank of s.chemical.tanks) assert.ok(tank.inspectedAt >= 3);
  assert.ok(raisedContact); assert.ok(travelling); assert.ok(duringSample); assert.ok(checkpoints > 50);
  assert.ok(s.stats.steps > 50); assert.ok(s.stats.shots > 0); massBalance(s);
  t.diagnostic(JSON.stringify({ scenario: 'MI10 public controls', walkerId: walker.id, choice,
    status: s.status, elapsed: s.elapsed, materialCheckpoints: checkpoints,
    raisedContact, travelling, duringSample, sampleSeconds: s.chemical.sampler.collectedAt - s.chemical.sampler.startedAt,
    facts: s.campaign, canalHealth: s.chemical.canals.map(canal => canal.hp) }));
});

test('MI10 adds its domain only to MI10 and inherits only the established route context', () => {
  for (const mission of ALL_MISSIONS.filter(mission => mission.id !== 'MI10')) assert.equal(Object.hasOwn(createGame({ missionId: mission.id }), 'chemical'), false);
  const context = { routeRecorded: true, routeChoice: 'defy', routeApproach: 'guided', routePassagePreserved: true, routeHarvestFragile: false };
  const s = create('WK01', { campaignContext: { ...context, peopleArrived: 800, migratorsArrived: 4, pt02Acquired: true } });
  assert.deepEqual(s.campaign.context, context); assert.equal(s.civilians.length, 0);
  assert.equal(Object.hasOwn(s.chemical, 'people'), false); assert.equal(Object.hasOwn(s.chemical, 'migrators'), false);
  assert.equal(s.campaign.pt02Acquired, false); assert.equal(s.campaign.sampleStarted, false);
  assert.deepEqual(s.chemical.tanks.map(tank => tank.role), ['carrier', 'binder', 'active']); massBalance(s);
});

test('MI10 collector requires real anchoring and elapsed work; only guided MI09 shortens it', () => {
  for (const approach of ['unprepared', 'guided']) {
    const s = create('WK01', { campaignContext: { routeApproach: approach } });
    moveMI10(s, 430); idle(s, 1);
    updateGame(s, 1 / 60, {}); assert.equal(commandGame(s, 'interact'), false);
    idle(s, .5); assert.equal(commandGame(s, 'interact'), true);
    assert.equal(s.chemical.collector.progress, 0); assert.equal(s.chemical.collector.closed, false);
    const started = s.elapsed, snapshot = structuredClone(s);
    updateGame(s, 0, { brace: true }); assert.deepEqual(s, snapshot);
    idle(s, approach === 'guided' ? 2.8 : 4.8); assert.equal(s.chemical.collector.closed, false);
    idle(s, .3); assert.equal(s.chemical.collector.closed, true);
    close(s.chemical.collector.closedAt - started, approach === 'guided' ? 3 : 5);
  }
});

test('MI10 all six chassis can cover a canal from upstream before any foot loads it', () => {
  for (const walker of WALKERS) {
    const s = create(walker.id); moveMI10(s, 3070); idle(s, 2);
    const canal = s.chemical.canals[0];
    assert.ok(s.player.feet.every(foot => foot.x < canal.x - canal.w / 2), walker.id);
    assert.equal(canal.hp, canal.maxHp); assert.equal(commandGame(s, 'interact'), true);
    idle(s, 4.1); assert.equal(canal.covered, true); assert.equal(canal.hp, canal.maxHp);
    let contact = false;
    moveMI10(s, 3530, { observe: state => { contact ||= state.player.feet.some(foot => foot.contact && chemicalSurfaceAt(state, foot.x).canalId === canal.id && Math.abs(foot.y - chemicalSurfaceAt(state, foot.x).groundY) < .001); } });
    assert.ok(contact, walker.id); assert.equal(canal.hp, canal.maxHp);
  }
});

test('MI10 uncovered canals take damage from real foot contact; later covers do not heal it', () => {
  const s = create('WK09'); moveMI10(s, 3530); idle(s, 1);
  const canal = s.chemical.canals[0], damaged = canal.hp;
  assert.ok(damaged < canal.maxHp); assert.ok(canal.lastStep > 0);
  moveMI10(s, 3180); idle(s, 2); assert.equal(commandGame(s, 'interact'), true); idle(s, 4.1);
  assert.equal(canal.covered, true); assert.ok(canal.hp <= damaged);
});

test('MI10 private forces have no presence or damage before an actual site event and its delay', () => {
  const s = create(); moveMI10(s, 3150); idle(s, 2);
  const enemy = s.enemies[0], before = s.enemies.map(unit => unit.hp);
  idle(s, 6, { fire: true, aimX: enemy.x, aimY: enemy.y });
  assert.deepEqual(s.enemies.map(unit => unit.hp), before);
  assert.equal(s.chemical.alert.triggered, false); assert.ok(s.enemies.every(unit => !unit.active && !unit.dead));
  const normal = create(); pilotMI10(normal, { stopAt: state => state.chemical.sampler.started });
  assert.equal(normal.chemical.alert.reason, 'sample'); assert.equal(normal.chemical.alert.ready, false);
  idle(normal, 4.8); assert.ok(normal.enemies.every(unit => !unit.active));
  idle(normal, .3); assert.equal(normal.chemical.alert.ready, true); assert.ok(normal.enemies.some(unit => unit.active));
});

test('MI10 choice can precede collection, pauses exactly and performs no tank or water operation', () => {
  const s = create(); pilotMI10(s, { stopAt: state => state.campaign.manifestRead });
  assert.equal(s.campaign.sampleCollected, false); assert.equal(s.campaign.pt02Acquired, false);
  moveMI10(s, s.chemical.orders.x - 70); idle(s, 1); assert.equal(commandGame(s, 'interact'), true);
  assert.equal(s.decision.active, true); const paused = structuredClone(s), material = chemicalReceiptRoster(s);
  updateGame(s, 100, { fire: true, move: 1, interact: true }); assert.deepEqual(s, paused);
  assert.equal(commandGame(s, 'choice', 'delay'), false); assert.equal(commandGame(s, 'choice', 'obey'), true);
  assert.deepEqual(chemicalReceiptRoster(s), material); assert.equal(s.campaign.operationsResolved, false);
  assert.equal(s.campaign.plan, 'demolish'); pilotMI10(s, { choice: 'obey' }); assert.equal(s.status, 'won');
});

test('MI10 sample progress is interrupted outside its zone and needs a new real start', () => {
  const s = create(); pilotMI10(s, { stopAt: state => state.chemical.sampler.progress > .03 });
  const first = s.chemical.sampler.firstStartedAt;
  moveMI10(s, 1460); idle(s, .2);
  assert.equal(s.chemical.sampler.working, false); assert.equal(s.chemical.sampler.progress, 0);
  assert.equal(s.chemical.sampler.collected, false); assert.equal(s.chemical.sampler.firstStartedAt, first);
  assert.equal(s.campaign.pt02Acquired, false); massBalance(s);
  pilotMI10(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.sampleCollected, true);
  assert.ok(s.chemical.sampler.startedAt > first);
  assert.ok(s.chemical.sampler.collectedAt - s.chemical.sampler.startedAt >= 20 - 1e-6);
});

test('MI10 opening a decision through an input frame keeps chemical positions at the saved clock', () => {
  const s = create(); pilotMI10(s, { skipCollector: true, stopAt: state => state.campaign.manifestRead });
  moveMI10(s, s.chemical.orders.x - 60); idle(s, 1);
  assert.ok(s.chemical.plumes.some(plume => plume.phase === 'flowing'));
  updateGame(s, 1 / 60, { brace: true, interact: true }); assert.equal(s.decision.active, true);
  for (const plume of s.chemical.plumes.filter(plume => plume.phase === 'flowing')) {
    const source = s.chemical.tanks.find(tank => tank.id === plume.sourceId);
    close(plume.x, source.x + s.mission.chemical.flowSpeed * (s.elapsed - plume.releasedAt), 'flow aligned with paused clock');
  }
  massBalance(s); const paused = structuredClone(s);
  updateGame(s, 1 / 60, { interact: true, move: 1, fire: true }); assert.deepEqual(s, paused);
});

test('MI10 source destruction before collection records failed sampling with no invented material proof', () => {
  const s = create(); pilotMI10(s, { destroySourceBeforeSample: true });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.sampleCollected, false); assert.equal(s.campaign.sampleLost, true);
  assert.equal(s.chemical.sampler.started, false); assert.equal(s.chemical.sampler.volumeCollected, 0);
  assert.equal(s.campaign.pt02Acquired, false); assert.equal(s.stats.evidence, 0); assert.equal(s.campaign.privateNeutralized, 3);
  assert.ok(s.chemical.sampler.lostAt !== null); massBalance(s);
});

test('MI10 destroying an active sampler loses the in-progress sample irreversibly', () => {
  const s = create(); pilotMI10(s, { destroySamplerDuringSample: true });
  assert.equal(s.status, 'won'); assert.equal(s.chemical.sampler.started, true); assert.equal(s.chemical.sampler.destroyed, true);
  assert.equal(s.campaign.sampleLost, true); assert.equal(s.campaign.sampleCollected, false);
  assert.equal(s.chemical.sampler.volumeCollected, 0); assert.equal(s.campaign.pt02Acquired, false); massBalance(s);
});

test('MI10 source exhaustion is a physical loss even when the reservoir shell survives', () => {
  const s = create(); idle(s, 202);
  assert.equal(s.chemical.tanks[2].destroyed, false); close(s.chemical.tanks[2].volume, 0);
  assert.equal(s.campaign.sampleLost, true); assert.equal(s.chemical.alert.reason, 'source-loss');
  assert.equal(s.campaign.pt02Acquired, false); assert.equal(s.campaign.leakStopped, true); massBalance(s);
});

test('MI10 a copied material registry is required; inspecting ruins never creates it', () => {
  const s = create(); pilotMI10(s, { destroyRecordBeforeCopy: true });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.orisonRecordInspected, true); assert.equal(s.campaign.orisonRecordCopied, false);
  assert.equal(s.campaign.sampleCollected, true); assert.equal(s.campaign.copiedMarks, 3); assert.equal(s.campaign.pt02Acquired, false);
  assert.equal(s.chemical.record.copiedAt, null); massBalance(s);
});

test('MI10 a tank destroyed before identification leaves a missing marking despite sample and registry', () => {
  const s = create(); pilotMI10(s, { stopAt: state => state.chemical.collector.closed });
  fireAtMI10(s, 'chemical-tank-1'); assert.equal(s.chemical.tanks[0].destroyed, true);
  pilotMI10(s);
  assert.equal(s.status, 'won'); assert.equal(s.campaign.tanksInspected, 3); assert.equal(s.campaign.copiedMarks, 2);
  assert.equal(s.campaign.sampleCollected, true); assert.equal(s.campaign.orisonRecordCopied, true);
  assert.equal(s.campaign.pt02Acquired, false); assert.equal(s.chemical.tanks[0].identifiedAt, null); massBalance(s);
});

test('MI10 collected sample and copied provenance survive later destruction of every original', () => {
  const s = create(); pilotMI10(s, { destroyOriginalsAfterSample: true });
  assert.equal(s.status, 'won'); assert.equal(s.chemical.tanks[2].destroyed, true);
  assert.equal(s.chemical.record.destroyed, true); assert.equal(s.chemical.sampler.destroyed, true);
  assert.equal(s.campaign.pt02Acquired, true); assert.equal(s.campaign.sampleLost, false); assert.equal(s.stats.evidence, 1);
  assert.ok(s.chemical.sampler.collectedAt <= s.chemical.sampler.destroyedAt); massBalance(s);
});

test('MI10 an open collector carries real demolition mass through both canals to the village', () => {
  const s = create(); let travelling = false;
  pilotMI10(s, { choice: 'obey', skipCollector: true, observe: state => {
    travelling ||= state.chemical.plumes.some(plume => plume.phase === 'flowing' && plume.passedCanals === 1);
  } });
  assert.equal(s.status, 'won'); assert.ok(travelling); close(s.campaign.spillDelivered, 295);
  assert.equal(s.campaign.spillRetained, 0); assert.equal(s.campaign.canalsPolluted, 2);
  assert.equal(s.campaign.homesHabitable, 0); assert.equal(s.campaign.villageHabitable, false);
  assert.equal(s.campaign.waterRestored, true); assert.equal(s.campaign.pt02Acquired, true);
  for (const canal of s.chemical.canals) close(canal.contamination, 295); massBalance(s);
});

test('MI10 a destroyed canal remains broken and makes both homes unusable after the water operation', () => {
  const s = create(); pilotMI10(s, { destroyCanal: 1 });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.canalsIntact, 1);
  assert.equal(s.chemical.canals[0].hp, 0); assert.equal(s.campaign.waterRestored, false);
  assert.equal(s.campaign.waterDispositionRecorded, true); assert.equal(s.campaign.homesHabitable, 0);
  assert.equal(s.campaign.villageHabitable, false); massBalance(s);
});

test('MI10 a broken collector cannot be closed and delivers the leak without erasing contamination', () => {
  const s = create(); pilotMI10(s, { destroyCollector: true });
  assert.equal(s.status, 'won'); assert.equal(s.chemical.collector.destroyed, true);
  assert.equal(s.chemical.collector.closed, false); assert.equal(s.chemical.collector.closedAt, null);
  assert.equal(s.campaign.spillRetained, 0); assert.ok(s.campaign.spillDelivered > 20);
  assert.equal(s.campaign.canalsPolluted, 2); assert.equal(s.campaign.homesHabitable, 0);
  assert.equal(s.campaign.waterRestored, true); massBalance(s);
});

test('MI10 retained inventory remains in its separate basin after reopening or valve destruction', () => {
  const s = create(); pilotMI10(s, { choice: 'obey', stopAt: state => state.chemical.water.resolved });
  close(s.campaign.spillRetained, 295); assert.equal(s.chemical.collector.closed, false);
  const captured = s.chemical.plumes.filter(plume => plume.phase === 'retained').map(plume => ({ id: plume.id, mass: plume.mass, x: plume.x, arrivedAt: plume.arrivedAt }));
  fireAtMI10(s, 'chemical-collector'); assert.equal(s.chemical.collector.destroyed, true); idle(s, 5);
  assert.deepEqual(s.chemical.plumes.filter(plume => plume.phase === 'retained').map(plume => ({ id: plume.id, mass: plume.mass, x: plume.x, arrivedAt: plume.arrivedAt })), captured);
  close(s.campaign.spillRetained, 295); assert.equal(s.campaign.spillDelivered, 0); massBalance(s);
});

test('MI10 post-report damage creates a new flow and closes extraction until its actual arrival', () => {
  const s = create(); pilotMI10(s, { stopAt: state => state.chemical.report.transmitted });
  const reportTime = s.chemical.report.transmittedAt; assert.equal(s.extraction.active, true);
  fireAtMI10(s, 'chemical-tank-3'); assert.equal(s.campaign.flowResolved, false); assert.equal(s.extraction.active, false);
  assert.equal(s.chemical.report.transmittedAt, reportTime); assert.equal(s.campaign.reportTransmitted, true);
  assert.ok(s.chemical.plumes.some(plume => plume.releasedAt > reportTime && plume.phase === 'flowing'));
  idle(s, 34); assert.equal(s.campaign.flowResolved, true); assert.equal(s.extraction.active, true);
  assert.equal(s.campaign.villageHabitable, false); assert.equal(s.campaign.pt02Acquired, true); massBalance(s);
});

test('MI10 exact JSON continuation preserves active works, sample combat and travelling chemical matter', () => {
  for (const stopAt of [state => state.chemical.collector.progress > .3,
    state => state.chemical.sampler.progress > .45,
    state => state.campaign.tanksDestroyed === 3 && state.campaign.spillInTransit > 50]) {
    const s = create('WK09'); pilotMI10(s, { choice: 'obey', stopAt });
    assert.equal(s.status, 'playing'); const restored = JSON.parse(JSON.stringify(s));
    pilotMI10(s, { choice: 'obey' }); pilotMI10(restored, { choice: 'obey' });
    assert.equal(s.status, 'won'); assert.deepEqual(restored, s); massBalance(restored);
  }
});

test('MI10 captured scenes and receipt rosters are independent immutable snapshots', () => {
  const s = create(); pilotMI10(s, { stopAt: state => state.decision.active });
  const scene = captureMI10Scene(s, { source: 'public simulation commands' }), roster = chemicalReceiptRoster(s);
  const sceneText = JSON.stringify(scene), rosterText = JSON.stringify(roster);
  pilotMI10(s, { choice: 'obey' }); assert.equal(s.status, 'won');
  assert.equal(JSON.stringify(scene), sceneText); assert.equal(JSON.stringify(roster), rosterText);
  assert.equal(scene.state.chemical.tanks[0].destroyed, false); assert.equal(s.chemical.tanks[0].destroyed, true);
  assert.equal(roster.privateForces.length, 3);
});

test('MI10 no-fire defeat is terminal, cannot be revived by inputs and a fresh sortie starts physically clean', () => {
  const s = create(); pilotMI10(s, { noFire: true });
  assert.equal(s.status, 'lost'); assert.equal(s.player.hull, 0); assert.equal(s.campaign.reportTransmitted, false);
  const terminal = structuredClone(s); updateGame(s, 1, { move: 1, interact: true, fire: true }); assert.deepEqual(s, terminal);
  assert.equal(commandGame(s, 'choice', 'defy'), false);
  const fresh = create(); assert.equal(fresh.status, 'playing'); assert.equal(fresh.elapsed, 0);
  assert.equal(fresh.campaign.pt02Acquired, false); assert.equal(fresh.chemical.spill.totalReleased, 0); massBalance(fresh);
});
