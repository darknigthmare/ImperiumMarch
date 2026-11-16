/** Kharon rendering follows actual bodies, contacts, transfers and thermal clocks. */
import { terrainAt, foundrySurfaceAt } from './simulation.mjs';
import { drawFoundryAsset } from './foundry-assets.mjs';
import { drawPaintedIndustrialCarrier, drawPaintedIndustrialCargo } from './painted-transport.mjs';
const pct = n => Math.round((n || 0) * 100);
function line(c, x1, y1, x2, y2, color, width = 1) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
function label(c, value, x, y, size = 10, color = '#d9d2b2', max = 450) { c.font = `500 ${size}px "IBM Plex Mono", "Courier New", monospace`; c.fillStyle = color; c.textAlign = 'center'; c.fillText(value, x, y, max); }
function work(c, job, x, y) { if (!job.working && !(job.elapsed > 0 && job.progress < 1)) return; c.fillStyle = '#304748'; c.fillRect(x - 38, y, 76, 4); c.fillStyle = job.working ? '#e4bc75' : '#a6bab2'; c.fillRect(x - 38, y, 76 * job.progress, 4); }
function hp(c, body) { if (body.destroyed || body.hp >= body.maxHp) return; c.fillStyle = '#38494a'; c.fillRect(body.x - 35, body.y - body.h / 2 - 9, 70, 3); c.fillStyle = '#c9a270'; c.fillRect(body.x - 35, body.y - body.h / 2 - 9, 70 * body.hp / body.maxHp, 3); }
const cargoState = cargo => cargo.destroyed ? 'destroyed' : cargo.hp < cargo.maxHp ? 'damaged' : cargo.markingCopied ? 'copied' : 'sealed';
const cargoIntegrity = cargo => cargo.destroyed ? 'PERDUE' : cargo.hp < cargo.maxHp ? 'ENDOMMAGÉE' : 'INTACTE';

export function foundrySummary(s) {
  const d = s.foundry, f = s.campaign, pending = d.cargo.find(c => !c.transferred && !c.destroyed);
  let stage = 'RELEVER LE BORDEREAU ET LIBÉRER LE PORTEUR';
  if (d.carrier.destroyed) stage = 'PORTEUR PERDU · SORTIE TERMINALE';
  else if (d.report.transmitted) stage = 'RÉCEPTION TRANSMISE · REJOINDRE LA SORTIE';
  else if (f.operationsResolved) stage = 'TRANSMETTRE LE RAPPORT DE RÉCEPTION';
  else if (d.carrier.arrived) stage = pending?.transfer.working ? `TRANSFERT ${pct(pending.transfer.progress)} % · TENIR L’ANCRAGE` : pending?.transfer.elapsed ? 'TRANSFERT INTERROMPU · REPRENDRE AU POSTE' : 'TRANSFÉRER LES CAISSES RESTANTES AU POSTE';
  else if (s.decision.resolved) stage = 'ESCORTER LE PORTEUR JUSQU’À LA BAIE CHOISIE';
  else if (f.analysisCompleted && f.privateNeutralized === 3) stage = 'REJOINDRE LE POSTE DE RÉCEPTION ET CHOISIR LA BAIE';
  else if (f.manifestRead) stage = d.analysis.working ? `TESS ANALYSE ${pct(d.analysis.progress)} % · TENIR LA LIAISON` : 'FAIRE ANALYSER LES PIÈCES CONSERVÉES PAR TESS';
  else if (d.alert.ready && f.privateNeutralized < 3) stage = 'PROTÉGER LE PORTEUR CONTRE L’EMBUSCADE';
  else if (d.alert.ready) stage = 'RELEVER LES DEUX MARQUAGES ET LE BORDEREAU';
  else if (d.carrier.released) stage = 'ESCORTER LE PORTEUR ET REFROIDIR LES TABLIERS';
  return { stage,
    carrier: d.carrier.destroyed ? 'PORTEUR DÉTRUIT' : d.carrier.arrived ? 'PORTEUR À LA BAIE' : d.carrier.speed > 0 ? 'PORTEUR EN MOUVEMENT' : d.carrier.released ? 'PORTEUR EN ATTENTE DE L’ESCORTE' : 'PORTEUR À LIBÉRER',
    cargo: `${f.cargoIntact} INTACTES · ${f.cargoDamaged} ENDOMMAGÉES · ${f.cargoLost} PERDUES · ${f.cargoTransferred} TRANSFERTS ACQUIS`,
    provenance: f.pt03Acquired ? 'PT03 CONSERVÉE · PROVENANCE INDUSTRIELLE LOCALE' : f.analysisCompleted ? 'ANALYSE ACHEVÉE · SOURCES INSUFFISANTES POUR PT03' : `${f.markingsCopied} / 2 MARQUAGES · BORDEREAU ${f.manifestCopied ? 'COPIÉ' : 'ABSENT'} · ANALYSE À ACHEVER`,
    thermal: d.bridges.map((b, i) => `TABLIER ${i + 1} : ${Math.round(b.temperature)} °C · ${b.circuitOpen ? 'CIRCUIT ISOLÉ' : b.steam.phase === 'jet' ? 'JET ACTIF' : b.steam.phase === 'warning' ? 'VAPEUR IMMINENTE' : 'SOUS PRESSION'}`).join(' / '),
    threats: d.alert.ready ? `${3 - f.privateNeutralized} FORCES PRÉSENTES` : d.alert.triggered ? `ARRIVÉE DANS ${Math.ceil(s.mission.foundry.privateDelay - d.alert.elapsed)} S` : 'ROUTE INDUSTRIELLE',
    destination: f.plan === 'deliver' ? 'FONDERIE CENTRALE' : f.plan === 'quarantine' ? 'BAIE DE QUARANTAINE' : 'DESTINATION À DÉCIDER APRÈS EXAMEN',
    markings: f.markingsCopied, copies: f.markingsCopied + Number(f.manifestCopied), remainingThreats: 3 - f.privateNeutralized };
}

