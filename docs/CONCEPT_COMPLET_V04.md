# ORDRE DE CENDRE — Le concept complet

**Version de conception 0.4.0 · 10 novembre 2026 · Projet ImperiumMarch**

## 1. La proposition du jeu

ORDRE DE CENDRE est un jeu d’action tactique latéral où la manière de déplacer une machine de guerre décide autant de la mission que la manière de tirer. Le joueur incarne Sera Vey, pilote de l’Empire d’Orthe. Elle commence par ouvrir des routes, protéger des convois et contenir de véritables prédateurs. Elle découvre progressivement que l’autorité qui fournit les secours organise aussi une partie des désastres. Sa défection transforme ses objectifs et ses alliances, mais conserve le poids de sa machine, les besoins de son équipage et la responsabilité de ses actes.

La scène qui résume le projet est concrète : un marcheur s’immobilise au-dessus d’une conduite fissurée, retient son tir parce qu’un camion la traverse et reçoit l’ordre d’avancer. Le joueur doit comprendre où porter le poids, quelle menace traiter et quelle information mérite une vérification. La conséquence revient au hangar, puis dans un lieu habité.

Cette version approfondit la conception de l’ensemble du jeu. Son périmètre exécutable reste celui d’un prototype : trois missions de Vesper, trois opérations indépendantes, six châssis, un système de marche par groupes, du combat, des réserves de munitions et un dossier persistant. Les huit planètes, les trente-deux missions, les seize contrats, les douze châssis et les quatre familles de fins constituent la cible de production. Les contrats de mission, le code et le rapport QA précisent ce qui est réellement exécuté.

Les références du présent document sont la [bible générale](BIBLE_FR.md), la [campagne](CAMPAIGN_FR.md), la [direction artistique](ART_DIRECTION.md) et les fiches à identifiants stables de [data/bible.json](../data/bible.json). Les valeurs d’équilibrage proposées pour les systèmes encore conçus sont des hypothèses à mesurer, pas des performances acquises.

## 2. Les cinq engagements de conception

| Engagement | Conséquence dans le jeu | Critère de conception |
| --- | --- | --- |
| Le poids se pilote | Poser, lever, ancrer et reculer modifient les possibilités de tir et les risques au sol. | Un essai peut distinguer un mauvais appui d’un impact reçu. Le rendu utilise les contacts de la simulation. |
| La puissance a une destination | Une même arme peut sauver un convoi et détruire son approvisionnement. | Les dégâts importants possèdent une cible et une conséquence compréhensibles. |
| Le renseignement peut être vérifié | Un ordre nomme une cible, puis l’observation peut confirmer ou contredire sa qualification. | La décision ne suppose aucune information cachée au joueur. |
| Les lieux continuent d’exister | Réseaux d’eau, d’air, de nourriture et de mémoire sont suivis par secteur. | Un retour montre un service ou un usage modifié, au-delà d’un compteur. |
| Une coalition doit tenir parole | Témoins, communes et équipages gardent des demandes distinctes. | Aucun score unique ne rachète une promesse rompue ailleurs. |

Le rythme doit laisser une place à l’observation. Une mission composée uniquement de tirs fait disparaître le pilotage prudent. Une mission composée uniquement de conversations rend la machine accessoire. L’alternance recherchée est une lecture du terrain, un déplacement engagé, un affrontement court, une action de secours ou de vérification et un retour sur ce qui vient de se passer.

## 3. L’expérience d’une sortie

Le briefing présente l’ordre, son émetteur, les informations confirmées, les inconnues et la contrainte matérielle principale. Le hangar montre l’état des machines disponibles. Le choix du châssis doit répondre à une question : visibilité, encombrement, stabilité, charge ou endurance. La préparation finale doit pouvoir être comprise sans connaître toute la bible.

Sur le terrain, le premier danger utilise une règle déjà lisible. La mission la combine ensuite avec une seconde contrainte : un câble pendant le rechargement, une source à scanner sous surveillance, un convoi qui demande un arrêt à l’endroit où la coque veut avancer. Le joueur doit avoir une possibilité de se reprendre avant une conséquence majeure, sauf s’il ignore un avertissement clair.

L’incident narratif intervient dans un objectif qui avait d’abord une utilité. Dans MI01, les filtres restent nécessaires. Dans MI02, l’immobilisation du train reste un secours réel. Dans MI03, une émission militaire existe bien, mais la même désignation administrative englobe des usages civils. Cette construction empêche la révélation de transformer rétroactivement toutes les actions en tromperie uniforme.

Au retour, le rapport sépare quatre faits : objectif militaire, dommages matériels, personnes concernées et information réellement obtenue. Les conversations de Tess et Sami répondent à ces faits. Une relecture permet d’explorer une variante sans remplacer le premier dossier ni redonner sa dotation. Une nouvelle campagne reste le moyen de construire une autre continuité officielle.

## 4. La marche et les appuis

### Le contrôle disponible

Le prototype commande deux groupes d’appui. Le bipède alterne ses pieds, le quadrupède ses diagonales et l’hexapode ses tripodes. L’assistance cadence ces groupes. Le mode manuel laisse au joueur le moment de lancer chaque groupe. Les touches AZERTY et QWERTY doivent rester équivalentes. La pause arrête la simulation.

