# ORDRE DE CENDRE — Tranche de production 0.4

**Version 0.4.0 · 10 novembre 2026**

La 0.4 prolonge le prototype sur trois axes : une enquête jouable à Vesper, une flotte de six profils et la gestion de réserves finies. Elle approfondit en parallèle la conception de l’ensemble du projet. Le [concept complet](CONCEPT_COMPLET_V04.md) décrit les règles et les critères de fabrication; le [rapport QA](QA_V04.md) consigne les contrôles exécutés et leurs limites.

## Ce qui est jouable

| Domaine | Extension de la 0.4 | Limite de livraison |
| --- | --- | --- |
| Campagne | MI01 puis MI02 puis MI03, chacune avec briefing, progression, décision, extraction et dossier. | Les 29 autres missions et les 16 contrats restent conçus. |
| MI03 | Trois émetteurs, inspection, relais militaire, dispensaire et maisons occupées, contrôle de Holt, réseau civil et bilan. | Population modélisée sans évacuation animée; première enquête de réseau seulement. |
| Flotte | Caracal bas à deux appuis, Arpenteur haut à quatre, Cloporte très bas à six, aux côtés de Vigie, Bastion et Pèlerin. | Hauteurs fixes; tunnels, déminage, franchissement spécial et modules de secours à produire. |
| Armement | Magasin chargé et huit magasins de réserve; recharge partielle; caisses consommées une fois. | Dotation renouvelée au départ; absence d’inventaire commercial ou intermissions. |
| Sauvegarde | Format v3, reprise MI03, ajout des nouveaux châssis et migrations des véritables formats v1/v2. | Compatibilité limitée aux formats connus; pas de synchronisation en ligne. |
| Dossiers | Trois premiers rapports immuables; une dotation par première réussite. | Les conséquences au-delà de Vesper attendent une mission qui les consomme. |

Les trois opérations OP01–OP03 restent des scénarios indépendants. Elles ne donnent pas une progression de campagne et ne comptent pas parmi les trente-deux missions finales.

## Vérifications de cette tranche

La suite Node compte 89 tests réussis. Les boucles de pilotage couvrent 24 parcours MI01, 12 MI02, 12 MI03 et 18 parcours d’opérations, soit 66 combinaisons terminées par commandes publiques. Les douze parcours de MI03 en difficulté Pilote et graine 1847 conservent les vingt habitants. Quinze parcours d’interface exécutent le script autonome dans un DOM modélisé; ils ne constituent pas des clics dans un navigateur réel.

Le classeur réconcilie 526 fiches et 3 647 cellules avec le JSON. Ses formules de synthèse réagissent à une modification de statut, ensuite restaurée. La lecture du fichier exporté contrôle les tables, validations et volets. La validation native dans Excel et les essais humains de navigateur, de perception et d’accessibilité restent distincts de ces contrôles. Les preuves et limites détaillées figurent dans [QA_V04.md](QA_V04.md) et [workbook-v0.4-export.json](validation/workbook-v0.4-export.json).

## MI03 : vérifier ce que désigne l’ordre

Holt demande d’interrompre trois émissions. Le poste neuf est militaire; le dispensaire des Fours et les maisons de la traverse sont occupés. L’inspection prend deux secondes au poste ou dans des ruines, quatre dans un bâtiment civil vivant. L’interaction doit rester à portée. Une seconde action coupe le poste militaire sans exiger de munitions.

La vérification sécurise la gaine au sol des bâtiments vivants. Les contacts de pieds non protégés peuvent causer des dégâts. Les tirs et explosions continuent d’endommager la structure, même après inspection. Le dispensaire compte huit occupants, les maisons douze. Des pertes peuvent survenir jusqu’à l’extraction, y compris après la décision signée.

Six secondes cumulées de vérification civile déclenchent un contrôle avec un drone. Le joueur peut ensuite couper les circuits civils ou maintenir ceux qui subsistent en joignant son constat. Le rapport distingue zéro, un ou deux relais en ligne, les pertes, le sort du dispensaire, le contrôle de Holt et le rapport déposé. L’état `networkPreserved` correspond à deux relais encore en ligne. Un seul relais constitue un réseau partiel.

Le canal d’un futur témoin suppose un dispensaire vérifié, non détruit, non coupé et au moins un survivant. Le témoin n’est pas encore rencontré dans une mission suivante. Aucune preuve PALINODE n’est attribuée dans MI03. Les règles complètes figurent dans [CAMPAIGN_MISSION_03.md](CAMPAIGN_MISSION_03.md).

## Flotte et consommation

Les six châssis possèdent leurs dimensions, leur coque, leurs groupes de marche et leurs paramètres d’armement. Les différences restent celles du modèle actuel. Une description de concept comme « déminage » ne devient pas une capacité active du Cloporte simplement parce que sa silhouette est intégrée.

Recharger transfère le minimum entre la place libre et la réserve. Une réserve vide ne remplit plus le magasin. Une caisse ajoute au plus trois magasins de réserve et deux roquettes, dans les plafonds du châssis. Elle conserve les soins de terrain déjà présents et se consomme une seule fois, même si certains stocks étaient au maximum.

L’atelier commence avec six lots et attribue quatre lots pour chaque première réussite, soit dix-huit avant dépenses après les trois missions. Réparations et incidents persistent. Les munitions sont renouvelées à chaque nouvelle sortie; une reprise conserve les stocks de cette sortie. Les relectures ne donnent aucun lot et ne remplacent pas les premiers rapports.

## Préservation des anciennes parties

Les fixtures historiques sont produites par leurs versions d’origine. Le fixture v1 n’est pas réécrit. Le fixture v2 de la 0.3 provient de la révision `7202733`, avec des étapes obtenues par les commandes publiques. La migration conserve magasin, roquettes, recharge en cours, rapports, choix, usure et lots. Elle ajoute une réserve finie de huit magasins aux anciennes sorties et trois châssis neufs à la flotte.

Les formats futurs inconnus restent protégés contre un écrasement automatique. Les opérations d’import et d’écriture doivent signaler leur échec. Les scénarios de migration et de double validation restent distincts de l’essai d’un navigateur réel.

## Conception approfondie

Les 446 fiches historiques sont conservées. La 0.4 ajoute 80 fiches : 4 de vision, 16 de systèmes, 12 de narration, 8 d’assets, 12 de production, 18 de QA et 10 de prototype. Le référentiel comporte donc 526 fiches sur vingt domaines, présentées dans vingt et un onglets avec la synthèse.

Les nouvelles spécifications définissent charge des surfaces, passages bas, avaries fonctionnelles, rôles d’escouade, écologie locale, logistique après défection, compatibilité des modules, contrôle accessible, connaissance des personnages et retours de conséquence. Ces éléments restent conçus tant qu’ils ne disposent pas de règle jouable. Les fiches QA indiquent leur preuve et leur environnement lorsqu’un contrôle a été exécuté.

## Travail qui suit cette tranche

1. Réaliser les essais humains et navigateur de la 0.4 dans un environnement qui permet l’ouverture effective du jeu.
2. Porter MI01 au niveau de référence en animation, environnement, audio, interface et performance mesurée.
3. Produire MI04 en consommant réellement les états de l’air, du train et du dispensaire, puis introduire la première anomalie technique PT01.
4. Construire une première doctrine d’escouade et une première interaction écologique complète avant leurs variantes.
5. Mesurer le coût du niveau de référence avant d’engager la production des huit biomes et de la campagne entière.

La construction locale, la publication du dépôt et le déploiement du site sont trois états distincts. Ce document n’atteste aucune publication distante de la 0.4.
