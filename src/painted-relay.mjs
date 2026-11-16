/** Painted MI12 presentation. The simulation still owns all bodies and events. */
import { PAINTED_RELAY_LAYOUT } from './painted-relay-layout.mjs';

// Literal URLs are required by the standalone builder.
export const PAINTED_RELAY_URLS = Object.freeze({
  praetor: new URL('../assets/painted/relay/praetor.png', import.meta.url).href,
  'relay-mast': new URL('../assets/painted/relay/relay-mast.png', import.meta.url).href,
  consoles: new URL('../assets/painted/relay/consoles.png', import.meta.url).href,
});
const images = new Map(), statuses = new Map();
let generation = 0, loading = null;
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;

export function setPaintedRelayImage(key, image) {
  if (!Object.hasOwn(PAINTED_RELAY_URLS, key)) throw new RangeError(`Unknown relay atlas: ${key}`);
  const [width, height] = dimensions(image), expected = PAINTED_RELAY_LAYOUT[key].size;
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Unexpected relay atlas dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function setPaintedRelayImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedRelayImage(key, image);
  return paintedRelayStatus();
}
export function clearPaintedRelay() { generation++; images.clear(); statuses.clear(); loading = null; }
export function paintedRelayStatus() {
  return Object.fromEntries(Object.keys(PAINTED_RELAY_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error('Relay atlas decoding failed')); image.src = url;
  });
}
export function loadPaintedRelay({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_RELAY_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (version === generation) setPaintedRelayImage(key, image); }
    catch { if (version === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedRelayStatus());
  return loading;
}

export function paintedRelayFrame(key, frame) {
  const atlas = PAINTED_RELAY_LAYOUT[key], item = atlas?.frames?.[frame];
  if (!item || !rectangle(item.source) || !rectangle(item.target) || item.source[0] < 0 || item.source[1] < 0 ||
      item.source[0]+item.source[2] > atlas.size[0] || item.source[1]+item.source[3] > atlas.size[1]) return null;
  return { atlas: key, frame, ...structuredClone(item) };
}
function readyFrame(key, frame) {
  const image = images.get(key), detail = paintedRelayFrame(key, frame);
  if (!image || !detail || detail.usage !== 'runtime') return null;
  return { image, ...detail };
}
function drawFrame(ctx, key, frame) {
  const value = readyFrame(key, frame);
  if (!value || typeof ctx.drawImage !== 'function') return false;
  ctx.save();
  if (value.rotation) ctx.rotate(value.rotation);
  ctx.drawImage(value.image, ...value.source, ...value.target);
  ctx.restore(); return true;
}

const SITE_PARTS = Object.freeze({
  'relay-mast': { atlas: 'relay-mast', size: [96, 152], prefix: '' },
  'copy-console': { atlas: 'consoles', size: [100, 86], prefix: 'copy-' },
  'command-post': { atlas: 'consoles', size: [64, 70], prefix: 'post-' },
});
export function paintedRelaySiteFrame(part, state) {
  const spec = SITE_PARTS[part];
  return spec ? { atlas: spec.atlas, frame: spec.prefix + state } : null;
}
/** Same bottom anchor and caller scale as drawRelayAsset. */
export function drawPaintedRelaySiteAsset(ctx, options = {}) {
  const spec = SITE_PARTS[options.part], selected = paintedRelaySiteFrame(options.part, options.state);
  if (!spec || !readyFrame(selected.atlas, selected.frame) || typeof ctx.drawImage !== 'function') return false;
  const sx = (options.scale ?? 1) * (options.width ?? spec.size[0]) / spec.size[0];
  const sy = (options.scale ?? 1) * (options.height ?? spec.size[1]) / spec.size[1];
  if (![sx, sy].every(v => Number.isFinite(v) && v > 0)) return false;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(options.x || 0, options.y || 0);
  ctx.scale(sx * (options.facing === 1 ? -1 : 1), sy);
  drawFrame(ctx, selected.atlas, selected.frame);
  ctx.restore(); return true;
}

/** Coordinates stay equal to the existing simulation projectile origin. The
 * fixed lateral mount does not invent a separately simulated aiming turret. */
export function praetorPresentationWeapon(praetor) {
  const facing = praetor.facing === 1 ? 1 : -1;
  return { facing, pivot: [praetor.x + facing * 44, praetor.y - 10], muzzle: [praetor.x + facing * 115, praetor.y - 10] };
}
export function praetorPresentationLeg(praetor, index) {
  const foot = praetor.feet[index]; if (!foot) return null;
  const hip = [praetor.x + (index < 2 ? -48 : 48), praetor.y + 31];
  const knee = [(hip[0]+foot.x)/2 + (index%2 ? 11 : -11), (hip[1]+foot.y)/2];
  const ankleOffset = PAINTED_RELAY_LAYOUT.praetor.frames.foot.anchors.ankle;
  return { hip, knee, ankle: [foot.x, foot.y + ankleOffset[1]], sole: [foot.x, foot.y], back: index%2 === 0 };
}
export function paintedPraetorState(praetor) {
  return {
    hull: praetor.destroyed ? 'hull-destroyed' : praetor.hydraulicLock.destroyed ? 'hull-exposed' : praetor.phase === 'attack' ? 'hull-attack' : 'hull-guard',
    sensor: praetor.sensor.destroyed ? 'sensor-disabled' : praetor.phase === 'attack' ? 'sensor-locking' : 'sensor-tracking',
    lock: praetor.hydraulicLock.destroyed ? 'lock-broken' : 'lock-anchored',
  };
}
function line(ctx, x1, y1, x2, y2, color, width) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.stroke();
}
function positioned(ctx, frame, x, y, { mirror = false, scale = 1 } = {}) {
  ctx.save(); ctx.translate(x,y); ctx.scale(mirror ? -scale : scale, scale); drawFrame(ctx,'praetor',frame); ctx.restore();
}
function segment(ctx, frame, start, end) {
  const dx = end[0]-start[0], dy = end[1]-start[1], length = Math.hypot(dx,dy);
  if (!(length > 0)) return;
  ctx.save(); ctx.translate(...start); ctx.rotate(Math.atan2(dy,dx)); ctx.scale(length/100,length/100);
  drawFrame(ctx,'praetor',frame); ctx.restore();
}
/** Draw the four genuine contact points. No gait clock, new foot contact or
 * additional component-health model is inferred from an atlas. */
