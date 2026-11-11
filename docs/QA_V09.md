# Validation de la version 0.9

La réception distingue les commandes publiques de simulation, les stimuli de collision isolés, le modèle de DOM, les rendus Canvas, le classeur et les actions observées dans Chrome. Aucun de ces contrôles ne constitue un essai humain sans guidage ou une certification sur matériel cible.

## Périmètre

La 0.9 ajoute **MI08 — La marée compte les absents**, le dossier v8, les commandes clavier reconfigurables, les entrées de manette standard en mission et les lots graphiques et audio. La campagne comprend huit missions de prototype, six châssis et trois opérations indépendantes. Les 24 autres missions principales, les seize contrats et la finition commerciale conservent leurs critères.

La réception est suivie dans le [registre des 133 exigences initiales](PRODUCTION_REGISTER_V09.md). Un nouveau fichier ou un nouveau test ne supprime pas le reste du critère d’origine.

## Contrôles locaux et intégration continue

Les résultats finaux sont inscrits après les suites exécutées sur sources figées. Les journaux de développement et les échecs corrigés restent distincts du résultat reçu. La CI utilise Node 22; les contrôles locaux de cette tranche utilisent Node v24.22.1.

| Contrôle | Portée et preuve attendue |
| --- | --- |
| Suite Node | **291/291 tests réussis**, zéro échec, ignoré ou todo. Simulation, migrations historiques, ressources, collisions, contrôles et intégrité des lots. |
| Interface | **57/57 parcours réussis**. Gestionnaires du bundle autonome dans un DOM modélisé; Canvas neutralisé. |
| Audit de campagne | **32 variantes, 8 915 sauvegardes/réimports, 8 915 restaurations exactes et 795 continuations déterministes**. Six châssis × trois conduites, dix avaries et quatre héritages sanitaires. Capture aux transitions physiques et au plus tous les deux secondes. |
| SVG / Canvas | **5/5 cas**, recouvrement de **98,28 % à 99,90 %** via `check:assets-render`, séparé des tests purs; dépendance de développement Canvas 0.1.100 explicitement installée dans la CI. |
| Interface statique et construction | **167 IDs, 156 références littérales, cinq vues, quatre onglets d’archives et six dialogues**. Bundle de neuf modules compilé, sans import ni ressource réseau résiduelle; construction web réussie. |
| Médias distribués | Contrôle strict réussi, **zéro média non répertorié** dans les sources, le web ou les inclusions inline; fichiers, tailles, empreintes et exclusions documentaires rapprochés. |

Le checker raster échoue explicitement si sa dépendance manque; il ne passe pas silencieusement en mode ignoré. Les tests Node purs ne dépendent pas d’un chemin du runtime de développement.

Preuves : [tests Node](validation/v09-node-tests.txt), [parcours d’interface](validation/v09-ui-runtime.txt), [audit de campagne](validation/v09-campaign-audit.json), [journal de l’audit](validation/v09-campaign-audit.txt), [raster](validation/v09-assets-render.txt), [contrôle statique](validation/v09-ui-static.txt), [catalogue](validation/v09-project-check.txt), [construction](validation/v09-build.txt) et [médias](validation/v09-media-audit.txt). Les empreintes de l’audit sont comparées avant et après les 32 variantes; une modification du cœur pendant son exécution rend le contrôle invalide.

Le [lot de contrôle du backlog](validation/v09-backlog-audit.json) ajoute seize tests à huit critères d’origine. Les parcours DOM complètent QA05 par une recharge partielle et une réserve épuisée conservées après changement de châssis, sélection d’une autre opération et réouverture. Ils complètent QA14/QA16 par les deux choix d’OP03, leur bilan, le stockage, les archives dans un nouveau contexte et le départ d’une autre opération avec un état neuf. La décision d’OP03 précède Cerbère : l’obéissance permet le retrait, la contestation impose le combat. Cette portée reste déclarée face au scénario historique. QA13 garde son manque de recensement des 47 familles; aucun nombre de personnes survivantes n’est inventé.

