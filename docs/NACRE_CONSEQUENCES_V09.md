# ORDRE DE CENDRE — Conséquences de Nacre 0.9

**Version 0.9.0 · 11 novembre 2026 · Dossier v8**

Les quatre missions de Nacre, **MI05–MI08**, sont jouables au stade prototype. Le chenal détermine qui a pu passer, la digue distingue habitants et logements, l’ambulance établit des arrivées sanitaires, puis les portes d’Aval retrouvent ces personnes et organisent un nouveau départ. Chaque mission accomplit ses propres contacts et trajets. Une réussite antérieure ne fournit ni consentement permanent, ni arrivée anticipée au refuge.

Ce contrat complète [MI08 — La marée compte les absents](CAMPAIGN_MISSION_08.md) et le [dossier v8](CAMPAIGN_SAVE_V8.md). Les contrats [0.7](NACRE_CONSEQUENCES_V07.md) et [0.8](NACRE_CONSEQUENCES_V08.md) conservent leur état historique. Leurs branches alors conçues ne doivent pas être relues comme des fonctionnalités déjà livrées à ces dates.

## 1. Quatre missions, quatre opérations réelles

| Mission | Ce qui est établi dans sa scène | Ce qui exige encore une action ultérieure |
| --- | --- | --- |
| MI05 — Le prix du passage | Treuils coupés, bateau de douze passagers arrivé ou perdu, quatre membres de Rive-Courte, facture observée, contact avec Vann, carburant effectivement prélevé. | Retrouver les passagers et l’équipage à Aval; demander un nouveau service et confirmer une destination. |
| MI06 — Les maisons sous la ligne | Dix habitants nouveaux, deux logements, deux techniciens, verrou ou étai, fatigue, circuit, pompes et éventuelle dépense de carburant. | Rencontrer à nouveau les habitants arrivés; demander un service technique. Être vivant ne signifie pas avoir accepté un poste. |
| MI07 — Une ambulance sans escorte | Quatre patients et deux personnels nouveaux, accord à l’examen, constats, balise, témoin, rampe, transfert et arrivée sanitaire. | Retrouver les personnes réellement accueillies. Leur accueil antérieur ne réserve pas un bateau ni un brancard. |
| MI08 — La marée compte les absents | Recensement à Aval, accords locaux, service, places, embarquement, manœuvres, départs, arrivées, replis, documents et rapport. | MI09–MI32, les contrats de retour, les pactes et la défection de MI16 restent conçus. |

La population de MI06 n’est pas composée des passagers de MI05. Les patients de MI07 ne remplacent pas des habitants perdus. Les groupes ne sont pas fusionnés dans un compteur de « civils sauvés » qui permettrait de créer une foule nouvelle.

## 2. Héritages matériels conservés

Les deux lots de carburant de MI05 existent uniquement après prélèvement dans le dépôt intact. MI06 les consomme au terme du branchement de quatre secondes de son auxiliaire. La dépense est inscrite immédiatement; destruction de la pompe, défaite, retour au menu ou recommencement ne la remboursent pas. MI07 et MI08 n’attribuent aucun carburant.

Le stock disponible et la dépense cumulée restent séparés. Une tentative victorieuse de MI06 peut n’avoir rien consommé alors que le dossier indique deux lots dépensés dans une tentative précédente. Le rapport de sortie et le registre d’atelier décrivent donc deux périmètres différents. La relecture emploie son propre état et ne modifie pas ce registre officiel.

MI07 conserve aussi une conséquence spatiale de la digue : la rampe principale exige le verrou achevé, aucun étai et une fatigue strictement inférieure à 65. Les autres états empruntent la voie secondaire. Un technicien survivant ne raccourcit la préparation qu’après sa liaison radio réelle. Des maisons inhabitables déplacent l’accueil civil. Tous les rapports officiels de MI06 réussis ont leurs pompes en service; le raccordement sec prévu pour une simulation isolée ne constitue pas une branche de victoire supplémentaire de la campagne.

À Aval, l’état sanitaire impérial impose une liaison plus longue pour retrouver les arrivants. L’ambulance saisie reste au poste impérial. Aucun véhicule ne réapparaît au quai civil parce que ses anciens occupants participent maintenant au recensement.