Une entrée de déplacement indique la direction désirée. Elle ne doit pas téléporter les pieds. Le pied posé demeure lié au sol jusqu’à sa levée. Le transfert de masse, la longueur de foulée, la durée du pas et les avaries des appuis déterminent la progression. Les effets de contact et les éventuels dégâts découlent de cette même trajectoire.

### La cible de production

Le réglage d’un pas court doit réduire l’amplitude et faciliter une correction près d’une structure fragile. Une enjambée longue doit offrir du franchissement et augmenter l’exposition de l’articulation. La marche prudente de l’hexapode doit conserver davantage de points au sol. Ces contrôles restent des extensions à réaliser ; six pattes dessinées ne suffisent pas à prouver la marche dégradée à cinq appuis.

La hauteur variable doit être une posture avec un temps de transition, une plage mécanique et un effet sur la visibilité. Un passage bas doit déclarer sa hauteur utile avant l’engagement. Une machine incompatible doit recevoir un détour annoncé au briefing. La première version de cette règle doit être éprouvée sur un seul passage de référence avant son extension à la campagne.

### L’échec lisible

La glace porte une charge, le quai possède un tablier et la conduite une zone vulnérable. Une surface fragile doit annoncer son état par sa matière, ses fissures, le scanner ou une personne présente. Le jeu ne doit pas retirer soudainement un appui sur une texture indistincte. Après l’incident, le joueur doit pouvoir identifier le contact responsable et comprendre comment l’éviter lors d’une reprise.

## 5. Les douze châssis et leurs différences

Les hauteurs en mètres sont des intentions fictionnelles. Les dimensions du moteur servent au rendu et aux collisions du prototype. La production doit choisir une échelle d’environnement commune avant de les convertir en mesures de franchissement.

| ID et châssis | Appuis et profil | Décision qu’il favorise | Coût qu’il impose | État en 0.4 |
| --- | --- | --- | --- | --- |
| WK01 Vigie M-12 | 2, haut | Observer et avancer par grandes foulées. | Protéger ses deux articulations et préparer ses tirs. | Prototype : silhouette haute, allure et arme propres. |
| WK02 Caracal C-5 | 2, bas | Corriger vite sa position dans les rues. | Limiter la charge et anticiper les obstacles élevés. | Prototype : silhouette basse, foulée courte et paramètres propres. Passage sous obstacle à produire. |
| WK03 Héron H-15 | 2, très haut | Maintenir une ligne d’observation au-dessus d’un couvert. | Gérer une silhouette exposée et un long transfert de masse. | Conçu. |
| WK04 Linceul L-7 | 2, bas variable | Approcher avec une émission thermique faible. | Choisir quand rompre sa discrétion en tirant. | Conçu. |
| WK05 Bastion Q-40 | 4, bas | Couvrir une route depuis une base stable. | Accepter lenteur et encombrement. | Prototype : diagonales, blindage et cadence propres. |
| WK06 Arpenteur A-17 | 4, haut | Lire le terrain depuis une coque élevée. | Protéger de longs membres et corriger une masse importante. | Prototype : profil haut et réglages distincts. Franchissement spécial et module de secours à produire. |
| WK07 Loutre LT-6 | 4, bas | Traverser gués et terrains meubles avec des semelles adaptées. | Surveiller joints, profondeur et durée d’immersion. | Conçu. |
| WK08 Cataphracte CT-13 | 4, haut | Préparer un tir de brèche depuis des appuis verrouillés. | Renoncer à la mobilité pendant l’installation. | Conçu. |
| WK09 Pèlerin H-6 | 6, moyen | Conserver une allure régulière et du refroidissement. | Entretenir six appuis et surveiller la largeur. | Prototype : deux tripodes et réglages propres. Marche à cinq appuis à produire. |
| WK10 Cloporte CL-4 | 6, très bas | Exploiter un profil ramassé et une base large. | Accepter une faible ligne de visée et une progression plus lente. | Prototype : silhouette très basse et paramètres propres. Déminage et tunnels à produire. |
| WK11 Mégalithe MG-22 | 6, très haut | Installer une batterie en retrait. | Vérifier toute infrastructure avant de porter cette masse dessus. | Conçu. |
| WK12 Noria N-9 | 6, moyen | Charger, protéger et transférer des blessés. | Dédier volume et temps d’arrêt au secours. | Conçu. |

La progression doit élargir les usages disponibles. Un châssis tardif ne rend pas tous les précédents inutiles. Le Caracal conserve son intérêt dans une rue étroite lorsque le Mégalithe existe. Le Bastion peut être plus utile à une escorte que le Héron, malgré sa hauteur moindre. Les contraintes de mission doivent offrir au moins deux réponses viables dès qu’un choix d’équipement est proposé.

## 6. Les armes, leurs rôles et leur coût

Les dix-huit familles d’armes couvrent six besoins : traiter une menace légère, ouvrir un blindage, supprimer une pièce précise, déplacer le rapport de force sans détruire, agir sur une infrastructure et secourir. La personnalisation conserve ces différences. Une roquette universelle assez abondante pour tout régler supprimerait la raison d’observer.

