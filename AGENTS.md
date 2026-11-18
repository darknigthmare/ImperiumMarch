# ImperiumMarch — règles du projet

Le jeu s’appelle **ORDRE DE CENDRE**. Signature : **Chaque pas laisse une trace.** ImperiumMarch reste le nom du dépôt et le nom de code. Le projet appartient à Darknigthmare.

## Références de travail

- `data/bible.json` est la source des fiches de conception et du classeur. Garder les IDs stables.
- `docs/BIBLE_FR.md`, `docs/CAMPAIGN_FR.md` et `docs/ART_DIRECTION.md` développent le canon du projet.
- `src/content.mjs` décrit uniquement les données actuellement utilisées par le prototype.
- `src/campaign.mjs` gère les dossiers MI01–MI14, leur progression et la migration additive des sauvegardes v1 à v13 vers v14 ; les opérations OP01–OP03 restent indépendantes.
- L’onglet Prototype précise la différence entre le comportement actuel et le comportement final conçu.

## Développement

- La simulation dans `src/simulation.mjs` reste sans DOM, testable et déterministe à graine/entrées identiques.
- Les contacts de pieds et les collisions viennent de la simulation ; le rendu ne doit pas les inventer indépendamment.
- Préserver les contrôles AZERTY/QWERTY, la pause, les états victoire/défaite et l’absence de requêtes réseau dans le jeu autonome.
- Reconstruire `dist/Ordre_de_Cendre.html` et son édition distribuée `dist/Ordre_de_Cendre.zip` après tout changement de code, de style ou d’asset : `npm run build`. Depuis 0.15.7, ces deux sorties restent générées localement ; le ZIP dépasse la limite des fichiers Git et se distribue avec le manifeste et les empreintes dans une GitHub Release. Conserver le manifeste de l’HTML relu dans le commit, puis vérifier l’archive avec `npm run check:offline-package`. Ne pas réduire les images pour contourner une limite de transfert. Voir `docs/OFFLINE_DISTRIBUTION.md`.
- Après modification d’une règle de gameplay : `npm test`. Après changement du contenu ou de livraison : `npm run check`. Après reconstruction autonome : `npm run check:ui`.
- Après modification des transitions UI/campagne : reconstruire puis lancer `npm run check:ui-runtime`. Ce test exécute les gestionnaires dans un modèle de DOM, pas dans un navigateur. La suite optionnelle `npm run test:browser` reste séparée.
- Le classeur se reconstruit avec `tools/build-bible.mjs` selon `docs/BIBLE_README.md`. Employer le skill Spreadsheets lorsqu’il est disponible.

## Vérité de livraison

- Ne pas marquer une fiche finie parce qu’une description existe. Conçu, Prototype et Vérifié décrivent des niveaux différents.
- Les trois opérations de prototype ne sont pas les 32 missions de la campagne finale.
- La tranche courante 0.15 ajoute MI14 aux treize missions précédentes. MI15–MI32 restent conçues. Une relecture ne remplace pas le premier dossier ni ne redonne sa dotation. La réception de chaque tranche doit être lue dans son rapport QA propre.
- Ne pas présenter une image de concept comme une capture du jeu, un rendu Canvas comme une capture navigateur ou un test statique comme un clic exécuté.
- Une nouvelle vérification navigateur doit préciser l’environnement réel et les parcours effectués.
- Les références de gameplay servent la conception ; conserver les noms, assets, silhouettes et récits originaux du projet.

- MI02 est débloquée par le premier rapport de MI01. Le train, les wagons, les harpons et leurs dégâts appartiennent à la simulation ; la preuve de vente ne constitue pas une preuve PALINODE.
- Les migrations de sauvegarde sont vérifiées sur les fixtures historiques `tests/fixtures/campaign-v1-mi01.json` et `tests/fixtures/campaign-v2-mi02.json` ; ne pas les réécrire depuis le code courant.

- La 0.4 propose six châssis : WK01, WK02, WK05, WK06, WK09 et WK10. Les aptitudes finales de tunnel, secours et franchissement spécial restent conçues, même pour un châssis jouable.
- MI03 est débloquée par MI02. Les trois stations, les vérifications, leurs dégâts, les pertes et le contrôle de Holt appartiennent à la simulation. Un constat ne devient pas une preuve PALINODE.
- `civilRelaysOnline` distingue réseau entier, partiel et coupé ; `witnessAvailable` ouvre une possibilité future, sans inventer une rencontre déjà jouée. Des dégâts après décision restent des dégâts jusqu’à l’extraction.
- Le drone de contrôle n’existe dans le monde actif qu’après `scrutinyTriggered` : ni rendu ni dégâts avant cette arrivée.
- Un magasin chargé et huit magasins en réserve au départ ; les rechargements transfèrent des cartouches, les caisses ne se collectent qu’une fois. Les migrations anciennes donnent une réserve initiale documentée sans modifier le magasin ni les autres faits historiques.

- La 0.5 clôt les quatre missions de Vesper. MI04 consomme les conséquences réelles : conduite→liquide/pompe, ouvriers→durée de vanne, dispensaire→appel radio facultatif. Une pompe locale ne répare pas la conduite civile.
- PT01 n’existe qu’après copie du journal. Un original détruit après copie ne détruit pas la copie. Sans copie, un constat de ruines permet de finir sans révéler les données perdues. La remise sous scellés et le rapport signé ne réécrivent pas ces faits.
- Un contact joignable n’est pas un contact interrogé : seul l’appel réellement accompli compte. Ne pas présenter une liaison radio comme une rencontre en personne.
- Le radiateur utilise `radiatorBounds` pour les collisions et le rendu. Deux kits par nouvelle sortie, réparation de 4 s, +60 points, annulation sans dépense si interrompue. Reprise exacte ; atelier payant ; composants ennemis à produire.
- La fixture `campaign-v3-mi03.json` provient du code historique c81a360, comme les v1/v2 elle ne doit pas être régénérée depuis le code courant.
- Un manifeste de captures doit copier profondément chaque état au moment de sa capture : ne jamais y conserver une référence mutable à la simulation.