## 3. Retrouver sans inventer une identité

Les reçus anciens conservent souvent des totaux, sans liste nominative de chaque personne. MI08 construit alors de **nouveaux identifiants de recensement**. Chaque entrée précise sa mission d’origine, son groupe et la qualité de cette provenance. `sourceKind: aggregate` et `originalId: null` disent explicitement qu’on connaît un nombre de survivants, sans savoir quel ancien individu correspond à cette nouvelle entrée.

Un identifiant comme `aval-resident-survivor-1` ne prétend donc pas être le nom ou l’identifiant physique du premier habitant de MI06. Ce serait inventer une continuité que le reçu historique ne permet pas d’établir. Le nouveau reçu d’Aval conserve en revanche les identités de son propre recensement pour les suites.

Le témoin sanitaire constitue une exception bornée. Son identifiant de MI07 est conservé seulement lorsque le dossier garantit qu’il appartient aux survivants arrivés : sa disponibilité doit être réelle et tous les personnels survivants doivent avoir été accueillis. Une identité connue mais perdue ou restée sans arrivée ne peut pas être attribuée arbitrairement à un autre membre du personnel.

| Groupe susceptible d’être retrouvé | Maximum | Condition |
| --- | ---: | --- |
| Passagers du chenal | 12 | Arrivées réellement conservées de MI05, puis liaison locale. |
| Habitants de la digue | 10 | Arrivées à l’abri réellement conservées de MI06, puis liaison locale. |
| Patients des Salines | 4 | Arrivées sanitaires de MI07, puis liaison correspondant à leur destination. |
| Personnel sanitaire | 2 | Personnel réellement arrivé; identité du témoin conservée seulement si démontrable. |
| Équipage de Rive-Courte | 4 | Contact réellement pris à MI05 et membres encore vivants; nouveau service demandé. |
| Techniciens | 2 | Survivants réels de MI06; service local nouvellement accepté. |
| Mara | 1 | Nouvelle liaison de MI08, suivie de son trajet physique. |
| Responsable du quai | 1 | Personne locale rencontrée à Aval. |

Le parcours de référence sans perte, avec toutes ces liaisons, recense **36 personnes**. Ce nombre est une conséquence de cet héritage précis. Il ne constitue pas un minimum garanti pour les dossiers dégradés. Mara commence hors scène; son absence ne devient pas un décès.

## 4. La présence, le service et l’accord

Les trois liaisons d’origine prennent trois secondes; celle de l’accueil sanitaire impérial prend cinq secondes. Un groupe vide donne un constat de deux secondes, sans conversation ni personne inventée. Les liaisons effectives invitent les personnes retrouvées à rejoindre le quai. Celles-ci doivent encore parcourir la distance. Le poste d’allocation attend les invités en route et un accueil local préparé avant de confirmer les destinations.

Le contact avec Vann ne recrute pas toute la Flotte des Brisants. Il retrouve les membres survivants de l’équipage connu et négocie cette traversée. Un bateau intact sans opérateur disponible ne devient pas un service fonctionnel.

Les techniciens de MI06 sont à nouveau des personnes physiques dans MI08. L’échange de service dure 2,5 secondes. Leur aide exige une acceptation puis leur présence à la commande. Elle réduit la manœuvre de l’amenée de huit à quatre secondes. Ils restent au poste jusqu’à la fermeture intégrale, puis gagnent une niche d’accueil locale distincte du refuge en aval.

Mara demeure une voix dans les scènes de MI06 et MI07. **MI08 établit sa première présence physique de ces scènes** : une nouvelle liaison au poste de service la fait venir depuis sa position hors scène. Son trajet est exposé. Une confirmation ultérieure au quai fixe sa destination. Elle peut accompagner des patients sans rejoindre pour autant l’équipage de Sera ni donner un consentement politique général.

L’accord au quai prend trois secondes. Il fixe une destination pour chaque personne disponible. L’allocation d’un emplacement ne constitue pas encore un embarquement, et l’embarquement ne constitue pas un départ.

## 5. Deux ouvrages et une fenêtre de passage

