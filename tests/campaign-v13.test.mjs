import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createCampaign, parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign,
  restoreCampaignGame, finishCampaignMission, nextCampaignMissionId, serviceCampaignWalker,
} from '../src/campaign.mjs';
import { createFoundryDossier } from '../src/foundry-validation.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI04 } from './helpers/mi04-driver.mjs';
import { pilotMI05 } from './helpers/mi05-driver.mjs';
import { pilotMI06 } from './helpers/mi06-driver.mjs';
import { pilotMI07 } from './helpers/mi07-driver.mjs';
import { pilotMI08 } from './helpers/mi08-driver.mjs';
import { pilotMI09 } from './helpers/mi09-driver.mjs';
import { pilotMI10 } from './helpers/mi10-driver.mjs';
import { pilotMI11 } from './helpers/mi11-driver.mjs';
import { pilotMI12 } from './helpers/mi12-driver.mjs';
import { pilotMI13, moveMI13, fireAtMI13 } from './helpers/mi13-driver.mjs';

const history = JSON.parse(readFileSync(new URL('./fixtures/campaign-v11-mi11.json', import.meta.url)));
const clone = value => structuredClone(value);
let priorCache;
function afterMI12(options = {}) {
  if (!Object.keys(options).length && priorCache) return clone(priorCache);
  const old = parseCampaign(JSON.stringify(history.completed));
  const started = beginCampaignMission(old, { missionId: 'MI12', walkerId: 'WK09', difficulty: 'story', seed: 2147 });
  pilotMI12(started.game, options); assert.equal(started.game.status, 'won');
  const campaign = finishCampaignMission(started.campaign, started.game).campaign;
  if (!Object.keys(options).length) priorCache = campaign;
  return clone(campaign);
}
const start = (options = {}) => beginCampaignMission(afterMI12(), { missionId: 'MI13', walkerId: 'WK09', difficulty: 'story', seed: 2413, ...options });
const cache = new Map();
function complete(options = {}, deployment = {}) {
  const key = JSON.stringify([options, deployment]);
  if (!cache.has(key)) {
    let { campaign, game } = start(deployment), checkpoints = 0;
    pilotMI13(game, { ...options, observe: (state, frame) => {
      if (frame % 300 === 0 && state.status === 'playing') { campaign = checkpointCampaign(campaign, state); checkpoints++; }
    } });
    assert.equal(game.status, 'won', key);
    const result = finishCampaignMission(campaign, game); assert.equal(result.applied, true);
    cache.set(key, { game, campaign: parseCampaign(serializeCampaign(result.campaign)), checkpoints });
  }
  return clone(cache.get(key));
}
function editReceipt(save, edit) {
  edit(save.completed.MI13); save.lastDebrief = clone(save.completed.MI13);
  save.world.kharon.foundry = Object.fromEntries(Object.keys(createFoundryDossier()).map(key => [key, clone(save.completed.MI13[key])]));
  return save;
}

test('v12-shaped reconstruction migrates by adding only empty Kharon and preserves the twelve actual receipts', () => {
  const v12 = afterMI12(); delete v12.world.kharon; v12.version = 12;
  const text = JSON.stringify(v12), migrated = parseCampaign(text), historical = clone(migrated);
  historical.version = 12; delete historical.world.kharon;
  assert.deepEqual(historical, v12); assert.equal(JSON.stringify(v12), text);
  assert.deepEqual(migrated.world.kharon.foundry, createFoundryDossier());
  assert.equal(nextCampaignMissionId(migrated), 'MI13');
  for (const edit of [s => { s.world.kharon = {}; }, s => { s.completed.MI13 = {}; }, s => { s.activeMissionId = 'MI13'; }]) {
    const invalid = clone(v12); edit(invalid); assert.throws(() => parseCampaign(JSON.stringify(invalid)), /Sauvegarde invalide/);
  }
});

