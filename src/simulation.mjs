import { WALKERS, MISSIONS, ALL_MISSIONS, ENEMY_TYPES, DIFFICULTIES } from './content.mjs';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
const lerp = (a, b, t) => a + (b - a) * t;
const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;

export function terrainAt(x, planetId = 'PL01') {
  if (planetId === 'PL02') return 681 + Math.sin(x / 290) * 5 + Math.sin(x / 80) * 1.5;
  if (planetId === 'PL03') return 680 + Math.sin(x / 260) * 19 + Math.sin(x / 79) * 5;
  return 681 + Math.sin(x / 320) * 12 + Math.sin(x / 105) * 4;
}

function random(s) {
  s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}

function emit(s, type, text = '', x, y) {
  const event = { id: ++s.eventId, type, text, time: s.elapsed };
  if (x !== undefined) event.x = x;
  if (y !== undefined) event.y = y;
  s.events.push(event);
  if (s.events.length > 90) s.events.splice(0, s.events.length - 90);
}

function particles(s, x, y, type = 'spark', count = 10) {
  const palette = { spark: '#ffd09a', smoke: '#6d7478', dust: '#bea58c', blast: '#f4a56d' };
  for (let i = 0; i < count && s.particles.length < 400; i++) {
    const angle = random(s) * Math.PI * 2;
    const speed = 30 + random(s) * (type === 'dust' ? 65 : 220);
    const life = type === 'smoke' ? 0.9 + random(s) : 0.22 + random(s) * 0.5;
    s.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 40,
      life, maxLife: life, size: type === 'smoke' ? 10 + random(s) * 15 : 2 + random(s) * 4,
      type, color: palette[type] || palette.spark });
  }
}

function enemy(s, type, x, index) {
  const def = ENEMY_TYPES[type];
  const maxHp = Math.round(def.hp * s.difficulty.enemyHealth);
  return {
    ...def, type, id: `enemy-${index}`, x, spawnX: x,
    y: terrainAt(x, s.planetId) - def.h / 2 - (type === 'drone' ? 190 : 0),
    hp: maxHp, maxHp, active: false, dead: false, facing: -1,
    telegraph: 0, attackTarget: 'player', timer: 0.8 + random(s) * 2,
    flash: 0, phase: 'idle', armor: type === 'boss' ? 0.24 : type === 'buggy' ? 0.14 : 0,
    targetX: 0, targetY: 0, dronePhase: random(s) * Math.PI * 2,
  };
}

function spawnEnemies(s) {
  const plans = {
    op01: [[850, 'rifle'], [1190, 'rocket'], [1510, 'rifle'], [1990, 'drone'], [2350, 'buggy'], [2770, 'rocket'], [3020, 'rifle'], [3520, 'turret'], [3870, 'rifle'], [4510, 'buggy'], [4770, 'rocket'], [5250, 'drone']],
    op02: [[1000, 'rifle'], [1320, 'rocket'], [1630, 'buggy'], [2050, 'drone'], [2470, 'rifle'], [2790, 'rocket'], [3180, 'buggy'], [3710, 'rifle'], [4060, 'drone'], [4410, 'rocket'], [4730, 'buggy'], [5170, 'rifle'], [5580, 'rocket']],
    op03: [[980, 'fauna'], [1300, 'rifle'], [1650, 'drone'], [1980, 'rocket'], [2370, 'turret'], [2800, 'rifle'], [3700, 'fauna'], [4250, 'boss'], [5130, 'rocket'], [5440, 'drone']],
  };
  return (s.mission.enemyPlan || plans[s.missionId]).map(([x, type], i) => enemy(s, type, x, i));
}

export function createGame(options = {}) {
  const walker = WALKERS.find(w => w.id === options.walkerId) || WALKERS[0];
  const mission = ALL_MISSIONS.find(m => m.id === options.missionId) || MISSIONS[0];
  const difficultyId = Object.hasOwn(DIFFICULTIES, options.difficulty) ? options.difficulty : 'normal';
  const offsets = walker.legs === 2 ? [-38, 38] : walker.legs === 4 ? [-71, 71, -89, 89] : [-88, 0, 88, -105, 5, 105];
  const startX = 300;
  const feet = offsets.map((homeOffset, index) => ({
    id: `foot-${index}`, index, group: walker.legs === 4 ? [0, 1, 1, 0][index] : index % 2, side: index < walker.legs / 2 ? 'back' : 'front',
    homeOffset, x: startX + homeOffset, y: terrainAt(startX + homeOffset, mission.planetId),
    phase: 'stance', progress: 1, contact: true, fromX: startX + homeOffset,
    fromY: terrainAt(startX + homeOffset, mission.planetId), targetX: startX + homeOffset,
    targetY: terrainAt(startX + homeOffset, mission.planetId), health: 100, maxHealth: 100,
  }));
  const seed = Number.isInteger(options.seed) ? options.seed >>> 0 : 1847;
  const state = {
    version: 1, mission, walker, missionId: mission.id, walkerId: walker.id, planetId: mission.planetId,
    difficultyId, difficulty: DIFFICULTIES[difficultyId], seed, rng: seed,
    assist: options.assist !== false, elapsed: 0, status: 'playing', outcome: '',
    player: {
      x: startX, y: terrainAt(startX, mission.planetId) - walker.height, width: walker.width,
      height: walker.legs === 2 ? 70 : 62, groundY: terrainAt(startX, mission.planetId),
      facing: 1, aimAngle: 0, hull: walker.hull, maxHull: walker.hull, armor: walker.armor,
      heat: 0, energy: 100, stability: 100, ammo: walker.ammo, maxAmmo: walker.ammo,
      reserveAmmo: walker.ammo * 8, maxReserveAmmo: walker.ammo * 8,
      radiator: { health: 100, maxHealth: 100, repairKits: 2, maxRepairKits: 2, repairProgress: 0, repairing: false },
      rockets: walker.rockets, maxRockets: walker.rockets, reloadTime: 0,
      venting: false, braced: false, overheated: false, speed: 0, feet,
      stepCooldown: 0, lastGroup: -1, fireCooldown: 0, rocketCooldown: 0,
      flash: 0, aimX: 1000, aimY: 570, move: 0, anchorX: startX,
    },
    enemies: [], projectiles: [], particles: [], events: [], eventId: 0, entityId: 0,
    relays: (mission.relayPositions || []).map((x, i) => ({ id: `relay-${i}`, x,
      y: terrainAt(x, mission.planetId) - 78, w: 56, h: 156,
      hp: 180, maxHp: 180, destroyed: false, flash: 0 })),
    convoy: mission.type === 'escort' ? { x: 175, y: terrainAt(175, mission.planetId) - 32,
      w: 112, h: 64, hp: 640, maxHp: 640, speed: 57, moving: false, arrived: false,
      label: mission.convoyLabel || 'CONVOI CIVIL', cargo: mission.cargoCount || 0, waitTime: 0 } : null,
    civilians: (mission.civilianPositions || [2150, 2220, 4580]).map((x, i) => ({
      id: `civilian-${i + 1}`, x, y: terrainAt(x, mission.planetId) - 17, w: 18, h: 34,
      hp: 50, alive: true, safe: false, fleeing: false,
    })),
    evidence: { id: `${mission.id}-evidence`, x: mission.evidenceX, y: terrainAt(mission.evidenceX, mission.planetId) - 48,
      collected: false, scanning: false, scanProgress: 0, scanTime: 2.4, label: mission.evidenceLabel || 'REGISTRE DE TRANSMISSIONS' },
    pickups: (mission.supplyPositions || [1850, 3850, 5350]).map((x, i) => ({ id: `supply-${i}`, x, y: terrainAt(x, mission.planetId) - 20, type: 'repair', collected: false })),
    decision: { active: false, resolved: false, choice: null, title: mission.decision.title, body: mission.decision.body,
      options: [{ id: 'obey', label: mission.decision.obey }, { id: 'defy', label: mission.decision.defy }] },
    objectives: [], extraction: { x: mission.extractionX, y: terrainAt(mission.extractionX, mission.planetId), active: false, radius: 110 },
    stats: { kills: 0, shots: 0, hits: 0, steps: 0, collateral: 0, damageTaken: 0, evidence: 0, ordersObeyed: 0, ordersDefied: 0, score: 0 },
    interaction: '', cameraShake: 0, lastStepGroup: -1, checkpointText: 'Ordre reçu. Appuis au sol.',
    inputHeld: {}, notified: {}, nextStep: 0, bossReleased: false,
    campaign: mission.id === 'MI01' ? {
      missionId: mission.id, phase: 'approach', route: 'unresolved', pipeIntact: true, pipeDamage: 0,
      passageSecured: false, passageProgress: 0, passageWorking: false, filtersDelivered: false,
      filtersDeliveredCount: 0, manifestRead: false, noticeFiled: false, repairCost: 0,
      deliveryTime: null, convoyIntegrity: 1, tutorial: { stepped: false, braced: false },
    } : null,
  };
  if (mission.id === 'MI02') {
    const previous = options.campaignContext || {};
    const context = {
      pipeIntact: previous.pipeIntact !== false,
      pipeRepaired: previous.pipeRepaired === true,
      noticeFiled: previous.noticeFiled === true,
      servicesInterrupted: previous.servicesInterrupted === true,
    };
    state.campaign = {
      missionId: 'MI02', phase: 'approach', harpoonsReleased: 0, trainStopped: false,
      hostagesTotal: mission.train.hostages, hostagesRescued: 0, hostagesLost: 0,
      rescueProgress: 0, rescueWorking: false, rescueResolved: false,
      manifestRead: false, evidencePreserved: true, recordFiled: false, trainIntegrity: 1,
      context, tutorial: { stepped: false, braced: false },
    };
    const x = mission.train.startX;
    state.train = {
      id: 'vesper-ore-train', x, y: terrainAt(x, mission.planetId) - 58,
      w: 154, h: 92, hp: 900, maxHp: 900, speed: mission.train.speed,
      moving: false, stopped: false, destroyed: false, brakeProgress: 0, brakeWorking: false,
      breakX: mission.train.breakX,
      wagons: [
        { id: 'ore-wagon', kind: 'ore', offset: -178, x: x - 178, y: terrainAt(x - 178, mission.planetId) - 44,
          w: 150, h: 64, hp: 500, maxHp: 500, destroyed: false },
        { id: 'hostage-wagon', kind: 'hostages', offset: -352, x: x - 352, y: terrainAt(x - 352, mission.planetId) - 52,
          w: 160, h: 80, hp: 360, maxHp: 360, destroyed: false },
      ],
      harpoons: mission.train.harpoonPositions.map((stationX, index) => ({
        id: `harpoon-${index + 1}`, x: stationX, y: terrainAt(stationX, mission.planetId) - 22,
        released: false, progress: 0, working: false,
      })),
    };
    const wagon = state.train.wagons.find(item => item.kind === 'hostages');
    state.evidence.x = wagon.x; state.evidence.y = wagon.y - 18;
  }
  if (mission.id === 'MI03') {
    const previous = options.campaignContext || {};
    const context = {
      pipeIntact: previous.pipeIntact !== false, pipeRepaired: previous.pipeRepaired === true,
      noticeFiled: previous.noticeFiled === true, servicesInterrupted: previous.servicesInterrupted === true,
      railRecordFiled: previous.railRecordFiled === true,
      railHostagesRescued: Number.isInteger(previous.railHostagesRescued) ? clamp(previous.railHostagesRescued, 0, 8) : 0,
      railHostagesLost: Number.isInteger(previous.railHostagesLost) ? clamp(previous.railHostagesLost, 0, 8) : 0,
    };
    state.campaign = { missionId: 'MI03', phase: 'approach', signalsIdentified: 0,
      militaryRelayDisabled: false, verifiedBuildings: 0, networkPreserved: false,
      civilRelaysOnline: 2, dispensaryIntact: true, witnessAvailable: false, residentsLost: 0,
      holtAlerted: false, reportFiled: false, manifestRead: false, context,
      tutorial: { stepped: false, braced: false } };
    state.network = { scrutinyElapsed: 0, scrutinyTriggered: false,
      stations: mission.network.stations.map(def => ({
        id: def.id, kind: def.kind, x: def.x, y: terrainAt(def.x, mission.planetId) - def.h / 2,
        w: def.w, h: def.h, hp: def.hp, maxHp: def.hp, destroyed: false, flash: 0,
        identified: false, verified: false, scanProgress: 0, scanning: false,
        disabled: false, secured: false, population: def.population, casualties: 0,
        disabling: false, disableProgress: 0,
      })) };
  }
  if (mission.id === 'MI04') {
    const previous = options.campaignContext || {};
    const context = {
      pipeIntact: previous.pipeIntact !== false, pipeRepaired: previous.pipeRepaired === true,
      noticeFiled: previous.noticeFiled === true, servicesInterrupted: previous.servicesInterrupted === true,
      railRecordFiled: previous.railRecordFiled === true,
      railHostagesRescued: Number.isInteger(previous.railHostagesRescued) ? clamp(previous.railHostagesRescued, 0, 8) : 0,
      railHostagesLost: Number.isInteger(previous.railHostagesLost) ? clamp(previous.railHostagesLost, 0, 8) : 8,
      dispensaryIntact: previous.dispensaryIntact === true, witnessAvailable: previous.witnessAvailable === true,
      civilRelaysOnline: Number.isInteger(previous.civilRelaysOnline) ? clamp(previous.civilRelaysOnline, 0, 2) : 0,
    };
    const settings = mission.industrial;
    const connected = (context.pipeIntact || context.pipeRepaired) && !context.servicesInterrupted;
    const contactAvailable = context.witnessAvailable && context.dispensaryIntact && context.civilRelaysOnline > 0;
    state.campaign = { missionId: 'MI04', phase: 'approach', coolantRestored: connected,
      coolingAssistance: context.railHostagesRescued > 0, turbinesCooled: 0, maintenanceInspected: false,
      manifestRead: false, logRecovered: false, technicalEvidence: false, evidenceSource: 'none',
      alternativeSourceNeeded: false, witnessContacted: false, reportFiled: false, maintenanceIntact: true,
      context, tutorial: { stepped: false, braced: false } };
    state.industrial = {
      pump: { id: 'coolant-pump', x: settings.pumpX, y: terrainAt(settings.pumpX, mission.planetId) - 25,
        w: 72, h: 50, connected, working: false, progress: connected ? 1 : 0 },
      turbines: settings.turbineXs.map((x, i) => ({ id: `turbine-${i + 1}`, x, y: terrainAt(x, mission.planetId) - 63,
        w: 90, h: 126, temperature: 90, cooled: false, working: false, progress: 0 })),
      contact: { id: 'dispensary-contact', x: settings.contactX, y: terrainAt(settings.contactX, mission.planetId) - 32,
        w: 44, h: 64, available: contactAvailable, working: false, progress: 0, contacted: false },
      post: { id: 'maintenance-post', x: settings.postX, y: terrainAt(settings.postX, mission.planetId) - 80,
        w: 152, h: 160, hp: 480, maxHp: 480, destroyed: false, flash: 0 },
      retreatTriggered: false, retreatEscaped: false,
    };
  }
  state.enemies = spawnEnemies(state);
  if (mission.id === 'MI03') {
    const observer = enemy(state, 'drone', 3200, state.enemies.length);
    observer.id = 'holt-observer';
    state.enemies.push(observer);
  }
  if (mission.id === 'MI04') {
    const hauler = state.enemies.find(e => e.type === 'buggy');
    hauler.id = 'private-hauler'; hauler.name = 'Transport armé d’Orison';
  }
  refreshObjectives(state);
  emit(state, 'radio', mission.id === 'MI01' ? 'Tess : « Gauche posé. Maintenant le droit. Ne poursuis pas le sol, Sera. Laisse-le te porter. » — D : avancer ; Q/A : reculer ; J/L : appuis manuels.' : mission.briefing);
  if (mission.id === 'MI02') {
    const context = state.campaign.context;
    emit(state, 'radio', context.servicesInterrupted
      ? 'Tess : « La conduite attend toujours ses raccords. J’ai laissé une équipe aux maisons ; ici, on intervient avec le treuil du marcheur. »'
      : context.pipeRepaired
        ? 'Tess : « Les raccords sont posés. L’équipe des maisons est rentrée ; le matériel de freinage est vérifié. »'
        : 'Tess : « La conduite du couloir tient. On a pu vérifier le matériel avant ta seconde sortie. »');
    emit(state, 'radio', context.noticeFiled
      ? 'Sami : « Les Cales-Basses ont bien reçu une copie de ton signalement. Rien n’est livré pour autant. Cette fois, je vérifierai chaque ligne avec toi. »'
      : 'Sami : « Aux Cales-Basses, on attend toujours une réponse. Je ne vais pas laisser le dépôt compter ce train sans regarder à l’intérieur. »');
  }
  if (mission.id === 'MI03') {
    emit(state, 'radio', state.campaign.context.railRecordFiled
      ? 'Sami : « Au viaduc, on a séparé les personnes du fret. Ici aussi, on vérifie avant de reprendre le mot du poste. »'
      : 'Sami : « Le dossier du train est parti sous scellés. Pour ces émissions, je veux entendre ce qui passe avant de les classer. »');
    emit(state, 'radio', 'Tess : « Approche lentement des terminaux. Une inspection referme leur gaine de protection avant le passage des pieds. Les murs, eux, ne résistent pas à nos roquettes. »');
  }
  if (mission.id === 'MI04') {
    emit(state, 'radio', state.campaign.coolantRestored
      ? 'Tess : « La conduite du couloir alimente encore la station. Tu peux ouvrir directement les vannes de refroidissement. »'
      : 'Tess : « La conduite n’a pas été rétablie. Arrête-toi à la pompe portative : cinq secondes pour alimenter les vannes. »');
    emit(state, 'radio', state.campaign.coolingAssistance
      ? 'Sami : « Les ouvriers sortis du train nous donnent les repères des vannes depuis le poste. Quatre secondes par turbine avec leur guidage. »'
      : 'Tess : « Aucun ouvrier du viaduc ne peut nous guider. Je reprends les repères à la main : sept secondes par turbine. »');
    emit(state, 'radio', state.industrial.contact.available
      ? 'Sami : « Le dispensaire a gardé un canal. Tu pourras appeler sa permanence au terminal après les turbines ; personne n’a encore témoigné. »'
      : 'Sami : « Le canal du dispensaire ne permet pas de joindre un témoin. Nous relèverons seulement ce que la station permet de vérifier. »');
  }
  return state;
}

