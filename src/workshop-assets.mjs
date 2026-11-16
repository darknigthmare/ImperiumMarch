/** MI14 original silhouettes. All SVG exports and in-game Canvas art share these shapes. */
import { drawProductionGeometry, productionGeometrySVG } from './production-assets.mjs';
import { drawPaintedWorkshopAsset } from './painted-sprites.mjs';

export const WORKSHOP_ASSET_SPECS = {
  worker: { size: [32, 60], bounds: [-27, -70, 54, 80], ids: ['MI14', 'PL04'], states: ['standing', 'walking', 'safe', 'lost'], anchors: { ground: [0, 0], head: [0, -52], hand: [18, -27] } },
  cooler: { size: [172, 142], bounds: [-100, -156, 204, 170], ids: ['MI14', 'PL04'], states: ['broken', 'isolated', 'repairing', 'online', 'destroyed'], anchors: { ground: [0, 0], service: [45, -58], inlet: [-90, -37], outlet: [91, -89] } },
  valve: { size: [64, 98], bounds: [-44, -112, 94, 124], ids: ['MI14', 'PL04'], states: ['open', 'isolated', 'destroyed'], anchors: { ground: [0, 0], wheel: [0, -62] } },
  'disputed-lot': { size: [130, 88], bounds: [-76, -101, 156, 115], ids: ['MI14'], states: ['sealed', 'inspected', 'released', 'blocked', 'destroyed'], anchors: { ground: [0, 0], serial: [30, -40] } },
  'workshop-control': { size: [82, 112], bounds: [-53, -128, 110, 142], ids: ['MI14', 'PL04'], states: ['idle', 'working', 'production', 'stopped', 'destroyed'], anchors: { ground: [0, 0], switch: [0, -69] } },
  'security-automaton': { size: [112, 110], bounds: [-67, -127, 142, 142], ids: ['MI14', 'PL04'], states: ['dormant', 'warning', 'active', 'destroyed'], anchors: { ground: [0, 0], optic: [0, -86], cannonPivot: [0, -55], muzzle: [56, -55] } },
  'picket-post': { size: [110, 104], bounds: [-67, -116, 140, 130], ids: ['MI14'], states: ['closed', 'clearing', 'open'], anchors: { ground: [0, 0], radio: [-28, -74] } },
};
export const WORKSHOP_ASSET_NAMES = Object.keys(WORKSHOP_ASSET_SPECS);
const C = { ink: '#26343b', steel: '#60777b', edge: '#abbcaf', amber: '#dca65e', rust: '#b56b4a', mint: '#afd4b9', cream: '#ddd1af', glass: '#233d46' };
const clamp = value => Math.max(0, Math.min(1, value));
function painter() {
  const shapes = [];
  return { shapes,
    rect(x, y, w, h, fill, stroke = C.ink, strokeWidth = 2) { shapes.push({ type: 'rect', x, y, w, h, fill, stroke, strokeWidth }); },
    line(x1, y1, x2, y2, stroke = C.edge, strokeWidth = 2) { shapes.push({ type: 'line', x1, y1, x2, y2, stroke, strokeWidth }); },
    circle(x, y, r, fill, stroke = C.ink, strokeWidth = 2) { shapes.push({ type: 'circle', x, y, r, fill, stroke, strokeWidth }); },
    poly(points, fill, stroke = C.ink, strokeWidth = 2) { shapes.push({ type: 'polygon', points, fill, stroke, strokeWidth }); },
  };
}
function rivets(d, points) { for (const [x, y] of points) d.circle(x, y, 2, C.cream, C.ink, 1); }
function hatch(d, x, y, width) { d.rect(x, y, width, 7, C.ink, null); for (let k = 0; k < width - 7; k += 13) d.poly([[x + k, y], [x + k + 6, y], [x + k + 12, y + 7], [x + k + 6, y + 7]], C.amber, null); }
function crack(d, x, y) { d.poly([[x - 14, y - 15], [x + 2, y - 7], [x + 10, y - 17], [x + 9, y + 4], [x + 24, y + 13], [x - 1, y + 7], [x - 8, y + 17], [x - 5, y]], C.ink); d.line(x - 12, y - 12, x + 10, y + 7, C.rust, 2); }
function worker(d, state, progress, mechanic) {
  const vest = mechanic ? '#719e98' : '#c79256';
  if (state === 'lost') {
    d.poly([[-23, -4], [-10, -12], [14, -10], [24, -2], [21, 3], [-21, 3]], '#655c4f', C.ink, 1.5);
    d.circle(-17, -10, 6, '#bda482', C.ink, 1.5); d.rect(-22, -17, 13, 5, vest, C.ink, 1); return;
  }
  const step = state === 'walking' ? Math.sin(progress * Math.PI * 2) * 9 : 2;
  d.line(-6, -22, -6 + step, -3, '#283b43', 8); d.line(6, -22, 6 - step, -3, '#364951', 8);
  d.line(-11 + step, -1, -2 + step, -1, '#1b3038', 5); d.line(2 - step, -1, 12 - step, -1, '#1b3038', 5);
  d.poly([[-10, -42], [8, -42], [13, -23], [6, -17], [-12, -21]], vest, C.ink, 1.5);
  d.line(-6, -39, -6, -24, '#e1cc9b', 2); d.line(6, -39, 6, -24, '#e1cc9b', 2); d.line(-9, -28, 9, -28, '#e1cc9b', 3);
  d.line(-10, -38, -15 - step * .3, -23, '#455f65', 6); d.line(10, -38, 17 + step * .3, -26, '#455f65', 6);
  d.circle(17 + step * .3, -24, 3, '#b69b77', C.ink, 1); d.circle(-15 - step * .3, -22, 3, '#b69b77', C.ink, 1);
  d.circle(0, -50, 7, '#bd9c73', C.ink, 1.5); d.poly([[-9, -52], [-7, -61], [4, -63], [9, -54], [11, -51]], mechanic ? '#abc3b1' : '#d6b578', C.ink, 1.5);
  d.line(-7, -53, 10, -53, '#5d6658', 2); d.rect(1, -50, 7, 3, C.glass, null);
  if (mechanic) { d.line(13, -28, 20, -16, C.edge, 3); d.line(19, -18, 23, -21, C.edge, 3); }
  if (state === 'safe') { d.circle(-17, -57, 5, C.mint, C.ink, 1); d.line(-20, -57, -17, -54, C.ink, 1); d.line(-17, -54, -14, -60, C.ink, 1); }
}
function cooler(d, state, progress) {
  const active = state === 'online', signal = active ? C.mint : state === 'isolated' ? '#b3bec2' : C.amber;
  d.rect(-87, -8, 174, 15, '#445e64', C.ink, 3);
  d.poly([[-78, -9], [-78, -116], [-62, -141], [66, -141], [84, -119], [84, -9]], '#768c85', C.ink, 3);
  d.rect(-69, -123, 84, 103, '#344c56', C.edge, 2);
  for (const y of [-97, -50]) {
    d.circle(-27, y, 19, '#263a43', '#9daf9f', 3); d.circle(-27, y, 5, '#a8bca8', C.ink, 1);
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5 + (active ? progress * 6.28 : 0); d.line(-27 + Math.cos(a) * 7, y + Math.sin(a) * 7, -27 + Math.cos(a + .4) * 15, y + Math.sin(a + .4) * 15, '#75968f', 6); }
  }
  d.rect(27, -116, 43, 29, '#2a4048', C.edge, 2); d.line(34, -105, 43, -105, signal, 3); d.line(48, -105, 63, -105, signal, 3);
  d.rect(27, -76, 43, 49, '#5d7479', '#aeb8a0', 2); for (let x = 35; x < 65; x += 9) d.line(x, -68, x, -36, '#a5b2a3', 3);
  d.line(-89, -38, -77, -38, '#a3b8aa', 12); d.line(84, -88, 96, -88, '#a3b8aa', 12); hatch(d, -64, -16, 132);
  rivets(d, [[-70, -132], [69, -132], [-70, -19], [72, -19]]);
  if (state === 'broken' || state === 'destroyed') crack(d, 43, -56);
  if (state === 'repairing') { d.rect(29, -72, 36, 42, C.ink, '#d7be87', 2); d.line(35, -62, 57, -40, C.edge, 4); d.line(56, -63, 39, -41, C.amber, 3); }
  if (state === 'destroyed') { crack(d, -29, -92); d.poly([[-58, -137], [-43, -149], [-11, -119]], '#5d5445'); }
}
function valve(d, state, progress) {
  d.rect(-31, -8, 65, 13, '#6e8b83', C.ink, 2); d.rect(-9, -58, 20, 51, C.steel, C.ink, 3);
  d.line(-30, -31, 33, -31, '#273f49', 14); d.line(-30, -31, 33, -31, '#99ac9e', 8);
  d.circle(0, -68, 24, null, state === 'isolated' ? C.mint : C.amber, 5);
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + progress * Math.PI; d.line(0, -68, Math.cos(a) * 21, -68 + Math.sin(a) * 21, C.cream, 3); }
  d.circle(0, -68, 7, C.steel, C.edge, 2); d.rect(22, -102, 13, 19, C.ink, C.edge, 1); d.circle(28, -93, 4, state === 'isolated' ? C.mint : C.rust, null);
  if (state === 'destroyed') crack(d, 1, -46);
}
function lot(d, state) {
  d.rect(-66, -8, 132, 13, '#576f72', C.ink, 3); d.rect(-60, -81, 119, 72, '#737f73', C.ink, 3);
  d.rect(-55, -88, 109, 10, '#a1ad97', C.ink, 2);
  for (const x of [-49, 46]) d.rect(x, -78, 7, 67, '#bdba9c', C.ink, 1);
  for (const y of [-66, -48, -30]) d.line(-31, y, 11, y, '#3b5259', 5);
  d.rect(19, -62, 25, 35, '#dfd2aa', C.ink, 1); for (let x = 23; x < 42; x += 3) d.line(x, -53, x, -35, '#344e53', x % 2 ? 1 : 2);
  hatch(d, -43, -17, 84);
  if (state === 'inspected') { d.circle(30, -75, 6, C.mint, C.ink, 1); d.line(27, -75, 29, -72, C.ink, 1); d.line(29, -72, 34, -78, C.ink, 1); }
  if (state === 'blocked') { d.line(-59, -76, 56, -10, '#e2b367', 7); d.line(56, -76, -59, -10, '#e2b367', 7); }
  if (state === 'released') { d.rect(-30, -57, 45, 28, '#adc6aa', C.ink, 2); d.line(-22, -43, 5, -43, '#31534d', 3); d.line(-3, -51, 6, -43, '#31534d', 3); d.line(6, -43, -3, -35, '#31534d', 3); }
  if (state === 'destroyed') { crack(d, -8, -47); d.poly([[-58, -81], [-22, -91], [-10, -57], [26, -84], [56, -63]], C.ink, '#9f8a66', 2); }
}
function control(d, state, progress) {
  d.rect(-38, -7, 77, 12, '#7b9388', C.ink, 3); d.rect(-31, -108, 61, 100, C.steel, C.ink, 3);
  d.rect(-24, -97, 47, 29, C.glass, C.edge, 2); d.line(-17, -88, 15, -88, state === 'production' ? C.amber : C.mint, 2); d.line(-17, -80, 3, -80, C.edge, 2);
  d.circle(0, -48, 16, '#30464c', '#b5bda5', 2); d.line(0, -49, state === 'stopped' ? -11 : 11, state === 'stopped' ? -38 : -61, C.cream, 5);
  d.rect(-21, -25, 40, 6, C.ink, null); d.rect(-21, -25, 40 * (state === 'working' ? progress : ['production', 'stopped'].includes(state) ? 1 : 0), 6, state === 'production' ? C.amber : C.mint, null);
  d.line(29, -89, 39, -116, C.edge, 3); d.circle(40, -119, 4, state === 'working' ? C.amber : C.mint, C.ink, 1);
  if (state === 'destroyed') crack(d, 0, -65);
}
function automaton(d, state, progress, mechanic, aimAngle = 0) {
  d.poly([[-58, 4], [-52, -18], [-33, -29], [36, -29], [57, -16], [62, 4]], '#4e646b', C.ink, 3); hatch(d, -49, -11, 98);
  for (const x of [-42, 42]) d.line(x, -24, x, -5, '#a3b19c', 9);
  d.rect(-18, -66, 37, 37, '#748b85', C.ink, 3); d.circle(0, -46, 10, '#283e47', '#adbaa2', 3);
  d.poly([[-46, -66], [-42, -96], [-25, -116], [30, -111], [48, -89], [42, -63]], '#88998b', C.ink, 3);
  d.rect(-28, -96, 46, 17, '#203641', C.ink, 2); d.line(-20, -88, 11, -88, state === 'active' ? '#e5a466' : state === 'warning' ? '#dec689' : '#667e77', 4);
  d.rect(-39, -76, 14, 11, C.steel, C.ink, 1); rivets(d, [[-33, -103], [30, -102], [-35, -69], [31, -68]]);
  // Nominal 112 × 110 body: cannon pivot is the simulation's body centre,
  // and its muzzle is exactly one half-width along enemyFire's target vector.
  const ux = Math.cos(aimAngle), uy = Math.sin(aimAngle), tipX = ux * 56, tipY = -55 + uy * 56;
  d.line(ux * 10, -55 + uy * 10, tipX, tipY, C.ink, 12);
  d.line(ux * 10, -55 + uy * 10, tipX, tipY, '#9eafa0', 7);
  d.line(tipX + uy * 6, tipY - ux * 6, tipX - uy * 6, tipY + ux * 6, C.ink, 3);
  d.circle(0, -55, 10, '#526d72', C.edge, 2);
  if (state === 'warning') d.circle(34, -117, 5, '#e8b971', C.ink, 1);
  if (state === 'active') { d.circle(34, -117, 5, '#e5a466', C.ink, 1); d.line(-13, -61, 10, -61, C.amber, 3); }
  if (state === 'destroyed') { crack(d, 0, -87); d.poly([[-38, -96], [-12, -72], [13, -115], [28, -77]], '#373b35', '#9f8e6b', 2); }
}
function picket(d, state) {
  for (const x of [-45, 45]) { d.rect(x - 4, -83, 8, 85, C.steel, C.ink, 2); d.rect(x - 13, -6, 26, 9, '#7a9387', C.ink, 2); }
  d.rect(-56, -93, 113, 33, '#b7ad88', C.ink, 3); d.line(-45, -82, 39, -82, '#3b5359', 4); d.line(-32, -72, 28, -72, '#516767', 3);
  if (state !== 'open') { d.line(-42, -45, 43, -45, state === 'clearing' ? C.mint : C.amber, 5); d.line(-42, -40, 43, -40, '#465e63', 2); }
  d.rect(-39, -59, 22, 29, '#3c5860', C.ink, 2); d.circle(-28, -49, 4, state === 'open' ? C.mint : C.amber, C.ink, 1);
  d.line(-25, -59, -20, -105, C.edge, 2);
}
export function workshopAssetGeometry({ part, state = WORKSHOP_ASSET_SPECS[part]?.states[0], progress = 0, mechanic = false, aimAngle = 0 } = {}) {
  const spec = WORKSHOP_ASSET_SPECS[part]; if (!spec || !spec.states.includes(state)) throw new Error(`Unknown workshop asset ${part}/${state}`);
  if (!Number.isFinite(aimAngle) || !Number.isFinite(progress)) throw new TypeError('Workshop animation values must be finite');
  const d = painter(); const draw = { worker, cooler, valve, 'disputed-lot': lot, 'workshop-control': control, 'security-automaton': automaton, 'picket-post': picket }[part];
  draw(d, state, clamp(progress), mechanic, aimAngle);
  const anchors = structuredClone(spec.anchors);
  if (part === 'security-automaton') anchors.muzzle = [Math.cos(aimAngle) * 56, -55 + Math.sin(aimAngle) * 56];
  return { id: `workshop-${part}-${state}`, part, state, canonIds: spec.ids, size: [...spec.size], bounds: [...spec.bounds], pivot: [0, 0], anchors, shapes: d.shapes };
}
export function workshopAssetSVG(input) {
  return productionGeometrySVG(input.shapes ? input : workshopAssetGeometry(input)).replace('src/production-assets.mjs', 'src/workshop-assets.mjs').replace('tools/build-production-assets.mjs', 'tools/build-workshop-assets.mjs');
}
const cache = new Map();
export function drawWorkshopAsset(ctx, options) {
  const progress = Math.round(clamp(options.progress || 0) * 24) / 24;
  const key = `${options.part}:${options.state || ''}:${progress}:${Boolean(options.mechanic)}:${options.aimAngle || 0}`;
  let geometry = cache.get(key);
  if (!geometry) { geometry = workshopAssetGeometry({ ...options, progress }); if (cache.size > 384) cache.clear(); cache.set(key, geometry); }
  const spec = WORKSHOP_ASSET_SPECS[options.part];
  ctx.save(); ctx.translate(options.x || 0, options.y || 0);
  ctx.scale((options.width ? options.width / spec.size[0] : options.scale ?? 1) * (options.facing ?? 1), options.height ? options.height / spec.size[1] : options.scale ?? 1);
  if (options.painted === false || !drawPaintedWorkshopAsset(ctx, { ...options, progress }, geometry)) drawProductionGeometry(ctx, geometry);
  ctx.restore();
}
