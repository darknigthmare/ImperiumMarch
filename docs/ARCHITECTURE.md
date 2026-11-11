# Architecture de la version 0.5

## Intention

Cette tranche confronte le cœur de jeu à des règles exécutables : des appuis qui portent un châssis, des tirs qui partent de sa tourelle, des cibles qui répondent et des objectifs qui demandent une action. Le navigateur est le support de cette première tranche pour faciliter le partage. Aucun choix de moteur de production définitif n’est présenté comme acquis.

Le jeu fonctionne sans bibliothèque externe. Il peut être lancé en modules depuis un serveur local ou regroupé dans un fichier HTML autonome. Les outils Excel et les aperçus Skia utilisent des dépendances séparées de développement ; elles ne sont pas nécessaires pour jouer.

## Modules

| Fichier | Responsabilité |
| --- | --- |
| `src/content.mjs` | Six marcheurs, trois opérations, MI01, MI02, MI03 et MI04, difficultés et définitions ennemies. |
| `src/simulation.mjs` | État de mission, mouvement, appuis, combat, interactions, objectifs, événements et résultat. Aucun DOM. |
| `src/campaign.mjs` | Dossiers MI01/MI02/MI03/MI04, progression, migrations v1/v2/v3 vers v4, validation, checkpoints, restauration, attribution unique et réparations. Aucun DOM ; stockage fourni explicitement. |
| `src/renderer.mjs` | Canvas 2D : cinématique inverse des jambes, châssis, ennemis, environnement, particules et repères spatiaux. |
| `src/audio.mjs` | Sons procéduraux déclenchés par les événements, déverrouillés par un geste utilisateur. |
| `src/main.mjs` | Cinq écrans, entrées, HUD, dialogues, dossier de campagne, atelier, import/export et autosauvegarde. |
| `src/style.css`, `src/ui.css` | Habillage des menus, hangar, réglages et affichage en mission. |
| `data/bible.json` | Contenu de conception, liens d’IDs, backlog et états de production. |

## Marche

La coque suit son ensemble d’appuis. Un groupe se lève tandis que l’autre conserve ses contacts au sol. Les bipèdes alternent leurs pieds, les quadrupèdes leurs diagonales et les hexapodes leurs tripodes. Un pied planté conserve sa position monde. Sa trajectoire de levée relie son ancien contact à sa cible, calculée sur le profil du terrain.

Le rendu dessine les segments articulés entre la coque et les pieds réels ; il ne déplace jamais une cible de collision pour obtenir une pose plus jolie. L’ancrage empêche une nouvelle foulée. L’intégrité des articulations modifie la marche, mais aucune patte n’est encore définitivement arrachée : le prototype borne sa santé minimale et conserve un moyen de finir la mission.

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

## Avarie de radiateur

`player.radiator` contient santé, plafond, kits, plafond de kits, progression normalisée et travail actif. `radiatorBounds(s)` fournit la boîte exposée à l’arrière de la coque, selon son orientation. Le rendu réutilise cette géométrie et oriente la coque ; les pieds gardent leurs contacts monde et la tourelle sa propre visée. Un projectile est résolu sur son premier contact balayé. Une coque touchée frontalement ne laisse pas atteindre le radiateur situé derrière elle.

La dissipation vaut `0.35 + 0.65 * health/maxHealth`. La ventilation conserve son multiplicateur. T demande quatre secondes sans marche, tir ni nouvel impact, tous les pieds au sol et vitesse résiduelle au plus 3. L’achèvement restaure au plus 60 points et débite un kit ; une interruption n’en consomme aucun. La reprise conserve le travail exact, l’atelier facture le composant et les caisses ordinaires ne le réparent pas. Il s’agit du premier composant du joueur ; son pendant ennemi reste conçu.

## Rendu et assets

La scène de mission a une taille logique de 1600 × 900 et le hangar de 960 × 480. Le Canvas s’adapte à une densité de pixels bornée à 2. La caméra suit la coque ; la conversion de la souris s’effectue via le rectangle réel du Canvas et l’offset caméra. La mise en page conserve un cadre 16:9 pour le jeu.

Vesper utilise un panorama peint généré pour le projet. Nacre et Thyr utilisent des plans procéduraux distincts ; les machines et unités sont dessinées avec des primitives Canvas articulées. Cet art est un langage de prototype, et la bible artistique spécifie les assets de production à venir.

Les images générées sont conservées avec leurs prompts dans `docs/ASSET_PROVENANCE.md`. Le bundle autonome embarque leur contenu encodé, ainsi que l’emblème et les styles. Il ne dépend pas de CDN, de polices distantes, de comptes ou de services de sauvegarde.

## Sauvegarde

Les clés locales séparent les anciens réglages/rapports de la campagne :

