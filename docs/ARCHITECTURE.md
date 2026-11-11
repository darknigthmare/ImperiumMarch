# Architecture de la version 0.7

## Intention

Cette tranche confronte le cœur de jeu à des règles exécutables : des appuis qui portent un châssis, des tirs qui partent de sa tourelle, des cibles qui répondent et des objectifs qui demandent une action. Le navigateur est le support de cette première tranche pour faciliter le partage. Aucun choix de moteur de production définitif n’est présenté comme acquis.

Le jeu fonctionne sans bibliothèque externe. Il peut être lancé en modules depuis un serveur local ou regroupé dans un fichier HTML autonome. Les outils Excel et les aperçus Skia utilisent des dépendances séparées de développement ; elles ne sont pas nécessaires pour jouer.

## Modules

| Fichier | Responsabilité |
| --- | --- |
| `src/content.mjs` | Six marcheurs, trois opérations indépendantes, six missions de campagne MI01–MI06, difficultés et définitions ennemies. |
| `src/simulation.mjs` | État de mission, mouvement, appuis, combat, interactions, objectifs, événements et résultat. Aucun DOM. |
| `src/campaign.mjs` | Dossiers MI01–MI06, progression, migrations v1/v2/v3/v4/v5 vers v6, validation, checkpoints, restauration, attributions uniques d’atelier et de carburant, réparations. Aucun DOM ; stockage fourni explicitement. |
| `src/renderer.mjs` | Canvas 2D : cinématique inverse des jambes, châssis, ennemis, environnement, particules et repères spatiaux. |
| `src/audio.mjs` | Sons procéduraux déclenchés par les événements, déverrouillés par un geste utilisateur. |
| `src/main.mjs` | Cinq écrans, entrées, HUD, dialogues, dossier de campagne, atelier, import/export et autosauvegarde. |
| `src/style.css`, `src/ui.css` | Habillage des menus, hangar, réglages et affichage en mission. |
| `data/bible.json` | Contenu de conception, liens d’IDs, backlog et états de production. |

## Marche

La coque suit son ensemble d’appuis. Un groupe se lève tandis que l’autre conserve ses contacts au sol. Les bipèdes alternent leurs pieds, les quadrupèdes leurs diagonales et les hexapodes leurs tripodes. Un pied planté conserve sa position monde. Sa trajectoire de levée relie son ancien contact à sa cible, calculée sur le profil du terrain.

Le rendu dessine les segments articulés entre la coque et les pieds réels ; il ne déplace jamais une cible de collision pour obtenir une pose plus jolie. L’ancrage empêche une nouvelle foulée. L’intégrité des articulations modifie la marche, mais aucune patte n’est encore définitivement arrachée. L’usure sous l’eau de MI05 peut faire descendre la santé d’un appui jusqu’à zéro. Les tirs conservent leur plancher historique de 15 pour un appui encore au-dessus de ce seuil, sans jamais remonter la santé d’un appui déjà davantage usé. Les règles de foulée et de cadence conservent un déplacement dégradé, sans simuler une amputation ni une immobilisation définitive.

Ce modèle est une approximation jouable en 2D. Il ne constitue pas une simulation de contraintes, de couple moteur ou de contact tridimensionnel. Les hauteurs physiques de la bible sont des objectifs de fiction et d’échelle artistique, tandis que la simulation travaille en pixels monde.

## Combat et temps

Le temps est exprimé en secondes. `updateGame` borne un delta à 0,05 seconde ; la simulation n’avance pas lorsque l’interface la met en pause, lorsqu’une décision est ouverte ou après une victoire/défaite. Les tests utilisent un pas fixe. Le jeu en affichage réel emploie le delta de `requestAnimationFrame` ; une identique suite de deltas et d’entrées, avec une même graine, reproduit les mêmes états.

