#!/usr/bin/env node
/**
 * Tranche MI16 — critères QA de conception.
 * Additif : 20 critères QA258–QA277, tous « À produire ». Aucun critère existant,
 * aucun statut, aucun identifiant et aucune mission jouable ne sont modifiés.
 * La tranche est documentaire : MI16 reste Conçu, la sauvegarde reste v14.
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
const rows = bible.sheets.flatMap(s => s.rows);
if (rows.length !== 1157 || new Set(rows.map(r => r.id)).size !== 1157) {
  throw new Error('Expected 1,157 unique source IDs as the 0.16.1 baseline.');
}
if (sheet('QA').rows.length !== 257) throw new Error('Expected 257 QA rows as the 0.16.1 baseline.');
const beforeStatus = new Map(rows.map(r => [r.id, r.status]));

sheet('QA').rows.push(
  /* ---------------------------------------------- Capacité 16 places */
  {
    id: 'QA258', area: 'Capacité MI16',
    scenario: 'Compter les places de La Veilleuse, puis charger une caisse de preuve, une personne valide, un brancard et une caisse de pièces en vérifiant le total après chaque opération.',
    expected: '20 places moins 4 réservées font 16 allouables ; une preuve coûte 2 places, une personne 1, un brancard 2 et une pièce 1 ; le total ne dépasse jamais 16.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA259', area: 'Capacité MI16',
    scenario: 'Saturer les 16 places dans plusieurs ordres — preuves d’abord, personnes d’abord, puis mixte — et comparer le compte au manifeste affiché.',
    expected: 'Le coût dépend du type et non de l’ordre ; le total est réconcilié après chaque chargement ; l’écart entre places annoncées et places réelles est nul.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA260', area: 'Capacité MI16',
    scenario: 'Tenter un dépassement par caisse, par personne et par brancard, puis libérer une place et recharger.',
    expected: 'Chaque refus porte son motif — capacité, réservé ou déjà chargé ; aucun objet n’est rogné ni remplacé en silence ; une place libérée autorise exactement le coût libéré.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA261', area: 'Capacité MI16',
    scenario: 'Tenter de débarquer l’eau ou le carburant, puis de créer une place par dialogue, reprise, relecture et rechargement.',
    expected: 'Les 4 places réservées restent indisponibles ; aucune place n’est créée hors chargement réel ; le total reste 16 après reprise et relecture.',
    priority: 'P1', status: 'À produire',
  },

  /* ---------------------------------------------- Arrimage interrompu */
  {
    id: 'QA262', area: 'Arrimage interrompu',
    scenario: 'Interrompre l’arrimage d’une caisse par un tir, une chute ou un déplacement du joueur, puis reprendre l’opération.',
    expected: 'Le travail interrompu ne crédite aucune place et ne consomme aucun matériel ; la caisse reste au quai dans son état antérieur ; seule une opération achevée est comptée.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA263', area: 'Arrimage interrompu',
    scenario: 'Charger avec Kader mort ou hors de service, endommager une caisse de preuve, puis partir avec une coque inférieure à 50.',
    expected: 'La caisse est cargoSecured:false et n’arrive pas si la coque est sous 50 ; une preuve endommagée reste présente mais non certifiée ; le reçu distingue proofsBoarded et proofsArrived.',
    priority: 'P1', status: 'À produire',
  },

  /* ---------------------------------------------- Rapport bloquant */
  {
    id: 'QA264', area: 'Rapport bloquant',
    scenario: 'Fermer la rampe sans transmettre le rapport, puis tenter de décoller et de reprendre la sortie.',
    expected: 'L’extraction est refusée ; la sortie est perdue sans reçu ni dotation ; le checkpoint de début reste disponible et la reprise ne crédite rien.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA265', area: 'Rapport bloquant',
    scenario: 'Transmettre un rapport dont une clause est vide, puis tenter obey et defy.',
    expected: 'Un rapport incomplet interdit obey et autorise defy si une preuve est à bord ; le reçu marque reportFiled, les trois clauses et le libellé retenu.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA266', area: 'Rapport bloquant',
    scenario: 'Déclarer la continuité rétablie en taisant un mort ou une caisse laissée à quai, puis relire le reçu.',
    expected: 'Le rapport ne modifie ni les morts ni les caisses ; le reçu conserve crewLost et leftBehindProofs tels quels, même sous un libellé favorable.',
    priority: 'P0', status: 'À produire',
  },

  /* ---------------------------------------------- PO04 conditionnelle */
  {
    id: 'QA267', area: 'PO04 conditionnelle',
    scenario: 'Accomplir deux écoutes de Jun, copier le bordereau, puis certifier la clause 3 avant de quitter Kharon.',
    expected: 'PO04 n’existe qu’avec les trois actes datés et sourcés ; chaque acte manquant laisse un constat, jamais une pièce partielle promue.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA268', area: 'PO04 conditionnelle',
    scenario: 'Omettre une écoute, puis omettre la copie du bordereau, puis omettre la clause 3, en conservant les deux autres actes.',
    expected: 'Chaque omission produit un constat motivé et aucune PO04 ; le dossier nomme l’acte manquant sans le reconstituer.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA269', area: 'PO04 conditionnelle',
    scenario: 'Comparer un dossier avec PO04 et un dossier sans, puis chercher PT04 et TE02 dans les deux.',
    expected: 'PO04 ne crée ni PT04 ni TE02 et n’établit pas la chaîne PALINODE complète ; aucun dossier MI16 ne contient une preuve de MI15.',
    priority: 'P1', status: 'À produire',
  },

  /* ---------------------------------------------- Défection MI16 */
  {
    id: 'QA270', area: 'Défection MI16',
    scenario: 'Tenter defy sans rapport, sans preuve à bord, sans accord de Hela, puis avec une navette sous les seuils de départ.',
    expected: 'Chaque refus porte son motif — no-report, no-proof, no-accord, shuttle-down ; aucun de ces états ne produit defected.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA271', area: 'Défection MI16',
    scenario: 'Valider un reçu defy complet, puis provoquer une défaite après avoir choisi defy sans reçu.',
    expected: 'defected et depots.sealed passent à vrai seulement sur un reçu valide ; une défaite laisse la campagne inchangée et lastFailure sans champ de victoire.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA272', area: 'Défection MI16',
    scenario: 'Terminer MI16 en obey puis en defy, et comparer resources.parts, la dotation et les preuves.',
    expected: 'obey accorde la dotation une seule fois ; defy n’accorde aucune dotation impériale ; une relecture ne redonne ni l’une ni l’autre.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA273', area: 'Défection MI16',
    scenario: 'Faire mourir Kader, Milo, Jun et Ilan, gagner la sortie, puis rejouer et relire la mission.',
    expected: 'Chaque mort est écrite une fois dans crew.*.alive et au reçu ; une relecture ne ressuscite personne et n’ajoute aucun mort ; Hela et Sera ne meurent jamais.',
    priority: 'P1', status: 'À produire',
  },

  /* ---------------------------------------------- Persistance cargaison MI16 */
  {
    id: 'QA274', area: 'Persistance cargaison MI16',
    scenario: 'Gagner MI16 avec deux preuves, trois personnes et un brancard, puis lire la cale et recalculer les places.',
    expected: 'ship.cargo contient exactement ce qui est arrivé ; free égale 16 moins la somme des slots ; aucun doublon d’id ni champ free stocké.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA275', area: 'Persistance cargaison MI16',
    scenario: 'Comparer une victoire obey et une victoire defy, puis vérifier les preuves dans la cale et dans les fins.',
    expected: 'obey sort les preuves de la cale et libère leurs places ; defy les conserve ; aucune preuve laissée, détruite ou remise n’est recréée.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA276', area: 'Persistance cargaison MI16',
    scenario: 'Échouer à MI16 par abandon, puis rejouer la mission, puis relire une victoire déjà obtenue.',
    expected: 'La défaite laisse la cale au checkpoint de début ; la relecture laisse la cale identique ; aucune seconde cargaison, aucun doublon, aucune place recréée.',
    priority: 'P0', status: 'À produire',
  },
  {
    id: 'QA277', area: 'Persistance cargaison MI16',
    scenario: 'Depuis un dossier MI16 gagné, lancer une mission qui exige une preuve absente ou plus de places que libres.',
    expected: 'Le briefing refuse avec hold-insufficient et nomme le prérequis ou le manque de places ; aucune preuve requise n’est ignorée ni jetée en silence ; une preuve left ou damaged reste lisible sans être restaurée.',
    priority: 'P1', status: 'À produire',
  },
);

