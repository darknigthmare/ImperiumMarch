/** MI14 presentation: authoritative bodies, shared gallery and material work only. */
import { terrainAt } from './simulation.mjs';
import { drawWorkshopAsset } from './workshop-assets.mjs';

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const pct = value => Math.round((value || 0) * 100);
const palette = { steel: '#627a80', edge: '#b0bdac', amber: '#e1b370', mint: '#b7d9bc', lost: '#d69a7e', ink: '#20363f' };
function line(c, x1, y1, x2, y2, color, width = 1) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function label(c, value, x, y, size = 10, color = '#d9d2b2', width = 350) { c.font = `500 ${size}px "IBM Plex Mono", "Courier New", monospace`; c.fillStyle = color; c.textAlign = 'center'; c.fillText(value, x, y, width); }
function progress(c, job, x, y, width = 92) {
  if (!job?.working) return;
  c.fillStyle = '#203a43'; c.fillRect(x - width / 2, y, width, 5);
  c.fillStyle = palette.amber; c.fillRect(x - width / 2, y, width * job.progress, 5);
  label(c, `${pct(job.progress)} %`, x, y - 6, 9, palette.amber);
}
function health(c, body) {
  if (body.destroyed || body.dead || body.hp >= body.maxHp) return;
  const width = Math.min(96, body.w), y = body.y - body.h / 2 - 10;
  c.fillStyle = '#31474e'; c.fillRect(body.x - width / 2, y, width, 3);
  c.fillStyle = palette.lost; c.fillRect(body.x - width / 2, y, width * body.hp / body.maxHp, 3);
}
function assetBody(c, part, state, body, extra = {}) {
  drawWorkshopAsset(c, { part, state, x: body.x, y: body.y + body.h / 2, width: body.w, height: body.h, ...extra });
}
const coolerState = d => d.cooler.destroyed ? 'destroyed' : d.cooler.repair.working ? 'repairing' : d.cooler.repaired ? 'online' : d.valve.closed ? 'isolated' : 'broken';
const lotState = d => d.lot.destroyed ? 'destroyed' : d.lot.blockedAt !== null ? 'blocked' : d.lot.releasedAt !== null ? 'released' : d.lot.copied ? 'inspected' : 'sealed';
const controlState = d => d.control.destroyed ? 'destroyed' : d.control.working ? 'working' : d.control.mode === 'restart' ? 'production' : d.control.mode === 'hold' ? 'stopped' : 'idle';

