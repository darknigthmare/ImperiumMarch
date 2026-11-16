/** MI12 view: every state, component and foot position is supplied by simulation. */
import { drawRelayAsset } from './relay-assets.mjs';
import { drawPaintedRelaySiteAsset, drawPaintedPraetor } from './painted-relay.mjs';
function drawRelayPresentation(ctx, options) { return drawPaintedRelaySiteAsset(ctx, options) || drawRelayAsset(ctx, options); }
const pct = value => Math.round(value * 100);
function line(c, x1, y1, x2, y2, color, width = 1) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function label(c, text, x, y, size = 10, color = '#d3d7af', max = 460) { c.font = `500 ${size}px "Courier New", monospace`; c.textAlign = 'center'; c.fillStyle = color; c.fillText(text, x, y, max); }
function work(c, p) { if (!p.working) return; c.fillStyle = '#354e3c'; c.fillRect(p.x - 37, p.y - p.h / 2 - 9, 74, 4); c.fillStyle = '#d9c397'; c.fillRect(p.x - 37, p.y - p.h / 2 - 9, 74 * p.progress, 4); }
function health(c, p) { if (p.destroyed || p.hp === p.maxHp) return; c.fillStyle = '#293e31'; c.fillRect(p.x - 30, p.y - p.h / 2 - 4, 60, 3); c.fillStyle = '#d8aa80'; c.fillRect(p.x - 30, p.y - p.h / 2 - 4, 60 * p.hp / p.maxHp, 3); }
export function relaySummary(s) {
  const d = s.relay, f = s.campaign;
  const copy = f.ordersCopied ? 'COMMANDES COPIÉES À BORD' : f.copyLost ? 'SOURCE PERDUE · AUCUN TEXTE ACQUIS' : d.copy.expired ? 'FENÊTRE CLOSE · COPIE INCOMPLÈTE' : d.copy.working ? `COPIE ${pct(d.copy.progress)} % · ${Math.max(0, Math.ceil(d.window.deadline - s.elapsed))} S RESTANTES` : d.window.opened ? `FENÊTRE ${Math.max(0, Math.ceil(d.window.deadline - s.elapsed))} S · COPIE 24 S` : 'TROIS REPÈRES À RELEVER';
  const praetor = f.praetorNeutralized ? 'PRÉTOIRE NEUTRALISÉ' : d.alert.ready ? `${d.praetor.sensor.destroyed ? 'CAPTEUR PERDU' : 'CAPTEUR ACTIF'} · ${d.praetor.hydraulicLock.destroyed ? 'VERROU ROMPU' : 'ANCRAGE VERROUILLÉ'}` : d.alert.triggered ? `PRÉTOIRE EN APPROCHE · ${Math.max(0, Math.ceil(s.mission.relay.privateDelay - d.alert.elapsed))} S` : 'SÉCURITÉ HORS DU SITE';
  let stage = 'RELEVER LES TROIS RELAIS';
  if (f.reportTransmitted) stage = 'RAPPORT TRANSMIS · REJOINDRE LA SORTIE';
  else if (f.operationsResolved) stage = f.praetorNeutralized ? 'TRANSMETTRE LE BILAN' : 'NEUTRALISER LE PRÉTOIRE';
  else if (s.decision.resolved) stage = f.plan === 'erase' ? 'PURGER CHAQUE RELAIS SUR PLACE' : f.plan === 'preserve' ? 'PURGER DEUX RELAIS · ISOLER LE TROISIÈME' : 'ISOLER LES TROIS RELAIS';
  else if (f.copyResolved && f.manifestRead) stage = 'RÉPONDRE À L’ORDRE DE PURGE';
  else if (f.manifestRead) stage = 'COPIER AVANT LA FIN DE LA FENÊTRE';
  return { stage, copy, praetor, relays: `${f.inspectionsTaken} / 3 RELEVÉS · ${f.relaysErased} PURGÉS · ${f.relaysIsolated} ISOLÉS · ${f.relaysLost} PERDUS`, plan: f.plan,
    orders: f.ordersCopied ? 'Ordres locaux conservés · aucune chaîne politique globale acquise' : 'Aucune commande industrielle copiée',
    consequences: f.publicRefusal ? 'REFUS PUBLIC · REFUGE IMPÉRIAL FERMÉ' : f.holtAlerted ? 'ÉCART CONSTATÉ PAR HOLT' : 'RAPPORT IMPÉRIAL SANS ÉCART DÉCLARÉ' };
}
export function drawRelaySite(renderer, s) {
  const c = renderer.ctx, d = s.relay;
  for (const r of d.relays) if (renderer.visible(r.x, 220)) {
    const state = r.destroyed ? 'destroyed' : r.erased ? 'erased' : r.isolated ? 'isolated' : r.working && r.work === 'erase' ? 'purging' : r.inspected ? 'reviewed' : 'live';
    drawRelayPresentation(c, { part: 'relay-mast', state, x: r.x, y: r.y + r.h / 2, width: r.w, height: r.h, progress: r.progress });
    label(c, `RELAIS ${r.index} · ${r.destroyed ? 'PERDU' : r.erased ? 'PURGÉ' : r.isolated ? 'ISOLÉ' : r.inspected ? 'RELEVÉ' : 'À RELEVER'}`, r.x, r.y - r.h / 2 - 24, 9);
    work(c, r); health(c, r);
  }
  if (renderer.visible(d.copy.x, 220)) {
    const state = d.copy.copied ? 'copied' : d.copy.lost || d.copy.expired ? 'expired' : d.copy.working ? 'copying' : 'idle';
    drawRelayPresentation(c, { part: 'copy-console', state, x: d.copy.x, y: d.copy.y + d.copy.h / 2, width: d.copy.w, height: d.copy.h, progress: d.copy.progress });
    label(c, 'TERMINAL DE COPIE', d.copy.x, d.copy.y - d.copy.h / 2 - 24, 9); work(c, d.copy);
  }
  for (const [p, title, done] of [[d.orders, 'POSTE D’ORDRE', s.decision.resolved], [d.report, 'LIAISON DE RAPPORT', d.report.transmitted]]) if (renderer.visible(p.x, 180)) {
    drawRelayPresentation(c, { part: 'command-post', state: done ? 'transmitted' : p.working ? 'working' : 'idle', x: p.x, y: p.y + p.h / 2, width: p.w, height: p.h, progress: p.progress || 0 });
    label(c, done ? `${title} · ACQUIS` : title, p.x, p.y - p.h / 2 - 24, 9); work(c, p);
  }
}
export function drawRelayActor(renderer, s) {
  const c = renderer.ctx, p = s.relay.praetor;
  if (!s.relay.alert.ready || !renderer.visible(p.x, 340)) return;
  const painted = drawPaintedPraetor(c, p);
  if (!painted) for (const [i, f] of p.feet.entries()) {
    const hipX = p.x + (i < 2 ? -48 : 48), hipY = p.y + 31, kneeX = (hipX + f.x) / 2 + (i % 2 ? 11 : -11), kneeY = (hipY + f.y) / 2;
    line(c, hipX, hipY, kneeX, kneeY, p.destroyed ? '#5e6c58' : i % 2 ? '#8a9e7b' : '#5c7c64', i % 2 ? 15 : 18);
    line(c, kneeX, kneeY, f.x, f.y - 5, p.destroyed ? '#67725c' : '#b3bd94', 10);
    c.fillStyle = '#475f4c'; c.fillRect(f.x - 17, f.y - 7, 34, 9);
  }
  if (!painted) {
    drawRelayAsset(c, { part: 'praetor-hull', state: p.destroyed ? 'destroyed' : p.hydraulicLock.destroyed ? 'exposed' : p.phase === 'attack' ? 'attack' : 'guard', x: p.x, y: p.y + p.h / 2, width: p.w, height: p.h, facing: p.facing });
    line(c, p.x + p.facing * 69, p.y + 30, p.hydraulicLock.x, p.hydraulicLock.y, p.hydraulicLock.destroyed ? '#715f4d' : '#b6bd93', p.hydraulicLock.destroyed ? 3 : 7);
  }
  for (const [part, o, state] of [['praetor-sensor', p.sensor, p.sensor.destroyed ? 'disabled' : p.phase === 'attack' ? 'locking' : 'tracking'], ['praetor-lock', p.hydraulicLock, p.hydraulicLock.destroyed ? 'broken' : 'anchored']]) {
    if (!painted) drawRelayAsset(c, { part, state, x: o.x, y: o.y + o.h / 2, width: o.w, height: o.h, facing: p.facing }); health(c, o);
  }
  if (!p.destroyed && p.phase === 'attack') {
    line(c, p.sensor.destroyed ? p.x + p.facing * 115 : p.sensor.x, p.sensor.destroyed ? p.y - 10 : p.sensor.y, p.targetX, p.targetY, `rgba(230,164,112,${.25 + p.telegraph * .55})`, 1.5);
    label(c, `${p.sensor.destroyed ? 'VISÉE DE SECOURS' : 'VERROUILLAGE'} ${pct(p.telegraph)} %`, p.x, p.sensor.y - 34, 9, '#e6b788');
  }
  label(c, p.destroyed ? 'VE12 / PRÉTOIRE NEUTRALISÉ' : 'VE12 / PRÉTOIRE DE SÉCURITÉ', p.x, p.sensor.y - 52, 10, '#d8c394'); health(c, p);
}
export function drawRelayLabels(renderer, s) {
  const c = renderer.ctx, d = s.relay, f = s.campaign, v = relaySummary(s), entries = [];
  if (d.window.opened && !f.copyResolved || Math.abs(s.player.x - d.copy.x) < 310) entries.push(['COMMANDES DU TROISIÈME RELAIS', v.copy, f.ordersCopied ? 'Copie acquise indépendante du sort de l’original' : 'E au terminal · ancrage immobile · durée 24 secondes']);
  if (d.alert.ready && !d.praetor.destroyed && Math.abs(s.player.x - d.praetor.x) < 1200) entries.push(['PRÉTOIRE / DEUX COMPOSANTS', v.praetor, 'Œil supérieur : visée · verrou frontal : ancrage et blindage']);
  if (s.decision.resolved && Math.abs(s.player.x - d.orders.x) < 420) entries.push(['CONDUITE RETENUE', v.consequences, v.relays]);
  if (Math.abs(s.player.x - d.report.x) < 350) entries.push(['RAPPORT DES RELAIS', v.stage, v.orders]);
  entries.slice(0, 2).forEach(([title, detail, sub], i) => { const x = renderer.cameraX + 902, y = 135 + i * 78; c.fillStyle = '#1d392eee'; c.fillRect(x - 230, y, 460, 68); line(c, x - 230, y, x + 230, y, '#c7bb8e', 1.5); label(c, title, x, y + 17, 10, '#d9d1a3'); label(c, detail, x, y + 36, 9); label(c, sub, x, y + 55, 9, '#b1c49e'); });
}
