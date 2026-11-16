/** MI13 save/receipt checks. These checks never repair or advance a saved scene. */
import { DIFFICULTIES, ENEMY_TYPES } from './content.mjs';
import { createGame, terrainAt } from './simulation.mjs';
import { foundryDerivedFacts, foundryReceiptRoster, foundrySurface, foundryObjectives } from './foundry-simulation.mjs';

const FLAGS = ['carrierReleased', 'carrierArrived', 'carrierDestroyed', 'manifestInspected', 'manifestCopied',
  'analysisCompleted', 'pt03Acquired', 'provenanceVerified', 'pt01CrossReferenced', 'relayCrossReferenced',
  'privateTriggered', 'privateReady', 'manifestRead', 'operationsResolved', 'reportTransmitted', 'publicReleased', 'defected'];
const COUNTS = { cargoTotal: 2, cargoInspected: 2, markingsCopied: 2, cargoIntact: 2, cargoDamaged: 2,
  cargoLost: 2, cargoTransferred: 2, circuitsOpened: 2, privateNeutralized: 3 };
const CONTEXT_KEYS = ['relayRecorded', 'relayChoice', 'relayOrdersCopied', 'pt01Acquired'];
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const close = (a, b, tolerance = 1e-6) => Math.abs(a - b) <= tolerance;
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function requireValue(ok, label) { if (!ok) throw new Error(`Sauvegarde invalide : fonderie de Kharon — ${label}`); }
function number(value, min, max, label, integer = false) {
  requireValue(Number.isFinite(value) && value >= min - 1e-8 && value <= max + 1e-8 && (!integer || Number.isInteger(value)), label);
}
function keys(value, expected, label) { requireValue(object(value) && Object.keys(value).length === expected.length && expected.every(k => Object.hasOwn(value, k)), label); }
function sameKeys(value, initial, label) { keys(value, Object.keys(initial), label); }
function fixed(value, initial, fields, label) { for (const field of fields) requireValue(value[field] === initial[field], `${label}.${field}`); }
function boolean(value, label) { requireValue(typeof value === 'boolean', label); }

export function createFoundryDossier() {
  return { plan: 'unselected', ...Object.fromEntries(FLAGS.map(key => [key, false])),
    ...Object.fromEntries(Object.keys(COUNTS).map(key => [key, 0])), roster: null };
}
export function foundryContextFor(campaign) {
  const report = campaign.completed.MI12;
  return { relayRecorded: Boolean(report), relayChoice: report?.choice || 'none',
    relayOrdersCopied: report?.ordersCopied === true,
    pt01Acquired: campaign.evidence?.includes?.('PT01') === true || campaign.completed.MI04?.logRecovered === true };
}
function validateContext(context) {
  keys(context, CONTEXT_KEYS, 'héritage des pièces');
  for (const field of ['relayRecorded', 'relayOrdersCopied', 'pt01Acquired']) boolean(context[field], `héritage ${field}`);
  requireValue(['none', 'obey', 'defy', 'refuse'].includes(context.relayChoice), 'choix du relais');
  requireValue(context.relayRecorded === (context.relayChoice !== 'none'), 'choix sans rapport du relais');
  requireValue(context.relayRecorded || !context.relayOrdersCopied, 'copie du relais sans rapport');
}
export function validateFoundryFacts(facts, finished = false) {
  for (const field of FLAGS) boolean(facts[field], field);
  for (const [field, maximum] of Object.entries(COUNTS)) number(facts[field], 0, maximum, field, true);
  requireValue(['unselected', 'deliver', 'quarantine'].includes(facts.plan), 'destination inconnue');
  requireValue(facts.cargoTotal === 2 && facts.cargoIntact + facts.cargoDamaged + facts.cargoLost === 2, 'bilan des deux caisses');
  requireValue(facts.markingsCopied <= facts.cargoInspected, 'marquage sans relevé');
  requireValue(!facts.manifestCopied || facts.manifestInspected, 'bordereau sans inspection');
  requireValue(facts.manifestRead === (facts.cargoInspected === 2 && facts.manifestInspected), 'relevés incomplets');
  requireValue(!facts.analysisCompleted || facts.manifestRead, 'analyse avant les relevés');
  requireValue(facts.pt03Acquired === (facts.markingsCopied === 2 && facts.manifestCopied && facts.analysisCompleted), 'PT03 sans ses quatre actes');
  requireValue(facts.provenanceVerified === facts.pt03Acquired, 'provenance inventée');
  requireValue(!facts.pt01CrossReferenced || facts.pt03Acquired, 'recoupement sans provenance locale');
  requireValue(!facts.relayCrossReferenced || facts.pt03Acquired, 'ordres sans provenance locale');
  requireValue(!facts.carrierArrived || facts.carrierReleased && facts.plan !== 'unselected', 'porteur arrivé sans escorte ou destination');
  requireValue(!facts.cargoTransferred || facts.carrierArrived, 'caisses transférées sans porteur arrivé');
  requireValue(!facts.privateReady || facts.privateTriggered, 'embuscade sans déclenchement');
  requireValue(!facts.privateNeutralized || facts.privateReady, 'ennemi neutralisé avant arrivée');
  requireValue(!facts.operationsResolved || facts.carrierArrived && facts.plan !== 'unselected', 'réception sans arrivée');
  requireValue(!facts.reportTransmitted || facts.operationsResolved && facts.analysisCompleted && facts.privateNeutralized === 3, 'rapport prématuré');
  requireValue(!facts.publicReleased && !facts.defected, 'diffusion ou défection prématurée');
  if (finished) requireValue(facts.reportTransmitted && !facts.carrierDestroyed, 'sortie achevée sans réception ou porteur vivant');
}
export function foundryDossierFromGame(game) {
  return { ...Object.fromEntries(Object.keys(createFoundryDossier()).filter(k => k !== 'roster').map(k => [k, game.campaign[k]])),
    roster: foundryReceiptRoster(game) };
}

