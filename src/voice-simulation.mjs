/** MI11 — physical listening, a local nesting site and a consenting witness. */
import { VOICE_TRANSLATION_PAIRS } from './content.mjs';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const copy = value => structuredClone(value);
const job = () => ({ working: false, progress: 0, startedAt: null, completedAt: null });
const privateUnits = s => s.enemies.filter(enemy => enemy.id.startsWith('voice-private-'));
const near = (s, x, radius = s.mission.voice.interactionRadius) => Math.abs(s.player.x - x) <= radius;
const anchored = s => s.player.braced && !s.player.move && Math.abs(s.player.speed) < 3 && s.player.feet.every(foot => foot.contact);

export function voiceContext(previous = {}) {
  return { chemicalRecorded: previous.chemicalRecorded === true,
    chemicalChoice: ['obey', 'defy'].includes(previous.chemicalChoice) ? previous.chemicalChoice : 'none',
    chemicalPt02: previous.chemicalPt02 === true,
    chemicalVillageHabitable: previous.chemicalVillageHabitable === true,
    chemicalWaterRestored: previous.chemicalWaterRestored === true };
}

export function createVoiceMission(s, previous, runtime) {
  const c = s.mission.voice, ground = x => runtime.terrainAt(x, s.planetId);
  const body = (id, x, w, h, hp) => ({ id, x, y: ground(x) - h / 2, w, h,
    hp, maxHp: hp, destroyed: false, destroyedAt: null, flash: 0 });
  const station = (id, x, w = 54, h = 60) => ({ id, x, y: ground(x) - h / 2, w, h, ...job() });
  s.voice = {
    listening: c.listeningXs.map((x, i) => ({ ...body(`voice-listening-${i + 1}`, x, 54, 54, 150),
      sampled: false, detected: false, signal: 0, bearing: 0, sampledAt: null, ...job() })),
    ridge: { ...body('voice-root-passage', (c.ridgeStart + c.ridgeEnd) / 2, c.ridgeEnd - c.ridgeStart, 24, 650),
      controlX: c.surveyX, surveyed: false, surveyedAt: null, ...job() },
    nests: c.nestXs.map((x, i) => ({ ...body(`voice-nest-${i + 1}`, x, 100, 26, 120), damagedAt: null, disturbance: 0, lastStep: -1 })),
    emitter: { ...body('voice-emitter', c.emitterX, 82, 112, 420), inspected: false, inspectedAt: null,
      warningCopied: false, copiedAt: null, seized: false, seizedAt: null, restored: false, restoredAt: null,
      work: 'none', ...job() },
    receiver: { ...body('voice-imperial-translation', c.receiverX, 66, 76, 260),
      inspected: false, inspectedAt: null, translationCopied: false, copiedAt: null, ...job() },
    leth: { ...body('voice-leth', c.lethX, 36, 76, 420), characterId: 'PN06', name: 'Leth de la Septième Rive', alive: true,
      encountered: false, encounteredAt: null, met: false, metAt: null,
      consentAsked: false, consent: false, consentAt: null, refused: false, withdrawn: false, withdrawnAt: null,
      testimonyStarted: false, firstStartedAt: null, testimonyRecorded: false, testimonyAt: null,
      testimonyLost: false, lostAt: null, publicConsent: false, recruited: false, work: 'none', ...job() },
    orders: { id: 'voice-orders', x: c.ordersX, y: ground(c.ordersX) - 35, w: 60, h: 70 },
    report: { ...station('voice-report', c.reportX), transmitted: false, transmittedAt: null },
    alert: { triggered: false, reason: 'none', triggeredAt: null, elapsed: 0, ready: false, readyAt: null },
    noise: { until: 0, observedShots: 0 },
  };
  s.voice.ridge.y = ground(s.voice.ridge.x) - c.ridgeRise - s.voice.ridge.h / 2;
  s.campaign = { missionId: 'MI11', phase: 'listening', context: voiceContext(previous),
    tutorial: { stepped: false, braced: false }, ...voiceDerivedFacts(s) };
  s.evidence.scanning = false; s.evidence.scanTime = c.exchangeTime;
}

