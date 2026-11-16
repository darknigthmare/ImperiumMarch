#!/usr/bin/env node
/** Record the painted MI14 patch without adding IDs or changing status claims. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const file = path.join(root, 'data/bible.json');
const source = JSON.parse(fs.readFileSync(file, 'utf8'));
if (!['0.15.0', '0.15.1'].includes(source.meta.version)) throw new Error('Expected the recovered 0.15 source or its 0.15.1 patch.');
const beforeIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
const statuses = source.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row.status]));
if (beforeIds.length !== 1007 || new Set(beforeIds).size !== 1007) throw new Error('Expected 1,007 unique source IDs.');
const rows = new Map(source.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row])));
function update(id, changes) {
  const row = rows.get(id);
  if (!row) throw new Error(`Missing source ID ${id}`);
  Object.assign(row, changes);
}

source.meta.version = '0.15.1';
source.meta.scope = 'MI01–MI14 jouables au stade prototype, six châssis, trois opérations autonomes et dossier v14. MI15–MI32 et les seize contrats restent conçus. Les 1 007 IDs et les 133 critères initiaux sont conservés. MI14 reçoit huit atlas peints transparents, 54 cellules dont seize poses de marche sur deux tenues. Art et animations restent au stade Prototype ; essais natifs et humains gardent une réception distincte.';
update('AS19', {
  spec: 'Roches, installations, chaleur et glace. MI13–MI14 disposent de kits SVG/Canvas. MI14 ajoute huit atlas peints transparents, 54 cellules de personnages et machines. Sereis et la finition complète restent à produire.',
});
update('PR99', {
  deliverable: 'Atelier MI14 : huit atlas PNG peints, 54 cellules, dont seize poses de marche sur deux tenues. États des machines, HUD, choix et bilan reliés à la simulation.',
});
update('PX117', {
  implemented: 'Huit personnes locales, passage demandé et trajet vers la galerie. Deux tenues peintes, huit poses de marche chacune. Automate activé après alerte, canon séparé lié à sa visée.',
  limits: 'Les 24 cellules des deux tenues comprennent aussi repos, arrivée, perte et deux poses agenouillées de référence. Animation finale, voix et réception humaine restent ouvertes.',
  path: 'src/workshop-simulation.mjs ; src/painted-sprites.mjs',
});
update('PX118', {
  implemented: 'Inspection, vanne, réparation et commande de reprise ou d’arrêt. Les sprites peints des machines suivent leurs états simulés et leurs pertes.',
});
update('PX121', {
  implemented: 'Huit atlas PNG transparents, 54 cellules : 24 de personnes, 30 de machines et accessoires. Découpe au rendu, ancres documentées et repli vectoriel. Images sources conservées sans retouche.',
  limits: 'Production graphique au stade Prototype. Deux poses agenouillées restent des références. Réception du rendu, navigateur et essai humain sont distincts ; les animations finales restent ouvertes.',
  path: 'assets/painted/mi14 ; src/painted-sprites.mjs ; src/painted-sprite-layout.mjs',
});
const afterIds = source.sheets.flatMap(sheet => sheet.rows.map(row => row.id));
if (JSON.stringify(beforeIds) !== JSON.stringify(afterIds)) throw new Error('An existing ID moved or changed.');
if (JSON.stringify(statuses) !== JSON.stringify(source.sheets.flatMap(sheet => sheet.rows.map(row => [row.id, row.status])))) throw new Error('The visual patch must preserve status claims.');
fs.writeFileSync(file, JSON.stringify(source, null, 2) + '\n');
console.log(JSON.stringify({ version: source.meta.version, records: afterIds.length, changedIds: ['AS19', 'PR99', 'PX117', 'PX118', 'PX121'], statusesPreserved: true }));
