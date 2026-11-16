import test from 'node:test';
import assert from 'node:assert/strict';
import { PAINTED_THYR_LAYOUT } from '../src/painted-thyr-layout.mjs';
import { PAINTED_THYR_URLS, setPaintedThyrImage, setPaintedThyrImages, clearPaintedThyr,
  loadPaintedThyr, paintedThyrStatus, paintedThyrFrame, paintedThyrPartFrame,
  paintedThyrFaunaFrame, paintedThyrAttachmentPoints, drawPaintedThyrPart, drawPaintedThyrFauna } from '../src/painted-thyr.mjs';
import { createGame } from '../src/simulation.mjs';
import { ENEMY_TYPES } from '../src/content.mjs';
import { drawLivingRouteSite, drawLivingRouteActors } from '../src/thyr-renderer.mjs';
import { drawVoiceActor } from '../src/voice-renderer.mjs';
import { Renderer } from '../src/renderer.mjs';
import { THYR_ASSET_SPECS } from '../src/thyr-assets.mjs';
import { VOICE_ASSET_SPECS } from '../src/voice-assets.mjs';
import { combatRecorder } from './helpers/combat-render-recorder.mjs';

const standIns = () => Object.fromEntries(Object.keys(PAINTED_THYR_URLS).map(key => [key,
  { atlasKey: key, width: PAINTED_THYR_LAYOUT[key].size[0], height: PAINTED_THYR_LAYOUT[key].size[1] }]));
const imageCalls = record => record.calls.filter(call => call.method === 'drawImage');
const frameName = call => Object.entries(PAINTED_THYR_LAYOUT[call.args[0].atlasKey].frames)
  .find(([, frame]) => frame.source.every((value, i) => value === call.args[i + 1]))?.[0];
const near = (a, b) => assert.ok(Math.abs(a - b) < .0001, `${a} != ${b}`);
function rendererFor(record, values = {}) {
  const renderer = Object.create(Renderer.prototype);
  Object.assign(renderer, { ctx: record.ctx, cameraX: 0, width: 1600, height: 900, panoramaReady: false,
    lastGame: null, combatReducedMotion: false, prepare() {}, visible: () => true, ...values });
  return renderer;
}
function predator(values = {}) {
  return { ...ENEMY_TYPES.fauna, type: 'fauna', id: 'paint-test-fauna', x: 500, y: 500, facing: 1,
    active: true, hp: ENEMY_TYPES.fauna.hp, maxHp: ENEMY_TYPES.fauna.hp, flash: 0, phase: 'idle', ...values };
}

test.afterEach(() => clearPaintedThyr());

test('every promised Thyr state can actually draw, including second-row damage variants', () => {
  setPaintedThyrImages(standIns());
  for (const part of ['column', 'root', 'suspended-home', 'longuedorse-adult', 'longuedorse-young',
    'fan-colony', 'breathing-vine', 'echo-grass', 'leth-interpreter']) {
    const spec = THYR_ASSET_SPECS[part] || VOICE_ASSET_SPECS[part];
    for (const state of spec.states) for (const progress of [0, .3, .6, .9]) for (const variant of part === 'column' ? [0, 1] : [0]) {
      const record = combatRecorder(), options = { part, state, progress, variant, x: 250, y: 700 };
      assert.ok(drawPaintedThyrPart(record.ctx, options), `${part}/${state}/${variant}/${progress}: an indexed state must not silently fall back`);
      assert.equal(imageCalls(record).length, 1); assert.ok(record.balanced());
      const target = imageCalls(record)[0].args.slice(5);
      assert.ok(target.every(Number.isFinite) && target[2] > 0 && target[3] > 0, `${part}/${state}: usable positive image extent`);
    }
  }
});

