import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS } from '../src/content.mjs';
import { createGame, updateGame, commandGame } from '../src/simulation.mjs';
import {
  CAMPAIGN_SAVE_KEY, CAMPAIGN_BACKUP_KEY, CAMPAIGN_SAVE_VERSION,
  createCampaign, readCampaign, writeCampaign, serializeCampaign, parseCampaign,
  beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission,
  campaignRepairCost, serviceCampaignWalker, repairCampaignPipe,
} from '../src/campaign.mjs';

const copy = value => JSON.parse(JSON.stringify(value));

function memoryStorage() {
  const data = new Map();
  return {
    data, failKey: null, blocked: false,
    getItem(key) { if (this.blocked) throw new Error('Denied'); return data.get(key) ?? null; },
    setItem(key, value) { if (this.blocked || this.failKey === key) throw new Error('Quota exceeded'); data.set(key, String(value)); },
  };
}

function playCampaign({ secure = true, choice = 'defy', walkerId = 'WK01', stopAtDecision = false, capture = false } = {}) {
  const begun = beginCampaignMission(createCampaign(), { walkerId, difficulty: 'normal', seed: 1942 });
  let campaign = begun.campaign;
  const game = begun.game;
  for (let frame = 0; frame < 24000 && game.status === 'playing'; frame++) {
    if (game.decision.active) {
      campaign = checkpointCampaign(campaign, game, { beforeDecision: true });
      if (stopAtDecision) return { campaign, game };
      commandGame(game, 'choice', choice);
    }
    const p = game.player, scene = game.campaign;
    const target = game.enemies.filter(enemy => !enemy.dead && enemy.active && Math.abs(enemy.x - p.x) < 1050)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    let destination = !scene.filtersDelivered ? game.mission.deliveryX + 200 : !scene.manifestRead ? game.evidence.x : !game.decision.resolved ? game.mission.decisionX : game.extraction.x;
    if (secure && !scene.passageSecured && scene.pipeIntact) destination = game.mission.passage.stationX;
    let move = Math.abs(destination - p.x) > 50 ? Math.sign(destination - p.x) : 0;
    if (target && Math.abs(target.x - p.x) < 680) move = 0;
    if (secure && !scene.passageSecured && scene.pipeIntact && Math.abs(p.x - game.mission.passage.stationX) < 80) {
      commandGame(game, 'interact'); move = 0;
    }
    if (scene.filtersDelivered && !scene.manifestRead && Math.abs(p.x - game.evidence.x) < 190) {
      if (!game.evidence.scanning) commandGame(game, 'interact');
      move = 0;
    }
    if (scene.manifestRead && !game.decision.resolved && Math.abs(p.x - game.mission.decisionX) < 250) {
      commandGame(game, 'interact'); move = 0;
    }
    if (game.convoy && !game.convoy.arrived && p.x > game.convoy.x + 360 && move > 0) move = 0;
    const vent = p.heat > 75 || p.overheated;
    updateGame(game, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent,
      secondary: Boolean(target) && !vent && target.hp > 160, aimX: target?.x, aimY: target?.y });
    if (capture && frame % 120 === 0 && game.status === 'playing') {
      campaign = parseCampaign(serializeCampaign(checkpointCampaign(campaign, game)));
    }
  }
  assert.equal(game.status, 'won', `public-controls pilot failed: ${JSON.stringify(game.objectives)}`);
  return { campaign, game };
}

test('fresh dossier roundtrips without granting campaign results or knowledge', () => {
  const campaign = createCampaign();
  assert.deepEqual(parseCampaign(serializeCampaign(campaign)), campaign);
  assert.equal(campaign.resources.parts, 6);
  assert.deepEqual(campaign.completed, {});
  assert.equal(campaign.world.vesper.filtersDelivered, false);
  assert.equal(campaign.lastDebrief, null);
  assert.equal(restoreCampaignGame(campaign), null);
  assert.equal(Object.hasOwn(campaign, 'karma'), false);
  assert.equal(serializeCampaign(campaign).includes('PALINODE'), false);
});