- La 0.6 ouvre Nacre avec MI05 après le rapport MI04, avec ou sans PT01. La facture locale de trafic et la liaison Vann Ostre ne sont pas des preuves PALINODE. Vann demeure le passeur PN08 ; le trafiquant de Saisie n'est pas identifié comme lui.
- La marée, les bancs, les passerelles, les treuils, les barges, le bateau et le dépôt de MI05 appartiennent à `channel`, présent seulement dans cette mission. L'horloge simulée détermine la marée, y compris au moment d'une décision ; une pause ne la fait pas avancer.
- Une arrivée du bateau implique douze passagers débarqués et interdit des dégâts ultérieurs sur le bateau. Une perte avant arrivée compte douze décès et zéro passage. Le rapport conserve les faits, quel que soit le choix administratif.
- Le carburant de MI05 est facultatif, destructible, distinct des occupants et des preuves, et ne se récupère qu'une fois. Deux lots sont attribués seulement après prélèvement effectif ; MI06 peut ensuite les consommer au raccordement effectif de son auxiliaire.
- La fixture `campaign-v4-mi04.json` provient du code historique d7d76b6. Comme les v1/v2/v3, ne pas la régénérer depuis le code courant. La migration v4 ajoute seulement Nacre non visité et zéro carburant ; elle ne change pas les checkpoints historiques.
- Le HUD HTML fournit l'instrument de marée dans le navigateur et demande `tideInstrument:false` au renderer. Les rendus Canvas seuls gardent leur instrument intégré par défaut. Le prompt d'interaction suit la hauteur des instruments HTML ; `interactionPrompt:false` évite son doublon Canvas dans le navigateur.

- La 0.7 ajoute MI06 après MI05. Ses dix habitants locaux ne sont pas les douze passagers du chenal ; leur arrivée à l’abri et l’état des deux logements sont des faits séparés. Mara intervient par radio.
- Le soutien du panneau exige une coque ancrée et immobile, tous les pieds en contact dans la zone. Les techniciens doivent réellement arriver ; un étai manuel permet de poursuivre sans eux ou après destruction du panneau. Un étai ne reconstruit pas un panneau détruit.
- Le choix de circuit exige ensuite une manœuvre de vanne. La hausse d’eau impériale rend les logements inhabitables et tue seulement les occupants restés dedans. La dérivation ne répare pas des maisons déjà détruites. Aucune preuve PALINODE n’est créée par MI06.
- En v6, `resources.fuel` est le stock disponible, `world.nacre.fuelSpent` la dépense cumulée et `campaign.fuelSpent` le coût de la sortie. Le stock plus la dépense cumulée égale les lots acquis en MI05. Le raccordement consomme exactement deux lots après quatre secondes, jamais avant ; destruction, défaite et redémarrage ne les restituent pas.
- MI06 peut conserver un checkpoint terminal `lost`, qui ne se restaure jamais en partie vivante. Une relecture reste indépendante. Un point avant décision antérieur à l’horloge officielle de MI06 n’est pas offert comme reprise jouable, même si son coût est identique ; il ne peut jamais restituer les lots consommés.
- La fixture `campaign-v5-mi05.json` provient de l’arbre public immuable `613c07307f2712c5fac28d9403016906e94da168` de la 0.6. Ne pas la régénérer depuis le code courant. La migration ajoute uniquement la digue non visitée et le compteur de dépense nul, sans modifier MI01–MI05.

- La 0.8 ajoute MI07 après le bilan MI06. Ses quatre patients, sa conductrice et son soignant sont distincts des personnes des deux missions précédentes. Le consentement à l’examen, l’inspection, la récupération de balise, l’accord à témoigner et un appel à Mara sont des actes séparés.
- La rampe principale exige un panneau verrouillé, sans étai et avec fatigue strictement inférieure à 65 %. La route secondaire reste praticable dans les autres cas. Aucun stock n’est créé ; un technicien survivant ne fournit d’aide qu’après un échange réel.
- Le choix de destination exige ensuite un trajet. Patients arrivés, personnel vivant, personnel arrivé, véhicule récupéré ou saisi restent distincts. Les dégâts après décision restent inscrits jusqu’au bilan.
- La pièce, les attaches et le journal de balise exigent un démontage accompli. Une destruction permet un constat sans reconstitution. `provenanceVerified` reste faux dans MI07 ; aucune nouvelle preuve PT ou PO n’est attribuée.
- La fixture `campaign-v6-mi06.json` provient du code public immuable `bc830013455bb8f71e1eaf0316173ac0e91746f8` de la 0.7. La migration v7 ajoute seulement `world.nacre.ambulance` non visité et conserve les scènes MI01–MI06 et le registre de carburant. Ne pas régénérer cette fixture depuis les modules courants.

## Départ de Nacre et production 0.9

- MI08 distingue amenée, passage, pression, fenêtres de courant, accords, places assises, brancards, accompagnants, embarquement, départ de zone et arrivée individuelle. Un choix ne remplace pas une opération physique.
- La migration v7 ajoute seulement le dossier `world.nacre.departure` vide. Ne jamais régénérer la fixture v7 depuis le code courant : ses octets sont attestés dans `validation/v09-historic-v7.json`.
- Les anciens agrégats deviennent un nouveau recensement MI08 avec provenance explicite. Ne pas inventer une identité historique, ressusciter un mort, déplacer une ambulance saisie ni convertir le contact radio de Mara en présence passée.
- Le nouveau reçu MI08 conserve sa liste de personnes et de bateaux. Départ historique, arrivée au refuge, accueil local et perte restent distincts. Le choix `delay` appartient à MI08 ; les trois choix propres à MI12 sont `obey`, `defy` et `refuse`.
- `production-assets.mjs` partage la géométrie SVG/Canvas ; garder pivots et positions des vrais pieds. Les WAV sont des exports : le runtime synthétise les mêmes PCM sans requête réseau.
- Le registre v09 conserve les 133 critères À produire de la baseline. Réception d’un livrable, validation du prototype et critère humain satisfait sont trois faits différents. Ne pas transformer un test synthétique de manette en essai matériel.

## Thyr et commandes 0.10

- MI09 s’ouvre après le rapport MI08. Ses quatre longues-dorses (deux adultes et deux jeunes), deux colonnes, racines et habitats appartiennent à cette vallée. Ne pas y transférer les habitants de Nacre ou inventer un recensement local. Le contexte MI08 reste radiophonique.
- Les vrais pieds emploient `livingRouteSurfaceAt`. Le passage haut exige un contournement reconnu ; le guidage local exige un échange accompli, puis un balisage. La cadence manuelle J/L et l’ancrage existants sont conservés, sans commande de hauteur fictive.
- Le choix ouvre un ordre, sans déplacer le troupeau ni manœuvrer la barrière. Verger atteint, exclusion atteinte et perte sont des états individuels distincts. Le transport doit être libéré, escorté puis arrivé avant la transmission du rapport.
- Les tireurs de MI09 n’apparaissent qu’après résolution de la migration et arrivée du contrôle. Les tirs, explosions et pas peuvent endommager les êtres et les supports. Une perte acquise ne s’efface ni à la décision ni à l’extraction.
- MI09 ne crée ni PT02, ni TE01, ni preuve globale PALINODE. La défection reste prévue à MI16. FL08 est décoratif dans cette tranche et FL09 réagit visuellement à proximité ; leurs systèmes finaux restent conçus.
- La fixture v8 vient des deux exports natifs Chrome conservés de la 0.9 et du snapshot public attesté. La migration v9 ajoute seulement `world.thyr.route` vide et la version9 ; elle conserve aussi l’ancien champ `stage`, les huit rapports, le carburant et les scènes anciennes. La progression déduit MI09 du premier rapport manquant sans réécrire l’étape historique. Ne pas régénérer les fixtures v1–v8 depuis le code courant.
- Le rendu Thyr partage la source SVG/Canvas de `src/thyr-assets.mjs` et suit les objets de `livingRoute`. Ses planches restent des bancs graphiques, pas des captures de jeu.
- Quitter le canvas relâche les commandes. Quitter les surfaces de jeu ou la fenêtre suspend ; une répétition de touche ne réarme pas une commande vidée. Les boutons gardent leur activation native. Ne pas confondre ce contrôle DOM modélisé avec QA19 dans Chrome.


