import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { WALKERS, PLAYABLE_WALKERS, CORPS_PLAYABLE_WALKERS } from '../src/content.mjs';
import { SENTINELLE_RIG, PRODUCTION_PART_NAMES, productionPartGeometry, productionWalkerParts,
  productionLegPose } from '../src/production-assets.mjs';
import { createGame, updateGame, commandGame, terrainAt, radiatorBounds } from '../src/simulation.mjs';
import { createCampaign, beginCampaignMission, checkpointCampaign, serializeCampaign, parseCampaign,
  restoreCampaignGame, finishCampaignMission, campaignRepairCost, serviceCampaignWalker } from '../src/campaign.mjs';
import { drawWalker } from '../src/renderer.mjs';
import { walkerRecorder } from './helpers/walker-render-recorder.mjs';
import { pilotMI02 } from './helpers/mi02-driver.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const advance = (s, seconds, input = {}) => {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, input);
  return s;
};
const sentinelle = () => createGame({ walkerId: 'WK14', missionId: 'MI01' });

test('WK14 Sentinelle: the seventh playable chassis keeps its design record and production rig', () => {
  assert.deepEqual(WALKERS.map(w => w.id), ['WK01', 'WK02', 'WK05', 'WK06', 'WK09', 'WK10'],
    'The painted 0.15.3 fleet and its fixtures stay unchanged.');
  assert.deepEqual(PLAYABLE_WALKERS.map(w => w.id), ['WK01', 'WK02', 'WK05', 'WK06', 'WK09', 'WK10', 'WK14']);
  const walker = PLAYABLE_WALKERS.at(-1);
  assert.equal(CORPS_PLAYABLE_WALKERS.length, 1);
  assert.deepEqual(walker, CORPS_PLAYABLE_WALKERS[0], 'Assignment and catalogue share one record.');
  for (const key of ['id', 'name', 'designation', 'role', 'profile', 'description', 'weapon', 'strength', 'weakness'])
    assert.ok(typeof walker[key] === 'string' && walker[key].trim(), `WK14 needs ${key}`);
  for (const key of ['legs', 'height', 'width', 'hull', 'stride', 'stepTime', 'speed', 'cooling', 'armor', 'damage', 'fireRate', 'shotHeat', 'ammo', 'rockets', 'weight'])
    assert.ok(Number.isFinite(walker[key]) && walker[key] > 0, `WK14 needs a positive ${key}`);
  assert.equal(walker.legs, 2);
  assert.deepEqual(walker.footOffsets, [-52, 52]);

  assert.equal(SENTINELLE_RIG.id, walker.id);
  assert.equal(SENTINELLE_RIG.legs, walker.legs);
  assert.equal(SENTINELLE_RIG.width, walker.width);
  assert.equal(SENTINELLE_RIG.height, walker.height);
  assert.ok(Math.abs(SENTINELLE_RIG.upper - walker.height * .62) < 1e-9);
  assert.ok(Math.abs(SENTINELLE_RIG.lower - walker.height * .64) < 1e-9);
  assert.deepEqual(SENTINELLE_RIG.offsets, walker.footOffsets, 'Simulation stance and rig hinges agree.');
  assert.ok(SENTINELLE_RIG.footWidth > 0);
});

