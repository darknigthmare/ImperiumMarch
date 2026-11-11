# ORDRE DE CENDRE — Tranche de production 0.5

**Version 0.5.0 · 11 novembre 2026**

La 0.5 ferme le premier bloc de Vesper au stade prototype. MI04 utilise les conséquences de ses trois missions précédentes, permet d’acquérir une première anomalie technique et conserve une issue jouable lorsque sa source est détruite. Elle ajoute également un radiateur endommageable et une réparation de terrain avec des kits finis. Les [règles de MI04](CAMPAIGN_MISSION_04.md), la [matrice des conséquences](VESPER_CONSEQUENCES_V05.md) et le [rapport QA](QA_V05.md) détaillent la portée de cette tranche.

## Portée jouable

| Domaine | Livré au stade prototype | Travaux distincts encore ouverts |
| --- | --- | --- |
| Campagne | MI01–MI04 se débloquent dans l’ordre avec briefing, reprise, choix, extraction et premier rapport. | MI05–MI32, seize contrats, défection et quatre familles de fins. |
| Installation de MI04 | Deux turbines, pompe héritée ou portable, pression thermique et poste de maintenance destructible. | Plomberie physique, destruction des turbines, foule de techniciens et habillage final. |
| Conséquences | La conduite change la pompe, les ouvriers sauvés raccourcissent les vannes, le dispensaire ouvre un contact à activer. | Retours interplanétaires, réputation générale, alliances et effets économiques des quartiers. |
| PT01 | Journal copié si sa source survit à l’inspection; copie conservée après destruction et résultat sans preuve possible. | Source alternative PT03, chaîne politique, dépôt auprès de tiers et diffusion publique. |
| Avarie | Radiateur joueur touché localement, refroidissement réduit, commande T et deux kits par nouvelle sortie. | Composant équivalent sur un ennemi, pannes combinées, modules remplaçables et animation finale. |
| Dossier | Format v4 et migrations des trois formats historiques, nouveaux états et entretien du radiateur. | Synchronisation en ligne et formats futurs inconnus. |
| Flotte et opérations | Six châssis conservés; trois opérations autonomes et munitions finies. | Six autres châssis, armements et modules du catalogue complet. |

## Héritages consommés dans MI04

La pompe de MI04 peut utiliser le circuit existant si la conduite de MI01 est intacte ou réparée et que les services sont rétablis. À défaut, le joueur doit déployer la pompe portable en cinq secondes. Réparer la conduite change l’état courant de Vesper; le premier rapport de MI01 conserve l’incident historique.

Les ouvriers sauvés dans MI02 ont une utilité liée à leur métier. Si au moins un d’entre eux a survécu à l’évacuation, il peut guider depuis un poste sûr et chaque vanne prend quatre secondes au lieu de sept. Il ne devient pas automatiquement un équipier permanent, et les pertes du train ne sont pas annulées.

Le canal du dispensaire préservé dans MI03 permet un échange optionnel de trois secondes. Le rapport distingue un canal disponible d’un contact réellement établi. L’échange donne un constat local de présence privée avant l’alarme. Il ne fournit pas le journal de maintenance et ne dévoile pas la structure politique du programme.

## La première anomalie technique

Après refroidissement, l’inspection du poste vivant copie le journal PT01. Il constate un remplacement antérieur à l’incident sur ordre militaire. Cette contradiction suffit à nourrir le soupçon de Tess, sans révéler tous les décideurs ni toute l’intention de PALINODE.

Le poste reçoit les tirs et explosions. Le détruire avant lecture ferme la copie, mais laisse une inspection des ruines et une extraction possibles. Le dossier conserve alors le besoin d’une autre source. Détruire le poste après lecture n’efface pas la copie déjà sortie de l’installation. Le choix de compte rendu détermine ce qui est joint au rapport; la copie acquise demeure dans les deux branches.

Les scènes de remplacement documentaire restent conçues. La 0.5 enregistre leur nécessité sans attribuer d’avance PT03 ni inventer une personne qui aurait témoigné hors scène.

## Un composant et un coût de réparation

Le radiateur possède une intégrité de cent points. Sa zone arrière est évaluée par les collisions de projectiles. Son facteur de refroidissement vaut 0,35 + 0,65 × intégrité/100. Une avarie rend les pauses de tir plus nécessaires et peut amplifier la pression thermique près d’une turbine active.

T lance une réparation de quatre secondes immobile. À l’achèvement, un kit rend jusqu’à soixante points, avec un plafond de cent. Tirer, bouger ou subir un nouveau dommage interrompt le travail et remet sa progression à zéro; le kit n’est pas consommé. Une nouvelle sortie donne deux kits, une reprise conserve ceux qui restent. Les caisses de munitions ne restaurent ni le radiateur ni ces kits.

Le hangar répare le composant dans le cadre de l’entretien de la flotte. Son devis intègre coque, moyenne des appuis et radiateur, avec un plafond de six lots; un radiateur seul endommagé coûte au moins un lot. L’intégrité persiste à la sortie officielle suivante. Les lots de campagne restent limités aux dotations et aux dépenses enregistrées. Les quatre premières réussites attribuent au total seize lots, en plus des six initiaux, soit vingt-deux avant dépenses. Les relectures et validations répétées d’un résultat ne redonnent pas cette dotation.

