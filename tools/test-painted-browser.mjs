/** Real headless Chromium reception of MI14 art through public UI and saved dossiers. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright')); }
const output = resolve(root, 'docs/validation/painted-mi14-browser');
mkdirSync(output, { recursive: true });
const base = 'http://127.0.0.1:4296';
const report = { version: '0.15.1', type: 'real-headless-Chromium', created: new Date().toISOString(), completed: false,
  input: 'Public file import and actual mouse/keyboard events. Test hook reads snapshots only.',
  limitations: ['Prepared historical checkpoints are imported; this is not a full MI01–MI14 browser playthrough.', 'No human difficulty, audio, final animation or physical controller approval.'],
  checks: [], screenshots: [], errors: [], sourceHashes: {} };
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
for (const file of ['src/main.mjs', 'src/painted-sprites.mjs', 'src/painted-sprite-layout.mjs', 'src/workshop-assets.mjs', 'dist/Ordre_de_Cendre.html', 'tools/test-painted-browser.mjs']) report.sourceHashes[file] = digest(readFileSync(resolve(root, file)));
let browser, server;
const capture = async (page, name) => { const path = resolve(output, name + '.png'); await page.screenshot({ path, fullPage: true }); report.screenshots.push({ file: name + '.png', sha256: digest(readFileSync(path)) }); };
const snap = page => page.evaluate(() => window.__IMPERIUM_TEST__.snapshot());
async function importDossier(page, file) {
  await page.locator('#campaign-file').setInputFiles(resolve(root, file));
  await page.locator('#campaign-import-dialog').waitFor({ state: 'visible' });
  await page.locator('#campaign-confirm-import').click();
}
async function ready(page) {
  await page.locator('#view-campaign').waitFor({ state: 'visible' });
  await page.waitForFunction(() => { const states = window.__IMPERIUM_TEST__?.snapshot().paintedSprites; return states && Object.keys(states).length === 8 && Object.values(states).every(s => s.state === 'ready'); });
}
try {
  browser = await playwright.chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--disable-dev-shm-usage'] });
  report.browser = await browser.version();
  server = spawn(process.execPath, ['tools/server.mjs', '--port', '4296'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error('Local server startup timed out')), 8000);
    server.stdout.once('data', () => { clearTimeout(timer); accept(); });
    server.once('error', reject);
  });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', e => report.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
  await page.goto(base + '/?test=1'); await ready(page);
  report.atlases = (await snap(page)).paintedSprites;
  report.checks.push('Eight original RGBA atlas files decoded by Chromium on module build');
  await importDossier(page, 'tests/fixtures/campaign-v13-mi13.json');
  const before = await snap(page);
  assert.equal(Object.keys(before.campaign.completed).length, 13);
  await page.locator('#campaign-deploy').click(); await page.locator('#launch').click();
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game?.missionId === 'MI14');
  await page.waitForTimeout(600);
  await capture(page, 'mi14-arrival');
  assert.equal((await snap(page)).game.workshop.workers.length, 8);
  assert.equal((await snap(page)).game.workshop.alert.ready, false);
  report.checks.push('Import v13, unlock and launch MI14 with eight local workers and no active automaton');

  await importDossier(page, 'docs/validation/mi14/passage-request-checkpoint.json');
  await page.locator('#campaign-resume').click();
  await page.keyboard.down('Space'); await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.workshop.picket.requested, null, { timeout: 15000 });
  await page.keyboard.up('Space');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.workshop.workers.some(w => w.routeProgress > .08 && !w.safe), null, { timeout: 15000 });
  await capture(page, 'mi14-workers-walking');
  report.checks.push('Actual Space/E completes picket request; eight workers begin their simulated movement with painted walk frames');

  await importDossier(page, 'docs/validation/mi14/repair-checkpoint.json');
  await page.locator('#campaign-resume').click();
  await capture(page, 'mi14-cooler-repairing');
  await page.keyboard.down('Space'); await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.workshop.cooler.repaired, null, { timeout: 16000 });
  await page.keyboard.up('Space');
  await capture(page, 'mi14-cooler-online');
  report.checks.push('Actual bracing resumes interrupted repair and changes the painted cooler to its repaired state');

  await importDossier(page, 'docs/validation/mi14/before-extraction-checkpoint.json');
  await page.locator('#campaign-resume').click();
  const extractionBefore = await snap(page);
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.status === 'won', null, { timeout: 25000 });
  await page.keyboard.up('KeyD');
  await page.locator('#result-dialog').waitFor({ state: 'visible' });
  const completed = await snap(page);
  assert.equal(Object.keys(completed.campaign.completed).length, 14);
  assert.equal(completed.campaign.resources.parts, extractionBefore.campaign.resources.parts + 4);
  assert.deepEqual(Object.fromEntries(Object.entries(completed.campaign.completed).filter(([key]) => key !== 'MI14')), extractionBefore.campaign.completed);
  await capture(page, 'mi14-result');
  await page.reload(); await ready(page);
  assert.deepEqual((await snap(page)).campaign, completed.campaign);
  report.checks.push('Real keyboard extraction records the four-lot reward once, preserves thirteen reports and reloads the exact completed dossier');

  const offlineContext = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const offline = await offlineContext.newPage();
  const network = [];
  offline.on('request', r => { if (!r.url().startsWith('data:') && !r.url().startsWith('blob:')) network.push(r.url()); });
  offline.on('pageerror', e => report.errors.push(e.message));
  await offline.goto(base + '/dist/Ordre_de_Cendre.html?test=1'); await ready(offline);
  await importDossier(offline, 'docs/validation/mi14/repair-checkpoint.json');
  await offline.locator('#campaign-resume').click();
  await capture(offline, 'standalone-painted-repair');
  assert.equal(network.filter(url => !url.includes('/dist/Ordre_de_Cendre.html?test=1')).length, 0, JSON.stringify(network));
  report.checks.push('Standalone HTML decodes all eight embedded atlases and renders MI14 without separate image, module or external requests');
  await offlineContext.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const small = await mobile.newPage();
  small.on('pageerror', e => report.errors.push(e.message));
  await small.goto(base + '/?test=1'); await ready(small);
  assert.ok(await small.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await small.locator('.nav-item[data-view="hangar"]').tap();
  await small.locator('#view-hangar').waitFor({ state: 'visible' });
  await capture(small, 'mobile-hangar');
  report.checks.push('390-pixel layout has no horizontal overflow and emulated touch reaches the hangar');
  assert.deepEqual(report.errors, []);
  report.completed = true;
  console.log(`PAINTED BROWSER PASSED: ${report.checks.length} checks; Chromium ${report.browser}.`);
} catch (error) {
  report.failure = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close(); server?.kill();
  writeFileSync(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
