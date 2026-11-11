import { commandGame, updateGame } from '../../src/simulation.mjs';

// Public-control test pilot. It does not rewrite the simulation state: every
// movement, target, projectile, interaction and decision uses the playable API.
function clearLine(s, target) {
  const p = s.player;
  for (const part of [s.train, ...s.train.wagons]) {
    if (part.destroyed) continue;
    const min = Math.min(p.x, target.x), max = Math.max(p.x, target.x);
    if (part.x < min || part.x > max || Math.abs(target.x - p.x) < 1) continue;
    const y = p.y + 8 + (target.y - p.y - 8) * (part.x - p.x) / (target.x - p.x);
    if (Math.abs(y - part.y) < part.h / 2 + 28) return false;
  }
  return true;
}

export function pilotMI02(s, { choice = 'defy', stopAt = null, maxFrames = 36000, brake = true, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const p = s.player, c = s.campaign, train = s.train;
    const harpoon = train.harpoons.find(item => !item.released);
    let destination = harpoon ? harpoon.x : !train.stopped ? train.x
      : !c.manifestRead || !s.decision.resolved ? s.evidence.x : s.extraction.x;
    let move = Math.abs(destination - p.x) > 35 ? Math.sign(destination - p.x) : 0;
    const candidates = s.enemies.filter(enemy => !enemy.dead && enemy.active && Math.abs(enemy.x - p.x) < 1000)
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const target = candidates.find(enemy => clearLine(s, enemy));
    // While the train runs, continue pursuing it even under fire.
    if (target && Math.abs(target.x - p.x) < 600 && (!train.moving || !brake)) move = 0;
    if (harpoon && Math.abs(p.x - harpoon.x) < 70) {
      commandGame(s, 'interact'); move = 0;
    } else if (!harpoon && !train.stopped && brake && Math.abs(p.x - train.x) < 85) {
      commandGame(s, 'interact'); move = 0;
    } else if (train.brakeWorking) {
      move = Math.abs(p.x - train.x) > 175 ? Math.sign(train.x - p.x) : 0;
    } else if (train.stopped && Math.abs(p.x - s.evidence.x) < 80 && (!c.manifestRead || !s.decision.resolved)) {
      commandGame(s, 'interact'); move = 0;
    }
    const vent = p.heat > 75 || p.overheated;
    const rocketSafe = target && [train, ...train.wagons].every(part => part.destroyed || Math.hypot(target.x - part.x, target.y - part.y) > 230);
    const projectileInFlight = s.projectiles.some(shot => shot.team === 'player');
    const input = { move, brace: !move, vent, fire: Boolean(target) && !vent && !projectileInFlight,
      secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !projectileInFlight, aimX: target?.x, aimY: target?.y };
    updateGame(s, 1 / 60, input);
    observe?.(s, frame);
  }
  return s;
}
