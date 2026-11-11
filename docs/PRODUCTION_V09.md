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

La baseline des 133 lignes possède sa propre empreinte : `11a290b1daa7faedbd227c4fcb50ae4a86296aba75cf34b3718e540a2df7affb`. Elle n’est pas régénérée depuis le JSON modifié. Le registre conserve les critères textuels, les dépendances explicites et le statut initial de chaque ligne. Le [contrôle final du registre](validation/production-v09-registry-check.json) vérifie les 133 enregistrements, leurs statuts courants, leurs fichiers et les empreintes des réceptions.

La réception distingue trois questions :

1. **Le fichier ou le comportement existe-t-il ?** Une pièce SVG, un export WAV, une fonction intégrée ou un protocole rédigé peuvent être localisés et inspectés.
2. **La portée annoncée a-t-elle été contrôlée ?** Un manifeste, une collision, un parcours public ou un recalcul doivent avoir leur propre preuve.
3. **Le critère initial est-il satisfait ?** Une exigence de perception humaine, d’art final, de matériel réel ou de campagne complète demeure ouverte tant que cette partie n’a pas été exécutée.

Le statut **Prototype** peut donc attester un lot partiel reçu tout en gardant une finition ouverte. **Vérifié** s’applique à un contrôle exécuté dans sa portée déclarée. La présence d’un protocole d’essai ne rend pas son résultat vérifié. Les contrôles anciens réellement couverts sont reliés à leurs preuves historiques, sans prétendre avoir été exécutés sur une version qu’ils n’ont pas testée.

PR17 exige à la fois MI01–MI08 et CT01–CT04. La livraison de MI08 fait avancer ce chantier mais ne le clôt pas : les quatre contrats restent conçus. PR24 progresse grâce aux commandes; son critère matériel et humain reste également ouvert. Cette règle évite de réduire les exigences pour améliorer un compteur.

La réception finale réconcilie **51 des 133 statuts initiaux** : 35 deviennent Prototype et 16 deviennent Vérifié. Les **82 autres fiches initiales restent À produire**, avec leur dépendance et leur reste détaillés. Les 35 prototypes comprennent 29 lots Assets et six chantiers Production; les 16 vérifications concernent des QA exécutées dans leur portée explicite.

| Domaine initial | Fiches conservées | Prototype reçu | QA vérifiée | À produire conservé |
| --- | ---: | ---: | ---: | ---: |
| Assets | 56 | 29 | 0 | 27 |
| Production | 38 | 6 | 0 | 32 |
| QA | 39 | 0 | 16 | 23 |
| **Total de la baseline** | **133** | **35** | **16** | **82** |

Ce tableau conserve le dénominateur de départ. Les nouvelles fiches de conception et QA de MI08 ne sont pas ajoutées aux 133 pour gonfler la réception. AS56, AS61 et PR32 sont des livrables partiels reçus; QA19 demeure une observation non validée.

## 3. Pièces, rigs et modules visuels

Le lot de production comprend **287 SVG, six rigs JSON et cinq planches PNG**, couvrant 21 composants, douze silhouettes et six rigs de châssis jouables. Le [manifeste](../assets/production/manifest.json) conserve les chemins, tailles et empreintes. Les primitives vectorielles et Canvas partagent leur définition; les positions des pieds et la zone du radiateur restent issues de la simulation.

La réception concerne notamment AS02, AS03, AS04 et AS31 pour les pièces et rigs; AS05 pour les douze silhouettes; AS36 et AS41 pour les états du radiateur; AS17, AS39, AS40, AS44–AS46, AS48–AS50, AS52 et AS60 pour les modules. Le détail par lot figure dans le [README des assets](../assets/production/README.md) et le [reçu contrôlé](validation/production-v09-assets-receipt.json).

