# Réception des installations peintes — 0.15.6

**ORDRE DE CENDRE · réception locale du 16 novembre 2026**

La tranche 0.15.6 ajoute **13 atlas PNG originaux et 75 cellules utilisées au rendu**, sans nouvelle cellule de référence. Les huit lots historiques conservent leurs **45 atlas et 386 cellules** ; le total atteint **58 atlas et 461 cellules dans onze lots**. Les images habillent des installations déjà présentes dans MI05–MI08, MI10 et MI11. Elles n’ajoutent ni mission, ni acteur, ni population, ni condition d’acquisition.

Cette réception regroupe les contrôles locaux des images, du rendu, de la conservation, de la Bible et des éditions distribuées. Elle reçoit **765 tests Node et 108 parcours du DOM modélisé**. Les scènes Canvas, ces contrôles automatisés et une réception native ou distante restent des preuves distinctes.

## Lots intégrés

| Lot | Missions | Contenu effectivement raccordé | Atlas | Cellules de rendu | Rapport détaillé |
| --- | --- | --- | ---: | ---: | --- |
| Installations de Nacre | MI05–MI08 | Panneaux et vantaux, hydraulique et organes mobiles, maisons et ruines, abris et accueils, quais, rampes et treuils | 5 | 30 | [QA Nacre](QA_PAINTED_NACRE_SITES.md) |
| Champ chimique | MI10 | Cuves, préleveur, registre, vannes, canaux et habitats ; réemploi des herbes peintes Thyr existantes | 5 | 24 | [QA chimique](QA_PAINTED_CHEMICAL.md) |
| Appareils et sites de Thyr | MI11 | Écoute au sol, traduction impériale, émetteur, sites de ponte et repère de corniche | 3 | 21 | [QA voix](QA_PAINTED_VOICE.md) |
| **Ajouts 0.15.6** | | | **13** | **75** | |

Les trois manifestes [Nacre](../assets/painted/nacre-sites/manifest.json), [chimique](../assets/painted/chemical/manifest.json) et [voix](../assets/painted/voice/manifest.json) détaillent les fichiers, dimensions, cellules et empreintes. Les **quatre cases vides** — trois dans le lot chimique, une dans l’émetteur MI11 — sont exclues du compte. Les cellules comptent des pièces et des états graphiques ; elles ne désignent pas autant de sites uniques ou de cycles d’animation achevés.

## Contrats physiques conservés

Les pièces mobiles de Nacre gardent leurs ancres mesurées : rotors, volants, verrou et tambour sont séparés des carcasses. Les vantaux suivent `departureGateBounds`, les rails demeurent fixes et les lames rejoignent les extrémités du terrain. Les câbles, la pression, l’eau et les personnes restent dessinés à partir de leurs faits simulés. Les sprites des bâtiments ne contiennent aucun occupant peint ; les rampes détruites conservent leur repli vectoriel.

Dans MI10, la sélection des images suit les cuves, travaux, copies et pertes existants. Les masses en transit, le bassin de rétention et la pollution restent calculés par la simulation. Un canal couvert et contaminé conserve les deux informations : l’eau contaminée reste visible sous une mince plaque peinte, tandis que la surface d’appui suit exactement `chemicalSurfaceAt`. La destruction supprime la couverture ; le graphisme ne rétablit ni le support ni la potabilité. Le préleveur recueilli montre un logement de fiole vide, et la perte des originaux n’efface aucune copie déjà acquise.

Dans MI11, le petit repère peint ne remplace pas la corniche de `voiceSurfaceAt`. Les trois sites de ponte ne créent aucun recensement. L’émetteur saisi garde seulement son socle, à la même échelle que l’instrument intact. Les relevés, copies, consentements, opérations, pertes et TE01 suivent toujours leurs conditions existantes.

Les trois chargeurs sont raccordés dans `main.mjs`, avec observation en lecture seule et repli vectoriel indépendant en cas de défaut de décodage. Aucun champ graphique n’entre dans le dossier v14. Les barres de travail, textes, volumes et autres instruments précis demeurent procéduraux lorsqu’ils portent une information dynamique.

## Portée des preuves graphiques et jouables

Les trois lots fournissent **29 vues Canvas inspectées** : huit diagnostics, cinq cadrages de scènes Nacre et seize scènes issues des pilotes publics de MI10/MI11. Les vingt tests ciblés ci-dessous sont inclus dans la suite globale de 765 tests ; ils ne constituent pas un total supplémentaire.

