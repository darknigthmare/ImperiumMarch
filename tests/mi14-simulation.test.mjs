import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, commandGame, updateGame, workshopSurfaceAt } from '../src/simulation.mjs';
import { WALKERS } from '../src/content.mjs';
import { workshopAvailableJobs, workshopWorkerPosition, workshopReceiptRoster } from '../src/workshop-simulation.mjs';
import { validateWorkshopMission, validateWorkshopReceipt, validateWorkshopSortie, workshopDossierFromGame } from '../src/workshop-validation.mjs';
import { pilotMI14, fireAtMI14 } from './helpers/mi14-driver.mjs';

const start = (options = {}) => createGame({ missionId: 'MI14', walkerId: 'WK09', difficulty: 'story', seed: 1514, ...options });
const templateFor = s => start({ walkerId: s.walkerId, difficulty: s.difficultyId, seed: s.seed, campaignContext: s.campaign.context });
const validate = s => validateWorkshopMission(s, templateFor(s));
const cache = new Map();
function completed(options = {}, deployment = {}) {
  const key = JSON.stringify([options, deployment]);
  if (!cache.has(key)) { const s = start(deployment); pilotMI14(s, options); assert.equal(s.status, 'won', key); validate(s); cache.set(key, s); }
  return structuredClone(cache.get(key));
}
function until(stopAt, options = {}) { const s = start(); pilotMI14(s, { ...options, stopAt }); assert.equal(s.status, 'playing'); assert.equal(Boolean(stopAt(s)), true); validate(s); return s; }
const seconds = (s, duration, input = {}) => { for (let i = 0; i < Math.ceil(duration * 60); i++) updateGame(s, 1 / 60, input); };

for (const walker of WALKERS) for (const choice of ['obey', 'defy']) test(`MI14 ${walker.id} ${choice}: public controls preserve eight workers and execute the chosen command`, () => {
  const s = completed({ choice }, { walkerId: walker.id });
  assert.equal(s.campaign.workersAlive, 8); assert.equal(s.campaign.workersSheltered, 8); assert.equal(s.stats.collateral, 0);
  assert.equal(s.campaign.coolerRepaired, true); assert.equal(s.campaign.productionOnline, choice === 'obey');
  assert.equal(s.campaign.mechanicsAvailable, choice === 'defy' ? 2 : 0); assert.equal(s.campaign.localSabotageRecorded, true);
  assert.equal(s.campaign.pt03CrossReferenced, false); assert.equal(s.campaign.publicReleased, false); assert.equal(s.campaign.defected, false);
  assert.equal(s.evidence.collected, false); assert.equal(s.stats.evidence, 0); assert.equal(s.stats.kills, 1);
  assert.ok(s.objectives.every(objective => objective.complete));
  for (const foot of s.player.feet.filter(f => f.contact)) assert.equal(foot.y, workshopSurfaceAt(s, foot.x).groundY);
});

test('MI14 exists only in its own mission and keeps the eight local identities separate from prior worlds', () => {
  assert.equal(createGame({ missionId: 'MI13' }).workshop, undefined);
  const s = start(); assert.equal(s.workshop.workers.length, 8);
  assert.equal(s.workshop.workers.filter(w => w.mechanic).length, 2);
  assert.equal(s.workshop.workers.filter(w => w.origin === 'nacre-before-known-census').length, 3);
  assert.equal(new Set(s.workshop.workers.map(w => w.id)).size, 8);
  assert.equal(s.campaign.workersAlive, 8); assert.equal(s.campaign.workersSheltered, 0); validate(s);
});

test('passage is a timed anchored request followed by an actual pedestrian journey on one common ramp', () => {
  const s = until(s => s.workshop.picket.working && s.workshop.picket.progress > .4);
  assert.equal(s.workshop.picket.requested, false); assert.ok(s.workshop.workers.every(w => w.routeProgress === 0));
  const partial = structuredClone(s); seconds(s, .2, { move: -1 });
  assert.equal(s.workshop.picket.working, false); assert.equal(s.workshop.picket.progress, 0); assert.equal(s.workshop.picket.requested, false); validate(s);
  pilotMI14(s, { stopAt: s => s.workshop.picket.requested && s.workshop.workers[0].routeProgress > .1 });
  assert.equal(s.campaign.workersSheltered, 0); assert.ok(s.workshop.workers.every(w => w.x > w.startX && w.x < w.shelterX));
  validate(s); validateWorkshopSortie(partial, s);
  const a = { ...s.workshop.workers[0], routeProgress: .65 }, b = { ...a, shelterX: a.shelterX + 100, startX: a.startX - 185.7142857142857 };
  // A shared coordinate has one height, independent of the worker's final slot.
  const x = 1750;
  a.routeProgress = (x - a.startX) / (a.shelterX - a.startX); b.routeProgress = (x - b.startX) / (b.shelterX - b.startX);
  const runtime = { terrainAt: x => workshopSurfaceAt(s, x).groundY };
  assert.equal(workshopWorkerPosition(s, a, runtime).y, workshopWorkerPosition(s, b, runtime).y);
  pilotMI14(s); assert.equal(s.status, 'won'); assert.equal(s.campaign.workersAlive, 8); validate(s);
});

