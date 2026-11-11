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

La reconstruction finale après les quatre corrections de libellés repasse les 174 IDs, 163 références et 66 parcours ; le [reçu UI final](validation/v10-ui-validation-final.json) identifie le nouvel HTML autonome et les modules inchangés.

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

**Réception native 0.10 partielle ; QA19 reste ouverte.** D puis D+Tab relâche le déplacement ; le bouton de pause reçoit le focus, Espace ouvre la pause et Entrée reprend explicitement. Dans l’instance déjà associée au contrôle du navigateur, D maintenu avec clic dans un autre onglet ou dans la barre d’adresse n’a pas produit la pause attendue. Dans une copie ouverte par le menu natif de Chrome et pilotée sans acquisition de son DOM, les deux gestes ont produit une pause visible. Le retour n’a pas repris la mission automatiquement ; la reprise a été explicitement demandée.

Cette différence de contexte ne démontre pas sa cause. Le tir maintenu pendant une perte de focus n’a pas été reçu. L’erreur de la façade d’inspection pour `document.hasFocus()` ne renseigne pas l’état interne de Chrome. Les observations contradictoires et les limites restent inscrites dans le [reçu natif](validation/native-v10/browser-reception.json).

## Réception dans Chrome

Les observations du 11 novembre 2026 portent sur la version publiée au commit `158a10f7e963f3f5effbb71fc3e8b4588d209d5a`, à l’adresse de production. La fenêtre native mesure **1363 × 1023 pixels**. Les quatre ajustements de libellés de la livraison finale sont contrôlés séparément ; ils ne changent aucun module de jeu.

| Parcours réellement exercé | Résultat et portée |
| --- | --- |
| Ancien export v8, migration puis export v9 avant de commencer MI09 | Version 8→9 et seul ajout du dossier Thyr vierge ; huit rapports, révision 148, ancien `stage:'complete'`, 38 lots et zéro carburant conservés. Comparaison intégrale des vrais exports. |
| Briefing à 125 % | Texte et bouton de déploiement accessibles par défilement natif. |
| Décision Thyr à 125 puis 150 % | Les deux choix sont lisibles ; le choix du verger a été activé dans l’interface depuis un checkpoint préparé. |
| HUD Thyr à 100 et 150 % | Objectifs, états des animaux et habitats, ressources du marcheur et commandes visibles dans la fenêtre déclarée. |
| Extraction et bilan à 150 % | Marche au clavier depuis le checkpoint avant extraction ; haut et bas du bilan atteints par défilement natif, puis retour au pont. Quatre animaux au verger, deux habitats utilisables, deux colonies revenues et transport arrivé. |
| Export après extraction, recharge de la page et nouvel export | Neuf rapports, dotation portée de 38 à 42 lots et résultat de Thyr persistants. Les deux exports sont identiques octet par octet ; aucune seconde dotation. |
| Journal et atelier après recharge | Relevé individuel de Thyr déplié, huit rapports antérieurs conservés et 42 lots affichés. Aucun achat effectué pendant ce contrôle. |

Les deux checkpoints de décision et d’avant extraction ont été obtenus auparavant par commandes publiques de simulation, puis importés par le sélecteur de fichier de l’application. La séquence native valide leurs reprises, les interactions indiquées, l’extraction et la persistance. **Elle ne représente pas une mission entière jouée par une personne.** Les anciens dossiers de Nacre restent des populations distinctes de Thyr.

**QA20 reste ouverte.** Les niveaux de zoom 100, 125 et 150 % ont été exercés, mais les commandes de réduction de fenêtre n’ont produit aucune diminution mesurée de la fenêtre native. La petite fenêtre réelle reste donc à recevoir ; cette absence de contrôle ne démontre pas un défaut de mise en page.

Le [reçu global](validation/native-v10/browser-reception.json), les [observations datées](validation/native-v10/native-observations.json), la [provenance des téléchargements](validation/native-v10/native-download-provenance.json) et la [comparaison des exports](validation/native-v10/native-export-verification.json) conservent les sources et la portée. Le vérificateur réussit **87 contrôles** sur les quatre exports de migration, de fin et de recharge ; le cinquième téléchargement conserve séparément la sortie en cours utilisée pour le focus. Certains fichiers temporaires de la première phase ont disparu ; leur absence est déclarée. Les captures finales conservées sont inventoriées avec leurs empreintes, séparément des observations restées uniquement dans la trace de session.

## Publication et intégrité

La première publication 0.10 a passé sa CI sur le commit exact : **356 tests Node, 66 parcours DOM modélisés et 40 comparaisons raster**, sous Node 22.23.4. Le déploiement Vercel a atteint l’état READY ; les 18 ressources contrôlées sur l’URL publique correspondent octet par octet au snapshot livré. Les reçus de cette première publication restent conservés. Le [dossier de déploiement](DEPLOYMENT.md) distingue ces résultats de ceux de la livraison finale.

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
