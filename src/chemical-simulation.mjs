/** MI10 physical chemical field. This module mutates only a MI10 scene. */
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const copy = value => structuredClone(value);
const jobs = () => ({ working: false, progress: 0, startedAt: null, completedAt: null });
const sum = (items, field) => items.reduce((total, item) => total + item[field], 0);
const privateUnits = s => s.enemies.filter(enemy => enemy.id.startsWith('chemical-private-'));

export function chemicalContext(previous = {}) {
  return { routeRecorded: previous.routeRecorded === true,
    routeChoice: ['obey', 'defy'].includes(previous.routeChoice) ? previous.routeChoice : 'none',
    routeApproach: ['guided', 'surveyed'].includes(previous.routeApproach) ? previous.routeApproach : 'unprepared',
    routePassagePreserved: previous.routePassagePreserved === true,
    routeHarvestFragile: previous.routeHarvestFragile === true };
}

export function createChemicalMission(s, previous, runtime) {
  const c = s.mission.chemical, ground = x => runtime.terrainAt(x, s.planetId);
  const body = (id, x, w, h, hp) => ({ id, x, y: ground(x) - h / 2, w, h, hp, maxHp: hp, destroyed: false, destroyedAt: null, flash: 0 });
  const station = (id, x, w = 56, h = 60) => ({ id, x, y: ground(x) - h / 2, w, h, ...jobs() });
  s.chemical = {
    tanks: c.tankXs.map((x, i) => ({ ...body(`chemical-tank-${i + 1}`, x, 140, 160, 500),
      role: ['carrier', 'binder', 'active'][i], initialVolume: c.tankVolume, volume: c.tankVolume,
      inspected: false, identified: false, secured: false, demolished: false, work: 'none',
      inspectedAt: null, identifiedAt: null, securedAt: null, demolishedAt: null, ...jobs() })),
    collector: { ...body('chemical-collector', c.collectorX, 72, 84, 400), controlX: c.collectorControlX,
      closed: false, closedAt: null, ...jobs() },
    leak: { ...station('chemical-leak-control', c.leakControlX, 42, 50), sourceId: `chemical-tank-${c.sourceTankIndex + 1}`, contained: false, containedAt: null },
    sampler: { ...body('chemical-sampler', c.samplerX, 64, 72, 420), sourceId: `chemical-tank-${c.sourceTankIndex + 1}`,
      started: false, collected: false, lost: false, firstStartedAt: null, collectedAt: null, lostAt: null, volumeCollected: 0, ...jobs() },
    record: { ...body('chemical-orison-record', c.recordX, 68, 76, 200), inspected: false, copied: false, copiedAt: null, ...jobs() },
    orders: { id: 'chemical-orders-post', x: c.decisionX, y: ground(c.decisionX) - 35, w: 60, h: 70 },
    canals: c.canalXs.map((x, i) => ({ ...body(`chemical-canal-${i + 1}`, x, 260, 24, 320),
      controlX: x - c.canalControlOffset, covered: false, coveredAt: null, contamination: 0, lastStep: -1, ...jobs() })),
    homes: c.homeXs.map((x, i) => ({ ...body(`chemical-village-home-${i + 1}`, x, 140, 100, 300), habitable: true })),
    water: { ...station('chemical-water-control', c.waterX), resolved: false, restored: false, resolvedAt: null },
    report: { ...station('chemical-report', c.reportX, 58, 72), transmitted: false, transmittedAt: null },
    spill: { pendingMass: 0, emissionClock: 0, totalReleased: 0, nextPlumeId: 0 },
    plumes: [], alert: { triggered: false, reason: 'none', elapsed: 0, triggeredAt: null, ready: false, readyAt: null },
  };
  s.campaign = { missionId: 'MI10', phase: 'survey', plan: 'unselected', tanksTotal: 3,
    tanksInspected: 0, copiedMarks: 0, tanksDestroyed: 0, tanksSecured: 0,
    leakContained: false, leakStopped: false, sourceVolume: c.tankVolume,
    collectorClosed: false, collectorDestroyed: false,
    spillReleased: 0, spillRetained: 0, spillDelivered: 0, spillInTransit: 0, flowResolved: false,
    canalsIntact: 2, canalsCovered: 0, canalsPolluted: 0, waterDispositionRecorded: false, waterRestored: false,
    homesHabitable: 2, villageHabitable: true,
    orisonRecordInspected: false, orisonRecordCopied: false, orisonRecordLost: false,
    sampleStarted: false, sampleCollected: false, sampleLost: false, sampleResolved: false, pt02Acquired: false,
    privateTriggered: false, privateReady: false, privateNeutralized: 0,
    operationsResolved: false, reportTransmitted: false, manifestRead: false,
    context: chemicalContext(previous), tutorial: { stepped: false, braced: false } };
  s.evidence.scanning = false; s.evidence.scanTime = c.sampleTime;
}