| Familles de référence | Fonction | Engagement demandé | Contre-jeu attendu |
| --- | --- | --- | --- |
| AR01 Touraille, AR02 Aiguille, AR05 Veille | Menaces légères et fenêtres brèves. | Discipline des rafales, réserve et chauffe. | Couvert, dispersion, blindage et équipes mobiles. |
| AR03 Brèche 90, AR09 Couronne, AR11 Estran | Blindage, fortification, tir préparé. | Appuis, distance minimale et temps de remise en batterie. | Flancs, déplacement et attaque pendant l’installation. |
| AR04 Vitrail, AR15 Lumen | Neutralisation d’une pièce choisie. | Identification fiable et ligne de vue soutenue. | Écrans, fumées et déplacement de la pièce. |
| AR06 Orage, AR07 Écran, AR13 Sourde | Interrompre, masquer ou séparer. | Consommer énergie ou charges pour gagner une fenêtre. | Moyens non dépendants des capteurs perturbés. |
| AR08 Torpille de rive, AR10 Cisaille, AR12 Dalle, AR17 Défriche | Situation de terrain spécifique. | Préparer le bon outil et respecter son angle d’action. | Terrain inadapté, vulnérabilité à l’arrêt et identification incomplète. |
| AR14 Ligne, AR16 Voûte, AR18 Secours | Traction, protection, transfert. | Points d’ancrage, charge et coordination. | Câble exposé, poussée excessive ou trajet obstrué. |

Les armes primaires du prototype restent des variantes de test de Touraille avec des paramètres propres aux six châssis. Elles ne livrent pas toutes les familles ci-dessus. L’armement secondaire est une roquette à trajectoire directe, avec un stock fini. L’interface doit montrer la quantité en magasin et la réserve séparément.

La réserve finie ajoute une décision de cadence. Chaque sortie du prototype commence avec un magasin chargé et huit magasins en réserve. Un rechargement transfère des cartouches existantes vers les places libres du magasin. Une réserve insuffisante produit un chargement partiel. Une caisse ajoute au plus trois magasins de réserve et deux roquettes dans les plafonds du châssis. Elle ne redevient pas utilisable après un aller-retour ou une sauvegarde. Une sauvegarde conserve le magasin, la réserve, le rechargement en cours et les caisses consommées.

La logistique de campagne complète reste à produire. Sa cible prévoit un lot de départ connu et des livraisons identifiables. Les cadences et dotations devront être calibrées sur des parcours qui incluent des tirs manqués ordinaires, un choix de détour et une reprise après dommage. Une mission ne peut pas exiger qu’un joueur vise comme un pilote automatisé pour conserver de quoi terminer.

## 7. Chaleur, stabilité et dégâts

Le tir crée de la chaleur et du recul. Le terrain, les appuis et l’ancrage influencent la stabilité. La ventilation offre une récupération au prix d’une fenêtre plus vulnérable. Ces trois rythmes doivent être distincts : la réserve limite la durée de l’affrontement, le magasin crée une pause courte et la chaleur sanctionne une intensité excessive.

La cible finale suit coque, cockpit, armes, réacteur, radiateurs, articulations et pieds. Chaque avarie doit modifier une action identifiable. Un radiateur touché réduit la cadence soutenable. Un pied déformé réduit l’adhérence. Une optique endommagée affecte une source de renseignement. La machine ne cumule pas des pénalités arbitraires qui rendent toute action molle.

La première extension à fabriquer doit porter sur un composant visible et réparable, avec une protection équivalente côté ennemi. Introduire huit jauges avant que l’on comprenne une seule panne serait un mauvais ordre de production. Le modèle actuel de coque et d’appuis reste la référence testable pendant cette progression.

## 8. Des doctrines adverses reconnaissables

Les neuf factions du canon ne deviennent pas toutes un camp hostile. Une ambulance des Compagnies de secours libres reste un objectif à protéger même quand une garnison refuse sa présence. L’identité politique d’une unité et son comportement immédiat sont des informations séparées.

| Groupe | Manière d’occuper le terrain | Télégraphe à lire | Réponse possible du pilote |
| --- | --- | --- | --- |
| Empire d’Orthe | Ligne de fusiliers, observateur, arme antichar et itinéraire de ravitaillement. | Position de l’observateur et préparation du lanceur. | Rompre la coordination, couper la ligne de vue ou tenir un passage protégé. |
| Orison | Capteurs, drones et tourelles autour d’un réseau industriel. | Balayage de capteur, alimentation et ordre d’un technicien. | Isoler une alimentation militaire en préservant le réseau civil voisin. |
| Ligue des Rives | Couvert connu, repli et sabotage ciblé. | Équipe qui prépare une charge puis cherche à se retirer. | Reconnaître le service menacé, négocier une sortie ou neutraliser la charge. |
| Brisants | Câbles, embarcations et avantage de route. | Harpon tendu, moteur de fuite, capitaine qui couvre son chargement. | Couper la traction, bloquer un départ ou préserver les captifs. |
| Accords Khelt | Observation du sol, résonance et défense de sites précis. | Vibrations, positions des veilleurs et limites territoriales annoncées. | Modifier son approche, réduire le bruit, respecter une frontière négociée. |
| Gardiens du Sillon | Canal, silo et machines de travail transformées en défense. | Réorganisation des convoyeurs et fermeture de vannes. | Maintenir la nourriture, démontrer la portée limitée de l’intervention. |
| Directoire | Disparition des sources, brouillage, unités sans insigne. | Une purge commence pendant que les autres forces fixent Sera. | Identifier la source menacée, interrompre la purge et garder sa provenance. |
| Cohorte des Serments | Contre-pilotage, tirs sur le prochain appui et réserve mobile. | Préparation d’un tir croisé au moment d’une levée. | Varier cadence, feinter l’ancrage et attaquer un rôle de l’escouade. |