test('forcing the occupied picket causes persistent physical foot casualties rather than a harmless dialogue choice', () => {
  const s = completed({ skipPassage: true });
  assert.ok(s.stats.steps > 0); assert.equal(s.campaign.passageRequested, false);
  assert.ok(s.campaign.workersLost > 0); assert.equal(s.stats.collateral, s.campaign.workersLost);
  assert.equal(s.campaign.workersAlive + s.campaign.workersLost, 8);
  assert.equal(s.campaign.mechanicsAvailable, 0);
  assert.ok(s.workshop.workers.filter(w => !w.alive).every(w => w.destroyedAt !== null && w.hp === 0));
});

test('the automate cannot act or receive projectile damage during its five-second activation warning', () => {
  const s = until(s => s.workshop.alert.triggered);
  const e = s.enemies[0], hp = e.hp, warningAt = s.elapsed;
  seconds(s, 4, { brace: true, fire: true, aimX: e.x, aimY: e.y });
  assert.equal(s.workshop.alert.ready, false); assert.equal(e.hp, hp); assert.equal(e.active, false);
  assert.equal(s.projectiles.some(p => p.team === 'enemy'), false); assert.equal(s.campaign.securityNeutralized, false); validate(s);
  while (!s.workshop.alert.ready) updateGame(s, 1 / 60, { brace: true });
  assert.ok(s.elapsed - warningAt >= 5 - .02); assert.equal(s.campaign.securityReady, true);
  pilotMI14(s); assert.equal(s.status, 'won'); assert.equal(e.dead, true); validate(s);
});

test('diagnosis, isolation and eight-second repair are separate jobs and moving cancels unfinished maintenance', () => {
  const s = until(s => s.workshop.cooler.inspection.working && s.workshop.cooler.inspection.progress > .2);
  assert.equal(workshopAvailableJobs(s).some(j => j.kind === 'valve'), false);
  pilotMI14(s, { stopAt: s => s.workshop.cooler.repair.working && s.workshop.cooler.repair.progress > .3 });
  const d = s.workshop; assert.equal(d.cooler.inspected, true); assert.equal(d.valve.closed, true); assert.equal(d.cooler.repaired, false);
  assert.ok(d.cooler.repair.startedAt >= d.valve.closedAt); const before = structuredClone(s);
  seconds(s, .1, { move: -1 }); assert.equal(d.cooler.repair.progress, 0); assert.equal(d.cooler.repaired, false); validate(s);
  pilotMI14(s, { stopAt: s => s.workshop.cooler.repaired });
  assert.ok(d.cooler.repairedAt - d.cooler.repair.startedAt >= 8 - .02); assert.ok(d.cooler.temperature > s.mission.workshop.safeTemperature);
  validate(s); validateWorkshopSortie(before, s);
  pilotMI14(s); assert.equal(s.status, 'won');
});

test('a destroyed isolation actuator requires a timed emergency cap and does not reconstruct its body', () => {
  const s = until(s => s.workshop.cooler.inspected && !s.workshop.valve.closed);
  fireAtMI14(s, 'workshop-valve'); assert.equal(s.workshop.valve.destroyed, true);
  pilotMI14(s); assert.equal(s.status, 'won'); assert.equal(s.workshop.valve.method, 'cap');
  assert.equal(s.workshop.valve.hp, 0); assert.equal(s.campaign.coolerRepaired, true); validate(s);
});

