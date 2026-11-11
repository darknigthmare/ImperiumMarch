# MI02 — La dette sous la poussière

**Version jouable : 0.3.0 · Vesper · Acte I — Le poids de l’ordre**

Cette mission se débloque après MI01 dans le dossier de campagne. Le Major Holt ordonne de reprendre un train de minerai détourné par un équipage des Brisants. Tess et Sami suivent Sera sur le canal de liaison. Leurs premières répliques relisent l’état de la conduite et le signalement des Cales-Basses, sans transformer ces incidents en rébellion déjà consommée.

## Parcours exécuté

1. **Rejoindre les treuils.** Deux harpons retiennent le train. À proximité d’un treuil, E engage son déverrouillage. Il faut rester dans la zone pendant le travail.
2. **Libérer le second harpon.** La locomotive se met alors en roue libre. Le déplacement et la distance à la rupture de voie sont des états de simulation.
3. **Freiner.** Rejoindre la cabine et appuyer sur E. Maintenir sa proximité pendant les quatre secondes de freinage. Une séparation excessive annule le travail et impose de le reprendre.
4. **Ouvrir le wagon.** Après arrêt du train, revenir au wagon fermé et engager l’ouverture. Les huit ouvriers de départ sont répartis entre survivants et pertes selon les dommages subis.
5. **Lire et rendre compte.** Examiner le registre embarqué. Un document détruit reste détruit. La réponse au commandement peut remettre le dossier sous scellés ou joindre les noms et le signalement au rapport.
6. **Rejoindre l’extraction.** Le retour est autorisé après les objectifs de mission et le choix du rapport. Le dossier conserve le résultat une seule fois, puis le hangar donne accès aux réparations et aux relectures.

Les ennemis et les dommages ne sont pas supprimés pour accomplir le travail. Ancrage, refroidissement, chargeur et roquettes utilisent les mêmes commandes que dans MI01. Les positions de la locomotive et des wagons doivent être prises en compte avant un tir.

## Paramètres du prototype

Les positions ci-dessous sont en pixels monde. Elles décrivent le niveau actuel et ne sont pas des dimensions physiques de la fiction.

| Élément | Valeur |
| --- | --- |
| Treuils | x = 880 et 1 570 |
| Déverrouillage | 2,5 secondes par treuil |
| Proximité du treuil | Moins de 155 unités |
| Locomotive initiale | x = 2 280 |
| Roue libre | 22 unités par seconde |
| Voie rompue | x = 4 550 |
| Début du freinage | À moins de 190 unités de la locomotive |
| Freinage | 4 secondes, annulé si la distance atteint 220 unités |
| Wagon fermé | 352 unités derrière la locomotive |
| Ouverture du wagon | 3 secondes à proximité |
| Lecture | 2,4 secondes |
| Ouvriers au départ | 8 |
| Intégrité du wagon fermé | 360 points |
| Perte du registre de vente | Intégrité du wagon inférieure ou égale à 180 points |

Le train appartient à la famille **Train Fret-Est (VE17)**. Son apparence et ses composants restent ceux d’un prototype : locomotive, wagon de minerai et wagon fermé. Les aiguillages, le dételage, les contraintes physiques des câbles et les animations finales ne sont pas implémentés.

## Dommages et compte rendu

Le wagon fermé participe aux collisions de projectiles et aux zones d’explosion. Ses pertes sont irréversibles dans la sortie. Le registre ne revient pas lorsque le joueur sélectionne une réponse plus favorable au rapport. Les sauvés, les pertes, les dégâts et le document conservé restent des valeurs distinctes. Les ouvriers déjà évacués ne restent pas dans la zone de dégâts du wagon; une copie du registre déjà relevée demeure dans le dossier si le train est endommagé ensuite.

Les identifiants de choix restent `obey` et `defy` pour la compatibilité des commandes. Ils correspondent ici à une remise du dossier scellé ou à l’ajout du signalement et des noms lorsqu’ils sont disponibles. Ce choix est enregistré dans le compte rendu de MI02. Il ne remplace ni les morts par des survivants, ni un document détruit par une preuve lisible. Si le registre a disparu et qu’aucun ouvrier n’a survécu, le rapport ne prétend pas connaître leurs identités.

