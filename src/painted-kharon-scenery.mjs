/** Kharon terrain and quarry presentation. No simulation or saved-state writes. */
import { PAINTED_KHARON_SCENERY_LAYOUT } from './painted-kharon-scenery-layout.mjs';

export const PAINTED_KHARON_SCENERY_URLS = Object.freeze({
  terrain: new URL('../assets/painted/kharon-scenery/terrain.png', import.meta.url).href,
  props: new URL('../assets/painted/kharon-scenery/props.png', import.meta.url).href,
});
export const PAINTED_KHARON_GROUND_FRAMES = Object.freeze(['fractured-basalt', 'compact-scoria', 'refractory-masonry', 'graphite-metal']);
export const PAINTED_KHARON_PROP_FRAMES = Object.freeze(['basalt-cluster', 'scoria-gravel', 'sulphur-stone', 'scoria-moss', 'furnace-fern', 'cold-copper-pipe']);
const partAtlas = Object.fromEntries(Object.entries(PAINTED_KHARON_SCENERY_LAYOUT).flatMap(([key, atlas]) => Object.keys(atlas.frames).map(name => [name, key])));
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const modulo = (n, d) => ((n % d) + d) % d;
const finite = values => values.every(Number.isFinite);
const rectangle = a => Array.isArray(a) && a.length === 4 && finite(a) && a[2] > 0 && a[3] > 0;