export function chemicalReceiptRoster(s) {
  return copy({ ...s.chemical, privateForces: privateUnits(s).map(enemy => ({ id: enemy.id, type: enemy.type,
    hp: enemy.hp, maxHp: enemy.maxHp, dead: enemy.dead })) });
}

export function chemicalSurface(s, x, groundY) {
  const canal = s.chemical.canals.find(part => !part.destroyed && part.covered && Math.abs(part.x - x) <= part.w / 2);
  return { groundY: groundY - (canal ? 10 : 0), canalId: canal?.id || null, rise: canal ? 10 : 0, traction: canal ? .88 : 1 };
}

export function chemicalSolids(s) {
  const d = s.chemical;
  return [...d.tanks, d.collector, d.sampler, d.record, ...d.canals, ...d.homes];
}

export function refreshChemicalFacts(s) {
  const d = s.chemical, c = s.campaign, settings = s.mission.chemical, source = d.tanks[settings.sourceTankIndex];
  const canalsWork = d.canals.every(canal => !canal.destroyed);
  const clean = d.canals.every(canal => canal.contamination < settings.contaminationLimit);
  for (const home of d.homes) home.habitable = !home.destroyed && canalsWork && clean;
  d.water.restored = d.water.resolved && !d.collector.closed && canalsWork;
  Object.assign(c, { tanksInspected: d.tanks.filter(tank => tank.inspected).length,
    copiedMarks: d.tanks.filter(tank => tank.identified).length, tanksDestroyed: d.tanks.filter(tank => tank.destroyed).length,
    tanksSecured: d.tanks.filter(tank => tank.secured && !tank.destroyed).length,
    leakContained: d.leak.contained, leakStopped: d.leak.contained || source.destroyed || source.volume <= 0,
    sourceVolume: source.volume, collectorClosed: d.collector.closed, collectorDestroyed: d.collector.destroyed,
    spillReleased: d.spill.totalReleased, spillRetained: sum(d.plumes.filter(p => p.phase === 'retained'), 'mass'),
    spillDelivered: sum(d.plumes.filter(p => p.phase === 'delivered'), 'mass'),
    spillInTransit: d.spill.pendingMass + sum(d.plumes.filter(p => p.phase === 'flowing'), 'mass'),
    canalsIntact: d.canals.filter(canal => !canal.destroyed).length,
    canalsCovered: d.canals.filter(canal => canal.covered && !canal.destroyed).length,
    canalsPolluted: d.canals.filter(canal => canal.contamination >= settings.contaminationLimit).length,
    waterDispositionRecorded: d.water.resolved, waterRestored: d.water.restored,
    homesHabitable: d.homes.filter(home => home.habitable).length,
    villageHabitable: d.homes.every(home => home.habitable) && !d.collector.closed,
    orisonRecordInspected: d.record.inspected, orisonRecordCopied: d.record.copied, orisonRecordLost: d.record.destroyed,
    sampleStarted: d.sampler.started, sampleCollected: d.sampler.collected, sampleLost: d.sampler.lost,
    sampleResolved: d.sampler.collected || d.sampler.lost,
    privateTriggered: d.alert.triggered, privateReady: d.alert.ready, privateNeutralized: privateUnits(s).filter(enemy => enemy.dead).length,
    operationsResolved: s.decision.resolved && d.tanks.every(tank => c.plan === 'demolish' ? tank.destroyed : tank.secured || tank.destroyed),
    reportTransmitted: d.report.transmitted, manifestRead: d.tanks.every(tank => tank.inspected) && d.record.inspected });
  c.flowResolved = c.leakStopped && c.spillInTransit < 1e-7;
  c.pt02Acquired = c.sampleCollected && c.copiedMarks === 3 && c.orisonRecordCopied;
  if (s.decision.active || s.decision.resolved) s.decision.body = chemicalDecisionBody(s);
}

