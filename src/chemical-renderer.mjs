/** MI10 drawing consumes the physical scene; it never resolves work or evidence. */
import { terrainAt, chemicalSurfaceAt } from './simulation.mjs';
import { drawChemicalAsset } from './chemical-assets.mjs';
import { drawProductionPart } from './production-assets.mjs';
import { drawThyrAsset } from './thyr-assets.mjs';

const pct = n => Math.round((n || 0) * 100);
function line(c, x1, y1, x2, y2, color, width = 1) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function label(c, value, x, y, size = 10, color = '#d9dfbb', max = 420) { c.font = `500 ${size}px "IBM Plex Mono", "Courier New", monospace`; c.fillStyle = color; c.textAlign = 'center'; c.fillText(value, x, y, max); }
function work(c, o, x = o.x, y = o.y - o.h / 2 - 8) {
  if (!o.working) return;
  c.fillStyle = '#244334'; c.fillRect(x - 38, y, 76, 4); c.fillStyle = '#d0d6a0'; c.fillRect(x - 38, y, 76 * o.progress, 4);
}
function health(c, o) { if (!o.destroyed && o.hp < o.maxHp) { c.fillStyle = '#294733'; c.fillRect(o.x - 33, o.y - o.h / 2 - 4, 66, 3); c.fillStyle = '#d8aa7a'; c.fillRect(o.x - 33, o.y - o.h / 2 - 4, 66 * Math.max(0, o.hp / o.maxHp), 3); } }
function post(c, o, name, done) {
  drawProductionPart(c, { part: 'maintenance-post', x: o.x, y: o.y, width: o.w, height: o.h, state: o.destroyed ? 'destroyed' : 'normal' });
  label(c, name, o.x, o.y - o.h / 2 - 20, 9, done ? '#b8d2a1' : '#ddce9a'); work(c, o);
}
export function chemicalTankRole(role) { return { carrier: 'Solution porteuse', binder: 'Liant de sol', active: 'Correcteur de terraformation' }[role] || 'Composition non relevée'; }
export function chemicalSummary(s) {
  const d = s.chemical, f = s.campaign;
  let stage = 'RELEVER ET CONTENIR LE REJET';
  if (d.report.transmitted) stage = f.flowResolved ? 'BILAN TRANSMIS · REJOINDRE LA RAMPE' : 'NOUVEL ÉCOULEMENT · RETOUR VERROUILLÉ';
  else if (d.sampler.started && !f.sampleResolved) stage = d.sampler.working ? 'DÉFENDRE LE PRÉLÈVEMENT EN COURS' : 'RELANCER LE PRÉLÈVEMENT AU POSTE';
  else if (s.decision.resolved && !f.operationsResolved) stage = f.plan === 'demolish' ? 'DÉMOLITION À ACCOMPLIR SUR CHAQUE CUVE' : 'MISE EN SÉCURITÉ À ACCOMPLIR';
  else if (f.operationsResolved) stage = !f.sampleResolved ? 'PRÉLÈVEMENT OU CONSTAT À ACCOMPLIR' : !f.flowResolved ? 'ATTENDRE LA FIN DE L’ÉCOULEMENT' : !d.water.resolved ? 'RÉTABLIR L’EAU DU VILLAGE' : f.privateNeutralized < 3 ? 'SÉCURISER LE SITE AVANT TRANSMISSION' : 'TRANSMETTRE LE BILAN DU CHAMP';
  return { identified: d.tanks.filter(t => t.identified).length, inspected: d.tanks.filter(t => t.inspected).length,
    secured: d.tanks.filter(t => t.secured && !t.destroyed).length, destroyed: d.tanks.filter(t => t.destroyed).length,
    clean: d.canals.filter(c => !c.destroyed && c.contamination < s.mission.chemical.contaminationLimit).length,
    covered: d.canals.filter(c => !c.destroyed && c.covered).length,
    sample: d.sampler.collected ? 'PRÉLÈVEMENT CONSERVÉ' : d.sampler.lost ? 'PRÉLÈVEMENT PERDU' : d.sampler.working ? `PRÉLÈVEMENT ${pct(d.sampler.progress)} %` : d.sampler.started ? 'PRÉLÈVEMENT INTERROMPU · RELANCER' : 'PRÉLÈVEMENT À DÉFENDRE', stage };
}

