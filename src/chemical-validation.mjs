/** MI10 save and receipt validation. Pure checks; no advancement or persistence. */
import { DIFFICULTIES, ENEMY_TYPES } from './content.mjs';
import { createGame, terrainAt } from './simulation.mjs';
import { chemicalReceiptRoster } from './chemical-simulation.mjs';

const FLAGS = ['leakContained', 'leakStopped', 'collectorClosed', 'collectorDestroyed', 'flowResolved',
  'waterDispositionRecorded', 'waterRestored', 'villageHabitable', 'orisonRecordInspected', 'orisonRecordCopied',
  'orisonRecordLost', 'sampleStarted', 'sampleCollected', 'sampleLost', 'sampleResolved', 'pt02Acquired',
  'privateTriggered', 'privateReady', 'operationsResolved', 'reportTransmitted', 'manifestRead'];
const COUNTS = { tanksTotal: 3, tanksInspected: 3, copiedMarks: 3, tanksDestroyed: 3, tanksSecured: 3,
  canalsIntact: 2, canalsCovered: 2, canalsPolluted: 2, homesHabitable: 2, privateNeutralized: 3 };
const MASS = ['sourceVolume', 'spillReleased', 'spillRetained', 'spillDelivered', 'spillInTransit'];
const CONTEXT_KEYS = ['routeRecorded', 'routeChoice', 'routeApproach', 'routePassagePreserved', 'routeHarvestFragile'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const close = (a, b) => Math.abs(a - b) <= 1e-6;
const sum = (items, key) => items.reduce((total, item) => total + item[key], 0);

function requireValue(ok, label) { if (!ok) throw new Error(`Sauvegarde invalide : champ chimique — ${label}`); }
function number(value, min, max, label, integer = false) {
  requireValue(Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)), label);
}
function boolean(value, label) { requireValue(typeof value === 'boolean', label); }
function equal(value, expected, label) { requireValue(JSON.stringify(value) === JSON.stringify(expected), label); }
function keys(value, expected, label) {
  requireValue(object(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key)), label);
}
function fixed(value, expected, fields, label) {
  for (const key of fields) requireValue(value[key] === expected[key], `${label}.${key}`);
}
function shape(value, initial, label) {
  keys(value, Object.keys(initial), `${label} : champs`);
  for (const [key, expected] of Object.entries(initial)) {
    if (expected !== null && !object(expected) && !Array.isArray(expected)) requireValue(typeof value[key] === typeof expected, `${label}.${key} : type`);
  }
}

export function createChemicalDossier() {
  return { plan: 'unselected', ...Object.fromEntries(FLAGS.map(key => [key, false])),
    ...Object.fromEntries(Object.keys(COUNTS).map(key => [key, 0])),
    ...Object.fromEntries(MASS.map(key => [key, 0])), roster: null };
}

export function chemicalContextFor(campaign) {
  const report = campaign.completed.MI09;
  return { routeRecorded: Boolean(report), routeChoice: report?.choice || 'none',
    routeApproach: report?.approach || 'unprepared', routePassagePreserved: report?.passagePreserved || false,
    routeHarvestFragile: report?.harvestFragile || false };
}

function validateContext(context) {
  keys(context, CONTEXT_KEYS, 'héritage de la route de Thyr');
  for (const key of ['routeRecorded', 'routePassagePreserved', 'routeHarvestFragile']) boolean(context[key], `héritage ${key}`);
  requireValue(['none', 'obey', 'defy'].includes(context.routeChoice), 'choix hérité de MI09');
  requireValue(['unprepared', 'surveyed', 'guided'].includes(context.routeApproach), 'approche héritée de MI09');
  requireValue(context.routeRecorded === (context.routeChoice !== 'none'), 'choix sans rapport MI09');
  requireValue(!context.routePassagePreserved || context.routeChoice === 'defy', 'passage préservé contraire au rapport MI09');
  requireValue(context.routeRecorded || context.routeApproach === 'unprepared' && !context.routePassagePreserved && !context.routeHarvestFragile, 'conséquences sans rapport MI09');
}

