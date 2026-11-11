import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, CAMPAIGN_MISSIONS } from '../src/content.mjs';
import { createGame, commandGame, updateGame, channelTideAt, channelSurfaceAt, channelDecisionBody } from '../src/simulation.mjs';
import { pilotMI05 } from './helpers/mi05-driver.mjs';

const create = (options = {}) => createGame({ missionId: 'MI05', difficulty: 'normal', seed: 1847, ...options });
function advance(s, seconds, input = {}) { for (let n = 0; n < Math.ceil(seconds * 60); n++) updateGame(s, 1 / 60, input); }
function shootPart(s, part) {
  for (let n = 0; n < 5000 && !part.destroyed && s.status === 'playing'; n++) {
    const vent = s.player.heat > 75 || s.player.overheated;
    updateGame(s, 1 / 60, { brace: true, vent, fire: !vent, aimX: part.x, aimY: part.y });
  }
  assert.equal(part.destroyed, true);
}

test('MI05 six chassis complete both reports through public controls, protecting twelve refugees and four crew', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const s = pilotMI05(create({ walkerId: walker.id }), { choice });
    assert.equal(s.status, 'won', `${walker.id}/${choice}: ${JSON.stringify(s.objectives)}`);
    assert.equal(s.campaign.refugeesPassed, 12); assert.equal(s.campaign.refugeesLost, 0);
    assert.equal(s.campaign.bargeCiviliansLost, 0); assert.equal(s.stats.collateral, 0);
    assert.equal(s.campaign.traffickingVerified, true); assert.equal(s.campaign.smugglerVerified, true);
    assert.equal(s.campaign.fuelLots, 2); assert.equal(s.campaign.reportFiled, choice === 'defy');
    assert.ok(s.channel.banks.every(b => b.bridgeRaised)); assert.ok(s.objectives.every(o => o.complete));
    assert.equal(s.stats.evidence, 0, 'local invoice is not another PALINODE fragment');
    const complete = structuredClone(s); updateGame(s, .05, { move: -1, secondary: true });
    assert.equal(commandGame(s, 'choice', 'obey'), false); assert.deepEqual(s, complete);
  }
});

test('Nacre starts with no inferred testimony or trafficking proof, with and without PT01', () => {
  for (const technicalEvidence of [false, true]) {
    const s = create({ campaignContext: { technicalEvidence, railHostagesRescued: 8, railRecordFiled: true } });
    assert.equal(s.planetId, 'PL02'); assert.equal(s.campaign.context.technicalEvidence, technicalEvidence);
    assert.equal(s.campaign.traffickingVerified, false); assert.equal(s.campaign.smugglerVerified, false);
    assert.equal(s.campaign.channelOpen, false); assert.equal(s.campaign.fuelRecovered, false);
    assert.equal(commandGame(s, 'choice', 'defy'), false); assert.equal(s.extraction.active, false);
  }
  for (const m of CAMPAIGN_MISSIONS.filter(m => m.id !== 'MI05')) assert.equal('channel' in createGame({ missionId: m.id }), false);
});

test('tide has announced rising/falling phases, a repeatable period, and separate walking and navigation thresholds', () => {
  const samples = [0, 25.9, 26, 30, 32, 36, 61.9, 62, 66, 71.9];
  for (const time of samples) {
    const a = channelTideAt(time), b = channelTideAt(time + 72);
    for (const key of ['level', 'waterY', 'secondsToChange']) assert.ok(Math.abs(a[key] - b[key]) < 1e-10);
    for (const key of ['phase', 'walkable', 'navigable']) assert.equal(a[key], b[key]);
  }
  assert.equal(channelTideAt(0).walkable, true); assert.equal(channelTideAt(0).navigable, false);
  assert.equal(channelTideAt(26).phase, 'rising'); assert.equal(channelTideAt(36).navigable, true);
  assert.equal(channelTideAt(36).walkable, false); assert.equal(channelTideAt(62).phase, 'falling');
  const s = create(); advance(s, 38, { brace: true });
  assert.ok(s.events.some(e => e.text.includes('Marée montante')));
  assert.deepEqual(s.channel.tide, channelTideAt(s.elapsed));
});

test('a bridge takes four seconds; leaving its command cancels work, and exact snapshots retain partial progress', () => {
  const s = pilotMI05(create(), { stopAt: g => g.channel.banks[0].working });
  advance(s, 1, { brace: true }); const bank = s.channel.banks[0];
  assert.ok(bank.progress > .24 && bank.progress < .28); assert.equal(bank.bridgeRaised, false);
  const restored = structuredClone(s);
  advance(s, 1, { brace: true }); advance(restored, 1, { brace: true }); assert.deepEqual(s, restored);
  advance(s, 5, { move: -1 }); assert.equal(bank.working, false); assert.equal(bank.progress, 0);
  let worked = 0;
  pilotMI05(s, { stopAt: g => g.channel.banks[0].bridgeRaised, observe: g => { if (g.channel.banks[0].working) worked += 1 / 60; } });
  assert.ok(worked >= 3.96 && worked <= 4.04); assert.equal(bank.progress, 1);
});

