/** Original MI10 vectors. The same geometry feeds SVG exports and live Canvas.
 * Simulation owns the cuves, pollution, work progress and retained evidence. */
import { drawProductionGeometry, productionGeometrySVG } from './production-assets.mjs';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const CHEMICAL_ASSET_SPECS = {
  'chemical-tank': { size: [144, 194], bounds: [-100, -219, 224, 242], ids: ['MI10', 'PT02'], states: ['unknown', 'identified', 'leaking', 'sealed', 'destroyed'], anchors: { ground: [0, 0], sample: [73, -49], plate: [0, -96] } },
  'canal-junction': { size: [200, 70], bounds: [-117, -81, 236, 106], ids: ['MI10', 'PL03'], states: ['open', 'covering', 'covered', 'contaminated', 'destroyed'], anchors: { ground: [0, 0], gate: [0, -31] } },
  'sampling-rig': { size: [116, 118], bounds: [-74, -137, 162, 157], ids: ['MI10', 'PT02'], states: ['idle', 'working', 'secured', 'lost'], anchors: { ground: [0, 0], vial: [14, -63], intake: [-63, -42] } },
  'batch-ledger': { size: [100, 95], bounds: [-63, -111, 131, 130], ids: ['MI10', 'PT02'], states: ['unread', 'copied', 'lost'], anchors: { ground: [0, 0], inspect: [0, -55] } },
  'field-valve': { size: [90, 85], bounds: [-69, -108, 144, 127], ids: ['MI10'], states: ['normal', 'working', 'operated', 'destroyed'], anchors: { ground: [0, 0], wheel: [0, -65] } },
  'village-supply': { size: [220, 160], bounds: [-133, -188, 269, 208], ids: ['MI10', 'PL03'], states: ['habitable', 'contaminated', 'destroyed'], anchors: { ground: [0, 0], intake: [-113, -22] } },
};
export const CHEMICAL_ASSET_NAMES = Object.keys(CHEMICAL_ASSET_SPECS);

