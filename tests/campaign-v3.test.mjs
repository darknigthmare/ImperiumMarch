import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALKERS } from '../src/content.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI03 } from './helpers/mi03-driver.mjs';
import {
  CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY, CAMPAIGN_SAVE_VERSION,
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  nextCampaignMissionId, beginCampaignMission, checkpointCampaign, restoreCampaignGame,
  finishCampaignMission, serviceCampaignWalker, repairCampaignPipe,
} from '../src/campaign.mjs';

const historical = JSON.parse(readFileSync(new URL('./fixtures/campaign-v2-mi02.json', import.meta.url), 'utf8'));
const originalText = JSON.stringify(historical);
const clone = value => JSON.parse(JSON.stringify(value));
const vesperAfterTrain = () => parseCampaign(JSON.stringify(historical.completed));
const newWalkerIds = ['WK02', 'WK06', 'WK10'];

function memoryStorage(primary, backup) {
  const values = new Map();
  if (primary !== undefined) values.set(CAMPAIGN_SAVE_KEY, primary);
  if (backup !== undefined) values.set(CAMPAIGN_BACKUP_KEY, backup);
  return { values, failKey: null,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { if (key === this.failKey) throw new Error('Quota exceeded'); values.set(key, String(value)); },
  };
}

function stripV3Additions(value) {
  const historicalShape = clone(value);
  historicalShape.version = 2;
  delete historicalShape.world.vesper.communications;
  delete historicalShape.world.vesper.industrial;
  for (const condition of Object.values(historicalShape.fleet)) delete condition.radiator;
  for (const id of newWalkerIds) delete historicalShape.fleet[id];
  for (const checkpoint of [historicalShape.checkpoint, historicalShape.preDecisionCheckpoint]) if (checkpoint) {
    delete checkpoint.player.reserveAmmo; delete checkpoint.player.maxReserveAmmo;
    delete checkpoint.player.radiator;
  }
  return historicalShape;
}

test('genuine v0.3 fixtures migrate without rewriting train, timing, decisions, reports, wear or inventory', () => {
  assert.equal(historical.provenance.sourceRevision, '72027333c6ea5dc914d189fec6d2ff864b2f07c1');
  for (const old of [historical.live, historical.completed]) {
    assert.equal(old.version, 2);
    const migrated = parseCampaign(JSON.stringify(old));
    assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
    assert.deepEqual(stripV3Additions(migrated), old);
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
    for (const id of newWalkerIds) {
      const walker = WALKERS.find(item => item.id === id);
      assert.deepEqual(migrated.fleet[id], { hull: walker.hull, feet: Array(walker.legs).fill(100), radiator: 100 });
    }
    for (const checkpoint of [migrated.checkpoint, migrated.preDecisionCheckpoint]) if (checkpoint) {
      assert.equal(checkpoint.player.reserveAmmo, 80);
      assert.equal(checkpoint.player.maxReserveAmmo, 80);
    }
  }
  assert.equal(nextCampaignMissionId(vesperAfterTrain()), 'MI03');
  assert.equal(JSON.stringify(historical), originalText, 'historical fixture must stay immutable');
});

test('v2 reads are nonmutating, migration is idempotent and a failed v3 write keeps the original primary', () => {
  const oldText = JSON.stringify(historical.live);
  const storage = memoryStorage(oldText);
  const loaded = readCampaign(storage);
  assert.equal(loaded.blocked, false);
  assert.equal(loaded.campaign.version, CAMPAIGN_SAVE_VERSION);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), oldText);
  const active = restoreCampaignGame(loaded.campaign);
  assert.equal(active.decision.active, true);
  assert.equal(active.campaign.hostagesRescued, 8);
  assert.deepEqual(restoreCampaignGame(loaded.campaign, { beforeDecision: true }), active);
  storage.failKey = CAMPAIGN_SAVE_KEY;
  assert.equal(writeCampaign(storage, loaded.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), oldText);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), oldText);
  storage.failKey = null;
  assert.equal(writeCampaign(storage, loaded.campaign).ok, true);
  assert.deepEqual(readCampaign(storage).campaign, loaded.campaign);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), oldText);
});

