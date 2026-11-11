/** Original MI11 geometry, shared by SVG exports and the live Canvas renderer.
 * These drawings consume simulation states; they never create a testimony or consent. */
import { drawProductionGeometry, productionGeometrySVG } from './production-assets.mjs';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
export const VOICE_ASSET_SPECS = {
  'listening-station': { size: [94, 100], bounds: [-65, -121, 137, 139], ids: ['MI11', 'PL03'], states: ['idle', 'listening', 'recorded', 'lost'], anchors: { ground: [0, 0], probe: [-36, -6], reading: [5, -69] } },
  'resonance-emitter': { size: [150, 171], bounds: [-93, -199, 188, 219], ids: ['MI11', 'FA05'], states: ['transmitting', 'working', 'seized', 'preserved', 'destroyed'], anchors: { ground: [0, 0], resonator: [0, -115], coupling: [60, -26] } },
  'nesting-site': { size: [250, 76], bounds: [-142, -99, 290, 122], ids: ['MI11', 'PL03'], states: ['intact', 'disturbed', 'damaged', 'lost'], anchors: { ground: [0, 0], centre: [0, -29] } },
  'root-passage': { size: [260, 95], bounds: [-148, -119, 305, 144], ids: ['MI11', 'PL03'], states: ['unknown', 'surveyed', 'damaged', 'destroyed'], anchors: { ground: [0, 0], survey: [-94, -57] } },
  'leth-interpreter': { size: [94, 144], bounds: [-64, -162, 140, 182], ids: ['MI11', 'PN06', 'FA05'], states: ['waiting', 'listening', 'speaking', 'refusing', 'lost'], anchors: { ground: [0, 0], face: [8, -121], recorder: [28, -71], hand: [48, -76] } },
  'translation-record': { size: [106, 99], bounds: [-70, -123, 146, 145], ids: ['MI11', 'TE01'], states: ['untranslated', 'copying', 'copied', 'lost'], anchors: { ground: [0, 0], screen: [0, -70], socket: [48, -37] } },
};
export const VOICE_ASSET_NAMES = Object.keys(VOICE_ASSET_SPECS);

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
function wave(d, x, y, width, strength = 1, color = '#cbd9b5') {
  const points = Array.from({ length: 13 }, (_, i) => [x + i * width / 12, y + Math.sin(i * 2.1) * (i % 3 === 0 ? 3 : 7) * strength]);
  for (let i = 1; i < points.length; i++) d.line(...points[i - 1], ...points[i], color, 1.8);
}
function listening(d, state, progress) {
  const lost = state === 'lost';
  d.poly([[-52, 5], [-45, -10], [46, -10], [55, 5]], '#7a8a70');
  for (const x of [-33, 28]) { d.poly([[x - 4, -11], [x - 1, -78], [x + 8, -78], [x + 12, -11]], '#97aa8b'); d.circle(x + 4, -44, 4, '#c4bc92', '#2c4940'); }
  d.path([['M', -34, -57], ['L', -49, -57], ['L', -49, -12], ['L', -36, -12], ['L', -36, 8]], null, '#c4b98f', 5);
  d.poly([[-31, -112], [24, -112], [48, -93], [39, -49], [-34, -49], [-44, -72]], lost ? '#536a59' : '#9aa98a');
  d.poly([[-29, -103], [21, -103], [36, -90], [29, -61], [-28, -61]], '#253f39', '#c8c7a4', 1.5);
  if (!lost) {
    wave(d, -22, -81, 47, state === 'listening' ? .45 + progress * .55 : .18, state === 'recorded' ? '#dbe4ba' : '#9dc9bb');
    d.rect(-24, -67, 48, 2, '#466257');
    if (state === 'listening') d.rect(-24, -67, 48 * progress, 2, '#ded4a2');
    if (state === 'recorded') { d.line(30, -104, 35, -97, '#d9dfb0', 3); d.line(35, -97, 46, -111, '#d9dfb0', 3); }
  } else { d.line(-18, -101, 13, -62, '#9eaa88', 3); d.line(12, -102, -10, -64, '#738975', 2); d.poly([[42, -35], [60, -20], [43, -12]], '#8f9777'); }
  d.rect(-17, -49, 31, 7, '#b2a77e');
  d.line(-54, 10, -15, 10, '#b2bf95', 2); d.line(-46, 14, -24, 14, '#849d80', 1);
}
function emitter(d, state, progress) {
  d.poly([[-77, 2], [-61, -22], [-24, -29], [38, -25], [72, -11], [82, 4], [48, 11], [-48, 11]], '#6f8977');
  d.path([['M', -65, 4], ['Q', -82, -10, -86, -26], ['M', 63, 3], ['Q', 82, -8, 88, -27]], null, '#9aa987', 5);
  d.poly([[-33, -17], [-25, -46], [29, -46], [38, -17]], '#b5b394');
  if (state === 'seized') {
    d.poly([[-24, -22], [-18, -41], [23, -41], [30, -22]], '#233e36', '#c1c6a1', 2);
    d.line(-10, -41, -10, -29, '#c7c19a', 3); d.line(13, -41, 13, -29, '#c7c19a', 3);
    d.path([['M', 56, -23], ['Q', 66, -50, 77, -33]], null, '#b0b18a', 4); return;
  }
  if (state === 'destroyed') {
    d.poly([[-27, -39], [-38, -94], [-9, -66], [6, -109], [19, -73], [44, -93], [28, -34]], '#738676');
    d.poly([[-72, -11], [-79, -73], [-60, -58], [-49, -20]], '#a2ae96');
    d.poly([[37, -26], [75, -89], [88, -74], [59, -16]], '#8ca68f');
    d.line(-24, -61, 30, -37, '#d1c097', 3); return;
  }
  d.path([['M', -20, -40], ['Q', -34, -82, -22, -145], ['L', -11, -176], ['L', 11, -176], ['Q', 38, -114, 21, -40], ['Z']], '#a4b99e', '#244239', 3);
  d.path([['M', 7, -171], ['Q', 29, -110, 17, -47], ['L', 3, -45], ['Q', 18, -109, 7, -171], ['Z']], '#638879');
  for (const [x, h] of [[-61, 130], [-40, 162], [40, 153], [63, 117]]) {
    d.poly([[x - 5, -38], [x - 9, -h + 11], [x, -h], [x + 8, -h + 14], [x + 5, -38]], '#c0c9a7', '#2c4e41', 2);
    d.line(x, -h + 26, x, -52, '#6a9e8b', 2);
    d.line(x, -65, Math.sign(x) * 16, -85, '#a4bd9d', 2);
  }
  d.circle(0, -115, 18, '#294b40', '#d6d3ac', 3); d.circle(0, -115, 9, state === 'preserved' ? '#c2dcae' : '#8fc3b5');
  d.line(-10, -115, 10, -115, '#e4deb0', 1.7); d.line(0, -125, 0, -105, '#e4deb0', 1.7);
  d.path([['M', 18, -43], ['Q', 36, -20, 61, -26], ['L', 70, -18]], null, '#b2c19b', 5);
  if (state === 'working') { d.rect(-21, -36, 42, 5, '#334e40'); d.rect(-21, -36, 42 * progress, 5, '#e0cb94'); }
  if (state === 'preserved') { d.path([['M', -13, -176], ['Q', 0, -190, 13, -176]], null, '#cad9b4', 2); d.line(-5, -184, 5, -184, '#d7e1bd', 2); }
}
function nest(d, state) {
  const lost = state === 'lost', damaged = lost || state === 'damaged';
  d.path([['M', -133, 5], ['Q', -101, -47, -44, -41], ['Q', 11, -70, 79, -39], ['Q', 113, -32, 139, 5], ['Q', 0, 27, -133, 5], ['Z']], '#56785a', '#264839', 3);
  for (let i = 0; i < 12; i++) { const x = -125 + i * 23; d.path([['M', x, 7], ['Q', x + 13, -17 - i % 3 * 8, x + 35, -7]], null, i % 2 ? '#9caa7b' : '#7f9b6c', 3); }
  for (const [i, [x, y, radius]] of [[-75, -28, 17], [-27, -40, 20], [30, -32, 24], [85, -22, 16]].entries()) {
    if (damaged && (lost || i === 1)) {
      d.poly([[x - radius, y + 12], [x - radius + 5, y - 8], [x - 3, y + 1], [x + 6, y - 12], [x + radius, y + 14]], '#adbba0', '#315242', 1.8);
      d.poly([[x - radius + 5, y + 12], [x - 5, y + 3], [x + 12, y + 14]], '#42624e');
    } else {
      d.path([['M', x - radius, y + 11], ['Q', x - radius - 5, y - radius, x, y - radius - 13], ['Q', x + radius + 9, y - radius + 4, x + radius, y + 11], ['Q', x, y + 22, x - radius, y + 11], ['Z']], '#bac7a3', '#335e47', 2);
      d.path([['M', x - radius + 6, y + 3], ['Q', x - radius + 4, y - radius + 3, x - 1, y - radius - 5]], null, '#e0dfb7', 2);
      for (const offset of [-7, 2, 8]) d.line(x + offset, y - 7, x + offset + 4, y + 7, '#7d9d77', 1);
    }
  }
  if (state === 'disturbed') { d.path([['M', -126, -12], ['Q', -139, -36, -124, -52]], null, '#d7bd8d', 2); d.path([['M', 132, -12], ['Q', 144, -31, 130, -47]], null, '#d7bd8d', 2); }
}
function ridge(d, state) {
  const broken = state === 'destroyed';
  d.path([['M', -140, 9], ['Q', -91, -5, -69, -68], ['Q', -10, -117, 60, -77], ['Q', 103, -22, 146, 8], ['L', 115, 11], ['Q', 68, -29, 52, -48], ['Q', -3, -81, -47, -48], ['Q', -81, 4, -140, 9], ['Z']], broken ? '#6f7657' : '#7f9870', '#254936', 3);
  d.path([['M', -124, 4], ['Q', -83, -4, -60, -58], ['Q', -4, -105, 55, -66], ['Q', 94, -16, 135, 8]], null, '#b6bd8e', 4);
  if (state === 'damaged' || broken) {
    d.poly([[-12, -102], [4, -77], [-10, -62], [19, -45], [22, -64], [10, -85], [18, -103]], '#294a36');
    if (broken) d.poly([[-32, -101], [35, -97], [54, -50], [-45, -50]], '#1d3c31', '#1d3c31', 2);
  }
  if (state === 'surveyed') for (const [x, y] of [[-94, -40], [81, -47]]) { d.line(x, y + 28, x, y - 21, '#bec8a0', 3); d.poly([[x, y - 21], [x + 20, y - 17], [x + 17, y - 6], [x, y - 8]], '#d0cc98'); }
}
function leth(d, state, progress) {
  if (state === 'lost') {
    d.path([['M', -53, 6], ['Q', -37, -27, -8, -24], ['L', 26, -15], ['L', 59, -4], ['L', 47, 9], ['Z']], '#7c9587', '#28493f', 3);
    d.poly([[22, -15], [31, -32], [52, -29], [65, -10], [50, -3]], '#aab59e');
    d.line(-56, 10, 61, 10, '#b7b89a', 2); d.rect(-13, -21, 20, 13, '#3d5b50', '#a9b99b', 1); return;
  }
  const stride = 0;
  const arm = state === 'speaking' ? -15 : state === 'listening' ? 7 : state === 'refusing' ? -26 : 0;
  d.poly([[-24, -59], [-10, -59], [-13 + stride, -28], [-21 + stride, -5], [-14 + stride, 1], [-36 + stride, 1], [-30 + stride, -30]], '#749b8a', '#294c41', 2);
  d.poly([[5, -61], [22, -60], [31 - stride, -31], [26 - stride, -3], [36 - stride, 2], [13 - stride, 2], [15 - stride, -28]], '#b6bea2', '#2d4e42', 2);
  d.path([['M', -31, -98], ['Q', -42, -63, -46, -29], ['L', -19, -17], ['L', -3, -44], ['L', 21, -27], ['L', 35, -34], ['Q', 35, -79, 21, -99], ['Z']], '#758e81', '#25473b', 2.5);
  d.path([['M', -28, -91], ['L', -12, -33], ['L', -24, -23], ['L', -37, -33], ['Z']], '#9baa8e');
  d.poly([[-28, -102], [-8, -117], [22, -107], [27, -71], [6, -57], [-18, -69]], '#b9c2a7', '#294b3e', 2.5);
  for (const y of [-95, -83, -71]) d.path([['M', -21, y], ['Q', 3, y + 11, 24, y - 1]], null, '#799b82', 3);
  d.path([['M', -9, -114], ['Q', -18, -130, -5, -148], ['L', 18, -154], ['Q', 30, -148, 35, -132], ['Q', 34, -119, 21, -112], ['L', 8, -105], ['Z']], '#cbd0b3', '#2a4c40', 2.5);
  d.path([['M', 8, -145], ['Q', 25, -147, 31, -133], ['Q', 26, -123, 15, -119], ['Q', 4, -132, 8, -145], ['Z']], '#7b9f8c', '#547b68', 1);
  for (const [x, y] of [[14, -136], [24, -132]]) {
    d.path([['M', x - 4, y], ['Q', x, y - 4, x + 5, y], ['Q', x, y + 4, x - 4, y], ['Z']], '#d9c997', '#35584a', 1);
    d.line(x, y - 2, x, y + 2, '#284e40', 1.5);
  }
  d.path([['M', 19, -124], ['Q', 23, -119, 30, -121], ['M', 17, -122], ['Q', 17, -116, 24, -114]], null, '#476b58', 2);
  for (const [x, y] of [[-7, -144], [-12, -137], [-13, -129]]) d.path([['M', x + 3, y], ['Q', x - 13, y - 4, x - 17, y + 6], ['Q', x - 6, y + 4, x, y + 8]], '#a8bd9e', '#436d54', 1.5);
  d.poly([[-27, -100], [-38, -89], [-40, -62], [-25, -48], [-18, -55], [-30, -72], [-23, -87]], '#a7b99c');
  d.poly([[23, -101], [33, -93], [35, -80 + arm], [52, -73 + arm], [47, -62 + arm], [25, -72 + arm], [17, -91]], '#b9c4a5');
  d.line(52, -91 + arm, 49, -5, '#c4b892', 3); d.circle(51, -90 + arm, 7, '#426b58', '#c8ca9f', 2);
  if (state === 'refusing') { d.poly([[44, -101], [45, -119], [52, -123], [58, -117], [56, -103]], '#d0cfab', '#476b55', 1.5); for (const x of [48, 52, 56]) d.line(x, -116, x - 1, -108, '#6d9272', 1); }
  d.rect(-16, -66, 28, 20, '#365b4b', '#c6c59d', 1.5); wave(d, -11, -56, 18, state === 'speaking' ? .55 : .12);
  d.line(-3, -95, -2, -68, '#c4ae80', 3); d.circle(-3, -100, 5, '#42695a', '#bfb98d', 1.5);
}
function translation(d, state, progress) {
  const lost = state === 'lost';
  d.poly([[-61, 6], [-46, -12], [48, -12], [65, 6]], '#7b8d72');
  d.rect(-18, -38, 36, 35, '#a2ad8d', '#294b3d', 2);
  d.poly([[-48, -104], [34, -109], [56, -86], [42, -34], [-49, -34], [-59, -70]], lost ? '#687960' : '#a7af8b', '#28483b', 3);
  d.poly([[-41, -94], [29, -98], [41, -83], [32, -48], [-41, -48]], '#263f38', '#c3c39e', 2);
  if (lost) { d.poly([[-31, -92], [-9, -69], [-18, -49], [3, -52], [13, -78], [28, -96]], '#819378'); d.line(-39, -72, 33, -60, '#b7b78f', 2); return; }
  wave(d, -32, -82, 57, .75, '#9cc8b8');
  d.line(-30, -66, -9, -66, '#c9bd91', 2); d.line(-4, -66, 24, -66, '#c9bd91', 2);
  d.line(-30, -58, 11, -58, '#c9bd91', 2);
  if (state === 'copying') { d.rect(-34, -43, 65, 3, '#344f40'); d.rect(-34, -43, 65 * progress, 3, '#e2d4a3'); }
  if (state === 'copied') { d.poly([[38, -27], [54, -27], [62, -18], [53, -9], [38, -9]], '#c5d1a7'); d.line(42, -19, 47, -14, '#3d624a', 2); d.line(47, -14, 55, -23, '#3d624a', 2); }
}

