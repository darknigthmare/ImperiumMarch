#!/usr/bin/env node
/** Record the transport/Nacre/relay artwork without promoting any status or criterion. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const file = path.join(root, 'data/bible.json');
const source = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!['0.15.4', '0.15.5'].includes(source.meta.version)) throw new Error('Expected the 0.15.4 source or its 0.15.5 graphical patch.');
const before = structuredClone(source);
const beforeIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (source.sheets.length !== 20 || beforeIds.length !== 1007 || new Set(beforeIds).size !== 1007) throw new Error('Expected 20 data sheets and 1,007 unique source IDs.');

// The descriptions below are tied to the retained originals, not a projected asset count.
const lots = [];
for (const [name, expected] of [['transport', [4, 20, 20]], ['nacre', [6, 30, 29]], ['relay', [3, 30, 28]]]) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/painted', name, 'manifest.json'), 'utf8'));
  if (manifest.version !== '0.15.5') throw new Error(`Unexpected ${name} manifest version.`);
  const files = manifest.files;
  const counts = [files.length, files.reduce((n, item) => n + item.cells, 0), files.reduce((n, item) => n + item.runtimeCells, 0)];
  if (JSON.stringify(counts) !== JSON.stringify(expected)) throw new Error(`The ${name} lot does not match its documented scope.`);
  for (const item of files) {
    const relative = item.path || item.file;
    if (!relative?.startsWith(`assets/painted/${name}/`) || relative.includes('..')) throw new Error(`Invalid ${name} original path.`);
    const bytes = fs.readFileSync(path.join(root, relative));
    if (bytes.length !== item.bytes || createHash('sha256').update(bytes).digest('hex') !== item.sha256) throw new Error(`Original does not match manifest: ${relative}.`);
    if (item.referenceCells !== undefined && item.runtimeCells + item.referenceCells !== item.cells) throw new Error(`Inconsistent cell usage: ${relative}.`);
  }
  lots.push({ name, atlases: counts[0], cells: counts[1], runtimeCells: counts[2], referenceCells: counts[1] - counts[2] });
}

const rows = new Map(source.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row])));
const touched = [];
function update(id, changes) {
  const row = rows.get(id);
  if (!row) throw new Error(`Missing source ID ${id}`);
  if (['acceptance', 'expected', 'status'].some(key => Object.hasOwn(changes, key))) throw new Error('Acceptance, expected results and statuses must remain intact.');
  Object.assign(row, changes);
  touched.push(id);
}

source.meta.version = '0.15.5';
source.meta.scope = 'MI01–MI14 jouables au stade prototype, six châssis, trois opérations autonomes et dossier v14. MI15–MI32 et les seize contrats restent conçus. Les 1 007 IDs, tous les statuts et les 133 critères initiaux sont conservés. Treize atlas de transport, Nacre et relais ajoutent 80 cellules, dont 77 utilisées au rendu et trois références; le total peint atteint 45 atlas et 386 cellules. Pièces et états ne créent aucun individu ni règle. Roues, appuis, dégâts, arrivées et décisions suivent la simulation existante. Factions complètes, autres environnements, animations finales et réception humaine restent ouverts.';
source.sheets.find(sheet => sheet.name === 'Prototype').description = 'Portée présente dans le code de la version 0.15.5. Les capacités finales des catalogues restent distinctes. Les limites de chaque fiche décrivent le travail ouvert.';

update('VE02', {
  encounter: 'Arrêt demandé dans une aire protégée, examen avec accord, puis transfert par une rampe préparée vers un poste médical impérial ou un accueil civil. 0.15.5 : trois carrosseries peintes et une roue séparée suivent les positions et dégâts existants; les six occupants restent distincts du véhicule.',
});
update('VE12', {
  encounter: 'MI12 : quadrupède de sécurité, arrivée différée, coque et composants visables séparément. 0.15.5 : seize cellules peintes, dont quinze au rendu, articulées sur ses quatre vrais pieds simulés. Capteur, verrou et bouche de tir gardent leurs positions physiques. Variantes et finition finale à produire.',
});
update('VE17', {
  encounter: 'MI02 : locomotive, wagon de minerai et wagon fermé sur un viaduc. Libérer deux harpons puis freiner avant la voie rompue. 0.15.5 : deux atlas et douze cellules peignent locomotive, wagons et roue séparée selon leurs états existants. Dételage et aiguillages restent conçus.',
});

update('AS14', {
  spec: 'Camion d’escorte, patin pirate, drone, tourelle et marcheur lourd ennemi : cinq atlas de six cellules 0.15.2 conservés. Cerbère 0.15.4 garde seize cellules, onze au rendu et cinq références, avec bouche de tir existante. 0.15.5 ajoute train, porteur, ambulance et bateaux; Prétoire reçoit seize cellules, quinze au rendu, sur ses quatre appuis physiques. Les pièces ne sont pas de nouveaux véhicules. Phases mécaniques finales, dégâts ennemis localisés et animations complètes restent ouverts.',
});
update('AS17', {
  spec: 'Mer en plusieurs plans, marées, digues, quais, villages, mangroves et silhouettes navales. Le kit vectoriel 0.9 de marée et refuge est conservé. 0.15.5 : six atlas/30 cellules pour ambulance, matériel et quatre embarcations; 29 servent au rendu, une balise récupérée reste référence. Coques vides et occupants séparés suivent les états existants. Mer en plusieurs plans, mangroves, matières animées et environnement complet restent à finir.',
});
update('AS18', {
  spec: 'Canopée, colonnes-mères, hameaux, racines et pistes. Exports conservés : 0.10, onze composants/35 SVG/deux planches; 0.11, six composants chimiques/24 SVG; 0.12, six composants vallée/26 SVG/deux planches. 0.15.4 : huit atlas/62 cellules pour supports, faune, végétation et Leth. 0.15.5 : MI12 ajoute trois atlas/30 cellules de Prétoire, mâts et consoles, dont deux références. Les états existants restent distincts des dessins; art final, écologie générale et réception humaine sont ouverts.',
});
update('AS19', {
  spec: 'Roches, installations, chaleur et glace. MI13–MI14 disposent de kits SVG/Canvas. MI14 conserve huit atlas peints transparents et 54 cellules de personnages et machines. 0.15.5 : le porteur et les caisses de série MI13 reçoivent deux atlas/huit cellules; roues et deux corps de caisses gardent leurs positions physiques. Sereis et la finition complète restent à produire.',
});
update('AS30', {
  spec: 'Auteur ou générateur, prompt connu, date, droits, version et chemins sont consignés sans inventer les champs absents. Les manifestes historiques sont conservés. 0.15.5 documente treize atlas/80 cellules de transport, Nacre et relais : prompts, PNG originaux inchangés, dimensions, empreintes et usages. Les 77 cellules au rendu et trois références restent distinguées. Les champs historiques inconnus restent inconnus; PR26 reste ouvert.',
});
update('AS38', {
  spec: 'Registre de provenance, pivots, échelle, usage, variantes et dépendances. Rigs et manifestes antérieurs conservés. 0.15.5 : treize atlas/80 cellules avec rectangles, ancres et distinction usage/référence. Roues, appuis réels du Prétoire, composants, deux caisses et quilles suivent leurs positions existantes; les conditions d’apparition restent actives. Repli vectoriel disponible. Chaque future substitution garde sa réception propre.',
});
update('AS45', {
  spec: 'Deux coques aux usages identifiables, treuils séparés, documents et poste radio. Le kit vectoriel 0.9 est conservé. 0.15.5 ajoute quatre cellules peintes de Saisie et six de Rive-Courte; les coques vides suivent les dégâts existants, avec treuils et constats toujours distincts. Les dessins ne créent ni équipage ni traction supplémentaire. Réception intégrée des équipages et animations finales encore ouvertes.',
});
update('AS46', {
  spec: 'Accès, défenses, marques de niveau, cabine de ferry et aire d’accueil. Le dock vectoriel est conservé. 0.15.5 : quatre cellules peintes du bateau de passage suivent attente, déplacement et dégâts existants; les douze passagers restent issus du bilan simulé. Débarquement lisible, animation individuelle et absence de chevauchement doivent encore être observés en réception humaine.',
});
update('AS49', {
  spec: 'Véhicule avec postes de soin, accès patient, attaches de balise et dégâts. 0.15.5 : quatre cellules d’ambulance, dont une roue séparée, et six de matériel; cinq de matériel sont utilisées, la balise récupérée reste référence. Après retrait, seule l’attache existante demeure. Les six occupants et les progrès de soin restent séparés. Accès des six châssis, gestes sanitaires et finition des personnes restent à recevoir.',
});
update('AS50', {
  spec: 'Deux portes, pression, refuge et départs distincts. Le kit vectoriel 0.9 est conservé, ainsi que ses dix-sept scènes Canvas et sa continuation Chrome historiques. 0.15.5 : Rive-Courte et Veille d’Aval reçoivent six cellules chacune; coques vides, occupants et passerelles restent séparés, avec positions et arrivées simulées. Les gestes finaux et la compréhension humaine restent ouverts; les dessins seuls ne prouvent aucune arrivée.',
});

update('PR12', {
  deliverable: 'Identité visuelle, environnements et silhouettes lisibles. Réception partielle 0.15.5 : treize atlas transport/Nacre/relais et 80 cellules, portant le total peint à 45 atlas et 386 cellules. Le nouveau lot distingue 77 cellules au rendu et trois références. Ces pièces et états ne sont pas autant d’unités ou de cycles complets. Factions complètes, autres biomes, animations finales et réception humaine restent ouverts.',
});
update('PR93', {
  deliverable: 'Kit original de relais et Prétoire partagé entre SVG et Canvas, conservé en repli. 0.15.5 : trois atlas/30 cellules peintes, dont 28 au rendu; les quatre pieds physiques, composants visables et conditions d’arrivée restent ceux de la simulation. Contrôles graphiques et réception humaine demeurent distincts.',
});
update('PR96', {
  deliverable: 'Kit industriel, signalisation de vapeur et horizon de fonderie. 0.15.5 : deux atlas/huit cellules peignent porteur et caisses MI13; quatre roues et deux charges gardent leur pose physique. Le kit vectoriel et les effets de progression restent disponibles; finition de Kharon et réception humaine restent ouvertes.',
});

update('PX24', {
  implemented: 'Illustration de titre, panorama Vesper, silhouettes articulées et ambiances distinctes. Treize atlas transport/Nacre/relais ajoutent 80 cellules aux lots antérieurs : 45 atlas, 386 cellules au total. Découpe, ancres, 77 usages de rendu et trois références du nouveau lot sont documentés; chargement asynchrone et repli vectoriel.',
  limits: 'Art au stade Prototype. Pièces, états et références ne constituent ni unités supplémentaires ni cycles complets. Factions complètes, autres biomes, écologie générale et campagne entièrement peinte restent à produire. Réceptions graphique, navigateur et humaine distinctes.',
  path: 'assets/art ; assets/painted ; src/renderer.mjs ; src/painted-transport.mjs ; src/painted-nacre.mjs ; src/painted-relay.mjs',
});
update('PX32', {
  implemented: 'Deux treuils demandent chacun 2,5 s à proximité. Le second libère la locomotive. Freinage de 4 s près de la cabine avant la voie rompue. Deux atlas/douze cellules peignent locomotive, wagons et roue séparée; positions, santé, occupants et déplacement viennent de la simulation.',
  path: 'src/simulation.mjs ; src/renderer.mjs ; src/painted-transport.mjs',
});
update('PX58', {
  implemented: 'Treuils indépendants des coques, inspections de trois secondes, facture de Saisie et radio de Vann conditionnées à leur état au moment de lecture. Quatre cellules peintes de Saisie et six de Rive-Courte suivent ces états; coques vides, treuils et informations demeurent séparés.',
  path: 'src/simulation.mjs ; src/renderer.mjs ; src/painted-nacre.mjs',
});
update('PX59', {
  implemented: 'Le bateau attend l’ouverture et l’eau suffisante. Le dock, les dégâts et les pertes déterminent son bilan. Quatre cellules peintes présentent sa coque vide selon les états existants, sans créer de passager ni créditer une arrivée graphique.',
  path: 'src/simulation.mjs ; src/campaign.mjs ; src/painted-nacre.mjs',
});
update('PX73', {
  implemented: 'Caisse, boîtier et état du véhicule sont constatés séparément. Les ruines gardent une issue limitée. Les cellules peintes du matériel suivent les états connus, examinés et détruits; elles ne révèlent aucune donnée supplémentaire.',
  path: 'src/simulation.mjs ; src/campaign.mjs ; src/painted-nacre.mjs',
});
update('PX74', {
  implemented: 'Cinq secondes sous ancrage et appuis posés démontent la balise. Un boîtier détruit demande deux secondes de constat, sans données récupérées. Deux états peints servent au rendu; après retrait, l’attache existante demeure seule et la cellule récupérée reste une référence.',
  path: 'src/simulation.mjs ; src/campaign.mjs ; src/painted-nacre.mjs',
});
update('PX78', {
  implemented: 'Rendu et interface exposent les étapes, le constat disponible, la route et l’issue sanitaire. Quatre cellules peintes d’ambulance, dont une roue séparée, suivent carrosserie, dégâts et contacts; six occupants, soins et transferts restent représentés séparément.',
  limits: 'Peinture partielle et interface de prototype; finition des gestes sanitaires, audio et compréhension humaine QA137 encore ouverts.',
  path: 'src/renderer.mjs ; src/main.mjs ; src/painted-nacre.mjs',
});
update('PX81', {
  implemented: 'Deux bateaux, passerelles, opérateurs, accompagnants et brancards; arrivée créditée à la porte du refuge. Six cellules peintes de Rive-Courte et six de Veille d’Aval suivent les états existants. Les coques vides restent distinctes des occupants et de leurs transferts simulés.',
  path: 'src/simulation.mjs ; src/renderer.mjs ; src/painted-nacre.mjs',
});
update('PX106', {
  implemented: 'Coque, capteur, verrou et quatre pieds physiques; arrivée différée. Seize cellules peintes, quinze utilisées, articulent les pièces sur les vrais contacts des pieds et les composants simulés. La bouche reste au point du projectile existant dans les deux directions.',
  limits: 'Le canon endommagé reste une référence sans état de dommage ajouté. Animations finales, variété du véhicule et réception humaine restent à produire. Le Prétoire conserve ses vrais pieds, distincts des jambes visuelles de Cerbère.',
  path: 'src/relay-simulation.mjs ; src/relay-renderer.mjs ; src/painted-relay.mjs',
});
update('PX109', {
  implemented: 'Géométrie SVG/Canvas commune conservée en repli. Trois atlas/30 cellules peignent Prétoire, mâts et consoles; 28 sont utilisées au rendu, le canon endommagé et la cassette isolée restent références. Les sites, composants et conditions d’arrivée proviennent de la simulation.',
  limits: 'Un banc graphique ne reçoit ni navigateur ni compréhension humaine. Les cellules de référence n’ajoutent aucun composant, dégât ou donnée récupérée.',
  path: 'src/relay-assets.mjs ; assets/relay ; src/painted-relay.mjs ; assets/painted/relay/manifest.json',
});
update('PX111', {
  implemented: 'Porteur à quatre roues, deux corps de caisses et transferts distincts. Quatre cellules de porteur, dont une roue séparée, et quatre de caisses suivent les états existants. La cabine basse laisse la place aux deux charges sans déplacer leurs corps physiques.',
  path: 'src/foundry-simulation.mjs ; src/painted-transport.mjs',
});
update('PX115', {
  implemented: 'Formes industrielles originales SVG/Canvas et horizon de fonderie. Deux atlas/huit cellules ajoutent porteur et caisses peints de MI13. Leurs positions, dégâts, copie et transferts suivent le domaine; effets de progression et repli vectoriel restent présents.',
  path: 'src/foundry-assets.mjs ; assets/foundry ; src/renderer.mjs ; src/painted-transport.mjs',
});

const afterIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (touched.length !== 28 || new Set(touched).size !== 28) throw new Error('Expected exactly 28 targeted source records.');
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
console.log(JSON.stringify({ version: source.meta.version, records: afterIds.length, changedIds: touched, statuses, lots, statusesPreserved: true, acceptanceCriteriaPreserved: true }));
