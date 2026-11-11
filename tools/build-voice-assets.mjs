/** MI11 authoring sheets. These exports are not browser screenshots. */
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VOICE_ASSET_SPECS, VOICE_ASSET_NAMES, voiceAssetGeometry, voiceAssetSVG, drawVoiceAsset } from '../src/voice-assets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..'), output = resolve(root, 'assets/voice'), require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, GlobalFonts } = api;
if (existsSync('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf')) GlobalFonts.registerFromPath('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 'Courier New');
const sha = b => createHash('sha256').update(b).digest('hex');
const manifest = { schema: 1, version: '0.12.0', created: '2026-11-11', title: 'Thyr — écoute, ponte et témoignage de Leth',
  source: 'src/voice-assets.mjs', generator: 'tools/build-voice-assets.mjs', runtime: 'src/voice-renderer.mjs',
  provenance: { author: 'Original code and geometry authored by OpenAI assistant for Darknigthmare', method: 'Original code-native vector geometry shared by SVG exports and Canvas runtime; no generated, traced, stock or third-party artwork.', references: ['data/bible.json', 'docs/CAMPAIGN_FR.md', 'docs/ART_DIRECTION.md'] },
  authority: 'Positions, true foot contacts, nest damage, work progress, Leth survival, private consent and retained testimony come from simulation.mjs. Drawings never locate a source, grant consent or restore a lost witness.',
  limitations: ['Authoring sheets use varied scales and are not gameplay captures or human art approval.', 'TE01 requires the physical and consent conditions recorded in the campaign receipt, independently of visual state.', 'Nest drawings represent local sites, not a human population or a count of Khelt citizens.', 'Leth is one original prototype portrayal, not the complete anatomy, motion, culture or architectural production for all Khelt cities.'],
  sourceSha256: sha(readFileSync(resolve(root, 'src/voice-assets.mjs'))), files: [] };
function write(path, bytes, data) { const target = resolve(output, path); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes); manifest.files.push({ file: `assets/voice/${path}`, bytes: Buffer.byteLength(bytes), sha256: sha(bytes), ...data }); }
for (const part of VOICE_ASSET_NAMES) {
  const spec = VOICE_ASSET_SPECS[part];
  for (const state of spec.states) {
    const g = voiceAssetGeometry({ part, state, progress: .5 });
    write(`${part}-${state}.svg`, voiceAssetSVG(g), { format: 'svg', part, state, canonIds: spec.ids, pivot: g.pivot, anchors: g.anchors, nominalSize: g.size, inkBounds: g.bounds });
  }
}
function text(c, value, x, y, size = 12, color = '#c7d7b4') { c.fillStyle = color; c.font = `${size}px Courier New`; c.fillText(value, x, y); }
function sheet(w, h, title, subtitle) { const canvas = createCanvas(w, h), c = canvas.getContext('2d'); c.fillStyle = '#152f2a'; c.fillRect(0, 0, w, h); text(c, title, 38, 46, 25, '#d8d5a5'); text(c, subtitle, 39, 74, 12, '#a5bb9b'); return { canvas, c }; }
const kit = sheet(1800, 1100, 'THYR / UNE VOIX AU RAS DU SOL', 'MI11 · Géométrie SVG + Canvas · écoute, corniche, ponte et interprétation consentie');
for (const [i, part] of VOICE_ASSET_NAMES.entries()) {
  const spec = VOICE_ASSET_SPECS[part], x = 38 + (i % 3) * 580, y = 125 + Math.floor(i / 3) * 455;
  text(kit.c, `${spec.ids.join(' / ')} · ${part}`, x, y, 14);
  const scale = Math.min(1.6, 390 / spec.bounds[2], 285 / spec.bounds[3]), baseline = y + 312;
  kit.c.strokeStyle = '#496650'; kit.c.lineWidth = 1; kit.c.beginPath(); kit.c.moveTo(x, baseline); kit.c.lineTo(x + 475, baseline); kit.c.stroke();
  drawVoiceAsset(kit.c, { part, x: x + 235, y: baseline - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale });
  text(kit.c, `${spec.states.length} états · pivot au sol · échelle ${scale.toFixed(2)}`, x, y + 349, 11, '#a4bb99');
  text(kit.c, spec.states.slice(0, 3).join(' / '), x, y + 372, 11);
  if (spec.states.length > 3) text(kit.c, spec.states.slice(3).join(' / '), x, y + 390, 11);
}
write('previews/voice-kit.png', kit.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authoring sheet; varied scales stated in its labels and nominal dimensions in manifest' });
const states = sheet(1840, 1580, 'THYR / LES ÉTATS DE LA VOIX', 'Planches de production · les actes et permissions appartiennent à la simulation');
for (const [i, part] of VOICE_ASSET_NAMES.entries()) {
  const spec = VOICE_ASSET_SPECS[part], y = 105 + i * 238, scale = Math.min(1.2, 250 / spec.bounds[2], 154 / spec.bounds[3]);
  text(states.c, `${spec.ids.join(' / ')} · ${part}`, 38, y + 8, 13, '#d7d3a5');
  for (const [j, state] of spec.states.entries()) {
    const x = 200 + j * 352;
    drawVoiceAsset(states.c, { part, state, x, y: y + 177 - Math.max(0, spec.bounds[1] + spec.bounds[3]) * scale, scale, progress: .5 });
    text(states.c, state.toUpperCase(), x - 69, y + 207, 11);
  }
}
write('previews/voice-states.png', states.canvas.toBuffer('image/png'), { format: 'png', kind: 'Authored states on a bench, not a browser or gameplay reception' });
manifest.counts = { files: manifest.files.length, svg: manifest.files.filter(f => f.format === 'svg').length, png: manifest.files.filter(f => f.format === 'png').length, components: VOICE_ASSET_NAMES.length, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0) };
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n'); console.log(JSON.stringify(manifest.counts));
