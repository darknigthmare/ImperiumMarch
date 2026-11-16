# Réception Canvas des installations MI10 — 0.15.6

Le lot chimique ajoute **5 atlas / 24 cellules utilisées au rendu**, réparties entre six familles. Il conserve trois cellules vides, sans cellule de référence. Le manifeste et les prompts se trouvent dans `assets/painted/chemical/`. La simulation, ses surfaces, les états chimiques et le pilote de commandes publiques n’ont pas été modifiés par ce lot.

## Vérifications exécutées

```sh
python tools/index-painted-chemical.py
node --test tests/painted-chemical.test.mjs
node tools/test-painted-chemical.mjs docs/validation/painted-chemical-v0156
```

Les **8 tests ciblés passent**. Ils vérifient la correspondance complète des états, les limites des rectangles, l’isolation d’un défaut de décodage, les chargements abandonnés, l’origine et les dimensions de présentation, le rétablissement du contexte Canvas après erreur, le suivi du terrain et le cas couvert/contaminé. Le test d’intégration conserve l’état complet de la mission avant/après rendu et vérifie la hausse réelle de 10 unités ainsi que le tracé de la surface de pontage.

Le contrôle Canvas décode indépendamment les cinq PNG avec Skia, vérifie leurs SHA-256, leurs pixels transparents, les gouttières et les cellules vides. Il produit **11 vues : 2 diagnostics et 9 scènes obtenues par les commandes publiques**. Les états capturés sont copiés profondément, sérialisés et hachés. Les octets des PNG sources restent inchangés.

## Parcours de mission

Le pilote existant `tests/helpers/mi10-driver.mjs` utilise `commandGame` et `updateGame`, avec MI10, WK09 et la graine 156. Le parcours `defy` atteint `won` à **198,917 secondes simulées** : prélèvement recueilli, PT02 acquis, deux canaux couverts et deux habitats préservés. Huit vues jalonnent ce parcours ; la dernière représente le rétablissement de l’eau, avant la fin de mission. Le reçu conserve séparément le résultat terminal du pilote.

Une seconde observation publique provoque la perte des originaux après acquisition. À **85,733 secondes simulées**, le préleveur, le registre original et la cuve source sont détruits, tandis que PT02 reste acquis. Cette observation s’arrête avec le statut `playing` : elle ne revendique pas une seconde mission achevée.

## Inspection visuelle

Les onze PNG suivants ont été ouverts et inspectés par l’assistant après le dernier rendu. Cette inspection complète les assertions ; elle ne constitue ni un essai humain ni une session navigateur.

| Vue | Observation |
| --- | --- |
| `chemical-state-board.png` | Les 24 états sont distincts, détachés du fond et posés sur leur ligne de référence. Les variantes détruites restent plus basses ; le logement de fiole est vide après collecte. |
| `chemical-canal-combinations.png` | Diagnostic explicite : couvert propre, couvert contaminé, ouvert contaminé et détruit. Plaque et contamination restent simultanément visibles ; la destruction supprime le support. |
| `mi10-arrival.png` | Cuves non relevées et vanne amont présentes ; aucune force privée dessinée avant son arrivée. |
| `mi10-collector-closed.png` | Commande du collecteur opérée ; les cuves gardent leurs états non inspectés. |
| `mi10-tank-marks.png` | Fuite visible, marquages copiés, préleveur et registre encore distincts. Les nappes restent les objets procéduraux de la simulation. |
| `mi10-sampler-working.png` | Prélèvement à 35 %, fiole et témoin de travail actifs, zone de protection et forces privées arrivées. |
| `mi10-sample-conserved.png` | Copie du registre indiquée et scène de combat après collecte ; le préleveur se trouve alors hors champ. Le fait de collecte est attesté par l’état capturé. |
| `mi10-canal-covering.png` | Plaque partiellement posée et travail à 45 % ; aucune surface de pontage achevée n’est inventée. |
| `mi10-canal-real-contacts.png` | Le canal peint suit la pente et la plaque rejoint le tracé des vrais appuis, sans flottement du tablier. |
| `mi10-water-restored.png` | Canal couvert, vanne opérée et deux habitats préservés visibles après rétablissement de la circulation. |
| `mi10-originals-lost-copy-conserved.png` | Cuve et registre détruits visibles, avec conservation explicite de la copie ; l’état capturé conserve aussi PT02. |

## Limites et éléments conservés

La planche des états et les quatre combinaisons de canaux sont des diagnostics construits pour la réception ; les neuf scènes MI10 proviennent du pilote public inchangé. Les sorties sont des rendus Canvas/Skia, sans navigateur exécuté ni essai humain revendiqué. Les fichiers, dimensions, SHA-256 et limites sont enregistrés dans `docs/validation/painted-chemical-v0156/receipt.json`.

Les dessins procéduraux du bassin, des nappes, des textes et barres de travail, ainsi que les postes génériques d’ordre et de rapport, restent présents. Le nouveau graphisme ne modifie aucune quantité, collision, population, arrivée, acquisition de preuve ou entrée de sauvegarde. Les quatre touffes décoratives utilisent désormais les herbes peintes Thyr déjà disponibles ; aucun nouvel effet de gameplay n’en découle.
