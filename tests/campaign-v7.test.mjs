import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI06 } from './helpers/mi06-driver.mjs';
import { pilotMI07 } from './helpers/mi07-driver.mjs';
import {
  CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY, CAMPAIGN_SAVE_VERSION,
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission, nextCampaignMissionId,
} from '../src/campaign.mjs';

const historical = JSON.parse(readFileSync(new URL('./fixtures/campaign-v6-mi06.json', import.meta.url), 'utf8'));
const clone = value => JSON.parse(JSON.stringify(value));
const afterDike = (key = 'completed') => parseCampaign(JSON.stringify(historical[key]));
const startAmbulance = (source = afterDike(), walkerId = 'WK09') => beginCampaignMission(source, { missionId: 'MI07', walkerId, seed: 1847 });
function storage(primary) {
  const values = new Map(primary === undefined ? [] : [[CAMPAIGN_SAVE_KEY, primary]]);
  return { values, getItem: key => values.get(key) ?? null, setItem(key, value) { values.set(key, String(value)); } };
}

test('authentic v6 migration adds only unvisited ambulance and departure dossiers and preserves a paid live valve exactly', () => {
  assert.equal(historical.provenance.sourceRevision, 'bc830013455bb8f71e1eaf0316173ac0e91746f8');
  assert.equal(historical.provenance.saveVersion, 6);
  const original = JSON.stringify(historical);
  for (const old of [historical.live, historical.completed, historical.manualCompleted]) {
    const migrated = parseCampaign(JSON.stringify(old));
    assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
    const prior = clone(migrated); prior.version = 6; delete prior.world.thyr; delete prior.world.nacre.ambulance; delete prior.world.nacre.departure;
    assert.deepEqual(prior, old);
    assert.equal(migrated.world.nacre.ambulance.patientsTotal, 0);
    assert.equal(migrated.world.nacre.ambulance.beaconRecovered, false);
    assert.deepEqual(migrated.world.nacre.departure, createCampaign().world.nacre.departure);
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
  }
  const live = parseCampaign(JSON.stringify(historical.live));
  assert.deepEqual(restoreCampaignGame(live), historical.live.checkpoint);
  assert.equal(live.resources.fuel, 0); assert.equal(live.world.nacre.fuelSpent, 2);
  const game = restoreCampaignGame(live); pilotMI06(game);
  const finished = finishCampaignMission(live, game).campaign;
  assert.equal(finished.completed.MI06.fuelSpent, 2);
  assert.equal(finished.world.nacre.fuelSpent, 2);
  assert.equal(nextCampaignMissionId(finished), 'MI07');
  assert.equal(JSON.stringify(historical), original);
});

test('v6 read is nonmutating, first write preserves original bytes and an unsupported primary blocks autosave', () => {
  const bytes = JSON.stringify(historical.live), disk = storage(bytes);
  const loaded = readCampaign(disk);
  assert.equal(loaded.blocked, false); assert.equal(disk.getItem(CAMPAIGN_SAVE_KEY), bytes);
  assert.equal(writeCampaign(disk, loaded.campaign).ok, true);
  assert.equal(disk.getItem(CAMPAIGN_BACKUP_KEY), bytes);
  const future = JSON.stringify({ ...createCampaign(), version: CAMPAIGN_SAVE_VERSION + 1 }); disk.values.set(CAMPAIGN_SAVE_KEY, future);
  const blocked = readCampaign(disk);
  assert.equal(blocked.blocked, true); assert.equal(writeCampaign(disk, blocked.campaign).ok, false);
  assert.equal(disk.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('v6 imports reject fabricated ambulance dossiers, scene objects and MI07 reports', () => {
  for (const edit of [
    v => { v.world.nacre.ambulance = {}; }, v => { v.checkpoint.ambulance = {}; },
    v => { v.checkpoint.missionId = 'MI07'; }, v => { v.completed.MI07 = {}; },
    v => { v.activeMissionId = 'MI07'; },
  ]) { const value = clone(historical.live); edit(value); assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/); }
});

test('MI07 requires MI06 and derives its ramp from authentic support without crediting or spending fuel', () => {
  assert.equal(startAmbulance(createCampaign()).ok, false);
  assert.equal(startAmbulance(parseCampaign(JSON.stringify(historical.live))).ok, false);
  for (const [variant, expectedRoute] of [['completed', 'main'], ['manualCompleted', 'secondary']]) {
    const source = afterDike(variant), before = serializeCampaign(source), start = startAmbulance(source);
    assert.equal(start.ok, true); assert.equal(start.game.campaign.route, expectedRoute);
    assert.equal(start.game.campaign.patientsTotal, 4); assert.equal(start.game.campaign.staffTotal, 2);
    for (const key of Object.keys(start.game.campaign.context)) assert.equal(start.game.campaign.context[key], source.world.nacre.dike[key]);
    assert.deepEqual(start.campaign.resources, source.resources);
    assert.equal(start.campaign.world.nacre.fuelSpent, source.world.nacre.fuelSpent);
    assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(start.campaign))), start.game);
    assert.equal(serializeCampaign(source), before);
  }
});

