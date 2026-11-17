# Production 0.15.11 — impacts, tir, purge et industrie

La tranche continue depuis le `main` publié **`a8658969f928981fe58cee3f4088f9f711587786`**, reçu par les CI de PR et de main de la 0.15.10. Elle ajoute les images qui manquaient aux étincelles, petits éclats, flash principal, bouffées de purge et silhouettes industrielles de Vesper. Les trois nouveaux lots sont raccordés au renderer et au chargement du jeu autonome.

## Cinq atlas, vingt-quatre cellules

| Lot | Atlas PNG | Cellules utilisées | Contenu |
| --- | ---: | ---: | --- |
| [Impacts](../assets/painted/particle-impacts/README.md) | 2 | 12 | Six âges d'étincelle et six de petit éclat `blast` |
| [Effets du marcheur](../assets/painted/walker-fx/README.md) | 2 | 10 | Quatre phases du flash principal et six de vapeur de purge |
| [Industrie Vesper](../assets/painted/vesper-industry/README.md) | 1 | 2 | Silo nervuré et cheminée étroite |
| **Nouvelle tranche** | **5** | **24** | **Aucune nouvelle cellule de référence** |

Le catalogue totalise **95 atlas et 700 cellules dans 24 lots**, dont **656 cellules utilisées au rendu et 44 références**. Les **quatre panoramas** sont comptés séparément. Le petit atelier du plan industriel réutilise une cellule `maintenance` déjà acquise ; il n'augmente aucun compteur. Les [comptes et provenances](validation/painted-counts-v01511.json) réconcilient chaque lot avec la baseline 0.15.10.

Les cinq PNG sélectionnés mesurent **1536 × 1024 pixels**. Ils sont copiés depuis leurs sorties ImageGen sans réencodage, réduction ou retouche de pixels. Leurs [prompts d'impacts](../assets/painted/particle-impacts/prompts.json), [prompts d'effets](../assets/painted/walker-fx/prompts.json) et [prompt industriel](../assets/painted/vesper-industry/prompts.json) conservent les requêtes, sorties sélectionnées et éventuelles éditions. Les indexeurs mesurent l'alpha, les rectangles et les ancres ; ils ne réécrivent pas les images.

## Effets guidés par les faits du jeu

### Étincelles et petits éclats

Les deux nouvelles images habillent les particules déjà émises par la simulation. Une étincelle garde le segment entre sa position et cette position moins `0.025 × vitesse`, avec une largeur de deux unités et des extrémités rondes. Sa direction suit la vitesse actuelle, y compris après évolution de sa trajectoire. Le module ne lit pas `particle.size` pour agrandir cette ligne.

Une particule `blast` garde son petit cercle de rayon `size`. Elle ne devient pas une explosion complète et ne prend pas le rayon de dégâts. Les six cellules de chaque type suivent `1 − life/maxLife` sans boucle. L'alpha, les positions, les vitesses et les expirations restent ceux du moteur ; la réduction des mouvements fixe seulement la cellule sélectionnée.

Les palettes canoniques sont reconnues. Les couleurs particulières, géométries invalides, types non couverts ou défauts de décodage conservent leur rendu vectoriel. Aucun matériau d'impact, ricochet, débris persistant ou nouvel émetteur n'est déduit de ces images.

### Flash principal

Le cœur du flash utilise quatre phases. Le halo procédural reste dessiné une seule fois, avec son centre, son rayon et sa couleur historiques. La cellule est limitée au polygone qui existait déjà ; le premier PNG comportant un halo superflu est conservé comme rejet dans la provenance.

Le flash n'existe que pendant `fireCooldown > .1`, hors hangar. Le pivot suit la visée actuelle du canon et les bouches restent à 92, 112 ou 101 unités suivant les châssis. Les phases sont sélectionnées dans la fenêtre réelle `fireRate − .1` : les vingt millisecondes du châssis le plus rapide ne sont pas prolongées pour afficher artificiellement les quatre images. Un tir secondaire seul ne déclenche pas le flash principal.

### Purge

La vapeur habille les cinq bouffées qui existaient dans le renderer. Leur présence conserve `venting || heat > 70`, leurs phases, centres, rayons et alpha. La texture reste découpée dans chaque cercle. La pause conserve l'horloge simulée et la réduction des mouvements emploie toujours le temps visuel zéro.

Ces bouffées ne sont pas ajoutées à `s.particles`. Elles n'introduisent ni compteur, ni consommation, ni nouvelle règle thermique. Le radiateur garde sa surface physique et ses dégâts propres.

## Industrie de Vesper

Le plan industriel reste décoratif et réservé à PL01 : MI01–MI04 et OP01. Le silo et la cheminée occupent les enveloppes existantes, avec la même parallaxe, le même espacement et la même hauteur déterministe. La transformation parent reste `translate(0,180)` puis `scale(1,.75)`.

L'atelier reprend la cellule `maintenance` à son ancre de base. Ses fenêtres peintes remplacent les cinq rectangles de repli, sans superposition. Chaque pièce possède un repli indépendant. Les bouffées industrielles, conduites et semelle conservent leur présentation actuelle. Ces silhouettes ne créent ni acteur, ni collider, ni ressource, ni effectif de population.

## Réceptions et limites

Le [rapport QA](QA_V15_11.md) rassemble les contrôles locaux et leurs empreintes. Les trois lots possèdent des tests sémantiques, des contrôles Canvas et des vues relues ; leurs premières réceptions restent conservées lorsqu'un pilote ou une course de fichiers a nécessité une nouvelle exécution.

La [réception combinée](validation/v01511-final/integrated-caption-corrected/receipt.json) charge **les 25 chargeurs graphiques et 99 PNG du jeu**. Quatre vues obtenues par commandes publiques couvrent le tir primaire, un impact au sol, la purge après des tirs et la même purge sous réduction des mouvements. Les états de simulation sont identiques avant et après rendu ; deux rendus au même instant produisent les mêmes pixels. La [relecture des quatre vues](validation/v01511-final/integrated-caption-corrected/visual-review.json) distingue l'image de jeu de son bandeau de diagnostic.

Les effets restent petits à leur échelle réelle. Les étincelles initiales peuvent être partiellement recouvertes par le flash, et la vapeur reste pâle. Les diagnostics agrandis servent à examiner les cellules, sans annoncer ces agrandissements comme une taille d'effet en jeu.

La Bible conserve ses **1 007 identifiants, 21 onglets, statuts et 133 critères initiaux**. AS09, AS16 et AS22 demeurent des livrables partiels ; la mise à jour descriptive ne ferme aucune réception humaine. Les impacts par matériau, ricochets, traces persistantes, effets de dégâts spécialisés et capacités finales encore conçues restent à produire. La campagne reste à MI01–MI14, avec six châssis, trois opérations et un dossier v14.

Le [suivi de publication](DEPLOYMENT.md) distingue les sources GitHub, les constructions autonomes et l'hébergement effectivement reçu. Aucun contrôle Canvas ou DOM modélisé ne constitue une nouvelle réception navigateur, audio, matérielle ou humaine.
