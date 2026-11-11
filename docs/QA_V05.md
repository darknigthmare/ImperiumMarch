# ORDRE DE CENDRE — Validation de la version 0.5

**11 novembre 2026 · version applicative 0.5.0 · sauvegarde v4**

La validation porte sur la quatrième mission de Vesper, son héritage, le premier composant endommageable, les migrations historiques, l’interface reliée à ces règles et les livrables. Elle distingue les commandes simulées, le DOM modélisé, le rendu Canvas et un navigateur réel. La présence d’un fichier ou d’une fiche ne vaut pas validation humaine de son usage.

## Résultats exécutés

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Simulation et campagne Node | **122 tests réussis**, zéro échec, zéro ignoré | [v05-node-tests.txt](validation/v05-node-tests.txt) |
| Interface en DOM modélisé | **21 parcours réussis**, script autonome réel | [v05-ui-runtime.txt](validation/v05-ui-runtime.txt) |
| Audit statique HTML/script | 128 IDs uniques, 116 références littérales, 5 vues, 4 onglets d’archives et 6 dialogues | [v05-static-ui.txt](validation/v05-static-ui.txt) |
| Construction autonome | Un fichier HTML, six modules intégrés, images/styles embarqués et aucune dépendance réseau du jeu | [v05-build.txt](validation/v05-build.txt) |
| Construction web | index, modules, styles et assets copiés dans web-dist | [v05-web-build.txt](validation/v05-web-build.txt) |
| Catalogue et livraison | Six châssis, trois opérations et quatre missions de campagne cohérents avec la bible | [v05-project-check.txt](validation/v05-project-check.txt) |
| Classeur exporté | 581 fiches, 4 004 cellules de source réconciliées, 126 formules sans erreur, 20 tables/validations/volets | [workbook-v0.5-export.json](validation/workbook-v0.5-export.json) |
| Rendu de jeu | Six images produites par le renderer, après des entrées publiques | [v05-render-manifest.json](previews/v05-render-manifest.json) |
| Navigateur local | **Non exécuté jusqu’à la page** : Chromium échoue au démarrage sur socket() Operation not permitted | [v05-browser-probe.json](validation/v05-browser-probe.json) |

Les empreintes de la source et des livrables figurent dans [v05-release-checks.json](validation/v05-release-checks.json). L’état de publication distante est distinct de ces contrôles locaux ; voir [DEPLOYMENT.md](DEPLOYMENT.md).

## Couverture du cœur de jeu

Les 89 tests précédents sont conservés et adaptés au catalogue de quatre missions. La 0.5 ajoute **33 tests** : treize MI04, cinq radiateur et quinze campagne v4. Les assertions de quantité du catalogue passent de six à sept scénarios, sans modifier la séparation entre les trois simulations et les missions officielles.

La matrice de pilotage atteint les extractions par `createGame`, `commandGame` et `updateGame`, sans placer directement le joueur à l’arrivée ni forcer une victoire :

| Scénario | Combinaisons de référence terminées |
| --- | --- |
| MI01 | 6 châssis × 2 routes × 2 décisions = 24 |
| MI02 | 6 châssis × 2 décisions = 12 |
| MI03 | 6 châssis × 2 décisions = 12 |
| MI04 | 6 châssis × 2 décisions = 12 |
| OP01, OP02, OP03 | 3 opérations × 6 châssis = 18 |
| **Total distinct de cette matrice** | **78** |

La campagne rejoue aussi les douze combinaisons MI04 avec un héritage historique et des checkpoints. Ce second passage valide la persistance ; il n’est pas ajouté comme douze combinaisons de châssis/décision nouvelles. D’autres tests couvrent des branches de perte et des réglages ciblés. Leurs durées sont des durées de simulation automatisée, pas une mesure du temps d’un joueur humain.

### Héritage et installations de MI04

Les contrôles portent sur des relations observables : une conduite encore rompue impose la pompe de cinq secondes ; une conduite préservée ou réparée donne immédiatement le liquide ; les ouvriers sauvés réduisent réellement la durée de chaque vanne de sept à quatre secondes. Quitter la portée pendant un travail annule sa progression. La pompe industrielle ne change pas l’état persistant de la conduite civile.

