/** MI14 — a local picket, an unsafe batch and physical workshop operations. */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const job = () => ({ working: false, progress: 0, startedAt: null, completedAt: null });
const near = (s, x, radius = s.mission.workshop.interactionRadius) => Math.abs(s.player.x - x) <= radius;
const anchored = s => s.player.braced && !s.player.move && Math.abs(s.player.speed) < 3 && s.player.feet.every(foot => foot.contact);
const security = s => s.enemies.find(enemy => enemy.id === 'workshop-security-1');

export function workshopContext(previous = {}) {
  return { foundryRecorded: previous.foundryRecorded === true,
    foundryPlan: ['deliver', 'quarantine'].includes(previous.foundryPlan) ? previous.foundryPlan : 'none',
    pt03Acquired: previous.pt03Acquired === true,
    cargoTransferred: Number.isInteger(previous.cargoTransferred) ? clamp(previous.cargoTransferred, 0, 2) : 0,
    cargoLost: Number.isInteger(previous.cargoLost) ? clamp(previous.cargoLost, 0, 2) : 0 };
}

export function createWorkshopMission(s, previous, runtime) {
  const c = s.mission.workshop, ground = x => runtime.terrainAt(x, s.planetId);
  const body = (id, x, w, h, hp) => ({ id, x, y: ground(x) - h / 2, w, h, hp, maxHp: hp,
    destroyed: false, destroyedAt: null, flash: 0 });
  const post = (id, x) => ({ id, x, y: ground(x) - 42, w: 50, h: 84 });
  const names = ['Doria Sen', 'Milo Arven', 'Edda Sol', 'Jori Neme', 'Naël Voss', 'Orin Bale', 'Lysa Ren', 'Tevan Orr'];
  s.workshop = {
    workers: names.map((name, i) => ({ ...body(`workshop-worker-${i + 1}`, c.workerStartX + i * c.workerSpacing, 22, 38, 75),
      name, mechanic: i < 2, displaced: i >= 2 && i < 5,
      origin: i >= 2 && i < 5 ? 'nacre-before-known-census' : 'kharon-local-workshop',
      startX: c.workerStartX + i * c.workerSpacing, shelterX: c.shelterX + i * c.shelterSpacing,
      routeProgress: 0, moving: false, departedAt: null, sheltered: false, shelteredAt: null,
      alive: true, lastStep: -1 })),
    picket: { ...post('workshop-picket', c.picketX), ...job(), requested: false, requestedAt: null },
    contact: { ...post('workshop-contact', c.contactX), ...job(), inspected: false, inspectedAt: null,
      heard: false, heardAt: null, nacreAccount: false },
    lot: { ...body('workshop-lot', c.lotX, 126, 78, 240), ...job(),
      inspected: false, inspectedAt: null, copied: false, copiedAt: null, releasedAt: null, blockedAt: null, lastStep: -1 },
    valve: { ...body('workshop-valve', c.valveX, 54, 72, 220), ...job(), closed: false, closedAt: null, method: 'none' },
    cooler: { ...body('workshop-cooler', c.coolerX, 156, 112, 360), inspection: job(), repair: job(),
      inspected: false, inspectedAt: null, repaired: false, repairedAt: null,
      temperature: c.initialTemperature, exposureAdded: 0, lastStep: -1 },
    control: { ...body('workshop-control', c.controlX, 68, 94, 180), ...job(),
      operated: false, operatedAt: null, mode: 'pending' },
    cooperation: { ...post('workshop-cooperation', c.cooperationX), ...job(), resolved: false, agreed: false, agreedAt: null },
    report: { ...post('workshop-report', c.reportX), ...job(), transmitted: false, transmittedAt: null },
    alert: { triggered: false, triggeredAt: null, reason: 'none', elapsed: 0, ready: false, readyAt: null, neutralizedAt: null },
  };
  s.campaign = { missionId: 'MI14', phase: 'picket', context: workshopContext(previous),
    tutorial: { stepped: false, braced: false }, ...workshopDerivedFacts(s) };
  s.evidence.scanning = false;
}

