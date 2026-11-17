/** PL01 midground presentation only. No simulation, smoke or saved-state writes. */
import { PAINTED_VESPER_INDUSTRY_LAYOUT } from './painted-vesper-industry-layout.mjs';
import { drawPaintedVesperPart } from './painted-vesper.mjs';

export const PAINTED_VESPER_INDUSTRY_URLS = Object.freeze({
  industry: new URL('../assets/painted/vesper-industry/industry.png', import.meta.url).href,
});
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const rectangle = a => Array.isArray(a) && a.length === 4 && a.every(Number.isFinite) && a[2] > 0 && a[3] > 0;

export function setPaintedVesperIndustryImage(key, image) {
  const atlas = PAINTED_VESPER_INDUSTRY_LAYOUT[key];
  if (!atlas) throw new RangeError(`Unknown Vesper industry atlas: ${key}`);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError(`Unexpected Vesper industry dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function clearPaintedVesperIndustry() { generation++; loading = null; images.clear(); statuses.clear(); }
export function paintedVesperIndustryStatus() {
  return Object.fromEntries(Object.keys(PAINTED_VESPER_INDUSTRY_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Vesper industry decoding failed')); image.src = url;
  });
}
export function loadPaintedVesperIndustry({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_VESPER_INDUSTRY_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedVesperIndustryImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedVesperIndustryStatus());
  return loading;
}
export function paintedVesperIndustryFrame(part) {
  const atlas = PAINTED_VESPER_INDUSTRY_LAYOUT.industry, frame = atlas.frames[part];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.alphaBounds)) return null;
  const [x, y, w, h] = frame.source, [cx, cy, cw, ch] = frame.cell;
  if (x < cx || y < cy || x + w > cx + cw || y + h > cy + ch || x + w > atlas.size[0] || y + h > atlas.size[1]) return null;
  return { atlas: 'industry', part, ...structuredClone(frame) };
}
/** The historical local envelopes, before the renderer's existing transform. */
export function vesperIndustryBounds({ part, x = 0, h = 185 } = {}) {
  if (![x, h].every(Number.isFinite) || h <= 0) return null;
  if (part === 'silo') return [x - 6, 584 - h, 86, h + 16];
  if (part === 'chimney') return [x + 89, 541 - h, 25, h + 59];
  return null;
}
/** Draw one piece; false asks the caller to retain that piece's vector fallback. */
export function drawPaintedVesperIndustryPart(ctx, { part, x = 0, h = 185 } = {}) {
  const frame = paintedVesperIndustryFrame(part), image = images.get(frame?.atlas);
  const bounds = vesperIndustryBounds({ part, x, h });
  if (!frame || !image || !bounds || typeof ctx?.drawImage !== 'function') return false;
  const [left, top, width, height] = bounds, [bx, by, bw, bh] = frame.alphaBounds;
  const [sx, sy, sw, sh] = frame.source, scaleX = width / bw, scaleY = height / bh;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.beginPath(); ctx.rect(left, top, width, height); ctx.clip();
    ctx.drawImage(image, sx, sy, sw, sh, left + (sx - bx) * scaleX, top + (sy - by) * scaleY, sw * scaleX, sh * scaleY);
    return true;
  } catch { images.delete(frame.atlas); statuses.set(frame.atlas, { state: 'failed' }); return false; }
  finally { ctx.restore(); }
}
/** Convenience result keeps the two vector fallbacks independent. No smoke is drawn. */
export function drawPaintedVesperIndustry(ctx, { x = 0, h = 185 } = {}) {
  return {
    silo: drawPaintedVesperIndustryPart(ctx, { part: 'silo', x, h }),
    chimney: drawPaintedVesperIndustryPart(ctx, { part: 'chimney', x, h }),
  };
}
/** Reuse the acquired workshop image; this adds no atlas, state or population. */
export function drawPaintedVesperIndustryMaintenance(ctx, { x = 0 } = {}) {
  if (!Number.isFinite(x)) return false;
  return drawPaintedVesperPart(ctx, { part: 'maintenance', state: 'normal', x: x + 195, y: 599, width: 96, height: 101 });
}
