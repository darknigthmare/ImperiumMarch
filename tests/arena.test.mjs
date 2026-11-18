import test from 'node:test';
import assert from 'node:assert/strict';
import { ARENA_SUBMENUS, ARENA_RULES, ARENA_ROSTER, ARENA_ARENAS, ARENA_TOURNAMENT, ARENA_STORY, ARENA_ILLUSTRATIONS, ARENA_ILLUSTRATION_LOTS } from '../src/arena.mjs';

const rosterIds = new Set(ARENA_ROSTER.map(fighter => fighter.id));
const illustrationIds = new Set(ARENA_ILLUSTRATIONS.map(item => item.id));
const lotIds = new Set(ARENA_ILLUSTRATION_LOTS.map(lot => lot.id));

test('the arena submenu and rules describe a non-lethal design bench', () => {
  assert.deepEqual(ARENA_SUBMENUS.map(item => item.id), ['tournament', 'story', 'gallery', 'rules']);
  for (const key of ['pitch', 'origin', 'canon', 'marks', 'bridage', 'beasts', 'ground', 'controls', 'status']) assert.ok(ARENA_RULES[key].length > 40, `Missing arena rule ${key}`);
  assert.match(ARENA_RULES.status, /Conçu/);
});

test('the roster holds eight distinct fighters with a real arena and an original accent', () => {
  assert.equal(ARENA_ROSTER.length, 8);
  assert.equal(rosterIds.size, 8);
  for (const fighter of ARENA_ROSTER) {
    assert.ok(ARENA_ARENAS.some(arena => arena.id === fighter.arena), `${fighter.id} has no arena`);
    assert.match(fighter.accent, /^#[0-9a-f]{6}$/i);
    assert.ok(fighter.signature.length > 30 && fighter.weakness.length > 10);
  }
  assert.equal(new Set(ARENA_ROSTER.map(fighter => fighter.arena)).size, ARENA_ROSTER.length);
});

test('each story dossier is a full partition of the other seven fighters', () => {
  assert.equal(ARENA_STORY.length, ARENA_ROSTER.length);
  assert.deepEqual(ARENA_STORY.map(item => item.id).sort(), [...rosterIds].sort());
  for (const arc of ARENA_STORY) {
    assert.equal(arc.ladder.length, arc.id === 'DEC' ? 6 : 5, `${arc.id} trial count`);
    assert.equal(arc.fights, arc.ladder.length + 2);
    assert.ok(rosterIds.has(arc.rival.opponent), `${arc.id} rival must exist`);
    assert.ok(rosterIds.has(arc.guardian.opponent), `${arc.id} guardian must exist`);
    const opponents = [...arc.ladder.map(step => step.opponent), arc.rival.opponent, arc.guardian.opponent];
    assert.equal(new Set(opponents).size, arc.id === 'DEC' ? 8 : 7, `${arc.id} roster coverage`);
    assert.ok(!arc.ladder.some(step => step.opponent === arc.id), `${arc.id} cannot be its own trial`);
    if (arc.guardian.opponent === arc.id) assert.equal(arc.id, 'DEC', 'only the Décret fights a reserve mirror');
    for (const step of arc.ladder) assert.ok(step.stake.length > 20, `${arc.id} trial needs a stake`);
    assert.ok(arc.intro.length > 120 && arc.introQuote.length > 20);
    assert.ok(arc.ending.title && arc.ending.body.length > 120 && arc.ending.line);
    assert.ok(illustrationIds.has(arc.ending.illustration), `${arc.id} ending illustration missing`);
    assert.ok(illustrationIds.has(`intro-${arc.id}`) && illustrationIds.has(`por-${arc.id}`));
  }
});

test('the tournament seeds every fighter once and its bracket is complete', () => {
  assert.deepEqual(ARENA_TOURNAMENT.seeds.map(entry => entry.seed), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(ARENA_TOURNAMENT.seeds.map(entry => entry.id).sort(), [...rosterIds].sort());
  assert.equal(ARENA_TOURNAMENT.quarters.length, 4);
  const seeded = ARENA_TOURNAMENT.quarters.flat().sort((a, b) => a - b);
  assert.deepEqual(seeded, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(ARENA_TOURNAMENT.rounds.length, 3);
  assert.ok(ARENA_TOURNAMENT.rules.length >= 4);
});

test('every illustration brief has a lot, a usage and a description, and the roster lots are complete', () => {
  assert.equal(ARENA_ILLUSTRATIONS.length, 35);
  assert.equal(illustrationIds.size, 35);
  for (const lot of ARENA_ILLUSTRATION_LOTS) {
    assert.equal(ARENA_ILLUSTRATIONS.filter(item => item.lot === lot.id).length, lot.count, `${lot.id} count`);
    assert.ok(lot.usage.length > 10);
  }
  for (const item of ARENA_ILLUSTRATIONS) {
    assert.ok(lotIds.has(item.lot), `${item.id} has an unknown lot`);
    assert.ok(item.title && item.format && item.composition.length > 80 && item.light.length > 20 && item.canon.length > 20);
    assert.equal(item.status, 'À produire');
  }
  for (const fighter of ARENA_ROSTER) {
    for (const prefix of ['por', 'intro', 'end']) assert.ok(illustrationIds.has(`${prefix}-${fighter.id}`), `Missing ${prefix} artwork for ${fighter.id}`);
  }
});

test('the four submenu views render their authored content without a DOM', async () => {
  const { renderArenaView, illustrationLot } = await import('../src/arena-ui.mjs');
  const tournament = renderArenaView('tournament');
  assert.match(tournament, /Sept Appuis/);
  assert.match(tournament, /Cerbère/);
  assert.match(tournament, /Décret/);
  assert.match(tournament, /data-arena-action="start"/);
  const story = renderArenaView('story', { fighter: 'GUE' });
  assert.match(story, /Guetteur-racine/);
  assert.match(story, /ADVERSAIRES À BATTRE/);
  assert.match(story, /AUCUN SPÉCIMEN PRÉLEVÉ/i);
  assert.match(story, /Aile-miroir/);
  const other = renderArenaView('story', { fighter: 'DEC' });
  assert.match(other, /8/);
  assert.match(other, /Décret de réserve/);
  const gallery = renderArenaView('gallery', { lot: 'portraits' });
  assert.match(gallery, /por-CER/);
  assert.doesNotMatch(gallery, /are-quarry/);
  assert.equal(illustrationLot('end-HAR'), 'endings');
  assert.match(renderArenaView('rules'), /Bêtes reconstituées/);
  assert.match(renderArenaView('rules'), /Aucun état de campagne modifié/);
});
