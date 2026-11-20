#!/usr/bin/env node
/**
 * Complément de chronique 0.16.1 — critères QA de la tranche.
 * Additif : 26 critères QA232–QA257, tous « À produire ». Aucun critère existant,
 * aucun statut et aucun identifiant retiré ou promu.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'data/bible.json');
const bible = JSON.parse(readFileSync(file, 'utf8'));
const sheet = name => {
  const found = bible.sheets.find(s => s.name === name);
  if (!found) throw new Error(`Missing sheet ${name}`);
  return found;
};
const beforeIds = bible.sheets.flatMap(s => s.rows.map(r => r.id));
if (beforeIds.length !== 1131 || new Set(beforeIds).size !== 1131) {
  throw new Error('Expected 1,131 unique source IDs as the 0.16.1 lore baseline.');
}
const beforeStatus = new Map(bible.sheets.flatMap(s => s.rows.map(r => [r.id, r.status])));

sheet('QA').rows.push(
  /* ---------------------------------------------- Chronologie EC 61 */
  {
    id: 'QA232', area: 'Chronologie EC 61',
    scenario: 'Comparer chaque entrée de campagne à sa date EC, à son acte et à la table des transits, de MI01 (12 Compte) à MI32 (21 Fonte).',
    expected: 'Chaque mission porte une date unique et croissante ; aucun acte ne chevauche le suivant ; le total des transits reste 81 jours.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA233', area: 'Chronologie EC 61',
    scenario: 'Générer des dates valides et invalides : 36 Compte, 37 Compte, un jour de relève, 0 Semaille, puis changer d’année.',
    expected: 'Dix mois de 36 jours plus cinq jours de relève font 365 ; une date hors bornes est rejetée, jamais corrigée en silence.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA234', area: 'Chronologie EC 61',
    scenario: 'Recalculer les huit liaisons de l’anneau puis un trajet non voisin, par exemple Vesper–Orthe.',
    expected: 'L’anneau totalise 84 jours ; un trajet non voisin passe par Orthe et ne peut pas être plus court que la liaison déclarée.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA235', area: 'Chronologie EC 61',
    scenario: 'Vérifier les effets saisonniers annoncés contre la date réelle : marée de Nacre, glace de Sereis, récolte de Méridien, chaleur de Kharon.',
    expected: 'Un effet annoncé s’applique à la date prévue et pas avant ; une mission hors saison ne le reçoit pas.',
    priority: 'P1', status: 'À produire',
  },
  {
    id: 'QA236', area: 'Chronologie EC 61',
    scenario: 'Faire traverser une date consignée par export, import, migration v14 et relecture, puis comparer le journal.',
    expected: 'Aucune date consignée n’est réécrite ; une relecture ajoute ses faits sans modifier ceux du dossier officiel.',
    priority: 'P0', status: 'À produire',
  },

  /* ---------------------------------------------- Journal des faits SY140 */
  {
    id: 'QA237', area: 'Journal des faits SY140',
    scenario: 'Lire un document, subir une perte, entendre une rumeur, puis ouvrir le journal hors mission.',
    expected: 'Chaque entrée renvoie à un fait simulé ou à un document lu ; une rumeur reste marquée rumeur ; rien n’est complété par déduction.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA238', area: 'Journal des faits SY140',
    scenario: 'Détruire un original avant toute lecture, puis détruire un original après copie, et comparer les deux journaux.',
    expected: 'Avant copie, seule une entrée de perte existe ; après copie, la copie demeure et l’original détruit ne la remplace pas.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA239', area: 'Journal des faits SY140',
    scenario: 'Ouvrir une entrée et vérifier lieu, date EC, source, auteur ou support, et état : copie, original ou constat.',
    expected: 'Aucune entrée sans ces champs ; deux sources distinctes restent deux entrées et ne sont jamais fusionnées.',
    priority: 'P1', status: 'À produire',
  },
  {
    id: 'QA240', area: 'Journal des faits SY140',
    scenario: 'Provoquer un dialogue de preuve avec un personnage qui n’a pas vu le fait, puis avec un personnage qui l’a vu.',
    expected: 'Le premier ne cite pas le fait ; le second le cite avec sa source. Le journal n’accorde aucune connaissance rétroactive.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA241', area: 'Journal des faits SY140',
    scenario: 'Consulter le journal en pause, en mission et hors mission, puis exporter, recharger et comparer.',
    expected: 'La consultation ne mute aucun état ; les entrées et leur ordre survivent à l’export et au rechargement.',
    priority: 'P1', status: 'À produire',
  },
  {
    id: 'QA242', area: 'Journal des faits SY140',
    scenario: 'Comparer les entrées de deux parties ayant acquis les mêmes faits dans un ordre différent.',
    expected: 'Le contenu et la provenance sont identiques ; seul l’ordre d’acquisition diffère, et il est conservé comme tel.',
    priority: 'P1', status: 'À produire',
  },

  /* ---------------------------------------------- Cargaison SY142 */
  {
    id: 'QA243', area: 'Cargaison SY142',
    scenario: 'Charger caisses et personnes dans plusieurs ordres, puis comparer le manifeste au poids réellement embarqué.',
    expected: 'Chaque caisse montée retire une place, chaque personne embarquée retire une caisse ; le total est réconcilié après chaque chargement.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA244', area: 'Cargaison SY142',
    scenario: 'Tenter d’embarquer une caisse ou une personne par dialogue, par reprise ou par relecture.',
    expected: 'Aucune place n’est créée hors chargement réel ; un refus est inscrit et ne rend rien.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA245', area: 'Cargaison SY142',
    scenario: 'Interrompre un chargement par défaite, fermeture ou arrachement, puis reprendre la sortie.',
    expected: 'Ce qui est réellement monté reste monté ; rien n’est dupliqué ni restitué par la reprise.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA246', area: 'Cargaison SY142',
    scenario: 'Afficher le compte avant les choix de MI16 et de MI17, puis après chargement.',
    expected: 'Le joueur voit places, caisses et personnes avant de choisir ; l’écart entre annoncé et réel est signalé.',
    priority: 'P1', status: 'À produire',
  },
  {
    id: 'QA247', area: 'Cargaison SY142',
    scenario: 'Charger deux marcheurs puis une troisième machine, et saturer séparément la cale de pièces.',
    expected: 'Deux berceaux au maximum ; cale et places restent des ressources distinctes ; tout dépassement est refusé avec son motif.',
    priority: 'P1', status: 'À produire',
  },

  /* ---------------------------------------------- Résolution SY143 */
  {
    id: 'QA248', area: 'Résolution SY143',
    scenario: 'Rejouer deux fois la même fin depuis le même dossier et comparer famille, épilogues et reçu.',
    expected: 'Même famille, mêmes épilogues, même reçu ; aucun tirage aléatoire ni dépendance à l’ordre de consultation.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA249', area: 'Résolution SY143',
    scenario: 'Atteindre la dernière mission en retirant une condition requise : preuve, service, pacte ou témoin protégé.',
    expected: 'La famille correspondante n’est pas sélectionnée ; le reçu nomme précisément la condition manquante.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA250', area: 'Résolution SY143',
    scenario: 'Comparer deux dossiers proches : dossier complet avec réseaux détruits, puis centre pris avec dossier incomplet.',
    expected: 'Le premier donne FI02, le second FI03 ; aucune cinquième fin n’est créée pour une défaite, qui reste une reprise jouable.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA251', area: 'Résolution SY143',
    scenario: 'Parcourir les sept lieux de chaque famille et confronter chaque épilogue au journal.',
    expected: 'Vingt-huit épilogues atteignables ; aucun ne contredit un fait consigné ; les pertes restent nommées.',
    priority: 'P1', status: 'À produire',
  },
  {
    id: 'QA252', area: 'Résolution SY143',
    scenario: 'Examiner l’écran de fin et le reçu de résolution d’une partie quelconque.',
    expected: 'Aucun total, aucune barre, aucune note ; le reçu liste seulement les conditions remplies et manquantes.',
    priority: 'P1', status: 'À produire',
  },

  /* ---------------------------------------------- Atteignabilité des fins */
  {
    id: 'QA253', area: 'Atteignabilité des fins',
    scenario: 'Parcourir la campagne avec dossier triangulé, coalition tenue et services préservés jusqu’à MI32.',
    expected: 'FI01 est sélectionnée avec ses sept épilogues ; le coût annoncé — saison d’air perdue, aucun pardon officiel — est présent.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA254', area: 'Atteignabilité des fins',
    scenario: 'Parcourir avec preuves complètes mais réseaux d’eau, d’air ou de soins détruits et alliances rompues.',
    expected: 'FI02 est sélectionnée ; ses épilogues montrent la vérité et les services perdus, sans récompense morale.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA255', area: 'Atteignabilité des fins',
    scenario: 'Renverser le commandement en laissant la chaîne politique incomplète, puis laisser une autorité de remplacement reprendre la continuité.',
    expected: 'FI03 est sélectionnée ; les guichets persistent avec un vocabulaire neuf et la dépendance demeure.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA256', area: 'Atteignabilité des fins',
    scenario: 'Privilégier l’extraction, conserver les preuves et nommer les personnes sauvées sans prendre le centre.',
    expected: 'FI04 est sélectionnée ; le programme survit ailleurs, la vérité reste non diffusée et les personnes sauvées sont nommées.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA257', area: 'Atteignabilité des fins',
    scenario: 'Depuis un dossier v14 migré, chercher au moins un chemin valide vers chacune des quatre familles, puis compter les épilogues par lieu.',
    expected: 'Quatre chemins valides au minimum, aucun dépendant d’une source détruite ou d’un choix déjà fermé ; sept lieux par famille, vingt-huit au total.',
    priority: 'P0', status: 'À produire',
  },
);

