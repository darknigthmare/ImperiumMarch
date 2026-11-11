/** MI09 save and receipt validation. No mutation, game advancement or persistence. */
import { DIFFICULTIES, ENEMY_TYPES } from './content.mjs';
import { createGame, livingRouteReceiptRoster, terrainAt } from './simulation.mjs';

const FLAGS = ['localsHeard', 'approachPrepared', 'routeInspected', 'hamletsRecorded', 'migrationObserved', 'lightsOff',
  'gateOperated', 'migrationResolved', 'passagePreserved', 'cropsFertilized', 'harvestFragile', 'snipersTriggered',
  'logisticsReleased', 'logisticsArrived', 'logisticsDestroyed', 'reportTransmitted', 'manifestRead'];
const COUNTS = ['migratorsTotal', 'migratorsArrived', 'migratorsDisplaced', 'migratorsLost', 'columnsIntact',
  'homesHabitable', 'pollinatorsPresent', 'snipersNeutralized'];
const CONTEXT_KEYS = ['departureRecorded', 'departureChoice', 'departureArrived', 'departureLost'];
const TERMINAL = ['arrived', 'displaced', 'lost'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function requireValue(ok, message) { if (!ok) throw new Error(`Sauvegarde invalide : route de Thyr — ${message}`); }
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

export function createLivingRouteDossier() {
  return { route: 'unselected', approach: 'unprepared', ...Object.fromEntries(FLAGS.map(key => [key, false])),
    ...Object.fromEntries(COUNTS.map(key => [key, 0])), logisticsIntegrity: 0, roster: null };
}

export function livingRouteContextFor(campaign) {
  const report = campaign.completed.MI08;
  return { departureRecorded: Boolean(report), departureChoice: report?.choice || 'none',
    departureArrived: report?.peopleArrived || 0, departureLost: report?.peopleLost || 0 };
}

function validateContext(context) {
  keys(context, CONTEXT_KEYS, 'héritage de Nacre');
  boolean(context.departureRecorded, 'présence du rapport de Nacre');
  requireValue(['none', 'obey', 'delay', 'defy'].includes(context.departureChoice), 'choix de Nacre');
  number(context.departureArrived, 0, 100, 'arrivées héritées de Nacre', true);
  number(context.departureLost, 0, 100, 'pertes héritées de Nacre', true);
  requireValue(context.departureRecorded === (context.departureChoice !== 'none'), 'choix sans rapport de Nacre');
  requireValue(context.departureRecorded || context.departureArrived === 0 && context.departureLost === 0, 'bilan de Nacre sans rapport');
}

export function validateLivingRouteFacts(facts, finished = false) {
  for (const key of FLAGS) boolean(facts[key], `bilan ${key}`);
  for (const key of COUNTS) number(facts[key], 0, key.startsWith('migrators') ? 4 : 2, `bilan ${key}`, true);
  requireValue(facts.migratorsTotal === 4, 'effectif du troupeau');
  requireValue(['unselected', 'imperial', 'migration'].includes(facts.route), 'route inconnue');
  requireValue(['unprepared', 'surveyed', 'guided'].includes(facts.approach), 'approche inconnue');
  number(facts.logisticsIntegrity, 0, 1, 'intégrité logistique');
  const terminal = facts.migratorsArrived + facts.migratorsDisplaced + facts.migratorsLost;
  requireValue(terminal <= 4 && facts.migrationResolved === (terminal === 4), 'bilan migratoire incomplet ou dédoublé');
  requireValue(facts.approachPrepared === (facts.approach !== 'unprepared'), 'préparation de l’approche');
  requireValue(facts.approach !== 'guided' || facts.localsHeard, 'guidage sans échange local');
  requireValue(facts.hamletsRecorded === facts.routeInspected && facts.manifestRead === facts.routeInspected, 'carte et habitats relevés');
  requireValue(!facts.gateOperated || facts.route !== 'unselected' && facts.routeInspected, 'barrière manœuvrée avant choix et relevé');
  requireValue(facts.cropsFertilized === (facts.migratorsArrived > 0), 'fertilisation sans arrivée');
  requireValue(!facts.passagePreserved || facts.route === 'migration' && facts.gateOperated, 'passage préservé sans manœuvre');
  requireValue(!facts.migratorsArrived || facts.route === 'migration', 'arrivée au verger contraire au choix');
  requireValue(!facts.migratorsDisplaced || facts.route === 'imperial', 'déplacement vers l’exclusion contraire au choix');
  requireValue(!facts.snipersTriggered || facts.gateOperated && facts.migrationResolved, 'tireurs arrivés avant libération du corridor');
  requireValue(!facts.snipersNeutralized || facts.snipersTriggered, 'tireur neutralisé avant son arrivée');
  requireValue(!facts.logisticsReleased || facts.migrationResolved, 'départ logistique avant le bilan des animaux');
  requireValue(!facts.logisticsArrived || facts.logisticsReleased && !facts.logisticsDestroyed, 'arrivée logistique sans véhicule sorti et vivant');
  requireValue(facts.logisticsDestroyed === (facts.logisticsIntegrity === 0), 'perte et intégrité logistique');
  requireValue(!facts.reportTransmitted || facts.routeInspected && facts.gateOperated && facts.migrationResolved && facts.snipersNeutralized === 2 && facts.logisticsArrived, 'rapport transmis avant les actes requis');
  if (finished) requireValue(facts.reportTransmitted && facts.route !== 'unselected', 'rapport final incomplet');
}

function validateScene(scene, initial, facts, settings, options) {
  const { elapsed, planetId, snipers, initialSnipers, receipt = false, steps = 10_000_000, player = null } = options;
  shape(scene, initial, 'scène');
  for (const group of ['columns', 'roots', 'homes', 'pollinators', 'migrators']) {
    requireValue(Array.isArray(scene[group]) && scene[group].length === initial[group].length, `${group} incomplet`);
    scene[group].forEach((item, index) => shape(item, initial[group][index], `${group}[${index}]`));
  }
  for (const name of ['barrier', 'logistics', 'contact', 'approach', 'maps', 'lights', 'report', 'alert', 'disturbance']) shape(scene[name], initial[name], name);
  const solid = (item, original, moving = false) => {
    fixed(item, original, moving ? ['id', 'w', 'h', 'maxHp'] : ['id', 'x', 'y', 'w', 'h', 'maxHp'], 'objet physique');
    number(item.hp, 0, item.maxHp, `${item.id} intégrité`);
    number(item.flash, 0, .15, `${item.id} impact`);
    boolean(item.destroyed, `${item.id} destruction`);
    requireValue(item.destroyed === (item.hp === 0), `${item.id} destruction sans perte d’intégrité`);
  };
  const work = (job, done, name, allowFinishedWork = false) => {
    boolean(job.working, `${name} travail`);
    number(job.progress, 0, 1, `${name} progression`);
    if (!allowFinishedWork) requireValue(!done || !job.working, `${name} déjà terminé encore actif`);
    requireValue(!job.working || job.progress < 1, `${name} travail achevé`);
    requireValue(job.working || job.progress === 0 || job.progress === 1 || name === 'transport' && job.destroyed, `${name} progression inactive non annulée`);
  };
  const localWork = (name, done, allowFinishedWork = false) => {
    const item = scene[name];
    fixed(item, initial[name], ['id', 'x', 'y', 'w', 'h'], name);
    work(item, done, name, allowFinishedWork);
    const duration = { contact: settings.contactTime, approach: item.kind === 'guided' ? settings.guidedTime : settings.surveyedTime,
      maps: settings.inspectTime, lights: settings.lightsTime, report: settings.reportTime }[name];
    if (done) requireValue(elapsed + 1e-6 >= duration, `${name} achevé avant sa durée minimale`);
    if (player && item.working && item.progress > 0) requireValue(Math.abs(player.x - item.x) < settings.interactionRadius, `${name} travail hors portée`);
  };

  scene.columns.forEach((column, index) => {
    solid(column, initial.columns[index]);
    fixed(column, initial.columns[index], ['species'], 'colonne');
  });
  scene.roots.forEach((root, index) => {
    solid(root, initial.roots[index]);
    fixed(root, initial.roots[index], ['columnId'], 'racine');
    number(root.lastContactAt, -10, elapsed, 'dernier appui sur racine');
    number(root.lastStep, -1, steps, 'dernier pas sur racine', true);
    requireValue(root.lastStep === -1 ? root.lastContactAt === -10 : root.lastContactAt >= 0, 'trace de pied sans pas correspondant');
  });
  scene.homes.forEach((home, index) => {
    solid(home, initial.homes[index]);
    fixed(home, initial.homes[index], ['columnId'], 'habitat');
    boolean(home.supported, 'habitat soutenu'); boolean(home.habitable, 'habitat habitable');
    const supported = !scene.columns[index].destroyed && !scene.roots[index].destroyed;
    requireValue(home.supported === supported && home.habitable === (supported && !home.destroyed), 'habitat contraire à ses appuis physiques');
    requireValue(supported || home.destroyed, 'habitat maintenu après rupture de son appui');
  });
  scene.pollinators.forEach((fan, index) => {
    fixed(fan, initial.pollinators[index], ['id', 'species', 'columnId', 'x', 'y', 'w', 'h'], 'éventail');
    boolean(fan.alive, 'vie de l’éventail');
    number(fan.calm, 0, 5, 'calme de l’éventail');
    requireValue(['flying', 'settled', 'lost'].includes(fan.phase), 'phase de l’éventail');
    requireValue(fan.alive === !scene.columns[index].destroyed && (fan.phase === 'lost') === !fan.alive, 'éventail contraire à sa colonne');
    requireValue(fan.phase === 'settled' ? fan.calm === 5 && !scene.lights.on : fan.calm < 5, 'éventail posé sans retour au calme');
    requireValue(fan.alive || fan.calm === 0, 'calme d’un éventail perdu');
    requireValue(!scene.lights.on || fan.phase !== 'settled' && fan.calm === 0, 'éventail calme sous les projecteurs');
  });

  boolean(scene.contact.heard, 'échange local'); localWork('contact', scene.contact.heard);
  requireValue(scene.contact.heard === (scene.contact.progress === 1), 'échange local sans écoute accomplie');
  boolean(scene.approach.prepared, 'approche préparée'); localWork('approach', scene.approach.prepared, true);
  requireValue(['unprepared', 'surveyed', 'guided'].includes(scene.approach.kind), 'type de contournement');
  requireValue(scene.approach.prepared === (scene.approach.kind !== 'unprepared'), 'contournement non préparé');
  requireValue(scene.approach.clearance === (scene.approach.prepared ? settings.preparedClearance : settings.initialClearance), 'hauteur de passage fictive');
  requireValue(scene.approach.kind !== 'guided' || scene.contact.heard && scene.approach.progress === 1 && !scene.approach.working, 'guidage sans poste local et travail accompli');
  requireValue(!scene.approach.prepared || !scene.approach.working || scene.approach.kind === 'surveyed' && scene.contact.heard, 'préparation achevée reprise sans amélioration');
  requireValue(scene.approach.prepared || scene.approach.progress < 1, 'préparation achevée sans contournement');
  boolean(scene.maps.inspected, 'cartes inspectées'); localWork('maps', scene.maps.inspected);
  requireValue(scene.maps.inspected === (scene.maps.progress === 1), 'cartes sans relevé accompli');
  boolean(scene.lights.on, 'projecteurs allumés'); localWork('lights', !scene.lights.on);
  requireValue(!scene.lights.on === (scene.lights.progress === 1), 'coupure des projecteurs sans travail');

  const gate = scene.barrier;
  solid(gate, initial.barrier); fixed(gate, initial.barrier, ['controlX'], 'commande de barrière');
  boolean(gate.operated, 'barrière manœuvrée'); work(gate, gate.operated, 'barrière');
  requireValue(gate.opening === (gate.destroyed || gate.operated && facts.route === 'migration' ? 1 : 0), 'ouverture contraire à la manœuvre et aux dégâts');
  requireValue(!gate.operated || facts.route !== 'unselected' && scene.maps.inspected, 'manœuvre sans choix et cartes');
  requireValue(!gate.operated || gate.progress === 1 || gate.destroyed && gate.progress === 0, 'manœuvre non accomplie');
  if (gate.operated) requireValue(elapsed + 1e-6 >= (gate.destroyed && gate.progress === 1 ? settings.damagedGateTime : settings.gateTime), 'manœuvre achevée avant sa durée minimale');
  requireValue(gate.operated || gate.progress < 1, 'barrière achevée sans opération');
  requireValue(!gate.working || facts.route !== 'unselected' && scene.maps.inspected, 'travail de barrière avant le choix');
  if (player && gate.working && gate.progress > 0) requireValue(Math.abs(player.x - gate.controlX) < settings.interactionRadius && player.braced && Math.abs(player.speed) <= 3 && !player.move && player.feet.every(foot => foot.contact), 'barrière en travail sans appuis stables');

  scene.migrators.forEach((animal, index) => {
    const original = initial.migrators[index];
    solid(animal, original, true); fixed(animal, original, ['species', 'age'], 'longue-dorse');
    requireValue(['waiting', 'migrating', ...TERMINAL].includes(animal.phase), 'phase de longue-dorse');
    requireValue(['unselected', 'orchard', 'exclusion'].includes(animal.destination), 'destination de longue-dorse');
    boolean(animal.moving, 'déplacement de longue-dorse'); number(animal.fear, 0, 1, 'peur de longue-dorse');
    requireValue((animal.phase === 'lost') === animal.destroyed, 'longue-dorse perdue encore vivante');
    const selected = animal.destination !== 'unselected';
    const target = selected ? animal.destination === 'orchard' ? settings.orchardXs[index] : settings.exclusionXs[index] : original.x;
    requireValue(animal.targetX === target, 'cible de migration modifiée');
    number(animal.x, original.x, target, 'position de longue-dorse');
    requireValue(animal.y === terrainAt(animal.x, planetId) - animal.h / 2, 'hauteur de longue-dorse hors terrain');
    requireValue(animal.x <= original.x + elapsed * 64 + 1e-6, 'trajet migratoire plus rapide que son déplacement');
    requireValue(!selected || gate.operated && animal.destination === (facts.route === 'migration' ? 'orchard' : 'exclusion'), 'destination animale sans manœuvre correspondante');
    requireValue(selected || ['waiting', 'lost'].includes(animal.phase) && animal.x === original.x, 'départ migratoire sans destination');
    requireValue(animal.phase !== 'waiting' || !selected && !gate.operated, 'troupeau encore en attente après manœuvre');
    requireValue(animal.phase !== 'migrating' || selected && animal.x < target && !animal.destroyed, 'migration hors trajet');
    requireValue(!['arrived', 'displaced'].includes(animal.phase) || selected && animal.x === target && !animal.destroyed && animal.phase === (animal.destination === 'orchard' ? 'arrived' : 'displaced'), 'arrivée animale sans trajet achevé');
    requireValue(!animal.moving || animal.phase === 'migrating', 'mouvement d’un animal terminal ou immobile');
  });

  const vehicle = scene.logistics;
  solid(vehicle, initial.logistics, true); fixed(vehicle, initial.logistics, ['controlX', 'targetX', 'speed'], 'trajet logistique');
  for (const key of ['released', 'moving', 'arrived']) boolean(vehicle[key], `transport ${key}`);
  work(vehicle, vehicle.released || vehicle.destroyed, 'transport');
  number(vehicle.x, initial.logistics.x, vehicle.targetX, 'position logistique');
  requireValue(vehicle.y === terrainAt(vehicle.x, planetId) - vehicle.h / 2, 'hauteur logistique hors terrain');
  requireValue(vehicle.x <= initial.logistics.x + elapsed * vehicle.speed + 1e-6, 'trajet logistique sans temps de déplacement');
  requireValue(vehicle.released || vehicle.x === initial.logistics.x, 'transport déplacé avant départ');
  requireValue(!vehicle.released || facts.migrationResolved && vehicle.progress === 1, 'départ sans opération logistique');
  requireValue(vehicle.released || vehicle.progress < 1, 'opération logistique achevée sans départ');
  if (vehicle.released) requireValue(elapsed + 1e-6 >= settings.dispatchTime, 'départ avant sa durée minimale');
  requireValue(vehicle.arrived === (vehicle.x === vehicle.targetX), 'arrivée logistique contraire à sa position');
  requireValue(!vehicle.arrived || vehicle.released && !vehicle.destroyed && !vehicle.moving, 'arrivée logistique sans véhicule vivant');
  requireValue(!vehicle.moving || vehicle.released && !vehicle.destroyed && !vehicle.arrived, 'mouvement logistique impossible');
  requireValue(!vehicle.working || facts.migrationResolved && !vehicle.destroyed && !vehicle.released, 'opération logistique sans bilan migratoire');

  boolean(scene.alert.triggered, 'arrivée des tireurs');
  requireValue(scene.alert.triggered === (gate.operated && facts.migrationResolved), 'arrivée des tireurs sans corridor libéré');
  requireValue(Array.isArray(snipers) && snipers.length === 2, 'groupe de tireurs incomplet');
  snipers.forEach((sniper, index) => {
    const original = initialSnipers[index];
    if (receipt) keys(sniper, ['id', 'hp', 'maxHp', 'dead'], 'tireur au rapport');
    requireValue(sniper.id === original.id, 'identité de tireur');
    const capacities = Object.values(DIFFICULTIES).map(difficulty => Math.round(ENEMY_TYPES.sniper.hp * difficulty.enemyHealth));
    requireValue(receipt ? capacities.includes(sniper.maxHp) : sniper.maxHp === original.maxHp, 'capacité de tireur');
    number(sniper.hp, 0, sniper.maxHp, 'intégrité de tireur'); boolean(sniper.dead, 'tireur neutralisé');
    requireValue(sniper.dead === (sniper.hp === 0), 'neutralisation sans perte d’intégrité');
    requireValue(scene.alert.triggered || !sniper.dead && sniper.hp === sniper.maxHp, 'dégâts sur un tireur absent');
    if (!receipt) {
      fixed(sniper, original, ['x', 'spawnX', 'y'], 'poste de tireur');
      requireValue(scene.alert.triggered || !sniper.active && sniper.phase === 'idle', 'tireur actif avant son arrivée');
    }
  });
  requireValue(snipers[0].maxHp === snipers[1].maxHp, 'capacités de tireurs provenant de difficultés différentes');
  boolean(scene.report.transmitted, 'rapport transmis'); localWork('report', scene.report.transmitted);
  requireValue(scene.report.transmitted === (scene.report.progress === 1), 'rapport sans transmission accomplie');
  requireValue(!scene.report.working || facts.routeInspected && gate.operated && facts.migrationResolved && snipers.every(sniper => sniper.dead) && vehicle.arrived, 'transmission commencée avant les actes requis');
  number(scene.disturbance.x, -500, 6900, 'position du bruit');
  number(scene.disturbance.remaining, 0, 4, 'durée du bruit');
  number(scene.disturbance.strength, 0, 1, 'intensité du bruit');

  const count = phase => scene.migrators.filter(animal => animal.phase === phase).length;
  const derived = {
    localsHeard: scene.contact.heard, approach: scene.approach.kind, approachPrepared: scene.approach.prepared,
    routeInspected: scene.maps.inspected, hamletsRecorded: scene.maps.inspected, manifestRead: scene.maps.inspected,
    migrationObserved: scene.migrators.some((animal, index) => animal.x > initial.migrators[index].x),
    lightsOff: !scene.lights.on, gateOperated: gate.operated, migratorsTotal: 4,
    migrationResolved: scene.migrators.every(animal => TERMINAL.includes(animal.phase)),
    migratorsArrived: count('arrived'), migratorsDisplaced: count('displaced'), migratorsLost: count('lost'),
    columnsIntact: scene.columns.filter(column => !column.destroyed).length,
    homesHabitable: scene.homes.filter(home => home.habitable).length,
    pollinatorsPresent: scene.pollinators.filter(fan => fan.alive && fan.phase === 'settled').length,
    passagePreserved: gate.operated && facts.route === 'migration' && !gate.destroyed && scene.roots.every(root => !root.destroyed),
    cropsFertilized: count('arrived') > 0,
    harvestFragile: scene.migrators.every(animal => TERMINAL.includes(animal.phase)) && (count('arrived') < 4 || scene.columns.some(column => column.destroyed) || scene.pollinators.some(fan => !fan.alive)),
    snipersTriggered: scene.alert.triggered, snipersNeutralized: snipers.filter(sniper => sniper.dead).length,
    logisticsReleased: vehicle.released, logisticsArrived: vehicle.arrived, logisticsDestroyed: vehicle.destroyed,
    logisticsIntegrity: vehicle.hp / vehicle.maxHp, reportTransmitted: scene.report.transmitted,
  };
  fixed(facts, derived, Object.keys(derived), 'bilan contraire aux objets physiques');
}

export function validateLivingRouteMission(value, template) {
  const facts = value.campaign, scene = value.livingRoute;
  requireValue(object(facts) && facts.missionId === 'MI09' && object(scene), 'scène absente');
  validateContext(facts.context); validateLivingRouteFacts(facts, value.status === 'won');
  requireValue(facts.route === (value.decision.choice === null ? 'unselected' : value.decision.choice === 'obey' ? 'imperial' : 'migration'), 'route contraire au choix');
  requireValue(!value.decision.active && !value.decision.resolved || scene.maps.inspected, 'choix avant relevé des cartes');
  validateScene(scene, template.livingRoute, facts, value.mission.livingRoute, {
    elapsed: value.elapsed, planetId: value.planetId, snipers: value.enemies, initialSnipers: template.enemies,
    steps: value.stats.steps, player: value.player,
  });
  const expectedPhase = value.status === 'won' ? 'complete' : scene.report.transmitted || scene.logistics.arrived ? 'report'
    : scene.logistics.released ? 'logistics' : scene.alert.triggered ? 'defence' : scene.barrier.operated ? 'migration'
      : value.decision.resolved ? 'routing' : scene.maps.inspected ? 'survey' : 'approach';
  requireValue(facts.phase === expectedPhase, 'phase contraire aux actes accomplis');
  requireValue(value.evidence.collected === scene.maps.inspected && value.evidence.scanProgress === (scene.maps.inspected ? 1 : 0) && !value.evidence.scanning, 'lecture du relevé contraire aux cartes');
  fixed(value.evidence, template.evidence, Object.keys(template.evidence).filter(key => !['collected', 'scanProgress', 'scanning'].includes(key)), 'géométrie du relevé');
  requireValue(value.stats.evidence === 0, 'aucune nouvelle preuve PALINODE sur cette route');
  requireValue(value.stats.collateral === 0, 'aucune population humaine supposée dans le bilan de Thyr');
  requireValue(value.stats.kills === facts.snipersNeutralized, 'décompte des tireurs');
  requireValue(value.stats.ordersObeyed === Number(value.decision.choice === 'obey') && value.stats.ordersDefied === Number(value.decision.choice === 'defy'), 'décompte du choix');
  const expected = [
    ['survey', Number(facts.routeInspected), 1, facts.routeInspected],
    ['route', Number(facts.gateOperated), 1, value.decision.resolved && facts.gateOperated],
    ['migration', facts.migratorsArrived + facts.migratorsDisplaced + facts.migratorsLost, 4, facts.migrationResolved],
    ['snipers', facts.snipersNeutralized, 2, facts.snipersNeutralized === 2],
    ['logistics', Number(facts.logisticsArrived), 1, facts.logisticsArrived],
    ['report', Number(facts.reportTransmitted), 1, facts.reportTransmitted],
    ['extract', Number(value.status === 'won'), 1, value.status === 'won'],
  ];
  requireValue(value.objectives.length === expected.length, 'liste des objectifs de Thyr');
  expected.forEach(([id, current, target, complete], index) => fixed(value.objectives[index], { id, current, target, complete }, ['id', 'current', 'target', 'complete'], 'objectif contraire aux actes'));
  requireValue(value.extraction.active === expected.slice(0, -1).every(([, , , complete]) => complete), 'extraction avant accomplissement');
  fixed(value.extraction, template.extraction, Object.keys(template.extraction).filter(key => key !== 'active'), 'point de sortie');
  if (value.status === 'won') requireValue(facts.phase === 'complete' && value.player.hull > 0 && value.objectives.every(goal => goal.complete) && Math.abs(value.player.x - value.extraction.x) < value.extraction.radius, 'victoire sans extraction accomplie');
  if (value.status === 'lost') requireValue(value.player.hull === 0 || scene.logistics.destroyed, 'défaite sans perte terminale');
  if (value.status === 'playing') requireValue(!scene.logistics.destroyed, 'transport détruit dans une sortie encore vivante');
}

export function validateLivingRouteReceipt(receipt, context) {
  validateContext(context); validateLivingRouteFacts(receipt, true);
  requireValue(receipt.route === (receipt.choice === 'obey' ? 'imperial' : 'migration'), 'route du rapport contraire au choix');
  const template = createGame({ missionId: 'MI09', walkerId: receipt.walkerId, campaignContext: context });
  keys(receipt.roster, [...Object.keys(template.livingRoute), 'snipers'], 'registre individuel de Thyr');
  const scene = Object.fromEntries(Object.keys(template.livingRoute).map(key => [key, receipt.roster[key]]));
  validateScene(scene, template.livingRoute, receipt, template.mission.livingRoute, {
    elapsed: receipt.elapsed, planetId: template.planetId, snipers: receipt.roster.snipers, initialSnipers: template.enemies, receipt: true,
  });
  requireValue(receipt.collateral === 0 && receipt.kills === receipt.snipersNeutralized && receipt.hull > 0, 'bilan de retour contraire aux acteurs');
}

export function livingRouteDossierFromGame(game) {
  const fields = Object.keys(createLivingRouteDossier()).filter(key => key !== 'roster');
  return { ...Object.fromEntries(fields.map(key => [key, game.campaign[key]])), roster: livingRouteReceiptRoster(game) };
}

/** Official checkpoints may advance consequences, never revive or rewind them. */
export function validateLivingRouteSortie(previous, current) {
  requireValue(previous?.missionId === 'MI09' && current.missionId === 'MI09', 'checkpoint hors sortie officielle');
  requireValue(current.walkerId === previous.walkerId && current.seed === previous.seed && current.difficultyId === previous.difficultyId, 'changement de sortie');
  requireValue(current.elapsed >= previous.elapsed, 'recul de sortie');
  equal(current.campaign.context, previous.campaign.context, 'héritage modifié pendant la sortie');
  requireValue(previous.status === 'playing' || JSON.stringify(current) === JSON.stringify(previous), 'sortie perdue à recommencer explicitement');
  requireValue(!previous.decision.resolved || current.decision.resolved && current.decision.choice === previous.decision.choice, 'choix acquis annulé');
  for (const key of ['localsHeard', 'approachPrepared', 'routeInspected', 'hamletsRecorded', 'migrationObserved', 'lightsOff', 'gateOperated', 'migrationResolved', 'snipersTriggered', 'logisticsReleased', 'logisticsArrived', 'logisticsDestroyed', 'reportTransmitted', 'manifestRead']) {
    requireValue(!previous.campaign[key] || current.campaign[key], `fait acquis annulé : ${key}`);
  }
  const old = previous.livingRoute, now = current.livingRoute;
  for (const group of ['columns', 'roots', 'homes', 'migrators']) {
    old[group].forEach((item, index) => {
      requireValue(now[group][index].hp <= item.hp, `intégrité restituée : ${item.id}`);
      if (group === 'roots') requireValue(now[group][index].lastContactAt >= item.lastContactAt && now[group][index].lastStep >= item.lastStep, `trace d’appui reculée : ${item.id}`);
      if (group === 'migrators') {
        requireValue(now[group][index].x >= item.x, `trajet migratoire reculé : ${item.id}`);
        if (TERMINAL.includes(item.phase)) fixed(now[group][index], item, ['hp', 'destroyed', 'phase', 'destination', 'targetX', 'x', 'y'], 'destination individuelle acquise modifiée');
      }
    });
  }
  for (const name of ['barrier', 'logistics']) requireValue(now[name].hp <= old[name].hp, `intégrité restituée : ${name}`);
  requireValue(now.logistics.x >= old.logistics.x, 'trajet logistique reculé');
  if (old.approach.kind === 'guided') requireValue(now.approach.kind === 'guided', 'approche guidée annulée');
  previous.enemies.forEach((enemy, index) => requireValue(current.enemies[index].hp <= enemy.hp, 'tireur ressuscité ou réparé'));
}