export function validateChemicalFacts(facts, finished = false) {
  for (const key of FLAGS) boolean(facts[key], `bilan ${key}`);
  for (const [key, max] of Object.entries(COUNTS)) number(facts[key], 0, max, `bilan ${key}`, true);
  for (const key of MASS) number(facts[key], 0, key === 'sourceVolume' ? 100 : 300, `bilan ${key}`);
  requireValue(facts.tanksTotal === 3 && facts.copiedMarks <= facts.tanksInspected, 'cuves ou marquages sans identification');
  requireValue(['unselected', 'demolish', 'secure'].includes(facts.plan), 'conduite inconnue');
  requireValue(facts.tanksSecured + facts.tanksDestroyed <= 3, 'cuve détruite encore déclarée sécurisée');
  requireValue(!facts.tanksSecured || facts.plan === 'secure', 'mise en sécurité sans ordre correspondant');
  requireValue(facts.operationsResolved === (facts.plan !== 'unselected' && (facts.plan === 'demolish' ? facts.tanksDestroyed === 3 : facts.tanksSecured + facts.tanksDestroyed === 3)), 'opérations déclarées sans résultat matériel');
  requireValue(!facts.leakContained || facts.leakStopped, 'fuite contenue encore active');
  requireValue(facts.sourceVolume > 0 || facts.leakStopped, 'cuve vide encore déclarée en fuite');
  requireValue(close(facts.spillReleased, facts.spillRetained + facts.spillDelivered + facts.spillInTransit), 'masse déversée non réconciliée');
  requireValue(facts.flowResolved === (facts.leakStopped && facts.spillInTransit < 1e-7), 'écoulement déclaré résolu avant sa fin');
  requireValue(!facts.collectorDestroyed || !facts.collectorClosed, 'collecteur détruit encore fermé');
  requireValue(facts.canalsCovered <= facts.canalsIntact, 'couverture portée par un canal détruit');
  requireValue(facts.canalsIntact === 2 && facts.canalsPolluted === 0 || facts.homesHabitable === 0, 'habitats habitables sans canaux utilisables');
  requireValue(facts.villageHabitable === (facts.homesHabitable === 2 && !facts.collectorClosed), 'habitabilité du village contraire aux canaux et à l’eau');
  requireValue(facts.waterRestored === (facts.waterDispositionRecorded && !facts.collectorClosed && facts.canalsIntact === 2), 'remise en eau contraire à l’opération');
  requireValue(!facts.orisonRecordCopied || facts.orisonRecordInspected, 'registre copié sans examen');
  requireValue(!facts.sampleCollected || facts.sampleStarted, 'prélèvement collecté sans démarrage');
  requireValue(!(facts.sampleCollected && facts.sampleLost), 'prélèvement à la fois conservé et perdu');
  requireValue(facts.sampleResolved === (facts.sampleCollected || facts.sampleLost), 'sort du prélèvement incohérent');
  requireValue(facts.pt02Acquired === (facts.sampleCollected && facts.copiedMarks === 3 && facts.orisonRecordCopied), 'PT02 sans matière, marquages et provenance');
  requireValue(!facts.privateReady || facts.privateTriggered, 'forces privées présentes avant alerte');
  requireValue(!facts.privateNeutralized || facts.privateReady, 'adversaire privé neutralisé avant arrivée');
  requireValue(facts.manifestRead === (facts.tanksInspected === 3 && facts.orisonRecordInspected), 'relevé contraire aux inspections');
  requireValue(!facts.reportTransmitted || facts.manifestRead && facts.operationsResolved && facts.sampleResolved && facts.waterDispositionRecorded && facts.privateNeutralized === 3, 'rapport avant accomplissement des opérations');
  if (finished) requireValue(facts.reportTransmitted && facts.plan !== 'unselected' && facts.flowResolved, 'rapport final incomplet');
}

export function chemicalDossierFromGame(game) {
  const fields = Object.keys(createChemicalDossier()).filter(key => key !== 'roster');
  return { ...Object.fromEntries(fields.map(key => [key, game.campaign[key]])), roster: chemicalReceiptRoster(game) };
}

