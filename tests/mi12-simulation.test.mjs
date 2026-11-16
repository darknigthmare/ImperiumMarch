import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, ALL_MISSIONS } from '../src/content.mjs';
import { createGame, updateGame, commandGame, terrainAt } from '../src/simulation.mjs';
import { hitRelayPart, relaySolids, relayDerivedFacts, relayObjectives } from '../src/relay-simulation.mjs';
import { validateRelayMission, validateRelaySortie } from '../src/relay-validation.mjs';
import { pilotMI12, moveMI12, fireAtMI12, captureMI12Scene } from './helpers/mi12-driver.mjs';
import { RELAY_ASSET_NAMES, RELAY_ASSET_SPECS, relayAssetGeometry, relayAssetSVG } from '../src/relay-assets.mjs';
import { relaySummary } from '../src/relay-renderer.mjs';

const create = (walkerId = 'WK09', options = {}) => createGame({ missionId: 'MI12', walkerId, difficulty: 'normal', seed: 2147, ...options });
const runtime = { terrainAt, emit() {} };
const idle = (s, seconds, input = { brace: true }) => { for (let f = 0; f < Math.ceil(seconds * 60) && s.status === 'playing' && !s.decision.active; f++) updateGame(s, 1 / 60, input); };
const close = (a, b, epsilon = .051) => assert.ok(Math.abs(a - b) <= epsilon, `${a} != ${b}`);
const templateFor = s => create(s.walkerId, { difficulty: s.difficultyId, seed: s.seed, campaignContext: s.campaign.context });

for (const walker of WALKERS) for (const choice of ['obey', 'defy', 'refuse']) test(`MI12 ${walker.id}/${choice}: physical copy, Praetor duel, three on-site operations and extraction`, () => {
  const s = create(walker.id), template = templateFor(s); let arrived = false, telegraphed = false, checks = 0;
  pilotMI12(s, { choice, observe: (state, frame) => {
    arrived ||= state.relay.alert.ready; telegraphed ||= state.relay.praetor.telegraph > .25;
    if (frame % 1500 === 0) { validateRelayMission(state, template); checks++; }
  } });
  assert.equal(s.status, 'won'); assert.ok(s.player.hull > 0); assert.ok(arrived); assert.ok(telegraphed); assert.ok(checks > 5);
  assert.equal(s.campaign.ordersCopied, true); assert.equal(s.campaign.industrialOrdersCopied, true); assert.equal(s.campaign.relaysLost, 0);
  assert.equal(s.campaign.relaysErased, choice === 'obey' ? 3 : choice === 'defy' ? 2 : 0);
  assert.equal(s.campaign.relaysIsolated, choice === 'obey' ? 0 : choice === 'defy' ? 1 : 3);
  assert.equal(s.campaign.publicRefusal, choice === 'refuse'); assert.equal(s.campaign.refugeClosed, choice === 'refuse');
  assert.equal(s.campaign.holtAlerted, choice !== 'obey'); assert.equal(s.stats.kills, 1); assert.equal(s.stats.collateral, 0);
  assert.ok(s.relay.copy.copiedAt <= s.relay.window.deadline); close(s.relay.copy.completedAt - s.relay.copy.startedAt, 24);
  for (const r of s.relay.relays) close(r.completedAt - r.startedAt, 5);
  close(s.relay.alert.readyAt - s.relay.alert.triggeredAt, 6); assert.ok(s.relay.report.transmittedAt < s.elapsed);
  validateRelayMission(s, template);
});

test('MI12 has a local scene and bounded MI11/MI10 inheritance without populations or future proofs', () => {
  for (const m of ALL_MISSIONS.filter(m => m.id !== 'MI12')) assert.equal(Object.hasOwn(createGame({ missionId: m.id }), 'relay'), false);
  const s = create('WK09', { campaignContext: { voiceRecorded: true, voiceChoice: 'defy', voiceTe01: true, lethAvailable: true, chemicalPt02: true, inventedPopulation: 12, defection: true } });
  assert.deepEqual(s.campaign.context, { voiceRecorded: true, voiceChoice: 'defy', voiceTe01: true, lethAvailable: true, chemicalPt02: true });
  assert.equal(s.civilians.length, 0); assert.equal(s.enemies.length, 0); assert.equal(s.relay.praetor.designation, 'VE12');
  assert.equal(s.campaign.ordersCopied, false); assert.equal(s.campaign.publicRefusal, false);
  for (const k of ['pt03Acquired', 'pt04Acquired', 'te02Acquired', 'po01Acquired', 'defected']) assert.notEqual(s.campaign[k], true);
});

