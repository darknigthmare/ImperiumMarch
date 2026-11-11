import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, terrainAt, livingRouteSurfaceAt, livingRouteReceiptRoster } from '../src/simulation.mjs';
import { pilotMI09, captureMI09Scene } from './helpers/mi09-driver.mjs';

const create = (walkerId = 'WK01', extra = {}) => createGame({ missionId: 'MI09', walkerId, difficulty: 'normal', seed: 9109, ...extra });
const idle = (s, seconds, extra = {}) => { for (let i = 0; i < Math.ceil(seconds * 60) && s.status === 'playing'; i++) updateGame(s, 1 / 60, { brace: true, ...extra }); return s; };
function moveTo(s, x, { manual = false, cadence = 1.3, maxFrames = 6000 } = {}) {
  if (manual) commandGame(s, 'assist', false);
  let nextStep = s.elapsed;
  for (let i = 0; i < maxFrames && s.status === 'playing' && Math.abs(s.player.x - x) > 28; i++) {
    const direction = Math.sign(x - s.player.x);
    if (manual && s.elapsed >= nextStep && s.player.feet.every(f => f.contact)) {
      commandGame(s, s.player.lastGroup === 0 ? 'stepB' : 'stepA'); nextStep = s.elapsed + cadence;
    }
    updateGame(s, 1 / 60, { move: direction });
  }
  return s;
}

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI09 ${walker.id} / ${choice}: real routes, herd, snipers and logistics through public controls`, () => {
  const s = create(walker.id);
  let raisedContact = false, travelling = false, logisticsTravelling = false;
  pilotMI09(s, { choice, observe: state => {
    raisedContact ||= state.player.feet.some(foot => foot.contact && livingRouteSurfaceAt(state, foot.x).rise > 2
      && Math.abs(foot.y - livingRouteSurfaceAt(state, foot.x).groundY) < .001);
    travelling ||= state.livingRoute.migrators.some(animal => animal.phase === 'migrating' && animal.x > 2300 && animal.x < animal.targetX);
    logisticsTravelling ||= state.livingRoute.logistics.moving && state.livingRoute.logistics.x > 3300 && state.livingRoute.logistics.x < 5300;
  } });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.phase, 'complete');
  assert.equal(s.campaign.route, choice === 'obey' ? 'imperial' : 'migration');
  assert.equal(s.campaign.migratorsArrived, choice === 'defy' ? 4 : 0);
  assert.equal(s.campaign.migratorsDisplaced, choice === 'obey' ? 4 : 0);
  assert.equal(s.campaign.migratorsLost, 0); assert.equal(s.campaign.homesHabitable, 2);
  assert.equal(s.campaign.passagePreserved, choice === 'defy');
  assert.equal(s.campaign.cropsFertilized, choice === 'defy');
  assert.equal(s.campaign.harvestFragile, choice === 'obey');
  assert.equal(s.campaign.pollinatorsPresent, 2); assert.equal(s.campaign.snipersNeutralized, 2);
  assert.equal(s.campaign.logisticsArrived, true); assert.equal(s.campaign.reportTransmitted, true);
  assert.deepEqual(s.livingRoute.roots.map(root => root.hp), [360, 360]);
  assert.ok(raisedContact, 'real planted feet rise onto roots'); assert.ok(travelling); assert.ok(logisticsTravelling);
  for (const animal of s.livingRoute.migrators) assert.equal(animal.x, animal.targetX);
  assert.ok(s.stats.steps > 50); assert.ok(s.stats.shots > 0);
});

test('MI09 only introduces its domain on MI09 and observes Thyr independently of the Nacre census', () => {
  for (const missionId of ['op01', 'op02', 'op03', 'MI01', 'MI08']) assert.equal(Object.hasOwn(createGame({ missionId }), 'livingRoute'), false);
  const s = create('WK01', { campaignContext: { departureRecorded: true, departureChoice: 'delay', departureArrived: 21, departureLost: 3 } });
  assert.deepEqual(s.campaign.context, { departureRecorded: true, departureChoice: 'delay', departureArrived: 21, departureLost: 3 });
  assert.equal(Object.hasOwn(s.livingRoute, 'people'), false); assert.equal(s.civilians.length, 0);
  assert.equal(s.livingRoute.migrators.length, 4); assert.equal(s.campaign.localsHeard, false);
  assert.equal(s.campaign.hamletsRecorded, false); assert.equal(s.campaign.cropsFertilized, false);
  assert.deepEqual(s.livingRoute.columns.map(column => column.species), ['FL07', 'FL07']);
  assert.deepEqual(s.livingRoute.pollinators.map(fan => fan.species), ['FU08', 'FU08']);
  assert.equal(s.enemies.every(enemy => !enemy.active && !enemy.dead), true);
});

test('MI09 physical hull clearance blocks a tall unprepared chassis and the actual anchored approach opens it', () => {
  const s = create('WK06');
  moveTo(s, 1700, { maxFrames: 1800 });
  assert.ok(s.player.x < 960); assert.equal(s.livingRoute.approach.prepared, false);
  assert.equal(s.notified.thyrHeight, true); assert.equal(s.player.hull, s.player.maxHull);
  pilotMI09(s, { stopAt: state => state.livingRoute.approach.prepared });
  assert.equal(s.livingRoute.approach.clearance, 300); assert.equal(s.campaign.localsHeard, true);
  moveTo(s, 1700); assert.ok(s.player.x > 1600);
  const low = create('WK10'); moveTo(low, 1600); assert.ok(low.player.x > 1500); assert.equal(low.livingRoute.approach.prepared, false);
});

test('MI09 listening changes a completed approach; the unassisted survey is slower and stresses fast root contacts', () => {
  const guided = create(), surveyed = create();
  pilotMI09(guided, { stopAt: state => state.player.x > 1530 });
  pilotMI09(surveyed, { skipLocals: true, stopAt: state => state.player.x > 1530 });
  assert.equal(guided.livingRoute.approach.kind, 'guided'); assert.equal(surveyed.livingRoute.approach.kind, 'surveyed');
  assert.equal(surveyed.campaign.localsHeard, false); assert.equal(guided.livingRoute.roots[0].hp, 360);
  assert.ok(surveyed.livingRoute.roots[0].hp < 360);
  const manual = create(); pilotMI09(manual, { skipLocals: true, stopAt: state => state.livingRoute.approach.prepared });
  moveTo(manual, 1540, { manual: true, cadence: 1.35 });
  assert.equal(manual.livingRoute.roots[0].hp, 360, 'spaced J/L contacts carry the same chassis without rapid load damage');
  assert.ok(manual.player.x > 1500);
});

test('MI09 projectors and local muzzle flash disperse FU08; quiet returns them without a global alarm', () => {
  const s = create(); pilotMI09(s, { stopAt: state => !state.livingRoute.lights.on });
  idle(s, 6); assert.deepEqual(s.livingRoute.pollinators.map(fan => fan.phase), ['settled', 'settled']);
  updateGame(s, 1 / 60, { brace: true, fire: true, aimX: s.player.x, aimY: 0 });
  assert.equal(s.livingRoute.pollinators[0].phase, 'flying'); assert.equal(s.livingRoute.pollinators[1].phase, 'settled');
  idle(s, 9); assert.deepEqual(s.livingRoute.pollinators.map(fan => fan.phase), ['settled', 'settled']);
});

test('MI09 decision pauses exactly and selects intent without remotely operating the barrier or moving the herd', () => {
  const s = create(); pilotMI09(s, { stopAt: state => state.decision.active });
  const paused = structuredClone(s), origins = s.livingRoute.migrators.map(animal => animal.x);
  updateGame(s, 100, { move: 1, fire: true, interact: true }); assert.deepEqual(s, paused);
  assert.equal(commandGame(s, 'choice', 'delay'), false); assert.equal(commandGame(s, 'choice', 'defy'), true);
  assert.equal(s.campaign.route, 'migration'); assert.equal(s.livingRoute.barrier.operated, false);
  assert.deepEqual(s.livingRoute.migrators.map(animal => animal.x), origins); assert.equal(s.campaign.cropsFertilized, false);
  assert.equal(s.livingRoute.logistics.released, false); assert.equal(s.livingRoute.alert.triggered, false);
  pilotMI09(s, { stopAt: state => state.livingRoute.barrier.working && state.livingRoute.barrier.progress > .25 });
  assert.equal(s.livingRoute.barrier.operated, false); assert.deepEqual(s.livingRoute.migrators.map(animal => animal.x), origins);
});

test('MI09 clone/save continuation is exact in an anchored operation and during physical migration', () => {
  const s = create('WK09'); pilotMI09(s, { stopAt: state => state.livingRoute.barrier.working && state.livingRoute.barrier.progress > .38 });
  let restored = JSON.parse(JSON.stringify(s));
  for (let i = 0; i < 300; i++) { updateGame(s, 1 / 60, { brace: true }); updateGame(restored, 1 / 60, { brace: true }); }
  assert.deepEqual(restored, s); assert.equal(s.campaign.gateOperated, true); assert.equal(s.campaign.migrationResolved, false);
  assert.ok(s.livingRoute.migrators.some(animal => animal.moving));
  const captured = captureMI09Scene(s, { stage: 'migration' }); restored = JSON.parse(JSON.stringify(s));
  pilotMI09(s); pilotMI09(restored); assert.deepEqual(restored, s); assert.equal(s.status, 'won');
  assert.equal(captured.state.campaign.migrationResolved, false, 'captured state cannot follow later mutations');
});

test('MI09 snipers cannot become targets or attack before the herd has actually resolved', () => {
  const s = create(); pilotMI09(s, { stopAt: state => state.decision.active }); commandGame(s, 'choice', 'defy');
  moveTo(s, 3820);
  const sniper = s.enemies[0];
  idle(s, 3, { fire: true, aimX: sniper.x, aimY: sniper.y });
  assert.equal(s.livingRoute.alert.triggered, false); assert.equal(sniper.active, false); assert.equal(sniper.hp, sniper.maxHp);
  assert.equal(s.stats.damageTaken, 0); assert.equal(s.campaign.migratorsArrived, 0);
});

for (const [option, expected] of [
  [{ destroyColumn: 1 }, { columns: 1, homes: 1, passage: true, lost: 0 }],
  [{ destroyRoot: 1 }, { columns: 2, homes: 1, passage: false, lost: 0 }],
  [{ destroyHome: 1 }, { columns: 2, homes: 1, passage: true, lost: 0 }],
  [{ killMigrators: 1 }, { columns: 2, homes: 2, passage: true, lost: 1 }],
  [{ killMigrators: 4 }, { columns: 2, homes: 2, passage: true, lost: 4 }],
]) test(`MI09 damage remains physical and persistent: ${JSON.stringify(option)}`, () => {
  const s = create(); pilotMI09(s, option); assert.equal(s.status, 'won');
  assert.equal(s.campaign.columnsIntact, expected.columns); assert.equal(s.campaign.homesHabitable, expected.homes);
  assert.equal(s.campaign.passagePreserved, expected.passage); assert.equal(s.campaign.migratorsLost, expected.lost);
  assert.equal(s.campaign.migratorsArrived, 4 - expected.lost); assert.equal(s.stats.collateral, 0, 'no invented human deaths from an uncounted habitat');
  if (expected.lost) assert.equal(s.campaign.harvestFragile, true);
  if (option.destroyColumn) { assert.equal(s.livingRoute.pollinators[0].alive, false); assert.equal(s.campaign.harvestFragile, true); }
});

test('MI09 a destroyed barrier still needs an anchored guide operation and keeps its damage under either order', () => {
  for (const choice of ['obey', 'defy']) {
    const s = create(); pilotMI09(s, { choice, destroyBarrier: true, stopAt: state => state.decision.resolved });
    assert.equal(s.livingRoute.barrier.destroyed, true); assert.equal(s.livingRoute.barrier.operated, false);
    assert.equal(s.campaign.migratorsArrived, 0); assert.equal(s.campaign.migratorsDisplaced, 0);
    pilotMI09(s, { choice }); assert.equal(s.status, 'won'); assert.equal(s.campaign.passagePreserved, false);
    assert.equal(s.livingRoute.barrier.hp, 0); assert.equal(s.livingRoute.barrier.operated, true);
    assert.equal(s.campaign.migratorsDisplaced, choice === 'obey' ? 4 : 0);
  }
});

test('MI09 terminal destinations and an arrived transport cannot be damaged retrospectively', () => {
  const s = create(); pilotMI09(s, { stopAt: state => state.campaign.logisticsArrived });
  const vehicle = s.livingRoute.logistics, hp = vehicle.hp;
  idle(s, 2, { fire: true, aimX: vehicle.x, aimY: vehicle.y });
  assert.equal(vehicle.hp, hp); assert.equal(vehicle.moving, false);
  assert.deepEqual(s.livingRoute.migrators.map(animal => animal.phase), ['arrived', 'arrived', 'arrived', 'arrived']);
  const roster = livingRouteReceiptRoster(s); roster.logistics.hp = 0;
  assert.equal(vehicle.hp, hp, 'receipt is a deep snapshot');
});

test('MI09 logistics destruction ends the sortie and a clone/reload cannot resurrect it', () => {
  const s = create(); pilotMI09(s, { destroyLogistics: true });
  assert.equal(s.status, 'lost'); assert.equal(s.campaign.logisticsDestroyed, true); assert.equal(s.campaign.logisticsArrived, false);
  assert.equal(s.campaign.migratorsArrived, 4); assert.equal(s.campaign.reportTransmitted, false);
  const terminal = structuredClone(s), restored = JSON.parse(JSON.stringify(s));
  assert.equal(commandGame(restored, 'interact'), false); updateGame(restored, 10, { move: 1, fire: true });
  assert.deepEqual(restored, terminal);
});

test('MI09 a player who leaves the two real snipers firing can lose the walker', () => {
  const s = create('WK02', { difficulty: 'veteran' }); pilotMI09(s, { noFire: true, maxFrames: 45000 });
  assert.equal(s.status, 'lost'); assert.equal(s.player.hull, 0); assert.ok(s.stats.damageTaken > 0);
  assert.equal(s.campaign.snipersTriggered, true); assert.equal(s.campaign.snipersNeutralized, 0);
});
