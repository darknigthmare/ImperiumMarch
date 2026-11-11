import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import {
  createCampaign, parseCampaign, serializeCampaign, readCampaign, writeCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission,
  nextCampaignMissionId, CAMPAIGN_SAVE_VERSION, CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY,
} from '../src/campaign.mjs';
import { createVoiceDossier } from '../src/voice-validation.mjs';
import { commandGame, updateGame } from '../src/simulation.mjs';
import { WALKERS, VOICE_TRANSLATION_PAIRS } from '../src/content.mjs';
import { pilotMI11, moveMI11, fireAtMI11 } from './helpers/mi11-driver.mjs';

const fixtureBytes = readFileSync(new URL('./fixtures/campaign-v10-mi10.json', import.meta.url));
const history = JSON.parse(fixtureBytes);
const clone = value => JSON.parse(JSON.stringify(value));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const after = (variant = 'completed') => parseCampaign(JSON.stringify(history[variant]));
const start = (options = {}) => beginCampaignMission(after(), { missionId: 'MI11', walkerId: 'WK09', difficulty: 'story', seed: 1847, ...options });
const idle = (s, seconds, input = {}) => {
  for (let frame = 0; frame < Math.ceil(seconds * 60) && s.status === 'playing' && !s.decision.active; frame++) updateGame(s, 1 / 60, { brace: true, ...input });
};
const disk = text => {
  const values = new Map([[CAMPAIGN_SAVE_KEY, text]]);
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};
const cache = new Map();
function complete(options = {}, deployment = {}) {
  const key = JSON.stringify([options, deployment]);
  if (!cache.has(key)) {
    let { campaign, game } = start(deployment), checkpoints = 0;
    pilotMI11(game, { maxFrames: 24000, ...options, observe: (state, frame) => {
      if (frame % 240 === 0 && state.status === 'playing') { campaign = checkpointCampaign(campaign, state); checkpoints++; }
    } });
    assert.equal(game.status, 'won', key);
    const result = finishCampaignMission(campaign, game);
    assert.equal(result.applied, true);
    cache.set(key, { game, campaign: parseCampaign(serializeCampaign(result.campaign)), checkpoints });
  }
  return clone(cache.get(key));
}
function editReceipt(save, edit) {
  edit(save.completed.MI11);
  save.lastDebrief = clone(save.completed.MI11);
  save.world.thyr.voice = Object.fromEntries(Object.keys(createVoiceDossier()).map(key => [key, clone(save.completed.MI11[key])]));
  return save;
}

test('v11 adds only an empty voice dossier to both exact published prepared v10 exports', () => {
  assert.equal(CAMPAIGN_SAVE_VERSION, 11);
  assert.equal(fixtureBytes.length, 414403);
  assert.equal(hash(fixtureBytes), 'a917920f3e0469d00f31e00f1a242fc183e5d0ebc4f3b4db59066fa63668aa73');
  assert.equal(history.provenance.sourceRevision, 'c7f3273a60824ff4e968ea36ab956c6a41710df0');
  assert.equal(history.provenance.sourceTree, '7942d22cfdb0b73e42ae0a427a3afbc986f29160');
  assert.equal(history.provenance.verifiedHistoricBlobs, 1268);
  assert.equal(history.provenance.nativeReception, false);
  for (const variant of ['live', 'completed']) {
    const original = history[variant], migrated = after(variant), historical = clone(migrated);
    historical.version = 10; delete historical.world.thyr.voice;
    assert.deepEqual(historical, original, variant);
    assert.deepEqual(migrated.world.thyr.voice, createVoiceDossier());
    assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
    const path = history.provenance.preparedVariants[variant].path;
    const source = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(hash(source), history.provenance.sourceHashes[path].sha256);
    assert.equal(source.length, history.provenance.sourceHashes[path].bytes);
    assert.deepEqual(JSON.parse(source), original);
  }
  assert.deepEqual(restoreCampaignGame(after('live')), history.live.checkpoint);
  assert.equal(after().stage, 'complete'); assert.equal(nextCampaignMissionId(after()), 'MI11');
});

