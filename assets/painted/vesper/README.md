# Sites et machines peints de Vesper — 0.15.7

Ce lot comprend **six PNG originaux et 38 cellules utilisées au rendu**, sans cellule de référence comptée. Il habille des objets déjà présents dans MI01–MI04 : les conduites et leur protection, le dépôt, les harpons ferroviaires, les trois stations du réseau et les équipements de l'usine.

Les images ont été générées avec l'outil Imagegen intégré à partir du code public 0.15.6. Les octets d'un précédent travail non publié en 0.15.7 n'ont pas pu être retrouvés ; ce lot est une nouvelle production, avec sa propre provenance. Les demandes initiales, les corrections sélectionnées et les empreintes de sortie figurent dans [prompts.json](prompts.json). Les PNG sélectionnés sont conservés sans retouche de pixels, redimensionnement du fichier ni recompression.

| Atlas | Dimensions originales | Cellules de rendu | Contenu |
| --- | --- | ---: | --- |
| `military.png` | 1536 × 1024 | 5 | Relais militaire actif, coupé, endommagé, coupé et endommagé, détruit. |
| `dispensary.png` | 1536 × 1024 | 5 | Dispensaire dans les mêmes cinq états indépendants de courant et de dégâts. |
| `housing.png` | 1783 × 882 | 5 | Maisons civiles dans ces cinq états. |
| `outposts.png` | 1536 × 1024 | 6 | Dépôt du Poste 42, caisse de filtres, poste de maintenance intact/endommagé/détruit et terminal de journal séparé. |
| `machinery.png` | 1536 × 1024 | 8 | Pompe déconnectée/raccordée, carcasse de turbine chaude/refroidie, rotor séparé et radio indisponible/disponible/contact établi. |
| `civilworks.png` | 1536 × 1024 | 9 | Treuil de dalles, volant séparé, harpon retenu/libéré, bobine séparée, terminal exposé/protégé, conduite et dalle. |

La sixième case de chaque atlas réseau et la neuvième de `machinery.png` restent vides. Elles ne sont ni adressées par le moteur ni comptées parmi les 38 cellules.

## Découpes et ancrages

L'indexeur [tools/index-painted-vesper.py](../../../tools/index-painted-vesper.py) mesure l'alpha et écrit uniquement [manifest.json](manifest.json) et [src/painted-vesper-layout.mjs](../../../src/painted-vesper-layout.mjs). Chaque frame conserve sa cellule, son rectangle source, sa silhouette alpha et ses points d'origine ou de pivot. La marge de découpe est de deux pixels autour de la silhouette mesurée au seuil alpha 32, dans les limites de sa cellule. Les gouttières de trois pixels gardent un alpha maximal de 2.

Il ne faut pas déduire les cellules d'une grille régulière supposée :

- `housing.png` mesure réellement 1783 × 882 ; les frontières de colonnes sont arrondies séparément.
- Dans `outposts.png`, la première rangée a pour frontières horizontales `0, 710, 1090, 1536`, la seconde `0, 512, 1080, 1536`. Le dépôt, la caisse et les postes ont donc des cellules de largeurs différentes.
- Les frontières des rangées de `civilworks.png` sont `0, 370, 730, 1024`.

Les ruines réutilisent l'échelle de la famille intacte : elles restent courtes au sol. Leurs débris peuvent être plus larges que la façade intacte sans déplacer la géométrie physique. Les antennes, le sommet des toits et les détails optiques ne redéfinissent pas les colliders. Les roues, bobines et rotors sont absents des carcasses sélectionnées ; le moteur les dessine une seule fois, autour de leurs pivots mesurés.

## Règles conservées

Le module [src/painted-vesper.mjs](../../../src/painted-vesper.mjs) ne modifie aucune donnée de simulation ou de sauvegarde. `loadPaintedVesper` charge les six images, `paintedVesperStatus` expose leur réception et `clearPaintedVesper` invalide également les chargements encore en attente. Un atlas absent, mal dimensionné ou indécodable conserve le repli vectoriel. Un échec de dessin retire l'atlas de présentation concerné.

Les états de réseau restent déterminés par la santé, la coupure et la destruction réelles. Protéger le terminal au sol ne répare pas le bâtiment et ne le protège pas des projectiles. Pompe, turbine, radio et harpon ne reçoivent aucune nouvelle santé locale. L'appel radio, l'identification et la copie du journal demeurent des actions distinctes.

Le rotor des turbines garde le centre historique à `turbine.y - 8`, soit 71 unités au-dessus de leur sol. Son diamètre nominal de dessin est de 38 unités : le rayon balayé mesuré est de 19,17, pour un rayon libre d'au moins 19,9 dans les deux carters, ce qui conserve leur couronne visible. Les volants de dalle et bobines de harpon gardent leurs axes respectifs à 31 et 27 unités au-dessus de leur base. La réduction des mouvements arrête leur rotation sans changer les faits de mission. Les câbles rejoignent toujours les extrémités existantes.

La conduite et les dalles suivent le terrain employé par les pieds, par petits segments de dessin. La rupture demeure visible et la progression des dalles vient de la simulation ; aucun nouveau support n'est créé. Les 24 caisses ne sont dessinées au dépôt qu'après `filtersDelivered`. Un bâtiment peint ne prouve ni livraison, ni population, ni acquisition de PT01.

## Réception

Le [rapport QA](../../../docs/QA_PAINTED_VESPER.md) précise les tests et les vues contrôlées. Le [reçu Canvas](../../../docs/validation/painted-vesper-v0157/receipt.json) contient les empreintes des PNG, les rectangles reçus, les sources de code, les checkpoints et les fichiers d'état associés. Cette réception conserve une portée séparée du navigateur, du matériel et d'un essai humain.
