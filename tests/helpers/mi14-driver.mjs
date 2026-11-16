import { commandGame, updateGame } from '../../src/simulation.mjs';
import { workshopAvailableJobs, workshopSolids } from '../../src/workshop-simulation.mjs';

export function captureMI14Scene(s, metadata = {}) { return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId, elapsed: s.elapsed, playerX: s.player.x, state: s }); }
export function workshopClearLine(s, target) {
  const p = s.player, ox = p.x + 9, oy = p.y + 8, distance = Math.hypot(target.x - ox, target.y - oy);
  const muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (distance < muzzle + 18) return false;
  const fx = ox + (target.x - ox) * muzzle / distance, fy = oy + (target.y - oy) * muzzle / distance;
  for (const part of workshopSolids(s).filter(part => !part.destroyed)) {
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
export function moveMI14(s, x, { maxFrames = 18000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active && Math.abs(s.player.x - x) > 25; frame++) {
    updateGame(s, 1 / 60, { move: Math.sign(x - s.player.x), vent: s.player.heat > 75 || s.player.overheated }); observe?.(s, frame);
  }
  return s;
}
export function fireAtMI14(s, id, { maxFrames = 18000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active; frame++) {
    const target = workshopSolids(s).find(part => part.id === id && !part.destroyed);
    if (!target) break;
    const p = s.player, destination = target.x - 330, canFire = workshopClearLine(s, target) && Math.abs(p.x - destination) < 110;
    const move = canFire ? 0 : Math.abs(p.x - destination) > 25 ? Math.sign(destination - p.x) : 0;
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: canFire && !vent && !flying, aimX: target.x, aimY: target.y }); observe?.(s, frame);
  }
  return s;
}

/** Every action uses the public command/input surface; no body or fact is moved by this driver. */
export function pilotMI14(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 150000, noFire = false,
  skipPassage = false, destroyLotBeforeCopy = false, destroyLotAfterCopy = false,
  destroyCoolerBeforeRepair = false, destroyCoolerAfterRepair = false, destroyControlBeforeOperation = false,
  destroyWorkerBeforePassage = false, destroyWorkerAfterCooperation = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.workshop, f = s.campaign, cfg = s.mission.workshop, p = s.player;
    const security = d.alert.ready ? s.enemies.find(e => e.id === 'workshop-security-1' && !e.dead) : null;
    const selectedWorker = typeof destroyWorkerBeforePassage === 'string' ? d.workers.find(w => w.id === destroyWorkerBeforePassage) : d.workers[0];
    const lateWorker = typeof destroyWorkerAfterCooperation === 'string' ? d.workers.find(w => w.id === destroyWorkerAfterCooperation) : d.workers[0];
    const damage = destroyWorkerBeforePassage && !d.picket.requested && selectedWorker?.alive ? selectedWorker
      : destroyWorkerAfterCooperation && d.cooperation.resolved && lateWorker?.alive ? lateWorker
      : destroyLotBeforeCopy && !d.lot.inspected && !d.lot.destroyed ? d.lot
      : destroyLotAfterCopy && d.lot.copied && !d.lot.destroyed ? d.lot
      : destroyCoolerBeforeRepair && !d.cooler.repaired && !d.cooler.destroyed ? d.cooler
      : destroyCoolerAfterRepair && d.cooler.repaired && !d.cooler.destroyed ? d.cooler
      : destroyControlBeforeOperation && s.decision.resolved && !d.control.operated && !d.control.destroyed ? d.control : null;
    // Complete the safe pedestrian crossing before travelling to any material target.
    const prematureDamage = damage && damage.id.startsWith('workshop-worker-');
    const waiting = d.picket.requested && !f.picketCleared;
    const jobs = workshopAvailableJobs(s);
    const order = ['contact', 'valve', 'inspect', 'repair', 'lot', 'orders', 'control', 'cooperation', 'report'];
    const task = !skipPassage && !d.picket.requested && !prematureDamage ? jobs.find(job => job.kind === 'picket')
      : !skipPassage && waiting ? { kind: 'wait', x: cfg.picketX }
      : damage ? { kind: 'damage', x: damage.x - 330, target: damage }
      : security ? { kind: 'combat', x: security.x - 450, target: security }
      : !d.alert.ready && f.contactInspected ? { kind: 'wait-alert', x: cfg.activationX + 80 }
      : d.report.transmitted ? { kind: 'extract', x: s.extraction.x }
      : order.map(kind => jobs.find(job => job.kind === kind)).find(Boolean)
        || { kind: 'approach', x: cfg.contactX };
    const target = noFire ? null : ['damage', 'combat'].includes(task.kind) && workshopClearLine(s, task.target) ? task.target : null;
    const station = !['damage', 'combat', 'wait', 'wait-alert', 'extract', 'approach'].includes(task.kind);
    const destination = task.x - (station ? 115 : 0);
    let move = Math.abs(destination - p.x) > 24 ? Math.sign(destination - p.x) : 0;
    const inCombatRange = target && Math.abs(p.x - destination) < 100;
    if (inCombatRange) move = 0;
    if (station && Math.abs(task.x - p.x) <= cfg.interactionRadius - 1) { move = 0; commandGame(s, 'interact'); }
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: Boolean(inCombatRange) && !vent && !flying,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