| Lot | Tests ciblés | Vues et préparation | Résultat jouable attesté | Limite |
| --- | ---: | --- | --- | --- |
| Nacre | 6 | 10 vues : cinq diagnostics d’états imposés et cinq scènes créées normalement, avancées de 120 ticks publics puis recadrées | Ancres, eau, portes, rampes, rendu sans mutation et repli contrôlés | Aucun parcours complet ni arrivée au refuge revendiqués |
| MI10 | 8 | 11 vues : deux diagnostics et neuf scènes obtenues par le pilote public inchangé | `defy` atteint `won` à **198,917 s**, PT02 acquis, deux canaux couverts et deux habitats préservés | La seconde observation des originaux détruits s’arrête à **85,733 s**, en `playing`, avec PT02 conservé |
| MI11 | 6 | Huit vues : une planche des états et sept scènes obtenues par le pilote public | `defy` atteint `won` à **136,817 s**, trois sites intacts et TE01 acquis | Les occlusions normales par le marcheur restent présentes ; une vue après éloignement montre l’émetteur complet |

Les reçus [Nacre](validation/painted-nacre-sites-v0156/receipt.json), [MI10](validation/painted-chemical-v0156/receipt.json) et [MI11](validation/painted-voice-v0156/receipt.json) identifient les sources et les images. Les états des parcours sont copiés profondément avant rendu et ne sont pas résolus par le dessin. Les diagnostics de dommage, de crue ou de pontage ne prétendent pas que ces opérations ont été accomplies dans un parcours public.

## Contrôles globaux

Les commandes suivantes ont terminé avec `exitCode: 0`. Leurs reçus et journaux sont conservés dans `docs/validation/release-v0156/gates/`.

| Contrôle | Résultat | Reçu |
| --- | --- | --- |
| `npm test` | **765 réussites**, zéro échec, zéro cas ignoré | [Tests](validation/release-v0156/gates/tests.json) |
| `npm run check` | 1 007 fiches source, vingt feuilles de conception, six châssis, trois opérations et quatorze missions | [Projet](validation/release-v0156/gates/project.json) |
| `npm run build` | HTML autonome et ZIP reconstruits à partir des sources courantes | [Construction](validation/release-v0156/gates/build.json) |
| `npm run build:web` | Édition web reconstruite, sans dépendance de runtime externe | [Web](validation/release-v0156/gates/web.json) |
| `npm run check:ui` | 213 IDs HTML uniques, 185 références JS, cinq vues, quatre onglets d’archives et six dialogues ; script autonome compilé, ressources embarquées | [Audit statique](validation/release-v0156/gates/ui-static.json) |
| `npm run check:ui-runtime` | **108 parcours réussis** contre le vrai script autonome dans un DOM modélisé ; commande achevée en 130,701 s | [DOM modélisé](validation/release-v0156/gates/ui-runtime.json) |
| Réception finale MI11 | Décodage PNG, planche et scènes publiques recalculés après le raccordement final | [Voix](validation/release-v0156/gates/voice.json) |

L’audit statique ne déclenche pas de clic. Les 108 parcours exécutent les gestionnaires du script dans un modèle de DOM ; ils ne vérifient pas le rendu CSS, le focus natif, un vrai téléchargement, l’audio ou le toucher physique d’un navigateur.

### Régression historique

Le [reçu consolidé de régression](validation/release-v0156/regression/summary.json) reçoit les huit lots peints antérieurs et un neuvième contrôle consacré au rendu vectoriel, tous avec un code de sortie nul. Il rapproche les sources courantes, les manifestes, les originaux et les empreintes des sorties de vérification. Les **100 images de régression** ont été produites dans un dossier temporaire ; elles ne remplacent pas les preuves historiques et ne sont pas comptées parmi les nouveaux sprites.

| Lot historique | Atlas | Cellules | Utilisées au rendu | Références |
| --- | ---: | ---: | ---: | ---: |
| Atelier MI14 | 8 | 54 | 54 | 0 |
| Acteurs et véhicules de combat | 9 | 78 | 60 | 18 |
| Marcheurs jouables | 6 | 96 | 96 | 0 |
| Vie de Thyr | 8 | 62 | 58 | 4 |
| Cerbère | 1 | 16 | 11 | 5 |
| Transports | 4 | 20 | 20 | 0 |
| Troisième relais | 3 | 30 | 28 | 2 |
| Véhicules et embarcations de Nacre | 6 | 30 | 29 | 1 |
| **Historique conservé** | **45** | **386** | **356** | **30** |

Les usages sont ceux des manifestes explicites. L’absence d’un champ d’usage dans un ancien reçu n’est pas interprétée comme un usage au rendu.

Les **174 comparaisons SVG/Canvas réussissent**, avec une couverture partagée minimale de **99,46 %**. Elles comprennent 33 cas d’atelier, 22 de relais, 29 de fonderie, trois de marcheurs de production, deux de composants Nacre, 35 de Thyr, 24 chimiques et 26 de voix. Cette concordance porte sur les géométries vectorielles historiques ; elle ne transforme pas les peintures PNG en exports SVG et n’atteste pas leur qualité artistique finale. Les 1 142 preuves historiques contrôlées avant et après cette régression gardent leurs octets.

## Originaux et préservation

