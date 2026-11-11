import { WALKERS, MISSIONS, CAMPAIGN_MISSIONS, DIFFICULTIES } from './content.mjs';
import { createGame, updateGame, commandGame } from './simulation.mjs';
import { Renderer } from './renderer.mjs';
import { livingRouteSummary } from './thyr-renderer.mjs';
import { chemicalSummary, chemicalTankRole } from './chemical-renderer.mjs';
import { AudioEngine } from './audio.mjs';
import { CONTROL_ACTIONS, normalizeBindings, bindingLabel, remapBinding, keyboardActions, GamepadInput, defaultBindings, formatControlText } from './controls.mjs';
import { createCampaign, readCampaign, writeCampaign, beginCampaignMission, checkpointCampaign, restoreCampaignGame, finishCampaignMission, serviceCampaignWalker, repairCampaignPipe, campaignRepairCost, serializeCampaign, parseCampaign, nextCampaignMissionId } from './campaign.mjs';

const $ = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const defaults = { difficulty: 'normal', assist: true, shake: true, motion: matchMedia('(prefers-reduced-motion: reduce)').matches, contrast: false, volume: 55, walkerId: 'WK01', missionId: 'op01' };
function load(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' && !Array.isArray(v) ? v : fallback; } catch { return fallback; } }
const saved = load('imperium.settings.v1', {});
const settings = { ...defaults, bindings: normalizeBindings(saved.bindings) };
for (const key of ['assist', 'shake', 'motion', 'contrast']) if (typeof saved[key] === 'boolean') settings[key] = saved[key];
if (Object.hasOwn(DIFFICULTIES, saved.difficulty)) settings.difficulty = saved.difficulty;
if (Number.isFinite(saved.volume)) settings.volume = clamp(saved.volume, 0, 100);
if (WALKERS.some(w => w.id === saved.walkerId)) settings.walkerId = saved.walkerId;
if (MISSIONS.some(m => m.id === saved.missionId)) settings.missionId = saved.missionId;
const records = load('imperium.records.v1', {});
let storageAvailable = true;
function persist(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { storageAvailable = false; $('local-status').textContent = 'PRÉFÉRENCES POUR CETTE SESSION'; } }
function saveSettings() { persist('imperium.settings.v1', settings); }
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const audio = new AudioEngine();
const renderer = new Renderer($('game-canvas'));
const hangarRenderer = new Renderer($('hangar-canvas'));
let game = null, view = 'campaign', archive = 'doctrine', inGame = false, paused = false, lastTime = 0, hudTick = 0, lastEventId = 0, radioUntil = 0, resultRecorded = false, radioQueue = [];
let campaignStorage;
try { campaignStorage = window.localStorage; } catch { campaignStorage = null; }
const loadedCampaign = readCampaign(campaignStorage);
let campaign = loadedCampaign.campaign, campaignBlocked = loadedCampaign.blocked === true, campaignWarning = loadedCampaign.warning || '';
let selectedCampaignId = nextCampaignMissionId(campaign) || CAMPAIGN_MISSIONS.at(-1).id, pendingCampaignId = selectedCampaignId;
let activeMode = 'operations', pendingMode = 'operations', campaignReplay = false, pendingReplay = false, lastCampaignSaveAt = -1, decisionCheckpointTaken = false, pendingImport = null;
const keys = new Set(), touch = {};
const gamepad = new GamepadInput();
let padState = gamepad.sample([]), bindingCapture = null, aimMode = 'pointer';
const padAim = { x: 1, y: 0 };
const keyLabel = id => bindingLabel(settings.bindings[id]);
const controlsText = text => formatControlText(text, settings.bindings);
const pointer = { x: 1100, y: 570, clientX: 0, clientY: 0, visible: false, fire: false, secondary: false, touched: false };
const selectedWalker = () => WALKERS.find(w => w.id === settings.walkerId);
const selectedMission = () => MISSIONS.find(m => m.id === settings.missionId);
const campaignOrders = {
  MI10: {
    status: 'Une réserve chimique est attribuée aux rebelles. Holt demande sa destruction.',
    description: 'Trois cuves bordent les canaux des cultures. Une conduite fuit déjà. Tess demande de relever leurs marquages et de préserver un prélèvement avant de toucher au stock. Des forces privées surveillent le site.',
    task: 'Identifier les trois cuves, contenir la fuite, défendre le prélèvement puis accomplir le traitement choisi.',
    caution: 'Le collecteur permet d’isoler le rejet. Les canaux alimentent le village : leur contamination ne disparaît pas après une manœuvre.',
  },
  MI09: {
    status: 'Première affectation sur Thyr. Holt veut une route logistique dégagée à travers la vallée.',
    description: 'Les colonnes vivantes portent des habitats absents de la carte. Un troupeau attend devant la barrière du couloir militaire. Le poste des cultures peut vous indiquer une approche adaptée aux racines et à votre châssis.',
    task: 'Reconnaître les appuis, confronter les cartes, accomplir la route choisie puis escorter la logistique.',
    caution: 'Les longues-dorses fécondent les vergers. Les racines portent les habitats ; tirs, pas et projecteurs ont des effets distincts.',
  },
  MI01: {
    status: 'Ordre reçu. Préparez votre marcheur au hangar, puis rejoignez Sami.',
    description: 'Le poste des mineurs attend ses filtres depuis trois jours. Sami connaît la route. Tess connaît les limites de votre machine.',
    task: 'Ouvrir le passage et escorter les filtres.',
    caution: 'Conduite fissurée. Équipe antichar signalée.',
  },
  MI02: {
    status: 'Holt attend la reprise du train. Les événements du couloir quarante-deux restent dans votre dossier.',
    description: 'Un train de minerai a disparu du réseau de Vesper. Des harpons retiennent ses wagons sur un viaduc condamné. Holt veut récupérer sa cargaison.',
    task: 'Libérer les harpons, freiner le train et inspecter les wagons.',
    caution: 'Voie rompue en aval. Des voix proviennent d’un wagon fermé : surveillez vos tirs.',
  },
  MI03: {
    status: 'Trois émissions sont désignées comme hostiles. Tess demande une identification sur place avant toute coupure.',
    description: 'À la tombée du jour, trois émetteurs restent actifs au-dessus des Cales-Basses. Holt exige leur silence. Derrière les antennes, des fenêtres sont encore allumées.',
    task: 'Identifier les émissions, neutraliser le relais militaire et vérifier les deux bâtiments occupés.',
    caution: 'Sécurisez les terminaux avant de les franchir. Les tirs peuvent atteindre les habitants ; Holt surveille votre délai.',
  },
  MI04: {
    status: 'Le rejet est classé comme accidentel. Tess veut lire le journal de maintenance avant de quitter Vesper.',
    description: 'Les turbines sont encore brûlantes. Une équipe privée replie son matériel. Les fiches du poste de maintenance doivent permettre à Tess de reconstituer ce qui s’est passé avant le rejet.',
    task: 'Rétablir le circuit, refroidir les deux turbines et inspecter le poste de maintenance.',
    caution: 'Préservez le journal. Les conduites, les ouvriers du train et le dispensaire changent vos moyens sur place.',
  },
  MI06: {
    status: 'Les marques de niveau traversent les fenêtres des Trois-Vannes. Mara demande du temps pour sortir les habitants.',
    description: 'Deux techniciens attendent devant un panneau déformé. Votre marcheur peut porter la charge pendant leur travail. Le circuit prescrit protège le quai privé et met les maisons sous l’eau.',
    task: 'Relever les seuils, tenir le panneau, couvrir les techniciens et achever le circuit choisi.',
    caution: 'Ancrez tous les appuis pour soutenir la digue. Les personnes évacuées et les logements préservés ont des bilans distincts.',
  },
  MI08: {
    status: 'Holt demande la fermeture des portes d’Aval. Les personnes présentes au quai n’ont pas encore embarqué.',
    description: 'Le courant traverse le bassin. Deux bateaux attendent leurs équipages et un refuge doit confirmer ses places. Retrouvez les survivants des missions précédentes, préparez les accès et recueillez leurs accords avant de manœuvrer les portes.',
    task: 'Régler l’amenée, organiser les accueils, faire accomplir le trajet choisi et transmettre le bilan.',
    caution: 'Places assises, brancards et opérateurs sont distincts. Une fermeture, un départ et une arrivée doivent chacun être accomplis.',
  },
  MI07: {
    status: 'Holt désigne un dépôt mobile de munitions. Une conductrice demande une aire sûre pour arrêter son ambulance.',
    description: 'Sous la caisse sanitaire, Tess aperçoit un boîtier récemment fixé. Faites arrêter le véhicule, échangez avec son équipe et examinez ce que la signature hostile prétend identifier.',
    task: 'Protéger l’arrêt, établir la cargaison, relever la balise et accompagner les patients vers un accueil.',
    caution: 'La rampe dépend de la digue. Le choix de destination exige ensuite un transfert réel ; les tirs menacent aussi les patients et leur équipe.',
  },
  MI05: {
    status: 'Le chenal de Nacre est bloqué. Deux barges portent le même pavillon ; leurs équipages ne font pas le même travail.',
    description: 'Le bateau civil attend une fenêtre de marée devant les câbles du blocus. Depuis la digue, deux équipages vous appellent. Vérifiez ce qu’ils transportent avant de décider qui couvrir.',
    task: 'Libérer les deux treuils, inspecter les barges et protéger la traversée civile.',
    caution: 'Bancs submersibles : surveillez la marée ou déployez les passerelles. Vos tirs atteignent aussi les bateaux.',
  },
};
const timeLabel = time => `${Math.floor(time / 60).toString().padStart(2, '0')}:${Math.floor(time % 60).toString().padStart(2, '0')}`;
let toastTimer;
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 3200); }
function releasePointer() { pointer.fire = false; pointer.secondary = false; }
function clearInput() { keys.clear(); gamepad.reset(); padState = { ...padState, input: gamepad.sample([]).input }; releasePointer(); for (const k of Object.keys(touch)) touch[k] = false; }
function hasPageFocus() { return !document.hidden && document.hasFocus?.() !== false; }
function missionAcceptsInput() { return inGame && game?.status === 'playing' && !paused && !game.decision.active && hasPageFocus(); }
function suspendForFocus() {
  clearInput();
  if (inGame && !document.querySelector('dialog[open]')) pauseMission();
  audio.setPaused(true);
}
function closeDialogs() { all('dialog[open]').forEach(d => d.close()); }

