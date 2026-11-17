/** Actual original-PNG and Canvas reception. No browser/human claim. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAINTED_NACRE_CIVILIANS_LAYOUT } from '../src/painted-nacre-civilians-layout.mjs';
import { loadPaintedNacreCivilians, paintedNacreCivilianStatus, paintedNacreCivilianSelection,
  drawPaintedNacreCivilian } from '../src/painted-nacre-civilians.mjs';
import { loadPaintedNacrePeople } from '../src/painted-nacre-people.mjs';
import { loadPaintedNacre } from '../src/painted-nacre.mjs';
import { loadPaintedNacreSiteAssets } from '../src/painted-nacre-sites.mjs';
import { loadPaintedNacreScenery, paintedNacreSceneryStatus } from '../src/painted-nacre-scenery.mjs';
import { loadPaintedCombat } from '../src/painted-combat.mjs';
import { loadPaintedWalkers } from '../src/painted-walkers.mjs';
import { loadPaintedWorlds, paintedWorldStatus } from '../src/painted-worlds.mjs';
import { Renderer } from '../src/renderer.mjs';
import { createGame } from '../src/simulation.mjs';
import { parseCampaign, beginCampaignMission } from '../src/campaign.mjs';
import { pilotMI06 } from '../tests/helpers/mi06-driver.mjs';
import { pilotMI08 } from '../tests/helpers/mi08-driver.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(process.argv[2] || resolve(root, '../outputs/painted-nacre-civilians-qa'));
const require = createRequire(import.meta.url);
let canvasAPI;
try { canvasAPI = require('@napi-rs/canvas'); }
catch { canvasAPI = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = canvasAPI;
const sha = value => createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(readFileSync(resolve(root, 'assets/painted/nacre-civilians/manifest.json')));
const decoded = {}, ids = new WeakMap();
const fixturePath = 'tests/fixtures/campaign-v7-mi07.json';
const sources = ['src/painted-nacre-civilians.mjs', 'src/painted-nacre-civilians-layout.mjs', 'src/renderer.mjs',
  'src/painted-worlds.mjs', 'assets/painted/worlds/nacre.png', 'src/simulation.mjs',
  'src/painted-nacre-scenery.mjs', 'src/painted-nacre-scenery-layout.mjs',
  'assets/painted/nacre-scenery/terrain.png', 'assets/painted/nacre-scenery/props.png',
  'tools/index-painted-nacre-civilians.py', 'tools/test-painted-nacre-civilians.mjs',
  'tests/painted-nacre-civilians.test.mjs', 'tests/helpers/mi06-driver.mjs', 'tests/helpers/mi08-driver.mjs', fixturePath];
const receipt = { version: '0.15.9', createdUtc: new Date().toISOString(), completed: false,
  type: 'Actual original PNG decoding and Canvas inspection', browserExecuted: false, humanPlaytestPerformed: false,
  sourceHashes: Object.fromEntries(sources.map(path => [path, sha(readFileSync(resolve(root, path)))])),
  atlases: [], frames: [], views: [], publicControls: [],
  limitations: ['Atlas and grounding boards impose graphical states; they are not campaign events.',
    'Public-control scenes use the normal renderer and the existing simulation drivers. They do not certify browser UI, human input, audio or final animation quality.',
    'MI06 uses an explicit input context; MI08 begins with the unchanged historical v7 MI07 fixture.',
    'The six nonresident loss cells are inspection references and never enter runtime selections.',
    'Appearances are current-roster variations and do not restore missing historical identities.'] };
mkdirSync(output, { recursive: true });
const save = (canvas, name, detail) => {
  const bytes = canvas.toBuffer('image/png'); writeFileSync(resolve(output, name), bytes);
  receipt.views.push({ file: name, width: canvas.width, height: canvas.height, sha256: sha(bytes), ...detail });
};
const count = (rgba, width, [x, y, w, h]) => {
  let n = 0;
  for (let row = y; row < y+h; row++) for (let column = x; column < x+w; column++) if (rgba[(row*width+column)*4+3] >= 32) n++;
  return n;
};
const label = (ctx, value, x, y, size = 16) => { ctx.fillStyle = '#e4ead9'; ctx.font = `${size}px sans-serif`; ctx.fillText(value, x, y); };

await loadPaintedNacreCivilians({ loadImage: async (url, key) => {
  const path = fileURLToPath(url), bytes = readFileSync(path), picture = await loadImage(path);
  const file = manifest.files.find(item => item.key === key);
  assert.equal(sha(bytes), file.sha256, `${key}: original PNG bytes retained`);
  assert.deepEqual([picture.width, picture.height], file.size);
  const canvas = createCanvas(picture.width, picture.height), ctx = canvas.getContext('2d'); ctx.drawImage(picture, 0, 0);
  const rgba = ctx.getImageData(0, 0, picture.width, picture.height).data;
  let clear = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] === 0) clear++;
  assert.equal(clear, file.fullyTransparentPixels); assert.ok(clear > picture.width*picture.height*.25);
  for (const [name, frame] of Object.entries(PAINTED_NACRE_CIVILIANS_LAYOUT[key].frames)) {
    const cellInk = count(rgba, picture.width, frame.cell), sourceInk = count(rgba, picture.width, frame.source);
    assert.ok(sourceInk > 100); assert.equal(sourceInk, cellInk, `${key}/${name}: no significant alpha clipped`);
    receipt.frames.push({ atlas: key, frame: name, usage: frame.usage, occupiedPixels: sourceInk, source: frame.source, target: frame.target });
  }
  decoded[key] = picture; ids.set(picture, key);
  receipt.atlases.push({ key, path: file.path, sha256: file.sha256, bytes: bytes.length,
    size: [picture.width, picture.height], fullyTransparentPixels: clear });
  return picture;
} });
assert.ok(Object.values(paintedNacreCivilianStatus()).every(item => item.state === 'ready'));
assert.equal(receipt.frames.length, 48);
assert.equal(receipt.frames.filter(frame => frame.usage === 'runtime').length, 42);
assert.equal(receipt.frames.filter(frame => frame.usage === 'reference').length, 6);

for (const [key, atlas] of Object.entries(PAINTED_NACRE_CIVILIANS_LAYOUT)) {
  const [columns, rows] = atlas.grid, board = createCanvas(columns*400, rows*270), ctx = board.getContext('2d');
  ctx.fillStyle = '#152e34'; ctx.fillRect(0, 0, board.width, board.height);
  for (const [i, [name, frame]] of Object.entries(atlas.frames).entries()) {
    const x = i%columns*400, y = Math.floor(i/columns)*270;
    ctx.fillStyle = i%2 ? '#52716d' : '#294a50'; ctx.fillRect(x+8, y+8, 384, 254);
    label(ctx, name, x+20, y+31);
    label(ctx, frame.usage === 'runtime' ? 'Rendu du jeu' : 'Référence — hors runtime', x+20, y+53, 13);
    const scale = Math.min(355/frame.target[2], 185/36);
    ctx.save(); ctx.translate(x+200, y+247); ctx.scale(scale, scale);
    ctx.drawImage(decoded[key], ...frame.source, ...frame.target); ctx.restore();
  }
  save(board, `${key}-cells.png`, { type: 'Diagnostic source atlas on opaque backgrounds; runtime and reference cells explicitly labeled', atlas: key });
}

const make = (role, values = {}) => ({ id: `diagnostic-${role}-1`, role, x: 0, y: -17, w: 19, h: 34,
  alive: true, safe: false, phase: 'waiting', originalId: null, ...values });
const samples = [make('resident', { id: 'house-a-resident-1', homeId: 'house-a' }), make('resident', { id: 'house-a-resident-2', homeId: 'house-a' }),
  make('refugee', { id: 'aval-refugee-survivor-1' }), make('refugee', { id: 'aval-refugee-survivor-2' }),
  make('crew'), make('harbourmaster'), make('mara', { id: 'aval-mara', originalId: 'PN07', sourceMission: 'MI08' }), make('staff')];
const board = createCanvas(1600, 680), bc = board.getContext('2d');
bc.fillStyle = '#203d42'; bc.fillRect(0, 0, board.width, board.height);
for (const [i, entity] of samples.entries()) {
  const x = i%4*400, y = Math.floor(i/4)*340;
  label(bc, paintedNacreCivilianSelection(entity).frame, x+18, y+30);
  bc.strokeStyle = '#9bb3a2'; bc.beginPath(); bc.moveTo(x+20, y+250); bc.lineTo(x+380, y+250); bc.stroke();
  bc.save(); bc.translate(x+195, y+250); bc.scale(5, 5);
  assert.ok(drawPaintedNacreCivilian(bc, entity, { reducedMotion: true, groundY: 0 })); bc.restore();
  bc.save(); bc.translate(x+325, y+250);
  assert.ok(drawPaintedNacreCivilian(bc, entity, { reducedMotion: true, groundY: 0 })); bc.restore();
  label(bc, 'Ancrage au sol ×5 et taille réelle', x+25, y+287, 14);
}
save(board, 'nacre-civilians-grounding.png', { type: 'Eight current-roster appearances at ×5 and actual world scale on an explicit ground datum' });

const loader = url => loadImage(fileURLToPath(url));
await Promise.all([loadPaintedNacre({ loadImage: loader }), loadPaintedNacreSiteAssets({ loadImage: loader }),
  loadPaintedNacrePeople({ loadImage: loader }), loadPaintedCombat({ loadImage: loader }),
  loadPaintedNacreScenery({ loadImage: loader }),
  loadPaintedWalkers({ loadImage: loader }), loadPaintedWorlds({ loadImage: loader })]);
assert.equal(paintedWorldStatus().PL02.state, 'ready');
assert.ok(Object.values(paintedNacreSceneryStatus()).every(item => item.state === 'ready'));
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
    assert.equal(JSON.stringify(copy), before); assert.ok(calls.length, `${name}: new civilians actually drawn`);
    save(canvas, name, { type: 'Normal Canvas scene reached through public controls; reduced motion', missionId: copy.missionId,
      elapsed: copy.elapsed, civiliansDrawn: calls, ...detail });
    writeFileSync(resolve(output, name.replace('.png', '-state.json')), before+'\n');
  };
  const dike = createGame({ missionId: 'MI06', walkerId: 'WK09', seed: 1847,
    campaignContext: { fuelAvailable: 2, channelOpen: true, refugeesPassed: 12, refugeesLost: 0,
      smugglerVerified: true, bargeCiviliansLost: 0 } });
  const evacuating = s => s.campaign.evacuationOrdered && s.dike.residents.some(person => person.phase === 'evacuating');
  pilotMI06(dike, { stopAt: evacuating }); assert.ok(evacuating(dike));
  capture(dike, 'mi06-residents-evacuating.png', { stage: 'Residents have physically left their homes following the real evacuation call' });
  pilotMI06(dike); assert.equal(dike.status, 'won');
  receipt.publicControls.push({ missionId: 'MI06', result: dike.status, elapsed: dike.elapsed,
    residentsSafe: dike.campaign.residentsSafe, residentsLost: dike.campaign.residentsLost, techniciansAlive: dike.campaign.techniciansAlive });

  const historical = JSON.parse(readFileSync(resolve(root, fixturePath)));
  const departure = beginCampaignMission(parseCampaign(JSON.stringify(historical.completed)), { missionId: 'MI08', walkerId: 'WK09', seed: 1847 }).game;
  const agreements = s => s.departure.boarding.progress > .55 && !s.departure.boarding.assigned;
  pilotMI08(departure, { stopAt: agreements }); assert.ok(agreements(departure));
  assert.ok(departure.departure.mara.contacted);
  capture(departure, 'mi08-quay-agreements.png', { stage: 'Existing groups and Mara physically at the quay before completed allocation or embarkation', historicalFixture: fixturePath });
  const boarding = s => s.campaign.peopleAboard > 5 && s.campaign.peopleAtQuay > 5;
  pilotMI08(departure, { stopAt: boarding }); assert.ok(boarding(departure));
  capture(departure, 'mi08-individual-boarding.png', { stage: 'People still walking or boarding and single factual indicators for occupants already aboard' });
  pilotMI08(departure); assert.equal(departure.status, 'won');
  receipt.publicControls.push({ missionId: 'MI08', result: departure.status, elapsed: departure.elapsed,
    peopleDeparted: departure.campaign.peopleDeparted, peopleArrived: departure.campaign.peopleArrived,
    peopleLocal: departure.campaign.peopleLocal, peopleLost: departure.campaign.peopleLost });
} finally { globalThis.window = oldWindow; globalThis.Image = oldImage; }
receipt.completed = true;
for (const path of sources) assert.equal(sha(readFileSync(resolve(root, path))), receipt.sourceHashes[path], `${path}: unchanged during reception`);
writeFileSync(resolve(output, 'reception.json'), JSON.stringify(receipt, null, 2)+'\n');
console.log(JSON.stringify({ completed: receipt.completed, atlases: receipt.atlases.length, cells: receipt.frames.length,
  runtimeCells: receipt.frames.filter(frame => frame.usage === 'runtime').length,
  referenceCells: receipt.frames.filter(frame => frame.usage === 'reference').length,
  views: receipt.views.length, publicControls: receipt.publicControls, output }, null, 2));
