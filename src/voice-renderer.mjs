/** MI11 scene drawing. All positions, work and permissions come from the scene. */
import { terrainAt, voiceSurfaceAt } from './simulation.mjs';
import { drawVoiceAsset } from './voice-assets.mjs';
import { drawProductionPart } from './production-assets.mjs';
import { drawThyrAsset } from './thyr-assets.mjs';

const pct = n => Math.round((n || 0) * 100);
function line(c, x1, y1, x2, y2, color, width = 1) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function label(c, value, x, y, size = 10, color = '#d9dfbb', max = 430) { c.font = `500 ${size}px "IBM Plex Mono", "Courier New", monospace`; c.fillStyle = color; c.textAlign = 'center'; c.fillText(value, x, y, max); }
function work(c, o, x = o.x, y = o.y - o.h / 2 - 8) {
  if (!o.working) return;
  c.fillStyle = '#294a3d'; c.fillRect(x - 35, y, 70, 4); c.fillStyle = '#d6d9b2'; c.fillRect(x - 35, y, 70 * o.progress, 4);
}
function health(c, o) { if (!o.destroyed && o.hp < o.maxHp) { c.fillStyle = '#294733'; c.fillRect(o.x - 31, o.y - o.h / 2 - 3, 62, 3); c.fillStyle = '#d8aa7a'; c.fillRect(o.x - 31, o.y - o.h / 2 - 3, 62 * Math.max(0, o.hp / o.maxHp), 3); } }
function post(c, o, title, done) {
  drawProductionPart(c, { part: 'maintenance-post', x: o.x, y: o.y, width: o.w, height: o.h });
  label(c, title, o.x, o.y - o.h / 2 - 23, 9, done ? '#b8d2a1' : '#ddce9a'); work(c, o);
}
export function voiceSummary(s) {
  const d = s.voice, f = s.campaign, l = d.leth;
  const consent = !l.alive ? 'TÉMOIN PERDU' : l.withdrawn ? 'ACCORD RETIRÉ' : l.refused ? 'ENREGISTREMENT REFUSÉ' : l.consent ? 'ACCORD PRIVÉ REÇU' : l.met ? 'ACCORD À DEMANDER' : 'RENCONTRE À ÉTABLIR';
  const testimony = l.testimonyRecorded ? 'TÉMOIGNAGE CONSERVÉ' : l.testimonyLost ? 'ÉCHANGE PERDU' : l.working && l.work === 'testimony' ? `ÉCHANGE ${pct(l.progress)} %` : l.testimonyStarted && !f.testimonyResolved ? 'ÉCHANGE INTERROMPU · RELANCER' : l.refused || l.withdrawn ? 'AUCUN TÉMOIGNAGE ACHEVÉ' : 'ÉCHANGE À ACCOMPLIR';
  const emitter = d.emitter.destroyed ? 'ÉMETTEUR DÉTRUIT' : d.emitter.seized ? 'ÉMETTEUR SAISI' : d.emitter.restored ? 'LIAISON RÉTABLIE' : d.emitter.working ? d.emitter.work === 'seize' ? `SAISIE ${pct(d.emitter.progress)} %` : d.emitter.work === 'restore' ? `REMISE EN SERVICE ${pct(d.emitter.progress)} %` : `COPIE DE SOURCE ${pct(d.emitter.progress)} %` : 'ÉMETTEUR EN PLACE';
  let stage = 'RELEVER LES TROIS ÉCOUTES';
  if (d.report.transmitted) stage = 'RAPPORT TRANSMIS · REJOINDRE LA SORTIE';
  else if (f.readingsTaken < 3) stage = 'RELEVER LES TROIS ÉCOUTES';
  else if (!d.ridge.surveyed && !d.ridge.destroyed && s.player.x < s.mission.voice.ridgeStart) stage = 'RECONNAÎTRE LA CORNICHE AVANT LA PONTE';
  else if (!f.manifestRead) stage = 'RELEVER LES DEUX SOURCES OU CONSTATER LEUR PERTE';
  else if (!f.encounterResolved) stage = l.alive ? 'APPROCHER L’INTERPRÈTE' : 'CONSTATER LA PERTE DE LETH';
  else if (l.testimonyStarted && !f.testimonyResolved) stage = l.working ? 'PROTÉGER L’ÉCHANGE EN COURS' : 'REVENIR À LETH ET RELANCER L’ÉCHANGE';
  else if (f.operationsResolved) stage = f.privateNeutralized < 3 ? 'SÉCURISER LE SITE AVANT LE RAPPORT' : 'TRANSMETTRE LES FAITS ET LES PERTES';
  else if (s.decision.resolved) stage = f.plan === 'seize' ? 'ACCOMPLIR LA SAISIE SUR L’ÉMETTEUR' : 'RÉTABLIR LA LIAISON SUR L’ÉMETTEUR';
  else if (f.testimonyResolved) stage = 'REJOINDRE LE POSTE D’ORDRE';
  else if (l.consent) stage = 'COMMENCER L’ÉCHANGE CONSENTI';
  else if (l.met) stage = 'DEMANDER L’ACCORD DE LETH';
  return { stage, consent, testimony, emitter, readings: f.readingsTaken, signals: f.signalsRecorded,
    nestsIntact: f.nestsIntact, nestsLost: f.nestsLost, sourceLocated: f.sourceLocated,
    copies: Number(f.warningCopied) + Number(f.translationCopied), remainingThreats: s.enemies.filter(e => e.id.startsWith('voice-private-') && !e.dead).length };
}