## MI08 et sauvegarde v8

La fixture historique v7 vient du snapshot public `0ae303a7b04d45472dc17154039ddc73760dc97a`, dont les 332 blobs ont été rapprochés de l’arbre publié. Elle comprend une scène sanitaire vivante et cinq bilans terminés : civil, impérial, remorquage, absence d’équipe sanitaire et pertes. Son SHA-256 est `8ca58deb11f4048039cda3a54157f7eddb2dd6af6a34450a3d177b3bdfa67a5c`.

Les fixtures v1 à v6 restent inchangées. La migration v7 ajoute seulement le dossier d’Aval encore vide et le numéro v8. Les anciens rapports, l’état de la flotte, les scènes sanitaires et le registre de carburant restent exacts. Une version future ou un ancien dossier contenant des champs de MI08 est refusé.

La validation de MI08 rapproche les comptes et les faits : identité et provenance, places et brancards, accord, opérateur, état naval, départ à la sortie du bassin, accostage, puis arrivée individuelle à la porte du refuge. Les anciens agrégats de population ne deviennent pas des identités historiques inventées. Les scènes vivantes conservent aussi marée, pression, travaux partiels, positions, santé et munitions.

La transmission ne produit ni carburant ni preuve globale supplémentaire. Le premier rapport donne sa dotation une seule fois; les relectures conservent les huit rapports officiels et les ressources. Une sortie perdue reste perdue après recharge et ne peut être effacée par un retour à une ancienne décision.

### Défauts corrigés pendant la réception

- Une personne arrivant à son accueil pouvait garder un résidu de position à virgule flottante. L’arrivée fixe maintenant sa position exactement à la porte.
- La première frame d’accostage conservait le drapeau de mouvement du bateau. La coque est maintenant immobile dans la frame où son arrivée devient vraie; cette frame est exportée et restaurée dans le test dédié.
- L’ouverture d’une décision par une entrée clavier avançait l’horloge avant la mise à jour des lectures de courant. Ces lectures sont synchronisées avant la suspension.
- Les deux bateaux pouvaient se superposer à l’attente et aux débarcadères. Ils gardent une séparation dans le bassin et des positions d’accostage distinctes.
- La correction des aides de touches remplace les touches d’origine une seule fois, évitant les substitutions en cascade et les altérations d’apostrophes françaises.
- La réception native a montré que la frontière de mot ASCII transformait « Départ » en « D / →épart ». Les limites Unicode protègent maintenant lettres accentuées, marques combinantes, nombres et apostrophes ; un test reproduit le message radio concerné.
- Après transmission effective, l’invite près du registre gardait son message d’attente. Elle affiche désormais « Bilan transmis à Holt · rejoindre la sortie ». Le test couvre attente, disponibilité, travail partiel et transmission pour les trois conduites.
- Les messages de pression, de portes, d’embarquement, de départ et d’arrivée sont reçus par la radio; les messages critiques restent prioritaires.
- Une touche Entrée assignée au plein écran conserve l’activation native des boutons. Une manette tenue en arrière-plan ne relance pas une mission suspendue.
- Le convoi OP02 et le camion de MI01 étaient exclus des tirs du joueur, des explosions et du piétinement. Ils utilisent maintenant les impacts balayés des deux camps, un effet de zone borné et les contacts réels. Le convoyeur attend derrière la cible d’un pied en descente; il ne reçoit aucune immunité ni soin supplémentaire. Un signal explicite annonce les dégâts alliés.

Les vérifications détaillées sont dans les tests MI08, campaign-v8, controls et UI runtime, avec des portées explicites.

## Graphismes et audio

Le lot contient **354 fichiers** : 287 SVG, six rigs JSON, cinq planches PNG et 56 WAV. Les cinq comparaisons raster rapprochent la géométrie SVG et Canvas commune, avec un seuil de recouvrement de 92 %. Les résultats obtenus doivent être conservés dans le journal final.

