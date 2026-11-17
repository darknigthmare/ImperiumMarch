/** Actual PNG/Canvas reception. Diagnostics and public-control scenes are
 * explicitly separate from browser checks and human playtesting. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_NACRE_PEOPLE_LAYOUT } from '../src/painted-nacre-people-layout.mjs';
import { loadPaintedNacrePeople, paintedNacrePeopleStatus, paintedNacrePeopleFrame,
  drawPaintedNacrePerson } from '../src/painted-nacre-people.mjs';
import { loadPaintedNacre } from '../src/painted-nacre.mjs';
import { loadPaintedNacreSiteAssets } from '../src/painted-nacre-sites.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedWorlds, paintedWorldStatus } from '../src/painted-worlds.mjs';
import { Renderer } from '../src/renderer.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';
import { parseCampaign, beginCampaignMission } from '../src/campaign.mjs';
import { pilotMI06 } from '../tests/helpers/mi06-driver.mjs';
import { pilotMI07 } from '../tests/helpers/mi07-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || resolve(root, '../outputs/painted-nacre-people-qa'));
const require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch { canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = canvasAPI;
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/nacre-people/manifest.json')));
const decoded = {}, ids = new WeakMap();
const sources = ['src/painted-nacre-people.mjs', 'src/painted-nacre-people-layout.mjs', 'src/renderer.mjs',
  'src/painted-worlds.mjs', 'assets/painted/worlds/nacre.png',
  'tools/index-painted-nacre-people.py', 'tools/test-painted-nacre-people.mjs', 'tests/painted-nacre-people.test.mjs'];
const receipt = { version: '0.15.8', createdUtc: new Date().toISOString(), completed: false,
  type: 'Actual original PNG decoding and Canvas inspection', browserExecuted: false, humanPlaytestPerformed: false,
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  atlases: [], frames: [], views: [], publicControls: [],
  limitations: ['The source-cell board uses imposed graphical states, not completed campaign events.',
    'Public-control scenes use the normal renderer. They do not certify browser UI, human input, audio or final animation quality.',
    'The MI06 context is an explicit simulation input. MI07 starts from the historical v6 fixture, unchanged.',
    'MI08 role/visibility behavior is covered by the targeted tests; no new MI08 full mission is claimed.'] };
mkdirSync(output, { recursive: true });
const save = (canvas, name, detail) => {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, name), bytes);
  receipt.views.push({ file: name, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...detail });
};
const count = (rgba, width, [x, y, w, h]) => {
  let n = 0; for (let row = y; row < y+h; row++) for (let column = x; column < x+w; column++)
    if (rgba[(row*width+column)*4+3] >= 32) n++;
  return n;
};
const label = (ctx, value, x, y) => { ctx.fillStyle = '#e4ead9'; ctx.font = '16px sans-serif'; ctx.fillText(value, x, y); };

await loadPaintedNacrePeople({ loadImage: async (url, key) => {
  const path = fileURLToPath(url), bytes = readFileSync(path), picture = await loadImage(path);
  const item = manifest.files.find(file => file.key === key);
  assert.equal(sha(bytes), item.sha256, `${key}: original bytes retained`);
  assert.deepEqual([picture.width, picture.height], item.size);
  const canvas = createCanvas(picture.width, picture.height), ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
  const rgba = ctx.getImageData(0, 0, picture.width, picture.height).data;
  let clear = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] === 0) clear++;
  assert.equal(clear, item.fullyTransparentPixels);
  assert.ok(clear > picture.width*picture.height*.25);
  for (const [name, frame] of Object.entries(PAINTED_NACRE_PEOPLE_LAYOUT[key].frames)) {
    const cellInk = count(rgba, picture.width, frame.cell), sourceInk = count(rgba, picture.width, frame.source);
    assert.ok(sourceInk > 100); assert.equal(sourceInk, cellInk, `${key}/${name}: no significant alpha clipped`);
    receipt.frames.push({ atlas: key, frame: name, occupiedPixels: sourceInk, source: frame.source, target: frame.target });
  }
  decoded[key] = picture; ids.set(picture, key);
  receipt.atlases.push({ key, path: item.path, sha256: item.sha256, bytes: bytes.length,
    size: [picture.width, picture.height], fullyTransparentPixels: clear });
  return picture;
} });
assert.ok(Object.values(paintedNacrePeopleStatus()).every(item => item.state === 'ready'));
assert.equal(receipt.frames.length, 28);

const board = createCanvas(1680, 1680), boardCtx = board.getContext('2d');
boardCtx.fillStyle = '#132b32'; boardCtx.fillRect(0, 0, board.width, board.height);
for (const [i, entry] of receipt.frames.entries()) {
  const x = i%4*420, y = Math.floor(i/4)*240, detail = paintedNacrePeopleFrame(entry.atlas, entry.frame);
  boardCtx.fillStyle = i%2 ? '#435b5c' : '#234047'; boardCtx.fillRect(x+8, y+8, 404, 224);
  label(boardCtx, `${entry.atlas} / ${entry.frame}`, x+18, y+30);
  const scale = Math.min(370/detail.target[2], 170/detail.target[3]);
  boardCtx.save(); boardCtx.translate(x+210, y+210); boardCtx.scale(scale, scale);
  boardCtx.drawImage(decoded[entry.atlas], ...detail.source, ...detail.target); boardCtx.restore();
}
save(board, 'nacre-people-cells.png', { type: 'Diagnostic source cells; crop and original proportions at comparison scales' });

const benchmark = createCanvas(1440, 650), bc = benchmark.getContext('2d');
bc.fillStyle = '#203d42'; bc.fillRect(0, 0, 1440, 650);
const sampleRoles = ['technician', 'driver', 'medic', 'patient'];
for (const [i, role] of sampleRoles.entries()) {
  const x = i*360;
  label(bc, role, x+30, 42);
  bc.strokeStyle = '#9bb3a2'; bc.beginPath(); bc.moveTo(x+20, 295); bc.lineTo(x+340, 295); bc.stroke();
  bc.save(); bc.translate(x+180, 295); bc.scale(6, 6);
  const entity = { id: 'diagnostic-1', role, x: 0, y: -17, w: role === 'patient' ? 26 : 19,
    h: 34, alive: true, safe: false, phase: 'waiting' };
  assert.ok(drawPaintedNacrePerson(bc, entity, { reducedMotion: true, groundY: 0 })); bc.restore();
  label(bc, 'Sol réel · échelle ×6', x+30, 330);
  bc.save(); bc.translate(x+180, 560); bc.scale(6, 6);
  assert.ok(drawPaintedNacrePerson(bc, { ...entity, alive: false }, { groundY: 0, allowLost: true })); bc.restore();
  label(bc, 'Pose de perte existante · diagnostic', x+18, 610);
}
save(benchmark, 'nacre-people-grounding.png', { type: 'Normal person renderer, living/loss diagnostics with a visible ground datum' });

const loader = url => loadImage(fileURLToPath(url));
await Promise.all([loadPaintedNacre({ loadImage: loader }), loadPaintedNacreSiteAssets({ loadImage: loader }),
  loadPaintedCombat({ loadImage: loader }), loadPaintedWalkers({ loadImage: loader }), loadPaintedWorlds({ loadImage: loader })]);
assert.equal(paintedWorldStatus().PL02.state, 'ready', 'Nacre readability scenes require the real panorama');
receipt.environment = { planetId: 'PL02', path: 'assets/painted/worlds/nacre.png',
  sha256: sha(readFileSync(resolve(root, 'assets/painted/worlds/nacre.png'))), state: paintedWorldStatus().PL02.state };
const oldWindow = globalThis.window, oldImage = globalThis.Image;
globalThis.window = { devicePixelRatio: 1 }; globalThis.Image = class { set src(_) {} };
try {
  const capture = (state, name, detail) => {
    const copy = structuredClone(state), before = JSON.stringify(copy), canvas = createCanvas(1600, 900);
    const ctx = canvas.getContext('2d'), realDraw = ctx.drawImage, calls = [];
    ctx.drawImage = function (...args) {
      const key = ids.get(args[0]); if (key) calls.push({ atlas: key, source: args.slice(1, 5) });
      return realDraw.apply(ctx, args);
    };
    new Renderer(canvas).render(copy, { shake: false, reducedMotion: true });
    assert.equal(JSON.stringify(copy), before); assert.ok(calls.length, `${name}: people actually visible`);
    save(canvas, name, { type: 'Normal Canvas scene reached by public controls; reduced motion', missionId: copy.missionId,
      elapsed: copy.elapsed, peopleDrawn: calls, ...detail });
    writeFileSync(resolve(output, name.replace('.png', '-state.json')), before+'\n');
  };
  const dike = createGame({ missionId: 'MI06', walkerId: 'WK09', seed: 1847,
    campaignContext: { fuelAvailable: 2, channelOpen: true, refugeesPassed: 12, refugeesLost: 0,
      smugglerVerified: true, bargeCiviliansLost: 0 } });
  pilotMI06(dike, { stopAt: s => s.dike.panel.latchProgress > .6 });
  assert.ok(dike.dike.panel.latchProgress > .6);
  capture(dike, 'mi06-technician-locking.png', { stage: 'Technician physically locking the supported panel' });
  pilotMI06(dike); assert.equal(dike.status, 'won');
  receipt.publicControls.push({ missionId: 'MI06', result: dike.status, elapsed: dike.elapsed,
    residentsSafe: dike.campaign.residentsSafe, techniciansAlive: dike.campaign.techniciansAlive });

  const historical = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/campaign-v6-mi06.json')));
  const ambulance = beginCampaignMission(parseCampaign(JSON.stringify(historical.completed)), { missionId: 'MI07', walkerId: 'WK09' }).game;
  pilotMI07(ambulance, { stopAt: s => s.ambulance.consent.obtained });
  assert.ok(ambulance.ambulance.consent.obtained);
  capture(ambulance, 'mi07-driver-and-medic.png', { stage: 'Actual personnel outside the stopped ambulance after consent' });
  pilotMI07(ambulance, { stopAt: s => s.ambulance.patients.some(p => p.phase === 'transferring' && p.x > s.ambulance.vehicle.x + 90) });
  assert.ok(ambulance.ambulance.patients.some(p => p.phase === 'transferring'));
  capture(ambulance, 'mi07-patient-transfer.png', { stage: 'Existing patients travelling to the receiving door' });
  pilotMI07(ambulance); assert.equal(ambulance.status, 'won');
  receipt.publicControls.push({ missionId: 'MI07', result: ambulance.status, elapsed: ambulance.elapsed,
    patientsArrived: ambulance.campaign.patientsArrived, staffArrived: ambulance.campaign.staffArrived });
} finally { globalThis.window = oldWindow; globalThis.Image = oldImage; }
receipt.completed = true;
assert.equal(sha(readFileSync(resolve(root, 'src/renderer.mjs'))), receipt.sourceHashes['src/renderer.mjs'], 'Renderer source remained stable during reception');
writeFileSync(resolve(output, 'reception.json'), JSON.stringify(receipt, null, 2)+'\n');
console.log(JSON.stringify({ completed: receipt.completed, atlases: receipt.atlases.length,
  cells: receipt.frames.length, views: receipt.views.length, publicControls: receipt.publicControls, output }, null, 2));
