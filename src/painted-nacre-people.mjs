/** Nacre people presentation only; mission visibility and population remain facts. */
import { PAINTED_NACRE_PEOPLE_LAYOUT } from './painted-nacre-people-layout.mjs';

export const PAINTED_NACRE_PEOPLE_URLS = Object.freeze({
  technicians: new URL('../assets/painted/nacre-people/technicians.png', import.meta.url).href,
  staff: new URL('../assets/painted/nacre-people/staff.png', import.meta.url).href,
  patients: new URL('../assets/painted/nacre-people/patients.png', import.meta.url).href,
});
const images = new Map(), statuses = new Map();
let loading = null, generation = 0, history = new WeakMap();
const hiddenPhases = new Set(['home', 'origin', 'offsite', 'aboard', 'en-route']);
const movingPhases = new Set(['moving', 'evacuating', 'outside', 'transferring', 'joining', 'boarding', 'returning', 'landing']);

export function setPaintedNacrePeopleImage(key, image) {
  const expected = PAINTED_NACRE_PEOPLE_LAYOUT[key]?.size;
  if (!expected) throw new RangeError(`Unknown Nacre people atlas: ${key}`);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Invalid Nacre people dimensions: ${key}`);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function setPaintedNacrePeopleImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedNacrePeopleImage(key, image);
  return paintedNacrePeopleStatus();
}
export function paintedNacrePeopleStatus() {
  return Object.fromEntries(Object.keys(PAINTED_NACRE_PEOPLE_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
export function clearPaintedNacrePeople() { generation++; images.clear(); statuses.clear(); loading = null; history = new WeakMap(); }
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoder unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Nacre people decoding failed')); image.src = url;
  });
}
export function loadPaintedNacrePeople({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_NACRE_PEOPLE_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedNacrePeopleImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(paintedNacrePeopleStatus);
  return loading;
}
export function paintedNacrePeopleFrame(key, name) {
  const atlas = PAINTED_NACRE_PEOPLE_LAYOUT[key], item = atlas?.frames?.[name];
  if (!item || item.usage !== 'runtime') return null;
  const [x, y, w, h] = item.source;
  if (![x, y, w, h, ...item.target].every(Number.isFinite) || w <= 0 || h <= 0 || x < 0 || y < 0 || x + w > atlas.size[0] || y + h > atlas.size[1]) return null;
  return { atlas: key, frame: name, ...structuredClone(item) };
}

/** Keep appearance choices separate from recovered historical identities. */
export function nacrePeopleRole(person, requested = person?.role) {
  if (requested === 'staff') {
    if (person.originalId === 'ambulance-driver') return 'driver';
    if (person.originalId === 'ambulance-medic') return 'medic';
    return null;
  }
  return ['technician', 'driver', 'medic', 'patient'].includes(requested) ? requested : null;
}

export function nacrePeopleMotion(person, time = 0) {
  const now = Number.isFinite(time) ? time : 0, x = Number.isFinite(person.x) ? person.x : 0;
  const previous = history.get(person);
  if (!previous || now < previous.time) {
    const next = { x, time: now, distance: 0, moving: false, facing: person.facing === -1 ? -1 : 1 };
    history.set(person, next); return { ...next };
  }
  // A paused clock holds the exact presentation pose, even if rendered again.
  if (now === previous.time) return { ...previous };
  const dx = x - previous.x, elapsed = now - previous.time;
  const continuous = elapsed > 0 && elapsed <= .3 && Math.abs(dx) <= Math.max(20, (person.h || 34) * 2);
  const moving = continuous && Math.abs(dx) > .0001 && movingPhases.has(person.phase);
  const next = { x, time: now, distance: continuous ? previous.distance + (moving ? Math.abs(dx) : 0) : 0,
    moving, facing: moving ? Math.sign(dx) : previous.facing };
  history.set(person, next); return { ...next };
}

export function paintedNacrePersonSelection(person, { role: requested, time = 0, reducedMotion = false, allowLost = false } = {}) {
  if (!person || person.safe || hiddenPhases.has(person.phase)) return null;
  const role = nacrePeopleRole(person, requested ?? person.role);
  if (!role || person.alive === false && !allowLost) return null;
  const motion = nacrePeopleMotion(person, time);
  if (role === 'patient') {
    // Index is only an appearance variation in the current roster, never an
    // assertion that an aggregate MI08 person has a particular MI07 identity.
    const suffix = Number(String(person.id || '').match(/(\d+)$/)?.[1]) || 1;
    return { atlas: 'patients', frame: `patient-${(suffix - 1) % 4 + 1}-${person.alive === false ? 'lost' : 'resting'}`, role, facing: 1 };
  }
  let pose = person.alive === false ? 'downed'
    : role === 'technician' && person.covering ? 'covering'
      : role === 'technician' && person.phase === 'locking' ? 'locking'
        : !reducedMotion && motion.moving && person.active !== false
          ? `walk-${Math.floor(motion.distance / Math.max(12, (person.h || 34) * .9) * 4) % 4}` : 'idle';
  return { atlas: role === 'technician' ? 'technicians' : 'staff', frame: role === 'technician' ? pose : `${role}-${pose}`, role, facing: motion.facing };
}

/** False preserves the existing fallback. Callers retain their labels, damage
 * indicators and all mission visibility gates. The measured baseline is mapped
 * onto the person's actual y+h/2; no artificial vertical bob is introduced. */
export function drawPaintedNacrePerson(ctx, person, options = {}) {
  const selection = paintedNacrePersonSelection(person, options);
  if (!selection || typeof ctx?.drawImage !== 'function') return false;
  const image = images.get(selection.atlas), item = paintedNacrePeopleFrame(selection.atlas, selection.frame);
  if (!image || !item) return false;
  const x = person.x, groundY = options.groundY ?? person.y + person.h / 2;
  const scale = selection.role === 'patient' ? (person.w || 26) / 26 : (person.h || 34) / 34;
  const facing = selection.role === 'patient' ? 1 : options.facing ?? selection.facing;
  if (![x, groundY, scale].every(Number.isFinite) || scale <= 0) return false;
  let drawn = false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true; ctx.translate(x, groundY); ctx.scale(facing === -1 ? -scale : scale, scale);
    ctx.drawImage(image, ...item.source, ...item.target); drawn = true;
  } catch {
    images.delete(selection.atlas); statuses.set(selection.atlas, { state: 'failed' });
  } finally { ctx.restore(); }
  // The contact shadow lies at the ground baseline. Only emit it after a
  // successful image draw, so a failed image cannot double the fallback shadow.
  if (drawn) options.shadow?.(x, groundY, selection.role === 'patient' ? 17 : 10, 3);
  return drawn;
}
