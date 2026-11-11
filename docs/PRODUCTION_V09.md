# ORDRE DE CENDRE — Production et réception 0.9

**Version 0.9.0 · 11 novembre 2026**

La 0.9 rend jouable **MI08, La marée compte les absents**, et produit des lots de pièces, décors, sons, commandes et suivi qui étaient encore ouverts. Elle porte la campagne au stade prototype à **huit missions**, avec six châssis, trois opérations indépendantes et un dossier de sauvegarde v8. Les **24 autres missions principales**, seize contrats, six autres châssis jouables et quatre familles de fins restent à réaliser dans leur portée complète.

La réception part d’une liste précise : **133 fiches À produire en 0.8**, soit 56 Assets, 38 Production et 39 QA. Chaque fiche reste consultable avec son critère d’origine, le travail reçu, sa preuve, ses dépendances et son reste. Un changement de statut ne supprime pas l’exigence initiale.

Le [registre complet](PRODUCTION_REGISTER_V09.md) est la lecture par ID. Sa [version structurée](validation/production-v09-registry.json) permet de retrouver les preuves et les décisions de réception. La [baseline immuable](validation/production-v09-baseline.json) conserve les 133 lignes exactes avant intervention.

## 1. Ce qui est produit

| Domaine | Livraison de cette tranche | Limite conservée |
| --- | --- | --- |
| Fin de Nacre | Deux portes, courant progressif, contacts, consentement, bateaux, capacités, départ, arrivée au refuge et accueil local. | Simulation hydraulique locale simplifiée; CT03/CT04 et le départ vers Thyr restent conçus. |
| Dossier | Migration v7 vers v8, nouveaux reçus de personnes et bateaux, reprises, premier rapport et relecture isolée. | Les anciens agrégats ne deviennent pas des identités historiques inventées. |
| Marcheurs | Pièces SVG, rigs, poses et primitives partagées avec Canvas pour les six châssis jouables. | Planche de poses et code de rig ne démontrent pas une animation finale en mouvement. |
| Décor et accessoires | Modules de chantier, sanitaires, hydrauliques, quais, portes et bateaux. | Le kit ne constitue pas tous les niveaux finis ni les huit biomes complets. |
| Audio | Signaux, ambiances, motifs, exports WAV et moteur de synthèse intégré. | Voix humaines, interprétation et mix final restent absents. |
| Commandes | Onze actions clavier reconfigurables et entrées de manette standard en mission. | Menus à la manette, essai matériel réel et essais avec utilisateurs concernés restent ouverts. |
| Interface | Journal sanitaire, registre d’Aval, étapes de travaux, destinations et préférences. | Un parcours DOM modélisé ne certifie pas focus natif, rendu CSS ou perception humaine. |
| Bible et production | 816 fiches, conservation des 769 IDs, audit des références et suivi des 133 critères. | Les compteurs de fiches ne mesurent pas le pourcentage du jeu terminé. |

Le [contrat de mission](CAMPAIGN_MISSION_08.md) précise les actions de MI08. Le [contrat de conséquences](NACRE_CONSEQUENCES_V09.md) fixe les populations, services, identités, destinations et états hérités. Le [contrat du dossier](CAMPAIGN_SAVE_V8.md) décrit migration, reçus et refus de données contradictoires. La [documentation des commandes et du son](CONTROLS_AUDIO_V09.md) indique la portée réellement intégrée.

## 2. Recevoir un livrable sans perdre son critère

La baseline vient du JSON authentique du commit local `03c69e73175d6e2d61f59f6f9ba8ee80da827103`. Son blob est `779ba0d759b808466372026daed23e86e3ef1398` et le SHA-256 du JSON source est `91c50ed7bd1dcf4fa267de68a1708535848af8fb48901b9e18f043d048c7b8ef`. L’histoire publique précédente emploie le commit `0ae303a7b04d45472dc17154039ddc73760dc97a`; les deux provenances ne sont pas confondues.

