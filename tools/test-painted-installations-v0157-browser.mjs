/** Chromium reception of the 0.15.7 installations, using public dossier import and UI input.
 * Usage: CODEX_PRIMARY_RUNTIME_NODE tools/test-painted-installations-v0157-browser.mjs
 *   --mode=source|standalone|prepare --output=docs/validation/browser-v0157/source
 * Every game checkpoint is produced by the existing public-input mission pilots.
 * Browser evaluation is limited to the read-only snapshot hook and DOM measurements.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parseCampaign, serializeCampaign, beginCampaignMission, checkpointCampaign, finishCampaignMission } from '../src/campaign.mjs';
import { pilotMI03 } from '../tests/helpers/mi03-driver.mjs';
import { pilotMI04 } from '../tests/helpers/mi04-driver.mjs';
import { pilotMI09 } from '../tests/helpers/mi09-driver.mjs';
import { pilotMI12 } from '../tests/helpers/mi12-driver.mjs';
import { pilotMI13 } from '../tests/helpers/mi13-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (key, fallback) => process.argv.find(a => a.startsWith(`--${key}=`))?.slice(key.length + 3) ?? fallback;
const mode = arg('mode', 'source');
assert.ok(['source', 'standalone', 'prepare'].includes(mode));
const output = resolve(root, arg('output', `docs/validation/browser-v0157/${mode}`));
mkdirSync(output, { recursive: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fileHash = path => digest(readFileSync(resolve(root, path)));
const writeJson = (name, data) => writeFileSync(resolve(output, name), JSON.stringify(data, null, 2) + '\n');
const report = {
  version: '0.15.7', type: 'real-headless-Chromium', mode, createdUtc: new Date().toISOString(), completed: false,
  inputPolicy: 'Prepared campaign checkpoints from unchanged public-input pilots, imported through the actual file picker and confirmation dialog. Actual browser keyboard and UI controls continue local work. The test hook only returns snapshots.',
  limitations: ['No complete browser campaign playthrough.', 'Prepared input dossiers are simulation exports, never presented as native browser gameplay.', 'No human difficulty, audio, final animation, performance or physical touch/controller reception.'],
  sourceHashes: {}, preparedInputs: [], checks: [], screenshots: [], observations: [], pageErrors: [], consoleErrors: [], expectedNetworkErrors: [], externalRequests: [],
};
const sourceFiles = ['tools/test-painted-installations-v0157-browser.mjs', 'src/main.mjs', 'src/content.mjs', 'src/campaign.mjs', 'src/simulation.mjs', 'src/renderer.mjs', 'src/thyr-renderer.mjs', 'src/foundry-renderer.mjs',
  'src/painted-vesper.mjs', 'src/painted-vesper-layout.mjs', 'src/painted-route.mjs', 'src/painted-route-layout.mjs', 'src/painted-foundry-sites.mjs', 'src/painted-foundry-sites-layout.mjs',
  'assets/painted/vesper/manifest.json', 'assets/painted/route/manifest.json', 'assets/painted/foundry-sites/manifest.json',
  'tests/helpers/mi03-driver.mjs', 'tests/helpers/mi04-driver.mjs', 'tests/helpers/mi09-driver.mjs', 'tests/helpers/mi12-driver.mjs', 'tests/helpers/mi13-driver.mjs'];
for (const path of sourceFiles) report.sourceHashes[path] = fileHash(path);
if (mode === 'standalone') report.sourceHashes['dist/Ordre_de_Cendre.html'] = fileHash('dist/Ordre_de_Cendre.html');
const check = (name, detail = {}) => { report.checks.push({ name, ...detail }); console.log(`PASS ${name}`); };

const fixtures = {
  MI03: 'tests/fixtures/campaign-v2-mi02.json', MI04: 'tests/fixtures/campaign-v3-mi03.json',
  MI09: 'tests/fixtures/campaign-v8-mi08.json', MI13: 'tests/fixtures/campaign-v11-mi11.json',
};
function fixtureCampaign(path) {
  const fixture = JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  return parseCampaign(JSON.stringify(fixture.format ? fixture : fixture.completed));
}
function prepareInput(missionId, pilot, stopAt, predicateDescription) {
  const fixture = fixtures[missionId]; let base = fixtureCampaign(fixture), prerequisite = null;
  if (missionId === 'MI13') {
    const relay = beginCampaignMission(base, { missionId: 'MI12', walkerId: 'WK09', difficulty: 'story', seed: 157 });
    assert.equal(relay.ok, true); assert.equal(relay.replay, false);
    pilotMI12(relay.game, { choice: 'defy' }); assert.equal(relay.game.status, 'won');
    const finished = finishCampaignMission(relay.campaign, relay.game); assert.equal(finished.applied, true);
    base = finished.campaign;
    prerequisite = { missionId: 'MI12', method: 'Unchanged pilotMI12 with public commands, then finishCampaignMission', elapsed: relay.game.elapsed, status: relay.game.status };
  }
  const started = beginCampaignMission(base, { missionId, walkerId: 'WK09', difficulty: 'story', seed: 157 });
  assert.equal(started.ok, true); assert.equal(started.replay, false);
  const priorReports = structuredClone(started.campaign.completed);
  pilot(started.game, { choice: 'defy', stopAt });
  assert.equal(started.game.status, 'playing'); assert.ok(stopAt(started.game), `${missionId} prepared state not reached`);
  const point = checkpointCampaign(started.campaign, started.game);
  assert.deepEqual(point.completed, priorReports);
  const bytes = serializeCampaign(point) + '\n'; assert.deepEqual(parseCampaign(bytes), point);
  const name = `${missionId.toLowerCase()}-prepared-input.json`; writeFileSync(resolve(output, name), bytes);
  report.preparedInputs.push({ missionId, file: name, sha256: digest(bytes), fixture, fixtureSha256: fileHash(fixture),
    prerequisite, seed: 157, walkerId: 'WK09', difficulty: 'story', predicateDescription, elapsed: started.game.elapsed,
    priorReports: Object.keys(point.completed), provenance: 'Prepared outside Chromium through the existing public command pilot; no HP, position, time or mission-flag assignment.' });
  return { name, point };
}
const prepared = {};
if (mode !== 'standalone') {
  prepared.MI03 = prepareInput('MI03', pilotMI03, s => s.network.stations[1].scanning && s.network.stations[1].scanProgress > .45,
    'Dispensary inspection running above 45%, before identification.');
  prepared.MI04 = prepareInput('MI04', pilotMI04, s => s.industrial.turbines[0].working && s.industrial.turbines[0].progress > .45,
    'First turbine cooling work running above 45%, before completion.');
  prepared.MI09 = prepareInput('MI09', pilotMI09, s => s.livingRoute.maps.inspected && s.decision.resolved && s.livingRoute.barrier.opening === 0,
    'Route surveyed and decision made; barrier remains physically closed and two homes exist.');
}
prepared.MI13 = prepareInput('MI13', pilotMI13, s => s.foundry.bridges[0].valve.working && s.foundry.bridges[0].valve.progress > .45,
  'First thermal-bridge valve work above 45%, before circuit isolation.');
if (mode === 'prepare') { report.completed = true; writeJson('report.json', report); console.log('Prepared four valid public-input dossiers.'); process.exit(0); }

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')); }
const port = Number(arg('port', '4317')), baseUrl = `http://127.0.0.1:${port}`;
const groups = [['paintedSprites', 8], ['paintedCombatSprites', 9], ['paintedWalkerSprites', 6], ['paintedThyrSprites', 8],
  ['paintedCerbereSprite', 1], ['paintedTransportSprites', 4], ['paintedRelaySprites', 3], ['paintedNacreSprites', 6],
  ['paintedChemicalSprites', 5], ['paintedVoiceSprites', 3], ['paintedNacreSiteSprites', 5], ['paintedVesperSprites', 6], ['paintedRouteSprites', 3], ['paintedFoundrySiteSprites', 4]];
const addedGroups = ['paintedVesperSprites', 'paintedRouteSprites', 'paintedFoundrySiteSprites'];
assert.equal(groups.reduce((n, [, count]) => n + count, 0), 71);
let browser, server;
const snap = page => page.evaluate(() => window.__IMPERIUM_TEST__.snapshot());
function watch(page, label, expectedFailures = false) {
  page.on('pageerror', error => report.pageErrors.push({ label, message: error.message }));
  page.on('console', item => {
    if (item.type() !== 'error') return;
    const entry = { label, message: item.text(), location: item.location() };
    if (expectedFailures && /ERR_FAILED/.test(item.text())) report.expectedNetworkErrors.push(entry);
    else report.consoleErrors.push(entry);
  });
  page.on('request', request => {
    const url = request.url();
    if (!url.startsWith(baseUrl) && !url.startsWith('data:') && !url.startsWith('blob:')) report.externalRequests.push({ label, url });
  });
}
async function ready(page, failed = false) {
  await page.locator('#view-campaign').waitFor({ state: 'visible' });
  await page.waitForFunction(({ groups, addedGroups, failed }) => {
    const state = window.__IMPERIUM_TEST__?.snapshot(); if (!state) return false;
    return groups.every(([key, count]) => {
      const values = key === 'paintedCerbereSprite' ? [state[key]] : Object.values(state[key] || {});
      return values.length === count && values.every(v => v?.state === (failed && addedGroups.includes(key) ? 'failed' : 'ready'));
    });
  }, { groups, addedGroups, failed }, { timeout: 30000 });
  const state = await snap(page);
  return Object.fromEntries(groups.map(([key, count]) => [key, { count, status: structuredClone(state[key]) }]));
}
async function capture(page, name, purpose) {
  const before = await snap(page), png = name + '.png', snapshotFile = name + '-snapshot.json';
  await page.screenshot({ path: resolve(output, png), fullPage: true });
  const after = await snap(page);
  writeJson(snapshotFile, { purpose, beforeScreenshot: before, afterScreenshot: after });
  report.screenshots.push({ file: png, sha256: fileHash(relative(root, resolve(output, png))), viewport: page.viewportSize(), purpose,
    snapshot: snapshotFile, snapshotSha256: fileHash(relative(root, resolve(output, snapshotFile))),
    simulationElapsed: [before.game?.elapsed ?? null, after.game?.elapsed ?? null] });
}
async function importInput(page, missionId) {
  const input = prepared[missionId];
  await page.locator('#campaign-file').setInputFiles(resolve(output, input.name));
  await page.locator('#campaign-import-dialog').waitFor({ state: 'visible' });
  await page.locator('#campaign-confirm-import').click();
  const imported = await snap(page);
  assert.deepEqual(imported.campaign, input.point, `${missionId}: exact imported dossier`);
  await page.locator('#campaign-resume').click();
  await page.waitForFunction(id => window.__IMPERIUM_TEST__.snapshot().game?.missionId === id, missionId);
  return imported.campaign.completed;
}
async function actualWork(page, missionId, partial, complete, label) {
  const priorReports = await importInput(page, missionId);
  await page.keyboard.down('Space'); await page.keyboard.press('KeyE');
  await page.waitForFunction(partial, null, { timeout: 20000 });
  const during = await snap(page);
  assert.equal(during.paused, false); assert.equal(during.game.status, 'playing');
  await capture(page, `${label}-working`, 'Actual Chromium continuation with Space held and E pressed; work remains incomplete.');
  await page.waitForFunction(complete, null, { timeout: 20000 });
  await page.keyboard.up('Space');
  const done = await snap(page);
  assert.deepEqual(done.campaign.completed, priorReports);
  await capture(page, `${label}-completed`, 'Local work completed in Chromium; earlier mission reports remain unchanged.');
  check(`${missionId} actual keyboard continuation`, { fromElapsed: during.game.elapsed, toElapsed: done.game.elapsed, earlierReportsUnchanged: Object.keys(priorReports).length });
  return done;
}
try {
  browser = await playwright.chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--disable-dev-shm-usage'] });
  report.browser = await browser.version();
  server = spawn(process.execPath, ['tools/server.mjs', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error('Local server startup timed out')), 8000);
    server.stdout.once('data', () => { clearTimeout(timer); accept(); });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Local server exited ${code}`)); });
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage(); watch(page, mode);
  const requests = []; page.on('request', request => { if (!request.url().startsWith('data:') && !request.url().startsWith('blob:')) requests.push(request.url()); });
  const entry = mode === 'standalone' ? `${baseUrl}/dist/Ordre_de_Cendre.html?test=1` : `${baseUrl}/?test=1`;
  await page.goto(entry); report.loadedAtlases = await ready(page);
  check('71 original atlas images decoded in 14 groups', { newAtlasCount: 13 });

  if (mode === 'source') {
    await actualWork(page, 'MI03', () => { const d = window.__IMPERIUM_TEST__.snapshot().game.network.stations[1]; return d.scanning && d.scanProgress > .55; },
      () => window.__IMPERIUM_TEST__.snapshot().game.network.stations[1].verified, 'mi03-dispensary');
    await page.locator('#pause-button').click();
    const paused = await snap(page); assert.equal(paused.paused, true);
    await page.waitForTimeout(700);
    const still = await snap(page); assert.deepEqual(still.game, paused.game, 'Entire paused simulation stays fixed');
    await capture(page, 'mi03-paused', 'Actual pause dialog; full simulation unchanged for 700 ms.');
    await page.reload(); await ready(page);
    const reloaded = await snap(page); assert.deepEqual(reloaded.campaign.checkpoint, paused.game);
    assert.deepEqual(reloaded.campaign.completed, paused.campaign.completed);
    await page.locator('#campaign-resume').click();
    await page.waitForFunction(elapsed => window.__IMPERIUM_TEST__.snapshot().game.elapsed > elapsed + .2, paused.game.elapsed);
    assert.equal((await snap(page)).game.network.stations[1].verified, true);
    check('Pause, browser reload and exact checkpoint resume', { frozenMilliseconds: 700, elapsed: paused.game.elapsed, verifiedDispensaryPreserved: true });

    await actualWork(page, 'MI04', () => { const d = window.__IMPERIUM_TEST__.snapshot().game.industrial.turbines[0]; return d.working && d.progress > .55; },
      () => window.__IMPERIUM_TEST__.snapshot().game.industrial.turbines[0].cooled, 'mi04-turbine');

    const routeReports = await importInput(page, 'MI09');
    await page.keyboard.down('Space');
    const route = await snap(page);
    assert.equal(route.game.livingRoute.maps.inspected, true); assert.equal(route.game.livingRoute.barrier.opening, 0);
    assert.equal(route.game.livingRoute.homes.length, 2); assert.equal(route.game.livingRoute.barrier.operated, false);
    assert.deepEqual(route.campaign.completed, routeReports);
    await capture(page, 'mi09-surveyed-map', 'Surveyed map uses the two existing homes; the barrier remains physically closed.');
    await page.keyboard.up('Space');
    check('MI09 surveyed map with two simulated homes and closed barrier', { homes: 2, barrierOpening: 0, earlierReportsUnchanged: Object.keys(routeReports).length });
  }

  const foundryDone = await actualWork(page, 'MI13', () => { const b = window.__IMPERIUM_TEST__.snapshot().game.foundry.bridges[0]; return b.valve.working && b.valve.progress > .55; },
    () => window.__IMPERIUM_TEST__.snapshot().game.foundry.bridges[0].circuitOpen, mode === 'standalone' ? 'standalone-mi13-valve' : 'mi13-valve');
  assert.equal(foundryDone.game.foundry.bridges[0].valve.destroyed, false);
  if (mode === 'standalone') {
    assert.deepEqual(requests, [entry], 'Standalone page must require no separate assets, modules or external requests');
    report.standaloneRequests = requests;
    check('Standalone import and work without additional requests', { requests: requests.length, totalAtlasCount: 71 });
  } else {
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const mobile = await mobileContext.newPage(); watch(mobile, 'mobile');
    await mobile.goto(`${baseUrl}/?test=1`); await ready(mobile);
    const dimensions = await mobile.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth, viewportHeight: innerHeight }));
    assert.ok(dimensions.scrollWidth <= dimensions.innerWidth + 1);
    await capture(mobile, 'mobile-campaign', '390 px emulated viewport; campaign screen with no horizontal overflow.');
    await mobile.locator('.nav-item[data-view="hangar"]').tap(); await mobile.locator('#view-hangar').waitFor({ state: 'visible' });
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await capture(mobile, 'mobile-hangar', 'Actual emulated touch navigation to the hangar at 390 px.');
    check('390 px layout and emulated touch navigation', dimensions);
    await mobileContext.close();

    const fallbackContext = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const fallback = await fallbackContext.newPage(); watch(fallback, 'fallback', true);
    const blocked = [];
    await fallback.route(/\/assets\/painted\/(vesper|route|foundry-sites)\/[^/]+\.png$/, async route => { blocked.push(route.request().url()); await route.abort('failed'); });
    await fallback.goto(`${baseUrl}/?test=1`); report.failedAtlases = await ready(fallback, true);
    assert.equal(blocked.length, 13); assert.equal(new Set(blocked).size, 13);
    await actualWork(fallback, 'MI03', () => { const d = window.__IMPERIUM_TEST__.snapshot().game.network.stations[1]; return d.scanning && d.scanProgress > .55; },
      () => window.__IMPERIUM_TEST__.snapshot().game.network.stations[1].verified, 'fallback-mi03-dispensary');
    report.blockedAtlasRequests = blocked;
    check('Real image-request failure and vector fallback', { failedNewAtlases: 13, otherReadyAtlases: 58, dispensaryVerificationCompleted: true });
    await fallbackContext.close();
  }
  assert.deepEqual(report.pageErrors, []); assert.deepEqual(report.consoleErrors, []); assert.deepEqual(report.externalRequests, []);
  const changedSources = sourceFiles.filter(path => fileHash(path) !== report.sourceHashes[path]);
  assert.deepEqual(changedSources, [], 'The tested source bytes must stay fixed during this run');
  report.completed = true;
  console.log(`BROWSER 0.15.7 ${mode} PASSED: ${report.checks.length} checks, ${report.screenshots.length} screenshots, Chromium ${report.browser}.`);
} catch (error) {
  report.failure = error.stack; console.error(error); process.exitCode = 1;
} finally {
  await browser?.close(); server?.kill();
  writeJson('report.json', report);
}
