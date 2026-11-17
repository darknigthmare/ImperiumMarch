/** Combined Canvas reception: all production image loaders, public MI01 inputs,
 * and the three 0.15.11 lots in the same unmodified simulation states. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createGame, updateGame, terrainAt } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';
import { paintedImpactParticleFrame } from '../src/painted-particle-impacts.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.argv[2] ? resolve(process.argv[2]) : resolve(root, '../outputs/painted-effects-v01511-qa');
assert.ok(!existsSync(resolve(output, 'receipt.json')), 'Use a new output directory; historical receipts are immutable.');
mkdirSync(output, { recursive: true });
const require = createRequire(import.meta.url), { createCanvas, loadImage } = require('@napi-rs/canvas');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const mainSource = readFileSync(resolve(root, 'src/main.mjs'), 'utf8');
const sourcePaths = ['package.json', 'index.html', '.github/workflows/ci.yml', 'tools/receive-painted-effects-v01511.mjs',
  ...readdirSync(resolve(root, 'src')).filter(name => name.endsWith('.mjs')).map(name => 'src/' + name)];
const sourceHashes = Object.fromEntries(sourcePaths.map(path => [path, sha(readFileSync(resolve(root, path)))]));
const ids = new WeakMap(), decoded = new Map();
const receipt = { version: '0.15.11', createdUtc: new Date().toISOString(), completed: false,
  kind: 'Combined production-loader Canvas reception from public simulation inputs',
  canvas: require('@napi-rs/canvas/package.json').version, node: process.versions.node,
  browserExecuted: false, humanPlaytestPerformed: false, sourceHashes, loaders: [], images: [], scenes: [],
  limitations: ['Canvas reception is distinct from a native browser session or human acceptance.',
    'The public input traces start fresh MI01 simulations and do not teleport, insert or mutate actors or particles.',
    'Atlas availability does not create final material-specific impact systems or additional gameplay.'] };
const loader = { loadImage: async url => {
  const path = fileURLToPath(url), name = relative(root, path);
  if (decoded.has(name)) return decoded.get(name);
  const image = await loadImage(path), bytes = readFileSync(path);
  ids.set(image, name); decoded.set(name, image);
  receipt.images.push({ path: name, bytes: bytes.length, sha256: sha(bytes), width: image.width, height: image.height });
  return image;
} };
const controls = state => ({ brace: true, aimX: 600, aimY: terrainAt(600, state.planetId) + 20 });
function scenario(kind) {
  const options = { missionId: 'MI01', walkerId: 'WK05', difficulty: 'story', seed: 1511 };
  const state = createGame(options), inputs = [];
  const step = input => { inputs.push(input); updateGame(state, 1 / 60, input); };
  if (kind === 'primary-fire') {
    step({ ...controls(state), fire: true });
    assert.ok(state.player.fireCooldown > .1 && state.events.some(event => event.type === 'shot'));
  } else if (kind === 'ground-impact') {
    while (inputs.length < 600 && !state.particles.some(particle => particle.type === 'blast'))
      step({ ...controls(state), secondary: inputs.length === 0 });
    assert.ok(state.events.some(event => event.type === 'explosion'));
    for (let frame = 0; frame < 9; frame++) step({ brace: true });
    assert.ok(state.particles.some(particle => particle.type === 'blast'));
  } else {
    for (let frame = 0; frame < 70; frame++) step({ ...controls(state), fire: true });
    for (let frame = 0; frame < 12; frame++) step({ brace: true });
    step({ brace: true, vent: true });
    assert.ok(state.player.venting && state.events.some(event => event.type === 'shot'));
  }
  return { state, inputs, options };
}
function renderScene(kind, sample, reducedMotion = false) {
  const { state, inputs, options } = sample, before = JSON.stringify(state);
  const canvas = createCanvas(1600, 900), ctx = canvas.getContext('2d'), renderer = new Renderer(canvas);
  renderer.panorama = decoded.get('assets/art/vesper-panorama.png'); renderer.panoramaReady = true;
  let calls = {};
  const original = ctx.drawImage;
  ctx.drawImage = function (...args) { const key = ids.get(args[0]); if (key) calls[key] = (calls[key] || 0) + 1; return original.apply(this, args); };
  const draw = () => { calls = {}; renderer.render(state, { reducedMotion, shake: false }); return sha(canvas.toBuffer('image/png')); };
  const first = draw(), second = draw();
  assert.equal(first, second, kind + ': unchanged simulation time must produce identical paused pixels');
  assert.equal(JSON.stringify(state), before, kind + ': renderer must not mutate simulation');
  assert.equal(calls['assets/art/vesper-panorama.png'], 1);
  assert.equal(calls['assets/painted/vesper-industry/industry.png'], 12);
  assert.ok(calls['assets/painted/vesper/outposts.png'] >= 6);
  const muzzle = state.player.fireCooldown > .1 ? 1 : 0;
  const vent = state.player.venting || state.player.heat > 70 ? 5 : 0;
  assert.equal(calls['assets/painted/walker-fx/muzzle.png'] || 0, muzzle);
  assert.equal(calls['assets/painted/walker-fx/vent.png'] || 0, vent);
  for (const type of ['spark', 'blast']) {
    const expected = state.particles.filter(p => p.type === type && renderer.visible(p.x, 100) && paintedImpactParticleFrame(p)).length;
    assert.equal(calls['assets/painted/particle-impacts/' + type + '.png'] || 0, expected);
  }
  const name = kind + (reducedMotion ? '-reduced-motion' : '');
  ctx.fillStyle = '#16262ee8'; ctx.fillRect(0, 0, 1600, 38);
  ctx.fillStyle = '#eee0c5'; ctx.font = '16px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const label = kind === 'primary-fire' ? 'tir primaire' : kind === 'ground-impact' ? 'impact au sol' : 'purge après tirs';
  ctx.fillText('MI01 · ' + label + ' · trois lots 0.15.11 chargés ensemble · Canvas par commandes publiques' + (reducedMotion ? ' · mouvement réduit' : ''), 16, 25, 1568);
  const png = canvas.toBuffer('image/png');
  writeFileSync(resolve(output, name + '.png'), png);
  writeFileSync(resolve(output, name + '.state.json'), before + '\n');
  receipt.scenes.push({ name, file: name + '.png', stateFile: name + '.state.json',
    sha256: sha(png), stateSha256: sha(before), initialOptions: options, deltaSeconds: 1 / 60,
    inputFrames: inputs.length, inputs, elapsed: state.elapsed, reducedMotion, cameraX: renderer.cameraX,
    heat: state.player.heat, venting: state.player.venting, primaryCooldown: state.player.fireCooldown,
    particles: state.particles.reduce((counts, p) => { counts[p.type] = (counts[p.type] || 0) + 1; return counts; }, {}),
    drawImageCalls: calls, pausedRasterSha256: first, pausedPixelsIdentical: true, stateUnchanged: true });
}

const previousImage = globalThis.Image, previousWindow = globalThis.window;
try {
  const imports = [...mainSource.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"](\.\/painted-[^'"]+\.mjs)['"];/gm)];
  await Promise.all(imports.map(async match => {
    const names = match[1].split(',').map(name => name.trim()).filter(name => name.startsWith('loadPainted'));
    if (!names.length) return;
    const path = resolve(root, 'src', match[2]), module = await import(pathToFileURL(path).href);
    for (const name of names) {
      const status = await module[name](loader);
      // Cerbere reports its single atlas directly; other production loaders
      // return a map of atlas states. Receive both existing API contracts.
      const states = typeof status.state === 'string' ? [status] : Object.values(status);
      assert.ok(states.length > 0 && states.every(item => item.state === 'ready'), name + ': every requested image must decode');
      receipt.loaders.push({ module: relative(root, path), function: name, status });
    }
  }));
  await loader.loadImage(pathToFileURL(resolve(root, 'assets/art/vesper-panorama.png')).href);
  assert.equal(receipt.loaders.length, 25, '24 atlas lots plus the separate world panorama loader');
  assert.equal(decoded.size, 99, '95 atlas PNGs plus four separate panoramas');
  globalThis.Image = class {}; globalThis.window = { devicePixelRatio: 1 };
  renderScene('primary-fire', scenario('primary-fire'));
  renderScene('ground-impact', scenario('ground-impact'));
  const purge = scenario('purge'); renderScene('purge', purge); renderScene('purge', purge, true);
  for (const [path, hash] of Object.entries(sourceHashes)) assert.equal(sha(readFileSync(resolve(root, path))), hash, path + ': source changed during reception');
  receipt.completed = true;
  console.log(JSON.stringify({ completed: true, output, decodedImages: decoded.size, loaders: receipt.loaders.length, scenes: receipt.scenes.length }));
} catch (error) { receipt.error = error.stack || String(error); throw error; }
finally {
  globalThis.Image = previousImage; globalThis.window = previousWindow;
  receipt.finishedUtc = new Date().toISOString();
  writeFileSync(resolve(output, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
}
