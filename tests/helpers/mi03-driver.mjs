import { commandGame, updateGame, terrainAt } from '../../src/simulation.mjs';

// Public controls only. The pilot inspects from the approach side, waits for the
// actual work timer, keeps firing lanes clear and never rewrites game facts.
function clearLine(s, target) {
  const p = s.player, direction = Math.sign(target.x - p.x);
  if (!direction) return false;
  for (const station of s.network.stations) {
    if (station.destroyed || Math.sign(station.x - p.x) !== direction) continue;
    const y = p.y + 8 + (target.y - p.y - 8) * (station.x - p.x) / (target.x - p.x);
    if (y > terrainAt(station.x, s.planetId) + 8) continue;
    if (Math.abs(y - station.y) < station.h / 2 + 26) return false;
  }
  return true;
}

export function pilotMI03(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 36000 } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const p = s.player, c = s.campaign;
    const station = s.network.stations.find(item => !item.identified || item.kind === 'military' && !item.disabled && !item.destroyed);
    const destination = station ? station.x - 145 : !c.manifestRead || !s.decision.resolved ? s.evidence.x : s.extraction.x;
    let move = Math.abs(destination - p.x) > 15 ? Math.sign(destination - p.x) : 0;
    const target = s.enemies.filter(item => !item.dead && item.active && Math.abs(item.x - p.x) < 950 && clearLine(s, item))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (target && Math.abs(target.x - p.x) < 590) move = 0;
    if (station && Math.abs(p.x - station.x) < 175) {
      commandGame(s, 'interact'); move = 0;
    } else if (!station && Math.abs(p.x - s.evidence.x) < 100 && (!c.manifestRead || !s.decision.resolved)) {
      commandGame(s, 'interact'); move = 0;
    }
    const vent = p.heat > 75 || p.overheated;
    const flight = s.projectiles.some(shot => shot.team === 'player');
    const rocketSafe = target && s.network.stations.every(item => item.destroyed || Math.hypot(target.x - item.x, target.y - item.y) > 260);
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent && !flight,
      secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !flight,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
