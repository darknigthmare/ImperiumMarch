# Acteurs et véhicules peints — 0.15.2

Neuf atlas PNG RGBA originaux, générés pour **Ordre de Cendre**, sont intégrés au renderer du prototype. Les originaux sélectionnés sont conservés sans rééchantillonnage ni modification des pixels après génération. Chaque planche mesure **1536 × 1024 pixels**. Les [prompts complets](prompts.json) et le [manifeste mesuré](manifest.json) documentent leur provenance et leurs empreintes.

## Contenu et usage réel

| Planche | Grille | Cellules | Utilisées | Références | Contenu principal |
| --- | --- | ---: | ---: | ---: | --- |
| [rifle.png](rifle.png) | 4 × 3 | 12 | 11 | 1 | Fusilier, repos, huit pas, tir, perte, fusil séparé |
| [sniper.png](sniper.png) | 4 × 3 | 12 | 11 | 1 | Tireur de précision, huit pas et arme séparée |
| [rocket.png](rocket.png) | 4 × 3 | 12 | 11 | 1 | Lance-roquettes, huit pas et arme séparée |
| [civilian.png](civilian.png) | 4 × 3 | 12 | 10 | 2 | Une silhouette civile, huit pas, arrivée, accroupissement et perte |
| [buggy.png](buggy.png) | 3 × 2 | 6 | 3 | 3 | Corps normal, endommagé, épave, arme, roue et détail |
| [skimmer.png](skimmer.png) | 3 × 2 | 6 | 3 | 3 | Patin, états, arme, turbine et détail |
| [drone.png](drone.png) | 3 × 2 | 6 | 3 | 3 | Drone, états, arme ventrale, rotor et détail |
| [turret.png](turret.png) | 3 × 2 | 6 | 3 | 3 | Tourelle, états, canon séparé et pièces |
| [convoy.png](convoy.png) | 3 × 2 | 6 | 5 | 1 | Porteur, états, roue, panneau cargo et panneau médical |
| **Total** | | **78** | **60** | **18** | **32 poses de marche, sept armes séparées** |

Les cellules se lisent de gauche à droite, puis de haut en bas. Le manifeste contient les listes exactes `runtimeFrames` et `referenceFrames` par fichier. Les trois lignes humaines sont mesurées sur la hauteur réelle de 1024 pixels ; le moteur utilise les rectangles calculés, sans supposer des cellules de hauteur fractionnaire.

La silhouette civile habille le rôle générique déjà présent ; elle ne représente pas toute la diversité de population. Les trois combattants sont des rôles tactiques et n’ajoutent aucune faction au modèle. Les armes de perte, positions de mort et pièces de référence ne créent aucun nouveau comportement. Les roues et turbines déjà incluses dans les corps ne sont pas dessinées une deuxième fois.

Le convoi réutilise les états et le champ cargo existants. Ses panneaux visuels ne constituent pas un décompte des passagers ou des caisses. L’ambulance spécifique de MI07, le porteur de fonderie de MI13 et les personnes propres à MI14 conservent leurs domaines et leur rendu distincts.

## Intégration

`src/painted-combat.mjs` charge les neuf images et sélectionne les cellules. La marche dépend du déplacement ; un personnage immobile ne parcourt pas son cycle. Les images sont réfléchies pour l’orientation gauche, avec correction de l’arme afin qu’elle reste à l’endroit. La réduction des mouvements et le repli vectoriel restent disponibles.

`src/enemy-weapon-pose.mjs` est le contrat partagé des sept armes génériques. Les pivots, angles et bouches utilisés pour le tir sont aussi utilisés pour le dessin et les annonces. `src/painted-combat-layout.mjs` conserve l’ancrage optique de chaque PNG et la petite correction angulaire nécessaire à son alignement. Les tailles de collision restent inchangées.

`tools/index-painted-combat.py` vérifie l’alpha, les marges et les dimensions, puis écrit le manifeste et le layout. Il ne découpe ni ne retouche les fichiers PNG. Pour reproduire l’index et la réception, depuis la racine :

```sh
python tools/index-painted-combat.py
npm test
npm run build
node tools/test-painted-combat.mjs ../outputs/painted-combat-qa
```

Le dernier contrôle nécessite la dépendance de développement `@napi-rs/canvas@0.1.100`. Le jeu livré et son HTML autonome n’en dépendent pas. Les nouvelles réceptions doivent utiliser un nouveau dossier afin de conserver les preuves antérieures.

## Réception et limites

Le [banc de lecture et cinq scènes Canvas](../../../docs/validation/painted-combat-v0152/receipt.json) reçoivent les PNG réellement décodés. Le [rapport QA](../../../docs/QA_PAINTED_COMBAT.md) sépare les contrôles géométriques, les tests de simulation, le DOM modélisé et le navigateur.

Ce lot est un **prototype intégré**. Les variantes de faction, les autres silhouettes civiles, les rechargements et redditions, les cycles d’animation finaux, les marcheurs peints articulés et les autres biomes restent à produire. Les huit planches MI14 sont conservées séparément ; le projet totalise ainsi **17 atlas peints et 132 cellules**.