Chaque rencontre combine des rôles avant de combiner des quantités. La première version d’une doctrine peut se limiter à un observateur, un tireur et une voie de repli. La validation demande que le joueur puisse citer le rôle qui rendait l’affrontement difficile. Les trente-six fiches d’ennemis ne sont pas trente-six IA déjà réalisées.

Un adversaire peut fuir, se rendre ou continuer à tenir un objectif. Le système final doit définir qui le sait, quand sa menace cesse et quelle protection lui est due. La reddition ne doit pas se produire uniquement lorsqu’un tir déjà parti rend la perte inévitable. Ce chantier reste conçu et doit être isolé avant son usage dans MI27.

## 9. Véhicules et grands affrontements

Un véhicule possède une fonction avant sa barre de coque : transporter, tracter, protéger, ravitailler ou transmettre. Le camion de Sami et le train Fret-Est montrent déjà comment l’état matériel peut porter une histoire. Les futurs patins, barges, skiffs et porte-arches doivent développer des déplacements et des interactions adaptés à leur milieu.

Un affrontement contre un grand véhicule se structure en pièces et en opportunités. Pour le croiseur terrestre Décret, la cible de conception comporte observation d’un cycle, neutralisation d’un relais de conduite, ouverture d’un passage et décision sur l’équipage. Les moyens de sortie doivent rester visibles avant la destruction finale. Cerbère est actuellement un adversaire lourd de validation d’OP03 ; il ne constitue pas la livraison du Décret.

Les missions de train suivantes doivent réutiliser locomotive, wagons, traction et dommages en ajoutant une seule règle majeure à la fois. Aiguillages, dételage et transfert de cargaison sont des extensions distinctes. Leur coût de production ne disparaît pas parce qu’un train existe dans MI02.

## 10. Huit mondes que l’on reconnaît en jouant

| Monde | Vie à maintenir | Règle de terrain dominante conçue | Situation de mission à privilégier | Retour visible |
| --- | --- | --- | --- | --- |
| Vesper | Air filtré, galeries et transports de minerai. | Croûte fragile et conduites proches du trajet. | Un convoi et un réseau local demandent une précision inhabituelle à la machine. | Filtres distribués, atelier alimenté, fenêtre du dispensaire. |
| Nacre | Pompes, quais et traversées de marée. | Charge des tabliers, vase et niveau d’eau. | Tenir une digue pendant que des bateaux passent. | Balise rallumée, quai de secours, maisons humides ou abandonnées. |
| Thyr | Cultures, maisons et organismes porteurs. | Racines structurelles, couvert et propagation du feu. | Traverser une migration sans briser l’habitat qui la nourrit. | Retour des récoltes, routes vivantes ou couloir brûlé. |
| Kharon | Refroidissement, ateliers et énergie. | Chaleur ambiante et vapeur annoncée. | Soutenir un circuit de froid sous le feu d’une unité privée. | Atelier encore actif, arrêt de production assumé, équipe évacuée. |
| Sereis | Refuges, historiques et caravanes. | Charge sur glace, traction et visibilité réduite. | Répartir les passages sur une surface qui enregistre les vibrations. | Refuge occupé, balise entretenue, convoi qui a pu repartir. |
| Ilex | Archives matérielles et souveraineté des cités. | Résonance et seuils de vibration. | Retirer un brouilleur sans endommager le support qu’il occupe. | Archive restituée, accès accordé ou limite maintenue. |
| Méridien | Eau, graines, récoltes et distribution. | Circulation civile et interdépendance des canaux. | Désarmer une batterie en conservant silo et pompes. | Rations, machines au travail, règle de partage respectée. |
| Orthe | Ateliers, logements et transports verticaux. | Terrasses, passages bas et très forte présence civile. | Atteindre un centre de décision en tenant les voies d’évacuation. | Même rue sous un autre ordre, avec ses pertes et ses usages. |

Chaque biome doit commencer par un petit ensemble cohérent : une surface, un obstacle, une infrastructure, une forme de vie et une manière de vivre. Une palette différente et un fond peint ne suffisent pas à livrer une planète. Les opérations actuelles de Nacre et Thyr éprouvent des situations réduites ; leurs campagnes de quatre missions restent à construire.

## 11. Faune, flore et écologie de niveau

Les vingt-quatre animaux et vingt-quatre végétaux du catalogue doivent former des relations locales. Sur Vesper, lichens de cendre et roseaux de suie signalent des conditions de sol et d’air. À Nacre, mangroves à haubans et espèces de marée organisent l’usage des rives. À Thyr, colonne-mère, vigne respirante et longue-dorse rendent la destruction d’une racine intelligible dans plusieurs registres : habitat, circulation et subsistance.

La chaîne de conception d’une espèce est habitat, besoin, routine, perception, réaction et retour au calme. Une créature territoriale ne poursuit pas une machine sur toute la carte. Une espèce attirée par la chaleur ne connaît pas sa position à travers une distance illimitée. Le joueur doit pouvoir comprendre comment diminuer la menace autrement qu’en vidant ses magasins.

