import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/simulation.mjs';
import { pilotMI14 } from './helpers/mi14-driver.mjs';
import { drawWorkshopSite, drawWorkshopActors, drawWorkshopLabels, drawWorkshopInstrument, workshopSummary } from '../src/workshop-renderer.mjs';

function recorder() {
  const calls = [], ctx = new Proxy({}, { get: (_, method) => (...args) => calls.push({ method, args }), set: () => true });
  return { ctx, calls, cameraX: 2000, visible: () => true };
}
test('MI14 dormant security never leaks through either actor or label rendering', () => {
  const s = createGame({ missionId: 'MI14', walkerId: 'WK09', difficulty: 'story', seed: 1415 });
  pilotMI14(s, { stopAt: game => game.workshop.alert.triggered && !game.workshop.alert.ready });
  assert.equal(s.workshop.alert.triggered, true); assert.equal(s.workshop.alert.ready, false);
  const unit = s.enemies.find(e => e.id === 'workshop-security-1'), dormant = recorder();
  drawWorkshopActors(dormant, s); drawWorkshopLabels(dormant, s);
  assert.equal(dormant.calls.some(c => c.method === 'translate' && c.args[0] === unit.x), false);
  assert.equal(dormant.calls.some(c => c.method === 'fillText' && String(c.args[0]).includes('AUTOMATE')), false);
  pilotMI14(s, { stopAt: game => game.workshop.alert.ready }); assert.equal(s.workshop.alert.ready, true);
  const active = recorder(); drawWorkshopActors(active, s); drawWorkshopLabels(active, s);
  assert.ok(active.calls.some(c => c.method === 'translate' && c.args[0] === unit.x));
  assert.ok(active.calls.some(c => c.method === 'fillText' && c.args[0] === 'AUTOMATE DE SÉCURITÉ'));
});

test('MI14 rendering and its shared HUD preserve real jobs, copies, body positions and losses', () => {
  const s = createGame({ missionId: 'MI14', walkerId: 'WK09', difficulty: 'story', seed: 1415 });
  pilotMI14(s, { stopAt: game => game.workshop.cooler.repair.working && game.workshop.cooler.repair.progress > .4 });
  assert.ok(s.workshop.cooler.repair.progress > .4);
  const before = JSON.stringify(s), r = recorder();
  drawWorkshopSite(r, s); drawWorkshopActors(r, s); drawWorkshopLabels(r, s); drawWorkshopInstrument(r, s);
  const summary = workshopSummary(s);
  assert.equal(JSON.stringify(s), before);
  assert.match(summary.stage, /^RÉPARATION/); assert.match(summary.cooler, /PANNE À RÉPARER/);
  assert.match(summary.people, /8 \/ 8 EN VIE/); assert.match(summary.people, /8 À LA GALERIE/);
  assert.equal(summary.people, summary.workers); assert.equal(summary.operation, summary.order);
  pilotMI14(s, { destroyLotAfterCopy: true, stopAt: game => game.workshop.lot.destroyed });
  assert.equal(s.workshop.lot.destroyed, true); assert.equal(s.workshop.lot.copied, true);
  assert.match(workshopSummary(s).lot, /RELEVÉ CONSERVÉ · ORIGINAL PERDU/);
});