test('historical formats reject fabricated v3 fields instead of laundering an unknown schema', () => {
  for (const change of [
    campaign => { campaign.completed.MI03 = {}; },
    campaign => { campaign.activeMissionId = 'MI03'; },
    campaign => { campaign.world.vesper.communications = {}; },
    campaign => { campaign.fleet.WK02 = { hull: 1, feet: [100, 100] }; },
    campaign => { campaign.checkpoint.player.reserveAmmo = 999; },
    campaign => { campaign.checkpoint.player.maxReserveAmmo = 999; },
    campaign => { campaign.checkpoint.missionId = 'MI03'; },
    campaign => { campaign.checkpoint.walker.damage = 999; },
    campaign => { campaign.unknownSystem = true; },
  ]) {
    const old = clone(historical.live); change(old);
    assert.throws(() => parseCampaign(JSON.stringify(old)), /Sauvegarde invalide/);
  }
});

test('v3 import enforces finite reserve bounds and protects future data despite a readable v2 backup', () => {
  const current = parseCampaign(JSON.stringify(historical.live));
  for (const change of [
    campaign => { campaign.checkpoint.player.reserveAmmo = -1; },
    campaign => { campaign.checkpoint.player.reserveAmmo = 80.5; },
    campaign => { campaign.checkpoint.player.reserveAmmo = 81; },
    campaign => { campaign.checkpoint.player.maxReserveAmmo = 160; },
    campaign => { delete campaign.checkpoint.player.reserveAmmo; },
    campaign => { campaign.checkpoint.player.unlimitedAmmo = true; },
    campaign => { campaign.fleet.WK02.hull = 9999; },
    campaign => { campaign.fleet.WK06.feet.pop(); },
  ]) {
    const value = clone(current); change(value);
    assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/);
  }
  const future = createCampaign(); future.version = CAMPAIGN_SAVE_VERSION + 1;
  const primary = JSON.stringify(future), backup = JSON.stringify(historical.completed);
  const storage = memoryStorage(primary, backup);
  const loaded = readCampaign(storage);
  assert.equal(loaded.source, 'backup'); assert.equal(loaded.blocked, true);
  assert.equal(loaded.campaign.version, CAMPAIGN_SAVE_VERSION);
  assert.equal(writeCampaign(storage, loaded.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), primary);
});

test('an oversized future primary stays protected despite a valid backup until explicit replacement', () => {
  const future = { ...createCampaign(), version: CAMPAIGN_SAVE_VERSION + 1, futureData: 'x'.repeat(2_000_000) };
  const primary = JSON.stringify(future), backup = JSON.stringify(historical.completed);
  assert.ok(primary.length > 2_000_000);
  const storage = memoryStorage(primary, backup);
  const loaded = readCampaign(storage);
  assert.equal(loaded.source, 'backup');
  assert.equal(loaded.blocked, true);
  assert.equal(loaded.campaign.version, CAMPAIGN_SAVE_VERSION);
  assert.match(loaded.warning, /taille/);
  assert.equal(writeCampaign(storage, loaded.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), primary);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), backup);
  const replacement = createCampaign();
  assert.equal(writeCampaign(storage, replacement, { replaceInvalid: true }).ok, true);
  assert.deepEqual(readCampaign(storage).campaign, replacement);
  assert.equal(readCampaign(storage).blocked, false);
});

