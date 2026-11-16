/** Painted articulated walker parts. This module never updates game state,
 * contacts, inverse kinematics, damage, targeting or saved data. */
import { PAINTED_WALKER_LAYOUT } from './painted-walker-layout.mjs';
import { PRODUCTION_RIGS } from './production-assets.mjs';

// Literal URLs are required by the deterministic offline builder.
export const PAINTED_WALKER_URLS = Object.freeze({
  WK01: new URL('../assets/painted/walkers/wk01.png', import.meta.url).href,
  WK02: new URL('../assets/painted/walkers/wk02.png', import.meta.url).href,
  WK05: new URL('../assets/painted/walkers/wk05.png', import.meta.url).href,
  WK06: new URL('../assets/painted/walkers/wk06.png', import.meta.url).href,
  WK09: new URL('../assets/painted/walkers/wk09.png', import.meta.url).href,
  WK10: new URL('../assets/painted/walkers/wk10.png', import.meta.url).href,
});

export const PAINTED_WALKER_FRAME_NAMES = Object.freeze([
  'hull', 'hull-damaged', 'hull-braced', 'turret',
  'upper', 'upper-damaged', 'lower', 'lower-damaged',
  'hip', 'knee', 'foot', 'foot-damaged',
  'foot-braced', 'radiator', 'radiator-damaged', 'radiator-repaired',
]);

/** The drawing coordinate system is exactly the existing vector rig's system.
 * Image bounds may extend beyond these nominal sizes (antennas, muzzle, sole).
 */
export const PAINTED_WALKER_PART_SIZES = Object.freeze(Object.fromEntries(Object.entries(PRODUCTION_RIGS).map(([id, rig]) => [id,
  Object.freeze(Object.fromEntries(Object.entries({
    hull: [rig.width, rig.bodyHeight], turret: [rig.legs === 4 ? 105 : rig.legs === 6 ? 94 : 85, 42],
    upper: [100, 24], lower: [100, 24], hip: [28, 28], knee: [28, 28],
    foot: [rig.footWidth, 18], radiator: [22, rig.bodyHeight * .65],
  }).map(([part, size]) => [part, Object.freeze(size)]))),
])));

// These are the existing physical distances used by simulation.fire. They are
// exposed for art reception; no new firing calculation replaces that function.
export const PAINTED_WALKER_MUZZLES = Object.freeze(Object.fromEntries(Object.entries(PRODUCTION_RIGS)
  .map(([id, rig]) => [id, rig.legs === 4 ? 112 : rig.legs === 6 ? 101 : 92])));

const images = new Map(), states = new Map();
const lowerClipCache = new WeakMap();
let loading = null, generation = 0;
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;

export function setPaintedWalkerImage(walkerId, image) {
  if (!Object.hasOwn(PAINTED_WALKER_URLS, walkerId)) throw new RangeError(`Unknown painted walker atlas: ${walkerId}`);
  const [width, height] = dimensions(image), expected = PAINTED_WALKER_LAYOUT[walkerId]?.size;
  if (!(width > 0 && height > 0) || !Number.isFinite(width + height)) throw new TypeError(`Undecoded walker atlas: ${walkerId}`);
  if (!expected || width !== expected[0] || height !== expected[1]) throw new RangeError(`Unexpected walker atlas dimensions: ${walkerId}`);
  images.set(walkerId, image); states.set(walkerId, { state: 'ready', width, height });
}

export function setPaintedWalkerImages(decoded) {
  for (const [walkerId, image] of Object.entries(decoded)) setPaintedWalkerImage(walkerId, image);
  return paintedWalkerStatus();
}

export function clearPaintedWalkers() {
  generation++; images.clear(); states.clear(); loading = null;
}

export function paintedWalkerStatus() {
  return Object.fromEntries(Object.keys(PAINTED_WALKER_URLS).map(id => [id, { ...(states.get(id) || { state: 'idle' }) }]));
}

function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding is unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Walker atlas could not be decoded'));
    image.src = url;
  });
}

export function loadPaintedWalkers({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_WALKER_URLS).map(async ([id, url]) => {
    if (images.has(id)) return;
    states.set(id, { state: 'loading' });
    try {
      const image = await loadImage(url, id);
      if (version === generation) setPaintedWalkerImage(id, image);
    } catch {
      if (version === generation) states.set(id, { state: 'failed' });
    }
  })).then(() => paintedWalkerStatus());
  return loading;
}

// Internal validation returns a read-only reference. Drawing never needs to
// clone authoring anchors for every limb on every animation frame.
function frameData(walkerId, frame) {
  if (!Object.hasOwn(PAINTED_WALKER_URLS, walkerId)) return null;
  const atlas = PAINTED_WALKER_LAYOUT[walkerId], item = atlas?.frames?.[frame];
  if (!item || !rectangle(item.source) || !rectangle(item.target) || item.source[0] < 0 || item.source[1] < 0) return null;
  if (!atlas.size || item.source[0] + item.source[2] > atlas.size[0] || item.source[1] + item.source[3] > atlas.size[1]) return null;
  if (item.rotation !== undefined && !Number.isFinite(item.rotation)) return null;
  return item;
}

