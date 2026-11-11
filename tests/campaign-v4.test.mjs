import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALKERS } from '../src/content.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI02 } from './helpers/mi02-driver.mjs';
import { pilotMI03 } from './helpers/mi03-driver.mjs';
import { pilotMI04 } from './helpers/mi04-driver.mjs';
import {
  CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY, CAMPAIGN_SAVE_VERSION,
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  nextCampaignMissionId, beginCampaignMission, checkpointCampaign, restoreCampaignGame,
  finishCampaignMission, campaignRepairCost, serviceCampaignWalker, repairCampaignPipe,
} from '../src/campaign.mjs';

const historical = JSON.parse(readFileSync(new URL('./fixtures/campaign-v3-mi03.json', import.meta.url), 'utf8'));
const historicalTrain = JSON.parse(readFileSync(new URL('./fixtures/campaign-v2-mi02.json', import.meta.url), 'utf8'));
const originalText = JSON.stringify(historical);
const clone = value => JSON.parse(JSON.stringify(value));
const afterNetwork = () => parseCampaign(JSON.stringify(historical.completed));
const freshRadiator = () => ({ health: 100, maxHealth: 100, repairKits: 2, maxRepairKits: 2, repairProgress: 0, repairing: false });

function memoryStorage(primary, backup) {
  const values = new Map();
  if (primary !== undefined) values.set(CAMPAIGN_SAVE_KEY, primary);
  if (backup !== undefined) values.set(CAMPAIGN_BACKUP_KEY, backup);
  return { values, failKey: null,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { if (key === this.failKey) throw new Error('Quota exceeded'); values.set(key, String(value)); },
  };
}

function removeV4Fields(value) {
  const old = clone(value);
  old.version = 3;
  delete old.world.vesper.industrial;
  delete old.world.thyr; delete old.world.nacre; delete old.resources.fuel;
  for (const condition of Object.values(old.fleet)) delete condition.radiator;
  for (const checkpoint of [old.checkpoint, old.preDecisionCheckpoint]) if (checkpoint) delete checkpoint.player.radiator;
  return old;
}

test('authentic c81a360 v3 dossiers gain only documented v4 fields and preserve every historical fact', () => {
  assert.equal(historical.provenance.sourceRevision, 'c81a360c262e63ba01cc6037d0874740d67e3ef6');
  assert.equal(historical.provenance.saveVersion, 3);
  for (const old of [historical.live, historical.completed]) {
    assert.equal(old.version, 3);
    const migrated = parseCampaign(JSON.stringify(old));
    assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
    assert.deepEqual(removeV4Fields(migrated), old);
    for (const condition of Object.values(migrated.fleet)) assert.equal(condition.radiator, 100);
    for (const checkpoint of [migrated.checkpoint, migrated.preDecisionCheckpoint]) if (checkpoint) {
      assert.deepEqual(checkpoint.player.radiator, freshRadiator());
      assert.equal(checkpoint.stats.evidence, 0);
    }
    assert.equal(migrated.world.vesper.industrial.technicalEvidence, false);
    assert.equal(migrated.world.vesper.industrial.witnessContacted, false);
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
  }
  assert.equal(nextCampaignMissionId(afterNetwork()), 'MI04');
  assert.equal(JSON.stringify(historical), originalText);
});