test('choosing an order leaves the control and lot untouched until a separate physical operation finishes', () => {
  const s = until(s => s.decision.active), before = structuredClone(s.workshop);
  const clock = s.elapsed; seconds(s, 2, { move: 1, fire: true }); assert.equal(s.elapsed, clock); assert.deepEqual(s.workshop, before);
  assert.equal(commandGame(s, 'choice', 'defy'), true); assert.equal(s.campaign.plan, 'hold');
  assert.deepEqual(s.workshop, before); assert.equal(s.campaign.controlOperated, false); assert.equal(s.campaign.mechanicsCooperating, false);
  pilotMI14(s, { stopAt: s => s.workshop.control.working && s.workshop.control.progress > .5 });
  assert.equal(s.workshop.control.operated, false); assert.equal(s.workshop.lot.blockedAt, null); validate(s);
  pilotMI14(s); assert.equal(s.status, 'won'); assert.equal(s.workshop.control.mode, 'hold');
  assert.equal(s.workshop.lot.blockedAt, s.workshop.control.operatedAt);
  assert.ok(s.workshop.cooperation.agreedAt >= s.workshop.control.operatedAt + 3 - .02); validate(s);
});

for (const after of [false, true]) test(`losing the lot ${after ? 'after' : 'before'} the copy retains exactly the acquired source`, () => {
  const s = completed(after ? { destroyLotAfterCopy: true } : { destroyLotBeforeCopy: true });
  assert.equal(s.workshop.lot.destroyed, true); assert.equal(s.campaign.lotRecordCopied, after); assert.equal(s.campaign.localSabotageRecorded, after);
  assert.equal(s.workshop.lot.copiedAt !== null, after); assert.equal(s.campaign.pt03CrossReferenced, false); assert.equal(s.stats.evidence, 0);
});

for (const after of [false, true]) test(`cooler loss ${after ? 'after' : 'before'} repair remains a material loss and blocks resumed production`, () => {
  const s = completed({ choice: 'obey', [after ? 'destroyCoolerAfterRepair' : 'destroyCoolerBeforeRepair']: true });
  assert.equal(s.campaign.coolerDestroyed, true); assert.equal(s.campaign.coolerRepaired, after); assert.equal(s.workshop.cooler.hp, 0);
  assert.equal(s.campaign.execution, 'damaged'); assert.equal(s.campaign.productionOnline, false); assert.equal(s.campaign.mechanicsAvailable, 0);
});

test('a command destroyed after the decision yields an explicit degraded outcome with no invented restart', () => {
  const s = completed({ choice: 'obey', destroyControlBeforeOperation: true });
  assert.equal(s.campaign.plan, 'restart'); assert.equal(s.campaign.execution, 'damaged'); assert.equal(s.campaign.productionRestarted, false);
  assert.equal(s.workshop.lot.releasedAt, null); assert.equal(s.campaign.reportTransmitted, true);
});

test('a mechanician lost after consenting retains the agreement and loses only their present availability', () => {
  const s = completed({ destroyWorkerAfterCooperation: true });
  assert.equal(s.campaign.mechanicsCooperating, true); assert.equal(s.campaign.mechanicsAlive, 1); assert.equal(s.campaign.mechanicsAvailable, 1);
  const w = s.workshop.workers[0]; assert.ok(w.destroyedAt > s.workshop.cooperation.agreedAt); assert.equal(s.campaign.workersLost, 1);
});

test('surviving workers supply their own lines; a dead named worker never speaks at later contacts', () => {
  const s = start(); pilotMI14(s, { destroyWorkerBeforePassage: true, stopAt: s => s.workshop.contact.inspected });
  const w = s.workshop.workers[0]; assert.equal(w.alive, false);
  assert.ok(s.events.some(e => e.time > w.destroyedAt && e.text.startsWith('Milo Arven :')));
  assert.equal(s.events.some(e => e.time > w.destroyedAt && e.text.startsWith('Doria Sen :')), false); validate(s);
});

test('PT03 cross-reference depends on actual MI13 inheritance and grants no new global evidence', () => {
  const context = { foundryRecorded: true, foundryPlan: 'quarantine', pt03Acquired: true, cargoTransferred: 2, cargoLost: 0 };
  const s = completed({}, { campaignContext: context });
  assert.equal(s.campaign.pt03CrossReferenced, true); assert.equal(s.stats.evidence, 0); assert.equal(s.evidence.collected, false);
  const lost = completed({ destroyLotBeforeCopy: true }, { campaignContext: context });
  assert.equal(lost.campaign.pt03CrossReferenced, false); assert.equal(lost.campaign.context.pt03Acquired, true);
});

