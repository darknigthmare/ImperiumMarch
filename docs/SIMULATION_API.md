# Contrat de simulation — prototype 0.5

La simulation est un module JavaScript pur, sans DOM, exécuté en secondes et en pixels monde. `WALKERS` et `MISSIONS` sont des tableaux ; les IDs sont stables. Les six châssis disponibles sont WK01, WK02, WK05, WK06, WK09 et WK10. `MISSIONS` garde OP01–OP03 ; `CAMPAIGN_MISSIONS` contient MI01, MI02, MI03 et MI04 ; `ALL_MISSIONS` sert à `createGame`. Les trois opérations restent indépendantes de la progression des missions de campagne.

```js
import { WALKERS, MISSIONS, ENEMY_TYPES, DIFFICULTIES } from './content.mjs';
import { createGame, updateGame, commandGame, terrainAt } from './simulation.mjs';
const game = createGame({ walkerId: 'WK01', missionId: 'op01', difficulty: 'normal', assist: true, seed: 1847 });
updateGame(game, 1 / 60, { move: 1, aimX: 1000, aimY: 580, fire: true });
commandGame(game, 'choice', 'defy');
```

## Entrées

`move` = −1, 0 ou 1 ; `aimX/aimY` sont des coordonnées monde. `fire`, `secondary`, `brace`, `vent`, `stepA`, `stepB`, `interact`, `reload`, `repair` sont des booléens. Les actions ponctuelles se déclenchent sur front montant, les tirs/ventilation sur maintien. `updateGame` borne chaque delta à 0,05 s et ne simule rien hors `status === 'playing'`.

`commandGame(state, action, payload)` accepte `stepA`, `stepB`, `interact`, `reload`, `repair`, `choice` (payload `obey` ou `defy`), `assist` (booléen). Retour booléen : action acceptée ou rejetée. La pause appartient à l’UI : ne pas appeler `updateGame` pendant la pause.

## État consommable par le rendu

- `mission`, `walker`, `difficulty` : références aux données ; `missionId`, `walkerId`, `planetId` ; `elapsed`, `status` (`playing`, `won`, `lost`), `outcome` (texte de résultat), `seed`.
- `player` : `x/y` centre coque, `width/height` dimensions coque, `groundY`, `facing`, `aimAngle`, `hull/maxHull`, `armor`, `heat` (0–100), `energy` (0–100), `stability` (0–100), `ammo/maxAmmo`, `reserveAmmo/maxReserveAmmo`, `rockets/maxRockets`, `reloadTime`, `venting`, `braced`, `overheated`, `speed`, `stepCooldown`, `lastGroup`, `feet`, `radiator`.
- `feet[]` : `id`, `index`, `group` (0 ou 1), `side` (`back` ou `front`), `homeOffset`, `x/y` centre contact, `phase` (`stance` ou `swing`), `progress` (0–1), `fromX/fromY`, `targetX/targetY`, `health/maxHealth`, `contact`. Les jambes partent de la coque vers ces contacts ; le rendu construit ses genoux et segments. Pieds endommagés = cadence et stabilité réduites.
- `enemies[]` : `id`, `type`, `kind`, `name`, `x/y` centre, `w/h`, `hp/maxHp`, `active`, `dead`, `facing`, `telegraph` (0–1), `attackTarget`, `spawnX`, `flash`, `phase`, `armor`. Une entité morte conserve sa place dans le tableau et ne participe plus aux collisions ni au comportement actif. Le rendu peut en conserver les effets de destruction.
- `relays[]` : `id`, `x/y` centre, `w/h`, `hp/maxHp`, `destroyed`, `flash`.
- `projectiles[]` : `id`, `x/y`, `prevX/prevY`, `vx/vy`, `team` (`player` ou `enemy`), `type` (`bullet` ou `rocket`), `damage`, `radius`, `life`, `trail`.
- `particles[]` : `x/y`, `vx/vy`, `life/maxLife`, `size`, `color`, `type` (`spark`, `smoke`, `dust`).
- `events[]` : file bornée de notifications avec `id`, `type`, `text`, `time`, `x/y` facultatifs. L’UI mémorise le dernier `id` consommé. Types utiles : `shot`, `rocket`, `step`, `hit`, `explosion`, `objective`, `radio`, `decision`, `reload`, `overheat`, `victory`, `defeat`.
- `convoy` : `null` ou `{x,y,w,h,hp,maxHp,speed,moving,arrived}`. Position centre, roues au sol.
- `civilians[]` : `{id,x,y,w,h,hp,alive,safe,fleeing}`. Ne sont jamais hostiles ni auto-ciblés ; dégâts et piétinement causent des pertes comptées.
- `evidence` : `{id,x,y,collected,scanProgress,scanTime,label}`. Interaction `E` à portée déclenche un scan de 2,4 s ; rester à proximité le poursuit. S’éloigner l’annule.
- `pickups[]` : `{id,x,y,type,collected}` (réparations à contact, stock limité).
- `decision` : `{active,resolved,choice,title,body,options:[{id,label}]}`. `E` près du marqueur après scan ouvre la décision. Tant qu’elle est active, la simulation ne combat pas (pause de lecture). Le choix résout et reprend.
- `objectives[]` : `{id,label,current,target,complete}` ; `extraction` : `{x,y,active,radius}`.
- `stats` : `kills`, `shots`, `hits`, `steps`, `collateral`, `damageTaken`, `evidence`, `ordersObeyed`, `ordersDefied`, `score`.
- `interaction` : texte contextuel ou chaîne vide ; `cameraShake` (0–1), `assist`, `lastStepGroup`, `checkpointText`.