test('nine older fixtures keep their bytes and twenty historical variants still round-trip', () => {
  assert.equal(Object.keys(history.provenance.protectedHistoricalFixtures).length, 9);
  for (const [path, expected] of Object.entries(history.provenance.protectedHistoricalFixtures)) {
    const bytes = readFileSync(new URL(`../${path}`, import.meta.url));
    assert.equal(bytes.length, expected.bytes, path); assert.equal(hash(bytes), expected.sha256, path);
    for (const variant of ['live', 'completed']) {
      const source = JSON.parse(bytes)[variant], migrated = parseCampaign(JSON.stringify(source));
      assert.equal(migrated.version, 11); assert.deepEqual(migrated.completed, source.completed);
      assert.deepEqual(migrated.world.thyr.voice, createVoiceDossier());
      assert.deepEqual(parseCampaign(serializeCampaign(migrated)), migrated);
    }
  }
  for (const variant of ['live', 'completed']) assert.equal(after(variant).version, 11);
});

test('reading v10 is nondestructive, its first write backs up the original, future v12 is protected', () => {
  const original = JSON.stringify(history.live), storage = disk(original), loaded = readCampaign(storage);
  assert.equal(loaded.blocked, false); assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), original);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), null);
  assert.equal(writeCampaign(storage, loaded.campaign).ok, true);
  assert.equal(storage.getItem(CAMPAIGN_BACKUP_KEY), original);
  const future = JSON.stringify({ ...createCampaign(), version: 12 });
  storage.values.set(CAMPAIGN_SAVE_KEY, future);
  const blocked = readCampaign(storage); assert.equal(blocked.blocked, true);
  assert.equal(writeCampaign(storage, blocked.campaign).ok, false);
  assert.equal(storage.getItem(CAMPAIGN_SAVE_KEY), future);
});

test('v10 cannot smuggle a future scene, world state, active mission or completed report', () => {
  const edits = [save => { save.world.thyr.voice = {}; }, save => { save.completed.MI11 = {}; },
    save => { save.activeMissionId = 'MI11'; }, save => { save.checkpoint.missionId = 'MI11'; },
    save => { save.checkpoint.voice = {}; }, save => { save.preDecisionCheckpoint = clone(save.checkpoint); save.preDecisionCheckpoint.voice = {}; }];
  for (const edit of edits) {
    const save = clone(history.live); edit(save); assert.throws(() => parseCampaign(JSON.stringify(save)), /Sauvegarde invalide/);
  }
});

test('MI11 requires the first MI10 report and inherits only five recorded chemical facts', () => {
  assert.equal(beginCampaignMission(createCampaign(), { missionId: 'MI11' }).ok, false);
  assert.equal(beginCampaignMission(after('live'), { missionId: 'MI11' }).ok, false);
  const original = after(), text = serializeCampaign(original), deployed = start();
  assert.equal(deployed.ok, true); assert.equal(serializeCampaign(original), text);
  assert.deepEqual(deployed.campaign.resources, original.resources);
  assert.deepEqual(deployed.campaign.completed, original.completed); assert.deepEqual(deployed.campaign.world, original.world);
  assert.deepEqual(deployed.game.campaign.context, { chemicalRecorded: true, chemicalChoice: 'defy', chemicalPt02: true, chemicalVillageHabitable: true, chemicalWaterRestored: true });
  assert.equal(deployed.game.voice.leth.met, false); assert.equal(deployed.game.voice.leth.consent, false);
  assert.equal(deployed.game.campaign.te01Acquired, false); assert.equal(deployed.game.stats.evidence, 0);
  assert.deepEqual(deployed.game.civilians, []); assert.equal(Object.hasOwn(deployed.game.voice, 'people'), false);
  assert.equal(Object.hasOwn(deployed.game, 'chemical'), false);
  assert.deepEqual(restoreCampaignGame(deployed.campaign), deployed.game);
});