/** Pure derivation; receipt validation can use this without advancing the scene. */
export function voiceDerivedFacts(s) {
  const d = s.voice, l = d.leth;
  const plan = s.decision.resolved ? s.decision.choice === 'obey' ? 'seize' : 'restore' : 'unselected';
  const readingsTaken = d.listening.filter(point => point.sampled).length;
  const signalsRecorded = d.listening.filter(point => point.sampled && point.detected).length;
  const sourceLocated = signalsRecorded === 3 || d.emitter.inspected;
  const nestsIntact = d.nests.filter(nest => !nest.destroyed && nest.hp === nest.maxHp).length;
  const nestsLost = d.nests.filter(nest => nest.destroyed).length;
  const emitterOnline = d.emitter.restored && !d.emitter.destroyed && !d.emitter.seized;
  const testimonyResolved = l.testimonyRecorded || l.testimonyLost || l.refused || l.withdrawn;
  const te01Acquired = signalsRecorded === 3 && d.emitter.warningCopied && d.receiver.translationCopied && l.testimonyRecorded;
  const witnessAvailable = l.met && l.alive && l.consent && !l.withdrawn;
  const trust = l.met && l.alive ? clamp(nestsIntact * 10 + (l.testimonyRecorded ? 20 : 0) + (emitterOnline ? 20 : 0)
    - (d.emitter.seized ? 15 : 0) - (l.withdrawn ? 30 : 0), 0, 70) : 0;
  return { plan, readingsTaken, signalsRecorded, sourceLocated, ridgeSurveyed: d.ridge.surveyed,
    ridgeIntact: !d.ridge.destroyed, nestsTotal: 3, nestsIntact, nestsDamaged: 3 - nestsIntact - nestsLost, nestsLost,
    nestDisturbance: d.nests.reduce((total, nest) => total + nest.disturbance, 0),
    emitterInspected: d.emitter.inspected, warningCopied: d.emitter.warningCopied,
    translationInspected: d.receiver.inspected, translationCopied: d.receiver.translationCopied,
    encounterResolved: l.encountered, lethMet: l.met, lethAlive: l.alive,
    consentAsked: l.consentAsked, consentGranted: l.consent, consentRefused: l.refused, consentWithdrawn: l.withdrawn,
    testimonyStarted: l.testimonyStarted, testimonyRecorded: l.testimonyRecorded, testimonyLost: l.testimonyLost,
    testimonyResolved, te01Acquired, witnessAvailable, publicConsent: l.publicConsent, recruited: l.recruited,
    lethTrust: trust, alliancePossible: witnessAvailable && te01Acquired && emitterOnline && nestsIntact === 3,
    emitterSeized: d.emitter.seized, emitterRestored: d.emitter.restored, emitterOnline,
    emitterLost: d.emitter.destroyed,
    operationsResolved: s.decision.resolved && (d.emitter.destroyed || (plan === 'seize' ? d.emitter.seized : d.emitter.restored)),
    privateTriggered: d.alert.triggered, privateReady: d.alert.ready,
    privateNeutralized: privateUnits(s).filter(enemy => enemy.dead).length,
    manifestRead: d.emitter.inspected && d.receiver.inspected,
    reportTransmitted: d.report.transmitted };
}

export function refreshVoiceFacts(s) {
  Object.assign(s.campaign, voiceDerivedFacts(s));
  if (s.decision.active || s.decision.resolved) s.decision.body = voiceDecisionBody(s);
}

export function voiceReceiptRoster(s) {
  return copy({ ...s.voice, privateForces: privateUnits(s).map(enemy => ({ id: enemy.id, type: enemy.type,
    hp: enemy.hp, maxHp: enemy.maxHp, dead: enemy.dead })) });
}

