import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission,
  nextCampaignMissionId, CAMPAIGN_SAVE_VERSION, CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY,
} from '../src/campaign.mjs';
import { createChemicalDossier } from '../src/chemical-validation.mjs';
import { commandGame, updateGame, chemicalReceiptRoster, terrainAt } from '../src/simulation.mjs';
import { WALKERS, DIFFICULTIES, ENEMY_TYPES } from '../src/content.mjs';
import { pilotMI10, moveMI10, fireAtMI10 } from './helpers/mi10-driver.mjs';

const fixtureBytes = readFileSync(new URL('./fixtures/campaign-v9-mi09.json', import.meta.url));
const history = JSON.parse(fixtureBytes);
const clone = value => JSON.parse(JSON.stringify(value));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const after = (variant = 'completed') => parseCampaign(JSON.stringify(history[variant]));
const start = (options = {}) => beginCampaignMission(after(), { missionId: 'MI10', walkerId: 'WK01', difficulty: 'story', seed: 1847, ...options });
const idle = (s, seconds, input = {}) => {
  for (let i = 0; i < Math.ceil(seconds * 60) && s.status === 'playing' && !s.decision.active; i++) updateGame(s, 1 / 60, { brace: true, ...input });
};
const disk = text => {
  const values = new Map([[CAMPAIGN_SAVE_KEY, text]]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const cache = new Map();
function complete(options = {}, deployment = {}) {
  const key = JSON.stringify([options, deployment]);
  if (!cache.has(key)) {
    let { campaign, game } = start(deployment);
    let checkpoints = 0;
    pilotMI10(game, { ...options, observe: (state, frame) => {
      if (frame % 240 === 0 && state.status === 'playing') {
        campaign = checkpointCampaign(campaign, state);
        checkpoints++;
      }
    } });
    assert.equal(game.status, 'won', key);
    const result = finishCampaignMission(campaign, game);
    assert.equal(result.applied, true);
    cache.set(key, { game, campaign: parseCampaign(serializeCampaign(result.campaign)), checkpoints });
  }
  return clone(cache.get(key));
}
function editReceipt(save, edit) {
  edit(save.completed.MI10);
  save.lastDebrief = clone(save.completed.MI10);
  save.world.thyr.chemical = Object.fromEntries(Object.keys(createChemicalDossier()).map(key => [key, clone(save.completed.MI10[key])]));
  return save;
}

test('v10 appends only an empty chemical dossier to both authentic native v9 exports', () => {
  assert.equal(CAMPAIGN_SAVE_VERSION, 10);
  assert.equal(fixtureBytes.length, 246853);
  assert.equal(hash(fixtureBytes), 'd5f6f49a02e8fb40f5bf830c7fcb40c5e2677dff3e2b0e0dbb7ea1a48ce42084');
  assert.equal(history.provenance.sourceRevision, '4846d0270b2976877f9b202848bfde6d2127fb1d');
  assert.equal(history.provenance.sourceTree, 'ef7b912c27fa672f1930c980ee529c165e3f77ec');
  assert.equal(history.provenance.verifiedHistoricBlobs, 1099);
  for (const variant of ['live', 'completed']) {
    const original = history[variant], migrated = after(variant), previous = clone(migrated);
    previous.version = 9; delete previous.world.thyr.chemical;
    assert.deepEqual(previous, original, variant);
    assert.deepEqual(migrated.world.thyr.chemical, createChemicalDossier());
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
    const path = history.provenance.nativeVariants[variant].path;
    const native = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(hash(native), history.provenance.sourceHashes[path].sha256);
    assert.equal(native.length, history.provenance.sourceHashes[path].bytes);
    assert.deepEqual(JSON.parse(native), original);
  }
  assert.deepEqual(restoreCampaignGame(after('live')), history.live.checkpoint);
  assert.equal(after().stage, 'complete'); assert.equal(nextCampaignMissionId(after()), 'MI10');
});

test('all eight older fixtures retain their bytes and all eighteen historical variants still load', () => {
  for (const [path, expected] of Object.entries(history.provenance.protectedHistoricalFixtures)) {
    const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(bytes.length, expected.bytes, path); assert.equal(hash(bytes), expected.sha256, path);
    for (const variant of ['live', 'completed']) {
      const source = JSON.parse(bytes)[variant], migrated = parseCampaign(JSON.stringify(source));
      assert.equal(migrated.version, 10); assert.deepEqual(migrated.completed, source.completed);
      assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
      assert.deepEqual(migrated.world.thyr.chemical, createChemicalDossier());
    }
  }
  for (const variant of ['live', 'completed']) assert.equal(after(variant).version, 10);
});

test('historical stage complete still selects the first missing report, including MI09 before MI10', () => {
  const bytes = readFileSync(new URL('../docs/validation/native-v10/native-v9-after-upgrade.json', import.meta.url));
  assert.equal(hash(bytes), '54f53b98e031e040845761feb263114a80d6573607b5ba070481f56ba425d18e');
  const save = parseCampaign(bytes.toString());
  assert.equal(save.stage, 'complete'); assert.equal(Object.keys(save.completed).length, 8);
  assert.equal(nextCampaignMissionId(save), 'MI09');
  assert.equal(beginCampaignMission(save, { missionId: 'MI10' }).ok, false);
});

test('reading v9 never writes; its first write preserves the original and version 11 stays protected', () => {
  const original = JSON.stringify(history.live), storage = disk(original), loaded = readCampaign(storage);
  assert.equal(loaded.blocked, false); assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), original);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), null);
  assert.equal(writeCampaign(storage, loaded.campaign).ok, true);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), original);
  const future = JSON.stringify({ ...createCampaign(), version: 11 });
  storage.values.set(CAMPAIGN_SAVE_KEY, future);
  const blocked = readCampaign(storage); assert.equal(blocked.blocked, true);
  assert.equal(writeCampaign(storage, blocked.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('v9 cannot smuggle a future scene, report or chemical world state through migration', () => {
  const edits = [save => { save.world.thyr.chemical = {}; }, save => { save.completed.MI10 = {}; },
    save => { save.activeMissionId = 'MI10'; }, save => { save.checkpoint.missionId = 'MI10'; },
    save => { save.checkpoint.chemical = {}; }, save => { save.preDecisionCheckpoint = clone(save.checkpoint); save.preDecisionCheckpoint.chemical = {}; }];
  for (const edit of edits) {
    const save = clone(history.live); edit(save);
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/);
  }
});

test('MI10 inherits exactly five route facts, no people or proof, after the first MI09 report only', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI10' }).ok, false);
  assert.equal(beginCampaignMission(after('live'), { missionId: 'MI10' }).ok, false);
  const original = after(), text = serializeCampaign(original), deployed = start();
  assert.equal(deployed.ok, true); assert.equal(serializeCampaign(original), text);
  assert.deepEqual(deployed.campaign.resources, original.resources);
  assert.deepEqual(deployed.campaign.completed, original.completed);
  assert.deepEqual(deployed.campaign.world, original.world);
  assert.deepEqual(deployed.game.campaign.context, { routeRecorded: true, routeChoice: 'defy', routeApproach: 'guided', routePassagePreserved: true, routeHarvestFragile: false });
  assert.equal(deployed.game.campaign.pt02Acquired, false); assert.equal(deployed.game.stats.evidence, 0);
  assert.deepEqual(deployed.game.civilians, []); assert.equal(Object.hasOwn(deployed.game.chemical, 'people'), false);
  assert.equal(Object.hasOwn(deployed.game, 'livingRoute'), false);
  assert.deepEqual(restoreCampaignGame(deployed.campaign), deployed.game);
});

