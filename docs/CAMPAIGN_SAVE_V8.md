# Dossier de campagne v8 — départ de Nacre

## Migration et conservation

Le format reste `ordre-de-cendre.campaign`, sous la même clé locale `imperium.campaign.v1`. Le numéro passe à **8**. Le lecteur accepte les formats historiques 1 à 7 et le format courant. Un format futur ou inconnu protège le fichier existant contre l’autosauvegarde. La première écriture d’un dossier historique valide conserve ses octets dans la clé de secours.

La migration **v7 → v8 ajoute uniquement `world.nacre.departure` non visité et change le numéro de version**. Elle ne réécrit ni les scènes antérieures, ni les rapports signés, ni les personnes, ni les munitions, ni le parc d’atelier. Réserve de carburant et dépense cumulée de MI06 restent distinctes. Un champ de départ, une scène MI08 ou un rapport MI08 introduit dans un fichier prétendument v7 est rejeté.

La fixture `tests/fixtures/campaign-v7-mi07.json` est authentique. Elle provient du snapshot public immuable `0ae303a7b04d45472dc17154039ddc73760dc97a`, arbre `692dee9f3fccd9970a8c2f0b5ee5af9a5ad821c2`. Les 332 blobs du snapshot ont été vérifiés avant capture. SHA-256 de la fixture : `8ca58deb11f4048039cda3a54157f7eddb2dd6af6a34450a3d177b3bdfa67a5c`. Le fichier contient une scène de transfert native, sa continuation terminée et quatre variantes historiques obtenues exclusivement avec le code ancien. La provenance détaillée figure dans `validation/v09-historic-v7.json`.

## Héritage de MI08

MI08 exige le premier rapport complet de MI07. Le contexte est construit depuis les dossiers officiels du chenal, de la digue et de l’ambulance. Il comprend les survivants arrivés, les pertes, les contacts établis, l’état du chantier, la destination sanitaire, le véhicule et le témoin. Il n’attribue aucun carburant supplémentaire.

Les anciens rapports conservaient souvent des nombres plutôt qu’une liste de personnes. Les personnes de MI08 reçoivent donc de **nouveaux identifiants de recensement** et une provenance `aggregate`. Le code ne prétend pas connaître leur identité individuelle antérieure. Le témoin sanitaire peut conserver son identifiant connu uniquement si le dossier garantit sa présence parmi les survivants arrivés. Les morts historiques ne sont jamais recréés. Mara commence hors scène et ne rejoint physiquement le quai qu’après une nouvelle liaison.

## Scène et registre final

Le checkpoint conserve toute la simulation : marée et niveau du bassin, deux portes et leurs mécanismes, appels en cours, personnes avec santé et positions, allocations, brancards, bateaux et passerelles, trajet, débarquement, refuge, accueil local, registre et transmission du rapport. Les pieds, projectiles, graines aléatoires, munitions et paramètres du châssis sont conservés avec le reste de la scène.

Le dossier final conserve séparément :

- conduite demandée (`close`, `window`, `open`) et exécution constatée (`immediate`, `delayed`, `open`, `damaged`) ;
- personnes recensées, au quai, à bord, parties, en transit, arrivées au refuge, accueillies localement et perdues ;
- patients et capacités de brancards, distincts des places assises et des opérateurs ;
- chaque nouvelle identité MI08, sa provenance, son accord, sa destination, son bateau et son dernier état ;
- chaque bateau, son intégrité, son départ, son arrivée ou son retour ;
- portes, obturation de secours, disponibilité du refuge, copie documentaire et transmission réelle.

`peopleDeparted` reste historique. Il ne remplace pas `peopleArrived`. Un départ ne peut pas être déduit d’un clic de décision. Les pages déjà copiées restent conservées si le support d’origine est détruit.

## Validation

`src/departure-validation.mjs` vérifie le recensement attendu depuis l’héritage, les identifiants, les champs autorisés, les capacités fixes, la géométrie, les phases, la santé, les accords, les destinations, le courant et les faits dérivés. Les compteurs doivent correspondre aux personnes et aux bateaux physiques. L’arrivée au refuge exige une sortie navale acquise, l’arrivée du bateau et le déplacement individuel jusqu’à la porte. Une permission d’accueil ne crée aucune arrivée.

Les trois choix `obey`, `delay`, `defy` sont acceptés **uniquement dans MI08**. Les anciennes missions restent limitées à leurs choix d’origine. Le registre de relogement ne crée aucune preuve PT/PO et ne constitue pas la défection de MI16.

La perte de MI08 est conservée au checkpoint terminal. Un ancien point de décision ne rembobine pas une sortie qui a progressé. Pour repartir après une perte, le joueur doit recommencer explicitement. Une réussite attribue quatre lots d’atelier une seule fois ; huit réussites sans dépense donnent au maximum 38 lots. Le rejeu conserve intégralement les premiers rapports, l’atelier, les ressources et les relations.

## Vérification et limites

Les tests `tests/campaign-v8.test.mjs`, le pilote public `tests/helpers/mi08-driver.mjs` et l’audit indépendant de campagne vérifient migration, import/export, interruption, variantes, rejets de données contradictoires et pureté du rejeu. Les exports JSON sont des dossiers locaux validés structurellement, pas des signatures cryptographiques de partie ni un dispositif contre la triche. Les preuves natives et leurs limites sont décrites séparément dans le rapport de validation de la 0.9.
