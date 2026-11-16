# Sauvegarde de campagne v14 — Les mains noires

**Version du jeu 0.15.0 · 16 novembre 2026**

## Format et migration

Le format reste `ordre-de-cendre.campaign`. La clé principale reste `imperium.campaign.v1` et sa copie de secours `imperium.campaign.v1.backup`. Leur suffixe est historique ; le contenu courant porte `version: 14`.

Les migrations antérieures gardent leurs règles. Depuis un dossier v13 valide, la nouvelle étape ajoute seulement `world.kharon.workshop` non visité, puis la version 14. Elle conserve les treize rapports, les stocks, les relations, l’ancien `stage`, les coordonnées, les temps et les anciens checkpoints. Elle n’accomplit aucun travail de MI14 et ne crédite aucune récompense.

La progression choisit le premier rapport absent. Un ancien marqueur de campagne complète ne rend pas les quatorze missions déjà terminées. MI14 exige réellement le premier rapport MI13.

La lecture ne réécrit pas le fichier. Lors du premier enregistrement après migration, le mécanisme de sauvegarde conserve l’ancien texte en secours. Une version future ou un format étranger restent protégés contre un écrasement automatique.

## Sources v13 conservées

Les deux fixtures nouvelles proviennent du commit local immuable de reconstruction `fc9f4af4e103adf93d4310053610ca69bea443b3`. Cette référence n’est pas un commit public ; la reprise de publication conserve son arbre sous une autre révision et maintient les empreintes de provenance :

| Fixture | État conservé | Rapports |
| --- | --- | ---: |
| `campaign-v13-mi13.json` | MI13 achevée et point antérieur à sa décision | 13 |
| `campaign-v13-mi13-transfer.json` | MI13 active, premier transfert interrompu à sa progression enregistrée | 12 |

Le [manifeste de provenance](validation/v015-historic-v13.json) fixe les chemins source, blobs Git, tailles et SHA-256. Ce sont des exports préparés par les commandes publiques de simulation de la reconstruction 0.14.1. Ils ne sont pas présentés comme des exports de navigateur. Aucun module MI14 n’a servi à les régénérer.

Les fixtures v1 à v11 et les preuves historiques restent inchangées. Le dossier v12 de reconstruction conserve sa provenance propre ; il ne remplace pas les octets perdus d’une livraison locale ancienne.

## Domaine d’atelier

`workshop` n’existe dans une scène active que pour MI14. Le dossier distingue les personnes, leurs trajets et pertes, la demande de passage, les paroles recueillies, la copie du lot, le diagnostic, l’isolation, la réparation, la commande réellement exécutée, la coopération et le rapport transmis.

Les huit ouvriers sont recensés sur place. Trois viennent de Nacre, avec une arrivée antérieure au recensement connu ; leur origine ne permet aucun transfert depuis MI05–MI08. Les deux mécaniciens restent dans l’atelier. Leur disponibilité future ne vaut ni recrutement ni présence à bord.

L’héritage de MI13 porte les faits du convoi et l’acquisition réelle de PT03. Le constat local peut exister sans PT03 ; dans ce cas aucun recoupement industriel antérieur n’est créé. MI14 n’attribue aucun nouvel identifiant PT, TE ou PO.

## Checkpoints et faits persistants

Un checkpoint est une copie profonde. Les corps, positions, intégrités, pertes et dates, avancement des travaux, alerte et acquisitions doivent se rapprocher des faits déclarés. Les comparaisons entre points empêchent de restaurer un organe détruit ou d’effacer une perte par simple réécriture du bilan.

Une pause suspend la même horloge que le déplacement des ouvriers, l’alerte et les travaux. Reprendre retrouve cet état. Une défaite reste terminale. Le redémarrage explicite crée une nouvelle sortie ; il ne transforme pas la scène perdue en partie vivante. Le point antérieur à la décision n’autorise pas à revenir avant l’état officiel ultérieur.

Une copie acquise survit à la perte de son original. Une destruction antérieure à la copie laisse une absence. Une réparation accomplie reste un acte historique même si le refroidisseur est ensuite détruit ; sa disponibilité présente tient compte de cette destruction. Une coopération obtenue n’efface pas la mort ultérieure d’un mécanicien.

## Premier rapport et relecture

Le premier rapport gagné inscrit un reçu détaché et le domaine du monde, conserve l’état du marcheur et attribue quatre lots une seule fois. La dotation initiale étant de six lots, quatorze premières réussites donnent 62 lots avant les dépenses d’atelier. Les frais réellement payés restent soustraits.

Une relecture garde son propre résultat. Elle ne remplace pas le premier rapport, ne renouvelle pas sa dotation et ne réécrit pas les sources, décisions ou pertes des sorties précédentes. `lastDebrief` doit correspondre au dernier reçu officiel.

## Réception

Le [rapport QA 0.15](QA_V15.md) fixe les vérifications exécutées sur les fichiers livrés. `tests/campaign-v14.test.mjs` porte les scénarios de migration, de reprise, de reçus et de relecture. Les tests de simulation, les contrôles DOM, le rendu Canvas, le navigateur et l’essai humain conservent des portées distinctes. La seule présence d’un test ne constitue pas un résultat.
