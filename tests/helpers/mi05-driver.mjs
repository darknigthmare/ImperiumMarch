import { commandGame, updateGame } from '../../src/simulation.mjs';

// Public controls only: route selection, live aiming, timed interactions and reporting.
// Protected hulls are checked before aiming; no positions, health or mission facts are edited.
export function channelClearLine(s, target) {
  const p = s.player;
  for (const part of [...s.channel.barges, s.channel.boat, s.channel.fuel]) {
    if (part === target || part.destroyed || part.arrived || part.collected) continue;
    if ((part.x - p.x) * (part.x - target.x) >= 0) continue;
    const y = p.y + 8 + (target.y - p.y - 8) * (part.x - p.x) / (target.x - p.x);
    if (Math.abs(y - part.y) < part.h / 2 + 22) return false;
  }
  return true;
}

export function pilotMI05(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 50000,
  skipBridges = false, skipFuel = false, destroyBarge = null, shootWinches = false, destroyFuel = false, destroyBoat = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const p = s.player, c = s.campaign, site = s.channel;
    const jobs = [
      ...(!skipBridges ? site.banks.filter(b => !b.bridgeRaised).map(b => ({ kind: 'bridge', object: b, x: b.stationX })) : []),
      ...site.winches.filter(w => !w.released).map(w => ({ kind: 'winch', object: w, x: w.x })),
      ...site.barges.filter(b => !b.inspected).map(b => ({ kind: 'barge', object: b, x: b.x })),
      ...(!skipFuel && !site.fuel.collected && !site.fuel.destroyed ? [{ kind: 'fuel', object: site.fuel, x: site.fuel.x }] : []),
    ].sort((a, b) => a.x - b.x);
    const job = jobs[0];
    let destruction = destroyBarge && site.barges.find(b => b.kind === destroyBarge && !b.destroyed && !b.inspected)
      || (destroyFuel && !site.fuel.destroyed && !site.fuel.collected ? site.fuel : null)
      || (destroyBoat && !site.boat.destroyed && !site.boat.arrived ? site.boat : null)
      || (shootWinches && job?.kind === 'winch' ? job.object : null);
    // A specific fault scenario takes over only when the corresponding station is reached.
    if (destruction && job && destruction.x > job.x + 390) destruction = null;
    const destination = destruction ? destruction.x - 340 : job ? job.x - 120
      : !c.manifestRead || !s.decision.resolved ? s.evidence.x - (skipFuel ? 10 : 120) : s.extraction.x;
    let move = Math.abs(destination - p.x) > 15 ? Math.sign(destination - p.x) : 0;
    const enemy = s.enemies.filter(e => !e.dead && e.active && Math.abs(e.x - p.x) < 950 && channelClearLine(s, e))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const target = enemy || (destruction && Math.abs(p.x - destination) < 100 ? destruction : null);
    if (target && Math.abs(target.x - p.x) < 590) move = 0;
    if (!destruction && job && Math.abs(p.x - job.x) < 170) { commandGame(s, 'interact'); move = 0; }
    else if (!job && !destruction && Math.abs(p.x - s.evidence.x) < 170 && (!skipFuel || Math.abs(p.x - site.fuel.x) >= 180) && (!c.manifestRead || !s.decision.resolved)) { commandGame(s, 'interact'); move = 0; }
    const vent = p.heat > 75 || p.overheated, flight = s.projectiles.some(shot => shot.team === 'player');
    const protectedParts = [...site.barges, site.boat, site.fuel].filter(part => part !== target && !part.destroyed && !part.arrived && !part.collected);
    const rocketSafe = target && protectedParts.every(part => Math.hypot(part.x - target.x, part.y - target.y) > 290);
    updateGame(s, 1 / 60, { move, brace: !move, vent,
      fire: Boolean(target) && !vent && !flight,
      secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !flight,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
