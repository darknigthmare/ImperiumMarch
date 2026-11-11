/** MI09 drawing only. All objects, contacts and outcomes come from the live state. */
import { terrainAt, livingRouteSurfaceAt } from './simulation.mjs';
import { drawThyrAsset } from './thyr-assets.mjs';
import { drawProductionPart } from './production-assets.mjs';

const percent = v => Math.round((v || 0) * 100);
const damageState = o => o.destroyed ? 'destroyed' : o.hp < o.maxHp * .6 ? 'damaged' : 'normal';
function line(c, x1, y1, x2, y2, color, width = 1) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function label(c, text, x, y, size = 11, color = '#d7ddba', align = 'center') { c.font = `500 ${size}px "IBM Plex Mono", "Courier New", monospace`; c.fillStyle = color; c.textAlign = align; c.fillText(text, x, y); }
function health(c, o, width = 64) { if (o.destroyed || o.hp >= o.maxHp) return; c.fillStyle = '#142d2a'; c.fillRect(o.x - width / 2, o.y - o.h / 2 - 10, width, 3); c.fillStyle = '#c5b180'; c.fillRect(o.x - width / 2, o.y - o.h / 2 - 10, width * Math.max(0, o.hp / o.maxHp), 3); }
function station(c, o, name, done) {
  drawProductionPart(c, { part: 'maintenance-post', x: o.x, y: o.y, width: o.w, height: o.h, state: o.destroyed ? 'destroyed' : 'normal' });
  label(c, name, o.x, o.y - o.h / 2 - 17, 10, done ? '#acd2ab' : '#dfcd97');
  if (o.working) { c.fillStyle = '#233d32'; c.fillRect(o.x - 31, o.y - o.h / 2 - 8, 62, 4); c.fillStyle = '#cee0ae'; c.fillRect(o.x - 31, o.y - o.h / 2 - 8, 62 * o.progress, 4); }
}