function saveCampaign({ replaceInvalid = false } = {}) {
  if (campaignBlocked && !replaceInvalid) return false;
  const previousWarning = campaignWarning;
  const result = writeCampaign(campaignStorage, campaign, { replaceInvalid });
  campaignWarning = result.warning || '';
  if (result.ok) campaignBlocked = false;
  if (!result.ok && campaignWarning !== previousWarning) toast(campaignWarning);
  renderCampaignStatus();
  return result.ok;
}
function captureCampaign(beforeDecision = false) {
  if (activeMode !== 'campaign' || campaignReplay || !game || (game.status !== 'playing' && !(['MI06', 'MI07', 'MI08', 'MI09', 'MI10'].includes(game.missionId) && game.status === 'lost'))) return;
  try {
    campaign = checkpointCampaign(campaign, game, { beforeDecision });
    lastCampaignSaveAt = game.elapsed;
    saveCampaign();
  } catch (error) {
    campaignWarning = `La reprise n’a pas pu être enregistrée : ${error.message}`;
    renderCampaignStatus();
  }
}
function renderCampaignStatus() {
  $('campaign-save-status').textContent = campaignBlocked
    ? 'Ce dossier ne peut pas être lu. Le fichier existant est conservé. Importez une copie valide ou créez un nouveau dossier.'
    : campaignWarning || (campaign.checkpoint?.status === 'lost' ? 'La sortie a échoué. Consultez le bilan ou recommencez ; le carburant déjà utilisé reste dépensé.' : campaign.checkpoint ? `Reprise enregistrée au dernier point de liaison. Exportez le dossier pour le transférer sur un autre appareil.` : 'La progression est conservée sur cet appareil. Exportez le dossier pour le transférer.');
  $('campaign-save-status').classList.toggle('save-warning', Boolean(campaignWarning || campaignBlocked));
}
function campaignReceiptFacts(receipt) {
  if (receipt.missionId === 'MI10') return [
    ['CUVES RELEVÉES', `${receipt.tanksInspected} / 3 · ${receipt.copiedMarks} marquages copiés`],
    ['CONDUITE RETENUE', receipt.plan === 'demolish' ? 'Démolition de la réserve' : 'Mise en sécurité des cuves'],
    ['ÉTAT DES CUVES', `${receipt.tanksSecured} isolées · ${receipt.tanksDestroyed} détruites`],
    ['PRÉLÈVEMENT', receipt.sampleCollected ? 'Matière conservée à bord' : 'Perdu · aucune matière reconstituée'],
    ['PROVENANCE MATÉRIELLE', receipt.orisonRecordCopied ? 'Registre des lots copié' : 'Registre perdu'],
    ['PT02', receipt.pt02Acquired ? 'Prélèvement et provenance conservés' : 'Conditions matérielles non réunies'],
    ['ÉCOULEMENT', `${receipt.spillRetained.toFixed(1)} unités retenues · ${receipt.spillDelivered.toFixed(1)} arrivées en aval`],
    ['CANAUX', `${receipt.canalsIntact} intacts · ${receipt.canalsPolluted} contaminés`],
    ['VILLAGE', receipt.villageHabitable ? 'Habitable' : 'Habitabilité compromise'],
  ];
  if (receipt.missionId === 'MI09') return [
    ['LONGUES-DORSES', `${receipt.migratorsArrived} au verger · ${receipt.migratorsDisplaced} détournées · ${receipt.migratorsLost} perdues`],
    ['ROUTE ACCOMPLIE', receipt.route === 'migration' ? 'Passage migratoire' : 'Déviation impériale'],
    ['APPROCHE', receipt.approach === 'guided' ? 'Guidée par les habitants' : receipt.approach === 'surveyed' ? 'Relevée sans aide locale' : 'Aucune reconnaissance accomplie'],
    ['HABITATS HABITABLES', `${receipt.homesHabitable} / 2`],
    ['COLONNES INTACTES', `${receipt.columnsIntact} / 2`],
    ['ÉVENTAILS REVENUS', `${receipt.pollinatorsPresent} / 2 colonies`],
    ['CULTURES', receipt.harvestFragile ? 'Récoltes fragilisées' : 'Quatre arrivées fécondantes'],
    ['LOGISTIQUE', receipt.logisticsArrived ? 'Arrivée constatée' : receipt.logisticsDestroyed ? 'Transport perdu' : 'Trajet non accompli'],
    ['CARTE', receipt.hamletsRecorded ? 'Deux habitats et la route migratoire relevés' : 'Omissions non relevées'],
  ];
  if (receipt.missionId === 'MI08') return [
    ['PERSONNES RECENSÉES', receipt.peopleTotal], ['DÉPARTS ACQUIS', receipt.peopleDeparted],
    ['ARRIVÉES AU REFUGE', receipt.peopleArrived], ['ACCUEIL LOCAL', receipt.peopleLocal], ['PERTES À AVAL', receipt.peopleLost],
    ['PATIENTS', `${receipt.patientsArrived} au refuge · ${receipt.patientsLocal} à Aval · ${receipt.patientsLost} perdus`],
    ['BATEAUX', `${receipt.boatsDeparted} partis · ${receipt.boatsArrived} arrivés · ${receipt.boatsLost} perdus`],
    ['OUVRAGES', receipt.execution === 'damaged' ? 'Avaries constatées' : receipt.closureCompleted ? 'Deux accès fermés' : receipt.accessMaintained ? 'Passage maintenu' : 'État consigné'],
    ['REGISTRE DE RELOGEMENT', receipt.registryCopied ? 'Pages et obligations de travail copiées' : 'Support perdu · absence consignée'],
    ['MARA', receipt.maraDeparted ? 'Rencontrée, accord reçu, départ accompli' : receipt.maraPresent ? 'Présence au quai établie' : 'Absente du quai'],
  ];
  if (receipt.missionId === 'MI07') return [
    ['PATIENTS ARRIVÉS', `${receipt.patientsArrived} / ${receipt.patientsTotal}`],
    ['PATIENTS PERDUS', receipt.patientsLost],
    ['ÉQUIPE SANITAIRE', `${receipt.staffAlive} vivants · ${receipt.staffArrived} arrivés`],
    ['CARGAISON', receipt.medicalCargoVerified ? 'Matériel sanitaire vérifié' : 'Constat sans cargaison vérifiable'],
    ['BALISE', receipt.beaconRecovered ? 'Pièce, attaches et journal conservés' : 'Perdue · constat conservé'],
    ['ORIGINE DE LA POSE', 'À recouper'],
    ['RAMPE / DESTINATION', `${receipt.route === 'main' ? 'Principale' : 'Secondaire'} · ${receipt.destination === 'clinic' ? 'Accueil civil' : 'Poste médical impérial'}`],
    ['VÉHICULE', receipt.vehicleDestroyed ? 'Détruit' : receipt.vehicleSeized ? 'Arrivé puis saisi' : receipt.vehicleRecovered ? 'Conservé pour les soins' : 'Non récupéré'],
    ['ACCORD À TÉMOIGNER', receipt.witnessConsent ? receipt.witnessAvailable ? 'Recueilli · témoin vivant' : 'Recueilli · témoin décédé' : 'Non recueilli'],
    ['CONTACT DE MARA', receipt.maraContacted ? 'Relevé transmis par radio' : 'Aucune transmission'],
  ];
  if (receipt.missionId === 'MI06') return [
    ['HABITANTS À L’ABRI', `${receipt.residentsSafe} / ${receipt.residentsTotal}`],
    ['HABITANTS PERDUS', receipt.residentsLost],
    ['LOGEMENTS INHABITABLES', `${receipt.homesUninhabitable} / ${receipt.homesTotal}`],
    ['TECHNICIENS VIVANTS', `${receipt.techniciansAlive} / ${receipt.techniciansTotal}`],
    ['SOUTIEN DU PANNEAU', receipt.emergencyShoring ? 'Étai manuel de secours' : 'Verrou posé par le technicien'],
    ['CIRCUIT ACCOMPLI', receipt.circuit === 'diversion' ? 'Dérivation des maisons' : 'Réglage impérial du quai'],
    ['CARBURANT DE CETTE SORTIE', `${receipt.fuelSpent} lot${receipt.fuelSpent > 1 ? 's' : ''} consommé${receipt.fuelSpent > 1 ? 's' : ''}`],
    ['POMPES', receipt.pumpsOnline ? 'Remise en service accomplie' : 'À l’arrêt'],
  ];
  if (receipt.missionId === 'MI05') return [
    ['PASSAGERS AU QUAI', `${receipt.refugeesPassed} / ${receipt.refugeesTotal}`],
    ['PASSAGERS PERDUS', receipt.refugeesLost],
    ['ÉQUIPAGE DE RIVE-COURTE', receipt.bargeCiviliansLost ? `${receipt.bargeCiviliansLost} décès consignés` : 'Équipage préservé'],
    ['TRAFIC CONSTATÉ', receipt.traffickingVerified ? 'Facture relevée' : 'Aucune facture récupérée'],
    ['CONTACT PASSEUR', receipt.smugglerVerified ? 'Échange avec Vann Ostre réalisé' : 'Aucun échange réalisé'],
    ['CARBURANT CHARGÉ', `${receipt.fuelLots} lot${receipt.fuelLots > 1 ? 's' : ''}`],
    ['COMPTE RENDU', receipt.reportFiled ? 'Constat des équipages joint' : 'Passage confirmé au bordereau'],
  ];
  if (receipt.missionId === 'MI04') return [
    ['TURBINES REFROIDIES', `${receipt.turbinesCooled} / 2`],
    ['JOURNAL TECHNIQUE', receipt.technicalEvidence ? 'PT01 · copie conservée' : 'Perdu · autre source à rechercher'],
    ['POSTE DE MAINTENANCE', receipt.maintenanceIntact ? 'Bâtiment debout' : 'Bâtiment détruit'],
    ['AIDE DES OUVRIERS', receipt.coolingAssistance ? 'Manœuvres assistées' : 'Manœuvres sans renfort'],
    ['CONTACT DU DISPENSAIRE', receipt.witnessContacted ? 'Échange radio réalisé' : 'Aucun échange réalisé'],
    ['COMPTE RENDU', receipt.reportFiled ? 'Constat technique joint' : 'Dossier remis sous scellés'],
  ];
  if (receipt.missionId === 'MI03') return [
    ['RÉSEAUX CIVILS ACTIFS', `${receipt.civilRelaysOnline} / 2`],
    ['DISPENSAIRE', receipt.dispensaryIntact ? 'Bâtiment debout' : 'Bâtiment détruit'],
    ['ACCÈS AU TÉMOIN', receipt.witnessAvailable ? 'Possible ultérieurement' : 'Contact indisponible'],
    ['HABITANTS PERDUS', receipt.residentsLost],
    ['CONTRÔLE DE HOLT', receipt.holtAlerted ? 'Déclenché' : 'Non déclenché'],
    ['COMPTE RENDU', receipt.reportFiled ? 'Constat des bâtiments joint' : 'Coupure générale exécutée'],
  ];
  if (receipt.missionId === 'MI02') return [
    ['OUVRIERS LIBÉRÉS', `${receipt.hostagesRescued} / ${receipt.hostagesTotal}`],
    ['OUVRIERS PERDUS', receipt.hostagesLost],
    ['REGISTRE DE VENTE', receipt.evidencePreserved ? 'Préservé' : 'Détruit sous les tirs'],
    ['COMPTE RENDU', receipt.recordFiled ? 'Sort des ouvriers signalé' : 'Dossier remis scellé'],
  ];
  return [['FILTRES', receipt.filtersDeliveredCount], ['CONDUITE', receipt.pipeIntact ? 'Préservée' : campaign.world.vesper.pipeRepaired ? 'Réparée au retour' : 'À réparer'], ['CALES-BASSES', receipt.noticeFiled ? 'Signalement joint' : 'Hors du bordereau'], ['PERTES CIVILES', receipt.collateral]];
}
function renderCampaignUI() {
  const nextId = nextCampaignMissionId(campaign);
  if (!campaign.completed[selectedCampaignId] && selectedCampaignId !== nextId) selectedCampaignId = nextId || CAMPAIGN_MISSIONS.at(-1).id;
  const mission = CAMPAIGN_MISSIONS.find(m => m.id === selectedCampaignId);
  const completed = campaign.completed[selectedCampaignId];
  const order = campaignOrders[selectedCampaignId];
  const hasCheckpoint = Boolean(campaign.checkpoint);
  const continuing = campaign.activeMissionId === selectedCampaignId && hasCheckpoint;
  const receipt = completed || campaign.lastDebrief;
  $('campaign-deploy').innerHTML = completed ? 'REJOUER CETTE MISSION <span>↗</span>' : continuing ? 'RECOMMENCER LA MISSION <span>↗</span>' : selectedCampaignId === 'MI01' ? 'COMMENCER LA CAMPAGNE <span>↗</span>' : 'POURSUIVRE LA CAMPAGNE <span>↗</span>';
  $('campaign-deploy').disabled = campaignBlocked;
  $('campaign-resume').hidden = !hasCheckpoint;
  $('campaign-resume').disabled = campaignBlocked;
  $('campaign-resume').textContent = hasCheckpoint ? campaign.checkpoint.status === 'lost' ? `Voir le bilan de ${campaign.activeMissionId}` : `Reprendre ${campaign.activeMissionId}` : 'Reprendre la mission';
  $('campaign-export').disabled = campaignBlocked;
  $('campaign-status').textContent = completed ? 'Rapport classé. Une relecture conserve vos premiers choix et ne donne aucune dotation supplémentaire.' : continuing ? 'Sortie en cours. Votre dernière liaison permet de reprendre la mission et son état exact.' : order.status;
  $('campaign-order-index').textContent = `${mission.planet.toUpperCase()} / MISSION ${mission.number}`;
  $('campaign-order-number').textContent = mission.number;
  $('campaign-order-title').textContent = mission.name;
  $('campaign-order-description').textContent = order.description;
  $('campaign-order-task').textContent = order.task;
  $('campaign-order-caution').textContent = order.caution;
  $('view-campaign').classList.toggle('nacre-chapter', mission.planetId === 'PL02');
  $('view-campaign').classList.toggle('thyr-chapter', mission.planetId === 'PL03');
  $('campaign-progress').textContent = `${Object.keys(campaign.completed).length} / ${CAMPAIGN_MISSIONS.length} RAPPORTS CLASSÉS`;
  $('campaign-transition').hidden = !campaign.completed.MI04;
  if (campaign.completed.MI04) {
    const inherited = campaign.completed.MI04.technicalEvidence
      ? 'Tess conserve le journal de maintenance : une pièce a été remplacée avant le rejet, sur ordre militaire. Sa raison reste à établir.'
      : 'Le journal du poste a été perdu. Le bilan de Vesper conserve cette absence ; une autre source technique reste à trouver.';
    const passage = campaign.completed.MI05;
    $('campaign-transition-text').textContent = `${inherited} ${passage
      ? campaign.completed.MI08 ? `Aux portes d’Aval, ${campaign.completed.MI08.peopleDeparted} personnes sont parties, ${campaign.completed.MI08.peopleArrived} sont arrivées au refuge et ${campaign.completed.MI08.peopleLocal} ont rejoint l’accueil local. Le bilan garde ${campaign.completed.MI08.peopleLost} pertes. L’affectation sur Thyr est ouverte : rejoignez « La route des vivants ». Le dossier d’Aval reste conservé tel qu’il a été signé.` : campaign.completed.MI07 ? `Sur la chaussée des Salines, ${campaign.completed.MI07.patientsArrived} patients sont arrivés et ${campaign.completed.MI07.patientsLost} sont morts. Le dossier sanitaire garde leur destination, l’équipe et la balise séparément. Les portes d’Aval sont maintenant accessibles dans « La marée compte les absents ». Retrouvez les survivants avant toute allocation de place.` : campaign.completed.MI06 ? `Aux Trois-Vannes, ${campaign.completed.MI06.residentsSafe} habitants sont à l’abri et ${campaign.completed.MI06.homesUninhabitable} logements sont inhabitables. La chaussée des Salines est maintenant accessible dans « Une ambulance sans escorte ». Le chantier détermine la rampe utilisable.` : `À Nacre, ${passage.refugeesPassed} passagers ont rejoint le quai. La digue des Trois-Vannes est maintenant accessible dans « Les maisons sous la ligne ». ${campaign.resources.fuel} lots de carburant restent disponibles ; une solution manuelle existe sans réserve.`
      : 'Votre nouvelle affectation est ouverte : rejoignez le chenal de Nacre dans « Le prix du passage ». Le départ reste possible avec ou sans le journal.'}`;
  }
  if (campaign.completed.MI09) {
    const r = campaign.completed.MI09;
    $('campaign-transition-text').textContent = `Le premier relevé de Thyr est classé : ${r.migratorsArrived} longues-dorses au verger, ${r.migratorsDisplaced} détournées et ${r.migratorsLost} perdues. ${r.homesHabitable} habitats restent habitables. ${r.harvestFragile ? 'Les récoltes sont fragilisées par ce passage.' : 'Les quatre migrateurs ont rejoint les cultures.'} La réserve chimique est maintenant accessible dans « Le champ que personne n’a semé ». Tess demande un relevé des cuves avant leur destruction.`;
  }
  if (campaign.completed.MI10) {
    const r = campaign.completed.MI10;
    $('campaign-transition-text').textContent = `Le bilan du champ est classé. ${r.pt02Acquired ? 'Tess conserve PT02 : le prélèvement et les traces matérielles relient ce produit aux terraformes d’Orison. Cette pièce ne reconstitue pas toute la chaîne de commandement.' : 'Les conditions matérielles de PT02 ne sont pas réunies. Les relevés conservés et les pertes restent dans le journal.'} ${r.villageHabitable ? 'Les canaux permettent au village de rester habitable.' : 'L’habitabilité du village est compromise.'} Les neuf rapports précédents sont conservés. La mission suivante, « Une voix au ras du sol », reste à produire.`;
  }
  $('campaign-mission-list').innerHTML = CAMPAIGN_MISSIONS.map((m, index) => {
    const done = Boolean(campaign.completed[m.id]), active = campaign.activeMissionId === m.id;
    const available = done || m.id === nextId;
    return `<button class="chapter-card ${m.id === selectedCampaignId ? 'active' : ''} ${done ? 'completed' : ''}" data-chapter="${m.id}" aria-pressed="${m.id === selectedCampaignId}" ${available && !campaignBlocked ? '' : 'disabled'}><span class="chapter-number">${done ? '✓' : m.number}</span><span><small>${escapeHTML(m.planet.toUpperCase())} · ${done ? 'RAPPORT CLASSÉ · RELECTURE' : active ? 'SORTIE EN COURS' : available ? 'ORDRE DISPONIBLE' : `APRÈS LE RAPPORT ${CAMPAIGN_MISSIONS[index - 1]?.number || '01'}`}</small><strong>${escapeHTML(m.name)}</strong></span><span aria-hidden="true">${available ? '↗' : '—'}</span></button>`;
  }).join('');
  all('[data-chapter]').forEach(el => el.addEventListener('click', () => { selectedCampaignId = el.dataset.chapter; renderCampaignUI(); }));
  const w = selectedWalker();
  $('campaign-assigned-walker').textContent = `${w.designation} ${w.name.toUpperCase()}`;
  $('campaign-debrief').hidden = !receipt;
  $('campaign-open-workshop').hidden = !receipt;
  if (receipt) {
    const facts = campaignReceiptFacts(receipt);
    $('campaign-debrief').innerHTML = `<div class="debrief-heading"><p class="eyebrow">${receipt.missionId} / RAPPORT CONSERVÉ</p><h3>${escapeHTML(receipt.missionName)}</h3></div><div class="debrief-facts">${facts.map(([name, value]) => `<span>${name}<strong>${escapeHTML(value)}</strong></span>`).join('')}</div><div class="crew-lines"><blockquote><span>TESS ARDAN</span>${escapeHTML(receipt.tessLine)}</blockquote><blockquote><span>SAMI PELL</span>${escapeHTML(receipt.samiLine)}</blockquote></div>`;
  }
  renderCampaignStatus();
}
function renderWorkshop() {
  const w = selectedWalker(), condition = campaign.fleet[w.id];
  const active = campaign.stage === 'mission';
  const cost = campaignRepairCost(campaign, w.id);
  const feet = condition.feet.map(n => Math.round(n));
  $('workshop-parts').textContent = `${campaign.resources.parts} LOTS D’ATELIER`;
  $('workshop-fuel').textContent = `${campaign.resources.fuel} LOT${campaign.resources.fuel > 1 ? 'S' : ''} DE CARBURANT EN RÉSERVE`;
  $('workshop-fuel').hidden = !campaign.completed.MI05;
  $('workshop-fuel-used').hidden = !campaign.world.nacre.fuelSpent;
  $('workshop-fuel-used').textContent = `${campaign.world.nacre.fuelSpent} LOTS DÉJÀ UTILISÉS AUX TROIS-VANNES`;
  $('workshop-condition').textContent = `${w.designation} ${w.name} — coque ${Math.round(condition.hull / w.hull * 100)} % · appuis ${feet.join(' / ')} % · radiateur ${Math.round(condition.radiator)} %`;
  $('workshop-repair-note').textContent = cost ? `Tess demande ${cost} lot${cost > 1 ? 's' : ''} pour remettre la coque, les articulations et le radiateur en état.` : '« Coque, appuis, refroidissement : tout tient. Deux kits de radiateur seront chargés au départ. » — Tess';
  $('campaign-repair').textContent = cost ? `Réparer · ${cost} lot${cost > 1 ? 's' : ''}` : 'Marcheur prêt';
  $('campaign-repair').disabled = active || !cost || cost > campaign.resources.parts || campaignBlocked;
  const world = campaign.world.vesper;
  $('workshop-pipe').textContent = !campaign.completed?.MI01 ? 'La conduite du couloir quarante-deux reste à inspecter sur place.' : world.pipeIntact ? 'La conduite a tenu. L’alimentation du quartier est préservée.' : world.pipeRepaired ? 'L’équipe a remplacé le raccord. L’alimentation du quartier est rétablie.' : 'La conduite a cédé. Le quartier attend une équipe pour retrouver son alimentation.';
  $('workshop-sami').textContent = campaign.lastDebrief?.samiLine || '« Je passe dans tes traces. Si tu t’arrêtes, préviens-moi avant. » — Sami';
  $('workshop-network').hidden = !campaign.completed.MI03;
  if (campaign.completed.MI03) {
    const network = campaign.completed.MI03;
    $('workshop-network').textContent = `Cales-Basses : ${network.civilRelaysOnline} relais civil${network.civilRelaysOnline === 1 ? '' : 's'} encore actif${network.civilRelaysOnline === 1 ? '' : 's'}. ${network.witnessAvailable ? 'Le canal du dispensaire est resté ouvert.' : 'Le contact du dispensaire est indisponible.'} ${network.residentsLost ? `${network.residentsLost} décès restent consignés au rapport.` : 'Les occupants ont survécu à votre passage.'}`;
  }
  $('workshop-industrial').hidden = !campaign.completed.MI04;
  if (campaign.completed.MI04) {
    const report = campaign.completed.MI04;
    $('workshop-industrial').textContent = `${report.technicalEvidence ? 'PT01 : copie du journal conservée. La chronologie du remplacement reste à expliquer.' : 'Le journal est perdu. Il faudra une autre source pour établir la chronologie.'} ${report.witnessContacted ? 'Le contact du dispensaire a été joint par radio pendant la sortie.' : 'Aucun témoignage du dispensaire n’a été recueilli pendant cette sortie.'}`;
  }
  $('workshop-nacre').hidden = !campaign.completed.MI05;
  if (campaign.completed.MI05) {
    const report = campaign.completed.MI05;
    $('workshop-nacre').textContent = `Nacre : ${report.refugeesPassed} passagers au quai, ${report.refugeesLost} perdus. ${report.smugglerVerified ? 'Vann Ostre a répondu depuis Rive-Courte ; ce contact est conservé.' : 'Aucun contact établi avec Rive-Courte.'} ${campaign.world.nacre.fuelSpent ? 'Les deux lots chargés ont été consommés au chantier, y compris si la sortie a dû recommencer.' : report.fuelRecovered ? 'Les deux lots chargés sont encore disponibles.' : 'Le dépôt n’a fourni aucun carburant à cette sortie.'}`;
  }
  $('workshop-dike').hidden = !campaign.completed.MI06;
  if (campaign.completed.MI06) {
    const report = campaign.completed.MI06;
    $('workshop-dike').textContent = `Trois-Vannes : ${report.residentsSafe} habitants à l’abri, ${report.residentsLost} perdus ; ${report.homesUninhabitable} logements inhabitables. ${report.techniciansAlive} techniciens vivants. ${report.circuit === 'diversion' ? 'La dérivation a été accomplie.' : 'Le circuit impérial du quai a été accompli.'} Cette dernière sortie a utilisé ${report.fuelSpent} lots de carburant.`;
  }
  $('workshop-ambulance').hidden = !campaign.completed.MI07;
  if (campaign.completed.MI07) {
    const report = campaign.completed.MI07;
    $('workshop-ambulance').textContent = `Salines : ${report.patientsArrived} patients arrivés, ${report.patientsLost} perdus ; ${report.staffAlive} membres de l’équipe vivants. ${report.destination === 'clinic' ? 'Accueil civil.' : 'Poste médical impérial.'} ${report.beaconRecovered ? 'Balise, attaches et journal conservés ; origine de la pose à recouper.' : 'Balise perdue ; aucune donnée recréée.'} ${report.witnessConsent ? 'Un accord à témoigner a été recueilli.' : 'Aucun accord à témoigner recueilli.'}`;
  }
  $('workshop-departure').hidden = !campaign.completed.MI08;
  if (campaign.completed.MI08) {
    const r = campaign.completed.MI08;
    $('workshop-departure').textContent = `Aval : ${r.peopleDeparted} départs, ${r.peopleArrived} arrivées au refuge, ${r.peopleLocal} personnes accueillies localement, ${r.peopleLost} pertes. ${r.registryCopied ? 'Registre de relogement copié.' : 'Registre perdu : absence conservée.'} Les personnes et les bateaux gardent leur résultat individuel dans le journal de vol.`;
  }
  $('campaign-repair-pipe').hidden = !campaign.completed?.MI01 || world.pipeIntact || world.pipeRepaired;
  $('workshop-thyr').hidden = !campaign.completed.MI09;
  if (campaign.completed.MI09) {
    const r = campaign.completed.MI09;
    $('workshop-thyr').textContent = `Thyr : ${r.migratorsArrived} longues-dorses au verger, ${r.migratorsDisplaced} détournées, ${r.migratorsLost} perdues ; ${r.homesHabitable} habitats habitables. ${r.localsHeard ? 'Les indications locales ont été écoutées.' : 'Aucun échange local accompli.'} Le journal conserve chaque animal, chaque support et l’arrivée du transport.`;
  }
  $('workshop-chemical').hidden = !campaign.completed.MI10;
  if (campaign.completed.MI10) {
    const r = campaign.completed.MI10;
    $('workshop-chemical').textContent = `Champ des basses terres : ${r.tanksSecured} cuves isolées, ${r.tanksDestroyed} détruites ; ${r.canalsPolluted} canaux contaminés. ${r.pt02Acquired ? 'PT02 est conservé à bord.' : 'PT02 n’a pas été constitué.'} ${r.villageHabitable ? 'Le village reste habitable.' : 'L’habitabilité du village est compromise.'} Les pièces d’atelier ne réparent pas les canaux de cette sortie.`;
  }
  $('campaign-repair-pipe').textContent = 'Réparer la conduite · 2 lots';
  $('campaign-repair-pipe').disabled = active || campaign.resources.parts < 2 || campaignBlocked;
  $('workshop-active-note').hidden = !active;
}

