# Validation de la version 0.4

**ORDRE DE CENDRE · 10 novembre 2026 · Environnement Node et Canvas Skia**

Cette version ajoute MI03, trois châssis et une réserve de munitions finie. Le contrôle porte sur les règles de simulation, la continuité des dossiers, les raccordements de l’interface, les exports et les rendus décrits ci-dessous. Il ne certifie pas une expérience de jeu humaine complète ni une exécution navigateur.

## Résultats

| Contrôle | Résultat observé | Preuve |
| --- | --- | --- |
| `npm test` | **89/89**, aucun échec, aucun test ignoré. | [Journal Node](validation/v04-node-tests.txt) |
| `npm run check` | 20 domaines, 526 fiches, 6 châssis, 3 opérations et 3 missions de campagne. | [Contrôle du projet](validation/v04-project-check.txt) |
| `npm run build` | HTML autonome d’environ 9,26 Mio, 6 modules intégrés. | [Construction](validation/v04-build.txt) |
| `npm run check:ui` | 121 IDs HTML uniques, 109 références littérales, 5 vues, 4 onglets et 6 dialogues ; script compilable, ressources intégrées. | [Audit statique](validation/v04-static-ui.txt) |
| `npm run check:ui-runtime` | **15 parcours** du script livré dans un DOM modélisé. | [Intégration UI](validation/v04-ui-runtime.txt) |
| `npm run build:web` | Sortie statique `web-dist/` avec page, modules, styles et assets. | [Construction web](validation/v04-web-build.txt) |
| Export du classeur | 526 fiches, 3 647 cellules source rapprochées, 126 formules sans erreur. | [Validation de l’export](validation/workbook-v0.4-export.json) |
| Rendu du jeu | 5 aperçus Canvas, depuis les commandes publiques pour les états de mission. | [Provenance des rendus](previews/v04-render-manifest.json) |
| Diff Git | Aucun problème de blancs dans `git diff --check`. | Contrôle effectué avant livraison. |

La configuration CI inclut maintenant les parcours de DOM modélisé et la construction web, en plus des contrôles historiques. Cette modification locale ne prétend pas qu’une exécution distante a déjà eu lieu.

## Simulation : 66 parcours victorieux parmi les scénarios testés

| Famille | Matrice exécutée | Parcours |
| --- | --- | ---: |
| MI01 | 6 châssis × passage protégé ou conduite rompue × 2 décisions. | 24 |
| MI02 | 6 châssis × 2 comptes rendus. | 12 |
| MI03 | 6 châssis × 2 décisions, difficulté Pilote, graine 1847. | 12 |
| OP01–OP03 | 6 châssis × 3 opérations indépendantes. | 18 |
| **Total** | États atteints par commandes publiques, sans fabriquer une victoire. | **66** |

Ces parcours sont regroupés dans plusieurs tests ; **66 parcours ne s’ajoutent pas aux 89 tests comme un second total de tests**. Les pilotes automatisés appliquent une tactique précise. Ils démontrent qu’une route est terminable et que les objectifs peuvent être atteints ; ils ne mesurent pas une difficulté humaine moyenne ni toutes les tactiques possibles.

Les douze parcours MI03 de la matrice normale préservent les vingt occupants. Un contrôle complémentaire des six châssis dans les trois difficultés, à la même graine, a également atteint la victoire sans décès avec ce pilote. Ce contrôle n’est pas présenté comme une garantie générale d’absence de pertes.

### Scénarios MI03 importants

