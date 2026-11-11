# MI10 — Le champ que personne n’a semé

**Planète :** Thyr (PL03). **Acte :** II — Le coût du silence. **Accès :** après le premier rapport MI09. **Châssis :** WK01, WK02, WK05, WK06, WK09 et WK10. **Dossier :** v10. **Tranche :** prototype jouable 0.11 ; réception humaine distincte des parcours automatiques.

## Situation et portée de la découverte

Le détachement reçoit l’ordre de détruire une réserve attribuée aux rebelles. Trois cuves, une fuite et des canaux alimentant deux habitats occupent les basses terres. Il faut examiner les cuves, contenir la fuite ou constater la perte de sa source, défendre un prélèvement et choisir la conduite à tenir sur les réserves restantes.

Les trois marquages conservés et le registre matériel peuvent relier la matière prélevée aux lots de terraformation d’Orison. **PT02 exige ensemble une matière effectivement collectée, les trois marquages copiés et le registre copié.** Un constat de ruines n’obtient pas une inscription détruite. La matière seule ne reconstitue pas sa provenance.

Ce constat technique participe à la découverte d’un produit employé pour rendre des sols officiellement irrécupérables. Il ne prouve pas toute la chaîne de fabrication, de financement ou de commandement. Aucun témoignage TE01 n’est obtenu dans MI10 ; Leth reste associé à MI11 et la défection à MI16. Le nom du propriétaire de la réserve n’est pas donné par la simple présence des forces privées.

## Héritage limité de la route des vivants

Le contexte vient du premier reçu MI09 : `routeRecorded`, `routeChoice`, `routeApproach`, `routePassagePreserved` et `routeHarvestFragile`. Un itinéraire effectivement guidé permet de fermer le collecteur en trois secondes au lieu de cinq. Ce gain ne dispense pas d’arriver au poste, de s’ancrer et d’accomplir la manœuvre.

Aucune personne de Nacre, aucun animal de MI09 et aucun habitat suspendu ne sont transférés dans cette scène. Les deux maisons des basses terres sont des corps locaux avec une intégrité et un état d’habitabilité. Le prototype n’y invente ni effectif de population, ni identité, ni décès déduit d’un bâtiment endommagé.

## Objets et postes physiques

Le terrain mesure 6 400 unités. Les paramètres de cette table viennent de `mission.chemical` et de l’initialiseur `createChemicalMission`.

| Élément | Positions x | Corps / intégrité | Acte et durée |
| --- | ---: | --- | --- |
| Trois cuves | 800 / 1 400 / 2 000 | 140 × 160 ; 500 points ; 100 unités de matière chacune | Relevé individuel de 3 s. Après choix : isolation de 5 s ou démolition de 3 s, sous ancrage. |
| Collecteur de dérivation | Corps 2 960 ; commande 540 | 72 × 84 ; 400 points | Fermeture de 5 s, réduite à 3 s par le guidage acquis en MI09 ; ancrage requis. |
| Poste de confinement | 2 200 | 42 × 50 | Contenir la fuite de la troisième cuve en 6 s sous ancrage. |
| Préleveur | 2 480 | 64 × 72 ; 420 points | Lancement au contact, puis 20 s effectives dans une zone de protection de rayon 850. |
| Registre matériel | 2 740 | 68 × 76 ; 200 points | Inspection de 3 s ; copie seulement si l’original tient encore. |
| Poste d’ordres | 3 020 | 60 × 70 | Ouvre le choix lorsque les relevés sont faits et la fuite arrêtée. |
| Deux canaux | 3 400 / 4 140 | 260 × 24 ; 320 points chacun | Commandes 190 unités en amont ; pontage individuel de 4 s sous ancrage. |
| Poste de remise en eau | 4 600 | 56 × 60 | Manœuvre de 4 s sous ancrage, après opérations et fin de l’écoulement. |
| Deux habitats | 4 860 / 5 060 | 140 × 100 ; 300 points chacun | Habitabilité dérivée de leur intégrité et des deux canaux. |
| Poste de bilan | 5 660 | 58 × 72 | Transmission de 3 s avec les préconditions matérielles accomplies. |
| Extraction | 6 060 | Point de retour | Approche physique après tous les objectifs. |

Le rayon d’interaction normal vaut 150. Les travaux qui exigent l’ancrage nécessitent une coque immobile, une vitesse inférieure à trois unités par seconde et tous les pieds en contact. Une sortie de portée ou la perte de ces appuis interrompt la progression ; une opération interrompue doit être relancée. Le prélèvement peut être défendu en mouvement dans sa zone et ne requiert pas l’ancrage pendant ses vingt secondes.