export function drawFoundrySite(renderer, s, t = s.elapsed) {
  const c = renderer.ctx, d = s.foundry;
  for (const [i, bridge] of d.bridges.entries()) {
    const from = Math.max(bridge.start, renderer.cameraX - 40), to = Math.min(bridge.end, renderer.cameraX + 1640);
    if (to > from) {
      const points = []; for (let x = from; x < to; x += 12) points.push([x, foundrySurfaceAt(s, x).groundY]); points.push([to, foundrySurfaceAt(s, to).groundY]);
      c.beginPath(); c.moveTo(...points[0]); for (const p of points.slice(1)) c.lineTo(...p);
      for (const p of [...points].reverse()) c.lineTo(p[0], p[1] + 18); c.closePath(); c.fillStyle = '#596b70'; c.fill();
      c.beginPath(); c.moveTo(...points[0]); for (const p of points.slice(1)) c.lineTo(...p); c.strokeStyle = bridge.temperature > 65 ? '#da9b61' : '#99c0ad'; c.lineWidth = 4; c.stroke();
      for (let x = from + 8; x < to - 12; x += 30) line(c, x, foundrySurfaceAt(s, x).groundY + 3, x + 10, foundrySurfaceAt(s, x + 10).groundY + 15, '#354b53', 2);
      label(c, `TABLIER ${i + 1} · ${Math.round(bridge.temperature)} °C`, (from + to) / 2, foundrySurfaceAt(s, (from + to) / 2).groundY + 41, 9, '#e1bd82');
    }
    if (renderer.visible(bridge.valve.x, 180)) {
      const v = bridge.valve, state = v.destroyed ? 'destroyed' : bridge.circuitOpen ? 'open' : bridge.steam.phase === 'jet' ? 'jet' : bridge.steam.phase === 'warning' ? 'warning' : 'closed';
      drawFoundryAsset(c, { part: 'steam-valve', state, x: v.x, y: v.y + v.h / 2, width: v.w, height: v.h, progress: v.progress });
      label(c, bridge.circuitOpen ? 'CIRCUIT ISOLÉ · REFROIDISSEMENT EN COURS' : v.destroyed ? 'VANNE PERDUE · TABLIER CHAUD' : 'VANNE DU CIRCUIT · ANCRAGE 4 S', v.x, v.y - v.h / 2 - 23, 9); work(c, v, v.x, v.y - v.h / 2 - 16); hp(c, v);
    }
    const steam = bridge.steam;
    if (renderer.visible(steam.x, 240)) {
      const y = foundrySurfaceAt(s, steam.x).groundY;
      c.fillStyle = '#293c43'; c.fillRect(steam.x - 30, y - 10, 60, 12);
      if (steam.phase === 'warning' || steam.phase === 'jet') {
        // Labels and solid hazard bounds remain visible with reduced motion.
        const active = steam.phase === 'jet', height = active ? 196 : 45;
        c.fillStyle = active ? '#c5d1c22b' : '#e9b96625'; c.fillRect(steam.x - 135, y - height, 270, height);
        for (let j = 0; j < 7; j++) {
          const x = steam.x - 40 + j * 13;
          line(c, x, y - 10, x + (j - 3) * 16, y - height + (renderer.options?.reducedMotion ? 0 : Math.sin(t * 8 + j) * 8), active ? '#d4d8c6a6' : '#c3b88b77', active ? 4 : 2);
        }
        label(c, active ? 'JET DE VAPEUR · ZONE CHAUDE' : 'AVERTISSEMENT · VAPEUR IMMINENTE', steam.x, y - height - 15, 10, active ? '#f1c886' : '#e2b66c');
      }
    }
  }
  for (const bay of d.bays) {
    if (renderer.visible(bay.x, 360)) {
      const selected = s.campaign.plan === bay.kind, transfer = d.cargo.find(cargo => cargo.transfer.working);
      drawFoundryAsset(c, { part: 'transfer-crane', state: bay.kind === 'quarantine' ? 'quarantine' : selected && s.campaign.operationsResolved ? 'received' : selected && transfer ? 'working' : 'idle',
        x: bay.x + 245, y: terrainAt(bay.x + 245, s.planetId), scale: .9, progress: transfer?.transfer.progress || 0 });
      line(c, bay.x - 170, bay.y + 5, bay.x + 170, bay.y + 5, selected ? '#d6bd85' : '#6b8682', 4);
      label(c, bay.kind === 'deliver' ? 'FONDERIE CENTRALE' : 'BAIE DE QUARANTAINE', bay.x, bay.y - 242, 12, selected ? '#e2c591' : '#97afa5');
    }
    // The control post has its own visibility bounds, independent of the bay.
    if (renderer.visible(bay.postX, 190)) {
      const y = terrainAt(bay.postX, s.planetId), selected = s.campaign.plan === bay.kind;
      drawFoundryAsset(c, { part: 'analysis-console', state: selected && d.cargo.some(cargo => cargo.transfer.working) ? 'working' : selected && s.campaign.operationsResolved ? 'complete' : 'idle', x: bay.postX, y, scale: .45 });
      label(c, selected ? 'POSTE DE TRANSFERT · UNE CAISSE À LA FOIS' : 'POSTE DE RÉCEPTION', bay.postX, y - 69, 9);
      const pending = d.cargo.find(cargo => cargo.transfer.working || cargo.transfer.elapsed > 0 && !cargo.transferred);
      if (selected && pending) work(c, pending.transfer, bay.postX, y - 60);
    }
  }
  for (const [post, title, complete] of [[d.orders, s.decision.resolved ? 'DESTINATION ENREGISTRÉE' : 'POSTE DE RÉCEPTION · CHOIX DE LA BAIE', s.decision.resolved],
    [d.report, d.report.transmitted ? 'RÉCEPTION TRANSMISE' : 'LIAISON DE RAPPORT FINAL', d.report.transmitted]]) {
    if (!renderer.visible(post.x, 200)) continue;
    drawFoundryAsset(c, { part: 'analysis-console', state: complete ? 'complete' : post.working ? 'working' : 'idle', x: post.x, y: post.y + post.h / 2, width: post.w, height: post.h, progress: post.progress || 0 });
    label(c, title, post.x, post.y - post.h / 2 - 25, 9); if (post.working) work(c, post, post.x, post.y - post.h / 2 - 17);
  }
}

