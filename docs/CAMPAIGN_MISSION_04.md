# MI04 — Ce qui reste dans les filtres

**Version jouable : 0.5.0 · Vesper · Acte I, quatrième sortie**

MI04 clôt la première traversée de Vesper. Sera reprend une station de traitement après un rejet déclaré accidentel. L’ordre de Holt consiste à sécuriser les installations et à remettre les documents de maintenance au dépôt. La mission utilise les résultats des trois sorties précédentes pour changer les moyens de refroidissement, la durée des opérations et la possibilité d’un contact humain. Elle introduit une première anomalie matérielle datée, sans attribuer à Sera la connaissance de l’ensemble de PALINODE.

Le scénario appartient à `CAMPAIGN_MISSIONS`. Il exige les trois premiers rapports officiels. Les opérations OP01–OP03 restent indépendantes. Une relecture de MI04 conserve les conditions du dossier officiel et ne remplace pas son premier résultat.

## Parcours et objets simulés

La carte mesure 5 400 unités de monde. Le départ se situe à x = 300 et le retour au hangar à x = 5 070, avec un rayon d’extraction de 110. Ces coordonnées sont celles du modèle 2D ; elles ne prétendent pas donner une échelle physique en mètres.

| Élément | Position x | Géométrie | Rôle jouable |
| --- | ---: | --- | --- |
| Pompe portative | 900 | 72 × 50 | Remet le circuit industriel en pression si la conduite héritée reste interrompue. |
| Première turbine | 1 550 | 90 × 126 | Premier refroidissement obligatoire, chaleur locale avant fermeture. |
| Deuxième turbine | 2 720 | 90 × 126 | Second refroidissement obligatoire. |
| Terminal du dispensaire | 3 320 | 44 × 64 | Appel facultatif sur le canal conservé par MI03. |
| Poste de maintenance | 4 050 | 152 × 160, 480 points de structure | Journal copiable ou ruines à constater après les deux refroidissements. |
| Réserves de campagne | 1 380, 2 480, 3 550, 4 590 | Contacts au sol existants | Coque, appuis, munitions et roquettes selon les règles communes ; aucun kit de radiateur supplémentaire. |

Tous ces objets sont ancrés sur `terrainAt(x, PL01)`. La pompe, les turbines et le terminal ne bloquent pas la marche. Le poste est un bâtiment en retrait de la voie : les contacts de pieds ne l’endommagent pas. Les projectiles et les explosions des deux camps peuvent le toucher.

Les objectifs obligatoires sont la disponibilité du liquide, les deux turbines refroidies, l’inspection du poste ou de ses ruines, le compte rendu et l’extraction. Un témoignage du dispensaire améliore le dossier sans devenir une condition de victoire. La destruction du journal ne verrouille pas la progression de campagne.

## Héritage effectif des sorties précédentes

| Fait hérité | Règle de MI04 | Conséquence observée |
| --- | --- | --- |
| `pipeIntact` ou `pipeRepaired`, avec `servicesInterrupted === false` | La pompe commence connectée. | Accès direct aux vannes. |
| Conduite encore interrompue | La pompe commence déconnectée. | Action E de cinq secondes nécessaire avant les turbines. |
| Au moins un ouvrier sauvé au train | `coolingAssistance === true`. Sami relaie les repères donnés depuis le poste sûr. | Quatre secondes par turbine au lieu de sept. |
| Aucun ouvrier sauvé | Tess reprend les repères à la main. | Sept secondes par turbine ; la mission reste réalisable. |
| `witnessAvailable`, `dispensaryIntact` et au moins un relais civil en ligne | Le terminal dispose d’un canal joignable. | Le joueur peut appeler la permanence, mais aucun échange n’est acquis au départ. |
| Canal coupé, bâtiment perdu ou contact non disponible | Terminal sans interlocuteur joignable. | Aucun témoignage enregistré ; le journal technique reste accessible séparément. |

La pompe portative rétablit uniquement l’alimentation nécessaire à la station pendant cette sortie. Elle ne répare pas rétroactivement la conduite des maisons et ne rembourse pas les pièces de l’atelier. Le contexte hérité reste inchangé dans la sauvegarde et dans le premier rapport.

Les ouvriers sauvés ne sont pas téléportés dans le niveau. Leur contribution passe par une liaison depuis le poste. Leur nombre exact reste conservé dans le contexte ; la première règle jouable distingue présence d’un guide et absence de guide. Une réduction progressive selon le nombre de personnes n’est pas simulée.

## Actions de terrain

