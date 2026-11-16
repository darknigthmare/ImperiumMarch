/** Painted MI14 atlas presentation. Image readiness never changes simulation state. */
import { PAINTED_MI14_LAYOUT } from './painted-sprite-layout.mjs';

// Literal URLs are required by the self-contained HTML builder. Keep every atlas
// explicit here; no manifest or network request is needed while playing offline.
export const PAINTED_SPRITE_URLS = Object.freeze({
  worker: new URL('../assets/painted/mi14/worker.png', import.meta.url).href,
  'worker-mechanic': new URL('../assets/painted/mi14/worker-mechanic.png', import.meta.url).href,
  cooler: new URL('../assets/painted/mi14/cooler.png', import.meta.url).href,
  valve: new URL('../assets/painted/mi14/valve.png', import.meta.url).href,
  'disputed-lot': new URL('../assets/painted/mi14/disputed-lot.png', import.meta.url).href,
  'workshop-control': new URL('../assets/painted/mi14/workshop-control.png', import.meta.url).href,
  'security-automaton': new URL('../assets/painted/mi14/security-automaton.png', import.meta.url).href,
  'picket-post': new URL('../assets/painted/mi14/picket-post.png', import.meta.url).href,
});

const images = new Map(), states = new Map();
let loading = null, generation = 0;
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;

/** Canvas/Node callers can inject already decoded images without a browser DOM. */
export function setPaintedSpriteImage(key, image) {
  if (!Object.hasOwn(PAINTED_SPRITE_URLS, key)) throw new RangeError(`Unknown painted atlas: ${key}`);
  const [width, height] = dimensions(image);
  if (!(width > 0 && height > 0) || !Number.isFinite(width + height)) throw new TypeError(`Undecoded painted atlas: ${key}`);
  images.set(key, image); states.set(key, { state: 'ready', width, height });
}

export function setPaintedSpriteImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedSpriteImage(key, image);
  return paintedSpriteStatus();
}

/** Reset only presentation resources, principally for isolated renderer tests. */
export function clearPaintedSprites() {
  generation++; images.clear(); states.clear(); loading = null;
}

export function paintedSpriteStatus() {
  return Object.fromEntries(Object.keys(PAINTED_SPRITE_URLS).map(key => [key, { ...(states.get(key) || { state: 'idle' }) }]));
}

function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding is unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Atlas could not be decoded'));
    image.src = url;
  });
}

/** Optional loadImage(url, key) allows the same art to be received in real Canvas tests. */
export function loadPaintedSprites({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_SPRITE_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    states.set(key, { state: 'loading' });
    try {
      const image = await loadImage(url, key);
      if (version === generation) setPaintedSpriteImage(key, image);
    } catch {
      // A failed/unsupported image keeps the vector drawing, never a blank body.
      if (version === generation) states.set(key, { state: 'failed' });
    }
  })).then(() => paintedSpriteStatus());
  return loading;
}

/** Source and destination rectangles are copied, so callers cannot mutate layout. */
export function paintedSpriteFrame(key, frame, fallbackBounds) {
  const atlas = PAINTED_MI14_LAYOUT[key], entry = atlas?.frames?.[frame];
  const source = entry?.source, target = entry?.target || fallbackBounds;
  if (!rectangle(source) || source[0] < 0 || source[1] < 0 || !rectangle(target)) return null;
  return { atlas: key, frame, source: [...source], target: [...target] };
}

export function paintedWorkshopFrame(options) {
  const atlas = options.part === 'worker' && options.mechanic ? 'worker-mechanic' : options.part;
  let frame = options.state;
  if (options.part === 'worker' && frame === 'walking') {
    const progress = ((Number(options.progress) || 0) % 1 + 1) % 1;
    frame = `walking-${Math.floor(progress * 8)}`;
  } else if (options.part === 'worker' && frame === 'standing' && !PAINTED_MI14_LAYOUT[atlas]?.frames?.standing) frame = 'idle';
  return { atlas, frame };
}

