# Production 0.15.2 — Acteurs et véhicules peints

## Livraison

La 0.15.2 reprend la tranche locale 0.15.1 et ajoute **neuf atlas peints transparents** aux chemins de rendu ordinaires du jeu. Le lot traite les combattants, civils et véhicules génériques encore dessinés uniquement en formes vectorielles. La campagne demeure au stade prototype : **MI01–MI14**, six châssis, trois simulations indépendantes et dossier **v14**.

Les nouvelles planches contiennent **78 cellules**, dont **32 poses de marche**. Le manifeste distingue **60 cellules employées par le rendu** et **18 références de fabrication ou d’état**. Les huit atlas MI14 et leurs 54 cellules restent conservés : le total peint atteint **17 planches et 132 cellules**. Ce total ne dénombre ni de nouveaux personnages, ni de nouvelles missions, ni des animations finales.

## Lot graphique

| Famille | Planches | Cellules | Intégration |
| --- | ---: | ---: | --- |
| Fusilier, précision, lance-roquettes | 3 | 36 | Repos, huit pas par rôle, posture de tir, armes indépendantes |
| Civil générique | 1 | 12 | Repos, huit pas, état arrivé ; une silhouette réutilisée |
| Buggy, patin, drone, tourelle | 4 | 24 | Corps normal/endommagé et arme orientée |
| Convoi | 1 | 6 | Corps normal/endommagé/détruit, panneaux cargo ou médical |
| **Total nouveau** | **9** | **78** | **Sept armes séparées** |

Les [fichiers et usages détaillés](../assets/painted/combat/README.md), les [prompts](../assets/painted/combat/prompts.json) et le [manifeste](../assets/painted/combat/manifest.json) sont conservés avec le code. Les neuf fichiers sélectionnés mesurent réellement 1536 × 1024. L’indexeur mesure les rectangles et l’alpha ; il ne modifie aucun pixel.

La première génération du convoi présentait un fond insuffisamment transparent. Une correction par le générateur a produit l’original retenu, dont l’alpha contient 917 887 pixels totalement transparents. Le fichier rejeté n’est pas utilisé par le jeu. Le prompt initial, la raison de correction et le prompt de correction restent documentés.

## Comportement et correction des tirs

Le dessin des sept armes génériques suit maintenant le même calcul que les tirs. `enemyWeaponPose` fournit pivot, orientation et bouche à la simulation, aux annonces et au renderer. Les coordonnées optiques des armes sont mesurées dans le PNG ; une correction angulaire locale ramène leur canon sur l’axe de visée. Les projectiles sortent de la bouche correspondante dans les deux directions. Les chemins du boss, de la faune et de l’automate MI14 gardent leurs contrats particuliers.

La marche est pilotée par le déplacement observé. Un corps immobile ou bloqué conserve sa pose de repos ; la pause et la réduction des mouvements sont respectées. L’historique graphique reste dans une structure de présentation et n’entre pas dans les dossiers du joueur. Les échecs de chargement conservent les formes vectorielles.

Les dimensions des collisions, les effectifs et les conditions d’arrivée restent inchangés. Les sept groupes de renforts concernés ne sont pas dessinés avant leur événement. Le rendu conserve labels, barres de vie et informations de cargo. Les roues, rotors et turbines déjà peints dans les corps ne sont pas superposés une seconde fois.

Les poses de perte humaines, les épaves ennemies et certaines pièces détachées restent des références : la présentation n’ajoute aucun cadavre ou état persistant absent de la simulation. Le convoi utilise son état de destruction existant. Les domaines particuliers de Nacre, du porteur de fonderie et de l’atelier restent distincts.

## Vérification et livrables

Les **697 tests Node** passent. Ils couvrent la progression et les migrations existantes, les émissions réelles des sept types d’armes dans les deux directions, les arrivées différées, les erreurs de décodage, les poses et la conservation de l’état simulé. Le contrôle de rendu historique SVG/Canvas passe **174 cas sur 174**. Les neuf PNG sont décodés et les 78 rectangles contrôlés ; un banc dans les deux orientations et cinq scènes après commandes publiques sont enregistrés.

Le [rapport QA 0.15.2](QA_PAINTED_COMBAT.md) donne les autres résultats et la portée du contrôle navigateur. Le fichier autonome `dist/Ordre_de_Cendre.html` intègre les images, styles et 37 modules ; il mesure environ 48,11 Mio. La sortie web conserve la même application sans service externe requis pour jouer.

La Bible conserve **1 007 fiches et 21 onglets**, ses identifiants et les 133 critères initiaux. Les onze fiches concernées décrivent les livrables partiels et leurs limites ; le [complément Bible](BIBLE_V15_2.md) contient le contrôle de conservation. Le [suivi de publication](DEPLOYMENT.md) identifie séparément le commit distant, la CI et Vercel.

## Travail restant

Cette tranche fait progresser la présentation du prototype. Les variantes impériales et rebelles complètes, la diversité civile, les rechargements, redditions et transitions d’animation, les rigs peints des six marcheurs, les autres biomes et les réceptions humaines restent ouverts. Les missions MI15–MI32 et les seize contrats demeurent conçus. Aucun de ces lots n’est déclaré terminé par la seule présence d’images.
