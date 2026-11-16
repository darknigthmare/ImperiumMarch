/** Real headless Chromium reception of the 0.15.4 painted atlas integration.
 * Exactly one ordinary launch, no alternate browser or escalation on refusal.
 * Public UI actions and historical dossier imports only; the test hook is read-only. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, 'docs/validation/browser-v0154');
const port = 4298, base = `http://127.0.0.1:${port}`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const launchOptions = { headless: true, executablePath: '/usr/bin/chromium' };
const expected = { paintedSprites: 8, paintedCombatSprites: 9, paintedWalkerSprites: 6, paintedThyrSprites: 8, paintedCerbereSprite: 1 };
const report = { version, createdUtc: new Date().toISOString(), type: 'Real headless Chromium 0.15.4 reception', completed: false,
  launchAttempts: 0, browserLaunched: false, pagesLoaded: 0, expectedAtlases: expected, atlasTotal: 32, launchOptions,
  environment: { platform: process.platform, arch: process.arch, node: process.version },
  input: 'Public menu buttons, mouse/keyboard events and historical JSON file import; test hook reads state only.',
  nativeDesktopInteraction: false, humanPlaytestPerformed: false,
  checks: [], screenshots: [], errors: [], requestFailures: [], imports: [], sourceHashes: {},
  limitations: ['Headless Chromium automation is distinct from native desktop interaction and human reception.',
    'The MI09 and MI11 visits resume existing historical checkpoints through the import UI; they do not prove complete browser mission playthroughs.',
    'No listening test, physical controller, human animation judgement or full campaign run is claimed.'] };
const paths = ['index.html', 'src/main.mjs', 'src/renderer.mjs', 'src/simulation.mjs', 'src/painted-thyr.mjs', 'src/painted-thyr-layout.mjs',
  'src/thyr-renderer.mjs', 'src/voice-renderer.mjs', 'src/painted-cerbere.mjs', 'src/painted-cerbere-layout.mjs', 'src/cerbere-weapon-pose.mjs',
  'assets/painted/thyr/manifest.json', 'assets/painted/cerbere/manifest.json', 'dist/Ordre_de_Cendre.html', 'tools/test-painted-thyr-browser.mjs'];
for (const path of paths) report.sourceHashes[path] = digest(readFileSync(resolve(root, path)));
mkdirSync(output, { recursive: true });
let browser, server, stage = 'preflight';
const snapshot = page => page.evaluate(() => window.__IMPERIUM_TEST__.snapshot());
function observe(page, name) {
  page.on('pageerror', error => report.errors.push({ page: name, message: error.message }));
  page.on('requestfailed', request => report.requestFailures.push({ page: name, url: request.url(), failure: request.failure()?.errorText }));
}
async function ready(page) {
  await page.locator('#view-campaign').waitFor({ state: 'visible' });
  assert.match(await page.locator('.menu-footer').innerText(), /VERSION 0\.15\.4/);
  await page.waitForFunction(() => {
    const s = window.__IMPERIUM_TEST__?.snapshot();
    const loaded = (items, count) => items && Object.keys(items).length === count && Object.values(items).every(item => item.state === 'ready');
    return s && loaded(s.paintedSprites, 8) && loaded(s.paintedCombatSprites, 9) && loaded(s.paintedWalkerSprites, 6)
      && loaded(s.paintedThyrSprites, 8) && s.paintedCerbereSprite?.state === 'ready';
  }, null, { timeout: 45000 });
  report.pagesLoaded++;
  const state = await snapshot(page);
  return Object.fromEntries(Object.keys(expected).map(key => [key, state[key]]));
}
async function capture(page, name, details = {}, canvas = false) {
  const path = resolve(output, `${name}.png`);
  if (canvas) await page.locator('#game-canvas').screenshot({ path });
  else await page.screenshot({ path, fullPage: true });
  report.screenshots.push({ file: `${name}.png`, sha256: digest(readFileSync(path)), type: 'Headless Chromium screenshot', ...details });
}
async function returnToMenu(page) {
  const state = await snapshot(page);
  if (state.inGame && !state.paused) await page.keyboard.press('Escape');
  await page.locator('#to-menu').click();
  await page.locator('.nav-item[data-view="campaign"]').click();
}
async function importDossier(page, file, missionId) {
  const bytes = readFileSync(resolve(root, file));
  await page.locator('#campaign-file').setInputFiles(resolve(root, file));
  await page.locator('#campaign-import-dialog').waitFor({ state: 'visible' });
  await page.locator('#campaign-confirm-import').click();
  await page.locator('#campaign-resume').click();
  await page.waitForFunction(id => window.__IMPERIUM_TEST__.snapshot().game?.missionId === id, missionId);
  report.imports.push({ file, sha256: digest(bytes), missionId, method: 'Public file input, confirmation and resume button' });
}
async function startOperation(page) {
  await page.locator('.nav-item[data-view="operations"]').click();
  await page.locator('[data-mission="op03"]').click();
  await page.locator('#deploy').click(); await page.locator('#launch').click();
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game?.missionId === 'op03');
}

try {
  assert.equal(version, '0.15.4', 'This new receipt is scoped to the 0.15.4 source tree');
  const standalone = readFileSync(resolve(root, 'dist/Ordre_de_Cendre.html'), 'utf8');
  assert.ok(standalone.includes('VERSION 0.15.4') && standalone.includes('paintedThyrSprites') && standalone.includes('paintedCerbereSprite'),
    'Rebuild standalone 0.15.4 before browser reception');
  let playwright;
  try { playwright = require('playwright'); }
  catch {
    if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Installed Playwright runtime is unavailable');
    playwright = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
  }
  stage = 'native-browser-launch'; report.launchAttempts++;
  browser = await playwright.chromium.launch(launchOptions);
  report.browserLaunched = true; report.browserVersion = await browser.version();
  stage = 'local-server-startup';
  server = spawn(process.execPath, ['tools/server.mjs', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  const serverErrors = []; server.stderr.on('data', chunk => serverErrors.push(String(chunk)));
  await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error('Local server startup timed out')), 8000);
    server.stdout.once('data', () => { clearTimeout(timer); accept(); });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Local server exited (${code}): ${serverErrors.join('').slice(0, 1500)}`)); });
  });

  stage = 'module-atlas-decoding';
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage(); observe(page, 'module');
  await page.goto(`${base}/?test=1`); report.moduleAtlases = await ready(page);
  report.checks.push('Module version 0.15.4 and all 32 atlases decoded by real Chromium');
  await capture(page, 'module-menu');

  stage = 'module-public-navigation';
  for (const view of ['archives', 'settings', 'hangar']) {
    await page.locator(`.nav-item[data-view="${view}"]`).click();
    await page.locator(`#view-${view}`).waitFor({ state: 'visible' });
  }
  await page.locator('[data-walker="WK05"]').click();
  await capture(page, 'module-hangar', { walker: 'WK05' });
  await page.locator('[data-walker="WK01"]').click();
  report.checks.push('Public navigation visits archives, settings and hangar; actual chassis buttons select WK05 then WK01');

  stage = 'module-operation-input-pause-resume';
  await startOperation(page);
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.player.x > 700, null, { timeout: 20000 });
  await page.keyboard.up('KeyD');
  await capture(page, 'op03-live-rootwatcher', { mission: 'op03', method: 'New operation reached using actual held D key' });
  await page.locator('#pause-button').click();
  const paused = await snapshot(page); assert.equal(paused.paused, true);
  await page.waitForTimeout(250); assert.equal((await snapshot(page)).game.elapsed, paused.game.elapsed);
  await capture(page, 'op03-paused');
  await page.locator('#unpause').click();
  await page.waitForFunction(elapsed => { const s = window.__IMPERIUM_TEST__.snapshot(); return !s.paused && s.game.elapsed > elapsed; }, paused.game.elapsed);
  report.checks.push('OP03 launches, real D key advances the player past x=700, Pause freezes elapsed time and Reprendre resumes the simulation');
  await returnToMenu(page);

  stage = 'mi09-public-checkpoint-import';
  await importDossier(page, 'docs/previews/mi09-decision-checkpoint.json', 'MI09');
  await page.locator('#decision-dialog').waitFor({ state: 'visible' });
  await page.locator('[data-choice="defy"]').click();
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.decision.choice === 'defy');
  await capture(page, 'mi09-living-thyr', { mission: 'MI09', method: 'Historical checkpoint imported via public UI; real decision button selected' });
  report.checks.push('Historical MI09 dossier imports through public UI, resumes its authored decision and accepts the defy choice');
  await returnToMenu(page);

  stage = 'mi11-public-checkpoint-import';
  await importDossier(page, 'docs/previews/mi11-exchange-checkpoint.json', 'MI11');
  const beforeExchange = await snapshot(page);
  await page.keyboard.down('Space');
  await page.waitForFunction(progress => window.__IMPERIUM_TEST__.snapshot().game.voice.leth.progress > progress + .01,
    beforeExchange.game.voice.leth.progress, { timeout: 10000 });
  const exchange = await snapshot(page);
  assert.equal(exchange.game.voice.leth.alive, true); assert.equal(exchange.game.voice.leth.consent, true);
  await capture(page, 'mi11-leth-speaking', { mission: 'MI11', method: 'Historical checkpoint imported via public UI; actual brace input continues the consented exchange',
    progressBefore: beforeExchange.game.voice.leth.progress, progressAfter: exchange.game.voice.leth.progress });
  await page.keyboard.up('Space');
  report.checks.push('Historical MI11 dossier imports through public UI; held Space advances Leth’s existing consented testimony with no injected game state');
  await context.close();

  stage = 'standalone-atlas-decoding';
  const offlineContext = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const offline = await offlineContext.newPage(), requests = [];
  observe(offline, 'standalone');
  offline.on('request', request => { if (!/^(data:|blob:)/.test(request.url())) requests.push(request.url()); });
  const offlineURL = `${base}/dist/Ordre_de_Cendre.html?test=1`;
  await offline.goto(offlineURL); report.standaloneAtlases = await ready(offline);
  await capture(offline, 'standalone-menu');
  stage = 'standalone-public-launch'; await startOperation(offline);
  await offline.locator('#pause-button').click(); assert.equal((await snapshot(offline)).paused, true);
  await capture(offline, 'standalone-op03-paused', { mission: 'op03' });
  await offline.locator('#unpause').click();
  await offline.waitForFunction(() => !window.__IMPERIUM_TEST__.snapshot().paused);
  report.standaloneRequests = requests;
  assert.deepEqual(requests.filter(url => url !== offlineURL), [], 'Standalone must not request separate modules, images, styles, fonts or other resources');
  report.checks.push('Standalone version 0.15.4 decodes all 32 embedded atlases and launches/pauses/resumes OP03 without any ancillary request');
  await offlineContext.close();
  assert.deepEqual(report.errors, []); assert.deepEqual(report.requestFailures, []);
  stage = 'completed'; report.completed = true;
  console.log(JSON.stringify({ completed: true, checks: report.checks.length, screenshots: report.screenshots.length,
    atlasTotalPerBuild: 32, browser: report.browserVersion, output }));
} catch (error) {
  report.failureStage = stage; report.failure = { message: error.message, stack: error.stack };
  console.error(JSON.stringify({ completed: false, stage, message: error.message, launchAttempts: report.launchAttempts, output }));
  process.exitCode = 1;
} finally {
  await browser?.close(); server?.kill();
  report.finishedUtc = new Date().toISOString();
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
