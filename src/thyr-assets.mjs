/** Original Thyr vector pieces. Canvas and SVG share these exact shapes.
 * Coordinates are drawing coordinates; contacts, damage and people belong to
 * simulation.mjs. No artwork adds a survivor, footprint or collision. */
import { drawProductionGeometry, productionGeometrySVG } from './production-assets.mjs';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const THYR_ASSET_SPECS = {
  column: { size: [92, 470], bounds: [-195, -510, 390, 530], ids: ['FL07'], states: ['normal', 'damaged', 'destroyed'], anchors: { ground: [0, 0], home: [80, -265], canopy: [0, -440] } },
  root: { size: [340, 28], bounds: [-177, -34, 354, 43], ids: ['FL07'], states: ['normal', 'damaged', 'destroyed'], anchors: { contact: [0, -28], ground: [0, 0] } },
  'suspended-home': { size: [160, 110], bounds: [-92, -165, 184, 190], ids: ['PL03'], states: ['normal', 'damaged', 'destroyed'], anchors: { suspension: [-55, -160], threshold: [45, 0] } },
  'longuedorse-adult': { size: [136, 94], bounds: [-84, -112, 180, 120], ids: ['FU07'], states: ['waiting', 'moving', 'arrived', 'diverted', 'dead'], anchors: { ground: [0, 0], head: [63, -61] } },
  'longuedorse-young': { size: [86, 64], bounds: [-56, -76, 118, 83], ids: ['FU07'], states: ['waiting', 'moving', 'arrived', 'diverted', 'dead'], anchors: { ground: [0, 0], head: [40, -42] } },
  'fan-colony': { size: [112, 78], bounds: [-85, -150, 175, 172], ids: ['FU08'], states: ['settled', 'dispersed', 'lost'], anchors: { perch: [0, 0] } },
  'breathing-vine': { size: [120, 145], bounds: [-69, -157, 145, 175], ids: ['FL08'], states: ['normal', 'wilted', 'burnt'], anchors: { crown: [0, -145], ground: [0, 0] } },
  'echo-grass': { size: [90, 78], bounds: [-62, -85, 124, 95], ids: ['FL09'], states: ['calm', 'moving'], anchors: { ground: [0, 0] } },
  'migration-barrier': { size: [170, 112], bounds: [-185, -255, 292, 274], ids: ['MI09'], states: ['closed', 'working', 'open', 'broken'], anchors: { hinge: [-76, -76], control: [-88, -46], ground: [0, 0] } },
  'route-map': { size: [95, 110], bounds: [-59, -123, 126, 140], ids: ['MI09'], states: ['concealed', 'surveyed'], anchors: { inspect: [0, -62], ground: [0, 0] } },
  'route-marker': { size: [50, 90], bounds: [-34, -99, 81, 112], ids: ['MI09'], states: ['imperial', 'local'], anchors: { ground: [0, 0] } },
};
export const THYR_ASSET_NAMES = Object.keys(THYR_ASSET_SPECS);

function painter() {
  const shapes = [];
  return { shapes,
    poly(points, fill, stroke = '#142f31', strokeWidth = 1.5) { shapes.push({ type: 'polygon', points, fill, stroke, strokeWidth }); },
    line(x1, y1, x2, y2, stroke, strokeWidth = 1.5) { shapes.push({ type: 'line', x1, y1, x2, y2, stroke, strokeWidth }); },
    circle(x, y, r, fill, stroke = null, strokeWidth = 1) { shapes.push({ type: 'circle', x, y, r, fill, stroke, strokeWidth }); },
    rect(x, y, w, h, fill, stroke = null, strokeWidth = 1) { shapes.push({ type: 'rect', x, y, w, h, fill, stroke, strokeWidth }); },
    path(commands, fill, stroke = null, strokeWidth = 1.5) { shapes.push({ type: 'path', commands, fill, stroke, strokeWidth }); },
  };
}