export function drawVoiceSite(renderer, s, t) {
  const c = renderer.ctx, d = s.voice, cfg = s.mission.voice, f = s.campaign;
  for (const [i, point] of d.listening.entries()) {
    if (!renderer.visible(point.x, 160)) continue;
    const state = point.destroyed ? 'lost' : point.working ? 'listening' : point.detected ? 'recorded' : 'idle';
    drawVoiceAsset(c, { part: 'listening-station', state, x: point.x, y: point.y + point.h / 2, width: point.w, height: point.h, progress: point.progress });
    label(c, `ÉCOUTE ${i + 1} · ${point.destroyed ? 'POSTE PERDU' : point.detected ? 'SIGNAL CONSERVÉ' : point.working ? 'APPUI ET SILENCE' : 'RELEVÉ À PRENDRE'}`, point.x, point.y - point.h / 2 - 31, 9);
    if (point.sampled) label(c, point.detected ? `RÉSONANCE ${pct(point.signal)} % · ORIENTATION ${point.bearing > 0 ? 'EST' : 'OUEST'}` : 'CONSTAT CONSERVÉ · AUCUN SIGNAL COPIÉ', point.x, point.y - point.h / 2 - 15, 8, '#a8cbbb');
    work(c, point); health(c, point);
  }
  const from = Math.max(cfg.ridgeStart, renderer.cameraX - 40), to = Math.min(cfg.ridgeEnd, renderer.cameraX + 1640);
  if (to > from && d.ridge.surveyed && !d.ridge.destroyed) {
    const points = []; for (let x = from; x <= to; x += 8) points.push([x, voiceSurfaceAt(s, x).groundY]); points.push([to, voiceSurfaceAt(s, to).groundY]);
    c.beginPath(); c.moveTo(...points[0]); for (const point of points.slice(1)) c.lineTo(...point);
    for (const point of points.toReversed()) c.lineTo(point[0], point[1] + 13);
    c.closePath(); c.fillStyle = '#688461'; c.fill();
    c.beginPath(); c.moveTo(...points[0]); for (const point of points.slice(1)) c.lineTo(...point); c.strokeStyle = '#c0c99a'; c.lineWidth = 4; c.stroke();
    for (let x = from + 24; x < to; x += 65) line(c, x, voiceSurfaceAt(s, x).groundY + 3, x + 18, voiceSurfaceAt(s, x + 18).groundY + 11, '#415e45', 2);
  }
  if (renderer.visible(d.ridge.controlX, 170)) {
    const x = d.ridge.controlX, y = terrainAt(x, s.planetId);
    drawVoiceAsset(c, { part: 'root-passage', state: d.ridge.destroyed ? 'destroyed' : d.ridge.surveyed ? 'surveyed' : d.ridge.hp < d.ridge.maxHp ? 'damaged' : 'unknown', x, y, scale: .42 });
    label(c, d.ridge.destroyed ? 'CORNICHE ROMPUE' : d.ridge.surveyed ? 'PASSAGE HAUT RECONNU' : 'REPÈRE DU PASSAGE HAUT', x, y - 74, 9);
    label(c, 'RELEVÉ DU TRAJET AU-DESSUS DE LA PONTE', x, y - 58, 8, '#adc3a5', 310); work(c, d.ridge, x, y - 49);
  }
  for (const [i, nest] of d.nests.entries()) {
    if (!renderer.visible(nest.x, 160)) continue;
    drawVoiceAsset(c, { part: 'nesting-site', state: nest.destroyed ? 'lost' : nest.hp < nest.maxHp ? 'damaged' : nest.disturbance > 0 ? 'disturbed' : 'intact', x: nest.x, y: nest.y + nest.h / 2, width: nest.w, height: nest.h });
    label(c, `SITE ${i + 1} · ${nest.destroyed ? 'PERDU' : nest.hp < nest.maxHp ? 'ENDOMMAGÉ' : 'PONTE INTACTE'}`, nest.x, terrainAt(nest.x, s.planetId) + 25, 8, nest.hp < nest.maxHp ? '#dca37d' : '#c0d0a1', 190); health(c, nest);
  }
  if (renderer.visible(d.receiver.x, 180)) {
    const o = d.receiver;
    drawVoiceAsset(c, { part: 'translation-record', state: o.destroyed ? 'lost' : o.translationCopied ? 'copied' : o.working ? 'copying' : 'untranslated', x: o.x, y: o.y + o.h / 2, width: o.w, height: o.h, progress: o.progress });
    label(c, 'TRADUCTION DU POSTE IMPÉRIAL', o.x, o.y - o.h / 2 - 33, 9);
    label(c, o.translationCopied ? 'COPIE CONSERVÉE À BORD' : o.destroyed ? 'SUPPORT PERDU · AUCUNE COPIE' : 'RELEVER LE TEXTE REÇU', o.x, o.y - o.h / 2 - 17, 8, '#b2c7a7'); work(c, o); health(c, o);
  }
  if (renderer.visible(d.emitter.x, 200)) {
    const o = d.emitter, state = o.destroyed ? 'destroyed' : o.seized ? 'seized' : o.restored ? 'preserved' : o.working ? 'working' : 'transmitting';
    drawVoiceAsset(c, { part: 'resonance-emitter', state, x: o.x, y: o.y + o.h / 2, width: o.w, height: o.h, progress: o.progress });
    label(c, f.te01Acquired ? 'AVERTISSEMENTS RECUEILLIS' : f.sourceLocated ? 'ÉMETTEUR DE LA VALLÉE' : 'STRUCTURE RÉSONANTE À IDENTIFIER', o.x, o.y - o.h / 2 - 35, 9);
    label(c, voiceSummary(s).emitter, o.x, o.y - o.h / 2 - 19, 8, '#a9d1ba'); work(c, o); health(c, o);
  }
  if (renderer.visible(d.orders.x, 150)) post(c, d.orders, f.operationsResolved ? 'OPÉRATION CONSTATÉE · RAPPORT À TRANSMETTRE' : s.decision.resolved ? 'CONDUITE RETENUE · ACTE À ACCOMPLIR' : 'ORDRE DE CAPTURE', s.decision.resolved);
  if (renderer.visible(d.report.x, 150)) post(c, d.report, d.report.transmitted ? 'RAPPORT TRANSMIS' : 'LIAISON DE FIN DE SORTIE', d.report.transmitted);
  for (const x of [920, 1450, 1970, 4220, 5010]) if (renderer.visible(x, 100)) drawThyrAsset(c, { part: 'echo-grass', state: 'calm', x, y: terrainAt(x, s.planetId) + 5, scale: .45, progress: (t * .3) % 1 });
}