function validateScene(scene, initial, facts, settings, options) {
  const { elapsed, context, planetId, privateForces, initialForces, receipt = false, player = null, steps = 10_000_000 } = options;
  // updateGame caps every effective frame at 50 ms, including a resumed frame.
  const frame = .05 + 1e-6;
  shape(scene, initial, 'scène');
  for (const name of ['tanks', 'canals', 'homes']) {
    requireValue(Array.isArray(scene[name]) && scene[name].length === initial[name].length, `${name} incomplet`);
    scene[name].forEach((part, index) => shape(part, initial[name][index], `${name}[${index}]`));
  }
  for (const name of ['collector', 'leak', 'sampler', 'record', 'orders', 'water', 'report', 'spill', 'alert']) shape(scene[name], initial[name], name);
  const stamp = (value, label) => { if (value !== null) number(value, 0, elapsed, label); };
  const chronology = (value, flag, label) => { stamp(value, label); requireValue((value !== null) === flag, `${label} absent ou inventé`); };
  const dates = part => { for (const key of Object.keys(part).filter(key => key.endsWith('At'))) stamp(part[key], `${part.id || 'alerte'}.${key}`); };
  const solid = (part, original) => {
    fixed(part, original, ['id', 'x', 'y', 'w', 'h', 'maxHp'], 'corps');
    number(part.hp, 0, part.maxHp, `${part.id} intégrité`); number(part.flash, 0, .15, `${part.id} impact`);
    boolean(part.destroyed, `${part.id} destruction`);
    requireValue(part.destroyed === (part.hp === 0), `${part.id} destruction sans rupture`);
    chronology(part.destroyedAt, part.destroyed, `${part.id} date de rupture`); dates(part);
  };
  const work = (part, duration, x, anchored = false, radius = settings.interactionRadius) => {
    boolean(part.working, `${part.id} travail`); number(part.progress, 0, 1, `${part.id} progression`); dates(part);
    requireValue(!part.working || part.startedAt !== null && part.progress < 1 && part.completedAt === null, `${part.id} travail impossible`);
    requireValue(part.progress === 0 || part.startedAt !== null, `${part.id} progression sans début`);
    if (part.startedAt !== null) requireValue(part.progress * duration <= elapsed - part.startedAt + frame, `${part.id} progression trop rapide`);
    if (part.completedAt !== null) requireValue(part.startedAt !== null && part.progress === 1 && !part.working && part.completedAt + frame >= part.startedAt + duration, `${part.id} durée non accomplie`);
    requireValue(part.progress !== 1 || part.completedAt !== null, `${part.id} travail achevé sans date`);
    if (player && part.working && part.progress > 0) {
      requireValue(Math.abs(player.x - x) <= radius + 1e-6, `${part.id} travail hors portée`);
      if (anchored) requireValue(player.braced && !player.move && Math.abs(player.speed) < 3 && player.feet.every(foot => foot.contact), `${part.id} travail sans appuis stables`);
    }
  };
  const station = (name, duration, anchored = false) => {
    const part = scene[name]; fixed(part, initial[name], ['id', 'x', 'y', 'w', 'h'], name);
    work(part, duration, part.x, anchored);
  };

  scene.tanks.forEach((tank, index) => {
    solid(tank, initial.tanks[index]); fixed(tank, initial.tanks[index], ['role', 'initialVolume'], 'identité de cuve');
    number(tank.volume, 0, settings.tankVolume, 'volume de cuve');
    for (const key of ['inspected', 'identified', 'secured', 'demolished']) boolean(tank[key], `cuve ${key}`);
    requireValue(['none', 'inspect', 'secure', 'demolish'].includes(tank.work), 'opération de cuve');
    work(tank, tank.work === 'inspect' ? settings.inspectTime : tank.work === 'secure' ? settings.secureTime : settings.demolishTime, tank.x, tank.work !== 'inspect');
    for (const [flag, date] of [['inspected', 'inspectedAt'], ['identified', 'identifiedAt'], ['secured', 'securedAt'], ['demolished', 'demolishedAt']]) chronology(tank[date], tank[flag], `cuve ${date}`);
    requireValue(!tank.inspected || tank.inspectedAt + frame >= settings.inspectTime, 'inspection de cuve avant sa durée minimale');
    if (tank.work === 'inspect') requireValue(tank.inspected === (tank.progress === 1 && tank.completedAt === tank.inspectedAt), 'inspection contraire au travail de cuve');
    if (['secure', 'demolish'].includes(tank.work)) requireValue(tank.inspected && facts.plan === tank.work, 'travail de cuve sans inspection ou ordre');
    requireValue(!tank.identified || tank.inspected && tank.identifiedAt === tank.inspectedAt, 'marquage sans inspection matérielle');
    requireValue(!tank.inspected || tank.identified || tank.destroyed, 'marquage absent d’une cuve intacte relevée');
    requireValue(!tank.identified || !tank.destroyed || tank.identifiedAt <= tank.destroyedAt, 'marquage recréé après rupture');
    requireValue(!tank.secured || facts.plan === 'secure' && tank.inspected && tank.securedAt + frame >= tank.inspectedAt + settings.secureTime, 'cuve sécurisée avant ordre et opération');
    requireValue(!tank.secured || tank.work === 'secure' && tank.progress === 1 && tank.completedAt === tank.securedAt, 'mise en sécurité contraire au travail de cuve');
    if (tank.work === 'demolish' && tank.completedAt !== null) requireValue(tank.destroyed && tank.completedAt === tank.destroyedAt, 'démolition achevée sans rupture à sa date');
    requireValue(!tank.secured || !tank.destroyed || tank.securedAt <= tank.destroyedAt, 'cuve sécurisée après destruction');
    requireValue(tank.demolished === tank.destroyed && tank.demolishedAt === tank.destroyedAt, 'rupture de cuve contradictoire');
    requireValue(!tank.destroyed || tank.volume === 0, 'volume conservé dans une cuve rompue');
    if (index !== settings.sourceTankIndex && !tank.destroyed) requireValue(tank.volume === settings.tankVolume, 'volume disparu d’une cuve sans fuite');
    if (tank.working && tank.work !== 'inspect') requireValue(facts.plan === tank.work && tank.inspected && !tank.destroyed, 'opération de cuve sans choix ou sur ruines');
    if (tank.working && tank.work === 'inspect') requireValue(!tank.inspected, 'inspection répétée');
    requireValue(tank.work !== 'none' || !tank.working && tank.progress === 0 && tank.startedAt === null && tank.completedAt === null, 'travail sans opération');
  });

  const source = scene.tanks[settings.sourceTankIndex], collector = scene.collector, sampler = scene.sampler, record = scene.record;
  solid(collector, initial.collector); fixed(collector, initial.collector, ['controlX'], 'collecteur');
  boolean(collector.closed, 'fermeture du collecteur');
  work(collector, context.routeApproach === 'guided' ? settings.guidedCollectorTime : settings.collectorTime, collector.controlX, true);
  requireValue(!collector.closed || !collector.destroyed && collector.closedAt !== null && collector.progress === 1, 'fermeture sans collecteur et manœuvre');
  requireValue(collector.closedAt === null || collector.completedAt === collector.closedAt, 'date de fermeture contraire au travail');
  requireValue(!collector.working || !collector.destroyed && !collector.closed && !scene.water.resolved, 'manœuvre de collecteur impossible');
  station('leak', settings.containmentTime, true); fixed(scene.leak, initial.leak, ['sourceId'], 'source de fuite');
  boolean(scene.leak.contained, 'confinement'); chronology(scene.leak.containedAt, scene.leak.contained, 'date de confinement');
  requireValue(!scene.leak.contained || scene.leak.progress === 1 && scene.leak.completedAt === scene.leak.containedAt, 'confinement sans travail accompli');
  requireValue(!scene.leak.contained || !source.destroyed || scene.leak.containedAt <= source.destroyedAt, 'confinement inventé après perte de source');

  solid(record, initial.record); work(record, settings.recordTime, record.x);
  for (const key of ['inspected', 'copied']) boolean(record[key], `registre ${key}`);
  chronology(record.copiedAt, record.copied, 'date de copie du registre');
  requireValue(record.inspected === (record.progress === 1 && record.completedAt !== null), 'registre relevé sans opération');
  requireValue(!record.copied || record.inspected && record.copiedAt === record.completedAt, 'registre copié sans examen');
  requireValue(!record.inspected || record.copied || record.destroyed, 'copie absente d’un registre intact inspecté');
  requireValue(!record.copied || !record.destroyed || record.copiedAt <= record.destroyedAt, 'registre copié après destruction');
  solid(sampler, initial.sampler); fixed(sampler, initial.sampler, ['sourceId'], 'source du prélèvement');
  work(sampler, settings.sampleTime, sampler.x, false, settings.sampleRadius);
  for (const key of ['started', 'collected', 'lost']) boolean(sampler[key], `prélèvement ${key}`);
  chronology(sampler.firstStartedAt, sampler.started, 'premier lancement'); chronology(sampler.collectedAt, sampler.collected, 'date de collecte'); chronology(sampler.lostAt, sampler.lost, 'date de perte');
  requireValue(!(sampler.collected && sampler.lost) && (!sampler.collected || sampler.started), 'prélèvement à la fois perdu et acquis');
  requireValue(sampler.volumeCollected === (sampler.collected ? settings.sampleVolume : 0), 'volume prélevé sans collecte');
  requireValue(!sampler.started || facts.manifestRead && scene.tanks.every(tank => tank.inspectedAt <= sampler.firstStartedAt) && record.completedAt <= sampler.firstStartedAt, 'prélèvement lancé avant les relevés');
  requireValue(sampler.startedAt === null || sampler.firstStartedAt !== null && sampler.startedAt >= sampler.firstStartedAt, 'essai de prélèvement antérieur au premier lancement');
  requireValue(!sampler.collected || sampler.progress === 1 && sampler.collectedAt === sampler.completedAt && sampler.collectedAt + frame >= sampler.firstStartedAt + settings.sampleTime, 'collecte avant vingt secondes effectives');
  requireValue(!sampler.collected || !source.destroyed || sampler.collectedAt <= source.destroyedAt, 'collecte après perte de la source');
  requireValue(!sampler.collected || !sampler.destroyed || sampler.collectedAt <= sampler.destroyedAt, 'collecte après perte de l’appareil');
  requireValue(!sampler.lost || !sampler.working && sampler.progress === 0 && (source.destroyed && source.destroyedAt <= sampler.lostAt || sampler.destroyed && sampler.destroyedAt <= sampler.lostAt || source.volume < settings.sampleVolume), 'perte sans cause matérielle');
  if (sampler.lost) {
    const leakedByLoss = Math.min(sampler.lostAt, scene.leak.containedAt ?? sampler.lostAt) * settings.leakRate;
    requireValue(source.destroyedAt !== null && source.destroyedAt <= sampler.lostAt || sampler.destroyedAt !== null && sampler.destroyedAt <= sampler.lostAt || leakedByLoss + frame * settings.leakRate >= source.initialVolume - settings.sampleVolume, 'perte du prélèvement antérieure à sa cause matérielle');
  }
  requireValue(sampler.collected || !source.destroyed && !sampler.destroyed || sampler.lost, 'source perdue sans perte du prélèvement');
  requireValue(!sampler.working || sampler.started && !sampler.collected && !sampler.lost && !sampler.destroyed && !source.destroyed, 'préleveur actif après son résultat');

  scene.canals.forEach((canal, index) => {
    solid(canal, initial.canals[index]); fixed(canal, initial.canals[index], ['controlX'], 'commande de canal');
    boolean(canal.covered, 'couverture de canal'); number(canal.contamination, 0, 300, 'exposition du canal');
    number(canal.lastStep, -1, steps, 'dernier appui sur le canal', true); work(canal, settings.coverTime, canal.controlX, true);
    chronology(canal.coveredAt, canal.covered, 'date de couverture');
    requireValue(!canal.covered || canal.progress === 1 && canal.completedAt === canal.coveredAt, 'couverture sans travail accompli');
    requireValue(!canal.covered || !canal.destroyed || canal.coveredAt <= canal.destroyedAt, 'couverture créée sur canal détruit');
    requireValue(!canal.working || !canal.covered && !canal.destroyed, 'travail de canal impossible');
  });
  scene.homes.forEach((home, index) => {
    solid(home, initial.homes[index]); boolean(home.habitable, 'habitabilité d’habitat');
    requireValue(home.habitable === (!home.destroyed && scene.canals.every(canal => !canal.destroyed && canal.contamination < settings.contaminationLimit)), 'habitat contraire à ses canaux');
  });
  fixed(scene.orders, initial.orders, Object.keys(initial.orders), 'poste des ordres');
  station('water', settings.waterTime, true); station('report', settings.reportTime);
  for (const key of ['resolved', 'restored']) boolean(scene.water[key], `eau ${key}`);
  chronology(scene.water.resolvedAt, scene.water.resolved, 'date de remise en eau');
  requireValue(scene.water.resolved === (scene.water.progress === 1 && scene.water.completedAt !== null), 'circuit d’eau sans opération');
  requireValue(!scene.water.resolved || scene.water.resolvedAt === scene.water.completedAt && !collector.closed && facts.operationsResolved, 'remise en eau contraire au chantier');
  const operationsBy = time => scene.tanks.every(tank => facts.plan === 'demolish'
    ? tank.destroyedAt !== null && tank.destroyedAt <= time + frame
    : tank.securedAt !== null && tank.securedAt <= time + frame || tank.destroyedAt !== null && tank.destroyedAt <= time + frame);
  if (scene.water.resolved) requireValue(operationsBy(scene.water.startedAt), 'remise en eau antérieure aux opérations de cuves');
  if (scene.water.working) requireValue(facts.operationsResolved && facts.flowResolved, 'travail de remise en eau avant résolution du chantier');
  requireValue(scene.water.restored === (scene.water.resolved && !collector.closed && scene.canals.every(canal => !canal.destroyed)), 'remise en eau contraire aux canaux');
  boolean(scene.report.transmitted, 'transmission'); chronology(scene.report.transmittedAt, scene.report.transmitted, 'date de transmission');
  requireValue(scene.report.transmitted === (scene.report.progress === 1 && scene.report.completedAt !== null), 'transmission sans travail');
  requireValue(!scene.report.transmitted || scene.report.transmittedAt === scene.report.completedAt && scene.water.resolvedAt <= scene.report.transmittedAt, 'rapport antérieur au circuit d’eau');
  if (scene.report.transmitted) {
    const began = scene.report.startedAt + frame;
    requireValue(scene.tanks.every(tank => tank.inspectedAt !== null && tank.inspectedAt <= began) && record.completedAt !== null && record.completedAt <= began &&
      (sampler.collectedAt !== null && sampler.collectedAt <= began || sampler.lostAt !== null && sampler.lostAt <= began) &&
      scene.water.resolvedAt !== null && scene.water.resolvedAt <= began && scene.alert.readyAt !== null && scene.alert.readyAt <= began && operationsBy(began), 'rapport antérieur aux relevés, au prélèvement ou aux opérations');
  }
  if (scene.report.working) requireValue(facts.manifestRead && facts.operationsResolved && facts.sampleResolved && facts.waterDispositionRecorded && facts.privateNeutralized === 3 && facts.flowResolved, 'transmission avant ses préconditions matérielles');

  number(scene.spill.pendingMass, 0, settings.leakRate, 'fuite en attente'); number(scene.spill.emissionClock, 0, 1, 'horloge de fuite');
  number(scene.spill.totalReleased, 0, 300, 'masse libérée'); number(scene.spill.nextPlumeId, 0, 5000, 'identifiant de flux', true);
  requireValue(close(scene.spill.pendingMass, scene.spill.emissionClock * settings.leakRate), 'fuite contraire à son débit');
  requireValue(Array.isArray(scene.plumes) && scene.plumes.length === scene.spill.nextPlumeId, 'registre de flux incomplet');
  scene.plumes.forEach((plume, index) => {
    keys(plume, ['id', 'sourceId', 'x', 'y', 'w', 'h', 'mass', 'phase', 'passedCanals', 'deposits', 'releasedAt', 'arrivedAt'], 'flux : champs');
    const origin = scene.tanks.find(tank => tank.id === plume.sourceId);
    requireValue(plume.id === `chemical-plume-${index + 1}` && origin, 'flux sans source ou identifiant stable');
    number(plume.mass, Number.MIN_VALUE, settings.tankVolume, 'masse de flux');
    number(plume.x, origin.x, settings.villageX, 'position de flux'); number(plume.y, -1000, 2000, 'hauteur de flux');
    requireValue(plume.w === 32 && plume.h === 10 && close(plume.y, terrainAt(plume.x, planetId) - 5), 'géométrie de flux');
    requireValue(['flowing', 'retained', 'delivered'].includes(plume.phase), 'phase de flux');
    number(plume.releasedAt, 0, elapsed, 'date de déversement'); stamp(plume.arrivedAt, 'date d’arrivée de flux');
    if (index) requireValue(plume.releasedAt >= scene.plumes[index - 1].releasedAt, 'flux hors chronologie');
    requireValue(!origin.destroyed || plume.releasedAt <= origin.destroyedAt, 'volume créé après destruction de source');
    if (origin !== source) requireValue(origin.destroyed && plume.releasedAt === origin.destroyedAt, 'flux d’une cuve sans fuite ni rupture');
    if (plume.phase === 'flowing') requireValue(plume.arrivedAt === null && close(plume.x, origin.x + settings.flowSpeed * (elapsed - plume.releasedAt)) && plume.x < settings.villageX, 'trajet de flux contraire à sa durée');
    else {
      const target = plume.phase === 'retained' ? collector.x : settings.villageX;
      const expectedArrival = plume.releasedAt + (target - origin.x) / settings.flowSpeed;
      requireValue(plume.x === target && plume.arrivedAt !== null && plume.arrivedAt >= plume.releasedAt && Math.abs(plume.arrivedAt - expectedArrival) <= frame, 'arrivée de flux contraire à son trajet et sa durée');
      if (plume.phase === 'retained') requireValue(collector.closedAt !== null && collector.closedAt <= plume.arrivedAt && (collector.destroyedAt === null || collector.destroyedAt >= plume.arrivedAt) && (scene.water.resolvedAt === null || scene.water.resolvedAt >= plume.arrivedAt), 'rétention sans collecteur fermé à l’arrivée');
    }
    if (plume.phase !== 'retained' && plume.x >= collector.x) {
      const crossing = plume.releasedAt + (collector.x - origin.x) / settings.flowSpeed;
      const openedAt = Math.min(collector.destroyedAt ?? Infinity, scene.water.resolvedAt ?? Infinity);
      requireValue(!(collector.closedAt !== null && collector.closedAt <= crossing && openedAt > crossing + frame), 'flux ayant traversé un collecteur fermé');
    }
    number(plume.passedCanals, 0, 2, 'canaux traversés', true);
    requireValue(plume.passedCanals === settings.canalXs.filter(x => plume.x >= x).length, 'traversée contraire à la position');
    requireValue(Array.isArray(plume.deposits) && plume.deposits.length === 2, 'expositions de canal absentes');
    plume.deposits.forEach((mass, canalIndex) => requireValue(close(mass, canalIndex < plume.passedCanals ? plume.mass : 0), 'exposition contraire au passage du flux'));
  });
  requireValue(close(scene.spill.totalReleased, scene.spill.pendingMass + sum(scene.plumes, 'mass')), 'déversement sans masse physique');
  scene.tanks.forEach(tank => {
    const accounted = tank.volume + sum(scene.plumes.filter(plume => plume.sourceId === tank.id), 'mass') + (tank === source ? scene.spill.pendingMass + sampler.volumeCollected : 0);
    requireValue(close(accounted, tank.initialVolume), `masse non conservée pour ${tank.id}`);
  });
  // A balanced inventory is insufficient: before rupture, the source can only
  // lose material at its physical leak rate. Group same-frame releases so the
  // final leak flush and a rupture can coexist without depending on array order.
  let leaked = 0;
  const normalReleases = new Map();
  for (const plume of scene.plumes.filter(plume => plume.sourceId === source.id && plume.releasedAt !== source.destroyedAt)) {
    requireValue(scene.leak.containedAt === null || plume.releasedAt <= scene.leak.containedAt, 'fuite émise après confinement');
    normalReleases.set(plume.releasedAt, (normalReleases.get(plume.releasedAt) || 0) + plume.mass);
  }
  const expectedLeak = time => Math.min(source.initialVolume - (sampler.collectedAt !== null && sampler.collectedAt <= time ? sampler.volumeCollected : 0),
    settings.leakRate * Math.min(time, scene.leak.containedAt ?? time));
  for (const [time, mass] of normalReleases) {
    leaked += mass;
    requireValue(Math.abs(leaked - expectedLeak(time)) <= frame * settings.leakRate, 'débit de fuite contraire à son horloge');
  }
  if (!source.destroyed) requireValue(Math.abs(leaked + scene.spill.pendingMass - expectedLeak(elapsed)) <= frame * settings.leakRate, 'volume de fuite contraire au débit et au confinement');
  scene.canals.forEach((canal, index) => requireValue(close(canal.contamination, scene.plumes.reduce((total, plume) => total + plume.deposits[index], 0)), 'canal déclaré propre malgré les dépôts'));
  if (scene.water.resolved && !facts.flowResolved) requireValue(scene.spill.pendingMass === 0 && scene.plumes.filter(plume => plume.phase === 'flowing').every(plume => plume.releasedAt >= scene.water.resolvedAt), 'flux ancien ignoré par la remise en eau');
  if (scene.report.transmitted && !facts.flowResolved) requireValue(scene.plumes.filter(plume => plume.phase === 'flowing').every(plume => plume.releasedAt >= scene.report.transmittedAt), 'rapport ayant ignoré un écoulement antérieur');

  const alert = scene.alert;
  for (const key of ['triggered', 'ready']) boolean(alert[key], `alerte ${key}`);
  chronology(alert.triggeredAt, alert.triggered, 'début d’alerte'); chronology(alert.readyAt, alert.ready, 'arrivée des forces privées');
  requireValue(['none', 'sample', 'demolition', 'source-loss'].includes(alert.reason), 'cause d’alerte');
  number(alert.elapsed, 0, settings.privateDelay, 'délai privé');
  requireValue(alert.triggered === (alert.reason !== 'none'), 'alerte sans cause');
  requireValue(!alert.triggered || close(alert.elapsed, Math.min(settings.privateDelay, elapsed - alert.triggeredAt)), 'horloge des forces privées contradictoire');
  requireValue(alert.ready === (alert.triggered && alert.elapsed >= settings.privateDelay - 1e-9), 'forces privées arrivées avant leur délai');
  requireValue(!alert.ready || Math.abs(alert.readyAt - alert.triggeredAt - settings.privateDelay) <= frame, 'arrivée privée contraire au délai');
  if (alert.reason === 'sample') requireValue(sampler.firstStartedAt === alert.triggeredAt, 'alerte de prélèvement sans lancement');
  if (alert.reason === 'source-loss') requireValue(sampler.lost && sampler.lostAt === alert.triggeredAt, 'alerte de perte sans perte');
  if (alert.reason === 'demolition') requireValue(scene.tanks.some(tank => tank.destroyedAt === alert.triggeredAt), 'alerte de rupture sans cuve rompue');
  const triggerTimes = [sampler.firstStartedAt, sampler.lostAt, ...scene.tanks.map(tank => tank.destroyedAt)].filter(time => time !== null);
  if (triggerTimes.length) requireValue(alert.triggeredAt === Math.min(...triggerTimes), 'alerte n’ayant pas retenu son premier événement');
  requireValue(!sampler.started && !sampler.lost && !scene.tanks.some(tank => tank.destroyed) || alert.triggered, 'événement matériel sans arrivée privée');
  requireValue(Array.isArray(privateForces) && privateForces.length === 3 && initialForces.length === 3, 'registre des forces privées incomplet');
  if (receipt) requireValue(Object.values(DIFFICULTIES).some(level => privateForces.every((unit, index) => unit.maxHp === Math.round(ENEMY_TYPES[initialForces[index].type].hp * level.enemyHealth))), 'capacités privées incompatibles avec une même difficulté');
  privateForces.forEach((unit, index) => {
    if (receipt) keys(unit, ['id', 'type', 'hp', 'maxHp', 'dead'], 'unité privée : champs');
    fixed(unit, initialForces[index], ['id', 'type'], 'identité privée');
    if (!receipt) requireValue(unit.maxHp === initialForces[index].maxHp, 'capacité privée modifiée');
    number(unit.hp, -1000, unit.maxHp, 'intégrité privée'); boolean(unit.dead, 'perte privée');
    requireValue(unit.dead === (unit.hp <= 0), 'perte privée sans dégâts');
    if (!alert.ready) {
      requireValue(!unit.dead && unit.hp === unit.maxHp, 'unité privée touchée avant son arrivée');
      if (!receipt) fixed(unit, initialForces[index], ['x', 'y', 'active', 'phase', 'timer'], 'unité privée prématurée');
    }
  });

  const derived = { tanksTotal: 3, tanksInspected: scene.tanks.filter(tank => tank.inspected).length,
    copiedMarks: scene.tanks.filter(tank => tank.identified).length, tanksDestroyed: scene.tanks.filter(tank => tank.destroyed).length,
    tanksSecured: scene.tanks.filter(tank => tank.secured && !tank.destroyed).length,
    leakContained: scene.leak.contained, leakStopped: scene.leak.contained || source.destroyed || source.volume <= 0,
    sourceVolume: source.volume, collectorClosed: collector.closed, collectorDestroyed: collector.destroyed,
    spillReleased: scene.spill.totalReleased, spillRetained: sum(scene.plumes.filter(plume => plume.phase === 'retained'), 'mass'),
    spillDelivered: sum(scene.plumes.filter(plume => plume.phase === 'delivered'), 'mass'),
    spillInTransit: scene.spill.pendingMass + sum(scene.plumes.filter(plume => plume.phase === 'flowing'), 'mass'),
    canalsIntact: scene.canals.filter(canal => !canal.destroyed).length, canalsCovered: scene.canals.filter(canal => canal.covered && !canal.destroyed).length,
    canalsPolluted: scene.canals.filter(canal => canal.contamination >= settings.contaminationLimit).length,
    waterDispositionRecorded: scene.water.resolved, waterRestored: scene.water.restored,
    homesHabitable: scene.homes.filter(home => home.habitable).length, villageHabitable: scene.homes.every(home => home.habitable) && !collector.closed,
    orisonRecordInspected: record.inspected, orisonRecordCopied: record.copied, orisonRecordLost: record.destroyed,
    sampleStarted: sampler.started, sampleCollected: sampler.collected, sampleLost: sampler.lost, sampleResolved: sampler.collected || sampler.lost,
    privateTriggered: alert.triggered, privateReady: alert.ready, privateNeutralized: privateForces.filter(unit => unit.dead).length,
    operationsResolved: facts.plan !== 'unselected' && scene.tanks.every(tank => facts.plan === 'demolish' ? tank.destroyed : tank.secured || tank.destroyed),
    reportTransmitted: scene.report.transmitted, manifestRead: scene.tanks.every(tank => tank.inspected) && record.inspected };
  derived.flowResolved = derived.leakStopped && derived.spillInTransit < 1e-7;
  derived.pt02Acquired = derived.sampleCollected && derived.copiedMarks === 3 && derived.orisonRecordCopied;
  for (const [key, expected] of Object.entries(derived)) requireValue(typeof expected === 'number' ? close(facts[key], expected) : facts[key] === expected, `bilan contraire aux objets : ${key}`);
}

