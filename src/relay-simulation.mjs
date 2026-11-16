/** MI12 — three physical relays, a timed local copy and an anchored security walker.
 * Reconstructed from the surviving campaign design and the 0.13 delivery record.
 * No DOM and no wall clock: jobs, threats and copy expiry share the scene clock. */
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const copy = value => structuredClone(value);
const job = () => ({ working: false, progress: 0, startedAt: null, completedAt: null });
const near = (s, x, r = s.mission.relay.interactionRadius) => Math.abs(s.player.x - x) <= r;
const anchored = s => s.player.braced && !s.player.move && Math.abs(s.player.speed) < 3 && s.player.feet.every(f => f.contact);

export const RELAY_COMMAND_EXCERPT = 'Orison — conduite de traitement de Thyr. Maintenir la livraison des agents malgré les relevés de terrain. Après inspection, purger les relais de commande et transmettre seulement le total des volumes.';
export const RELAY_FACT_FLAGS = ['windowOpened', 'windowExpired', 'copyStarted', 'ordersCopied', 'industrialOrdersCopied', 'copyLost', 'copyResolved', 'manifestRead', 'privateTriggered', 'privateReady', 'praetorNeutralized', 'sensorDisabled', 'lockDisabled', 'operationsResolved', 'reportTransmitted', 'publicRefusal', 'holtAlerted', 'refugeClosed'];
export const RELAY_FACT_COUNTS = ['relaysTotal', 'inspectionsTaken', 'relaysErased', 'relaysIsolated', 'relaysLost', 'relaysIntact', 'ilanTrustDelta'];

export function relayContext(previous = {}) {
  return { voiceRecorded: previous.voiceRecorded === true,
    voiceChoice: ['obey', 'defy'].includes(previous.voiceChoice) ? previous.voiceChoice : 'none',
    voiceTe01: previous.voiceTe01 === true, lethAvailable: previous.lethAvailable === true,
    chemicalPt02: previous.chemicalPt02 === true };
}

export function createRelayMission(s, previous, runtime) {
  const c = s.mission.relay, ground = x => runtime.terrainAt(x, s.planetId);
  const body = (id, x, w, h, hp) => ({ id, x, y: ground(x) - h / 2, w, h, hp, maxHp: hp,
    destroyed: false, destroyedAt: null, flash: 0 });
  const post = (id, x) => ({ id, x, y: ground(x) - 34, w: 64, h: 68, ...job() });
  const health = s.difficulty?.enemyHealth || 1;
  s.relay = {
    relays: c.relayXs.map((x, i) => ({ ...body(`relay-node-${i + 1}`, x, 76, 130, 270),
      index: i + 1, inspected: false, inspectedAt: null, erased: false, erasedAt: null,
      isolated: false, isolatedAt: null, work: 'none', ...job() })),
    copy: { ...post('relay-copy-console', c.copyX), started: false, firstStartedAt: null,
      copied: false, copiedAt: null, lost: false, lostAt: null, expired: false, expiredAt: null },
    window: { opened: false, openedAt: null, deadline: null, expired: false, expiredAt: null },
    orders: { id: 'relay-orders', x: c.ordersX, y: ground(c.ordersX) - 35, w: 64, h: 70 },
    report: { ...post('relay-report', c.reportX), transmitted: false, transmittedAt: null },
    alert: { triggered: false, reason: 'none', triggeredAt: null, elapsed: 0, ready: false, readyAt: null },
    praetor: { ...body('relay-praetor', c.praetorX, 172, 92, Math.round(700 * health)),
      designation: 'VE12', name: 'Prétoire', active: false, facing: -1, phase: 'dormant',
      timer: 1.5, telegraph: 0, targetX: 0, targetY: 0, shots: 0, lastShotAt: null,
      grounded: true, speed: 0, feet: [-64, -34, 34, 64].map((dx, i) => ({ id: `praetor-foot-${i + 1}`, x: c.praetorX + dx, y: ground(c.praetorX + dx), contact: true })),
      sensor: { ...body('relay-praetor-sensor', c.praetorX, 40, 34, Math.round(100 * health)), component: 'sensor' },
      hydraulicLock: { ...body('relay-praetor-lock', c.praetorX - 76, 36, 34, Math.round(125 * health)), component: 'lock' } },
  };
  syncPraetorBodies(s, runtime);
  s.campaign = { missionId: 'MI12', phase: 'inspection', context: relayContext(previous),
    tutorial: { stepped: false, braced: false }, ...relayDerivedFacts(s) };
  s.evidence.scanning = false; s.evidence.scanTime = c.copyTime;
}