/* ------------------------------------------------------------------ Méta */
const lore = { ...(bible.meta.loreTranche || {}) };
lore.added = 89;
lore.qa = { range: 'QA232–QA257', count: 26, status: 'À produire', rule: 'Critères de la tranche : chronologie EC 61, journal des faits SY140, cargaison SY142, résolution SY143 et atteignabilité des quatre fins. Aucun n’est exécuté.' };
bible.meta.loreTranche = lore;
bible.meta.scope = bible.meta.scope
  .replace('1 131 fiches, 20 onglets de conception, 133 critères initiaux conservés.', '1 157 fiches, 20 onglets de conception, 133 critères initiaux conservés, 26 critères QA de tranche à produire (QA232–QA257).');

/* -------------------------------------------------------------- Contrôles */
const afterIds = bible.sheets.flatMap(s => s.rows.map(r => r.id));
if (new Set(afterIds).size !== afterIds.length) throw new Error('Duplicate source ID after update.');
for (const id of beforeIds) if (!afterIds.includes(id)) throw new Error(`Lost source ID ${id}`);
for (const [id, status] of beforeStatus) {
  const row = bible.sheets.flatMap(s => s.rows).find(r => r.id === id);
  if (row.status !== status) throw new Error(`Promoted status ${id}: ${status} -> ${row.status}`);
}
const counts = Object.fromEntries(bible.sheets.map(s => [s.name, s.rows.length]));
if (counts.QA !== 257) throw new Error(JSON.stringify(counts.QA));
if (counts.Narration !== 170 || counts.Campagne !== 32) throw new Error(JSON.stringify(counts));
const qa = sheet('QA').rows;
const newQa = qa.filter(r => Number(r.id.slice(2)) >= 232);
if (newQa.length !== 26 || newQa.some(r => r.status !== 'À produire')) throw new Error('QA tranche must be 26 rows, all pending.');
bible.meta.sheetCount = bible.sheets.length;
bible.meta.recordCount = bible.sheets.reduce((n, s) => n + s.rows.length, 0);
if (bible.meta.recordCount !== 1157) throw new Error(`Unexpected record count ${bible.meta.recordCount}`);

writeFileSync(file, `${JSON.stringify(bible, null, 2)}\n`);
console.log(JSON.stringify({ version: bible.meta.version, tranche: lore.id, rows: bible.meta.recordCount, qa: 'QA232–QA257', added: afterIds.length - beforeIds.length, pendingQa: qa.filter(r => r.status === 'À produire').length }));