test('real planted feet on an uncovered bank wear in high water, while a raised bridge protects them', () => {
  // Local physical fixture isolates foot-water contact from enemy projectile damage.
  for (const raised of [false, true]) {
    const s = create(), bank = s.channel.banks[0];
    bank.bridgeRaised = raised; bank.progress = raised ? 1 : 0;
    s.elapsed = 40; s.channel.tide = channelTideAt(40);
    s.player.x = 1130; s.player.anchorX = 1130;
    for (const f of s.player.feet) { f.x = 1130 + f.homeOffset; f.fromX = f.x; f.targetX = f.x; }
    for (const e of s.enemies) e.dead = true;
    const before = s.player.feet.map(f => f.health); advance(s, 2, { brace: true });
    for (let i = 0; i < before.length; i++) raised ? assert.equal(s.player.feet[i].health, before[i]) : assert.ok(s.player.feet[i].health < before[i] - 2);
  }
});

test('six feet distribute load on uncovered mud and submerged banks; all chassis remain equal on a bridge', () => {
  const two = create({ walkerId: 'WK01' }), six = create({ walkerId: 'WK09' });
  for (const elapsed of [0, 40]) {
    two.channel.tide = channelTideAt(elapsed); six.channel.tide = channelTideAt(elapsed);
    assert.ok(channelSurfaceAt(six, 1130).traction > channelSurfaceAt(two, 1130).traction);
  }
  for (const s of [two, six]) { s.channel.banks[0].bridgeRaised = true; assert.deepEqual(channelSurfaceAt(s, 1130), { kind: 'bridge', traction: 1, submerged: false }); }
  const bare = pilotMI05(create(), { skipBridges: true }); assert.equal(bare.status, 'won');
  assert.ok(bare.channel.banks.every(b => !b.bridgeRaised), 'bare route is a real alternative');
});

test('aimed projectiles can destroy both winch heads without destroying or injuring the barges', () => {
  const s = pilotMI05(create(), { shootWinches: true });
  assert.equal(s.status, 'won'); assert.ok(s.channel.winches.every(w => w.destroyed && w.released));
  assert.ok(s.channel.barges.every(b => !b.destroyed)); assert.equal(s.stats.collateral, 0);
});

test('destruction before inspection loses the actual invoice or contact but still permits a factual report', () => {
  for (const kind of ['trafficker', 'smuggler']) {
    const s = pilotMI05(create(), { destroyBarge: kind });
    assert.equal(s.status, 'won'); assert.equal(s.campaign.bargesInspected, 2);
    assert.equal(kind === 'trafficker' ? s.campaign.traffickingVerified : s.campaign.smugglerVerified, false);
    assert.equal(s.campaign.bargeCiviliansLost, kind === 'smuggler' ? 4 : 0);
    assert.equal(s.campaign.refugeesPassed, 12, 'independent boat remains distinct from barge occupants');
    assert.match(channelDecisionBody(s), kind === 'trafficker' ? /Aucune facture/ : /Aucune liaison/);
  }
});

test('a copied invoice survives destruction of its source, and an uninspected second crew is not identified', () => {
  const s = pilotMI05(create(), { stopAt: g => g.campaign.traffickingVerified });
  const source = s.channel.barges[0]; assert.equal(source.inspected, true);
  shootPart(s, source);
  assert.equal(s.campaign.traffickingVerified, true); assert.equal(s.campaign.smugglerVerified, false);
  assert.equal(source.scanProgress, 1); assert.match(channelDecisionBody(s), /facture copiée/);
  pilotMI05(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.traffickingVerified, true);
});

test('a barge radio contact is retained after later losses without treating its crew as alive', () => {
  const s = pilotMI05(create(), { stopAt: g => g.campaign.smugglerVerified });
  shootPart(s, s.channel.barges[1]);
  assert.equal(s.campaign.smugglerVerified, true); assert.equal(s.campaign.bargeCiviliansLost, 4);
  assert.match(channelDecisionBody(s), /Cette liaison a eu lieu/);
  pilotMI05(s); assert.equal(s.status, 'won'); assert.equal(s.stats.collateral, 4);
});