export function voiceSurface(s, x, groundY) {
  const settings = s.mission.voice, ridge = s.voice.ridge;
  // Survey selects an existing upper trail. Its ramps, not a success flag,
  // provide the surface used by every planted and swinging foot.
  const ramp = Math.min((x - settings.ridgeStart) / 120, (settings.ridgeEnd - x) / 120, 1);
  const rise = ridge.surveyed && !ridge.destroyed ? settings.ridgeRise * clamp(ramp, 0, 1) : 0;
  return { groundY: groundY - rise, rise, traction: rise ? .88 : 1, ridgeId: rise ? ridge.id : null };
}

export function voiceSolids(s) {
  const d = s.voice;
  return [...d.listening, d.ridge, ...d.nests, ...(!d.emitter.seized ? [d.emitter] : []), d.receiver, d.leth];
}

function triggerPrivate(s, reason, runtime) {
  const alert = s.voice.alert;
  if (alert.triggered) return;
  Object.assign(alert, { triggered: true, reason, triggeredAt: s.elapsed, elapsed: 0 });
  runtime.emit(s, 'radio', 'Tess : « Trois signatures privées convergent sur l’émetteur. Six secondes avant leur entrée. Elles visent le poste d’échange : garde une ligne de tir sûre. »');
}

function loseTestimony(s, runtime) {
  const l = s.voice.leth;
  if (l.testimonyRecorded || l.testimonyLost) return;
  l.testimonyLost = true; l.lostAt = s.elapsed; l.working = false;
  if (l.completedAt === null) { l.progress = 0; l.startedAt = null; }
  runtime.emit(s, 'radio', 'Sami : « Leth est perdu avant la fin de l’échange. Les copies déjà faites restent à bord ; aucun témoignage achevé ne sera ajouté. »');
}

export function hitVoicePart(s, part, damage, runtime) {
  if (!part || part.destroyed || part.seized || !(damage > 0)) return;
  part.hp = Math.max(0, part.hp - damage); part.flash = .12;
  if (s.voice.nests.includes(part)) part.damagedAt ??= s.elapsed;
  if (part.hp <= 0) {
    part.destroyed = true; part.destroyedAt = s.elapsed;
    if (Object.hasOwn(part, 'working')) part.working = false;
    if (part === s.voice.leth) {
      part.alive = false; s.stats.collateral++; loseTestimony(s, runtime); triggerPrivate(s, 'witness-loss', runtime);
    }
    if (part === s.voice.emitter) triggerPrivate(s, 'emitter-loss', runtime);
  }
  const l = s.voice.leth;
  if (s.voice.nests.includes(part) && l.alive && l.consent && !l.withdrawn) {
    l.withdrawn = true; l.withdrawnAt = s.elapsed; l.working = false;
    if (l.completedAt === null) { l.progress = 0; l.startedAt = null; }
    runtime.emit(s, 'radio', l.testimonyRecorded
      ? 'Leth : « Vous avez atteint le site après notre échange. Le dossier garde ma parole déjà enregistrée, mais je ne vous accorde plus ma coopération. »'
      : 'Leth : « Vous atteignez le site que je vous ai montré. J’arrête cet enregistrement. Conservez ce que vous avez relevé, sans parler à ma place. »');
  }
  refreshVoiceFacts(s);
}

export function voiceFootfall(s, foot, runtime) {
  const d = s.voice;
  d.noise.until = Math.max(d.noise.until, s.elapsed + 1.2);
  for (const nest of d.nests) {
    if (nest.destroyed || nest.lastStep === s.stats.steps || Math.abs(foot.x - nest.x) > nest.w / 2 + 45) continue;
    nest.lastStep = s.stats.steps; nest.disturbance++;
    const clearance = runtime.terrainAt(foot.x, s.planetId) - foot.y;
    if (foot.contact && Math.abs(foot.x - nest.x) <= nest.w / 2 + 12 && clearance < 28) {
      hitVoicePart(s, nest, Math.max(14, s.walker.weight * .18), runtime);
      runtime.emit(s, 'radio', 'Tess : « Appui dans la ponte. La corniche repérée devait porter la machine au-dessus ; ce dommage ne s’effacera pas au rapport. »');
    }
  }
}

