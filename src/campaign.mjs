/**
 * Sequential campaign dossiers, workshop maintenance and resilient local saves.
 * This module has no DOM, clock, network or implicit access to localStorage.
 * Every campaign transition returns a new value; gameplay remains in simulation.mjs.
 */
import { WALKERS, DIFFICULTIES, ENEMY_TYPES } from './content.mjs';
import { createGame, trainDecisionBody, networkDecisionBody, industrialDecisionBody, channelDecisionBody, channelTideAt, terrainAt } from './simulation.mjs';

export const CAMPAIGN_SAVE_KEY = 'imperium.campaign.v1';
export const CAMPAIGN_BACKUP_KEY = 'imperium.campaign.v1.backup';
export const CAMPAIGN_SAVE_VERSION = 5;
const FORMAT = 'ordre-de-cendre.campaign';
const MAX_BYTES = 2_000_000;
const INITIAL_PARTS = 6;
const DELIVERY_PARTS = 4;
const PIPE_PARTS = 2;
const MISSION_IDS = ['MI01', 'MI02', 'MI03', 'MI04', 'MI05'];
const LEGACY_WALKER_IDS = ['WK01', 'WK05', 'WK09'];
const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const own = (value, key) => Object.hasOwn(value, key);

function requireValue(condition, message) {
  if (!condition) throw new Error(`Sauvegarde invalide : ${message}`);
}

function number(value, min, max, label, integer = false) {
  requireValue(Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)), label);
}

function boolean(value, label) { requireValue(typeof value === 'boolean', label); }

function walkJSON(value, depth = 0) {
  requireValue(depth < 30, 'structure trop profonde');
  if (typeof value === 'number') requireValue(Number.isFinite(value), 'nombre non fini');
  else if (typeof value === 'string') requireValue(value.length <= 12000, 'texte trop long');
  else if (Array.isArray(value)) {
    requireValue(value.length <= 5000, 'liste trop longue');
    for (const child of value) walkJSON(child, depth + 1);
  } else if (isObject(value)) {
    requireValue(Object.keys(value).length <= 250, 'objet trop large');
    for (const [key, child] of Object.entries(value)) {
      requireValue(!['__proto__', 'constructor', 'prototype'].includes(key), 'clé réservée');
      walkJSON(child, depth + 1);
    }
  } else requireValue(value === null || typeof value === 'boolean', 'type non sérialisable');
}

function matchesShape(value, template, path = '') {
  if (Array.isArray(template)) {
    requireValue(Array.isArray(value), path);
    return;
  }
  if (isObject(template)) {
    requireValue(isObject(value), path);
    if (Object.keys(template).length) requireValue(Object.keys(value).every(key => own(template, key)), `${path} : champ inconnu`);
    for (const [key, child] of Object.entries(template)) {
      requireValue(own(value, key), `${path}.${key} absent`);
      // These maps contain event/interaction keys produced during simulation.
      if (['inputHeld', 'notified'].includes(key)) requireValue(isObject(value[key]), `${path}.${key}`);
      else matchesShape(value[key], child, `${path}.${key}`);
    }
    return;
  }
  if (template === null) return;
  requireValue(typeof value === typeof template, path);
}

function validateGame(value, finished = false) {
  requireValue(isObject(value), 'état de mission absent');
  requireValue(value.version === 1 && MISSION_IDS.includes(value.missionId), 'version ou mission inconnue');
  const walker = WALKERS.find(item => item.id === value.walkerId);
  requireValue(Boolean(walker) && own(DIFFICULTIES, value.difficultyId), 'châssis ou difficulté inconnus');
  number(value.seed, 0, 0xffffffff, 'graine', true);
  number(value.rng, 0, 0xffffffff, 'générateur aléatoire', true);
  const template = clone(createGame({ missionId: value.missionId, walkerId: walker.id, difficulty: value.difficultyId, seed: value.seed, assist: value.assist,
    campaignContext: value.campaign?.context }));
  requireValue(template.missionId === value.missionId, 'mission indisponible dans cette version');
  matchesShape(value, template, 'mission');
  requireValue(value.planetId === template.planetId, 'planète incohérente');
  requireValue(JSON.stringify(value.mission) === JSON.stringify(template.mission), 'définition de mission incompatible');
  requireValue(JSON.stringify(value.walker) === JSON.stringify(template.walker), 'définition de châssis incompatible');
  requireValue(JSON.stringify(value.difficulty) === JSON.stringify(template.difficulty), 'paramètres de difficulté incompatibles');
  requireValue((finished ? ['playing', 'won', 'lost'] : ['playing']).includes(value.status), 'état de mission incompatible');
  number(value.elapsed, 0, 86400, 'temps de mission');
  number(value.eventId, 0, 10_000_000, 'compteur événement', true);
  number(value.entityId, 0, 10_000_000, 'compteur entité', true);
  const player = value.player;
  number(player.hull, 0, walker.hull, 'coque');
  if (!finished) requireValue(player.hull > 0, 'checkpoint après destruction');
  for (const key of ['width', 'height', 'maxHull', 'maxAmmo', 'maxReserveAmmo', 'maxRockets', 'armor']) requireValue(player[key] === template.player[key], `capacité ${key}`);
  for (const key of ['heat', 'energy', 'stability']) number(player[key], 0, 100, key);
  number(player.ammo, 0, walker.ammo, 'munitions', true);
  number(player.reserveAmmo, 0, player.maxReserveAmmo, 'réserve de munitions', true);
  number(player.rockets, 0, walker.rockets, 'roquettes', true);
  const radiator = player.radiator;
  requireValue(isObject(radiator) && radiator.maxHealth === 100 && radiator.maxRepairKits === 2, 'capacité du radiateur');
  number(radiator.health, 0, 100, 'intégrité du radiateur');
  number(radiator.repairKits, 0, 2, 'nécessaires de réparation', true);
  number(radiator.repairProgress, 0, 1, 'réparation du radiateur');
  boolean(radiator.repairing, 'réparation du radiateur active');
  requireValue(!radiator.repairing || (radiator.health < 100 && radiator.repairKits > 0), 'réparation impossible');
  requireValue(radiator.repairing || radiator.repairProgress === 0, 'réparation inactive en progression');
  number(player.x, 0, value.mission.length, 'position du marcheur');
  number(player.y, -1000, 2000, 'hauteur du marcheur');
  requireValue(player.feet.length === walker.legs, 'nombre d’appuis');
  player.feet.forEach((foot, index) => {
    matchesShape(foot, template.player.feet[index], `appui ${index + 1}`);
    for (const key of ['id', 'index', 'group', 'side', 'homeOffset', 'maxHealth']) requireValue(foot[key] === template.player.feet[index][key], `identité appui ${index + 1}`);
    requireValue(['stance', 'swing'].includes(foot.phase), 'phase d’appui');
    number(foot.health, 0, 100, 'intégrité d’appui');
    number(foot.progress, 0, 1, 'progression d’appui');
    for (const key of ['x', 'fromX', 'targetX']) number(foot[key], -500, value.mission.length + 500, 'position d’appui');
  });
  for (const collection of ['enemies', 'relays', 'civilians', 'pickups']) {
    requireValue(value[collection].length === template[collection].length, `${collection} incomplet`);
    value[collection].forEach((entry, index) => {
      matchesShape(entry, template[collection][index], `${collection}[${index}]`);
      requireValue(entry.id === template[collection][index].id, `${collection} : identifiant incompatible`);
      if (collection === 'enemies') {
        requireValue(entry.type === template[collection][index].type && own(ENEMY_TYPES, entry.type), 'type ennemi incompatible');
        for (const key of ['w', 'h', 'maxHp', 'speed', 'range', 'cooldown', 'damage', 'projectileSpeed', 'windup', 'score', 'kind']) requireValue(entry[key] === template[collection][index][key], `caractéristique ennemie ${key}`);
        number(entry.hp, -1000, entry.maxHp, 'intégrité ennemi');
      }
    });
  }
  requireValue(value.projectiles.length <= 500 && value.particles.length <= 400 && value.events.length <= 90, 'effets ou projectiles excessifs');
  for (const shot of value.projectiles) {
    requireValue(isObject(shot) && ['player', 'enemy'].includes(shot.team) && ['bullet', 'rocket'].includes(shot.type), 'projectile incompatible');
    for (const key of ['x', 'y', 'prevX', 'prevY', 'vx', 'vy', 'damage', 'radius', 'life']) number(shot[key], -20000, 20000, `projectile ${key}`);
    requireValue(Array.isArray(shot.trail) && shot.trail.length <= 8, 'trace de projectile');
    for (const point of shot.trail) {
      requireValue(isObject(point), 'point de trace');
      number(point.x, -20000, 20000, 'trace horizontale'); number(point.y, -20000, 20000, 'trace verticale');
    }
  }
  for (const particle of value.particles) {
    requireValue(isObject(particle) && typeof particle.type === 'string' && typeof particle.color === 'string', 'particule');
    for (const key of ['x', 'y', 'vx', 'vy', 'life', 'maxLife', 'size']) number(particle[key], -20000, 20000, `particule ${key}`);
  }
  for (const event of value.events) {
    requireValue(isObject(event) && typeof event.type === 'string' && typeof event.text === 'string', 'événement');
    number(event.id, 1, value.eventId, 'identifiant événement', true);
    number(event.time, 0, value.elapsed, 'horodatage événement');
  }
  for (const [key, stat] of Object.entries(value.stats)) number(stat, 0, 100_000_000, `statistique ${key}`);
  if (template.convoy) {
    requireValue(isObject(value.convoy) && value.convoy.maxHp === template.convoy.maxHp, 'convoi absent ou incompatible');
    number(value.convoy.hp, 0, value.convoy.maxHp, 'intégrité du convoi');
    requireValue(finished || value.convoy.hp > 0, 'checkpoint après perte du convoi');
  } else requireValue(value.convoy === null, 'convoi inattendu');
  requireValue(value.decision.choice === null || ['obey', 'defy'].includes(value.decision.choice), 'décision inconnue');
  for (const key of ['title', 'body', 'options']) {
    const dynamicBody = value.missionId === 'MI02' ? trainDecisionBody : value.missionId === 'MI03' ? networkDecisionBody : value.missionId === 'MI04' ? industrialDecisionBody : value.missionId === 'MI05' ? channelDecisionBody : null;
    const expected = key === 'body' && dynamicBody && (value.decision.active || value.decision.resolved)
      ? dynamicBody(value) : template.decision[key];
    requireValue(JSON.stringify(value.decision[key]) === JSON.stringify(expected), 'texte de décision incompatible');
  }
  requireValue(value.decision.resolved === (value.decision.choice !== null), 'décision incohérente');
  requireValue(!(value.decision.active && value.decision.resolved), 'décision active déjà résolue');
  requireValue(Array.isArray(value.objectives) && value.objectives.length > 0 && value.objectives.length <= 12, 'objectifs absents');
  for (const objective of value.objectives) {
    requireValue(isObject(objective) && typeof objective.id === 'string' && typeof objective.label === 'string', 'objectif incompatible');
    boolean(objective.complete, 'statut d’objectif');
    number(objective.current, 0, 100000, 'progression d’objectif');
    number(objective.target, 1, 100000, 'cible d’objectif');
  }
  const mission = value.campaign;
  if (value.missionId === 'MI05') {
    validateChannelMission(value, template);
    return value;
  }
  if (value.missionId === 'MI02') {
    validateRailMission(value, template, finished);
    return value;
  }
  if (value.missionId === 'MI03') {
    validateNetworkMission(value, template);
    return value;
  }
  if (value.missionId === 'MI04') {
    validateIndustrialMission(value, template);
    return value;
  }
  requireValue(isObject(mission) && mission.missionId === 'MI01', 'état du couloir absent');
  requireValue(['approach', 'escort', 'delivery', 'complete'].includes(mission.phase), 'phase du couloir');
  requireValue(['unresolved', 'secured', 'direct'].includes(mission.route), 'passage inconnu');
  for (const key of ['pipeIntact', 'passageSecured', 'passageWorking', 'filtersDelivered', 'manifestRead', 'noticeFiled']) boolean(mission[key], `couloir ${key}`);
  number(mission.pipeDamage, 0, 100, 'dégât conduite');
  number(mission.passageProgress, 0, 1, 'protection du passage');
  number(mission.filtersDeliveredCount, 0, 24, 'caisses livrées', true);
  number(mission.repairCost, 0, PIPE_PARTS, 'réparation de conduite', true);
  number(mission.convoyIntegrity, 0, 1, 'intégrité du transport');
  if (mission.deliveryTime !== null) number(mission.deliveryTime, 0, value.elapsed, 'heure de livraison');
  if (value.status === 'won') requireValue(mission.phase === 'complete' && mission.filtersDelivered && mission.filtersDeliveredCount === 24 && mission.manifestRead && value.decision.resolved && value.objectives.every(item => item.complete), 'victoire sans objectifs accomplis');
  return value;
}

