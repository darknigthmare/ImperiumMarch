/** Original Kharon vector kit. SVG and Canvas use these same authored shapes. */
import { drawProductionGeometry, productionGeometrySVG } from './production-assets.mjs';

export const FOUNDRY_ASSET_SPECS = {
  'industrial-carrier': { size: [260, 100], bounds: [-144, -118, 292, 134], ids: ['MI13', 'PL04'], states: ['parked', 'moving', 'damaged', 'destroyed'], anchors: { ground: [0, 0], deck: [0, -70], hitch: [-134, -32] } },
  'serial-cargo': { size: [100, 76], bounds: [-61, -92, 124, 106], ids: ['MI13', 'PT03'], states: ['sealed', 'copied', 'damaged', 'destroyed'], anchors: { ground: [0, 0], marking: [15, -38], lift: [0, -76] } },
  'thermal-bridge': { size: [310, 80], bounds: [-167, -95, 338, 115], ids: ['MI13', 'PL04'], states: ['hot', 'cooling', 'cooled'], anchors: { ground: [0, 0], surface: [0, -45] } },
  'steam-valve': { size: [86, 115], bounds: [-57, -139, 120, 159], ids: ['MI13', 'PL04'], states: ['warning', 'jet', 'closed', 'open', 'destroyed'], anchors: { ground: [0, 0], wheel: [0, -64], jet: [29, -119] } },
  'cargo-manifest': { size: [75, 90], bounds: [-48, -108, 100, 125], ids: ['MI13', 'PT03'], states: ['sealed', 'copied', 'destroyed'], anchors: { ground: [0, 0], text: [0, -53] } },
  'analysis-console': { size: [100, 104], bounds: [-62, -125, 130, 145], ids: ['MI13', 'PN03'], states: ['idle', 'working', 'complete'], anchors: { ground: [0, 0], screen: [0, -68] } },
  'transfer-crane': { size: [250, 185], bounds: [-144, -207, 298, 231], ids: ['MI13', 'PL04'], states: ['idle', 'working', 'received', 'quarantine'], anchors: { ground: [0, 0], hook: [70, -57], post: [-98, -44] } },
  'foundry-stack': { size: [170, 230], bounds: [-106, -258, 220, 278], ids: ['MI13', 'AS19'], states: ['working', 'idle', 'damaged'], anchors: { ground: [0, 0], furnace: [0, -57], stack: [27, -230] } },
};
export const FOUNDRY_ASSET_NAMES = Object.keys(FOUNDRY_ASSET_SPECS);
const clamp = n => Math.max(0, Math.min(1, n));
function painter() {
  const shapes = [];
  return { shapes,
    rect(x, y, w, h, fill, stroke = '#222a2b', strokeWidth = 2) { shapes.push({ type: 'rect', x, y, w, h, fill, stroke, strokeWidth }); },
    line(x1, y1, x2, y2, stroke, strokeWidth = 2) { shapes.push({ type: 'line', x1, y1, x2, y2, stroke, strokeWidth }); },
    poly(points, fill, stroke = '#242d30', strokeWidth = 2) { shapes.push({ type: 'polygon', points, fill, stroke, strokeWidth }); },
    circle(x, y, r, fill, stroke = '#222b2d', strokeWidth = 2) { shapes.push({ type: 'circle', x, y, r, fill, stroke, strokeWidth }); },
    path(commands, fill, stroke, strokeWidth = 2) { shapes.push({ type: 'path', commands, fill, stroke, strokeWidth }); },
  };
}
const metal = '#56666c', edge = '#a8b7ae', amber = '#e9b960', dark = '#253237', rust = '#a36343', pale = '#d9d2b2';
function rivets(d, xs, y) { for (const x of xs) { d.circle(x, y, 2.8, pale, '#37464b', 1); } }
function stripes(d, x, y, w, h) { d.rect(x, y, w, h, '#29363a'); for (let i = 0; i < w; i += 14) d.poly([[x + i, y], [Math.min(x + w, x + i + 7), y], [Math.min(x + w, x + i + 12), y + h], [x + i + 5, y + h]], amber, null); }
function damage(d, x, y) { d.poly([[x - 20, y - 18], [x - 1, y - 6], [x + 8, y - 20], [x + 13, y + 1], [x + 29, y + 13], [x + 4, y + 6], [x - 6, y + 19], [x - 8, y + 2]], dark); d.line(x - 18, y - 15, x + 7, y + 5, rust, 3); }
function carrier(d, state, options) {
  if (options.wheels !== false) for (const x of [-98, -35, 35, 98]) { d.circle(x, -15, 16, '#1b282d', edge, 2); d.circle(x, -15, 8, '#596a6b', '#b2b7a2', 2); d.line(x, -26, x, -4, '#33464c', 2); }
  d.poly([[-132, -29], [-137, -50], [-119, -75], [109, -75], [135, -57], [136, -29]], metal, '#1d282c', 3);
  d.rect(-116, -77, 211, 12, '#81918d', '#27373c'); stripes(d, -116, -64, 190, 7);
  d.rect(-112, -49, 100, 15, '#303e43', edge, 1); for (let x = -106; x < -20; x += 10) d.line(x, -46, x, -37, '#7c8d87');
  d.poly([[68, -76], [79, -103], [112, -103], [129, -78], [129, -44], [91, -44]], state === 'destroyed' ? '#54574e' : '#8d9e94');
  d.poly([[82, -96], [107, -96], [117, -79], [77, -79]], '#223a42', '#bdc0a5'); d.line(97, -97, 97, -80, '#79999a');
  d.rect(111, -65, 18, 7, state === 'destroyed' ? '#473d31' : '#f2d39b', '#8b8067', 1);
  d.line(-138, -34, -125, -34, '#bcb69a', 6); rivets(d, [-109, -66, -18, 29, 74, 125], -55);
  if (state === 'moving') { d.line(-137, -45, -127, -45, '#bbd0c3', 3); d.circle(82, -63, 4, '#b8cfaa'); }
  if (['damaged', 'destroyed'].includes(state)) damage(d, 24, -49);
  if (state === 'destroyed') { d.poly([[-115, -80], [-66, -102], [-53, -72]], '#9a7458'); d.line(86, -98, 112, -79, '#c99e7a', 4); }
}
function cargo(d, state) {
  d.poly([[-51, -3], [-51, -70], [-42, -80], [43, -80], [52, -70], [52, -3]], state === 'destroyed' ? '#665b4b' : '#8c9990', '#27343a', 3);
  d.rect(-42, -70, 84, 61, '#54666b', edge, 2); d.rect(-44, -78, 88, 8, '#b8bda4');
  for (const x of [-34, 30]) { d.rect(x, -74, 8, 69, '#b5b39a', '#38484c', 1); d.rect(x - 2, -43, 12, 9, '#414f51', edge, 1); }
  d.rect(-15, -54, 34, 25, '#c9c5a5', '#34464a', 1); for (let i = 0; i < 6; i++) d.line(-9 + i * 4, -48, -9 + i * 4, -34, '#293e46', i % 2 ? 1 : 2);
  d.line(-13, -24, 22, -24, '#c6c9b0'); d.line(-13, -19, 13, -19, '#b2b9a3'); rivets(d, [-44, 44], -11);
  if (state === 'copied') { d.circle(36, -61, 8, '#a6c2a0', '#374b43', 1.5); d.line(31, -61, 35, -57, '#304b43'); d.line(35, -57, 41, -65, '#304b43'); }
  if (['damaged', 'destroyed'].includes(state)) damage(d, -3, -31);
  if (state === 'destroyed') { d.poly([[-45, -70], [-18, -42], [3, -74], [23, -39], [45, -63]], '#322e29', '#a77e5a', 2); d.poly([[-56, 2], [-29, -9], [43, -6], [58, 5]], '#71644f'); }
}
function bridge(d, state) {
  const hot = state === 'hot', c = hot ? '#eaa15c' : state === 'cooling' ? '#c6bd7f' : '#96c4b2';
  d.poly([[-160, 1], [-133, -49], [128, -49], [160, 1], [139, 8], [115, -24], [-120, -24], [-144, 8]], metal, '#29373d', 3);
  d.rect(-131, -49, 259, 9, '#9ba69a', '#3d5054');
  for (let x = -118; x <= 119; x += 22) { d.line(x, -47, x - 7, -41, '#4b676a', 2); d.line(x, -24, x + 7, -41, '#c5b68e', 2); }
  d.path([['M', -127, -19], ['L', -100, -12], ['L', 95, -12], ['L', 122, -23]], null, '#283e46', 7);
  d.path([['M', -127, -19], ['L', -100, -12], ['L', 95, -12], ['L', 122, -23]], null, c, 3);
  stripes(d, -147, -13, 24, 8); stripes(d, 123, -13, 24, 8);
  for (const x of [-112, 105]) { d.line(x, -52, x, -81, edge, 3); d.circle(x, -83, 5, c); }
}
function valve(d, state, progress) {
  d.poly([[-44, 5], [-36, -10], [35, -10], [45, 5]], '#77877b', dark, 3);
  d.path([['M', -35, -10], ['L', -35, -32], ['L', 25, -32], ['L', 25, -115]], null, '#263840', 16);
  d.path([['M', -35, -10], ['L', -35, -32], ['L', 25, -32], ['L', 25, -115]], null, '#8d9b8c', 10);
  d.rect(16, -120, 22, 12, '#a4ac93', dark, 2); d.rect(-27, -54, 37, 29, '#606f66', dark, 2);
  d.circle(-6, -66, 22, null, state === 'open' ? '#9fcab0' : amber, 5);
  for (let i = 0; i < 4; i++) { const angle = (i + progress) * Math.PI / 2; d.line(-6, -66, -6 + Math.cos(angle) * 19, -66 + Math.sin(angle) * 19, '#d8c38b', 3); }
  d.circle(-6, -66, 7, '#66847b', edge, 2); d.rect(-38, -104, 17, 20, dark, edge, 1);
  d.circle(-30, -94, 5, state === 'warning' || state === 'jet' ? '#edab61' : state === 'open' ? '#a6c9a3' : '#657b75');
  if (state === 'jet') for (const [x, y] of [[21, -130], [36, -133], [46, -121]]) d.line(27, -120, x, y, '#d6d3b8', 3);
  if (state === 'destroyed') damage(d, -3, -51);
}
function manifest(d, state) {
  d.poly([[-33, 2], [-37, -85], [-24, -98], [33, -98], [37, 2]], metal, dark, 3);
  d.rect(-26, -85, 49, 66, '#d1c6a0', '#65766c', 2);
  for (let y = -75; y < -27; y += 8) d.line(-17, y, y % 3 ? 15 : 5, y, '#4a6867', 2);
  d.rect(-13, -18, 23, 10, state === 'copied' ? '#96c1a6' : '#d3a861', '#334e52');
  if (state === 'copied') { d.line(10, -69, 16, -63, '#395e53', 3); d.line(16, -63, 26, -78, '#395e53', 3); }
  if (state === 'destroyed') damage(d, 0, -53);
}
function consoleAsset(d, state, progress) {
  d.poly([[-49, 5], [-42, -12], [39, -12], [50, 5]], '#7a8b7e', dark, 3); d.rect(-20, -43, 36, 31, metal, dark, 3);
  d.poly([[-48, -38], [-42, -105], [35, -105], [51, -39]], '#8b9b91', dark, 3);
  d.rect(-34, -93, 63, 42, '#263f46', '#c8c8a8', 2); d.line(-25, -82, 20, -82, '#87b6ab', 2); d.line(-25, -74, 12, -74, '#739b96', 2);
  d.rect(-26, -63, 45, 4, '#4a655e', null); d.rect(-26, -63, 45 * (state === 'complete' ? 1 : state === 'working' ? progress : .05), 4, '#b6cc9f', null);
  for (let x = -29; x < 31; x += 10) d.rect(x, -44, 6, 4, '#c7bf96', null);
  d.line(37, -89, 51, -118, '#8eaca5', 3); d.circle(52, -119, 4, state === 'working' ? '#e9c17d' : '#aac7ae');
}
function crane(d, state, progress) {
  d.rect(-132, -5, 267, 12, '#687b78', dark, 3); stripes(d, -126, -6, 253, 6);
  d.poly([[-112, -7], [-109, -188], [-85, -188], [-81, -7]], '#92a396', dark, 3);
  d.poly([[-112, -188], [-85, -202], [112, -190], [119, -166], [-105, -166]], '#9aa894', dark, 3);
  for (let x = -69; x < 102; x += 36) { d.line(x, -192, x + 25, -170, '#465f62', 4); d.line(x + 25, -192, x, -170, '#465f62', 2); }
  const height = state === 'working' ? -83 + progress * 24 : -80;
  d.line(68, -170, 68, height, '#d7caa7', 3); d.line(77, -170, 77, height, '#99ad9f', 2);
  d.path([['M', 72, height], ['L', 72, height + 12], ['Q', 88, height + 28, 91, height + 10]], null, '#d5c9a6', 5);
  d.rect(-126, -68, 35, 46, '#506a6d', dark, 2); d.rect(-120, -60, 23, 18, '#233e44', '#bfc3a4');
  d.circle(-108, -31, 4, state === 'quarantine' ? '#d6ad6b' : state === 'received' ? '#a7c59c' : '#799c93');
  if (state === 'quarantine') { d.rect(96, -62, 31, 38, '#c6b584', dark, 2); d.line(102, -54, 121, -34, '#596159', 4); d.line(121, -54, 102, -34, '#596159', 4); }
}
function stack(d, state) {
  d.poly([[-91, 7], [-87, -129], [-60, -153], [60, -153], [85, -125], [96, 7]], '#526166', dark, 3);
  d.rect(12, -242, 43, 107, '#778b88', dark, 3); for (const y of [-230, -200, -170]) d.rect(7, y, 53, 7, '#9ca69b', dark, 2);
  d.rect(-66, -104, 117, 86, '#252e30', '#ad9c7a', 4);
  d.poly([[-59, -25], [-48, -77], [-28, -46], [-14, -84], [13, -51], [29, -91], [44, -25]], state === 'working' ? '#c88343' : '#5b6558', null);
  d.poly([[-52, -25], [-24, -59], [-5, -37], [24, -64], [39, -25]], state === 'working' ? '#e9b365' : '#7c7862', null);
  for (let x = -60; x <= 47; x += 18) d.line(x, -107, x, -16, '#75837b', 5);
  d.line(-81, -127, 74, -127, '#c4b08a', 3); d.rect(-77, -10, 152, 13, '#8a9381', dark, 2);
  if (state === 'damaged') damage(d, -53, -117);
}
export function foundryAssetGeometry({ part, state = FOUNDRY_ASSET_SPECS[part]?.states[0], progress = 0, ...options } = {}) {
  const spec = FOUNDRY_ASSET_SPECS[part]; if (!spec) throw new Error(`Unknown foundry asset ${part}`);
  if (!spec.states.includes(state)) throw new Error(`Unknown foundry state ${part}/${state}`);
  const d = painter(); progress = clamp(progress);
  const draw = { 'industrial-carrier': carrier, 'serial-cargo': cargo, 'thermal-bridge': bridge, 'steam-valve': valve,
    'cargo-manifest': manifest, 'analysis-console': consoleAsset, 'transfer-crane': crane, 'foundry-stack': stack }[part];
  if (part === 'industrial-carrier') draw(d, state, options); else draw(d, state, progress);
  return { id: `foundry-${part}-${state}`, part, state, canonIds: spec.ids, size: [...spec.size], bounds: [...spec.bounds], pivot: [0, 0], anchors: structuredClone(spec.anchors), shapes: d.shapes };
}
export function foundryAssetSVG(geometryOrOptions) {
  return productionGeometrySVG(geometryOrOptions.shapes ? geometryOrOptions : foundryAssetGeometry(geometryOrOptions))
    .replace('src/production-assets.mjs', 'src/foundry-assets.mjs').replace('tools/build-production-assets.mjs', 'tools/build-foundry-assets.mjs');
}
const cache = new Map();
export function drawFoundryAsset(ctx, options) {
  const progress = Math.round(clamp(options.progress || 0) * 32) / 32;
  const key = `${options.part}:${options.state || ''}:${progress}:${options.wheels !== false}`;
  let geometry = cache.get(key);
  if (!geometry) { geometry = foundryAssetGeometry({ ...options, progress }); if (cache.size > 256) cache.clear(); cache.set(key, geometry); }
  const spec = FOUNDRY_ASSET_SPECS[options.part];
  const sx = options.width ? options.width / spec.size[0] : options.scale ?? 1, sy = options.height ? options.height / spec.size[1] : options.scale ?? 1;
  ctx.save(); ctx.translate(options.x ?? 0, options.y ?? 0); ctx.scale(sx * (options.facing ?? 1), sy); drawProductionGeometry(ctx, geometry); ctx.restore();
}
