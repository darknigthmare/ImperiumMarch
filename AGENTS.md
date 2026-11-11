# ImperiumMarch — règles du projet

Le jeu s’appelle **ORDRE DE CENDRE**. Signature : **Chaque pas laisse une trace.** ImperiumMarch reste le nom du dépôt et le nom de code. Le projet appartient à Darknigthmare.

## Références de travail

- `data/bible.json` est la source des fiches de conception et du classeur. Garder les IDs stables.
- `docs/BIBLE_FR.md`, `docs/CAMPAIGN_FR.md` et `docs/ART_DIRECTION.md` développent le canon du projet.
- `src/content.mjs` décrit uniquement les données actuellement utilisées par le prototype.
- `src/campaign.mjs` gère les dossiers MI01–MI10, leur progression et la migration des sauvegardes v1/v2/v3/v4/v5/v6/v7/v8/v9 vers v10 ; les opérations OP01–OP03 restent indépendantes.
- L’onglet Prototype précise la différence entre le comportement actuel et le comportement final conçu.

## Développement

- La simulation dans `src/simulation.mjs` reste sans DOM, testable et déterministe à graine/entrées identiques.
- Les contacts de pieds et les collisions viennent de la simulation ; le rendu ne doit pas les inventer indépendamment.
- Préserver les contrôles AZERTY/QWERTY, la pause, les états victoire/défaite et l’absence de requêtes réseau dans le jeu autonome.
- Reconstruire `dist/Ordre_de_Cendre.html` après tout changement de code, de style ou d’asset : `npm run build`.
- Après modification d’une règle de gameplay : `npm test`. Après changement du contenu ou de livraison : `npm run check`. Après reconstruction autonome : `npm run check:ui`.
- Après modification des transitions UI/campagne : reconstruire puis lancer `npm run check:ui-runtime`. Ce test exécute les gestionnaires dans un modèle de DOM, pas dans un navigateur. La suite optionnelle `npm run test:browser` reste séparée.
- Le classeur se reconstruit avec `tools/build-bible.mjs` selon `docs/BIBLE_README.md`. Employer le skill Spreadsheets lorsqu’il est disponible.

## Vérité de livraison

- Ne pas marquer une fiche finie parce qu’une description existe. Conçu, Prototype et Vérifié décrivent des niveaux différents.
- Les trois opérations de prototype ne sont pas les 32 missions de la campagne finale.
- MI01–MI10 sont jouables au stade prototype depuis les 0.2 à 0.11 ; les 22 autres missions restent conçues. Une relecture ne remplace pas le premier dossier ni ne redonne sa dotation.
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
- Le nouveau reçu MI08 conserve sa liste de personnes et de bateaux. Départ historique, arrivée au refuge, accueil local et perte restent distincts. Le choix `delay` est autorisé uniquement dans MI08.
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