test('public commands produce a save that resumes identical motion, RNG, projectiles and objectives', () => {
  for (const walker of WALKERS) {
    const started = beginCampaignMission(createCampaign(), { walkerId: walker.id, seed: 42 });
    const game = started.game;
    for (let i = 0; i < 1300; i++) updateGame(game, 1 / 60, { move: 1, fire: i % 40 < 5, aimX: 1900, aimY: 640 });
    assert.equal(game.status, 'playing');
    const saved = parseCampaign(serializeCampaign(checkpointCampaign(started.campaign, game)));
    const resumed = restoreCampaignGame(saved);
    assert.deepEqual(resumed, copy(game));
    for (let i = 0; i < 180; i++) {
      const input = { move: i < 90 ? -1 : 1, brace: i >= 90, fire: i % 30 < 6, aimX: 1900, aimY: 640, vent: i > 120 };
      updateGame(game, 1 / 60, input); updateGame(resumed, 1 / 60, input);
    }
    assert.deepEqual(copy(resumed), copy(game));
  }
});

test('before-decision checkpoint survives later autosaves and restores the unresolved administrative choice', () => {
  const { campaign, game } = playCampaign({ stopAtDecision: true });
  const before = serializeCampaign(campaign);
  assert.equal(campaign.preDecisionCheckpoint.decision.active, true);
  commandGame(game, 'choice', 'defy');
  updateGame(game, 1 / 60, { move: 1 });
  const later = checkpointCampaign(campaign, game);
  assert.equal(later.checkpoint.decision.choice, 'defy');
  assert.deepEqual(later.preDecisionCheckpoint, parseCampaign(before).preDecisionCheckpoint);
  const rewind = restoreCampaignGame(parseCampaign(serializeCampaign(later)), { beforeDecision: true });
  assert.equal(rewind.decision.choice, null);
  assert.equal(rewind.decision.active, true);
  assert.equal(commandGame(rewind, 'choice', 'obey'), true);
  assert.equal(rewind.campaign.noticeFiled, false);
});

test('real completion posts one delivery and preserves choice, pipe damage, crew responses and workshop costs', () => {
  const { campaign, game } = playCampaign({ secure: false, choice: 'defy', capture: true });
  const result = finishCampaignMission(campaign, game);
  assert.equal(result.applied, true);
  const saved = parseCampaign(serializeCampaign(result.campaign));
  assert.equal(saved.stage, 'complete');
  assert.equal(saved.resources.parts, 10);
  assert.equal(saved.world.vesper.filtersDeliveredCount, 24);
  assert.equal(saved.world.vesper.pipeIntact, false);
  assert.equal(saved.world.vesper.servicesInterrupted, true);
  assert.equal(saved.world.vesper.noticeFiled, true);
  assert.equal(saved.lastDebrief.pipeRepairCost, 2);
  assert.match(saved.lastDebrief.tessLine, /conduite/);
  assert.match(saved.lastDebrief.samiLine, /Cales-Basses/);
  assert.equal(game.stats.evidence, 0);
  assert.equal(restoreCampaignGame(saved), null);
  assert.equal(restoreCampaignGame(saved, { beforeDecision: true }), null);
  const duplicate = finishCampaignMission(saved, game);
  assert.equal(duplicate.applied, false);
  assert.deepEqual(duplicate.campaign, saved);

  const repaired = repairCampaignPipe(saved);
  assert.equal(repaired.ok, true);
  assert.equal(repaired.cost, 2);
  assert.equal(repaired.campaign.resources.parts, 8);
  assert.equal(repaired.campaign.world.vesper.pipeRepaired, true);
  assert.equal(repaired.campaign.world.vesper.servicesInterrupted, false);
  assert.equal(repaired.campaign.completed.MI01.pipeIntact, false, 'maintenance cannot rewrite the incident');
  assert.equal(repairCampaignPipe(repaired.campaign).ok, false);
  assert.deepEqual(parseCampaign(serializeCampaign(repaired.campaign)), repaired.campaign);
});

test('workshop repair uses finite stock, restores hull and joints, and cannot be repeated for profit', () => {
  // A workshop condition fixture exercises inventory boundaries independently
  // of the perfect-aim completion pilot, which can finish with no damage.
  const damaged = createCampaign();
  damaged.fleet.WK01.hull = WALKERS[0].hull * 0.75;
  damaged.fleet.WK01.feet = [75, 75];
  const cost = campaignRepairCost(damaged, 'WK01');
  assert.equal(cost, 2);
  const poor = copy(damaged); poor.resources.parts = 1;
  assert.equal(serviceCampaignWalker(poor, 'WK01').ok, false);
  assert.equal(poor.resources.parts, 1);
  const maintained = serviceCampaignWalker(damaged, 'WK01');
  assert.equal(maintained.ok, true);
  assert.equal(maintained.campaign.resources.parts, 6 - cost);
  assert.equal(maintained.campaign.fleet.WK01.hull, WALKERS[0].hull);
  assert.deepEqual(maintained.campaign.fleet.WK01.feet, [100, 100]);
  assert.equal(campaignRepairCost(maintained.campaign, 'WK01'), 0);
  assert.equal(serviceCampaignWalker(maintained.campaign, 'WK01').ok, false);
  assert.deepEqual(parseCampaign(serializeCampaign(maintained.campaign)), maintained.campaign);
});