export function drawChemicalSite(renderer, s, t) {
  const c = renderer.ctx, d = s.chemical, cfg = s.mission.chemical;
  const left = Math.max(cfg.tankXs[0] - 100, renderer.cameraX - 20), right = Math.min(cfg.villageX, renderer.cameraX + 1630);
  // The narrow gutter is a route marker. Water mass is drawn from real plumes below.
  if (right > left) { c.beginPath(); c.moveTo(left, terrainAt(left, s.planetId) + 15); for (let x = left + 15; x <= right; x += 15) c.lineTo(x, terrainAt(x, s.planetId) + 15); c.strokeStyle = '#687b5677'; c.lineWidth = 7; c.stroke(); }
  for (const [i, tank] of d.tanks.entries()) {
    if (!renderer.visible(tank.x, 220)) continue;
    const source = tank.id === d.leak.sourceId, leaking = source && !s.campaign.leakStopped;
    const state = tank.destroyed ? 'destroyed' : tank.secured || source && d.leak.contained ? 'sealed' : leaking ? 'leaking' : tank.identified ? 'identified' : 'unknown';
    drawChemicalAsset(c, { part: 'chemical-tank', state, x: tank.x, y: tank.y + tank.h / 2, width: tank.w, height: tank.h });
    label(c, `CUVE ${i + 1} · ${tank.destroyed ? 'DÉTRUITE' : tank.identified ? chemicalTankRole(tank.role).toUpperCase() : 'MARQUAGE À RELEVER'}`, tank.x, tank.y - tank.h / 2 - 36, 9, tank.destroyed ? '#dfad82' : '#e1d7ac', 330);
    label(c, tank.working ? `${tank.work === 'inspect' ? 'RELEVÉ' : tank.work === 'demolish' ? 'DÉMOLITION' : 'ISOLATION'} ${pct(tank.progress)} %` : tank.identified ? `MARQUAGE COPIÉ · ${Math.round(tank.volume)} UNITÉS RESTANTES` : tank.inspected ? 'SUPPORT PERDU · AUCUN MARQUAGE COPIÉ' : 'INSPECTION SUR PLACE', tank.x, tank.y - tank.h / 2 - 20, 8, '#a9c39b', 320);
    work(c, tank); health(c, tank);
  }
  for (const [o, x, name, done] of [[d.collector, d.collector.controlX, 'COMMANDE AMONT DU COLLECTEUR', d.collector.closed], [d.leak, d.leak.x, 'CONFINEMENT DE LA FUITE', d.leak.contained], [d.water, d.water.x, 'ALIMENTATION DU VILLAGE', d.water.resolved]]) {
    if (!renderer.visible(x, 150)) continue;
    const y = terrainAt(x, s.planetId);
    drawChemicalAsset(c, { part: 'field-valve', state: o.destroyed ? 'destroyed' : done ? 'operated' : o.working ? 'working' : 'normal', x, y, scale: .75, progress: o.progress });
    label(c, name, x, y - 102, 9, '#d5d6aa'); work(c, o, x, y - 90);
  }
  const collector = d.collector;
  if (renderer.visible(collector.x, 160)) {
    const ground = terrainAt(collector.x, s.planetId);
    c.fillStyle = '#344d3b'; c.fillRect(collector.x - 85, ground + 4, 170, 26);
    c.strokeStyle = '#91a275'; c.lineWidth = 3; c.strokeRect(collector.x - 85, ground + 4, 170, 26);
    if (s.campaign.spillRetained > 0) { c.fillStyle = '#b3b472'; c.fillRect(collector.x - 79, ground + 11, 158 * Math.min(1, s.campaign.spillRetained / 300), 13); }
    label(c, 'BASSIN DE RÉTENTION SÉPARÉ', collector.x, ground + 44, 8, '#b3c095');
    drawChemicalAsset(c, { part: 'field-valve', state: collector.destroyed ? 'destroyed' : collector.closed ? 'operated' : 'normal', x: collector.x, y: collector.y + collector.h / 2, width: collector.w, height: collector.h });
    label(c, collector.destroyed ? 'COLLECTEUR ROMPU' : collector.closed ? 'COLLECTEUR FERMÉ · REJET RETENU' : 'COLLECTEUR OUVERT', collector.x, collector.y - collector.h / 2 - 31, 9, collector.destroyed ? '#dda57b' : '#d5d6aa'); health(c, collector);
  }
  for (const canal of d.canals) {
    if (!renderer.visible(canal.x, 300)) continue;
    const polluted = canal.contamination >= cfg.contaminationLimit;
    drawChemicalAsset(c, { part: 'canal-junction', state: canal.destroyed ? 'destroyed' : polluted ? 'contaminated' : canal.covered ? 'covered' : canal.working ? 'covering' : 'open', x: canal.x, y: terrainAt(canal.x, s.planetId) + 20, width: canal.w, height: 56, progress: canal.progress });
    // A cover is the very same raised surface used by actual feet.
    if (canal.covered && !canal.destroyed) {
      const from = canal.x - canal.w / 2, to = canal.x + canal.w / 2;
      c.beginPath(); c.moveTo(from, chemicalSurfaceAt(s, from).groundY);
      for (let x = from + 5; x < to; x += 5) c.lineTo(x, chemicalSurfaceAt(s, x).groundY);
      c.lineTo(to, chemicalSurfaceAt(s, to).groundY); c.strokeStyle = '#d2cf9c'; c.lineWidth = 5; c.stroke();
    }
    const x = canal.controlX, y = terrainAt(x, s.planetId);
    drawChemicalAsset(c, { part: 'field-valve', x, y, scale: .55, state: canal.destroyed ? 'destroyed' : canal.covered ? 'operated' : canal.working ? 'working' : 'normal', progress: canal.progress });
    label(c, canal.destroyed ? 'CANAL ROMPU' : canal.covered ? 'CANAL COUVERT · APPUIS PORTÉS' : 'CANAL OUVERT · POSER LE PONTAGE', canal.x, canal.y - 68, 9, canal.destroyed ? '#dca47d' : '#cddbad');
    label(c, `REJET REÇU ${canal.contamination.toFixed(1)} / ${cfg.contaminationLimit} · ${polluted ? 'CONTAMINÉ' : 'SOUS LE SEUIL'}`, canal.x, canal.y - 51, 8, polluted ? '#e5b680' : '#acd0b9'); work(c, canal, x, y - 67); health(c, canal);
  }
  for (const plume of d.plumes) {
    if (!renderer.visible(plume.x, 80)) continue;
    const y = Number.isFinite(plume.y) ? plume.y : terrainAt(plume.x, s.planetId) + 14;
    c.fillStyle = plume.phase === 'retained' ? '#b1b66f99' : plume.phase === 'delivered' ? '#a9a36588' : '#ded083c7';
    c.beginPath(); c.ellipse(plume.x, y + 14, Math.min(42, 9 + Math.sqrt(plume.mass) * 6), 5, 0, 0, Math.PI * 2); c.fill();
  }
  const sampler = d.sampler;
  if (sampler.started && !sampler.collected && !sampler.lost) {
    const from = sampler.x - cfg.sampleRadius, to = sampler.x + cfg.sampleRadius;
    const visibleFrom = Math.max(from, renderer.cameraX), visibleTo = Math.min(to, renderer.cameraX + 1600);
    c.save(); c.setLineDash([7, 9]); c.beginPath(); c.moveTo(visibleFrom, terrainAt(visibleFrom, s.planetId) - 16);
    for (let x = visibleFrom + 20; x <= visibleTo; x += 20) c.lineTo(x, terrainAt(x, s.planetId) - 16);
    c.strokeStyle = '#d5cd8c99'; c.lineWidth = 2; c.stroke(); c.restore();
    for (const x of [from, to]) if (renderer.visible(x, 160)) { const y = terrainAt(x, s.planetId); line(c, x, y - 8, x, y - 71, '#d5cd8c', 2); label(c, 'LIMITE DE PROTECTION', x, y - 84, 9); }
  }
  if (renderer.visible(sampler.x, 160)) {
    drawChemicalAsset(c, { part: 'sampling-rig', state: sampler.destroyed ? 'lost' : sampler.collected ? 'secured' : sampler.lost ? 'lost' : sampler.working ? 'working' : 'idle', x: sampler.x, y: sampler.y + sampler.h / 2, width: sampler.w, height: sampler.h, progress: sampler.progress });
    label(c, sampler.collected ? 'PRÉLÈVEMENT CONSERVÉ À BORD' : sampler.lost ? 'PRÉLÈVEMENT PERDU' : 'PRÉLEVEUR · PROTECTION 20 S', sampler.x, sampler.y - sampler.h / 2 - 25, 9); work(c, sampler); health(c, sampler);
  }
  const record = d.record;
  if (renderer.visible(record.x, 160)) {
    drawChemicalAsset(c, { part: 'batch-ledger', state: record.destroyed ? 'lost' : record.copied ? 'copied' : 'unread', x: record.x, y: record.y + record.h / 2, width: record.w, height: record.h });
    label(c, record.copied ? 'COPIE DU REGISTRE CONSERVÉE' : record.destroyed ? 'REGISTRE ORIGINAL PERDU' : 'REGISTRE MATÉRIEL DES LOTS', record.x, record.y - record.h / 2 - 27, 9); work(c, record); health(c, record);
  }
  for (const home of d.homes) {
    if (!renderer.visible(home.x, 200)) continue;
    drawChemicalAsset(c, { part: 'village-supply', state: home.destroyed ? 'destroyed' : home.habitable ? 'habitable' : 'contaminated', x: home.x, y: home.y + home.h / 2, width: home.w, height: home.h });
    label(c, home.destroyed ? 'HABITAT DÉTRUIT' : home.habitable ? 'HABITAT PRÉSERVÉ' : 'ALIMENTATION COMPROMISE', home.x, home.y - home.h / 2 - 28, 9, home.habitable ? '#cfdbac' : '#dcb28b'); health(c, home);
  }
  if (renderer.visible(d.orders.x, 130)) post(c, d.orders, s.decision.resolved ? 'CONDUITE INSCRITE · OPÉRATIONS SUR PLACE' : 'POSTE D’ORDRE', s.decision.resolved);
  if (renderer.visible(d.report.x, 130)) post(c, d.report, d.report.transmitted ? 'BILAN TRANSMIS' : 'RAPPORT DU CHAMP', d.report.transmitted);
  for (const x of [1150, 1700, 3840, 5260]) if (renderer.visible(x, 100)) drawThyrAsset(c, { part: 'echo-grass', x, y: terrainAt(x, s.planetId) + 5, scale: .5, state: 'calm', progress: (t * .3) % 1 });
}