function step(s, group) {
  const p = s.player;
  if (s.status !== 'playing' || s.decision.active || p.braced || p.stepCooldown > 0 || p.energy < 7) return false;
  if (p.feet.some(f => f.phase === 'swing') || p.lastGroup === group) return false;
  const direction = p.move || p.facing;
  if ((p.x < 155 && direction < 0) || (p.x > s.mission.length - 155 && direction > 0)) return false;
  const feet = p.feet.filter(f => f.group === group);
  const integrity = feet.reduce((sum, f) => sum + f.health / 100, 0) / feet.length;
  const stride = s.walker.stride * (0.65 + integrity * 0.35);
  for (const f of feet) {
    f.fromX = f.x; f.fromY = f.y;
    f.targetX = clamp(p.x + f.homeOffset + direction * stride, 110, s.mission.length - 110);
    f.targetY = terrainAt(f.targetX, s.planetId);
    f.phase = 'swing'; f.contact = false; f.progress = 0;
  }
  p.energy = Math.max(0, p.energy - 6);
  p.lastGroup = group; s.lastStepGroup = group;
  p.stepCooldown = s.walker.stepTime + (1 - integrity) * 0.22;
  s.stats.steps++;
  if (s.campaign) s.campaign.tutorial.stepped = true;
  return true;
}

/** Shared geometry: an exposed cooler at the rear edge of the actual hull. */
export function radiatorBounds(s) {
  const p = s.player;
  return { x: p.x - p.facing * (p.width / 2 + 6), y: p.y - 2, w: 22, h: p.height * 0.65 };
}

export function radiatorCoolingFactor(s) {
  return 0.35 + 0.65 * s.player.radiator.health / s.player.radiator.maxHealth;
}

function cancelRepair(s, reason) {
  const radiator = s.player.radiator;
  if (!radiator.repairing) return;
  radiator.repairing = false; radiator.repairProgress = 0;
  emit(s, 'radio', `Tess : « Réparation interrompue${reason ? ` : ${reason}` : ''}. Le kit n’a pas été consommé. »`);
}

function startRepair(s) {
  const p = s.player, r = p.radiator;
  if (s.decision.active || r.repairing || r.health >= r.maxHealth || r.repairKits <= 0) return false;
  if (p.move || Math.abs(p.speed) > 3 || p.feet.some(f => !f.contact)) {
    emit(s, 'radio', 'Tess : « Pour réparer le radiateur, immobilise tous les appuis puis relance T. »');
    return false;
  }
  r.repairing = true; r.repairProgress = 0;
  emit(s, 'radio', 'Tess : « Raccord de radiateur en cours. Quatre secondes sans marcher, tirer ni subir un impact. »');
  return true;
}

function updateRepair(s, dt, input) {
  const p = s.player, r = p.radiator;
  if (!r.repairing) return;
  if (p.move || input.fire || input.secondary || p.feet.some(f => !f.contact) || Math.abs(p.speed) > 3) {
    cancelRepair(s, p.move || p.feet.some(f => !f.contact) ? 'les appuis bougent' : input.fire || input.secondary ? 'armement actif' : 'coque en mouvement');
    return;
  }
  r.repairProgress = Math.min(1, r.repairProgress + dt / 4);
  if (r.repairProgress >= 1) {
    r.health = Math.min(r.maxHealth, r.health + 60); r.repairKits--;
    r.repairing = false; r.repairProgress = 0;
    emit(s, 'objective', `Radiateur réparé à ${Math.round(r.health)} %. Un kit consommé ; ${r.repairKits} restant${r.repairKits > 1 ? 's' : ''}.`);
  }
}

function startReload(s) {
  const p = s.player;
  if (s.status !== 'playing' || p.ammo >= p.maxAmmo || p.reserveAmmo <= 0 || p.reloadTime > 0 || s.decision.active) return false;
  p.reloadTime = s.walker.legs === 4 ? 2.2 : 1.8;
  emit(s, 'reload', 'Rechargement du magasin.');
  return true;
}

function trainHumanOutcome(c) {
  const rescued = c.hostagesRescued === 0 ? 'Aucun ouvrier secouru' : c.hostagesRescued === 1 ? 'Un ouvrier secouru' : `${c.hostagesRescued} ouvriers secourus`;
  const lost = c.hostagesLost === 0 ? 'aucun décès constaté' : c.hostagesLost === 1 ? 'un décès constaté' : `${c.hostagesLost} décès constatés`;
  return `${rescued}, ${lost}.`;
}

export function trainDecisionBody(s) {
  const c = s.campaign;
  const identification = c.evidencePreserved || c.hostagesRescued > 0
    ? 'Sami demande de joindre au compte rendu signé les identités confirmées et le sort des ouvriers.'
    : 'Aucun survivant ne peut confirmer les identités. Sami demande de joindre au compte rendu la destruction du wagon, les décès et les limites du constat.';
  return `${trainHumanOutcome(c)} ${c.evidencePreserved ? 'Le registre de vente est lisible : un capitaine des Brisants a cédé leurs dettes avec les personnes.' : 'Le registre de vente est détruit ; les constatations ne remplacent pas cette preuve.'} Holt attend le dossier scellé au dépôt. ${identification}`;
}

export function networkDecisionBody(s) {
  const c = s.campaign, clinic = s.network.stations.find(station => station.kind === 'dispensary');
  const inspected = c.verifiedBuildings === 2 ? 'Les deux émissions civiles ont été vérifiées : appels de soins au dispensaire, distribution d’eau et messages familiaux aux maisons.'
    : c.verifiedBuildings === 1 ? 'Une émission civile a été vérifiée avant la destruction des autres sources. Le dossier ne reconstitue pas les communications perdues.'
      : 'Aucune émission civile n’a pu être vérifiée avant la destruction des sources. Les constatations de ruines ne prouvent pas leur contenu.';
  const losses = c.residentsLost ? `${c.residentsLost} décès constatés dans les bâtiments.` : 'Aucun décès constaté dans les bâtiments.';
  const circuit = c.civilRelaysOnline === 2 ? 'Les deux circuits civils sont encore alimentés.' : c.civilRelaysOnline === 1 ? 'Un seul circuit civil reste alimenté.' : 'Aucun circuit civil ne fonctionne encore.';
  const care = clinic.destroyed ? 'Le dispensaire est détruit ; son canal ne donnera pas accès à un témoin.'
    : clinic.hp < clinic.maxHp ? 'Le dispensaire a été touché ; les dommages sont inscrits au constat.' : 'Le bâtiment du dispensaire est préservé.';
  return `${inspected} ${losses} ${circuit} ${care} Holt exige la coupure des deux circuits civils. Maintenir ce qui reste permet de joindre le constat signé ; cela ne répare ni les sources ni les personnes perdues.`;
}

