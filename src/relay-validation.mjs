/** MI12 reconstruction: validate physical state, receipts and monotone saved facts. */
import { createGame, terrainAt } from './simulation.mjs';
import { DIFFICULTIES } from './content.mjs';
import { relayDerivedFacts, relayReceiptRoster, RELAY_FACT_FLAGS, RELAY_FACT_COUNTS, relayObjectives } from './relay-simulation.mjs';

const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nearNumber = (a, b) => Math.abs(a - b) <= .051;
function requireValue(ok, label) { if (!ok) throw new Error(`Sauvegarde invalide : troisième relais — ${label}`); }
function number(v, low, high, label, integer = false) { requireValue(Number.isFinite(v) && v >= low && v <= high && (!integer || Number.isInteger(v)), label); }
function keys(v, shape, label) { requireValue(object(v) && same(Object.keys(v).sort(), Object.keys(shape).sort()), label); }
const CONTEXT_KEYS = ['voiceRecorded', 'voiceChoice', 'voiceTe01', 'lethAvailable', 'chemicalPt02'];

export function createRelayDossier() {
  return { plan: 'unselected', ...Object.fromEntries(RELAY_FACT_FLAGS.map(k => [k, false])),
    ...Object.fromEntries(RELAY_FACT_COUNTS.map(k => [k, 0])), roster: null };
}
export function relayContextFor(campaign) {
  const r = campaign.completed.MI11;
  return { voiceRecorded: Boolean(r), voiceChoice: r?.choice || 'none', voiceTe01: r?.te01Acquired || false,
    lethAvailable: r?.witnessAvailable || false, chemicalPt02: campaign.completed.MI10?.pt02Acquired || false };
}
function validateContext(context) {
  requireValue(object(context) && same(Object.keys(context).sort(), [...CONTEXT_KEYS].sort()), 'héritage incomplet');
  for (const k of CONTEXT_KEYS.filter(k => k !== 'voiceChoice')) requireValue(typeof context[k] === 'boolean', `héritage ${k}`);
  requireValue(['none', 'obey', 'defy'].includes(context.voiceChoice) && context.voiceRecorded === (context.voiceChoice !== 'none'), 'conduite de MI11 incohérente');
  requireValue(context.voiceRecorded || !context.voiceTe01 && !context.lethAvailable, 'faits de Leth sans rapport');
}
export function validateRelayFacts(f, finished = false) {
  for (const k of RELAY_FACT_FLAGS) requireValue(typeof f[k] === 'boolean', `fait ${k}`);
  for (const k of RELAY_FACT_COUNTS.filter(k => k !== 'ilanTrustDelta')) number(f[k], 0, 3, k, true);
  number(f.ilanTrustDelta, -8, 12, 'réaction d’Ilan', true);
  requireValue(['unselected', 'erase', 'preserve', 'open'].includes(f.plan), 'plan inconnu');
  requireValue(f.relaysTotal === 3 && f.relaysIntact + f.relaysLost === 3, 'relais non réconciliés');
  requireValue(f.relaysErased + f.relaysIsolated <= 3, 'relais effacé et isolé');
  requireValue(f.manifestRead === (f.inspectionsTaken === 3), 'relevé incomplet');
  requireValue(!f.windowOpened || f.manifestRead, 'fenêtre avant inspections');
  requireValue(!f.windowExpired || f.windowOpened, 'fenêtre expirée sans ouverture');
  requireValue(f.ordersCopied === f.industrialOrdersCopied && (!f.ordersCopied || f.copyStarted && f.windowOpened && !f.copyLost), 'copie inventée');
  requireValue(!f.copyStarted || f.windowOpened, 'copie avant fenêtre');
  requireValue(f.copyResolved === (f.ordersCopied || f.copyLost || f.windowExpired), 'sort de copie incomplet');
  requireValue(!f.privateReady || f.privateTriggered, 'Prétoire arrivé sans alerte');
  requireValue(!(f.praetorNeutralized || f.sensorDisabled || f.lockDisabled) || f.privateReady, 'Prétoire atteint avant arrivée');
  requireValue(f.publicRefusal === (f.plan === 'open') && f.refugeClosed === f.publicRefusal, 'conséquence de refus incohérente');
  requireValue(f.holtAlerted === (f.plan !== 'unselected' && (f.plan !== 'erase' || f.relaysLost > 0)), 'alerte de Holt inventée');
  const trust = f.plan === 'unselected' ? 0 : (f.ordersCopied ? 8 : -4) + (f.publicRefusal ? 4 : f.plan === 'erase' ? -4 : 0);
  requireValue(f.ilanTrustDelta === trust, 'réaction d’Ilan sans pièces observées');
  requireValue(!f.operationsResolved || f.plan !== 'unselected', 'opérations sans choix');
  requireValue(!f.reportTransmitted || f.manifestRead && f.copyResolved && f.operationsResolved && f.praetorNeutralized, 'rapport prématuré');
  if (finished) requireValue(f.reportTransmitted, 'rapport final absent');
}
export function relayDossierFromGame(game) {
  return { ...Object.fromEntries(Object.keys(createRelayDossier()).filter(k => k !== 'roster').map(k => [k, game.campaign[k]])), roster: relayReceiptRoster(game) };
}