test('v3 reads never write and failed v4 commits preserve both original bytes and recoverable backup', () => {
  const oldText = JSON.stringify(historical.live), storage = memoryStorage(oldText);
  const loaded = readCampaign(storage);
  assert.equal(loaded.blocked, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), oldText);
  assert.equal(restoreCampaignGame(loaded.campaign).decision.active, true);
  storage.failKey = CAMPAIGN_SAVE_KEY;
  assert.equal(writeCampaign(storage, loaded.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), oldText);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), oldText);
  storage.failKey = null;
  assert.equal(writeCampaign(storage, loaded.campaign).ok, true);
  assert.deepEqual(readCampaign(storage).campaign, loaded.campaign);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), oldText);
  const future = JSON.stringify({ ...createCampaign(), version: CAMPAIGN_SAVE_VERSION + 1 });
  const protectedStorage = memoryStorage(future, oldText);
  const protectedRead = readCampaign(protectedStorage);
  assert.equal(protectedRead.blocked, true);
  assert.equal(protectedRead.source, 'backup');
  assert.equal(writeCampaign(protectedStorage, protectedRead.campaign).ok, false);
  assert.equal(protectedStorage.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('old-format imports reject fabricated components and industrial results rather than laundering them', () => {
  for (const change of [
    c => { c.world.vesper.industrial = {}; },
    c => { c.fleet.WK06.radiator = 90; },
    c => { c.checkpoint.player.radiator = freshRadiator(); },
    c => { c.preDecisionCheckpoint.player.radiator = freshRadiator(); },
    c => { c.completed.MI04 = {}; },
    c => { c.activeMissionId = 'MI04'; },
    c => { c.checkpoint.missionId = 'MI04'; },
    c => { c.checkpoint.player.calibration = 'unlimited'; },
    c => { c.futureSystem = true; },
  ]) {
    const invalid = clone(historical.live); change(invalid);
    assert.throws(() => parseCampaign(JSON.stringify(invalid)), /Sauvegarde invalide/);
  }
});

test('v4 imports enforce component health, stock, repair state and exact field schemas', () => {
  const current = parseCampaign(JSON.stringify(historical.live));
  for (const change of [
    c => { c.fleet.WK06.radiator = -1; },
    c => { c.fleet.WK06.radiator = 101; },
    c => { delete c.fleet.WK06.radiator; },
    c => { c.checkpoint.player.radiator.health = 101; },
    c => { c.checkpoint.player.radiator.maxHealth = 200; },
    c => { c.checkpoint.player.radiator.repairKits = 3; },
    c => { c.checkpoint.player.radiator.repairKits = 1.5; },
    c => { c.checkpoint.player.radiator.maxRepairKits = 99; },
    c => { c.checkpoint.player.radiator.repairProgress = 0.5; },
    c => { c.checkpoint.player.radiator.repairing = true; },
    c => { c.checkpoint.player.radiator.repairing = true; c.checkpoint.player.radiator.health = 50; c.checkpoint.player.radiator.repairKits = 0; },
    c => { c.checkpoint.player.radiator.unlimited = true; },
    c => { c.world.vesper.industrial.technicalEvidence = true; },
  ]) {
    const invalid = clone(current); change(invalid);
    assert.throws(() => parseCampaign(JSON.stringify(invalid)), /Sauvegarde invalide/);
  }
});

test('genuine v3 active MI03 resumes through public controls and unlocks MI04 without changing its first reports', () => {
  const loaded = parseCampaign(JSON.stringify(historical.live));
  const game = restoreCampaignGame(loaded);
  assert.equal(game.decision.active, true);
  pilotMI03(game, { choice: 'defy' });
  assert.equal(game.status, 'won');
  const result = finishCampaignMission(loaded, game);
  assert.equal(result.applied, true);
  assert.equal(nextCampaignMissionId(result.campaign), 'MI04');
  assert.deepEqual(result.campaign.completed.MI01, historical.live.completed.MI01);
  assert.deepEqual(result.campaign.completed.MI02, historical.live.completed.MI02);
  assert.equal(result.campaign.world.vesper.industrial.technicalEvidence, false);
  assert.equal(result.campaign.world.vesper.communications.witnessAvailable, true);
});

test('MI04 is gated by all three reports and consumes real pipe, train and dispensary context for every chassis', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI04' }).ok, false);
  assert.equal(beginCampaignMission(parseCampaign(JSON.stringify(historicalTrain.completed)), { missionId: 'MI04' }).ok, false);
  const ready = afterNetwork(), before = serializeCampaign(ready);
  for (const walker of WALKERS) {
    const begun = beginCampaignMission(ready, { missionId: 'MI04', walkerId: walker.id, seed: 1847 });
    assert.equal(begun.ok, true); assert.equal(begun.replay, false);
    assert.deepEqual(begun.game.campaign.context, { pipeIntact: false, pipeRepaired: false, noticeFiled: true,
      servicesInterrupted: true, railRecordFiled: true, railHostagesRescued: 8, railHostagesLost: 0,
      dispensaryIntact: true, witnessAvailable: true, civilRelaysOnline: 2 });
    assert.equal(begun.game.industrial.pump.connected, false);
    assert.equal(begun.game.campaign.coolingAssistance, true);
    assert.equal(begun.game.industrial.contact.available, true);
    assert.equal(begun.game.campaign.witnessContacted, false);
    assert.equal(begun.game.campaign.technicalEvidence, false);
    assert.equal(serviceCampaignWalker(begun.campaign, walker.id).ok, false);
    assert.equal(repairCampaignPipe(begun.campaign).ok, false);
    assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(begun.campaign))), begun.game);
  }
  assert.equal(serializeCampaign(ready), before);
  const repaired = repairCampaignPipe(ready);
  assert.equal(repaired.ok, true);
  const begun = beginCampaignMission(repaired.campaign, { missionId: 'MI04' });
  assert.equal(begun.game.industrial.pump.connected, true);
  assert.equal(begun.game.campaign.context.pipeRepaired, true);
  assert.equal(begun.campaign.resources.parts, ready.resources.parts - 2);
  assert.equal(begun.campaign.completed.MI01.pipeIntact, false);
});