export function setPaintedKharonSceneryImage(key, image) {
  const atlas = PAINTED_KHARON_SCENERY_LAYOUT[key];
  if (!atlas) throw new RangeError(`Unknown Kharon scenery atlas: ${key}`);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError(`Unexpected Kharon scenery dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function clearPaintedKharonScenery() { generation++; loading = null; images.clear(); statuses.clear(); }
export function paintedKharonSceneryStatus() {
  return Object.fromEntries(Object.keys(PAINTED_KHARON_SCENERY_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Kharon quarry image decoding failed')); image.src = url;
  });
}
export function loadPaintedKharonScenery({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_KHARON_SCENERY_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedKharonSceneryImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedKharonSceneryStatus());
  return loading;
}
export function paintedKharonSceneryFrame(part) {
  const key = partAtlas[part], atlas = PAINTED_KHARON_SCENERY_LAYOUT[key], frame = atlas?.frames[part];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.target) || frame.source[0] < 0 || frame.source[1] < 0 ||
      frame.source[0] + frame.source[2] > atlas.size[0] || frame.source[1] + frame.source[3] > atlas.size[1]) return null;
  return { atlas: key, part, ...structuredClone(frame) };
}
function fail(key) { images.delete(key); statuses.set(key, { state: 'failed' }); }

export function drawPaintedKharonSceneryPart(ctx, { part, x = 0, y = 0, width, height, scale = 1, rotation = 0 } = {}) {
  const frame = paintedKharonSceneryFrame(part), image = images.get(frame?.atlas);
  if (!frame || !image || typeof ctx?.drawImage !== 'function') return false;
  const sx = scale * (width ?? frame.size[0]) / frame.size[0], sy = scale * (height ?? frame.size[1]) / frame.size[1];
  if (!finite([x, y, sx, sy, rotation]) || sx <= 0 || sy <= 0) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true; ctx.translate(x, y); if (rotation) ctx.rotate(rotation); ctx.scale(sx, sy);
    ctx.drawImage(image, ...frame.source, ...frame.target); return true;
  } catch { fail(frame.atlas); return false; }
  finally { ctx.restore(); }
}

/** Decorative slot selection is world-stable and adds no ground objects. */
export function kharonGroundProp(index) {
  return Number.isFinite(index) ? PAINTED_KHARON_PROP_FRAMES[modulo(Math.floor(index), PAINTED_KHARON_PROP_FRAMES.length)] : null;
}

/** The original terrain remains the sole foot-contact surface. */
export function drawPaintedKharonTerrain(ctx, { from, to, groundAt, bottom = 930 } = {}) {
  const image = images.get('terrain');
  if (!image || typeof ctx?.drawImage !== 'function' || typeof groundAt !== 'function' || !finite([from, to, bottom]) || to <= from) return false;
  const tileWidth = 512, depth = 180, step = 8, blendWidth = 96;
  const first = Math.floor(from / tileWidth), last = Math.ceil(to / tileWidth);
  // Validate every sample before drawing, so an invalid surface can fall back
  // without partially committing a patch or poisoning valid image decoding.
  const columns = [];
  for (let tile = first; tile < last; tile++) {
    const frame = PAINTED_KHARON_SCENERY_LAYOUT.terrain.frames[PAINTED_KHARON_GROUND_FRAMES[modulo(tile, 4)]];
    for (let offset = 0; offset < tileWidth; offset += step) {
      const x = tile * tileWidth + offset;
      if (x + step < from || x > to) continue;
      const y = groundAt(x + step / 2);
      if (!Number.isFinite(y)) return false;
      const previous = offset < blendWidth
        ? PAINTED_KHARON_SCENERY_LAYOUT.terrain.frames[PAINTED_KHARON_GROUND_FRAMES[modulo(tile - 1, 4)]] : null;
      columns.push({ x, y, frame, previous, offset });
    }
  }
  const surface = [];
  for (let x = from; x < to; x += 4) { const y = groundAt(x); if (!Number.isFinite(y)) return false; surface.push([x, y]); }
  const endY = groundAt(to); if (!Number.isFinite(endY)) return false;
  ctx.save();
  try {
    ctx.beginPath(); ctx.moveTo(from, bottom); for (const [x, y] of surface) ctx.lineTo(x, y);
    ctx.lineTo(to, endY); ctx.lineTo(to, bottom); ctx.closePath(); ctx.clip();
    ctx.imageSmoothingEnabled = true;
    const alpha = ctx.globalAlpha;
    // Adjacent strips must share a device-pixel edge. Fractional camera
    // translations otherwise antialias both edges and leave faint vertical
    // seams. Source crops and ground samples stay fixed in world coordinates.
    const matrix = ctx.getTransform?.();
    const axisAligned = matrix && finite([matrix.a, matrix.b, matrix.c, matrix.e]) &&
      matrix.a > 0 && Math.abs(matrix.b) < 1e-10 && Math.abs(matrix.c) < 1e-10;
    const rasterX = axisAligned ? x => (Math.round(matrix.a * x + matrix.e) - matrix.e) / matrix.a : x => x;
    for (const { x, y, frame, previous, offset } of columns) {
      const [u, v, w, h] = frame.materialSource;
      const left = rasterX(x), width = rasterX(x + step) - left;
      // Continue the preceding material's edge into this tile before fading in
      // the next rock. Mirroring that short tail keeps every source crop within
      // its measured cell. All offsets are world-relative, never camera-relative.
      if (previous) {
        const [pu, pv, pw, ph] = previous.materialSource;
        ctx.drawImage(image, pu + pw * (tileWidth - step - offset) / tileWidth, pv,
          pw * step / tileWidth, ph, left, y - 1, width, depth);
        const progress = (offset + step / 2) / blendWidth;
        ctx.globalAlpha = alpha * progress * progress * (3 - 2 * progress);
      }
      ctx.drawImage(image, u + w * offset / tileWidth, v, w * step / tileWidth, h, left, y - 1, width, depth);
      ctx.globalAlpha = alpha;
      // Fade the exposed rock into the existing deep soil, in render space.
      const shade = ctx.createLinearGradient(0, y + 70, 0, y + depth);
      shade.addColorStop(0, '#10252d00'); shade.addColorStop(1, '#10252d');
      ctx.fillStyle = shade; ctx.fillRect(left, y + 70, width, depth - 70);
    }
    return true;
  } catch { fail('terrain'); return false; }
  finally { ctx.restore(); }
}

