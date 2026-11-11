import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, MISSIONS } from '../src/content.mjs';
import { createGame, updateGame, commandGame, terrainAt } from '../src/simulation.mjs';

function advance(s, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, typeof input === 'function' ? input(s, i) : input);
  return s;
}

function clearThreats(s) { s.enemies.forEach(e => { e.dead = true; e.hp = 0; }); }

function moveTo(s, x) {
  for (let i = 0; i < 30000 && Math.abs(s.player.x - x) > 65 && s.status === 'playing'; i++) {
    updateGame(s, 1 / 60, { move: Math.sign(x - s.player.x) });
  }
}

test('six original chassis create the correct number of contact feet and alternate support groups', () => {
  for (const walker of WALKERS) {
    const s = createGame({ walkerId: walker.id });
    assert.equal(s.player.feet.length, walker.legs);
    assert.equal(s.player.feet.filter(f => f.group === 0).length, walker.legs / 2);
    assert.ok(s.player.feet.every(f => f.contact && f.y === terrainAt(f.x, s.planetId)));
  }
  assert.deepEqual(createGame({ walkerId: 'WK05' }).player.feet.map(f => f.group), [0, 1, 1, 0]);
});

test('uncommanded planted feet never slide and manual controls require alternating groups', () => {
  const s = createGame({ assist: false });
  const initial = s.player.feet.map(f => f.x);
  advance(s, 1, { move: 1 });
  assert.deepEqual(s.player.feet.map(f => f.x), initial);
  assert.equal(commandGame(s, 'stepA'), true);
  assert.equal(commandGame(s, 'stepB'), false, 'cannot lift both support groups');
  const planted = s.player.feet.filter(f => f.group === 1).map(f => f.x);
  advance(s, 0.4, { move: 1 });
  assert.deepEqual(s.player.feet.filter(f => f.group === 1).map(f => f.x), planted);
  advance(s, 0.4, { move: 1 });
  assert.equal(commandGame(s, 'stepA'), false, 'cannot skate the same foot repeatedly');
  assert.equal(commandGame(s, 'stepB'), true);
  advance(s, 0.8, { move: 1 });
  assert.ok(s.player.x > 350);
  assert.ok(s.player.feet.every(f => f.contact && Math.abs(f.y - terrainAt(f.x, s.planetId)) < 0.001));
});

test('assisted locomotion traverses terrain for every leg layout, with a distinct speed', () => {
  const positions = WALKERS.map(w => {
    const s = createGame({ walkerId: w.id, missionId: 'op03' }); clearThreats(s);
    advance(s, 8, { move: 1 });
    assert.ok(s.player.x > 500);
    assert.ok(s.player.feet.every(f => f.phase === 'swing' || f.y === terrainAt(f.x, s.planetId)));
    return s.player.x;
  });
  assert.ok(positions[WALKERS.findIndex(w => w.id === 'WK01')] > positions[WALKERS.findIndex(w => w.id === 'WK05')], 'Vigie advances faster than Bastion');
});

test('brace plants the walker and prevents new step commands', () => {
  const s = createGame();
  advance(s, 2, { move: 1, brace: true });
  assert.equal(s.player.x, 300);
  assert.equal(commandGame(s, 'stepA'), false);
});

test('rounds consume a magazine and reload; rocket stock cannot become negative', () => {
  const s = createGame(); clearThreats(s);
  advance(s, 0.02, { fire: true, aimX: 2000, aimY: 100 });
  assert.equal(s.player.ammo, s.player.maxAmmo - 1);
  commandGame(s, 'reload');
  advance(s, 2.5);
  assert.equal(s.player.ammo, s.player.maxAmmo);
  assert.equal(s.player.reloadTime, 0);
  s.player.rockets = 1;
  advance(s, 5, { secondary: true, aimX: 2000, aimY: 100 });
  assert.equal(s.player.rockets, 0);
});

