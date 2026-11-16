/** Painted combat presentation. Positions and targeting remain simulation facts. */
import { PAINTED_COMBAT_LAYOUT } from './painted-combat-layout.mjs';
import { ENEMY_WEAPON_RIGS, enemyWeaponPose } from './enemy-weapon-pose.mjs';

// Keep literal URLs: the offline builder embeds these exact image sources.
export const PAINTED_COMBAT_URLS = Object.freeze({
  rifle: new URL('../assets/painted/combat/rifle.png', import.meta.url).href,
  sniper: new URL('../assets/painted/combat/sniper.png', import.meta.url).href,
  rocket: new URL('../assets/painted/combat/rocket.png', import.meta.url).href,
  civilian: new URL('../assets/painted/combat/civilian.png', import.meta.url).href,
  buggy: new URL('../assets/painted/combat/buggy.png', import.meta.url).href,
  skimmer: new URL('../assets/painted/combat/skimmer.png', import.meta.url).href,
  drone: new URL('../assets/painted/combat/drone.png', import.meta.url).href,
  turret: new URL('../assets/painted/combat/turret.png', import.meta.url).href,
  convoy: new URL('../assets/painted/combat/convoy.png', import.meta.url).href,
});

export const COMBAT_BODY_SIZES = Object.freeze(Object.fromEntries([
  ...Object.entries(ENEMY_WEAPON_RIGS).map(([key, spec]) => [key, spec.size]),
  ['civilian', Object.freeze([18, 34])], ['convoy', Object.freeze([112, 64])],
]));
const images = new Map(), states = new Map();
let loading = null, generation = 0, motionHistory = new WeakMap();
const dimensions = image => [Number(image?.naturalWidth || image?.width || 0), Number(image?.naturalHeight || image?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;

export function setPaintedCombatImage(key, image) {
  if (!Object.hasOwn(PAINTED_COMBAT_URLS, key)) throw new RangeError(`Unknown painted combat atlas: ${key}`);
  const [width, height] = dimensions(image);
  if (!(width > 0 && height > 0) || !Number.isFinite(width + height)) throw new TypeError(`Undecoded combat atlas: ${key}`);
  const expected = PAINTED_COMBAT_LAYOUT[key]?.size;
  if (expected && (width !== expected[0] || height !== expected[1])) throw new RangeError(`Unexpected combat atlas dimensions: ${key}`);
  images.set(key, image); states.set(key, { state: 'ready', width, height });
}

export function setPaintedCombatImages(decoded) {
  for (const [key, image] of Object.entries(decoded)) setPaintedCombatImage(key, image);
  return paintedCombatStatus();
}

export function clearPaintedCombat() {
  generation++; images.clear(); states.clear(); loading = null; motionHistory = new WeakMap();
}

export function paintedCombatStatus() {
  return Object.fromEntries(Object.keys(PAINTED_COMBAT_URLS).map(key => [key, { ...(states.get(key) || { state: 'idle' }) }]));
}

function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding is unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Combat atlas could not be decoded'));
    image.src = url;
  });
}

export function loadPaintedCombat({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  loading = Promise.all(Object.entries(PAINTED_COMBAT_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    states.set(key, { state: 'loading' });
    try {
      const image = await loadImage(url, key);
      if (version === generation) setPaintedCombatImage(key, image);
    } catch {
      if (version === generation) states.set(key, { state: 'failed' });
    }
  })).then(() => paintedCombatStatus());
  return loading;
}

/** Rectangles are copies, never mutable views into the authored layout. */
export function paintedCombatFrame(key, frame) {
  const atlas = PAINTED_COMBAT_LAYOUT[key], item = atlas?.frames?.[frame];
  if (!item || !rectangle(item.source) || !rectangle(item.target) || item.source[0] < 0 || item.source[1] < 0) return null;
  if (atlas.size && (item.source[0] + item.source[2] > atlas.size[0] || item.source[1] + item.source[3] > atlas.size[1])) return null;
  return { atlas: key, frame, source: [...item.source], target: [...item.target],
    ...(Number.isFinite(item.rotation) ? { rotation: item.rotation } : {}),
    ...(item.anchors ? { anchors: structuredClone(item.anchors) } : {}) };
}

function readyFrame(key, frame) {
  const image = images.get(key), detail = paintedCombatFrame(key, frame);
  if (!image || !detail) return null;
  const [width, height] = dimensions(image), [x, y, w, h] = detail.source;
  return x + w <= width && y + h <= height ? { image, ...detail } : null;
}

function drawFrame(ctx, key, frame) {
  const detail = readyFrame(key, frame);
  if (!detail || typeof ctx.drawImage !== 'function') return false;
  if (detail.rotation) { ctx.save(); ctx.rotate(detail.rotation); }
  ctx.drawImage(detail.image, ...detail.source, ...detail.target);
  if (detail.rotation) ctx.restore();
  return true;
}

/** Presentation-only distance tracking prevents an idle, blocked, or stopped
 * person from marching on the spot. No animation fields enter saved game data.
 */
