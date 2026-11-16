import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, departureGateBounds } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';
import { PAINTED_NACRE_SITE_LAYOUT } from '../src/painted-nacre-sites-layout.mjs';
import { PAINTED_NACRE_SITE_URLS, setPaintedNacreSiteImage, clearPaintedNacreSites, loadPaintedNacreSiteAssets,
  paintedNacreSiteAssetSnapshot, paintedNacreSiteFrame, paintedNacreSiteSelection, nacreSiteControlPoses,
  nacreSiteDamageState, drawPaintedNacreSitePart, drawPaintedNacreSitePump, drawPaintedNacreSiteValve,
  drawPaintedNacreSiteGate, drawPaintedNacreSiteDepartureRamp, drawPaintedNacreSiteDeck } from '../src/painted-nacre-sites.mjs';

const near = (a, b) => assert.ok(Math.abs(a - b) < .00001, `${a} differs from ${b}`);
const imageCalls = record => record.calls.filter(call => call.method === 'drawImage');
function loadStandIns() {
  for (const [key, atlas] of Object.entries(PAINTED_NACRE_SITE_LAYOUT))
    setPaintedNacreSiteImage(key, { atlasKey: key, width: atlas.size[0], height: atlas.size[1] });
}
function findFrame(record, atlas, name) {
  const source = paintedNacreSiteFrame(atlas, name).source;
  return imageCalls(record).find(call => call.args[0].atlasKey === atlas && JSON.stringify(call.args.slice(1, 5)) === JSON.stringify(source));
}
function rendererFor(record) {
  return Object.assign(Object.create(Renderer.prototype), { ctx: record.ctx, cameraX: 0, width: 1600, height: 900,
    panoramaReady: false, lastGame: null, combatReducedMotion: false, visible: () => true, prepare() {} });
}
test.afterEach(clearPaintedNacreSites);

