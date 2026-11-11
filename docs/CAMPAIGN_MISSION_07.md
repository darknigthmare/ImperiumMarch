# MI07 — Une ambulance sans escorte

**Contrat de la version jouable 0.8.0 · Nacre · Acte I**

La septième mission s’ouvre après le premier rapport de MI06. Elle ne demande ni PT01, ni carburant, ni maisons épargnées, ni techniciens survivants. Le dossier du chantier détermine les moyens disponibles et la route; une voie de repli permet de poursuivre quand l’aide manque.

MI08 reste conçue dans le [contrat de Nacre 0.8](NACRE_CONSEQUENCES_V08.md). Les règles de MI05 et de MI06 conservent leur portée dans leurs contrats historiques.

## Ordre et personnes

Holt désigne un transport de la chaussée des Salines comme dépôt mobile de munitions. Sera doit rejoindre l’Ambulance Quai et établir ce qu’elle transporte. Le marquage reçu ne remplace pas l’observation matérielle du véhicule.

Le transport introduit **quatre patients, une conductrice et un soignant**. Ce sont six personnes nouvelles, simulées individuellement avec leur position, leur santé et leur état. Aucun des douze passagers du chenal ou des dix habitants de la digue n’est transformé en patient de cette mission. Le bilan conserve les patients et le personnel séparément.

VE02 utilise ici un trajet routier. La capacité amphibie du catalogue reste conçue. Tess accompagne l’examen technique; Mara peut être jointe par une action radio facultative. Aucun personnage physique Mara, recrutement ou accord général à témoigner n’est attribué.

## L’état de la digue change l’accès

| Héritage de MI06 | Conséquence dans MI07 |
| --- | --- |
| Verrou achevé, aucun étai, fatigue inférieure à 65 | Accès principal disponible. |
| Étai de secours, verrou absent ou fatigue d’au moins 65 | Accès secondaire; accueil éloigné de 550 unités supplémentaires. |
| Au moins une maison inhabitable | Accueil civil déplacé de 180 unités supplémentaires. Le poste impérial conserve son emplacement de route. |
| Technicien survivant | Liaison radio de 2,5 secondes au poste; après contact, préparation de rampe en quatre secondes. |
| Aucun technicien disponible ou aucun appel accompli | Préparation manuelle en huit secondes. |
| Carburant restant ou dépensé | Stock et dépense conservés; aucun lot ajouté par MI07. |

Le verrou et l’étai permettaient tous deux de terminer MI06. Ils n’établissent pas la même capacité d’accueil d’un transport à la sortie suivante. De même, un technicien vivant dans le dossier ne fournit pas une conversation déjà accomplie. Il faut réellement le contacter au poste, à x = 3050 unités du niveau, avant de compter son guidage. Cet échange ne crée pas un nouveau technicien physique sur la chaussée.

Les pompes mises en service à MI06 et les maisons restées habitables sont des faits séparés. Le niveau ne reconstruit pas les logements pour installer son accueil. La préparation d’accueil demande quatre secondes avec les pompes en service, ce qui correspond à un rapport MI06 terminé. Un contexte de simulation sans pompes conserve un repli de sept secondes; ce n’est pas une autre issue victorieuse de MI06. Les quatre patients appartiennent au véhicule nouvellement introduit.

## Actions distinctes

| Étape | Action et résultat |
| --- | --- |
| Rejoindre | Atteindre la zone où le transport peut être arrêté et protégé. |
| Demander l’arrêt | Donner le signal, dégager les deux barrières en trois secondes chacune ou les détruire, puis laisser le véhicule rejoindre le portique. Une menace active à moins de 420 unités du portique empêche cet arrêt. |
| Obtenir l’accord | Échanger deux secondes avec le personnel disponible pour autoriser l’examen. |
| Examiner la caisse | Trois secondes avec source intacte et accord. Sinon, constat extérieur de deux secondes sans contenu médical affirmé. |
| Démonter le boîtier | Cinq secondes sous ancrage, coque immobile et tous les pieds posés; récupération de la balise, des attaches et du journal. Un boîtier détruit donne un constat de deux secondes. |
| Demander un témoignage | Échange facultatif distinct de 2,5 secondes; identité de son auteur conservée. |
| Compiler puis décider | Réunir les constats de la caisse et du boîtier au terminal, puis choisir la destination. |
| Préparer l’accès | Après décision, déployer la rampe héritée en quatre ou huit secondes et préparer le poste retenu. |
| Ordonner le transfert | Au poste prêt, E engage le déplacement matériel. |
| Accompagner | Protéger le déplacement jusqu’à sa destination ou établir le constat d’une perte. |
| Déployer les chariots | Au quai, cinq secondes avec le soignant vivant, neuf sans lui. |
| Atteindre la porte d’accueil | Patients et personnel parcourent individuellement la dernière distance. Seule cette arrivée crédite leur secours. |