/** The main HTML HUD and Canvas-only exports consume the same facts. */
export function workshopSummary(s) {
  const d = s.workshop, f = s.campaign, c = s.mission.workshop;
  let stage = 'DEMANDER LE PASSAGE AU PIQUET';
  if (d.report.transmitted) stage = 'BILAN TRANSMIS · REJOINDRE LA RAMPE DE RETOUR';
  else if (f.cooperationResolved) stage = 'TRANSMETTRE LE BILAN DE L’ATELIER';
  else if (f.operationsResolved) stage = 'RECUEILLIR LA RÉPONSE DES MÉCANICIENS';
  else if (s.decision.resolved) stage = d.control.working ? `COMMANDE ${pct(d.control.progress)} % · TENIR L’ANCRAGE` : 'EXÉCUTER L’ORDRE SUR LA COMMANDE';
  else if (s.decision.active || f.phase === 'decision') stage = 'DÉCIDER DE LA REPRISE OU DU MAINTIEN DE L’ARRÊT';
  else if (d.cooler.repair.working) stage = `RÉPARATION ${pct(d.cooler.repair.progress)} % · TENIR L’ANCRAGE`;
  else if (d.valve.working) stage = `ISOLATION ${pct(d.valve.progress)} % · TENIR L’ANCRAGE`;
  else if (d.lot.working) stage = `RELEVÉ DU LOT ${pct(d.lot.progress)} % · TENIR L’ANCRAGE`;
  else if (d.cooler.inspection.working) stage = `DIAGNOSTIC ${pct(d.cooler.inspection.progress)} % · TENIR L’ANCRAGE`;
  else if (f.picketCleared && !f.contactInspected) stage = 'ÉCOUTER LES OUVRIERS DE LA GALERIE';
  else if (f.picketCleared && !f.securityNeutralized) stage = d.alert.ready ? 'NEUTRALISER L’AUTOMATE · PRÉSERVER L’ATELIER' : 'REJOINDRE L’ATELIER ET SES MACHINES';
  else if (f.securityNeutralized && !f.coolerInspected) stage = 'DIAGNOSTIQUER LE REFROIDISSEUR';
  else if (f.securityNeutralized && !f.coolerRepaired && !f.coolerDestroyed) stage = d.valve.closed ? 'RÉPARER LE REFROIDISSEUR' : 'ISOLER LE CIRCUIT AVANT RÉPARATION';
  else if (f.securityNeutralized && !f.lotInspected) stage = 'RELEVER LE LOT CONTESTÉ';
  else if (d.picket.requested && !f.picketCleared) stage = 'ATTENDRE LE DERNIER OUVRIER SUR LA GALERIE';
  const people = `${f.workersAlive} / 8 EN VIE · ${f.workersSheltered} À LA GALERIE · ${f.workersLost} PERTE${f.workersLost === 1 ? '' : 'S'}`;
  const cooler = d.cooler.destroyed ? 'REFROIDISSEUR PERDU' : `FROID ${Math.round(d.cooler.temperature)} °C · ${d.cooler.repaired ? 'RÉPARÉ' : d.valve.closed ? 'CIRCUIT ISOLÉ · PANNE À RÉPARER' : d.cooler.inspected ? 'PANNE RELEVÉE · CIRCUIT À ISOLER' : 'DIAGNOSTIC À FAIRE'}`;
  const lot = d.lot.copied ? `RELEVÉ CONSERVÉ${d.lot.destroyed ? ' · ORIGINAL PERDU' : d.lot.blockedAt !== null ? ' · LOT RETENU' : d.lot.releasedAt !== null ? ' · LOT LIBÉRÉ' : ' · LOT EN ATTENTE'}`
    : d.lot.inspected ? 'CONSTAT DE PERTE · AUCUNE COPIE' : d.lot.destroyed ? 'RELEVÉ PERDU · CONSTAT À FAIRE' : 'LOT CONTESTÉ · RELEVÉ À COPIER';
  const security = f.securityNeutralized ? 'AUTOMATE NEUTRALISÉ' : d.alert.ready ? 'AUTOMATE ACTIF' : d.alert.triggered ? `ACTIVATION DANS ${Math.max(0, Math.ceil(c.securityDelay - d.alert.elapsed))} S` : 'SÉCURITÉ EN VEILLE';
  const operation = d.control.mode === 'damaged' ? 'ORDRE IMPOSSIBLE · COMMANDE CONSIGNÉE' : f.productionOnline ? 'PRODUCTION RELANCÉE' : d.control.mode === 'restart' ? 'REPRISE EFFECTUÉE · ATELIER ENDOMMAGÉ'
    : d.control.mode === 'hold' ? 'ARRÊT MAINTENU' : f.plan === 'restart' ? 'REPRISE CHOISIE · COMMANDE À FAIRE' : f.plan === 'hold' ? 'ARRÊT CHOISI · COMMANDE À FAIRE' : 'ORDRE À EXAMINER';
  return { stage, people, cooler, lot, security, operation,
    workers: people, order: operation,
    cooperation: f.mechanicsCooperating ? `${f.mechanicsAvailable} MÉCANICIEN${f.mechanicsAvailable === 1 ? '' : 'S'} DISPONIBLE${f.mechanicsAvailable === 1 ? '' : 'S'} SUR PLACE` : f.cooperationResolved ? 'AUCUN ACCORD D’AIDE MÉCANIQUE' : 'COOPÉRATION À DEMANDER',
    provenance: f.pt03CrossReferenced ? 'RECOUPEMENT LOCAL AVEC PT03 CONSERVÉ' : f.lotRecordCopied ? 'CONSTAT LOCAL · AUCUN RECOUPEMENT PT03' : 'AUCUN RELEVÉ DE SABOTAGE CONSERVÉ' };
}

