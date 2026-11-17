/** Presentation only: the caller retains the exact primary-fire halo and the
 * five existing cooling circles' position, radius, phase and alpha. */
import { PAINTED_WALKER_FX_LAYOUT } from './painted-walker-fx-layout.mjs';

export const PAINTED_WALKER_FX_URLS = Object.freeze({
  muzzle: new URL('../assets/painted/walker-fx/muzzle.png', import.meta.url).href,
  vent: new URL('../assets/painted/walker-fx/vent.png', import.meta.url).href,
});
export const WALKER_MUZZLE_CORE_POINTS = Object.freeze([
  [0, -7], [33, -3], [18, 0], [41, 4], [1, 8],
].map(point => Object.freeze(point)));
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const finite = values => values.every(Number.isFinite);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const rectangle = value => Array.isArray(value) && value.length === 4 && finite(value) && value[2] > 0 && value[3] > 0;

export function setPaintedWalkerFxImage(key, image) {
  const atlas = PAINTED_WALKER_FX_LAYOUT[key];
  if (!atlas) throw new RangeError('Unknown walker FX atlas: ' + key);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError('Unexpected walker FX atlas dimensions: ' + key);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function clearPaintedWalkerFx() { generation++; loading = null; images.clear(); statuses.clear(); }
export function paintedWalkerFxStatus() {
  return Object.fromEntries(Object.keys(PAINTED_WALKER_FX_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Walker FX image decoding failed')); image.src = url;
  });
}
export function loadPaintedWalkerFx({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_WALKER_FX_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedWalkerFxImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedWalkerFxStatus());
  return loading;
}

function measuredFrame(key, name) {
  const atlas = PAINTED_WALKER_FX_LAYOUT[key], frame = atlas?.frames[name];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.target) || frame.source[0] < 0 || frame.source[1] < 0 ||
      frame.source[0] + frame.source[2] > atlas.size[0] || frame.source[1] + frame.source[3] > atlas.size[1]) return null;
  return frame;
}
function muzzleFrame({ fireCooldown, fireRate, muzzleX = 0, hangar = false, reducedMotion = false } = {}) {
  if (hangar || !finite([fireCooldown, fireRate, muzzleX]) || fireCooldown <= .1 || fireRate <= .1) return null;
  const age = clamp((fireRate - fireCooldown) / (fireRate - .1), 0, 1);
  const name = 'age-' + (reducedMotion ? 0 : Math.min(3, Math.floor(age * 4)));
  const frame = measuredFrame('muzzle', name);
  return frame ? { atlas: 'muzzle', name, age, muzzleX, frame } : null;
}
function ventFrame({ x, y, radius, phase } = {}) {
  if (!finite([x, y, radius, phase]) || radius <= 0 || phase < 0 || phase >= 1) return null;
  const name = 'age-' + Math.min(5, Math.floor(phase * 6)), frame = measuredFrame('vent', name);
  if (!frame || !finite(frame.target.map(value => value * radius))) return null;
  return { atlas: 'vent', name, phase, x, y, radius, frame };
}

/** Read-only frame geometry; copying keeps diagnostics from changing anchors. */
export function paintedMuzzleFlashFrame(options) {
  const value = muzzleFrame(options);
  if (!value) return null;
  const { frame, ...details } = value;
  return { ...details, ...structuredClone(frame) };
}
export function paintedVentPuffFrame(options) {
  const value = ventFrame(options);
  if (!value) return null;
  const { frame, ...details } = value;
  return { ...details, ...structuredClone(frame) };
}

/** Call in the existing translated/rotated gun coordinate system, after its
 * unchanged glow. False means draw the historical polygon. No halo is painted. */
export function drawPaintedMuzzleFlash(ctx, options) {
  const value = muzzleFrame(options), image = images.get('muzzle');
  if (!value || !image || !['save', 'restore', 'translate', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'clip', 'drawImage'].every(key => typeof ctx?.[key] === 'function')) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true; ctx.translate(value.muzzleX, 0);
    ctx.beginPath(); ctx.moveTo(...WALKER_MUZZLE_CORE_POINTS[0]);
    for (const point of WALKER_MUZZLE_CORE_POINTS.slice(1)) ctx.lineTo(...point);
    ctx.closePath(); ctx.clip();
    ctx.drawImage(image, ...value.frame.source, ...value.frame.target);
    return true;
  } catch {
    images.delete('muzzle'); statuses.set('muzzle', { state: 'failed' }); return false;
  } finally { ctx.restore(); }
}

/** Call once per historical puff in world coordinates, with caller alpha
 * untouched. Reduced motion is already represented by time=0 in its phase. */
export function drawPaintedVentPuff(ctx, options) {
  const value = ventFrame(options), image = images.get('vent');
  if (!value || !image || !['save', 'restore', 'translate', 'scale', 'beginPath', 'arc', 'clip', 'drawImage'].every(key => typeof ctx?.[key] === 'function')) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(value.x, value.y); ctx.scale(value.radius, value.radius);
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(image, ...value.frame.source, ...value.frame.target);
    return true;
  } catch {
    images.delete('vent'); statuses.set('vent', { state: 'failed' }); return false;
  } finally { ctx.restore(); }
}