La simulation conserve séparément le travail courant, sa progression, son début, sa fin et les dates des actes déjà acquis. Une destruction n’efface pas un ancien relevé. Les cuves et le registre détruits restent inspectables pour constater une perte ; leurs marquages et leur provenance ne repoussent pas sur les ruines.

## Deux conduites, des opérations à accomplir

| Choix | Plan inscrit | Résolution matérielle exigée |
| --- | --- | --- |
| `obey` | `demolish` | Les trois cuves doivent être rompues. Toute cuve encore intacte demande sa démolition sur place. Les volumes libérés continuent leur trajet. |
| `defy` | `secure` | Chaque cuve doit être isolée ou déjà détruite. Une cuve perdue reste une perte au sein de cette conduite ; le choix ne la reconstruit pas. |

Le choix ne touche ni la santé des cuves, ni les volumes, ni les canaux. Les deux branches peuvent prélever avant les opérations. Le dialogue peut également précéder la collecte lorsque les inspections et l’arrêt de la fuite sont déjà acquis. Le troisième choix `delay` appartient uniquement à MI08.

Le choix est définitif pour la sortie officielle. Les conséquences ultérieures restent ouvertes : une cuve isolée peut encore être touchée, un canal couvert peut être détruit et une réserve retenue n’efface pas une pollution arrivée précédemment.

## Matière, fuite et bassin de rétention

Les trois rôles de cuve sont `carrier`, `binder` et `active`. La troisième porte la fuite et le prélèvement. Tant qu’elle contient de la matière, qu’elle tient et que le confinement n’est pas terminé, elle perd **0,5 unité par seconde simulée**. La matière est émise en nappes datées, habituellement à chaque seconde ; le confinement ou la rupture libère aussi le petit volume en attente. Une rupture libère tout le volume qui restait dans la cuve concernée.

Chaque nappe avance à **90 unités par seconde**, depuis sa vraie cuve. Elle ne se téléporte pas au village à la décision. Elle conserve son identifiant, sa source, sa masse, sa date de départ, sa phase et, après arrivée, sa date d’arrivée. Les phases sont `flowing`, `retained` et `delivered`.

Le collecteur fermé dérive les nappes à x=2 960 vers **un bassin distinct**. Les masses déjà retenues restent dans ce bassin après réouverture ou destruction de la vanne. La destruction du bassin n’est pas simulée. Une nouvelle nappe rencontrant la vanne ouverte ou détruite poursuit son trajet vers les canaux puis x=4 780, où elle compte comme livrée au secteur du village.

Le bilan matériel respecte l’égalité suivante :

`volumes restants des trois cuves + volume collecté + fuite en attente + masse de toutes les nappes = 300`.

Le volume du prélèvement achevé vaut cinq unités. `spillReleased` égale la somme des masses retenues, livrées et encore en transit, y compris la fuite en attente. Un dépôt sur un canal est un relevé d’exposition historique : il ne soustrait pas une seconde fois la masse de la nappe. Les contrôles rapprochent aussi chaque cuve de ses propres nappes, le débit de l’horloge et les positions de la durée de trajet.

## Canaux, appuis et habitabilité

Les couvercles portent les vrais pieds du marcheur. `chemicalSurfaceAt` fournit le même relief de dix unités au moteur et au rendu. Un appui sur un canal découvert peut lui infliger une charge liée à la masse du châssis ; un pontage ultérieur ne rend pas les points déjà perdus. Les six châssis peuvent préparer le pontage depuis l’amont avant de poser un pied sur le canal.

Un couvercle protège les appuis et la structure. **Il ne filtre pas le produit et ne dépollue pas le canal.** Chaque nappe passée ajoute sa masse à l’exposition du canal traversé. À partir de vingt unités d’exposition sur l’un des deux canaux, les deux maisons cessent d’être habitables, même si leurs murs sont intacts.

Un habitat est habitable si son propre corps tient, que les deux canaux tiennent et que chacun reste sous le seuil de contamination. Le village est déclaré habitable si les deux habitats le sont et que le collecteur n’interrompt plus l’alimentation. Ces faits ne représentent pas un recensement de personnes.

La remise en eau ouvre le collecteur après les opérations et la fin de l’écoulement. Elle consigne le sort du circuit même si un canal est détruit. `waterDispositionRecorded` désigne cet acte accompli ; `waterRestored` exige ensuite deux canaux intacts et un collecteur ouvert. Une circulation rétablie peut rester polluée. Elle ne garantit donc pas `villageHabitable`.

## Prélèvement et intervention privée

Le lancement du prélèvement exige les trois inspections de cuves et l’inspection du registre. Il ne suffit pas d’être à proximité du marqueur de preuve. La collecte exige vingt secondes effectives à portée de protection, une source suffisante et un appareil intact. Sortir de la zone interrompt l’essai ; sa première tentative reste datée, mais la prochaine doit refaire le travail.

