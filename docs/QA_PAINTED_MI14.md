# Réception graphique 0.15.1 — MI14

**16 novembre 2026 · Les mains noires · Sprites peints de Kharon**

Les huit atlas PNG sont intégrés au renderer de l'atelier. La réception ci-dessous porte sur les images réellement décodées, leur cadrage, les états de présentation et les scènes Canvas. La [consolidation de la reprise MI14](QA_V15.md) conserve séparément ses résultats antérieurs à cette intégration.

## Résultats exécutés

| Vérification | Résultat | Preuve |
| --- | --- | --- |
| `node --test tests/painted-sprites.test.mjs` | **4/4 tests réussis** | [Reçu et empreintes](validation/painted-mi14/unit-tests.json), [journal](validation/painted-mi14/unit-tests.txt) |
| `node tools/test-painted-sprites.mjs` | **8 atlas décodés, 54 cadres contrôlés, 33 états isolés, 14 scènes rendues** | [Reçu graphique](validation/painted-mi14/receipt.json), [journal](validation/painted-mi14/canvas-test.txt) |
| Utilisation effective dans les scènes | **85 appels de dessin des atlas** sur les quatorze scènes | Le reçu associe chaque scène aux atlas consommés et à son état source |
| Inspection visuelle | **3 images ouvertes** : passage ouvrier, réparation du refroidisseur, automate actif | [Lecture visuelle et SHA-256](validation/painted-mi14/visual-review.json) |

La suite complète de **687 tests** reste en attente de clôture dans le suivi de cette livraison. Les quatre réussites dédiées ci-dessus ne constituent pas son résultat anticipé.

Les contrôles confirment huit poses de marche distinctes par tenue, leur retour à la première pose, la stabilité du point de contact au sol et la conservation des transformations Canvas. Chaque recadrage reste dans son atlas et sa cellule, sans silhouette opaque coupée à une frontière de cellule ni partie significative du corps laissée hors du recadrage. Les scènes historiques et leurs états restent inchangés après rendu.

Le canon possède une pièce orientable séparée. Son ancrage de bouche, transformé par le renderer, coïncide avec le point de départ d'un projectile réellement tiré par l'automate au cours d'un parcours par commandes publiques. Un décodage d'image refusé conserve le corps vectoriel ; une ressource encore en cours de chargement ne peut pas réapparaître après réinitialisation de la présentation.

Les PNG ont été décodés directement depuis leurs chemins de fichiers dans `@napi-rs/canvas`. Le chemin de décodage qui reçoit un `Buffer` les refusait comme des SVG invalides dans ce runtime ; la lecture des mêmes fichiers fonctionne. Les images sources n'ont subi aucune conversion ni réécriture par le test. Le [rapport détaillé](validation/painted-mi14/QA.md) précise la portée des contrôles.

## Navigateur local

La tentative de Chromium local a été interrompue **avant le chargement du jeu** par `socket() failed: Operation not permitted`, avec une erreur `ptrace: Operation not permitted`. Le [rapport de tentative](validation/painted-mi14-browser/report.json) conserve la commande, les empreintes et l'erreur exacte : **zéro parcours exécuté et zéro capture navigateur**.

Les rendus Canvas et les tests de présentation ne remplacent pas cette réception. Aucune validation de la mise en page HTML/CSS, du focus natif, des téléchargements, de l'audio ou d'une manette physique n'est attribuée à cette tentative. La réception navigateur **QA230** et l'essai humain **QA231** restent ouverts dans ce rapport.

## Portée de livraison

Les quatorze images sont de nouveaux rendus Canvas de scènes préparées antérieurement par commandes publiques. Les trois vues examinées montrent des sprites posés sur les surfaces attendues, des machines lisibles et un canon raccordé à son pivot ; aucun rectangle opaque de fond ni découpage de silhouette n'a été observé dans ces vues. Cela ne constitue pas une approbation humaine de l'animation complète ou de l'art final.

Les 54 cadres comprennent des références de fabrication et des états matériels. Ils ne représentent ni 54 personnages distincts, ni 54 animations terminées. Les deux tenues habillent les huit ouvriers existants. Les grilles du refroidisseur restent fixes ; ses états de maintenance et ses informations thermiques suivent la simulation.

Ce rapport ne revendique aucune publication distante, CI GitHub ou réception Vercel. Ces résultats doivent être constatés sur le commit et le déploiement exacts, puis consignés dans le [suivi de déploiement](DEPLOYMENT.md).
