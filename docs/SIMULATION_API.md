# Contrat de simulation — prototype 0.11

La simulation est un ensemble de modules JavaScript sans DOM, exécuté en secondes et en pixels monde. `WALKERS` et `MISSIONS` sont des tableaux ; les IDs sont stables. Les six châssis disponibles sont WK01, WK02, WK05, WK06, WK09 et WK10. `MISSIONS` garde OP01–OP03 ; `CAMPAIGN_MISSIONS` contient les dix missions MI01–MI10 ; `ALL_MISSIONS` sert à `createGame`. Les trois opérations restent indépendantes de la progression des missions de campagne. Le format de dossier courant est v10 ; les 22 missions MI11–MI32 restent conçues. Les sections v4 à v9 conservent les contrats de leur introduction historique, sans réduire cette portée actuelle.

```js
import { WALKERS, MISSIONS, ENEMY_TYPES, DIFFICULTIES } from './content.mjs';
import { createGame, updateGame, commandGame, terrainAt } from './simulation.mjs';
const game = createGame({ walkerId: 'WK01', missionId: 'op01', difficulty: 'normal', assist: true, seed: 1847 });
updateGame(game, 1 / 60, { move: 1, aimX: 1000, aimY: 580, fire: true });
commandGame(game, 'choice', 'defy');
```

## Entrées

`move` = −1, 0 ou 1 ; `aimX/aimY` sont des coordonnées monde. `fire`, `secondary`, `brace`, `vent`, `stepA`, `stepB`, `interact`, `reload`, `repair` sont des booléens. Les actions ponctuelles se déclenchent sur front montant, les tirs/ventilation sur maintien. `updateGame` borne chaque delta à 0,05 s et ne simule rien hors `status === 'playing'` ou si `decision.active` est déjà vrai à l’entrée. En MI05, il synchronise la marée avec `elapsed` avant de traiter les nouvelles commandes. En MI10, si cette frame ouvre le dialogue, il aligne le domaine chimique et ses objectifs sur l’horloge déjà avancée, puis s’arrête. Les appels suivants pendant le dialogue ne modifient aucun état.

`commandGame(state, action, payload)` accepte `stepA`, `stepB`, `interact`, `reload`, `repair`, `choice` (payload `obey` ou `defy`, plus `delay` uniquement dans MI08), `assist` (booléen). Retour booléen : action acceptée ou rejetée. La pause appartient à l’UI : ne pas appeler `updateGame` pendant la pause.

## État consommable par le rendu

- `mission`, `walker`, `difficulty` : références aux données ; `missionId`, `walkerId`, `planetId` ; `elapsed`, `status` (`playing`, `won`, `lost`), `outcome` (texte de résultat), `seed`.
- `player` : `x/y` centre coque, `width/height` dimensions coque, `groundY`, `facing`, `aimAngle`, `hull/maxHull`, `armor`, `heat` (0–100), `energy` (0–100), `stability` (0–100), `ammo/maxAmmo`, `reserveAmmo/maxReserveAmmo`, `rockets/maxRockets`, `reloadTime`, `venting`, `braced`, `overheated`, `speed`, `stepCooldown`, `lastGroup`, `feet`, `radiator`.
- `feet[]` : `id`, `index`, `group` (0 ou 1), `side` (`back` ou `front`), `homeOffset`, `x/y` centre contact, `phase` (`stance` ou `swing`), `progress` (0–1), `fromX/fromY`, `targetX/targetY`, `health/maxHealth`, `contact`. Les jambes partent de la coque vers ces contacts ; le rendu construit ses genoux et segments. Pieds endommagés = cadence et stabilité réduites.
- `enemies[]` : `id`, `type`, `kind`, `name`, `x/y` centre, `w/h`, `hp/maxHp`, `active`, `dead`, `facing`, `telegraph` (0–1), `attackTarget` (`player`, `convoy`, `boat`, `technician`, `resident`, `ambulance`, `medical-staff`, `patient`, `departure-boat`, `departure-person`, `logistics` ou `chemical-sampler`), `spawnX`, `flash`, `phase`, `armor`. Une entité morte conserve sa place dans le tableau et ne participe plus aux collisions ni au comportement actif. Le rendu peut en conserver les effets de destruction.
- `relays[]` : `id`, `x/y` centre, `w/h`, `hp/maxHp`, `destroyed`, `flash`.
- `projectiles[]` : `id`, `x/y`, `prevX/prevY`, `vx/vy`, `team` (`player` ou `enemy`), `type` (`bullet` ou `rocket`), `damage`, `radius`, `life`, `trail`.
- `particles[]` : `x/y`, `vx/vy`, `life/maxLife`, `size`, `color`, `type` (`spark`, `smoke`, `dust`).
- `events[]` : file bornée de notifications avec `id`, `type`, `text`, `time`, `x/y` facultatifs. L’UI mémorise le dernier `id` consommé. Types utiles : `shot`, `rocket`, `step`, `hit`, `explosion`, `objective`, `radio`, `decision`, `reload`, `overheat`, `victory`, `defeat`.
- `convoy` : `null` ou `{x,y,w,h,hp,maxHp,speed,moving,arrived}`. Position centre, roues au sol.
- `civilians[]` : `{id,x,y,w,h,hp,alive,safe,fleeing}`. Ne sont jamais hostiles ni auto-ciblés ; dégâts et piétinement causent des pertes comptées.
- `evidence` : `{id,x,y,collected,scanning,scanProgress,scanTime,label}`. La lecture commune des opérations dure 2,4 s à portée. Les domaines de mission décrits ci-dessous possèdent leurs préconditions et durées propres ; MI09 relève ses cartes en 3 s. MI10 garde `scanning:false` : son préleveur distinct travaille vingt secondes et `evidence.collected` signifie seulement que les trois conditions de PT02 sont réunies. Une lecture inachevée s’annule si le joueur quitte sa portée.
- `pickups[]` : `{id,x,y,type,collected}` (réparations à contact, stock limité).
- `decision` : `{active,resolved,choice,title,body,options:[{id,label}]}`. `E` au poste après les préconditions de la mission ouvre la décision. Tant qu’elle est active, la simulation ne combat pas (pause de lecture). Le choix résout et reprend.
- `objectives[]` : `{id,label,current,target,complete}` ; `extraction` : `{x,y,active,radius}`.
- `stats` : `kills`, `shots`, `hits`, `steps`, `collateral`, `damageTaken`, `evidence`, `ordersObeyed`, `ordersDefied`, `score`.
- `interaction` : texte contextuel ou chaîne vide ; `cameraShake` (0–1), `assist`, `lastStepGroup`, `checkpointText`.

## Monde et règles

Sol : `terrainAt(x, planetId)` autour de y=680. Le monde va de x=110 à `mission.length−110`. Les pieds plantés ne glissent pas : la coque suit leur centre d’appui avec une limite de vitesse. Le saut n’existe pas. Les bipèdes alternent leurs pieds ; les quadrupèdes leurs diagonales ; les hexapodes leurs tripodes. Le groupe déjà engagé ne peut pas être relevé une seconde fois consécutive. Un appui posé cause une zone de piétinement courte.

Tirs testés sur segments balayés pour éviter de traverser les cibles rapides. La chaleur bloque l’arme à 100 et impose un refroidissement sous 48. Le rechargement est automatique à vide ou manuel, uniquement si une réserve existe. Les roquettes consomment un stock fini. Les dépôts sont à usage unique.

Chaque sortie commence avec un magasin chargé et une réserve de huit magasins, soit `maxReserveAmmo = walker.ammo * 8`. La fin d’un rechargement transfère `min(maxAmmo - ammo, reserveAmmo)` coups : elle conserve le total, peut donner un dernier magasin partiel, et ne crée pas de munitions lorsque la réserve est vide. Un dépôt récupéré ajoute au plus trois magasins en réserve, bornés par `maxReserveAmmo`, deux roquettes bornées par leur capacité, les réparations de coque existantes et trente points de santé par pied. Les conditions de contact incluent désormais une réserve incomplète. Le marqueur `collected` interdit toute seconde collecte. Les cinq tests de `tests/ammunition.test.mjs` couvrent le stock initial, le transfert partiel, l’épuisement, la dernière charge et l’absence de ravitaillement répétable.