Les tirs utilisent des segments balayés entre l’ancienne et la nouvelle position des projectiles. Les chargeurs se vident et se rechargent depuis une réserve finie de huit magasins au départ. Le transfert est borné par la réserve restante et les places libres : la dernière charge peut être partielle. Les caisses ajoutent au plus trois magasins de réserve dans le plafond du châssis et restent consommées après une reprise. Leur collecte ne crée pas une boucle de ressources infinies. Les roquettes ont une trajectoire directe et un stock fini. La température affichée est une charge thermique normalisée en pourcentage.

Les ennemis montrent une préparation avant leur attaque. La portée déclenche leur activité. Le convoi partage le monde et peut être ciblé. Les civils restent distincts des listes de cibles hostiles. Les pertes civiles, preuves, ordres et neutralisations sont enregistrés séparément.

MI02 ajoute un train distinct du camion d’escorte : locomotive, deux wagons et deux harpons. La simulation détient leurs positions, leurs états de santé, les temps de travail et le freinage. Le rendu lit ces valeurs. Le wagon fermé contient huit ouvriers; les dégâts peuvent tuer des occupants et détruire son registre de vente. Ni l’ouverture des portes ni une décision de rapport ne restaurent ce qui a été perdu.

## Les stations de MI03

`network.stations` contient le relais militaire, le dispensaire et les maisons : géométrie, intégrité, population, pertes, identification, vérification, coupure et sécurisation du terminal. Une vérification du bâtiment vivant sécurise sa gaine contre les appuis. Elle ne rend pas sa façade invulnérable aux projectiles. Les structures occupées se trouvent derrière la voie de service ; leur gaine vulnérable se trouve à `x + w/2 + 30`. Le rendu suit ce même emplacement.

Les tirs balayés et explosions peuvent toucher les bâtiments. Les contacts réels de pieds peuvent frapper une gaine exposée. Les pertes ne sont jamais régénérées par une décision de rapport. La quantité de circuits civils encore actifs est distincte du constat signé. Le canal d’un témoin futur exige un dispensaire vérifié, encore debout, alimenté et avec au moins un survivant ; cette condition rend possible l’appel facultatif de trois secondes dans MI04. La disponibilité et le contact effectué restent deux faits distincts.

Le contrôle de Holt s’active après six secondes cumulées de vérification civile. Son drone est préinstancié pour garder une forme de sauvegarde stable, mais reste absent des cibles de dégâts et du rendu jusqu’au déclenchement. Le reste de la simulation ne doit pas le traiter comme un ennemi présent avant cet événement. Les objectifs et le corps du rapport sont recalculés depuis les faits, y compris après un tir intervenu entre décision et extraction.

## Les installations de MI04

`industrial` détient la pompe, deux turbines, le terminal radio, le poste destructible et l’état du transport en retraite. La pompe démarre alimentée seulement si l’héritage confirme une conduite intacte/réparée avec service rétabli. Sinon, une intervention de cinq secondes alimente ce seul circuit industriel. Les ouvriers libérés ramènent les vannes de sept à quatre secondes. Le canal valide permet un appel de trois secondes ; rien ne le déclenche automatiquement.

Les turbines diffusent une charge thermique à moins de 230 unités monde jusqu’à leur refroidissement. Les interactions exigent une proximité de 180 unités ; s’en éloigner annule leur progression. Après les deux turbines, le poste se relève en 2,4 secondes. Balles et explosions peuvent le détruire. Les ruines restent inspectables sans attribuer PT01. Le transport privé peut quitter la scène vivant ; il cesse alors d’être une cible et ne donne pas de points de destruction.

## Le chenal de MI05

`channel` existe uniquement dans l’état de MI05. Il contient l’horloge de marée, deux bancs, leurs commandes de passerelle, deux treuils, deux barges, un bateau civil et un dépôt de carburant. Ces entités ne sont pas ajoutées aux états historiques de Vesper. `campaign.context` reprend seulement `technicalEvidence`, `railHostagesRescued` et `railRecordFiled` depuis le dossier officiel. MI04 doit avoir un premier rapport classé ; l’obtention de PT01 n’est pas requise pour partir vers Nacre.

