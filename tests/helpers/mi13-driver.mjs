import { commandGame, updateGame } from '../../src/simulation.mjs';
import { foundrySolids } from '../../src/foundry-simulation.mjs';

export function captureMI13Scene(s, metadata = {}) { return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId, elapsed: s.elapsed, playerX: s.player.x, state: s }); }
const parts = s => foundrySolids(s).filter(part => !part.destroyed);
const exposedAim = part => part?.id === 'foundry-carrier'
  ? { ...part, x: part.x - part.w / 2 + 2, y: part.y + part.h / 2 - 4, original: part }
  : part?.id.startsWith('foundry-cargo-')
    ? { ...part, x: part.x - part.w / 2 + 5, y: part.y - part.h / 2 + 5, original: part }
  : part;
export function foundryClearLine(s, target) {
  const p = s.player, ox = p.x + 9, oy = p.y + 8, distance = Math.hypot(target.x - ox, target.y - oy);
  const muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (distance < muzzle + 18) return false;
  const fx = ox + (target.x - ox) * muzzle / distance, fy = oy + (target.y - oy) * muzzle / distance;
  for (const part of parts(s)) {
    if (part === target || part === target.original) continue;
    let low = 0, high = 1;
    for (const [origin, delta, center, size] of [[fx, target.x - fx, part.x, part.w], [fy, target.y - fy, part.y, part.h]]) {
      const min = center - size / 2 - 3, max = center + size / 2 + 3;
      if (Math.abs(delta) < 1e-8) { if (origin < min || origin > max) { high = -1; break; } }
      else { let a = (min - origin) / delta, b = (max - origin) / delta; if (a > b) [a, b] = [b, a]; low = Math.max(low, a); high = Math.min(high, b); }
    }
    if (low <= high) return false;
  }
  return true;
}
export function moveMI13(s, x, { maxFrames = 18000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active && Math.abs(s.player.x - x) > 25; frame++) {
    updateGame(s, 1 / 60, { move: Math.sign(x - s.player.x), vent: s.player.heat > 75 || s.player.overheated }); observe?.(s, frame);
  }
  return s;
}
export function fireAtMI13(s, id, { maxFrames = 18000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active; frame++) {
    const target = exposedAim(parts(s).find(part => part.id === id));
    if (!target) break;
    const p = s.player, destination = target.x - 330, canFire = foundryClearLine(s, target) && Math.abs(p.x - destination) < 110;
    const move = canFire ? 0 : Math.abs(p.x - destination) > 25 ? Math.sign(destination - p.x) : 0;
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: canFire && !vent && !flying, aimX: target.x, aimY: target.y }); observe?.(s, frame);
  }
  return s;
}

/** All progress below comes from ordinary commands and simulated frames. */
export function pilotMI13(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 180000,
  noFire = false, skipValves = false, destroyCargoBeforeCopy = false, destroyManifestBeforeCopy = false,
  destroyCargoAfterCopy = false, destroyManifestAfterCopy = false, destroyCarrier = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.foundry, f = s.campaign, cfg = s.mission.foundry, p = s.player;
    const enemies = d.alert.ready ? s.enemies.filter(e => e.id.startsWith('foundry-private-') && !e.dead) : [];
    const visible = enemies.filter(e => Math.abs(e.x - p.x) < 1000 && foundryClearLine(s, e)).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const damageBody = destroyCarrier && d.carrier.released && !d.carrier.destroyed ? d.carrier
      : destroyManifestBeforeCopy && !d.manifest.inspected && !d.manifest.destroyed ? d.manifest
      : destroyManifestAfterCopy && d.manifest.copied && !d.manifest.destroyed ? d.manifest
      : destroyCargoBeforeCopy && d.alert.ready && !d.cargo[0].inspected && !d.cargo[0].destroyed ? d.cargo[0]
      : destroyCargoAfterCopy && f.pt03Acquired ? d.cargo.find(c => !c.destroyed) : null;
    const damage = exposedAim(damageBody);
    const valve = !skipValves && d.bridges.find(b => !b.circuitOpen && !b.valve.destroyed);
    const cargo = d.alert.ready ? d.cargo.find(c => !c.inspected) : null;
    const pending = d.cargo.find(c => !c.transferred && !c.destroyed);
    const bay = d.bays.find(b => b.kind === f.plan);
    let task = damage ? { kind: 'damage', x: damage.x - 330, target: damage }
      : !d.manifest.inspected && !destroyManifestBeforeCopy ? { kind: 'manifest', x: d.manifest.x }
      : !d.carrier.released ? { kind: 'release', x: d.carrier.x }
      : valve && (valve.valve.x < p.x + 900 || !d.alert.ready) ? { kind: 'valve', x: valve.valve.x }
      : visible.length ? { kind: 'combat', x: visible[0].x - 330 }
      : enemies.length ? { kind: 'combat', x: enemies[0].x - 330 }
      : !d.alert.ready ? { kind: 'escort', x: cfg.ambushX + 170 }
      : !d.manifest.inspected ? { kind: 'manifest', x: d.manifest.x }
      : cargo ? { kind: 'mark', x: cargo.x }
      : !d.analysis.completed ? { kind: 'analysis', x: d.carrier.x }
      : !s.decision.resolved ? { kind: 'orders', x: d.orders.x }
      : !d.carrier.arrived ? { kind: 'escort', x: bay.x + 300 }
      : pending ? { kind: 'transfer', x: bay.postX }
      : !d.report.transmitted ? { kind: 'report', x: d.report.x }
      : { kind: 'extract', x: s.extraction.x };
    let destination = ['damage', 'combat', 'escort', 'extract'].includes(task.kind) ? task.x : task.x - 80;
    let waitingForEscort = false;
    // Keep the live escort within range; the driver never moves the carrier.
    if (d.carrier.released && !d.carrier.arrived && !s.decision.resolved && task.kind === 'orders' && d.carrier.x < cfg.holdingX - 15) task = { kind: 'escort', x: cfg.holdingX + 300 }, destination = task.x;
    if (d.carrier.released && !d.carrier.arrived && destination > d.carrier.x + 490) { destination = d.carrier.x + 470; waitingForEscort = true; if (!['damage', 'combat'].includes(task.kind)) task = { kind: 'escort', x: destination }; }
    let move = Math.abs(destination - p.x) > 24 ? Math.sign(destination - p.x) : 0;
    const target = noFire ? null : task.kind === 'damage' ? foundryClearLine(s, task.target) ? task.target : null : visible[0];
    const combatStop = target && Math.abs(target.x - p.x) < 760 && (task.kind !== 'damage' || Math.abs(destination - p.x) < 110);
    if (combatStop) move = 0;
    if (!['damage', 'combat', 'escort', 'extract'].includes(task.kind) && Math.abs(task.x - p.x) < 132) { commandGame(s, 'interact'); move = 0; }
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    updateGame(s, 1 / 60, { move, brace: !move && task.kind !== 'escort' && (!waitingForEscort || combatStop), vent,
      fire: Boolean(target) && !vent && !flying, aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
