import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALKERS } from '../src/content.mjs';
import { updateGame, commandGame } from '../src/simulation.mjs';
import { pilotMI02 } from './helpers/mi02-driver.mjs';
import {
  CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY, CAMPAIGN_SAVE_VERSION,
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  nextCampaignMissionId, beginCampaignMission, checkpointCampaign,
  restoreCampaignGame, finishCampaignMission, repairCampaignPipe, serviceCampaignWalker,
} from '../src/campaign.mjs';

const legacy = JSON.parse(readFileSync(new URL('./fixtures/campaign-v1-mi01.json', import.meta.url), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const completedVesper = () => parseCampaign(JSON.stringify(legacy.completed));
function memoryStorage(primary, backup) {
  const values = new Map();
  if (primary !== undefined) values.set(CAMPAIGN_SAVE_KEY, primary);
  if (backup !== undefined) values.set(CAMPAIGN_BACKUP_KEY, backup);
  return { values, failKey: null,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { if (key === this.failKey) throw new Error('Quota exceeded'); values.set(key, String(value)); },
  };
}

function finishLegacySortie(campaign) {
  const game = restoreCampaignGame(campaign);
  for (let frame = 0; frame < 24000 && game.status === 'playing'; frame++) {
    if (game.decision.active) commandGame(game, 'choice', 'defy');
    const p = game.player, scene = game.campaign;
    const target = game.enemies.filter(enemy => !enemy.dead && enemy.active && Math.abs(enemy.x - p.x) < 1050)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const destination = !scene.filtersDelivered ? game.mission.deliveryX + 200 : !scene.manifestRead ? game.evidence.x : !game.decision.resolved ? game.mission.decisionX : game.extraction.x;
    let move = Math.abs(destination - p.x) > 50 ? Math.sign(destination - p.x) : 0;
    if (target && Math.abs(target.x - p.x) < 680) move = 0;
    if (scene.filtersDelivered && !scene.manifestRead && Math.abs(p.x - game.evidence.x) < 190) {
      if (!game.evidence.scanning) commandGame(game, 'interact'); move = 0;
    }
    if (scene.manifestRead && !game.decision.resolved && Math.abs(p.x - game.mission.decisionX) < 250) { commandGame(game, 'interact'); move = 0; }
    if (!game.convoy.arrived && p.x > game.convoy.x + 360 && move > 0) move = 0;
    const vent = p.heat > 75 || p.overheated;
    updateGame(game, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent,
      secondary: Boolean(target) && !vent && target.hp > 160, aimX: target?.x, aimY: target?.y });
  }
  assert.equal(game.status, 'won');
  return finishCampaignMission(campaign, game);
}

test('the real v0.2 checkpoint preserves old state and resumes public actions with its documented finite reserve', () => {
  assert.equal(legacy.live.version, 1);
  const old = clone(legacy.live);
  const migrated = parseCampaign(JSON.stringify(old));
  assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
  assert.equal(nextCampaignMissionId(migrated), 'MI01');
  const withoutNewFields = clone(migrated);
  withoutNewFields.version = 1; delete withoutNewFields.world.vesper.rail;
  delete withoutNewFields.world.vesper.communications;
  delete withoutNewFields.world.vesper.industrial;
  delete withoutNewFields.world.thyr; delete withoutNewFields.world.nacre; delete withoutNewFields.resources.fuel;
  for (const condition of Object.values(withoutNewFields.fleet)) delete condition.radiator;
  for (const id of Object.keys(withoutNewFields.fleet)) if (!Object.hasOwn(old.fleet, id)) delete withoutNewFields.fleet[id];
  for (const checkpoint of [withoutNewFields.checkpoint, withoutNewFields.preDecisionCheckpoint]) if (checkpoint) {
    delete checkpoint.player.reserveAmmo; delete checkpoint.player.maxReserveAmmo;
    delete checkpoint.player.radiator;
  }
  assert.deepEqual(withoutNewFields, old);
  const actual = restoreCampaignGame(migrated), expected = clone(old.checkpoint);
  expected.player.reserveAmmo = expected.player.maxReserveAmmo = 96;
  expected.player.radiator = { health: 100, maxHealth: 100, repairKits: 2, maxRepairKits: 2, repairProgress: 0, repairing: false };
  for (let frame = 0; frame < 240; frame++) {
    const input = { move: frame < 90 ? 1 : -1, brace: frame > 180, fire: frame % 45 < 4, aimX: 1900, aimY: 640, vent: frame > 120 };
    updateGame(actual, 1 / 60, input); updateGame(expected, 1 / 60, input);
  }
  assert.deepEqual(actual, expected);
  assert.deepEqual(legacy.live, old, 'migration must not mutate the checked-in fixture');
});

test('the real v0.2 completed dossier unlocks MI02 without rewriting MI01 or its maintenance debt', () => {
  const migrated = completedVesper();
  assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
  assert.equal(nextCampaignMissionId(migrated), 'MI02');
  assert.deepEqual(migrated.completed, legacy.completed.completed);
  assert.deepEqual(migrated.lastDebrief, legacy.completed.lastDebrief);
  assert.deepEqual(migrated.crew, legacy.completed.crew);
  assert.deepEqual(Object.fromEntries(Object.keys(legacy.completed.fleet).map(id => {
    const condition = clone(migrated.fleet[id]); delete condition.radiator; return [id, condition];
  })), legacy.completed.fleet);
  assert.equal(migrated.world.vesper.servicesInterrupted, true);
  assert.equal(migrated.resources.parts, 10);
  const repaired = repairCampaignPipe(migrated);
  assert.equal(repaired.ok, true);
  assert.equal(repaired.campaign.world.vesper.pipeRepaired, true);
  assert.equal(repaired.campaign.resources.parts, 8);
  assert.equal(nextCampaignMissionId(repaired.campaign), 'MI02');
  assert.deepEqual(repaired.campaign.completed.MI01, migrated.completed.MI01);
  assert.deepEqual(parseCampaign(serializeCampaign(repaired.campaign)), repaired.campaign);
});

test('migration reads without writes and preserves the original v1 primary during failed and successful commits', () => {
  const oldText = JSON.stringify(legacy.completed);
  const storage = memoryStorage(oldText);
  const loaded = readCampaign(storage);
  assert.equal(loaded.blocked, false);
  assert.equal(loaded.campaign.version, CAMPAIGN_SAVE_VERSION);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), oldText);
  storage.failKey = CAMPAIGN_SAVE_KEY;
  assert.equal(writeCampaign(storage, loaded.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), oldText);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), oldText);
  storage.failKey = null;
  assert.equal(writeCampaign(storage, loaded.campaign).ok, true);
  assert.equal(JSON.parse(storage.getItem(CAMPAIGN_SAVE_KEY)).version, CAMPAIGN_SAVE_VERSION);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), oldText);
  assert.deepEqual(readCampaign(storage).campaign, loaded.campaign);
});