function syncPraetorBodies(s, runtime) {
  const p = s.relay.praetor, g = runtime.terrainAt(p.x, s.planetId);
  p.y = g - 78; p.sensor.x = p.x + p.facing * 13; p.sensor.y = p.y - 67;
  p.hydraulicLock.x = p.x + p.facing * 106; p.hydraulicLock.y = g - 27;
  p.feet.forEach((f, i) => { f.x = p.x + [-64, -34, 34, 64][i]; f.y = runtime.terrainAt(f.x, s.planetId); f.contact = true; });
}

export function relayDerivedFacts(s) {
  const d = s.relay, p = d.praetor;
  const plan = !s.decision.resolved ? 'unselected' : s.decision.choice === 'obey' ? 'erase' : s.decision.choice === 'defy' ? 'preserve' : 'open';
  const operationDone = r => r.destroyed || (plan === 'erase' || plan === 'preserve' && r.index < 3 ? r.erased : r.isolated);
  const relaysErased = d.relays.filter(r => r.erased).length, relaysIsolated = d.relays.filter(r => r.isolated).length;
  const operationsResolved = plan !== 'unselected' && d.relays.every(operationDone);
  const publicRefusal = plan === 'open', ordersCopied = d.copy.copied;
  const holtAlerted = plan !== 'unselected' && (plan !== 'erase' || d.relays.some(r => r.destroyed));
  const refugeClosed = publicRefusal;
  const ilanTrustDelta = plan === 'unselected' ? 0 : (ordersCopied ? 8 : -4) + (publicRefusal ? 4 : plan === 'erase' ? -4 : 0);
  return { plan, relaysTotal: 3, inspectionsTaken: d.relays.filter(r => r.inspected).length,
    relaysErased, relaysIsolated, relaysLost: d.relays.filter(r => r.destroyed).length,
    relaysIntact: d.relays.filter(r => !r.destroyed).length,
    windowOpened: d.window.opened, windowExpired: d.window.expired, copyStarted: d.copy.started,
    ordersCopied, industrialOrdersCopied: ordersCopied, copyLost: d.copy.lost,
    copyResolved: d.copy.copied || d.copy.lost || d.copy.expired,
    manifestRead: d.relays.every(r => r.inspected), privateTriggered: d.alert.triggered,
    privateReady: d.alert.ready, praetorNeutralized: p.destroyed,
    sensorDisabled: p.sensor.destroyed, lockDisabled: p.hydraulicLock.destroyed,
    operationsResolved, reportTransmitted: d.report.transmitted,
    publicRefusal, holtAlerted, refugeClosed, ilanTrustDelta };
}

export function refreshRelayFacts(s) {
  Object.assign(s.campaign, relayDerivedFacts(s));
  if (s.decision.active || s.decision.resolved) s.decision.body = relayDecisionBody(s);
}
export function relayReceiptRoster(s) { return copy(s.relay); }
export function relaySurface(s, x, groundY) { return { groundY, traction: 1, rise: 0 }; }
export function relayFootfall() {}
export function relaySolids(s) {
  const d = s.relay, p = d.praetor;
  return [...d.relays, ...(d.alert.ready ? [p.sensor, p.hydraulicLock, p] : [])];
}