test('Thyr scene renders exactly its existing beings and props with state-specific images, without changing facts', () => {
  setPaintedThyrImages(standIns());
  const s = createGame({ missionId: 'MI09', walkerId: 'WK01', seed: 1554 });
  const before = JSON.stringify(s), record = combatRecorder(), renderer = rendererFor(record);
  drawLivingRouteSite(renderer, s, 0); drawLivingRouteActors(renderer, s, 0);
  assert.equal(JSON.stringify(s), before);
  const drawings = imageCalls(record), count = key => drawings.filter(call => call.args[0].atlasKey === key).length;
  assert.equal(count('longuedorse-adult'), 2); assert.equal(count('longuedorse-young'), 2);
  assert.equal(count('column'), s.livingRoute.columns.length);
  assert.equal(count('habitat'), s.livingRoute.roots.length + s.livingRoute.homes.length);
  assert.equal(count('fan-colony'), s.livingRoute.pollinators.length);
  assert.deepEqual(drawings.filter(call => call.args[0].atlasKey === 'column').map(frameName), ['normal', 'normal-alt']);
  for (const home of s.livingRoute.homes) {
    const points = paintedThyrAttachmentPoints({ part: 'suspended-home', state: 'normal', x: home.x, y: home.y + home.h / 2, width: home.w, height: home.h });
    assert.equal(points?.length, 2);
    for (const [x, y] of points) assert.ok(record.calls.some(call => call.method === 'lineTo' && Math.abs(call.args[0] - x) < .0001 && Math.abs(call.args[1] - y) < .0001), 'Both painted ropes connect to the existing column');
  }
  assert.ok(record.balanced());

  // Diagnostic changes receive the domain's existing outcomes; the renderer
  // itself cannot invent an arrival, divert a herd member or erase a loss.
  const copy = structuredClone(s), [a, b, young] = copy.livingRoute.migrators;
  a.destroyed = true; a.moving = false;
  b.phase = 'arrived'; b.moving = false;
  young.phase = 'displaced'; young.moving = false;
  const saved = JSON.stringify(copy), outcomes = combatRecorder();
  drawLivingRouteActors(rendererFor(outcomes), copy, 10);
  assert.equal(JSON.stringify(copy), saved);
  assert.deepEqual(imageCalls(outcomes).filter(call => call.args[0].atlasKey.startsWith('longuedorse')).map(frameName), ['dead', 'arrived', 'diverted', 'waiting']);
  const culled = combatRecorder();
  drawLivingRouteActors(rendererFor(culled, { visible: () => false }), s, 0);
  assert.equal(imageCalls(culled).length, 0);
});

test('Leth renders consent, refusal, speech and loss independently without changing testimony or recruitment', () => {
  setPaintedThyrImages(standIns());
  const initial = createGame({ missionId: 'MI11', walkerId: 'WK01', seed: 1554 });
  const cases = [
    [{}, 'waiting'], [{ met: true }, 'listening'], [{ consent: true }, 'listening'],
    [{ met: true, consent: true, working: true, work: 'testimony' }, 'speaking-0'],
    [{ refused: true }, 'refusing'], [{ withdrawn: true, testimonyRecorded: true }, 'refusing'],
    [{ alive: false, testimonyRecorded: true }, 'lost'],
  ];
  for (const [values, expected] of cases) {
    const s = structuredClone(initial); Object.assign(s.voice.leth, values);
    const before = JSON.stringify(s), record = combatRecorder();
    drawVoiceActor(rendererFor(record), s);
    const drawings = imageCalls(record);
    assert.equal(drawings.length, 1); assert.equal(drawings[0].args[0].atlasKey, 'leth');
    assert.equal(frameName(drawings[0]), expected); assert.equal(JSON.stringify(s), before);
    assert.ok(record.balanced());
  }
});