for (const [label, stopAt] of [
  ['collector work', state => state.chemical.collector.progress > .3],
  ['defended sampling', state => state.chemical.sampler.progress > .45],
  ['demolition flow', state => state.campaign.tanksDestroyed === 3 && state.campaign.spillInTransit > 50],
]) test(`MI10 ${label} survives an exact export, detached restore and deterministic continuation`, () => {
  let { campaign, game } = start({ walkerId: 'WK09' });
  pilotMI10(game, { choice: 'obey', stopAt }); assert.equal(game.status, 'playing');
  campaign = checkpointCampaign(campaign, game);
  const saved = parseCampaign(serializeCampaign(campaign)), restored = restoreCampaignGame(saved);
  assert.deepEqual(restored, game); assert.deepEqual(saved.completed, history.completed.completed);
  assert.deepEqual(saved.resources, history.completed.resources);
  const detached = restoreCampaignGame(saved); detached.player.ammo--;
  assert.notDeepEqual(detached, restoreCampaignGame(saved));
  pilotMI10(game, { choice: 'obey' }); pilotMI10(restored, { choice: 'obey' });
  assert.equal(game.status, 'won'); assert.deepEqual(restored, game);
  assert.equal(finishCampaignMission(saved, restored).applied, true);
});

test('MI10 parser rejects invented bodies, capacities, identities, acts, counts and prior context', () => {
  const original = start().campaign;
  const edits = [
    save => { save.checkpoint.chemical.people = []; },
    save => { save.checkpoint.chemical.tanks.pop(); },
    save => { save.checkpoint.chemical.tanks[0].id = 'chemical-tank-2'; },
    save => { save.checkpoint.chemical.tanks[0].role = 'active'; },
    save => { save.checkpoint.chemical.tanks[0].maxHp++; },
    save => { save.checkpoint.chemical.canals[0].controlX++; },
    save => { save.checkpoint.chemical.sampler.sourceId = 'chemical-tank-1'; },
    save => { save.checkpoint.chemical.tanks[0].identified = true; },
    save => { save.checkpoint.chemical.homes[0].habitable = false; },
    save => { save.checkpoint.chemical.sampler.volumeCollected = 5; },
    save => { save.checkpoint.chemical.record.copied = true; },
    save => { save.checkpoint.chemical.collector.closed = true; },
    save => { save.checkpoint.chemical.alert.triggered = true; },
    save => { save.checkpoint.chemical.water.resolved = true; },
    save => { save.checkpoint.chemical.report.transmitted = true; },
    save => { save.checkpoint.campaign.tanksInspected = 3; },
    save => { save.checkpoint.campaign.context.routeApproach = 'surveyed'; },
    save => { save.checkpoint.stats.evidence = 1; },
    save => { save.checkpoint.stats.collateral = 1; },
    save => { save.checkpoint.stats.kills = 1; },
    save => { save.checkpoint.decision.choice = 'delay'; },
    save => { save.checkpoint.objectives[0].complete = true; },
    save => { save.resources.fuel = 2; },
    save => { save.world.thyr.chemical.pt02Acquired = true; },
  ];
  edits.forEach((edit, index) => { const save = clone(original); edit(save);
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/, `mutation ${index + 1}`); });
});