$('campaign-open-workshop').addEventListener('click', () => showView('hangar'));
$('campaign-deploy').addEventListener('click', () => {
  if (campaignBlocked) return;
  pendingMode = 'campaign'; pendingCampaignId = selectedCampaignId; pendingReplay = Boolean(campaign.completed[pendingCampaignId]); showBriefing();
});
$('campaign-resume').addEventListener('click', () => {
  const restored = restoreCampaignGame(campaign);
  if (!restored) { toast('Aucun point de reprise disponible pour cette mission.'); return; }
  activeMode = 'campaign'; campaignReplay = false; enterMission(restored);
});
$('campaign-repair').addEventListener('click', () => {
  const result = serviceCampaignWalker(campaign, settings.walkerId);
  if (result.ok) { campaign = result.campaign; saveCampaign(); }
  toast(result.message); renderHangarUI(); renderCampaignUI();
});
$('campaign-repair-pipe').addEventListener('click', () => {
  const result = repairCampaignPipe(campaign);
  if (result.ok) { campaign = result.campaign; saveCampaign(); }
  toast(result.message); renderHangarUI(); renderCampaignUI();
});
$('campaign-export').addEventListener('click', () => {
  if (campaignBlocked) return;
  captureCampaign();
  try {
    const blob = new Blob([serializeCampaign(campaign)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'Ordre_de_Cendre_Dossier.json'; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000); toast('Dossier exporté avec la progression et le point de reprise.');
  } catch (error) { toast(`Export impossible : ${error.message}`); }
});
$('campaign-import').addEventListener('click', () => { $('campaign-file').value = ''; $('campaign-file').click(); });
$('campaign-file').addEventListener('change', async () => {
  const file = $('campaign-file').files?.[0]; if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('Le fichier est trop volumineux.');
    pendingImport = parseCampaign(await file.text());
    if (inGame) returnToMenu();
    const reports = Object.keys(pendingImport.completed);
    $('campaign-import-summary').textContent = `${reports.length ? `Rapports conservés : ${reports.join(', ')}. ` : ''}${pendingImport.checkpoint ? `La mission ${pendingImport.activeMissionId} est en cours, avec son point de reprise.` : reports.length ? 'Les conséquences et l’état de l’atelier seront repris.' : 'Ce dossier est au hangar, avant le départ de MI01.'}`;
    closeDialogs(); $('campaign-import-dialog').showModal();
  } catch (error) { pendingImport = null; toast(`Dossier refusé : ${error.message}`); }
});
function replaceCampaign(next) {
  clearInput(); paused = true; inGame = false;
  $('menu').hidden = false; $('game-screen').hidden = true;
  campaign = next; campaignBlocked = false;
  selectedCampaignId = nextCampaignMissionId(campaign) || CAMPAIGN_MISSIONS.at(-1).id;
  if (activeMode === 'campaign') { game = null; $('resume').hidden = true; }
  saveCampaign({ replaceInvalid: true }); closeDialogs(); renderCampaignUI(); renderHangarUI(); showView('campaign');
}
$('campaign-confirm-import').addEventListener('click', () => { if (pendingImport) { replaceCampaign(pendingImport); pendingImport = null; toast('Dossier chargé.'); } });
$('campaign-new').addEventListener('click', () => { closeDialogs(); $('campaign-reset-dialog').showModal(); });
$('campaign-confirm-new').addEventListener('click', () => { replaceCampaign(createCampaign()); toast('Nouveau dossier ouvert. Tess vous attend au hangar.'); });
window.addEventListener('pagehide', () => captureCampaign());

function showView(next) {
  if (!['campaign', 'operations', 'hangar', 'archives', 'settings'].includes(next)) return;
  view = next;
  if (next !== 'settings' && bindingCapture) { bindingCapture = null; renderBindings(); $('binding-status').textContent = 'Modification annulée.'; }
  all('.view').forEach(el => el.hidden = el.id !== `view-${next}`);
  all('.nav-item').forEach(el => { const active = el.dataset.view === next; el.classList.toggle('active', active); if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
  $('menu').classList.toggle('interior', !['campaign', 'operations'].includes(next));
  if (next === 'campaign') renderCampaignUI();
  if (next === 'hangar') renderHangarUI();
  if (next === 'archives') renderArchive();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
all('[data-view]').forEach(el => el.addEventListener('click', () => showView(el.dataset.view)));
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); showView('campaign'); });

function renderMissionCards() {
  $('mission-cards').innerHTML = MISSIONS.map(m => `<button class="mission-card ${m.id === settings.missionId ? 'active' : ''}" data-mission="${m.id}" aria-pressed="${m.id === settings.missionId}"><span class="mission-number">${m.number}</span><span class="mission-meta"><span>${m.planet.toUpperCase()} / ${m.biome}</span>${records[m.id]?.completed ? '<span class="mission-check">✓</span>' : ''}</span><h3>${m.name}</h3><span class="mission-footer"><span>${m.difficulty}</span><span>${m.duration} ${m.id === settings.missionId ? '↗' : ''}</span></span></button>`).join('');
  all('[data-mission]').forEach(el => el.addEventListener('click', () => { settings.missionId = el.dataset.mission; saveSettings(); renderMissionCards(); audio.event('radio'); }));
  const w = selectedWalker(); $('assigned-walker').textContent = `${w.designation} ${w.name.toUpperCase()}`;
}
function renderHangarUI() {
  const w = selectedWalker();
  $('rig-class').textContent = `${w.legs} APPUIS / ${w.weight} TONNES`;
  $('rig-role').textContent = `${w.designation} / ${w.role}`;
  $('rig-name').textContent = w.name.toUpperCase();
  $('rig-description').textContent = w.description;
  $('rig-weapon').textContent = w.weapon; $('rig-secondary').textContent = w.secondary;
  $('rig-strength').textContent = `${w.strength}. Point de vigilance : ${w.weakness.toLowerCase()}. Départ avec ${w.ammo} tirs chargés, ${w.ammo * 8} en réserve et ${w.rockets} roquettes. Les dépôts ne servent qu’une fois.`;
  $('rig-stats').innerHTML = [['BLINDAGE', Math.round(w.armor * 250)], ['MOBILITÉ', Math.round(w.speed)], ['DISSIPATION', Math.round(w.cooling * 4)]].map(([label, value]) => `<div class="rig-stat"><span>${label}</span><div class="meter"><i style="width:${clamp(value, 0, 100)}%"></i></div><b>${value}</b></div>`).join('');
  $('walker-cards').innerHTML = WALKERS.map(rig => `<button class="walker-card ${w.id === rig.id ? 'active' : ''}" data-walker="${rig.id}" aria-pressed="${w.id === rig.id}"><span class="legs-icon">${rig.legs === 2 ? 'II' : rig.legs === 4 ? 'IV' : 'VI'}</span><span><strong>${rig.designation} ${rig.name}</strong><small>${rig.profile.toUpperCase()}</small></span></button>`).join('');
  all('[data-walker]').forEach(el => el.addEventListener('click', () => { settings.walkerId = el.dataset.walker; saveSettings(); renderHangarUI(); renderMissionCards(); renderCampaignUI(); audio.event('reload'); }));
  renderWorkshop();
}
$('confirm-rig').addEventListener('click', () => { showView('campaign'); toast(`${selectedWalker().name} assigné à votre prochain déploiement.`); });

