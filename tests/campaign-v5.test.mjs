import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALKERS } from '../src/content.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI04 } from './helpers/mi04-driver.mjs';
import { pilotMI05 } from './helpers/mi05-driver.mjs';
import {
  CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY, CAMPAIGN_SAVE_VERSION,
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission,
  nextCampaignMissionId,
} from '../src/campaign.mjs';

const historical = JSON.parse(readFileSync(new URL('./fixtures/campaign-v4-mi04.json', import.meta.url), 'utf8'));
const beforeIndustrial = JSON.parse(readFileSync(new URL('./fixtures/campaign-v3-mi03.json', import.meta.url), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const afterVesper = () => parseCampaign(JSON.stringify(historical.completed));
function storage(primary, backup) {
  const values = new Map([[CAMPAIGN_SAVE_KEY, primary]]);
  if (backup !== undefined) values.set(CAMPAIGN_BACKUP_KEY, backup);
  return { values, failKey: null, getItem: key => values.get(key) ?? null,
    setItem(key, value) { if (key === this.failKey) throw new Error('quota'); values.set(key, String(value)); } };
}

test('authentic d7d76b6 v4 live and completed dossiers gain only an unvisited Nacre and zero fuel', () => {
  assert.equal(historical.provenance.sourceRevision, 'd7d76b61ee9e97e27c611e06905f32f70633cb8e');
  assert.equal(historical.provenance.saveVersion, 4);
  const before = JSON.stringify(historical);
  for (const old of [historical.live, historical.completed]) {
    const migrated = parseCampaign(JSON.stringify(old));
    assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
    const originalShape = clone(migrated);
    originalShape.version = 4; delete originalShape.world.thyr; delete originalShape.world.nacre; delete originalShape.resources.fuel;
    assert.deepEqual(originalShape, old);
    assert.equal(migrated.resources.fuel, 0);
    assert.equal(migrated.world.nacre.passage.smugglerVerified, false);
    assert.equal(migrated.world.nacre.passage.refugeesPassed, 0);
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
  }
  assert.equal(nextCampaignMissionId(afterVesper()), 'MI05');
  assert.equal(JSON.stringify(historical), before);
});

test('v4 migration leaves stored bytes untouched until a successful save and protects a future primary', () => {
  const original = JSON.stringify(historical.live), disk = storage(original);
  const loaded = readCampaign(disk);
  assert.equal(loaded.blocked, false);
  assert.equal(disk.getItem(CAMPAIGN_SAVE_KEY), original);
  assert.deepEqual(restoreCampaignGame(loaded.campaign), historical.live.checkpoint);
  disk.failKey = CAMPAIGN_SAVE_KEY;
  assert.equal(writeCampaign(disk, loaded.campaign).ok, false);
  assert.equal(disk.getItem(CAMPAIGN_SAVE_KEY), original);
  assert.equal(disk.getItem(CAMPAIGN_BACKUP_KEY), original);
  disk.failKey = null;
  assert.equal(writeCampaign(disk, loaded.campaign).ok, true);
  assert.deepEqual(readCampaign(disk).campaign, loaded.campaign);
  const future = JSON.stringify({ ...createCampaign(), version: CAMPAIGN_SAVE_VERSION + 1 });
  const protectedDisk = storage(future, original), result = readCampaign(protectedDisk);
  assert.equal(result.blocked, true);
  assert.equal(writeCampaign(protectedDisk, result.campaign).ok, false);
  assert.equal(protectedDisk.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('old versions cannot import invented Nacre results, fuel or MI05 checkpoints', () => {
  for (const change of [
    value => { value.resources.fuel = 2; },
    value => { value.world.nacre = createCampaign().world.nacre; },
    value => { value.completed.MI05 = {}; },
    value => { value.activeMissionId = 'MI05'; },
    value => { value.checkpoint.missionId = 'MI05'; },
    value => { value.checkpoint.channel = {}; },
  ]) {
    const value = clone(historical.live); change(value);
    assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/);
  }
});

test('MI05 requires all four reports but no technical proof, and preserves each inherited fact', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI05' }).ok, false);
  const incomplete = parseCampaign(JSON.stringify(beforeIndustrial.completed));
  assert.equal(beginCampaignMission(incomplete, { missionId: 'MI05' }).ok, false);
  const sortie = beginCampaignMission(incomplete, { missionId: 'MI04', walkerId: 'WK05', seed: 1847 });
  pilotMI04(sortie.game, { destroyPost: true });
  assert.equal(sortie.game.status, 'won');
  const noJournal = finishCampaignMission(sortie.campaign, sortie.game).campaign;
  assert.equal(noJournal.world.vesper.industrial.technicalEvidence, false);
  for (const source of [afterVesper(), noJournal]) for (const walker of WALKERS) {
    const text = serializeCampaign(source);
    const next = beginCampaignMission(source, { missionId: 'MI05', walkerId: walker.id, seed: 1847 });
    assert.equal(next.ok, true);
    assert.deepEqual(next.game.campaign.context, {
      technicalEvidence: source.world.vesper.industrial.technicalEvidence,
      railHostagesRescued: source.world.vesper.rail.hostagesRescued,
      railRecordFiled: source.world.vesper.rail.recordFiled,
    });
    assert.equal(next.game.stats.evidence, 0);
    assert.equal(next.game.campaign.smugglerVerified, false);
    assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(next.campaign))), next.game);
    assert.equal(serializeCampaign(source), text);
  }
});