test('MI13 requires the first MI12 report, opens Kharon and inherits only actual Vesper and relay copies', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI13' }).ok, false);
  assert.equal(beginCampaignMission(parseCampaign(JSON.stringify(history.completed)), { missionId: 'MI13' }).ok, false);
  const original = afterMI12(), started = start(); assert.equal(started.ok, true);
  assert.equal(started.game.planetId, 'PL04'); assert.equal(started.game.campaign.pt03Acquired, false);
  assert.deepEqual(started.game.campaign.context, { relayRecorded: true, relayChoice: original.completed.MI12.choice,
    relayOrdersCopied: original.completed.MI12.ordersCopied, pt01Acquired: original.completed.MI04.technicalEvidence });
  assert.deepEqual(started.campaign.resources, original.resources); assert.deepEqual(started.campaign.completed, original.completed);
  assert.deepEqual(restoreCampaignGame(started.campaign), started.game);
  assert.equal(started.game.foundry.carrier.wheels.length, 4); assert.equal(started.game.foundry.cargo.length, 2);
});

for (const [name, stopAt] of [
  ['release', s => s.foundry.carrier.release.working && s.foundry.carrier.release.progress > .4],
  ['thermal valve', s => s.foundry.bridges[0].valve.working && s.foundry.bridges[0].valve.progress > .4],
  ['material marking', s => s.foundry.cargo[0].marking.working && s.foundry.cargo[0].marking.progress > .4],
  ['Tess analysis', s => s.foundry.analysis.working && s.foundry.analysis.progress > .4],
  ['physical cargo transfer', s => s.foundry.cargo[0].transfer.working && s.foundry.cargo[0].transfer.progress > .4],
  ['receipt transmission', s => s.foundry.report.working && s.foundry.report.progress > .4],
]) test(`MI13 ${name} survives exact export and deterministic continuation`, () => {
  let { campaign, game } = start(); pilotMI13(game, { stopAt });
  assert.equal(stopAt(game), true, name); assert.equal(game.status, 'playing');
  campaign = checkpointCampaign(campaign, game); const saved = parseCampaign(serializeCampaign(campaign));
  const restored = restoreCampaignGame(saved); assert.deepEqual(restored, game);
  pilotMI13(game); pilotMI13(restored); assert.equal(game.status, 'won'); assert.deepEqual(restored, game);
  assert.equal(finishCampaignMission(saved, restored).applied, true);
});

test('MI13 destination choice performs neither transport nor unloading and cannot rewind a later sortie', () => {
  let { campaign, game } = start(); pilotMI13(game, { stopAt: s => s.decision.active });
  campaign = checkpointCampaign(campaign, game, { beforeDecision: true });
  assert.deepEqual(restoreCampaignGame(campaign, { beforeDecision: true }), game);
  const carrier = clone(game.foundry.carrier), cargo = clone(game.foundry.cargo), clock = game.elapsed;
  commandGame(game, 'choice', 'obey');
  assert.equal(game.elapsed, clock); assert.equal(game.foundry.carrier.x, carrier.x);
  assert.deepEqual(game.foundry.cargo, cargo); assert.equal(game.campaign.carrierArrived, false);
  updateGame(game, 1 / 60, { brace: true }); campaign = checkpointCampaign(campaign, game);
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
});

for (const choice of ['obey', 'defy']) test(`MI13 ${choice} preserves PT03, actual transfers and twelve reports, and grants four lots once`, () => {
  const before = afterMI12(), { campaign, game, checkpoints } = complete({ choice }), r = campaign.completed.MI13;
  assert.ok(checkpoints > 5); assert.equal(r.plan, choice === 'obey' ? 'deliver' : 'quarantine');
  assert.equal(r.pt03Acquired, true); assert.equal(r.provenanceVerified, true);
  assert.equal(r.markingsCopied, 2); assert.equal(r.manifestCopied, true); assert.equal(r.analysisCompleted, true);
  assert.equal(r.pt01CrossReferenced, true); assert.equal(r.relayCrossReferenced, true);
  assert.equal(r.cargoTransferred, 2); assert.equal(r.carrierArrived, true); assert.equal(r.operationsResolved, true);
  assert.equal(r.publicReleased, false); assert.equal(r.defected, false);
  assert.equal(campaign.resources.parts, before.resources.parts + 4);
  for (const [id, old] of Object.entries(before.completed)) assert.deepEqual(campaign.completed[id], old);
  assert.equal(nextCampaignMissionId(campaign), 'MI14');
  assert.deepEqual(finishCampaignMission(campaign, game).campaign, campaign);
  const replay = beginCampaignMission(campaign, { missionId: 'MI13', walkerId: 'WK09', difficulty: 'story', seed: 2413 });
  assert.equal(replay.replay, true); pilotMI13(replay.game, { choice: choice === 'obey' ? 'defy' : 'obey' });
  assert.deepEqual(finishCampaignMission(replay.campaign, replay.game, { replay: true }).campaign, campaign);
});

