import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WALKERS } from '../src/content.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI05 } from './helpers/mi05-driver.mjs';
import { pilotMI06 } from './helpers/mi06-driver.mjs';
import {
  CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY, CAMPAIGN_SAVE_VERSION,
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission,
  nextCampaignMissionId,
} from '../src/campaign.mjs';

const historical = JSON.parse(readFileSync(new URL('./fixtures/campaign-v5-mi05.json', import.meta.url), 'utf8'));
const beforeNacre = JSON.parse(readFileSync(new URL('./fixtures/campaign-v4-mi04.json', import.meta.url), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const afterPassage = () => parseCampaign(JSON.stringify(historical.completed));
const startDike = (campaign = afterPassage(), walkerId = 'WK09') => beginCampaignMission(campaign, { missionId: 'MI06', walkerId, seed: 1847 });
function storage(primary) {
  const values = new Map(primary === undefined ? [] : [[CAMPAIGN_SAVE_KEY, primary]]);
  return { values, getItem: key => values.get(key) ?? null, setItem(key, value) { values.set(key, String(value)); } };
}
function noFuelDossier() {
  const start = beginCampaignMission(parseCampaign(JSON.stringify(beforeNacre.completed)), { missionId: 'MI05', walkerId: 'WK09', seed: 1847 });
  pilotMI05(start.game, { skipFuel: true });
  assert.equal(start.game.status, 'won');
  return finishCampaignMission(start.campaign, start.game).campaign;
}

// A controlled projectile is a unit stimulus, resolved by production collision
// and damage code. The hull, phase and mission outcome are never assigned.
function fatalImpact(game) {
  const p = game.player, x = p.x, y = p.y - p.height / 2 - 80;
  game.projectiles.push({ id: `terminal-calibration-${game.entityId++}`, team: 'enemy', type: 'bullet',
    x, y, prevX: x, prevY: y, vx: 0, vy: 6000, damage: 5000, radius: 2, life: 1, trail: [] });
  for (let i = 0; i < 60 && game.status === 'playing'; i++) updateGame(game, 1 / 60, { brace: true });
  assert.equal(game.status, 'lost');
  assert.equal(game.player.hull, 0);
}

test('authentic public v5 dossiers migrate without rewriting MI01–MI05 or crediting in-flight fuel', () => {
  assert.equal(historical.provenance.sourceRevision, '613c07307f2712c5fac28d9403016906e94da168');
  assert.equal(historical.provenance.saveVersion, 5);
  const originalBytes = JSON.stringify(historical);
  for (const old of [historical.live, historical.completed]) {
    const migrated = parseCampaign(JSON.stringify(old));
    assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
    assert.equal(migrated.world.nacre.fuelSpent, 0);
    assert.equal(migrated.world.nacre.dike.residentsTotal, 0);
    const previousShape = clone(migrated);
    previousShape.version = 5;
    delete previousShape.world.nacre.ambulance; delete previousShape.world.nacre.dike; delete previousShape.world.nacre.fuelSpent;
    assert.deepEqual(previousShape, old);
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
  }
  const live = parseCampaign(JSON.stringify(historical.live));
  assert.equal(live.resources.fuel, 0);
  assert.equal(live.checkpoint.campaign.fuelLots, 2);
  assert.equal(afterPassage().resources.fuel, 2);
  assert.equal(nextCampaignMissionId(afterPassage()), 'MI06');
  assert.equal(JSON.stringify(historical), originalBytes);
});

test('v5 migration is read-only until writing, keeps the original backup and protects future primaries', () => {
  const bytes = JSON.stringify(historical.live), disk = storage(bytes);
  const loaded = readCampaign(disk);
  assert.equal(loaded.blocked, false);
  assert.equal(disk.getItem(CAMPAIGN_SAVE_KEY), bytes);
  assert.deepEqual(restoreCampaignGame(loaded.campaign), historical.live.checkpoint);
  assert.equal(writeCampaign(disk, loaded.campaign).ok, true);
  assert.equal(disk.getItem(CAMPAIGN_BACKUP_KEY), bytes);
  const future = JSON.stringify({ ...createCampaign(), version: CAMPAIGN_SAVE_VERSION + 1 });
  disk.values.set(CAMPAIGN_SAVE_KEY, future);
  const protectedSave = readCampaign(disk);
  assert.equal(protectedSave.blocked, true);
  assert.equal(writeCampaign(disk, protectedSave.campaign).ok, false);
  assert.equal(disk.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('historic v5 imports reject a pre-existing dike, fuel ledger or forged MI06 mission', () => {
  for (const edit of [
    value => { value.world.nacre.dike = {}; },
    value => { value.world.nacre.fuelSpent = 2; },
    value => { value.completed.MI06 = {}; },
    value => { value.activeMissionId = 'MI06'; },
    value => { value.checkpoint.missionId = 'MI06'; },
    value => { value.checkpoint.dike = {}; },
  ]) {
    const value = clone(historical.live); edit(value);
    assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/);
  }
});

test('MI06 requires MI05 and inherits the passage facts and current stock without relocating its passengers', () => {
  assert.equal(startDike(createCampaign()).ok, false);
  assert.equal(startDike(parseCampaign(JSON.stringify(beforeNacre.completed))).ok, false);
  for (const source of [afterPassage(), noFuelDossier()]) {
    const before = serializeCampaign(source), start = startDike(source);
    assert.equal(start.ok, true);
    assert.equal(start.game.campaign.residentsTotal, 10);
    assert.equal(start.game.campaign.techniciansTotal, 2);
    assert.equal(start.game.campaign.context.fuelAvailable, source.resources.fuel);
    for (const key of ['channelOpen', 'refugeesPassed', 'refugeesLost', 'smugglerVerified', 'bargeCiviliansLost']) assert.equal(start.game.campaign.context[key], source.world.nacre.passage[key]);
    assert.equal(start.game.stats.evidence, 0);
    assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(start.campaign))), start.game);
    assert.equal(serializeCampaign(source), before);
  }
});

test('partly connected auxiliary resumes deterministically, debits only at completion and never twice', () => {
  const start = startDike();
  pilotMI06(start.game, { stopAt: s => s.dike.auxiliary.working && s.dike.auxiliary.progress > 0.4 });
  assert.equal(start.game.status, 'playing');
  assert.ok(start.game.dike.auxiliary.progress > 0.4 && start.game.dike.auxiliary.progress < 1);
  const partial = checkpointCampaign(start.campaign, start.game);
  assert.equal(partial.resources.fuel, 2);
  assert.equal(partial.world.nacre.fuelSpent, 0);
  const resumed = restoreCampaignGame(parseCampaign(serializeCampaign(partial)));
  assert.deepEqual(resumed, start.game);
  for (let frame = 0; frame < 180; frame++) {
    updateGame(start.game, 1 / 60, { brace: true });
    updateGame(resumed, 1 / 60, { brace: true });
  }
  assert.deepEqual(resumed, start.game);
  assert.equal(resumed.campaign.fuelSpent, 2);
  const paid = checkpointCampaign(partial, resumed);
  assert.equal(paid.resources.fuel, 0);
  assert.equal(paid.world.nacre.fuelSpent, 2);
  assert.equal(paid.checkpoint.campaign.context.fuelAvailable, 2);
  assert.equal(paid.checkpoint.campaign.fuelSpent, 2);
  const again = checkpointCampaign(paid, resumed);
  assert.equal(again.resources.fuel, 0);
  assert.equal(again.world.nacre.fuelSpent, 2);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(again))), resumed);
  assert.throws(() => checkpointCampaign(paid, partial.checkpoint), /Sauvegarde invalide/);
});

