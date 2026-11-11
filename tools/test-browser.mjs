/** Optional real Chromium smoke suite. Never substitutes modeled DOM results. */
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'test-results/browser');
const port = Number(process.env.IMPERIUM_TEST_PORT || 4192), base = `http://127.0.0.1:${port}`;
let playwright;
try { playwright = await import('playwright'); }
catch {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Playwright est requis pour ce contrôle optionnel. Utilisez un poste équipé de Playwright et Chromium.');
  playwright = await import(pathToFileURL(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright/index.mjs')).href);
}
let server, browser;
const report = { type: 'real-browser-smoke', completed: false, checks: [], browser: null, errors: [], limitations: ['No complete campaign playthrough, physical touch hardware, audio listening, human difficulty or performance certification.'] };
await mkdir(output, { recursive: true });
try {
  // Launch first so a restricted browser does not leave a redundant HTTP process.
  const executablePath = process.env.IMPERIUM_CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await playwright.chromium.launch({ headless: true, executablePath, args: ['--disable-dev-shm-usage'] });
  report.browser = await browser.version();
  server = spawn(process.execPath, ['tools/server.mjs', '--port', String(port)], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  await new Promise((accept, reject) => {
    const timer = setTimeout(() => reject(new Error('Le serveur local ne répond pas.')), 6000);
    server.stdout.once('data', () => { clearTimeout(timer); accept(); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Le serveur a quitté (${code}).`)); });
    server.once('error', reject);
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  const outsideRequests = [];
  page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) outsideRequests.push(request.url()); });
  const url = `${base}/dist/Ordre_de_Cendre.html?test=1`;
  await page.goto(url);
  await page.locator('#view-campaign').waitFor({ state: 'visible' });
  assert.equal(await page.locator('h1').innerText(), 'ORDRE\nDE CENDRE');
  for (const view of ['hangar', 'archives', 'settings', 'operations', 'campaign']) {
    await page.locator(`.nav-item[data-view="${view}"]`).click();
    await page.locator(`#view-${view}`).waitFor({ state: 'visible' });
  }
  await page.screenshot({ path: resolve(output, 'campaign-desktop.png'), fullPage: true });
  report.checks.push('Desktop opening and five navigation views');
  await page.locator('#campaign-deploy').click();
  await page.locator('#briefing-dialog').waitFor({ state: 'visible' });
  await page.locator('#launch').click();
  await page.waitForFunction(() => window.__IMPERIUM_TEST__?.snapshot().game?.missionId === 'MI01');
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.player.x > 750, null, { timeout: 15000 });
  await page.keyboard.up('KeyD'); await page.keyboard.press('KeyE');
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game.campaign.passageSecured, null, { timeout: 10000 });
  await page.locator('#pause-button').click();
  const paused = await page.evaluate(() => window.__IMPERIUM_TEST__.snapshot());
  await page.waitForTimeout(250);
  assert.equal((await page.evaluate(() => window.__IMPERIUM_TEST__.snapshot())).game.elapsed, paused.game.elapsed);
  assert.equal(paused.game.campaign.pipeIntact, true);
  report.checks.push('Real keyboard walk, 4.5-second plate deployment and frozen pause');
  await page.reload(); await page.locator('#campaign-resume').click();
  const resumed = await page.evaluate(() => window.__IMPERIUM_TEST__.snapshot());
  assert.deepEqual(resumed.campaign.checkpoint, paused.campaign.checkpoint);
  assert.equal(resumed.game.campaign.passageSecured, true);
  await page.screenshot({ path: resolve(output, 'mission-resumed.png') });
  report.checks.push('Reload and resume actual browser localStorage checkpoint');
  await page.keyboard.press('Escape'); await page.locator('#to-menu').click();
  await page.locator('.nav-item[data-view="hangar"]').click(); await page.locator('[data-walker="WK05"]').click();
  assert.match(await page.locator('#rig-class').innerText(), /4 APPUIS/);
  await page.locator('.nav-item[data-view="operations"]').click(); await page.locator('[data-mission="op02"]').click(); await page.locator('#deploy').click(); await page.locator('#launch').click();
  await page.waitForFunction(() => window.__IMPERIUM_TEST__.snapshot().game?.missionId === 'op02');
  assert.equal((await page.evaluate(() => window.__IMPERIUM_TEST__.snapshot())).game.player.feet.length, 4);
  report.checks.push('Independent Nacre simulation with quadruped preserves campaign');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const small = await mobile.newPage(); small.on('pageerror', error => report.errors.push(error.message));
  await small.goto(url); await small.locator('#view-campaign').waitFor({ state: 'visible' });
  assert.ok(await small.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'mobile horizontal overflow');
  await small.screenshot({ path: resolve(output, 'campaign-mobile.png'), fullPage: true });
  await small.locator('.nav-item[data-view="hangar"]').tap(); await small.locator('#view-hangar').waitFor({ state: 'visible' });
  report.checks.push('390px layout without horizontal overflow and emulated touch navigation');
  assert.deepEqual(report.errors, []); assert.deepEqual(outsideRequests, []);
  report.completed = true;
  console.log(`BROWSER SMOKE PASSED: ${report.checks.length} scenarios, Chromium ${report.browser}.`);
} catch (error) {
  report.blocker = error.message;
  console.error(`BROWSER SMOKE NOT COMPLETED: ${error.message}`);
  process.exitCode = 1;
} finally {
  await browser?.close(); server?.kill();
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