export function drawVoiceActor(renderer, s) {
  const c = renderer.ctx, l = s.voice.leth;
  if (!renderer.visible(l.x, 200)) return;
  const state = !l.alive ? 'lost' : l.refused || l.withdrawn ? 'refusing' : l.working && l.work === 'testimony' ? 'speaking' : l.consent || l.met ? 'listening' : 'waiting';
  drawVoiceAsset(c, { part: 'leth-interpreter', state, x: l.x, y: l.y + l.h / 2, width: l.w * 1.12, height: l.h, progress: l.progress, facing: s.player.x < l.x ? -1 : 1 });
  label(c, l.met ? 'LETH DE LA SEPTIÈME RIVE' : 'INTERPRÈTE À APPROCHER', l.x, l.y - l.h / 2 - 35, 9, '#d7dfba');
  label(c, voiceSummary(s).consent, l.x, l.y - l.h / 2 - 19, 8, !l.alive || l.withdrawn || l.refused ? '#e0ac86' : '#a4cdb8');
  work(c, l); health(c, l);
  if (l.working && l.work === 'testimony') {
    for (const x of [l.x - s.mission.voice.exchangeRadius, l.x + s.mission.voice.exchangeRadius]) if (renderer.visible(x, 100)) {
      const y = terrainAt(x, s.planetId); line(c, x, y - 10, x, y - 68, '#b3d5b5', 2); label(c, 'LIMITE DE PROTECTION', x, y - 78, 8);
    }
  }
}