export function validateChemicalMission(value, template) {
  const facts = value.campaign;
  requireValue(object(facts) && facts.missionId === 'MI10' && object(value.chemical), 'scène absente');
  validateContext(facts.context); validateChemicalFacts(facts, value.status === 'won');
  requireValue(facts.plan === (value.decision.choice === null ? 'unselected' : value.decision.choice === 'obey' ? 'demolish' : 'secure'), 'conduite contraire au choix');
  requireValue(!value.decision.active && !value.decision.resolved || facts.manifestRead && facts.leakStopped, 'choix avant relevés et arrêt de fuite');
  validateScene(value.chemical, template.chemical, facts, value.mission.chemical, {
    elapsed: value.elapsed, context: facts.context, planetId: value.planetId, privateForces: value.enemies,
    initialForces: template.enemies, player: value.player, steps: value.stats.steps });
  const phase = value.status === 'won' ? 'complete' : facts.reportTransmitted ? 'extraction' : value.decision.resolved ? 'operations' : value.decision.active ? 'decision' : 'survey';
  requireValue(facts.phase === phase, 'phase contraire aux actes');
  requireValue(value.evidence.collected === facts.pt02Acquired && value.evidence.scanProgress === Number(facts.pt02Acquired) && !value.evidence.scanning, 'preuve contraire aux pièces matérielles');
  fixed(value.evidence, template.evidence, Object.keys(template.evidence).filter(key => !['collected', 'scanProgress', 'scanning'].includes(key)), 'prélèvement générique');
  requireValue(value.stats.evidence === Number(facts.pt02Acquired), 'décompte PT02');
  requireValue(value.stats.collateral === 0, 'aucun effectif humain inventé dans le village');
  requireValue(value.stats.kills === facts.privateNeutralized, 'décompte des forces privées');
  requireValue(value.stats.ordersObeyed === Number(value.decision.choice === 'obey') && value.stats.ordersDefied === Number(value.decision.choice === 'defy'), 'décompte du choix');
  const expected = [
    ['survey', facts.tanksInspected + Number(facts.orisonRecordInspected), 4, facts.manifestRead],
    ['leak', Number(facts.leakStopped), 1, facts.leakStopped],
    ['order', Number(value.decision.resolved), 1, value.decision.resolved],
    ['sample', Number(facts.sampleResolved), 1, facts.sampleResolved],
    ['tanks', facts.tanksDestroyed + facts.tanksSecured, 3, facts.operationsResolved],
    ['private', facts.privateNeutralized, 3, facts.privateNeutralized === 3],
    ['water', Number(facts.flowResolved) + Number(facts.waterDispositionRecorded), 2, facts.flowResolved && facts.waterDispositionRecorded],
    ['report', Number(facts.reportTransmitted), 1, facts.reportTransmitted],
    ['extract', Number(value.status === 'won'), 1, value.status === 'won'],
  ];
  requireValue(value.objectives.length === expected.length, 'liste des objectifs chimiques');
  expected.forEach(([id, current, target, complete], index) => fixed(value.objectives[index], { id, current, target, complete }, ['id', 'current', 'target', 'complete'], 'objectif contraire aux actes'));
  requireValue(value.extraction.active === expected.slice(0, -1).every(([, , , complete]) => complete), 'sortie avant accomplissement');
  fixed(value.extraction, template.extraction, Object.keys(template.extraction).filter(key => key !== 'active'), 'point de sortie');
  if (value.status === 'won') requireValue(value.player.hull > 0 && value.objectives.every(goal => goal.complete) && Math.abs(value.player.x - value.extraction.x) < value.extraction.radius, 'victoire sans extraction');
  if (value.status === 'lost') requireValue(value.player.hull === 0, 'défaite sans perte terminale du marcheur');
}