function column(d, state) {
  const broken = state === 'destroyed', top = broken ? -135 : -468;
  // The great hollow column is a support, not a conventional tree trunk.
  d.poly([[-48, 0], [-46, -33], [-45, -96], [-43, top + 20], [-23, top], [24, top + 5], [43, top + 27], [47, -96], [49, -34], [51, 0], [37, -9], [-35, -9]], '#476451', '#193b37', 3);
  for (const [x, side] of [[-35, -1], [-13, -1], [17, 1], [36, 1]]) {
    d.path([['M', x + side * 7, -2], ['Q', x + side * 5, -27, x, -121], ['L', x * .66, top + 32]], null, side < 0 ? '#8c9c66' : '#6e8258', side < 0 ? 6 : 4);
  }
  d.path([['M', -20, -41], ['Q', -33, -160, -15, top + 78], ['Q', 0, top + 43, 19, top + 81], ['Q', 37, -159, 24, -42], ['Z']], '#1a3b35', '#829667', 2);
  if (!broken) {
    for (let row = 0; row < 4; row++) {
      const y = -460 + row * 49, side = row % 2 ? 1 : -1;
      d.path([['M', side * 21, y + 40], ['Q', side * 77, y + 24, side * 157, y - 10]], null, '#395f4a', 16 - row * 2);
      for (let leaf = 0; leaf < 3; leaf++) {
        const x = side * (64 + leaf * 37), ly = y + 11 - leaf * 8;
        d.path([['M', x - 38, ly], ['Q', x, ly - 40, x + 47, ly - 7], ['Q', x + 6, ly + 17, x - 38, ly], ['Z']], leaf % 2 ? '#709663' : '#567e59', '#2c5a43', 1.3);
        d.line(x - 29, ly - 1, x + 30, ly - 7, '#a4b67b', 1.3);
      }
    }
    for (let i = 0; i < 7; i++) {
      const y = -346 + i * 39, x = 23 + Math.sin(i * 2) * 5;
      d.circle(x, y, 3 + i % 2, '#c3c98d', '#5a8058', 1);
    }
    d.path([['M', -28, -324], ['Q', -52, -271, -29, -212], ['Q', -11, -187, -25, -142]], null, '#a4b783', 2);
  } else {
    d.poly([[-44, -117], [-33, -160], [-17, -126], [3, -153], [15, -121], [40, -145], [45, -114]], '#b6ae77', '#3d5c41', 2);
    d.poly([[83, -5], [124, -37], [162, -30], [180, 3]], '#546b4c', '#2a4c3d', 2);
  }
  if (state === 'damaged') {
    d.poly([[-44, -230], [-9, -209], [-30, -186], [-2, -170], [-28, -157], [-47, -185]], '#c1a879', '#344f3c', 2);
    d.line(-18, -201, -22, -178, '#233e34', 4);
  }
}

function root(d, state) {
  if (state === 'destroyed') {
    d.poly([[-170, 0], [-112, -10], [-43, -3], [9, -12], [89, -4], [170, 1], [160, 6], [-168, 6]], '#405b45', '#274535', 2);
    d.line(-72, -3, -31, -2, '#a4a16f', 4); d.line(9, -10, 44, -4, '#a4a16f', 3); return;
  }
  d.poly([[-170, 0], [-135, -17], [-75, -25], [0, -28], [73, -25], [134, -17], [170, 0], [106, 5], [-105, 5]], '#6f8758', '#2e513c', 2);
  d.path([['M', -164, -1], ['Q', -81, -29, 0, -27], ['Q', 81, -29, 164, -1]], null, '#bfbe87', 2);
  for (let i = 0; i < 9; i++) { const x = -129 + i * 32; d.line(x, -7, x + 13, -16 - (4 - Math.abs(i - 4)), '#8fa06e', 1.5); }
  if (state === 'damaged') d.poly([[-15, -27], [-3, -15], [-12, -7], [8, -4], [13, -17], [1, -28]], '#334c37', '#b5ab79', 1.2);
}

function home(d, state) {
  if (state === 'destroyed') {
    d.poly([[-78, -4], [-34, -39], [23, -18], [75, -5], [70, 10], [-75, 10]], '#6b6b4d');
    for (let i = 0; i < 5; i++) d.line(-60 + i * 28, -4 - (i % 2) * 12, -28 + i * 24, 4, '#b8ad79', 4);
    return;
  }
  for (const x of [-58, 56]) { d.line(x, -160, x + (x < 0 ? -12 : 12), -6, '#203d37', 4); d.line(x + 2, -160, x + 2 + (x < 0 ? -12 : 12), -6, '#a9b58a', 1.2); }
  d.poly([[-75, -68], [-28, -104], [43, -93], [77, -57], [65, -1], [-66, -1]], '#887d58', '#263f35', 2.5);
  d.poly([[-86, -67], [-29, -115], [42, -104], [87, -58], [38, -78], [-27, -88]], '#587a58', '#294e3b', 2);
  for (let i = 0; i < 6; i++) d.line(-62 + i * 24, -61 + Math.sin(i) * 4, -57 + i * 23, -7, '#acaa79', 2);
  d.poly([[28, -50], [53, -46], [53, -3], [28, -3]], '#283f36', '#c2b88a', 2);
  d.poly([[-48, -51], [-16, -57], [-16, -29], [-48, -25]], '#304e42', '#c2b88a', 2);
  d.line(-33, -54, -32, -27, '#938d66', 2);
  d.poly([[-83, -4], [82, -4], [77, 5], [-80, 5]], '#b0a577', '#2b4338', 2);
  if (state === 'damaged') d.poly([[-10, -74], [14, -60], [-2, -49], [18, -34], [-8, -23]], '#273e33', '#c1ac7b', 2);
}

