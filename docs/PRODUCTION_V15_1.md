# ORDRE DE CENDRE — production graphique 0.15.1

**16 novembre 2026 · ImperiumMarch · MI14, Les mains noires**

La 0.15.1 ajoute des sprites peints à l’atelier de Kharon. Elle conserve les quatorze missions de campagne au stade prototype, les six châssis, les trois opérations indépendantes et le dossier v14. La [consolidation de MI14](QA_V15.md) précède ce changement graphique ; les contrôles qui portent sur les nouveaux sprites sont consignés dans [QA_PAINTED_MI14.md](QA_PAINTED_MI14.md).

## Lot livré

Les huit PNG sont des atlas transparents générés avec Image Gen. Leurs octets sont conservés après génération. Le rendu prélève les cellules directement dans les images sources, avec des rectangles et des ancres documentés dans [painted-sprite-layout.mjs](../src/painted-sprite-layout.mjs). Il ne dépend pas d’une extraction manuelle de fichiers pour chaque pose.

| Atlas | Cellules | Usage |
| --- | ---: | --- |
| [worker.png](../assets/painted/mi14/worker.png) | 12 | Tenue ouvrière : huit poses de marche, repos, arrivée, perte et pose agenouillée de référence |
| [worker-mechanic.png](../assets/painted/mi14/worker-mechanic.png) | 12 | Tenue mécanicienne : huit poses de marche, repos, arrivée, perte et pose agenouillée de référence |
| [cooler.png](../assets/painted/mi14/cooler.png) | 6 | Refroidisseur dans ses états de fonctionnement, d’intervention et de dégradation |
| [valve.png](../assets/painted/mi14/valve.png) | 3 | Vanne ouverte, isolée et détruite |
| [disputed-lot.png](../assets/painted/mi14/disputed-lot.png) | 6 | Lot industriel et ses états d’inspection, de disposition et de perte |
| [workshop-control.png](../assets/painted/mi14/workshop-control.png) | 6 | Commande d’atelier et ses états d’opération, d’arrêt et de dégradation |
| [security-automaton.png](../assets/painted/mi14/security-automaton.png) | 6 | Quatre états du corps, canon intact et canon détruit séparés |
| [picket-post.png](../assets/painted/mi14/picket-post.png) | 3 | Poste du piquet fermé, en cours de libération et ouvert |
| **Total** | **54** | **24 cellules de personnes et 30 de machines ou accessoires** |

Les seize poses de marche se répartissent en deux cycles de huit images, un par tenue. Elles habillent les huit ouvriers locaux existants. Le total de 54 décrit des cellules graphiques ; les effectifs et identités de la mission restent ceux de la simulation. Les deux poses agenouillées restent des références pour la suite du travail d’animation.

## Intégration au jeu

[painted-sprites.mjs](../src/painted-sprites.mjs) charge les atlas et choisit les cellules selon les états transmis par le renderer. Un échec de décodage conserve le dessin vectoriel. Les images n’ajoutent aucun corps, dégât, déplacement ni événement de campagne.

Le cycle de marche suit la progression des personnes. Leurs coordonnées de terrain, arrivées et pertes restent simulées. Le canon de l’automate est dessiné séparément autour de son pivot et sa bouche conserve la position physique du tir. Le refroidisseur change de cellule selon ses états de panne, d’isolation, de réparation et de fonctionnement. Sa grille peinte reste fixe, tout comme les corps des installations et leurs raccords.

Les six châssis gardent leur locomotion articulée et leurs vrais contacts de pieds. Ce lot concerne les personnes et installations de MI14. Leurs états de perte, la réparation du froid, l’activation de l’automate et la commande d’atelier restent gouvernés par les règles existantes.

Les URL des huit images sont explicites pour permettre leur incorporation dans `dist/Ordre_de_Cendre.html`. L’édition autonome conserve son fonctionnement sans chargement réseau. La construction web emporte les mêmes sources graphiques.

## Bible et traçabilité

La source [data/bible.json](../data/bible.json) passe à **0.15.1**, avec **1 007 fiches** et les mêmes identifiants, dans le même ordre. Les statuts des fiches restent inchangés. Les cinq lignes précisées sont AS19, PR99, PX117, PX118 et PX121. Les **133 critères initiaux** gardent leur dénominateur et leurs textes historiques dans le registre 0.15.

Le [classeur courant](ORDRE_DE_CENDRE_Bible.xlsx) conserve **21 onglets**, **20 tables** et **126 formules**. Ses nouveaux reçus portent le suffixe `patch1` : les preuves `workbook-v0.15-*` de l’export précédent restent intactes. Le [guide du classeur](BIBLE_README.md) indique les commandes et les contrôles effectivement exécutés.

## Limites et suite

Les atlas, cycles et états sont reçus comme une **production au stade prototype**. Les poses supplémentaires, transitions complètes, voix et critères d’art final restent ouverts. Les deux tenues ne constituent pas huit personnages dessinés séparément. Les systèmes finaux de Kharon et Sereis ainsi que les missions MI15–MI32 restent à produire.

Le rapport graphique distingue les contrôles automatiques, les observations navigateur et l’essai humain. Ni les images générées, ni les tests de simulation ne suffisent à fermer les critères humains. Le [suivi de déploiement](DEPLOYMENT.md) conserve séparément le commit public et le déploiement vérifié ; ce document n’anticipe pas leur publication.
