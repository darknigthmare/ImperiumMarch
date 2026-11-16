/** Public input driver for MI12. Never assigns position, health, time or outcome. */
import { commandGame, updateGame } from '../../src/simulation.mjs';
import { relaySolids, relayJobs } from '../../src/relay-simulation.mjs';
export function captureMI12Scene(s, metadata = {}) { return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId, elapsed: s.elapsed, playerX: s.player.x, state: s }); }
const parts = s => relaySolids(s).filter(p => !p.destroyed);
export function relayClearLine(s, target) {
  const p = s.player, ox = p.x + 9, oy = p.y + 8;
  const dist = Math.hypot(target.x - ox, target.y - oy), muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (dist < muzzle + 20) return false;
  const fx = ox + (target.x - ox) * muzzle / dist, fy = oy + (target.y - oy) * muzzle / dist;
  for (const part of parts(s)) {
    if (part === target) continue;
    let low = 0, high = 1;
    for (const [origin, delta, center, size] of [[fx, target.x - fx, part.x, part.w], [fy, target.y - fy, part.y, part.h]]) {
      const min = center - size / 2 - 4, max = center + size / 2 + 4;
      if (Math.abs(delta) < 1e-8) { if (origin < min || origin > max) { high = -1; break; } }
      else { let a = (min - origin) / delta, b = (max - origin) / delta; if (a > b) [a, b] = [b, a]; low = Math.max(low, a); high = Math.min(high, b); }
    }
    if (low <= high && low < .98) return false;
  }
  return true;
}
export function moveMI12(s, x, { maxFrames = 12000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active && Math.abs(s.player.x - x) > 25; frame++) {
    updateGame(s, 1 / 60, { move: Math.sign(x - s.player.x) }); observe?.(s, frame);
  }
  return s;
}
export function fireAtMI12(s, id, { maxFrames = 12000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active; frame++) {
    const target = parts(s).find(p => p.id === id); if (!target) break;
    const destination = target.x - 300, ready = Math.abs(destination - s.player.x) < 60 && relayClearLine(s, target);
    const move = Math.abs(destination - s.player.x) > 24 ? Math.sign(destination - s.player.x) : 0;
    const vent = s.player.heat > 75 || s.player.overheated, flying = s.projectiles.some(p => p.team === 'player');
    updateGame(s, 1 / 60, { move: ready ? 0 : move, brace: ready || !move, vent, fire: ready && !vent && !flying, aimX: target.x, aimY: target.y }); observe?.(s, frame);
  }
  return s;
}
export function pilotMI12(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 120000,
  noFire = false, skipCopy = false, destroySourceBeforeCopy = false, destroySourceAfterCopy = false,
  disableSensor = true, disableLock = true } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.relay, f = s.campaign, p = s.player, boss = d.praetor;
    const inspect = d.relays.find(r => !r.inspected);
    const destroy = (destroySourceBeforeCopy && !f.ordersCopied || destroySourceAfterCopy && f.ordersCopied) && !d.relays[2].destroyed ? d.relays[2] : null;
    const candidates = d.alert.ready && !boss.destroyed ? [...(disableSensor && !boss.sensor.destroyed ? [boss.sensor] : []), ...(disableLock && !boss.hydraulicLock.destroyed ? [boss.hydraulicLock] : []), boss] : [];
    const enemy = candidates.find(target => relayClearLine(s, target)) || candidates[0] || null;
    let task = destroy ? { kind: 'damage', x: destroy.x - 300, target: destroy }
      : inspect ? { kind: 'inspect', x: inspect.x - 105, target: inspect }
      : !f.copyResolved ? { kind: skipCopy ? 'wait-copy' : 'copy', x: d.copy.x - 100, target: d.copy }
      : !boss.destroyed ? { kind: 'combat', x: boss.x - 285, target: enemy }
      : !s.decision.resolved ? { kind: 'orders', x: d.orders.x - 100, target: d.orders }
      : !f.operationsResolved ? (() => { const j = relayJobs(s).find(j => ['erase', 'isolate'].includes(j.kind)); return j ? { kind: j.kind, x: j.x - 100, target: j.part } : { kind: 'wait', x: p.x }; })()
      : !d.report.transmitted ? { kind: 'report', x: d.report.x - 100, target: d.report }
      : { kind: 'extract', x: s.extraction.x };
    let move = Math.abs(task.x - p.x) > 24 ? Math.sign(task.x - p.x) : 0;
    const target = noFire ? null : task.kind === 'damage' ? destroy : task.kind === 'combat' ? enemy
      : task.kind === 'copy' || task.kind === 'wait-copy' ? enemy && !boss.sensor.destroyed && relayClearLine(s, boss.sensor) ? boss.sensor : null : null;
    const canFire = target && Math.abs(target.x - p.x) < 1100 && relayClearLine(s, target) && (['combat', 'damage'].includes(task.kind) ? Math.abs(task.x - p.x) < 80 : !move);
    if (canFire) move = 0;
    if (['inspect', 'copy', 'orders', 'erase', 'isolate', 'report'].includes(task.kind) && Math.abs(task.x - p.x) <= 25) { commandGame(s, 'interact'); move = 0; }
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: Boolean(canFire) && !vent && !flying, aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}
