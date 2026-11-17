/** Nacre inhabitants and quay services. Presentation only, outside save data. */
import { PAINTED_NACRE_CIVILIANS_LAYOUT } from './painted-nacre-civilians-layout.mjs';

export const PAINTED_NACRE_CIVILIANS_URLS = Object.freeze({
  residents: new URL('../assets/painted/nacre-civilians/residents.png', import.meta.url).href,
  refugees: new URL('../assets/painted/nacre-civilians/refugees.png', import.meta.url).href,
  dockworkers: new URL('../assets/painted/nacre-civilians/dockworkers.png', import.meta.url).href,
  mara: new URL('../assets/painted/nacre-civilians/mara.png', import.meta.url).href,
  ancillary: new URL('../assets/painted/nacre-civilians/ancillary.png', import.meta.url).href,
});
const images = new Map(), statuses = new Map();
let loading = null, generation = 0, motionHistory = new WeakMap();
const hiddenPhases = new Set(['home', 'origin', 'offsite', 'aboard', 'en-route']);
const movingPhases = new Set(['moving', 'evacuating', 'outside', 'transferring', 'joining', 'boarding', 'returning', 'landing']);

export function setPaintedNacreCivilianImage(key, image) {
  const expected = PAINTED_NACRE_CIVILIANS_LAYOUT[key]?.size;
  if (!expected) throw new RangeError(`Unknown Nacre civilian atlas: ${key}`);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Invalid Nacre civilian dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function setPaintedNacreCivilianImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedNacreCivilianImage(key, image);
  return paintedNacreCivilianStatus();
}
export function paintedNacreCivilianStatus() {
  return Object.fromEntries(Object.keys(PAINTED_NACRE_CIVILIANS_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
export function clearPaintedNacreCivilians() {
  generation++; images.clear(); statuses.clear(); loading = null; motionHistory = new WeakMap();
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoder unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Nacre civilian decoding failed')); image.src = url;
  });
}
export function loadPaintedNacreCivilians({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_NACRE_CIVILIANS_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedNacreCivilianImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(paintedNacreCivilianStatus);
  return loading;
}
export function paintedNacreCivilianFrame(key, name) {
  const atlas = PAINTED_NACRE_CIVILIANS_LAYOUT[key], item = atlas?.frames?.[name];
  if (!item || item.usage !== 'runtime') return null;
  const [x, y, w, h] = item.source;
  if (![x, y, w, h, ...item.target].every(Number.isFinite) || w <= 0 || h <= 0 || x < 0 || y < 0 || x + w > atlas.size[0] || y + h > atlas.size[1]) return null;
  return { atlas: key, frame: name, ...structuredClone(item) };
}

/** A current-roster appearance, never a recovered identity across missions. */
export function nacreCivilianVariation(person) {
  let hash = 2166136261;
  for (const character of String(person?.id || 'unidentified')) hash = Math.imul(hash ^ character.codePointAt(0), 16777619) >>> 0;
  return hash % 2 + 1;
}
export function nacreCivilianRole(person, requested = person?.role) {
  if (!person) return null;
  if (requested === 'staff') return person.originalId == null ? 'ancillary' : null;
  if (requested === 'resident' && (person.homeId || person.role === 'resident')) return 'resident';
  if (['refugee', 'crew', 'harbourmaster'].includes(requested) && person.role === requested) return requested;
  // Mara is the identified MI08 actor. A radio contact does not instantiate her.
  if (requested === 'mara' && person.role === 'mara' && person.id === 'aval-mara'
      && person.originalId === 'PN07' && person.sourceMission === 'MI08') return 'mara';
  return null;
}
export function nacreCivilianMotion(person, time = 0) {
  const now = Number.isFinite(time) ? time : 0, x = Number.isFinite(person.x) ? person.x : 0;
  const previous = motionHistory.get(person);
  if (!previous || now < previous.time) {
    const next = { x, time: now, distance: 0, moving: false, facing: person.facing === -1 ? -1 : 1 };
    motionHistory.set(person, next); return { ...next };
  }
  if (now === previous.time) return { ...previous };
  const dx = x - previous.x, elapsed = now - previous.time;
  const continuous = elapsed > 0 && elapsed <= .3 && Math.abs(dx) <= Math.max(20, (person.h || 34) * 2);
  const moving = continuous && Math.abs(dx) > .0001 && movingPhases.has(person.phase);
  const next = { x, time: now, distance: continuous ? previous.distance + (moving ? Math.abs(dx) : 0) : 0,
    moving, facing: moving ? Math.sign(dx) : previous.facing };
  motionHistory.set(person, next); return { ...next };
}
export function paintedNacreCivilianSelection(person, { role: requested, time = 0, reducedMotion = false, allowLost = false } = {}) {
  if (!person || person.safe || hiddenPhases.has(person.phase)) return null;
  const role = nacreCivilianRole(person, requested ?? person.role);
  if (!role) return null;
  // Only MI06 residents have an existing exposed loss depiction. MI08 keeps
  // its established absence of corpses, including if allowLost is mis-supplied.
  const lost = person.alive === false;
  if (lost && !(allowLost && role === 'resident' && person.homeId)) return null;
  const motion = nacreCivilianMotion(person, time);
  const pose = lost ? 'downed' : !reducedMotion && motion.moving && person.active !== false
    ? `walk-${Math.floor(motion.distance / Math.max(12, (person.h || 34) * .9) * 4) % 4}` : 'idle';
  const variation = ['resident', 'refugee'].includes(role) ? nacreCivilianVariation(person) : null;
  const prefix = variation ? `${role}-${variation}` : role;
  const atlas = role === 'resident' ? 'residents' : role === 'refugee' ? 'refugees'
    : ['crew', 'harbourmaster'].includes(role) ? 'dockworkers' : role;
  const frame = `${prefix}-${pose}`;
  if (!paintedNacreCivilianFrame(atlas, frame)) return null;
  return { atlas, frame, role, variation, facing: motion.facing };
}

/** Caller retains mission visibility, labels, health and boarding indicators. */
export function drawPaintedNacreCivilian(ctx, person, options = {}) {
  const selection = paintedNacreCivilianSelection(person, options);
  if (!selection || typeof ctx?.drawImage !== 'function') return false;
  const image = images.get(selection.atlas), item = paintedNacreCivilianFrame(selection.atlas, selection.frame);
  if (!image || !item) return false;
  const x = person.x, groundY = options.groundY ?? person.y + person.h / 2, scale = (person.h || 34) / 34;
  const facing = options.facing ?? selection.facing;
  if (![x, groundY, scale].every(Number.isFinite) || scale <= 0) return false;
  let drawn = false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true; ctx.translate(x, groundY); ctx.scale(facing === -1 ? -scale : scale, scale);
    ctx.drawImage(image, ...item.source, ...item.target); drawn = true;
  } catch {
    images.delete(selection.atlas); statuses.set(selection.atlas, { state: 'failed' });
  } finally { ctx.restore(); }
  if (drawn) options.shadow?.(x, groundY, 10, 3);
  return drawn;
}
