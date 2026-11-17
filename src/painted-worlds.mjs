/** Distant scenery only. World geometry, weather and campaign facts stay in the simulation. */
export const PAINTED_WORLD_URLS = Object.freeze({
  PL02: new URL('../assets/painted/worlds/nacre.png', import.meta.url).href,
  PL03: new URL('../assets/painted/worlds/thyr.png', import.meta.url).href,
  PL04: new URL('../assets/painted/worlds/kharon.png', import.meta.url).href,
});
export const PAINTED_WORLD_SIZE = Object.freeze([2172, 724]);
const images = new Map(), statuses = new Map();
let generation = 0, loading = null;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];

export function paintedWorldStatus() {
  return Object.fromEntries(Object.keys(PAINTED_WORLD_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
export function setPaintedWorldImage(planetId, image) {
  if (!Object.hasOwn(PAINTED_WORLD_URLS, planetId)) throw new RangeError(`Unknown world panorama: ${planetId}`);
  const [width, height] = dimensions(image);
  if (width !== PAINTED_WORLD_SIZE[0] || height !== PAINTED_WORLD_SIZE[1]) throw new RangeError(`Unexpected world panorama dimensions: ${planetId}`);
  images.set(planetId, image); statuses.set(planetId, { state: 'ready', width, height });
}
export function clearPaintedWorlds() { generation++; images.clear(); statuses.clear(); loading = null; }
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('World panorama decoding failed'));
    image.src = url;
  });
}
export function loadPaintedWorlds({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_WORLD_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try {
      const image = await loadImage(url, key);
      if (version === generation) setPaintedWorldImage(key, image);
    } catch { if (version === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedWorldStatus());
  return loading;
}

/** A single finite panorama spans the mission without wrapping or exposing an edge.
 * Preserve the source aspect ratio; reduced motion fixes the view at its centre.
 * This also accepts the historical Vesper panorama without changing its public properties. */
export function worldPanoramaProjection({ imageWidth, imageHeight, width = 1600, height = 740,
  cameraX = 0, worldLength = width, reducedMotion = false } = {}) {
  if (![imageWidth, imageHeight, width, height, cameraX, worldLength].every(Number.isFinite) ||
      imageWidth <= 0 || imageHeight <= 0 || width <= 0 || height <= 0 || worldLength <= 0) return null;
  const ratio = imageWidth / imageHeight;
  const drawWidth = Math.max(width + 160, height * ratio), drawHeight = drawWidth / ratio;
  const travel = Math.max(0, worldLength - width + 100);
  const progress = reducedMotion || travel === 0 ? .5 : clamp(cameraX / travel, 0, 1);
  return { x: -(drawWidth - width) * progress, y: height - drawHeight, width: drawWidth, height: drawHeight };
}

/** False means the caller must draw its existing vector horizon for this planet. */
export function drawPaintedWorld(ctx, { planetId, ...options } = {}) {
  const image = images.get(planetId);
  if (!image || typeof ctx?.drawImage !== 'function') return false;
  const [imageWidth, imageHeight] = dimensions(image);
  const pose = worldPanoramaProjection({ ...options, imageWidth, imageHeight });
  if (!pose) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(image, pose.x, pose.y, pose.width, pose.height);
    return true;
  } catch {
    images.delete(planetId); statuses.set(planetId, { state: 'failed' });
    return false;
  } finally { ctx.restore(); }
}