const worlds = [
  ['01', 'Vesper', 'Poussière et acier', 'Des villes minières vivent sous les filtres d’Orison. Les relais transmettent autre chose que des slogans.'],
  ['02', 'Nacre', 'La mer sous blocus', 'Ports sur pilotis, digues et convois. Ici, le contrôle des marées décide qui mange et qui part.'],
  ['03', 'Thyr', 'La forêt qui écoute', 'Des racines traversent les stations impériales. Les Veilleurs Khelt suivent la maladie des bassins.'],
  ['04', 'Kharon', 'Les forges volcaniques', 'L’industrie avance entre les coulées. Une panne de refroidissement peut ensevelir des quartiers.'],
  ['05', 'Sereis', 'Les archives sous la glace', 'Les glaciers conservent les traces des premières évacuations. L’Empire en a changé les dates.'],
  ['06', 'Ilex', 'Les plaines de silice', 'Les habitats Khelt répondent aux vibrations. Marcher lourdement peut briser davantage que la pierre.'],
  ['07', 'Méridien', 'Le grenier des mondes', 'Des tours de stockage surplombent les champs. L’abondance existe ; sa répartition est une arme.'],
  ['08', 'Orthe', 'Le cœur de l’Empire', 'Derrière les parades et les façades intactes se trouvent les bureaux qui ont signé chaque ordre.'],
];
const factions = [
  ['01 / PUISSANCE IMPÉRIALE', 'Empire d’Orthe', 'Des mondes unis sous une autorité unique. Le corps expéditionnaire impose les décisions du centre et dépend de ses convois.'],
  ['03 / RÉSISTANCE LOCALE', 'Ligue des Rives', 'Un réseau de communes, de mécaniciens et de dissidents. Ses cellules ne s’accordent ni sur les moyens ni sur le futur.'],
  ['04 / PIRATERIE', 'Flotte des Brisants', 'Des équipages chassés des routes commerciales. Certains ouvrent les blocus ; d’autres ne voient que des cargaisons.'],
  ['02 / POUVOIR INDUSTRIEL', 'Consortium Orison', 'Le constructeur des filtres, des stations et de leurs contrats. Sa sécurité privée protège aussi des registres.'],
  ['05 / CIVILISATION KHELT', 'Accords Khelt', 'Des cités souveraines liées par des traités. Leurs Veilleurs cherchent des preuves et des garanties, pas un nouveau maître.'],
  ['06 / COOPÉRATIVES DE MÉRIDIEN', 'Gardiens du Sillon', 'Milices agricoles et mécaniciens tiennent les portes des canaux. Ils veulent nourrir les quartiers et craignent qu’une insurrection ne ferme les réserves.'],
  ['07 / ACCÈS RÉSERVÉ', 'Dossier non communiqué', 'La carte des forces transmise au pilote comporte une section réservée au commandement. Son contenu n’est pas établi à ce stade de votre affectation.'],
  ['08 / SECOURS CIVILS', 'Compagnies de secours libres', 'Ambulances, marcheurs-outils et observateurs évacuent les blessés. Leurs équipes refusent que leurs balises deviennent une couverture pour les opérations militaires.'],
  ['09 / COHORTE VÉTÉRANE', 'Cohorte des Serments', 'Des équipages expérimentés disposent de machines et de ravitaillement prioritaires. Leur fidélité au commandement se mesure aussi à la peur de perdre ceux qui dépendent d’eux.'],
];
all('[data-archive]').forEach(el => el.addEventListener('click', () => { archive = el.dataset.archive; renderArchive(); }));
function chemicalArchive() {
  const r = campaign.completed.MI10;
  if (!r) return '';
  const tanks = r.roster.tanks.map((t, i) => `<tr><th scope="row">Cuve ${i + 1}</th><td>${t.identified ? escapeHTML(chemicalTankRole(t.role)) : 'Composition non relevée'}</td><td>${t.destroyed ? 'Détruite' : t.secured ? 'Isolée' : 'Non isolée'} · ${t.identified ? 'marquage copié' : 'aucun marquage conservé'}</td></tr>`).join('');
  const canals = r.roster.canals.map((c, i) => `<tr><th scope="row">Canal ${i + 1}</th><td>${c.destroyed ? 'Ouvrage rompu' : c.covered ? 'Pontage préservé' : 'Canal sans couverture'}</td><td>${c.contamination.toFixed(1)} unités reçues · ${c.contamination >= 20 ? 'contaminé' : 'sous le seuil de contamination'}</td></tr>`).join('');
  return `<section class="nacre-dossiers chemical-dossiers" aria-label="Dossier du champ de Thyr"><p class="eyebrow">THYR / PRÉLÈVEMENT ET EAU DU VILLAGE</p><details class="dossier-detail"><summary>Le champ que personne n’a semé <span>${r.pt02Acquired ? 'PT02 conservé' : 'PT02 absent'} · ${r.canalsIntact} canaux intacts · ${r.homesHabitable} habitats préservés</span></summary><p>${r.sampleCollected ? 'Le prélèvement a été accompli et sa matière conservée à bord.' : 'Le prélèvement n’a pas pu être conservé ; le rapport ne le reconstitue pas.'} ${r.orisonRecordCopied ? 'Une copie du registre matériel relie les lots aux terraformes d’Orison.' : 'Aucune copie du registre matériel n’a été obtenue.'} ${r.pt02Acquired ? 'PT02 associe ce prélèvement aux trois marquages et au registre. La chaîne complète de fabrication, de financement et de commandement reste à établir.' : 'Les pièces réunies ne suffisent pas à constituer PT02.'}</p><div class="dossier-table-wrap"><table><caption>Relevés et états matériels à l’extraction</caption><thead><tr><th scope="col">Élément</th><th scope="col">Relevé</th><th scope="col">État conservé</th></tr></thead><tbody>${tanks}${canals}</tbody></table></div><p>${r.spillReleased.toFixed(1)} unités ont quitté les cuves : ${r.spillRetained.toFixed(1)} retenues au collecteur, ${r.spillDelivered.toFixed(1)} arrivées en aval. ${r.waterRestored ? 'La circulation de l’eau a été rétablie.' : 'L’alimentation n’a pas pu être rétablie.'} ${r.villageHabitable ? 'Les canaux préservés permettent au village de rester habitable.' : 'Les dommages ou la contamination compromettent l’habitabilité du village.'} Aucun effectif d’habitants n’est inventé par ce relevé.</p></details></section>`;
}

function thyrArchive() {
  const r = campaign.completed.MI09;
  if (!r) return '';
  const phase = { arrived: 'Verger atteint', displaced: 'Zone d’exclusion atteinte', lost: 'Perdu' };
  const animals = r.roster.migrators.map((a, i) => `<tr><th scope="row">Longue-dorse ${i + 1} · ${a.age === 'young' ? 'jeune' : 'adulte'}</th><td>${escapeHTML(phase[a.phase] || 'Trajet en cours')}</td><td>${a.destroyed ? 'Décès constaté' : `${Math.round(a.hp / a.maxHp * 100)} % d’intégrité`}</td></tr>`).join('');
  const homes = r.roster.homes.map((h, i) => `<tr><th scope="row">Habitat suspendu ${i + 1}</th><td>${h.habitable ? 'Habitable' : h.destroyed ? 'Détruit' : 'Support perdu'}</td><td>${h.supported ? 'Colonne et racine porteuses' : 'Continuité porteuse perdue'}</td></tr>`).join('');
  return `<section class="nacre-dossiers thyr-dossiers" aria-label="Relevé de Thyr"><p class="eyebrow">THYR / PREMIER RELEVÉ DE LA VALLÉE</p><details class="dossier-detail"><summary>La route des vivants <span>${r.migratorsArrived} au verger · ${r.migratorsLost} pertes · ${r.homesHabitable} habitats habitables</span></summary><p>${r.hamletsRecorded ? 'Deux habitats suspendus et la migration ont été relevés sur place, malgré leur omission sur la carte militaire.' : 'Le relevé reste incomplet.'} Les quatre animaux sont ceux rencontrés dans cette vallée. Aucun habitant de Nacre n’est attribué à ces maisons.</p><div class="dossier-table-wrap"><table><caption>Destinations et supports matériellement constatés</caption><thead><tr><th scope="col">Élément</th><th scope="col">État au départ</th><th scope="col">Constat</th></tr></thead><tbody>${animals}${homes}</tbody></table></div><p>${r.harvestFragile ? 'Le passage a fragilisé les récoltes.' : 'Les quatre migrateurs ont atteint les vergers.'} ${r.logisticsArrived ? 'Le transport logistique a atteint son point d’arrivée.' : 'Son arrivée n’est pas constatée.'} ${r.localsHeard ? 'Les habitants ont été écoutés par la liaison locale.' : 'Aucune aide locale n’a été obtenue.'}</p></details></section>`;
}

function nacreArchive() {
  const medical = campaign.completed.MI07, departure = campaign.completed.MI08;
  if (!medical && !departure) return '';
  const row = (label,value) => `<tr><th scope="row">${escapeHTML(label)}</th><td>${escapeHTML(value)}</td></tr>`;
  let html = '<section class="nacre-dossiers" aria-label="Pièces et destinations de Nacre"><p class="eyebrow">NACRE / PIÈCES CONSERVÉES</p>';
  if (medical) {
    const checks = [
      ['Accord à l’examen',medical.consentObtained ? 'Recueilli auprès de l’équipe' : 'Non recueilli'],
      ['Caisse du véhicule',medical.medicalCargoVerified ? 'Cargaison sanitaire examinée et vérifiée' : 'Aucune cargaison vérifiable'],
      ['Balise et attaches',medical.fixingsPreserved ? 'Récupérées et conservées' : 'Non récupérées'],
      ['Journal de la balise',medical.beaconLogCopied ? 'Copie conservée' : 'Aucune copie'],
      ['Origine de la pose','À recouper : le matériel seul n’identifie pas le donneur d’ordre'],
      ['Accord à témoigner',medical.witnessConsent ? medical.witnessAvailable ? 'Recueilli ; témoin vivant au bilan des Salines' : 'Recueilli ; témoin décédé avant le bilan' : 'Aucun accord recueilli'],
      ['Transmission à Mara',medical.maraContacted ? 'Relevé effectivement transmis par radio' : 'Aucune transmission'],
    ];
    html += `<details class="dossier-detail"><summary>Dossier sanitaire des Salines <span>${medical.beaconRecovered ? 'Pièces récupérées' : 'Pièces manquantes'}</span></summary><p>Le constat sanitaire, les pièces matérielles et l’accord à témoigner sont conservés séparément.</p><div class="dossier-table-wrap"><table><caption>Pièces du premier rapport des Salines</caption><tbody>${checks.map(([a,b])=>row(a,b)).join('')}</tbody></table></div></details>`;
  }
  if (departure) {
    const roles = {refugee:'Passager du chenal',resident:'Habitant des Trois-Vannes',patient:'Patient des Salines',staff:'Soignant des Salines',crew:'Équipier de Rive-Courte',technician:'Technicien de la digue',mara:'Mara Eren',harbourmaster:'Responsable du quai'};
    const phase = {arrived:'Arrivé au refuge',local:'Accueil local atteint',lost:'Décédé à Aval',offsite:'N’a pas rejoint le quai'};
    const counters = {};
    const people = departure.roster.people.map(person => {
      counters[person.role]=(counters[person.role]||0)+1;
      const label=roles[person.role]+(['mara','harbourmaster'].includes(person.role)?'':` ${counters[person.role]}`);
      const boat=departure.roster.boats.find(b=>b.id===person.boatId);
      return `<tr><th scope="row">${escapeHTML(label)}</th><td>${escapeHTML(phase[person.phase]||'Bilan en cours')}</td><td>${person.departed ? `Départ acquis · ${escapeHTML(boat?.name||'bateau')}` : 'Aucun départ acquis'}</td><td>${person.consent ? 'Accord recueilli' : 'Aucun accord de départ'}</td></tr>`;
    }).join('');
    html += `<details class="dossier-detail"><summary>Registre des personnes d’Aval <span>${departure.peopleArrived} au refuge · ${departure.peopleLocal} à Aval · ${departure.peopleLost} pertes</span></summary><p>Les numéros distinguent les personnes recensées à Aval. Les rapports antérieurs restent conservés tels qu’ils ont été signés.</p><div class="dossier-table-wrap"><table><caption>Destinations et départs individuellement constatés</caption><thead><tr><th scope="col">Personne</th><th scope="col">Dernier état</th><th scope="col">Trajet</th><th scope="col">Accord</th></tr></thead><tbody>${people}</tbody></table></div><p class="muted">${departure.registryCopied ? 'Les pages de relogement ont été copiées : lieu d’origine, accueil annoncé et obligation de travail peuvent être confrontés.' : 'Le support de relogement est perdu. Un nom absent ne permet pas de conclure à un décès.'}</p></details>`;
  }
  return html + '</section>';
}

function renderArchive() {
  all('[data-archive]').forEach(el => { const active = archive === el.dataset.archive; el.classList.toggle('active', active); el.setAttribute('aria-selected', String(active)); });
  if (archive === 'doctrine') {
    $('archive-content').innerHTML = `<div class="doctrine-layout"><div><blockquote>« Une frontière n’est pacifiée que lorsque nos convois peuvent la traverser. »</blockquote><p>Vous êtes la lieutenante <strong>Sera Vey</strong>, pilote de marcheur au service de l’Empire d’Orthe. On vous a appris à voir une carte, un objectif et un ordre. Depuis le cockpit, les fenêtres des maisons paraissent minuscules.</p><p>Sur Vesper, votre première affectation consiste à escorter des filtres jusqu’au poste des mineurs. <strong>Tess Ardan</strong> veille sur vos appuis. <strong>Sami Pell</strong> conduit le camion. Le Major Holt attend un couloir dégagé et une livraison signée. Depuis le siège du pilote, il vous faudra aussi regarder ce qui se trouve entre les bornes de l’ordre.</p></div><div><p class="eyebrow">EXTRAIT DU MANUEL DE PILOTAGE</p><p>Préservez vos appuis. Ancrez le châssis avant un tir prolongé. Un canon surchauffé ne vaut plus rien ; une articulation détruite vous condamne à rester là.</p><p>Identifiez ce qui se trouve sous vos pieds. Les repères civils sont cyan. Une silhouette petite n’est pas une cible.</p><div class="dossier-stamp">DOSSIER PERSONNEL : SERA VEY<br>AFFECTATION : VIIe CORPS EXPÉDITIONNAIRE<br>ACCÈS : FRONTIÈRE EXTÉRIEURE</div></div></div>`;
  } else if (archive === 'worlds') {
    $('archive-content').innerHTML = `<div class="lore-grid">${worlds.map(([id, name, biome, text]) => `<article class="lore-card"><p class="eyebrow">PL${id} / ${biome.toUpperCase()}</p><h3>${name}</h3><p>${text}</p></article>`).join('')}</div><p class="muted" style="margin-top:20px">Trois théâtres sont accessibles dans ce prototype : Vesper, Nacre et Thyr. Les autres mondes appartiennent à la campagne en conception.</p>`;
  } else if (archive === 'factions') {
    $('archive-content').innerHTML = `<div class="lore-grid">${[...factions].sort((a, b) => a[0].localeCompare(b[0])).map(([id, name, text]) => `<article class="lore-card"><p class="eyebrow">${id}</p><h3>${name}</h3><p>${text}</p></article>`).join('')}</div><p class="muted" style="margin-top:20px">Ces notices situent les forces de la campagne. Leurs doctrines, unités et relations complètes restent à déployer dans les missions suivantes.</p>`;
  } else {
    const finished = MISSIONS.filter(m => records[m.id]?.completed);
    const official = Object.values(campaign.completed).map(r => {
      const facts = campaignReceiptFacts(r).map(([label, value]) => `${escapeHTML(label)} : ${escapeHTML(value)}`).join('<br>');
      return `<article class="record-card"><div><p class="eyebrow">CAMPAGNE / ${r.missionId} / PREMIÈRE RÉUSSITE</p><h3>${escapeHTML(r.missionName)}</h3><p>${escapeHTML(r.walkerName)} · ${timeLabel(r.elapsed)}</p></div><div><p>${facts}<br>${escapeHTML(r.decisionLabel)}</p></div></article>`;
    }).join('');
    const simulations = finished.length ? finished.map(m => { const r = records[m.id]; return `<article class="record-card"><div><p class="eyebrow">SIMULATION / ${m.planet.toUpperCase()} / OPÉRATION ${m.number}</p><h3>${m.name}</h3><p>${escapeHTML(r.walker || 'Marcheur')} · ${timeLabel(Number(r.time) || 0)}</p></div><div><p>Preuves récupérées : ${Number(r.evidence) || 0}<br>Pertes civiles : ${Number(r.collateral) || 0}<br>Décision : ${r.choice === 'defy' ? 'Ordre contesté' : 'Ordre exécuté'}</p></div></article>`; }).join('') : '<p class="muted">Aucun rapport de simulation. Les exercices sont indépendants du dossier de campagne.</p>';
    $('archive-content').innerHTML = chemicalArchive() + thyrArchive() + nacreArchive() + official + (!official && !finished.length ? '<p class="eyebrow">AUCUN RAPPORT CLASSÉ</p><h3>Votre première marche vous attend.</h3>' : '') + simulations;
  }
}

