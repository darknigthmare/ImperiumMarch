/** Cerbère's own modular atlas. No playable walker ID is borrowed.
 * Its legacy leg rig remains presentation-only: it does not create simulated
 * feet, contacts, hitboxes, component health or saved animation data. */
import { PAINTED_CERBERE_LAYOUT } from './painted-cerbere-layout.mjs';
import { drawProductionPart, productionLegPose } from './production-assets.mjs';
import { cerbereWeaponPose } from './cerbere-weapon-pose.mjs';

export const PAINTED_CERBERE_URL = new URL('../assets/painted/cerbere/cerbere.png', import.meta.url).href;
export const CERBERE_FRAME_NAMES = Object.freeze([
  'hull', 'hull-damaged', 'hull-braced', 'turret',
  'upper', 'upper-damaged', 'lower', 'lower-damaged',
  'hip', 'knee', 'foot', 'foot-damaged',
  'foot-braced', 'radiator', 'radiator-damaged', 'radiator-repaired',
]);
export const CERBERE_PART_SIZES = Object.freeze({ hull: [150, 78], turret: [89, 42], upper: [100, 24], lower: [100, 24],
  hip: [28, 28], knee: [28, 28], foot: [64, 18], radiator: [22, 50.7] });

let image = null, state = { state: 'idle' }, loading = null, generation = 0, motion = new WeakMap();
const dimensions = value => [Number(value?.naturalWidth || value?.width || 0), Number(value?.naturalHeight || value?.height || 0)];
const rectangle = value => Array.isArray(value) && value.length === 4 && value.every(Number.isFinite) && value[2] > 0 && value[3] > 0;

