/** MI11 campaign validation. Pure checks; never advances or repairs a scene. */
import { DIFFICULTIES, ENEMY_TYPES } from './content.mjs';
import { createGame } from './simulation.mjs';
import { voiceDerivedFacts, voiceReceiptRoster } from './voice-simulation.mjs';

const FLAGS = ['sourceLocated', 'ridgeSurveyed', 'ridgeIntact', 'emitterInspected', 'warningCopied',
  'translationInspected', 'translationCopied', 'encounterResolved', 'lethMet', 'lethAlive',
  'consentAsked', 'consentGranted', 'consentRefused', 'consentWithdrawn', 'testimonyStarted',
  'testimonyRecorded', 'testimonyLost', 'testimonyResolved', 'te01Acquired', 'witnessAvailable',
  'publicConsent', 'recruited', 'alliancePossible', 'emitterSeized', 'emitterRestored',
  'emitterOnline', 'emitterLost', 'operationsResolved', 'privateTriggered', 'privateReady',
  'manifestRead', 'reportTransmitted'];
const COUNTS = { readingsTaken: 3, signalsRecorded: 3, nestsTotal: 3, nestsIntact: 3,
  nestsDamaged: 3, nestsLost: 3, nestDisturbance: 10_000_000, lethTrust: 70, privateNeutralized: 3 };