test('a future primary remains protected even when its backup is a valid migratable v1 dossier', () => {
  const future = createCampaign(); future.version = CAMPAIGN_SAVE_VERSION + 1;
  const primary = JSON.stringify(future);
  const storage = memoryStorage(primary, JSON.stringify(legacy.completed));
  const loaded = readCampaign(storage);
  assert.equal(loaded.source, 'backup');
  assert.equal(loaded.blocked, true);
  assert.equal(loaded.campaign.version, CAMPAIGN_SAVE_VERSION);
  assert.equal(writeCampaign(storage, loaded.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), primary);
});

test('v1 migration rejects invented MI02 data rather than laundering an unknown schema', () => {
  for (const alter of [
    value => { value.completed.MI02 = {}; },
    value => { value.activeMissionId = 'MI02'; },
    value => { value.world.vesper.rail = {}; },
    value => { value.checkpoint.missionId = 'MI02'; },
  ]) {
    const old = clone(legacy.live); alter(old);
    assert.throws(() => parseCampaign(JSON.stringify(old)), /Sauvegarde invalide/);
  }
});

test('MI02 is locked before MI01, inherits its concrete consequences and excludes workshop interventions in flight', () => {
  assert.equal(nextCampaignMissionId(createCampaign()), 'MI01');
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI02' }).ok, false);
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI99' }).ok, false);
  for (const repair of [false, true]) {
    const completed = repair ? repairCampaignPipe(completedVesper()).campaign : completedVesper();
    const saved = serializeCampaign(completed);
    const started = beginCampaignMission(completed, { walkerId: 'WK05' });
    assert.equal(started.ok, true); assert.equal(started.replay, false);
    assert.equal(started.game.missionId, 'MI02');
    assert.equal(nextCampaignMissionId(started.campaign), 'MI02');
    assert.deepEqual(started.game.campaign.context, { pipeIntact: false, pipeRepaired: repair, noticeFiled: true, servicesInterrupted: !repair });
    assert.deepEqual(started.campaign.completed.MI01, completed.completed.MI01);
    assert.deepEqual(started.campaign.lastDebrief, completed.lastDebrief);
    assert.equal(serializeCampaign(completed), saved, 'begin must not mutate its source');
    assert.equal(repairCampaignPipe(started.campaign).ok, false);
    assert.equal(serviceCampaignWalker(started.campaign, 'WK05').ok, false);
    assert.equal(beginCampaignMission(started.campaign, { missionId: 'MI02' }).ok, false);
    assert.deepEqual(parseCampaign(serializeCampaign(started.campaign)), started.campaign);
    const replay = beginCampaignMission(started.campaign, { missionId: 'MI01' });
    assert.equal(replay.replay, true);
    assert.deepEqual(replay.campaign, started.campaign);
    assert.deepEqual(checkpointCampaign(started.campaign, replay.game, { replay: true }), started.campaign);
    assert.deepEqual(checkpointCampaign(started.campaign, legacy.live.checkpoint), started.campaign, 'a prior MI01 checkpoint cannot overwrite the MI02 sortie');
    const restarted = beginCampaignMission(started.campaign, { missionId: 'MI02', restart: true, walkerId: 'WK09' });
    assert.equal(restarted.game.walkerId, 'WK09');
    assert.equal(restarted.game.elapsed, 0);
  }
});