Le score n’est pas un score moral unifié. La décision, les preuves récupérées, les pertes civiles et l’état du convoi restent séparés. Les opérations sont rejouables indépendamment ; la progression MI01–MI10 et l’atelier passent par `campaign.mjs`.

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

## MI05

`createGame({ missionId: 'MI05', campaignContext })` ajoute `state.channel` uniquement à cette mission. Son contexte possède exactement `technicalEvidence`, `railHostagesRescued` et `railRecordFiled`. `beginCampaignMission` les copie depuis `world.vesper.industrial` et `world.vesper.rail`. Le déblocage exige le premier rapport de MI04, avec ou sans PT01.

| Objet | Champs |
| --- | --- |
| `channel.tide` | `phase` (`low`, `rising`, `high`, `falling`), `level`, `secondsToChange`, `waterY`, `walkable`, `navigable` |
| `channel.banks[]` | `id`, `from`, `to`, `stationX`, `bridgeRaised`, `working`, `progress` |
| `channel.winches[]` | `id`, `x/y`, `w/h`, `hp/maxHp`, `released`, `working`, `progress`, `destroyed`, `flash` |
| `channel.barges[]` | `id`, `kind` (`trafficker` ou `smuggler`), `x/y`, `w/h`, `hp/maxHp`, `destroyed`, `flash`, `inspected`, `scanning`, `scanProgress`, `civilians`, `casualties` |
| `channel.boat` | `id`, `x/y`, `w/h`, `hp/maxHp`, `speed`, `arrived`, `destroyed`, `moving`, `passengers` |
| `channel.fuel` | `id`, `x/y`, `w/h`, `hp/maxHp`, `destroyed`, `collected`, `working`, `progress` |
| `campaign` | `missionId`, `phase`, `winchesReleased`, `bargesInspected`, `traffickingVerified`, `smugglerVerified`, `refugeesTotal`, `refugeesPassed`, `refugeesLost`, `bargeCiviliansLost`, `passageResolved`, `channelOpen`, `fuelRecovered`, `fuelLots`, `manifestRead`, `reportFiled`, `context`, `tutorial` |

Les phases de mission sont `approach`, `channel`, `passage`, `report` et `complete`. Les géométries de bancs, treuils, barges et dépôt restent fixes. Le bateau suit sa position simulée, avec `y = terrainAt(x, planetId) - 35` ; le rendu ne le déplace pas indépendamment de ses collisions.

### Marée et surfaces

`channelTideAt(elapsed)` est une fonction pure qui retourne la forme de `channel.tide`. Le cycle dure 72 secondes : `low` pendant 26 s, `rising` pendant 10 s, `high` pendant 26 s, `falling` pendant 10 s. `level` va de 0,1 à 1. `walkable` vaut vrai jusqu’à 0,45 inclus ; `navigable` vaut vrai à partir de 0,5 inclus. `secondsToChange` annonce la fin de la phase courante, pas un temps restant de mission. `waterY` vaut `694 - level * 26`.

`channelSurfaceAt(state, x)` retourne `{ kind, traction, submerged }`. Les valeurs de `kind` sont `quay`, `bridge`, `mud` et `submerged`. Le multiplicateur `traction` agit sur la longueur de foulée et la limite de vitesse de coque :

| Surface | Bipèdes et quadrupèdes | Hexapodes |
| --- | --- | --- |
| Quai ou passerelle | 1 | 1 |
| Vase découverte | 0,77 | 0,93 |
| Banc submergé | 0,46 | 0,66 |

Un pied en contact avec un banc submergé perd 1,25 point de santé par seconde, ou 0,55 pour un hexapode, sans descendre sous zéro. Un pied en levée n’est pas usé par ce contact ; une passerelle supprime cette exposition. Lors d’un impact, le plancher de combat est `min(15, santé avant impact)` : la règle historique reste inchangée au-dessus de 15, mais un tir ne peut pas soigner un pied déjà passé sous ce seuil. Les appuis restent représentés et conservent une marche dégradée, sans mécanisme d’amputation. Cette règle de charge n’implémente pas le module d’équipement final des patins d’estran.

### Interventions et conséquences

Le rayon des interventions propres au chenal est de 175 unités monde. `interact` cherche successivement une commande de passerelle, un treuil non libéré, une barge non inspectée, le dépôt intact non collecté puis le relevé final. `interaction` indique le travail proposé au joueur. Les rayons peuvent se recouvrir : la commande affichée doit être suivie plutôt qu’une supposition fondée uniquement sur la proximité du terminal.

| Intervention | Durée et effet |
| --- | --- |
| Passerelle | 4 s ; `bridgeRaised: true`, `progress: 1`, passage permanent. |
| Treuil | 2,5 s ; `released: true`. Détruire sa tête de 90 HP libère aussi le câble sans exiger la destruction de la barge. |
| Barge | 3 s ; `inspected: true`, `scanProgress: 1`. Une coque intacte donne sa facture ou sa liaison ; une ruine donne seulement un constat. |
| Carburant | 3 s ; `collected: true`, `fuelRecovered: true`, `fuelLots: 2`. Le dépôt possède 240 HP. |
| Relevé final | Scan commun de 2,4 s, après ouverture du chenal, deux inspections et sort du bateau connu ; `manifestRead` suit `evidence.collected`. |

Sortir du rayon des travaux de passerelle, treuil, barge ou carburant annule leur progression inachevée. Le relevé final utilise le rayon d’interruption commun de lecture, 250 unités, après son déclenchement à proximité. Les travaux achevés ne sont pas recommencés. Les coups peuvent détruire les entités pendant une intervention ; ils ne rendent pas automatiquement celle-ci réussie.

Les deux barges possèdent chacune 540 HP. **Saisie** est vide d’occupants dans cette scène ; sa facture permet `traffickingVerified`. **Rive-Courte** contient quatre membres d’équipage ; la liaison avec Vann Ostre permet `smugglerVerified`. Une copie ou une liaison obtenue avant la destruction reste acquise. Les pertes ultérieures sont actualisées séparément. La destruction avant lecture ou contact ne permet pas de reconstituer ces informations. `stats.evidence` demeure zéro pour MI05 : il ne s’agit pas d’une nouvelle preuve PALINODE.

Le bateau possède 420 HP et transporte douze personnes. `moving` exige deux câbles libérés, `tide.navigable`, et un bateau ni arrivé ni détruit. Il avance de 1 480 à 4 100 à 92 unités par seconde, sans téléportation à la réussite d’un objectif. Les adversaires terrestres peuvent le choisir comme cible ; leur activité considère aussi sa proximité après l’ouverture du chenal. L’arrivée fait débarquer les passagers et retire le bateau des dégâts. Une perte avant le dock inscrit douze décès. Les quatre membres de Rive-Courte restent un effectif distinct. Le rapport demeure terminable après une perte du bateau ; il ne la transforme pas en arrivée.

Le carburant reste facultatif. La survie du bateau et la relation avec un équipage ne conditionnent pas ce dépôt distinct. Un transfert accompli n’est pas effacé par une destruction ultérieure de sa source, qui sort alors des cibles de dégâts ; un dépôt détruit avant transfert n’accorde aucun lot. La réserve officielle `resources.fuel` est créditée au premier rapport victorieux, pas au moment du transfert ni pendant une relecture.

`channelDecisionBody(state)` restitue facture, contact, arrivées, pertes des deux effectifs et carburant réellement chargé. Le choix `defy` met `reportFiled` à vrai ; `obey` garde les constatations au dossier sans les joindre au rapport signé. Ni l’un ni l’autre ne réécrit les faits. Le texte est rafraîchi après les dégâts et interventions jusqu’à l’extraction.

Le HUD HTML consomme `channel.tide`, `campaign.winchesReleased` et `channel.boat`. `Renderer.render(state, options)` affiche par défaut son instrument de marée Canvas pour les aperçus sans HTML ; `options.tideInstrument: false`, employé par `main.mjs`, masque uniquement cet instrument pour éviter le chevauchement avec les munitions et le doublon du HUD. Cela ne change pas la simulation.

## MI06

