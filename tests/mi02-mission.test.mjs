import test from 'node:test';
import assert from 'node:assert/strict';
import { WALKERS, CAMPAIGN_MISSIONS } from '../src/content.mjs';
import { createGame, commandGame, updateGame } from '../src/simulation.mjs';
import { pilotMI02 } from './helpers/mi02-driver.mjs';

function advance(s, seconds, input = {}) {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) updateGame(s, 1 / 60, input);
}

test('MI02 declares a separate moving train and carries the actual Vesper dossier without PALINODE knowledge', () => {
  assert.deepEqual(CAMPAIGN_MISSIONS.map(mission => mission.id), ['MI01', 'MI02', 'MI03', 'MI04', 'MI05', 'MI06', 'MI07', 'MI08']);
  const context = { pipeIntact: false, pipeRepaired: true, servicesInterrupted: false, noticeFiled: true };
  const s = createGame({ missionId: 'MI02', campaignContext: context });
  assert.equal(s.convoy, null);
  assert.equal(s.train.harpoons.length, 2);
  assert.equal(s.train.wagons.length, 2);
  assert.equal(s.campaign.hostagesTotal, 8);
  assert.deepEqual(s.campaign.context, context);
  assert.match(s.events.map(item => item.text).join(' '), /raccords sont posés/);
  assert.match(s.events.map(item => item.text).join(' '), /copie de ton signalement/);
  assert.equal(s.stats.evidence, 0);
  assert.equal(JSON.stringify(s).includes('PALINODE'), false);
  assert.equal(Object.hasOwn(createGame({ missionId: 'MI01' }), 'train'), false, 'MI01 v1 snapshot shape stays unchanged');
  assert.equal(commandGame(s, 'interact'), false);
  assert.equal(commandGame(s, 'choice', 'defy'), false);
});

test('all six walkers complete both MI02 report choices through public commands with every hostage alive', () => {
  for (const walker of WALKERS) for (const choice of ['obey', 'defy']) {
    const s = createGame({ missionId: 'MI02', walkerId: walker.id, difficulty: 'normal', seed: 1847 });
    pilotMI02(s, { choice });
    assert.equal(s.status, 'won', `${walker.id}/${choice}: ${JSON.stringify({ x: s.player.x, hp: s.player.hull, train: s.train, objectives: s.objectives })}`);
    assert.equal(s.campaign.harpoonsReleased, 2);
    assert.equal(s.train.stopped, true);
    assert.ok(s.train.x < s.train.breakX);
    assert.equal(s.campaign.hostagesRescued, 8);
    assert.equal(s.campaign.hostagesLost, 0);
    assert.equal(s.campaign.rescueResolved, true);
    assert.equal(s.campaign.manifestRead, true);
    assert.equal(s.campaign.evidencePreserved, true);
    assert.equal(s.campaign.recordFiled, choice === 'defy');
    assert.equal(s.campaign.phase, 'complete');
    assert.equal(s.stats.evidence, 0);
    assert.ok(s.stats.kills > 0);
    assert.ok(s.objectives.every(objective => objective.complete));
    const before = structuredClone(s);
    assert.equal(commandGame(s, 'choice', choice === 'defy' ? 'obey' : 'defy'), false);
    updateGame(s, 0.05, { move: -1, fire: true });
    assert.deepEqual(s, before, 'a completed train result is immutable');
  }
});

test('harpoons require proximity and time; a partial release cancels when the pilot leaves', () => {
  const s = createGame({ missionId: 'MI02', walkerId: 'WK05' });
  pilotMI02(s, { stopAt: state => state.player.x > 745 });
  assert.equal(commandGame(s, 'interact'), true);
  advance(s, 0.2, { brace: true });
  assert.equal(s.campaign.harpoonsReleased, 0);
  assert.equal(s.train.moving, false);
  assert.equal(s.train.x, s.mission.train.startX);
  // Leave through real locomotion; no state edits.
  advance(s, 7, { move: -1 });
  assert.equal(s.train.harpoons[0].working, false);
  assert.equal(s.train.harpoons[0].progress, 0);
  assert.equal(s.train.harpoons[0].released, false);
  assert.equal(s.train.x, s.mission.train.startX);
});

test('MI02 cannot open the wagon, read the manifest, or approve a report while the train runs', () => {
  const s = createGame({ missionId: 'MI02' });
  pilotMI02(s, { stopAt: state => state.train.moving });
  assert.equal(s.campaign.harpoonsReleased, 2);
  assert.equal(s.campaign.rescueResolved, false);
  assert.equal(s.campaign.manifestRead, false);
  assert.equal(s.evidence.collected, false);
  assert.equal(s.extraction.active, false);
  assert.equal(commandGame(s, 'choice', 'defy'), false);
  assert.equal(s.train.brakeProgress, 0);
  pilotMI02(s, { stopAt: state => state.train.brakeWorking && state.train.brakeProgress > 0.1 });
  assert.equal(s.train.stopped, false);
  advance(s, 4, { move: -1 });
  assert.equal(s.train.brakeWorking, false);
  assert.equal(s.train.brakeProgress, 0);
  assert.equal(s.train.stopped, false);
});

test('a train that reaches the broken rail ends the attempt without granting a campaign result', () => {
  const s = createGame({ missionId: 'MI02' });
  pilotMI02(s, { brake: false });
  assert.equal(s.status, 'lost');
  assert.match(s.outcome, /rupture du viaduc/);
  assert.equal(s.train.destroyed, true);
  assert.equal(s.campaign.trainIntegrity, 0);
  assert.equal(s.campaign.hostagesLost, 8);
  assert.equal(s.campaign.hostagesRescued, 0);
  assert.equal(s.extraction.active, false);
  assert.equal(s.decision.resolved, false);
});

