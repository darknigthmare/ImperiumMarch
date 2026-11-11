# Validation 0.11 — Le champ que personne n’a semé

La réception porte sur le prototype MI01–MI10, les six châssis et les trois opérations indépendantes. Chaque preuve précise son environnement : moteur sans DOM, script d’interface en DOM modélisé, Canvas, classeur ou navigateur natif. Une vérification automatique ne vaut pas réception humaine.

## État des contrôles

Les [contrôles locaux finaux](validation/v11-local-validation.json) passent sur les sources gelées, sans modification d’un fichier d’entrée pendant leur exécution. Le runtime local est Node **24.22.1** ; la configuration du projet et de la CI reste **22.x**. Le résultat de la CI distante est suivi séparément dans [DEPLOYMENT.md](DEPLOYMENT.md). La réception native de MI10 reste à consigner après publication de ce snapshot.

| Famille | Résultat déjà exécuté | Portée |
| --- | --- | --- |
| Suite Node globale | **440 tests réussis**, zéro échec, annulé, ignoré ou à faire. | Règles, contenu, sauvegardes, collisions, graphisme et régressions des missions précédentes. |
| Simulation MI10 | 34 tests ciblés ; douze parcours, six châssis × deux conduites ; 828 contrôles de matière. | Opérations, délais, appuis, collisions, volumes, pollution, pertes, PT02 et extraction. |
| Dossiers de campagne | **193 tests**, dont 47 nouveaux MI10 et 146 régressions. | Migrations historiques, reprises exactes, reçus physiques, chronologie, falsifications et attribution unique. |
| Régressions ciblées du moteur | 56 tests des suites partagées et MI09. | Conservation des comportements concernés par l’intégration du nouveau domaine. |
| Script UI autonome | 71 parcours dans un DOM modélisé. | Migration, briefing, reprise, pause, choix, fin, archives, atelier et rejeu, avec les parcours des versions précédentes. |
| Audit UI statique | 181 IDs uniques, 170 références littérales, cinq vues, quatre onglets d’archives et six dialogues. | Références résolues et script autonome compilable ; aucune requête de ressource non intégrée. |
| Géométrie SVG/Canvas | 64 comparaisons réussies. | Les quarante cas précédents et les vingt-quatre états du champ chimique, au seuil de recouvrement conservé de 92 %. |
| Scènes MI10 | 22 images, dix-sept sorties complètes et quatre exports de campagne. | États atteints par commandes publiques, captures profondes, validation des scènes et renderer sans mutation. |

Les tests de simulation, de campagne, de régression et de graphisme font partie des 440 tests ; ces sous-totaux ne doivent pas être additionnés comme des tests distincts. Le [journal global](validation/v11-node-tests.json) conserve sa sortie et ses empreintes. Les [71 parcours UI](validation/v11-ui-validation.json) exécutent le script effectivement inclus dans l’HTML autonome. Ils ont été reçus après gel, puis réutilisés dans l’agrégat après comparaison exacte des sources, du script de test et du bundle reconstruit. Ils ne valident ni le CSS, ni un dialogue système, ni les pertes de focus d’une fenêtre réelle.

La [comparaison raster](validation/v11-raster-validation.json) passe 64 cas sur 64. L’[audit de distribution](validation/v11-media-audit.txt) rapproche **414 médias sources et 414 copies web**, sans média non identifié ni build en attente. Le jeu demande trois fichiers image ; ses formes sont dessinées en code et ses sons sont synthétisés. Ces contrôles ne constituent pas une réception d’écoute ou de performance.

## Simulation et conséquences

Le [reçu de simulation](previews/mi10-simulation-validation.json) conserve le TAP, les empreintes de sources et les résultats des douze parcours. Les commandes publiques déplacent les six châssis, opèrent le collecteur, relèvent les cuves, confinent la fuite, protègent le prélèvement, traitent les cuves, couvrent les canaux, remettent en eau et rejoignent la sortie.

La matière reste répartie entre volumes des cuves, cinq unités prélevées, fuite en attente et nappes. Une nappe atteint réellement le bassin ou l’aval ; la fermeture du collecteur ne téléporte aucune matière. La destruction ou l’ouverture de la vanne n’efface pas ce qui est déjà retenu. La pollution acquise ne disparaît pas après pontage ou remise en eau.

Les variantes négatives vérifient notamment la destruction de la source avant collecte, la perte du préleveur pendant son travail, la perte du registre avant copie, la destruction des originaux après collecte, la rupture d’un canal et l’écoulement après transmission. Un événement acquis reste inscrit. PT02 exige les trois marquages, le registre et le prélèvement ; aucun récit ni choix ne remplace ces conditions.

Le village distingue circulation d’eau, état des deux canaux et habitabilité des deux bâtiments. La perte d’un habitat peut compromettre l’habitabilité même si l’eau circule encore. Les libellés ont été relus pour conserver cette distinction. Aucun nombre de personnes présentes ou transférées n’est créé dans cette mission.

## Dossier v10 et provenance historique

La fixture [campaign-v9-mi09.json](../tests/fixtures/campaign-v9-mi09.json) provient des exports natifs de la 0.10 publique. L’[attestation historique](validation/v011-historic-v9.json) indique leurs empreintes et leur parent public. Les anciennes fixtures v1–v8 restent intactes ; elles ne sont pas recréées depuis les modules de la 0.11.