Les 56 WAV comprennent 44 signaux, huit ambiances, trois motifs et un montage de 36 secondes. Le moteur synthétise les familles d’événements sans charger de WAV dans le HTML autonome. Les tests contrôlent activation, silence avant geste utilisateur, volume, pause, voix bornées, nettoyage et correspondance d’événements. Ils ne prouvent pas une écoute humaine, une interprétation vocale ou un mix final.

Les aperçus MI08 sont des rendus Canvas de scènes atteintes par commandes publiques. Le manifeste conserve les scènes complètes et les empreintes. Le renderer doit laisser chaque scène inchangée. Ces images sont distinctes des captures natives de navigateur.

## Classeur

Le classeur final de la 0.9 contient **816 fiches et 5 527 cellules source**, conserve les 769 IDs de la 0.8 et ajoute 47 fiches. Les 21 onglets comprennent vingt tables filtrables, vingt validations de statut, quatre-vingts règles conditionnelles, vingt volets et 126 formules. Les statuts finaux sont 287 « Conçu », 310 « Prototype », 83 « À produire » et 136 « Vérifié » ; ces nombres portent sur des fiches et ne mesurent pas un pourcentage de jeu terminé.

La réception finale rapproche le JSON, le XML du classeur, les formules calculées, les références et les baselines historiques. **37 vues ciblées** ont été relues visuellement et rapprochées des plages, hauteurs et colonnes du fichier final. Le SHA-256 du XLSX est `af5c84c1a1efc9d78300f3443d0097fca0027596385db97358d97c7e6bdcf701` ; celui du JSON source est `fd20c64cec042c3dbbdb866146ab22c5b6a1235d4f78e30db1ec19d6c03251f2`.

Le recalcul indépendant utilise LibreOffice en mode headless sur une copie dont les **126 caches de formule ont été effacés**. Les 126 résultats sont recalculés ; les 5 527 cellules source et toutes les valeurs comparées restent identiques, sans cellule d’erreur. L’original conserve son empreinte. Le reçu déclare les normalisations de syntaxe des formules dans la copie. Ce contrôle ne valide pas l’usage interactif des filtres et volets : QA29 reste ouverte.

Preuves : [export final](validation/workbook-v0.9-export.json), [réception visuelle finale](validation/workbook-v0.9-visual-review.json), [recalcul LibreOffice](validation/workbook-v0.9-libreoffice.json) et [comparaison des baselines](validation/workbook-v0.9-baseline-check.json). Les reçus du premier export sont conservés séparément.

## Navigateur réel

Le lancement Chromium automatisé local a échoué avant navigation : le runtime refuse la création du socket et le traçage nécessaires au processus. Ce résultat ne constitue pas un échec du jeu et n’est pas compté comme un test navigateur réussi. L’ouverture `file:` est également refusée par la politique du navigateur partagé. Aucun contournement n’est utilisé.

Le parcours natif a été effectué sur la publication HTTPS, dans Chrome partagé sous Linux. Le dossier v7 réellement présent avant mise à jour est conservé dans [v09-browser-migration-before.json](validation/v09-browser-migration-before.json), avec ses sept rapports, 34 pièces, zéro carburant en réserve et deux lots consommés. L’export v8 correspond exactement à la migration attendue ; seuls le numéro de version et le volet d’Aval vide sont ajoutés.

Les points préparés pour MI02 et MI08 sont produits par [prepare-browser-v09.mjs](../tools/prepare-browser-v09.mjs), à partir des fixtures historiques ou de cet export réel. Leur [manifeste](validation/v09-browser-input-manifest.json) les désigne explicitement comme entrées Node. Ils ne deviennent des preuves de navigateur qu’après les actions, exports et observations réellement consignés.

Le [rapport natif](validation/v09-browser.json) et l’[audit des exports](validation/v09-browser-export-audit.json) conservent les entrées, sorties, images, empreintes et portées. Le bureau mesure 1 363 × 1 023 pixels ; la page 1 363 × 936, avec 1 348 pixels CSS disponibles quand sa barre de défilement est présente. Le zoom natif à 125 % et 150 % donne respectivement 1 078 × 749 et 899 × 624 pixels CSS. Les boutons du briefing restent atteignables par Tab, avec défilement et focus visibles. Une petite fenêtre native redimensionnée séparément n’a pas été reçue.

