/** Authored vector exports and authoring sheets, not browser reception evidence. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THYR_ASSET_SPECS, THYR_ASSET_NAMES, thyrAssetGeometry, thyrAssetSVG, drawThyrAsset } from '../src/thyr-assets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'assets/thyr'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = b => createHash('sha256').update(b).digest('hex');
const manifest = { schema: 1, version: '0.10.0', created: '2026-11-11', title: 'Thyr — colonnes, habitats et migration',
  source: 'src/thyr-assets.mjs', generator: 'tools/build-thyr-assets.mjs', runtime: 'src/thyr-renderer.mjs',
  provenance: { author: 'Original code and geometry authored by OpenAI assistant for Darknigthmare', method: 'Code-native original vector geometry shared by SVG exports and Canvas runtime; no generated, traced, stock or third-party artwork.', references: ['data/bible.json', 'docs/CAMPAIGN_FR.md', 'docs/ART_DIRECTION.md'] },
  authority: 'Positions, contacts, damage, herd identities and outcomes are supplied by simulation.mjs. Drawings never alter state or add occupants.',
  limitations: ['Sheets are asset benches, not browser screenshots or human art approval.', 'FL08 membranes are decorative here: air filtering and fire toxicity are not simulated by MI09.', 'FL09 blades react visually to nearby moving migrators, without a new sensory or stealth mechanic.', 'Habitat drawings contain no occupants or invented census.'],
  sourceSha256: sha(readFileSync(resolve(root, 'src/thyr-assets.mjs'))), files: [] };
function write(path, bytes, data) { const target = resolve(output, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes); manifest.files.push({ file: `assets/thyr/${path}`, bytes: Buffer.byteLength(bytes), sha256: sha(bytes), ...data }); }
for (const part of THYR_ASSET_NAMES) {
  const spec = THYR_ASSET_SPECS[part];
  for (const state of spec.states) {
    const g = thyrAssetGeometry({ part, state, progress: state === 'working' ? .5 : .25 });
    write(`${part}-${state}.svg`, thyrAssetSVG(g), { format: 'svg', part, state, canonIds: spec.ids, pivot: g.pivot, anchors: g.anchors, nominalSize: g.size, inkBounds: g.bounds });
  }
}
function text(c, value, x, y, size = 12, color = '#c7d7b4') { c.fillStyle = color; c.font = `${size}px Courier New`; c.fillText(value, x, y); }
function sheet(w, h, title, subtitle) { const canvas = createCanvas(w, h), c = canvas.getContext('2d'); c.fillStyle = '#142d29'; c.fillRect(0, 0, w, h); text(c, title, 36, 44, 25, '#d8d5a5'); text(c, subtitle, 37, 70, 12, '#91af92'); return { canvas, c }; }
const kit = sheet(1680, 1470, 'THYR / PIÈCES DE LA ROUTE DES VIVANTS', 'Source commune SVG + Canvas · FL07 / FU07 / FU08 · aucun habitant ni résultat ajouté par le dessin');
for (const [i, part] of THYR_ASSET_NAMES.entries()) {
  const spec = THYR_ASSET_SPECS[part], x = 38 + (i % 4) * 415, y = 118 + Math.floor(i / 4) * 443;
  text(kit.c, `${spec.ids.join(' / ')} · ${part}`, x, y, 13);
  const scale = Math.min(1.5, 330 / spec.bounds[2], 300 / spec.bounds[3]), baseline = y + 326;
  kit.c.strokeStyle = '#496650'; kit.c.lineWidth = 1; kit.c.beginPath(); kit.c.moveTo(x, baseline); kit.c.lineTo(x + 360, baseline); kit.c.stroke();
  drawThyrAsset(kit.c, { part, x: x + 174, y: baseline - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale });
  text(kit.c, `${spec.states.length} états · pivot 0,0`, x, y + 356, 11, '#9cb69b');
  const states = spec.states.join(' / '); if (states.length > 45) { text(kit.c, spec.states.slice(0, 3).join(' / '), x, y + 377, 10); text(kit.c, spec.states.slice(3).join(' / '), x, y + 394, 10); } else text(kit.c, states, x, y + 377, 10);
}
write('previews/thyr-kit.png', kit.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authoring sheet, varied scales stated per nominal dimensions in manifest' });
const states = sheet(1680, 1300, 'THYR / LES ÉTATS RESTENT MATÉRIELS', 'Les variantes graphiques consomment l’état simulé · aucun transfert, dommage ou décès causé par le renderer');
const rows = [ ['column', ['normal', 'damaged', 'destroyed']], ['suspended-home', ['normal', 'damaged', 'destroyed']], ['longuedorse-adult', ['waiting', 'moving', 'dead']], ['migration-barrier', ['closed', 'working', 'open']], ['fan-colony', ['settled', 'dispersed', 'lost']] ];
for (const [i, [part, variants]] of rows.entries()) {
  const spec = THYR_ASSET_SPECS[part], y = 115 + i * 234, scale = Math.min(1.4, 360 / spec.bounds[2], 158 / spec.bounds[3]);
  text(states.c, part, 38, y + 35, 13, '#d7d3a5');
  for (const [j, state] of variants.entries()) { const x = 415 + j * 450; drawThyrAsset(states.c, { part, state, x, y: y + 167, scale, progress: .5 }); text(states.c, state.toUpperCase(), x - 70, y + 196, 11); }
}
write('previews/thyr-states.png', states.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authored states on a bench; not gameplay or reception evidence' });
manifest.counts = { files: manifest.files.length, svg: manifest.files.filter(f => f.format === 'svg').length, png: manifest.files.filter(f => f.format === 'png').length, components: THYR_ASSET_NAMES.length, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0) };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'); console.log(JSON.stringify(manifest.counts));
