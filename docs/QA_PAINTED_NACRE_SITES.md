# Réception des installations peintes de Nacre — 0.15.6

## Résultat de cette réception

**Cinq PNG originaux, trente cellules de rendu, zéro référence : réception ciblée réussie.** Le décodage des vrais PNG, leurs empreintes, les rectangles, les ancres et dix vues Canvas ont été contrôlés. Les six tests de `tests/painted-nacre-sites.test.mjs` passent. Les dix images ont été inspectées visuellement, notamment sur fond clair/sombre, sur le terrain de Nacre et avec les superpositions d’eau.

Cette réception couvre la présentation des installations existantes. Les décisions, collisions, populations, dépenses, déplacements, arrivées et sauvegardes restent ceux de la simulation. Aucun fichier de simulation ou fixture historique n’a été modifié par ce lot. Les constructions et contrôles globaux de la version sont consignés séparément.

## Inventaire attesté

| Atlas | Dimensions | Cellules | Octets |
|---|---|---:|---:|
| `barriers.png` | 1254 × 1254 | 6 | 1 643 320 |
| `hydraulics.png` | 1254 × 1254 | 8 | 1 571 903 |
| `houses.png` | 1254 × 1254 | 6 | 1 418 912 |
| `shelters.png` | 1254 × 1254 | 4 | 1 918 963 |
| `quays.png` | 1254 × 1254 | 6 | 1 226 572 |
| **Total** | | **30** | **7 779 670** |

Les fichiers se trouvent dans `assets/painted/nacre-sites/`. `manifest.json` contient leurs SHA-256 et chaque rectangle/ancra­ge. `prompts.json` conserve les cinq requêtes exactes d’Imagegen et les chemins des originaux. Les originaux sélectionnés restent inchangés. L’indexeur mesure seulement l’alpha et écrit les métadonnées.

L’alpha exactement nul représente respectivement environ 53,7 %, 57,5 %, 62,7 %, 44,3 % et 63,1 % des cinq images. La réception ne confond donc pas un fond noir, un damier ou un voile semi-opaque avec un fond transparent. Le banc des cellules et les scènes confirment leur composition sur les fonds du jeu.

## Fonctions raccordées et limites de couverture

| Mission | Installations peintes | Rendu conservé séparément |
|---|---|---|
| MI05 | Treuils, tambours, lames des tabliers levés | Câbles aux barges réelles, pieds du treuil, supports du tablier, bancs et marée, commandes, carburant |
| MI06 | Panneau, verrou, pompe, rotor, vanne, volant, deux maisons et leurs ruines, abri du quai | Appuis/étais réels, tuyaux de circuit, niveau d’eau, seuil blanc .65, ouvriers/habitants, couvertures et progressions |
| MI07 | Rampe repliée et platelage préparé, accueil médical civil et impérial | Barrières, portique, radios, relevé, choix de destination, zones d’arrêt, transfert physique et personnes |
| MI08 | Vantaux et commandes, maisons d’origine, trois accueils/refuges, quais, passerelles intactes | Rails fixes, câbles, pression/niveau, repères de marée, obturation de fortune, postes/radios/registre, progression et personnes ; rampe détruite en repli vectoriel |

Les véhicules Nacre peints en 0.15.5 restent inchangés. Aucun habitant, équipage ou patient n’est intégré aux nouveaux sprites. Les états de préparation ou de disponibilité emploient des superpositions dynamiques : ils ne sont pas comptés comme des images supplémentaires.

## Vérifications ciblées

La commande `node --test tests/painted-nacre-sites.test.mjs` exécute six cas :

1. Accès défensif aux trente cellules, limites des rectangles, cellules irrégulières et projection des ancres mesurées.
2. Pivots réels du rotor, du volant et du verrou, immobilité des rotations sous réduction des mouvements, absence de mutation.
3. Vantail aligné sur `departureGateBounds`, rails fixes et ruine au pied de l’ouvrage.
4. Lame alignée sur les deux extrémités d’un segment de terrain et maintien du repli pour les rampes détruites.
5. Exécution des fonctions de sites MI05 à MI08 avec comparaison intégrale du monde avant/après rendu.
6. Échec du décodeur, dimensions invalides, repli vectoriel et absence de chargement périmé après réinitialisation.