function renderBindings() {
  $('binding-list').innerHTML = CONTROL_ACTIONS.map(a => `<div class="binding-row"><span>${escapeHTML(a.label)}</span><button type="button" class="binding-button" data-binding="${a.id}" aria-pressed="${bindingCapture === a.id}" aria-label="Modifier la touche : ${escapeHTML(a.label)}. ${escapeHTML(keyLabel(a.id))}">${bindingCapture === a.id ? 'APPUYEZ SUR UNE TOUCHE…' : escapeHTML(keyLabel(a.id))}</button></div>`).join('');
  all('[data-binding]').forEach(el => el.addEventListener('click', () => {
    bindingCapture = el.dataset.binding; clearInput();
    $('binding-status').textContent = `${CONTROL_ACTIONS.find(a => a.id === bindingCapture).label} : appuyez sur une touche. Échap annule.`;
    renderBindings(); document.querySelector(`[data-binding="${bindingCapture}"]`)?.focus();
  }));
  $('manual-help').textContent = `En marche manuelle, maintenez une direction puis alternez ${keyLabel('stepA')} et ${keyLabel('stepB')}. Les quadrupèdes déplacent leurs diagonales ; les hexapodes leurs tripodes.`;
  $('assist-description').textContent = `Maintenir une direction alterne les appuis. Désactivée : utilisez ${keyLabel('stepA')} et ${keyLabel('stepB')} pour chaque groupe.`;
  $('keyboard-hints').innerHTML = [['left','MARCHE ←'],['right','MARCHE →'],['brace','ANCRAGE'],['vent','PURGE'],['repair','RADIATEUR'],['interact','INTERACTION']].map(([id,label]) => `<span><kbd>${escapeHTML(keyLabel(id))}</kbd> ${label}</span>`).join('') + '<span id="assist-hint"></span>';
  $('briefing-controls').innerHTML = `<kbd>${escapeHTML(keyLabel('left'))} / ${escapeHTML(keyLabel('right'))}</kbd> Marcher <kbd>Souris</kbd> Viser / tirer <kbd>${escapeHTML(keyLabel('interact'))}</kbd> Interagir`;
  $('pause-controls').textContent = `${keyLabel('brace')} : ancrage · ${keyLabel('vent')} : purge · ${keyLabel('reload')} : recharger · ${keyLabel('interact')} : interagir`;
  $('game-canvas').setAttribute('aria-label', `Champ de bataille. ${keyLabel('left')} et ${keyLabel('right')} pour marcher, souris pour viser, clic pour tirer. ${keyLabel('repair')} pour réparer le radiateur à l’arrêt. ${keyLabel('pause')} pour la pause.`);
}
function refreshGamepad() {
  if (!hasPageFocus()) { suspendForFocus(); return; }
  let devices = [];
  try { devices = navigator.getGamepads?.() || []; } catch { /* Browser permissions may hide devices. */ }
  padState = gamepad.sample(devices);
  const status = { disconnected: 'Aucune manette standard détectée.', unsupported: 'Manette détectée sans disposition standard : utilisez le clavier ou la souris.', release: 'Relâchez les commandes de la manette pour reprendre.', ready: 'Manette standard prête en mission.' }[padState.status];
  if ($('gamepad-status').textContent !== status) $('gamepad-status').textContent = status;
  if (padState.input.pausePressed && inGame && game?.status === 'playing' && !game.decision.active) {
    if ($('pause-dialog').open) resumeMission(); else if (!paused) pauseMission();
  }
}
$('bindings-reset').addEventListener('click', () => { bindingCapture = null; settings.bindings = defaultBindings(); saveSettings(); renderBindings(); $('binding-status').textContent = 'Touches par défaut rétablies.'; });

function applySettings() {
  $('difficulty').value = settings.difficulty;
  for (const key of ['assist', 'shake', 'motion', 'contrast']) $(key).checked = settings[key];
  $('volume').value = settings.volume;
  document.body.classList.toggle('reduced-motion', settings.motion);
  document.body.classList.toggle('high-contrast', settings.contrast);
  document.body.classList.toggle('manual-gait', !settings.assist);
  audio.setVolume(settings.volume / 100);
  renderBindings();
  if (game?.status === 'playing') commandGame(game, 'assist', settings.assist);
}
for (const key of ['difficulty', 'assist', 'shake', 'motion', 'contrast', 'volume']) $(key).addEventListener('input', () => { settings[key] = key === 'difficulty' ? $(key).value : key === 'volume' ? Number($(key).value) : $(key).checked; applySettings(); saveSettings(); });

function showBriefing() {
  const m = pendingMode === 'campaign' ? CAMPAIGN_MISSIONS.find(m => m.id === pendingCampaignId) : selectedMission(), w = selectedWalker();
  $('briefing-planet').textContent = `${pendingMode === 'campaign' ? 'MISSION' : 'SIMULATION'} ${m.number} / ${m.planet.toUpperCase()} / ${m.biome}`;
  $('briefing-title').textContent = m.name; $('briefing-quote').textContent = m.briefing;
  $('briefing-description').textContent = m.description; $('briefing-tip').textContent = pendingMode === 'campaign' && pendingReplay ? `${controlsText(m.hint)} Relecture : votre dossier, vos ressources et vos choix conservés restent ceux de la première réussite.` : pendingMode === 'campaign' && campaign.checkpoint ? `${controlsText(m.hint)} Ce départ recommence la mission. Fermez ce briefing et choisissez « Reprendre » pour utiliser la dernière liaison.` : controlsText(m.hint);
  if (pendingMode === 'campaign' && m.id === 'MI02') {
    const vesper = campaign.world.vesper;
    $('briefing-description').textContent += ` ${vesper.servicesInterrupted ? 'Tess a laissé une équipe auprès des maisons privées d’alimentation. La conduite attend toujours ses raccords.' : vesper.pipeRepaired ? 'L’équipe de Tess a remis la conduite en service avant votre départ.' : 'La conduite du couloir quarante-deux est restée intacte.'} ${vesper.noticeFiled ? 'Sami a fait parvenir une copie de votre signalement aux Cales-Basses ; les filtres supplémentaires restent attendus.' : 'Les Cales-Basses attendent toujours une réponse. Sami veut vérifier lui-même le chargement de ce train.'}`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI03') {
    const rail = campaign.completed.MI02;
    if (rail) $('briefing-description').textContent += ` ${rail.hostagesRescued ? `Sami a accompagné ${rail.hostagesRescued} survivant${rail.hostagesRescued > 1 ? 's' : ''} du train au poste de soins.` : 'Sami a transmis le bilan du train : aucun ouvrier n’a pu être ramené vivant.'} ${rail.recordFiled ? 'Votre signalement est au dossier de Holt ; Tess vous demande de consigner les faits avec la même précision.' : 'Le compte rendu ferroviaire est resté scellé. Tess veut comprendre à qui servent ces émetteurs.'}`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI04') {
    const vesper = campaign.world.vesper, rail = vesper.rail, network = vesper.communications;
    $('briefing-description').textContent += ` ${vesper.servicesInterrupted ? 'La conduite est hors service : relancez la pompe mobile sur place.' : vesper.pipeRepaired ? 'La conduite réparée alimente de nouveau le circuit de refroidissement.' : 'La conduite préservée alimente déjà le circuit de refroidissement.'} ${rail.hostagesRescued > 0 ? 'Les ouvriers libérés du train guideront vos manœuvres : quatre secondes par vanne.' : 'Sans renfort du train, comptez sept secondes par vanne.'} ${network.witnessAvailable ? 'Le canal du dispensaire est ouvert. Utilisez le terminal de liaison si vous souhaitez parler au contact.' : 'Le canal du dispensaire ne permet aucun contact. Le journal du poste reste à inspecter.'}`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI05') {
    const vesper = campaign.world.vesper;
    $('briefing-description').textContent += ` ${vesper.industrial.technicalEvidence ? 'Tess a rangé la copie du journal de Vesper. Le travail sur le chenal ne permet pas encore d’en expliquer les références militaires.' : 'Le journal de Vesper manque au dossier. Holt maintient pourtant votre nouvelle affectation : rouvrir le chenal.'} ${vesper.rail.hostagesRescued ? 'Sami se souvient du wagon et de ses survivants. Il veut regarder ce que transportent ces barges.' : 'Sami n’a pas oublié les ouvriers morts dans le train. Il demande de vérifier les personnes à bord avant le premier tir.'}`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI06') {
    const passage = campaign.world.nacre.passage;
    const fuel = pendingReplay && campaign.completed.MI06 ? campaign.resources.fuel + campaign.completed.MI06.fuelSpent : campaign.resources.fuel;
    $('briefing-description').textContent += ` ${passage.channelOpen && passage.refugeesPassed === 12 ? 'Le passage accompli permet aux techniciens d’arriver par le quai.' : 'Le passage du chenal n’a pas été sûr : les techniciens prennent la passerelle haute.'} ${fuel === 2 ? 'Deux lots peuvent alimenter une pompe auxiliaire après branchement. Ils seront réellement dépensés à l’achèvement, même si la sortie échoue ensuite.' : 'Aucun lot n’est disponible. La dérivation manuelle reste praticable.'} Les dix habitants de ce chantier ne sont pas les douze passagers du chenal.`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI07') {
    const dike = campaign.world.nacre.dike;
    const mainRamp = dike.panelsLocked === 1 && !dike.emergencyShoring && dike.dikeFatigue < 65;
    $('briefing-description').textContent += ` ${mainRamp ? 'Le panneau verrouillé, sous le seuil de fatigue de 65 %, permet la rampe principale.' : 'L’état du panneau impose la rampe secondaire : le trajet sera plus long à protéger.'} ${dike.techniciansAlive ? `${dike.techniciansAlive} technicien${dike.techniciansAlive > 1 ? 's ont survécu' : ' a survécu'} à la digue ; demandez leur aide sur place.` : 'Aucun technicien de la digue ne peut aider ; la préparation manuelle reste possible.'} L’ambulance transporte quatre patients et deux membres d’équipe, distincts des personnes des missions précédentes. Aucun carburant supplémentaire n’est attribué.`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI08') {
    const n = campaign.world.nacre;
    $('briefing-description').textContent += ` Les rapports précédents conservent ${n.passage.refugeesPassed} passagers du chenal, ${n.dike.residentsSafe} habitants mis à l’abri et ${n.ambulance.patientsArrived} patients arrivés à l’accueil sanitaire. Il faut les retrouver et leur proposer les places disponibles. ${n.passage.smugglerVerified ? 'Vann a déjà été contacté : une nouvelle demande de service reste nécessaire.' : 'Aucun accord antérieur ne permet de compter sur Rive-Courte.'} ${n.ambulance.vehicleSeized ? 'L’ambulance reste saisie au poste impérial.' : 'Le véhicule sanitaire ne fait pas partie de la flotte du quai.'}`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI09') {
    const r = campaign.completed.MI08;
    $('briefing-description').textContent += ` ${r ? `Le rapport d’Aval conserve ${r.peopleArrived} arrivées au refuge et ${r.peopleLost} pertes ; Sami peut en parler par radio.` : 'Le bilan d’Aval est conservé dans votre dossier.'} Cette vallée a ses propres habitants et sa propre faune. Écoutez le poste local pour baliser une approche guidée, ou effectuez vous-même un relevé plus long. Les châssis hauts doivent reconnaître le passage avant de franchir la canopée.`;
  }
  if (pendingMode === 'campaign' && m.id === 'MI10') {
    const r = campaign.completed.MI09;
    $('briefing-description').textContent += ` ${r?.approach === 'guided' ? 'Les indications recueillies sur la route des vivants permettent de reconnaître plus vite le collecteur amont.' : 'Le collecteur amont peut être identifié et fermé sans aide locale préalable.'} Le prélèvement exige vingt secondes de protection à proximité. Relever les marquages et copier le registre restent des opérations distinctes. Les habitats de ce site ont leur propre alimentation en eau ; le bilan de la vallée précédente reste conservé.`;
  }
  $('briefing-walker').textContent = `${w.designation} ${w.name}`;
  $('briefing-assist').textContent = settings.assist ? 'Marche assistée' : 'Appuis manuels';
  $('briefing-difficulty').textContent = DIFFICULTIES[settings.difficulty].label;
  closeDialogs(); $('briefing-dialog').showModal(); audio.unlock();
}
$('deploy').addEventListener('click', () => { pendingMode = 'operations'; pendingReplay = false; showBriefing(); });
all('[data-close]').forEach(el => el.addEventListener('click', () => $(el.dataset.close).close()));

