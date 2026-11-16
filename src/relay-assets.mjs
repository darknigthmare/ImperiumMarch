/** Original MI12 vector kit. SVG exports and Canvas use these same shapes. */
import { drawProductionGeometry, productionGeometrySVG } from './production-assets.mjs';
export const RELAY_ASSET_SPECS = {
  'relay-mast': { size: [96, 152], bounds: [-66, -170, 132, 184], ids: ['MI12', 'PL03'], states: ['live', 'reviewed', 'purging', 'isolated', 'erased', 'destroyed'], anchors: { ground: [0, 0], archive: [0, -66], antenna: [0, -145] } },
  'copy-console': { size: [100, 86], bounds: [-64, -110, 134, 126], ids: ['MI12'], states: ['idle', 'copying', 'copied', 'expired'], anchors: { ground: [0, 0], screen: [0, -60], cable: [56, -16] } },
  'praetor-hull': { size: [172, 92], bounds: [-128, -112, 256, 130], ids: ['MI12', 'VE12'], states: ['guard', 'attack', 'exposed', 'destroyed'], anchors: { ground: [0, 0], sensor: [-13, -113], cannon: [-115, -56], legs: [-61, -10] } },
  'praetor-sensor': { size: [40, 34], bounds: [-31, -42, 62, 55], ids: ['MI12', 'VE12'], states: ['tracking', 'locking', 'disabled'], anchors: { ground: [0, 0], lens: [-13, -20] } },
  'praetor-lock': { size: [36, 34], bounds: [-28, -46, 58, 61], ids: ['MI12', 'VE12'], states: ['anchored', 'broken'], anchors: { ground: [0, 0], piston: [0, -18] } },
  'command-post': { size: [64, 70], bounds: [-46, -92, 96, 109], ids: ['MI12'], states: ['idle', 'working', 'transmitted'], anchors: { ground: [0, 0], screen: [0, -48], aerial: [26, -78] } },
};
export const RELAY_ASSET_NAMES = Object.keys(RELAY_ASSET_SPECS);
function painter() {
  const shapes = [];
  return { shapes,
    poly(points, fill, stroke = '#23352e', strokeWidth = 2) { shapes.push({ type: 'polygon', points, fill, stroke, strokeWidth }); },
    rect(x, y, w, h, fill, stroke = null, strokeWidth = 1) { shapes.push({ type: 'rect', x, y, w, h, fill, stroke, strokeWidth }); },
    circle(x, y, r, fill, stroke = null, strokeWidth = 1) { shapes.push({ type: 'circle', x, y, r, fill, stroke, strokeWidth }); },
    line(x1, y1, x2, y2, stroke, strokeWidth = 2) { shapes.push({ type: 'line', x1, y1, x2, y2, stroke, strokeWidth }); },
    path(commands, fill, stroke = null, strokeWidth = 2) { shapes.push({ type: 'path', commands, fill, stroke, strokeWidth }); },
  };
}
function mast(d, state, progress) {
  const lost = state === 'destroyed', dark = ['destroyed', 'erased'].includes(state);
  d.poly([[-58, 6], [-40, -17], [38, -17], [60, 6]], '#737866');
  d.poly([[-29, -20], [-22, -127], [22, -127], [33, -20]], dark ? '#545e4c' : '#8f9978');
  for (const y of [-28, -49, -70, -91, -111]) { d.line(-19, y, 21, y - 18, '#c0b894', 3); d.line(20, y, -19, y - 18, '#4c6554', 2); }
  d.poly([[-41, -107], [-33, -136], [28, -136], [44, -110], [29, -97], [-31, -97]], '#a2aa86');
  if (!lost) {
    d.line(-36, -132, 40, -132, '#d2c49c', 5); d.line(0, -132, 0, -157, '#8da08a', 4);
    d.poly([[-17, -157], [9, -166], [32, -149], [10, -142]], dark ? '#4a5e4c' : '#9bba9c');
    d.circle(7, -153, 6, dark ? '#65735d' : state === 'isolated' ? '#d3b476' : '#b7d5a9');
  } else {
    d.line(-34, -134, 10, -111, '#c8b791', 5); d.poly([[9, -145], [32, -137], [48, -121], [23, -115]], '#6c7660');
  }
  d.rect(-35, -88, 70, 51, '#6d8068', '#c4bd93', 2); d.rect(-27, -80, 54, 32, '#263b32', '#95a480', 1);
  if (state === 'purging') { for (let i = 0; i < 4; i++) d.line(-21, -74 + i * 7, 20 - i * 4, -74 + i * 7, '#dc9f75', 2); d.rect(-28, -44, 56 * progress, 4, '#dcb88c'); }
  else if (!dark) { d.line(-20, -71, 18, -71, '#afd5ab', 2); d.line(-20, -64, 12, -64, '#b2b891', 2); d.line(-20, -57, 21, -57, '#b2b891', 2); }
  else { d.line(-20, -73, 20, -54, '#856d58', 3); d.line(20, -73, -20, -54, '#856d58', 3); }
  d.path([['M', 32, -39], ['Q', 52, -31, 53, 7]], null, '#afaa82', 5);
  if (state === 'isolated') { d.line(45, -19, 62, -19, '#1e322a', 8); d.line(45, -21, 54, -23, '#dbb37f', 3); d.rect(-12, -38, 24, 13, '#cdb182', '#455d48', 1); }
  if (state === 'reviewed') { d.circle(31, -84, 7, '#b1c896', '#233b2e', 2); d.line(27, -84, 30, -81, '#2c5540', 2); d.line(30, -81, 36, -88, '#2c5540', 2); }
  if (lost) { d.poly([[-50, -4], [-63, -31], [-41, -27]], '#9da17c'); d.line(-27, -75, 27, -49, '#b4a07e', 3); }
}
function consolePart(d, state, progress) {
  d.poly([[-53, 8], [-44, -8], [40, -8], [56, 8]], '#6c7b64'); d.rect(-18, -42, 36, 36, '#839574', '#293d30', 2);
  d.poly([[-49, -82], [-31, -102], [42, -94], [57, -54], [39, -31], [-47, -32]], '#a6ac84');
  d.poly([[-36, -78], [-25, -89], [32, -82], [40, -52], [-33, -51]], '#243b31', '#d0c59a', 2);
  for (let i = 0; i < 4; i++) d.line(-25, -77 + i * 6, 24 - i * 3, -72 + i * 6, state === 'expired' ? '#9b785d' : '#b4cca0', 2);
  if (state === 'copying') { d.rect(-27, -46, 57, 4, '#354c3b'); d.rect(-27, -46, 57 * progress, 4, '#e1c798'); }
  if (state === 'copied') { d.poly([[37, -31], [53, -31], [59, -18], [50, -9], [36, -11]], '#c3d5a4'); d.line(40, -22, 45, -17, '#3c5d42', 2); d.line(45, -17, 54, -27, '#3c5d42', 2); }
  d.path([['M', 43, -41], ['Q', 62, -38, 57, -18], ['L', 64, 6]], null, '#baa87d', 5);
  for (const x of [-30, -15, 0, 15, 30]) d.circle(x, -37, 2.5, '#d3c59a');
}
function hull(d, state) {
  const lost = state === 'destroyed';
  d.poly([[-88, -24], [-79, -78], [-48, -94], [50, -94], [83, -73], [91, -22], [61, -5], [-61, -5]], lost ? '#666d5c' : '#949b7b');
  d.poly([[-76, -74], [-45, -87], [44, -87], [70, -70], [50, -51], [-53, -52]], '#b1b797');
  d.poly([[-72, -46], [-48, -60], [46, -60], [73, -42], [63, -14], [-62, -14]], '#586e5d');
  for (const x of [-57, -33, -9, 15, 39, 63]) { d.line(x, -39, x - 7, -18, '#a5ac85', 4); d.circle(x - 6, -18, 2.5, '#d2c7a0'); }
  d.poly([[-68, -76], [-88, -72], [-95, -57], [-79, -45], [-61, -51]], '#a8af8f');
  d.rect(-123, -66, 52, 15, '#697c68', '#273f31', 2); d.rect(-126, -69, 12, 21, '#abb699', '#354c39', 2);
  d.line(-118, -61, -85, -61, '#c5c6a3', 2);
  for (const x of [-48, 48]) { d.circle(x, -9, 14, '#4d6856', '#bcc39b', 3); d.circle(x, -9, 6, '#bdc29c'); }
  d.rect(-20, -109, 40, 17, '#506a56', '#c3c59d', 2); d.line(-8, -106, -8, -96, '#899f7b', 2); d.line(8, -106, 8, -96, '#899f7b', 2);
  if (state === 'attack') { d.circle(-124, -59, 5, '#e8cb91'); d.line(-122, -72, -114, -78, '#cda875', 2); }
  if (state === 'exposed' || lost) {
    d.poly([[24, -67], [49, -79], [73, -58], [59, -29], [32, -39]], '#26392f');
    for (const x of [35, 45, 55]) d.line(x, -62, x - 2, -40, '#d0a87d', 3);
    d.path([['M', 59, -51], ['Q', 91, -23, 98, -9]], null, '#ba9472', 4);
  }
  if (lost) { d.poly([[-31, -85], [-8, -65], [6, -92], [22, -70], [27, -101], [38, -85]], '#404f41'); d.line(-63, -68, 52, -29, '#c2b68e', 3); }
}
function sensor(d, state) {
  d.rect(-8, -8, 16, 11, '#809675', '#354e39', 2);
  d.poly([[-23, -29], [-7, -40], [17, -34], [26, -14], [12, -5], [-21, -10]], state === 'disabled' ? '#5e705c' : '#b7be99');
  d.circle(-10, -23, 10, '#253e30', '#cccca4', 2);
  d.circle(-12, -23, state === 'locking' ? 7 : 5, state === 'disabled' ? '#685e4a' : state === 'locking' ? '#edb484' : '#acd6ad');
  if (state === 'disabled') { d.line(-20, -32, 7, -11, '#bda582', 3); d.line(-20, -10, -13, -18, '#2f3f30', 4); }
  else { d.line(18, -31, 25, -37, '#b8c7a0', 2); d.line(-10, -33, -10, -13, '#d5d7b0', 1); }
}
function lock(d, state) {
  d.poly([[-19, 4], [-24, -10], [-18, -37], [9, -43], [22, -32], [22, -5], [9, 6]], '#7f9476');
  d.rect(-13, -34, 19, 28, '#c1c6a2', '#304a34', 2); d.rect(-7, -35, 8, 29, '#69856d');
  for (const y of [-30, -23, -16, -9]) d.line(-11, y, 4, y, '#e0d0a3', 2);
  if (state === 'broken') { d.poly([[-14, -21], [-3, -15], [8, -22], [10, -12], [-4, -6], [-16, -12]], '#293d2f'); d.path([['M', 12, -31], ['Q', 25, -20, 25, 8]], null, '#d7b18b', 4); }
  else { d.line(-18, -5, 17, -5, '#c6d4a9', 3); d.circle(13, -28, 4, '#b6d2a4'); }
}
function post(d, state, progress) {
  d.poly([[-38, 6], [-23, -7], [25, -7], [42, 6]], '#7b8b6e'); d.rect(-15, -39, 30, 33, '#9ca789');
  d.poly([[-31, -67], [-21, -79], [22, -75], [34, -53], [25, -29], [-29, -29]], '#aab28d');
  d.rect(-22, -63, 42, 25, '#253f31', '#c1c39a', 1.5);
  for (const y of [-58, -51, -44]) d.line(-16, y, state === 'transmitted' ? 12 : 4, y, state === 'transmitted' ? '#c8d9a5' : '#93b698', 2);
  d.line(29, -52, 29, -86, '#b2bb98', 3); d.circle(29, -86, 4, '#c5c99f');
  if (state === 'working') d.rect(-23, -33, 46 * progress, 4, '#d5c18b');
}
export function relayAssetGeometry({ part = 'relay-mast', state, progress = 0 } = {}) {
  const spec = RELAY_ASSET_SPECS[part]; if (!spec) throw new Error(`Unknown relay component ${part}`);
  state ??= spec.states[0]; if (!spec.states.includes(state)) throw new Error(`Unknown relay state ${state}`);
  const d = painter(), p = Math.max(0, Math.min(1, progress));
  ({ 'relay-mast': mast, 'copy-console': consolePart, 'praetor-hull': hull, 'praetor-sensor': sensor, 'praetor-lock': lock, 'command-post': post })[part](d, state, p);
  return { id: `relay-${part}-${state}`, part, state, size: [...spec.size], bounds: [...spec.bounds], pivot: [0, 0], anchors: spec.anchors, canonIds: spec.ids, shapes: d.shapes };
}
const cache = new Map();
export function drawRelayAsset(ctx, options = {}) {
  const part = options.part || 'relay-mast', state = options.state || RELAY_ASSET_SPECS[part]?.states[0], progress = Math.round((options.progress || 0) * 32) / 32;
  const key = `${part}:${state}:${progress}`; let g = cache.get(key);
  if (!g) { g = relayAssetGeometry({ part, state, progress }); if (cache.size > 256) cache.clear(); cache.set(key, g); }
  ctx.save(); ctx.translate(options.x || 0, options.y || 0);
  ctx.scale((options.scale ?? 1) * (options.width ?? g.size[0]) / g.size[0] * (options.facing === 1 ? -1 : 1), (options.scale ?? 1) * (options.height ?? g.size[1]) / g.size[1]);
  drawProductionGeometry(ctx, g); ctx.restore(); return g;
}
export function relayAssetSVG(g) { return productionGeometrySVG(g, { title: `${g.canonIds.join(' / ')} — ${g.part} — ${g.state}` }).replace('src/production-assets.mjs', 'src/relay-assets.mjs').replace('tools/build-production-assets.mjs', 'tools/build-relay-assets.mjs'); }