`createGame({ missionId: 'MI06', campaignContext })` ajoute `state.dike` uniquement à cette mission. Le contexte possède exactement `fuelAvailable` (0 ou 2), `channelOpen`, `refugeesPassed`, `refugeesLost`, `smugglerVerified` et `bargeCiviliansLost`. La campagne les dérive du stock courant et du premier rapport MI05. Une relecture du succès MI06 retrouve le budget initial de cette sortie, sans changer la réserve officielle.

| Objet | Champs propres et invariants |
| --- | --- |
| `dike.houses[2]` | Identité, géométrie fixe, intégrité, `population` 6 ou 4, `destroyed`, `inspected`, `scanning`, `scanProgress`, `flooded`. |
| `dike.residents[10]` | `homeId`, position, intégrité, `alive`, `safe`, phase `home`, `evacuating`, `sheltered` ou `lost`. Les personnes à l’abri sortent des collisions de dégâts. |
| `dike.technicians[2]` | Position, intégrité, `alive`, `called`, `arrived`, `covering`, route `quay` ou `upper`, phase de déplacement, abri ou travail. |
| `dike.covers[2]` | Volumes de 64 × 63, intégrité 620, destruction et collisions réelles. |
| `dike.panel` | Géométrie, intégrité, `supportX`, `workX`, `supported`, `locked`, `latchProgress`, `manualWorking`, `manualProgress`, `emergencyShoring`, `fatigue`, `loaded`. |
| `dike.auxiliary` | Géométrie, intégrité, `connected`, `active`, `working`, `progress`. `active` vaut exactement `connected && !destroyed`. Une perte après raccordement garde `connected` et la dépense. |
| `dike.valve` | Géométrie, `working`, `progress`, `completed`. Achevée implique progression 1 et travail arrêté. |
| `dike` | `pressure` (0–100), `waterLevel` (0–1), `floodingElapsed` en secondes. |

Le dossier de mission expose `thresholdsInspected`, `evacuationOrdered`, `residentsTotal/Safe/Lost`, `homesTotal/Uninhabitable`, `techniciansTotal/Alive/Lost`, `panelSecured`, `panelsLocked`, `emergencyShoring`, `dikeFatigue`, `pumpsOnline`, `circuit`, `auxiliaryUsed`, `fuelSpent`, `manualIntervention`, `manifestRead` et `reportFiled`. Les totaux locaux sont 10 habitants, 2 maisons et 2 techniciens. Ils ne sont pas les passagers du chenal. Les comptes sont recalculés depuis les objets.

`dikeSupportReady(state)` exige `player.braced`, aucun déplacement demandé, vitesse absolue au plus 3, coque à 60 unités au plus du repère et tous les pieds en contact, en phase `stance`, dans une bande de 230 unités. Le soutien ne dépend jamais des genoux dessinés. Le panneau peut être `supported` seulement s’il est intact, non verrouillé et sans étai. `panelSecured` signifie verrou ou étai ; un panneau détruit perd son verrou, sans reconstruction par le rendu.

| Intervention | Condition et durée |
| --- | --- |
| Seuil de maison | E à moins de 175 unités, 3 s ; éloignement annule. Une ruine reste constatable. |
| Évacuation | E près d’une maison déjà inspectée ; les habitants marchent vers l’abri x760 et subissent les menaces jusqu’à l’arrivée. |
| Appel du génie | E près de x1850. Route du quai si le chenal est ouvert et les douze passagers passés ; sinon route haute. |
| Auxiliaire x2190 | E puis 4 s à moins de 175 unités. Sortir du rayon annule sans débit ; achever consomme deux lots. |
| Verrouillage du panneau | Soutien réel au repère x2480, technicien vivant sur son poste de travail, 6 s continues. |
| Étai manuel | E sous soutien, 12 s ; 8 s avec auxiliaire active. Lever un appui annule. |
| Choix x4140 | Deux seuils relevés, passage sécurisé et relevé lu. La décision seule ne démarre pas les pompes. |
| Vanne x4140 | E puis maintien à portée : impérial 6 s, dérivation 10 s avec technicien arrivé ; sinon 10 ou 18 s manuelles. |
| Extraction x5050 | Inspections, passage sécurisé, vanne achevée, dix destins résolus, choix et relevé ; le circuit impérial attend aussi le niveau d’inondation. |

Le circuit `imperial` fait monter l’eau après la vanne. Au niveau 0,65, les maisons deviennent inhabitables et les personnes encore à l’intérieur sont perdues. Le circuit `diversion` garde un niveau bas sans réparer les destructions antérieures. La hausse impériale prend environ 7,86 s depuis le niveau initial 0,1. Le texte de `dikeDecisionBody(state)` suit les faits réels, y compris après une perte postérieure au choix. `stats.evidence` reste zéro : aucune preuve PALINODE n’est ajoutée.

Le HUD HTML lit `dike` et `campaign`. Le renderer dessine les maisons, personnes, couverts, panneau, repère et circuits dans le monde, sans second panneau d’instruments fixe. Les [règles détaillées](CAMPAIGN_MISSION_06.md) et le [contrat de dossier v6](CAMPAIGN_SAVE_V6.md) complètent cette API.

## Radiateur et réparation de terrain

Toutes les missions partagent `player.radiator` : `{ health: 100, maxHealth: 100, repairKits: 2, maxRepairKits: 2, repairProgress: 0, repairing: false }` au départ d’une opération neuve. La campagne peut fournir une santé de composant usée. Une reprise n’ajoute pas de kits. `radiatorBounds(state)` retourne le rectangle exact `{x,y,w,h}` au bord arrière de la coque ; `radiatorCoolingFactor(state)` retourne `0,35 + 0,65 × health/maxHealth`.

Un projectile ennemi peut atteindre le composant seulement lorsque son trajet rencontre ce rectangle avant une autre collision. Un impact local endommage également la coque selon les règles communes. La santé locale diminue de `shot.damage × difficulty.damage × 1,4`, bornée à zéro. Le composant n’a aucune génération aléatoire de panne.

La commande `repair` exige une santé inférieure au maximum, au moins un kit, des appuis posés et une vitesse de coque inférieure ou égale à trois unités par seconde, avec aucune commande de déplacement. Quatre secondes sans mouvement, tir ou nouvel impact rendent au plus 60 points. `repairProgress` est normalisé ; il revient à zéro après annulation ou achèvement. Le kit est débité seulement à l’achèvement. La santé de coque n’est pas restaurée. Les réserves de campagne ne modifient pas ces champs. La pause et l’ouverture d’une décision figent ces compteurs avec le reste de la simulation.

## Dossier et transitions

`src/campaign.mjs` expose des transitions immuables :

| Fonction | Résultat |
| --- | --- |
| `createCampaign()` | Dossier v10 initial, six lots d’atelier, zéro lot de carburant, six châssis intacts. |
| `nextCampaignMissionId(dossier)` | Mission officielle active, sinon la prochaine mission MI01–MI10 ou `null` selon les rapports déjà classés. |
| `beginCampaignMission(dossier, options)` | `{ok,campaign,game,replay,message}`. `missionId` cible une mission; sinon la prochaine est choisie. Chaque nouvelle mission exige le rapport officiel précédent. Recommencer exige `restart:true`. |
| `checkpointCampaign(dossier, game, options)` | Nouveau dossier avec l’état complet ; MI06–MI10 acceptent aussi une défaite terminale. Le débit d’auxiliaire est réglé avant sauvegarde. `beforeDecision:true` conserve le premier point avant choix. |
| `restoreCampaignGame(dossier, options)` | État officiel validé, éventuellement `lost` pour MI06–MI10 ; `null` sans sortie ou si les règles de reprise de la mission interdisent le point demandé. En MI09 et MI10, le point avant décision doit être exactement le checkpoint officiel courant. |
| `finishCampaignMission(dossier, game, options)` | Rapport et dotation une seule fois ; règle aussi la consommation non encore capturée. Une défaite MI06–MI10 conserve le checkpoint terminal sans rapport. `replay:true` ne change pas la campagne. |
| `campaignRepairCost(dossier, walkerId)` | Coût d’atelier de zéro à six lots. |
| `serviceCampaignWalker(dossier, walkerId)` | Réparation de coque, appuis et radiateur, stock débité, action refusée en mission. |
| `repairCampaignPipe(dossier)` | Réparation unique de deux lots, refusée en sortie, service rétabli et incident conservé. |
| `serializeCampaign(dossier)` / `parseCampaign(text)` | JSON validé au format v10, migrations connues des formats v1–v9 vers v10, limite de taille et structures contrôlées. |
| `readCampaign(storage)` | Dossier, origine, disponibilité, avertissement et indicateur `blocked`. |
| `writeCampaign(storage, dossier, options)` | `{ok,warning}`. `replaceInvalid:true` réservé à un nouveau dossier ou import explicitement confirmé. |

