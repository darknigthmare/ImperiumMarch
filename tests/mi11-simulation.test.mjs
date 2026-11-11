import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, ALL_MISSIONS, VOICE_TRANSLATION_PAIRS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, terrainAt, voiceSurfaceAt, voiceReceiptRoster, voiceDerivedFacts } from '../src/simulation.mjs';
import { hitVoicePart } from '../src/voice-simulation.mjs';
import { pilotMI11, moveMI11, fireAtMI11, captureMI11Scene } from './helpers/mi11-driver.mjs';

const create = (walkerId = 'WK01', options = {}) => createGame({ missionId: 'MI11', walkerId, difficulty: 'normal', seed: 1111, ...options });
function idle(s, seconds, input = { brace: true }) {
  for (let i = 0; i < Math.ceil(seconds * 60) && s.status === 'playing'; i++) updateGame(s, 1 / 60, input);
}
const close = (actual, expected, epsilon = 1e-6) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
const injectionRuntime = { terrainAt, emit() {} };

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI11 ${walker.id}/${choice}: listening, real upper foot contacts, witness and physical emitter operation`, t => {
  const s = create(walker.id); let raisedContact = false, protectedExchange = false, checks = 0;
  pilotMI11(s, { choice, observe: (state, frame) => {
    raisedContact ||= state.player.feet.some(foot => foot.contact && voiceSurfaceAt(state, foot.x).rise >= 28
      && Math.abs(foot.y - voiceSurfaceAt(state, foot.x).groundY) < .001);
    protectedExchange ||= state.voice.leth.working && state.voice.leth.work === 'testimony'
      && state.voice.leth.progress > .1 && state.voice.leth.progress < .9 && state.voice.alert.ready;
    if (frame % 180 === 0) {
      for (const nest of state.voice.nests) assert.ok(nest.hp >= 0 && nest.hp <= nest.maxHp);
      assert.equal(state.voice.leth.publicConsent, false); assert.equal(state.voice.leth.recruited, false); checks++;
    }
  } });
  assert.equal(s.status, 'won'); assert.ok(s.player.hull > 0); assert.ok(raisedContact); assert.ok(protectedExchange);
  assert.equal(s.campaign.readingsTaken, 3); assert.equal(s.campaign.signalsRecorded, 3);
  assert.equal(s.campaign.nestsIntact, 3); assert.ok(s.voice.nests.every(nest => nest.damagedAt === null));
  assert.equal(s.campaign.warningCopied, true); assert.equal(s.campaign.translationCopied, true);
  assert.equal(s.campaign.testimonyRecorded, true); assert.equal(s.campaign.te01Acquired, true);
  assert.equal(s.campaign.witnessAvailable, true); assert.equal(s.campaign.privateNeutralized, 3);
  assert.equal(s.campaign.emitterSeized, choice === 'obey'); assert.equal(s.campaign.emitterOnline, choice === 'defy');
  assert.equal(s.campaign.alliancePossible, choice === 'defy'); assert.equal(s.stats.collateral, 0);
  close(s.voice.leth.testimonyAt - s.voice.leth.startedAt, 20);
  close(s.voice.emitter.completedAt - s.voice.emitter.startedAt, 5);
  assert.ok(s.voice.alert.readyAt - s.voice.alert.triggeredAt >= 6 - 1e-6);
  assert.ok(s.voice.report.transmittedAt < s.elapsed);
  t.diagnostic(JSON.stringify({ scenario: 'MI11 public controls', walkerId: walker.id, choice, elapsed: s.elapsed,
    raisedContact, protectedExchange, checkpoints: checks, facts: s.campaign, nests: s.voice.nests.map(nest => ({ id: nest.id, hp: nest.hp })) }));
});

test('MI11 adds only its own local domain and bounds the inherited MI10 context', () => {
  for (const mission of ALL_MISSIONS.filter(item => item.id !== 'MI11')) assert.equal(Object.hasOwn(createGame({ missionId: mission.id }), 'voice'), false);
  const s = create('WK01', { campaignContext: { chemicalRecorded: true, chemicalChoice: 'defy', chemicalPt02: true,
    chemicalVillageHabitable: true, chemicalWaterRestored: true, inventedPopulation: 55, lethRecruited: true } });
  assert.deepEqual(s.campaign.context, { chemicalRecorded: true, chemicalChoice: 'defy', chemicalPt02: true, chemicalVillageHabitable: true, chemicalWaterRestored: true });
  assert.equal(s.civilians.length, 0); assert.equal(s.voice.nests.length, 3); assert.equal(s.voice.leth.characterId, 'PN06');
  assert.equal(s.campaign.lethMet, false); assert.equal(s.campaign.lethTrust, 0); assert.equal(s.campaign.te01Acquired, false);
  assert.equal(s.campaign.sourceLocated, false); assert.equal(s.voice.leth.publicConsent, false); assert.equal(s.voice.leth.recruited, false);
});

test('MI11 listening requires real anchoring, still feet, quiet time and four elapsed seconds', () => {
  const s = create(); moveMI11(s, 550); idle(s, 2, {});
  assert.equal(commandGame(s, 'interact'), false); assert.equal(s.voice.listening[0].sampled, false);
  idle(s, .1); assert.equal(commandGame(s, 'interact'), true); idle(s, 3.8);
  assert.equal(s.voice.listening[0].sampled, false); idle(s, .3);
  assert.equal(s.voice.listening[0].sampled, true); close(s.voice.listening[0].completedAt - s.voice.listening[0].startedAt, 4);
});

test('MI11 gunfire interrupts a vibration reading and requires a new start after silence', () => {
  const s = create(); moveMI11(s, 550); idle(s, 2); commandGame(s, 'interact'); idle(s, 1);
  assert.ok(s.voice.listening[0].progress > 0);
  updateGame(s, 1 / 60, { brace: true, fire: true, aimX: 1300, aimY: 30 });
  assert.equal(s.voice.listening[0].working, false); assert.equal(s.voice.listening[0].progress, 0);
  assert.equal(commandGame(s, 'interact'), false); idle(s, 2);
  assert.equal(s.voice.listening[0].sampled, false); commandGame(s, 'interact'); idle(s, 4.1);
  assert.equal(s.voice.listening[0].sampled, true);
});

test('MI11 location is acquired only after the third usable reading; recorded signals persist', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.campaign.readingsTaken === 2 });
  assert.equal(s.campaign.sourceLocated, false); assert.equal(s.campaign.signalsRecorded, 2);
  pilotMI11(s, { stopAt: state => state.campaign.readingsTaken === 3 });
  assert.equal(s.campaign.sourceLocated, true);
  assert.ok(s.voice.listening[0].signal < s.voice.listening[1].signal && s.voice.listening[1].signal < s.voice.listening[2].signal);
  const recorded = s.voice.listening.map(point => [point.signal, point.bearing, point.sampledAt]);
  fireAtMI11(s, 'voice-listening-3'); assert.equal(s.voice.listening[2].destroyed, true);
  assert.deepEqual(s.voice.listening.map(point => [point.signal, point.bearing, point.sampledAt]), recorded);
  assert.equal(s.campaign.signalsRecorded, 3);
});

test('MI11 a lost listening point is a recorded absence, not a recovered signal', () => {
  const s = create(); fireAtMI11(s, 'voice-listening-1'); assert.equal(s.voice.listening[0].destroyed, true);
  pilotMI11(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.readingsTaken, 3);
  assert.equal(s.campaign.signalsRecorded, 2); assert.equal(s.voice.listening[0].detected, false);
  assert.equal(s.voice.listening[0].signal, 0); assert.equal(s.campaign.te01Acquired, false);
});

test('MI11 uncovered footfalls damage the actual nesting volumes; later survey never heals them', () => {
  const s = create('WK09'); moveMI11(s, 2750); idle(s, 1);
  assert.ok(s.voice.nests.some(nest => nest.hp < nest.maxHp));
  const damaged = s.voice.nests.map(nest => ({ hp: nest.hp, damagedAt: nest.damagedAt }));
  moveMI11(s, 1820); idle(s, 2); assert.equal(commandGame(s, 'interact'), true); idle(s, 4.1);
  assert.equal(s.voice.ridge.surveyed, true);
  s.voice.nests.forEach((nest, i) => { assert.ok(nest.hp <= damaged[i].hp); assert.equal(nest.damagedAt, damaged[i].damagedAt); });
});

test('MI11 loss of the surveyed ridge removes the physical support and cannot be repaired by E', () => {
  const s = create(); pilotMI11(s, { destroyRidgeAfterSurvey: true });
  assert.equal(s.status, 'won'); assert.equal(s.voice.ridge.destroyed, true); assert.equal(s.voice.ridge.surveyed, true);
  assert.equal(voiceSurfaceAt(s, 2380).rise, 0); assert.ok(s.campaign.nestsIntact < 3);
  assert.equal(s.campaign.consentRefused, true); assert.equal(s.campaign.testimonyRecorded, false);
});

test('MI11 private slots have no physical presence before a site event and its arrival delay', () => {
  const hidden = create(); moveMI11(hidden, 4290); idle(hidden, 2);
  const target = hidden.enemies[1], hp = hidden.enemies.map(unit => unit.hp);
  idle(hidden, 3, { brace: true, fire: true, aimX: target.x, aimY: target.y });
  assert.deepEqual(hidden.enemies.map(unit => unit.hp), hp); assert.ok(hidden.enemies.every(unit => !unit.active));
  assert.equal(hidden.voice.alert.triggered, false);
  const s = create(); pilotMI11(s, { stopAt: state => state.voice.leth.met });
  assert.equal(s.voice.alert.reason, 'contact'); assert.equal(s.voice.alert.ready, false);
  idle(s, 5.8); assert.equal(s.voice.alert.ready, false); idle(s, .3);
  assert.equal(s.voice.alert.ready, true); assert.ok(s.enemies.some(unit => unit.active));
});

test('MI11 meeting, permission and recorded exchange are separate physical events', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.voice.leth.met });
  assert.equal(s.voice.leth.consentAsked, false); assert.equal(s.campaign.testimonyRecorded, false); assert.equal(s.campaign.te01Acquired, false);
  pilotMI11(s, { stopAt: state => state.voice.leth.consent });
  assert.equal(s.campaign.testimonyStarted, false); assert.equal(s.campaign.testimonyRecorded, false);
  pilotMI11(s, { stopAt: state => state.voice.leth.progress > .4 && state.voice.leth.work === 'testimony' });
  assert.equal(s.campaign.testimonyRecorded, false); assert.equal(s.campaign.te01Acquired, false);
  pilotMI11(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.te01Acquired, true);
});

test('MI11 a damaged nesting site permits a truthful refusal and completion without TE01', () => {
  const s = create(); pilotMI11(s, { skipRidge: true });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.consentAsked, true); assert.equal(s.campaign.consentRefused, true);
  assert.equal(s.campaign.consentGranted, false); assert.equal(s.campaign.testimonyRecorded, false); assert.equal(s.campaign.te01Acquired, false);
  assert.ok(s.voice.nests.some(nest => nest.damagedAt < s.voice.leth.consentAt)); assert.equal(s.stats.collateral, 0);
});

test('MI11 the imperial text and Leth’s explained meanings appear only after their separate acquisitions', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.campaign.translationCopied });
  let radio = s.events.map(event => event.text).join('\n');
  for (const pair of VOICE_TRANSLATION_PAIRS) { assert.ok(radio.includes(pair.imperial)); assert.equal(radio.includes(pair.leth), false); }
  pilotMI11(s, { stopAt: state => state.campaign.consentGranted });
  radio = s.events.map(event => event.text).join('\n');
  for (const pair of VOICE_TRANSLATION_PAIRS) assert.equal(radio.includes(pair.leth), false);
  pilotMI11(s, { stopAt: state => state.campaign.testimonyRecorded });
  radio = s.events.map(event => event.text).join('\n');
  for (const pair of VOICE_TRANSLATION_PAIRS) assert.ok(radio.includes(pair.leth));
  assert.equal(s.campaign.publicConsent, false);
});

test('MI11 a first impact after permission withdraws unfinished testimony without inventing a recording', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.voice.leth.consent });
  // Targeted damage injection checks the consent transition; the full routes above use public controls.
  hitVoicePart(s, s.voice.nests[0], 1, injectionRuntime);
  assert.equal(s.campaign.consentGranted, true); assert.equal(s.campaign.consentWithdrawn, true);
  assert.equal(s.campaign.witnessAvailable, false); assert.equal(s.campaign.testimonyRecorded, false);
  pilotMI11(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.te01Acquired, false);
});

test('MI11 a late physical nesting loss withdraws cooperation but preserves the completed private recording', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.campaign.testimonyRecorded && state.campaign.privateNeutralized === 3 });
  const recordedAt = s.voice.leth.testimonyAt;
  fireAtMI11(s, 'voice-root-passage'); moveMI11(s, 2750); idle(s, .1);
  assert.equal(s.campaign.consentWithdrawn, true); assert.ok(s.voice.leth.withdrawnAt > recordedAt);
  assert.equal(s.campaign.witnessAvailable, false); assert.equal(s.campaign.te01Acquired, true);
  assert.equal(s.voice.leth.testimonyAt, recordedAt); assert.equal(s.voice.leth.publicConsent, false);
  pilotMI11(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.alliancePossible, false);
});

test('MI11 leaving the exchange radius interrupts work and cannot auto-complete it in the distance', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.voice.leth.work === 'testimony' && state.voice.leth.progress > .03 });
  moveMI11(s, 2500); assert.equal(s.voice.leth.working, false); assert.equal(s.voice.leth.progress, 0);
  assert.equal(s.voice.leth.testimonyRecorded, false); idle(s, 1);
  assert.equal(s.voice.leth.testimonyRecorded, false);
});

test('MI11 hostile projectiles can kill Leth before recording when the player leaves the firing lane', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.voice.leth.consent }); moveMI11(s, 3100);
  for (let frame = 0; frame < 12000 && s.voice.leth.alive && s.status === 'playing'; frame++) updateGame(s, 1 / 60, {});
  assert.equal(s.voice.leth.alive, false); assert.equal(s.campaign.testimonyLost, true); assert.equal(s.stats.collateral, 1);
  assert.equal(s.campaign.te01Acquired, false); assert.ok(s.enemies.some(unit => unit.attackTarget === 'voice-leth'));
  pilotMI11(s); assert.equal(s.status, 'won'); assert.equal(s.stats.collateral, 1);
});

for (const [name, option, field] of [['original warning', 'destroyEmitterBeforeCopy', 'warningCopied'], ['imperial translation', 'destroyReceiverBeforeCopy', 'translationCopied']]) {
  test(`MI11 ${name} lost before copying cannot be reconstructed by testimony or extraction`, () => {
    const s = create(); pilotMI11(s, { [option]: true });
    assert.equal(s.status, 'won'); assert.equal(s.campaign[field], false); assert.equal(s.campaign.te01Acquired, false);
    assert.equal(s.campaign.testimonyRecorded, true);
  });
}

test('MI11 a witness lost after recording leaves TE01 intact but no available witness or alliance', () => {
  const s = create(); pilotMI11(s, { destroyLethAfterExchange: true });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.te01Acquired, true); assert.equal(s.campaign.testimonyRecorded, true);
  assert.equal(s.campaign.lethAlive, false); assert.equal(s.campaign.witnessAvailable, false); assert.equal(s.campaign.alliancePossible, false);
  assert.equal(s.stats.collateral, 1); assert.ok(s.voice.leth.testimonyAt < s.voice.leth.destroyedAt);
  const events = s.events.length; hitVoicePart(s, s.voice.nests[0], 1, injectionRuntime);
  assert.equal(s.voice.leth.withdrawn, false); assert.equal(s.events.length, events);
});

test('MI11 both copied originals may be destroyed later without deleting the private testimony', () => {
  const s = create(); pilotMI11(s, { destroyOriginalsAfterExchange: true });
  assert.equal(s.status, 'won'); assert.equal(s.voice.emitter.destroyed, true); assert.equal(s.voice.receiver.destroyed, true);
  assert.equal(s.campaign.warningCopied, true); assert.equal(s.campaign.translationCopied, true);
  assert.equal(s.campaign.te01Acquired, true); assert.equal(s.campaign.emitterOnline, false);
  assert.ok(s.voice.emitter.copiedAt < s.voice.emitter.destroyedAt); assert.ok(s.voice.receiver.copiedAt < s.voice.receiver.destroyedAt);
});

test('MI11 order dialog pauses exactly and its response performs no emitter operation', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.decision.active });
  assert.equal(s.decision.active, true); const frozen = structuredClone(s), roster = voiceReceiptRoster(s);
  for (let i = 0; i < 30; i++) updateGame(s, .05, { move: 1, fire: true, interact: true });
  assert.deepEqual(s, frozen); assert.equal(commandGame(s, 'choice', 'obey'), true);
  assert.deepEqual(voiceReceiptRoster(s), roster); assert.equal(s.campaign.plan, 'seize'); assert.equal(s.campaign.emitterSeized, false);
  pilotMI11(s, { choice: 'obey' }); assert.equal(s.status, 'won'); assert.equal(s.campaign.emitterSeized, true);
});

test('MI11 exact JSON continuation preserves incomplete readings, exchange and emitter operation', () => {
  for (const stopAt of [state => state.voice.listening[0].progress > .4,
    state => state.voice.leth.work === 'testimony' && state.voice.leth.progress > .4,
    state => state.voice.emitter.work === 'seize' && state.voice.emitter.progress > .4]) {
    const s = create('WK09'); pilotMI11(s, { choice: 'obey', stopAt });
    assert.equal(s.status, 'playing'); const restored = JSON.parse(JSON.stringify(s));
    pilotMI11(s, { choice: 'obey' }); pilotMI11(restored, { choice: 'obey' });
    assert.equal(s.status, 'won'); assert.deepEqual(restored, s);
  }
});

test('MI11 receipt derivation and captured scenes never mutate or share the live state', () => {
  const s = create(); pilotMI11(s, { stopAt: state => state.decision.active });
  const before = JSON.stringify(s), facts = voiceDerivedFacts(s), roster = voiceReceiptRoster(s), image = captureMI11Scene(s, { source: 'public commands' });
  assert.equal(JSON.stringify(s), before); assert.equal(facts.emitterSeized, false);
  pilotMI11(s, { choice: 'obey' }); assert.equal(s.status, 'won');
  assert.equal(roster.emitter.seized, false); assert.equal(image.state.voice.emitter.seized, false);
  assert.equal(s.voice.emitter.seized, true);
});

test('MI11 a no-fire defeat is terminal while a new sortie starts without witness or testimony', () => {
  const s = create(); pilotMI11(s, { noFire: true }); assert.equal(s.status, 'lost');
  const terminal = structuredClone(s); assert.equal(commandGame(s, 'interact'), false); updateGame(s, .05, { move: 1, fire: true });
  assert.deepEqual(s, terminal); const fresh = create(); assert.equal(fresh.campaign.lethMet, false);
  assert.equal(fresh.campaign.te01Acquired, false); assert.equal(fresh.campaign.privateTriggered, false);
  assert.ok(fresh.voice.nests.every(nest => nest.hp === nest.maxHp));
});