const CONTEXT_KEYS = ['chemicalRecorded', 'chemicalChoice', 'chemicalPt02', 'chemicalVillageHabitable', 'chemicalWaterRestored'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const close = (a, b) => Math.abs(a - b) <= 1e-6;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function requireValue(ok, label) { if (!ok) throw new Error(`Sauvegarde invalide : voix de Thyr — ${label}`); }
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

export function createVoiceDossier() {
  return { plan: 'unselected', ...Object.fromEntries(FLAGS.map(key => [key, false])),
    ...Object.fromEntries(Object.keys(COUNTS).map(key => [key, 0])), roster: null };
}

export function voiceContextFor(campaign) {
  const report = campaign.completed.MI10;
  return { chemicalRecorded: Boolean(report), chemicalChoice: report?.choice || 'none',
    chemicalPt02: report?.pt02Acquired || false, chemicalVillageHabitable: report?.villageHabitable || false,
    chemicalWaterRestored: report?.waterRestored || false };
}

function validateContext(context) {
  keys(context, CONTEXT_KEYS, 'héritage du champ chimique');
  for (const key of CONTEXT_KEYS.filter(key => key !== 'chemicalChoice')) boolean(context[key], `héritage ${key}`);
  requireValue(['none', 'obey', 'defy'].includes(context.chemicalChoice), 'conduite héritée inconnue');
  requireValue(context.chemicalRecorded === (context.chemicalChoice !== 'none'), 'choix sans rapport MI10');
  requireValue(context.chemicalRecorded || !context.chemicalPt02 && !context.chemicalVillageHabitable && !context.chemicalWaterRestored, 'conséquence sans rapport MI10');
}

export function validateVoiceFacts(facts, finished = false) {
  for (const key of FLAGS) boolean(facts[key], `bilan ${key}`);
  for (const [key, max] of Object.entries(COUNTS)) number(facts[key], 0, max, `bilan ${key}`, true);
  requireValue(['unselected', 'seize', 'restore'].includes(facts.plan), 'conduite inconnue');
  requireValue(facts.signalsRecorded <= facts.readingsTaken, 'signal sans relevé');
  requireValue(facts.sourceLocated === (facts.signalsRecorded === 3 || facts.emitterInspected), 'localisation sans relevés ni constat sur place');
  requireValue(facts.nestsTotal === 3 && facts.nestsIntact + facts.nestsDamaged + facts.nestsLost === 3, 'bilan de ponte non réconcilié');
  requireValue(!facts.warningCopied || facts.emitterInspected, 'avis copié sans inspection');
  requireValue(!facts.translationCopied || facts.translationInspected, 'traduction copiée sans inspection');
  requireValue(facts.manifestRead === (facts.emitterInspected && facts.translationInspected), 'relevé contraire aux deux inspections');
  requireValue(!facts.lethMet || facts.encounterResolved, 'rencontre sans contact');
  requireValue(!facts.consentAsked || facts.lethMet && facts.manifestRead, 'demande avant rencontre et relevés');
  requireValue(facts.consentAsked === (facts.consentGranted || facts.consentRefused) && !(facts.consentGranted && facts.consentRefused), 'accord et refus incompatibles');
  requireValue(!facts.consentWithdrawn || facts.consentGranted && facts.nestsIntact < 3, 'retrait sans accord ni atteinte au site');
  requireValue(!facts.testimonyStarted || facts.consentGranted, 'échange démarré sans accord');
  requireValue(!facts.testimonyRecorded || facts.testimonyStarted && facts.consentGranted, 'témoignage sans échange consenti');
  requireValue(facts.testimonyLost === (!facts.lethAlive && !facts.testimonyRecorded), 'perte de témoignage contraire au sort de Leth');
  requireValue(facts.testimonyResolved === (facts.testimonyRecorded || facts.testimonyLost || facts.consentRefused || facts.consentWithdrawn), 'sort de l’échange incohérent');
  requireValue(facts.te01Acquired === (facts.signalsRecorded === 3 && facts.warningCopied && facts.translationCopied && facts.testimonyRecorded), 'TE01 sans signaux, sources et échange achevé');
  requireValue(facts.witnessAvailable === (facts.lethMet && facts.lethAlive && facts.consentGranted && !facts.consentWithdrawn), 'disponibilité contraire au témoin et à son accord');
  requireValue(!facts.publicConsent && !facts.recruited, 'diffusion publique ou recrutement non accomplis dans MI11');
  requireValue(!(facts.emitterSeized && facts.emitterRestored), 'émetteur à la fois capturé et restauré');
  requireValue(!facts.emitterSeized || facts.plan === 'seize' && !facts.emitterLost, 'capture contraire au plan ou après perte');
  requireValue(!facts.emitterRestored || facts.plan === 'restore', 'restauration sans plan correspondant');
  requireValue(facts.emitterOnline === (facts.emitterRestored && !facts.emitterLost && !facts.emitterSeized), 'liaison active contraire à l’appareil');
  requireValue(facts.operationsResolved === (facts.plan !== 'unselected' && (facts.emitterLost || (facts.plan === 'seize' ? facts.emitterSeized : facts.emitterRestored))), 'opération déclarée sans résultat matériel');
  const trust = facts.lethMet && facts.lethAlive ? clamp(facts.nestsIntact * 10 + (facts.testimonyRecorded ? 20 : 0) + (facts.emitterOnline ? 20 : 0) - (facts.emitterSeized ? 15 : 0) - (facts.consentWithdrawn ? 30 : 0), 0, 70) : 0;
  requireValue(facts.lethTrust === trust, 'confiance contraire aux actes et à la survie');
  requireValue(facts.alliancePossible === (facts.witnessAvailable && facts.te01Acquired && facts.emitterOnline && facts.nestsIntact === 3), 'coopération supposée sans ses conditions');
  requireValue(!facts.privateReady || facts.privateTriggered, 'forces arrivées sans alerte');
  requireValue(!facts.privateNeutralized || facts.privateReady, 'force neutralisée avant arrivée');
  requireValue(!facts.reportTransmitted || facts.readingsTaken === 3 && facts.manifestRead && facts.encounterResolved && facts.testimonyResolved && facts.operationsResolved && facts.privateNeutralized === 3, 'rapport avant résolution des faits');
  if (finished) requireValue(facts.reportTransmitted && facts.plan !== 'unselected', 'rapport final incomplet');
}

export function voiceDossierFromGame(game) {
  const fields = Object.keys(createVoiceDossier()).filter(key => key !== 'roster');
  return { ...Object.fromEntries(fields.map(key => [key, game.campaign[key]])), roster: voiceReceiptRoster(game) };
}

function validateScene(scene, initial, facts, settings, options) {
  const { elapsed, privateForces, initialForces, receipt = false, player = null, steps = 10_000_000, shots = 10_000_000, length } = options;
  const frame = .05 + 1e-6;
  shape(scene, initial, 'scène');
  for (const group of ['listening', 'nests']) {
    requireValue(Array.isArray(scene[group]) && scene[group].length === initial[group].length, `${group} incomplet`);
    scene[group].forEach((part, index) => shape(part, initial[group][index], `${group}[${index}]`));
  }
  for (const name of ['ridge', 'emitter', 'receiver', 'leth', 'orders', 'report', 'alert', 'noise']) shape(scene[name], initial[name], name);
  const stamp = (value, label) => { if (value !== null) number(value, 0, elapsed, label); };
  const chronology = (value, flag, label) => { stamp(value, label); requireValue((value !== null) === flag, `${label} absent ou inventé`); };
  const dates = part => { for (const key of Object.keys(part).filter(key => key.endsWith('At'))) stamp(part[key], `${part.id || 'alerte'}.${key}`); };
  const body = (part, original) => {
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
  const allReadAt = scene.listening.every(point => point.sampled) ? Math.max(...scene.listening.map(point => point.sampledAt)) : null;
  for (const [index, point] of scene.listening.entries()) {
    body(point, initial.listening[index]); work(point, settings.listenTime, point.x, true);
    for (const key of ['sampled', 'detected']) boolean(point[key], `${point.id}.${key}`);
    chronology(point.sampledAt, point.sampled, `${point.id} relevé`);
    requireValue(point.sampled === (point.completedAt !== null) && point.sampledAt === point.completedAt, 'relevé sans durée d’écoute');
    requireValue(!point.detected || point.sampled, 'signal sans relevé');
    if (point.detected) {
      requireValue(point.destroyedAt === null || point.sampledAt <= point.destroyedAt, 'signal après perte du capteur');
      requireValue(scene.emitter.destroyedAt === null || point.sampledAt <= scene.emitter.destroyedAt, 'signal après perte de la source');
      requireValue(scene.emitter.seizedAt === null || point.sampledAt <= scene.emitter.seizedAt, 'signal après capture de la source');
      requireValue(close(point.signal, clamp(1 - Math.abs(point.x - scene.emitter.x) / length, .05, 1)) && point.bearing === Math.sign(scene.emitter.x - point.x), 'mesure de vibration contraire à la géométrie');
    } else {
      requireValue(point.signal === 0 && point.bearing === 0, 'mesure inventée sans détection');
      if (point.sampled) requireValue([point.destroyedAt, scene.emitter.destroyedAt, scene.emitter.seizedAt].some(time => time !== null && time <= point.sampledAt), 'absence de signal sans source ou capteur perdu');
    }
    if (player && point.working && point.progress > 0) requireValue(elapsed + 1e-6 >= scene.noise.until, 'écoute sous bruit récent');
  }
  body(scene.ridge, initial.ridge); fixed(scene.ridge, initial.ridge, ['controlX'], 'repère de corniche');
  work(scene.ridge, settings.surveyTime, scene.ridge.controlX, true);
  boolean(scene.ridge.surveyed, 'corniche reconnue'); chronology(scene.ridge.surveyedAt, scene.ridge.surveyed, 'reconnaissance de corniche');
  requireValue(scene.ridge.surveyedAt === scene.ridge.completedAt, 'reconnaissance sans travail achevé');
  requireValue(!scene.ridge.surveyed || scene.ridge.destroyedAt === null || scene.ridge.surveyedAt <= scene.ridge.destroyedAt, 'reconnaissance après perte du passage');
  scene.nests.forEach((nest, index) => {
    body(nest, initial.nests[index]); chronology(nest.damagedAt, nest.hp < nest.maxHp, `${nest.id} première atteinte`);
    if (nest.destroyed) requireValue(nest.damagedAt <= nest.destroyedAt, 'rupture de nid antérieure à sa première atteinte');
    number(nest.disturbance, 0, steps, 'passages près du nid', true); number(nest.lastStep, -1, steps, 'dernier appui près du nid', true);
    requireValue((nest.lastStep === -1) === (nest.disturbance === 0), 'trace d’appui sans passage');
  });
  const inspect = (part, copiedKey) => {
    boolean(part.inspected, `${part.id} inspection`); boolean(part[copiedKey], `${part.id} copie`);
    chronology(part.inspectedAt, part.inspected, `${part.id} date d’inspection`);
    chronology(part.copiedAt, part[copiedKey], `${part.id} date de copie`);
    requireValue(!part.inspected || allReadAt !== null && part.inspectedAt + frame >= allReadAt + settings.inspectTime, 'inspection avant les relevés ou trop rapide');
    requireValue(!part[copiedKey] || part.inspected && part.copiedAt === part.inspectedAt && (part.destroyedAt === null || part.copiedAt <= part.destroyedAt), 'copie sans original disponible');
    requireValue(!part.inspected || part[copiedKey] || part.destroyedAt !== null && part.destroyedAt <= part.inspectedAt, 'original intact inspecté sans copie');
  };
  const emitter = scene.emitter, receiver = scene.receiver, l = scene.leth;
  const resolvedAt = Math.min(...[l.testimonyAt, l.lostAt, l.refused ? l.consentAt : null, l.withdrawnAt].filter(time => time !== null));
  body(receiver, initial.receiver); work(receiver, settings.inspectTime, receiver.x); inspect(receiver, 'translationCopied');
  requireValue(receiver.completedAt === receiver.inspectedAt, 'inspection du récepteur sans travail achevé');
  if (receiver.startedAt !== null) requireValue(allReadAt !== null && receiver.startedAt >= allReadAt, 'copie du récepteur commencée avant les relevés');
  body(emitter, initial.emitter); inspect(emitter, 'warningCopied');
  requireValue(['none', 'emitter', 'seize', 'restore'].includes(emitter.work), 'travail d’émetteur inconnu');
  const emitterDuration = emitter.work === 'emitter' ? settings.inspectTime : emitter.work === 'seize' ? settings.seizeTime : settings.restoreTime;
  work(emitter, emitterDuration, emitter.x, ['seize', 'restore'].includes(emitter.work));
  for (const key of ['seized', 'restored']) {
    boolean(emitter[key], `émetteur ${key}`); chronology(emitter[`${key}At`], emitter[key], `émetteur date ${key}`);
  }
  requireValue(emitter.work !== 'none' || !emitter.inspected && emitter.progress === 0 && !emitter.working && emitter.startedAt === null && emitter.completedAt === null, 'travail d’émetteur sans opération');
  if (emitter.work === 'emitter') {
    requireValue(emitter.completedAt === emitter.inspectedAt, 'inspection d’émetteur sans durée');
    if (emitter.startedAt !== null) requireValue(allReadAt !== null && emitter.startedAt >= allReadAt, 'copie de l’émetteur commencée avant les relevés');
  }
  if (['seize', 'restore'].includes(emitter.work)) {
    requireValue(facts.plan === emitter.work && emitter.inspected && receiver.inspected && l.encountered && facts.testimonyResolved, 'opération avant relevés, échange et choix');
    if (emitter.startedAt !== null) requireValue(emitter.startedAt >= Math.max(emitter.inspectedAt, receiver.inspectedAt, l.encounteredAt, resolvedAt), 'opération antidatée');
  }
  if (emitter.seized || emitter.restored) {
    const completed = emitter.seized ? emitter.seizedAt : emitter.restoredAt;
    requireValue(completed === emitter.completedAt && emitter.work === (emitter.seized ? 'seize' : 'restore'), 'opération sans durée complète');
    requireValue(emitter.destroyedAt === null || completed <= emitter.destroyedAt, 'opération après destruction de l’émetteur');
  }
  if (emitter.destroyed && emitter.working) requireValue(emitter.work === 'emitter', 'opération sur une source détruite');

  body(l, initial.leth); fixed(l, initial.leth, ['characterId', 'name'], 'identité de Leth');
  for (const key of ['alive', 'encountered', 'met', 'consentAsked', 'consent', 'refused', 'withdrawn', 'testimonyStarted', 'testimonyRecorded', 'testimonyLost', 'publicConsent', 'recruited']) boolean(l[key], `Leth ${key}`);
  requireValue(l.alive === !l.destroyed, 'survie de Leth contraire à son intégrité');
  requireValue(['none', 'meet', 'consent', 'testimony'].includes(l.work), 'travail de Leth inconnu');
  const witnessDuration = l.work === 'meet' ? settings.contactTime : l.work === 'consent' ? settings.consentTime : settings.exchangeTime;
  work(l, witnessDuration, l.x, false, l.work === 'testimony' ? settings.exchangeRadius : settings.interactionRadius);
  chronology(l.encounteredAt, l.encountered, 'contact ou constat de Leth'); chronology(l.metAt, l.met, 'rencontre vivante de Leth');
  chronology(l.consentAt, l.consentAsked, 'demande d’accord'); chronology(l.withdrawnAt, l.withdrawn, 'retrait de l’accord');
  chronology(l.firstStartedAt, l.testimonyStarted, 'premier lancement de l’échange');
  chronology(l.testimonyAt, l.testimonyRecorded, 'témoignage achevé'); chronology(l.lostAt, l.testimonyLost, 'témoignage perdu');
  requireValue(l.work !== 'none' || !l.encountered && !l.working && l.progress === 0 && l.startedAt === null && l.completedAt === null, 'travail de Leth sans acte');
  requireValue(!l.consentAsked || ['consent', 'testimony'].includes(l.work), 'réponse sans travail de consentement');
  requireValue(!l.testimonyStarted || l.work === 'testimony', 'lancement sans travail de témoignage');
  requireValue(!l.met || l.encountered && l.metAt === l.encounteredAt && (l.destroyedAt === null || l.metAt <= l.destroyedAt), 'rencontre sans personne vivante');
  requireValue(!l.encountered || l.met || l.destroyedAt !== null && l.destroyedAt <= l.encounteredAt, 'contact sans rencontre ni constat de perte');
  if (l.encountered) {
    requireValue(allReadAt !== null && l.encounteredAt + frame >= allReadAt + settings.contactTime, 'rencontre avant les relevés ou trop rapide');
    requireValue(facts.sourceLocated, 'rencontre sans localisation');
  }
  if (l.work === 'meet') {
    requireValue(facts.sourceLocated && l.completedAt === l.encounteredAt, 'contact sans localisation ou durée achevée');
    const locatedAt = Math.min(...[facts.signalsRecorded === 3 ? allReadAt : null, emitter.inspectedAt].filter(time => time !== null));
    if (l.startedAt !== null) requireValue(l.startedAt >= locatedAt, 'contact commencé avant localisation');
  }
  if (l.consentAsked) {
    requireValue(l.met && emitter.inspected && receiver.inspected && l.consentAt + frame >= Math.max(l.metAt, emitter.inspectedAt, receiver.inspectedAt) + settings.consentTime, 'accord avant rencontre et inspection ou trop rapide');
    requireValue(l.destroyedAt === null || l.consentAt <= l.destroyedAt, 'accord demandé à un témoin perdu');
    requireValue(l.consent !== l.refused, 'demande sans réponse distincte');
    if (l.consent) requireValue(scene.nests.every(nest => nest.damagedAt === null || nest.damagedAt >= l.consentAt), 'accord malgré atteinte déjà acquise');
    if (l.refused) requireValue(scene.nests.some(nest => nest.damagedAt !== null && nest.damagedAt <= l.consentAt), 'refus matériel sans atteinte au site');
  } else requireValue(!l.consent && !l.refused, 'réponse sans demande');
  if (l.work === 'consent') {
    requireValue(l.met && emitter.inspected && receiver.inspected && l.completedAt === l.consentAt, 'accord sans rencontre, sources ou durée achevée');
    if (l.startedAt !== null) requireValue(l.startedAt >= Math.max(l.metAt, emitter.inspectedAt, receiver.inspectedAt), 'accord commencé avant rencontre et copies');
  }
  if (l.withdrawn) {
    requireValue(l.consent && l.withdrawnAt >= l.consentAt && scene.nests.some(nest => nest.damagedAt !== null && nest.damagedAt <= l.withdrawnAt), 'retrait sans accord antérieur ni atteinte');
    requireValue(l.destroyedAt === null || l.withdrawnAt <= l.destroyedAt, 'retrait attribué à un témoin déjà perdu');
    requireValue(!l.testimonyRecorded || l.testimonyAt <= l.withdrawnAt, 'témoignage achevé après retrait');
  }
  if (l.testimonyStarted) requireValue(l.consent && l.firstStartedAt >= l.consentAt && (l.destroyedAt === null || l.firstStartedAt <= l.destroyedAt), 'début d’échange sans accord vivant');
  if (l.testimonyRecorded) requireValue(l.work === 'testimony' && l.testimonyAt === l.completedAt && l.firstStartedAt <= l.startedAt && (l.destroyedAt === null || l.testimonyAt <= l.destroyedAt), 'enregistrement sans durée ou après décès');
  if (l.work === 'testimony') {
    requireValue(l.testimonyStarted && l.consent, 'travail de témoignage sans accord');
    if (l.startedAt !== null) requireValue(l.startedAt >= l.firstStartedAt, 'relance avant premier lancement');
    if (l.working) requireValue(l.alive && !l.withdrawn && !l.refused, 'échange actif sans témoin consentant');
  }
  requireValue(l.testimonyLost === (!l.alive && !l.testimonyRecorded), 'témoignage perdu contrairement aux actes');
  if (l.testimonyLost) requireValue(l.lostAt === l.destroyedAt, 'date de perte contraire au décès');
  requireValue(!l.publicConsent && !l.recruited, 'autorisation ou recrutement inventés');

  fixed(scene.orders, initial.orders, Object.keys(initial.orders), 'poste d’ordre');
  fixed(scene.report, initial.report, ['id', 'x', 'y', 'w', 'h'], 'poste de rapport'); work(scene.report, settings.reportTime, scene.report.x);
  boolean(scene.report.transmitted, 'rapport transmis'); chronology(scene.report.transmittedAt, scene.report.transmitted, 'date du rapport');
  requireValue(scene.report.transmittedAt === scene.report.completedAt, 'rapport sans travail achevé');
  if (scene.report.startedAt !== null) {
    requireValue(facts.readingsTaken === 3 && facts.manifestRead && facts.encounterResolved && facts.testimonyResolved && facts.operationsResolved && facts.privateNeutralized === 3, 'rapport commencé avant résolution matérielle');
    requireValue(scene.report.startedAt >= Math.max(allReadAt, emitter.inspectedAt, receiver.inspectedAt, l.encounteredAt, resolvedAt, emitter.seizedAt ?? emitter.restoredAt ?? emitter.destroyedAt), 'rapport commencé avant les faits');
  }
  number(scene.noise.until, 0, elapsed + 1.5 + 1e-6, 'fin du bruit'); number(scene.noise.observedShots, 0, shots, 'tirs observés', true);
  const alert = scene.alert;
  for (const key of ['triggered', 'ready']) boolean(alert[key], `alerte ${key}`);
  chronology(alert.triggeredAt, alert.triggered, 'début d’alerte'); chronology(alert.readyAt, alert.ready, 'arrivée privée');
  requireValue(['none', 'contact', 'emitter-loss', 'witness-loss'].includes(alert.reason), 'cause d’alerte inconnue');
  number(alert.elapsed, 0, settings.privateDelay, 'délai privé');
  requireValue(alert.triggered === (alert.reason !== 'none'), 'alerte sans cause');
  requireValue(!alert.triggered || close(alert.elapsed, Math.min(settings.privateDelay, elapsed - alert.triggeredAt)), 'horloge privée incohérente');
  requireValue(alert.ready === (alert.triggered && alert.elapsed >= settings.privateDelay - 1e-9), 'arrivée avant délai');
  requireValue(!alert.ready || Math.abs(alert.readyAt - alert.triggeredAt - settings.privateDelay) <= frame, 'date d’arrivée contraire au délai');
  const causes = { contact: l.encounteredAt, 'emitter-loss': emitter.destroyedAt, 'witness-loss': l.destroyedAt };
  if (alert.triggered) requireValue(causes[alert.reason] === alert.triggeredAt, 'alerte sans événement matériel');
  const triggerTimes = Object.values(causes).filter(time => time !== null);
  requireValue(Boolean(triggerTimes.length) === alert.triggered, 'événement sans alerte ou alerte inventée');
  if (triggerTimes.length) requireValue(alert.triggeredAt === Math.min(...triggerTimes), 'premier événement d’alerte réécrit');
  requireValue(Array.isArray(privateForces) && privateForces.length === 3 && initialForces.length === 3, 'registre privé incomplet');
  if (receipt) requireValue(Object.values(DIFFICULTIES).some(level => privateForces.every((unit, index) => unit.maxHp === Math.round(ENEMY_TYPES[initialForces[index].type].hp * level.enemyHealth))), 'capacités incompatibles avec une même difficulté');
  privateForces.forEach((unit, index) => {
    if (receipt) keys(unit, ['id', 'type', 'hp', 'maxHp', 'dead'], 'unité privée : champs');
    fixed(unit, initialForces[index], ['id', 'type'], 'identité privée');
    if (!receipt) requireValue(unit.maxHp === initialForces[index].maxHp, 'capacité privée modifiée');
    number(unit.hp, -1000, unit.maxHp, 'intégrité privée'); boolean(unit.dead, 'perte privée');
    requireValue(unit.dead === (unit.hp <= 0), 'perte privée sans dégâts');
    if (!alert.ready) {
      requireValue(!unit.dead && unit.hp === unit.maxHp, 'unité privée touchée avant arrivée');
      if (!receipt) fixed(unit, initialForces[index], ['x', 'y', 'active', 'phase', 'timer'], 'unité privée prématurée');
    }
  });
  const derived = voiceDerivedFacts({ voice: scene, enemies: privateForces,
    decision: { resolved: facts.plan !== 'unselected', choice: facts.plan === 'seize' ? 'obey' : facts.plan === 'restore' ? 'defy' : null } });
  for (const [key, expected] of Object.entries(derived)) requireValue(facts[key] === expected, `bilan contraire aux objets : ${key}`);
}

export function validateVoiceMission(value, template) {
  const facts = value.campaign;
  requireValue(object(facts) && facts.missionId === 'MI11' && object(value.voice), 'scène absente');
  validateContext(facts.context); validateVoiceFacts(facts, value.status === 'won');
  requireValue(facts.plan === (value.decision.choice === null ? 'unselected' : value.decision.choice === 'obey' ? 'seize' : 'restore'), 'conduite contraire au choix');
  requireValue(!value.decision.active && !value.decision.resolved || facts.manifestRead && facts.encounterResolved && facts.testimonyResolved, 'choix avant relevés et échange ou constat');
  validateScene(value.voice, template.voice, facts, value.mission.voice, { elapsed: value.elapsed,
    privateForces: value.enemies, initialForces: template.enemies, player: value.player,
    steps: value.stats.steps, shots: value.stats.shots, length: value.mission.length });
  const phase = value.status === 'won' ? 'complete' : facts.reportTransmitted ? 'extraction' : value.decision.resolved ? 'operations' : value.decision.active ? 'decision' : null;
  if (phase) requireValue(facts.phase === phase, 'phase contraire aux actes');
  else {
    requireValue(['listening', 'approach', 'sources', 'contact', 'exchange', 'assessment'].includes(facts.phase), 'phase d’approche inconnue');
    if (facts.phase === 'sources') requireValue(facts.readingsTaken === 3, 'phase des sources avant les relevés');
    if (facts.phase === 'contact') requireValue(facts.sourceLocated, 'phase de contact avant localisation');
    if (facts.phase === 'exchange') requireValue(facts.testimonyStarted, 'phase d’échange sans lancement');
    if (facts.phase === 'assessment') requireValue(facts.testimonyResolved, 'bilan de l’échange prématuré');
  }
  requireValue(value.evidence.collected === facts.te01Acquired && value.evidence.scanProgress === Number(facts.te01Acquired) && !value.evidence.scanning, 'preuve générique contraire à TE01');
  fixed(value.evidence, template.evidence, Object.keys(template.evidence).filter(key => !['collected', 'scanProgress', 'scanning'].includes(key)), 'preuve générique');
  requireValue(value.stats.evidence === Number(facts.te01Acquired), 'décompte TE01');
  requireValue(value.stats.collateral === Number(!facts.lethAlive), 'pertes : seul Leth est un non-combattant individualisé ici');
  requireValue(value.stats.kills === facts.privateNeutralized, 'décompte des forces privées');
  requireValue(value.stats.ordersObeyed === Number(value.decision.choice === 'obey') && value.stats.ordersDefied === Number(value.decision.choice === 'defy'), 'décompte du choix');
  const expected = [
    ['listen', facts.readingsTaken, 3, facts.readingsTaken === 3],
    ['sources', Number(facts.emitterInspected) + Number(facts.translationInspected), 2, facts.manifestRead],
    ['contact', Number(facts.encounterResolved), 1, facts.encounterResolved],
    ['testimony', Number(facts.testimonyResolved), 1, facts.testimonyResolved],
    ['private', facts.privateNeutralized, 3, facts.privateNeutralized === 3],
    ['order', Number(facts.operationsResolved), 1, facts.operationsResolved],
    ['report', Number(facts.reportTransmitted), 1, facts.reportTransmitted],
    ['extract', Number(value.status === 'won'), 1, value.status === 'won'],
  ];
  requireValue(value.objectives.length === expected.length, 'liste des objectifs de la vallée');
  expected.forEach(([id, current, target, complete], index) => fixed(value.objectives[index], { id, current, target, complete }, ['id', 'current', 'target', 'complete'], 'objectif contraire aux actes'));
  requireValue(value.extraction.active === expected.slice(0, -1).every(([, , , complete]) => complete), 'sortie avant accomplissement');
  fixed(value.extraction, template.extraction, Object.keys(template.extraction).filter(key => key !== 'active'), 'point de sortie');
  if (value.status === 'won') requireValue(value.player.hull > 0 && value.objectives.every(goal => goal.complete) && Math.abs(value.player.x - value.extraction.x) < value.extraction.radius, 'victoire sans extraction');
  if (value.status === 'lost') requireValue(value.player.hull === 0, 'défaite sans perte terminale du marcheur');
}

export function validateVoiceReceipt(receipt, context) {
  validateContext(context); validateVoiceFacts(receipt, true);
  requireValue(receipt.plan === (receipt.choice === 'obey' ? 'seize' : 'restore'), 'conduite du rapport contraire au choix');
  const template = createGame({ missionId: 'MI11', walkerId: receipt.walkerId, campaignContext: context });
  keys(receipt.roster, [...Object.keys(template.voice), 'privateForces'], 'registre individuel de la voix');
  const scene = Object.fromEntries(Object.keys(template.voice).map(key => [key, receipt.roster[key]]));
  validateScene(scene, template.voice, receipt, template.mission.voice, { elapsed: receipt.elapsed,
    privateForces: receipt.roster.privateForces, initialForces: template.enemies,
    receipt: true, length: template.mission.length });
  requireValue(receipt.collateral === Number(!receipt.lethAlive) && receipt.kills === receipt.privateNeutralized && receipt.hull > 0, 'bilan contraire aux acteurs');
}

/** The next official checkpoint cannot erase acquired records or material losses. */
export function validateVoiceSortie(previous, current) {
  requireValue(previous?.missionId === 'MI11' && current.missionId === 'MI11', 'checkpoint hors sortie officielle');
  requireValue(current.walkerId === previous.walkerId && current.seed === previous.seed && current.difficultyId === previous.difficultyId, 'changement de sortie');
  requireValue(current.elapsed >= previous.elapsed, 'recul de sortie'); equal(current.campaign.context, previous.campaign.context, 'héritage modifié pendant la sortie');
  requireValue(previous.status === 'playing' || JSON.stringify(current) === JSON.stringify(previous), 'sortie perdue à recommencer explicitement');
  requireValue(!previous.decision.resolved || current.decision.resolved && current.decision.choice === previous.decision.choice, 'choix acquis annulé');
  for (const key of ['sourceLocated', 'ridgeSurveyed', 'emitterInspected', 'warningCopied', 'translationInspected', 'translationCopied',
    'encounterResolved', 'lethMet', 'consentAsked', 'consentGranted', 'consentRefused', 'consentWithdrawn', 'testimonyStarted',
    'testimonyRecorded', 'testimonyLost', 'testimonyResolved', 'te01Acquired', 'emitterSeized', 'emitterRestored', 'emitterLost',
    'operationsResolved', 'privateTriggered', 'privateReady', 'manifestRead', 'reportTransmitted']) requireValue(!previous.campaign[key] || current.campaign[key], `fait acquis annulé : ${key}`);
  const preserve = (before, after) => {
    if (Object.hasOwn(before, 'hp')) requireValue(after.hp <= before.hp, `intégrité restituée : ${before.id}`);
    for (const key of Object.keys(before).filter(key => key.endsWith('At') && !['startedAt', 'completedAt'].includes(key))) {
      if (before[key] !== null) requireValue(after[key] === before[key], `date acquise réécrite : ${before.id || 'alerte'}.${key}`);
      else if (after[key] !== null) requireValue(after[key] >= previous.elapsed - 1e-6, `nouvel acte antidaté : ${before.id || 'alerte'}.${key}`);
    }
  };
  const old = previous.voice, now = current.voice;
  const elapsed = current.elapsed - previous.elapsed, frame = .05 + 1e-6;
  const preserveWork = (before, after, duration) => {
    const sameWork = before.work === after.work;
    if (sameWork && before.completedAt !== null) {
      requireValue(after.startedAt === before.startedAt && after.completedAt === before.completedAt && after.progress === before.progress, `travail achevé réécrit : ${before.id}`);
      return;
    }
    if (after.startedAt !== null && (!sameWork || before.startedAt !== after.startedAt)) requireValue(after.startedAt >= previous.elapsed - 1e-6, `nouveau travail antidaté : ${before.id}`);
    if (after.completedAt !== null && before.completedAt !== after.completedAt) requireValue(after.completedAt >= previous.elapsed - 1e-6, `achèvement antidaté : ${before.id}`);
    const priorProgress = sameWork ? before.progress : 0;
    requireValue((after.progress - priorProgress) * duration <= elapsed + frame, `progression accélérée entre checkpoints : ${before.id}`);
  };
  for (const group of ['listening', 'nests']) old[group].forEach((part, index) => {
    const after = now[group][index]; preserve(part, after);
    if (group === 'listening') {
      preserveWork(part, after, current.mission.voice.listenTime);
      requireValue(!part.sampled || after.sampled && after.detected === part.detected && after.signal === part.signal && after.bearing === part.bearing, 'relevé acquis réécrit');
    } else requireValue(after.disturbance >= part.disturbance && after.lastStep >= part.lastStep, 'trace de ponte reculée');
  });
  for (const name of ['ridge', 'emitter', 'receiver', 'leth', 'report', 'alert']) preserve(old[name], now[name]);
  const settings = current.mission.voice;
  for (const [name, duration] of [['ridge', settings.surveyTime], ['receiver', settings.inspectTime], ['report', settings.reportTime],
    ['emitter', now.emitter.work === 'emitter' ? settings.inspectTime : now.emitter.work === 'seize' ? settings.seizeTime : settings.restoreTime],
    ['leth', now.leth.work === 'meet' ? settings.contactTime : now.leth.work === 'consent' ? settings.consentTime : settings.exchangeTime]]) preserveWork(old[name], now[name], duration);
  requireValue(now.noise.observedShots >= old.noise.observedShots, 'historique de bruit reculé');
  previous.enemies.forEach((unit, index) => requireValue(current.enemies[index].hp <= unit.hp, 'force privée ressuscitée ou réparée'));
}
