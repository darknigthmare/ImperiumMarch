/**
 * Static UI and offline-bundle audit. This does NOT run a DOM or a browser.
 * No package installation, network, HTML event dispatch, or JavaScript execution.
 * Run after: node tools/build-offline.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const main = readFileSync(resolve(root, 'src/main.mjs'), 'utf8');
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique.');
const idSet = new Set(ids);
const refs = [...new Set([...main.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(m => m[1]))];
for (const id of refs) assert.ok(idSet.has(id), `main.mjs references absent HTML ID: ${id}`);

const dialogs = [...html.matchAll(/<dialog\b[^>]*\bid=["']([^"']+)["'][^>]*>/g)].map(m => m[1]);
for (const id of ['briefing-dialog', 'pause-dialog', 'decision-dialog', 'result-dialog', 'campaign-reset-dialog', 'campaign-import-dialog']) assert.ok(dialogs.includes(id), `Missing required dialog ${id}`);
for (const match of html.matchAll(/\bdata-close=["']([^"']+)["']/g)) assert.ok(dialogs.includes(match[1]), `Close button targets absent dialog: ${match[1]}`);

const views = [...new Set([...html.matchAll(/\bdata-view=["']([^"']+)["']/g)].map(m => m[1]))];
assert.deepEqual(views.sort(), ['archives', 'campaign', 'hangar', 'operations', 'settings']);
for (const view of views) assert.ok(idSet.has(`view-${view}`), `Missing view ${view}`);
const archives = [...new Set([...html.matchAll(/\bdata-archive=["']([^"']+)["']/g)].map(m => m[1]))];
assert.deepEqual(archives.sort(), ['doctrine', 'factions', 'records', 'worlds']);

for (const id of ['deploy', 'launch', 'pause-button', 'unpause', 'resume', 'restart', 'to-menu', 'result-menu', 'replay', 'next-operation', 'confirm-rig', 'campaign-deploy', 'campaign-resume', 'campaign-repair', 'campaign-repair-pipe', 'campaign-export', 'campaign-import', 'campaign-new', 'campaign-confirm-new', 'campaign-confirm-import']) {
  assert.ok(idSet.has(id), `Missing lifecycle button ${id}`);
  const listener = new RegExp(`\\$\\(['"]${id}['"]\\)\\.addEventListener\\(['"]click['"]`);
  assert.ok(listener.test(main), `No direct click handler for ${id}`);
}
for (const key of ['difficulty', 'assist', 'shake', 'motion', 'contrast', 'volume']) assert.ok(idSet.has(key), `Missing setting ${key}`);
for (const action of [...html.matchAll(/\bdata-action=["']([^"']+)["']/g)].map(m => m[1])) {
  assert.ok(['stepA', 'stepB', 'interact', 'reload', 'repair'].includes(action), `Unsupported command button ${action}`);
}
for (const hold of [...html.matchAll(/\bdata-hold=["']([^"']+)["']/g)].map(m => m[1])) {
  assert.ok(['left', 'right', 'vent', 'fire', 'secondary', 'brace', 'stepA', 'stepB'].includes(hold), `Unsupported held input ${hold}`);
}
for (const match of html.matchAll(/<(?:img|script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/g)) {
  const path = match[1];
  if (/^(?:data:|https?:|#)/.test(path)) continue;
  assert.ok(existsSync(resolve(root, path)), `Source HTML references missing local resource ${path}`);
}

const offlinePath = resolve(root, 'dist/Ordre_de_Cendre.html');
assert.ok(existsSync(offlinePath), 'Build offline HTML first: node tools/build-offline.mjs');
const offline = readFileSync(offlinePath, 'utf8');
const scripts = [...offline.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, 'Offline page must have one embedded application script.');
assert.ok(!/\bsrc\s*=/.test(scripts[0][1]), 'Offline script must not reference another file.');
assert.ok(!/\btype\s*=\s*["']module/.test(scripts[0][1]), 'Offline script must not require module loading.');
const script = scripts[0][2];
new Script(script, { filename: 'Ordre_de_Cendre.inline.js' }); // Compilation only; never runInContext/runInThisContext.
assert.ok(!/^\s*import(?:\s|["'{*])|\bimport\s*\(|\bimport\.meta\b/m.test(script), 'Offline JavaScript contains an unresolved import.');
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|Worker)\s*\(/.test(script), 'Offline application must not load network resources.');

const markup = offline.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
for (const match of markup.matchAll(/<(?:img|script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/gi)) {
  assert.ok(match[1].startsWith('data:'), `Offline page has a non-embedded asset URL: ${match[1].slice(0, 120)}`);
}
for (const match of markup.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)) {
  assert.ok(match[1].startsWith('data:'), `Offline CSS has a non-embedded asset URL: ${match[1].slice(0, 120)}`);
}
assert.ok(!/@import\s/.test(markup), 'Offline CSS contains an external stylesheet import.');
assert.ok(!/new\s+URL\([^\n]+import\.meta/.test(script), 'Offline JavaScript contains a local asset reference.');
assert.ok(script.includes('data:image/png;base64,'), 'The Canvas panorama must be embedded in the offline script.');

console.log(`STATIC UI AUDIT PASSED: ${ids.length} unique HTML IDs; ${refs.length} literal JS ID references; ${views.length} views; ${archives.length} archive tabs; ${dialogs.length} dialogs.`);
console.log(`OFFLINE BUNDLE AUDIT PASSED: one inline script compiled by vm.Script without executing; all HTML/CSS/Canvas assets embedded; no unresolved imports or resource requests.`);
console.log('LIMIT: this audit does not use a DOM emulator. Clicks, focus, CSS layout, native dialogs, audio, touch, and browser execution were NOT exercised.');