export function drawLivingRouteSite(renderer, s, t) {
  const c = renderer.ctx, r = s.livingRoute;
  // Distinct receiving zones stay at the authored destination coordinates.
  // Their paint adds neither crops to the ledger nor a new physical surface.
  for (const [kind, positions] of [['orchard', s.mission.livingRoute.orchardXs], ['exclusion', s.mission.livingRoute.exclusionXs]]) {
    const from = positions[0] - 72, to = positions.at(-1) + 72;
    if (!renderer.visible((from + to) / 2, (to - from) / 2 + 50)) continue;
    for (let x = from; x <= to; x += 24) {
      const y = terrainAt(x, s.planetId);
      line(c, x, y + 10, x + 17, terrainAt(x + 17, s.planetId) + 13, kind === 'orchard' ? '#afb67b' : '#758671', 2);
      if (kind === 'orchard') { line(c, x + 6, y, x + 6, y - 23, '#97b478', 2); line(c, x + 6, y - 12, x - 1, y - 18, '#d1cf8e', 3); line(c, x + 6, y - 17, x + 12, y - 23, '#c0c688', 3); }
    }
    for (const x of [from, to]) { const y = terrainAt(x, s.planetId); line(c, x, y, x, y - 49, kind === 'orchard' ? '#b6c393' : '#86997a', 4); line(c, x - 9, y - 43, x + 9, y - 43, kind === 'orchard' ? '#d7d8a6' : '#a3a88a', 3); }
    label(c, kind === 'orchard' ? 'VERGERS SYMBIOTIQUES · PASSAGE TRADITIONNEL' : 'ZONE D’EXCLUSION · HORS DES CULTURES', (from + to) / 2, terrainAt((from + to) / 2, s.planetId) - 126, 10, kind === 'orchard' ? '#d1dfa9' : '#c4ba8e');
  }
  for (const column of r.columns) {
    if (!renderer.visible(column.x, 280)) continue;
    const base = column.y + column.h / 2;
    drawThyrAsset(c, { part: 'column', state: damageState(column), x: column.x, y: base, scale: column.h / 470 });
    if (!column.destroyed) drawThyrAsset(c, { part: 'breathing-vine', x: column.x + 54, y: base - 110, scale: .8, progress: (t * .12) % 1 });
    health(c, column);
  }
  for (const home of r.homes) {
    if (!renderer.visible(home.x, 200)) continue;
    const column = r.columns.find(o => o.id === home.columnId);
    if (!home.destroyed && column && !column.destroyed) line(c, column.x, column.y - column.h / 2 + 48, home.x + 50, home.y - home.h / 2 - 39, '#9aaf7c', 2);
    const homeBase = home.destroyed ? terrainAt(home.x, s.planetId) : home.y + home.h / 2;
    drawThyrAsset(c, { part: 'suspended-home', state: damageState(home), x: home.x, y: homeBase, width: home.w, height: home.h });
    label(c, home.destroyed ? 'HABITAT EFFONDRÉ' : home.habitable ? 'HABITAT SUSPENDU' : 'HABITAT FRAGILISÉ', home.x, home.destroyed ? homeBase - 62 : home.y - home.h / 2 - 55, 9, home.destroyed ? '#c9a286' : '#c4d5ad');
    health(c, home, 48);
  }
  for (const root of r.roots) {
    if (!renderer.visible(root.x, 240)) continue;
    // Art is anchored at the root; the exposed contact edge is sampled from
    // the same curved surface as the feet, including the underlying terrain.
    drawThyrAsset(c, { part: 'root', state: damageState(root), x: root.x, y: root.y + root.h / 2, scale: root.w / 340 });
    if (!root.destroyed) {
      const from = root.x - root.w / 2, to = root.x + root.w / 2;
      c.beginPath(); c.moveTo(from, terrainAt(from, s.planetId));
      for (let x = from; x <= to; x += 5) c.lineTo(x, livingRouteSurfaceAt(s, x).groundY);
      for (let x = to; x >= from; x -= 5) c.lineTo(x, terrainAt(x, s.planetId) + 3);
      c.closePath(); c.fillStyle = '#6f8758'; c.fill();
      c.beginPath(); c.moveTo(from, livingRouteSurfaceAt(s, from).groundY);
      for (let x = from + 5; x <= to; x += 5) c.lineTo(x, livingRouteSurfaceAt(s, x).groundY);
      c.strokeStyle = '#d1cf94'; c.lineWidth = 1.6; c.stroke();
    }
  }
  for (const fan of r.pollinators) {
    if (!renderer.visible(fan.x, 140)) continue;
    const phase = fan.phase === 'flying' ? 'dispersed' : fan.phase === 'lost' ? 'lost' : 'settled';
    drawThyrAsset(c, { part: 'fan-colony', state: phase, x: fan.x, y: fan.y + fan.h / 2, scale: fan.w / 112, progress: (t * .3) % 1 });
  }
  const b = r.barrier;
  if (renderer.visible(b.x, 220)) {
    drawThyrAsset(c, { part: 'migration-barrier', state: b.destroyed ? 'broken' : b.opening >= .999 ? 'open' : b.opening > 0 || b.working ? 'working' : 'closed', progress: b.opening, x: b.x, y: b.y + b.h / 2, width: b.w, height: b.h });
    health(c, b, 45);
  }
  if (renderer.visible(b.controlX, 100)) {
    const y = terrainAt(b.controlX, s.planetId);
    drawProductionPart(c, { part: 'gate-mechanism', x: b.controlX, y: y - 26, state: b.destroyed ? 'destroyed' : b.working ? 'working' : 'normal', progress: b.progress });
    label(c, b.destroyed ? 'COMMANDE PERDUE' : 'COMMANDE DE LA BARRIÈRE', b.controlX, y - 67, 9);
  }
  const m = r.maps;
  if (renderer.visible(m.x, 130)) {
    drawThyrAsset(c, { part: 'route-map', state: m.inspected ? 'surveyed' : 'concealed', x: m.x, y: m.y + m.h / 2, scale: .85 });
    label(c, m.inspected ? 'HAMEAUX ET MIGRATION RELEVÉS' : 'CARTE MILITAIRE', m.x, m.y - m.h / 2 - 17, 9);
  }
  for (const [o, name, done] of [[r.contact, 'LIAISON DES CULTURES', r.contact.heard], [r.approach, 'BALISAGE DES APPUIS', r.approach.prepared], [r.report, r.report.transmitted ? 'BILAN TRANSMIS' : 'POSTE DE RAPPORT', r.report.transmitted]])
    if (renderer.visible(o.x, 160)) station(c, o, name, done);
  if (renderer.visible(r.logistics.controlX, 130)) {
    const o = r.logistics, x = o.controlX;
    station(c, { x, y: terrainAt(x, s.planetId) - 30, w: 48, h: 60, working: o.working, progress: o.progress }, o.released ? 'DÉPART LOGISTIQUE AUTORISÉ' : 'LIAISON DU TRANSPORT', o.released);
  }
  if (renderer.visible(r.lights.x, 150)) {
    const o = r.lights, y = o.y + o.h / 2;
    line(c, o.x, y, o.x, y - 131, '#506e54', 8);
    c.fillStyle = o.on ? '#ded8a4' : '#3d5c48'; c.fillRect(o.x - 22, y - 138, 44, 18);
    if (o.on) { c.beginPath(); c.moveTo(o.x - 18, y - 120); c.lineTo(o.x - 125, y - 8); c.lineTo(o.x + 125, y - 8); c.lineTo(o.x + 18, y - 120); c.closePath(); c.fillStyle = '#ddd8a00e'; c.fill(); }
    label(c, o.on ? 'PROJECTEUR ALLUMÉ' : 'PROJECTEUR COUPÉ', o.x, y - 153, 9);
  }
  for (const x of [975, 1540, 3040, 3860, 4490, 5000]) if (renderer.visible(x, 90)) {
    const nearby = r.migrators.some(a => a.moving && Math.abs(a.x - x) < 350);
    drawThyrAsset(c, { part: 'echo-grass', state: nearby ? 'moving' : 'calm', x, y: terrainAt(x, s.planetId) + 8, scale: .65, progress: (t * .5) % 1 });
  }
  if (r.approach.prepared) for (const x of [1000, 1450, 3320, 3820]) if (renderer.visible(x, 80))
    drawThyrAsset(c, { part: 'route-marker', state: r.approach.kind === 'guided' ? 'local' : 'imperial', x, y: terrainAt(x, s.planetId), scale: .7 });
}

