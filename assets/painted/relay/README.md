# MI12 — Prétoire, relais et terminaux peints

Ce lot ajoute **trois atlas PNG originaux, trente cellules, vingt-huit cellules utilisées au rendu et deux références** pour la version 0.15.5 d’**ORDRE DE CENDRE**. Il habille les objets et composants déjà présents dans la mission MI12.

| Atlas | Dimensions | Cellules | Rendu | Références |
|---|---|---:|---:|---:|
| `praetor.png` | 1254 × 1254 | 16 | 15 | 1 |
| `relay-mast.png` | 1536 × 1024 | 6 | 6 | 0 |
| `consoles.png` | 1536 × 1024 | 8 | 7 | 1 |

Les fichiers ont été générés avec **Imagegen intégré**, sur fond réellement transparent. Leurs pixels sont conservés sans retouche, détourage, redimensionnement ou recomposition. Les prompts exacts, les références de style et les noms des sorties d’origine sont dans [prompts.json](prompts.json). Le [manifeste](manifest.json) conserve les dimensions, empreintes SHA-256 et nombres de pixels transparents. Les sources de 0.15.1 et 0.15.4 ont seulement servi de références de matière et de style.

## Pièces et raccordements

Le **Prétoire de sécurité VE12** emploie quatre coques, une cuisse, un mollet, un pied, une hanche, un genou, un canon, trois états de capteur et deux états de verrou hydraulique. L’image de canon endommagé reste une référence : le prototype ne possède pas de santé séparée pour ce canon.

Les quatre contacts de pieds proviennent toujours de `s.relay.praetor.feet`. Les segments peints relient les mêmes hanches, genoux et contacts. La cheville mesurée se situe au-dessus de la semelle, sans déplacer le point de contact. Aucun cycle autonome ne fait piétiner le Prétoire à l’arrêt. Le petit support sous le capteur et la bielle du verrou raccordent les pièces à leurs positions existantes.

Le canon utilise la bouche historique **`[p.x + facing × 115, p.y − 10]`**. Sa cellule possède un pivot et une bouche mesurés, corrigés par une rotation optique de moins d’un degré. Le tir reste calculé par la simulation. Les deux orientations sont testées contre des projectiles réellement émis. Le capteur de visée, sa destruction, le verrou et sa rupture restent des composants distincts. Le rendu de l’unité reste entièrement absent avant `relay.alert.ready`.

Les **six relais** représentent les états actif, relevé, en purge, isolé, effacé et détruit. Le terminal de copie possède quatre états et le poste de commande trois. Les barres de progression réelles restent dessinées à partir du travail de simulation ; les données décoratives des petits écrans n’attribuent aucune copie ou transmission. La cassette isolée est la seconde référence, sans objet supplémentaire ajouté au monde.

Le module [painted-relay.mjs](../../../src/painted-relay.mjs) charge les images et garde le repli vectoriel en cas d’absence ou d’échec. [relay-renderer.mjs](../../../src/relay-renderer.mjs) choisit le rendu peint pour les objets du jeu. Les exports SVG historiques de `relay-assets.mjs` ne sont pas modifiés. Aucun champ graphique n’est ajouté aux sauvegardes.

## Indexation reproductible

Les points mesurés dans [anchors.json](anchors.json) sont relatifs aux cellules d’origine. L’indexeur arrondit chaque frontière de grille au demi-pixel supérieur et ne modifie jamais les PNG. Les rectangles source sont serrés autour de l’alpha avec deux pixels de marge ; les points d’origine, semelles, pivots et extrémités sont sérialisés séparément.

```bash
python tools/index-painted-relay.py
node --test tests/painted-relay.test.mjs
node tools/test-painted-relay.mjs docs/validation/painted-relay-v0155
```

## Réception de cette tranche

Les **six tests ciblés** reçoivent les empreintes originales, les cellules, les échecs de chargement, l’annulation d’un chargement ancien, l’arrivée différée, les contacts, les états des composants et la bouche des projectiles dans les deux directions.

Le [reçu Canvas](../../../docs/validation/painted-relay-v0155/receipt.json) décode les trois PNG et les trente cellules, vérifie leur contenu alpha, puis produit **neuf images** : une planche de six assemblages diagnostiques, une planche de treize états de site et sept scènes MI12 atteintes par le pilote de commandes publiques existant. Ce pilote finit la mission avec le choix `defy` en **205,07 secondes simulées**. Chaque scène conserve une copie profonde de son état et son empreinte.

La relecture visuelle a détecté un capteur suspendu au-dessus de la coque. Le raccord de son support a été corrigé sans changer le centre du composant ou ses collisions. Les vues ont ensuite été recalculées et relues. Les deux références restent exclues de la sélection du rendu.

Cette réception utilise **Skia Canvas**. Elle ne constitue ni une capture de navigateur, ni un essai humain, ni une validation des animations finales. La campagne reste MI01–MI14 au stade prototype ; ce lot ne crée aucune nouvelle mission, preuve, population ou mécanique de composant.
