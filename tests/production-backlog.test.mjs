/**
 * Targeted v0.9 backlog evidence. Public pilots never assign simulation fields.
 * Geometric fixtures are explicitly labelled unit tests and are not journeys.
 * QA_EVIDENCE diagnostics are collected by tools/audit-production-backlog.mjs.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { WALKERS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { createCampaign, beginCampaignMission, checkpointCampaign, serializeCampaign, parseCampaign, restoreCampaignGame } from '../src/campaign.mjs';

const DT = 1 / 60;
const clone = value => JSON.parse(JSON.stringify(value));
function advance(s, seconds, input = {}, hz = 60) {
  const count = Math.round(seconds * hz);
  for (let frame = 0; frame < count; frame++) updateGame(s, 1 / hz, typeof input === 'function' ? input(s, frame) : input);
}
function evidence(t, qa, kind, facts) {
  t.diagnostic(`QA_EVIDENCE ${JSON.stringify({ qa, kind, ...facts })}`);
}

// Read-only aiming policy: do not destroy an unselected relay while shooting
// through it. This lets the operation exercise several real destruction orders.
function obstructedByRelay(s, target, selected) {
  const p = s.player;
  return s.relays.some(r => {
    if (r.destroyed || r === selected || r === target) return false;
    const fraction = (r.x - (p.x + 9)) / (target.x - (p.x + 9));
    if (fraction <= 0 || fraction >= 1) return false;
    const y = p.y + 8 + fraction * (target.y - (p.y + 8));
    return y > r.y - r.h / 2 - 8 && y < r.y + r.h / 2 + 8;
  });
}

function pilotOperation(s, { choice = 'defy', relayOrder = [0, 1, 2], scan = true,
  destination = null, stopAt = null, observe = null, hz = 60, maxSeconds = 600 } = {}) {
  for (let frame = 0; frame < hz * maxSeconds && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) return s;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const p = s.player;
    const selected = relayOrder.map(index => s.relays[index]).find(r => r && !r.destroyed);
    const targets = s.enemies.filter(e => !e.dead && (e.type !== 'boss' || s.bossReleased && s.decision.choice !== 'obey') && Math.abs(e.x - p.x) < 1050)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    let target = targets.find(item => !obstructedByRelay(s, item, selected));
    if (!target && selected && Math.abs(selected.x - p.x) < 1050 && !obstructedByRelay(s, selected, selected)) target = selected;
    const goal = destination ?? (selected ? selected.x : !s.evidence.collected ? s.evidence.x : !s.decision.resolved ? s.mission.decisionX : s.extraction.x);
    let move = Math.abs(goal - p.x) > 35 ? Math.sign(goal - p.x) : 0;
    if (target && Math.abs(target.x - p.x) < 680) move = 0;
    if (scan && !selected && !s.evidence.collected && Math.abs(p.x - s.evidence.x) < 190) {
      if (!s.evidence.scanning) commandGame(s, 'interact');
      move = 0;
    }
    if (scan && s.evidence.collected && !s.decision.resolved && Math.abs(p.x - s.mission.decisionX) < 280) {
      commandGame(s, 'interact'); move = 0;
    }
    if (s.convoy && !s.convoy.arrived && p.x > s.convoy.x + 360 && move > 0) move = 0;
    const vent = p.heat > 75 || p.overheated;
    updateGame(s, 1 / hz, { move, brace: !move, vent, fire: Boolean(target) && !vent,
      secondary: Boolean(target) && !vent && target.hp > 160, aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}

let scanApproach;
function publicScanApproach() {
  if (!scanApproach) {
    const s = createGame({ missionId: 'op01', walkerId: 'WK09', difficulty: 'story', seed: 154 });
    pilotOperation(s, { scan: false, destination: s.evidence.x - 180,
      stopAt: state => Math.abs(state.player.x - state.evidence.x) < 220 && Math.abs(state.player.speed) < 3 });
    assert.equal(s.status, 'playing');
    assert.ok(Math.abs(s.player.x - s.evidence.x) < 230);
    assert.equal(s.evidence.collected, false);
    scanApproach = clone(s);
  }
  return clone(scanApproach);
}

// Execute the actual report/storage function in isolation. This is not a DOM
// journey or a browser localStorage test; the saved record is real main code.
function operationReport(game) {
  const main = readFileSync(new URL('../src/main.mjs', import.meta.url), 'utf8');
  const source = main.match(/function showResult\(\) \{[\s\S]*?\n\}\n\nlet lastObjectives/);
  assert.ok(source, 'report function remains extractable for the isolated contract test');
  const elements = new Map(), saved = new Map();
  const context = {
    game, resultRecorded: false, activeMode: 'operation', records: {},
    clearInput() {}, audio: { setScene() {}, setPaused() {}, event() {} },
    timeLabel: value => String(value), escapeHTML: value => String(value),
    persist: (key, value) => saved.set(key, JSON.stringify(value)),
    $: id => {
      if (!elements.has(id)) elements.set(id, { textContent: '', innerHTML: '', open: false, showModal() { this.open = true; } });
      return elements.get(id);
    },
  };
  runInNewContext(`${source[0].replace(/\n\nlet lastObjectives$/, '')}\nshowResult(); showResult();`, context);
  return { elements, saved, records: clone(context.records) };
}

test('QA05: changing a campaign selection cannot refill an active sortie, including a reload checkpoint (public APIs)', t => {
  const rows = [];
  for (const walker of WALKERS) {
    const started = beginCampaignMission(createCampaign(), { walkerId: walker.id, seed: 519 });
    const s = started.game, initial = s.player.ammo + s.player.reserveAmmo;
    for (let frame = 0; frame < 600 && s.stats.shots < 3; frame++) updateGame(s, DT, { brace: true, fire: true, aimX: s.player.x, aimY: -200 });
    assert.equal(s.stats.shots, 3);
    assert.equal(commandGame(s, 'reload'), true);
    advance(s, .5, { brace: true });
    assert.ok(s.player.reloadTime > 0);
    const dossier = parseCampaign(serializeCampaign(checkpointCampaign(started.campaign, s)));
    for (const alternate of WALKERS) {
      const refused = beginCampaignMission(dossier, { walkerId: alternate.id });
      assert.equal(refused.ok, false);
      assert.equal(refused.game, null);
      assert.deepEqual(refused.campaign, dossier);
    }
    const restored = restoreCampaignGame(dossier);
    assert.equal(restored.player.reloadTime, s.player.reloadTime);
    advance(s, 2, { brace: true }); advance(restored, 2, { brace: true });
    assert.deepEqual(restored.player, s.player);
    assert.equal(s.player.ammo + s.player.reserveAmmo, initial - 3);
    assert.ok(s.player.ammo >= 0 && s.player.reserveAmmo >= 0);
    rows.push({ walkerId: walker.id, ammo: s.player.ammo, reserve: s.player.reserveAmmo });
  }
  evidence(t, ['QA05'], 'public-api-checkpoint', { cases: rows, selectionAttempts: 36, menuClicksExercised: false });
});

test('QA08: an actual landing hurts its footprint once, leaves a nearby target intact and does not hurt while hovering (geometric unit fixture)', t => {
  const s = createGame({ missionId: 'op01', walkerId: 'WK01', assist: false, seed: 808 });
  assert.equal(commandGame(s, 'stepA'), true);
  const foot = s.player.feet.find(f => f.phase === 'swing');
  const source = s.enemies[0], radius = 35 + source.w / 2;
  const contact = { ...source, id: 'unit-contact', x: foot.targetX, speed: 0, timer: 100 };
  const outside = { ...source, id: 'unit-outside', x: foot.targetX + radius + 1, speed: 0, timer: 100 };
  // Explicit fixture injection: only two stationary enemy geometries remain.
  s.enemies = [contact, outside];
  advance(s, .25, { brace: true });
  assert.equal(foot.contact, false);
  assert.equal(contact.hp, source.hp); assert.equal(outside.hp, source.hp);
  advance(s, .5, { brace: true });
  assert.equal(foot.contact, true);
  assert.equal(contact.dead, true); assert.equal(outside.hp, source.hp);
  const kills = s.stats.kills;
  advance(s, 2, { brace: true });
  assert.equal(s.stats.kills, kills); assert.equal(outside.hp, source.hp);
  evidence(t, ['QA08'], 'geometric-unit', { landingX: foot.x, outsideDistance: radius + 1, footprintHalfExtent: radius, kills, repeatedProximityDamage: 0 });
});

test('QA11: OP01 scan rejects remote use, resets on leaving range, then awards one copy (public controls)', t => {
  const remote = createGame({ missionId: 'op01' });
  assert.equal(commandGame(remote, 'interact'), false);
  advance(remote, 1, { brace: true, interact: true });
  assert.equal(remote.evidence.scanProgress, 0); assert.equal(remote.stats.evidence, 0);
  const s = publicScanApproach();
  assert.equal(commandGame(s, 'interact'), true);
  advance(s, .2, { brace: true });
  const partial = s.evidence.scanProgress;
  assert.ok(partial > 0 && partial < 1);
  for (let frame = 0; frame < 360 && s.evidence.scanning; frame++) updateGame(s, DT, { move: -1, vent: true });
  assert.ok(Math.abs(s.player.x - s.evidence.x) > 250);
  assert.equal(s.evidence.scanning, false); assert.equal(s.evidence.scanProgress, 0);
  assert.equal(s.stats.evidence, 0);
  pilotOperation(s, { stopAt: state => state.evidence.collected });
  assert.equal(s.evidence.collected, true); assert.equal(s.evidence.scanProgress, 1);
  assert.equal(s.stats.evidence, 1);
  for (let attempt = 0; attempt < 5; attempt++) {
    commandGame(s, 'interact');
    if (s.decision.active) commandGame(s, 'choice', 'defy');
    advance(s, .2, { brace: true });
  }
  assert.equal(s.stats.evidence, 1);
  evidence(t, ['QA11'], 'public-controls', { partialProgress: partial, cancellationRange: 250, completionProgress: 1, copiesAfterFiveRetries: s.stats.evidence });
});

for (const relayOrder of [[0, 1, 2], [2, 1, 0], [1, 0, 2]]) test(`QA12: OP01 relay order ${relayOrder.join('→')} reaches a gated extraction (public controls)`, t => {
  const s = createGame({ missionId: 'op01', walkerId: 'WK09', difficulty: 'story', seed: 1205 });
  const destroyed = new Set(), sequence = [];
  let unlockedBeforeArrival = false;
  pilotOperation(s, { relayOrder, observe(state) {
    for (const [index, relay] of state.relays.entries()) if (relay.destroyed && !destroyed.has(index)) { destroyed.add(index); sequence.push(index); }
    const goal = state.objectives.find(o => o.id === 'relays');
    assert.equal(goal.current, destroyed.size);
    assert.equal(goal.complete, destroyed.size === 3);
    if (!state.evidence.collected || !state.decision.resolved || destroyed.size < 3) assert.equal(state.extraction.active, false);
    if (state.extraction.active && Math.abs(state.player.x - state.extraction.x) >= state.extraction.radius) {
      unlockedBeforeArrival = true; assert.equal(state.status, 'playing');
    }
  } });
  assert.deepEqual(sequence, relayOrder);
  assert.equal(s.status, 'won'); assert.equal(unlockedBeforeArrival, true);
  assert.ok(Math.abs(s.player.x - s.extraction.x) < s.extraction.radius);
  assert.equal(s.objectives.find(o => o.id === 'extract').complete, true);
  evidence(t, ['QA12'], 'public-controls', { requestedOrder: relayOrder, actualOrder: sequence, status: s.status, extractionDistance: Math.abs(s.player.x - s.extraction.x), elapsed: s.elapsed });
});

test('QA13: OP02 protected escort and unattended destruction have distinct terminal outcomes (public controls)', t => {
  const protectedGame = createGame({ missionId: 'op02', walkerId: 'WK09', difficulty: 'normal', seed: 1305 });
  pilotOperation(protectedGame);
  assert.equal(protectedGame.status, 'won'); assert.equal(protectedGame.convoy.arrived, true);
  assert.ok(protectedGame.convoy.hp > 0);
  const abandoned = createGame({ missionId: 'op02', walkerId: 'WK09', difficulty: 'story', seed: 1305 });
  for (let frame = 0; frame < 24000 && abandoned.status === 'playing'; frame++) {
    const move = abandoned.player.x < 1800 ? 1 : 0;
    updateGame(abandoned, DT, { move, brace: !move, vent: true });
  }
  assert.equal(abandoned.status, 'lost');
  assert.equal(abandoned.convoy.hp, 0); assert.equal(abandoned.convoy.arrived, false);
  assert.ok(abandoned.player.hull > 0, 'the convoy, not player hull loss, ends the unattended escort');
  assert.match(abandoned.outcome, /transport est perdu/);
  const won = operationReport(protectedGame), lost = operationReport(abandoned);
  assert.equal(won.records.op02.completed, true);
  assert.equal(lost.saved.size, 0);
  evidence(t, ['QA13'], 'public-controls-and-isolated-report', {
    protected: { status: protectedGame.status, arrived: protectedGame.convoy.arrived, hp: protectedGame.convoy.hp, collateral: protectedGame.stats.collateral },
    abandoned: { status: abandoned.status, arrived: abandoned.convoy.arrived, hp: abandoned.convoy.hp, walkerHp: abandoned.player.hull, collateral: abandoned.stats.collateral },
    occupantRosterExists: false, familiesInNarrative: 47, peopleInferredFromFamilies: null,
  });
});

for (const choice of ['obey', 'defy']) test(`QA14: OP03 ${choice} locks the choice and writes its own operation report (public controls plus isolated report)`, t => {
  const s = createGame({ missionId: 'op03', walkerId: 'WK09', difficulty: 'normal', seed: 1405 });
  pilotOperation(s, { stopAt: state => state.decision.active });
  assert.equal(s.decision.active, true);
  const boss = s.enemies.find(e => e.type === 'boss');
  assert.equal(boss.dead, false);
  assert.equal(commandGame(s, 'choice', choice), true);
  const selectedStats = clone(s.stats);
  assert.equal(commandGame(s, 'choice', choice === 'obey' ? 'defy' : 'obey'), false);
  assert.equal(s.decision.choice, choice); assert.deepEqual(s.stats, selectedStats);
  if (choice === 'defy') assert.equal(s.extraction.active, false);
  pilotOperation(s, { choice });
  assert.equal(s.status, 'won'); assert.equal(boss.dead, choice === 'defy');
  assert.equal(s.stats.ordersObeyed, choice === 'obey' ? 1 : 0);
  assert.equal(s.stats.ordersDefied, choice === 'defy' ? 1 : 0);
  assert.equal(commandGame(s, 'choice', choice === 'obey' ? 'defy' : 'obey'), false);
  const report = operationReport(s), record = JSON.parse(report.saved.get('imperium.records.v1')).op03;
  assert.equal(record.choice, choice); assert.equal(record.kills, s.stats.kills);
  assert.equal(record.evidence, s.stats.evidence); assert.equal(record.completed, true);
  assert.match(report.elements.get('result-stats').innerHTML, choice === 'obey' ? /Ordre exécuté/ : /Ordre contesté/);
  assert.equal(report.elements.get('result-dialog').open, true);
  evidence(t, ['QA14'], 'public-controls-and-isolated-report', { choice, bossDead: boss.dead, status: s.status, savedRecord: record, reportFunctionOnly: true, browserStorageExercised: false });
});

test('QA28: MI01 and OP02 transports receive real player bullets and direct rockets once (public controls)', t => {
  const cases = [];
  for (const missionId of ['MI01', 'op02']) for (const secondary of [false, true]) {
    const s = createGame({ missionId, walkerId: 'WK01', difficulty: 'story', seed: 20261111 });
    for (let frame = 0; frame < 90; frame++) updateGame(s, DT, {
      brace: true, fire: !secondary && frame === 0, secondary: secondary && frame === 0,
      aimX: s.convoy.x, aimY: s.convoy.y,
    });
    const damage = secondary ? 165 : s.walker.damage;
    assert.equal(s.stats.shots, 1);
    assert.equal(s.convoy.hp, s.convoy.maxHp - damage, 'a direct rocket is not counted again as splash damage');
    assert.equal(s.notified.convoyFriendlyDamage, true);
    assert.equal(s.events.filter(e => /transport protégé est touché/.test(e.text)).length, 1);
    cases.push({ missionId, weapon: secondary ? 'rocket' : 'bullet', damage });
  }
  evidence(t, ['QA28'], 'public-controls', { cases, consequence: 'finite convoy HP and escort failure at zero; one explicit friendly-damage warning' });
});

function convoyGeometryFixture(missionId = 'op02', seed = 2805) {
  const s = createGame({ missionId, walkerId: 'WK01', difficulty: 'story', assist: false, seed });
  // Geometric unit only: isolate the same real transport at a stationary test
  // coordinate, without a competing projectile target or automatic convoy move.
  s.enemies = [];
  s.convoy.x = 700; s.convoy.y = terrainAt(700, s.planetId) - s.convoy.h / 2; s.convoy.speed = 0;
  return s;
}
function fixtureShot(s, { team = 'player', type = 'bullet', x, y, vx = 0, vy = 0, damage = 100 } = {}) {
  s.projectiles.push({ id: 'geometric-unit-shot', x, y, prevX: x, prevY: y, vx, vy, team, type,
    damage, radius: type === 'rocket' ? 5 : 2, life: 2, trail: [] });
}

test('QA28: both teams hit the same swept transport volume and splash has a finite radius (geometric unit fixtures)', t => {
  const cases = [];
  for (const missionId of ['MI01', 'op02']) {
    for (const team of ['player', 'enemy']) {
      const s = convoyGeometryFixture(missionId);
      fixtureShot(s, { team, x: 520, y: s.convoy.y, vx: 12000 });
      updateGame(s, 1 / 30, { brace: true });
      const damage = 100 * (team === 'enemy' ? s.difficulty.damage : 1);
      assert.ok(Math.abs(s.convoy.hp - (s.convoy.maxHp - damage)) < 1e-10);
      assert.equal(s.projectiles.length, 0);
      cases.push({ missionId, kind: 'swept-direct', team, damage });
    }
    for (const team of ['player', 'enemy']) for (const offset of [70, 200]) {
      const s = convoyGeometryFixture(missionId), x = s.convoy.x + offset;
      fixtureShot(s, { team, type: 'rocket', x, y: terrainAt(x, s.planetId) + 8, damage: 165 });
      updateGame(s, DT, { brace: true });
      const damage = s.convoy.maxHp - s.convoy.hp;
      assert.equal(damage > 0, offset === 70);
      assert.equal(s.events.filter(e => e.type === 'explosion').length, 1);
      cases.push({ missionId, kind: 'ground-splash', team, offset, damage });
    }
  }
  evidence(t, ['QA28'], 'geometric-unit', { cases, baseBlastRadius: 90, transportRadiusAllowance: 56 });
});

test('QA08/QA28: a voluntary backwards landing damages the transport once; body proximity alone does not (public controls)', t => {
  const cases = [];
  for (const missionId of ['MI01', 'op02']) {
    const s = createGame({ missionId, walkerId: 'WK01', difficulty: 'story', assist: false });
    updateGame(s, DT, { move: -1 });
    assert.equal(s.convoy.hp, s.convoy.maxHp);
    assert.equal(commandGame(s, 'stepA'), true);
    const foot = s.player.feet.find(f => f.phase === 'swing');
    advance(s, .25, { brace: true });
    assert.equal(foot.contact, false); assert.equal(s.convoy.hp, s.convoy.maxHp);
    advance(s, .5, { brace: true });
    assert.equal(foot.contact, true); assert.equal(s.convoy.hp, s.convoy.maxHp - 65);
    advance(s, .2, { brace: true });
    assert.equal(s.convoy.hp, s.convoy.maxHp - 65);
    cases.push({ missionId, landingX: foot.x, convoyX: s.convoy.x, damage: 65 });
  }
  evidence(t, ['QA08', 'QA28'], 'public-controls', { cases, airborneDamage: 0, repeatedProximityDamage: 0 });
});

test('QA28: convoy footprint edges distinguish contact from a close miss (geometric unit fixtures)', t => {
  const cases = [];
  for (const missionId of ['MI01', 'op02']) for (const offset of [0, 90.99, 91.01]) {
    const s = convoyGeometryFixture(missionId);
    assert.equal(commandGame(s, 'stepA'), true);
    const foot = s.player.feet.find(f => f.phase === 'swing');
    s.convoy.x = foot.targetX + offset;
    s.convoy.y = terrainAt(s.convoy.x, s.planetId) - s.convoy.h / 2;
    advance(s, .75, { brace: true });
    const damage = s.convoy.maxHp - s.convoy.hp;
    assert.equal(damage, offset < 91 ? 65 : 0);
    cases.push({ missionId, offset, damage });
  }
  evidence(t, ['QA28'], 'geometric-unit', { cases, footprintHalfExtent: 35 + 112 / 2 });
});

test('QA28: the normal escort waits behind descending feet for all six chassis, including WK10 (public controls)', t => {
  const cases = [];
  for (const missionId of ['MI01', 'op02']) for (const walker of WALKERS) {
    const s = createGame({ missionId, walkerId: walker.id, difficulty: 'story' });
    let checkedLandings = 0, previousSteps = 0;
    for (let frame = 0; frame < 240; frame++) {
      updateGame(s, DT, { move: 1, vent: true });
      for (const foot of s.player.feet.filter(f => f.phase === 'swing')) {
        assert.ok(s.convoy.x <= foot.targetX - 35 - s.convoy.w / 2 + 1e-8,
          `${missionId}/${walker.id}: following transport crosses an announced footprint`);
      }
      if (s.stats.steps > previousSteps) { checkedLandings++; previousSteps = s.stats.steps; }
      assert.equal(s.convoy.hp, s.convoy.maxHp, `${missionId}/${walker.id}: normal following caused friendly damage`);
    }
    assert.ok(checkedLandings >= 3); assert.ok(s.player.x > 400);
    cases.push({ missionId, walkerId: walker.id, stepGroups: checkedLandings, convoyHp: s.convoy.hp });
  }
  evidence(t, ['QA28'], 'public-controls', { cases, immunityAdded: false, healthRestored: false });
});

test('QA24: the same timed public combat sequence has equal collision results at 30, 60 and 120 Hz (documented tolerance)', t => {
  const cases = [];
  for (const hz of [30, 60, 120]) {
    const s = createGame({ missionId: 'op01', walkerId: 'WK09', difficulty: 'story', seed: 2405 });
    for (let frame = 0; frame < 10 * hz; frame++) {
      const seconds = frame / hz, target = s.enemies[0];
      const move = seconds < 2 || seconds >= 5 && seconds < 7 ? 1 : 0;
      updateGame(s, 1 / hz, { move, brace: !move, fire: seconds >= 2 && seconds < 5 && !target.dead,
        vent: seconds >= 5, aimX: target.x, aimY: target.y });
    }
    assert.ok(Math.abs(s.elapsed - 10) < 1e-9);
    assert.equal(s.enemies[0].dead, true);
    assert.equal(s.status, 'playing');
    assert.ok(s.player.feet.every(foot => foot.contact));
    cases.push({ hz, elapsed: s.elapsed, x: s.player.x, hull: s.player.hull, heat: s.player.heat,
      shots: s.stats.shots, hits: s.stats.hits, kills: s.stats.kills, steps: s.stats.steps,
      ammo: s.player.ammo, reserve: s.player.reserveAmmo });
  }
  const { hz: _, elapsed: __, x: ___, ...reference } = cases[1];
  for (const { hz, elapsed, x, ...row } of cases) assert.deepEqual(row, reference, `combat accounting at ${hz} Hz`);
  // Variable-delta gait integration is not bit-identical. The documented bound
  // for this ten-second sequence is 10 world units (<9% of this 112-unit stride).
  const spread = Math.max(...cases.map(row => row.x)) - Math.min(...cases.map(row => row.x));
  assert.ok(spread <= 10, `position spread ${spread} exceeds the 10-unit bound`);
  evidence(t, ['QA24'], 'public-controls-at-emulated-frame-cadences', {
    cases, positionSpread: spread,
    tolerances: { durationSeconds: 1e-9, positionWorldUnits: 10, shotsHitsKillsStepsAmmoHullHeat: 0 },
    realBrowserFramePacingMeasured: false, coversBelow20HzOrBackgroundTab: false,
  });
});

test('QA11/QA24: one authentic public scan progresses and completes equivalently at 30, 60 and 120 Hz', t => {
  const cases = [];
  for (const hz of [30, 60, 120]) {
    const s = publicScanApproach(), startedAt = s.elapsed;
    assert.equal(commandGame(s, 'interact'), true);
    advance(s, 2, { brace: true }, hz);
    const progressAtTwoSeconds = s.evidence.scanProgress;
    assert.ok(Math.abs(progressAtTwoSeconds - 2 / s.evidence.scanTime) < 1e-10);
    assert.equal(s.evidence.collected, false);
    for (let frame = 0; frame < hz && !s.evidence.collected; frame++) updateGame(s, 1 / hz, { brace: true });
    assert.equal(s.evidence.collected, true); assert.equal(s.stats.evidence, 1);
    const duration = s.elapsed - startedAt;
    assert.ok(duration >= s.evidence.scanTime - 1e-9 && duration <= s.evidence.scanTime + 1 / hz + 1e-9);
    cases.push({ hz, progressAtTwoSeconds, completionSeconds: duration, copies: s.stats.evidence });
  }
  evidence(t, ['QA11', 'QA24'], 'public-controls-at-emulated-frame-cadences', {
    cases, tolerances: { progressFraction: 1e-10, completionSeconds: 'one update quantum at the selected cadence (maximum 1/30 s)', copies: 0 },
    sourceCheckpoint: 'deep copy of a journey obtained entirely through pilotOperation public controls',
  });
});
