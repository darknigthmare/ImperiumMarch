# ORDRE DE CENDRE — Validation de la version 0.6

**11 novembre 2026 · application 0.6.0 · sauvegarde v5**

La cinquième mission ouvre Nacre après les quatre rapports de Vesper. La validation distingue les parcours simulés, le DOM modélisé, le renderer Canvas, le classeur exporté et le navigateur réel. Les essais humains de difficulté, de son et d'accessibilité restent ouverts.

## Contrôles reproductibles

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Simulation et dossiers | **145 tests réussis**, zéro échec et zéro ignoré | [v06-node-tests.txt](validation/v06-node-tests.txt) |
| Interface exécutée dans un DOM modélisé | **26 parcours réussis**, script autonome réel | [v06-ui-runtime.txt](validation/v06-ui-runtime.txt) |
| Cohérence statique de l'interface | 136 IDs uniques, 125 références littérales, 5 vues, 4 onglets d'archives, 6 dialogues | [v06-static-ui.txt](validation/v06-static-ui.txt) |
| Construction autonome | HTML avec six modules intégrés et ressources embarquées | [v06-build.txt](validation/v06-build.txt) |
| Construction web | Page, modules, styles et assets dans `web-dist` | [v06-web-build.txt](validation/v06-web-build.txt) |
| Catalogue | 643 fiches, six châssis, trois opérations, cinq missions de campagne | [v06-project-check.txt](validation/v06-project-check.txt) |
| Classeur | 643 fiches, 4 409 cellules de source réconciliées, 581 IDs antérieurs conservés, 126 formules recalculées | [workbook-v0.6-export.json](validation/workbook-v0.6-export.json) |
| Scènes de Nacre | Cinq rendus Canvas issus d'entrées publiques, états copiés profondément | [mi05-render-manifest.json](previews/mi05-render-manifest.json) |

Les commandes locales utilisent Node.js 24.22.1 ; le projet cible explicitement Node.js 22.x pour Vercel et la CI. Le résultat de la CI distante doit être lu séparément dans le reçu de publication.

## MI05 : règles observées

Les seize tests de `tests/mi05-mission.test.mjs` comprennent douze extractions par les commandes publiques : six châssis et deux décisions. Le pilote ne téléporte pas la machine et ne force pas une victoire. Les vingt-trois tests ajoutés à la 0.5 comprennent également sept tests de campagne v5. Les 122 tests antérieurs restent présents, avec leurs assertions de catalogue et de migration adaptées.

La marée alterne basse mer, montée, pleine eau et descente sur un cycle de 72 secondes. Les tests suivent les seuils distincts de marche et de navigation. Le contact des pieds avec la vase et l'eau produit une pénalité réelle ; le test unitaire de ce contact utilise explicitement une fixture physique, sans la présenter comme une partie complète. Un tir reçu par un pied déjà usé sous le plancher historique de 15 points ne peut plus remonter sa santé : le test provoque d'abord cette usure par l'eau, puis fait passer un projectile ennemi de calibration par les collisions de production. Le plancher des anciennes missions reste vérifié séparément. Les passerelles demandent quatre secondes, sont interrompues si l'on s'éloigne et sécurisent durablement leur banc.

Les treuils peuvent être libérés par intervention ou détruits avec des tirs ciblés. Leurs collisions sont distinctes de celles des barges. Le bateau avance seulement après libération des deux câbles et avec suffisamment d'eau. Son arrivée correspond au débarquement de douze passagers. Il cesse alors de recevoir des dégâts. Sa destruction avant arrivée produit douze décès et zéro passage ; la mission permet un rapport de cet échec sans inventer de survivants.

Saisie contient une facture locale de trafic. Rive-Courte permet une liaison réellement effectuée avec Vann Ostre, passeur PN08. Une destruction avant l'inspection empêche de récupérer le document ou le contact. Le constat d'une épave reste possible. Une copie et un contact déjà obtenus persistent après la perte de leur source, tandis que les quatre occupants de Rive-Courte restent exposés jusqu'à leur destruction éventuelle. Les deux choix de rapport conservent ces faits ; aucune nouvelle preuve PALINODE n'est attribuée.

Le dépôt fournit deux lots de carburant s'il est préservé et effectivement prélevé. Les tests couvrent le dépôt détruit, laissé volontairement, récupéré et sollicité une seconde fois. Les pertes de bateau ou d'équipage ne sont pas converties en carburant. La consommation de ce stock dans MI06 reste à produire.

Le temps et l'état de marée restent identiques après sauvegarde puis reprise, y compris pendant une passerelle ou le déplacement du bateau. Le calcul de marée est actualisé sur le dernier pas ouvrant une décision, puis gelé pendant la lecture. Un import qui prétend qu'un bateau est simultanément arrivé et détruit est rejeté.

## Dossier v5 et continuité

