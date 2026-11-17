# Sol, petits décors et viaduc de Vesper — 0.15.8

Ce lot ajoute **trois PNG originaux et 16 cellules de rendu**, sans cellule de référence. Les quatre matières de sol, les six petits décors et les six pièces de viaduc habillent des emplacements déjà présents sur Vesper. Aucun objet de simulation, obstacle, population, ressource ou interaction n'est ajouté.

| Atlas | Dimensions originales | Cellules utilisées | Contenu |
| --- | --- | ---: | --- |
| `terrain.png` | 1774 × 887 | 4 | Schiste, basalte, sédiments et scorie. |
| `props.png` | 1536 × 1024 | 6 | Trois rochers, lichen encroûtant, lichen en éventails et gravats d'ardoise. |
| `viaduct.png` | 1536 × 1024 | 6 | Pile, diagonale, poutre de tablier, potelet, traverse et tirant. |

Les demandes exactes et les sorties sélectionnées figurent dans [prompts.json](prompts.json). Les PNG proviennent de l'outil Imagegen intégré et sont conservés octet pour octet, sans retouche, redimensionnement du fichier ou recompression. [manifest.json](manifest.json) porte leurs dimensions, leurs empreintes et le décompte.

## Découpe mesurée

[tools/index-painted-vesper-scenery.py](../../../tools/index-painted-vesper-scenery.py) lit l'alpha des originaux et écrit seulement les métadonnées, le manifeste et les empreintes de provenance. Le rectangle source conserve deux pixels autour de la silhouette au seuil alpha 32 ; la gouttière de deux pixels reste à un alpha maximal de 1 dans les trois atlas. Les pixels entièrement transparents représentent environ 33,77 % de l'atlas de matières, 81,69 % des petits décors et 76,34 % des pièces de viaduc.

Les frontières de `viaduct.png` sont volontairement irrégulières : colonnes `0, 365, 930, 1536`, rangées `0, 596, 1024`. Une grille régulière découperait mal la pile et les poutres. Le fichier [src/painted-vesper-scenery-layout.mjs](../../../src/painted-vesper-scenery-layout.mjs) conserve cellule, silhouette, rectangle source, taille nominale et ancrage de chaque pièce. Les sprites à leur taille nominale gardent une échelle uniforme.

## Emploi dans le moteur

Le module [src/painted-vesper-scenery.mjs](../../../src/painted-vesper-scenery.mjs) expose `loadPaintedVesperScenery`, `paintedVesperSceneryStatus`, `clearPaintedVesperScenery` et les fonctions de présentation. Un atlas manquant, indécodable ou d'une taille incorrecte conserve le rendu vectoriel. Une erreur de dessin invalide seulement l'atlas concerné. Un chargement annulé ne peut réinstaller une image devenue obsolète.

`Renderer.drawTerrain` utilise les quatre matières sur PL01. Les panneaux de matière restent ancrés aux coordonnées du monde ; leurs colonnes de huit unités suivent `terrainAt`, avec un masque supérieur calculé toutes les quatre unités. Le fondu inférieur rejoint la couleur profonde du sol existant. Des raccords entre les quatre matières peuvent rester visibles ; ils ne créent ni marche ni discontinuité physique. Les six petits décors occupent uniquement les anciens emplacements décoratifs, avec une origine au sol et une largeur nominale de 32 unités. Ils restent volontairement petits à l'échelle du marcheur.

`Renderer.drawRailViaduct` emploie les six pièces sur MI02. La pile prend la hauteur du support existant. Le tablier est posé par colonnes de quatre unités sur la même surface ; les deux extrémités boulonnées des diagonales, tirants et traverses sont préservées par une découpe en trois segments, dont seul le fût s'allonge. Les potelets gardent leur hauteur de 39 unités. La ligne de contact, les rails, la rupture de voie et la passerelle praticable conservent les coordonnées et conditions d'origine. Les avertissements de rupture restent séparés des images.

La présence d'un lichen peint ne constitue pas un système d'écologie. Ce lot n'ajoute ni vent, ni déplacement, ni lumière active, ni réaction au combat. Les sauvegardes, les collisions et les faits de mission ne dépendent d'aucune image.

## Réception et limites

Les sept tests de [tests/painted-vesper-scenery.test.mjs](../../../tests/painted-vesper-scenery.test.mjs) contrôlent les découpes, les ancrages, la stabilité au déplacement de caméra, les emplacements existants, les raccords au sol, les extrémités de poutres, la rupture de rail, le repli vectoriel et l'annulation de chargement. Ils vérifient aussi l'absence d'écriture dans les états de mission.

[tools/test-painted-vesper-scenery.mjs](../../../tools/test-painted-vesper-scenery.mjs) décode réellement les PNG avec `@napi-rs/canvas`, vérifie alpha et empreintes, puis reçoit sept vues : une planche des 16 cellules, trois caméras de terrain, une caméra de diagnostic sur la rupture et deux scènes obtenues par entrées publiques. Les deux scènes publiques montrent une marche MI01 après 180 pas de simulation et l'arrêt effectif du train MI02 ; leurs checkpoints sont enregistrés. Les caméras de diagnostic ne prétendent pas que le joueur a atteint ces positions. Le [reçu Canvas](../../../docs/validation/painted-vesper-scenery-v0158/receipt.json) et le [compte rendu visuel](../../../docs/validation/painted-vesper-scenery-v0158/visual-review.json) séparent ces preuves.

Une mesure locale bornée de `drawTerrain`, sur Canvas CPU à 1600 × 900, après cinq appels de chauffe puis 60 appels mesurés, a donné environ 2,35 ms pour MI01 et 2,44 ms pour MI02. Cette mesure de la seule passe de terrain n'est ni une mesure de la frame complète ni une promesse de performance navigateur ou GPU. Les vues Canvas ne constituent pas un essai navigateur, matériel, audio ou humain, et ne valident pas une campagne complète.