function longuedorse(d, young, state, progress) {
  const s = young ? .65 : 1;
  const shape = painter(), phase = state === 'moving' ? progress * Math.PI * 2 : 0;
  if (state === 'dead') {
    shape.path([['M', -68, -14], ['Q', -74, -48, -23, -51], ['Q', 34, -58, 68, -30], ['L', 77, -9], ['L', -62, -2], ['Z']], '#596a59', '#244438', 2.3);
    for (let i = 0; i < 4; i++) shape.line(-42 + i * 25, -16, -33 + i * 27, -5, '#344d40', 7);
    shape.line(61, -27, 66, -24, '#192e2b', 2);
  } else {
    // Four visible appendages; the rear pair is deliberately darker.
    for (const [i, x] of [-43, 28, -34, 42].entries()) {
      const step = Math.sin(phase + (i % 2) * Math.PI) * (state === 'moving' ? 10 : 0), near = i > 1;
      shape.path([['M', x, -40], ['L', x - 4 + step, -21], ['L', x + step * 1.3, -3], ['L', x + 12 + step * 1.3, -2]], null, near ? '#b8b589' : '#64795c', near ? 9 : 7);
      shape.line(x - 3 + step * 1.3, -1, x + 14 + step * 1.3, -1, '#344e3f', 4);
    }
    shape.path([['M', -64, -44], ['Q', -75, -76, -45, -88], ['Q', -12, -109, 27, -90], ['Q', 48, -80, 51, -57], ['L', 28, -35], ['Q', -16, -28, -56, -37], ['Z']], '#91956f', '#284c3c', 2.5);
    shape.path([['M', -53, -77], ['Q', -11, -106, 25, -80], ['L', 35, -65], ['Q', -13, -82, -55, -58]], '#6e805b', '#b7bb87', 1.5);
    for (let i = 0; i < 5; i++) shape.line(-43 + i * 14, -81 - Math.sin(i / 4 * Math.PI) * 7, -48 + i * 17, -56, '#a9b47c', 2.2);
    shape.path([['M', 28, -61], ['Q', 44, -84, 69, -74], ['L', 85, -57], ['L', 81, -43], ['L', 60, -39], ['L', 40, -48], ['Z']], '#b8b38b', '#2b4e3e', 2.2);
    shape.poly([[44, -71], [37, -95], [55, -80], [67, -78], [65, -92], [78, -68]], '#97ac7b', '#365c42', 1.5);
    shape.circle(72, -62, 2.2, '#20372e'); shape.line(73, -45, 82, -48, '#567052', 1.2);
    shape.path([['M', -62, -57], ['Q', -83, -65, -77, -83]], null, '#738460', 5);
    // Culture spores are visible on the coat, not a prepainted crop outcome.
    for (let i = 0; i < 6; i++) shape.circle(-38 + i * 12, -60 + (i % 2) * 10, young ? 1.8 : 2.4, '#d0cda0');
  }
  for (const item of shape.shapes) {
    const out = { ...item };
    if (out.points) out.points = out.points.map(p => p.map(v => v * s));
    if (out.commands) out.commands = out.commands.map(([op, ...values]) => [op, ...values.map(v => v * s)]);
    for (const key of ['x', 'y', 'r', 'x1', 'x2', 'y1', 'y2', 'strokeWidth']) if (typeof out[key] === 'number') out[key] *= s;
    d.shapes.push(out);
  }
}