La baseline des 133 lignes possède sa propre empreinte : `11a290b1daa7faedbd227c4fcb50ae4a86296aba75cf34b3718e540a2df7affb`. Elle n’est pas régénérée depuis le JSON modifié. Le registre conserve les critères textuels, les dépendances explicites et le statut initial de chaque ligne.

La réception distingue trois questions :

1. **Le fichier ou le comportement existe-t-il ?** Une pièce SVG, un export WAV, une fonction intégrée ou un protocole rédigé peuvent être localisés et inspectés.
2. **La portée annoncée a-t-elle été contrôlée ?** Un manifeste, une collision, un parcours public ou un recalcul doivent avoir leur propre preuve.
3. **Le critère initial est-il satisfait ?** Une exigence de perception humaine, d’art final, de matériel réel ou de campagne complète demeure ouverte tant que cette partie n’a pas été exécutée.

Le statut **Prototype** peut donc attester un lot partiel reçu tout en gardant une finition ouverte. **Vérifié** s’applique à un contrôle exécuté dans sa portée déclarée. La présence d’un protocole d’essai ne rend pas son résultat vérifié. Les contrôles anciens réellement couverts sont reliés à leurs preuves historiques, sans prétendre avoir été exécutés sur une version qu’ils n’ont pas testée.

PR17 exige à la fois MI01–MI08 et CT01–CT04. La livraison de MI08 fait avancer ce chantier mais ne le clôt pas : les quatre contrats restent conçus. PR24 progresse grâce aux commandes; son critère matériel et humain reste également ouvert. Cette règle évite de réduire les exigences pour améliorer un compteur.

## 3. Pièces, rigs et modules visuels

Le lot de production comprend **287 SVG, six rigs JSON et cinq planches PNG**, couvrant 21 composants, douze silhouettes et six rigs de châssis jouables. Le [manifeste](../assets/production/manifest.json) conserve les chemins, tailles et empreintes. Les primitives vectorielles et Canvas partagent leur définition; les positions des pieds et la zone du radiateur restent issues de la simulation.

La réception concerne notamment AS02, AS03, AS04 et AS31 pour les pièces et rigs; AS05 pour les douze silhouettes; AS36 et AS41 pour les états du radiateur; AS17, AS39, AS40, AS44–AS46, AS48–AS50, AS52 et AS60 pour les modules. Le détail par lot figure dans le [README des assets](../assets/production/README.md) et le [reçu contrôlé](validation/production-v09-assets-receipt.json).

Les six silhouettes encore conçues ne deviennent pas jouables. Un rig de huit pièces ne livre pas tous les équipements amovibles. Une planche de six poses ne montre pas tout le débattement d’une jambe pendant le déplacement. La validation finale doit aussi observer profondeur des membres, collisions, lisibilité au zoom minimal et gestes d’intervention en mouvement.

Les modules de Nacre fournissent une première matière cohérente pour la tranche. Ils ne représentent pas tous les arrière-plans, toutes les activités civiles ou une simulation écologique complète. Les animations détaillées de personnel, de secours, d’accueil et de travail manuel demeurent des tâches identifiées, avec leur lien au compte réel de personnes.

## 4. Sons, événements et provenance

Le lot audio contient **56 WAV** : 44 signaux, huit ambiances, trois motifs et un montage de 36 secondes. Les exports sont mono, à 22 050 Hz et 16 bits. Leur volume total est de **8 840 028 octets**. Le [manifeste audio](../assets/production/audio/manifest.json) identifie chaque fichier; le moteur synthétise les mêmes familles sans requête réseau. Les WAV restent des exports téléchargeables et ne sont pas intégrés comme fichiers binaires au HTML autonome.

