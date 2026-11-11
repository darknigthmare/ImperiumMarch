import { commandGame, updateGame } from '../../src/simulation.mjs';

export function captureMI07Scene(s, metadata = {}) {
  return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, state: s });
}

function protectedParts(s) {
  const a = s.ambulance;
  return [a.vehicle, a.cargo, a.beacon, ...a.barriers, ...a.staff, ...a.patients]
    .filter(part => !part.destroyed && !part.recovered && !part.cleared && part.alive !== false && !part.safe && part.phase !== 'aboard');
}

export function ambulanceClearLine(s, target, aimY = target.y) {
  const p = s.player, ox = p.x + 9, oy = p.y + 8;
  const distance = Math.hypot(target.x - ox, aimY - oy);
  const muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (distance < muzzle + 18) return false;
  const fx = ox + (target.x - ox) * muzzle / distance, fy = oy + (aimY - oy) * muzzle / distance;
  for (const item of protectedParts(s)) {
    if (item === target) continue;
    let low = 0, high = 1;
    for (const [origin, delta, center, size] of [[fx, target.x - fx, item.x, item.w], [fy, aimY - fy, item.y, item.h]]) {
      const min = center - size / 2 - 6, max = center + size / 2 + 6;
      if (Math.abs(delta) < 1e-8) { if (origin < min || origin > max) { high = -1; break; } }
      else { let a = (min - origin) / delta, b = (max - origin) / delta; if (a > b) [a, b] = [b, a]; low = Math.max(low, a); high = Math.min(high, b); }
    }
    if (low <= high) return false;
  }
  return true;
}

// Public movement, aiming and E/choice commands only, including loss scenarios.
export function pilotMI07(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 90000,
  skipWitness = false, skipMara = false, skipTechnical = false,
  destroyVehicle = false, destroyCargo = false, destroyBeacon = false, killStaff = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const a = s.ambulance, c = s.campaign, p = s.player, settings = s.mission.ambulance;
    const reception = a.receptions.find(r => r.kind === c.destination);
    const barrier = a.barriers.find(b => !b.cleared && !b.destroyed);
    const liveStaff = a.staff.filter(t => t.alive && !t.safe);
    const driver = a.staff.find(t => t.role === 'driver');
    const needsTow = a.vehicle.called && !a.vehicle.destroyed && !driver.alive && !a.vehicle.towing;
    let job = !a.vehicle.called ? { kind: 'call', x: settings.callX }
      : barrier ? { kind: 'barrier', x: barrier.x }
      : needsTow ? { kind: 'tow', x: a.vehicle.x }
      : !a.vehicle.stopReached && !a.vehicle.destroyed ? { kind: 'wait-stop', x: a.vehicle.towing ? a.vehicle.x + 220 : settings.stopX - 220 }
      : !a.consent.obtained && !a.cargo.inspected && !a.cargo.destroyed && liveStaff.length ? { kind: 'consent', x: a.vehicle.x }
      : !a.cargo.inspected ? { kind: 'cargo', x: a.cargo.x }
      : !a.beacon.resolved ? { kind: 'beacon', x: a.beacon.x }
      : !skipWitness && !a.witness.obtained && liveStaff.length && !a.handover.ordered ? { kind: 'witness', x: a.vehicle.x + 185 }
      : !c.manifestRead || !s.decision.resolved ? { kind: 'report', x: s.evidence.x }
      : !skipMara && !a.mara.contacted ? { kind: 'mara', x: a.mara.x }
      : !skipTechnical && a.technical.available && !a.technical.contacted ? { kind: 'technical', x: a.technical.x }
      : !a.ramp.prepared ? { kind: 'ramp', x: a.ramp.x }
      : !reception.ready ? { kind: 'reception', x: reception.x }
      : !a.handover.ordered ? { kind: 'order', x: reception.x }
      : !a.vehicle.arrived && !a.vehicle.destroyed ? { kind: 'escort', x: a.vehicle.x + 220 }
      : !a.handover.completed ? { kind: 'handover', x: a.vehicle.destroyed ? reception.x : a.vehicle.x + 85 }
      : !c.transferResolved ? { kind: 'wait-people', x: reception.x - 120 }
      : null;
    let destructiveTarget = destroyVehicle && !a.vehicle.destroyed ? a.vehicle
      : a.vehicle.stopReached && destroyCargo && !a.cargo.destroyed && !a.cargo.inspected ? a.cargo
      : a.vehicle.stopReached && destroyBeacon && !a.beacon.destroyed && !a.beacon.recovered ? a.beacon
      : killStaff && liveStaff.some(t => t.phase === 'outside') ? liveStaff.filter(t => t.phase === 'outside').sort((u, v) => Math.abs(u.x - p.x) - Math.abs(v.x - p.x))[0] : null;
    let destination = destructiveTarget ? destructiveTarget.x + (destructiveTarget.role === 'medic' ? 240 : -230)
      : job?.kind === 'ramp' ? job.x + 120
      : job?.kind === 'technical' && skipMara ? job.x + 130
      : ['wait-stop', 'escort', 'wait-people'].includes(job?.kind) ? job.x
      : job ? job.x - 120 : s.extraction.x;
    let move = Math.abs(destination - p.x) > 35 ? Math.sign(destination - p.x) : 0;
    const enemies = s.enemies.filter(e => !e.dead && e.active && (!e.id.startsWith('seizure-drone-') || a.raidTriggered)
      && Math.abs(e.x - p.x) < 1050 && ambulanceClearLine(s, e)).sort((u, v) => Math.abs(u.x - p.x) - Math.abs(v.x - p.x));
    const destructiveY = destructiveTarget === a.beacon ? a.beacon.y - a.beacon.h / 2 + 2 : destructiveTarget?.y;
    const target = enemies[0] || (destructiveTarget && ambulanceClearLine(s, destructiveTarget, destructiveY) ? destructiveTarget : null);
    const aimY = target === destructiveTarget ? destructiveY : target?.y;
    if (target && Math.abs(target.x - p.x) < 630) move = 0;
    const optionalCollision = (job?.kind === 'technical' && skipMara && !a.mara.contacted && Math.abs(p.x - a.mara.x) < 175)
      || job?.kind === 'ramp' && (skipMara && !a.mara.contacted && Math.abs(p.x - a.mara.x) < 175
      || skipTechnical && a.technical.available && !a.technical.contacted && Math.abs(p.x - a.technical.x) < 175);
    const readyReport = job?.kind !== 'report' || !s.enemies.some(e => !e.dead && e.active && Math.abs(e.x - p.x) < 1050);
    if (job && !destructiveTarget && !['wait-stop', 'escort', 'wait-people'].includes(job.kind)
        && Math.abs(p.x - job.x) < 168 && !optionalCollision && readyReport) {
      commandGame(s, 'interact'); move = 0;
    }
    const vent = p.heat > 75 || p.overheated, flight = s.projectiles.some(shot => shot.team === 'player');
    const rocketSafe = target && protectedParts(s).filter(part => part !== target).every(part => Math.hypot(part.x - target.x, part.y - target.y) > 280);
    updateGame(s, 1 / 60, { move, brace: !move, vent,
      fire: Boolean(target) && !vent && !flight,
      secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !flight,
      aimX: target?.x, aimY });
    observe?.(s, frame);
  }
  return s;
}