export function drawFoundryCarrier(renderer, s) {
  const c = renderer.ctx, d = s.foundry, carrier = d.carrier;
  if (renderer.visible(carrier.x, 330)) {
    if (!drawPaintedIndustrialCarrier(c, carrier, { reducedMotion: renderer.combatReducedMotion === true })) {
    for (const wheel of carrier.wheels) {
      line(c, wheel.x, carrier.y + 15, wheel.x, wheel.y, '#354a51', 6);
      c.beginPath(); c.arc(wheel.x, wheel.y, wheel.radius, 0, Math.PI * 2); c.fillStyle = '#24383f'; c.fill(); c.strokeStyle = '#b6baa3'; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.arc(wheel.x, wheel.y, 7, 0, Math.PI * 2); c.fillStyle = '#76928c'; c.fill();
      const angle = carrier.distance / wheel.radius;
      line(c, wheel.x - Math.cos(angle) * 11, wheel.y - Math.sin(angle) * 11, wheel.x + Math.cos(angle) * 11, wheel.y + Math.sin(angle) * 11, '#b2bba3', 2);
    }
    drawFoundryAsset(c, { part: 'industrial-carrier', state: carrier.destroyed ? 'destroyed' : carrier.hp < carrier.maxHp * .6 ? 'damaged' : carrier.speed > 0 ? 'moving' : 'parked', wheels: false,
      x: carrier.x, y: carrier.y + 50, width: carrier.w, height: 100 });
    }
    label(c, `PORTEUR INDUSTRIEL · ${carrier.destroyed ? 'PERDU' : `${Math.round(carrier.hp / carrier.maxHp * 100)} %`}`, carrier.x, carrier.y - 145, 10);
    work(c, carrier.release, carrier.x, carrier.y - 133); hp(c, carrier);
    const m = d.manifest;
    drawFoundryAsset(c, { part: 'cargo-manifest', state: m.destroyed ? 'destroyed' : m.copied ? 'copied' : 'sealed', x: m.x, y: m.y + m.h / 2, width: m.w, height: m.h });
    work(c, m, m.x, m.y - m.h / 2 - 7);
    if (d.analysis.working) { label(c, `TESS · ANALYSE ${pct(d.analysis.progress)} %`, carrier.x, carrier.y - 170, 10, '#a9d0b9'); work(c, d.analysis, carrier.x, carrier.y - 160); }
  }
  for (const [i, cargo] of d.cargo.entries()) {
    if (!renderer.visible(cargo.x, 150)) continue;
    if (!drawPaintedIndustrialCargo(c, cargo)) drawFoundryAsset(c, { part: 'serial-cargo', state: cargoState(cargo), x: cargo.x, y: cargo.y + cargo.h / 2, width: cargo.w, height: cargo.h });
    label(c, `CAISSE ${i + 1} · ${cargoIntegrity(cargo)}`, cargo.x, cargo.y - cargo.h / 2 - 30, 8);
    label(c, cargo.transferred ? 'TRANSFERT ACQUIS' : cargo.markingCopied ? 'MARQUAGE CONSERVÉ' : cargo.inspected ? 'CONSTAT SANS MARQUAGE' : 'MARQUAGE À RELEVER', cargo.x, cargo.y - cargo.h / 2 - 18, 7, '#b6c4b2', 150);
    work(c, cargo.marking.working ? cargo.marking : cargo.transfer, cargo.x, cargo.y - cargo.h / 2 - 10); hp(c, cargo);
  }
}

export function drawFoundryInstrument(renderer, s) {
  const c = renderer.ctx, v = foundrySummary(s), x = 800, y = 106;
  c.fillStyle = '#162b30eb'; c.fillRect(x - 390, y, 780, 103); line(c, x - 390, y, x + 390, y, '#c5a870', 2);
  label(c, v.stage, x, y + 21, 12, '#e3c798', 760);
  label(c, `${v.carrier} · ${v.destination}`, x, y + 42, 10, '#bacac0', 760);
  label(c, v.thermal, x, y + 62, 9, '#cbb489', 760);
  label(c, v.provenance, x, y + 83, 10, '#accab6', 760);
}
