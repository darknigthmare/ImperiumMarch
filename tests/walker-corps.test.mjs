import assert from 'node:assert/strict';
import { CORPS_FILTERS, CORPS_STATUS, WALKER_CORPS, corpsChassis, corpsChassisById, walkerBlueprintSvg } from '../src/walker-corps.mjs';
import { renderWalkerCorps } from '../src/walker-corps-ui.mjs';

const ids = ['WK13', 'WK14', 'WK15', 'WK16', 'WK17', 'WK18', 'WK19', 'WK20'];

assert.deepEqual(WALKER_CORPS.map(chassis => chassis.id), ids, 'The corps catalogue keeps stable WK13–WK20 ids in order.');
assert.equal(new Set(WALKER_CORPS.map(chassis => chassis.name)).size, 8, 'Names must be unique.');
assert.equal(new Set(WALKER_CORPS.map(chassis => chassis.designation)).size, 8, 'Designations must be unique.');
assert.equal(new Set(WALKER_CORPS.map(chassis => chassis.illustration.id)).size, 8, 'Illustration briefs must be unique.');

for (const chassis of WALKER_CORPS) {
  for (const field of ['name', 'designation', 'role', 'archetype', 'crew', 'weapon', 'secondary', 'mobility', 'armor', 'function', 'description', 'doctrine', 'accent']) {
    assert.equal(typeof chassis[field], 'string', `${chassis.id} needs a ${field} string.`);
    assert.ok(chassis[field].trim().length > 0, `${chassis.id} has an empty ${field}.`);
  }
  assert.ok([2, 4, 6].includes(chassis.legs), `${chassis.id} must walk on 2, 4 or 6 feet.`);
  assert.ok(chassis.heightM > 0 && chassis.massT > 0, `${chassis.id} needs positive height and mass.`);
  assert.ok(chassis.strengths.length >= 3, `${chassis.id} documents at least three strengths.`);
  assert.ok(chassis.weaknesses.length >= 2, `${chassis.id} documents at least two weaknesses.`);

  const geometry = chassis.geometry;
  assert.equal(geometry.legs.length, chassis.legs, `${chassis.id} draws exactly as many legs as it declares.`);
  assert.ok(geometry.hulls.length >= 1, `${chassis.id} needs at least one hull polygon.`);
  assert.ok(geometry.views.length >= 1, `${chassis.id} needs a visible cockpit or sensor.`);
  let far = 0;
  for (const leg of geometry.legs) {
    for (const point of [leg.hip, leg.knee, leg.foot]) {
      assert.equal(point.length, 2, `${chassis.id} legs use 2D points.`);
      assert.ok(point.every(Number.isFinite), `${chassis.id} leg coordinates must be finite.`);
    }
    assert.ok(leg.footW > 0, `${chassis.id} feet carry a width.`);
    assert.ok(['far', 'near'].includes(leg.depth), `${chassis.id} legs declare a depth layer.`);
    if (leg.depth === 'far') far += 1;
    assert.ok(leg.foot[1] === (geometry.ground ?? 186), `${chassis.id} feet stand on the drawn ground line.`);
  }
  assert.ok(far >= 1 && far < chassis.legs, `${chassis.id} mixes far and near legs.`);
  for (const hull of geometry.hulls) assert.ok(hull.length >= 3, `${chassis.id} hull polygons need three points.`);
  for (const view of geometry.views) assert.ok(view.length >= 3, `${chassis.id} cockpit polygons need three points.`);
  assert.ok(Number.isFinite(geometry.gun.x) && Number.isFinite(geometry.gun.y) && geometry.gun.len > 0, `${chassis.id} mounts a gun.`);
  for (const [a, b] of geometry.trim || []) {
    assert.equal(a.length, 2, `${chassis.id} trim lines use two points.`);
    assert.equal(b.length, 2, `${chassis.id} trim lines use two points.`);
  }
}

assert.equal(corpsChassis('all').length, 8);
assert.equal(corpsChassis('2').length, 3);
assert.equal(corpsChassis('4').length, 4);
assert.equal(corpsChassis('6').length, 1);
assert.equal(corpsChassis('9').length, 0, 'Unknown filters select nothing.');
assert.equal(corpsChassisById('WK99').id, 'WK13', 'Unknown ids fall back to the first chassis.');
assert.deepEqual(CORPS_FILTERS.map(filter => filter.id), ['all', '2', '4', '6']);
assert.equal(CORPS_STATUS.level, 'Conçu');

for (const chassis of WALKER_CORPS) {
  const svg = walkerBlueprintSvg(chassis);
  assert.ok(svg.startsWith('<svg'), `${chassis.id} renders an SVG.`);
  assert.ok(svg.includes('viewBox="0 0 260 200"'), `${chassis.id} uses the common drawing frame.`);
  assert.ok(svg.includes(chassis.name), `${chassis.id} names its drawing.`);
  assert.ok(!/NaN|undefined|null/.test(svg), `${chassis.id} silhouette must not leak invalid coordinates.`);
  const rounded = (svg.match(/stroke-linecap="round"/g) || []).length;
  const expected = chassis.legs + 1 + (chassis.geometry.gun.twin ? 1 : 0) + (chassis.geometry.dorsal ? 1 : 0);
  assert.equal(rounded, expected, `${chassis.id} draws one limb path per leg plus its barrels.`);
  assert.ok(svg.includes(chassis.accent), `${chassis.id} keeps its accent colour.`);
}

const markup = renderWalkerCorps();
for (const chassis of WALKER_CORPS) assert.ok(markup.includes(`${chassis.designation} ${chassis.name}`), `The repertoire lists ${chassis.name}.`);
assert.ok(markup.includes('data-corps-filter="4"'), 'Filters are rendered as buttons.');
assert.ok(markup.includes('aria-pressed="true"'), 'The active chassis exposes its state.');
assert.ok(markup.includes('Silhouette de conception'), 'The repertoire labels its drawings as design work.');
assert.ok(markup.includes('CONÇU'), 'The repertoire states the design-only status.');

const quadrupeds = renderWalkerCorps({ filter: '4', selected: 'WK18' });
assert.ok(quadrupeds.includes('WK18') && !quadrupeds.includes('CH-8 Chacal'), 'A filter hides other morphologies.');
assert.ok(quadrupeds.includes('corps-card active'), 'The selected chassis is highlighted.');
assert.ok(renderWalkerCorps({ filter: '6', selected: 'WK14' }).includes('MU-6 Mulet'), 'A selection outside the filter falls back to the first visible chassis.');

const serialized = JSON.stringify(WALKER_CORPS).toLowerCase();
for (const term of ['at-st', 'at-at', 'at-te', 'at-rt', 'at-ap', 'at-dp', 'at-m6', 'star wars', 'guerre des étoiles', 'empire contre-attaque']) {
  assert.ok(!serialized.includes(term), `Runtime data must stay original, found: ${term}`);
}

console.log(`WALKER CORPS PASSED: ${WALKER_CORPS.length} designed chassis, ${WALKER_CORPS.reduce((total, chassis) => total + chassis.legs, 0)} drawn legs, ${CORPS_FILTERS.length} filters, ${WALKER_CORPS.length} illustration briefs.`);