function validateScene(scene, initial, facts, settings, elapsed, { player = null, difficulty = null } = {}) {
  keys(scene, initial, 'champs de scène');
  const stamp = (time, flag, label) => {
    if (!flag) requireValue(time === null, `date sans acte : ${label}`);
    else number(time, 0, elapsed + 1e-6, `date ${label}`);
  };
  const body = (p, q, movable = false) => {
    requireValue(object(p), `corps ${q.id}`);
    for (const key of ['id', 'w', 'h']) requireValue(p[key] === q[key], `géométrie ${q.id}.${key}`);
    if (!movable) { requireValue(p.x === q.x && p.y === q.y, `position ${q.id}`); requireValue(p.maxHp === q.maxHp, `capacité ${q.id}`); }
    else { number(p.x, 0, 6400, `position ${q.id}`); number(p.y, -1000, 2500, `hauteur ${q.id}`); number(p.maxHp, 1, 2000, `capacité ${q.id}`); }
    if (difficulty) requireValue(p.maxHp === q.maxHp, `difficulté ${q.id}`);
    number(p.hp, 0, p.maxHp, `intégrité ${q.id}`);
    requireValue(typeof p.destroyed === 'boolean' && p.destroyed === (p.hp === 0), `perte ${q.id}`);
    stamp(p.destroyedAt, p.destroyed, `perte ${q.id}`); number(p.flash, 0, .12 + 1e-8, `flash ${q.id}`);
  };
  const work = (p, duration, x, anchor = true, radius = settings.interactionRadius) => {
    requireValue(typeof p.working === 'boolean', `travail ${p.id}`); number(p.progress, 0, 1, `progression ${p.id}`);
    if (p.startedAt !== null) number(p.startedAt, 0, elapsed, `début ${p.id}`);
    if (p.completedAt !== null) { number(p.completedAt, 0, elapsed, `fin ${p.id}`); requireValue(p.startedAt !== null && !p.working && p.progress === 1 && p.completedAt + .051 >= p.startedAt + duration, `durée ${p.id}`); }
    if (p.working) {
      requireValue(p.startedAt !== null && p.completedAt === null, `travail sans début ${p.id}`);
      requireValue(p.progress * duration <= elapsed - p.startedAt + .051, `travail accéléré ${p.id}`);
      if (player && p.progress > 0) {
        requireValue(Math.abs(player.x - x) <= radius + .1, `travail hors portée ${p.id}`);
        if (anchor) requireValue(player.braced && !player.move && Math.abs(player.speed) < 3 && player.feet.every(f => f.contact), `travail sans ancrage ${p.id}`);
      }
    }
    if (p.startedAt === null) requireValue(!p.working && p.progress === 0 && p.completedAt === null, `progression sans travail ${p.id}`);
  };
  requireValue(Array.isArray(scene.relays) && scene.relays.length === 3, 'registre des relais');
  scene.relays.forEach((r, i) => {
    keys(r, initial.relays[i], 'champs du relais'); body(r, initial.relays[i]); requireValue(r.index === i + 1, 'ordre des relais');
    for (const key of ['inspected', 'erased', 'isolated']) { requireValue(typeof r[key] === 'boolean', key); stamp(r[`${key}At`], r[key], `${r.id}.${key}`); }
    requireValue(['none', 'inspect', 'erase', 'isolate'].includes(r.work), 'opération de relais inconnue');
    requireValue(!(r.erased && r.isolated), 'deux opérations contraires');
    requireValue(!r.erased || r.inspected && ['erase', 'preserve'].includes(facts.plan) && (facts.plan !== 'preserve' || r.index < 3), 'purge contraire au choix');
    requireValue(!r.isolated || r.inspected && ['preserve', 'open'].includes(facts.plan) && (facts.plan !== 'preserve' || r.index === 3), 'isolement contraire au choix');
    for (const key of ['erased', 'isolated']) if (r[key]) {
      requireValue(r[`${key}At`] >= r.inspectedAt + settings.operateTime - .051, 'opération avant inspection ou trop rapide');
      requireValue(r.destroyedAt === null || r[`${key}At`] <= r.destroyedAt, 'opération sur débris');
    }
    work(r, r.work === 'inspect' ? settings.inspectTime : settings.operateTime, r.x);
    if (r.inspected && r.work === 'inspect' && !r.destroyed) requireValue(r.inspectedAt === r.completedAt, 'inspection sans durée');
    if (r.erased && !r.destroyed) requireValue(r.erasedAt === r.completedAt && r.work === 'erase', 'purge sans durée');
    if (r.isolated && !r.destroyed) requireValue(r.isolatedAt === r.completedAt && r.work === 'isolate', 'isolement sans durée');
  });
  const w = scene.window, c = scene.copy;
  keys(w, initial.window, 'fenêtre'); for (const key of ['opened', 'expired']) requireValue(typeof w[key] === 'boolean', `fenêtre ${key}`);
  stamp(w.openedAt, w.opened, 'ouverture'); stamp(w.expiredAt, w.expired, 'fermeture');
  if (w.opened) {
    requireValue(scene.relays.every(r => r.inspected) && w.openedAt === Math.max(...scene.relays.map(r => r.inspectedAt)), 'ouverture sans trois inspections');
    requireValue(w.deadline === w.openedAt + settings.copyWindow, 'durée de fenêtre');
    requireValue(w.expired ? nearNumber(w.expiredAt, w.deadline) : elapsed < w.deadline + .051, 'fermeture contraire à l’horloge');
  } else requireValue(w.deadline === null, 'échéance sans fenêtre');
  keys(c, initial.copy, 'copie'); for (const key of ['id', 'x', 'y', 'w', 'h']) requireValue(c[key] === initial.copy[key], `terminal ${key}`);
  for (const key of ['started', 'copied', 'lost', 'expired']) requireValue(typeof c[key] === 'boolean', `copie ${key}`);
  stamp(c.firstStartedAt, c.started, 'premier lancement copie'); stamp(c.copiedAt, c.copied, 'copie acquise'); stamp(c.lostAt, c.lost, 'source perdue'); stamp(c.expiredAt, c.expired, 'copie expirée');
  work(c, settings.copyTime, c.x, true, settings.copyRadius);
  requireValue(!c.started || w.opened && c.firstStartedAt >= w.openedAt, 'copie avant ouverture');
  const source = scene.relays[2];
  if (c.copied) {
    requireValue(c.started && c.copiedAt === c.completedAt && c.copiedAt <= w.deadline + 1e-6 && !c.lost && !c.expired, 'copie incomplète ou hors fenêtre');
    requireValue([source.destroyedAt, source.erasedAt].every(t => t === null || c.copiedAt <= t), 'copie après perte originale');
  }
  if (c.lost) requireValue([source.destroyedAt, source.erasedAt].some(t => t !== null && t <= c.lostAt), 'source déclarée perdue sans perte');
  if (c.expired) requireValue(w.expired && c.expiredAt === w.expiredAt && !c.copied && !c.lost, 'copie expirée contradictoire');
  const a = scene.alert;
  keys(a, initial.alert, 'alerte'); requireValue(typeof a.triggered === 'boolean' && typeof a.ready === 'boolean', 'état alerte');
  stamp(a.triggeredAt, a.triggered, 'déclenchement'); stamp(a.readyAt, a.ready, 'arrivée');
  requireValue(['none', 'relay-damage', 'archive-window'].includes(a.reason), 'motif alerte');
  requireValue(a.triggered === (a.reason !== 'none'), 'alerte sans motif');
  number(a.elapsed, 0, settings.privateDelay, 'durée alerte');
  if (a.triggered) {
    requireValue(nearNumber(a.elapsed, Math.min(settings.privateDelay, elapsed - a.triggeredAt)), 'horloge alerte');
    if (a.ready) requireValue(nearNumber(a.readyAt, a.triggeredAt + settings.privateDelay), 'arrivée prématurée');
    else requireValue(elapsed < a.triggeredAt + settings.privateDelay + .051, 'arrivée manquante');
    if (a.reason === 'archive-window') requireValue(a.triggeredAt === w.openedAt, 'alerte sans ouverture');
    else requireValue(scene.relays.some(r => r.hp < r.maxHp), 'alerte sans atteinte');
  }
  const p = scene.praetor, q = initial.praetor;
  keys(p, q, 'Prétoire'); body(p, q, true); keys(p.sensor, q.sensor, 'capteur'); body(p.sensor, q.sensor, true); keys(p.hydraulicLock, q.hydraulicLock, 'verrou'); body(p.hydraulicLock, q.hydraulicLock, true);
  requireValue(p.designation === 'VE12' && p.name === 'Prétoire' && [-1, 1].includes(p.facing), 'identité Prétoire');
  requireValue(Object.values(DIFFICULTIES).some(level => p.maxHp === Math.round(700 * level.enemyHealth) && p.sensor.maxHp === Math.round(100 * level.enemyHealth) && p.hydraulicLock.maxHp === Math.round(125 * level.enemyHealth)), 'capacités du Prétoire incompatibles avec une même difficulté');
  requireValue(p.sensor.component === 'sensor' && p.hydraulicLock.component === 'lock', 'composants inversés');
  requireValue(p.x >= settings.praetorX - 170 && p.x <= settings.praetorX + 260, 'Prétoire hors corridor');
  requireValue(Math.abs(p.y - (terrainAt(p.x, 'PL03') - 78)) < 1e-6, 'Prétoire sans sol réel');
  requireValue(p.sensor.x === p.x + p.facing * 13 && p.sensor.y === p.y - 67 && p.hydraulicLock.x === p.x + p.facing * 106 && p.hydraulicLock.y === p.y + 51, 'composants détachés');
  requireValue(Array.isArray(p.feet) && p.feet.length === 4 && p.feet.every((f, i) => f.id === q.feet[i].id && f.x === p.x + [-64, -34, 34, 64][i] && f.contact === true && Math.abs(f.y - terrainAt(f.x, 'PL03')) < 1e-6), 'appuis Prétoire');
  requireValue(['dormant', 'guard', 'attack', 'recover', 'destroyed'].includes(p.phase) && typeof p.active === 'boolean' && p.grounded === true, 'état Prétoire');
  number(p.timer, 0, 3, 'récupération Prétoire'); number(p.telegraph, 0, 1, 'télégraphe'); number(p.speed, 0, 22, 'vitesse Prétoire'); number(p.shots, 0, 100000, 'tirs Prétoire', true); stamp(p.lastShotAt, p.shots > 0, 'dernier tir');
  if (!a.ready) requireValue(same(p, q), 'Prétoire actif avant arrivée');
  if (p.destroyed) requireValue(!p.active && p.phase === 'destroyed' && p.telegraph === 0 && p.speed === 0, 'Prétoire perdu encore actif');
  if (p.shots) requireValue(a.ready && p.lastShotAt >= a.readyAt + 1.5 - .051, 'tir avant arrivée');
  keys(scene.orders, initial.orders, 'poste ordres'); requireValue(same(scene.orders, initial.orders), 'poste ordre déplacé');
  const r = scene.report;
  keys(r, initial.report, 'poste rapport'); for (const key of ['id', 'x', 'y', 'w', 'h']) requireValue(r[key] === initial.report[key], `rapport ${key}`);
  work(r, settings.reportTime, r.x, false); stamp(r.transmittedAt, r.transmitted, 'rapport');
  if (r.transmitted) {
    const operationTimes = scene.relays.map(relay => Math.min(...[relay.erasedAt, relay.isolatedAt, relay.destroyedAt].filter(t => t !== null)));
    const copyResolvedAt = Math.min(...[c.copiedAt, c.lostAt, c.expiredAt].filter(t => t !== null));
    requireValue(r.transmittedAt === r.completedAt && facts.operationsResolved && facts.copyResolved && p.destroyed && r.startedAt >= Math.max(p.destroyedAt, copyResolvedAt, ...operationTimes), 'rapport sans actes');
  }
  const derived = relayDerivedFacts({ relay: scene, decision: { resolved: facts.plan !== 'unselected', choice: facts.plan === 'erase' ? 'obey' : facts.plan === 'preserve' ? 'defy' : facts.plan === 'open' ? 'refuse' : null } });
  for (const [key, value] of Object.entries(derived)) requireValue(facts[key] === value, `fait contraire aux corps : ${key}`);
}