/** The gallery belongs to workers; it does not invent an elevated walker route. */
export function workshopSurface(s, x, groundY) { return { groundY, traction: 1 }; }
export function workshopWorkerPosition(s, worker, runtime) {
  const x = worker.startX + (worker.shelterX - worker.startX) * worker.routeProgress;
  const ramp = clamp((x - (s.mission.workshop.shelterX - s.mission.workshop.galleryRamp)) / s.mission.workshop.galleryRamp, 0, 1);
  return { x, y: runtime.terrainAt(x, s.planetId) - worker.h / 2 - ramp * s.mission.workshop.galleryRise };
}
export function workshopDerivedFacts(s) {
  const d = s.workshop, plan = s.decision.resolved ? s.decision.choice === 'obey' ? 'restart' : 'hold' : 'unselected';
  const living = d.workers.filter(w => w.alive), mechanics = living.filter(w => w.mechanic);
  const cleared = d.workers.every(w => !w.alive || w.sheltered);
  const neutralized = Boolean(d.alert.ready && security(s)?.dead);
  const productionRestarted = d.control.operated && d.control.mode === 'restart';
  const productionOnline = productionRestarted && !d.control.destroyed && d.cooler.repaired && !d.cooler.destroyed;
  const mechanicsAvailable = d.cooperation.agreed && d.cooler.repaired && !d.cooler.destroyed && !productionOnline
    ? mechanics.filter(w => w.sheltered).length : 0;
  return { plan, execution: d.control.mode, passageRequested: d.picket.requested, picketCleared: cleared,
    workersTotal: d.workers.length, workersAlive: living.length, workersSheltered: living.filter(w => w.sheltered).length,
    workersLost: d.workers.length - living.length, displacedAlive: living.filter(w => w.displaced).length,
    mechanicsAlive: mechanics.length, mechanicsAvailable,
    contactInspected: d.contact.inspected, workersHeard: d.contact.heard, nacreAccountRecorded: d.contact.nacreAccount,
    lotInspected: d.lot.inspected, lotRecordCopied: d.lot.copied, localSabotageRecorded: d.lot.copied,
    pt03CrossReferenced: d.lot.copied && s.campaign?.context?.pt03Acquired === true,
    coolerInspected: d.cooler.inspected, circuitIsolated: d.valve.closed,
    coolerRepaired: d.cooler.repaired, coolerDestroyed: d.cooler.destroyed,
    controlOperated: d.control.operated, productionRestarted, productionOnline,
    strikePreserved: d.control.operated && d.control.mode === 'hold' && living.length > 0,
    strikeBroken: productionRestarted,
    cooperationResolved: d.cooperation.resolved, mechanicsCooperating: d.cooperation.agreed,
    securityTriggered: d.alert.triggered, securityReady: d.alert.ready, securityNeutralized: neutralized,
    operationsResolved: d.control.operated && d.cooler.inspected && (d.cooler.repaired || d.cooler.destroyed)
      && d.lot.inspected && d.contact.inspected && cleared && neutralized,
    reportTransmitted: d.report.transmitted, publicReleased: false, defected: false };
}
export function refreshWorkshopFacts(s) {
  Object.assign(s.campaign, workshopDerivedFacts(s));
  if (s.decision.active || s.decision.resolved) s.decision.body = workshopDecisionBody(s);
}
export function workshopReceiptRoster(s) {
  const unit = security(s);
  return structuredClone({ ...s.workshop, securityForces: unit ? [{ id: unit.id, type: unit.type, hp: unit.hp, maxHp: unit.maxHp, dead: unit.dead }] : [] });
}
export function workshopSolids(s) { return [...s.workshop.workers, s.workshop.lot, s.workshop.valve, s.workshop.cooler, s.workshop.control]; }