function triggerPraetor(s, reason, runtime) {
  if (s.relay.alert.triggered) return;
  Object.assign(s.relay.alert, { triggered: true, triggeredAt: s.elapsed, reason });
  runtime.emit(s, 'radio', 'Tess : « Prétoire en approche. Six secondes. Son œil supérieur règle la visée ; le verrou frontal tient ses appuis et son blindage. »');
}
function loseCopy(s, runtime) {
  const c = s.relay.copy;
  if (c.copied || c.lost || c.expired) return;
  c.lost = true; c.lostAt = s.elapsed; c.working = false; c.progress = 0; c.startedAt = null;
  runtime.emit(s, 'radio', 'Sami : « Le troisième relais a perdu son archive avant la fin de la copie. Je consigne la perte, sans reconstituer des ordres que nous n’avons pas lus. »');
}
export function hitRelayPart(s, part, damage, runtime) {
  if (!part || part.destroyed || !(damage > 0)) return;
  const p = s.relay.praetor, isPraetor = [p, p.sensor, p.hydraulicLock].includes(part);
  if (isPraetor && !s.relay.alert.ready) return;
  const absorbed = part === p ? damage * (p.hydraulicLock.destroyed ? 1.3 : .48) : damage;
  part.hp = Math.max(0, part.hp - absorbed); part.flash = .12;
  if (!part.hp) {
    part.destroyed = true; part.destroyedAt = s.elapsed;
    if (part.working) { part.working = false; part.progress = 0; part.startedAt = null; part.completedAt = null; }
    if (part === p) { p.active = false; p.phase = 'destroyed'; p.telegraph = 0; p.speed = 0; s.stats.kills++; s.stats.score += 650;
      runtime.emit(s, 'objective', 'Prétoire neutralisé. Ses composants atteints et les relais perdus restent au bilan.'); }
    else if (part === p.sensor) { p.telegraph = 0; p.phase = 'recover'; p.timer = 3;
      runtime.emit(s, 'radio', 'Tess : « Capteur du Prétoire perdu : sa visée longue portée tombe. Il tire encore à courte portée. »'); }
    else if (part === p.hydraulicLock) runtime.emit(s, 'radio', 'Tess : « Verrou hydraulique rompu. Le Prétoire ne tient plus son ancrage ; sa coque est exposée. »');
  }
  if (s.relay.relays.includes(part)) {
    triggerPraetor(s, 'relay-damage', runtime);
    if (part.index === 3 && part.destroyed) loseCopy(s, runtime);
  }
  refreshRelayFacts(s);
}

export function relayDecisionBody(s) {
  const f = relayDerivedFacts(s);
  return `${f.ordersCopied ? 'Une copie complète des commandes locales du traitement chimique est conservée à bord.' : 'Aucune copie complète des ordres industriels n’a été acquise.'} ${f.relaysLost} relais perdus sur trois. Effacer exige une purge sur chaque appareil ; conserver le troisième exige de l’isoler. Un refus ouvert impose l’isolement des trois relais et ferme notre refuge impérial. Ilan jugera les pièces réellement vues. Ce choix local ne constitue pas une défection.`;
}

