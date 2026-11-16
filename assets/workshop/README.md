# Kharon — Les mains noires

Kit graphique original de **MI14**, version **0.15.0**, au stade prototype.

Les **7 composants** partagent leurs formes entre les exports SVG, les PNG transparents individuels et le rendu Canvas du jeu : ouvrier, refroidisseur, vanne, lot contesté, commande d’atelier, automate de sécurité et poste du piquet. Les quatre états d’ouvrier existent aussi en tenue de mécanicien. Le kit comporte **33 SVG**, **33 PNG transparents** et **2 planches de fabrication**.

Les fichiers individuels sont dans `svg/` et `png/`. Les PNG sont rendus à trois fois les dimensions du cadre graphique ; `manifest.json` indique pour chaque fichier ses dimensions nominales, ses limites, son pivot au sol, ses ancres et son SHA-256.

La marche et les ventilateurs sont animés par paramètres dans le jeu. Ces poses exportées ne constituent pas une animation finale complète. La tenue du mécanicien distingue les deux ouvriers spécialisés sans attribuer de coopération : l’accord et leur disponibilité viennent exclusivement de la simulation.

## Géométrie et états

- `src/workshop-assets.mjs` porte les formes SVG/Canvas communes.
- `src/workshop-renderer.mjs` lit les positions, travaux, pertes, température et progression depuis la simulation.
- La galerie suit la rampe commune des ouvriers ; elle ne crée aucun chemin surélevé pour le marcheur.
- L’automate n’est dessiné qu’après son activation. Son canon pivote autour du centre physique et son extrémité correspond au point de départ des projectiles.
- Copie conservée et original détruit restent visibles séparément. Une reprise ordonnée ne fait pas apparaître une réparation ou une commande accomplie.

## Régénération

```sh
node tools/build-workshop-assets.mjs
node --test tests/mi14-assets.test.mjs
node tools/test-workshop-render.mjs
```

La construction et la vérification raster utilisent `@napi-rs/canvas`, dépendance de développement séparée du jeu. Les tests de provenance et de géométrie ne nécessitent pas cette dépendance.

Les planches `previews/workshop-kit.png` et `previews/workshop-states.png` sont des **planches de fabrication à échelles variées**, pas des captures du navigateur ou une réception artistique humaine. Les scènes obtenues par commandes publiques sont générées séparément avec `tools/render-mi14-previews.mjs` et identifiées comme **rendus Canvas**.
