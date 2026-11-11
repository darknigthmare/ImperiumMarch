import { commandGame, updateGame, dikeSupportReady } from '../../src/simulation.mjs';

export function captureMI06Scene(s, metadata = {}) {
  return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, state: s });
}

// The driver issues the same controls as a player. No positions, health, time,
// mission facts or stocks are edited, including deliberate loss scenarios.
export function dikeClearLine(s, target) {
  const p = s.player, originX = p.x + 9, originY = p.y + 8;
  const distance = Math.hypot(target.x - originX, target.y - originY);
  const muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (distance < muzzle + 15) return false;
  const fromX = originX + (target.x - originX) * muzzle / distance;
  const fromY = originY + (target.y - originY) * muzzle / distance;
  for (const item of [...s.dike.houses, ...s.dike.covers, s.dike.panel, s.dike.auxiliary,
    ...s.dike.technicians, ...s.dike.residents.filter(r => r.phase === 'evacuating')]) {
    if (item === target || item.destroyed || item.alive === false || item.safe) continue;
    let low = 0, high = 1;
    for (const [origin, delta, center, size] of [[fromX, target.x - fromX, item.x, item.w], [fromY, target.y - fromY, item.y, item.h]]) {
      const min = center - size / 2 - 12, max = center + size / 2 + 12;
      if (Math.abs(delta) < 1e-8) { if (origin < min || origin > max) { high = -1; break; } }
      else {
        let a = (min - origin) / delta, b = (max - origin) / delta;
        if (a > b) [a, b] = [b, a];
        low = Math.max(low, a); high = Math.min(high, b);
      }
    }
    if (low <= high) return false;
  }
  return true;
}

export function pilotMI06(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 60000,
  useAuxiliary = true, skipAuxiliary = false, skipEvacuation = false, manualShoring = false,
  killTechnicians = false, destroyPanel = false, destroyAuxiliary = false, destroyHouse = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.dike, c = s.campaign, p = s.player, settings = s.mission.dike;
    const house = d.houses.find(h => !h.inspected);
    let job = house ? { kind: 'house', x: house.x, object: house }
      : !skipEvacuation && !c.evacuationOrdered ? { kind: 'evacuate', x: d.houses[1].x }
      : d.technicians.some(t => t.alive && !t.called) ? { kind: 'call', x: settings.callX }
      : useAuxiliary && !skipAuxiliary && c.context.fuelAvailable === 2 && !d.auxiliary.connected && !d.auxiliary.destroyed ? { kind: 'auxiliary', x: d.auxiliary.x }
      : !c.panelSecured ? { kind: 'support', x: d.panel.supportX }
      : !c.manifestRead || !s.decision.resolved || !d.valve.completed ? { kind: 'valve', x: d.valve.x }
      : !skipEvacuation && !c.evacuationOrdered ? { kind: 'evacuate', x: d.valve.x }
      : null;
    let destructiveTarget = destroyHouse && d.houses.find(h => !h.destroyed && (h.id === destroyHouse || destroyHouse === true))
      || killTechnicians && d.technicians.filter(t => t.alive && t.called && t.x > 1845).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0]
      || destroyPanel && !d.panel.destroyed && c.thresholdsInspected === 2 && d.panel
      || destroyAuxiliary && !d.auxiliary.destroyed && d.auxiliary.connected && d.auxiliary;
    if (destructiveTarget && job && destructiveTarget.x > job.x + 440) destructiveTarget = null;
    if (d.technicians.includes(destructiveTarget) && s.enemies.some(e => !e.dead && e.x > d.panel.x && e.x < d.panel.workX + 1200)) destructiveTarget = null;
    let destination = destructiveTarget ? destructiveTarget.x + (d.technicians.includes(destructiveTarget) ? -110 : 260)
      : job?.kind === 'support' ? job.x
      : job?.kind === 'call' ? job.x + 40
      : job ? job.x - 120 : s.extraction.x;
    // Clear the far side of the tall panel before asking the technicians to
    // leave cover. Walking around it is a real route, not shooting through it.
    if (job?.kind === 'support' && !destructiveTarget) {
      const beyond = s.enemies.find(e => !e.dead && e.x > d.panel.x && e.x < d.panel.workX + 1200);
      if (beyond) destination = Math.max(d.panel.x + 260, beyond.x + 220);
    }
    let move = Math.abs(destination - p.x) > (job?.kind === 'support' ? 42 : 15) ? Math.sign(destination - p.x) : 0;
    const enemies = s.enemies.filter(e => !e.dead && e.active && Math.abs(e.x - p.x) < 1000 && dikeClearLine(s, e))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const enemy = enemies[0];
    const target = enemy || (destructiveTarget && dikeClearLine(s, destructiveTarget) ? destructiveTarget : null);
    if (target && Math.abs(target.x - p.x) < 620) move = 0;
    if (job && !destructiveTarget && Math.abs(p.x - job.x) < 168 && job.kind !== 'support' && (job.kind !== 'call' || c.evacuationOrdered || p.x > d.houses[1].x + settings.interactionRadius)) {
      commandGame(s, 'interact'); move = 0;
    }
    if (job?.kind === 'support' && Math.abs(p.x - destination) < 55 && destination === job.x) {
      move = 0;
      if ((manualShoring || !c.techniciansAlive || d.panel.destroyed) && dikeSupportReady(s)) commandGame(s, 'interact');
    }
    const vent = p.heat > 75 || p.overheated;
    const flight = s.projectiles.some(shot => shot.team === 'player');
    const protectedParts = [...d.houses, ...d.covers, d.panel, d.auxiliary, ...d.technicians,
      ...d.residents.filter(r => r.phase === 'evacuating')].filter(part => part !== target && !part.destroyed && part.alive !== false && !part.safe);
    const rocketSafe = target && protectedParts.every(part => Math.hypot(part.x - target.x, part.y - target.y) > 280);
    updateGame(s, 1 / 60, { move, brace: !move, vent,
      fire: Boolean(target) && !vent && !flight,
      secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !flight,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