Les actions sont accomplies dans le monde. Une demande d’arrêt ne téléporte pas l’ambulance, un accord ne constate pas la caisse et un choix ne valide pas une arrivée. Le boîtier possède une opération de démontage complète; il n’existe pas de phase préalable d’examen séparée donnant son journal. Les progressions inachevées ne sont pas archivées comme des travaux finis.

L’interface expose le prochain geste et la raison d’une indisponibilité. Les protections et les menaces du trajet doivent être lues avec l’état du véhicule, de la route et des personnes.

## Ce que l’accord permet

Le personnel autorise un examen local. Cet accord ne publie pas des données de soins et ne recrute personne. Après le constat de caisse, une autre interaction facultative permet de demander un consentement à témoigner. Elle dure 2,5 secondes et conserve l’identité de son auteur.

Le témoin accepte de décrire ce qu’il a observé; il ne connaît pas l’auteur de la pose. Si cette personne est ensuite perdue, le consentement historique reste consigné mais `witnessAvailable` devient faux. L’autre membre du personnel ne reçoit pas automatiquement cet accord. La destination du transfert est également distincte des informations effectivement observées.

Un contact facultatif avec Mara n’existe qu’après trois secondes d’appel, une fois le relevé compilé. Le relevé peut décrire une source perdue. La liaison ne place pas Mara sur la chaussée et ne lui attribue pas un témoignage sur la pose du boîtier. Une disponibilité radio n’est pas une transmission réalisée.

## La caisse, la balise et la provenance

La mission traite deux sources matérielles. La caisse permet un constat sanitaire; le boîtier peut être démonté ou relevé comme détruit. Le démontage est distinct du travail sur la caisse. L’objet récupéré, ses attaches et son journal local ne certifient pas qui a ordonné la pose.

`provenanceVerified` reste faux. La mission n’ajoute aucun PT ou PO à la chaîne PALINODE et ne remplace pas PT01 si le journal de Vesper a été perdu. Le relevé local conserve une question précise pour un recoupement ultérieur.

| État de la source | Information conservée |
| --- | --- |
| Caisse intacte, non examinée | Présence, sans contenu d’inspection inventé. |
| Caisse examinée avec accord | Constat sanitaire réellement acquis. |
| Caisse détruite ou aucun responsable disponible pour donner l’accord | Constat extérieur sans contenu médical vérifié. |
| Démontage inachevé | Pas de récupération complète attribuée. |
| Balise récupérée | Objet et relevé acquis, sans auteur de pose identifié. |
| Source détruite avant relevé | Constat de ruines limité à ce qui subsiste. |
| Véhicule détruit après relevé ou récupération | Constat de caisse et balise déjà obtenus conservés. La balise récupérée est retirée des dégâts. |

La destruction d’une source ne doit pas enfermer le joueur dans un objectif d’inspection intacte devenu impossible. La voie de constat conserve une fin de mission, avec une information plus pauvre. Elle ne rend pas les morts disponibles pour répondre.

Récupérer ou détruire la balise déclenche une alerte unique. Deux drones de saisie arrivent dix secondes simulées après ce signal. Avant leur arrivée, ils ne sont ni visibles ni actifs pour les dégâts. Leur présence ne permet pas d’identifier celui qui a posé la balise.

## Deux destinations à atteindre

**Obéir** conduit l’ambulance au poste médical impérial. Le véhicule survivant y est saisi. Ce transfert ne prouve pas que le contenu initial était militaire et ne transforme pas les patients en coupables.

**Contester la désignation** accompagne l’ambulance vers l’accueil civil. Le véhicule qui y arrive reste disponible. Ce résultat ne vaut pas promesse de son conducteur pour toute opération future.