## Champ chimique de Thyr — 0.11

- MI10 suit le premier rapport MI09. `src/chemical-simulation.mjs` porte les opérations physiques de `chemical` ; le moteur fournit les commandes, les contacts, les projectiles et la même horloge simulée. Les six châssis gardent leurs vrais appuis.
- Trois cuves distinctes demandent trois relevés. Un constat de ruines ne copie aucun marquage. Le registre matériel et le prélèvement sont des opérations séparées. PT02 exige un prélèvement achevé, les trois marquages et une copie du registre. Aucune TE01, aucune chaîne politique globale ni défection anticipée n’est attribuée.
- Le prélèvement prend vingt secondes à portée de protection. La perte de sa source ou de l’appareil avant collecte reste un échec. Après collecte, la destruction des originaux ou de l’appareil ne supprime pas les pièces déjà conservées à bord.
- La réponse au poste fixe `demolish` ou `secure`, sans détruire ni isoler les cuves. Chaque cuve encore intacte exige sa propre opération. Les pertes et les volumes ne sont pas réécrits par le choix, l’extraction ou une relecture.
- Les trois forces privées ne peuvent agir, être visées ni être dessinées avant `chemical.alert.ready`, cinq secondes après l’événement de déclenchement. Le prélèvement, une démolition ou la perte matérielle de sa source produisent des événements distincts, pas une apparition gratuite au début de mission.
- Les volumes quittent les cuves dans des nappes qui parcourent réellement le terrain. Le collecteur les dirige vers un bassin distinct ; les masses retenues y restent après réouverture ou destruction de la vanne. La destruction du bassin n’est pas simulée. Pollution cumulée, volumes retenus, volumes en transit et volumes livrés restent séparés et réconciliés.
- Le pontage de chaque canal exige quatre secondes sous ancrage et porte les vrais pieds via `chemicalSurfaceAt`. Franchir un canal découvert peut le dégrader ; un pontage ne retire aucune contamination déjà acquise. Rétablir la circulation de l’eau ne la rend pas potable si les canaux sont compromis. Les deux habitats de MI10 n’inventent aucun effectif de population ni transfert depuis MI09.
- Le rapport exige inspections ou constats, prélèvement ou perte actée, opérations de cuves résolues, trois forces arrivées puis neutralisées, fin de l’écoulement et disposition réelle de l’eau. Il précède une extraction physique.
- La fixture `campaign-v9-mi09.json` vient des exports Chrome figés de la 0.10 publique, avec attestation `docs/validation/v011-historic-v9.json`. Ne régénérer aucune fixture v1–v9 depuis le code courant. La migration v10 ajoute seulement `world.thyr.chemical` vide et la version ; elle conserve stage, checkpoints, neuf rapports et ressources.
- `src/chemical-assets.mjs` partage ses formes entre SVG et Canvas. Les planches d’assets, scènes Canvas, tests de DOM modélisé et observations natives restent quatre types de preuve distincts. Les preuves 0.9 et 0.10 sont historiques et ne doivent pas être réécrites pour les faire décrire la 0.11.


## Voix de Thyr — 0.12

- MI11 suit le premier rapport MI10. Son domaine `voice` n’existe que dans cette mission ; il ne transfère aucun habitant ou animal de Nacre, MI09 ou MI10. Les trois nids sont des sites locaux, sans effectif de population déduit de leur dessin.
- Trois relevés vibratoires demandent ancrage, pieds immobiles, silence et quatre secondes. Un constat de poste perdu n’est pas un signal enregistré. La corniche reconnue fournit le vrai sol des pieds via `voiceSurfaceAt` ; son dessin suit la même surface.
- Rencontre, accord privé, échange protégé de vingt secondes et disponibilité ultérieure de Leth sont des faits séparés. Leth reste sur le site. Un refus ou retrait ne fabrique pas de paroles ; aucune autorisation publique ni recrutement n’est accordé.
- Le signal source, le texte impérial et le témoignage sont recueillis séparément. `VOICE_TRANSLATION_PAIRS` contient trois restitutions françaises : révéler chaque colonne uniquement après acquisition de sa source. Ne pas les présenter comme une transcription linguistique khelte.
- TE01 exige trois signaux exploitables, les deux copies et un témoignage consenti achevé. Les copies et le témoignage acquis survivent à la perte des originaux ou du témoin ; sa disponibilité future et sa coopération restent réévaluées. TE01 ne démontre ni les ordres industriels de MI12, ni la chaîne globale PALINODE, ni une défection avant MI16.
- Le choix `obey`/`defy` fixe saisie/remise en service sans opérer l’émetteur. Cinq secondes de travail réel sont nécessaires sur le matériel intact. Le signal vibratoire existe au début ; `emitterOnline` décrit le canal d’avis rétabli après intervention.
- Les trois forces privées sont absentes des comportements, cibles, collisions et du rendu avant `voice.alert.ready`. Elles arrivent six secondes après l’événement matériel d’alerte. Les pertes et leurs dates sont persistantes.
- La migration v10→v11 ajoute seulement `world.thyr.voice` vide et la version. La fixture v10 provient des exports préparés par commandes publiques de la 0.11 figée, attestés dans `docs/validation/v012-historic-v10.json` ; ce n’est pas une fixture native. Préserver les dix rapports, ressources, checkpoints et toutes les fixtures v1–v10.
- Le premier rapport attribue quatre lots une seule fois ; une relecture ne le remplace pas. Une défaite est terminale. `voice-validation.mjs` réconcilie les corps, travaux, dates, copies, permissions, pertes et reçus, y compris les changements entre checkpoints.
- `voice-assets.mjs` partage les formes SVG/Canvas. AS13 reçoit seulement un interprète local et ses outils au stade Prototype ; les Khelt complets, leurs voix et animations finales restent à produire.
- La 0.12 conserve les preuves natives historiques sans les renommer. Le blocage Vercel et la restriction URL `file://` de la 0.11 ne sont pas des essais 0.12 réussis. Ne pas tenter un autre chemin local pour contourner cette restriction.