test('MI13 PT03 stays available when MI12 source expired, without inventing a relay comparison', () => {
  const prior = afterMI12({ skipCopy: true }); assert.equal(prior.completed.MI12.ordersCopied, false);
  const { campaign, game } = beginCampaignMission(prior, { missionId: 'MI13', walkerId: 'WK09', difficulty: 'story', seed: 2413 });
  pilotMI13(game); assert.equal(game.status, 'won');
  const result = finishCampaignMission(campaign, game), r = result.receipt;
  assert.equal(r.pt03Acquired, true); assert.equal(r.relayCrossReferenced, false); assert.equal(r.pt01CrossReferenced, true);
  assert.match(r.samiLine, /Aucune commande non copiée/);
  assert.deepEqual(parseCampaign(serializeCampaign(result.campaign)), result.campaign);
});

for (const [name, options, proof, lost] of [
  ['one cargo lost before its marking', { destroyCargoBeforeCopy: true }, false, 1],
  ['manifest lost before copying', { destroyManifestBeforeCopy: true }, false, 0],
  ['both cargo originals lost after PT03', { destroyCargoAfterCopy: true }, true, 2],
  ['manifest original lost after copying', { destroyManifestAfterCopy: true }, true, 0],
]) test(`MI13 ${name} files the actual degraded receipt without inventing or erasing copies`, () => {
  const { campaign } = complete(options), r = campaign.completed.MI13;
  assert.equal(r.pt03Acquired, proof); assert.equal(r.cargoLost, lost);
  assert.equal(r.cargoTransferred, 2 - lost); assert.equal(r.operationsResolved, true);
  assert.equal(r.manifestCopied, !options.destroyManifestBeforeCopy);
  assert.deepEqual(parseCampaign(serializeCampaign(campaign)), campaign);
});

test('MI13 an interrupted partial transfer keeps its real position and elapsed work through export and fresh resume', () => {
  let { campaign, game } = start();
  pilotMI13(game, { stopAt: s => s.foundry.cargo[0].transfer.working && s.foundry.cargo[0].transfer.progress > .2 });
  const cargo = game.foundry.cargo[0], position = { x: cargo.x, y: cargo.y }, elapsed = cargo.transfer.elapsed;
  assert.ok(elapsed > 1 && elapsed < 2);
  moveMI13(game, game.player.x - 280);
  assert.equal(cargo.transfer.working, false); assert.equal(cargo.transfer.elapsed, elapsed);
  assert.deepEqual({ x: cargo.x, y: cargo.y }, position);
  for (let n = 0; n < 120; n++) updateGame(game, 1 / 60, { brace: true });
  assert.equal(cargo.transfer.elapsed, elapsed); assert.deepEqual({ x: cargo.x, y: cargo.y }, position);
  campaign = checkpointCampaign(campaign, game);
  const restored = restoreCampaignGame(parseCampaign(serializeCampaign(campaign)));
  assert.deepEqual(restored, game); pilotMI13(restored); assert.equal(restored.status, 'won');
  const result = finishCampaignMission(campaign, restored);
  assert.equal(result.receipt.cargoTransferred, 2); assert.equal(result.receipt.pt03Acquired, true);
});

