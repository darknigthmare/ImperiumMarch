# Habitants et services du quai de Nacre — 0.15.9

Ce lot complète les personnages déjà simulés dans MI06 et MI08. Les PNG sont des sorties originales Imagegen conservées sans modification de pixels. Les prompts exacts et la provenance de chaque sortie sélectionnée sont dans `prompts.json`.

| Atlas | Cellules | Utilisées au rendu | Références |
| --- | ---: | ---: | ---: |
| `residents.png` | 12 | 12 | 0 |
| `refugees.png` | 12 | 10 | 2 |
| `dockworkers.png` | 12 | 10 | 2 |
| `mara.png` | 6 | 5 | 1 |
| `ancillary.png` | 6 | 5 | 1 |
| **Total** | **48** | **42** | **6** |

Les deux premières planches proposent deux apparences civiles chacune. La troisième distingue équipage de Rive-Courte et responsable du port. Les deux dernières donnent une silhouette à Mara et au personnel sanitaire non identifié. Les huit apparences ont chacune un arrêt et quatre poses de marche. Les huit poses de perte n’ont pas toutes le même usage : seules les deux pertes de résidents sont utilisées, dans MI06, où un corps exposé était déjà dessiné.

## Présence et identité

- **MI06 :** les dix habitants quittent réellement leurs maisons avant d’apparaître. Les deux apparences suivent leur ID courant, leur trajet, leur santé, leur perte et leur arrivée à l’abri. Un corps perdu conserve son emplacement ; une personne accueillie disparaît comme auparavant. Les techniciens gardent leur atlas 0.15.8.
- **MI08 :** résidents, réfugiés, équipage, responsable du port, Mara et personnel sanitaire générique utilisent leurs rôles existants. Les personnes à bord conservent les indicateurs uniques de pont. Aucune dépouille n’est ajoutée aux pertes MI08.
- Les variations calculées depuis l’ID courant sont graphiques. Elles ne restaurent pas une identité que les anciens agrégats ne conservent pas, et ne relient pas arbitrairement deux individus entre missions.
- L’équipage anonyme n’est pas identifié comme Vann Ostre. Le personnel `staff` ne reçoit l’apparence générique que lorsque `originalId` est absent ; la conductrice et le soignant identifiés conservent leur atlas 0.15.8.
- Mara PN07 n’est dessinée que comme l’actrice existante `aval-mara` de MI08, après avoir quitté sa phase `offsite`. Ses échanges MI06 et MI07 restent radiophoniques.

## Mesures et intégration

`tools/index-painted-nacre-civilians.py` mesure les cellules dans les dimensions réelles des PNG, en arrondissant chaque frontière séparément, demi-pixels vers le haut. Les rectangles d’alpha au seuil 32, les origines de tête au seuil 96 et la ligne visible des semelles déterminent les cadrages et les ancrages. Une même échelle issue de la pose d’arrêt est conservée pour les six poses de chaque apparence. Aucune image n’est retaillée, rééchantillonnée ou réencodée.

La grille nominale n’est pas supposée parfaite : le premier résident couché dépasse légèrement sa colonne. Les cellules voisines sont séparées dans la marge transparente mesurée à `x=310` sur cette rangée. Les dernières poses couchées de résidents et réfugiés reçoivent également une marge de lecture par des limites mesurées à `x=1075` et `x=1074`. Les poses couchées de Mara et du personnel générique emploient une frontière de seconde rangée à `x=900`. Ces limites ne déplacent ni ne coupent les figures. Le manifeste conserve les rectangles exacts et leurs exceptions.

Le module `src/painted-nacre-civilians.mjs` demeure hors simulation. Il pose le sprite sur `person.y + person.h / 2` et choisit sa marche par la distance réellement parcourue. Un temps arrêté garde la pose ; un blocage ne fait pas marcher sur place ; une téléportation remet l’historique à zéro ; la réduction des mouvements conserve l’arrêt. L’historique vit dans une `WeakMap` et n’entre jamais dans le dossier v14.

Les six cellules de référence sont exclues de `paintedNacreCivilianFrame()` et de toute sélection runtime. Le renderer conserve ses conditions de présence, ses indicateurs d’embarquement et son repli vectoriel si un chargement ou un dessin échoue. Les pertes de résidents ne sont autorisées qu’avec leur `homeId` de MI06, même si un appel MI08 demandait par erreur une pose perdue.

## Réception

Les tests ciblés sont dans `tests/painted-nacre-civilians.test.mjs`. Le contrôle `tools/test-painted-nacre-civilians.mjs` décode les cinq PNG, contrôle leur transparence, leurs empreintes et l’absence de découpe d’alpha significatif. Ses bancs et scènes Canvas distinguent les états graphiques imposés et les étapes atteintes par commandes publiques.

Les preuves nouvelles vont dans `docs/validation/painted-nacre-civilians-v0159/`. Un rendu Canvas n’est ni une capture navigateur ni un essai humain. La qualité des cycles finaux, la lisibilité humaine et les gestes détaillés restent à recevoir.