test('MI03 requires both earlier reports and inherits the actual pipes and recovered train for all six chassis', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI03' }).ok, false);
  const firstReport = parseCampaign(JSON.stringify(historical.live));
  assert.equal(beginCampaignMission(firstReport, { missionId: 'MI03' }).ok, false);
  const ready = vesperAfterTrain(), previous = serializeCampaign(ready);
  for (const walker of WALKERS) {
    const begun = beginCampaignMission(ready, { missionId: 'MI03', walkerId: walker.id, seed: 411 });
    assert.equal(begun.ok, true); assert.equal(begun.replay, false);
    assert.equal(nextCampaignMissionId(begun.campaign), 'MI03');
    assert.deepEqual(begun.game.campaign.context, { pipeIntact: false, pipeRepaired: false, noticeFiled: true,
      servicesInterrupted: true, railRecordFiled: true, railHostagesRescued: 8, railHostagesLost: 0 });
    assert.equal(begun.game.player.ammo, walker.ammo);
    assert.equal(begun.game.player.reserveAmmo, walker.ammo * 8);
    assert.equal(begun.game.player.rockets, walker.rockets);
    assert.equal(serviceCampaignWalker(begun.campaign, walker.id).ok, false);
    assert.equal(repairCampaignPipe(begun.campaign).ok, false);
    const game = begun.game;
    for (let frame = 0; frame < 90; frame++) updateGame(game, 1 / 60, { move: 1, fire: frame < 2, aimX: game.player.x + 400, aimY: 40 });
    commandGame(game, 'reload');
    updateGame(game, 1 / 60, { brace: true });
    assert.ok(game.player.reloadTime > 0);
    const saved = checkpointCampaign(begun.campaign, game);
    const resumed = restoreCampaignGame(parseCampaign(serializeCampaign(saved)));
    assert.deepEqual(resumed, clone(game));
    for (let frame = 0; frame < 240; frame++) {
      const input = { move: frame < 100 ? 1 : -1, brace: frame > 200, vent: frame > 180 };
      updateGame(game, 1 / 60, input); updateGame(resumed, 1 / 60, input);
    }
    assert.deepEqual(game, resumed);
    assert.equal(game.player.reserveAmmo, walker.ammo * 8 - 1);
    assert.equal(serializeCampaign(ready), previous);
  }
});

test('an official MI03 checkpoint survives prior-mission replays, a declined restart and malformed imports', () => {
  const begun = beginCampaignMission(vesperAfterTrain(), { missionId: 'MI03', walkerId: 'WK06' });
  const original = serializeCampaign(begun.campaign);
  for (const missionId of ['MI01', 'MI02']) {
    const replay = beginCampaignMission(begun.campaign, { missionId, walkerId: 'WK02' });
    assert.equal(replay.replay, true);
    assert.deepEqual(replay.campaign, begun.campaign);
    assert.equal(serializeCampaign(checkpointCampaign(begun.campaign, replay.game, { replay: true })), original);
    assert.equal(serializeCampaign(finishCampaignMission(begun.campaign, replay.game, { replay: true }).campaign), original);
  }
  assert.equal(beginCampaignMission(begun.campaign, { missionId: 'MI03' }).ok, false);
  const restarted = beginCampaignMission(begun.campaign, { missionId: 'MI03', restart: true, walkerId: 'WK10' });
  assert.equal(restarted.game.walkerId, 'WK10');
  assert.equal(restarted.game.elapsed, 0);
  assert.equal(restarted.campaign.preDecisionCheckpoint, null);
  for (const change of [
    campaign => { campaign.checkpoint.network.stations.pop(); },
    campaign => { campaign.checkpoint.network.stations[1].population += 1; },
    campaign => { campaign.checkpoint.network.stations[1].x += 50; },
    campaign => { campaign.checkpoint.network.stations[1].verified = true; },
    campaign => { campaign.checkpoint.campaign.civilRelaysOnline = 0; },
    campaign => { campaign.checkpoint.campaign.witnessAvailable = true; },
    campaign => { campaign.checkpoint.campaign.context.railHostagesRescued = 0; },
    campaign => { campaign.world.vesper.communications.witnessAvailable = true; },
    campaign => { delete campaign.completed.MI02; },
    campaign => { campaign.checkpoint.stats.evidence = 1; },
  ]) {
    const invalid = clone(begun.campaign); change(invalid);
    assert.throws(() => parseCampaign(JSON.stringify(invalid)), /Sauvegarde invalide/);
  }
});