function validateRailMission(value, template, finished) {
  const mission = value.campaign, train = value.train;
  requireValue(isObject(mission) && mission.missionId === 'MI02', 'état du viaduc absent');
  requireValue(['approach', 'release', 'pursuit', 'rescue', 'report', 'complete'].includes(mission.phase), 'phase du viaduc');
  for (const key of ['trainStopped', 'rescueWorking', 'rescueResolved', 'manifestRead', 'evidencePreserved', 'recordFiled']) boolean(mission[key], `viaduc ${key}`);
  requireValue(mission.hostagesTotal === 8, 'effectif du wagon');
  number(mission.harpoonsReleased, 0, 2, 'harpons libérés', true);
  number(mission.hostagesRescued, 0, 8, 'ouvriers secourus', true);
  number(mission.hostagesLost, 0, 8, 'ouvriers perdus', true);
  requireValue(mission.hostagesRescued + mission.hostagesLost <= 8, 'bilan des ouvriers impossible');
  if (mission.rescueResolved) requireValue(mission.hostagesRescued + mission.hostagesLost === 8, 'bilan des ouvriers incomplet');
  number(mission.rescueProgress, 0, 1, 'évacuation du wagon');
  number(mission.trainIntegrity, 0, 1, 'intégrité ferroviaire');
  requireValue(isObject(mission.context), 'contexte de Vesper absent');
  for (const key of ['pipeIntact', 'pipeRepaired', 'noticeFiled', 'servicesInterrupted']) boolean(mission.context[key], `contexte ${key}`);
  requireValue(!mission.context.pipeIntact || !mission.context.pipeRepaired, 'contexte de réparation incohérent');
  requireValue(mission.context.servicesInterrupted === (!mission.context.pipeIntact && !mission.context.pipeRepaired), 'contexte du réseau incohérent');
  requireValue(isObject(train), 'locomotive absente');
  for (const key of ['id', 'w', 'h', 'maxHp', 'speed', 'breakX']) requireValue(train[key] === template.train[key], `locomotive ${key}`);
  number(train.x, 0, value.mission.length + 500, 'position du train');
  number(train.y, -1000, 2000, 'hauteur du train');
  number(train.hp, 0, train.maxHp, 'coque de la locomotive');
  number(train.brakeProgress, 0, 1, 'freinage');
  for (const key of ['moving', 'stopped', 'destroyed', 'brakeWorking']) boolean(train[key], `train ${key}`);
  requireValue(finished || (train.hp > 0 && !train.destroyed), 'checkpoint après perte du train');
  requireValue(mission.trainStopped === train.stopped, 'freinage contradictoire');
  requireValue(!(train.stopped && train.moving), 'train arrêté en mouvement');
  requireValue(Math.abs(mission.trainIntegrity - train.hp / train.maxHp) < 1e-9, 'intégrité ferroviaire contradictoire');
  requireValue(Array.isArray(train.wagons) && train.wagons.length === template.train.wagons.length, 'wagons incomplets');
  train.wagons.forEach((wagon, index) => {
    const original = template.train.wagons[index];
    matchesShape(wagon, original, `wagon ${index}`);
    for (const key of ['id', 'kind', 'offset', 'w', 'h', 'maxHp']) requireValue(wagon[key] === original[key], `wagon ${key}`);
    number(wagon.hp, 0, wagon.maxHp, 'intégrité du wagon');
    number(wagon.x, -500, value.mission.length + 500, 'position du wagon');
    number(wagon.y, -1000, 2000, 'hauteur du wagon');
    boolean(wagon.destroyed, 'destruction du wagon');
    requireValue(Math.abs(wagon.x - train.x - wagon.offset) < 1e-7, 'attelage incohérent');
  });
  requireValue(Array.isArray(train.harpoons) && train.harpoons.length === 2, 'harpons incomplets');
  train.harpoons.forEach((harpoon, index) => {
    matchesShape(harpoon, template.train.harpoons[index], `harpon ${index}`);
    for (const key of ['id', 'x', 'y']) requireValue(harpoon[key] === template.train.harpoons[index][key], `harpon ${key}`);
    boolean(harpoon.released, 'harpon libéré'); boolean(harpoon.working, 'démontage du harpon');
    number(harpoon.progress, 0, 1, 'progression du harpon');
  });
  requireValue(mission.harpoonsReleased === train.harpoons.filter(item => item.released).length, 'décompte des harpons');
  requireValue(mission.recordFiled === (value.decision.choice === 'defy'), 'signalement de vente contradictoire');
  requireValue(mission.manifestRead === value.evidence.collected, 'lecture du registre contradictoire');
  requireValue(value.stats.evidence === 0, 'MI02 ne contient aucune preuve PALINODE');
  if (value.status === 'won') requireValue(mission.phase === 'complete' && mission.harpoonsReleased === 2 && mission.trainStopped && mission.rescueResolved && mission.manifestRead && train.hp > 0 && !train.destroyed && train.x < train.breakX && value.decision.resolved && value.objectives.every(item => item.complete), 'victoire ferroviaire sans objectifs accomplis');
}

function validateNetworkMission(value, template) {
  const mission = value.campaign, network = value.network;
  requireValue(isObject(mission) && mission.missionId === 'MI03', 'état des émetteurs absent');
  requireValue(['approach', 'inspection', 'report', 'complete'].includes(mission.phase), 'phase des émetteurs');
  for (const key of ['militaryRelayDisabled', 'networkPreserved', 'dispensaryIntact', 'witnessAvailable', 'holtAlerted', 'reportFiled', 'manifestRead']) boolean(mission[key], `émetteurs ${key}`);
  number(mission.signalsIdentified, 0, 3, 'émissions identifiées', true);
  number(mission.verifiedBuildings, 0, 2, 'bâtiments vérifiés', true);
  number(mission.civilRelaysOnline, 0, 2, 'relais civils en ligne', true);
  number(mission.residentsLost, 0, 1000, 'habitants perdus', true);
  requireValue(isObject(network) && Array.isArray(network.stations) && network.stations.length === 3, 'stations incomplètes');
  number(network.scrutinyElapsed, 0, 6, 'durée de vérification civile');
  boolean(network.scrutinyTriggered, 'contrôle de Holt');
  requireValue(network.scrutinyTriggered === mission.holtAlerted, 'contrôle contradictoire');
  network.stations.forEach((station, index) => {
    const original = template.network.stations[index];
    matchesShape(station, original, `station ${index}`);
    for (const key of ['id', 'kind', 'x', 'y', 'w', 'h', 'maxHp', 'population']) requireValue(station[key] === original[key], `station ${key}`);
    number(station.hp, 0, station.maxHp, 'intégrité de station');
    number(station.scanProgress, 0, 1, 'identification de station');
    number(station.disableProgress, 0, 1, 'coupure de station');
    number(station.casualties, 0, station.population, 'pertes de station', true);
    for (const key of ['destroyed', 'identified', 'verified', 'scanning', 'disabled', 'secured', 'disabling']) boolean(station[key], `station ${key}`);
    requireValue(station.destroyed === (station.hp === 0), 'destruction de station contradictoire');
    requireValue(!station.verified || station.identified, 'vérification sans identification');
  });
  const military = network.stations.find(station => station.kind === 'military');
  const dispensary = network.stations.find(station => station.kind === 'dispensary');
  const civilian = network.stations.filter(station => station.kind !== 'military');
  requireValue(mission.signalsIdentified === network.stations.filter(station => station.identified).length, 'décompte des émissions');
  requireValue(mission.verifiedBuildings === civilian.filter(station => station.verified).length, 'décompte des vérifications');
  requireValue(mission.civilRelaysOnline === civilian.filter(station => !station.disabled && !station.destroyed).length, 'relais en ligne contradictoires');
  requireValue(mission.militaryRelayDisabled === (military.disabled || military.destroyed), 'relais militaire contradictoire');
  requireValue(mission.dispensaryIntact === !dispensary.destroyed, 'dispensaire contradictoire');
  requireValue(mission.residentsLost === civilian.reduce((total, station) => total + station.casualties, 0), 'bilan des habitants contradictoire');
  requireValue(mission.networkPreserved === (value.decision.resolved && mission.civilRelaysOnline === 2), 'réseau civil contradictoire');
  requireValue(mission.witnessAvailable === (value.decision.resolved && dispensary.verified && !dispensary.disabled && !dispensary.destroyed && dispensary.casualties < dispensary.population), 'accès au dispensaire contradictoire');
  requireValue(mission.reportFiled === (value.decision.choice === 'defy'), 'constat administratif contradictoire');
  requireValue(mission.manifestRead === value.evidence.collected, 'lecture du dossier contradictoire');
  requireValue(isObject(mission.context), 'contexte des émetteurs absent');
  for (const key of ['pipeIntact', 'pipeRepaired', 'noticeFiled', 'servicesInterrupted', 'railRecordFiled']) boolean(mission.context[key], `contexte MI03 ${key}`);
  for (const key of ['railHostagesRescued', 'railHostagesLost']) number(mission.context[key], 0, 8, `contexte MI03 ${key}`, true);
  requireValue(!mission.context.pipeIntact || !mission.context.pipeRepaired, 'contexte de réparation incohérent');
  requireValue(mission.context.servicesInterrupted === (!mission.context.pipeIntact && !mission.context.pipeRepaired), 'contexte du réseau incohérent');
  requireValue(mission.context.railHostagesRescued + mission.context.railHostagesLost === 8, 'bilan ferroviaire hérité incomplet');
  requireValue(value.stats.evidence === 0, 'MI03 ne contient aucune preuve PALINODE');
  if (value.status === 'won') requireValue(mission.phase === 'complete' && mission.signalsIdentified === 3 && mission.militaryRelayDisabled && mission.manifestRead && value.decision.resolved && value.objectives.every(item => item.complete), 'victoire des émetteurs sans objectifs accomplis');
}

