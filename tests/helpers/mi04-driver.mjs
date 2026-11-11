import { commandGame, updateGame, terrainAt } from '../../src/simulation.mjs';

// All progress comes from public input. No mission flags, HP or coordinates are
// rewritten by the pilot. Post destruction uses real, travel-time projectiles.
function clearLine(s, target) {
  const post = s.industrial.post, p = s.player;
  if (post.destroyed || target === post) return true;
  if ((post.x - p.x) * (post.x - target.x) >= 0) return true;
  const y = p.y + 8 + (target.y - p.y - 8) * (post.x - p.x) / (target.x - p.x);
  return y > terrainAt(post.x, s.planetId) + 8 || Math.abs(y - post.y) > post.h / 2 + 28;
}

export function pilotMI04(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 40000,
  skipContact = false, destroyPost = false, allowRetreat = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const p = s.player, c = s.campaign, site = s.industrial;
    const work = !site.pump.connected ? site.pump : site.turbines.find(t => !t.cooled)
      || (!skipContact && site.contact.available && !site.contact.contacted ? site.contact : null);
    const destruction = destroyPost && !site.post.destroyed && c.turbinesCooled === 2;
    const destination = work ? work.x - 140 : destruction ? site.post.x - 410
      : !c.maintenanceInspected || !s.decision.resolved ? site.post.x - 120 : s.extraction.x;
    let move = Math.abs(destination - p.x) > 15 ? Math.sign(destination - p.x) : 0;
    const target = s.enemies.filter(item => !item.dead && item.active &&
      !(item.id === 'private-hauler' && (site.retreatEscaped || allowRetreat)) && Math.abs(item.x - p.x) < 950 && clearLine(s, item) &&
      (!allowRetreat || s.enemies.every(other => other.id !== 'private-hauler' || other.dead || site.retreatEscaped ||
        (other.x - p.x) * (other.x - item.x) >= 0)))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0]
      || (destruction && Math.abs(p.x - destination) < 90 ? site.post : null);
    if (target && Math.abs(target.x - p.x) < 590) move = 0;
    if (work && Math.abs(p.x - work.x) < 175) {
      commandGame(s, 'interact'); move = 0;
    } else if (!work && !destruction && Math.abs(p.x - site.post.x) < 170 && (!c.maintenanceInspected || !s.decision.resolved)) {
      commandGame(s, 'interact'); move = 0;
    }
    const vent = p.heat > 75 || p.overheated;
    const flight = s.projectiles.some(shot => shot.team === 'player');
    const rocketSafe = target && (target === site.post || site.post.destroyed || Math.hypot(target.x - site.post.x, target.y - site.post.y) > 280);
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: Boolean(target) && !vent && !flight,
      secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !flight,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