Les six silhouettes encore conçues ne deviennent pas jouables. Un rig de huit pièces ne livre pas tous les équipements amovibles. Une planche de six poses ne montre pas tout le débattement d’une jambe pendant le déplacement. La validation finale doit aussi observer profondeur des membres, collisions, lisibilité au zoom minimal et gestes d’intervention en mouvement.

Les modules de Nacre fournissent une première matière cohérente pour la tranche. Ils ne représentent pas tous les arrière-plans, toutes les activités civiles ou une simulation écologique complète. Les animations détaillées de personnel, de secours, d’accueil et de travail manuel demeurent des tâches identifiées, avec leur lien au compte réel de personnes.

## 4. Sons, événements et provenance

Le lot audio contient **56 WAV** : 44 signaux, huit ambiances, trois motifs et un montage de 36 secondes. Les exports sont mono, à 22 050 Hz et 16 bits. Leur volume total est de **8 840 028 octets**. Le [manifeste audio](../assets/production/audio/manifest.json) identifie chaque fichier; le moteur synthétise les mêmes familles sans requête réseau. Les WAV restent des exports téléchargeables et ne sont pas intégrés comme fichiers binaires au HTML autonome.

Le contrôle indépendant du lot a rapproché **354 fichiers uniques** — SVG, rigs, PNG et WAV — de leurs chemins, tailles et SHA-256. La suite finale comprend **18 tests Node purs et un checker raster séparé de cinq cas**. Les cinq comparaisons SVG/Canvas obtiennent de **98,28 % à 99,90 %** de recouvrement. Le [journal initial de réception](validation/production-v09-assets-audio-tests.txt), qui comptait alors 19 tests avant séparation du raster, reste une preuve historique; il n’est pas le compte Node final. Les [tests finaux](validation/v09-node-tests.txt) et le [checker raster](validation/v09-assets-render.txt) ont leurs journaux distincts.

Le contrôle audio inclut un parcours public de MI07 jusqu’aux six arrivées pour vérifier la relation entre événements et signaux. Ses stimuli isolés de transition MI08 ne sont pas présentés comme une partie MI08 complète; la mission possède ses propres parcours et preuves.

Les codes de lot se recouvrent : un même fichier peut contribuer à plusieurs critères. Leur nombre par étiquette ne doit pas être additionné pour fabriquer un total d’assets distincts, ni converti en taux de finition.

Les signaux de coque, de pattes, de radiateur, de pression, de travaux et de transport doivent suivre les faits. Un son de réussite ne produit pas une arrivée ou une preuve dans le dossier. Pause, annulation et fin de travail doivent arrêter les boucles correspondantes. Les voix de Holt, Vann, Mara et du personnel, l’interprétation, les transitions finales et l’écoute du mix en situation restent à produire.

Le rapprochement des seuls nouveaux exports ne suffit pas à QA30. Le [registre de distribution](../assets/production/distribution-manifest.json) rapproche **351 médias sources et web**, ainsi que **cinq inclusions inline correspondant à trois images distinctes**. Le contrôle strict ne trouve aucun média inconnu; aucun WAV n’est intégré au HTML autonome. Les fichiers documentaires et la référence extérieure non distribuée sont identifiés séparément.

Le registre conserve les lacunes documentaires de provenance au lieu d’inventer un identifiant de génération, une date exacte ou une licence. La date de première introduction dans Git n’est pas présentée comme la date de création d’une image. QA30 reçoit ce rapprochement technique; la revue commerciale PR26 reste une tâche différente.

## 5. Commandes et interface

La reconfiguration couvre onze actions de mission, garde une carte complète et refuse les conflits. Échap reste disponible pour la pause. Une capture abandonnée en quittant le panneau ne transforme pas la prochaine touche de navigation en nouvelle commande. Des préférences endommagées reviennent à des valeurs sûres.

La manette utilise la correspondance standard, une zone morte et la visée au stick. Les états synthétiques vérifient le neutre après connexion ou retour de focus, la libération des actions à la déconnexion et une pause déclenchée par nouvelle pression. Les huit tests purs de commandes et les flux DOM contrôlent ces règles; ils ne garantissent pas à eux seuls leur comportement avec le focus natif.