export function drawVoiceLabels(renderer, s) {
  const c = renderer.ctx, d = s.voice, f = s.campaign, v = voiceSummary(s), px = s.player.x, entries = [];
  const add = (title, detail, sub, warning = false) => entries.push({ title, detail, sub, warning });
  const listening = d.listening.find(point => Math.abs(point.x - px) < 260 && !point.sampled);
  if (listening) add('ÉCOUTE DES RACINES', listening.working ? `RELEVÉ ${pct(listening.progress)} % · TENIR LES APPUIS` : 'ANCRAGE · IMMOBILITÉ · AUCUN TIR', `${f.signalsRecorded} / 3 signaux exploitables conservés`);
  if (px > s.mission.voice.surveyX - 250 && px < s.mission.voice.ridgeEnd + 80) add('PONTE LOCALE', d.ridge.destroyed ? 'CORNICHE PERDUE · SURVEILLER CHAQUE APPUI' : d.ridge.surveyed ? 'ITINÉRAIRE HAUT RECONNU' : 'RELEVER LA CORNICHE AVANT DE FRANCHIR', `${f.nestsIntact} sites intacts · ${f.nestsDamaged} endommagés · ${f.nestsLost} perdus`, !f.ridgeIntact || f.nestsIntact < 3);
  if (Math.abs(px - d.leth.x) < 1050 && f.encounterResolved) add('L’ACCORD DE LETH', v.testimony, `${v.consent} · aucune diffusion publique autorisée`, !f.lethAlive || f.consentWithdrawn || f.consentRefused);
  if (d.leth.testimonyStarted && !f.testimonyResolved) add('PROTECTION DE L’ÉCHANGE', d.leth.working ? `ENREGISTREMENT ${pct(d.leth.progress)} %` : 'REVENIR À LETH ET RELANCER', d.alert.ready ? v.remainingThreats ? `${v.remainingThreats} forces privées présentes` : 'Forces privées neutralisées' : 'Forces privées en approche', true);
  if (Math.abs(px - d.emitter.x) < 300 && f.manifestRead && !d.leth.working) add('DEUX SOURCES DISTINCTES', `${f.warningCopied ? 'AVIS COPIÉ' : 'AVIS ABSENT'} · ${f.translationCopied ? 'TRADUCTION COPIÉE' : 'TRADUCTION ABSENTE'}`, f.te01Acquired ? 'TE01 conservé · portée limitée aux avertissements déformés' : 'Le témoignage consenti reste une pièce distincte');
  if (Math.abs(px - d.report.x) < 340) add('RAPPORT DE LA VALLÉE', d.report.transmitted ? 'TRANSMISSION ACQUISE' : d.report.working ? `TRANSMISSION ${pct(d.report.progress)} %` : 'CONSERVER LES FAITS PUIS REJOINDRE LA SORTIE', `${f.te01Acquired ? 'TE01 conservé' : 'TE01 absent'} · ${f.witnessAvailable ? 'témoin disponible' : 'témoin indisponible'}`);
  entries.slice(0, 2).forEach((e, i) => { const x = renderer.cameraX + 902, y = 130 + i * 78, width = 460; c.fillStyle = '#17382fee'; c.fillRect(x - width / 2, y, width, 68); line(c, x - width / 2, y, x + width / 2, y, e.warning ? '#d8ab79' : '#c7d4a1', 1.5); label(c, e.title, x, y + 17, 10, '#dad6a7', width - 16); label(c, e.detail, x, y + 36, 9, '#d9dfbb', width - 16); label(c, e.sub, x, y + 55, 9, '#abc19c', width - 16); });
}