export function validateChemicalReceipt(receipt, context) {
  validateContext(context); validateChemicalFacts(receipt, true);
  requireValue(receipt.plan === (receipt.choice === 'obey' ? 'demolish' : 'secure'), 'conduite du rapport contraire au choix');
  const template = createGame({ missionId: 'MI10', walkerId: receipt.walkerId, campaignContext: context });
  keys(receipt.roster, [...Object.keys(template.chemical), 'privateForces'], 'registre individuel du champ chimique');
  const scene = Object.fromEntries(Object.keys(template.chemical).map(key => [key, receipt.roster[key]]));
  validateScene(scene, template.chemical, receipt, template.mission.chemical, {
    elapsed: receipt.elapsed, context, planetId: template.planetId, privateForces: receipt.roster.privateForces,
    initialForces: template.enemies, receipt: true });
  requireValue(receipt.collateral === 0 && receipt.kills === receipt.privateNeutralized && receipt.hull > 0, 'bilan contraire aux acteurs');
}

/** An official checkpoint may advance the same sortie, never erase its material history. */
export function validateChemicalSortie(previous, current) {
  requireValue(previous?.missionId === 'MI10' && current.missionId === 'MI10', 'checkpoint hors sortie officielle');
  requireValue(current.walkerId === previous.walkerId && current.seed === previous.seed && current.difficultyId === previous.difficultyId, 'changement de sortie');
  requireValue(current.elapsed >= previous.elapsed, 'recul de sortie');
  equal(current.campaign.context, previous.campaign.context, 'héritage modifié pendant la sortie');
  requireValue(previous.status === 'playing' || JSON.stringify(current) === JSON.stringify(previous), 'sortie perdue à recommencer explicitement');
  requireValue(!previous.decision.resolved || current.decision.resolved && current.decision.choice === previous.decision.choice, 'choix acquis annulé');
  for (const key of ['leakContained', 'leakStopped', 'collectorDestroyed', 'waterDispositionRecorded', 'orisonRecordInspected', 'orisonRecordCopied', 'orisonRecordLost', 'sampleStarted', 'sampleCollected', 'sampleLost', 'sampleResolved', 'pt02Acquired', 'privateTriggered', 'privateReady', 'operationsResolved', 'reportTransmitted', 'manifestRead']) requireValue(!previous.campaign[key] || current.campaign[key], `fait acquis annulé : ${key}`);
  const old = previous.chemical, now = current.chemical;
  const preserveDates = (before, after) => {
    for (const key of Object.keys(before).filter(key => key.endsWith('At') && !['startedAt', 'completedAt'].includes(key))) if (before[key] !== null) requireValue(after[key] === before[key], `date acquise réécrite : ${before.id || 'alerte'}.${key}`);
  };
  for (const group of ['tanks', 'canals', 'homes']) old[group].forEach((part, index) => {
    const after = now[group][index]; requireValue(after.hp <= part.hp, `intégrité restituée : ${part.id}`); preserveDates(part, after);
    if (group === 'tanks') {
      requireValue(after.volume <= part.volume + 1e-6, 'volume restitué dans une cuve');
      for (const key of ['inspected', 'identified', 'secured', 'demolished']) requireValue(!part[key] || after[key], `fait de cuve annulé : ${key}`);
    }
    if (group === 'canals') requireValue(after.contamination + 1e-6 >= part.contamination && after.lastStep >= part.lastStep && (!part.covered || after.covered), 'canal nettoyé ou trace d’appui reculée');
  });
  for (const name of ['collector', 'sampler', 'record']) requireValue(now[name].hp <= old[name].hp, `intégrité restituée : ${name}`);
  for (const name of ['collector', 'leak', 'sampler', 'record', 'water', 'report', 'alert']) preserveDates(old[name], now[name]);
  requireValue(now.spill.totalReleased + 1e-6 >= old.spill.totalReleased && now.spill.nextPlumeId >= old.spill.nextPlumeId && now.plumes.length >= old.plumes.length, 'déversement effacé');
  old.plumes.forEach((plume, index) => {
    const after = now.plumes[index]; fixed(after, plume, ['id', 'sourceId', 'mass', 'releasedAt'], 'flux acquis modifié');
    requireValue(after.x >= plume.x && after.passedCanals >= plume.passedCanals && after.deposits.every((mass, i) => mass >= plume.deposits[i]), 'flux ou exposition reculé');
    if (plume.phase !== 'flowing') equal(after, plume, 'volume retenu ou arrivé réécrit');
  });
  previous.enemies.forEach((unit, index) => requireValue(current.enemies[index].hp <= unit.hp, 'force privée ressuscitée ou réparée'));
}
