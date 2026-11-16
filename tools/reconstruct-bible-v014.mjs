/** Reconstruct the missing 0.13/0.14 design rows without rewriting the 0.12 history. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = '0f77235f7545f33b1a4f298b81a44ee2122d46dc';
const git = (...args) => execFileSync('git', args, { cwd: root });
const original = git('show', `${base}:data/bible.json`), baseline = JSON.parse(original);
const file = resolve(root, 'data/bible.json'), b = JSON.parse(fs.readFileSync(file));
if (b.meta.version !== '0.12.0') throw Error('Reconstruction applies once to the authentic 0.12.0 source. The current Bible and its receipts are preserved.');
const sheet = name => b.sheets.find(s => s.name === name);
const row = id => b.sheets.flatMap(s => s.rows).find(r => r.id === id);
const add = (name, record) => { const target = sheet(name); if (!target.rows.some(r => r.id === record.id)) target.rows.push(record); };
const patch = (id, fields) => Object.assign(row(id), fields);
const proto = 'Prototype', pending = 'À produire';
const systems = [
  ['SY112','MI12 — fenêtre de copie','Une fenêtre de 45 s s’ouvre au troisième relais ; une copie complète exige 24 s à portée sous ancrage.','Quitter les appuis interrompt le travail ; revenir ne restaure pas le temps consommé.','Une copie incomplète ne livre aucun texte.'],
  ['SY113','MI12 — trois relais physiques','Chaque relais possède coque, inspection, effacement ou isolement et dates propres.','Un appareil détruit reste une perte constatée, sans opération fictive.','Le choix ne modifie pas automatiquement les trois corps.'],
  ['SY114','MI12 — Prétoire VE12','Le quadrupède apparaît après une alerte de 6 s ; ses quatre pieds, sa coque, son capteur et son verrou sont simulés.','Désactiver le capteur ou le verrou modifie réellement son attaque ou sa mobilité.','Aucune cible, collision ou silhouette active avant l’arrivée.'],
  ['SY115','MI12 — trois conduites','Purge des trois relais, conservation clandestine du troisième ou refus ouvert avec isolement des trois.','Les pertes peuvent dégrader chaque branche ; aucune décision ne répare un relais.','Rapport puis extraction physique nécessaires.'],
  ['SY116','MI12 — copie embarquée','Une copie complète devient une pièce conservée à bord, distincte de son original.','Détruire la source avant copie interdit la lecture ; la perte après copie conserve la pièce.','Le rapport et les archives ne dévoilent que les mots acquis.'],
  ['SY117','MI12 — conséquences locales','Ilan réagit aux commandes réellement vues ; Holt enregistre la conduite choisie et le refus ferme le refuge impérial.','Aucun témoignage inventé quand la copie manque.','Aucune défection ou preuve politique globale anticipée.'],
  ['SY118','Dossier v12 — migration additive','Ajouter seulement le dossier vide des relais de Thyr et la version aux sauvegardes v11.','Les imports contradictoires sont refusés avant remplacement du dossier courant.','Onze rapports, ressources, équipage, flotte et checkpoints conservés.'],
  ['SY119','MI12 — bilans et relectures','Le premier rapport attribue quatre lots et devient immuable ; une relecture reste indépendante.','Une défaite demeure terminale à la reprise.','Pas de double dotation ni de réécriture d’une source perdue.'],
  ['SY120','MI13 — porteur industriel','Deux caisses distinctes suivent un porteur à quatre roues calculées depuis les surfaces du moteur.','La perte du porteur termine la sortie ; une caisse perdue est consignée séparément.','La position des roues dessinées vient de la simulation.'],
  ['SY121','MI13 — contacts thermiques','Deux tabliers fixes portent les vrais pieds et les roues. La conduction exige un contact réel.','Ambiance, contact et vapeur sont comptés séparément ; changer de châssis conserve ses appuis.','Un pied en l’air ne conduit pas la chaleur du pont.'],
  ['SY122','MI13 — vannes et refroidissement','Une manœuvre ancrée de 4 s isole un circuit et abaisse progressivement le tablier de 90 à 28 °C.','Un mouvement interrompt le travail ; une vanne détruite ne refroidit pas magiquement le pont.','La vanne coupe le jet et le pont refroidit sans saut instantané.'],
  ['SY123','MI13 — vapeur annoncée','Cycle de 3 s d’avertissement, 2 s de jet et 7 s de repos, piloté par l’horloge simulée.','Le réglage de mouvements réduits conserve le signe du danger réel.','Pause, reprise et affichage décrivent la même phase.'],
  ['SY124','MI13 — provenance PT03','Copier les deux marquages en 3 s chacun, le bordereau en 4 s, puis achever l’analyse de Tess en 8 s.','Les constats de pertes ne remplacent pas les sources ; les copies acquises survivent aux originaux.','PT03 exige toutes les pièces et reste possible sans PT01.'],
  ['SY125','MI13 — transfert physique','Choisir le dépôt ou la quarantaine, escorter le porteur puis transférer chaque caisse pendant 5 s.','Le transfert interrompu conserve son état physique ; reprendre exige une nouvelle interaction.','Aucune téléportation au choix ; rapport de 3 s puis extraction.'],
  ['SY126','Dossier v13 — migration additive','Ajouter seulement Kharon et son dossier de fonderie vide aux dossiers v12.','Le reçu réconcilie corps, travaux, dates, sources, stocks et destination.','Douze rapports et tous les états historiques conservés.'],
  ['SY127','Armement — sécurité thermique','Le HUD et le réticule suivent immédiatement ventilation et verrou de surchauffe.','La ventilation suspend le tir ; le verrou se lève strictement sous 48 %.','Aucun tir durant la sécurité ; le nombre de munitions reste indépendant.'],
];
for (const [id, system, design, counterplay, acceptance] of systems) add('Systèmes', { id, system, design, counterplay, acceptance, priority:'P1', status:proto });
const narratives = [
  ['NA87','Pièce locale','Commandes du troisième relais','Une copie complète démontre des commandes industrielles locales ; elle ne résout pas toute la chaîne PALINODE.','MI12 ; copie du troisième relais.'],
  ['NA88','Réaction','Ilan devant les pièces','Ilan reconnaît les ordres seulement s’ils ont été copiés ; en leur absence il parle des faits et des limites du constat.','MI12 ; bilan réellement transmis.'],
  ['NA89','Conséquence','Holt et le refuge impérial','La purge, la conservation clandestine et le refus ouvert ont des conséquences distinctes. Le refus ferme le refuge sans réaliser la défection MI16.','MI12 ; choix et opérations physiques.'],
  ['NA90','Provenance','Mémoire embarquée','Une copie acquise reste distincte de son original. Une destruction ultérieure ne réécrit pas ce qui a été vu et copié.','MI12 ; dossier v12 ; archives conditionnelles.'],
  ['NA91','Pièce technique','PT03 — série industrielle','Les deux marquages, le bordereau et l’analyse donnent une provenance industrielle locale, distincte des preuves politiques futures.','MI13 ; deux caisses ; bordereau ; Tess.'],
  ['NA92','Recoupement','Parcours sans PT01','PT03 peut être acquis quand le journal MI04 a été perdu. Les rapports conservent explicitement cette absence.','MI04–MI13 ; sources effectivement acquises.'],
  ['NA93','Recoupement','Ordres et fabrication','Rapprocher PT01 et les commandes MI12 seulement si leurs copies existent réellement ; aucune citation n’est reconstruite après perte.','MI12 ; MI13 ; archives embarquées.'],
  ['NA94','Conséquence','Dépôt ou quarantaine','La destination choisie ne remplace pas le convoi et le transfert. Aucun dépôt n’impose une diffusion publique, un témoignage TE02 ou une défection.','MI13 ; état des caisses à l’extraction.'],
];
for(const [id,type,name,rule,sources] of narratives) add('Narration',{id,type,name,rule,sources,status:proto});
const productions = [
 ['PR92','Mission MI12','Relais, fenêtre de copie, Prétoire et trois conduites dans la campagne.','MI11 ; VE12 ; SY112–SY119','Les trois branches conservent leurs faits jusqu’au rapport et à la reprise.',proto],
 ['PR93','Graphisme MI12','Kit original de relais et Prétoire partagé entre SVG et Canvas.','PR92 ; VE12','Composants visibles et réellement visables ; corps absents avant arrivée.',proto],
 ['PR94','Réception MI12','Parcours automatiques, contrôles de sauvegarde et observations de la reconstruction.','PR92 ; PR93','Les preuves nouvellement exécutées restent distinctes des anciennes livraisons.',proto],
 ['PR95','Mission MI13','Porteur, deux caisses, ponts thermiques, provenance et deux destinations.','MI12 ; SY120–SY127','PT03 possible sans PT01 ; transferts et pertes restent physiques.',proto],
 ['PR96','Graphisme Kharon','Kit industriel, signalisation de vapeur et horizon de fonderie.','PR95 ; AS19','SVG/Canvas cohérents et roues/appuis provenant de la simulation.',proto],
 ['PR97','Réception finale Kharon','Production complète des missions MI14–MI16 et validation humaine des sensations thermiques.','PR95 ; PR96 ; MI14–MI16','La reconstruction MI13 ne clôt pas le kit final ni la réception humaine de Kharon.',pending],
];
for(const [id,workstream,deliverable,depends,acceptance,status] of productions) add('Production',{id,workstream,deliverable,depends,acceptance,priority:'P1',status});
const prototypes = [
 ['PX105','MI12; SY112','Copie sous délai','Fenêtre de 45 s, copie de 24 s, pertes et interruptions.','Équilibrage humain à recevoir.','src/relay-simulation.mjs'],
 ['PX106','MI12; VE12','Prétoire à composants','Coque, capteur, verrou et quatre pieds physiques ; arrivée différée.','Animations finales et variété du véhicule à produire.','src/relay-simulation.mjs; src/relay-renderer.mjs'],
 ['PX107','MI12; NA87–NA90','Conduites et pièces locales','Trois conduites, opérations physiques et texte conditionné à la copie.','La chaîne politique et la défection restent futures.','src/campaign.mjs; src/main.mjs'],
 ['PX108','MI12; SY118','Reprise v12','Migration additive depuis un export natif public v11.','La fixture est historique ; les tests reconstruits sont nouveaux.','src/relay-validation.mjs; tests/campaign-v12.test.mjs'],
 ['PX109','MI12; PR93','Relais SVG et Canvas','Géométrie commune des relais et du Prétoire.','Un banc graphique n’est pas une capture navigateur.','src/relay-assets.mjs; assets/relay'],
 ['PX110','MI12; PR94','Réception de la reconstruction','Driver par commandes publiques et vérifications dédiées.','Les résultats perdus 0.13 ne sont pas réutilisés comme preuve.','tests/mi12-simulation.test.mjs; docs/QA_RECONSTRUCTION_014.md'],
 ['PX111','MI13; SY120','Convoi industriel','Porteur à quatre roues, deux corps de caisses et transferts distincts.','Autres transports de Kharon encore conçus.','src/foundry-simulation.mjs'],
 ['PX112','MI13; SY121–SY123','Circuits thermiques','Deux ponts portant les appuis et roues, vannes et vapeur annoncée.','Équilibrage et sensations humaines encore ouverts.','src/foundry-simulation.mjs; src/foundry-renderer.mjs'],
 ['PX113','MI13; NA91–NA94','Provenance PT03','Marquages, bordereau, analyse et recoupements séparés.','Aucune chaîne politique globale ou publication automatique.','src/foundry-validation.mjs; src/main.mjs'],
 ['PX114','MI13; SY126','Reprise v13','Migration additive, pertes terminales et premier rapport immuable.','Tous les dossiers doivent rester validés contre leurs corps physiques.','src/campaign.mjs; tests/campaign-v13.test.mjs'],
 ['PX115','MI13; AS19','Kit de Kharon','Formes industrielles originales SVG/Canvas et horizon de fonderie.','Sereis, MI14–MI16 et le kit final restent à produire.','src/foundry-assets.mjs; assets/foundry; src/renderer.mjs'],
 ['PX116','MI13; PR95–PR97','Livraison reconstruite','Sources, HTML autonome, Bible et vérifications conservés sur GitHub.','Identité binaire des anciennes livraisons non revendiquée.','docs/RECONSTRUCTION_014.md; docs/QA_RECONSTRUCTION_014.md'],
];
for(const [id,link,name,implemented,limits,path] of prototypes) add('Prototype',{id,link,name,implemented,limits,path,status:proto});
const qa = [
 ['QA192','Migration MI12','Importer l’export natif v11 de la 0.12.','Onze rapports et leurs ressources sont préservés ; les dossiers MI12/MI13 sont ajoutés sans preuve inventée.'],
 ['QA193','Fenêtre MI12','Copier durant 24 s avant la fin de la fenêtre de 45 s.','Une copie achevée est acquise ; aucun fragment inachevé n’est déclaré complet.'],
 ['QA194','Interruption MI12','Interrompre puis reprendre la copie avant et après échéance.','Le travail incomplet repart de zéro et la fenêtre ne remonte pas.'],
 ['QA195','Pause MI12','Suspendre pendant une copie et reprendre depuis export.','Horloge, travail, alerte et corps identiques à la reprise.'],
 ['QA196','Conduites MI12','Achever les trois branches avec leurs opérations respectives.','Purge de trois relais, purge de deux avec un isolement et isolement des trois produisent des reçus distincts.'],
 ['QA197','Prétoire MI12','Viser avant arrivée puis après le délai d’alerte.','Aucune interaction physique avant arrivée ; vraie cible ensuite.'],
 ['QA198','Composants MI12','Atteindre capteur et verrou séparément.','Chaque composant modifie la fonction annoncée sans effacer les autres dégâts.'],
 ['QA199','Sources MI12','Détruire le troisième relais avant puis après copie.','Aucune commande inventée avant copie ; copie conservée après acquisition.'],
 ['QA200','Ilan et Holt','Comparer les bilans avec et sans copie et après refus.','Paroles conditionnées aux faits, refuge fermé seulement selon la conduite.'],
 ['QA201','Dossier MI12','Modifier les agrégats, dates, composants ou copies d’un export.','Import rejeté quand le dossier contredit les corps et travaux.'],
 ['QA202','Dotation MI12','Finir puis rejouer et importer à nouveau le rapport.','Quatre lots une seule fois et premier rapport inchangé.'],
 ['QA203','Défaite MI12','Perdre puis sauvegarder, recharger et recommencer.','La reprise reste une défaite ; recommencer est une action distincte.'],
 ['QA204','UI MI12','Utiliser les trois boutons, importer/exporter et ouvrir les archives.','Troisième choix distinct de MI08 ; seules les commandes acquises sont révélées.'],
 ['QA205','Graphisme MI12','Comparer formes SVG/Canvas et rendu des composants.','Même géométrie et états lisibles, aucune silhouette avant arrivée.'],
 ['QA206','Réception humaine MI12','Faire jouer les trois conduites à une personne.','Lisibilité, tension de copie et difficulté jugées sur un essai humain documenté.'],
 ['QA207','Migration MI13','Passer v12 vers v13 puis relire les douze rapports.','Ajout du dossier Kharon seulement ; ressources et conséquences inchangées.'],
 ['QA208','Contacts MI13','Comparer pieds plantés, pieds en vol et roues sur les tabliers.','Conduction seulement pour les contacts réels ; même surface dessinée et simulée.'],
 ['QA209','Vannes MI13','Manœuvrer, interrompre et reprendre chaque vanne.','4 s ancrées nécessaires ; refroidissement progressif de 90 vers 28 °C.'],
 ['QA210','Vapeur MI13','Observer avertissement, jet et repos, y compris mouvements réduits.','Cycle 3/2/7 s conservé ; danger perceptible pendant une pause visuelle.'],
 ['QA211','Embuscade MI13','Déclencher les forces privées et tirer avant leur arrivée.','Deux drones et une tourelle actifs seulement après 6 s.'],
 ['QA212','Sources MI13','Copier marquages et bordereau puis détruire les originaux.','Copies acquises conservées ; aucune copie après destruction préalable.'],
 ['QA213','Analyse MI13','Comparer toutes les combinaisons de pièces disponibles.','PT03 exige deux marquages, bordereau et analyse achevée de 8 s.'],
 ['QA214','Parcours alternatif','Jouer depuis l’ancienne MI04 avec journal détruit jusqu’à MI13.','PT03 possible sans PT01 ; absence conservée et aucun recoupement inventé.'],
 ['QA215','Transferts MI13','Choisir les deux destinations puis interrompre un transfert.','Le convoi rejoint la baie ; chaque transfert de 5 s conserve sa progression physique.'],
 ['QA216','Pertes MI13','Perdre caisse, bordereau ou porteur avant/après analyse.','Bilans dégradés cohérents ; perte du porteur terminale.'],
 ['QA217','Dossier MI13','Reprendre pause/transfert/défaite, falsifier un reçu et rejouer.','Reprise exacte, imports contradictoires refusés, quatre lots au premier rapport.'],
 ['QA218','Rendu MI13','Comparer SVG/Canvas et postes de transfert à bord d’écran.','État des caisses exact, vrais appuis, poste visible indépendamment de sa baie.'],
 ['QA219','Navigateur reconstruction','Exécuter les parcours MI12/MI13 dans un navigateur réel.','Entrées, DOM, rendu, pause, reprise, export et erreurs observés dans cet environnement.'],
 ['QA220','Réception humaine MI13','Faire jouer ponts chauds, convoi et provenance à une personne.','Lisibilité et sensations validées ; les tests automatiques ne remplacent pas cet essai.'],
 ['QA221','Conservation reconstruction','Publier code, jeu, Bible et preuves puis vérifier la référence distante.','Les octets reconstruits sont durables sur GitHub et distincts des artefacts perdus.'],
];
for(const [id,area,scenario,expected] of qa) add('QA',{id,area,scenario,expected,priority:'P1',status:pending});
patch('MI12',{play:'Relever trois relais, tenir une copie de 24 s dans une fenêtre de 45 s, neutraliser le Prétoire par sa coque/capteur/verrou puis accomplir purge3, purge2/isolement1 ou refus/isolement3.',status:proto});
patch('MI13',{play:'Escorter le porteur et ses deux caisses sur deux tabliers thermiques, isoler les circuits avec les vannes, défendre l’embuscade, copier les sources puis accomplir la livraison ou la quarantaine.',status:proto});
patch('PL03',{terrain:row('PL03').terrain+' MI12 ajoute les relais de commande et le Prétoire.'});
patch('PL04',{terrain:row('PL04').terrain+' MI13 simule le porteur, deux tabliers et leurs circuits. MI14–MI16 restent conçues.',status:proto});
patch('VE12',{encounter:'MI12 : quadrupède de sécurité, arrivée différée, coque et composants visables séparément. Variantes et finition finale à produire.',status:proto});
patch('AS19',{spec:row('AS19').spec+' Reconstruction : kit industriel Kharon intégré à MI13, géométrie SVG/Canvas commune. Sereis et le kit final restent à produire.',status:proto});
patch('PR18',{deliverable:'MI09–MI16 et CT05–CT08. MI09–MI13 sont jouables au stade prototype ; MI14–MI16, les quatre contrats et la défection de MI16 restent à produire.'});
patch('PR55',{deliverable:'PT03 local de MI13 reçu au stade prototype : marquages, bordereau et analyse. Recoupements conditionnels avec PT01 et les ordres MI12. Dépôt/publication globale restent futurs.',status:proto});
sheet('Campagne').description='32 missions principales : MI01–MI13 jouables au stade prototype ; 19 autres conçues. OP01–OP03 restent autonomes.';
sheet('Prototype').description='Portée présente dans le code de la version 0.14.1 reconstruite. Les capacités finales des catalogues restent distinctes. Les limites de chaque fiche décrivent le travail ouvert.';
b.meta.version='0.14.1';b.meta.date='2026-11-12';b.meta.recordCount=b.sheets.reduce((n,s)=>n+s.rows.length,0);
b.meta.scope='Reconstruction 0.14.1 depuis la 0.12 publique et les traces des livraisons perdues. Treize missions jouables, six châssis, trois opérations autonomes, dossier v13. MI14–MI32 et les seize contrats restent conçus. Les 905 IDs publics et les 133 critères de production sont conservés. Les nouveaux résultats décrivent cette reconstruction uniquement.';
b.meta.release.playableCampaignMissions=Array.from({length:13},(_,i)=>'MI'+String(i+1).padStart(2,'0'));
b.meta.release.remainingCampaignMissionDesigns=19;b.meta.release.saveFormatVersion=13;
b.meta.previousRelease={version:'0.12.0',recordCount:905,sourceRevision:base,ids:'tests/fixtures/bible-v012-ids.json'};
b.meta.productionBaseline.registry='docs/validation/production-v014-registry.json';
b.meta.reconstruction={date:'2026-11-12',sourceRevision:base,lostVersions:['0.13.0','0.14.0'],binaryIdentityRecovered:false,note:'Les 72 IDs de travail attendus sont reconstruits depuis les spécifications connues. Les textes sont rédigés à nouveau ; les résultats perdus ne sont pas revendiqués comme exécutés.'};
fs.writeFileSync(file,JSON.stringify(b,null,2)+'\n');
const fixture={format:'ordre-de-cendre.bible-id-baseline',version:1,sourceVersion:'0.12.0',sourcePath:'data/bible.json',provenance:'Copied byte-for-byte from the authentic public 0.12 commit; no reconstructed 0.14.1 row contributes to this historical baseline.',sourceRevision:base,sourceTree:git('rev-parse',base+'^{tree}').toString().trim(),sourceBlob:git('rev-parse',base+':data/bible.json').toString().trim(),sourceSha256:createHash('sha256').update(original).digest('hex'),idCount:905,sheets:baseline.sheets.map(s=>({name:s.name,ids:s.rows.map(r=>r.id)}))};
fs.writeFileSync(resolve(root,'tests/fixtures/bible-v012-ids.json'),JSON.stringify(fixture,null,2)+'\n');
console.log(JSON.stringify({version:b.meta.version,rows:b.meta.recordCount,preserved:905,added:b.meta.recordCount-905}));