function validateScene(scene, initial, facts, cfg, options) {
  const { elapsed, context, privateForces, initialForces, player = null, receipt = false, planetId = 'PL04', choice = null } = options;
  const tolerance = .05 + 1e-6;
  sameKeys(scene, initial, 'champs de la scène');
  const stamp = (value, label) => { if (value !== null) number(value, 0, elapsed, label); };
  const date = (value, flag, label) => { boolean(flag, label); stamp(value, label); requireValue((value !== null) === flag, `${label} et date`); };
  const dates = part => { for (const key of Object.keys(part).filter(key => key.endsWith('At'))) stamp(part[key], `${part.id ?? 'travail'}.${key}`); };
  const body = (part, original, moving = false) => {
    sameKeys(part, original, `${original.id} champs`); fixed(part, original, moving ? ['id', 'w', 'h', 'maxHp'] : ['id', 'x', 'y', 'w', 'h', 'maxHp'], 'corps');
    number(part.hp, 0, part.maxHp, `${part.id} intégrité`); number(part.flash, 0, .15, `${part.id} impact`);
    date(part.destroyedAt, part.destroyed, `${part.id} destruction`); requireValue(part.destroyed === (part.hp === 0), `${part.id} perte sans rupture`); dates(part);
    if (moving) { number(part.x, 0, 7500, `${part.id} x`); number(part.y, 0, 1000, `${part.id} y`); }
  };
  const work = (part, duration, x, label, persistent = false) => {
    boolean(part.working, `${label} actif`); number(part.progress, 0, 1, `${label} progression`); dates(part);
    requireValue(!part.working || part.startedAt !== null && part.completedAt === null && part.progress < 1, `${label} activité incohérente`);
    requireValue(part.progress === 0 || part.startedAt !== null, `${label} sans début`);
    if (part.startedAt !== null) requireValue(part.progress * duration <= elapsed - part.startedAt + tolerance, `${label} trop rapide`);
    requireValue((part.completedAt !== null) === (part.progress === 1), `${label} achèvement sans date`);
    if (part.completedAt !== null) requireValue(!part.working && part.startedAt !== null && part.completedAt + tolerance >= part.startedAt + duration, `${label} durée incomplète`);
    if (persistent) { number(part.elapsed, 0, duration, `${label} temps cumulé`); requireValue(close(part.elapsed / duration, part.progress), `${label} temps contraire à la position`); }
    if (part.working && player && part.progress > 0) {
      requireValue(Math.abs(player.x - x) <= cfg.interactionRadius + 1e-6, `${label} hors portée`);
      requireValue(player.braced && !player.move && Math.abs(player.speed) < 3 && player.feet.every(foot => foot.contact), `${label} sans ancrage`);
    }
  };
  const carrier = scene.carrier;
  body(carrier, initial.carrier, true); sameKeys(carrier.release, initial.carrier.release, 'libération champs');
  work(carrier.release, cfg.releaseTime ?? 2, carrier.x, 'libération'); date(carrier.releasedAt, carrier.released, 'libération du porteur');
  requireValue(carrier.releasedAt === carrier.release.completedAt, 'libération sans durée');
  date(carrier.arrivedAt, carrier.arrived, 'arrivée du porteur');
  requireValue(carrier.destination === facts.plan, 'destination du porteur contraire au choix');
  const target = facts.plan === 'deliver' ? cfg.deliveryX : facts.plan === 'quarantine' ? cfg.quarantineX : cfg.holdingX;
  number(carrier.x, cfg.carrierX, target, 'trajet du porteur'); number(carrier.distance, 0, target - cfg.carrierX, 'distance du porteur');
  requireValue(close(carrier.distance, carrier.x - cfg.carrierX), 'distance sans déplacement'); number(carrier.speed, 0, cfg.carrierSpeed, 'vitesse du porteur');
  requireValue(carrier.released || carrier.x === cfg.carrierX && carrier.distance === 0 && carrier.speed === 0, 'porteur parti avant libération');
  if (carrier.released) requireValue(carrier.distance <= (elapsed - carrier.releasedAt) * cfg.carrierSpeed + 1e-5, 'porteur téléporté');
  requireValue(!carrier.arrived || facts.plan !== 'unselected' && carrier.x === target && carrier.speed === 0 && carrier.arrivedAt >= carrier.releasedAt, 'arrivée sans trajet');
  requireValue(!carrier.destroyed || carrier.speed === 0, 'porteur détruit en mouvement');
  requireValue(Array.isArray(carrier.wheels) && carrier.wheels.length === 4, 'quatre roues absentes');
  for (const [i, offset] of [-94, -34, 34, 94].entries()) {
    const wheel = carrier.wheels[i], x = carrier.x + offset, surface = foundrySurface({ foundry: scene }, x, terrainAt(x, planetId));
    sameKeys(wheel, initial.carrier.wheels[i], 'roue champs');
    requireValue(wheel.id === `foundry-wheel-${i + 1}` && wheel.radius === 16 && wheel.contact === true && close(wheel.x, x)
      && close(wheel.y, surface.groundY - 16) && close(wheel.groundY, surface.groundY) && wheel.bridgeId === surface.bridgeId
      && close(wheel.temperature, surface.temperature, cfg.coolingRate * .05 + 1e-6), 'roue sans surface physique');
  }
  requireValue(close(carrier.y, carrier.wheels.reduce((n, w) => n + w.groundY, 0) / 4 - 46), 'hauteur du porteur sans roues');
  number(carrier.lastStep, -1, 1e7, 'dernier appui sur porteur', true);

  requireValue(Array.isArray(scene.cargo) && scene.cargo.length === 2, 'deux caisses absentes');
  for (const [i, cargo] of scene.cargo.entries()) {
    body(cargo, initial.cargo[i], true); fixed(cargo, initial.cargo[i], ['offset'], 'position relative caisse');
    sameKeys(cargo.marking, initial.cargo[i].marking, 'relevé champs'); sameKeys(cargo.transfer, initial.cargo[i].transfer, 'transfert champs');
    work(cargo.marking, cfg.markTime, cargo.x, 'marquage'); date(cargo.inspectedAt, cargo.inspected, 'inspection de caisse'); date(cargo.copiedAt, cargo.markingCopied, 'copie de marquage');
    requireValue(cargo.inspectedAt === cargo.marking.completedAt, 'relevé sans durée');
    requireValue(!cargo.inspected || scene.alert.ready && cargo.inspectedAt + tolerance >= scene.alert.readyAt + cfg.markTime, 'relevé avant arrivée de l’embuscade');
    requireValue(!cargo.markingCopied || cargo.inspected && cargo.copiedAt === cargo.inspectedAt && (cargo.destroyedAt === null || cargo.copiedAt <= cargo.destroyedAt), 'marquage inventé après perte');
    if (cargo.inspected && !cargo.markingCopied) requireValue(cargo.destroyedAt !== null && cargo.destroyedAt <= cargo.inspectedAt, 'absence de copie sans perte matérielle');
    const bay = scene.bays.find(b => b.kind === facts.plan);
    work(cargo.transfer, cfg.transferTime, bay?.postX ?? 0, 'transfert', true); date(cargo.transferredAt, cargo.transferred, 'caisse réceptionnée');
    requireValue(cargo.transferredAt === cargo.transfer.completedAt, 'réception sans durée');
    if (cargo.transfer.startedAt !== null) {
      requireValue(carrier.arrived && bay && cargo.transfer.startedAt >= carrier.arrivedAt, 'transfert avant arrivée');
      requireValue(close(cargo.transfer.fromX, carrier.x + cargo.offset) && close(cargo.transfer.fromY, carrier.y - carrier.h / 2 - cargo.h / 2), 'origine de transfert fausse');
      const destinationX = bay.x + 250 + i * 104, destinationY = terrainAt(destinationX, planetId) - cargo.h / 2;
      requireValue(close(cargo.x, cargo.transfer.fromX + (destinationX - cargo.transfer.fromX) * cargo.transfer.progress)
        && close(cargo.y, cargo.transfer.fromY + (destinationY - cargo.transfer.fromY) * cargo.transfer.progress), 'position de transfert sans travail physique');
      requireValue(!cargo.transferred || cargo.bay === facts.plan && (cargo.destroyedAt === null || cargo.transferredAt <= cargo.destroyedAt), 'caisse reçue après perte ou mauvaise baie');
    } else requireValue(cargo.transfer.fromX === null && cargo.transfer.fromY === null && close(cargo.x, carrier.x + cargo.offset)
      && close(cargo.y, carrier.y - carrier.h / 2 - cargo.h / 2), 'caisse détachée avant transfert');
    requireValue(cargo.transferred || cargo.bay === 'none', 'baie sans réception');
    requireValue(!cargo.destroyed || !cargo.transfer.working, 'transfert de ruines');
    number(cargo.lastStep, -1, 1e7, 'dernier appui sur caisse', true);
  }
  const m = scene.manifest;
  body(m, initial.manifest, true); work(m, cfg.manifestTime, m.x, 'bordereau'); date(m.inspectedAt, m.inspected, 'inspection du bordereau'); date(m.copiedAt, m.copied, 'copie du bordereau');
  requireValue(close(m.x, carrier.x - 111) && close(m.y, carrier.y - 38), 'bordereau séparé du porteur');
  requireValue(m.inspectedAt === m.completedAt, 'bordereau sans durée');
  requireValue(!m.copied || m.inspected && m.copiedAt === m.inspectedAt && (m.destroyedAt === null || m.copiedAt <= m.destroyedAt), 'bordereau inventé après perte');
  if (m.inspected && !m.copied) requireValue(m.destroyedAt !== null && m.destroyedAt <= m.inspectedAt, 'bordereau absent sans perte');
  const a = scene.analysis;
  sameKeys(a, initial.analysis, 'analyse champs'); fixed(a, initial.analysis, ['id', 'w', 'h'], 'liaison de Tess'); work(a, cfg.analysisTime, carrier.x, 'analyse');
  requireValue(close(a.x, carrier.x) && close(a.y, carrier.y - 110), 'analyse sans liaison du porteur'); date(a.completedAt, a.completed, 'analyse achevée');
  if (a.startedAt !== null) requireValue(facts.manifestRead && a.startedAt >= Math.max(m.inspectedAt, ...scene.cargo.map(c => c.inspectedAt)), 'analyse commencée avant les relevés');

  requireValue(Array.isArray(scene.bridges) && scene.bridges.length === 2, 'deux circuits absents');
  for (const [i, bridge] of scene.bridges.entries()) {
    const original = initial.bridges[i]; sameKeys(bridge, original, 'pont champs'); fixed(bridge, original, ['id', 'start', 'end', 'rise'], 'tablier');
    body(bridge.valve, original.valve); work(bridge.valve, cfg.valveTime, bridge.valve.x, 'vanne'); date(bridge.openedAt, bridge.circuitOpen, 'circuit ouvert');
    requireValue(bridge.openedAt === bridge.valve.completedAt, 'vanne ouverte sans durée');
    requireValue(!bridge.circuitOpen || bridge.valve.destroyedAt === null || bridge.openedAt <= bridge.valve.destroyedAt, 'vanne ouverte après destruction');
    const expectedTemp = bridge.circuitOpen ? Math.max(cfg.cooledTemperature, cfg.bridgeTemperature - (elapsed - bridge.openedAt) * cfg.coolingRate) : cfg.bridgeTemperature;
    number(bridge.temperature, cfg.cooledTemperature, cfg.bridgeTemperature, 'température');
    requireValue(close(bridge.temperature, expectedTemp, cfg.coolingRate * .05 + 1e-6), 'refroidissement instantané ou inventé');
    sameKeys(bridge.steam, original.steam, 'vapeur champs'); fixed(bridge.steam, original.steam, ['x', 'y'], 'jet physique');
    const cycle = (elapsed + i * 3) % (cfg.steamWarning + cfg.steamJet + cfg.steamRest);
    requireValue(close(bridge.steam.cycle, cycle), 'horloge de vapeur');
    const phase = bridge.circuitOpen ? 'off' : cycle < cfg.steamWarning ? 'warning' : cycle < cfg.steamWarning + cfg.steamJet ? 'jet' : 'rest';
    requireValue(bridge.steam.phase === phase, 'avertissement ou jet incohérent');
  }
  fixed(scene.orders, initial.orders, Object.keys(initial.orders), 'poste de décision'); requireValue(eq(scene.bays, initial.bays), 'baies réécrites');
  const r = scene.report; sameKeys(r, initial.report, 'rapport champs'); fixed(r, initial.report, ['id', 'x', 'y', 'w', 'h'], 'poste de rapport');
  work(r, cfg.reportTime, r.x, 'rapport'); date(r.transmittedAt, r.transmitted, 'rapport transmis'); requireValue(r.transmittedAt === r.completedAt, 'rapport sans durée');
  if (r.startedAt !== null) requireValue(facts.operationsResolved && facts.analysisCompleted && facts.privateNeutralized === 3
    && r.startedAt >= Math.max(a.completedAt, carrier.arrivedAt, ...scene.cargo.map(c => c.transferredAt ?? c.destroyedAt)), 'rapport commencé avant la réception');
  const alert = scene.alert; sameKeys(alert, initial.alert, 'alerte champs'); date(alert.triggeredAt, alert.triggered, 'embuscade déclenchée'); date(alert.readyAt, alert.ready, 'embuscade arrivée');
  requireValue(alert.reason === (alert.triggered ? 'route-crossed' : 'none'), 'cause d’embuscade'); number(alert.elapsed, 0, cfg.privateDelay, 'délai d’embuscade');
  requireValue(!alert.triggered || close(alert.elapsed, Math.min(cfg.privateDelay, elapsed - alert.triggeredAt)), 'délai non écoulé');
  requireValue(alert.ready === (alert.triggered && alert.elapsed >= cfg.privateDelay - 1e-9), 'arrivée sans délai');
  if (alert.ready) requireValue(close(alert.readyAt - alert.triggeredAt, cfg.privateDelay, tolerance), 'date d’arrivée');
  if (!alert.triggered) requireValue(alert.elapsed === 0 && (!player || player.x < cfg.ambushX) && carrier.x < cfg.ambushX, 'route franchie sans alerte');
  sameKeys(scene.thermal, initial.thermal, 'chaleur champs');
  for (const field of ['ambientAdded', 'conductionAdded', 'steamAdded', 'wheelDamage']) number(scene.thermal[field], 0, 1e9, `chaleur ${field}`);
  requireValue(close(scene.thermal.ambientAdded, elapsed * .045, .05 * .045 + 1e-6), 'chaleur ambiante non réconciliée');
  requireValue(Array.isArray(scene.thermal.contacts) && scene.thermal.contacts.length <= 6, 'registre de contacts');
  requireValue(Array.isArray(privateForces) && privateForces.length === 3, 'registre de l’embuscade');
  if (receipt) requireValue(Object.values(DIFFICULTIES).some(level => privateForces.every((unit, index) => unit.maxHp === Math.round(ENEMY_TYPES[initialForces[index].type].hp * level.enemyHealth))), 'capacités privées incompatibles');
  for (const [i, unit] of privateForces.entries()) {
    fixed(unit, initialForces[i], ['id', 'type'], 'force privée'); number(unit.hp, -1000, unit.maxHp, 'intégrité privée'); boolean(unit.dead, 'perte privée');
    requireValue(unit.dead === (unit.hp <= 0), 'perte sans dégâts');
    if (!receipt) requireValue(unit.maxHp === initialForces[i].maxHp, 'capacité privée modifiée');
    if (!alert.ready) {
      requireValue(!unit.dead && unit.hp === unit.maxHp, 'embuscade touchée avant son arrivée');
      if (!receipt) fixed(unit, initialForces[i], ['x', 'y', 'active', 'phase', 'timer'], 'ennemi prématuré');
    }
  }
  const derived = foundryDerivedFacts({ foundry: scene, campaign: { context }, enemies: privateForces,
    decision: { resolved: facts.plan !== 'unselected', choice: choice ?? (facts.plan === 'deliver' ? 'obey' : facts.plan === 'quarantine' ? 'defy' : null) } });
  for (const [key, value] of Object.entries(derived)) requireValue(facts[key] === value, `fait contraire aux corps : ${key}`);
}

