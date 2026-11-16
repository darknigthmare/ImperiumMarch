#!/usr/bin/env node
/** Add the MI14 production slice while keeping the 0.14.1 identifiers intact. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data/bible.json');
const bible = JSON.parse(fs.readFileSync(file, 'utf8'));
assert.ok(['0.14.1', '0.15.0'].includes(bible.meta.version), 'Unexpected Bible version');
// The baseline is a frozen local reconstruction. Its original commit may not
// exist in a clone published from its tree; never recreate it from current rows.
const historic = 'fc9f4af4e103adf93d4310053610ca69bea443b3';
const fixture = JSON.parse(fs.readFileSync(path.join(root, 'tests/fixtures/bible-v014-ids.json'), 'utf8'));
assert.equal(fixture.format, 'ordre-de-cendre.bible-id-baseline');
assert.equal(fixture.version, 1);
assert.equal(fixture.sourceVersion, '0.14.1');
assert.equal(fixture.sourcePath, 'data/bible.json');
assert.equal(fixture.sourceRevision, historic);
assert.equal(fixture.sourceSha256, 'ca198b22793fd01dd5ec3d5e2aed316b8e73449993f2161d65255bd14aa79792');
const priorIds = fixture.sheets.flatMap(s => s.ids);
assert.equal(fixture.idCount, 977);
assert.equal(priorIds.length, 977);
assert.equal(new Set(priorIds).size, 977);
const historicAvailable = spawnSync('git', ['cat-file', '-e', `${historic}:data/bible.json`], {cwd:root, stdio:'ignore'}).status === 0;
if (historicAvailable) {
  const raw = execFileSync('git', ['show', `${historic}:data/bible.json`], {cwd:root});
  const previous = JSON.parse(raw);
  assert.equal(previous.meta.version, '0.14.1');
  assert.equal(createHash('sha256').update(raw).digest('hex'), fixture.sourceSha256);
  assert.equal(execFileSync('git', ['rev-parse', `${historic}^{tree}`], {cwd:root, encoding:'utf8'}).trim(), fixture.sourceTree);
  assert.equal(execFileSync('git', ['rev-parse', `${historic}:data/bible.json`], {cwd:root, encoding:'utf8'}).trim(), fixture.sourceBlob);
  assert.deepEqual(previous.sheets.map(s => ({name:s.name, ids:s.rows.map(r => r.id)})), fixture.sheets);
}
const sheet = name => bible.sheets.find(s => s.name === name);
const get = id => bible.sheets.flatMap(s => s.rows).find(r => r.id === id);
const add = (name, row) => {
  const existing = get(row.id);
  if (existing) { const status = existing.status; Object.assign(existing, row); if (name === 'QA' && status === 'Vérifié') existing.status = status; }
  else sheet(name).rows.push(row);
};
const proto = 'Prototype', pending = 'À produire';
Object.assign(bible.meta, {version:'0.15.0', date:'2026-11-16',
  scope:'MI01–MI14 jouables au stade prototype, six châssis, trois opérations autonomes et dossier v14. MI15–MI32 et les seize contrats restent conçus. Les 977 IDs de la reconstruction 0.14.1 et les 133 critères initiaux sont conservés. MI14 reçoit le piquet ouvrier, le refroidisseur et des conséquences locales ; essais natifs et humains gardent une réception distincte.'});
Object.assign(bible.meta.release, {playableCampaignMissions:Array.from({length:14}, (_,i)=>`MI${String(i+1).padStart(2,'0')}`), remainingCampaignMissionDesigns:18, saveFormatVersion:14});
bible.meta.previousRelease = {version:'0.14.1', recordCount:977, sourceRevision:historic, ids:'tests/fixtures/bible-v014-ids.json'};
bible.meta.productionBaseline.registry = 'docs/validation/production-v015-registry.json';
sheet('Campagne').description = '32 missions principales : MI01–MI14 jouables au stade prototype ; 18 autres conçues. OP01–OP03 restent autonomes.';
sheet('Prototype').description = 'Portée présente dans le code de la version 0.15.0. Les capacités finales des catalogues restent distinctes. Les limites de chaque fiche décrivent le travail ouvert.';
Object.assign(get('MI14'), {play:'Ouvrir un passage consenti dans le piquet, neutraliser l’automate, isoler puis réparer le refroidisseur. Agir sur la commande de l’atelier après le choix.',
  truth:'Huit ouvriers refusent un lot saboté. Trois viennent de Nacre, avec une arrivée antérieure au recensement MI05–MI08. Explication, copie locale et recoupement PT03 restent séparés.',
  consequence:'Arrêt maintenu ou redémarrage accompli. Pertes et refroidisseur persistent. Coopération et accès aux mécaniciens exigent une demande réellement achevée.', status:proto});
get('PL04').terrain = 'Chaleur, vapeur annoncée et surfaces industrielles. MI13 simule convoi et tabliers ; MI14 ajoute piquet et circuit du refroidisseur. MI15–MI16 restent conçues.';
get('AS19').spec = 'Roches, installations et phénomènes de chaleur et glace. Kharon dispose des kits MI13 et MI14 avec géométrie SVG/Canvas commune. Sereis et la finition complète restent à produire.';
get('PR18').deliverable = 'MI09–MI16 et CT05–CT08. MI09–MI14 sont jouables au stade prototype ; MI15–MI16, les quatre contrats et la défection de MI16 restent à produire.';
get('PR97').deliverable = 'Produire MI15–MI16, achever le kit Kharon et recevoir les sensations thermiques des missions MI13–MI14 dans des essais humains.';
get('PR97').acceptance = 'Les prototypes MI13 et MI14 ne clôturent ni le kit final ni la réception humaine de Kharon.';
get('PX115').limits = 'Sereis, MI15–MI16, les effets finaux et la réception humaine du kit restent à produire. Le kit MI14 est décrit séparément.';
const systems = [
 ['SY128','MI14 — passage du piquet','Une demande ancrée de 3 s ouvre le déplacement des huit ouvriers vers une galerie hors des appuis.','Attendre leur trajet réel. Les pas, tirs et explosions conservent leurs pertes.','Aucune téléportation au dialogue ; les six châssis peuvent franchir sans perte.'],
 ['SY129','MI14 — personnes locales','Huit ouvriers distincts, dont deux mécaniciens et trois déplacés de Nacre arrivés avant le recensement connu.','Aucun survivant, mort ou passager des MI05–MI08 n’est réemployé sous une nouvelle identité.','Identité, origine, vie, départ et arrivée restent suivis individuellement.'],
 ['SY130','MI14 — automate de sécurité','L’approche déclenche une alerte de 5 s avant l’activation de l’automate.','Aucune cible ni collision active avant son arrivée. Neutralisation physique requise.','Le rendu, la visée et les dégâts suivent le même état d’activation.'],
 ['SY131','MI14 — circuit de froid','Inspecter le refroidisseur 3 s, isoler sa vanne 4 s puis réparer 8 s sous ancrage.','Un déplacement interrompt le travail. Une machine détruite exige un constat sans résurrection.','Chaque opération garde sa durée et ses conditions ; pause et reprise conservent l’état.'],
 ['SY132','MI14 — pièces et paroles','Recueillir l’explication en 4 s et copier le registre du lot en 4 s sont deux actes distincts.','Une source perdue ne produit pas de copie. Une copie acquise reste à bord après la perte de son original.','Le sabotage local ne crée aucun nouvel identifiant PT, TE ou PO.'],
 ['SY133','MI14 — commande d’atelier','Choisir redémarrage ou maintien de l’arrêt, puis agir 5 s sur la commande matérielle.','Le choix ne répare rien et n’exécute pas la commande. Une destruction produit une issue dégradée.','Le bilan distingue ordre, action accomplie, froid disponible et pertes.'],
 ['SY134','MI14 — coopération','Après arrêt maintenu et froid réparé, achever une demande de coopération de 3 s aux ouvriers vivants.','Un mécanicien disponible n’est ni recruté ni transporté ; sa perte retire sa disponibilité future.','L’accès aux mécaniciens et la confiance de Tess reflètent les actes effectivement accomplis.'],
 ['SY135','Dossier v14 — continuité','La migration v13 ajoute seulement le dossier atelier de Kharon vide et la version.','Premier rapport immuable, quatre lots une seule fois, relecture indépendante et défaite terminale.','Treize rapports, stocks et checkpoints historiques conservés ; scènes MI14 rapprochées de leurs faits.'],
];
for(const [id,system,design,counterplay,acceptance] of systems) add('Systèmes',{id,system,design,counterplay,acceptance,priority:'P1',status:proto});
const narratives = [
 ['NA95','Lieu habité','L’atelier des mains noires','Le piquet protège l’atelier contre l’expédition d’un lot saboté. Le travail, la grève et la sécurité matérielle restent des enjeux distincts.','MI14 ; explication recueillie ; registre effectivement copié.'],
 ['NA96','Provenance','Déplacés de Nacre','Trois ouvriers sont arrivés avant le recensement connu. Leur origine n’établit aucune identité commune avec les habitants, passagers ou patients des sorties précédentes.','MI14 ; cohorte locale propre à l’atelier.'],
 ['NA97','Relation','Tess devant le froid et le piquet','Tess réagit au refroidisseur, au traitement des ouvriers et à l’issue réelle de l’atelier. Une simple sélection de dialogue ne lui fournit aucun acte accompli.','MI14 ; réparation, pertes, commande et coopération.'],
 ['NA98','Conséquence','Un arrêt qui reste local','Le maintien de la grève peut ouvrir une coopération. Il ne constitue ni recrutement, ni diffusion publique, ni témoignage TE02, ni défection.','MI13 pour le recoupement PT03 acquis ; MI14 pour les faits locaux.'],
];
for(const [id,type,name,rule,sources] of narratives) add('Narration',{id,type,name,rule,sources,status:proto});
const productions = [
 ['PR98','Mission MI14','Piquet, automate, refroidisseur, registre, deux conduites et coopération dans une sortie complète.','MI13 ; SY128–SY135','Chaque issue provient d’actions physiques et conserve les pertes jusqu’à l’extraction.',proto],
 ['PR99','Atelier et interface','Kit original de l’atelier, personnes et machines ; HUD, choix et bilan reliés à la simulation.','PR98 ; AS19','Rendu, instruments et reçus décrivent les mêmes corps, états et travaux.',proto],
 ['PR100','Réception humaine MI14','Éprouver passage du piquet, protection des ouvriers, réparation et lecture des conséquences.','PR98 ; PR99 ; QA230 ; QA231','Parcours natif et essai humain documentés séparément, sans les déduire des tests automatiques.',pending],
];
for(const [id,workstream,deliverable,depends,acceptance,status] of productions) add('Production',{id,workstream,deliverable,depends,acceptance,priority:'P1',status});
const prototypes = [
 ['PX117','MI14 ; SY128–SY130','Piquet et sécurité','Huit personnes locales, demande de passage, trajet vers la galerie et automate après alerte.','Animation finale, voix et sensations humaines encore ouvertes.','src/workshop-simulation.mjs'],
 ['PX118','MI14 ; SY131–SY133','Atelier sous contrôle','Inspection, vanne, réparation et commande de reprise ou maintien de l’arrêt.','Le prototype local ne couvre pas toute la production industrielle de Kharon.','src/workshop-simulation.mjs'],
 ['PX119','MI14 ; NA95–NA98','Faits et coopération','Explication, copie, recoupement conditionnel PT03, demande aux mécaniciens et réaction de Tess.','Aucun nouvel élément global PALINODE ni recrutement.','src/workshop-simulation.mjs ; src/main.mjs'],
 ['PX120','MI14 ; SY135','Dossier v14','Migration additive, checkpoints, validation des faits et premier rapport unique.','Le dossier conserve les absences et pertes ; les missions suivantes restent conçues.','src/campaign.mjs ; src/workshop-validation.mjs'],
 ['PX121','MI14 ; PR99','Kit de l’atelier','Formes SVG et Canvas communes, personnes et machines dans leurs états simulés.','Banc graphique, rendu Canvas, DOM modélisé et navigateur sont des preuves distinctes.','src/workshop-assets.mjs ; src/workshop-renderer.mjs'],
];
for(const [id,link,name,implemented,limits,path] of prototypes) add('Prototype',{id,link,name,implemented,limits,path,status:proto});
const qa = [
 ['QA222','Parcours MI14','Achever les deux conduites avec les six châssis.','Passage, automate, refroidisseur, commande, rapport et extraction restent atteignables.'],
 ['QA223','Piquet MI14','Demander le passage, suivre les personnes puis comparer tirs, explosions et pas.','Trajets réels, pertes persistantes et cohorte locale sans transfert des habitants de Nacre.'],
 ['QA224','Automate MI14','Approcher puis viser avant et après les 5 s d’alerte.','Comportement, cible, collisions et dessin inactifs avant arrivée ; neutralisation réelle ensuite.'],
 ['QA225','Froid MI14','Interrompre inspection, vanne et réparation, suspendre puis reprendre ou détruire un organe.','Durées 3/4/8 s respectées ; absence de réparation fictive ; pause et reprise exactes.'],
 ['QA226','Sources MI14','Dissocier explication et copie, perdre la source avant/après copie et comparer l’héritage PT03.','Aucune donnée reconstituée ; recoupement conditionnel et aucun nouveau PT, TE ou PO.'],
 ['QA227','Conduites MI14','Choisir les deux issues, agir sur la commande puis demander la coopération.','Le choix seul ne modifie pas l’atelier ; accès aux mécaniciens seulement après actes et survivants.'],
 ['QA228','Dossier MI14','Migrer le v13 historique, reprendre une scène, falsifier un reçu, rejouer puis relire le premier rapport.','Treize rapports préservés, imports contradictoires rejetés, reprise exacte et dotation unique.'],
 ['QA229','Affichage MI14','Rapprocher les états dessinés, le HUD, le choix et le bilan de leurs états simulés.','Les contrôles automatiques de rendu et de DOM ont une portée explicite distincte du navigateur.'],
 ['QA230','Navigateur MI14','Jouer les étapes MI14 dans un navigateur réel et examiner pause, reprise, petite fenêtre et export.','Environnement, gestes réellement exécutés et limites consignés ; aucun test DOM substitué.'],
 ['QA231','Essai humain MI14','Faire parcourir les deux conduites à une personne avec un châssis déclaré.','Lisibilité du piquet, protection des personnes et clarté des conséquences reçues sur cet essai.'],
];
for(const [id,area,scenario,expected] of qa) add('QA',{id,area,scenario,expected,priority:'P1',status:pending});
bible.meta.recordCount = bible.sheets.reduce((n,s)=>n+s.rows.length,0);
assert.equal(bible.meta.recordCount,1007);
const ids = bible.sheets.flatMap(s=>s.rows.map(r=>r.id));
assert.equal(new Set(ids).size,ids.length);
assert.ok(priorIds.every(id=>ids.includes(id)));
assert.deepEqual(bible.sheets.map(s => s.name), fixture.sheets.map(s => s.name));
for (const previous of fixture.sheets) {
  assert.deepEqual(sheet(previous.name).rows.slice(0, previous.ids.length).map(r => r.id), previous.ids);
}
fs.writeFileSync(file,JSON.stringify(bible,null,2)+'\n');
const col = n => String.fromCharCode(65+n);
const ranges = [];
function preview(name,first,last,filename){
 const spec=sheet(name), from=spec.rows.findIndex(r=>r.id===first)+7, to=spec.rows.findIndex(r=>r.id===last)+7;
 assert.ok(from>=7 && to>=from);
 ranges.push({sheetName:name,range:`A${from}:${col(spec.columns.length-1)}${to}`,file:filename});
}
for(const [name,first,last,file] of [
 ['Campagne','MI14','MI14','mi14.png'],['Planètes','PL04','PL04','kharon.png'],['Assets','AS19','AS19','kit-kharon.png'],
 ['Production','PR18','PR18','acte-deux.png'],['Production','PR97','PR97','kharon-reception.png'],['Prototype','PX115','PX115','kit-mi13-limites.png'],
 ['Systèmes','SY128','SY131','systemes-piquet.png'],['Systèmes','SY132','SY135','systemes-atelier.png'],
 ['Narration','NA95','NA98','recit-atelier.png'],['Production','PR98','PR100','production-mi14.png'],
 ['Prototype','PX117','PX119','prototype-atelier.png'],['Prototype','PX120','PX121','prototype-dossier.png'],
 ['QA','QA222','QA225','qa-simulation.png'],['QA','QA226','QA229','qa-sources-dossier.png'],['QA','QA230','QA231','qa-natif-humain.png'],
]) preview(name,first,last,file);
fs.writeFileSync(path.join(root,'data/bible-v015-previews.json'),JSON.stringify({sheets:['Synthèse'],ranges},null,2)+'\n');
console.log(JSON.stringify({version:bible.meta.version,rows:bible.meta.recordCount,added:ids.length-priorIds.length,baseline:historic,historicalSourceCompared:historicAvailable,previews:1+ranges.length}));