La perte de la source ou de l’appareil avant collecte rend le prélèvement définitivement perdu pour cette sortie. L’épuisement d’une cuve encore debout peut également provoquer cette perte. Il reste possible de terminer une mission avec un rapport honnête sans PT02. La perte du prélèvement n’est pas, à elle seule, une défaite du marcheur.

Après collecte, la matière est conservée à bord. La destruction ultérieure de la source ou du préleveur ne l’efface pas. De même, les marquages et le registre déjà copiés survivent à la perte de leurs originaux. PT02 reste acquise si toutes les pièces nécessaires étaient réellement réunies.

Trois emplacements privés sont réservés : drone à x=3 120, tireur à x=3 680 et buggy à x=4 380. Les forces n’entrent dans le monde actif que **cinq secondes après le premier événement matériel** : lancement du prélèvement, rupture d’une cuve ou perte matérielle du prélèvement. Cette dernière peut provenir de la source, de son épuisement ou de l’appareil. La sauvegarde distingue les causes `sample`, `demolition` et `source-loss`.

Avant cette arrivée, les unités ne sont ni dessinées, ni actives, ni endommageables. Pendant un prélèvement en cours, leur comportement peut viser l’appareil ; après résolution, elles reprennent leurs cibles ordinaires. Leurs projectiles et ceux du joueur rencontrent les corps physiques du champ. Tirer à travers un élément du chantier peut donc compromettre la source, le registre, un canal ou un habitat.

## Rapport, dommages tardifs et extraction

La transmission demande les inspections ou constats, un choix, les trois opérations résolues, le prélèvement collecté ou perdu, les trois forces effectivement arrivées puis neutralisées, la fin de l’écoulement et la disposition de l’eau accomplie. Elle prend ensuite trois secondes au poste aval.

La transmission est un acte historique. Si une cuve isolée est rompue après le rapport, la date de transmission reste acquise, mais la nouvelle nappe remet l’objectif d’écoulement en attente et **verrouille l’extraction jusqu’à son arrivée effective**. Le bilan final conserve les dommages, les masses et l’habitabilité réellement présents à l’extraction ; il ne rétablit pas la scène observée au moment de la transmission.

Une coque détruite donne un état terminal `lost`. Le dossier conserve cette sortie et ne la réanime pas à l’import. Un redémarrage explicite crée une nouvelle sortie sans nouveau rapport ni remboursement du stock de campagne.

## Interfaces et sauvegarde

`game.chemical` existe uniquement dans MI10 ; les scènes antérieures ne reçoivent aucun champ supplémentaire. Les réglages appartiennent à `mission.chemical`. Le dossier durable est `world.thyr.chemical` et commence vide lors de la migration v9 vers v10.

`chemicalContext`, `chemicalDecisionBody`, `chemicalSurfaceAt` et `chemicalReceiptRoster` sont les interfaces communes de la simulation, de l’interface et du dossier. Le reçu contient une copie profonde de toute la scène chimique et le bilan individuel `{id,type,hp,maxHp,dead}` de chacune des trois forces privées.

Le [contrat du dossier v10](CAMPAIGN_SAVE_V10.md) détaille l’authenticité de la fixture historique, les refus d’import, les contrôles de masse et de chronologie, la reprise et la dotation unique. Le premier succès attribue quatre lots ; une relecture garde le premier reçu et n’attribue aucune nouvelle preuve à la campagne.

## Vérifications et limites

Le pilote `tests/helpers/mi10-driver.mjs` emploie exclusivement les commandes publiques de déplacement, ancrage, interaction, visée, tir et choix. Il n’avance pas le résultat en modifiant positions, santé ou horloge. Les captures copient profondément leurs états à l’instant demandé.

`tests/mi10-simulation.test.mjs` couvre les douze combinaisons châssis/choix, les opérations, le prélèvement défendu et interrompu, les dommages avant et après collecte, les appuis, les flux, le bassin et les pertes terminales. `tests/campaign-v10.test.mjs` complète ces parcours avec les migrations authentiques, les reprises, les reçus, les données falsifiées et l’absence de prime répétée. Les reçus de validation nomment les sources et commandes effectivement testées.

Les scènes produites par `tools/render-mi10-previews.mjs` sont des états simulés rendus par Canvas. Elles restent distinctes des observations natives dans Chrome, des essais humains et du matériel de contrôle réel. La simulation n’établit pas un modèle chimique réel, une pollution sur plusieurs saisons, un recensement des habitants ou la destruction du bassin de rétention. Les 22 missions MI11–MI32 restent conçues.