export function combatMotion(entity, time = 0) {
  const now = Number.isFinite(time) ? time : 0, x = Number.isFinite(entity.x) ? entity.x : 0;
  const previous = motionHistory.get(entity);
  if (!previous || now < previous.time) {
    const state = { x, time: now, distance: 0, moving: false };
    motionHistory.set(entity, state); return { ...state };
  }
  if (now === previous.time && x === previous.x) return { ...previous };
  const displacement = Math.abs(x - previous.x), elapsed = now - previous.time;
  // A teleport or returning to a long-hidden actor must not spin eight frames.
  const continuous = elapsed >= 0 && elapsed <= .3 && displacement <= Math.max(20, (entity.h || 36) * 2);
  const state = { x, time: now, distance: previous.distance + (continuous ? displacement : 0), moving: continuous && displacement > .0001 };
  motionHistory.set(entity, state); return { ...state };
}

function humanFrame(entity, key, options) {
  const motion = combatMotion(entity, options.time);
  if (entity.dead || entity.alive === false) return 'downed';
  if (key === 'civilian' && entity.safe) return 'safe';
  if (key !== 'civilian' && ['attack', 'recover'].includes(entity.phase)) return 'braced';
  if (options.reducedMotion || !motion.moving || entity.active === false) return 'idle';
  const stride = Math.max(12, (entity.h || COMBAT_BODY_SIZES[key][1]) * .9);
  return `walk-${Math.floor(motion.distance / stride * 8) % 8}`;
}

export function paintedCombatBodyFrame(entity, { civilian = false, time = 0, reducedMotion = false } = {}) {
  const key = civilian ? 'civilian' : entity.type;
  if (!COMBAT_BODY_SIZES[key]) return null;
  const frame = ['rifle', 'sniper', 'rocket', 'civilian'].includes(key)
    ? humanFrame(entity, key, { time, reducedMotion })
    : entity.dead || entity.destroyed || entity.hp <= 0 ? 'wreck'
      : Number.isFinite(entity.maxHp) && entity.hp / entity.maxHp < .45 ? 'damaged' : 'idle';
  return { atlas: key, frame };
}

function drawBody(ctx, key, frame, body, facing) {
  if (!readyFrame(key, frame) || typeof ctx.drawImage !== 'function') return false;
  const [width, height] = COMBAT_BODY_SIZES[key];
  const scaleX = Number.isFinite(body.w) && body.w > 0 ? body.w / width : 1;
  const scaleY = Number.isFinite(body.h) && body.h > 0 ? body.h / height : 1;
  ctx.save(); ctx.imageSmoothingEnabled = true;
  ctx.translate(body.x, body.y); ctx.scale((facing === -1 ? -1 : 1) * scaleX, scaleY);
  drawFrame(ctx, key, frame); ctx.restore(); return true;
}

/** Same fallback weapon as the painted rig, including aim and true muzzle. */
export function drawCombatWeapon(ctx, enemy) {
  const pose = enemyWeaponPose(enemy); if (!pose) return false;
  ctx.save(); ctx.translate(...pose.pivot); ctx.rotate(pose.angle); ctx.scale(pose.scale[0], pose.scale[1] * pose.upright);
  ctx.imageSmoothingEnabled = true;
  if (!drawFrame(ctx, enemy.type, 'weapon')) {
    const length = ENEMY_WEAPON_RIGS[enemy.type].length;
    const thick = enemy.type === 'rocket' ? 6 : ['rifle', 'sniper'].includes(enemy.type) ? 3 : 7;
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(length, 0); ctx.strokeStyle = '#172e34'; ctx.lineWidth = thick; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -thick * .35); ctx.lineTo(length - 1, -thick * .35); ctx.strokeStyle = '#aeb8a1'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = enemy.type === 'rocket' ? '#a48b65' : '#536961'; ctx.fillRect(-3, -thick * .7, Math.max(8, length * .34), thick * 1.4);
  }
  ctx.restore(); return true;
}

/** All passed entities must already have cleared their mission visibility gates. */
export function drawPaintedCombatEnemy(ctx, enemy, options = {}) {
  if (!ENEMY_WEAPON_RIGS[enemy.type] || enemy.dead) return false;
  const detail = paintedCombatBodyFrame(enemy, options);
  if (!detail || !readyFrame(detail.atlas, detail.frame) || typeof ctx.drawImage !== 'function') return false;
  if (enemy.kind !== 'air') options.shadow?.(enemy.x, enemy.y + enemy.h / 2, enemy.w * .6, Math.min(7, Math.max(3, enemy.h * .1)));
  if (!drawBody(ctx, detail.atlas, detail.frame, enemy, enemy.facing)) return false;
  drawCombatWeapon(ctx, enemy); return true;
}

export function drawPaintedCombatCivilian(ctx, person, options = {}) {
  if (person.alive === false) return false;
  const detail = paintedCombatBodyFrame(person, { ...options, civilian: true });
  const facing = options.facing ?? (person.fleeing ? 1 : person.facing === 1 ? 1 : -1);
  return drawBody(ctx, 'civilian', detail.frame, person, facing);
}

export function drawPaintedCombatConvoy(ctx, convoy, options = {}) {
  const detail = paintedCombatBodyFrame({ ...convoy, type: 'convoy' }, options);
  if (!drawBody(ctx, 'convoy', detail.frame, convoy, convoy.facing === -1 ? -1 : 1)) return false;
  // The authored side-panel crops, when registered, are true overlays. Separate
  // wheel/rotor/detail cells remain references, not duplicate spinning parts.
  const overlay = convoy.cargo ? 'cargo' : 'medical';
  if (PAINTED_COMBAT_LAYOUT.convoy?.overlays?.includes(overlay) && detail.frame !== 'wreck') {
    drawBody(ctx, 'convoy', overlay, convoy, convoy.facing === -1 ? -1 : 1);
  }
  return true;
}