La porte d’amenée, à x=1 160, règle l’apport au bassin; sa commande se trouve à x=940. La porte de passage, à x=4 760, règle la sortie des bateaux; sa commande est à x=4 540. Chaque ouvrage possède un vantail et un mécanisme avec leurs propres dégâts. L’inspection prend trois secondes pour une porte intacte; le constat d’une porte déjà détruite en prend deux.

La marée locale suit un cycle de **64 secondes**. Les périodes annoncées sont de 8 à 24 secondes et de 40 à 56 secondes. Une annonce favorable ne suffit pas : le passage doit être ouvert à au moins 0,85, le niveau au moins égal à 0,30 et le courant inférieur à la limite du bateau, 0,42 pour Rive-Courte ou 0,32 pour Veille d’Aval. Ces nombres sont des paramètres de simulation, sans prétention de mesure hydraulique réelle.

Fermer l’amenée change progressivement le niveau du bassin. Le courant combine le mouvement de marée et la différence de niveau; il n’est jamais annulé au clic. La pression et la manœuvre usent le mécanisme. Une fatigue élevée sous pression déclenche un avertissement dans la même frame que les premiers dégâts : aucun délai de grâce supplémentaire n’est promis.

La manœuvre manuelle exige ancrage, immobilité et pieds au contact. Elle prend huit secondes. La perte du mécanisme fige l’ouverture; la perte du vantail crée une brèche. L’amenée conserve une obturation de secours de douze secondes, qui limite l’apport sans remettre l’ouvrage à neuf. Les ruines doivent être constatées; elles ne deviennent pas une porte fonctionnelle au moment du rapport.

La pause fige la simulation et sa marée. Un checkpoint conserve horloge, bassin, courant, ouvertures, travaux, personnes et bateaux. Une reprise n’est pas une nouvelle fenêtre de départ choisie par le chargement.

## 6. Places, embarquement et arrivée

| Moyen | Places assises | Brancards | Postes d’opérateur |
| --- | ---: | ---: | ---: |
| Rive-Courte | 18 | 2 | 4 |
| Veille d’Aval | 8 | 2 | 1 |
| Refuge en aval | 34 personnes au total | 4 au maximum | Inclus dans la capacité totale |

Les capacités techniques des deux bateaux ne permettent pas de dépasser les 34 places confirmées du refuge. Chaque bateau transportant des patients exige au moins un accompagnant sanitaire réellement embarqué : un membre du personnel des Salines ou Mara. Cet accompagnant occupe une place assise, distincte du brancard et du poste d’opérateur.

Le contact radio avec le refuge doit être accompli. Une radio détruite avant cet échange ne laisse aucune capacité confirmée. Une passerelle préparée pendant quatre secondes dessert son propre bateau; la destruction de l’une ne transforme pas l’autre en accès universel.

L’embarquement prend deux secondes par personne et quatre secondes par patient sur brancard. Les bateaux attendent leurs personnes, leur opérateur, leur accompagnant lorsqu’il en faut un et leur fenêtre propre. Les coques actives conservent un espace libre de 32 unités. Le passage de x=5 300 inscrit un départ acquis. Il reste alors une traversée, un accostage aux docks distincts de x=5 820 et x=6 040, puis un déplacement individuel jusqu’à la porte du refuge à x=6 100.

L’arrivée est créditée à cette porte. Un bateau au dock ne suffit pas à inscrire tous ses passagers comme accueillis. Une personne arrivée quitte le monde exposé. Le compteur historique des départs reste séparé du nombre d’arrivées et du nombre de personnes actuellement en trajet.

Dans la référence sans perte, la fenêtre et le maintien de l’accès permettent **34 arrivées au refuge et deux techniciens accueillis localement**. L’obéissance immédiate conduit les **36 personnes à l’accueil local**, si leurs trajets et travaux sont accomplis sans perte. Ces bilans ne sont pas attribués par les libellés de choix; ils doivent résulter du parcours.

## 7. Trois conduites, puis des faits

| Choix | Opérations nécessaires | Bilan possible |
| --- | --- | --- |
| Obéir | Fermer les deux accès; préparer l’accueil et faire arriver les personnes restantes. | Fermeture immédiate réellement exécutée et accueils locaux. |
| Accorder une fenêtre | Ouvrir le passage; faire partir les bateaux prêts; revenir à la commande et fermer. | Départs acquis, puis fermeture effective. |
| Maintenir le passage | Conserver une ouverture praticable et protéger les départs; affronter le contrôle annoncé après son arrivée réelle. | Accès maintenu et bilan des personnes effectivement résolues. |

