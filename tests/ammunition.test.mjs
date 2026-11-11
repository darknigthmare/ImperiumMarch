import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS } from '../src/content.mjs';
import { createGame, commandGame, updateGame } from '../src/simulation.mjs';

function advance(s, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, typeof input === 'function' ? input(s) : input);
}

function discharge(s, rounds) {
  const goal = s.stats.shots + rounds;
  for (let frame = 0; frame < 30000 && s.stats.shots < goal; frame++) {
    const vent = s.player.heat > 70 || s.player.overheated;
    updateGame(s, 1 / 60, { brace: true, vent, fire: !vent, aimX: s.player.x, aimY: -200 });
  }
  assert.equal(s.stats.shots, goal);
}

test('every chassis starts with one loaded magazine and eight finite reserve magazines', () => {
  for (const walker of WALKERS) {
    const s = createGame({ walkerId: walker.id, missionId: 'MI01' });
    assert.equal(s.player.ammo, walker.ammo);
    assert.equal(s.player.reserveAmmo, walker.ammo * 8);
    assert.equal(s.player.maxReserveAmmo, walker.ammo * 8);
    assert.equal(commandGame(s, 'reload'), false);
  }
});

test('partial tactical reload transfers only missing rounds and conserves total ammunition', () => {
  const s = createGame({ missionId: 'MI01' });
  const total = s.player.ammo + s.player.reserveAmmo;
  discharge(s, 3);
  assert.equal(commandGame(s, 'reload'), true);
  assert.equal(s.player.ammo, s.player.maxAmmo - 3);
  assert.equal(s.player.reserveAmmo, s.player.maxReserveAmmo);
  advance(s, 2.5, { brace: true });
  assert.equal(s.player.ammo, s.player.maxAmmo);
  assert.equal(s.player.reserveAmmo, s.player.maxReserveAmmo - 3);
  assert.equal(s.player.ammo + s.player.reserveAmmo, total - 3);
});

test('public firing can exhaust all primary ammunition and neither reload nor holding fire creates free rounds', () => {
  const s = createGame({ missionId: 'MI01', walkerId: 'WK05' });
  const total = s.player.ammo + s.player.reserveAmmo;
  discharge(s, total);
  advance(s, 3, { brace: true, fire: true, aimX: s.player.x, aimY: -200 });
  assert.equal(s.player.ammo, 0);
  assert.equal(s.player.reserveAmmo, 0);
  assert.equal(s.player.reloadTime, 0);
  assert.equal(s.stats.shots, total);
  assert.equal(commandGame(s, 'reload'), false);
});

test('last tactical reload can fill a partial magazine without making reserve negative', () => {
  const s = createGame({ missionId: 'MI01', walkerId: 'WK01' });
  discharge(s, s.player.maxAmmo * 7 + 5);
  assert.equal(commandGame(s, 'reload'), true);
  advance(s, 2.5, { brace: true });
  assert.equal(s.player.reserveAmmo, 7);
  discharge(s, s.player.maxAmmo - 1);
  assert.equal(commandGame(s, 'reload'), true);
  advance(s, 2.5, { brace: true });
  assert.equal(s.player.ammo, 8);
  assert.equal(s.player.reserveAmmo, 0);
});

test('a real supply contact adds at most three magazines and returning to the same cache cannot refill again', () => {
  const s = createGame({ missionId: 'MI01', walkerId: 'WK09', difficulty: 'story' });
  discharge(s, 60);
  // Advance using real gait. Combat is deliberately omitted here; this isolates
  // consumption/contact accounting while the early road remains survivable.
  const cache = s.pickups[0];
  let before = null;
  for (let frame = 0; frame < 5000 && !cache.collected && s.status === 'playing'; frame++) {
    before = s.player.reserveAmmo;
    updateGame(s, 1 / 60, { move: 1, vent: true });
  }
  assert.equal(cache.collected, true);
  assert.equal(s.player.reserveAmmo, Math.min(s.player.maxReserveAmmo, before + s.player.maxAmmo * 3));
  const after = s.player.reserveAmmo;
  discharge(s, 3);
  assert.equal(commandGame(s, 'reload'), true);
  advance(s, 2.5, { brace: true });
  const remaining = s.player.reserveAmmo;
  advance(s, 0.5, { move: -1 });
  advance(s, 0.5, { move: 1 });
  assert.equal(cache.collected, true);
  assert.equal(s.player.reserveAmmo, remaining);
  assert.ok(remaining < after);
});