test('intact route and standard manifest preserve different concrete dossier facts', () => {
  const { campaign, game } = playCampaign({ secure: true, choice: 'obey' });
  const result = finishCampaignMission(campaign, game);
  assert.equal(result.receipt.pipeIntact, true);
  assert.equal(result.receipt.pipeRepairCost, 0);
  assert.equal(result.receipt.noticeFiled, false);
  assert.equal(result.campaign.world.vesper.servicesInterrupted, false);
  assert.equal(result.campaign.world.vesper.calesBassesExcluded, true);
  assert.equal(repairCampaignPipe(result.campaign).ok, false);
  const replay = beginCampaignMission(result.campaign, { missionId: 'MI01', walkerId: 'WK05' });
  assert.equal(replay.replay, true);
  assert.deepEqual(replay.campaign, result.campaign);
  assert.deepEqual(checkpointCampaign(result.campaign, replay.game, { replay: true }), result.campaign);
  assert.equal(finishCampaignMission(result.campaign, game, { replay: true }).applied, false);
});

test('defeat neither gives supplies nor erases the last live checkpoint', () => {
  const started = beginCampaignMission(createCampaign());
  const campaign = checkpointCampaign(started.campaign, started.game);
  const initial = serializeCampaign(campaign);
  started.game.player.hull = 0;
  updateGame(started.game, 1 / 60);
  assert.equal(started.game.status, 'lost');
  const result = finishCampaignMission(campaign, started.game);
  assert.equal(result.applied, false);
  assert.equal(serializeCampaign(result.campaign), initial);
  assert.equal(result.campaign.resources.parts, 6);
  assert.equal(restoreCampaignGame(result.campaign).status, 'playing');
  assert.deepEqual(checkpointCampaign(campaign, started.game), campaign);
});

test('starting over requires an explicit restart and never repairs an in-flight walker', () => {
  const initial = createCampaign();
  const first = beginCampaignMission(initial);
  const accidental = beginCampaignMission(first.campaign);
  assert.equal(accidental.ok, false);
  assert.equal(serviceCampaignWalker(first.campaign, 'WK01').ok, false);
  const retry = beginCampaignMission(first.campaign, { restart: true, walkerId: 'WK09' });
  assert.equal(retry.ok, true);
  assert.equal(retry.game.walkerId, 'WK09');
  assert.equal(retry.game.elapsed, 0);
  assert.equal(retry.campaign.preDecisionCheckpoint, null);
  assert.equal(initial.stage, 'hangar', 'transitions must not mutate their input');
});

test('atomic primary writes retain the last valid dossier across quota failures and corruption', () => {
  const storage = memoryStorage();
  const initial = createCampaign();
  assert.equal(writeCampaign(storage, initial).ok, true);
  const started = beginCampaignMission(initial);
  storage.failKey = CAMPAIGN_SAVE_KEY;
  assert.equal(writeCampaign(storage, started.campaign).ok, false);
  assert.deepEqual(readCampaign(storage).campaign, initial);
  assert.deepEqual(parseCampaign(storage.getItem(CAMPAIGN_BACKUP_KEY)), initial);
  storage.failKey = null;
  assert.equal(writeCampaign(storage, started.campaign).ok, true);
  assert.equal(readCampaign(storage).source, 'primary');
  storage.data.set(CAMPAIGN_SAVE_KEY, '{broken');
  const recovered = readCampaign(storage);
  assert.equal(recovered.source, 'backup');
  assert.equal(recovered.blocked, false);
  assert.match(recovered.warning, /récupéré/);
  assert.deepEqual(recovered.campaign, initial);
});

test('a failed backup write preserves the valid primary; denied storage stays explicit', () => {
  const storage = memoryStorage(), initial = createCampaign();
  assert.equal(writeCampaign(storage, initial).ok, true);
  storage.failKey = CAMPAIGN_BACKUP_KEY;
  assert.equal(writeCampaign(storage, beginCampaignMission(initial).campaign).ok, false);
  assert.deepEqual(readCampaign(storage).campaign, initial);
  storage.blocked = true;
  assert.equal(readCampaign(storage).available, false);
  assert.equal(writeCampaign(storage, initial).ok, false);
  assert.equal(readCampaign(null).available, false);
});