`channelTideAt(elapsed)` définit un cycle de 72 secondes : basse mer 26 s, montée 10 s, pleine eau 26 s, descente 10 s. Le niveau normalisé commande deux seuils distincts : bancs praticables jusqu’à 0,45 ; navigation à partir de 0,5. La marée est mise à jour depuis `elapsed` avant les nouvelles entrées, y compris sur la frame qui ouvre une décision. Une décision active et la pause figent donc la même horloge pour le HUD, la simulation et la reprise. Le compte à rebours annonce le changement de phase ; ce n’est pas un délai de défaite.

`channelSurfaceAt(state, x)` distingue quai, passerelle, vase et banc submergé. La traction influe sur la foulée et la vitesse de coque. Les hexapodes répartissent mieux la charge sur les bancs nus ; les six châssis retrouvent une traction normale sur une passerelle. L’usure ne touche que les pieds réellement en contact avec une zone submergée. Une commande située avant chaque banc déploie son tablier en quatre secondes ; sortir du rayon de travail annule la progression. Le tablier achevé reste porté par ses pieux à toute marée. Le rendu dessine ses supports sur les mêmes hauteurs de terrain que les contacts.

Chaque tête de treuil possède ses propres collisions et 90 points d’intégrité. La détendre demande 2,5 secondes à portée ; la détruire libère également son câble. Les barges ne partagent ni cette intégrité ni leur bilan humain. Une inspection de trois secondes peut copier la facture de **Saisie**, barge abandonnée par son capitaine, ou établir une liaison avec Vann Ostre depuis **Rive-Courte**, où se trouvent quatre membres d’équipage. Des ruines peuvent être constatées sans reconstituer un document ou un témoignage perdu. Une copie et un contact déjà obtenus survivent à la perte de leur source, tandis que les pertes humaines restent comptées. Ces constats locaux ne produisent aucune nouvelle preuve PALINODE.

Le bateau transporte douze personnes. Il avance physiquement lorsque les deux câbles sont libres et le niveau d’eau suffisant ; il attend lorsque l’une de ces conditions manque. Les ennemis peuvent s’activer à proximité du bateau et le viser même si le joueur s’est éloigné. L’arrivée au dock signifie que les passagers ont débarqué : le bateau sort alors des collisions de dégâts. Une destruction avant arrivée inscrit douze pertes, sans arrivée fictive, et laisse une voie de clôture du rapport. Le bilan des passagers demeure distinct de celui de Rive-Courte.

Le dépôt du dock fournit deux lots de carburant après trois secondes de transfert. Cette action est facultative et indépendante du sort du bateau, des inspections et du choix de rapport. Un dépôt détruit avant transfert ne donne rien ; un transfert achevé ne peut pas être répété. Le fait est d’abord conservé dans l’état de mission. `finishCampaignMission` crédite la réserve officielle seulement au premier succès de MI05. MI06 peut ensuite consommer ces lots pour son auxiliaire ; aucun achat ni conversion en pièces d’atelier n’est livré.

La décision devient accessible après les deux treuils libérés, les deux barges inspectées ou constatées, le sort du bateau connu et la lecture du relevé final. Elle change la transmission du rapport, sans modifier les faits du terrain. Le [contrat de simulation](SIMULATION_API.md) décrit les champs exposés ; [QA_V06.md](QA_V06.md) précise les vérifications de cette tranche.

## Chantier des Trois-Vannes

MI06 ajoute `state.dike` uniquement à cette mission : deux maisons, dix habitants locaux, deux techniciens, deux couverts, un panneau, une auxiliaire et une vanne. Le contexte copie la réserve disponible au départ et les faits du chenal. Une traversée ouverte avec les douze passagers arrivés donne la route du quai aux techniciens ; sinon ils prennent la route haute, plus lente. Ils restent des unités exposées, qui se mettent à couvert et peuvent être perdues.