function triggerWorkshop(s, reason, runtime) {
  const a = s.workshop.alert;
  if (a.triggered) return;
  Object.assign(a, { triggered: true, triggeredAt: s.elapsed, reason });
  runtime.emit(s, 'radio', 'Tess : « L’automate reçoit un ordre de dégagement. Cinq secondes avant son activation. Dégage la ligne de tir des ouvriers. »');
}
function cancel(work) { if (work.working) Object.assign(work, { working: false, progress: 0, startedAt: null }); }
export function hitWorkshopPart(s, part, damage, runtime) {
  if (!part || part.destroyed || !(damage > 0)) return;
  part.hp = Math.max(0, part.hp - damage); part.flash = .12;
  if (part.hp === 0) {
    part.destroyed = true; part.destroyedAt = s.elapsed;
    if (Object.hasOwn(part, 'alive')) {
      part.alive = false; part.moving = false; s.stats.collateral++;
      runtime.emit(s, 'radio', `Sami : « ${part.name} est mort. Le bilan conservera cette perte. »`);
    }
    if (Object.hasOwn(part, 'working')) cancel(part);
    if (part.inspection) cancel(part.inspection);
    if (part.repair) cancel(part.repair);
    // An already completed cut isolates the upstream feed; breaking its local
    // actuator later does not reconnect that feed or undo an acquired operation.
  }
  triggerWorkshop(s, part.id.startsWith('workshop-worker-') ? 'worker-hit' : 'material-hit', runtime);
  refreshWorkshopFacts(s);
}
export function workshopFootfall(s, foot, runtime) {
  if (!foot.contact) return;
  for (const part of workshopSolids(s)) {
    if (part.destroyed || part.lastStep === s.stats.steps || !Object.hasOwn(part, 'lastStep')) continue;
    if (Math.abs(foot.x - part.x) > part.w / 2 + 22 || Math.abs(foot.y - (part.y + part.h / 2)) > 24) continue;
    part.lastStep = s.stats.steps;
    hitWorkshopPart(s, part, Object.hasOwn(part, 'alive') ? 90 : Math.max(3, s.walker.weight * .035), runtime);
  }
}

