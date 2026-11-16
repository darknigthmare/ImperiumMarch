import test from 'node:test';
import assert from 'node:assert/strict';
import { ENEMY_TYPES } from '../src/content.mjs';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { ENEMY_WEAPON_RIGS, enemyWeaponPose } from '../src/enemy-weapon-pose.mjs';

const near = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} != ${expected}`);

test('seven mounted weapons mirror their mounts, keep an upright art basis and aim from the mount', () => {
  for (const [type, rig] of Object.entries(ENEMY_WEAPON_RIGS)) for (const facing of [-1, 1]) {
    const entity = { ...ENEMY_TYPES[type], type, x: 500, y: 400, facing, phase: 'attack', targetX: 500 + facing * 220, targetY: 260 };
    const saved = JSON.stringify(entity), pose = enemyWeaponPose(entity);
    assert.equal(JSON.stringify(entity), saved, `${type}: pose must not add renderer state to the entity`);
    near(pose.pivot[0], 500 + facing * rig.pivot[0], `${type}: mount x`);
    near(pose.pivot[1], 400 + rig.pivot[1], `${type}: mount y`);
    near(Math.hypot(pose.muzzle[0] - pose.pivot[0], pose.muzzle[1] - pose.pivot[1]), rig.length, `${type}: barrel length`);
    const targetVector = [entity.targetX - pose.pivot[0], entity.targetY - pose.pivot[1]];
    near((pose.muzzle[0] - pose.pivot[0]) * targetVector[1] - (pose.muzzle[1] - pose.pivot[1]) * targetVector[0], 0, `${type}: muzzle lies on actual aim line`);
    assert.ok(Math.cos(pose.angle) * pose.upright > 0, `${type}: top remains above the barrel while aiming either way`);
    pose.pivot[0] = -999; pose.muzzle[0] = -999;
    assert.notEqual(enemyWeaponPose(entity).pivot[0], -999, 'Returned coordinates are independent');
  }
});

test('idle weapons follow facing without aiming at uninitialised zero coordinates', () => {
  for (const type of Object.keys(ENEMY_WEAPON_RIGS)) for (const facing of [-1, 1]) {
    const e = { ...ENEMY_TYPES[type], type, x: 500, y: 400, facing, phase: 'idle', targetX: 0, targetY: 0 };
    const pose = enemyWeaponPose(e);
    near(pose.muzzle[1], pose.pivot[1], `${type}: horizontal rest`);
    assert.equal(Math.sign(pose.muzzle[0] - pose.pivot[0]), facing);
  }
  for (const type of ['boss', 'fauna', 'automaton', 'unknown']) assert.equal(enemyWeaponPose({ type, x: 0, y: 0 }), null);
});

test('normal simulation emits seven enemy projectile types exactly at the shared muzzle in both directions', () => {
  for (const type of Object.keys(ENEMY_WEAPON_RIGS)) for (const facing of [-1, 1]) {
    const state = createGame({ missionId: 'op01', difficulty: 'story', seed: 1552 });
    const x = state.player.x - facing * 310;
    const enemy = { ...ENEMY_TYPES[type], id: `muzzle-${type}`, type, x, spawnX: x,
      y: terrainAt(x, state.planetId) - ENEMY_TYPES[type].h / 2, facing,
      hp: ENEMY_TYPES[type].hp, maxHp: ENEMY_TYPES[type].hp, active: true, dead: false,
      phase: 'attack', telegraph: .9999, targetX: state.player.x, targetY: state.player.y,
      timer: 0, flash: 0, dronePhase: .31, armor: 0 };
    state.enemies = [enemy];
    updateGame(state, 1 / 60, { brace: true });
    const shot = state.projectiles.find(projectile => projectile.team === 'enemy');
    assert.ok(shot, `${type}/${facing}: an actual update must emit a shot`);
    const pose = enemyWeaponPose(enemy);
    near(shot.prevX, pose.muzzle[0], `${type}/${facing}: emitted x`);
    near(shot.prevY, pose.muzzle[1], `${type}/${facing}: emitted y`);
    near(shot.vx, Math.cos(pose.angle) * enemy.projectileSpeed, `${type}/${facing}: shot vx`);
    near(shot.vy, Math.sin(pose.angle) * enemy.projectileSpeed, `${type}/${facing}: shot vy`);
    assert.equal(shot.type, type === 'rocket' ? 'rocket' : 'bullet');
    assert.equal(enemy.w, ENEMY_TYPES[type].w); assert.equal(enemy.h, ENEMY_TYPES[type].h);
  }
});

test('existing automaton and boss keep their pre-existing projectile origin and damage contracts', () => {
  for (const type of ['automaton', 'boss']) {
    const state = createGame({ missionId: 'op01', difficulty: 'story', seed: 1553 });
    const x = state.player.x + 350, def = ENEMY_TYPES[type];
    const e = { ...def, type, id: `historic-${type}`, x, y: terrainAt(x, state.planetId) - def.h / 2,
      hp: def.hp, maxHp: def.hp, active: true, dead: false, facing: -1,
      phase: 'attack', telegraph: .999, targetX: state.player.x, targetY: state.player.y, timer: 0, flash: 0, armor: 0 };
    state.enemies = [e]; state.bossReleased = true;
    const angle = Math.atan2(e.targetY - e.y, e.targetX - e.x);
    const expected = [e.x + Math.cos(angle) * e.w / 2, e.y + Math.sin(angle) * e.w / 2];
    updateGame(state, 1 / 60, { brace: true });
    const shot = state.projectiles.find(projectile => projectile.team === 'enemy'); assert.ok(shot);
    near(shot.prevX, expected[0], `${type}: legacy x`); near(shot.prevY, expected[1], `${type}: legacy y`);
    assert.equal(shot.damage, def.damage);
  }
});
