# Validation 0.10 — La route des vivants

La réception porte sur le prototype MI01–MI09, ses six châssis et ses trois opérations indépendantes. Elle distingue simulation, script d’interface, rendu, fichiers de conception et observation native. Les critères historiques restent conservés dans le registre de production ; un succès automatique ne clôt pas un essai humain ou matériel.

## Vérifications exécutées

| Famille | Résultat | Ce que la preuve établit |
| --- | --- | --- |
| Suite Node | 356 tests réussis | Règles, contenu, sauvegardes, collisions, médias et non-régression des missions précédentes. |
| Simulation MI09 | 28 tests | Six châssis × deux routes ; appuis réels, cadence, contournement, écoute, projecteurs, migrations, dégâts et échecs. |
| Campagne v9 | 34 tests | Migration native v8 exacte, huit rapports conservés, scènes et reçus cohérents, récompense unique, rejeux et refus de retours impossibles. |
| Script UI livré | 66 parcours | Menus, reprise, décision, résultat, archives, remappage, focus modélisé et manette synthétique. |
| Audit statique UI | 174 IDs uniques, 163 références littérales | Références résolues et script autonome compilable ; aucune requête de ressource non intégrée. |
| Géométrie SVG/Canvas | 40 comparaisons réussies | Cinq références précédentes et les 35 états Thyr, rasterisés à résolution identique ; seuil de recouvrement inchangé à 92 %. |
| Scènes Thyr | 22 images issues de 17 sorties gagnées | États atteints par commandes publiques, copie profonde à la capture, état inchangé par le rendu. |

Le journal Node conserve les empreintes des sources et indique qu’un texte UI a été modifié pendant la dernière exécution ; la simulation, le contenu, la campagne et leurs tests étaient stables. Les textes définitifs sont contrôlés par le gate UI et par la CI sur le commit publié.

Les chiffres des sous-suites sont inclus dans le total Node ; ils ne s’additionnent pas à celui-ci. Le pilotage automatisé utilise des commandes publiques et vise efficacement ; sa durée n’est pas une mesure de durée de partie humaine.

## Simulation et campagne

Les racines définissent les contacts des pieds par `livingRouteSurfaceAt`. La reconnaissance d’un contournement permet aux coques hautes de poursuivre ; le guidage local exige une écoute accomplie et un travail de balisage. La cadence des appuis peut affecter un support. Une colonne ou une racine perdue fait s’effondrer son habitat, sans transformer un décor en recensement humain.

Le choix conserve les positions du troupeau. La manœuvre de barrière prépare sa destination ; chaque animal doit ensuite atteindre sa destination ou être constaté perdu. Les tireurs deviennent actifs après cette résolution et la manœuvre de la barrière. Le transport doit être libéré, avancer sous escorte, survivre et atteindre le dépôt à la position 5500 avant la transmission du bilan. La perte du transport reste une défaite, y compris après export et réimportation.

Le validateur vérifie les objets, champs, identités, géométries, capacités, dégâts, destinations, temps minimaux de travail, états de mission et réconciliation du reçu. Il refuse des travaux déclarés achevés à temps zéro, des progressions partielles inactives, des sources changées et des conséquences inversées. Une décision prise sans avancer le temps interdit déjà de restaurer un ancien choix. Les pertes, destructions et traces d’appuis ne reculent pas avec un simple changement d’horloge.

La fixture v8 provient de deux exports réels Chrome de la 0.9. Son attestation compare les 889 blobs du snapshot public ; les sept fixtures antérieures conservent leurs octets. La migration modifie uniquement le numéro de version et ajoute `world.thyr.route` vide. Elle préserve même l’ancien `stage:'complete'`. La fonction de progression propose MI09 à partir du premier rapport manquant.

Preuves : `validation/v010-historic-v8.json`, `validation/v010-campaign-validation.json`, `validation/v010-campaign-tests.tap`, `validation/v10-node-tests.log`, `previews/mi09-render-manifest.json` et le contrat `CAMPAIGN_MISSION_09.md`.

## Commandes et focus

La base 0.9 isolée reproduit quatre régressions dans le DOM modélisé : une direction tenue survit au focus d’un bouton, une répétition réarme la touche après reprise, Tab garde la direction et la perte de capture du pointeur laisse le tir actif. Le correctif relâche les commandes et conserve l’activation native des boutons. Un cinquième parcours vérifie la pause remappée, sans reprise intempestive dans une page non focalisée.

Le modèle de DOM ne prouve pas la réception de ces événements par Chrome. La preuve `validation/v10-focus-modeled.json` garde explicitement cette limite. Les deux échecs natifs 0.9 ne sont ni effacés ni remplacés par ce test.

**Réception native 0.10 en cours de contrôle au moment de cette première publication.** Elle doit tester séparément D+Tab, D maintenu avec clic dans un autre onglet, D maintenu avec clic dans la barre d’adresse, retour sans reprise et reprise explicite. Un raccourci Ctrl+L ne remplace pas le clic dans la barre d’adresse. L’état final et l’export doivent être observés avant de clôturer QA19.

## Rendu et fichiers

Les 35 SVG Thyr et leurs deux planches partagent la géométrie du runtime. Les tests contrôlent chaque état, les empreintes, l’absence de nombres non finis et les bornes d’export pendant l’animation. La comparaison raster donne au SVG la même résolution que le dessin direct ; elle n’agrandit pas une petite image déjà rasterisée.

Les 22 vues ont révélé puis permis de corriger des encarts masquant les habitats, des débris suspendus et des destinations insuffisamment différenciées. Les cartes restent au centre supérieur, le HUD réserve ses zones latérales, les débris détruits sont au terrain et les destinations possèdent des repères aux coordonnées simulées.

La vérification du classeur et du registre est décrite dans `BIBLE_README.md` et `PRODUCTION_REGISTER_V10.md`. Une recalculation automatique du classeur ne constitue pas une interaction dans l’interface Excel ou Calc.

## Limites qui restent ouvertes

- MI10–MI32, les 16 contrats complets, la défection MI16 et les quatre familles de fins restent à produire.
- Les habitats de MI09 n’ont pas de liste nominative d’occupants. Aucun nom ni ancien habitant de Nacre n’y est attribué.
- FL08 ne filtre pas encore l’air et ne produit pas de toxicité d’incendie ; FL09 ne fournit pas encore un système de perception.
- La manette réelle, l’écoute humaine, les budgets sur matériel cible et les tests de compréhension par des joueurs restent des validations distinctes.
- QA13 et son recensement des 47 familles de l’opération Nacre, QA14 et son ordre de confrontation, QA26 et QA27 ne sont pas clôturés par l’ajout de MI09.
- Les anciennes observations, captures et conclusions 0.9 restent conservées. Les nouvelles preuves doivent être datées et rattachées aux sources réellement testées.