- Un relevé nécessite la proximité et la durée prévues. Quitter sa portée interrompt la progression ; l’isolement militaire reste une action distincte.
- Les six secondes de surveillance proviennent du temps effectivement passé à vérifier des sources civiles vivantes. Attendre au départ ou lire des ruines ne les produit pas.
- Avant son arrivée, le drone de Holt ne bloque aucun projectile et ne reçoit aucun dégât d’explosion ou de contact. Son emplacement préinstancié sert uniquement à conserver une forme de sauvegarde stable.
- Trois roquettes réelles détruisent le dispensaire non vérifié : huit décès, source perdue, réseau partiel. Inspecter ensuite les ruines ne crée aucun témoignage.
- Détruire les deux sources civiles produit vingt pertes et aucun contenu radio inventé. La campagne peut consigner ce constat sans prétendre une vérification des communications.
- Une gaine sécurisée résiste au contact des appuis, tandis que le bâtiment reste exposé aux tirs. Les dégâts de pied viennent d’un contact réellement posé, pas de la seule proximité de la coque.
- Après le choix de maintien, de nouveaux dégâts peuvent encore détruire le dispensaire. Le reçu final conserve les huit décès, un seul relais civil actif et l’accès futur perdu.
- L’ouverture de la décision gèle la simulation. Une restauration suivie des mêmes entrées produit les mêmes états.

### Munitions

Les tests épuisent réellement les réserves par le tir, vérifient le transfert exact vers un magasin partiel, l’absence de création de cartouches à vide et le maintien du temps de rechargement lors de la reprise. Les caisses plafonnent leurs apports et ne se collectent qu’une fois. Une réserve vide est également parcourue dans le script de l’interface : le message apparaît et R ne régénère aucun tir.

## Sauvegardes : historique et intégrité

Le format v3 est testé à partir de deux fixtures historiques :

- `tests/fixtures/campaign-v1-mi01.json` provient de la version 0.2 et reste inchangé.
- `tests/fixtures/campaign-v2-mi02.json` provient de la révision **72027333c6ea5dc914d189fec6d2ff864b2f07c1**, exécutée dans un répertoire isolé. Il comprend MI02 au choix et après extraction, atteinte avec les commandes publiques historiques.

La migration conserve le magasin, les roquettes, la recharge en cours, les appuis, le train, les sources déjà relevées, les anciens rapports, les décisions, l’usure et les pièces. Elle ajoute les trois nouveaux châssis neufs, les champs de communications initiaux et une réserve finie déclarée de huit magasins aux anciens checkpoints.

La lecture seule n’écrit pas dans le stockage. La première écriture conserve l’ancien principal comme copie de secours. Les tests provoquent des refus d’écriture, vérifient le repli sur une copie compatible et empêchent l’écrasement d’une version future. Un dossier principal de plus de 2 Mo reste désormais protégé, même avec un backup valide : seul un remplacement explicite peut l’écarter.

La progression exige le rapport précédent. Les succès inscrivent un seul reçu et une seule dotation par mission. Les relectures laissent intacts les premiers choix et la sortie officielle en cours. Les réparations sont interdites pendant cette sortie. Une défaite réelle en MI03 n’ajoute aucun lot ni résultat et conserve le dernier checkpoint.

## Interface : quinze parcours dans un DOM modélisé

Le fichier autonome livré est compilé puis exécuté avec ses vrais gestionnaires d’événements. Le stockage, les fenêtres et les éléments DOM sont modélisés ; les appels Canvas sont neutralisés dans cette suite.

Les parcours couvrent : navigation entre cinq écrans ; sélection des six châssis ; lancement des simulations ; pause et reprise exacte ; séparation du dossier et des opérations ; décision MI01, retour et réparation ; migrations historiques et déverrouillage de MI02/MI03 ; relecture d’une ancienne mission avec une sortie officielle en cours ; choix MI02 ; scanner MI03 repris après pause et rechargement ; les deux décisions MI03 jusqu’au reçu et aux trois archives ; réserve vide ; dossier incompatible ; refus du stockage ; import asynchrone pendant une transition.

Les nouveaux rapports utilisent les données propres à la mission. MI03 n’affiche pas un nombre de filtres ou d’ouvriers du train. Le réseau partiel est distingué de la coupure totale. Le texte « constat des bâtiments » reste vrai même lorsque seules des ruines ont pu être inspectées.