test('MI10 instant work, absent anchoring and damage before private arrival are rejected', () => {
  let { campaign, game } = start();
  pilotMI10(game, { stopAt: state => state.chemical.collector.progress > .3 });
  campaign = checkpointCampaign(campaign, game);
  const edits = [
    save => { save.checkpoint.chemical.collector.progress = .99; },
    save => { save.checkpoint.player.braced = false; },
    save => { save.checkpoint.player.feet[0].contact = false; },
    save => { save.checkpoint.player.x = 1700; },
    save => { save.checkpoint.enemies[0].hp--; },
  ];
  edits.forEach((edit, index) => { const save = clone(campaign); edit(save);
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/, `work mutation ${index + 1}`); });
});

test('MI10 valid variable frames up to the public 50 ms cap preserve leak, work and arrival clocks', () => {
  let { campaign, game } = start(); moveMI10(game, 430); idle(game, 2);
  assert.equal(commandGame(game, 'interact'), true);
  const deltas = [.05, .004, .031, .013, .022];
  for (let frame = 0; game.elapsed < 125; frame++) {
    updateGame(game, deltas[frame % deltas.length], { brace: true });
    if (frame % 180 === 0) campaign = checkpointCampaign(campaign, game);
  }
  assert.equal(game.chemical.collector.closed, true); assert.ok(game.campaign.spillRetained > 50);
  assert.equal(game.chemical.alert.triggered, false);
  campaign = checkpointCampaign(campaign, game);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
});

test('MI10 choosing an order changes no material object and prechoice cannot undo it at the same clock', () => {
  let { campaign, game } = start();
  pilotMI10(game, { stopAt: state => state.decision.active }); assert.equal(game.decision.active, true);
  campaign = checkpointCampaign(campaign, game, { beforeDecision: true });
  const before = clone(game), material = chemicalReceiptRoster(game), elapsed = game.elapsed;
  assert.deepEqual(restoreCampaignGame(campaign, { beforeDecision: true }), before);
  updateGame(game, 10, { interact: true, move: 1, fire: true }); assert.deepEqual(game, before);
  assert.equal(commandGame(game, 'choice', 'obey'), true); assert.equal(game.elapsed, elapsed);
  assert.deepEqual(chemicalReceiptRoster(game), material); assert.equal(game.campaign.operationsResolved, false);
  campaign = checkpointCampaign(campaign, game);
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
  assert.throws(() => checkpointCampaign(campaign, before), /choix acquis annulé/);
  const foreign = clone(campaign); foreign.preDecisionCheckpoint.seed++;
  assert.throws(() => parseCampaign(JSON.stringify(foreign)), /autre sortie/);
});