## Monde et règles

Sol : `terrainAt(x, planetId)` autour de y=680. Le monde va de x=110 à `mission.length−110`. Les pieds plantés ne glissent pas : la coque suit leur centre d’appui avec une limite de vitesse. Le saut n’existe pas. Les bipèdes alternent leurs pieds ; les quadrupèdes leurs diagonales ; les hexapodes leurs tripodes. Le groupe déjà engagé ne peut pas être relevé une seconde fois consécutive. Un appui posé cause une zone de piétinement courte.

Tirs testés sur segments balayés pour éviter de traverser les cibles rapides. La chaleur bloque l’arme à 100 et impose un refroidissement sous 48. Le rechargement est automatique à vide ou manuel, uniquement si une réserve existe. Les roquettes consomment un stock fini. Les dépôts sont à usage unique.

Chaque sortie commence avec un magasin chargé et une réserve de huit magasins, soit `maxReserveAmmo = walker.ammo * 8`. La fin d’un rechargement transfère `min(maxAmmo - ammo, reserveAmmo)` coups : elle conserve le total, peut donner un dernier magasin partiel, et ne crée pas de munitions lorsque la réserve est vide. Un dépôt récupéré ajoute au plus trois magasins en réserve, bornés par `maxReserveAmmo`, deux roquettes bornées par leur capacité, les réparations de coque existantes et trente points de santé par pied. Les conditions de contact incluent désormais une réserve incomplète. Le marqueur `collected` interdit toute seconde collecte. Les cinq tests de `tests/ammunition.test.mjs` couvrent le stock initial, le transfert partiel, l’épuisement, la dernière charge et l’absence de ravitaillement répétable.

Le score mesure seulement la performance de combat ; aucun score moral unifié. La décision, les preuves récupérées, les pertes civiles et l’état du convoi restent séparés. Les opérations sont rejouables indépendamment ; la progression MI01–MI03 et l’atelier passent par `campaign.mjs`.

## MI01

`createGame({ missionId: 'MI01' })` initialise `state.campaign` : phase, passage choisi, état de la conduite, déploiement des dalles, livraison, lecture et signalement. Le [contrat détaillé de MI01](CAMPAIGN_MISSION_01.md) décrit ces champs. La conduite ne cède que dans `stomp`, sur un contact réel dans son intervalle. `interact` au treuil lance 4,5 secondes de travail annulable ; au poste, il lit le manifeste seulement après livraison. Les choix restent `obey`/`defy` pour le moteur, avec des textes administratifs spécifiques. Le manifeste n’ajoute aucune preuve dans `stats.evidence`.

## MI02

`createGame({ missionId: 'MI02', campaignContext })` crée un état de train spécifique, en conservant la forme des anciennes simulations MI01. `campaignContext` contient `pipeIntact`, `pipeRepaired`, `noticeFiled` et `servicesInterrupted`. `beginCampaignMission` fournit ces valeurs depuis le dossier validé de MI01.

| État | Champs utiles |
| --- | --- |
| `state.train` | `id`, `x/y`, `w/h`, `hp/maxHp`, `speed`, `moving`, `stopped`, `destroyed`, `brakeProgress`, `brakeWorking`, `breakX` |
| `train.wagons[]` | `id`, `kind` (`ore` ou `hostages`), `offset`, `x/y`, `w/h`, `hp/maxHp`, `destroyed` |
| `train.harpoons[]` | `id`, `x/y`, `released`, `progress`, `working` |
| `state.campaign` | `missionId`, `phase`, `harpoonsReleased`, `trainStopped`, `hostagesTotal`, `hostagesRescued`, `hostagesLost`, `rescueProgress`, `rescueWorking`, `rescueResolved`, `manifestRead`, `evidencePreserved`, `recordFiled`, `trainIntegrity`, `context`, `tutorial` |