export function drawPaintedPraetor(ctx, praetor) {
  if (!praetor?.feet || !readyFrame('praetor','hull-guard') || typeof ctx.drawImage !== 'function') return false;
  const selected = paintedPraetorState(praetor), facing = praetor.facing === 1 ? 1 : -1;
  ctx.save(); ctx.imageSmoothingEnabled = true;
  for (const index of [0,2,1,3]) {
    const pose = praetorPresentationLeg(praetor,index); if (!pose) continue;
    ctx.save(); if (pose.back) ctx.globalAlpha *= .78;
    segment(ctx,'upper',pose.hip,pose.knee); segment(ctx,'lower',pose.knee,pose.ankle);
    positioned(ctx,'foot',...pose.sole,{ mirror:facing===-1 });
    positioned(ctx,'hip',...pose.hip); positioned(ctx,'knee',...pose.knee);
    ctx.restore();
  }
  // The collider centres stay unchanged. This short mounting neck bridges the
  // measured sensor pedestal to the hull; otherwise the separate PNGs float.
  line(ctx,praetor.sensor.x,praetor.y-39,praetor.sensor.x,praetor.sensor.y+14,'#28332e',12);
  line(ctx,praetor.sensor.x-1,praetor.y-40,praetor.sensor.x-1,praetor.sensor.y+15,'#828a71',6);
  positioned(ctx,selected.hull,praetor.x,praetor.y,{ mirror:facing===1 });
  const weapon = praetorPresentationWeapon(praetor);
  positioned(ctx,'cannon',...weapon.pivot,{ mirror:facing===1 });
  line(ctx,praetor.x+facing*69,praetor.y+30,praetor.hydraulicLock.x,praetor.hydraulicLock.y,'#29382f',praetor.hydraulicLock.destroyed ? 5 : 8);
  line(ctx,praetor.x+facing*69,praetor.y+30,praetor.hydraulicLock.x,praetor.hydraulicLock.y,
    praetor.hydraulicLock.destroyed ? '#715f4d' : '#a4a386',praetor.hydraulicLock.destroyed ? 2 : 4);
  positioned(ctx,selected.sensor,praetor.sensor.x,praetor.sensor.y,{ mirror:facing===1 });
  positioned(ctx,selected.lock,praetor.hydraulicLock.x,praetor.hydraulicLock.y,{ mirror:facing===1 });
  ctx.restore(); return true;
}