export function drawChemicalLabels(renderer, s) {
  const c = renderer.ctx, d = s.chemical, f = s.campaign, px = s.player.x, entries = [];
  const privateRemaining = s.enemies.filter(e => e.id.startsWith('chemical-private-') && !e.dead).length;
  const add = (title, detail, sub, warning = false) => entries.push({ title, detail, sub, warning });
  if (Math.abs(px - d.collector.controlX) < 330) add('COLLECTEUR AMONT', d.collector.destroyed ? 'VANNE DÉTRUITE · COMMANDE PERDUE' : d.collector.closed ? 'COLLECTEUR FERMÉ · ÉCOULEMENT RETENU' : d.water.resolved ? 'EAU CONSIGNÉE · VANNE INDISPONIBLE' : d.collector.working ? `FERMETURE ${pct(d.collector.progress)} % · ANCRAGE` : 'FERMER LE COLLECTEUR AVANT LES CUVES', 'La matière déjà retenue reste dans le bassin séparé', d.collector.destroyed);
  if (d.sampler.started && !d.sampler.collected && !d.sampler.lost) add(d.sampler.working ? 'PRÉLÈVEMENT EN COURS' : 'PRÉLÈVEMENT INTERROMPU', d.sampler.working ? `${pct(d.sampler.progress)} % · RESTER DANS LA ZONE DU PRÉLEVEUR` : 'REVENIR AU POSTE ET RELANCER LE CYCLE', d.alert.ready ? privateRemaining ? `${privateRemaining} forces privées actives · couvrir l’appareil` : 'Forces privées neutralisées · tenir la protection' : 'Forces privées en approche', true);
  if (Math.abs(px - d.leak.x) < 320) add('CONFINEMENT DE LA CONDUITE', f.leakStopped ? 'NOUVEL ÉCOULEMENT ARRÊTÉ' : d.leak.working ? `CONFINEMENT ${pct(d.leak.progress)} %` : 'UNE FUITE EST ACTIVE SUR LA TROISIÈME CUVE', `${f.spillReleased.toFixed(1)} unités libérées · ${f.spillInTransit.toFixed(1)} en transit`, !f.leakStopped);
  if (Math.abs(px - d.record.x) < 270 && !d.sampler.working) add('MÉMOIRE MATÉRIELLE DU SITE', `${f.copiedMarks} / 3 MARQUAGES · ${f.orisonRecordCopied ? 'REGISTRE COPIÉ' : f.orisonRecordLost ? 'REGISTRE PERDU' : 'REGISTRE À RELEVER'}`, f.pt02Acquired ? 'PT02 : prélèvement et provenance conservés' : 'La provenance et le prélèvement sont distincts');
  const canal = d.canals.find(o => Math.abs(o.controlX - px) < 290);
  if (canal) add('CANAUX DU VILLAGE', canal.destroyed ? 'OUVRAGE ROMPU · DOMMAGE CONSERVÉ' : canal.covered ? 'PONTAGE POSÉ · APPUIS PROTÉGÉS' : canal.working ? `PONTAGE ${pct(canal.progress)} % · ANCRAGE` : 'POSER LA COUVERTURE AVANT DE FRANCHIR', `${canal.contamination.toFixed(1)} unités reçues · seuil ${s.mission.chemical.contaminationLimit}`, canal.destroyed || canal.contamination >= s.mission.chemical.contaminationLimit);
  if (Math.abs(px - d.water.x) < 370) add('EAU DES HABITATS', d.water.resolved ? d.water.restored ? 'CIRCULATION RÉTABLIE' : 'RUPTURE CONSIGNÉE · ALIMENTATION PERDUE' : 'ATTENDRE LA FIN DES ÉCOULEMENTS PUIS RÉTABLIR', `${f.canalsIntact} canaux intacts · ${f.canalsPolluted} contaminés`, !f.villageHabitable);
  if (Math.abs(px - d.report.x) < 350) add('RAPPORT DU CHAMP', d.report.transmitted ? 'TRANSMISSION ACQUISE' : d.report.working ? `TRANSMISSION ${pct(d.report.progress)} %` : 'TRANSMETTRE LES FAITS PUIS REJOINDRE LA RAMPE', `${f.pt02Acquired ? 'PT02 conservé' : 'PT02 absent'} · ${f.homesHabitable} habitats préservés`);
  entries.slice(0, 2).forEach((e, i) => { const x = renderer.cameraX + 875, y = 130 + i * 78, width = 430; c.fillStyle = '#17382fee'; c.fillRect(x - width / 2, y, width, 68); line(c, x - width / 2, y, x + width / 2, y, e.warning ? '#d8ab79' : '#c7d4a1', 1.5); label(c, e.title, x, y + 17, 10, '#dad6a7', width - 16); label(c, e.detail, x, y + 36, 9, '#d9dfbb', width - 16); label(c, e.sub, x, y + 55, 9, '#abc19c', width - 16); });
}