test('field-repair checkpoints retain exact work and kit stock while workshop repairs charge for component wear', () => {
  // This is an explicit workshop-condition fixture, not evidence of a projectile hit.
  const ready = afterNetwork();
  ready.fleet.WK06.radiator = 25;
  assert.equal(campaignRepairCost(ready, 'WK06'), 2);
  const repaired = serviceCampaignWalker(ready, 'WK06');
  assert.equal(repaired.ok, true); assert.equal(repaired.cost, 2);
  assert.equal(repaired.campaign.fleet.WK06.radiator, 100);
  assert.equal(repaired.campaign.resources.parts, ready.resources.parts - 2);
  assert.equal(serviceCampaignWalker(repaired.campaign, 'WK06').ok, false);
  const begun = beginCampaignMission(ready, { missionId: 'MI04', walkerId: 'WK06' });
  const game = begun.game;
  assert.equal(game.player.radiator.health, 25);
  assert.equal(game.player.radiator.repairKits, 2);
  assert.equal(commandGame(game, 'repair'), true);
  for (let frame = 0; frame < 120; frame++) updateGame(game, 1 / 60, { brace: true });
  assert.equal(game.player.radiator.repairing, true);
  assert.ok(game.player.radiator.repairProgress > 0.4 && game.player.radiator.repairProgress < 0.6);
  const saved = parseCampaign(serializeCampaign(checkpointCampaign(begun.campaign, game)));
  const resumed = restoreCampaignGame(saved);
  assert.deepEqual(resumed, clone(game));
  for (let frame = 0; frame < 180; frame++) {
    updateGame(game, 1 / 60, { brace: true }); updateGame(resumed, 1 / 60, { brace: true });
  }
  assert.deepEqual(game, resumed);
  assert.equal(game.player.radiator.health, 85);
  assert.equal(game.player.radiator.repairKits, 1);
  assert.equal(game.player.radiator.repairProgress, 0);
  assert.equal(commandGame(game, 'repair'), true);
  updateGame(game, 1 / 60, { move: 1 });
  assert.equal(game.player.radiator.repairing, false);
  assert.equal(game.player.radiator.repairKits, 1);
  assert.equal(game.player.radiator.repairProgress, 0);
});

