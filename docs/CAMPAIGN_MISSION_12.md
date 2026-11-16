# MI12 — Le troisième relais

## Statut de cette reconstruction

Cette mission rétablit le contrat connu de la tranche locale 0.13 à partir de la base publique 0.12, de la fiche MI12 de la Bible et des traces de livraison conservées. Le code, les formes graphiques et les nouvelles preuves sont ceux de la reconstruction 0.14.1. Ils ne sont pas présentés comme une récupération à l’octet près de l’archive perdue. Les anciennes quantités de tests ne constituent pas la réception de cette version.

MI12 reste un prototype jouable de la campagne. Le rapport de MI11 ouvre son déploiement sur Thyr. Les opérations OP01–OP03 sont indépendantes. MI12 ne déclenche pas la défection prévue à MI16.

## Ordre et terrain

Holt demande l’effacement des trois relais avant l’inspection d’Orison. Le troisième garde des commandes du traitement industriel de Thyr. Le joueur doit relever les appareils, protéger une copie complète, neutraliser le marcheur de sécurité Prétoire puis accomplir les opérations demandées par son choix.

| Élément | Implantation dans la scène | Fonction physique |
| --- | --- | --- |
| Relais 1, 2 et 3 | x = 1460, 2670, 3740 | Trois corps destructibles, inspections et opérations séparées |
| Console de copie | x = 3580 | Copie de 24 secondes dans une fenêtre de 45 secondes |
| Prétoire VE12 | x initial = 4210 | Quadrupède bas ancré, capteur supérieur et verrou frontal distincts |
| Poste d’ordre | x = 4300 | Choix de conduite après copie ou constat de son impossibilité |
| Poste de rapport | x = 5400 | Transmission de 3 secondes après résolution matérielle |
| Extraction | x = 6000 | Déplacement réel après transmission |

Les positions, points de vie, appuis, composants et dates proviennent de `src/relay-simulation.mjs`. Le renderer lit ces corps ; il n’invente pas un autre emplacement pour leur collision.

## Déroulement

1. Approcher chaque relais et lancer une inspection de 3 secondes avec **E**, sous ancrage et avec tous les pieds au sol. Un relais détruit donne un constat de perte, pas une archive reconstituée.
2. Après les trois inspections, l’accès à la copie reste ouvert 45 secondes de temps simulé. La copie réclame 24 secondes continues, ancré dans le rayon de 190 autour de sa console. Interrompre le travail remet sa progression à zéro ; la fenêtre continue tant que la simulation avance. Une pause ne consomme aucune seconde.
3. L’alerte fait arriver le Prétoire après 6 secondes. Il ne peut ni tirer, ni être touché, ni apparaître comme une cible active avant cette arrivée.
4. Choisir la conduite au poste d’ordre. Ce choix ne change ni l’intégrité d’un relais, ni son état d’effacement ou d’isolement.
5. Revenir sur chaque appareil concerné et accomplir l’intervention de 5 secondes sous ancrage. Les pertes déjà acquises restent des pertes ; aucun choix ne répare les appareils.
6. Après résolution de la copie, des trois relais et du Prétoire, transmettre le rapport pendant 3 secondes, puis rejoindre l’extraction.

## Trois conduites

| Choix enregistré | Plan | Actes à accomplir sur les appareils encore présents | Conséquence locale |
| --- | --- | --- | --- |
| `obey` | `erase` | Effacer les trois relais | Holt reste informé des pertes constatées ; une copie déjà embarquée demeure conservée |
| `defy` | `preserve` | Effacer les deux premiers, isoler le troisième | Écart relevé par Holt ; conservation clandestine du troisième poste |
| `refuse` | `open` | Isoler les trois relais sans effacement | Refus public et fermeture du refuge impérial |

La réaction d’Ilan dépend de la conduite et de l’existence d’une copie achevée. Elle est conservée dans le dossier de mission (`ilanTrustDelta`), sans inventer une rencontre supplémentaire ni un recrutement. Les relations persistantes existantes de Tess et Sami, ainsi que l’attention du commandement, sont mises à jour une seule fois au premier rapport.

## Combat contre le Prétoire

Le Prétoire comprend une coque, quatre appuis, un capteur supérieur et un verrou hydraulique frontal. Détruire le capteur réduit la portée et la précision de la visée. Rompre le verrou retire son ancrage, modifie son déplacement et expose davantage sa coque. Les tirs sont de vrais projectiles avec temps de trajet. Les composants peuvent être visés selon les angles effectivement dégagés par le châssis du joueur.

Le corps du Prétoire est distinct de la liste générique des ennemis. Son état, ses tirs et les dates de rupture sont conservés dans `relay.praetor`. Le validateur de sortie permet à la date du dernier tir d’avancer tout en interdisant de restituer l’intégrité des composants ou de réécrire leur date de destruction.

## Sources, limites et pertes

`ordersCopied` et `industrialOrdersCopied` désignent la même copie locale. L’archive n’est acquise qu’au terme des 24 secondes. La destruction de l’original après cette acquisition ne supprime pas la copie. Une destruction avant la fin, un effacement préalable ou l’expiration sans copie achevée ne révèle pas le texte manquant.

La copie compte comme une pièce locale recueillie. Elle ne donne aucune nouvelle preuve nommée PT03, PT04, TE02 ou PO01. Les faits hérités de MI11 sont limités au rapport, à sa conduite, à TE01 réellement acquise et à la disponibilité réelle de Leth ; PT02 vient du rapport de MI10. Aucune source absente n’est fabriquée.

## Dossier et reprise

Le premier rapport ajoute quatre lots d’atelier et ouvre MI13. Une relecture garde le premier reçu et n’accorde aucun lot supplémentaire. Le reçu conserve un roster détaché de la simulation : relais, fenêtre, copie, Prétoire, composants, ordre et transmission.

L’export conserve exactement les travaux en cours, la fenêtre et les dates. Une reprise utilise la même horloge, les mêmes entrées et le même générateur aléatoire. Une sortie perdue reste perdue ; elle exige un redémarrage explicite et ne crée pas de rapport de victoire. Un point de décision devenu antérieur à l’état officiel n’est pas offert comme retour en arrière.

## Vérification et réception

- `tests/mi12-simulation.test.mjs` vérifie les règles physiques du module.
- `tests/helpers/mi12-driver.mjs` pilote avec les commandes publiques ; il ne remplace pas les corps, les points de vie ou les résultats par des valeurs gagnantes.
- `tests/campaign-v12.test.mjs` couvre migration, provenance historique, branches, export/reprise, pertes, falsification de reçus et attribution unique.
- Les preuves exécutées de la reconstruction sont consignées dans ses rapports de validation. Les scènes Canvas, les tests de DOM modélisé et une éventuelle réception navigateur restent des preuves distinctes.

