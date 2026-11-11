import { commandGame, updateGame, departureGateBounds } from '../../src/simulation.mjs';

export function captureMI08Scene(s, metadata = {}) {
  return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, state: s });
}

function protectedParts(s) {
  const d = s.departure;
  return [...d.locks.filter(gate => !gate.destroyed).map(gate => ({ ...departureGateBounds(gate), original: gate })),
    ...d.locks.map(gate => gate.mechanism), ...d.boats.filter(boat => !boat.departed), ...d.ramps, d.quay, d.refugeRadio, d.registry,
    ...d.people.filter(person => person.alive && !person.safe && !['origin', 'offsite', 'aboard', 'en-route', 'landing'].includes(person.phase))]
    .filter(part => !part.destroyed);
}

export function departureClearLine(s, target) {
  const p = s.player, ox = p.x + 9, oy = p.y + 8;
  const distance = Math.hypot(target.x - ox, target.y - oy), muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (distance < muzzle + 18) return false;
  const fx = ox + (target.x - ox) * muzzle / distance, fy = oy + (target.y - oy) * muzzle / distance;
  for (const item of protectedParts(s)) {
    if (item === (target.original || target) || item.original === (target.original || target)) continue;
    let low = 0, high = 1;
    for (const [origin, delta, center, size] of [[fx, target.x - fx, item.x, item.w], [fy, target.y - fy, item.y, item.h]]) {
      const min = center - size / 2 - 5, max = center + size / 2 + 5;
      if (Math.abs(delta) < 1e-8) { if (origin < min || origin > max) { high = -1; break; } }
      else { let a = (min - origin) / delta, b = (max - origin) / delta; if (a > b) [a, b] = [b, a]; low = Math.max(low, a); high = Math.min(high, b); }
    }
    if (low <= high) return false;
  }
  return true;
}