test('MI13 import rejects source, transfer, wheel, temperature, privacy and choice forgery even in mirrored receipts', () => {
  const { campaign } = complete();
  const edits = [r => { r.pt03Acquired = false; }, r => { r.markingsCopied = 1; }, r => { r.analysisCompleted = false; },
    r => { r.cargoTransferred = 1; }, r => { r.choice = 'obey'; }, r => { r.publicReleased = true; }, r => { r.defected = true; },
    r => { r.roster.cargo[0].transfer.elapsed = 0; }, r => { r.roster.cargo[0].transferredAt = 0; },
    r => { r.roster.carrier.wheels[0].x += 20; }, r => { r.roster.bridges[0].temperature = 1000; },
    r => { r.pt01CrossReferenced = false; }, r => { r.relayCrossReferenced = false; }];
  for (const edit of edits) assert.throws(() => parseCampaign(JSON.stringify(editReceipt(clone(campaign), edit))), /Sauvegarde invalide/);
});

test('MI13 carrier destruction is terminal, persists to disk and never grants a receipt or four lots', () => {
  let { campaign, game } = start();
  fireAtMI13(game, 'foundry-carrier'); assert.equal(game.status, 'lost');
  const result = finishCampaignMission(campaign, game);
  assert.equal(result.applied, false); assert.equal(result.receipt, null);
  assert.deepEqual(result.campaign.resources, campaign.resources);
  assert.equal(Object.hasOwn(result.campaign.completed, 'MI13'), false);
  assert.equal(restoreCampaignGame(parseCampaign(serializeCampaign(result.campaign))).status, 'lost');
  assert.equal(restoreCampaignGame(result.campaign, { beforeDecision: true }), null);
});

test('the authentic v3 chain loses PT01 through actual fire, plays MI04–MI13 and establishes independent PT03', () => {
  const old = JSON.parse(readFileSync(new URL('./fixtures/campaign-v3-mi03.json', import.meta.url))).completed;
  let campaign = parseCampaign(JSON.stringify(old));
  const routes = [
    ['MI04', pilotMI04, { destroyPost: true }, 'WK05'], ['MI05', pilotMI05, {}, 'WK09'],
    ['MI06', pilotMI06, {}, 'WK09'], ['MI07', pilotMI07, {}, 'WK09'], ['MI08', pilotMI08, {}, 'WK09'],
    ['MI09', pilotMI09, {}, 'WK09'], ['MI10', pilotMI10, {}, 'WK09'], ['MI11', pilotMI11, {}, 'WK09'],
    ['MI12', pilotMI12, {}, 'WK09'], ['MI13', pilotMI13, {}, 'WK09'],
  ];
  for (const [missionId, pilot, options, walkerId] of routes) {
    if (campaign.fleet[walkerId].hull < 400 || campaign.fleet[walkerId].feet.some(hp => hp < 75) || campaign.fleet[walkerId].radiator < 75) {
      const serviced = serviceCampaignWalker(campaign, walkerId); assert.equal(serviced.ok, true); campaign = serviced.campaign;
    }
    const before = clone(campaign.completed), parts = campaign.resources.parts;
    const started = beginCampaignMission(campaign, { missionId, walkerId, difficulty: 'story', seed: 2147 });
    assert.equal(started.ok, true); pilot(started.game, options); assert.equal(started.game.status, 'won', missionId);
    campaign = parseCampaign(serializeCampaign(finishCampaignMission(started.campaign, started.game).campaign));
    assert.equal(campaign.resources.parts, parts + 4);
    for (const [id, receipt] of Object.entries(before)) assert.deepEqual(campaign.completed[id], receipt, `${missionId} preserves ${id}`);
    if (missionId === 'MI04') assert.equal(campaign.completed.MI04.technicalEvidence, false);
  }
  assert.equal(campaign.completed.MI04.alternativeSourceNeeded, true);
  assert.equal(campaign.completed.MI13.pt03Acquired, true);
  assert.equal(campaign.completed.MI13.pt01CrossReferenced, false);
  assert.equal(campaign.completed.MI13.relayCrossReferenced, true);
  assert.equal(Object.keys(campaign.completed).length, 13);
  assert.match(campaign.completed.MI13.samiLine, /Aucune copie PT01/);
});