test('WK14 starts on two real contacts, alternates support groups and respects the published stance', () => {
  const s = sentinelle();
  assert.equal(s.player.feet.length, 2);
  assert.deepEqual(s.player.feet.map(foot => foot.homeOffset), [-52, 52]);
  assert.deepEqual(s.player.feet.map(foot => foot.group), [0, 1]);
  assert.deepEqual(s.player.feet.map(foot => foot.side), ['back', 'front']);
  assert.equal(s.player.width, 138);
  assert.equal(s.player.height, 70);
  for (const foot of s.player.feet) {
    assert.equal(foot.contact, true);
    assert.ok(Math.abs(foot.y - terrainAt(foot.x, s.planetId)) < 1e-9, `${foot.id} stands on the terrain`);
    assert.equal(foot.health, 100);
  }
  assert.equal(s.player.feet[0].x, s.player.x - 52);
  assert.equal(s.player.feet[1].x, s.player.x + 52);

  const manual = createGame({ walkerId: 'WK14', missionId: 'MI01', assist: false });
  const planted = manual.player.feet.map(foot => foot.x);
  advance(manual, 1, { move: 1 });
  assert.deepEqual(manual.player.feet.map(foot => foot.x), planted, 'Uncommanded planted feet never slide');
  assert.equal(commandGame(manual, 'stepA'), true);
  assert.equal(commandGame(manual, 'stepA'), false, 'The lifted foot cannot be commanded twice');
  advance(manual, 0.8, { move: 1 });
  assert.equal(commandGame(manual, 'stepB'), true);
  advance(manual, 0.9, { move: 1 });
  assert.ok(manual.player.x > 300);
  for (const foot of manual.player.feet.filter(foot => foot.phase !== 'swing'))
    assert.ok(Math.abs(foot.y - terrainAt(foot.x, manual.planetId)) < .001, `${foot.id} returns to contact`);
});

test('WK14 walks with the public inputs and keeps every stance foot on the mission terrain', () => {
  for (const missionId of ['MI01', 'MI03']) {
    const s = createGame({ walkerId: 'WK14', missionId });
    for (const enemy of s.enemies) { enemy.dead = true; enemy.hp = 0; enemy.active = false; }
    advance(s, 8, { move: 1 });
    assert.equal(s.status, 'playing', missionId);
    assert.ok(s.player.x > 500, `${missionId}: the Sentinelle advances`);
    for (const foot of s.player.feet) {
      assert.ok(Number.isFinite(foot.x) && Number.isFinite(foot.y));
      if (foot.phase !== 'swing') assert.ok(Math.abs(foot.y - terrainAt(foot.x, s.planetId)) < .001, `${missionId}/${foot.id}: real contact`);
    }
  }
  const braced = createGame({ walkerId: 'WK14', missionId: 'MI01' });
  advance(braced, 2, { move: 1, brace: true });
  assert.equal(braced.player.x, 300);
  assert.equal(braced.player.braced, true);
  assert.equal(commandGame(braced, 'stepA'), false, 'Bracing refuses new step commands');
});