function fan(d, state, progress) {
  if (state === 'lost') { d.line(-28, -5, 23, 0, '#4b6a4f', 4); d.path([['M', -12, -4], ['Q', -33, -26, -47, -21]], null, '#647a56', 3); return; }
  const dispersed = state === 'dispersed';
  for (let n = 0; n < 3; n++) {
    const x = (n - 1) * 32 + (dispersed ? Math.sin(progress * 6.28 + n * 2) * 17 : 0), y = -8 - (n % 2) * 18 - (dispersed ? 28 + n * 8 : 0);
    const spread = dispersed ? 22 : 29;
    d.path([['M', x, y], ['Q', x - spread - 8, y - 18, x - spread, y - 48], ['Q', x, y - 68, x + spread, y - 48], ['Q', x + spread + 8, y - 18, x, y], ['Z']], n % 2 ? '#7f9b83' : '#93ad86', '#254c40', 1.7);
    for (let k = -2; k <= 2; k++) d.line(x, y - 3, x + k * 10, y - 48 - (2 - Math.abs(k)) * 5, '#d7d4a0', 1.1);
    d.circle(x, y - 8, 4, '#3e6653', '#c1cb94', 1);
  }
}

function vine(d, state, progress) {
  const burnt = state === 'burnt', wilted = state === 'wilted', tone = burnt ? '#405146' : '#77996c';
  d.path([['M', -28, 2], ['Q', 30, -44, 2, -91], ['Q', -14, -125, 15, -149]], null, burnt ? '#30483c' : '#b8bd88', 4);
  for (let i = 0; i < 4; i++) {
    const y = -22 - i * 31, side = i % 2 ? 1 : -1, size = 27 + Math.sin(progress * 6.28) * 2;
    d.path([['M', 0, y], ['Q', side * size, y - (wilted ? -17 : 30), side * 57, y - (wilted ? -9 : 16)], ['Q', side * 46, y + 20, 0, y], ['Z']], tone, burnt ? '#273f34' : '#b7c58d', 1.2);
    if (!burnt) d.line(3, y + 1, side * 45, y - (wilted ? -12 : 9), '#ced1a1', 1);
  }
}

function grass(d, state, progress) {
  const sway = state === 'moving' ? Math.sin(progress * Math.PI * 2) * 9 : 0;
  for (let i = 0; i < 7; i++) {
    const x = -37 + i * 12, top = -35 - (i % 3) * 17;
    d.path([['M', x, 0], ['Q', x - 7 + sway, top * .58, x + sway + (i - 3) * 3, top]], null, i % 2 ? '#9bb77c' : '#729a67', 3);
    d.circle(x + sway + (i - 3) * 3, top, 4.3, '#2a5041', '#b7c889', 1.8);
    d.line(x - 2, -17, x + 3, -18, '#ccd2a0', 1);
  }
}

function barrier(d, state, progress) {
  d.poly([[-94, 4], [-85, -100], [-70, -104], [-62, 4]], '#7d8a6d', '#294437', 2);
  d.rect(-96, -62, 32, 31, '#294a3f', '#b8bb8a', 2); d.circle(-80, -47, 9, '#749071', '#cad1a0', 1.5);
  if (state === 'broken') {
    d.poly([[-70, -71], [-9, -43], [-6, -29], [-73, -60]], '#a7ad7c');
    d.poly([[7, -5], [73, -28], [81, -16], [17, 3]], '#909b6c');
    return;
  }
  const open = state === 'open' ? 1 : state === 'working' ? clamp(progress, 0, 1) : 0;
  const a = open * -Math.PI * .69, hinge = [-76, -77], rotate = ([x, y]) => [hinge[0] + x * Math.cos(a) - y * Math.sin(a), hinge[1] + x * Math.sin(a) + y * Math.cos(a)];
  d.poly([[0, -7], [167, -7], [167, 7], [0, 7]].map(rotate), '#c4bd8a', '#304d3b', 2);
  for (let i = 0; i < 8; i++) d.poly([[i * 20 + 4, -6], [i * 20 + 12, -6], [i * 20 + 20, 6], [i * 20 + 12, 6]].map(rotate), '#617b58', null);
  d.circle(...hinge, 11, '#365745', '#b3c18a', 2); d.circle(...hinge, 4, '#d2c494');
  d.line(90, 2, 90, -65, '#82946f', 6); d.line(82, -67, 99, -67, '#c2c393', 4);
}

