# Kharon — sprites peints de MI14

Lot **0.15.1** d’ORDRE DE CENDRE, créé le **16 novembre 2026**. Les huit PNG sont des images originales générées avec l’outil intégré `image_gen.imagegen`, sur fond transparent. Les octets d’origine sont conservés. Les [prompts exacts](prompts.json), les dimensions, empreintes et rectangles de chaque cellule figurent dans le [manifeste](manifest.json).

| Atlas | Cellules | Contenu |
| --- | ---: | --- |
| `worker.png` | 12 | Attente, marche en huit poses, repos en galerie, pose agenouillée de référence, perte non graphique |
| `worker-mechanic.png` | 12 | Même structure, tenue de mécanicien distincte |
| `cooler.png` | 6 | Panne, isolation, réparation, fonctionnement, destruction, référence neutre |
| `valve.png` | 3 | Circuit ouvert, isolé, vanne détruite |
| `disputed-lot.png` | 6 | Scellé, inspecté, libéré, retenu, détruit, référence neutre |
| `workshop-control.png` | 6 | Attente, manœuvre, production, arrêt, destruction, référence neutre |
| `security-automaton.png` | 6 | Corps en veille, avertissement, actif, détruit ; canon normal et détruit séparés |
| `picket-post.png` | 3 | Fermeture, ouverture en cours, passage ouvert |
| **Total** | **54** | **Deux tenues humaines et six familles de machines/objets** |

Ce sont 54 poses et états graphiques, pas 54 personnages. L’atelier conserve huit ouvriers individualisés dans la simulation. La pose agenouillée, les états neutres et les corps en veille/avertissement sont des références de fabrication ; ils n’ajoutent aucune action ou apparition au jeu. L’automate n’est dessiné qu’après son activation réelle.

## Intégration

`src/painted-sprite-layout.mjs` fournit les rectangles de lecture et de destination. `src/painted-sprites.mjs` charge les images, sélectionne le cycle de marche et dessine le canon autour du pivot physique. Le canon pointe vers la même bouche que les projectiles. Les pieds restent sur le sol de la simulation, y compris sur la galerie.

Les deux copies du canon conservent leur tourillon dans l’image, avec un rectangle de destination décalé. Le pivot est `[0,-55]` dans le repère de l’automate ; la bouche est à 56 unités dans la direction de visée. Les grilles du refroidisseur restent fixes : leurs différents états montrent les opérations et avaries, sans faire tourner la grille de protection.

Le kit vectoriel précédent reste disponible dans `assets/workshop/` et assure le rendu de secours si une image ne peut pas se charger. Le HTML autonome intègre directement les huit PNG ; le jeu ne dépend d’aucun serveur d’images.

## Réception

`npm run check:painted` décode les PNG et contrôle les 54 cadres, l’absence de découpe des silhouettes, les huit poses de chaque marche, les pieds et le canon. Il rend également 33 états de composants et 14 scènes MI14 à partir des états historiques conservés. Voir [le rapport de réception](../../../docs/QA_PAINTED_MI14.md).

Les sprites sont intégrés au **prototype**. La diversité complète des personnes, les transitions finales d’animation, la réception humaine et l’habillage des autres missions restent au registre de production. Les images de validation Canvas ne sont pas présentées comme des captures navigateur.