## Reconstruction historique 0.14.1

- La base publique de reconstruction est `0f77235f7545f33b1a4f298b81a44ee2122d46dc` (0.12). Les anciens octets 0.13/0.14 sont perdus ; les nouveaux rapports ne reprennent pas leurs résultats comme des tests exécutés.
- La 0.14.1 proposait MI01–MI13 au stade prototype et un dossier v13. Les migrations v11→v12 et v12→v13 ajoutent seulement les dossiers `world.thyr.relay` et `world.kharon.foundry`, puis la version, sans réécrire les rapports ni les fixtures historiques.
- MI12 : trois choix (`obey`, `defy`, `refuse`), trois opérations physiques, copie de 24 s dans une fenêtre de 45 s. Les composants du Prétoire affectent réellement son comportement et sont absents avant l’arrivée.
- MI13 : quatre roues physiques, deux caisses, deux circuits thermiques ; marquages, bordereau et analyse sont des acquisitions séparées. PT03 peut exister sans PT01. Les transferts ne sont pas exécutés par le choix de destination.
- Les nouvelles données, sources, preuves et livraisons sont conservées sur GitHub à chaque tranche vérifiée. La publication demandée par l’utilisateur est explicite dans le tour de reconstruction. Si une publication échoue, signaler l’échec exact et ne pas prétendre les fichiers sauvegardés.

## Les mains noires — 0.15

- MI14 s’ouvre après le premier rapport MI13. Son domaine `workshop` porte huit ouvriers locaux, dont deux mécaniciens et trois déplacés de Nacre arrivés avant le recensement connu. Aucun personnage MI05–MI08 n’est transféré ou ressuscité.
- La demande de passage prend 3 s sous ancrage, puis les personnes gagnent physiquement la galerie. Leur arrivée n’annule pas leur vulnérabilité aux tirs et explosions. Les vrais pieds restent responsables des dégâts de contact.
- L’approche déclenche cinq secondes d’alerte. L’automate ne doit agir, être visé, intercepter de tir ou être dessiné comme unité active qu’après son activation réelle.
- Inspection du froid (3 s), isolation (4 s), réparation (8 s), explication (4 s) et copie du lot (4 s) sont des actes distincts. Une perte d’organe permet un constat dégradé, sans reconstruction ni source inventée. Une copie acquise reste conservée après perte de son original.
- Le choix redémarrage/arrêt exige cinq secondes d’opération sur la commande. La coopération exige ensuite une demande réelle de trois secondes, un arrêt maintenu, le froid réparé et des mécaniciens survivants. Elle n’accorde ni présence à bord ni recrutement.
- MI14 peut recouper son constat avec PT03 acquis. Elle n’attribue aucun nouveau PT, TE ou PO, aucune diffusion publique et aucune défection anticipée. MI15 et MI16 gardent leurs révélations propres.
- La migration v13→v14 ajoute uniquement `world.kharon.workshop` vide et la version. Les fixtures v13 sont des exports préparés de la reconstruction locale immuable `fc9f4af4e103adf93d4310053610ca69bea443b3`, attestés dans `docs/validation/v015-historic-v13.json`. Ce commit n’est pas public ; la reprise de publication transporte son arbre sous une autre révision. Ne pas régénérer les fixtures depuis les modules courants.
- Le premier rapport attribue quatre lots une fois. Les treize rapports précédents, ressources, checkpoints et états terminaux restent conservés. Le validateur rapproche personnes, opérations, corps, acquisitions et dates du reçu.
- `data/bible.json` conserve les 977 IDs précédents et ajoute 30 fiches. Les 133 critères initiaux restent le dénominateur du registre. QA230 désigne la réception navigateur et QA231 l’essai humain ; aucun résultat automatique ne suffit à fermer ces critères.

## Sprites peints de l’atelier — 0.15.1

- Les huit atlas originaux de `assets/painted/mi14/` contiennent 54 cellules de poses et d’états. Le manifeste, les prompts et les rectangles mesurés de `src/painted-sprite-layout.mjs` documentent leur provenance. Les fichiers PNG générés restent inchangés ; le moteur sélectionne les frames par `drawImage`.
- `src/painted-sprites.mjs` ne change aucune donnée de simulation. Le chargement conserve le rendu vectoriel en cas d’absence ou d’échec. La marche, les positions, les pertes et l’arrivée de l’automate restent sous l’autorité de leurs domaines existants.
- Le canon est une pièce séparée autour de `[0,-55]`, avec la bouche à 56 unités le long de la visée. Ne pas remplacer ce rig par une image monobloc. Les états dormant/alerte de la planche ne permettent pas de dessiner l’ennemi avant son activation.
- `tools/test-painted-sprites.mjs` décode les PNG et rend les scènes Canvas avec ces images chargées. Cette réception reste distincte des comparaisons SVG/Canvas vectorielles, d’un navigateur et d’un essai humain. Garder les preuves historiques intactes.
- Les références d’images du moteur restent des URL littérales pour leur intégration dans le HTML autonome. Après modification des atlas ou du layout, reconstruire l’autonome et vérifier l’absence de ressources externes.

## Acteurs et véhicules peints — 0.15.2

- Les neuf atlas originaux de `assets/painted/combat/` contiennent 78 cellules, dont 32 poses de marche. Le manifeste distingue 60 cellules utilisées et 18 références. Avec MI14, le total est de 17 atlas et 132 cellules ; ces nombres ne représentent ni des personnes supplémentaires ni des animations finales.
- Les PNG sélectionnés restent inchangés. `tools/index-painted-combat.py` mesure leur alpha et produit uniquement le manifeste et les rectangles/ancres de `src/painted-combat-layout.mjs`. Les dimensions réelles sont 1536 × 1024, y compris les planches humaines à trois lignes de hauteurs arrondies.
- `src/enemy-weapon-pose.mjs` partage les pivots et bouches des sept armes génériques entre projectiles, télégraphes et rendu. Les corrections optiques de l’image résident dans le layout. Préserver les chemins physiques distincts du boss, de la faune et de l’automate MI14.
- Les collisions conservent leurs tailles. Les atlas ne changent ni les domaines ni les conditions d’arrivée : une unité absente avant l’alerte reste absente du rendu, des tirs, des cibles et des contacts. Les 697 tests 0.15.2 comprennent les sept groupes d’arrivée concernés et les tirs dans les deux directions.
- La marche de `src/painted-combat.mjs` dépend du déplacement réel, avec un historique de présentation séparé de la sauvegarde. Ne pas ajouter de champs graphiques aux dossiers v14. Conserver la réduction des mouvements et le repli vectoriel après échec de décodage.
- Les roues, rotors et réacteurs figurent déjà sur les corps : leurs cellules isolées sont des références, pas des superpositions à faire tourner sur un second exemplaire. Les poses de perte humaines et épaves ennemies ne créent aucun corps persistant absent de la simulation. Le convoi conserve son état de destruction existant.
- Le lot couvre des rôles génériques. Ne pas déclarer AS11/AS12, les factions complètes, les marcheurs peints ou les autres biomes terminés à partir de ces silhouettes. Les critères initiaux et tous les identifiants de Bible restent conservés.
- `npm run check:combat` décode les neuf PNG et reçoit 78 cellules, le banc de lecture et cinq scènes Canvas. Un contrôle Canvas, le DOM modélisé, Chromium et un essai humain sont des réceptions différentes. Écrire les nouvelles preuves dans des dossiers de version distincts et conserver les preuves historiques.

