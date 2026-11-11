/** Development-only raster verification. Deliberately outside dependency-free npm test.
 * CI installs @napi-rs/canvas@0.1.100 explicitly; missing dependencies fail, never skip this proof. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  PRODUCTION_COMPONENT_NAMES, productionPartGeometry, productionComponentGeometry,
  productionGeometrySVG, drawProductionGeometry,
} from '../src/production-assets.mjs';
import { THYR_ASSET_SPECS, thyrAssetGeometry, thyrAssetSVG } from '../src/thyr-assets.mjs';

const require = createRequire(import.meta.url);
let canvas;
try {
  canvas = require('@napi-rs/canvas');
} catch (cause) {
  throw new Error('Raster validation requires its development dependency. Run: npm install --no-save --no-package-lock --ignore-scripts @napi-rs/canvas@0.1.100', { cause });
}
const { createCanvas, loadImage } = canvas;
const { version } = require('@napi-rs/canvas/package.json');
const cases = [
  { walkerId: 'WK06', part: 'hull' },
  { walkerId: 'WK10', part: 'upper' },
  { walkerId: 'WK01', part: 'radiator', state: 'damaged' },
  { part: 'ambulance' },
  { part: 'beacon', state: 'lost' },
  ...Object.entries(THYR_ASSET_SPECS).flatMap(([part, spec]) => spec.states.map(state => ({ part, state, progress: .5, thyr: true }))),
];

for (const options of cases) {
  const geometry = options.thyr ? thyrAssetGeometry(options) : PRODUCTION_COMPONENT_NAMES.includes(options.part)
    ? productionComponentGeometry(options) : productionPartGeometry(options);
  const svg = options.thyr ? thyrAssetSVG(geometry) : productionGeometrySVG(geometry), [x, y, width, height] = geometry.bounds, scale = 3;
  const direct = createCanvas(Math.ceil(width * scale), Math.ceil(height * scale));
  const directContext = direct.getContext('2d');
  directContext.scale(scale, scale); directContext.translate(-x, -y);
  drawProductionGeometry(directContext, geometry);

  const exported = createCanvas(direct.width, direct.height);
  const exportedContext = exported.getContext('2d');
  // Rasterize the vector at the same resolution as the direct drawing.
  // Upscaling an intrinsic-size SVG raster would measure image interpolation,
  // which disproportionately erodes narrow leaves, rather than shape fidelity.
  const rasterSVG = svg.replace('<svg ', `<svg width="${direct.width}" height="${direct.height}" `);
  const image = await loadImage(Buffer.from(rasterSVG));
  exportedContext.drawImage(image, 0, 0, exported.width, exported.height);
  const directPixels = directContext.getImageData(0, 0, direct.width, direct.height).data;
  const exportedPixels = exportedContext.getImageData(0, 0, exported.width, exported.height).data;
  let occupiedDirect = 0, occupiedExported = 0, intersection = 0, union = 0;
  for (let i = 3; i < directPixels.length; i += 4) {
    const a = directPixels[i] > 128, b = exportedPixels[i] > 128;
    if (a) occupiedDirect++;
    if (b) occupiedExported++;
    if (a || b) union++;
    if (a && b) intersection++;
  }
  assert.ok(occupiedDirect > 500 && occupiedExported > 500, `${geometry.id}: visible detail is required`);
  const coverage = intersection / union;
  assert.ok(coverage > .92, `${geometry.id}: SVG/Canvas coverage ${coverage.toFixed(3)}`);
  console.log(`${geometry.id}: ${(coverage * 100).toFixed(2)}% shared coverage`);
}
console.log(`Production SVG/Canvas raster validation passed: ${cases.length}/${cases.length} cases, @napi-rs/canvas ${version}.`);