test('herbivore and predator cycles consume real distance and never walk while blocked, paused or reduced', () => {
  for (const [part, width] of [['longuedorse-adult', 136], ['longuedorse-young', 86]]) {
    const entity = { x: 100, w: width, moving: true }, base = { part, state: 'moving', entity };
    assert.equal(paintedThyrPartFrame({ ...base, time: 0 }).frame, 'waiting');
    const frames = new Set();
    for (let i = 1; i <= 4; i++) {
      entity.x += width * .65 / 4 + .00001;
      const before = JSON.stringify(entity), options = { ...base, time: i / 60 };
      const frame = paintedThyrPartFrame(options).frame; frames.add(frame);
      assert.equal(paintedThyrPartFrame(options).frame, frame, 'Rendering the same paused tick cannot advance a pose');
      assert.equal(JSON.stringify(entity), before);
    }
    assert.equal(frames.size, 4);
    assert.equal(paintedThyrPartFrame({ ...base, time: 5 / 60 }).frame, 'waiting', 'Blocked despite moving intent');
    entity.x += 1;
    assert.equal(paintedThyrPartFrame({ ...base, time: 6 / 60, reducedMotion: true }).frame, 'waiting');
    entity.x += 1000;
    assert.equal(paintedThyrPartFrame({ ...base, time: 7 / 60 }).frame, 'waiting', 'A scene jump is not a stride');
    assert.equal(paintedThyrPartFrame({ ...base, state: 'dead', time: 8 / 60 }).frame, 'dead');
    assert.equal(paintedThyrPartFrame({ ...base, state: 'arrived', time: 9 / 60 }).frame, 'arrived');
  }
  const e = predator(), frames = new Set();
  assert.equal(paintedThyrFaunaFrame(e, { time: 0 }).frame, 'idle');
  for (let i = 1; i <= 8; i++) {
    e.x += e.w * .65 / 8 + .00001;
    const before = JSON.stringify(e); frames.add(paintedThyrFaunaFrame(e, { time: i / 60 }).frame);
    assert.equal(JSON.stringify(e), before);
  }
  assert.equal(frames.size, 8);
  assert.equal(paintedThyrFaunaFrame(e, { time: 9 / 60 }).frame, 'idle');
  e.phase = 'attack'; e.telegraph = .4;
  assert.equal(paintedThyrFaunaFrame(e, { time: 10 / 60 }).frame, 'windup');
  e.telegraph = .9;
  assert.equal(paintedThyrFaunaFrame(e, { time: 11 / 60 }).frame, 'attack');
  e.active = false;
  assert.equal(paintedThyrFaunaFrame(e, { time: 12 / 60 }).frame, 'idle');
  clearPaintedThyr();
  const still = predator(), first = combatRecorder(), later = combatRecorder();
  rendererFor(first).drawEnemy(still, { planetId: 'PL03', elapsed: 0 }, 0);
  rendererFor(later).drawEnemy(still, { planetId: 'PL03', elapsed: 1 }, 1);
  assert.deepEqual(later.calls.filter(call => call.method === 'lineTo').map(call => call.args),
    first.calls.filter(call => call.method === 'lineTo').map(call => call.args), 'Vector fallback also keeps stationary feet still');
});

test('mirroring and scaling retain world ground anchors and the predator collision body', () => {
  setPaintedThyrImages(standIns());
  const original = JSON.stringify(PAINTED_THYR_LAYOUT);
  for (const [part, width, height] of [['column', 92, 470], ['root', 340, 28], ['suspended-home', 160, 110],
    ['longuedorse-adult', 136, 94], ['longuedorse-young', 86, 64], ['fan-colony', 112, 78],
    ['breathing-vine', 120, 145], ['echo-grass', 90, 78], ['leth-interpreter', 94, 144]]) for (const facing of [-1, 1]) {
    const record = combatRecorder(), input = { part, x: 275, y: 640, width: width * 1.3, height: height * .8, scale: .7, facing };
    const saved = JSON.stringify(input);
    assert.ok(drawPaintedThyrPart(record.ctx, input));
    const call = imageCalls(record)[0], ground = record.point(call, [0, 0]);
    near(ground[0], 275); near(ground[1], 640);
    near(call.matrix[0], 1.3 * .7 * facing); near(call.matrix[3], .8 * .7);
    assert.equal(JSON.stringify(input), saved); assert.ok(record.balanced());
  }
  for (const facing of [-1, 1]) {
    const e = predator({ facing }), before = JSON.stringify(e), record = combatRecorder();
    assert.ok(drawPaintedThyrFauna(record.ctx, e));
    const call = imageCalls(record)[0], centre = record.point(call, [0, 0]);
    near(centre[0], e.x); near(centre[1], e.y); near(call.matrix[0], facing); near(call.matrix[3], 1);
    assert.equal(JSON.stringify(e), before);
  }
  const access = paintedThyrFrame('longuedorse-adult', 'waiting'); access.source[0] = -999; access.target[0] = -999;
  if (access.anchors) access.anchors.ground = [99, 99];
  assert.equal(JSON.stringify(PAINTED_THYR_LAYOUT), original);
  for (const state of ['normal', 'damaged']) {
    const frame = paintedThyrFrame('habitat', `home-${state}`);
    assert.equal(frame.anchors.sourceSuspensions.length, 2);
    for (const [i, source] of frame.anchors.sourceSuspensions.entries()) {
      const local = [frame.target[0] + (source[0] - frame.source[0]) * frame.target[2] / frame.source[2],
        frame.target[1] + (source[1] - frame.source[1]) * frame.target[3] / frame.source[3]];
      near(local[0], frame.anchors.suspensions[i][0]); near(local[1], frame.anchors.suspensions[i][1]);
      const world = paintedThyrAttachmentPoints({ part: 'suspended-home', state, x: 500, y: 640, width: 320, height: 55, facing: -1 });
      near(world[i][0], 500 - local[0] * 2); near(world[i][1], 640 + local[1] * .5);
    }
  }
});

