/** MI11 site presentation. Bodies, terrain, copies and permissions remain simulated. */
import { PAINTED_VOICE_LAYOUT } from './painted-voice-layout.mjs';
import { VOICE_ASSET_SPECS } from './voice-assets.mjs';

// Literal URLs allow the standalone builder to embed each original exactly once.
export const PAINTED_VOICE_URLS = Object.freeze({
  instruments: new URL('../assets/painted/voice/instruments.png', import.meta.url).href,
  emitter: new URL('../assets/painted/voice/emitter.png', import.meta.url).href,
  'terrain-sites': new URL('../assets/painted/voice/terrain-sites.png', import.meta.url).href,
});
const images = new Map(), statuses = new Map();
let generation = 0, loading = null;
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;
const PARTS = Object.freeze({
  'listening-station': ['instruments', 'listen-'],
  'translation-record': ['instruments', 'record-'],
  'resonance-emitter': ['emitter', ''],
  'nesting-site': ['terrain-sites', 'nest-'],
  'root-passage': ['terrain-sites', 'ridge-'],
});

export function setPaintedVoiceImage(key, image) {
  if (!Object.hasOwn(PAINTED_VOICE_URLS, key)) throw new RangeError(`Unknown voice atlas: ${key}`);
  const [width, height] = dimensions(image), expected = PAINTED_VOICE_LAYOUT[key].size;
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Unexpected voice atlas dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function setPaintedVoiceImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedVoiceImage(key, image);
  return paintedVoiceStatus();
}
export function clearPaintedVoice() { generation++; images.clear(); statuses.clear(); loading = null; }
export function paintedVoiceStatus() {
  return Object.fromEntries(Object.keys(PAINTED_VOICE_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Voice atlas decoding failed')); image.src = url;
  });
}
export function loadPaintedVoice({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_VOICE_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (version === generation) setPaintedVoiceImage(key, image); }
    catch { if (version === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedVoiceStatus());
  return loading;
}
export function paintedVoiceFrame(key, frame) {
  const atlas = PAINTED_VOICE_LAYOUT[key], item = atlas?.frames?.[frame];
  if (!item || !rectangle(item.source) || !rectangle(item.target) || item.source[0] < 0 || item.source[1] < 0 ||
      item.source[0]+item.source[2] > atlas.size[0] || item.source[1]+item.source[3] > atlas.size[1]) return null;
  return { atlas: key, frame, ...structuredClone(item) };
}
export function paintedVoiceSiteFrame(part, state) {
  const spec = PARTS[part], definition = VOICE_ASSET_SPECS[part];
  if (!spec || !definition?.states.includes(state)) return null;
  return paintedVoiceFrame(spec[0], spec[1]+state);
}
/** Bottom anchor and scaling match drawVoiceAsset. The root passage image is
 * only its existing survey landmark; the walkable ledge remains voiceSurfaceAt. */
export function drawPaintedVoiceAsset(ctx, options = {}) {
  const definition = VOICE_ASSET_SPECS[options.part];
  const frame = paintedVoiceSiteFrame(options.part, options.state ?? definition?.states?.[0]);
  const image = frame && images.get(frame.atlas);
  if (!image || frame.usage !== 'runtime' || typeof ctx.drawImage !== 'function') return false;
  const [width, height] = definition.size;
  const sx = (options.scale ?? 1) * (options.width ?? width) / width;
  const sy = (options.scale ?? 1) * (options.height ?? height) / height;
  if (![sx, sy].every(value => Number.isFinite(value) && value > 0)) return false;
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.translate(options.x || 0, options.y || 0);
  ctx.scale(sx * (options.facing === -1 ? -1 : 1), sy);
  ctx.drawImage(image, ...frame.source, ...frame.target);
  ctx.restore(); return true;
}
