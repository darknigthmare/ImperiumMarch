# Thyr — cuves, canaux et prélèvement

Lot original du prototype **0.11**, destiné à MI10, « Le champ que personne n’a semé ». Les six composants possèdent **24 variantes SVG** et deux planches PNG. Leurs coordonnées, pivots, dimensions, états et empreintes figurent dans [manifest.json](manifest.json).

| Composant | Variantes exportées | Rôle visuel |
|---|---|---|
| Cuve chimique | inconnue, identifiée, en fuite, isolée, détruite | Identifier le support matériel, les dommages et le confinement. |
| Jonction de canal | ouverte, en pontage, couverte, contaminée, détruite | Distinguer le pontage des appuis et la pollution déjà acquise. |
| Préleveur | inactif, au travail, sécurisé, perdu | Montrer le cycle réel du prélèvement et la fiole. |
| Registre de lots | non lu, copié, perdu | Distinguer le support original de sa copie conservée. |
| Vanne de terrain | normale, en manœuvre, manœuvrée, détruite | Rendre lisibles les travaux au collecteur, au confinement et à l’eau. |
| Habitat alimenté | habitable, contaminé, détruit | Montrer l’état d’un habitat sans inventer ses occupants. |

## Sources et fabrication

`src/chemical-assets.mjs` produit la géométrie commune. `src/chemical-renderer.mjs` la place à partir de l’état de la simulation. `tools/build-chemical-assets.mjs` exporte exactement les mêmes formes. Le jeu ne télécharge aucun SVG pendant une partie : le Canvas dessine cette géométrie directement, et le constructeur autonome embarque les modules.

La palette prolonge celle de Thyr : cuves industrielles vert froid, ferrures en laiton pâle, eau turquoise, rejets ocre. Les couleurs accompagnent des noms et des états textuels ; elles ne constituent pas l’unique indication de danger.

Ce lot est écrit et dessiné en code pour le projet. Il n’emploie ni capture de référence, ni image tracée, ni asset extrait d’un autre jeu.

## Portée des preuves

Les planches [chemical-kit.png](previews/chemical-kit.png) et [chemical-states.png](previews/chemical-states.png) sont des bancs graphiques à échelles variables. Elles ne sont pas des captures du jeu dans un navigateur. Les scènes de jeu rendues séparément précisent leur propre état et leur provenance.

La simulation décide des dommages, des écoulements et des opérations. Le rendu n’accorde pas PT02 parce qu’une fiole est visible, ne copie pas le registre et ne rétablit pas la potabilité. Les conditions de preuve appartiennent au dossier de campagne.

Le test raster compare l’occupation des formes SVG et Canvas à la même résolution. Il vérifie une cohérence de géométrie, sans certifier la lisibilité humaine, le style final ou les performances sur un appareil réel. Le lot complet de faune et de flore de Thyr reste à produire.

## Régénération

```sh
node tools/build-chemical-assets.mjs
node --test tests/chemical-assets.test.mjs
npm run check:assets-render
```

Les fichiers sont accompagnés de leur empreinte SHA-256. Une modification de la géométrie exige de reconstruire le lot, puis les éditions autonome et web du jeu.