- `imperium.settings.v1` : difficulté, aides, confort, volume et sélection.
- `imperium.records.v1` : dernier rapport victorieux de chaque opération.
- `imperium.campaign.v1` : dossier de campagne au format v4, mission MI01, MI02, MI03 ou MI04 en cours, point avant décision, résultats et atelier.
- `imperium.campaign.v1.backup` : précédent dossier complet validé.

`campaign.mjs` conserve des données JSON bornées, avec vérification du format, de la version, des IDs et des structures de simulation. L’interface sauvegarde toutes les huit secondes simulées, à la pause, au retour, avant/après une décision et lors des événements de fermeture disponibles. La graine, le générateur, les projectiles et contacts sont inclus. Une fermeture brutale peut perdre les secondes postérieures à la dernière écriture.

`parseCampaign` migre les formats historiques v1, v2 et v3 vers v4. Les étapes conservent les rapports, ressources, états de mission et stocks antérieurs. V1 reçoit les champs ferroviaires ; v1/v2 reçoivent le dossier de communications, les trois nouveaux châssis et huit magasins en réserve. La migration v3→v4 ajoute le dossier industriel vierge, le radiateur à 100 dans la flotte et les checkpoints, deux kits et aucun travail de réparation lancé. Les fixtures historiques sont produites par leurs révisions d’origine : la v3 provient de `c81a360`. Aucune n’est réécrite depuis le code actuel.

Le contexte de MI04 copie les faits du monde validé au départ. Le reçu final et `world.vesper.industrial` conservent refroidissement, aide, inspection, journal, PT01, besoin d’autre source, contact effectué, rapport et état du poste. La copie d’un journal reste acquise après destruction de l’original. Le choix administratif ne la supprime pas. Le contexte du checkpoint doit correspondre au dossier officiel, ce qui empêche un import contradictoire de créer un contact ou des renforts. Les règles complètes figurent dans [CAMPAIGN_SAVE_V4.md](CAMPAIGN_SAVE_V4.md).

`nextCampaignMissionId` choisit la sortie active ou la prochaine mission disponible. L’état `complete` signifie qu’une sortie a été classée, pas que les trente-deux missions de conception sont terminées.

L’écriture principale emploie un remplacement atomique `localStorage.setItem`, précédé de la conservation du dernier dossier valide. Une panne de la deuxième écriture laisse la première copie lisible. Une corruption JSON permet le repli sur une copie compatible. Une version future, un format étranger ou un dossier dépassant la taille autorisée bloque l’écrasement automatique même avec une ancienne copie valide. Créer un dossier ou importer explicitement autorise son remplacement. Ce contrôle protège des incompatibilités et corruptions ordinaires ; il ne constitue pas un système anti-triche.

Les opérations restent indépendantes. Une défaite ne valide pas une sortie. Le premier succès de chaque mission MI01/MI02/MI03/MI04 inscrit un rapport et attribue quatre lots d’atelier; les validations répétées et relectures n’en attribuent aucun. Les réparations débitent les lots disponibles, sont refusées en sortie et conservent l’incident historique. Le dossier conserve les résultats de MI01 pendant MI02. Les conséquences entre planètes et les migrations de versions ultérieures restent à développer.

## Construction autonome

`tools/build-offline.mjs` parcourt les imports nommés du point d’entrée, enveloppe chaque module dans une portée locale et intègre les ressources. Ce regroupement est volontairement limité aux formes syntaxiques du projet. Un nouvel import non pris en charge doit provoquer une erreur et être traité explicitement.

`tools/test-ui.mjs` compile le script autonome avec `vm.Script`, vérifie les correspondances d’IDs et l’absence de ressources distantes. Cela valide sa cohérence statique, pas l’exécution du DOM ou les interactions du navigateur.

`tools/test-ui-runtime.mjs` exécute ce même script et ses gestionnaires dans un petit modèle de DOM avec stockage simulé. Ses parcours vérifient les liaisons d’état et les transitions. Les appels Canvas y sont neutralisés ; aucune conclusion CSS, audio, téléchargement ou dialogue natif n’en découle. `tools/test-browser.mjs` fournit le contrôle Chromium séparé, disponible sur un environnement autorisé. Les résultats de la 0.5 figurent dans `docs/QA_V05.md`. Les rapports 0.2, 0.3 et 0.4 restent conservés comme historique.

## Prochaine tranche

La suite doit valider l’interface dans un navigateur autorisé et auprès de joueurs, puis produire MI05 sur Nacre : chenal, barges, treuils et traversées civiles. Le premier composant ennemi, les doctrines d’escouade, les animations définitives, l’inventaire détaillé et les conséquences entre planètes restent à développer. Aucun port vers un moteur natif n’est présumé terminé.