`storage` est une dépendance fournie avec `getItem` et `setItem`, pas un accès DOM implicite. Les tests comparent l’état complet après restauration et entrées identiques. Les versions futures sont refusées sans écrasement automatique. Le point avant décision d’une mission terminée ne peut pas réécrire le dossier officiel.

Les rapports sont conservés dans `completed.MI01` à `completed.MI10`. `lastDebrief` reflète le dernier rapport officiel. `stage: 'complete'` marque le retour d’une sortie, avec une éventuelle mission suivante encore disponible. Le dossier ferroviaire de `world.vesper.rail` conserve la récupération du train, les nombres de sauvés et perdus, l’état du registre, le signalement et la première rencontre avec les Brisants. `world.vesper.communications` conserve les faits des émissions civiles, le bilan des habitants et la disponibilité du canal du dispensaire. `world.vesper.industrial` conserve le refroidissement, le journal technique, son éventuelle perte, le contact effectué et le mode de remise. `world.nacre.passage` conserve les faits du chenal et correspond au reçu `completed.MI05`. Les domaines `world.nacre.ambulance`, `world.nacre.departure`, `world.thyr.route` et `world.thyr.chemical` conservent les premiers bilans de MI07, MI08, MI09 et MI10, dont les registres physiques individuels. Chaque première réussite attribue quatre lots d’atelier ; le maximum avant dépenses est **46**, soit les six lots initiaux et dix dotations de quatre. `resources.fuel` est distinct : il vaut zéro avant le premier rapport MI05, puis zéro ou deux selon le transfert accompli. MI06 consomme éventuellement ces deux lots. `world.nacre.fuelSpent` conserve la dépense cumulée et `world.nacre.dike` le bilan de la première réussite ; le coût de cette sortie peut être nul après un échec antérieur ayant déjà consommé la réserve. Aucune conversion en pièces d’atelier ni achat n’est implémenté.

Les migrations ajoutent les trois châssis de la 0.4 et une réserve initiale de huit magasins aux points vivants historiques, en conservant le magasin, les roquettes, les dommages, les rapports et les choix existants. Il s’agit d’une conversion déclarée depuis l’ancien rechargement illimité. La migration vers v4 ajoute un radiateur neuf et deux kits aux anciennes sorties, un radiateur neuf à chaque châssis et un dossier industriel encore vide. La migration v4→v5 ajoute seulement `world.nacre.passage` vierge, `resources.fuel: 0` et le nouveau numéro de format. Elle conserve exactement les checkpoints et reçus de Vesper, avec les munitions, radiateurs, kits et travaux en cours. Les fixtures historiques v1, v2, v3 et v4 sont conservées telles qu’exportées par leurs versions d’origine ; celle de v3 provient de `c81a360`, et `tests/fixtures/campaign-v4-mi04.json` provient du commit `d7d76b61ee9e97e27c611e06905f32f70633cb8e`. Cette fixture v4 contient les dossiers MI04 en cours et terminé. Les tests vérifient que retirer les seuls champs ajoutés et rétablir le numéro 4 reproduit exactement l’ancien dossier. Les formats v1 à v4 présentant déjà du carburant, un résultat de Nacre ou un checkpoint MI05 sont refusés.


## Périmètre de validation et suite

[QA_V11.md](QA_V11.md) rassemble les résultats et limites courants de simulation, sauvegarde, interface et livraison. [QA_V10.md](QA_V10.md), [QA_V08.md](QA_V08.md) et les autres rapports de tranche restent des références historiques. Les parcours MI06 et MI10 utilisent les commandes publiques pour les six châssis, leurs deux conduites et les pertes ; les stimuli de collision unitaires des autres suites sont identifiés comme tels. `test-ui-runtime.mjs` vérifie les gestionnaires du script autonome dans un DOM modélisé. Les rendus Canvas de `render-mi06-previews.mjs` et `render-mi10-previews.mjs` restent distincts des captures navigateur.

Les dix missions MI01–MI10 sont jouables au stade prototype. `CAMPAIGN_MISSIONS` et le dossier v10 vont jusqu’à MI10 — **Le champ que personne n’a semé** ; terminer ces dix missions ne termine pas les 32 missions de conception. Les 22 missions MI11–MI32 restent conçues.

La migration v5→v6 ajoute uniquement le dossier `world.nacre.dike` non visité, le compteur `world.nacre.fuelSpent: 0` et le numéro 6. La fixture `campaign-v5-mi05.json` est issue de l’arbre public immuable `613c07307f2712c5fac28d9403016906e94da168`. Les états MI01–MI05 restent identiques, y compris la différence entre carburant prélevé pendant MI05 et réserve créditée seulement à son rapport.

Le rendu navigateur transmet également `interactionPrompt:false` : `game.interaction` est alors présenté par `#hud-interaction`, au-dessus des instruments HTML. La valeur par défaut maintient le prompt intégré pour les rendus Canvas seuls. Cette option ne change pas la simulation.


## MI07 — ambulance des Salines

`createGame({ missionId: 'MI07', campaignContext })` ajoute `state.ambulance` à cette seule mission. `beginCampaignMission` exige le rapport MI06 et copie exactement `pumpsOnline`, `panelsLocked`, `emergencyShoring`, `dikeFatigue`, `techniciansAlive`, `homesUninhabitable`, `residentsSafe`, `residentsLost` et `circuit` dans son contexte. Aucun stock ne change au départ.

| Objet | Responsabilité |
| --- | --- |
| `ambulance.vehicle` | Coque, mouvement, appel, arrêt, arrivée et remorquage éventuel. |
| `ambulance.cargo` | Intégrité de la caisse, inspection et vérification du matériel sanitaire. |
| `ambulance.beacon` | Boîtier ajouté, dégâts, démontage et récupération. |
| `ambulance.staff[2]` | Conductrice et soignant, santé, présence et arrivée distinctes. |
| `ambulance.patients[4]` | Quatre personnes propres à cette mission, santé et arrivée individuelles. |
| `ambulance.barriers[2]` | Obstacles de l’aire d’arrêt, dégâts et dégagement. |
| `ambulance.consent`, `witness` | Travaux de conversation, accord et identité du responsable. |
| `ambulance.technical`, `mara` | Aide technique disponible puis réellement demandée ; transmission radio facultative. |
| `ambulance.ramp` | Route déduite de la digue et préparation réelle du franchissement. |
| `ambulance.receptions[2]` | Poste médical impérial et accueil civil, positions et mise en état. |
| `ambulance.handover` | Ordre de transfert et travail sur les chariots ou le constat ; son achèvement engage les survivants vers le poste. |
| `ambulance.signalAnnounced`, `signalElapsed`, `raidTriggered` | Annonce, horloge simulée et arrivée des drones. |

Les phases du dossier sont `approach`, `interception`, `examination`, `decision`, `transfer`, `report`, `complete`. La route `main` exige un verrou, aucun étai et une fatigue strictement inférieure à 65 ; sinon la route est `secondary`. `destination` vaut d’abord `unselected`, puis `imperial` pour obey ou `clinic` pour defy.

`ambulanceStopClear(state)` lit les barrières et les ennemis présents autour de l’aire. `ambulanceDecisionBody(state)` produit le constat depuis les faits courants, y compris les pertes postérieures au choix.

`witnessConsent` et `witnessId` conservent l’accord historique. `witnessAvailable` indique si cette personne est encore vivante. La disponibilité ne ressuscite pas un témoin. `beaconRecovered`, `fixingsPreserved` et `beaconLogCopied` exigent le démontage ; `provenanceVerified` reste faux, `stats.evidence` reste zéro. Le fait matériel et l’identification de l’auteur de pose ne sont pas confondus.