for (const [label, stopAt] of [
  ['quiet listening', state => state.voice.listening[0].progress > .35],
  ['ridge survey', state => state.voice.ridge.progress > .35],
  ['consent request', state => state.voice.leth.work === 'consent' && state.voice.leth.progress > .35],
  ['protected testimony', state => state.voice.leth.work === 'testimony' && state.voice.leth.progress > .35],
  ['physical seizure', state => state.voice.emitter.work === 'seize' && state.voice.emitter.progress > .35],
]) test(`MI11 ${label} survives export, detached restore and deterministic continuation`, () => {
  let { campaign, game } = start();
  pilotMI11(game, { choice: 'obey', stopAt, maxFrames: 24000 }); assert.equal(game.status, 'playing');
  assert.equal(stopAt(game), true, label);
  campaign = checkpointCampaign(campaign, game);
  const saved = parseCampaign(serializeCampaign(campaign)), restored = restoreCampaignGame(saved);
  assert.deepEqual(restored, game); assert.deepEqual(saved.completed, history.completed.completed);
  const detached = restoreCampaignGame(saved); detached.player.ammo--;
  assert.notDeepEqual(detached, restoreCampaignGame(saved));
  pilotMI11(game, { choice: 'obey', maxFrames: 24000 }); pilotMI11(restored, { choice: 'obey', maxFrames: 24000 });
  assert.equal(game.status, 'won'); assert.deepEqual(restored, game);
  assert.equal(finishCampaignMission(saved, restored).applied, true);
});

test('MI11 a decision changes the plan but performs no emitter operation and cannot rewind the sortie', () => {
  let { campaign, game } = start(); pilotMI11(game, { stopAt: state => state.decision.active });
  assert.equal(game.decision.active, true);
  campaign = checkpointCampaign(campaign, game, { beforeDecision: true });
  assert.deepEqual(restoreCampaignGame(campaign, { beforeDecision: true }), game);
  const emitter = clone(game.voice.emitter), clock = game.elapsed;
  commandGame(game, 'choice', 'obey');
  assert.equal(game.elapsed, clock); assert.deepEqual(game.voice.emitter, emitter);
  assert.equal(game.campaign.plan, 'seize'); assert.equal(game.campaign.emitterSeized, false); assert.equal(game.campaign.operationsResolved, false);
  idle(game, .2); campaign = checkpointCampaign(campaign, game);
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
  assert.throws(() => checkpointCampaign(campaign, campaign.preDecisionCheckpoint), /Sauvegarde invalide/);
  pilotMI11(game, { choice: 'obey' }); const result = finishCampaignMission(campaign, game);
  assert.equal(result.receipt.emitterSeized, true); assert.equal(result.receipt.emitterOnline, false);
});

test('MI11 parser rejects forged identities, capacities, copies, people, privacy, proof and inherited facts', () => {
  const original = start().campaign;
  const edits = [
    save => { save.checkpoint.voice.people = []; },
    save => { save.checkpoint.voice.nests.pop(); },
    save => { save.checkpoint.voice.leth.characterId = 'PN07'; },
    save => { save.checkpoint.voice.leth.name = 'Témoin inconnu'; },
    save => { save.checkpoint.voice.leth.x += 100; },
    save => { save.checkpoint.voice.emitter.maxHp += 100; },
    save => { save.checkpoint.voice.nests[0].hp -= 1; },
    save => { save.checkpoint.voice.listening[0].signal = 1; },
    save => { save.checkpoint.campaign.signalsRecorded = 3; },
    save => { save.checkpoint.voice.receiver.translationCopied = true; },
    save => { save.checkpoint.voice.leth.consent = true; },
    save => { save.checkpoint.voice.leth.publicConsent = true; save.checkpoint.campaign.publicConsent = true; },
    save => { save.checkpoint.voice.leth.recruited = true; save.checkpoint.campaign.recruited = true; },
    save => { save.checkpoint.campaign.te01Acquired = true; },
    save => { save.checkpoint.campaign.lethTrust = 70; },
    save => { save.checkpoint.campaign.context.chemicalPt02 = false; },
    save => { save.checkpoint.stats.collateral = 1; },
    save => { save.checkpoint.enemies[0].hp -= 10; },
    save => { save.world.thyr.voice.te01Acquired = true; },
  ];
  for (const [index, edit] of edits.entries()) {
    const malformed = clone(original); edit(malformed);
    assert.throws(() => parseCampaign(JSON.stringify(malformed)), /Sauvegarde invalide/, `forgery ${index}`);
  }
});