function refreshNetworkFacts(s) {
  const c = s.campaign, stations = s.network.stations;
  const civilians = stations.filter(station => station.kind !== 'military');
  const military = stations.find(station => station.kind === 'military');
  const clinic = stations.find(station => station.kind === 'dispensary');
  c.signalsIdentified = stations.filter(station => station.identified).length;
  c.militaryRelayDisabled = military.disabled || military.destroyed;
  c.verifiedBuildings = civilians.filter(station => station.verified).length;
  c.civilRelaysOnline = civilians.filter(station => !station.disabled && !station.destroyed).length;
  c.networkPreserved = s.decision.resolved && c.civilRelaysOnline === civilians.length;
  c.dispensaryIntact = !clinic.destroyed;
  c.witnessAvailable = s.decision.resolved && clinic.verified && !clinic.disabled && !clinic.destroyed && clinic.casualties < clinic.population;
  c.residentsLost = civilians.reduce((sum, station) => sum + station.casualties, 0);
  c.holtAlerted = s.network.scrutinyTriggered;
  if (s.status !== 'won') c.phase = c.signalsIdentified === stations.length && c.militaryRelayDisabled
    ? 'report' : c.signalsIdentified > 0 ? 'inspection' : 'approach';
  if (s.decision.active || s.decision.resolved) s.decision.body = networkDecisionBody(s);
}

function interactNetworkMission(s) {
  const p = s.player;
  const station = s.network.stations.find(item => Math.abs(p.x - item.x) < s.mission.network.interactionRadius &&
    (!item.identified || item.kind === 'military' && !item.disabled && !item.destroyed));
  if (station) {
    if (!station.identified) {
      if (!station.scanning) {
        station.scanning = true;
        emit(s, 'radio', station.destroyed ? 'Tess : « Plus d’émission. Je relève les ruines et les pertes, sans reconstruire ce qui a brûlé. »'
          : 'Tess : « Liaison d’écoute établie. Reste à portée du terminal ; je referme aussi la gaine sous nos appuis. »');
      }
    } else if (station.kind === 'military' && !station.disabling) {
      station.disabling = true;
      emit(s, 'radio', 'Tess : « Guidage militaire confirmé. J’isole le relais du poste ; reste près du terminal. »');
    }
    return true;
  }
  if (Math.abs(p.x - s.evidence.x) >= 230) return false;
  if (s.campaign.signalsIdentified < s.network.stations.length || !s.campaign.militaryRelayDisabled) {
    emit(s, 'radio', 'Sami : « Il manque un constat, ou le relais militaire transmet encore. Le dossier attend chaque source. »');
    return false;
  }
  if (!s.evidence.collected) {
    if (!s.evidence.scanning) emit(s, 'radio', 'Sami : « Je réunis nos relevés, les circuits encore ouverts et le bilan des bâtiments. »');
    s.evidence.scanning = true;
    return true;
  }
  if (!s.decision.resolved) {
    s.decision.body = networkDecisionBody(s); s.decision.active = true;
    emit(s, 'decision', s.decision.title); return true;
  }
  return false;
}

export function industrialDecisionBody(s) {
  const c = s.campaign;
  const journal = c.logRecovered
    ? 'Le journal copié indique qu’une pièce a été remplacée avant le rejet, sur ordre militaire. Cette anomalie matérielle constitue PT01 ; elle ne prouve ni l’intention du commandement ni l’existence d’un programme général.'
    : 'Le poste est détruit avant que son journal ait pu être copié. Aucun contenu technique n’est reconstitué. Une autre source sera nécessaire pour établir cette anomalie.';
  const contact = c.witnessContacted
    ? 'La permanence du dispensaire, effectivement jointe, signale le passage d’une unité privée avant l’alarme. Ce témoignage reste distinct du journal.'
    : 'Aucun témoignage du dispensaire n’a été recueilli pendant cette sortie.';
  const custody = c.logRecovered ? ' La copie relevée par Tess reste dans votre dossier, quel que soit le mode de remise.' : '';
  return `${journal} ${contact} Holt demande la remise sous scellés ; Tess propose de joindre le constat au rapport signé.${custody}`;
}

function refreshIndustrialFacts(s) {
  const c = s.campaign, site = s.industrial;
  c.coolantRestored = site.pump.connected;
  c.turbinesCooled = site.turbines.filter(turbine => turbine.cooled).length;
  c.maintenanceIntact = !site.post.destroyed;
  c.witnessContacted = site.contact.contacted;
  c.technicalEvidence = c.logRecovered;
  c.evidenceSource = c.logRecovered ? 'PT01' : 'none';
  c.alternativeSourceNeeded = c.maintenanceInspected && !c.logRecovered;
  s.stats.evidence = c.technicalEvidence ? 1 : 0;
  if (s.decision.active || s.decision.resolved) s.decision.body = industrialDecisionBody(s);
}

function interactIndustrialMission(s) {
  const p = s.player, site = s.industrial, settings = s.mission.industrial;
  if (!site.pump.connected && Math.abs(p.x - site.pump.x) < settings.interactionRadius) {
    if (!site.pump.working) {
      site.pump.working = true; s.campaign.phase = 'cooling';
      emit(s, 'radio', 'Tess : « Pompe portative branchée. Reste à portée pendant la montée en pression. »');
    }
    return true;
  }
  const turbine = site.turbines.find(item => !item.cooled && Math.abs(p.x - item.x) < settings.interactionRadius);
  if (turbine) {
    if (!site.pump.connected) { emit(s, 'radio', 'Tess : « Pas de liquide dans cette vanne. Retourne brancher la pompe portative. »'); return false; }
    if (!turbine.working) {
      turbine.working = true; s.campaign.phase = 'cooling';
      emit(s, 'radio', s.campaign.coolingAssistance ? 'Sami : « Les ouvriers confirment le repère. Maintiens la commande quatre secondes. »' : 'Tess : « Repère manuel trouvé. Maintiens la commande sept secondes. »');
    }
    return true;
  }
  if (site.contact.available && !site.contact.contacted && Math.abs(p.x - site.contact.x) < settings.interactionRadius) {
    if (!site.contact.working) { site.contact.working = true; emit(s, 'radio', 'Sami : « J’appelle la permanence du dispensaire sur le canal conservé. Reste à portée du terminal. »'); }
    return true;
  }
  if (Math.abs(p.x - site.post.x) < settings.interactionRadius) {
    if (s.campaign.turbinesCooled < 2) { emit(s, 'radio', 'Tess : « Refroidis les deux turbines avant d’accéder au poste. La chaleur empêche le relevé. »'); return false; }
    if (!s.campaign.maintenanceInspected) {
      if (!s.evidence.scanning) {
        s.evidence.scanning = true; s.campaign.phase = 'inspection';
        emit(s, 'radio', site.post.destroyed ? 'Tess : « Le poste a brûlé. Je constate ce qui manque ; je ne peux pas inventer son journal. »' : 'Tess : « Poste de maintenance ouvert. Je copie les dates et la référence de l’ordre. »');
      }
      return true;
    }
    if (!s.decision.resolved) {
      s.decision.body = industrialDecisionBody(s); s.decision.active = true;
      emit(s, 'decision', s.decision.title); return true;
    }
  }
  return false;
}

function interactTrainMission(s) {
  const p = s.player, train = s.train, c = s.campaign;
  const station = train.harpoons.find(item => !item.released && Math.abs(p.x - item.x) < 155);
  if (station) {
    if (!station.working) {
      station.working = true;
      emit(s, 'radio', 'Tess : « Je détends le câble. Reste près du treuil jusqu’à ce que le crochet soit libre. »');
    }
    return true;
  }
  if (c.harpoonsReleased < train.harpoons.length) return false;
  if (!train.stopped && Math.abs(p.x - train.x) < s.mission.train.interactionRadius) {
    if (!train.brakeWorking) {
      train.brakeWorking = true;
      emit(s, 'radio', 'Tess : « Liaison de freinage établie. Reste à portée de la cabine quatre secondes ; coupe le feu sur le train. »');
    }
    return true;
  }
  if (!train.stopped) return false;
  if (Math.abs(p.x - s.evidence.x) >= s.mission.train.interactionRadius) return false;
  if (!c.rescueResolved) {
    if (!c.rescueWorking) {
      c.rescueWorking = true;
      emit(s, 'radio', 'Sami : « Il y a des ouvriers là-dedans ! Je tire le verrou. Garde les canons loin des portes. »');
    }
    return true;
  }
  if (!s.evidence.collected) {
    s.evidence.scanning = true;
    emit(s, 'radio', c.evidencePreserved
      ? 'Sami : « Ce ne sont pas des fiches de fret. Il y a des noms, des dettes et le prix payé au capitaine. Je relève les pages. »'
      : 'Sami : « Le coffre du registre a brûlé. On va consigner ce qui reste ; je ne peux pas reconstituer les pages. »');
    return true;
  }
  if (!s.decision.resolved) {
    s.decision.body = trainDecisionBody(s);
    s.decision.active = true;
    emit(s, 'decision', s.decision.title);
    return true;
  }
  return false;
}

function interact(s) {
  if (s.status !== 'playing' || s.decision.active) return false;
  if (s.missionId === 'MI02') return interactTrainMission(s);
  if (s.missionId === 'MI03') return interactNetworkMission(s);
  if (s.missionId === 'MI04') return interactIndustrialMission(s);
  const p = s.player;
  if (s.missionId === 'MI01' && !s.campaign.passageSecured && s.campaign.pipeIntact && Math.abs(p.x - s.mission.passage.stationX) < s.mission.passage.radius) {
    if (!s.campaign.passageWorking) {
      s.campaign.passageWorking = true;
      emit(s, 'radio', 'Tess : « Le treuil pousse les dalles sur la conduite. Reste ici le temps du verrouillage. »');
    }
    return true;
  }
  if (s.missionId === 'MI01' && !s.campaign.filtersDelivered && Math.abs(p.x - s.evidence.x) < 230) {
    emit(s, 'radio', 'Sami : « Le bordereau est dans ma cabine. Fais arriver le camion au poste, on le vérifiera après le déchargement. »');
    return false;
  }
  if (!s.evidence.collected && Math.abs(p.x - s.evidence.x) < 230) {
    s.evidence.scanning = true;
    emit(s, 'radio', s.campaign ? 'Sami : « Vingt-quatre caisses, c’est le compte. Regarde les rues sur la feuille. »' : 'Lecture du registre. Maintenez la position.');
    return true;
  }
  if (s.evidence.collected && !s.decision.resolved && Math.abs(p.x - s.mission.decisionX) < 300) {
    s.decision.active = true;
    emit(s, 'decision', s.decision.title);
    return true;
  }
  return false;
}

export function commandGame(s, action, payload) {
  if (!s || s.status !== 'playing') return false;
  if (action === 'assist') { s.assist = Boolean(payload); return true; }
  if (action === 'choice') {
    if (!s.decision.active || s.decision.resolved || !['obey', 'defy'].includes(payload)) return false;
    s.decision.choice = payload; s.decision.resolved = true; s.decision.active = false;
    if (s.missionId === 'MI04') {
      s.campaign.reportFiled = payload === 'defy';
      if (payload === 'obey') s.stats.ordersObeyed++;
      else s.stats.ordersDefied++;
      refreshIndustrialFacts(s);
      emit(s, 'radio', payload === 'defy'
        ? s.campaign.logRecovered ? 'Tess : « Le journal et sa référence militaire accompagnent le compte rendu. Une anomalie datée, pas encore une explication. »' : 'Tess : « Le rapport dit que le journal est perdu. Il faudra une autre source ; pas une supposition transformée en preuve. »'
        : 'Holt : « Remise sous scellés enregistrée. » Tess conserve son relevé de terrain, sans lui attribuer une diffusion qu’il n’a pas eue.');
      refreshObjectives(s); return true;
    }
    if (s.missionId === 'MI03') {
      s.campaign.reportFiled = payload === 'defy';
      if (payload === 'obey') {
        s.stats.ordersObeyed++;
        for (const station of s.network.stations) if (station.kind !== 'military') station.disabled = true;
      } else s.stats.ordersDefied++;
      refreshNetworkFacts(s);
      emit(s, 'radio', payload === 'defy'
        ? 'Sami : « Le constat part avec nos noms. Les circuits encore debout restent ouverts. Un canal disponible n’est pas une promesse de réponse. »'
        : 'Holt : « Coupure civile confirmée. Repliez-vous. » Tess note que les appels de soins et de quartier ne passent plus.');
      refreshObjectives(s); return true;
    }
    if (s.missionId === 'MI02') {
      s.campaign.recordFiled = payload === 'defy';
      if (payload === 'obey') s.stats.ordersObeyed++;
      else s.stats.ordersDefied++;
      emit(s, 'radio', payload === 'defy'
        ? 'Sami : « Leur sort figure dans notre compte rendu. Cette copie ne dépendra pas du poids du minerai. »'
        : 'Holt : « Dossier remis sous scellés. Le dépôt prend la suite. » Sami referme le coffre sans répondre.');
      refreshObjectives(s);
      return true;
    }
    if (s.campaign) {
      s.campaign.noticeFiled = payload === 'defy';
      if (payload === 'obey') s.stats.ordersObeyed++;
      else s.stats.ordersDefied++;
      emit(s, 'radio', payload === 'defy' ? 'Sami : « Tu as mis leur nom dans le rapport. Ça ne leur donne pas des filtres, mais ils ne sont plus absents de la feuille. »' : 'Sami : « Le poste est livré. Pour les Cales-Basses, je n’ai toujours aucune ligne. »');
      refreshObjectives(s);
      return true;
    }
    if (payload === 'obey') {
      s.stats.ordersObeyed++;
      emit(s, 'radio', s.missionId === 'op03' ? '« Bien reçu. Vous avez choisi votre camp, Vey. » La purge est inscrite au registre.' : 'Le rapport officiel est transmis. La copie est effacée.');
    } else {
      s.stats.ordersDefied++;
      emit(s, 'radio', s.missionId === 'op03' ? '« Régulateur isolé. Les filtres restent ouverts. » Cerbère arme ses canons.' : 'La copie passe sur un canal civil. Quelqu’un saura ce qui s’est produit.');
    }
    s.bossReleased = true;
    refreshObjectives(s);
    return true;
  }
  if (s.decision.active) return false;
  if (action === 'stepA' || action === 'stepB') cancelRepair(s, 'commande d’appui');
  if (action === 'stepA') return step(s, 0);
  if (action === 'stepB') return step(s, 1);
  if (action === 'interact') return interact(s);
  if (action === 'reload') return startReload(s);
  if (action === 'repair') return startRepair(s);
  return false;
}

