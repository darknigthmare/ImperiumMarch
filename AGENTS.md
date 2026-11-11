# ImperiumMarch — règles du projet

Le jeu s’appelle **ORDRE DE CENDRE**. Signature : **Chaque pas laisse une trace.** ImperiumMarch reste le nom du dépôt et le nom de code. Le projet appartient à Darknigthmare.

## Références de travail

- `data/bible.json` est la source des fiches de conception et du classeur. Garder les IDs stables.
- `docs/BIBLE_FR.md`, `docs/CAMPAIGN_FR.md` et `docs/ART_DIRECTION.md` développent le canon du projet.
- `src/content.mjs` décrit uniquement les données actuellement utilisées par le prototype.
- `src/campaign.mjs` gère les dossiers MI01–MI06, leur progression et la migration des sauvegardes v1/v2/v3/v4/v5 vers v6 ; les opérations OP01–OP03 restent indépendantes.
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
- MI01–MI06 sont jouables au stade prototype depuis les 0.2 à 0.7 ; les 26 autres missions restent conçues. Une relecture ne remplace pas le premier dossier ni ne redonne sa dotation.
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