function map(d, state) {
  d.line(-33, 3, -28, -77, '#73856a', 6); d.line(38, 3, 31, -77, '#73856a', 6);
  d.poly([[-50, -111], [44, -105], [48, -35], [-49, -41]], '#3d5c4c', '#b8bf91', 2.5);
  d.poly([[-43, -103], [36, -98], [39, -44], [-41, -49]], '#a8b28a', '#576d52', 1);
  d.path([['M', -36, -83], ['Q', -9, -105, 4, -68], ['Q', 12, -49, 32, -56]], null, '#5d8a76', 3);
  d.line(-36, -60, 31, -84, '#725a45', 4);
  if (state === 'surveyed') {
    d.path([['M', -34, -91], ['Q', -13, -65, 2, -62], ['Q', 18, -55, 32, -86]], null, '#e7d4a2', 2.3);
    for (const [x, y] of [[-20, -72], [18, -75]]) { d.poly([[x - 5, y], [x, y - 6], [x + 6, y], [x + 5, y + 5], [x - 5, y + 5]], '#335c46', '#e3cf9a', 1); }
    d.circle(28, -42, 8, '#789875', '#d9d2a0', 1.6);
  } else { d.rect(-47, -111, 24, 14, '#5e6e4e', '#c0ba86', 1); d.line(-43, -105, -27, -104, '#d8cea0', 1.2); }
}

function marker(d, state) {
  d.poly([[-7, 4], [-7, -85], [2, -93], [10, -85], [8, 4]], '#7d8963', '#294837', 2);
  if (state === 'local') {
    d.poly([[-27, -71], [14, -74], [35, -62], [14, -49], [-27, -52]], '#91ae80', '#274d3b', 2);
    d.path([['M', -19, -61], ['Q', -4, -76, 11, -61], ['Q', 19, -50, 27, -61]], null, '#e1dcaa', 2);
    d.line(-12, -44, -16, -24, '#c3be8c', 2); d.line(-3, -44, -2, -19, '#9eb27c', 3);
  } else {
    d.poly([[-27, -74], [17, -74], [35, -61], [17, -49], [-27, -49]], '#c3b88a', '#354b39', 2);
    d.line(-17, -62, 19, -62, '#546645', 5); d.line(11, -69, 20, -62, '#546645', 3); d.line(11, -55, 20, -62, '#546645', 3);
  }
}

export function thyrAssetGeometry({ part = 'column', state, progress = 0 } = {}) {
  const spec = THYR_ASSET_SPECS[part];
  if (!spec) throw new RangeError(`Unknown Thyr asset: ${part}`);
  state ??= spec.states[0];
  if (!spec.states.includes(state)) throw new RangeError(`Unknown ${part} state: ${state}`);
  const d = painter();
  if (part === 'column') column(d, state);
  else if (part === 'root') root(d, state);
  else if (part === 'suspended-home') home(d, state);
  else if (part.startsWith('longuedorse-')) longuedorse(d, part.endsWith('young'), state, progress);
  else if (part === 'fan-colony') fan(d, state, progress);
  else if (part === 'breathing-vine') vine(d, state, progress);
  else if (part === 'echo-grass') grass(d, state, progress);
  else if (part === 'migration-barrier') barrier(d, state, progress);
  else if (part === 'route-map') map(d, state);
  else marker(d, state);
  return { id: `thyr-${part}-${state}`, part, state, size: [...spec.size], bounds: [...spec.bounds], pivot: [0, 0], anchors: spec.anchors, canonIds: spec.ids, shapes: d.shapes };
}

const cache = new Map();
export function drawThyrAsset(ctx, options = {}) {
  const part = options.part || 'column', state = options.state || THYR_ASSET_SPECS[part]?.states[0];
  const progress = Math.round(clamp(options.progress || 0, 0, 1) * 32) / 32, key = `${part}:${state}:${progress}`;
  let geometry = cache.get(key);
  if (!geometry) { geometry = thyrAssetGeometry({ part, state, progress }); if (cache.size >= 512) cache.clear(); cache.set(key, geometry); }
  ctx.save(); ctx.translate(options.x || 0, options.y || 0);
  ctx.scale((options.scale ?? 1) * (options.width ?? geometry.size[0]) / geometry.size[0] * (options.facing === -1 ? -1 : 1), (options.scale ?? 1) * (options.height ?? geometry.size[1]) / geometry.size[1]);
  drawProductionGeometry(ctx, geometry); ctx.restore(); return geometry;
}

export function thyrAssetSVG(geometry) {
  return productionGeometrySVG(geometry, { title: `${geometry.canonIds.join(' / ')} — ${geometry.part} — ${geometry.state}` })
    .replace('src/production-assets.mjs', 'src/thyr-assets.mjs')
    .replace('tools/build-production-assets.mjs', 'tools/build-thyr-assets.mjs');
}