function hitCivilian(s, c, damage) {
  if (!c.alive || c.safe) return;
  c.hp -= damage;
  c.fleeing = true;
  if (c.hp <= 0) {
    c.alive = false; s.stats.collateral++;
    particles(s, c.x, c.y, 'smoke', 7);
    emit(s, 'radio', 'Victime civile confirmée. Cette perte restera dans votre rapport.');
  }
}

function destroyEnemy(s, e) {
  if (e.dead) return;
  e.dead = true; e.hp = 0;
  s.stats.kills++; s.stats.score += e.score;
  particles(s, e.x, e.y, 'blast', e.kind === 'infantry' ? 8 : 24);
  particles(s, e.x, e.y, 'smoke', 8);
  s.cameraShake = Math.max(s.cameraShake, e.type === 'boss' ? 1 : 0.3);
  emit(s, 'explosion', e.type === 'boss' ? 'Cerbère neutralisé.' : '', e.x, e.y);
}

function enemyPresent(s, e) {
  // The controller has a fixed save slot before arrival, not a physical target.
  if (e.id === 'private-hauler' && s.industrial?.retreatEscaped) return false;
  return e.id !== 'holt-observer' || Boolean(s.network?.scrutinyTriggered);
}

function hitEnemy(s, e, damage, piercing = false) {
  if (e.dead || !enemyPresent(s, e)) return;
  e.hp -= damage * (piercing ? 1 : 1 - e.armor); e.flash = 0.09;
  particles(s, e.x, e.y, 'spark', 4);
  if (e.hp <= 0) destroyEnemy(s, e);
}

function hitRelay(s, r, damage) {
  if (r.destroyed) return;
  r.hp -= damage; r.flash = 0.1;
  if (r.hp <= 0) {
    r.destroyed = true; r.hp = 0;
    s.stats.score += 200;
    particles(s, r.x, r.y, 'blast', 18);
    emit(s, 'objective', 'Relais neutralisé.', r.x, r.y);
  }
}

function hitTrainPart(s, part, damage) {
  if (!s.train || part.destroyed || damage <= 0) return;
  part.hp = Math.max(0, part.hp - damage);
  particles(s, part.x, part.y, 'spark', 7);
  if (part.hp === 0) {
    part.destroyed = true;
    particles(s, part.x, part.y, 'blast', 20);
    emit(s, 'explosion', part === s.train ? 'La locomotive est détruite.' : 'Un wagon est détruit.', part.x, part.y);
  }
  if (part.kind !== 'hostages') return;
  const c = s.campaign;
  if (!c.rescueResolved) {
    const lost = Math.min(c.hostagesTotal, Math.floor((part.maxHp - part.hp) / (part.maxHp / c.hostagesTotal)));
    if (lost > c.hostagesLost) {
      s.stats.collateral += lost - c.hostagesLost;
      c.hostagesLost = lost;
      emit(s, 'radio', `Sami : « Le wagon est touché. ${lost === 1 ? 'Un décès confirmé' : `${lost} décès confirmés`}. Arrêtez de tirer dans les tôles ! »`);
    }
    if (part.destroyed) {
      c.rescueResolved = true; c.rescueWorking = false; c.rescueProgress = 1;
      emit(s, 'radio', 'Sami : « Personne ne répond dans le wagon. On consignera les pertes ; rien ne peut les annuler. »');
    }
  }
  if (part.hp <= part.maxHp / 2 && !c.manifestRead && c.evidencePreserved) {
    c.evidencePreserved = false;
    emit(s, 'radio', 'Sami : « Le coffre du registre brûle. Les pages de vente sont perdues ; il restera notre constat. »');
  }
}

function hitNetworkStation(s, station, damage) {
  if (station.destroyed || damage <= 0) return;
  station.hp = Math.max(0, station.hp - damage); station.flash = 0.12;
  particles(s, station.x, station.y, 'spark', 7);
  const losses = Math.min(station.population, Math.floor((station.maxHp - station.hp) / station.maxHp * station.population));
  if (losses > station.casualties) {
    s.stats.collateral += losses - station.casualties;
    station.casualties = losses;
    emit(s, 'radio', `Sami : « ${station.kind === 'dispensary' ? 'Dispensaire' : 'Maisons'} touché${station.kind === 'dispensary' ? '' : 'es'}. ${losses} décès constatés. La réparation d’un circuit n’annule pas les pertes. »`);
  }
  if (station.hp === 0) {
    station.destroyed = true; station.disabled = true; station.disabling = false;
    particles(s, station.x, station.y, 'blast', 22);
    emit(s, 'objective', station.kind === 'military' ? 'Le relais militaire est détruit. Son emplacement reste à inspecter.' : 'Bâtiment détruit. Relevez le constat des ruines avant le dossier final.');
  }
  refreshNetworkFacts(s);
}

function hitMaintenancePost(s, damage) {
  const post = s.industrial.post;
  if (post.destroyed || damage <= 0) return;
  post.hp = Math.max(0, post.hp - damage); post.flash = 0.12;
  particles(s, post.x, post.y, 'spark', 7);
  if (post.hp === 0) {
    post.destroyed = true;
    particles(s, post.x, post.y, 'blast', 22);
    emit(s, 'objective', s.campaign.logRecovered
      ? 'Poste détruit. La copie déjà relevée du journal reste dans le dossier de Tess.'
      : 'Poste détruit avant la copie. Le journal est perdu ; un constat des ruines permet de poursuivre la mission.');
  }
  refreshIndustrialFacts(s);
}

function damageRadiator(s, damage, x, y) {
  damagePlayer(s, damage, x, y);
  const r = s.player.radiator, previous = r.health;
  r.health = Math.max(0, r.health - damage * s.difficulty.damage * 1.4);
  if (previous >= 60 && r.health < 60) emit(s, 'radio', 'Tess : « Radiateur touché à l’arrière. Le refroidissement ralentit. À l’abri et à l’arrêt, T répare le circuit avec un kit. »');
}

function damagePlayer(s, damage, hitX, hitY, bypassArmor = false) {
  const p = s.player;
  cancelRepair(s, 'nouvel impact');
  const applied = damage * s.difficulty.damage * (bypassArmor ? 1 : 1 - p.armor) * (p.braced ? 0.7 : 1);
  p.hull = Math.max(0, p.hull - applied);
  p.flash = 0.16; s.stats.damageTaken += applied;
  p.stability = clamp(p.stability - applied * 0.18, 0, 100);
  if (hitY > p.y + p.height / 2) {
    const nearest = p.feet.reduce((a, b) => Math.abs(a.x - hitX) < Math.abs(b.x - hitX) ? a : b);
    nearest.health = Math.max(15, nearest.health - applied * 0.48);
  }
  particles(s, hitX, hitY, 'spark', 8);
  s.cameraShake = Math.max(s.cameraShake, Math.min(0.7, applied / 50));
  emit(s, 'hit', '', hitX, hitY);
}

function stomp(s, f) {
  particles(s, f.x, f.y, 'dust', 9);
  emit(s, 'step', '', f.x, f.y);
  // A pipe incident is caused by a real planted foot, never by camera/body position.
  if (s.missionId === 'MI01' && f.contact && !s.campaign.passageSecured && s.campaign.pipeIntact &&
      f.x >= s.mission.passage.pipeFrom && f.x <= s.mission.passage.pipeTo &&
      Math.abs(f.y - terrainAt(f.x, s.planetId)) < 1) {
    Object.assign(s.campaign, { route: 'direct', pipeIntact: false, pipeDamage: 100,
      passageWorking: false, passageProgress: 0, repairCost: s.mission.passage.repairCost });
    s.convoy.waitTime = s.mission.passage.incidentDelay;
    particles(s, f.x, f.y - 8, 'smoke', 18);
    emit(s, 'radio', 'Tess : « Le raccord a cédé sous l’appui. Sami, attends que la pression retombe. Il faudra deux lots de pièces pour réparer. »');
  }
  for (const e of s.enemies) {
    if (!e.dead && enemyPresent(s, e) && e.kind !== 'air' && Math.abs(e.x - f.x) < 35 + e.w / 2 && Math.abs((e.y + e.h / 2) - f.y) < 32) {
      hitEnemy(s, e, e.kind === 'infantry' ? 115 : 65, true);
    }
  }
  for (const c of s.civilians) if (c.alive && !c.safe && Math.abs(c.x - f.x) < 26) hitCivilian(s, c, 90);
  if (s.network && f.contact) for (const station of s.network.stations) {
    const terminalX = station.x + station.w / 2 + 30;
    if (station.kind !== 'military' && !station.secured && !station.destroyed && Math.abs(f.x - terminalX) < 18 &&
        Math.abs(f.y - terrainAt(f.x, s.planetId)) < 1) {
      hitNetworkStation(s, station, 45);
      emit(s, 'radio', 'Tess : « Le pied a arraché une liaison du bâtiment. Il fallait refermer la gaine du terminal avant de le franchir. »');
    }
  }
  s.cameraShake = Math.max(s.cameraShake, 0.08);
}

function updateWalker(s, dt, input) {
  const p = s.player;
  p.move = Math.sign(finite(input.move));
  p.braced = Boolean(input.brace);
  if (s.campaign && p.braced) s.campaign.tutorial.braced = true;
  p.venting = Boolean(input.vent);
  if (p.move) p.facing = p.move;
  if (Number.isFinite(input.aimX)) p.aimX = input.aimX;
  if (Number.isFinite(input.aimY)) p.aimY = input.aimY;
  p.aimAngle = Math.atan2(p.aimY - (p.y + 8), p.aimX - (p.x + 9));
  p.stepCooldown = Math.max(0, p.stepCooldown - dt);
  p.fireCooldown = Math.max(0, p.fireCooldown - dt);
  p.rocketCooldown = Math.max(0, p.rocketCooldown - dt);
  p.flash = Math.max(0, p.flash - dt);
  p.energy = clamp(p.energy + dt * (p.braced ? 25 : 16), 0, 100);
  p.heat = clamp(p.heat - dt * s.walker.cooling * radiatorCoolingFactor(s) * (p.venting ? 3.3 : 0.7), 0, 100);
  updateRepair(s, dt, input);
  if (p.overheated && p.heat < 48) { p.overheated = false; emit(s, 'radio', 'Température nominale. Armement disponible.'); }
  if (p.reloadTime > 0) {
    p.reloadTime = Math.max(0, p.reloadTime - dt);
    if (p.reloadTime === 0) {
      const transferred = Math.min(p.maxAmmo - p.ammo, p.reserveAmmo);
      p.ammo += transferred; p.reserveAmmo -= transferred;
      emit(s, 'reload', `Magasin chargé : ${p.ammo} coups. Réserve : ${p.reserveAmmo}.`);
    }
  }
  if (s.assist && p.move && !p.braced && p.stepCooldown === 0) step(s, p.lastGroup === 0 ? 1 : 0);
  for (const f of p.feet) {
    if (f.phase === 'swing') {
      f.progress = Math.min(1, f.progress + dt / (s.walker.stepTime * (1 + (1 - f.health / 100) * 0.3)));
      const t = f.progress * f.progress * (3 - 2 * f.progress);
      f.x = lerp(f.fromX, f.targetX, t);
      f.y = lerp(f.fromY, f.targetY, t) - Math.sin(f.progress * Math.PI) * (s.walker.legs === 2 ? 65 : 43);
      if (f.progress >= 1) { f.phase = 'stance'; f.contact = true; f.y = terrainAt(f.x, s.planetId); stomp(s, f); }
    }
  }
  const anchor = p.feet.reduce((sum, f) => sum + f.x - f.homeOffset, 0) / p.feet.length;
  const lastX = p.x;
  p.anchorX = anchor;
  p.x += clamp((anchor - p.x) * 6 * dt, -s.walker.speed * dt, s.walker.speed * dt);
  p.x = clamp(p.x, 110, s.mission.length - 110);
  p.speed = (p.x - lastX) / Math.max(dt, 0.0001);
  p.groundY = terrainAt(p.x, s.planetId);
  const stepping = p.feet.some(f => !f.contact);
  const bob = stepping ? Math.sin(p.feet.find(f => !f.contact).progress * Math.PI) * 3 : 0;
  p.y = lerp(p.y, p.groundY - s.walker.height + bob, Math.min(1, dt * 12));
  const legHealth = p.feet.reduce((sum, f) => sum + f.health, 0) / p.feet.length;
  const targetStability = (p.braced ? 100 : stepping ? (s.walker.legs === 2 ? 64 : 82) : 96) * (0.65 + legHealth / 100 * 0.35);
  p.stability = clamp(lerp(p.stability, targetStability, dt * 2.3), 0, 100);
  if (input.fire) fire(s, false);
  if (input.secondary) fire(s, true);
  if (p.ammo === 0 && p.reloadTime === 0) startReload(s);
}