function painter() {
  const shapes = [];
  return { shapes,
    poly(points, fill, stroke = '#203d39', strokeWidth = 2) { shapes.push({ type: 'polygon', points, fill, stroke, strokeWidth }); },
    line(x1, y1, x2, y2, stroke, strokeWidth = 2) { shapes.push({ type: 'line', x1, y1, x2, y2, stroke, strokeWidth }); },
    circle(x, y, r, fill, stroke = null, strokeWidth = 1) { shapes.push({ type: 'circle', x, y, r, fill, stroke, strokeWidth }); },
    rect(x, y, w, h, fill, stroke = null, strokeWidth = 1) { shapes.push({ type: 'rect', x, y, w, h, fill, stroke, strokeWidth }); },
    path(commands, fill, stroke = null, strokeWidth = 2) { shapes.push({ type: 'path', commands, fill, stroke, strokeWidth }); },
  };
}
function tank(d, state) {
  const broken = state === 'destroyed', hot = state === 'leaking';
  d.poly([[-82, -11], [-64, -24], [66, -24], [86, -9], [78, 6], [-78, 6]], '#717665');
  for (const x of [-47, 36]) { d.rect(x, -41, 14, 35, '#8d927b', '#294b43', 2); d.rect(x - 4, -7, 23, 7, '#b9b18b'); }
  if (broken) {
    d.poly([[-65, -22], [-59, -113], [-29, -132], [-35, -79], [-7, -104], [13, -72], [27, -109], [62, -121], [70, -22]], '#667c70', '#203e37', 3);
    d.poly([[-39, -102], [-23, -119], [10, -71], [37, -110], [58, -117], [43, -54], [-23, -47]], '#263f38');
    d.line(-57, -40, 65, -40, '#b4a77c', 5); d.poly([[76, -10], [98, -38], [111, -15], [104, 0]], '#8a967e');
    d.path([['M', -28, 4], ['Q', 13, -6, 67, 9], ['Q', 38, 17, -28, 4], ['Z']], '#b0ad67'); return;
  }
  d.path([['M', -61, -42], ['L', -61, -159], ['Q', -57, -188, 0, -193], ['Q', 57, -188, 61, -159], ['L', 61, -42], ['Q', 0, -21, -61, -42], ['Z']], '#7d978a', '#24463e', 3);
  d.path([['M', 28, -185], ['Q', 59, -175, 61, -159], ['L', 61, -42], ['L', 32, -34], ['L', 32, -161], ['Z']], '#58776c');
  d.path([['M', -42, -159], ['Q', -17, -179, 15, -180]], null, '#b3bf9a', 3);
  for (const y of [-155, -52]) { d.rect(-65, y, 130, 10, '#b8b083', '#3b5c48', 2); for (const x of [-55, -19, 20, 53]) d.circle(x, y + 5, 2.1, '#455c48'); }
  d.rect(-20, -211, 40, 19, '#4e6f62', '#213f36', 2); d.rect(-27, -213, 54, 7, '#b0ac83');
  d.rect(-25, -124, 49, 47, '#294b44', '#c3be91', 2);
  d.poly([[0, -119], [19, -87], [-19, -87]], state === 'unknown' ? '#929a7a' : '#dbce8b', '#53674c', 1.4);
  d.line(0, -109, 0, -99, '#2c493b', 3); d.circle(0, -94, 1.8, '#2c493b');
  d.rect(-44, -126, 9, 59, '#203d37', '#c4c39a', 1.5); d.rect(-42, -99, 5, 29, hot ? '#d2b969' : '#aec58c');
  d.path([['M', 58, -58], ['L', 76, -58], ['L', 76, -34], ['L', 91, -34]], null, '#b0ac85', 9);
  d.circle(77, -57, 12, '#315449', '#babb8c', 2); d.line(70, -57, 84, -57, '#cad0a4', 3);
  if (state === 'sealed') { d.rect(65, -45, 27, 12, '#9cba9b', '#244437', 2); d.line(70, -39, 76, -35, '#294c3b', 2); d.line(76, -35, 85, -43, '#294c3b', 2); }
  if (hot) { d.path([['M', 89, -33], ['Q', 106, -23, 96, -2]], null, '#d2c079', 5); d.path([['M', 63, 4], ['Q', 82, -7, 112, 5], ['Q', 92, 14, 63, 4], ['Z']], '#a8ac65'); }
  if (state !== 'unknown') { d.rect(-20, -71, 41, 10, '#c4c6a1'); for (let i = 0; i < 8; i++) d.line(-15 + i * 4, -69, -15 + i * 4, -63, '#416151', i % 3 ? 1 : 2); }
}
function canal(d, state, p) {
  const bad = state === 'contaminated', broken = state === 'destroyed';
  d.poly([[-113, -30], [100, -30], [113, 7], [-103, 7]], '#596b58');
  d.poly([[-105, -21], [99, -21], [107, -2], [-99, -2]], bad || broken ? '#b1aa62' : '#77a9a1', '#233f36', 1);
  for (const y of [-18, -9]) d.line(-99, y, 99, y, bad || broken ? '#d4c888' : '#b1d0bc', 1.4);
  for (const x of [-108, 99]) d.rect(x, -39, 9, 49, '#a3a27a', '#294b3e', 2);
  const covered = state === 'covered' ? 1 : state === 'covering' ? p : 0;
  for (const x of [-108, 99]) { d.rect(x - 2, -35, 13, 20, '#6f8465', '#2e4b38', 2); d.circle(x + 4, -27, 4, '#c2c394'); }
  if (!broken && covered > 0) {
    const width = 202 * covered;
    d.rect(-101, -30, width, 13, '#b6b185', '#2b4c3b', 2);
    for (let x = -92; x < -101 + width; x += 20) d.line(x, -28, x, -19, '#6d7d5b', 2);
    d.line(-101, -33, -101 + width, -33, '#d0cea1', 3);
  }
  if (broken) { d.poly([[-109, -34], [-82, -24], [-93, 5], [-108, 7]], '#737d5d'); d.line(71, -17, 101, 6, '#d6bc83', 3); }
  if (state === 'covered') d.circle(103, -27, 3, '#c3d1a0');
}
function rig(d, state, p) {
  const lost = state === 'lost';
  d.poly([[-63, -12], [-44, -28], [51, -28], [67, -10], [59, 3], [-58, 3]], '#858a6d');
  d.rect(-46, -75, 44, 58, lost ? '#485d4b' : '#617f72', '#223e35', 2);
  d.poly([[-51, -77], [-43, -105], [-3, -105], [3, -77]], '#a8aa83');
  d.rect(-39, -96, 32, 15, '#243e36', '#c7c6a0', 1.5);
  for (const x of [-30, -19]) d.circle(x, -89, 2.5, lost ? '#5b6851' : '#bbcfab');
  d.path([['M', -41, -42], ['L', -65, -42], ['L', -65, -19]], null, '#adb38c', 6);
  d.line(0, -20, 0, -124, '#a2ad8e', 7); d.line(0, -124, 46, -124, '#a2ad8e', 7); d.line(46, -124, 46, -87, '#a2ad8e', 5);
  if (!lost) {
    d.rect(4, -87, 36, 57, '#284a3f', '#bacbaa', 2); d.rect(9, -82, 26, 45, '#699c8b');
    const amount = state === 'secured' ? 1 : state === 'working' ? p : .08;
    d.rect(10, -38 - 42 * amount, 24, 42 * amount, '#d4d49e');
    d.rect(3, -93, 38, 8, state === 'secured' ? '#d0ba85' : '#9caa82');
    if (state === 'secured') { d.line(7, -90, 35, -90, '#384f3d', 2); d.poly([[45, -76], [59, -76], [64, -68], [59, -60], [45, -60]], '#c2c9a0'); }
  } else { d.poly([[3, -34], [17, -67], [21, -35], [39, -57], [43, -31]], '#84a78b'); d.path([['M', 29, 5], ['Q', 54, -3, 73, 8], ['Q', 43, 15, 29, 5], ['Z']], '#b2ac68'); }
  if (state === 'working') d.circle(-23, -62, 5, '#d4c87e', '#243e35', 2);
}
function ledger(d, state) {
  d.poly([[-52, -11], [-34, -26], [35, -26], [53, -10], [46, 5], [-45, 5]], '#6f7b5c');
  d.rect(-9, -51, 18, 36, '#829576', '#2e4b38', 2);
  d.poly([[-47, -101], [48, -91], [51, -42], [-44, -49]], state === 'lost' ? '#526750' : '#9eae8b', '#203d35', 3);
  if (state === 'lost') { d.poly([[-32, -91], [-8, -63], [4, -91], [25, -62], [38, -81], [34, -50], [-30, -55]], '#243e35'); return; }
  d.poly([[-37, -92], [38, -84], [39, -51], [-34, -57]], '#294b3f', '#c4c79f', 1);
  for (let i = 0; i < 4; i++) { const y = -84 + i * 7; d.line(-26, y, 22, y + 5, '#acbd90', i === 0 ? 3 : 1.5); }
  if (state === 'copied') { d.poly([[24, -67], [53, -65], [53, -29], [22, -31]], '#ded5a8', '#35533e', 1.5); for (let i = 0; i < 4; i++) d.line(29, -56 + i * 6, 46, -55 + i * 6, '#728262', 1.5); }
}
function valve(d, state, p) {
  d.poly([[-57, -8], [-39, -19], [38, -19], [62, -5], [54, 7], [-50, 7]], '#61745b');
  d.path([['M', -57, -26], ['L', -24, -26], ['L', -24, -42], ['L', 25, -42], ['L', 25, -24], ['L', 61, -24]], null, '#9ba887', 14);
  d.rect(-22, -53, 43, 33, '#62836b', '#284935', 2); d.line(0, -52, 0, -78, '#b5b993', 7);
  if (state === 'destroyed') { d.line(-21, -47, 16, -22, '#293f32', 6); d.poly([[30, -5], [47, -30], [58, -14]], '#aaa97d'); return; }
  d.circle(0, -75, 23, '#365940', '#c6c79a', 3);
  const angle = state === 'working' ? p * Math.PI * 2 : state === 'operated' ? Math.PI / 4 : 0;
  for (const a of [angle, angle + Math.PI / 2]) { const x = Math.cos(a) * 18, y = Math.sin(a) * 18; d.line(-x, -75 - y, x, -75 + y, '#c6c79a', 3); }
  d.circle(0, -75, 5, '#a5b08b');
  d.rect(35, -67, 20, 18, state === 'operated' ? '#c2d3a6' : '#c3a56f', '#324c36', 2);
}
function village(d, state) {
  const lost = state === 'destroyed', bad = state === 'contaminated';
  d.poly([[-120, -7], [-82, -19], [98, -19], [123, -4], [111, 8], [-111, 8]], '#566c4b');
  if (lost) { d.poly([[-102, -14], [-69, -91], [-40, -49], [-12, -115], [31, -67], [68, -84], [103, -15]], '#728268'); d.poly([[-58, -51], [-9, -91], [28, -24]], '#b4a67a'); return; }
  d.poly([[-98, -101], [-54, -159], [24, -164], [90, -118], [93, -26], [-94, -26]], '#6f8a64', '#284d36', 3);
  d.poly([[-119, -98], [-59, -177], [23, -180], [112, -120], [76, -108], [17, -151], [-51, -147], [-89, -87]], '#91a877', '#2b5037', 2);
  for (const x of [-83, -43, 7, 51, 80]) d.line(x, -93, x + 4, -28, '#b7bd87', 3);
  d.rect(-26, -83, 39, 57, '#294934', '#c8c591', 2); d.line(-6, -79, -6, -31, '#6a8056', 2);
  for (const x of [-74, 35]) { d.rect(x, -88, 26, 26, bad ? '#74774b' : '#c8cf98', '#315539', 2); d.line(x + 13, -88, x + 13, -62, '#466340', 2); }
  d.path([['M', -122, -22], ['L', -64, -22], ['L', -64, -46]], null, '#afba90', 8); d.circle(-64, -48, 10, bad ? '#b8a76d' : '#83b7a1', '#34543b', 2);
  for (let i = 0; i < 5; i++) { const x = 45 + i * 12; d.line(x, -4, x + 2, bad ? -12 : -29, bad ? '#9b9861' : '#9fbe75', 2); if (!bad) d.line(x + 1, -16, x + 9, -23, '#c1cc8c', 3); }
}