test('overheat locks weapons and active ventilation restores them', () => {
  const s = createGame({ walkerId: 'WK09' }); clearThreats(s);
  let sawOverheat = false;
  for (let i = 0; i < 1200; i++) {
    updateGame(s, 1 / 60, { fire: true, aimX: 2000, aimY: 100 });
    if (s.player.overheated) { sawOverheat = true; break; }
  }
  assert.ok(sawOverheat);
  const shots = s.stats.shots;
  advance(s, 0.25, { fire: true });
  assert.equal(s.stats.shots, shots);
  advance(s, 3, { vent: true, fire: true });
  assert.equal(s.player.overheated, false);
  assert.equal(s.stats.shots, shots, 'venting itself inhibits firing');
});

test('a swept projectile damages a real target without tunnelling through it', () => {
  const s = createGame();
  const e = s.enemies[0];
  s.enemies = [e]; e.x = 540; e.y = s.player.y; e.speed = 0; e.timer = 10;
  // Keep this target in the air so terrain placement does not move it between updates.
  e.type = 'drone'; e.kind = 'air'; e.dronePhase = 0;
  advance(s, 0.6, { fire: true, aimX: 540, aimY: 500 });
  assert.ok(e.hp < e.maxHp || e.dead);
  assert.ok(s.stats.hits > 0);
});

test('evidence cannot be acquired remotely or by idling at spawn', () => {
  const s = createGame(); clearThreats(s);
  assert.equal(commandGame(s, 'interact'), false);
  advance(s, 10, { interact: true });
  assert.equal(s.evidence.collected, false);
  assert.equal(s.stats.evidence, 0);
});

test('scan requires proximity and decision choices only work while the authored choice is open', () => {
  const s = createGame(); clearThreats(s);
  assert.equal(commandGame(s, 'choice', 'defy'), false);
  moveTo(s, s.evidence.x);
  assert.equal(commandGame(s, 'interact'), true);
  advance(s, 2.6);
  assert.equal(s.evidence.collected, true);
  assert.equal(commandGame(s, 'interact'), true);
  assert.equal(s.decision.active, true);
  const elapsed = s.elapsed;
  advance(s, 1, { fire: true });
  assert.equal(s.elapsed, elapsed, 'reading the decision pauses combat');
  assert.equal(commandGame(s, 'choice', 'defy'), true);
  assert.equal(s.stats.ordersDefied, 1);
  assert.equal(commandGame(s, 'choice', 'obey'), false, 'a decision cannot be rewritten');
});

test('enemy attacks are telegraphed before damage and hull zero produces a loss', () => {
  const s = createGame(); const e = s.enemies[0];
  s.enemies = [e]; e.x = 600; e.timer = 0; e.speed = 0;
  updateGame(s, 1 / 60, {});
  assert.equal(e.phase, 'attack');
  assert.equal(s.player.hull, s.player.maxHull);
  advance(s, 3);
  assert.ok(s.player.hull < s.player.maxHull);
  s.player.hull = 0; updateGame(s, 1 / 60);
  assert.equal(s.status, 'lost');
  assert.ok(s.outcome.includes('immobilisé'));
});

test('civilian damage is counted independently from combat kills', () => {
  const s = createGame(); clearThreats(s);
  const c = s.civilians[0];
  c.x = 350; c.y = s.player.y;
  s.projectiles.push({ id: 'test', x: 300, y: c.y, prevX: 300, prevY: c.y, vx: 1000, vy: 0, team: 'player', type: 'bullet', damage: 100, radius: 2, life: 2, trail: [] });
  updateGame(s, 0.05);
  assert.equal(s.stats.collateral, 1);
  assert.equal(s.stats.kills, 0);
});

test('relay mission cannot be won by simply walking to the exit', () => {
  const s = createGame(); clearThreats(s);
  moveTo(s, s.extraction.x);
  assert.equal(s.status, 'playing');
  assert.equal(s.extraction.active, false);
});

test('mission gate requires relay destruction, evidence, decision and extraction', () => {
  const s = createGame(); clearThreats(s);
  for (const relay of s.relays) { relay.destroyed = true; relay.hp = 0; }
  moveTo(s, s.evidence.x);
  commandGame(s, 'interact'); advance(s, 2.6);
  commandGame(s, 'interact'); commandGame(s, 'choice', 'defy');
  assert.equal(s.extraction.active, true);
  moveTo(s, s.extraction.x);
  assert.equal(s.status, 'won');
  assert.equal(s.objectives.find(o => o.id === 'extract').complete, true);
});

