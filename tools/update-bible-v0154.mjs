#!/usr/bin/env node
/** Record the painted Cerbère/Thyr tranche without upgrading any production status. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const file = path.join(root, 'data/bible.json');
const source = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!['0.15.3', '0.15.4'].includes(source.meta.version)) throw new Error('Expected the 0.15.3 source or its 0.15.4 Cerbère/Thyr patch.');
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

source.meta.version = '0.15.4';
source.meta.scope = 'MI01–MI14 jouables au stade prototype, six châssis, trois opérations autonomes et dossier v14. MI15–MI32 et les seize contrats restent conçus. Les 1 007 IDs, tous les statuts et les 133 critères initiaux sont conservés. Neuf atlas de Cerbère et de la vie de Thyr ajoutent 78 cellules; le total peint atteint 32 atlas et 306 cellules. Pièces, poses et références restent distinctes des unités, états simulés et cycles finaux. Les positions, dégâts et décisions viennent du domaine existant. Factions complètes, écologie générale, animations finales et réception humaine restent ouvertes.';
source.sheets.find(sheet => sheet.name === 'Prototype').description = 'Portée présente dans le code de la version 0.15.4. Les capacités finales des catalogues restent distinctes. Les limites de chaque fiche décrivent le travail ouvert.';

update('FU07', {
  behavior: 'MI09 : deux adultes et deux jeunes nouveaux. Les adultes attendent un jeune trop éloigné; les tirs proches déclenchent une peur temporaire. Un animal arrivé sort des risques de la zone. 0.15.4 : deux atlas de huit cellules distinguent adultes et jeunes; les poses de marche suivent leur déplacement réel.',
  gameplay: 'La barrière dirige un trajet réel vers le verger ou l’exclusion. L’arrivée au verger féconde les cultures; une exclusion vivante n’est pas un décès. Quatre issues individuelles persistent sans importer les personnes de Nacre. Les cellules peintes ne créent ni nouveaux individus ni nouvelles issues.',
});
update('FU08', {
  behavior: 'MI09 : deux colonies sur les colonnes vivantes. Projecteurs et flashes locaux les dispersent; cinq secondes de calme permettent leur retour. Une colonne perdue détruit sa colonie. 0.15.4 : six cellules peintes présentent les états posé, dispersé et perdu, avec quatre poses de vol.',
});
update('FU09', {
  behavior: 'Le catalogue prévoit une attaque des éclaireurs à pied et l’évitement du grand marcheur sauf acculé. OP03 emploie actuellement un adversaire de mêlée générique. 0.15.4 : douze cellules peintes, dont huit poses de marche liées au déplacement, une attente et deux poses de préparation/attaque.',
  gameplay: 'Protéger des techniciens avec lumière et présence plutôt qu’éradiquer la faune reste le comportement écologique à produire. La cellule morte est une référence : aucun cadavre persistant ni nouvelle issue de mission. Le lot ne livre ni territorialité complète ni rencontre FU09 dans MI09.',
});
update('FL07', {
  interaction: 'MI09 : deux colonnes et leurs racines portent deux habitats. Les vrais appuis rencontrent la surface des racines; une cadence espacée et le guidage protègent ce support. 0.15.4 : un atlas de six cellules pour les colonnes et un de six pour habitats/racines habillent leurs états existants.',
  risk: 'Une racine rompue ou une colonne détruite effondre son habitat. Le bilan distingue les deux habitabilités sans inventer de résidents ni de morts humains. Les variantes peintes ne créent pas de colonne ou d’habitat supplémentaire. Forêt complète et propagation générale restent conçues.',
});
update('FL08', {
  risk: 'Interaction de filtration et fumée toxique encore conçue. Le kit Thyr 0.10 et les cellules peintes 0.15.4 fournissent une vigne visuelle et ses variantes. Les poses de respiration, flétrissement ou brûlure disponibles au dessin ne créent aucun effet respiratoire, incendie ou état écologique simulé.',
});
update('FL09', {
  risk: 'L’annonce fiable des mouvements de faune et de machines civiles reste conçue. Le kit Thyr 0.10 et les cellules peintes 0.15.4 présentent seulement la réaction visuelle des brins. L’herbe ne devient pas un capteur simulé; la cellule aplatie est une référence sans écrasement physique ajouté.',
});
update('AS13', {
  spec: 'Anatomie, vêtements, gestes, technologies et architecture développés ensemble. Réception partielle 0.12 : Leth possède cinq états SVG/Canvas et des outils locaux. 0.15.4 : un atlas de huit cellules peintes, avec deux poses de parole et deux références d’outils déjà représentés sur le corps. Aucune population Khelt supplémentaire. Anatomie complète, diversité des cités, animations finales, voix et architecture restent à produire.',
});
update('AS14', {
  spec: 'Camion d’escorte, patin pirate, drone, tourelle et marcheur lourd ennemi. Les cinq atlas de six cellules 0.15.2 sont conservés. 0.15.4 : Cerbère reçoit seize cellules de pièces/états; onze sont utilisées au rendu et cinq restent des références de dégâts ou réparation. Son canon et son télégraphe suivent le point de tir existant. Phases mécaniques finales, dégâts ennemis localisés et animations complètes restent ouverts.',
});
update('AS18', {
  spec: 'Canopée, colonnes-mères, hameaux, racines et pistes. Les exports historiques sont conservés : 0.10, onze composants/35 SVG/deux planches; 0.11, six composants chimiques/24 SVG; 0.12, six composants vallée/26 SVG/deux planches. 0.15.4 : huit atlas peints/62 cellules couvrent colonnes, habitats/racines, migrateurs adultes/jeunes, colonies, végétation, Leth et Guetteur-racine. Les états existants et les références restent distincts; art final, écologie générale et réception humaine sont ouverts.',
});
update('AS21', {
  spec: 'Vingt-quatre espèces animales et vingt-quatre plantes décrites au catalogue. Le prototype MI09 relie FL07, FU07 et FU08; FL08 et FL09 restent décoratives ou seulement réactives visuellement. 0.15.4 peint partiellement FU07–FU09 et FL07–FL09, sans créer d’espèce ni recevoir toute leur écologie. Le reste du catalogue, les interactions et les animations finales restent à produire.',
});
update('AS30', {
  spec: 'Auteur ou générateur, prompt connu, date, droits, version et chemins sont consignés sans inventer les champs absents. Les manifestes historiques et les six atlas de marcheurs 0.15.3 sont conservés. 0.15.4 : les neuf atlas de Cerbère/Thyr documentent prompts, originaux retenus, dimensions, empreintes et usages des cellules. Les champs historiques inconnus restent inconnus; PR26 reste ouvert.',
});
update('AS37', {
  spec: 'Une surface, une plante structurante et une espèce animale dont besoins et réactions se répondent. MI09 prototype les colonnes porteuses, migrateurs et colonies avec leurs issues propres. 0.15.4 ajoute leur présentation peinte. Cette réception graphique partielle ne reçoit ni écologie générale ni toutes les interactions attendues; FL08 et FL09 ne gagnent aucun pouvoir simulé.',
});
update('AS38', {
  spec: 'Registre de provenance, pivots, échelle, usage, variantes et dépendances. Les six rigs 0.9 et les 96 cellules de marcheurs 0.15.3 sont conservés. 0.15.4 : neuf atlas/78 cellules avec rectangles, ancres et distinction usage/référence. Les appuis et supports de Thyr suivent leurs positions existantes; le canon Cerbère suit la bouche physique conservée. Repli vectoriel disponible. Chaque future substitution garde sa réception propre.',
});
update('PR12', {
  deliverable: 'Identité visuelle, environnements et silhouettes lisibles. Réception partielle 0.15.4 : neuf atlas Cerbère/Thyr et 78 cellules, portant le total peint à 32 atlas et 306 cellules. Ces pièces, poses et références ne sont pas autant d’unités ou de cycles complets. Factions complètes, autres biomes, écologie générale, animations finales et réception humaine restent ouverts.',
});
update('PX11', {
  implemented: 'Adversaire de mêlée de l’opération de Thyr, avec poursuite et attaque signalée. Douze cellules peintes fournissent attente, huit poses de marche et préparation/attaque; la marche suit le déplacement réel et conserve un repli vectoriel.',
  limits: 'La cellule morte reste une référence sans cadavre ajouté. Territorialité, détection des petites proies, évitement du marcheur et protection écologique des techniciens décrits par FU09 restent à produire. Pas de nouvelle rencontre FU09 dans MI09.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/painted-thyr.mjs',
});
update('PX13', {
  implemented: 'Cerbère garde OP03 jusqu’au choix, puis retraite ou combat selon la décision existante. Seize cellules peintes fournissent son rig propre; onze servent au rendu. Canon et télégraphe partagent la pose du tir physique existant, sans déplacer la bouche ni changer la dispersion.',
  limits: 'Cerbère reste distinct de Décret VE16. Cinq cellules de dégâts/réparation restent des références; aucune santé ennemie localisée créée. Les jambes sont une présentation liée au déplacement, sans pieds physiques simulés. Phases mécaniques, équipage et reddition finale restent ouverts.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/painted-cerbere.mjs ; src/cerbere-weapon-pose.mjs',
});
update('PX24', {
  implemented: 'Illustration de titre, panorama Vesper, silhouettes articulées et ambiances distinctes. Neuf atlas Cerbère/Thyr ajoutent 78 cellules aux lots antérieurs : 32 atlas, 306 cellules au total. Découpe, ancres et usages documentés, chargement asynchrone et repli vectoriel.',
  limits: 'Art au stade Prototype. Pièces, poses et références ne constituent ni unités supplémentaires ni cycles complets. Factions complètes, faune/flore des autres mondes, écologie générale et campagne entièrement peinte restent à produire. Réceptions graphique, navigateur et humaine distinctes.',
  path: 'assets/art ; assets/painted ; src/renderer.mjs ; src/painted-walkers.mjs ; src/painted-cerbere.mjs ; src/painted-thyr.mjs',
});
update('PX90', {
  implemented: 'Deux supports portent deux habitats, quatre migrateurs ont des issues individuelles et deux colonies réagissent à la lumière et au bruit locaux. Les atlas peints de colonnes, habitats/racines, adultes, jeunes et colonies présentent ces mêmes entités et états.',
  limits: 'FL08 reste décorative et FL09 seulement visuellement réactive. Les variantes graphiques ne créent ni habitant, ni issue humaine, ni effet écologique. FU09 demeure dans OP03; il n’est pas ajouté à MI09. Écologie générale, incendie et recensement humain restent ouverts.',
  path: 'src/simulation.mjs ; src/thyr-renderer.mjs ; src/painted-thyr.mjs ; tests/mi09-simulation.test.mjs',
});
update('PX91', {
  implemented: 'Onze composants réutilisables historiques, trente-cinq variantes SVG et deux planches PNG conservés. Les atlas peints Thyr remplacent partiellement leur présentation avec repli vectoriel; les états de supports et de faune viennent toujours de la simulation.',
  limits: 'Un export ou une planche ne prouve pas tout le niveau en mouvement. Vignes, herbes et variantes disponibles au dessin ne créditent aucun effet écologique absent. Les cellules de référence sont distinctes des états joués. Art final et réception humaine restent ouverts.',
  path: 'src/thyr-assets.mjs ; src/thyr-renderer.mjs ; src/painted-thyr.mjs ; assets/thyr/manifest.json ; assets/painted/thyr/manifest.json',
});
update('PX103', {
  implemented: 'Six composants SVG/Canvas, vingt-six états SVG et deux planches historiques représentent écoutes, corniche, ponte, émetteur, traduction et Leth. 0.15.4 ajoute huit cellules peintes de Leth : six poses utilisées pour ses cinq états, dont deux de parole, et deux références d’outils.',
  limits: 'La peinture ne modifie ni consentement, ni disponibilités, ni issues de la rencontre. Les outils de référence ne créent aucun équipement ou pouvoir nouveau. Réceptions graphique, gameplay, navigateur et humaine restent séparées; la langue visuelle complète des cités Khelt reste ouverte.',
  path: 'src/voice-assets.mjs ; src/voice-renderer.mjs ; src/painted-thyr.mjs ; assets/voice/manifest.json ; assets/painted/thyr/manifest.json',
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