test('WK14 production parts are finite, distinct per layer and consume the authoritative feet', () => {
  const nearIds = new Set();
  for (const part of PRODUCTION_PART_NAMES) {
    const near = productionPartGeometry({ walkerId: 'WK14', part });
    const far = productionPartGeometry({ walkerId: 'WK14', part, back: true });
    for (const geometry of [near, far]) {
      assert.equal(geometry.walkerId, 'WK14');
      assert.deepEqual(geometry.pivot, [0, 0]);
      assert.ok(geometry.size.every(value => value > 0));
      assert.ok(geometry.shapes.length >= 4);
      const visit = value => {
        if (typeof value === 'number') assert.ok(Number.isFinite(value), geometry.id);
        else if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') Object.values(value).forEach(visit);
      };
      visit(geometry.shapes);
    }
    assert.notEqual(sha(JSON.stringify(near.shapes)), sha(JSON.stringify(far.shapes)), `${part}: near and far differ`);
    nearIds.add(near.id);
  }
  assert.equal(nearIds.size, PRODUCTION_PART_NAMES.length);
  assert.deepEqual(productionPartGeometry({ walkerId: 'WK14', part: 'foot' }).size, [SENTINELLE_RIG.footWidth, 18]);
  assert.deepEqual(productionPartGeometry({ walkerId: 'WK14', part: 'hull' }).size, [SENTINELLE_RIG.width, SENTINELLE_RIG.bodyHeight]);
  assert.deepEqual(productionPartGeometry({ walkerId: 'WK14', part: 'turret' }).size, [85, 42]);

  const hull = ['normal', 'damaged', 'repaired', 'braced'].map(state => sha(JSON.stringify(productionPartGeometry({ walkerId: 'WK14', part: 'hull', state }).shapes)));
  assert.equal(new Set(hull).size, 4, 'Hull damage, repair and brace stay visually distinct');
  const radiator = ['normal', 'hit', 'damaged', 'repaired'].map(state => sha(JSON.stringify(productionPartGeometry({ walkerId: 'WK14', part: 'radiator', state }).shapes)));
  assert.equal(new Set(radiator).size, 4, 'Radiator states stay distinct');

  const s = createGame({ walkerId: 'WK14', missionId: 'MI01', seed: 1533 });
  for (let frame = 0; frame < 42; frame++) {
    updateGame(s, 1 / 60, { move: 1 });
    const parts = productionWalkerParts(s.player, s.walker), feet = parts.filter(part => part.part === 'foot');
    assert.equal(feet.length, 2);
    for (const [index, foot] of s.player.feet.entries()) {
      const rendered = feet.find(part => part.name === `${foot.id}-foot`);
      assert.equal(rendered.x, foot.x); assert.equal(rendered.y, foot.y);
      assert.equal(rendered.contact, foot.contact);
      const pose = productionLegPose(s.player, s.walker, foot);
      assert.deepEqual(pose.contact, [foot.x, foot.y]);
      assert.ok(Math.abs(Math.hypot(pose.knee[0] - pose.hip[0], pose.knee[1] - pose.hip[1]) - s.walker.height * .62) < 1e-8);
      assert.equal(parts.find(part => part.name === `${foot.id}-upper`).width, Math.hypot(pose.knee[0] - pose.hip[0], pose.knee[1] - pose.hip[1]));
      assert.ok(index < 2);
    }
    const box = radiatorBounds(s), radiator = parts.find(part => part.part === 'radiator');
    assert.deepEqual([radiator.x, radiator.y, radiator.width, radiator.height], [box.x, box.y, box.w, box.h]);
  }
});

test('WK14 renders through the vector fallback without a painted atlas or state mutation', () => {
  const s = createGame({ walkerId: 'WK14', missionId: 'MI01', seed: 1533 });
  for (let frame = 0; frame < 30; frame++) updateGame(s, 1 / 60, { move: 1 });
  const before = JSON.stringify(s), record = walkerRecorder();
  drawWalker(record.ctx, s.player, s.walker, s.elapsed);
  assert.equal(JSON.stringify(s), before);
  assert.ok(record.balanced(), 'Canvas state is balanced');
  assert.ok(record.calls.some(call => call.method === 'fill'), 'The vector hull and limbs are drawn');
  assert.equal(record.calls.filter(call => call.method === 'drawImage').length, 0, 'No painted atlas is claimed for WK14');
  for (const foot of s.player.feet) {
    const pose = productionLegPose(s.player, s.walker, foot);
    assert.deepEqual(pose.contact, [foot.x, foot.y]);
  }
});

test('WK14 keeps the existing muzzle distance and firing rules', () => {
  const s = createGame({ walkerId: 'WK14', missionId: 'op01', seed: 1533 });
  state: {
    s.enemies.forEach(enemy => { enemy.dead = true; enemy.hp = 0; });
    s.player.stability = 62;
    updateGame(s, 1 / 60, { aimX: s.player.x + 600, aimY: s.player.y - 80, fire: true });
  }
  const shot = s.projectiles.find(item => item.team === 'player');
  assert.ok(shot, 'A public shot is created');
  const angle = Math.atan2(shot.vy, shot.vx), length = 92; // biped muzzle, unchanged
  assert.ok(Math.abs(shot.prevX - (s.player.x + 9 + Math.cos(angle) * length)) < 1e-6);
  assert.ok(Math.abs(shot.prevY - (s.player.y + 8 + Math.sin(angle) * length)) < 1e-6);
  assert.ok(Math.abs(angle - s.player.aimAngle) > 1e-8, 'Existing spread is not replaced');
});

