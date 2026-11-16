#!/usr/bin/env node
/** Record the combat sprite patch while preserving the catalogue and acceptance criteria. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const file = path.join(root, 'data/bible.json');
const source = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!['0.15.1', '0.15.2'].includes(source.meta.version)) throw new Error('Expected the painted MI14 source or its 0.15.2 combat patch.');
const before = structuredClone(source);
const beforeIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (source.sheets.length !== 20 || beforeIds.length !== 1007 || new Set(beforeIds).size !== 1007) throw new Error('Expected 20 data sheets and 1,007 unique source IDs.');
const rows = new Map(source.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row])));
const touched = [];
function update(id, changes) {
  const row = rows.get(id);
  if (!row) throw new Error(`Missing source ID ${id}`);
  if (Object.hasOwn(changes, 'acceptance')) throw new Error('Original acceptance criteria must remain intact.');
  Object.assign(row, changes);
  touched.push(id);
}

source.meta.version = '0.15.2';
source.meta.scope = 'MI01–MI14 jouables au stade prototype, six châssis, trois opérations autonomes et dossier v14. MI15–MI32 et les seize contrats restent conçus. Les 1 007 IDs et les 133 critères initiaux sont conservés. Neuf atlas peints de combat ajoutent 78 cellules, dont 32 poses de marche et sept armes séparées. Avec les huit atlas MI14 et leurs 54 cellules, le total atteint 17 atlas et 132 cellules. Les rôles sont génériques, sans variantes de factions complètes. Art, cycles finaux, marcheurs articulés, faune et réception humaine restent ouverts.';
source.sheets.find(sheet => sheet.name === 'Prototype').description = 'Portée présente dans le code de la version 0.15.2. Les capacités finales des catalogues restent distinctes. Les limites de chaque fiche décrivent le travail ouvert.';

update('AS11', {
  spec: 'Silhouettes par rôle, déplacement, couverture, tir, blessure, reddition et évacuation. Réception partielle 0.15.2 : fusilier, tireur de précision et lancier génériques, chacun sur douze cellules peintes dont huit de marche, avec arme séparée. Aucun insigne ni variante impériale complète. Les tenues de faction, actions et cycles finaux restent à produire.',
});
update('AS12', {
  spec: 'Variété de protections et outils; différences de doctrine visibles sans uniformiser tous les civils. Réception partielle 0.15.2 : trois rôles combattants génériques et une tenue civile peinte, sans logo de faction. Les variantes rebelles et pirates, leur provenance, leur doctrine visuelle et les cycles finaux restent à produire.',
});
update('AS14', {
  spec: 'Camion d’escorte, patin pirate, drone, tourelle et marcheur lourd ennemi. Réception partielle 0.15.2 : cinq atlas de six cellules pour buggy, patin, drone, tourelle et convoi; corps peints, armes séparées et références endommagées, épaves ou pièces. Collisions conservées. Marcheur lourd, pièces articulées et animations finales restent à produire.',
  status: 'Prototype',
});
update('PR12', {
  deliverable: 'Identité visuelle, environnements et silhouettes mécaniques lisibles. Réception partielle 0.15.2 : neuf atlas de combat, 78 cellules dont 32 poses de marche et sept armes séparées; 17 atlas et 132 cellules avec MI14. Variantes de factions, cycles finaux, marcheurs articulés et faune restent ouverts.',
});
update('PX07', {
  implemented: 'Ennemi terrestre qui s’approche, annonce une attaque et tire un projectile. Atlas peint de douze cellules, huit poses de marche déclenchées par le déplacement réel et arme indépendante. Visée, avertissement et projectile partagent le même point de bouche.',
  limits: 'Couvertures, escouade, repli et reddition du design final restent à produire. Le rôle peint est générique; variantes de factions, transitions et cycle final restent ouverts. Les cellules hors combat ne constituent pas une simulation de soins.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/painted-combat.mjs ; src/enemy-weapon-pose.mjs',
});
update('PX08', {
  implemented: 'Cadence lente, préparation lisible et attaque orientée vers la partie basse du marcheur. Atlas peint de douze cellules, huit poses de marche liées au déplacement réel et lanceur séparé. Le projectile part du point de bouche commun au rendu et à l’avertissement.',
  limits: 'Pas de coopération entre lanceurs ni d’analyse tactique du cycle de chaque jambe. Le rôle peint reste générique; variantes de factions, transitions et cycles finaux restent à produire.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/painted-combat.mjs ; src/enemy-weapon-pose.mjs',
});
update('PX09', {
  implemented: 'Véhicule rapide à intégrité supérieure à l’infanterie; maintient une distance d’engagement. Atlas peint de six cellules, corps et arme séparés. Le point de bouche est partagé entre rendu, avertissement et projectile; collisions inchangées.',
  limits: 'Véhicule de validation de la famille des raids, distinct de la moto Éclat finale; pas de roues destructibles. Pièces détachées et épave restent des références lorsque la simulation ne les affiche pas. Roues animées et cycle final restent à produire.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/painted-combat.mjs ; src/enemy-weapon-pose.mjs',
});
update('PX10', {
  implemented: 'Déplacement aérien et tir vers la coque; ne subit pas le piétinement. Atlas peint de six cellules et arme séparée. Visée, avertissement et projectile partagent le même point de bouche; le corps suit sa position simulée.',
  limits: 'Représentation de validation du drone Lynx; acquisition thermique et pathfinding avancé non réalisés. Rotors, pièces et épave servent aussi de références de production; leur animation finale reste ouverte.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/painted-combat.mjs ; src/enemy-weapon-pose.mjs',
});
update('PX12', {
  implemented: 'Arme fixe qui acquiert une cible proche, prépare puis tire. Atlas peint de six cellules, corps et canon séparés. Le point de bouche commun au rendu, à l’avertissement et au projectile suit la visée; collisions conservées.',
  limits: 'Balayage d’arc, bloc électrique séparé et neutralisation non destructive restent à produire. Les références de pièces et d’épave ne constituent pas un système de destruction articulée; finition et animations finales restent ouvertes.',
  path: 'src/content.mjs ; src/simulation.mjs ; src/painted-combat.mjs ; src/enemy-weapon-pose.mjs',
});
update('PX21', {
  implemented: 'Piétinement au contact, projectiles pouvant toucher civils, pertes comptées séparément; convoi suit à portée et peut être détruit. Une tenue civile peinte offre huit poses de marche liées au déplacement réel. Le convoi reçoit un atlas peint de six cellules; les collisions sont conservées.',
  limits: 'Sorties de foule, soins et évacuations multiples restent à produire. Une seule tenue civile générique; poses accroupie et hors combat ainsi que pièces du transport restent des références lorsqu’elles ne sont pas affichées par la simulation. Cycles finaux ouverts.',
  path: 'src/simulation.mjs ; src/painted-combat.mjs',
});
update('PX24', {
  implemented: 'Illustration de titre, panorama Vesper, silhouettes articulées et ambiances distinctes. Neuf atlas de combat ajoutent 78 cellules, 32 poses de marche et sept armes séparées; avec MI14 : 17 atlas, 132 cellules. Découpe et ancres documentées, chargement asynchrone et repli vectoriel.',
  limits: 'Art au stade Prototype : rôles génériques sans logo de faction, variations et transitions limitées. Factions complètes, cycles finaux, sprites de marcheurs articulés, faune et campagne entièrement peinte restent à produire. Réception navigateur et humaine distincte des contrôles automatisés.',
  path: 'assets/art ; assets/painted ; src/renderer.mjs ; src/painted-combat.mjs',
});

const afterIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (JSON.stringify(beforeIds) !== JSON.stringify(afterIds)) throw new Error('An existing ID moved or changed.');
if (JSON.stringify(before.meta.productionBaseline) !== JSON.stringify(source.meta.productionBaseline)) throw new Error('The original production baseline changed.');
if (JSON.stringify(before.meta.release) !== JSON.stringify(source.meta.release)) throw new Error('Campaign, chassis, operations or save scope changed.');
for (let i = 0; i < source.sheets.length; i++) {
  const oldSheet = before.sheets[i], sheet = source.sheets[i];
  if (oldSheet.name !== sheet.name || JSON.stringify(oldSheet.columns) !== JSON.stringify(sheet.columns)) throw new Error('Sheet structure changed.');
  for (let j = 0; j < sheet.rows.length; j++) {
    const oldRow = oldSheet.rows[j], row = sheet.rows[j];
    if (oldRow.acceptance !== row.acceptance) throw new Error(`Acceptance criterion changed for ${row.id}.`);
    if (oldRow.expected !== row.expected) throw new Error(`Expected result changed for ${row.id}.`);
    if (!touched.includes(row.id) && JSON.stringify(oldRow) !== JSON.stringify(row)) throw new Error(`Unexpected row change: ${row.id}.`);
    if (oldRow.status !== row.status && !(row.id === 'AS14' && oldRow.status === 'À produire' && row.status === 'Prototype')) throw new Error(`Unexpected status change: ${row.id}.`);
  }
}
fs.writeFileSync(file, JSON.stringify(source, null, 2) + '\n');
const counts = {};
for (const row of rows.values()) counts[row.status] = (counts[row.status] || 0) + 1;
console.log(JSON.stringify({ version: source.meta.version, records: afterIds.length, changedIds: touched, statusChange: { id: 'AS14', from: 'À produire', to: 'Prototype' }, statuses: counts, acceptanceCriteriaPreserved: true }));