## Marcheurs peints articulés — 0.15.3

- Les six PNG originaux de `assets/painted/walkers/` mesurent 1254 × 1254 pixels, chacun en quatre lignes et quatre colonnes. Les 96 cellules sont des pièces/états des six châssis existants. Le total peint atteint 23 atlas et 228 cellules ; il ne désigne pas un effectif ni des cycles de marche supplémentaires.
- `anchors.json` conserve les mesures source ; `tools/index-painted-walkers.py` produit manifeste et `src/painted-walker-layout.mjs` sans modifier les PNG. Arrondir chaque frontière de cellule séparément, demi-pixels vers le haut.
- `src/painted-walkers.mjs` reste indépendant de la simulation ; le wrapper du renderer garde le repli vectoriel par pièce. Un ID jouable explicite est requis, afin de ne pas donner au boss Cerbère la peau du Vigie. Les exports SVG historiques restent issus de `production-assets.mjs`.
- Hanches, genoux, chevilles, contacts et profondeur suivent le rig existant. La cheville est à huit unités du contact ; la projection sur une semelle asymétrique n’est pas le centroïde de son alpha. Garder les vérins articulés et éviter le doublon des anciennes sous-couches épaisses sous les jambes peintes.
- Le canon pivote toujours à `[p.x+9,p.y+8]`, indépendamment du miroir de coque. Les bouches physiques sont à 92/112/101 unités selon 2/4/6 appuis. Les corrections optiques ne changent ni le tir ni sa dispersion.
- Le radiateur peint garde `radiatorBounds` ; ses trois états statiques sont peints, les impacts et réparations progressives restent vectoriels. Les mêmes cellules lointaines sont assombries au rendu, sans inventer un second lot d’images.
- `npm run check:walkers` décode les vrais PNG et reçoit 96 cellules, 54 poses et 19 vues Canvas. La réception navigateur et l’essai humain gardent leur portée séparée. Ne pas réécrire les preuves antérieures. Les 1007 IDs, 133 critères initiaux, 21 onglets et statuts de Bible sont conservés.

## Cerbère et vie de Thyr — 0.15.4

- Neuf PNG originaux ajoutent 78 cellules, dont 69 adressables au rendu et neuf références. Le total peint atteint 32 atlas et 306 cellules. Les PNG restent inchangés; les indexeurs produisent seulement les métadonnées.
- Les rangées de `assets/painted/thyr/habitat.png` sont inégales (0, 500, 724). Utiliser les rectangles `cell` et les points de suspension mesurés, jamais une grille régulière supposée. Les masques alpha locaux restent immuables pendant l'indexation; sérialiser leurs coordonnées absolues séparément.
- Thyr et Leth habillent les objets déjà présents. Les wrappers des renderers conservent les exports vectoriels historiques. Les poses suivent déplacements, états, consentements et pertes réels; les historiques d'animation restent hors sauvegarde. Le Guetteur-racine mort, l'herbe aplatie et les deux outils séparés de Leth sont des références.
- Les racines gardent le contour de `livingRouteSurfaceAt`, les cordes rejoignent le support existant et la vigne décorative reste attachée au tronc. Aucun nouvel appui, habitant ou système écologique n'est ajouté.
- Cerbère utilise son propre atlas et `cerbere-weapon-pose.mjs`, commun au tir, au télégraphe et au canon. La bouche historique à `w/2` et les règles de projectile sont conservées. Les jambes du boss restent un rig de présentation, sans contacts individuels simulés; leur cheville peinte rejoint la chaussure proportionnée, sans changer les contacts des six marcheurs joueurs.
- Les dégâts/réparations locales du boss restent références tant que leur simulation n'existe pas. Un atlas ne permet pas d'inventer une santé de composant ou un corps persistant.
- Après modification de ces lots : `npm run check:thyr` et `npm run check:cerbere`, puis reconstruction autonome et contrôles UI requis. Une réception Canvas ou du DOM modélisé ne clôture pas les critères navigateur/humains. Conserver les preuves historiques et les 1007 IDs/statuts de Bible.


## Transports, Nacre et troisième relais — 0.15.5

- Treize PNG originaux ajoutent 80 cellules : transport 4 atlas / 20 cellules, Nacre 6 / 30, relais 3 / 30. Le nouveau lot comprend 77 cellules de rendu et trois références. Le total historique est 45 atlas / 386 cellules. Conserver les originaux ; les indexeurs ne produisent que métadonnées et manifestes.
- Les cellules de locomotive et de porteur ne contiennent pas leurs roues. Dessiner les roues séparées une seule fois, aux positions de présentation ferroviaire ou aux contacts simulés du porteur. Les attelages de MI02 rejoignent les ancres mesurées ; le repli vectoriel conserve sa géométrie. Les captifs visibles et les barreaux ne sont pas prépeints et suivent les faits de MI02.
- La cabine basse du porteur reste sous le plateau qui porte les deux caisses. Les caisses suivent leurs propres positions, pertes, copies et transferts. Ne jamais déplacer un collider ou un chargement pour masquer un défaut d’image.
- Les coques de Nacre ne contiennent pas de personnes peintes. Les groupes, consentements, embarquements, arrivées et pertes restent simulés. La balise récupérée est une référence et disparaît de l’ambulance ; elle ne devient pas un objet visible à bord du marcheur. La caisse médicale possède son état propre.
- Le canon du Prétoire rejoint la bouche physique à [p.x + facing × 115, p.y − 10]. Le capteur et le verrou suivent leur santé simulée. Canon endommagé et cassette isolée restent références ; ne pas leur inventer de santé ou de présence. Le Prétoire absent avant l’alerte reste absent du rendu.
- `painted-transport.mjs`, `painted-nacre.mjs` et `painted-relay.mjs` restent hors simulation et hors sauvegarde. Les wrappers conservent le repli vectoriel, les exports historiques et la réduction des mouvements. Aucun champ graphique n’est ajouté au dossier v14.
- Après changement, exécuter `check:transport`, `check:nacre`, `check:relay` et les contrôles requis de construction et d’interface. Les scènes Nacre sont des diagnostics caméra ; les scènes MI02/MI12/MI13 déclarées publiques doivent rester produites par commandes publiques. Conserver cette distinction dans les reçus et les futurs comptes rendus.
- Le ZIP hors ligne possède une seule entrée, `Ordre_de_Cendre.html`, dont les octets doivent correspondre au build local. Vérifier CRC et SHA-256 après extraction. Les PNG ne doivent pas être recompressés ou réduits pour satisfaire une limite de transfert.
- La réception native 0.15.5 est dans `docs/validation/native-v0155/` : trois scènes issues de checkpoints historiques importés par l’UI, pause/reprise et déplacement de MI12, aucun transfert industriel ou mission achevée revendiqué. Avant de nouveaux imports de test, exporter le dossier existant et relever les préférences visibles ; restaurer ensuite le dossier et la sélection initiale, puis comparer le réexport. Ne pas publier les sauvegardes privées de cette vérification.

