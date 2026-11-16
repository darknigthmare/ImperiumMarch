# Réception des sprites peints de MI14

**16 novembre 2026 · Vérification de rendu dans Node Canvas**

Les huit atlas PNG ont été décodés depuis leurs fichiers d'origine et réellement consommés par le renderer. Le [reçu graphique](receipt.json) conserve les empreintes des images, des sources et des scènes de référence.

| Contrôle exécuté | Résultat |
| --- | --- |
| Tests de comportement de présentation | **4/4 réussis** — [reçu](unit-tests.json), [journal](unit-tests.txt) |
| Atlas chargés et transparence | **8/8**, pixels RGBA décodés, espaces transparents conservés |
| Cadres et recadrages | **54 cadres**, y compris les poses de référence ; aucune silhouette opaque coupée à une frontière de cellule |
| Cycles de marche | **8 poses distinctes pour chaque rôle**, boucle complète et point de contact au sol stable |
| États des composants | **33 rendus isolés**, aucun bord de dessin coupé par leur viewport |
| Scènes de mission | **14 nouvelles images Canvas** depuis les scènes historiques, sans mutation de leurs états ni de leurs fichiers |
| Bouche du canon | L'ancrage transformé coïncide avec le départ d'un projectile réellement émis par l'automate via les commandes publiques |
| Défaillance d'image | Le dessin vectoriel reste visible ; un chargement ancien ne réinjecte pas d'image après réinitialisation |

Le test utilise le décodage PNG par chemin de fichier de `@napi-rs/canvas`. Dans ce runtime, la variante qui reçoit un `Buffer` rejette ces PNG comme un SVG invalide, alors que la lecture directe des mêmes fichiers fonctionne. Aucun PNG n'a été converti, redimensionné ou réécrit par cette vérification.

Les cadres couchés peuvent dépasser légèrement les anciennes limites d'export du personnage debout ; le renderer ne découpe pas dans ces limites. Le reçu indique ces marges. Les corps sont contrôlés dans leur cellule d'origine puis dans un rendu entouré de marges, ce qui distingue un corps couché complet d'un sprite tronqué.

## Lecture visuelle effectuée

Les images `workers-crossing.png`, `repair.png` et `security-active.png` ont été ouvertes. Elles montrent respectivement les huit personnes sur le trajet réel, le refroidisseur en intervention avec sa vanne et son lot, puis l'automate actif avec son canon dirigé vers le marcheur. Les sprites restent posés sur les surfaces attendues et aucun rectangle opaque de fond ou découpage de leur silhouette n'a été observé dans ces trois vues. Le [reçu de lecture](visual-review.json) identifie leurs empreintes exactes.

Ces images sont des **rendus Canvas**, pas des captures de navigation. La disposition HTML/CSS, le focus, les gestes d'un navigateur et l'écoute ne sont pas vérifiés ici. Les 54 cadres comprennent des références de fabrication ; ils ne représentent ni 54 entités de gameplay ni une campagne entièrement illustrée. Cette réception ne ferme pas l'essai humain ni l'approbation de l'animation finale.