Un dispensaire vérifié, encore debout et joignable rend un appel possible. Le test vérifie aussi le cas où ce canal est disponible mais ignoré : aucun contact n’est attribué. Une vraie coupure lors de MI03 supprime cet accès dans MI04. Une chaîne pilotée MI02→MI03→MI04 conserve huit décès ferroviaires et l’absence d’aide aux vannes.

Le journal peut être détruit par des projectiles avant le relevé. Les ruines se constatent, puis décision et extraction restent accessibles sans PT01. Les textes n’affirment ni date de remplacement ni ordre militaire que Sera n’aurait pas lus. Le titre du dialogue reste neutre : « Le relevé de maintenance ».

Une copie acquise survit à la destruction ultérieure de l’original. La remise sous scellés et le constat joint au rapport conservent tous deux cette copie, tout en enregistrant une transmission différente. Le véhicule privé peut atteindre sa sortie vivant ; il disparaît des cibles actives sans donner les points d’une destruction. Les mêmes entrées et la même graine reproduisent les mêmes états.

Un contrôle thermique distinct compare la proximité des turbines, leur état refroidi et les dommages de radiateur. Il vérifie la chaleur locale et la disparition de sa source après manœuvre, au lieu de se limiter au libellé affiché.

### Composant et réparation

Les tests de collision emploient un projectile ennemi contrôlé comme stimulus unitaire. Son trajet, son premier contact et les dégâts sont résolus par la simulation. La santé du composant n’est pas affectée directement pour simuler un impact. Les six coques reçoivent un tir frontal, un tir arrière et un tir manqué : un projectile arrêté par la coque ne frappe pas le radiateur à travers elle.

Le contrôle de refroidissement place explicitement deux machines à une même température de calibration, puis mesure leur dissipation. Cette préparation est une condition de test thermique, pas une partie victorieuse. Le minimum de dissipation reste de 35 %.

La réparation demande quatre secondes, restaure au plus soixante points et consomme un kit uniquement à la fin. Marche, tir et nouvel impact annulent le travail sans dépenser ce kit. Le plein état ne consomme rien. Les appuis en mouvement empêchent le départ. Le stock est fini, le radiateur ne reçoit pas de soin automatique des caisses et le retour au hangar facture son entretien.

## Sauvegardes historiques et protection des dossiers

Les trois fixtures proviennent du code qui produisait effectivement leurs formats : v1 de la 0.2, v2 de la 0.3 et v3 de `c81a360` (0.4). La nouvelle fixture v3 atteint MI03 avant décision et après extraction en utilisant le pilote public de cette révision historique. Son empreinte est `22793763d19477737abf7193590f00863ce32fd2fc14b1a0a49b273c81180288`. Les fichiers v1/v2 ne sont pas réécrits.

Les migrations conservent ressources, décisions, rapports, usure historique, magasin, réserve déjà finie, roquettes, temps de recharge, graine, phase et état des travaux. Elles ajoutent seulement les champs de version manquants, documentés dans [CAMPAIGN_SAVE_V4.md](CAMPAIGN_SAVE_V4.md). La lecture ne remplace pas le fichier ancien ; la première écriture en conserve une copie.

Les contrôles portent sur l’import exact et le rejet de champs contradictoires : contact inventé, preuve sans journal, niveaux de composant hors limites, contexte différent du dossier officiel, stocks impossibles et progrès non autorisés. Ils vérifient une reprise au milieu d’une réparation, une défaite réelle sans quatrième récompense, la répétition d’une validation et les relectures sans dotation supplémentaire.

Les formats futurs inconnus, formats étrangers et dossiers trop volumineux demeurent protégés contre une écriture automatique, même lorsqu’une copie ancienne est lisible. Les échecs de stockage restent visibles et n’interdisent pas de poursuivre la session. Ces validations protègent la cohérence des sauvegardes et les incompatibilités ordinaires ; elles ne constituent pas un dispositif anti-triche.