Les plantes interactives ont une fonction matérielle. Une racine porteuse doit relier visuellement le sol à ce qu’elle soutient. Une végétation qui masque une personne doit conserver une lecture possible par mouvement, silhouette ou capteur. Une espèce décorative peut rester sans collision, mais sa couche de profondeur doit rendre ce statut clair.

Pour chaque premier niveau de planète, produire une seule interaction écologique complète avant les variantes. Le test de réussite est une scène où le joueur peut prévoir l’effet d’un pas ou d’un tir, constater cet effet et retrouver une conséquence locale. Les variations d’ambiance suivent ce socle.

## 12. PALINODE et la progression des révélations

PALINODE consiste à provoquer ou aggraver des défaillances, imposer le secours comme dette et effacer les archives qui permettent aux populations de revendiquer une autre organisation. La révélation doit porter sur des actes, des responsabilités et des moyens matériels. Elle ne repose pas sur une unique confession qui explique rétroactivement tous les mondes.

| Période | Ce que Sera peut savoir | Information encore absente | Forme de jeu dominante |
| --- | --- | --- | --- |
| MI01–MI03 | Des listes excluent des personnes, des ouvriers sont vendus, des usages civils sont qualifiés d’hostiles. | Le programme coordonné et sa chaîne de décision. | Vérifier une qualification et conserver un dossier local. |
| MI04–MI08 | Une pièce et des balises contredisent l’explication officielle de certains incidents. | La série industrielle et l’autorisation commune. | Sauvegarder une trace matérielle et voir qui bénéficie d’une procédure. |
| MI09–MI16 | Plusieurs sources relient incidents, produits, numéros de série et fabrication. | La portée complète du système et son financement central. | Recouper sous surveillance, protéger une source, préparer la défection. |
| MI17–MI24 | Des archives indépendantes et les ordres de purge établissent coordination et effacement. | Le détail des finances et délégations du centre. | Obtenir un accord, protéger les témoins et diffuser de manière vérifiable. |
| MI25–MI32 | Contrats et signatures complètent la chaîne de responsabilité. | L’issue politique dépend désormais des actes et alliances conservés. | Maintenir les services tout en arrêtant le pouvoir qui les instrumentalise. |

Les preuves gardent leur provenance, leur intégrité, leur détenteur et leur degré de publicité. Une copie reste une copie même si l’original est détruit. Un registre détruit avant lecture ne peut pas révéler ses noms dans le débriefing. La survie du témoin, sa confiance et son accord à témoigner restent trois conditions différentes.

Une source perdue ferme certaines variantes mais laisse une route de compréhension. PT03 peut recouper une série industrielle dont PT01 a disparu. Cette redondance permet de poursuivre la campagne sans prétendre que toutes les pertes s’annulent. MI01, MI02 et MI03 ne donnent aucune preuve PALINODE complète.

## 13. Personnages et relations qui se construisent

| Personnage | Ce qu’il regarde chez Sera | Situation où son accord devient coûteux | Retour narratif attendu |
| --- | --- | --- | --- |
| Tess | Usage des pièces, risque imposé à l’équipage, transparence. | Reconnaître une pièce de sabotage liée à son propre métier. | Une réparation et une conversation changent ensemble. |
| Sami | Personnes livrées, rues desservies, état du véhicule. | Revenir chercher quelqu’un que la feuille ne prévoit pas. | Un trajet et des noms persistent. |
| Holt | Tenue de mission et capacité à protéger sous contrainte. | Admettre des faits qui mettent en cause son idée de l’armée. | Il peut aider un secours sans accepter la défection. |
| Ilan | Ce qu’on lui dit, sort des prisonniers et avenir de sa famille. | Quitter une protection institutionnelle avec des preuves incomplètes. | Présence, départ ou coopération conditionnelle fondés sur des scènes. |
| Mara | Lits, personnes arrivées et continuité des soins. | Accorder des moyens à celle qui a servi l’occupation. | Confiance précise sans absolution générale. |
| Nima | Provenance, recoupement et exposition des sources. | Renoncer à une diffusion spectaculaire qui mettrait un témoin en danger. | Un dossier plus solide peut être moins public à court terme. |
| Leth | Permission, traduction et restitution des mémoires. | Confier une archive à des humains armés. | Un accès accordé ne transfère pas sa propriété. |
| Hadr | Frontières, captifs et pactes tenus. | Coopérer avec d’anciens adversaires sans renoncer à sa cité. | Une alliance militaire distincte de la confiance de Leth. |
| Aline | Authenticité de son rôle et protection de ses proches. | Témoigner contre un système dont elle a conçu une partie. | Responsabilité reconnue, jamais effacée par son aide. |
| Vann | Contrats, routes et personnes embarquées. | Choisir entre une cargaison rentable et des passagers connus. | Le prix et l’accès varient selon le capitaine, pas une réputation pirate unique. |
| Jo | Eau, stocks et engagements de distribution. | Aider l’offensive sans affamer un quartier. | La coalition doit administrer les conséquences de sa promesse. |
| Edda | Compétence, loyauté d’équipage et preuves accessibles. | Céder un passage à une transfuge devant les siens. | Adversaire récurrente dont la conduite peut évoluer. |
| Norn | Contrôle des délégations et dépendance des réseaux. | Voir une preuve confiée à des dépositaires indépendants. | Elle propose des concessions matérielles pour conserver l’effacement. |