export function drawLivingRouteActors(renderer, s, t) {
  const c = renderer.ctx, r = s.livingRoute;
  for (const animal of r.migrators) {
    if (!renderer.visible(animal.x, 120)) continue;
    const state = animal.destroyed ? 'dead' : animal.moving ? 'moving' : animal.phase === 'arrived' ? 'arrived' : animal.phase === 'displaced' ? 'diverted' : 'waiting';
    drawThyrAsset(c, { part: `longuedorse-${animal.age}`, state, x: animal.x, y: animal.y + animal.h / 2, width: animal.w, height: animal.h, facing: animal.targetX < animal.x ? -1 : 1, progress: (t * .8 + animal.x * .003) % 1 });
    health(c, animal, 40);
    if (animal.flash > 0) { c.strokeStyle = '#d9c397'; c.lineWidth = 1.5; c.strokeRect(animal.x - animal.w / 2 - 3, animal.y - animal.h / 2 - 3, animal.w + 6, animal.h + 6); }
  }
  const convoy = r.logistics;
  if (renderer.visible(convoy.x, 180)) {
    const base = convoy.y + convoy.h / 2;
    c.save(); c.translate(convoy.x, base);
    c.fillStyle = convoy.destroyed ? '#455747' : '#74856b'; c.fillRect(-60, -48, 95, 34);
    c.fillStyle = convoy.destroyed ? '#35463b' : '#9aa080'; c.fillRect(21, -59, 39, 45);
    c.fillStyle = '#2b483d'; c.fillRect(37, -53, 19, 13);
    for (let x = -48; x < 26; x += 17) { c.strokeStyle = '#b4b48b'; c.lineWidth = 1; c.strokeRect(x, -43, 13, 23); }
    for (const x of [-40, 37]) { c.beginPath(); c.arc(x, -10, 13, 0, Math.PI * 2); c.fillStyle = '#233c33'; c.fill(); c.beginPath(); c.arc(x, -10, 6, 0, Math.PI * 2); c.fillStyle = '#8b9d78'; c.fill(); }
    line(c, -65, -14, 64, -14, '#d3c79b', 3);
    if (convoy.destroyed) { line(c, -37, -46, 12, -19, '#223c32', 5); line(c, -18, -48, 22, -22, '#596e52', 3); }
    c.restore(); health(c, convoy, 72);
    label(c, convoy.destroyed ? 'LOGISTIQUE PERDUE' : convoy.arrived ? 'LOGISTIQUE ARRIVÉE' : convoy.moving ? 'TRANSPORT LOGISTIQUE EN ROUTE' : 'LOGISTIQUE EN ATTENTE', convoy.x, convoy.y - convoy.h / 2 - 20, 9);
  }
}

export function livingRouteSummary(s) {
  const r = s.livingRoute;
  return {
    arrived: r.migrators.filter(a => a.phase === 'arrived' && !a.destroyed).length,
    displaced: r.migrators.filter(a => a.phase === 'displaced' && !a.destroyed).length,
    lost: r.migrators.filter(a => a.destroyed).length,
    moving: r.migrators.filter(a => a.moving && !a.destroyed).length,
    columns: r.columns.filter(a => !a.destroyed).length,
    homes: r.homes.filter(a => a.habitable && !a.destroyed).length,
    settled: r.pollinators.filter(a => a.phase === 'settled' && a.alive).length,
  };
}