test('MI12 inspections require anchored feet and their actual three seconds', () => {
  const s = create(); moveMI12(s, s.relay.relays[0].x - 100); idle(s, 2, {});
  assert.equal(commandGame(s, 'interact'), false); idle(s, .1); assert.equal(commandGame(s, 'interact'), true);
  idle(s, 2.8); assert.equal(s.relay.relays[0].inspected, false); idle(s, .3);
  assert.equal(s.relay.relays[0].inspected, true); close(s.relay.relays[0].inspectedAt - s.relay.relays[0].startedAt, 3);
  assert.equal(s.relay.window.opened, false);
});

test('MI12 threat bodies, damage and shots are absent until its six-second arrival', () => {
  const s = create(), initial = structuredClone(s.relay.praetor);
  assert.equal(relaySolids(s).some(p => p.id.includes('praetor')), false);
  hitRelayPart(s, s.relay.praetor.sensor, 9999, runtime); idle(s, 8);
  assert.deepEqual(s.relay.praetor, initial);
  pilotMI12(s, { stopAt: state => state.relay.window.opened });
  const triggered = s.relay.alert.triggeredAt; idle(s, 5.8);
  assert.equal(s.relay.alert.ready, false); assert.equal(s.relay.praetor.shots, 0);
  assert.equal(relaySolids(s).some(p => p.id.includes('praetor')), false);
  idle(s, .3); assert.equal(s.relay.alert.ready, true); close(s.relay.alert.readyAt - triggered, 6);
  assert.equal(relaySolids(s).filter(p => p.id.includes('praetor')).length, 3);
});

test('MI12 interrupted copying loses incomplete progress and requires a new interaction inside the original window', () => {
  const s = create(); pilotMI12(s, { stopAt: state => state.relay.copy.progress > .15 });
  const openedAt = s.relay.window.openedAt, deadline = s.relay.window.deadline, before = structuredClone(s);
  updateGame(s, 1 / 60, { move: -1 });
  assert.equal(s.relay.copy.working, false); assert.equal(s.relay.copy.progress, 0); assert.equal(s.campaign.ordersCopied, false);
  assert.equal(s.relay.window.openedAt, openedAt); assert.equal(s.relay.window.deadline, deadline);
  idle(s, 1.5); assert.equal(s.relay.copy.progress, 0); assert.equal(commandGame(s, 'interact'), true);
  idle(s, 23.9); assert.equal(s.campaign.ordersCopied, false); idle(s, .2); assert.equal(s.campaign.ordersCopied, true);
  validateRelaySortie(before, s);
});

test('MI12 a frozen snapshot preserves copy progress, deadline and aim without a wall clock', () => {
  const s = create(); pilotMI12(s, { stopAt: state => state.relay.copy.progress > .45 });
  const snapshot = JSON.stringify(s), frozen = JSON.parse(snapshot);
  assert.equal(JSON.stringify(s), snapshot); assert.deepEqual(frozen.relay, s.relay);
  idle(s, .25); assert.ok(s.relay.copy.progress > frozen.relay.copy.progress); assert.equal(s.relay.window.deadline, frozen.relay.window.deadline);
  validateRelaySortie(frozen, s);
});

for (const [name, options, copied, lost, expired] of [
  ['window expires', { skipCopy: true }, false, false, true],
  ['source lost before reading', { destroySourceBeforeCopy: true }, false, true, false],
  ['source lost after acquisition', { destroySourceAfterCopy: true }, true, false, false],
]) test(`MI12 ${name}: can finish with an explicit factual absence or retained copy`, () => {
  const s = create('WK09', { difficulty: 'story' }); pilotMI12(s, options);
  assert.equal(s.status, 'won'); assert.equal(s.campaign.ordersCopied, copied); assert.equal(s.campaign.copyLost, lost); assert.equal(s.relay.copy.expired, expired);
  assert.equal(s.evidence.collected, copied); assert.equal(s.stats.evidence, Number(copied));
  if (expired) { assert.equal(s.relay.copy.copiedAt, null); close(s.relay.window.expiredAt - s.relay.window.openedAt, 45); }
  if (copied) assert.ok(s.relay.relays[2].destroyedAt > s.relay.copy.copiedAt);
  else assert.equal(s.relay.copy.copiedAt, null);
  validateRelayMission(s, templateFor(s));
});

for (const choice of ['obey', 'defy', 'refuse']) test(`MI12 ${choice} decision does not operate, repair or move any relay`, () => {
  const s = create(); pilotMI12(s, { stopAt: state => state.decision.active });
  const bodies = structuredClone(s.relay); assert.equal(commandGame(s, 'choice', choice), true);
  assert.deepEqual(s.relay, bodies); assert.equal(s.campaign.operationsResolved, false);
  assert.equal(s.campaign.relaysErased, 0); assert.equal(s.campaign.relaysIsolated, 0);
  assert.equal(commandGame(s, 'choice', choice), false);
});

