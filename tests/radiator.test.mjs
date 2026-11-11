import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, radiatorBounds, radiatorCoolingFactor } from '../src/simulation.mjs';

function advance(s, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, input);
}
function create(walkerId = 'WK01') { return createGame({ missionId: 'MI01', walkerId }); }
// A controlled enemy projectile is the unit-test stimulus. Collision detection,
// travel and damage are production code; component/hull health is never assigned.
function incoming(s, { rear = true, damage = 30, verticalMiss = false } = {}) {
  const box = radiatorBounds(s), p = s.player;
  const x = rear ? box.x - p.facing * 70 : p.x + p.facing * (p.width / 2 + 100);
  const y = verticalMiss ? p.y - p.height / 2 - 35 : box.y;
  s.projectiles.push({ id: `calibration-${s.entityId++}`, team: 'enemy', type: 'bullet', x, y,
    prevX: x, prevY: y, vx: (rear ? p.facing : -p.facing) * 600, vy: 0, damage,
    radius: 2, life: 1, trail: [] });
  advance(s, 0.4, { brace: true });
}

test('six real hulls expose a rear radiator and front impacts cannot damage the component through the hull', () => {
  for (const walker of WALKERS) {
    const front = create(walker.id), rear = create(walker.id), miss = create(walker.id);
    incoming(front, { rear: false });
    incoming(rear);
    incoming(miss, { verticalMiss: true });
    assert.ok(front.player.hull < front.player.maxHull);
    assert.equal(front.player.radiator.health, 100);
    assert.ok(rear.player.radiator.health < 100);
    assert.ok(rear.player.hull < rear.player.maxHull);
    assert.equal(miss.player.radiator.health, 100);
    assert.equal(miss.player.hull, miss.player.maxHull);
    updateGame(rear, 0.01, { move: -1, brace: true });
    assert.ok(radiatorBounds(rear).x > rear.player.x, 'mirrored shell has a mirrored exposed component');
  }
});

test('local damage reduces measured cooling while preserving a minimum usable cooling rate', () => {
  const healthy = create(), damaged = create();
  incoming(damaged, { damage: 100 });
  assert.equal(damaged.player.radiator.health, 0);
  assert.equal(radiatorCoolingFactor(damaged), 0.35);
  // Thermal calibration starts at the same temperature, without a mission victory.
  healthy.player.heat = 80; damaged.player.heat = 80;
  advance(healthy, 1, { brace: true }); advance(damaged, 1, { brace: true });
  assert.ok(damaged.player.heat > healthy.player.heat + 6);
  assert.ok(damaged.player.heat < 80);
});

test('a four-second stationary repair restores at most sixty points and consumes a kit only on completion', () => {
  const s = create(); incoming(s, { damage: 100 });
  const hull = s.player.hull;
  assert.equal(commandGame(s, 'repair'), true);
  advance(s, 3.8, { brace: true });
  assert.ok(s.player.radiator.repairProgress > 0.9 && s.player.radiator.repairProgress < 1);
  assert.equal(s.player.radiator.repairKits, 2);
  assert.equal(s.player.radiator.health, 0);
  advance(s, 0.3, { brace: true });
  assert.equal(s.player.radiator.health, 60);
  assert.equal(s.player.radiator.repairKits, 1);
  assert.equal(s.player.radiator.repairProgress, 0);
  assert.equal(s.player.radiator.repairing, false);
  assert.equal(s.player.hull, hull, 'component repair does not heal the hull');
  assert.equal(commandGame(s, 'repair'), true);
  advance(s, 4.1, { brace: true });
  assert.equal(s.player.radiator.health, 100);
  assert.equal(s.player.radiator.repairKits, 0);
  incoming(s);
  assert.equal(commandGame(s, 'repair'), false, 'empty kits cannot create a third repair');
});

test('movement, firing and a new actual projectile impact cancel a repair without consuming the kit', () => {
  for (const interrupt of ['move', 'fire', 'hit']) {
    const s = create(); incoming(s);
    const health = s.player.radiator.health;
    assert.equal(commandGame(s, 'repair'), true);
    advance(s, 1, { brace: true });
    if (interrupt === 'hit') incoming(s, { rear: false, damage: 10 });
    else updateGame(s, 0.05, interrupt === 'move' ? { move: 1 } : { fire: true, aimX: s.player.x, aimY: -200 });
    assert.equal(s.player.radiator.repairing, false, interrupt);
    assert.equal(s.player.radiator.repairProgress, 0, interrupt);
    assert.equal(s.player.radiator.repairKits, 2, interrupt);
    assert.equal(s.player.radiator.health, health, interrupt);
  }
});

test('a healthy radiator cannot spend a kit and an in-progress gait cannot begin a repair', () => {
  const s = create();
  assert.equal(commandGame(s, 'repair'), false);
  incoming(s);
  updateGame(s, 0.05, { move: 1 });
  assert.equal(commandGame(s, 'repair'), false);
  assert.equal(s.player.radiator.repairKits, 2);
  advance(s, 3, { brace: true });
  assert.equal(commandGame(s, 'repair'), true);
});