export function chemicalAssetGeometry({ part = 'chemical-tank', state, progress = 0 } = {}) {
  const spec = CHEMICAL_ASSET_SPECS[part];
  if (!spec) throw new RangeError(`Unknown chemical asset: ${part}`);
  state ??= spec.states[0];
  if (!spec.states.includes(state)) throw new RangeError(`Unknown ${part} state: ${state}`);
  const d = painter(), p = clamp(Number.isFinite(progress) ? progress : 0, 0, 1);
  if (part === 'chemical-tank') tank(d, state);
  else if (part === 'canal-junction') canal(d, state, p);
  else if (part === 'sampling-rig') rig(d, state, p);
  else if (part === 'batch-ledger') ledger(d, state);
  else if (part === 'field-valve') valve(d, state, p);
  else village(d, state);
  return { id: `chemical-${part}-${state}`, part, state, size: [...spec.size], bounds: [...spec.bounds], pivot: [0, 0], anchors: spec.anchors, canonIds: spec.ids, shapes: d.shapes };
}
const cache = new Map();
export function drawChemicalAsset(ctx, options = {}) {
  const part = options.part || 'chemical-tank', state = options.state || CHEMICAL_ASSET_SPECS[part]?.states[0];
  const progress = Math.round(clamp(options.progress || 0, 0, 1) * 32) / 32, key = `${part}:${state}:${progress}`;
  let geometry = cache.get(key);
  if (!geometry) { geometry = chemicalAssetGeometry({ part, state, progress }); if (cache.size >= 256) cache.clear(); cache.set(key, geometry); }
  ctx.save(); ctx.translate(options.x || 0, options.y || 0);
  ctx.scale((options.scale ?? 1) * (options.width ?? geometry.size[0]) / geometry.size[0] * (options.facing === -1 ? -1 : 1), (options.scale ?? 1) * (options.height ?? geometry.size[1]) / geometry.size[1]);
  drawProductionGeometry(ctx, geometry); ctx.restore(); return geometry;
}
export function chemicalAssetSVG(geometry) {
  return productionGeometrySVG(geometry, { title: `${geometry.canonIds.join(' / ')} — ${geometry.part} — ${geometry.state}` })
    .replace('src/production-assets.mjs', 'src/chemical-assets.mjs')
    .replace('tools/build-production-assets.mjs', 'tools/build-chemical-assets.mjs');
}