test('six chassis and both MI04 decisions complete Vesper with four immutable reports and one technical source', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const ready = afterNetwork(), previous = clone(ready.completed);
    const begun = beginCampaignMission(ready, { missionId: 'MI04', walkerId: walker.id, difficulty: 'normal', seed: 1847 });
    let dossier = begun.campaign;
    pilotMI04(begun.game, { choice, stopAt: s => s.decision.active,
      observe(s, frame) { if (frame % 900 === 0 && s.status === 'playing') dossier = parseCampaign(serializeCampaign(checkpointCampaign(dossier, s))); } });
    assert.equal(begun.game.decision.active, true, walker.id);
    dossier = checkpointCampaign(dossier, begun.game, { beforeDecision: true });
    const beforeDecision = clone(dossier.preDecisionCheckpoint);
    const resumed = restoreCampaignGame(parseCampaign(serializeCampaign(dossier)), { beforeDecision: true });
    assert.deepEqual(resumed, clone(begun.game));
    assert.equal(commandGame(resumed, 'choice', choice), true);
    updateGame(resumed, 1 / 60, { brace: true });
    dossier = checkpointCampaign(dossier, resumed);
    assert.deepEqual(dossier.preDecisionCheckpoint, beforeDecision);
    pilotMI04(resumed, { choice });
    assert.equal(resumed.status, 'won', `${walker.id} ${choice}`);
    const result = finishCampaignMission(dossier, resumed);
    assert.equal(result.applied, true);
    const saved = parseCampaign(serializeCampaign(result.campaign)), receipt = saved.completed.MI04;
    assert.equal(saved.resources.parts, 22);
    assert.equal(saved.stage, 'complete'); assert.equal(nextCampaignMissionId(saved), 'MI05');
    assert.deepEqual(Object.fromEntries(['MI01', 'MI02', 'MI03'].map(id => [id, saved.completed[id]])), previous);
    assert.deepEqual(saved.lastDebrief, receipt);
    assert.equal(receipt.turbinesCooled, 2); assert.equal(receipt.coolantRestored, true);
    assert.equal(receipt.coolingAssistance, true); assert.equal(receipt.witnessContacted, true);
    assert.equal(receipt.maintenanceInspected, true); assert.equal(receipt.logRecovered, true);
    assert.equal(receipt.technicalEvidence, true); assert.equal(receipt.evidenceSource, 'PT01');
    assert.equal(receipt.alternativeSourceNeeded, false); assert.equal(receipt.reportFiled, choice === 'defy');
    assert.equal(resumed.stats.evidence, 1);
    for (const [key, value] of Object.entries(saved.world.vesper.industrial)) assert.equal(value, receipt[key], key);
    assert.equal(saved.fleet[walker.id].radiator, resumed.player.radiator.health);
    assert.equal(saved.authority.suspicion, ready.authority.suspicion + (choice === 'defy' ? 2 : 0));
    assert.deepEqual(finishCampaignMission(saved, resumed).campaign, saved);
    for (const missionId of ['MI01', 'MI02', 'MI03', 'MI04']) {
      const replay = beginCampaignMission(saved, { missionId });
      assert.equal(replay.replay, true); assert.deepEqual(replay.campaign, saved);
      assert.deepEqual(finishCampaignMission(saved, replay.game, { replay: true }).campaign, saved);
    }
  }
});

test('an active MI04 dossier survives earlier replays and rejects invented industrial progress or heritage', () => {
  const begun = beginCampaignMission(afterNetwork(), { missionId: 'MI04', walkerId: 'WK06' });
  const original = serializeCampaign(begun.campaign);
  for (const missionId of ['MI01', 'MI02', 'MI03']) {
    const replay = beginCampaignMission(begun.campaign, { missionId });
    assert.equal(replay.replay, true);
    assert.equal(serializeCampaign(checkpointCampaign(begun.campaign, replay.game, { replay: true })), original);
    assert.equal(serializeCampaign(finishCampaignMission(begun.campaign, replay.game, { replay: true }).campaign), original);
  }
  assert.equal(beginCampaignMission(begun.campaign, { missionId: 'MI04' }).ok, false);
  for (const change of [
    c => { c.checkpoint.industrial.turbines.pop(); },
    c => { c.checkpoint.industrial.turbines[0].x += 10; },
    c => { c.checkpoint.industrial.turbines[0].cooled = true; },
    c => { c.checkpoint.industrial.turbines[0].temperature = 1000; },
    c => { c.checkpoint.industrial.pump.connected = true; },
    c => { c.checkpoint.industrial.post.maxHp = 9999; },
    c => { c.checkpoint.industrial.post.destroyed = true; },
    c => { c.checkpoint.industrial.contact.contacted = true; },
    c => { c.checkpoint.campaign.technicalEvidence = true; },
    c => { c.checkpoint.campaign.evidenceSource = 'PT03'; },
    c => { c.checkpoint.campaign.logRecovered = true; },
    c => { c.checkpoint.campaign.witnessContacted = true; },
    c => { c.checkpoint.campaign.context.railHostagesRescued = 0; },
    c => { c.checkpoint.campaign.context.witnessAvailable = false; },
    c => { c.checkpoint.stats.evidence = 1; },
    c => { delete c.completed.MI03; },
  ]) {
    const invalid = clone(begun.campaign); change(invalid);
    assert.throws(() => parseCampaign(JSON.stringify(invalid)), /Sauvegarde invalide/);
  }
});