function start(s, part, work = null) {
  if (part.working) return false;
  Object.assign(part, { working: true, progress: 0, startedAt: s.elapsed, completedAt: null });
  if (work) part.work = work;
  return true;
}
function requiredOperation(s, relay) {
  const plan = relayDerivedFacts(s).plan;
  return plan === 'erase' || plan === 'preserve' && relay.index < 3 ? 'erase' : 'isolate';
}
function reportReady(s) { const f = relayDerivedFacts(s); return f.manifestRead && f.copyResolved && f.operationsResolved && f.praetorNeutralized; }
export function relayJobs(s) {
  const d = s.relay, f = relayDerivedFacts(s), list = [];
  for (const r of d.relays) if (!r.inspected) list.push({ kind: 'inspect', part: r, x: r.x, label: r.destroyed ? 'Constater la perte du relais' : `Relever le relais ${r.index} — ancrage requis` });
  if (f.manifestRead && !f.copyResolved && !s.decision.resolved) list.push({ kind: 'copy', part: d.copy, x: d.copy.x, label: 'Copier les commandes — 24 secondes ancré, avant la fermeture à 45 secondes' });
  if (f.manifestRead && f.copyResolved && !s.decision.resolved) list.push({ kind: 'orders', part: d.orders, x: d.orders.x, label: 'Répondre à l’ordre de purge des trois relais' });
  if (s.decision.resolved) for (const r of d.relays) {
    const operation = requiredOperation(s, r);
    if (!r.destroyed && !(operation === 'erase' ? r.erased : r.isolated)) list.push({ kind: operation, part: r, x: r.x, label: operation === 'erase' ? `Purger physiquement le relais ${r.index} — ancrage requis` : `Isoler le relais ${r.index} sans effacer son archive — ancrage requis` });
  }
  if (reportReady(s) && !d.report.transmitted) list.push({ kind: 'report', part: d.report, x: d.report.x, label: 'Transmettre le rapport des actes réellement accomplis' });
  return list;
}
export function relayInteraction(s) {
  const current = relayJobs(s).filter(j => near(s, j.x, j.kind === 'copy' ? s.mission.relay.copyRadius : undefined)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
  if (current) return current.part.working ? `${current.kind === 'copy' ? 'Copie' : 'Travail'} en cours — ${Math.floor(current.part.progress * 100)} %` : `E — ${current.label}`;
  if (s.relay.window.opened && !s.campaign.copyResolved) return `Copie encore possible — ${Math.max(0, Math.ceil(s.relay.window.deadline - s.elapsed))} s ; rejoindre le terminal`;
  if (near(s, s.relay.report.x) && !s.relay.report.transmitted) return 'Terminer les opérations sur les relais et neutraliser le Prétoire avant le rapport';
  return '';
}
export function interactRelayMission(s, runtime) {
  const current = relayJobs(s).filter(j => near(s, j.x, j.kind === 'copy' ? s.mission.relay.copyRadius : undefined)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
  if (!current || current.part.working) return false;
  if (current.kind === 'orders') { s.campaign.phase = 'decision'; s.decision.body = relayDecisionBody(s); s.decision.active = true; return true; }
  if (current.kind !== 'report' && !anchored(s)) return false;
  if (current.kind === 'copy') {
    if (!s.relay.window.opened || s.elapsed >= s.relay.window.deadline || s.relay.relays[2].destroyed || s.relay.relays[2].erased) return false;
    current.part.started = true; current.part.firstStartedAt ??= s.elapsed; s.campaign.phase = 'copy';
  } else if (!s.decision.resolved) s.campaign.phase = 'inspection';
  return start(s, current.part, current.part.index ? current.kind : null);
}
export function chooseRelayMission(s, choice, runtime) {
  s.campaign.phase = 'operations';
  if (choice === 'obey') s.stats.ordersObeyed++; else s.stats.ordersDefied++;
  runtime.emit(s, 'radio', choice === 'obey' ? 'Sera : « Purge des trois relais retenue. Nous devons encore intervenir sur chaque appareil. La copie déjà embarquée reste dans le dossier. »'
    : choice === 'defy' ? 'Sera : « Deux purges, troisième relais isolé. Holt verra un écart dans le relevé ; rien ne disparaît de notre propre journal. »'
      : 'Sera : « Je refuse la purge. Nous isolons les trois relais sur place. Ilan, préviens l’équipage : le refuge impérial nous sera fermé. Nous ne rejoignons pas encore une autre armée. »');
  refreshRelayFacts(s);
}
function advance(s, part, dt, duration, valid, finish) {
  if (!part.working) return;
  if (!valid) { part.working = false; part.progress = 0; part.startedAt = null; return; }
  part.progress = Math.min(1, part.progress + dt / duration);
  if (part.progress >= 1 - 1e-9) { part.progress = 1; part.working = false; part.completedAt = s.elapsed; finish(); }
}
function updatePraetor(s, dt, runtime) {
  const d = s.relay, p = d.praetor;
  if (!d.alert.ready || p.destroyed) return;
  p.active = true; p.facing = s.player.x < p.x ? -1 : 1;
  const range = p.sensor.destroyed ? 560 : 1100, distance = Math.abs(p.x - s.player.x);
  p.speed = p.hydraulicLock.destroyed && distance < 500 ? 22 : 0;
  if (p.speed) p.x = clamp(p.x - p.facing * p.speed * dt, s.mission.relay.praetorX - 170, s.mission.relay.praetorX + 260);
  syncPraetorBodies(s, runtime);
  if (p.phase === 'attack') {
    p.telegraph = Math.min(1, p.telegraph + dt / (p.sensor.destroyed ? 2.3 : 1.6));
    if (p.telegraph >= 1) {
      const ox = p.x + p.facing * 115, oy = p.y - 10;
      const angle = Math.atan2(p.targetY - oy, p.targetX - ox);
      s.projectiles.push({ id: `enemy-shot-${++s.entityId}`, x: ox, y: oy, prevX: ox, prevY: oy,
        vx: Math.cos(angle) * 400, vy: Math.sin(angle) * 400, team: 'enemy', type: 'bullet',
        damage: p.hydraulicLock.destroyed ? 25 : 38, radius: 3, life: 4.5, trail: [] });
      p.shots++; p.lastShotAt = s.elapsed; p.phase = 'recover'; p.timer = p.sensor.destroyed ? 3 : 1.6; p.telegraph = 0;
    }
  } else {
    p.timer = Math.max(0, p.timer - dt);
    if (!p.timer && distance < range) {
      p.phase = 'attack'; p.telegraph = 0;
      p.targetX = s.player.x + (p.sensor.destroyed ? Math.sin(p.shots * 2.7 + s.seed) * 160 : s.player.speed * .22);
      p.targetY = s.player.y + (p.sensor.destroyed ? 70 : 0);
    } else if (!p.timer) p.phase = 'guard';
  }
}

export function updateRelayMission(s, dt, runtime) {
  const d = s.relay, c = s.mission.relay, stable = anchored(s);
  for (const part of [...d.relays, d.praetor, d.praetor.sensor, d.praetor.hydraulicLock]) part.flash = Math.max(0, part.flash - dt);
  for (const r of d.relays) advance(s, r, dt, r.work === 'inspect' ? c.inspectTime : c.operateTime,
    near(s, r.x) && stable && (r.work === 'inspect' || !r.destroyed), () => {
      if (r.work === 'inspect') { r.inspected = true; r.inspectedAt = s.elapsed; }
      else if (r.work === 'erase') { r.erased = true; r.erasedAt = s.elapsed; if (r.index === 3) loseCopy(s, runtime); }
      else if (r.work === 'isolate') { r.isolated = true; r.isolatedAt = s.elapsed; }
    });
  if (d.relays.every(r => r.inspected) && !d.window.opened) {
    Object.assign(d.window, { opened: true, openedAt: s.elapsed, deadline: s.elapsed + c.copyWindow });
    triggerPraetor(s, 'archive-window', runtime);
    runtime.emit(s, 'radio', 'Sami : « Les trois repères sont relevés. Le troisième relais contient les commandes du traitement. Le terminal reste accessible quarante-cinq secondes ; il me faut vingt-quatre secondes sans bouger pour tout copier. »');
  }
  if (d.relays[2].destroyed || d.relays[2].erased) loseCopy(s, runtime);
  advance(s, d.copy, dt, c.copyTime, stable && near(s, d.copy.x, c.copyRadius) && d.window.opened
    && s.elapsed <= d.window.deadline + 1e-8 && !d.copy.lost && !d.copy.expired && !d.relays[2].destroyed && !d.relays[2].erased, () => {
      d.copy.copied = true; d.copy.copiedAt = s.elapsed;
      runtime.emit(s, 'radio', `Sami : « Copie complète conservée : ${RELAY_COMMAND_EXCERPT} Il s’agit d’ordres locaux ; nous n’avons pas encore la chaîne politique entière. »`);
    });
  if (d.window.opened && !d.window.expired && s.elapsed >= d.window.deadline - 1e-8) {
    d.window.expired = true; d.window.expiredAt = s.elapsed;
    if (!d.copy.copied && !d.copy.lost) {
      d.copy.expired = true; d.copy.expiredAt = s.elapsed; d.copy.working = false; d.copy.progress = 0; d.copy.startedAt = null;
      runtime.emit(s, 'radio', 'Sami : « Fenêtre fermée. La copie n’était pas achevée : aucun texte d’ordre ne sera ajouté. »');
    }
  }
  if (d.alert.triggered && !d.alert.ready) {
    d.alert.elapsed = Math.min(c.privateDelay, Math.max(0, s.elapsed - d.alert.triggeredAt));
    if (d.alert.elapsed >= c.privateDelay - 1e-8) { d.alert.ready = true; d.alert.readyAt = s.elapsed; d.praetor.phase = 'guard'; }
  }
  updatePraetor(s, dt, runtime);
  advance(s, d.report, dt, c.reportTime, near(s, d.report.x) && reportReady(s), () => {
    d.report.transmitted = true; d.report.transmittedAt = s.elapsed; s.campaign.phase = 'extraction';
    runtime.emit(s, 'radio', s.campaign.ordersCopied ? 'Ilan : « J’ai vu les commandes que nous avons copiées. Je ne peux plus prétendre qu’il ne s’agissait que d’une rumeur. »' : 'Ilan : « Je vois les dégâts et nos décisions. Sans copie des commandes, ne me demande pas de dire que j’ai lu ce qui a disparu. »');
  });
  refreshRelayFacts(s);
  if (d.copy.copied && !s.evidence.collected) { s.evidence.collected = true; s.evidence.scanProgress = 1; s.stats.evidence++; s.stats.score += 350; }
  s.evidence.scanning = false;
}
export function relayObjectives(s) {
  const f = s.campaign;
  const goals = [
    { id: 'relays', label: 'Relever les trois relais ou constater leur perte', current: f.inspectionsTaken, target: 3, complete: f.manifestRead },
    { id: 'copy', label: f.ordersCopied ? 'Copie complète des commandes conservée' : f.copyLost ? 'Archive perdue avant copie — perte consignée' : f.windowExpired ? 'Fenêtre close sans copie complète' : 'Tenir 24 secondes de copie dans la fenêtre de 45 secondes', current: Number(f.copyResolved), target: 1, complete: f.copyResolved },
    { id: 'praetor', label: 'Neutraliser le Prétoire de sécurité', current: Number(f.praetorNeutralized), target: 1, complete: f.praetorNeutralized },
    { id: 'order', label: 'Choisir puis accomplir les trois opérations de relais', current: f.relaysErased + f.relaysIsolated + s.relay.relays.filter(r => r.destroyed && !r.erased && !r.isolated).length, target: 3, complete: f.operationsResolved },
    { id: 'report', label: 'Transmettre le bilan des relais et des pièces réellement conservées', current: Number(f.reportTransmitted), target: 1, complete: f.reportTransmitted },
  ];
  s.extraction.active = goals.every(goal => goal.complete);
  goals.push({ id: 'extract', label: 'Rejoindre la rampe de retour', current: Number(s.status === 'won'), target: 1, complete: s.status === 'won' });
  return goals;
}
