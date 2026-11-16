/** MI13 — Kharon: a physical industrial carrier, heat circuits and retained provenance. */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const job = () => ({ working: false, progress: 0, startedAt: null, completedAt: null });
const copy = value => structuredClone(value);
const near = (s, x, radius = s.mission.foundry.interactionRadius) => Math.abs(s.player.x - x) <= radius;
const anchored = s => s.player.braced && !s.player.move && Math.abs(s.player.speed) < 3 && s.player.feet.every(foot => foot.contact);
const units = s => s.enemies.filter(enemy => enemy.id.startsWith('foundry-private-'));

export function foundryContext(previous = {}) {
  return { relayRecorded: previous.relayRecorded === true,
    relayChoice: ['obey', 'defy', 'refuse'].includes(previous.relayChoice) ? previous.relayChoice : 'none',
    relayOrdersCopied: previous.relayOrdersCopied === true, pt01Acquired: previous.pt01Acquired === true };
}

export function createFoundryMission(s, previous, runtime) {
  const c = s.mission.foundry, ground = x => runtime.terrainAt(x, s.planetId);
  const body = (id, x, w, h, hp) => ({ id, x, y: ground(x) - h / 2, w, h, hp, maxHp: hp,
    destroyed: false, destroyedAt: null, flash: 0 });
  const post = (id, x) => ({ id, x, y: ground(x) - 38, w: 62, h: 76 });
  const carrier = { ...body('foundry-carrier', c.carrierX, 242, 48, 660), speed: 0,
    released: false, releasedAt: null, release: job(), arrived: false, arrivedAt: null,
    distance: 0, destination: 'unselected', wheels: [], lastStep: -1 };
  s.foundry = {
    carrier,
    cargo: [-58, 58].map((offset, i) => ({ ...body(`foundry-cargo-${i + 1}`, c.carrierX + offset, 84, 58, 220),
      offset, inspected: false, inspectedAt: null, markingCopied: false, copiedAt: null, marking: job(),
      transfer: { ...job(), elapsed: 0, fromX: null, fromY: null }, transferred: false, transferredAt: null,
      bay: 'none', lastStep: -1 })),
    manifest: { ...body('foundry-manifest', c.carrierX - 111, 24, 40, 90), ...job(),
      inspected: false, inspectedAt: null, copied: false, copiedAt: null },
    analysis: { id: 'foundry-analysis', ...job(), completed: false, x: c.analysisX, y: ground(c.analysisX) - 45, w: 50, h: 70 },
    bridges: c.bridgeRanges.map(([start, end], i) => ({ id: `foundry-bridge-${i + 1}`, start, end, rise: c.bridgeRise,
      temperature: c.bridgeTemperature, circuitOpen: false, openedAt: null,
      valve: { ...body(`foundry-valve-${i + 1}`, c.valveXs[i], 52, 62, 240), ...job() },
      steam: { phase: 'warning', cycle: 0, x: (start + end) / 2, y: ground((start + end) / 2) - 22 } })),
    orders: post('foundry-orders', c.ordersX),
    bays: ['deliver', 'quarantine'].map((kind, i) => ({ id: `foundry-bay-${kind}`, kind,
      x: i ? c.quarantineX : c.deliveryX, y: ground(i ? c.quarantineX : c.deliveryX),
      postX: (i ? c.quarantineX : c.deliveryX) + 170, w: 380, h: 34 })),
    report: { ...post('foundry-report', c.reportX), ...job(), transmitted: false, transmittedAt: null },
    alert: { triggered: false, triggeredAt: null, reason: 'none', elapsed: 0, ready: false, readyAt: null },
    thermal: { ambientAdded: 0, conductionAdded: 0, steamAdded: 0, wheelDamage: 0, contacts: [] },
  };
  syncFoundryBodies(s, runtime);
  updateThermal(s, 0, runtime);
  s.campaign = { missionId: 'MI13', phase: 'loading', context: foundryContext(previous),
    tutorial: { stepped: false, braced: false }, ...foundryDerivedFacts(s) };
  s.evidence.scanning = false; s.evidence.scanTime = c.analysisTime;
}

export function foundrySurface(s, x, groundY) {
  const bridge = s.foundry.bridges.find(part => x >= part.start && x <= part.end);
  if (!bridge) return { groundY, traction: 1, bridgeId: null, temperature: 28, rise: 0 };
  const ramp = clamp(Math.min((x - bridge.start) / 100, (bridge.end - x) / 100), 0, 1);
  const rise = bridge.rise * ramp;
  return { groundY: groundY - rise, traction: .92, bridgeId: bridge.id, temperature: bridge.temperature, rise };
}

