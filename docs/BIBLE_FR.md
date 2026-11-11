# ORDRE DE CENDRE

## Chaque pas laisse une trace.

**Nom de code :** ImperiumMarch · **Version de conception :** 0.8.0 · **Date :** 11 novembre 2026

**ORDRE DE CENDRE** est un jeu d’action tactique en 2D dans lequel le joueur pilote les machines d’occupation de l’Empire d’Orthe. D’abord chargé de « pacifier » ses mondes périphériques, il découvre que les catastrophes justifiant ces interventions sont en partie organisées par ceux qui prétendent les réparer. Sa machine ne change pas soudainement de nature lorsqu’il refuse un ordre : elle reste lourde, dangereuse et dépendante de pièces fabriquées par l’Empire. Il doit apprendre à s’en servir pour autre chose que contraindre.

La signature du jeu est le rapport entre **appui, puissance et responsabilité**. Un pas permet d’éviter une roquette, de détruire un véhicule ou de soutenir un passage d’évacuation. Mal placé, il rompt une conduite qui alimentait tout un quartier. Le joueur ne se contente pas de sélectionner une intention dans un dialogue : il la réalise avec une machine qui impose ses contraintes.

La qualité AAA est une **ambition de direction et de finition**. Cette version constitue une fondation de production, avec un prototype jouable et une bible étendue. Elle ne représente pas une campagne finale ni un jeu commercial terminé. La source structurée est [data/bible.json](../data/bible.json). L’onglet **Prototype** du classeur décrit précisément les éléments présents et leurs limites; les autres onglets comprennent aussi les règles prévues pour la suite.

**Portée exécutée en 0.8 :** MI01–MI04 constituent le premier arc jouable de Vesper. MI05 ouvre le chenal de Nacre, MI06 poursuit la digue et MI07 accompagne une ambulance sur la chaussée des Salines. Les six châssis gardent leurs réserves finies et leur radiateur réparable. La campagne conserve ses conséquences dans un dossier v7; le carburant engagé à MI06 ne revient pas lors du passage à MI07. Les 25 autres missions principales restent conçues. La [production 0.8](PRODUCTION_V08.md) définit cette portée. Le [concept complet](CONCEPT_COMPLET_V04.md) présente l’ensemble du jeu; [Vesper](VESPER_CONSEQUENCES_V05.md) et [Nacre 0.8](NACRE_CONSEQUENCES_V08.md) précisent les conséquences. Les bilans antérieurs conservent leur portée historique.

## 1. Le contrat avec le joueur

Le joueur doit sentir qu’il conduit une masse réelle. Il voit ses pieds chercher le sol, entend ses vérins reprendre le poids, remarque la différence entre une machine stable sur quatre appuis et un bipède surpris pendant une enjambée. Cette sensation doit rester lisible : les accidents viennent d’un risque annoncé ou d’une mauvaise décision, pas d’un modèle physique capricieux.

La seconde promesse est la variété des situations. Une infanterie antichar, un patin pirate, une batterie d’Orison, un défenseur Khelt et un animal territorial ne doivent pas devenir cinq habillages d’un ennemi qui court vers le joueur. Chacun possède une raison d’être là, une manière d’occuper le terrain et une réponse intelligible au marcheur.

La troisième promesse concerne les mondes. Ils ont des habitants, des moyens de subsistance, des trajets, des métiers et une vie avant l’arrivée du pilote. Une digue existe pour retenir la mer. Une canopée soutient des maisons. Un silo nourrit des quartiers. Détruire ces structures ne doit jamais être traité comme l’équivalent neutre de détruire une caisse de décor.

Enfin, la transformation de Sera est progressive. Elle commence en croyant à son travail. Plusieurs menaces qu’elle combat sont réelles. Ce qu’elle découvre ne rend pas chaque rebelle juste ni chaque soldat impérial monstrueux : cela établit qu’une politique de domination se cache derrière des interventions parfois nécessaires.

## 2. Ce que l’on retient de la référence