function validateIndustrialMission(value, template) {
  const mission = value.campaign, industrial = value.industrial;
  requireValue(isObject(mission) && mission.missionId === 'MI04', 'état de la station absent');
  requireValue(['approach', 'cooling', 'inspection', 'report', 'complete'].includes(mission.phase), 'phase industrielle');
  for (const key of ['coolantRestored', 'coolingAssistance', 'maintenanceInspected', 'manifestRead', 'logRecovered',
    'technicalEvidence', 'alternativeSourceNeeded', 'witnessContacted', 'reportFiled', 'maintenanceIntact']) boolean(mission[key], `station ${key}`);
  number(mission.turbinesCooled, 0, 2, 'turbines refroidies', true);
  requireValue(['none', 'PT01'].includes(mission.evidenceSource), 'source technique inconnue');
  const context = mission.context;
  requireValue(isObject(context), 'contexte industriel absent');
  for (const key of ['pipeIntact', 'pipeRepaired', 'noticeFiled', 'servicesInterrupted', 'railRecordFiled', 'dispensaryIntact', 'witnessAvailable']) boolean(context[key], `contexte MI04 ${key}`);
  for (const key of ['railHostagesRescued', 'railHostagesLost']) number(context[key], 0, 8, `contexte MI04 ${key}`, true);
  number(context.civilRelaysOnline, 0, 2, 'réseau civil hérité', true);
  requireValue(!context.pipeIntact || !context.pipeRepaired, 'contexte de réparation incohérent');
  requireValue(context.servicesInterrupted === (!context.pipeIntact && !context.pipeRepaired), 'contexte du réseau incohérent');
  requireValue(context.railHostagesRescued + context.railHostagesLost === 8, 'bilan ferroviaire hérité incomplet');
  requireValue(!context.witnessAvailable || (context.dispensaryIntact && context.civilRelaysOnline > 0), 'contact hérité impossible');
  requireValue(isObject(industrial) && Array.isArray(industrial.turbines) && industrial.turbines.length === 2, 'installation industrielle incomplète');
  for (const [item, original, label] of [
    [industrial.pump, template.industrial.pump, 'pompe'],
    [industrial.contact, template.industrial.contact, 'contact'],
    [industrial.post, template.industrial.post, 'poste'],
    ...industrial.turbines.map((turbine, index) => [turbine, template.industrial.turbines[index], `turbine ${index + 1}`]),
  ]) {
    matchesShape(item, original, label);
    for (const key of ['id', 'x', 'y', 'w', 'h']) requireValue(item[key] === original[key], `${label} ${key}`);
  }
  const { pump, turbines, contact, post } = industrial;
  for (const item of [pump, contact, ...turbines]) {
    number(item.progress, 0, 1, 'progression industrielle');
    boolean(item.working, 'opération industrielle active');
  }
  boolean(pump.connected, 'pompe connectée');
  requireValue(!template.industrial.pump.connected || pump.connected, 'circuit hérité déconnecté sans incident');
  for (const turbine of turbines) {
    number(turbine.temperature, 0, 100, 'température turbine');
    boolean(turbine.cooled, 'turbine refroidie');
    requireValue(!turbine.cooled || turbine.progress === 1, 'refroidissement incomplet');
  }
  for (const key of ['available', 'contacted']) boolean(contact[key], `contact ${key}`);
  requireValue(contact.available === (context.witnessAvailable && context.dispensaryIntact && context.civilRelaysOnline > 0), 'accès au contact contradictoire');
  requireValue(!contact.contacted || (contact.available && contact.progress === 1), 'témoignage sans rencontre');
  requireValue(post.maxHp === template.industrial.post.maxHp, 'capacité du poste');
  number(post.hp, 0, post.maxHp, 'intégrité du poste');
  boolean(post.destroyed, 'destruction du poste');
  requireValue(post.destroyed === (post.hp === 0), 'poste détruit contradictoire');
  for (const key of ['retreatTriggered', 'retreatEscaped']) boolean(industrial[key], `retraite ${key}`);
  requireValue(!industrial.retreatEscaped || industrial.retreatTriggered, 'retraite sans déclenchement');
  requireValue(mission.coolantRestored === pump.connected, 'circuit de refroidissement contradictoire');
  requireValue(mission.coolingAssistance === (context.railHostagesRescued > 0), 'aide des ouvriers contradictoire');
  requireValue(mission.turbinesCooled === turbines.filter(item => item.cooled).length, 'décompte des turbines');
  requireValue(mission.maintenanceIntact === !post.destroyed, 'intégrité du poste contradictoire');
  requireValue(mission.witnessContacted === contact.contacted, 'rencontre contradictoire');
  requireValue(mission.maintenanceInspected === mission.manifestRead && mission.manifestRead === value.evidence.collected, 'inspection de maintenance contradictoire');
  requireValue(!mission.logRecovered || mission.maintenanceInspected, 'journal sans inspection');
  requireValue(!mission.maintenanceInspected || mission.logRecovered || post.destroyed, 'journal absent d’un poste intact inspecté');
  requireValue(mission.technicalEvidence === mission.logRecovered && mission.evidenceSource === (mission.logRecovered ? 'PT01' : 'none'), 'provenance technique contradictoire');
  requireValue(mission.alternativeSourceNeeded === (mission.maintenanceInspected && !mission.logRecovered), 'source de remplacement contradictoire');
  requireValue(mission.reportFiled === (value.decision.choice === 'defy'), 'rapport technique contradictoire');
  requireValue(value.stats.evidence === (mission.technicalEvidence ? 1 : 0), 'décompte de preuve technique');
  if (value.status === 'won') requireValue(mission.phase === 'complete' && mission.coolantRestored && mission.turbinesCooled === 2 && mission.maintenanceInspected && value.decision.resolved && value.objectives.every(item => item.complete), 'victoire industrielle sans objectifs accomplis');
}

export function createCampaign() {
  return {
    format: FORMAT, version: CAMPAIGN_SAVE_VERSION, revision: 0,
    stage: 'hangar', activeMissionId: null, completed: {},
    resources: { parts: INITIAL_PARTS, fuel: 0 },
    crew: { tess: { trust: 50 }, sami: { trust: 25 } },
    authority: { reportFiled: false, suspicion: 0 },
    world: { vesper: { pipeIntact: true, pipeRepaired: false, servicesInterrupted: false, filtersDelivered: false,
      filtersDeliveredCount: 0, calesBassesExcluded: false, noticeFiled: false,
      rail: createRailDossier(), communications: createCommunicationsDossier(), industrial: createIndustrialDossier() },
      nacre: { passage: createChannelDossier() } },
    fleet: Object.fromEntries(WALKERS.map(walker => [walker.id, { hull: walker.hull, feet: Array(walker.legs).fill(100), radiator: 100 }])),
    checkpoint: null, preDecisionCheckpoint: null, lastDebrief: null, maintenanceLog: [],
  };
}

function createRailDossier() {
  return { trainRecovered: false, hostagesRescued: 0, hostagesLost: 0, evidencePreserved: false, recordFiled: false, brisantsEncountered: false };
}

function createCommunicationsDossier() {
  return { militaryRelayDisabled: false, verifiedBuildings: 0, networkPreserved: false,
    civilRelaysOnline: 0, dispensaryIntact: false, witnessAvailable: false, residentsLost: 0, holtAlerted: false, reportFiled: false };
}

function createIndustrialDossier() {
  return { coolantRestored: false, coolingAssistance: false, turbinesCooled: 0,
    maintenanceInspected: false, logRecovered: false, technicalEvidence: false, evidenceSource: 'none',
    alternativeSourceNeeded: false, witnessContacted: false, reportFiled: false, maintenanceIntact: false };
}

function validateChannelFacts(facts, finished = false) {
  for (const key of ['traffickingVerified', 'smugglerVerified', 'passageResolved', 'channelOpen', 'fuelRecovered', 'manifestRead', 'reportFiled']) boolean(facts[key], `chenal ${key}`);
  number(facts.winchesReleased, 0, 2, 'treuils libérés', true);
  number(facts.bargesInspected, 0, 2, 'barges inspectées', true);
  requireValue(facts.refugeesTotal === 12, 'effectif du bateau civil');
  number(facts.refugeesPassed, 0, 12, 'passagers arrivés', true);
  number(facts.refugeesLost, 0, 12, 'passagers perdus', true);
  number(facts.bargeCiviliansLost, 0, 4, 'pertes des équipages', true);
  requireValue(facts.refugeesPassed + facts.refugeesLost <= facts.refugeesTotal, 'bilan des passagers impossible');
  requireValue(facts.passageResolved === (facts.refugeesPassed + facts.refugeesLost === facts.refugeesTotal), 'traversée sans bilan complet');
  requireValue(facts.channelOpen === (facts.winchesReleased === 2), 'ouverture du chenal contradictoire');
  requireValue(facts.fuelLots === (facts.fuelRecovered ? 2 : 0), 'carburant sans chargement');
  if (finished) requireValue(facts.winchesReleased === 2 && facts.bargesInspected === 2 && facts.passageResolved && facts.manifestRead, 'dossier du chenal incomplet');
}

