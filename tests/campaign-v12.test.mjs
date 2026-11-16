import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission,
  nextCampaignMissionId, CAMPAIGN_SAVE_VERSION, CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY,
} from '../src/campaign.mjs';
import { createRelayDossier } from '../src/relay-validation.mjs';
import { createFoundryDossier } from '../src/foundry-validation.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI12 } from './helpers/mi12-driver.mjs';

const fixtureBytes = readFileSync(new URL('./fixtures/campaign-v11-mi11.json', import.meta.url));
const history = JSON.parse(fixtureBytes);
const clone = value => structuredClone(value);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const after = (variant = 'completed') => parseCampaign(JSON.stringify(history[variant]));
const start = (options = {}) => beginCampaignMission(after(), { missionId: 'MI12', walkerId: 'WK09', difficulty: 'story', seed: 2147, ...options });
const cache = new Map();
function complete(options = {}, deployment = {}) {
  const key = JSON.stringify([options, deployment]);
  if (!cache.has(key)) {
    let { campaign, game } = start(deployment), checkpoints = 0;
    pilotMI12(game, { ...options, observe: (state, frame) => {
      if (frame % 300 === 0 && state.status === 'playing') { campaign = checkpointCampaign(campaign, state); checkpoints++; }
    } });
    assert.equal(game.status, 'won', key);
    const result = finishCampaignMission(campaign, game);
    assert.equal(result.applied, true);
    cache.set(key, { game, campaign: parseCampaign(serializeCampaign(result.campaign)), checkpoints });
  }
  return clone(cache.get(key));
}
function editReceipt(save, edit) {
  edit(save.completed.MI12);
  save.lastDebrief = clone(save.completed.MI12);
  save.world.thyr.relay = Object.fromEntries(Object.keys(createRelayDossier()).map(key => [key, clone(save.completed.MI12[key])]));
  return save;
}

test('reconstruction migrates the two exact public native v11 exports without rewriting a historical fact', () => {
  assert.equal(CAMPAIGN_SAVE_VERSION, 14);
  assert.equal(fixtureBytes.length, 443100);
  assert.equal(hash(fixtureBytes), '0b050e807af98718e70c957c712d24abe556d6d130d08a70b7eb534ebf03d52d');
  assert.equal(history.provenance.sourceRevision, '0f77235f7545f33b1a4f298b81a44ee2122d46dc');
  assert.equal(history.provenance.nativeReception, true);
  for (const variant of ['live', 'completed']) {
    const original = history[variant], migrated = after(variant), historical = clone(migrated);
    historical.version = 11; delete historical.world.thyr.relay; delete historical.world.kharon;
    assert.deepEqual(historical, original, variant);
    assert.deepEqual(migrated.world.thyr.relay, createRelayDossier());
    assert.deepEqual(migrated.world.kharon.foundry, createFoundryDossier());
    const source = history.provenance.sourceFiles[variant];
    const bytes = readFileSync(new URL(`../${source.path}`, import.meta.url));
    assert.equal(hash(bytes), source.sha256); assert.equal(bytes.length, source.bytes);
    assert.deepEqual(JSON.parse(bytes), original);
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
  }
  assert.deepEqual(restoreCampaignGame(after('live')), history.live.checkpoint);
  assert.equal(nextCampaignMissionId(after()), 'MI12');
});

test('reconstruction preserves every byte of all ten older historical fixtures', () => {
  assert.equal(Object.keys(history.provenance.protectedHistoricalFixtures).length, 10);
  for (const [path, expected] of Object.entries(history.provenance.protectedHistoricalFixtures)) {
    const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(bytes.length, expected.bytes, path); assert.equal(hash(bytes), expected.sha256, path);
    for (const variant of ['live', 'completed']) {
      const original = JSON.parse(bytes)[variant], migrated = parseCampaign(JSON.stringify(original));
      assert.deepEqual(migrated.completed, original.completed, `${path}:${variant}`);
      assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
    }
  }
});

