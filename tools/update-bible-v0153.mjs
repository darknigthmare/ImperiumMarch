#!/usr/bin/env node
/** Record the received painted walker patch without changing status or acceptance claims. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const file = path.join(root, 'data/bible.json');
const source = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!['0.15.2', '0.15.3'].includes(source.meta.version)) throw new Error('Expected the painted combat source or its 0.15.3 walker patch.');
const before = structuredClone(source);
const beforeIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (source.sheets.length !== 20 || beforeIds.length !== 1007 || new Set(beforeIds).size !== 1007) throw new Error('Expected 20 data sheets and 1,007 unique source IDs.');
const rows = new Map(source.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row])));
const touched = [];
function update(id, changes) {
  const row = rows.get(id);
  if (!row) throw new Error(`Missing source ID ${id}`);
  if (['acceptance', 'expected', 'status'].some(key => Object.hasOwn(changes, key))) throw new Error('Acceptance, expected results and statuses must remain intact.');
  Object.assign(row, changes);
  touched.push(id);
}

source.meta.version = '0.15.3';
source.meta.scope = 'MI01–MI14 jouables au stade prototype, six châssis, trois opérations autonomes et dossier v14. MI15–MI32 et les seize contrats restent conçus. Les 1 007 IDs, tous les statuts et les 133 critères initiaux sont conservés. Six atlas de marcheurs ajoutent 96 cellules de pièces et états; avec les dix-sept atlas de MI14 et du combat, le total peint atteint 23 atlas et 228 cellules. Appuis, collisions et visée restent liés à la simulation. Les réparations progressives du radiateur gardent leur rendu vectoriel. Factions complètes, cycles et postures finaux, faune et réception humaine restent ouverts.';
source.sheets.find(sheet => sheet.name === 'Prototype').description = 'Portée présente dans le code de la version 0.15.3. Les capacités finales des catalogues restent distinctes. Les limites de chaque fiche décrivent le travail ouvert.';

update('AS02', {
  spec: 'Vues latérales gauche/droite, coque, tourelle, hanches, cuisses, tibias, pieds et pivots nommés. Les huit pièces et poses vectorielles 0.9 sont conservées. 0.15.3 : Vigie reçoit seize cellules peintes de pièces et états, assemblées depuis ses vrais appuis. Débattements finaux, transitions et réception humaine restent ouverts.',
});
update('AS03', {
  spec: 'Quatre pattes séparées, masques de profondeur, coque basse, ancrage et état endommagé. Les quatre chaînes vectorielles 0.9 sont conservées. 0.15.3 : seize cellules peintes pour les pièces et états du Bastion, avec couches proche/lointaine. Finition des transitions et lisibilité humaine des appuis restent à recevoir.',
});
update('AS04', {
  spec: 'Six pattes identifiées, tripodes colorés seulement en vue technique, nacelle et équipements amovibles. Le rig vectoriel 0.9 est conservé. 0.15.3 : seize cellules peintes pour les pièces et états du Pèlerin, assemblées sur les six appuis simulés. Cycle final, lecture au zoom minimum et équipements réellement amovibles restent ouverts.',
});
update('AS30', {
  spec: 'Auteur ou générateur, prompt connu, date, droits, version et chemins sont consignés sans inventer les champs absents. Les manifestes historiques 0.9 sont conservés. 0.15.3 : les six atlas de marcheurs disposent de prompts, fichiers retenus, dimensions, empreintes et usages documentés. Les champs historiques inconnus restent inconnus; PR26 reste ouvert.',
});
update('AS31', {
  spec: 'Pièces séparées, pivots, états de dégâts et couche des membres éloignés pour trois profils bas/haut/très bas. Les rigs vectoriels 0.9 sont conservés. 0.15.3 : Caracal, Arpenteur et Cloporte reçoivent chacun seize cellules peintes, avec leurs silhouettes et appuis distincts. Postures spécialisées, finition des mouvements et réception humaine restent ouvertes.',
});
update('AS36', {
  spec: 'Un composant visible avec état normal, touché, dégradé et réparé. Les diagnostics vectoriels 0.9 sont conservés. 0.15.3 : les six profils ont un radiateur peint normal, endommagé et réparé; l’état touché et la réparation progressive gardent leur rendu vectoriel. Identification spontanée par un joueur et finition en contexte restent non reçues; aucun autre composant adverse ajouté.',
});
update('AS38', {
  spec: 'Registre de chaque asset avec provenance, pivots, échelle, usage, variante et dépendances. Les six rigs documentés 0.9 sont conservés. 0.15.3 : six atlas, 96 cellules, rectangles et ancres des pièces peintes; assemblage selon les contacts et montages existants, avec repli vectoriel. Le contrat reste à recevoir pour chaque future substitution.',
});
update('AS41', {
  spec: 'Pièce arrière pour six profils, impact local, état dégradé et intervention de quatre secondes. Les quatre états et cinq étapes vectoriels 0.9 sont conservés. 0.15.3 : trois états statiques peints par profil, liés à radiatorBounds; les étapes de réparation restent vectorielles. Animation de production complète et réception humaine basse/haute restent ouvertes.',
});
update('PR12', {
  deliverable: 'Identité visuelle, environnements et silhouettes mécaniques lisibles. Réception partielle 0.15.3 : six atlas de marcheurs et 96 cellules de pièces/états, portant le total peint avec MI14 et le combat à 23 atlas et 228 cellules. Factions complètes, postures et cycles finaux, faune et réception humaine restent ouverts.',
});
const walkerPath = 'src/content.mjs ; src/simulation.mjs ; src/production-assets.mjs ; src/painted-walkers.mjs';
update('PX01', {
  implemented: 'Deux pieds, alternance manuelle des groupes, assistance optionnelle, longue foulée et caractéristiques de combat propres. Seize cellules peintes fournissent les pièces et états du rig; articulations, pieds et arme suivent leurs positions simulées.',
  limits: 'Pas de choix libre du point d’appui à la souris ni contrôle de chaque vérin; posture haute fixe. Transfert de masse, transitions et cycle final restent ouverts; le lot peint conserve le pilotage existant.',
  path: walkerPath,
});
update('PX02', {
  implemented: 'Quatre pieds groupés par diagonales, coque basse, progression plus lente, blindage et recul distincts. Seize cellules peintes sont assemblées par pièces, avec membres proches et lointains liés aux appuis simulés.',
  limits: 'Pas de rampement à trois appuis ni modification dynamique de hauteur; réglages à équilibrer. Finition des transitions, réactions de masse et cycle final restent ouverts.',
  path: walkerPath,
});
update('PX03', {
  implemented: 'Six pieds et deux tripodes alternés, paramètres de chaleur et armement propres. Seize cellules peintes fournissent coque, arme, articulations, segments, pieds et radiateur; le rig suit les six appuis simulés.',
  limits: 'Pas encore de marche à cinq appuis ou perte complète de membre; voies et taille réduites pour le prototype. Équipements amovibles et cycle final restent à produire; réception humaine de la lisibilité distincte.',
  path: walkerPath,
});
update('PX24', {
  implemented: 'Illustration de titre, panorama Vesper, silhouettes articulées et ambiances distinctes. Six atlas de marcheurs ajoutent 96 cellules de pièces et états; avec MI14 et le combat : 23 atlas, 228 cellules. Découpe et ancres documentées, chargement asynchrone et repli vectoriel.',
  limits: 'Art au stade Prototype : rôles génériques sans logo de faction, variations et transitions limitées. Factions complètes, postures et cycles finaux des marcheurs, faune et campagne entièrement peinte restent à produire. Réception navigateur et humaine distincte des contrôles automatisés.',
  path: 'assets/art ; assets/painted ; src/renderer.mjs ; src/painted-walkers.mjs',
});
update('PX37', {
  implemented: 'Bipède bas : coque compacte, foulée courte, vitesse et armement propres. Seize cellules peintes de pièces et états s’assemblent sur son rig existant; les deux appuis et l’arme restent liés à la simulation.',
  limits: 'Posture fixe; passages sous plafond, pivots urbains et emplacements d’équipement spécialisés à produire. Transitions, transfert de masse et cycle final restent ouverts.',
  path: walkerPath,
});
update('PX38', {
  implemented: 'Quadrupède haut : longs membres, diagonales, coque élevée et réglages propres. Seize cellules peintes de pièces et états s’assemblent autour des quatre appuis simulés, avec couches de profondeur.',
  limits: 'Pas de choix indépendant de chaque pied, de franchissement dédié ou de module de secours actif. Postures spécialisées, réactions de masse et cycle final restent à produire.',
  path: walkerPath,
});
update('PX39', {
  implemented: 'Hexapode très bas : six appuis, petits pas, coque basse et paramètres de combat propres. Seize cellules peintes préservent son profil ramassé; pièces et arme sont assemblées depuis le rig et les pieds simulés.',
  limits: 'Tunnels, sonde de déminage et blindage local du toit ne sont pas simulés. Postures spécialisées et cycle final restent à produire; la peinture ne change pas ses capacités.',
  path: walkerPath,
});
update('PX51', {
  implemented: 'Collision arrière et intégrité propres, facteur continu de refroidissement de 35 à 100 % selon les dégâts. Trois états peints par châssis : normal, endommagé et réparé. La pièce suit radiatorBounds; la réparation progressive reste vectorielle.',
  limits: 'Premier composant joueur. Pas de circuit complet, fuite volumétrique ni composant équivalent sur une menace ennemie. Animation finale et identification spontanée de l’avarie par un joueur restent ouvertes.',
  path: 'src/simulation.mjs ; src/renderer.mjs ; src/painted-walkers.mjs',
});
update('PX86', {
  implemented: 'Les exports vectoriels historiques sont conservés. Six atlas de seize cellules peintes remplacent les pièces des marcheurs dans le rendu, avec repli vectoriel. Les rigs conservent contacts, articulations, montage d’arme et zone simulée du radiateur.',
  limits: 'Kit partiel : seize cellules par châssis décrivent des pièces et états. Cycles finaux, postures spécialisées, équipements amovibles et finition de tous les mondes restent ouverts. Les réparations progressives du radiateur gardent leur dessin vectoriel.',
  path: 'src/production-assets.mjs ; src/painted-walkers.mjs ; assets/painted/walkers/manifest.json',
});

const afterIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (JSON.stringify(beforeIds) !== JSON.stringify(afterIds)) throw new Error('An existing ID moved or changed.');
for (const key of ['productionBaseline', 'release', 'previousRelease', 'reconstruction']) {
  if (JSON.stringify(before.meta[key]) !== JSON.stringify(source.meta[key])) throw new Error(`Historical metadata changed: ${key}.`);
}
for (let i = 0; i < source.sheets.length; i++) {
  const oldSheet = before.sheets[i], sheet = source.sheets[i];
  if (oldSheet.name !== sheet.name || JSON.stringify(oldSheet.columns) !== JSON.stringify(sheet.columns)) throw new Error('Sheet structure changed.');
  for (let j = 0; j < sheet.rows.length; j++) {
    const oldRow = oldSheet.rows[j], row = sheet.rows[j];
    for (const key of ['acceptance', 'expected', 'status']) {
      if (oldRow[key] !== row[key]) throw new Error(`Protected field ${key} changed for ${row.id}.`);
    }
    if (!touched.includes(row.id) && JSON.stringify(oldRow) !== JSON.stringify(row)) throw new Error(`Unexpected row change: ${row.id}.`);
  }
}
fs.writeFileSync(file, JSON.stringify(source, null, 2) + '\n');
const counts = {};
for (const row of rows.values()) counts[row.status] = (counts[row.status] || 0) + 1;
console.log(JSON.stringify({ version: source.meta.version, records: afterIds.length, changedIds: touched, statuses: counts, statusesPreserved: true, acceptanceCriteriaPreserved: true }));