Sera reste l’agent qui agit entre ces demandes. Les dialogues doivent lui permettre de poser une question, reconnaître une limite ou assumer une conséquence. Ils ne doivent pas faire d’elle la première personne à expliquer leur propre oppression à tous ses interlocuteurs.

## 14. Les choix et leurs états

Une décision de mission comporte ce que Sera a fait, ce qu’elle a pu constater et ce qu’elle en a déclaré. Ces dimensions peuvent différer. Elles doivent rester inspectables dans les archives sans multiplier les compteurs opaques dans le HUD.

Pour Vesper, la continuité suit notamment la conduite, la distribution des filtres, l’avis de Sami, le train, les ouvriers, le registre et le réseau civil. Le premier rapport d’une mission est conservé. Une réparation améliore le service mais n’efface pas l’incident initial. Une copie de preuve ne ressuscite pas les personnes perdues.

Les règles cibles de campagne doivent produire une fiche de conséquence avec une origine, un retour attendu et une solution de remplacement si elle transporte une information nécessaire. Par exemple, préserver le dispensaire de MI03 rend un contact futur accessible ; perdre ce lieu doit modifier la route de témoignage, pas rendre MI04 impossible. Le code de MI04 devra consommer effectivement cette conséquence avant qu’elle soit présentée comme une branche jouable.

Le jeu peut annoncer un risque sans annoncer toute l’histoire. « Couper ce relais interrompra les communications du dispensaire » éclaire une action. « Cela retire trois points à la meilleure fin » détruit la situation. La première formulation appartient au jeu, la seconde à un outil interne de validation s’il devient nécessaire.

## 15. La cadence des trente-deux missions

Chaque monde possède quatre missions qui introduisent, combinent, déplacent puis concluent une question locale. Chaque acte doit aussi modifier les moyens matériels de Sera. Le catalogue existant fournit les objectifs et les titres ; la production doit désormais définir entrées, phases, objets, échecs et retours pour chaque mission.

| Bloc | Missions et progression | Système majeur à fabriquer avant le bloc |
| --- | --- | --- |
| Vesper | MI01 escorte et service ; MI02 train et captifs ; MI03 émissions civiles ; MI04 maintenance suspecte. | Contacts fiables, transport, interaction d’enquête et sauvegarde. |
| Nacre | MI05 passage pirate ; MI06 digue ; MI07 ambulance ; MI08 évacuation de marée. | Eau télégraphiée, charge des quais et transport sanitaire. |
| Thyr | MI09 route vivante ; MI10 terrain stérilisé ; MI11 voix déformée ; MI12 relais sous surveillance. | Écologie interactive, observation et conservation de plusieurs sources. |
| Kharon | MI13 série de pièces ; MI14 ateliers ; MI15 plans et témoin ; MI16 rapport empêché et défection. | Chaleur de terrain, protection de techniciens, transfert d’équipage. |
| Sereis | MI17 perte des balises amies ; MI18 archives datées ; MI19 noms du convoi ; MI20 défense d’un refuge. | Logistique autonome, glace et évacuation. |
| Ilex | MI21 approche autorisée ; MI22 purge ; MI23 pacte ; MI24 diffusion. | Résonance, droits d’accès, objectifs répartis et pactes. |
| Méridien | MI25 stocks ; MI26 contrats ; MI27 sortie de garnison ; MI28 distribution. | Réseaux de service, reddition et arbitrage logistique. |
| Orthe | MI29 ateliers ; MI30 délégations ; MI31 Holt ; MI32 arrêt, diffusion et évacuation. | Terrasses, pièces de boss, alliés persistants et résolution des fins. |

Les durées finales ne sont pas promises. Une première cible de playtest peut viser des segments assez courts pour isoler une difficulté, séparés par des checkpoints compréhensibles. La durée publiée du jeu devra venir de parcours humains complets, avec exploration, dialogues et reprises.

## 16. Les contrats secondaires et le retour aux lieux

Les seize contrats servent trois fonctions : approfondir un usage du monde, donner une conséquence locale à un personnage et ouvrir une ressource ou un passage. Ils doivent pouvoir être refusés sans faire disparaître arbitrairement la compréhension de la campagne principale.

CT01 et CT02 reviennent sur l’air et les manifestes de Vesper. CT03 et CT04 donnent une valeur pratique aux routes de Nacre. CT05 et CT06 font lire l’écologie et les souvenirs de Thyr. CT07 et CT08 permettent à Tess d’employer son métier autrement. CT09 et CT10 préparent la survie de Sereis. CT11 et CT12 font éprouver permission et traitement des captifs. CT13 et CT14 organisent la nourriture. CT15 et CT16 confrontent l’offensive finale aux habitants d’Orthe.

Chaque contrat doit préciser sa fenêtre d’accès. Un problème urgent peut devenir indisponible après un départ, mais le joueur doit le savoir avant de s’engager. La conséquence d’un refus doit rester proportionnée au problème annoncé. Les contrats ne doivent pas cacher un objet indispensable à la seule fin viable derrière une activité présentée comme facultative.

## 17. Économie, atelier et progression