test('MI11 unfinished testimony rejects accelerated work, forged completion and current public permission', () => {
  let { campaign, game } = start();
  pilotMI11(game, { stopAt: state => state.voice.leth.work === 'testimony' && state.voice.leth.progress > .2 });
  campaign = checkpointCampaign(campaign, game);
  const edits = [
    s => { s.voice.leth.startedAt = s.elapsed - 1; s.voice.leth.progress = .9; },
    s => { s.voice.leth.completedAt = s.elapsed; },
    s => { s.voice.leth.testimonyRecorded = true; s.voice.leth.testimonyAt = s.elapsed; },
    s => { s.voice.leth.consentAt = s.voice.leth.metAt - 1; },
    s => { s.voice.leth.firstStartedAt = s.voice.leth.consentAt - 1; },
    s => { s.voice.leth.publicConsent = true; },
    s => { s.voice.alert.readyAt = s.voice.alert.triggeredAt; },
  ];
  for (const [index, edit] of edits.entries()) {
    const malformed = clone(campaign); edit(malformed.checkpoint);
    assert.throws(() => parseCampaign(JSON.stringify(malformed)), /Sauvegarde invalide/, `timing ${index}`);
  }
});

test('MI11 even an unadvanced job requires its physical prerequisites before it starts', () => {
  const original = start().campaign;
  const edits = [
    s => { Object.assign(s.voice.receiver, { working: true, startedAt: 0 }); },
    s => { Object.assign(s.voice.emitter, { working: true, startedAt: 0, work: 'emitter' }); },
    s => { Object.assign(s.voice.leth, { working: true, startedAt: 0, work: 'meet' }); },
    s => { Object.assign(s.voice.leth, { working: true, startedAt: 0, work: 'consent' }); },
    s => { Object.assign(s.voice.report, { working: true, startedAt: 0 }); },
  ];
  for (const [index, edit] of edits.entries()) {
    const malformed = clone(original); edit(malformed.checkpoint);
    assert.throws(() => parseCampaign(JSON.stringify(malformed)), /Sauvegarde invalide/, `premature job ${index}`);
  }
});

test('MI11 checkpoints reject backdated partial work while allowing a real interrupted restart', () => {
  let { campaign, game } = start();
  pilotMI11(game, { stopAt: s => s.voice.listening[0].progress > .4 });
  campaign = checkpointCampaign(campaign, game);
  const forged = clone(game);
  forged.voice.listening[0].startedAt -= .5; forged.voice.listening[0].progress += .1;
  const internallyConsistent = clone(campaign); internallyConsistent.checkpoint = forged;
  assert.doesNotThrow(() => parseCampaign(JSON.stringify(internallyConsistent)));
  assert.throws(() => checkpointCampaign(campaign, forged), /Sauvegarde invalide.*travail antidaté/);
  updateGame(game, 1 / 60, { move: 1, brace: false });
  assert.equal(game.voice.listening[0].progress, 0); assert.equal(game.voice.listening[0].startedAt, null);
  campaign = checkpointCampaign(campaign, game);
  pilotMI11(game, { stopAt: s => s.voice.listening[0].progress > .2 });
  assert.ok(game.voice.listening[0].startedAt > campaign.checkpoint.elapsed);
  campaign = checkpointCampaign(campaign, game);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
});