## Infrastructures de Nacre et appareils de Thyr — 0.15.6

- Treize PNG originaux ajoutent 75 cellules utilisées au rendu, sans nouvelle référence : Nacre 5 atlas /30 cellules, champ chimique 5/24, appareils et sites MI11 3/21. Le total historique est 58 atlas /461 cellules dans onze lots. Conserver les originaux et les corrections sélectionnées ; les indexeurs ne retouchent aucun pixel.
- Les portes de Nacre suivent `departureGateBounds`; les volants et rotors sont séparés des carcasses. Câbles, pression, eau, habitants et vrais supports restent simulés. Une maison peinte ou un refuge ne crée ni nouvelle population ni arrivée.
- Les cuves, prélèvements, registres, vannes, canaux et habitats de MI10 consomment les états chimiques existants. Les surfaces de pontage gardent `chemicalSurfaceAt`, les nappes et quantités restent inchangées. Un canal couvert et contaminé doit conserver les deux informations.
- MI11 garde trois sites de ponte sans effectif déduit des images. Le petit repère de corniche ne remplace pas le sol physique de `voiceSurfaceAt`. L’émetteur saisi ne dessine que son socle ; les états courts ne sont pas étirés à la hauteur de l’instrument intact. Copies, consentements, opérations et pertes restent ceux de la simulation.
- Les trois nouveaux modules sont chargés dans `main.mjs` et exposés dans son observation de test. Le repli vectoriel reste utilisable après défaut de décodage ; aucune donnée graphique n’entre dans le dossier v14.
- Contrôler les nouveaux lots avec `check:nacre-sites`, `check:chemical` et `check:voice`, puis reconstruire les éditions autonome et web et exécuter les contrôles requis. Ne pas régénérer les preuves historiques. Le diagnostic d’états, la scène obtenue par commandes publiques, le DOM modélisé, le navigateur et l’essai humain restent des preuves distinctes.

## Vesper, route vivante et installations de Kharon — 0.15.7

- Treize PNG originaux ajoutent 81 cellules : Vesper 6 atlas / 38 cellules de rendu, route MI09 3 / 20 dont deux références, installations MI13 4 / 23 cellules de rendu. Le total vérifié est 71 atlas / 542 cellules dans quatorze lots, dont 504 utilisées et 38 références. Le nouveau décompte corrige six références MI14 auparavant comptées comme utilisées ; il n’ajoute ni ne retire de PNG historique. Voir `docs/validation/painted-counts-v0157.json`.
- Les anciennes mentions d’une tranche 0.15.7 non publiée ne constituent pas des fichiers récupérés. Cette tranche est reconstruite depuis le `main` public 0.15.6 vérifié. Conserver les prompts réellement employés et les octets des sorties Imagegen sélectionnées.
- Les cinq états des stations MI03 consomment leur santé et leur coupure réelles. Les bornes de protection sont distinctes des bâtiments : protéger une borne ne répare pas la station. Les ruines restent plus basses que les structures intactes.
- Le treuil de MI01, les harpons de MI02 et les turbines MI04 utilisent leurs pièces tournantes séparées. Garder les pivots mesurés, les câbles réels, la réduction des mouvements et le repli vectoriel. Les dalles et conduites suivent le terrain ; une conduite rompue conserve son interruption. Les 24 caisses ne sont dessinées au Poste 42 qu’après livraison.
- Les cellules Vesper n’ont pas toutes une grille régulière : logement 1783 × 882, outposts à colonnes inégales et civilworks à lignes 0/370/730/1024. Employer les rectangles mesurés ; les indexeurs ne réencodent aucun PNG.
- MI09 conserve l’axe de barrière historique et son ouverture simulée. Le travail en cours n’ouvre pas prématurément le bras. Le camion contient déjà ses roues ; sa roue isolée et la ruine du terminal sans santé restent des références. La carte inspectée tire ses deux symboles d’habitat des objets `homes`, sans population déduite de l’image.
- MI13 conserve les ponts et leurs surfaces physiques, les températures, la vapeur, les charges séparées et leurs transferts. Les crochets et volants peints ne déplacent aucun chargement. Les copies survivent à la perte de leur original selon les faits existants.
- Contrôler les lots avec `check:vesper`, `check:route` et `check:foundry-sites`. Les preuves nouvelles vont dans des dossiers `v0157` distincts. La sauvegarde reste v14, les missions jouables restent MI01–MI14, et les 1 007 IDs, 21 onglets, 133 critères initiaux et statuts de Bible restent stables.

## Personnes, décors et horizons — 0.15.8

