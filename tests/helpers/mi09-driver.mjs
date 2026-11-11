import { commandGame, updateGame } from '../../src/simulation.mjs';

export function captureMI09Scene(s, metadata = {}) {
  return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, state: s });
}

function protectedParts(s) {
  const d = s.livingRoute;
  return [...d.columns, ...d.roots, ...d.homes,
    ...d.migrators.filter(animal => !['arrived', 'displaced', 'lost'].includes(animal.phase)),
    ...(d.barrier.opening < .85 ? [d.barrier] : []), ...(!d.logistics.arrived ? [d.logistics] : [])].filter(part => !part.destroyed);
}

export function livingRouteClearLine(s, target) {
  const p = s.player, ox = p.x + 9, oy = p.y + 8;
  const distance = Math.hypot(target.x - ox, target.y - oy), muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (distance < muzzle + 18) return false;
  const fx = ox + (target.x - ox) * muzzle / distance, fy = oy + (target.y - oy) * muzzle / distance;
  for (const item of protectedParts(s)) {
    if (item === target || item === target.original) continue;
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

// Public controls only. No teleport, health edit, clock setter or mission setter.
export function pilotMI09(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 100000,
  skipLocals = false, leaveLightsOn = false, destroyColumn = 0, destroyRoot = 0, destroyHome = 0,
  destroyBarrier = false, killMigrators = 0, destroyLogistics = false, noFire = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.livingRoute, c = s.campaign, p = s.player;
    const enemies = d.alert.triggered ? s.enemies.filter(e => e.id.startsWith('thyr-sniper-') && !e.dead) : [];
    const visible = enemies.filter(e => e.active && Math.abs(e.x - p.x) < 1000 && livingRouteClearLine(s, e))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const column = destroyColumn ? d.columns[Number(destroyColumn) - 1] : null;
    const root = destroyRoot ? d.roots[Number(destroyRoot) - 1] : null;
    const home = destroyHome ? d.homes[Number(destroyHome) - 1] : null;
    const animal = killMigrators ? d.migrators.slice(0, Number(killMigrators)).find(item => !item.destroyed && !['arrived', 'displaced'].includes(item.phase)) : null;
    const destructive = column && !column.destroyed ? column : root && !root.destroyed ? root : home && !home.destroyed ? home
      : destroyBarrier && !d.barrier.destroyed ? d.barrier : animal
        || (destroyLogistics && c.migrationResolved && !d.logistics.destroyed && !d.logistics.arrived ? d.logistics : null);
    let job = !skipLocals && !d.contact.heard ? { kind: 'contact', x: d.contact.x }
      : !d.approach.prepared || !skipLocals && d.approach.kind !== 'guided' ? { kind: 'approach', x: d.approach.x }
      : destructive ? { kind: 'damage', x: destructive.x }
      : !leaveLightsOn && d.lights.on ? { kind: 'lights', x: d.lights.x }
      : !d.maps.inspected || !s.decision.resolved ? { kind: 'maps', x: d.maps.x }
      : !d.barrier.operated ? { kind: 'barrier', x: d.barrier.controlX }
      : !c.migrationResolved ? { kind: 'migration', x: d.barrier.controlX - 260 }
      : !d.logistics.released ? { kind: 'dispatch', x: d.logistics.controlX }
      : enemies.length ? { kind: 'combat', x: enemies[0].x - 220 }
      : !d.logistics.arrived ? { kind: 'escort', x: Math.min(5900, d.logistics.x + 420) }
      : !d.report.transmitted ? { kind: 'report', x: d.report.x }
      : { kind: 'extract', x: s.extraction.x };
    let destination = job.x;
    if (job.kind === 'damage') destination = destructive.x + (d.homes.includes(destructive) ? 330 : -280);
    else if (job.kind === 'combat') {
      // Cross an occluding column rather than fire through its supporting trunk.
      if (!visible.length) destination = enemies[0].x - 190;
    } else if (!['migration', 'escort', 'extract'].includes(job.kind)) destination = job.x - 60;
    let move = Math.abs(destination - p.x) > 24 ? Math.sign(destination - p.x) : 0;
    const destructiveAim = destructive && d.roots.includes(destructive) ? { ...destructive, x: destructive.x - destructive.w / 2 + 24, original: destructive } : destructive;
    const target = noFire ? null : visible[0] || (job.kind === 'damage' && livingRouteClearLine(s, destructiveAim) ? destructiveAim : null);
    if (target && Math.abs(target.x - p.x) < 700 && (job.kind !== 'damage' || Math.abs(p.x - destination) < 90)) move = 0;
    if (!['damage', 'migration', 'combat', 'escort', 'extract'].includes(job.kind) && Math.abs(p.x - job.x) < 140) { commandGame(s, 'interact'); move = 0; }
    const vent = p.heat > 75 || p.overheated;
    const inFlight = s.projectiles.some(shot => shot.team === 'player');
    const rocketSafe = target && protectedParts(s).filter(part => part !== target && part !== target?.original).every(part => Math.hypot(part.x - target.x, part.y - target.y) > 260);
    updateGame(s, 1 / 60, { move, brace: !move, vent,
      fire: Boolean(target) && !vent && !inFlight, secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !inFlight,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