test('MI02 live saves retain the train, harpoons, physics, input and inherited dossier deterministically', () => {
  for (const walker of WALKERS) {
    const started = beginCampaignMission(completedVesper(), { missionId: 'MI02', walkerId: walker.id, seed: 129 });
    const game = started.game;
    for (let frame = 0; frame < 900; frame++) updateGame(game, 1 / 60, { move: 1, vent: frame > 500 });
    assert.equal(game.status, 'playing');
    const checkpoint = checkpointCampaign(started.campaign, game);
    const restored = restoreCampaignGame(parseCampaign(serializeCampaign(checkpoint)));
    assert.deepEqual(restored, clone(game));
    for (let frame = 0; frame < 240; frame++) {
      const input = { move: frame < 100 ? -1 : 1, brace: frame >= 160, vent: frame > 180 };
      updateGame(game, 1 / 60, input); updateGame(restored, 1 / 60, input);
    }
    assert.deepEqual(restored, game);
  }
});

test('MI02 import rejects cross-mission checkpoints, contradictory inherited facts and forged train parts', () => {
  const started = beginCampaignMission(completedVesper(), { missionId: 'MI02' });
  for (const alter of [
    value => { value.checkpoint = clone(legacy.live.checkpoint); },
    value => { value.checkpoint.campaign.context.noticeFiled = false; },
    value => { value.checkpoint.campaign.context.servicesInterrupted = false; },
    value => { value.checkpoint.train.wagons.pop(); },
    value => { value.checkpoint.train.harpoons[0].released = true; },
    value => { value.checkpoint.train.speed = 999; },
    value => { value.checkpoint.train.wagons[0].offset = 0; },
    value => { value.checkpoint.train.wagons[0].x += 20; },
    value => { value.world.vesper.rail.hostagesRescued = 8; },
    value => { value.activeMissionId = 'MI01'; },
    value => { delete value.completed.MI01; },
  ]) {
    const value = clone(started.campaign); alter(value);
    assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/);
  }
});