test('fuel consumed before an unsaved defeat is retained in a real terminal checkpoint and is not refunded on restart', () => {
  const start = startDike();
  pilotMI06(start.game, { stopAt: s => s.campaign.fuelSpent === 2 });
  assert.equal(start.game.campaign.fuelSpent, 2);
  fatalImpact(start.game);
  const result = finishCampaignMission(start.campaign, start.game);
  assert.equal(result.applied, false);
  assert.equal(result.campaign.completed.MI06, undefined);
  assert.equal(result.campaign.resources.parts, start.campaign.resources.parts);
  const failed = parseCampaign(serializeCampaign(result.campaign));
  assert.equal(failed.resources.fuel, 0);
  assert.equal(failed.world.nacre.fuelSpent, 2);
  assert.equal(restoreCampaignGame(failed).status, 'lost');
  assert.equal(restoreCampaignGame(failed, { beforeDecision: true }), null);
  assert.throws(() => checkpointCampaign(failed, start.campaign.checkpoint), /Sauvegarde invalide/);
  const restarted = beginCampaignMission(failed, { missionId: 'MI06', walkerId: 'WK09', seed: 1847, restart: true });
  assert.equal(restarted.ok, true);
  assert.equal(restarted.game.campaign.context.fuelAvailable, 0);
  assert.equal(restarted.game.campaign.fuelSpent, 0);
  assert.equal(restarted.campaign.world.nacre.fuelSpent, 2);
  pilotMI06(restarted.game);
  assert.equal(restarted.game.status, 'won');
  const finished = finishCampaignMission(restarted.campaign, restarted.game).campaign;
  assert.equal(finished.completed.MI06.fuelSpent, 0);
  assert.equal(finished.world.nacre.fuelSpent, 2);
  assert.equal(finished.resources.fuel, 0);
  assert.deepEqual(parseCampaign(serializeCampaign(finished)), finished);
});