export function voiceDecisionBody(s) {
  const c = voiceDerivedFacts(s);
  return `${c.readingsTaken} relevés de sol ; ${c.signalsRecorded} signaux exploitables. ${c.warningCopied && c.translationCopied ? 'L’avis d’évacuation et sa traduction impériale sont copiés séparément.' : 'Une ou plusieurs sources n’ont pas pu être copiées.'} ${c.testimonyRecorded ? 'Leth a accepté et achevé un enregistrement privé. Il n’a autorisé aucune diffusion publique.' : c.consentRefused || c.consentWithdrawn ? 'Leth a refusé ou interrompu l’enregistrement.' : 'Aucun témoignage achevé de Leth n’est conservé.'} ${c.nestsIntact} sites de ponte intacts sur trois. La saisie de l’émetteur ou sa remise en service exige une intervention sur place ; aucune de ces réponses ne recrute Leth.`;
}

function start(s, part, work = null) {
  if (part.working) return false;
  part.working = true; part.progress = 0; part.startedAt = s.elapsed; part.completedAt = null;
  if (work) part.work = work;
  return true;
}

function reportReady(s) {
  const c = voiceDerivedFacts(s);
  return c.readingsTaken === 3 && c.manifestRead && c.encounterResolved && c.testimonyResolved
    && c.operationsResolved && c.privateNeutralized === 3;
}

function jobs(s) {
  const d = s.voice, c = voiceDerivedFacts(s), result = [];
  const add = (kind, part, x, label) => result.push({ kind, part, x, label });
  for (const point of d.listening) if (!point.sampled) add('listen', point, point.x,
    point.destroyed ? 'Constater la perte du point d’écoute — ancrage requis' : 'Écouter les vibrations — ancrage, appuis immobiles et silence');
  if (!d.ridge.surveyed && !d.ridge.destroyed) add('survey', d.ridge, d.ridge.controlX, 'Relever la corniche au-dessus du site de ponte — ancrage requis');
  if (c.readingsTaken === 3 && !d.receiver.inspected) add('receiver', d.receiver, d.receiver.x,
    d.receiver.destroyed ? 'Constater la perte de la traduction impériale' : 'Copier la traduction conservée au récepteur impérial');
  if (c.readingsTaken === 3 && !d.emitter.inspected) add('emitter', d.emitter, d.emitter.x,
    d.emitter.destroyed ? 'Identifier les ruines de l’émetteur — avis perdu' : 'Identifier l’émetteur et copier l’avis d’évacuation');
  if (c.sourceLocated && !d.leth.encountered) add('meet', d.leth, d.leth.x,
    d.leth.alive ? 'Établir le contact avec Leth de la Septième Rive' : 'Constater la perte de l’interprète');
  if (d.leth.met && d.leth.alive && c.manifestRead && !d.leth.consentAsked) add('consent', d.leth, d.leth.x, 'Demander l’accord de Leth pour un enregistrement privé');
  if (d.leth.consent && d.leth.alive && !c.testimonyResolved) add('testimony', d.leth, d.leth.x, 'Recueillir l’échange — rester à portée et protéger Leth');
  if (c.manifestRead && c.encounterResolved && c.testimonyResolved && !s.decision.resolved) add('orders', d.orders, d.orders.x, 'Établir le relevé puis choisir le sort de l’émetteur');
  if (s.decision.resolved && !c.operationsResolved) add(c.plan, d.emitter, d.emitter.x,
    c.plan === 'seize' ? 'Démonter et embarquer l’émetteur — ancrage requis' : 'Rétablir l’émetteur pour les avis d’évacuation — ancrage requis');
  if (reportReady(s) && !d.report.transmitted) add('report', d.report, d.report.x, 'Transmettre le bilan et la provenance des pièces conservées');
  return result;
}