test('WK14 is assigned at campaign start, carried by the save and repairable in the workshop', () => {
  const fresh = createCampaign();
  assert.deepEqual(Object.keys(fresh.fleet), PLAYABLE_WALKERS.map(walker => walker.id));
  assert.deepEqual(fresh.fleet.WK14, { hull: 560, feet: [100, 100], radiator: 100 });

  const damaged = clone(fresh);
  damaged.fleet.WK14 = { hull: 320, feet: [55, 90], radiator: 40 };
  assert.ok(campaignRepairCost(damaged, 'WK14') > 0);
  const serviced = serviceCampaignWalker(damaged, 'WK14');
  assert.equal(serviced.ok, true);
  assert.deepEqual(serviced.campaign.fleet.WK14, { hull: 560, feet: [100, 100], radiator: 100 });

  const started = beginCampaignMission(damaged, { missionId: 'MI01', walkerId: 'WK14', seed: 77 });
  assert.equal(started.ok, true);
  assert.equal(started.game.walkerId, 'WK14');
  assert.equal(started.game.walker.name, 'Sentinelle');
  assert.equal(started.game.player.hull, 320, 'The workshop condition is the starting hull');
  assert.deepEqual(started.game.player.feet.map(foot => foot.health), [55, 90]);
  assert.equal(started.game.player.radiator.health, 40);

  const checkpointed = checkpointCampaign(started.campaign, started.game);
  assert.equal(checkpointed.checkpoint.walkerId, 'WK14');
  const reloaded = parseCampaign(serializeCampaign(checkpointed));
  assert.deepEqual(reloaded.checkpoint, checkpointed.checkpoint);
  assert.deepEqual(restoreCampaignGame(reloaded), started.game);
  assert.deepEqual(reloaded.fleet.WK14, damaged.fleet.WK14, 'The workshop keeps the sortie condition until service');
});

test('saves written before WK14 exist gain the chassis without rewriting their facts', () => {
  const fresh = createCampaign();
  fresh.fleet.WK01.hull = 410;
  fresh.fleet.WK01.feet = [70, 80];
  const historical = clone(fresh);
  delete historical.fleet.WK14;
  const repaired = parseCampaign(JSON.stringify(historical));
  assert.deepEqual(Object.keys(repaired.fleet).sort(), WALKERS.map(walker => walker.id).sort(), 'Reading an old fleet does not rewrite it');
  assert.equal(Object.hasOwn(repaired.fleet, 'WK14'), false);
  assert.deepEqual(repaired.fleet.WK01, fresh.fleet.WK01, 'Existing damage is preserved');
  assert.equal(repaired.revision, fresh.revision);

  // Assignment is the documented entry point: the chassis joins the fleet intact
  // and only then is its condition saved.
  const assigned = beginCampaignMission(repaired, { missionId: 'MI01', walkerId: 'WK14', seed: 77 });
  assert.equal(assigned.ok, true);
  assert.deepEqual(assigned.campaign.fleet.WK14, { hull: 560, feet: [100, 100], radiator: 100 });
  assert.deepEqual(assigned.campaign.fleet.WK01, fresh.fleet.WK01, 'The historical condition is untouched');
  const persisted = parseCampaign(serializeCampaign(assigned.campaign));
  assert.deepEqual(persisted.fleet.WK14, assigned.campaign.fleet.WK14);

  const history = JSON.parse(readFileSync(new URL('./fixtures/campaign-v2-mi02.json', import.meta.url), 'utf8'));
  const migrated = parseCampaign(JSON.stringify(history.completed));
  assert.equal(Object.hasOwn(migrated.fleet, 'WK14'), false, 'A v2 dossier keeps its exact historical fleet');
  assert.deepEqual(migrated.completed, history.completed.completed, 'The historical report is not regenerated');
  assert.equal(migrated.revision, history.completed.revision);
});

