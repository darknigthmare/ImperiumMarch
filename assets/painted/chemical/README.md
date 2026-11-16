# Appareils du champ chimique — 0.15.6

Ce lot fournit les six familles d’installations de MI10 : **cinq atlas PNG originaux, 24 cellules utilisées au rendu, aucune référence et trois cellules vides exclues du compte**. Les cinq PNG totalisent 7 841 342 octets.

| Atlas | Dimensions | Grille | Familles et états utilisés |
| --- | --- | --- | --- |
| `tanks.png` | 1536 × 1024 | 3 × 2 | `chemical-tank` : unknown, identified, leaking, sealed, destroyed |
| `instruments.png` | 1536 × 1024 | 4 × 2 | `sampling-rig` : idle, working, secured, lost ; `batch-ledger` : unread, copied, lost |
| `valves.png` | 1254 × 1254 | 2 × 2 | `field-valve` : normal, working, operated, destroyed |
| `canals.png` | 1254 × 1254 | 2 × 3 | `canal-junction` : open, covering, covered, contaminated, destroyed |
| `homes.png` | 2172 × 724 | 3 × 1 | `village-supply` : habitable, contaminated, destroyed |

## Origine et mesures

Les images sont les sorties RGBA originales sélectionnées d’Imagegen intégré. `prompts.json` conserve les demandes, les références et les sorties retenues, y compris la correction de transparence de la première proposition de cuves. Aucune image n’a été redimensionnée, recolorée, détourée par script ou recompressée après génération.

`anchors.json` décrit les pivots de présentation et les échelles mesurées par famille. L’origine au sol demeure `[0, 0]` dans les coordonnées nominales de `chemical-assets.mjs`. Ce pivot est une référence de plan de sol ; il ne demande pas que le pixel central du socle soit opaque. Les silhouettes détruites gardent la même échelle que les états intacts et restent donc plus basses.

`tools/index-painted-chemical.py` lit les pixels sans les modifier, mesure les rectangles occupés au seuil alpha 32, ajoute deux pixels de marge dans chaque cellule et produit le manifeste ainsi que `src/painted-chemical-layout.mjs`. Il contrôle les dimensions, le mode RGBA, les gouttières de six pixels et les cellules vides. Les gouttières et les cellules réservées ont un alpha maximal de 2 ; chaque atlas possède plus de 40 % de pixels exactement transparents. Les tailles et SHA-256 sont enregistrés dans `manifest.json`.

## Raccordement

`src/painted-chemical.mjs` charge les cinq atlas et expose un repli indépendant après défaut de décodage. `src/chemical-renderer.mjs` sélectionne les mêmes états chimiques qu’auparavant et conserve les exports vectoriels historiques. Les quatre herbes décoratives de MI10 utilisent aussi le lot Thyr peint déjà existant, sans ajouter de cellule à ce lot.

Les canaux sont dessinés par bandes étroites suivant `terrainAt`. Une petite région de la cellule `covered` fournit la plaque supérieure, y compris lorsque l’état principal est `contaminated`. Elle ne constitue pas une cellule supplémentaire. L’eau contaminée reste visible en dessous ; le tracé physique du pontage demeure exactement celui de `chemicalSurfaceAt`, avec sa hausse existante de 10 unités. Un canal détruit ne reçoit aucune plaque de couverture.

Les appareils ne créent ni population, ni masse liquide, ni preuve. Après collecte, le logement de fiole du préleveur est vide. Les copies acquises demeurent des faits de simulation, même si l’image de l’appareil ou du registre passe à son état détruit. Les barres de travail, points de vie, nappes, bassin et postes génériques restent les dessins procéduraux existants.

Réception et limites : `docs/QA_PAINTED_CHEMICAL.md`. Le lot concerne MI10, PL03, PT02, AS18 et SY99–SY103 ; sa présence ne clôture aucun critère humain de la Bible.