export function drawWorkshopSite(renderer, s, t = s.elapsed) {
  const c = renderer.ctx, d = s.workshop, cfg = s.mission.workshop;
  // A shared gallery rises where worker positioning rises. It never changes walker feet.
  const rampStart = cfg.shelterX - cfg.galleryRamp, end = cfg.shelterX + (d.workers.length - 1) * cfg.shelterSpacing + 55;
  const galleryY = x => terrainAt(x, s.planetId) - clamp((x - rampStart) / cfg.galleryRamp, 0, 1) * cfg.galleryRise;
  const from = Math.max(rampStart, renderer.cameraX - 40), to = Math.min(end, renderer.cameraX + 1640);
  if (to > from) {
    const points = []; for (let x = from; x < to; x += 12) points.push([x, galleryY(x)]); points.push([to, galleryY(to)]);
    c.beginPath(); c.moveTo(...points[0]); for (const p of points.slice(1)) c.lineTo(...p);
    for (const p of [...points].reverse()) c.lineTo(p[0], p[1] + 11); c.closePath(); c.fillStyle = '#526b73'; c.fill();
    for (let x = Math.max(cfg.shelterX, from); x <= to; x += 88) {
      line(c, x, galleryY(x) + 10, x, terrainAt(x, s.planetId) + 4, '#2d454f', 8);
      line(c, x - 28, galleryY(x) + 12, x + 25, terrainAt(x, s.planetId), '#3c555d', 3);
    }
    for (let x = from; x <= to; x += 36) line(c, x, galleryY(x), x, galleryY(x) - 39, '#728b8c', 2);
    c.beginPath(); c.moveTo(points[0][0], points[0][1] - 39); for (const p of points.slice(1)) c.lineTo(p[0], p[1] - 39); c.strokeStyle = '#94aaa1'; c.lineWidth = 2; c.stroke();
    if (Math.abs(d.contact.x - s.player.x) > 250) label(c, 'GALERIE OUVRIÈRE', cfg.shelterX + 130, galleryY(cfg.shelterX + 130) - 104, 12, palette.edge);
  }
  // An installation warning exists before activation; no dormant target is drawn.
  const sx = cfg.securityX, sy = terrainAt(sx, s.planetId);
  if (renderer.visible(sx, 200)) {
    line(c, sx - 80, sy + 5, sx + 80, sy + 5, '#556c70', 5);
    for (let i = 0; i < 7; i++) line(c, sx - 71 + i * 22, sy + 1, sx - 61 + i * 22, sy + 11, '#b6a36f', 3);
    if (d.alert.triggered && !d.alert.ready) {
      const countdown = Math.max(0, Math.ceil(cfg.securityDelay - d.alert.elapsed));
      label(c, `SÉCURITÉ · ACTIVATION ${countdown} S`, sx, sy - 152, 11, palette.amber);
    }
  }
  // The service pipe is scenic. Its two actual operation bodies remain independently hittable.
  const start = d.valve.x + 20, finish = d.cooler.x - 70;
  if (finish > renderer.cameraX && start < renderer.cameraX + 1600) {
    for (let x = Math.max(start, renderer.cameraX - 20); x < Math.min(finish, renderer.cameraX + 1620); x += 24) {
      const x2 = Math.min(x + 24, finish);
      line(c, x, terrainAt(x, s.planetId) - 21, x2, terrainAt(x2, s.planetId) - 21, '#203841', 10);
      line(c, x, terrainAt(x, s.planetId) - 21, x2, terrainAt(x2, s.planetId) - 21, d.valve.closed ? '#94b8a7' : '#a89471', 5);
    }
  }
}