La migration ajoute le domaine chimique non visité et le numéro de version, en conservant les neuf rapports, les scènes antérieures, la flotte, les ressources et l’ancien marqueur `stage`. La progression déduit MI10 du premier rapport manquant. La première réussite ajoute quatre lots ; une relecture conserve le premier rapport et ne redonne rien. Un dossier sans dépense peut ainsi passer de 42 à 46 lots après MI10.

Le [contrat du format v10](CAMPAIGN_SAVE_V10.md) détaille les vérifications de scènes et de reçus. Le bilan de matière doit aussi être compatible avec les temps de fuite et d’arrivée, les opérations enregistrées et les pertes irréversibles. Une sauvegarde syntaxiquement valide ne suffit pas à établir ces faits physiques.

Le [reçu de campagne](validation/v011-campaign-validation.json) réunit les 193 tests. Le [contrôle indépendant des états réels](validation/v011-chemical-state-crosscheck.json) accepte onze variantes et 1 530 checkpoints avec le même validateur : dix variantes atteignent l’extraction ; celle d’épuisement de source est volontairement observée encore en cours à 202 secondes simulées. Cette vérification ne crée pas onze parties natives ni 1 530 tests Node supplémentaires.

## Images et réception visuelle

Les vingt-deux images du [manifeste](previews/mi10-scenes.json) sont des rendus du renderer livré à partir d’états de simulation copiés au moment précis de la capture. Le [reçu Canvas](previews/mi10-canvas-validation.json) vérifie leur indépendance après continuation, l’absence de mutation par le dessin et la relecture des exports. La [revue visuelle](validation/v11-canvas-visual-review.json) couvre les vingt-deux compositions en planches, cinq images à leur taille entière et les deux planches d’assets. Les six vues de châssis suivent leurs vrais pieds ; elles ne remplacent pas les tests de collision.

La scène de pontage montre un travail réellement en cours et conserve les contacts ou dommages antérieurs. Sa légende ne prétend pas établir que ce parcours particulier a couvert le canal avant tout appui. La capacité de couverture depuis l’amont fait l’objet de contrôles séparés dans la simulation.

Le [lot graphique](../assets/chemical/README.md) comprend six composants, vingt-quatre SVG et deux planches. Les formes viennent de `src/chemical-assets.mjs` et sont partagées avec le renderer. Les 64 comparaisons raster confrontent exports SVG et Canvas à taille égale ; elles ne constituent pas une validation artistique finale.

## Classeur et préservation

La [réception d’export](validation/workbook-v0.11-export.json) rapproche **873 fiches, 5 897 cellules source, 21 feuilles et 20 tables**. Les **845 identifiants** historiques sont conservés ; 28 fiches sont ajoutées. Les compteurs sont 281 Conçu, 351 Prototype, 86 À produire et 155 Vérifié. Ils décrivent des statuts de fiches et ne représentent pas un pourcentage du jeu achevé.

Le [recalcul indépendant](validation/workbook-v0.11-libreoffice.json) emploie LibreOfficeDev 26.8.0.0.alpha0 sans interface. Les 126 caches ont été retirés d’une copie jetable, puis les 126 résultats ont été recalculés sans erreur ni différence ; le classeur livré est resté intact. La [revue visuelle](validation/workbook-v0.11-visual-review.json) couvre 43 vues. Deux sous-titres restés en 0.10 ont été corrigés et leurs vues relues ; les 41 autres images finales correspondent aux images déjà examinées.

La [préservation](validation/workbook-v0.11-baseline-check.json) compare 6 520 cellules non modifiées, 830 anciennes fiches intégralement inchangées, les styles et 426 fichiers historiques. Le [registre structuré](validation/production-v011-registry.json) conserve les 133 critères initiaux et leurs reçus ; les cinq réceptions additives ne modifient aucun de leurs statuts : 36 Prototype, 16 Vérifié et 81 À produire. QA29 ne se déduit pas de ce recalcul sans interface.

## Navigateur natif

Avant toute migration, le dossier présent dans Chrome a été exporté par l’interface réelle. Le fichier [native-v9-baseline.json](validation/native-v11/native-v9-baseline.json) contient neuf rapports et 42 lots ; il est conservé avec la [capture](validation/native-v11/before-migration.png) et l’[état accessible](validation/native-v11/before-migration.txt). Cette préservation ne vaut pas réception de MI10.

La vérification native de la 0.11 reste à consigner après publication du snapshot validé. Les checkpoints préparés par le pilote Node seront identifiés séparément des gestes exécutés dans Chrome. Aucun parcours humain complet, aucune manette physique et aucune écoute audio ne sont revendiqués par les preuves automatiques ci-dessus.

## Critères ouverts

**QA19 reste ouverte** : les observations précédentes de perte de focus diffèrent selon l’instance Chrome ; leur cause n’est pas établie et le tir maintenu n’a pas reçu sa réception native. **QA20 reste partielle** : le zoom d’une fenêtre ne prouve pas le comportement d’une petite fenêtre native mesurée. **QA29 reste ouverte** : un export et un recalcul sans interface ne remplacent pas tri, filtres, défilement et modification dans Excel ou Calc.

Le [protocole humain MI10](PLAYTEST_CHEMICAL_V11.md) possède un [formulaire non exécuté](validation/human-mi10-session-template-v11.json). PR88 et QA179 demeurent À produire. Les autres critères historiques et leurs exigences sont conservés dans le [registre 0.11](PRODUCTION_REGISTER_V11.md).