test('a complete WK14 sortie produces a campaign receipt the dossier accepts', () => {
  // This fixture stops after MI01, so the sentinelle's MI02 report is a real new sortie.
  const history = JSON.parse(readFileSync(new URL('./fixtures/campaign-v1-mi01.json', import.meta.url), 'utf8'));
  const campaign = parseCampaign(JSON.stringify(history.completed));
  const started = beginCampaignMission(campaign, { missionId: 'MI02', walkerId: 'WK14', difficulty: 'normal', seed: 231 });
  assert.equal(started.ok, true);
  const { game } = started;
  assert.equal(game.walkerId, 'WK14');
  pilotMI02(game);
  assert.equal(game.status, 'won', 'The Sentinelle can complete the train dossier with public controls');
  const finished = finishCampaignMission(started.campaign, game);
  assert.equal(finished.applied, true);
  const receipt = finished.campaign.completed.MI02;
  assert.equal(receipt.walkerId, 'WK14');
  assert.match(receipt.walkerName, /S-3 Sentinelle/);
  assert.equal(receipt.hull, game.player.hull);
  const reloaded = parseCampaign(serializeCampaign(finished.campaign));
  assert.deepEqual(reloaded.completed.MI02, receipt);
});

test('the Sentinelle production lot ships checksummed SVG parts, assemblies and contact authority', () => {
  const manifest = JSON.parse(readFileSync(new URL('../assets/production/sentinelle/manifest.json', import.meta.url)));
  assert.equal(manifest.rigs.length, 1);
  assert.equal(manifest.counts.rigs, 1);
  assert.equal(manifest.counts.parts, PRODUCTION_PART_NAMES.length);
  assert.equal(manifest.counts.assemblies, 6);
  assert.equal(manifest.files.length, manifest.counts.files);
  assert.equal(manifest.counts.svg, manifest.files.filter(file => file.format === 'svg').length);
  assert.equal(new Set(manifest.files.map(file => file.file)).size, manifest.files.length);
  for (const file of manifest.files) {
    const bytes = readFileSync(new URL(`../${file.file}`, import.meta.url));
    assert.equal(bytes.length, file.bytes, file.file);
    assert.equal(sha(bytes), file.sha256, file.file);
    assert.ok(file.assets.length, `${file.file} cites its source assets`);
    if (file.format === 'svg') {
      const text = bytes.toString();
      assert.ok(text.includes('xmlns="http://www.w3.org/2000/svg"'));
      assert.ok(!text.includes('<image') && !text.includes('<script') && !text.includes('xlink:href'));
      assert.ok(!text.includes('NaN') && !text.includes('Infinity'), file.file);
      const ids = [...text.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      assert.equal(new Set(ids).size, ids.length, `${file.file}: unique local ids`);
    }
  }
  const rig = manifest.rigs[0];
  assert.equal(rig.id, 'WK14');
  assert.equal(rig.playable, true);
  assert.deepEqual(rig.offsets, [-52, 52]);
  assert.equal(rig.parts.length, PRODUCTION_PART_NAMES.length);
  assert.equal(rig.footInstances.length, 2);
  assert.deepEqual(rig.footInstances.map(foot => foot.homeOffset), [-52, 52]);
  for (const foot of rig.footInstances) assert.equal(foot.contactAuthority, 'player.feet[index]');
  for (const pose of rig.poses) {
    assert.equal(pose.feet.length, 2);
    assert.ok(pose.feet.some(foot => foot.contact), `${pose.pose}: at least one support foot`);
    for (const foot of pose.feet) {
      // The recorded walk snapshot can legitimately hold one swinging foot;
      // every other pose is a planted diagnostic.
      if (pose.pose !== 'walk') assert.equal(foot.contact, true, `${pose.pose}/${foot.id}`);
      assert.ok(Number.isFinite(foot.x) && Number.isFinite(foot.y));
    }
  }
  assert.equal(sha(readFileSync(new URL('../src/production-assets.mjs', import.meta.url))), manifest.sourceSha256);
  assert.equal(sha(readFileSync(new URL('../src/content.mjs', import.meta.url))), manifest.contentSha256);
});