test('MI12 sensor destruction cancels current lock and removes long-range shots', () => {
  const s = create(); pilotMI12(s, { noFire: true, stopAt: state => state.relay.praetor.telegraph > .2 });
  assert.ok(Math.abs(s.player.x - s.relay.praetor.x) > 560);
  hitRelayPart(s, s.relay.praetor.sensor, 1000, runtime);
  assert.equal(s.relay.praetor.telegraph, 0); assert.equal(s.relay.praetor.phase, 'recover');
  const shots = s.relay.praetor.shots; idle(s, 5); assert.equal(s.relay.praetor.shots, shots);
  assert.equal(s.campaign.sensorDisabled, true);
});

test('MI12 front hydraulic lock controls actual armor absorption and movement', () => {
  const s = create(); pilotMI12(s, { stopAt: state => state.relay.alert.ready });
  const p = s.relay.praetor, hp = p.hp; hitRelayPart(s, p, 20, runtime); close(hp - p.hp, 9.6, 1e-6);
  hitRelayPart(s, p.hydraulicLock, 1000, runtime); const exposedHP = p.hp; hitRelayPart(s, p, 20, runtime); close(exposedHP - p.hp, 26, 1e-6);
  moveMI12(s, p.x - 350); const x = p.x; idle(s, 1); assert.ok(p.x > x); assert.equal(p.speed, 22);
  p.feet.forEach(f => close(f.y, terrainAt(f.x, s.planetId), 1e-6));
});

test('MI12 refuses an invented copy, component repair, accelerated work and an altered acquired decision', () => {
  const s = create(); pilotMI12(s, { stopAt: state => state.relay.copy.progress > .1 });
  const forged = structuredClone(s); forged.relay.copy.copied = true; forged.relay.copy.copiedAt = forged.elapsed;
  Object.assign(forged.campaign, relayDerivedFacts(forged)); forged.objectives = relayObjectives(forged);
  assert.throws(() => validateRelayMission(forged, templateFor(forged)), /copie|durée/);
  const accelerated = structuredClone(s); accelerated.relay.copy.progress = .9;
  assert.throws(() => validateRelayMission(accelerated, templateFor(accelerated)), /accéléré/);
  pilotMI12(s, { stopAt: state => state.decision.resolved });
  const repaired = structuredClone(s); repaired.relay.praetor.sensor.hp = repaired.relay.praetor.sensor.maxHp;
  assert.throws(() => validateRelaySortie(s, repaired), /intégrité/);
  const changed = structuredClone(s); changed.decision.choice = 'obey'; assert.throws(() => validateRelaySortie(s, changed), /choix/);
});

test('MI12 no-fire attack is a real terminal defeat, not a narrative countdown', () => {
  const s = create(); pilotMI12(s, { noFire: true }); assert.equal(s.status, 'lost'); assert.equal(s.player.hull, 0);
  assert.ok(s.relay.praetor.shots > 0); assert.equal(s.relay.report.transmitted, false); assert.equal(s.campaign.praetorNeutralized, false);
  const terminal = JSON.stringify(s); updateGame(s, 1 / 60, { fire: true, move: 1 }); assert.equal(JSON.stringify(s), terminal);
  validateRelayMission(s, templateFor(s));
});

test('MI12 source destruction after a completed purge preserves its completed operation and copied archive', () => {
  const s = create(); pilotMI12(s, { choice: 'obey', stopAt: state => state.campaign.operationsResolved });
  const source = s.relay.relays[2], purgeTime = source.erasedAt, copyTime = s.relay.copy.copiedAt;
  fireAtMI12(s, source.id); assert.equal(source.destroyed, true); assert.equal(source.erasedAt, purgeTime); assert.equal(s.relay.copy.copiedAt, copyTime);
  validateRelayMission(s, templateFor(s)); pilotMI12(s); assert.equal(s.status, 'won');
});

test('MI12 capture deep-copies bodies and interface summaries expose acquisition without a fabricated text', () => {
  const s = create(), capture = captureMI12Scene(s, { proofKind: 'public-input simulation' }); const bytes = JSON.stringify(capture);
  pilotMI12(s, { skipCopy: true }); assert.equal(JSON.stringify(capture), bytes);
  assert.match(relaySummary(s).copy, /COPIE INCOMPLÈTE/); assert.match(relaySummary(s).orders, /Aucune commande/);
});

test('MI12 original SVG and Canvas assets share geometry, metadata and explicit states', () => {
  assert.equal(RELAY_ASSET_NAMES.length, 6);
  for (const name of RELAY_ASSET_NAMES) for (const state of RELAY_ASSET_SPECS[name].states) {
    const g = relayAssetGeometry({ part: name, state, progress: .5 }), svg = relayAssetSVG(g);
    assert.ok(g.shapes.length > 0); assert.ok(g.canonIds.includes('MI12')); assert.deepEqual(g.pivot, [0, 0]);
    assert.match(svg, /src\/relay-assets.mjs/); assert.match(svg, /<svg/); assert.doesNotMatch(svg, /<image|<script|https:\/\//);
  }
});