**Portée limitée :** ce contrôle ne valide ni CSS, ni disposition sur écran, ni focus natif, ni modalité native des dialogues, ni téléchargement réel, ni audio, ni tactile physique, ni comportement natif de `localStorage`.

## Rendu Canvas et contrôle visuel

`tools/render-v04-previews.mjs` produit cinq images :

| Image | État réellement montré |
| --- | --- |
| [Six châssis](previews/v04-six-chassis.png) | Vues du hangar à une même échelle ; pas une capture de menu HTML. |
| [Dispensaire](previews/mi03-dispensary.png) | Inspection en cours depuis l’approche avec l’Arpenteur. |
| [Contrôle de Holt](previews/mi03-oversight.png) | Vérification des maisons et drone effectivement arrivé. |
| [Réseau vérifié](previews/mi03-network-verified.png) | Deux émissions vérifiées et encore actives **avant** le choix final. |
| [Dispensaire détruit](previews/mi03-damaged-dispensary.png) | Ruines obtenues par trois tirs réels, huit décès, absence de communication vérifiée. |

Le contrôle a porté sur les silhouettes, contacts de pieds, position de la gaine, murs et boîtes de collision, états des stations, textes et lisibilité des marqueurs. La revue a corrigé un texte « fréquences consignées » qui aurait été inexact pour des ruines : le terminal final indique désormais « dossier consigné ». Le drone absent n’est pas dessiné avant l’événement. Les marqueurs restent au-dessus du profil élevé de l’Arpenteur.

Ces images sont des rendus **Skia du Canvas de production**. Elles ne représentent ni l’interface HTML complète ni une observation de performance dans un navigateur.

## Classeur et conception

La source comprend **526 fiches**, avec conservation des **446 IDs historiques** et ajout de 80 fiches. Statuts : 283 Conçu, 120 Prototype, 94 À produire, 29 Vérifié. Les scénarios de QA vérifiés précisent leur portée ; le statut ne déclare pas tous les systèmes finaux terminés.

Le fichier XLSX exporté comporte 21 onglets, 20 tables nommées, 20 plages de validation des statuts, 80 règles de mise en forme conditionnelle et 20 volets gelés. Les 3 647 cellules de données ont été comparées à la source. Les 126 cellules de formule ne contiennent aucune erreur et leurs caches concordent avec les totaux. Un changement temporaire de statut a vérifié le recalcul avant restauration.

Les nouvelles plages ont été rendues et inspectées. Neuf aperçus représentatifs sont conservés dans `docs/previews/bible-v04-*.png`. `tools/verify-bible-export.py` permet de recommencer le rapprochement du fichier exporté. Le moteur utilisé est `@oai/artifact-tool`, avec inspection XML indépendante ; aucune exécution native dans Excel ou LibreOffice n’est revendiquée.

SHA-256 du classeur final : `b36c9c2970c2ea1def265f10856ad0f8663a810f4d5e4a5e4801c9e60b671e79`.

## Limites matérielles et publication

La dernière tentative Chromium dans ce même environnement, lors de la préparation 0.3, a échoué avant l’ouverture de page : `socket() Operation not permitted`. Aucun nouvel essai navigateur complet n’est revendiqué pour la 0.4. Le parcours optionnel `npm run test:browser` demeure disponible sur un poste autorisé. Le blocage ne devient pas un test réussi parce que le DOM modélisé passe.

Restent à vérifier dans un vrai navigateur : mise en page de bureau et mobile, clavier/focus/dialogues natifs, téléchargement et import réels, stockage, plein écran, son, tactile, cadence et essais humains. Les conséquences après MI03, les capacités spécialisées des châssis et les 29 missions restantes demeurent conçues.

La publication distante n’a pas été relancée après le refus automatique reçu pour `main` dans la tranche précédente. Le site Vercel lié et son adresse attribuée ne constituent pas un déploiement de cette version. Le pack local et les sorties de construction sont livrés séparément de cette autorisation.