export function validateFoundryMission(value, template) {
  requireValue(value.missionId === 'MI13' && object(value.foundry) && value.campaign?.missionId === 'MI13', 'mission absente');
  const facts = value.campaign; validateContext(facts.context); validateFoundryFacts(facts, value.status === 'won');
  requireValue(facts.plan === (value.decision.resolved ? value.decision.choice === 'obey' ? 'deliver' : 'quarantine' : 'unselected'), 'choix contraire au plan');
  requireValue(!value.decision.active && !value.decision.resolved || facts.analysisCompleted && facts.manifestRead && facts.privateNeutralized === 3, 'choix avant examen');
  validateScene(value.foundry, template.foundry, facts, value.mission.foundry, { elapsed: value.elapsed,
    context: facts.context, privateForces: value.enemies, initialForces: template.enemies, player: value.player,
    planetId: value.planetId, choice: value.decision.choice });
  requireValue(value.evidence.collected === facts.pt03Acquired && value.evidence.scanProgress === Number(facts.pt03Acquired) && !value.evidence.scanning, 'preuve générique contraire à PT03');
  fixed(value.evidence, template.evidence, Object.keys(template.evidence).filter(k => !['collected', 'scanProgress', 'scanning'].includes(k)), 'preuve générique');
  requireValue(value.stats.evidence === Number(facts.pt03Acquired) && value.stats.kills === facts.privateNeutralized && value.stats.collateral === 0, 'statistiques contraires aux actes');
  requireValue(value.stats.ordersObeyed === Number(value.decision.choice === 'obey') && value.stats.ordersDefied === Number(value.decision.choice === 'defy'), 'statistiques du choix');
  const expected = structuredClone(value); expected.objectives = foundryObjectives(expected);
  requireValue(eq(value.objectives, expected.objectives) && value.extraction.active === expected.extraction.active, 'objectifs sans actes physiques');
  fixed(value.extraction, template.extraction, Object.keys(template.extraction).filter(k => k !== 'active'), 'sortie');
  requireValue(['loading', 'escort', 'assessment', 'decision', 'delivery', 'extraction', 'complete'].includes(facts.phase), 'phase inconnue');
  if (value.status === 'won') requireValue(value.player.hull > 0 && !facts.carrierDestroyed && value.extraction.active && Math.abs(value.player.x - value.extraction.x) < value.extraction.radius && facts.phase === 'complete', 'victoire sans extraction');
  if (value.status === 'lost') requireValue(value.player.hull === 0 || facts.carrierDestroyed, 'défaite sans perte terminale');
}
export function validateFoundryReceipt(receipt, context) {
  validateContext(context); validateFoundryFacts(receipt, true);
  requireValue(receipt.plan === (receipt.choice === 'obey' ? 'deliver' : 'quarantine'), 'réception contraire au choix');
  const template = createGame({ missionId: 'MI13', walkerId: receipt.walkerId, campaignContext: context });
  keys(receipt.roster, [...Object.keys(template.foundry), 'privateForces'], 'registre du porteur');
  const scene = Object.fromEntries(Object.keys(template.foundry).map(k => [k, receipt.roster[k]]));
  validateScene(scene, template.foundry, receipt, template.mission.foundry, { elapsed: receipt.elapsed, context,
    privateForces: receipt.roster.privateForces, initialForces: template.enemies, receipt: true, planetId: template.planetId, choice: receipt.choice });
  requireValue(receipt.hull > 0 && receipt.collateral === 0 && receipt.kills === receipt.privateNeutralized, 'bilan humain ou matériel inventé');
}