| Parcours natif | Résultat et limite |
| --- | --- |
| MI01 | Briefing, Tab/Entrée, déplacement, trois tirs, pause, retour, recharge et reprise observés. Le checkpoint est strictement identique après reload ; seule la révision du dossier passe de 8 à 10. Les conséquences au hangar et le rapport terminé sont consultés depuis un dossier historique préparé. |
| Dossier portable | Import avec confirmation, export, réimport de cet export et rejet explicite du JSON invalide. Les exports valides et le dossier après rejet sont identiques octet pour octet ; aucune récompense n’est ajoutée. |
| MI02 | Déblocage et briefing depuis MI01, lancement et marche ; import déclaré d’un point de poursuite, pilotage, reload et freinage natif. Le checkpoint reste exact, puis le train est effectivement arrêté. Les deux rapports et leurs relectures sont consultés depuis le dossier historique terminé ; ce n’est pas une nouvelle partie intégrale de MI02. |
| Commandes | Conflit E refusé pour Avancer ; Échap annule la capture ; K est conservée après recharge ; les valeurs par défaut sont rétablies. Tab, Maj+Tab, Entrée et Échap sont observés dans les parcours nommés. |
| MI08 | Continuation depuis le point préparé de porte partielle : ouverture, 34 départs, fermeture, 34 arrivées individuelles, deux accueils locaux, transmission et extraction. Quatre patients au refuge, deux bateaux arrivés et aucune perte ; l’absence de perte n’implique pas l’absence de dommage matériel. Aucun nouvel import entre ce point et le premier résultat. |
| Persistance finale | Les sept anciens rapports sont exacts ; les pièces passent de 34 à 38 une seule fois, le carburant reste à zéro et les deux lots consommés restent consignés. Les exports du dossier achevé avant et après reload sont identiques octet pour octet. |
| Archives | Huit rapports visibles et 36 lignes individuelles d’Aval, avec personnes, destination, trajet et accord. Mara Eren et les quatre patients restent identifiables. Le [panneau sanitaire développé](validation/v09-browser-sanitary-panel.json) comporte sept lignes séparant examen, cargaison, balise, journal, origine à recouper, accord d’un témoin et transmission à Mara. |
| Console | 272 avertissements/erreurs capturés, tous issus du script d’extension du navigateur ; aucune entrée de l’application dans cette collecte de limite 5 000. |

La porte partielle conservée était ouverte à 77,291666… %, mais le travail avait déjà été interrompu avant l’export (`working=false`, `progress=0`). Ce contrôle prouve la conservation de la position physique, pas une manœuvre encore active. La reprise des travaux actifs reste couverte séparément par les tests de simulation.

### Contrôles natifs encore ouverts

**QA19 n’est pas validée.** Lors d’un clic vers un autre onglet en maintenant D, puis d’un second essai vers la barre d’adresse, aucune pause n’a été constatée et la marche a continué jusqu’à l’extraction. Les gardes `blur`, `visibilitychange` et `document.hasFocus` existent dans le code livré ; la cause entre application et environnement d’entrée géré reste à établir. L’erreur de la façade DOM protégée sur `document.hasFocus` ne renseigne pas sur son état réel. Aucun correctif spéculatif ni réussite humaine n’est inventé.

**QA20 reste ouverte** pour la petite fenêtre native, malgré les vues larges et le zoom reçus. **QA29 reste ouverte** pour l’usage interactif de Calc/Excel. Les deux corrections de texte issues du parcours natif sont rattachées à leurs tests et à la publication suivante. Les résultats des versions antérieures conservent leur version historique.

## Limites

La manette physique, l’écoute du son, la compréhension spontanée, l’accessibilité avec les utilisateurs concernés et les performances sur matériel cible demandent encore leurs observations. Les protocoles vierges ne contiennent aucun participant inventé. La provenance technique des médias ne remplace pas une revue commerciale ou juridique.