function validateChannelMission(value, template) {
  const facts = value.campaign, channel = value.channel, initial = template.channel;
  requireValue(isObject(facts) && facts.missionId === 'MI05', 'état du chenal absent');
  requireValue(['approach', 'channel', 'passage', 'report', 'complete'].includes(facts.phase), 'phase du chenal');
  validateChannelFacts(facts, value.status === 'won');
  requireValue(isObject(facts.context), 'héritage de Vesper absent');
  for (const key of ['technicalEvidence', 'railRecordFiled']) boolean(facts.context[key], `héritage de Nacre ${key}`);
  number(facts.context.railHostagesRescued, 0, 8, 'ouvriers hérités de Vesper', true);
  requireValue(isObject(channel), 'chenal absent');
  requireValue(JSON.stringify(channel.tide) === JSON.stringify(channelTideAt(value.elapsed)), 'marée incompatible avec l’horloge de simulation');
  for (const name of ['banks', 'winches', 'barges']) {
    requireValue(Array.isArray(channel[name]) && channel[name].length === initial[name].length, `${name} incomplet`);
    for (let index = 0; index < channel[name].length; index++) {
      const item = channel[name][index], original = initial[name][index];
      matchesShape(item, original, `${name}[${index}]`);
      for (const key of ['id', 'kind', 'x', 'y', 'w', 'h', 'maxHp', 'from', 'to', 'stationX', 'civilians']) if (own(original, key)) requireValue(item[key] === original[key], `${name} ${key} incompatible`);
    }
  }
  for (const bank of channel.banks) {
    boolean(bank.bridgeRaised, 'passerelle déployée'); boolean(bank.working, 'déploiement actif');
    number(bank.progress, 0, 1, 'déploiement de passerelle');
    requireValue(!bank.bridgeRaised || (bank.progress === 1 && !bank.working), 'passerelle inachevée');
  }
  for (const item of [...channel.winches, ...channel.barges, channel.boat, channel.fuel]) {
    number(item.hp, 0, item.maxHp, 'intégrité du chenal');
    boolean(item.destroyed, 'destruction du chenal');
    requireValue(item.destroyed === (item.hp === 0), 'destruction du chenal contradictoire');
    if (own(item, 'flash')) number(item.flash, 0, 10, 'impact du chenal');
  }
  for (const winch of channel.winches) {
    for (const key of ['released', 'working']) boolean(winch[key], `treuil ${key}`);
    number(winch.progress, 0, 1, 'déblocage du treuil');
    requireValue(!winch.destroyed || winch.released, 'câble retenu par un treuil détruit');
    requireValue(!winch.released || !winch.working, 'treuil libéré encore actif');
  }
  for (const barge of channel.barges) {
    for (const key of ['inspected', 'scanning']) boolean(barge[key], `barge ${key}`);
    number(barge.scanProgress, 0, 1, 'inspection de barge');
    number(barge.casualties, 0, barge.civilians, 'pertes de barge', true);
    requireValue(!barge.inspected || (barge.scanProgress === 1 && !barge.scanning), 'inspection de barge incomplète');
  }
  const { boat, fuel } = channel;
  matchesShape(boat, initial.boat, 'bateau civil'); matchesShape(fuel, initial.fuel, 'dépôt de carburant');
  for (const [item, original] of [[boat, initial.boat], [fuel, initial.fuel]]) {
    for (const key of ['id', 'w', 'h', 'maxHp', 'speed', 'passengers']) if (own(original, key)) requireValue(item[key] === original[key], `capacité ${key} du chenal`);
  }
  number(boat.x, initial.boat.x, value.mission.channel.boatDockX, 'position du bateau');
  requireValue(Math.abs(boat.y - (terrainAt(boat.x, value.planetId) - 35)) < 1e-7, 'hauteur du bateau contradictoire');
  for (const key of ['arrived', 'moving']) boolean(boat[key], `bateau ${key}`);
  requireValue(!(boat.arrived && boat.destroyed), 'bateau évacué détruit dans le bilan de traversée');
  requireValue(!boat.arrived || boat.x === value.mission.channel.boatDockX, 'arrivée avant le quai');
  requireValue(!boat.moving || (!boat.arrived && !boat.destroyed && facts.channelOpen && channel.tide.navigable), 'navigation impossible');
  requireValue(fuel.x === initial.fuel.x && fuel.y === initial.fuel.y, 'dépôt déplacé');
  for (const key of ['collected', 'working']) boolean(fuel[key], `carburant ${key}`);
  number(fuel.progress, 0, 1, 'chargement de carburant');
  requireValue(!fuel.collected || (fuel.progress === 1 && !fuel.working), 'chargement de carburant incomplet');
  requireValue(facts.winchesReleased === channel.winches.filter(item => item.released).length, 'décompte des treuils');
  requireValue(facts.bargesInspected === channel.barges.filter(item => item.inspected).length, 'décompte des barges');
  requireValue(!facts.traffickingVerified || channel.barges.find(item => item.kind === 'trafficker').inspected, 'facture sans inspection');
  requireValue(!facts.smugglerVerified || channel.barges.find(item => item.kind === 'smuggler').inspected, 'contact sans inspection');
  requireValue(facts.bargeCiviliansLost === channel.barges.reduce((sum, item) => sum + item.casualties, 0), 'bilan des équipages contradictoire');
  requireValue(facts.fuelRecovered === fuel.collected, 'réserve sans carburant chargé');
  requireValue(facts.refugeesPassed === (boat.arrived ? boat.passengers : 0), 'passagers arrivés sans bateau');
  requireValue(facts.refugeesLost === (boat.destroyed && !boat.arrived ? boat.passengers : 0), 'pertes de passagers contradictoires');
  requireValue(facts.manifestRead === value.evidence.collected, 'relevé du chenal contradictoire');
  requireValue(facts.reportFiled === (value.decision.choice === 'defy'), 'compte rendu du chenal contradictoire');
  requireValue(value.stats.evidence === 0, 'le chenal ne produit aucune nouvelle preuve PALINODE');
  if (value.status === 'won') requireValue(facts.phase === 'complete' && value.decision.resolved && value.objectives.every(item => item.complete), 'victoire du chenal sans objectifs accomplis');
}

function createChannelDossier() {
  return { winchesReleased: 0, bargesInspected: 0, traffickingVerified: false, smugglerVerified: false,
    refugeesTotal: 0, refugeesPassed: 0, refugeesLost: 0, bargeCiviliansLost: 0,
    passageResolved: false, channelOpen: false, fuelRecovered: false, fuelLots: 0,
    manifestRead: false, reportFiled: false };
}

function campaignContextFor(campaign, missionId) {
  const world = campaign.world.vesper;
  if (missionId === 'MI05') return { technicalEvidence: world.industrial.technicalEvidence,
    railHostagesRescued: world.rail.hostagesRescued, railRecordFiled: world.rail.recordFiled };
  const context = Object.fromEntries(['pipeIntact', 'pipeRepaired', 'noticeFiled', 'servicesInterrupted'].map(key => [key, world[key]]));
  if (['MI03', 'MI04'].includes(missionId)) Object.assign(context, { railRecordFiled: world.rail.recordFiled,
    railHostagesRescued: world.rail.hostagesRescued, railHostagesLost: world.rail.hostagesLost });
  if (missionId === 'MI04') Object.assign(context, { dispensaryIntact: world.communications.dispensaryIntact,
    witnessAvailable: world.communications.witnessAvailable, civilRelaysOnline: world.communications.civilRelaysOnline });
  return context;
}

/** A finished sortie returns to the hangar; completion is tracked per mission. */
export function nextCampaignMissionId(campaign) {
  if (campaign?.stage === 'mission' && MISSION_IDS.includes(campaign.activeMissionId)) return campaign.activeMissionId;
  return MISSION_IDS.find(id => !own(campaign?.completed || {}, id)) || null;
}

function validateReceipt(receipt) {
  requireValue(isObject(receipt) && MISSION_IDS.includes(receipt.missionId) && WALKERS.some(item => item.id === receipt.walkerId), 'rapport incompatible');
  const commonKeys = ['missionId', 'missionName', 'walkerId', 'walkerName', 'hull', 'integrity', 'elapsed', 'collateral', 'kills', 'choice', 'partsGranted', 'tessLine', 'samiLine', 'decisionLabel'];
  const specificKeys = receipt.missionId === 'MI01' ? ['convoyIntegrity', 'route', 'pipeIntact', 'noticeFiled', 'filtersDeliveredCount', 'pipeRepairCost']
    : receipt.missionId === 'MI02' ? ['trainIntegrity', 'trainStopped', 'harpoonsReleased', 'hostagesTotal', 'hostagesRescued', 'hostagesLost', 'evidencePreserved', 'recordFiled']
      : receipt.missionId === 'MI03' ? ['signalsIdentified', 'militaryRelayDisabled', 'verifiedBuildings', 'networkPreserved', 'civilRelaysOnline', 'dispensaryIntact', 'witnessAvailable', 'residentsLost', 'holtAlerted', 'reportFiled']
        : receipt.missionId === 'MI04' ? Object.keys(createIndustrialDossier()) : Object.keys(createChannelDossier());
  const expectedKeys = [...commonKeys, ...specificKeys];
  requireValue(Object.keys(receipt).length === expectedKeys.length && expectedKeys.every(key => own(receipt, key)), 'champs du rapport incompatibles');
  for (const key of ['walkerName', 'missionName', 'decisionLabel', 'tessLine', 'samiLine']) requireValue(typeof receipt[key] === 'string', `rapport ${key}`);
  requireValue(['obey', 'defy'].includes(receipt.choice), 'choix du rapport');
  const walker = WALKERS.find(item => item.id === receipt.walkerId);
  number(receipt.hull, 0, walker.hull, 'coque du rapport');
  number(receipt.integrity, 0, 1, 'intégrité du rapport');
  requireValue(Math.abs(receipt.integrity - receipt.hull / walker.hull) < 1e-9, 'coque du rapport contradictoire');
  number(receipt.elapsed, 0, 86400, 'durée du rapport');
  number(receipt.collateral, 0, 1000, 'pertes civiles', true);
  number(receipt.kills, 0, 1000, 'adversaires neutralisés', true);
  requireValue(receipt.partsGranted === DELIVERY_PARTS, 'dotation du rapport');
  if (receipt.missionId === 'MI05') {
    validateChannelFacts(receipt, true);
    requireValue(receipt.reportFiled === (receipt.choice === 'defy'), 'rapport du chenal contradictoire');
    return;
  }
  if (receipt.missionId === 'MI04') {
    for (const key of Object.keys(createIndustrialDossier()).filter(key => !['turbinesCooled', 'evidenceSource'].includes(key))) boolean(receipt[key], `rapport ${key}`);
    requireValue(receipt.coolantRestored && receipt.turbinesCooled === 2 && receipt.maintenanceInspected, 'station non sécurisée');
    requireValue(receipt.technicalEvidence === receipt.logRecovered, 'pièce technique sans journal');
    requireValue(receipt.evidenceSource === (receipt.logRecovered ? 'PT01' : 'none'), 'provenance technique du rapport');
    requireValue(receipt.alternativeSourceNeeded === !receipt.logRecovered, 'source alternative du rapport');
    requireValue(receipt.logRecovered || !receipt.maintenanceIntact, 'journal absent d’un poste intact');
    requireValue(receipt.reportFiled === (receipt.choice === 'defy'), 'diffusion du rapport contradictoire');
    return;
  }
  if (receipt.missionId === 'MI03') {
    for (const key of ['militaryRelayDisabled', 'networkPreserved', 'dispensaryIntact', 'witnessAvailable', 'holtAlerted', 'reportFiled']) boolean(receipt[key], `rapport ${key}`);
    requireValue(receipt.militaryRelayDisabled && receipt.signalsIdentified === 3, 'émetteurs non identifiés');
    number(receipt.verifiedBuildings, 0, 2, 'bâtiments au rapport', true);
    number(receipt.civilRelaysOnline, 0, 2, 'relais au rapport', true);
    number(receipt.residentsLost, 0, 1000, 'habitants au rapport', true);
    requireValue(receipt.networkPreserved === (receipt.civilRelaysOnline === 2), 'réseau au rapport contradictoire');
    requireValue(!receipt.witnessAvailable || (receipt.dispensaryIntact && receipt.verifiedBuildings > 0 && receipt.civilRelaysOnline > 0 && receipt.choice === 'defy'), 'accès au dispensaire impossible');
    requireValue(receipt.choice !== 'obey' || receipt.civilRelaysOnline === 0, 'coupure intégrale contradictoire');
    requireValue(receipt.reportFiled === (receipt.choice === 'defy'), 'rapport des émetteurs contradictoire');
    return;
  }
  if (receipt.missionId === 'MI02') {
    for (const key of ['trainStopped', 'evidencePreserved', 'recordFiled']) boolean(receipt[key], `rapport ${key}`);
    requireValue(receipt.trainStopped && receipt.harpoonsReleased === 2 && receipt.hostagesTotal === 8, 'train non récupéré');
    number(receipt.hostagesRescued, 0, 8, 'ouvriers au rapport', true);
    number(receipt.hostagesLost, 0, 8, 'pertes au rapport', true);
    number(receipt.trainIntegrity, 0, 1, 'train au rapport');
    requireValue(receipt.hostagesRescued + receipt.hostagesLost === 8, 'bilan ferroviaire incomplet');
    requireValue(receipt.recordFiled === (receipt.choice === 'defy'), 'rapport ferroviaire contradictoire');
    return;
  }
  requireValue(['secured', 'direct'].includes(receipt.route), 'passage du rapport');
  for (const key of ['pipeIntact', 'noticeFiled']) boolean(receipt[key], `rapport ${key}`);
  number(receipt.convoyIntegrity, 0, 1, 'convoi du rapport');
  requireValue(receipt.filtersDeliveredCount === 24 && receipt.partsGranted === DELIVERY_PARTS && receipt.pipeRepairCost === (receipt.pipeIntact ? 0 : PIPE_PARTS), 'attribution du rapport');
  requireValue(receipt.noticeFiled === (receipt.choice === 'defy'), 'bordereau contradictoire');
}