export function drawWorkshopActors(renderer, s, t = s.elapsed) {
  const c = renderer.ctx, d = s.workshop;
  // Small service bodies occupy the foreground, so the currently operated object
  // remains visible beside/under a large walker's hull. Their world bounds do not move.
  if (renderer.visible(d.picket.x, 180)) assetBody(c, 'picket-post', s.campaign.picketCleared ? 'open' : d.picket.requested ? 'clearing' : 'closed', d.picket);
  for (const [part, state, body, extra] of [
    ['cooler', coolerState(d), d.cooler, { progress: d.cooler.repair.working ? d.cooler.repair.progress : (t * .35) % 1 }],
    ['valve', d.valve.destroyed ? 'destroyed' : d.valve.closed ? 'isolated' : 'open', d.valve, { progress: d.valve.progress }],
    ['disputed-lot', lotState(d), d.lot, {}],
    ['workshop-control', controlState(d), d.control, { progress: d.control.progress }],
  ]) if (renderer.visible(body.x, 190)) assetBody(c, part, state, body, extra);
  for (const [body, complete] of [[d.contact, d.contact.inspected], [d.cooperation, d.cooperation.resolved], [d.report, d.report.transmitted]]) {
    if (!renderer.visible(body.x, 150)) continue;
    assetBody(c, 'workshop-control', body.working ? 'working' : complete ? 'stopped' : 'idle', body, { progress: body.progress });
  }
  for (const worker of d.workers) {
    if (!renderer.visible(worker.x, 90)) continue;
    assetBody(c, 'worker', !worker.alive ? 'lost' : worker.moving ? 'walking' : worker.sheltered ? 'safe' : 'standing', worker,
      { mechanic: worker.mechanic, progress: (t * 1.6 + Number(worker.id.split('-').at(-1)) * .17) % 1 });
    health(c, worker);
  }
  const unit = s.enemies.find(e => e.id === 'workshop-security-1');
  if (!unit || !d.alert.ready || !renderer.visible(unit.x, 200)) return;
  const facing = unit.facing || -1;
  const aimAngle = unit.active && !unit.dead ? Math.atan2(unit.targetY - unit.y, (unit.targetX - unit.x) * facing) : 0;
  assetBody(c, 'security-automaton', unit.dead ? 'destroyed' : unit.telegraph > 0 ? 'warning' : 'active', unit, { facing, aimAngle });
  if (!unit.dead) health(c, unit);
}

