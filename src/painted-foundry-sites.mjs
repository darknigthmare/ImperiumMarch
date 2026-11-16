/** MI13 presentation only. Steam, transfers, copies and foot contacts remain simulated. */
import { PAINTED_FOUNDRY_SITES_LAYOUT } from './painted-foundry-sites-layout.mjs';
import { FOUNDRY_ASSET_SPECS } from './foundry-assets.mjs';

// Literal paths let the standalone build embed each original PNG exactly once.
export const PAINTED_FOUNDRY_SITES_URLS = Object.freeze({
  valves: new URL('../assets/painted/foundry-sites/valves.png', import.meta.url).href,
  cranes: new URL('../assets/painted/foundry-sites/cranes.png', import.meta.url).href,
  consoles: new URL('../assets/painted/foundry-sites/consoles.png', import.meta.url).href,
  thermal: new URL('../assets/painted/foundry-sites/thermal.png', import.meta.url).href,
});
const PARTS = Object.freeze({
  'steam-valve': ['valves', ''], 'transfer-crane': ['cranes', ''],
  'analysis-console': ['consoles', 'console-'], 'cargo-manifest': ['consoles', 'manifest-'],
});
const images = new Map(), statuses = new Map();
let generation = 0, loading = null;
const clamp = n => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = a => Array.isArray(a) && a.length === 4 && a.every(Number.isFinite) && a[2] > 0 && a[3] > 0;

export function setPaintedFoundrySitesImage(key, image) {
  if (!Object.hasOwn(PAINTED_FOUNDRY_SITES_URLS, key)) throw new RangeError(`Unknown foundry sites atlas: ${key}`);
  const [width, height] = dimensions(image), expected = PAINTED_FOUNDRY_SITES_LAYOUT[key].size;
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Unexpected foundry sites atlas dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function setPaintedFoundrySitesImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedFoundrySitesImage(key, image);
  return paintedFoundrySitesStatus();
}
export function clearPaintedFoundrySites() { generation++; images.clear(); statuses.clear(); loading = null; }
export function paintedFoundrySitesStatus() {
  return Object.fromEntries(Object.keys(PAINTED_FOUNDRY_SITES_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image(); image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Foundry sites image decoding failed')); image.src = url;
  });
}
export function loadPaintedFoundrySites({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_FOUNDRY_SITES_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (version === generation) setPaintedFoundrySitesImage(key, image); }
    catch { if (version === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedFoundrySitesStatus());
  return loading;
}
export function paintedFoundrySitesFrame(key, name) {
  const atlas = PAINTED_FOUNDRY_SITES_LAYOUT[key], frame = atlas?.frames?.[name];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.target) || frame.source[0] < 0 || frame.source[1] < 0 ||
      frame.source[0]+frame.source[2] > atlas.size[0] || frame.source[1]+frame.source[3] > atlas.size[1]) return null;
  return { atlas: key, frame: name, ...structuredClone(frame) };
}
export function paintedFoundrySiteFrame(part, state) {
  const route = PARTS[part], spec = FOUNDRY_ASSET_SPECS[part];
  if (!route || !spec?.states.includes(state)) return null;
  return paintedFoundrySitesFrame(route[0], route[1]+state);
}
function drawFrame(ctx, image, frame) { ctx.drawImage(image, ...frame.source, ...frame.target); }
function withContext(ctx, draw) { ctx.save(); try { return draw(); } finally { ctx.restore(); } }

