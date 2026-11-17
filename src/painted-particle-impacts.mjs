/** Painted sparks and blast particles only. The simulation owns their emission,
 * position, velocity, size and lifetime; the caller owns their historical alpha.
 */
import { PAINTED_PARTICLE_IMPACTS_LAYOUT } from './painted-particle-impacts-layout.mjs';

export const PAINTED_PARTICLE_IMPACTS_URLS = Object.freeze({
  spark: new URL('../assets/painted/particle-impacts/spark.png', import.meta.url).href,
  blast: new URL('../assets/painted/particle-impacts/blast.png', import.meta.url).href,
});
export const PAINTED_PARTICLE_IMPACTS_COLORS = Object.freeze({ spark: '#ffd09a', blast: '#f4a56d' });
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const finite = values => values.every(Number.isFinite);
const rectangle = value => Array.isArray(value) && value.length === 4 && finite(value) && value[2] > 0 && value[3] > 0;
const knownAtlas = key => typeof key === 'string' && Object.hasOwn(PAINTED_PARTICLE_IMPACTS_URLS, key);

export function setPaintedParticleImpactsImage(key, image) {
  if (!knownAtlas(key)) throw new RangeError('Unknown particle impact atlas: ' + key);
  const atlas = PAINTED_PARTICLE_IMPACTS_LAYOUT[key];
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError('Unexpected particle impact atlas dimensions: ' + key);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function clearPaintedParticleImpacts() { generation++; loading = null; images.clear(); statuses.clear(); }
export function paintedParticleImpactsStatus() {
  return Object.fromEntries(Object.keys(PAINTED_PARTICLE_IMPACTS_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Particle impact image decoding failed')); image.src = url;
  });
}
export function loadPaintedParticleImpacts({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_PARTICLE_IMPACTS_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedParticleImpactsImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedParticleImpactsStatus());
  return loading;
}

function impactFrame(particle, reducedMotion) {
  const key = particle?.type;
  // Imported/custom palettes keep their vector fallback. A spark deliberately
  // never reads size: its historical geometry is a two-unit round-capped line.
  if (!knownAtlas(key) || typeof particle.color !== 'string' || particle.color.toLowerCase() !== PAINTED_PARTICLE_IMPACTS_COLORS[key] ||
      !finite([particle.x, particle.y, particle.life, particle.maxLife]) ||
      particle.maxLife <= 0 || particle.life <= 0 || particle.life > particle.maxLife) return null;
  const atlas = PAINTED_PARTICLE_IMPACTS_LAYOUT[key], age = 1 - particle.life / particle.maxLife;
  const name = 'age-' + (reducedMotion ? 0 : Math.min(5, Math.floor(age * 6))), frame = atlas.frames[name];
  if (!frame || frame.usage !== 'runtime' || !rectangle(frame.source) || !rectangle(frame.target) ||
      frame.source[0] < 0 || frame.source[1] < 0 || frame.source[0] + frame.source[2] > atlas.size[0] ||
      frame.source[1] + frame.source[3] > atlas.size[1]) return null;
  let geometry;
  if (key === 'spark') {
    if (!finite([particle.vx, particle.vy])) return null;
    const length = .025 * Math.hypot(particle.vx, particle.vy), angle = Math.atan2(particle.vy, particle.vx);
    const head = [particle.x, particle.y], tail = [particle.x - .025 * particle.vx, particle.y - .025 * particle.vy];
    const center = [particle.x - .0125 * particle.vx, particle.y - .0125 * particle.vy];
    // Zero/underflowed or unrepresentable segments retain the exact old line
    // path. Small positive segments otherwise keep their actual length.
    if (!finite([length, angle, ...tail, ...center]) || length <= 0 || head.every((value, index) => value === tail[index])) return null;
    geometry = { radius: 1, length, angle, head, tail, center };
  } else {
    const radius = particle.size;
    if (!Number.isFinite(radius) || radius <= 0 || !finite([radius * 2, particle.x - radius, particle.x + radius,
      particle.y - radius, particle.y + radius, ...frame.target.map(value => value * radius)])) return null;
    geometry = { radius, center: [particle.x, particle.y] };
  }
  return { atlas: key, name, age, ...geometry, frame };
}

/** Read-only measured frame and world geometry, with no shared mutable arrays. */
export function paintedImpactParticleFrame(particle, { reducedMotion = false } = {}) {
  const result = impactFrame(particle, reducedMotion);
  if (!result) return null;
  const { frame, ...detail } = result;
  return structuredClone({ ...frame, ...detail });
}

export function drawPaintedImpactParticle(ctx, particle, { reducedMotion = false } = {}) {
  const detail = impactFrame(particle, reducedMotion), image = images.get(detail?.atlas);
  if (!detail || !image || typeof ctx?.drawImage !== 'function') return false;
  const { frame, radius } = detail;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(particle.x, particle.y);
    if (detail.atlas === 'spark') {
      const length = detail.length;
      ctx.rotate(detail.angle);
      // Clip in the historical line's coordinates before normalizing the
      // artwork. This preserves both radius-one caps at every velocity.
      ctx.beginPath(); ctx.moveTo(-length, -1); ctx.lineTo(0, -1);
      ctx.arc(0, 0, 1, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(-length, 1); ctx.arc(-length, 0, 1, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.clip();
      ctx.translate(-length / 2, 0); ctx.scale((length + 2) / 2, 1);
    } else {
      ctx.scale(radius, radius);
      ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.clip();
    }
    // Alpha-one source pixels remain intact in the PNG and source crop. The
    // measured alpha-two anchor and the clip bound their visible footprint.
    ctx.drawImage(image, ...frame.source, ...frame.target);
    return true;
  } catch {
    images.delete(detail.atlas); statuses.set(detail.atlas, { state: 'failed' }); return false;
  } finally { ctx.restore(); }
}