test('the civilian boat stays behind the closed cables, waits at low water, and physically reaches its dock', () => {
  const s = create(); const start = s.channel.boat.x;
  pilotMI05(s, { stopAt: g => g.campaign.winchesReleased === 1 });
  assert.equal(s.channel.boat.x, start);
  let waitingObserved = false, movingObserved = false;
  pilotMI05(s, { observe: g => {
    if (g.campaign.channelOpen && !g.channel.boat.arrived) {
      if (!g.channel.tide.navigable) { assert.equal(g.channel.boat.moving, false); waitingObserved = true; }
      else if (g.channel.boat.moving) movingObserved = true;
    }
  } });
  assert.equal(s.status, 'won'); assert.equal(waitingObserved, true); assert.equal(movingObserved, true);
  assert.equal(s.channel.boat.x, s.mission.channel.boatDockX); assert.equal(s.campaign.refugeesPassed, 12);
});

test('losing the boat records twelve losses without invented arrivals, and leaves a truthful way to end the mission', () => {
  const s = pilotMI05(create(), { destroyBoat: true });
  assert.equal(s.status, 'won'); assert.equal(s.campaign.refugeesPassed, 0); assert.equal(s.campaign.refugeesLost, 12);
  assert.equal(s.stats.collateral, 12); assert.equal(s.campaign.passageResolved, true);
  assert.equal(s.campaign.fuelLots, 2, 'separate dock fuel is not conjured or deleted by the boat outcome');
});

test('dock fuel is optional, finite and destructible independently of the boat and the two crews', () => {
  for (const options of [{ skipFuel: true }, { destroyFuel: true }]) {
    const s = pilotMI05(create(), options); assert.equal(s.status, 'won');
    assert.equal(s.campaign.fuelLots, 0); assert.equal(s.campaign.fuelRecovered, false);
    assert.equal(s.campaign.refugeesPassed, 12);
  }
  const s = pilotMI05(create(), { stopAt: g => g.channel.fuel.working });
  advance(s, 1, { brace: true }); assert.equal(s.campaign.fuelLots, 0);
  assert.ok(s.channel.fuel.progress > .3 && s.channel.fuel.progress < .4);
  advance(s, 2.1, { brace: true }); assert.equal(s.campaign.fuelLots, 2);
  for (let n = 0; n < 5; n++) commandGame(s, 'interact');
  assert.equal(s.campaign.fuelLots, 2); assert.equal(s.channel.fuel.collected, true);
});

test('an in-progress boat and tide resume deterministically with identical future public input', () => {
  const s = pilotMI05(create(), { stopAt: g => g.channel.boat.moving && g.channel.boat.x > 1800 });
  const resumed = JSON.parse(JSON.stringify(s));
  pilotMI05(s); pilotMI05(resumed); assert.equal(s.status, 'won'); assert.deepEqual(s, resumed);
  assert.deepEqual(s.channel.tide, channelTideAt(s.elapsed));
});

test('opening the report keeps the tide clock synchronized and freezes all time until a choice', () => {
  const s = pilotMI05(create(), { stopAt: g => g.decision.active });
  assert.equal(s.decision.active, true); assert.deepEqual(s.channel.tide, channelTideAt(s.elapsed));
  const before = structuredClone(s); advance(s, 10, { move: 1, fire: true }); assert.deepEqual(s, before);
});


test('an actual leg impact cannot heal a foot worn below fifteen by water, while the historical combat floor remains', () => {
  function incomingLeg(s) {
    const p = s.player, f = p.feet[0], x = f.x - 90, y = p.groundY - 45;
    s.projectiles.push({ id: `foot-impact-${++s.entityId}`, team: 'enemy', type: 'bullet',
      x, y, prevX: x, prevY: y, vx: 600, vy: 0, damage: 110,
      radius: 2, life: 1, trail: [] });
    advance(s, .4, { brace: true });
  }
  // Geometry-only fixture. The health loss comes from production tide/foot contact,
  // then a controlled projectile travels through production collision and damage.
  const wet = create(); wet.player.x = 1130; wet.player.anchorX = 1130;
  for (const f of wet.player.feet) { f.x = 1130 + f.homeOffset; f.fromX = f.x; f.targetX = f.x; }
  for (const e of wet.enemies) e.dead = true;
  for (let n = 0; n < 18000 && wet.player.feet[0].health >= 12; n++) updateGame(wet, 1 / 60, { brace: true });
  const before = wet.player.feet[0].health, hull = wet.player.hull;
  assert.ok(before > 0 && before < 15, 'water must actually produce the weakened foot');
  incomingLeg(wet);
  assert.ok(wet.player.hull < hull, 'the projectile must really hit the walker');
  assert.ok(wet.player.feet[0].health <= before, 'a hit must never restore integrity');
  const dry = createGame({ missionId: 'op01' });
  for (let n = 0; n < 4; n++) incomingLeg(dry);
  assert.equal(dry.player.feet[0].health, 15, 'legacy healthy-foot combat floor is preserved');
  assert.ok(dry.player.hull > 0);
});