function startMission() {
  captureCampaign();
  if (pendingMode === 'campaign') {
    if (campaignBlocked) return;
    const started = beginCampaignMission(campaign, { missionId: pendingCampaignId, walkerId: settings.walkerId, difficulty: settings.difficulty, assist: settings.assist, restart: true, replay: pendingReplay });
    if (!started.ok) { toast(started.message); return; }
    campaign = started.campaign; campaignReplay = started.replay; activeMode = 'campaign';
    if (!campaignReplay) saveCampaign();
    enterMission(started.game);
  } else {
    activeMode = 'operations'; campaignReplay = false;
    enterMission(createGame({ walkerId: settings.walkerId, missionId: settings.missionId, difficulty: settings.difficulty, assist: settings.assist }));
  }
}
function enterMission(nextGame) {
  closeDialogs(); clearInput();
  game = nextGame;
  settings.walkerId = game.walkerId; settings.assist = game.assist; settings.difficulty = game.difficultyId;
  applySettings(); saveSettings();
  inGame = true; paused = false; lastEventId = game.elapsed > 0 ? game.eventId : 0; resultRecorded = false; hudTick = 0;
  lastObjectives = ''; radioUntil = 0; radioQueue = game.elapsed > 0 ? [{ type: 'radio', text: `Liaison rétablie. ${game.checkpointText}` }] : []; decisionCheckpointTaken = false; lastCampaignSaveAt = game.elapsed;
  $('menu').hidden = true; $('game-screen').hidden = false; $('resume').hidden = false;
  pointer.visible = false; pointer.x = game.player.x + 650; pointer.y = game.player.y + 70;
  $('hud-planet').textContent = `${game.mission.planet.toUpperCase()} / ${activeMode === 'campaign' ? campaignReplay ? 'RELECTURE' : 'MISSION' : 'SIMULATION'} ${game.mission.number}`;
  $('hud-title').textContent = game.mission.name; $('hud-walker').textContent = `${game.walker.designation} ${game.walker.name.toUpperCase()} / ${game.walker.legs} APPUIS`;
  $('hud-weapon').textContent = game.walker.weapon.toUpperCase();
  $('intro-location').textContent = game.mission.intro; $('intro-title').textContent = game.mission.name;
  $('restart').textContent = activeMode === 'campaign' ? 'Recommencer la mission' : 'Recommencer l’opération';
  aimMode = 'pointer'; padAim.x = 1; padAim.y = 0;
  audio.setScene({ planetId: game.mission.planetId, missionId: game.missionId, mood: ['MI06', 'MI07', 'MI08', 'MI09', 'MI10'].includes(game.missionId) ? 'crew' : game.missionId === 'op03' ? 'fracture' : 'imperial' });
  audio.setPaused(false); audio.update(game);
  $('game-canvas').focus({ preventScroll: true }); audio.unlock(); updateHUD();
}
$('launch').addEventListener('click', startMission);
function pauseMission() {
  if (!inGame || !game || game.status !== 'playing' || game.decision.active || paused) return;
  paused = true; audio.setPaused(true); clearInput(); captureCampaign(); $('pause-dialog').showModal();
}
function resumeMission() {
  if (!game || game.status !== 'playing' || !hasPageFocus()) return;
  closeDialogs(); inGame = true; paused = false; audio.setPaused(false); clearInput();
  $('menu').hidden = true; $('game-screen').hidden = false; $('game-canvas').focus({ preventScroll: true }); audio.unlock();
  if (game.decision.active) showDecision();
}
function returnToMenu() {
  captureCampaign();
  closeDialogs(); clearInput(); paused = true; inGame = false; audio.setPaused(true);
  $('menu').hidden = false; $('game-screen').hidden = true;
  $('resume').hidden = activeMode !== 'operations' || !game || game.status !== 'playing'; renderMissionCards(); renderCampaignUI(); showView(activeMode === 'campaign' ? 'campaign' : 'operations');
}
$('pause-button').addEventListener('click', pauseMission); $('unpause').addEventListener('click', resumeMission);
$('resume').addEventListener('click', resumeMission); $('restart').addEventListener('click', () => { settings.walkerId = game.walkerId; if (activeMode === 'operations') settings.missionId = game.missionId; else pendingCampaignId = game.missionId; pendingMode = activeMode; pendingReplay = campaignReplay; startMission(); });
$('to-menu').addEventListener('click', returnToMenu); $('result-menu').addEventListener('click', returnToMenu);
$('replay').addEventListener('click', () => { settings.walkerId = game.walkerId; if (activeMode === 'operations') settings.missionId = game.missionId; else pendingCampaignId = game.missionId; pendingMode = activeMode; pendingReplay = activeMode === 'campaign' && Boolean(campaign.completed[game.missionId]); startMission(); });
$('next-operation').addEventListener('click', () => { if (activeMode === 'campaign') { returnToMenu(); showView('hangar'); return; } const index = MISSIONS.findIndex(m => m.id === game.missionId); settings.missionId = MISSIONS[(index + 1) % MISSIONS.length].id; saveSettings(); pendingMode = 'operations'; returnToMenu(); showBriefing(); });
$('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); resumeMission(); });
$('decision-dialog').addEventListener('cancel', event => event.preventDefault());
$('result-dialog').addEventListener('cancel', event => { event.preventDefault(); returnToMenu(); });

function showDecision() {
  if ($('decision-dialog').open || !game?.decision.active) return;
  if (!decisionCheckpointTaken) { captureCampaign(true); decisionCheckpointTaken = true; }
  clearInput(); audio.setPaused(true);
  $('decision-title').textContent = game.decision.title; $('decision-body').textContent = game.decision.body;
  $('decision-options').innerHTML = game.decision.options.map((o, i) => `<button class="decision-choice" data-choice="${o.id}"><span>0${i + 1}</span><strong>${escapeHTML(o.label)}</strong></button>`).join('');
  all('[data-choice]').forEach(el => el.addEventListener('click', () => { commandGame(game, 'choice', el.dataset.choice); captureCampaign(); $('decision-dialog').close(); audio.setPaused(false); clearInput(); $('game-canvas').focus(); updateHUD(); }));
  $('decision-dialog').showModal();
}
function showResult() {
  if (resultRecorded) return;
  resultRecorded = true; clearInput(); const won = game.status === 'won';
  audio.setScene({ mood: 'none' }); audio.setPaused(false); audio.event(won ? 'victory' : 'defeat', game);
  $('result-eyebrow').textContent = `${game.mission.planet.toUpperCase()} / RAPPORT DE MISSION`;
  $('result-title').textContent = won ? 'La marche laisse une trace.' : 'Liaison perdue.';
  $('result-outcome').textContent = game.outcome;
  const campaignMission = activeMode === 'campaign';
  const railMission = game.missionId === 'MI02';
  const networkMission = game.missionId === 'MI03';
  const industrialMission = game.missionId === 'MI04';
  const channelMission = game.missionId === 'MI05';
  const dikeMission = game.missionId === 'MI06';
  const ambulanceMission = game.missionId === 'MI07';
  const departureMission = game.missionId === 'MI08';
  const livingRouteMission = game.missionId === 'MI09';
  const chemicalMission = game.missionId === 'MI10';
  const missionStat = chemicalMission ? ['PIÈCE TECHNIQUE PT02', game.campaign.pt02Acquired ? 'CONSERVÉE' : 'ABSENTE'] : livingRouteMission ? ['LONGUES-DORSES AU VERGER', `${game.campaign.migratorsArrived} / 4`] : departureMission ? ['ARRIVÉES AU REFUGE', `${game.campaign.peopleArrived} / ${game.campaign.peopleTotal}`] : ambulanceMission ? ['PATIENTS ARRIVÉS', `${game.campaign.patientsArrived} / ${game.campaign.patientsTotal}`] : dikeMission ? ['HABITANTS À L’ABRI', `${game.campaign.residentsSafe} / ${game.campaign.residentsTotal}`] : channelMission ? ['PASSAGERS AU QUAI', `${game.campaign.refugeesPassed} / ${game.campaign.refugeesTotal}`]
    : industrialMission ? ['JOURNAL PT01', game.campaign.technicalEvidence ? 'COPIE CONSERVÉE' : 'NON RÉCUPÉRÉ']
    : networkMission ? ['RÉSEAUX CIVILS ACTIFS', `${game.campaign.civilRelaysOnline} / 2`]
    : railMission ? ['OUVRIERS LIBÉRÉS', `${game.campaign.hostagesRescued} / ${game.campaign.hostagesTotal}`]
    : campaignMission ? ['FILTRES LIVRÉS', game.campaign.filtersDeliveredCount]
    : ['PREUVES RÉCUPÉRÉES', game.stats.evidence];
  const stats = [['DURÉE', timeLabel(game.elapsed)], ['CIBLES NEUTRALISÉES', game.stats.kills], missionStat, ['PERTES CIVILES', game.stats.collateral]];
  let decisionText;
  if (chemicalMission) {
    const f = game.campaign;
    stats.push(['CUVES', `${f.tanksSecured} isolées · ${f.tanksDestroyed} détruites`], ['MARQUAGES COPIÉS', `${f.copiedMarks} / 3`], ['CANAUX', `${f.canalsIntact} intacts · ${f.canalsPolluted} contaminés`], ['VILLAGE', f.villageHabitable ? 'HABITABLE' : 'HABITABILITÉ COMPROMISE']);
    decisionText = `${f.plan === 'demolish' ? 'Démolition choisie.' : f.plan === 'secure' ? 'Mise en sécurité choisie.' : 'Aucune conduite choisie.'} ${f.operationsResolved ? 'Opérations des cuves accomplies ou pertes constatées.' : 'Opérations des cuves inachevées.'} ${f.sampleCollected ? 'Prélèvement conservé à bord.' : f.sampleLost ? 'Prélèvement perdu.' : 'Prélèvement non terminé.'} ${f.orisonRecordCopied ? 'Registre matériel copié.' : 'Registre non copié.'} ${f.pt02Acquired ? 'PT02 est conservé ; la chaîne complète de commandement reste à établir.' : 'PT02 n’est pas constitué.'} ${f.reportTransmitted ? 'Bilan transmis.' : 'Rapport non transmis.'}`;
  } else if (livingRouteMission) {
    const f = game.campaign;
    stats.push(['DÉTOURNÉES', f.migratorsDisplaced], ['LONGUES-DORSES PERDUES', f.migratorsLost], ['HABITATS HABITABLES', `${f.homesHabitable} / 2`], ['ÉVENTAILS REVENUS', `${f.pollinatorsPresent} / 2`]);
    decisionText = `${f.route === 'migration' ? 'Passage migratoire choisi.' : f.route === 'imperial' ? 'Déviation impériale choisie.' : 'Aucune route choisie.'} ${f.gateOperated ? 'Manœuvre de barrière accomplie.' : 'Barrière non manœuvrée.'} ${f.migrationResolved ? `${f.migratorsArrived} au verger, ${f.migratorsDisplaced} détournées et ${f.migratorsLost} perdues.` : 'Trajet du troupeau non résolu.'} ${f.harvestFragile ? 'Récoltes fragilisées.' : f.migrationResolved ? 'Les quatre migrateurs ont rejoint les cultures.' : ''} ${f.logisticsArrived ? 'Logistique arrivée.' : f.logisticsDestroyed ? 'Transport logistique perdu.' : 'Transport encore à accompagner.'} ${f.reportTransmitted ? 'Bilan transmis.' : 'Rapport non transmis.'}`;
  } else if (departureMission) {
    const f = game.campaign;
    stats.push(['DÉPARTS ACQUIS',f.peopleDeparted],['ACCUEIL LOCAL',f.peopleLocal],['PERTES À AVAL',f.peopleLost],['PATIENTS ARRIVÉS',`${f.patientsArrived} refuge · ${f.patientsLocal} local`]);
    decisionText = `${f.plan === 'open' ? 'Maintien du passage choisi.' : f.plan === 'window' ? 'Fenêtre avant fermeture choisie.' : f.plan === 'close' ? 'Fermeture immédiate choisie.' : 'Aucune conduite choisie.'} ${f.execution === 'damaged' ? 'Des avaries sont constatées sur les ouvrages.' : f.closureCompleted ? 'Les deux accès ont été fermés.' : f.accessMaintained ? 'Le passage est maintenu.' : 'Les opérations ne sont pas achevées.'} ${f.boatsDeparted} bateaux partis, ${f.boatsArrived} arrivés, ${f.boatsLost} perdus. ${f.registryCopied ? 'Pages de relogement copiées.' : 'Registre non copié.'} ${f.reportTransmitted ? 'Bilan effectivement transmis.' : 'Rapport encore à transmettre.'}`;
  } else if (ambulanceMission) {
    const f = game.campaign;
    decisionText = `${f.destination === 'clinic' ? 'Accueil civil choisi.' : f.destination === 'imperial' ? 'Poste médical impérial choisi.' : 'Destination encore indéterminée.'} ${f.patientsArrived} patients arrivés, ${f.patientsLost} perdus ; ${f.staffAlive} membres de l’équipe vivants. ${f.beaconRecovered ? 'Balise, attaches et journal conservés ; origine de la pose à recouper.' : 'Aucune balise récupérée.'} ${f.vehicleDestroyed ? 'Véhicule détruit.' : f.vehicleSeized ? 'Véhicule arrivé puis saisi.' : f.vehicleRecovered ? 'Véhicule conservé pour les soins.' : 'Transfert non achevé.'}`;
  } else if (dikeMission) {
    const facts = game.campaign;
    decisionText = `${facts.circuit === 'diversion' ? 'Dérivation des maisons choisie.' : facts.circuit === 'imperial' ? 'Réglage impérial du quai choisi.' : 'Circuit encore indéterminé.'} ${facts.pumpsOnline ? 'La manœuvre de vanne est achevée.' : 'La remise en service n’est pas achevée.'} ${facts.residentsSafe} habitants à l’abri, ${facts.residentsLost} perdus ; ${facts.homesUninhabitable} logements inhabitables. ${facts.fuelSpent} lots utilisés pendant cette sortie.`;
  } else if (channelMission) {
    const facts = game.campaign;
    decisionText = `${facts.reportFiled ? 'Les constatations sur les deux équipages sont jointes au rapport.' : game.decision.resolved ? 'Le bordereau confirme le passage ; vos constatations restent au dossier.' : 'Le rapport du chenal reste ouvert.'} ${facts.refugeesPassed} passagers au quai ; ${facts.refugeesLost} perdus. ${facts.fuelLots} lots de carburant réellement chargés.`;
  } else if (industrialMission) {
    const filed = game.decision.choice === 'defy', sealed = game.decision.choice === 'obey';
    const evidenceText = game.campaign.technicalEvidence
      ? 'La copie du journal PT01 reste conservée. Elle établit un remplacement antérieur au rejet, sans en établir encore la cause.'
      : game.campaign.alternativeSourceNeeded || game.industrial.post.destroyed
        ? 'Le journal technique est perdu. Une autre source reste à rechercher.'
        : 'Le journal technique n’a pas encore été consulté.';
    decisionText = `${filed ? 'Votre constat de maintenance est joint au rapport.' : sealed ? 'Le dossier est remis sous scellés.' : 'Le rapport industriel reste ouvert.'} ${evidenceText}`;
  } else if (networkMission) {
    decisionText = game.decision.choice === 'defy' ? `Le constat des bâtiments est joint au rapport. ${game.campaign.civilRelaysOnline} relais civil${game.campaign.civilRelaysOnline === 1 ? '' : 's'} reste${game.campaign.civilRelaysOnline === 1 ? '' : 'nt'} actif${game.campaign.civilRelaysOnline === 1 ? '' : 's'} au départ.` : game.decision.choice === 'obey' ? 'La coupure générale est exécutée. Les bâtiments et leurs occupants gardent les dommages subis pendant la mission.' : 'Le sort des émissions reste à consigner.';
  } else if (railMission) {
    decisionText = game.decision.choice === 'defy' ? 'Le sort des ouvriers et du registre est joint au rapport signé.' : game.decision.choice === 'obey' ? 'Le dossier est remis scellé au commandement. Le sort des ouvriers reste consigné.' : 'Le rapport du train reste ouvert.';
  } else if (campaignMission) {
    decisionText = game.decision.choice === 'defy' ? 'Le signalement des Cales-Basses est joint au bordereau. Le quartier attend toujours des filtres.' : game.decision.choice === 'obey' ? 'La livraison prévue est consignée. Les Cales-Basses restent absentes du bordereau.' : 'Le bordereau reste ouvert.';
  } else decisionText = game.decision.choice === 'defy' ? 'Ordre contesté — une preuve est passée de l’autre côté.' : game.decision.choice === 'obey' ? 'Ordre exécuté — le rapport officiel fait foi.' : 'Aucune décision transmise.';
  $('result-stats').innerHTML = stats.map(([label, value]) => `<div class="result-stat"><small>${label}</small><strong>${value}</strong></div>`).join('') + `<div class="result-stat wide"><small>DÉCISION CONSIGNÉE</small><strong>${decisionText}</strong></div>`;
  $('next-operation').hidden = !won;
  $('next-operation').innerHTML = campaignMission ? 'RETOUR À L’ATELIER <span>→</span>' : 'OPÉRATION SUIVANTE <span>→</span>';
  $('replay').textContent = campaignMission ? won ? 'Rejouer sans modifier le dossier' : 'Recommencer la mission' : 'Rejouer l’opération';
  if (won && campaignMission) {
    const result = finishCampaignMission(campaign, game, { replay: campaignReplay });
    if (result.ok) { campaign = result.campaign; if (result.applied) { selectedCampaignId = nextCampaignMissionId(campaign) || game.missionId; saveCampaign(); } }
    if (campaignReplay) $('result-outcome').textContent += ' Relecture terminée. Votre dossier de campagne conserve la première réussite.';
    else if (!result.ok) $('result-outcome').textContent += ` Le rapport n’a pas été classé : ${result.message}`;
    const receipt = result.receipt;
    if (receipt && !campaignReplay) $('result-stats').innerHTML += `<div class="result-stat wide"><small>TESS / RETOUR À L’ATELIER</small><strong>${escapeHTML(receipt.tessLine)}</strong></div><div class="result-stat wide"><small>SAMI / CONVOI</small><strong>${escapeHTML(receipt.samiLine)}</strong></div>`;
  } else if (won) {
    records[game.missionId] = { completed: true, walker: game.walker.name, time: game.elapsed, evidence: game.stats.evidence, collateral: game.stats.collateral, choice: game.decision.choice, kills: game.stats.kills };
    persist('imperium.records.v1', records);
  }
  $('result-dialog').showModal();
}

let lastObjectives = '';
function updateHUD() {
  if (!game) return;
  const p = game.player;
  $('chemical-instrument').hidden = !game.chemical;
  if (game.chemical) {
    const d = game.chemical, f = game.campaign, v = chemicalSummary(game);
    $('chemical-stage').textContent = v.stage;
    $('chemical-tanks').textContent = `${v.inspected} / 3 CUVES RELEVÉES · ${v.identified} MARQUAGES · ${v.secured} ISOLÉES`;
    $('chemical-leak').textContent = `${f.leakStopped ? 'FUITE ARRÊTÉE' : 'FUITE ACTIVE'} · ${d.collector.destroyed ? 'COLLECTEUR ROMPU' : d.collector.closed ? 'COLLECTEUR FERMÉ' : 'COLLECTEUR OUVERT'} · ${f.spillInTransit.toFixed(1)} EN TRANSIT`;
    $('chemical-sample').textContent = `${v.sample} · ${f.pt02Acquired ? 'PT02 CONSERVÉ' : f.orisonRecordCopied ? 'REGISTRE COPIÉ' : f.orisonRecordLost ? 'REGISTRE PERDU' : 'REGISTRE À RELEVER'}`;
    $('chemical-water').textContent = `${v.clean} / 2 CANAUX PRÉSERVÉS · ${v.covered} COUVERTS · ${d.water.resolved ? f.villageHabitable ? 'VILLAGE HABITABLE' : 'HABITABILITÉ COMPROMISE' : 'EAU À RÉTABLIR'}`;
    $('chemical-instrument').classList.toggle('chemical-warning', !f.leakStopped || f.canalsPolluted > 0 || f.canalsIntact < 2 || f.sampleLost);
  }
  $('thyr-instrument').hidden = !game.livingRoute;
  if (game.livingRoute) {
    const r = game.livingRoute, f = game.campaign, v = livingRouteSummary(game);
    $('thyr-route').textContent = f.route === 'migration' ? 'PASSAGE VERS LES VERGERS' : f.route === 'imperial' ? 'DÉVIATION VERS L’EXCLUSION' : 'ROUTE À RELEVER ET À CHOISIR';
    $('thyr-herd').textContent = `LONGUES-DORSES : ${v.arrived} VERGER · ${v.displaced} DÉTOURNÉES · ${v.lost} PERDUES`;
    $('thyr-homes').textContent = `${v.homes} / 2 HABITATS HABITABLES · ${v.columns} / 2 COLONNES INTACTES`;
    $('thyr-approach').textContent = `${r.approach.prepared ? r.approach.kind === 'guided' ? 'APPROCHE GUIDÉE' : 'APPROCHE RELEVÉE' : 'APPROCHE À BALISER'} · ${v.settled} / 2 ÉVENTAILS REVENUS`;
    $('thyr-logistics').textContent = r.report.transmitted ? 'BILAN TRANSMIS · REJOINDRE LA RAMPE' : r.logistics.destroyed ? 'TRANSPORT LOGISTIQUE PERDU' : r.logistics.arrived ? 'LOGISTIQUE ARRIVÉE · TRANSMETTRE LE BILAN' : r.logistics.moving ? 'LOGISTIQUE EN ROUTE · COUVRIR LE TRAJET' : 'LOGISTIQUE EN ATTENTE';
    $('thyr-instrument').classList.toggle('thyr-warning', v.lost > 0 || v.homes < 2 || r.logistics.destroyed);
  }
  $('departure-instrument').hidden = !game.departure;
  if (game.departure) {
    const d=game.departure, f=game.campaign;
    const gateLabel=g=>g.destroyed?'BRÈCHE':g.mechanism.destroyed?`BLOQUÉE ${Math.round(g.opening*100)} %`:g.opening<=.05?'FERMÉE':`${Math.round(g.opening*100)} % OUVERTE`;
    $('departure-gates').textContent = `AMENÉE ${gateLabel(d.locks[0])} · PASSAGE ${gateLabel(d.locks[1])}`;
    $('departure-water').textContent = `BASSIN ${Math.round(d.basin*100)} % · COURANT ${Math.round(d.current*100)} % · ${d.tide.slack ? `ÉTALE ${Math.ceil(d.tide.remaining)} s` : `ÉTALE DANS ${Math.ceil(d.tide.nextSlack)} s`}`;
    $('departure-queue').textContent = `${f.peopleAtQuay} À QUAI · ${f.peopleAboard} À BORD · ${f.peopleEnRoute} EN ROUTE`;
    $('departure-arrivals').textContent = `${f.peopleDeparted} PARTIS · ${f.peopleArrived} AU REFUGE · ${f.peopleLocal} À AVAL · ${f.peopleLost} PERDUS`;
    $('departure-patients').textContent = `PATIENTS : ${f.patientsArrived} REFUGE · ${f.patientsLocal} LOCAL · ${f.patientsLost} PERDUS / ${f.patientsTotal}`;
    $('departure-refuge').textContent = f.refugeAvailable ? 'REFUGE CONFIRMÉ · 34 PLACES DONT 4 BRANCARDS' : 'REFUGE NON CONFIRMÉ · PRÉPAREZ L’ACCUEIL LOCAL';
    $('departure-instrument').classList.toggle('departure-warning',f.peopleLost>0||f.execution==='damaged');
  }
  $('ambulance-instrument').hidden = !game.ambulance;
  if (game.ambulance) {
    const f = game.campaign;
    $('ambulance-stage').textContent = f.transferResolved ? 'BILAN DU TRANSFERT ÉTABLI' : f.vehicleDestroyed ? 'VÉHICULE PERDU · CONSTATS POSSIBLES' : f.transferOrdered ? 'TRANSFERT SANITAIRE EN COURS' : f.vehicleStopped ? 'AMBULANCE À L’ARRÊT' : f.stopCalled ? 'ARRÊT DEMANDÉ · DÉGAGEZ L’AIRE' : 'AMBULANCE · APPEL À ÉTABLIR';
    $('ambulance-route').textContent = `RAMPE ${f.route === 'main' ? 'PRINCIPALE' : 'SECONDAIRE'} · ${f.rampPrepared ? 'PRÊTE' : 'À PRÉPARER'} · ${f.destination === 'clinic' ? 'ACCUEIL CIVIL' : f.destination === 'imperial' ? 'POSTE IMPÉRIAL' : 'DESTINATION À CHOISIR'}`;
    $('ambulance-people').textContent = `${f.patientsArrived} / 4 PATIENTS ARRIVÉS · ${f.patientsLost} PERDUS · ÉQUIPE ${f.staffAlive} / 2`;
    $('ambulance-cargo').textContent = f.medicalCargoVerified ? 'CARGAISON SANITAIRE VÉRIFIÉE' : f.cargoInspected ? 'CONSTAT SANS CARGAISON VÉRIFIABLE' : f.consentObtained ? 'ACCORD REÇU · CAISSE À INSPECTER' : 'ACCORD À L’EXAMEN À OBTENIR';
    $('ambulance-beacon').textContent = f.beaconRecovered ? 'BALISE RÉCUPÉRÉE · ORIGINE À RECOUPER' : f.beaconDestroyed ? 'BALISE PERDUE · CONSTAT À CONSERVER' : 'BOÎTIER AJOUTÉ · DÉMONTAGE À ACCOMPLIR';
  }
  $('dike-instrument').hidden = !game.dike;
  if (game.dike) {
    const site = game.dike, facts = game.campaign;
    $('dike-support').textContent = site.panel.emergencyShoring ? 'ÉTAI MANUEL EN PLACE' : site.panel.locked ? 'PANNEAU VERROUILLÉ' : site.panel.supported ? `SOUTIEN ANCRÉ · VERROU ${Math.round(site.panel.latchProgress * 100)} %` : site.panel.destroyed ? 'PANNEAU PERDU · ÉTAI À POSER' : 'PANNEAU À SOUTENIR · ANCREZ LES APPUIS';
    $('dike-pressure').textContent = `PRESSION ${Math.round(site.pressure)} % · FATIGUE ${Math.round(site.panel.fatigue)} %`;
    $('dike-residents').textContent = `${facts.residentsSafe} / 10 À L’ABRI · ${facts.residentsLost} PERDUS · ${facts.techniciansAlive} TECHNICIENS`;
    $('dike-fuel').textContent = site.auxiliary.active ? 'POMPE AUXILIAIRE ACTIVE · 2 LOTS UTILISÉS' : site.auxiliary.connected ? 'AUXILIAIRE PERDUE · CARBURANT DÉJÀ UTILISÉ' : site.auxiliary.destroyed ? `AUXILIAIRE PERDUE · ${facts.context.fuelAvailable === 2 ? '2 LOTS CONSERVÉS' : 'INTERVENTION MANUELLE'}` : facts.context.fuelAvailable === 2 ? 'AUXILIAIRE DISPONIBLE · 2 LOTS À BRANCHER' : 'SANS CARBURANT · INTERVENTION MANUELLE';
  }
  $('hud-timer').textContent = timeLabel(game.elapsed);
  $('hud-interaction').hidden = !game.interaction;
  $('hud-interaction').textContent = controlsText(game.interaction);
  const hull = Math.ceil(p.hull / p.maxHull * 100);
  $('hull-value').textContent = `${hull.toString().padStart(3, '0')}%`;
  $('hull-bar').style.width = `${hull}%`; $('hull-bar').style.background = hull < 25 ? '#e07c65' : '#c0c6aa';
  $('heat-value').textContent = p.overheated ? 'SURCHAUFFE' : `${Math.round(p.heat)}%`;
  $('heat-value').style.color = p.overheated ? '#ff9a79' : '';
  $('heat-bar').style.width = `${p.heat}%`; $('stability-value').textContent = `${Math.round(p.stability)}%`;
  $('stability-bar').style.width = `${p.stability}%`;
  const radiator = p.radiator;
  const repairReady = !p.move && Math.abs(p.speed) <= 3 && p.feet.every(foot => foot.contact);
  $('radiator-value').textContent = `${Math.round(radiator.health)} %`;
  $('radiator-bar').style.width = `${radiator.health}%`;
  $('radiator-condition').textContent = `DISSIPATION ${Math.round(35 + 0.65 * radiator.health)} % · ${radiator.repairKits} KIT${radiator.repairKits === 1 ? '' : 'S'}`;
  $('radiator-condition').classList.toggle('component-warning', radiator.health < 50);
  $('radiator-repair').textContent = radiator.repairing ? `RÉPARATION ${Math.round(radiator.repairProgress * 100)} %` : radiator.health >= radiator.maxHealth ? 'RADIATEUR PRÊT' : !radiator.repairKits ? 'KITS ÉPUISÉS' : !repairReady ? 'IMMOBILISEZ LES APPUIS' : `${keyLabel('repair')} · RÉPARER À L’ARRÊT`;
  $('radiator-repair').disabled = radiator.repairing || radiator.health >= radiator.maxHealth || radiator.repairKits === 0 || !repairReady;
  $('ammo-value').textContent = p.reloadTime > 0 ? '··' : p.ammo.toString().padStart(2, '0');
  $('ammo-total').textContent = `/ ${p.maxAmmo}`;
  $('ammo-reserve').textContent = p.reserveAmmo === 0 ? 'RÉSERVE ÉPUISÉE · REJOIGNEZ UN DÉPÔT' : `RÉSERVE ${p.reserveAmmo} / ${p.maxReserveAmmo}`;
  $('ammo-reserve').classList.toggle('ammo-warning', p.reserveAmmo <= p.maxAmmo);
  $('rocket-value').textContent = p.reloadTime > 0 ? `RECHARGEMENT ${p.reloadTime.toFixed(1)} s` : `ROQUETTES  ${p.rockets.toString().padStart(2, '0')} / ${p.maxRockets}`;
  $('assist-hint').textContent = game.assist ? 'ASSISTANCE AUX APPUIS ACTIVE' : `${keyLabel('stepA')} / ${keyLabel('stepB')} — APPUIS MANUELS`;
  $('leg-status').innerHTML = p.feet.map(f => `<span class="leg ${f.phase === 'swing' ? 'swing' : ''} ${f.health < 40 ? 'damaged' : ''}" data-label="${f.group ? 'B' : 'A'}${f.index + 1}" title="Appui ${f.index + 1} : ${Math.round(f.health)} %"></span>`).join('');
  const remainingObjectives = game.objectives.filter(o => !o.complete);
  const hudObjectives = game.chemical ? remainingObjectives.length ? remainingObjectives.slice(0, 3) : game.objectives.slice(-3) : game.objectives;
  const objectiveHTML = hudObjectives.map(o => `<li class="${o.complete ? 'complete' : ''}"><span class="objective-symbol">${o.complete ? '✓' : '◇'}</span><span>${escapeHTML(o.label)}</span>${o.target > 1 ? `<span class="objective-progress">${o.id === "escort" ? Math.min(100, Math.round(o.current / o.target * 100)) + " %" : o.current + "/" + o.target}</span>` : ''}</li>`).join('');
  if (lastObjectives !== objectiveHTML) { $('hud-objectives').innerHTML = objectiveHTML; lastObjectives = objectiveHTML; }
  $('convoy-status').hidden = !game.convoy;
  if (game.convoy) $('convoy-status').textContent = `CONVOI ${Math.ceil(game.convoy.hp / game.convoy.maxHp * 100)} % · ${game.convoy.arrived ? activeMode === 'campaign' ? 'AU POSTE DES MINEURS' : 'AU BAC' : game.convoy.moving ? 'EN MOUVEMENT' : 'VOUS ATTEND'}`;
  if (game.train) {
    $('convoy-status').hidden = false;
    const train = game.train;
    $('convoy-status').textContent = `TRAIN ${Math.ceil(train.hp / train.maxHp * 100)} % · ${train.stopped ? 'FREIN VERROUILLÉ' : train.moving ? `RUPTURE DANS ${Math.max(0, Math.ceil((train.breakX - train.x) / train.speed))} s` : 'RETENU PAR LES HARPONS'} · ${game.campaign.hostagesRescued} / ${game.campaign.hostagesTotal} LIBÉRÉS`;
    $('convoy-status').classList.toggle('rail-warning', train.moving && !train.stopped);
  } else $('convoy-status').classList.remove('rail-warning');
  if (game.network) {
    $('convoy-status').hidden = false;
    $('convoy-status').textContent = `${game.campaign.signalsIdentified} / 3 ÉMISSIONS IDENTIFIÉES · ${game.campaign.civilRelaysOnline} / 2 RÉSEAUX CIVILS ACTIFS · ${game.campaign.holtAlerted ? 'CONTRÔLE DE HOLT DÉCLENCHÉ' : 'LIAISON SOUS SURVEILLANCE'}`;
    $('convoy-status').classList.toggle('network-warning', game.campaign.holtAlerted);
  } else $('convoy-status').classList.remove('network-warning');
  if (game.industrial) {
    $('convoy-status').hidden = false;
    const facts = game.campaign;
    $('convoy-status').textContent = `${facts.coolantRestored ? 'CIRCUIT ALIMENTÉ' : 'POMPE À RELANCER'} · ${facts.turbinesCooled} / 2 TURBINES REFROIDIES · ${facts.witnessContacted ? 'CONTACT RECUEILLI' : game.industrial.contact.available ? 'CONTACT JOIGNABLE' : 'CONTACT INDISPONIBLE'}`;
  }
  $('tide-instrument').hidden = !game.channel;
  if (game.channel) {
    const { tide, boat } = game.channel, facts = game.campaign;
    const phases = { low: 'BASSE MER', rising: 'MARÉE MONTANTE', high: 'PLEINE MER', falling: 'MARÉE DESCENDANTE' };
    $('tide-phase').textContent = phases[tide.phase];
    $('tide-window').textContent = `CHANGEMENT DANS ${Math.ceil(tide.secondsToChange)} s`;
    $('tide-level').style.width = `${Math.round(tide.level * 100)}%`;
    $('tide-route').textContent = tide.walkable ? 'BANCS DÉGAGÉS · VASE RALENTISSANTE' : 'BANCS SUBMERGÉS · PRENEZ LES PASSERELLES';
    $('tide-instrument').classList.toggle('tide-warning', !tide.walkable);
    $('convoy-status').hidden = false;
    $('convoy-status').textContent = `${facts.winchesReleased} / 2 CÂBLES LIBÉRÉS · ${boat.destroyed ? 'BATEAU PERDU' : boat.arrived ? 'BATEAU AU QUAI' : boat.moving ? 'BATEAU EN TRAVERSÉE' : facts.channelOpen ? 'BATEAU ATTEND LA MARÉE' : 'BATEAU ATTEND LE CHENAL'} · ${Math.ceil(boat.hp / boat.maxHp * 100)} %`;
  }
}

async function fullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('Le plein écran n’est pas disponible dans ce navigateur.'); }
  catch { toast('Le navigateur n’a pas autorisé le plein écran.'); }
}
$('fullscreen-menu').addEventListener('click', fullscreen);
window.addEventListener('keydown', e => {
  if (bindingCapture) {
    e.preventDefault();
    if (e.repeat) return;
    if (e.code === 'Escape') { bindingCapture = null; renderBindings(); $('binding-status').textContent = 'Modification annulée.'; return; }
    if (e.ctrlKey || e.metaKey || e.altKey) { $('binding-status').textContent = 'Choisissez une touche seule, sans Ctrl, Alt ni touche système.'; return; }
    const result = remapBinding(settings.bindings, bindingCapture, e.code);
    $('binding-status').textContent = result.message;
    if (result.ok) { const id = bindingCapture; settings.bindings = result.bindings; bindingCapture = null; saveSettings(); renderBindings(); document.querySelector(`[data-binding="${id}"]`)?.focus(); }
    return;
  }
  // Navigation can move focus before a keyup reaches the page. Release first,
  // while leaving Tab and browser shortcuts to their normal handlers.
  if (e.code === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) { if (inGame) clearInput(); return; }
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
  if (['Enter','Space'].includes(e.code) && ['BUTTON','A','SUMMARY'].includes(document.activeElement?.tagName)) return;
  if (settings.bindings.fullscreen.includes(e.code) && !e.repeat) { e.preventDefault(); fullscreen(); return; }
  if (!inGame || !game) return;
  if (!hasPageFocus()) { suspendForFocus(); return; }
  if (settings.bindings.pause.includes(e.code)) {
    if (e.repeat) return;
    if (e.code !== 'Escape' && $('pause-dialog').open) { e.preventDefault(); resumeMission(); }
    else if (!$('pause-dialog').open && !$('decision-dialog').open && !$('result-dialog').open) { e.preventDefault(); pauseMission(); }
    return;
  }
  if (!missionAcceptsInput() || document.activeElement !== $('game-canvas')) return;
  if (!Object.values(settings.bindings).some(codes => codes.includes(e.code))) return;
  e.preventDefault();
  // Clearing input is a release boundary. Auto-repeat from a still-held key
  // cannot arm it again after a pause or a focus change; a fresh press can.
  if (e.repeat && !keys.has(e.code)) return;
  keys.add(e.code);
});
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', suspendForFocus);
document.addEventListener('visibilitychange', () => { if (document.hidden) suspendForFocus(); });
window.addEventListener('beforeunload', () => captureCampaign());
window.addEventListener('pagehide', event => { suspendForFocus(); if (!event.persisted) audio.dispose(); });
const canvas = $('game-canvas');
const missionFocusTargets = new Set([canvas, $('pause-button'), ...all('[data-hold]'), ...all('[data-action]')]);
for (const target of missionFocusTargets) target.addEventListener('blur', event => {
  if (!inGame) return;
  clearInput();
  // HUD controls keep their native focus and activation. Moving outside the
  // mission surface suspends the game, including a canvas-only focus loss.
  if (!missionFocusTargets.has(event.relatedTarget) && !paused && game?.status === 'playing' && !game.decision.active && !document.querySelector('dialog[open]')) suspendForFocus();
});
canvas.addEventListener('pointermove', e => { aimMode = 'pointer'; pointer.clientX = e.clientX; pointer.clientY = e.clientY; pointer.visible = true; pointer.touched = e.pointerType === 'touch'; const p = renderer.worldPoint(e.clientX, e.clientY); pointer.x = p.x; pointer.y = p.y; });
canvas.addEventListener('pointerdown', e => { if (!missionAcceptsInput()) return; aimMode = 'pointer'; canvas.focus({ preventScroll: true }); audio.unlock(); canvas.setPointerCapture(e.pointerId); const p = renderer.worldPoint(e.clientX, e.clientY); Object.assign(pointer, p, { clientX: e.clientX, clientY: e.clientY, visible: true, touched: e.pointerType === 'touch' }); if (e.button === 2) pointer.secondary = true; else pointer.fire = true; });
window.addEventListener('pointerup', e => { if (e.button === 2) pointer.secondary = false; else pointer.fire = false; });
canvas.addEventListener('pointercancel', clearInput); canvas.addEventListener('lostpointercapture', releasePointer); canvas.addEventListener('contextmenu', e => e.preventDefault());
all('[data-hold]').forEach(el => {
  el.addEventListener('pointerdown', e => { e.preventDefault(); if (!missionAcceptsInput()) return; el.setPointerCapture(e.pointerId); touch[el.dataset.hold] = true; pointer.touched = true; document.body.classList.add('touch-active'); audio.unlock(); });
  const release = e => { e.preventDefault(); touch[el.dataset.hold] = false; };
  el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release); el.addEventListener('lostpointercapture', release);
});
all('[data-action]').forEach(el => el.addEventListener('click', () => { if (missionAcceptsInput()) commandGame(game, el.dataset.action); }));