export function drawLivingRouteLabels(renderer, s) {
  const c = renderer.ctx, r = s.livingRoute, v = livingRouteSummary(s), px = s.player.x, entries = [];
  const add = (title, detail, sub, warning = false) => entries.push({ title, detail, sub, color: warning ? '#dfb084' : '#cbdba8' });
  if (Math.abs(px - r.contact.x) < 330) add('LIAISON AVEC LES CULTURES', r.contact.heard ? 'HABITANTS ÉCOUTÉS · APPROCHE GUIDÉE DISPONIBLE' : r.contact.working ? `ÉCOUTE ${percent(r.contact.progress)} %` : 'ÉTABLIR LA LIAISON AVANT DE BALISER', 'Le contact ne recense aucun habitant à votre place');
  if (Math.abs(px - r.approach.x) < (r.approach.prepared ? 170 : 300)) add('HAUTEUR ET APPUIS DANS LA CANOPÉE', r.approach.prepared ? `${r.approach.kind === 'guided' ? 'APPROCHE GUIDÉE' : 'RELEVÉ MILITAIRE'} · CONTOURNEMENT BALISÉ` : r.approach.working ? `BALISAGE ${percent(r.approach.progress)} %` : 'RECONNAÎTRE LES RACINES AVANT LE PASSAGE', 'Ancrage et marche contrôlent les appuis réels du châssis');
  const nearest = r.roots.find(o => Math.abs(o.x - px) < 250);
  if (nearest) add('RACINE PORTEUSE · COLONNE VIVANTE', nearest.destroyed ? 'RACINE PERDUE · APPUI RETIRÉ' : `INTÉGRITÉ ${Math.round(nearest.hp / nearest.maxHp * 100)} %`, `${v.columns} colonnes intactes · ${v.homes} habitats habitables`, nearest.destroyed || nearest.hp < nearest.maxHp * .5);
  if (Math.abs(px - r.barrier.controlX) < 420) add('BARRIÈRE DE MIGRATION', r.barrier.destroyed ? 'BARRIÈRE DÉTRUITE · AVARIE CONSERVÉE' : r.barrier.working ? `MANŒUVRE ${percent(r.barrier.progress)} % · ANCRAGE` : `OUVERTURE ${percent(r.barrier.opening)} %`, 'Le choix donne un ordre ; la manœuvre doit être accomplie', r.barrier.destroyed);
  if (Math.abs(px - r.maps.x) < 340) add('DEUX LECTURES DE LA ROUTE', r.maps.inspected ? 'MIGRATION ET HAMEAUX OMIS SUR LA CARTE' : r.maps.working ? `CONFRONTATION ${percent(r.maps.progress)} %` : 'EXAMINER LA CARTE AU POSTE', 'Le passage féconde les vergers de cette vallée');
  if (px > 1720 && r.migrators.some(a => renderer.visible(a.x, 100))) add('LES QUATRE LONGUES-DORSES', `${v.arrived} AU VERGER · ${v.displaced} DÉTOURNÉS · ${v.lost} PERDUS`, `${v.moving} en déplacement · ${v.settled} colonies d’éventails revenues`, v.lost > 0);
  if (r.alert.triggered && s.enemies.some(e => e.id.startsWith('thyr-sniper-') && !e.dead)) add('TIREURS SUR LA ROUTE', 'ÉCLAT DE LUNETTE · IMMOBILITÉ AVANT LE TIR', 'Repositionnez le radiateur et protégez les êtres exposés', true);
  if (Math.abs(px - r.report.x) < 350) entries.unshift({ title: 'RAPPORT DE LA ROUTE DES VIVANTS', detail: r.report.transmitted ? 'TRANSMISSION ACQUISE' : r.report.working ? `TRANSMISSION ${percent(r.report.progress)} %` : 'CONSTATER LE TRAJET ET TRANSMETTRE', sub: `${v.homes} habitats habitables · ${v.arrived} migrateurs au verger · ${v.lost} pertes`, color: '#d5d7ad' });
  const shown = entries.slice(0, 2), top = 130;
  shown.forEach((e, index) => { const x = renderer.cameraX + 880, y = top + index * 78, w = 426; c.fillStyle = '#17382fee'; c.fillRect(x - w / 2, y, w, 68); line(c, x - w / 2, y, x + w / 2, y, e.color, 1.5); label(c, e.title, x, y + 17, 10, e.color); label(c, e.detail, x, y + 36, 9); label(c, e.sub, x, y + 55, 9, '#a9c29e'); });
}