Les phases MI02 sont `approach`, `release`, `pursuit`, `rescue`, `report` et `complete`. La locomotive démarre après les deux harpons. Son freinage et l’ouverture du wagon demandent des travaux chronométrés à proximité. Le terminal de lecture suit le wagon, dont la position est calculée depuis la locomotive et son décalage d’attelage. Le registre de vente n’incrémente pas `stats.evidence`, réservé aux preuves techniques des autres situations. Le [contrat détaillé de MI02](CAMPAIGN_MISSION_02.md) donne les seuils, les portes d’objectif et la portée des conséquences.

## MI03

`createGame({ missionId: 'MI03', campaignContext })` crée `state.network` avec trois stations fixes et un compteur de contrôle de Holt. Chaque station expose `id`, `kind`, `x/y`, `w/h`, `hp/maxHp`, `destroyed`, `flash`, `identified`, `verified`, `scanProgress`, `scanning`, `disabled`, `secured`, `population`, `casualties`, `disabling` et `disableProgress`. Le drone `holt-observer` existe dès le début dans `enemies` mais reste inactif jusqu’au seuil d’écoute civile.

Le contexte ajoute `railRecordFiled`, `railHostagesRescued` et `railHostagesLost` aux quatre faits hérités de MI01. Les phases sont `approach`, `inspection`, `report` et `complete`. Le dossier expose les identifications, les vérifications, le relais militaire désactivé, le nombre de circuits civils disponibles, les pertes, l’existence du dispensaire, le contrôle de Holt et la disponibilité de son canal de contact. `networkDecisionBody(state)` formule un texte dynamique qui distingue réseau complet, partiel et coupé. Les faits et le texte sont actualisés après des dommages jusqu’à l’extraction.

L’inspection civile vivante protège seulement le boîtier au sol contre les pieds. Les bâtiments conservent leurs collisions avec les balles et explosions des deux camps. Une source détruite reste inspectable mais ne délivre pas une voix ou un contenu d’émission inventé. Le [contrat détaillé de MI03](CAMPAIGN_MISSION_03.md) précise les positions, populations, travaux, contacts, choix et douze tests dédiés.

## MI04

`createGame({ missionId: 'MI04', campaignContext })` ajoute `state.industrial`. Le contexte reprend les sept faits de MI03 et ajoute `dispensaryIntact`, `witnessAvailable` et `civilRelaysOnline`. Le dossier officiel fournit ce contexte depuis les trois premiers rapports et l’éventuelle réparation de conduite.

| Objet | Forme |
| --- | --- |
| `industrial.pump` | `id`, `x/y`, `w/h`, `connected`, `working`, `progress` |
| `industrial.turbines[]` | `id`, `x/y`, `w/h`, `temperature`, `cooled`, `working`, `progress` |
| `industrial.contact` | `id`, `x/y`, `w/h`, `available`, `working`, `progress`, `contacted` |
| `industrial.post` | `id`, `x/y`, `w/h`, `hp/maxHp`, `destroyed`, `flash` |
| `industrial` | En plus des objets : `retreatTriggered`, `retreatEscaped` |
| `campaign` | `missionId`, `phase`, `coolantRestored`, `coolingAssistance`, `turbinesCooled`, `maintenanceInspected`, `manifestRead`, `logRecovered`, `technicalEvidence`, `evidenceSource`, `alternativeSourceNeeded`, `witnessContacted`, `reportFiled`, `maintenanceIntact`, `context`, `tutorial` |

Les phases sont `approach`, `cooling`, `inspection`, `report` et `complete`. `progress` varie de zéro à un. Les travaux achevés gardent un, les travaux abandonnés reprennent à zéro. La pompe initialement alimentée commence connectée avec une progression de un. La copie du journal exige les deux turbines refroidies ; l’inspection de ruines reste valide pour terminer la mission. `manifestRead` correspond à `maintenanceInspected`, tandis que `logRecovered` dit si un journal a effectivement été copié.

`industrialDecisionBody(state)` distingue journal copié, journal perdu et contact humain effectué. Une copie acquise reste disponible si le poste est détruit ensuite. `technicalEvidence` et `logRecovered` ont alors la même valeur, `evidenceSource` vaut `PT01` ou `none`, et `stats.evidence` vaut un ou zéro. Le choix de remise contrôle `reportFiled` sans effacer une copie. `alternativeSourceNeeded` devient vrai seulement après constat d’un poste dont le journal n’a pas été récupéré.

Le transport `private-hauler` conserve une place fixe dans `enemies`. `industrial.retreatEscaped` signifie que cette place n’est plus une cible physique : le rendu, la sélection de cible et toutes les collisions l’excluent. Une fuite ne donne aucun point de destruction. Le [contrat MI04](CAMPAIGN_MISSION_04.md) fixe les positions, durées et effets hérités.

## Radiateur et réparation de terrain