export function chemicalDecisionBody(s) {
  const c = s.campaign;
  return `${c.tanksInspected} cuves relevées ; ${c.copiedMarks} marquages matériels conservés. ${c.orisonRecordCopied ? 'Le registre matériel relie les lots aux terraformes d’Orison.' : 'Le registre de provenance n’a pas été copié.'} ${c.sampleCollected ? 'Un échantillon a été prélevé.' : c.sampleLost ? 'Le prélèvement est perdu ; aucune matière n’est recréée par le rapport.' : 'Un prélèvement reste à accomplir et à défendre.'} Détruire les cuves ou isoler celles qui tiennent exige une opération sur place. Le collecteur, l’écoulement et les canaux gardent leurs états réels.`;
}

const near = (s, x, radius = s.mission.chemical.interactionRadius) => Math.abs(s.player.x - x) <= radius;
const anchored = s => s.player.braced && !s.player.move && Math.abs(s.player.speed) < 3 && s.player.feet.every(foot => foot.contact);
const sourceTank = s => s.chemical.tanks[s.mission.chemical.sourceTankIndex];

function alertPrivateForces(s, reason, runtime) {
  const alert = s.chemical.alert;
  if (alert.triggered) return;
  alert.triggered = true; alert.reason = reason; alert.triggeredAt = s.elapsed; alert.elapsed = 0;
  runtime.emit(s, 'radio', 'Tess : « Une force privée a reçu le signal du site. Cinq secondes avant son entrée. Protège le préleveur et surveille tes lignes de tir. »');
}

function releasePlume(s, source, mass, runtime) {
  if (!(mass > 0)) return;
  s.chemical.plumes.push({ id: `chemical-plume-${++s.chemical.spill.nextPlumeId}`, sourceId: source.id,
    x: source.x, y: runtime.terrainAt(source.x, s.planetId) - 5, w: 32, h: 10, mass,
    phase: 'flowing', passedCanals: 0, deposits: [0, 0], releasedAt: s.elapsed, arrivedAt: null });
}

function flushLeak(s, runtime) {
  const spill = s.chemical.spill;
  if (spill.pendingMass > 0) releasePlume(s, sourceTank(s), spill.pendingMass, runtime);
  spill.pendingMass = 0; spill.emissionClock = 0;
}

function loseSample(s, runtime) {
  const sampler = s.chemical.sampler;
  if (sampler.collected || sampler.lost) return;
  sampler.lost = true; sampler.lostAt = s.elapsed; sampler.working = false; sampler.progress = 0;
  alertPrivateForces(s, 'source-loss', runtime);
  runtime.emit(s, 'radio', 'Tess : « Source ou appareil perdu avant la collecte. Le prélèvement a échoué ; le rapport conservera cette perte. »');
}

export function hitChemicalPart(s, part, damage, runtime) {
  if (!part || part.destroyed || !(damage > 0)) return;
  part.hp = Math.max(0, part.hp - damage); part.flash = .12;
  if (part.hp > 0) return;
  part.destroyed = true; part.destroyedAt = s.elapsed;
  if (Object.hasOwn(part, 'working')) part.working = false;
  if (s.chemical.tanks.includes(part)) {
    const mass = part.volume;
    part.volume = 0; part.demolished = true; part.demolishedAt = s.elapsed;
    s.chemical.spill.totalReleased += mass; releasePlume(s, part, mass, runtime);
    alertPrivateForces(s, 'demolition', runtime);
    runtime.emit(s, 'objective', `Cuve rompue : ${Math.round(mass * 10) / 10} unités rejoignent l’écoulement.`, part.x, part.y);
  }
  if (part === s.chemical.collector) part.closed = false;
  if (part === sourceTank(s)) flushLeak(s, runtime);
  if (part === sourceTank(s) || part === s.chemical.sampler) loseSample(s, runtime);
  refreshChemicalFacts(s);
}

export function chemicalFootfall(s, foot, runtime) {
  for (const canal of s.chemical.canals) {
    if (canal.destroyed || canal.covered || canal.lastStep === s.stats.steps || Math.abs(foot.x - canal.x) > canal.w / 2) continue;
    canal.lastStep = s.stats.steps;
    hitChemicalPart(s, canal, Math.max(2, s.walker.weight * .04), runtime);
    runtime.emit(s, 'radio', 'Tess : « Appui sur un canal découvert : la structure a pris la charge. Le poste de couverture est en amont. »');
  }
}

function startJob(s, part, work = null) {
  if (part.working) return false;
  part.working = true; part.progress = 0; part.startedAt = s.elapsed; part.completedAt = null;
  if (work) part.work = work;
  return true;
}

