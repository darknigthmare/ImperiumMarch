/** Real Chromium reception of both painted packs. Exactly one normal launch;
 * a native launch restriction is recorded without an alternate execution path.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const version = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, `docs/validation/painted-combat-browser-v${version.replaceAll('.', '')}`);
const port = 4297, base = `http://127.0.0.1:${port}`;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const launchOptions = { headless: true, executablePath: '/usr/bin/chromium', args: ['--disable-dev-shm-usage'] };
const report = { version, createdUtc: new Date().toISOString(), type: 'Real headless Chromium reception', completed: false,
  expectedAtlases: { mi14: 8, combat: 9 }, launchAttempts: 0, browserLaunched: false, pagesLoaded: 0,
  launchOptions, environment: { platform: process.platform, arch: process.arch, node: process.version },
  input: 'Public menus, file import and mouse/keyboard events. Test hook reads state only.',
  checks: [], screenshots: [], errors: [], sourceHashes: {},
  limitations: ['No full campaign browser playthrough, human animation approval, audio listening or physical controller test.'] };
for (const path of ['src/main.mjs', 'src/renderer.mjs', 'src/simulation.mjs', 'src/enemy-weapon-pose.mjs',
  'src/painted-sprites.mjs', 'src/painted-sprite-layout.mjs', 'src/painted-combat.mjs', 'src/painted-combat-layout.mjs',
  'dist/Ordre_de_Cendre.html', 'tools/test-painted-combat-browser.mjs']) report.sourceHashes[path] = digest(readFileSync(resolve(root, path)));
mkdirSync(output, { recursive: true });
let browser, server;
const snapshot = page => page.evaluate(() => window.__IMPERIUM_TEST__.snapshot());
async function ready(page) {
  await page.locator('#view-campaign').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const state = window.__IMPERIUM_TEST__?.snapshot();
    const loaded = (items, count) => items && Object.keys(items).length === count && Object.values(items).every(item => item.state === 'ready');
    return state && loaded(state.paintedSprites, 8) && loaded(state.paintedCombatSprites, 9);
  }, null, { timeout: 30000 });
  report.pagesLoaded++;
}
async function capture(page, name) {
  const path = resolve(output, `${name}.png`); await page.screenshot({ path, fullPage: true });
  report.screenshots.push({ file: `${name}.png`, sha256: digest(readFileSync(path)) });
}
async function importDossier(page, file) {
  await page.locator('#campaign-file').setInputFiles(resolve(root, file));
  await page.locator('#campaign-import-dialog').waitFor({ state: 'visible' });
  await page.locator('#campaign-confirm-import').click();
}

try {
  let playwright;
  try { playwright = require('playwright'); }
  catch { playwright = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')); }
  report.launchAttempts++;
  browser = await playwright.chromium.launch(launchOptions);
  report.browserLaunched = true; report.browserVersion = await browser.version();
  server = spawn(process.execPath, ['tools/server.mjs', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error('Local server startup timed out')), 8000);
    server.stdout.once('data', () => { clearTimeout(timer); accept(); });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Local server exited (${code})`)); });
  });

  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(`${base}/?test=1`); await ready(page);
  const initial = await snapshot(page);
  report.moduleAtlases = { mi14: initial.paintedSprites, combat: initial.paintedCombatSprites };
  report.checks.push('Module build: eight MI14 and nine combat atlas images decoded by Chromium');
  await capture(page, 'module-menu');
  await page.locator('.nav-item[data-view="operations"]').click();
  await page.locator('[data-mission="op01"]').click();
  await page.locator('#deploy').click(); await page.locator('#launch').click();
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game?.missionId === 'op01');
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.player.x > 700, null, { timeout: 15000 });
  await page.keyboard.up('KeyD'); await page.keyboard.press('Escape');
  const paused = await snapshot(page); assert.equal(paused.paused, true);
  await page.waitForTimeout(250); assert.equal((await snapshot(page)).game.elapsed, paused.game.elapsed);
  await capture(page, 'op01-painted-actors');
  report.checks.push('Real keyboard advances into the first painted combat encounter; pause freezes the simulated clock');
  await page.locator('#to-menu').click();

  await importDossier(page, 'docs/validation/mi14/passage-request-checkpoint.json');
  await page.locator('#campaign-resume').click();
  await page.keyboard.down('Space'); await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.workshop.picket.requested, null, { timeout: 15000 });
  await page.keyboard.up('Space');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.workshop.workers.some(w => w.routeProgress > .08 && !w.safe), null, { timeout: 15000 });
  await capture(page, 'mi14-painted-workers');
  report.checks.push('Historical MI14 checkpoint imports through public UI; actual bracing and interaction start painted workers moving');

  const offlineContext = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const offline = await offlineContext.newPage(), requests = [];
  offline.on('pageerror', error => report.errors.push(error.message));
  offline.on('request', request => { if (!/^(data:|blob:)/.test(request.url())) requests.push(request.url()); });
  await offline.goto(`${base}/dist/Ordre_de_Cendre.html?test=1`); await ready(offline);
  const standalone = await snapshot(offline);
  report.standaloneAtlases = { mi14: standalone.paintedSprites, combat: standalone.paintedCombatSprites };
  assert.deepEqual(requests.filter(url => url !== `${base}/dist/Ordre_de_Cendre.html?test=1`), [], 'Standalone must not request separate resources');
  await capture(offline, 'standalone-menu');
  report.checks.push('Standalone HTML decodes all seventeen embedded atlases without separate image or module requests');
  await offlineContext.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const small = await mobile.newPage(); small.on('pageerror', error => report.errors.push(error.message));
  await small.goto(`${base}/?test=1`); await ready(small);
  assert.ok(await small.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await small.locator('.nav-item[data-view="hangar"]').tap(); await small.locator('#view-hangar').waitFor({ state: 'visible' });
  await capture(small, 'mobile-hangar');
  report.checks.push('390-pixel viewport has no horizontal overflow and emulated touch opens the hangar');
  assert.deepEqual(report.errors, []); report.completed = true;
  console.log(JSON.stringify({ completed: true, checks: report.checks.length, screenshots: report.screenshots.length, browser: report.browserVersion, output }));
} catch (error) {
  report.failureStage = !report.browserLaunched ? 'native-browser-launch' : !server ? 'server-startup' : 'browser-flow';
  report.failure = { message: error.message, stack: error.stack };
  console.error(JSON.stringify({ completed: false, stage: report.failureStage, message: error.message, output }));
  process.exitCode = 1;
} finally {
  await browser?.close(); server?.kill();
  writeFileSync(resolve(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
}