Le prototype utilise six lots d’atelier initiaux et une dotation unique de quatre lots pour chaque première réussite de mission. La coque et les appuis peuvent être remis en état, et l’incident de conduite conserve sa trace après réparation. La réserve de munitions est une ressource de sortie, renouvelée au départ d’une nouvelle mission. Les modules interchangeables, les stocks commerciaux, les pièces rares et la logistique interplanétaire restent conçus.

La cible finale distingue trois couches. Le consommable courant permet de repartir. La pièce spécialisée ouvre une fonction de châssis. Le service local facilite une route ou un ravitaillement. Les réunir dans une monnaie universelle rendrait un hôpital et un magasin de roquettes artificiellement interchangeables.

Avant MI16, l’armée fournit une base standard en échange de sa discipline et de ses rapports. Après la défection, l’équipage perd cet accès. Les alliances, ateliers et véhicules préservés deviennent alors des moyens concrets. La première mission libre doit rester terminable avec une dotation minimale garantie. Une mauvaise gestion peut imposer une réparation, un détour ou un équipement moins confortable ; elle ne doit pas créer une sauvegarde condamnée sans avertissement.

Les plans d’amélioration doivent exposer leur bénéfice et leur coût physique. Installer un radiateur occupe de la place et modifie la signature. Une nacelle réduit l’emport offensif. Une semelle de marais change l’adhérence et la mobilité. Les courbes de progression doivent être testées sur des usages différents, pas uniquement sur des dégâts moyens par seconde.

## 18. Interface, commandes et accessibilité

Le HUD doit répondre rapidement à cinq questions : où puis-je poser le prochain appui, qu’est-ce qui menace la machine, combien de tirs puis-je soutenir, que demande l’objectif et qui parle. La coque, les appuis, la chaleur, le magasin, la réserve et les roquettes doivent rester distincts sans occuper tout le champ de vision.

Les interactions ont un objet, une distance et une progression. Un maintien interrompu doit expliquer pourquoi il l’est. Une émission inconnue doit devenir une information qualifiée après vérification. La décision qui met la simulation en pause doit montrer les faits observés et les conséquences connues, y compris l’absence d’une source détruite.

L’assistance de marche est un réglage de contrôle. La difficulté agit sur les contraintes de combat et ne change pas la vérité d’un événement. À terme, maintenir ou basculer une action, remapper les touches, modifier la taille du texte, réduire la secousse et les flashes, régler séparément voix et effets et revoir une transmission doivent être possibles. Ces possibilités ne doivent être annoncées comme disponibles qu’après intégration.

La validation d’accessibilité doit être humaine et par tâche. Il faut finir un briefing au clavier, retrouver le focus après une fenêtre, comprendre une alerte sans le son et distinguer allié, civil et adversaire sans dépendre seulement du rouge et du vert. Un test de DOM prouve certaines transitions ; il ne prouve ni lisibilité, ni navigation réelle dans tous les navigateurs, ni accessibilité complète.

## 19. Art, animation et son

L’image vise une science-fiction militaire peinte où la fonction se voit : charnières, vérins, échangeurs, panneaux et raccords. Les pièces doivent être animables et partager une échelle. Les six profils du prototype servent à comparer la lisibilité des hauteurs ; les rigs définitifs et les états de destruction restent des lots de fabrication.

La silhouette haute doit dégager la vue sans effacer la personne au sol. La silhouette basse doit montrer ses pieds sans que la coque les absorbe. Les membres éloignés doivent se distinguer par valeur et profondeur. La caméra doit conserver assez de terrain devant la machine pour préparer une foulée ; les décors proches ne peuvent pas masquer un danger actif pendant plusieurs secondes.

Le son du pas comporte contact, compression, charge hydraulique et résonance de coque. La surface change l’attaque et la réverbération. Une jambe abîmée introduit un rythme qui aide à diagnostiquer l’avarie. La priorité du mix appartient aux télégraphes dangereux et aux transmissions utiles. La musique peut soutenir un ordre avant d’en révéler le poids, sans annoncer d’avance que toute voix impériale ment.

La fabrication suit une chaîne : référence, pièces ou rig, animation, intégration, inspection en mouvement et mesure de coût. Une illustration de concept n’est pas un sprite articulé. Un rendu Canvas de la simulation n’est pas une capture de navigateur. Les manifestes d’assets doivent conserver provenance, usage, version et dépendances.

## 20. Structure technique et conservation des acquis

Le prototype sépare données jouables, simulation, campagne, rendu, interface et audio. Cette séparation doit rester utile : le jeu peut simuler une mission sans DOM, restaurer un état et recevoir les mêmes entrées pour produire le même résultat. Le rendu ne décide pas qu’un pied a touché une conduite ou qu’un wagon a été détruit.

La sauvegarde versionnée conserve l’état nécessaire à la reprise. Le passage au format v3 accompagne MI03, les nouvelles réserves et la flotte élargie. La migration doit utiliser des fixtures réellement produites par les versions historiques. Un format futur inconnu est protégé ; il ne devient pas un nouveau dossier vide par commodité.

Une mission officielle et ses relectures restent séparées. Importer un dossier, reprendre avant une décision, terminer deux fois ou changer le chapitre sélectionné ne doit pas dupliquer des ressources ni remplacer le premier rapport. Une écriture échouée doit être visible sans inventer une sauvegarde réussie.

La distribution autonome reste importante pour le prototype. Le fichier HTML doit embarquer ce qui lui est nécessaire et fonctionner sans requête réseau. La publication d’un dépôt ou d’un site constitue un état de livraison distinct de la qualité de cette archive locale.