function syncFoundryBodies(s, runtime) {
  const d = s.foundry, carrier = d.carrier, ground = x => foundrySurface(s, x, runtime.terrainAt(x, s.planetId));
  carrier.wheels = [-94, -34, 34, 94].map((offset, i) => {
    const x = carrier.x + offset, surface = ground(x);
    return { id: `foundry-wheel-${i + 1}`, x, y: surface.groundY - 16, radius: 16, contact: true,
      groundY: surface.groundY, bridgeId: surface.bridgeId, temperature: surface.temperature };
  });
  carrier.y = carrier.wheels.reduce((n, wheel) => n + wheel.groundY, 0) / carrier.wheels.length - 46;
  for (const cargo of d.cargo) {
    if (cargo.transfer.elapsed === 0 && !cargo.transferred) { cargo.x = carrier.x + cargo.offset; cargo.y = carrier.y - carrier.h / 2 - cargo.h / 2; }
  }
  d.manifest.x = carrier.x - 111; d.manifest.y = carrier.y - 38;
  d.analysis.x = carrier.x; d.analysis.y = carrier.y - 110;
}

export function foundryDerivedFacts(s) {
  const d = s.foundry, plan = s.decision.resolved ? s.decision.choice === 'obey' ? 'deliver' : 'quarantine' : 'unselected';
  const cargoInspected = d.cargo.filter(c => c.inspected).length;
  const markingsCopied = d.cargo.filter(c => c.markingCopied).length;
  const cargoIntact = d.cargo.filter(c => c.hp === c.maxHp && !c.destroyed).length;
  const cargoLost = d.cargo.filter(c => c.destroyed).length;
  const cargoTransferred = d.cargo.filter(c => c.transferred).length;
  const pt03Acquired = markingsCopied === 2 && d.manifest.copied && d.analysis.completed;
  const context = s.campaign?.context || {};
  return { plan, carrierReleased: d.carrier.released, carrierArrived: d.carrier.arrived, carrierDestroyed: d.carrier.destroyed,
    cargoTotal: 2, cargoInspected, markingsCopied, cargoIntact, cargoDamaged: 2 - cargoIntact - cargoLost,
    cargoLost, cargoTransferred, manifestInspected: d.manifest.inspected, manifestCopied: d.manifest.copied,
    analysisCompleted: d.analysis.completed, pt03Acquired, provenanceVerified: pt03Acquired,
    pt01CrossReferenced: pt03Acquired && context.pt01Acquired === true,
    relayCrossReferenced: pt03Acquired && context.relayOrdersCopied === true,
    circuitsOpened: d.bridges.filter(b => b.circuitOpen).length,
    privateTriggered: d.alert.triggered, privateReady: d.alert.ready, privateNeutralized: units(s).filter(e => e.dead).length,
    manifestRead: cargoInspected === 2 && d.manifest.inspected,
    operationsResolved: plan !== 'unselected' && d.carrier.arrived && d.cargo.every(c => c.transferred || c.destroyed),
    reportTransmitted: d.report.transmitted, publicReleased: false, defected: false };
}

export function refreshFoundryFacts(s) {
  Object.assign(s.campaign, foundryDerivedFacts(s));
  if (s.decision.active || s.decision.resolved) s.decision.body = foundryDecisionBody(s);
}
export function foundryReceiptRoster(s) {
  return copy({ ...s.foundry, privateForces: units(s).map(enemy => ({ id: enemy.id, type: enemy.type,
    hp: enemy.hp, maxHp: enemy.maxHp, dead: enemy.dead })) });
}
export function foundrySolids(s) { return [s.foundry.carrier, ...s.foundry.cargo, s.foundry.manifest, ...s.foundry.bridges.map(b => b.valve)]; }