test('the migrated MI01 sortie continues into MI02 and persists both reports, a unique reward and an immutable completed choice', () => {
  const first = finishLegacySortie(parseCampaign(JSON.stringify(legacy.live)));
  assert.equal(first.applied, true);
  const repaired = repairCampaignPipe(first.campaign).campaign;
  const initialReceipt = clone(repaired.completed.MI01);
  const begun = beginCampaignMission(repaired, { walkerId: 'WK09', seed: 1847 });
  let dossier = begun.campaign;
  const game = begun.game;
  assert.equal(game.missionId, 'MI02');
  pilotMI02(game, { stopAt: state => state.decision.active, observe(state, frame) {
    if (frame % 900 === 0 && state.status === 'playing') dossier = parseCampaign(serializeCampaign(checkpointCampaign(dossier, state)));
  } });
  assert.equal(game.decision.active, true);
  dossier = checkpointCampaign(dossier, game, { beforeDecision: true });
  const beforeDecision = clone(dossier.preDecisionCheckpoint);
  const restored = restoreCampaignGame(parseCampaign(serializeCampaign(dossier)), { beforeDecision: true });
  assert.deepEqual(restored, clone(game));
  commandGame(restored, 'choice', 'defy');
  updateGame(restored, 1 / 60, { move: 1 });
  dossier = checkpointCampaign(dossier, restored);
  assert.deepEqual(dossier.preDecisionCheckpoint, beforeDecision);
  pilotMI02(restored, { choice: 'defy' });
  assert.equal(restored.status, 'won');
  const finished = finishCampaignMission(dossier, restored);
  assert.equal(finished.applied, true);
  const saved = parseCampaign(serializeCampaign(finished.campaign));
  assert.equal(saved.resources.parts, 12, '6 initial + 4 MI01 - 2 pipe + 4 MI02');
  assert.equal(saved.stage, 'complete');
  assert.equal(nextCampaignMissionId(saved), 'MI03');
  assert.deepEqual(saved.completed.MI01, initialReceipt);
  assert.deepEqual(saved.lastDebrief, saved.completed.MI02);
  assert.equal(saved.lastDebrief.hostagesRescued, 8);
  assert.equal(saved.lastDebrief.hostagesLost, 0);
  assert.equal(saved.lastDebrief.evidencePreserved, true);
  assert.equal(saved.lastDebrief.recordFiled, true);
  assert.equal(saved.lastDebrief.partsGranted, 4);
  assert.equal(saved.world.vesper.pipeRepaired, true);
  assert.deepEqual(saved.world.vesper.rail, { trainRecovered: true, hostagesRescued: 8, hostagesLost: 0, evidencePreserved: true, recordFiled: true, brisantsEncountered: true });
  assert.equal(saved.authority.suspicion, repaired.authority.suspicion + 2);
  assert.match(saved.lastDebrief.tessLine, /huit ouvriers/);
  assert.match(saved.lastDebrief.samiLine, /rapport signé/);
  assert.equal(restoreCampaignGame(saved), null);
  assert.equal(restoreCampaignGame(saved, { beforeDecision: true }), null);
  assert.deepEqual(checkpointCampaign(saved, beforeDecision), saved);
  assert.equal(finishCampaignMission(saved, restored).applied, false);
  assert.deepEqual(finishCampaignMission(saved, restored).campaign, saved);
  for (const missionId of ['MI01', 'MI02']) {
    const replay = beginCampaignMission(saved, { missionId });
    assert.equal(replay.replay, true);
    assert.deepEqual(replay.campaign, saved);
    assert.deepEqual(checkpointCampaign(saved, replay.game, { replay: true }), saved);
    assert.deepEqual(finishCampaignMission(saved, replay.game, { replay: true }).campaign, saved);
  }
});