test('all six campaign chassis finish both circuits with one report, one grant and unchanged earlier facts', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const source = afterPassage(), oldReports = clone(source.completed), start = startDike(source, walker.id);
    pilotMI06(start.game, { choice, stopAt: s => s.decision.active });
    assert.equal(start.game.decision.active, true, `${walker.id} decision`);
    const decided = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
    const resumed = restoreCampaignGame(parseCampaign(serializeCampaign(decided)));
    pilotMI06(resumed, { choice });
    assert.equal(resumed.status, 'won', `${walker.id} ${choice}`);
    const result = finishCampaignMission(decided, resumed), finished = parseCampaign(serializeCampaign(result.campaign));
    assert.equal(result.applied, true);
    assert.equal(finished.completed.MI06.circuit, choice === 'defy' ? 'diversion' : 'imperial');
    assert.equal(finished.completed.MI06.residentsSafe + finished.completed.MI06.residentsLost, 10);
    assert.equal(finished.completed.MI06.pumpsOnline, true);
    assert.equal(finished.resources.parts, source.resources.parts + 4);
    assert.equal(finished.resources.fuel + finished.world.nacre.fuelSpent, 2);
    assert.equal(nextCampaignMissionId(finished), 'MI07');
    assert.deepEqual(Object.fromEntries(Object.keys(oldReports).map(id => [id, finished.completed[id]])), oldReports);
    assert.deepEqual(finished.world.vesper, source.world.vesper);
    assert.deepEqual(finished.world.nacre.passage, source.world.nacre.passage);
    assert.deepEqual(finishCampaignMission(finished, resumed).campaign, finished);
    assert.equal(resumed.stats.evidence, 0);
  }
});