for (const choice of ['obey', 'defy']) test(`MI10 ${choice} records its complete physical roster once and preserves MI01–MI09`, () => {
  const { campaign: saved, game, checkpoints } = complete({ choice });
  const receipt = saved.completed.MI10;
  assert.ok(checkpoints > 40); assert.equal(receipt.plan, choice === 'obey' ? 'demolish' : 'secure');
  assert.equal(receipt.tanksDestroyed, choice === 'obey' ? 3 : 0);
  assert.equal(receipt.tanksSecured, choice === 'defy' ? 3 : 0);
  assert.equal(receipt.copiedMarks, 3); assert.equal(receipt.orisonRecordCopied, true);
  assert.equal(receipt.sampleCollected, true); assert.equal(receipt.pt02Acquired, true);
  assert.equal(receipt.privateNeutralized, 3); assert.equal(receipt.homesHabitable, 2);
  assert.equal(receipt.canalsIntact, 2); assert.equal(receipt.canalsPolluted, 0);
  assert.equal(receipt.roster.tanks.length, 3); assert.equal(receipt.roster.canals.length, 2);
  assert.equal(receipt.roster.homes.length, 2); assert.equal(receipt.roster.privateForces.length, 3);
  assert.equal(Object.hasOwn(receipt.roster, 'people'), false); assert.equal(receipt.collateral, 0);
  assert.equal(Object.hasOwn(receipt, 'TE01'), false); assert.equal(Object.hasOwn(receipt, 'palinodeProven'), false);
  assert.deepEqual(Object.fromEntries(Object.entries(saved.completed).filter(([id]) => id !== 'MI10')), history.completed.completed);
  for (const key of ['vesper', 'nacre']) assert.deepEqual(saved.world[key], history.completed.world[key]);
  assert.deepEqual(saved.world.thyr.route, history.completed.world.thyr.route);
  assert.equal(saved.resources.parts, 46); assert.equal(saved.resources.fuel, 0);
  assert.equal(nextCampaignMissionId(saved), null);
  const text = serializeCampaign(saved);
  assert.equal(finishCampaignMission(saved, game).applied, false); assert.equal(serializeCampaign(saved), text);
  game.chemical.tanks[0].hp = 0; assert.equal(serializeCampaign(saved), text);
});

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI10 ${walker.id}/${choice} accepts a normal-difficulty campaign receipt`, () => {
  const { campaign } = complete({ choice }, { walkerId: walker.id, difficulty: 'normal' });
  const receipt = campaign.completed.MI10;
  assert.equal(receipt.walkerId, walker.id); assert.equal(receipt.choice, choice);
  assert.equal(receipt.reportTransmitted, true); assert.equal(receipt.pt02Acquired, true);
  assert.equal(campaign.resources.parts, 46);
});

const adverse = [
  [{ destroySourceBeforeSample: true }, receipt => { assert.equal(receipt.sampleStarted, false); assert.equal(receipt.sampleLost, true); assert.equal(receipt.pt02Acquired, false); }],
  [{ destroySamplerDuringSample: true }, receipt => { assert.equal(receipt.sampleStarted, true); assert.equal(receipt.sampleLost, true); assert.equal(receipt.pt02Acquired, false); }],
  [{ destroyRecordBeforeCopy: true }, receipt => { assert.equal(receipt.sampleCollected, true); assert.equal(receipt.orisonRecordInspected, true); assert.equal(receipt.orisonRecordCopied, false); assert.equal(receipt.pt02Acquired, false); }],
  [{ destroyOriginalsAfterSample: true }, receipt => { assert.equal(receipt.roster.tanks[2].destroyed, true); assert.equal(receipt.roster.sampler.destroyed, true); assert.equal(receipt.orisonRecordLost, true); assert.equal(receipt.pt02Acquired, true); }],
  [{ destroyCanal: 1 }, receipt => { assert.equal(receipt.canalsIntact, 1); assert.equal(receipt.homesHabitable, 0); assert.equal(receipt.waterRestored, false); }],
  [{ destroyCollector: true }, receipt => { assert.equal(receipt.collectorDestroyed, true); assert.equal(receipt.collectorClosed, false); assert.equal(receipt.spillRetained, 0); assert.equal(receipt.homesHabitable, 0); }],
  [{ choice: 'obey', skipCollector: true }, receipt => { assert.ok(Math.abs(receipt.spillDelivered - 295) < 1e-6); assert.equal(receipt.canalsCovered, 2); assert.equal(receipt.canalsPolluted, 2); assert.equal(receipt.homesHabitable, 0); assert.equal(receipt.waterRestored, true); }],
];
for (const [options, verify] of adverse) test(`MI10 adverse receipt remains exact ${JSON.stringify(options)}`, () => {
  const { campaign } = complete(options); verify(campaign.completed.MI10);
  assert.equal(campaign.resources.parts, 46); assert.equal(campaign.completed.MI10.collateral, 0);
  assert.deepEqual(campaign.world.nacre, history.completed.world.nacre);
});

test('MI10 inspecting three actual ruins records no marks and cannot create PT02', () => {
  let { campaign, game } = start();
  pilotMI10(game, { stopAt: state => state.chemical.collector.closed });
  for (const tank of game.chemical.tanks) fireAtMI10(game, tank.id);
  assert.equal(game.campaign.tanksDestroyed, 3); campaign = checkpointCampaign(campaign, game);
  pilotMI10(game); assert.equal(game.status, 'won');
  const saved = parseCampaign(serializeCampaign(finishCampaignMission(campaign, game).campaign));
  assert.equal(saved.completed.MI10.tanksInspected, 3); assert.equal(saved.completed.MI10.copiedMarks, 0);
  assert.equal(saved.completed.MI10.sampleLost, true); assert.equal(saved.completed.MI10.pt02Acquired, false);
  const forged = editReceipt(clone(saved), receipt => { receipt.copiedMarks = 3; receipt.roster.tanks.forEach(tank => { tank.identified = true; tank.identifiedAt = tank.inspectedAt; }); });
  assert.throws(() => parseCampaign(JSON.stringify(forged)), /marquage recréé après rupture/);
});

test('MI10 replay cannot replace a truthful failed sample with a later successful one or pay twice', () => {
  const { campaign } = complete({ destroyRecordBeforeCopy: true }), before = serializeCampaign(campaign);
  assert.equal(campaign.completed.MI10.pt02Acquired, false);
  const replay = beginCampaignMission(campaign, { missionId: 'MI10', walkerId: 'WK10', difficulty: 'story' });
  assert.equal(replay.replay, true); pilotMI10(replay.game); assert.equal(replay.game.status, 'won');
  assert.equal(replay.game.campaign.pt02Acquired, true);
  assert.equal(checkpointCampaign(campaign, replay.game, { replay: true }), campaign);
  const result = finishCampaignMission(campaign, replay.game, { replay: true });
  assert.equal(result.applied, false); assert.equal(result.receipt.pt02Acquired, false);
  assert.equal(serializeCampaign(result.campaign), before);
});

test('matching receipt, world dossier and debrief cannot conceal impossible chemical objects or chronology', () => {
  const original = complete().campaign;
  const edits = [
    receipt => { receipt.roster.tanks.pop(); },
    receipt => { receipt.roster.tanks[0].id = 'fabricated'; },
    receipt => { receipt.roster.tanks[0].maxHp++; },
    receipt => { receipt.roster.tanks[0].volume--; },
    receipt => { receipt.roster.tanks[0].securedAt++; },
    receipt => { receipt.roster.tanks[0].inspectedAt = 0; receipt.roster.tanks[0].identifiedAt = 0; },
    receipt => { receipt.roster.sampler.startedAt = receipt.roster.sampler.collectedAt - 1; },
    receipt => { receipt.roster.record.copiedAt++; },
    receipt => { receipt.roster.collector.controlX++; },
    receipt => { receipt.roster.plumes.pop(); },
    receipt => { receipt.roster.plumes[0].sourceId = 'chemical-tank-1'; },
    receipt => { receipt.roster.plumes[0].x--; },
    receipt => { receipt.roster.plumes[0].arrivedAt = receipt.roster.plumes[0].releasedAt; },
    receipt => { receipt.roster.plumes[0].arrivedAt += 2; },
    receipt => { receipt.roster.plumes[0].mass++; receipt.roster.tanks[2].volume--; receipt.sourceVolume--; receipt.roster.spill.totalReleased++; receipt.spillReleased++; receipt.spillRetained++; },
    receipt => { receipt.roster.privateForces[0].maxHp = Math.round(ENEMY_TYPES.drone.hp * DIFFICULTIES.veteran.enemyHealth); },
    receipt => { receipt.roster.privateForces[0].hp = 1; },
    receipt => { receipt.roster.alert.readyAt += 2; },
    receipt => { receipt.roster.report.progress = 0; },
    receipt => { receipt.pt02Acquired = false; },
    receipt => { receipt.TE01 = true; },
    receipt => { receipt.palinodeProven = true; },
    receipt => { receipt.partsGranted = 8; },
    receipt => { receipt.choice = 'delay'; },
  ];
  edits.forEach((edit, index) => {
    const save = editReceipt(clone(original), edit);
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/, `receipt mutation ${index + 1}`);
  });
});

test('a physically balanced source cannot leak faster than its clock even when every aggregate is edited', () => {
  const save = editReceipt(complete().campaign, receipt => {
    const d = receipt.roster, plume = d.plumes[0];
    plume.mass += 10; d.tanks[2].volume -= 10; d.spill.totalReleased += 10;
    receipt.sourceVolume -= 10; receipt.spillReleased += 10; receipt.spillRetained += 10;
  });
  assert.throws(() => parseCampaign(JSON.stringify(save)), /débit|horloge|fuite/);
});

test('matching delivered mass and contamination cannot route a plume through a collector closed at its crossing', () => {
  const save = editReceipt(complete().campaign, receipt => {
    const d = receipt.roster, plume = d.plumes[0];
    Object.assign(plume, { phase: 'delivered', x: 4780, y: terrainAt(4780, 'PL03') - 5,
      arrivedAt: plume.releasedAt + (4780 - 2000) / 90, passedCanals: 2, deposits: [plume.mass, plume.mass] });
    receipt.spillRetained -= plume.mass; receipt.spillDelivered += plume.mass;
    d.canals.forEach(canal => { canal.contamination += plume.mass; });
  });
  assert.throws(() => parseCampaign(JSON.stringify(save)), /collecteur fermé/);
});

test('MI10 report cannot precede collection even when twenty seconds and matching alert dates are forged', () => {
  const save = editReceipt(complete().campaign, receipt => {
    const d = receipt.roster, end = d.report.transmittedAt + 1;
    Object.assign(d.sampler, { firstStartedAt: end - 20, startedAt: end - 20, completedAt: end, collectedAt: end });
    Object.assign(d.alert, { triggeredAt: end - 20, readyAt: end - 15, elapsed: 5 });
  });
  assert.throws(() => parseCampaign(JSON.stringify(save)), /rapport|prélèvement/);
});

test('MI10 water operation cannot be dated before the actual operations on the three tanks', () => {
  const save = editReceipt(complete().campaign, receipt => {
    const d = receipt.roster, before = Math.min(...d.tanks.map(tank => tank.securedAt)) - 1;
    Object.assign(d.water, { startedAt: before - 4, completedAt: before, resolvedAt: before });
  });
  assert.throws(() => parseCampaign(JSON.stringify(save)), /eau|cuves|opérations/);
});

test('pollution cannot be erased by editing both household flags and all declared counts', () => {
  const save = editReceipt(complete({ choice: 'obey', skipCollector: true }).campaign, receipt => {
    receipt.canalsPolluted = 0; receipt.homesHabitable = 2; receipt.villageHabitable = true;
    receipt.roster.canals.forEach(canal => { canal.contamination = 0; });
    receipt.roster.homes.forEach(home => { home.habitable = true; });
  });
  assert.throws(() => parseCampaign(JSON.stringify(save)), /dépôts/);
});

test('source exhaustion without a broken shell is an exact resumable failure of sampling', () => {
  let { campaign, game } = start(); idle(game, 202);
  assert.equal(game.campaign.sampleLost, true); assert.equal(game.chemical.tanks[2].destroyed, false);
  campaign = checkpointCampaign(campaign, game);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
  const forged = clone(campaign); forged.checkpoint.chemical.sampler.lostAt = 1;
  forged.checkpoint.chemical.alert.triggeredAt = 1; forged.checkpoint.chemical.alert.readyAt = 6;
  assert.throws(() => parseCampaign(JSON.stringify(forged)), /perte|fuite|source/);
});

test('MI10 source damage after transmission keeps its historical report and locks extraction during the new flow', () => {
  let { campaign, game } = start(); pilotMI10(game, { stopAt: state => state.chemical.report.transmitted });
  campaign = checkpointCampaign(campaign, game); const reportTime = game.chemical.report.transmittedAt;
  fireAtMI10(game, 'chemical-tank-3'); assert.equal(game.campaign.flowResolved, false);
  assert.equal(game.campaign.pt02Acquired, true); assert.equal(game.extraction.active, false);
  campaign = checkpointCampaign(campaign, game);
  const restored = restoreCampaignGame(parseCampaign(serializeCampaign(campaign)));
  assert.deepEqual(restored, game); assert.equal(restored.chemical.report.transmittedAt, reportTime);
  pilotMI10(restored); assert.equal(restored.status, 'won');
  const saved = finishCampaignMission(campaign, restored).campaign;
  assert.equal(saved.completed.MI10.roster.report.transmittedAt, reportTime);
  assert.equal(saved.completed.MI10.pt02Acquired, true); assert.equal(saved.completed.MI10.homesHabitable, 0);
  assert.equal(parseCampaign(serializeCampaign(saved)).completed.MI10.flowResolved, true);
});

test('MI10 reopening or destroying the diversion valve does not rewrite matter already retained in the basin', () => {
  let { campaign, game } = start(); pilotMI10(game, { choice: 'obey', stopAt: state => state.chemical.water.resolved });
  campaign = checkpointCampaign(campaign, game); const retained = clone(game.chemical.plumes);
  fireAtMI10(game, 'chemical-collector'); campaign = checkpointCampaign(campaign, game);
  assert.deepEqual(game.chemical.plumes, retained); assert.equal(game.campaign.collectorDestroyed, true);
  const saved = parseCampaign(serializeCampaign(campaign)); assert.deepEqual(restoreCampaignGame(saved), game);
  const forged = clone(game); forged.chemical.plumes[0].arrivedAt += .1;
  assert.throws(() => checkpointCampaign(campaign, forged), /arrivée|retenu|réécrit/);
});

test('MI10 a later clock cannot repair an already destroyed canal in the official sortie', () => {
  let { campaign, game } = start(); pilotMI10(game, { stopAt: state => state.campaign.flowResolved && state.campaign.operationsResolved });
  const before = clone(game); campaign = checkpointCampaign(campaign, game);
  fireAtMI10(game, 'chemical-canal-1'); assert.equal(game.chemical.canals[0].destroyed, true);
  campaign = checkpointCampaign(campaign, game);
  const rewind = clone(before); rewind.elapsed = game.elapsed + 1;
  assert.throws(() => checkpointCampaign(campaign, rewind), /intégrité restituée|fait acquis annulé/);
});

test('MI10 terminal defeat receives no receipt and cannot restore either an older state or a revived walker', () => {
  let { campaign, game } = start({ difficulty: 'normal' });
  const initial = clone(game), resources = clone(campaign.resources), prior = clone(campaign.completed);
  pilotMI10(game, { noFire: true }); assert.equal(game.status, 'lost'); assert.equal(game.player.hull, 0);
  campaign = checkpointCampaign(campaign, game);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
  assert.throws(() => checkpointCampaign(campaign, initial), /recul|perdue/);
  const revived = clone(game); revived.status = 'playing'; revived.player.hull = 1;
  assert.throws(() => checkpointCampaign(campaign, revived), /perdue/);
  const result = finishCampaignMission(campaign, game);
  assert.equal(result.applied, false); assert.equal(result.receipt, null);
  assert.deepEqual(result.campaign.resources, resources); assert.deepEqual(result.campaign.completed, prior);
  const restarted = beginCampaignMission(result.campaign, { missionId: 'MI10', walkerId: 'WK01', restart: true });
  assert.equal(restarted.ok, true); assert.equal(restarted.game.status, 'playing'); assert.equal(restarted.game.elapsed, 0);
  assert.equal(restarted.game.campaign.pt02Acquired, false); assert.equal(restarted.game.chemical.spill.totalReleased, 0);
  assert.deepEqual(restarted.campaign.resources, resources); assert.deepEqual(restarted.campaign.completed, prior);
});
