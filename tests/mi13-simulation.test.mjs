import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, commandGame, terrainAt, foundrySurfaceAt } from '../src/simulation.mjs';
import { WALKERS } from '../src/content.mjs';
import { foundryDerivedFacts, foundrySolids, updateFoundryMission, foundryReceiptRoster } from '../src/foundry-simulation.mjs';
import { validateFoundryMission, validateFoundrySortie, validateFoundryFacts } from '../src/foundry-validation.mjs';
import { FOUNDRY_ASSET_NAMES, FOUNDRY_ASSET_SPECS, foundryAssetGeometry, foundryAssetSVG } from '../src/foundry-assets.mjs';
import { foundrySummary } from '../src/foundry-renderer.mjs';
import { pilotMI13, moveMI13, fireAtMI13, captureMI13Scene } from './helpers/mi13-driver.mjs';

const config = (walkerId = 'WK09', extra = {}) => ({ missionId: 'MI13', walkerId, difficulty: 'story', seed: 1313, ...extra });
const create = (walkerId = 'WK09', extra = {}) => createGame(config(walkerId, extra));
const run = (options = {}, walkerId = 'WK09', extra = {}) => { const s = create(walkerId, extra); pilotMI13(s, options); return s; };
const valid = s => validateFoundryMission(s, createGame({ missionId: 'MI13', walkerId: s.walkerId, difficulty: s.difficultyId, seed: s.seed, campaignContext: s.campaign.context }));
function advance(s, seconds, input = { brace: true }) { for (let frame = 0; frame < Math.round(seconds * 60); frame++) updateGame(s, 1 / 60, input); }
function anchor(s) { for (let frame = 0; frame < 240; frame++) { updateGame(s, 1 / 60, { brace: true }); if (Math.abs(s.player.speed) < 3 && s.player.feet.every(f => f.contact)) break; } }

test('MI13 creates a separate carrier, two physical cargo bodies, four contact wheels and no borrowed population', () => {
  const s = create(); valid(s);
  assert.equal(s.foundry.cargo.length, 2); assert.equal(s.foundry.carrier.wheels.length, 4);
  assert.ok(s.foundry.cargo.every(c => c !== s.foundry.carrier)); assert.notEqual(s.foundry.cargo[0].x, s.foundry.cargo[1].x);
  assert.equal(s.civilians.length, 0); assert.equal(s.campaign.cargoTotal, 2); assert.equal(s.campaign.pt03Acquired, false);
  for (const missionId of ['MI01', 'MI10', 'MI11']) assert.equal(createGame({ missionId }).foundry, undefined);
});

test('two fixed thermal bridges carry the same surface used by the real feet and wheels', () => {
  const s = create();
  for (const bridge of s.foundry.bridges) {
    assert.equal(foundrySurfaceAt(s, bridge.start).rise, 0);
    assert.equal(foundrySurfaceAt(s, (bridge.start + bridge.end) / 2).rise, s.mission.foundry.bridgeRise);
    assert.equal(foundrySurfaceAt(s, bridge.end).rise, 0);
  }
  pilotMI13(s, { skipValves: true, stopAt: state => state.foundry.carrier.wheels.some(w => w.bridgeId) });
  assert.ok(s.foundry.carrier.wheels.some(w => w.bridgeId));
  for (const wheel of s.foundry.carrier.wheels) assert.equal(wheel.y + wheel.radius, foundrySurfaceAt(s, wheel.x).groundY);
  assert.ok(s.player.feet.some(f => f.contact && Math.abs(f.y - foundrySurfaceAt(s, f.x).groundY) < .001)); valid(s);
});