/* ------------------------------------------------------------------ Méta */
bible.meta.mi16Tranche = {
  id: '0.16.2',
  source: 'docs/MI16_TRANCHE_VERTICALE.md',
  added: 20,
  qa: {
    range: 'QA258–QA277', count: 20, status: 'À produire',
    rule: 'Critères de la tranche MI16 : capacité 16 places et refus motivés, arrimage interrompu, rapport bloquant, PO04 conditionnelle, défection et persistance de la cargaison vers MI17. Aucun n’est exécuté ; MI16 reste Conçu, la campagne jouable reste MI01–MI14.',
  },
};
bible.meta.scope = bible.meta.scope
  .replace('1 157 fiches', '1 177 fiches')
  .replace('26 critères QA de tranche à produire (QA232–QA257).', '26 critères QA de tranche à produire (QA232–QA257) et 20 critères QA MI16 à produire (QA258–QA277).');

/* -------------------------------------------------------------- Contrôles */
const afterRows = bible.sheets.flatMap(s => s.rows);
const afterIds = afterRows.map(r => r.id);
if (new Set(afterIds).size !== afterIds.length) throw new Error('Duplicate source ID after update.');
for (const id of rows.map(r => r.id)) if (!afterIds.includes(id)) throw new Error(`Lost source ID ${id}`);
for (const [id, status] of beforeStatus) {
  const row = afterRows.find(r => r.id === id);
  if (row.status !== status) throw new Error(`Promoted status ${id}: ${status} -> ${row.status}`);
}
const qa = sheet('QA').rows;
const added = qa.filter(r => Number(r.id.slice(2)) >= 258);
if (added.length !== 20 || added.some(r => r.status !== 'À produire')) throw new Error('MI16 QA must be 20 pending rows.');
if (added[0].id !== 'QA258' || added.at(-1).id !== 'QA277') throw new Error('Unexpected MI16 QA range.');
if (bible.meta.version !== '0.16.0') throw new Error('Application version must stay 0.16.0.');
if (bible.meta.release.saveFormatVersion !== 14) throw new Error('Save format must stay v14.');
bible.meta.sheetCount = bible.sheets.length;
bible.meta.recordCount = bible.sheets.reduce((n, s) => n + s.rows.length, 0);
if (bible.meta.recordCount !== 1177) throw new Error(`Unexpected record count ${bible.meta.recordCount}`);

writeFileSync(file, `${JSON.stringify(bible, null, 2)}\n`);
console.log(JSON.stringify({
  version: bible.meta.version, tranche: bible.meta.mi16Tranche.id,
  rows: bible.meta.recordCount, qa: 'QA258–QA277', added: afterIds.length - rows.length,
  pendingQa: qa.filter(r => r.status === 'À produire').length,
}));