test('escort waits for its walker and mission fails if the transport is lost', () => {
  const s = createGame({ missionId: 'op02' }); clearThreats(s);
  const initial = s.convoy.x;
  advance(s, 2);
  assert.ok(s.convoy.x > initial);
  s.convoy.x = s.player.x + 700;
  const distant = s.convoy.x;
  advance(s, 1);
  assert.equal(s.convoy.x, distant);
  s.convoy.hp = 0; updateGame(s, 1 / 60);
  assert.equal(s.status, 'lost');
});

test('obeying and defying the boss order produce distinct objective and hostility states', () => {
  for (const choice of ['obey', 'defy']) {
    const s = createGame({ missionId: 'op03' });
    s.enemies = s.enemies.filter(e => e.type === 'boss');
    moveTo(s, s.evidence.x);
    commandGame(s, 'interact'); advance(s, 2.6);
    commandGame(s, 'interact'); commandGame(s, 'choice', choice);
    assert.equal(s.objectives.find(o => o.id === 'boss').complete, choice === 'obey');
    advance(s, 1);
    assert.equal(s.enemies[0].phase === 'standdown', choice === 'obey');
  }
});

test('same seed and inputs generate the same combat state; invalid delta does not advance', () => {
  const a = createGame({ seed: 42 }), b = createGame({ seed: 42 });
  advance(a, 5, { move: 1, fire: true, aimX: 1000, aimY: 650 });
  advance(b, 5, { move: 1, fire: true, aimX: 1000, aimY: 650 });
  assert.deepEqual(a.player, b.player);
  assert.deepEqual(a.stats, b.stats);
  const time = a.elapsed;
  updateGame(a, Number.NaN, { move: 1 });
  assert.equal(a.elapsed, time);
  updateGame(a, 4);
  assert.ok(a.elapsed - time <= 0.0500001);
});

test('content declares all required operations with unique IDs and finite extraction points', () => {
  assert.equal(new Set(MISSIONS.map(m => m.id)).size, 3);
  assert.deepEqual(MISSIONS.map(m => m.planetId), ['PL01', 'PL02', 'PL03']);
  for (const m of MISSIONS) assert.ok(m.extractionX < m.length && m.evidenceX < m.extractionX);
});

test('all three operations can be completed with each chassis using public controls, without state edits', () => {
  for (const mission of MISSIONS) {
    for (const walker of WALKERS) {
    const s = createGame({ missionId: mission.id, walkerId: walker.id, difficulty: 'normal' });
    for (let frame = 0; frame < 18000 && s.status === 'playing'; frame++) {
      if (s.decision.active) { commandGame(s, 'choice', 'defy'); continue; }
      const p = s.player;
      let target = s.enemies.filter(e => !e.dead && (e.type !== 'boss' || s.bossReleased) && Math.abs(e.x - p.x) < 1050)
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      if (!target) target = s.relays.filter(r => !r.destroyed && Math.abs(r.x - p.x) < 1050)
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
      let destination = !s.evidence.collected ? s.evidence.x : !s.decision.resolved ? s.mission.decisionX : s.extraction.x;
      let move = Math.abs(destination - p.x) > 55 ? Math.sign(destination - p.x) : 0;
      if (target && Math.abs(target.x - p.x) < 680) move = 0;
      if (!s.evidence.collected && Math.abs(p.x - s.evidence.x) < 190) { if (!s.evidence.scanning) commandGame(s, 'interact'); move = 0; }
      if (s.evidence.collected && !s.decision.resolved && Math.abs(p.x - s.mission.decisionX) < 280) { commandGame(s, 'interact'); move = 0; }
      if (s.convoy && p.x > s.convoy.x + 360 && move > 0) move = 0;
      const vent = p.heat > 75 || p.overheated;
      updateGame(s, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent,
        secondary: Boolean(target) && !vent && target.hp > 160, aimX: target?.x, aimY: target?.y });
    }
    assert.equal(s.status, 'won', `${mission.id}/${walker.id} must finish through controls; objectives: ${JSON.stringify(s.objectives)}`);
    assert.equal(s.evidence.collected, true);
    assert.equal(s.decision.choice, 'defy');
    assert.equal(s.stats.ordersDefied, 1);
    assert.ok(s.stats.kills > 0);
    }
  }
});