test('opening a valve requires four anchored seconds and interruption resets the unfinished work', () => {
  const s = create(), bridge = s.foundry.bridges[0]; moveMI13(s, bridge.valve.x - 80); anchor(s);
  commandGame(s, 'interact'); advance(s, 2); assert.equal(bridge.circuitOpen, false); assert.ok(bridge.valve.progress > .45);
  updateGame(s, 1 / 60, { move: 1 }); assert.equal(bridge.valve.working, false); assert.equal(bridge.valve.progress, 0);
  anchor(s); commandGame(s, 'interact'); advance(s, 3.9); assert.equal(bridge.circuitOpen, false);
  advance(s, .12); assert.equal(bridge.circuitOpen, true); assert.equal(bridge.steam.phase, 'off');
  assert.ok(bridge.temperature > 88 && bridge.temperature < 90, 'cooling is progressive');
  advance(s, 8); assert.equal(bridge.temperature, 28); valid(s);
});

test('steam runs a deterministic warning/jet/rest cycle and an opened circuit removes the jet', () => {
  const s = create(); advance(s, 1); assert.equal(s.foundry.bridges[0].steam.phase, 'warning');
  advance(s, 2.1); assert.equal(s.foundry.bridges[0].steam.phase, 'jet');
  advance(s, 2); assert.equal(s.foundry.bridges[0].steam.phase, 'rest');
  advance(s, 7); assert.equal(s.foundry.bridges[0].steam.phase, 'warning'); valid(s);
});

test('conduction requires an actual planted foot at the bridge surface, independently of ambient exposure', () => {
  const s = create(), bridge = s.foundry.bridges[0], x = (bridge.start + bridge.end) / 2;
  // A controlled contact fixture tests the thermal boundary without claiming a played route.
  s.player.x = x; s.player.feet.forEach(f => { f.x = x; f.y = foundrySurfaceAt(s, x).groundY; f.contact = false; });
  const runtime = { terrainAt, emit() {}, finish() {} };
  updateFoundryMission(s, .05, runtime); assert.equal(s.foundry.thermal.conductionAdded, 0); assert.ok(s.foundry.thermal.ambientAdded > 0);
  s.player.feet[0].contact = true; updateFoundryMission(s, .05, runtime); assert.ok(s.foundry.thermal.conductionAdded > 0);
  const amount = s.foundry.thermal.conductionAdded; s.player.feet[0].y -= 12; updateFoundryMission(s, .05, runtime); assert.equal(s.foundry.thermal.conductionAdded, amount);
});

test('the ambush remains dormant and unharmed before its actual six-second arrival', () => {
  const s = create(), initial = structuredClone(s.enemies); advance(s, 10, {});
  assert.deepEqual(s.enemies, initial); moveMI13(s, s.mission.foundry.ambushX + 40);
  assert.equal(s.foundry.alert.triggered, true); assert.equal(s.foundry.alert.ready, false);
  const before = structuredClone(s.enemies); advance(s, 6 - s.foundry.alert.elapsed - .1); assert.equal(s.foundry.alert.ready, false); assert.deepEqual(s.enemies, before);
  advance(s, .2); assert.equal(s.foundry.alert.ready, true);
  assert.ok(Math.abs(s.foundry.alert.readyAt - s.foundry.alert.triggeredAt - 6) < .05); valid(s);
});