test('six chassis and both MI03 choices preserve three immutable reports, one reward and actual civil access', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const ready = vesperAfterTrain(), earlier = clone(ready.completed);
    const begun = beginCampaignMission(ready, { missionId: 'MI03', walkerId: walker.id, difficulty: 'normal', seed: 1847 });
    let dossier = begun.campaign;
    pilotMI03(begun.game, { choice, stopAt: state => state.decision.active,
      observe(state, frame) { if (frame % 900 === 0 && state.status === 'playing') dossier = parseCampaign(serializeCampaign(checkpointCampaign(dossier, state))); } });
    assert.equal(begun.game.decision.active, true, walker.id);
    dossier = checkpointCampaign(dossier, begun.game, { beforeDecision: true });
    const beforeDecision = clone(dossier.preDecisionCheckpoint);
    const resumed = restoreCampaignGame(parseCampaign(serializeCampaign(dossier)), { beforeDecision: true });
    assert.deepEqual(resumed, clone(begun.game));
    commandGame(resumed, 'choice', choice);
    updateGame(resumed, 1 / 60, { brace: true });
    dossier = checkpointCampaign(dossier, resumed);
    assert.deepEqual(dossier.preDecisionCheckpoint, beforeDecision);
    pilotMI03(resumed, { choice });
    assert.equal(resumed.status, 'won', `${walker.id} ${choice}`);
    assert.equal(resumed.stats.evidence, 0);
    const result = finishCampaignMission(dossier, resumed);
    assert.equal(result.applied, true);
    const saved = parseCampaign(serializeCampaign(result.campaign)), receipt = saved.completed.MI03;
    assert.equal(saved.resources.parts, 18, '6 initial + four per first completed report');
    assert.equal(saved.stage, 'complete'); assert.equal(nextCampaignMissionId(saved), 'MI04');
    assert.deepEqual(saved.completed.MI01, earlier.MI01); assert.deepEqual(saved.completed.MI02, earlier.MI02);
    assert.deepEqual(saved.lastDebrief, receipt);
    assert.equal(receipt.residentsLost, 0, `${walker.id} should have a safe public-control route`);
    assert.equal(receipt.verifiedBuildings, 2); assert.equal(receipt.signalsIdentified, 3);
    assert.equal(receipt.militaryRelayDisabled, true); assert.equal(receipt.dispensaryIntact, true);
    assert.equal(receipt.civilRelaysOnline, choice === 'defy' ? 2 : 0);
    assert.equal(receipt.networkPreserved, choice === 'defy');
    assert.equal(receipt.witnessAvailable, choice === 'defy');
    assert.equal(receipt.reportFiled, choice === 'defy'); assert.equal(receipt.holtAlerted, true);
    assert.equal(saved.authority.suspicion, ready.authority.suspicion + 1 + (choice === 'defy' ? 2 : 0));
    for (const [key, value] of Object.entries(saved.world.vesper.communications)) assert.equal(value, receipt[key], key);
    assert.equal(restoreCampaignGame(saved), null);
    assert.deepEqual(finishCampaignMission(saved, resumed).campaign, saved);
    for (const missionId of ['MI01', 'MI02', 'MI03']) {
      const replay = beginCampaignMission(saved, { missionId });
      assert.equal(replay.replay, true); assert.deepEqual(replay.campaign, saved);
      assert.deepEqual(finishCampaignMission(saved, replay.game, { replay: true }).campaign, saved);
    }
  }
});

