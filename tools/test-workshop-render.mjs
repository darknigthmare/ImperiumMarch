/** Development raster gate for MI14; this does not claim native-browser or human QA. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORKSHOP_ASSET_SPECS, workshopAssetGeometry, workshopAssetSVG } from '../src/workshop-assets.mjs';
import { drawProductionGeometry } from '../src/production-assets.mjs';

const require = createRequire(import.meta.url);
let api; try { api = require('@napi-rs/canvas'); } catch { api = require(resolve(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, '@napi-rs/canvas')); }
const { createCanvas, loadImage } = api;
let cases = 0, minimumCoverage = 1;
for (const [part, spec] of Object.entries(WORKSHOP_ASSET_SPECS)) for (const state of spec.states) for (const mechanic of part === 'worker' ? [false, true] : [false]) {
  const g = workshopAssetGeometry({ part, state, mechanic, progress: .5 }), [x, y, w, h] = g.bounds, scale = 3;
  const direct = createCanvas(w * scale, h * scale), dc = direct.getContext('2d');
  dc.scale(scale, scale); dc.translate(-x, -y); drawProductionGeometry(dc, g);
  const exported = createCanvas(direct.width, direct.height), ec = exported.getContext('2d');
  const image = await loadImage(Buffer.from(workshopAssetSVG(g).replace('<svg ', `<svg width="${direct.width}" height="${direct.height}" `)));
  ec.drawImage(image, 0, 0);
  const a = dc.getImageData(0, 0, direct.width, direct.height).data, b = ec.getImageData(0, 0, direct.width, direct.height).data;
  let intersection = 0, union = 0, occupied = 0, transparent = 0;
  for (let i = 3; i < a.length; i += 4) {
    const left = a[i] > 128, right = b[i] > 128;
    if (left && right) intersection++; if (left || right) union++; if (left) occupied++; if (a[i] === 0) transparent++;
  }
  const coverage = intersection / union;
  assert.ok(occupied > 500, `${g.id} has no useful visible geometry`);
  assert.ok(transparent > a.length / 16, `${g.id} must keep a transparent frame`);
  assert.ok(coverage > .92, `${g.id} Canvas/SVG coverage ${coverage}`);
  minimumCoverage = Math.min(minimumCoverage, coverage); cases++;
}
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sources = ['src/workshop-assets.mjs', 'src/production-assets.mjs', 'tools/test-workshop-render.mjs'];
const receipt = { version: '0.15.0', created: new Date().toISOString(), completed: true, cases,
  minimumCanvasSvgCoverage: minimumCoverage, transparentFrames: true, type: 'Canvas/SVG raster comparison; no browser execution claimed',
  sourceHashes: Object.fromEntries(sources.map(path => [path, createHash('sha256').update(readFileSync(resolve(root, path))).digest('hex')])),
  limitations: ['No native browser execution, human playtest or final-art approval is claimed by this raster comparison.'] };
mkdirSync(resolve(root, 'docs/validation'), { recursive: true });
writeFileSync(resolve(root, 'docs/validation/mi14-raster.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
