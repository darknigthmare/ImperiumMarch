/** MI10 authoring sheets. These exports are not browser screenshots. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHEMICAL_ASSET_SPECS, CHEMICAL_ASSET_NAMES, chemicalAssetGeometry, chemicalAssetSVG, drawChemicalAsset } from '../src/chemical-assets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'assets/chemical'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = b => createHash('sha256').update(b).digest('hex');
const manifest = { schema: 1, version: '0.11.0', created: '2026-11-11', title: 'Thyr — cuves, canaux et prélèvement',
  source: 'src/chemical-assets.mjs', generator: 'tools/build-chemical-assets.mjs', runtime: 'src/chemical-renderer.mjs',
  provenance: { author: 'Original code and geometry authored by OpenAI assistant for Darknigthmare', method: 'Original code-native vector geometry shared by SVG exports and Canvas runtime; no generated, traced, stock or third-party artwork.', references: ['data/bible.json', 'docs/CAMPAIGN_FR.md', 'docs/ART_DIRECTION.md'] },
  authority: 'Positions, work progress, tank condition, pollution, habitats and retained evidence are supplied by simulation.mjs. Drawings do not perform operations or create people.',
  limitations: ['Authoring sheets use varied scales and are not gameplay captures or human art approval.', 'A displayed vial only illustrates the sampling state. PT02 is established by the simulation and validated campaign receipt.', 'Village drawings contain no invented occupants or population counts.', 'This lot does not finish the fauna, flora or all environments of Thyr.'],
  sourceSha256: sha(readFileSync(resolve(root, 'src/chemical-assets.mjs'))), files: [] };
function write(path, bytes, data) { const target = resolve(output, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes); manifest.files.push({ file: `assets/chemical/${path}`, bytes: Buffer.byteLength(bytes), sha256: sha(bytes), ...data }); }
for (const part of CHEMICAL_ASSET_NAMES) {
  const spec = CHEMICAL_ASSET_SPECS[part];
  for (const state of spec.states) {
    const g = chemicalAssetGeometry({ part, state, progress: .5 });
    write(`${part}-${state}.svg`, chemicalAssetSVG(g), { format: 'svg', part, state, canonIds: spec.ids, pivot: g.pivot, anchors: g.anchors, nominalSize: g.size, inkBounds: g.bounds });
  }
}
function text(c, value, x, y, size = 12, color = '#c7d7b4') { c.fillStyle = color; c.font = `${size}px Courier New`; c.fillText(value, x, y); }
function sheet(w, h, title, subtitle) { const canvas = createCanvas(w, h), c = canvas.getContext('2d'); c.fillStyle = '#152f2a'; c.fillRect(0, 0, w, h); text(c, title, 38, 46, 25, '#d8d5a5'); text(c, subtitle, 39, 74, 12, '#a5bb9b'); return { canvas, c }; }
const kit = sheet(1680, 1040, 'THYR / LE CHAMP QUE PERSONNE N’A SEMÉ', 'MI10 · Géométrie SVG + Canvas · cuves, opérations, prélèvement et eau du village');
for (const [i, part] of CHEMICAL_ASSET_NAMES.entries()) {
  const spec = CHEMICAL_ASSET_SPECS[part], x = 38 + (i % 3) * 550, y = 120 + Math.floor(i / 3) * 440;
  text(kit.c, `${spec.ids.join(' / ')} · ${part}`, x, y, 14);
  const scale = Math.min(1.6, 390 / spec.bounds[2], 285 / spec.bounds[3]), baseline = y + 312;
  kit.c.strokeStyle = '#496650'; kit.c.lineWidth = 1; kit.c.beginPath(); kit.c.moveTo(x, baseline); kit.c.lineTo(x + 475, baseline); kit.c.stroke();
  drawChemicalAsset(kit.c, { part, x: x + 235, y: baseline - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale });
  text(kit.c, `${spec.states.length} états · pivot au sol · échelle ${scale.toFixed(2)}`, x, y + 349, 11, '#a4bb99');
  text(kit.c, spec.states.slice(0, 3).join(' / '), x, y + 372, 11);
  if (spec.states.length > 3) text(kit.c, spec.states.slice(3).join(' / '), x, y + 390, 11);
}
write('previews/chemical-kit.png', kit.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authoring sheet; varied scales stated in its labels and nominal dimensions in manifest' });
const states = sheet(1680, 1370, 'THYR / DE LA FUITE AU PRÉLÈVEMENT', 'États matériels du prototype · aucune opération n’est accomplie par son illustration');
const rows = [['chemical-tank', ['unknown', 'leaking', 'sealed', 'destroyed']], ['canal-junction', ['open', 'covering', 'covered', 'contaminated']], ['sampling-rig', ['idle', 'working', 'secured', 'lost']], ['batch-ledger', ['unread', 'copied', 'lost']], ['field-valve', ['normal', 'working', 'operated', 'destroyed']], ['village-supply', ['habitable', 'contaminated', 'destroyed']]];
for (const [i, [part, variants]] of rows.entries()) {
  const spec = CHEMICAL_ASSET_SPECS[part], y = 110 + i * 208, scale = Math.min(1.3, 280 / spec.bounds[2], 133 / spec.bounds[3]);
  text(states.c, part, 38, y + 32, 12, '#d7d3a5');
  for (const [j, state] of variants.entries()) { const x = 380 + j * 358; drawChemicalAsset(states.c, { part, state, x, y: y + 141, scale, progress: .5 }); text(states.c, state.toUpperCase(), x - 68, y + 171, 11); }
}
write('previews/chemical-states.png', states.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authored states on a bench, not a browser or gameplay reception' });
manifest.counts = { files: manifest.files.length, svg: manifest.files.filter(f => f.format === 'svg').length, png: manifest.files.filter(f => f.format === 'png').length, components: CHEMICAL_ASSET_NAMES.length, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0) };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'); console.log(JSON.stringify(manifest.counts));