Introduite en 0.8, la sauvegarde v7 conserve les faits de cette scène dans `world.nacre.ambulance` au premier succès, avec quatre lots d’atelier uniques et sans mouvement de carburant. Le [contrat de dossier v7](CAMPAIGN_SAVE_V7.md) précise la migration historique, la validation et les reprises.

Les tests `campaign-v7.test.mjs` complètent les contrôles historiques par la migration v6, les rampes héritées, le rapport sanitaire, la reprise des travaux et l’échec terminal. Les scènes MI07 et leurs pertes sont couvertes séparément par `mi07-mission.test.mjs`; le modèle DOM ne remplace pas la validation visuelle.

`handover.completed` ne suffit pas à classer les personnes comme arrivées : `campaign.transferResolved` exige aussi que les quatre patients et les deux membres d’équipe aient chacun atteint l’accueil ou soient constatés perdus.

## MI08 — Les portes d’Aval (0.9)

`departure` appartient uniquement aux scènes MI08. `campaignContext` reçoit les bilans conservés de MI05, MI06 et MI07; il ne transporte pas un nouveau stock de carburant. Les fonctions pures `departurePersonSeeds(context)`, `departureReceiptRoster(state)`, `departureTideAt(elapsed)`, `departureWindow(state, boat?)`, `departureGateBounds(gate)` et `departureDecisionBody(state)` exposent les dérivations communes à la simulation, au rendu et au validateur.

| Objet | État détenu par la simulation |
| --- | --- |
| `departure.locks[2]` | Porte, mécanisme, ouverture, pression, inspection, manœuvre, fatigue et obturation d’urgence de l’amenée. |
| `departure.tide`, `basin`, `current` | Marée de 64 secondes, niveau progressif du bassin et courant dérivé; aucune horloge externe. |
| `departure.origins[3]` | Contacts des survivants du chenal, de la digue et de l’ambulance, avec invitation distincte de l’arrivée au quai. |
| `departure.people[]` | ID de sortie, provenance, rôle, position, santé, accord, destination, bateau, service et phase de trajet. |
| `departure.boats[2]` | Coques Rive-Courte et Veille d’Aval, capacités distinctes de sièges, brancards et opérateurs, trajet, rappel et accostage. |
| `departure.ramps[2]` | Passerelles, intégrité et préparation de l’accès à chaque bateau. |
| `quay`, `refugeRadio`, `registry` | Contact du quai, confirmation de capacité au refuge et copie ou constat des registres. |
| `refuge`, `shelter`, `serviceShelter` | Porte du refuge, accueil local et niche technique; arrivée validée par la position de chaque personne. |
| `vann`, `mara`, `technical` | Échanges locaux, disponibilité des personnes et accords réellement recueillis. |
| `boarding`, `report`, `alert` | Ordre d’embarquement, rappel, transmission et délai d’arrivée du contrôle. |

`commandGame(state, 'choice', value)` accepte `obey`, `delay` et `defy` pour cette seule mission. Ces valeurs choisissent respectivement fermeture immédiate, fenêtre de passage puis fermeture, ou maintien du passage. Le choix engage un plan; les interactions et les déplacements doivent encore l’accomplir. Les départs sont acquis à la sortie navale, les bateaux accostent ensuite à des quais distincts et les personnes gagnent la porte du refuge. À la première frame d’accostage, `moving` devient faux en même temps que `arrived` devient vrai.

Les identités nouvelles issues d’un ancien compte agrégé sont déclarées `sourceKind: aggregate`; elles ne prétendent pas identifier rétroactivement des individus des anciennes missions. L’ID connu d’un témoin sanitaire n’est repris que si les faits antérieurs permettent cette correspondance. Les pertes, départs et accords restent historiques; les arrivées et capacités sont rapprochées des personnes et bateaux concernés par `departure-validation.mjs`.

Introduit en 0.9, le dossier v8 conserve le premier bilan dans `world.nacre.departure` et le reçu MI08, avec quatre pièces uniques, sans dotation de carburant ni preuve globale. Les détails physiques, les parcours de repli et les règles d’import figurent dans [le contrat MI08](CAMPAIGN_MISSION_08.md) et [le contrat de sauvegarde v8](CAMPAIGN_SAVE_V8.md).


## MI09 — La route des vivants (0.10, dossier v9)

`createGame({ missionId: 'MI09', campaignContext })` ajoute `state.livingRoute` à MI09 uniquement. Le contexte possède exactement `departureRecorded`, `departureChoice`, `departureArrived` et `departureLost`. `beginCampaignMission` exige le premier rapport MI08 et fournit ces valeurs depuis ce rapport ; elles servent à un rappel radio, sans créer des personnes de Thyr depuis les anciens agrégats.

| Objet | Champs et responsabilité |
| --- | --- |
| `livingRoute.columns[2]` | `id`, `species: 'FL07'`, géométrie, `hp/maxHp`, `destroyed`, `flash` ; support des habitats et des colonies. |
| `livingRoute.roots[2]` | Géométrie, intégrité, `columnId`, `lastContactAt`, `lastStep` ; relief réel des pieds et charge par groupe d’appuis. |
| `livingRoute.homes[2]` | Géométrie, intégrité, `columnId`, `supported`, `habitable` ; aucun effectif humain attribué. |
| `livingRoute.pollinators[2]` | `species: 'FU08'`, géométrie, `columnId`, `alive`, `phase` (`flying`, `settled`, `lost`), `calm` de 0 à 5 s. |
| `livingRoute.migrators[4]` | `species: 'FU07'`, `age`, géométrie, intégrité, `phase`, `destination`, `targetX`, `fear`, `moving` ; deux adultes et deux jeunes observés dans cette sortie. |
| `livingRoute.barrier` | Géométrie, intégrité, `controlX`, `opening`, `operated`, `working`, `progress` ; manœuvre distincte du choix. |
| `livingRoute.logistics` | Géométrie, intégrité, `controlX`, `targetX`, `speed`, `released`, `moving`, `arrived`, `working`, `progress` ; trajet physique de x2860 à x5500. |
| `livingRoute.contact` | Poste local, `heard`, `working`, `progress` ; écoute réelle de 3 s. |
| `livingRoute.approach` | Repère, `prepared`, `kind`, `clearance`, `working`, `progress` ; relevé de 8 s ou guidage de 4 s sous ancrage. |
| `livingRoute.maps`, `lights`, `report` | Postes et travaux ; respectivement `inspected`, `on`, `transmitted`, avec `working/progress`. |
| `livingRoute.alert` | `triggered` : arrivée des deux tireurs après manœuvre et résolution du troupeau. |
| `livingRoute.disturbance` | `x`, `remaining`, `strength` : dernier bruit local, sans alarme omnisciente. |

Les phases du dossier sont `approach`, `survey`, `routing`, `migration`, `defence`, `logistics`, `report`, `complete`. `route` vaut `unselected`, puis `imperial` après `obey` ou `migration` après `defy`. `approach` vaut `unprepared`, `surveyed` ou `guided`. Le choix ne démarre aucune opération et ne déplace aucun animal.

Les animaux passent de `waiting` à `migrating` après la manœuvre, puis à `arrived` au verger ou `displaced` dans l’exclusion. `lost` constate une destruction avant arrivée. Les destinations sont `unselected`, `orchard` ou `exclusion`. Les quatre termes arrivés/déplacés/perdus totalisent quatre seulement quand `migrationResolved` est vrai. Une arrivée et un déplacement restent vivants ; les destinations terminales sont préservées sans dégâts rétroactifs.

Le dossier expose notamment `localsHeard`, `approachPrepared`, `routeInspected`, `hamletsRecorded`, `migrationObserved`, `lightsOff`, `gateOperated`, les comptes individuels, `columnsIntact`, `homesHabitable`, `pollinatorsPresent`, `passagePreserved`, `cropsFertilized`, `harvestFragile`, le bilan des tireurs et celui de la logistique. Ces faits sont dérivés des objets physiques ; ils ne peuvent être importés comme compteurs indépendants. `stats.evidence` et `stats.collateral` restent zéro dans MI09 : aucune preuve technique ou testimoniale ultérieure, aucun décès humain supposé à partir d’un habitat.