Toutes les missions partagent `player.radiator` : `{ health: 100, maxHealth: 100, repairKits: 2, maxRepairKits: 2, repairProgress: 0, repairing: false }` au départ d’une opération neuve. La campagne peut fournir une santé de composant usée. Une reprise n’ajoute pas de kits. `radiatorBounds(state)` retourne le rectangle exact `{x,y,w,h}` au bord arrière de la coque ; `radiatorCoolingFactor(state)` retourne `0,35 + 0,65 × health/maxHealth`.

Un projectile ennemi peut atteindre le composant seulement lorsque son trajet rencontre ce rectangle avant une autre collision. Un impact local endommage également la coque selon les règles communes. La santé locale diminue de `shot.damage × difficulty.damage × 1,4`, bornée à zéro. Le composant n’a aucune génération aléatoire de panne.

La commande `repair` exige une santé inférieure au maximum, au moins un kit, des appuis posés et une vitesse de coque inférieure ou égale à trois unités par seconde, avec aucune commande de déplacement. Quatre secondes sans mouvement, tir ou nouvel impact rendent au plus 60 points. `repairProgress` est normalisé ; il revient à zéro après annulation ou achèvement. Le kit est débité seulement à l’achèvement. La santé de coque n’est pas restaurée. Les réserves de campagne ne modifient pas ces champs. La pause et l’ouverture d’une décision figent ces compteurs avec le reste de la simulation.

## Dossier et transitions

`src/campaign.mjs` expose des transitions immuables :

| Fonction | Résultat |
| --- | --- |
| `createCampaign()` | Dossier initial, six lots, six châssis intacts. |
| `nextCampaignMissionId(dossier)` | Mission officielle active, sinon MI01, MI02, MI03, MI04 ou `null` selon les rapports déjà classés. |
| `beginCampaignMission(dossier, options)` | `{ok,campaign,game,replay,message}`. `missionId` cible une mission; sinon la prochaine est choisie. Chaque nouvelle mission exige le rapport officiel précédent. Recommencer exige `restart:true`. |
| `checkpointCampaign(dossier, game, options)` | Nouveau dossier avec l’état vivant complet ; `beforeDecision:true` conserve le premier point avant choix. |
| `restoreCampaignGame(dossier, options)` | État de la sortie officielle active validé, ou `null` sans sortie en cours. |
| `finishCampaignMission(dossier, game, options)` | Rapport et dotation une seule fois. `replay:true` ne change pas la campagne. |
| `campaignRepairCost(dossier, walkerId)` | Coût d’atelier de zéro à six lots. |
| `serviceCampaignWalker(dossier, walkerId)` | Réparation de coque, appuis et radiateur, stock débité, action refusée en mission. |
| `repairCampaignPipe(dossier)` | Réparation unique de deux lots, refusée en sortie, service rétabli et incident conservé. |
| `serializeCampaign(dossier)` / `parseCampaign(text)` | JSON validé au format v4, migrations connues v1/v2/v3 vers v4, limite de taille et structures contrôlées. |
| `readCampaign(storage)` | Dossier, origine, disponibilité, avertissement et indicateur `blocked`. |
| `writeCampaign(storage, dossier, options)` | `{ok,warning}`. `replaceInvalid:true` réservé à un nouveau dossier ou import explicitement confirmé. |

`storage` est une dépendance fournie avec `getItem` et `setItem`, pas un accès DOM implicite. Les tests comparent l’état complet après restauration et entrées identiques. Les versions futures sont refusées sans écrasement automatique. Le point avant décision d’une mission terminée ne peut pas réécrire le dossier officiel.

Les rapports sont conservés dans `completed.MI01`, `completed.MI02`, `completed.MI03` et `completed.MI04`. `lastDebrief` reflète le dernier rapport officiel. `stage: 'complete'` marque le retour d’une sortie, avec une éventuelle mission suivante encore disponible. Le dossier ferroviaire de `world.vesper.rail` conserve la récupération du train, les nombres de sauvés et perdus, l’état du registre, le signalement et la première rencontre avec les Brisants. `world.vesper.communications` conserve les faits des émissions civiles, le bilan des habitants et la disponibilité du canal du dispensaire. `world.vesper.industrial` conserve le refroidissement, le journal technique, son éventuelle perte, le contact effectué et le mode de remise. Chaque première réussite attribue quatre lots ; le maximum avant dépenses est vingt-deux en comptant les six lots initiaux.

Les migrations ajoutent les trois châssis de la 0.4 et une réserve initiale de huit magasins aux points vivants historiques, en conservant le magasin, les roquettes, les dommages, les rapports et les choix existants. Il s’agit d’une conversion déclarée depuis l’ancien rechargement illimité. La migration vers v4 ajoute un radiateur neuf et deux kits aux anciennes sorties, un radiateur neuf à chaque châssis et un dossier industriel encore vide. Les fixtures historiques v1, v2 et v3 sont conservées telles qu’exportées par leurs versions d’origine ; celle de v3 provient de `c81a360`.