test('reading v11 preserves the original on disk and the first write backs it up exactly', () => {
  const original = JSON.stringify(history.live), map = new Map([[CAMPAIGN_SAVE_KEY, original]]);
  const disk = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) };
  const loaded = readCampaign(disk);
  assert.equal(loaded.blocked, false); assert.equal(map.get(CAMPAIGN_SAVE_KEY), original);
  assert.equal(map.has(CAMPAIGN_BACKUP_KEY), false);
  assert.equal(writeCampaign(disk, loaded.campaign).ok, true);
  assert.equal(map.get(CAMPAIGN_BACKUP_KEY), original);
  const future = JSON.stringify({ ...createCampaign(), version: CAMPAIGN_SAVE_VERSION + 1 }); map.set(CAMPAIGN_SAVE_KEY, future);
  const blocked = readCampaign(disk); assert.equal(blocked.blocked, true);
  assert.equal(writeCampaign(disk, blocked.campaign).ok, false);
  assert.equal(map.get(CAMPAIGN_SAVE_KEY), future);
});

test('v11 cannot smuggle a future relay, foundry, checkpoint or completed report', () => {
  const edits = [s => { s.world.thyr.relay = {}; }, s => { s.world.kharon = {}; },
    s => { s.completed.MI12 = {}; }, s => { s.completed.MI13 = {}; }, s => { s.activeMissionId = 'MI12'; },
    s => { s.checkpoint.missionId = 'MI12'; }, s => { s.checkpoint.relay = {}; }, s => { s.checkpoint.foundry = {}; }];
  for (const edit of edits) {
    const save = clone(history.live); edit(save);
    assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/);
  }
});

test('MI12 opens only after the first MI11 report and inherits exactly recorded sources', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI12' }).ok, false);
  assert.equal(beginCampaignMission(after('live'), { missionId: 'MI12' }).ok, false);
  const original = after(), before = serializeCampaign(original), started = start();
  assert.equal(started.ok, true); assert.equal(serializeCampaign(original), before);
  assert.deepEqual(started.campaign.completed, original.completed);
  assert.deepEqual(started.campaign.resources, original.resources);
  assert.deepEqual(started.game.campaign.context, {
    voiceRecorded: true, voiceChoice: original.completed.MI11.choice,
    voiceTe01: original.completed.MI11.te01Acquired, lethAvailable: original.completed.MI11.witnessAvailable,
    chemicalPt02: original.completed.MI10.pt02Acquired,
  });
  assert.equal(started.game.campaign.ordersCopied, false); assert.equal(started.game.stats.evidence, 0);
  assert.deepEqual(restoreCampaignGame(started.campaign), started.game);
});

for (const [name, stopAt] of [
  ['inspection', s => s.relay.relays[0].working && s.relay.relays[0].progress > .4],
  ['timed copy', s => s.relay.copy.working && s.relay.copy.progress > .4],
  ['physical isolation', s => s.relay.relays.some(r => r.working && r.work === 'isolate' && r.progress > .4)],
  ['report transmission', s => s.relay.report.working && s.relay.report.progress > .4],
]) test(`MI12 ${name} exports and restores exactly, then continues deterministically`, () => {
  let { campaign, game } = start(); pilotMI12(game, { stopAt });
  assert.equal(stopAt(game), true, name); assert.equal(game.status, 'playing');
  campaign = checkpointCampaign(campaign, game);
  const saved = parseCampaign(serializeCampaign(campaign)), restored = restoreCampaignGame(saved);
  assert.deepEqual(restored, game); assert.deepEqual(saved.completed, history.completed.completed);
  const detached = restoreCampaignGame(saved); detached.player.ammo--;
  assert.notDeepEqual(detached, restoreCampaignGame(saved));
  pilotMI12(game); pilotMI12(restored); assert.equal(game.status, 'won'); assert.deepEqual(restored, game);
  assert.equal(finishCampaignMission(saved, restored).applied, true);
});

test('MI12 choice opens physical work without advancing a relay and prevents rewinding a later checkpoint', () => {
  let { campaign, game } = start(); pilotMI12(game, { stopAt: s => s.decision.active });
  campaign = checkpointCampaign(campaign, game, { beforeDecision: true });
  assert.deepEqual(restoreCampaignGame(campaign, { beforeDecision: true }), game);
  const bodies = clone(game.relay.relays); commandGame(game, 'choice', 'refuse');
  assert.deepEqual(game.relay.relays, bodies); assert.equal(game.campaign.operationsResolved, false);
  updateGame(game, 1 / 60, { brace: true }); campaign = checkpointCampaign(campaign, game);
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
});

