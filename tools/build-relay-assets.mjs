/** Rebuilt MI12 authoring exports. These sheets are not browser screenshots. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELAY_ASSET_SPECS, RELAY_ASSET_NAMES, relayAssetGeometry, relayAssetSVG, drawRelayAsset } from '../src/relay-assets.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'assets/relay'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = { schema: 1, version: '0.14.1', created: '2026-11-12', title: 'Thyr — les trois relais et le Prétoire',
  source: 'src/relay-assets.mjs', generator: 'tools/build-relay-assets.mjs', runtime: 'src/relay-renderer.mjs',
  provenance: { author: 'Original code and geometry authored by OpenAI assistant for Darknigthmare', method: 'Reconstructed code-native vector geometry shared between SVG exports and Canvas runtime, based on surviving project design. No third-party artwork.', references: ['data/bible.json', 'docs/CAMPAIGN_FR.md', 'docs/ART_DIRECTION.md'] },
  authority: 'Relays, copies, losses, component damage, telegraphed aim and four actual Praetor feet come from relay-simulation.mjs. The renderer cannot acquire a copy or make a threat arrive.',
  limitations: ['New reconstruction: these files do not claim the hashes or exact geometry of the lost 0.13 exports.', 'Authoring sheets use varied scales and do not constitute a browser playtest or human art approval.', 'MI12 records local industrial commands only; no new PT03/PT04/TE02/PO01 or political chain is assigned.'],
  sourceSha256: sha(readFileSync(resolve(root, 'src/relay-assets.mjs'))), files: [] };
function write(path, bytes, data) { const target = resolve(output, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes); manifest.files.push({ file: `assets/relay/${path}`, bytes: Buffer.byteLength(bytes), sha256: sha(bytes), ...data }); }
for (const part of RELAY_ASSET_NAMES) for (const state of RELAY_ASSET_SPECS[part].states) {
  const g = relayAssetGeometry({ part, state, progress: .5 });
  write(`${part}-${state}.svg`, relayAssetSVG(g), { format: 'svg', part, state, canonIds: g.canonIds, pivot: g.pivot, anchors: g.anchors, nominalSize: g.size, inkBounds: g.bounds });
}
function text(c, value, x, y, size = 12, color = '#d0d5b0') { c.fillStyle = color; c.font = `${size}px Courier New`; c.fillText(value, x, y); }
function sheet(width, height, title, subtitle) { const canvas = createCanvas(width, height), c = canvas.getContext('2d'); c.fillStyle = '#1c342a'; c.fillRect(0, 0, width, height); text(c, title, 38, 45, 25, '#ddd1a0'); text(c, subtitle, 38, 76, 12, '#b0c19e'); return { canvas, c }; }
const kit = sheet(1800, 1100, 'THYR / LE TROISIÈME RELAIS', 'MI12 / 0.14.1 reconstruction · sources locales, purge physique et duel du Prétoire');
for (const [i, part] of RELAY_ASSET_NAMES.entries()) {
  const spec = RELAY_ASSET_SPECS[part], x = 38 + i % 3 * 580, y = 126 + Math.floor(i / 3) * 456;
  text(kit.c, `${spec.ids.join(' / ')} · ${part}`, x, y, 14);
  const scale = Math.min(2.3, 450 / spec.bounds[2], 276 / spec.bounds[3]), baseline = y + 302;
  kit.c.strokeStyle = '#49624b'; kit.c.beginPath(); kit.c.moveTo(x, baseline); kit.c.lineTo(x + 488, baseline); kit.c.stroke();
  drawRelayAsset(kit.c, { part, x: x + 235, y: baseline - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale });
  text(kit.c, `${spec.states.length} états · échelle ${scale.toFixed(2)} · pivot au sol du composant`, x, y + 345, 11);
  text(kit.c, spec.states.slice(0, 3).join(' / '), x, y + 371, 11); if (spec.states.length > 3) text(kit.c, spec.states.slice(3).join(' / '), x, y + 393, 11);
}
write('previews/relay-kit.png', kit.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authoring sheet with component scales; not gameplay or browser reception' });
const states = sheet(2100, 1580, 'THYR / ÉTATS DES RELAIS ET DU PRÉTOIRE', 'SVG et Canvas partagent les formes · les pieds du Prétoire sont pilotés par la simulation en jeu');
for (const [i, part] of RELAY_ASSET_NAMES.entries()) {
  const spec = RELAY_ASSET_SPECS[part], y = 110 + i * 238, scale = Math.min(2.0, 274 / spec.bounds[2], 154 / spec.bounds[3]);
  text(states.c, `${spec.ids.join(' / ')} · ${part}`, 38, y, 13);
  for (const [j, state] of spec.states.entries()) {
    const x = 180 + j * 339;
    drawRelayAsset(states.c, { part, state, x, y: y + 177 - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale, progress: .5 });
    text(states.c, state.toUpperCase(), x - 69, y + 207, 11);
  }
}
write('previews/relay-states.png', states.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authored states on a bench; not a playtest' });
manifest.counts = { files: manifest.files.length, svg: manifest.files.filter(f => f.format === 'svg').length, png: manifest.files.filter(f => f.format === 'png').length, components: RELAY_ASSET_NAMES.length, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0) };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'); console.log(JSON.stringify(manifest.counts));