function fire(s, rocket) {
  const p = s.player;
  if (p.venting || p.overheated || p.reloadTime > 0 || (rocket ? p.rocketCooldown > 0 || p.rockets <= 0 : p.fireCooldown > 0 || p.ammo <= 0)) return;
  const spread = (random(s) - 0.5) * (100 - p.stability) * (rocket ? 0.0003 : 0.0018);
  const angle = p.aimAngle + spread;
  const muzzle = s.walker.legs === 4 ? 112 : s.walker.legs === 6 ? 101 : 92;
  const x = p.x + 9 + Math.cos(angle) * muzzle;
  const y = p.y + 8 + Math.sin(angle) * muzzle;
  const speed = rocket ? 600 : 1120;
  s.projectiles.push({ id: `shot-${++s.entityId}`, x, y, prevX: x, prevY: y,
    vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, team: 'player',
    type: rocket ? 'rocket' : 'bullet', damage: rocket ? 165 : s.walker.damage,
    radius: rocket ? 5 : 2, life: 2.1, trail: [] });
  p.heat = Math.min(100, p.heat + (rocket ? 13 : s.walker.shotHeat));
  p.stability = Math.max(0, p.stability - (rocket ? 6 : 2.2) * (p.braced ? 0.3 : 1));
  if (rocket) { p.rockets--; p.rocketCooldown = 1.25; }
  else { p.ammo--; p.fireCooldown = s.walker.fireRate; }
  s.stats.shots++;
  particles(s, x, y, 'spark', 3);
  emit(s, rocket ? 'rocket' : 'shot', '', x, y);
  if (p.heat >= 100) { p.overheated = true; emit(s, 'overheat', 'Surchauffe. Ventilez le réacteur.'); }
}

function enemyFire(s, e) {
  if (e.type === 'fauna') {
    if (Math.abs(e.x - s.player.x) < e.range + s.player.width / 2) damagePlayer(s, e.damage, e.x, terrainAt(e.x, s.planetId) - 30);
    return;
  }
  const angle = Math.atan2(e.targetY - e.y, e.targetX - e.x);
  const rocket = e.type === 'rocket' || e.type === 'boss';
  const x = e.x + Math.cos(angle) * e.w / 2;
  const y = e.y + Math.sin(angle) * e.w / 2;
  s.projectiles.push({ id: `enemy-shot-${++s.entityId}`, x, y, prevX: x, prevY: y,
    vx: Math.cos(angle) * e.projectileSpeed, vy: Math.sin(angle) * e.projectileSpeed,
    team: 'enemy', type: rocket ? 'rocket' : 'bullet', damage: e.damage,
    radius: rocket ? 5 : 2, life: 4.5, trail: [] });
  particles(s, x, y, 'spark', 2);
}

function updateEnemies(s, dt) {
  const p = s.player;
  for (const e of s.enemies) {
    e.flash = Math.max(0, e.flash - dt);
    if (e.dead) continue;
    if (e.id === 'holt-observer' && !s.campaign?.holtAlerted) { e.active = false; e.phase = 'idle'; continue; }
    if (e.id === 'private-hauler') {
      const site = s.industrial;
      if (site.retreatEscaped) { e.active = false; e.phase = 'withdrawn'; continue; }
      if (!site.retreatTriggered && (e.hp < e.maxHp * 0.55 || p.x > 1450)) {
        site.retreatTriggered = true; e.telegraph = 0;
        emit(s, 'radio', 'Sami : « Le transport d’Orison décroche vers la sortie. Il abandonne les vannes. Évite de tirer à travers le poste de maintenance. »');
      }
      if (site.retreatTriggered) {
        e.active = true; e.phase = 'retreat'; e.facing = 1;
        e.x = Math.min(s.extraction.x + 180, e.x + dt * 58);
        e.y = terrainAt(e.x, s.planetId) - e.h / 2;
        if (e.x >= s.extraction.x + 180) {
          site.retreatEscaped = true; e.active = false; e.phase = 'withdrawn';
          emit(s, 'radio', 'Sami : « Le transport privé a quitté la station. On l’a repoussé ; on ne l’a pas détruit. »');
        }
        continue;
      }
    }
    const delta = Math.abs(e.x - p.x);
    if (s.missionId === 'MI01' && !s.notified.ambush) { e.active = false; e.phase = 'idle'; continue; }
    e.active = delta < 1150 || Boolean(s.convoy && Math.abs(e.x - s.convoy.x) < 900);
    if (!e.active) { e.phase = 'idle'; continue; }
    if (e.type === 'boss' && !s.bossReleased) { e.phase = 'guard'; continue; }
    if (e.type === 'boss' && s.decision.choice === 'obey') { e.active = false; e.phase = 'standdown'; e.telegraph = 0; continue; }
    e.facing = e.x > p.x ? -1 : 1;
    let target = p;
    if (s.convoy && Math.abs(e.x - s.convoy.x) < delta && e.kind !== 'air') target = s.convoy;
    e.attackTarget = target === p ? 'player' : 'convoy';
    const td = Math.abs(e.x - target.x);
    if (e.phase === 'attack') {
      e.telegraph = Math.min(1, e.telegraph + dt / e.windup);
      if (e.telegraph >= 1) {
        enemyFire(s, e); e.phase = 'recover'; e.timer = e.cooldown; e.telegraph = 0;
      }
    } else {
      e.timer -= dt;
      const desiredDistance = e.type === 'fauna' ? 55 : e.type === 'buggy' ? 480 : e.range * 0.72;
      if (td > desiredDistance && e.speed > 0) e.x += Math.sign(target.x - e.x) * e.speed * dt;
      if (e.timer <= 0 && td < e.range) {
        e.phase = 'attack'; e.telegraph = 0;
        e.targetX = target.x + (target === p ? p.speed * 0.18 : 0);
        // Rocket troopers deliberately attack vulnerable legs, drones the upper hull.
        e.targetY = target === p && e.type === 'rocket' ? p.groundY - 50 : target.y;
      }
    }
    if (e.type === 'drone') e.y = terrainAt(e.x, s.planetId) - 190 + Math.sin(s.elapsed * 1.5 + e.dronePhase) * 23;
    else e.y = terrainAt(e.x, s.planetId) - e.h / 2;
  }
}

// Slab intersection against a swept segment: stable even at low frame rates.
function segmentBox(x0, y0, x1, y1, cx, cy, w, h, radius = 0) {
  const minX = cx - w / 2 - radius, maxX = cx + w / 2 + radius;
  const minY = cy - h / 2 - radius, maxY = cy + h / 2 + radius;
  let low = 0, high = 1;
  const dx = x1 - x0, dy = y1 - y0;
  for (const [p, d, min, max] of [[x0, dx, minX, maxX], [y0, dy, minY, maxY]]) {
    if (Math.abs(d) < 0.000001) { if (p < min || p > max) return null; }
    else {
      let a = (min - p) / d, b = (max - p) / d;
      if (a > b) [a, b] = [b, a];
      low = Math.max(low, a); high = Math.min(high, b);
      if (low > high) return null;
    }
  }
  return low;
}

function explosion(s, shot, direct = null) {
  const radius = 90;
  particles(s, shot.x, shot.y, 'blast', 16);
  particles(s, shot.x, shot.y, 'smoke', 6);
  emit(s, 'explosion', '', shot.x, shot.y);
  s.cameraShake = Math.max(s.cameraShake, 0.35 * (1 - Math.min(1, Math.abs(shot.x - s.player.x) / 1100)));
  if (s.train) {
    for (const part of [s.train, ...s.train.wagons]) {
      if (part === direct || part.destroyed) continue;
      const d = dist(shot.x, shot.y, part.x, part.y);
      if (d < radius + part.w / 2) hitTrainPart(s, part,
        shot.damage * (shot.team === 'enemy' ? s.difficulty.damage : 1) * 0.55 * Math.max(0.25, 1 - d / (radius + part.w / 2)));
    }
  }
  if (s.network) for (const station of s.network.stations) {
    if (station === direct || station.destroyed) continue;
    const d = dist(shot.x, shot.y, station.x, station.y);
    if (d < radius + station.w / 2) hitNetworkStation(s, station,
      shot.damage * (shot.team === 'enemy' ? s.difficulty.damage : 1) * 0.55 * Math.max(0.25, 1 - d / (radius + station.w / 2)));
  }
  if (s.industrial && !s.industrial.post.destroyed && s.industrial.post !== direct) {
    const post = s.industrial.post, d = dist(shot.x, shot.y, post.x, post.y);
    if (d < radius + post.w / 2) hitMaintenancePost(s,
      shot.damage * (shot.team === 'enemy' ? s.difficulty.damage : 1) * 0.55 * Math.max(0.25, 1 - d / (radius + post.w / 2)));
  }
  if (shot.team === 'player') {
    for (const e of s.enemies) {
      if (e.dead || e === direct || !enemyPresent(s, e)) continue;
      const d = dist(shot.x, shot.y, e.x, e.y);
      if (d < radius + e.w / 2) hitEnemy(s, e, shot.damage * 0.55 * Math.max(0.25, 1 - d / (radius + e.w / 2)), true);
    }
    for (const r of s.relays) if (r !== direct && !r.destroyed && dist(shot.x, shot.y, r.x, r.y) < radius) hitRelay(s, r, shot.damage * 0.5);
    for (const c of s.civilians) if (dist(shot.x, shot.y, c.x, c.y) < radius) hitCivilian(s, c, shot.damage * 0.5);
  }
}