MI02 documente une première rencontre avec les Brisants. Elle n’installe pas encore une alliance ou une réputation de faction globale. La preuve locale de vente des ouvriers ne constitue aucun des dossiers techniques PALINODE : `stats.evidence` reste à zéro dans cette mission.

## Contrat technique et reprise

`CAMPAIGN_MISSIONS` contient désormais MI01 et MI02. `ALL_MISSIONS` les réunit aux trois opérations indépendantes. La mission utilise toujours `createGame`, `commandGame` et `updateGame`, sans dépendance au DOM.

Le module de campagne fournit les champs `pipeIntact`, `pipeRepaired`, `noticeFiled` et `servicesInterrupted` de MI01 via `campaignContext`. Le checkpoint de MI02 conserve ce contexte avec les états du train et du combat. Au retour, le dossier ferroviaire distingue `trainRecovered`, `hostagesRescued`, `hostagesLost`, `evidencePreserved`, `recordFiled` et `brisantsEncountered`.

Le format de sauvegarde v2 migre les dossiers v1 connus. Les mêmes clés locales permettent de retrouver une partie de la 0.2 sur la même adresse. Changer d’adresse web, de navigateur, d’appareil ou de fichier autonome peut changer le stockage disponible : l’export/import conserve un moyen de transfert explicite.

La dotation de MI02 vaut quatre lots d’atelier, attribués seulement au premier succès officiel. Une défaite, une relecture ou une seconde validation ne donne aucun lot et ne réécrit pas le premier bilan. Le dossier MI01 reste conservé indépendamment du rapport MI02.

## Validation

La validation distingue trois niveaux : les parcours par commandes publiques dans la simulation, les transitions de dossier et de stockage simulé, puis les interactions d’un navigateur réel. Les commandes et les résultats exacts de cette tranche sont consignés dans [QA_INTEGRATION.md](QA_INTEGRATION.md).

`tests/mi02-mission.test.mjs` contient **10 tests réussis**, dont **six parcours complets** en difficulté Pilote : trois châssis × deux comptes rendus, chacun avec huit ouvriers secourus. Ces parcours utilisent `createGame`, `commandGame` et `updateGame`, sans déplacer directement le joueur, modifier sa santé ou forcer les objectifs. Le fichier couvre aussi le travail annulé à distance, les portes d’objectif, la rupture de voie, les dommages réels de roquette et d’explosion au sol, le gel de la décision et une reprise déterministe.

`tests/campaign-progression.test.mjs` contient **11 tests réussis** pour la migration, le déblocage, le dossier ferroviaire et les résultats persistants. Les anciens dossiers du format v1 viennent d’une fixture produite depuis la version précédente. Les trois châssis passent un aller-retour de sauvegarde MI02 puis des entrées identiques. Les branches dégradées sont obtenues par deux ou trois tirs de roquette réels : un survivant et sept décès dans le premier cas, huit décès dans le second, registre détruit dans les deux. Leurs rapports restent distincts de MI01 et n’attribuent qu’une dotation.

Les fiches QA39–QA44 sont Vérifié dans cette portée automatisée. QA45 reste À produire : la tentative Chromium de cette tranche a échoué avant l’ouverture d’une page avec `socket() Operation not permitted`. Un test de simulation avec un pilote automatique ne mesure pas la difficulté ressentie par une personne. Un rendu Canvas ne valide pas le HUD HTML, les dialogues natifs, l’audio ou le comportement tactile.

## Rendus Canvas

Les vues [harpons](previews/mi02-harpoons.png), [freinage](previews/mi02-braking.png) et [sauvetage](previews/mi02-rescue.png) sont produites par le Renderer du jeu depuis des états atteints avec les commandes publiques. Ce sont des rendus Canvas, sans HUD HTML ni dialogue natif. Leur génération ne constitue pas une partie exécutée dans un navigateur.
