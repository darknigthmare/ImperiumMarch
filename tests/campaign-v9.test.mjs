import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission,
  nextCampaignMissionId, CAMPAIGN_SAVE_VERSION, CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY,
} from '../src/campaign.mjs';
import { updateGame, commandGame } from '../src/simulation.mjs';
import { WALKERS } from '../src/content.mjs';
import { pilotMI09 } from './helpers/mi09-driver.mjs';

const fixtureBytes = readFileSync(new URL('./fixtures/campaign-v8-mi08.json', import.meta.url));
const history = JSON.parse(fixtureBytes);
const clone = value => JSON.parse(JSON.stringify(value));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const after = (variant = 'completed') => parseCampaign(JSON.stringify(history[variant]));
const start = (options = {}) => beginCampaignMission(after(), { missionId: 'MI09', walkerId: 'WK09', difficulty: 'story', seed: 1847, ...options });
const disk = text => {
  const values = new Map([[CAMPAIGN_SAVE_KEY, text]]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('v9 migration adds only unvisited Thyr to authentic native v8 exports', () => {
  assert.equal(CAMPAIGN_SAVE_VERSION, 9);
  assert.equal(hash(fixtureBytes), '19f66185e9a9997dae5e0e72b83954e6b3f865354ac348802045f1bc38aa6007');
  assert.equal(history.provenance.sourceRevision, '2bb8d7a708e4fab5ab34b3cac10f2418b60fe037');
  assert.equal(history.provenance.verifiedHistoricBlobs, 889);
  for (const variant of ['live', 'completed']) {
    const original = history[variant], migrated = after(variant), previous = clone(migrated);
    previous.version = 8;
    delete previous.world.thyr;
    assert.deepEqual(previous, original, variant);
    assert.deepEqual(migrated.world.thyr, createCampaign().world.thyr);
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
    assert.deepEqual(migrated.resources, original.resources);
    assert.deepEqual(migrated.completed, original.completed);
    assert.deepEqual(migrated.fleet, original.fleet);
    assert.equal(migrated.world.nacre.fuelSpent, original.world.nacre.fuelSpent);
    const source = history.provenance.nativeVariants[variant].path;
    const native = readFileSync(new URL(`../${source}`, import.meta.url));
    assert.equal(hash(native), history.provenance.sourceHashes[source].sha256);
    assert.deepEqual(JSON.parse(native), original);
  }
  assert.deepEqual(restoreCampaignGame(after('live')), history.live.checkpoint);
  assert.equal(nextCampaignMissionId(after()), 'MI09');
});

test('all seven earlier fixture files retain their historical bytes', () => {
  for (const [path, expected] of Object.entries(history.provenance.protectedHistoricalFixtures)) {
    const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(bytes.length, expected.bytes, path);
    assert.equal(hash(bytes), expected.sha256, path);
  }
});

test('v8 read is nondestructive, first write backs up the original, future versions remain protected', () => {
  const original = JSON.stringify(history.live), store = disk(original), loaded = readCampaign(store);
  assert.equal(loaded.blocked, false);
  assert.equal(store.getItem(CAMPAIGN_SAVE_KEY), original);
  assert.equal(writeCampaign(store, loaded.campaign).ok, true);
  assert.equal(store.getItem(CAMPAIGN_BACKUP_KEY), original);
  const future = JSON.stringify({ ...createCampaign(), version: 10 });
  store.values.set(CAMPAIGN_SAVE_KEY, future);
  const blocked = readCampaign(store);
  assert.equal(blocked.blocked, true);
  assert.equal(writeCampaign(store, blocked.campaign).ok, false);
  assert.equal(store.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('historical v8 cannot import future Thyr state, mission or result', () => {
  const edits = [
    save => { save.world.thyr = {}; },
    save => { save.completed.MI09 = {}; },
    save => { save.activeMissionId = 'MI09'; },
    save => { save.checkpoint.missionId = 'MI09'; },
    save => { save.checkpoint.livingRoute = {}; },
  ];
  for (const edit of edits) {
    const save = clone(history.live);
    edit(save);
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/);
  }
});

test('MI09 requires the first MI08 report and inherits only its sourced radio context', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI09' }).ok, false);
  assert.equal(beginCampaignMission(after('live'), { missionId: 'MI09' }).ok, false);
  const source = after(), before = serializeCampaign(source), deployed = beginCampaignMission(source, { missionId: 'MI09', walkerId: 'WK09', seed: 1847 });
  assert.equal(deployed.ok, true);
  assert.equal(serializeCampaign(source), before);
  assert.deepEqual(deployed.campaign.resources, source.resources);
  assert.deepEqual(deployed.campaign.completed, source.completed);
  assert.deepEqual(deployed.campaign.world.nacre, source.world.nacre);
  assert.deepEqual(deployed.game.campaign.context, { departureRecorded: true, departureChoice: 'delay', departureArrived: 34, departureLost: 0 });
  assert.equal(deployed.game.stats.evidence, 0);
  assert.deepEqual(deployed.game.decision.options.map(option => option.id), ['obey', 'defy']);
  assert.deepEqual(restoreCampaignGame(deployed.campaign), deployed.game);
});

test('Thyr in-progress export preserves exact simulation and detached restore without altering MI01–MI08', () => {
  let { campaign, game } = start();
  const prior = clone(campaign.completed), resources = clone(campaign.resources);
  for (let i = 0; i < 90; i++) updateGame(game, 1 / 60, { move: 1 });
  campaign = checkpointCampaign(campaign, game);
  const saved = parseCampaign(serializeCampaign(campaign));
  assert.deepEqual(restoreCampaignGame(saved), game);
  assert.deepEqual(saved.completed, prior);
  assert.deepEqual(saved.resources, resources);
  const detached = restoreCampaignGame(saved);
  detached.player.ammo--;
  assert.notDeepEqual(detached, restoreCampaignGame(saved));
});

test('MI09 import rejects invented objects, aggregate outcomes, geometry, contacts, evidence and supply', () => {
  const original = start().campaign;
  const edits = [
    save => { save.checkpoint.livingRoute.invented = {}; },
    save => { save.checkpoint.livingRoute.roots.pop(); },
    save => { save.checkpoint.livingRoute.migrators.pop(); },
    save => { save.checkpoint.livingRoute.migrators[0].id = 'invented'; },
    save => { save.checkpoint.livingRoute.migrators[0].phase = 'arrived'; },
    save => { save.checkpoint.livingRoute.migrators[0].x++; },
    save => { save.checkpoint.livingRoute.migrators[0].targetX = 4900; },
    save => { save.checkpoint.livingRoute.columns[0].hp = 0; },
    save => { save.checkpoint.livingRoute.roots[0].w++; },
    save => { save.checkpoint.livingRoute.roots[0].columnId = 'thyr-column-2'; },
    save => { save.checkpoint.livingRoute.homes[0].habitable = false; },
    save => { save.checkpoint.livingRoute.pollinators[0].alive = false; },
    save => { save.checkpoint.livingRoute.pollinators[0].phase = 'settled'; },
    save => { save.checkpoint.livingRoute.contact.heard = true; },
    save => { save.checkpoint.livingRoute.approach.clearance = 1000; },
    save => { save.checkpoint.livingRoute.barrier.operated = true; },
    save => { save.checkpoint.livingRoute.logistics.arrived = true; },
    save => { save.checkpoint.livingRoute.alert.triggered = true; },
    save => { save.checkpoint.livingRoute.maps.inspected = true; },
    save => { save.checkpoint.livingRoute.report.transmitted = true; },
    save => { save.checkpoint.campaign.localsHeard = true; },
    save => { save.checkpoint.campaign.migratorsArrived = 4; },
    save => { save.checkpoint.campaign.context.departureArrived = 33; },
    save => { save.checkpoint.stats.evidence = 1; },
    save => { save.checkpoint.stats.collateral = 1; },
    save => { save.checkpoint.stats.kills = 1; },
    save => { save.checkpoint.decision.choice = 'delay'; },
    save => { save.checkpoint.objectives[0].complete = true; },
    save => { save.resources.fuel = 2; },
    save => { save.world.thyr.route.reportTransmitted = true; },
  ];
  edits.forEach((edit, index) => {
    const save = clone(original); edit(save);
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/, `mutation ${index + 1}`);
  });
});

test('matching declared facts do not permit instant work or an abandoned partial operation', () => {
  const source = start().campaign;
  const instantContact = clone(source);
  instantContact.checkpoint.livingRoute.contact.heard = true;
  instantContact.checkpoint.livingRoute.contact.progress = 1;
  instantContact.checkpoint.campaign.localsHeard = true;
  assert.throws(() => parseCampaign(JSON.stringify(instantContact)), /durée minimale/);
  const instantApproach = clone(source);
  Object.assign(instantApproach.checkpoint.livingRoute.approach, { prepared: true, kind: 'surveyed', clearance: 300, progress: 1 });
  Object.assign(instantApproach.checkpoint.campaign, { approachPrepared: true, approach: 'surveyed' });
  assert.throws(() => parseCampaign(JSON.stringify(instantApproach)), /durée minimale/);
  const inactiveWork = clone(source);
  inactiveWork.checkpoint.livingRoute.contact.progress = .5;
  assert.throws(() => parseCampaign(JSON.stringify(inactiveWork)), /progression inactive/);
});

for (const choice of ['obey', 'defy']) test(`MI09 ${choice} reconciles its complete physical roster, grants once and isolates replays`, () => {
  let { campaign, game } = start();
  const previous = clone(campaign.completed), world = clone(campaign.world), resources = clone(campaign.resources);
  let snapshots = 0;
  pilotMI09(game, { choice, observe: (state, frame) => {
    if (frame % 120 === 0 && state.status === 'playing') {
      campaign = checkpointCampaign(campaign, state);
      const restored = restoreCampaignGame(parseCampaign(serializeCampaign(campaign)));
      assert.deepEqual(restored, state);
      snapshots++;
    }
  } });
  assert.equal(game.status, 'won'); assert.ok(snapshots > 60);
  const result = finishCampaignMission(campaign, game), saved = parseCampaign(serializeCampaign(result.campaign)), receipt = saved.completed.MI09;
  assert.equal(result.applied, true);
  assert.equal(receipt.route, choice === 'obey' ? 'imperial' : 'migration');
  assert.equal(receipt.migratorsArrived, choice === 'obey' ? 0 : 4);
  assert.equal(receipt.migratorsDisplaced, choice === 'obey' ? 4 : 0);
  assert.equal(receipt.migratorsLost, 0); assert.equal(receipt.homesHabitable, 2);
  assert.equal(receipt.passagePreserved, choice === 'defy');
  assert.equal(receipt.harvestFragile, choice === 'obey');
  assert.equal(receipt.logisticsArrived, true); assert.equal(receipt.reportTransmitted, true);
  assert.equal(receipt.roster.migrators.length, 4); assert.equal(receipt.roster.homes.length, 2);
  assert.equal(receipt.roster.snipers.length, 2); assert.equal(receipt.roster.people, undefined);
  assert.deepEqual(Object.fromEntries(Object.entries(saved.completed).filter(([id]) => id !== 'MI09')), previous);
  assert.deepEqual(saved.world.vesper, world.vesper); assert.deepEqual(saved.world.nacre, world.nacre);
  assert.equal(saved.resources.parts, resources.parts + 4); assert.equal(saved.resources.fuel, resources.fuel);
  assert.equal(nextCampaignMissionId(saved), null);
  const before = serializeCampaign(saved);
  assert.equal(finishCampaignMission(saved, game).applied, false);
  assert.equal(serializeCampaign(saved), before);
  const replay = beginCampaignMission(saved, { missionId: 'MI09', walkerId: 'WK10', difficulty: 'story' });
  assert.equal(replay.replay, true);
  pilotMI09(replay.game, { choice: choice === 'obey' ? 'defy' : 'obey' });
  assert.equal(replay.game.status, 'won');
  assert.equal(checkpointCampaign(saved, replay.game, { replay: true }), saved);
  assert.equal(finishCampaignMission(saved, replay.game, { replay: true }).applied, false);
  assert.equal(serializeCampaign(saved), before);
  // The first receipt owns its snapshot, not references into either simulation.
  game.livingRoute.migrators[0].hp = 0;
  replay.game.livingRoute.columns[0].hp = 0;
  assert.equal(serializeCampaign(saved), before);
});

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI09 receipt accepts actual ${walker.id} ${choice} public-control completion`, () => {
  const { campaign, game } = start({ walkerId: walker.id, difficulty: 'normal' });
  pilotMI09(game, { choice });
  assert.equal(game.status, 'won');
  const saved = parseCampaign(serializeCampaign(finishCampaignMission(campaign, game).campaign));
  assert.equal(saved.completed.MI09.walkerId, walker.id);
  assert.equal(saved.completed.MI09.choice, choice);
  assert.equal(saved.completed.MI09.migratorsTotal, 4);
  assert.equal(saved.resources.parts, 42);
});

test('changing the receipt, matching world copy and debrief together cannot bypass physical validation', () => {
  const { campaign, game } = start(); pilotMI09(game);
  const completed = finishCampaignMission(campaign, game).campaign;
  const edits = [
    receipt => { receipt.migratorsArrived = 3; },
    receipt => { receipt.roster.migrators.pop(); },
    receipt => { receipt.roster.migrators[0].x--; },
    receipt => { receipt.roster.migrators[0].destination = 'exclusion'; },
    receipt => { receipt.roster.columns[0].hp++; },
    receipt => { receipt.roster.roots[0].columnId = 'thyr-column-2'; },
    receipt => { receipt.roster.homes[0].hp = 0; receipt.roster.homes[0].destroyed = true; },
    receipt => { receipt.roster.pollinators[0].phase = 'flying'; },
    receipt => { receipt.roster.barrier.operated = false; },
    receipt => { receipt.roster.contact.heard = false; },
    receipt => { receipt.roster.maps.inspected = false; },
    receipt => { receipt.roster.logistics.x--; },
    receipt => { receipt.logisticsIntegrity = .5; },
    receipt => { receipt.roster.report.progress = 0; },
    receipt => { receipt.roster.snipers[0].hp = 1; },
    receipt => { receipt.partsGranted = 8; },
    receipt => { receipt.choice = 'delay'; },
  ];
  edits.forEach((edit, index) => {
    const save = clone(completed); edit(save.completed.MI09);
    save.lastDebrief = clone(save.completed.MI09);
    save.world.thyr.route = Object.fromEntries(Object.keys(save.world.thyr.route).map(key => [key, clone(save.completed.MI09[key])]));
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/, `receipt mutation ${index + 1}`);
  });
});

const adverse = [
  [{ skipLocals: true }, receipt => { assert.equal(receipt.localsHeard, false); assert.equal(receipt.approach, 'surveyed'); }],
  [{ leaveLightsOn: true }, receipt => { assert.equal(receipt.lightsOff, false); assert.equal(receipt.pollinatorsPresent, 0); }],
  [{ destroyColumn: 1 }, receipt => { assert.equal(receipt.columnsIntact, 1); assert.equal(receipt.homesHabitable, 1); assert.equal(receipt.roster.pollinators[0].alive, false); }],
  [{ destroyRoot: 1 }, receipt => { assert.equal(receipt.columnsIntact, 2); assert.equal(receipt.homesHabitable, 1); assert.equal(receipt.passagePreserved, false); assert.equal(receipt.roster.pollinators[0].alive, true); }],
  [{ destroyHome: 1 }, receipt => { assert.equal(receipt.columnsIntact, 2); assert.equal(receipt.homesHabitable, 1); assert.equal(receipt.roster.homes[0].supported, true); }],
  [{ destroyBarrier: true }, receipt => { assert.equal(receipt.gateOperated, true); assert.equal(receipt.passagePreserved, false); assert.equal(receipt.roster.barrier.destroyed, true); }],
  [{ killMigrators: 1 }, receipt => { assert.equal(receipt.migratorsLost, 1); assert.equal(receipt.migratorsArrived, 3); assert.equal(receipt.harvestFragile, true); }],
  [{ killMigrators: 4 }, receipt => { assert.equal(receipt.migratorsLost, 4); assert.equal(receipt.migratorsArrived, 0); assert.equal(receipt.cropsFertilized, false); }],
];
for (const [options, verify] of adverse) test(`MI09 preserves adverse physical facts ${JSON.stringify(options)}`, () => {
  let { campaign, game } = start();
  pilotMI09(game, { ...options, observe: (state, frame) => {
    if (frame % 240 === 0 && state.status === 'playing') campaign = checkpointCampaign(campaign, state);
  } });
  assert.equal(game.status, 'won');
  const saved = parseCampaign(serializeCampaign(finishCampaignMission(campaign, game).campaign));
  verify(saved.completed.MI09);
  assert.equal(saved.completed.MI09.collateral, 0);
  assert.deepEqual(saved.world.nacre, history.completed.world.nacre);
});

test('MI09 terminal transport loss is exact, receives no reward and cannot revive an older checkpoint', () => {
  let { campaign, game } = start();
  const original = clone(game), resources = clone(campaign.resources), prior = clone(campaign.completed);
  pilotMI09(game, { destroyLogistics: true, observe: state => {
    if (state.decision.active && !campaign.preDecisionCheckpoint) campaign = checkpointCampaign(campaign, state, { beforeDecision: true });
  } });
  assert.equal(game.status, 'lost'); assert.equal(game.livingRoute.logistics.destroyed, true);
  campaign = checkpointCampaign(campaign, game);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
  assert.throws(() => checkpointCampaign(campaign, original), /recul|perdue/);
  const revived = clone(game); revived.status = 'playing';
  assert.throws(() => checkpointCampaign(campaign, revived), /encore vivante|perdue/);
  const result = finishCampaignMission(campaign, game);
  assert.equal(result.applied, false); assert.equal(result.receipt, null);
  assert.deepEqual(result.campaign.resources, resources); assert.deepEqual(result.campaign.completed, prior);
  const restart = beginCampaignMission(result.campaign, { missionId: 'MI09', walkerId: 'WK09', restart: true });
  assert.equal(restart.ok, true); assert.equal(restart.game.status, 'playing'); assert.equal(restart.game.elapsed, 0);
  assert.deepEqual(restart.campaign.resources, resources); assert.deepEqual(restart.campaign.completed, prior);
});

test('MI09 prechoice restore cannot undo even an instantaneous official choice', () => {
  let { campaign, game } = start();
  pilotMI09(game, { stopAt: state => state.decision.active });
  assert.equal(game.decision.active, true);
  campaign = checkpointCampaign(campaign, game, { beforeDecision: true });
  const before = clone(game), elapsed = game.elapsed;
  assert.deepEqual(restoreCampaignGame(campaign, { beforeDecision: true }), before);
  assert.equal(commandGame(game, 'choice', 'defy'), true);
  assert.equal(game.elapsed, elapsed);
  campaign = checkpointCampaign(campaign, game);
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
  assert.throws(() => checkpointCampaign(campaign, before), /choix acquis annulé/);
  const foreign = clone(campaign); foreign.preDecisionCheckpoint.seed++;
  assert.throws(() => parseCampaign(JSON.stringify(foreign)), /autre sortie/);
});

test('raising the clock cannot restore an already destroyed structural column', () => {
  let { campaign, game } = start();
  pilotMI09(game, { destroyColumn: 1, stopAt: state => state.livingRoute.approach.kind === 'guided' });
  const beforeDamage = clone(game);
  campaign = checkpointCampaign(campaign, game);
  pilotMI09(game, { destroyColumn: 1, stopAt: state => state.livingRoute.columns[0].destroyed });
  assert.equal(game.livingRoute.columns[0].destroyed, true);
  campaign = checkpointCampaign(campaign, game);
  const rewind = clone(beforeDamage); rewind.elapsed = game.elapsed + 1;
  assert.throws(() => checkpointCampaign(campaign, rewind), /intégrité restituée/);
});