export function setPaintedCerbereImage(decoded) {
  const [width, height] = dimensions(decoded), expected = PAINTED_CERBERE_LAYOUT.size;
  if (!(width > 0 && height > 0) || !Number.isFinite(width + height)) throw new TypeError('Undecoded Cerbère atlas');
  if (!expected || width !== expected[0] || height !== expected[1]) throw new RangeError('Unexpected Cerbère atlas dimensions');
  image = decoded; state = { state: 'ready', width, height };
}
export function clearPaintedCerbere() { generation++; image = null; state = { state: 'idle' }; loading = null; motion = new WeakMap(); }
export function paintedCerbereStatus() { return { ...state }; }
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding is unavailable')); return; }
    const decoded = new globalThis.Image();
    decoded.onload = () => resolve(decoded); decoded.onerror = () => reject(new Error('Cerbère atlas could not be decoded')); decoded.src = url;
  });
}
export function loadPaintedCerbere({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const version = generation;
  if (image) return Promise.resolve(paintedCerbereStatus());
  state = { state: 'loading' };
  loading = Promise.resolve().then(() => loadImage(PAINTED_CERBERE_URL, 'cerbere')).then(decoded => {
    if (version === generation) setPaintedCerbereImage(decoded);
  }).catch(() => { if (version === generation) state = { state: 'failed' }; }).then(paintedCerbereStatus);
  return loading;
}
function frameData(name) {
  const item = PAINTED_CERBERE_LAYOUT.frames?.[name], size = PAINTED_CERBERE_LAYOUT.size;
  if (!item || !size || !rectangle(item.source) || !rectangle(item.target) || item.source[0] < 0 || item.source[1] < 0
    || item.source[0] + item.source[2] > size[0] || item.source[1] + item.source[3] > size[1]
    || item.rotation !== undefined && !Number.isFinite(item.rotation)) return null;
  return item;
}
export function paintedCerbereFrame(name) {
  const frame = frameData(name);
  return frame ? { atlas: 'cerbere', frame: name, ...structuredClone(frame) } : null;
}
export function paintedCerberePartFrame(part, state = 'normal') {
  if (!Object.hasOwn(CERBERE_PART_SIZES, part)) return null;
  if (!['normal', 'damaged', 'braced', 'repaired'].includes(state)) return null;
  if (part === 'hull' || part === 'foot') return state === 'damaged' || state === 'braced' ? `${part}-${state}` : part;
  if (part === 'upper' || part === 'lower') return state === 'damaged' ? `${part}-damaged` : part;
  if (part === 'radiator') return state === 'damaged' || state === 'repaired' ? `${part}-${state}` : part;
  return part;
}
export function drawPaintedCerberePart(ctx, options = {}) {
  const name = paintedCerberePartFrame(options.part, options.state), frame = frameData(name), nominal = CERBERE_PART_SIZES[options.part];
  if (!image || !frame || !nominal || typeof ctx.drawImage !== 'function') return false;
  const x = options.x ?? 0, y = options.y ?? 0, rotation = options.rotation ?? 0;
  const width = options.width ?? nominal[0], height = options.height ?? nominal[1];
  if (![x, y, rotation, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return false;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true; ctx.translate(x, y); if (rotation) ctx.rotate(rotation);
    const upright = options.part === 'turret' && Math.cos(rotation) < 0 ? -1 : 1;
    ctx.scale(width / nominal[0] * (options.facing === -1 ? -1 : 1), height / nominal[1] * upright);
    if (options.back) ctx.filter = `${typeof ctx.filter === 'string' && ctx.filter !== 'none' ? `${ctx.filter} ` : ''}brightness(0.7)`;
    if (options.part === 'lower') {
      // The ankle shoe covers the terminal ring. Clip the distal half before
      // optical correction, keeping its canonical endpoint exactly x=100.
      ctx.beginPath(); ctx.rect(-200, -300, 300, 600); ctx.clip();
    }
    if (frame.rotation) ctx.rotate(frame.rotation);
    ctx.drawImage(image, ...frame.source, ...frame.target);
    return true;
  } catch { image = null; state = { state: 'failed' }; return false; }
  finally { ctx.restore(); }
}
function line(ctx, x1, y1, x2, y2, colour, width) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.stroke();
}
function part(ctx, options) {
  if (drawPaintedCerberePart(ctx, options)) return true;
  // This is the old generic vector art, never a painted playable chassis.
  return drawProductionPart(ctx, options);
}

/** Track only real horizontal displacement. A guarding, blocked or retired
 * Cerbère keeps still; reduced motion does not advance a decorative step. */
export function cerberePresentationPose(enemy, ground, time = 0, { reducedMotion = false } = {}) {
  if (enemy?.type !== 'boss' || ![enemy.x, enemy.y, ground, time].every(Number.isFinite)) return null;
  const cached = motion.get(enemy), previous = cached && cached.time <= time ? cached : null;
  const elapsed = previous ? time - previous.time : 0, delta = previous ? Math.abs(enemy.x - previous.x) : 0;
  const continuous = previous && elapsed > 0 && elapsed <= .3 && delta <= 40;
  const moving = Boolean(continuous && delta > .0001 && enemy.active !== false && !['attack', 'guard', 'standdown'].includes(enemy.phase));
  const distance = (previous?.distance || 0) + (moving ? delta : 0);
  const record = previous && previous.time === time && previous.x === enemy.x ? previous : { x: enemy.x, time, distance, moving };
  motion.set(enemy, record);
  const p = { x: enemy.x, y: ground - 173, width: 150, height: 78, facing: enemy.facing === 1 ? 1 : -1,
    hull: enemy.hp, maxHull: enemy.maxHp, braced: enemy.phase === 'attack', feet: [-55, 55].map((offset, i) => ({
      x: enemy.x + offset + (!reducedMotion && record.moving ? Math.sin(record.distance / 35 + i * Math.PI) * 8 : 0), y: ground,
      homeOffset: offset, side: i ? 'front' : 'back', health: 100, phase: 'stance', contact: true,
    })) };
  return { body: p, walker: { legs: 2, height: 173, width: 150 }, weapon: cerbereWeaponPose(enemy) };
}
function leg(ctx, p, walker, foot) {
  const pose = productionLegPose(p, walker, foot), back = foot.side === 'back', thickness = 23;
  // Component damage is not simulated for Cerbère. Do not infer leg health
  // from hull health merely because spare damaged artwork exists.
  const state = p.braced ? 'braced' : 'normal';
  // Cerbère has presentation-only feet. An authored shoe can retain its
  // proportions while its measured receiver moves the painted lower endpoint;
  // the sole remains at the same ground point. With the historical 8-unit
  // receiver or vector fallback this is exactly the existing endpoint.
  const shoe = image && typeof ctx.drawImage === 'function' ? frameData(paintedCerberePartFrame('foot', state)) : null;
  if (shoe?.anchors?.ankle?.length === 2 && shoe.anchors.ankle.every(Number.isFinite))
    pose.ankle = [foot.x + shoe.anchors.ankle[0], foot.y + shoe.anchors.ankle[1]];
  if (!image || !frameData(paintedCerberePartFrame('upper', state)) || typeof ctx.drawImage !== 'function')
    line(ctx, pose.hip[0] + 9, pose.hip[1], pose.knee[0] + 10, pose.knee[1], '#152123', thickness + 7);
  if (!image || !frameData(paintedCerberePartFrame('lower', state)) || typeof ctx.drawImage !== 'function')
    line(ctx, pose.knee[0] + 10, pose.knee[1], foot.x + 8, foot.y - 6, '#152123', thickness + 5);
  for (const [name, start, end, height] of [['upper', pose.hip, pose.knee, thickness], ['lower', pose.knee, pose.ankle, thickness * .7]])
    part(ctx, { part: name, x: start[0], y: start[1], width: Math.hypot(end[0] - start[0], end[1] - start[1]), height,
      rotation: Math.atan2(end[1] - start[1], end[0] - start[0]), back, state });
  const [hx, hy] = pose.hip, [kx, ky] = pose.knee, offset = back ? -8 : 9;
  line(ctx, hx + offset, hy + 12, kx * .7 + foot.x * .3 + offset, ky * .7 + foot.y * .3, '#101a1d', 8);
  line(ctx, hx + offset, hy + 12, kx + offset, ky + 9, back ? '#667377' : '#c6c9bd', 4);
  line(ctx, kx + offset, ky + 9, kx * .7 + foot.x * .3 + offset, ky * .7 + foot.y * .3, '#48595b', 6);
  for (const [name, x, y, factor] of [['hip', hx, hy, 1.24], ['knee', kx, ky, 1.3]])
    part(ctx, { part: name, x, y, width: thickness * factor, height: thickness * factor, back, state });
  part(ctx, { part: 'foot', x: foot.x, y: foot.y, back, state });
}

/** Called only for the visible, living boss. The independent ventral gun
 * always uses the same muzzle as simulation and the warning line. */
export function drawCerbere(ctx, enemy, { ground, time = 0, reducedMotion = false } = {}) {
  if (enemy?.dead || enemy?.type !== 'boss') return false;
  const rig = cerberePresentationPose(enemy, ground, time, { reducedMotion });
  if (!rig) return false;
  const { body: p, walker, weapon } = rig;
  ctx.save();
  try {
    leg(ctx, p, walker, p.feet[0]);
    part(ctx, { part: 'hull', x: p.x, y: p.y, width: p.width, height: p.height, facing: p.facing,
      state: p.hull / p.maxHull < .45 ? 'damaged' : p.braced ? 'braced' : 'normal' });
    // The source image omits a radiator; this is a static cooling panel only,
    // without a new hitbox or a fictional repaired/damaged component state.
    part(ctx, { part: 'radiator', x: p.x - p.facing * 67, y: p.y + 3, width: 22, height: 50.7, facing: p.facing, state: 'normal' });
    leg(ctx, p, walker, p.feet[1]);
    // Historical projectile pivot is below the cabin. An explicit steel
    // cradle connects it to the hull, rather than moving that physical pivot.
    for (const offset of [-14, 14]) {
      line(ctx, p.x + offset, p.y + 27, weapon.pivot[0] + offset * .4, weapon.pivot[1], '#1a272c', 11);
      line(ctx, p.x + offset, p.y + 27, weapon.pivot[0] + offset * .4, weapon.pivot[1], '#8b8e7c', 5);
    }
    if (!drawPaintedCerberePart(ctx, { part: 'turret', x: weapon.pivot[0], y: weapon.pivot[1],
      rotation: weapon.angle, width: weapon.length, height: 42, state: 'normal' })) {
      ctx.save(); ctx.translate(...weapon.pivot); ctx.rotate(weapon.angle); ctx.scale(1, weapon.upright);
      ctx.fillStyle = '#525d56'; ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();
      line(ctx, 0, 0, weapon.length, 0, '#17282d', 10);
      line(ctx, 3, -3, weapon.length - 2, -3, '#acb19b', 3);
      ctx.restore();
    }
  } finally { ctx.restore(); }
  return true;
}
