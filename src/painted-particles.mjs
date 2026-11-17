/** Painted smoke and dust for existing particles only. Simulation owns every
 * position, size, lifetime and emission. The caller retains its historical alpha.
 */
import { PAINTED_PARTICLES_LAYOUT } from './painted-particles-layout.mjs';

export const PAINTED_PARTICLES_URLS = Object.freeze({
  smoke: new URL('../assets/painted/particles/smoke.png', import.meta.url).href,
  dust: new URL('../assets/painted/particles/dust.png', import.meta.url).href,
});
export const PAINTED_PARTICLE_COLORS = Object.freeze({ smoke: '#6d7478', dust: '#bea58c' });
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const finite = values => values.every(Number.isFinite);
const rectangle = value => Array.isArray(value) && value.length === 4 && finite(value) && value[2] > 0 && value[3] > 0;

export function setPaintedParticlesImage(key, image) {
  const atlas = PAINTED_PARTICLES_LAYOUT[key];
  if (!atlas) throw new RangeError('Unknown particle atlas: ' + key);
  const width = Number(image?.naturalWidth || image?.width || 0), height = Number(image?.naturalHeight || image?.height || 0);
  if (width !== atlas.size[0] || height !== atlas.size[1]) throw new RangeError('Unexpected particle atlas dimensions: ' + key);
  images.set(key, image); statuses.set(key, { state: 'ready', width, height });
}
export function clearPaintedParticles() { generation++; loading = null; images.clear(); statuses.clear(); }
export function paintedParticlesStatus() {
  return Object.fromEntries(Object.keys(PAINTED_PARTICLES_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoding unavailable')); return; }
    const image = new globalThis.Image();
    image.onload = () => resolve(image); image.onerror = () => reject(new Error('Particle image decoding failed')); image.src = url;
  });
}
export function loadPaintedParticles({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_PARTICLES_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const image = await loadImage(url, key); if (current === generation) setPaintedParticlesImage(key, image); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(() => paintedParticlesStatus());
  return loading;
}

function particleFrame(particle, reducedMotion) {
  const key = particle?.type, atlas = PAINTED_PARTICLES_LAYOUT[key];
  // Custom colors are meaningful in imported states. Preserve their vector
  // fallback instead of silently painting the generic authored palette.
  if (!atlas || typeof particle.color !== 'string' || particle.color.toLowerCase() !== PAINTED_PARTICLE_COLORS[key] ||
      !finite([particle.x, particle.y, particle.size, particle.life, particle.maxLife]) ||
      particle.size <= 0 || particle.maxLife <= 0 || particle.life <= 0 || particle.life > particle.maxLife) return null;
  const remaining = particle.life / particle.maxLife, age = 1 - remaining;
  const name = 'age-' + (reducedMotion ? 0 : Math.min(5, Math.floor(age * 6)));
  const frame = atlas.frames[name];
  if (!frame || !rectangle(frame.source) || !rectangle(frame.target) || frame.source[0] < 0 || frame.source[1] < 0 ||
      frame.source[0] + frame.source[2] > atlas.size[0] || frame.source[1] + frame.source[3] > atlas.size[1]) return null;
  const radius = particle.size * (key === 'smoke' ? 2 - remaining : 1);
  if (!Number.isFinite(radius) || radius <= 0) return null;
  return { atlas: key, name, age, radius, frame };
}

/** Read-only geometry for diagnostics; callers cannot change the shared layout. */
export function paintedParticleFrame(particle, { reducedMotion = false } = {}) {
  const detail = particleFrame(particle, reducedMotion);
  return detail ? { atlas: detail.atlas, name: detail.name, age: detail.age, radius: detail.radius, ...structuredClone(detail.frame) } : null;
}

export function drawPaintedParticle(ctx, particle, { reducedMotion = false } = {}) {
  const detail = particleFrame(particle, reducedMotion), image = images.get(detail?.atlas);
  if (!detail || !image || typeof ctx?.drawImage !== 'function') return false;
  const { frame, radius } = detail;
  ctx.save();
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.translate(particle.x, particle.y); ctx.scale(radius, radius);
    // Alpha-1 encoding residue is excluded from the measured anchor, but its
    // source pixels are retained. The historical circle bounds every draw.
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(image, ...frame.source, ...frame.target);
    return true;
  } catch {
    images.delete(detail.atlas); statuses.set(detail.atlas, { state: 'failed' }); return false;
  } finally { ctx.restore(); }
}