- Le lot 0.15.8 a été retrouvé avec ses fichiers lors de la reprise du 17 novembre. Conserver sa provenance de première production, ses neuf PNG sélectionnés et ses reçus ; ne pas présenter la reprise comme une nouvelle génération. Six atlas ajoutent 44 cellules au rendu : Nacre 3/28, Vesper 3/16. Les trois panoramas de Nacre, Thyr et Kharon sont comptés séparément. Total : 77 atlas / 586 cellules en seize lots, dont 548 utilisées et 38 références.
- Les techniciens, la conductrice, le soignant et les patients suivent leurs corps existants. En MI08, une apparence précise de personnel exige son `originalId` ; un agrégat sans identité garde son rendu générique. Les personnes embarquées, arrivées ou perdues conservent leurs conditions de visibilité existantes. Les images ne créent aucun individu ni transfert historique.
- La marche peinte suit la distance réellement parcourue, hors sauvegarde ; pause et réduction des mouvements conservent leurs effets. Mesurer séparément les frontières et les ancres, puis poser semelles ou roues sur `person.y + person.h / 2`, sans déplacer le collider. Les outils d’indexation produisent des métadonnées et ne modifient aucun PNG.
- Textures, petits décors et viaduc de Vesper suivent le terrain et la structure ferroviaire existants. Le fondu de 96 unités entre tuiles de sol reste attaché aux coordonnées du monde ; il ne modifie aucun PNG ni contact. Les rails, la rupture, les supports et les harpons restent ceux de la simulation. Les nouveaux décors n’ajoutent ni surface physique ni population.
- Les panoramas conservent leur rapport 3:1, une plage finie de déplacement et un fond couvrant le champ de caméra. La réduction des mouvements fixe le cadrage. Conserver le panorama historique de Vesper, son repli après image invalide et les replis indépendants de chaque nouveau lot.
- Après changement, recevoir `check:worlds`, `check:nacre-people`, `check:vesper-scenery` et les contrôles de construction/interface requis. La nouvelle réception de reprise va dans `docs/validation/v0158-rereview/`, sans écraser les premières preuves `painted-*-v0158`. Distinguer les tests locaux, Canvas, DOM modélisé, navigateur, CI distante et essai humain. La sauvegarde reste v14 ; les 1 007 IDs, 21 onglets, statuts et 133 critères initiaux de Bible sont conservés.

## Habitants et berges de Nacre — 0.15.9

- La reprise conserve la 0.15.8 au commit local `95564d2`, ainsi que les cinq atlas civils déjà commencés. Elle ajoute deux nouveaux atlas de décor Nacre. Les sept atlas 0.15.9 ajoutent 58 cellules, dont 52 utilisées et six références. Total : 84 atlas / 644 cellules, 600 utilisées et 44 références, 18 lots ; les panoramas restent séparés. Préserver les PNG d'origine et leurs prompts.
- Les huit apparences de civils suivent les acteurs existants. Mara reste l'actrice `aval-mara`, `originalId: PN07`, `sourceMission: MI08`, hors rendu avant sa jonction. MI06 et MI07 gardent leurs contacts radio. Les variations d'ID ne rétablissent aucune identité perdue ; le personnel identifié garde le lot 0.15.8, le personnel sans originalId garde une apparence anonyme.
- Les personnes embarquées restent des indicateurs uniques de pont. Aucun corps persistant MI08 n'est ajouté. Seuls les résidents exposés MI06, munis de leur homeId, emploient les poses de perte du nouveau lot ; les six autres pertes restent références hors sélection runtime.
- Les historiques de marche reçoivent le temps simulé réel, même sous réduction des mouvements, afin de suivre le sens du déplacement. Ce réglage conserve la pose d'arrêt. Pause, pieds au sol et absence de mutation des dossiers sont reçus par le test de régression du véritable renderer.
- Le décor PL02 consomme terrainAt et les slots décoratifs existants. Les quatre matières sont projetées et fondues dans les coordonnées du monde. Les six décors n'ajoutent ni collision, ni objet de mission ; fleur de sel et algue ne simulent pas leurs interactions finales. Les surfaces des digues, portes, chenaux et rampes restent celles des missions.
- Recevoir `check:nacre-civilians` et `check:nacre-scenery`, puis les gates de construction/interface. Les nouvelles preuves finales sont dans `docs/validation/v0159-final/` ; garder intactes les premières scènes civiles retrouvées et les preuves 0.15.8. La sauvegarde reste v14, la campagne MI01–MI14, les 1 007 IDs/statuts et 133 critères initiaux de Bible restent conservés.


## Sols de Thyr/Kharon et particules — 0.15.10

- Six PNG originaux ajoutent 32 cellules utilisées : Thyr scenery 2/10, Kharon scenery 2/10, particules 2/12. Le total est 90 atlas /676 cellules, 632 utilisées /44 références, 21 lots ; les quatre panoramas restent séparés. Conserver les prompts, les rejets et les sorties Imagegen sélectionnées sans réencodage.
- Les sols PL03 et PL04 consomment terrainAt, des fenêtres de matière et des fondus attachés au monde. Aligner les limites de bandes sur les pixels de sortie évite les coutures à caméra fractionnaire ; ne pas déplacer les échantillons source, les surfaces physiques ou les états pour corriger un défaut de rasterisation.
- Les douze petits décors remplacent les slots existants. Aucune collision, population ou interaction écologique n'est ajoutée. FL10 et FL11 restent décoratives et conçues pour leurs capacités finales ; aucun flux de vapeur ou danger ne vient de la peinture. OP03 appartient à PL03 et ne reçoit pas le kit Kharon.
- Les six phases de chaque particule suivent 1-life/maxLife, sans boucle. Le renderer conserve l'alpha historique, le rayon, la position et l'expiration. L'ancrage mesure l'enveloppe utile à partir d'alpha 2/255 ; un clip limite le dessin au cercle historique. Les pixels de halo alpha 1/255 n'étirent pas la mesure et les PNG conservent tous leurs pixels ; l'indexeur ne retouche aucune image. La réduction des mouvements fixe age-0, sans changer la simulation. Aucun historique graphique n'entre dans le dossier v14.
- Les palettes personnalisées, types non pris en charge et images invalides gardent leur repli. Les fumées et poussières n'ajoutent aucun émetteur ni appel aléatoire. Les scénarios de réception utilisent de vrais pas et tirs par commandes publiques ; les planches isolées restent des diagnostics, pas des événements de mission.
- Recevoir check:thyr-scenery, check:kharon-scenery et check:particles, puis reconstruire les éditions autonome et web et exécuter les gates requis. Garder les preuves initiales, corrections et nouvelles réceptions dans leurs dossiers distincts. Canvas, DOM modélisé, navigateur et essai humain restent séparés ; les 1 007 IDs, 21 onglets, statuts et 133 critères initiaux de Bible sont conservés.

## Impacts, tir, purge et industrie de Vesper — 0.15.11