test('a post destroyed by real fire before copying yields a completed mission without PT01 and needs another source', () => {
  const begun = beginCampaignMission(afterNetwork(), { missionId: 'MI04', walkerId: 'WK05' });
  pilotMI04(begun.game, { destroyPost: true, choice: 'defy', stopAt: s => s.decision.active });
  const game = begun.game;
  assert.equal(game.decision.active, true);
  assert.equal(game.industrial.post.destroyed, true);
  assert.equal(game.campaign.logRecovered, false);
  const dossier = parseCampaign(serializeCampaign(checkpointCampaign(begun.campaign, game, { beforeDecision: true })));
  const resumed = restoreCampaignGame(dossier);
  pilotMI04(resumed, { choice: 'defy' });
  assert.equal(resumed.status, 'won');
  const finished = finishCampaignMission(dossier, resumed);
  const saved = parseCampaign(serializeCampaign(finished.campaign)), receipt = saved.completed.MI04;
  assert.equal(receipt.technicalEvidence, false); assert.equal(receipt.evidenceSource, 'none');
  assert.equal(receipt.alternativeSourceNeeded, true); assert.equal(receipt.maintenanceIntact, false);
  assert.equal(receipt.reportFiled, true); assert.equal(receipt.witnessContacted, true);
  assert.equal(saved.resources.parts, 22); assert.equal(nextCampaignMissionId(saved), 'MI05');
  assert.match(receipt.tessLine, /autre source technique/);
  assert.equal(saved.world.vesper.industrial.logRecovered, false);
});

test('a copied journal keeps PT01 after later post destruction, save/resume and the sealed-report choice', () => {
  const begun = beginCampaignMission(afterNetwork(), { missionId: 'MI04', walkerId: 'WK01' });
  pilotMI04(begun.game, { stopAt: s => s.decision.active });
  assert.equal(begun.game.campaign.logRecovered, true);
  let dossier = checkpointCampaign(begun.campaign, begun.game, { beforeDecision: true });
  commandGame(begun.game, 'choice', 'obey');
  pilotMI04(begun.game, { choice: 'obey', destroyPost: true, stopAt: s => s.industrial.post.destroyed });
  assert.equal(begun.game.industrial.post.destroyed, true);
  assert.equal(begun.game.campaign.technicalEvidence, true);
  dossier = parseCampaign(serializeCampaign(checkpointCampaign(dossier, begun.game)));
  const resumed = restoreCampaignGame(dossier);
  pilotMI04(resumed, { choice: 'obey' });
  assert.equal(resumed.status, 'won');
  const saved = parseCampaign(serializeCampaign(finishCampaignMission(dossier, resumed).campaign));
  const receipt = saved.completed.MI04;
  assert.equal(receipt.logRecovered, true); assert.equal(receipt.technicalEvidence, true);
  assert.equal(receipt.evidenceSource, 'PT01'); assert.equal(receipt.alternativeSourceNeeded, false);
  assert.equal(receipt.maintenanceIntact, false); assert.equal(receipt.reportFiled, false);
  assert.match(receipt.tessLine, /copie du journal survit/);
  assert.equal(saved.world.vesper.industrial.evidenceSource, 'PT01');
});

test('an available dispensary channel is not counted as an actual contact when the public pilot skips it', () => {
  const begun = beginCampaignMission(afterNetwork(), { missionId: 'MI04', walkerId: 'WK09' });
  assert.equal(begun.game.industrial.contact.available, true);
  pilotMI04(begun.game, { skipContact: true });
  assert.equal(begun.game.status, 'won');
  const saved = parseCampaign(serializeCampaign(finishCampaignMission(begun.campaign, begun.game).campaign));
  assert.equal(saved.completed.MI04.witnessContacted, false);
  assert.equal(saved.completed.MI04.technicalEvidence, true);
  assert.match(saved.completed.MI04.samiLine, /aucun échange n’a eu lieu/);
  assert.equal(saved.completed.MI03.witnessAvailable, true);
});

test('a genuine MI03 cut blocks the later contact without blocking MI04 or granting a witness retrospectively', () => {
  const afterTrain = parseCampaign(JSON.stringify(historicalTrain.completed));
  const network = beginCampaignMission(afterTrain, { missionId: 'MI03', walkerId: 'WK01' });
  pilotMI03(network.game, { choice: 'obey' });
  assert.equal(network.game.status, 'won');
  const ready = finishCampaignMission(network.campaign, network.game).campaign;
  assert.equal(ready.completed.MI03.witnessAvailable, false);
  const industrial = beginCampaignMission(ready, { missionId: 'MI04', walkerId: 'WK06' });
  assert.equal(industrial.game.industrial.contact.available, false);
  pilotMI04(industrial.game);
  assert.equal(industrial.game.status, 'won');
  const saved = parseCampaign(serializeCampaign(finishCampaignMission(industrial.campaign, industrial.game).campaign));
  assert.equal(saved.completed.MI04.witnessContacted, false);
  assert.equal(saved.completed.MI04.technicalEvidence, true);
  assert.equal(saved.world.vesper.communications.civilRelaysOnline, 0);
  assert.match(saved.completed.MI04.samiLine, /Aucun contact du dispensaire n’était accessible/);
});

