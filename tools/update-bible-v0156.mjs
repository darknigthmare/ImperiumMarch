#!/usr/bin/env node
/** Describe the Nacre sites, chemical field and voice apparatus without changing reception criteria. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const file = path.join(root, 'data/bible.json');
const source = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!['0.15.5', '0.15.6'].includes(source.meta.version)) throw new Error('Expected the 0.15.5 source or its 0.15.6 graphical patch.');
const before = structuredClone(source);
const beforeIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (source.sheets.length !== 20 || beforeIds.length !== 1007 || new Set(beforeIds).size !== 1007) throw new Error('Expected 20 data sheets and 1,007 unique source IDs.');

// A planned count is insufficient: each final manifest must describe the retained PNG bytes.
const lots = [];
for (const [name, expected] of [['nacre-sites', [5, 30, 30]], ['chemical', [5, 24, 24]], ['voice', [3, 21, 21]]]) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/painted', name, 'manifest.json'), 'utf8'));
  if (manifest.version !== '0.15.6' || !Array.isArray(manifest.files)) throw new Error(`Unexpected ${name} manifest.`);
  const cells = item => Array.isArray(item.cells) ? item.cells.length : item.cells ?? item.frames;
  const runtime = item => item.runtimeCells ?? item.runtimeFrames;
  const references = item => item.referenceCells ?? item.referenceFrames ?? cells(item) - runtime(item);
  if (manifest.files.some(item => ![cells(item), runtime(item), references(item)].every(n => Number.isInteger(n) && n >= 0))) throw new Error(`Invalid ${name} cell counts.`);
  const counts = [manifest.files.length, manifest.files.reduce((n, item) => n + cells(item), 0), manifest.files.reduce((n, item) => n + runtime(item), 0)];
  if (JSON.stringify(counts) !== JSON.stringify(expected)) throw new Error(`The ${name} lot does not match its documented scope.`);
  for (const item of manifest.files) {
    const relative = item.path || item.file;
    if (!relative?.startsWith(`assets/painted/${name}/`) || relative.includes('..')) throw new Error(`Invalid ${name} original path.`);
    const bytes = fs.readFileSync(path.join(root, relative));
    if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error(`Original does not match manifest: ${relative}.`);
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error(`Not a PNG: ${relative}.`);
    if (JSON.stringify(item.size ?? item.dimensions) !== JSON.stringify([bytes.readUInt32BE(16), bytes.readUInt32BE(20)])) throw new Error(`PNG dimensions do not match manifest: ${relative}.`);
    if (runtime(item) + references(item) !== cells(item)) throw new Error(`Inconsistent cell usage: ${relative}.`);
  }
  lots.push({ name, atlases: counts[0], cells: counts[1], runtimeCells: counts[2], referenceCells: counts[1] - counts[2] });
}
const [nacre, chemical, voice] = lots;
const added = lots.reduce((n, lot) => ({ atlases: n.atlases + lot.atlases, cells: n.cells + lot.cells, runtimeCells: n.runtimeCells + lot.runtimeCells, referenceCells: n.referenceCells + lot.referenceCells }), { atlases: 0, cells: 0, runtimeCells: 0, referenceCells: 0 });
const total = { atlases: 45 + added.atlases, cells: 386 + added.cells };
const rows = new Map(source.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row])));
const touched = [];
function update(id, changes) {
  const row = rows.get(id);
  if (!row) throw new Error(`Missing source ID ${id}`);
  if (['acceptance', 'expected', 'status'].some(key => Object.hasOwn(changes, key))) throw new Error('Acceptance, expected results and statuses must remain intact.');
  if (Object.keys(changes).some(key => !Object.hasOwn(row, key))) throw new Error(`Unexpected field for ${id}.`);
  Object.assign(row, changes);
  touched.push(id);
}

source.meta.version = '0.15.6';
source.meta.scope = `MI01–MI14 jouables au stade prototype, six châssis, trois opérations autonomes et dossier v14. MI15–MI32 et les seize contrats restent conçus. Les 1 007 IDs, tous les statuts et les 133 critères initiaux sont conservés. ${added.atlases} atlas ajoutent ${added.cells} cellules utilisées au rendu des infrastructures de Nacre, du terrain chimique MI10 et des appareils et nids MI11; le total peint atteint ${total.atlases} atlas et ${total.cells} cellules. Aucun individu, état ou règle supplémentaire n’est créé. Marée, surfaces d’appui, ouvertures, dégâts, pollution et interventions gardent leur simulation. Autres environnements, animations finales et réception humaine restent ouverts.`;
source.sheets.find(sheet => sheet.name === 'Prototype').description = 'Portée présente dans le code de la version 0.15.6. Les capacités finales des catalogues restent distinctes. Les limites de chaque fiche décrivent le travail ouvert.';

update('AS17', {
  spec: `Mer en plusieurs plans, marées, digues, quais, villages, mangroves et silhouettes navales. Kit vectoriel 0.9 conservé. Les six atlas/30 cellules 0.15.5 d’ambulance, matériel et bateaux restent disponibles, dont une balise de référence. 0.15.6 ajoute ${nacre.atlases} atlas/${nacre.cells} cellules de panneaux, hydraulique, maisons, accueils, quais, rampes et treuils. Eau, ouvertures et personnes restent séparées des matières peintes. Mer en plusieurs plans, mangroves, animations finales et réception humaine restent ouvertes.`,
});
update('AS18', {
  spec: `Canopée, colonnes-mères, hameaux, racines et pistes. Kits conservés : 0.10, onze composants/35 SVG/deux planches; 0.11, six composants chimiques/24 SVG; 0.12, six composants vallée/26 SVG/deux planches. Les huit atlas/62 cellules de Thyr 0.15.4 et trois atlas/30 cellules du relais 0.15.5 restent disponibles. 0.15.6 ajoute ${chemical.atlases} atlas/${chemical.cells} cellules chimiques et ${voice.atlases} atlas/${voice.cells} cellules d’appareils et nids MI11. Les états restent simulés; art final, écologie générale et réception humaine sont ouverts.`,
});
update('AS30', {
  spec: `Auteur ou générateur, prompt connu, date, droits, version et chemins sont consignés sans inventer les champs absents. Les manifestes historiques restent conservés. 0.15.6 documente ${added.atlases} atlas/${added.cells} cellules pour Nacre, MI10 et MI11 : prompts, sorties PNG retenues inchangées, dimensions, empreintes et usages. Les ${added.runtimeCells} cellules sont utilisées au rendu. Cases vides et sources non retenues ne sont pas comptées. Les champs historiques inconnus restent inconnus; PR26 reste ouvert.`,
});
update('AS38', {
  spec: `Registre de provenance, pivots, échelle, usage, variantes et dépendances. Rigs et manifestes antérieurs conservés. 0.15.6 : ${added.atlases} atlas/${added.cells} cellules avec rectangles et ancres mesurés. Matières de Nacre, pièces chimiques et appareils MI11 suivent leurs objets existants; eau, progression, personnes et conditions d’apparition demeurent distinctes. Les contacts et ouvertures restent ceux de la simulation. Repli vectoriel disponible; chaque future substitution garde sa réception propre.`,
});
update('AS44', {
  spec: 'Graduations fixes, eau mobile, vase découverte et tablier posé lisibles avec les trois familles de marcheurs. Le repère de marée vectoriel 0.9 et ses ancres de niveau sont conservés. 0.15.6 peint les matières des rampes et platelages; aucun nouveau repère de marée n’est ajouté. Eau et indications de submersion suivent le niveau simulé. Matières animées de vase et compréhension du risque sans seule couleur en combat restent à recevoir.',
});
update('AS45', {
  spec: 'Deux coques aux usages identifiables, treuils séparés, documents et poste radio. Les quatre cellules de Saisie et six de Rive-Courte 0.15.5 sont conservées. 0.15.6 ajoute les matières des treuils et quais; câbles, libération et dommages gardent leurs états existants. Les coques restent vides, avec occupants simulés séparés. Aucun équipage ni effort de traction n’est ajouté. Réception intégrée des équipages et animations finales encore ouvertes.',
});
update('AS46', {
  spec: 'Accès, défenses, marques de niveau, cabine de ferry et aire d’accueil. Les quatre cellules du bateau de passage 0.15.5 restent disponibles. 0.15.6 ajoute les matières des quais et des accès; eau, attente, déplacement, dégâts et douze passagers restent déterminés par la simulation. Les dessins ne créditent aucune arrivée. Débarquement lisible, animation individuelle et absence de chevauchement restent à observer en réception humaine.',
});
update('AS48', {
  spec: 'Panneau articulé avec points d’appui, verrous, canal de dérivation, conduites et seuils sur façades. Le kit vectoriel 0.9 est conservé. 0.15.6 ajoute panneau et pièces hydrauliques peints selon leurs états existants; soutien, verrouillage, pression et progression restent distincts des images. Les techniciens gardent leurs trajets simulés. Lecture humaine du chantier et gestes détaillés des intervenants restent à recevoir.',
});
update('AS49', {
  spec: 'Ambulance, accès patient, balise et dégâts. Les quatre cellules d’ambulance et six de matériel 0.15.5 restent disponibles, avec roue séparée et balise récupérée de référence. 0.15.6 ajoute les matières de la rampe et des postes d’accueil. Les six occupants, soins et transferts restent séparés; aucun personnel n’est peint dans les bâtiments. Accès des six châssis, gestes sanitaires et finition des personnes restent à recevoir.',
});
update('AS50', {
  spec: 'Deux portes, pression, refuge et départs distincts. Kit vectoriel 0.9 et ses réceptions historiques conservés, ainsi que les six cellules de Rive-Courte et six de Veille d’Aval 0.15.5. 0.15.6 ajoute vantaux, mécanismes, quais, rampes et bâtiments d’accueil peints. Ouverture continue, pression, préparation et personnes gardent leurs états simulés. Les images ne prouvent aucune arrivée; gestes finaux et compréhension humaine restent ouverts.',
});
update('AS52', {
  spec: 'Deux façades originales, seuils visibles et accès au secours séparé de la silhouette de tir. Les variantes vectorielles 0.9 sont conservées. 0.15.6 ajoute six cellules peintes pour les deux maisons; eau, exposition et seuils restent indiqués selon les niveaux simulés. Les façades ne contiennent aucun occupant peint : évacuation, logement perdu et pertes de personnes demeurent séparés. Animations de secours et compréhension humaine restent ouvertes.',
});

update('PR12', {
  deliverable: `Identité visuelle, environnements et silhouettes lisibles. Réception partielle 0.15.6 : ${added.atlases} atlas/${added.cells} cellules de Nacre, du terrain chimique MI10 et des appareils MI11, portant le total peint à ${total.atlases} atlas et ${total.cells} cellules. Toutes les nouvelles cellules servent au rendu des états existants. Ces pièces et états ne sont pas autant d’unités ou de cycles complets. Autres biomes, animations finales et réception humaine restent ouverts.`,
});
update('PR86', {
  deliverable: `Trois cuves, copies matérielles, fuite, prélèvement défendu, forces privées, collecteur, canaux et rapport. 0.15.6 ajoute ${chemical.atlases} atlas/${chemical.cells} cellules pour six familles du terrain : cuves, prélèvement, registre, vannes, canaux et maisons. Pollution, masses, provenance et opérations gardent leur simulation. Le kit vectoriel reste disponible; les peintures ne terminent aucun critère humain.`,
});
update('PR89', {
  deliverable: `Trois écoutes, corniche et ponte, avertissements et traduction, Leth, échange protégé, émetteur, rapport et extraction. 0.15.6 ajoute ${voice.atlases} atlas/${voice.cells} cellules pour les appareils et nids. Les huit cellules de Leth 0.15.4 restent conservées. Contacts physiques, dommages, décisions, consentement et pièces acquises gardent leurs règles. Réception graphique et compréhension humaine restent distinctes.`,
});

update('PX24', {
  implemented: `Illustration de titre, panorama Vesper, silhouettes articulées et ambiances distinctes. ${added.atlases} atlas de Nacre, du terrain chimique et des appareils MI11 ajoutent ${added.cells} cellules aux lots antérieurs : ${total.atlases} atlas/${total.cells} cellules au total. Les ${added.runtimeCells} cellules nouvelles ont un usage de rendu documenté. PNG retenus inchangés, découpes et ancres mesurées; chargement asynchrone et repli vectoriel.`,
  limits: 'Art au stade Prototype. Pièces, états et références ne constituent ni unités supplémentaires ni cycles complets. Factions complètes, autres biomes, écologie générale et campagne entièrement peinte restent à produire. Réceptions graphique, navigateur et humaine distinctes.',
  path: 'assets/art ; assets/painted ; src/renderer.mjs ; src/painted-nacre-sites.mjs ; src/painted-chemical.mjs ; src/painted-voice.mjs',
});
update('PX57', {
  implemented: 'Pose locale de quatre secondes; un tablier achevé offre une traversée permanente au-dessus de son banc. La matière peinte 0.15.6 suit ce tablier existant; progression et surface d’appui restent déterminées par la simulation.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/renderer.mjs ; src/painted-nacre-sites.mjs',
});
update('PX62', {
  implemented: 'Eau, bancs, tabliers, treuils, barges et bateau suivent leur état simulé. Les coques peintes 0.15.5 sont complétées en 0.15.6 par les matières des tabliers, treuils et quais. Eau, câbles, passagers et progrès restent séparés. Ordre, interactions et bilan exposent les faits disponibles.',
  limits: 'Peinture et interface de prototype. Repères précis conservés; matières animées, équipages, audio local AS47 et compréhension humaine QA95 restent ouverts.',
  path: 'src/renderer.mjs ; src/main.mjs ; src/painted-nacre.mjs ; src/painted-nacre-sites.mjs',
});
update('PX64', {
  implemented: 'Une posture de travail avec appuis et ancrage maintient le panneau pendant son intervention. Le verrouillage accompli reste distinct du soutien temporaire. Le panneau peint 0.15.6 garde son point d’appui existant; les indications de soutien et d’intervention restent dynamiques.',
  path: 'src/simulation.mjs ; src/renderer.mjs ; src/painted-nacre-sites.mjs',
});
update('PX67', {
  implemented: 'Le réglage impérial et la dérivation commandent les travaux disponibles. La mission se poursuit après décision; les pompes et le quartier gardent leur état réel. Les pièces hydrauliques peintes 0.15.6 suivent ces états; pression, trajet de l’eau et progrès ne sont pas déduits des images.',
  path: 'src/simulation.mjs ; src/content.mjs ; src/renderer.mjs ; src/painted-nacre-sites.mjs',
});
update('PX70', {
  implemented: 'Rendu et interface exposent soutien, intervenants, pompes, maisons et réserve. 0.15.6 peint le panneau, l’hydraulique et les deux façades; niveaux d’eau, seuils, habitants et secours restent séparés. Le retour distingue personnes, logements, dépense de sortie et cumul officiel.',
  limits: 'Peinture et interface de prototype. Finition AS48/AS52–AS56, gestes de secours, audio et compréhension humaine QA115 restent ouverts.',
  path: 'src/renderer.mjs ; src/main.mjs ; src/painted-nacre-sites.mjs',
});
update('PX75', {
  implemented: 'Verrou, étai et fatigue de MI06 déterminent l’accès. Un contact radio de 2,5 s avec un survivant réduit le travail de rampe de huit à quatre secondes. La rampe peinte 0.15.6 conserve les dimensions et états de cet accès; aucune aide supplémentaire n’est créée.',
  path: 'src/simulation.mjs ; src/campaign.mjs ; src/renderer.mjs ; src/painted-nacre-sites.mjs',
});
update('PX78', {
  implemented: 'Rendu et interface exposent étapes, constat, route et issue sanitaire. Les quatre cellules d’ambulance 0.15.5, dont la roue séparée, restent disponibles. 0.15.6 peint rampe et postes d’accueil; six occupants, soins et transferts restent représentés séparément, selon leurs états réels.',
  path: 'src/renderer.mjs ; src/main.mjs ; src/painted-nacre.mjs ; src/painted-nacre-sites.mjs',
});
update('PX79', {
  implemented: 'Amenée et passage ont leurs commandes, états, mécanismes, vantaux, pression, fatigue et manœuvres. Courant calculé progressivement. Les pièces peintes 0.15.6 suivent les mécanismes existants; ouverture continue et progression restent représentées à partir de la simulation.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/renderer.mjs ; src/painted-nacre-sites.mjs',
});
update('PX82', {
  implemented: 'Rappel des personnes encore présentes, niche des techniciens, constats des supports perdus et obturation de secours. Les bâtiments d’accueil peints 0.15.6 restent vides : occupants, préparation et arrivées sont issus de la simulation, sans crédit supplémentaire donné par le dessin.',
  path: 'src/simulation.mjs ; src/renderer.mjs ; src/painted-nacre-sites.mjs',
});
update('PX95', {
  implemented: 'Matière émise, retenue, en transit et livrée séparées. Deux canaux et deux maisons gardent pollution, dégâts et habitabilité. Les cellules peintes 0.15.6 suivent les états des cuves, canaux, vannes et maisons; eau et indicateurs de pollution restent pilotés par le modèle local.',
  path: 'src/chemical-simulation.mjs ; src/chemical-renderer.mjs ; src/painted-chemical.mjs',
});
update('PX96', {
  implemented: 'Le prélèvement progresse vingt secondes; PT02 exige collecte, trois marquages et copie du registre. Une copie ou matière déjà acquise survit à la perte de son original. Le prélèvement et le registre peints 0.15.6 affichent leurs états existants; aucun prélèvement ni preuve n’est acquis par le dessin.',
  path: 'src/chemical-simulation.mjs ; src/chemical-validation.mjs ; src/campaign.mjs ; src/painted-chemical.mjs',
});
update('PX97', {
  implemented: `Six composants et vingt-quatre états SVG/Canvas historiques conservés. 0.15.6 ajoute ${chemical.atlases} atlas/${chemical.cells} cellules peintes pour cuves, canaux pontés, prélèvement, registre, vannes et maisons. Les ${chemical.runtimeCells} cellules suivent les états existants; les cases de grille vides ne sont pas des sprites. Géométrie physique, progression et repli vectoriel restent disponibles.`,
  limits: 'Les contrôles d’images et scènes Canvas ne certifient ni parcours navigateur ni lecture humaine en mouvement. Peinture au stade Prototype; autres environnements, animations finales et essais humains restent ouverts.',
  path: 'src/chemical-assets.mjs ; src/chemical-renderer.mjs ; src/painted-chemical.mjs ; assets/chemical/manifest.json ; assets/painted/chemical/manifest.json',
});
update('PX100', {
  implemented: 'Trois écoutes immobiles et une corniche physique relient la recherche de source aux vrais contacts des pieds. Trois nids gardent leurs dommages. En 0.15.6, appareils, nids et repère de passage sont peints selon ces états; la surface d’appui reste physique, sans population ni phase biologique supplémentaire.',
  path: 'src/voice-simulation.mjs ; src/simulation.mjs ; src/voice-renderer.mjs ; src/painted-voice.mjs ; tests/mi11-simulation.test.mjs',
});
update('PX102', {
  implemented: 'La capture et la remise en service suivent une décision puis une intervention de cinq secondes. Le bilan conserve l’état réel avant l’extraction physique. Les cinq états peints de l’émetteur 0.15.6 suivent ce matériel; progression et disponibilité restent calculées, sans équipement supplémentaire.',
  path: 'src/voice-simulation.mjs ; src/content.mjs ; src/campaign.mjs ; src/painted-voice.mjs',
});
update('PX103', {
  implemented: `Six composants SVG/Canvas, vingt-six états SVG et deux planches historiques conservés. Leth garde ses huit cellules 0.15.4, dont six poses utilisées et deux références d’outils. 0.15.6 ajoute ${voice.atlases} atlas/${voice.cells} cellules pour écoute, traduction, émetteur, nids et repère de passage. Ces ${voice.runtimeCells} cellules suivent leurs objets et dégâts existants, avec progrès et conditions de présence séparés.`,
  path: 'src/voice-assets.mjs ; src/voice-renderer.mjs ; src/painted-thyr.mjs ; src/painted-voice.mjs ; assets/voice/manifest.json ; assets/painted/voice/manifest.json',
});

const afterIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (touched.length !== 30 || new Set(touched).size !== 30) throw new Error('Expected exactly 30 targeted source records.');
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
const statuses = {};
for (const row of rows.values()) statuses[row.status] = (statuses[row.status] || 0) + 1;
console.log(JSON.stringify({ version: source.meta.version, records: afterIds.length, changedIds: touched, statuses, lots, added, total, statusesPreserved: true, acceptanceCriteriaPreserved: true }));