/** Same local ground anchor and requested scale as drawFoundryAsset. */
export function drawPaintedFoundrySiteAsset(ctx, options = {}) {
  const spec = FOUNDRY_ASSET_SPECS[options.part], state = options.state ?? spec?.states[0];
  const frame = paintedFoundrySiteFrame(options.part, state), image = frame && images.get(frame.atlas);
  if (!image || frame.usage !== 'runtime' || typeof ctx.drawImage !== 'function') return false;
  const sx = options.width != null ? options.width/spec.size[0] : options.scale ?? 1;
  const sy = options.height != null ? options.height/spec.size[1] : options.scale ?? 1;
  if (![sx,sy].every(n => Number.isFinite(n) && n > 0) || ![options.x ?? 0,options.y ?? 0].every(Number.isFinite)) return false;
  try { return withContext(ctx, () => {
  ctx.imageSmoothingEnabled = true; ctx.translate(options.x ?? 0, options.y ?? 0);
  ctx.scale(sx*(options.facing === -1 ? -1 : 1), sy);
  drawFrame(ctx, image, frame);
  if (options.part === 'steam-valve' && state !== 'destroyed') {
    // A single wheel turns at the measured body axle, never over a baked wheel.
    const wheel = paintedFoundrySitesFrame('valves', 'wheel');
    withContext(ctx, () => { ctx.translate(...frame.wheelAxle); ctx.rotate(clamp(options.progress)*Math.PI/2); drawFrame(ctx, image, wheel); });
  }
  if (options.part === 'transfer-crane') {
    // This is the existing gantry's presentation rig, not a new cargo constraint.
    const hook = paintedFoundrySitesFrame('cranes', 'hook');
    const [hx,hy] = frame.hoist, bottom = state === 'working' || options.working === true ? -83+clamp(options.progress)*24 : -80;
    ctx.beginPath(); ctx.moveTo(hx-3,hy); ctx.lineTo(hx-3,bottom); ctx.moveTo(hx+3,hy); ctx.lineTo(hx+3,bottom);
    ctx.strokeStyle='#b3b29c'; ctx.lineWidth=1.6; ctx.stroke();
    withContext(ctx, () => { ctx.translate(hx,bottom); drawFrame(ctx,image,hook); });
  }
  return true;
  }); } catch { return false; }
}

/** Each small image strip follows the real physical surface, including slopes.
 * The shared top edge remains separately stroked by the terrain renderer. */
export function drawPaintedFoundryDeck(ctx, { state = 'hot', start, end, from = start, to = end, surfaceAt } = {}) {
  const frame = paintedFoundrySitesFrame('thermal', 'deck-'+state), image = images.get('thermal');
  if (!image || !frame?.tile || typeof ctx.drawImage !== 'function' || typeof surfaceAt !== 'function' ||
      ![start,end,from,to].every(Number.isFinite) || end <= start || to <= from) return false;
  const tile = frame.tile, [u,v,sw,sh] = tile.source;
  try { return withContext(ctx, () => {
  ctx.imageSmoothingEnabled=true;
  for (let x=Math.max(start,from); x<Math.min(end,to);) {
    let phase=((x-start)%tile.width+tile.width)%tile.width;
    // Avoid a sub-ULP width at a tile boundary when the camera has a fractional position.
    if(tile.width-phase<1e-6)phase=0;
    const width=Math.min(8,tile.width-phase,Math.min(end,to)-x);
    const y0=surfaceAt(x), y1=surfaceAt(x+width);
    if (![y0,y1].every(Number.isFinite)) return false;
    withContext(ctx, () => { ctx.transform(1,(y1-y0)/width,0,1,x,y0);
      ctx.drawImage(image,u+phase/tile.width*sw,v,width/tile.width*sw,sh,0,0,width,tile.height); });
    x+=width;
  }
  return true;
  }); } catch { return false; }
}

/** Only the grille is painted. Steam plumes and damage boundaries stay simulated. */
export function drawPaintedFoundrySteamOutlet(ctx, { state = 'rest', x=0, y=0 } = {}) {
  const frame=paintedFoundrySitesFrame('thermal','vent-'+state),image=images.get('thermal');
  if (!image || !frame || typeof ctx.drawImage !== 'function' || ![x,y].every(Number.isFinite)) return false;
  try { return withContext(ctx, () => { ctx.imageSmoothingEnabled=true; ctx.translate(x,y+2); drawFrame(ctx,image,frame); return true; }); }
  catch { return false; }
}