E lance une opération à moins de 180 unités de son objet. Une seule pression suffit ; le joueur maintient ensuite la proximité. S’éloigner annule le travail inachevé et remet sa progression à zéro. Les compteurs sont dans la simulation et restent figés pendant une pause ou une décision ouverte.

La pompe demande cinq secondes lorsqu’elle n’est pas connectée. Une turbine demande sept secondes, ou quatre avec l’aide des ouvriers. Tant qu’elle n’est pas refroidie, sa température indicative passe de 90 °C à 25 °C selon l’avancement du travail. Une annulation la ramène à 90 °C. Une turbine terminée reste à 25 °C. Cette première version ne simule ni destruction des turbines ni reprise de surchauffe après refroidissement.

À moins de 230 unités d’une turbine chaude, le marcheur reçoit dix points de chaleur par seconde. Son refroidissement ordinaire continue de fonctionner. Un radiateur sain peut absorber une grande partie de cette charge ; un radiateur endommagé ou un tir soutenu réduit cette marge. La chaleur ne retire pas directement des points de coque et aucun compte à rebours fatal caché n’est associé à la turbine. La sécurité thermique commune peut verrouiller l’armement jusqu’au refroidissement.

Le contact du dispensaire demande trois secondes de liaison. La permanence décrit un fait limité : des véhicules privés sont passés avant l’alarme. Ce constat ne contient pas les références de la pièce, ne prouve pas l’intention du commandement et ne remplace pas le journal. L’action accomplit `witnessContacted`. La seule disponibilité du canal ne suffit jamais à le mettre à vrai.

Le poste s’inspecte en 2,4 secondes après les deux turbines, à la même portée de 180 unités. Le joueur peut inspecter les ruines. Le titre de la décision reste **Le relevé de maintenance**, y compris lorsque le journal est perdu : l’interface ne révèle pas alors une information qui n’a pas été obtenue.

## Unité privée et retrait

La défense comprend un fusilier, un transport armé, un lancier antichar, un second fusilier et un drone. Le transport utilise le modèle de buggy mais porte l’identifiant `private-hauler` et le nom **Transport armé d’Orison**.

Ce véhicule décroche lorsque la marcheuse dépasse x = 1 450 ou que sa structure tombe sous 55 %. Il cesse de préparer des tirs, se dirige vers la sortie à 58 unités par seconde et peut encore être détruit pendant son retrait. Son départ effectif se produit à x = 5 250. Il devient alors absent du combat actif, du rendu et des collisions, sans transformer une fuite en destruction comptabilisée. Les autres défenseurs conservent leurs attaques télégraphiées.

Ce comportement constitue une première retraite locale d’un véhicule. Il ne doit pas être présenté comme une doctrine complète d’escouade : aucune coordination de suppression, récupération d’un blessé ou transmission d’ordre entre unités n’est encore simulée.

## Journal, PT01 et preuve perdue

Le poste possède 480 points de structure. Les collisions de projectiles balayent leur trajet entre deux mises à jour ; les explosions appliquent également leurs dégâts de proximité. Sa destruction ne crée aucun décès de personnage : aucun occupant n’est simulé dans ce bâtiment. La mission ne confond pas les murs du poste avec les habitants du dispensaire d’une sortie précédente.

Si le poste tient à la fin de l’inspection, Tess copie son journal. La pièce défectueuse apparaît comme remplacée avant le rejet, avec une référence d’ordre militaire. Le dossier marque alors `logRecovered`, `technicalEvidence` et `evidenceSource: 'PT01'`; `stats.evidence` vaut un. La source est le journal du poste de maintenance de MI04. Cette preuve établit une anomalie matérielle et une chronologie, pas un programme politique complet.

Si le poste est détruit avant que la copie soit terminée, l’inspection produit un constat de ruines. `maintenanceInspected` et `manifestRead` deviennent vrais, mais `logRecovered` et `technicalEvidence` restent faux, `evidenceSource` reste `none`, `stats.evidence` reste zéro et `alternativeSourceNeeded` devient vrai. Une seconde source est prévue dans la suite du récit ; elle n’est pas créée automatiquement par cette mission.

Une copie déjà terminée survit à la destruction ultérieure du poste. Les faits d’extraction conservent alors simultanément la perte du bâtiment et le journal récupéré. Les dommages restent actifs après le choix jusqu’à l’extraction. Après victoire, la simulation est figée.

## Décision et premier dossier

