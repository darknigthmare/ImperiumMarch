/** Export the Sentinelle S-3 production geometry. Asset bench only: no browser,
 * gameplay or art-approval claim. Feet stay simulation-owned.
 * The 0.9 lot in assets/production/ is historical and is not rewritten here.
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { SENTINELLE_RIG, PRODUCTION_PART_NAMES, productionPartGeometry, productionGeometrySVG,
  productionWalkerParts } from '../src/production-assets.mjs';
import { PLAYABLE_WALKERS } from '../src/content.mjs';
import { createGame, updateGame } from '../src/simulation.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'assets/production/sentinelle');
const walker = PLAYABLE_WALKERS.find(item => item.id === SENTINELLE_RIG.id);
if (!walker) throw new Error('WK14 is not a playable chassis');

const manifest = {
  schema: 1, version: '0.15.12', created: '2026-11-17',
  title: 'Ordre de Cendre — Sentinelle S-3, pièces vectorielles de production',
  source: 'src/production-assets.mjs', generator: 'tools/build-sentinelle-assets.mjs',
  provenance: {
    author: 'OpenAI assistant, original code and geometry for Darknigthmare',
    method: 'Authored vector geometry. No image generation, stock images, traced references or third-party artwork.',
    rights: 'Original project assets; no third-party art dependency.',
    inputs: ['docs/ART_DIRECTION.md', 'docs/MARCHEURS_FR.md', 'src/content.mjs', 'src/production-assets.mjs', 'src/simulation.mjs'],
    prompt: 'Rendre la Sentinelle S-3 pilotable : géométrie de production, contacts réels, assignation au départ.',
  },
  units: '1 local vector unit = 1 game-world unit; x/y is a named mechanical pivot.',
  constraints: [
    'Feet, collisions and damage remain simulation-owned; this lot adds no contact rule.',
    'Only WK14 leaves the design catalogue; WK13 and WK15–WK20 stay non-playable.',
    'No painted atlas exists for WK14; the runtime keeps its vector parts as the fallback.',
    'These SVGs are an authoring bench, not a browser screenshot or a final art approval.',
  ],
  files: [], rigs: [],
};
const sha = data => createHash('sha256').update(data).digest('hex');
function write(file, data, info = {}) {
  const path = resolve(output, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data);
  manifest.files.push({ file: `assets/production/sentinelle/${file}`, bytes: Buffer.byteLength(data), sha256: sha(data), ...info });
}
function vector(file, geometry, info = {}) {
  write(file, productionGeometrySVG(geometry), { format: 'svg', pivot: geometry.pivot,
    nominalSize: geometry.size, inkBounds: geometry.bounds, part: geometry.part, state: geometry.state,
    walkerId: SENTINELLE_RIG.id, assets: SENTINELLE_RIG.assets, ...info });
}

const partsMeta = [];
for (const part of PRODUCTION_PART_NAMES) for (const back of [false, true]) {
  const geometry = productionPartGeometry({ walkerId: SENTINELLE_RIG.id, part, back });
  vector(`parts/${part}-${back ? 'far' : 'near'}.svg`, geometry, { layer: back ? 'far' : 'near' });
  if (!back) partsMeta.push({ part, size: geometry.size, pivot: geometry.pivot, bounds: geometry.bounds });
}
for (const state of ['damaged', 'repaired', 'braced'])
  vector(`parts/hull-${state}.svg`, productionPartGeometry({ walkerId: SENTINELLE_RIG.id, part: 'hull', state }));
for (const state of ['hit', 'damaged', 'repaired'])
  vector(`parts/radiator-${state}.svg`, productionPartGeometry({ walkerId: SENTINELLE_RIG.id, part: 'radiator', state }));
for (let i = 0; i <= 4; i++)
  vector(`parts/radiator-repair-${i}s.svg`, productionPartGeometry({ walkerId: SENTINELLE_RIG.id, part: 'radiator', state: 'repairing', progress: i / 4 }),
    { timeSeconds: i, meaning: 'Authoring sample of the four-second repair; runtime follows repairProgress.' });

function localPlayer(pose) {
  const game = createGame({ walkerId: SENTINELLE_RIG.id, missionId: 'MI01', seed: 1847 });
  if (pose === 'walk') for (let i = 0; i < 18; i++) updateGame(game, 1 / 60, { move: 1 });
  if (pose === 'brace') updateGame(game, 1 / 60, { brace: true });
  const p = structuredClone(game.player), gx = p.x, gy = p.groundY;
  p.x = 0; p.y -= gy; p.groundY = 0;
  for (const foot of p.feet) { foot.x -= gx; foot.y -= gy; }
  if (pose === 'stand-left') { p.facing = -1; p.aimAngle = Math.PI; }
  if (pose === 'aim-up') p.aimAngle = -Math.PI / 5;
  if (pose === 'damaged') { p.hull = p.maxHull * .3; p.feet[0].health = 30; p.radiator.health = 25; }
  return p;
}

function assemblySVG(p, pose) {
  const parts = productionWalkerParts(p, walker), groups = [];
  for (const part of parts) {
    const geometry = productionPartGeometry(part);
    geometry.id = `WK14-${pose}-${part.name}`;
    const svg = productionGeometrySVG(geometry, { technical: false, mirrorText: part.facing === -1 });
    let inner = svg.slice(svg.indexOf('<defs>'), svg.lastIndexOf('</svg>'));
    inner = inner.replaceAll('paint-', `${part.name}-paint-`);
    const sx = (part.width ?? geometry.size[0]) / geometry.size[0] * (part.facing === -1 ? -1 : 1);
    const sy = (part.height ?? geometry.size[1]) / geometry.size[1];
    const deg = (part.rotation || 0) * 180 / Math.PI;
    groups.push(`<g id="${part.name}" data-pivot="${part.x},${part.y}" data-layer="${part.back ? 'far' : 'near'}" transform="translate(${part.x} ${part.y}) rotate(${deg}) scale(${sx} ${sy})">${inner}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -320 500 345"><title>WK14 ${pose} — assembly from actual simulation contacts</title><metadata>${JSON.stringify({
    walker: SENTINELLE_RIG.id, pose, units: 'game-world-unit', source: 'src/production-assets.mjs',
    contacts: p.feet.map(foot => ({ id: foot.id, x: foot.x, y: foot.y, contact: foot.contact })),
    note: 'Authoring reference, not a game screenshot',
  })}</metadata>${groups.join('')}<path d="M-240 1H240" stroke="#819487" stroke-width=".6"/></svg>\n`;
}

const poses = [];
for (const pose of ['stand-right', 'stand-left', 'brace', 'walk', 'aim-up', 'damaged']) {
  const p = localPlayer(pose);
  const file = `assembly-${pose}.svg`;
  write(file, assemblySVG(p, pose), { format: 'svg', walkerId: SENTINELLE_RIG.id, pose, assets: SENTINELLE_RIG.assets,
    sourceState: pose === 'damaged' ? 'Explicit art diagnostic, not gameplay proof' : 'Simulation-created contacts through public update inputs',
    collisionAuthority: 'src/simulation.mjs', groundY: 0 });
  poses.push({ file: `assets/production/sentinelle/${file}`, pose,
    feet: p.feet.map(foot => ({ id: foot.id, side: foot.side, group: foot.group, x: foot.x, y: foot.y, contact: foot.contact })) });
}

const rigData = { ...SENTINELLE_RIG, playable: true, savedWalkerId: walker.id,
  stats: { hull: walker.hull, stride: walker.stride, stepTime: walker.stepTime, speed: walker.speed,
    cooling: walker.cooling, armor: walker.armor, damage: walker.damage, fireRate: walker.fireRate,
    shotHeat: walker.shotHeat, ammo: walker.ammo, rockets: walker.rockets, weight: walker.weight },
  unit: 'game-world-unit', rootPivot: [0, 0], parts: partsMeta,
  footInstances: SENTINELLE_RIG.offsets.map((homeOffset, index) => ({ id: `foot-${index}`, homeOffset,
    depth: index < SENTINELLE_RIG.legs / 2 ? 'far' : 'near', group: index % 2,
    chain: ['hip', 'upper', 'knee', 'lower', 'foot'], contactAuthority: 'player.feet[index]' })),
  hierarchy: ['far leg', 'cradle and hull', 'near leg', 'independent turret', 'rear radiator'],
  damage: 'Health is supplied by simulation; art states do not inflict damage.', poses };
write('rig.json', JSON.stringify(rigData, null, 2) + '\n', { format: 'json', walkerId: SENTINELLE_RIG.id, assets: [...SENTINELLE_RIG.assets, 'AS30', 'AS38'] });
manifest.rigs.push(rigData);

manifest.sourceSha256 = sha(readFileSync(resolve(root, 'src/production-assets.mjs')));
manifest.contentSha256 = sha(readFileSync(resolve(root, 'src/content.mjs')));
manifest.counts = { files: manifest.files.length, svg: manifest.files.filter(f => f.format === 'svg').length,
  rigs: manifest.rigs.length, parts: PRODUCTION_PART_NAMES.length, assemblies: poses.length };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.counts));
