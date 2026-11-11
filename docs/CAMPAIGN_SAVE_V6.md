# Dossier de campagne v6 — chantier et consommation

L’application **0.7.0** écrit le format **v6**. Le [contrat v5](CAMPAIGN_SAVE_V5.md) conserve l’historique de l’ouverture de Nacre. `src/campaign.mjs` demeure l’autorité exécutable pour les formes et les transitions.

## Monde persistant et sortie active

`world.nacre.passage` reste le bilan officiel de MI05. Il n’est jamais réécrit par MI06. `world.nacre.dike` conserve le bilan de la première réussite aux Trois-Vannes : seuils inspectés, évacuation ordonnée, habitants arrivés ou perdus, maisons inhabitables, techniciens survivants, verrou ou étai, fatigue, pompes, circuit, auxiliaire, coût de cette sortie, intervention manuelle et mode de rapport. Avant réussite, ces faits restent non visités dans le monde, même si la sortie active contient déjà du travail accompli.

La mission possède `game.dike` et `game.campaign`. Les dix habitants locaux, deux maisons et deux techniciens sont des entités distinctes des personnes de MI05. La réussite exige le sort connu des dix habitants. Un circuit impérial peut conserver dix survivants tout en perdant deux logements. Un étai peut sécuriser le passage sans reconstruire le panneau détruit. Ces états restent séparés dans le reçu.

Le contexte de MI06 comprend exactement `fuelAvailable`, `channelOpen`, `refugeesPassed`, `refugeesLost`, `smugglerVerified` et `bargeCiviliansLost`. Il est fixé au départ depuis le stock et le rapport MI05. Une sortie officielle ne peut pas changer de budget, d’héritage, de châssis, de graine ou de difficulté au milieu d’un checkpoint.

## Trois quantités de carburant

| Quantité | Champ | Signification |
| --- | --- | --- |
| Acquisition | `world.nacre.passage.fuelLots` | Deux lots si le dépôt a été réellement prélevé puis MI05 classée ; zéro sinon. |
| Réserve | `resources.fuel` | Lots encore disponibles maintenant. |
| Dépense cumulée | `world.nacre.fuelSpent` | Lots déjà raccordés officiellement aux Trois-Vannes, même pendant une tentative perdue. |
| Budget de départ | `checkpoint.campaign.context.fuelAvailable` | Stock disponible au début de la sortie courante. |
| Coût de sortie | `checkpoint.campaign.fuelSpent`, puis `completed.MI06.fuelSpent` | Lots raccordés pendant cette sortie seulement. |

Toutes ces quantités valent zéro ou deux. La réserve plus la dépense cumulée égale l’acquisition de MI05. Le budget de départ vaut la réserve actuelle plus le coût de la sortie. Le coût ne peut pas dépasser le budget ni la dépense cumulée.

L’auxiliaire demande quatre secondes à portée. Avant son raccordement final, annuler ne coûte rien. À l’achèvement, `auxiliary.connected` devient vrai et la mission constate deux lots dépensés. Le dossier débite uniquement la différence positive depuis son checkpoint précédent, donc zéro ou deux. Le même point capturé plusieurs fois n’engendre aucun second débit. La pompe détruite après raccordement conserve `connected` et la dépense, mais son état `active` devient faux.

L’interface capture immédiatement cette transition, sans attendre les huit secondes de l’autosauvegarde ordinaire. `finishCampaignMission` règle aussi un coût accompli depuis la dernière capture, qu’il s’agisse d’une réussite ou d’une défaite. Le calcul travaille sur une copie avant de remplacer le dossier ; un état invalide ne doit pas modifier l’original.

### Exemple de deux tentatives

| Étape | Réserve | Dépense cumulée | Coût de la sortie |
| --- | ---: | ---: | ---: |
| MI05 terminée avec prélèvement | 2 | 0 | — |
| Départ de MI06 | 2 | 0 | 0 |
| Auxiliaire raccordée | 0 | 2 | 2 |
| Sortie perdue | 0 | 2 | 2 |
| Nouvelle tentative manuelle | 0 | 2 | 0 |
| Réussite de cette tentative | 0 | 2 | 0 |

