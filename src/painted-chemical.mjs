/** MI10 painted presentation only. The physical chemical domain stays untouched. */
import { CHEMICAL_ASSET_SPECS } from './chemical-assets.mjs';
import { PAINTED_CHEMICAL_LAYOUT } from './painted-chemical-layout.mjs';

// Literal URLs let the autonomous HTML builder embed original image bytes.
export const PAINTED_CHEMICAL_URLS = Object.freeze({
  tanks: new URL('../assets/painted/chemical/tanks.png', import.meta.url).href,
  instruments: new URL('../assets/painted/chemical/instruments.png', import.meta.url).href,
  valves: new URL('../assets/painted/chemical/valves.png', import.meta.url).href,
  canals: new URL('../assets/painted/chemical/canals.png', import.meta.url).href,
  homes: new URL('../assets/painted/chemical/homes.png', import.meta.url).href,
});
const PARTS = Object.freeze({
  'chemical-tank': ['tanks', ''], 'sampling-rig': ['instruments', 'sample-'],
  'batch-ledger': ['instruments', 'ledger-'], 'field-valve': ['valves', ''],
  'canal-junction': ['canals', ''], 'village-supply': ['homes', ''],
});
const images = new Map(), states = new Map();
let generation = 0, loading = null;
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;

export function setPaintedChemicalImage(key, image) {
  const atlas = PAINTED_CHEMICAL_LAYOUT[key];
  if (!atlas) throw new RangeError(`Unknown chemical atlas: ${key}`);
  const [width, height] = dimensions(image);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError(`Unexpected chemical atlas dimensions: ${key}`);
  images.set(key, image); states.set(key, { state: 'ready', width, height });
}
export function clearPaintedChemical() { generation++; images.clear(); states.clear(); loading = null; }
export function paintedChemicalStatus() {
  return Object.fromEntries(Object.keys(PAINTED_CHEMICAL_URLS).map(key => [key, { ...(states.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Chemical atlas decoding failed')); image.src = url;
  });
}
export function loadPaintedChemical({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_CHEMICAL_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    states.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedChemicalImage(key, image); }
    catch { if (current === generation) states.set(key, { state: 'failed' }); }
  })).then(() => paintedChemicalStatus());
  return loading;
}
export function paintedChemicalFrame(part, state = CHEMICAL_ASSET_SPECS[part]?.states[0]) {
  const spec = CHEMICAL_ASSET_SPECS[part], mapping = PARTS[part];
  if (!spec || !mapping || !spec.states.includes(state)) return null;
  const [key, prefix] = mapping, atlas = PAINTED_CHEMICAL_LAYOUT[key], name = prefix + state, item = atlas?.frames[name];
  if (!item || !rectangle(item.source) || !rectangle(item.target) || item.source[0] < 0 || item.source[1] < 0 ||
      item.source[0]+item.source[2] > atlas.size[0] || item.source[1]+item.source[3] > atlas.size[1]) return null;
  return { atlas: key, frame: name, ...structuredClone(item) };
}
/** Same bottom origin, nominal dimensions and caller transform as the vector kit.
 * Work bars, body health, fluid mass and the precise canal cover stay in the renderer.
 * Returning false leaves an independent, per-atlas vector fallback available. */
export function drawPaintedChemicalAsset(ctx, options = {}) {
  const part = options.part || 'chemical-tank', frame = paintedChemicalFrame(part, options.state);
  const spec = CHEMICAL_ASSET_SPECS[part], image = images.get(frame?.atlas);
  if (!frame || !image || typeof ctx.drawImage !== 'function') return false;
  const scale = options.scale ?? 1, width = options.width ?? spec.size[0], height = options.height ?? spec.size[1];
  const x = options.x ?? 0, y = options.y ?? 0;
  if (![scale, width, height, x, y].every(Number.isFinite) || scale <= 0 || width <= 0 || height <= 0) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true; ctx.translate(x, y);
    const sx = scale * width / spec.size[0] * (options.facing === -1 ? -1 : 1), sy = scale * height / spec.size[1];
    ctx.scale(sx, sy);
    const drawRectangle = (source, target) => {
    if (part === 'canal-junction' && typeof options.groundAt === 'function') {
      // The channel is laid along real terrain. Small source slices keep the
      // painted plate next to the separately drawn chemicalSurfaceAt cover.
      // A flat bitmap would visibly detach on the mission's sloping ground.
      const [u,v,sw,sh] = source, [tx,ty,tw,th] = target;
      const count = Math.max(1, Math.ceil(Math.abs(tw*sx)/4)), base = options.groundAt(x);
      for (let i=0;i<count;i++) {
        const start=i/count, end=Math.min(1,(i+1)/count), centre=(start+end)/2;
        const offset=(options.groundAt(x+(tx+tw*centre)*sx)-base)/sy;
        ctx.drawImage(image,u+sw*start,v,sw*(end-start),sh,tx+tw*start,ty+offset,tw*(end-start)+.06,th);
      }
    } else ctx.drawImage(image, ...source, ...target);
    };
    drawRectangle(frame.source, frame.target);
    if (part === 'canal-junction' && frame.state !== 'destroyed' && (options.covered || frame.state === 'covered')) {
      const cover = PAINTED_CHEMICAL_LAYOUT.canals.coverOverlay;
      drawRectangle(cover.source, cover.target);
    }
    return true;
  } catch { return false; }
  finally { ctx.restore(); }
}
