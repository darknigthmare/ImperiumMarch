/** Painted Thyr presentation. The scene remains the sole authority for beings,
 * positions, arrival, consent, damage, ground contacts and saved state. */
import { PAINTED_THYR_LAYOUT } from './painted-thyr-layout.mjs';
import { THYR_ASSET_SPECS } from './thyr-assets.mjs';
import { VOICE_ASSET_SPECS } from './voice-assets.mjs';

// The standalone builder embeds these literal URLs without a network request.
export const PAINTED_THYR_URLS = Object.freeze({
  'longuedorse-adult': new URL('../assets/painted/thyr/longuedorse-adult.png', import.meta.url).href,
  'longuedorse-young': new URL('../assets/painted/thyr/longuedorse-young.png', import.meta.url).href,
  'fan-colony': new URL('../assets/painted/thyr/fan-colony.png', import.meta.url).href,
  column: new URL('../assets/painted/thyr/column.png', import.meta.url).href,
  habitat: new URL('../assets/painted/thyr/habitat.png', import.meta.url).href,
  plants: new URL('../assets/painted/thyr/plants.png', import.meta.url).href,
  leth: new URL('../assets/painted/thyr/leth.png', import.meta.url).href,
  rootwatcher: new URL('../assets/painted/thyr/rootwatcher.png', import.meta.url).href,
});

const images = new Map(), states = new Map();
let loading = null, generation = 0, motionHistory = new WeakMap();
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const phaseIndex = (progress, count) => Math.floor(((finite(progress) % 1) + 1) % 1 * count) % count;

export function setPaintedThyrImage(key, image) {
  if (!Object.hasOwn(PAINTED_THYR_URLS, key)) throw new RangeError(`Unknown painted Thyr atlas: ${key}`);
  const [width, height] = dimensions(image), expected = PAINTED_THYR_LAYOUT[key]?.size;
  if (!(width > 0 && height > 0) || !Number.isFinite(width + height)) throw new TypeError(`Undecoded Thyr atlas: ${key}`);
  if (!expected || width !== expected[0] || height !== expected[1]) throw new RangeError(`Unexpected Thyr atlas dimensions: ${key}`);
  images.set(key, image); states.set(key, { state: 'ready', width, height });
}

export function setPaintedThyrImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedThyrImage(key, image);
  return paintedThyrStatus();
}

export function clearPaintedThyr() {
  generation++; images.clear(); states.clear(); loading = null; motionHistory = new WeakMap();
}

export function paintedThyrStatus() {
  return Object.fromEntries(Object.keys(PAINTED_THYR_URLS).map(key => [key, { ...(states.get(key) || { state: 'idle' }) }]));
}

function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding is unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Thyr atlas could not be decoded'));
    image.src = url;
  });
}

export function loadPaintedThyr({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_THYR_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    states.set(key, { state: 'loading' });
    try {
      const image = await loadImage(url, key);
      if (version === generation) setPaintedThyrImage(key, image);
    } catch {
      if (version === generation) states.set(key, { state: 'failed' });
    }
  })).then(() => paintedThyrStatus());
  return loading;
}

function frameData(key, frame) {
  if (!Object.hasOwn(PAINTED_THYR_URLS, key)) return null;
  const atlas = PAINTED_THYR_LAYOUT[key], item = atlas?.frames?.[frame];
  if (!item || !rectangle(item.source) || !rectangle(item.target) || item.source[0] < 0 || item.source[1] < 0) return null;
  if (!atlas.size || item.source[0] + item.source[2] > atlas.size[0] || item.source[1] + item.source[3] > atlas.size[1]) return null;
  if (item.rotation !== undefined && !Number.isFinite(item.rotation)) return null;
  return item;
}

/** Callers receive copies; neither the source index nor anchors can be edited
 * by an inspection tool or a normal drawing call. */
export function paintedThyrFrame(key, frame) {
  const item = frameData(key, frame); if (!item) return null;
  return { atlas: key, frame, source: [...item.source], target: [...item.target], usage: item.usage,
    ...(item.cell ? { cell: [...item.cell] } : {}),
    ...(item.rotation !== undefined ? { rotation: item.rotation } : {}),
    ...(item.anchors ? { anchors: structuredClone(item.anchors) } : {}) };
}