- Cinq PNG originaux ajoutent 24 cellules utilisées : impacts 2/12, effets du marcheur 2/10, industrie Vesper 1/2. Le catalogue atteint 95 atlas /700 cellules, 656 utilisées /44 références, 24 lots ; les quatre panoramas restent séparés. Conserver les originaux sélectionnés, prompts, éditions et rejets. Les indexeurs produisent seulement des métadonnées.
- Les étincelles suivent le segment de vitesse actuel, largeur 2 et extrémités rondes ; leur taille ne vient jamais de particle.size. Les petits éclats blast gardent le cercle de rayon size, distinct du rayon des dégâts. Six âges suivent la durée réelle, sans nouvel émetteur, matériau, appel aléatoire ni champ de sauvegarde. Palettes personnalisées et images invalides gardent leur repli.
- Le flash principal peint remplace seulement le cœur polygonal. Le halo procédural reste unique. La présence reste fireCooldown > .1 hors hangar, le pivot et les bouches 92/112/101 suivent le canon existant, et les quatre phases ne prolongent pas la fenêtre de tir des six châssis. Une roquette seule ne crée pas de flash principal. La réduction des mouvements fixe la cellule du flash.
- Les cinq bouffées de purge gardent le déclenchement venting ou heat >70, les phases, centres, rayons et alpha existants. Elles ne sont pas des objets s.particles. Le temps visuel reste zéro sous réduction des mouvements ; la pause conserve le temps simulé. Ne pas déplacer radiatorBounds pour aligner un effet.
- Les silos et cheminées décoratifs PL01 gardent parallaxe .32, espacement 620, hauteur déterministe et transformation parent. Leur dessin reste dans les enveloppes mesurées. L'atelier réutilise maintenance sans dupliquer ses fenêtres. Fumée industrielle, conduites et semelle restent existantes ; aucun bâtiment de simulation ou collider n'est créé.
- Recevoir check:particle-impacts, check:walker-fx et check:vesper-industry, puis les contrôles requis de construction et d'interface. Le reçu combiné des trois lots charge les 95 atlas et quatre panoramas ensemble. Les premières réceptions et corrections restent distinctes. La campagne reste MI01–MI14, le dossier v14, et les statuts de Bible ne sont pas promus par la seule disponibilité d'une image.

## Sentinelle S-3 pilotable — 0.15.12

- `PLAYABLE_WALKERS` (content.mjs) est la liste assignable : les six profils peints du lot 0.4 plus WK14. `WALKERS` reste la liste peinte et historique ; ne pas y ajouter WK14, les fixtures v1–v14 et le lot peint 0.15.3 dépendent de son ordre et de ses octets.
- WK14 possède `footOffsets: [-52, 52]` dans content.mjs. La simulation est seule autorité des contacts ; `SENTINELLE_RIG.offsets` doit rester identique, et le hangar suit `footOffsets` sans inventer de pose.
- La géométrie de WK14 vit dans `src/production-assets.mjs` (`SENTINELLE_RIG`, `sentinellePartGeometry`) et dans son propre lot `assets/production/sentinelle/` (34 fichiers, manifeste d'empreintes, six assemblages issus de contacts simulés). Ne pas réécrire le manifeste 0.9 ni ses 298 fichiers ; `tools/build-sentinelle-assets.mjs` ne touche que ce lot.
- Une sauvegarde antérieure conserve son parc exact : `validateCampaign` accepte les six conditions historiques et une condition WK14 optionnelle. WK14 entre au parc au premier déploiement (`beginCampaignMission`) avec une coque, deux appuis et un radiateur intacts ; le dossier reste v14 et aucun rapport, checkpoint ni fixture n'est réécrit.
- WK14 n'a pas d'atlas peint : le rendu emploie ses pièces vectorielles par châssis. Ne pas présenter ce repli comme une réception peinte ni promouvoir une fiche de Bible — aucun ID, onglet ou critère initial n'est ajouté.
- Preuves : `tests/sentinelle.test.mjs` (contacts, géométrie, lot, assignation, migration, sortie MI02 avec reçu WK14), puis `npm test`, `npm run check`, `npm run build`, `npm run check:ui`, `npm run check:ui-runtime` et `npm run check:offline-package`. Un test de DOM modélisé, un rendu Canvas et un essai navigateur restent des réceptions distinctes.

## Canon de la Continuité et épreuves de châssis — 0.16

- `docs/CANON_EMPIRE.md` est la référence du caractère dictatorial, sanguinaire et impitoyable de l'Empire d'Orthe. Il décrit la doctrine, le lexique officiel, les textes (DC-7, OC-12, DT-3, CB-3, R-44, instruction 27, règlement 61, circulaire 9-B), les neuf organes, la chaîne du crime, les lieux, les exécutants et les victimes. `data/bible.json` porte les fiches correspondantes (NA99–NA130, PN15–PN22, SY136–SY139, EN37–EN40, VI29–VI33).
- La représentation reste implicite : aucun symbole, uniforme ou nom d'un régime historique réel ; aucune torture montrée ; aucun charnier en spectacle ; aucune animalisation des victimes. La peur ne vient pas du tampon mais de la pièce : un document impérial doit avoir l'air écrit par quelqu'un qui veut que la ligne passe avant la relève, et aucun terme officiel n'est traduit dans la même réplique. Ne pas introduire d'imagerie réelle ni de contenu gratuit.
- Les victimes gardent leur agentivité : elles négocient, mentent, refusent, collaborent parfois. Ne pas les réduire à des objets de compassion ni à des récompenses morales pour Sera.
- `CT17–CT24` sont huit **épreuves de châssis** conçues, dont `CT21 — La paroi des Tisserands` (WK17, ascension verticale de 210 m, quatre appuis rayonnants, postures croix/plaque/rampe). Elles se débloquent après MI14 dans la conception mais ne sont ni implémentées ni jouables. Seul WK14 est pilotable ; les châssis WK13 et WK15–WK20 n'ont ni marche ni tir.
- MI15–MI32 restent **Conçu**. Leur détail enrichi ne les rend pas jouables et ne modifie ni le dossier v14, ni les fixtures, ni les statuts. Aucun ID existant n'est retiré : la source passe de 1 007 à 1 068 fiches, 20 onglets de conception (21 avec la synthèse).
- L'export `docs/ORDRE_DE_CENDRE_Bible.xlsx` n'a pas été reconstruit en 0.16 : `tools/build-bible.mjs` exige `@oai/artifact-tool`, absent de l'environnement. La source `data/bible.json` fait foi. Signaler l'écart, ne pas présenter l'export comme à jour, et ne pas régénérer les preuves historiques.
- Vérifications de la tranche : `npm run check` puis `npm test`. Aucun changement de code, de style ou d'asset : la reconstruction autonome n'est pas requise par cette tranche, mais un `npm run build` reste valable si un fichier embarqué change.
- Les textes de mission de `src/content.mjs` (briefing, description, feuille de décision et libellés d’options) se révisent sans invalider les sauvegardes : `validateGame` compare les champs mécaniques et les identifiants d’options, jamais la prose. Une correction de registre ne doit changer ni un nombre, ni une durée, ni une position, ni un identifiant ; les constats générés par les faits simulés restent la trace de ce qui a été exécuté.