`dikeSupportReady` vérifie le châssis ancré et immobile, la coque dans une bande de 60 unités autour du repère, et tous les pieds posés dans une bande de 230 unités. Le panneau soutenu peut être verrouillé par un technicien présent. Un déplacement interrompt le verrouillage. Sans verrou possible, le joueur pose un étai au treuil en gardant ses appuis. La fatigue du panneau augmente sous charge non soutenue ; sa destruction reste inscrite même si un étai permet de continuer.

Chaque maison demande une inspection. L’évacuation ordonnée par radio fait marcher les dix habitants vers l’abri ; les menaces et tirs agissent pendant le trajet. Une personne n’est sauvée qu’après son arrivée. Le circuit impérial élève réellement l’eau après remise en service et condamne les maisons ; la dérivation protège celles qui existent encore. La décision ouvre une procédure, puis une intervention à la vanne l’accomplit. L’extraction exige le sort connu des dix habitants et, sur le circuit impérial, le niveau stabilisé.

Le raccordement de l’auxiliaire prend quatre secondes à portée et ne débite rien s’il est interrompu. À l’achèvement, la mission constate deux lots consommés. Le dossier les retire immédiatement du stock et conserve la dépense cumulée. Un échec peut être sauvegardé comme checkpoint terminal pour empêcher qu’une reprise ressuscite la sortie et restitue ses moyens. Le [contrat v6](CAMPAIGN_SAVE_V6.md) détaille les invariants et les reprises.

## Avarie de radiateur

`player.radiator` contient santé, plafond, kits, plafond de kits, progression normalisée et travail actif. `radiatorBounds(s)` fournit la boîte exposée à l’arrière de la coque, selon son orientation. Le rendu réutilise cette géométrie et oriente la coque ; les pieds gardent leurs contacts monde et la tourelle sa propre visée. Un projectile est résolu sur son premier contact balayé. Une coque touchée frontalement ne laisse pas atteindre le radiateur situé derrière elle.

La dissipation vaut `0.35 + 0.65 * health/maxHealth`. La ventilation conserve son multiplicateur. T demande quatre secondes sans marche, tir ni nouvel impact, tous les pieds au sol et vitesse résiduelle au plus 3. L’achèvement restaure au plus 60 points et débite un kit ; une interruption n’en consomme aucun. La reprise conserve le travail exact, l’atelier facture le composant et les caisses ordinaires ne le réparent pas. Il s’agit du premier composant du joueur ; son pendant ennemi reste conçu.

## Rendu et assets

La scène de mission a une taille logique de 1600 × 900 et le hangar de 960 × 480. Le Canvas s’adapte à une densité de pixels bornée à 2. La caméra suit la coque ; la conversion de la souris s’effectue via le rectangle réel du Canvas et l’offset caméra. La mise en page conserve un cadre 16:9 pour le jeu. En MI05, le HUD HTML lit directement `channel.tide` et le statut du bateau. `main.mjs` transmet `tideInstrument: false` à `renderer.render` pour masquer le panneau de marée Canvas, qui ferait doublon avec ce HUD. Les rendus Canvas seuls gardent ce panneau par défaut ; ce réglage ne modifie aucun état simulé.

Vesper utilise un panorama peint généré pour le projet. Nacre et Thyr utilisent des plans procéduraux distincts ; les machines et unités sont dessinées avec des primitives Canvas articulées. Cet art est un langage de prototype, et la bible artistique spécifie les assets de production à venir.

Les images générées sont conservées avec leurs prompts dans `docs/ASSET_PROVENANCE.md`. Le bundle autonome embarque leur contenu encodé, ainsi que l’emblème et les styles. Il ne dépend pas de CDN, de polices distantes, de comptes ou de services de sauvegarde.

## Sauvegarde