function updateProjectiles(s, dt) {
  for (const shot of s.projectiles) {
    if (shot.life <= 0) continue;
    shot.prevX = shot.x; shot.prevY = shot.y;
    shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt;
    shot.trail.push({ x: shot.prevX, y: shot.prevY });
    if (shot.trail.length > (shot.type === 'rocket' ? 8 : 3)) shot.trail.shift();
    const candidates = [];
    const test = (entity, kind, x = entity.x, y = entity.y, w = entity.w, h = entity.h) => {
      const t = segmentBox(shot.prevX, shot.prevY, shot.x, shot.y, x, y, w, h, shot.radius);
      if (t !== null) candidates.push({ entity, kind, t });
    };
    if (shot.team === 'player') {
      for (const e of s.enemies) if (!e.dead && enemyPresent(s, e)) test(e, 'enemy');
      for (const r of s.relays) if (!r.destroyed) test(r, 'relay');
      for (const c of s.civilians) if (c.alive && !c.safe) test(c, 'civilian');
    } else {
      const p = s.player;
      const radiator = radiatorBounds(s);
      test(p.radiator, 'radiator', radiator.x, radiator.y, radiator.w, radiator.h);
      test(p, 'player', p.x, p.y, p.width, p.height);
      for (const f of p.feet) {
        // Lower leg collision spans the hip-foot segment conservatively.
        const lx = (p.x + f.homeOffset * 0.5 + f.x) / 2;
        const ly = (p.y + p.height / 2 + f.y) / 2;
        test(p, 'player', lx, ly, 25, Math.max(24, f.y - p.y - p.height / 2));
      }
      if (s.convoy && s.convoy.hp > 0) test(s.convoy, 'convoy');
    }
    if (s.train) for (const part of [s.train, ...s.train.wagons]) if (!part.destroyed) test(part, 'train');
    if (s.network) for (const station of s.network.stations) if (!station.destroyed) test(station, 'network');
    if (s.industrial && !s.industrial.post.destroyed) test(s.industrial.post, 'maintenance');
    candidates.sort((a, b) => a.t - b.t);
    const hit = candidates[0];
    if (hit) {
      shot.x = lerp(shot.prevX, shot.x, hit.t); shot.y = lerp(shot.prevY, shot.y, hit.t);
      shot.life = 0;
      if (hit.kind === 'enemy') { hitEnemy(s, hit.entity, shot.damage, shot.type === 'rocket'); s.stats.hits++; }
      if (hit.kind === 'relay') { hitRelay(s, hit.entity, shot.damage); s.stats.hits++; }
      if (hit.kind === 'civilian') hitCivilian(s, hit.entity, shot.damage);
      if (hit.kind === 'player') damagePlayer(s, shot.damage, shot.x, shot.y);
      if (hit.kind === 'radiator') damageRadiator(s, shot.damage, shot.x, shot.y);
      if (hit.kind === 'maintenance') hitMaintenancePost(s, shot.damage * (shot.team === 'enemy' ? s.difficulty.damage : 1));
      if (hit.kind === 'convoy') { s.convoy.hp = Math.max(0, s.convoy.hp - shot.damage * s.difficulty.damage); particles(s, shot.x, shot.y, 'spark', 7); }
      if (hit.kind === 'train') hitTrainPart(s, hit.entity, shot.damage * (shot.team === 'enemy' ? s.difficulty.damage : 1));
      if (hit.kind === 'network') hitNetworkStation(s, hit.entity, shot.damage * (shot.team === 'enemy' ? s.difficulty.damage : 1));
      if (shot.type === 'rocket') explosion(s, shot, hit.entity);
    } else if (shot.y > terrainAt(shot.x, s.planetId) || shot.x < 0 || shot.x > s.mission.length) {
      shot.life = 0;
      if (shot.type === 'rocket') explosion(s, shot);
      else particles(s, shot.x, shot.y, 'dust', 3);
    }
  }
  s.projectiles = s.projectiles.filter(p => p.life > 0);
}

function updateCampaignApproach(s, dt) {
  const c = s.campaign, p = s.player, passage = s.mission.passage;
  if (!c) return;
  if (p.x > 500 && !s.notified.sami) {
    s.notified.sami = true;
    emit(s, 'radio', 'Sami : « Je passe dans tes traces. Si tu t’arrêtes, préviens-moi avant. »');
  }
  if (p.x > 650 && !s.notified.pipe) {
    s.notified.pipe = true;
    emit(s, 'radio', 'Tess : « La conduite traverse la chaussée. Le treuil à gauche déploie les dalles : arrête-toi près du repère et appuie sur E. »');
  }
  if (c.passageWorking) {
    if (Math.abs(p.x - passage.stationX) >= passage.radius || !c.pipeIntact) {
      c.passageWorking = false; c.passageProgress = 0;
      emit(s, 'radio', 'Tess : « Tu quittes le treuil. Les dalles ne sont pas verrouillées ; la conduite reste exposée. »');
    } else {
      c.passageProgress = Math.min(1, c.passageProgress + dt / passage.workTime);
      if (c.passageProgress >= 1) {
        c.passageWorking = false; c.passageSecured = true; c.route = 'secured';
        emit(s, 'objective', 'Tess : « Dalles verrouillées. Tu peux poser les appuis ; la conduite est protégée. »');
      }
    }
  }
  if (p.x >= s.mission.ambushTriggerX && !s.notified.ambush) {
    s.notified.ambush = true; c.phase = 'escort';
    if (c.route === 'unresolved') c.route = 'direct';
    emit(s, 'radio', 'Sami : « Lanceur dans le dépôt ! Il nous vise ! » — Espace : ancrage. Tir court à la souris ; V : ventilation.');
  }
  if (p.overheated && !s.notified.campaignHeat) {
    s.notified.campaignHeat = true;
    emit(s, 'radio', 'Tess : « Coupe le tir et maintiens V. Attends que la température redescende avant de reprendre. »');
  }
  s.convoy.waitTime = Math.max(0, s.convoy.waitTime - dt);
  c.convoyIntegrity = clamp(s.convoy.hp / s.convoy.maxHp, 0, 1);
}

function updateTrainMission(s, dt) {
  const train = s.train, c = s.campaign, p = s.player, settings = s.mission.train;
  if (p.x > 580 && !s.notified.harpoons) {
    s.notified.harpoons = true;
    emit(s, 'radio', 'Tess : « Deux câbles maintiennent le train. Libère les treuils avec E ; dès le second décroché, il partira dans la pente. »');
  }
  if (p.x > 1660 && !s.notified.occupants) {
    s.notified.occupants = true;
    emit(s, 'radio', 'Sami : « J’entends des coups dans le wagon fermé, derrière les bennes. Ce n’est pas du minerai. Pas de roquette dans les wagons, Sera ! »');
  }
  for (const harpoon of train.harpoons) {
    if (!harpoon.working || harpoon.released) continue;
    if (Math.abs(p.x - harpoon.x) >= 175) {
      harpoon.working = false; harpoon.progress = 0;
      emit(s, 'radio', 'Tess : « Liaison perdue avec le treuil. Le câble tient toujours ; il faut revenir le détendre. »');
    } else {
      harpoon.progress = Math.min(1, harpoon.progress + dt / settings.harpoonTime);
      if (harpoon.progress >= 1) {
        harpoon.working = false; harpoon.released = true;
        c.harpoonsReleased = train.harpoons.filter(item => item.released).length;
        c.phase = c.harpoonsReleased === train.harpoons.length ? 'pursuit' : 'release';
        emit(s, 'objective', c.harpoonsReleased === train.harpoons.length
          ? 'Tess : « Dernier câble libre. Le train part ! Rejoins la locomotive et lance la liaison de freinage avec E. »'
          : 'Tess : « Premier harpon décroché. Le second retient encore le train. »');
      }
    }
  }
  train.moving = c.harpoonsReleased === train.harpoons.length && !train.stopped && !train.destroyed;
  if (train.moving) train.x += train.speed * dt;
  train.y = terrainAt(train.x, s.planetId) - 58;
  for (const wagon of train.wagons) {
    wagon.x = train.x + wagon.offset;
    wagon.y = terrainAt(wagon.x, s.planetId) - (wagon.kind === 'hostages' ? 52 : 44);
  }
  const hostageWagon = train.wagons.find(item => item.kind === 'hostages');
  s.evidence.x = hostageWagon.x; s.evidence.y = hostageWagon.y - 18;
  if (train.brakeWorking && !train.stopped) {
    if (Math.abs(p.x - train.x) >= settings.interactionRadius + 30) {
      train.brakeWorking = false; train.brakeProgress = 0;
      emit(s, 'radio', 'Tess : « La cabine sort de portée. Reprends la liaison ; le frein n’est pas verrouillé. »');
    } else {
      train.brakeProgress = Math.min(1, train.brakeProgress + dt / settings.brakeTime);
      if (train.brakeProgress >= 1) {
        train.brakeWorking = false; train.stopped = true; train.moving = false;
        c.trainStopped = true; c.phase = 'rescue';
        emit(s, 'objective', 'Tess : « Traction coupée, frein verrouillé. Le train tient. Reviens au wagon fermé : Sami attend près des portes. »');
      }
    }
  }
  if (c.rescueWorking && !c.rescueResolved) {
    if (!train.stopped || Math.abs(p.x - hostageWagon.x) >= settings.interactionRadius + 30) {
      c.rescueWorking = false; c.rescueProgress = 0;
      emit(s, 'radio', 'Sami : « Le verrou n’est pas ouvert. Rapproche le marcheur, j’ai besoin de son treuil. »');
    } else {
      c.rescueProgress = Math.min(1, c.rescueProgress + dt / settings.rescueTime);
      if (c.rescueProgress >= 1) {
        c.rescueWorking = false; c.rescueResolved = true;
        c.hostagesRescued = c.hostagesTotal - c.hostagesLost; c.phase = 'report';
        emit(s, 'objective', `Sami : « ${c.hostagesRescued === 1 ? 'Un ouvrier en vie. On le met' : `${c.hostagesRescued} ouvriers en vie. On les met`} à couvert derrière la pile. Maintenant, regarde le registre à l’intérieur. »`);
      }
    }
  }
  c.trainIntegrity = clamp(train.hp / train.maxHp, 0, 1);
  if (train.x >= train.breakX || train.destroyed || train.hp <= 0) {
    const lost = c.hostagesTotal - c.hostagesRescued;
    s.stats.collateral += Math.max(0, lost - c.hostagesLost);
    c.hostagesLost = lost; c.rescueResolved = true; c.rescueWorking = false;
    if (!c.manifestRead) c.evidencePreserved = false;
    train.moving = false; train.destroyed = true; train.hp = 0; c.trainIntegrity = 0;
    finish(s, false, train.x >= train.breakX
      ? 'Le train a atteint la rupture du viaduc. La mission est perdue ; le dernier point enregistré permet de reprendre la tentative.'
      : 'La locomotive est détruite. Le train ne pourra pas être repris ; le dernier point enregistré permet de reprendre la tentative.');
  }
}

function trainInteraction(s) {
  const p = s.player, c = s.campaign, train = s.train;
  const harpoon = train.harpoons.find(item => !item.released && Math.abs(p.x - item.x) < 155);
  if (harpoon) return harpoon.working
    ? `Libération du harpon ${Math.round(harpoon.progress * 100)} % · restez près du treuil`
    : 'E · Détendre et décrocher le harpon (2,5 s)';
  if (c.harpoonsReleased < train.harpoons.length) return 'Libérer les deux harpons du train · repères de treuils';
  if (!train.stopped) {
    if (Math.abs(p.x - train.x) < s.mission.train.interactionRadius + 30) return train.brakeWorking
      ? `Freinage ${Math.round(train.brakeProgress * 100)} % · restez à portée de la cabine`
      : 'E · Couper la traction et verrouiller le frein (4 s)';
    return `Rejoindre la locomotive · ${Math.max(0, Math.ceil(train.breakX - train.x))} m avant la voie rompue`;
  }
  if (Math.abs(p.x - s.evidence.x) < s.mission.train.interactionRadius) {
    if (!c.rescueResolved) return c.rescueWorking
      ? `Ouverture du wagon ${Math.round(c.rescueProgress * 100)} % · restez à proximité`
      : 'E · Ouvrir le wagon et mettre les ouvriers à couvert (3 s)';
    if (!s.evidence.collected) return s.evidence.scanning ? 'Inspection du wagon… restez à proximité'
      : c.evidencePreserved ? 'E · Relever le registre de vente' : 'E · Consigner la perte du registre';
    if (!s.decision.resolved) return 'E · Signer le compte rendu du train';
  }
  if (!c.manifestRead) return 'Revenir au wagon fermé derrière la locomotive';
  if (Math.abs(p.x - s.extraction.x) < 250 && !s.extraction.active) return 'Extraction verrouillée · objectifs incomplets';
  return '';
}

function updateNetworkMission(s, dt) {
  const p = s.player, network = s.network, settings = s.mission.network;
  for (const station of network.stations) {
    station.flash = Math.max(0, station.flash - dt);
    const inRange = Math.abs(p.x - station.x) < settings.interactionRadius;
    if (station.scanning && !station.identified) {
      if (!inRange) {
        station.scanning = false; station.scanProgress = 0;
        emit(s, 'radio', 'Tess : « Terminal hors de portée. Reviens près de la source pour reprendre le relevé. »');
      } else {
        const civil = station.kind !== 'military' && !station.destroyed;
        station.scanProgress = Math.min(1, station.scanProgress + dt / (civil ? settings.civilianScanTime : settings.scanTime));
        if (civil && !network.scrutinyTriggered) {
          network.scrutinyElapsed = Math.min(settings.scrutinyThreshold, network.scrutinyElapsed + dt);
          if (network.scrutinyElapsed >= settings.scrutinyThreshold) {
            network.scrutinyTriggered = true;
            emit(s, 'radio', 'Holt : « Ces vérifications dépassent l’interruption demandée. Un drone de contrôle rejoint votre sortie. Votre délai sera inscrit. »');
          }
        }
        if (station.scanProgress >= 1) {
          station.scanning = false; station.identified = true;
          station.verified = !station.destroyed;
          station.secured = !station.destroyed;
          emit(s, 'objective', station.destroyed
            ? 'Ruines inspectées. Le dossier distingue les pertes et les transmissions impossibles à vérifier.'
            : station.kind === 'military' ? 'Guidage militaire identifié. E de nouveau pour isoler le relais du poste neuf.'
              : station.kind === 'dispensary' ? 'Sami : « Ce sont des appels de soins, pas du guidage. Le dispensaire demande une ambulance. » Gaine du terminal sécurisée contre les appuis.'
                : 'Sami : « Livraison d’eau, nouvelles des proches… les maisons parlent entre elles. » Gaine du terminal sécurisée contre les appuis.');
        }
      }
    }
    if (station.disabling && !station.disabled && !station.destroyed) {
      if (!inRange) {
        station.disabling = false; station.disableProgress = 0;
        emit(s, 'radio', 'Tess : « Liaison coupée avant l’isolement. Le relais militaire transmet toujours. »');
      } else {
        station.disableProgress = Math.min(1, station.disableProgress + dt / settings.disableTime);
        if (station.disableProgress >= 1) {
          station.disabling = false; station.disabled = true;
          emit(s, 'objective', 'Le relais du poste neuf est isolé. Vérifiez les deux autres émissions avant le rapport.');
        }
      }
    }
  }
  refreshNetworkFacts(s);
}