test('checkpoint reconstruction is exact and the same future inputs produce the same scene', () => {
  const before = until(s => s.workshop.cooler.repair.progress > .3), resumed = JSON.parse(JSON.stringify(before));
  assert.deepEqual(resumed, before); validate(resumed);
  pilotMI14(before); pilotMI14(resumed); assert.deepEqual(resumed, before); assert.equal(resumed.status, 'won');
  const clone = structuredClone(resumed); updateGame(clone, .05, { move: 1, fire: true }); assert.deepEqual(clone, resumed);
});

test('sortie checks reconcile every periodic checkpoint, then reject time rewind and healed bodies', () => {
  const s = start(); let previous = structuredClone(s), count = 0;
  pilotMI14(s, { observe: (state, frame) => { if (frame % 500 === 0) { validate(state); validateWorkshopSortie(previous, state); previous = structuredClone(state); count++; } } });
  validate(s); validateWorkshopSortie(previous, s); assert.ok(count >= 10);
  const rewind = structuredClone(s); rewind.elapsed = previous.elapsed - 1; assert.throws(() => validateWorkshopSortie(previous, rewind), /horloge/);
  const restored = structuredClone(s); restored.enemies[0].hp = restored.enemies[0].maxHp; assert.throws(() => validateWorkshopSortie(s, restored), /terminal|automate/);
});

test('lost hull is a terminal mission and cannot resume as a living sortie', () => {
  const s = start({ walkerId: 'WK01', difficulty: 'normal' }); pilotMI14(s, { noFire: true, maxFrames: 60000 });
  assert.equal(s.status, 'lost'); assert.equal(s.player.hull, 0); validate(s);
  const dead = structuredClone(s); seconds(s, 5, { move: 1 }); assert.deepEqual(s, dead);
  const forged = structuredClone(s); forged.status = 'playing'; forged.player.hull = 1;
  assert.throws(() => validateWorkshopSortie(s, forged), /terminale ressuscitée/);
});

test('receipt snapshots are deep and reconcile bodies, acquired actions, counts and historical consent', () => {
  const s = completed(), original = structuredClone(s), roster = workshopReceiptRoster(s);
  const receipt = { ...workshopDossierFromGame(s), choice: 'defy', walkerId: s.walkerId, elapsed: s.elapsed,
    hull: s.player.hull, collateral: s.stats.collateral, kills: s.stats.kills };
  validateWorkshopReceipt(receipt, s.campaign.context); roster.workers[0].hp = 0;
  assert.deepEqual(s, original); assert.equal(receipt.roster.workers[0].hp, 75);
  const forged = structuredClone(receipt); forged.roster.lot.copiedAt = 0;
  assert.throws(() => validateWorkshopReceipt(forged, s.campaign.context), /copie/);
});

test('scene validation rejects instant movement, invented source, instant cooling, early cooperation and inactive damage', () => {
  const moving = until(s => s.workshop.workers[0].routeProgress > .1 && !s.workshop.workers[0].sheltered);
  const teleported = structuredClone(moving); teleported.workshop.workers[0].routeProgress = 1;
  assert.throws(() => validate(teleported), /trajet|arrivée|position/);
  const fresh = start(); fresh.enemies[0].hp--; assert.throws(() => validate(fresh), /avant activation/);
  const repaired = completed(); repaired.workshop.cooler.repair.startedAt = repaired.workshop.cooler.repairedAt;
  assert.throws(() => validate(repaired), /durée/);
  const copying = until(s => s.workshop.lot.working && s.workshop.lot.progress > .2); copying.workshop.lot.copied = true;
  assert.throws(() => validate(copying), /date|copie/);
  const hot = until(s => s.workshop.cooler.repair.working && s.workshop.cooler.repair.progress > .2); hot.workshop.cooler.temperature = 28;
  assert.throws(() => validate(hot), /refroidissement/);
  const obey = completed({ choice: 'obey' }); obey.workshop.cooperation.agreed = true; obey.workshop.cooperation.agreedAt = obey.workshop.cooperation.completedAt;
  assert.throws(() => validate(obey), /accord/);
});

for (const difficulty of ['normal', 'veteran']) test(`MI14 ${difficulty}: default combat balance and receipt preserve the safe route`, () => {
  const s = completed({}, { difficulty });
  assert.equal(s.campaign.workersAlive, 8); assert.equal(s.campaign.mechanicsAvailable, 2); assert.ok(s.player.hull > 0);
  const receipt = { ...workshopDossierFromGame(s), choice: 'defy', walkerId: s.walkerId, elapsed: s.elapsed,
    hull: s.player.hull, collateral: s.stats.collateral, kills: s.stats.kills };
  validateWorkshopReceipt(receipt, s.campaign.context);
});