Les tests purs emploient des états de périphérique synthétiques. Les parcours d’interface appellent les gestionnaires réels dans un DOM modélisé. Ces contrôles ne certifient ni une manette physique, ni le confort d’utilisation, ni une navigation des menus à la manette qui n’est pas implémentée. Le critère humain initial de PR24 est conservé dans le registre.

Le journal sanitaire et le registre d’Aval exposent les résultats réellement acquis. Les différences entre destination, véhicule, personnes, départ et arrivée doivent rester visibles. AS56 et AS61 reçoivent ces interfaces au stade Prototype. La session Chrome montre deux lots utilisés dans la sortie; elle ne démontre pas encore le cas « zéro dans cette sortie, deux déjà dépensés auparavant ». Le rapport MI07 conserve distinctement la cargaison, les pièces récupérées, la destination, l’accord à témoigner et l’origine de pose « à recouper ». Une [observation Chrome complémentaire](validation/v09-browser-sanitary-panel.json) développe ensuite le panneau sanitaire : ses sept lignes sont réellement visibles, sans attribuer un accord à témoigner à tous les patients. Présentation finale et compréhension humaine restent ouvertes.

**QA19 reste non validée.** Deux essais Chrome avec D maintenu, changement d’onglet puis barre d’adresse, ont laissé continuer la marche et l’horloge. L’origine application ou entrées gérées n’a pas été isolée. Ce résultat reste visible dans le registre et les limites des commandes; il n’est ni remplacé par un test synthétique réussi, ni attribué sans preuve au seul environnement.

## 6. Validation et état de réception

Les nouvelles QA138–QA158 séparent parcours, courant, ouvrages, contacts, héritages, accords, capacités, arrivées, pertes, sources, choix, migration, intégrité, reçu, commandes, assets, audio, interface, rendu, classeur et essai humain. QA158 demeure réservée à une partie humaine sans guidage.

La [réception automatique finale](validation/production-v09-automatic-receipt.json) est rapprochée des journaux et des empreintes du runtime corrigé. Le snapshot initial est le commit local `01c4aed07788c574eeed421222c2de5fe3d25bdf`, publié sous `c044fbe32a28e2f83f8d8088d46b43034af49d48`. La [réception initiale à 290 tests](validation/production-v09-automatic-receipt-initial.json) reste conservée octet pour octet. Les sources finales corrigent deux défauts de texte observés dans Chrome : découpage des touches devant les lettres accentuées, et invitation du registre après transmission. Leurs tests automatiques passent; leur confirmation dans la publication suivante appartient à une preuve navigateur séparée.

| Contrôle reçu | Résultat | Portée |
| --- | ---: | --- |
| [Suite Node](validation/v09-node-tests.txt) | 291/291, zéro échec ni test ignoré | Simulation, dossiers, commandes et intégrité des lots. |
| [Interface modélisée](validation/v09-ui-runtime.txt) | 57/57 parcours | Gestionnaires du bundle autonome dans un modèle de DOM. |
| [Audit MI08](validation/v09-campaign-audit.json) | 32 variantes | Six châssis × trois conduites, dix avaries et quatre héritages sanitaires. |
| Reprises de cet audit | 8 915 roundtrips, 8 915 restaurations exactes, 795 continuations déterministes | Captures aux transitions et périodiquement, sur les sources dont les empreintes restent identiques. |
| [Backlog historique](validation/v09-backlog-audit.json) | 16 tests pour huit critères | Rapport détaillé initial conservé; les mêmes seize tests sont réexécutés dans la suite finale à 291. |
| [Comparaison raster](validation/v09-assets-render.txt) | 5/5 cas | SVG et Canvas partagés; ne compte pas comme cinq tests Node supplémentaires. |
| [Scènes MI08](previews/mi08-render-manifest.json) | 17 vues relues, en 1 600 × 900 | Canvas Skia, états complets copiés profondément et vérifiés non mutés. |
| [Provenance distribuée](validation/v09-media-audit.txt) | Aucun média inconnu | Fichiers sources, web et inclusions inline rapprochés. |

