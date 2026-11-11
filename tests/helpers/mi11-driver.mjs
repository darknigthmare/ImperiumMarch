import { commandGame, updateGame } from '../../src/simulation.mjs';
import { voiceSolids } from '../../src/voice-simulation.mjs';

export function captureMI11Scene(s, metadata = {}) {
  return structuredClone({ ...metadata, missionId: s.missionId, walkerId: s.walkerId,
    elapsed: s.elapsed, playerX: s.player.x, state: s });
}

const parts = s => voiceSolids(s).filter(part => !part.destroyed);

export function voiceClearLine(s, target) {
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

export function moveMI11(s, x, { maxFrames = 12000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active && Math.abs(s.player.x - x) > 25; frame++) {
    updateGame(s, 1 / 60, { move: Math.sign(x - s.player.x) }); observe?.(s, frame);
  }
  return s;
}

export function fireAtMI11(s, id, { maxFrames = 9000, observe = null } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing' && !s.decision.active; frame++) {
    const target = parts(s).find(part => part.id === id);
    if (!target) break;
    const p = s.player, destination = target.x - 280;
    let move = Math.abs(p.x - destination) > 25 ? Math.sign(destination - p.x) : 0;
    const canFire = voiceClearLine(s, target) && Math.abs(p.x - destination) < 90;
    if (canFire) move = 0;
    const vent = p.heat > 75 || p.overheated, flying = s.projectiles.some(shot => shot.team === 'player');
    updateGame(s, 1 / 60, { move, brace: !move, vent, fire: canFire && !vent && !flying, aimX: target.x, aimY: target.y });
    observe?.(s, frame);
  }
  return s;
}

/** Public commands only. It never sets a body, time, health or mission outcome. */
export function pilotMI11(s, { choice = 'defy', stopAt = null, observe = null, maxFrames = 120000,
  skipRidge = false, noFire = false, destroyEmitterBeforeCopy = false, destroyReceiverBeforeCopy = false,
  destroyLethBeforeExchange = false, destroyLethAfterExchange = false, destroyOriginalsAfterExchange = false,
  destroyRidgeAfterSurvey = false } = {}) {
  for (let frame = 0; frame < maxFrames && s.status === 'playing'; frame++) {
    if (stopAt?.(s)) break;
    if (s.decision.active) { commandGame(s, 'choice', choice); continue; }
    const d = s.voice, c = s.campaign, p = s.player, l = d.leth;
    const enemies = d.alert.ready ? s.enemies.filter(enemy => enemy.id.startsWith('voice-private-') && !enemy.dead) : [];
    const visible = enemies.filter(enemy => Math.abs(enemy.x - p.x) < 1050 && voiceClearLine(s, enemy))
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x));
    const listening = d.listening.find(point => !point.sampled);
    const damage = destroyRidgeAfterSurvey && d.ridge.surveyed && !d.ridge.destroyed ? d.ridge
      : destroyEmitterBeforeCopy && c.readingsTaken === 3 && !d.emitter.inspected && !d.emitter.destroyed ? d.emitter
      : destroyReceiverBeforeCopy && c.readingsTaken === 3 && !d.receiver.inspected && !d.receiver.destroyed ? d.receiver
      : destroyLethBeforeExchange && l.met && !l.testimonyRecorded && l.alive ? l
      : destroyLethAfterExchange && l.testimonyRecorded && l.alive ? l
      : destroyOriginalsAfterExchange && l.testimonyRecorded ? [d.emitter, d.receiver].find(part => !part.destroyed && !part.seized) : null;
    let job = damage ? { kind: 'damage', x: damage.x - 280 }
      : listening ? { kind: 'listen', x: listening.x }
      : !skipRidge && !d.ridge.surveyed && !d.ridge.destroyed ? { kind: 'survey', x: d.ridge.controlX }
      : !d.receiver.inspected ? { kind: 'receiver', x: d.receiver.x }
      : !d.emitter.inspected ? { kind: 'emitter', x: d.emitter.x }
      : !l.encountered ? { kind: 'meet', x: l.x }
      : l.alive && !l.consentAsked ? { kind: 'consent', x: l.x }
      : !c.testimonyResolved ? { kind: l.working ? 'defend' : 'testimony', x: l.x }
      : c.privateNeutralized < 3 ? { kind: 'combat', x: enemies[0]?.x - 260 || l.x + 500 }
      : !s.decision.resolved ? { kind: 'orders', x: d.orders.x }
      : !c.operationsResolved ? { kind: 'operate', x: d.emitter.x }
      : !d.report.transmitted ? { kind: 'report', x: d.report.x }
      : { kind: 'extract', x: s.extraction.x };
    if (!skipRidge && !d.ridge.surveyed && !d.ridge.destroyed && p.x < d.ridge.controlX && job.x > d.ridge.controlX) job = { kind: 'survey', x: d.ridge.controlX };
    let destination = ['damage', 'combat', 'extract'].includes(job.kind) ? job.x : job.x - 100;
    if (job.kind === 'defend') destination = Math.min(l.x + s.mission.voice.exchangeRadius - 130, enemies[0]?.x - 260 || l.x + 200);
    let move = Math.abs(destination - p.x) > 24 ? Math.sign(destination - p.x) : 0;
    const target = noFire ? null : job.kind === 'damage' && voiceClearLine(s, damage) ? damage : visible[0];
    if (target && Math.abs(target.x - p.x) < 760 && (job.kind !== 'damage' || Math.abs(destination - p.x) < 90)) move = 0;
    if (!['damage', 'combat', 'defend', 'extract'].includes(job.kind) && Math.abs(job.x - p.x) < 135) {
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
