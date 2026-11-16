# QA 0.15.3 — Les six marcheurs peints

## Périmètre

La tranche remplace les pièces visibles des six châssis jouables par des atlas peints articulés. Elle conserve les quatorze missions, trois opérations, six châssis et dossiers v14. **Aucun fichier de simulation n’est modifié.** Les PNG des deux lots antérieurs restent identiques ; leurs preuves historiques sont conservées.

Les résultats portent sur la reprise du **16 novembre 2026**. Le lot reste Prototype. La réception artistique finale, l’essai humain, les cycles finaux et les capacités spécialisées ne sont pas déduits d’un succès automatique.

## Contrôles reçus

| Contrôle | Résultat | Preuve |
| --- | --- | --- |
| Simulation et intégration | 706 tests réussis, zéro échec et zéro ignoré | [Journal](validation/release-v0153/node-tests.txt), [empreintes](validation/release-v0153/node-tests.json) |
| Catalogue | 1 007 fiches, 20 onglets de données, six châssis, trois opérations, 14 missions | [Journal](validation/release-v0153/project-check.txt) |
| Formes historiques SVG/Canvas | 174 cas reçus | [Journal](validation/release-v0153/assets-render.txt) |
| Pièces peintes des marcheurs | Six PNG, 96 cellules, 54 poses et 19 vues Canvas | [Reçu](validation/painted-walkers-v0153/receipt.json) |
| Atelier peint conservé | Huit PNG, 54 cellules, 33 états isolés et 14 scènes | [Reçu ciblé](validation/painted-mi14-v0153/receipt.json) |
| Combat peint conservé | Neuf PNG, 78 cellules, un banc et cinq scènes | [Reçu ciblé](validation/painted-combat-v0153/receipt.json) |
| Interface statique et autonome | 213 IDs, 185 références, cinq vues, quatre archives, six dialogues | [Journal](validation/release-v0153/check-ui.txt) |
| Parcours du DOM modélisé | 108 parcours réussis | [Journal](validation/release-v0153/check-ui-runtime.txt) |
| Construction autonome | 58,74 Mio, 39 modules, ressources intégrées | [Journal](validation/release-v0153/build-offline.txt) |
| Construction web | Modules, styles et assets copiés dans web-dist | [Journal](validation/release-v0153/build-web.txt) |
| Bible | 21 onglets, 126 formules, aucune erreur, 18 fiches enrichies sans changement de statut | [Réception Bible](BIBLE_V15_3.md) |

Les neuf groupes de tests dédiés couvrent les points suivants : correspondance des pixels source avec les pivots, extrémités de segments, contact et cheville ; conservation de l’ordre de profondeur et du radiateur ; canons orientés dans plusieurs directions ; tirs publics des six châssis dans les deux sens avec leur dispersion existante ; sélection des états ; échec, annulation et reprise vectorielle ; exclusion du boss Cerbère et des composants étrangers ; hangar et scènes complètes sans mutation ; restauration du contexte après une erreur de dessin.

## Réception des originaux et du rig

Les six originaux sont réellement décodés par le moteur Canvas de test. Ils mesurent chacun **1 254 × 1 254 pixels** en RGBA. La transparence, l’occupation des 96 rectangles et l’absence de silhouette opaque sur les frontières de cellules sont contrôlées. Les PNG ne sont ni retouchés ni redimensionnés. Les empreintes et les mesures figurent dans le [manifeste](../assets/painted/walkers/manifest.json) et le [reçu](validation/painted-walkers-v0153/receipt.json).

Le rectangle de dessin n’est pas le pivot. Pour les membres et les canons, le layout garde les deux points mesurés et la petite correction de rotation qui les aligne sur leur axe mécanique. Pour les pieds, l’ancre est la projection verticale de la cheville sur la semelle ; les chaussures asymétriques ne sont pas recentrées sur leur alpha. La cheville se résout à `[0,-8]`, le contact à `[0,0]`.

Le contrôle mesure aussi des pixels visibles : l’extrémité opaque du canon doit rester à moins de 2,5 unités de sa bouche physique, et le bas de la semelle à moins de 1,5 unité du plan de contact. Ces tolérances reçoivent les franges et les embouts ; elles ne constituent pas une certification artistique.

La première inspection a révélé que les anciennes sous-couches vectorielles épaisses doublaient les jambes peintes. Elles sont maintenant réservées au repli vectoriel. Les vrais vérins continuent à suivre le rig. Le capot inférieur peint est limité au plan distal de la cheville ; le récepteur du pied couvre cette liaison et les pixels ne débordent plus au-delà de ce plan mécanique.

Les membres lointains restent opaques avec une luminosité à 70 %. Le filtre est restauré après chaque pièce, y compris après une erreur. Le canon garde son dessus lisible quand il vise à gauche, sans déplacer son axe. Son pivot reste indépendant du retournement de coque.

## Vues et états examinés

Le [banc des six châssis](validation/painted-walkers-v0153/walkers-common-scale.png) emploie le chemin normal `drawWalker` et le radiateur, à **1,55 pixel par unité**, sur un terrain commun provenant des états initiaux publics. Les hanches, genoux et contacts suivent ces états ; leur disposition sur la planche sert la comparaison.