test('MI11 first report adds four lots, preserves ten historical reports and separates cooperation from recruitment', () => {
  const { campaign: saved, game } = complete(), receipt = saved.completed.MI11;
  assert.equal(receipt.te01Acquired, true); assert.equal(receipt.testimonyRecorded, true); assert.equal(receipt.witnessAvailable, true);
  assert.equal(receipt.lethAlive, true); assert.equal(receipt.lethTrust, 70); assert.equal(receipt.alliancePossible, true);
  assert.equal(receipt.publicConsent, false); assert.equal(receipt.recruited, false); assert.equal(receipt.emitterOnline, true);
  assert.equal(receipt.nestsIntact, 3); assert.equal(receipt.roster.nests.length, 3); assert.equal(receipt.roster.privateForces.length, 3);
  assert.equal(receipt.collateral, 0); assert.equal(receipt.kills, 3); assert.equal(receipt.partsGranted, 4);
  assert.deepEqual(Object.fromEntries(Object.entries(saved.completed).filter(([id]) => id !== 'MI11')), history.completed.completed);
  for (const key of ['vesper', 'nacre']) assert.deepEqual(saved.world[key], history.completed.world[key]);
  for (const key of ['route', 'chemical']) assert.deepEqual(saved.world.thyr[key], history.completed.world.thyr[key]);
  assert.equal(saved.resources.parts, 50); assert.equal(saved.resources.fuel, history.completed.resources.fuel);
  assert.equal(nextCampaignMissionId(saved), null);
  assert.equal(Object.hasOwn(receipt, 'palinodeProven'), false); assert.equal(Object.hasOwn(saved.crew, 'leth'), false);
  const text = serializeCampaign(saved); assert.equal(finishCampaignMission(saved, game).applied, false);
  assert.equal(serializeCampaign(saved), text); game.voice.leth.hp = 0; assert.equal(serializeCampaign(saved), text);
});

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI11 ${walker.id}/${choice} accepts a normal-difficulty campaign receipt`, () => {
  const { campaign } = complete({ choice }, { walkerId: walker.id, difficulty: 'normal' });
  const receipt = campaign.completed.MI11;
  assert.equal(receipt.walkerId, walker.id); assert.equal(receipt.choice, choice);
  assert.equal(receipt.reportTransmitted, true); assert.equal(receipt.te01Acquired, true); assert.equal(receipt.nestsIntact, 3);
  assert.equal(receipt.emitterSeized, choice === 'obey'); assert.equal(receipt.emitterOnline, choice === 'defy');
  assert.equal(receipt.alliancePossible, choice === 'defy'); assert.equal(receipt.recruited, false);
  assert.equal(campaign.resources.parts, 50);
});

const adverse = [
  ['warning lost before copy', { destroyEmitterBeforeCopy: true }, { warningCopied: false, te01Acquired: false, emitterLost: true }],
  ['translation lost before copy', { destroyReceiverBeforeCopy: true }, { translationCopied: false, te01Acquired: false }],
  ['Leth lost before exchange', { destroyLethBeforeExchange: true }, { lethAlive: false, testimonyRecorded: false, te01Acquired: false, witnessAvailable: false }],
  ['Leth lost after exchange', { destroyLethAfterExchange: true }, { lethAlive: false, testimonyRecorded: true, te01Acquired: true, witnessAvailable: false }],
  ['originals lost after recording', { destroyOriginalsAfterExchange: true }, { warningCopied: true, translationCopied: true, te01Acquired: true, emitterLost: true }],
  ['ridge destroyed after survey', { destroyRidgeAfterSurvey: true }, { ridgeSurveyed: true, ridgeIntact: false, consentRefused: true, te01Acquired: false }],
  ['unprotected nesting route', { skipRidge: true }, { ridgeSurveyed: false, consentRefused: true, testimonyRecorded: false, te01Acquired: false }],
];
for (const [name, option, expected] of adverse) test(`MI11 ${name} keeps its exact degraded campaign result`, () => {
  const { campaign, game } = complete(option, { difficulty: 'normal' }), receipt = campaign.completed.MI11;
  for (const [key, value] of Object.entries(expected)) assert.equal(receipt[key], value, key);
  assert.equal(receipt.publicConsent, false); assert.equal(receipt.recruited, false);
  assert.equal(receipt.collateral, Number(!receipt.lethAlive));
  assert.deepEqual(campaign.world.thyr.voice, Object.fromEntries(Object.keys(createVoiceDossier()).map(key => [key, clone(receipt[key])])));
  assert.deepEqual(parseCampaign(serializeCampaign(campaign)), campaign);
  assert.equal(finishCampaignMission(campaign, game).applied, false);
});

test('MI11 death after consent but before testimony preserves the prior completed job without inventing words', () => {
  let { campaign, game } = start(); pilotMI11(game, { stopAt: state => state.voice.leth.consent });
  assert.equal(game.voice.leth.work, 'consent'); assert.equal(game.voice.leth.progress, 1);
  const consentAt = game.voice.leth.consentAt;
  campaign = checkpointCampaign(campaign, game);
  fireAtMI11(game, 'voice-leth'); assert.equal(game.voice.leth.alive, false);
  assert.equal(game.voice.leth.testimonyRecorded, false); assert.equal(game.voice.leth.firstStartedAt, null);
  assert.equal(game.voice.leth.consentAt, consentAt); assert.equal(game.voice.leth.completedAt, consentAt);
  campaign = checkpointCampaign(campaign, game); assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
  pilotMI11(game); const result = finishCampaignMission(campaign, game);
  assert.equal(result.receipt.te01Acquired, false); assert.equal(result.receipt.testimonyLost, true);
});

test('MI11 withdrawal before recording keeps the copies and reports no earlier testimony', () => {
  let { campaign, game } = start();
  pilotMI11(game, { stopAt: state => state.voice.leth.consent });
  assert.equal(game.voice.leth.testimonyStarted, false); assert.equal(game.campaign.testimonyRecorded, false);
  campaign = checkpointCampaign(campaign, game);
  fireAtMI11(game, 'voice-root-passage'); moveMI11(game, 2750); idle(game, .1);
  assert.equal(game.campaign.consentWithdrawn, true); assert.equal(game.campaign.lethAlive, true);
  assert.equal(game.campaign.testimonyStarted, false); assert.equal(game.campaign.testimonyRecorded, false);
  assert.equal(game.campaign.warningCopied, true); assert.equal(game.campaign.translationCopied, true);
  campaign = checkpointCampaign(campaign, game);
  assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
  pilotMI11(game); assert.equal(game.status, 'won');
  const result = finishCampaignMission(campaign, game), receipt = result.receipt;
  assert.equal(result.applied, true); assert.equal(receipt.consentWithdrawn, true);
  assert.equal(receipt.testimonyRecorded, false); assert.equal(receipt.te01Acquired, false);
  assert.equal(receipt.witnessAvailable, false); assert.equal(receipt.alliancePossible, false);
  assert.equal(receipt.publicConsent, false); assert.equal(receipt.recruited, false);
  assert.match(receipt.samiLine, /Leth a retiré sa coopération/);
  assert.match(receipt.samiLine, /aucun enregistrement achevé n’est conservé/);
  assert.doesNotMatch(receipt.samiLine, /l’enregistrement antérieur/);
  assert.deepEqual(parseCampaign(serializeCampaign(result.campaign)).completed.MI11, receipt);
});

test('MI11 a late physical nesting loss preserves TE01 but records withdrawn cooperation', () => {
  let { campaign, game } = start(); pilotMI11(game, { stopAt: state => state.campaign.testimonyRecorded && state.campaign.privateNeutralized === 3 });
  const recordedAt = game.voice.leth.testimonyAt;
  campaign = checkpointCampaign(campaign, game);
  fireAtMI11(game, 'voice-root-passage'); moveMI11(game, 2750); idle(game, .1);
  assert.equal(game.campaign.consentWithdrawn, true); assert.ok(game.voice.leth.withdrawnAt > recordedAt);
  campaign = checkpointCampaign(campaign, game); assert.deepEqual(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))), game);
  pilotMI11(game); const result = finishCampaignMission(campaign, game);
  assert.equal(result.receipt.te01Acquired, true); assert.equal(result.receipt.testimonyRecorded, true);
  assert.equal(result.receipt.witnessAvailable, false); assert.equal(result.receipt.alliancePossible, false);
  assert.equal(result.receipt.roster.leth.testimonyAt, recordedAt);
  assert.match(result.receipt.samiLine, /l’enregistrement antérieur reste identifié comme tel/);
});

test('MI11 receipt validation rejects coherent-looking aggregate edits against physical records', () => {
  const { campaign } = complete();
  const edits = [
    r => { r.roster.listening[0].sampledAt = 0; },
    r => { r.roster.listening[0].signal = .99; },
    r => { r.roster.emitter.warningCopied = false; r.warningCopied = false; r.te01Acquired = false; r.alliancePossible = false; },
    r => { r.roster.leth.consentAt = r.roster.leth.metAt; },
    r => { r.roster.leth.startedAt = r.roster.leth.testimonyAt - 1; },
    r => { r.roster.leth.testimonyAt = r.roster.leth.consentAt; },
    r => { r.roster.leth.publicConsent = true; r.publicConsent = true; },
    r => { r.roster.leth.recruited = true; r.recruited = true; },
    r => { r.roster.leth.consent = false; r.consentGranted = false; },
    r => { r.roster.nests[0].damagedAt = 0; },
    r => { r.roster.privateForces[0].maxHp += 1; },
    r => { r.roster.alert.readyAt = r.roster.alert.triggeredAt; },
    r => { r.roster.report.startedAt = 0; },
    r => { r.partsGranted = 8; },
  ];
  for (const [index, edit] of edits.entries()) assert.throws(() => parseCampaign(JSON.stringify(editReceipt(clone(campaign), edit))), /Sauvegarde invalide/, `receipt forgery ${index}`);
});

test('MI11 public failure is stored as terminal, cannot resume alive and can restart explicitly', () => {
  let { campaign, game } = start({ difficulty: 'normal' });
  pilotMI11(game, { noFire: true, maxFrames: 24000 }); assert.equal(game.status, 'lost');
  const result = finishCampaignMission(campaign, game); campaign = result.campaign;
  assert.equal(result.applied, false); assert.equal(campaign.checkpoint.status, 'lost');
  assert.equal(restoreCampaignGame(parseCampaign(serializeCampaign(campaign))).status, 'lost');
  assert.equal(restoreCampaignGame(campaign, { beforeDecision: true }), null);
  const fake = clone(game); fake.player.hull = fake.player.maxHull; fake.status = 'playing';
  assert.throws(() => checkpointCampaign(campaign, fake), /Sauvegarde invalide/);
  const restarted = beginCampaignMission(campaign, { missionId: 'MI11', restart: true, walkerId: 'WK01', difficulty: 'story' });
  assert.equal(restarted.ok, true); assert.equal(restarted.game.status, 'playing');
  assert.deepEqual(restarted.campaign.resources, history.completed.resources);
  assert.deepEqual(restarted.campaign.completed, history.completed.completed);
});

test('MI11 replay never replaces the first report or rewards and keeps both private text sources separate', () => {
  const { campaign } = complete({ choice: 'obey' }), text = serializeCampaign(campaign);
  const replay = beginCampaignMission(campaign, { missionId: 'MI11', replay: true, walkerId: 'WK01', difficulty: 'story' });
  assert.equal(replay.replay, true); pilotMI11(replay.game, { choice: 'defy' }); assert.equal(replay.game.status, 'won');
  assert.equal(finishCampaignMission(campaign, replay.game, { replay: true }).applied, false);
  assert.equal(checkpointCampaign(campaign, replay.game, { replay: true }), campaign);
  assert.equal(serializeCampaign(campaign), text);
  assert.equal(campaign.completed.MI11.choice, 'obey');
  assert.equal(VOICE_TRANSLATION_PAIRS.length, 3); assert.equal(new Set(VOICE_TRANSLATION_PAIRS.map(pair => pair.id)).size, 3);
  for (const pair of VOICE_TRANSLATION_PAIRS) { assert.equal(typeof pair.imperial, 'string'); assert.equal(typeof pair.leth, 'string'); assert.notEqual(pair.imperial, pair.leth); }
});
