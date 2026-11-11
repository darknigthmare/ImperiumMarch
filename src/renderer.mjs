import { terrainAt, radiatorBounds } from './simulation.mjs';
import { WALKERS } from './content.mjs';

const W = 1600, H = 900;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const hash = (n) => { const x = Math.sin(n * 127.13 + 311.7) * 43758.5453; return x - Math.floor(x); };
const TAU = Math.PI * 2;

function poly(c, pts, fill, stroke, lw = 1) {
  c.beginPath(); c.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) c.lineTo(...pts[i]); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
function line(c, x1, y1, x2, y2, color, width = 1) {
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke();
}
function circle(c, x, y, r, fill, stroke, width = 1) {
  c.beginPath(); c.arc(x, y, r, 0, TAU); if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function label(c, text, x, y, size = 12, color = '#d5d1bc', align = 'left') {
  c.font = `500 ${size}px "IBM Plex Mono", "Courier New", monospace`; c.textAlign = align; c.fillStyle = color; c.fillText(text, x, y);
}
function glow(c, x, y, radius, color) {
  const g = c.createRadialGradient(x, y, 0, x, y, radius); g.addColorStop(0, color); g.addColorStop(1, 'transparent');
  c.fillStyle = g; c.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}
function plate(c, pts, top = '#81847a', bottom = '#363e3d') {
  const ys = pts.map(p => p[1]); const g = c.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
  g.addColorStop(0, top); g.addColorStop(1, bottom); poly(c, pts, g, '#151e20', 2);
  line(c, pts[0][0] + 1, pts[0][1] + 2, pts[1][0], pts[1][1] + 2, '#b4b4a0', 1);
}
function bolt(c, x, y, r = 2.4) {
  circle(c, x, y, r + 1, '#1b2628'); circle(c, x, y - 0.4, r, '#a5a591'); line(c, x - r / 2, y, x + r / 2, y, '#414d4b', 0.8);
}
function strut(c, ax, ay, bx, by, width, back = false) {
  const angle = Math.atan2(by - ay, bx - ax), len = Math.hypot(bx - ax, by - ay);
  c.save(); c.translate(ax, ay); c.rotate(angle);
  plate(c, [[0, -width / 2], [len - 7, -width / 2], [len, -width / 3], [len, width / 3], [len - 7, width / 2], [0, width / 2]], back ? '#576363' : '#8c8e7a', back ? '#283738' : '#3b4848');
  c.fillStyle = '#26383b'; c.fillRect(9, -width / 2 + 4, Math.max(5, len * 0.48), width - 8);
  line(c, 14, -width / 2 + 4, len * 0.66, -width / 2 + 4, back ? '#69716c' : '#c8bea0', 1.5);
  c.fillStyle = '#ba8d52'; c.fillRect(len * 0.45, -width / 2, 6, width);
  for (let k = 0; k < 3; k++) line(c, len * 0.65 + k * 6, -width / 3, len * 0.65 + k * 6, width / 3, '#202d2e', 2);
  bolt(c, 7, 0, 2); bolt(c, len - 8, 0, 2);
  c.restore();
}

function drawLeg(c, p, walker, f, back) {
  const hx = p.x + f.homeOffset * (walker.legs === 2 ? 0.37 : 0.68);
  const hy = p.y + p.height / 2 - 9;
  const dx = f.x - hx, dy = f.y - hy;
  const upper = walker.height * 0.62, lower = walker.height * 0.64;
  const reach = Math.max(2, Math.min(Math.hypot(dx, dy), upper + lower - 2));
  const a = Math.acos(clamp((upper * upper + reach * reach - lower * lower) / (2 * upper * reach), -1, 1));
  const base = Math.atan2(dy, dx);
  const bend = walker.legs === 2 ? -1 : f.homeOffset < 0 ? 1 : -1;
  const kx = hx + Math.cos(base + a * bend) * upper;
  const ky = hy + Math.sin(base + a * bend) * upper;
  const thickness = walker.legs === 2 ? 23 : 18;
  line(c, hx + 9, hy, kx + 10, ky, '#152123', thickness + 7);
  line(c, kx + 10, ky, f.x + 8, f.y - 6, '#152123', thickness + 5);
  strut(c, hx, hy, kx, ky, thickness, back);
  strut(c, kx, ky, f.x, f.y - 8, thickness * 0.7, back);
  // Two polished hydraulic rams run beside the load-bearing links.
  const ox = back ? -8 : 9;
  line(c, hx + ox, hy + 12, mix(kx, f.x, 0.3) + ox, mix(ky, f.y, 0.3), '#101a1d', 8);
  line(c, hx + ox, hy + 12, kx + ox, ky + 9, back ? '#667377' : '#c6c9bd', 4);
  line(c, kx + ox, ky + 9, mix(kx, f.x, 0.3) + ox, mix(ky, f.y, 0.3), '#48595b', 6);
  circle(c, kx, ky, thickness * 0.65, '#222f32', '#85918a', 2);
  circle(c, kx, ky, thickness * 0.34, '#a39e7f', '#18262b', 2);
  line(c, kx - 5, ky, kx + 5, ky, '#293c40', 2);
  circle(c, hx, hy, thickness * 0.62, '#18282b', '#75857f', 2);
  const fx = f.x, fy = f.y;
  const fw = walker.legs === 2 ? 27 : 22;
  plate(c, [[fx - fw, fy - 13], [fx + fw - 5, fy - 13], [fx + fw + 5, fy - 5], [fx + fw + 4, fy + 2], [fx - fw - 5, fy + 2], [fx - fw - 5, fy - 5]], back ? '#526263' : '#999a85', '#27393c');
  line(c, fx - fw - 3, fy, fx + fw + 3, fy, '#0f1e22', 4);
  for (let i = -1; i <= 1; i++) line(c, fx + i * 11, fy - 10, fx + i * 11 + 3, fy - 3, '#d4bd87', 2);
  if (f.health < 45) {
    circle(c, kx + 3, ky - 3, 2.5, '#f18b56');
    line(c, kx - 7, ky - 10, kx + 8, ky + 7, '#171b1c', 2);
  }
}

function drawWalker(c, p, walker, t, options = {}) {
  const backFeet = p.feet.filter(f => f.side === 'back');
  const frontFeet = p.feet.filter(f => f.side !== 'back');
  c.save();
  for (const f of backFeet) drawLeg(c, p, walker, f, true);
  const x = p.x, y = p.y;
  const facing = p.facing || 1;
  c.save(); c.translate(x, y); c.scale(facing, 1);
  const shellLabel = (text, lx, ly, size, color) => {
    c.save(); c.translate(lx, ly); c.scale(facing, 1); label(c, text, 0, 0, size, color); c.restore();
  };
  // Exposed cradle and suspension below the armored shell.
  plate(c, [[-p.width * 0.45, 12], [p.width * 0.42, 12], [p.width * 0.34, 40], [-p.width * 0.32, 40]], '#4e6060', '#26393d');
  for (let i = 0; i < walker.legs / 2; i++) circle(c, -p.width * 0.3 + i * p.width * 0.6 / Math.max(1, walker.legs / 2 - 1), 28, 10, '#1e3034', '#697d77', 2);
  c.save(); c.scale(p.width / (walker.legs === 2 ? 126 : walker.legs === 4 ? 172 : 188), 1);
  if (walker.legs === 2) {
    plate(c, [[-65, -24], [-44, -43], [27, -41], [58, -22], [67, 10], [43, 31], [-42, 28], [-64, 9]], '#999b85', '#4c5b56');
    plate(c, [[-41, -36], [21, -35], [30, -14], [-42, -12]], '#b1ae91', '#6f796b');
    plate(c, [[35, -28], [57, -19], [63, 3], [28, 7], [24, -11]], '#798c84', '#293f42');
    poly(c, [[29, -23], [51, -17], [54, -7], [30, -6]], '#f1c180', '#1e3339', 3);
    line(c, 39, -19, 41, -7, '#3d4846', 2);
    c.fillStyle = '#172a30'; c.fillRect(-64, -11, 22, 31);
    for (let i = 0; i < 5; i++) line(c, -61, -7 + i * 5, -45, -7 + i * 5, '#657974', 2);
    plate(c, [[-74, -27], [-60, -29], [-60, 13], [-73, 19], [-80, 8]], '#727e70', '#314a4a');
    c.fillStyle = '#d3a767'; c.fillRect(-36, -30, 7, 19);
    line(c, -29, -13, 19, -13, '#e3b16b', 2);
    shellLabel(walker.designation || '12', -34, 12, 12, '#dfdcc0');
    if (walker.id === 'WK02') {
      plate(c, [[-48, -39], [26, -38], [43, -24], [-54, -22]], '#a1ad9b', '#506e66');
      line(c, -43, -28, 26, -28, walker.color, 4);
      plate(c, [[48, 12], [72, 7], [67, 24], [37, 29]], '#7d9c8d', '#2d4c49');
    }
    bolt(c, -49, -26); bolt(c, -45, 18); bolt(c, 17, 19); bolt(c, 21, -31);
  } else if (walker.legs === 4) {
    plate(c, [[-90, -14], [-65, -36], [44, -36], [85, -12], [81, 17], [58, 29], [-74, 28]], '#919986', '#405553');
    plate(c, [[-62, -32], [35, -32], [57, -15], [-77, -15]], '#b4b397', '#727f6e');
    plate(c, [[53, -23], [83, -8], [77, 11], [48, 13]], '#788e84', '#314a4e');
    poly(c, [[53, -15], [77, -6], [73, 2], [50, 2]], '#efbf79', '#172d32', 2.5);
    plate(c, [[-91, -4], [-55, -5], [-49, 18], [-87, 19]], '#6c7d6c', '#344f50');
    for (let i = 0; i < 6; i++) line(c, -83 + i * 5, -2, -80 + i * 5, 14, '#1d3539', 3);
    plate(c, [[-40, -8], [33, -8], [40, 18], [-44, 18]], '#84927a', '#4b645c');
    line(c, -34, -1, 25, -1, walker.color || '#cca46c', 4); shellLabel(walker.designation || 'Q–40', -30, 13, 12, '#d5d6bb');
    for (const bx of [-63, -34, 24, 64]) bolt(c, bx, 21);
    c.fillStyle = '#3c5050'; c.fillRect(-38, -45, 58, 8); line(c, -36, -45, 17, -45, '#c9c5a5', 2);
    if (walker.id === 'WK06') {
      plate(c, [[-76, -37], [-70, -59], [-12, -59], [-4, -37]], '#c6bea0', '#6c7c69');
      for (let i = 0; i < 4; i++) line(c, -62 + i * 13, -55, -59 + i * 13, -40, '#364d4d', 3);
      line(c, 42, -32, 42, -62, '#637b71', 5); circle(c, 42, -64, 6, '#b8c8a8', '#233d42', 2);
    }
  } else {
    plate(c, [[-99, -21], [-76, -39], [49, -37], [91, -19], [98, 10], [75, 29], [-80, 29], [-99, 10]], '#a3a18a', '#465c55');
    plate(c, [[-75, -33], [42, -32], [57, -13], [-83, -13]], '#b4b196', '#758272');
    plate(c, [[62, -26], [89, -12], [92, 4], [56, 10]], '#8c9b88', '#365455');
    poly(c, [[65, -18], [83, -10], [85, -3], [61, -2]], '#f5cd8c', '#20383b', 2);
    for (let j = 0; j < 3; j++) {
      const xx = -67 + j * 31;
      plate(c, [[xx, -6], [xx + 25, -6], [xx + 28, 17], [xx - 3, 17]], '#7d907a', '#3b5853');
      for (let i = 0; i < 4; i++) line(c, xx + 4, -1 + i * 4, xx + 20, -1 + i * 4, '#233d3e', 2);
      bolt(c, xx + 4, 20, 1.7);
    }
    c.fillStyle = walker.color || '#c6a766'; c.fillRect(30, -5, 9, 24); shellLabel(walker.designation || 'H6', -18, -20, 12, '#e3dfbe');
    if (walker.id === 'WK10') {
      for (let i = 0; i < 5; i++) {
        const xx = -81 + i * 29;
        plate(c, [[xx, -34], [xx + 23, -37], [xx + 31, -20], [xx - 4, -20]], '#afb39f', '#5e786c');
      }
      line(c, -89, -12, -107, -5, '#9ca88e', 7);
    } else {
      line(c, -92, -17, -92, -56, '#435a59', 7); line(c, -94, -56, -84, -56, '#9fa58d', 3);
      line(c, -76, -31, -76, -61, '#435a59', 7); line(c, -80, -61, -70, -61, '#9fa58d', 3);
    }
  }
  c.restore();
  // Fine hardware gives the silhouette a consistent industrial construction.
  const mastTop = ['WK02', 'WK10'].includes(walker.id) ? -53 : -73;
  line(c, -20, -39, -20, mastTop, '#192d33', 3); line(c, -20, mastTop, -16, mastTop - 9, '#bac3a8', 1.6);
  circle(c, -20, mastTop + 2, 2, '#d8aa66');
  c.fillStyle = '#172e35'; c.fillRect(-11, -47, 26, 8); circle(c, 7, -43, 3, '#a6c1b2');
  for (let i = 0; i < 5; i++) line(c, -p.width / 2 + 28 + i * 9, 24, -p.width / 2 + 33 + i * 9, 27, '#c8b487', 1);
  c.restore();
  for (const f of frontFeet) drawLeg(c, p, walker, f, false);
  // Gimbal, recoil sleeve and rifled barrel rotate independently from the chassis.
  c.save(); c.translate(x + 9, y + 8); c.rotate(p.aimAngle || 0);
  const barrel = walker.legs === 4 ? 105 : walker.legs === 6 ? 94 : 85;
  circle(c, 0, 0, 21, '#243b40', '#a7aa91', 3);
  circle(c, 0, 0, 12, '#647b72', '#142f37', 3);
  plate(c, [[-8, -12], [41, -12], [49, -8], [49, 8], [-8, 13]], '#9ca68b', '#3f5f59');
  c.fillStyle = '#213a40'; c.fillRect(34, -6, barrel - 30, 12);
  line(c, 41, -5, barrel, -5, '#bcc4aa', 3);
  c.fillStyle = '#a5a68c'; c.fillRect(barrel - 10, -11, 17, 22);
  c.fillStyle = '#233d45'; c.fillRect(barrel + 3, -8, 6, 16);
  for (let i = 0; i < 4; i++) line(c, 48 + i * 9, -8, 48 + i * 9, 8, '#728b80', 2);
  if (walker.legs === 6) { c.fillStyle = '#213a40'; c.fillRect(30, 14, 57, 6); line(c, 32, 14, 88, 14, '#9aa995', 1.5); }
  if (p.fireCooldown > 0.1 && !options.hangar) {
    glow(c, barrel + 15, 0, 42, '#ffd58766');
    poly(c, [[barrel + 7, -7], [barrel + 40, -3], [barrel + 25, 0], [barrel + 48, 4], [barrel + 8, 8]], '#ffe2a2');
  }
  c.restore();
  if (p.venting || p.heat > 70) {
    for (let i = 0; i < 5; i++) {
      const phase = (t * 0.8 + i * 0.23) % 1;
      c.globalAlpha = (1 - phase) * 0.18;
      circle(c, x - facing * (p.width * 0.47 + phase * 20), y - 30 - phase * 85, 9 + phase * 27, '#d2d5c6');
    }
    c.globalAlpha = 1;
  }
  if (p.flash > 0) { glow(c, x, y, p.width, '#ff8c5345'); }
  c.restore();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.cameraX = 0;
    this.width = W; this.height = H; this.lastGame = null;
    this.panorama = new Image(); this.panorama.src = new URL('../assets/art/vesper-panorama.png', import.meta.url).href;
    this.panoramaReady = false; this.panorama.onload = () => { this.panoramaReady = true; };
    this.panorama.onerror = () => { this.panoramaReady = false; };
  }

  worldPoint(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (clientX - r.left) / r.width * this.width + this.cameraX, y: (clientY - r.top) / r.height * this.height };
  }

  prepare(width, height) {
    this.width = width; this.height = height;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (this.canvas.width !== Math.round(width * dpr) || this.canvas.height !== Math.round(height * dpr)) {
      this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round';
  }

  render(s, options = {}) {
    this.prepare(W, H);
    const c = this.ctx;
    const targetCamera = clamp(s.player.x - W * 0.33, 0, s.mission.length - W + 100);
    if (this.lastGame !== s) { this.cameraX = targetCamera; this.lastGame = s; }
    else this.cameraX = mix(this.cameraX, targetCamera, options.reducedMotion ? 1 : 0.12);
    const t = options.reducedMotion ? 0 : s.elapsed;
    c.clearRect(0, 0, W, H);
    this.drawBackground(s, t);
    c.save();
    if (options.shake !== false && !options.reducedMotion && s.cameraShake > 0.01) c.translate(Math.sin(t * 127) * s.cameraShake * 6, Math.cos(t * 97) * s.cameraShake * 4);
    c.translate(-this.cameraX, 0);
    this.drawTerrain(s, t);
    if (s.campaign) this.drawCampaignLandmarks(s, t);
    for (const r of s.relays) if (this.visible(r.x, 150)) this.drawRelay(r, s);
    if (!s.train && !s.industrial) this.drawEvidence(s, t);
    this.drawExtraction(s, t);
    for (const item of s.pickups) if (!item.collected && this.visible(item.x, 100)) this.drawSupply(item, t);
    const visibleEnemies = s.enemies.filter(e => !e.dead && this.visible(e.x, 200) && (e.id !== 'holt-observer' || s.network?.scrutinyTriggered) && (e.id !== 'private-hauler' || !s.industrial?.retreatEscaped));
    for (const e of visibleEnemies) this.drawTelegraph(e, s, t);
    for (const civilian of s.civilians) if (civilian.alive && !civilian.safe && this.visible(civilian.x, 100)) this.drawHuman(civilian, t, true);
    if (s.convoy && this.visible(s.convoy.x, 200)) this.drawConvoy(s.convoy, t);
    if (s.train) this.drawTrain(s, t);
    for (const e of visibleEnemies) if (e.kind !== 'air') this.drawEnemy(e, s, t);
    this.drawShadow(s.player.x, s.player.groundY, s.walker.width * 0.75, 15);
    drawWalker(c, s.player, s.walker, t);
    this.drawRadiator(s, t);
    for (const e of visibleEnemies) if (e.kind === 'air') this.drawEnemy(e, s, t);
    this.drawShots(s);
    this.drawParticles(s);
    this.drawForeground(s, t);
    if (s.train) this.drawTrainLabels(s);
    if (s.network) this.drawNetworkLabels(s);
    if (s.industrial) this.drawIndustrialLabels(s);
    c.restore();
    this.drawAtmosphere(s, t);
    this.drawMarkers(s);
    if (options.pointer?.visible) this.drawReticle(options.pointer, s);
    if (s.interaction) this.drawInteraction(s);
  }

  visible(x, margin = 100) { return x > this.cameraX - margin && x < this.cameraX + W + margin; }

  drawRadiator(s, t) {
    const c = this.ctx, part = s.player.radiator, box = radiatorBounds(s);
    const color = part.health < 40 ? '#ec9e75' : part.health < 80 ? '#dfc18b' : '#a1c8b5';
    c.save(); c.translate(box.x, box.y);
    // The visible fins occupy the exact local collision box returned by the simulation.
    c.fillStyle = '#203b3e'; c.fillRect(-box.w / 2, -box.h / 2, box.w, box.h);
    c.strokeStyle = color; c.lineWidth = 1.5; c.strokeRect(-box.w / 2, -box.h / 2, box.w, box.h);
    for (let y = -box.h / 2 + 5; y < box.h / 2 - 2; y += 6) line(c, -box.w / 2 + 3, y, box.w / 2 - 3, y, color, 2);
    if (part.health < 75) {
      line(c, -7, -box.h * .3, 5, -2, '#15262b', 3);
      line(c, 5, -2, -4, box.h * .3, '#15262b', 3);
    }
    if (part.repairing) {
      glow(c, 0, 0, 38, '#a6dec530');
      circle(c, 0, Math.sin(t * 6) * box.h * .3, 2.3, '#e0efbb');
      c.fillStyle = '#28443f'; c.fillRect(-22, -box.h / 2 - 11, 44, 4);
      c.fillStyle = '#bddcb9'; c.fillRect(-22, -box.h / 2 - 11, 44 * part.repairProgress, 4);
    }
    c.restore();
  }

  drawBackground(s, t) {
    const c = this.ctx, planet = s.planetId, cam = this.cameraX;
    const sky = c.createLinearGradient(0, 0, 0, 720);
    sky.addColorStop(0, s.mission.sky[0]); sky.addColorStop(0.54, s.mission.sky[1]); sky.addColorStop(1, s.mission.sky[2]);
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    if (planet === 'PL01' && this.panoramaReady) {
      const imageRatio = this.panorama.width / this.panorama.height;
      const ih = 710, iw = ih * imageRatio;
      const ix = -cam * 0.075;
      c.globalAlpha = 0.8;
      c.drawImage(this.panorama, ix - 140, 30, Math.max(W + 700, iw), ih);
      c.globalAlpha = 1;
      const tint = c.createLinearGradient(0, 0, 0, 720); tint.addColorStop(0, '#10232b55'); tint.addColorStop(1, '#d3a37811');
      c.fillStyle = tint; c.fillRect(0, 0, W, 720);
    } else {
      const moonX = 1190 - cam * 0.02, moonY = planet === 'PL03' ? 180 : 210;
      glow(c, moonX, moonY, 180, planet === 'PL02' ? '#d1edce18' : '#ddb98e18');
      circle(c, moonX, moonY, planet === 'PL02' ? 69 : 94, planet === 'PL02' ? '#d4d9b539' : '#c6bc8d2a');
      if (planet === 'PL02') {
        c.save(); c.translate(moonX, moonY); c.rotate(-0.28); c.scale(1, 0.24); circle(c, 0, 0, 113, null, '#dddec04d', 8); c.restore();
      }
    }
    // Several independent ridgelines retain depth as the camera moves.
    const colors = planet === 'PL03' ? ['#38514f', '#2b4745', '#213f3d'] : planet === 'PL02' ? ['#446b73', '#325b66', '#244b56'] : ['#7a7770', '#656c66', '#3f5050'];
    for (let layer = 0; layer < (planet === 'PL01' && this.panoramaReady ? 0 : 3); layer++) {
      const pts = [[-50, 730]]; const step = 120, shift = cam * (0.09 + layer * 0.065);
      const start = Math.floor(shift / step) - 1;
      for (let i = start; i < start + 18; i++) {
        const xx = i * step - shift;
        const yy = 450 + layer * 58 - hash(i * 19 + layer * 71) * (160 - layer * 20);
        pts.push([xx, yy]);
      }
      pts.push([W + 150, 730]); poly(c, pts, colors[layer]);
    }
    if (planet === 'PL01') {
      c.save(); c.translate(0, 180); c.scale(1, 0.75); c.globalAlpha = 0.82;
      this.drawIndustry(cam, t); c.restore();
    }
    if (planet === 'PL02') this.drawHarbor(cam, t);
    if (planet === 'PL03') this.drawForest(cam, t);
    const haze = c.createLinearGradient(0, 470, 0, 700);
    haze.addColorStop(0, 'transparent'); haze.addColorStop(1, planet === 'PL01' ? '#d9ba8b45' : planet === 'PL02' ? '#b0c9bd30' : '#b3c59428');
    c.fillStyle = haze; c.fillRect(0, 470, W, 240);
  }

  drawIndustry(cam, t) {
    const c = this.ctx, shift = cam * 0.32;
    for (let i = Math.floor(shift / 620) - 1; i < Math.floor(shift / 620) + 5; i++) {
      const x = i * 620 - shift, height = 125 + hash(i) * 120;
      c.fillStyle = '#354b4c'; c.fillRect(x, 600 - height, 70, height);
      poly(c, [[x - 6, 600 - height], [x + 15, 584 - height], [x + 66, 584 - height], [x + 80, 600 - height]], '#405653');
      for (let j = 0; j < 4; j++) line(c, x + 12 + j * 15, 602 - height, x + 12 + j * 15, 595, '#5b6960', 1.5);
      c.fillStyle = '#324a4b'; c.fillRect(x + 93, 550 - height, 17, height + 50);
      c.fillRect(x + 89, 541 - height, 25, 13); c.fillRect(x + 147, 498, 96, 101);
      line(c, x + 78, 554, x + 251, 554, '#405a58', 7);
      line(c, x + 135, 551, x + 135, 605, '#314a4d', 7);
      for (let j = 0; j < 4; j++) {
        const phase = (t * 0.025 + j * 0.25 + hash(i * 3)) % 1;
        c.globalAlpha = (1 - phase) * 0.14;
        circle(c, x + 103 + phase * 80, 535 - height - phase * 110, 9 + phase * 40, '#dfc69a');
      }
      c.globalAlpha = 1;
      for (let j = 0; j < 5; j++) { c.fillStyle = hash(i + j) > 0.4 ? '#d2ae7455' : '#243e41'; c.fillRect(x + 156 + j * 16, 513, 6, 3); }
      line(c, x - 15, 617, x + 260, 617, '#1b363c', 10);
    }
  }

  drawHarbor(cam, t) {
    const c = this.ctx;
    const ocean = c.createLinearGradient(0, 490, 0, 730); ocean.addColorStop(0, '#6f9395'); ocean.addColorStop(1, '#1b4c5b');
    c.fillStyle = ocean; c.fillRect(0, 490, W, 245);
    for (let i = 0; i < 60; i++) {
      const y = 500 + i * 3.5, x = hash(i * 5) * W - (cam * 0.13) % 200;
      line(c, x + Math.sin(t * 0.7 + i) * 6, y, x + 30 + hash(i) * 180, y, i % 4 === 0 ? '#a7c8bc55' : '#648d9344', 1);
    }
    const shift = cam * 0.34;
    for (let i = Math.floor(shift / 600) - 1; i < Math.floor(shift / 600) + 4; i++) {
      const x = i * 600 - shift;
      poly(c, [[x + 40, 537], [x + 270, 537], [x + 239, 571], [x + 80, 571]], '#254753');
      c.fillStyle = '#355962'; c.fillRect(x + 110, 496, 85, 41); c.fillRect(x + 143, 469, 37, 27);
      line(c, x + 158, 469, x + 158, 419, '#254751', 3);
      line(c, x + 158, 428, x + 210, 451, '#42646a', 2);
      line(c, x + 340, 599, x + 340, 305, '#2d505b', 17);
      line(c, x + 340, 310, x + 480, 375, '#345b64', 14);
      line(c, x + 340, 340, x + 480, 375, '#223f49', 3);
      line(c, x + 473, 376, x + 473, 475, '#32535c', 2);
      poly(c, [[x + 325, 305], [x + 349, 305], [x + 356, 291], [x + 321, 291]], '#496e72');
      // The freight stacks sit on a continuous pier, with piles descending into the water.
      c.fillStyle = '#2b4d55'; c.fillRect(x + 280, 589, 285, 11);
      for (let j = 0; j < 5; j++) line(c, x + 294 + j * 59, 598, x + 294 + j * 59, 646, '#294a53', 8);
      for (let j = 0; j < 7; j++) {
        for (let level = 0; level < (j % 3 === 1 ? 2 : 1); level++) {
          c.fillStyle = j % 2 ? '#4a6768' : '#6c7d71'; c.fillRect(x + 297 + j * 36, 558 - level * 33, 32, 31);
          for (let seam = 1; seam < 4; seam++) line(c, x + 297 + j * 36 + seam * 7, 561 - level * 33, x + 297 + j * 36 + seam * 7, 586 - level * 33, '#9ba58b22', 1);
        }
      }
    }
  }

  drawForest(cam, t) {
    const c = this.ctx;
    for (let layer = 0; layer < 2; layer++) {
      const shift = cam * (0.22 + layer * 0.18), step = layer ? 310 : 180;
      for (let i = Math.floor(shift / step) - 1; i < Math.floor(shift / step) + Math.ceil(W / step) + 2; i++) {
        const x = i * step - shift, h = 320 + hash(i * 7 + layer) * 230, width = layer ? 41 : 22;
        const color = layer ? '#203e3b' : '#36534b';
        poly(c, [[x - width, 677], [x - width * 0.46, 677 - h], [x + width * 0.18, 650 - h], [x + width * 0.5, 677 - h], [x + width, 677]], color);
        for (let j = 0; j < 4; j++) {
          const yy = 640 - h + j * h * 0.15, side = j % 2 ? 1 : -1;
          line(c, x, yy + 40, x + side * (90 + hash(i + j) * 50), yy - 9, color, width * 0.35);
          for (let k = 0; k < 3; k++) {
            c.save(); c.translate(x + side * (70 + k * 24), yy - k * 6); c.rotate(side * 0.25);
            c.fillStyle = layer ? '#294a3f' : '#45634e'; c.beginPath(); c.ellipse(0, 0, 52, 14, 0, 0, TAU); c.fill(); c.restore();
          }
        }
        line(c, x - 6, 670, x - 3, 695 - h, '#84997922', 2);
        for (let j = 0; j < 4; j++) {
          const yy = 430 + j * 56 + hash(i + j) * 15;
          circle(c, x + width * 0.3, yy, 2.5, '#a4b88377');
        }
      }
    }
    for (let i = 0; i < 30; i++) {
      const x = (hash(i * 71) * (W + 70) - cam * 0.28 + t * 4 * hash(i) + 10000) % (W + 70) - 35;
      const y = 250 + hash(i * 27) * 375 + Math.sin(t + i) * 7;
      glow(c, x, y, 7, '#dce1a526'); circle(c, x, y, 1.3, '#d2d99488');
    }
  }

  drawTerrain(s, t) {
    if (s.train) { this.drawRailViaduct(s, t); return; }
    const c = this.ctx, start = Math.floor((this.cameraX - 100) / 20) * 20, end = this.cameraX + W + 100;
    const pts = [[start, H + 30]];
    for (let x = start; x <= end; x += 20) pts.push([x, terrainAt(x, s.planetId)]);
    pts.push([end, H + 30]);
    const colors = s.planetId === 'PL03' ? ['#607159', '#233b35'] : s.planetId === 'PL02' ? ['#7f8c82', '#263c40'] : ['#a99576', '#3a4846'];
    const soil = c.createLinearGradient(0, 650, 0, 900); soil.addColorStop(0, colors[0]); soil.addColorStop(0.35, colors[1]); soil.addColorStop(1, '#10252d');
    poly(c, pts, soil);
    c.beginPath(); for (let x = start; x <= end; x += 14) { const y = terrainAt(x, s.planetId); if (x === start) c.moveTo(x, y); else c.lineTo(x, y); }
    c.strokeStyle = s.planetId === 'PL03' ? '#a8ac78' : '#d9bf8e'; c.lineWidth = 2; c.stroke();
    // Geologic layers are anchored in the world, so texture never swims with the camera.
    for (let k = Math.floor(start / 83); k < end / 83; k++) {
      const x = k * 83 + hash(k * 2) * 25, ground = terrainAt(x, s.planetId);
      line(c, x, ground + 35 + hash(k * 13) * 20, x + 40 + hash(k) * 45, ground + 42 + hash(k * 13) * 20, '#132a2e44', 2);
      const ry = ground + 15 + hash(k * 3) * 130;
      poly(c, [[x + 8, ry], [x + 23, ry - 3], [x + 32, ry + 4], [x + 17, ry + 8]], '#afad8a17');
      if (k % 3 === 0) poly(c, [[x, ground], [x + 8, ground - 9], [x + 22, ground - 11], [x + 32, ground - 1]], '#65756a', '#c0b88e55', 1);
    }
    if (s.planetId === 'PL02') {
      for (let k = Math.floor(start / 145); k < end / 145; k++) {
        const x = k * 145, y = terrainAt(x, s.planetId);
        line(c, x, y + 4, x, y + 83, '#152d36', 3); line(c, x + 2, y + 5, x + 2, y + 80, '#a5af9c33', 1);
        line(c, x, y + 72, x + 143, terrainAt(x + 143, s.planetId) + 72, '#18323b', 2);
        for (let i = 0; i < 6; i++) line(c, x + 20 + i * 20, y + 18, x + 12 + i * 20, y + 27, '#bdb98d55', 3);
      }
    } else if (s.planetId === 'PL03') {
      for (let k = Math.floor(start / 95); k < end / 95; k++) {
        const x = k * 95, y = terrainAt(x, s.planetId);
        for (let j = 0; j < 4; j++) {
          const xx = x + j * 12; line(c, xx, y - 1, xx + Math.sin(k + j) * 10, y - 13 - hash(j + k) * 19, '#7b9461', 2);
        }
      }
    }
  }

  drawShadow(x, y, width, height) { const c = this.ctx; c.fillStyle = '#10202b45'; c.beginPath(); c.ellipse(x, y + 3, width, height, 0, 0, TAU); c.fill(); }

  drawHuman(e, t, civilian = false) {
    const c = this.ctx, x = e.x, y = e.y, dir = civilian ? (e.fleeing ? 1 : -1) : e.facing || -1;
    this.drawShadow(x, y + e.h / 2, 13, 4);
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const pace = civilian && e.fleeing || !civilian && e.phase !== 'attack' ? Math.sin(t * 7 + x) * 5 : 2;
    line(c, -4, 5, -5 - pace, 17, '#1e2c2d', 5); line(c, 3, 5, 5 + pace, 17, '#26393a', 5);
    line(c, -5 - pace, 17, -1 - pace, 17, '#0d242a', 4); line(c, 5 + pace, 17, 9 + pace, 17, '#0d242a', 4);
    poly(c, [[-7, -10], [6, -10], [9, 7], [-8, 7]], civilian ? '#82beb6' : '#a79d7a', '#293c3d', 1);
    if (civilian) {
      line(c, -5, -7, -8, 3, '#b8cec1', 3); line(c, 5, -5, 10, 0, '#b8cec1', 3);
      poly(c, [[-8, -10], [-4, -15], [5, -13], [8, -5]], '#b8bfa5');
      line(c, -6, 0, 7, 0, '#edf1d166', 2);
    } else {
      c.fillStyle = '#50605a'; c.fillRect(-5, -7, 9, 10); line(c, -2, -6, -2, 3, '#d9bd80', 2);
      line(c, 3, -5, 13, -1, '#838e72', 4); line(c, -4, -4, 9, -1, '#838e72', 4);
      line(c, 7, -3, e.type === 'rocket' ? 25 : 23, -3, '#192c31', e.type === 'rocket' ? 7 : 4);
      if (e.type === 'rocket') { c.fillStyle = '#a98c62'; c.fillRect(16, -8, 9, 9); }
    }
    circle(c, 0, -15, 5, '#c6ad88');
    if (!civilian) { poly(c, [[-6, -17], [-4, -22], [4, -22], [7, -17]], '#455a56'); line(c, 1, -16, 5, -16, '#d6ac68', 2); }
    c.restore();
    if (civilian) { label(c, 'CIVIL', x, y - 30, 9, '#b6dfd1', 'center'); }
  }

  drawEnemy(e, s, t) {
    const c = this.ctx;
    if (e.kind === 'infantry') this.drawHuman(e, t);
    else if (e.kind === 'vehicle') {
      this.drawShadow(e.x, e.y + e.h / 2, 53, 7);
      c.save(); c.translate(e.x, e.y);
      for (const x of [-29, 28]) { circle(c, x, 15, 16, '#13292d', '#5d6d61', 4); circle(c, x, 15, 7, '#79836d', '#1c363a', 3); }
      plate(c, [[-43, -10], [-25, -23], [12, -23], [41, -8], [39, 10], [-44, 10]], '#a58e70', '#4b5d54');
      poly(c, [[-22, -18], [-2, -18], [8, -6], [-30, -6]], '#293f43', '#bca784', 2);
      line(c, -41, -5, -49, -5, '#c9af72', 3); c.fillStyle = '#df8e5f'; c.fillRect(35, 0, 5, 4);
      c.fillStyle = '#344b4c'; c.fillRect(4, -29, 22, 8); line(c, 10, -25, -25, -28, '#213e43', 6);
      bolt(c, -34, 4); bolt(c, 29, 4); c.restore();
    } else if (e.kind === 'air') {
      c.save(); c.translate(e.x, e.y); c.rotate(Math.sin(t * 2 + e.x) * 0.06);
      glow(c, 0, 14, 36, '#a7ddce22');
      line(c, -35, 0, 35, 0, '#182f36', 7);
      for (const x of [-32, 32]) { c.fillStyle = '#203d43'; c.beginPath(); c.ellipse(x, 0, 18, 5, 0, 0, TAU); c.fill(); line(c, x - 16, -2, x + 16, -2, '#98b2a1', 1.5); }
      plate(c, [[-21, -10], [13, -10], [25, -1], [17, 12], [-16, 12], [-26, 0]], '#9ba48c', '#395b59');
      circle(c, -10, 1, 5, '#192d35', '#d8ad6e', 2); circle(c, -10, 1, 2, '#f0c482');
      line(c, -4, 12, -8, 22, '#253e43', 5); c.restore();
    } else if (e.kind === 'fauna') {
      c.save(); c.translate(e.x, e.y); c.scale(e.facing, 1);
      for (let i = 0; i < 4; i++) { const x = -20 + i * 12, step = Math.sin(t * 8 + i * 2) * 6; line(c, x, 2, x - 7 + step, 17, '#273f3d', 4); }
      plate(c, [[-28, -1], [-16, -19], [10, -20], [28, -5], [21, 7], [-23, 8]], '#8f9d79', '#405f4e');
      for (let i = 0; i < 5; i++) poly(c, [[-18 + i * 9, -12], [-20 + i * 9, -27 - hash(i) * 8], [-10 + i * 9, -14]], '#b0b38b');
      circle(c, 22, -1, 3, '#dac884'); line(c, 24, 3, 35, 6, '#a5ae86', 3); c.restore();
    } else if (e.kind === 'turret') {
      c.save(); c.translate(e.x, e.y);
      plate(c, [[-30, 35], [-23, -11], [20, -11], [30, 35]], '#727e6c', '#304a4c');
      plate(c, [[-24, -31], [22, -31], [27, -10], [-29, -10]], '#a39e80', '#4a665d');
      line(c, -10, -22, -53, -19, '#1d373e', 10); line(c, -10, -27, -53, -24, '#b4b59a', 2);
      line(c, -16, 9, 16, 9, '#b58b59', 4); bolt(c, -15, 23); bolt(c, 14, 23); c.restore();
    } else if (e.kind === 'walker') {
      const ground = terrainAt(e.x, s.planetId);
      const p = { x: e.x, y: ground - 173, width: 150, height: 78, aimAngle: Math.atan2(s.player.y - (ground - 173), s.player.x - e.x), feet: [-55, 55].map((o, i) => ({
        x: e.x + o + (e.phase === 'attack' ? 0 : Math.sin(t * 2 + i * Math.PI) * 8), y: ground,
        homeOffset: o, side: i ? 'front' : 'back', health: 100, phase: 'stance', contact: true,
      })), fireCooldown: 0, heat: 0, flash: e.flash };
      const walker = { legs: 2, height: 173, width: 150 };
      c.save(); c.filter = 'sepia(0.25) saturate(0.8)'; drawWalker(c, p, walker, t); c.restore();
      label(c, e.phase === 'standdown' ? 'CERBÈRE · REPLI AUTORISÉ' : 'CERBÈRE', e.x, ground - 265, 13, e.phase === 'standdown' ? '#a6c3aa' : '#f2ad83', 'center');
    }
    if (e.hp < e.maxHp) {
      const width = e.kind === 'walker' ? 130 : Math.max(30, Math.min(70, e.w));
      const y = e.kind === 'walker' ? terrainAt(e.x, s.planetId) - 250 : e.y - e.h / 2 - 12;
      c.fillStyle = '#152a31'; c.fillRect(e.x - width / 2, y, width, 4);
      c.fillStyle = '#e0a078'; c.fillRect(e.x - width / 2, y, width * Math.max(0, e.hp / e.maxHp), 4);
    }
    if (e.flash > 0) glow(c, e.x, e.y, e.w, '#ffe1a54d');
  }

  drawTelegraph(e, s, t) {
    if (e.phase !== 'attack') return;
    const c = this.ctx;
    c.save(); c.setLineDash([8, 9]);
    const color = e.type === 'rocket' || e.type === 'boss' ? '#ec9b65' : '#d9bb8677';
    line(c, e.x, e.y, e.targetX, e.targetY, color, e.type === 'boss' ? 2 : 1);
    c.setLineDash([]);
    circle(c, e.targetX, e.targetY, 17 + (1 - e.telegraph) * 13, null, color, 1.5);
    line(c, e.targetX - 7, e.targetY, e.targetX + 7, e.targetY, color, 1);
    circle(c, e.x, e.y - e.h / 2 - 24, 9, '#20333b', color, 1.5);
    label(c, '!', e.x, e.y - e.h / 2 - 20, 12, '#ffcf94', 'center');
    c.restore();
  }

  drawRelay(r, s) {
    const c = this.ctx, ground = r.y + r.h / 2;
    c.save(); c.translate(r.x, ground);
    if (r.destroyed) {
      poly(c, [[-43, 0], [-30, -16], [-13, -10], [2, -40], [15, -16], [38, -5], [46, 0]], '#35494a', '#90896e', 2);
      line(c, -15, -14, 30, -55, '#5c6f65', 6); line(c, 30, -55, 39, -51, '#a58e62', 2);
      c.restore(); return;
    }
    plate(c, [[-37, 0], [-27, -26], [28, -26], [39, 0]], '#89937d', '#314b4d');
    plate(c, [[-23, -24], [-18, -126], [16, -126], [24, -24]], '#899b85', '#334f50');
    c.fillStyle = '#213e44'; c.fillRect(-13, -95, 25, 51);
    for (let i = 0; i < 5; i++) line(c, -8, -87 + i * 8, 7, -87 + i * 8, i === 0 ? '#d8a36a' : '#738d7a', 3);
    circle(c, 0, -128, 20, '#415f5b', '#c8bd91', 2);
    line(c, -12, -141, 17, -117, '#a4ad8a', 3); circle(c, 0, -128, 5, '#d4ad70');
    line(c, 0, -146, 0, -172, '#485f5b', 3); circle(c, 0, -174, 3, '#f2bf78');
    bolt(c, -17, -30); bolt(c, 17, -30);
    label(c, 'RELAIS', 0, -193, 11, '#e4bd84', 'center');
    c.fillStyle = '#1a3037'; c.fillRect(-27, -185, 54, 3); c.fillStyle = '#d9b077'; c.fillRect(-27, -185, 54 * r.hp / r.maxHp, 3);
    c.restore();
  }

  drawEvidence(s, t) {
    const c = this.ctx, e = s.evidence;
    if (!this.visible(e.x, 200)) return;
    const y = terrainAt(e.x, s.planetId);
    c.save(); c.translate(e.x, y);
    plate(c, [[-27, 0], [-22, -69], [17, -69], [26, 0]], '#778b7a', '#2a484d');
    plate(c, [[-27, -67], [-20, -83], [27, -76], [28, -45], [-27, -47]], '#80927c', '#3f605c');
    poly(c, [[-19, -69], [18, -67], [18, -52], [-20, -54]], '#152e36', '#a6af8c', 1.5);
    for (let i = 0; i < 3; i++) line(c, -14, -64 + i * 4, 8 + (i % 2) * 7, -63 + i * 4, e.collected ? '#9dc8b6' : '#e9bd79', 1.3);
    line(c, -12, -23, 12, -23, '#9ab09a', 2); circle(c, 15, -35, 2, '#dbb77d');
    glow(c, 0, -61, 70, e.collected ? '#8ad2bd12' : '#ecbd7628');
    const pulse = e.collected ? 1 : 0.5 + Math.sin(t * 3) * 0.3;
    c.globalAlpha = pulse;
    poly(c, [[0, -136], [8, -128], [0, -120], [-8, -128]], e.collected ? '#a6d5bc' : '#f0c78b');
    c.globalAlpha = 1;
    const evidenceLabel = s.network ? e.collected ? 'DOSSIER CONSIGNÉ' : 'TERMINAL DE LIAISON' : s.campaign ? e.collected ? 'MANIFESTE LU' : s.campaign.filtersDelivered ? 'MANIFESTE DES FILTRES' : 'POSTE · ATTEND LE CAMION' : e.collected ? 'REGISTRE RÉCUPÉRÉ' : 'REGISTRE';
    label(c, evidenceLabel, 0, -149, 11, e.collected ? '#c3dfc5' : '#f0c78b', 'center');
    if (e.scanning) {
      c.fillStyle = '#172e35'; c.fillRect(-60, -111, 120, 5); c.fillStyle = '#f0c78b'; c.fillRect(-60, -111, 120 * e.scanProgress, 5);
      label(c, `${Math.round(e.scanProgress * 100)} %`, 0, -91, 11, '#f2d6a7', 'center');
    }
    c.restore();
  }

  drawSupply(item, t) {
    const c = this.ctx;
    c.save(); c.translate(item.x, item.y);
    plate(c, [[-24, -15], [21, -15], [27, -7], [27, 18], [-24, 18]], '#85947d', '#3a5756');
    c.fillStyle = '#c7baa0'; c.fillRect(-3, -10, 7, 22); c.fillRect(-11, -3, 23, 7);
    line(c, -22, -10, -22, 14, '#3b5150', 2); line(c, 20, -10, 20, 14, '#3b5150', 2);
    label(c, 'RAVITAILLEMENT', 0, -29, 9, '#bdd4b4', 'center');
    c.restore();
  }

  drawExtraction(s, t) {
    const e = s.extraction, c = this.ctx;
    if (!this.visible(e.x, 250)) return;
    const color = e.active ? '#acd3b1' : '#9ca897';
    for (const side of [-1, 1]) {
      line(c, e.x + side * 85, e.y, e.x + side * 85, e.y - 108, '#3f5c5b', 6);
      circle(c, e.x + side * 85, e.y - 108, 4, color);
      if (e.active) glow(c, e.x + side * 85, e.y - 108, 32, '#b9e2a830');
    }
    c.save(); c.setLineDash([12, 7]); c.strokeStyle = color; c.lineWidth = 2;
    c.beginPath(); c.ellipse(e.x, e.y - 1, e.radius, 16, 0, 0, TAU); c.stroke(); c.restore();
    label(c, s.campaign ? e.active ? 'RETOUR AU HANGAR' : 'RAMPE DE RETOUR' : e.active ? 'EXTRACTION AUTORISÉE' : 'POINT D’EXTRACTION', e.x, e.y - 139, 12, color, 'center');
  }

  drawCampaignLandmarks(s, t) {
    if (s.train) { this.drawRailHarpoons(s, t); return; }
    if (s.network) { this.drawNetworkStations(s, t); return; }
    if (s.industrial) { this.drawIndustrialStation(s, t); return; }
    const c = this.ctx, a = s.campaign, passage = s.mission.passage;
    if (this.visible(passage.stationX, 180)) {
      const x = passage.stationX, y = terrainAt(x, s.planetId);
      c.save(); c.translate(x, y);
      plate(c, [[-38, 0], [-29, -49], [27, -49], [36, 0]], '#9a9f85', '#354e4c');
      circle(c, 0, -31, 16, '#273c3d', '#c7ad76', 3);
      line(c, -15, -31, 15, -31, '#aa9870', 3); line(c, 0, -46, 0, -16, '#aa9870', 3);
      line(c, 29, -21, passage.pipeFrom - x, -2, '#a79c77', 2);
      label(c, a.passageSecured ? 'DALLES VERROUILLÉES' : a.pipeIntact ? 'E · TREUIL DES DALLES' : 'RÉPARATION À PRÉVOIR', 0, -132, 11, a.passageSecured ? '#b7d8b9' : '#f0c78b', 'center');
      label(c, a.passageSecured ? 'CONDUITE PROTÉGÉE' : a.pipeIntact ? '4,5 s · rester à proximité' : '2 lots de pièces', 0, -113, 10, '#b9c6b0', 'center');
      if (a.passageWorking) {
        c.fillStyle = '#163039'; c.fillRect(-60, -69, 120, 5);
        c.fillStyle = '#d6bd83'; c.fillRect(-60, -69, 120 * a.passageProgress, 5);
      }
      c.restore();
    }
    if (this.visible((passage.pipeFrom + passage.pipeTo) / 2, 230)) {
      const from = passage.pipeFrom, to = passage.pipeTo, mid = (from + to) / 2;
      // Top surfaces coincide with terrainAt, where the simulation's foot contacts are tested.
      for (let x = from; x < to; x += 20) {
        const end = Math.min(to, x + 20), y1 = terrainAt(x, s.planetId), y2 = terrainAt(end, s.planetId);
        if (!a.pipeIntact && x < mid + 28 && end > mid - 28) continue;
        line(c, x, y1 + 8, end, y2 + 8, a.pipeIntact ? '#b9a06e' : '#5c6460', 13);
        line(c, x, y1 + 3, end, y2 + 3, '#d3bd87', 2);
      }
      if (a.passageSecured || a.passageWorking) {
        const progress = a.passageSecured ? 1 : a.passageProgress;
        for (let x = from - 14; x < from - 14 + (to - from + 28) * progress; x += 28) {
          const end = Math.min(x + 27, to + 14), y1 = terrainAt(x, s.planetId), y2 = terrainAt(end, s.planetId);
          poly(c, [[x, y1], [end, y2], [end, y2 + 13], [x, y1 + 13]], '#6f8a7c', '#c4c19b', 1);
          line(c, x + 5, y1 + 2, end - 4, y2 + 2, '#d8c27f', 2);
        }
      }
      if (!a.pipeIntact) {
        for (let i = 0; i < 6; i++) {
          c.globalAlpha = 0.25 - i * 0.025;
          circle(c, mid + Math.sin(t * 2 + i) * (7 + i * 2), terrainAt(mid, s.planetId) - 6 - i * 13, 10 + i * 4, '#c4d0c1');
        }
        c.globalAlpha = 1;
      }
      label(c, a.passageSecured ? 'PASSAGE PROTÉGÉ' : a.pipeIntact ? 'CONDUITE FRAGILE' : 'CONDUITE ROMPUE', mid, terrainAt(mid, s.planetId) + 45, 10, a.pipeIntact ? '#d4c28f' : '#e7a77f', 'center');
      for (const x of [from - 20, to + 20]) {
        const y = terrainAt(x, s.planetId);
        line(c, x, y, x, y - 32, '#b39c65', 3);
        poly(c, [[x - 5, y - 30], [x + 7, y - 30], [x + 7, y - 19], [x - 5, y - 19]], '#d0b477');
      }
    }
    if (this.visible(s.mission.deliveryX, 260)) {
      const x = s.mission.deliveryX, y = terrainAt(x, s.planetId);
      c.save(); c.translate(x, y);
      plate(c, [[-133, 0], [-133, -100], [-99, -121], [69, -121], [95, -99], [95, 0]], '#687b73', '#2d464b');
      c.fillStyle = '#162f35'; c.fillRect(-105, -77, 88, 77);
      c.fillStyle = '#b9af83'; c.fillRect(8, -80, 60, 12);
      label(c, 'POSTE 42', -17, -137, 13, '#d8c395', 'center');
      label(c, a.filtersDelivered ? '24 CAISSES DÉCHARGÉES' : 'FILTRES ATTENDUS', -17, -155, 10, '#acd5bf', 'center');
      if (a.filtersDelivered) {
        for (let i = 0; i < 24; i++) {
          const cx = -300 + (i % 8) * 27, cy = terrainAt(x + cx + 12, s.planetId) - y - Math.floor(i / 8) * 17;
          c.fillStyle = '#85957d'; c.fillRect(cx, cy - 15, 24, 14); c.strokeStyle = '#c5bd95'; c.lineWidth = 1; c.strokeRect(cx, cy - 15, 24, 14);
          line(c, cx + 12, cy - 14, cx + 12, cy - 2, '#465d55', 2);
        }
      }
      c.restore();
    }
  }

  drawIndustrialStation(s, t) {
    const c = this.ctx, site = s.industrial;
    const pump = site.pump;
    if (this.visible(pump.x, 150)) {
      c.save(); c.translate(pump.x, pump.y);
      plate(c, [[-pump.w / 2, pump.h / 2], [-pump.w / 2, -pump.h / 2], [pump.w / 2, -pump.h / 2], [pump.w / 2, pump.h / 2]], '#a1a182', '#344e4f');
      circle(c, -13, 0, 17, '#293f43', '#b9af83', 3);
      line(c, -25, 0, -1, 0, pump.connected ? '#afd6bd' : '#c19866', 4);
      line(c, -13, -12, -13, 12, pump.connected ? '#afd6bd' : '#c19866', 4);
      c.fillStyle = '#1c343b'; c.fillRect(12, -15, 16, 23);
      circle(c, 20, -7, 3, pump.connected ? '#9cdbbd' : '#e0a272');
      line(c, 29, 13, 62, 13, '#647e72', 11); line(c, 62, 13, 75, 29, '#647e72', 11);
      label(c, 'C-42', 0, 40, 10, '#c5c9ad', 'center');
      c.restore();
    }
    for (const turbine of site.turbines) {
      if (!this.visible(turbine.x, 200)) continue;
      c.save(); c.translate(turbine.x, turbine.y);
      const left = -turbine.w / 2, top = -turbine.h / 2;
      plate(c, [[left, turbine.h / 2], [left, top + 13], [left + 14, top], [-left - 14, top], [-left, top + 13], [-left, turbine.h / 2]], '#9b9c83', '#31494b');
      circle(c, 0, -8, 36, '#192f37', '#c2b083', 4);
      c.save(); c.translate(0, -8); c.rotate(t * (turbine.cooled ? .15 : 2.3));
      for (let i = 0; i < 5; i++) {
        c.save(); c.rotate(i * TAU / 5);
        poly(c, [[4, -6], [28, -13], [30, -3], [12, 9]], turbine.cooled ? '#6f9488' : '#a18b64', '#2b4649', 1);
        c.restore();
      }
      c.restore(); circle(c, 0, -8, 9, '#82998a', '#1a323a', 2);
      const heatColor = turbine.cooled ? '#a2d5bd' : '#ecb376';
      glow(c, 0, -8, 64, turbine.cooled ? '#91d1b014' : '#df97532a');
      for (let i = 0; i < 4; i++) line(c, -25 + i * 16, 36, -25 + i * 16, 53, '#1b343a', 5);
      line(c, -35, top + 9, 35, top + 9, heatColor, 3);
      line(c, -58, 44, -42, 44, '#819682', 10); circle(c, -58, 44, 10, '#314b4b', heatColor, 2);
      label(c, turbine.id.endsWith('1') ? 'T-01' : 'T-02', 0, 61, 9, '#d0ceb1', 'center');
      if (!turbine.cooled) for (let i = 0; i < 4; i++) {
        const phase = (t * .3 + i * .25) % 1;
        c.globalAlpha = (1 - phase) * .16;
        circle(c, 12 + Math.sin(phase * 4 + i) * 18, top - phase * 96, 8 + phase * 24, '#cab6a0');
      }
      c.restore();
    }
    const contact = site.contact;
    if (this.visible(contact.x, 130)) {
      c.save(); c.translate(contact.x, contact.y);
      plate(c, [[-contact.w / 2, contact.h / 2], [-contact.w / 2, -contact.h / 2], [contact.w / 2, -contact.h / 2], [contact.w / 2, contact.h / 2]], '#819681', '#28484c');
      c.fillStyle = '#162d35'; c.fillRect(-16, -23, 32, 22);
      const color = contact.available ? '#a8d9c5' : '#586e66';
      for (let i = 0; i < 5; i++) line(c, -12 + i * 6, -13, -12 + i * 6, -13 - (contact.working ? 3 + Math.sin(t * 6 + i) * 5 : 2), color, 2);
      circle(c, 0, 16, 7, '#1d363e', color, 2);
      line(c, 13, -contact.h / 2, 13, -contact.h / 2 - 43, '#9cad90', 2);
      circle(c, 13, -contact.h / 2 - 44, 3, color);
      c.restore();
    }
    const post = site.post;
    if (this.visible(post.x, 250)) {
      c.save(); c.translate(post.x, post.y);
      const half = post.w / 2, top = -post.h / 2, bottom = post.h / 2;
      if (post.destroyed) {
        poly(c, [[-half, bottom], [-half + 8, bottom - 48], [-half / 2, bottom - 28], [-10, bottom - 70], [25, bottom - 32], [half, bottom - 43], [half, bottom]], '#374649', '#8e8e76', 2);
        for (let i = 0; i < 6; i++) {
          const xx = -half + 12 + i * 23;
          line(c, xx, bottom - 8, xx + 6, bottom - 27 - hash(i + post.x) * 30, '#96977e', 3);
        }
        glow(c, 0, bottom - 22, 80, '#dc97521c');
      } else {
        plate(c, [[-half, bottom], [-half, top], [half, top], [half, bottom]], '#95947c', '#2d454a');
        c.fillStyle = '#243e44'; c.fillRect(-half + 7, top + 7, post.w - 14, 25);
        label(c, 'MAINTENANCE', 0, top + 24, 12, '#d2c39d', 'center');
        for (let i = 0; i < 3; i++) {
          const xx = -half + 17 + i * 45;
          c.fillStyle = '#152e37'; c.fillRect(xx, top + 46, 32, 35);
          c.fillStyle = s.evidence.collected ? '#8eac95' : '#c4b784'; c.fillRect(xx + 3, top + 50, 26, 25);
          line(c, xx + 16, top + 50, xx + 16, top + 76, '#344a4a', 2);
        }
        plate(c, [[-20, bottom], [-20, bottom - 59], [22, bottom - 59], [22, bottom]], '#728777', '#243e45');
        c.fillStyle = '#18333c'; c.fillRect(-12, bottom - 50, 26, 24);
        for (let i = 0; i < 4; i++) line(c, -8, bottom - 45 + i * 5, 8, bottom - 45 + i * 5, s.evidence.collected ? '#b4dac1' : '#edc98b', 1);
        line(c, -half, top + 36, half, top + 36, '#c0ad7a', 3);
        if (post.hp < post.maxHp * .75) {
          line(c, half - 13, top + 37, half - 36, top + 63, '#172c32', 4);
          line(c, half - 36, top + 63, half - 18, top + 94, '#172c32', 3);
        }
      }
      if (post.flash > 0) glow(c, 0, 0, post.w, '#ed9b583f');
      c.restore();
    }
  }

  drawIndustrialLabels(s) {
    const c = this.ctx, site = s.industrial;
    const entries = [
      [site.pump, 'CIRCUIT DE REFROIDISSEMENT', site.pump.connected ? 'CIRCUIT LOCAL ALIMENTÉ' : site.pump.working ? 'MISE EN PRESSION EN COURS' : 'E · RELANCER LA POMPE PORTATIVE', site.pump.connected ? '#a6d4ba' : '#e4c38d', site.pump.working ? site.pump.progress : null],
      ...site.turbines.map((turbine, index) => [turbine, `TURBINE ${index + 1} · ${Math.round(turbine.temperature)} °C`, turbine.cooled ? 'CIRCUIT STABILISÉ' : turbine.working ? 'REFROIDISSEMENT EN COURS' : 'E · OUVRIR LA VANNE', turbine.cooled ? '#a6d4ba' : '#e4b27c', turbine.working ? turbine.progress : null]),
      [site.contact, 'CANAL DU DISPENSAIRE', site.contact.contacted ? 'ÉCHANGE RECUEILLI' : site.contact.working ? 'LIAISON EN COURS' : site.contact.available ? 'E · ÉTABLIR LA LIAISON' : 'CONTACT INDISPONIBLE', site.contact.available ? '#a5d7c4' : '#a3afa1', site.contact.working ? site.contact.progress : null],
      [site.post, 'POSTE DE MAINTENANCE', s.campaign.logRecovered ? 'PT01 · COPIE CONSERVÉE' : s.campaign.turbinesCooled < 2 ? 'REFROIDIR LES DEUX TURBINES AVANT L’ACCÈS' : s.evidence.scanning ? 'RELEVÉ EN COURS' : site.post.destroyed ? s.campaign.maintenanceInspected ? 'JOURNAL PERDU · CONSTAT CONSIGNÉ' : 'JOURNAL DÉTRUIT · E POUR CONSTATER' : 'E · INSPECTER LE JOURNAL', site.post.destroyed ? '#e0a17d' : '#e4c38d', s.evidence.scanning ? s.evidence.scanProgress : null],
    ];
    for (const [object, title, detail, color, progress] of entries) {
      if (!this.visible(object.x, 0)) continue;
      const near = Math.abs(s.player.x - object.x) < s.player.width + 210;
      const y = Math.max(290, Math.min(object.y - object.h / 2 - 75, near ? s.player.y - 118 : 900));
      const labelX = clamp(object.x, this.cameraX + 163, this.cameraX + W - 163);
      if (labelX !== object.x) line(c, labelX, y + 52, object.x, object.y - object.h / 2, '#a6bba155', 1);
      c.fillStyle = '#102a31ed'; c.fillRect(labelX - 153, y, 306, 52);
      line(c, labelX - 153, y, labelX + 153, y, color, 1);
      label(c, title, labelX, y + 18, 11, color, 'center');
      label(c, detail, labelX, y + 36, 9, '#bfceb9', 'center');
      if (progress !== null) {
        c.fillStyle = '#28443f'; c.fillRect(labelX - 153, y + 49, 306, 3);
        c.fillStyle = color; c.fillRect(labelX - 153, y + 49, 306 * progress, 3);
      }
    }
  }

  drawNetworkStations(s, t) {
    const c = this.ctx;
    for (const station of s.network.stations) {
      if (!this.visible(station.x, 300)) continue;
      const ground = terrainAt(station.x, s.planetId), half = station.w / 2;
      const top = station.y - station.h / 2 - ground;
      const live = !station.destroyed && !station.disabled;
      const color = station.kind === 'military' ? '#d5b379' : '#a4d4c5';
      c.save(); c.translate(station.x, ground);
      if (station.destroyed) {
        poly(c, [[-half - 10, 0], [-half + 5, -32], [-half / 2, -19], [-12, -61], [18, -24], [half - 9, -43], [half + 14, 0]], '#344345', '#8a8571', 2);
        for (let i = 0; i < 5; i++) {
          const xx = -half + i * half / 2;
          line(c, xx, -5, xx + 8, -30 - hash(i + station.x) * 20, '#777e70', 4);
        }
        line(c, -12, -55, half + 34, -84, '#9c9980', 4);
        circle(c, half + 35, -85, 14, '#33494b', '#7e8877', 2);
        glow(c, 0, -13, half + 30, '#ef985319');
      } else if (station.kind === 'military') {
        plate(c, [[-half, -4], [-half + 8, top + 23], [half - 8, top + 23], [half, -4]], '#8b947e', '#34494c');
        for (const yy of [top + 43, top + 83, top + 123]) {
          line(c, -half + 8, yy, half - 8, yy + 28, '#243b40', 5);
          line(c, -half + 8, yy + 28, half - 8, yy, '#bbc09c', 2);
        }
        circle(c, 0, top + 12, 23, '#425b59', '#bfc09a', 3);
        line(c, -14, top - 3, 18, top + 25, '#d1b47e', 3);
        line(c, 0, top - 10, 0, top - 32, '#638174', 4);
        circle(c, 0, top - 34, 3.5, live ? '#efc37b' : '#526662');
        poly(c, [[-half - 12, 0], [-half - 7, -20], [half + 7, -20], [half + 12, 0]], '#6c7d6c', '#233b40', 2);
      } else {
        // These occupied buildings sit behind the service lane. Their shell
        // matches the simulated projectile hitbox; the ground terminal is exposed.
        plate(c, [[-half, 0], [-half, top + 10], [half, top + 10], [half, 0]], '#747e6d', '#293f43');
        plate(c, [[-half - 9, top + 11], [-half + 4, top - 3], [half - 3, top - 3], [half + 10, top + 11]], '#a3a68b', '#596f65');
        line(c, -half + 7, top + 70, half - 7, top + 70, '#a5aa8866', 2);
        for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
          const wx = -half + 17 + col * (station.w - 37) / 4, wy = top + 24 + row * 54;
          const windowColor = live ? station.kind === 'dispensary' ? '#bddbc4' : '#d8bc83' : '#30494b';
          c.fillStyle = '#132b33'; c.fillRect(wx - 3, wy - 3, 25, 36);
          c.fillStyle = windowColor; c.fillRect(wx, wy, 19, 28);
          line(c, wx + 9, wy, wx + 9, wy + 28, '#2d4546', 2);
          line(c, wx, wy + 14, wx + 19, wy + 14, '#2d4546', 2);
          if (live) glow(c, wx + 9, wy + 14, 30, '#e0c89413');
        }
        plate(c, [[-17, 0], [-17, -44], [18, -44], [18, 0]], '#7c8d7a', '#284147');
        c.fillStyle = live ? '#cfbf91' : '#405453'; c.fillRect(-10, -37, 20, 24);
        if (station.kind === 'dispensary') {
          c.fillStyle = '#233f44'; c.fillRect(-36, top - 29, 72, 24);
          label(c, 'SOINS', 0, top - 12, 13, '#b9dfce', 'center');
        } else {
          line(c, -half - 28, top + 30, half + 22, top + 40, '#a89e7a', 1);
          for (let i = 0; i < 5; i++) {
            const xx = -half - 15 + i * 39;
            c.fillStyle = i % 2 ? '#697c70' : '#a29d7e'; c.fillRect(xx, top + 32 + i * 2, 17, 25);
          }
        }
        line(c, half - 19, top, half - 19, top - 37, '#859783', 4);
        line(c, half - 35, top - 27, half - 3, top - 27, '#adbb98', 2);
        circle(c, half - 19, top - 38, 3, live ? color : '#445c59');
        if (station.hp < station.maxHp * .75) {
          line(c, -half + 8, top + 75, -half + 28, top + 100, '#172c32', 4);
          line(c, -half + 28, top + 100, -half + 12, top + 129, '#172c32', 3);
        }
      }
      if (!station.destroyed) {
        const secured = station.secured;
        const terminalOffset = half + 30, terminalY = terrainAt(station.x + terminalOffset, s.planetId) - ground;
        line(c, half - 5, -13, terminalOffset, terminalY - 10, '#9fa78b', 3);
        c.save(); c.translate(terminalOffset, terminalY);
        plate(c, [[-18, 0], [-16, -25], [16, -25], [18, 0]], secured ? '#83a38f' : '#a48f68', '#2a4245');
        if (secured) {
          for (let i = -1; i <= 1; i++) line(c, i * 9 - 3, -20, i * 9 + 2, -7, '#b8d1b4', 2);
        } else {
          c.fillStyle = '#182e34'; c.fillRect(-12, -21, 24, 14);
          line(c, -10, -13, -4, -19, '#d4a264', 2); line(c, -4, -19, 10, -10, '#abccbb', 2);
        }
        c.restore();
        if (live) {
          c.save(); c.globalAlpha = .23 + Math.sin(t * 2 + station.x) * .08;
          c.strokeStyle = color; c.lineWidth = 1.5;
          for (let radius = 19; radius < 48; radius += 12) {
            c.beginPath(); c.arc(0, top - 30, radius, -2.6, -.55); c.stroke();
          }
          c.restore();
        }
      }
      if (station.flash > 0) glow(c, 0, top / 2, station.w, '#ed9b583f');
      c.restore();
    }
  }

  drawNetworkLabels(s) {
    const c = this.ctx;
    for (const station of s.network.stations) {
      if (!this.visible(station.x, 170)) continue;
      const spec = s.mission.network.stations.find(item => item.id === station.id || item.kind === station.kind);
      const near = Math.abs(s.player.x - station.x) < s.player.width + 210;
      const y = Math.max(290, Math.min(station.y - station.h / 2 - 65, near ? s.player.y - 115 : 900));
      const color = station.destroyed ? '#e3a080' : station.disabled ? '#a1afa3' : station.verified ? '#a7d8c7' : '#e4c38d';
      c.fillStyle = '#102a31ed'; c.fillRect(station.x - 148, y, 296, 61);
      line(c, station.x - 148, y, station.x + 148, y, color, 1);
      label(c, (spec?.label || station.kind).toUpperCase(), station.x, y + 17, 11, color, 'center');
      const state = station.destroyed ? 'INSTALLATION DÉTRUITE · ÉMISSION PERDUE' : station.disabled ? 'ÉMISSION COUPÉE' : !station.identified ? 'ÉMISSION À IDENTIFIER' : station.kind === 'military' ? 'RELAIS MILITAIRE IDENTIFIÉ' : 'USAGE CIVIL VÉRIFIÉ';
      label(c, state, station.x, y + 33, 9, '#bfceb9', 'center');
      const detail = station.destroyed ? `${station.casualties} PERTE${station.casualties === 1 ? '' : 'S'} CONSTATÉE${station.casualties === 1 ? '' : 'S'}` : station.scanning ? 'IDENTIFICATION EN COURS · RESTEZ À PORTÉE' : station.disabling ? 'COUPURE EN COURS · RESTEZ À PORTÉE' : station.kind === 'military' && station.identified && !station.disabled ? 'E · ISOLER LE RELAIS MILITAIRE' : station.secured ? 'TERMINAL PROTÉGÉ · SURVEILLEZ LES TIRS' : 'E · VÉRIFIER AVANT DE FRANCHIR';
      label(c, detail, station.x, y + 49, 9, '#a4baad', 'center');
      c.fillStyle = '#28443f'; c.fillRect(station.x - 148, y + 58, 296, 3);
      c.fillStyle = color; c.fillRect(station.x - 148, y + 58, 296 * station.hp / station.maxHp, 3);
    }
  }

  drawRailViaduct(s, t) {
    const c = this.ctx, start = Math.floor((this.cameraX - 120) / 24) * 24, end = this.cameraX + W + 120;
    const breakX = s.train.breakX;
    // The maintenance deck follows the simulated walking surface. The damaged
    // rails are a separate route: walkers can reach the ramp after the rail break.
    const ravine = c.createLinearGradient(0, 690, 0, H);
    ravine.addColorStop(0, '#6a6557'); ravine.addColorStop(1, '#122b34');
    c.fillStyle = ravine; c.fillRect(start, 705, end - start, H - 705);
    for (let x = Math.floor(start / 320) * 320; x < end; x += 320) {
      const y = terrainAt(x, s.planetId);
      poly(c, [[x - 44, y + 31], [x + 44, y + 31], [x + 32, H + 30], [x - 27, H + 30]], '#34494a', '#718477', 2);
      line(c, x - 18, y + 48, x - 9, H, '#9a9c7f44', 3);
      line(c, x + 28, y + 52, x + 255, terrainAt(x + 320, s.planetId) + 135, '#344d4e', 10);
      line(c, x + 28, y + 130, x + 255, terrainAt(x + 320, s.planetId) + 47, '#5d6d60', 5);
      label(c, `V-${Math.floor(x / 320 + 1).toString().padStart(2, '0')}`, x - 21, y + 88, 10, '#b6ad87');
    }
    for (let x = start; x < end; x += 24) {
      const y = terrainAt(x, s.planetId), ny = terrainAt(x + 24, s.planetId);
      poly(c, [[x, y], [x + 24, ny], [x + 24, ny + 37], [x, y + 37]], '#6c7668', '#334d4c', 1);
      line(c, x, y + 31, x + 24, ny + 31, '#b5a576', 3);
      // A narrow service walkway stays continuous at the exact foot-contact height.
      line(c, x, y, x + 24, ny, '#c9b78c', 3);
      if (Math.abs(x - breakX) > 64) {
        line(c, x, y + 7, x + 24, ny + 7, '#293f43', 4);
        line(c, x, y + 11, x + 24, ny + 11, '#b5b7a0', 2);
        line(c, x + 4, y + 1, x + 11, y + 13, '#243c42', 4);
      } else {
        line(c, x, y + 9, x + 17, y + 20 + Math.sin(x) * 7, '#293f43', 5);
      }
      if (Math.floor(x / 24) % 7 === 0) {
        line(c, x + 5, y + 1, x + 5, y - 37, '#455c59', 3);
        circle(c, x + 5, y - 37, 2, '#d7b46d');
      }
    }
    if (this.visible(breakX, 210)) {
      const y = terrainAt(breakX, s.planetId);
      for (const x of [breakX - 85, breakX + 85]) {
        line(c, x, terrainAt(x, s.planetId), x, y - 68, '#4c5143', 6);
        circle(c, x, y - 69, 6, '#df8c63');
        if (!s.train.stopped) glow(c, x, y - 69, 30, '#df75592a');
      }
      label(c, 'VOIE ROMPUE', breakX, y - 121, 13, '#f0b389', 'center');
      label(c, 'PASSERELLE LATÉRALE PRATICABLE', breakX, y - 101, 9, '#c7d0b3', 'center');
    }
  }

  drawRailHarpoons(s, t) {
    const c = this.ctx;
    for (const [i, harpoon] of s.train.harpoons.entries()) {
      if (!harpoon.released) {
        const attachment = s.train.wagons[i] || s.train;
        c.save(); c.setLineDash([8, 5]);
        line(c, harpoon.x + 24, harpoon.y - 22, attachment.x, attachment.y + 10, '#c4ab7d66', 2);
        c.restore();
      }
      if (!this.visible(harpoon.x, 200)) continue;
      c.save(); c.translate(harpoon.x, harpoon.y + 22);
      plate(c, [[-39, 0], [-31, -48], [31, -48], [42, 0]], '#8c9278', '#2f494a');
      circle(c, 0, -27, 18, '#233c42', '#bea578', 3);
      circle(c, 0, -27, 9, harpoon.released ? '#8fbaa3' : '#886341');
      for (let j = 0; j < 4; j++) {
        const angle = j * Math.PI / 2 + (harpoon.working ? t * 2 : 0);
        line(c, Math.cos(angle) * 8, -27 + Math.sin(angle) * 8, Math.cos(angle) * 16, -27 + Math.sin(angle) * 16, '#c2ac80', 2);
      }
      label(c, harpoon.released ? `HARPON ${i + 1} LIBÉRÉ` : `E · DÉFAIRE LE HARPON ${i + 1}`, 0, -112, 11, harpoon.released ? '#b8d5b6' : '#edc180', 'center');
      label(c, harpoon.released ? 'CÂBLE DÉTENDU' : '2,5 s · rester à proximité', 0, -94, 9, '#b6c2ad', 'center');
      if (harpoon.working) {
        c.fillStyle = '#143039'; c.fillRect(-50, -78, 100, 4);
        c.fillStyle = '#e7c285'; c.fillRect(-50, -78, 100 * harpoon.progress, 4);
      }
      c.restore();
    }
  }

  drawTrain(s, t) {
    const c = this.ctx, train = s.train, state = s.campaign;
    const cars = [...train.wagons].sort((a, b) => a.x - b.x);
    for (const [index, wagon] of cars.entries()) {
      const next = cars[index + 1] || train;
      if (this.visible(wagon.x, 400)) line(c, wagon.x + wagon.w / 2, wagon.y + 22, next.x - next.w / 2, next.y + 22, '#293e40', 8);
    }
    for (const car of [...cars, train]) {
      if (!this.visible(car.x, 260)) continue;
      const locomotive = car === train, occupied = car.kind === 'hostages' || car.id === 'hostages' || car.offset === -352;
      const half = car.w / 2, roof = -car.h / 2, bottom = car.h / 2;
      const integrity = clamp(car.hp / car.maxHp, 0, 1);
      c.save(); c.translate(car.x, car.y);
      for (const x of [-half + 24, half - 24]) {
        circle(c, x, bottom - 3, 15, '#18323a', '#7e8d7b', 3);
        circle(c, x, bottom - 3, 6, '#acac8d');
        const angle = train.moving ? car.x / 15 : 0;
        line(c, x - Math.cos(angle) * 10, bottom - 3 - Math.sin(angle) * 10, x + Math.cos(angle) * 10, bottom - 3 + Math.sin(angle) * 10, '#a0aa8d', 2);
      }
      plate(c, [[-half, roof + 12], [-half + 13, roof], [half - (locomotive ? 26 : 6), roof], [half, roof + (locomotive ? 25 : 10)], [half, bottom - 18], [-half, bottom - 18]], integrity > 0 ? occupied ? '#72938a' : locomotive ? '#a69b76' : '#8c8d73' : '#414b46', '#304b4e');
      line(c, -half + 4, bottom - 20, half - 4, bottom - 20, '#c4b68b', 3);
      if (locomotive) {
        poly(c, [[half - 49, roof + 8], [half - 27, roof + 8], [half - 10, roof + 27], [half - 49, roof + 27]], '#24414b', '#c0c6a3', 1.5);
        c.fillStyle = '#384d47'; c.fillRect(-half + 13, roof + 17, 52, 34);
        for (let i = 0; i < 6; i++) line(c, -half + 19 + i * 8, roof + 20, -half + 19 + i * 8, roof + 45, '#a9ae8a', 2);
        label(c, 'R–08', half - 32, bottom - 28, 13, '#d9d1a4', 'center');
        if (train.moving) {
          for (let i = 0; i < 4; i++) { c.globalAlpha = .15 - i * .025; circle(c, -half - i * 13, roof - 15 - i * 11 + Math.sin(t + i) * 4, 10 + i * 5, '#cfceaf'); }
          c.globalAlpha = 1;
        }
      } else if (occupied) {
        const freed = state.rescueResolved;
        c.fillStyle = '#1b363f'; c.fillRect(-half + 18, roof + 11, car.w - 36, 28);
        for (let i = 0; i < Math.max(0, state.hostagesTotal - state.hostagesLost); i++) {
          if (!freed) { const x = -half + 27 + i * 14; circle(c, x, roof + 21, 4, '#bbd3bd'); line(c, x, roof + 25, x, roof + 36, '#a6c1ae', 5); }
        }
        if (!freed) for (let x = -half + 26; x < half - 18; x += 16) line(c, x, roof + 10, x, roof + 40, '#849e8a', 2);
        else { c.fillStyle = '#1c3740'; c.fillRect(-18, roof + 5, 37, car.h - 25); line(c, -15, roof + 8, -15, bottom - 23, '#a5c6aa', 2); }
      } else {
        for (let x = -half + 12; x < half - 10; x += 20) line(c, x, roof + 5, x, bottom - 25, '#beb59666', 3);
        for (let i = 0; i < 6; i++) poly(c, [[-half + i * 23 + 7, roof], [-half + i * 23 + 14, roof - 9 - hash(i) * 8], [-half + i * 23 + 30, roof]], '#5c7469', '#a1aa84', 1);
        label(c, 'MINERAI / VESPER', 0, roof + 34, 10, '#d1c6a3', 'center');
      }
      if (integrity < .72) {
        const damagedX = -half + car.w * .32;
        line(c, damagedX, roof + 5, damagedX + 12, roof + 25, '#202e30', 3);
        line(c, damagedX + 12, roof + 25, damagedX - 7, bottom - 21, '#202e30', 3);
        if (integrity < .3) { circle(c, half - 23, roof + 38, 12, '#252f2c'); glow(c, half - 23, roof + 38, 34, '#e9915833'); }
      }
      c.restore();
    }
  }

  drawTrainLabels(s) {
    const c = this.ctx, train = s.train, state = s.campaign;
    const wagon = train.wagons.find(car => car.kind === 'hostages');
    for (const car of [train, wagon]) {
      if (!car || !this.visible(car.x, 180)) continue;
      const isEngine = car === train;
      const nearWalker = Math.abs(s.player.x - car.x) < s.walker.width + 85;
      const top = Math.min(car.y - car.h / 2 - 60, nearWalker ? s.player.y - s.player.height / 2 - 74 : Infinity);
      line(c, car.x, top + 46, car.x, car.y - car.h / 2 - 4, '#b5c1a85c', 1);
      c.fillStyle = '#12282fdf'; c.fillRect(car.x - 132, top, 264, 48);
      c.strokeStyle = '#a6b29b48'; c.lineWidth = 1; c.strokeRect(car.x - 132, top, 264, 48);
      const title = isEngine ? train.stopped ? 'FREIN VERROUILLÉ' : 'E · FREIN D’URGENCE'
        : state.rescueResolved ? `${state.hostagesRescued} LIBÉRÉS · ${state.hostagesLost} PERDUS` : 'OUVRIERS À BORD · RETENEZ VOS TIRS';
      const subtitle = isEngine ? train.brakeWorking ? `LIAISON ${Math.round(train.brakeProgress * 100)} %` : train.moving ? 'RESTER À PORTÉE PENDANT 4 s' : train.stopped ? 'LOCOMOTIVE SÉCURISÉE' : 'LIBÉRER LES DEUX HARPONS'
        : !train.stopped ? 'ATTENDRE L’ARRÊT DU TRAIN' : !state.rescueResolved ? 'E · OUVRIR LE WAGON' : s.evidence.collected ? state.evidencePreserved ? 'REGISTRE DE VENTE LU' : 'PERTE DU REGISTRE CONSTATÉE' : 'E · INSPECTER LE REGISTRE';
      label(c, title, car.x, top + 16, 10, isEngine ? '#e4c491' : '#b8dfcf', 'center');
      label(c, subtitle, car.x, top + 31, 9, '#b8c6ae', 'center');
      const progress = isEngine ? train.brakeWorking ? train.brakeProgress : car.hp / car.maxHp : state.rescueWorking ? state.rescueProgress : s.evidence.scanning ? s.evidence.scanProgress : car.hp / car.maxHp;
      c.fillStyle = '#25434a'; c.fillRect(car.x - 119, top + 39, 238, 3);
      c.fillStyle = '#b7cda2'; c.fillRect(car.x - 119, top + 39, 238 * clamp(progress, 0, 1), 3);
    }
  }

  drawConvoy(v, t) {
    const c = this.ctx;
    this.drawShadow(v.x, v.y + v.h / 2, 69, 8);
    c.save(); c.translate(v.x, v.y);
    for (const x of [-36, -9, 35]) { circle(c, x, 26, 14, '#162f35', '#667e72', 3); circle(c, x, 26, 6, '#9aa48b', '#263e43', 2); }
    plate(c, [[-59, -25], [21, -25], [21, 18], [-59, 18]], '#a0a78d', '#456a64');
    plate(c, [[20, -16], [44, -16], [58, 1], [59, 19], [20, 19]], '#839e8b', '#3c625e');
    poly(c, [[27, -10], [41, -10], [51, 0], [27, 0]], '#2f5359', '#b7c4a5', 1.5);
    for (let i = 0; i < 6; i++) line(c, -51 + i * 11, -18, -51 + i * 11, 13, '#c7c8a655', 1.5);
    if (v.cargo) {
      c.fillStyle = '#284840'; c.fillRect(-51, -11, 63, 20);
      label(c, 'FILTRES', -20, 2, 10, '#d8d6af', 'center');
    } else {
      c.fillStyle = '#c8d7bd'; c.fillRect(-27, -14, 9, 22); c.fillRect(-34, -7, 23, 8);
    }
    c.fillStyle = '#e7d8a7'; c.fillRect(53, 5, 5, 4); c.restore();
    label(c, v.cargo ? v.arrived ? 'SAMI · LIVRAISON TERMINÉE' : v.waitTime > 0 ? `SAMI · ATTENTE ${Math.ceil(v.waitTime)} s` : 'SAMI · 24 CAISSES DE FILTRES' : v.arrived ? 'TRANSPORT À L’ABRI' : v.moving ? 'CONVOI CIVIL' : 'CONVOI · EN ATTENTE', v.x, v.y - 51, 10, '#c1ded0', 'center');
    c.fillStyle = '#183038'; c.fillRect(v.x - 45, v.y - 44, 90, 4); c.fillStyle = '#95c6b3'; c.fillRect(v.x - 45, v.y - 44, 90 * v.hp / v.maxHp, 4);
  }

  drawShots(s) {
    const c = this.ctx;
    for (const p of s.projectiles) {
      if (!this.visible(p.x, 100)) continue;
      const friendly = p.team === 'player';
      if (p.type === 'rocket') {
        for (let i = 0; i < p.trail.length; i++) {
          c.globalAlpha = i / p.trail.length * 0.35; circle(c, p.trail[i].x, p.trail[i].y, 3 + (p.trail.length - i) * 0.7, '#c0bba2');
        }
        c.globalAlpha = 1; glow(c, p.x, p.y, 17, '#ffcb8055');
        line(c, p.x - p.vx * 0.014, p.y - p.vy * 0.014, p.x, p.y, friendly ? '#ffdb9a' : '#f39a6e', 4);
      } else {
        line(c, p.prevX, p.prevY, p.x, p.y, friendly ? '#fbd68e' : '#eb9b75', friendly ? 2.5 : 2);
        line(c, p.x - p.vx * 0.025, p.y - p.vy * 0.025, p.x, p.y, friendly ? '#f6c87944' : '#d9896844', 3);
      }
    }
  }

  drawParticles(s) {
    const c = this.ctx;
    for (const p of s.particles) {
      if (!this.visible(p.x, 100)) continue;
      c.globalAlpha = clamp(p.life / p.maxLife, 0, 1) * (p.type === 'smoke' ? 0.32 : 1);
      if (p.type === 'spark') line(c, p.x, p.y, p.x - p.vx * 0.025, p.y - p.vy * 0.025, p.color, 2);
      else circle(c, p.x, p.y, p.size * (p.type === 'smoke' ? 2 - p.life / p.maxLife : 1), p.color);
    }
    c.globalAlpha = 1;
  }

  drawForeground(s, t) {
    const c = this.ctx;
    if (s.planetId === 'PL03') {
      for (let i = Math.floor(this.cameraX / 460) - 1; i < (this.cameraX + W) / 460 + 1; i++) {
        const x = i * 460 + hash(i) * 120, y = terrainAt(x, s.planetId) + 50;
        for (let j = 0; j < 7; j++) {
          const a = -Math.PI + j / 6 * Math.PI;
          const tipX = x + Math.cos(a) * 61, tipY = y + Math.sin(a) * 70;
          c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * 38, y - 25, tipX, tipY); c.strokeStyle = '#15382f'; c.lineWidth = 5; c.stroke();
          for (let k = 1; k < 5; k++) { const bx = mix(x, tipX, k / 5), by = mix(y, tipY, k / 5); line(c, bx - 12, by - 7, bx + 10, by + 3, '#254a39', 4); }
        }
      }
    }
  }

  drawAtmosphere(s, t) {
    const c = this.ctx;
    const vignette = c.createRadialGradient(W / 2, 420, 260, W / 2, 420, 1000);
    vignette.addColorStop(0, 'transparent'); vignette.addColorStop(0.7, '#0a1a2015'); vignette.addColorStop(1, '#09171ec0');
    c.fillStyle = vignette; c.fillRect(0, 0, W, H);
    const bottom = c.createLinearGradient(0, 750, 0, 900); bottom.addColorStop(0, 'transparent'); bottom.addColorStop(1, '#08191ed9');
    c.fillStyle = bottom; c.fillRect(0, 750, W, 150);
    for (let i = 0; i < 38; i++) {
      const x = (hash(i * 9) * W + t * (5 + hash(i) * 10) + this.cameraX * 0.03) % W;
      const y = hash(i * 3) * 700 + 70;
      c.globalAlpha = 0.1 + hash(i * 7) * 0.22;
      line(c, x, y, x + 3 + hash(i) * 4, y - 1, s.planetId === 'PL01' ? '#f2d8b1' : '#c5dfc4', 1);
    }
    c.globalAlpha = 1;
  }

  drawMarkers(s) {
    const c = this.ctx;
    const x = s.player.x - this.cameraX;
    const ratio = Math.max(0, s.player.hull / s.player.maxHull);
    if (ratio < 0.3) {
      c.strokeStyle = '#b5664c66'; c.lineWidth = 4; c.strokeRect(3, 3, W - 6, H - 6);
    }
    // Tactical route: one restrained line, objectives and vehicle retain their real world positions.
    const bx = 600, by = 853, bw = 400, toX = (v) => bx + clamp(v / s.mission.length, 0, 1) * bw;
    line(c, bx, by, bx + bw, by, '#8da29740', 2);
    for (const r of s.relays) circle(c, toX(r.x), by, 3, r.destroyed ? '#607d72' : '#c59464');
    if (s.campaign && s.mission.passage) {
      circle(c, toX(s.mission.passage.stationX), by, 4, s.campaign.passageSecured ? '#91bea8' : '#d4ae73');
      line(c, toX(s.mission.passage.pipeFrom), by + 5, toX(s.mission.passage.pipeTo), by + 5, s.campaign.pipeIntact ? '#afb68a' : '#d88e6b', 3);
    }
    const ex = toX(s.evidence.x); poly(c, [[ex, by - 5], [ex + 4, by], [ex, by + 5], [ex - 4, by]], s.evidence.collected ? '#91bea8' : '#e6c284');
    if (s.convoy) { c.fillStyle = '#91d2c4'; c.fillRect(toX(s.convoy.x) - 3, by - 3, 6, 6); }
    if (s.train) {
      for (const h of s.train.harpoons) circle(c, toX(h.x), by, 4, h.released ? '#91bea8' : '#d4ae73');
      c.fillStyle = '#a9cfbd'; c.fillRect(toX(s.train.x) - 6, by - 4, 12, 7);
      const dangerX = toX(s.train.breakX); line(c, dangerX - 4, by - 5, dangerX + 4, by + 5, '#e6a07e', 2); line(c, dangerX - 4, by + 5, dangerX + 4, by - 5, '#e6a07e', 2);
    }
    if (s.network) for (const station of s.network.stations) {
      const color = station.destroyed ? '#d18a72' : station.disabled ? '#768b80' : station.verified ? '#9ed6c5' : '#e6c284';
      c.fillStyle = color; c.fillRect(toX(station.x) - 3, by - 4, 6, 8);
    }
    if (s.industrial) {
      for (const turbine of s.industrial.turbines) circle(c, toX(turbine.x), by, 4, turbine.cooled ? '#a6d4ba' : '#e4b27c');
      const contact = s.industrial.contact;
      if (contact.available) circle(c, toX(contact.x), by, 3, contact.contacted ? '#a6d4ba' : '#e4c38d');
      circle(c, toX(s.industrial.pump.x), by, 3, s.industrial.pump.connected ? '#a6d4ba' : '#e4b27c');
    }
    const px = toX(s.player.x); poly(c, [[px, by - 8], [px + 5, by - 15], [px - 5, by - 15]], '#e2c893');
    const exitX = toX(s.extraction.x); line(c, exitX, by - 7, exitX, by + 7, s.extraction.active ? '#c6dfb1' : '#657b73', 2);
    label(c, 'ROUTE OPÉRATIONNELLE', bx, by + 24, 9, '#899b92');
    label(c, `${Math.min(100, Math.round(s.player.x / s.mission.length * 100))} %`, bx + bw, by + 24, 10, '#a9b8a4', 'right');
  }

  drawReticle(pointer, s) {
    const c = this.ctx;
    // Accept client coordinates or already-converted logical screen coordinates.
    let x = pointer.x, y = pointer.y;
    if (pointer.clientX !== undefined) { const p = this.worldPoint(pointer.clientX, pointer.clientY); x = p.x - this.cameraX; y = p.y; }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (pointer.world) x -= this.cameraX;
    const color = s.player.overheated ? '#e99b75' : '#e3cc9d';
    circle(c, x, y, 13, null, color, 1);
    for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) line(c, x + Math.cos(a) * 18, y + Math.sin(a) * 18, x + Math.cos(a) * 24, y + Math.sin(a) * 24, color, 1.5);
    circle(c, x, y, 1.6, color);
  }

  drawInteraction(s) {
    const c = this.ctx, y = 767;
    c.font = '500 13px "IBM Plex Mono", "Courier New", monospace';
    const width = Math.min(1040, c.measureText(s.interaction).width + 44);
    const x = clamp(s.player.x - this.cameraX, width / 2 + 30, W - width / 2 - 30);
    c.fillStyle = '#10282ee6'; c.fillRect(x - width / 2, y - 21, width, 37);
    line(c, x - width / 2, y - 21, x + width / 2, y - 21, '#c0a16a', 1);
    label(c, s.interaction, x, y + 2, 13, '#ead3a6', 'center');
  }

  renderHangar(walker, time = 0) {
    this.prepare(960, 480); this.cameraX = 0;
    const c = this.ctx, t = time;
    c.clearRect(0, 0, 960, 480);
    const bg = c.createLinearGradient(0, 0, 0, 480); bg.addColorStop(0, '#132a32'); bg.addColorStop(0.65, '#254048'); bg.addColorStop(1, '#0b222a');
    c.fillStyle = bg; c.fillRect(0, 0, 960, 480);
    for (let i = 0; i < 9; i++) {
      const x = i * 124;
      c.fillStyle = i % 2 ? '#142e37' : '#1b353e'; c.fillRect(x, 20, 114, 330);
      line(c, x + 6, 28, x + 6, 347, '#41605d55', 1);
      line(c, x + 110, 28, x + 110, 347, '#081f29', 5);
      c.fillStyle = '#bdd1b230'; c.fillRect(x + 19, 49, 74, 4);
    }
    for (let i = 0; i < 4; i++) line(c, 0, 75 + i * 83, 960, 75 + i * 83, '#24444a', 6);
    poly(c, [[0, 360], [960, 360], [960, 480], [0, 480]], '#1e373c');
    for (let i = 0; i < 10; i++) line(c, 480 + (i - 4.5) * 63, 360, 480 + (i - 4.5) * 170, 480, '#6b7c692b', 1);
    for (const y of [377, 405, 453]) line(c, 0, y, 960, y, '#8b94732b', 1);
    for (let i = 0; i < 20; i++) {
      const x = 23 + i * 49; poly(c, [[x, 443], [x + 22, 443], [x + 11, 451], [x - 11, 451]], '#a8a27360');
    }
    line(c, 95, 8, 95, 235, '#16313a', 10); line(c, 96, 232, 127, 263, '#627a6c', 6);
    line(c, 866, 8, 866, 235, '#16313a', 10); line(c, 865, 232, 834, 263, '#627a6c', 6);
    line(c, 0, 20, 960, 20, '#60776b', 8); line(c, 0, 15, 960, 15, '#a4aa8a44', 1);
    for (const x of [165, 800]) {
      c.save(); c.globalAlpha = 0.16;
      const light = c.createLinearGradient(0, 52, 0, 430); light.addColorStop(0, '#e7dfb4'); light.addColorStop(1, 'transparent');
      poly(c, [[x - 30, 48], [x + 30, 48], [x + 180, 420], [x - 150, 420]], light); c.restore();
    }
    // Keep one scale for the fleet: height is a meaningful chassis choice.
    const scale = Math.min(1.5, 326 / (Math.max(...WALKERS.map(w => w.height)) + 82));
    const centre = 485, floor = 407;
    this.drawShadow(centre, floor, 205, 22);
    glow(c, centre, floor - 100, 260, '#b0bea016');
    c.save(); c.translate(centre, floor); c.scale(scale, scale);
    const offsets = walker.legs === 2 ? [-40, 40] : walker.legs === 4 ? [-71, 71, -89, 89] : [-88, 0, 88, -105, 5, 105];
    const bob = Math.sin(t * 0.8) * 0.8;
    const p = { x: 0, y: -walker.height + bob, width: walker.width, height: walker.legs === 2 ? 70 : 62,
      aimAngle: -0.045 + Math.sin(t * 0.3) * 0.02, heat: 0, flash: 0,
      feet: offsets.map((o, i) => ({ x: o, y: 0, homeOffset: o, side: i < walker.legs / 2 ? 'back' : 'front', health: 100, phase: 'stance', contact: true })) };
    drawWalker(c, p, walker, t, { hangar: true });
    c.restore();
    // Small scale cues: service platforms, tool cases and a single crew silhouette.
    plate(c, [[70, 397], [148, 397], [148, 422], [70, 422]], '#5b7569', '#28454a');
    line(c, 82, 405, 137, 405, '#b6b58a', 3); line(c, 86, 412, 86, 422, '#8c9c7f', 2);
    const crew = { x: 796, y: 394, h: 34, w: 18, facing: -1, phase: 'attack' };
    this.drawHuman(crew, 0);
    line(c, 762, 405, 762, 362, '#60796c', 3); line(c, 749, 362, 778, 362, '#b8b590', 4);
    const shade = c.createLinearGradient(0, 0, 960, 0); shade.addColorStop(0, '#071d24bb'); shade.addColorStop(0.25, 'transparent'); shade.addColorStop(0.78, 'transparent'); shade.addColorStop(1, '#071d2499');
    c.fillStyle = shade; c.fillRect(0, 0, 960, 480);
    label(c, 'BAIE 07 / MAINTENANCE', 30, 45, 10, '#b4bd9b');
    label(c, `${walker.legs} APPUIS · ${walker.profile.toUpperCase()}`, 930, 45, 10, '#b4c9ab', 'right');
    line(c, 30, 58, 190, 58, '#b6b78966', 1);
  }
}