### Fonctions exportées et surfaces

| Module et fonction | Contrat |
| --- | --- |
| `simulation.mjs` — `livingRouteContext(previous = {})` | Retourne les quatre champs de contexte normalisés ; la couche campagne vérifie ensuite leur égalité avec le rapport MI08. |
| `simulation.mjs` — `livingRouteSurfaceAt(state, x)` | Retourne `{ groundY, rootId, rise, traction, clearance }` ; même relief pour les contacts de pieds, la référence de coque et le rendu. |
| `simulation.mjs` — `livingRouteDecisionBody(state)` | Texte dérivé de l’écoute, du relevé et des habitats réellement habitables. |
| `simulation.mjs` — `livingRouteReceiptRoster(state)` | Copie profonde de `livingRoute` complétée par les deux tireurs `{ id, hp, maxHp, dead }`. |
| `thyr-validation.mjs` — `createLivingRouteDossier()` | Dossier non visité pour `world.thyr.route`, sans roster ni résultat de mission attribué. |
| `thyr-validation.mjs` — `livingRouteContextFor(campaign)` | Héritage sourcé directement dans `completed.MI08`. |
| `thyr-validation.mjs` — `livingRouteDossierFromGame(game)` | Faits persistants et roster détaché utilisés pour le premier reçu et le monde officiel. |
| `thyr-validation.mjs` — `validateLivingRouteFacts(facts, finished = false)` | Cohérence des types, bornes, comptes, routes et préconditions déclarées ; erreur en cas de contradiction. |
| `thyr-validation.mjs` — `validateLivingRouteMission(value, template)` | Réconciliation complète de la scène, des faits, du choix, des objectifs et de l’état terminal. |
| `thyr-validation.mjs` — `validateLivingRouteReceipt(receipt, context)` | Réconciliation du reçu avec son registre physique et l’héritage officiel. |
| `thyr-validation.mjs` — `validateLivingRouteSortie(previous, current)` | Interdit de reculer l’horloge, changer de sortie ou annuler les choix, dégâts et destinations déjà acquis. |

Le relief d’une racine intacte suit son emprise de 340 et une élévation sinusoïdale maximale de 28. Le gabarit compare `walker.height + player.height / 2` au passage de 185 ; le contournement préparé ouvre un passage de 300. Les hauts Vigie et Arpenteur doivent donc préparer cette voie. Le balisage guidé impose au moins 1,15 s entre groupes au voisinage des racines ; les commandes manuelles `stepA`/`stepB` permettent aussi d’espacer les appuis. Il n’existe aucune commande autonome de réglage de hauteur.

### Durées et conditions de clôture

Les travaux ont une portée strictement inférieure à 150 unités. L’approche et la barrière exigent une coque ancrée, sans déplacement demandé, une vitesse absolue au plus 3 et tous les pieds en contact. L’éloignement ou la perte du support requis annule la progression inachevée. L’écoute dure 3 s, le guidage 4 s ou le relevé seul 8 s, les projecteurs 2 s, les cartes 3 s, la barrière 6 s ou les guides manuels 8 s après destruction, le départ logistique 3 s et le rapport 3 s.

Les tireurs `thyr-sniper-1` et `thyr-sniper-2` gardent des emplacements stables dans `enemies`, mais restent absents du rendu, des dégâts et du comportement avant `alert.triggered`. Ce déclenchement exige une barrière opérée et quatre destins animaux résolus. Le transport attend les animaux, suit le marcheur et doit réellement atteindre le dépôt. Sa destruction ou une coque de marcheur à zéro produit `lost`. Le rapport exige cartes, choix, manœuvre, troupeau terminal, deux tireurs neutralisés et transport arrivé ; l’extraction vient ensuite.

### Persistance et rendu

La migration v8→v9 ajoute uniquement `world.thyr.route` non visité et la nouvelle version, sans réécrire les huit premiers rapports, le registre d’Aval, les checkpoints, la flotte ni les stocks. Le premier succès conserve `completed.MI09` et son roster, crédite quatre lots d’atelier une seule fois et ne crée aucun carburant. La limite théorique avant dépenses est donc 42 lots pour les neuf missions. Les détails et la provenance de la fixture native v8 sont documentés dans [CAMPAIGN_SAVE_V9.md](CAMPAIGN_SAVE_V9.md).

Les sauvegardes conservent le travail exact, les contacts, les positions, la peur, le générateur, les munitions et les projectiles. Une reprise terminale reste terminale. Le point avant décision de MI09 n’est proposé que s’il est exactement le checkpoint officiel, sans retour possible après une décision ou une progression ultérieure. Les relectures restent séparées du premier reçu.

`Renderer.render` et `thyr-renderer.mjs` consomment ces objets sans les modifier. Ils ne déclenchent ni arrivée, ni opération, ni réparation. `drawThyrAsset` utilise les dimensions physiques fournies et partage ses primitives avec les exports SVG. Les snapshots de `render-mi09-previews.mjs` sont profondément copiés et comparés après continuation ; chaque rendu est contrôlé par égalité de l’état avant/après. Cette vérification Canvas reste distincte des parcours natifs de navigateur et de la réception humaine.

## MI10 — Le champ que personne n’a semé (0.11, dossier v10)

`createGame({ missionId: 'MI10', campaignContext })` ajoute `state.chemical`. Le domaine est absent de toutes les autres missions, y compris de leurs checkpoints historiques. Les paramètres restent dans `state.mission.chemical` ; les faits dérivés restent dans `state.campaign`. Les entrées publiques sont toujours celles de `commandGame` et `updateGame` : aucune commande supplémentaire de hauteur, de prélèvement instantané ou de modification des volumes n’est ajoutée.

`chemicalContextFor(dossier)` dérive les cinq champs suivants du premier rapport `completed.MI09`. `chemicalContext(previous)` les normalise sans lire le stockage :

| Champ de contexte | Valeurs et origine |
| --- | --- |
| `routeRecorded` | Présence du premier rapport MI09. |
| `routeChoice` | `none`, `obey` ou `defy`, selon le choix conservé. |
| `routeApproach` | `unprepared`, `surveyed` ou `guided`, selon l’approche réellement préparée. |
| `routePassagePreserved` | Fait de passage préservé de MI09. |
| `routeHarvestFragile` | Fait de récolte fragilisée de MI09. |

Seule l’approche `guided` réduit une durée : la fermeture du collecteur passe de cinq à trois secondes. Aucun humain, animal, stock ou dommage ancien n’est déplacé ou réécrit par ce contexte.

### Objets et positions

Les positions `x/y` sont des centres ; les corps fixes reposent sur `terrainAt(x, 'PL03')` avec `y = terrain - h/2`. Un corps destructible conserve `id,x,y,w,h,hp,maxHp,destroyed,destroyedAt,flash`. Un poste de travail conserve `working,progress,startedAt,completedAt`, avec une progression de zéro à un et des dates initialement `null`. Les dates d’opérations acquises restent historiques après dégâts.

