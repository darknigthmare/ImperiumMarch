/** Painted Nacre installations. Pure presentation: no simulation or saved state. */
import { PAINTED_NACRE_SITE_LAYOUT } from './painted-nacre-sites-layout.mjs';

export const PAINTED_NACRE_SITE_URLS = Object.freeze({
  barriers: new URL('../assets/painted/nacre-sites/barriers.png', import.meta.url).href,
  hydraulics: new URL('../assets/painted/nacre-sites/hydraulics.png', import.meta.url).href,
  houses: new URL('../assets/painted/nacre-sites/houses.png', import.meta.url).href,
  shelters: new URL('../assets/painted/nacre-sites/shelters.png', import.meta.url).href,
  quays: new URL('../assets/painted/nacre-sites/quays.png', import.meta.url).href,
});
const images = new Map(), statuses = new Map();
let loading = null, generation = 0;
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
const parts = new Map(Object.entries(PAINTED_NACRE_SITE_LAYOUT).flatMap(([atlas, data]) =>
  Object.entries(data.frames).map(([frame, detail]) => [`${detail.part}/${detail.state}`, { atlas, frame }])));

export function setPaintedNacreSiteImage(key, picture) {
  const expected = PAINTED_NACRE_SITE_LAYOUT[key]?.size;
  if (!expected) throw new RangeError(`Unknown Nacre site atlas: ${key}`);
  const width = Number(picture?.naturalWidth || picture?.width || 0), height = Number(picture?.naturalHeight || picture?.height || 0);
  if (width !== expected[0] || height !== expected[1]) throw new RangeError(`Invalid Nacre site dimensions: ${key}`);
  images.set(key, picture); statuses.set(key, { state: 'ready', width, height });
}
export function paintedNacreSiteAssetSnapshot() {
  return Object.fromEntries(Object.keys(PAINTED_NACRE_SITE_URLS).map(key => [key, { ...(statuses.get(key) || { state: 'idle' }) }]));
}
export function clearPaintedNacreSites() { generation++; images.clear(); statuses.clear(); loading = null; }
function browserImage(url) {
  return new Promise((resolve, reject) => {
    if (typeof globalThis.Image !== 'function') { reject(new Error('Image decoder unavailable')); return; }
    const picture = new globalThis.Image();
    picture.onload = () => resolve(picture); picture.onerror = () => reject(new Error('Nacre site image decoding failed')); picture.src = url;
  });
}
export function loadPaintedNacreSiteAssets({ loadImage = browserImage } = {}) {
  if (loading) return loading;
  const current = generation;
  loading = Promise.all(Object.entries(PAINTED_NACRE_SITE_URLS).map(async ([key, url]) => {
    if (images.has(key)) return;
    statuses.set(key, { state: 'loading' });
    try { const picture = await loadImage(url, key); if (current === generation) setPaintedNacreSiteImage(key, picture); }
    catch { if (current === generation) statuses.set(key, { state: 'failed' }); }
  })).then(paintedNacreSiteAssetSnapshot);
  return loading;
}
export function paintedNacreSiteFrame(key, name) {
  const atlas = PAINTED_NACRE_SITE_LAYOUT[key], frame = atlas?.frames?.[name];
  if (!frame || frame.usage !== 'runtime') return null;
  const [x, y, w, h] = frame.source;
  if (![x, y, w, h, ...frame.target].every(Number.isFinite) || w <= 0 || h <= 0 || x < 0 || y < 0 || x + w > atlas.size[0] || y + h > atlas.size[1]) return null;
  return { atlas: key, frame: name, ...structuredClone(frame) };
}
export function paintedNacreSiteSelection(part, state = 'normal') {
  const selection = parts.get(`${part}/${state}`);
  return selection ? { ...selection } : null;
}
function ready(part, state = 'normal') {
  const selection = paintedNacreSiteSelection(part, state);
  return selection && images.has(selection.atlas) && paintedNacreSiteFrame(selection.atlas, selection.frame);
}
export function drawPaintedNacreSitePart(ctx, { part, state = 'normal', x = 0, y = 0, width, height, rotation = 0 } = {}) {
  const frame = ready(part, state);
  if (!frame || typeof ctx?.drawImage !== 'function') return false;
  const sx = (width ?? frame.nominal[0]) / frame.nominal[0], sy = (height ?? frame.nominal[1]) / frame.nominal[1];
  if (![x, y, sx, sy, rotation].every(Number.isFinite) || sx <= 0 || sy <= 0) return false;
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.translate(x, y); ctx.rotate(rotation); ctx.scale(sx, sy);
  ctx.drawImage(images.get(frame.atlas), ...frame.source, ...frame.target); ctx.restore(); return true;
}