function input() {
  const keyboard = keyboardActions(keys, settings.bindings), pad = padState.input;
  if (pad.aimActive) { aimMode = 'gamepad'; padAim.x = pad.aimX; padAim.y = pad.aimY; }
  if (aimMode === 'gamepad') Object.assign(pointer, { x: game.player.x + padAim.x * 700, y: game.player.y + padAim.y * 700, visible: true, touched: false });
  else if (pointer.visible && !pointer.touched) Object.assign(pointer, renderer.worldPoint(pointer.clientX, pointer.clientY));
  let aimX = pointer.x, aimY = pointer.y;
  if (touch.fire || touch.secondary) {
    const targets = [...game.enemies.filter(e => !e.dead && e.active && (e.id !== 'holt-observer' || game.network?.scrutinyTriggered) && (e.id !== 'private-hauler' || !game.industrial?.retreatEscaped) && !(e.type === "boss" && (!game.bossReleased || game.decision.choice === "obey"))), ...game.relays.filter(r => !r.destroyed)];
    targets.sort((a, b) => Math.abs(a.x - game.player.x) - Math.abs(b.x - game.player.x));
    const target = targets.find(e => Math.abs(e.x - game.player.x) < 1000);
    aimX = target?.x ?? game.player.x + 600; aimY = target?.y ?? game.player.y + 60;
  }
  return { move: clamp((keyboard.right || touch.right ? 1 : 0) - (keyboard.left || touch.left ? 1 : 0) + pad.move, -1, 1), fire: pointer.fire || touch.fire || pad.fire, secondary: pointer.secondary || touch.secondary || pad.secondary,
    aimX, aimY, brace: keyboard.brace || touch.brace || pad.brace, vent: keyboard.vent || touch.vent || pad.vent, reload: keyboard.reload || pad.reload, repair: keyboard.repair || pad.repair, stepA: keyboard.stepA || pad.stepA, stepB: keyboard.stepB || pad.stepB, interact: keyboard.interact || pad.interact };
}
function events() {
  const fresh = game.events.filter(e => e.id > lastEventId); let sounds = 0;
  for (const e of fresh) {
    lastEventId = e.id;
    if (sounds < 5 && !['victory','defeat'].includes(e.type) && audio.event(e, game)) sounds++;
    if (e.text && ['radio','objective','overheat','pressure','gate','boarding','departure','arrival'].includes(e.type) && !radioQueue.some(item => item.text === e.text)) {
      const priority = ['overheat','pressure','departure'].includes(e.type), routine = ['boarding','arrival'].includes(e.type);
      const item = { type:e.type, text:e.text, priority };
      if (routine) radioQueue = radioQueue.filter(previous => previous.type !== e.type);
      if (priority) { radioQueue.unshift(item); radioUntil = Math.min(radioUntil, game.elapsed); }
      else radioQueue.push(item);
      while (radioQueue.length > 8) {
        const discard = radioQueue.findIndex(previous => !previous.priority && ['boarding','arrival'].includes(previous.type));
        const ordinary = radioQueue.findIndex(previous => !previous.priority);
        radioQueue.splice(discard >= 0 ? discard : ordinary >= 0 ? ordinary : radioQueue.length - 1, 1);
      }
    }
  }
  if (game.elapsed >= radioUntil && radioQueue.length) {
    const next = radioQueue.shift();
    $('radio-text').textContent = controlsText(next.text);
    radioUntil = game.elapsed + clamp(next.text.length / 23, 4, 10);
  }
  $('radio').classList.toggle('visible', game.elapsed < radioUntil);
}
function frame(now) {
  const dt = Math.min((now - (lastTime || now)) / 1000, .05); lastTime = now;
  try {
    refreshGamepad();
    if (inGame && game) {
      if (!paused && game.status === 'playing' && !game.decision.active) updateGame(game, dt, input());
      if (!paused && activeMode === 'campaign' && !campaignReplay) {
        const fuelChanged = game.missionId === 'MI06' && game.campaign.fuelSpent !== campaign.checkpoint?.campaign.fuelSpent;
        const failedSortie = ['MI06', 'MI07', 'MI08', 'MI09', 'MI10'].includes(game.missionId) && game.status === 'lost' && campaign.checkpoint?.status !== 'lost';
        if (fuelChanged || failedSortie || (game.status === 'playing' && game.elapsed - lastCampaignSaveAt >= 8)) captureCampaign();
      }
      renderer.render(game, { shake: settings.shake && !settings.motion, reducedMotion: settings.motion, highContrast: settings.contrast, tideInstrument: false, departureInstrument: false, interactionPrompt: false, pointer });
      if (!paused) { audio.update(game); events(); }
      hudTick += dt; if (hudTick > .1) { updateHUD(); hudTick = 0; }
      $('mission-intro').classList.toggle('visible', game.elapsed > .4 && game.elapsed < 4.6);
      if (game.decision.active) showDecision();
      if (game.status !== 'playing') showResult();
    } else if (view === 'hangar') hangarRenderer.renderHangar(selectedWalker(), settings.motion ? 0 : now / 1000);
  } catch (error) {
    console.error('Rendering stopped safely:', error); paused = true; audio.setPaused(true);
    if (inGame && !document.querySelector('dialog[open]')) { $('pause-dialog').showModal(); toast('La liaison a rencontré une erreur. Vous pouvez revenir au pont.'); }
  }
  requestAnimationFrame(frame);
}

applySettings(); renderMissionCards(); renderHangarUI(); renderCampaignUI(); showView('campaign');
$('boot').hidden = true; $('menu').hidden = false;
requestAnimationFrame(frame);
// Read-only observation hook for the automated browser suite, never a player menu.
if (new URLSearchParams(location.search).get('test') === '1') {
  window.__IMPERIUM_TEST__ = Object.freeze({ snapshot: () => ({ game: game ? structuredClone(game) : null, campaign: structuredClone(campaign), activeMode, campaignReplay, campaignBlocked, campaignWarning, cameraX: renderer.cameraX, paused, inGame, view, settings: { ...settings }, storageAvailable }) });
}