test('dead predators stay absent in normal rendering; reference cells never add beings or separate tools', () => {
  setPaintedThyrImages(standIns());
  assert.equal(paintedThyrFaunaFrame(predator({ dead: true })), null);
  assert.equal(paintedThyrFaunaFrame(predator({ hp: 0 })), null);
  assert.equal(paintedThyrPartFrame({ part: 'leth-interpreter', state: 'recorder' }), null);
  assert.equal(paintedThyrPartFrame({ part: 'echo-grass', state: 'flattened' }), null);
  assert.equal(paintedThyrPartFrame({ part: 'longuedorse-adult', state: 'revived' }), null);
  const s = createGame({ missionId: 'op03', walkerId: 'WK01', seed: 1554 }), record = combatRecorder();
  for (const enemy of s.enemies) if (enemy.type === 'fauna') enemy.dead = true;
  const before = JSON.stringify(s); rendererFor(record).render(s, { reducedMotion: true });
  assert.equal(imageCalls(record).filter(call => call.args[0].atlasKey === 'rootwatcher').length, 0);
  assert.equal(JSON.stringify(s), before);
});

test('decode errors fall back independently, reject wrong dimensions and ignore obsolete loads', async () => {
  const failed = await loadPaintedThyr({ loadImage: async () => { throw new Error('Controlled decoder failure'); } });
  assert.equal(Object.keys(failed).length, 8); assert.ok(Object.values(failed).every(status => status.state === 'failed'));
  const s = createGame({ missionId: 'MI09', walkerId: 'WK01', seed: 1554 }), record = combatRecorder();
  drawLivingRouteSite(rendererFor(record), s, 0); drawLivingRouteActors(rendererFor(record), s, 0);
  assert.equal(imageCalls(record).length, 0); assert.ok(record.calls.some(call => call.method === 'fill'));
  assert.ok(record.balanced());
  assert.throws(() => setPaintedThyrImage('not-an-atlas', { width: 1, height: 1 }), RangeError);
  assert.throws(() => setPaintedThyrImage('leth', { width: 0, height: 0 }), TypeError);
  assert.throws(() => setPaintedThyrImage('leth', { width: 1, height: 1 }), RangeError);
  clearPaintedThyr();
  let release; const deferred = new Promise(resolve => { release = resolve; });
  const pending = loadPaintedThyr({ loadImage: (_, key) => key === 'leth' ? deferred : Promise.reject(new Error('Absent')) });
  clearPaintedThyr(); release(standIns().leth); await pending;
  assert.ok(Object.values(paintedThyrStatus()).every(status => status.state === 'idle'));
  setPaintedThyrImage('longuedorse-adult', standIns()['longuedorse-adult']);
  const mixed = combatRecorder(); drawLivingRouteActors(rendererFor(mixed), s, 0);
  assert.equal(imageCalls(mixed).length, 2, 'Only the decoded adult atlas opts in; young retain vectors');
  setPaintedThyrImages(standIns());
  const broken = combatRecorder(); broken.ctx.drawImage = () => { throw new Error('Bitmap became unavailable after decode'); };
  assert.equal(drawPaintedThyrPart(broken.ctx, { part: 'leth-interpreter', x: 500, y: 620, facing: -1 }), false);
  assert.ok(broken.balanced(), 'Failed painting must restore the canvas before vector fallback');
  assert.equal(paintedThyrStatus().leth.state, 'failed');
  assert.equal(drawPaintedThyrFauna(broken.ctx, predator()), false); assert.ok(broken.balanced());
  assert.equal(paintedThyrStatus().rootwatcher.state, 'failed');
});