export function workshopDecisionBody(s) {
  const f = workshopDerivedFacts(s);
  const source = f.lotRecordCopied
    ? 'Le relevé du lot conserve un dispositif de rupture ajouté aux pièces : c’est un constat local de sabotage.'
    : 'Le relevé du lot est perdu. Le dossier conserve son absence, sans reconstruire les inscriptions.';
  const voices = f.workersHeard ? 'Les ouvriers ont expliqué pourquoi ils refusent cet envoi.' : 'Aucune explication ouvrière n’a pu être recueillie.';
  const link = f.pt03CrossReferenced ? 'La série peut être rapprochée de PT03 déjà conservée.' : 'Aucun recoupement avec PT03 n’est établi.';
  return `${voices} ${source} ${link} ${f.workersAlive} personnes restent vivantes. Le choix fixe un ordre ; il faut ensuite agir cinq secondes sur la commande de l’atelier. Aucune preuve politique globale ni défection n’en résulte.`;
}
function start(s, work) {
  if (work.working || work.completedAt !== null) return false;
  Object.assign(work, { working: true, progress: 0, startedAt: s.elapsed }); return true;
}
const readyForChoice = s => { const f = workshopDerivedFacts(s); return f.picketCleared && f.contactInspected && f.lotInspected && f.coolerInspected && (f.coolerRepaired || f.coolerDestroyed) && f.securityNeutralized; };
const readyForReport = s => { const f = workshopDerivedFacts(s); return f.operationsResolved && f.cooperationResolved; };
export function workshopAvailableJobs(s) {
  const d = s.workshop, f = workshopDerivedFacts(s), c = s.mission.workshop, tasks = [];
  const add = (kind, part, work, x, label) => tasks.push({ kind, part, work, x, label });
  if (!d.picket.requested) add('picket', d.picket, d.picket, d.picket.x, `Demander le passage vers la galerie — ${c.passageTime} s`);
  if (!d.contact.inspected && f.picketCleared) add('contact', d.contact, d.contact, d.contact.x,
    f.workersAlive ? `Écouter les ouvriers depuis la galerie — ${c.contactTime} s` : `Consigner l’absence d’interlocuteur — ${c.contactTime} s`);
  if (!d.lot.inspected) add('lot', d.lot, d.lot, d.lot.x,
    d.lot.destroyed ? `Constater le relevé du lot perdu — ${c.recordTime} s` : `Copier le relevé du lot contesté — ${c.recordTime} s`);
  if (!d.cooler.inspected) add('inspect', d.cooler, d.cooler.inspection, d.cooler.x,
    d.cooler.destroyed ? `Constater le refroidisseur détruit — ${c.inspectTime} s` : `Relever la panne du refroidisseur — ${c.inspectTime} s`);
  if (d.cooler.inspected && !d.valve.closed && !d.cooler.destroyed) add('valve', d.valve, d.valve, d.valve.x,
    d.valve.destroyed ? `Obturer le circuit amont par le raccord de secours — ${c.isolateTime} s` : `Isoler le circuit amont — ${c.isolateTime} s`);
  if (d.cooler.inspected && d.valve.closed && !d.cooler.destroyed && !d.cooler.repaired)
    add('repair', d.cooler, d.cooler.repair, d.cooler.x, `Réparer le refroidisseur sous ancrage — ${c.repairTime} s`);
  if (!s.decision.resolved && readyForChoice(s)) add('orders', d.control, null, d.control.x, 'Répondre à l’ordre de remise en production');
  if (s.decision.resolved && !d.control.operated) add('control', d.control, d.control, d.control.x,
    d.control.destroyed || f.plan === 'restart' && d.cooler.destroyed ? `Constater la remise en service impossible — ${c.controlTime} s`
      : f.plan === 'restart' ? `Rétablir la commande de production — ${c.controlTime} s` : `Verrouiller l’arrêt et retenir le lot — ${c.controlTime} s`);
  if (f.operationsResolved && !d.cooperation.resolved) add('cooperation', d.cooperation, d.cooperation, d.cooperation.x,
    f.workersAlive ? `Demander l’accord des mécaniciens locaux — ${c.cooperationTime} s` : `Consigner l’absence de coopération possible — ${c.cooperationTime} s`);
  if (readyForReport(s) && !d.report.transmitted) add('report', d.report, d.report, d.report.x, `Transmettre le bilan de l’atelier — ${c.reportTime} s`);
  return tasks;
}
const nearestJob = s => workshopAvailableJobs(s).filter(t => near(s, t.x)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
export function workshopInteraction(s) {
  const task = nearestJob(s);
  if (task) return task.work?.working ? `${task.label} · ${Math.floor(task.work.progress * 100)} %` : `E · ${task.label}`;
  if (s.workshop.picket.requested && !workshopDerivedFacts(s).picketCleared && s.player.x < 2150) return 'Attendre que les huit ouvriers aient quitté les appuis ; leur trajet vers la galerie est réel';
  return '';
}
export function interactWorkshopMission(s, runtime) {
  refreshWorkshopFacts(s); const task = nearestJob(s);
  if (!task) return false;
  if (task.kind === 'orders') { s.decision.active = true; s.campaign.phase = 'decision'; s.decision.body = workshopDecisionBody(s); return true; }
  if (!anchored(s)) return false;
  return start(s, task.work);
}
export function chooseWorkshopMission(s, choice, runtime) {
  if (choice === 'obey') s.stats.ordersObeyed++; else s.stats.ordersDefied++;
  runtime.emit(s, 'radio', choice === 'obey'
    ? 'Sera : « Ordre de reprise confirmé. Je dois encore réarmer la commande. Les pièces relevées et les pertes resteront au rapport. »'
    : 'Sera : « Le lot reste ici. Je verrouille l’arrêt avant de demander aux mécaniciens s’ils veulent nous aider. »');
  refreshWorkshopFacts(s); s.campaign.phase = 'operation';
}
function advance(s, work, dt, duration, valid, complete) {
  if (!work.working) return;
  if (!valid) { cancel(work); return; }
  work.progress = Math.min(1, work.progress + dt / duration);
  if (work.progress >= 1 - 1e-10) { work.progress = 1; work.working = false; work.completedAt = s.elapsed; complete(); }
}

export function updateWorkshopMission(s, dt, runtime) {
  const d = s.workshop, c = s.mission.workshop, stable = anchored(s);
  for (const part of workshopSolids(s)) part.flash = Math.max(0, part.flash - dt);
  if (!d.alert.triggered && s.player.x >= c.activationX) triggerWorkshop(s, 'workshop-approach', runtime);
  if (d.alert.triggered && !d.alert.ready) {
    d.alert.elapsed = Math.min(c.securityDelay, Math.max(0, s.elapsed - d.alert.triggeredAt));
    if (d.alert.elapsed >= c.securityDelay - 1e-9) {
      d.alert.elapsed = c.securityDelay; d.alert.ready = true; d.alert.readyAt = s.elapsed;
      runtime.emit(s, 'radio', 'Tess : « L’automate est actif. Ses tirs traversent l’atelier ; garde les ouvriers hors de ta ligne de feu. »');
    }
  }
  if (d.alert.ready && security(s)?.dead && d.alert.neutralizedAt === null) d.alert.neutralizedAt = s.elapsed;
  advance(s, d.picket, dt, c.passageTime, stable && near(s, d.picket.x), () => {
    d.picket.requested = true; d.picket.requestedAt = s.elapsed;
    for (const w of d.workers) if (w.alive && !w.sheltered) { w.moving = true; w.departedAt = s.elapsed; }
    const speaker = d.workers.find(w => w.alive);
    runtime.emit(s, 'radio', speaker ? `${speaker.name} : « On prend la galerie. Attendez que le dernier soit sur la rampe avant de faire passer vos pieds. »` : 'Sami : « Le piquet ne compte plus de survivant. Nous conserverons les pertes au rapport. »');
  });
  for (const w of d.workers) if (w.alive && w.moving && !w.sheltered) {
    w.routeProgress = Math.min(1, w.routeProgress + c.workerSpeed * dt / (w.shelterX - w.startX));
    Object.assign(w, workshopWorkerPosition(s, w, runtime));
    if (w.routeProgress >= 1 - 1e-10) { w.routeProgress = 1; w.sheltered = true; w.shelteredAt = s.elapsed; w.moving = false; }
  }
  advance(s, d.contact, dt, c.contactTime, stable && near(s, d.contact.x) && workshopDerivedFacts(s).picketCleared, () => {
    d.contact.inspected = true; d.contact.inspectedAt = s.elapsed;
    d.contact.heard = d.workers.some(w => w.alive && w.sheltered);
    d.contact.heardAt = d.contact.heard ? s.elapsed : null;
    d.contact.nacreAccount = d.workers.some(w => w.alive && w.sheltered && w.displaced);
    runtime.emit(s, 'radio', d.contact.heard
      ? `${d.workers.find(w => w.alive && w.sheltered).name} : « On a contrôlé les pièces. Quelqu’un y a ajouté un point de rupture, puis demandé notre signature. On n’expédie pas ça. »${d.contact.nacreAccount ? ' Un ouvrier de Nacre confirme que son arrivée ici précède votre tournée.' : ''}`
      : 'Sami : « Personne ne peut plus répondre dans cette galerie. Je consigne l’absence ; je ne leur prêterai pas de paroles. »');
  });
  advance(s, d.lot, dt, c.recordTime, stable && near(s, d.lot.x), () => {
    d.lot.inspected = true; d.lot.inspectedAt = s.elapsed;
    if (!d.lot.destroyed) { d.lot.copied = true; d.lot.copiedAt = s.elapsed; }
    runtime.emit(s, 'radio', d.lot.copied
      ? 'Tess : « Le contrôle de ce lot relève une rupture ajoutée après fabrication. Je conserve le relevé. Cela décrit ces pièces ; ce n’est pas encore la chaîne des ordres. »'
      : 'Tess : « Le support du relevé est détruit. Aucun marquage ni constat de sabotage n’est reconstitué. »');
  });
  advance(s, d.cooler.inspection, dt, c.inspectTime, stable && near(s, d.cooler.x), () => {
    d.cooler.inspected = true; d.cooler.inspectedAt = s.elapsed;
  });
  advance(s, d.valve, dt, c.isolateTime, stable && near(s, d.valve.x) && !d.cooler.destroyed, () => {
    d.valve.closed = true; d.valve.closedAt = s.elapsed; d.valve.method = d.valve.destroyed ? 'cap' : 'valve';
    runtime.emit(s, 'objective', 'Circuit amont isolé. Le refroidisseur doit encore être réparé ; les dégâts de l’atelier restent acquis.');
  });
  advance(s, d.cooler.repair, dt, c.repairTime, stable && near(s, d.cooler.x) && d.cooler.inspected && d.valve.closed && !d.cooler.destroyed, () => {
    d.cooler.repaired = true; d.cooler.repairedAt = s.elapsed;
    runtime.emit(s, 'radio', 'Tess : « Échangeur raccordé. La température va descendre. Nous avons rétabli le refroidissement, pas donné un ordre de production. »');
  });
  advance(s, d.control, dt, c.controlTime, stable && near(s, d.control.x) && s.decision.resolved && readyForChoice(s), () => {
    const plan = workshopDerivedFacts(s).plan;
    d.control.operated = true; d.control.operatedAt = s.elapsed;
    d.control.mode = d.control.destroyed || plan === 'restart' && d.cooler.destroyed ? 'damaged' : plan;
    if (!d.lot.destroyed && d.control.mode === 'restart') d.lot.releasedAt = s.elapsed;
    if (!d.lot.destroyed && d.control.mode === 'hold') d.lot.blockedAt = s.elapsed;
    runtime.emit(s, 'objective', d.control.mode === 'restart' ? 'La production a été remise en marche. Le lot est libéré localement ; aucune expédition hors de la scène n’est inventée.'
      : d.control.mode === 'hold' ? 'L’arrêt est verrouillé et le lot retenu. L’accord des mécaniciens reste à demander.' : 'La commande ne peut pas réaliser l’ordre : le constat garde les dommages et l’opération impossible.');
  });
  advance(s, d.cooperation, dt, c.cooperationTime, stable && near(s, d.cooperation.x) && workshopDerivedFacts(s).operationsResolved, () => {
    d.cooperation.resolved = true;
    d.cooperation.agreed = d.control.mode === 'hold' && d.contact.heard && d.cooler.repaired && !d.cooler.destroyed && d.workers.some(w => w.alive && w.sheltered && w.mechanic);
    d.cooperation.agreedAt = d.cooperation.agreed ? s.elapsed : null;
    runtime.emit(s, 'radio', d.cooperation.agreed
      ? `${d.workers.find(w => w.alive && w.sheltered && w.mechanic).name} : « Vous avez remis le froid, sans nous forcer à signer l’envoi. Les mécaniciens encore présents vous ouvriront l’atelier. Nous restons ici ; c’est une aide locale. »`
      : 'Sami : « L’échange ne donne pas d’accord d’aide mécanique. Le dossier conservera ce refus ou l’absence d’interlocuteur. »');
  });
  advance(s, d.report, dt, c.reportTime, stable && near(s, d.report.x) && readyForReport(s), () => {
    d.report.transmitted = true; d.report.transmittedAt = s.elapsed;
    runtime.emit(s, 'objective', 'Bilan transmis : ouvriers, lot, refroidisseur et actes de l’atelier. Rejoindre la rampe d’extraction.');
  });
  if (!d.cooler.destroyed) {
    const target = d.cooler.repaired ? c.safeTemperature : d.valve.closed ? c.isolatedTemperature : c.initialTemperature;
    d.cooler.temperature = Math.max(target, d.cooler.temperature - (d.cooler.repaired ? c.coolingRate : c.isolationCoolingRate) * dt);
    if (Math.abs(s.player.x - d.cooler.x) <= c.thermalRadius) {
      const amount = Math.max(0, d.cooler.temperature - 45) * .035 * dt;
      s.player.heat = Math.min(100, s.player.heat + amount); d.cooler.exposureAdded += amount;
      if (s.player.heat >= 100) s.player.overheated = true;
    }
  }
  refreshWorkshopFacts(s);
  s.campaign.phase = d.report.transmitted ? 'extract' : d.cooperation.resolved ? 'report' : d.control.operated ? 'cooperation'
    : s.decision.resolved ? 'operation' : readyForChoice(s) ? 'decision' : !workshopDerivedFacts(s).picketCleared ? 'picket'
      : !d.contact.inspected ? 'contact' : !workshopDerivedFacts(s).securityNeutralized ? 'security' : 'maintenance';
  s.extraction.active = d.report.transmitted;
}
export function workshopObjectives(s) {
  const f = workshopDerivedFacts(s), objective = (id, label, current, target = 1) => ({ id, label, current, target, complete: current >= target });
  return [objective('picket', 'Laisser les ouvriers rejoindre la galerie ; conserver les pertes', f.workersSheltered + f.workersLost, 8),
    objective('workers', 'Écouter les ouvriers ou consigner leur absence', Number(f.contactInspected)),
    objective('security', 'Neutraliser l’automate après son activation', Number(f.securityNeutralized)),
    objective('cooler', 'Réparer le refroidisseur ou constater sa perte', Number(f.coolerInspected && (f.coolerRepaired || f.coolerDestroyed))),
    objective('lot', 'Copier le relevé du lot ou constater sa perte', Number(f.lotInspected)),
    objective('operation', 'Choisir puis accomplir l’opération de commande', Number(f.controlOperated)),
    objective('cooperation', 'Recueillir la réponse des mécaniciens', Number(f.cooperationResolved)),
    objective('report', 'Transmettre le bilan avant l’extraction', Number(f.reportTransmitted))];
}
