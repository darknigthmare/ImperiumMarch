import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { WALKERS, MISSIONS, CAMPAIGN_MISSIONS, ALL_MISSIONS } from '../src/content.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['index.html', 'src/main.mjs', 'src/style.css', 'src/ui.css', 'src/audio.mjs', 'src/renderer.mjs', 'src/simulation.mjs', 'src/campaign.mjs', 'assets/art/key-art.png', 'assets/art/vesper-panorama.png', 'data/bible.json', 'docs/ORDRE_DE_CENDRE_Bible.xlsx']) assert.ok(existsSync(resolve(root, file)), `Missing ${file}`);
const bible = JSON.parse(readFileSync(resolve(root, 'data/bible.json'), 'utf8'));
assert.ok(bible.sheets.length >= 15, 'The bible must include the design disciplines.');
let rows = 0;
for (const sheet of bible.sheets) {
  assert.ok(sheet.name && sheet.columns.length && sheet.rows.length, `Invalid sheet ${sheet.name}`);
  assert.ok(sheet.name.length <= 31, `Excel name too long: ${sheet.name}`);
  const ids = new Set();
  for (const row of sheet.rows) {
    const key = sheet.columns[0].key;
    assert.ok(row[key] !== undefined, `Missing first column in ${sheet.name}`);
    assert.ok(!ids.has(row[key]), `Duplicate ${row[key]} in ${sheet.name}`); ids.add(row[key]); rows++;
  }
}
assert.deepEqual(WALKERS.map(w => w.id), ['WK01', 'WK02', 'WK05', 'WK06', 'WK09', 'WK10']);
for (const legs of [2, 4, 6]) {
  const family = WALKERS.filter(w => w.legs === legs);
  assert.equal(family.length, 2, `Two playable profiles expected for ${legs} legs`);
  assert.ok(Math.max(...family.map(w => w.height)) - Math.min(...family.map(w => w.height)) > 60);
}
assert.deepEqual(MISSIONS.map(m => m.planetId), ['PL01', 'PL02', 'PL03']);
assert.deepEqual(CAMPAIGN_MISSIONS.map(m => m.id), ['MI01', 'MI02', 'MI03', 'MI04', 'MI05', 'MI06', 'MI07', 'MI08', 'MI09']);
assert.equal(new Set(ALL_MISSIONS.map(m => m.id)).size, ALL_MISSIONS.length);
for (const mission of CAMPAIGN_MISSIONS) {
  if (mission.id === 'MI01') {
    assert.ok(mission.passage.stationX < mission.passage.pipeFrom && mission.passage.pipeTo < mission.ambushTriggerX);
    assert.ok(mission.deliveryX < mission.evidenceX && mission.evidenceX < mission.extractionX);
  } else if (mission.id === 'MI02') {
    assert.ok(mission.train.harpoonPositions.every(x => x < mission.train.startX));
    assert.ok(mission.train.startX < mission.train.breakX && mission.train.breakX < mission.extractionX);
  } else if (mission.id === 'MI03') {
    assert.deepEqual(mission.network.stations.map(s => s.kind), ['military', 'dispensary', 'residential']);
    assert.ok(mission.network.stations.every(s => s.x < mission.evidenceX));
    assert.ok(mission.evidenceX < mission.extractionX);
  } else if (mission.id === 'MI04') {
    const site = mission.industrial;
    assert.equal(site.turbineXs.length, 2);
    assert.ok(site.pumpX < site.turbineXs[0] && site.turbineXs[0] < site.turbineXs[1]);
    assert.ok(site.turbineXs[1] < site.contactX && site.contactX < site.postX);
    assert.equal(site.postX, mission.evidenceX);
    assert.ok(site.postX < mission.extractionX);
  }
  if (mission.id === 'MI08') {
    assert.ok(mission.departure.intakeX < mission.departure.passageX && mission.departure.exitX < mission.departure.refugeX && mission.departure.refugeX < mission.extractionX);
    assert.deepEqual(mission.departure.stretcherCapacities, [2, 2]);
    assert.equal(mission.departure.refugeStretchers, 4);
    assert.ok(mission.decision.delay);
  }
  assert.ok(mission.extractionX < mission.length);
  assert.equal(bible.sheets.flatMap(sheet => sheet.rows).find(row => row.id === mission.id)?.status, 'Prototype');
}
for (const walker of WALKERS) assert.equal(bible.sheets.find(sheet => sheet.name === 'Marcheurs').rows.find(row => row.id === walker.id)?.status, 'Prototype');
console.log(`Project checks passed: ${bible.sheets.length} design sheets, ${rows} source rows, ${WALKERS.length} playable chassis, ${MISSIONS.length} independent operations, ${CAMPAIGN_MISSIONS.length} campaign missions.`);