Les clés locales séparent les anciens réglages/rapports de la campagne :

- `imperium.settings.v1` : difficulté, aides, confort, volume et sélection.
- `imperium.records.v1` : dernier rapport victorieux de chaque opération.
- `imperium.campaign.v1` : dossier de campagne au format v6, mission MI01 à MI06 en cours, point avant décision, résultats et atelier.
- `imperium.campaign.v1.backup` : précédent dossier complet validé.

`campaign.mjs` conserve des données JSON bornées, avec vérification du format, de la version, des IDs et des structures de simulation. L’interface sauvegarde toutes les huit secondes simulées, à la pause, au retour, avant/après une décision et lors des événements de fermeture disponibles. La graine, le générateur, les projectiles et contacts sont inclus. Une fermeture brutale peut perdre les secondes postérieures à la dernière écriture.

`parseCampaign` migre les formats historiques v1, v2, v3, v4 et v5 vers v6. Les étapes conservent les rapports, ressources, états de mission et stocks antérieurs. V1 reçoit les champs ferroviaires ; v1/v2 reçoivent le dossier de communications, les trois nouveaux châssis et huit magasins en réserve. La migration v3→v4 ajoute le dossier industriel vierge, le radiateur à 100 dans la flotte et les checkpoints, deux kits et aucun travail de réparation lancé. La migration v4→v5 ajoute uniquement `world.nacre.passage` vierge, `resources.fuel: 0` et le nouveau numéro de format ; elle ne réécrit aucun checkpoint, reçu, stock, dommage ni état de radiateur de Vesper. Les fixtures historiques sont produites par leurs révisions d’origine : la v3 provient de `c81a360` et `tests/fixtures/campaign-v4-mi04.json` de `d7d76b61ee9e97e27c611e06905f32f70633cb8e`. Cette dernière contient un vrai dossier MI04 en cours et un dossier MI04 terminé. Aucune fixture n’est régénérée depuis le code actuel. Une version antérieure à v5 contenant déjà un résultat de Nacre, un champ carburant ou un checkpoint MI05 est refusée.

Le contexte de MI04 copie les faits du monde validé au départ. Le reçu final et `world.vesper.industrial` conservent refroidissement, aide, inspection, journal, PT01, besoin d’autre source, contact effectué, rapport et état du poste. La copie d’un journal reste acquise après destruction de l’original. Le choix administratif ne la supprime pas. Le contexte du checkpoint doit correspondre au dossier officiel, ce qui empêche un import contradictoire de créer un contact ou des renforts. Le contrat historique de ce format reste dans [CAMPAIGN_SAVE_V4.md](CAMPAIGN_SAVE_V4.md). En v5, `world.nacre.passage` et `completed.MI05` conservent les mêmes faits de passage : treuils, inspections, copies et contact, arrivées et pertes, carburant chargé et mode de rapport. Le contexte de MI05 doit correspondre aux faits officiels de Vesper ; la marée doit correspondre exactement à l’horloge du checkpoint. Avant la validation officielle de MI05, le dossier de Nacre reste vierge et `resources.fuel` reste à zéro, même si le checkpoint contient un transfert de carburant déjà effectué.

`nextCampaignMissionId` choisit la sortie active ou la prochaine mission disponible. L’état `complete` signifie qu’une sortie a été classée, pas que les trente-deux missions de conception sont terminées.

L’écriture principale emploie un remplacement atomique `localStorage.setItem`, précédé de la conservation du dernier dossier valide. Une panne de la deuxième écriture laisse la première copie lisible. Une corruption JSON permet le repli sur une copie compatible. Une version future, un format étranger ou un dossier dépassant la taille autorisée bloque l’écrasement automatique même avec une ancienne copie valide. Créer un dossier ou importer explicitement autorise son remplacement. Ce contrôle protège des incompatibilités et corruptions ordinaires ; il ne constitue pas un système anti-triche.