Dans les deux cas, la décision précède le déplacement. Les risques demeurent actifs pendant le trajet et le bilan décrit l’issue réellement atteinte. Un véhicule perdu n’est pas déclaré disponible ou saisi intact par le seul choix. Un patient arrivé et un véhicule utilisable restent deux faits à consulter séparément.

### Remorquer sans conductrice

Le véhicule roule à 48 unités par seconde avec sa conductrice. Si elle est perdue, le soignant ne devient pas automatiquement conducteur. E, à proximité de l’ambulance, lance un attelage au treuil de cinq secondes. Sortir de portée avant son achèvement l’annule sans coût.

L’attelage achevé permet un transfert à 28 unités par seconde, à condition que le marcheur reste à moins de 480 unités. Ce repli reste possible sans aucun personnel vivant. Il ne restaure pas la coque : une ambulance détruite ne peut pas être réparée par l’attelage.

### Le quai n’est pas l’arrivée des patients

Avant l’arrêt, les six personnes sont embarquées et protégées par la carrosserie. Au portique, le personnel sort physiquement pour l’échange, puis remonte avant le transfert. Les personnes dehors peuvent être touchées séparément. Détruire le véhicule tue seulement les occupants encore embarqués; un membre du personnel déjà sorti peut continuer vers l’accueil à pied.

Au quai, E déploie les chariots en cinq secondes avec le soignant vivant, ou neuf sans lui. Les patients parcourent ensuite la distance jusqu’à la porte à 24 unités par seconde tant que le soignant vit, ou 18 sans lui. Ce rythme dépend du soignant, indépendamment de l’usage du treuil pour déplacer le véhicule. Le personnel marche à 32 unités par seconde. Ces vitesses sont des unités de simulation, pas des mètres fictionnels.

Une menace active proche fait attendre le véhicule à moins de 300 unités, ou une personne en trajet à moins de 280 unités. Ces arrêts n’accordent aucun secours. Après destruction du véhicule, la transmission du constat final demande deux secondes; toute personne encore vivante doit néanmoins atteindre réellement l’accueil.

Les personnes sont sauvées seulement lorsqu’elles atteignent la porte. Elles sortent alors des collisions. Un véhicule au quai avec des patients encore embarqués ne donne pas déjà quatre arrivées. Si tous ses occupants ont été perdus, le constat demeure possible sans créer une population de remplacement.

## Dossier, reprise et relecture

Le format v7 ajoute le septième rapport et l’état de l’ambulance. Il conserve les rapports de MI01–MI06, leurs ressources et leurs dégâts. Le stock de carburant et le registre de dépense de la digue ne sont pas réinitialisés.

La sauvegarde d’une mission en cours doit conserver l’arrêt, les échanges, les progressions de travail, les sources et le trajet. Une reprise ne refait pas une action achevée et ne recrée pas un renfort déjà présent. Le premier résultat reste immuable et sa dotation unique.

Une relecture simule son propre contexte sans modifier les personnes, les ressources, le registre ou le checkpoint officiels. Une importation historique est migrée à partir d’une fixture authentique; elle reçoit l’ambulance non visitée, sans jouer rétroactivement la mission.

## Portée et validations

Cette tranche livre un transport local, des interactions et un transfert sanitaire. Elle ne livre pas une simulation médicale, une circulation libre, la navigation amphibie, une politique générale de consentement ou les scènes de sortie de Nacre.

Les QA116–QA136 sont vérifiées à partir des preuves finales décrites dans [QA_V08.md](QA_V08.md) : simulation et dossier, pertes, héritages, reprise, migration, gestionnaires d’interface dans un DOM modélisé, classeur et rendu Canvas. Les journaux conservent les [212 tests Node réussis](validation/v08-node-tests.txt) et les [45 parcours d’interface](validation/v08-ui-runtime.txt); l’[audit indépendant](validation/v08-campaign-audit.json) complète ces suites avec 18 variantes de campagne. Les neuf scènes du [manifeste de rendu](previews/mi07-render-manifest.json) ont été relues visuellement.

Ces preuves conservent leurs limites : le Canvas ne certifie pas le HUD HTML ou un navigateur natif, et le DOM modélisé ne constitue pas une partie humaine. QA137 reste **À produire** pour la compréhension de l’arrêt, des accords, des sources, de la route et de l’arrivée sans guidage extérieur. La vérification du déploiement publié reste distincte.