/** Copies prevent callers and render tests from changing the measured layout. */
export function paintedWalkerFrame(walkerId, frame) {
  const item = frameData(walkerId, frame); if (!item) return null;
  return { atlas: walkerId, frame, source: [...item.source], target: [...item.target],
    ...(item.rotation !== undefined ? { rotation: item.rotation } : {}),
    ...(item.anchors ? { anchors: structuredClone(item.anchors) } : {}) };
}

/** Only states that have an equivalent painted frame are accepted. Repair in
 * progress keeps the existing continuously changing vector fins and feedback.
 */
export function paintedWalkerPartFrame({ walkerId, part, state = 'normal' } = {}) {
  if (!Object.hasOwn(PAINTED_WALKER_URLS, walkerId) || !PAINTED_WALKER_PART_SIZES[walkerId]?.[part]) return null;
  if (!['normal', 'hit', 'damaged', 'braced', 'repaired', 'repairing'].includes(state)) return null;
  const damaged = state === 'damaged' || state === 'hit';
  let frame;
  if (part === 'hull') frame = damaged ? 'hull-damaged' : state === 'braced' ? 'hull-braced' : state === 'normal' ? 'hull' : null;
  else if (part === 'upper' || part === 'lower') frame = damaged ? `${part}-damaged` : state === 'normal' || state === 'braced' ? part : null;
  else if (part === 'foot') frame = damaged ? 'foot-damaged' : state === 'braced' ? 'foot-braced' : state === 'normal' || state === 'repaired' ? 'foot' : null;
  else if (part === 'radiator') frame = state === 'damaged' ? 'radiator-damaged' : state === 'repaired' ? 'radiator-repaired' : state === 'normal' ? 'radiator' : null;
  else if (part === 'turret') frame = state === 'damaged' || state === 'repairing' ? null : 'turret';
  else frame = state === 'repairing' ? null : part; // The existing joint caps have no distinct damage geometry.
  return frame ? { atlas: walkerId, frame } : null;
}

function readyPart(options) {
  const selected = paintedWalkerPartFrame(options); if (!selected) return null;
  const image = images.get(selected.atlas), frame = frameData(selected.atlas, selected.frame);
  if (!image || !frame) return null;
  const [width, height] = dimensions(image), [x, y, w, h] = frame.source;
  return x + w <= width && y + h <= height ? { image, frame, atlas: selected.atlas } : null;
}

/** Renderer layer selection uses the same readiness gate as the draw itself.
 * No atlas, frame or mutable source metadata is exposed by this predicate. */
export function isPaintedWalkerPartReady(options = {}) { return Boolean(readyPart(options)); }

function lowerClipBounds(frame) {
  let bounds = lowerClipCache.get(frame); if (bounds) return bounds;
  const [x, y, w, h] = frame.target, angle = frame.rotation || 0, c = Math.cos(angle), s = Math.sin(angle);
  const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].map(([px, py]) => [c * px - s * py, s * px + c * py]);
  const left = Math.min(...corners.map(point => point[0])) - 1;
  const top = Math.min(...corners.map(point => point[1])) - 1, bottom = Math.max(...corners.map(point => point[1])) + 1;
  bounds = [left, top, 100 - left, bottom - top]; lowerClipCache.set(frame, bounds); return bounds;
}

/** Same transform contract as drawProductionPart. The caller must fall back to
 * that vector function when this returns false. An explicit playable ID is
 * mandatory: Cerbère's unregistered rig must never inherit the Vigie skin.
 */
export function drawPaintedWalkerPart(ctx, options = {}) {
  if (typeof ctx.drawImage !== 'function') return false;
  const ready = readyPart(options); if (!ready) return false;
  const { image, frame, atlas } = ready, size = PAINTED_WALKER_PART_SIZES[atlas][options.part];
  const x = options.x ?? 0, y = options.y ?? 0, angle = options.rotation ?? 0;
  const width = options.width ?? size[0], height = options.height ?? size[1];
  if (![x, y, angle, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return false;
  // Aim rotates about the actual mounting. Local y reflection keeps the gun's
  // upper surfaces upright to the left without moving either point on its axis.
  const upright = options.part === 'turret' && Math.cos(angle) < 0 ? -1 : 1;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(x, y); if (angle) ctx.rotate(angle);
    ctx.scale(width / size[0] * (options.facing === -1 ? -1 : 1), height / size[1] * upright);
    if (options.back) {
      const filter = typeof ctx.filter === 'string' && ctx.filter !== 'none' ? `${ctx.filter} ` : '';
      ctx.filter = `${filter}brightness(0.7)`;
    }
    if (options.part === 'lower') {
      // The authored joint ring extends past its centre. Its distal half would
      // sink through the sole on an upright leg; the independent foot receiver
      // covers that half. Clip in corrected canonical rig space, before optical
      // rotation, without changing the PNG, ankle, contact or segment length.
      ctx.beginPath(); ctx.rect(...lowerClipBounds(frame)); ctx.clip();
    }
    if (frame.rotation) ctx.rotate(frame.rotation);
    ctx.drawImage(image, ...frame.source, ...frame.target);
  } catch {
    images.delete(atlas); states.set(atlas, { state: 'failed' });
    return false;
  } finally { ctx.restore(); }
  return true;
}