test('direct successful finish settles fuel without intermediate capture and replays cannot debit the official stock', () => {
  const start = startDike();
  pilotMI06(start.game);
  assert.equal(start.game.status, 'won');
  assert.equal(start.game.campaign.fuelSpent, 2);
  const finished = finishCampaignMission(start.campaign, start.game).campaign;
  assert.equal(finished.resources.fuel, 0);
  assert.equal(finished.world.nacre.fuelSpent, 2);
  const original = serializeCampaign(finished), replay = beginCampaignMission(finished, { missionId: 'MI06', walkerId: 'WK09', seed: 1847 });
  assert.equal(replay.replay, true);
  assert.equal(replay.game.campaign.context.fuelAvailable, 2);
  pilotMI06(replay.game, { stopAt: s => s.campaign.fuelSpent === 2 });
  assert.deepEqual(checkpointCampaign(finished, replay.game, { replay: true }), finished);
  pilotMI06(replay.game);
  assert.equal(replay.game.status, 'won');
  assert.deepEqual(finishCampaignMission(finished, replay.game, { replay: true }).campaign, finished);
  assert.equal(serializeCampaign(finished), original);
});

test('a decision checkpoint cannot restore fuel spent later in the same official sortie', () => {
  const start = startDike();
  pilotMI06(start.game, { skipAuxiliary: true, stopAt: s => s.decision.active });
  assert.equal(start.game.campaign.fuelSpent, 0);
  const before = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  assert.ok(restoreCampaignGame(before, { beforeDecision: true }));
  pilotMI06(start.game, { stopAt: s => s.campaign.fuelSpent === 2 });
  assert.equal(start.game.campaign.fuelSpent, 2);
  const paid = parseCampaign(serializeCampaign(checkpointCampaign(before, start.game)));
  assert.equal(paid.preDecisionCheckpoint.campaign.fuelSpent, 0);
  assert.equal(paid.checkpoint.campaign.fuelSpent, 2);
  assert.equal(paid.resources.fuel, 0);
  assert.equal(restoreCampaignGame(paid, { beforeDecision: true }), null);
  const oldCopy = clone(before.checkpoint);
  oldCopy.elapsed = paid.checkpoint.elapsed;
  assert.throws(() => checkpointCampaign(paid, oldCopy), /Sauvegarde invalide/);
});

test('an earlier MI06 decision point is not offered as a playable restore after the official clock advances', () => {
  const start = startDike();
  pilotMI06(start.game, { stopAt: s => s.decision.active });
  const before = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  assert.ok(restoreCampaignGame(before, { beforeDecision: true }));
  commandGame(start.game, 'choice', 'defy');
  for (let i = 0; i < 120; i++) updateGame(start.game, 1 / 60, { brace: true });
  const later = checkpointCampaign(before, start.game);
  assert.equal(later.preDecisionCheckpoint.campaign.fuelSpent, later.checkpoint.campaign.fuelSpent);
  assert.ok(later.checkpoint.elapsed > later.preDecisionCheckpoint.elapsed);
  assert.equal(restoreCampaignGame(parseCampaign(serializeCampaign(later)), { beforeDecision: true }), null);
  assert.deepEqual(restoreCampaignGame(later), start.game);
});

test('imports reject inconsistent dike objects, physical results, fuel balance and changed inheritance', () => {
  const start = startDike(), valid = serializeCampaign(start.campaign);
  for (const edit of [
    value => { value.resources.fuel = 1; },
    value => { value.world.nacre.fuelSpent = 2; },
    value => { value.world.nacre.dike.residentsSafe = 10; },
    value => { value.checkpoint.campaign.context.refugeesPassed = 0; },
    value => { value.checkpoint.campaign.context.fuelAvailable = 0; },
    value => { value.checkpoint.dike.houses.pop(); },
    value => { value.checkpoint.dike.houses[0].population = 12; },
    value => { value.checkpoint.dike.residents[0].safe = true; },
    value => { value.checkpoint.dike.technicians[0].alive = false; },
    value => { value.checkpoint.dike.panel.supported = true; },
    value => { value.checkpoint.dike.auxiliary.connected = true; },
    value => { value.checkpoint.dike.valve.completed = true; },
    value => { value.checkpoint.campaign.pumpsOnline = true; },
    value => { value.checkpoint.campaign.fuelSpent = 2; },
    value => { value.checkpoint.stats.evidence = 1; },
  ]) {
    const value = JSON.parse(valid); edit(value);
    assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/);
  }
});