export function voiceAssetGeometry({ part = 'listening-station', state, progress = 0 } = {}) {
  const spec = VOICE_ASSET_SPECS[part]; if (!spec) throw new Error(`Unknown voice component: ${part}`);
  state ??= spec.states[0]; if (!spec.states.includes(state)) throw new Error(`Unknown ${part} state: ${state}`);
  const d = painter(), p = clamp(progress, 0, 1);
  if (part === 'listening-station') listening(d, state, p);
  else if (part === 'resonance-emitter') emitter(d, state, p);
  else if (part === 'nesting-site') nest(d, state);
  else if (part === 'root-passage') ridge(d, state);
  else if (part === 'leth-interpreter') leth(d, state, p);
  else translation(d, state, p);
  return { id: `voice-${part}-${state}`, part, state, size: [...spec.size], bounds: [...spec.bounds], pivot: [0, 0], anchors: spec.anchors, canonIds: spec.ids, shapes: d.shapes };
}
const cache = new Map();
export function drawVoiceAsset(ctx, options = {}) {
  const part = options.part || 'listening-station', state = options.state || VOICE_ASSET_SPECS[part]?.states[0];
  const progress = Math.round(clamp(options.progress || 0, 0, 1) * 32) / 32, key = `${part}:${state}:${progress}`;
  let geometry = cache.get(key);
  if (!geometry) { geometry = voiceAssetGeometry({ part, state, progress }); if (cache.size >= 256) cache.clear(); cache.set(key, geometry); }
  ctx.save(); ctx.translate(options.x || 0, options.y || 0);
  ctx.scale((options.scale ?? 1) * (options.width ?? geometry.size[0]) / geometry.size[0] * (options.facing === -1 ? -1 : 1), (options.scale ?? 1) * (options.height ?? geometry.size[1]) / geometry.size[1]);
  drawProductionGeometry(ctx, geometry); ctx.restore(); return geometry;
}
export function voiceAssetSVG(geometry) {
  return productionGeometrySVG(geometry, { title: `${geometry.canonIds.join(' / ')} — ${geometry.part} — ${geometry.state}` })
    .replace('src/production-assets.mjs', 'src/voice-assets.mjs')
    .replace('tools/build-production-assets.mjs', 'tools/build-voice-assets.mjs');
}
