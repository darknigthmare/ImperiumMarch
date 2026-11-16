/** MI14 preserves the physical workshop, its workers and their acquired consent. */
import { DIFFICULTIES, ENEMY_TYPES } from './content.mjs';
import { createGame, terrainAt } from './simulation.mjs';
import { workshopDerivedFacts, workshopReceiptRoster, workshopSurface, workshopObjectives, workshopWorkerPosition } from './workshop-simulation.mjs';

const FLAGS = ['passageRequested', 'picketCleared', 'contactInspected', 'workersHeard', 'nacreAccountRecorded',
  'lotInspected', 'lotRecordCopied', 'localSabotageRecorded', 'pt03CrossReferenced', 'coolerInspected',
  'circuitIsolated', 'coolerRepaired', 'coolerDestroyed', 'controlOperated', 'productionRestarted',
  'productionOnline', 'strikePreserved', 'strikeBroken', 'cooperationResolved', 'mechanicsCooperating',
  'securityTriggered', 'securityReady', 'securityNeutralized', 'operationsResolved', 'reportTransmitted',
  'publicReleased', 'defected'];
const COUNTS = { workersTotal: 8, workersAlive: 8, workersSheltered: 8, workersLost: 8,
  displacedAlive: 3, mechanicsAlive: 2, mechanicsAvailable: 2 };
const CONTEXT_KEYS = ['foundryRecorded', 'foundryPlan', 'pt03Acquired', 'cargoTransferred', 'cargoLost'];
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const close = (a, b, tolerance = 1e-6) => Math.abs(a - b) <= tolerance;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const requireValue = (ok, label) => { if (!ok) throw new Error(`Sauvegarde invalide : atelier de Kharon — ${label}`); };
const boolean = (value, label) => requireValue(typeof value === 'boolean', label);
function number(value, min, max, label, integer = false) {
  requireValue(Number.isFinite(value) && value >= min - 1e-8 && value <= max + 1e-8 && (!integer || Number.isInteger(value)), label);
}
function keys(value, expected, label) { requireValue(object(value) && Object.keys(value).length === expected.length && expected.every(k => Object.hasOwn(value, k)), label); }
const sameKeys = (value, initial, label) => keys(value, Object.keys(initial), label);
function fixed(value, initial, fields, label) { for (const field of fields) requireValue(eq(value[field], initial[field]), `${label}.${field}`); }

export function createWorkshopDossier() {
  return { plan: 'unselected', execution: 'pending', ...Object.fromEntries(FLAGS.map(key => [key, false])),
    ...Object.fromEntries(Object.keys(COUNTS).map(key => [key, 0])), roster: null };
}
export function workshopContextFor(campaign) {
  const report = campaign.completed.MI13;
  return { foundryRecorded: Boolean(report), foundryPlan: report?.plan || 'none',
    pt03Acquired: report?.pt03Acquired === true, cargoTransferred: report?.cargoTransferred || 0,
    cargoLost: report?.cargoLost || 0 };
}
function validateContext(context) {
  keys(context, CONTEXT_KEYS, 'héritage de la fonderie');
  boolean(context.foundryRecorded, 'rapport du porteur'); boolean(context.pt03Acquired, 'provenance PT03');
  requireValue(['none', 'deliver', 'quarantine'].includes(context.foundryPlan), 'destination historique');
  for (const key of ['cargoTransferred', 'cargoLost']) number(context[key], 0, 2, `héritage ${key}`, true);
  requireValue(context.foundryRecorded === (context.foundryPlan !== 'none'), 'destination sans rapport historique');
  requireValue(context.foundryRecorded ? context.cargoTransferred + context.cargoLost === 2
    : !context.pt03Acquired && context.cargoTransferred === 0 && context.cargoLost === 0, 'caisses ou provenance sans réception historique');
}
export function validateWorkshopFacts(facts, finished = false) {
  for (const key of FLAGS) boolean(facts[key], key);
  for (const [key, maximum] of Object.entries(COUNTS)) number(facts[key], 0, maximum, key, true);
  requireValue(['unselected', 'restart', 'hold'].includes(facts.plan), 'plan inconnu');
  requireValue(['pending', 'restart', 'hold', 'damaged'].includes(facts.execution), 'opération inconnue');
  requireValue(facts.workersTotal === 8 && facts.workersAlive + facts.workersLost === 8, 'bilan des huit ouvriers');
  requireValue(facts.workersSheltered <= facts.workersAlive && facts.mechanicsAvailable <= facts.mechanicsAlive, 'personnes disponibles sans survivants');
  requireValue(facts.displacedAlive <= facts.workersAlive && facts.mechanicsAlive <= facts.workersAlive, 'cohortes locales incohérentes');
  requireValue(!facts.securityReady || facts.securityTriggered, 'automate arrivé sans déclenchement');
  requireValue(!facts.securityNeutralized || facts.securityReady, 'automate neutralisé avant son arrivée');
  requireValue(!facts.lotRecordCopied || facts.lotInspected, 'copie sans examen du lot');
  requireValue(!facts.localSabotageRecorded || facts.lotRecordCopied, 'constat de sabotage sans copie');
  requireValue(!facts.pt03CrossReferenced || facts.localSabotageRecorded, 'rapprochement sans constat local');
  requireValue(!facts.productionOnline || facts.productionRestarted && facts.coolerRepaired && !facts.coolerDestroyed, 'production sans refroidissement rétabli');
  requireValue(!facts.strikePreserved || !facts.strikeBroken, 'grève à la fois maintenue et brisée');
  requireValue(!facts.reportTransmitted || facts.operationsResolved, 'rapport avant opérations');
  requireValue(!facts.publicReleased && !facts.defected, 'diffusion ou défection prématurée');
  if (finished) requireValue(facts.reportTransmitted && facts.securityNeutralized, 'bilan avant sécurisation et transmission');
}
export function workshopDossierFromGame(game) {
  return { ...Object.fromEntries(Object.keys(createWorkshopDossier()).filter(k => k !== 'roster').map(k => [k, game.campaign[k]])),
    roster: workshopReceiptRoster(game) };
}