test('running-train save state resumes with identical physics, passengers, RNG and objective progress', () => {
  const original = createGame({ missionId: 'MI02', seed: 71, walkerId: 'WK09' });
  pilotMI02(original, { stopAt: state => state.train.brakeWorking && state.train.brakeProgress > 0.2 });
  const restored = JSON.parse(JSON.stringify(original));
  for (const state of [original, restored]) pilotMI02(state);
  assert.equal(original.status, 'won');
  assert.deepEqual(restored, original);
});

test('MI01 consequences distinguish intact, repaired and interrupted services and the signed notice', () => {
  const contexts = [
    { pipeIntact: true, pipeRepaired: false, servicesInterrupted: false, noticeFiled: false },
    { pipeIntact: false, pipeRepaired: true, servicesInterrupted: false, noticeFiled: true },
    { pipeIntact: false, pipeRepaired: false, servicesInterrupted: true, noticeFiled: true },
  ];
  const narratives = contexts.map(context => {
    const s = createGame({ missionId: 'MI02', campaignContext: context });
    const text = s.events.map(event => event.text).join(' ');
    pilotMI02(s);
    assert.equal(s.status, 'won');
    assert.deepEqual(s.campaign.context, context);
    return text;
  });
  assert.equal(new Set(narratives).size, contexts.length);
  assert.match(narratives[2], /attend toujours ses raccords/);
  assert.match(narratives[0], /attend toujours une réponse/);
});

test('two real rockets into the hostage wagon cause irreversible deaths and destroy the sale record', () => {
  const s = createGame({ missionId: 'MI02' });
  pilotMI02(s, { stopAt: state => state.train.stopped });
  const wagon = s.train.wagons.find(item => item.kind === 'hostages');
  while (s.player.x > wagon.x - 260 && s.status === 'playing') updateGame(s, 1 / 60, { move: -1 });
  const initialRockets = s.player.rockets;
  advance(s, 1.6, { brace: true, secondary: true, aimX: wagon.x, aimY: wagon.y });
  advance(s, 0.5, { brace: true });
  assert.equal(s.player.rockets, initialRockets - 2);
  assert.equal(wagon.hp, 30);
  assert.equal(s.campaign.hostagesLost, 7);
  assert.equal(s.campaign.evidencePreserved, false);
  assert.equal(s.campaign.manifestRead, false);
  assert.equal(s.campaign.rescueResolved, false);
  assert.equal(s.stats.collateral, 7);
  pilotMI02(s, { choice: 'defy' });
  assert.equal(s.status, 'won');
  assert.equal(s.campaign.hostagesRescued, 1);
  assert.equal(s.campaign.hostagesLost, 7);
  assert.equal(s.campaign.evidencePreserved, false);
  assert.equal(s.campaign.recordFiled, true);
  assert.equal(s.stats.evidence, 0);
  assert.match(s.decision.body, /constatations ne remplacent pas cette preuve/);
  assert.match(s.outcome, /Un ouvrier secouru, 7 décès constatés/);
});

test('a ground explosion can damage the wagon without a direct hit, while rescued workers stay sheltered', () => {
  const s = createGame({ missionId: 'MI02' });
  pilotMI02(s, { stopAt: state => state.train.stopped });
  const wagon = s.train.wagons.find(item => item.kind === 'hostages');
  while (s.player.x > wagon.x - 330 && s.status === 'playing') updateGame(s, 1 / 60, { move: -1 });
  const oldHp = wagon.hp;
  advance(s, 0.9, { brace: true, secondary: true, aimX: wagon.x - 135, aimY: 720 });
  assert.ok(wagon.hp < oldHp && wagon.hp > oldHp - 100, 'nearby blast damages the wagon without the 165-damage direct hit');
  pilotMI02(s, { stopAt: state => state.decision.active });
  const rescued = s.campaign.hostagesRescued;
  const preserved = s.campaign.evidencePreserved;
  const frozen = structuredClone(s);
  advance(s, 3, { move: 1, fire: true, secondary: true, interact: true });
  assert.deepEqual(s, frozen, 'an unresolved decision freezes elapsed time, train and all combat');
  commandGame(s, 'choice', 'defy');
  while (s.player.x > wagon.x - 260 && s.status === 'playing') updateGame(s, 1 / 60, { move: -1 });
  advance(s, 4, { brace: true, secondary: true, aimX: wagon.x, aimY: wagon.y });
  assert.equal(wagon.destroyed, true);
  assert.equal(s.campaign.hostagesRescued, rescued, 'evacuated workers are no longer in the wagon');
  assert.equal(s.campaign.evidencePreserved, preserved, 'a document already copied is not erased by later damage');
});

test('a destroyed hostage wagon remains a documented loss and never invents survivors or identities', () => {
  const s = createGame({ missionId: 'MI02' });
  pilotMI02(s, { stopAt: state => state.train.stopped });
  const wagon = s.train.wagons.find(item => item.kind === 'hostages');
  while (s.player.x > wagon.x - 260 && s.status === 'playing') updateGame(s, 1 / 60, { move: -1 });
  advance(s, 3.1, { brace: true, secondary: true, aimX: wagon.x, aimY: wagon.y });
  assert.equal(wagon.destroyed, true);
  assert.equal(s.campaign.hostagesLost, 8);
  assert.equal(s.campaign.rescueResolved, true);
  pilotMI02(s, { choice: 'obey' });
  assert.equal(s.status, 'won');
  assert.equal(s.campaign.hostagesRescued, 0);
  assert.equal(s.campaign.evidencePreserved, false);
  assert.match(s.decision.body, /Aucun survivant ne peut confirmer les identités/);
  assert.equal(s.campaign.recordFiled, false);
});