function drawFrame(ctx, key, frame, fallbackBounds) {
  const image = images.get(key), detail = paintedSpriteFrame(key, frame, fallbackBounds);
  if (!image || !detail || typeof ctx.drawImage !== 'function') return false;
  const [width, height] = dimensions(image), [sx, sy, sw, sh] = detail.source;
  if (sx + sw > width || sy + sh > height) return false;
  ctx.drawImage(image, sx, sy, sw, sh, ...detail.target);
  return true;
}

function drawSafeMarker(ctx) {
  ctx.beginPath(); ctx.arc(-17, -57, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#afd4b9'; ctx.fill(); ctx.strokeStyle = '#26343b'; ctx.lineWidth = 1; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-20, -57); ctx.lineTo(-17, -54); ctx.lineTo(-14, -60); ctx.stroke();
}

function drawRotors(ctx, key, frame, progress) {
  const image = images.get(key), rotors = PAINTED_MI14_LAYOUT[key]?.frames?.[frame]?.rotors;
  if (!image || !Array.isArray(rotors)) return;
  const [width, height] = dimensions(image);
  for (const rotor of rotors) {
    const source = rotor.source, center = rotor.center, radius = rotor.radius;
    if (!rectangle(source) || source[0] < 0 || source[1] < 0 || source[0] + source[2] > width || source[1] + source[3] > height
      || !Array.isArray(center) || center.length !== 2 || !center.every(Number.isFinite) || !Number.isFinite(radius) || radius <= 0) continue;
    // Only the fan's circular interior turns. Its bolts, casing and connectors
    // stay fixed in the body image, and the existing mission clock drives it.
    ctx.save(); ctx.translate(...center);
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.clip();
    ctx.rotate((Number(progress) || 0) * Math.PI * 2);
    ctx.drawImage(image, ...source, -radius, -radius, radius * 2, radius * 2);
    ctx.restore();
  }
}

function drawAutomatonCannon(ctx, state, aimAngle) {
  ctx.save(); ctx.translate(0, -55); ctx.rotate(aimAngle || 0);
  // The layout aligns the painted trunnion to (0, 0); a negative destination x
  // preserves the rear of its housing while the live muzzle still reaches x=56.
  const frame = state === 'destroyed' ? 'cannon-destroyed' : 'cannon';
  if (!drawFrame(ctx, 'security-automaton', frame, [0, -8, 56, 16])) {
    if (state === 'destroyed') ctx.globalAlpha = (typeof ctx.globalAlpha === 'number' ? ctx.globalAlpha : 1) * .65;
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(56, 0);
    ctx.strokeStyle = '#26343b'; ctx.lineWidth = 12; ctx.stroke();
    ctx.strokeStyle = '#9eafa0'; ctx.lineWidth = 7; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(56, -6); ctx.lineTo(56, 6);
    ctx.strokeStyle = '#26343b'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#526d72'; ctx.fill(); ctx.strokeStyle = '#abbcaf'; ctx.lineWidth = 2; ctx.stroke();
  }
  ctx.restore();
}

/** Called in the existing component coordinate system after scale and facing. */
export function drawPaintedWorkshopAsset(ctx, options, geometry) {
  const { atlas, frame } = paintedWorkshopFrame({ ...options, state: options.state || geometry.state });
  if (!images.has(atlas)) return false;
  ctx.save(); ctx.imageSmoothingEnabled = true;
  const drawn = drawFrame(ctx, atlas, frame, geometry.bounds);
  if (drawn && options.part === 'cooler' && frame === 'online') drawRotors(ctx, atlas, frame, options.progress);
  if (drawn && options.part === 'worker' && (options.state || geometry.state) === 'safe') drawSafeMarker(ctx);
  if (drawn && options.part === 'security-automaton') drawAutomatonCannon(ctx, options.state || geometry.state, options.aimAngle);
  ctx.restore();
  return drawn;
}