test('marquages cannot be inspected before the targeted ambush', () => {
  const s = create(); pilotMI13(s, { stopAt: game => game.foundry.carrier.released });
  assert.equal(s.campaign.markingsCopied, 0); assert.equal(s.foundry.alert.ready, false);
  commandGame(s, 'interact'); advance(s, 4); assert.equal(s.campaign.cargoInspected, 0);
});

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI13 ${walker.id} physically completes ${choice === 'obey' ? 'central delivery' : 'quarantine'} with retained PT03`, () => {
  const s = run({ choice }, walker.id); assert.equal(s.status, 'won'); assert.equal(s.campaign.pt03Acquired, true);
  assert.equal(s.campaign.plan, choice === 'obey' ? 'deliver' : 'quarantine'); assert.equal(s.campaign.cargoTransferred, 2);
  assert.equal(s.foundry.carrier.x, choice === 'obey' ? s.mission.foundry.deliveryX : s.mission.foundry.quarantineX);
  assert.ok(s.foundry.cargo.every(c => c.transferredAt >= s.foundry.carrier.arrivedAt + 5 - .05));
  assert.equal(s.campaign.publicReleased, false); assert.equal(s.campaign.defected, false); valid(s);
});

test('choosing a destination performs no cargo transfer or vehicle teleport and the decision pauses exactly', () => {
  const s = run({ stopAt: game => game.decision.active }); assert.equal(s.decision.active, true);
  const before = JSON.stringify(s); advance(s, 2, { move: 1, fire: true }); assert.equal(JSON.stringify(s), before);
  const carrierX = s.foundry.carrier.x, cargo = structuredClone(s.foundry.cargo); commandGame(s, 'choice', 'defy');
  assert.equal(s.foundry.carrier.x, carrierX); assert.deepEqual(s.foundry.cargo, cargo); assert.equal(s.campaign.operationsResolved, false); valid(s);
});

for (const [name, options, expected] of [
  ['lost manifest before copying', { destroyManifestBeforeCopy: true }, { pt03: false, markings: 2, manifest: false, lost: 0 }],
  ['lost cargo before copying', { destroyCargoBeforeCopy: true }, { pt03: false, markings: 1, manifest: true, lost: 1 }],
  ['both original cargo lost after copying', { destroyCargoAfterCopy: true }, { pt03: true, markings: 2, manifest: true, lost: 2 }],
  ['original manifest lost after copying', { destroyManifestAfterCopy: true }, { pt03: true, markings: 2, manifest: true, lost: 0 }],
]) test(`MI13 records ${name} without inventing or deleting acquired sources`, () => {
  const s = run(options); assert.equal(s.status, 'won'); assert.equal(s.campaign.pt03Acquired, expected.pt03);
  assert.equal(s.campaign.markingsCopied, expected.markings); assert.equal(s.campaign.manifestCopied, expected.manifest);
  assert.equal(s.campaign.cargoLost, expected.lost); valid(s);
});

test('PT03 is independently obtainable without PT01 and crosses older sources only when actually acquired', () => {
  const without = run(); assert.equal(without.campaign.pt03Acquired, true); assert.equal(without.campaign.pt01CrossReferenced, false); assert.equal(without.campaign.relayCrossReferenced, false);
  const withCopies = run({}, 'WK09', { campaignContext: { relayRecorded: true, relayChoice: 'defy', relayOrdersCopied: true, pt01Acquired: true } });
  assert.equal(withCopies.campaign.pt03Acquired, true); assert.equal(withCopies.campaign.pt01CrossReferenced, true); assert.equal(withCopies.campaign.relayCrossReferenced, true); valid(withCopies);
});

test('a partial physical transfer keeps its position and accrued work across interruption, then resumes', () => {
  const s = run({ stopAt: state => state.foundry.cargo[0].transfer.working && state.foundry.cargo[0].transfer.progress > .4 });
  const cargo = s.foundry.cargo[0], before = structuredClone(s), x = cargo.x, y = cargo.y, progress = cargo.transfer.progress;
  assert.ok(cargo.transfer.working && progress > .4 && progress < .5); valid(s);
  updateGame(s, 0, {}); assert.deepEqual(s, before, 'zero-time pause does not advance a transfer');
  updateGame(s, 1 / 60, { move: -1 }); assert.equal(cargo.transfer.working, false); assert.equal(cargo.transfer.progress, progress); assert.equal(cargo.x, x); assert.equal(cargo.y, y);
  pilotMI13(s); assert.equal(s.status, 'won'); assert.equal(cargo.transferred, true); assert.ok(cargo.transferredAt > before.elapsed);
  validateFoundrySortie(before, s); valid(s);
});

test('physical carrier destruction is terminal while the walker can still be alive', () => {
  const s = create(); fireAtMI13(s, 'foundry-carrier'); assert.equal(s.status, 'lost'); assert.equal(s.foundry.carrier.hp, 0); assert.ok(s.player.hull > 0);
  const before = structuredClone(s); advance(s, 3, { move: 1, fire: true }); assert.deepEqual(s, before); valid(s);
});

test('a transfer interrupted before its first movement remains a valid zero-progress checkpoint', () => {
  const s = run({ stopAt: state => state.foundry.carrier.arrived && state.foundry.cargo[0].transfer.progress === 0 });
  const bay = s.foundry.bays.find(b => b.kind === s.campaign.plan);
  moveMI13(s, bay.postX - 80); anchor(s); commandGame(s, 'interact');
  assert.equal(s.foundry.cargo[0].transfer.working, true); assert.equal(s.foundry.cargo[0].transfer.progress, 0);
  updateGame(s, 1 / 60, { move: -1 }); assert.equal(s.foundry.cargo[0].transfer.working, false); valid(s);
  pilotMI13(s); assert.equal(s.status, 'won'); valid(s);
});

test('neglecting the ambush produces a real defeat rather than an automatic report', () => {
  const s = run({ noFire: true, maxFrames:30000 }); assert.equal(s.status, 'lost'); assert.equal(s.player.hull, 0); assert.equal(s.campaign.reportTransmitted, false); valid(s);
});

test('the hot route remains possible while preserving its actual wheel damage and exposures', () => {
  const s = run({ skipValves: true }); assert.equal(s.status, 'won'); assert.equal(s.campaign.circuitsOpened, 0);
  assert.ok(s.foundry.thermal.conductionAdded > 0 && s.foundry.thermal.wheelDamage > 0); assert.ok(s.foundry.carrier.hp < s.foundry.carrier.maxHp); valid(s);
});

test('validator rejects forged source facts, erased damage, teleportation and accelerated transfer progress', () => {
  const s = run({ stopAt: state => state.foundry.cargo[0].transfer.working && state.foundry.cargo[0].transfer.progress > .35 });
  for (const change of [state => { state.campaign.markingsCopied = 1; }, state => { state.foundry.carrier.x += 60; },
    state => { state.foundry.cargo[0].transfer.progress = .9; }, state => { state.foundry.manifest.copiedAt = 0; }]) {
    const altered = structuredClone(s); change(altered); assert.throws(() => valid(altered), /Sauvegarde invalide/);
  }
  const after = structuredClone(s); after.elapsed += .1; after.foundry.cargo[0].transfer.progress += .2;
  assert.throws(() => validateFoundrySortie(s, after), /accéléré/);
  const facts = { ...s.campaign, pt03Acquired: false }; assert.throws(() => validateFoundryFacts(facts), /PT03/);
});

test('the derived receipt, renderer summaries and deep captures preserve degraded cargo facts', () => {
  const s = run(); const snapshot = captureMI13Scene(s); const roster = foundryReceiptRoster(s); const frozen = JSON.stringify(snapshot);
  assert.deepEqual(foundryDerivedFacts(s), Object.fromEntries(Object.keys(foundryDerivedFacts(s)).map(key => [key, s.campaign[key]])));
  assert.match(foundrySummary(s).cargo, /ENDOMMAGÉES/); assert.ok(s.foundry.cargo.some(c => c.hp < c.maxHp));
  roster.carrier.hp = 1; assert.notEqual(s.foundry.carrier.hp, 1); assert.equal(JSON.stringify(snapshot), frozen);
  assert.equal(foundrySolids(s).length, 6);
});

test('the original Kharon kit has eight components and 29 SVG states with simulation-oriented anchors', () => {
  assert.equal(FOUNDRY_ASSET_NAMES.length, 8); let states = 0;
  for (const part of FOUNDRY_ASSET_NAMES) for (const state of FOUNDRY_ASSET_SPECS[part].states) {
    states++; const g = foundryAssetGeometry({ part, state, progress: .5 });
    assert.ok(g.shapes.some(shape => shape.fill) && g.shapes.some(shape => shape.stroke)); assert.deepEqual(g.pivot, [0, 0]); assert.ok(g.canonIds.includes('MI13'));
    assert.match(foundryAssetSVG(g), /src\/foundry-assets.mjs/); assert.ok(g.bounds.every(Number.isFinite));
  }
  assert.equal(states, 29);
});