## Les vingt et un parcours d’interface

Le test exécute le script livré dans `dist/Ordre_de_Cendre.html` avec ses vrais gestionnaires d’événements. Un petit DOM, le stockage, le temps et les appels Canvas sont modélisés. Les assertions suivent les missions, les choix, la navigation, les sauvegardes et le texte produit.

Les nouveaux parcours vérifient : MI04 verrouillée avant MI03 ; le briefing après migration d’un véritable dossier v3 ; les moyens hérités ; une vanne partiellement ouverte figée à la pause puis reprise exactement ; les deux choix jusqu’à la quatrième archive ; la fin de l’affectation Vesper ; le journal perdu et son résultat sans PT01 ; les relectures ; le radiateur affiché, T et son bouton, les kits, l’interruption et la reprise.

Le contrôle de l’interface de réparation utilise une flotte volontairement usée comme fixture unitaire, déclarée comme telle. Il ne prétend pas avoir obtenu cette usure dans une mission. Le rendu de réparation distinct, lui, est atteint à partir de tirs de véritables ennemis MI01.

Ces parcours ne mesurent pas le CSS, le focus natif, la perception des couleurs, le plein écran, le téléchargement réel, l’audio ou l’usage tactile physique. Le navigateur et les essais humains restent des vérifications séparées.

## Classeur et documents

Les **526 IDs précédents** sont conservés. Les cinquante-cinq ajouts concernent deux fiches de vision, huit systèmes, neuf règles narratives, cinq assets, huit tâches de production, quinze QA et huit fiches de prototype. Le classeur garde vingt domaines plus Synthèse.

La vérification réconcilie les 4 004 cellules de source, contrôle les 126 formules de synthèse, les vingt tables, les validations de statut, les règles conditionnelles et les volets. Une modification temporaire de statut est recalculée puis restaurée. Les rendus de Synthèse et des domaines modifiés sont inspectés. Ce contrôle utilise le moteur du classeur et l’inspection du fichier exporté ; il ne revendique pas une ouverture native dans Excel ou LibreOffice.

Le [contrat Vesper](VESPER_CONSEQUENCES_V05.md) approfondit les conséquences, la conservation des preuves, la limite des connaissances, les composants et la transition vers Nacre. Les châssis, armes, planètes, factions, faune, flore et missions finales du concept complet gardent leurs statuts réels. Une spécification détaillée n’est pas annoncée comme une fonctionnalité jouable.

## Rendus et relecture

Six fichiers sont produits par le renderer du jeu avec Skia : pompe locale, première vanne, appel radio, journal copié, poste détruit et réparation de radiateur. Les états de MI04 proviennent du dossier historique v3 migré. L’exemple du radiateur utilise des ennemis réels de MI01, des tirs et une commande de réparation, sans affectation de santé.

La relecture a corrigé des invitations à appuyer sur E pendant un travail déjà en cours, un libellé de pompe pouvant laisser croire que la conduite civile était réparée, et la conservation accidentelle de références mutables dans le manifeste. Celui-ci copie désormais profondément l’état au moment de chaque image. Ses étapes à mi-parcours restent donc vérifiables après la poursuite de la simulation.

Ces images sont des rendus Canvas de production, sans HUD HTML. Elles ne sont ni des concepts générés pour simuler un résultat, ni des captures de navigateur.

## Limites encore ouvertes

Une nouvelle tentative Chromium a échoué avant la création du serveur et avant toute navigation : `process_singleton_posix.cc:297`, `socket() failed: Operation not permitted (1)`. Aucun parcours de navigateur n’a donc réussi localement. Les tests humains de difficulté, de lisibilité, de fatigue, d’accessibilité, de contrôleur et de son restent à réaliser.

Le jeu livre quatre missions de campagne, six châssis et trois opérations indépendantes. Les vingt-huit missions principales restantes, les seize contrats, les capacités spécialisées des machines, les composants ennemis, les doctrines complètes d’escouade, les animations et le mixage définitifs restent à produire. La fuite d’un transport est un premier comportement de retrait, pas une doctrine complète.
