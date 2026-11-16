import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  createCampaign, parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign,
  restoreCampaignGame, finishCampaignMission, nextCampaignMissionId, readCampaign, writeCampaign,
  CAMPAIGN_SAVE_VERSION, CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY,
} from '../src/campaign.mjs';
import { createWorkshopDossier, workshopContextFor } from '../src/workshop-validation.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI13 } from './helpers/mi13-driver.mjs';
import { pilotMI14 } from './helpers/mi14-driver.mjs';

const historicalSources = [
  ['campaign-v13-mi13.json', '8900617ce6c4496fa1c82d74ba76cd3718e0dc1df66ebdd5401650febf66208f'],
  ['campaign-v13-mi13-transfer.json', '3160ec519bc6817bed515b13f9bbc78be341aaa8b2ba689047d53e073e08ff55'],
];
const rawHistory = historicalSources.map(([name]) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const history = rawHistory.map(text => JSON.parse(text));
const clone = value => structuredClone(value);
const afterMI13 = () => parseCampaign(rawHistory[0]);
const start = (options = {}) => beginCampaignMission(afterMI13(), { missionId: 'MI14', walkerId: 'WK09', difficulty: 'story', seed: 1514, ...options });
const cache = new Map();
function complete(options = {}, deployment = {}) {
  const key = JSON.stringify([options, deployment]);
  if (!cache.has(key)) {
    let { campaign, game } = start(deployment), checkpoints = 0;
    pilotMI14(game, { ...options, observe: (state, frame) => {
      if (frame % 300 === 0 && state.status === 'playing') { campaign = checkpointCampaign(campaign, state); checkpoints++; }
    } });
    assert.equal(game.status, 'won', key);
    const result = finishCampaignMission(campaign, game); assert.equal(result.applied, true);
    cache.set(key, { game, campaign: parseCampaign(serializeCampaign(result.campaign)), checkpoints });
  }
  return clone(cache.get(key));
}
function editReceipt(save, edit) {
  edit(save.completed.MI14); save.lastDebrief = clone(save.completed.MI14);
  save.world.kharon.workshop = Object.fromEntries(Object.keys(createWorkshopDossier()).map(key => [key, clone(save.completed.MI14[key])]));
  return save;
}
function disk(text) {
  const values = new Map([[CAMPAIGN_SAVE_KEY, text]]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('the two v13 fixtures are immutable exports from the retained reconstruction commit', () => {
  historicalSources.forEach(([name, expected], index) => {
    assert.equal(createHash('sha256').update(rawHistory[index]).digest('hex'), expected, name);
    assert.equal(history[index].version, 13);
  });
  assert.equal(Object.keys(history[0].completed).length, 13);
  assert.equal(history[1].checkpoint.foundry.cargo[0].transfer.progress, 0.5533333333333323);
});

for (const [index, label] of ['completed MI13', 'interrupted MI13 transfer'].entries()) test(`v13 migration preserves ${label} and appends only the empty workshop`, () => {
  const old = clone(history[index]), migrated = parseCampaign(rawHistory[index]), historical = clone(migrated);
  assert.equal(CAMPAIGN_SAVE_VERSION, 14); assert.equal(migrated.version, 14);
  assert.deepEqual(migrated.world.kharon.workshop, createWorkshopDossier());
  historical.version = 13; delete historical.world.kharon.workshop;
  assert.deepEqual(historical, old); assert.deepEqual(history[index], old);
  assert.deepEqual(migrated.completed, old.completed);
  assert.deepEqual(migrated.resources, old.resources); assert.deepEqual(migrated.checkpoint, old.checkpoint);
  assert.deepEqual(migrated.preDecisionCheckpoint, old.preDecisionCheckpoint);
  assert.equal(nextCampaignMissionId(migrated), index === 0 ? 'MI14' : 'MI13');
  assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
});

test('the historical partial MI13 transfer can still be resumed and finished after v14 migration', () => {
  const campaign = parseCampaign(rawHistory[1]), game = restoreCampaignGame(campaign);
  assert.deepEqual(game, history[1].checkpoint);
  pilotMI13(game); assert.equal(game.status, 'won');
  const result = finishCampaignMission(campaign, game);
  assert.equal(result.applied, true); assert.equal(result.receipt.cargoTransferred, 2);
  assert.equal(nextCampaignMissionId(result.campaign), 'MI14');
  for (const [id, receipt] of Object.entries(history[1].completed)) assert.deepEqual(result.campaign.completed[id], receipt);
});

test('v13 cannot carry a future workshop, mission, report or checkpoint', () => {
  const edits = [s => { s.world.kharon.workshop = {}; }, s => { s.completed.MI14 = {}; },
    s => { s.activeMissionId = 'MI14'; }, s => { s.checkpoint.missionId = 'MI14'; },
    s => { s.checkpoint.workshop = {}; }, s => { s.preDecisionCheckpoint.workshop = {}; }];
  for (const edit of edits) {
    const malformed = clone(history[1]); edit(malformed);
    assert.throws(() => parseCampaign(JSON.stringify(malformed)), /Sauvegarde invalide/);
  }
});

test('reading v13 is nondestructive, the first v14 write backs up the exact original, and future versions remain protected', () => {
  const storage = disk(rawHistory[1]), loaded = readCampaign(storage);
  assert.equal(loaded.blocked, false); assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), rawHistory[1]);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), null);
  assert.equal(writeCampaign(storage, loaded.campaign).ok, true);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), rawHistory[1]);
  const future = JSON.stringify({ ...createCampaign(), version: CAMPAIGN_SAVE_VERSION + 1 });
  storage.values.set(CAMPAIGN_SAVE_KEY, future);
  const blocked = readCampaign(storage); assert.equal(blocked.blocked, true);
  assert.equal(writeCampaign(storage, blocked.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('MI14 requires MI13 and inherits its actual provenance and cargo outcome without moving historical people', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI14' }).ok, false);
  assert.equal(beginCampaignMission(parseCampaign(rawHistory[1]), { missionId: 'MI14' }).ok, false);
  const before = afterMI13(), result = start(); assert.equal(result.ok, true);
  assert.deepEqual(result.game.campaign.context, workshopContextFor(before));
  assert.deepEqual(result.campaign.resources, before.resources);
  assert.deepEqual(result.campaign.world.nacre, before.world.nacre);
  assert.deepEqual(result.campaign.completed, before.completed);
  assert.deepEqual(restoreCampaignGame(result.campaign), result.game);
  assert.equal(result.game.campaign.workersTotal, 8); assert.equal(result.game.campaign.workersLost, 0);
  assert.equal(result.game.campaign.publicReleased, false); assert.equal(result.game.campaign.defected, false);
});

for (const choice of ['obey', 'defy']) test(`MI14 ${choice} records one physical result, one reward and preserves thirteen previous reports`, () => {
  const prior = afterMI13(), result = complete({ choice }), save = result.campaign, receipt = save.completed.MI14;
  assert.equal(Object.keys(save.completed).length, 14); assert.equal(nextCampaignMissionId(save), null);
  assert.deepEqual(save.resources, { ...prior.resources, parts: prior.resources.parts + 4 });
  for (const [id, report] of Object.entries(prior.completed)) assert.deepEqual(save.completed[id], report);
  assert.deepEqual(save.world.nacre, prior.world.nacre); assert.deepEqual(save.world.thyr, prior.world.thyr);
  assert.equal(receipt.workersAlive, 8); assert.equal(receipt.workersLost, 0); assert.equal(receipt.workersSheltered, 8);
  assert.equal(receipt.coolerRepaired, true); assert.equal(receipt.lotRecordCopied, true);
  assert.equal(receipt.productionOnline, choice === 'obey'); assert.equal(receipt.strikePreserved, choice === 'defy');
  assert.equal(receipt.mechanicsAvailable, choice === 'defy' ? 2 : 0);
  assert.equal(receipt.publicReleased, false); assert.equal(receipt.defected, false);
  assert.equal(receipt.roster.workers.length, 8); assert.equal(receipt.roster.workers.filter(w => w.displaced).length, 3);
  assert.ok(result.checkpoints > 4);
  const repeated = finishCampaignMission(save, result.game);
  assert.equal(repeated.applied, false); assert.deepEqual(repeated.campaign, save);
  const replay = beginCampaignMission(save, { missionId: 'MI14', walkerId: 'WK09', difficulty: 'story', replay: true });
  assert.equal(replay.replay, true); pilotMI14(replay.game, { choice: choice === 'obey' ? 'defy' : 'obey' });
  assert.equal(replay.game.status, 'won');
  const replayed = finishCampaignMission(save, replay.game, { replay: true });
  assert.equal(replayed.applied, false); assert.deepEqual(replayed.campaign, save);
});

const stageConditions = {
  crossing: s => s.workshop.workers.some(w => w.routeProgress > .25 && !w.sheltered),
  repair: s => s.workshop.cooler.repair.working && s.workshop.cooler.repair.progress > .3,
  copy: s => s.workshop.lot.working && s.workshop.lot.progress > .3,
  decision: s => s.decision.active,
  cooperation: s => s.workshop.cooperation.working && s.workshop.cooperation.progress > .3,
};
function stagePoint(stage) {
  const { campaign, game } = start(); pilotMI14(game, { stopAt: stageConditions[stage] });
  assert.ok(stageConditions[stage](game), stage); assert.equal(game.status, 'playing');
  return checkpointCampaign(campaign, game, { beforeDecision: stage === 'decision' });
}
for (const stage of Object.keys(stageConditions)) test(`MI14 ${stage} resumes the exact people, material work and deterministic clock`, () => {
  const save = stagePoint(stage), decoded = parseCampaign(serializeCampaign(save));
  assert.deepEqual(decoded, save);
  const a = restoreCampaignGame(save), b = restoreCampaignGame(decoded);
  assert.deepEqual(b, a);
  if (a.decision.active) { commandGame(a, 'choice', 'defy'); commandGame(b, 'choice', 'defy'); }
  for (let frame = 0; frame < 180; frame++) {
    updateGame(a, 1 / 60, { brace: true }); updateGame(b, 1 / 60, { brace: true });
  }
  assert.deepEqual(b, a);
  pilotMI14(b); assert.equal(b.status, 'won');
  const finished = finishCampaignMission(decoded, b);
  assert.equal(finished.receipt.workersLost, 0); assert.equal(finished.receipt.mechanicsAvailable, 2);
});

test('MI14 imports reject altered bodies, work clocks, provenance and fabricated posthumous cooperation', () => {
  const original = stagePoint('repair');
  const edits = [
    s => { s.checkpoint.workshop.cooler.repair.progress = 1.25; },
    s => { s.checkpoint.workshop.cooler.repair.startedAt = s.checkpoint.elapsed + 5; },
    s => { s.checkpoint.workshop.workers[0].name = 'Personne inventée'; },
    s => { s.checkpoint.workshop.workers[0].shelterX += 100; },
    s => { s.checkpoint.campaign.workersAlive = 7; },
    s => { s.checkpoint.campaign.context.pt03Acquired = !s.checkpoint.campaign.context.pt03Acquired; },
    s => { s.checkpoint.workshop.cooperation.agreed = true; },
  ];
  for (const edit of edits) { const changed = clone(original); edit(changed); assert.throws(() => parseCampaign(JSON.stringify(changed)), /Sauvegarde invalide/); }
  const completed = complete().campaign;
  for (const edit of [
    r => { r.workersAlive = 7; }, r => { r.mechanicsAvailable = 3; },
    r => { r.roster.workers[0].alive = false; }, r => { r.publicReleased = true; },
    r => { r.roster.report.transmittedAt = r.elapsed + 1; },
  ]) assert.throws(() => parseCampaign(JSON.stringify(editReceipt(clone(completed), edit))), /Sauvegarde invalide/);
});

for (const [name, options, check] of [
  ['lot lost before copy', { destroyLotBeforeCopy: true }, r => { assert.equal(r.lotRecordCopied, false); assert.equal(r.localSabotageRecorded, false); }],
  ['original lost after copy', { destroyLotAfterCopy: true }, r => { assert.equal(r.lotRecordCopied, true); assert.equal(r.roster.lot.destroyed, true); }],
  ['cooler lost after repair', { destroyCoolerAfterRepair: true }, r => { assert.equal(r.coolerRepaired, true); assert.equal(r.coolerDestroyed, true); assert.equal(r.mechanicsAvailable, 0); assert.match(r.tessLine, /perdu après sa réparation/); }],
  ['mechanic lost after agreement', { destroyWorkerAfterCooperation: true }, r => { assert.equal(r.mechanicsCooperating, true); assert.equal(r.mechanicsAvailable, 1); assert.equal(r.workersLost, 1); }],
]) test(`MI14 ${name} survives report serialization without rewriting the acquired history`, () => {
  const { campaign } = complete(options), reloaded = parseCampaign(serializeCampaign(campaign));
  check(reloaded.completed.MI14); assert.deepEqual(reloaded, campaign);
});

test('MI14 terminal failure stays terminal across reload and cannot reopen an older choice', () => {
  const point = stagePoint('decision'), game = restoreCampaignGame(point);
  commandGame(game, 'choice', 'defy');
  // A unit fixture applies terminal hull damage; this is not a claim of a played combat death.
  game.player.hull = 0; updateGame(game, 1 / 60, { brace: true });
  assert.equal(game.status, 'lost');
  const result = finishCampaignMission(point, game); assert.equal(result.applied, false);
  const reloaded = parseCampaign(serializeCampaign(result.campaign));
  assert.equal(restoreCampaignGame(reloaded).status, 'lost');
  assert.equal(restoreCampaignGame(reloaded, { beforeDecision: true }), null);
  assert.deepEqual(reloaded.resources, point.resources); assert.equal(reloaded.completed.MI14, undefined);
});