test('unsupported or damaged dossiers are not silently overwritten; explicit replacement is possible', () => {
  const storage = memoryStorage();
  const future = createCampaign(); future.version = 99;
  storage.data.set(CAMPAIGN_SAVE_KEY, JSON.stringify(future));
  const result = readCampaign(storage);
  assert.equal(result.blocked, true);
  assert.equal(writeCampaign(storage, createCampaign()).ok, false);
  assert.equal(JSON.parse(storage.data.get(CAMPAIGN_SAVE_KEY)).version, 99);
  assert.equal(writeCampaign(storage, createCampaign(), { replaceInvalid: true }).ok, true);
  assert.equal(readCampaign(storage).blocked, false);
});

test('an older valid backup cannot authorize overwriting a newer primary dossier', () => {
  for (const change of [dossier => { dossier.version = CAMPAIGN_SAVE_VERSION + 1; }, dossier => { dossier.format = 'ordre-de-cendre.campaign-next'; }]) {
    const storage = memoryStorage(), future = createCampaign();
    change(future);
    const protectedText = JSON.stringify(future);
    storage.data.set(CAMPAIGN_SAVE_KEY, protectedText);
    storage.data.set(CAMPAIGN_BACKUP_KEY, serializeCampaign(createCampaign()));
    const result = readCampaign(storage);
    assert.equal(result.source, 'backup');
    assert.equal(result.blocked, true);
    assert.equal(writeCampaign(storage, result.campaign).ok, false);
    assert.equal(storage.data.get(CAMPAIGN_SAVE_KEY), protectedText);
    assert.equal(writeCampaign(storage, createCampaign(), { replaceInvalid: true }).ok, true);
    assert.equal(readCampaign(storage).blocked, false);
  }
});

test('import rejects future versions, foreign IDs, missing arrays, invalid numbers and prototype keys', () => {
  const started = beginCampaignMission(createCampaign());
  const cases = [
    campaign => { campaign.version = CAMPAIGN_SAVE_VERSION + 1; },
    campaign => { campaign.checkpoint.missionId = 'MI99'; },
    campaign => { campaign.checkpoint.walkerId = 'WK99'; },
    campaign => { campaign.checkpoint.difficultyId = 'impossible'; },
    campaign => { delete campaign.checkpoint.enemies; },
    campaign => { campaign.checkpoint.player.feet = []; },
    campaign => { campaign.checkpoint.player.hull = -10; },
    campaign => { campaign.checkpoint.rng = null; },
    campaign => { campaign.checkpoint.walker.damage = 999; },
    campaign => { campaign.checkpoint.particles = [{}]; },
    campaign => { campaign.checkpoint.objectives = [null]; },
    campaign => { campaign.checkpoint.projectiles = [{ team: 'player', type: 'bullet', x: 0, y: 0, prevX: 0, prevY: 0,
      vx: 500, vy: 0, damage: 20, radius: 2, life: 1, trail: [{}] }]; },
    campaign => { campaign.resources.parts = 999; },
    campaign => { campaign.completed.MI99 = {}; },
  ];
  for (const alter of cases) {
    const value = copy(started.campaign); alter(value);
    assert.throws(() => parseCampaign(JSON.stringify(value)), /Sauvegarde invalide/);
  }
  assert.throws(() => parseCampaign('{"__proto__":{"polluted":true}}'), /Sauvegarde invalide/);
  const nonfinite = copy(started.campaign); nonfinite.checkpoint.player.x = Number.NaN;
  assert.throws(() => serializeCampaign(nonfinite), /Sauvegarde invalide/);
  assert.equal(Object.prototype.polluted, undefined);
  assert.throws(() => parseCampaign('[]'), /Sauvegarde invalide/);
  assert.throws(() => parseCampaign('invalid JSON'), /Sauvegarde invalide/);
  assert.throws(() => parseCampaign(' '.repeat(2_000_001)), /Sauvegarde invalide/);
});

test('prototype operations cannot become campaign checkpoints or campaign victories', () => {
  const campaign = beginCampaignMission(createCampaign()).campaign;
  const prototype = createGame({ missionId: 'op01' });
  assert.throws(() => checkpointCampaign(campaign, prototype), /Sauvegarde invalide/);
  prototype.status = 'won';
  assert.throws(() => finishCampaignMission(campaign, prototype), /Sauvegarde invalide/);
});