function readyFrame(key, frame) {
  const image = images.get(key), item = frameData(key, frame);
  if (!image || !item || item.usage === 'reference') return null;
  const [width, height] = dimensions(image), [x, y, w, h] = item.source;
  return x + w <= width && y + h <= height ? { image, item } : null;
}

/** Only real displacement accumulates distance. Pauses preserve the current
 * pose, while a later still frame, rewind or teleport returns to rest. The
 * WeakMap is presentation state and never enters campaign serialization. */
export function thyrMotion(entity, time = 0) {
  if (!entity || typeof entity !== 'object') return { distance: 0, moving: false };
  const now = finite(time), x = finite(entity.x), previous = motionHistory.get(entity);
  if (!previous || now < previous.time) {
    const state = { x, time: now, distance: 0, moving: false };
    motionHistory.set(entity, state); return { ...state };
  }
  if (now === previous.time && x === previous.x) return { ...previous };
  const displacement = Math.abs(x - previous.x), elapsed = now - previous.time;
  const continuous = elapsed >= 0 && elapsed <= .3 && displacement <= Math.max(20, finite(entity.w, 58));
  const state = { x, time: now, distance: previous.distance + (continuous ? displacement : 0), moving: continuous && displacement > .0001 };
  motionHistory.set(entity, state); return { ...state };
}

function walkingFrame(options, count, resting, nominalWidth) {
  const motion = options.entity ? thyrMotion(options.entity, options.time) : null;
  if (options.reducedMotion || motion && (!motion.moving || options.entity.active === false)) return resting;
  // Explicit progress supports isolated diagnostic poses. Live actors always
  // supply their real object and clock through their scene renderer.
  const index = motion ? Math.floor(motion.distance / Math.max(12, finite(options.entity.w, nominalWidth) * .65) * count) % count : phaseIndex(options.progress, count);
  return `walk-${index}`;
}

export function paintedThyrPartFrame(options = {}) {
  const part = options.part || 'column';
  const spec = THYR_ASSET_SPECS[part] || VOICE_ASSET_SPECS[part];
  const state = options.state ?? spec?.states[0];
  if (!spec?.states.includes(state)) return null;
  let atlas = part, frame;
  if (part === 'column') frame = `${state}${options.variant % 2 === 1 ? '-alt' : ''}`;
  else if (part === 'root' || part === 'suspended-home') { atlas = 'habitat'; frame = `${part === 'root' ? 'root' : 'home'}-${state}`; }
  else if (part === 'longuedorse-adult' || part === 'longuedorse-young') {
    // A stationary/arrived actor must also update the previous x so a later
    // resumed move cannot consume distance from an earlier presentation.
    if (state !== 'moving' && options.entity) thyrMotion(options.entity, options.time);
    frame = state === 'moving' ? walkingFrame(options, 4, 'waiting', spec.size[0]) : state;
  } else if (part === 'fan-colony') frame = state === 'dispersed' ? `fly-${options.reducedMotion ? 0 : phaseIndex(options.progress, 4)}` : state;
  else if (part === 'breathing-vine') { atlas = 'plants'; frame = state === 'normal' && !options.reducedMotion && phaseIndex(options.progress, 2) ? 'vine-inhale' : `vine-${state}`; }
  else if (part === 'echo-grass') { atlas = 'plants'; frame = state === 'moving' && !options.reducedMotion ? `grass-${phaseIndex(options.progress, 2) ? 'right' : 'left'}` : 'grass-calm'; }
  else if (part === 'leth-interpreter') {
    atlas = 'leth';
    const speaking = options.reducedMotion ? 0 : Number.isFinite(options.time) ? Math.floor(options.time * 2) % 2 : phaseIndex(options.progress * 8, 2);
    frame = state === 'speaking' ? `speaking-${speaking}` : state;
  } else return null;
  return { atlas, frame };
}

