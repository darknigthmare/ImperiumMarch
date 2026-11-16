# Régression des lots peints antérieurs — 0.15.6

Les huit contrôles peints et le contrôle SVG/Canvas ont terminé avec un code de sortie 0. Les PNG de réception ont été écrits uniquement dans des répertoires temporaires explicites ; aucune ancienne preuve n’a été écrasée.

| Lot | Atlas | Cellules | Rendu | Références | Images reçues | Exit |
|---|---:|---:|---:|---:|---:|---:|
| mi14 | 8 | 54 | 54 | 0 | 47 | 0 |
| combat | 9 | 78 | 60 | 18 | 6 | 0 |
| walkers | 6 | 96 | 96 | 0 | 19 | 0 |
| thyr | 8 | 62 | 58 | 4 | 7 | 0 |
| cerbere | 1 | 16 | 11 | 5 | 2 | 0 |
| transport | 4 | 20 | 20 | 0 | 5 | 0 |
| relay | 3 | 30 | 28 | 2 | 9 | 0 |
| nacre | 6 | 30 | 29 | 1 | 5 | 0 |
| **Total** | **45** | **386** | **356** | **30** | **100** | **0** |

La répartition rendu/références est reprise explicitement des huit manifestes, jamais déduite de l’absence d’un champ dans les reçus. Combat contient 60 cellules de rendu et 18 références. MI14 possède 54 correspondances `runtimeFrame` explicites ; le transport indique zéro référence dans chacun de ses quatre fichiers.

MI14 produit 33 vues de composants et 14 scènes ; Cerbère produit deux fichiers contenant ses poses et sa scène diagnostique, plus deux orientations de tir vérifiées. Les marcheurs reçoivent 54 poses, six scènes de mission et six vues de hangar dans leurs 19 fichiers. Le reçu relais conserve son parcours par commandes publiques MI12 (`defy`, état `won`, environ 205,07 s), distinct des bancs diagnostiques.

Le contrôle `tools/test-assets-render.mjs` reçoit **174/174 cas** avec `@napi-rs/canvas 0.1.100` ; couverture partagée minimale SVG/Canvas : **99.46 %**.

Répartition des 174 cas SVG/Canvas : atelier 33, relais 22, fonderie 29, marcheurs de production 3, composants Nacre 2, Thyr 35, chimique 24 et voix 26.

Les empreintes des 100 fichiers de sortie ont été comparées à leurs reçus. Les empreintes de sources enregistrées dans les huit reçus correspondent aux fichiers courants. Les **1 142 fichiers historiques suivis par Git** sous `docs/validation/` ont été comparés avant et après : aucun changement.

Chaque outil peint a reçu son répertoire par `argv[2]`, sous `/workspace/scratch/fef4abaa57e0/outputs/v0156-regression/<lot>`. Les journaux bruts sont les neuf fichiers `.log` voisins. `summary.json` contient commandes, codes de sortie, comptes, empreintes des reçus, empreintes vérifiées et limites de portée. Les images et les états diagnostiques restent dans les répertoires temporaires.

Cette régression n’exécute aucun navigateur et ne constitue aucun essai humain. Elle ne réécrit pas les réceptions historiques et ne remplace pas la réception propre des nouveaux lots 0.15.6. Aucun `npm test`, build ou contrôle UI global n’a été exécuté dans cette tâche.