test('damage after the MI03 decision persists a partial network, lost dispensary access and the real casualties', () => {
  const ready = vesperAfterTrain();
  const begun = beginCampaignMission(ready, { missionId: 'MI03', walkerId: 'WK01', difficulty: 'normal', seed: 1847 });
  const game = begun.game;
  pilotMI03(game, { stopAt: state => state.decision.active });
  let dossier = checkpointCampaign(begun.campaign, game, { beforeDecision: true });
  assert.equal(commandGame(game, 'choice', 'defy'), true);
  assert.equal(game.campaign.civilRelaysOnline, 2);
  assert.equal(game.campaign.witnessAvailable, true);
  const dispensary = game.network.stations.find(station => station.kind === 'dispensary');
  for (let frame = 0; frame < 6000 && game.player.x > dispensary.x + 300 && game.status === 'playing'; frame++) updateGame(game, 1 / 60, { move: -1, vent: true });
  assert.ok(game.player.x < dispensary.x + 310);
  for (let frame = 0; frame < 1200 && !dispensary.destroyed && game.status === 'playing'; frame++) updateGame(game, 1 / 60, { brace: true, secondary: true, aimX: dispensary.x, aimY: dispensary.y });
  assert.equal(dispensary.destroyed, true, 'destruction must come from the fired rockets');
  assert.equal(game.campaign.residentsLost, 8);
  assert.equal(game.campaign.civilRelaysOnline, 1);
  assert.equal(game.campaign.networkPreserved, false);
  assert.equal(game.campaign.witnessAvailable, false);
  assert.equal(game.campaign.verifiedBuildings, 2, 'the earlier observations stay copied');
  dossier = parseCampaign(serializeCampaign(checkpointCampaign(dossier, game)));
  const resumed = restoreCampaignGame(dossier);
  assert.equal(resumed.decision.choice, 'defy');
  assert.equal(resumed.campaign.residentsLost, 8);
  pilotMI03(resumed);
  assert.equal(resumed.status, 'won');
  const finished = finishCampaignMission(dossier, resumed);
  const saved = parseCampaign(serializeCampaign(finished.campaign));
  assert.equal(saved.completed.MI03.civilRelaysOnline, 1);
  assert.equal(saved.completed.MI03.residentsLost, 8);
  assert.equal(saved.completed.MI03.witnessAvailable, false);
  assert.equal(saved.completed.MI03.dispensaryIntact, false);
  assert.equal(saved.completed.MI03.reportFiled, true);
  assert.match(saved.completed.MI03.tessLine, /partiellement coupé/);
  assert.match(saved.completed.MI03.samiLine, /dispensaire est détruit/);
  assert.deepEqual(saved.completed.MI01, ready.completed.MI01);
  assert.deepEqual(saved.completed.MI02, ready.completed.MI02);
  assert.equal(saved.resources.parts, 18);
});

test('a real MI03 defeat leaves its live checkpoint and earlier reports without a mission reward', () => {
  const begun = beginCampaignMission(vesperAfterTrain(), { missionId: 'MI03', walkerId: 'WK02', difficulty: 'veteran', seed: 1847 });
  const game = begun.game;
  for (let frame = 0; frame < 3000 && game.player.x < 1200 && game.status === 'playing'; frame++) updateGame(game, 1 / 60, { move: 1 });
  assert.equal(game.status, 'playing');
  const dossier = checkpointCampaign(begun.campaign, game), before = serializeCampaign(dossier);
  for (let frame = 0; frame < 30000 && game.status === 'playing'; frame++) updateGame(game, 1 / 60, {});
  assert.equal(game.status, 'lost');
  const result = finishCampaignMission(dossier, game);
  assert.equal(result.applied, false);
  assert.equal(serializeCampaign(result.campaign), before);
  assert.equal(result.campaign.resources.parts, 14);
  assert.equal(result.campaign.completed.MI03, undefined);
  assert.equal(result.campaign.lastDebrief.missionId, 'MI02');
  assert.equal(restoreCampaignGame(result.campaign).status, 'playing');
});