export function validateFoundrySortie(previous, current) {
  requireValue(previous?.missionId === 'MI13' && current.missionId === 'MI13', 'checkpoint hors mission');
  requireValue(current.walkerId === previous.walkerId && current.seed === previous.seed && current.difficultyId === previous.difficultyId, 'sortie changée');
  requireValue(current.elapsed >= previous.elapsed && eq(current.campaign.context, previous.campaign.context), 'horloge ou héritage reculés');
  requireValue(previous.status === 'playing' || eq(previous, current), 'sortie terminale ressuscitée');
  requireValue(!previous.decision.resolved || current.decision.resolved && current.decision.choice === previous.decision.choice, 'choix annulé');
  const elapsed = current.elapsed - previous.elapsed, frame = .05 + 1e-6;
  for (const flag of FLAGS.filter(k => !['publicReleased', 'defected'].includes(k))) requireValue(!previous.campaign[flag] || current.campaign[flag], `fait acquis annulé : ${flag}`);
  for (const key of ['cargoInspected', 'markingsCopied', 'cargoLost', 'cargoTransferred', 'circuitsOpened', 'privateNeutralized']) requireValue(current.campaign[key] >= previous.campaign[key], `compteur reculé : ${key}`);
  const keep = (before, after) => {
    if (Object.hasOwn(before, 'hp')) requireValue(after.hp <= before.hp, `corps réparé : ${before.id}`);
    for (const key of Object.keys(before).filter(k => k.endsWith('At') && !['startedAt', 'completedAt'].includes(k))) {
      if (before[key] !== null) requireValue(after[key] === before[key], `date réécrite : ${before.id}.${key}`);
      else if (after[key] !== null) requireValue(after[key] >= previous.elapsed - 1e-6, `acte antidaté : ${before.id}.${key}`);
    }
  };
  const keepWork = (before, after, duration, persistent = false) => {
    if (before.completedAt !== null) requireValue(after.startedAt === before.startedAt && after.completedAt === before.completedAt && after.progress === before.progress && !after.working, 'travail achevé réécrit');
    if (after.startedAt !== null && before.startedAt !== after.startedAt) requireValue(after.startedAt >= previous.elapsed - 1e-6, 'nouveau travail antidaté');
    if (after.completedAt !== null && before.completedAt !== after.completedAt) requireValue(after.completedAt >= previous.elapsed - 1e-6, 'achèvement antidaté');
    requireValue((after.progress - before.progress) * duration <= elapsed + frame, 'travail accéléré entre checkpoints');
    if (persistent) requireValue(after.elapsed >= before.elapsed && (!before.elapsed || after.startedAt === before.startedAt && after.fromX === before.fromX && after.fromY === before.fromY), 'transfert physique rembobiné');
  };
  const before = previous.foundry, now = current.foundry, cfg = current.mission.foundry;
  keep(before.carrier, now.carrier); keepWork(before.carrier.release, now.carrier.release, cfg.releaseTime ?? 2);
  requireValue(now.carrier.x >= before.carrier.x && now.carrier.x - before.carrier.x <= elapsed * cfg.carrierSpeed + 1e-6, 'porteur téléporté ou reculé');
  before.cargo.forEach((part, i) => { keep(part, now.cargo[i]); keepWork(part.marking, now.cargo[i].marking, cfg.markTime); keepWork(part.transfer, now.cargo[i].transfer, cfg.transferTime, true); });
  keep(before.manifest, now.manifest); keepWork(before.manifest, now.manifest, cfg.manifestTime);
  keep(before.analysis, now.analysis); keepWork(before.analysis, now.analysis, cfg.analysisTime);
  keep(before.report, now.report); keepWork(before.report, now.report, cfg.reportTime); keep(before.alert, now.alert);
  before.bridges.forEach((bridge, i) => { keep(bridge, now.bridges[i]); keep(bridge.valve, now.bridges[i].valve); keepWork(bridge.valve, now.bridges[i].valve, cfg.valveTime); requireValue(now.bridges[i].temperature <= bridge.temperature, 'tablier réchauffé sans source'); });
  for (const field of ['ambientAdded', 'conductionAdded', 'steamAdded', 'wheelDamage']) requireValue(now.thermal[field] >= before.thermal[field], `exposition thermique annulée : ${field}`);
  previous.enemies.forEach((unit, i) => requireValue(current.enemies[i].hp <= unit.hp, 'ennemi réparé ou ressuscité'));
}