function validateScene(scene, initial, facts, cfg, { elapsed, context, forces, initialForces, player = null, receipt = false, planetId = 'PL04', choice = null }) {
  const frame = .05 + 1e-6;
  sameKeys(scene, initial, 'champs de la scène');
  const stamp = (value, label) => { if (value !== null) number(value, 0, elapsed, label); };
  const date = (value, flag, label) => { boolean(flag, label); stamp(value, label); requireValue((value !== null) === flag, `${label} et date`); };
  const dates = part => { for (const key of Object.keys(part).filter(key => key.endsWith('At'))) stamp(part[key], `${part.id ?? 'travail'}.${key}`); };
  const body = (part, original, moving = false) => {
    sameKeys(part, original, `${original.id} champs`);
    fixed(part, original, moving ? ['id', 'w', 'h', 'maxHp'] : ['id', 'x', 'y', 'w', 'h', 'maxHp'], 'corps');
    number(part.hp, 0, part.maxHp, `${part.id} intégrité`); number(part.flash, 0, .15, `${part.id} impact`);
    date(part.destroyedAt, part.destroyed, `${part.id} destruction`); requireValue(part.destroyed === (part.hp === 0), `${part.id} perte sans rupture`); dates(part);
    if (Object.hasOwn(part, 'lastStep')) number(part.lastStep, -1, 1e7, `${part.id} dernier appui`, true);
  };
  const work = (part, duration, x, label) => {
    boolean(part.working, `${label} actif`); number(part.progress, 0, 1, `${label} progression`); dates(part);
    requireValue(!part.working || part.startedAt !== null && part.completedAt === null && part.progress < 1, `${label} activité incohérente`);
    requireValue(part.progress === 0 || part.startedAt !== null, `${label} sans début`);
    requireValue(part.working || part.completedAt !== null || part.progress === 0 && part.startedAt === null, `${label} interrompu sans annulation`);
    requireValue((part.completedAt !== null) === (part.progress === 1), `${label} achèvement sans date`);
    if (part.startedAt !== null) requireValue(part.progress * duration <= elapsed - part.startedAt + frame, `${label} trop rapide`);
    if (part.completedAt !== null) requireValue(!part.working && part.startedAt !== null && part.completedAt + frame >= part.startedAt + duration, `${label} durée incomplète`);
    if (part.working && player && part.progress > 0) requireValue(Math.abs(player.x - x) <= cfg.interactionRadius + 1e-6
      && player.braced && !player.move && Math.abs(player.speed) < 3 && player.feet.every(foot => foot.contact), `${label} sans portée et appuis`);
  };
  const post = (part, original, duration, label) => { sameKeys(part, original, `${label} champs`); fixed(part, original, ['id', 'x', 'y', 'w', 'h'], label); work(part, duration, part.x, label); };
  const presentAt = (w, time) => time !== null && w.shelteredAt !== null && w.shelteredAt <= time + 1e-6 && (w.destroyedAt === null || w.destroyedAt >= time - 1e-6);
  const clearedAt = time => scene.workers.every(w => w.shelteredAt !== null && w.shelteredAt <= time + 1e-6 || w.destroyedAt !== null && w.destroyedAt <= time + 1e-6);
  const destroyedBefore = (body, time) => body.destroyedAt !== null && body.destroyedAt <= time + 1e-6;
  const picket = scene.picket;
  post(picket, initial.picket, cfg.passageTime, 'demande de passage'); date(picket.requestedAt, picket.requested, 'passage demandé');
  requireValue(picket.requestedAt === picket.completedAt, 'passage sans durée');
  requireValue(Array.isArray(scene.workers) && scene.workers.length === 8, 'huit ouvriers absents');
  for (const [i, worker] of scene.workers.entries()) {
    body(worker, initial.workers[i], true);
    fixed(worker, initial.workers[i], ['name', 'mechanic', 'displaced', 'origin', 'startX', 'shelterX'], 'identité ouvrière');
    boolean(worker.alive, 'vie ouvrière'); boolean(worker.moving, 'trajet ouvrier'); date(worker.shelteredAt, worker.sheltered, 'arrivée en galerie');
    requireValue(worker.alive === !worker.destroyed, 'vie contraire au corps'); number(worker.routeProgress, 0, 1, 'trajet de galerie');
    if (worker.departedAt !== null) {
      requireValue(picket.requested && worker.departedAt === picket.requestedAt && !destroyedBefore(worker, worker.departedAt - 1e-5), 'départ sans passage ni survivant');
      const duration = (worker.shelterX - worker.startX) / cfg.workerSpeed;
      const end = Math.min(elapsed, worker.destroyedAt ?? elapsed);
      const expected = Math.min(1, Math.max(0, end - worker.departedAt) / duration);
      requireValue(close(worker.routeProgress, expected, frame / duration + 1e-6), 'ouvrier téléporté ou trajet accéléré');
      requireValue(worker.sheltered === (worker.routeProgress === 1), 'arrivée sans trajet achevé');
      if (worker.sheltered) requireValue(close(worker.shelteredAt - worker.departedAt, duration, frame), 'date d’arrivée incompatible avec le trajet');
    } else requireValue(worker.routeProgress === 0 && !worker.sheltered && !worker.moving && (!picket.requested || destroyedBefore(worker, picket.requestedAt)), 'ouvrier déplacé sans demande');
    requireValue(worker.moving === (worker.alive && worker.departedAt !== null && !worker.sheltered), 'activité du trajet');
    const position = workshopWorkerPosition({ mission: { workshop: cfg }, planetId }, worker, { terrainAt });
    requireValue(close(worker.x, position.x) && close(worker.y, position.y), 'position ouvrière contraire à la rampe commune');
  }
  const contact = scene.contact;
  post(contact, initial.contact, cfg.contactTime, 'contact des ouvriers'); date(contact.inspectedAt, contact.inspected, 'contact accompli'); date(contact.heardAt, contact.heard, 'paroles recueillies'); boolean(contact.nacreAccount, 'récit de Nacre');
  requireValue(contact.inspectedAt === contact.completedAt && (!contact.heard || contact.heardAt === contact.completedAt), 'contact sans durée');
  if (contact.startedAt !== null) requireValue(clearedAt(contact.startedAt), 'contact avant dégagement du piquet');
  requireValue(contact.heard === (contact.inspected && scene.workers.some(w => presentAt(w, contact.completedAt))), 'paroles sans interlocuteur au moment de l’échange');
  requireValue(contact.nacreAccount === (contact.inspected && scene.workers.some(w => w.displaced && presentAt(w, contact.completedAt))), 'récit sans témoin de Nacre');
  const lot = scene.lot;
  body(lot, initial.lot); work(lot, cfg.recordTime, lot.x, 'relevé du lot'); date(lot.inspectedAt, lot.inspected, 'lot inspecté'); date(lot.copiedAt, lot.copied, 'relevé copié');
  requireValue(lot.inspectedAt === lot.completedAt, 'relevé sans durée');
  requireValue(!lot.copied || lot.inspected && lot.copiedAt === lot.inspectedAt && (lot.destroyedAt === null || lot.copiedAt <= lot.destroyedAt), 'copie après perte de sa source');
  if (lot.inspected && !lot.copied) requireValue(destroyedBefore(lot, lot.inspectedAt), 'absence de copie sans perte matérielle');
  const cooler = scene.cooler, valve = scene.valve;
  body(cooler, initial.cooler); sameKeys(cooler.inspection, initial.cooler.inspection, 'inspection champs'); sameKeys(cooler.repair, initial.cooler.repair, 'réparation champs');
  work(cooler.inspection, cfg.inspectTime, cooler.x, 'diagnostic'); work(cooler.repair, cfg.repairTime, cooler.x, 'réparation');
  date(cooler.inspectedAt, cooler.inspected, 'refroidisseur inspecté'); date(cooler.repairedAt, cooler.repaired, 'refroidisseur réparé');
  requireValue(cooler.inspectedAt === cooler.inspection.completedAt && cooler.repairedAt === cooler.repair.completedAt, 'maintenance sans durée');
  if (cooler.repair.startedAt !== null) requireValue(cooler.inspected && valve.closed && cooler.repair.startedAt >= Math.max(cooler.inspectedAt, valve.closedAt), 'réparation avant diagnostic et isolation');
  if (cooler.repaired) requireValue(cooler.destroyedAt === null || cooler.repairedAt <= cooler.destroyedAt, 'réparation d’une machine déjà perdue');
  requireValue(!cooler.destroyed || !cooler.repair.working, 'réparation active de ruines');
  body(valve, initial.valve); work(valve, cfg.isolateTime, valve.x, 'isolation'); date(valve.closedAt, valve.closed, 'circuit isolé');
  requireValue(valve.closedAt === valve.completedAt && ['none', 'valve', 'cap'].includes(valve.method), 'isolation sans opération');
  if (valve.startedAt !== null) requireValue(cooler.inspected && valve.startedAt >= cooler.inspectedAt, 'isolation avant diagnostic');
  requireValue(valve.closed ? valve.method === (destroyedBefore(valve, valve.closedAt) ? 'cap' : 'valve') : valve.method === 'none', 'isolation sans organe correspondant');
  number(cooler.temperature, cfg.safeTemperature, cfg.initialTemperature, 'température du refroidisseur');
  const thermalEnd = Math.min(elapsed, cooler.destroyedAt ?? elapsed);
  const isolatedUntil = cooler.repaired ? Math.min(thermalEnd, cooler.repairedAt) : thermalEnd;
  const isolated = valve.closedAt === null ? cfg.initialTemperature : Math.max(cfg.isolatedTemperature, cfg.initialTemperature - Math.max(0, isolatedUntil - valve.closedAt) * cfg.isolationCoolingRate);
  const expectedTemperature = cooler.repaired ? Math.max(cfg.safeTemperature, isolated - Math.max(0, thermalEnd - cooler.repairedAt) * cfg.coolingRate) : isolated;
  requireValue(close(cooler.temperature, expectedTemperature, 2 * frame * cfg.coolingRate), 'refroidissement instantané ou inventé');
  number(cooler.exposureAdded, 0, elapsed * Math.max(0, cfg.initialTemperature - 45) * .035 + 1e-6, 'exposition thermique');
  const alert = scene.alert;
  sameKeys(alert, initial.alert, 'alerte champs'); date(alert.triggeredAt, alert.triggered, 'alerte déclenchée'); date(alert.readyAt, alert.ready, 'automate actif');
  stamp(alert.neutralizedAt, 'automate neutralisé'); number(alert.elapsed, 0, cfg.securityDelay, 'délai de sécurité');
  requireValue(alert.triggered ? ['worker-hit', 'material-hit', 'workshop-approach'].includes(alert.reason) : alert.reason === 'none', 'cause d’alerte');
  requireValue(close(alert.elapsed, alert.triggered ? Math.min(cfg.securityDelay, elapsed - alert.triggeredAt) : 0, frame), 'délai de sécurité non écoulé');
  requireValue(alert.ready === (alert.triggered && alert.elapsed >= cfg.securityDelay - 1e-9), 'activation sans délai');
  if (alert.ready) requireValue(close(alert.readyAt - alert.triggeredAt, cfg.securityDelay, frame), 'date d’activation');
  if (!alert.triggered) requireValue((!player || player.x < cfg.activationX) && [...scene.workers, lot, valve, cooler, scene.control].every(part => part.hp === part.maxHp), 'dégâts ou approche sans alerte');
  requireValue(Array.isArray(forces) && forces.length === 1, 'automate absent');
  const unit = forces[0];
  if (receipt) keys(unit, ['id', 'type', 'hp', 'maxHp', 'dead'], 'registre de l’automate');
  fixed(unit, initialForces[0], ['id', 'type'], 'identité automate'); number(unit.hp, -1000, unit.maxHp, 'intégrité automate'); boolean(unit.dead, 'automate perdu');
  requireValue(unit.dead === (unit.hp <= 0), 'automate perdu sans dégâts');
  requireValue(receipt ? Object.values(DIFFICULTIES).some(level => unit.maxHp === Math.round(ENEMY_TYPES.automaton.hp * level.enemyHealth)) : unit.maxHp === initialForces[0].maxHp, 'capacité automate');
  if (!alert.ready) { requireValue(!unit.dead && unit.hp === unit.maxHp, 'automate touché avant activation'); if (!receipt) fixed(unit, initialForces[0], ['x', 'y', 'active', 'phase', 'timer'], 'activité prématurée'); }
  requireValue((alert.neutralizedAt !== null) === (alert.ready && unit.dead), 'date de neutralisation sans corps');
  if (alert.neutralizedAt !== null) requireValue(alert.neutralizedAt >= alert.readyAt, 'neutralisation avant activation');
  const operationsReadyAt = time => clearedAt(time) && contact.inspectedAt !== null && contact.inspectedAt <= time
    && lot.inspectedAt !== null && lot.inspectedAt <= time && cooler.inspectedAt !== null && cooler.inspectedAt <= time
    && (cooler.repairedAt !== null && cooler.repairedAt <= time || cooler.destroyedAt !== null && cooler.destroyedAt <= time)
    && alert.neutralizedAt !== null && alert.neutralizedAt <= time;
  const control = scene.control;
  body(control, initial.control); work(control, cfg.controlTime, control.x, 'commande de production'); date(control.operatedAt, control.operated, 'commande accomplie');
  requireValue(control.operatedAt === control.completedAt, 'commande sans durée');
  if (control.startedAt !== null) requireValue(facts.plan !== 'unselected' && operationsReadyAt(control.startedAt), 'commande avant décision et opérations préalables');
  if (control.operated) {
    const expected = destroyedBefore(control, control.operatedAt) || facts.plan === 'restart' && destroyedBefore(cooler, control.operatedAt) ? 'damaged' : facts.plan;
    requireValue(control.mode === expected, 'résultat de commande contraire au matériel');
  } else requireValue(control.mode === 'pending', 'commande accomplie sans opération');
  const lotReleased = control.operated && control.mode === 'restart' && !destroyedBefore(lot, control.operatedAt);
  const lotBlocked = control.operated && control.mode === 'hold' && !destroyedBefore(lot, control.operatedAt);
  requireValue(lot.releasedAt === (lotReleased ? control.operatedAt : null) && lot.blockedAt === (lotBlocked ? control.operatedAt : null), 'lot sans commande correspondante');
  const cooperation = scene.cooperation;
  post(cooperation, initial.cooperation, cfg.cooperationTime, 'coopération'); boolean(cooperation.resolved, 'échange résolu'); date(cooperation.agreedAt, cooperation.agreed, 'accord des mécaniciens');
  requireValue(cooperation.resolved === (cooperation.completedAt !== null) && (!cooperation.agreed || cooperation.agreedAt === cooperation.completedAt), 'accord sans échange');
  if (cooperation.startedAt !== null) requireValue(control.operated && cooperation.startedAt >= control.operatedAt && operationsReadyAt(cooperation.startedAt), 'coopération avant exécution');
  const agreed = cooperation.resolved && control.mode === 'hold' && contact.heard && cooler.repaired && cooler.repairedAt <= cooperation.completedAt && !destroyedBefore(cooler, cooperation.completedAt)
    && scene.workers.some(w => w.mechanic && presentAt(w, cooperation.completedAt));
  requireValue(cooperation.agreed === agreed, 'accord inventé ou retiré après acquisition');
  const report = scene.report;
  post(report, initial.report, cfg.reportTime, 'rapport'); date(report.transmittedAt, report.transmitted, 'rapport transmis'); requireValue(report.transmittedAt === report.completedAt, 'rapport sans durée');
  if (report.startedAt !== null) requireValue(cooperation.resolved && report.startedAt >= cooperation.completedAt && operationsReadyAt(report.startedAt), 'rapport avant opérations et échange');
  const derived = workshopDerivedFacts({ workshop: scene, campaign: { context }, enemies: forces,
    decision: { resolved: facts.plan !== 'unselected', choice: choice ?? (facts.plan === 'restart' ? 'obey' : facts.plan === 'hold' ? 'defy' : null) } });
  for (const [key, value] of Object.entries(derived)) requireValue(facts[key] === value, `fait contraire aux corps : ${key}`);
}