Le contrôle indépendant du lot a rapproché **354 fichiers uniques** — SVG, rigs, PNG et WAV — de leurs chemins, tailles et SHA-256. Les **19 tests dédiés** ont été exécutés avec succès dans le [journal de réception](validation/production-v09-assets-audio-tests.txt). Ils incluent un parcours public de MI07 jusqu’aux six arrivées pour vérifier la relation entre événements et signaux. Leurs scénarios de transition MI08 ne sont pas présentés comme une partie MI08 complète.

Les codes de lot se recouvrent : un même fichier peut contribuer à plusieurs critères. Leur nombre par étiquette ne doit pas être additionné pour fabriquer un total d’assets distincts, ni converti en taux de finition.

Les signaux de coque, de pattes, de radiateur, de pression, de travaux et de transport doivent suivre les faits. Un son de réussite ne produit pas une arrivée ou une preuve dans le dossier. Pause, annulation et fin de travail doivent arrêter les boucles correspondantes. Les voix de Holt, Vann, Mara et du personnel, l’interprétation, les transitions finales et l’écoute du mix en situation restent à produire.

Le rapprochement des seuls nouveaux exports ne suffit pas à QA30. Le registre de distribution rapproche aussi les médias historiques réellement embarqués, les inclusions inline et les fichiers exclus. Il conserve les lacunes documentaires de provenance au lieu d’inventer un identifiant de génération, une date ou une licence. La revue commerciale PR26 reste une tâche différente.

## 5. Commandes et interface

La reconfiguration couvre onze actions de mission, garde une carte complète et refuse les conflits. Échap reste disponible pour la pause. Une capture abandonnée en quittant le panneau ne transforme pas la prochaine touche de navigation en nouvelle commande. Des préférences endommagées reviennent à des valeurs sûres.

La manette utilise la correspondance standard, une zone morte et la visée au stick. Un nouveau périphérique ou un retour de focus exige le neutre avant de reprendre ses commandes. Déconnexion et perte de focus libèrent les actions. La pause réagit à une nouvelle pression, sans se déclencher continuellement tant que le bouton est tenu.

Les tests purs emploient des états de périphérique synthétiques. Les parcours d’interface appellent les gestionnaires réels dans un DOM modélisé. Ces contrôles ne certifient ni une manette physique, ni le confort d’utilisation, ni une navigation des menus à la manette qui n’est pas implémentée. Le critère humain initial de PR24 est conservé dans le registre.

Le journal sanitaire et le registre d’Aval exposent les résultats réellement acquis. Les différences entre destination, véhicule, personnes, départ et arrivée doivent rester visibles. Les contrôles natifs de navigateur sont reçus séparément, avec environnement, dimensions, actions observées et limites. Un screenshot de Canvas ne remplace pas ces parcours.

## 6. Validation et état de réception

Les nouvelles QA138–QA158 séparent parcours, courant, ouvrages, contacts, héritages, accords, capacités, arrivées, pertes, sources, choix, migration, intégrité, reçu, commandes, assets, audio, interface, rendu, classeur et essai humain. QA158 demeure réservée à une partie humaine sans guidage.

**La réception finale des suites MI08, du navigateur et du classeur est consignée après leurs exécutions sur sources figées.** Les journaux intermédiaires ne suffisent pas à attribuer ces résultats finaux. Le présent état de travail ne marque pas ces contrôles vérifiés par anticipation.

Les preuves doivent distinguer commandes publiques, stimuli de collision isolés explicitement déclarés, DOM modélisé, rendu Canvas, navigateur natif, matériel et humain. La présence du même mot « test » dans leur titre ne rend pas leurs portées interchangeables. Les erreurs réellement découvertes pendant la réception doivent être corrigées puis contrôlées sur la nouvelle source avant gel.

## 7. Classeur et intégrité des références

La bible passe à **816 fiches**, avec **47 ajouts** et conservation des **769 identifiants de la 0.8**. Les ajouts sont concentrés dans dix systèmes, six éléments narratifs, dix descriptions de périmètre Prototype et vingt et une QA. Aucun nouveau lot Assets ou Production ne remplace les 133 exigences à recevoir.