function triggerFoundry(s, reason, runtime) {
  const a = s.foundry.alert;
  if (a.triggered) return;
  Object.assign(a, { triggered: true, triggeredAt: s.elapsed, reason });
  runtime.emit(s, 'radio', 'Tess : « Deux drones et une tourelle mobile convergent vers le chargement. Six secondes avant leur arrivée. Ils visent la route du porteur. »');
}
export function hitFoundryPart(s, part, damage, runtime) {
  if (!part || part.destroyed || !(damage > 0)) return;
  part.hp = Math.max(0, part.hp - damage); part.flash = .12;
  if (part.hp === 0) {
    part.destroyed = true; part.destroyedAt = s.elapsed;
    if (Object.hasOwn(part, 'working')) { part.working = false; if (part.completedAt === null) { part.progress = 0; part.startedAt = null; } }
    if (part.marking?.working) Object.assign(part.marking, { working: false, progress: 0, startedAt: null });
    if (part.transfer) part.transfer.working = false;
    if (part === s.foundry.carrier) {
      part.speed = 0; part.release.working = false;
      runtime.finish?.(s, false, 'Le porteur industriel est perdu. Les copies déjà conservées restent à bord ; les pièces et le véhicule ne sont pas restitués.');
    }
  }
  refreshFoundryFacts(s);
}
export function foundryFootfall(s, foot, runtime) {
  if (!foot.contact) return;
  for (const part of [s.foundry.carrier, ...s.foundry.cargo]) {
    if (part.destroyed || part.lastStep === s.stats.steps || Math.abs(foot.x - part.x) > part.w / 2 || Math.abs(foot.y - part.y - part.h / 2) > 20) continue;
    part.lastStep = s.stats.steps;
    hitFoundryPart(s, part, Math.max(3, s.walker.weight * .04), runtime);
  }
}
export function foundryDecisionBody(s) {
  const c = foundryDerivedFacts(s);
  const context = s.campaign.context;
  const vesper = c.pt01CrossReferenced ? 'La copie du journal de Vesper confirme ce rapprochement.' : context.pt01Acquired ? 'Le journal de Vesper est conservé, mais les sources locales sont incomplètes.' : 'La copie du journal de Vesper manque au dossier.';
  const relay = c.relayCrossReferenced ? 'Les ordres copiés au troisième relais fournissent un autre recoupement.' : context.relayOrdersCopied ? 'Les ordres du relais sont conservés ; leur lien avec ce chargement reste incomplet.' : 'Nous ne disposons pas des ordres du troisième relais.';
  return `${c.markingsCopied} marquages sur deux et ${c.manifestCopied ? 'le bordereau' : 'aucun bordereau exploitable'} conservés. ${c.pt03Acquired ? 'Tess a rapproché les deux séries du bordereau : la provenance industrielle locale est établie.' : 'Les pièces disponibles ne suffisent pas à établir PT03.'} ${vesper} ${relay} Livraison ou quarantaine choisit la baie ; le porteur et chaque caisse doivent encore y être conduits et transférés.`;
}

function start(part, resume = false) {
  if (part.working || part.completedAt !== null) return false;
  part.working = true;
  if (!resume) { part.progress = 0; part.startedAt = null; }
  return true;
}
function startAt(s, part, resume = false) { if (!start(part, resume)) return false; part.startedAt ??= s.elapsed; return true; }
const readyForReport = s => { const c = foundryDerivedFacts(s); return c.manifestRead && c.analysisCompleted && c.operationsResolved && c.privateNeutralized === 3 && !c.carrierDestroyed; };

