/** Nacre terrain and shoreline presentation. No simulation or saved-state writes. */
import { PAINTED_NACRE_SCENERY_LAYOUT } from './painted-nacre-scenery-layout.mjs';

export const PAINTED_NACRE_SCENERY_URLS = Object.freeze({
  terrain: new URL('../assets/painted/nacre-scenery/terrain.png', import.meta.url).href,
  props: new URL('../assets/painted/nacre-scenery/props.png', import.meta.url).href,
});
export const PAINTED_NACRE_GROUND_FRAMES = Object.freeze(['wet-rock', 'layered-silt', 'salt-masonry', 'patinated-metal']);
export const PAINTED_NACRE_PROP_FRAMES = Object.freeze(['shore-rock', 'salt-pebbles', 'salt-flower', 'shore-algae', 'mooring-bollard', 'weathered-planks']);
const partAtlas = Object.fromEntries(Object.entries(PAINTED_NACRE_SCENERY_LAYOUT).flatMap(([key, atlas]) => Object.keys(atlas.frames).map(name => [name, key])));
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const modulo = (n, d) => ((n % d) + d) % d;
const finite = values => values.every(Number.isFinite);
const rectangle = a => Array.isArray(a) && a.length === 4 && finite(a) && a[2] > 0 && a[3] > 0;

export function setPaintedNacreSceneryImage(key, image) {
  const atlas = PAINTED_NACRE_SCENERY_LAYOUT[key];
  if (!atlas) throw new RangeError(`Unknown Nacre scenery atlas: ${key}`);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError(`Unexpected Nacre scenery dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function clearPaintedNacreScenery() { generation++; loading = null; images.clear(); statuses.clear(); }
export function paintedNacreSceneryStatus() {
  return Object.fromEntries(Object.keys(PAINTED_NACRE_SCENERY_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Nacre shoreline image decoding failed')); image.src = url;
  });
}
export function loadPaintedNacreScenery({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_NACRE_SCENERY_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedNacreSceneryImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedNacreSceneryStatus());
  return loading;
}
export function paintedNacreSceneryFrame(part) {
  const key = partAtlas[part], atlas = PAINTED_NACRE_SCENERY_LAYOUT[key], frame = atlas?.frames[part];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.target) || frame.source[0] < 0 || frame.source[1] < 0 ||
      frame.source[0] + frame.source[2] > atlas.size[0] || frame.source[1] + frame.source[3] > atlas.size[1]) return null;
  return { atlas: key, part, ...structuredClone(frame) };
}
function fail(key) { images.delete(key); statuses.set(key, { state: 'failed' }); }

export function drawPaintedNacreSceneryPart(ctx, { part, x = 0, y = 0, width, height, scale = 1, rotation = 0 } = {}) {
  const frame = paintedNacreSceneryFrame(part), image = images.get(frame?.atlas);
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
export function nacreGroundProp(index) {
  return Number.isFinite(index) ? PAINTED_NACRE_PROP_FRAMES[modulo(Math.floor(index), PAINTED_NACRE_PROP_FRAMES.length)] : null;
}

/** The original terrain remains the sole foot-contact surface. */
export function drawPaintedNacreTerrain(ctx, { from, to, groundAt, bottom = 930 } = {}) {
  const image = images.get('terrain');
  if (!image || typeof ctx?.drawImage !== 'function' || typeof groundAt !== 'function' || !finite([from, to, bottom]) || to <= from) return false;
  const tileWidth = 512, depth = 180, step = 8, blendWidth = 96;
  const first = Math.floor(from / tileWidth), last = Math.ceil(to / tileWidth);
  // Validate every sample before drawing, so an invalid surface can fall back
  // without partially committing a patch or poisoning valid image decoding.
  const columns = [];
  for (let tile = first; tile < last; tile++) {
    const frame = PAINTED_NACRE_SCENERY_LAYOUT.terrain.frames[PAINTED_NACRE_GROUND_FRAMES[modulo(tile, 4)]];
    for (let offset = 0; offset < tileWidth; offset += step) {
      const x = tile * tileWidth + offset;
      if (x + step < from || x > to) continue;
      const y = groundAt(x + step / 2);
      if (!Number.isFinite(y)) return false;
      const previous = offset < blendWidth
        ? PAINTED_NACRE_SCENERY_LAYOUT.terrain.frames[PAINTED_NACRE_GROUND_FRAMES[modulo(tile - 1, 4)]] : null;
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
    for (const { x, y, frame, previous, offset } of columns) {
      const [u, v, w, h] = frame.materialSource;
      // Continue the preceding material's edge into this tile before fading in
      // the next rock. Mirroring that short tail keeps every source crop within
      // its measured cell. All offsets are world-relative, never camera-relative.
      if (previous) {
        const [pu, pv, pw, ph] = previous.materialSource;
        ctx.drawImage(image, pu + pw * (tileWidth - step - offset) / tileWidth, pv,
          pw * step / tileWidth, ph, x, y - 1, step + .04, depth);
        const progress = (offset + step / 2) / blendWidth;
        ctx.globalAlpha = alpha * progress * progress * (3 - 2 * progress);
      }
      ctx.drawImage(image, u + w * offset / tileWidth, v, w * step / tileWidth, h, x, y - 1, step + .04, depth);
      ctx.globalAlpha = alpha;
      // Fade the exposed rock into the existing deep soil, in render space.
      const shade = ctx.createLinearGradient(0, y + 70, 0, y + depth);
      shade.addColorStop(0, '#10252d00'); shade.addColorStop(1, '#10252d');
      ctx.fillStyle = shade; ctx.fillRect(x, y + 70, step + .04, depth - 70);
    }
    return true;
  } catch { fail('terrain'); return false; }
  finally { ctx.restore(); }
}