export function drawWorkshopLabels(renderer, s) {
  const c = renderer.ctx, d = s.workshop, f = s.campaign;
  const show = (body, title, detail, job, color = palette.edge) => {
    if (!renderer.visible(body.x, 190)) return;
    const y = body.y - body.h / 2, nearHull = Math.abs(body.x - s.player.x) < s.player.width / 2 + body.w / 2 + 60;
    const top = nearHull ? Math.min(y - 54, s.player.y - s.player.height / 2 - 70) : y - 54;
    if (nearHull || job?.working) {
      c.fillStyle = '#18323de8'; c.fillRect(body.x - 140, top - 15, 280, 58);
      line(c, body.x - 140, top - 15, body.x + 140, top - 15, color, 1);
      line(c, body.x, top + 43, body.x, y - 12, '#94b6a377', 1);
    }
    label(c, title, body.x, top, 11, color, 268);
    label(c, detail, body.x, top + 16, 8, '#c1c6b1', 268);
    progress(c, job, body.x, top + 38); health(c, body);
  };
  show(d.picket, f.picketCleared ? 'PASSAGE DÉGAGÉ' : 'PIQUET OUVRIER', d.picket.requested ? `${f.workersSheltered} À LA GALERIE · ${f.workersLost} PERTE${f.workersLost === 1 ? '' : 'S'}` : 'DEMANDER LE PASSAGE · ANCRAGE 3 S', d.picket, palette.amber);
  show(d.contact, 'LIAISON GALERIE', d.contact.heard ? 'EXPLICATION RECUEILLIE' : d.contact.inspected ? 'ABSENCE CONSIGNÉE' : 'ÉCOUTER LES OUVRIERS · 4 S', d.contact);
  show(d.valve, d.valve.closed ? 'CIRCUIT ISOLÉ' : 'VANNE AMONT', d.valve.destroyed ? d.valve.closed ? 'RACCORD DE SECOURS OBTURÉ' : 'VANNE PERDUE · RACCORD DE SECOURS' : 'ISOLATION · ANCRAGE 4 S', d.valve);
  show(d.cooler, `REFROIDISSEUR · ${Math.round(d.cooler.temperature)} °C`, d.cooler.destroyed ? 'MACHINE PERDUE' : d.cooler.repaired ? 'RÉPARÉ · REFROIDISSEMENT EN COURS' : d.cooler.inspected ? d.valve.closed ? 'RÉPARATION · ANCRAGE 8 S' : 'ISOLER AVANT RÉPARATION' : 'DIAGNOSTIC · ANCRAGE 3 S',
    d.cooler.repair.working ? d.cooler.repair : d.cooler.inspection, d.cooler.destroyed ? palette.lost : d.cooler.repaired ? palette.mint : palette.amber);
  show(d.lot, 'LOT CONTESTÉ', d.lot.copied ? d.lot.destroyed ? 'COPIE CONSERVÉE · ORIGINAL PERDU' : 'RELEVÉ CONSERVÉ' : d.lot.destroyed ? 'SOURCE PERDUE · CONSTAT À FAIRE' : 'COPIER LE RELEVÉ · ANCRAGE 4 S', d.lot);
  show(d.control, 'COMMANDE DE L’ATELIER', d.control.mode === 'damaged' ? 'OPÉRATION IMPOSSIBLE CONSIGNÉE' : d.control.operated ? d.control.mode === 'hold' ? 'ARRÊT VERROUILLÉ' : f.productionOnline ? 'PRODUCTION RELANCÉE' : 'REPRISE ACQUISE · MACHINE PERDUE' : 'ORDRE PUIS INTERVENTION · 5 S', d.control);
  show(d.cooperation, 'MÉCANICIENS LOCAUX', f.cooperationResolved ? f.mechanicsCooperating ? `${f.mechanicsAvailable} DISPONIBLE${f.mechanicsAvailable === 1 ? '' : 'S'} SUR PLACE` : 'AUCUN ACCORD D’AIDE' : 'DEMANDER UNE RÉPONSE · ANCRAGE 3 S', d.cooperation);
  show(d.report, 'LIAISON DE RAPPORT', d.report.transmitted ? 'BILAN TRANSMIS' : 'TRANSMISSION · ANCRAGE 3 S', d.report);
  for (const [index, worker] of d.workers.entries()) {
    if (!renderer.visible(worker.x, 80)) continue;
    // Alternate labels keep the eight-person census legible at its real spacing.
    label(c, `${index + 1}${worker.mechanic ? ' · MÉC.' : ''}${worker.alive ? '' : ' · PERDU'}`, worker.x, worker.y - worker.h / 2 - 12 - (index % 2) * 13, 8,
      worker.alive ? worker.sheltered ? palette.mint : palette.amber : palette.lost, 72);
  }
  const unit = s.enemies.find(e => e.id === 'workshop-security-1');
  if (unit && d.alert.ready && renderer.visible(unit.x, 180)) label(c, unit.dead ? 'AUTOMATE NEUTRALISÉ' : 'AUTOMATE DE SÉCURITÉ', unit.x, unit.y - unit.h / 2 - 34, 10, unit.dead ? palette.edge : palette.lost);
}

export function drawWorkshopInstrument(renderer, s) {
  const c = renderer.ctx, v = workshopSummary(s), x = 800, y = 106;
  c.fillStyle = '#162b30ee'; c.fillRect(x - 410, y, 820, 111); line(c, x - 410, y, x + 410, y, '#c5a870', 2);
  label(c, v.stage, x, y + 21, 12, '#e3c798', 795);
  label(c, v.people, x, y + 42, 10, '#c2d2be', 795);
  label(c, `${v.cooler} · ${v.security}`, x, y + 62, 9, '#d8c298', 795);
  label(c, v.lot, x, y + 82, 9, '#b5d0bd', 795);
  label(c, v.operation, x, y + 101, 9, '#d0ceb4', 795);
}