La commande `node tools/test-painted-nacre-sites.mjs` charge les cinq PNG réels avec Canvas natif, vérifie les SHA-256 et les silhouettes, compare les originaux du générateur lorsqu’ils sont encore disponibles localement, vérifie les ancres puis produit les vues ci-dessous. Elle charge aussi les sprites existants de combat, marcheurs et véhicules de Nacre pour les scènes de contexte.

## Vues et portée exacte

Le reçu machine est `docs/validation/painted-nacre-sites-v0156/receipt.json`. Il donne les empreintes des sources et de chaque image, ainsi que `browserExecuted: false` et `humanPlaytestPerformed: false`.

| Vue | Ce qu’elle montre |
|---|---|
| `nacre-sites-state-grid.png` | Les trente cellules sur des fonds alternés, avec leurs noms ; banc de production |
| `dike-housing-water-diagnostic.png` | Deux maisons sous eau basse, niveau .8 et ruines ; seuil blanc .65 conservé |
| `nacre-controls-diagnostic.png` | Pompe et rotor, vanne et volant, panneau et verrou, treuil et tambour, dans des états imposés clairement nommés |
| `gate-motion-diagnostic.png` | Porte à 0 %, 50 %, 100 % et brèche ; rectangle cyan des bounds physiques |
| `ramp-preparation-diagnostic.png` | Rampes MI07/MI08 repliées, en préparation et préparées ; contours et pente calculés |
| `scene-mi05-sites-camera.png` | Treuil, câble et navires existants ; renderer normal et caméra ciblée |
| `scene-mi06-sites-camera.png` | Maisons, seuils, habitants, pompe, panneau et zone d’appui ; renderer normal |
| `scene-mi07-sites-camera.png` | Les deux accueils médicaux et leurs zones de transfert ; renderer normal |
| `scene-mi08-quay-camera.png` | Accueil, quais, bateaux, commande et porte ; renderer normal |
| `scene-mi08-refuge-camera.png` | Quais aval et entrée du refuge ; renderer normal |

Les cinq vues `scene-*` démarrent chacune une mission via `createGame`, exécutent 120 ticks avec `updateGame`, puis changent seulement le cadrage de caméra. Aucun personnage n’est téléporté pour les produire. Les cinq autres vues sont des diagnostics : leurs niveaux d’eau, dommages, ouvertures, verrous et états de préparation sont imposés à des copies. Elles n’attestent pas qu’un parcours de mission a accompli ces opérations.

L’inspection visuelle confirme les pieds des bâtiments au terrain, l’absence de personnes prépeintes, la superposition correcte du repère de crue et de l’eau, la séparation des pièces rotatives, les treuils reliés aux barges et les rails fixes pendant la levée du vantail. Les légendes de chantier et les plans des niveaux restent calculés. Le refuge réutilise un seul bâtiment à des tailles différentes ; ses trente cellules ne désignent pas trente sites uniques ni trente nouveaux événements.

## Ce que cette réception ne clôture pas

Ce document ne revendique pas de test navigateur, d’essai humain de lisibilité, de mission achevée, d’arrivée au refuge ou de validation narrative. AS47 reste sonore. AS44 ne reçoit que la matière peinte des tabliers ; les instruments de marée restent vectoriels précis. Les critères et statuts de Bible ainsi que les anciennes réceptions sont préservés.

Le rendu dispose toujours d’un repli vectoriel après échec de décodage. Les exports SVG historiques restent issus de leurs modules vectoriels. La livraison autonome et le ZIP sont reconstruits et reçus au niveau de la version complète, séparément de cette réception ciblée.