| Objet | Position et intégrité | Champs propres |
| --- | --- | --- |
| `chemical.tanks[0..2]` | `x = 800,1400,2000` ; `140×160` ; 500 HP chacune | IDs `chemical-tank-1..3`, `role: carrier/binder/active`, `initialVolume:100`, `volume`, `inspected`, `identified`, `secured`, `demolished`, `work:none/inspect/secure/demolish`, dates `inspectedAt/identifiedAt/securedAt/demolishedAt`, travail commun. |
| `chemical.collector` | Corps à 2960 ; `72×84` ; 400 HP ; `controlX:540` | `closed`, `closedAt`, travail commun. La commande amont et la vanne physique sont deux positions du même mécanisme. |
| `chemical.leak` | Commande à 2200 ; `42×50` | `sourceId:chemical-tank-3`, `contained`, `containedAt`, travail commun. Les dégâts de source portent sur la cuve, pas sur cette commande sans HP. |
| `chemical.sampler` | 2480 ; `64×72` ; 420 HP | `sourceId`, `started`, `collected`, `lost`, `firstStartedAt`, `collectedAt`, `lostAt`, `volumeCollected`, travail commun. |
| `chemical.record` | 2740 ; `68×76` ; 200 HP | `inspected`, `copied`, `copiedAt`, travail commun. |
| `chemical.orders` | 3020 ; `60×70` | Poste du dialogue, sans travail chronométré ni HP. |
| `chemical.canals[0..1]` | 3400 et 4140 ; `260×24` ; 320 HP chacune | `controlX:3210/3950`, `covered`, `coveredAt`, `contamination`, `lastStep`, travail commun. |
| `chemical.homes[0..1]` | 4860 et 5060 ; `140×100` ; 300 HP chacun | `habitable`, dérivé de l’intégrité et des canaux. Aucun nombre d’occupants. |
| `chemical.water` | 4600 ; `56×60` | `resolved`, `restored`, `resolvedAt`, travail commun. |
| `chemical.report` | 5660 ; `58×72` | `transmitted`, `transmittedAt`, travail commun. |
| `chemical.spill` | Inventaire de la fuite avant émission d’une plume | `pendingMass`, `emissionClock`, `totalReleased`, `nextPlumeId`. |
| `chemical.plumes[]` | De la cuve d’origine au bassin 2960 ou à l’aval 4780 | `id,sourceId,x,y,w:32,h:10,mass,phase,passedCanals,deposits,releasedAt,arrivedAt`. `phase` vaut `flowing`, `retained` ou `delivered`. |
| `chemical.alert` | Événement du site puis délai d’arrivée | `triggered`, `reason`, `elapsed`, `triggeredAt`, `ready`, `readyAt`. `reason` vaut `none`, `sample`, `demolition` ou `source-loss`. |

Les trois adversaires restent dans `state.enemies`, avec les IDs `chemical-private-1..3`, types `drone`, `sniper`, `buggy` et positions initiales 3120, 3680, 4380. Ils restent sans présence physique ni visibilité tant que `chemical.alert.ready` est faux. Le déclenchement vient du premier prélèvement lancé, de la première cuve rompue ou de la perte empêchant le prélèvement ; l’arrivée survient après cinq secondes. Après arrivée, les trois unités sont actives et peuvent choisir `attackTarget:'chemical-sampler'` lorsque la collecte reste en attente et son appareil disponible. Leur tir reste soumis aux collisions du monde.

### API exposée et frontières de modules

| Export | Contrat |
| --- | --- |
| `simulation.mjs` — `chemicalContext(previous = {})` | Réexport du normaliseur des cinq champs de contexte. Ne copie ni monde, ni population, ni dossier entier. |
| `simulation.mjs` — `chemicalDecisionBody(state)` | Réexport du texte calculé depuis les relevés, la provenance et le sort réel du prélèvement. Ne réalise aucune opération. |
| `simulation.mjs` — `chemicalReceiptRoster(state)` | Réexport d’une copie profonde de `chemical`, complétée par `privateForces:[{id,type,hp,maxHp,dead}]`. Le checkpoint garde, lui, les ennemis complets et leurs positions. |
| `simulation.mjs` — `chemicalSurfaceAt(state,x)` | Retourne `{groundY,canalId,rise,traction}`. Un canal couvert intact porte une surface dix unités au-dessus du terrain, avec traction de coque 0,88 ; ailleurs, relief normal et traction 1. |
| `chemical-validation.mjs` — `createChemicalDossier()` | Domaine officiel non visité : conduite non sélectionnée, faits et compteurs vides, `roster:null`. |
| `chemical-validation.mjs` — `chemicalContextFor(dossier)` | Héritage tiré du premier reçu MI09, contrôlé contre le contexte de sortie. |
| `chemical-validation.mjs` — `chemicalDossierFromGame(game)` | Copie les faits officiels de MI10 et le registre matériel du jeu. |
| `chemical-validation.mjs` — `validateChemicalFacts(facts,finished=false)` | Cohérence des comptes, masses, états de preuve et portes de progression ; ajoute les conditions de clôture si `finished`. |
| `chemical-validation.mjs` — `validateChemicalMission(value,template)` | Réconcilie le checkpoint complet : géométrie, intégrité, travaux datés, volumes, plumes, exposition, alerte, copies, objectifs et état terminal. |
| `chemical-validation.mjs` — `validateChemicalReceipt(receipt,context)` | Réconcilie le reçu final avec son roster et son contexte officiel. |
| `chemical-validation.mjs` — `validateChemicalSortie(previous,current)` | Refuse le recul de sortie, les changements de choix acquis et l’annulation de dégâts, copies, pertes ou mouvements irréversibles. |

Le moteur importe aussi les fonctions d’intégration de `chemical-simulation.mjs` : `createChemicalMission(state,previous,runtime)`, `interactChemicalMission(state,runtime)`, `chooseChemicalMission(state,choice,runtime)`, `updateChemicalMission(state,dt,runtime)`, `hitChemicalPart(state,part,damage,runtime)` et `chemicalFootfall(state,foot,runtime)`. `runtime` fournit `terrainAt` et `emit`. `chemicalSurface`, `chemicalSolids`, `refreshChemicalFacts`, `chemicalInteraction` et `chemicalObjectives` complètent ce raccordement. Ces fonctions font partie de l’implémentation du moteur ; les parcours de validation MI10 passent par les commandes publiques, sans les utiliser comme raccourcis de dégâts ou de progression.

Le réexport nommé dans `simulation.mjs` conserve les mêmes fonctions dans les modules et dans le script autonome. `tools/build-offline.mjs` reconnaît explicitement cette forme et refuse les imports/exports résiduels qu’il ne sait pas regrouper.

### Portée, durées et actions

Une interaction commence à une distance horizontale d’au plus 150 unités du poste concerné. Le plus proche des travaux disponibles est retenu. Les travaux marqués « ancrage » demandent `player.braced`, `player.move === 0`, une vitesse absolue strictement inférieure à 3 et tous les pieds en contact. L’éloignement ou la perte d’une condition remet une progression inachevée à zéro ; une nouvelle action est nécessaire pour la relancer.

| Action | Durée | Condition et résultat |
| --- | --- | --- |
| Fermer le collecteur | 5 s, ou 3 s avec approche MI09 guidée | Ancrage au poste 540, vanne intacte, circuit d’eau pas encore remis en service. Fermeture acquise à l’achèvement. |
| Relever chaque cuve | 3 s | Inspection locale ; copie du marquage seulement si la cuve existe encore à l’achèvement. Les ruines donnent le constat sans marquage. |
| Contenir la fuite | 6 s | Ancrage au poste 2200 et source encore intacte. Arrête les émissions ultérieures et conserve les volumes déjà libérés. |
| Copier ou constater le registre | 3 s | Travail local à 2740 ; un registre détruit reste inspectable, sans copie. |
| Lancer le prélèvement | 20 s | Les trois cuves et le registre doivent avoir été relevés. Démarrage à portée du poste, puis maintien à au plus 850 unités du préleveur ; source et appareil survivants, au moins cinq unités disponibles jusqu’à collecte. |
| Choisir la conduite | Dialogue, sans travail instantané | Trois cuves et registre relevés, fuite arrêtée, proximité du poste 3020. `obey→demolish`, `defy→secure`. |
| Isoler une cuve | 5 s | Ancrage, cuve inspectée et intacte, conduite `secure`. |
| Démolir une cuve | 3 s | Ancrage, cuve inspectée et intacte, conduite `demolish`. Les tirs et explosions peuvent aussi la rompre. |
| Couvrir un canal | 4 s | Ancrage à sa commande amont, canal intact. La couverture ne change ni ses HP déjà perdus ni sa contamination. |
| Remettre l’eau en service | 4 s | Ancrage à 4600, opérations des cuves et écoulement résolus. Ouvre le collecteur et consigne la disposition de l’eau ; des canaux détruits ne sont pas réparés. |
| Transmettre le rapport | 3 s | Poste 5660 ; relevés et choix acquis, opérations des cuves et prélèvement résolus, trois forces neutralisées, disposition de l’eau consignée et écoulement terminé. |