function validateCampaign(campaign) {
  requireValue(isObject(campaign) && campaign.format === FORMAT, 'format inconnu');
  requireValue(campaign.version === CAMPAIGN_SAVE_VERSION, 'version non prise en charge, conservez votre fichier');
  walkJSON(campaign);
  matchesShape(campaign, createCampaign(), 'campagne');
  number(campaign.revision, 0, 1_000_000_000, 'révision', true);
  requireValue(['hangar', 'mission', 'complete'].includes(campaign.stage), 'séquence inconnue');
  requireValue(campaign.activeMissionId === null || MISSION_IDS.includes(campaign.activeMissionId), 'mission active inconnue');
  requireValue(Object.keys(campaign.completed).every(id => MISSION_IDS.includes(id)), 'mission validée inconnue');
  for (let index = 1; index < MISSION_IDS.length; index++) requireValue(!own(campaign.completed, MISSION_IDS[index]) || own(campaign.completed, MISSION_IDS[index - 1]), `${MISSION_IDS[index]} sans dossier ${MISSION_IDS[index - 1]}`);
  number(campaign.resources.parts, 0, INITIAL_PARTS + Object.keys(campaign.completed).length * DELIVERY_PARTS, 'lots d’atelier', true);
  number(campaign.resources.fuel, 0, 2, 'lots de carburant', true);
  number(campaign.crew.tess.trust, 0, 100, 'relation Tess', true);
  number(campaign.crew.sami.trust, 0, 100, 'relation Sami', true);
  boolean(campaign.authority.reportFiled, 'rapport administratif');
  number(campaign.authority.suspicion, 0, 100, 'attention du commandement', true);
  const world = campaign.world.vesper;
  for (const key of ['pipeIntact', 'pipeRepaired', 'servicesInterrupted', 'filtersDelivered', 'calesBassesExcluded', 'noticeFiled']) boolean(world[key], `Vesper ${key}`);
  number(world.filtersDeliveredCount, 0, 24, 'Vesper livraison', true);
  requireValue(!(world.pipeIntact && world.pipeRepaired), 'réparation sans incident');
  requireValue(world.servicesInterrupted === (!world.pipeIntact && !world.pipeRepaired), 'état du réseau incohérent');
  for (const key of ['trainRecovered', 'evidencePreserved', 'recordFiled', 'brisantsEncountered']) boolean(world.rail[key], `Vesper rail ${key}`);
  number(world.rail.hostagesRescued, 0, 8, 'Vesper ouvriers secourus', true);
  number(world.rail.hostagesLost, 0, 8, 'Vesper ouvriers perdus', true);
  for (const key of ['militaryRelayDisabled', 'networkPreserved', 'dispensaryIntact', 'witnessAvailable', 'holtAlerted', 'reportFiled']) boolean(world.communications[key], `Vesper émetteurs ${key}`);
  number(world.communications.verifiedBuildings, 0, 2, 'Vesper bâtiments vérifiés', true);
  number(world.communications.civilRelaysOnline, 0, 2, 'Vesper relais civils en ligne', true);
  number(world.communications.residentsLost, 0, 1000, 'Vesper habitants perdus', true);
  requireValue(Object.keys(campaign.fleet).length === WALKERS.length, 'parc de marcheurs');
  for (const walker of WALKERS) {
    const condition = campaign.fleet[walker.id];
    requireValue(isObject(condition) && Array.isArray(condition.feet) && condition.feet.length === walker.legs, 'état d’atelier absent');
    number(condition.hull, 0, walker.hull, 'coque atelier');
    number(condition.radiator, 0, 100, 'radiateur atelier');
    condition.feet.forEach(health => number(health, 0, 100, 'appui atelier'));
  }
  requireValue(Array.isArray(campaign.maintenanceLog) && campaign.maintenanceLog.length <= 20, 'registre d’entretien');
  for (const log of campaign.maintenanceLog) {
    requireValue(isObject(log) && ['walker', 'pipe'].includes(log.type) && typeof log.message === 'string', 'intervention');
    number(log.cost, 1, 6, 'coût intervention', true);
  }
  if (campaign.checkpoint !== null) {
    validateGame(campaign.checkpoint);
    requireValue(campaign.checkpoint.missionId === campaign.activeMissionId, 'checkpoint d’une autre mission');
    if (['MI02', 'MI03', 'MI04', 'MI05'].includes(campaign.checkpoint.missionId)) {
      requireValue(JSON.stringify(campaign.checkpoint.campaign.context) === JSON.stringify(campaignContextFor(campaign, campaign.checkpoint.missionId)), 'héritage des missions précédentes contradictoire');
    }
  }
  if (campaign.preDecisionCheckpoint !== null) {
    validateGame(campaign.preDecisionCheckpoint);
    requireValue(campaign.preDecisionCheckpoint.decision.active && !campaign.preDecisionCheckpoint.decision.resolved, 'checkpoint avant décision incompatible');
    if (campaign.stage === 'mission' && ['MI02', 'MI03', 'MI04', 'MI05'].includes(campaign.preDecisionCheckpoint.missionId)) requireValue(JSON.stringify(campaign.preDecisionCheckpoint.campaign.context) === JSON.stringify(campaignContextFor(campaign, campaign.preDecisionCheckpoint.missionId)), 'héritage du point de décision contradictoire');
  }
  for (const [id, receipt] of Object.entries(campaign.completed)) {
    validateReceipt(receipt);
    requireValue(receipt.missionId === id, 'identifiant du dossier contradictoire');
  }
  const latestId = [...MISSION_IDS].reverse().find(id => own(campaign.completed, id));
  if (latestId) {
    requireValue(JSON.stringify(campaign.completed[latestId]) === JSON.stringify(campaign.lastDebrief), 'rapports contradictoires');
    requireValue(world.filtersDelivered && world.filtersDeliveredCount === 24 && world.calesBassesExcluded, 'livraison du dossier absente');
    requireValue(world.pipeIntact === campaign.completed.MI01.pipeIntact && world.noticeFiled === campaign.completed.MI01.noticeFiled, 'conséquence du rapport incohérente');
  } else {
    requireValue(campaign.lastDebrief === null && campaign.stage !== 'complete', 'rapport sans mission accomplie');
    requireValue(!world.filtersDelivered && world.filtersDeliveredCount === 0, 'livraison sans rapport');
    requireValue(world.pipeIntact && !world.pipeRepaired && !world.noticeFiled && !world.calesBassesExcluded, 'conséquence sans dossier MI01');
  }
  if (campaign.completed.MI02) {
    const receipt = campaign.completed.MI02;
    requireValue(world.rail.trainRecovered && world.rail.brisantsEncountered, 'récupération du train absente');
    for (const key of ['hostagesRescued', 'hostagesLost', 'evidencePreserved', 'recordFiled']) requireValue(world.rail[key] === receipt[key], `dossier ferroviaire ${key}`);
  } else requireValue(JSON.stringify(world.rail) === JSON.stringify(createRailDossier()), 'résultat ferroviaire sans dossier MI02');
  if (campaign.completed.MI03) {
    const receipt = campaign.completed.MI03;
    for (const key of Object.keys(createCommunicationsDossier())) requireValue(world.communications[key] === receipt[key], `dossier des émetteurs ${key}`);
  } else requireValue(JSON.stringify(world.communications) === JSON.stringify(createCommunicationsDossier()), 'réseau civil sans dossier MI03');
  if (campaign.completed.MI04) {
    const receipt = campaign.completed.MI04;
    for (const key of Object.keys(createIndustrialDossier())) requireValue(world.industrial[key] === receipt[key], `dossier industriel ${key}`);
    requireValue(receipt.coolingAssistance === (world.rail.hostagesRescued > 0), 'aide des ouvriers sans dossier ferroviaire');
    requireValue(!receipt.witnessContacted || world.communications.witnessAvailable, 'contact obtenu sans accès au dispensaire');
  } else requireValue(JSON.stringify(world.industrial) === JSON.stringify(createIndustrialDossier()), 'résultat industriel sans dossier MI04');
  const passage = campaign.world.nacre.passage;
  if (campaign.completed.MI05) {
    for (const key of Object.keys(createChannelDossier())) requireValue(passage[key] === campaign.completed.MI05[key], `dossier de Nacre ${key}`);
    requireValue(campaign.resources.fuel === passage.fuelLots, 'carburant sans collecte correspondante');
  } else {
    requireValue(JSON.stringify(passage) === JSON.stringify(createChannelDossier()), 'résultat de Nacre sans dossier MI05');
    requireValue(campaign.resources.fuel === 0, 'carburant obtenu avant Nacre');
  }
  if (campaign.stage === 'mission') {
    requireValue(campaign.checkpoint !== null && MISSION_IDS.includes(campaign.activeMissionId) && !own(campaign.completed, campaign.activeMissionId), 'mission sans checkpoint ou déjà achevée');
    const previousId = MISSION_IDS[MISSION_IDS.indexOf(campaign.activeMissionId) - 1];
    requireValue(!previousId || own(campaign.completed, previousId), `${campaign.activeMissionId} verrouillée`);
  } else {
    requireValue(campaign.activeMissionId === null && campaign.checkpoint === null, 'sortie active hors mission');
    requireValue(campaign.stage === (latestId ? 'complete' : 'hangar'), 'séquence du dossier incohérente');
  }
  if (campaign.preDecisionCheckpoint !== null) {
    requireValue(campaign.preDecisionCheckpoint.missionId === (campaign.activeMissionId || latestId), 'ancien point de décision d’une autre mission');
  }
  return campaign;
}