test('a real MI04 defeat preserves its earlier live checkpoint and gives no fourth mission reward', () => {
  const begun = beginCampaignMission(afterNetwork(), { missionId: 'MI04', walkerId: 'WK02', difficulty: 'veteran' });
  const game = begun.game;
  for (let frame = 0; frame < 3000 && game.player.x < 1200 && game.status === 'playing'; frame++) updateGame(game, 1 / 60, { move: 1 });
  assert.equal(game.status, 'playing');
  const dossier = checkpointCampaign(begun.campaign, game), before = serializeCampaign(dossier);
  for (let frame = 0; frame < 30000 && game.status === 'playing'; frame++) updateGame(game, 1 / 60, {});
  assert.equal(game.status, 'lost');
  const result = finishCampaignMission(dossier, game);
  assert.equal(result.applied, false);
  assert.equal(serializeCampaign(result.campaign), before);
  assert.equal(result.campaign.resources.parts, 18);
  assert.equal(result.campaign.completed.MI04, undefined);
  assert.equal(result.campaign.lastDebrief.missionId, 'MI03');
  assert.equal(restoreCampaignGame(result.campaign).status, 'playing');
});

test('real train losses propagate through MI03 into the full cooling procedure and portable coolant never repairs the village pipe', () => {
  const legacy = JSON.parse(readFileSync(new URL('./fixtures/campaign-v1-mi01.json', import.meta.url), 'utf8'));
  const train = beginCampaignMission(parseCampaign(JSON.stringify(legacy.completed)), { missionId: 'MI02', walkerId: 'WK01', seed: 1847 });
  pilotMI02(train.game, { stopAt: s => s.train.stopped });
  const wagon = train.game.train.wagons.find(item => item.kind === 'hostages');
  while (train.game.player.x > wagon.x - 260 && train.game.status === 'playing') updateGame(train.game, 1 / 60, { move: -1 });
  for (let frame = 0; frame < 186; frame++) updateGame(train.game, 1 / 60, { brace: true, secondary: true, aimX: wagon.x, aimY: wagon.y });
  for (let frame = 0; frame < 30; frame++) updateGame(train.game, 1 / 60, { brace: true });
  assert.equal(train.game.campaign.hostagesLost, 8);
  pilotMI02(train.game, { choice: 'obey' });
  assert.equal(train.game.status, 'won');
  const afterTrain = finishCampaignMission(train.campaign, train.game).campaign;
  const network = beginCampaignMission(afterTrain, { missionId: 'MI03', walkerId: 'WK06' });
  pilotMI03(network.game, { choice: 'obey' });
  assert.equal(network.game.status, 'won');
  const afterSignals = finishCampaignMission(network.campaign, network.game).campaign;
  const industrial = beginCampaignMission(afterSignals, { missionId: 'MI04', walkerId: 'WK09' });
  assert.equal(industrial.game.campaign.coolingAssistance, false);
  assert.equal(industrial.game.industrial.pump.connected, false);
  assert.equal(industrial.game.industrial.contact.available, false);
  let coolingStart = null, coolingEnd = null;
  pilotMI04(industrial.game, { observe(s) {
    const turbine = s.industrial.turbines[0];
    if (turbine.working && coolingStart === null) coolingStart = s.elapsed;
    if (turbine.cooled && coolingEnd === null) coolingEnd = s.elapsed;
  } });
  assert.equal(industrial.game.status, 'won');
  assert.ok(coolingEnd - coolingStart > 6.9 && coolingEnd - coolingStart < 7.1);
  const saved = parseCampaign(serializeCampaign(finishCampaignMission(industrial.campaign, industrial.game).campaign));
  assert.equal(saved.completed.MI04.coolingAssistance, false);
  assert.equal(saved.completed.MI04.witnessContacted, false);
  assert.equal(saved.completed.MI04.coolantRestored, true);
  assert.equal(saved.world.vesper.servicesInterrupted, true);
  assert.equal(saved.world.vesper.pipeRepaired, false);
  assert.equal(saved.completed.MI02.hostagesLost, 8);
  assert.equal(saved.completed.MI04.technicalEvidence, true);
});