function reportReady(s) {
  const c = s.campaign;
  return c.manifestRead && s.decision.resolved && c.operationsResolved && c.sampleResolved
    && c.privateNeutralized === 3 && c.waterDispositionRecorded && c.flowResolved;
}

function availableJobs(s) {
  const d = s.chemical, c = s.campaign, jobs = [];
  const add = (kind, part, x, label) => jobs.push({ kind, part, x, label });
  if (!d.collector.closed && !d.collector.destroyed && !d.water.resolved) add('collector', d.collector, d.collector.controlX, 'Fermer le collecteur de rétention — ancrage requis');
  for (const tank of d.tanks) {
    if (!tank.inspected) add('inspect', tank, tank.x, tank.destroyed ? 'Relever la cuve détruite — marquage perdu' : 'Identifier la cuve et copier son marquage');
    else if (s.decision.resolved && !tank.destroyed && (c.plan === 'demolish' || !tank.secured)) add(c.plan, tank, tank.x, c.plan === 'demolish' ? 'Démolir cette cuve — ancrage requis' : 'Isoler cette cuve — ancrage requis');
  }
  if (!c.leakStopped) add('contain', d.leak, d.leak.x, 'Contenir la fuite — ancrage requis');
  if (!d.record.inspected) add('record', d.record, d.record.x, d.record.destroyed ? 'Constater la perte du registre matériel' : 'Copier le registre matériel d’Orison');
  if (c.manifestRead && !c.sampleResolved) add('sample', d.sampler, d.sampler.x, 'Lancer le prélèvement — rester dans la zone du préleveur et défendre');
  if (c.manifestRead && c.leakStopped && !s.decision.resolved) add('orders', d.orders, d.orders.x, 'Lire le relevé et choisir la conduite');
  for (const canal of d.canals) if (!canal.covered && !canal.destroyed) add('cover', canal, canal.controlX, 'Poser la couverture du canal — ancrage requis');
  if (c.operationsResolved && c.flowResolved && !d.water.resolved) add('water', d.water, d.water.x, 'Rétablir le circuit d’eau ou consigner ses pertes — ancrage requis');
  if (reportReady(s) && !d.report.transmitted) add('report', d.report, d.report.x, 'Transmettre le rapport matériel du champ');
  return jobs;
}