export function serializeCampaign(campaign) {
  validateCampaign(campaign);
  const text = JSON.stringify(campaign);
  requireValue(text.length <= MAX_BYTES, 'fichier trop volumineux');
  return text;
}

export function parseCampaign(text) {
  requireValue(typeof text === 'string' && text.length > 0 && text.length <= MAX_BYTES, 'taille du fichier');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('Sauvegarde invalide : le fichier JSON est illisible.'); }
  return validateCampaign(migrateCampaign(value));
}

/** Add only documented fields to historical saves; completed receipts stay intact. */
function migrateCampaign(value) {
  if (!isObject(value) || value.format !== FORMAT || ![1, 2, 3, 4].includes(value.version)) return value;
  walkJSON(value);
  requireValue(isObject(value.world) && isObject(value.world.vesper), 'Vesper absent du dossier historique');
  if (value.version === 1) {
    requireValue(isObject(value.completed) && Object.keys(value.completed).every(id => id === 'MI01'), 'dossier v1 contient une mission inconnue');
    requireValue(value.activeMissionId === null || value.activeMissionId === 'MI01', 'mission active v1 inconnue');
    requireValue(!own(value.world.vesper, 'rail'), 'dossier v1 contient des résultats ferroviaires');
    for (const checkpoint of [value.checkpoint, value.preDecisionCheckpoint]) if (checkpoint !== null) requireValue(checkpoint?.missionId === 'MI01', 'checkpoint v1 inconnu');
    value.world.vesper.rail = createRailDossier();
    value.version = 2;
  }
  if (value.version === 2) {
    requireValue(isObject(value.completed) && Object.keys(value.completed).every(id => ['MI01', 'MI02'].includes(id)), 'dossier v2 contient une mission inconnue');
    requireValue(value.activeMissionId === null || ['MI01', 'MI02'].includes(value.activeMissionId), 'mission active v2 inconnue');
    requireValue(!own(value.world.vesper, 'communications'), 'dossier historique contient un résultat MI03');
    requireValue(isObject(value.fleet) && Object.keys(value.fleet).length === LEGACY_WALKER_IDS.length && LEGACY_WALKER_IDS.every(id => own(value.fleet, id)), 'parc historique incompatible');
    for (const receipt of Object.values(value.completed)) requireValue(LEGACY_WALKER_IDS.includes(receipt?.walkerId), 'rapport historique de châssis inconnu');
    for (const checkpoint of [value.checkpoint, value.preDecisionCheckpoint]) if (checkpoint !== null) {
      requireValue(isObject(checkpoint) && ['MI01', 'MI02'].includes(checkpoint.missionId) && LEGACY_WALKER_IDS.includes(checkpoint.walkerId), 'checkpoint v2 inconnu');
      requireValue(isObject(checkpoint.player) && !own(checkpoint.player, 'reserveAmmo') && !own(checkpoint.player, 'maxReserveAmmo'), 'réserve inattendue dans un checkpoint historique');
      const walker = WALKERS.find(item => item.id === checkpoint.walkerId);
      // v1/v2 reloaded without a reserve. A finite eight-magazine reserve is
      // granted once on migration; loaded rounds, rockets and reload time survive.
      checkpoint.player.reserveAmmo = walker.ammo * 8;
      checkpoint.player.maxReserveAmmo = walker.ammo * 8;
    }
    value.world.vesper.communications = createCommunicationsDossier();
    for (const walker of WALKERS) if (!LEGACY_WALKER_IDS.includes(walker.id)) value.fleet[walker.id] = { hull: walker.hull, feet: Array(walker.legs).fill(100) };
    value.version = 3;
  }
  if (value.version === 3) {
    requireValue(isObject(value.completed) && Object.keys(value.completed).every(id => ['MI01', 'MI02', 'MI03'].includes(id)), 'dossier v3 contient une mission inconnue');
    requireValue(value.activeMissionId === null || ['MI01', 'MI02', 'MI03'].includes(value.activeMissionId), 'mission active v3 inconnue');
    requireValue(!own(value.world.vesper, 'industrial'), 'dossier historique contient un résultat MI04');
    requireValue(isObject(value.fleet) && Object.keys(value.fleet).length === WALKERS.length && WALKERS.every(walker => own(value.fleet, walker.id)), 'parc v3 incompatible');
    for (const condition of Object.values(value.fleet)) {
      requireValue(isObject(condition) && !own(condition, 'radiator'), 'radiateur inattendu dans le parc historique');
      condition.radiator = 100;
    }
    for (const checkpoint of [value.checkpoint, value.preDecisionCheckpoint]) if (checkpoint !== null) {
      requireValue(isObject(checkpoint) && ['MI01', 'MI02', 'MI03'].includes(checkpoint.missionId), 'checkpoint v3 inconnu');
      requireValue(isObject(checkpoint.player) && !own(checkpoint.player, 'radiator'), 'radiateur inattendu dans un checkpoint historique');
      // Earlier versions did not simulate this component. Existing damage, ammo,
      // progress, decisions and RNG are untouched; the new radiator begins intact.
      checkpoint.player.radiator = { health: 100, maxHealth: 100, repairKits: 2, maxRepairKits: 2, repairProgress: 0, repairing: false };
    }
    value.world.vesper.industrial = createIndustrialDossier();
    value.version = 4;
  }
  requireValue(isObject(value.completed) && Object.keys(value.completed).every(id => ['MI01', 'MI02', 'MI03', 'MI04'].includes(id)), 'dossier v4 contient une mission inconnue');
  requireValue(value.activeMissionId === null || ['MI01', 'MI02', 'MI03', 'MI04'].includes(value.activeMissionId), 'mission active v4 inconnue');
  requireValue(!own(value.world, 'nacre'), 'dossier historique contient déjà des résultats de Nacre');
  requireValue(isObject(value.resources) && !own(value.resources, 'fuel'), 'carburant inattendu dans le dossier historique');
  for (const checkpoint of [value.checkpoint, value.preDecisionCheckpoint]) if (checkpoint !== null) {
    requireValue(isObject(checkpoint) && ['MI01', 'MI02', 'MI03', 'MI04'].includes(checkpoint.missionId), 'checkpoint v4 inconnu');
    requireValue(!own(checkpoint, 'channel'), 'chenal inattendu dans un checkpoint de Vesper');
  }
  // No mission state, receipt or workshop condition is rewritten. Vesper v4
  // already contains its exact radiator/ammunition state; Nacre starts unvisited.
  value.world.nacre = { passage: createChannelDossier() };
  value.resources.fuel = 0;
  value.version = CAMPAIGN_SAVE_VERSION;
  return value;
}

function parsedOrNull(text) {
  if (text === null || text === undefined) return null;
  try { return parseCampaign(text); } catch { return null; }
}

function unsupportedDossier(text) {
  if (typeof text !== 'string') return false;
  // An oversized primary cannot be inspected safely. A readable backup is a
  // recovery option, never permission to replace this unexamined dossier.
  if (text.length > MAX_BYTES) return true;
  try {
    const value = JSON.parse(text);
    return isObject(value) && ((typeof value.format === 'string' && value.format !== FORMAT) ||
      (value.format === FORMAT && ![1, 2, 3, 4, CAMPAIGN_SAVE_VERSION].includes(value.version)));
  } catch { return false; }
}

export function readCampaign(storage) {
  if (!storage || typeof storage.getItem !== 'function') return { campaign: createCampaign(), source: 'fresh', available: false, blocked: false, warning: 'Stockage indisponible. Exportez le dossier pour conserver la campagne.' };
  let primary, backup;
  try { primary = storage.getItem(CAMPAIGN_SAVE_KEY); backup = storage.getItem(CAMPAIGN_BACKUP_KEY); }
  catch { return { campaign: createCampaign(), source: 'fresh', available: false, blocked: false, warning: 'Le navigateur refuse le stockage. La campagne reste disponible pour cette session.' }; }
  const current = parsedOrNull(primary);
  if (current) return { campaign: current, source: 'primary', available: true, blocked: false, warning: '' };
  const previous = parsedOrNull(backup);
  if (unsupportedDossier(primary)) return { campaign: previous || createCampaign(), source: previous ? 'backup' : 'fresh', available: true, blocked: true,
    warning: 'Le dossier principal utilise une version, un format ou une taille non pris en charge. Il est conservé, même si une ancienne copie est lisible. Importez un dossier compatible ou choisissez explicitement une nouvelle campagne.' };
  if (previous) return { campaign: previous, source: 'backup', available: true, blocked: false, warning: 'Le dernier enregistrement est illisible. Le précédent dossier valide a été récupéré.' };
  if (primary !== null || backup !== null) return { campaign: createCampaign(), source: 'fresh', available: true, blocked: true, warning: 'Un dossier incompatible ou endommagé a été conservé. Importez un dossier valide ou choisissez explicitement une nouvelle campagne.' };
  return { campaign: createCampaign(), source: 'fresh', available: true, blocked: false, warning: '' };
}

export function writeCampaign(storage, campaign, options = {}) {
  let text;
  try { text = serializeCampaign(campaign); }
  catch (error) { return { ok: false, warning: error.message }; }
  if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') return { ok: false, warning: 'Sauvegarde locale indisponible. Exportez votre dossier.' };
  try {
    const currentText = storage.getItem(CAMPAIGN_SAVE_KEY);
    const backupText = storage.getItem(CAMPAIGN_BACKUP_KEY);
    const current = parsedOrNull(currentText);
    const backup = parsedOrNull(backupText);
    if (!options.replaceInvalid && unsupportedDossier(currentText)) return { ok: false, warning: 'Le dossier principal utilise une version, un format ou une taille non pris en charge. Il est conservé ; confirmez un nouvel import ou une nouvelle campagne pour le remplacer.' };
    if (!options.replaceInvalid && (currentText !== null || backupText !== null) && !current && !backup) return { ok: false, warning: 'Le dossier incompatible est conservé. Une nouvelle campagne ou un import explicite est nécessaire.' };
    // setItem replaces one key atomically. Keep a validated older primary before
    // replacing it; if any write fails, one complete valid record survives.
    if (current && currentText !== text) storage.setItem(CAMPAIGN_BACKUP_KEY, currentText);
    storage.setItem(CAMPAIGN_SAVE_KEY, text);
    if (storage.getItem(CAMPAIGN_SAVE_KEY) !== text) return { ok: false, warning: 'Le navigateur n’a pas confirmé l’enregistrement. Exportez le dossier.' };
    return { ok: true, warning: '' };
  } catch {
    return { ok: false, warning: 'Écriture locale refusée ou espace insuffisant. Le précédent dossier valide est conservé ; exportez la partie en cours.' };
  }
}