Le reçu final ne prétend donc pas avoir consommé du carburant pendant la deuxième tentative. Le hangar indique séparément les deux lots utilisés auparavant.

## Défaite, reprise et relecture

MI06 peut conserver un checkpoint terminal `status: 'lost'`. Le bouton de reprise présente alors le bilan perdu. Restaurer ce point ne remet jamais son statut à `playing`. Il faut recommencer explicitement, avec la réserve restante ; aucune dotation n’est accordée pour la défaite. Les missions antérieures conservent leurs règles historiques de reprise.

Un point avant décision garde une trace de la décision encore ouverte. En MI06, si son horloge est antérieure au checkpoint officiel courant, `restoreCampaignGame(campaign, {beforeDecision:true})` retourne `null`, même à coût égal. Il est également refusé après une dépense ultérieure ou une défaite. Il ne peut pas restituer les lots. Le retour de l’horloge, la diminution du coût ou le changement de contexte d’une sortie sont également rejetés.

Une relecture d’une mission terminée ne modifie ni rapport, ni flotte, ni ressources. Pour MI06, elle utilise le budget initial du premier succès : réserve officielle restante plus coût conservé dans ce reçu. Si la réserve avait déjà été consommée lors d’un échec précédent, le succès manuel puis sa relecture disposent de zéro lot. `checkpointCampaign` et `finishCampaignMission` quittent la voie de mutation officielle pour une relecture.

## Migration fidèle des dossiers v5

La migration v5→v6 ajoute uniquement `world.nacre.dike` non visité, `world.nacre.fuelSpent: 0` et le numéro de version. Elle ne modifie aucun des cinq rapports, choix, pièces, usures, points vivants, projectiles, marées ou travaux historiques. Elle n’ajoute pas `dike` aux anciennes missions.

La fixture `tests/fixtures/campaign-v5-mi05.json` a été exportée depuis le snapshot immuable de la publication **613c07307f2712c5fac28d9403016906e94da168**. Son commit local de correspondance est **c598badad94f81aaaf16f2b13d9e7c11b8508995**. Elle contient un checkpoint MI05 vivant avant le choix et un dossier après extraction. Le checkpoint vivant a déjà physiquement prélevé deux lots, mais sa réserve officielle est encore nulle : la migration ne les crédite pas avant la réussite. Cette fixture ne doit pas être régénérée depuis le code courant.

Les dossiers v1 à v4 passent d’abord par leurs migrations documentées. La lecture ne réécrit pas les octets enregistrés. La première écriture conserve l’ancien primaire comme copie de secours. Les formats futurs, étrangers, surdimensionnés ou incohérents restent protégés contre l’écrasement automatique. Une v5 contenant déjà une digue, un compteur de dépense ou une mission MI06 est refusée.

## Validation et limites

Les validateurs vérifient identités, cardinalités, géométries fixes, phases, santé, pertes, progressions et relations entre objets et faits. Ils comparent les héritages au dossier officiel, les reçus au monde persistant et les quantités de carburant à leur acquisition. Une pompe en service exige une vraie vanne achevée ; un habitant sauvé doit être vivant et arrivé ; un technicien mort ne reste ni arrivé ni à couvert.

`tests/campaign-v6.test.mjs` vérifie les migrations, les deux circuits avec les six châssis, le débit unique, le raccordement partiel, l’échec avant capture, le redémarrage manuel, le point avant décision et la relecture indépendante. La suite UI exerce l’import, le HUD, la pause, les écritures immédiates, leurs refus, les bilans et les archives. [QA_V07.md](QA_V07.md) consigne les résultats observés.

Ces contrôles protègent la cohérence et la continuité ordinaires ; ils ne constituent pas un dispositif contre la triche. Une écriture refusée par le navigateur reste un échec visible, même si la session en mémoire continue correctement.