export function validateWorkshopMission(value, template) {
  requireValue(value.missionId === 'MI14' && object(value.workshop) && value.campaign?.missionId === 'MI14', 'mission absente');
  const facts = value.campaign; validateContext(facts.context); validateWorkshopFacts(facts, value.status === 'won');
  requireValue(facts.plan === (value.decision.resolved ? value.decision.choice === 'obey' ? 'restart' : 'hold' : 'unselected'), 'choix contraire au plan');
  requireValue(!value.decision.active && !value.decision.resolved || facts.contactInspected && facts.lotInspected && facts.coolerInspected
    && (facts.coolerRepaired || facts.coolerDestroyed) && facts.securityNeutralized && facts.picketCleared, 'choix avant examen');
  validateScene(value.workshop, template.workshop, facts, value.mission.workshop, { elapsed: value.elapsed, context: facts.context,
    forces: value.enemies, initialForces: template.enemies, player: value.player, planetId: value.planetId, choice: value.decision.choice });
  fixed(value.evidence, template.evidence, Object.keys(template.evidence), 'preuve générique');
  requireValue(value.stats.evidence === 0 && value.stats.kills === Number(facts.securityNeutralized) && value.stats.collateral === facts.workersLost, 'statistiques contraires aux actes');
  requireValue(value.stats.ordersObeyed === Number(value.decision.choice === 'obey') && value.stats.ordersDefied === Number(value.decision.choice === 'defy'), 'statistiques du choix');
  requireValue(eq(value.objectives, workshopObjectives(value)) && value.extraction.active === facts.reportTransmitted, 'objectifs sans actes physiques');
  fixed(value.extraction, template.extraction, Object.keys(template.extraction).filter(k => k !== 'active'), 'sortie');
  requireValue(['picket', 'contact', 'security', 'maintenance', 'decision', 'operation', 'cooperation', 'report', 'extract', 'complete'].includes(facts.phase), 'phase inconnue');
  for (const foot of value.player.feet.filter(foot => foot.contact)) requireValue(close(foot.y, workshopSurface(value, foot.x, terrainAt(foot.x, value.planetId)).groundY), 'appui hors sol physique');
  if (value.status === 'won') requireValue(value.player.hull > 0 && value.extraction.active && Math.abs(value.player.x - value.extraction.x) < value.extraction.radius && facts.phase === 'complete', 'victoire sans extraction');
  if (value.status === 'lost') requireValue(value.player.hull === 0, 'défaite sans perte terminale');
}
export function validateWorkshopReceipt(receipt, context) {
  validateContext(context); validateWorkshopFacts(receipt, true);
  requireValue(receipt.plan === (receipt.choice === 'obey' ? 'restart' : 'hold'), 'réception contraire au choix');
  const template = createGame({ missionId: 'MI14', walkerId: receipt.walkerId, campaignContext: context });
  keys(receipt.roster, [...Object.keys(template.workshop), 'securityForces'], 'registre de l’atelier');
  const scene = Object.fromEntries(Object.keys(template.workshop).map(k => [k, receipt.roster[k]]));
  validateScene(scene, template.workshop, receipt, template.mission.workshop, { elapsed: receipt.elapsed, context, forces: receipt.roster.securityForces,
    initialForces: template.enemies, receipt: true, planetId: template.planetId, choice: receipt.choice });
  requireValue(receipt.hull > 0 && receipt.collateral === receipt.workersLost && receipt.kills === Number(receipt.securityNeutralized), 'bilan humain ou matériel inventé');
}
export function validateWorkshopSortie(previous, current) {
  requireValue(previous?.missionId === 'MI14' && current.missionId === 'MI14', 'checkpoint hors mission');
  requireValue(current.walkerId === previous.walkerId && current.seed === previous.seed && current.difficultyId === previous.difficultyId, 'sortie changée');
  requireValue(current.elapsed >= previous.elapsed && eq(current.campaign.context, previous.campaign.context), 'horloge ou héritage reculés');
  requireValue(previous.status === 'playing' || eq(previous, current), 'sortie terminale ressuscitée');
  requireValue(!previous.decision.resolved || current.decision.resolved && current.decision.choice === previous.decision.choice, 'choix annulé');
  const elapsed = current.elapsed - previous.elapsed, frame = .05 + 1e-6, cfg = current.mission.workshop;
  const reversible = ['productionOnline', 'strikePreserved', 'publicReleased', 'defected'];
  for (const flag of FLAGS.filter(k => !reversible.includes(k))) requireValue(!previous.campaign[flag] || current.campaign[flag], `fait acquis annulé : ${flag}`);
  requireValue(current.campaign.workersLost >= previous.campaign.workersLost && current.campaign.workersAlive <= previous.campaign.workersAlive, 'personne ressuscitée');
  const keep = (before, after) => {
    if (Object.hasOwn(before, 'hp')) requireValue(after.hp <= before.hp, `corps réparé : ${before.id}`);
    for (const key of Object.keys(before).filter(k => k.endsWith('At') && !['startedAt', 'completedAt'].includes(k))) {
      if (before[key] !== null) requireValue(after[key] === before[key], `date réécrite : ${before.id}.${key}`);
      else if (after[key] !== null) requireValue(after[key] >= previous.elapsed - 1e-6, `acte antidaté : ${before.id}.${key}`);
    }
  };
  const keepWork = (before, after, duration) => {
    if (before.completedAt !== null) requireValue(after.startedAt === before.startedAt && after.completedAt === before.completedAt && after.progress === before.progress && !after.working, 'travail achevé réécrit');
    if (after.startedAt !== null && before.startedAt !== after.startedAt) requireValue(after.startedAt >= previous.elapsed - 1e-6, 'nouveau travail antidaté');
    if (after.completedAt !== null && before.completedAt !== after.completedAt) requireValue(after.completedAt >= previous.elapsed - 1e-6, 'achèvement antidaté');
    requireValue((after.progress - before.progress) * duration <= elapsed + frame, 'travail accéléré entre checkpoints');
  };
  const before = previous.workshop, now = current.workshop;
  for (const [key, duration] of [['picket', cfg.passageTime], ['contact', cfg.contactTime], ['lot', cfg.recordTime], ['valve', cfg.isolateTime], ['control', cfg.controlTime], ['cooperation', cfg.cooperationTime], ['report', cfg.reportTime]]) {
    keep(before[key], now[key]); keepWork(before[key], now[key], duration);
  }
  keep(before.cooler, now.cooler); keepWork(before.cooler.inspection, now.cooler.inspection, cfg.inspectTime); keepWork(before.cooler.repair, now.cooler.repair, cfg.repairTime); keep(before.alert, now.alert);
  requireValue(now.cooler.temperature <= before.cooler.temperature + 1e-6 && now.cooler.exposureAdded >= before.cooler.exposureAdded, 'chaleur ou exposition annulée');
  before.workers.forEach((worker, i) => {
    const next = now.workers[i]; keep(worker, next);
    requireValue(next.routeProgress >= worker.routeProgress && next.x >= worker.x && next.x - worker.x <= elapsed * cfg.workerSpeed + 1e-5, 'trajet ouvrier reculé ou accéléré');
  });
  previous.enemies.forEach((unit, i) => requireValue(current.enemies[i].hp <= unit.hp, 'automate réparé ou ressuscité'));
}
