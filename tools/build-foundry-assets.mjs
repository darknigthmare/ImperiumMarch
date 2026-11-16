/** Original Kharon authoring sheets. They are not browser or human playtest evidence. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOUNDRY_ASSET_SPECS, FOUNDRY_ASSET_NAMES, foundryAssetGeometry, foundryAssetSVG, drawFoundryAsset } from '../src/foundry-assets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'assets/foundry'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = { schema: 1, version: '0.14.1', created: new Date().toISOString().slice(0, 10),
  title: 'Kharon — porteur, circuits thermiques et provenance industrielle', source: 'src/foundry-assets.mjs',
  generator: 'tools/build-foundry-assets.mjs', runtime: 'src/foundry-renderer.mjs',
  provenance: { author: 'Original vector geometry authored for Darknigthmare',
    method: 'Original code-native vector geometry shared by SVG exports and the Canvas runtime. Reconstruction from retained requirements, not restoration of lost 0.14 image bytes.',
    references: ['data/bible.json', 'docs/CAMPAIGN_FR.md', 'docs/ART_DIRECTION.md'] },
  authority: 'Carrier, four wheel contacts, cargo positions, partial transfers, thermal clocks and retained copies belong to the simulation. Visual geometry never moves cargo, opens valves or grants PT03.',
  limitations: ['These are authoring sheets at stated varied scales, not screenshots of a browser or human art approval.',
    'The industrial district is a playable prototype. The complete Kharon environment and finished animation production remain open.',
    'The former 0.14 assets were lost; these files are a new reconstruction with new hashes and verification.'],
  sourceSha256: sha(readFileSync(resolve(root, 'src/foundry-assets.mjs'))), files: [] };
function write(path, bytes, data) { const target = resolve(output, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes); manifest.files.push({ file: `assets/foundry/${path}`, bytes: Buffer.byteLength(bytes), sha256: sha(bytes), ...data }); }
for (const part of FOUNDRY_ASSET_NAMES) {
  const spec = FOUNDRY_ASSET_SPECS[part];
  for (const state of spec.states) {
    const g = foundryAssetGeometry({ part, state, progress: .5 });
    write(`${part}-${state}.svg`, foundryAssetSVG(g), { format: 'svg', part, state, canonIds: spec.ids, pivot: g.pivot, anchors: g.anchors, nominalSize: g.size, inkBounds: g.bounds });
  }
}
function text(c, value, x, y, size = 12, color = '#c2d0bc') { c.fillStyle = color; c.font = `${size}px Courier New`; c.fillText(value, x, y); }
function sheet(width, height, title, subtitle) { const canvas = createCanvas(width, height), c = canvas.getContext('2d'); c.fillStyle = '#1c3036'; c.fillRect(0, 0, width, height); text(c, title, 38, 45, 25, '#e4c58d'); text(c, subtitle, 39, 74, 12); return { canvas, c }; }
const kit = sheet(1800, 1520, 'KHARON / PIÈCES DE RECHANGE', 'MI13 · géométrie SVG + Canvas originale · porteur, chaleur et réception matérielle');
for (const [i, part] of FOUNDRY_ASSET_NAMES.entries()) {
  const spec = FOUNDRY_ASSET_SPECS[part], x = 38 + (i % 3) * 580, y = 126 + Math.floor(i / 3) * 455;
  text(kit.c, `${spec.ids.join(' / ')} · ${part}`, x, y, 14, '#d6c6a3');
  const scale = Math.min(1.6, 390 / spec.bounds[2], 282 / spec.bounds[3]), baseline = y + 307;
  kit.c.strokeStyle = '#4e6c6d'; kit.c.lineWidth = 1; kit.c.beginPath(); kit.c.moveTo(x, baseline); kit.c.lineTo(x + 475, baseline); kit.c.stroke();
  drawFoundryAsset(kit.c, { part, x: x + 235, y: baseline - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale });
  text(kit.c, `${spec.states.length} états · pivot au sol · échelle ${scale.toFixed(2)}`, x, y + 348, 11);
  text(kit.c, spec.states.slice(0, 3).join(' / '), x, y + 371, 11); if (spec.states.length > 3) text(kit.c, spec.states.slice(3).join(' / '), x, y + 389, 11);
}
write('previews/foundry-kit.png', kit.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authoring sheet at varied scales, not gameplay or browser evidence' });
const states = sheet(1840, 2090, 'KHARON / ÉTATS MATÉRIELS', 'Planches de production · les positions, dégâts et opérations viennent de la simulation');
for (const [i, part] of FOUNDRY_ASSET_NAMES.entries()) {
  const spec = FOUNDRY_ASSET_SPECS[part], y = 104 + i * 244, scale = Math.min(1.2, 250 / spec.bounds[2], 155 / spec.bounds[3]);
  text(states.c, `${spec.ids.join(' / ')} · ${part}`, 38, y + 8, 13, '#dbc59a');
  for (const [j, state] of spec.states.entries()) {
    const x = 200 + j * 352;
    drawFoundryAsset(states.c, { part, state, x, y: y + 178 - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale, progress: .5 });
    text(states.c, state.toUpperCase(), x - 69, y + 208, 11);
  }
}
write('previews/foundry-states.png', states.canvas.toBuffer('image/png'), { format: 'png', kind: 'Material state authoring bench, not browser or human reception' });
manifest.counts = { components: FOUNDRY_ASSET_NAMES.length, files: manifest.files.length, svg: manifest.files.filter(f => f.format === 'svg').length,
  png: manifest.files.filter(f => f.format === 'png').length, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0) };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'); console.log(JSON.stringify(manifest.counts));