export function voiceInteraction(s) {
  const current = jobs(s).filter(item => near(s, item.x)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
  if (current) return current.part.working ? `Travail en cours — ${Math.floor(current.part.progress * 100)} %` : `E — ${current.label}`;
  const d = s.voice, c = voiceDerivedFacts(s);
  if (d.leth.working && d.leth.work === 'testimony' && near(s, d.leth.x, s.mission.voice.exchangeRadius)) return `Échange enregistré — ${Math.floor(d.leth.progress * 100)} % ; protéger Leth`;
  if (near(s, d.orders.x) && !s.decision.resolved) return 'Comparer les deux sources puis recueillir l’échange ou consigner son impossibilité';
  if (near(s, d.report.x) && !d.report.transmitted) return 'Achever les relevés, la défense et l’intervention sur l’émetteur';
  if (near(s, d.leth.x) && c.testimonyRecorded) return 'Enregistrement privé conservé — aucune autorisation de diffusion publique';
  return '';
}

export function interactVoiceMission(s, runtime) {
  refreshVoiceFacts(s);
  const current = jobs(s).filter(item => near(s, item.x)).sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
  if (!current || current.part.working) return false;
  if (current.kind === 'orders') {
    s.campaign.phase = 'decision'; s.decision.body = voiceDecisionBody(s); s.decision.active = true;
    return true;
  }
  if (['listen', 'survey', 'seize', 'restore'].includes(current.kind) && !anchored(s)) return false;
  if (current.kind === 'listen' && s.elapsed < s.voice.noise.until) return false;
  if (current.kind === 'testimony') {
    current.part.testimonyStarted = true; current.part.firstStartedAt ??= s.elapsed;
  }
  if (!s.decision.resolved) s.campaign.phase = current.kind === 'listen' ? 'listening'
    : current.kind === 'survey' ? 'approach' : ['receiver', 'emitter'].includes(current.kind) ? 'sources'
      : current.kind === 'testimony' ? 'exchange' : 'contact';
  return start(s, current.part, current.part === s.voice.leth ? current.kind : current.part === s.voice.emitter ? current.kind : null);
}

export function chooseVoiceMission(s, choice, runtime) {
  s.campaign.phase = 'operations';
  if (choice === 'obey') s.stats.ordersObeyed++; else s.stats.ordersDefied++;
  runtime.emit(s, 'radio', choice === 'obey'
    ? 'Sera : « L’ordre porte sur l’émetteur. Nous le démonterons sur place. Le témoignage, ses limites et le sort du site restent au dossier. »'
    : 'Sera : « Les avis doivent continuer à passer. Remettons l’émetteur en service ; le relevé conserve les deux versions et l’accord exact de Leth. »');
  refreshVoiceFacts(s);
}

function advance(s, part, dt, duration, valid, complete) {
  if (!part.working) return;
  if (!valid) { part.working = false; part.progress = 0; part.startedAt = null; return; }
  part.progress = Math.min(1, part.progress + dt / duration);
  if (part.progress >= 1 - 1e-10) {
    part.progress = 1; part.working = false; part.completedAt = s.elapsed; complete();
  }
}

export function updateVoiceMission(s, dt, runtime) {
  const d = s.voice, settings = s.mission.voice, l = d.leth, stable = anchored(s);
  for (const part of voiceSolids(s)) part.flash = Math.max(0, part.flash - dt);
  if (s.stats.shots !== d.noise.observedShots) { d.noise.observedShots = s.stats.shots; d.noise.until = Math.max(d.noise.until, s.elapsed + 1.5); }
  for (const point of d.listening) advance(s, point, dt, settings.listenTime,
    stable && near(s, point.x) && s.elapsed >= d.noise.until, () => {
      point.sampled = true; point.sampledAt = s.elapsed;
      point.detected = !point.destroyed && !d.emitter.destroyed && !d.emitter.seized;
      point.signal = point.detected ? clamp(1 - Math.abs(point.x - d.emitter.x) / s.mission.length, .05, 1) : 0;
      point.bearing = point.detected ? Math.sign(d.emitter.x - point.x) : 0;
      runtime.emit(s, 'objective', point.detected ? 'Signal de sol relevé à l’arrêt. Tess rapproche sa direction des autres écoutes.' : 'Point d’écoute ou source perdu : absence de signal consignée.');
    });
  advance(s, d.ridge, dt, settings.surveyTime, stable && near(s, d.ridge.controlX) && !d.ridge.destroyed,
    () => { d.ridge.surveyed = true; d.ridge.surveyedAt = s.elapsed; runtime.emit(s, 'radio', 'Tess : « La corniche porte au-dessus de la ponte. Les pieds suivront ses rampes ; des tirs peuvent encore la briser. »'); });
  advance(s, d.receiver, dt, settings.inspectTime, near(s, d.receiver.x), () => {
    d.receiver.inspected = true; d.receiver.inspectedAt = s.elapsed;
    if (!d.receiver.destroyed) { d.receiver.translationCopied = true; d.receiver.copiedAt = s.elapsed;
      runtime.emit(s, 'radio', `Sami : « Le récepteur impérial conserve : ${VOICE_TRANSLATION_PAIRS.map(pair => pair.imperial).join(' ')} Je copie cette version avec sa provenance ; Leth devra expliquer le sens de l’avis original. »`); }
  });
  advance(s, d.emitter, dt, d.emitter.work === 'emitter' ? settings.inspectTime : d.emitter.work === 'seize' ? settings.seizeTime : settings.restoreTime,
    near(s, d.emitter.x) && (d.emitter.work === 'emitter' || stable && !d.emitter.destroyed), () => {
      if (d.emitter.work === 'emitter') {
        d.emitter.inspected = true; d.emitter.inspectedAt = s.elapsed;
        if (!d.emitter.destroyed) { d.emitter.warningCopied = true; d.emitter.copiedAt = s.elapsed;
          runtime.emit(s, 'radio', 'Sami : « L’avis de la Septième Rive est conservé. Leth devra expliquer ses termes ; la copie seule ne vaut pas son témoignage. »'); }
      } else if (d.emitter.work === 'seize') { d.emitter.seized = true; d.emitter.seizedAt = s.elapsed; }
      else { d.emitter.restored = true; d.emitter.restoredAt = s.elapsed; }
    });
  const duration = l.work === 'meet' ? settings.contactTime : l.work === 'consent' ? settings.consentTime : settings.exchangeTime;
  const valid = l.work === 'testimony' ? l.alive && l.consent && !l.withdrawn && near(s, l.x, settings.exchangeRadius)
    : near(s, l.x) && (l.work === 'meet' || l.alive);
  advance(s, l, dt, duration, valid, () => {
    if (l.work === 'meet') {
      l.encountered = true; l.encounteredAt = s.elapsed;
      if (l.alive) {
        l.met = true; l.metAt = s.elapsed;
        runtime.emit(s, 'radio', 'Leth : « Je suis Leth, de la Septième Rive. J’envoie les avis de départ des cultures. Je ne parle pas au nom de toutes les cités. Écartez vos appuis de la ponte. »');
      } else loseTestimony(s, runtime);
      triggerPrivate(s, 'contact', runtime);
    } else if (l.work === 'consent') {
      l.consentAsked = true; l.consentAt = s.elapsed;
      l.consent = d.nests.every(nest => nest.hp === nest.maxHp && !nest.destroyed);
      l.refused = !l.consent;
      if (l.refused) s.campaign.phase = 'assessment';
      runtime.emit(s, 'radio', l.consent
        ? 'Leth : « Vous pouvez enregistrer cette explication pour votre dossier. Je n’autorise pas sa diffusion. Gardons les deux formulations ; protégez ce poste le temps de les reprendre ensemble. »'
        : 'Leth : « Le site a été abîmé sous vos armes ou vos pieds. Je refuse cet enregistrement. Vos copies ne vous donnent pas ma voix. »');
    } else {
      l.testimonyRecorded = true; l.testimonyAt = s.elapsed;
      s.campaign.phase = 'assessment';
      runtime.emit(s, 'radio', `Leth : « Voici le sens des trois avis : ${VOICE_TRANSLATION_PAIRS.map(pair => pair.leth).join(' ')} La version reçue inverse ces consignes. Mon accord porte sur ce dossier privé. »`);
      runtime.emit(s, 'objective', 'Échange privé enregistré avec l’accord de Leth. Disponibilité du témoin et droit de diffusion restent deux questions distinctes.');
    }
  });
  if (!l.alive) loseTestimony(s, runtime);
  if (d.alert.triggered && !d.alert.ready) {
    d.alert.elapsed = Math.max(0, s.elapsed - d.alert.triggeredAt);
    if (d.alert.elapsed >= settings.privateDelay - 1e-9) { d.alert.elapsed = settings.privateDelay; d.alert.ready = true; d.alert.readyAt = s.elapsed; }
  }
  advance(s, d.report, dt, settings.reportTime, near(s, d.report.x) && reportReady(s), () => {
    d.report.transmitted = true; d.report.transmittedAt = s.elapsed; s.campaign.phase = 'extraction';
    runtime.emit(s, 'objective', 'Bilan transmis : sources conservées ou perdues, état de la ponte, accord de Leth et opération réelle sur l’émetteur.');
  });
  refreshVoiceFacts(s);
  if (s.campaign.te01Acquired && !s.evidence.collected) {
    s.evidence.collected = true; s.evidence.scanProgress = 1; s.stats.evidence++; s.stats.score += 400;
    runtime.emit(s, 'objective', 'TE01 conservée : avis, traduction impériale et échange privé achevé. Cette pièce n’établit pas la chaîne des commandes industrielles.');
  }
  s.evidence.scanning = false;
}

export function voiceObjectives(s) {
  const c = s.campaign;
  const goals = [
    { id: 'listen', label: 'Relever les trois points de vibration ou constater leur perte', current: c.readingsTaken, target: 3, complete: c.readingsTaken === 3 },
    { id: 'sources', label: 'Comparer l’avis original et la traduction impériale', current: Number(c.emitterInspected) + Number(c.translationInspected), target: 2, complete: c.manifestRead },
    { id: 'contact', label: c.lethAlive ? 'Rencontrer Leth et demander son accord' : 'Consigner la perte de Leth', current: Number(c.encounterResolved), target: 1, complete: c.encounterResolved },
    { id: 'testimony', label: c.testimonyRecorded ? 'Échange privé achevé et conservé' : c.consentRefused || c.consentWithdrawn ? 'Refus ou interruption de Leth consigné' : c.testimonyLost ? 'Témoignage perdu avant achèvement' : 'Protéger Leth pendant l’échange consenti', current: Number(c.testimonyResolved), target: 1, complete: c.testimonyResolved },
    { id: 'private', label: 'Neutraliser les forces privées arrivées', current: c.privateNeutralized, target: 3, complete: c.privateNeutralized === 3 },
    { id: 'order', label: 'Choisir puis opérer l’émetteur sur place', current: Number(c.operationsResolved), target: 1, complete: c.operationsResolved },
    { id: 'report', label: 'Transmettre le bilan du site et des pièces conservées', current: Number(c.reportTransmitted), target: 1, complete: c.reportTransmitted },
  ];
  s.extraction.active = goals.every(goal => goal.complete);
  goals.push({ id: 'extract', label: 'Rejoindre la rampe de retour', current: Number(s.status === 'won'), target: 1, complete: s.status === 'won' });
  return goals;
}