La fixture `campaign-v4-mi04.json` est produite avec le code historique **d7d76b61ee9e97e27c611e06905f32f70633cb8e**, avant l'ajout de Nacre. Elle contient un point vivant de MI04 et le dossier après extraction. Les fixtures v1, v2 et v3 restent inchangées. La migration v4 conserve les checkpoints et les quatre rapports, puis ajoute seulement `resources.fuel: 0` et un dossier Nacre non visité.

MI05 exige le premier rapport MI04, avec ou sans journal PT01. Les tests vérifient les six châssis, les deux choix, les faits ferroviaires hérités, la quantité exacte de carburant et l'attribution unique des pièces d'atelier. Une relecture ne remplace pas le premier dossier et n'ajoute aucune ressource. Le maximum théorique sans dépense est de 26 lots d'atelier, distincts des deux lots de carburant possibles.

Le validateur contrôle identités, positions des objets fixes, phases, horloge de marée, populations, pertes, quantités, preuves, contexte et cohérence entre le reçu final et le monde persistant. Les versions futures inconnues restent protégées contre l'écrasement automatique ; lire une sauvegarde ancienne ne la réécrit pas. Ces contrôles concernent la cohérence et les migrations ordinaires, pas la lutte contre la triche.

Une relecture indépendante a sérialisé régulièrement huit routes : passage normal, facture perdue, passeur perdu, bateau perdu, dépôt détruit, dépôt laissé, treuils détruits au canon et bancs traversés sans passerelles. Toutes ont produit un dossier sérialisable jusqu'au rapport final. Cette relecture complète la suite reproductible, sans augmenter artificiellement son nombre de tests.

## Interface et rendu

Les cinq parcours ajoutés au DOM modélisé suivent l'import d'un véritable dossier v4, le déblocage de Nacre, son briefing, la marée et une passerelle partielle figées à la pause puis reprises, les deux décisions jusqu'au débrief et aux archives, ainsi que la perte du bateau sans carburant. Les parcours précédents gardent la navigation, l'atelier, les migrations et les relectures.

Ces tests exécutent les gestionnaires de l'application, mais neutralisent Canvas et modélisent stockage et temps. Ils ne valident ni CSS, ni dialogue de fichier natif, ni son. Le HUD HTML affiche l'instrument de marée dans le navigateur. Le renderer y reçoit `tideInstrument:false` pour ne pas superposer un second instrument aux munitions. Le prompt contextuel est affiché par le HUD HTML, juste au-dessus de la hauteur réelle des instruments, et le renderer reçoit `interactionPrompt:false`. Cette disposition corrige un chevauchement de la consigne Canvas avec la jauge de coque constaté dans Chrome. Les rendus Canvas seuls conservent leurs deux indications par défaut.

Les cinq scènes livrées montrent une passerelle, une facture, la liaison avec le passeur, les réfugiés et une épave. Elles sont calculées par le renderer de production. Elles ne constituent pas des captures de navigateur.

## Navigateur et publication

Le 11 novembre 2026, Chrome partagé a ouvert le domaine de production `https://imperium-march.vercel.app/` avec la première publication complète, **c8f1a4d / application 0.5.0**. Le contrôle a sélectionné Pèlerin dans le hangar, lancé MI01, envoyé une commande de marche, mis la sortie en pause, rechargé la page et repris le point conservé. La scène et le HUD ont été inspectés. Ce parcours prouve l'ouverture du jeu et sa reprise dans cet environnement ; il ne valide pas encore MI05.

Le Chromium local échoue avant toute navigation sur `socket() Operation not permitted`. Le navigateur partagé autorisé fournit un environnement distinct. Sur la publication 0.6 `9e4a9671`, Chrome a affiché les cinq missions et VERSION 0.6, importé via le sélecteur de fichier le véritable dossier v4 terminé, confirmé les quatre rapports préservés, puis débloqué et lancé MI05. Le briefing reprend le journal conservé et les survivants du train. La scène Nacre, les six appuis du Pèlerin, le bateau, les objectifs et l'instrument HTML de marée sont présents. Une commande de marche puis la pause ont été exécutées. Un prompt Canvas chevauchait la jauge de coque ; sa correction de placement dans le HUD HTML fait l'objet du contrôle de reprise suivant.

Le [suivi du déploiement](DEPLOYMENT.md) relie publication GitHub, SHA déployé, construction Vercel et contrôles de ressources. Un état READY ne suffit pas à démontrer un parcours jouable.

## Limites de cette livraison

La tranche jouable compte cinq missions officielles, trois opérations indépendantes et six châssis. Les 27 autres missions principales, les seize contrats, les capacités spécialisées finales, les composants ennemis, les doctrines d'escouade, le son et les animations définitives restent à produire. MI06–MI08 disposent de contrats détaillés de conception. Aucun test automatisé n'établit la qualité de la difficulté pour un joueur, la performance sur un appareil cible ou la conformité d'accessibilité.
