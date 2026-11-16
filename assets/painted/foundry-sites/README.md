# MI13 — Chantier peint de Kharon

**Tranche 0.15.7 — 4 atlas PNG originaux / 23 cellules utilisées au rendu.**

Le lot habille les objets déjà simulés de « Pièces de rechange ». Il ne remplace pas le porteur industriel ni les deux caisses, déjà couverts par le lot `transport` de la 0.15.5.

| Fichier | Cellules | Usage |
| --- | ---: | --- |
| `valves.png` | 6 | Vanne fermée, avertissement, pression active, circuit isolé, vanne détruite ; volant séparé. |
| `cranes.png` | 5 | Grue en attente, au travail, réception acquise, quarantaine ; crochet séparé. La sixième case est vide. |
| `consoles.png` | 6 | Console au repos, au travail et terminée ; bordereau scellé, copié et détruit. |
| `thermal.png` | 6 | Tablier chaud, refroidissant et refroidi ; grille vapeur au repos, en avertissement et ouverte. |

Les quatre PNG mesurent **1536 × 1024** et possèdent un véritable canal alpha. Ce sont les octets originaux des sorties Imagegen retenues. `prompts.json` conserve les quatre demandes de génération, `generation.json` les sources et empreintes, `anchors.json` les mesures, et `manifest.json` les dimensions et comptes vérifiés. Aucun script ne retouche, redimensionne ou réencode les PNG.

## Intégration

`src/painted-foundry-sites.mjs` charge les images et sélectionne les rectangles de `src/painted-foundry-sites-layout.mjs`. `src/foundry-renderer.mjs` conserve le dessin vectoriel pour chaque famille en cas d’absence ou d’échec de décodage.

Le volant n’est pas prépeint sur les corps ; il tourne une seule fois autour de l’axe mesuré, selon le progrès réel du travail. La grue ne contient ni câble ni crochet prépeint : le câble rejoint son chariot, et le crochet séparé suit le progrès de transfert. Le panneau de quarantaine reste visible pendant ce mouvement. Cette articulation est un rig de présentation existant, sans contrainte physique supplémentaire sur les caisses.

Les segments peints du tablier sont projetés sur la vraie surface `foundrySurfaceAt`. Leur phase de texture reste attachée au début du pont quand la caméra se déplace. Les grilles n’incluent pas de vapeur : avertissement, jet, horloge thermique et zone dangereuse de 270 unités restent dessinés à partir de la simulation. La perte d’une vanne n’annule pas une isolation déjà accomplie.

Copies de bordereaux, analyse, destination, arrivée du porteur et transferts restent des faits distincts. Aucun nouveau personnage, stock, dommage, état de sauvegarde ou élément de preuve n’est créé.

## Réception

`python3 tools/index-painted-foundry-sites.py` vérifie les cellules et l’alpha puis écrit uniquement les métadonnées.

`node --test tests/painted-foundry-sites.test.mjs` reçoit huit cas dédiés : chargement, échec et repli, chargement périmé, pivots des pièces, transfert en quarantaine, terrain réel, pile Canvas après erreur et absence de mutation des faits.

`node tools/test-painted-foundry-sites.mjs docs/validation/painted-foundry-sites-v0157` décode les quatre PNG originaux, vérifie 23 cellules et produit huit vues : une planche d’états, un diagnostic de terrain/vapeur et six scènes atteintes par le pilote public inchangé de MI13. Ces vues sont des rendus Canvas ; aucune réception navigateur ou humaine n’est revendiquée.