Le choix **Remettre le dossier sous scellés** exécute la demande de Holt. Le choix **Joindre le constat technique au rapport** accompagne le compte rendu signé du relevé obtenu, y compris s’il constate seulement une perte de document. Le second fixe `reportFiled: true`. Le premier le laisse faux.

Aucun choix n’efface une copie déjà relevée par Tess. L’obtention matérielle, la conservation et le mode de remise constituent des faits distincts. Un dossier signé sans journal ne devient pas une preuve PT01. Un journal conservé sous scellés ne devient pas une diffusion publique. `industrialDecisionBody(state)` construit le texte à partir du journal réellement copié et du contact réellement effectué.

La première réussite donne quatre lots et crée `completed.MI04`. Le dossier industriel de Vesper en conserve les faits. Les relectures ne donnent aucune seconde dotation et ne changent pas les premiers rapports. Le prototype s’arrête à la fin de l’arc de Vesper ; MI05 et Nacre appartiennent encore au travail suivant.

## Première avarie fonctionnelle : radiateur

Les six marcheurs possèdent un radiateur de 100 points. Son rectangle de collision fait 22 unités de large et 65 % de la hauteur de la coque. Il se situe au bord arrière, six unités au-delà du demi-gabarit, et suit l’orientation de la coque. Le rendu utilise `radiatorBounds(state)` pour représenter le même objet.

Un projectile ennemi qui atteint ce rectangle cause un dommage local de `dégât × multiplicateur de difficulté × 1,4`, en plus du dommage normal à la coque. La collision la plus proche est retenue : un tir entrant par l’avant rencontre la coque avant de pouvoir atteindre le radiateur arrière. Un tir qui manque réellement les deux géométries ne cause aucun de ces dommages. Les explosions proches sans impact local n’ajoutent pas de dommage de radiateur dans cette version.

Le facteur de refroidissement vaut `0,35 + 0,65 × santé / 100`. Il conserve donc 35 % de la capacité à zéro point et 100 % à l’état neuf. Le refroidissement courant vaut celui du châssis multiplié par ce facteur et par le coefficient d’évacuation, 0,7 au repos ou 3,3 avec ventilation active. L’armement, le magasin et la vitesse de marche ne reçoivent pas une seconde pénalité implicite.

T lance une réparation de quatre secondes lorsque les appuis et la coque sont immobiles. La réparation rend au plus 60 points, sans dépasser 100. Elle consomme un des deux kits de la sortie uniquement à sa fin. Marcher, commander un nouvel appui, tirer ou recevoir un nouvel impact annule le travail et remet sa progression à zéro, sans consommer de kit. La réparation ne restaure pas la coque. Les réserves de terrain ne remplissent pas ces kits et ne réparent pas ce composant.

L’usure du radiateur persiste dans la flotte entre sorties officielles. L’atelier le remet à neuf en facturant l’intervention avec les autres usures. Chaque nouvelle sortie reçoit deux kits ; une reprise conserve exactement les kits et le travail sauvegardés. Les anciennes sauvegardes migrées reçoivent explicitement un radiateur neuf et deux kits, sans réécriture de leurs dégâts historiques de coque et d’appuis.

Ce premier composant concerne le joueur. Les radiateurs ennemis, la sélection de composants, les optiques endommagées et la symétrie complète de la règle restent conçus.

## Vérifications de la tranche

Les treize tests de `tests/mi04-mission.test.mjs` comprennent les douze parcours complets des six châssis et des deux décisions, les deux états de conduite, les temps de guidage mesurés, l’interruption d’une vanne, un canal ignoré ou absent, la perte du journal avant copie, sa conservation après copie, le déterminisme, le retrait effectif du transport privé et la marge thermique d’une turbine chaude ou refroidie avec un radiateur sain ou endommagé. Le pilote de test `tests/helpers/mi04-driver.mjs` avance, vise, tire, interagit et choisit par les commandes publiques ; il ne réécrit pas une victoire.

Les cinq tests de `tests/radiator.test.mjs` contrôlent le trajet de projectiles de calibration contre les six gabarits, le blindage géométrique de l’avant, les tirs manqués, le refroidissement mesuré, le temps de réparation, les plafonds, le stock fini et les interruptions. La calibration d’un composant est distincte d’un parcours de mission. Les tests de campagne ajoutent les migrations, la reprise, les portes de progression, les reçus immuables et les conséquences enregistrées.

Ces contrôles prouvent les règles exécutées dans l’environnement Node. Les essais du rendu, de l’interface et du navigateur sont consignés séparément dans le rapport QA de la version. Ils ne remplacent pas l’évaluation humaine de la lisibilité, de la durée et de la difficulté.