for (const variant of ['completed', 'manualCompleted']) for (const choice of ['obey', 'defy']) test(`MI07 ${variant}/${choice} classifies physical results once and replay preserves every official fact`, () => {
  const start = startAmbulance(afterDike(variant));
  pilotMI07(start.game, { choice, stopAt: s => s.decision.active });
  assert.equal(start.game.decision.active, true);
  let saved = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  const resumed = restoreCampaignGame(parseCampaign(serializeCampaign(saved)));
  assert.deepEqual(resumed, start.game);
  pilotMI07(resumed, { choice });
  assert.equal(resumed.status, 'won');
  const result = finishCampaignMission(saved, resumed); saved = parseCampaign(serializeCampaign(result.campaign));
  assert.equal(result.applied, true);
  const receipt = saved.completed.MI07;
  assert.equal(receipt.destination, choice === 'defy' ? 'clinic' : 'imperial');
  assert.equal(receipt.vehicleSeized, choice === 'obey');
  assert.equal(receipt.patientsArrived, 4); assert.equal(receipt.patientsLost, 0);
  assert.equal(receipt.staffAlive, 2); assert.equal(receipt.staffArrived, 2);
  assert.equal(receipt.provenanceVerified, false);
  assert.deepEqual(saved.world.nacre.ambulance, Object.fromEntries(Object.keys(saved.world.nacre.ambulance).map(key => [key, receipt[key]])));
  assert.deepEqual(saved.world.nacre.dike, start.campaign.world.nacre.dike);
  assert.equal(saved.resources.fuel, start.campaign.resources.fuel);
  assert.equal(saved.world.nacre.fuelSpent, start.campaign.world.nacre.fuelSpent);
  assert.equal(saved.resources.parts, start.campaign.resources.parts + 4);
  assert.equal(nextCampaignMissionId(saved), 'MI08');
  for (const id of ['MI01','MI02','MI03','MI04','MI05','MI06']) assert.deepEqual(saved.completed[id], start.campaign.completed[id]);
  const before = serializeCampaign(saved), replay = startAmbulance(saved);
  assert.equal(replay.replay, true); pilotMI07(replay.game, { choice: choice === 'defy' ? 'obey' : 'defy' });
  assert.equal(replay.game.status, 'won');
  assert.equal(finishCampaignMission(saved, replay.game, { replay: true }).applied, false);
  assert.equal(serializeCampaign(checkpointCampaign(saved, replay.game, { replay: true })), before);
  assert.equal(serializeCampaign(saved), before);
});

