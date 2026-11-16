# MI09 — équipements peints de la route des vivants

Version **0.15.7**. Trois atlas PNG RGBA originaux produits par Imagegen intégré, copiés octet pour octet. Le lot contient **20 cellules : 18 utilisées au rendu et 2 références**.

| Atlas | Cellules | Rendu | Références |
| --- | ---: | ---: | ---: |
| `barrier.png` | 6 | 6 | 0 |
| `terminals.png` | 8 | 7 | 1 |
| `logistics.png` | 6 | 5 | 1 |

La barrière utilise un socle et un bras séparés. La rotation conserve le pivot historique `[-76,-77]` et la valeur réelle `barrier.opening`. Dans la simulation courante, cette valeur passe à l'ouverture prescrite seulement après le travail accompli ; la barre de progression n'invente pas une ouverture anticipée. Les cinq fractions intermédiaires de la planche de contrôle sont des poses de diagnostic.

La carte distingue l'affichage militaire du relevé de migration. Les bornes partagent les états attente, travail et opération accomplie. Les repères impérial et local suivent l'approche réellement préparée. Le projecteur suit son état allumé/coupé ; le cône lumineux reste le dessin existant. Le transport possède trois images intacte, endommagée et détruite, sans changer sa position ni ses collisions.

La roue isolée reste une référence : les trois images de transport possèdent déjà leurs roues. La borne détruite reste aussi une référence : les postes de travail de MI09 n'ont ni santé ni destruction simulée. Ces images n'ajoutent donc aucun dommage, corps ou objet.

`tools/index-painted-route.py` mesure l'alpha et écrit uniquement les métadonnées. Les rangées de la barrière ont été mesurées à `0,418,815,1254` pixels ; elles ne constituent pas une grille régulière. `src/painted-route.mjs` conserve le repli vectoriel et n'écrit aucune donnée dans la simulation ou les sauvegardes.

Les prompts complets figurent dans `prompts.json`, les empreintes et dimensions dans `manifest.json`. Les PNG restent les originaux, sans découpage, recompression ni changement d'alpha. Le moteur utilise leurs rectangles par `drawImage`.

Réception : `node --test tests/painted-route.test.mjs` et `node tools/test-painted-route.mjs docs/validation/painted-route-v0157`. Le reçu distingue les planches de diagnostic et les scènes Canvas atteintes par commandes publiques. Il ne représente ni une capture navigateur ni un essai humain.