## 21. Quatre familles de fins et des épilogues locaux

La finale évalue d’abord une sortie jouable valide. Une défaite sans évacuation ou objectif tenu mène à une reprise. Elle ne devient pas une fin secrète récompensant un blocage.

**Les communes debout** demande un dossier recoupable, une diffusion indépendante, des pactes tenus et des services suffisants. **La vérité sous les décombres** conserve une vérité publique mais laisse des réseaux ou accords profondément abîmés. **Un autre uniforme** fait tomber des dirigeants tout en laissant la centralisation et l’effacement survivre sous une nouvelle autorité. **Ceux qui ont traversé** privilégie la voie de retrait et la conservation de personnes, copies et savoirs alors que le système demeure partiellement en place.

Les épilogues doivent revenir à des lieux connus : quai, dispensaire, galerie, atelier, jardin ou canal. Ils lisent les faits locaux avant d’habiller une famille de fin. Une décision finale ne reconstruit pas instantanément une conduite ni ne remplace des personnes mortes. Une machine peut finir comme appui de pont, outil de chantier ou véhicule abandonné selon la capacité du monde à lui donner un autre usage.

## 22. Produire le jeu dans le bon ordre

La prochaine priorité de qualité est un niveau de référence entièrement fini. MI01 reste adapté parce qu’il réunit apprentissage, appuis, combat, escorte, infrastructure, dialogue et retour au hangar. MI02 et MI03 élargissent les systèmes ; leur présence ne remplace pas le besoin d’animation, d’audio, de lisibilité et d’essais humains sur ce niveau de référence.

| Jalon | Livrable observable | Dépendance qui autorise la suite |
| --- | --- | --- |
| Stabiliser la 0.4 | Trois missions, six châssis, réserves, migrations et rapports cohérents. | Parcours publics reproductibles, reprise et intégrité des archives. |
| Finir MI01 | Art intégré, animation complète, mix, commandes, retours et performance mesurée sur une machine cible déclarée. | Essais humains et coût de production relevé par discipline. |
| Fermer Vesper | MI04 et retours réels de conduite, train, dispensaire et première preuve technique. | États consommés par une mission suivante, pas seulement écrits dans une sauvegarde. |
| Produire Nacre | Première règle d’eau et de quai, véhicule sanitaire et quatre missions liées. | Validation d’un biome complet avec son rythme et ses contraintes. |
| Produire l’acte II | Écologie de Thyr, chaleur de Kharon, preuves et défection. | Conservation et recoupement des sources à l’échelle d’un acte. |
| Étendre les actes III et IV | Logistique libre, pactes, diffusion, services et fins. | Résolution automatique des états complétée par des lectures narratives humaines. |

Le calendrier et le financement doivent être calculés après le niveau de référence. Il faut mesurer le temps consacré à une animation, une rencontre, une scène de dialogue et une correction de niveau. La taille du catalogue n’est pas un calendrier. Les plateformes, la commercialisation et le prix restent des décisions de production à prendre sur une base éprouvée.

## 23. Risques prioritaires et décisions pratiques

| Risque | Symptôme observable | Réponse de production |
| --- | --- | --- |
| Trop de châssis semblables | Le joueur choisit uniquement le plus blindé. | Tester un parcours d’observation, un passage serré et une escorte avant d’ajouter des modèles. |
| Marche difficile à lire | Le joueur attribue un accident à une animation imprécise. | Montrer et tester contacts, durée d’appui et direction réelle du pas. |
| Morale réduite à un bouton | L’action contredit le texte du bilan. | Construire les textes depuis personnes, objets et preuves encore présents. |
| Économie punitive | Une sauvegarde laisse le joueur sans moyen de terminer. | Prévoir une dotation minimale et vérifier les dépenses sans récompense répétable. |
| Catalogue trop vaste | Les nouveaux noms augmentent tandis qu’aucun niveau ne devient fini. | Produire une interaction complète par famille avant ses variantes. |
| Campagne incohérente | Un témoin, un service ou un allié revient malgré sa perte. | Définir pour chaque retour les états d’entrée et une solution de remplacement. |
| Validation surévaluée | Un test simulé est présenté comme une expérience humaine complète. | Nommer environnement, parcours et limite de chaque preuve de validation. |

## 24. Conditions d’acceptation communes

Une fonctionnalité passe au statut **Prototype** quand elle existe dans une version jouable avec un comportement décrit et des limites identifiées. Elle ne passe pas au statut **Vérifié** parce qu’un document la prévoit. Chaque contrôle doit nommer son scénario, ses entrées, son résultat et l’environnement utilisé.

Une mission prête à élargir la production doit être terminable avec chaque machine autorisée, expliquer ses pertes, restaurer ses états, protéger ses sources narratives et offrir une reprise sans double récompense. Elle doit également être comprise par un joueur qui n’a pas lu la documentation. Les tests automatiques couvrent les invariants ; les essais humains décident si la marche, le combat et le récit font réellement sens ensemble.

La prochaine tranche doit convertir ces règles en quelques scènes solides, puis mesurer ce qu’elles coûtent à fabriquer. C’est cette continuité entre concept, code, art et validation qui permet d’étendre ORDRE DE CENDRE sans perdre sa promesse : chaque pas laisse une trace.