export function nacreSiteDamageState(object, threshold = .7) {
  return object.destroyed || object.hp <= 0 ? 'destroyed'
    : Number.isFinite(object.hp) && Number.isFinite(object.maxHp) && object.maxHp > 0 && object.hp < object.maxHp * threshold ? 'damaged' : 'normal';
}
export function nacreSiteControlPoses(site, time = 0, { reducedMotion = false } = {}) {
  const pump = site.auxiliary, valve = site.valve, panel = site.panel;
  return {
    pump: pump && { x: pump.x - 6, y: pump.y - 2, angle: pump.active && !reducedMotion ? time * 3.4 : .4 },
    valve: valve && { x: valve.x, y: valve.y + 11, angle: valve.working && !reducedMotion ? time * 2.2 : valve.completed ? Math.PI / 4 : 0 },
    latch: panel && { x: panel.x - panel.w / 2 + 5, y: panel.y - 8, angle: panel.locked ? Math.PI / 2 : 0 },
  };
}
export function drawPaintedNacreSiteLatch(ctx, panel) {
  if (panel.destroyed || !ready('latch')) return false;
  const pose = nacreSiteControlPoses({ panel }).latch;
  return drawPaintedNacreSitePart(ctx, { part: 'latch', x: pose.x, y: pose.y, rotation: pose.angle });
}
export function drawPaintedNacreSitePump(ctx, pump, time, options = {}) {
  const state = pump.destroyed ? 'destroyed' : 'normal';
  if (!ready('pump', state) || state !== 'destroyed' && !ready('pump-rotor')) return false;
  if (!drawPaintedNacreSitePart(ctx, { part: 'pump', state, x: pump.x, y: pump.y, width: pump.w, height: pump.h })) return false;
  if (state !== 'destroyed') {
    const pose = nacreSiteControlPoses({ auxiliary: pump }, time, options).pump;
    drawPaintedNacreSitePart(ctx, { part: 'pump-rotor', x: pose.x, y: pose.y, width: 40, height: 40, rotation: pose.angle });
  }
  return true;
}
export function drawPaintedNacreSiteValve(ctx, valve, time, options = {}) {
  if (!ready('valve') || !ready('valve-wheel')) return false;
  if (!drawPaintedNacreSitePart(ctx, { part: 'valve', x: valve.x, y: valve.y, width: valve.w, height: valve.h })) return false;
  const pose = nacreSiteControlPoses({ valve }, time, options).valve;
  drawPaintedNacreSitePart(ctx, { part: 'valve-wheel', x: pose.x, y: pose.y, rotation: pose.angle }); return true;
}
export function drawPaintedNacreSiteGate(ctx, gate, { leafY } = {}) {
  const state = nacreSiteDamageState(gate, .5);
  if (!ready('gate', state) || !Number.isFinite(leafY) || typeof ctx?.drawImage !== 'function') return false;
  // Fixed rails stay at the original contact; only the leaf follows the authoritative bounds.
  ctx.save(); ctx.fillStyle = '#24464b'; ctx.strokeStyle = '#93a89b'; ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    const x = gate.x + side * (gate.w / 2 - 2);
    ctx.fillRect(x - 4, gate.y - gate.h / 2, 8, gate.h);
    ctx.beginPath(); ctx.moveTo(x, gate.y - gate.h / 2); ctx.lineTo(x, gate.y + gate.h / 2); ctx.stroke();
  }
  ctx.restore();
  return drawPaintedNacreSitePart(ctx, { part: 'gate', state, x: gate.x, y: state === 'destroyed' ? gate.y : leafY, width: gate.w, height: gate.h });
}
export function drawPaintedNacreSiteGateControl(ctx, mechanism, progress) {
  if (!drawPaintedNacreSitePart(ctx, { part: 'gate-control', state: mechanism.destroyed ? 'destroyed' : 'normal',
    x: mechanism.x, y: mechanism.y, width: mechanism.w, height: mechanism.h })) return false;
  if (!mechanism.destroyed) {
    const angle = -1.1 + clamp(progress) * 2.2;
    ctx.save(); ctx.strokeStyle = '#203f44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mechanism.x, mechanism.y - 2);
    ctx.lineTo(mechanism.x + Math.cos(angle) * 13, mechanism.y - 2 + Math.sin(angle) * 13); ctx.stroke(); ctx.restore();
  }
  return true;
}
export function drawPaintedNacreSiteWinch(ctx, winch) {
  const state = winch.destroyed ? 'destroyed' : 'normal';
  if (!ready('winch', state) || state !== 'destroyed' && !ready('winch-drum')) return false;
  if (!drawPaintedNacreSitePart(ctx, { part: 'winch', state, x: winch.x, y: winch.y, width: winch.w, height: winch.h })) return false;
  if (state !== 'destroyed') drawPaintedNacreSitePart(ctx, { part: 'winch-drum', x: winch.x, y: winch.y, rotation: winch.released ? Math.PI / 3 : 0 });
  return true;
}
export function drawPaintedNacreSiteDeck(ctx, x1, y1, x2, y2, thickness = 8) {
  return drawPaintedNacreSitePart(ctx, { part: 'deck-slat', x: (x1 + x2) / 2, y: (y1 + y2) / 2,
    width: Math.hypot(x2 - x1, y2 - y1), height: thickness, rotation: Math.atan2(y2 - y1, x2 - x1) });
}
export function drawPaintedNacreSiteDepartureRamp(ctx, ramp) {
  // There is no newly invented ruined-ramp cell. Destruction uses the retained vector renderer.
  if (ramp.destroyed || !ready('deck-slat') || !ready('ramp-folded') || typeof ctx?.drawImage !== 'function') return false;
  if (!ramp.prepared && !ramp.working) return drawPaintedNacreSitePart(ctx, { part: 'ramp-folded',
    x: ramp.x, y: ramp.y + ramp.h / 2, width: ramp.w, height: ramp.h });
  const progress = ramp.prepared ? 1 : clamp(ramp.progress), left = ramp.x - ramp.w / 2, right = ramp.x + ramp.w / 2;
  const leftY = ramp.y + 7 * ramp.h / 28, rightY = ramp.y + (-3 - 9 * progress) * ramp.h / 28;
  for (let i = 0; i < 6; i++) {
    const a = i / 6, b = (i + 1) / 6;
    drawPaintedNacreSiteDeck(ctx, left + (right - left) * a, leftY + (rightY - leftY) * a,
      left + (right - left) * b, leftY + (rightY - leftY) * b, 9 * ramp.h / 28);
  }
  return true;
}
