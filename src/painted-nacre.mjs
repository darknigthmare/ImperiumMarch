/** Painted Nacre presentation only. Mission facts and contacts stay in simulation. */
import { PAINTED_NACRE_LAYOUT } from './painted-nacre-layout.mjs';

// Literal image URLs are embedded by the autonomous HTML builder.
export const PAINTED_NACRE_URLS = Object.freeze({
  ambulance: new URL('../assets/painted/nacre/ambulance.png', import.meta.url).href,
  equipment: new URL('../assets/painted/nacre/equipment.png', import.meta.url).href,
  'rive-courte': new URL('../assets/painted/nacre/rive-courte.png', import.meta.url).href,
  'veille-aval': new URL('../assets/painted/nacre/veille-aval.png', import.meta.url).href,
  ferry: new URL('../assets/painted/nacre/ferry.png', import.meta.url).href,
  saisie: new URL('../assets/painted/nacre/saisie.png', import.meta.url).href,
});
const images = new Map(), states = new Map();
let loading = null, generation = 0;
const dimensions = picture => [Number(picture?.naturalWidth || picture?.width || 0), Number(picture?.naturalHeight || picture?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;

export function setPaintedNacreImage(key, picture) {
  if (!Object.hasOwn(PAINTED_NACRE_URLS, key)) throw new RangeError(`Unknown Nacre atlas: ${key}`);
  const [width, height] = dimensions(picture), expected = PAINTED_NACRE_LAYOUT[key].size;
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Invalid Nacre dimensions: ${key}`);
  images.set(key, picture); states.set(key, { state: 'ready', width, height });
}
export function setPaintedNacreImages(decoded) {
  for (const [key, picture] of Object.entries(decoded)) setPaintedNacreImage(key, picture);
  return paintedNacreStatus();
}
export function paintedNacreStatus() {
  return Object.fromEntries(Object.keys(PAINTED_NACRE_URLS).map(key => [key, { ...(states.get(key) || { state: 'idle' }) }]));
}
export function clearPaintedNacre() { generation++; images.clear(); states.clear(); loading = null; }
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoder unavailable')); return; }
    const picture = new globalThis.Image(); picture.onload = () => resolve(picture); picture.onerror = () => reject(new Error('Nacre image decoding failed')); picture.src = url;
  });
}
export function loadPaintedNacre({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_NACRE_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    states.set(key, { state: 'loading' });
    try { const picture = await loadImage(url, key); if (version === generation) setPaintedNacreImage(key, picture); }
    catch { if (version === generation) states.set(key, { state: 'failed' }); }
  })).then(paintedNacreStatus);
  return loading;
}

export function paintedNacreFrame(key, name) {
  const atlas = PAINTED_NACRE_LAYOUT[key], detail = atlas?.frames?.[name];
  if (!detail || !rectangle(detail.source) || !rectangle(detail.target)) return null;
  const [x, y, width, height] = detail.source;
  if (x < 0 || y < 0 || x + width > atlas.size[0] || y + height > atlas.size[1]) return null;
  return { atlas: key, frame: name, ...structuredClone(detail) };
}
function ready(key, name) { return images.has(key) && paintedNacreFrame(key, name); }
function drawFrame(ctx, key, name) {
  const detail = ready(key, name);
  if (!detail || typeof ctx.drawImage !== 'function') return false;
  ctx.drawImage(images.get(key), ...detail.source, ...detail.target); return true;
}

export function paintedNacreBoatFrame(boat, atlas, { released = false } = {}) {
  if (!['rive-courte', 'veille-aval', 'ferry', 'saisie'].includes(atlas) || !boat) return null;
  // A late arrival never erases acquired damage. State remains a display choice.
  const damage = Number.isFinite(boat.hp) && Number.isFinite(boat.maxHp) && boat.maxHp > 0 && boat.hp < boat.maxHp * .7;
  const frame = boat.destroyed || boat.hp <= 0 ? 'destroyed' : damage ? 'damaged'
    : atlas === 'saisie' ? released ? 'released' : 'normal'
      : boat.arrived ? 'arrived' : atlas === 'ferry' ? 'waiting'
        : boat.moving ? 'moving' : boat.phase === 'boarding' ? 'boarding' : 'waiting';
  return { atlas, frame };
}

export function drawPaintedNacreBoat(ctx, boat, { atlas, released = false } = {}) {
  const selected = paintedNacreBoatFrame(boat, atlas, { released });
  if (!selected || !ready(selected.atlas, selected.frame) || typeof ctx.drawImage !== 'function') return false;
  const nominal = PAINTED_NACRE_LAYOUT[atlas].nominal;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(boat.x, boat.y); ctx.scale(boat.w / nominal[0], boat.h / nominal[1]);
  drawFrame(ctx, selected.atlas, selected.frame); ctx.restore(); return true;
}

export function paintedNacreAmbulanceFrame(vehicle) {
  return vehicle.destroyed || vehicle.hp <= 0 ? 'destroyed' : vehicle.hp < vehicle.maxHp * .7 ? 'damaged' : 'normal';
}
export function nacreAmbulanceWheelPoses(vehicle, groundY, { reducedMotion = false } = {}) {
  return [-1, 1].map(side => ({ x: vehicle.x + side * 58, y: groundY - 11, radius: 12,
    angle: reducedMotion ? 0 : vehicle.x / 12 }));
}
export function drawPaintedNacreAmbulance(ctx, vehicle, { groundY, reducedMotion = false } = {}) {
  const frame = paintedNacreAmbulanceFrame(vehicle);
  if (!ready('ambulance', frame) || frame !== 'destroyed' && !ready('ambulance', 'wheel') || typeof ctx.drawImage !== 'function') return false;
  if (!Number.isFinite(groundY)) return false;
  ctx.save(); ctx.imageSmoothingEnabled = true;
  if (frame !== 'destroyed') for (const pose of nacreAmbulanceWheelPoses(vehicle, groundY, { reducedMotion })) {
    ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.angle); drawFrame(ctx, 'ambulance', 'wheel'); ctx.restore();
  }
  ctx.translate(vehicle.x, vehicle.y); ctx.scale(vehicle.w / 176, vehicle.h / 78);
  drawFrame(ctx, 'ambulance', frame); ctx.restore(); return true;
}

export function paintedNacreEquipmentFrame(part, entity) {
  if (part === 'case') return entity.destroyed ? 'case-destroyed' : entity.verified ? 'case-verified' : 'case-unknown';
  if (part === 'beacon') return entity.recovered ? null : entity.destroyed ? 'beacon-lost' : 'beacon-attached';
  return null;
}
export function drawPaintedNacreEquipment(ctx, part, entity) {
  const frame = paintedNacreEquipmentFrame(part, entity);
  if (!frame || !ready('equipment', frame) || typeof ctx.drawImage !== 'function') return false;
  const nominal = part === 'case' ? [74, 32] : [26, 20];
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(entity.x, entity.y); ctx.scale(entity.w / nominal[0], entity.h / nominal[1]);
  drawFrame(ctx, 'equipment', frame); ctx.restore(); return true;
}