Le choix intervient après les constats nécessaires. Il détermine une conduite, pas la position finale des portes. Une avarie ultérieure peut empêcher la conduite initialement souhaitée. Le dossier conserve alors une exécution endommagée et les ouvrages constatés; il ne transforme pas une intention de fermeture en fermeture accomplie.

Le rapport demande trois secondes au poste après résolution des personnes et des ouvrages. L’extraction vient ensuite. Les dégâts après décision comptent jusqu’à leur résolution réelle. Une première réussite fournit quatre lots d’atelier une seule fois; une relecture n’en fournit aucun. Le passage de Nacre n’ajoute ni carburant, ni preuve PT/PO, ni défection anticipée.

## 8. Pertes, repli et sources

| Événement | Conséquence conservée | Issue praticable |
| --- | --- | --- |
| Passerelle détruite | Capacité de ce bateau indisponible pour embarquer. | Affectation locale ou autre place admissible; aucune passerelle magique. |
| Opérateur ou accompagnant perdu | Service ou transport sanitaire compromis. | Rappel des personnes encore présentes et accueil local. |
| Bateau détruit dans la zone exposée | Places perdues et sort réel des personnes embarquées. | Les personnes hors du bateau conservent leur propre état. |
| Mécanisme bloqué | Ouverture figée, dommage constaté. | Obturation de l’amenée si nécessaire et rapport d’avarie. |
| Registre détruit avant copie | Perte du support sans noms ni clauses reconstitués. | Constat des ruines. |
| Registre détruit après copie | Copie conservée, original perdu. | Rapport distinguant les deux faits. |
| Radio du refuge perdue avant échange | Aucune place d’aval confirmée. | Accueil local préparé. |
| Personne non embarquée | Présence ou trajet toujours suivi. | Repli réel; aucune mort attribuée par défaut. |

Le rappel concerne les bateaux et personnes encore présents. Un bateau déjà sorti garde sa route; le jeu ne l’efface pas du voyage pour le replacer dans la file. Le retour des embarcations présentes puis la marche vers l’accueil local prennent réellement du temps.

La copie du registre établit un lien local entre relogement, destination d’accueil et obligation de travail. Elle ne prouve pas seule qui a posé la balise sanitaire ni qui dirige toute la chaîne PALINODE. La provenance de pose du boîtier de MI07 reste non vérifiée. Les pages, leur support, leur interprétation et leur diffusion demeurent des faits différents.

## 9. Dossier, suite et production ouverte

La migration v7 vers v8 ajoute seulement le dossier de départ non visité et le numéro de version. Les rapports antérieurs et leurs checkpoints sont conservés. Le nouveau reçu garde le recensement individuel d’Aval, l’accord, la destination, le bateau, le départ et le dernier état de chaque personne, ainsi que l’état propre des embarcations.

Une défaite terminale ne se restaure pas comme une partie vivante. Une relecture simule ses pertes et ressources sans modifier les résultats officiels. Un ancien point avant décision ne sert pas à effacer des opérations déjà inscrites. Les fichiers historiques restent authentiques; ils ne sont pas régénérés depuis le code courant.

La suite sur Thyr doit consommer ce que Nacre a réellement laissé : personnes accueillies, personnes perdues, services encore disponibles, logements et pompes, documents copiés ou absents. Un départ vers le refuge ne recrute pas automatiquement son passager dans l’équipage. CT03 et CT04 doivent encore produire leurs scènes, leurs échanges et leurs conséquences. MI09–MI32 restent conçues.

Les comportements ci-dessus sont une tranche jouable à simulation locale simplifiée. Les voix humaines, les gestes finaux d’accueil, la lisibilité spontanée des capacités et la compréhension des trois conduites restent à éprouver séparément. [PRODUCTION_V09.md](PRODUCTION_V09.md) et le [registre des 133 critères](PRODUCTION_REGISTER_V09.md) distinguent ces travaux des livrables et contrôles reçus.