Le confinement est une opération distincte du lancement de prélèvement : les relevés ouvrent ce dernier, tandis que l’arrêt de la fuite ouvre le dialogue. Le pilote peut collecter avant ou après son choix. Le choix ne neutralise aucun adversaire et ne réalise aucun travail sur les cuves, les canaux ou l’eau.

`sampler.started` indique qu’un premier lancement a eu lieu ; il ne signifie pas que le travail continue. `working` porte cette activité. Une interruption hors zone conserve `firstStartedAt` mais remet la progression à zéro ; `startedAt` date l’essai repris. La collecte retire exactement cinq unités de la cuve source, inscrit `collectedAt`, `volumeCollected:5` et conserve la matière à bord. Une source détruite ou passée sous cinq unités, ou un appareil détruit avant collecte, inscrit `lostAt`, `lost:true`, `progress:0` et aucune matière conservée.

### Faits dérivés, preuve et clôture

`campaign.plan` vaut `unselected`, `demolish` ou `secure`. Les phases sont `survey`, `decision`, `operations`, `extraction` et `complete` ; elles ne remplacent pas les indicateurs de travail des objets. Les principaux faits exposés sont :

| Groupe | Champs et distinction |
| --- | --- |
| Cuves | `tanksTotal`, `tanksInspected`, `copiedMarks`, `tanksDestroyed`, `tanksSecured`. Une cuve détruite reste inspectée si son relevé était acquis ; une copie survivante reste comptée. `tanksSecured` compte seulement les cuves isolées encore intactes. |
| Fuite et volumes | `leakContained`, `leakStopped`, `sourceVolume`, `collectorClosed`, `collectorDestroyed`, `spillReleased`, `spillRetained`, `spillDelivered`, `spillInTransit`, `flowResolved`. |
| Eau et habitats | `canalsIntact`, `canalsCovered`, `canalsPolluted`, `waterDispositionRecorded`, `waterRestored`, `homesHabitable`, `villageHabitable`. Une circulation rétablie ne certifie ni la propreté du produit reçu ni la survie des habitats. |
| Registre et prélèvement | `orisonRecordInspected`, `orisonRecordCopied`, `orisonRecordLost`, `sampleStarted`, `sampleCollected`, `sampleLost`, `sampleResolved`, `pt02Acquired`. Un original peut être perdu avec sa copie toujours conservée. |
| Progression | `privateTriggered`, `privateReady`, `privateNeutralized`, `operationsResolved`, `reportTransmitted`, `manifestRead`, plus `context` et `tutorial`. |

`manifestRead` signifie trois cuves inspectées et registre inspecté, y compris leurs ruines. `sampleResolved` signifie collecte ou perte connue. `operationsResolved` exige une conduite choisie et soit trois cuves détruites, soit toutes les cuves intactes isolées avec les autres pertes constatées. Ce dernier fait ne transforme pas une cuve perdue en cuve sécurisée.

`pt02Acquired = sampleCollected && copiedMarks === 3 && orisonRecordCopied`. `evidence.collected` et `stats.evidence` suivent cette condition ; ils ne suivent pas le seul prélèvement. Une acquisition n’est comptée qu’une fois. Des destructions ultérieures ne retirent ni matière ni copies déjà emportées. MI10 n’attribue aucun témoignage TE01 et ne résout pas la chaîne politique globale.

L’extraction à 6060, de rayon 110, exige les huit premiers objectifs complets : relevés, fuite arrêtée, choix, prélèvement résolu, cuves résolues, trois forces neutralisées, écoulement et eau résolus, rapport transmis. La coque à zéro produit `lost`. Une perte de prélèvement peut être consignée dans une mission terminée, avec PT02 absente. Un déversement postérieur au rapport conserve sa transmission acquise mais remet `flowResolved` à faux et verrouille la sortie jusqu’à sa résolution réelle.

### Conservation de matière et surfaces réelles

La troisième cuve fuit à 0,5 unité par seconde. La fuite accumulée est émise par paquets d’une seconde, avec vidage du reste lors du confinement, de la rupture ou de l’épuisement. Une cuve rompue libère immédiatement tout son volume restant. Chaque plume conserve sa masse et avance à 90 unités monde par seconde, avec `y = terrainAt(x,'PL03') - 5`. Ses coordonnées, dates et identifiants restent dans la sauvegarde.

Les invariants se lisent sans compter deux fois l’exposition des canaux :

```text
sum(tanks.volume) + sampler.volumeCollected + spill.pendingMass + sum(plumes.mass) = 300
spill.totalReleased = spill.pendingMass + sum(plumes.mass)
canals[i].contamination = sum(plumes[j].deposits[i])
```

La masse restante est aussi réconciliée séparément pour chaque cuve source. `passedCanals` vaut zéro, un ou deux selon les passages acquis ; `deposits:[0,0]` reçoit la masse de la plume lors du passage dans chaque canal. Ces mesures d’exposition ne retirent pas de matière supplémentaire du courant. À vingt unités reçues, le canal est déclaré pollué. La couverture, la mise en eau et la signature du rapport ne remettent jamais ce compteur à zéro.

Un collecteur fermé et intact arrête une plume à 2960 et lui donne `phase:'retained'`. Cette matière est stockée dans un bassin séparé : rouvrir ou casser la vanne ne draine pas le volume déjà capté. Les nouveaux rejets passent alors vers l’aval. Sans rétention au passage, la plume traverse les canaux, atteint 4780 puis devient `delivered`. `flowResolved` exige une fuite arrêtée et aucun volume en attente ou en transit.

Un canal couvert intact porte les pieds sur l’emprise `x ± w/2` à `terrainAt(x)-10`. Le rendu réutilise `chemicalSurfaceAt` pour son tablier. Sur un canal découvert, un contact réel inflige `max(2, walker.weight*0.04)` points, au plus une fois par valeur de `stats.steps` et par canal ; `lastStep` conserve cette trace. La couverture ne répare pas ces dommages. Le préleveur, les cuves, le collecteur, le registre, les canaux et les habitats reçoivent aussi les projectiles et explosions des deux camps.

### Persistance et preuve de réception

La migration v9→v10 ajoute seulement `world.thyr.chemical` non visité et la version 10. Les neuf rapports antérieurs, leurs mondes, la flotte, les stocks, les checkpoints et l’ancien `stage` sont conservés. La fixture v9 garde l’export natif historique avec sa provenance ; aucune scène ancienne n’est régénérée depuis le moteur courant. Le premier reçu MI10 conserve son registre physique et crédite quatre lots une seule fois. Pour dix premières réussites, le maximum théorique avant dépenses est **46 lots** ; la section MI09 ci-dessus conserve le plafond historique de 42 pour la 0.10.

Les checkpoints conservent l’horloge, les contacts, les projectiles, le générateur, les travaux, les dates de copie/collecte/perte et toutes les plumes. La validation vérifie leurs relations au lieu d’accepter le seul résumé. Une sortie terminale reste terminale. Une reprise avant décision de MI10 exige l’identité exacte avec le checkpoint officiel ; une horloge majorée ne rend pas une perte effaçable. Les relectures ne changent ni le premier reçu ni sa dotation.

`chemical-renderer.mjs`, `Renderer.render` et le HUD lisent les états sans les modifier. L’appareil détruit et la matière conservée à bord sont deux faits simultanément possibles ; les copies survivent à leurs originaux, une couverture peut porter au-dessus d’un canal pollué et une eau remise en circulation peut laisser le village inhabitable. Les indices de progression doivent donc lire les champs correspondants et non seulement le plan choisi.

[mi10-simulation-validation.json](previews/mi10-simulation-validation.json) conserve la réception Node ciblée et ses sources ; [mi10-canvas-validation.json](previews/mi10-canvas-validation.json) et [mi10-scenes.json](previews/mi10-scenes.json) conservent le rendu de scènes atteintes par commandes publiques, les snapshots profonds et l’absence de mutation du renderer. Les exports préparés servent d’entrées à une réception native séparée ; ils ne prouvent pas qu’un utilisateur a accompli les opérations. Les gestes natifs et les essais humains restent décrits uniquement par leurs propres reçus. Voir [CAMPAIGN_MISSION_10.md](CAMPAIGN_MISSION_10.md) et [CAMPAIGN_SAVE_V10.md](CAMPAIGN_SAVE_V10.md).