export function beginCampaignMission(campaign, options = {}) {
  validateCampaign(campaign);
  const missionId = options.missionId || nextCampaignMissionId(campaign) || MISSION_IDS.at(-1);
  if (!MISSION_IDS.includes(missionId)) return { ok: false, campaign, game: null, replay: false, message: 'Ce dossier de mission n’est pas disponible.' };
  if (missionId === 'MI02' && !campaign.completed.MI01) return { ok: false, campaign, game: null, replay: false, message: 'Terminez le couloir quarante-deux avant de rejoindre le viaduc.' };
  if (missionId === 'MI03' && !campaign.completed.MI02) return { ok: false, campaign, game: null, replay: false, message: 'Terminez le dossier du train avant de rejoindre les émetteurs de Vesper.' };
  if (missionId === 'MI04' && !campaign.completed.MI03) return { ok: false, campaign, game: null, replay: false, message: 'Terminez le constat des émetteurs avant de rejoindre la station industrielle.' };
  if (missionId === 'MI05' && !campaign.completed.MI04) return { ok: false, campaign, game: null, replay: false, message: 'Terminez le dossier de Vesper avant de rejoindre le chenal de Nacre.' };
  const walkerId = WALKERS.some(walker => walker.id === options.walkerId) ? options.walkerId : WALKERS[0].id;
  const replay = Boolean(options.replay || own(campaign.completed, missionId));
  if (!replay && campaign.stage === 'mission' && !options.restart) return { ok: false, campaign, game: null, replay: false, message: 'Une sortie est déjà en cours. Reprenez-la ou recommencez-la explicitement.' };
  const campaignContext = campaignContextFor(campaign, missionId);
  const game = createGame({ missionId, walkerId, difficulty: options.difficulty, assist: options.assist, seed: options.seed, campaignContext });
  requireValue(game.missionId === missionId, 'mission de campagne indisponible');
  if (replay) return { ok: true, campaign, game, replay: true, message: 'Rejeu d’entraînement : le dossier de campagne reste inchangé.' };
  const next = clone(campaign);
  const condition = next.fleet[walkerId];
  game.player.hull = condition.hull;
  game.player.radiator.health = condition.radiator;
  game.player.feet.forEach((foot, index) => { foot.health = condition.feet[index]; });
  next.stage = 'mission'; next.activeMissionId = missionId; next.revision++;
  next.checkpoint = clone(game); next.preDecisionCheckpoint = null;
  validateCampaign(next);
  const message = missionId === 'MI01' ? 'Le couloir quarante-deux est ouvert au déploiement.'
    : missionId === 'MI02' ? 'Le dossier du viaduc est ouvert. Retrouvez le train et ceux qu’il transporte.'
      : missionId === 'MI03' ? 'Les émetteurs de Vesper sont accessibles. Identifiez chaque signal avant de rendre votre compte rendu.'
        : missionId === 'MI04' ? 'La station industrielle est accessible. Refroidissez les turbines et relevez ce qui reste du journal de maintenance.'
          : 'L’affectation de Nacre est ouverte. Libérez le chenal et vérifiez les deux équipages avant de signer votre rapport.';
  return { ok: true, campaign: next, game, replay: false, message };
}

export function checkpointCampaign(campaign, game, options = {}) {
  validateCampaign(campaign);
  if (options.replay || own(campaign.completed, game?.missionId) || game?.status !== 'playing') return campaign;
  requireValue(campaign.stage === 'mission' && campaign.activeMissionId === game.missionId, 'aucune campagne active pour cette mission');
  const snapshot = clone(game);
  validateGame(snapshot);
  const next = clone(campaign);
  next.checkpoint = snapshot; next.revision++;
  if ((options.beforeDecision || snapshot.decision.active) && snapshot.decision.active && !next.preDecisionCheckpoint) next.preDecisionCheckpoint = clone(snapshot);
  validateCampaign(next);
  return next;
}

export function restoreCampaignGame(campaign, options = {}) {
  validateCampaign(campaign);
  if (campaign.stage !== 'mission' || own(campaign.completed, campaign.activeMissionId)) return null;
  const snapshot = options.beforeDecision ? campaign.preDecisionCheckpoint : campaign.checkpoint;
  return snapshot ? clone(validateGame(snapshot)) : null;
}

function crewLines(game) {
  const mission = game.campaign;
  if (game.missionId === 'MI05') {
    const passage = mission.refugeesLost === 0
      ? 'Les douze passagers ont atteint le quai. Ils sont descendus par leurs propres moyens ; le chenal est resté ouvert assez longtemps.'
      : mission.refugeesPassed === 0 ? 'Le bateau n’a pas atteint le quai. Douze passagers sont morts ; libérer les câbles n’a pas suffi à les protéger.'
        : `${mission.refugeesPassed} passagers ont atteint le quai. ${mission.refugeesLost} autres sont morts pendant la traversée.`;
    const crew = mission.bargeCiviliansLost ? ` ${mission.bargeCiviliansLost} membres de Rive-Courte ont aussi été tués. Leurs pertes restent inscrites.` : '';
    const captain = mission.traffickingVerified
      ? 'La facture de la barge Saisie porte un prix par personne. Nous en avons conservé le relevé.'
      : 'La barge Saisie a été inspectée après sa destruction. Nous n’avons pas de facture à joindre.';
    const smuggler = mission.smugglerVerified
      ? ' Vann Ostre a répondu depuis Rive-Courte : son équipage faisait sortir des familles. Ce contact appartient à cet équipage, pas à toute la flotte des Brisants.'
      : ' Aucun échange n’a pu établir le rôle de Rive-Courte ; ses ruines ne nous donnent pas cette certitude.';
    const fuel = mission.fuelRecovered ? ' Deux lots de carburant ont été chargés au dépôt.' : ' Aucun carburant n’a été chargé.';
    return { tessLine: `${passage}${crew}${fuel}`, samiLine: `${captain}${smuggler} ${mission.reportFiled ? 'Tu as joint ces constatations au rapport signé.' : 'Le rapport confirme le passage ; les constatations restent dans notre dossier.'}` };
  }
  if (game.missionId === 'MI04') {
    const record = mission.logRecovered
      ? 'Le journal copié date le remplacement de la pièce avant le rejet. La demande porte une référence militaire. Cette anomalie technique ne suffit pas encore à expliquer l’ensemble des incidents.'
      : 'Le poste est détruit et son journal a disparu. Les turbines sont sûres, mais il faudra trouver une autre source technique ; le constat des ruines ne remplace pas les pages perdues.';
    const aid = mission.coolingAssistance ? ' Les consignes des ouvriers secourus ont raccourci le refroidissement.' : ' Le refroidissement a suivi la procédure complète, sans l’aide des ouvriers du train.';
    const contact = mission.witnessContacted
      ? 'Le contact du dispensaire a répondu pendant cette sortie. Cet échange est désormais consigné.'
      : mission.context.witnessAvailable ? 'Le canal du dispensaire était accessible, mais aucun échange n’a eu lieu pendant cette sortie.' : 'Aucun contact du dispensaire n’était accessible pendant cette sortie.';
    const forwarding = mission.reportFiled
      ? ' Le constat technique a été joint au rapport signé.' : ' Holt a reçu le dossier scellé ; le compte rendu ne diffuse pas le constat technique.';
    const copy = mission.logRecovered && !mission.maintenanceIntact ? ' La copie du journal survit à la destruction ultérieure du poste.' : '';
    return { tessLine: `${record}${aid}${copy}`, samiLine: `${contact}${forwarding}` };
  }
  if (game.missionId === 'MI03') {
    const casualties = mission.residentsLost === 0 ? 'Les habitants sont restés à l’abri.'
      : `${mission.residentsLost} ${mission.residentsLost === 1 ? 'habitant est mort' : 'habitants sont morts'}. Le rapport garde ce bilan, même si une antenne fonctionne encore.`;
    const networkLine = mission.civilRelaysOnline === 2 ? 'Les deux relais civils répondent encore.'
      : mission.civilRelaysOnline === 1 ? 'Un seul relais civil répond encore ; le réseau est partiellement coupé.' : 'Les deux relais civils se sont tus.';
    const tessLine = `${networkLine} ${casualties}`;
    const accessLine = mission.witnessAvailable
      ? 'Le dispensaire peut encore être contacté. Cela nous laisse un accès possible pour une rencontre ultérieure, pas un témoignage déjà recueilli.'
      : mission.dispensaryIntact ? 'Le bâtiment du dispensaire tient encore, mais son accès radio est perdu.' : 'Le dispensaire est détruit. Une signature ne le remettra pas debout.';
    const samiLine = `${accessLine} ${mission.reportFiled ? 'Tu as joint les constatations au rapport signé.' : 'Holt a reçu la confirmation de la coupure intégrale.'}${mission.holtAlerted ? ' Le contrôle de Holt a relevé la durée des vérifications.' : ''}`;
    return { tessLine, samiLine };
  }
  if (game.missionId === 'MI02') {
    const survivors = mission.hostagesRescued === 1 ? 'Un ouvrier a rejoint le quai' : `${mission.hostagesRescued} ouvriers ont rejoint le quai`;
    const losses = mission.hostagesLost === 1 ? 'un autre est mort dans le wagon' : `${mission.hostagesLost} autres sont morts dans le wagon`;
    const tessLine = mission.hostagesLost === 0
      ? 'Les huit ouvriers sont descendus du wagon. Les freins ont tenu ; on a pu ouvrir les portes sans tirer dans les tôles.'
      : mission.hostagesRescued === 0
        ? 'Le train est à l’arrêt. Personne n’est sorti vivant du wagon. Le minerai récupéré ne compensera jamais ces huit morts, Sera.'
        : `${survivors} ; ${losses}. Je garde leurs places dans le bilan, Sera.`;
    const evidenceLine = mission.evidencePreserved
      ? 'Les noms et le prix sont encore lisibles sur le registre.'
      : 'Le registre a brûlé dans le wagon. Ce que nous avons vu ne remplace pas les pages perdues.';
    const samiLine = mission.recordFiled
      ? `${evidenceLine} Tu as joint leur séquestration au rapport signé. Cette fois, personne ne pourra dire que le train ne transportait que du minerai.`
      : `${evidenceLine} Holt a reçu son train. Le rapport classe encore les ouvriers comme passagers sans titre.`;
    return { tessLine, samiLine };
  }
  const tessLine = !mission.pipeIntact
    ? 'La conduite a cédé sous un appui. Deux lots de raccords et une équipe : sans ça, les maisons en aval restent coupées.'
    : 'La conduite tient. Tu as laissé un passage au camion et à ceux qui reviendront derrière nous.';
  const samiLine = mission.noticeFiled
    ? 'Tu as joint les Cales-Basses au bordereau. Ce n’est pas encore une livraison, mais leur nom est enfin sur une feuille signée.'
    : 'Les vingt-quatre caisses sont au poste. Pour les Cales-Basses, je n’ai toujours ni ligne ni date à leur donner.';
  return {
    tessLine: game.stats.collateral > 0 ? `${tessLine} Les pertes civiles restent au rapport ; des raccords ne les effacent pas.` : tessLine,
    samiLine,
  };
}