/** Authored rope endpoints in world space. Null means the scene should retain
 * its original vector attachment. These points never create a physical body. */
export function paintedThyrAttachmentPoints(options = {}) {
  const selected = paintedThyrPartFrame(options);
  if (!selected) return null;
  const ready = readyFrame(selected.atlas, selected.frame), points = ready?.item.anchors?.suspensions;
  if (!Array.isArray(points) || points.length !== 2 || !points.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite))) return null;
  const spec = THYR_ASSET_SPECS[options.part], scale = finite(options.scale, 1);
  const sx = scale * finite(options.width, spec.size[0]) / spec.size[0] * (options.facing === -1 ? -1 : 1);
  const sy = scale * finite(options.height, spec.size[1]) / spec.size[1];
  const angle = ready.item.rotation || 0, cosine = Math.cos(angle), sine = Math.sin(angle);
  return points.map(([x, y]) => [finite(options.x) + (x * cosine - y * sine) * sx,
    finite(options.y) + (x * sine + y * cosine) * sy]);
}

/** Same world-space transform as the original vector assets. Returning false
 * is the caller's explicit request to keep the existing vector geometry. */
export function drawPaintedThyrPart(ctx, options = {}) {
  const selected = paintedThyrPartFrame(options);
  if (!selected || typeof ctx.drawImage !== 'function') return false;
  const ready = readyFrame(selected.atlas, selected.frame); if (!ready) return false;
  const spec = THYR_ASSET_SPECS[options.part || 'column'] || VOICE_ASSET_SPECS[options.part];
  const scale = finite(options.scale, 1), width = finite(options.width, spec.size[0]), height = finite(options.height, spec.size[1]);
  if (!(width > 0 && height > 0 && scale > 0)) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(finite(options.x), finite(options.y));
    ctx.scale(scale * width / spec.size[0] * (options.facing === -1 ? -1 : 1), scale * height / spec.size[1]);
    if (ready.item.rotation) ctx.rotate(ready.item.rotation);
    ctx.drawImage(ready.image, ...ready.item.source, ...ready.item.target);
    return true;
  } catch {
    images.delete(selected.atlas); states.set(selected.atlas, { state: 'failed' });
    return false;
  } finally { ctx.restore(); }
}

export function paintedThyrFaunaFrame(enemy, options = {}) {
  if (enemy?.type !== 'fauna' || enemy.kind !== 'fauna' || enemy.dead || enemy.alive === false || enemy.hp <= 0) return null;
  const motionOptions = { ...options, entity: enemy };
  let frame;
  if (enemy.active === false) { thyrMotion(enemy, options.time); frame = 'idle'; }
  else if (enemy.phase === 'attack') { thyrMotion(enemy, options.time); frame = enemy.telegraph >= .8 ? 'attack' : 'windup'; }
  else frame = walkingFrame(motionOptions, 8, 'idle', 58);
  return { atlas: 'rootwatcher', frame };
}

/** This does not create a dead body: the combat domain removes killed enemies.
 * The unused death cell remains an authored reference in the atlas. */
export function drawPaintedThyrFauna(ctx, enemy, options = {}) {
  const selected = paintedThyrFaunaFrame(enemy, options);
  if (!selected || typeof ctx.drawImage !== 'function') return false;
  const ready = readyFrame(selected.atlas, selected.frame); if (!ready) return false;
  const width = finite(enemy.w, 58), height = finite(enemy.h, 35);
  if (!(width > 0 && height > 0)) return false;
  options.shadow?.(enemy.x, enemy.y + height / 2, width * .55, Math.max(3, height * .1));
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(finite(enemy.x), finite(enemy.y));
    ctx.scale((enemy.facing === -1 ? -1 : 1) * width / 58, height / 35);
    if (ready.item.rotation) ctx.rotate(ready.item.rotation);
    ctx.drawImage(ready.image, ...ready.item.source, ...ready.item.target);
    return true;
  } catch {
    images.delete(selected.atlas); states.set(selected.atlas, { state: 'failed' });
    return false;
  } finally { ctx.restore(); }
}