Les vingt domaines et la synthèse restent les vingt et un onglets du classeur. Le générateur existant conserve tables, validations, règles de statut, filtres et volets. La réception compare toutes les cellules source au JSON, les comptes et formules calculés, les baselines et les vues réellement modifiées. Une modification temporaire de statut doit affecter la synthèse, puis la restauration retrouver les comptes initiaux.

Le vérificateur résout aussi les références explicites, leurs plages et les symboles de preuves. Les codes OP, PT, TE et PO disposent d’ancres canoniques déclarées dans des lignes existantes; ils ne sont pas des exceptions silencieuses aux références inconnues. Les erreurs de plage, références absentes, doublons et déclarations symboliques manquantes sont contrôlées avec des copies négatives. [BIBLE_REFERENCES.md](BIBLE_REFERENCES.md) précise cette portée.

La fixture `tests/fixtures/bible-v08-ids.json` atteste les 769 IDs depuis le commit authentique de la 0.8. Le fallback sans historique Git accepte seulement les révisions enregistrées. Une révision absente et inconnue reste une erreur. Les fixtures des versions précédentes restent prises en charge et ne sont pas réécrites.

Le recalcul natif LibreOffice est prévu sur une **copie jetable**, avec version et écarts enregistrés. Il ne remplace pas le classeur original et ne constitue pas une utilisation interactive de ses filtres ou de ses volets. QA29 garde cette exigence d’usage natif tant qu’elle n’est pas réellement observée.

## 8. Travail préparé pour les exigences humaines et futures

Le [protocole humain](HUMAN_VALIDATION_V09.md) fournit des consignes neutres, un relevé de matériel, des tâches observables et une séparation entre constat, interprétation et aide fournie. Le [modèle de session](validation/human-session-template-v09.json) reste vierge, marqué non exécuté. Il couvre les essais de perception, d’accessibilité et de compréhension des missions, sans fabriquer de participants ou de résultats.

Le [modèle de suivi de production](validation/production-worklog-template-v09.json) prépare la mesure du travail réel : discipline, entrée, sortie, temps observé, reprises et cause. PR27 et PR56 demandent ces mesures après un niveau de référence fini. Un nombre de fiches, de fichiers ou de tests ne fournit pas un calendrier commercial crédible.

Les dépendances restantes sont concrètes :

- **Niveau de référence :** MI01 doit encore atteindre son niveau cible d’animation, de son, d’interface et de performance avec observations humaines. PR46 et PR52 ne sont pas clos par l’ajout de pièces procédurales.
- **Mécaniques avancées :** composants adverses, doctrine d’escouade, articulations complètes, compatibilité des modules et économie après défection ont leurs propres critères. Le radiateur du joueur ne suffit pas à PR14 ou PR54.
- **Campagne :** CT01–CT04 complètent encore l’acte I. Les trois actes suivants, leurs preuves, pactes et fins nécessitent scènes, parcours et contrôles narratifs correspondants.
- **Monde vivant :** silhouettes, décors et ambiances n’exécutent pas les comportements de faune, flore et activités civiles. PR23 et PR47 exigent des interactions et conséquences jouables.
- **Finition et perception :** mouvements continus, gestes de secours, voix, mix, compréhension spontanée et fatigue visuelle demandent les livrables et observations indiqués pour chaque ID.
- **Matériel et distribution :** performance sur cible déclarée, manette réelle, fenêtre réduite, installations propres et usage interactif du classeur restent des contrôles séparés.
- **Engagement commercial :** nom, droits, licences, âge cible et exigences des boutiques nécessitent une revue compétente et des informations externes vérifiées. Le manifeste technique ne vaut pas cette revue.

Ces travaux ne disparaissent pas du registre quand une partie de leur production est livrée. La tranche suivante peut repartir de leurs critères et dépendances exacts, avec les fichiers reçus et les limites déjà identifiées.