test('thirty Nacre site cells have defensive crops and measured anchors, including unequal refuge cells', () => {
  assert.equal(Object.keys(PAINTED_NACRE_SITE_URLS).length, 5);
  let count = 0;
  for (const [key, atlas] of Object.entries(PAINTED_NACRE_SITE_LAYOUT)) for (const [name, original] of Object.entries(atlas.frames)) {
    const frame = paintedNacreSiteFrame(key, name); count++;
    assert.equal(frame.runtime, true); assert.deepEqual(paintedNacreSiteSelection(frame.part, frame.state), { atlas: key, frame: name });
    const [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
    assert.ok(x >= cx && y >= cy && x + w <= cx + cw && y + h <= cy + ch);
    for (const anchor of Object.values(frame.anchors)) {
      near(frame.target[0] + (anchor.source[0] - x) / w * frame.target[2], anchor.world[0]);
      near(frame.target[1] + (anchor.source[1] - y) / h * frame.target[3], anchor.world[1]);
    }
    frame.target[0] = -999; assert.notEqual(original.target[0], -999);
  }
  assert.equal(count, 30);
  assert.equal(PAINTED_NACRE_SITE_LAYOUT.shelters.frames.refuge.cell[0], 498);
  assert.equal(paintedNacreSiteSelection('valve', 'destroyed'), null, 'No fictional valve damage state');
  assert.equal(paintedNacreSiteSelection('house-a', 'flooded'), null, 'Water remains a continuous simulated overlay');
});

test('rotor and handwheel axes retain the real MI06 pivots and stop animation under reduced motion', () => {
  loadStandIns();
  const s = createGame({ missionId: 'MI06', seed: 1566 }), { auxiliary, valve } = s.dike;
  auxiliary.active = true; valve.working = true;
  const saved = JSON.stringify(s), record = combatRecorder();
  drawPaintedNacreSitePump(record.ctx, auxiliary, 7); drawPaintedNacreSiteValve(record.ctx, valve, 7);
  const rotor = findFrame(record, 'hydraulics', 'pump-rotor'), wheel = findFrame(record, 'hydraulics', 'valve-wheel');
  const rp = record.point(rotor, [0, 0]), wp = record.point(wheel, [0, 0]);
  near(rp[0], auxiliary.x - 6); near(rp[1], auxiliary.y - 2); near(wp[0], valve.x); near(wp[1], valve.y + 11);
  const fixedA = nacreSiteControlPoses(s.dike, 2, { reducedMotion: true });
  const fixedB = nacreSiteControlPoses(s.dike, 19, { reducedMotion: true });
  assert.deepEqual(fixedA, fixedB);
  near(fixedA.latch.x, s.dike.panel.x - s.dike.panel.w / 2 + 5); near(fixedA.latch.y, s.dike.panel.y - 8);
  assert.equal(JSON.stringify(s), saved); assert.equal(record.balanced(), true);
});

test('gate leaf follows authoritative moving bounds while ruins and guide rails retain their ground datum', () => {
  loadStandIns();
  const s = createGame({ missionId: 'MI08', seed: 1566 }), gate = s.departure.locks[0];
  for (const opening of [0, .37, 1]) {
    gate.opening = opening; const saved = JSON.stringify(s), record = combatRecorder(), bounds = departureGateBounds(gate);
    assert.equal(drawPaintedNacreSiteGate(record.ctx, gate, { leafY: bounds.y }), true);
    const leaf = findFrame(record, 'barriers', 'gate-normal'), point = record.point(leaf, [0, 0]);
    near(point[0], gate.x); near(point[1], bounds.y);
    const rails = record.calls.filter(call => call.method === 'fillRect');
    assert.equal(rails.length, 2); rails.forEach(call => near(call.args[1], gate.y - gate.h / 2));
    assert.equal(JSON.stringify(s), saved);
  }
  gate.destroyed = true; gate.hp = 0;
  const record = combatRecorder(); drawPaintedNacreSiteGate(record.ctx, gate, { leafY: departureGateBounds(gate).y });
  near(record.point(findFrame(record, 'barriers', 'gate-destroyed'), [0, 0])[1], gate.y);
});

test('deck strips follow the supplied terrain segment and unsupported destroyed ramps retain fallback', () => {
  loadStandIns(); const record = combatRecorder();
  assert.equal(drawPaintedNacreSiteDeck(record.ctx, 120, 650, 138, 643), true);
  const call = imageCalls(record)[0];
  const a = record.point(call, [-10, 0]), b = record.point(call, [10, 0]);
  near(a[0], 120); near(a[1], 650); near(b[0], 138); near(b[1], 643);
  const s = createGame({ missionId: 'MI08', seed: 1566 }), ramp = s.departure.ramps[0]; ramp.destroyed = true;
  const before = imageCalls(record).length, saved = JSON.stringify(s);
  assert.equal(drawPaintedNacreSiteDepartureRamp(record.ctx, ramp), false);
  assert.equal(imageCalls(record).length, before); assert.equal(JSON.stringify(s), saved);
});

test('Nacre site renderers leave all positions, water, supports, populations and save facts unchanged', () => {
  loadStandIns();
  for (const missionId of ['MI05', 'MI06', 'MI07', 'MI08']) {
    const s = createGame({ missionId, seed: 1566 }), saved = JSON.stringify(s), record = combatRecorder(), renderer = rendererFor(record);
    if (missionId === 'MI05') renderer.drawChannel(s, 8);
    if (missionId === 'MI06') { renderer.drawDike(s, 8); renderer.drawDikeControls(s, 8); }
    if (missionId === 'MI07') renderer.drawAmbulanceSite(s, 8);
    if (missionId === 'MI08') renderer.drawDepartureSite(s, 8);
    assert.ok(imageCalls(record).length >= 3, `${missionId}: painted sites reached`);
    assert.equal(JSON.stringify(s), saved, `${missionId}: render mutated simulation`);
    assert.equal(record.balanced(), true);
  }
  assert.equal(nacreSiteDamageState({ destroyed: true, hp: 100, maxHp: 100 }), 'destroyed');
  assert.equal(nacreSiteDamageState({ hp: 30, maxHp: 100 }), 'damaged');
});

test('failed or reset decoding preserves vector fallback and cannot install a stale or partial mechanical rig', async () => {
  const failed = await loadPaintedNacreSiteAssets({ loadImage: async () => { throw new Error('Intentional decoder failure'); } });
  assert.ok(Object.values(failed).every(value => value.state === 'failed'));
  const s = createGame({ missionId: 'MI06', seed: 1566 }), record = combatRecorder();
  rendererFor(record).drawDikeControls(s, 4);
  assert.equal(imageCalls(record).length, 0); assert.ok(record.calls.some(call => call.method === 'fill'));
  assert.equal(drawPaintedNacreSitePart(record.ctx, { part: 'panel' }), false);
  assert.throws(() => setPaintedNacreSiteImage('hydraulics', { width: 1, height: 1 }), RangeError);
  clearPaintedNacreSites();
  let release; const wait = new Promise(resolve => { release = resolve; });
  const pending = loadPaintedNacreSiteAssets({ loadImage: async (url, key) => { await wait; return { width: PAINTED_NACRE_SITE_LAYOUT[key].size[0], height: PAINTED_NACRE_SITE_LAYOUT[key].size[1] }; } });
  clearPaintedNacreSites(); release(); await pending;
  assert.ok(Object.values(paintedNacreSiteAssetSnapshot()).every(value => value.state === 'idle'));
});