Le lot de backlog ferme des écarts précis. QA05 ajoute la recharge partielle et la réserve épuisée conservées après changement de menu et reprise. QA08 distingue appui réel, cible hors empreinte et attente proche. QA11 reprend un scan interrompu sans dupliquer sa copie. QA12 termine trois ordres distincts de destruction des relais. QA16 vérifie archives, nouveau contexte et opération neuve. QA24 compare des cadences de simulation à 30, 60 et 120 Hz avec tolérances déclarées, sans mesurer les FPS d’un navigateur.

QA28 a aussi révélé un défaut concret : les transports de MI01 et OP02 ignoraient les tirs du joueur, les explosions et le piétinement. Ils emploient désormais les impacts des deux camps, un effet de zone borné et la pose réelle des pieds. Leur suivi attend derrière un pied en descente; aucune immunité ou réparation artificielle n’est ajoutée. Des parcours publics et des cas géométriques vérifient cette correction.

**QA13 reste ouverte** : le véhicule d’OP02 peut arriver ou être perdu dans deux parcours réels, mais les 47 familles de son récit ne possèdent aucun recensement individuel. Ce nombre n’est jamais converti en 47 personnes. **QA14 reste ouverte** sur sa divergence de scénario : le texte initial demande de battre Cerbère puis choisir; l’opération actuelle choisit d’abord, avec retrait sans destruction en cas d’obéissance. Les deux branches, rapports, sauvegardes et archives ont été contrôlés, sans réécrire ce critère pour lui attribuer Vérifié.

La [réception Chrome](validation/production-v09-browser-receipt.json) rapproche le [rapport de l’opérateur](validation/v09-browser.json) et l’[audit indépendant des exports](validation/v09-browser-export-audit.json). Cinquante-deux identités de fichiers et dix-huit captures natives initiales sont conservées; le complément sanitaire ajoute un texte et une dix-neuvième capture sans réécrire ces preuves. QA21, QA37, QA38, QA45 et QA60 reçoivent Vérifié dans leurs portées déclarées : clavier et dialogues, MI01 avec pause/rechargement/reprise, import/export valide et rejet invalide, poursuite MI02 et lecture des rapports. Les rapports de réussite préparés et le checkpoint de poursuite ne deviennent pas des missions complètes jouées dans Chrome.

MI08 a été poursuivie dans Chrome depuis un **point de porte préparé explicitement** jusqu’au résultat, avec 34 personnes au refuge, deux techniciens à Aval, quatre patients arrivés, deux bateaux arrivés et aucune perte. Le rapport est transmis, les sept anciens rapports sont conservés, la dotation ajoute quatre pièces — 34 à 38 — sans recréer de carburant, et l’export final reste identique octet pour octet après rechargement. Les reprises intermédiaires de MI01, MI02 et de la porte préservent exactement les checkpoints; leur compteur de révision peut changer comme l’indique l’audit. Cette session n’est pas un essai humain sans guidage ni une partie complète MI08 depuis son début.

La fenêtre testée mesure 1 363 × 936 pixels; les zooms de page 125 % et 150 % sont documentés. **QA20 reste ouverte**, car une véritable petite fenêtre native redimensionnée indépendamment n’a pas été établie. QA19 reste ouverte sur l’observation de focus décrite plus haut. La capture de console contient des messages d’extension et aucun message d’origine applicative dans cet intervalle; elle ne prouve pas l’absence d’événements en dehors de la capture. Aucun test de manette physique, d’écoute humaine ou de performance matérielle n’est attribué.

Le contrôle final du classeur constitue une réception distincte, décrite ci-dessous. Le rapport [QA_V09.md](QA_V09.md) conserve les limites globales; elles ne sont pas déduites des résultats automatiques ci-dessus.