// Every outcome uses movement, aiming, firing, interaction and choice commands.
// There are no setters for positions, health, time, people or mission results.
export function pilotMI08(s, { choice = 'delay', stopAt = null, observe = null, maxFrames = 150000,
  destroyIntake = false, destroyPassage = false, destroyBoats = false,
  destroyRegistry = false, destroyRefugeRadio = false, destroyRamp = false,
  killTechnicians = false, killHarbourmaster = false, killMara = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.departure, c = s.campaign, p = s.player, settings = s.mission.departure;
    const baseEnemies = s.enemies.filter(enemy => !enemy.dead && !enemy.id.startsWith('aval-control-drone-'));
    const visibleEnemies = s.enemies.filter(enemy => !enemy.dead && enemy.active
      && (!enemy.id.startsWith('aval-control-drone-') || d.alert.triggered) && Math.abs(enemy.x - p.x) < 1100 && departureClearLine(s, enemy))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const exposed = role => d.people.filter(person => person.role === role && person.alive && !person.safe && !['origin', 'offsite', 'aboard', 'en-route', 'landing'].includes(person.phase));
    const destructiveTarget = destroyIntake && !d.locks[0].mechanism.destroyed ? d.locks[0].mechanism
      : destroyPassage && !d.locks[1].mechanism.destroyed ? d.locks[1].mechanism
      : destroyBoats && d.boats.some(boat => !boat.destroyed && !boat.departed) ? d.boats.find(boat => !boat.destroyed && !boat.departed)
      : destroyRegistry && !d.registry.destroyed && !d.registry.inspected ? d.registry
      : destroyRefugeRadio && !d.refugeRadio.destroyed && !d.refugeRadio.resolved ? d.refugeRadio
      : destroyRamp && !d.ramps[destroyRamp === 2 ? 1 : 0].destroyed ? d.ramps[destroyRamp === 2 ? 1 : 0]
      : killTechnicians && exposed('technician').length ? exposed('technician')[0]
      : killHarbourmaster && exposed('harbourmaster').length ? exposed('harbourmaster')[0]
      : killMara && exposed('mara').length ? exposed('mara')[0] : null;
    const intake = d.locks[0], passage = d.locks[1];
    const origin = d.origins.find(origin => !origin.resolved);
    const ramp = d.ramps.find(ramp => !ramp.prepared && !ramp.destroyed);
    const activeMembers = boat => d.people.filter(person => person.boatId === boat.id && person.alive && !person.safe);
    const pendingBoats = d.boats.some(boat => !boat.destroyed && !boat.departed && !boat.returned
      && activeMembers(boat).some(person => person.destination === 'refuge'));
    const passageTarget = c.plan === 'close' ? 0 : c.plan === 'open' ? 1 : d.boarding.assigned && !pendingBoats ? 0 : 1;
    const stranded = d.boarding.assigned && !d.boarding.recallOrdered && d.people.some(person => person.alive && !person.departed && !person.safe && person.role !== 'technician')
      && ((passage.destroyed || passage.mechanism.destroyed) && passage.opening < .85
        || d.boats.some((boat, index) => !boat.departed && activeMembers(boat).length && (boat.destroyed || !boat.available || d.ramps[index].destroyed
          || activeMembers(boat).some(person => person.role === 'patient') && !activeMembers(boat).some(person => ['staff', 'mara'].includes(person.role)))));
    // A drone may hover behind a raised gate. Walk far enough past it to draw
    // it out of cover instead of firing through the panel or waiting forever.
    let job = baseEnemies.length ? { kind: 'clear', x: baseEnemies.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0].x + (visibleEnemies.length ? 240 : 760) }
      : !intake.inspected || (intake.destroyed || intake.mechanism.destroyed) && !intake.damageNoted ? { kind: 'intake', x: intake.controlX }
      : !d.technical.resolved ? { kind: 'technical', x: d.technical.x }
      : (intake.destroyed || intake.mechanism.destroyed) && !intake.sealed ? { kind: 'seal', x: intake.controlX }
      : !intake.destroyed && !intake.mechanism.destroyed && intake.opening > .000001 ? { kind: 'intake', x: intake.controlX }
      : origin ? { kind: 'origin', x: origin.x }
      : !d.quay.resolved ? { kind: 'quay', x: d.quay.x }
      : !d.refugeRadio.resolved ? { kind: 'refuge', x: d.refugeRadio.x }
      : !d.vann.resolved || !d.mara.resolved ? { kind: 'service', x: settings.serviceX }
      : !d.shelter.prepared ? { kind: 'shelter', x: d.shelter.x }
      : ramp ? { kind: 'ramp', x: ramp.x }
      : !passage.inspected || (passage.destroyed || passage.mechanism.destroyed) && !passage.damageNoted ? { kind: 'passage', x: passage.controlX }
      : !d.registry.inspected || !s.decision.resolved ? { kind: 'registry', x: d.registry.x }
      : !d.boarding.assigned ? { kind: 'allocation', x: d.quay.x }
      : stranded || d.boarding.recallOrdered && d.boarding.progress < 1 ? { kind: 'recall', x: d.shelter.x }
      : !passage.destroyed && !passage.mechanism.destroyed && Math.abs(passage.opening - passageTarget) > .000001 ? { kind: 'passage', x: passage.controlX }
      : d.people.some(person => !['offsite', 'arrived', 'local', 'lost'].includes(person.phase)) ? { kind: 'wait', x: passage.controlX + 240 }
      : !d.report.transmitted ? { kind: 'report', x: d.registry.x }
      : null;
    const destructiveAim = destructiveTarget && d.ramps.includes(destructiveTarget)
      ? { ...destructiveTarget, x: destructiveTarget.x - 30, original: destructiveTarget } : destructiveTarget;
    let destination = baseEnemies.length ? job.x
      : destructiveTarget ? destructiveTarget.x + (destructiveTarget.role === 'harbourmaster' ? 185 : -240)
      : job?.kind === 'ramp' ? job.x + 95
      : job ? job.x - 110 : s.extraction.x;
    let move = Math.abs(destination - p.x) > 28 ? Math.sign(destination - p.x) : 0;
    const target = visibleEnemies[0] || (!baseEnemies.length && destructiveAim && departureClearLine(s, destructiveAim) ? destructiveAim : null);
    if (target && Math.abs(target.x - p.x) < 650) move = 0;
    const rampOverlap = job?.kind === 'ramp' && Math.abs(p.x - d.shelter.x) < settings.interactionRadius;
    const reportReady = job?.kind !== 'registry' || !s.enemies.some(enemy => !enemy.dead && enemy.active && Math.abs(enemy.x - p.x) < 1100);
    if (job && !baseEnemies.length && !destructiveTarget && !['clear', 'wait'].includes(job.kind)
        && Math.abs(p.x - job.x) < 150 && !rampOverlap && reportReady) {
      commandGame(s, 'interact'); move = 0;
    }
    const vent = p.heat > 75 || p.overheated, flight = s.projectiles.some(shot => shot.team === 'player');
    const rocketSafe = target && protectedParts(s).filter(part => part !== (target.original || target) && part.original !== (target.original || target))
      .every(part => Math.hypot(part.x - target.x, part.y - target.y) > 280);
    updateGame(s, 1 / 60, { move, brace: !move, vent,
      fire: Boolean(target) && !vent && !flight, secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !flight,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