Chaque châssis possède une planche de neuf vues : repos, recul, visée haute, visée basse à gauche, ancrage, transfert d’appui, avarie, radiateur réparé et réparation à 50 %. Les six premières viennent de commandes publiques de simulation. Les trois dernières sont **des copies de diagnostic** avec valeurs de santé ou de réparation imposées ; elles ne prétendent pas être des dégâts obtenus pendant une partie.

Les six scènes intégrées emploient MI01, MI05, MI09 et MI14 après 180 pas publics de déplacement. Elles chargent les **23 atlas** du jeu, y compris les deux lots antérieurs. Six vues du hangar utilisent le renderer ordinaire au temps zéro. L’ensemble compte donc **19 images : un banc, six planches de poses, six scènes et six hangars**. Les 54 poses appartiennent aux six planches ; elles ne s’ajoutent pas au nombre de fichiers.

Le [reçu](validation/painted-walkers-v0153/receipt.json) garde les hashes des sources, les positions des pieds, les états, les rectangles et les empreintes d’images. Il vérifie qu’aucun dessin ne change les données du jeu.

Les deux nouvelles réceptions ciblées du combat et de l’atelier gardent leurs scripts propres. Elles contrôlent leurs PNG dans le renderer courant, avec repli vectoriel des marcheurs puisque ces scripts ne chargent pas leur nouvel atlas. Les scènes de `check:walkers` fournissent la réception de l’assemblage complet. Aucun ancien reçu n’est réécrit pour lui attribuer les nouveaux sprites.

## États et limites conservés

Les 96 cellules sont des **pièces et états de six machines existantes**. Les variations lointaines sont produites au rendu. Les hanches et genoux n’ont pas d’images d’avarie dédiées ; les mêmes capots sont conservés.

Le radiateur emploie ses images intacte, endommagée et réparée pour ses états statiques. L’état touché et la réparation progressive gardent leur repli vectoriel, notamment les ailettes et la progression existantes. La boîte vulnérable ne grandit pas. Le boss Cerbère n’hérite pas d’un atlas jouable parce qu’un ID est absent.

Les cycles complets AS06–AS09, les changements de hauteur, le Pèlerin à cinq appuis, le secours spécialisé de l’Arpenteur, les tunnels et le déminage du Cloporte restent ouverts. Les six autres châssis ne deviennent pas jouables. Aucun critère humain de Bible n’est clos par cette réception.

## Navigateur

Les contrôles Canvas, le DOM modélisé et l’analyse statique gardent leur portée propre. Le blocage de lancement du Chromium local consigné en 0.15.2 reste historique ; cette tranche ne relance pas ce chemin bloqué. Le reçu local de prépublication conserve `nativeBrowserExecuted:false` : l’observation suivante est une preuve ultérieure distincte.

Après le passage READY de la production sur `259351ed8fd460b040097c266fb32a82543723d2`, **Chrome partagé** a chargé le site public et son pied de page **0.15.3**. Le [reçu natif](validation/native-v0153/receipt.json) conserve douze JPEG originaux, leurs empreintes et dix relevés d’accessibilité. Les six sélections du hangar ont été examinées : Vigie, Caracal, Bastion, Arpenteur, Pèlerin et Cloporte apparaissent avec leurs pièces peintes, sans rectangle opaque autour de leurs silhouettes.

L’Arpenteur a ensuite été assigné puis déployé depuis le briefing de **Simulation 02 — Le dernier bac**. Les entrées droite et gauche produisent des poses différentes et un retournement visible ; le convoi passe de « vous attend » à « en mouvement », avec une progression affichée de 3 à 5 %. Le changement de visée, le dialogue de pause, la reprise et le retour en pause sont observés. La [vue après reprise](validation/native-v0153/14-simulation-resumed.jpg) montre les sprites du marcheur, du convoi et des combattants dans le navigateur.

L’essai est court : l’horloge du jeu affiche 00:01. Les durées de touches demandées ne sont pas des mesures de temps effectivement joué ou de fluidité. Un clic change la visée, mais le magasin reste à 12/12 : **aucun tir réussi n’est revendiqué**. Aucun objectif final, import ou remise à zéro de sauvegarde, contrôle mobile, manette physique ou essai humain n’est reçu. Deux captures de transition, où le compositeur montre encore l’écran précédent, sont écartées de la preuve visuelle. L’échantillon limité de console contient vingt erreurs de métadonnées d’une extension du navigateur ; aucune conclusion exhaustive sur les erreurs applicatives n’en est déduite.

Les CI de la PR et de `main` ont également réussi sous Node 22.23.4. Le [reçu de publication](validation/v0153-publication.json) et le [suivi de déploiement](DEPLOYMENT.md) les rattachent à l’arbre livré ; ils ne transforment pas les 108 parcours de DOM modélisé en parcours Chrome.

## Reproduction

```sh
python tools/index-painted-walkers.py
npm test
npm run build
npm run check
npm run check:ui
npm run check:ui-runtime
npm run check:assets-render
node tools/test-painted-walkers.mjs ../outputs/painted-walkers-qa
node tools/test-painted-sprites.mjs ../outputs/painted-mi14-qa
node tools/test-painted-combat.mjs ../outputs/painted-combat-qa
npm run build:web
```

Les contrôles raster demandent les dépendances de développement Canvas. Les originaux et la génération ne sont pas requis pour jouer : toutes les images sont intégrées à l’édition autonome. Employer de nouveaux dossiers pour les futures preuves. Le suivi de GitHub, de la CI et de Vercel figure dans [DEPLOYMENT.md](DEPLOYMENT.md).