test('a failed MI02 sortie retains its live checkpoint and cannot grant a reward or erase MI01', () => {
  const begun = beginCampaignMission(completedVesper(), { missionId: 'MI02', walkerId: 'WK05' });
  pilotMI02(begun.game, { stopAt: state => state.train.moving });
  const saved = checkpointCampaign(begun.campaign, begun.game);
  const serialized = serializeCampaign(saved);
  pilotMI02(begun.game, { brake: false });
  assert.equal(begun.game.status, 'lost');
  const result = finishCampaignMission(saved, begun.game);
  assert.equal(result.applied, false);
  assert.equal(serializeCampaign(result.campaign), serialized);
  assert.equal(result.campaign.resources.parts, 10);
  assert.equal(result.campaign.completed.MI02, undefined);
  assert.equal(result.campaign.lastDebrief.missionId, 'MI01');
  assert.equal(restoreCampaignGame(result.campaign).status, 'playing');
});

test('a recovered train with lost workers and a destroyed register persists those losses and the selected report', () => {
  for (const [seconds, expectedRescued, choice] of [[1.6, 1, 'defy'], [3.1, 0, 'obey']]) {
    const begun = beginCampaignMission(completedVesper(), { missionId: 'MI02', walkerId: 'WK01', seed: 1847 });
    let dossier = begun.campaign;
    const game = begun.game;
    pilotMI02(game, { stopAt: state => state.train.stopped });
    const wagon = game.train.wagons.find(item => item.kind === 'hostages');
    while (game.player.x > wagon.x - 260 && game.status === 'playing') updateGame(game, 1 / 60, { move: -1 });
    for (let frame = 0; frame < Math.ceil(seconds * 60); frame++) updateGame(game, 1 / 60, { brace: true, secondary: true, aimX: wagon.x, aimY: wagon.y });
    for (let frame = 0; frame < 30; frame++) updateGame(game, 1 / 60, { brace: true });
    assert.equal(game.campaign.hostagesLost, 8 - expectedRescued);
    assert.equal(game.campaign.evidencePreserved, false);
    dossier = parseCampaign(serializeCampaign(checkpointCampaign(dossier, game)));
    const restored = restoreCampaignGame(dossier);
    pilotMI02(restored, { choice, stopAt: state => state.decision.active });
    dossier = parseCampaign(serializeCampaign(checkpointCampaign(dossier, restored, { beforeDecision: true })));
    commandGame(restored, 'choice', choice);
    pilotMI02(restored, { choice });
    assert.equal(restored.status, 'won');
    const result = finishCampaignMission(dossier, restored);
    const saved = parseCampaign(serializeCampaign(result.campaign));
    assert.equal(saved.completed.MI02.hostagesRescued, expectedRescued);
    assert.equal(saved.completed.MI02.hostagesLost, 8 - expectedRescued);
    assert.equal(saved.completed.MI02.evidencePreserved, false);
    assert.equal(saved.completed.MI02.recordFiled, choice === 'defy');
    assert.equal(saved.world.vesper.rail.hostagesRescued, expectedRescued);
    assert.equal(saved.world.vesper.rail.evidencePreserved, false);
    assert.equal(saved.world.vesper.rail.recordFiled, choice === 'defy');
    assert.equal(saved.resources.parts, 14);
    assert.match(saved.lastDebrief.samiLine, /registre a brûlé/);
    assert.deepEqual(saved.completed.MI01, begun.campaign.completed.MI01);
    assert.deepEqual(finishCampaignMission(saved, restored).campaign, saved);
  }
});