## Compatibilité et vérité des rapports

Le format v4 conserve les nouveaux objets industriels, leurs interactions, la copie du journal, le contact, le radiateur et les kits. Les sauvegardes v1, v2 et v3 sont migrées à partir de fixtures produites par leurs versions historiques. Les nouveaux champs reçoivent une valeur initiale documentée; les rapports, stocks déjà connus, pièces et choix historiques restent conservés.

Le point de reprise officiel ne peut pas être remplacé par une relecture. Le premier rapport de chaque mission est immuable. Les dossiers futurs, étrangers ou trop volumineux restent protégés contre une écriture automatique, avec un message qui permet de comprendre pourquoi la sauvegarde n’est pas remplacée.

La source de vérité des durées et des objets est la simulation; la source de vérité du dossier est son schéma de validation. Les textes de briefing, choix et bilan doivent suivre leurs faits. Une scène Canvas ne constitue pas une capture de navigateur. Une exécution du script dans un DOM modélisé ne constitue pas un essai humain du jeu.

## Conception et classeur

La 0.5 conserve les 526 identifiants de la 0.4 et ajoute 55 fiches, soit **581 fiches** sur vingt domaines et vingt et un onglets avec la synthèse. Les ajouts portent sur deux axes de vision, huit règles de systèmes, neuf règles narratives, cinq lots d’assets, huit chantiers de production, quinze scénarios QA et huit fiches de portée prototype. Les statuts de contrôle ne deviennent Vérifié qu’après une exécution documentée.

Le document [Vesper, conséquences et suite de production](VESPER_CONSEQUENCES_V05.md) développe les limites de PT01, les connaissances des personnages, le retour des états, la perte de sources, la réparation et la première interaction de Nacre. Il complète le concept général sans annoncer comme jouables les futurs systèmes de surface, escouade, module ou écologie.

Le classeur est généré depuis `data/bible.json`. La synthèse utilise des formules de comptage, les tables sont filtrables, les statuts ont une validation et leurs couleurs sont conditionnelles. Les cellules source, formules calculées et plages exportées sont réconciliées séparément. Le contrôle natif dans Excel ou LibreOffice n’est pas déduit de ces vérifications. Les résultats du fichier final figurent dans [workbook-v0.5-export.json](validation/workbook-v0.5-export.json).

## Vérifications exécutées

La suite de simulation et de campagne passe **122 tests, sans échec ni test ignoré**. Elle inclut les douze parcours MI04 des six châssis et des deux décisions, les branches de conduite, d’ouvriers et de dispensaire, la perte ou la conservation du journal, le retrait du transport, le radiateur et les migrations historiques. Les calibrations de collision et de chaleur restent identifiées comme tests unitaires; les parcours complets utilisent les commandes publiques. La preuve brute est conservée dans [v05-node-tests.txt](validation/v05-node-tests.txt).

Le script du jeu autonome passe **21 parcours dans un DOM modélisé**, notamment MI04 après migration, pause et reprise d’une vanne, les deux choix, le journal perdu, les quatre archives et la réparation par T ou bouton. Le [résultat d’interface](validation/v05-ui-runtime.txt) précise les fonctions non couvertes : navigateur réel, mise en page CSS, focus natif, téléchargement réel, audio et toucher physique. Les [contrôles statiques](validation/v05-static-ui.txt) valident séparément les références et l’assemblage autonome.

Le classeur réconcilie **4 004 cellules source**, ses 581 fiches et les 526 identifiants précédents. Ses **126 formules** ne présentent aucune erreur dans le moteur utilisé et réagissent à une modification temporaire de statut restaurée ensuite. Le fichier exporté contient vingt tables nommées, vingt validations de statut, quatre-vingts règles conditionnelles et vingt feuilles de données avec volets. Les vues modifiées ont été rendues et inspectées. Les fiches QA63–QA77 portent ces preuves; l’essai humain QA78 reste à produire.

## Travail qui suit la 0.5

1. Faire jouer Vesper dans un navigateur réel : lecture des six profils, cause d’une avarie, réparation, conséquences, reprise et bilan. Mesurer ce que les personnes comprennent sans explication extérieure.
2. Finir MI01 comme niveau de référence en animation, environnement, son, interface et performance sur matériel nommé. Mesurer le travail et les reprises par discipline.
3. Produire une première surface complète de Nacre : banc émergent, barge à treuil et passage civil, avec règles de charge et route lisibles.
4. Étendre le composant local à une menace ennemie et construire une rencontre d’escouade dont les rôles modifient réellement les fenêtres d’action.
5. Réaliser un premier module avec coût d’emplacement et une relation écologique complète avant d’en multiplier les variantes.
6. Construire les sources de recoupement, la transition matérielle de la défection et les pactes sur des états déjà vérifiés, avec une progression possible après perte d’une source.

La construction locale, la publication GitHub et le déploiement Vercel restent des états distincts. Le rapport de livraison précise leur résultat effectif et la révision concernée.