function networkInteraction(s) {
  const station = s.network.stations.find(item => Math.abs(s.player.x - item.x) < s.mission.network.interactionRadius);
  if (station) {
    if (!station.identified) return station.scanning
      ? `Inspection ${Math.round(station.scanProgress * 100)} % · restez à moins de 180 m`
      : station.destroyed ? 'E · Constater les ruines et les pertes (2 s)' : `E · Identifier l’émission et sécuriser le terminal (${station.kind === 'military' ? 2 : 4} s)`;
    if (station.kind === 'military' && !station.disabled && !station.destroyed) return station.disabling
      ? `Isolement ${Math.round(station.disableProgress * 100)} % · restez à proximité`
      : 'E · Isoler le relais militaire (2 s)';
    if (!s.evidence.collected && Math.abs(s.player.x - s.evidence.x) >= 230) return station.destroyed
      ? 'Constat relevé · source détruite' : 'Source identifiée · gaine protégée contre les pieds, murs vulnérables aux tirs';
  }
  if (Math.abs(s.player.x - s.evidence.x) < 230) {
    if (s.campaign.signalsIdentified < 3 || !s.campaign.militaryRelayDisabled) return 'Dossier incomplet · inspectez les trois sources et isolez le relais militaire';
    if (!s.evidence.collected) return s.evidence.scanning ? 'Compilation des relevés… restez à proximité' : 'E · Réunir le dossier des trois émissions';
    if (!s.decision.resolved) return 'E · Répondre à l’ordre de coupure civile';
  }
  if (s.decision.resolved) return 'Rejoindre la rampe de retour · préserver les circuits encore ouverts';
  return 'Identifier les trois émissions · garder les armes loin des bâtiments occupés';
}

function updateIndustrialMission(s, dt) {
  const p = s.player, site = s.industrial, c = s.campaign, settings = s.mission.industrial;
  site.post.flash = Math.max(0, site.post.flash - dt);
  const work = (item, seconds, done) => {
    if (!item.working) return;
    if (Math.abs(p.x - item.x) >= settings.interactionRadius) {
      item.working = false; item.progress = 0;
      emit(s, 'radio', 'Tess : « Liaison interrompue. Reviens à portée de la commande pour reprendre. »');
    } else {
      item.progress = Math.min(1, item.progress + dt / seconds);
      if (item.progress >= 1) { item.working = false; done(); }
    }
  };
  work(site.pump, settings.pumpTime, () => {
    site.pump.connected = true;
    emit(s, 'objective', 'Pompe portative en pression. Les deux vannes peuvent maintenant refroidir les turbines. La conduite des maisons reste à réparer au hangar.');
  });
  for (const turbine of site.turbines) {
    work(turbine, c.coolingAssistance ? settings.assistedCoolingTime : settings.coolingTime, () => {
      turbine.cooled = true;
      emit(s, 'objective', `${turbine.id === 'turbine-1' ? 'Première' : 'Deuxième'} turbine refroidie. La chaleur locale retombe.`);
    });
    turbine.temperature = turbine.cooled ? 25 : 90 - turbine.progress * 65;
    if (!turbine.cooled && Math.abs(p.x - turbine.x) < 230) {
      p.heat = Math.min(100, p.heat + dt * 10);
      if (p.heat >= 100 && !p.overheated) {
        p.overheated = true;
        emit(s, 'radio', 'Sécurité thermique active. Éloignez-vous de la turbine ou évacuez la chaleur.');
      }
    }
  }
  work(site.contact, settings.contactTime, () => {
    site.contact.contacted = true;
    emit(s, 'objective', 'Permanence du dispensaire : « Les véhicules privés sont passés avant la sirène, pas après. C’est ce que nous avons vu. Pour les pièces, il vous faut le journal du poste. » Témoignage recueilli, sans conclusion sur le motif.');
  });
  refreshIndustrialFacts(s);
}

function industrialInteraction(s) {
  const p = s.player, site = s.industrial, c = s.campaign, settings = s.mission.industrial;
  if (!site.pump.connected && Math.abs(p.x - site.pump.x) < settings.interactionRadius) return site.pump.working
    ? `Pompe portative ${Math.round(site.pump.progress * 100)} % · restez à portée`
    : 'E · Brancher la pompe portative (5 s) · conduite interrompue';
  const turbine = site.turbines.find(item => !item.cooled && Math.abs(p.x - item.x) < settings.interactionRadius);
  if (turbine) return !site.pump.connected ? 'Liquide absent · retour à la pompe portative'
    : turbine.working ? `Refroidissement ${Math.round(turbine.progress * 100)} % · restez à portée`
      : `E · Refroidir la turbine (${c.coolingAssistance ? 4 : 7} s) · chaleur rayonnante`;
  if (Math.abs(p.x - site.contact.x) < settings.interactionRadius) {
    if (!site.contact.available) return 'Canal du dispensaire indisponible · aucune liaison possible';
    if (!site.contact.contacted) return site.contact.working ? `Liaison au dispensaire ${Math.round(site.contact.progress * 100)} %`
      : 'E · Appeler la permanence du dispensaire (3 s, facultatif)';
  }
  if (Math.abs(p.x - site.post.x) < settings.interactionRadius) {
    if (c.turbinesCooled < 2) return 'Poste inaccessible · refroidissez les deux turbines';
    if (!c.maintenanceInspected) return s.evidence.scanning ? 'Relevé de maintenance… restez à proximité'
      : site.post.destroyed ? 'E · Constater les ruines et la perte du journal' : 'E · Copier le journal de maintenance';
    if (!s.decision.resolved) return 'E · Établir le compte rendu technique';
  }
  if (s.decision.resolved) return 'Rejoindre le retour au hangar · le dossier conserve les faits relevés';
  return c.coolantRestored ? 'Refroidir les deux turbines · protéger le poste de maintenance' : 'Rétablir le liquide à la pompe portative';
}

function updateWorld(s, dt) {
  const p = s.player;
  const e = s.evidence;
  if (s.missionId === 'MI01') updateCampaignApproach(s, dt);
  if (s.missionId === 'MI02') updateTrainMission(s, dt);
  if (s.missionId === 'MI03') updateNetworkMission(s, dt);
  if (s.missionId === 'MI04') updateIndustrialMission(s, dt);
  if (s.status !== 'playing') return;
  if (e.scanning && !e.collected) {
    if (Math.abs(p.x - e.x) > (s.missionId === 'MI04' ? s.mission.industrial.interactionRadius : 250)) { e.scanning = false; e.scanProgress = 0; emit(s, 'radio', 'Lecture interrompue : terminal hors de portée.'); }
    else {
      e.scanProgress = Math.min(1, e.scanProgress + dt / e.scanTime);
      if (e.scanProgress >= 1) {
        e.collected = true; e.scanning = false;
        if (s.missionId === 'MI04') {
          const c = s.campaign;
          c.maintenanceInspected = true; c.manifestRead = true; c.phase = 'report';
          c.logRecovered = !s.industrial.post.destroyed;
          refreshIndustrialFacts(s);
          emit(s, 'objective', c.logRecovered
            ? 'Tess : « Le journal porte un ordre militaire de remplacement avant le rejet. Voilà une anomalie datée, PT01. On ne sait pas encore pourquoi. » — E : établir le compte rendu.'
            : 'Tess : « Ruines constatées. Le journal n’a pas été copié ; aucune preuve technique n’est attribuée. Il faudra une autre source. » — E : établir le compte rendu.');
        } else         if (s.missionId === 'MI03') {
          s.campaign.manifestRead = true;
          emit(s, 'objective', 'Dossier réuni. Ces relevés établissent l’usage des émissions ; ils ne disent pas qui les a classées hostiles. — E : décider du sort des circuits civils.');
        } else if (s.missionId === 'MI02') {
          s.campaign.manifestRead = true; s.campaign.phase = 'report';
          emit(s, 'objective', s.campaign.evidencePreserved
            ? 'Sami : « Registre relevé. Un capitaine a vendu leurs dettes avec les personnes. Ce document ne dit pas jusqu’où cela remonte. » — E : établir le compte rendu.'
            : 'Sami : « État du wagon consigné. La preuve écrite est perdue. Nous pouvons encore rapporter les noms retrouvés et les pertes. » — E : établir le compte rendu.');
        } else if (s.campaign) {
          s.campaign.manifestRead = true;
          emit(s, 'objective', 'Sami : « Les Cales-Basses n’ont rien sur la feuille. Ils ont pourtant le même air que nous. » — E : répondre au compte rendu.');
        } else {
          s.stats.evidence++;
          emit(s, 'objective', 'Registre récupéré. Une nouvelle transmission attend votre réponse.');
        }
      }
    }
  }
  if (s.convoy) {
    const c = s.convoy;
    const hostileNear = s.enemies.some(e => !e.dead && e.kind !== 'air' && Math.abs(e.x - c.x) < 170);
    const deliveryX = s.mission.deliveryX ?? s.extraction.x - 40;
    const campaignWait = s.campaign && (s.campaign.passageWorking || c.waitTime > 0 || p.x - c.x < 105);
    c.moving = c.hp > 0 && Math.abs(c.x - p.x) < 620 && !hostileNear && !c.arrived && !campaignWait;
    if (c.moving) c.x = Math.min(deliveryX, c.x + dt * c.speed);
    c.y = terrainAt(c.x, s.planetId) - c.h / 2;
    if (c.hp > 0 && c.x >= deliveryX) { c.arrived = true; c.moving = false; }
    if (s.campaign && c.arrived && !s.campaign.filtersDelivered) {
      Object.assign(s.campaign, { phase: 'delivery', filtersDelivered: true,
        filtersDeliveredCount: s.mission.cargoCount, deliveryTime: s.elapsed });
      emit(s, 'objective', 'Sami : « Poste quarante-deux, les filtres sont là. Vingt-quatre caisses. On vérifie le manifeste près du poste. »');
    }
  }
  for (const c of s.civilians) {
    if (!c.alive || c.safe) continue;
    if (Math.abs(p.x - c.x) < 540) c.fleeing = true;
    if (c.fleeing) {
      c.x += dt * 31 * (c.x < p.x ? -1 : 1);
      c.y = terrainAt(c.x, s.planetId) - c.h / 2;
      if (Math.abs(c.x - p.x) > 750 || c.x < 90 || c.x > s.mission.length - 50) c.safe = true;
    }
  }
  for (const item of s.pickups) {
    if (!item.collected && Math.abs(p.x - item.x) < 80 && (p.hull < p.maxHull - 10 || p.rockets < p.maxRockets - 1 || p.reserveAmmo < p.maxReserveAmmo)) {
      item.collected = true;
      p.hull = Math.min(p.maxHull, p.hull + 155 * s.difficulty.repair);
      p.rockets = Math.min(p.maxRockets, p.rockets + 2);
      p.reserveAmmo = Math.min(p.maxReserveAmmo, p.reserveAmmo + p.maxAmmo * 3);
      p.feet.forEach(f => { f.health = Math.min(100, f.health + 30); });
      if (s.convoy && Math.abs(s.convoy.x - p.x) < 640) s.convoy.hp = Math.min(s.convoy.maxHp, s.convoy.hp + 110);
      emit(s, 'objective', 'Dépôt de campagne consommé : réparations, jusqu’à trois magasins en réserve et deux roquettes.');
    }
  }
  s.interaction = '';
  if (s.missionId === 'MI02') s.interaction = trainInteraction(s);
  else if (s.missionId === 'MI03') s.interaction = networkInteraction(s);
  else if (s.missionId === 'MI04') s.interaction = industrialInteraction(s);
  else if (s.missionId === 'MI01' && !s.campaign.passageSecured && s.campaign.pipeIntact && Math.abs(p.x - s.mission.passage.stationX) < s.mission.passage.radius) {
    s.interaction = s.campaign.passageWorking ? `Déploiement des dalles ${Math.round(s.campaign.passageProgress * 100)} % · restez près du treuil` : 'E · Déployer les dalles de protection (4,5 s)';
  } else if (!e.collected && Math.abs(p.x - e.x) < 230) {
    s.interaction = s.campaign ? !s.campaign.filtersDelivered ? 'Attendre Sami au poste · rapprochez le camion en restant près de lui' : e.scanning ? 'Lecture du manifeste… restez à proximité' : 'E · Vérifier le manifeste avec Sami' : e.scanning ? 'Lecture du registre… restez à proximité' : 'E · Lire le registre de transmissions';
  } else if (e.collected && !s.decision.resolved && Math.abs(p.x - s.mission.decisionX) < 300) s.interaction = s.campaign ? 'E · Classer le compte rendu de livraison' : 'E · Répondre au commandement';
  else if (Math.abs(p.x - s.extraction.x) < 250 && !s.extraction.active) s.interaction = 'Extraction verrouillée · objectifs incomplets';
  refreshObjectives(s);
  if (p.hull <= 0) finish(s, false, 'Marcheur immobilisé. Votre équipage a déclenché la balise de secours.');
  else if (s.convoy && s.convoy.hp <= 0) finish(s, false, s.campaign ? s.campaign.filtersDelivered ? 'Le camion de Sami est perdu au poste. Les filtres ont été livrés, mais l’escorte a échoué. Reprenez le dernier point de contrôle pour retenter la mission.' : 'Le camion de Sami est perdu. Les filtres n’atteindront pas le poste des mineurs. Reprenez le dernier point de contrôle pour retenter l’escorte.' : 'Le transport est perdu. La route du bac se ferme.');
  else if (s.extraction.active && Math.abs(p.x - s.extraction.x) < s.extraction.radius) {
    if (s.missionId === 'MI04') {
      refreshIndustrialFacts(s); s.campaign.phase = 'complete';
      const c = s.campaign;
      finish(s, true, `Station sécurisée : deux turbines refroidies. ${c.logRecovered ? 'Journal de maintenance copié ; anomalie matérielle PT01 conservée.' : 'Journal perdu ; une autre source technique reste nécessaire.'} ${c.witnessContacted ? 'La permanence du dispensaire a été effectivement jointe.' : 'Aucun témoignage du dispensaire recueilli.'} ${c.reportFiled ? 'Le constat accompagne le compte rendu signé.' : 'Le dossier est remis sous scellés.'}`);
      return;
    }
    if (s.missionId === 'MI03') {
      refreshNetworkFacts(s); s.campaign.phase = 'complete';
      const c = s.campaign;
      finish(s, true, `Relais militaire neutralisé. ${c.verifiedBuildings} émissions civiles vérifiées ; ${c.residentsLost} décès constatés. ${c.civilRelaysOnline} circuit${c.civilRelaysOnline > 1 ? 's' : ''} civil${c.civilRelaysOnline > 1 ? 's' : ''} encore alimenté${c.civilRelaysOnline > 1 ? 's' : ''}. ${c.witnessAvailable ? 'Le canal du dispensaire reste disponible pour un contact ultérieur.' : 'Le canal du dispensaire ne permet plus de joindre un témoin.'} ${c.reportFiled ? 'Le constat signé accompagne le dossier.' : 'L’ordre de coupure est exécuté.'}`);
      return;
    }
    if (s.missionId === 'MI02') {
      s.campaign.phase = 'complete';
      finish(s, true, `Train repris avant la voie rompue. ${trainHumanOutcome(s.campaign)} ${s.campaign.evidencePreserved ? 'Le registre de vente est conservé.' : 'Le registre de vente est détruit.'} ${s.campaign.recordFiled ? 'Le sort des ouvriers figure au compte rendu signé.' : 'Le dossier est remis sous scellés au dépôt.'}`);
      return;
    }
    if (s.campaign) {
      s.campaign.phase = 'complete';
      const pipe = s.campaign.pipeIntact ? 'La conduite tient ; la tournée suivante pourra passer.' : 'La conduite doit être réparée ; les maisons en aval attendent une équipe.';
      const notice = s.campaign.noticeFiled ? 'Le signalement des Cales-Basses figure au compte rendu.' : 'La livraison prévue est classée sans signalement des Cales-Basses.';
      finish(s, true, `Vingt-quatre caisses de filtres livrées. ${pipe} ${notice}`);
      return;
    }
    const decisionText = s.decision.choice === 'defy' ? 'Vous avez désobéi. Une copie du registre a échappé au commandement.' : 'Vous avez exécuté l’ordre. Le rapport impérial reste intact.';
    finish(s, true, `${s.mission.name} — opération terminée. ${decisionText}`);
  }
}