for (const choice of ['obey', 'defy', 'refuse']) test(`MI12 ${choice} files one sourced report, preserves eleven reports and grants four lots once`, () => {
  const { campaign, game, checkpoints } = complete({ choice }), report = campaign.completed.MI12;
  assert.ok(checkpoints > 5); assert.equal(report.choice, choice);
  assert.equal(report.ordersCopied, true); assert.equal(report.industrialOrdersCopied, true);
  assert.equal(report.relaysErased, choice === 'obey' ? 3 : choice === 'defy' ? 2 : 0);
  assert.equal(report.relaysIsolated, choice === 'obey' ? 0 : choice === 'defy' ? 1 : 3);
  assert.equal(report.publicRefusal, choice === 'refuse'); assert.equal(report.refugeClosed, choice === 'refuse');
  assert.equal(report.praetorNeutralized, true); assert.equal(game.stats.evidence, 1, 'one local copy, without a new named PALINODE proof');
  assert.equal(campaign.resources.parts, history.completed.resources.parts + 4);
  for (const [id, old] of Object.entries(history.completed.completed)) assert.deepEqual(campaign.completed[id], old);
  assert.equal(nextCampaignMissionId(campaign), 'MI13');
  assert.deepEqual(finishCampaignMission(campaign, game).campaign, campaign);
  const replay = beginCampaignMission(campaign, { missionId: 'MI12', walkerId: 'WK09', difficulty: 'story', seed: 2147 });
  assert.equal(replay.replay, true); pilotMI12(replay.game, { choice: choice === 'obey' ? 'refuse' : 'obey' });
  assert.deepEqual(finishCampaignMission(replay.campaign, replay.game, { replay: true }).campaign, campaign);
});

for (const [name, options, copied] of [
  ['expired copy', { skipCopy: true }, false],
  ['source lost before copy', { destroySourceBeforeCopy: true }, false],
  ['source lost after copy', { destroySourceAfterCopy: true }, true],
]) test(`MI12 ${name} preserves the real provenance in its receipt`, () => {
  const { campaign } = complete(options), report = campaign.completed.MI12;
  assert.equal(report.ordersCopied, copied); assert.equal(report.industrialOrdersCopied, copied);
  assert.equal(report.copyResolved, true);
  assert.equal(Object.hasOwn(report, 'pt03Acquired'), false);
  assert.deepEqual(parseCampaign(serializeCampaign(campaign)), campaign);
});

test('MI12 import rejects forged copy, plan, body, timestamps and reaction even if dossier mirrors the receipt', () => {
  const { campaign } = complete();
  const edits = [r => { r.ordersCopied = false; }, r => { r.industrialOrdersCopied = false; },
    r => { r.relaysErased = 0; }, r => { r.praetorNeutralized = false; }, r => { r.ilanTrustDelta = -8; },
    r => { r.roster.relays[0].x += 1; }, r => { r.roster.relays[0].erasedAt = 0; },
    r => { r.choice = 'refuse'; }, r => { r.publicRefusal = true; }, r => { r.roster.copy.progress = .5; }];
  for (const edit of edits) assert.throws(() => parseCampaign(JSON.stringify(editReceipt(clone(campaign), edit))), /Sauvegarde invalide/);
});

test('MI12 a terminal no-fire defeat remains lost on restore and grants no report or reward', () => {
  let { campaign, game } = start({ difficulty: 'normal' }); pilotMI12(game, { noFire: true });
  assert.equal(game.status, 'lost'); const before = clone(campaign.resources);
  const result = finishCampaignMission(campaign, game);
  assert.equal(result.applied, false); assert.equal(result.receipt, null);
  assert.deepEqual(result.campaign.resources, before);
  assert.equal(Object.hasOwn(result.campaign.completed, 'MI12'), false);
  assert.equal(restoreCampaignGame(parseCampaign(serializeCampaign(result.campaign))).status, 'lost');
  assert.equal(restoreCampaignGame(result.campaign, { beforeDecision: true }), null);
});
