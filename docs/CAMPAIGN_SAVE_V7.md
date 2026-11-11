# Dossier de campagne v7 — ambulance et continuité de Nacre

La version 0.8 prolonge les six rapports existants avec MI07, **Une ambulance sans escorte**. La simulation reste indépendante du stockage et du DOM. Le module `src/campaign.mjs` applique les transitions à une copie du dossier ; les fonctions de lecture ne modifient ni le fichier importé ni le stockage.

## Progression et compatibilité

MI07 exige le premier rapport réussi de MI06. La présence de PT01 n’est pas une condition d’accès. Les opérations OP01–OP03 restent indépendantes. Le premier succès donne quatre lots d’atelier ; une relecture conserve le premier rapport, le parc, les ressources et les conséquences de campagne.

Le format garde `ordre-de-cendre.campaign`, la clé principale `imperium.campaign.v1` et sa copie `.backup`. Le numéro interne devient 7. Une sauvegarde future non reconnue bloque l’écriture automatique, même si une ancienne copie est lisible.

## Migration v6 → v7

La migration ajoute uniquement `world.nacre.ambulance`, initialisé comme non visité, et passe `version` à 7. Elle ne réécrit aucun checkpoint de MI01–MI06, aucun rapport, aucun dommage d’atelier, aucune relation et aucun registre de carburant. Elle ne crée ni patients arrivés, ni équipe interrogée, ni balise récupérée.

Un fichier qui se prétend v6 mais contient déjà MI07, un objet physique `ambulance` ou un dossier sanitaire est rejeté. Les migrations v1 à v5 continuent d’appliquer leurs ajouts historiques documentés avant cette dernière étape.

La fixture `tests/fixtures/campaign-v6-mi06.json` provient de l’arbre public immuable de la 0.7 : `bc830013455bb8f71e1eaf0316173ac0e91746f8`. Elle est produite par les modules et les commandes publiques de cette version historique. Elle ne doit jamais être régénérée depuis le code courant.

## Héritage matériel

Le nouveau départ lit le rapport officiel de la digue. Le verrou, l’étai, la fatigue et les techniciens survivants déterminent les moyens disponibles. Un technicien disponible n’est pas un technicien déjà interrogé. Un accueil disponible n’est pas un patient arrivé.

Les dix habitants de MI06 et les douze passagers de MI05 conservent leur bilan propre. Les personnes introduites par MI07 appartiennent exclusivement à son dossier sanitaire. Le choix administratif, les observations de cargaison, la récupération de la balise et un éventuel accord à témoigner restent des faits différents.

## Conservation du carburant

MI07 n’attribue et ne dépense aucun lot. Le bilan introduit en v6 reste obligatoire :

`stock disponible + dépense cumulée aux Trois-Vannes = lots acquis dans MI05`

Le coût de la sortie MI06 réussie peut être nul alors que le registre cumulé vaut deux, si une tentative précédente a consommé l’auxiliaire. Le passage à MI07 ne modifie pas cette histoire. Les règles de débit immédiat, d’échec terminal et de redémarrage de MI06 restent décrites dans [le contrat v6](CAMPAIGN_SAVE_V6.md).

## Validation et limites

Le parseur contrôle les champs attendus, les bornes, les identités des objets, les faits physiques et leur cohérence avec le contexte de campagne. Les états avant décision et les reprises doivent conserver leur scène exacte. Une source détruite peut donner lieu à un constat ; elle ne fournit pas les informations qui n’ont jamais été relevées.

Le dossier est un fichier local importable. La validation protège la cohérence du jeu ; elle ne constitue ni une signature cryptographique de l’historique du joueur ni un service de sauvegarde distant. Les tests et les observations de navigateur sont détaillés dans [QA_V08.md](QA_V08.md).

## Échec terminal et reprise sanitaire

MI07 conserve un checkpoint terminal `lost` quand la coque du marcheur est détruite. Le bouton de reprise affiche alors le bilan, sans ressusciter la machine. Le redémarrage doit passer explicitement par `beginCampaignMission(..., { restart: true })` ; il crée une nouvelle sortie et efface son ancien point de décision. Il ne rembourse aucun carburant et ne donne aucun lot d’atelier.

Une sortie sanitaire perdue ne peut pas être remplacée directement par un état vivant ou par une victoire fabriquée à partir d’une copie antérieure. Le contrôle compare la mission, le châssis, la graine, la difficulté et le contexte. Le point avant décision d’une sortie terminale n’est plus proposé. Pour une sortie MI07 encore vivante, cette reprise reste possible : aucun coût persistant extérieur à la sortie n’est engagé par ses interactions. La contrainte d’horloge plus stricte de MI06 demeure séparée.

## Identité du témoin

`witnessConsent` et `witnessId` sont inscrits à la fin de l’échange réel. L’identité reste celle de la personne qui a accepté. `witnessAvailable` est recalculé depuis la survie de cette même personne, sans transférer son accord à l’autre membre de l’équipe. Un accord historique peut donc être vrai et sa disponibilité fausse.

`maraContacted` signifie qu’une transmission radio a effectivement été accomplie après compilation du relevé. Ce relevé peut mentionner une balise perdue : l’appel ne crée ni pièce, ni journal, ni provenance vérifiée.