Les opérations restent indépendantes. Une défaite ne valide pas une sortie. Le premier succès de chacune des six missions MI01–MI06 inscrit un rapport et attribue quatre lots d’atelier ; les validations répétées et relectures n’en attribuent aucun. Les six lots initiaux et les six dotations donnent un maximum de **30 lots d’atelier avant dépenses**. Les zéro ou deux lots de carburant de MI05 sont une ressource distincte, attribuée une seule fois selon le transfert réellement accompli. Les réparations débitent les lots disponibles, sont refusées en sortie et conservent l’incident historique. Le dossier conserve les résultats de Vesper pendant MI05. Les missions du chenal et de la digue sont exécutées. MI07–MI08 doivent encore utiliser leurs conséquences ; les autres missions de la campagne restent à produire.

## Construction autonome

`tools/build-offline.mjs` parcourt les imports nommés du point d’entrée, enveloppe chaque module dans une portée locale et intègre les ressources. Ce regroupement est volontairement limité aux formes syntaxiques du projet. Un nouvel import non pris en charge doit provoquer une erreur et être traité explicitement.

`tools/test-ui.mjs` compile le script autonome avec `vm.Script`, vérifie les correspondances d’IDs et l’absence de ressources distantes. Cela valide sa cohérence statique, pas l’exécution du DOM ou les interactions du navigateur.

`tools/test-ui-runtime.mjs` exécute ce même script et ses gestionnaires dans un petit modèle de DOM avec stockage simulé. Ses parcours vérifient les liaisons d’état et les transitions. Les appels Canvas y sont neutralisés ; aucune conclusion CSS, audio, téléchargement ou dialogue natif n’en découle. `tools/test-browser.mjs` fournit le contrôle Chromium séparé, disponible sur un environnement autorisé. Les résultats et limites de la 0.7 figurent dans [QA_V07.md](QA_V07.md). Les rapports 0.2, 0.3, 0.4, 0.5 et 0.6 restent conservés comme historique. `tools/render-mi05-previews.mjs` produit séparément des images du Canvas de production depuis des états atteints par commandes publiques ; son manifeste copie profondément chaque état. Ces images ne certifient ni le navigateur ni le HUD HTML.

## Prochaine tranche

MI07 — **Une ambulance sans escorte** reste **Conçu**. La campagne jouable s’arrête après MI06 ; MI07–MI32 ne sont pas des missions exécutables. La suite doit aussi compléter les essais auprès de joueurs, le premier composant ennemi, les doctrines d’escouade, les animations définitives et l’inventaire détaillé. Aucun port vers un moteur natif n’est présumé terminé.

Le navigateur place le prompt contextuel dans le HUD HTML, au-dessus de la hauteur effective du panneau inférieur. Il transmet `interactionPrompt:false` au renderer pour éviter un chevauchement avec les jauges. Les rendus Canvas autonomes gardent leur prompt par défaut.

Le HUD de MI06 lit les faits de `state.dike` : soutien, pression, fatigue, personnes et auxiliaire. Il n’existe pas de second instrument fixe Canvas superposé. Les objets du chantier et leurs étiquettes spatiales sont dessinés depuis leurs propres états physiques.

La migration v5→v6 ajoute uniquement `world.nacre.dike` non visité et `world.nacre.fuelSpent: 0`, puis change le numéro. Les cinq anciens rapports et leurs checkpoints restent identiques. La fixture historique v5 provient du snapshot public `613c07307f2712c5fac28d9403016906e94da168`. Une MI05 encore en cours peut contenir deux lots prélevés dans son checkpoint tout en ayant zéro réserve officielle ; la migration conserve cette distinction.

L’interface sauvegarde aussi à l’achèvement du raccordement et à la défaite de MI06. Un refus du stockage laisse un avertissement visible ; cette écriture immédiate ne promet pas de persistance si le navigateur refuse l’accès. Une relecture ne modifie jamais le stock ni le premier rapport.