export function validateRelayMission(value, template) {
  const f = value.campaign;
  requireValue(object(f) && f.missionId === 'MI12' && object(value.relay), 'scène MI12 absente');
  validateContext(f.context); validateRelayFacts(f, value.status === 'won');
  requireValue(f.plan === (value.decision.choice === null ? 'unselected' : value.decision.choice === 'obey' ? 'erase' : value.decision.choice === 'defy' ? 'preserve' : 'open'), 'choix et plan');
  requireValue(!value.decision.active && !value.decision.resolved || f.manifestRead && f.copyResolved, 'choix avant relevés et copie/perte');
  validateScene(value.relay, template.relay, f, value.mission.relay, value.elapsed, { player: value.player, difficulty: value.difficultyId });
  requireValue(['inspection', 'copy', 'decision', 'operations', 'extraction', 'complete'].includes(f.phase), 'phase inconnue');
  if (value.status === 'won') requireValue(f.phase === 'complete', 'phase finale');
  else if (f.reportTransmitted) requireValue(f.phase === 'extraction', 'phase rapport');
  else if (value.decision.resolved) requireValue(f.phase === 'operations', 'phase opérations');
  else if (value.decision.active) requireValue(f.phase === 'decision', 'phase choix');
  requireValue(value.evidence.collected === f.ordersCopied && value.evidence.scanProgress === Number(f.ordersCopied) && !value.evidence.scanning, 'archive générique');
  requireValue(value.stats.evidence === Number(f.ordersCopied) && value.stats.kills === Number(f.praetorNeutralized) && value.stats.collateral === 0, 'statistiques MI12');
  requireValue(value.stats.ordersObeyed === Number(value.decision.choice === 'obey') && value.stats.ordersDefied === Number(['defy', 'refuse'].includes(value.decision.choice)), 'choix comptés');
  const expected = structuredClone(value); expected.objectives = relayObjectives(expected);
  requireValue(same(value.objectives, expected.objectives) && value.extraction.active === expected.extraction.active, 'objectifs contraires aux actes');
  if (value.status === 'won') requireValue(value.player.hull > 0 && value.extraction.active && Math.abs(value.player.x - value.extraction.x) < value.extraction.radius, 'victoire sans extraction');
  if (value.status === 'lost') requireValue(value.player.hull === 0, 'défaite sans perte');
}
export function validateRelayReceipt(receipt, context) {
  validateContext(context); validateRelayFacts(receipt, true);
  requireValue(receipt.plan === (receipt.choice === 'obey' ? 'erase' : receipt.choice === 'defy' ? 'preserve' : 'open'), 'conduite rapport');
  const template = createGame({ missionId: 'MI12', walkerId: receipt.walkerId, campaignContext: context });
  validateScene(receipt.roster, template.relay, receipt, template.mission.relay, receipt.elapsed);
  requireValue(receipt.kills === Number(receipt.praetorNeutralized) && receipt.collateral === 0 && receipt.hull > 0, 'statistiques rapport');
}
export function validateRelaySortie(previous, current) {
  requireValue(previous?.missionId === 'MI12' && current.missionId === 'MI12', 'sortie MI12');
  requireValue(current.walkerId === previous.walkerId && current.seed === previous.seed && current.difficultyId === previous.difficultyId, 'identité sortie');
  requireValue(current.elapsed >= previous.elapsed && same(current.campaign.context, previous.campaign.context), 'recul ou héritage changé');
  requireValue(previous.status === 'playing' || same(previous, current), 'sortie terminale réouverte');
  requireValue(!previous.decision.resolved || current.decision.resolved && current.decision.choice === previous.decision.choice, 'choix effacé');
  for (const k of RELAY_FACT_FLAGS.filter(k => !['holtAlerted'].includes(k))) requireValue(!previous.campaign[k] || current.campaign[k], `fait acquis annulé ${k}`);
  const preserve = (a, b, duration = null) => {
    if ('hp' in a) requireValue(b.hp <= a.hp && b.maxHp === a.maxHp, `intégrité restituée ${a.id}`);
    for (const key of Object.keys(a).filter(k => k.endsWith('At') && !['startedAt', 'completedAt', 'lastShotAt'].includes(k))) {
      if (a[key] !== null) requireValue(a[key] === b[key], `date réécrite ${a.id || 'fenêtre'}.${key}`);
      else if (b[key] !== null) requireValue(b[key] >= previous.elapsed - .051, `acte antidaté ${key}`);
    }
    if (duration !== null) {
      const sameWork = a.work === b.work;
      if (b.startedAt !== null && (!sameWork || b.startedAt !== a.startedAt)) requireValue(b.startedAt >= previous.elapsed - .051, 'nouveau travail antidaté');
      requireValue((b.progress - (sameWork ? a.progress : 0)) * duration <= current.elapsed - previous.elapsed + .051, 'travail accéléré entre checkpoints');
    }
  };
  previous.relay.relays.forEach((r, i) => preserve(r, current.relay.relays[i], current.relay.relays[i].work === 'inspect' ? current.mission.relay.inspectTime : current.mission.relay.operateTime));
  for (const key of ['window', 'alert']) preserve(previous.relay[key], current.relay[key]);
  preserve(previous.relay.copy, current.relay.copy, current.mission.relay.copyTime);
  preserve(previous.relay.report, current.relay.report, current.mission.relay.reportTime);
  preserve(previous.relay.praetor, current.relay.praetor);
  for (const key of ['sensor', 'hydraulicLock']) preserve(previous.relay.praetor[key], current.relay.praetor[key]);
  requireValue(current.relay.praetor.shots >= previous.relay.praetor.shots, 'tirs annulés');
  if (previous.relay.praetor.lastShotAt !== null) requireValue(current.relay.praetor.lastShotAt >= previous.relay.praetor.lastShotAt, 'date du dernier tir reculée');
}