function refreshObjectives(s) {
  const goals = [];
  if (s.missionId === 'MI04') {
    const c = s.campaign;
    goals.push({ id: 'coolant', label: c.coolantRestored ? 'Liquide de refroidissement disponible' : 'Brancher la pompe portative : conduite interrompue', current: c.coolantRestored ? 1 : 0, target: 1, complete: c.coolantRestored });
    goals.push({ id: 'turbines', label: 'Refroidir les deux turbines', current: c.turbinesCooled, target: 2, complete: c.turbinesCooled === 2 });
    goals.push({ id: 'evidence', label: c.maintenanceInspected && !c.logRecovered ? 'Constater la perte du journal de maintenance' : 'Inspecter le poste et copier son journal', current: c.maintenanceInspected ? 1 : 0, target: 1, complete: c.maintenanceInspected });
    goals.push({ id: 'order', label: 'Établir le compte rendu technique', current: s.decision.resolved ? 1 : 0, target: 1, complete: s.decision.resolved });
    s.extraction.active = goals.every(goal => goal.complete);
    goals.push({ id: 'extract', label: 'Rejoindre le hangar après la station', current: s.status === 'won' ? 1 : 0, target: 1, complete: s.status === 'won' });
    s.objectives = goals; return;
  }
  if (s.missionId === 'MI03') {
    const c = s.campaign;
    goals.push({ id: 'signals', label: 'Identifier les trois sources ou constater leurs ruines', current: c.signalsIdentified, target: 3, complete: c.signalsIdentified === 3 });
    goals.push({ id: 'military', label: 'Isoler le relais militaire du poste neuf', current: c.militaryRelayDisabled ? 1 : 0, target: 1, complete: c.militaryRelayDisabled });
    goals.push({ id: 'evidence', label: 'Réunir le dossier des émissions au poste de sortie', current: c.manifestRead ? 1 : 0, target: 1, complete: c.manifestRead });
    goals.push({ id: 'order', label: 'Répondre à l’ordre de coupure civile', current: s.decision.resolved ? 1 : 0, target: 1, complete: s.decision.resolved });
    s.extraction.active = goals.every(goal => goal.complete);
    goals.push({ id: 'extract', label: 'Rejoindre la rampe de retour au hangar', current: s.status === 'won' ? 1 : 0, target: 1, complete: s.status === 'won' });
    s.objectives = goals; return;
  }
  if (s.missionId === 'MI02') {
    const c = s.campaign, train = s.train;
    goals.push({ id: 'harpoons', label: 'Libérer les deux harpons des Brisants', current: c.harpoonsReleased, target: train.harpoons.length, complete: c.harpoonsReleased === train.harpoons.length });
    goals.push({ id: 'train', label: train.stopped ? 'Locomotive immobilisée avant la voie rompue' : 'Rejoindre la locomotive et verrouiller le frein', current: c.trainStopped ? 1 : 0, target: 1, complete: c.trainStopped });
    goals.push({ id: 'rescue', label: c.hostagesLost ? `Ouvriers : ${c.hostagesRescued} secourus · ${c.hostagesLost} décès` : 'Ouvrir le wagon et secourir les ouvriers', current: c.hostagesRescued + c.hostagesLost, target: c.hostagesTotal, complete: c.rescueResolved });
    goals.push({ id: 'evidence', label: c.evidencePreserved ? 'Relever le registre de vente du wagon' : 'Consigner la destruction du registre', current: c.manifestRead ? 1 : 0, target: 1, complete: c.manifestRead });
    goals.push({ id: 'order', label: 'Établir le compte rendu de reprise du train', current: s.decision.resolved ? 1 : 0, target: 1, complete: s.decision.resolved });
    s.extraction.active = goals.every(goal => goal.complete) && train.hp > 0;
    goals.push({ id: 'extract', label: 'Rejoindre la rampe de retour au hangar', current: s.status === 'won' ? 1 : 0, target: 1, complete: s.status === 'won' });
    s.objectives = goals;
    return;
  }
  if (s.campaign) {
    goals.push({ id: 'passage', label: s.campaign.pipeIntact ? 'Franchir la conduite ; dalles disponibles au treuil' : 'Conduite rompue · réparation inscrite au retour', current: s.notified.ambush ? 1 : 0, target: 1, complete: Boolean(s.notified.ambush) });
    goals.push({ id: 'escort', label: 'Livrer les 24 caisses de filtres au poste', current: Math.floor(s.convoy.x), target: s.mission.deliveryX, complete: s.campaign.filtersDelivered });
    goals.push({ id: 'evidence', label: 'Après livraison, lire le manifeste avec Sami', current: s.campaign.manifestRead ? 1 : 0, target: 1, complete: s.campaign.manifestRead });
    goals.push({ id: 'order', label: 'Classer le compte rendu de livraison', current: s.decision.resolved ? 1 : 0, target: 1, complete: s.decision.resolved });
    s.extraction.active = goals.every(g => g.complete);
    goals.push({ id: 'extract', label: 'Rejoindre la rampe de retour au hangar', current: s.status === 'won' ? 1 : 0, target: 1, complete: s.status === 'won' });
    s.objectives = goals;
    return;
  }
  if (s.mission.type === 'relay') {
    const count = s.relays.filter(r => r.destroyed).length;
    goals.push({ id: 'relays', label: 'Neutraliser les relais', current: count, target: s.relays.length, complete: count === s.relays.length });
  }
  if (s.mission.type === 'escort') goals.push({ id: 'escort', label: 'Conduire le transport au bac', current: Math.floor(s.convoy.x), target: s.extraction.x - 40, complete: s.convoy.arrived });
  goals.push({ id: 'evidence', label: 'Récupérer le registre', current: s.evidence.collected ? 1 : 0, target: 1, complete: s.evidence.collected });
  goals.push({ id: 'order', label: 'Répondre à l’ordre reçu', current: s.decision.resolved ? 1 : 0, target: 1, complete: s.decision.resolved });
  if (s.mission.type === 'boss') {
    const boss = s.enemies.find(e => e.type === 'boss');
    // Obedience allows withdrawal; defiance requires surviving and defeating the pursuing Cerbère.
    const complete = s.decision.choice === 'obey' || Boolean(boss?.dead);
    goals.push({ id: 'boss', label: s.decision.choice === 'obey' ? 'Autorisation de repli reçue' : 'Neutraliser Cerbère', current: complete ? 1 : 0, target: 1, complete });
  }
  s.extraction.active = goals.every(g => g.complete);
  goals.push({ id: 'extract', label: 'Rejoindre l’extraction', current: s.status === 'won' ? 1 : 0, target: 1, complete: s.status === 'won' });
  s.objectives = goals;
}

function finish(s, won, text) {
  if (s.status !== 'playing') return;
  s.status = won ? 'won' : 'lost'; s.outcome = text;
  if (won) { s.stats.score += 750 + (s.evidence.collected ? 200 : 0); }
  refreshObjectives(s);
  emit(s, won ? 'victory' : 'defeat', text);
}

export function updateGame(s, delta, input = {}) {
  if (!s || s.status !== 'playing' || s.decision.active) return s;
  const dt = clamp(finite(delta), 0, 0.05);
  if (dt === 0) return s;
  s.elapsed += dt;
  s.player.move = Math.sign(finite(input.move));
  s.player.braced = Boolean(input.brace);
  for (const action of ['stepA', 'stepB', 'interact', 'reload', 'repair']) {
    if (input[action] && !s.inputHeld[action]) commandGame(s, action);
    s.inputHeld[action] = Boolean(input[action]);
  }
  if (s.decision.active) return s;
  updateWalker(s, dt, input);
  updateEnemies(s, dt);
  updateProjectiles(s, dt);
  updateWorld(s, dt);
  s.cameraShake = Math.max(0, s.cameraShake - dt * 1.8);
  for (const r of s.relays) r.flash = Math.max(0, r.flash - dt);
  for (const part of s.particles) {
    part.x += part.vx * dt; part.y += part.vy * dt; part.life -= dt;
    part.vx *= 1 - dt * 1.4;
    part.vy += (part.type === 'smoke' ? -40 : 150) * dt;
  }
  s.particles = s.particles.filter(p => p.life > 0);
  return s;
}
