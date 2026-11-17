/** Vesper ground and viaduct presentation. No simulation or saved-state writes. */
import { PAINTED_VESPER_SCENERY_LAYOUT } from './painted-vesper-scenery-layout.mjs';

export const PAINTED_VESPER_SCENERY_URLS = Object.freeze({
  terrain: new URL('../assets/painted/vesper-scenery/terrain.png', import.meta.url).href,
  props: new URL('../assets/painted/vesper-scenery/props.png', import.meta.url).href,
  viaduct: new URL('../assets/painted/vesper-scenery/viaduct.png', import.meta.url).href,
});
export const PAINTED_VESPER_GROUND_FRAMES = Object.freeze(['shale', 'basalt', 'sediment', 'scoria']);
export const PAINTED_VESPER_PROP_FRAMES = Object.freeze(['slate-rock', 'basalt-rock', 'scoria-rock', 'crust-lichen', 'fan-lichen', 'slate-rubble']);
const partAtlas = Object.fromEntries(Object.entries(PAINTED_VESPER_SCENERY_LAYOUT).flatMap(([key, atlas]) => Object.keys(atlas.frames).map(name => [name, key])));
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const modulo = (n, d) => ((n % d) + d) % d;
const finite = values => values.every(Number.isFinite);
const rectangle = a => Array.isArray(a) && a.length === 4 && finite(a) && a[2] > 0 && a[3] > 0;

export function setPaintedVesperSceneryImage(key, image) {
  const atlas = PAINTED_VESPER_SCENERY_LAYOUT[key];
  if (!atlas) throw new RangeError(`Unknown Vesper scenery atlas: ${key}`);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError(`Unexpected Vesper scenery dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function clearPaintedVesperScenery() { generation++; loading = null; images.clear(); statuses.clear(); }
export function paintedVesperSceneryStatus() {
  return Object.fromEntries(Object.keys(PAINTED_VESPER_SCENERY_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Vesper scenery image decoding failed')); image.src = url;
  });
}
export function loadPaintedVesperScenery({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_VESPER_SCENERY_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedVesperSceneryImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedVesperSceneryStatus());
  return loading;
}
export function paintedVesperSceneryFrame(part) {
  const key = partAtlas[part], atlas = PAINTED_VESPER_SCENERY_LAYOUT[key], frame = atlas?.frames[part];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.target) || frame.source[0] < 0 || frame.source[1] < 0 ||
      frame.source[0] + frame.source[2] > atlas.size[0] || frame.source[1] + frame.source[3] > atlas.size[1]) return null;
  return { atlas: key, part, ...structuredClone(frame) };
}
function fail(key) { images.delete(key); statuses.set(key, { state: 'failed' }); }

export function drawPaintedVesperSceneryPart(ctx, { part, x = 0, y = 0, width, height, scale = 1, rotation = 0 } = {}) {
  const frame = paintedVesperSceneryFrame(part), image = images.get(frame?.atlas);
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
export function vesperGroundProp(index) {
  return Number.isFinite(index) ? PAINTED_VESPER_PROP_FRAMES[modulo(Math.floor(index), PAINTED_VESPER_PROP_FRAMES.length)] : null;
}

/** The original terrain remains the sole foot-contact surface. */
export function drawPaintedVesperTerrain(ctx, { from, to, groundAt, bottom = 930 } = {}) {
  const image = images.get('terrain');
  if (!image || typeof ctx?.drawImage !== 'function' || typeof groundAt !== 'function' || !finite([from, to, bottom]) || to <= from) return false;
  const tileWidth = 512, depth = 200, step = 8, blendWidth = 96;
  const first = Math.floor(from / tileWidth), last = Math.ceil(to / tileWidth);
  // Validate every sample before drawing, so an invalid surface can fall back
  // without partially committing a patch or poisoning valid image decoding.
  const columns = [];
  for (let tile = first; tile < last; tile++) {
    const frame = PAINTED_VESPER_SCENERY_LAYOUT.terrain.frames[PAINTED_VESPER_GROUND_FRAMES[modulo(tile, 4)]];
    for (let offset = 0; offset < tileWidth; offset += step) {
      const x = tile * tileWidth + offset;
      if (x + step < from || x > to) continue;
      const y = groundAt(x + step / 2);
      if (!Number.isFinite(y)) return false;
      const previous = offset < blendWidth
        ? PAINTED_VESPER_SCENERY_LAYOUT.terrain.frames[PAINTED_VESPER_GROUND_FRAMES[modulo(tile - 1, 4)]] : null;
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

/** Keep the girder aligned to the exact walking surface, including hills. */
export function drawPaintedVesperDeck(ctx, { from, to, groundAt, depth = 37 } = {}) {
  const frame = paintedVesperSceneryFrame('deck'), image = images.get('viaduct');
  if (!image || typeof ctx?.drawImage !== 'function' || typeof groundAt !== 'function' || !finite([from, to, depth]) || to <= from || depth <= 0) return false;
  const tileWidth = 192, step = 4, [u, v, w, h] = frame.alphaBounds, columns = [];
  for (let x = Math.floor(from / step) * step; x < to; x += step) {
    const y = groundAt(x + step / 2); if (!Number.isFinite(y)) return false;
    columns.push({ x, y, offset: modulo(x, tileWidth) });
  }
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    for (const { x, y, offset } of columns)
      ctx.drawImage(image, u + w * offset / tileWidth, v, w * step / tileWidth, h, x, y, step + .04, depth);
    return true;
  } catch { fail('viaduct'); return false; }
  finally { ctx.restore(); }
}

/** Stretch the shaft only; bolted beam ends keep their painted proportions. */
export function drawPaintedVesperBrace(ctx, { part = 'brace', x1, y1, x2, y2, thickness = 10 } = {}) {
  if (!['brace', 'tie-rod', 'sleeper'].includes(part) || !finite([x1, y1, x2, y2, thickness]) || thickness <= 0) return false;
  const frame = paintedVesperSceneryFrame(part), image = images.get('viaduct');
  if (!image || typeof ctx?.drawImage !== 'function') return false;
  const length = Math.hypot(x2 - x1, y2 - y1); if (!length) return false;
  const [u, v, w, h] = frame.alphaBounds, sourceCap = w * .1, cap = Math.min(length / 3, sourceCap * thickness / h);
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true; ctx.translate(x1, y1); ctx.rotate(Math.atan2(y2 - y1, x2 - x1));
    ctx.drawImage(image, u, v, sourceCap, h, 0, -thickness / 2, cap, thickness);
    ctx.drawImage(image, u + sourceCap, v, w - sourceCap * 2, h, cap, -thickness / 2, length - cap * 2, thickness);
    ctx.drawImage(image, u + w - sourceCap, v, sourceCap, h, length - cap, -thickness / 2, cap, thickness);
    return true;
  } catch { fail('viaduct'); return false; }
  finally { ctx.restore(); }
}