Le [contrôle indépendant des originaux](validation/release-v0156/originals.json) compare les **13 PNG sélectionnés**, octet pour octet, aux fichiers Imagegen encore disponibles dans l’environnement. Tous sont identiques, y compris les corrections de transparence sélectionnées. Ils représentent **22 619 392 octets** : 7 779 670 pour Nacre, 7 841 342 pour MI10 et 6 998 380 pour MI11. Les scripts d’indexation ne modifient aucun pixel.

Le même contrôle somme les cellules à partir des entrées individuelles des onze manifestes, puis rapproche leur inventaire avec les **58 PNG réellement présents**. Tous les nombres d’octets et SHA-256 correspondent. Les références historiques conservent leur rôle ; cette tranche n’en ajoute aucune.

Le [reçu de préservation](validation/release-v0156/preservation.json) retrouve **1 819 fichiers protégés identiques** à la baseline, sans fichier absent : 73 fichiers des anciens lots peints, 560 aperçus, 1 142 preuves historiques, 21 sources protégées et 23 fixtures. Aucun changement de simulation, campagne, sauvegarde ou source vectorielle n’apparaît dans le diff contrôlé. L’arbre de base local `9f0c3ae87920b1665a25f15cb03add6a85bf3b7a` est vérifié ; le SHA public 0.15.5 reste une provenance de baseline, distincte d’une nouvelle vérification distante.

## Bible et registre

Le [complément Bible 0.15.6](BIBLE_V15_6.md) documente trente fiches descriptives enrichies et **977 fiches inchangées**. Les **1 007 IDs ordonnés**, tous les statuts, les textes de critères et résultats attendus ainsi que les 133 critères initiaux sont conservés. Aucun critère humain n’est clôturé par la présence des nouveaux atlas.

La [réception de source](validation/workbook-v0.15-patch6-source.json), la [réception ZIP/XML](validation/workbook-v0.15-patch6-export.json) et la [comparaison de mise en page](validation/workbook-v0.15-patch6-layout.json) attestent les vingt et un onglets, **126 formules sans cellule en erreur**, 6 767 cellules réconciliées avec le JSON et la conservation des cellules non affectées. Les **18 nouvelles vues** inspectées couvrent toutes les lignes modifiées, avec leur [reçu visuel](validation/workbook-v0.15-patch6-visual-review.json). Cette réception du classeur reste distincte d’une manipulation interactive dans Excel ou Calc.

## Éditions construites

Le [manifeste de distribution](../dist/Ordre_de_Cendre.manifest.json) identifie les artefacts construits sous Node 24.22.1. Le ZIP contient une seule entrée UTF-8, `Ordre_de_Cendre.html`, avec la date ZIP fixe du 1er janvier 1980. Les PNG et le code de gameplay ne sont pas réduits pour respecter la limite de taille.

| Artefact | Octets | SHA-256 |
| --- | ---: | --- |
| HTML autonome | **141 278 398** | `7d346e0fcfacf6507a89bc10840ed1cf370297e6dff7566d0a339e7ac0c77b8e` |
| ZIP distribué | **103 369 632** | `2ad83ba23c1fc0f5f3cdc5ba2d929c68ba41707a9f26bd50c0fee67f553bcb67` |

Le [contrôle indépendant du bundle](validation/release-v0156/bundle.json) est réussi. Il rapproche les **56 modules** avec le graphe de dépendances et les corps des sources courantes. Les **58 atlas peints sont chacun embarqués une fois**, avec leurs octets originaux exacts. Les 61 occurrences PNG comprennent aussi le panorama historique une fois et l’illustration de titre deux fois. L’analyse statique ne détecte aucune ressource externe, import non résolu ou API de requête nécessaire au jeu autonome ; aucune trace réseau native n’est revendiquée.

La lecture indépendante avec Python `zipfile` valide le CRC **`b0e75a07`** et l’unique entrée HTML, identique octet pour octet au fichier construit et à son SHA-256 ci-dessus. Le ZIP reste sous 100 Mio avec une marge de **1 487 968 octets**. Aucun second build ni changement de source n’a été effectué par ce contrôle. L’identité de l’HTML extrait reste le critère de fidélité entre runtimes ; les octets compressés peuvent varier avec l’implémentation de zlib.

## Réception distante et travaux ouverts

**Aucune réception native ou distante de la 0.15.6 n’a encore été exécutée au stade de ce rapport local.** Les futurs résultats GitHub, CI, déploiement, comparaisons HTTP et gestes natifs devront être rattachés à leur commit et à leurs reçus dans [DEPLOYMENT.md](DEPLOYMENT.md). Un build réussi, une scène Canvas ou une ancienne réception native ne valent pas observation de cette version en production.

La portée jouable reste MI01–MI14, six châssis, trois opérations et le dossier v14. Les installations de Vesper, certains appareils de MI09 et MI13, les autres biomes et factions, les animations finales ainsi que MI15–MI32 conservent leurs travaux ouverts. Le [rapport de production](PRODUCTION_V15_6.md) décrit cette tranche ; les rapports par lot conservent leurs limites de couverture et de réception humaine.
