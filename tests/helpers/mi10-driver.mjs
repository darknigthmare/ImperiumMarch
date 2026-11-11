import { commandGame, updateGame } from '../../src/simulation.mjs';

export function captureMI10Scene(s, metadata = {}) {
  return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, state: s });
}

const parts = s => { const d = s.chemical; return [...d.tanks, d.collector, d.sampler, d.record, ...d.canals, ...d.homes].filter(part => !part.destroyed); };

export function chemicalClearLine(s, target) {
  const p = s.player, ox = p.x + 9, oy = p.y + 8;
  const distance = Math.hypot(target.x - ox, target.y - oy), muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  if (distance < muzzle + 18) return false;
  const fx = ox + (target.x - ox) * muzzle / distance, fy = oy + (target.y - oy) * muzzle / distance;
  for (const part of parts(s)) {
    if (part === target || part === target.original) continue;
    let low = 0, high = 1;
    for (const [origin, delta, center, size] of [[fx, target.x - fx, part.x, part.w], [fy, target.y - fy, part.y, part.h]]) {
      const min = center - size / 2 - 5, max = center + size / 2 + 5;
      if (Math.abs(delta) < 1e-8) { if (origin < min || origin > max) { high = -1; break; } }
      else { let a = (min - origin) / delta, b = (max - origin) / delta; if (a > b) [a, b] = [b, a]; low = Math.max(low, a); high = Math.min(high, b); }
    }
    if (low <= high) return false;
  }
  return true;
}

export function moveMI10(s, x, { maxFrames = 12000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active && Math.abs(s.player.x - x) > 25; frame++) {
    updateGame(s, 1 / 60, { move: Math.sign(x - s.player.x) }); observe?.(s, frame);
  }
  return s;
}

export function fireAtMI10(s, id, { maxFrames = 6000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active; frame++) {
    const target = parts(s).find(part => part.id === id);
    if (!target) break;
    const p = s.player, destination = target.x - 280;
    let move = Math.abs(p.x - destination) > 25 ? Math.sign(destination - p.x) : 0;
    const canFire = chemicalClearLine(s, target) && Math.abs(p.x - destination) < 90;
    if (canFire) move = 0;
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: canFire && !vent && !flying, aimX: target.x, aimY: target.y });
    observe?.(s, frame);
  }
  return s;
}

// Every operation uses commandGame/updateGame. No position, health or clock setter.
export function pilotMI10(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 120000,
  skipCollector = false, skipCovers = false, noFire = false,
  destroySourceBeforeSample = false, destroySamplerDuringSample = false,
  destroyRecordBeforeCopy = false, destroyCanal = 0, destroyCollector = false,
  destroyOriginalsAfterSample = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.chemical, c = s.campaign, p = s.player;
    const enemies = d.alert.ready ? s.enemies.filter(enemy => enemy.id.startsWith('chemical-private-') && !enemy.dead) : [];
    const visible = enemies.filter(enemy => Math.abs(enemy.x - p.x) < 1050 && chemicalClearLine(s, enemy))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const uninspected = d.tanks.find(tank => !tank.inspected);
    const unfinished = [...d.tanks].reverse().find(tank => !tank.destroyed && (c.plan === 'demolish' || !tank.secured));
    const canalDamage = destroyCanal ? d.canals[Number(destroyCanal) - 1] : null;
    const damage = destroyCollector && !d.collector.destroyed ? d.collector
      : destroySourceBeforeSample && c.tanksInspected === 3 && !source(s).destroyed && !c.sampleCollected ? source(s)
      : destroyRecordBeforeCopy && c.leakStopped && !d.record.inspected && !d.record.destroyed ? d.record
      : destroySamplerDuringSample && d.sampler.started && !d.sampler.collected && !d.sampler.destroyed ? d.sampler
      : destroyOriginalsAfterSample && c.sampleCollected ? [source(s), d.sampler, d.record].find(part => !part.destroyed)
      : canalDamage && c.operationsResolved && !canalDamage.destroyed ? canalDamage : null;
    let job = damage ? { kind: 'damage', x: damage.x - 280 }
      : !skipCollector && !d.collector.closed && !d.collector.destroyed && !d.water.resolved ? { kind: 'collector', x: d.collector.controlX }
      : uninspected ? { kind: 'inspect', x: uninspected.x }
      : !c.leakStopped ? { kind: 'contain', x: d.leak.x }
      : !d.record.inspected ? { kind: 'record', x: d.record.x }
      : !c.sampleResolved ? { kind: d.sampler.working ? 'defend-sample' : 'sample', x: d.sampler.x }
      : c.privateNeutralized < 3 ? { kind: 'combat', x: enemies[0]?.x - 260 || d.sampler.x + 400 }
      : !s.decision.resolved ? { kind: 'orders', x: d.orders.x }
      : unfinished ? { kind: 'tank', x: unfinished.x }
      : !skipCovers && d.canals.some(canal => !canal.covered && !canal.destroyed) ? { kind: 'cover', x: d.canals.find(canal => !canal.covered && !canal.destroyed).controlX }
      : !c.flowResolved ? { kind: 'flow', x: d.water.x - 200 }
      : !d.water.resolved ? { kind: 'water', x: d.water.x }
      : !d.report.transmitted ? { kind: 'report', x: d.report.x }
      : { kind: 'extract', x: s.extraction.x };
    if (!skipCovers && !['damage', 'defend-sample', 'sample'].includes(job.kind)) {
      const ahead = d.canals.find(canal => !canal.covered && !canal.destroyed && p.x < canal.controlX && job.x > canal.controlX);
      if (ahead) job = { kind: 'cover', x: ahead.controlX };
    }
    let destination = ['damage', 'combat', 'flow', 'extract'].includes(job.kind) ? job.x : job.x - 100;
    if (job.kind === 'defend-sample') destination = Math.min(d.sampler.x + s.mission.chemical.sampleRadius - 130, enemies[0]?.x - 260 || p.x);
    let move = Math.abs(destination - p.x) > 24 ? Math.sign(destination - p.x) : 0;
    const target = noFire ? null : job.kind === 'damage' && chemicalClearLine(s, damage) ? damage : visible[0];
    if (target && Math.abs(target.x - p.x) < 760 && (job.kind !== 'damage' || Math.abs(destination - p.x) < 90)) move = 0;
    if (!['damage', 'combat', 'defend-sample', 'flow', 'extract'].includes(job.kind) && Math.abs(job.x - p.x) < 135) {
      commandGame(s, 'interact'); move = 0;
    }
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    const rocketSafe = target && parts(s).filter(part => part !== target).every(part => Math.hypot(part.x - target.x, part.y - target.y) > 260);
    updateGame(s, 1 / 60, { move, brace: !move, vent,
      fire: Boolean(target) && !vent && !flying, secondary: Boolean(target) && target.hp > 160 && rocketSafe && !vent && !flying,
      aimX: target?.x, aimY: target?.y });
    observe?.(s, frame);
  }
  return s;
}

function source(s) { return s.chemical.tanks[s.mission.chemical.sourceTankIndex]; }