test('a mid-work MI05 save retains tide, footholds, damage and work, then resumes deterministically', () => {
  const start = beginCampaignMission(afterVesper(), { missionId: 'MI05', walkerId: 'WK09', seed: 1847 });
  const game = start.game;
  pilotMI05(game, { stopAt: s => s.channel.banks[0].working && s.channel.banks[0].progress > 0.3 });
  assert.equal(game.status, 'playing');
  assert.ok(game.channel.banks[0].progress > 0.3 && game.channel.banks[0].progress < 1);
  const saved = parseCampaign(serializeCampaign(checkpointCampaign(start.campaign, game)));
  const resumed = restoreCampaignGame(saved);
  assert.deepEqual(resumed, clone(game));
  for (let frame = 0; frame < 180; frame++) {
    updateGame(game, 1 / 60, { brace: true }); updateGame(resumed, 1 / 60, { brace: true });
  }
  assert.deepEqual(resumed, clone(game));
  assert.equal(resumed.channel.banks[0].bridgeRaised, true);
});

test('all chassis and both decisions add one Nacre report and grant only the collected fuel once', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const source = afterVesper(), earlier = clone(source.completed);
    const start = beginCampaignMission(source, { missionId: 'MI05', walkerId: walker.id, seed: 1847 });
    pilotMI05(start.game, { stopAt: s => s.decision.active });
    assert.equal(start.game.decision.active, true, walker.id);
    const active = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
    const resumed = restoreCampaignGame(parseCampaign(serializeCampaign(active)));
    commandGame(resumed, 'choice', choice);
    const decided = checkpointCampaign(active, resumed);
    pilotMI05(resumed, { choice });
    assert.equal(resumed.status, 'won', `${walker.id} ${choice}`);
    const finish = finishCampaignMission(decided, resumed), result = parseCampaign(serializeCampaign(finish.campaign));
    assert.equal(finish.applied, true);
    assert.equal(result.completed.MI05.refugeesPassed, 12);
    assert.equal(result.completed.MI05.refugeesLost, 0);
    assert.equal(result.completed.MI05.bargeCiviliansLost, 0);
    assert.equal(result.completed.MI05.traffickingVerified, true);
    assert.equal(result.completed.MI05.smugglerVerified, true);
    assert.equal(result.completed.MI05.reportFiled, choice === 'defy');
    assert.equal(result.completed.MI05.fuelLots, 2);
    assert.equal(result.resources.fuel, 2);
    assert.equal(result.resources.parts, source.resources.parts + 4);
    assert.equal(nextCampaignMissionId(result), 'MI06');
    assert.deepEqual(Object.fromEntries(Object.keys(earlier).map(id => [id, result.completed[id]])), earlier);
    assert.deepEqual(result.world.vesper, source.world.vesper);
    assert.equal(resumed.stats.evidence, 0);
    assert.deepEqual(finishCampaignMission(result, resumed).campaign, result);
    const replay = beginCampaignMission(result, { missionId: 'MI05' });
    assert.equal(replay.replay, true);
    assert.deepEqual(finishCampaignMission(result, replay.game, { replay: true }).campaign, result);
  }
});

test('MI05 imports reject contradictory tide, identity, results, inheritance and resource claims', () => {
  const start = beginCampaignMission(afterVesper(), { missionId: 'MI05', walkerId: 'WK01' });
  const valid = serializeCampaign(start.campaign);
  for (const change of [
    value => { value.resources.fuel = 2; },
    value => { value.world.nacre.passage.refugeesPassed = 12; },
    value => { value.checkpoint.channel.tide.walkable = false; },
    value => { value.checkpoint.channel.boat.arrived = true; },
    value => { value.checkpoint.channel.boat.x += 200; },
    value => { value.checkpoint.channel.boat.passengers = 24; },
    value => { value.checkpoint.channel.winches.pop(); },
    value => { value.checkpoint.channel.winches[0].released = true; },
    value => { value.checkpoint.channel.barges[0].kind = 'smuggler'; },
    value => { value.checkpoint.campaign.traffickingVerified = true; },
    value => { value.checkpoint.campaign.context.technicalEvidence = false; },
    value => { value.checkpoint.campaign.fuelLots = 2; },
    value => { value.checkpoint.channel.fuel.collected = true; },
  ]) {
    const invalid = JSON.parse(valid); change(invalid);
    assert.throws(() => parseCampaign(JSON.stringify(invalid)), /Sauvegarde invalide/);
  }
  assert.equal(serializeCampaign(start.campaign), valid);
});
