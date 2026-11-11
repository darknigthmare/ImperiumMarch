/**
 * Reproducible MI01 Canvas-only captures. These are NOT browser screenshots.
 *
 * Uses the production simulation and Renderer. Every pictured state is reached
 * with public movement/combat/interaction commands, without state/foot edits.
 * The optional @napi-rs/canvas dependency must already be installed; no downloads.
 *
 * Run: node tools/render-campaign-previews.mjs
 */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createGame, updateGame, commandGame } from '../src/simulation.mjs';
import { Renderer } from '../src/renderer.mjs';

let canvasAPI;
try {
  canvasAPI = createRequire(import.meta.url)('@napi-rs/canvas');
} catch {
  const installedModules = process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
  if (!installedModules) throw new Error('Optional @napi-rs/canvas is unavailable and CODEX_PRIMARY_RUNTIME_NODE_MODULES is unset. No package will be installed.');
  canvasAPI = createRequire(resolve(installedModules, 'package.json'))('@napi-rs/canvas');
}
const { createCanvas, loadImage } = canvasAPI;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'docs/previews');
const panoramaPath = resolve(root, 'assets/art/vesper-panorama.png');
if (!existsSync(panoramaPath)) throw new Error(`Missing production panorama: ${panoramaPath}`);
globalThis.window = { devicePixelRatio: 1 };
globalThis.Image = class LocalImagePlaceholder { set src(value) { this.source = value; } };
const panorama = await loadImage(panoramaPath);
mkdirSync(output, { recursive: true });

function evolveToCapture(entry) {
  const state = createGame({ missionId: 'MI01', walkerId: 'WK01', difficulty: 'normal', seed: 1847 });
  for (let frame = 0; frame < 24000 && state.status === 'playing'; frame++) {
    if (entry.reached(state)) return { state, frames: frame };
    if (state.decision.active) { commandGame(state, 'choice', 'defy'); continue; }
    const p = state.player, a = state.campaign;
    const target = state.enemies.filter(e => !e.dead && e.active && Math.abs(e.x - p.x) < 1050)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const secure = entry.route === 'secured' && !a.passageSecured;
    const destination = secure ? state.mission.passage.stationX : !state.evidence.collected ? state.evidence.x : !state.decision.resolved ? state.mission.decisionX : state.extraction.x;
    let move = Math.abs(destination - p.x) > 35 ? Math.sign(destination - p.x) : 0;
    if (secure && Math.abs(p.x - state.mission.passage.stationX) < 70) { commandGame(state, 'interact'); move = 0; }
    if (target && Math.abs(target.x - p.x) < 680) move = 0;
    if (a.filtersDelivered && !state.evidence.collected && Math.abs(p.x - state.evidence.x) < 190) {
      if (!state.evidence.scanning) commandGame(state, 'interact');
      move = 0;
    }
    if (state.evidence.collected && !state.decision.resolved && Math.abs(p.x - state.mission.decisionX) < 280) { commandGame(state, 'interact'); move = 0; }
    if (p.x > state.convoy.x + 360 && move > 0 && !state.convoy.arrived) move = 0;
    const vent = p.heat > 75 || p.overheated;
    updateGame(state, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent,
      secondary: Boolean(target) && !vent && target.hp > 160, aimX: target?.x, aimY: target?.y });
  }
  throw new Error(`Capture ${entry.name} was not reached through public controls; status=${state.status}, phase=${state.campaign.phase}.`);
}

const entries = [
  { name: 'secured', route: 'secured', description: 'Vigie traversant la conduite sur des dalles déployées, avec un contact réel de pied sur le passage protégé.',
    reached: s => s.campaign.passageSecured && s.player.feet.some(f => f.contact && f.x >= s.mission.passage.pipeFrom && f.x <= s.mission.passage.pipeTo) },
  { name: 'direct', route: 'direct', description: 'Premier contact réel rompant la conduite exposée ; fuite et arrêt du convoi enregistrés dans la simulation.',
    reached: s => !s.campaign.pipeIntact && s.convoy.waitTime > 0 },
  { name: 'delivery', route: 'secured', description: 'Camion arrivé vivant au poste 42 ; les vingt-quatre caisses sont livrées, avant la lecture du manifeste.',
    reached: s => s.campaign.filtersDelivered && s.convoy.arrived && !s.campaign.manifestRead },
];

const manifest = {
  title: 'ORDRE DE CENDRE', version: '0.2.0', missionId: 'MI01',
  type: 'Canvas-only production renderer captures from public-control simulation runs',
  engine: '@napi-rs/canvas (Skia)', simulationSeed: 1847, timeStep: 1 / 60,
  limitations: 'No browser was launched. These captures do not include the HTML HUD, menus, CSS, dialogs, input events, audio, fullscreen or browser performance.',
  stateMethod: 'createGame + commandGame + updateGame only; no positions, feet, objectives, damage or outcomes manufactured for captures.',
  artwork: 'assets/art/vesper-panorama.png', files: [],
};

for (const entry of entries) {
  const { state, frames } = evolveToCapture(entry);
  const canvas = createCanvas(1600, 900), renderer = new Renderer(canvas);
  renderer.panorama = panorama; renderer.panoramaReady = true;
  renderer.render(state, { shake: false, reducedMotion: true });
  const buffer = canvas.toBuffer('image/png');
  const filename = `mi01-${entry.name}.png`;
  writeFileSync(resolve(output, filename), buffer);
  manifest.files.push({
    file: filename, kind: 'Canvas simulation capture', description: entry.description,
    width: 1600, height: 900, bytes: buffer.length, sha256: createHash('sha256').update(buffer).digest('hex'),
    walkerId: state.walkerId, frames, elapsed: state.elapsed, playerX: state.player.x,
    campaign: state.campaign,
    convoy: { x: state.convoy.x, hp: state.convoy.hp, maxHp: state.convoy.maxHp, arrived: state.convoy.arrived, waitTime: state.convoy.waitTime },
    feet: state.player.feet.map(f => ({ id: f.id, x: f.x, y: f.y, contact: f.contact, phase: f.phase })),
    stats: state.stats,
  });
  console.log(`${filename}: ${(buffer.length / 1024).toFixed(0)} KiB, ${state.elapsed.toFixed(2)} simulation seconds; ${entry.description}`);
}
writeFileSync(resolve(output, 'campaign-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('3 Canvas-only MI01 captures saved. These are not browser screenshots and contain no HTML HUD.');