test('MI07 rejects contradictory facts, changed inherited support, invented provenance and duplicate rewards', () => {
  const start = startAmbulance(), base = clone(start.campaign);
  for (const edit of [
    v => { v.checkpoint.campaign.context.dikeFatigue += 1; },
    v => { v.checkpoint.campaign.route = 'secondary'; },
    v => { v.checkpoint.campaign.patientsArrived = 4; },
    v => { v.checkpoint.campaign.staffAlive = 0; },
    v => { v.checkpoint.campaign.provenanceVerified = true; },
    v => { v.checkpoint.campaign.beaconRecovered = true; },
    v => { v.checkpoint.campaign.consentObtained = true; },
    v => { v.world.nacre.ambulance.patientsArrived = 4; },
    v => { v.resources.fuel = 2; },
  ]) { const value = clone(base); edit(value); assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/); }
  pilotMI07(start.game); const finished = finishCampaignMission(start.campaign, start.game).campaign;
  const before = serializeCampaign(finished);
  assert.equal(finishCampaignMission(finished, start.game).applied, false);
  assert.equal(serializeCampaign(finished), before);
});

for (const [name, stopAt] of [
  ['agreement', s => s.ambulance.consent.working && s.ambulance.consent.progress > 0.35],
  ['cargo', s => s.ambulance.cargo.scanning && s.ambulance.cargo.scanProgress > 0.35],
  ['beacon', s => s.ambulance.beacon.working && s.ambulance.beacon.progress > 0.35],
  ['ramp', s => s.ambulance.ramp.working && s.ambulance.ramp.progress > 0.35],
]) test(`a partially completed ${name} survives JSON and resumes with the exact physical scene`, () => {
  const start = startAmbulance(); pilotMI07(start.game, { stopAt });
  assert.ok(stopAt(start.game), `${name} checkpoint was reached through public inputs`);
  const saved = checkpointCampaign(start.campaign, start.game), resumed = restoreCampaignGame(parseCampaign(serializeCampaign(saved)));
  assert.deepEqual(resumed, start.game);
  pilotMI07(start.game); pilotMI07(resumed);
  assert.equal(resumed.status, 'won'); assert.deepEqual(resumed, start.game);
  assert.equal(finishCampaignMission(saved, resumed).applied, true);
});

test('terminal MI07 hull loss persists as lost, cannot resume a living sortie and restarts without changing fuel', () => {
  const start = startAmbulance(); pilotMI07(start.game, { stopAt: s => s.decision.active });
  let saved = checkpointCampaign(start.campaign, start.game, { beforeDecision: true });
  assert.equal(commandGame(start.game, 'choice', 'defy'), true);
  const living = clone(start.game);
  // A unit calibration projectile exercises real collision/damage; it does not
  // assign hull, status, elapsed or a mission fact and is not a natural combat run.
  const p = start.game.player, y = p.y - p.height / 2 - 80;
  start.game.projectiles.push({ id: `terminal-mi07-${start.game.entityId++}`, team: 'enemy', type: 'bullet',
    x: p.x, y, prevX: p.x, prevY: y, vx: 0, vy: 6000, damage: 5000, radius: 2, life: 1, trail: [] });
  for (let i = 0; i < 60 && start.game.status === 'playing'; i++) updateGame(start.game, 1 / 60, { brace: true });
  assert.equal(start.game.status, 'lost');
  const result = finishCampaignMission(saved, start.game); saved = parseCampaign(serializeCampaign(result.campaign));
  assert.equal(result.applied, false); assert.equal(saved.completed.MI07, undefined);
  assert.deepEqual(restoreCampaignGame(saved), start.game);
  assert.equal(restoreCampaignGame(saved).status, 'lost');
  assert.equal(restoreCampaignGame(saved, { beforeDecision: true }), null);
  assert.throws(() => checkpointCampaign(saved, living), /recommencer explicitement/);
  pilotMI07(living); assert.equal(living.status, 'won');
  assert.throws(() => finishCampaignMission(saved, living), /recommencer explicitement/);
  const restarted = beginCampaignMission(saved, { missionId: 'MI07', walkerId: 'WK09', seed: 1847, restart: true });
  assert.equal(restarted.ok, true); assert.equal(restarted.game.status, 'playing');
  assert.equal(restarted.game.campaign.patientsArrived, 0); assert.equal(restarted.campaign.preDecisionCheckpoint, null);
  assert.equal(restarted.campaign.resources.fuel, start.campaign.resources.fuel);
  assert.equal(restarted.campaign.world.nacre.fuelSpent, start.campaign.world.nacre.fuelSpent);
});