export function finishCampaignMission(campaign, game, options = {}) {
  validateCampaign(campaign);
  if (options.replay || own(campaign.completed, game?.missionId)) return { ok: true, campaign, receipt: campaign.completed[game?.missionId] || campaign.lastDebrief, applied: false, message: 'Rejeu terminé. Le rapport de campagne et les lots restent inchangés.' };
  if (game?.status !== 'won') return { ok: true, campaign, receipt: null, applied: false, message: 'Aucune sortie validée. Le dernier checkpoint reste disponible.' };
  requireValue(campaign.stage === 'mission' && campaign.activeMissionId === game.missionId, 'aucune sortie officielle en cours pour cette mission');
  validateGame(clone(game), true);
  const next = clone(campaign), mission = game.campaign;
  const commonReceipt = {
    missionId: game.missionId, missionName: game.mission.name, walkerId: game.walkerId, walkerName: `${game.walker.designation} ${game.walker.name}`,
    hull: game.player.hull, integrity: game.player.hull / game.player.maxHull,
    elapsed: game.elapsed, collateral: game.stats.collateral, kills: game.stats.kills, choice: game.decision.choice,
    partsGranted: DELIVERY_PARTS, ...crewLines(game),
  };
  const receipt = game.missionId === 'MI05' ? {
    ...commonReceipt, ...Object.fromEntries(Object.keys(createChannelDossier()).map(key => [key, mission[key]])),
    decisionLabel: mission.reportFiled ? 'Sort des passagers et constat des deux équipages joints au rapport' : 'Passage confirmé au bordereau impérial',
  } : game.missionId === 'MI04' ? {
    ...commonReceipt, ...Object.fromEntries(Object.keys(createIndustrialDossier()).map(key => [key, mission[key]])),
    decisionLabel: mission.reportFiled ? 'Constat de maintenance joint au rapport signé' : 'Dossier de maintenance remis sous scellés',
  } : game.missionId === 'MI03' ? {
    ...commonReceipt, signalsIdentified: mission.signalsIdentified, militaryRelayDisabled: mission.militaryRelayDisabled,
    verifiedBuildings: mission.verifiedBuildings, networkPreserved: mission.networkPreserved,
    civilRelaysOnline: mission.civilRelaysOnline, dispensaryIntact: mission.dispensaryIntact,
    witnessAvailable: mission.witnessAvailable, residentsLost: mission.residentsLost,
    holtAlerted: mission.holtAlerted, reportFiled: mission.reportFiled,
    decisionLabel: mission.reportFiled ? 'Constat des bâtiments joint au rapport signé' : 'Ordre de coupure intégrale confirmé',
  } : game.missionId === 'MI02' ? {
    ...commonReceipt, trainIntegrity: game.train.hp / game.train.maxHp, trainStopped: mission.trainStopped,
    harpoonsReleased: mission.harpoonsReleased, hostagesTotal: mission.hostagesTotal,
    hostagesRescued: mission.hostagesRescued, hostagesLost: mission.hostagesLost,
    evidencePreserved: mission.evidencePreserved, recordFiled: mission.recordFiled,
    decisionLabel: mission.recordFiled ? 'Séquestration des ouvriers jointe au rapport signé' : 'Récupération du train classée au bordereau impérial',
  } : {
    ...commonReceipt, convoyIntegrity: game.convoy.hp / game.convoy.maxHp, route: mission.route,
    pipeIntact: mission.pipeIntact, noticeFiled: mission.noticeFiled, choice: game.decision.choice,
    decisionLabel: mission.noticeFiled ? 'Signalement des Cales-Basses joint au bordereau' : 'Bordereau prévu clos sans signalement',
    filtersDeliveredCount: mission.filtersDeliveredCount, partsGranted: DELIVERY_PARTS,
    pipeRepairCost: mission.pipeIntact ? 0 : PIPE_PARTS,
  };
  next.completed[game.missionId] = receipt; next.lastDebrief = clone(receipt);
  next.stage = 'complete'; next.activeMissionId = null; next.checkpoint = null; next.revision++;
  next.resources.parts += DELIVERY_PARTS;
  next.fleet[game.walkerId] = { hull: game.player.hull, feet: game.player.feet.map(foot => foot.health), radiator: game.player.radiator.health };
  if (game.missionId === 'MI05') {
    next.world.nacre.passage = Object.fromEntries(Object.keys(createChannelDossier()).map(key => [key, mission[key]]));
    next.resources.fuel += mission.fuelLots;
    next.authority.suspicion = clamp(next.authority.suspicion + (mission.reportFiled ? 2 : 0), 0, 100);
    next.crew.tess.trust = clamp(next.crew.tess.trust + (mission.refugeesLost ? -mission.refugeesLost : 2) - mission.bargeCiviliansLost, 0, 100);
    next.crew.sami.trust = clamp(next.crew.sami.trust + (mission.reportFiled ? 2 : 0) + (mission.smugglerVerified ? 1 : 0) - mission.refugeesLost - mission.bargeCiviliansLost, 0, 100);
  } else if (game.missionId === 'MI04') {
    next.world.vesper.industrial = Object.fromEntries(Object.keys(createIndustrialDossier()).map(key => [key, mission[key]]));
    next.authority.suspicion = clamp(next.authority.suspicion + (mission.reportFiled ? 2 : 0), 0, 100);
    next.crew.tess.trust = clamp(next.crew.tess.trust + (mission.logRecovered ? 3 : 0), 0, 100);
    next.crew.sami.trust = clamp(next.crew.sami.trust + (mission.reportFiled ? 2 : 0) + (mission.witnessContacted ? 1 : 0), 0, 100);
  } else if (game.missionId === 'MI03') {
    next.world.vesper.communications = Object.fromEntries(Object.keys(createCommunicationsDossier()).map(key => [key, mission[key]]));
    next.authority.suspicion = clamp(next.authority.suspicion + (mission.reportFiled ? 2 : 0) + (mission.holtAlerted ? 1 : 0), 0, 100);
    next.crew.tess.trust = clamp(next.crew.tess.trust + (mission.residentsLost ? -mission.residentsLost : 2), 0, 100);
    next.crew.sami.trust = clamp(next.crew.sami.trust + (mission.reportFiled ? 2 : 0) + (mission.witnessAvailable ? 1 : 0) - mission.residentsLost, 0, 100);
  } else if (game.missionId === 'MI02') {
    next.world.vesper.rail = { trainRecovered: true, hostagesRescued: mission.hostagesRescued, hostagesLost: mission.hostagesLost,
      evidencePreserved: mission.evidencePreserved, recordFiled: mission.recordFiled, brisantsEncountered: true };
    next.authority.suspicion = clamp(next.authority.suspicion + (mission.recordFiled ? 2 : 0), 0, 100);
    next.crew.tess.trust = clamp(next.crew.tess.trust + (mission.hostagesLost ? -mission.hostagesLost : 3), 0, 100);
    next.crew.sami.trust = clamp(next.crew.sami.trust + (mission.recordFiled ? 3 : 0) + (mission.hostagesLost ? -mission.hostagesLost : 2), 0, 100);
  } else {
    next.world.vesper = { ...next.world.vesper, pipeIntact: mission.pipeIntact, pipeRepaired: false, servicesInterrupted: !mission.pipeIntact,
      filtersDelivered: true, filtersDeliveredCount: mission.filtersDeliveredCount, calesBassesExcluded: true, noticeFiled: mission.noticeFiled };
    next.authority.reportFiled = mission.noticeFiled;
    // These local reports never imply knowledge of the later PALINODE program.
    next.authority.suspicion = mission.noticeFiled ? 1 : 0;
    next.crew.tess.trust = clamp(next.crew.tess.trust + (mission.pipeIntact ? 2 : -2) - game.stats.collateral * 2, 0, 100);
    next.crew.sami.trust = clamp(next.crew.sami.trust + 2 + (mission.noticeFiled ? 2 : 0) - game.stats.collateral * 2, 0, 100);
  }
  validateCampaign(next);
  const action = game.missionId === 'MI01' ? 'Livraison inscrite au dossier.'
    : game.missionId === 'MI02' ? 'Récupération du train inscrite au dossier.' : game.missionId === 'MI03' ? 'Constat des émetteurs inscrit au dossier.'
      : game.missionId === 'MI04' ? 'Constat de maintenance inscrit au dossier. L’arc de Vesper est achevé.' : 'Le passage de Nacre et le sort des équipages sont inscrits au dossier.';
  return { ok: true, campaign: next, receipt, applied: true, message: `${action} Quatre lots d’atelier ont été affectés au retour.` };
}

export function campaignRepairCost(campaign, walkerId) {
  const walker = WALKERS.find(item => item.id === walkerId);
  const condition = campaign?.fleet?.[walkerId];
  if (!walker || !condition || !Array.isArray(condition.feet)) return 0;
  const hullDamage = Math.max(0, 1 - condition.hull / walker.hull);
  const footDamage = condition.feet.reduce((sum, health) => sum + Math.max(0, 1 - health / 100), 0) / walker.legs;
  const radiatorDamage = Math.max(0, 1 - condition.radiator / 100);
  return Math.min(6, Math.ceil(hullDamage * 4 + footDamage * 2 + radiatorDamage * 2));
}

export function serviceCampaignWalker(campaign, walkerId) {
  validateCampaign(campaign);
  const walker = WALKERS.find(item => item.id === walkerId);
  if (!walker) return { ok: false, campaign, cost: 0, message: 'Ce châssis ne figure pas au registre du hangar.' };
  if (campaign.stage === 'mission') return { ok: false, campaign, cost: 0, message: 'Le marcheur doit revenir au hangar avant une intervention.' };
  const cost = campaignRepairCost(campaign, walkerId);
  if (!cost) return { ok: false, campaign, cost: 0, message: 'La coque, les appuis et le radiateur sont déjà en état. Aucun lot dépensé.' };
  if (campaign.resources.parts < cost) return { ok: false, campaign, cost, message: `Il manque ${cost - campaign.resources.parts} lot(s) d’atelier pour cette intervention.` };
  const next = clone(campaign);
  next.resources.parts -= cost; next.revision++;
  next.fleet[walkerId] = { hull: walker.hull, feet: Array(walker.legs).fill(100), radiator: 100 };
  const message = `${walker.designation} ${walker.name} : coque, appuis et radiateur remis en état, ${cost} lot(s) d’atelier utilisés.`;
  next.maintenanceLog.push({ type: 'walker', walkerId, cost, message });
  validateCampaign(next);
  return { ok: true, campaign: next, cost, message };
}

export function repairCampaignPipe(campaign) {
  validateCampaign(campaign);
  if (campaign.stage === 'mission') return { ok: false, campaign, cost: 0, message: 'L’équipe de Tess doit revenir au hangar avant cette intervention.' };
  if (!campaign.completed.MI01 || !campaign.world.vesper.servicesInterrupted) return { ok: false, campaign, cost: 0, message: 'Aucune conduite ne nécessite cette intervention.' };
  if (campaign.resources.parts < PIPE_PARTS) return { ok: false, campaign, cost: PIPE_PARTS, message: 'Deux lots de raccords sont nécessaires pour rétablir la conduite.' };
  const next = clone(campaign);
  next.resources.parts -= PIPE_PARTS; next.revision++;
  next.world.vesper.pipeRepaired = true; next.world.vesper.servicesInterrupted = false;
  const message = 'Deux lots de raccords remis à l’équipe de Tess. La conduite des maisons en aval est rétablie ; l’incident reste dans le rapport.';
  next.maintenanceLog.push({ type: 'pipe', cost: PIPE_PARTS, message });
  validateCampaign(next);
  return { ok: true, campaign: next, cost: PIPE_PARTS, message };
}