export function foundryAvailableJobs(s) {
  const d = s.foundry, f = foundryDerivedFacts(s), tasks = [];
  const add = (kind, part, work, x, label) => tasks.push({ kind, part, work, x, label });
  if (!d.manifest.inspected) add('manifest', d.manifest, d.manifest, d.manifest.x, d.manifest.destroyed ? 'Constater la perte du bordereau' : 'Copier le bordereau du chargement — 4 s');
  if (!d.carrier.released && !d.carrier.destroyed) add('release', d.carrier, d.carrier.release, d.carrier.x, 'Libérer le porteur industriel — 2 s sous ancrage');
  for (const bridge of d.bridges) if (!bridge.circuitOpen && !bridge.valve.destroyed) add('valve', bridge, bridge.valve, bridge.valve.x, 'Isoler l’apport de chaleur — 4 s sous ancrage');
  if (d.alert.ready) for (const cargo of d.cargo) if (!cargo.inspected) add('mark', cargo, cargo.marking, cargo.x,
    cargo.destroyed ? 'Consigner la perte de la caisse sans inventer son marquage' : 'Copier le marquage matériel de la caisse — 3 s');
  if (f.manifestRead && !d.analysis.completed) add('analysis', d.analysis, d.analysis, d.carrier.x, 'Liaison avec Tess : rapprocher les pièces conservées — 8 s');
  if (f.manifestRead && f.analysisCompleted && f.privateNeutralized === 3 && !s.decision.resolved) add('orders', d.orders, null, d.orders.x, 'Choisir la livraison ou la quarantaine au poste de réception');
  if (d.carrier.arrived && !d.carrier.destroyed) {
    const bay = d.bays.find(b => b.kind === f.plan);
    const cargo = d.cargo.find(c => !c.transferred && !c.destroyed);
    if (cargo) add('transfer', cargo, cargo.transfer, bay.postX, `Transférer la caisse ${d.cargo.indexOf(cargo) + 1} dans la baie — 5 s`);
  }
  if (readyForReport(s) && !d.report.transmitted) add('report', d.report, d.report, d.report.x, 'Transmettre la provenance, la réception et les pertes — 3 s');
  return tasks;
}
const nearestJob = s => foundryAvailableJobs(s).filter(t => near(s, t.x)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
export function foundryInteraction(s) {
  const task = nearestJob(s);
  if (task) return task.work?.working ? `Travail en cours — ${Math.floor(task.work.progress * 100)} %` : `E — ${task.label}`;
  if (near(s, s.foundry.carrier.x)) return !s.foundry.alert.ready ? 'Escorter le porteur ; les marquages seront examinés après l’embuscade' : 'Porteur industriel — les copies déjà acquises restent à bord';
  return '';
}
export function interactFoundryMission(s, runtime) {
  refreshFoundryFacts(s);
  const task = nearestJob(s);
  if (!task) return false;
  if (task.kind === 'orders') { s.campaign.phase = 'decision'; s.decision.body = foundryDecisionBody(s); s.decision.active = true; return true; }
  if (!anchored(s) || task.work.working) return false;
  if (task.kind === 'transfer') {
    if (task.work.elapsed === 0) { task.work.fromX = task.part.x; task.work.fromY = task.part.y; }
    return startAt(s, task.work, true);
  }
  return startAt(s, task.work);
}
export function chooseFoundryMission(s, choice, runtime) {
  if (choice === 'obey') s.stats.ordersObeyed++; else s.stats.ordersDefied++;
  s.foundry.carrier.destination = choice === 'obey' ? 'deliver' : 'quarantine';
  s.campaign.phase = 'delivery';
  runtime.emit(s, 'radio', choice === 'obey'
    ? 'Sera : « Nous allons à la fonderie centrale. La réception conservera les dommages et les documents réellement recueillis. »'
    : 'Sera : « Le chargement sera isolé dans la baie de quarantaine. Conduis le porteur jusque-là ; aucun mouvement ne remplace le transfert de chaque caisse. »');
  refreshFoundryFacts(s);
}

function advance(s, work, dt, duration, valid, completed, preserve = false) {
  if (!work.working) return;
  if (!valid) {
    work.working = false;
    if (!preserve) { work.progress = 0; work.startedAt = null; }
    return;
  }
  if (preserve) { work.elapsed = Math.min(duration, work.elapsed + dt); work.progress = work.elapsed / duration; }
  else work.progress = Math.min(1, work.progress + dt / duration);
  if (work.progress >= 1 - 1e-10) { work.progress = 1; work.working = false; work.completedAt = s.elapsed; if (preserve) work.elapsed = duration; completed(); }
}

function updateThermal(s, dt, runtime) {
  const d = s.foundry, cfg = s.mission.foundry, heat = d.thermal, p = s.player;
  heat.contacts = [];
  const ambient = dt * .045; p.heat = Math.min(100, p.heat + ambient); heat.ambientAdded += ambient;
  for (const [i, bridge] of d.bridges.entries()) {
    const cycle = (s.elapsed + i * 3) % (cfg.steamWarning + cfg.steamJet + cfg.steamRest);
    bridge.steam.cycle = cycle;
    bridge.steam.phase = bridge.circuitOpen ? 'off' : cycle < cfg.steamWarning ? 'warning' : cycle < cfg.steamWarning + cfg.steamJet ? 'jet' : 'rest';
    if (bridge.circuitOpen) bridge.temperature = Math.max(cfg.cooledTemperature, bridge.temperature - cfg.coolingRate * dt);
    for (const foot of p.feet) {
      const surface = foundrySurface(s, foot.x, runtime.terrainAt(foot.x, s.planetId));
      if (surface.bridgeId !== bridge.id || !foot.contact || Math.abs(foot.y - surface.groundY) > 3) continue;
      heat.contacts.push(foot.id ?? `${foot.group}:${foot.x.toFixed(2)}`);
      const amount = Math.max(0, bridge.temperature - 38) * .026 * dt / p.feet.length;
      p.heat = Math.min(100, p.heat + amount); heat.conductionAdded += amount;
    }
    if (bridge.steam.phase === 'jet' && Math.abs(p.x - bridge.steam.x) < 135) {
      const amount = dt * 6; p.heat = Math.min(100, p.heat + amount); heat.steamAdded += amount;
    }
    if (!d.carrier.destroyed) {
      const contacts = d.carrier.wheels.filter(wheel => wheel.contact && wheel.bridgeId === bridge.id).length;
      const damage = contacts * Math.max(0, bridge.temperature - 62) * .015 * dt;
      if (damage) { heat.wheelDamage += Math.min(damage, d.carrier.hp); hitFoundryPart(s, d.carrier, damage, runtime); }
    }
  }
  if (p.heat >= 100) p.overheated = true;
}

export function updateFoundryMission(s, dt, runtime) {
  const d = s.foundry, cfg = s.mission.foundry, carrier = d.carrier, stable = anchored(s);
  for (const part of foundrySolids(s)) part.flash = Math.max(0, part.flash - dt);
  if (!d.alert.triggered && (s.player.x >= cfg.ambushX || carrier.x >= cfg.ambushX)) triggerFoundry(s, 'route-crossed', runtime);
  if (d.alert.triggered && !d.alert.ready) {
    d.alert.elapsed = Math.min(cfg.privateDelay, Math.max(0, s.elapsed - d.alert.triggeredAt));
    if (d.alert.elapsed >= cfg.privateDelay - 1e-9) {
      d.alert.elapsed = cfg.privateDelay; d.alert.ready = true; d.alert.readyAt = s.elapsed;
      runtime.emit(s, 'radio', 'Tess : « L’embuscade est sur la route. Après avoir couvert le porteur, examine les marquages : ces pièces ne sont pas celles annoncées par la simple priorité de transport. »');
    }
  }
  advance(s, carrier.release, dt, cfg.releaseTime ?? 2, stable && near(s, carrier.x) && !carrier.destroyed,
    () => { carrier.released = true; carrier.releasedAt = s.elapsed; s.campaign.phase = 'escort'; });
  for (const bridge of d.bridges) advance(s, bridge.valve, dt, cfg.valveTime, stable && near(s, bridge.valve.x) && !bridge.valve.destroyed,
    () => { bridge.circuitOpen = true; bridge.openedAt = s.elapsed; runtime.emit(s, 'objective', 'Apport de chaleur isolé : vapeur coupée, refroidissement progressif du tablier. Les dommages antérieurs restent inscrits.'); });
  advance(s, d.manifest, dt, cfg.manifestTime, stable && near(s, d.manifest.x), () => {
    d.manifest.inspected = true; d.manifest.inspectedAt = s.elapsed;
    if (!d.manifest.destroyed) { d.manifest.copied = true; d.manifest.copiedAt = s.elapsed; }
  });
  for (const cargo of d.cargo) advance(s, cargo.marking, dt, cfg.markTime, stable && near(s, cargo.x) && d.alert.ready, () => {
    cargo.inspected = true; cargo.inspectedAt = s.elapsed;
    if (!cargo.destroyed) { cargo.markingCopied = true; cargo.copiedAt = s.elapsed; }
  });
  advance(s, d.analysis, dt, cfg.analysisTime, stable && near(s, carrier.x) && foundryDerivedFacts(s).manifestRead, () => {
    d.analysis.completed = true; s.campaign.phase = 'assessment';
    runtime.emit(s, 'radio', d.cargo.every(cargo => cargo.markingCopied) && d.manifest.copied
      ? 'Tess : « Les deux séries et le bordereau concordent. Ces composants proviennent de la même filière industrielle. Nous avons une source locale complète, même si une archive antérieure a été perdue. Les rapprochements avec Vesper ou le relais ne valent que pour les copies présentes dans notre dossier. »'
      : 'Tess : « J’ai terminé le relevé des pièces conservées. Il manque une source matérielle : je ne peux pas établir la provenance PT03 à partir de documents absents. »');
  });
  const plan = foundryDerivedFacts(s).plan, target = plan === 'unselected' ? cfg.holdingX : d.bays.find(bay => bay.kind === plan).x;
  const busy = d.manifest.working || d.analysis.working || d.cargo.some(cargo => cargo.marking.working || cargo.transfer.working);
  if (carrier.released && !carrier.destroyed && !carrier.arrived && !s.player.braced && !busy && near(s, carrier.x, cfg.escortRadius) && s.player.x > carrier.x + 160) {
    const travel = Math.min(Math.max(0, target - carrier.x), cfg.carrierSpeed * dt, Math.max(0, s.player.x - 160 - carrier.x));
    carrier.x += travel; carrier.distance += travel; carrier.speed = travel / dt;
    if (plan !== 'unselected' && Math.abs(carrier.x - target) < .001) {
      carrier.x = target; carrier.arrived = true; carrier.arrivedAt = s.elapsed; carrier.speed = 0;
      runtime.emit(s, 'objective', `Porteur arrivé à la ${plan === 'deliver' ? 'fonderie centrale' : 'baie de quarantaine'}. Chaque caisse encore présente attend son transfert.`);
    }
  } else carrier.speed = 0;
  syncFoundryBodies(s, runtime);
  for (const [i, cargo] of d.cargo.entries()) {
    if (cargo.transfer.elapsed === 0 && !cargo.transfer.working) continue;
    const bay = d.bays.find(b => b.kind === plan);
    if (!bay) continue;
    advance(s, cargo.transfer, dt, cfg.transferTime, stable && near(s, bay.postX) && carrier.arrived && !cargo.destroyed && !carrier.destroyed,
      () => { cargo.transferred = true; cargo.transferredAt = s.elapsed; cargo.bay = plan; }, true);
    cargo.x = cargo.transfer.fromX + (bay.x + 250 + i * 104 - cargo.transfer.fromX) * cargo.transfer.progress;
    const destinationY = runtime.terrainAt(bay.x + 250 + i * 104, s.planetId) - cargo.h / 2;
    cargo.y = cargo.transfer.fromY + (destinationY - cargo.transfer.fromY) * cargo.transfer.progress;
  }
  updateThermal(s, dt, runtime);
  syncFoundryBodies(s, runtime);
  advance(s, d.report, dt, cfg.reportTime, stable && near(s, d.report.x) && readyForReport(s), () => {
    d.report.transmitted = true; d.report.transmittedAt = s.elapsed; s.campaign.phase = 'extraction';
    runtime.emit(s, 'objective', 'Réception transmise avec la destination réelle, les pertes et la provenance des copies. Rejoindre maintenant la rampe de retour.');
  });
  refreshFoundryFacts(s);
  if (s.campaign.pt03Acquired && !s.evidence.collected) {
    s.evidence.collected = true; s.evidence.scanProgress = 1; s.stats.evidence++; s.stats.score += 400;
    runtime.emit(s, 'objective', 'PT03 conservée : deux marquages, bordereau et analyse achevée. La filière locale ne démontre pas à elle seule toute la chaîne politique.');
  }
  s.evidence.scanning = false;
  if (carrier.destroyed && s.status === 'playing') runtime.finish?.(s, false, 'Le porteur industriel est perdu ; la sortie ne peut plus être menée à terme.');
}

export function foundryObjectives(s) {
  const c = s.campaign;
  const goals = [
    { id: 'carrier', label: 'Libérer et protéger le porteur industriel', current: Number(c.carrierReleased), target: 1, complete: c.carrierReleased },
    { id: 'private', label: 'Neutraliser l’embuscade arrivée sur la route', current: c.privateNeutralized, target: 3, complete: c.privateNeutralized === 3 },
    { id: 'sources', label: 'Relever deux marquages et le bordereau, ou leurs pertes', current: c.cargoInspected + Number(c.manifestInspected), target: 3, complete: c.manifestRead },
    { id: 'analysis', label: 'Achever la liaison de Tess sur les sources disponibles', current: Number(c.analysisCompleted), target: 1, complete: c.analysisCompleted },
    { id: 'delivery', label: 'Choisir la baie puis y conduire le porteur', current: Number(c.carrierArrived), target: 1, complete: c.carrierArrived },
    { id: 'transfer', label: 'Transférer chaque caisse restante et consigner les pertes', current: s.foundry.cargo.filter(part => part.transferred || part.destroyed).length, target: 2, complete: c.operationsResolved },
    { id: 'report', label: 'Transmettre la réception et les pièces réellement conservées', current: Number(c.reportTransmitted), target: 1, complete: c.reportTransmitted },
  ];
  s.extraction.active = goals.every(goal => goal.complete) && !c.carrierDestroyed;
  goals.push({ id: 'extract', label: 'Rejoindre la rampe de retour', current: Number(s.status === 'won'), target: 1, complete: s.status === 'won' });
  return goals;
}