La page officielle de [BE-A Walker](https://store.steampowered.com/app/864160/BEA_Walker/) présente le contrôle volontaire des jambes, leur usage dans le combat et l’amélioration du marcheur. Ces éléments orientent le travail sur le poids et les appuis. Le projet développe ses propres personnages, véhicules, décors, factions, révélations et missions.

La marche reste donc une action de pilotage à part entière. Elle n’est pas seulement une animation attachée à un déplacement automatique. Le mode manuel doit faire comprendre quelle partie de la machine supporte le poids; l’assistance rend ce système accessible sans supprimer les risques liés à la posture, au terrain et au recul.

Le format choisi est une action latérale sur un plan de collision clair, avec profondeur peinte, parallaxe et plans de mise en scène. Un décor éloigné peut être spectaculaire sans devenir une cible ambiguë. Une cible active possède toujours une présence identifiable sur le plan jouable.

## 3. Une boucle de mission complète

La campagne alterne préparation, progression, engagement, incident et retour. Au hangar, le joueur examine l’ordre, les informations disponibles et le terrain. Il choisit un châssis, un équipement et une route en fonction d’un besoin concret. Un quadrupède bas est rassurant dans une rue battue, mais peut manquer de portée visuelle derrière une digue. Un grand hexapode porte du matériel de secours, mais ne peut pas franchir tous les quais.

En opération, il observe avant de s’engager. Il écoute une émission, sonde un pont, identifie une unité et répartit ses appuis. Le combat combine déplacement, choix de cible, contrôle de chaleur et fenêtres de rechargement. Une arme capable d’ouvrir un char ne résout pas nécessairement la présence d’un assaillant sous la coque.

L’incident de mission met le briefing à l’épreuve. Une ambulance émet une signature hostile. Un objectif prétendument vide conserve une fenêtre allumée. Une pièce portant le bon numéro se trouve au mauvais endroit. Le joueur doit vérifier, agir et parfois accepter un coût immédiat pour ne pas obéir aveuglément.

Le retour ne consiste pas seulement à dépenser de l’expérience. L’équipage répare ce qui a été touché. Les personnes évacuées occupent une place réelle. Le rapport peut être exact, incomplet ou falsifié. Un allié demande ce qui est arrivé à sa pompe ou à ses proches. La prochaine mission hérite de ces faits.

## 4. La locomotion comme système de combat

### Les quatre phases d’un pas

Un cycle se compose de la préparation de l’appui, du transfert de masse, de la trajectoire du pied et de l’absorption du contact. Le pied posé reste lié au sol pendant que la coque avance. Le pied levé suit une trajectoire compatible avec l’obstacle et le débattement mécanique. L’arrivée produit poussière, vibration, bruit et éventuellement dégâts de contact.

Le prototype distingue déjà deux groupes d’appui, avec alternance manuelle ou assistée. Pour un bipède, ces groupes correspondent aux deux pieds; pour un quadrupède, aux diagonales; pour un hexapode, aux tripodes. Le contrôle précis d’un pied isolé, les postures réglables et les modes de marche dégradée constituent des extensions de production, pas des fonctionnalités à considérer comme achevées.

### Les choix d’appui

Un petit pas conserve davantage de stabilité mais allonge l’exposition. Une grande enjambée franchit plus vite un espace battu, au prix d’une articulation vulnérable. Reculer permet de sortir d’une ligne de tir sans offrir immédiatement le dos. S’ancrer améliore la précision et l’absorption du recul, mais rend prévisible la prochaine position.

Le sol doit fournir des informations utiles. Une passerelle possède une charge admissible. La vase exige une grande surface de pied. Une croûte de scories peut cacher une galerie. La glace transmet les vibrations à un prédateur. La mise en scène doit annoncer ces propriétés par matière, son, fissure, instrumentation ou observation locale.

### Soutenir un chantier

MI06 donne une fonction matérielle à l’ancrage. La machine doit être immobile au repère, tous les pieds posés dans la bande de soutien. Cette posture maintient un panneau pendant qu’un technicien achève son verrou. La proximité seule ne suffit pas. Lever un groupe ou repartir retire le soutien; un verrou achevé permet de quitter le poste.

Les deux techniciens se déplacent réellement et peuvent être perdus. Des abris destructibles interceptent les projectiles. Sans intervenant, un étai manuel conserve une issue plus longue, y compris après la destruction du panneau. L’étai sécurise un passage sans rendre intacte la structure détruite. Le [contrat MI06](CAMPAIGN_MISSION_06.md) fixe les durées et conditions locales.

Le même niveau distingue un appel de secours et une arrivée. Dix habitants nouveaux, répartis dans deux maisons, rejoignent un abri sous le risque des tirs. Une personne arrivée sort des collisions; sa maison peut ensuite être perdue. Le choix du circuit ne déplace pas ces personnes. Cette séparation rend possible un bilan où tous les habitants sont sauvés et où leurs deux logements restent inhabitables.

### Un passage doit être praticable

MI07 utilise l’état conservé du panneau de MI06. Un verrou achevé, sans étai et avec une fatigue inférieure à 65 ouvre la route principale. Dans les autres cas, l’ambulance prend une voie secondaire plus longue. Un survivant du chantier n’aide pas par le seul fait d’exister dans le dossier : un échange réel doit établir sa contribution.

L’Ambulance Quai introduit quatre patients, une conductrice et un soignant. L’appel d’arrêt, l’accord à l’examen, le constat de la caisse et le démontage du boîtier sont des actions différentes. Le marquage hostile transmis par Holt ne remplace pas une inspection. Une source détruite garde une issue de constat, avec les données effectivement obtenues avant sa perte.

Le choix conduit au poste médical impérial ou à l’accueil civil. Le véhicule doit encore rejoindre cette destination. L’arrivée des personnes et la disponibilité de l’ambulance sont des résultats distincts; la récupération de sa balise ne prouve pas l’identité de celui qui l’a posée. Le [contrat MI07](CAMPAIGN_MISSION_07.md) précise ce fonctionnement. Le modèle reste routier; les capacités amphibies conçues de VE02 ne sont pas livrées par cette mission.

### Les avaries

La cible finale distingue coque, cockpit, armes, réacteur, articulations et pieds. Une jambe endommagée raccourcit le pas ou ralentit son retour. Une optique touchée modifie le renseignement disponible. Un radiateur perdu change la cadence de tir possible. La réparation n’efface pas automatiquement une fracture complète au milieu d’une rafale.

Dans le prototype, les impacts bas peuvent réduire l’intégrité d’une patte et influencer la marche ou la stabilité. La 0.5 ajoute un radiateur arrière dont l’intégrité est touchée par les projectiles qui rencontrent sa zone propre. Son facteur de refroidissement varie de 35 à 100 %. La commande T lance une réparation de quatre secondes immobile, rendant jusqu’à soixante points avec un kit consommé uniquement à l’achèvement. Tirer, bouger ou subir un nouveau dommage interrompt le travail. Deux kits sont disponibles par nouvelle sortie; une reprise conserve les stocks. Les caisses ne réparent pas ce composant. La perte complète d’un membre, les cascades de panne et une avarie équivalente sur un ennemi restent à produire.

## 5. Une flotte qui change réellement la façon de jouer

| Architecture | Châssis | Identité de conduite | Contrepartie principale |
| --- | --- | --- | --- |
| Bipède haut | **WK01 — Vigie M-12** | Grandes foulées, bonne observation, canon au-dessus des obstacles bas. | Deux articulations exposées; le tir lourd exige de préparer ses appuis. |
| Bipède bas | **WK02 — Caracal C-5** | Mobilité dans les rues et passages sous les installations. | Peu de charge utile et franchissement vertical limité. |
| Bipède très haut | **WK03 — Héron H-15** | Observation et tirs précis depuis des lignes élevées. | Grande silhouette et forte sensibilité aux déséquilibres. |
| Bipède compact | **WK04 — Linceul L-7** | Approche discrète, appuis amortis, rupture de capteurs. | Armure légère; tirer longtemps détruit la discrétion thermique. |
| Quadrupède bas | **WK05 — Bastion Q-40** | Rectangle d’appui large, blindage et soutien de convoi. | Largeur et lenteur, vulnérabilité aux tirs plongeants. |
| Quadrupède haut | **WK06 — Arpenteur A-17** | Fossés, digues et transport de matériel de secours. | Membres exposés et virages difficiles entre câbles et passerelles. |
| Quadrupède amphibie | **WK07 — Loutre LT-6** | Gués, vase et pied déployable. | Immersion limitée; aucune capacité de sous-marin improvisée. |
| Quadrupède de siège | **WK08 — Cataphracte CT-13** | Ancrage lourd et ouverture de fortifications. | Installation lente et dépendance au ravitaillement. |
| Hexapode moyen | **WK09 — Pèlerin H-6** | Endurance, deux tripodes et terrain fragmenté. | Entretien de six membres et large empreinte. |
| Hexapode très bas | **WK10 — Cloporte CL-4** | Tunnels, déminage et protection supérieure. | Très faible ligne de vue et obstacles hauts difficiles. |
| Hexapode très haut | **WK11 — Mégalithe MG-22** | Artillerie de secteur et charge utile lourde. | Masse incompatible avec de nombreuses infrastructures civiles. |
| Hexapode de secours | **WK12 — Noria N-9** | Nacelle, treuils et évacuation sous protection. | Capacité offensive réduite; chargement à l’arrêt. |

Les douze châssis sont conçus dans la bible. Le prototype propose **Vigie, Caracal, Bastion, Arpenteur, Pèlerin et Cloporte**. Ces six modèles disposent de géométries, allures, coques et paramètres d’armement distincts. Les tunnels, le franchissement spécial, les postures variables, la marche après perte complète d’un membre et les modules de secours restent à produire. Les dimensions fictionnelles de la bible sont des intentions d’échelle; les dimensions du moteur sont des unités de rendu et de collision. Elles ne doivent pas être confondues dans un calcul de masse ou de vitesse.

La personnalisation ne doit pas transformer chaque châssis en couteau suisse identique. Les emplacements, contraintes de poids, plages de hauteur et possibilités de refroidissement préservent leur personnalité. Une nacelle sanitaire occupe la place d’un râtelier. Un radiateur plus efficace rend la machine plus visible. Des semelles de marais ralentissent la rotation.

## 6. Armes, menaces et rencontres

La bible décrit dix-huit familles d’armes et seize modules. Les autocanons traitent les cibles légères. Les armes de brèche demandent un appui stable. Les rails privilégient une pièce précise. Les brouilleurs, fumigènes et plaques mobiles permettent de gagner une fenêtre sans tout détruire. Les outils de traction, de découpe et de secours prolongent le même système de points d’ancrage.

Les armes primaires du prototype sont des variantes de validation de la famille **AR01 — Touraille**. Leurs différences de cadence, magasin et chaleur servent à comparer les six machines. Chaque sortie commence avec un magasin chargé et une réserve de huit magasins. Recharger transfère uniquement les cartouches disponibles vers les places libres; le dernier chargement peut être partiel. Une caisse ajoute au plus trois magasins de réserve et deux roquettes dans les plafonds prévus, avec les soins de terrain déjà présents. Elle est consommée une seule fois, y compris après une reprise. La dotation revient au départ d’une nouvelle sortie; l’inventaire de munitions au hangar et l’économie intermissions restent à réaliser.

Une bonne rencontre pose une question de pilotage. Face à une équipe antichar, faut-il se poser immédiatement ou casser sa ligne de vue? Face à une barge qui tend un câble, faut-il couper le harpon ou avancer pour détendre la traction? Face à un drone, doit-on ouvrir le feu, passer sous une structure ou refroidir la machine? Face à une faune territoriale, peut-on simplement lui laisser une sortie?

Les boss doivent exploiter des pièces et un terrain, pas seulement accumuler des points de vie. Le croiseur terrestre Décret prévu pour la campagne implique canons, appuis, relais et sort de l’équipage. **Cerbère**, présent dans le prototype, est un adversaire lourd séparé : il vérifie d’abord la transition entre ordre, décision et hostilité.

## 7. L’Empire d’Orthe

L’Empire s’est imposé comme gardien des routes après des guerres de dislocation. Son pouvoir repose sur les infrastructures autant que sur les armes. Il garantit filtres, rations, communications et entretien des terraformes. Ces services existent et sauvent des vies. Leur accès devient cependant le moyen de soumettre les communes et de rendre toute autonomie matériellement risquée.

Les marcheurs sont nés de cette logique. Ils accompagnent convois, machines de chantier et unités de contrôle à travers des terrains où les routes ne sont plus fiables. Leurs outils deviennent armes, leurs plaques deviennent boucliers et leurs nacelles deviennent postes de commandement. Les plus grands matérialisent l’autorité : ils restent visibles au-dessus d’une rue entière.

La doctrine officielle ne dit pas « conquérir ». Elle dit rétablir, sécuriser, remettre aux normes, garantir la continuité. Le vocabulaire doit apparaître dans un ordre, un formulaire ou une transmission crédible. Les habitants emploient d’autres mots pour décrire exactement la même intervention.

Les forces impériales ne constituent pas une conscience unique. Une garnison peut empêcher un pillage et obéir à une expulsion. Un officier peut douter de sa hiérarchie sans accepter la Ligue. Un mécanicien peut avoir fabriqué la pièce d’un crime avant de comprendre sa fonction. Ces contradictions donnent un poids aux preuves et aux relations.

## 8. PALINODE : la vérité horrible

PALINODE transforme la réparation en domination. Le Directoire de la Continuité et une direction d’Orison identifient des territoires qui pourraient s’affranchir de leurs contrats. Ils provoquent ou aggravent une défaillance ciblée : dérèglement de pompe, contamination, rupture de régulation, épuisement artificiel des sols. L’armée intervient ensuite au titre du secours et de la sécurité.

Les populations déplacées reçoivent un logement, de l’air ou du travail conditionnés à une dette nouvelle. Les infrastructures autonomes sont déclarées dangereuses. Les pièces de remplacement et les filtres ne sont compatibles qu’avec le fournisseur imposé. La dépendance s’accroît après chaque opération de « reconstruction ».

L’effacement des archives est délibéré. Il détruit titres d’occupation, généalogies, langues et savoirs locaux qui permettaient de revendiquer un autre avenir. Sur Ilex, cela inclut des supports vivants de mémoire Khelt. La violence n’est donc pas seulement une conséquence économique regrettable : elle retire aux communautés les moyens de se raconter et de se gouverner.

Le dossier ne tient pas à un terminal miraculeux. Il exige trois familles de preuves : **techniques**, pour expliquer ce qui s’est produit; **testimoniales**, pour identifier des personnes et des pratiques; **politiques et financières**, pour relier les actes à des décisions signées. Une source perdue peut être compensée par un autre recoupement, mais la campagne conserve le coût de cette perte.

La première anomalie jouable, **PT01**, est une copie du journal de maintenance de MI04. Elle constate qu’une pièce a été remplacée avant l’incident sur ordre militaire. Elle ne suffit pas à identifier toute la chaîne de décision. Si le poste est détruit avant la lecture, le joueur peut constater les ruines et terminer la mission sans la preuve. Une copie déjà acquise survit à la destruction de l’original. Le choix final porte sur le rapport transmis et ne supprime pas cette copie. Le recoupement ultérieur par PT03 reste conçu.

## 9. Des factions aux intérêts distincts

La **Ligue des Rives** réunit communes, refuges et combattants qui veulent maintenir l’eau et la nourriture sans dépendre de l’Empire. Son aile pragmatique cherche des défections et des preuves. Ses radicaux veulent rendre la violence. Le joueur doit parfois empêcher un allié de commettre ce qu’il combattait auparavant.

Le **Consortium Orison** dispose de techniciens indispensables, de contrats et d’une sécurité privée. Tous ses employés ne connaissent pas PALINODE. Les ingénieurs qui découvrent le détournement de leurs machines constituent des témoins autant que des spécialistes dont la coalition a besoin.

La **Flotte des Brisants** regroupe des équipages et non une moralité unique. Certains vivent de rançons et de trafic de personnes. D’autres transportent clandestinement des familles. La relation se construit avec des capitaines identifiés; un service rendu à l’un ne blanchit pas les crimes d’un autre.

Les **Accords Khelt** unissent des cités autonomes. Ils ne parlent pas d’une seule voix. Leur technologie s’est développée autour des vibrations, des structures minérales et de mémoires matérielles. Ils possèdent ingénieurs, diplomates, marchands et militaires. L’hostilité d’une unité dépend d’une frontière, d’un accord et d’une expérience, pas d’une nature supposée de l’espèce.

Les **Gardiens du Sillon** défendent les ressources de Méridien. Les **Compagnies de secours libres** protègent un accès aux soins que tous les camps essaient parfois d’utiliser. Le **Directoire de la Continuité** organise les disparitions et les purges. La **Cohorte des Serments** transforme les meilleurs pilotes de l’Empire en poursuivants capables de lire les habitudes de Sera.

## 10. Huit planètes et quatre actes

| Acte | Mondes | Question dramatique | Transformation jouable |
| --- | --- | --- | --- |
| I — Le poids de l’ordre | Vesper et Nacre | Que protège réellement notre intervention? | Apprendre à distinguer cible, infrastructure et personne protégée. |
| II — Le coût du silence | Thyr et Kharon | Que fait-on d’un fait qui contredit la mission? | Enquêter sous surveillance, préserver les preuves, préparer une fuite matérielle. |
| III — La fracture | Sereis et Ilex | Qui accepte de vous croire, et à quelles conditions? | Survivre sans dépôts impériaux, protéger les témoins et respecter les accords. |
| IV — Une autre marche | Méridien et Orthe | Peut-on renverser un pouvoir sans reproduire sa méthode? | Maintenir les services, tenir ses pactes et distribuer les preuves sans s’approprier les peuples. |

Chaque monde possède quatre missions principales et deux contrats. Les planètes ne sont pas interchangeables. Nacre met en jeu l’eau, les quais et les passages. Thyr fait lire les relations entre racines, habitats et migrations. Kharon confronte le joueur à sa chaleur et à la provenance de ses pièces. Sereis impose une fragilité sous les pieds. Ilex demande d’écouter. Méridien oblige à protéger ce qui nourrit. Orthe réunit la monumentalité de l’État et la vie ordinaire de ceux qui y habitent.

La campagne complète est détaillée dans [CAMPAIGN_FR.md](CAMPAIGN_FR.md). Les trois opérations du prototype condensent certaines de ses questions pour valider les systèmes. Elles ne doivent pas être utilisées pour calculer le nombre de missions finales achevées.

## 11. Sera et son équipage

Sera Vey est une pilote fiable avant d’être une rebelle. Elle sait tenir une ligne, protéger un convoi et ramener sa machine. Sa faille consiste à prendre l’obéissance pour une forme suffisante de responsabilité. Son évolution ne la transforme pas en juge omniscient : elle apprend à vérifier, à écouter ceux qu’elle domine physiquement et à rendre compte de ses actes.

Tess Ardan, sa mécanicienne, exprime les problèmes par leurs conséquences matérielles. Elle sait où une pièce casse et combien de temps une réparation tient. Découvrir que son savoir a servi à dissimuler un sabotage la force à choisir ce qu’elle accepte désormais de réparer.

Le major Daren Holt croit à la chaîne de commandement parce qu’il l’a vue sauver des vies. Il peut être personnellement courageux et politiquement dangereux. Sa confrontation finale doit conserver cette difficulté : reconnaître un crime ne signifie pas savoir accepter un autre ordre social.

Ilan Rusk veut rentrer avec un nom honorable auprès de sa famille. Mara Eren veut des lits, des routes et des personnes vivantes. Nima Sol exige une preuve recoupable. Leth demande que sa culture ne devienne pas seulement une pièce dans une histoire humaine. Chacun doit pouvoir remercier Sera pour un acte et lui en reprocher un autre sans contradiction artificielle.

Mara intervient à la radio après l’inspection des seuils de MI06; un appel facultatif de MI07 lui transmet réellement le relevé compilé, y compris un constat de perte. Le prototype ne simule pas un personnage physique Mara exposé aux tirs et ne la recrute pas. Un contact accompli ne vaut ni accord des patients à témoigner, ni confiance générale, ni engagement à rejoindre Sera. Un membre du personnel peut donner séparément son consentement à témoigner; cet accord garde l’identité de son auteur et sa disponibilité dépend de sa survie.

## 12. Choix, confiance et fins

Il n’existe pas de barre universelle du bien. Le jeu suit la qualité des preuves, la confiance de personnes précises, les services maintenus, les personnes évacuées, l’état de l’équipage, les pactes tenus et la portée de la diffusion. La confiance de Mara ne rachète pas une archive détruite aux yeux de Leth. Une victoire militaire ne répare pas une pompe détruite.

La campagne raconte une défection. La liberté du joueur détermine sa préparation, ses coûts, ses alliés et son issue; elle ne promet pas un arbre infini où toutes les allégeances resteraient disponibles jusqu’à la dernière seconde. Les variantes doivent rester vérifiables et assez profondes pour se voir dans les missions suivantes.

Les quatre familles de fins sont **Les communes debout**, **La vérité sous les décombres**, **Un autre uniforme** et **Ceux qui ont traversé**. Elles combinent résultat militaire, vérité publique, continuité matérielle et autonomie des communautés. Des épilogues locaux montrent le quai, le verger, l’atelier ou la rue déjà connus. Les pertes ne disparaissent pas derrière une médaille finale.

### Une dépense qui reste une dépense

La réserve de MI05 apporte deux lots seulement si elle a été collectée. Dans MI06, un branchement auxiliaire achevé les consomme. La campagne inscrit ce coût immédiatement, même si la sortie se termine ensuite par une défaite. Le prochain départ garde le stock restant et une voie manuelle sans carburant. Une relecture simule ses ressources dans un état isolé et ne modifie pas le dossier officiel.

Le stock actuel, la dépense cumulée et la consommation d’une sortie ont des sens différents. Un rapport victorieux peut indiquer zéro lot utilisé alors qu’une tentative précédente en a dépensé deux. L’atelier conserve cette histoire sans réécrire le rapport. Ce premier usage local ne livre pas une économie commerciale complète.

## 13. Une production contrôlable

Le prototype est une base web portable qui sépare contenu, simulation, rendu, interface et audio. Il permet de tester le pilotage et les décisions sur plusieurs opérations. Les tests de simulation ne remplacent ni les essais manuels, ni les tests d’accessibilité, ni la validation de la campagne complète.

Le prochain jalon de qualité doit être **MI01 entièrement finalisée**, du briefing au retour au hangar. Il doit réunir animation mécanique, environnement, objectifs, civils, dialogue, son et mesure de performance. Produire huit planètes avant de réussir ce niveau rendrait les corrections très coûteuses.

Après ce jalon, le travail se découpe par actes et par familles de systèmes. Les douze châssis, les trente-six types d’ennemis, les dix-huit véhicules, les vingt-quatre espèces animales et les vingt-quatre espèces végétales constituent un catalogue de conception. Leur présence dans le classeur ne vaut pas livraison d’animations, d’IA ou de niveaux.

L’estimation de calendrier et de financement doit être fondée sur la vitesse de production observée pendant ce niveau de référence. Les disciplines à couvrir sont programmation, conception de niveaux, animation mécanique, environnement, personnages, effets, interface, écriture, audio, QA et production. Le budget, l’équipe et les plateformes de sortie ne sont pas engagés par cette bible.

## 14. Utilisation de la bible Excel

La version 0.8 du classeur contient 769 fiches dans vingt feuilles de contenu source, plus une synthèse. Les 705 identifiants de la 0.7 restent présents. Les IDs permettent de relier une mission à sa planète, un système à une validation ou un châssis à son armement. Les textes sont volontairement concrets : une ligne de production possède un livrable et un critère de clôture.

**Conçu** signifie spécifié; **Prototype** signifie présent dans la portée détaillée de l’onglet éponyme; **À produire** désigne le travail identifié mais non livré; **Vérifié** doit toujours se rapporter à un contrôle réellement exécuté. Un test prévu dans QA ne devient pas vérifié parce que le code existe. Un asset illustré ne devient pas une animation intégrée parce qu’il est beau.

La source structurée, les documents narratifs, le code et le rapport de validation doivent évoluer ensemble. C’est cette cohérence qui permettra de développer le projet au-delà de la première version sans perdre la direction du jeu.