Les preuves doivent distinguer commandes publiques, stimuli de collision isolés explicitement déclarés, DOM modélisé, rendu Canvas, navigateur natif, matériel et humain. La présence du même mot « test » dans leur titre ne rend pas leurs portées interchangeables. Les erreurs réellement découvertes pendant la réception doivent être corrigées puis contrôlées sur la nouvelle source avant gel.

## 7. Classeur et intégrité des références

La bible passe à **816 fiches**, avec **47 ajouts** et conservation des **769 identifiants de la 0.8**. Les ajouts sont concentrés dans dix systèmes, six éléments narratifs, dix descriptions de périmètre Prototype et vingt et une QA. Aucun nouveau lot Assets ou Production ne remplace les 133 exigences à recevoir.

Les vingt domaines et la synthèse restent les vingt et un onglets du classeur. Le générateur existant conserve tables, validations, règles de statut, filtres et volets. La réception compare toutes les cellules source au JSON, les comptes et formules calculés, les baselines et les vues réellement modifiées. Une modification temporaire de statut doit affecter la synthèse, puis la restauration retrouver les comptes initiaux.

Le vérificateur résout aussi les références explicites, leurs plages et les symboles de preuves. Les codes OP, PT, TE et PO disposent d’ancres canoniques déclarées dans des lignes existantes; ils ne sont pas des exceptions silencieuses aux références inconnues. Les erreurs de plage, références absentes, doublons et déclarations symboliques manquantes sont contrôlées avec des copies négatives. [BIBLE_REFERENCES.md](BIBLE_REFERENCES.md) précise cette portée.

La fixture `tests/fixtures/bible-v08-ids.json` atteste les 769 IDs depuis le commit authentique de la 0.8. Le fallback sans historique Git accepte seulement les révisions enregistrées. Une révision absente et inconnue reste une erreur. Les fixtures des versions précédentes restent prises en charge et ne sont pas réécrites.

La [réconciliation finale](validation/workbook-v0.9-export.json) contrôle **5 527 cellules source**, 21 onglets, 20 tables nommées, 126 formules calculées sans erreur, 20 validations de statut, 80 règles conditionnelles et 20 feuilles de données avec volets figés. Les comptes finaux du classeur sont **287 Conçu, 310 Prototype, 83 À produire et 136 Vérifié**. Les 83 fiches ouvertes comprennent les 82 de la baseline et le nouvel essai humain QA158.

La [relecture visuelle](validation/workbook-v0.9-visual-review.json) porte sur **37 vues de dix feuilles**, dont la synthèse, les lots reçus, les missions et les limites de validation. Les plages déjà relues sont conservées uniquement après comparaison exacte de leurs valeurs, formules, hauteurs de lignes et colonnes avec le classeur final. QA157 reçoit cette vérification d’export et de lisibilité; QA158 reste ouverte.

Le [recalcul natif indépendant](validation/workbook-v0.9-libreoffice.json) a été exécuté dans **LibreOfficeDev 26.8.0.0.alpha0**, en mode headless sur une **copie jetable**. Les 126 caches de formules ont été retirés avant import, puis recalculés. Les 126 résultats, les 5 527 cellules source et toutes les valeurs comparées concordent, sans erreur ni différence. La copie conserve les nombres de tables, validations, règles conditionnelles et volets contrôlés en XML. LibreOffice normalise cent expressions en retirant les apostrophes facultatives autour des noms de feuille; ces changements et leurs expressions exactes sont consignés. **Le XLSX livré est resté intact.**

Ce contrôle n’est pas un essai d’interface. L’inventaire natif réellement observé ne propose ni Calc, ni Excel, ni LibreOffice graphique. **QA29 reste ouverte** pour tri, filtres, volets et édition interactifs; aucune utilisation d’Excel desktop n’est revendiquée.

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
