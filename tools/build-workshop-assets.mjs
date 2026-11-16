/** Original MI14 geometry exports. Authoring sheets are not browser captures. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKSHOP_ASSET_SPECS, WORKSHOP_ASSET_NAMES, workshopAssetGeometry, workshopAssetSVG, drawWorkshopAsset } from '../src/workshop-assets.mjs';
import { drawProductionGeometry } from '../src/production-assets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'assets/workshop'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = { schema: 1, version: '0.15.0', created: new Date().toISOString().slice(0, 10),
  title: 'Kharon — Les mains noires : piquet, refroidisseur et atelier', source: 'src/workshop-assets.mjs',
  generator: 'tools/build-workshop-assets.mjs', runtime: 'src/workshop-renderer.mjs',
  provenance: { author: 'Original geometry authored for Darknigthmare',
    method: 'Code-native original vector shapes shared by runtime Canvas, SVG export and transparent PNG rasterization.',
    references: ['data/bible.json', 'docs/CAMPAIGN_MISSION_14.md', 'docs/ART_DIRECTION.md'] },
  authority: 'Simulation supplies all person positions, common gallery route, losses, machine state, jobs and temperature. The security unit is drawn only after activation and its cannon follows enemyFire centre/half-width origin.',
  limitations: ['Prototype assets and authoring sheets are not final production art or human visual approval.',
    'The 33 static states include four mechanic variants. They are not a complete animation sheet: walking and fan motion are procedural.',
    'Dormant and warning states are authoring references; the in-game unit remains absent before alert.ready.'],
  sourceSha256: sha(readFileSync(resolve(root, 'src/workshop-assets.mjs'))), files: [] };
function write(path, bytes, data) {
  const target = resolve(output, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes);
  manifest.files.push({ file: `assets/workshop/${path}`, bytes: Buffer.byteLength(bytes), sha256: sha(bytes), ...data });
}
for (const part of WORKSHOP_ASSET_NAMES) {
  const spec = WORKSHOP_ASSET_SPECS[part];
  for (const mechanic of part === 'worker' ? [false, true] : [false]) for (const state of spec.states) {
    const g = workshopAssetGeometry({ part, state, progress: .5, mechanic }), name = `${part}${mechanic ? '-mechanic' : ''}-${state}`;
    const detail = { part, state, mechanic, canonIds: spec.ids, pivot: g.pivot, anchors: g.anchors, nominalSize: g.size, inkBounds: g.bounds };
    write(`svg/${name}.svg`, workshopAssetSVG(g), { format: 'svg', ...detail });
    const [x, y, w, h] = g.bounds, scale = 3, canvas = createCanvas(w * scale, h * scale), c = canvas.getContext('2d');
    c.scale(scale, scale); c.translate(-x, -y); drawProductionGeometry(c, g);
    write(`png/${name}.png`, canvas.toBuffer('image/png'), { format: 'png', kind: 'Transparent individual sprite rasterized from the shared geometry', scale, ...detail });
  }
}
function text(c, value, x, y, size = 12, color = '#c2d0bc') { c.fillStyle = color; c.font = `${size}px Courier New`; c.fillText(value, x, y); }
function sheet(width, height, title, subtitle) {
  const canvas = createCanvas(width, height), c = canvas.getContext('2d'); c.fillStyle = '#192d35'; c.fillRect(0, 0, width, height);
  c.fillStyle = '#d9ad6e'; c.fillRect(38, 27, 7, 47); text(c, title, 61, 48, 25, '#e4c58d'); text(c, subtitle, 62, 77, 12);
  return { canvas, c };
}
const kit = sheet(1800, 1340, 'KHARON / LES MAINS NOIRES', 'MI14 · objets et personnes · source unique SVG / PNG / Canvas · prototype');
const displayNames = { worker: 'Ouvrier et mécanicien', cooler: 'Refroidisseur d’atelier', valve: 'Vanne de circuit', 'disputed-lot': 'Lot contesté', 'workshop-control': 'Commande de production', 'security-automaton': 'Automate de sécurité', 'picket-post': 'Poste du piquet' };
for (const [i, part] of WORKSHOP_ASSET_NAMES.entries()) {
  const spec = WORKSHOP_ASSET_SPECS[part], x = 38 + (i % 3) * 580, y = 130 + Math.floor(i / 3) * 385;
  text(kit.c, displayNames[part], x, y, 18, '#dbc7a0'); text(kit.c, `${spec.ids.join(' / ')} · ${part}`, x, y + 23, 11, '#8fa99f');
  const scale = Math.min(2.3, 370 / spec.bounds[2], 226 / spec.bounds[3]), baseline = y + 280;
  kit.c.strokeStyle = '#48656b'; kit.c.lineWidth = 1; kit.c.beginPath(); kit.c.moveTo(x, baseline); kit.c.lineTo(x + 490, baseline); kit.c.stroke();
  drawWorkshopAsset(kit.c, { part, x: x + (part === 'worker' ? 182 : 245), y: baseline - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale });
  if (part === 'worker') drawWorkshopAsset(kit.c, { part, x: x + 320, y: baseline - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale, mechanic: true });
  text(kit.c, `${spec.states.length} états · pivot au sol · échelle ${scale.toFixed(2)}`, x, y + 313, 11);
  text(kit.c, spec.states.join(' / '), x, y + 337, 10, '#b3bfae');
}
text(kit.c, '33 SVG + 33 PNG individuels transparents · 7 composants · géométrie originale', 635, 1225, 17, '#d5bd91');
text(kit.c, 'Planches de fabrication : ces images ne sont pas des captures de navigateur.', 635, 1255, 12, '#9bb3a7');
write('previews/workshop-kit.png', kit.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authoring sheet at varied scales; not gameplay or browser evidence' });

const rows = [...WORKSHOP_ASSET_NAMES.map(part => ({ part, mechanic: false })), { part: 'worker', mechanic: true }];
const states = sheet(1800, 1900, 'KHARON / ÉTATS MATÉRIELS', 'Dégâts, opérations et personnes · les états n’accordent aucun résultat dans la simulation');
for (const [i, { part, mechanic }] of rows.entries()) {
  const spec = WORKSHOP_ASSET_SPECS[part], y = 114 + i * 219, scale = Math.min(1.6, 240 / spec.bounds[2], 135 / spec.bounds[3]);
  text(states.c, `${displayNames[part]}${mechanic ? ' · mécanicien' : ''}`, 38, y + 4, 14, '#dbc59a');
  for (const [j, state] of spec.states.entries()) {
    const x = 195 + j * 350;
    drawWorkshopAsset(states.c, { part, state, mechanic, x, y: y + 157 - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale, progress: .5 });
    text(states.c, state.toUpperCase(), x - 65, y + 184, 11);
  }
}
write('previews/workshop-states.png', states.canvas.toBuffer('image/png'), { format: 'png', kind: 'Material state authoring sheet; not human art approval' });
manifest.counts = { components: WORKSHOP_ASSET_NAMES.length, states: manifest.files.filter(f => f.format === 'svg').length,
  files: manifest.files.length, svg: manifest.files.filter(f => f.format === 'svg').length,
  transparentSprites: manifest.files.filter(f => f.format === 'png' && f.part).length, sheets: 2,
  bytes: manifest.files.reduce((n, f) => n + f.bytes, 0) };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'); console.log(JSON.stringify(manifest.counts));