export function chemicalInteraction(s) {
  const job = availableJobs(s).filter(job => near(s, job.x)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
  if (job) return job.part.working ? `Travail en cours — ${Math.floor(job.part.progress * 100)} %` : `E — ${job.label}`;
  const d = s.chemical, c = s.campaign;
  if (near(s, d.sampler.x) && d.sampler.working) return `Prélèvement — ${Math.floor(d.sampler.progress * 100)} % ; protéger l’appareil`;
  if (near(s, d.orders.x) && !s.decision.resolved) return !c.leakStopped ? 'Contenir la fuite avant de compiler le relevé' : 'Relever les trois cuves et le registre matériel';
  if (near(s, d.water.x) && !d.water.resolved) return 'Attendre la fin des opérations sur les cuves et de l’écoulement';
  if (near(s, d.report.x) && !d.report.transmitted) return 'Achever les travaux, le prélèvement ou son constat, la défense et le circuit d’eau';
  return '';
}

export function interactChemicalMission(s, runtime) {
  refreshChemicalFacts(s);
  const job = availableJobs(s).filter(job => near(s, job.x)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
  if (!job || job.part.working) return false;
  if (job.kind === 'orders') {
    s.campaign.phase = 'decision'; s.decision.body = chemicalDecisionBody(s); s.decision.active = true;
    return true;
  }
  if (['collector', 'contain', 'secure', 'demolish', 'cover', 'water'].includes(job.kind) && !anchored(s)) return false;
  if (job.kind === 'sample') {
    if (job.part.destroyed || sourceTank(s).destroyed || sourceTank(s).volume < s.mission.chemical.sampleVolume) { loseSample(s, runtime); return true; }
    job.part.started = true; job.part.firstStartedAt ??= s.elapsed;
    alertPrivateForces(s, 'sample', runtime);
  }
  return startJob(s, job.part, ['inspect', 'secure', 'demolish'].includes(job.kind) ? job.kind : null);
}

export function chooseChemicalMission(s, choice, runtime) {
  s.campaign.plan = choice === 'obey' ? 'demolish' : 'secure'; s.campaign.phase = 'operations';
  if (choice === 'obey') s.stats.ordersObeyed++; else s.stats.ordersDefied++;
  runtime.emit(s, 'radio', choice === 'obey'
    ? 'Sera : « Démolition ordonnée. Prélevons d’abord si la source tient encore, puis opérons chaque cuve ; le collecteur doit retenir les volumes libérés. »'
    : 'Sera : « Nous isolons les cuves encore debout. Le prélèvement, les vannes et le circuit d’eau restent à traiter sur place. »');
  refreshChemicalFacts(s);
}

function advanceJob(s, part, dt, duration, valid, completed) {
  if (!part.working) return;
  if (!valid) { part.working = false; part.progress = 0; part.startedAt = null; return; }
  part.progress = Math.min(1, part.progress + dt / duration);
  if (part.progress >= 1 - 1e-10) {
    part.progress = 1; part.working = false; part.completedAt = s.elapsed; completed();
  }
}

function updateFlows(s, dt, runtime) {
  const d = s.chemical, settings = s.mission.chemical, source = sourceTank(s), spill = d.spill;
  if (!d.leak.contained && !source.destroyed && source.volume > 0) {
    const mass = Math.min(source.volume, dt * settings.leakRate);
    source.volume -= mass; spill.pendingMass += mass; spill.totalReleased += mass; spill.emissionClock += dt;
    if (spill.emissionClock >= 1 - 1e-9 || source.volume <= 0) flushLeak(s, runtime);
  }
  for (const plume of d.plumes) {
    // Retained matter is already in a separate basin. Opening or breaking the
    // diversion valve affects later flow, never empties that captured inventory.
    if (plume.phase !== 'flowing' || plume.releasedAt === s.elapsed) continue;
    const nextX = Math.min(settings.villageX, plume.x + settings.flowSpeed * dt);
    if (plume.x <= d.collector.x && nextX >= d.collector.x && d.collector.closed && !d.collector.destroyed) {
      plume.x = d.collector.x; plume.phase = 'retained'; plume.arrivedAt = s.elapsed;
    } else {
      plume.x = nextX;
      for (const [index, canal] of d.canals.entries()) if (plume.passedCanals <= index && nextX >= canal.x) {
        plume.passedCanals = index + 1; plume.deposits[index] = plume.mass; canal.contamination += plume.mass;
      }
      if (nextX >= settings.villageX) { plume.phase = 'delivered'; plume.arrivedAt = s.elapsed; }
    }
    plume.y = runtime.terrainAt(plume.x, s.planetId) - 5;
  }
}

export function updateChemicalMission(s, dt, runtime) {
  const d = s.chemical, c = s.campaign, settings = s.mission.chemical, stable = anchored(s);
  for (const part of chemicalSolids(s)) part.flash = Math.max(0, part.flash - dt);
  for (const tank of d.tanks) advanceJob(s, tank, dt,
    tank.work === 'inspect' ? settings.inspectTime : tank.work === 'secure' ? settings.secureTime : settings.demolishTime,
    near(s, tank.x) && (tank.work === 'inspect' || stable && !tank.destroyed), () => {
      if (tank.work === 'inspect') {
        tank.inspected = true; tank.inspectedAt = s.elapsed;
        if (!tank.destroyed) { tank.identified = true; tank.identifiedAt = s.elapsed; }
        runtime.emit(s, 'objective', tank.identified ? `Marquage ${tank.role} copié sur la cuve.` : 'Ruines relevées ; marquage matériel perdu.');
      } else if (tank.work === 'secure') { tank.secured = true; tank.securedAt = s.elapsed; }
      else hitChemicalPart(s, tank, tank.hp, runtime);
    });
  advanceJob(s, d.collector, dt, c.context.routeApproach === 'guided' ? settings.guidedCollectorTime : settings.collectorTime,
    stable && near(s, d.collector.controlX) && !d.collector.destroyed, () => { d.collector.closed = true; d.collector.closedAt = s.elapsed; });
  advanceJob(s, d.leak, dt, settings.containmentTime, stable && near(s, d.leak.x) && !sourceTank(s).destroyed,
    () => { d.leak.contained = true; d.leak.containedAt = s.elapsed; flushLeak(s, runtime); });
  advanceJob(s, d.record, dt, settings.recordTime, near(s, d.record.x), () => {
    d.record.inspected = true;
    if (!d.record.destroyed) { d.record.copied = true; d.record.copiedAt = s.elapsed; }
  });
  if (!d.sampler.collected && !d.sampler.lost && (d.sampler.destroyed || sourceTank(s).destroyed || sourceTank(s).volume < settings.sampleVolume)) loseSample(s, runtime);
  advanceJob(s, d.sampler, dt, settings.sampleTime,
    !d.sampler.destroyed && !d.sampler.lost && !sourceTank(s).destroyed && sourceTank(s).volume >= settings.sampleVolume && near(s, d.sampler.x, settings.sampleRadius), () => {
      sourceTank(s).volume -= settings.sampleVolume;
      d.sampler.collected = true; d.sampler.collectedAt = s.elapsed; d.sampler.volumeCollected = settings.sampleVolume;
      runtime.emit(s, 'objective', 'Prélèvement matériel terminé. Les marquages et le registre déterminent si sa provenance est établie.');
    });
  for (const canal of d.canals) advanceJob(s, canal, dt, settings.coverTime,
    stable && near(s, canal.controlX) && !canal.destroyed, () => { canal.covered = true; canal.coveredAt = s.elapsed; });
  refreshChemicalFacts(s);
  advanceJob(s, d.water, dt, settings.waterTime, stable && near(s, d.water.x) && c.operationsResolved && c.flowResolved, () => {
    d.water.resolved = true; d.water.resolvedAt = s.elapsed; d.collector.closed = false;
  });
  advanceJob(s, d.report, dt, settings.reportTime, near(s, d.report.x) && reportReady(s), () => {
    d.report.transmitted = true; d.report.transmittedAt = s.elapsed; c.phase = 'extraction';
    runtime.emit(s, 'objective', 'Rapport du champ transmis avec les volumes, les pertes et les pièces réellement conservées.');
  });
  updateFlows(s, dt, runtime);
  if (d.alert.triggered && !d.alert.ready) {
    d.alert.elapsed = Math.max(0, s.elapsed - d.alert.triggeredAt);
    if (d.alert.elapsed >= settings.privateDelay - 1e-9) { d.alert.elapsed = settings.privateDelay; d.alert.ready = true; d.alert.readyAt = s.elapsed; }
  }
  refreshChemicalFacts(s);
  if (c.pt02Acquired && !s.evidence.collected) {
    s.evidence.collected = true; s.evidence.scanProgress = 1; s.stats.evidence++; s.stats.score += 400;
    runtime.emit(s, 'objective', 'PT02 conservée : échantillon, trois marquages et registre matériel d’Orison. La chaîne de fabrication et de financement reste inconnue.');
  }
  s.evidence.scanning = false;
}

export function chemicalObjectives(s) {
  const c = s.campaign;
  const goals = [
    { id: 'survey', label: 'Relever les trois cuves et le registre matériel', current: c.tanksInspected + Number(c.orisonRecordInspected), target: 4, complete: c.manifestRead },
    { id: 'leak', label: c.leakContained ? 'Fuite contenue sur place' : 'Contenir la fuite ou constater la perte de sa source', current: Number(c.leakStopped), target: 1, complete: c.leakStopped },
    { id: 'order', label: 'Choisir la conduite au poste du champ', current: Number(s.decision.resolved), target: 1, complete: s.decision.resolved },
    { id: 'sample', label: c.sampleLost ? 'Prélèvement perdu avant collecte — perte consignée' : 'Prélever et défendre la matière pendant vingt secondes', current: Number(c.sampleResolved), target: 1, complete: c.sampleResolved },
    { id: 'tanks', label: c.plan === 'demolish' ? 'Démolir les trois cuves sur place' : 'Isoler les cuves intactes et consigner les pertes', current: c.tanksDestroyed + c.tanksSecured, target: 3, complete: c.operationsResolved },
    { id: 'private', label: 'Neutraliser les forces privées arrivées sur le site', current: c.privateNeutralized, target: 3, complete: c.privateNeutralized === 3 },
    { id: 'water', label: 'Achever l’écoulement et le rétablissement du circuit d’eau', current: Number(c.flowResolved) + Number(c.waterDispositionRecorded), target: 2, complete: c.flowResolved && c.waterDispositionRecorded },
    { id: 'report', label: 'Transmettre le rapport matériel au poste aval', current: Number(c.reportTransmitted), target: 1, complete: c.reportTransmitted },
  ];
  s.extraction.active = goals.every(goal => goal.complete);
  goals.push({ id: 'extract', label: 'Rejoindre la rampe de retour', current: Number(s.status === 'won'), target: 1, complete: s.status === 'won' });
  return goals;
}
