# Thyr — kit de la route des vivants

Ce lot original de la version 0.10 fournit **11 composants, 35 SVG et 2 planches PNG**. Le jeu dessine les mêmes formes par `src/thyr-assets.mjs`, puis les place depuis les objets de `livingRoute` dans `src/thyr-renderer.mjs`. Les exports ne sont pas chargés comme images pendant la partie.

## Pièces

| Pièce | États exportés | Portée actuelle |
| --- | --- | --- |
| Colonne FL07 | Saine, endommagée, détruite | Support destructible et habitat lié. |
| Racine FL07 | Saine, endommagée, détruite | Surface réelle employée par les pieds ; contour échantillonné depuis la simulation. |
| Habitat suspendu | Debout, endommagé, détruit | Dépend de sa colonne et de sa racine ; débris dessinés au sol après effondrement. |
| Longue-dorse adulte FU07 | Attente, marche, arrivée, déviation, perte | Deux individus adultes, destinations et dégâts séparés. |
| Longue-dorse jeune FU07 | Attente, marche, arrivée, déviation, perte | Deux individus jeunes, protection et trajet séparés. |
| Colonie d’éventails FU08 | Posée, dispersée, perdue | Projecteurs, perturbation locale et retour au calme ; deux colonies. |
| Vigne respirante FL08 | Normale, flétrie, brûlée | Le runtime emploie le décor normal ; filtration et toxicité restent conçues. |
| Herbe d’écho FL09 | Calme, mouvement | Réaction visuelle à des migrateurs proches ; pas de nouveau système de détection. |
| Barrière | Fermée, manœuvre, ouverte, brisée | Dessin dimensionné par l’objet physique, commande séparée à sa vraie position. |
| Carte | Militaire, relevée | Confrontation réellement effectuée avant décision. |
| Balisage | Impérial, local | Indique le type d’approche effectivement préparée. |

Les images d’animaux et de maisons ne contiennent aucun humain prépeint. Le poste local est une liaison radio ; aucun nombre d’habitants n’est inventé par le décor. Les vergers et la zone d’exclusion sont signalés aux coordonnées des destinations, sans ajout de production agricole chiffrée.

## Géométrie et provenance

Les coordonnées sont des unités locales de dessin, avec pivot nommé et bornes d’encre déclarés dans `manifest.json`. Les dimensions nominales servent au placement ; les colliders, la hauteur de contact et les conséquences restent dans la simulation. Les SVG et Canvas partagent les polygones, courbes, lignes et cercles. La palette est celle de la canopée de Thyr, sans reprise d’un asset tiers.

Les deux planches sont des **bancs graphiques**. Les vues de mission de `docs/previews/mi09-*.png` sont des **rendus Canvas** d’états atteints par commandes publiques. Une capture Chrome possède une provenance séparée. Aucun de ces documents ne représente une validation humaine de l’art, de l’animation, du son ou de la performance.

## Reconstruction

```sh
node tools/build-thyr-assets.mjs
npm run build
npm run build:web
npm run check:assets-render
node tools/audit-media-provenance.mjs --strict
```

L’outil d’export emploie la bibliothèque de développement `@napi-rs/canvas` installée dans l’environnement de production des fichiers. Le jeu livré conserve son absence de dépendance réseau et de bibliothèque à installer.
